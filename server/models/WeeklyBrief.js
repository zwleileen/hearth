// Reflection brief cache. One living row per (user, kind).
//
// Two surfaces use this:
//   kind: 'journal' — a concise paragraph mirroring back what has been on
//                     the reader's mind across their journal: their moods,
//                     what soothes them, what they return to with gratitude.
//   kind: 'nook'    — a concise paragraph reflecting what the reader's
//                     saved collection (songs, poems, books, articles) says
//                     about what matters to them.
//
// The LLM result is cached so re-renders don't re-pay the latency or cost.
// Unlike a calendar-week cache, the brief is regenerated on a ROLLING
// cadence: when it ages past seven days (see generatedAt), when the reader
// adds new material (itemCount changes), when the prompt version changes,
// or on an explicit ?refresh=1. This keeps a steady "refreshes every 7
// days" rhythm regardless of which day of the week someone visits.
//
//   generatedAt   — when this brief was last woven; drives the 7-day cadence.
//   promptVersion — the voice/prompt the brief was written under; a bump
//                   re-weaves everyone once into the new voice.
//   weekStart     — legacy anchor (YYYY-MM-DD) kept only so old rows keep
//                   satisfying the historical unique index; no longer the
//                   cache key. Updated rows reuse their existing anchor.

import mongoose from 'mongoose';

const weeklyBriefSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weekStart: { type: String, required: true },
  kind: { type: String, enum: ['journal', 'nook'], required: true },
  brief: { type: String, default: '' },
  itemCount: { type: Number, default: 0 },
  generatedAt: { type: Date },
  promptVersion: { type: Number, default: 0 },
}, { timestamps: true });

// Legacy unique index, retained so existing rows stay valid. The route now
// keeps a single living row per (user, kind) by updating in place rather
// than inserting a new row each week, so this never collides.
weeklyBriefSchema.index({ userId: 1, weekStart: 1, kind: 1 }, { unique: true });

export const WeeklyBrief = mongoose.model('WeeklyBrief', weeklyBriefSchema);
