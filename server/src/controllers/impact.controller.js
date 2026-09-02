const Impact = require('../models/Impact');
const logger = require('../utils/logger');

/**
 * @route GET /api/impact
 * @desc Get all impact stories
 */
exports.getAllImpacts = async (req, res) => {
  try {
    const impacts = await Impact.find({ orgId: req.user.orgId })
      .sort({ date: -1 })
      .select('-__v');
    
    res.json(impacts);
  } catch (error) {
    logger.error('Get impacts error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/impact/public
 * @desc Get public impact stories
 */
exports.getPublicImpacts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const impacts = await Impact.find({ isPublished: true })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .select('title description metrics images date location');
    
    res.json(impacts);
  } catch (error) {
    logger.error('Get public impacts error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/impact/:id
 * @desc Get a single impact story
 */
exports.getImpact = async (req, res) => {
  try {
    const impact = await Impact.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!impact) {
      return res.status(404).json({ error: 'Impact story not found' });
    }
    
    res.json(impact);
  } catch (error) {
    logger.error('Get impact error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/impact/public/:id
 * @desc Get a public impact story
 */
exports.getPublicImpact = async (req, res) => {
  try {
    const impact = await Impact.findOne({
      _id: req.params.id,
      isPublished: true,
    });
    
    if (!impact) {
      return res.status(404).json({ error: 'Impact story not found' });
    }
    
    res.json(impact);
  } catch (error) {
    logger.error('Get public impact error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/impact
 * @desc Create an impact story
 */
exports.createImpact = async (req, res) => {
  try {
    const impactData = {
      ...req.body,
      orgId: req.user.orgId,
    };
    
    const impact = await Impact.create(impactData);
    res.status(201).json(impact);
  } catch (error) {
    logger.error('Create impact error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/impact/:id
 * @desc Update an impact story
 */
exports.updateImpact = async (req, res) => {
  try {
    const impact = await Impact.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!impact) {
      return res.status(404).json({ error: 'Impact story not found' });
    }
    
    res.json(impact);
  } catch (error) {
    logger.error('Update impact error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route DELETE /api/impact/:id
 * @desc Delete an impact story
 */
exports.deleteImpact = async (req, res) => {
  try {
    const impact = await Impact.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!impact) {
      return res.status(404).json({ error: 'Impact story not found' });
    }
    
    res.json({ message: 'Impact story deleted successfully' });
  } catch (error) {
    logger.error('Delete impact error:', error);
    res.status(500).json({ error: error.message });
  }
};
