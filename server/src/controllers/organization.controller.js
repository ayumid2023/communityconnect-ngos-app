const Organization = require('../models/Organization');
const logger = require('../utils/logger');

/**
 * @route GET /api/organization/settings
 * @desc Get organization settings
 */
exports.getSettings = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.orgId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({
      name: organization.name,
      primaryColor: organization.primaryColor,
      logo: organization.logo,
      settings: organization.settings,
    });
  } catch (error) {
    logger.error('Get organization settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/organization/settings
 * @desc Update organization settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { name, primaryColor, logo, settings } = req.body;
    
    const organization = await Organization.findById(req.user.orgId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    if (name) organization.name = name;
    if (primaryColor) organization.primaryColor = primaryColor;
    if (logo !== undefined) organization.logo = logo;
    if (settings) organization.settings = { ...organization.settings, ...settings };
    
    await organization.save();
    
    res.json({
      name: organization.name,
      primaryColor: organization.primaryColor,
      logo: organization.logo,
      settings: organization.settings,
    });
  } catch (error) {
    logger.error('Update organization settings error:', error);
    res.status(500).json({ error: error.message });
  }
};
