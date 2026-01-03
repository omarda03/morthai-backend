import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateOffreStatus() {
  try {
    const migrationPath = path.join(__dirname, 'add_status_to_offre.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: add_status_to_offre...');
    await pool.query(migration);
    console.log('Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateOffreStatus();

