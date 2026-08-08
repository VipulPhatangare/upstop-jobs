import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'unstop_super_secret_jwt_key_2026';

/**
 * Reusable Admin JWT verifier.
 * Attaches the decoded payload to req.admin on success.
 */
export default function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'MISSING_ADMIN_TOKEN',
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'NOT_ADMIN',
        message: 'This endpoint requires an admin account'
      });
    }

    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_ADMIN_TOKEN',
      message: 'Invalid or expired admin token',
      error: err.message
    });
  }
}
