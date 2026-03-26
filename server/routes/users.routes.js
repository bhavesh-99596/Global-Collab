const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/UserController');

router.get('/me', auth, userController.getMyProfile);
router.put('/profile', auth, userController.updateMyProfile);
router.get('/', userController.getAll);
router.get('/portfolio/:username', userController.getPublicPortfolio);
router.get('/:id', userController.getProfile);
router.put('/:id', userController.updateProfile);

module.exports = router;
