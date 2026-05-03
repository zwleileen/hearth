// Weekly bibliotherapy cache. One row per (user, ISO week-start).
// The endpoint computes themes + book recommendations from the user's
// journal entries; this row holds the LLM result so re-renders don't
// re-pay the latency or the OpenAI cost. Re-computed when the week
// rolls over (new weekStart key), or when an explicit ?refresh=1 is
// passed by the client.
//
// weekStart is stored as YYYY-MM-DD (Monday of the week, ISO 8601).

import mongoose from 'mongoose';

const weeklyBibliotherapySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weekStart: { type: String, required: true },
  reflection: { type: String, default: '' },
  themes: { type: mongoose.Schema.Types.Mixed, default: [] },
  books: { type: mongoose.Schema.Types.Mixed, default: [] },
  entryCount: { type: Number, default: 0 },
}, { timestamps: true });

weeklyBibliotherapySchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyBibliotherapy = mongoose.model('WeeklyBibliotherapy', weeklyBibliotherapySchema);
