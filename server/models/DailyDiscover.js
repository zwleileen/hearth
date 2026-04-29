import mongoose from 'mongoose';

const dailyDiscoverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  issueNote: { type: String, default: '' },
  items: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

dailyDiscoverSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyDiscover = mongoose.model('DailyDiscover', dailyDiscoverSchema);
