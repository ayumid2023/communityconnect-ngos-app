const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, orgName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !orgName) {
      return res.status(400).json({
        error: 'Please provide email, password, firstName, lastName, and orgName',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Create or find organization
    let organization = await Organization.findOne({ name: orgName });
    if (!organization) {
      organization = await Organization.create({
        name: orgName,
        settings: {
          currency: 'USD',
          language: 'en',
          timezone: 'UTC',
        },
      });
      logger.info(`Created new organization: ${orgName}`);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      orgId: organization._id,
      role: role || 'admin',
      profile: { firstName, lastName },
      emailVerified: true, // Will need email verification in production
    });

    // Generate token
    const token = generateToken(user);

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to CommunityConnect',
        template: 'welcome',
        data: { firstName, orgName },
      });
    } catch (emailError) {
      logger.warn('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        orgId: user.orgId,
      },
      token,
    });
  } catch (error) {
