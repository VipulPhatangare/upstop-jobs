import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'unstop_super_secret_jwt_key_2026';

// Admin Credentials
const ADMIN_EMAIL = 'vipulphatangare3@gmail.com';
// Pre-calculated bcrypt hash for '0831'
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('0831', 10);

/**
 * POST /api/auth/login
 * Admin JWT Authentication
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail !== ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password.trim(), ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: 'admin', name: 'Vipul Phatangare' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Admin authentication successful',
      token,
      user: {
        email: ADMIN_EMAIL,
        name: 'Vipul Phatangare',
        role: 'admin'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Validate current Admin token
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.json({
      success: true,
      user: decoded
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: err.message });
  }
});

export default router;
