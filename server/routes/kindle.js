// server/routes/kindle.js
//
// Kindle — a guided logotherapy session in Frankl's method. The reader
// types how they feel; Hearth guides them through one session toward
// something lighter by way of meaning, then meets their answer to the
// session's one question with a closing turning.
//
//   POST   /api/kindle              generate the opening session
//   POST   /api/kindle/:id/reply    answer the question, get the turning
//   POST   /api/kindle/:id/reseen   say the seeing missed, get seen again
//   POST   /api/kindle/:id/image    make the picture of the mirror (?again=1 to repaint it)
//   GET    /api/kindle/:id/image    read the picture back
//   GET    /api/kindle/log          past sessions, reverse-chronological
//   DELETE /api/kindle/log/:id      remove a session from the logbook

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI } from '../lib/ai.js';
import {
  generateKindleSession,
  generateKindleTurning,
  generateKindleReseeing,
} from '../lib/kindleRunner.js';
import { detectDistress, careBlockFor, regionFromTimeZone } from '../lib/care.js';
import { generateKindleImage } from '../lib/kindleImage.js';
import { generateCardWords } from '../lib/cardWords.js';
import { KindleSession } from '../models/KindleSession.js';
import { KindleImage, REPAINT_LIMIT } from '../models/KindleImage.js';
import { CardOrder } from '../models/CardOrder.js';
import { MeaningNarrative } from '../models/MeaningNarrative.js';

export const kindle = Router();
kindle.use(requireAuth);

const FEELING_MAX = 2000;
const REPLY_MAX = 2000;
const CORRECTION_MAX = 2000;

// How many recent sessions to look back over for companion diversity.
const DIVERSITY_WINDOW = 6;
// How many recent sessions to pass as continuity (their words only).
// Small on purpose: enough to be known, not enough to be profiled, and
// it keeps the prompt a constant size however long someone stays.
const KNOWING_WINDOW = 3;

const LOG_DEFAULT_LIMIT = 30;
const LOG_MAX_LIMIT = 100;

// Build the care block for a response when distress was seen. Resources
// are composed server-side, never by the model, so hotline numbers are
// always real, and are chosen for the reader's own region so they can
// actually be called. Returns null when no distress, so a calm surface
// renders nothing at all.
function careBlock(flagged, req) {
  return careBlockFor(flagged, regionFromTimeZone(req.get('X-Hearth-TZ') || ''));
}

// Everything Hearth already knows of this reader, for the session
// prompt: their meaning narrative, and the last few things they brought
// here in their own words. Never the mirrors or turnings Hearth itself
// offered them. Best-effort: a failure here costs continuity, not the
// session.
async function loadKnowing(userId) {
  try {
    const [narr, recent] = await Promise.all([
      MeaningNarrative.findOne({ userId }).lean(),
      KindleSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(KNOWING_WINDOW)
        .select('feeling')
        .lean(),
    ]);
    return {
      narrative: narr
        ? { narrative: narr.narrative || '', give: narr.give || '', receive: narr.receive || '', carry: narr.carry || '' }
        : null,
      recentFeelings: (recent || []).map((r) => r.feeling).filter(Boolean),
    };
  } catch (err) {
    console.warn('[kindle] failed to load continuity:', err.message);
    return null;
  }
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

  const knowing = await loadKnowing(userId);

  let session;
  try {
    const result = await generateKindleSession(client, {
      feeling,
      diversity: { recentCompanions },
      knowing,
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
    care: careBlock(flagged, req),
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
    care: careBlock(flaggedNow, req),
  });
});

// ── POST /api/kindle/:id/reseen ───────────────────────────────────────
// The reader says the opening seeing missed them, and tells us how.
//
// This is the dialogue working, not a failure to apologise for: the
// reader is the author of their own meaning, so when Hearth's reading
// and theirs disagree, theirs is the true one. We regenerate only the
// naming and the seeing and leave the rest of the session standing, so
// a correction costs one small call rather than the whole session.
kindle.post('/:id/reseen', async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { correction } = req.body || {};
  if (!correction || typeof correction !== 'string' || !correction.trim()) {
    return res.status(400).json({ error: 'correction (free text) is required' });
  }
  if (correction.length > CORRECTION_MAX) {
    return res.status(400).json({ error: `correction is too long, please keep it under ${CORRECTION_MAX} characters` });
  }

  const record = await KindleSession.findOne({ _id: id, userId });
  if (!record) return res.status(404).json({ error: 'Session not found' });

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  let reseen;
  try {
    const result = await generateKindleReseeing(client, {
      feeling: record.feeling,
      session: record.session,
      correction,
    });
    reseen = result.data;
  } catch (err) {
    console.error('[kindle/reseen]', err);
    return res.status(500).json({ error: 'Failed to see it again', detail: err.message });
  }

  const flaggedNow = !!reseen.careFlag || detectDistress(correction);

  // Persist the correction and the corrected seeing onto the record, so
  // the logbook shows what the reader actually meant rather than the
  // first reading they rejected.
  try {
    if (reseen.feelingName?.trim()) record.session.feelingName = reseen.feelingName.trim();
    if (reseen.seeing?.trim()) record.session.seeing = reseen.seeing.trim();
    record.correction = correction.trim();
    record.careFlagged = record.careFlagged || flaggedNow;
    record.markModified('session');
    await record.save();
  } catch (err) {
    console.warn('[kindle] failed to save re-seeing:', err.message);
  }

  res.json({
    id: record._id.toString(),
    feelingName: reseen.feelingName || '',
    seeing: reseen.seeing || '',
    care: careBlock(flaggedNow, req),
  });
});

