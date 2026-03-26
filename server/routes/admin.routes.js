const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');

// All routes here are already behind auth + admin middleware (applied in index.js)
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/role', adminController.changeRole);

module.exports = router;
