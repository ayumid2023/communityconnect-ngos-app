const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const logger = require('../utils/logger');

/**
 * @route GET /api/campaigns
 * @desc Get all campaigns for an organization
 */
exports.getAllCampaigns = async (req, res) => {
  try {
    const { status, isFeatured } = req.query;
    const query = { orgId: req.user.orgId };
    
    if (status) query.status = status;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json(campaigns);
  } catch (error) {
    logger.error('Get campaigns error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/campaigns/:id
 * @desc Get a single campaign
 */
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    logger.error('Get campaign error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/campaigns/public/:slug
 * @desc Get public campaign data (for widgets)
 */
exports.getPublicCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      slug: req.params.slug,
      status: 'active',
    }).select('name description goal raised imageUrl');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    logger.error('Get public campaign error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/campaigns
 * @desc Create a new campaign
 */
exports.createCampaign = async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      orgId: req.user.orgId,
    };
    
    // Generate slug if not provided
    if (!campaignData.slug && campaignData.name) {
      campaignData.slug = campaignData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    const campaign = await Campaign.create(campaignData);
    res.status(201).json(campaign);
  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/campaigns/:id
 * @desc Update a campaign
 */
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    logger.error('Update campaign error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route DELETE /api/campaigns/:id
 * @desc Delete a campaign
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    logger.error('Delete campaign error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/campaigns/:id/donations
 * @desc Get donations for a campaign
 */
exports.getCampaignDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      campaignId: req.params.id,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('donorName donorEmail amount createdAt');
    
    res.json(donations);
  } catch (error) {
    logger.error('Get campaign donations error:', error);
    res.status(500).json({ error: error.message });
  }
};
