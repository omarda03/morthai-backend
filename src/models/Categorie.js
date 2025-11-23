import pool from '../config/database.js';

export class Categorie {
  // Get all categories with service count
  static async getAll() {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(s.service_uuid) as service_count
      FROM categorie c
      LEFT JOIN service s ON c.cat_uuid = s.cat_uuid
      GROUP BY c.cat_uuid
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  // Get category by ID with service count
  static async getById(catUuid) {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(s.service_uuid) as service_count
      FROM categorie c
      LEFT JOIN service s ON c.cat_uuid = s.cat_uuid
      WHERE c.cat_uuid = $1
      GROUP BY c.cat_uuid
    `, [catUuid]);
    return result.rows[0];
  }

  // Create new category
  static async create(data) {
    const { NomCategorie, NomCategorieFr, NomCategorieEn, Image } = data;
    
    // Use nomcategorie as fallback if fr/en not provided
    const nomcategorie = NomCategorie || NomCategorieFr || '';
    
    const result = await pool.query(
      `INSERT INTO categorie (nomcategorie, nomcategorie_fr, nomcategorie_en, image) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nomcategorie, NomCategorieFr || null, NomCategorieEn || null, Image || null]
    );
    return result.rows[0];
  }

  // Update category
  static async update(catUuid, data) {
    const { NomCategorie, NomCategorieFr, NomCategorieEn, Image } = data;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (NomCategorieFr !== undefined) {
      updates.push(`nomcategorie_fr = $${paramCount++}`);
      values.push(NomCategorieFr);
    }

    if (NomCategorieEn !== undefined) {
      updates.push(`nomcategorie_en = $${paramCount++}`);
      values.push(NomCategorieEn);
    }

    if (Image !== undefined) {
      updates.push(`image = $${paramCount++}`);
      values.push(Image);
    }

    if (NomCategorie !== undefined) {
      updates.push(`nomcategorie = $${paramCount++}`);
      values.push(NomCategorie);
    }

    if (updates.length === 0) {
      return await this.getById(catUuid);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(catUuid);

    const result = await pool.query(
      `UPDATE categorie 
       SET ${updates.join(', ')} 
       WHERE cat_uuid = $${paramCount} 
       RETURNING *`,
      values
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

