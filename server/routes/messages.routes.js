const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/MessagingController');

router.get('/:userId', messagingController.getMessages);
router.post('/', messagingController.sendMessage);

// Project messaging
router.get('/project/:projectId', messagingController.getProjectMessages);
router.post('/project/:projectId', messagingController.sendProjectMessage);

module.exports = router;
