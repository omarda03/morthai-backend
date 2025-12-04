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

// Backup directory
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a database backup
 */
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFileName = `morthai_db_backup_${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    console.log('🔄 Creating database backup...');
    console.log(`📁 Backup location: ${backupPath}`);

    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: DB_PASSWORD,
    };

    // Create backup using pg_dump
    const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -f "${backupPath}"`;

    await execAsync(command, { env });

    // Also create a plain SQL backup for easy reading
    const sqlBackupPath = backupPath.replace('.sql', '_plain.sql');
    const sqlCommand = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${sqlBackupPath}"`;
    await execAsync(sqlCommand, { env });

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    console.log(`📁 Files:`);
    console.log(`   - ${backupFileName} (custom format)`);
    console.log(`   - ${backupFileName.replace('.sql', '_plain.sql')} (SQL format)`);

    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups();

    return {
      success: true,
      backupPath,
      sqlBackupPath,
      fileName: backupFileName,
      fileSize: fileSizeMB,
    };
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    throw error;
  }
}

/**
 * Restore database from backup
 */
async function restoreBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    console.log('🔄 Restoring database from backup...');
    console.log(`📁 Backup file: ${backupPath}`);

    // Set PGPASSWORD environment variable
    const env = {
      ...process.env,
      PGPASSWORD: DB_PASSWORD,
    };

    // Check if it's a custom format or plain SQL
    const isCustomFormat = backupPath.endsWith('.sql') && !backupPath.includes('_plain.sql');

    let command;
    if (isCustomFormat) {
      // Custom format backup
      command = `pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "${backupPath}"`;
    } else {
      // Plain SQL backup
      command = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${backupPath}"`;
    }

    await execAsync(command, { env });

    console.log('✅ Database restored successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error restoring backup:', error.message);
    throw error;
  }
}

/**
 * List all available backups
 */
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('morthai_db_backup_') && file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          created: stats.birthtime,
        };
      })
      .sort((a, b) => b.created - a.created);

    return files;
  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
    return [];
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

// CLI interface
const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  try {
    switch (command) {
      case 'create':
      case 'backup':
        await createBackup();
        break;

      case 'restore':
        if (!arg) {
          console.error('❌ Please provide backup file name');
          console.log('Usage: node backup-database.js restore <backup-file-name>');
          console.log('Available backups:');
          listBackups().forEach(backup => {
            console.log(`  - ${backup.fileName} (${backup.size}, ${backup.created.toLocaleString()})`);
          });
          process.exit(1);
        }
        await restoreBackup(arg);
        break;

      case 'list':
        const backups = listBackups();
        if (backups.length === 0) {
          console.log('📭 No backups found');
        } else {
          console.log('📋 Available backups:');
          backups.forEach((backup, index) => {
            console.log(`\n${index + 1}. ${backup.fileName}`);
            console.log(`   Size: ${backup.size}`);
            console.log(`   Created: ${backup.created.toLocaleString()}`);
          });
        }
        break;

      default:
        console.log('📦 Mor Thai Database Backup Tool\n');
        console.log('Usage:');
        console.log('  node backup-database.js create     - Create a new backup');
        console.log('  node backup-database.js restore <file> - Restore from backup');
        console.log('  node backup-database.js list       - List all backups');
        console.log('\nExamples:');
        console.log('  node backup-database.js create');
        console.log('  node backup-database.js restore morthai_db_backup_2025-12-04_14-30-00.sql');
        console.log('  node backup-database.js list');
        break;
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

main();

