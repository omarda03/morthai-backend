import pool from '../config/database.js';

export class Reservation {
  // Get all reservations
  static async getAll() {
    const result = await pool.query(`
      SELECT r.*, s.nomservice as "NomService", s.prix as "ServicePrix"
      FROM reservation r 
      LEFT JOIN service s ON r.service_uuid = s.service_uuid 
      ORDER BY r.dateres DESC, r.heureres DESC
    `);
    return result.rows;
  }

  // Get reservation by ID
  static async getById(reservationUuid) {
    const result = await pool.query(`
      SELECT r.*, s.nomservice as "NomService", s.prix as "ServicePrix", s.durée as "ServiceDuree"
      FROM reservation r 
      LEFT JOIN service s ON r.service_uuid = s.service_uuid 
      WHERE r.reservation_uuid = $1
    `, [reservationUuid]);
    return result.rows[0];
  }

  // Get reservations by date
  static async getByDate(date) {
    const result = await pool.query(`
      SELECT r.*, s.nomservice as "NomService", s.prix as "ServicePrix"
      FROM reservation r 
      LEFT JOIN service s ON r.service_uuid = s.service_uuid 
      WHERE r.dateres = $1 
      ORDER BY r.heureres ASC
    `, [date]);
    return result.rows;
  }

  // Get reservations by status
  static async getByStatus(status) {
    const result = await pool.query(`
      SELECT r.*, s.nomservice as "NomService", s.prix as "ServicePrix"
      FROM reservation r 
      LEFT JOIN service s ON r.service_uuid = s.service_uuid 
      WHERE r.statusres = $1 
      ORDER BY r.dateres DESC, r.heureres DESC
    `, [status]);
    return result.rows;
  }

  // Create new reservation
  static async create(data) {
    const {
      NomClient,
      Email,
      NumeroTelephone,
      DateRes,
      HeureRes,
      Service_UUID,
      ModePaiement,
      PrixTotal,
      NbrPersonne,
      StatusRes,
      Note
    } = data;
    
    const result = await pool.query(
      `INSERT INTO reservation 
       (nomclient, email, numerotelephone, dateres, heureres, service_uuid, modepaiement, prixtotal, nbrpersonne, statusres, note) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [NomClient, Email, NumeroTelephone, DateRes, HeureRes, Service_UUID, ModePaiement, PrixTotal, NbrPersonne || 1, StatusRes || 'pending', Note]
    );
    return result.rows[0];
  }

  // Update reservation
  static async update(reservationUuid, data) {
    const {
      NomClient,
      Email,
      NumeroTelephone,
      DateRes,
      HeureRes,
      Service_UUID,
      ModePaiement,
      PrixTotal,
      NbrPersonne,
      StatusRes,
      Note
    } = data;
    
    const result = await pool.query(
      `UPDATE reservation 
       SET nomclient = $1, email = $2, numerotelephone = $3, dateres = $4, heureres = $5, 
           service_uuid = $6, modepaiement = $7, prixtotal = $8, nbrpersonne = $9, 
           statusres = $10, note = $11, updated_at = CURRENT_TIMESTAMP 
       WHERE reservation_uuid = $12 RETURNING *`,
      [NomClient, Email, NumeroTelephone, DateRes, HeureRes, Service_UUID, ModePaiement, PrixTotal, NbrPersonne, StatusRes, Note, reservationUuid]
    );
    return result.rows[0];
  }

  // Delete reservation
  static async delete(reservationUuid) {
    const result = await pool.query(
      'DELETE FROM reservation WHERE reservation_uuid = $1 RETURNING *',
      [reservationUuid]
    );
    return result.rows[0];
  }
}

