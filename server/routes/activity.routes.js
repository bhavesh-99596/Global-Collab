const express = require('express');
const router = express.Router();
const activityController = require('../controllers/ActivityController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, activityController.getRecentActivity);

module.exports = router;
