const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// DB status values used by driver module
// You said there are 3 statuses:
// assigned, out of delivery, completed
const normalizeStatus = (status) => {
    if (!status) return '';

    const value = status.toString().toLowerCase().trim();

    if (value === 'assigned') return 'assigned';

    if (
        value === 'out of delivery' ||
        value === 'out for delivery' ||
        value === 'out_for_delivery' ||
        value === 'out-of-delivery' ||
        value === 'start delivery' ||
        value === 'started'
    ) {
        return 'out of delivery';
    }

    if (
        value === 'completed' ||
        value === 'complete' ||
        value === 'delivered'
    ) {
        return 'completed';
    }

    return value;
};

const formatStatus = (status) => {
    const value = normalizeStatus(status);

    if (value === 'assigned') return 'Assigned';
    if (value === 'out of delivery') return 'Out of Delivery';
    if (value === 'completed') return 'Completed';

    return status || 'Unknown';
};

const isValidDeliveryStatus = (status) => {
    return ['assigned', 'out of delivery', 'completed'].includes(status);
};

// Correct relationship:
// delivery.sales_id -> sales.sales_id -> orders.order_id
const deliverySelectQuery = `
    SELECT
        d.delivery_id,
        d.delivery_date,
        d.delivery_address,
        d.delivery_status,
        d.remarks,
        d.user_id AS driver_id,
        d.sales_id,
        d.generated_at,
        d.assigned_at,
        d.out_for_delivery_at,
        d.completed_at,

        s.order_id,
        s.sales_date,
        s.quantity_sold,
        s.total_weight_kg,
        s.price_per_kg,
        s.total_amount,
        s.batch_id AS sales_batch_id,
        s.customer_id AS sales_customer_id,

        o.order_status,
        o.requested_quantity,
        o.delivery_type,
        o.requested_delivery_date,
        o.batch_id AS order_batch_id,
        o.customer_id AS order_customer_id,

        COALESCE(s.batch_id, o.batch_id) AS batch_id,
        COALESCE(s.customer_id, o.customer_id) AS customer_id,

        c.address AS customer_address,
        c.area AS customer_area,

        customer_user.full_name AS customer_name,
        customer_user.phone_no AS customer_phone,
        customer_user.email AS customer_email,

        driver_user.full_name AS driver_name,
        driver_user.phone_no AS driver_phone,
        driver_user.vehicle_no,

        b.batch_status,
        b.total_chicks AS remaining_chicks,

        COALESCE(cp.original_chicks, b.total_chicks) AS original_chicks

    FROM delivery d
    LEFT JOIN sales s
        ON s.sales_id = d.sales_id
    LEFT JOIN orders o
        ON o.order_id = s.order_id
    LEFT JOIN customer c
        ON c.customer_id = COALESCE(s.customer_id, o.customer_id)
    LEFT JOIN app_user customer_user
        ON customer_user.user_id = c.user_id
    LEFT JOIN app_user driver_user
        ON driver_user.user_id = d.user_id
    LEFT JOIN batch b
        ON b.batch_id = COALESCE(s.batch_id, o.batch_id)
    LEFT JOIN (
        SELECT 
            batch_id,
            SUM(quantity)::INT AS original_chicks
        FROM chick_purchase
        GROUP BY batch_id
    ) cp
        ON cp.batch_id = COALESCE(s.batch_id, o.batch_id)
`;

