// server/models/MeaningNarrative.js
//
// One per reader. The synthesis of everything they keep, a provisional,
// evolving reflection of their unique sense of meaning, framed through
// give / receive / carry. Cached so it doesn't re-cost on every visit;
// regenerated when their inputs grow (so they see the impact of what
// they add) or when it ages past a week.
//
//   sourceCount  — how many inputs (log + journal + saves + sessions) it
//                  was woven from; a change means there's something new
//                  to weave in.

import mongoose from 'mongoose';

const meaningNarrativeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  narrative: { type: String, default: '' },
  threads: { type: [String], default: [] },
  sourceCount: { type: Number, default: 0 },
  generatedAt: { type: Date },
}, { timestamps: true });

export const MeaningNarrative = mongoose.model('MeaningNarrative', meaningNarrativeSchema);
