import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI } from '../lib/ai.js';
import { normalisePreferences } from '../lib/attunePrompt.js';
import { generateAttuneReading } from '../lib/attuneRunner.js';
import { AttuneEntry } from '../models/AttuneEntry.js';

export const attune = Router();
attune.use(requireAuth);

// How many recent entries to feed back into the next prompt as
// "avoid repeating these unless the mood specifically calls for them".
// 5 is enough to break the convergence pattern (where the same 3-4
// artists kept appearing every cycle) without over-constraining the
// model on long-running users.
const DIVERSITY_WINDOW = 5;

// How many recent entries to surface in the logbook by default. Older
// entries are reachable via pagination.
const LOG_DEFAULT_LIMIT = 30;
const LOG_MAX_LIMIT = 100;

// ── POST /api/attune ──────────────────────────────────────────────────
// Generate a reading for the user's current mood. After success, save
// the entry as a logbook record and use the most recent entries to
// nudge the next call away from familiar artists/poets.
attune.post('/', async (req, res) => {
  const userId = req.userId;
  const { mood, genre, vocals } = req.body || {};
  if (!mood || typeof mood !== 'string' || !mood.trim()) {
    return res.status(400).json({ error: 'mood (free text) is required' });
  }
  if (mood.length > 1000) {
    return res.status(400).json({ error: 'mood is too long, please keep it under 1000 characters' });
  }

  // Normalise preferences. Anything unrecognised falls back to the
  // "no constraint" default rather than 400-ing, so the API stays
  // forgiving to older clients that don't send these fields yet.
  const prefs = normalisePreferences({ genre, vocals });

  // ── Diversity context ──────────────────────────────────────────────
  // Pull the last N entries for this user. Collect the distinct artists,
  // poets, and registers we've already given them. These get injected
  // into the user prompt as "recently recommended; do not repeat unless
  // the mood specifically demands it". This is the load-bearing fix
  // for the convergence-on-the-same-artists problem.
  let recentArtists = [];
  let recentPoets = [];
  let recentRegisters = [];
  try {
    const recent = await AttuneEntry.find({ userId })
      .sort({ createdAt: -1 })
      .limit(DIVERSITY_WINDOW)
      .select('register songs poems')
      .lean();
    const artistSet = new Set();
    const poetSet = new Set();
    const registerSet = new Set();
    for (const r of recent) {
      for (const s of r.songs || []) if (s.artist) artistSet.add(s.artist.trim());
      for (const p of r.poems || []) if (p.poet) poetSet.add(p.poet.trim());
      if (r.register) registerSet.add(r.register.trim());
    }
    recentArtists = [...artistSet].slice(0, 12);
    recentPoets = [...poetSet].slice(0, 12);
    recentRegisters = [...registerSet];
  } catch (err) {
    console.warn('[attune] failed to load diversity context:', err.message);
  }

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  let data;
  try {
    const result = await generateAttuneReading(client, {
      mood,
      preferences: prefs,
      diversity: { recentArtists, recentPoets, recentRegisters },
    });
    data = result.data;
  } catch (err) {
    console.error('[attune]', err);
    return res.status(500).json({ error: 'Failed to generate recommendations', detail: err.message });
  }

  // Save the entry as a logbook record. Failures here do not break the
  // user's response, they still see their reading. We just lose the
  // ability to feed it back into the next call's diversity context.
  try {
    await AttuneEntry.create({
      userId,
      mood: mood.trim(),
      moodSummary: data.moodSummary || '',
      register: data.register || '',
      songs: Array.isArray(data.songs) ? data.songs : [],
      poems: Array.isArray(data.poems) ? data.poems : [],
      preferences: prefs,
    });
  } catch (err) {
    console.warn('[attune] failed to save log entry:', err.message);
  }

  res.json(data);
});

// ── GET /api/attune/log ───────────────────────────────────────────────
// Returns the user's Attune entries in reverse-chronological order.
// Supports ?limit= (capped at 100) and ?before=ISO for pagination.
attune.get('/log', async (req, res) => {
  const userId = req.userId;
  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || LOG_DEFAULT_LIMIT, 1),
    LOG_MAX_LIMIT
  );
  const before = req.query.before ? new Date(req.query.before) : null;

  const query = { userId };
  if (before && !isNaN(before.getTime())) {
    query.createdAt = { $lt: before };
  }

  try {
    const entries = await AttuneEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1) // fetch one extra to know if there's another page
      .lean();
    const hasMore = entries.length > limit;
    const page = (hasMore ? entries.slice(0, limit) : entries).map((e) => ({
      id: e._id.toString(),
      userId: e.userId.toString(),
      mood: e.mood,
      moodSummary: e.moodSummary || '',
      register: e.register || '',
      songs: e.songs || [],
      poems: e.poems || [],
      preferences: {
        genre: e.preferences?.genre || 'any',
        vocals: e.preferences?.vocals || 'either',
      },
      createdAt: e.createdAt,
    }));
    res.json({ entries: page, hasMore });
  } catch (err) {
    console.error('[attune] log read failed:', err);
    res.status(500).json({ error: 'Failed to load logbook' });
  }
});

// ── DELETE /api/attune/log/:id ────────────────────────────────────────
// Lets a reader remove an entry from their own logbook. Useful when an
// entry feels too raw to keep, or simply doesn't deserve a return.
attune.delete('/log/:id', async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    const r = await AttuneEntry.deleteOne({ _id: id, userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[attune] log delete failed:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});
