const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authenticate user using JWT token
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    req.userId = user._id;
    req.orgId = user.orgId;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Authorize user based on roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - Please authenticate' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
};

/**
 * Verify organization access
 */
const verifyOrgAccess = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    if (!orgId) {
      // If no orgId in params, use req.user.orgId
      req.orgId = req.user.orgId;
      return next();
    }

    if (req.user.role === 'admin') {
      // Admin can access any org
      req.orgId = orgId;
      return next();
    }

    if (req.user.orgId.toString() !== orgId) {
      return res.status(403).json({ error: 'Forbidden - Access denied to this organization' });
    }

    req.orgId = orgId;
    next();
  } catch (error) {
    logger.error('Org access middleware error:', error);
    res.status(500).json({ error: 'Organization access verification failed' });
  }
};

module.exports = { auth, authorize, verifyOrgAccess };
