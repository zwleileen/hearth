// server/models/Encounter.js
//
// One person, looked at properly.
//
// Frankl puts encounter under experiential values, and ranks it highest
// within them: meaning received "by experiencing another human being in
// his very uniqueness, by loving him". Hearth had no surface for the
// people actually in a reader's life as meaning received. Give has the
// letter, which turns outward; this is the receiving half.
//
// WHY THIS IS ITS OWN RECORD AND NOT A MEANING LOG ENTRY.
//
// Noticing is free and unweighted; keeping is deliberate and weighted.
// If every observation landed in the meaning log it would feed the
// narrative, and a month of incidental noticing would produce a portrait
// claiming that what moves this person is baristas and strangers at bus
// stops. That would be false, and slightly absurd. So encounters live
// here, the narrative never reads them, and a reader who decides a
// particular one belongs to their meaning can promote it deliberately
// (`kept`), which writes a meaning-log line at that moment.
//
// WHAT THIS IS NOT, AND MUST NEVER BECOME.
//
// Not a contact list. There is no cadence, no last-seen, no "you have
// not written about Sam in three weeks", no counts, no health, no
// reminders about a named person, and nothing is ever overdue. The
// moment an app keeps a ledger of your relationships it has turned
// people into records to maintain, which is exactly the I-It relation
// that encounter exists to escape. This model holds observations, never
// obligations.

import mongoose from 'mongoose';

const encounterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // A name, or a description: "Dad", "the man at the bus stop". Free
  // text on purpose. Strangers count, and if they did not, this would
  // become friendship admin and could only be done occasionally.
  person: { type: String, required: true },

  // What the reader noticed that most people would walk past. About
  // them, never about what they did for the reader; that is the letter.
  noticed: { type: String, required: true },

  // Optional, and the most distinctly logotherapeutic field in Hearth:
  // what the reader can see in them that they might not see in
  // themselves. Frankl's potential-seeing, which he held to participate
  // in bringing the potential about.
  potential: { type: String, default: '' },

  // YYYY-MM-DD, for display grouping.
  date: { type: String, required: true },

  // True only when the reader deliberately said this one mattered. The
  // narrative still does not read encounters; this records the decision
  // and pairs with the meaning-log line written at the same moment.
  kept: { type: Boolean, default: false },
}, { timestamps: true });

// Primary read pattern: this reader's encounters, newest first. The
// gallery groups by person in the route, not in the query, because the
// grouping is a presentation choice and the store should stay a plain
// log of moments.
encounterSchema.index({ userId: 1, createdAt: -1 });

encounterSchema.method('toClient', function () {
  const { _id, person, noticed, potential, date, kept, createdAt } = this;
  return {
    id: _id.toString(),
    person, noticed,
    potential: potential || '',
    date,
    kept: !!kept,
    createdAt,
  };
});

export const Encounter = mongoose.model('Encounter', encounterSchema);
