import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'morthai-secret-key-2025';
const JWT_EXPIRES_IN = '24h';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate credentials
    if (!username || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // username is actually the email from the frontend
    const email = username.trim().toLowerCase();

    // Find user by email
    const user = await User.getByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_uuid: user.user_uuid,
        username: user.nom,
        email: user.email,
        role: 'admin' 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_uuid: user.user_uuid,
        username: user.nom,
        email: user.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyToken = async (req, res) => {
  try {
    // User is already verified by middleware
    res.json({
      valid: true,
      user: req.user
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

