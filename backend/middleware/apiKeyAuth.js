import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';

/**
 * Length-safe constant-time comparison.
 * timingSafeEqual throws when buffer lengths differ, so we hash both sides to a
 * fixed 32 bytes first. That keeps the comparison constant-time without leaking
 * the key length through an early return.
 */
const safeEqual = (a, b) => {
  const bufA = crypto.createHash('sha256').update(String(a)).digest();
  const bufB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Pulls the presented key out of the request.
 * Priority: x-api-key header > Authorization: Bearer usj_... > body.apiKey
 * Deliberately never read from the query string (leaks into access logs).
 */
const extractKey = (req) => {
  const headerKey = req.headers['x-api-key'];
  if (headerKey) return String(headerKey).trim();

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const candidate = authHeader.slice(7).trim();
    if (candidate.startsWith('usj_')) return candidate;
  }

  if (req.body && req.body.apiKey) return String(req.body.apiKey).trim();

  return null;
};

/**
 * Validates the public API key and attaches the key document to req.apiKeyDoc.
 */
export default async function apiKeyAuth(req, res, next) {
  try {
    if (!req.app.get('dbConnected')) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is currently unavailable, so the export API cannot serve data. Please retry shortly.'
      });
    }

    const presented = extractKey(req);

    if (!presented) {
      return res.status(401).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: 'No API key provided. Send it in the "x-api-key" header.'
      });
    }

    const record = await ApiKey.findOne({ keyId: 'PRIMARY' });

    if (!record) {
      return res.status(503).json({
        success: false,
        code: 'API_KEY_NOT_CONFIGURED',
        message: 'No API key has been generated yet. An administrator must create one in the Admin portal.'
      });
    }

    if (!record.isActive || !safeEqual(presented, record.key)) {
      return res.status(403).json({
        success: false,
        code: 'INVALID_API_KEY',
        message: 'This key is invalid or has been regenerated.'
      });
    }

    req.apiKeyDoc = record;

    // Fire-and-forget usage tracking: never block or fail the export on this.
    ApiKey.updateOne(
      { keyId: 'PRIMARY' },
      {
        $inc: { usageCount: 1 },
        $set: {
          lastUsedAt: new Date(),
          lastUsedIp: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown',
          lastEndpoint: req.originalUrl
        }
      }
    ).catch(() => {});

    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Failed to validate API key',
      error: err.message
    });
  }
}
