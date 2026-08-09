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

// The reader's own words for a row, and whether they have said a row
// is right. See the note on authorship below.
const ownSchema = new mongoose.Schema(
  { give: { type: String, default: '' }, receive: { type: String, default: '' }, carry: { type: String, default: '' } },
  { _id: false },
);
const affirmedSchema = new mongoose.Schema(
  { give: { type: Boolean, default: false }, receive: { type: Boolean, default: false }, carry: { type: Boolean, default: false } },
  { _id: false },
);

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

  // ── Authorship ────────────────────────────────────────────────────
  // The reader is the author of their own meaning. Hearth offers a
  // reading; it does not get to file a verdict. So a reader can say of
  // any row "yes, that's it" (affirmed) or replace it in their own
  // words (own).
  //
  // `own` is load-bearing: once set, it wins on render and is NEVER
  // overwritten by a re-weave. A synthesis that could quietly overwrite
  // what a person said about their own life would be the same authority
  // inversion the brief warns against (BRAND_BRIEF §5.6, §6.3).
  own: { type: ownSchema, default: () => ({}) },
  affirmed: { type: affirmedSchema, default: () => ({}) },
}, { timestamps: true });

export const MeaningNarrative = mongoose.model('MeaningNarrative', meaningNarrativeSchema);
