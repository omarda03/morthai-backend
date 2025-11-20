import pool from '../config/database.js';
import { randomBytes } from 'crypto';

export class Offre {
  // Generate unique code
  static generateUniqueCode() {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  // Get all offers
  static async getAll() {
    const result = await pool.query(`
      SELECT o.*, 
             cc.theme as "CarteTheme", cc.prix as "CartePrix",
             s.nomservice as "NomService", s.prix as "ServicePrix"
      FROM offre o 
      LEFT JOIN cartecadeaux cc ON o.cartecadeaux = cc.carteid 
      LEFT JOIN service s ON o.service = s.service_uuid 
      ORDER BY o.created_at DESC
    `);
    return result.rows;
  }

  // Get offer by ID
  static async getById(offreUuid) {
    const result = await pool.query(`
      SELECT o.*, 
             cc.theme as "CarteTheme", cc.prix as "CartePrix",
             s.nomservice as "NomService", s.prix as "ServicePrix", s.durée as "ServiceDuree"
      FROM offre o 
      LEFT JOIN cartecadeaux cc ON o.cartecadeaux = cc.carteid 
      LEFT JOIN service s ON o.service = s.service_uuid 
      WHERE o.offre_uuid = $1
    `, [offreUuid]);
    return result.rows[0];
  }

  // Get offer by unique code
  static async getByCode(codeUnique) {
    const result = await pool.query(`
      SELECT o.*, 
             cc.theme as "CarteTheme", cc.prix as "CartePrix",
             s.nomservice as "NomService", s.prix as "ServicePrix", s.durée as "ServiceDuree"
      FROM offre o 
      LEFT JOIN cartecadeaux cc ON o.cartecadeaux = cc.carteid 
      LEFT JOIN service s ON o.service = s.service_uuid 
      WHERE o.codeunique = $1
    `, [codeUnique]);
    return result.rows[0];
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
    
    const result = await pool.query(
      `INSERT INTO offre 
       (nombeneficiaire, emailbeneficiaire, numtelephonebeneficiaire, nomenvoyeur, note, cartecadeaux, service, durée, codeunique) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [NomBeneficiaire, EmailBeneficiaire, NumTelephoneBeneficiaire, NomEnvoyeur, Note, CarteCadeaux, Service, Durée, uniqueCode]
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

