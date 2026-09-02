const User = require('../models/User');
const Donation = require('../models/Donation');
const logger = require('../utils/logger');

/**
 * @route GET /api/donors
 * @desc Get all donors
 */
exports.getAllDonors = async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;
    const query = { 
      orgId: req.user.orgId,
      role: 'donor'
    };
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
      ];
    }
    
    const donors = await User.find(query)
      .limit(parseInt(limit))
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(donors);
  } catch (error) {
    logger.error('Get donors error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/donors/:id
 * @desc Get a single donor
 */
exports.getDonor = async (req, res) => {
  try {
    const donor = await User.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
      role: 'donor',
    }).select('-password');
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    res.json(donor);
  } catch (error) {
    logger.error('Get donor error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/donors
 * @desc Create a new donor
 */
exports.createDonor = async (req, res) => {
  try {
    const { email, profile, ...donorData } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const existingUser = await User.findOne({ email, orgId: req.user.orgId });
    if (existingUser) {
      return res.status(409).json({ error: 'Donor already exists with this email' });
    }
    
    const donor = await User.create({
      ...donorData,
      email,
      orgId: req.user.orgId,
      role: 'donor',
      profile,
      password: Math.random().toString(36).slice(-8), // Generate random password
    });
    
    res.status(201).json(donor);
  } catch (error) {
    logger.error('Create donor error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/donors/:id
 * @desc Update a donor
 */
exports.updateDonor = async (req, res) => {
  try {
    const donor = await User.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId, role: 'donor' },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    res.json(donor);
  } catch (error) {
    logger.error('Update donor error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route DELETE /api/donors/:id
 * @desc Delete a donor
 */
exports.deleteDonor = async (req, res) => {
  try {
    const donor = await User.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId,
      role: 'donor',
    });
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    res.json({ message: 'Donor deleted successfully' });
  } catch (error) {
    logger.error('Delete donor error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/donors/:id/donations
 * @desc Get a donor's donation history
 */
exports.getDonorDonations = async (req, res) => {
  try {
    const donor = await User.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    const donations = await Donation.find({
      donorId: donor._id,
      orgId: req.user.orgId,
    })
      .sort({ createdAt: -1 })
      .populate('campaignId', 'name');
    
    res.json(donations);
  } catch (error) {
    logger.error('Get donor donations error:', error);
    res.status(500).json({ error: error.message });
  }
};
