import express from 'express';
import {
  getAllReservations,
  getReservationById,
  getReservationsByDate,
  getReservationsByStatus,
  createReservation,
  updateReservation,
  deleteReservation,
  getViewedButNotModifiedNotifications,
  sendWhatsApp,
  sendEmail,
  previewEmail
} from '../controllers/reservationController.js';
import {
  getReservationNotes,
  addReservationNote,
  deleteReservationNote
} from '../controllers/reservationNoteController.js';
import {
  getReservationEmails,
  syncGmailEmails
} from '../controllers/reservationEmailController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations with optional filters
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by reference or client name
 *         example: "MOR-123"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, confirmed, en_cours, completed, cancelled, refunded]
 *         description: Filter by reservation status
 *         example: "confirmed"
 *       - in: query
 *         name: payment
 *         schema:
 *           type: string
 *           enum: [all, en_ligne, au_spa]
 *         description: Filter by payment method
 *         example: "en_ligne"
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: "Filter by single date (YYYY-MM-DD)"
 *         example: "2024-12-25"
 *       - in: query
 *         name: dateStart
 *         schema:
 *           type: string
 *           format: date
 *         description: "Start date for date range filter (YYYY-MM-DD)"
 *         example: "2024-12-01"
 *       - in: query
 *         name: dateEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: "End date for date range filter (YYYY-MM-DD)"
 *         example: "2024-12-31"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, reservation, offre]
 *         description: "Filter by type (reservation or offer)"
 *         example: "reservation"
 *     responses:
 *       200:
 *         description: List of reservations matching the filters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   reservation_uuid:
 *                     type: string
 *                     format: uuid
 *                   reference:
 *                     type: string
 *                     example: "MOR-1234567890"
 *                   nomclient:
 *                     type: string
 *                   email:
 *                     type: string
 *                   dateres:
 *                     type: string
 *                     format: date
 *                   heureres:
 *                     type: string
 *                     format: time
 *                   prixtotal:
 *                     type: number
 *                   statusres:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/', getAllReservations);

/**
 * @swagger
 * /api/reservations/notifications/viewed-not-modified:
 *   get:
 *     summary: Get reservations viewed but not modified by other admins
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reservations viewed but not modified
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 */
router.get('/notifications/viewed-not-modified', authenticateToken, getViewedButNotModifiedNotifications);

/**
 * @swagger
 * /api/reservations/date/{date}:
 *   get:
 *     summary: Get reservations by date
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "Reservation date (YYYY-MM-DD)"
 *         example: "2024-12-25"
 *     responses:
 *       200:
 *         description: List of reservations for the specified date
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 */
router.get('/date/:date', getReservationsByDate);

/**
 * @swagger
 * /api/reservations/status/{status}:
 *   get:
 *     summary: Get reservations by status
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Reservation status
 *     responses:
 *       200:
 *         description: List of reservations with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 */
router.get('/status/:status', getReservationsByStatus);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get a reservation by ID
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: Reservation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getReservationById);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - NomClient
 *               - Email
 *               - NumeroTelephone
 *               - DateRes
 *               - HeureRes
 *               - Service_UUID
 *               - PrixTotal
 *             properties:
 *               NomClient:
 *                 type: string
 *                 description: Full name of the client
 *                 example: "John Doe"
 *               Email:
 *                 type: string
 *                 format: email
 *                 description: Client email address
 *                 example: "john@example.com"
 *               NumeroTelephone:
 *                 type: string
 *                 description: "Client phone number"
 *                 example: "+212612345678"
 *               DateRes:
 *                 type: string
 *                 format: date
 *                 description: "Reservation date (service date)"
 *                 example: "2024-12-25"
 *               HeureRes:
 *                 type: string
 *                 format: time
 *                 description: Reservation time
 *                 example: "14:00:00"
 *               Service_UUID:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the service being reserved
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               ModePaiement:
 *                 type: string
 *                 description: Payment method
 *                 enum: [cash, card, online, en ligne, au spa]
 *                 example: "cash"
 *               PrixTotal:
 *                 type: number
 *                 format: decimal
 *                 description: Total price in MAD
 *                 example: 500.00
 *               NbrPersonne:
 *                 type: integer
 *                 description: Number of people for the reservation
 *                 default: 1
 *                 minimum: 1
 *                 example: 1
 *               StatusRes:
 *                 type: string
 *                 description: Reservation status
 *                 enum: [pending, confirmed, en_cours, completed, cancelled, refunded]
 *                 default: pending
 *                 example: "pending"
 *               Note:
 *                 type: string
 *                 description: Optional notes or special requests
 *                 example: "Special request"
 *               Reference:
 *                 type: string
 *                 description: "Optional reference number (auto-generated if not provided)"
 *                 example: "MOR-1234567890"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservation_uuid:
 *                   type: string
 *                   format: uuid
 *                   example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 reference:
 *                   type: string
 *                   example: "MOR-1234567890"
 *                 nomclient:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john@example.com"
 *                 dateres:
 *                   type: string
 *                   format: date
 *                   example: "2024-12-25"
 *                 heureres:
 *                   type: string
 *                   format: time
 *                   example: "14:00:00"
 *                 prixtotal:
 *                   type: number
 *                   example: 500.00
 *                 statusres:
 *                   type: string
 *                   example: "pending"
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: "Bad request (missing required fields)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "NomClient is required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/', createReservation);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Update a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NomClient:
 *                 type: string
 *                 description: Full name of the client
 *                 example: "John Doe"
 *               Email:
 *                 type: string
 *                 format: email
 *                 description: Client email address
 *                 example: "john@example.com"
 *               NumeroTelephone:
 *                 type: string
 *                 description: Client phone number
 *                 example: "+212612345678"
 *               DateRes:
 *                 type: string
 *                 format: date
 *                 description: "Reservation date (service date)"
 *                 example: "2024-12-25"
 *               HeureRes:
 *                 type: string
 *                 format: time
 *                 description: Reservation time
 *                 example: "14:00:00"
 *               Service_UUID:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the service
 *               ModePaiement:
 *                 type: string
 *                 description: Payment method
 *                 enum: [cash, card, online, en ligne, au spa]
 *                 example: "cash"
 *               PrixTotal:
 *                 type: number
 *                 format: decimal
 *                 description: Total price in MAD
 *                 example: 500.00
 *               NbrPersonne:
 *                 type: integer
 *                 description: Number of people
 *                 example: 1
 *               StatusRes:
 *                 type: string
 *                 description: Reservation status
 *                 enum: [pending, confirmed, en_cours, completed, cancelled, refunded]
 *                 example: "confirmed"
 *               Note:
 *                 type: string
 *                 description: Optional notes
 *                 example: "Special request"
 *               Reference:
 *                 type: string
 *                 description: Reference number
 *                 example: "MOR-1234567890"
 *     responses:
 *       200:
 *         description: Reservation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservation_uuid:
 *                   type: string
 *                   format: uuid
 *                 reference:
 *                   type: string
 *                 nomclient:
 *                   type: string
 *                 email:
 *                   type: string
 *                 statusres:
 *                   type: string
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Reservation not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.put('/:id', updateReservation);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Delete a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: Reservation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reservation deleted successfully
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteReservation);

