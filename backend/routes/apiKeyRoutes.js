import express from 'express';
import ApiKey from '../models/ApiKey.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Every route here exposes or rotates the secret, so all of them are JWT-gated.
router.use(adminAuth);

const requireDb = (req, res) => {
  if (!req.app.get('dbConnected')) {
    res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: 'API keys are stored in MongoDB, which is currently unavailable.'
    });
    return false;
  }
  return true;
};

const serialize = (doc) => ({
  key: doc.key,
  label: doc.label,
  version: doc.version,
  isActive: doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  createdBy: doc.createdBy,
  usageCount: doc.usageCount,
  totalRecordsServed: doc.totalRecordsServed,
  lastUsedAt: doc.lastUsedAt,
  lastUsedIp: doc.lastUsedIp,
  lastEndpoint: doc.lastEndpoint
});

/**
 * GET /api/admin/api-key
 * Returns the single active key plus its usage stats.
 * Creates one on first access so the admin tab is never empty.
 */
router.get('/', async (req, res) => {
  try {
    if (!requireDb(req, res)) return;

    const doc = await ApiKey.ensureKey(req.admin?.email || 'admin');
    return res.json({ success: true, data: serialize(doc) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load API key', error: err.message });
  }
});

/**
 * POST /api/admin/api-key/regenerate
 * Overwrites the singleton row. The previous key stops working immediately.
 */
router.post('/regenerate', async (req, res) => {
  try {
    if (!requireDb(req, res)) return;

    const doc = await ApiKey.regenerate(req.admin?.email || 'admin');
    return res.json({
      success: true,
      message: `API key regenerated (v${doc.version}). The previous key is now invalid.`,
      data: serialize(doc)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to regenerate API key', error: err.message });
  }
});

/**
 * PATCH /api/admin/api-key
 * Renames the key label.
 */
router.patch('/', async (req, res) => {
  try {
    if (!requireDb(req, res)) return;

    const label = String(req.body?.label || '').trim();
    if (!label) {
      return res.status(400).json({ success: false, code: 'INVALID_PARAMS', message: '"label" is required.' });
    }

    const doc = await ApiKey.findOneAndUpdate(
      { keyId: 'PRIMARY' },
      { $set: { label } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, code: 'API_KEY_NOT_CONFIGURED', message: 'No API key exists yet.' });
    }

    return res.json({ success: true, message: 'Label updated.', data: serialize(doc) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update API key', error: err.message });
  }
});

export default router;
