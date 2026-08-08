# Unstop Jobs — Public Data Export API (v1)

Bulk JSON export of every job and internship in the database, for use on other
platforms. Two POST endpoints: one that pulls by index range, one that pulls by
time window. **No rate limits and no record caps.**

- **Base URL:** `http://<your-host>:3007` (default local: `http://localhost:3007`)
- **Auth:** `x-api-key` header
- **Content type:** `application/json`
- **API version:** `v1`

---

## 1. Authentication

Every request needs the active API key:

```
x-api-key: usj_live_bccd41ef47bb720dce908b4f7285677d3cb07647e903436b
```

Accepted alternatives, in priority order:

1. `x-api-key: <key>` header — **preferred**
2. `Authorization: Bearer usj_live_...`
3. `"apiKey": "usj_live_..."` inside the JSON body

The key is **never** read from the query string, because query strings leak into
access logs and browser history.

### Only one key is ever valid

The key lives in a singleton MongoDB document (`keyId: 'PRIMARY'`, unique index),
so the collection is physically incapable of holding two keys. Regenerating
overwrites that row — the previous key stops validating the moment the write
lands, with no grace period and no cleanup job.

Find, copy, and regenerate the key in **Admin Portal → API Access & Docs**.

---

## 2. `POST /api/public/v1/jobs/range`

Returns records by position in the sorted result set. Use it to pull the whole
database in one call, or to page through it in slices.

### Request body (every field optional — `{}` returns everything)

```json
{
  "start": 0,
  "end": 100000,
  "opportunityType": "ALL",
  "status": "ALL",
  "sort": "newest",
  "includeDetails": true
}
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `start` | int | `0` | 0-based index, **inclusive** |
| `end` | int | total | 0-based index, **exclusive** (like `Array.slice`) |
| `limit` | int | — | Alias: when present, `end = start + limit` |
| `opportunityType` | string | `"ALL"` | `"jobs"` \| `"internships"` \| `"ALL"` |
| `status` | string | `"ALL"` | `"LIVE"` \| `"ALL"` \| any stored status |
| `sort` | string | `"newest"` | `newest` \| `oldest` \| `salary_desc` \| `salary_asc` \| `views` |
| `includeDetails` | bool | `true` | `false` drops the `details` HTML — see §7 for how much that saves |

Sorts are always tie-broken by `_id`, so slice boundaries stay stable across calls.

### Out-of-bounds is not an error

- `end` beyond the collection size clamps to the total — asking for `100000` when
  48,210 records exist returns all 48,210.
- `start` past the total returns `data: []` with HTTP 200.

### Example

```bash
curl -X POST http://localhost:3007/api/public/v1/jobs/range \
  -H "Content-Type: application/json" \
  -H "x-api-key: usj_live_YOUR_KEY_HERE" \
  -d '{ "start": 0, "end": 100000 }' \
  --compressed -o all-jobs.json
```

### Response

```json
{
  "success": true,
  "meta": {
    "endpoint": "range",
    "start": 0,
    "end": 100000,
    "returned": 48210,
    "totalMatching": 48210,
    "hasMore": false,
    "filters": { "opportunityType": "ALL", "status": "ALL" },
    "sort": "newest",
    "includeDetails": true,
    "generatedAt": "2026-08-09T10:15:30.482Z",
    "apiVersion": "v1"
  },
  "data": [ /* array of job objects — see §5 */ ]
}
```

---

## 3. `POST /api/public/v1/jobs/recent`

Returns everything touched within the last N hours. Defaults to **36 hours**,
matching the nightly 3:00 AM scrape window.

### Request body

```json
{
  "hours": 36,
  "dateField": "scrapedAt",
  "opportunityType": "ALL",
  "status": "ALL",
  "includeDetails": true
}
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `hours` | number | `36` | Any positive number, decimals allowed (`0.5` = 30 min). **No cap** — `99999` returns everything |
| `dateField` | string | `"scrapedAt"` | `scrapedAt` \| `createdAt` \| `updatedAt` |
| `opportunityType` | string | `"ALL"` | Same as range endpoint |
| `status` | string | `"ALL"` | Same as range endpoint |
| `includeDetails` | bool | `true` | Same as range endpoint |

