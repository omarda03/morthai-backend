# 📦 Database Backup System

## Overview

The backup system provides automatic and manual database backup capabilities for the Mor Thai backend.

## Features

✅ **Manual Backups** - Create backups on-demand  
✅ **Automatic Daily Backups** - Runs at 2 AM UTC every day  
✅ **Auto Cleanup** - Keeps last 30 days of backups  
✅ **Easy Restore** - Simple restore process  
✅ **Two Formats** - Custom format (smaller) and SQL format (readable)

## 📋 Manual Backup Commands

### Create a Backup

```bash
# Using npm script
npm run backup

# Or directly
node backup-database.js create
```

This creates two files:
- `morthai_db_backup_YYYY-MM-DD_HH-MM-SS.sql` (custom format - smaller)
- `morthai_db_backup_YYYY-MM-DD_HH-MM-SS_plain.sql` (SQL format - readable)

### List All Backups

```bash
npm run backup:list
# Or
node backup-database.js list
```

### Restore from Backup

```bash
npm run backup:restore <backup-file-name>
# Or
node backup-database.js restore morthai_db_backup_2025-12-04_14-30-00.sql
```

**⚠️ Warning:** Restoring will overwrite the current database!

## 🤖 Automatic Backups

Automatic backups run daily at **2:00 AM UTC** and are stored in the `backups/` directory.

The system automatically:
- Creates a backup every day
- Cleans up backups older than 30 days
- Logs all backup operations

## 📁 Backup Location

All backups are stored in: `morthai-backend/backups/`

## 🔧 Configuration

Backup settings use the same database credentials from your `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=morthai_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## 📊 Backup Format

### Custom Format (.sql)
- Smaller file size
- Faster restore
- Use with: `pg_restore`

### Plain SQL Format (_plain.sql)
- Human-readable
- Can be edited
- Use with: `psql` or any SQL client

## 🚨 Important Notes

1. **Backups are NOT included in git** (backups/ directory is in .gitignore)
2. **Store backups securely** - Consider copying to external storage or cloud
3. **Test restores** - Periodically test restoring from backups
4. **Monitor disk space** - Backups can take significant space

## 💾 Backup Best Practices

1. **Regular Manual Backups** - Before major updates or migrations
2. **Off-site Storage** - Copy backups to cloud storage (AWS S3, Google Drive, etc.)
3. **Test Restores** - Verify backups work by testing restore on a test database
4. **Monitor Logs** - Check backup logs regularly to ensure they're working

## 🔄 Restore Process

1. **List available backups:**
   ```bash
   npm run backup:list
   ```

2. **Restore from backup:**
   ```bash
   npm run backup:restore morthai_db_backup_2025-12-04_14-30-00.sql
   ```

3. **Verify restore:**
   - Check database connection
   - Verify data integrity
   - Test application functionality

## 📝 Example Workflow

```bash
# 1. Create a backup before making changes
npm run backup

# 2. Make your changes (migrations, updates, etc.)

# 3. If something goes wrong, restore
npm run backup:list
npm run backup:restore morthai_db_backup_2025-12-04_14-30-00.sql
```

## 🛠️ Troubleshooting

**Backup fails:**
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Check disk space: `df -h`
- Ensure `pg_dump` is installed: `which pg_dump`

**Restore fails:**
- Ensure database exists
- Check file permissions
- Verify backup file is not corrupted
- Check PostgreSQL logs

**Automatic backups not running:**
- Check server logs
- Verify cron is enabled
- Check PM2 is running: `pm2 status`

