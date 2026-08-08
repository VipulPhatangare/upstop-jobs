import ApiKey from '../models/ApiKey.js';

/**
 * Shared helpers for the public bulk-export endpoints.
 *
 * The whole point of this module is to never hold the full result set in
 * memory. A full export of ~50k job documents is roughly 250 MB of JSON;
 * res.json() would stringify all of it into a single string (on top of the
 * hydrated documents) and take the process out with an OOM. Instead we walk a
 * lean Mongo cursor and write each document straight to the socket, honouring
 * backpressure, so memory stays flat regardless of record count.
 */

export const API_VERSION = 'v1';

/**
 * Builds the Mongo filter shared by both endpoints.
 * Unlike GET /api/jobs, this defaults to ALL statuses — an export should return
 * everything unless the caller explicitly narrows it.
 */
export const buildJobFilter = ({ opportunityType = 'ALL', status = 'ALL' } = {}) => {
  const filter = {};

  if (opportunityType && String(opportunityType).toUpperCase() !== 'ALL') {
    if (opportunityType === 'jobs') {
      filter.opportunityType = { $ne: 'internships' };
    } else {
      filter.opportunityType = opportunityType;
    }
  }

  if (status && String(status).toUpperCase() !== 'ALL') {
    filter.status = status;
  }

  return filter;
};

/**
 * Sort options. Every sort is tie-broken by _id so that range pagination is
 * stable across calls even when many documents share a sort value.
 */
export const buildSort = (sort = 'newest') => {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1, _id: 1 };
    case 'salary_desc':
      return { 'jobDetail.max_salary': -1, _id: -1 };
    case 'salary_asc':
      return { 'jobDetail.min_salary': 1, _id: 1 };
    case 'views':
      return { viewsCount: -1, _id: -1 };
    case 'newest':
    default:
      return { createdAt: -1, _id: -1 };
  }
};

export const VALID_SORTS = ['newest', 'oldest', 'salary_desc', 'salary_asc', 'views'];

/**
 * Dropping the `details` HTML server-side cuts the payload roughly 10x.
 * Optional slimming for consumers that only need listing metadata.
 */
export const buildProjection = (includeDetails) => (includeDetails === false ? { details: 0 } : null);

/**
 * Promise-based res.write that waits for 'drain' when the socket buffer fills.
 * Without this, a fast cursor outruns a slow client and Node queues the entire
 * response in memory — exactly the failure mode streaming is meant to avoid.
 */
const write = (res, chunk) => new Promise((resolve) => {
  if (res.write(chunk)) return resolve();
  res.once('drain', resolve);
});

/**
 * Streams `{ success, meta, data: [...] }` to the client from a Mongo cursor.
 *
 * Errors raised after the first byte cannot become a clean HTTP 500 — the
 * status line is already on the wire. We instead close the array and append
 * `streamError` + `truncated: true` so consumers can detect a partial payload.
 *
 * @returns {Promise<number>} number of documents actually written
 */
export const streamJobExport = async (res, { meta, cursor }) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Api-Version', API_VERSION);

  let written = 0;
  let clientGone = false;
  res.on('close', () => { clientGone = true; });

  await write(res, `{"success":true,"meta":${JSON.stringify(meta)},"data":[`);

  try {
    for await (const doc of cursor) {
      if (clientGone) break;
      await write(res, written === 0 ? JSON.stringify(doc) : `,${JSON.stringify(doc)}`);
      written++;
    }
    await write(res, ']}');
  } catch (err) {
    console.error('[export] stream failed after headers were sent:', err.message);
    await write(res, `],"streamError":${JSON.stringify(err.message)},"truncated":true}`);
  } finally {
    try { await cursor.close(); } catch (e) { /* cursor may already be closed */ }
    if (!res.writableEnded) res.end();
  }

  return written;
};

/**
 * Records how many documents a key has served. Fire-and-forget: an export must
 * never fail because a counter update did.
 */
export const recordRecordsServed = (count) => {
  if (!count) return;
  ApiKey.updateOne({ keyId: 'PRIMARY' }, { $inc: { totalRecordsServed: count } }).catch(() => {});
};

/**
 * Parses and validates the `range` endpoint's window.
 * No upper cap: asking for 100000 rows against 48210 simply returns all 48210.
 *
 * @returns {{ error?: string, start?: number, end?: number }}
 */
export const resolveRange = ({ start, end, limit }, total) => {
  const rawStart = start === undefined || start === null || start === '' ? 0 : Number(start);

  if (!Number.isFinite(rawStart) || rawStart < 0 || !Number.isInteger(rawStart)) {
    return { error: '"start" must be a non-negative integer.' };
  }

  let rawEnd;
  if (limit !== undefined && limit !== null && limit !== '') {
    const numLimit = Number(limit);
    if (!Number.isFinite(numLimit) || numLimit < 0 || !Number.isInteger(numLimit)) {
      return { error: '"limit" must be a non-negative integer.' };
    }
    rawEnd = rawStart + numLimit;
  } else if (end === undefined || end === null || end === '') {
    rawEnd = total;
  } else {
    rawEnd = Number(end);
    if (!Number.isFinite(rawEnd) || rawEnd < 0 || !Number.isInteger(rawEnd)) {
      return { error: '"end" must be a non-negative integer.' };
    }
  }

  if (rawEnd < rawStart) {
    return { error: '"end" must be greater than or equal to "start".' };
  }

  return { start: rawStart, end: rawEnd };
};

export const VALID_DATE_FIELDS = ['scrapedAt', 'createdAt', 'updatedAt'];
