const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ------------------- TASKS -------------------
exports.getTasks = async (req, res) => {
    try {
        const tasks = await pool.query(
            'SELECT * FROM tasks WHERE assigned_worker_id = $1 ORDER BY task_date ASC',
            [req.user.user_id]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateTask = async (req, res) => {
    const { task_id } = req.params;
    const { status } = req.body;
    try {
        const updated = await pool.query(
            'UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *',
            [status, task_id]
        );
        res.json(updated.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// ------------------- FEED USAGE -------------------
// GET /worker/feed
exports.getFeed = async (req, res) => {
    try {
        const feedLogs = await pool.query(`
            SELECT *
            FROM feed_usage
            ORDER BY usage_date DESC
        `);

        res.json(feedLogs.rows);
    } catch (err) {
        console.error('getFeed error:', err);
        res.status(500).json({ error: err.message });
    }
};
// POST /worker/feed
exports.addFeed = async (req, res) => {
    const {
        batch_id,
        feed_type,
        quantity_kg,
        cost,
        usage_date
    } = req.body;

    if (!batch_id || !feed_type || !quantity_kg || !usage_date) {
        return res.status(400).json({
            error: 'batch_id, feed_type, quantity_kg and usage_date are required'
        });
    }

    const quantity = Number(quantity_kg);
    const totalCost = Number(cost || 0);

    if (Number.isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
            error: 'Quantity must be greater than 0'
        });
    }

    if (Number.isNaN(totalCost) || totalCost < 0) {
        return res.status(400).json({
            error: 'Cost cannot be negative'
        });
    }

    try {
        const selectedDate = new Date(usage_date);
        const today = new Date();

        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            return res.status(400).json({
                error: 'Feed date cannot be in the future'
            });
        }

        // Workers can feed any active batch.
        const batchCheck = await pool.query(
            `SELECT batch_id
             FROM batch
             WHERE batch_id = $1
               AND batch_status IN ('Growing', 'Ready for Sale')`,
            [batch_id]
        );

        if (batchCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Batch not found or batch is not active'
            });
        }

        const result = await pool.query(
            `INSERT INTO feed_usage
                (batch_id, feed_type, quantity_kg, cost, user_id, usage_date)
             VALUES
                ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                batch_id,
                feed_type,
                quantity,
                totalCost,
                req.user.user_id,
                usage_date
            ]
        );

        res.status(201).json({
            message: 'Feed record saved successfully',
            record: result.rows[0],
        });
    } catch (err) {
        console.error('addFeed error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- MEDICATION -------------------
exports.getMedications = async (req, res) => {
    try {
        const meds = await pool.query(`
            SELECT *
            FROM medication_record
            ORDER BY medication_date DESC, medication_id DESC
        `);

        res.json(meds.rows);
    } catch (err) {
        console.error('getMedications error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /worker/medications/page-data
exports.getMedicationPageData = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [batches, recent] = await Promise.all([
            pool.query('SELECT * FROM get_worker_medication_batches()'),
            pool.query('SELECT * FROM get_worker_recent_medication_records($1, $2)', [userId, 10]),
        ]);

        res.json({
            batches: batches.rows,
            recentRecords: recent.rows,
        });
    } catch (err) {
        console.error('getMedicationPageData error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /worker/medications/recent
exports.getRecentMedicationRecords = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            'SELECT * FROM get_worker_recent_medication_records($1, $2)',
            [userId, 10]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('getRecentMedicationRecords error:', err);
        res.status(500).json({ error: err.message });
    }
};

// POST /worker/medications
exports.addMedication = async (req, res) => {
    const {
        batch_id,
        medication_name,
        dosage,
        quantity,
        cost,
        medication_date,
        remark
    } = req.body;

    if (!batch_id) {
        return res.status(400).json({ error: 'Please select a batch' });
    }

    if (!medication_name || medication_name.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter medication name' });
    }

    if (!dosage || dosage.trim().length === 0) {
        return res.status(400).json({ error: 'Please enter dosage' });
    }

    const quantityValue = Number(quantity);
    const costValue = Number(cost || 0);

    if (Number.isNaN(quantityValue) || quantityValue <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (Number.isNaN(costValue) || costValue < 0) {
        return res.status(400).json({ error: 'Cost cannot be negative' });
    }

    if (!medication_date) {
        return res.status(400).json({ error: 'Please select medication date' });
    }

    try {
        const selectedDate = new Date(medication_date);
        const today = new Date();

        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            return res.status(400).json({ error: 'Date cannot be in the future' });
        }

        const batchCheck = await pool.query(
            `SELECT batch_id
             FROM batch
             WHERE batch_id = $1
               AND batch_status IN ('Growing', 'Ready for Sale')`,
            [batch_id]
        );

        if (batchCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Batch not found or batch is not active'
            });
        }

        // Example saved value: /uploads/mabc123.png
        const medicationPhoto = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await pool.query(
            `INSERT INTO medication_record
                (batch_id, medication_name, dosage, quantity, cost, user_id, medication_date, remark, medication_photo)
             VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                batch_id,
                medication_name.trim(),
                dosage.trim(),
                quantityValue,
                costValue,
                req.user.user_id,
                medication_date,
                remark || null,
                medicationPhoto
            ]
        );

        res.status(201).json({
            message: 'Medication record saved successfully',
            record: result.rows[0],
        });
    } catch (err) {
        console.error('addMedication error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- MORTALITY -------------------

// GET /worker/mortality
exports.getMortality = async (req, res) => {
    try {
        const mortality = await pool.query(`
            SELECT *
            FROM mortality_record
            ORDER BY mortality_date DESC, mortality_id DESC
        `);

        res.json(mortality.rows);
    } catch (err) {
        console.error('getMortality error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /worker/mortality/page-data
exports.getMortalityPageData = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [batches, recent, causeSummary] = await Promise.all([
            pool.query('SELECT * FROM get_worker_mortality_batches()'),
            pool.query(
                'SELECT * FROM get_worker_recent_mortality_records($1, $2)',
                [userId, 10]
            ),
            pool.query('SELECT * FROM get_worker_mortality_cause_summary()'),
        ]);

        res.json({
            batches: batches.rows,
            recentRecords: recent.rows,
            causeSummary: causeSummary.rows,
        });
    } catch (err) {
        console.error('getMortalityPageData error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /worker/mortality/recent
exports.getRecentMortalityRecords = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            'SELECT * FROM get_worker_recent_mortality_records($1, $2)',
            [userId, 10]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('getRecentMortalityRecords error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /worker/mortality/cause-summary
exports.getMortalityCauseSummary = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM get_worker_mortality_cause_summary()'
        );

        res.json(result.rows);
    } catch (err) {
        console.error('getMortalityCauseSummary error:', err);
        res.status(500).json({ error: err.message });
    }
};

// POST /worker/mortality
exports.addMortality = async (req, res) => {
    const {
        batch_id,
        quantity_dead,
        cause,
        mortality_date
    } = req.body;

    if (!batch_id) {
        return res.status(400).json({
            error: 'Please select a batch'
        });
    }

    const quantityDead = Number(quantity_dead);

    if (!Number.isInteger(quantityDead) || quantityDead <= 0) {
        return res.status(400).json({
            error: 'Please enter a valid number of deaths'
        });
    }

    if (!cause || cause.trim().length === 0 || cause.trim().length > 255) {
        return res.status(400).json({
            error: 'Please select a cause'
        });
    }

    if (!mortality_date) {
        return res.status(400).json({
            error: 'Please select a valid date'
        });
    }

    const client = await pool.connect();

    try {
        const selectedDate = new Date(mortality_date);
        const today = new Date();

        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            return res.status(400).json({
                error: 'Please select a valid date'
            });
        }

        await client.query('BEGIN');

        const batchCheck = await client.query(
            `SELECT batch_id, total_chicks
             FROM batch
             WHERE batch_id = $1
               AND batch_status IN ('Growing', 'Ready for Sale')
             FOR UPDATE`,
            [batch_id]
        );

        if (batchCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Batch not found or batch is not active'
            });
        }

        const currentChicks = Number(batchCheck.rows[0].total_chicks || 0);

        if (quantityDead > currentChicks) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Deaths cannot exceed remaining chicks'
            });
        }

        const mortalityResult = await client.query(
            `INSERT INTO mortality_record
                (batch_id, quantity_dead, cause, user_id, mortality_date)
             VALUES
                ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                batch_id,
                quantityDead,
                cause.trim(),
                req.user.user_id,
                mortality_date
            ]
        );

        const updatedBatch = await client.query(
            `UPDATE batch
             SET total_chicks = total_chicks - $1
             WHERE batch_id = $2
             RETURNING *`,
            [quantityDead, batch_id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Mortality record saved successfully',
            record: mortalityResult.rows[0],
            updatedBatch: updatedBatch.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('addMortality error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};



// ------------------- BATCHES -------------------
exports.getBatches = async (req, res) => {
    try {
        const batches = await pool.query(
            `SELECT *
             FROM batch
             WHERE batch_status IN ('Growing', 'Ready for Sale')
             ORDER BY batch_id ASC`
        );

        res.json(batches.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// ------------------- TODAY SUMMARY -------------------
exports.getTodaySummary = async (req, res) => {
    const userId = req.user.user_id;
    const today = new Date().toISOString().split('T')[0];

    try {
        const [feed, medication, mortality, batches] = await Promise.all([
            pool.query(
                'SELECT COUNT(*) FROM feed_usage WHERE user_id = $1 AND usage_date = $2',
                [userId, today]
            ),
            pool.query(
                'SELECT COUNT(*) FROM medication_record WHERE user_id = $1 AND medication_date = $2',
                [userId, today]
            ),
            pool.query(
                'SELECT COUNT(*) FROM mortality_record WHERE user_id = $1 AND mortality_date = $2',
                [userId, today]
            ),
            pool.query(
                `SELECT COUNT(*) 
                 FROM batch 
                 WHERE batch_status IN ('Growing', 'Ready for Sale')`
            ),
        ]);

        res.json({
            feed_records: parseInt(feed.rows[0].count),
            medication_records: parseInt(medication.rows[0].count),
            mortality_records: parseInt(mortality.rows[0].count),
            batches_handled: parseInt(batches.rows[0].count),
        });
    } catch (err) {
        console.error('getTodaySummary error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- ALERTS -------------------
exports.getAlerts = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                b.batch_id, 
                b.total_chicks AS current_chicks,
                COALESCE(SUM(m.quantity_dead), 0) AS deaths,
                (b.total_chicks + COALESCE(SUM(m.quantity_dead), 0)) AS original_chicks
             FROM batch b
             LEFT JOIN mortality_record m 
                ON b.batch_id = m.batch_id
             WHERE b.batch_status IN ('Growing', 'Ready for Sale')
             GROUP BY b.batch_id, b.total_chicks
             HAVING (b.total_chicks + COALESCE(SUM(m.quantity_dead), 0)) > 0
                AND (
                    COALESCE(SUM(m.quantity_dead), 0)::float / 
                    (b.total_chicks + COALESCE(SUM(m.quantity_dead), 0))
                ) > 0.05`
        );

        const alerts = result.rows.map(row => ({
            title: `High Mortality - Batch ${row.batch_id}`,
            message: `${row.deaths} deaths out of ${row.original_chicks} original chicks (${((row.deaths / row.original_chicks) * 100).toFixed(1)}%)`,
        }));

        res.json(alerts);
    } catch (err) {
        console.error('getAlerts error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ─── ADD THIS TO YOUR workerController.js ────────────────────────────────────
// GET /worker/batch-status
// Returns each batch assigned to this worker with today's record flags,
// last feed info, mortality rate, and age calculated from start_date.

exports.getBatchStatus = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM get_worker_batch_status()'
        );

        res.json(result.rows);
    } catch (err) {
        console.error('getBatchStatus error:', err);
        res.status(500).send('Server Error');
    }
};

