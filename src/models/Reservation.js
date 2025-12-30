import pool from '../config/database.js';

export class Reservation {
  // Get all reservations with optional filters
  static async getAll(filters = {}) {
    // If filtering by 'offre' type, we need to get offers from offre table
    if (filters.type === 'offre') {
      return await this.getOffresAsReservations(filters);
    }

    // Get reservations
    let query = `
      SELECT 
        r.reservation_uuid,
        r.nomclient,
        r.email,
        r.numerotelephone,
        r.dateres,
        r.heureres,
        r.service_uuid,
        r.modepaiement,
        r.prixtotal,
        r.nbrpersonne,
        r.statusres,
        r.note,
        r.created_at,
        r.updated_at,
        r.reference,
        COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
        COALESCE(r.is_viewed, FALSE) as is_viewed,
        r.last_viewed_by,
        r.last_viewed_at,
        r.last_modified_by,
        r.last_modified_at,
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
      query += ` AND (COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) ILIKE $${paramCount} OR r.nomclient ILIKE $${paramCount})`;
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

  // Get reservation by ID (UUID or reference)
  static async getById(identifier) {
    // Check if identifier is a UUID (contains hyphens) or a reference (MOR-XXXX)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let query = `
      SELECT 
        r.reservation_uuid,
        r.nomclient,
        r.email,
        r.numerotelephone,
        r.dateres,
        r.heureres,
        r.service_uuid,
        r.modepaiement,
        r.prixtotal,
        r.nbrpersonne,
        r.statusres,
        r.note,
        r.created_at,
        r.updated_at,
        r.reference,
        COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
        COALESCE(r.is_viewed, FALSE) as is_viewed,
        r.last_viewed_by,
        r.last_viewed_at,
        r.last_modified_by,
        r.last_modified_at,
        s.nomservice as "NomService", 
        s.nomservice_fr as "NomServiceFr",
        s.nomservice_en as "NomServiceEn"
      FROM reservation r 
      LEFT JOIN service s ON r.service_uuid = s.service_uuid 
      WHERE `;
    
    if (isUUID) {
      query += `r.reservation_uuid = $1`;
    } else {
      // Search by reference
      query += `COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) = $1`;
    }
    
    try {
      const result = await pool.query(query, [identifier]);
      return result.rows[0];
    } catch (error) {
      // If is_viewed column doesn't exist, try without it
      if (error.message && error.message.includes('is_viewed')) {
        let fallbackQuery = `
          SELECT 
            r.reservation_uuid,
            r.nomclient,
            r.email,
            r.numerotelephone,
            r.dateres,
            r.heureres,
            r.service_uuid,
            r.modepaiement,
            r.prixtotal,
            r.nbrpersonne,
            r.statusres,
            r.note,
            r.created_at,
            r.updated_at,
            r.reference,
            COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
            FALSE as is_viewed,
            s.nomservice as "NomService", 
            s.nomservice_fr as "NomServiceFr",
            s.nomservice_en as "NomServiceEn"
          FROM reservation r 
          LEFT JOIN service s ON r.service_uuid = s.service_uuid 
          WHERE `;
        
        if (isUUID) {
          fallbackQuery += `r.reservation_uuid = $1`;
        } else {
          fallbackQuery += `COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) = $1`;
        }
        
        const fallbackResult = await pool.query(fallbackQuery, [identifier]);
        return fallbackResult.rows[0];
      }
      throw error;
    }
  }

  // Get reservations by date
  static async getByDate(date) {
    const result = await pool.query(`
      SELECT 
        r.reservation_uuid,
        r.nomclient,
        r.email,
        r.numerotelephone,
        r.dateres,
        r.heureres,
        r.service_uuid,
        r.modepaiement,
        r.prixtotal,
        r.nbrpersonne,
        r.statusres,
        r.note,
        r.created_at,
        r.updated_at,
        r.reference,
        COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
        COALESCE(r.is_viewed, FALSE) as is_viewed,
        r.last_viewed_by,
        r.last_viewed_at,
        r.last_modified_by,
        r.last_modified_at,
        s.nomservice as "NomService", 
        s.nomservice_fr as "NomServiceFr",
        s.nomservice_en as "NomServiceEn"
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
      SELECT 
        r.reservation_uuid,
        r.nomclient,
        r.email,
        r.numerotelephone,
        r.dateres,
        r.heureres,
        r.service_uuid,
        r.modepaiement,
        r.prixtotal,
        r.nbrpersonne,
        r.statusres,
        r.note,
        r.created_at,
        r.updated_at,
        r.reference,
        COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
        COALESCE(r.is_viewed, FALSE) as is_viewed,
        r.last_viewed_by,
        r.last_viewed_at,
        r.last_modified_by,
        r.last_modified_at,
        s.nomservice as "NomService", 
        s.nomservice_fr as "NomServiceFr",
        s.nomservice_en as "NomServiceEn"
      FROM reservation r 
      LEFT JOIN service s ON r.service_uuid = s.service_uuid 
      WHERE r.statusres = $1 
      ORDER BY r.dateres DESC, r.heureres DESC
    `, [status]);
    return result.rows;
  }

  // Create new reservation with auto-increment reference
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
      Note,
      Reference
    } = data;
    
    // Step 1: Create reservation with temporary reference 'MOR-0'
    const tempReference = Reference || 'MOR-0';
    
    const insertResult = await pool.query(
      `INSERT INTO reservation 
       (nomclient, email, numerotelephone, dateres, heureres, service_uuid, modepaiement, prixtotal, nbrpersonne, statusres, note, reference) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [NomClient, Email, NumeroTelephone, DateRes, HeureRes, Service_UUID, ModePaiement, PrixTotal, NbrPersonne || 1, StatusRes || 'pending', Note, tempReference]
    );
    
    const savedReservation = insertResult.rows[0];
    
    // Step 2: If reference was not provided, generate final reference using sequence
    if (!Reference) {
      try {
        // Get next value from sequence
        const sequenceResult = await pool.query(`
          SELECT nextval('reservation_reference_seq') as next_id
        `);
        
        const referenceId = sequenceResult.rows[0].next_id;
        const finalReference = `MOR-${referenceId}`;
        
        // Step 3: Update reservation with final reference
        const updateResult = await pool.query(
          `UPDATE reservation 
           SET reference = $1 
           WHERE reservation_uuid = $2 
           RETURNING *`,
          [finalReference, savedReservation.reservation_uuid]
        );
        
        return updateResult.rows[0];
      } catch (error) {
        // If sequence doesn't exist or fails, fallback to timestamp-based
        console.error('Error generating reference from sequence:', error);
        const timestamp = Date.now();
        const fallbackReference = `MOR-${timestamp.toString().substring(0, 10)}`;
        
        const updateResult = await pool.query(
          `UPDATE reservation 
           SET reference = $1 
           WHERE reservation_uuid = $2 
           RETURNING *`,
          [fallbackReference, savedReservation.reservation_uuid]
        );
        
        return updateResult.rows[0];
      }
    }
    
    // If reference was provided, return the reservation as-is
    return savedReservation;
  }

  // Update reservation
  static async update(reservationUuid, data, modifiedBy = null) {
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
           statusres = $10, note = $11, updated_at = CURRENT_TIMESTAMP,
           last_modified_by = $13, last_modified_at = CURRENT_TIMESTAMP 
       WHERE reservation_uuid = $12 RETURNING *`,
      [NomClient, Email, NumeroTelephone, DateRes, HeureRes, Service_UUID, ModePaiement, PrixTotal, NbrPersonne, StatusRes, Note, reservationUuid, modifiedBy]
    );
    
    // If update was successful, get full details with service name
    if (result.rows[0]) {
      const fullDetails = await pool.query(`
        SELECT 
          r.reservation_uuid,
          r.nomclient,
          r.email,
          r.numerotelephone,
          r.dateres,
          r.heureres,
          r.service_uuid,
          r.modepaiement,
          r.prixtotal,
          r.nbrpersonne,
          r.statusres,
          r.note,
          r.created_at,
          r.updated_at,
          r.reference,
          COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
          COALESCE(r.is_viewed, FALSE) as is_viewed,
          r.last_viewed_by,
          r.last_viewed_at,
          r.last_modified_by,
          r.last_modified_at,
          s.nomservice as "NomService", 
          s.nomservice_fr as "NomServiceFr",
          s.nomservice_en as "NomServiceEn"
        FROM reservation r 
        LEFT JOIN service s ON r.service_uuid = s.service_uuid 
        WHERE r.reservation_uuid = $1
      `, [reservationUuid]);
      return fullDetails.rows[0];
    }
    
    return result.rows[0];
  }

  // Mark reservation as viewed
  static async markAsViewed(reservationUuid, viewedBy = null) {
    try {
      // First check if is_viewed column exists
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reservation' AND column_name = 'is_viewed'
      `);
      
      if (columnCheck.rows.length === 0) {
        // Column doesn't exist, return null to indicate it couldn't be marked
        console.warn('⚠️ is_viewed column does not exist in reservation table');
        return null;
      }
      
      const result = await pool.query(
        'UPDATE reservation SET is_viewed = TRUE, last_viewed_by = $2, last_viewed_at = CURRENT_TIMESTAMP WHERE reservation_uuid = $1 RETURNING *',
        [reservationUuid, viewedBy]
      );
      return result.rows[0];
    } catch (error) {
      // If column doesn't exist or other error, log and return null
      console.warn('⚠️ Error marking reservation as viewed:', error.message);
      return null;
    }
  }

  // Get reservations viewed but not modified (for admin notifications)
  static async getViewedButNotModified(currentAdminEmail) {
    try {
      // Check if is_viewed column exists
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reservation' AND column_name = 'is_viewed'
      `);
      
      if (columnCheck.rows.length === 0) {
        // Column doesn't exist, return empty array
        return [];
      }
      
      const result = await pool.query(
        `SELECT 
          r.reservation_uuid,
          r.nomclient,
          r.email,
          r.numerotelephone,
          r.dateres,
          r.heureres,
          r.service_uuid,
          r.modepaiement,
          r.prixtotal,
          r.nbrpersonne,
          r.statusres,
          r.note,
          r.created_at,
          r.updated_at,
          r.reference,
          COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
          r.is_viewed,
          r.last_viewed_by,
          r.last_viewed_at,
          r.last_modified_by,
          r.last_modified_at,
          s.nomservice_fr as "NomServiceFr",
          s.nomservice as "NomService",
          u.nom as "viewed_by_name"
        FROM reservation r 
        LEFT JOIN service s ON r.service_uuid = s.service_uuid 
        INNER JOIN users u ON r.last_viewed_by = u.email
        WHERE r.is_viewed = TRUE 
          AND r.last_viewed_by IS NOT NULL
          AND r.last_viewed_by != $1
          AND r.last_viewed_by != 'unknown'
          AND u.nom IS NOT NULL
          AND (r.last_modified_at IS NULL OR r.last_viewed_at > r.last_modified_at)
        ORDER BY r.last_viewed_at DESC
        LIMIT 10`,
        [currentAdminEmail]
      );
      return result.rows;
    } catch (error) {
      console.warn('⚠️ Error getting viewed but not modified reservations:', error.message);
      return [];
    }
  }

  // Get reservations viewed by current admin but not modified
  static async getCurrentAdminViewedButNotModified(adminEmail) {
    try {
      // Check if is_viewed column exists
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reservation' AND column_name = 'is_viewed'
      `);
      
      if (columnCheck.rows.length === 0) {
        // Column doesn't exist, return empty array
        return [];
      }
      
      const result = await pool.query(
        `SELECT 
          r.reservation_uuid,
          r.nomclient,
          r.email,
          r.numerotelephone,
          r.dateres,
          r.heureres,
          r.service_uuid,
          r.modepaiement,
          r.prixtotal,
          r.nbrpersonne,
          r.statusres,
          r.note,
          r.created_at,
          r.updated_at,
          r.reference,
          COALESCE(r.reference, 'MOR-' || SUBSTRING(r.reservation_uuid::text, 1, 8)) as reference,
          r.is_viewed,
          r.last_viewed_by,
          r.last_viewed_at,
          r.last_modified_by,
          r.last_modified_at,
          s.nomservice_fr as "NomServiceFr",
          s.nomservice as "NomService"
        FROM reservation r 
        LEFT JOIN service s ON r.service_uuid = s.service_uuid 
        WHERE r.is_viewed = TRUE 
          AND r.last_viewed_by = $1
          AND (r.last_modified_at IS NULL OR r.last_viewed_at > r.last_modified_at)
          AND r.last_modified_by IS NULL
        ORDER BY r.last_viewed_at DESC`,
        [adminEmail]
      );
      return result.rows;
    } catch (error) {
      console.warn('⚠️ Error getting current admin viewed but not modified reservations:', error.message);
      return [];
    }
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

