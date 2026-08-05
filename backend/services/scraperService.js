import axios from 'axios';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import ScraperLog from '../models/ScraperLog.js';

// In-memory logs store
const scraperLogs = [];
let isScraperRunning = false;
let currentRunId = null;

export const addLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = { id: Date.now() + Math.random(), timestamp, message, type };
  scraperLogs.unshift(logEntry);
  if (scraperLogs.length > 500) scraperLogs.pop();
  console.log(`[SCRAPER ${type.toUpperCase()}] ${timestamp} - ${message}`);
  return logEntry;
};

export const getLogs = () => scraperLogs;
export const getScraperStatus = () => ({ isRunning: isScraperRunning, currentRunId });

const getDefaultHeaders = (customToken = '') => {
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    'Referer': 'https://unstop.com/job',
    'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  };

  if (customToken) {
    headers['Authorization'] = customToken.startsWith('Bearer ') ? customToken : `Bearer ${customToken}`;
  }
  return headers;
};

export const normalizeUnstopJob = (searchItem, detailItem = null, opportunityTypeOverride = null) => {
  const comp = detailItem?.data?.competition || detailItem || {};
  const jobDet = searchItem.jobDetail || comp.job_detail || {};
  const regReq = searchItem.regnRequirements || comp.regnRequirements || {};

  const rawSkills = searchItem.required_skills || comp.skills || [];
  const requiredSkills = rawSkills.map(s => typeof s === 'string' ? s : (s.skill || s.skill_name)).filter(Boolean);

  const rawFunctions = searchItem.workfunction || comp.workfunction || [];
  const workFunction = rawFunctions.map(f => typeof f === 'string' ? f : f.name).filter(Boolean);

  let locations = [];
  if (Array.isArray(searchItem.locations) && searchItem.locations.length > 0) {
    locations = searchItem.locations.map(l => typeof l === 'string' ? l : (l.city ? `${l.city}${l.state ? ', ' + l.state : ''}` : l.country)).filter(Boolean);
  } else if (Array.isArray(jobDet.locations)) {
    locations = jobDet.locations;
  }
  if (locations.length === 0) locations = ['Multiple Locations'];

  let eligibilityParsed = null;
  const eligStr = regReq.eligibility || '';
  if (eligStr) {
    try { eligibilityParsed = JSON.parse(eligStr); } catch (e) { eligibilityParsed = { note: eligStr }; }
  }

  let resumeMatchConfig = [];
  const matchConfigStr = regReq.resume_match_config;
  if (matchConfigStr) {
    try { resumeMatchConfig = typeof matchConfigStr === 'string' ? JSON.parse(matchConfigStr) : matchConfigStr; } catch (e) {}
  }

  let rounds = [];
  const rawRounds = comp.rounds || [];
  rounds = rawRounds.map(r => {
    const detail = Array.isArray(r.details) && r.details.length > 0 ? r.details[0] : {};
    return {
      id: r.id,
      title: detail.title || r.title || `Round ${r.round_order || 1}`,
      type: r.subtype || r.entity_type || 'round',
      order: r.round_order || 1,
      displayText: detail.display_text || detail.description || '',
      startDate: detail.start_date || '',
      endDate: detail.end_date || '',
      status: r.status || detail.status || 'LIVE'
    };
  });

  const org = searchItem.organisation || comp.organisation || {};

  const endDateStr = searchItem.end_date || regReq.end_regn_dt || comp.end_date || null;
  let endDate = endDateStr ? new Date(endDateStr) : null;
  if (endDate && isNaN(endDate.getTime())) endDate = null;

  const now = new Date();
  const regnOpen = searchItem.regn_open !== undefined ? (searchItem.regn_open === 1 || searchItem.regn_open === true) : true;

  let status = searchItem.status || comp.status || 'LIVE';
  if ((endDate && endDate < now) || !regnOpen) {
    status = 'EXPIRED';
  }

  let opportunityType = opportunityTypeOverride || 'jobs';
  if (!opportunityTypeOverride) {
    if (searchItem.subtype === 'internships' || searchItem.public_url?.includes('internships/')) {
      opportunityType = 'internships';
    } else {
      opportunityType = 'jobs';
    }
  }

  return {
    unstopId: searchItem.id || comp.id,
    opportunityType,
    title: (searchItem.title || comp.title || 'Untitled Opportunity').trim(),
    organisation: {
      id: org.id || searchItem.organization_id || comp.organization_id,
      name: (org.name || 'Company Confidential').trim(),
      logoUrl: searchItem.logoUrl2 || org.logoUrl2 || org.logoUrl || 'https://d8it4huxumps7.cloudfront.net/images/icons/jobs.svg',
      logoUrl2: searchItem.logoUrl2 || org.logoUrl2 || '',
      publicUrl: org.public_url || '',
      website: org.website || ''
    },
    locations,
    jobDetail: {
      min_salary: jobDet.min_salary || 0,
      max_salary: jobDet.max_salary || 0,
      currency: jobDet.currency || 'fa-rupee',
      pay_in: jobDet.pay_in || (opportunityType === 'internships' ? 'monthly' : 'annually'),
      timing: jobDet.timing || (opportunityType === 'internships' ? 'internship' : 'full_time'),
      type: jobDet.type || searchItem.region || 'in_office',
      show_salary: jobDet.show_salary !== undefined ? Boolean(jobDet.show_salary) : true,
      min_experience: jobDet.min_experience || null,
      max_experience: jobDet.max_experience || null,
      paid_unpaid: jobDet.paid_unpaid || 'paid',
      not_disclosed: Boolean(jobDet.not_disclosed)
    },
    details: searchItem.details || comp.details || '',
    seoUrl: searchItem.seo_url || comp.seo_url || `https://unstop.com/o/${searchItem.short_id || comp.short_id}`,
    shortUrl: searchItem.short_url || comp.short_url || '',
    publicUrl: searchItem.public_url || comp.public_url || '',
    requiredSkills,
    workFunction,
    filters: (searchItem.filters || comp.filters || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean),
    eligibilityRaw: eligStr,
    eligibilityParsed,
    resumeMatchConfig,
    rounds,
    regnRequirements: {
      start_regn_dt: regReq.start_regn_dt || '',
      end_regn_dt: regReq.end_regn_dt || '',
      remain_days: regReq.remain_days || regReq.remainingDaysArray?.text || 'Open',
      remaining_time: regReq.remaining_time || 0,
      reg_status: regReq.reg_status || 'STARTED'
    },
    endDate,
    regnOpen,
    viewsCount: searchItem.viewsCount || comp.viewsCount || 0,
    registerCount: searchItem.registerCount || comp.registerCount || 0,
    status,
    scrapedAt: new Date(),
    updatedAt: new Date(searchItem.updated_at || searchItem.approved_date || Date.now())
  };
};

