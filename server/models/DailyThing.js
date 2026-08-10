// server/models/DailyThing.js
//
// One thing worth stopping for, per day, SHARED BY EVERYONE.
//
// This replaces DailyDiscover, which was a per-user per-day room of six
// to ten interest-matched articles. Two things were wrong with it. It
// was topic-driven, which is the mechanic of every content app ever
// built and is not what receiving means in Hearth (see
// docs/DOCTRINE_AUDIT.md §10). And it was a queue: ten items accrue
// guilt, and you cannot stay with ten things, which made the savour beat
// incoherent wherever it was attached.
//
// Shared rather than personalised, for three reasons:
//
//   1. It makes the day an event. "Today, everyone at Hearth stopped for
//      this." The same reasoning that made the daily question shared.
//   2. Beauty, awe and scale are not topics. There is no version of
//      "the vastness of Pando" that needs to be matched to an interest
//      the reader ticked once, months ago, in a grid.
//   3. One generation a day for everybody instead of one per reader,
//      which takes the cost of this surface from O(readers) to O(1).
//
// `register` rotates so the room is not the same kind of thing every
// day. That rotation is where variety comes from now, rather than from
// topic breadth.

import mongoose from 'mongoose';

const dailyThingSchema = new mongoose.Schema({
  // YYYY-MM-DD. Unique: one thing per day, for everyone.
  date: { type: String, required: true, unique: true, index: true },

  // vast | made | true | overlooked | read. See TODAY_REGISTERS.
  register: { type: String, default: '' },

  // A short name for the thing. Not a headline.
  title: { type: String, default: '' },
  // Two sentences at most. No argument, nothing to finish.
  body: { type: String, default: '' },
  // Where it is from, and where to go if the reader wants more. Both
  // optional: plenty of things worth stopping for have no URL.
  sourceName: { type: String, default: '' },
  url: { type: String, default: '' },
  image: { type: String, default: '' },

  generatedAt: { type: Date },
  promptVersion: { type: Number, default: 0 },
}, { timestamps: true });

export const DailyThing = mongoose.model('DailyThing', dailyThingSchema);
