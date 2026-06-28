// server/models/KindleSession.js
//
// One record per Kindle session: a guided logotherapy session in
// Frankl's method. Captures what the reader felt, the five-movement
// session the model returned, the question it posed, the reader's
// answer, and the closing turning generated from that answer.
//
// Two purposes, like AttuneEntry:
//   1. Logbook — the reader can return to past sessions and re-read the
//      companion they met and the turning they were offered.
//   2. Companion diversity — recent sessions feed the next prompt the
//      figures already met, so the session does not reach for the same
//      companion every time.

import mongoose from 'mongoose';

// The first-pass session the model returns. Mirrors KINDLE_SESSION_SCHEMA.
const sessionSchema = new mongoose.Schema(
  {
    feelingName: { type: String, default: '' },
    seeing: { type: String, default: '' },
    widening: {
      type: new mongoose.Schema(
        { reflection: { type: String, default: '' }, question: { type: String, default: '' } },
        { _id: false },
      ),
      default: () => ({}),
    },
    companion: {
      type: new mongoose.Schema(
        {
          name: { type: String, default: '' },
          source: { type: String, default: '' },
          predicament: { type: String, default: '' },
          turning: { type: String, default: '' },
          line: { type: String, default: '' },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    turning: {
      type: new mongoose.Schema(
        { avenue: { type: String, default: '' }, insight: { type: String, default: '' } },
        { _id: false },
      ),
      default: () => ({}),
    },
    step: {
      type: new mongoose.Schema(
        { invitation: { type: String, default: '' }, keepsake: { type: String, default: '' } },
        { _id: false },
      ),
      default: () => ({}),
    },
    closing: { type: String, default: '' },
  },
  { _id: false },
);

// The follow-up turning generated after the reader answers. Mirrors
// KINDLE_TURNING_SCHEMA. Absent until the reader replies.
const replyTurningSchema = new mongoose.Schema(
  {
    acknowledgement: { type: String, default: '' },
    turning: { type: String, default: '' },
    step: {
      type: new mongoose.Schema(
        { invitation: { type: String, default: '' }, keepsake: { type: String, default: '' } },
        { _id: false },
      ),
      default: () => ({}),
    },
    closing: { type: String, default: '' },
  },
  { _id: false },
);

const kindleSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // What the reader typed, in their own words. Trimmed, not edited.
    feeling: { type: String, required: true },

    // The five-movement session.
    session: { type: sessionSchema, default: () => ({}) },

    // The reader's answer to the widening question, and the closing
    // turning generated from it. Both empty until they reply.
    reply: { type: String, default: '' },
    replyTurning: { type: replyTurningSchema, default: null },

    // True if either the model's careFlag or the server-side keyword
    // scan saw signs of acute distress at any point in this session.
    // When true, the client showed (and the logbook will re-show) the
    // crisis resources alongside the session.
    careFlagged: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Primary read pattern: this user's recent sessions, newest first.
kindleSessionSchema.index({ userId: 1, createdAt: -1 });

kindleSessionSchema.method('toClient', function () {
  const { _id, userId, feeling, session, reply, replyTurning, careFlagged, createdAt } = this;
  return {
    id: _id.toString(),
    userId: userId.toString(),
    feeling,
    session,
    reply: reply || '',
    replyTurning: replyTurning || null,
    careFlagged: !!careFlagged,
    createdAt,
  };
});

export const KindleSession = mongoose.model('KindleSession', kindleSessionSchema);
