// Weekly reflection brief cache. One row per (user, ISO week-start, kind).
//
// Two surfaces use this:
//   kind: 'journal' — a concise paragraph mirroring back what has been on
//                     the reader's mind across their journal: their moods,
//                     what soothes them, what they return to with gratitude.
//   kind: 'nook'    — a concise paragraph reflecting what the reader's
//                     saved collection (songs, poems, books, articles) says
//                     about what matters to them.
//
// Like WeeklyBibliotherapy, the LLM result is cached so re-renders don't
// re-pay the latency or OpenAI cost. Re-computed when the week rolls over
// (new weekStart key) or when an explicit ?refresh=1 is passed.
//
// weekStart is stored as YYYY-MM-DD (Monday of the week, ISO 8601).

import mongoose from 'mongoose';

const weeklyBriefSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weekStart: { type: String, required: true },
  kind: { type: String, enum: ['journal', 'nook'], required: true },
  brief: { type: String, default: '' },
  itemCount: { type: Number, default: 0 },
}, { timestamps: true });

// One brief per user, per week, per surface.
weeklyBriefSchema.index({ userId: 1, weekStart: 1, kind: 1 }, { unique: true });

export const WeeklyBrief = mongoose.model('WeeklyBrief', weeklyBriefSchema);
