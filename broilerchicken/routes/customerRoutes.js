const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.get("/dashboard/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const stats = await pool.query(
      "SELECT * FROM customer_dashboard_view WHERE customer_id = $1",
      [customerId]
    );

    const batches = await pool.query(
      "SELECT * FROM available_chickens_view ORDER BY batch_id LIMIT 3"
    );

    // Recent orders table
    const orders = await pool.query(
      `
      SELECT
          o.order_id,
          o.order_date,
          o.requested_delivery_date,
          o.requested_quantity,
          o.order_status,
          o.delivery_type,

          COALESCE(
            s.total_amount,
            o.requested_quantity * COALESCE(b.avg_weight_kg, 0) * COALESCE(b.price_per_kg, 0)
          ) AS total_amount,

          COALESCE(p.payment_status, 'Pending') AS payment_status,

          COALESCE(d.delivery_status, 'Not Assigned') AS delivery_status,
          d.delivery_date,
          d.assigned_at,
          d.out_for_delivery_at,
          d.completed_at,
          d.delivery_address,

          COALESCE(u.full_name, 'Not assigned') AS driver_name,
          COALESCE(u.vehicle_no, '—') AS vehicle_no

      FROM orders o
      LEFT JOIN batch b ON o.batch_id = b.batch_id
      LEFT JOIN sales s ON o.order_id = s.order_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      LEFT JOIN delivery d ON s.sales_id = d.sales_id
      LEFT JOIN app_user u ON d.user_id = u.user_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC, o.order_id DESC
      LIMIT 5
      `,
      [customerId]
    );

    // Main active delivery for dashboard tracking
    const activeDelivery = await pool.query(
      `
      SELECT
          o.order_id,
          o.order_date,
          o.requested_delivery_date,
          o.requested_quantity,
          o.order_status,
          o.delivery_type,

          COALESCE(
            s.total_amount,
            o.requested_quantity * COALESCE(b.avg_weight_kg, 0) * COALESCE(b.price_per_kg, 0)
          ) AS total_amount,

          COALESCE(p.payment_status, 'Pending') AS payment_status,

          COALESCE(d.delivery_status, 'Not Assigned') AS delivery_status,
          d.delivery_date,
          d.assigned_at,
          d.out_for_delivery_at,
          d.completed_at,
          d.delivery_address,

          COALESCE(u.full_name, 'Not assigned') AS driver_name,
          COALESCE(u.vehicle_no, '—') AS vehicle_no

      FROM orders o
      LEFT JOIN batch b ON o.batch_id = b.batch_id
      LEFT JOIN sales s ON o.order_id = s.order_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      LEFT JOIN delivery d ON s.sales_id = d.sales_id
      LEFT JOIN app_user u ON d.user_id = u.user_id
      WHERE o.customer_id = $1
        AND LOWER(COALESCE(o.delivery_type, '')) = 'delivery'
        AND o.order_status NOT IN ('Cancelled', 'Completed')
      ORDER BY
        CASE
          WHEN LOWER(COALESCE(d.delivery_status, 'not assigned')) IN ('out for delivery', 'out of delivery') THEN 1
          WHEN LOWER(COALESCE(d.delivery_status, 'not assigned')) = 'assigned' THEN 2
          WHEN LOWER(COALESCE(d.delivery_status, 'not assigned')) = 'not assigned' THEN 3
          ELSE 4
        END,
        COALESCE(d.delivery_date, o.requested_delivery_date, o.order_date) ASC,
        o.order_id DESC
      LIMIT 1
      `,
      [customerId]
    );

    res.json({
      stats: stats.rows[0] || {
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        total_spent: 0,
      },
      batches: batches.rows,
      orders: orders.rows,
      active_delivery: activeDelivery.rows[0] || null,
    });
  } catch (err) {
    console.error("Customer dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/place-order-data/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await pool.query(
      `SELECT c.customer_id, c.address, c.area, u.full_name
       FROM customer c
       JOIN app_user u ON c.user_id = u.user_id
       WHERE c.customer_id = $1`,
      [customerId]
    );

  const batches = await pool.query(
    `
    SELECT
        b.batch_id,
        b.notes,
        b.total_chicks,
        b.avg_weight_kg,
        b.price_per_kg,
        b.batch_status,

        COALESCE(pending.pending_quantity, 0)::INT AS pending_reserved,

        GREATEST(
          b.total_chicks - COALESCE(pending.pending_quantity, 0),
          0
        )::INT AS available_stock

    FROM batch b
    LEFT JOIN (
        SELECT
            batch_id,
            SUM(requested_quantity)::INT AS pending_quantity
        FROM orders
        WHERE order_status = 'Pending'
        GROUP BY batch_id
    ) pending
        ON pending.batch_id = b.batch_id

    WHERE b.batch_status = 'Ready for Sale'
      AND b.total_chicks > 0
      AND b.avg_weight_kg IS NOT NULL
      AND b.price_per_kg IS NOT NULL

    ORDER BY b.batch_id
    `
  );
    res.json({
      customer: customer.rows[0],
      batches: batches.rows,
    });
  } catch (err) {
    console.error("Place order data error:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customer_id,
      batch_id,
      quantity,
      delivery_type,
      start_date,
      is_recurring,
      recurring_frequency,
      recurring_duration_months,
    } = req.body;

    if (!customer_id || !batch_id || !quantity || !start_date) {
      return res.status(400).json({
        message: "Missing required order information.",
      });
    }

    if (Number(quantity) < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1 chicken.",
      });
    }

    await client.query("BEGIN");

    // 1. Lock the selected batch
    const batchResult = await client.query(
      `
      SELECT batch_id, total_chicks
      FROM batch
      WHERE batch_id = $1
        AND batch_status = 'Ready for Sale'
      FOR UPDATE
      `,
      [batch_id]
    );

    if (batchResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Batch not found or not ready for sale.",
      });
    }

    // 2. Check pending reserved quantity
    const pendingResult = await client.query(
      `
      SELECT COALESCE(SUM(requested_quantity), 0)::INT AS pending_reserved
      FROM orders
      WHERE batch_id = $1
        AND order_status = 'Pending'
      `,
      [batch_id]
    );

    const realStock = Number(batchResult.rows[0].total_chicks || 0);
    const pendingReserved = Number(pendingResult.rows[0].pending_reserved || 0);
    const availableStock = realStock - pendingReserved;

    // 3. Build order dates
    const orderDates = [];
    const firstDate = new Date(start_date);

    if (is_recurring) {
      const months = Number(recurring_duration_months || 1);
      const endDate = new Date(firstDate);
      endDate.setMonth(endDate.getMonth() + months);

      let currentDate = new Date(firstDate);

      while (currentDate < endDate) {
        orderDates.push(new Date(currentDate));

        if (recurring_frequency === "Weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
    } else {
      orderDates.push(firstDate);
    }

    const requestedNow = Number(quantity);

    if (requestedNow > availableStock) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Not enough available stock. Current available stock is ${availableStock} chickens.`,
      });
    }

    // 5. Insert pending order/orders
    const insertedOrders = [];
    let parentOrderId = null;

    for (let i = 0; i < orderDates.length; i++) {
      const todayDate = new Date().toISOString().split("T")[0];

      const orderStatus = is_recurring && i > 0 ? "Scheduled" : "Pending";

      const result = await client.query(
        `
        INSERT INTO orders
        (
          order_date,
          order_status,
          requested_quantity,
          customer_id,
          batch_id,
          delivery_type,
          requested_delivery_date,
          is_recurring,
          recurring_frequency,
          recurring_duration_months,
          parent_order_id
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
        `,
        [
          todayDate,
          orderStatus,
          Number(quantity),
          customer_id,
          batch_id,
          delivery_type,
          orderDates[i],
          is_recurring,
          is_recurring ? recurring_frequency : null,
          is_recurring ? recurring_duration_months : null,
          parentOrderId,
        ]
      );

      if (i === 0) {
        parentOrderId = result.rows[0].order_id;
      }

      insertedOrders.push(result.rows[0]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order submitted successfully.",
      orders: insertedOrders,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Place order error:", err);
    res.status(500).json({
      message: "Failed to submit order.",
      error: err.message,
    });
  } finally {
    client.release();
  }
});
router.get("/orders/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `SELECT
        o.order_id,
        TO_CHAR(o.order_date, 'YYYY-MM-DD') AS order_date,
        o.batch_id,
        o.requested_quantity,
        o.order_status,
        o.delivery_type,
        TO_CHAR(o.requested_delivery_date, 'YYYY-MM-DD') AS requested_delivery_date,
        COALESCE(b.avg_weight_kg, 0) AS avg_weight_kg,
        COALESCE(b.price_per_kg, 0) AS price_per_kg,
        COALESCE(
          s.total_amount,
          o.requested_quantity * COALESCE(b.avg_weight_kg, 0) * COALESCE(b.price_per_kg, 0)
        ) AS total_amount,
        COALESCE(p.payment_status, 'Pending') AS payment_status,
        COALESCE(d.delivery_status, 'Not Assigned') AS delivery_status,
        COALESCE(d.delivery_address, c.address) AS delivery_address,
        COALESCE(u.full_name, 'Not assigned') AS driver_name,
        COALESCE(u.vehicle_no, '—') AS vehicle_no
            FROM orders o
      LEFT JOIN batch b ON o.batch_id = b.batch_id
      LEFT JOIN sales s ON o.order_id = s.order_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      LEFT JOIN delivery d ON s.sales_id = d.sales_id
      LEFT JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN app_user u ON d.user_id = u.user_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC, o.order_id DESC`,
      [customerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Customer orders error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/orders/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customer_id } = req.body;

    const result = await pool.query(
      `UPDATE orders
       SET order_status = 'Cancelled'
       WHERE order_id = $1
       AND customer_id = $2
       AND order_status = 'Pending'
       RETURNING *`,
      [orderId, customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Only pending orders can be cancelled.",
      });
    }

    res.json({
      message: "Order cancelled successfully.",
      order: result.rows[0],
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/unpaid-orders/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `SELECT 
        o.order_id,
        o.order_date,
        o.batch_id,
        o.requested_quantity,
        o.order_status,
        o.delivery_type,
        COALESCE(b.avg_weight_kg, 0) AS avg_weight_kg,
        COALESCE(b.price_per_kg, 0) AS price_per_kg,
        COALESCE(s.total_amount, 
          o.requested_quantity * COALESCE(b.avg_weight_kg, 0) * COALESCE(b.price_per_kg, 0)
        ) AS total_amount
       FROM orders o
       LEFT JOIN batch b ON o.batch_id = b.batch_id
       LEFT JOIN sales s ON o.order_id = s.order_id
       LEFT JOIN payment p ON o.order_id = p.order_id
       WHERE o.customer_id = $1
       AND o.order_status = 'Approved'
       AND (p.payment_status IS NULL OR p.payment_status != 'Paid')
       ORDER BY o.order_date DESC`,
      [customerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Unpaid orders error:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { order_id, amount, payment_method } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card", "grabpay"],

      line_items: [
        {
          price_data: {
            currency: "myr",
            product_data: {
              name: `AyamTech Order ${order_id}`,
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `http://localhost:5173/customer/payments?success=true&order_id=${order_id}&method=${payment_method}&amount=${amount}`,
      cancel_url: `http://localhost:5173/customer/payments?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/confirm-payment", async (req, res) => {
  try {
    const { order_id } = req.body;

    const orderAmount = await pool.query(
      `SELECT 
        (COALESCE(s.total_amount,
        o.requested_quantity * COALESCE(b.avg_weight_kg, 0) * COALESCE(b.price_per_kg, 0)) + CASE
          WHEN LOWER(COALESCE(o.delivery_type, '')) = 'delivery'
          THEN 25
          ELSE 0
        END
      ) AS amount
       FROM orders o
       LEFT JOIN batch b ON o.batch_id = b.batch_id
       LEFT JOIN sales s ON o.order_id = s.order_id
       WHERE o.order_id = $1`,
      [order_id]
    );

    if (orderAmount.rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const amount = Number(req.body.amount || orderAmount.rows[0].amount);

    const existingPayment = await pool.query(
      `SELECT payment_id 
      FROM payment 
      WHERE order_id = $1 
      AND payment_status = 'Paid'`,
      [order_id]
    );

    if (existingPayment.rows.length > 0) {
      return res.json({
        message: "Payment already confirmed.",
        payment: existingPayment.rows[0],
      });
    } 

    const result = await pool.query(
      `INSERT INTO payment
      (order_id, payment_date, payment_amount, payment_method, payment_status, transaction_reference)
      VALUES ($1, NOW(), $2, $3, 'Paid', 'STRIPE-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'))
      ON CONFLICT (order_id) WHERE payment_status = 'Paid'
      DO NOTHING
      RETURNING *`,
      [order_id, amount, req.body.payment_method || "Card"]
    );

    res.json({ message: "Payment confirmed successfully", payment: result.rows[0] });
  } catch (err) {
    console.error("Confirm payment error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/purchase-history/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `SELECT
        o.order_id,
        TO_CHAR(o.order_date, 'YYYY-MM-DD') AS order_date,
        o.batch_id,
        o.requested_quantity,
        o.delivery_type,
        COALESCE(b.avg_weight_kg, 0) AS avg_weight_kg,
        COALESCE(b.price_per_kg, 0) AS price_per_kg,
        COALESCE(s.total_amount,
          o.requested_quantity * COALESCE(b.avg_weight_kg, 0) * COALESCE(b.price_per_kg, 0)
        ) AS chicken_amount,
        CASE 
          WHEN LOWER(COALESCE(o.delivery_type, '')) = 'delivery' THEN 25 
          ELSE 0 
        END AS delivery_fee,
        COALESCE(p.payment_amount, 0) AS total_amount,
        COALESCE(p.payment_method, '-') AS payment_method,
        p.payment_id,
        COALESCE(d.delivery_status, 'Not Assigned') AS delivery_status
      FROM orders o
      LEFT JOIN batch b ON o.batch_id = b.batch_id
      LEFT JOIN sales s ON o.order_id = s.order_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      LEFT JOIN delivery d ON s.sales_id = d.sales_id
      WHERE o.customer_id = $1
      AND p.payment_status = 'Paid'
      AND (
        o.order_status = 'Completed'
        OR COALESCE(d.delivery_status, '') = 'Completed'
      )
      ORDER BY o.order_date DESC, o.order_id DESC`,
      [customerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Purchase history error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/profile/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `SELECT 
        c.customer_id,
        c.address,
        c.area,
        u.user_id,
        u.full_name,
        u.username,
        u.email,
        u.phone_no,
        u.status,
        u.role
      FROM customer c
      JOIN app_user u ON c.user_id = u.user_id
      WHERE c.customer_id = $1`,
      [customerId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/profile/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { email, phone_no, address, area } = req.body;

    const userResult = await pool.query(
      `SELECT user_id FROM customer WHERE customer_id = $1`,
      [customerId]
    );

    const userId = userResult.rows[0].user_id;

    await pool.query(
      `UPDATE app_user
       SET email = $1, phone_no = $2
       WHERE user_id = $3`,
      [email, phone_no, userId]
    );

    await pool.query(
      `UPDATE customer
       SET address = $1, area = $2
       WHERE customer_id = $3`,
      [address, area, customerId]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/profile/:customerId/change-password", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { newPassword } = req.body;

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userResult = await pool.query(
      `SELECT user_id FROM customer WHERE customer_id = $1`,
      [customerId]
    );

    const userId = userResult.rows[0].user_id;

    await pool.query(
      `UPDATE app_user
       SET password = $1
       WHERE user_id = $2`,
      [hashedPassword, userId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
});
// PATCH /api/customer/orders/:orderId/inform-staff
router.patch("/orders/:orderId/inform-staff", async (req, res) => {
  const { orderId } = req.params;
  const { customer_id } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE orders
      SET order_status = 'Customer Arrived'
      WHERE order_id = $1
        AND customer_id = $2
        AND delivery_type = 'Pickup'
        AND order_status = 'Ready for Pickup'
      RETURNING *
      `,
      [orderId, customer_id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message:
          "Unable to inform staff. This order may not be ready for pickup or does not belong to this customer.",
      });
    }

    res.json({
      message: "Farm staff has been informed that you have arrived.",
      order: result.rows[0],
    });
  } catch (err) {
    console.error("Inform staff error:", err);
    res.status(500).json({
      message: "Failed to inform farm staff.",
      error: err.message,
    });
  }
});

module.exports = router;