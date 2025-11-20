import pool from '../config/database.js';

export class CarteCadeaux {
  // Get all gift cards
  static async getAll() {
    const result = await pool.query(
      'SELECT * FROM cartecadeaux ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Get gift card by ID
  static async getById(carteId) {
    const result = await pool.query(
      'SELECT * FROM cartecadeaux WHERE carteid = $1',
      [carteId]
    );
    return result.rows[0];
  }

  // Create new gift card
  static async create(data) {
    const { Theme, Prix } = data;
    const result = await pool.query(
      'INSERT INTO cartecadeaux (theme, prix) VALUES ($1, $2) RETURNING *',
      [Theme, Prix]
    );
    return result.rows[0];
  }

  // Update gift card
  static async update(carteId, data) {
    const { Theme, Prix } = data;
    const result = await pool.query(
      'UPDATE cartecadeaux SET theme = $1, prix = $2, updated_at = CURRENT_TIMESTAMP WHERE carteid = $3 RETURNING *',
      [Theme, Prix, carteId]
    );
    return result.rows[0];
  }

  // Delete gift card
  static async delete(carteId) {
    const result = await pool.query(
      'DELETE FROM cartecadeaux WHERE carteid = $1 RETURNING *',
      [carteId]
    );
    return result.rows[0];
  }
}

