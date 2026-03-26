const notificationRepository = require('../repositories/NotificationRepository');

class NotificationController {
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const notifications = await notificationRepository.getUserNotifications(userId);
            res.json({ success: true, data: notifications });
        } catch (err) {
            next(err);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const notificationId = req.params.id;
            const userId = req.user.id;
            const notification = await notificationRepository.markAsRead(notificationId, userId);
            
            if (!notification) {
                const err = new Error('Notification not found or unauthorized');
                err.statusCode = 404;
                throw err;
            }

            res.json({ success: true, data: notification });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new NotificationController();
