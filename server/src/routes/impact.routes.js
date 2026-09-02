const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const impactController = require('../controllers/impact.controller');

// Public routes
router.get('/public', impactController.getPublicImpacts);
router.get('/public/:id', impactController.getPublicImpact);

// Protected routes
router.get('/', auth, impactController.getAllImpacts);
router.get('/:id', auth, impactController.getImpact);
router.post('/', auth, authorize('admin', 'coordinator'), impactController.createImpact);
router.put('/:id', auth, authorize('admin', 'coordinator'), impactController.updateImpact);
router.delete('/:id', auth, authorize('admin'), impactController.deleteImpact);

module.exports = router;
