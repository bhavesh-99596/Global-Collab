const db = require('../db');

class PointsRepository {
    async getPoints(userId) {
        const result = await db.query(
            `SELECT total_points FROM user_points WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0] ? result.rows[0].total_points : 0;
    }

    async getHistory(userId) {
        const result = await db.query(
            `SELECT id, points, type, description, created_at 
             FROM points_transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC LIMIT 50`,
            [userId]
        );
        return result.rows;
    }

    async addPoints(userId, points, description) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const res = await client.query(
                `INSERT INTO user_points (user_id, total_points) 
                 VALUES ($1, GREATEST($2, 0))
                 ON CONFLICT (user_id) 
                 DO UPDATE SET total_points = GREATEST(user_points.total_points + $2, 0),
                               updated_at = NOW()
                 RETURNING total_points`,
                [userId, points]
            );

            await client.query(
                `INSERT INTO points_transactions (user_id, points, type, description)
                 VALUES ($1, $2, $3, $4)`,
                [userId, points, 'earn', description]
            );

            await client.query('COMMIT');
            return res.rows[0].total_points;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async redeemPoints(userId, points, description) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Find current balance and lock row
            const check = await client.query(
                `SELECT total_points FROM user_points WHERE user_id = $1 FOR UPDATE`,
                [userId]
            );

            const current = check.rows[0] ? check.rows[0].total_points : 0;
            if (current < points) {
                const err = new Error('Insufficient points balance');
                err.statusCode = 400;
                throw err;
            }

            const res = await client.query(
                `UPDATE user_points 
                 SET total_points = total_points - $2, updated_at = NOW() 
                 WHERE user_id = $1 RETURNING total_points`,
                [userId, points]
            );

            await client.query(
                `INSERT INTO points_transactions (user_id, points, type, description)
                 VALUES ($1, $2, $3, $4)`,
                [userId, points, 'redeem', description]
            );

            await client.query('COMMIT');
            return res.rows[0].total_points;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}

module.exports = new PointsRepository();
