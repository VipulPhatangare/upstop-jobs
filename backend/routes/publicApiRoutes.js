import express from 'express';
import Job from '../models/Job.js';
import apiKeyAuth from '../middleware/apiKeyAuth.js';
import {
  API_VERSION,
  VALID_SORTS,
  VALID_DATE_FIELDS,
  buildJobFilter,
  buildSort,
  buildProjection,
  resolveRange,
  streamJobExport,
  recordRecordsServed
} from '../utils/exportStream.js';

const router = express.Router();

// Every endpoint below requires the active API key.
router.use(apiKeyAuth);

const badParams = (res, message) =>
  res.status(400).json({ success: false, code: 'INVALID_PARAMS', message });

/**
 * POST /api/public/v1/jobs/range
 * Index-range export. No upper cap — an `end` beyond the collection size simply
 * returns everything that exists.
 */
router.post('/jobs/range', async (req, res) => {
  try {
    const body = req.body || {};
    const {
      opportunityType = 'ALL',
      status = 'ALL',
      sort = 'newest',
      includeDetails = true
    } = body;

    if (!VALID_SORTS.includes(sort)) {
      return badParams(res, `"sort" must be one of: ${VALID_SORTS.join(', ')}.`);
    }

    const filter = buildJobFilter({ opportunityType, status });
    const totalMatching = await Job.countDocuments(filter);

    const range = resolveRange(body, totalMatching);
    if (range.error) return badParams(res, range.error);

    // Clamp to what actually exists. Asking for 100000 of 48210 yields 48210.
    const clampedStart = Math.min(range.start, totalMatching);
    const clampedEnd = Math.min(range.end, totalMatching);
    const count = Math.max(0, clampedEnd - clampedStart);

    const meta = {
      endpoint: 'range',
      start: range.start,
      end: range.end,
      returned: count,
      totalMatching,
      hasMore: clampedEnd < totalMatching,
      filters: { opportunityType, status },
      sort,
      includeDetails: includeDetails !== false,
      generatedAt: new Date().toISOString(),
      apiVersion: API_VERSION
    };

    const cursor = Job.find(filter, buildProjection(includeDetails))
      .sort(buildSort(sort))
      .skip(clampedStart)
      .limit(count)
      .lean()
      .cursor();

    const written = await streamJobExport(res, { meta, cursor });
    recordRecordsServed(written);
  } catch (err) {
    if (res.headersSent) return;
    res.status(500).json({ success: false, code: 'EXPORT_FAILED', message: 'Failed to export jobs', error: err.message });
  }
});

/**
 * POST /api/public/v1/jobs/recent
 * Time-window export. Defaults to the last 36 hours by `scrapedAt`.
 */
router.post('/jobs/recent', async (req, res) => {
  try {
    const body = req.body || {};
    const {
      hours = 36,
      dateField = 'scrapedAt',
      opportunityType = 'ALL',
      status = 'ALL',
      sort = 'newest',
      includeDetails = true
    } = body;

    const numHours = Number(hours);
    if (!Number.isFinite(numHours) || numHours <= 0) {
      return badParams(res, '"hours" must be a positive number.');
    }

    if (!VALID_DATE_FIELDS.includes(dateField)) {
      return badParams(res, `"dateField" must be one of: ${VALID_DATE_FIELDS.join(', ')}.`);
    }

    if (!VALID_SORTS.includes(sort)) {
      return badParams(res, `"sort" must be one of: ${VALID_SORTS.join(', ')}.`);
    }

    const to = new Date();
    const from = new Date(to.getTime() - numHours * 60 * 60 * 1000);

    const filter = buildJobFilter({ opportunityType, status });
    filter[dateField] = { $gte: from, $lte: to };

    const returned = await Job.countDocuments(filter);

    const meta = {
      endpoint: 'recent',
      hours: numHours,
      dateField,
      from: from.toISOString(),
      to: to.toISOString(),
      returned,
      filters: { opportunityType, status },
      sort,
      includeDetails: includeDetails !== false,
      generatedAt: new Date().toISOString(),
      apiVersion: API_VERSION
    };

    const cursor = Job.find(filter, buildProjection(includeDetails))
      .sort({ [dateField]: -1, _id: -1 })
      .lean()
      .cursor();

    const written = await streamJobExport(res, { meta, cursor });
    recordRecordsServed(written);
  } catch (err) {
    if (res.headersSent) return;
    res.status(500).json({ success: false, code: 'EXPORT_FAILED', message: 'Failed to export recent jobs', error: err.message });
  }
});

/**
 * POST /api/public/v1/verify
 * Cheap key check + dataset sizing, so a consumer can plan a pull before
 * requesting hundreds of megabytes.
 */
router.post('/verify', async (req, res) => {
  try {
    const [total, jobs, internships, live] = await Promise.all([
      Job.countDocuments({}),
      Job.countDocuments({ opportunityType: { $ne: 'internships' } }),
      Job.countDocuments({ opportunityType: 'internships' }),
      Job.countDocuments({ status: 'LIVE' })
    ]);

    const newest = await Job.findOne({}).sort({ scrapedAt: -1 }).select('scrapedAt').lean();

    return res.json({
      success: true,
      message: 'API key is valid.',
      data: {
        keyVersion: req.apiKeyDoc?.version,
        keyLabel: req.apiKeyDoc?.label,
        counts: { total, jobs, internships, live },
        lastScrapedAt: newest?.scrapedAt || null,
        apiVersion: API_VERSION,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, code: 'VERIFY_FAILED', message: 'Failed to verify key', error: err.message });
  }
});

export default router;
