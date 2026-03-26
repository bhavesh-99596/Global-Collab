const db = require('../db');

class ReputationRepository {
    /**
     * Upsert points for a user (INSERT if missing, UPDATE += delta otherwise).
     * Points are floored at 0.
     */
    async upsertPoints(userId, delta) {
        const result = await db.query(
            `INSERT INTO reputation (user_id, points, monthly_points, updated_at)
             VALUES ($1, GREATEST($2, 0), GREATEST($2, 0), NOW())
             ON CONFLICT (user_id)
             DO UPDATE SET points = GREATEST(reputation.points + $2, 0),
                           monthly_points = GREATEST(reputation.monthly_points + $2, 0),
                           updated_at = NOW()
             RETURNING *`,
            [userId, delta]
        );
        return result.rows[0];
    }

    /**
     * Get a single user's reputation row.
     */
    async getReputation(userId) {
        const result = await db.query(
            `SELECT user_id, points FROM reputation WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0] || { user_id: userId, points: 0 };
    }

    /**
     * Top-N leaderboard joined with users for display info.
     */
    async getLeaderboard(limit = 10, type = 'alltime') {
        const orderByField = type === 'monthly' ? 'r.monthly_points' : 'r.points';
        const result = await db.query(
            `SELECT r.user_id, r.points, r.monthly_points,
                    u.username, u.full_name, u.role
             FROM reputation r
             JOIN users u ON u.id = r.user_id
             ORDER BY ${orderByField} DESC
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    }
}

module.exports = new ReputationRepository();
