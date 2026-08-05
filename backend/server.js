import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jobRoutes from './routes/jobRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { seedSampleJobs, addLog } from './services/scraperService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unstop_jobs';

// Global state variables
let isDbConnected = false;
let memoryStore = [];
let nextScheduled3AM = null;

app.set('dbConnected', false);
app.set('memoryStore', memoryStore);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected ? 'MongoDB Connected' : 'In-Memory Fallback Active',
    jobsCount: isDbConnected ? 'DB Active' : memoryStore.length,
    next3AMScrapeScheduledAt: nextScheduled3AM ? nextScheduled3AM.toLocaleString() : 'Not scheduled',
    timestamp: new Date()
  });
});

/**
 * Schedule Daily 3:00 AM IST Scraper
 */
const scheduleDaily3AMScrape = () => {
  const now = new Date();
  const next3AM = new Date();
  
  // Target: 3:00:00.000 AM
  next3AM.setHours(3, 0, 0, 0);

  // If 3:00 AM today has already passed, set for 3:00 AM tomorrow
  if (now >= next3AM) {
    next3AM.setDate(next3AM.getDate() + 1);
  }

  nextScheduled3AM = next3AM;
  const msUntil3AM = next3AM.getTime() - now.getTime();
  const hoursLeft = (msUntil3AM / (1000 * 60 * 60)).toFixed(2);

  const msg = `⏰ Next Daily 3:00 AM Auto-Scrape scheduled at: ${next3AM.toLocaleString()} (in ${hoursLeft} hours)`;
  console.log(msg);
  addLog(msg, 'info');

  setTimeout(async () => {
    console.log('⏰ [3:00 AM CRON] Executing Scheduled Daily 36-Hour Scraper...');
    const { runGeneralScraper } = await import('./services/scraperService.js');
    await runGeneralScraper({ timeWindow: '36h', triggerType: 'AUTO_CRON' });
    
    // Reschedule for next day 3:00 AM
    scheduleDaily3AMScrape();
  }, msUntil3AM);
};

// Connect DB & Start Server
const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 4000
    });
    isDbConnected = true;
    app.set('dbConnected', true);
    console.log('✅ MongoDB connected successfully!');
    addLog('MongoDB database connection established.', 'success');

    // Automatically seed sample data if DB is empty
    const Job = (await import('./models/Job.js')).default;
    const count = await Job.countDocuments();
    if (count === 0) {
      console.log('Database empty. Auto-seeding initial job payload...');
      await seedSampleJobs(true, memoryStore);
    }
  } catch (err) {
    console.warn(`⚠️ Could not connect to local MongoDB: ${err.message}`);
    console.warn('⚡ Activating high-performance In-Memory Fallback Mode.');
    isDbConnected = false;
    app.set('dbConnected', false);
    addLog('Operating in In-Memory Fallback Mode (Local MongoDB unavailable).', 'warning');

    await seedSampleJobs(false, memoryStore);
  }

  // Launch 3:00 AM IST Daily Cron Schedule
  scheduleDaily3AMScrape();

  app.listen(PORT, () => {
    console.log(`🚀 Unstop Job Scraper Backend running on http://localhost:${PORT}`);
  });
};

startServer();
