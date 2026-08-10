// Weekly digest routes.
//
// /api/digest/bibliotherapy
//   Reads the user's last ~14 days of journal entries, surfaces 1-2
//   themes via LLM, and returns 2-3 book recommendations grounded in
//   bibliotherapy practice. Cached per (user, ISO week-start) so we
//   don't re-pay the LLM cost on every weekly-digest re-render.
//
// Cold-start guard: when entries are too few (<3) or too sparse (<300
// total words), we return empty themes/books rather than fabricate a
// theme. Frontend hides the section in that case.

import { Router } from 'express';
import { JournalEntry } from '../models/JournalEntry.js';
import { Bookmark } from '../models/Bookmark.js';
import { WeeklyBrief } from '../models/WeeklyBrief.js';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, REFLECTION_VOICE, WEEKLY_BRIEF_SCHEMA } from '../lib/ai.js';

export const digest = Router();
digest.use(requireAuth);

// ISO week-start (Monday) as YYYY-MM-DD in UTC. Stable cache key.
function weekStartISO(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = x.getUTCDay() || 7; // Sunday → 7
  if (dow !== 1) x.setUTCDate(x.getUTCDate() - (dow - 1));
  return x.toISOString().slice(0, 10);
}

const COLD_START_MIN_ENTRIES = 3;
const COLD_START_MIN_WORDS = 300;
const ENTRY_LOOKBACK_DAYS = 14;


// ─── Reflection briefs (Journal + Nook) ──────────────────────────────────
//
// A concise paragraph at the top of the Journal and Nook pages, mirroring
// back what the body of writing / saving says about the reader. Cached and
// regenerated on a ROLLING seven-day cadence: re-woven once the brief ages
// past a week, the moment the reader adds new material (itemCount changes),
// when the voice/prompt version is bumped, or on ?refresh=1. Empty brief on
// cold start; the frontend hides the section.

// How much to feed the model. Generous enough to capture the body of work,
// capped so the prompt stays bounded.
const BRIEF_JOURNAL_LIMIT = 50;
const BRIEF_NOOK_LIMIT = 60;
const BRIEF_MIN_JOURNAL_ENTRIES = 3;
const BRIEF_MIN_JOURNAL_WORDS = 150;
const BRIEF_MIN_NOOK_ITEMS = 3;
// Rolling regeneration cadence and voice version. Bump BRIEF_PROMPT_VERSION
// whenever the prompt or voice changes so every reader re-weaves once.
const BRIEF_REGEN_DAYS = 7;
const BRIEF_PROMPT_VERSION = 1;

// Shared cache + generation flow. loader() returns { count, corpus } where
// corpus is the text handed to the model and count drives cold-start; it
// returns null to signal cold start. buildPrompt(corpus) returns the user
// prompt string.
async function serveWeeklyBrief({ req, res, kind, loader, buildPrompt }) {
  const userId = req.userId;
  const refresh = !!req.query.refresh;

  // One living row per (user, kind). Older calendar-week rows from the
  // previous caching scheme may exist; take the most recent and keep
  // updating it in place so we never accumulate new rows.
  const existing = await WeeklyBrief.findOne({ userId, kind }).sort({ updatedAt: -1 });

  let loaded;
  try {
    loaded = await loader(userId);
  } catch (err) {
    console.error(`[digest/${kind}-brief] load failed:`, err);
    return res.status(500).json({ error: 'Failed to read your records' });
  }
  const itemCount = loaded ? loaded.count : 0;

  // Serve the cached brief unless it has aged past a week, the reader has
  // added material since, the voice changed, or a refresh was asked for.
  const stamp = existing && (existing.generatedAt || existing.updatedAt);
  const ageMs = stamp ? Date.now() - new Date(stamp).getTime() : Infinity;
  const fresh = existing
    && !refresh
    && existing.promptVersion === BRIEF_PROMPT_VERSION
    && ageMs < BRIEF_REGEN_DAYS * 86400000
    && existing.itemCount === itemCount;
  if (fresh) {
    return res.json({ brief: existing.brief, itemCount: existing.itemCount, generatedAt: stamp, cached: true });
  }

  // Persist a result onto the living row (reusing its weekStart anchor) or
  // create the first row for this reader.
  const save = async (brief) => {
    const now = new Date();
    if (existing) {
      await WeeklyBrief.updateOne(
        { _id: existing._id },
        { $set: { brief, itemCount, generatedAt: now, promptVersion: BRIEF_PROMPT_VERSION } },
      );
    } else {
      await WeeklyBrief.create({
        userId, kind, weekStart: weekStartISO(), brief, itemCount,
        generatedAt: now, promptVersion: BRIEF_PROMPT_VERSION,
      });
    }
    return now;
  };

  // Cold start: too little written/saved to read honestly. Cache an empty
  // brief (with the current count) so it re-weaves the moment they cross
  // the threshold, and the frontend stops asking meanwhile.
  if (!loaded) {
    const generatedAt = await save('');
    return res.json({ brief: '', itemCount, generatedAt, cached: false });
  }

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: 'system', content: HEARTH_VOICE },
        { role: 'user', content: buildPrompt(loaded.corpus) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'weekly_brief', strict: true, schema: WEEKLY_BRIEF_SCHEMA },
      },
    });
    const text = completion.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'Empty response from AI service' });
    const data = JSON.parse(text);
    const brief = (data.brief || '').trim();

    const generatedAt = await save(brief);
    res.json({ brief, itemCount, generatedAt, cached: false });
  } catch (err) {
    console.error(`[digest/${kind}-brief]`, err);
    res.status(500).json({ error: 'Failed to compute brief', detail: err.message });
  }
}

