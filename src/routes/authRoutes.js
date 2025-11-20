import express from 'express';
import { login, verifyToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/verify', authenticateToken, verifyToken);

export default router;

