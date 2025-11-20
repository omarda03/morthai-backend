import express from 'express';
import {
  getAllReservations,
  getReservationById,
  getReservationsByDate,
  getReservationsByStatus,
  createReservation,
  updateReservation,
  deleteReservation
} from '../controllers/reservationController.js';

const router = express.Router();

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
 *     responses:
 *       200:
 *         description: List of all reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 */
router.get('/', getAllReservations);

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
 *         description: Reservation date (YYYY-MM-DD)
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
 *                 example: John Doe
 *               Email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               NumeroTelephone:
 *                 type: string
 *                 example: "+212612345678"
 *               DateRes:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *               HeureRes:
 *                 type: string
 *                 format: time
 *                 example: "14:00:00"
 *               Service_UUID:
 *                 type: string
 *                 format: uuid
 *               ModePaiement:
 *                 type: string
 *                 enum: [cash, card, online]
 *                 example: cash
 *               PrixTotal:
 *                 type: number
 *                 format: decimal
 *                 example: 500.00
 *               NbrPersonne:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *               StatusRes:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *                 default: pending
 *               Note:
 *                 type: string
 *                 example: "Special request"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *               Email:
 *                 type: string
 *                 format: email
 *               NumeroTelephone:
 *                 type: string
 *               DateRes:
 *                 type: string
 *                 format: date
 *               HeureRes:
 *                 type: string
 *                 format: time
 *               Service_UUID:
 *                 type: string
 *                 format: uuid
 *               ModePaiement:
 *                 type: string
 *               PrixTotal:
 *                 type: number
 *                 format: decimal
 *               NbrPersonne:
 *                 type: integer
 *               StatusRes:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *               Note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation updated successfully
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

export default router;

