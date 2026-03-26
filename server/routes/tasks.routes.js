const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const taskController = require('../controllers/TaskController');

router.get('/', authenticateToken, taskController.getAll);
router.post('/bulk', authenticateToken, taskController.createBulk);
router.post('/', authenticateToken, taskController.create);
router.get('/:id', authenticateToken, taskController.getOne);
router.put('/:id', authenticateToken, taskController.update);
router.delete('/:id', authenticateToken, taskController.delete);

module.exports = router;
