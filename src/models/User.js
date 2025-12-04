import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  // Get all users
  static async getAll() {
    const result = await pool.query(`
      SELECT user_uuid, nom, email, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  // Get user by ID
  static async getById(userUuid) {
    const result = await pool.query(`
      SELECT user_uuid, nom, email, created_at, updated_at
      FROM users
      WHERE user_uuid = $1
    `, [userUuid]);
    return result.rows[0];
  }

  // Get user by email (case-insensitive)
  static async getByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query(`
      SELECT user_uuid, nom, email, password, created_at, updated_at
      FROM users
      WHERE LOWER(email) = $1
    `, [normalizedEmail]);
    return result.rows[0];
  }

  // Create new user
  static async create(userData) {
    const { nom, email, password } = userData;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(`
      INSERT INTO users (nom, email, password)
      VALUES ($1, $2, $3)
      RETURNING user_uuid, nom, email, created_at, updated_at
    `, [nom, normalizedEmail, hashedPassword]);

    return result.rows[0];
  }

  // Update user
  static async update(userUuid, userData) {
    const { nom, email, password } = userData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nom !== undefined) {
      updates.push(`nom = $${paramCount++}`);
      values.push(nom);
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase().trim());
    }

    if (password !== undefined) {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return await this.getById(userUuid);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userUuid);

    const result = await pool.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_uuid = $${paramCount}
      RETURNING user_uuid, nom, email, created_at, updated_at
    `, values);

    return result.rows[0];
  }

  // Delete user
  static async delete(userUuid) {
    const result = await pool.query(`
      DELETE FROM users
      WHERE user_uuid = $1
      RETURNING user_uuid, nom, email, created_at, updated_at
    `, [userUuid]);
    return result.rows[0];
  }
}

