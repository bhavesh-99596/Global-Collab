const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const projectController = require('../controllers/ProjectController');
const { checkProjectLimit, checkMemberLimit } = require('../middleware/planLimits');

// Protected routes
router.get('/', authenticateToken, projectController.getAll);
router.get('/:id', authenticateToken, projectController.getOne);
router.post('/', authenticateToken, checkProjectLimit, projectController.create);
router.post('/:id/members', authenticateToken, checkMemberLimit, projectController.addMember);
router.put('/:id', authenticateToken, projectController.update);
router.delete('/:id', authenticateToken, projectController.delete);

module.exports = router;