// ------------------- DRIVER DASHBOARD -------------------
// GET /driver/dashboard
exports.getDriverDashboard = async (req, res) => {
    const driverId = req.user.user_id;

    try {
        const deliveriesResult = await pool.query(
            `${deliverySelectQuery}
             WHERE d.user_id = $1
               AND d.delivery_date = CURRENT_DATE
             ORDER BY 
                CASE 
                    WHEN LOWER(d.delivery_status) = 'assigned' THEN 1
                    WHEN LOWER(d.delivery_status) IN ('out of delivery', 'out for delivery') THEN 2
                    WHEN LOWER(d.delivery_status) = 'completed' THEN 3
                    ELSE 4
                END,
                d.delivery_id ASC`,
            [driverId]
        );

        const statsResult = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE LOWER(delivery_status) = 'assigned')::INT AS assigned_count,
                COUNT(*) FILTER (WHERE LOWER(delivery_status) IN ('out of delivery', 'out for delivery'))::INT AS out_for_delivery_count,
                COUNT(*) FILTER (WHERE LOWER(delivery_status) = 'completed')::INT AS completed_count,
                COUNT(*)::INT AS total_count
             FROM delivery
             WHERE user_id = $1
               AND delivery_date = CURRENT_DATE`,
            [driverId]
        );

        const driverResult = await pool.query(
            `SELECT
                user_id,
                full_name,
                username,
                email,
                phone_no,
                role,
                status,
                vehicle_no
             FROM app_user
             WHERE user_id = $1`,
            [driverId]
        );

        const deliveries = deliveriesResult.rows.map((row) => ({
            ...row,
            display_status: formatStatus(row.delivery_status),
            customer_full_address: [
                row.delivery_address || row.customer_address,
                row.customer_area,
                'Kedah',
                'Malaysia'
            ].filter(Boolean).join(', ')
        }));

        const stats = statsResult.rows[0] || {
            assigned_count: 0,
            out_for_delivery_count: 0,
            completed_count: 0,
            total_count: 0
        };

        const driver = driverResult.rows[0] || null;

        res.json({
            driver,

            vehicle: {
                vehicle_no: driver?.vehicle_no || null,
                fuel_level: 65,
                last_location: 'Farm',
                next_service: 'Not tracked'
            },

            stats,

            summary: {
                assigned: Number(stats.assigned_count || 0),
                out_for_delivery: Number(stats.out_for_delivery_count || 0),
                completed: Number(stats.completed_count || 0),
                late: 0
            },

            deliveries
        });

    } catch (err) {
        console.error('getDriverDashboard error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- MY DELIVERIES FULL LIST -------------------
// GET /driver/deliveries
exports.getDriverDeliveries = async (req, res) => {
    const driverId = req.user.user_id;
    const { status, date } = req.query;

    try {
        let query = `${deliverySelectQuery} WHERE d.user_id = $1`;
        const params = [driverId];

        if (status && status !== 'All' && status !== 'all') {
            params.push(normalizeStatus(status));
            query += ` AND LOWER(d.delivery_status) = $${params.length}`;
        }

        if (date) {
            params.push(date);
            query += ` AND d.delivery_date = $${params.length}`;
        }

        query += `
            ORDER BY 
                d.delivery_date DESC,
                CASE 
                    WHEN LOWER(d.delivery_status) = 'assigned' THEN 1
                    WHEN LOWER(d.delivery_status) IN ('out of delivery', 'out for delivery') THEN 2
                    WHEN LOWER(d.delivery_status) = 'completed' THEN 3
                    ELSE 4
                END,
                d.delivery_id DESC
        `;

        const result = await pool.query(query, params);

        const deliveries = result.rows.map((row) => ({
            ...row,
            display_status: formatStatus(row.delivery_status),
            customer_full_address: [
                row.delivery_address || row.customer_address,
                row.customer_area,
                'Kedah',
                'Malaysia'
            ].filter(Boolean).join(', ')
        }));

        res.json(deliveries);

    } catch (err) {
        console.error('getDriverDeliveries error:', err);
        res.status(500).json({ error: err.message });
    }
};


// ------------------- UPDATE DELIVERY STATUS -------------------
// PATCH /driver/deliveries/:delivery_id/status
exports.updateDeliveryStatus = async (req, res) => {
    const driverId = req.user.user_id;
    const { delivery_id } = req.params;
    const requestedStatus =
    req.body.delivery_status ||
    req.body.status ||
    req.body.newStatus;

    const newStatus = normalizeStatus(requestedStatus);

    if (!isValidDeliveryStatus(newStatus)) {
        return res.status(400).json({
            error: 'Invalid delivery status. Use assigned, out of delivery, or completed.'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const deliveryCheck = await client.query(
        `SELECT
            d.delivery_id,
            d.sales_id,
            d.user_id,
            d.delivery_status,
            d.delivery_date,
            s.order_id
        FROM delivery d
        LEFT JOIN sales s
            ON s.sales_id = d.sales_id
        WHERE d.delivery_id = $1
        AND d.user_id = $2
        AND d.delivery_date = CURRENT_DATE
        FOR UPDATE OF d`,
        [delivery_id, driverId]
    );

        if (deliveryCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Delivery not found, not assigned to this driver, or not scheduled for today'
            });
        }

        const currentDelivery = deliveryCheck.rows[0];
        const currentStatus = normalizeStatus(currentDelivery.delivery_status);

        // Status flow validation
        if (currentStatus === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Completed delivery cannot be changed'
            });
        }

        if (currentStatus === 'assigned' && newStatus === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Please start delivery before completing it'
            });
        }

        if (currentStatus === 'out of delivery' && newStatus === 'assigned') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Cannot change delivery back to assigned'
            });
        }
        let remarkText = '';

        if (newStatus === 'assigned') {
            remarkText = 'Driver assigned, waiting to start delivery';
        }

        if (newStatus === 'out of delivery') {
            remarkText = 'Driver is currently delivering the order';
        }

        if (newStatus === 'completed') {
            remarkText = 'Successfully delivered to customer';
        }

        let updateQuery = `
            UPDATE delivery
            SET 
                delivery_status = $1,
                remarks = $2
        `;

        const updateParams = [newStatus, remarkText];

        if (newStatus === 'assigned') {
            updateQuery += `, assigned_at = COALESCE(assigned_at, CURRENT_TIMESTAMP)`;
        }

        if (newStatus === 'out of delivery') {
            updateQuery += `, out_for_delivery_at = COALESCE(out_for_delivery_at, CURRENT_TIMESTAMP)`;
        }

        if (newStatus === 'completed') {
            updateQuery += `, completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)`;
        }

        updateParams.push(delivery_id, driverId);

        updateQuery += `
            WHERE delivery_id = $${updateParams.length - 1}
              AND user_id = $${updateParams.length}
            RETURNING *
        `;

        const updatedDelivery = await client.query(updateQuery, updateParams);

        let updatedOrder = null;

        // When delivery completed, order must become completed too
        if (newStatus === 'completed' && currentDelivery.order_id) {
            const orderResult = await client.query(
                `UPDATE orders
                 SET order_status = 'Completed'
                 WHERE order_id = $1
                 RETURNING *`,
                [currentDelivery.order_id]
            );

            updatedOrder = orderResult.rows[0] || null;
        }

        await client.query('COMMIT');

        res.json({
            message:
                newStatus === 'completed'
                    ? 'Delivery completed and order status updated to Completed'
                    : `Delivery status updated to ${formatStatus(newStatus)}`,
            delivery: updatedDelivery.rows[0],
            order: updatedOrder
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('updateDeliveryStatus error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// ------------------- DRIVER PROFILE -------------------
// GET /driver/profile
exports.getDriverProfile = async (req, res) => {
    const driverId = req.user.user_id;

    try {
        const result = await pool.query(
            `SELECT
                user_id,
                full_name,
                username,
                email,
                phone_no,
                role,
                status,
                vehicle_no
             FROM app_user
             WHERE user_id = $1`,
            [driverId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Driver profile not found'
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error('getDriverProfile error:', err);
        res.status(500).json({ error: err.message });
    }
};

// PATCH /driver/profile
exports.updateDriverProfile = async (req, res) => {
    const driverId = req.user.user_id;
    const { email, phone_no } = req.body;

    try {
        const result = await pool.query(
            `UPDATE app_user
             SET
                email = $1,
                phone_no = $2
             WHERE user_id = $3
             RETURNING
                user_id,
                full_name,
                username,
                email,
                phone_no,
                role,
                status,
                vehicle_no`,
            [email || null, phone_no || null, driverId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Driver profile not found'
            });
        }

        res.json({
            message: 'Driver profile updated successfully',
            profile: result.rows[0]
        });

    } catch (err) {
        console.error('updateDriverProfile error:', err);
        res.status(500).json({ error: err.message });
    }
};

// PATCH /driver/profile/change-password
exports.changeDriverPassword = async (req, res) => {
    const driverId = req.user.user_id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 5) {
        return res.status(400).json({
            error: 'Password must be at least 5 characters'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await pool.query(
            `UPDATE app_user
             SET password = $1
             WHERE user_id = $2
             RETURNING user_id`,
            [hashedPassword, driverId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Driver account not found'
            });
        }

        res.json({
            message: 'Password changed successfully'
        });

    } catch (err) {
        console.error('changeDriverPassword error:', err);
        res.status(500).json({ error: err.message });
    }
};

const driverDeliveryScheduleQuery = `
    SELECT
        d.delivery_id,
        d.delivery_date,
        d.delivery_address,
        d.delivery_status,
        d.remarks,
        d.user_id AS driver_id,
        d.sales_id,
        d.generated_at,
        d.assigned_at,
        d.out_for_delivery_at,
        d.completed_at,

        s.order_id,
        s.sales_date,
        s.quantity_sold,
        s.total_weight_kg,
        s.price_per_kg,
        s.total_amount,
        s.batch_id AS sales_batch_id,
        s.customer_id AS sales_customer_id,

        o.order_status,
        o.requested_quantity,
        o.delivery_type,
        o.requested_delivery_date,
        o.batch_id AS order_batch_id,
        o.customer_id AS order_customer_id,

        COALESCE(s.batch_id, o.batch_id) AS batch_id,
        COALESCE(s.customer_id, o.customer_id) AS customer_id,

        c.address AS customer_address,
        c.area AS customer_area,

        customer_user.full_name AS customer_name,
        customer_user.phone_no AS customer_phone,
        customer_user.email AS customer_email,

        driver_user.full_name AS driver_name,
        driver_user.username AS driver_username,
        driver_user.phone_no AS driver_phone,
        driver_user.vehicle_no,

        b.batch_status,
        b.total_chicks AS remaining_chicks

    FROM delivery d
    LEFT JOIN sales s
        ON s.sales_id = d.sales_id
    LEFT JOIN orders o
        ON o.order_id = s.order_id
    LEFT JOIN customer c
        ON c.customer_id = COALESCE(s.customer_id, o.customer_id)
    LEFT JOIN app_user customer_user
        ON customer_user.user_id = c.user_id
    LEFT JOIN app_user driver_user
        ON driver_user.user_id = d.user_id
    LEFT JOIN batch b
        ON b.batch_id = COALESCE(s.batch_id, o.batch_id)
