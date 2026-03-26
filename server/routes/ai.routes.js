const express = require('express');
const router = express.Router();
const aiController = require('../controllers/AIController');
const authenticateToken = require('../middleware/auth');
const { checkAILimit } = require('../middleware/planLimits');

router.post('/generate-tasks', authenticateToken, checkAILimit, aiController.generateTasks);
router.post('/recommend-team', authenticateToken, checkAILimit, aiController.recommendTeam);
router.get('/project-health/:projectId', authenticateToken, checkAILimit, aiController.getProjectHealth);

module.exports = router;
