// server/models/MeaningLog.js
//
// One line a reader keeps in answer to "the meaning of this moment" on
// Home. This is the daily loop made permanent: the answer is saved to
// the account (not just the device), so the record follows the reader
// across devices and accrues into "what you've been noticing".
//
//   date   — YYYY-MM-DD the answer was kept (drives the "today" view and
//            the dated list).
//   prompt — the invitation they answered, kept for context.
//   avenue — give | receive | carry, the avenue that day leaned toward.

import mongoose from 'mongoose';

const meaningLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  prompt: { type: String, default: '' },
  text: { type: String, required: true },
  avenue: { type: String, default: '' },
}, { timestamps: true });

// Primary read pattern: this reader's recent lines, newest first.
meaningLogSchema.index({ userId: 1, createdAt: -1 });

meaningLogSchema.method('toClient', function () {
  const { _id, date, prompt, text, avenue, createdAt } = this;
  return { id: _id.toString(), date, prompt, text, avenue, createdAt };
});

export const MeaningLog = mongoose.model('MeaningLog', meaningLogSchema);
