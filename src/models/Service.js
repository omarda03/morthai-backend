import pool from '../config/database.js';

export class Service {
  // Get all services
  static async getAll() {
    const result = await pool.query(`
      SELECT s.*, c.nomcategorie as "NomCategorie"
      FROM service s 
      LEFT JOIN categorie c ON s.cat_uuid = c.cat_uuid 
      ORDER BY s.created_at DESC
    `);
    return result.rows;
  }

  // Get service by ID
  static async getById(serviceUuid) {
    const result = await pool.query(`
      SELECT s.*, c.nomcategorie as "NomCategorie"
      FROM service s 
      LEFT JOIN categorie c ON s.cat_uuid = c.cat_uuid 
      WHERE s.service_uuid = $1
    `, [serviceUuid]);
    return result.rows[0];
  }

  // Get services by category
  static async getByCategory(catUuid) {
    const result = await pool.query(`
      SELECT s.*, c.nomcategorie as "NomCategorie"
      FROM service s 
      LEFT JOIN categorie c ON s.cat_uuid = c.cat_uuid 
      WHERE s.cat_uuid = $1 
      ORDER BY s.created_at DESC
    `, [catUuid]);
    return result.rows;
  }

  // Create new service
  static async create(data) {
    const { NomService, Description, Images, Durée, Prix, CAT_UUID } = data;
    
    // Validate required fields
    if (!NomService) {
      throw new Error('NomService is required');
    }
    if (!Durée || isNaN(Durée)) {
      throw new Error('Durée must be a valid number');
    }
    if (!Prix || isNaN(Prix)) {
      throw new Error('Prix must be a valid number');
    }
    if (!CAT_UUID) {
      throw new Error('CAT_UUID is required');
    }
    
    const result = await pool.query(
      `INSERT INTO service (nomservice, description, images, durée, prix, cat_uuid) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [NomService, Description || null, Images || [], Durée, Prix, CAT_UUID]
    );
    return result.rows[0];
  }

  // Update service
  static async update(serviceUuid, data) {
    const { NomService, Description, Images, Durée, Prix, CAT_UUID } = data;
    
    // Validate required fields
    if (!NomService) {
      throw new Error('NomService is required');
    }
    if (!Durée || isNaN(Durée)) {
      throw new Error('Durée must be a valid number');
    }
    if (!Prix || isNaN(Prix)) {
      throw new Error('Prix must be a valid number');
    }
    if (!CAT_UUID) {
      throw new Error('CAT_UUID is required');
    }
    
    const result = await pool.query(
      `UPDATE service 
       SET nomservice = $1, description = $2, images = $3, durée = $4, prix = $5, cat_uuid = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE service_uuid = $7 RETURNING *`,
      [NomService, Description || null, Images || [], Durée, Prix, CAT_UUID, serviceUuid]
    );
    return result.rows[0];
  }

  // Delete service
  static async delete(serviceUuid) {
    const result = await pool.query(
      'DELETE FROM service WHERE service_uuid = $1 RETURNING *',
      [serviceUuid]
    );
    return result.rows[0];
  }
}

