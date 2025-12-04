import pool from '../config/database.js';

export class ReservationEmail {
  // Get all emails for a reservation (conversation thread)
  static async getByReservationId(reservationUuid) {
    const result = await pool.query(
      `SELECT email_uuid, reservation_uuid, email_type, subject, from_email, to_email, 
              body_text, body_html, message_id, thread_id, in_reply_to, direction, 
              sent_by, created_at
       FROM reservation_emails
       WHERE reservation_uuid = $1
       ORDER BY created_at ASC`,
      [reservationUuid]
    );
    return result.rows;
  }

  // Get emails by thread ID
  static async getByThreadId(threadId) {
    const result = await pool.query(
      `SELECT email_uuid, reservation_uuid, email_type, subject, from_email, to_email, 
              body_text, body_html, message_id, thread_id, in_reply_to, direction, 
              sent_by, created_at
       FROM reservation_emails
       WHERE thread_id = $1
       ORDER BY created_at ASC`,
      [threadId]
    );
    return result.rows;
  }

  // Get email by message ID
  static async getByMessageId(messageId) {
    const result = await pool.query(
      `SELECT email_uuid, reservation_uuid, email_type, subject, from_email, to_email, 
              body_text, body_html, message_id, thread_id, in_reply_to, direction, 
              sent_by, created_at
       FROM reservation_emails
       WHERE message_id = $1`,
      [messageId]
    );
    return result.rows[0];
  }

  // Create a new email record
  static async create(data) {
    const {
      reservation_uuid,
      email_type,
      subject,
      from_email,
      to_email,
      body_text,
      body_html,
      message_id,
      thread_id,
      in_reply_to,
      direction,
      sent_by
    } = data;
    
    const result = await pool.query(
      `INSERT INTO reservation_emails 
       (reservation_uuid, email_type, subject, from_email, to_email, body_text, body_html, 
        message_id, thread_id, in_reply_to, direction, sent_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        reservation_uuid,
        email_type,
        subject,
        from_email,
        to_email,
        body_text || null,
        body_html || null,
        message_id || null,
        thread_id || null,
        in_reply_to || null,
        direction,
        sent_by || null
      ]
    );
    
    return result.rows[0];
  }

  // Update thread_id for emails that don't have one
  static async updateThreadId(messageId, threadId) {
    const result = await pool.query(
      `UPDATE reservation_emails
       SET thread_id = $1
       WHERE message_id = $2
       RETURNING *`,
      [threadId, messageId]
    );
    return result.rows[0];
  }
}

