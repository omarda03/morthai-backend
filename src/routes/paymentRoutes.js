import express from 'express';
import {
  createPayment,
  createOfferPayment,
  paymentCallback,
  verifyPayment
} from '../controllers/paymentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/payment/reservation/{reservationId}:
 *   post:
 *     summary: Create payment request for a reservation
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - amount
 *               - reference
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jean"
 *               lastName:
 *                 type: string
 *                 example: "Dupont"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jean@example.com"
 *               phone:
 *                 type: string
 *                 example: "+212612345678"
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               reference:
 *                 type: string
 *                 example: "MOR-1234567890"
 *     responses:
 *       200:
 *         description: Payment form HTML generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 form:
 *                   type: string
 *                   description: HTML form string to submit to CMI
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error or CMI not configured
 */
router.post('/reservation/:reservationId', createPayment);

/**
 * @swagger
 * /api/payment/offer/{offerId}:
 *   post:
 *     summary: Create payment request for an offer
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - amount
 *               - reference
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jean"
 *               lastName:
 *                 type: string
 *                 example: "Dupont"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jean@example.com"
 *               phone:
 *                 type: string
 *                 example: "+212612345678"
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               reference:
 *                 type: string
 *                 example: "A1B2C3D4"
 *     responses:
 *       200:
 *         description: Payment form HTML generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 form:
 *                   type: string
 *                   description: HTML form string to submit to CMI
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error or CMI not configured
 */
router.post('/offer/:offerId', createOfferPayment);

/**
 * @swagger
 * /api/payment/callback:
 *   post:
 *     summary: CMI payment callback endpoint (server-to-server)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               HASH:
 *                 type: string
 *               ProcReturnCode:
 *                 type: string
 *               Response:
 *                 type: string
 *               oid:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "OK"
 *       400:
 *         description: Hash verification failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "FAILURE"
 *       500:
 *         description: Server error
 */
router.post('/callback', paymentCallback);

/**
 * @swagger
 * /api/payment/verify:
 *   get:
 *     summary: Verify payment from redirect URL
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: HASH
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: oid
 *         schema:
 *           type: string
 *       - in: query
 *         name: amount
 *         schema:
 *           type: string
 *       - in: query
 *         name: ProcReturnCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 verification:
 *                   type: string
 *                   enum: [POSTAUTH, APPROVED, FAILURE]
 *                 orderId:
 *                   type: string
 *                 amount:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/verify', verifyPayment);

export default router;

