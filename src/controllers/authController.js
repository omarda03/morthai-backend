import jwt from 'jsonwebtoken';

// Static admin credentials
const ADMIN_USERNAME = 'morthai';
const ADMIN_PASSWORD = 'morthai@2025';
const JWT_SECRET = process.env.JWT_SECRET || 'morthai-secret-key-2025';
const JWT_EXPIRES_IN = '24h';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate credentials
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: ADMIN_USERNAME, role: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    });
  } catch (error) {
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

