import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'morthai_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// Backup directory (relative to backend root)
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a database backup (for scheduled backups)
 */
export async function createScheduledBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFileName = `morthai_db_backup_${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    console.log('🔄 Creating scheduled database backup...');

    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: DB_PASSWORD,
    };

    // Create backup using pg_dump (custom format for smaller size)
    const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -f "${backupPath}"`;

    await execAsync(command, { env });

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Scheduled backup created: ${backupFileName} (${fileSizeMB} MB)`);

    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups();

    return {
      success: true,
      backupPath,
      fileName: backupFileName,
      fileSize: fileSizeMB,
    };
  } catch (error) {
    console.error('❌ Error creating scheduled backup:', error.message);
    // Don't throw - scheduled backup failures shouldn't crash the server
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean up old backups (keep last 30 days)
 */
async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('morthai_db_backup_'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        return {
          fileName: file,
          path: filePath,
          created: fs.statSync(filePath).birthtime,
        };
      });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldFiles = files.filter(file => file.created < thirtyDaysAgo);

    for (const file of oldFiles) {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted old backup: ${file.fileName}`);
    }

    if (oldFiles.length > 0) {
      console.log(`✅ Cleaned up ${oldFiles.length} old backup(s)`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up old backups:', error.message);
  }
}

