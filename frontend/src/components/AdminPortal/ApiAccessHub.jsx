import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  KeyRound, Eye, EyeOff, Copy, Check, RefreshCw, AlertTriangle, X, Loader2,
  Activity, Clock, Globe, Database, ChevronDown, ChevronRight, Code2, BookOpen, Terminal
} from 'lucide-react';

const SAMPLE_JOB = {
  _id: '65f1a2b3c4d5e6f7a8b9c0d1',
  unstopId: 1284730,
  opportunityType: 'jobs',
  title: 'Software Development Engineer I',
  organisation: {
    id: 456789,
    name: 'Acme Technologies Pvt Ltd',
    logoUrl: 'https://d8it4huxumps7.cloudfront.net/uploads/images/logo.png',
    logoUrl2: 'https://d8it4huxumps7.cloudfront.net/uploads/images/logo-alt.png',
    publicUrl: 'https://unstop.com/company/acme-technologies',
    website: 'https://acme.com'
  },
  locations: ['Pune', 'Bengaluru'],
  jobDetail: {
    min_salary: 800000,
    max_salary: 1400000,
    currency: 'fa-rupee',
    pay_in: 'annually',
    timing: 'full_time',
    type: 'in_office',
    show_salary: true,
    min_experience: 0,
    max_experience: 2,
    paid_unpaid: null,
    not_disclosed: false
  },
  details: '<p>We are hiring an SDE-I to build scalable backend services...</p>',
  seoUrl: 'https://unstop.com/jobs/sde-i-acme-1284730',
  shortUrl: 'https://unstop.com/o/aBcD1234',
  publicUrl: 'https://unstop.com/jobs/sde-i-acme-1284730',
  requiredSkills: ['Java', 'Spring Boot', 'MySQL', 'REST API'],
  workFunction: ['Engineering', 'Software Development'],
  filters: ['Fresher', 'Full Time', 'Engineering'],
  eligibilityRaw: 'B.Tech / B.E. - CSE, IT | 2025, 2026 batch',
  eligibilityParsed: { degrees: ['B.Tech', 'B.E.'], branches: ['CSE', 'IT'], graduationYears: [2025, 2026] },
  resumeMatchConfig: null,
  rounds: [
    { name: 'Online Assessment', type: 'test', sequence: 1 },
    { name: 'Technical Interview', type: 'interview', sequence: 2 }
  ],
  regnRequirements: {
    start_regn_dt: '2026-08-01 10:00:00',
    end_regn_dt: '2026-09-15 23:59:59',
    remain_days: '37 days',
    remaining_time: 3196800,
    reg_status: 'open'
  },
  endDate: '2026-09-15T18:29:59.000Z',
  regnOpen: true,
  viewsCount: 15204,
  registerCount: 892,
  status: 'LIVE',
  scrapedAt: '2026-08-09T03:00:14.221Z',
  updatedAt: '2026-08-08T11:42:00.000Z',
  isCustom: false,
  createdAt: '2026-08-01T03:00:11.004Z',
  __v: 0
};

const RANGE_PARAMS = [
  ['start', 'int', '0', '0-based index, inclusive.'],
  ['end', 'int', 'total', '0-based index, exclusive (like Array.slice).'],
  ['limit', 'int', '—', 'Alias. If provided, end = start + limit.'],
  ['opportunityType', 'string', '"ALL"', '"jobs" | "internships" | "ALL".'],
  ['status', 'string', '"ALL"', '"LIVE" | "ALL" | any stored status value.'],
  ['sort', 'string', '"newest"', 'newest | oldest | salary_desc | salary_asc | views.'],
  ['includeDetails', 'bool', 'true', 'false drops the details HTML — see Performance section.']
];

const RECENT_PARAMS = [
  ['hours', 'number', '36', 'Any positive number, decimals allowed (0.5 = 30 min). No cap.'],
  ['dateField', 'string', '"scrapedAt"', 'scrapedAt | createdAt | updatedAt.'],
  ['opportunityType', 'string', '"ALL"', '"jobs" | "internships" | "ALL".'],
  ['status', 'string', '"ALL"', '"LIVE" | "ALL" | any stored status value.'],
  ['sort', 'string', '"newest"', 'Same options as the range endpoint.'],
  ['includeDetails', 'bool', 'true', 'false drops the details HTML — see Performance section.']
];

