const db = require('../db');

class NotificationRepository {
    async createNotification(userId, title, message) {
        const query = `
            INSERT INTO notifications (user_id, title, message)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [userId, title, message]);
        return result.rows[0];
    }

    async getUserNotifications(userId) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async markAsRead(notificationId, userId) {
        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [notificationId, userId]);
        return result.rows[0];
    }
}

module.exports = new NotificationRepository();
