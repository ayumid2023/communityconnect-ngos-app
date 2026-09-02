const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const organizationController = require('../controllers/organization.controller');

router.get('/settings', auth, organizationController.getSettings);
router.put('/settings', auth, authorize('admin'), organizationController.updateSettings);

module.exports = router;