exports.getAllBatches = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM get_worker_all_batches()');
        res.json(result.rows);
    } catch (err) {
        console.error('getAllBatches error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getBatchDetails = async (req, res) => {
    const { batch_id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM get_worker_batch_details($1)',
            [batch_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('getBatchDetails error:', err);
        res.status(500).json({ error: err.message });
    }
};
// GET /worker/feed/page-data
exports.getFeedPageData = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [batches, recent] = await Promise.all([
            pool.query('SELECT * FROM get_worker_feed_batches()'),
            pool.query('SELECT * FROM get_worker_recent_feed_records($1, $2)', [userId, 10]),
        ]);

        res.json({
            batches: batches.rows,
            recentRecords: recent.rows,
        });
    } catch (err) {
        console.error('getFeedPageData error:', err);
        res.status(500).json({ error: err.message });
    }
};
// GET /worker/feed/recent
exports.getRecentFeedRecords = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            'SELECT * FROM get_worker_recent_feed_records($1, $2)',
            [userId, 10]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('getRecentFeedRecords error:', err);
        res.status(500).json({ error: err.message });
    }
};
// GET /worker/performance
exports.getWorkerPerformance = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [
            statsResult,
            dailyResult,
            recentResult,
            teamResult,
            batchResult
        ] = await Promise.all([
            pool.query('SELECT * FROM get_worker_performance_stats($1)', [userId]),
            pool.query('SELECT * FROM get_worker_daily_performance($1)', [userId]),
            pool.query('SELECT * FROM get_worker_recent_activity_summary($1)', [userId]),
            pool.query('SELECT * FROM get_worker_team_average($1)', [userId]),
            pool.query('SELECT * FROM get_worker_batch_performance_summary()'),
        ]);

        const stats = statsResult.rows[0] || {
            tasks_this_month: 0,
            tasks_last_month: 0,
            month_difference: 0,
            total_records: 0,
            feed_records_month: 0,
            medication_records_month: 0,
            mortality_records_month: 0,
            photo_count: 0,
            current_streak: 0,
            best_streak: 0,
            worker_rank: 1,
            total_workers: 1,
            accuracy_score: 0
        };

        const recordMasterProgress = Math.min(100, (Number(stats.total_records || 0) / 100) * 100);
        const photoMasterProgress = Math.min(100, (Number(stats.photo_count || 0) / 50) * 100);
        const ironWorkerProgress = Math.min(100, (Number(stats.best_streak || 0) / 30) * 100);
        const perfectWeekProgress = Math.min(100, (Number(stats.current_streak || 0) / 7) * 100);

        const badges = [
            {
                id: 'iron_worker',
                icon: '🥇',
                title: 'Iron Worker',
                description: '30 days streak',
                progress: Math.round(ironWorkerProgress),
                unlocked: Number(stats.best_streak || 0) >= 30
            },
            {
                id: 'photo_master',
                icon: '📸',
                title: 'Photo Master',
                description: '50 medication photos uploaded',
                progress: Math.round(photoMasterProgress),
                unlocked: Number(stats.photo_count || 0) >= 50
            },
            {
                id: 'perfect_week',
                icon: '🎯',
                title: 'Perfect Week',
                description: '7-day activity streak',
                progress: Math.round(perfectWeekProgress),
                unlocked: Number(stats.current_streak || 0) >= 7
            },
            {
                id: 'record_master',
                icon: '📝',
                title: 'Record Master',
                description: '100 total records logged',
                progress: Math.round(recordMasterProgress),
                unlocked: Number(stats.total_records || 0) >= 100
            }
        ];

        const daily = dailyResult.rows;
        const completedDays = daily.filter(d => d.completed_day).length;
        const trend = daily.length > 0 ? Number(daily[0].trend_percentage || 0) : 0;

        res.json({
            stats,
            badges,
            dailyCompletion: daily,
            completedDays,
            trend,
            recentActivity: recentResult.rows,
            teamAverage: teamResult.rows,
            batchSummary: batchResult.rows
        });
    } catch (err) {
        console.error('getWorkerPerformance error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- WORKER PROFILE -------------------

// GET /worker/profile
exports.getWorkerProfile = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `SELECT 
                user_id,
                username,
                full_name,
                email,
                phone_no,
                role,
                status
             FROM app_user
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Worker profile not found' });
        }

        const worker = result.rows[0];

        res.json({
            worker_id: worker.user_id,
            user_id: worker.user_id,
            username: worker.username,
            full_name: worker.full_name,
            email: worker.email,
            phone_no: worker.phone_no,
            role: worker.role,
            status: worker.status,
            member_since: 'Active'
        });

    } catch (err) {
        console.error('getWorkerProfile error:', err);
        res.status(500).json({ error: err.message });
    }
};

// PATCH /worker/profile
exports.updateWorkerProfile = async (req, res) => {
    const userId = req.user.user_id;
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
                username,
                full_name,
                email,
                phone_no,
                role,
                status`,
            [
                email || null,
                phone_no || null,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Worker profile not found' });
        }

        const worker = result.rows[0];

        res.json({
            message: 'Profile updated successfully',
            profile: {
                worker_id: worker.user_id,
                user_id: worker.user_id,
                username: worker.username,
                full_name: worker.full_name,
                email: worker.email,
                phone_no: worker.phone_no,
                role: worker.role,
                status: worker.status,
                member_since: 'Active'
            }
        });

    } catch (err) {
        console.error('updateWorkerProfile error:', err);
        res.status(500).json({ error: err.message });
    }
};

