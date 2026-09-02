const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const backupDB = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(backupDir, `backup-${timestamp}.gz`);
  
  // Parse MongoDB URI
  const uri = process.env.MONGODB_URI;
  const matches = uri.match(/mongodb:\/\/(?:[^:]+:[^@]+@)?([^:]+):(\d+)\/(.+)/);
  
  if (!matches) {
    logger.error('Could not parse MongoDB URI');
    return;
  }
  
  const [, host, port, dbName] = matches;
  
  // Build mongodump command
  const cmd = `mongodump --host ${host} --port ${port} --db ${dbName} --archive="${backupPath}" --gzip`;
  
  logger.info(`Starting backup of database ${dbName}...`);
  
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Backup failed: ${error.message}`);
      return;
    }
    logger.info(`Backup completed successfully: ${backupPath}`);
    
    // Clean up old backups (keep last 7 days)
    const files = fs.readdirSync(backupDir);
    const oldFiles = files
      .filter(f => f.startsWith('backup-'))
      .sort()
      .slice(0, -7);
      
    oldFiles.forEach(file => {
      fs.unlinkSync(path.join(backupDir, file));
      logger.info(`Deleted old backup: ${file}`);
    });
  });
};

backupDB();
