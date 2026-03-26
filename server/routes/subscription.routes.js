const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/SubscriptionController');
const paymentController = require('../controllers/PaymentController');

router.get('/', subscriptionController.getSubscription);
router.get('/plans', subscriptionController.getPlans);
router.post('/upgrade', subscriptionController.upgradeSubscription); // legacy simple upgrade

// New Payment Flow Endpoints
router.post('/payment/apply-discount', paymentController.applyDiscount);
router.post('/payment/create-order', paymentController.createOrder);
router.post('/payment/verify', paymentController.verifyPayment);
router.post('/payment/webhook', paymentController.webhook);

module.exports = router;
