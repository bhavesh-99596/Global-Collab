const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');

// GET /api/notifications
router.get('/', notificationController.getNotifications);

// PUT /api/notifications/read/:id
router.put('/read/:id', notificationController.markAsRead);

module.exports = router;
