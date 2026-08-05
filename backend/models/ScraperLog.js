import mongoose from 'mongoose';

const scraperLogSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    index: true
  },
  triggerType: {
    type: String,
    enum: ['AUTO_CRON', 'MANUAL'],
    default: 'MANUAL'
  },
  timeWindow: {
    type: String,
    default: '36h'
  },
  status: {
    type: String,
    enum: ['RUNNING', 'SUCCESS', 'FAILED'],
    default: 'RUNNING',
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date,
  durationSec: {
    type: Number,
    default: 0
  },
  totalFetched: {
    type: Number,
    default: 0
  },
  newInserted: {
    type: Number,
    default: 0
  },
  newJobsInserted: {
    type: Number,
    default: 0
  },
  newInternshipsInserted: {
    type: Number,
    default: 0
  },
  updatedCount: {
    type: Number,
    default: 0
  },
  updatedJobsCount: {
    type: Number,
    default: 0
  },
  updatedInternshipsCount: {
    type: Number,
    default: 0
  },
  jobsCount: {
    type: Number,
    default: 0
  },
  internshipsCount: {
    type: Number,
    default: 0
  },
  logs: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  error: String
}, {
  timestamps: true
});

export default mongoose.model('ScraperLog', scraperLogSchema);
