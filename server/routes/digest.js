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
import { WeeklyBibliotherapy } from '../models/WeeklyBibliotherapy.js';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, BIBLIOTHERAPY_SCHEMA } from '../lib/ai.js';

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

digest.get('/bibliotherapy', async (req, res) => {
  const ws = weekStartISO();
  const refresh = !!req.query.refresh;

  if (!refresh) {
    const cached = await WeeklyBibliotherapy.findOne({ userId: req.userId, weekStart: ws });
    if (cached) {
      return res.json({
        weekStart: ws,
        reflection: cached.reflection,
        themes: cached.themes,
        books: cached.books,
        entryCount: cached.entryCount,
        cached: true,
      });
    }
  }

  // Fetch the last 14 days of entries for theme detection
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ENTRY_LOOKBACK_DAYS);
  const entries = await JournalEntry.find({
    userId: req.userId,
    createdAt: { $gte: cutoff },
  }).sort({ createdAt: -1 }).lean();

  const totalWords = entries.reduce((sum, e) => {
    const t = (e.body || '').trim();
    return sum + (t ? t.split(/\s+/).length : 0);
  }, 0);

  // Cold-start guard: not enough signal to do honest bibliotherapy.
  // We still cache the empty result so the frontend doesn't hammer
  // the endpoint waiting for entries to accumulate.
  if (entries.length < COLD_START_MIN_ENTRIES || totalWords < COLD_START_MIN_WORDS) {
    const empty = {
      userId: req.userId,
      weekStart: ws,
      reflection: '',
      themes: [],
      books: [],
      entryCount: entries.length,
    };
    await WeeklyBibliotherapy.findOneAndUpdate(
      { userId: req.userId, weekStart: ws },
      { $set: empty },
      { upsert: true, new: true },
    );
    return res.json({ ...empty, cached: false });
  }

  // Compose the entry summary for the LLM. Use body, mood, prompt title,
  // and date — enough texture to find a thread, not so much that the
  // model drowns in detail.
  const entrySummary = entries.map((e, i) => {
    const when = new Date(e.createdAt).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    const body = (e.body || '').trim().replace(/\s+/g, ' ').slice(0, 1200);
    return `Entry ${i + 1} (${when}${e.mood ? ', mood: ' + e.mood : ''}${e.promptTitle ? ', prompt: ' + e.promptTitle : ''}):\n${body}`;
  }).join('\n\n---\n\n');

  const userPrompt = `A Hearth reader has been writing in their journal over the last two weeks. Below are their entries, most recent first.

"""
${entrySummary}
"""

Read across all of them and find what threads through. You're looking for ONE or TWO themes that the writer is genuinely sitting with, in their own register. Not pop-psych labels ("anxiety", "self-care") but something concrete and specific to what THEY wrote, in voice. Examples of good theme names: "the slow goodbye", "rebuilding after a season of doubt", "noticing again", "what to do with anger", "small returns to the body", "an old friendship's quiet end".

If the entries are too varied, too sparse, or don't cohere around any thread, return empty arrays for themes and books. Don't fabricate a theme just to have one. An empty result is a true result, and the app handles it gracefully.

If you find one or two real themes, recommend 2 to 3 books that have a tradition of keeping company with readers in those exact places. Prefer literature, memoir, and essay over self-help. Bibliotherapy works through resonance, not prescription, so the books should meet the theme honestly rather than instruct toward a fix.

Voice rules:
- Write the reflection like a bookseller who knows this reader: warm, specific, no advice, no diagnosis
- Each book "why" should be 2 sentences. Ground in what the book actually does, not generic praise. Use the bookseller register: "this one keeps company with...", "her sentences slow you down precisely where you've been hurrying", "the book is honest about the weight without trying to lift it"
- Avoid prescriptive language: never "you should read" or "this will help"
- url is optional; include only when you can name a real publisher page, review, or essay about the book

Return JSON matching the schema.`;

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
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'bibliotherapy_response',
          strict: true,
          schema: BIBLIOTHERAPY_SCHEMA,
        },
      },
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'Empty response from AI service' });
    const data = JSON.parse(text);

    const result = {
      userId: req.userId,
      weekStart: ws,
      reflection: data.reflection || '',
      themes: Array.isArray(data.themes) ? data.themes : [],
      books: Array.isArray(data.books) ? data.books : [],
      entryCount: entries.length,
    };

    await WeeklyBibliotherapy.findOneAndUpdate(
      { userId: req.userId, weekStart: ws },
      { $set: result },
      { upsert: true, new: true },
    );

    res.json({ ...result, cached: false });
  } catch (err) {
    console.error('[digest/bibliotherapy]', err);
    res.status(500).json({ error: 'Failed to compute bibliotherapy', detail: err.message });
  }
});
