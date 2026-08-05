import express from 'express';
import Job from '../models/Job.js';
import ScraperLog from '../models/ScraperLog.js';
import { runGeneralScraper, getScraperStatus, getLogs } from '../services/scraperService.js';

const router = express.Router();

const getStore = (req) => {
  const isDbConnected = req.app.get('dbConnected');
  const memoryStore = req.app.get('memoryStore');
  return { isDbConnected, memoryStore };
};

/**
 * GET /api/jobs
 * Supports opportunityType ('jobs', 'internships', 'ALL')
 */
router.get('/', async (req, res) => {
  try {
    const { isDbConnected, memoryStore } = getStore(req);
    const {
      q = '',
      location = '',
      type = '',
      timing = '',
      skill = '',
      opportunityType = 'ALL',
      minSalary = 0,
      maxSalary = 0,
      status = 'LIVE',
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;

    if (isDbConnected) {
      const filter = {};

      if (status !== 'ALL') {
        filter.status = status || 'LIVE';
      }

      if (opportunityType && opportunityType !== 'ALL') {
        if (opportunityType === 'jobs') {
          filter.opportunityType = { $ne: 'internships' };
        } else {
          filter.opportunityType = opportunityType;
        }
      }

      if (q) {
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { 'organisation.name': { $regex: q, $options: 'i' } },
          { requiredSkills: { $regex: q, $options: 'i' } },
          { locations: { $regex: q, $options: 'i' } }
        ];
      }

      if (location) {
        filter.locations = { $regex: location, $options: 'i' };
      }

      if (type) {
        filter['jobDetail.type'] = type;
      }

      if (timing) {
        filter['jobDetail.timing'] = timing;
      }

      if (skill) {
        filter.requiredSkills = { $regex: skill, $options: 'i' };
      }

      if (minSalary > 0 || maxSalary > 0) {
        filter['jobDetail.max_salary'] = {};
        if (minSalary > 0) filter['jobDetail.max_salary'].$gte = parseInt(minSalary, 10);
        if (maxSalary > 0) filter['jobDetail.max_salary'].$lte = parseInt(maxSalary, 10);
      }

      let sortOption = { createdAt: -1 };
      if (sortBy === 'salary_desc') sortOption = { 'jobDetail.max_salary': -1 };
      if (sortBy === 'salary_asc') sortOption = { 'jobDetail.min_salary': 1 };
      if (sortBy === 'views') sortOption = { viewsCount: -1 };
      if (sortBy === 'oldest') sortOption = { createdAt: 1 };

      const total = await Job.countDocuments(filter);
      const jobs = await Job.find(filter)
        .sort(sortOption)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const allLocations = await Job.distinct('locations', filter);
      const allSkills = await Job.distinct('requiredSkills', filter);
      const allCompanies = await Job.distinct('organisation.name', filter);

      return res.json({
        success: true,
        data: jobs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        },
        meta: {
          locations: allLocations.filter(Boolean),
          skills: allSkills.filter(Boolean),
          companies: allCompanies.filter(Boolean)
        }
      });
    } else {
      let filtered = [...memoryStore];

      if (status !== 'ALL') {
        filtered = filtered.filter(j => j.status === (status || 'LIVE'));
      }

      if (opportunityType && opportunityType !== 'ALL') {
        if (opportunityType === 'jobs') {
          filtered = filtered.filter(j => j.opportunityType !== 'internships');
        } else {
          filtered = filtered.filter(j => j.opportunityType === opportunityType);
        }
      }

      if (q) {
        const queryLower = q.toLowerCase();
        filtered = filtered.filter(j =>
          j.title.toLowerCase().includes(queryLower) ||
          j.organisation.name.toLowerCase().includes(queryLower) ||
          j.requiredSkills.some(s => s.toLowerCase().includes(queryLower)) ||
          j.locations.some(l => l.toLowerCase().includes(queryLower))
        );
      }

      if (location) {
        filtered = filtered.filter(j => j.locations.some(l => l.toLowerCase().includes(location.toLowerCase())));
      }

      if (type) {
        filtered = filtered.filter(j => j.jobDetail.type === type);
      }

      if (timing) {
        filtered = filtered.filter(j => j.jobDetail.timing === timing);
      }

      if (skill) {
        filtered = filtered.filter(j => j.requiredSkills.some(s => s.toLowerCase().includes(skill.toLowerCase())));
      }

      if (minSalary > 0) {
        filtered = filtered.filter(j => (j.jobDetail.max_salary || j.jobDetail.min_salary) >= parseInt(minSalary, 10));
      }

      if (sortBy === 'salary_desc') filtered.sort((a, b) => (b.jobDetail.max_salary || 0) - (a.jobDetail.max_salary || 0));
      else if (sortBy === 'salary_asc') filtered.sort((a, b) => (a.jobDetail.min_salary || 0) - (b.jobDetail.min_salary || 0));
      else if (sortBy === 'views') filtered.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
      else filtered.sort((a, b) => new Date(b.scrapedAt || 0) - new Date(a.scrapedAt || 0));

      const total = filtered.length;
      const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      const locationsSet = new Set();
      const skillsSet = new Set();
      const companiesSet = new Set();

      memoryStore.forEach(j => {
        (j.locations || []).forEach(l => locationsSet.add(l));
        (j.requiredSkills || []).forEach(s => skillsSet.add(s));
        if (j.organisation?.name) companiesSet.add(j.organisation.name);
      });

      return res.json({
        success: true,
        data: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        },
        meta: {
          locations: Array.from(locationsSet),
          skills: Array.from(skillsSet),
          companies: Array.from(companiesSet)
        }
      });
    }
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs', error: err.message });
  }
});