### Which `dateField` should you use?

| Field | Meaning | Use when |
|---|---|---|
| `scrapedAt` *(default)* | Set on every insert **and** every refresh | Recurring sync — catches new postings *and* existing ones whose data changed |
| `createdAt` | First insert into this database | You only want brand-new records, never re-reported |
| `updatedAt` | Intended as Unstop's own timestamp, but Mongoose's automatic timestamps overwrite it on write | Not recommended — unreliable as a filter |

### Example

```bash
curl -X POST http://localhost:3007/api/public/v1/jobs/recent \
  -H "Content-Type: application/json" \
  -H "x-api-key: usj_live_YOUR_KEY_HERE" \
  -d '{ "hours": 36 }' \
  --compressed -o recent-jobs.json
```

### Response

```json
{
  "success": true,
  "meta": {
    "endpoint": "recent",
    "hours": 36,
    "dateField": "scrapedAt",
    "from": "2026-08-07T22:15:30.482Z",
    "to":   "2026-08-09T10:15:30.482Z",
    "returned": 1284,
    "filters": { "opportunityType": "ALL", "status": "ALL" },
    "sort": "newest",
    "includeDetails": true,
    "generatedAt": "2026-08-09T10:15:30.482Z",
    "apiVersion": "v1"
  },
  "data": [ /* array of job objects — see §5 */ ]
}
```

---

## 4. `POST /api/public/v1/verify`

Cheap key check plus dataset sizing, so a consumer can plan a pull before
requesting hundreds of megabytes. Takes no parameters.

```bash
curl -X POST http://localhost:3007/api/public/v1/verify \
  -H "x-api-key: usj_live_YOUR_KEY_HERE"
```

```json
{
  "success": true,
  "message": "API key is valid.",
  "data": {
    "keyVersion": 1,
    "keyLabel": "Primary Export Key",
    "counts": { "total": 48210, "jobs": 31044, "internships": 17166, "live": 22890 },
    "lastScrapedAt": "2026-08-09T03:00:14.221Z",
    "apiVersion": "v1",
    "generatedAt": "2026-08-09T10:15:30.482Z"
  }
}
```

---

## 5. Job object structure

