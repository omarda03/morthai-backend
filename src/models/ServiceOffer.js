import pool from '../config/database.js';

export class ServiceOffer {
  // Get all offers for a service
  static async getByService(serviceUuid) {
    const result = await pool.query(`
      SELECT * FROM service_offers
      WHERE service_uuid = $1
      ORDER BY display_order ASC, durée ASC
    `, [serviceUuid]);
    return result.rows;
  }

  // Get offer by ID
  static async getById(offerUuid) {
    const result = await pool.query(
      'SELECT * FROM service_offers WHERE offer_uuid = $1',
      [offerUuid]
    );
    return result.rows[0];
  }

  // Create new offer
  static async create(data) {
    const { Service_UUID, Durée, PrixMad, PrixEur, DisplayOrder } = data;
    
    const result = await pool.query(
      `INSERT INTO service_offers (service_uuid, durée, prix_mad, prix_eur, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [Service_UUID, Durée, PrixMad, PrixEur, DisplayOrder || 0]
    );
    return result.rows[0];
  }

  // Create multiple offers
  static async createMultiple(serviceUuid, offers) {
    if (!offers || offers.length === 0) return [];

    const createdOffers = [];
    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i];
      const result = await pool.query(
        `INSERT INTO service_offers (service_uuid, durée, prix_mad, prix_eur, display_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [serviceUuid, offer.durée, offer.prix_mad, offer.prix_eur, i]
      );
      createdOffers.push(result.rows[0]);
    }
    return createdOffers;
  }

  // Update offer
  static async update(offerUuid, data) {
    const { Durée, PrixMad, PrixEur, DisplayOrder } = data;
    
    const result = await pool.query(
      `UPDATE service_offers 
       SET durée = $1, prix_mad = $2, prix_eur = $3, display_order = $4, updated_at = CURRENT_TIMESTAMP
       WHERE offer_uuid = $5 RETURNING *`,
      [Durée, PrixMad, PrixEur, DisplayOrder || 0, offerUuid]
    );
    return result.rows[0];
  }

  // Delete offer
  static async delete(offerUuid) {
    const result = await pool.query(
      'DELETE FROM service_offers WHERE offer_uuid = $1 RETURNING *',
      [offerUuid]
    );
    return result.rows[0];
  }

  // Delete all offers for a service
  static async deleteByService(serviceUuid) {
    const result = await pool.query(
      'DELETE FROM service_offers WHERE service_uuid = $1 RETURNING *',
      [serviceUuid]
    );
    return result.rows;
  }
}