const FIELD_REFERENCE = [
  ['unstopId', 'number', "Unstop's own ID — use this as your dedupe key."],
  ['opportunityType', 'string', '"jobs" or "internships".'],
  ['title', 'string', 'Role title.'],
  ['organisation.name', 'string', 'Hiring company. Defaults to "Unknown Company".'],
  ['organisation.website', 'string | null', 'Company site. Often absent.'],
  ['locations', 'string[]', 'Work locations. Can be empty.'],
  ['jobDetail.min_salary', 'number', '0 when undisclosed.'],
  ['jobDetail.max_salary', 'number', '0 when undisclosed.'],
  ['jobDetail.currency', 'string', 'Raw FontAwesome class from Unstop, e.g. "fa-rupee" = INR.'],
  ['jobDetail.pay_in', 'string', 'annually | monthly.'],
  ['jobDetail.timing', 'string', 'full_time | part_time | internship.'],
  ['jobDetail.type', 'string', 'in_office | remote | hybrid.'],
  ['jobDetail.not_disclosed', 'bool', 'true means salary fields are meaningless.'],
  ['details', 'string', 'Raw HTML — sanitize before rendering.'],
  ['requiredSkills', 'string[]', 'Skill tags.'],
  ['workFunction', 'string[]', 'Job family / function tags.'],
  ['eligibilityRaw', 'string', 'Free-text eligibility line.'],
  ['eligibilityParsed', 'object | null', 'Structured eligibility. Frequently null.'],
  ['rounds', 'array | null', 'Interview round roadmap. Frequently null.'],
  ['resumeMatchConfig', 'object | null', 'Unstop internal config. Usually null.'],
  ['regnRequirements', 'object', 'Registration window and status strings.'],
  ['endDate', 'ISO date | null', 'Application deadline.'],
  ['regnOpen', 'bool', 'Whether registration is still open.'],
  ['status', 'string', '"LIVE" or an ended/closed value.'],
  ['scrapedAt', 'ISO date', 'Last ingest/refresh — default filter field for /jobs/recent.'],
  ['createdAt', 'ISO date', 'First insert into this database.'],
  ['updatedAt', 'ISO date', "Unstop's own update timestamp (see caveat below)."],
  ['isCustom', 'bool', 'true = manually created via admin, not scraped.']
];

/* ------------------------------------------------------------------ */

function CopyButton({ value, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      // Clipboard API needs a secure context; fall back to a temp textarea.
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
        copied
          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
          : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
      } ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function CodeBlock({ code, language = 'bash' }) {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border border-slate-800 border-b-0 rounded-t-xl">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{language}</span>
        <CopyButton value={code} />
      </div>
      <pre className="bg-slate-950 border border-slate-800 rounded-b-xl p-4 overflow-x-auto text-[11.5px] leading-relaxed text-slate-300 font-mono">
        {code}
      </pre>
    </div>
  );
}

function ParamTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-left text-[11.5px]">
        <thead className="bg-slate-900/80">
          <tr className="text-slate-400 uppercase text-[10px] tracking-wider">
            <th className="px-3 py-2 font-bold">Field</th>
            <th className="px-3 py-2 font-bold">Type</th>
            <th className="px-3 py-2 font-bold">Default</th>
            <th className="px-3 py-2 font-bold">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {rows.map(([field, type, def, notes]) => (
            <tr key={field} className="hover:bg-slate-900/40">
              <td className="px-3 py-2 font-mono font-semibold text-indigo-300 whitespace-nowrap">{field}</td>
              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{type}</td>
              <td className="px-3 py-2 font-mono text-amber-300 whitespace-nowrap">{def}</td>
              <td className="px-3 py-2 text-slate-300">{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tailwind's JIT only sees complete class strings, so accent classes are
// written out in full here rather than interpolated.
const ACCENTS = {
  indigo: 'bg-indigo-500/10 text-indigo-400',
  sky: 'bg-sky-500/10 text-sky-400',
  purple: 'bg-purple-500/10 text-purple-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-400',
  rose: 'bg-rose-500/10 text-rose-400'
};

function Section({ title, icon: Icon, defaultOpen = false, accent = 'indigo', children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-900/40 transition-all"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ACCENTS[accent] || ACCENTS.indigo}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ApiAccessHub() {
  const [keyData, setKeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Consumers call the backend directly, not through the Vite dev proxy.
  const apiBase = useMemo(() => {
    const { protocol, hostname, port } = window.location;
    const backendPort = port === '5173' ? '3007' : port;
    return `${protocol}//${hostname}${backendPort ? `:${backendPort}` : ''}`;
  }, []);

  const fetchKey = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/api-key');
      if (res.data.success) setKeyData(res.data.data);
    } catch (err) {
      const status = err.response?.status;
      setMsg({
        text: status === 401
          ? 'Your admin session has expired. Please log out and sign in again to view the API key.'
          : (err.response?.data?.message || err.message),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKey(); }, []);

  const executeRegenerate = async () => {
    setShowRegenModal(false);
    setRegenerating(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await axios.post('/api/admin/api-key/regenerate');
      if (res.data.success) {
        setKeyData(res.data.data);
        setRevealed(true);
        setMsg({ text: res.data.message, type: 'success' });
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
    } finally {
      setRegenerating(false);
    }
  };

  const apiKey = keyData?.key || '';
  const maskedKey = apiKey ? `${apiKey.slice(0, 13)}${'•'.repeat(24)}${apiKey.slice(-4)}` : '';
  const displayKey = apiKey ? (revealed ? apiKey : maskedKey) : '—';
  const exampleKey = apiKey || 'usj_live_YOUR_KEY_HERE';

  const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

  const curlRange = `curl -X POST ${apiBase}/api/public/v1/jobs/range \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${exampleKey}" \\
  -d '{ "start": 0, "end": 100000 }' \\
  --compressed -o all-jobs.json`;

  const curlRecent = `curl -X POST ${apiBase}/api/public/v1/jobs/recent \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${exampleKey}" \\
  -d '{ "hours": 36 }' \\
  --compressed -o recent-jobs.json`;

  const jsSnippet = `const res = await fetch('${apiBase}/api/public/v1/jobs/range', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${exampleKey}'
  },
  body: JSON.stringify({ start: 0, end: 100000 })
});

const { meta, data } = await res.json();
console.log(\`Received \${data.length} of \${meta.totalMatching} records\`);`;

  const pySnippet = `import requests

res = requests.post(
    "${apiBase}/api/public/v1/jobs/range",
    headers={"x-api-key": "${exampleKey}"},
    json={"start": 0, "end": 100000},
    timeout=600,
)
payload = res.json()
print(f"Received {len(payload['data'])} of {payload['meta']['totalMatching']} records")`;

  const sampleRangeResponse = JSON.stringify({
    success: true,
    meta: {
      endpoint: 'range',
      start: 0,
      end: 100000,
      returned: 48210,
      totalMatching: 48210,
      hasMore: false,
      filters: { opportunityType: 'ALL', status: 'ALL' },
      sort: 'newest',
      includeDetails: true,
      generatedAt: '2026-08-09T10:15:30.482Z',
      apiVersion: 'v1'
    },
    data: ['<job object — see below>']
  }, null, 2);

  const sampleRecentResponse = JSON.stringify({
    success: true,
    meta: {
      endpoint: 'recent',
      hours: 36,
      dateField: 'scrapedAt',
      from: '2026-08-07T22:15:30.482Z',
      to: '2026-08-09T10:15:30.482Z',
      returned: 1284,
      filters: { opportunityType: 'ALL', status: 'ALL' },
      sort: 'newest',
      includeDetails: true,
      generatedAt: '2026-08-09T10:15:30.482Z',
      apiVersion: 'v1'
    },
    data: ['<job object — see below>']
  }, null, 2);

  return (
    <div className="space-y-6">

      {/* Status message */}
      {msg.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold border ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {msg.text}
        </div>
      )}

      {/* ---------------- API KEY CARD ---------------- */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-outfit">{keyData?.label || 'Primary Export Key'}</h2>
              <p className="text-[11px] text-slate-400">
                Only one key is active at a time. Regenerating instantly invalidates the previous one.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300">
              v{keyData?.version ?? '—'}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
              keyData?.isActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {keyData?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Key value row */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
          {loading ? (
            <span className="flex items-center space-x-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading key…</span>
            </span>
          ) : (
            <>
              <code className="flex-1 min-w-[240px] font-mono text-[12.5px] text-emerald-300 break-all">
                {displayKey}
              </code>
              <button
                onClick={() => setRevealed(r => !r)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-all"
              >
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{revealed ? 'Hide' : 'Reveal'}</span>
              </button>
              <CopyButton value={apiKey} label="Copy key" />
            </>
          )}
        </div>

        {/* Usage stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Activity, label: 'Total Calls', value: (keyData?.usageCount ?? 0).toLocaleString(), color: 'text-indigo-400' },
            { icon: Database, label: 'Records Served', value: (keyData?.totalRecordsServed ?? 0).toLocaleString(), color: 'text-sky-400' },
            { icon: Clock, label: 'Last Used', value: fmtDate(keyData?.lastUsedAt), color: 'text-purple-400' },
            { icon: Globe, label: 'Last Client IP', value: keyData?.lastUsedIp || '—', color: 'text-amber-400' }
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span>{stat.label}</span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-1.5 truncate" title={stat.value}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-slate-500">
            Created {fmtDate(keyData?.createdAt)}{keyData?.createdBy ? ` by ${keyData.createdBy}` : ''}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchKey}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Stats</span>
            </button>

            <button
              onClick={() => setShowRegenModal(true)}
              disabled={regenerating}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-[11px] font-bold transition-all disabled:opacity-50"
            >
              {regenerating
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{regenerating ? 'Regenerating…' : 'Regenerate Key'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- DOCUMENTATION ---------------- */}
      <div className="flex items-center space-x-2 pt-2">
        <BookOpen className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">API Documentation</h2>
      </div>

      {/* Overview */}
      <Section title="Getting Started" icon={Terminal} defaultOpen accent="indigo">
        <p className="text-xs text-slate-300 leading-relaxed">
          Both export endpoints are <strong className="text-white">POST</strong> requests that return every matching
          job and internship as JSON. Authenticate with the key above in the{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-[11px]">x-api-key</code> header.
          There is <strong className="text-white">no rate limit and no record cap</strong> — if you ask for 100,000 rows
          and the database holds 48,210, you get all 48,210.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Base URL</span>
            <p className="font-mono text-[12px] text-emerald-300 mt-1 break-all">{apiBase}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Auth Header</span>
            <p className="font-mono text-[12px] text-emerald-300 mt-1 break-all">x-api-key: {revealed ? exampleKey : maskedKey || 'usj_live_…'}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300">Responses are gzip-compressed and streamed.</strong> Always send{' '}
            <code className="font-mono">Accept-Encoding: gzip</code> (curl: <code className="font-mono">--compressed</code>).
            A full export of ~50k records is roughly 250&nbsp;MB raw / ~25&nbsp;MB gzipped, so set a generous client timeout.
          </p>
        </div>

        <CodeBlock code={curlRange} language="curl — quick start" />
      </Section>

      {/* Endpoint 1 */}
      <Section title="POST /api/public/v1/jobs/range — index-range export" icon={Code2} accent="sky">
        <p className="text-xs text-slate-300 leading-relaxed">
          Returns records by position in the sorted result set. Use it to pull the entire database in one call, or to
          page through it in slices. <code className="font-mono text-indigo-300">start</code> is inclusive and{' '}
          <code className="font-mono text-indigo-300">end</code> is exclusive, exactly like{' '}
          <code className="font-mono text-indigo-300">Array.slice</code>. Every field in the body is optional — an
          empty body <code className="font-mono text-indigo-300">{'{}'}</code> returns everything.
        </p>

        <ParamTable rows={RANGE_PARAMS} />

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-white">Out-of-bounds is not an error.</strong> An <code className="font-mono">end</code>{' '}
            beyond the collection size clamps to the total. A <code className="font-mono">start</code> past the total
            returns <code className="font-mono">data: []</code> with HTTP 200.
          </p>
        </div>

        <CodeBlock code={curlRange} language="curl" />
        <CodeBlock code={jsSnippet} language="javascript" />
        <CodeBlock code={pySnippet} language="python" />
        <CodeBlock code={sampleRangeResponse} language="sample response" />
      </Section>

      {/* Endpoint 2 */}
      <Section title="POST /api/public/v1/jobs/recent — time-window export" icon={Clock} accent="purple">
        <p className="text-xs text-slate-300 leading-relaxed">
          Returns everything touched in the last <code className="font-mono text-indigo-300">hours</code> hours.
          Defaults to <strong className="text-white">36 hours</strong>, matching the nightly 3:00&nbsp;AM scrape window.
          There is no upper bound — <code className="font-mono text-indigo-300">{'{ "hours": 99999 }'}</code> returns the
          entire dataset.
        </p>

        <ParamTable rows={RECENT_PARAMS} />

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <p className="text-[11px] font-bold text-white">Which dateField should you use?</p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <code className="font-mono text-indigo-300">scrapedAt</code> (default) — set on every insert <em>and</em>{' '}
            every refresh. This is what you want for a recurring sync: it catches new postings plus any existing one
            whose data changed.
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <code className="font-mono text-indigo-300">createdAt</code> — brand-new records only, never re-reported.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <code className="font-mono">updatedAt</code> — intended to be Unstop's own timestamp, but Mongoose's
            automatic timestamps overwrite it on write, so it is not a reliable filter. Prefer the other two.
          </p>
        </div>

        <CodeBlock code={curlRecent} language="curl" />
        <CodeBlock code={sampleRecentResponse} language="sample response" />
      </Section>

      {/* Endpoint 3 */}
      <Section title="POST /api/public/v1/verify — key check & dataset size" icon={Check} accent="emerald">
        <p className="text-xs text-slate-300 leading-relaxed">
          A cheap call that validates your key and reports how many records exist, so you can size a pull before
          requesting hundreds of megabytes. Takes no parameters.
        </p>
        <CodeBlock
          code={`curl -X POST ${apiBase}/api/public/v1/verify \\
  -H "x-api-key: ${exampleKey}"`}
          language="curl"
        />
        <CodeBlock
          code={JSON.stringify({
            success: true,
            message: 'API key is valid.',
            data: {
              keyVersion: 1,
              keyLabel: 'Primary Export Key',
              counts: { total: 48210, jobs: 31044, internships: 17166, live: 22890 },
              lastScrapedAt: '2026-08-09T03:00:14.221Z',
              apiVersion: 'v1',
              generatedAt: '2026-08-09T10:15:30.482Z'
            }
          }, null, 2)}
          language="sample response"
        />
      </Section>

      {/* Job object */}
      <Section title="Job object — full JSON structure" icon={Database} accent="amber">
        <p className="text-xs text-slate-300 leading-relaxed">
          Every element of the <code className="font-mono text-indigo-300">data</code> array has this shape. Fields
          documented as nullable are frequently absent on real records — code defensively.
        </p>
        <CodeBlock code={JSON.stringify(SAMPLE_JOB, null, 2)} language="job object" />

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-[11.5px]">
            <thead className="bg-slate-900/80">
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="px-3 py-2 font-bold">Field</th>
                <th className="px-3 py-2 font-bold">Type</th>
                <th className="px-3 py-2 font-bold">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {FIELD_REFERENCE.map(([field, type, meaning]) => (
                <tr key={field} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2 font-mono font-semibold text-indigo-300 whitespace-nowrap">{field}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{type}</td>
                  <td className="px-3 py-2 text-slate-300">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Errors */}
      <Section title="Error responses" icon={AlertTriangle} accent="rose">
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-[11.5px]">
            <thead className="bg-slate-900/80">
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="px-3 py-2 font-bold">HTTP</th>
                <th className="px-3 py-2 font-bold">code</th>
                <th className="px-3 py-2 font-bold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {[
                ['401', 'MISSING_API_KEY', 'No key was sent in the header or body.'],
                ['403', 'INVALID_API_KEY', 'Key is wrong, or it was regenerated and you are using the old one.'],
                ['503', 'API_KEY_NOT_CONFIGURED', 'No key has been generated yet.'],
                ['503', 'DATABASE_UNAVAILABLE', 'MongoDB is down. The API fails cleanly rather than serving partial seed data.'],
                ['400', 'INVALID_PARAMS', 'start/end/limit/hours/sort/dateField malformed.'],
                ['500', 'EXPORT_FAILED', 'Unexpected server error before streaming started.']
              ].map(([http, code, when]) => (
                <tr key={code} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2 font-mono font-bold text-rose-400">{http}</td>
                  <td className="px-3 py-2 font-mono text-amber-300 whitespace-nowrap">{code}</td>
                  <td className="px-3 py-2 text-slate-300">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
          <p className="text-[11px] font-bold text-rose-300">Mid-stream failures</p>
          <p className="text-[11px] text-rose-200/80 leading-relaxed">
            Responses are streamed, so once the first byte is sent the HTTP status is already committed and a failure
            cannot become a clean 500. If the stream breaks, the payload closes with{' '}
            <code className="font-mono">{'"streamError": "...", "truncated": true'}</code> instead. Always check for{' '}
            <code className="font-mono">truncated</code> before treating a response as complete.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-white">meta.returned is computed before streaming begins.</strong> If the nightly
            scrape inserts records mid-export the number can drift by a few. Treat{' '}
            <code className="font-mono text-indigo-300">data.length</code> as authoritative.
          </p>
        </div>
      </Section>

      {/* Performance */}
      <Section title="Performance & payload size" icon={Activity} accent="emerald">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-[11px] font-bold text-white mb-2">Measured on the live dataset</p>
          <table className="w-full text-left text-[11px]">
            <tbody className="divide-y divide-slate-800/70">
              {[
                ['Full export, no gzip', '1,240,452 bytes'],
                ['Full export, gzipped', '99,397 bytes — 12.5x smaller'],
                ['includeDetails: false, no gzip', '994,432 bytes']
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="py-1.5 text-slate-300">{label}</td>
                  <td className="py-1.5 font-mono text-emerald-300 text-right whitespace-nowrap">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-2 text-[11.5px] text-slate-300 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-white">gzip is the big win — always use it.</strong> Responses are streamed from a
            database cursor, so server memory stays flat no matter how many records you request.
          </li>
          <li>
            <code className="font-mono text-indigo-300">{'{ "includeDetails": false }'}</code> saves less than you might
            expect here: <code className="font-mono">details</code> averages ~1.9&nbsp;KB per record and is only about
            <strong className="text-white"> 19%</strong> of the payload, so it cuts roughly 20% — not 10x. Worth setting
            if you never render job descriptions, but gzip matters far more.
          </li>
          <li>
            One large call beats deep paging — <code className="font-mono text-indigo-300">{'{ "start": 45000 }'}</code>{' '}
            makes MongoDB walk 45,000 documents to reach the offset.
          </li>
          <li>
            Use <code className="font-mono text-indigo-300">unstopId</code> as your dedupe/upsert key on the receiving side.
          </li>
        </ul>
      </Section>

      {/* ---------------- REGENERATE CONFIRM MODAL ---------------- */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl border border-rose-500/30 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-outfit">Regenerate API Key?</h3>
              </div>
              <button onClick={() => setShowRegenModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A new key will replace the current one immediately.{' '}
              <strong className="text-rose-300">
                Any platform using the current key will stop working immediately
              </strong>{' '}
              and start receiving <code className="font-mono">403 INVALID_API_KEY</code> until you update it.
            </p>

            <p className="text-[11px] text-slate-400">
              Usage counters reset. The key version becomes v{(keyData?.version ?? 0) + 1}.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeRegenerate}
                className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-500 transition-all"
              >
                Yes, Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
