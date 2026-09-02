const Feedback = require('../models/Feedback');
const logger = require('../utils/logger');

/**
 * @route GET /api/feedback
 * @desc Get all feedback
 */
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ orgId: req.user.orgId })
      .sort({ createdAt: -1 })
      .populate('userId', 'email profile');
    
    res.json(feedback);
  } catch (error) {
    logger.error('Get feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/feedback
 * @desc Create feedback
 */
exports.createFeedback = async (req, res) => {
  try {
    const feedbackData = {
      ...req.body,
      userId: req.user._id,
      orgId: req.user.orgId,
      userAgent: req.get('User-Agent'),
      url: req.body.url || req.get('Referer') || '',
    };
    
    const feedback = await Feedback.create(feedbackData);
    res.status(201).json(feedback);
  } catch (error) {
    logger.error('Create feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/feedback/:id
 * @desc Update feedback
 */
exports.updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      req.body,
      { new: true }
    );
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (error) {
    logger.error('Update feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route DELETE /api/feedback/:id
 * @desc Delete feedback
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    logger.error('Delete feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};
