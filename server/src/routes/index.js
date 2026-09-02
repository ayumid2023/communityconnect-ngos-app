const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const donorRoutes = require('./donor.routes');
const donationRoutes = require('./donation.routes');
const volunteerRoutes = require('./volunteer.routes');
const campaignRoutes = require('./campaign.routes');
const paymentRoutes = require('./payment.routes');
const impactRoutes = require('./impact.routes');
const feedbackRoutes = require('./feedback.routes');
const organizationRoutes = require('./organization.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/donations', donationRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/payments', paymentRoutes);
router.use('/impact', impactRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/organization', organizationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
