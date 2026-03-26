const db = require('../db');

class AIRepository {
    async logInteraction(userId, projectId, prompt, responseText, actionType) {
        const query = `
            INSERT INTO ai_logs (user_id, project_id, prompt, response, action_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [userId || null, projectId || null, prompt, responseText, actionType || 'unknown'];
        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = new AIRepository();
