import pool from '../config/database.js';

export class Categorie {
  // Get all categories
  static async getAll() {
    const result = await pool.query(
      'SELECT * FROM categorie ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Get category by ID
  static async getById(catUuid) {
    const result = await pool.query(
      'SELECT * FROM categorie WHERE cat_uuid = $1',
      [catUuid]
    );
    return result.rows[0];
  }

  // Create new category
  static async create(data) {
    const { NomCategorie } = data;
    const result = await pool.query(
      'INSERT INTO categorie (nomcategorie) VALUES ($1) RETURNING *',
      [NomCategorie]
    );
    return result.rows[0];
  }

  // Update category
  static async update(catUuid, data) {
    const { NomCategorie } = data;
    const result = await pool.query(
      'UPDATE categorie SET nomcategorie = $1, updated_at = CURRENT_TIMESTAMP WHERE cat_uuid = $2 RETURNING *',
      [NomCategorie, catUuid]
    );
    return result.rows[0];
  }

  // Delete category
  static async delete(catUuid) {
    const result = await pool.query(
      'DELETE FROM categorie WHERE cat_uuid = $1 RETURNING *',
      [catUuid]
    );
    return result.rows[0];
  }
}

