const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/PointsController');
const auth = require('../middleware/auth');

router.get('/', auth, pointsController.getPoints);
router.get('/history', auth, pointsController.getHistory);

module.exports = router;
