import pool from '../config/database.js';
import { randomBytes } from 'crypto';

export class Offre {
  // Generate unique code
  static generateUniqueCode() {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  // Get all offers
  static async getAll() {
    try {
      const result = await pool.query(`
        SELECT o.*, 
               cc.theme as "CarteTheme", cc.prix as "CartePrix",
               s.nomservice as "NomService", s.nomservice_fr as "NomServiceFr", s.nomservice_en as "NomServiceEn",
               so.prix_mad as "ServicePrix"
        FROM offre o 
        LEFT JOIN cartecadeaux cc ON o.cartecadeaux = cc.carteid 
        LEFT JOIN service s ON o.service = s.service_uuid 
        LEFT JOIN service_offers so ON s.service_uuid = so.service_uuid AND so.durée = o.durée
        ORDER BY o.created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error in Offre.getAll():', error);
      throw error;
    }
  }

  // Get offer by ID
  static async getById(offreUuid) {
    try {
      const result = await pool.query(`
        SELECT o.*, 
               cc.theme as "CarteTheme", cc.prix as "CartePrix",
               s.nomservice as "NomService", s.nomservice_fr as "NomServiceFr", s.nomservice_en as "NomServiceEn",
               so.prix_mad as "ServicePrix"
        FROM offre o 
        LEFT JOIN cartecadeaux cc ON o.cartecadeaux = cc.carteid 
        LEFT JOIN service s ON o.service = s.service_uuid 
        LEFT JOIN service_offers so ON s.service_uuid = so.service_uuid AND so.durée = o.durée
        WHERE o.offre_uuid = $1
      `, [offreUuid]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Offre.getById():', error);
      throw error;
    }
  }

  // Get offer by unique code
  static async getByCode(codeUnique) {
    try {
      const result = await pool.query(`
        SELECT o.*, 
               cc.theme as "CarteTheme", cc.prix as "CartePrix",
               s.nomservice as "NomService", s.nomservice_fr as "NomServiceFr", s.nomservice_en as "NomServiceEn",
               so.prix_mad as "ServicePrix"
        FROM offre o 
        LEFT JOIN cartecadeaux cc ON o.cartecadeaux = cc.carteid 
        LEFT JOIN service s ON o.service = s.service_uuid 
        LEFT JOIN service_offers so ON s.service_uuid = so.service_uuid AND so.durée = o.durée
        WHERE o.codeunique = $1
      `, [codeUnique]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Offre.getByCode():', error);
      throw error;
    }
  }

  // Create new offer
  static async create(data) {
    const {
      NomBeneficiaire,
      EmailBeneficiaire,
      NumTelephoneBeneficiaire,
      NomEnvoyeur,
      Note,
      CarteCadeaux,
      Service,
      Durée,
      CodeUnique
    } = data;
    
    // Generate unique code if not provided
    const uniqueCode = CodeUnique || this.generateUniqueCode();
    
    // If CarteCadeaux is not provided, create or get a default generic gift card
    let carteCadeauxId = CarteCadeaux;
    if (!carteCadeauxId) {
      // Try to find or create a default "Generic" gift card
      const defaultCardResult = await pool.query(
        `SELECT carteid FROM cartecadeaux WHERE theme = 'Generic' OR theme = 'Générique' LIMIT 1`
      );
      
      if (defaultCardResult.rows.length > 0) {
        carteCadeauxId = defaultCardResult.rows[0].carteid;
      } else {
        // Create a default generic gift card
        const newCardResult = await pool.query(
          `INSERT INTO cartecadeaux (theme, prix) VALUES ('Generic', 0) RETURNING carteid`
        );
        carteCadeauxId = newCardResult.rows[0].carteid;
      }
    }
    
    const result = await pool.query(
      `INSERT INTO offre 
       (nombeneficiaire, emailbeneficiaire, numtelephonebeneficiaire, nomenvoyeur, note, cartecadeaux, service, durée, codeunique) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [NomBeneficiaire, EmailBeneficiaire, NumTelephoneBeneficiaire, NomEnvoyeur, Note, carteCadeauxId, Service, Durée, uniqueCode]
    );
    return result.rows[0];
  }

  // Update offer
  static async update(offreUuid, data) {
    const {
      NomBeneficiaire,
      EmailBeneficiaire,
      NumTelephoneBeneficiaire,
      NomEnvoyeur,
      Note,
      CarteCadeaux,
      Service,
      Durée,
      CodeUnique
    } = data;
    
    const result = await pool.query(
      `UPDATE offre 
       SET nombeneficiaire = $1, emailbeneficiaire = $2, numtelephonebeneficiaire = $3, 
           nomenvoyeur = $4, note = $5, cartecadeaux = $6, service = $7, durée = $8, 
           codeunique = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE offre_uuid = $10 RETURNING *`,
      [NomBeneficiaire, EmailBeneficiaire, NumTelephoneBeneficiaire, NomEnvoyeur, Note, CarteCadeaux, Service, Durée, CodeUnique, offreUuid]
    );
    return result.rows[0];
  }

  // Delete offer
  static async delete(offreUuid) {
    const result = await pool.query(
      'DELETE FROM offre WHERE offre_uuid = $1 RETURNING *',
      [offreUuid]
    );
    return result.rows[0];
  }
}

