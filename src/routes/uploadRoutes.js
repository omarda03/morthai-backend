import express from 'express';
import upload from '../config/upload.js';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Single image upload
router.post('/single', authenticateToken, upload.single('image'), uploadImage);

// Multiple images upload
router.post('/multiple', authenticateToken, upload.array('images', 10), uploadMultipleImages);

export default router;

