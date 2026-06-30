// server/models/AttuneEntry.js
//
// One record per Attune reading. Captures what the reader shared, the
// AI's interpretation of that mood, the register it chose, and the
// titles it recommended. Two purposes:
//   1. Logbook — the reader can revisit past readings and their own
//      mood as the model heard it (the moodSummary field is what they
//      asked to preserve).
//   2. Diversity context — the most recent N entries feed back into
//      the next Attune call as "recently recommended; avoid repeating
//      these unless the mood specifically calls for them". This is
//      the mechanism that breaks the convergence pattern where every
//      input produced Bon Iver and Phoebe Bridgers.

import mongoose from 'mongoose';

const songSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    artist: { type: String, default: '' },
    why: { type: String, default: '' },
  },
  { _id: false }
);

const poemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    poet: { type: String, default: '' },
    why: { type: String, default: '' },
    text: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false }
);

// One book excerpt per reading: a mood-matched passage (affective
// bibliotherapy) the reader can sit with or save to their Nook.
const excerptSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    author: { type: String, default: '' },
    text: { type: String, default: '' },
    why: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const attuneEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // What the reader typed in their own words. Trimmed but not edited.
    mood: { type: String, required: true },

    // What the AI heard back. The two- or three-sentence reflection
    // that names the texture of the mood. This is the field the reader
    // asked to preserve as logbook content.
    moodSummary: { type: String, default: '' },

    // The register the model committed to before picking titles
    // ("holding silence", "kinetic celebration", etc.). Useful for the
    // logbook listing (a chip on each entry) and for diversity context
    // (preventing the same register from being chosen back-to-back when
    // the mood materially differs).
    register: { type: String, default: '' },

    // The full reading the model returned. Stored so the reader can
    // open a past entry and see exactly what they were offered, not
    // a re-roll.
    songs: { type: [songSchema], default: [] },
    poems: { type: [poemSchema], default: [] },

    // The mood-matched book excerpt for this reading. Defaults to an
    // empty object so entries that pre-date the excerpt feature read
    // back cleanly without a migration.
    excerpt: { type: excerptSchema, default: () => ({}) },

    // Optional preferences the reader set for this reading. Both
    // default to the "no constraint" value when omitted, so older
    // entries that pre-date this feature read back as "any genre,
    // either vocals" without needing a migration.
    preferences: {
      type: new mongoose.Schema(
        {
          // Genre vocabulary kept small + opinionated. Maps onto the
          // existing register taxonomy in HEARTH_VOICE rather than
          // re-inventing music classification. "any" = no constraint.
          genre: {
            type: String,
            enum: ['any', 'folk', 'classical', 'jazz', 'soul', 'electronic', 'indie', 'hiphop', 'world'],
            default: 'any',
          },
          // Three states keeps the model from over-rotating. "either"
          // = no constraint; "with" = vocal-led; "without" = strictly
          // instrumental.
          vocals: {
            type: String,
            enum: ['either', 'with', 'without'],
            default: 'either',
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// Compound index for the primary read pattern: "this user's recent
// entries in reverse-chronological order".
attuneEntrySchema.index({ userId: 1, createdAt: -1 });

attuneEntrySchema.method('toClient', function () {
  const { _id, userId, mood, moodSummary, register, songs, poems, excerpt, preferences, createdAt } = this;
  return {
    id: _id.toString(),
    userId: userId.toString(),
    mood,
    moodSummary,
    register,
    songs: (songs || []).map((s) => ({ title: s.title, artist: s.artist, why: s.why })),
    poems: (poems || []).map((p) => ({ title: p.title, poet: p.poet, why: p.why, text: p.text, url: p.url })),
    excerpt: excerpt
      ? { title: excerpt.title || '', author: excerpt.author || '', text: excerpt.text || '', why: excerpt.why || '', url: excerpt.url || '' }
      : null,
    preferences: {
      genre: preferences?.genre || 'any',
      vocals: preferences?.vocals || 'either',
    },
    createdAt,
  };
});

export const AttuneEntry = mongoose.model('AttuneEntry', attuneEntrySchema);
