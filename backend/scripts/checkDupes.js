import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unstop_jobs';

async function checkDuplicates() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const total = await Job.countDocuments();

  // Check unstopId duplicates
  const unstopIdDupes = await Job.aggregate([
    { $group: { _id: '$unstopId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  // Check title + company + opportunityType duplicates
  const titleCompDupes = await Job.aggregate([
    { $group: { _id: { title: '$title', company: '$organisation.name', type: '$opportunityType' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log(`\n📊 LIVE DATABASE DUPLICATE VERIFICATION RESULTS:`);
  console.log(`   - Total Database Records: ${total}`);
  console.log(`   - Duplicate unstopId Records Found: ${unstopIdDupes.length}`);
  console.log(`   - Duplicate Title+Company+Category Records Found: ${titleCompDupes.length}`);

  process.exit(0);
}

checkDuplicates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