// PATCH /worker/profile/change-password
exports.changeWorkerPassword = async (req, res) => {
    const userId = req.user.user_id;
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
            [hashedPassword, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Worker account not found' });
        }

        res.json({
            message: 'Password changed successfully'
        });

    } catch (err) {
        console.error('changeWorkerPassword error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/worker/pickup-orders
exports.getPickupOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.order_id,
        o.order_date,
        o.requested_quantity,
        o.order_status,
        o.requested_delivery_date,
        o.batch_id,

        c.customer_id,
        au.full_name AS customer_name,
        au.phone_no AS customer_phone,

        b.avg_weight_kg,
        b.price_per_kg,

        ROUND((o.requested_quantity * b.avg_weight_kg)::numeric, 2) AS estimated_weight_kg,
        ROUND((o.requested_quantity * b.avg_weight_kg * b.price_per_kg)::numeric, 2) AS estimated_amount

      FROM orders o
      JOIN customer c ON o.customer_id = c.customer_id
      JOIN app_user au ON c.user_id = au.user_id
      LEFT JOIN batch b ON o.batch_id = b.batch_id

      WHERE o.delivery_type = 'Pickup'
        AND o.order_status IN ('Approved', 'Ready for Pickup', 'Customer Arrived', 'Completed')

      ORDER BY o.requested_delivery_date ASC, o.order_id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("getPickupOrders error:", err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/worker/pickup-orders/:orderId/ready
exports.markPickupReady = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(`
      UPDATE orders
      SET order_status = 'Ready for Pickup'
      WHERE order_id = $1
        AND delivery_type = 'Pickup'
        AND order_status = 'Approved'
      RETURNING *
    `, [orderId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Pickup order not found or not approved yet"
      });
    }

    res.json({
      message: "Order marked as ready for pickup",
      order: result.rows[0]
    });
  } catch (err) {
    console.error("markPickupReady error:", err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/worker/pickup-orders/:orderId/collected
exports.confirmPickupCollected = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(`
      UPDATE orders
      SET order_status = 'Completed'
      WHERE order_id = $1
        AND delivery_type = 'Pickup'
        AND order_status = 'Customer Arrived'
      RETURNING *
    `, [orderId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Pickup order not found or customer has not arrived yet"
      });
    }

    res.json({
      message: "Pickup collection confirmed",
      order: result.rows[0]
    });
  } catch (err) {
    console.error("confirmPickupCollected error:", err);
    res.status(500).json({ error: err.message });
  }
};