`;

const buildDeliveryViewModel = (row) => {
    const customerFullAddress = [
        row.delivery_address || row.customer_address,
        row.customer_area,
        'Kedah',
        'Malaysia'
    ].filter(Boolean).join(', ');

    return {
        ...row,
        display_status: formatStatus(row.delivery_status),
        normalized_status: normalizeStatus(row.delivery_status),
        customer_full_address: customerFullAddress
    };
};

// GET /driver/deliveries/page-data
exports.getDriverDeliveriesPageData = async (req, res) => {
    const driverId = req.user.user_id;

    try {
        const driverResult = await pool.query(
            `SELECT
                user_id,
                full_name,
                username,
                email,
                phone_no,
                role,
                status,
                vehicle_no
             FROM app_user
             WHERE user_id = $1`,
            [driverId]
        );

        // TODAY deliveries - let PostgreSQL decide CURRENT_DATE
        const todayResult = await pool.query(
            `${driverDeliveryScheduleQuery}
             WHERE d.user_id = $1
               AND d.delivery_date = CURRENT_DATE
             ORDER BY
                CASE 
                    WHEN LOWER(TRIM(d.delivery_status)) = 'assigned' THEN 1
                    WHEN LOWER(TRIM(d.delivery_status)) IN ('out of delivery', 'out for delivery') THEN 2
                    WHEN LOWER(TRIM(d.delivery_status)) = 'completed' THEN 3
                    ELSE 4
                END,
                COALESCE(d.assigned_at, d.generated_at) ASC,
                d.delivery_id ASC`,
            [driverId]
        );

        // FUTURE deliveries only
        const upcomingResult = await pool.query(
            `${driverDeliveryScheduleQuery}
             WHERE d.user_id = $1
               AND d.delivery_date > CURRENT_DATE
               AND LOWER(TRIM(d.delivery_status)) <> 'completed'
             ORDER BY
                d.delivery_date ASC,
                COALESCE(d.assigned_at, d.generated_at) ASC,
                d.delivery_id ASC`,
            [driverId]
        );

        // COMPLETED delivery history
        const completedResult = await pool.query(
            `${driverDeliveryScheduleQuery}
             WHERE d.user_id = $1
               AND LOWER(TRIM(d.delivery_status)) = 'completed'
             ORDER BY
                COALESCE(d.completed_at, d.delivery_date, d.generated_at) DESC,
                d.delivery_id DESC`,
            [driverId]
        );

        const statsResult = await pool.query(
            `SELECT
                COUNT(*) FILTER (
                    WHERE LOWER(TRIM(delivery_status)) = 'assigned'
                    AND delivery_date = CURRENT_DATE
                )::INT AS pending_count,

                COUNT(*) FILTER (
                    WHERE LOWER(TRIM(delivery_status)) IN ('out of delivery', 'out for delivery')
                    AND delivery_date = CURRENT_DATE
                )::INT AS in_transit_count,

                COUNT(*) FILTER (
                    WHERE LOWER(TRIM(delivery_status)) = 'completed'
                )::INT AS completed_count,

                COUNT(*) FILTER (
                    WHERE delivery_date = CURRENT_DATE
                )::INT AS today_total_count,

                COUNT(*) FILTER (
                    WHERE delivery_date > CURRENT_DATE
                    AND LOWER(TRIM(delivery_status)) <> 'completed'
                )::INT AS upcoming_count
             FROM delivery
             WHERE user_id = $1`,
            [driverId]
        );

        const today = todayResult.rows.map(buildDeliveryViewModel);
        const upcoming = upcomingResult.rows.map(buildDeliveryViewModel);
        const completed = completedResult.rows.map(buildDeliveryViewModel);

        const all = [
            ...today,
            ...upcoming,
            ...completed
        ];

        const driver = driverResult.rows[0] || null;

        const stats = statsResult.rows[0] || {
            pending_count: 0,
            in_transit_count: 0,
            completed_count: 0,
            today_total_count: 0,
            upcoming_count: 0
        };

        res.json({
            driver,
            vehicle: {
                vehicle_no: driver?.vehicle_no || null,
                fuel_level: 65,
                last_location: 'Farm',
                last_service: 'Not tracked',
                next_service: 'Not tracked'
            },
            stats,
            today,
            upcoming,
            completed,
            all
        });

    } catch (err) {
        console.error('getDriverDeliveriesPageData error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- ENHANCED DELIVERY DETAILS -------------------
// GET /driver/deliveries/:delivery_id

exports.getDriverDeliveryDetails = async (req, res) => {
    const driverId = req.user.user_id;
    const { delivery_id } = req.params;

    try {
        const result = await pool.query(
            `${driverDeliveryScheduleQuery}
             WHERE d.user_id = $1
               AND d.delivery_id = $2`,
            [driverId, delivery_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Delivery not found or not assigned to this driver'
            });
        }

        const delivery = buildDeliveryViewModel(result.rows[0]);

        res.json({
            ...delivery,
            route: {
                from: 'AyamTech Farm, Kedah, Malaysia',
                to: delivery.customer_full_address,
                estimated_time: 'Same-day Kedah delivery',
                distance: 'Estimated by map'
            }
        });

    } catch (err) {
        console.error('getDriverDeliveryDetails error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- UPDATE DELIVERY REMARKS -------------------
// PATCH /driver/deliveries/:delivery_id/remarks

exports.updateDriverDeliveryRemarks = async (req, res) => {
    const driverId = req.user.user_id;
    const { delivery_id } = req.params;
    const { remarks } = req.body;

    try {
        const result = await pool.query(
            `UPDATE delivery
             SET remarks = $1
             WHERE delivery_id = $2
               AND user_id = $3
             RETURNING *`,
            [remarks || '', delivery_id, driverId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Delivery not found or not assigned to this driver'
            });
        }

        res.json({
            message: 'Delivery remark updated successfully',
            delivery: result.rows[0]
        });

    } catch (err) {
        console.error('updateDriverDeliveryRemarks error:', err);
        res.status(500).json({ error: err.message });
    }
};