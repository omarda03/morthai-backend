import pool from '../config/database.js';
import { Offre } from './Offre.js';

export class Reservation {
  // Get all reservations with optional filters
  static async getAll(filters = {}) {
    // If filtering by 'offre' type, we need to get offers from offre table
    if (filters.type === 'offre') {
      return await this.getOffresAsReservations(filters);
    }

    // Get reservations
    let query = `
      SELECT r.*, 
        s.nomservice_fr as "NomServiceFr",
        s.nomservice_en as "NomServiceEn",
        s.nomservice as "NomService",
        s.reference as "ServiceReference"
      FROM reservation r 
      LEFT JOIN service s ON r.service_uuid = s.service_uuid 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Search by reference or client name
    if (filters.search) {
      query += ` AND (r.reference ILIKE $${paramCount} OR r.nomclient ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      query += ` AND r.statusres = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    // Filter by payment method
    if (filters.payment && filters.payment !== 'all') {
      if (filters.payment === 'en_ligne') {
        query += ` AND (r.modepaiement ILIKE $${paramCount} OR r.modepaiement ILIKE $${paramCount + 1})`;
        params.push('%ligne%', '%online%');
        paramCount += 2;
      } else if (filters.payment === 'au_spa') {
        query += ` AND r.modepaiement ILIKE $${paramCount}`;
        params.push('%spa%');
        paramCount++;
      }
    }

    // Filter by date (single date) - prioritize date range if both are provided
    // Date range takes precedence over single date
    // Note: We filter by created_at (date of command) to match what's displayed in "Date cmd" column
    if (filters.dateStart && filters.dateEnd) {
      // Filter by date range (date of command - created_at)
      query += ` AND DATE(r.created_at) BETWEEN $${paramCount}::date AND $${paramCount + 1}::date`;
      params.push(filters.dateStart, filters.dateEnd);
      paramCount += 2;
    } else if (filters.date) {
      // Filter by single date (date of command - created_at)
      query += ` AND DATE(r.created_at) = $${paramCount}::date`;
      params.push(filters.date);
      paramCount++;
    } else if (filters.dateStart && !filters.dateEnd) {
      // Only start date provided - filter from that date onwards
      query += ` AND DATE(r.created_at) >= $${paramCount}::date`;
      params.push(filters.dateStart);
      paramCount++;
    } else if (filters.dateEnd && !filters.dateStart) {
      // Only end date provided - filter up to that date
      query += ` AND DATE(r.created_at) <= $${paramCount}::date`;
      params.push(filters.dateEnd);
      paramCount++;
    }

    // Filter by type (reservation vs offer)
    // If filter is 'reservation', only show reservations (already filtered above)
    // Type 'offre' is handled separately in getOffresAsReservations
    if (filters.type === 'reservation') {
      // Already showing reservations, no additional filter needed
    }

    query += ` ORDER BY r.created_at DESC, r.dateres DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get offers formatted as reservations for unified display
  static async getOffresAsReservations(filters = {}) {
    // Base query for offers
    let query = `
      SELECT 
        o.offre_uuid as reservation_uuid,
        o.nombeneficiaire as nomclient,
        o.emailbeneficiaire as email,
        o.numtelephonebeneficiaire as numerotelephone,
        o.created_at::date as dateres,
        NULL::time as heureres,
        o.service as service_uuid,
        NULL as modepaiement,
        COALESCE(cc.prix, 0) as prixtotal,
        1 as nbrpersonne,
        'confirmed' as statusres,
        o.note,
        o.created_at,
        o.updated_at,
        'MOR-OFFRE-' || SUBSTRING(o.offre_uuid::text, 1, 8) as reference,
        'offre' as type,
        s.nomservice_fr as "NomServiceFr",
        s.nomservice_en as "NomServiceEn",
        s.nomservice as "NomService",
        s.reference as "ServiceReference"
      FROM offre o
      LEFT JOIN cartecadeaux cc ON o.cartecadeaux = cc.carteid
      LEFT JOIN service s ON o.service = s.service_uuid
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Apply same filters as reservations (search, date, etc.)
    if (filters.search) {
      query += ` AND (o.nombeneficiaire ILIKE $${paramCount} OR o.codeunique ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Note: Offers are always 'confirmed' status, so only filter if status is 'confirmed'
    if (filters.status && filters.status !== 'all' && filters.status !== 'confirmed') {
      // If filtering by non-confirmed status, return no offers (as all offers are confirmed)
      query += ` AND 1=0`;
    }

    if (filters.date) {
      query += ` AND DATE(o.created_at) = $${paramCount}::date`;
      params.push(filters.date);
      paramCount++;
    }

    if (filters.dateStart && filters.dateEnd) {
      query += ` AND DATE(o.created_at) BETWEEN $${paramCount}::date AND $${paramCount + 1}::date`;
      params.push(filters.dateStart, filters.dateEnd);
      paramCount += 2;
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
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
    
    // If update was successful, get full details with service name
    if (result.rows[0]) {
      const fullDetails = await pool.query(`
        SELECT r.*, s.nomservice as "NomService", s.prix as "ServicePrix", s.durée as "ServiceDuree"
        FROM reservation r 
        LEFT JOIN service s ON r.service_uuid = s.service_uuid 
        WHERE r.reservation_uuid = $1
      `, [reservationUuid]);
      return fullDetails.rows[0];
    }
    
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

