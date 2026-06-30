// server/models/MeaningNarrative.js
//
// One per reader. The synthesis of the two signals that robustly shape a
// person's sense of meaning (meaning-log lines + Carry sessions), a
// provisional, evolving reflection framed through give / receive / carry.
// Cached so it doesn't re-cost on every visit; regenerated when their
// inputs grow (so they see the impact of what they add), when it ages past
// a week, or when the voice/prompt version changes.
//
//   sourceCount   — how many inputs (recent meaning logs + Carry sessions)
//                   it was woven from; a change means there's something new.
//   promptVersion — the voice/prompt it was written under; a bump re-weaves
//                   everyone once into the new voice.

import mongoose from 'mongoose';

const meaningNarrativeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  narrative: { type: String, default: '' },
  give: { type: String, default: '' },
  receive: { type: String, default: '' },
  carry: { type: String, default: '' },
  threads: { type: [String], default: [] },
  sourceCount: { type: Number, default: 0 },
  generatedAt: { type: Date },
  promptVersion: { type: Number, default: 0 },
}, { timestamps: true });

export const MeaningNarrative = mongoose.model('MeaningNarrative', meaningNarrativeSchema);
