import express from 'express';
import {
  getAllOffres,
  getOffreById,
  getOffreByCode,
  createOffre,
  updateOffre,
  deleteOffre
} from '../controllers/offreController.js';

const router = express.Router();

/**
 * @swagger
 * /api/offres:
 *   get:
 *     summary: Get all offers
 *     tags: [Offers]
 *     responses:
 *       200:
 *         description: List of all offers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Offre'
 */
router.get('/', getAllOffres);

/**
 * @swagger
 * /api/offres/code/{code}:
 *   get:
 *     summary: Get an offer by unique code
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique offer code
 *         example: "A1B2C3D4"
 *     responses:
 *       200:
 *         description: Offer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Offre'
 *       404:
 *         description: Offer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/code/:code', getOffreByCode);

/**
 * @swagger
 * /api/offres/{id}:
 *   get:
 *     summary: Get an offer by ID
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Offer UUID
 *     responses:
 *       200:
 *         description: Offer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Offre'
 *       404:
 *         description: Offer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getOffreById);

/**
 * @swagger
 * /api/offres:
 *   post:
 *     summary: Create a new offer
 *     tags: [Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - NomBeneficiaire
 *               - EmailBeneficiaire
 *               - NumTelephoneBeneficiaire
 *               - NomEnvoyeur
 *               - CarteCadeaux
 *               - Service
 *               - Durée
 *             properties:
 *               NomBeneficiaire:
 *                 type: string
 *                 example: Jane Doe
 *               EmailBeneficiaire:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               NumTelephoneBeneficiaire:
 *                 type: string
 *                 example: "+212612345679"
 *               NomEnvoyeur:
 *                 type: string
 *                 example: John Doe
 *               Note:
 *                 type: string
 *                 example: "Happy Birthday!"
 *               CarteCadeaux:
 *                 type: string
 *                 format: uuid
 *                 description: Gift card UUID
 *               Service:
 *                 type: string
 *                 format: uuid
 *                 description: Service UUID
 *               Durée:
 *                 type: integer
 *                 example: 60
 *               CodeUnique:
 *                 type: string
 *                 description: Unique code (auto-generated if not provided)
 *                 example: "A1B2C3D4"
 *     responses:
 *       201:
 *         description: Offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Offre'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createOffre);

/**
 * @swagger
 * /api/offres/{id}:
 *   put:
 *     summary: Update an offer
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Offer UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NomBeneficiaire:
 *                 type: string
 *               EmailBeneficiaire:
 *                 type: string
 *                 format: email
 *               NumTelephoneBeneficiaire:
 *                 type: string
 *               NomEnvoyeur:
 *                 type: string
 *               Note:
 *                 type: string
 *               CarteCadeaux:
 *                 type: string
 *                 format: uuid
 *               Service:
 *                 type: string
 *                 format: uuid
 *               Durée:
 *                 type: integer
 *               CodeUnique:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Offre'
 *       404:
 *         description: Offer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateOffre);

/**
 * @swagger
 * /api/offres/{id}:
 *   delete:
 *     summary: Delete an offer
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Offer UUID
 *     responses:
 *       200:
 *         description: Offer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Offer deleted successfully
 *                 offre:
 *                   $ref: '#/components/schemas/Offre'
 *       404:
 *         description: Offer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteOffre);

export default router;