/**
 * POST /api/jobs/scrape/trigger
 * Triggers General Scraper Engine for 12h, 36h, 3d, 5d, or full workfunctions
 */
router.post('/scrape/trigger', async (req, res) => {
  try {
    const { timeWindow = '36h', useWorkfunctions = false } = req.body;

    const status = getScraperStatus();
    if (status.isRunning) {
      return res.status(400).json({ success: false, message: 'A scraping job is already running in the background.' });
    }

    const isFull = useWorkfunctions || timeWindow === 'full';
    runGeneralScraper({ timeWindow, useWorkfunctions: isFull, triggerType: 'MANUAL' });

    return res.json({
      success: true,
      message: `General Scraper Engine launched in background for: ${timeWindow}`,
      timeWindow
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to trigger scraper', error: err.message });
  }
});

/**
 * GET /api/jobs/scrape/status
 */
router.get('/scrape/status', (req, res) => {
  const status = getScraperStatus();
  const logs = getLogs();
  return res.json({ success: true, status, logs });
});

/**
 * GET /api/jobs/scrape/logs
 * Returns historical scraper execution logs from MongoDB
 */
router.get('/scrape/logs', async (req, res) => {
  try {
    const { isDbConnected } = getStore(req);
    if (isDbConnected) {
      const history = await ScraperLog.find().sort({ startedAt: -1 }).limit(30);
      return res.json({ success: true, data: history });
    } else {
      return res.json({ success: true, data: [] });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch scraper logs', error: err.message });
  }
});

/**
 * DELETE /api/jobs/scrape/logs
 * Clears all historical scraper logs from MongoDB and memory
 */
router.delete('/scrape/logs', async (req, res) => {
  try {
    const { isDbConnected } = getStore(req);
    if (isDbConnected) {
      const deleted = await ScraperLog.deleteMany({});
      const logs = getLogs();
      logs.length = 0;
      return res.json({ success: true, message: `All scraper logs cleared cleanly. Removed ${deleted.deletedCount} log records.`, count: deleted.deletedCount });
    } else {
      const logs = getLogs();
      const count = logs.length;
      logs.length = 0;
      return res.json({ success: true, message: `In-memory scraper logs cleared cleanly (${count} items).`, count });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear scraper logs', error: err.message });
  }
});

/**
 * GET /api/jobs/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { isDbConnected, memoryStore } = getStore(req);
    const idParam = req.params.id;

    if (isDbConnected) {
      let job = null;
      if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
        job = await Job.findById(idParam);
      }
      if (!job && !isNaN(idParam)) {
        job = await Job.findOne({ unstopId: parseInt(idParam, 10) });
      }
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      job.viewsCount = (job.viewsCount || 0) + 1;
      await job.save();

      return res.json({ success: true, data: job });
    } else {
      let job = memoryStore.find(j => j._id === idParam || j.unstopId === parseInt(idParam, 10));
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found in memory' });
      }
      job.viewsCount = (job.viewsCount || 0) + 1;
      return res.json({ success: true, data: job });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving job details', error: err.message });
  }
});

/**
 * POST /api/jobs (Admin Create Job)
 */
router.post('/', async (req, res) => {
  try {
    const { isDbConnected, memoryStore } = getStore(req);
    const body = req.body;
    const unstopId = body.unstopId || Math.floor(1000000 + Math.random() * 9000000);

    const newJobData = {
      unstopId,
      opportunityType: body.opportunityType || 'jobs',
      title: body.title || 'Untitled Role',
      organisation: {
        id: Math.floor(100000 + Math.random() * 900000),
        name: body.companyName || 'Custom Company',
        logoUrl: body.logoUrl || 'https://d8it4huxumps7.cloudfront.net/images/icons/jobs.svg',
        logoUrl2: body.logoUrl || '',
        publicUrl: ''
      },
      locations: Array.isArray(body.locations) ? body.locations : (body.locations ? body.locations.split(',').map(s => s.trim()) : ['Remote']),
      jobDetail: {
        min_salary: body.minSalary || 0,
        max_salary: body.maxSalary || 0,
        currency: body.currency || 'fa-rupee',
        pay_in: body.payIn || 'annually',
        timing: body.timing || 'full_time',
        type: body.type || 'in_office',
        show_salary: true
      },
      details: body.details || '<p>No specific details provided.</p>',
      requiredSkills: Array.isArray(body.skills) ? body.skills : (body.skills ? body.skills.split(',').map(s => s.trim()) : []),
      status: body.status || 'LIVE',
      isCustom: true,
      scrapedAt: new Date()
    };

    if (isDbConnected) {
      const created = await Job.create(newJobData);
      return res.status(201).json({ success: true, message: 'Job created successfully', data: created });
    } else {
      newJobData._id = 'mem_' + Date.now();
      memoryStore.unshift(newJobData);
      return res.status(201).json({ success: true, message: 'Job created in memory', data: newJobData });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create job', error: err.message });
  }
});

/**
 * PUT /api/jobs/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { isDbConnected, memoryStore } = getStore(req);
    const idParam = req.params.id;
    const body = req.body;

    if (isDbConnected) {
      let job = await Job.findById(idParam);
      if (!job && !isNaN(idParam)) {
        job = await Job.findOne({ unstopId: parseInt(idParam, 10) });
      }
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

      if (body.title) job.title = body.title;
      if (body.companyName) job.organisation.name = body.companyName;
      if (body.status) job.status = body.status;
      if (body.details) job.details = body.details;
      if (body.locations) job.locations = Array.isArray(body.locations) ? body.locations : body.locations.split(',').map(s => s.trim());
      if (body.skills) job.requiredSkills = Array.isArray(body.skills) ? body.skills : body.skills.split(',').map(s => s.trim());

      if (body.minSalary !== undefined) job.jobDetail.min_salary = body.minSalary;
      if (body.maxSalary !== undefined) job.jobDetail.max_salary = body.maxSalary;
      if (body.type) job.jobDetail.type = body.type;

      await job.save();
      return res.json({ success: true, message: 'Job updated successfully', data: job });
    } else {
      let idx = memoryStore.findIndex(j => j._id === idParam || j.unstopId === parseInt(idParam, 10));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Job not found' });

      const target = memoryStore[idx];
      if (body.title) target.title = body.title;
      if (body.companyName) target.organisation.name = body.companyName;
      if (body.status) target.status = body.status;
      if (body.details) target.details = body.details;

      return res.json({ success: true, message: 'Job updated in memory', data: target });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update job', error: err.message });
  }
});

/**
 * DELETE /api/jobs/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { isDbConnected, memoryStore } = getStore(req);
    const idParam = req.params.id;

    if (isDbConnected) {
      let deleted = await Job.findByIdAndDelete(idParam);
      if (!deleted && !isNaN(idParam)) {
        deleted = await Job.findOneAndDelete({ unstopId: parseInt(idParam, 10) });
      }
      if (!deleted) return res.status(404).json({ success: false, message: 'Job not found' });
      return res.json({ success: true, message: 'Job deleted successfully' });
    } else {
      const initialLen = memoryStore.length;
      const filtered = memoryStore.filter(j => j._id !== idParam && j.unstopId !== parseInt(idParam, 10));
      req.app.set('memoryStore', filtered);
      if (filtered.length === initialLen) return res.status(404).json({ success: false, message: 'Job not found' });
      return res.json({ success: true, message: 'Job deleted from memory' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete job', error: err.message });
  }
});

/**
 * GET /api/admin/stats
 */
router.get('/admin/stats', async (req, res) => {
  try {
    const { isDbConnected, memoryStore } = getStore(req);

    if (isDbConnected) {
      const totalOpportunities = await Job.countDocuments();
      const totalFullTimeJobs = await Job.countDocuments({ opportunityType: { $ne: 'internships' } });
      const totalInternships = await Job.countDocuments({ opportunityType: 'internships' });

      const activeOpportunities = await Job.countDocuments({ status: 'LIVE' });
      const activeFullTimeJobs = await Job.countDocuments({ status: 'LIVE', opportunityType: { $ne: 'internships' } });
      const activeInternships = await Job.countDocuments({ status: 'LIVE', opportunityType: 'internships' });

      const uniqueCompanies = (await Job.distinct('organisation.name')).length;

      const salaryAgg = await Job.aggregate([
        {
          $group: {
            _id: null,
            avgMinSalary: { $avg: '$jobDetail.min_salary' },
            avgMaxSalary: { $avg: '$jobDetail.max_salary' },
            highestSalary: { $max: '$jobDetail.max_salary' }
          }
        }
      ]);

      const topLocations = await Job.aggregate([
        { $unwind: '$locations' },
        { $group: { _id: '$locations', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      return res.json({
        success: true,
        data: {
          totalOpportunities,
          totalFullTimeJobs,
          totalInternships,
          activeOpportunities,
          activeFullTimeJobs,
          activeInternships,
          uniqueCompanies,
          avgMinSalary: Math.round(salaryAgg[0]?.avgMinSalary || 0),
          avgMaxSalary: Math.round(salaryAgg[0]?.avgMaxSalary || 0),
          highestSalary: salaryAgg[0]?.highestSalary || 0,
          topLocations: topLocations.map(l => ({ location: l._id, count: l.count }))
        }
      });
    } else {
      const totalOpportunities = memoryStore.length;
      const totalFullTimeJobs = memoryStore.filter(j => j.opportunityType !== 'internships').length;
      const totalInternships = memoryStore.filter(j => j.opportunityType === 'internships').length;

      const activeOpportunities = memoryStore.filter(j => j.status === 'LIVE').length;
      const activeFullTimeJobs = memoryStore.filter(j => j.status === 'LIVE' && j.opportunityType !== 'internships').length;
      const activeInternships = memoryStore.filter(j => j.status === 'LIVE' && j.opportunityType === 'internships').length;

      const companies = new Set(memoryStore.map(j => j.organisation?.name).filter(Boolean));
      const locCounts = {};
      let totalMaxSal = 0;
      let countSal = 0;
      let highestSal = 0;

      memoryStore.forEach(j => {
        (j.locations || []).forEach(l => {
          locCounts[l] = (locCounts[l] || 0) + 1;
        });
        const maxS = j.jobDetail?.max_salary || 0;
        if (maxS > 0) {
          totalMaxSal += maxS;
          countSal++;
          if (maxS > highestSal) highestSal = maxS;
        }
      });

      const topLocs = Object.entries(locCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return res.json({
        success: true,
        data: {
          totalOpportunities,
          totalFullTimeJobs,
          totalInternships,
          activeOpportunities,
          activeFullTimeJobs,
          activeInternships,
          uniqueCompanies: companies.size,
          avgMinSalary: 350000,
          avgMaxSalary: countSal > 0 ? Math.round(totalMaxSal / countSal) : 0,
          highestSalary: highestSal,
          topLocations: topLocs
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate admin stats', error: err.message });
  }
});

export default router;
