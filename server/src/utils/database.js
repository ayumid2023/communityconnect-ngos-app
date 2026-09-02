const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async (retries = 5, delay = 5000) => {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      logger.info(`MongoDB connected successfully (attempt ${attempt + 1})`);
      return true;
    } catch (error) {
      attempt++;
      logger.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error('All MongoDB connection attempts failed');
  return false;
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

/**
 * Get database connection status
 */
const getDBStatus = () => {
  return {
    state: mongoose.connection.readyState,
    stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

module.exports = { connectDB, disconnectDB, getDBStatus };