const fetchWithRetry = async (url, headers, maxRetries = 2) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await axios.get(url, { headers, timeout: 8000 });
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      await new Promise(res => setTimeout(res, 100));
    }
  }
};

const dedupeBatch = (items) => {
  const seenUnstopIds = new Set();
  const seenKeys = new Set();
  const uniqueItems = [];

  for (const item of items) {
    const key = `${item.title.toLowerCase()}_${item.organisation.name.toLowerCase()}_${item.opportunityType}`;
    if (!seenUnstopIds.has(item.unstopId) && !seenKeys.has(key)) {
      seenUnstopIds.add(item.unstopId);
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
};

/**
 * UNIFIED GENERAL SCRAPER ENGINE
 * Handles recent time windows (12h, 36h, 3d, 5d) AND 189 workfunction sweeps.
 * Scrapes BOTH Jobs AND Internships concurrently in parallel.
 */
export const runGeneralScraper = async ({
  timeWindow = '36h',
  useWorkfunctions = false,
  triggerType = 'MANUAL',
  bearerToken = ''
}) => {
  if (isScraperRunning) {
    addLog('⚠️ Scraper is already executing! Skipping concurrent trigger.', 'warning');
    return { success: false, message: 'Scraper already running' };
  }

  isScraperRunning = true;
  const runId = `run_${Date.now()}`;
  currentRunId = runId;
  const startTime = Date.now();

  let hoursWindow = 36;
  if (timeWindow === '12h') hoursWindow = 12;
  else if (timeWindow === '36h') hoursWindow = 36;
  else if (timeWindow === '3d') hoursWindow = 72;
  else if (timeWindow === '5d') hoursWindow = 120;

  const isFullSweep = useWorkfunctions || timeWindow === 'full';
  const cutoffDate = new Date(Date.now() - hoursWindow * 60 * 60 * 1000);
  const logLabel = isFullSweep ? 'Full 189 Workfunctions Sweep' : (hoursWindow >= 24 ? `${(hoursWindow / 24).toFixed(1)} Days` : `${hoursWindow} Hours`);

  addLog(`🚀 [${triggerType}] Launching General Scraper Engine (${logLabel})...`, 'info');

  const isDbConnected = mongoose.connection.readyState === 1;

  let dbLogRecord = null;
  if (isDbConnected) {
    try {
      dbLogRecord = await ScraperLog.create({
        runId,
        triggerType,
        timeWindow: isFullSweep ? 'full_189_wf' : `${hoursWindow}h`,
        status: 'RUNNING',
        startedAt: new Date(startTime),
        logs: [{ timestamp: new Date().toLocaleTimeString(), message: `Started scraping ${logLabel}`, type: 'info' }]
      });
    } catch (e) {
      console.error('Error creating ScraperLog record:', e);
    }
  }

  const headers = getDefaultHeaders(bearerToken);
  let totalFetched = 0;
  let newInserted = 0;
  let newJobsInserted = 0;
  let newInternshipsInserted = 0;

  let updatedCount = 0;
  let updatedJobsCount = 0;
  let updatedInternshipsCount = 0;

  let jobsCount = 0;
  let internshipsCount = 0;

  const oppTypes = ['jobs', 'internships'];

  try {
    if (isFullSweep) {
      // 189 Workfunction Sweep
      let workfunctions = [];
      try {
        const wfRes = await fetchWithRetry('https://unstop.com/api/workrelationship/workfunction/getAll', headers, 3);
        workfunctions = wfRes.data?.data || [];
        addLog(`✅ Successfully loaded ${workfunctions.length} official Unstop Workfunctions!`, 'success');
      } catch (err) {
        workfunctions = [
          { id: 2004, name: 'Software Development' },
          { id: 1907, name: 'Data Engineering' },
          { id: 1999, name: 'B2C Sales' },
          { id: 1950, name: 'Digital Marketing' }
        ];
      }

      const domainConcurrency = 10;
      const pageConcurrency = 10;
      const wfQueue = workfunctions.map((wf, idx) => ({ ...wf, queueIndex: idx + 1 }));
      let completedDomains = 0;

      const processWorkfunction = async (wf) => {
        const wfName = wf.name || wf.slug || `Workfunction-${wf.id}`;
        let wfCount = 0;

        for (const oppType of oppTypes) {
          const pageTasks = Array.from({ length: 25 }, (_, i) => i + 1);

          const fetchPageTask = async (pageNumber) => {
            const targetUrl = `https://unstop.com/api/public/opportunity/search-result?opportunity=${oppType}&page=${pageNumber}&per_page=50&searchTerm=${encodeURIComponent(wfName)}&sortBy=updated_at&orderBy=desc&undefined=true`;
            try {
              const response = await fetchWithRetry(targetUrl, headers, 2);
              const items = response.data?.data?.data || response.data?.data || [];
              if (!items || items.length === 0) return 0;

              const normalizedJobs = items.map(item => normalizeUnstopJob(item, null, oppType));
              const cleanJobs = dedupeBatch(normalizedJobs);

              if (cleanJobs.length > 0) {
                totalFetched += cleanJobs.length;
                if (oppType === 'jobs') jobsCount += cleanJobs.length;
                else internshipsCount += cleanJobs.length;

                if (isDbConnected) {
                  for (const job of cleanJobs) {
                    const existing = await Job.findOne({
                      $or: [
                        { unstopId: job.unstopId },
                        { title: job.title, 'organisation.name': job.organisation.name, opportunityType: job.opportunityType }
                      ]
                    });

                    if (existing) {
                      await Job.updateOne({ _id: existing._id }, { $set: job });
                      updatedCount++;
                      if (oppType === 'jobs') updatedJobsCount++;
                      else updatedInternshipsCount++;
                    } else {
                      try {
                        await Job.create(job);
                        newInserted++;
                        if (oppType === 'jobs') newJobsInserted++;
                        else newInternshipsInserted++;
                      } catch (e) {}
                    }
                  }
                }
              }
              return cleanJobs.length;
            } catch (e) {
              return 0;
            }
          };

          const pageWorkers = Array(pageConcurrency).fill(null).map(async () => {
            while (pageTasks.length > 0) {
              const p = pageTasks.shift();
              if (p) {
                const count = await fetchPageTask(p);
                wfCount += count;
                if (count === 0 && p > 2) pageTasks.length = 0;
              }
            }
          });

          await Promise.all(pageWorkers);
        }

        completedDomains++;
        addLog(`⚡ [${completedDomains}/${workfunctions.length}] Domain "${wfName}" complete: ${wfCount} items.`, 'success');
      };

      const workers = Array(domainConcurrency).fill(null).map(async () => {
        while (wfQueue.length > 0) {
          const item = wfQueue.shift();
          if (item) await processWorkfunction(item);
        }
      });

      await Promise.all(workers);

    } else {
      // Recent Time-Window Mode (12h, 36h, 3d, 5d)
      for (const oppType of oppTypes) {
        addLog(`🔍 Fetching recent ${oppType.toUpperCase()} updated in last ${logLabel}...`, 'info');
        let page = 1;
        let keepFetching = true;

        while (keepFetching && page <= 25) {
          const targetUrl = `https://unstop.com/api/public/opportunity/search-result?opportunity=${oppType}&page=${page}&per_page=50&sortBy=updated_at&orderBy=desc&undefined=true`;
          try {
            const response = await fetchWithRetry(targetUrl, headers, 2);
            const items = response.data?.data?.data || response.data?.data || [];

            if (!items || items.length === 0) {
              keepFetching = false;
              break;
            }

            const normalized = items.map(item => normalizeUnstopJob(item, null, oppType));
            const recentItems = normalized.filter(item => item.updatedAt >= cutoffDate);

            if (recentItems.length === 0) {
              addLog(`⏱️ Reached listings older than ${logLabel} for ${oppType} on page ${page}. Stopping pagination.`, 'info');
              keepFetching = false;
              break;
            }

            const cleanBatch = dedupeBatch(recentItems);

            if (cleanBatch.length > 0) {
              totalFetched += cleanBatch.length;
              if (oppType === 'jobs') jobsCount += cleanBatch.length;
              else internshipsCount += cleanBatch.length;

              if (isDbConnected) {
                for (const job of cleanBatch) {
                  const existing = await Job.findOne({
                    $or: [
                      { unstopId: job.unstopId },
                      { title: job.title, 'organisation.name': job.organisation.name, opportunityType: job.opportunityType }
                    ]
                  });

                  if (existing) {
                    await Job.updateOne({ _id: existing._id }, { $set: job });
                    updatedCount++;
                    if (oppType === 'jobs') updatedJobsCount++;
                    else updatedInternshipsCount++;
                  } else {
                    try {
                      await Job.create(job);
                      newInserted++;
                      if (oppType === 'jobs') newJobsInserted++;
                      else newInternshipsInserted++;
                    } catch (e) {}
                  }
                }
              }
            }

            if (recentItems.length < items.length) {
              keepFetching = false;
              break;
            }

            page++;
          } catch (err) {
            keepFetching = false;
          }
        }
      }
    }

    const durationSec = Math.round((Date.now() - startTime) / 1000);
    addLog(`🎉 [${triggerType}] Scrape Finished in ${durationSec}s! Processed: ${totalFetched} (New Inserted: ${newInserted} [${newJobsInserted} Jobs, ${newInternshipsInserted} Internships], Updated: ${updatedCount}).`, 'success');

    if (dbLogRecord) {
      dbLogRecord.status = 'SUCCESS';
      dbLogRecord.completedAt = new Date();
      dbLogRecord.durationSec = durationSec;
      dbLogRecord.totalFetched = totalFetched;

      dbLogRecord.newInserted = newInserted;
      dbLogRecord.newJobsInserted = newJobsInserted;
      dbLogRecord.newInternshipsInserted = newInternshipsInserted;

      dbLogRecord.updatedCount = updatedCount;
      dbLogRecord.updatedJobsCount = updatedJobsCount;
      dbLogRecord.updatedInternshipsCount = updatedInternshipsCount;

      dbLogRecord.jobsCount = jobsCount;
      dbLogRecord.internshipsCount = internshipsCount;
      dbLogRecord.logs.push({ timestamp: new Date().toLocaleTimeString(), message: `Finished cleanly in ${durationSec}s`, type: 'success' });
      await dbLogRecord.save();
    }

    isScraperRunning = false;
    currentRunId = null;
    return { success: true, totalFetched, newInserted, newJobsInserted, newInternshipsInserted, updatedCount, jobsCount, internshipsCount, durationSec };
  } catch (err) {
    addLog(`❌ Scraper failed: ${err.message}`, 'error');
    if (dbLogRecord) {
      dbLogRecord.status = 'FAILED';
      dbLogRecord.completedAt = new Date();
      dbLogRecord.error = err.message;
      await dbLogRecord.save();
    }
    isScraperRunning = false;
    currentRunId = null;
    return { success: false, error: err.message };
  }
};

// Aliases for backwards compatibility
export const runTimeWindowScraper = runGeneralScraper;
export const run189WorkfunctionMasterScraper = (opts) => runGeneralScraper({ ...opts, useWorkfunctions: true });

/**
 * Seed Sample Jobs
 */
export const seedSampleJobs = async (dbConnected = true, memoryStore = []) => {
  addLog('Seeding database with high-quality sample Unstop job data...');

  const sampleDataList = [
    {
      id: 1730916,
      title: "Relationship Manager - Direct Channel B2C",
      public_url: "jobs/relationship-manager-direct-channel-b2c-bajaj-capital-limited-1730916",
      short_id: "YZXob38",
      logoUrl2: "https://d8it4huxumps7.cloudfront.net/uploads/images/150x150/6a72d4b377452_organisation_image-B15IH76Z9W2081931328wmofZGfXBP.png",
      organisation: {
        id: 1616638,
        name: "Bajaj Capital Limited",
        public_url: "c/bajaj-capital-limited-1616638",
        logoUrl: "https://d8it4huxumps7.cloudfront.net/images/partners/new_organisation_image-B15IH76Z9W2081931328wmofZGfXBP.png"
      },
      seo_url: "https://unstop.com/jobs/relationship-manager-direct-channel-b2c-bajaj-capital-limited-1730916",
      short_url: "https://unstop.com/o/YZXob38",
      status: "LIVE",
      regn_open: 1,
      end_date: "2026-08-19T00:00:00+05:30",
      details: `<p><strong>Bajaj Capital Limited is hiring for Relationship Manager - Direct Channel B2C!</strong></p>`,
      required_skills: [
        { id: 645802, skill: "Communication Skills" },
        { id: 646159, skill: "Financial Markets Knowledge" }
      ],
      locations: [{ city: "Mumbai", state: "Maharashtra", country: "India" }],
      jobDetail: { min_salary: 300000, max_salary: 600000, currency: "fa-rupee", pay_in: "annually" }
    }
  ];

  let seededCount = 0;
  for (const item of sampleDataList) {
    const norm = normalizeUnstopJob(item);
    if (dbConnected) {
      await Job.findOneAndUpdate(
        { unstopId: norm.unstopId },
        norm,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      const idx = memoryStore.findIndex(j => j.unstopId === norm.unstopId);
      if (idx >= 0) memoryStore[idx] = norm;
      else memoryStore.push(norm);
    }
    seededCount++;
  }

  addLog(`Seeding complete. Inserted/Updated ${seededCount} sample jobs.`, 'success');
  return { success: true, count: seededCount };
};
