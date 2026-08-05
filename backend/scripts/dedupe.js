import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unstop_jobs';

const runDeduplication = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const initialTotal = await Job.countDocuments();
  console.log(`📊 Initial Total Documents in MongoDB: ${initialTotal}`);

  // Step 1: Deduplicate by unstopId
  console.log('\n🔍 Step 1: Checking for duplicate unstopId records...');
  const unstopIdDuplicates = await Job.aggregate([
    {
      $group: {
        _id: '$unstopId',
        count: { $sum: 1 },
        docs: { $push: '$_id' }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  let unstopDuplicatesRemoved = 0;
  for (const dup of unstopIdDuplicates) {
    const [keepId, ...deleteIds] = dup.docs;
    const res = await Job.deleteMany({ _id: { $in: deleteIds } });
    unstopDuplicatesRemoved += res.deletedCount;
  }
  console.log(`✅ Removed ${unstopDuplicatesRemoved} duplicate unstopId records.`);

  // Step 2: Deduplicate by exact (title + organisation.name + opportunityType)
  console.log('\n🔍 Step 2: Checking for identical title + company duplicates...');
  const titleOrgDuplicates = await Job.aggregate([
    {
      $group: {
        _id: {
          title: '$title',
          orgName: '$organisation.name',
          type: '$opportunityType'
        },
        count: { $sum: 1 },
        docs: { $push: '$_id' }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  let titleOrgDuplicatesRemoved = 0;
  for (const dup of titleOrgDuplicates) {
    const [keepId, ...deleteIds] = dup.docs;
    const res = await Job.deleteMany({ _id: { $in: deleteIds } });
    titleOrgDuplicatesRemoved += res.deletedCount;
  }
  console.log(`✅ Removed ${titleOrgDuplicatesRemoved} identical title/company duplicate records.`);

  const finalTotal = await Job.countDocuments();
  const liveCount = await Job.countDocuments({ status: 'LIVE' });
  const fullTimeJobs = await Job.countDocuments({ opportunityType: { $ne: 'internships' } });
  const internships = await Job.countDocuments({ opportunityType: 'internships' });

  console.log('\n🎉 DEDUPLICATION COMPLETE!');
  console.log(`📊 Initial Count: ${initialTotal}`);
  console.log(`🧹 Total Duplicate Records Cleaned: ${unstopDuplicatesRemoved + titleOrgDuplicatesRemoved}`);
  console.log(`✨ Final Verified Unique Dataset: ${finalTotal}`);
  console.log(`   - Full-Time Jobs: ${fullTimeJobs}`);
  console.log(`   - Internships: ${internships}`);
  console.log(`   - Active Live Opportunities: ${liveCount}`);

  process.exit(0);
};

runDeduplication().catch(err => {
  console.error('Fatal Deduplication Error:', err);
  process.exit(1);
});