Every element of the `data` array has this shape:

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "unstopId": 1284730,
  "opportunityType": "jobs",
  "title": "Software Development Engineer I",
  "organisation": {
    "id": 456789,
    "name": "Acme Technologies Pvt Ltd",
    "logoUrl":  "https://d8it4huxumps7.cloudfront.net/uploads/images/logo.png",
    "logoUrl2": "https://d8it4huxumps7.cloudfront.net/uploads/images/logo-alt.png",
    "publicUrl":"https://unstop.com/company/acme-technologies",
    "website":  "https://acme.com"
  },
  "locations": ["Pune", "Bengaluru"],
  "jobDetail": {
    "min_salary": 800000,
    "max_salary": 1400000,
    "currency": "fa-rupee",
    "pay_in": "annually",
    "timing": "full_time",
    "type": "in_office",
    "show_salary": true,
    "min_experience": 0,
    "max_experience": 2,
    "paid_unpaid": null,
    "not_disclosed": false
  },
  "details": "<p>We are hiring an SDE-I to build scalable backend services...</p>",
  "seoUrl":    "https://unstop.com/jobs/sde-i-acme-1284730",
  "shortUrl":  "https://unstop.com/o/aBcD1234",
  "publicUrl": "https://unstop.com/jobs/sde-i-acme-1284730",
  "requiredSkills": ["Java", "Spring Boot", "MySQL", "REST API"],
  "workFunction": ["Engineering", "Software Development"],
  "filters": ["Fresher", "Full Time", "Engineering"],
  "eligibilityRaw": "B.Tech / B.E. - CSE, IT | 2025, 2026 batch",
  "eligibilityParsed": {
    "degrees": ["B.Tech", "B.E."],
    "branches": ["CSE", "IT"],
    "graduationYears": [2025, 2026]
  },
  "resumeMatchConfig": null,
  "rounds": [
    { "name": "Online Assessment",  "type": "test",      "sequence": 1 },
    { "name": "Technical Interview","type": "interview", "sequence": 2 }
  ],
  "regnRequirements": {
    "start_regn_dt": "2026-08-01 10:00:00",
    "end_regn_dt":   "2026-09-15 23:59:59",
    "remain_days":   "37 days",
    "remaining_time": 3196800,
    "reg_status": "open"
  },
  "endDate":  "2026-09-15T18:29:59.000Z",
  "regnOpen": true,
  "viewsCount": 15204,
  "registerCount": 892,
  "status": "LIVE",
  "scrapedAt": "2026-08-09T03:00:14.221Z",
  "updatedAt": "2026-08-08T11:42:00.000Z",
  "isCustom": false,
  "createdAt": "2026-08-01T03:00:11.004Z",
  "__v": 0
}
```

### Field reference

| Field | Type | Meaning |
|---|---|---|
| `unstopId` | number | Unstop's own ID — **use this as your dedupe/upsert key** |
| `opportunityType` | string | `"jobs"` or `"internships"` |
| `title` | string | Role title |
| `organisation.name` | string | Hiring company. Defaults to `"Unknown Company"` |
| `organisation.website` | string \| null | Company site. Often absent |
| `locations` | string[] | Work locations. Can be empty |
| `jobDetail.min_salary` | number | `0` when undisclosed |
| `jobDetail.max_salary` | number | `0` when undisclosed |
| `jobDetail.currency` | string | Raw FontAwesome class from Unstop, e.g. `"fa-rupee"` = INR |
| `jobDetail.pay_in` | string | `annually` \| `monthly` |
| `jobDetail.timing` | string | `full_time` \| `part_time` \| `internship` |
| `jobDetail.type` | string | `in_office` \| `remote` \| `hybrid` |
| `jobDetail.not_disclosed` | bool | `true` means the salary fields are meaningless |
| `details` | string | **Raw HTML** — sanitize before rendering |
| `requiredSkills` | string[] | Skill tags |
| `workFunction` | string[] | Job family / function tags |
| `eligibilityRaw` | string | Free-text eligibility line |
| `eligibilityParsed` | object \| null | Structured eligibility. Frequently `null` |
| `rounds` | array \| null | Interview round roadmap. Frequently `null` |
| `resumeMatchConfig` | object \| null | Unstop internal config. Usually `null` |
| `regnRequirements` | object | Registration window and status strings |
| `endDate` | ISO date \| null | Application deadline |
| `regnOpen` | bool | Whether registration is still open |
| `status` | string | `"LIVE"` or an ended/closed value |
| `scrapedAt` | ISO date | Last ingest/refresh — default filter field for `/jobs/recent` |
| `createdAt` | ISO date | First insert into this database |
| `updatedAt` | ISO date | See the `dateField` caveat in §3 |
| `isCustom` | bool | `true` = manually created via admin, not scraped |

**Nullable fields to code defensively around:** `eligibilityParsed`,
`resumeMatchConfig`, `rounds`, `organisation.website`, `endDate`, and any salary
value when `not_disclosed` is set.

---

## 6. Error responses

| HTTP | `code` | When |
|---|---|---|
| 401 | `MISSING_API_KEY` | No key sent in header or body |
| 403 | `INVALID_API_KEY` | Key is wrong, or it was regenerated and you're using the old one |
| 503 | `API_KEY_NOT_CONFIGURED` | No key has been generated yet |
| 503 | `DATABASE_UNAVAILABLE` | MongoDB is down. The API fails cleanly rather than serving partial in-memory seed data |
| 400 | `INVALID_PARAMS` | `start` / `end` / `limit` / `hours` / `sort` / `dateField` malformed |
| 500 | `EXPORT_FAILED` | Unexpected server error before streaming started |

```json
{
  "success": false,
  "code": "INVALID_API_KEY",
  "message": "This key is invalid or has been regenerated."
}
```

### Mid-stream failures

Responses are streamed, so once the first byte is on the wire the HTTP status is
already committed and a later failure cannot become a clean 500. If the stream
breaks, the payload closes like this instead:

```json
{ "success": true, "meta": { ... }, "data": [ ... ], "streamError": "…", "truncated": true }
```

**Always check for `truncated` before treating a response as complete.**

### `meta.returned` vs `data.length`

`meta.returned` is computed with a `countDocuments()` *before* streaming begins.
If the nightly scrape inserts records mid-export, the number can drift by a few.
**Treat `data.length` as authoritative.**

---

## 7. Performance & payload size

Two things make large exports practical:

1. **Streaming.** The server walks a lean MongoDB cursor and writes each document
   straight to the socket, honouring backpressure. Server memory stays flat no
   matter how many records you request — nothing is buffered, so a full export
   cannot OOM the process.
2. **gzip.** Responses are compressed automatically. Send `Accept-Encoding: gzip`;
   with curl that's `--compressed`.

### Measured on the live dataset (129 records)

| Request | Bytes transferred |
|---|---|
| Full export, no gzip | 1,240,452 |
| Full export, gzipped | **99,397** (12.5× smaller) |
| `includeDetails: false`, no gzip | 994,432 |

**gzip is the big win — always use it.** Extrapolating linearly, 48k records
would be roughly 460 MB raw / ~37 MB gzipped.

**`includeDetails: false` saves less than you might expect on this data.** The
`details` field currently averages ~1.9 KB per record and accounts for only about
**19%** of the payload, so dropping it cuts ~20%, not 10×. The saving scales with
how much HTML your records carry — it's worth setting if you never render job
descriptions, but gzip matters far more.

Other notes:

- **One large call beats deep paging.** `{ "start": 45000 }` makes MongoDB walk
  45,000 documents to reach the offset.
- **Set a generous client timeout** — a full uncompressed export can take a while
  on a slow link. The Python example above uses `timeout=600`.
- **Use `unstopId` as your upsert key** on the receiving side.

---

## 8. Code examples

### JavaScript / Node

```js
const res = await fetch('http://localhost:3007/api/public/v1/jobs/range', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'usj_live_YOUR_KEY_HERE'
  },
  body: JSON.stringify({ start: 0, end: 100000 })
});

