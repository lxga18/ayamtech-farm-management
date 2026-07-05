const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const PDFDocument = require('pdfkit');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

router.get("/dashboard-summary", async (req, res) => {
  try {
    const range = req.query.range || "all";

    const rangeStartMap = {
      today: "CURRENT_DATE",
      this_week: "date_trunc('week', CURRENT_DATE)::date",
      this_month: "date_trunc('month', CURRENT_DATE)::date",
      this_year: "date_trunc('year', CURRENT_DATE)::date",
      last_30_days: "(CURRENT_DATE - INTERVAL '30 days')::date",
      last_12_months: "(CURRENT_DATE - INTERVAL '12 months')::date",
    };

    const startSql = rangeStartMap[range] || null;

    const cond = (alias, column) => {
      return startSql ? `AND ${alias}.${column} >= ${startSql}` : "";
    };

    const where = (alias, column) => {
      return startSql ? `WHERE ${alias}.${column} >= ${startSql}` : "";
    };

    const startMonthSql = startSql
      ? `date_trunc('month', ${startSql})`
      : `(SELECT date_trunc('month', COALESCE(MIN(sales_date), CURRENT_DATE)) FROM sales)`;

    const kpis = await pool.query(`
      SELECT
        COALESCE((
          SELECT SUM(s.total_amount)
          FROM sales s
          JOIN batch b ON s.batch_id = b.batch_id
          WHERE b.batch_status = 'Sold'
          ${cond("s", "sales_date")}
        ), 0) AS total_revenue,

        COALESCE((
          SELECT SUM(cp.total_price)
          FROM chick_purchase cp
          JOIN batch b ON cp.batch_id = b.batch_id
          WHERE b.batch_status = 'Sold'
          ${cond("cp", "purchase_date")}
        ), 0) AS chick_cost,

        COALESCE((
          SELECT SUM(f.cost)
          FROM feed_usage f
          JOIN batch b ON f.batch_id = b.batch_id
          WHERE b.batch_status = 'Sold'
          ${cond("f", "usage_date")}
        ), 0) AS feed_cost,

        COALESCE((
          SELECT SUM(m.cost)
          FROM medication_record m
          JOIN batch b ON m.batch_id = b.batch_id
          WHERE b.batch_status = 'Sold'
          ${cond("m", "medication_date")}
        ), 0) AS medication_cost,

        COALESCE((
          SELECT SUM(mr.quantity_dead * 15)
          FROM mortality_record mr
          JOIN batch b ON mr.batch_id = b.batch_id
          WHERE b.batch_status = 'Sold'
          ${cond("mr", "mortality_date")}
        ), 0) AS mortality_loss
    `);

    const k = kpis.rows[0];

    const totalRevenue = Number(k.total_revenue || 0);
    const chickCost = Number(k.chick_cost || 0);
    const feedCost = Number(k.feed_cost || 0);
    const medicationCost = Number(k.medication_cost || 0);
    const mortalityLoss = Number(k.mortality_loss || 0);
    const totalCost = chickCost + feedCost + medicationCost + mortalityLoss;
    const netProfit = totalRevenue - totalCost;

    kpis.rows[0] = {
      ...k,
      total_cost: totalCost,
      net_profit: netProfit,
    };

    const monthlyProfit = await pool.query(`
      WITH months AS (
        SELECT generate_series(
          ${startMonthSql},
          date_trunc('month', CURRENT_DATE),
          interval '1 month'
        )::date AS month_start
      )

      SELECT
        TO_CHAR(m.month_start, 'Mon YYYY') AS month,

        COALESCE(r.revenue, 0) AS revenue,

        COALESCE(c.chick_cost, 0)
        + COALESCE(f.feed_cost, 0)
        + COALESCE(md.medication_cost, 0)
        + COALESCE(mt.mortality_loss, 0) AS cost,

        COALESCE(r.revenue, 0)
        - (
          COALESCE(c.chick_cost, 0)
          + COALESCE(f.feed_cost, 0)
          + COALESCE(md.medication_cost, 0)
          + COALESCE(mt.mortality_loss, 0)
        ) AS profit

      FROM months m

      LEFT JOIN (
        SELECT date_trunc('month', s.sales_date)::date AS month_start, SUM(s.total_amount) AS revenue
        FROM sales s
        JOIN batch b ON s.batch_id = b.batch_id
        WHERE b.batch_status = 'Sold'
        ${cond("s", "sales_date")}
        GROUP BY date_trunc('month', s.sales_date)::date
      ) r ON m.month_start = r.month_start

      LEFT JOIN (
        SELECT date_trunc('month', cp.purchase_date)::date AS month_start, SUM(cp.total_price) AS chick_cost
        FROM chick_purchase cp
        JOIN batch b ON cp.batch_id = b.batch_id
        WHERE b.batch_status = 'Sold'
        ${cond("cp", "purchase_date")}
        GROUP BY date_trunc('month', cp.purchase_date)::date
      ) c ON m.month_start = c.month_start

      LEFT JOIN (
        SELECT date_trunc('month', f.usage_date)::date AS month_start, SUM(f.cost) AS feed_cost
        FROM feed_usage f
        JOIN batch b ON f.batch_id = b.batch_id
        WHERE b.batch_status = 'Sold'
        ${cond("f", "usage_date")}
        GROUP BY date_trunc('month', f.usage_date)::date
      ) f ON m.month_start = f.month_start

      LEFT JOIN (
        SELECT date_trunc('month', md.medication_date)::date AS month_start, SUM(md.cost) AS medication_cost
        FROM medication_record md
        JOIN batch b ON md.batch_id = b.batch_id
        WHERE b.batch_status = 'Sold'
        ${cond("md", "medication_date")}
        GROUP BY date_trunc('month', md.medication_date)::date
      ) md ON m.month_start = md.month_start

      LEFT JOIN (
        SELECT date_trunc('month', mt.mortality_date)::date AS month_start, SUM(mt.quantity_dead * 15) AS mortality_loss
        FROM mortality_record mt
        JOIN batch b ON mt.batch_id = b.batch_id
        WHERE b.batch_status = 'Sold'
        ${cond("mt", "mortality_date")}
        GROUP BY date_trunc('month', mt.mortality_date)::date
      ) mt ON m.month_start = mt.month_start

      WHERE 
        COALESCE(r.revenue, 0)
        + COALESCE(c.chick_cost, 0)
        + COALESCE(f.feed_cost, 0)
        + COALESCE(md.medication_cost, 0)
        + COALESCE(mt.mortality_loss, 0) > 0

      ORDER BY m.month_start
    `);

    const batchProfitability = await pool.query(`
      SELECT
        b.batch_id,
        b.batch_status,

        COALESCE(r.revenue, 0) AS revenue,

        COALESCE(cp.chick_cost, 0)
        + COALESCE(f.feed_cost, 0)
        + COALESCE(md.medication_cost, 0)
        + COALESCE(mt.mortality_loss, 0) AS cost,

        CASE
          WHEN b.batch_status = 'Sold' THEN
            COALESCE(r.revenue, 0)
            - (
              COALESCE(cp.chick_cost, 0)
              + COALESCE(f.feed_cost, 0)
              + COALESCE(md.medication_cost, 0)
              + COALESCE(mt.mortality_loss, 0)
            )
          ELSE NULL
        END AS profit,

        CASE
          WHEN COALESCE(r.total_weight_kg, 0) > 0 THEN
            ROUND(
              (
                COALESCE(f.feed_kg, 0)::numeric
                / NULLIF(r.total_weight_kg, 0)::numeric
              ),
              2
            )
          ELSE NULL
        END AS fcr,

        CASE
          WHEN b.batch_status = 'Sold' THEN true
          ELSE false
        END AS is_finalized

      FROM batch b

      LEFT JOIN (
        SELECT 
          batch_id, 
          SUM(total_amount) AS revenue,
          SUM(total_weight_kg) AS total_weight_kg
        FROM sales s
        ${where("s", "sales_date")}
        GROUP BY batch_id
      ) r ON b.batch_id = r.batch_id

      LEFT JOIN (
        SELECT batch_id, SUM(total_price) AS chick_cost
        FROM chick_purchase cp
        ${where("cp", "purchase_date")}
        GROUP BY batch_id
      ) cp ON b.batch_id = cp.batch_id

      LEFT JOIN (
        SELECT 
          batch_id, 
          SUM(cost) AS feed_cost,
          SUM(quantity_kg) AS feed_kg
        FROM feed_usage f
        ${where("f", "usage_date")}
        GROUP BY batch_id
      ) f ON b.batch_id = f.batch_id

      LEFT JOIN (
        SELECT batch_id, SUM(cost) AS medication_cost
        FROM medication_record md
        ${where("md", "medication_date")}
        GROUP BY batch_id
      ) md ON b.batch_id = md.batch_id

      LEFT JOIN (
        SELECT batch_id, SUM(quantity_dead * 15) AS mortality_loss
        FROM mortality_record mt
        ${where("mt", "mortality_date")}
        GROUP BY batch_id
      ) mt ON b.batch_id = mt.batch_id

      ORDER BY b.batch_id
    `);

    const costBreakdown = await pool.query(`
      SELECT 'Chick Purchase' AS name, COALESCE(SUM(cp.total_price), 0) AS value
      FROM chick_purchase cp
      JOIN batch b ON cp.batch_id = b.batch_id
      WHERE b.batch_status = 'Sold'
      ${cond("cp", "purchase_date")}

      UNION ALL

      SELECT 'Feed Cost' AS name, COALESCE(SUM(f.cost), 0) AS value
      FROM feed_usage f
      JOIN batch b ON f.batch_id = b.batch_id
      WHERE b.batch_status = 'Sold'
      ${cond("f", "usage_date")}

      UNION ALL

      SELECT 'Medication Cost' AS name, COALESCE(SUM(m.cost), 0) AS value
      FROM medication_record m
      JOIN batch b ON m.batch_id = b.batch_id
      WHERE b.batch_status = 'Sold'
      ${cond("m", "medication_date")}

      UNION ALL

      SELECT 'Mortality Loss' AS name, COALESCE(SUM(mr.quantity_dead * 15), 0) AS value
      FROM mortality_record mr
      JOIN batch b ON mr.batch_id = b.batch_id
      WHERE b.batch_status = 'Sold'
      ${cond("mr", "mortality_date")}
    `);

    res.json({
      selected_range: range,
      last_updated: new Date().toISOString(),
      kpis: kpis.rows[0],
      monthlyProfit: monthlyProfit.rows,
      batchProfitability: batchProfitability.rows,
      costBreakdown: costBreakdown.rows,
    });
  } catch (err) {
    console.error("Owner dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/batches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.batch_id AS id,
        b.batch_status AS status,
        b.start_date,
        b.end_date AS expected_harvest_date,
        b.avg_weight_kg,
        b.price_per_kg,
        b.notes,

        -- Initial chicks from purchase record
        COALESCE(cp.initial_chicks, 0) AS chicks,

        -- Current remaining stock after mortality + approved orders
        COALESCE(b.total_chicks, 0) AS remaining,

        COALESCE(cp.supplier_name, '-') AS supplier_name,
        COALESCE(cp.chick_cost, 0) AS chick_cost,

        COALESCE(mr.dead, 0) AS dead,

        COALESCE(
          ROUND(
            (COALESCE(mr.dead, 0)::numeric / NULLIF(COALESCE(cp.initial_chicks, 0), 0)) * 100,
            1
          ),
          0
        ) AS mortality,

        COALESCE(fu.feed_used, 0) AS feed_used,
        COALESCE(md.medication_cost, 0) AS medication_cost,
        '-' AS breed

      FROM batch b

      LEFT JOIN (
        SELECT
          batch_id,
          SUM(quantity)::INT AS initial_chicks,
          COALESCE(MAX(supplier_name), '-') AS supplier_name,
          SUM(total_price) AS chick_cost
        FROM chick_purchase
        GROUP BY batch_id
      ) cp ON b.batch_id = cp.batch_id

      LEFT JOIN (
        SELECT
          batch_id,
          SUM(quantity_dead)::INT AS dead
        FROM mortality_record
        GROUP BY batch_id
      ) mr ON b.batch_id = mr.batch_id

      LEFT JOIN (
        SELECT
          batch_id,
          SUM(quantity_kg) AS feed_used
        FROM feed_usage
        GROUP BY batch_id
      ) fu ON b.batch_id = fu.batch_id

      LEFT JOIN (
        SELECT
          batch_id,
          SUM(cost) AS medication_cost
        FROM medication_record
        GROUP BY batch_id
      ) md ON b.batch_id = md.batch_id

      ORDER BY b.batch_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch batches error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/batches", async (req, res) => {
  const client = await pool.connect();

  try {
    const {startDate,harvestDate,chicks,totalPrice,supplierName,notes,user_id,} = req.body;

    await client.query("BEGIN");

    const latestBatch = await client.query(`
      SELECT batch_id FROM batch
      ORDER BY CAST(SUBSTRING(batch_id FROM 4) AS INTEGER) DESC
      LIMIT 1
    `);

    const nextBatchNo =
      latestBatch.rows.length > 0
        ? Number(latestBatch.rows[0].batch_id.replace("BAT", "")) + 1
        : 1;

    const batchId = `BAT${String(nextBatchNo).padStart(3, "0")}`;

    const latestPurchase = await client.query(`
      SELECT purchase_id FROM chick_purchase
      ORDER BY CAST(SUBSTRING(purchase_id FROM 4) AS INTEGER) DESC
      LIMIT 1
    `);

    const nextPurchaseNo =
      latestPurchase.rows.length > 0
        ? Number(latestPurchase.rows[0].purchase_id.replace("PUR", "")) + 1
        : 1;

    const purchaseId = `PUR${String(nextPurchaseNo).padStart(3, "0")}`;

    await client.query(
      `
      INSERT INTO batch
      (batch_id, start_date, end_date, total_chicks, batch_status, notes, user_id)
      VALUES ($1, $2, $3, $4, 'Growing', $5, $6)
      `,
      [batchId, startDate, harvestDate, Number(chicks), notes || null, user_id || null,]);

    await client.query(
      `INSERT INTO chick_purchase
       (purchase_id, purchase_date, quantity, total_price, supplier_name, batch_id)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)`,
      [
        purchaseId,
        Number(chicks),
        Number(totalPrice || 0),
        supplierName || "Default Supplier",
        batchId,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Batch created successfully.",
      batch_id: batchId,
      purchase_id: purchaseId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create batch error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.patch("/batches/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status, start_date, end_date } = req.body;

    const result = await pool.query(
      `UPDATE batch
       SET batch_status = $1, start_date = $2, end_date = $3
       WHERE batch_id = $4
       RETURNING *`,
      [status, start_date, end_date, batchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Batch not found." });
    }

    res.json({ message: "Batch updated successfully.", batch: result.rows[0] });
  } catch (err) {
    console.error("Update batch error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/batches/:batchId/harvest-info", async (req, res) => {
  try {
    const { batchId } = req.params;
    const { avg_weight_kg, price_per_kg } = req.body;

    if (!avg_weight_kg || Number(avg_weight_kg) <= 0) {
      return res.status(400).json({
        message: "Average weight must be greater than 0.",
      });
    }

    if (!price_per_kg || Number(price_per_kg) <= 0) {
      return res.status(400).json({
        message: "Price per kg must be greater than 0.",
      });
    }

    const batchCheck = await pool.query(
      `
      SELECT batch_id, end_date, batch_status
      FROM batch
      WHERE batch_id = $1
      `,
      [batchId]
    );

    if (batchCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Batch not found.",
      });
    }

    const batch = batchCheck.rows[0];

    const today = new Date().toISOString().split("T")[0];
    const harvestDate = new Date(batch.end_date).toISOString().split("T")[0];

  if (harvestDate > today) {
    return res.status(400).json({
      message: "Harvest information can only be entered on or after the harvest day.",
    });
  }

    const result = await pool.query(
      `
      UPDATE batch
      SET
        avg_weight_kg = $1,
        price_per_kg = $2,
        batch_status = CASE
          WHEN batch_status = 'Growing' THEN 'Ready for Sale'
          ELSE batch_status
        END
      WHERE batch_id = $3
      RETURNING *
      `,
      [Number(avg_weight_kg), Number(price_per_kg), batchId]
    );

    res.json({
      message: `Harvest information saved for ${batchId}.`,
      batch: result.rows[0],
    });
  } catch (err) {
    console.error("Update harvest info error:", err);
    res.status(500).json({
      message: "Failed to save harvest information.",
      error: err.message,
    });
  }
});

router.delete("/batches/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    // 1. Check whether batch exists
    const batchCheck = await pool.query(
      `SELECT batch_id FROM batch WHERE batch_id = $1`,
      [batchId]
    );

    if (batchCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Batch not found.",
      });
    }

    // 2. Check related records
    const used = await pool.query(
      `SELECT 
        (SELECT COUNT(*)::INT FROM feed_usage WHERE batch_id = $1) AS feed_count,
        (SELECT COUNT(*)::INT FROM medication_record WHERE batch_id = $1) AS medication_count,
        (SELECT COUNT(*)::INT FROM mortality_record WHERE batch_id = $1) AS mortality_count,
        (SELECT COUNT(*)::INT FROM chick_purchase WHERE batch_id = $1) AS purchase_count,
        (SELECT COUNT(*)::INT FROM orders WHERE batch_id = $1) AS order_count,
        (SELECT COUNT(*)::INT FROM sales WHERE batch_id = $1) AS sales_count`,
      [batchId]
    );

    const counts = used.rows[0];

    const hasRelatedRecords =
      counts.feed_count > 0 ||
      counts.medication_count > 0 ||
      counts.mortality_count > 0 ||
      counts.purchase_count > 0 ||
      counts.order_count > 0 ||
      counts.sales_count > 0;

    if (hasRelatedRecords) {
      return res.status(400).json({
        message: `Cannot delete ${batchId} because it already has farm records. Change the batch status instead of deleting it.`,
        details: counts,
      });
    }

    // 3. Only delete batch if there are no related records
    const result = await pool.query(
      `DELETE FROM batch
       WHERE batch_id = $1
       RETURNING *`,
      [batchId]
    );

    res.json({
      message: `Batch ${batchId} deleted successfully.`,
      batch: result.rows[0],
    });
  } catch (err) {
    console.error("Delete batch error:", err);
    res.status(500).json({
      message: "Failed to delete batch.",
      error: err.message,
    });
  }
});
router.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM owner_order_management_view
      ORDER BY order_date DESC, order_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner orders error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/owner/orders/change-batch/available-batches?quantity=10
router.get("/orders/change-batch/available-batches", async (req, res) => {
  try {
    const requiredQty = Number(req.query.quantity || 0);

    const result = await pool.query(
      `
      SELECT
        b.batch_id,
        b.notes,
        b.total_chicks,
        b.avg_weight_kg,
        b.price_per_kg,
        b.batch_status,

        COALESCE(p.pending_quantity, 0)::INT AS pending_reserved,

        GREATEST(
          b.total_chicks - COALESCE(p.pending_quantity, 0),
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
      ) p
        ON p.batch_id = b.batch_id

      WHERE b.batch_status = 'Ready for Sale'
        AND b.avg_weight_kg IS NOT NULL
        AND b.price_per_kg IS NOT NULL
        AND GREATEST(
          b.total_chicks - COALESCE(p.pending_quantity, 0),
          0
        ) >= $1

      ORDER BY b.batch_id
      `,
      [requiredQty]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch change batch options error:", err);
    res.status(500).json({
      message: "Failed to fetch available batches.",
      error: err.message,
    });
  }
});

// PATCH /api/owner/orders/:orderId/change-batch
router.patch("/orders/:orderId/change-batch", async (req, res) => {
  const { orderId } = req.params;
  const { new_batch_id } = req.body;

  if (!new_batch_id) {
    return res.status(400).json({
      message: "New batch is required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT
        order_id,
        order_status,
        requested_quantity,
        batch_id,
        is_recurring
      FROM orders
      WHERE order_id = $1
      FOR UPDATE
      `,
      [orderId]
    );

    if (orderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const order = orderResult.rows[0];

    if (!order.is_recurring) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Batch can only be changed for recurring orders.",
      });
    }

    if (!["Pending", "Scheduled"].includes(order.order_status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Batch can only be changed before approval.",
      });
    }

    if (order.batch_id === new_batch_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "This order is already using the selected batch.",
      });
    }

    const batchResult = await client.query(
      `
      SELECT
        batch_id,
        total_chicks,
        batch_status,
        avg_weight_kg,
        price_per_kg
      FROM batch
      WHERE batch_id = $1
      FOR UPDATE
      `,
      [new_batch_id]
    );

    if (batchResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Selected batch not found.",
      });
    }

    const batch = batchResult.rows[0];

    if (batch.batch_status !== "Ready for Sale") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Selected batch is not ready for sale.",
      });
    }

    const pendingResult = await client.query(
      `
      SELECT COALESCE(SUM(requested_quantity), 0)::INT AS pending_reserved
      FROM orders
      WHERE batch_id = $1
        AND order_status = 'Pending'
        AND order_id <> $2
      `,
      [new_batch_id, orderId]
    );

    const availableStock =
      Number(batch.total_chicks || 0) -
      Number(pendingResult.rows[0].pending_reserved || 0);

    if (availableStock < Number(order.requested_quantity || 0)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Not enough available stock in ${new_batch_id}. Available: ${availableStock}, required: ${order.requested_quantity}.`,
      });
    }

    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET batch_id = $1
      WHERE order_id = $2
      RETURNING *
      `,
      [new_batch_id, orderId]
    );

    await client.query("COMMIT");

    res.json({
      message: `Order ${orderId} batch changed from ${order.batch_id} to ${new_batch_id}.`,
      order: updatedOrder.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Change order batch error:", err);
    res.status(500).json({
      message: "Failed to change order batch.",
      error: err.message,
    });
  } finally {
    client.release();
  }
});

// PATCH /api/owner/orders/:orderId/cancel
router.patch("/orders/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT order_id, order_status, requested_quantity, batch_id
      FROM orders
      WHERE order_id = $1
      FOR UPDATE
      `,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found." });
    }

    const order = orderResult.rows[0];

    if (order.order_status === "Cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This order is already cancelled." });
    }

    if (!["Pending", "Scheduled"].includes(order.order_status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only pending or scheduled orders can be approved.",
      });
    }

    const cancelledOrder = await client.query(
      `
      UPDATE orders
      SET order_status = 'Cancelled'
      WHERE order_id = $1
      RETURNING *
      `,
      [orderId]
    );

    await client.query("COMMIT");

    res.json({
      message: `Order ${orderId} has been cancelled and stock has been restored.`,
      order: cancelledOrder.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cancel order error:", err);
    res.status(500).json({
      message: "Failed to cancel order.",
      error: err.message,
    });
  } finally {
    client.release();
  }
});

// PATCH /api/owner/orders/:orderId/approve
router.patch("/orders/:orderId/approve", async (req, res) => {
  const { orderId } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT
        order_id,
        order_status,
        requested_quantity,
        batch_id
      FROM orders
      WHERE order_id = $1
      FOR UPDATE
      `,
      [orderId]
    );

    if (orderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const order = orderResult.rows[0];

    if (!["Pending", "Scheduled"].includes(order.order_status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only pending orders can be approved.",
      });
    }

    const requestedQuantity = Number(order.requested_quantity || 0);

const batchResult = await client.query(
  `
  SELECT batch_id, total_chicks, batch_status
  FROM batch
  WHERE batch_id = $1
  FOR UPDATE
  `,
  [order.batch_id]
);

if (batchResult.rowCount === 0) {
  await client.query("ROLLBACK");
  return res.status(404).json({
    message: "Batch not found.",
  });
}

const currentStock = Number(batchResult.rows[0].total_chicks || 0);
const batchStatus = batchResult.rows[0].batch_status;

if (batchStatus !== "Ready for Sale") {
  await client.query("ROLLBACK");
  return res.status(400).json({
    message: `Cannot approve order. Batch ${order.batch_id} is ${batchStatus}. Please change to another available batch first.`,
  });
}

if (currentStock < requestedQuantity) {
  await client.query("ROLLBACK");
  return res.status(400).json({
    message: `Not enough stock. Current stock is ${currentStock}, but order requested ${requestedQuantity}.`,
  });
}
    const updatedBatch = await client.query(
      `
      UPDATE batch
      SET 
        total_chicks = total_chicks - $1,
        batch_status = CASE
          WHEN total_chicks - $1 <= 0 THEN 'Sold'
          ELSE batch_status
        END
      WHERE batch_id = $2
      RETURNING batch_id, total_chicks, batch_status
      `,
      [requestedQuantity, order.batch_id]
    );

    const approvedOrder = await client.query(
      `
      UPDATE orders
      SET order_status = 'Approved'
      WHERE order_id = $1
      RETURNING *
      `,
      [orderId]
    );

    await client.query("COMMIT");

    res.json({
      message: `Order ${orderId} approved successfully. Stock deducted from ${order.batch_id}.`,
      order: approvedOrder.rows[0],
      batch: updatedBatch.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Approve order error:", err);
    res.status(500).json({
      message: "Failed to approve order.",
      error: err.message,
    });
  } finally {
    client.release();
  }
});
router.get("/sales", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM owner_sales_view
      ORDER BY sales_date DESC, sales_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner sales error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM owner_sales_view
      ORDER BY sales_date DESC, sales_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner sales error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/sales/fcr-impact", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM owner_fcr_sales_impact_view
      ORDER BY batch_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner FCR impact error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/feed-usage", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM owner_feed_usage_view
      ORDER BY usage_date DESC, feed_usage_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner feed usage error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/feed-usage/group-by-batch", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        batch_id,
        COUNT(*) AS total_records,
        SUM(quantity_kg) AS total_feed_kg,
        SUM(cost) AS total_cost,
        ROUND(AVG(cost / NULLIF(quantity_kg, 0))::numeric, 2) AS avg_price_per_kg
      FROM feed_usage
      GROUP BY batch_id
      ORDER BY batch_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner feed batch summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/medication/available-batches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        batch_id AS id,
        start_date,
        end_date,
        batch_status
      FROM batch
      WHERE batch_status = 'Growing'
      AND end_date > CURRENT_DATE
      ORDER BY batch_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch available medication batches error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/medication", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM owner_medication_view
      ORDER BY medication_date DESC, medication_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner medication error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/medication", upload.single("medication_photo"), async (req, res) => {
  try {
    const {
      medication_name,
      medication_date,
      dosage,
      quantity,
      cost,
      remark,
      batch_id,
      user_id,
    } = req.body;

    const medication_photo = req.file ? `/uploads/${req.file.filename}`: null;

    const result = await pool.query(
      `
      INSERT INTO medication_record
      (medication_name, medication_date, dosage, quantity, cost, remark, batch_id, user_id,medication_photo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        medication_name,
        medication_date,
        dosage,
        quantity,
        cost,
        remark,
        batch_id,
        user_id || null,
        medication_photo,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Add medication error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/medication/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      medication_name,
      medication_date,
      dosage,
      quantity,
      cost,
      remark,
      batch_id,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE medication_record
      SET
        medication_name = $1,
        medication_date = $2,
        dosage = $3,
        quantity = $4,
        cost = $5,
        remark = $6,
        batch_id = $7
      WHERE medication_id = $8
      AND medication_date = CURRENT_DATE
      RETURNING *
      `,
      [medication_name, medication_date, dosage, quantity, cost, remark, batch_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: "Only medication records added today can be edited.",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update medication error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/medication/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM medication_record
      WHERE medication_id = $1
      AND medication_date = CURRENT_DATE
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: "Only medication records added today can be deleted.",
      });
    }

    res.json({ message: "Medication record deleted successfully" });
  } catch (err) {
    console.error("Delete medication error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET mortality records
router.get("/mortality", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        mr.mortality_id AS id,
        mr.batch_id AS batch,
        mr.mortality_date AS date,
        mr.quantity_dead AS deaths,
        mr.cause,
        mr.user_id AS updated_by,
        (mr.mortality_date - b.start_date) + 1 AS day
      FROM mortality_record mr
      JOIN batch b ON mr.batch_id = b.batch_id
      ORDER BY mr.mortality_date DESC, mr.mortality_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch mortality error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ADD mortality record
router.post("/mortality", async (req, res) => {
  const client = await pool.connect();

  try {
    const { batch_id, mortality_date, quantity_dead, cause, user_id } = req.body;
    const deadQty = Number(quantity_dead || 0);

    if (!batch_id || !mortality_date || deadQty <= 0 || !cause) {
      return res.status(400).json({
        message: "Batch, date, quantity dead, and cause are required.",
      });
    }

    await client.query("BEGIN");

    const batchCheck = await client.query(
      `
      SELECT batch_id, total_chicks
      FROM batch
      WHERE batch_id = $1
      FOR UPDATE
      `,
      [batch_id]
    );

    if (batchCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Batch not found.",
      });
    }

    const currentStock = Number(batchCheck.rows[0].total_chicks || 0);

    if (deadQty > currentStock) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Cannot record ${deadQty} dead chickens. Current remaining stock is only ${currentStock}.`,
      });
    }

    const latest = await client.query(`
      SELECT mortality_id
      FROM mortality_record
      ORDER BY CAST(SUBSTRING(mortality_id FROM 4) AS INTEGER) DESC
      LIMIT 1
    `);

    const nextNo =
      latest.rows.length > 0
        ? Number(latest.rows[0].mortality_id.replace("MOR", "")) + 1
        : 1;

    const mortalityId = `MOR${String(nextNo).padStart(3, "0")}`;

    const result = await client.query(
      `
      INSERT INTO mortality_record
      (mortality_id, mortality_date, quantity_dead, cause, batch_id, user_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        mortalityId,
        mortality_date,
        deadQty,
        cause,
        batch_id,
        user_id || null,
      ]
    );

    await client.query(
      `
      UPDATE batch
      SET total_chicks = total_chicks - $1
      WHERE batch_id = $2
      `,
      [deadQty, batch_id]
    );

    await client.query("COMMIT");

    res.json({
      message: `Mortality recorded. ${deadQty} chickens deducted from ${batch_id}.`,
      record: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add mortality error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// UPDATE mortality record
router.put("/mortality/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { batch_id, mortality_date, quantity_dead, cause, remark, user_id } = req.body;
    const newDeadQty = Number(quantity_dead || 0);

    if (!batch_id || !mortality_date || newDeadQty <= 0 || !cause) {
      return res.status(400).json({
        message: "Batch, date, quantity dead, and cause are required.",
      });
    }

    await client.query("BEGIN");

    const oldRecordResult = await client.query(
      `
      SELECT mortality_id, batch_id, quantity_dead
      FROM mortality_record
      WHERE mortality_id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (oldRecordResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Mortality record not found." });
    }

    const oldRecord = oldRecordResult.rows[0];
    const oldDeadQty = Number(oldRecord.quantity_dead || 0);

    if (oldRecord.batch_id !== batch_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Changing mortality record to another batch is not allowed. Delete and create a new record instead.",
      });
    }

    const difference = newDeadQty - oldDeadQty;

    if (difference > 0) {
      const batchCheck = await client.query(
        `
        SELECT batch_id, total_chicks
        FROM batch
        WHERE batch_id = $1
        FOR UPDATE
        `,
        [batch_id]
      );

      const currentStock = Number(batchCheck.rows[0]?.total_chicks || 0);

      if (difference > currentStock) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `Cannot increase mortality by ${difference}. Current remaining stock is only ${currentStock}.`,
        });
      }
    }

    await client.query(
      `
      UPDATE batch
      SET total_chicks = total_chicks - $1
      WHERE batch_id = $2
      `,
      [difference, batch_id]
    );

    const result = await client.query(
      `
      UPDATE mortality_record
      SET
        mortality_date = $1,
        quantity_dead = $2,
        cause = $3,
        remark = $4,
        batch_id = $5,
        user_id = COALESCE($6, user_id)
      WHERE mortality_id = $7
      RETURNING *
      `,
      [
        mortality_date,
        newDeadQty,
        cause,
        remark || null,
        batch_id,
        user_id || null,
        id,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Mortality record updated and batch stock adjusted.",
      record: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update mortality error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
// DELETE mortality record
router.delete("/mortality/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const oldRecordResult = await client.query(
      `
      SELECT mortality_id, batch_id, quantity_dead
      FROM mortality_record
      WHERE mortality_id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (oldRecordResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Mortality record not found." });
    }

    const oldRecord = oldRecordResult.rows[0];

    await client.query(
      `
      UPDATE batch
      SET total_chicks = total_chicks + $1
      WHERE batch_id = $2
      `,
      [Number(oldRecord.quantity_dead || 0), oldRecord.batch_id]
    );

    await client.query(
      `
      DELETE FROM mortality_record
      WHERE mortality_id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Mortality record deleted and batch stock restored.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete mortality error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================
   GET ALL DELIVERIES
========================= */
router.get("/delivery", async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT
    d.delivery_id AS id,
    s.order_id,
    c.address,
    c.area,
    c.customer_id,
    au.full_name AS customer,
    COALESCE(du.full_name, 'Unassigned') AS driver,
    d.user_id AS driver_id,

    COALESCE(d.assigned_at::date, o.requested_delivery_date) AS date,
      d.assigned_at,
    COALESCE(TO_CHAR(d.assigned_at, 'HH24:MI'), '-') AS time,

    d.delivery_status AS status
  FROM delivery d
  LEFT JOIN sales s ON d.sales_id = s.sales_id
  LEFT JOIN orders o ON s.order_id = o.order_id
  LEFT JOIN customer c ON o.customer_id = c.customer_id
  LEFT JOIN app_user au ON c.user_id = au.user_id
  LEFT JOIN app_user du ON d.user_id = du.user_id
`);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch delivery error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET DRIVERS
========================= */
router.get("/delivery/drivers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        user_id,
        full_name AS name,
        vehicle_no AS vehicle
      FROM app_user
      WHERE UPPER(role) = 'DRIVER'
      AND UPPER(status) = 'ACTIVE'
      ORDER BY full_name
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("Fetch drivers error:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// PATCH /api/owner/delivery/:id/assign
router.patch("/delivery/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id, assigned_time, requested_date } = req.body;

    if (!driver_id || !assigned_time || !requested_date) {
      return res.status(400).json({
        message: "Driver, assigned time, and requested date are required.",
      });
    }

    // Get selected driver info for remarks
    const driverResult = await pool.query(
      `
      SELECT full_name, vehicle_no
      FROM app_user
      WHERE user_id = $1
      `,
      [driver_id]
    );

    if (driverResult.rowCount === 0) {
      return res.status(404).json({
        message: "Selected driver not found.",
      });
    }

    const driver = driverResult.rows[0];

    const result = await pool.query(
      `
      UPDATE delivery
      SET
        user_id = $1,
        delivery_status = 'Assigned',
        delivery_date = $3::date,
        assigned_at = ($3::date + $4::time),
        out_for_delivery_at = NULL,
        completed_at = NULL,
        remarks = $5
      WHERE delivery_id = $2
      RETURNING *
      `,
      [
        driver_id,
        id,
        requested_date,
        assigned_time,
        `Driver assigned to ${driver.full_name} (${driver.vehicle_no || "No vehicle"}). Waiting to start delivery.`,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Delivery not found.",
      });
    }

    res.json({
      message: `Delivery ${id} assigned to ${driver.full_name}.`,
      delivery: result.rows[0],
    });
  } catch (err) {
    console.error("Assign delivery error:", err);
    res.status(500).json({
      message: "Failed to assign delivery.",
      error: err.message,
    });
  }
});
router.get("/customers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.customer_id AS id,
        au.full_name AS name,
        au.email,
        au.phone_no AS phone,
        c.address,
        c.area,
        au.status,
        COALESCE(sales_summary.total_spent, 0) AS total_spent,
        COALESCE(order_summary.total_kg, 0) AS total_kg,
        COALESCE(order_summary.orders, 0) AS orders,
        order_summary.last_order,
        order_summary.joined
      FROM customer c
      JOIN app_user au ON c.user_id = au.user_id

      LEFT JOIN (
        SELECT 
          customer_id, 
          SUM(total_amount) AS total_spent
        FROM sales
        GROUP BY customer_id
      ) sales_summary ON c.customer_id = sales_summary.customer_id

      LEFT JOIN (
        SELECT 
          customer_id,
          SUM(requested_quantity) AS total_kg,
          COUNT(order_id) AS orders,
          MAX(order_date) AS last_order,
          MIN(order_date) AS joined
        FROM orders
        GROUP BY customer_id
      ) order_summary ON c.customer_id = order_summary.customer_id

      ORDER BY c.customer_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch customers error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/owner/delivery/:id/reassign
router.patch("/delivery/:id/reassign", async (req, res) => {
  const { id } = req.params;
  const { driver_id, assigned_time, requested_date, reason } = req.body;

  if (!driver_id || !assigned_time || !requested_date) {
    return res.status(400).json({
      message: "New driver, assigned time, and requested date are required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

const deliveryResult = await client.query(
  `
  SELECT
    d.delivery_id,
    d.delivery_status,
    d.assigned_at,
    d.out_for_delivery_at,
    d.user_id AS old_driver_id,
    old_driver.full_name AS old_driver_name
  FROM delivery d
  LEFT JOIN app_user old_driver
    ON old_driver.user_id = d.user_id
  WHERE d.delivery_id = $1
  FOR UPDATE OF d
  `,
  [id]
);

    if (deliveryResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Delivery not found.",
      });
    }

    const delivery = deliveryResult.rows[0];

    if (String(delivery.delivery_status).toLowerCase() !== "assigned") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only assigned deliveries can be reassigned.",
      });
    }

    if (delivery.out_for_delivery_at) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "This delivery has already started and cannot be reassigned.",
      });
    }

    const newDriverResult = await client.query(
      `
      SELECT full_name, vehicle_no
      FROM app_user
      WHERE user_id = $1
      `,
      [driver_id]
    );

    if (newDriverResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "New driver not found.",
      });
    }

    const newDriver = newDriverResult.rows[0];

    const finalReason =
      reason?.trim() ||
      "Driver did not start delivery after assignment.";

    const result = await client.query(
      `
      UPDATE delivery
      SET
        user_id = $1,
        delivery_status = 'Assigned',
        delivery_date = $3::date,
        assigned_at = ($3::date + $4::time),
        out_for_delivery_at = NULL,
        completed_at = NULL,
        remarks = $5
      WHERE delivery_id = $2
      RETURNING *
      `,
      [
        driver_id,
        id,
        requested_date,
        assigned_time,
        `Reassigned from ${delivery.old_driver_name || "previous driver"} to ${newDriver.full_name} (${newDriver.vehicle_no || "No vehicle"}). Reason: ${finalReason}`,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: `Delivery ${id} reassigned to ${newDriver.full_name}.`,
      delivery: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Reassign delivery error:", err);
    res.status(500).json({
      message: "Failed to reassign delivery.",
      error: err.message,
    });
  } finally {
    client.release();
  }
});

router.get("/customers/:id/history", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        o.order_id,
        o.order_date AS date,
        o.requested_quantity AS weight,
        COALESCE(s.total_amount, 0) AS amount,
        o.order_status AS status,
        COALESCE(d.delivery_status, '-') AS delivery
      FROM orders o
      LEFT JOIN sales s ON o.order_id = s.order_id
      LEFT JOIN delivery d ON s.sales_id = d.sales_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC, o.order_id DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch customer history error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/customers/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, email, phone, address, area, status } = req.body;

    await client.query("BEGIN");

    const cust = await client.query(
      `SELECT user_id FROM customer WHERE customer_id = $1`,
      [id]
    );

    if (cust.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Customer not found" });
    }

    const userId = cust.rows[0].user_id;

    await client.query(`
      UPDATE app_user
      SET full_name = $1, email = $2, phone_no = $3, status = $4
      WHERE user_id = $5
    `, [name, email, phone, status, userId]);

    await client.query(`
      UPDATE customer
      SET address = $1, area = $2
      WHERE customer_id = $3
    `, [address, area, id]);

    await client.query("COMMIT");
    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update customer error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const cust = await pool.query(
      `SELECT user_id FROM customer WHERE customer_id = $1`,
      [id]
    );

    if (cust.rowCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await pool.query(
      `UPDATE app_user SET status = 'Inactive' WHERE user_id = $1`,
      [cust.rows[0].user_id]
    );

    res.json({ message: "Customer set to inactive successfully" });
  } catch (err) {
    console.error("Delete customer error:", err);
    res.status(500).json({ error: err.message });
  }
});

const bcrypt = require("bcrypt");

router.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        au.user_id AS id,
        au.full_name,
        au.email,
        au.username,
        au.phone_no AS phone,
        au.role,
        au.status,
        au.vehicle_no,

        COALESCE(feed.feed_count, 0)
        + COALESCE(med.med_count, 0)
        + COALESCE(mor.mortality_count, 0)
        + COALESCE(del.delivery_count, 0) AS tasks_handled

      FROM app_user au

      LEFT JOIN (
        SELECT user_id, COUNT(*) AS feed_count
        FROM feed_usage
        GROUP BY user_id
      ) feed ON au.user_id = feed.user_id

      LEFT JOIN (
        SELECT user_id, COUNT(*) AS med_count
        FROM medication_record
        GROUP BY user_id
      ) med ON au.user_id = med.user_id

      LEFT JOIN (
        SELECT user_id, COUNT(*) AS mortality_count
        FROM mortality_record
        GROUP BY user_id
      ) mor ON au.user_id = mor.user_id

      LEFT JOIN (
        SELECT user_id, COUNT(*) AS delivery_count
        FROM delivery
        GROUP BY user_id
      ) del ON au.user_id = del.user_id

      WHERE UPPER(au.role) IN ('FARM WORKER', 'DRIVER')
      ORDER BY au.user_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch employees error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/employees", async (req, res) => {
  try {
    const { fullName, email, username, phone, role, tempPassword, status, vehicle_no } = req.body;

    const latest = await pool.query(`
      SELECT user_id FROM app_user
      ORDER BY CAST(SUBSTRING(user_id FROM 4) AS INTEGER) DESC
      LIMIT 1
    `);

    const nextNo = latest.rows.length
      ? Number(latest.rows[0].user_id.replace("USR", "")) + 1
      : 1;

    const userId = `USR${String(nextNo).padStart(3, "0")}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(`
      INSERT INTO app_user
      (user_id, full_name, email, username, phone_no, role, password, status, vehicle_no)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING user_id, full_name, email, username, phone_no, role, status, vehicle_no
    `, [
      userId,
      fullName,
      email,
      username,
      phone || null,
      role,
      hashedPassword,
      status || "Active",
      vehicle_no || null
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Create employee error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, username, phone, role, status, vehicle_no } = req.body;

    const result = await pool.query(`
      UPDATE app_user
      SET full_name=$1, email=$2, username=$3, phone_no=$4, role=$5, status=$6, vehicle_no=$7
      WHERE user_id=$8
      RETURNING user_id, full_name, email, username, phone_no, role, status, vehicle_no
    `, [fullName, email, username, phone, role, status, vehicle_no || null, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/employees/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(`UPDATE app_user SET status=$1 WHERE user_id=$2`, [status, id]);
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("Update employee status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/owner/employees/:id/reset-password
router.patch("/employees/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;

    const defaultPassword = "12345";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const result = await pool.query(
      `
      UPDATE app_user
      SET password = $1
      WHERE user_id = $2
        AND UPPER(role) IN ('FARM WORKER', 'DRIVER')
      RETURNING user_id, full_name, username, role
      `,
      [hashedPassword, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    res.json({
      message: `Password for ${result.rows[0].full_name} has been reset to 12345.`,
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Reset employee password error:", err);
    res.status(500).json({
      message: "Failed to reset password.",
      error: err.message,
    });
  }
});

router.delete("/employees/:id", async (req, res) => {
  try {
    await pool.query(`UPDATE app_user SET status='Disabled' WHERE user_id=$1`, [req.params.id]);
    res.json({ message: "Employee disabled" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Replace the entire PDF endpoint with this corrected version
// Simple, clean PDF generation
router.get("/reports/executive-summary-pdf", async (req, res) => {
  try {
    // ── Data fetching (unchanged) ────────────────────────────
    const kpis = await pool.query(`
      SELECT
        COALESCE((SELECT SUM(s.total_amount) FROM sales s JOIN batch b ON s.batch_id = b.batch_id WHERE b.batch_status = 'Sold'), 0) AS total_revenue,
        COALESCE((SELECT SUM(cp.total_price) FROM chick_purchase cp JOIN batch b ON cp.batch_id = b.batch_id WHERE b.batch_status = 'Sold'), 0) AS chick_cost,
        COALESCE((SELECT SUM(f.cost) FROM feed_usage f JOIN batch b ON f.batch_id = b.batch_id WHERE b.batch_status = 'Sold'), 0) AS feed_cost,
        COALESCE((SELECT SUM(m.cost) FROM medication_record m JOIN batch b ON m.batch_id = b.batch_id WHERE b.batch_status = 'Sold'), 0) AS medication_cost,
        COALESCE((SELECT SUM(mr.quantity_dead * 15) FROM mortality_record mr JOIN batch b ON mr.batch_id = b.batch_id WHERE b.batch_status = 'Sold'), 0) AS mortality_loss
    `);
 
    const batchProfitability = await pool.query(`
      SELECT
        b.batch_id,
        COALESCE(r.revenue, 0) AS revenue,
        COALESCE(f.feed_cost, 0) + COALESCE(md.medication_cost, 0) + COALESCE(mt.mortality_loss, 0) + COALESCE(cp.chick_cost, 0) AS cost,
        CASE WHEN b.batch_status = 'Sold' THEN
          COALESCE(r.revenue, 0) - (COALESCE(f.feed_cost, 0) + COALESCE(md.medication_cost, 0) + COALESCE(mt.mortality_loss, 0) + COALESCE(cp.chick_cost, 0))
        ELSE NULL END AS profit
      FROM batch b
      LEFT JOIN (SELECT batch_id, SUM(total_amount) AS revenue FROM sales GROUP BY batch_id) r ON b.batch_id = r.batch_id
      LEFT JOIN (SELECT batch_id, SUM(cost) AS feed_cost FROM feed_usage GROUP BY batch_id) f ON b.batch_id = f.batch_id
      LEFT JOIN (SELECT batch_id, SUM(cost) AS medication_cost FROM medication_record GROUP BY batch_id) md ON b.batch_id = md.batch_id
      LEFT JOIN (SELECT batch_id, SUM(quantity_dead * 15) AS mortality_loss FROM mortality_record GROUP BY batch_id) mt ON b.batch_id = mt.batch_id
      LEFT JOIN (SELECT batch_id, SUM(total_price) AS chick_cost FROM chick_purchase GROUP BY batch_id) cp ON b.batch_id = cp.batch_id
      WHERE b.batch_status = 'Sold'
      ORDER BY profit DESC
    `);
 
  const fcrData = await pool.query(`
    SELECT
      COALESCE(f.total_feed_kg, 0) AS total_feed_kg,
      COALESCE(s.total_weight_kg, 0) AS total_weight_kg,
      COALESCE(m.total_deaths, 0) AS total_deaths,
      COALESCE(cp.initial_chicks, 0) AS total_chicks
    FROM
      (
        SELECT COALESCE(SUM(quantity_kg), 0) AS total_feed_kg
        FROM feed_usage
        WHERE batch_id IN (
          SELECT batch_id FROM batch WHERE batch_status = 'Sold'
        )
      ) f
    CROSS JOIN
      (
        SELECT COALESCE(SUM(total_weight_kg), 0) AS total_weight_kg
        FROM sales
        WHERE batch_id IN (
          SELECT batch_id FROM batch WHERE batch_status = 'Sold'
        )
      ) s
    CROSS JOIN
      (
        SELECT COALESCE(SUM(quantity_dead), 0) AS total_deaths
        FROM mortality_record
        WHERE batch_id IN (
          SELECT batch_id FROM batch WHERE batch_status = 'Sold'
        )
      ) m
    CROSS JOIN
      (
        SELECT COALESCE(SUM(quantity), 0) AS initial_chicks
        FROM chick_purchase
        WHERE batch_id IN (
          SELECT batch_id FROM batch WHERE batch_status = 'Sold'
        )
      ) cp
  `);
 
    // ── Computed values ──────────────────────────────────────
    const totalFeedKg   = parseFloat(fcrData.rows[0].total_feed_kg)   || 0;
    const totalWeightKg = parseFloat(fcrData.rows[0].total_weight_kg) || 0;
    const totalDeaths   = parseFloat(fcrData.rows[0].total_deaths)    || 0;
    const totalChicks   = parseFloat(fcrData.rows[0].total_chicks)    || 0;
 
    const avgFCR        = totalWeightKg > 0 ? (totalFeedKg / totalWeightKg).toFixed(2) : "0.00";
    const mortalityRate = totalChicks  > 0 ? ((totalDeaths / totalChicks) * 100).toFixed(1) : "0.0";
 
    const k             = kpis.rows[0];
    const revenue       = parseFloat(k.total_revenue)    || 0;
    const feedCost      = parseFloat(k.feed_cost)        || 0;
    const medCost       = parseFloat(k.medication_cost)  || 0;
    const mortalityLoss = parseFloat(k.mortality_loss)   || 0;
    const chickCost     = parseFloat(k.chick_cost)       || 0;
    const totalCost     = feedCost + medCost + mortalityLoss + chickCost;
    const profit        = revenue - totalCost;
    const margin        = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0";
 
    const batches       = batchProfitability.rows;
    const topBatch      = batches.length > 0 ? batches[0] : null;
    const worstBatch    = batches.length > 0 && batches[batches.length - 1].profit < 0
                          ? batches[batches.length - 1] : null;
 
    // ── Helpers ──────────────────────────────────────────────
    const fmt = (n) => `RM ${parseFloat(n).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`;
    const pct = (part, whole) => whole > 0 ? ((part / whole) * 100).toFixed(1) + "%" : "0.0%";
 
    // ── Layout constants ─────────────────────────────────────
    const L = 50;          // left margin
    const R = 545;         // right edge
    const W = R - L;       // usable width  (495 pt)
    const PAGE_H = 841.89; // A4 height in points
    const FOOTER_Y = PAGE_H - 40;
 
    // ── Colour palette ───────────────────────────────────────
    const GREEN_DARK  = "#1B5E20";
    const GREEN_MID   = "#2E7D32";
    const GREEN_LIGHT = "#E8F5E9";
    const GREEN_LINE  = "#4CAF50";
    const RED_DARK    = "#C62828";
    const RED_LIGHT   = "#FFEBEE";
    const GREY_TEXT   = "#555555";
    const GREY_LIGHT  = "#F5F5F5";
    const DIVIDER     = "#CCCCCC";
 
    // ── Shared drawing utilities ─────────────────────────────
 
    /** Draw a coloured filled rectangle */
    function fillRect(doc, x, y, w, h, colour) {
      doc.save().rect(x, y, w, h).fill(colour).restore();
    }
 
    /** Thin horizontal rule */
    function hRule(doc, y, colour = DIVIDER) {
      doc.save().strokeColor(colour).lineWidth(0.5)
         .moveTo(L, y).lineTo(R, y).stroke().restore();
    }
 
    /** Section heading with green bar on the left */
    function sectionHeading(doc, text, y) {
      fillRect(doc, L, y, 4, 16, GREEN_MID);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(GREEN_DARK)
         .text(text, L + 10, y + 1, { width: W - 10 });
      return y + 24; // returns next y
    }
 
    /** Key-value pair in two columns */
    function kvRow(doc, label, value, x1, x2, y, labelColor = GREY_TEXT, valueColor = "#111111") {
      doc.font("Helvetica").fontSize(9).fillColor(labelColor).text(label, x1, y);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(valueColor).text(value, x2, y);
    }
 
    /** Page footer */
    function drawFooter(doc, pageNum, totalPages) {
      doc.save()
         .strokeColor(GREEN_LINE).lineWidth(0.5)
         .moveTo(L, FOOTER_Y - 6).lineTo(R, FOOTER_Y - 6).stroke()
         .font("Helvetica").fontSize(8).fillColor("#999999")
         .text("AyamTech Farm Management System", L, FOOTER_Y, { width: W, align: "left" })
         .text(`Page ${pageNum} of ${totalPages}`,   L, FOOTER_Y, { width: W, align: "right" })
         .restore();
    }
 
    // ── Create document ──────────────────────────────────────
    const doc = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: false });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
      `attachment; filename=AyamTech_Executive_Summary_${new Date().toISOString().split("T")[0]}.pdf`);
    doc.pipe(res);
 
    // ════════════════════════════════════════════════════════
    //  PAGE 1
    // ════════════════════════════════════════════════════════
    doc.addPage();
    let y = 0;
 
    // ── Header banner ──
    fillRect(doc, 0, 0, 595.28, 90, GREEN_MID);
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#FFFFFF")
       .text("AYAMTECH FARM", L, 20, { width: W, align: "center" });
    doc.font("Helvetica").fontSize(12).fillColor("#C8E6C9")
       .text("Executive Performance Summary", L, 48, { width: W, align: "center" });
    doc.font("Helvetica").fontSize(9).fillColor("#A5D6A7")
       .text(`Generated: ${new Date().toLocaleDateString("en-MY", { dateStyle: "long" })}`,
             L, 68, { width: W, align: "center" });
 
    y = 108; // first content starts here
 
    // ── KPI cards row ──
    // Four cards across the page
    const cards = [
      { label: "Total Revenue",  value: fmt(revenue),   sub: "All sold batches"  },
      { label: "Total Cost",     value: fmt(totalCost), sub: "All categories"    },
      { label: "Net Profit",     value: fmt(profit),    sub: profit >= 0 ? "Profitable" : "Net loss" },
      { label: "Profit Margin",  value: `${margin}%`,   sub: "Revenue retained"  },
    ];
 
    const cardW = 115;
    const cardGap = 8;
    const cardStartX = L;
 
    cards.forEach((card, i) => {
      const cx = cardStartX + i * (cardW + cardGap);
      const isProfit = i === 2;
      const profitColor = profit >= 0 ? GREEN_MID : RED_DARK;
 
      fillRect(doc, cx, y, cardW, 60, "#FFFFFF");
      // card border
      doc.save().rect(cx, y, cardW, 60).stroke(GREEN_LINE).restore();
      // top accent bar
      fillRect(doc, cx, y, cardW, 4, isProfit ? profitColor : GREEN_MID);
 
      doc.font("Helvetica").fontSize(7.5).fillColor(GREY_TEXT)
         .text(card.label.toUpperCase(), cx + 6, y + 10, { width: cardW - 12 });
      doc.font("Helvetica-Bold").fontSize(isProfit ? 10 : 10.5)
         .fillColor(isProfit ? profitColor : GREEN_DARK)
         .text(card.value, cx + 6, y + 24, { width: cardW - 12 });
      doc.font("Helvetica").fontSize(7).fillColor("#888888")
         .text(card.sub, cx + 6, y + 42, { width: cardW - 12 });
    });
 
    y += 72;
 
    // ── Insight banner ──
    fillRect(doc, L, y, W, 24, GREEN_LIGHT);
    doc.font("Helvetica").fontSize(8.5).fillColor(GREEN_DARK)
       .text(
         `💡  For every RM 1.00 of revenue, the farm retains RM ${(parseFloat(margin) / 100).toFixed(2)} as profit.`,
         L + 10, y + 7, { width: W - 20 }
       );
    y += 36;
 
    // ── Section 1: Financial overview ──
    y = sectionHeading(doc, "1.  FINANCIAL PERFORMANCE OVERVIEW", y);
 
    // Two-column layout: Revenue details left | Cost details right
    const col1 = L;
    const col2 = L + W / 2 + 10;
 
    fillRect(doc, col1,     y, W / 2 - 5, 80, GREY_LIGHT);
    fillRect(doc, col2 - 5, y, W / 2 - 5, 80, GREY_LIGHT);
 
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GREEN_MID)
       .text("REVENUE", col1 + 8, y + 8);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(RED_DARK)
       .text("COST BREAKDOWN", col2 + 3, y + 8);
 
    kvRow(doc, "Gross Revenue",   fmt(revenue),    col1 + 8, col1 + 90, y + 22);
    kvRow(doc, "Chick Purchase",  fmt(chickCost),  col2 + 3, col2 + 90, y + 22);
    kvRow(doc, "Total Cost",      fmt(totalCost),  col1 + 8, col1 + 90, y + 36);
    kvRow(doc, "Feed Cost",       fmt(feedCost),   col2 + 3, col2 + 90, y + 36);
    kvRow(doc, "Net Profit",      fmt(profit),     col1 + 8, col1 + 90, y + 50,
          GREY_TEXT, profit >= 0 ? GREEN_MID : RED_DARK);
    kvRow(doc, "Medication",      fmt(medCost),    col2 + 3, col2 + 90, y + 50);
    kvRow(doc, "Profit Margin",   `${margin}%`,    col1 + 8, col1 + 90, y + 64);
    kvRow(doc, "Mortality Loss",  fmt(mortalityLoss), col2 + 3, col2 + 90, y + 64);
 
    y += 92;
 
    // ── Section 2: Cost breakdown table ──
    y = sectionHeading(doc, "2.  COST BREAKDOWN", y);
 
    // Table header
    fillRect(doc, L, y, W, 20, GREEN_MID);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF");
    doc.text("Cost Component",  L  + 8,  y + 5, { width: 200 });
    doc.text("Amount (RM)",     L  + 240, y + 5, { width: 110 });
    doc.text("% of Total Cost", L  + 360, y + 5, { width: 120 });
    y += 20;
 
    const costRows = [
      ["Chick Purchase",  fmt(chickCost),      pct(chickCost,      totalCost)],
      ["Feed Cost",       fmt(feedCost),        pct(feedCost,       totalCost)],
      ["Medication Cost", fmt(medCost),         pct(medCost,        totalCost)],
      ["Mortality Loss",  fmt(mortalityLoss),   pct(mortalityLoss,  totalCost)],
    ];
 
    costRows.forEach((row, i) => {
      if (i % 2 === 0) fillRect(doc, L, y, W, 18, GREY_LIGHT);
      doc.font("Helvetica").fontSize(9).fillColor("#222222");
      doc.text(row[0], L + 8,   y + 4, { width: 200 });
      doc.text(row[1], L + 240, y + 4, { width: 110 });
      doc.text(row[2], L + 360, y + 4, { width: 120 });
      y += 18;
    });
 
    // Total row
    fillRect(doc, L, y, W, 20, GREEN_DARK);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF");
    doc.text("TOTAL",          L + 8,   y + 5, { width: 200 });
    doc.text(fmt(totalCost),   L + 240, y + 5, { width: 110 });
    doc.text("100%",           L + 360, y + 5, { width: 120 });
    y += 32;
 
    // ── Section 3: FCR & Mortality ──
    y = sectionHeading(doc, "3.  FCR & MORTALITY ANALYSIS", y);
 
    const fcrStatus      = parseFloat(avgFCR) <= 1.6 ? "Good ✓"    : parseFloat(avgFCR) <= 1.8 ? "Fair ⚠" : "Poor ✗";
    const fcrColor       = parseFloat(avgFCR) <= 1.6 ? GREEN_MID   : parseFloat(avgFCR) <= 1.8 ? "#E65100" : RED_DARK;
    const mortStatus     = parseFloat(mortalityRate) <= 3 ? "Excellent ✓" : parseFloat(mortalityRate) <= 5 ? "Normal ✓" : "High ✗";
    const mortColor      = parseFloat(mortalityRate) <= 3 ? GREEN_MID    : parseFloat(mortalityRate) <= 5 ? "#E65100"  : RED_DARK;
 
    // Two metric boxes
    const mW = (W - 10) / 2;
 
    fillRect(doc, L,          y, mW, 54, GREY_LIGHT);
    fillRect(doc, L + mW + 10, y, mW, 54, GREY_LIGHT);
    fillRect(doc, L,           y, mW, 4,  fcrColor);
    fillRect(doc, L + mW + 10, y, mW, 4,  mortColor);
 
    doc.font("Helvetica").fontSize(8).fillColor(GREY_TEXT)
       .text("FEED CONVERSION RATIO (FCR)", L + 8, y + 10, { width: mW - 16 });
    doc.font("Helvetica-Bold").fontSize(18).fillColor(fcrColor)
       .text(avgFCR, L + 8, y + 22, { width: mW - 16 });
    doc.font("Helvetica").fontSize(8).fillColor(fcrColor)
       .text(`${fcrStatus}  -  Target: <= 1.6`, L + 8, y + 42, { width: mW - 16 });
 
    doc.font("Helvetica").fontSize(8).fillColor(GREY_TEXT)
       .text("MORTALITY RATE", L + mW + 18, y + 10, { width: mW - 16 });
    doc.font("Helvetica-Bold").fontSize(18).fillColor(mortColor)
       .text(`${mortalityRate}%`, L + mW + 18, y + 22, { width: mW - 16 });
    doc.font("Helvetica").fontSize(8).fillColor(mortColor)
       .text(`${mortStatus}  —  Industry avg: 3–5%`, L + mW + 18, y + 42, { width: mW - 16 });
 
    y += 60;
 
    drawFooter(doc, 1, 2);
 
    // ════════════════════════════════════════════════════════
    //  PAGE 2
    // ════════════════════════════════════════════════════════
    doc.addPage();
    y = 0;
 
    // ── Page 2 header ──
    fillRect(doc, 0, 0, 595.28, 50, GREEN_MID);
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#FFFFFF")
       .text("AYAMTECH FARM  —  Executive Summary (continued)", L, 16, { width: W, align: "center" });
    y = 66;
 
    // ── Section 4: Batch performance ──
    y = sectionHeading(doc, "4.  BATCH PERFORMANCE ANALYSIS", y);
 
    // Highlight cards for top / worst batch
    if (topBatch) {
      const topMargin = topBatch.revenue > 0
        ? ((topBatch.profit / topBatch.revenue) * 100).toFixed(1) : "0.0";
      fillRect(doc, L, y, W, 44, GREEN_LIGHT);
      fillRect(doc, L, y, 4, 44, GREEN_MID);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(GREEN_DARK)
         .text("TOP PERFORMING BATCH", L + 12, y + 7);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(GREEN_DARK)
         .text(topBatch.batch_id, L + 12, y + 19);
      doc.font("Helvetica").fontSize(8.5).fillColor(GREY_TEXT)
         .text(
           `Revenue: ${fmt(topBatch.revenue)}   |   Profit: ${fmt(topBatch.profit)}   |   Margin: ${topMargin}%`,
           L + 12, y + 32
         );
      y += 52;
    }
 
    if (worstBatch) {
      const worstMargin = worstBatch.revenue > 0
        ? ((worstBatch.profit / worstBatch.revenue) * 100).toFixed(1) : "0.0";
      fillRect(doc, L, y, W, 44, RED_LIGHT);
      fillRect(doc, L, y, 4, 44, RED_DARK);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(RED_DARK)
         .text("BATCH NEEDING ATTENTION", L + 12, y + 7);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(RED_DARK)
         .text(worstBatch.batch_id, L + 12, y + 19);
      doc.font("Helvetica").fontSize(8.5).fillColor(GREY_TEXT)
         .text(
           `Revenue: ${fmt(worstBatch.revenue)}   |   Loss: ${fmt(Math.abs(worstBatch.profit))}   |   Margin: ${worstMargin}%`,
           L + 12, y + 32
         );
      y += 52;
    }
 
    y += 10;
 
    // ── Batch table ──
    // Column x positions
    const C = {
      id:     L,
      rev:    L + 110,
      cost:   L + 220,
      profit: L + 320,
      margin: L + 420,
      status: L + 470,
    };
 
    // Table header
    fillRect(doc, L, y, W, 20, GREEN_MID);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#FFFFFF");
    doc.text("Batch ID",  C.id     + 4, y + 5);
    doc.text("Revenue",   C.rev    + 4, y + 5);
    doc.text("Cost",      C.cost   + 4, y + 5);
    doc.text("Profit",    C.profit + 4, y + 5);
    doc.text("Margin",    C.margin + 4, y + 5);
    doc.text("Status",    C.status + 4, y + 5);
    y += 20;
 
    batches.slice(0, 15).forEach((batch, i) => {
      // Page overflow guard
      if (y > FOOTER_Y - 30) {
        drawFooter(doc, 2, 2);
        doc.addPage();
        y = 50;
        // Reprint header on overflow page
        fillRect(doc, L, y, W, 20, GREEN_MID);
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#FFFFFF");
        doc.text("Batch ID", C.id + 4, y + 5);
        doc.text("Revenue",  C.rev + 4, y + 5);
        doc.text("Cost",     C.cost + 4, y + 5);
        doc.text("Profit",   C.profit + 4, y + 5);
        doc.text("Margin",   C.margin + 4, y + 5);
        doc.text("Status",   C.status + 4, y + 5);
        y += 20;
      }
 
      const batchProfit  = parseFloat(batch.profit)  || 0;
      const batchRev     = parseFloat(batch.revenue)  || 0;
      const batchMargin  = batchRev > 0 ? ((batchProfit / batchRev) * 100).toFixed(1) : "0.0";
      const isProfitable = batchProfit >= 0;
      const isBreakEven  = isProfitable && parseFloat(batchMargin) < 20;
      const statusLabel  = isProfitable ? (isBreakEven ? "Break-even" : "Profitable") : "Loss";
      const statusColor  = isProfitable ? (isBreakEven ? "#E65100" : GREEN_MID) : RED_DARK;
      const profitColor  = isProfitable ? GREEN_MID : RED_DARK;
 
      if (i % 2 === 0) fillRect(doc, L, y, W, 18, GREY_LIGHT);
      hRule(doc, y + 18, "#E0E0E0");
 
      doc.font("Helvetica").fontSize(8.5).fillColor("#222222");
      doc.text(batch.batch_id,       C.id     + 4, y + 4, { width: 100 });
      doc.text(fmt(batchRev),        C.rev    + 4, y + 4, { width: 105 });
      doc.text(fmt(batch.cost),      C.cost   + 4, y + 4, { width: 95  });
      doc.fillColor(profitColor)
         .text(`${isProfitable ? "+" : ""}${fmt(batchProfit)}`, C.profit + 4, y + 4, { width: 95 });
      doc.fillColor(statusColor)
         .text(`${batchMargin}%`, C.margin + 4, y + 4, { width: 45 });
      doc.font("Helvetica-Bold").fillColor(statusColor)
         .text(statusLabel, C.status + 4, y + 4, { width: 70 });
      y += 18;
    });
 
    // ── Summary note at bottom of table ──
    y += 8;
    fillRect(doc, L, y, W, 28, GREY_LIGHT);
    doc.font("Helvetica").fontSize(8).fillColor(GREY_TEXT)
       .text(
         "Margin guide:  Profitable = margin ≥ 20%   |   Break-even = 0–19%   |   Loss = negative margin",
         L + 10, y + 9, { width: W - 20 }
       );
    y += 36;
 
    drawFooter(doc, 2, 2);
 
    doc.end();
 
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;