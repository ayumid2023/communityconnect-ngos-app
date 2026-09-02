const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const feedbackController = require('../controllers/feedback.controller');

// All feedback routes are authenticated
router.get('/', auth, feedbackController.getAllFeedback);
router.post('/', auth, feedbackController.createFeedback);
router.put('/:id', auth, feedbackController.updateFeedback);
router.delete('/:id', auth, feedbackController.deleteFeedback);

module.exports = router;