const payload = await res.json();
if (payload.truncated) throw new Error(`Partial export: ${payload.streamError}`);

console.log(`Received ${payload.data.length} of ${payload.meta.totalMatching} records`);
```

### Python

```python
import requests

res = requests.post(
    "http://localhost:3007/api/public/v1/jobs/range",
    headers={"x-api-key": "usj_live_YOUR_KEY_HERE"},
    json={"start": 0, "end": 100000},
    timeout=600,
)
payload = res.json()
if payload.get("truncated"):
    raise RuntimeError(f"Partial export: {payload['streamError']}")

print(f"Received {len(payload['data'])} of {payload['meta']['totalMatching']} records")
```

### Incremental sync (recommended pattern)

Run every few hours against `/jobs/recent`, using a window slightly larger than
your interval so nothing slips through a gap:

```python
res = requests.post(
    "http://localhost:3007/api/public/v1/jobs/recent",
    headers={"x-api-key": KEY},
    json={"hours": 8, "includeDetails": False},
    timeout=300,
)
for job in res.json()["data"]:
    upsert_by_unstop_id(job["unstopId"], job)
```

---

## 9. Admin key management

JWT-protected — requires an admin login token, not the API key.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/api-key` | Returns the key plus usage stats. Creates one on first access |
| `POST` | `/api/admin/api-key/regenerate` | New key, `version + 1`, counters reset. Old key dies instantly |
| `PATCH` | `/api/admin/api-key` | Rename the key label (`{ "label": "..." }`) |

```bash
# 1. Log in
TOKEN=$(curl -s -X POST http://localhost:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}' | jq -r .token)

# 2. Read the key
curl -s http://localhost:3007/api/admin/api-key -H "Authorization: Bearer $TOKEN" | jq

# 3. Rotate it
curl -s -X POST http://localhost:3007/api/admin/api-key/regenerate \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Security notes

- Key comparison is constant-time (SHA-256 + `timingSafeEqual`), so the endpoint
  doesn't leak key material through response timing.
- The key is stored in plaintext in MongoDB so the admin tab can display it on
  demand. The read endpoint is JWT-gated, and the key only grants **read** access
  to already-public job listings.
- CORS is intentionally open — this API is meant to be called from other
  platforms.
- **There is no rate limiting**, by design. A leaked key means someone can pull
  the full dataset repeatedly. Regeneration is the kill switch, and it's instant.
