import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    // Enable UUID extension if needed (for PostgreSQL < 13)
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      console.log('UUID extension enabled');
    } catch (extError) {
      // Extension might already exist or gen_random_uuid() is available natively
      console.log('UUID extension check completed');
    }
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running database migrations...');
    await pool.query(schema);
    console.log('Database migrations completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

