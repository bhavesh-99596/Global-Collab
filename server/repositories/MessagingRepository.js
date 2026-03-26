const db = require('../db');

class MessagingRepository {
    async getConversation(userId1, userId2) {
        const query = `
            SELECT m.*, u.username as sender_username, u.full_name as sender_full_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2)
               OR (m.sender_id = $2 AND m.receiver_id = $1)
            ORDER BY m.created_at ASC
        `;
        const result = await db.query(query, [userId1, userId2]);
        return result.rows;
    }

    async createMessage(senderId, receiverId, content, attachUrl = null, attachName = null, attachType = null) {
        const query = `
            INSERT INTO messages (sender_id, receiver_id, content, attachment_url, attachment_name, attachment_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await db.query(query, [senderId, receiverId, content, attachUrl, attachName, attachType]);
        
        const getQuery = `
            SELECT m.*, u.username as sender_username, u.full_name as sender_full_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = $1
        `;
        const enriched = await db.query(getQuery, [result.rows[0].id]);
        return enriched.rows[0];
    }

    async getProjectMessages(projectId) {
        const query = `
            SELECT m.*, u.username as sender_username, u.full_name as sender_full_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.project_id = $1
            ORDER BY m.created_at ASC
        `;
        const result = await db.query(query, [projectId]);
        return result.rows;
    }

    async createProjectMessage(senderId, projectId, content, attachUrl = null, attachName = null, attachType = null) {
        const query = `
            INSERT INTO messages (sender_id, project_id, content, attachment_url, attachment_name, attachment_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await db.query(query, [senderId, projectId, content, attachUrl, attachName, attachType]);
        
        const getQuery = `
            SELECT m.*, u.username as sender_username, u.full_name as sender_full_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = $1
        `;
        const enriched = await db.query(getQuery, [result.rows[0].id]);
        return enriched.rows[0];
    }
}

module.exports = new MessagingRepository();
