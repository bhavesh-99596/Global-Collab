const db = require('../db');

class SubscriptionRepository {
    async getSubscriptionByUserId(userId) {
        const query = `
            SELECT s.*, p.name as plan_name, p.price_inr, p.project_limit, p.member_limit, p.ai_limit, p.storage_limit, p.features 
            FROM subscriptions s 
            LEFT JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = $1
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }

    async createOrUpdateSubscription(userId, planId, status, startDate = null, endDate = null) {
        const query = `
            INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, updated_at)
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP), $5, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                plan_id = EXCLUDED.plan_id, 
                status = EXCLUDED.status, 
                start_date = COALESCE(EXCLUDED.start_date, subscriptions.start_date),
                end_date = EXCLUDED.end_date,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await db.query(query, [userId, planId, status, startDate, endDate]);
        return result.rows[0];
    }

    async getPlans() {
        const query = `SELECT * FROM plans ORDER BY price_inr ASC`;
        const result = await db.query(query);
        return result.rows;
    }
}

module.exports = new SubscriptionRepository();
