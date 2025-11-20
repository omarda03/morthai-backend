import express from 'express';
import {
  getAllCarteCadeaux,
  getCarteCadeauxById,
  createCarteCadeaux,
  updateCarteCadeaux,
  deleteCarteCadeaux
} from '../controllers/carteCadeauxController.js';

const router = express.Router();

/**
 * @swagger
 * /api/cartes-cadeaux:
 *   get:
 *     summary: Get all gift cards
 *     tags: [Gift Cards]
 *     responses:
 *       200:
 *         description: List of all gift cards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CarteCadeaux'
 */
router.get('/', getAllCarteCadeaux);

/**
 * @swagger
 * /api/cartes-cadeaux/{id}:
 *   get:
 *     summary: Get a gift card by ID
 *     tags: [Gift Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Gift card UUID
 *     responses:
 *       200:
 *         description: Gift card details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarteCadeaux'
 *       404:
 *         description: Gift card not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getCarteCadeauxById);

/**
 * @swagger
 * /api/cartes-cadeaux:
 *   post:
 *     summary: Create a new gift card
 *     tags: [Gift Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Theme
 *               - Prix
 *             properties:
 *               Theme:
 *                 type: string
 *                 example: Anniversary
 *               Prix:
 *                 type: number
 *                 format: decimal
 *                 example: 1000.00
 *     responses:
 *       201:
 *         description: Gift card created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarteCadeaux'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createCarteCadeaux);

/**
 * @swagger
 * /api/cartes-cadeaux/{id}:
 *   put:
 *     summary: Update a gift card
 *     tags: [Gift Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Gift card UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Theme
 *               - Prix
 *             properties:
 *               Theme:
 *                 type: string
 *               Prix:
 *                 type: number
 *                 format: decimal
 *     responses:
 *       200:
 *         description: Gift card updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarteCadeaux'
 *       404:
 *         description: Gift card not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateCarteCadeaux);

/**
 * @swagger
 * /api/cartes-cadeaux/{id}:
 *   delete:
 *     summary: Delete a gift card
 *     tags: [Gift Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Gift card UUID
 *     responses:
 *       200:
 *         description: Gift card deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gift card deleted successfully
 *                 carte:
 *                   $ref: '#/components/schemas/CarteCadeaux'
 *       404:
 *         description: Gift card not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteCarteCadeaux);

export default router;

