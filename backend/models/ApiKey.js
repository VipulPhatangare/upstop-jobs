import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Singleton API Key model.
 *
 * The `keyId` field is ALWAYS the literal string 'PRIMARY' and carries a unique
 * index. That makes it physically impossible for this collection to ever hold
 * more than one key document, which is what guarantees "only one API key works
 * at a time". Regenerating simply upserts over the same row, so the previous
 * key stops validating the moment the write lands.
 */
const apiKeySchema = new mongoose.Schema({
  keyId: {
    type: String,
    default: 'PRIMARY',
    unique: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  label: {
    type: String,
    default: 'Primary Export Key',
    trim: true
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: Date,
  lastUsedIp: String,
  lastEndpoint: String,
  usageCount: {
    type: Number,
    default: 0
  },
  totalRecordsServed: {
    type: Number,
    default: 0
  },
  createdBy: String
}, {
  timestamps: true
});

/**
 * Generates a fresh key string: usj_live_<48 hex chars>.
 * The prefix keeps the key identifiable in logs and secret scanners.
 */
apiKeySchema.statics.generateKeyString = function () {
  return `usj_live_${crypto.randomBytes(24).toString('hex')}`;
};

/**
 * Creates the key if none exists yet, otherwise returns the existing one.
 * Used so the admin tab always has something to display on first open.
 */
apiKeySchema.statics.ensureKey = async function (createdBy = 'system') {
  const existing = await this.findOne({ keyId: 'PRIMARY' });
  if (existing) return existing;

  return this.create({
    keyId: 'PRIMARY',
    key: this.generateKeyString(),
    label: 'Primary Export Key',
    version: 1,
    createdBy
  });
};

/**
 * Overwrites the singleton row with a brand new key and bumps the version.
 * Usage counters reset because they describe the lifetime of a single key.
 */
apiKeySchema.statics.regenerate = async function (createdBy = 'admin') {
  const current = await this.findOne({ keyId: 'PRIMARY' });
  const nextVersion = (current?.version || 0) + 1;

  return this.findOneAndUpdate(
    { keyId: 'PRIMARY' },
    {
      $set: {
        key: this.generateKeyString(),
        version: nextVersion,
        isActive: true,
        createdBy,
        label: current?.label || 'Primary Export Key',
        usageCount: 0,
        totalRecordsServed: 0,
        lastUsedAt: null,
        lastUsedIp: null,
        lastEndpoint: null
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

export default mongoose.model('ApiKey', apiKeySchema);
