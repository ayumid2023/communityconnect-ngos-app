const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const campaignController = require('../controllers/campaign.controller');

// Public routes (for widgets)
router.get('/public/:slug', campaignController.getPublicCampaign);

// Protected routes
router.get('/', auth, campaignController.getAllCampaigns);
router.get('/:id', auth, campaignController.getCampaign);
router.post('/', auth, authorize('admin', 'coordinator'), campaignController.createCampaign);
router.put('/:id', auth, authorize('admin', 'coordinator'), campaignController.updateCampaign);
router.delete('/:id', auth, authorize('admin'), campaignController.deleteCampaign);
router.get('/:id/donations', auth, campaignController.getCampaignDonations);

module.exports = router;
