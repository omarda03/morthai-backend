import pool from '../config/database.js';
import { ServiceOffer } from './ServiceOffer.js';

export class Service {
  // Get all services with offers count
  static async getAll() {
    const result = await pool.query(`
      SELECT 
        s.*, 
        c.nomcategorie_fr as "NomCategorieFr",
        c.nomcategorie_en as "NomCategorieEn",
        c.nomcategorie as "NomCategorie",
        COUNT(so.offer_uuid) as offers_count
      FROM service s 
      LEFT JOIN categorie c ON s.cat_uuid = c.cat_uuid 
      LEFT JOIN service_offers so ON s.service_uuid = so.service_uuid
      GROUP BY s.service_uuid, c.nomcategorie_fr, c.nomcategorie_en, c.nomcategorie
      ORDER BY s.created_at DESC
    `);
    return result.rows;
  }

  // Get service by ID with offers
  static async getById(serviceUuid) {
    const serviceResult = await pool.query(`
      SELECT s.*, c.nomcategorie_fr as "NomCategorieFr", c.nomcategorie_en as "NomCategorieEn", c.nomcategorie as "NomCategorie"
      FROM service s 
      LEFT JOIN categorie c ON s.cat_uuid = c.cat_uuid 
      WHERE s.service_uuid = $1
    `, [serviceUuid]);
    
    if (!serviceResult.rows[0]) return null;
    
    const service = serviceResult.rows[0];
    // Get offers for this service
    const offers = await ServiceOffer.getByService(serviceUuid);
    service.offers = offers;
    
    return service;
  }

  // Get services by category
  static async getByCategory(catUuid) {
    const result = await pool.query(`
      SELECT 
        s.*, 
        c.nomcategorie as "NomCategorie",
        c.nomcategorie_fr as "NomCategorieFr",
        c.nomcategorie_en as "NomCategorieEn"
      FROM service s 
      LEFT JOIN categorie c ON s.cat_uuid = c.cat_uuid 
      WHERE s.cat_uuid = $1 
      ORDER BY s.created_at DESC
    `, [catUuid]);
    return result.rows;
  }

  // Generate reference code
  static generateReference() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-100';
    return result;
  }

  // Create new service with offers
  static async create(data) {
    const { 
      NomService, 
      NomServiceFr, 
      NomServiceEn,
      Description, 
      DescriptionFr,
      DescriptionEn,
      MetaTitle,
      MetaDescription,
      Reference,
      Images, 
      CAT_UUID,
      Offers
    } = data;
    
    // Validate required fields
    if (!NomServiceFr && !NomServiceEn) {
      throw new Error('At least one service name (FR or EN) is required');
    }
    if (!CAT_UUID) {
      throw new Error('Category is required');
    }
    
    // Use French or English name as default nomservice
    const nomservice = NomServiceFr || NomServiceEn || NomService || '';
    
    // Generate reference if not provided
    let reference = Reference;
    if (!reference) {
      reference = this.generateReference();
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const existing = await pool.query(
          'SELECT service_uuid FROM service WHERE reference = $1',
          [reference]
        );
        if (existing.rows.length === 0) break;
        reference = this.generateReference();
        attempts++;
      }
    }
    
    const result = await pool.query(
      `INSERT INTO service (
        nomservice, nomservice_fr, nomservice_en, 
        description, description_fr, description_en,
        meta_title, meta_description, reference, images, cat_uuid
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        nomservice, 
        NomServiceFr || null, 
        NomServiceEn || null,
        Description || null,
        DescriptionFr || null,
        DescriptionEn || null,
        MetaTitle || null,
        MetaDescription || null,
        reference,
        Images || [], 
        CAT_UUID
      ]
    );
    
    const service = result.rows[0];
    
    // Create offers if provided
    if (Offers && Array.isArray(Offers) && Offers.length > 0) {
      const offers = await ServiceOffer.createMultiple(service.service_uuid, Offers);
      service.offers = offers;
    }
    
    return service;
  }

  // Update service with offers
  static async update(serviceUuid, data) {
    const { 
      NomService, 
      NomServiceFr, 
      NomServiceEn,
      Description, 
      DescriptionFr,
      DescriptionEn,
      MetaTitle,
      MetaDescription,
      Reference,
      Images, 
      CAT_UUID,
      Offers
    } = data;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (NomServiceFr !== undefined) {
      updates.push(`nomservice_fr = $${paramCount++}`);
      values.push(NomServiceFr);
    }

    if (NomServiceEn !== undefined) {
      updates.push(`nomservice_en = $${paramCount++}`);
      values.push(NomServiceEn);
    }

    if (NomService !== undefined || (NomServiceFr !== undefined || NomServiceEn !== undefined)) {
      // Update nomservice to match FR or EN
      const nomservice = NomServiceFr || NomServiceEn || NomService || '';
      updates.push(`nomservice = $${paramCount++}`);
      values.push(nomservice);
    }

    if (DescriptionFr !== undefined) {
      updates.push(`description_fr = $${paramCount++}`);
      values.push(DescriptionFr);
    }

    if (DescriptionEn !== undefined) {
      updates.push(`description_en = $${paramCount++}`);
      values.push(DescriptionEn);
    }

    if (Description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(Description);
    }

    if (MetaTitle !== undefined) {
      updates.push(`meta_title = $${paramCount++}`);
      values.push(MetaTitle);
    }

    if (MetaDescription !== undefined) {
      updates.push(`meta_description = $${paramCount++}`);
      values.push(MetaDescription);
    }

    if (Reference !== undefined) {
      updates.push(`reference = $${paramCount++}`);
      values.push(Reference);
    }

    if (Images !== undefined) {
      updates.push(`images = $${paramCount++}`);
      values.push(Images);
    }

    if (CAT_UUID !== undefined) {
      updates.push(`cat_uuid = $${paramCount++}`);
      values.push(CAT_UUID);
    }

    if (updates.length === 0) {
      // If no updates, just return current service
      return await this.getById(serviceUuid);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(serviceUuid);

    const result = await pool.query(
      `UPDATE service 
       SET ${updates.join(', ')} 
       WHERE service_uuid = $${paramCount} RETURNING *`,
      values
    );

    const service = result.rows[0];

    // Update offers if provided
    if (Offers !== undefined) {
      // Delete existing offers
      await ServiceOffer.deleteByService(serviceUuid);
      // Create new offers
      if (Array.isArray(Offers) && Offers.length > 0) {
        const offers = await ServiceOffer.createMultiple(serviceUuid, Offers);
        service.offers = offers;
      }
    } else {
      // Get existing offers
      service.offers = await ServiceOffer.getByService(serviceUuid);
    }

    return service;
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