// ── GET /api/digest/journal-brief ─────────────────────────────────────
digest.get('/journal-brief', async (req, res) => {
  await serveWeeklyBrief({
    req, res, kind: 'journal',
    loader: async (userId) => {
      const entries = await JournalEntry.find({ userId })
        .sort({ createdAt: -1 })
        .limit(BRIEF_JOURNAL_LIMIT)
        .lean();
      const totalWords = entries.reduce((sum, e) => {
        const t = (e.body || '').trim();
        return sum + (t ? t.split(/\s+/).length : 0);
      }, 0);
      if (entries.length < BRIEF_MIN_JOURNAL_ENTRIES || totalWords < BRIEF_MIN_JOURNAL_WORDS) return null;
      const corpus = entries.map((e, i) => {
        const when = new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const body = (e.body || '').trim().replace(/\s+/g, ' ').slice(0, 700);
        return `Entry ${i + 1} (${when}${e.mood ? ', mood: ' + e.mood : ''}${e.promptTitle ? ', prompt: ' + e.promptTitle : ''}):\n${body}`;
      }).join('\n\n---\n\n');
      return { count: entries.length, corpus };
    },
    buildPrompt: (corpus) => `A reader has been keeping a journal in Hearth. Below are their entries, most recent first.

"""
${corpus}
"""

Read across all of them and write ONE short paragraph, two or three sentences, that mirrors back what has been on their mind. It will be read on a phone, so keep it brief and easy to take in at a glance: choose the one or two truest threads rather than naming everything. Touch what soothes them, or what they return to with gratitude, or the weather of their moods, whichever is most alive in the writing. Make it specific to what they actually wrote, so they would read it and feel known.

${REFLECTION_VOICE}

If the entries are too few or too scattered to say anything true, return an empty string rather than inventing a thread.

Return JSON matching the schema.`,
  });
});

// ── GET /api/digest/nook-brief ────────────────────────────────────────
digest.get('/nook-brief', async (req, res) => {
  await serveWeeklyBrief({
    req, res, kind: 'nook',
    loader: async (userId) => {
      const items = await Bookmark.find({ userId })
        .sort({ createdAt: -1 })
        .limit(BRIEF_NOOK_LIMIT)
        .lean();
      if (items.length < BRIEF_MIN_NOOK_ITEMS) return null;
      const corpus = items.map((b, i) => {
        const bits = [b.kind, b.title && `"${b.title}"`, b.source && `by ${b.source}`].filter(Boolean).join(' · ');
        const note = (b.excerpt || '').trim().replace(/\s+/g, ' ').slice(0, 200);
        return `${i + 1}. ${bits}${note ? `\n   ${note}` : ''}`;
      }).join('\n');
      return { count: items.length, corpus };
    },
    buildPrompt: (corpus) => `A reader has been saving things to their Nook in Hearth: songs, poems, books, and articles they wanted to keep close. Below is what they have saved, most recent first.

"""
${corpus}
"""

Write ONE short paragraph, two or three sentences, that reflects what this collection says about what matters to them right now. It will be read on a phone, so keep it brief and easy to take in at a glance: name the one clearest thread, the texture they keep reaching for, rather than cataloguing the shelf. Make it specific and true, something they would recognise.

${REFLECTION_VOICE}

If there is too little here to read honestly, return an empty string.

Return JSON matching the schema.`,
  });
});
