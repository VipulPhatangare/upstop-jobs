import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import Job from '../models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unstop_jobs';

async function importDatabase() {
  console.log('Connecting to VPS MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  if (!fs.existsSync('unstop_jobs_backup.json')) {
    console.error('❌ Error: unstop_jobs_backup.json file not found in current directory!');
    process.exit(1);
  }

  console.log('📖 Reading unstop_jobs_backup.json backup file...');
  const rawData = fs.readFileSync('unstop_jobs_backup.json', 'utf8');
  const jobs = JSON.parse(rawData);
  console.log(`📦 Found ${jobs.length} records. Importing into MongoDB...`);

  const bulkOps = jobs.map(job => {
    delete job._id;
    return {
      updateOne: {
        filter: {
          $or: [
            { unstopId: job.unstopId },
            { title: job.title, 'organisation.name': job.organisation?.name, opportunityType: job.opportunityType }
          ]
        },
        update: { $set: job },
        upsert: true
      }
    };
  });

  const chunkSize = 1000;
  for (let i = 0; i < bulkOps.length; i += chunkSize) {
    const chunk = bulkOps.slice(i, i + chunkSize);
    await Job.bulkWrite(chunk, { ordered: false });
    console.log(`⚡ Imported chunk [${Math.min(i + chunkSize, bulkOps.length)}/${bulkOps.length}] records...`);
  }

  const finalTotal = await Job.countDocuments();
  console.log(`🎉 IMPORT COMPLETE! Total Verified Records in VPS MongoDB: ${finalTotal}`);

  process.exit(0);
}

importDatabase().catch(err => {
  console.error('Import Error:', err);
  process.exit(1);
});
