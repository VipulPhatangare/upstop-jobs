import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';
import { run189WorkfunctionMasterScraper } from '../services/scraperService.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unstop_jobs';
const BEARER_TOKEN = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiYzdmZDUyNmU4Nzk0YzNhNTYwZGZjZjNiZWFhMDljMmVmY2YzMmNhMmJiMWFlOTgxZTQ2OTdiN2ZlNTE2NzJhN2U4MjZmYzk2MTZlZjY0ODIiLCJpYXQiOjE3ODU5MTA3NzQuMzUyNTQxLCJuYmYiOjE3ODU5MTA3NzQuMzUyNTQ0LCJleHAiOjE3ODgzMjk5NzQuMzM4NjY1LCJzdWIiOiIxOTIyMTg4MiIsInNjb3BlcyI6W119.NaOMoL1la0LAU7U6s2ncBzwe9aMGGx0jNgt60hoaHJzqlk1j_LEmw0amVTM7jyYl338hNrAAWKE7AnMvdxQYIT9ajFaxQ4TbY_BkMzNpDgpKjDpmDZB1XYWfqXztLZTTvhpOhtdJyN9I3rt5YJg4gijvcyuv2EFLhJrm2SSEWzuuCwe0BmGb8wmdmXJxdSDjmJkG5IesZTKO9SnM5ZMHdd028muNo--nidMMQ-LRgUwnkeDwDiWFgp-y8CY6YBC8HuMSNIaIt1f6-LzlgODPF3pePVuwZDDh88vh7wqflqWJNCD1uGky6iIeH1GLF5clooRp08FWPcJ3ek6y9d1Pt-Th1ityoH0D0SJQcxn_3t2k28Z9slhWtVZxvYRGdV-bK5MrZRc0J1_LU56bvk87JRUwpoiozBnTrOHxFCkz3WogF2kqlOr3CQzYc6jlN7K0O_Cf7kqWLxyapn3sC4Yr21Xb7OiH9H4L8pieJWe2LjmuQPK9itVaieCMlxE7T5kZaP-QJRs7S5BFEPVvryinnvWJKQafHIsLV8k1ViHxVr8q4_mLKihyIoVOmDZcGSGWmuq9aVKlpW-rT5kzyXtkd_Ihbl7ATim-kozqCghNhONu0XS3WDOWobfTEl2RLMc_BAzjD7nxSVX_xIw9Krqn2TjtxIa1hHUHSee7ghkQXRg';

const main = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const startTime = Date.now();

  console.log(`\n🚀 Executing 189-Workfunction Master Scraper Engine (Harvesting ALL jobs across official Unstop workfunctions)...`);
  await run189WorkfunctionMasterScraper({
    perPage: 50,
    concurrency: 10,
    bearerToken: BEARER_TOKEN,
    dbConnected: true
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const finalTotal = await Job.countDocuments();
  const liveCount = await Job.countDocuments({ status: 'LIVE' });

  console.log(`\n🎉 189-Workfunction Master Scraper finished in ${durationSec} seconds!`);
  console.log(`📊 Total Jobs in MongoDB: ${finalTotal} jobs (${liveCount} Active LIVE jobs).`);
  process.exit(0);
};

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
