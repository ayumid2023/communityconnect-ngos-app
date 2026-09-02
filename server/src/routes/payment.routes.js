const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const paymentController = require('../controllers/payment.controller');

// Webhook route (no auth, raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhookHandler);

// Protected routes
router.get('/config', auth, paymentController.getConfig);
router.post('/create-intent', auth, paymentController.createPaymentIntent);

module.exports = router;
