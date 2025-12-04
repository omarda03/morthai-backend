import pool from '../config/database.js';

export class ReservationNote {
  // Get all notes for a reservation
  static async getByReservationId(reservationUuid) {
    const result = await pool.query(
      `SELECT note_uuid, reservation_uuid, note, created_by, created_at
       FROM reservation_notes
       WHERE reservation_uuid = $1
       ORDER BY created_at ASC`,
      [reservationUuid]
    );
    return result.rows;
  }

  // Create a new note
  static async create(data) {
    const { reservation_uuid, note, created_by } = data;
    
    const result = await pool.query(
      `INSERT INTO reservation_notes (reservation_uuid, note, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [reservation_uuid, note, created_by]
    );
    
    return result.rows[0];
  }

  // Delete a note
  static async delete(noteUuid) {
    const result = await pool.query(
      `DELETE FROM reservation_notes
       WHERE note_uuid = $1
       RETURNING *`,
      [noteUuid]
    );
    
    return result.rows[0];
  }
}