// ── POST /api/kindle/:id/image ────────────────────────────────────────
// Make the picture that accompanies this session: its mirror, painted.
// One per session. Asking again returns the one already made, so a
// second tap, or a request that outlived the reader's patience, never
// pays for a second picture.
//
// A picture takes most of a minute, which is long enough for a proxy to
// give up on the request while the work carries on here. So the work in
// flight is remembered by session, a repeat request joins it, and the
// picture is saved whether or not anyone is still waiting for it.
const drawing = new Map();

kindle.post('/:id/image', async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const record = await KindleSession.findOne({ _id: id, userId });
  if (!record) return res.status(404).json({ error: 'Session not found' });

  // Painting it again replaces the picture, a limited number of times.
  const again = req.query.again === '1';
  const existing = await KindleImage.findOne({ sessionId: record._id, userId });
  if (existing && !again) return res.json(existing.toClient());
  if (existing && (existing.repaints || 0) >= REPAINT_LIMIT) {
    return res.status(429).json({ error: 'This picture has been painted as many times as it can be.' });
  }

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  const key = record._id.toString();
  let work = drawing.get(key);
  if (!work) {
    work = (async () => {
      // The card's words are set alongside the painting, once; a repaint
      // keeps them. A failure here costs only the head start: the card
      // page sets them when it opens.
      const [made, cardWords] = await Promise.all([
        generateKindleImage(client, { session: record.session, replyTurning: record.replyTurning }),
        existing?.cardWords?.body
          ? null
          : generateCardWords(client, { session: record.session, replyTurning: record.replyTurning }).catch((err) => {
            console.warn('[kindle/image] card words failed:', err.message);
            return null;
          }),
      ]);
      if (cardWords) made.cardWords = cardWords;
      if (!existing) {
        const [count, last] = await Promise.all([
          KindleImage.countDocuments({ userId }),
          KindleImage.findOne({ userId, imageNo: { $exists: true } }).sort({ imageNo: -1 }).select('imageNo').lean(),
        ]);
        made.imageNo = Math.max(count, last?.imageNo || 0) + 1;
      }
      const saved = existing
        ? await KindleImage.findOneAndUpdate(
          { _id: existing._id },
          { $set: made, $inc: { repaints: 1 } },
          { new: true },
        )
        : await KindleImage.findOneAndUpdate(
          { sessionId: record._id },
          { $setOnInsert: { sessionId: record._id, userId, ...made } },
          { upsert: true, new: true },
        );
      await KindleSession.updateOne({ _id: record._id }, { $set: { hasImage: true } });
      return saved;
    })().finally(() => drawing.delete(key));
    drawing.set(key, work);
  }

  try {
    const saved = await work;
    res.json(saved.toClient());
  } catch (err) {
    console.error('[kindle/image]', err);
    res.status(500).json({ error: 'Failed to make the picture', detail: err.message });
  }
});

// ── GET /api/kindle/:id/image ─────────────────────────────────────────
kindle.get('/:id/image', async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    // The screen copy only: the print master stays in the database.
    const found = await KindleImage.findOne({ sessionId: id, userId }).select('data contentType alt repaints');
    if (!found) return res.status(404).json({ error: 'No picture for this session' });
    res.json(found.toClient());
  } catch (err) {
    console.error('[kindle/image] read failed:', err);
    res.status(500).json({ error: 'Failed to load the picture' });
  }
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
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    // The cards each session has become, so the logbook can show which
    // ones went out into the world and to whom.
    const sent = new Map();
    try {
      const orders = await CardOrder.find({
        userId, status: 'sent_to_print', sessionId: { $in: pageRows.map((e) => e._id) },
      }).select('sessionId recipient.name forSelf createdAt').sort({ createdAt: 1 }).lean();
      for (const o of orders) {
        const k = o.sessionId.toString();
        if (!sent.has(k)) sent.set(k, []);
        sent.get(k).push({ to: o.recipient?.name || '', forSelf: !!o.forSelf, createdAt: o.createdAt });
      }
    } catch (err) {
      console.warn('[kindle] failed to load cards for the logbook:', err.message);
    }
    const page = pageRows.map((e) => ({
      id: e._id.toString(),
      userId: e.userId.toString(),
      feeling: e.feeling,
      session: e.session || {},
      reply: e.reply || '',
      replyTurning: e.replyTurning || null,
      correction: e.correction || '',
      careFlagged: !!e.careFlagged,
      hasImage: !!e.hasImage,
      cards: sent.get(e._id.toString()) || [],
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
    // The picture goes with the session it was made for.
    await KindleImage.deleteOne({ sessionId: id, userId }).catch((err) => {
      console.warn('[kindle] failed to delete picture:', err.message);
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[kindle] log delete failed:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});
