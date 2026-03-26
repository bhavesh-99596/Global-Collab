const express = require('express');
const router = express.Router();
const reputationController = require('../controllers/ReputationController');

router.get('/leaderboard', reputationController.getLeaderboard);
router.get('/:userId', reputationController.getReputation);

module.exports = router;
