// server/routes/kindle.js
//
// Kindle — a guided logotherapy session in Frankl's method. The reader
// types how they feel; Hearth guides them through one session toward
// something lighter by way of meaning, then meets their answer to the
// session's one question with a closing turning.
//
//   POST   /api/kindle              generate the opening session
//   POST   /api/kindle/:id/reply    answer the question, get the turning
//   GET    /api/kindle/log          past sessions, reverse-chronological
//   DELETE /api/kindle/log/:id      remove a session from the logbook

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI } from '../lib/ai.js';
import {
  generateKindleSession,
  generateKindleTurning,
  detectDistress,
  CARE_RESOURCES,
} from '../lib/kindleRunner.js';
import { KindleSession } from '../models/KindleSession.js';

export const kindle = Router();
kindle.use(requireAuth);

const FEELING_MAX = 2000;
const REPLY_MAX = 2000;

// How many recent sessions to look back over for companion diversity.
const DIVERSITY_WINDOW = 6;

const LOG_DEFAULT_LIMIT = 30;
const LOG_MAX_LIMIT = 100;

// Build the care block for a response when distress was seen. Resources
// are composed here, never by the model, so hotline numbers are always
// real. Returns null when no distress, so the client renders nothing.
function careBlock(flagged) {
  return flagged ? { flagged: true, ...CARE_RESOURCES } : null;
}

// ── POST /api/kindle ──────────────────────────────────────────────────
// Generate the opening session for the reader's current feeling.
kindle.post('/', async (req, res) => {
  const userId = req.userId;
  const { feeling } = req.body || {};
  if (!feeling || typeof feeling !== 'string' || !feeling.trim()) {
    return res.status(400).json({ error: 'feeling (free text) is required' });
  }
  if (feeling.length > FEELING_MAX) {
    return res.status(400).json({ error: `feeling is too long, please keep it under ${FEELING_MAX} characters` });
  }

  // Companion diversity: collect the figures this reader has recently
  // met so the next session looks elsewhere unless the feeling calls
  // one back. Same convergence fix Attune uses for artists.
  let recentCompanions = [];
  try {
    const recent = await KindleSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(DIVERSITY_WINDOW)
      .select('session.companion.name')
      .lean();
    const set = new Set();
    for (const r of recent) {
      const n = r.session?.companion?.name?.trim();
      if (n) set.add(n);
    }
    recentCompanions = [...set];
  } catch (err) {
    console.warn('[kindle] failed to load companion diversity:', err.message);
  }

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  let session;
  try {
    const result = await generateKindleSession(client, {
      feeling,
      diversity: { recentCompanions },
    });
    session = result.data;
  } catch (err) {
    console.error('[kindle]', err);
    return res.status(500).json({ error: 'Failed to guide the session', detail: err.message });
  }

  // OR the model's read with the server-side keyword backstop. Err
  // toward showing help.
  const flagged = !!session.careFlag || detectDistress(feeling);

  // Persist. A save failure must not cost the reader their session, so
  // we respond regardless and only log the loss of logbook/diversity.
  let saved = null;
  try {
    saved = await KindleSession.create({
      userId,
      feeling: feeling.trim(),
      session,
      careFlagged: flagged,
    });
  } catch (err) {
    console.warn('[kindle] failed to save session:', err.message);
  }

  res.json({
    id: saved ? saved._id.toString() : null,
    session,
    care: careBlock(flagged),
    createdAt: saved ? saved.createdAt : new Date(),
  });
});

// ── POST /api/kindle/:id/reply ────────────────────────────────────────
// The reader answers the session's widening question; we return the
// closing turning and persist both onto the existing session record.
kindle.post('/:id/reply', async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { reply } = req.body || {};
  if (!reply || typeof reply !== 'string' || !reply.trim()) {
    return res.status(400).json({ error: 'reply (free text) is required' });
  }
  if (reply.length > REPLY_MAX) {
    return res.status(400).json({ error: `reply is too long, please keep it under ${REPLY_MAX} characters` });
  }

  const record = await KindleSession.findOne({ _id: id, userId });
  if (!record) return res.status(404).json({ error: 'Session not found' });

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  let turning;
  try {
    const result = await generateKindleTurning(client, {
      feeling: record.feeling,
      session: record.session,
      reply,
    });
    turning = result.data;
  } catch (err) {
    console.error('[kindle/reply]', err);
    return res.status(500).json({ error: 'Failed to close the session', detail: err.message });
  }

  // Distress can surface in the reply even if the opening was calm.
  // Once flagged, stays flagged for the record.
  const flaggedNow = !!turning.careFlag || detectDistress(reply);
  const careFlagged = record.careFlagged || flaggedNow;

  try {
    record.reply = reply.trim();
    record.replyTurning = turning;
    record.careFlagged = careFlagged;
    await record.save();
  } catch (err) {
    console.warn('[kindle] failed to save reply turning:', err.message);
  }

  res.json({
    id: record._id.toString(),
    turning,
    care: careBlock(flaggedNow),
  });
});

// ── GET /api/kindle/log ───────────────────────────────────────────────
kindle.get('/log', async (req, res) => {
  const userId = req.userId;
  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || LOG_DEFAULT_LIMIT, 1),
    LOG_MAX_LIMIT,
  );
  const before = req.query.before ? new Date(req.query.before) : null;

  const query = { userId };
  if (before && !isNaN(before.getTime())) query.createdAt = { $lt: before };

  try {
    const rows = await KindleSession.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = rows.length > limit;
    const page = (hasMore ? rows.slice(0, limit) : rows).map((e) => ({
      id: e._id.toString(),
      userId: e.userId.toString(),
      feeling: e.feeling,
      session: e.session || {},
      reply: e.reply || '',
      replyTurning: e.replyTurning || null,
      careFlagged: !!e.careFlagged,
      createdAt: e.createdAt,
    }));
    res.json({ entries: page, hasMore });
  } catch (err) {
    console.error('[kindle] log read failed:', err);
    res.status(500).json({ error: 'Failed to load logbook' });
  }
});

// ── DELETE /api/kindle/log/:id ────────────────────────────────────────
kindle.delete('/log/:id', async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    const r = await KindleSession.deleteOne({ _id: id, userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Session not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[kindle] log delete failed:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});
