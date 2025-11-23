import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateRemoveDurationPrice() {
  try {
    console.log('Running migration to remove NOT NULL constraints from durée and prix columns...');
    
    const migrationPath = path.join(__dirname, 'remove_service_duration_price.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migration);
    console.log('Migration completed successfully! durée and prix columns are now nullable.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateRemoveDurationPrice();

