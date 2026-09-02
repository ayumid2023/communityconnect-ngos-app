const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * CSRF protection middleware (for non-GET requests)
 */
const csrfProtection = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For API routes, use token-based CSRF protection
  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!csrfToken || csrfToken !== sessionToken) {
    logger.warn(`CSRF validation failed for ${req.path}`);
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
};

/**
 * IP blocking middleware
 */
const blockedIPs = new Set();
const ipBlockMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(ip)) {
    logger.warn(`Blocked request from IP: ${ip}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};

/**
 * Add blocked IP function
 */
const blockIP = (ip) => {
  blockedIPs.add(ip);
  logger.info(`IP blocked: ${ip}`);
};

/**
 * Unblock IP function
 */
const unblockIP = (ip) => {
  blockedIPs.delete(ip);
  logger.info(`IP unblocked: ${ip}`);
};

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }

  // Sanitize body (only for string values)
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  csrfProtection,
  ipBlockMiddleware,
  blockIP,
  unblockIP,
  sanitizeRequest,
};