/**
 * @swagger
 * /api/reservations/{id}/whatsapp:
 *   post:
 *     summary: Send WhatsApp message for a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: WhatsApp message content
 *                 example: "Hello, your reservation has been confirmed!"
 *     responses:
 *       200:
 *         description: WhatsApp message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: "Bad request (missing message or phone number)"
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error or UltraMsg API error
 */
router.post('/:id/whatsapp', sendWhatsApp);

/**
 * @swagger
 * /api/reservations/{id}/email:
 *   post:
 *     summary: Send email for a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailType
 *               - message
 *             properties:
 *               emailType:
 *                 type: string
 *                 enum: [confirm, reminder, cancel, change]
 *                 description: Type of email to send
 *                 example: "reminder"
 *               message:
 *                 type: string
 *                 description: Custom message content (optional, will use default template if not provided)
 *                 example: "Custom message here"
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 description: Email language
 *                 default: fr
 *                 example: "fr"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 messageId:
 *                   type: string
 *       400:
 *         description: "Bad request (missing email type, message, or email address)"
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error or SMTP error
 */
router.post('/:id/email', sendEmail);

/**
 * @swagger
 * /api/reservations/{id}/email/preview:
 *   post:
 *     summary: Generate email HTML preview for a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailType
 *             properties:
 *               emailType:
 *                 type: string
 *                 enum: [confirm, reminder, cancel, change]
 *                 description: Type of email to preview
 *                 example: "reminder"
 *               message:
 *                 type: string
 *                 description: Custom message content (optional)
 *                 example: "Custom message here"
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 description: Email language
 *                 default: fr
 *                 example: "fr"
 *     responses:
 *       200:
 *         description: Email HTML preview generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 html:
 *                   type: string
 *                   description: HTML content of the email
 *       400:
 *         description: "Bad request (missing email type)"
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error
 */
router.post('/:id/email/preview', previewEmail);

// Reservation Notes Routes
/**
 * @swagger
 * /api/reservations/{id}/notes:
 *   get:
 *     summary: Get all notes for a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: List of notes for the reservation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   note_uuid:
 *                     type: string
 *                     format: uuid
 *                   reservation_uuid:
 *                     type: string
 *                     format: uuid
 *                   note:
 *                     type: string
 *                   created_by:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error
 */
router.get('/:id/notes', authenticateToken, getReservationNotes);

/**
 * @swagger
 * /api/reservations/{id}/notes:
 *   post:
 *     summary: Add a note to a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 description: Note content
 *                 example: "Client requested morning time slot"
 *     responses:
 *       201:
 *         description: Note added successfully
 *       400:
 *         description: Bad request (missing note)
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error
 */
router.post('/:id/notes', authenticateToken, addReservationNote);

/**
 * @swagger
 * /api/reservations/{id}/notes/{noteId}:
 *   delete:
 *     summary: Delete a note from a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       404:
 *         description: Reservation or note not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/notes/:noteId', authenticateToken, deleteReservationNote);

// Reservation Email Conversation Routes
/**
 * @swagger
 * /api/reservations/{id}/emails:
 *   get:
 *     summary: Get all emails (conversation) for a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: List of emails in the conversation
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error
 */
router.get('/:id/emails', authenticateToken, getReservationEmails);

/**
 * @swagger
 * /api/reservations/{id}/emails/sync:
 *   post:
 *     summary: Sync emails from Gmail API
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: Gmail sync initiated
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error
 */
router.post('/:id/emails/sync', authenticateToken, syncGmailEmails);

export default router;

