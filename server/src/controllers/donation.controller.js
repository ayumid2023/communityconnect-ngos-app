const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { sendDonationReceipt } = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/donations
 * @desc Get all donations
 */
exports.getAllDonations = async (req, res) => {
  try {
    const { startDate, endDate, status, campaignId, limit = 100 } = req.query;
    const query = { orgId: req.user.orgId };
    
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    }
    if (status) {
      query.status = status;
    }
    if (campaignId) {
      query.campaignId = campaignId;
    }
    
    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('campaignId', 'name');
    
    res.json(donations);
  } catch (error) {
    logger.error('Get donations error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/donations/:id
 * @desc Get a single donation
 */
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    }).populate('campaignId', 'name');
    
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    res.json(donation);
  } catch (error) {
    logger.error('Get donation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/donations
 * @desc Create a donation (manual entry)
 */
exports.createDonation = async (req, res) => {
  try {
    const donationData = {
      ...req.body,
      orgId: req.user.orgId,
      paymentMethod: req.body.paymentMethod || 'cash',
      status: req.body.status || 'completed',
    };
    
    // Find or create donor
    if (req.body.donorEmail) {
      let donor = await User.findOne({
        email: req.body.donorEmail,
        orgId: req.user.orgId,
      });
      
      if (!donor) {
        donor = await User.create({
          email: req.body.donorEmail,
          orgId: req.user.orgId,
          role: 'donor',
          profile: { 
            firstName: req.body.donorName || req.body.donorEmail.split('@')[0] 
          },
        });
      }
      donationData.donorId = donor._id;
    }
    
    const donation = await Donation.create(donationData);
    
    // Update campaign progress
    if (donation.campaignId && donation.status === 'completed') {
      await Campaign.findByIdAndUpdate(
        donation.campaignId,
        { $inc: { raised: donation.amount, donorCount: 1 } }
      );
    }
    
    // Send receipt
    if (donation.status === 'completed') {
      try {
        await sendDonationReceipt(donation);
      } catch (emailError) {
        logger.error('Failed to send donation receipt:', emailError);
      }
    }
    
    res.status(201).json(donation);
  } catch (error) {
    logger.error('Create donation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/donations/:id
 * @desc Update a donation
 */
exports.updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    const oldStatus = donation.status;
    const oldAmount = donation.amount;
    
    // Update donation
    Object.assign(donation, req.body);
    await donation.save();
    
    // Update campaign if status changed to completed
    if (donation.campaignId && donation.status === 'completed' && oldStatus !== 'completed') {
      await Campaign.findByIdAndUpdate(
        donation.campaignId,
        { $inc: { raised: donation.amount, donorCount: 1 } }
      );
    }
    
    // Revert campaign if status changed from completed
    if (donation.campaignId && oldStatus === 'completed' && donation.status !== 'completed') {
      await Campaign.findByIdAndUpdate(
        donation.campaignId,
        { $inc: { raised: -oldAmount, donorCount: -1 } }
      );
    }
    
    res.json(donation);
  } catch (error) {
    logger.error('Update donation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route DELETE /api/donations/:id
 * @desc Delete a donation
 */
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    // Revert campaign progress
    if (donation.campaignId && donation.status === 'completed') {
      await Campaign.findByIdAndUpdate(
        donation.campaignId,
        { $inc: { raised: -donation.amount, donorCount: -1 } }
      );
    }
    
    await donation.deleteOne();
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    logger.error('Delete donation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/donations/:id/send-receipt
 * @desc Send receipt for a donation
 */
exports.sendReceipt = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
     
