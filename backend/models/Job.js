import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  unstopId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  opportunityType: {
    type: String,
    enum: ['jobs', 'internships'],
    default: 'jobs',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  organisation: {
    id: Number,
    name: { type: String, default: 'Unknown Company', index: true },
    logoUrl: String,
    logoUrl2: String,
    publicUrl: String,
    website: String
  },
  locations: [{
    type: String,
    index: true
  }],
  jobDetail: {
    min_salary: { type: Number, default: 0 },
    max_salary: { type: Number, default: 0 },
    currency: { type: String, default: 'fa-rupee' },
    pay_in: { type: String, default: 'annually' },
    timing: { type: String, default: 'full_time' },
    type: { type: String, default: 'in_office' },
    show_salary: { type: Boolean, default: true },
    min_experience: Number,
    max_experience: Number,
    paid_unpaid: String,
    not_disclosed: Boolean
  },
  details: {
    type: String,
    default: ''
  },
  seoUrl: String,
  shortUrl: String,
  publicUrl: String,
  requiredSkills: [{
    type: String,
    index: true
  }],
  workFunction: [{
    type: String,
    index: true
  }],
  filters: [{
    type: String
  }],
  eligibilityRaw: String,
  eligibilityParsed: mongoose.Schema.Types.Mixed,
  resumeMatchConfig: mongoose.Schema.Types.Mixed,
  rounds: mongoose.Schema.Types.Mixed,
  regnRequirements: {
    start_regn_dt: String,
    end_regn_dt: String,
    remain_days: String,
    remaining_time: Number,
    reg_status: String
  },
  endDate: { type: Date, index: true },
  regnOpen: { type: Boolean, default: true, index: true },
  viewsCount: { type: Number, default: 0 },
  registerCount: { type: Number, default: 0 },
  status: { type: String, default: 'LIVE', index: true },
  scrapedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isCustom: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Primary Unique Indexes preventing duplicate entries AT INSERTION TIME
jobSchema.index({ title: 1, 'organisation.name': 1, opportunityType: 1 }, { unique: true });
jobSchema.index({ title: 'text', 'organisation.name': 'text', details: 'text', requiredSkills: 'text' });

// Export API indexes: time-window filtering and stable range pagination
jobSchema.index({ scrapedAt: -1 });
jobSchema.index({ createdAt: -1, _id: -1 });

export default mongoose.model('Job', jobSchema);
