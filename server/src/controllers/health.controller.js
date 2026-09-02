const mongoose = require('mongoose');
const os = require('os');
const logger = require('../utils/logger');

/**
 * @route GET /api/health
 * @desc Get detailed health status
 */
const getHealth = async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      system: {
        platform: os.platform(),
        release: os.release(),
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
        totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
        freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
      },
      database: {
        state: mongoose.connection.readyState,
        stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      environment: process.env.NODE_ENV || 'development',
    };

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      health.status = 'DEGRADED';
      health.database.error = 'Database not connected';
    }

    res.json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @route GET /api/health/simple
 * @desc Simple health check for uptime monitoring
 */
const getSimpleHealth = (req, res) => {
  res.status(200).send('OK');
};

module.exports = {
  getHealth,
  getSimpleHealth,
};
