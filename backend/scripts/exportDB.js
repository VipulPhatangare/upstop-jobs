import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import Job from '../models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unstop_jobs';

async function exportDatabase() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to local MongoDB.');

  console.log('📦 Fetching all documents...');
  const jobs = await Job.find().lean();
  console.log(`✅ Loaded ${jobs.length} records. Writing to unstop_jobs_backup.json...`);

  fs.writeFileSync('unstop_jobs_backup.json', JSON.stringify(jobs));
  console.log('🎉 EXPORT COMPLETE! File saved: unstop_jobs_backup.json');

  process.exit(0);
}

exportDatabase().catch(err => {
  console.error('Export Error:', err);
  process.exit(1);
});
