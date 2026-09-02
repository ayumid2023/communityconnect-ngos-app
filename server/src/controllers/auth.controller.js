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
    logger.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/auth/login
 * @desc Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
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
    logger.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('orgId', 'name logo primaryColor settings');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { profile, ...updates } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile fields
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    // Update other fields (except sensitive ones)
    const allowedUpdates = ['phone', 'email'];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        orgId: user.orgId,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'reset-password',
      data: { resetUrl, firstName: user.profile.firstName || 'User' },
    });

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Please provide token and password' });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/auth/change-password
 * @desc Change password (authenticated)
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide current and new password' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 */
exports.logout = async (req, res) => {
  // JWT is stateless, so logout is handled client-side
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh JWT token
 */
exports.refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user);
    res.json({ token });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: error.message });
  }
};
