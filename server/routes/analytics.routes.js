const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/AnalyticsController');

// Existing routes
router.get('/tasks-per-week', analyticsController.getTasksPerWeek);
router.get('/project-activity', analyticsController.getProjectActivity);
router.get('/reputation-growth', analyticsController.getReputationGrowth);

// New analytics routes
router.get('/tasks-per-project', analyticsController.getTasksPerProject);
router.get('/project-progress', analyticsController.getProjectProgress);
router.get('/task-status', analyticsController.getTaskStatus);
router.get('/team-contribution', analyticsController.getTeamContribution);
router.get('/overdue-tasks', analyticsController.getOverdueTasks);

module.exports = router;

