const db = require('../db');

class ActivityRepository {
    async createLog(type, content, projectId, userId) {
        const query = 'INSERT INTO activity_feed (type, content, project_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [type, content, projectId, userId];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    async getRecentActivity(limit = 20) {
        const query = `
            SELECT af.*, u.username, u.full_name, p.title as project_name 
            FROM activity_feed af
            LEFT JOIN users u ON af.user_id = u.id
            LEFT JOIN projects p ON af.project_id = p.id
            ORDER BY af.created_at DESC 
            LIMIT $1
        `;
        const result = await db.query(query, [limit]);
        return result.rows;
    }
}

module.exports = new ActivityRepository();
