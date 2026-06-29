// server/routes/narrative.js
//
// Your Meaning Narrative: the capstone synthesis. Reads across everything
// the reader keeps (meaning-log lines, journal, Nook saves, Kindle
// sessions) and reflects back, in voice, the shape of their unique sense
// of meaning, framed through give / receive / carry.
//
//   GET /api/narrative        cached; regenerated when inputs grow, when
//                             it ages past a week, or on ?refresh=1.

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, MEANING_NARRATIVE_SCHEMA } from '../lib/ai.js';
import { MeaningLog } from '../models/MeaningLog.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { Bookmark } from '../models/Bookmark.js';
import { KindleSession } from '../models/KindleSession.js';
import { MeaningNarrative } from '../models/MeaningNarrative.js';

export const narrative = Router();
narrative.use(requireAuth);

const MIN_SOURCES = 3;
const REGEN_DAYS = 7;
const AVENUE_WORD = { give: 'Give', receive: 'Receive', carry: 'Carry' };

narrative.get('/', async (req, res) => {
  const userId = req.userId;
  const refresh = !!req.query.refresh;

  let logs = [], entries = [], saves = [], sessions = [];
  try {
    [logs, entries, saves, sessions] = await Promise.all([
      MeaningLog.find({ userId }).sort({ createdAt: -1 }).limit(80).lean(),
      JournalEntry.find({ userId }).sort({ createdAt: -1 }).limit(30).lean(),
      Bookmark.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      KindleSession.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);
  } catch (err) {
    console.error('[narrative] load failed:', err);
    return res.status(500).json({ error: 'Failed to read your records' });
  }

  const total = logs.length + entries.length + saves.length + sessions.length;

  // Cache: return as-is unless the inputs have grown (something new to
  // weave), it has aged past a week, or a refresh was asked for.
  const cached = await MeaningNarrative.findOne({ userId });
  const ageOk = cached?.generatedAt && (Date.now() - new Date(cached.generatedAt).getTime()) < REGEN_DAYS * 86400000;
  // A non-empty cache from before the give/receive/carry distillation
  // lacks those fields; treat it as stale so it re-weaves once.
  const hasShape = !cached?.narrative || cached?.give || cached?.receive || cached?.carry;
  if (cached && !refresh && cached.sourceCount === total && ageOk && hasShape) {
    return res.json({
      narrative: cached.narrative, give: cached.give || '', receive: cached.receive || '', carry: cached.carry || '',
      threads: cached.threads || [], sourceCount: total, generatedAt: cached.generatedAt, cached: true,
    });
  }

  // Cold start: too little to read honestly. Cache the empty result.
  if (total < MIN_SOURCES) {
    await MeaningNarrative.findOneAndUpdate(
      { userId },
      { $set: { userId, narrative: '', give: '', receive: '', carry: '', threads: [], sourceCount: total, generatedAt: new Date() } },
      { upsert: true },
    );
    return res.json({ narrative: '', give: '', receive: '', carry: '', threads: [], sourceCount: total, cached: false });
  }

  const parts = [];
  if (logs.length) {
    parts.push('Lines they have kept in answer to the meaning of the moment (newest first):\n' +
      logs.map((l) => `  - [${AVENUE_WORD[l.avenue] || 'note'}] ${l.text}`).join('\n'));
  }
  if (entries.length) {
    parts.push('Journal entries (most recent, trimmed):\n' +
      entries.slice(0, 12).map((e) => `  - ${e.mood ? '(' + e.mood + ') ' : ''}${(e.body || '').trim().replace(/\s+/g, ' ').slice(0, 220)}`).join('\n'));
  }
  if (saves.length) {
    parts.push('Saved to their Nook, what moves them:\n' +
      saves.slice(0, 24).map((b) => `  - ${b.kind}: "${b.title}"${b.source ? ' — ' + b.source : ''}`).join('\n'));
  }
  if (sessions.length) {
    const lines = sessions
      .map((s) => `${s.session?.feelingName || ''}${s.session?.companion?.name ? ' (met by ' + s.session.companion.name + ')' : ''}`.trim())
      .filter(Boolean);
    if (lines.length) parts.push('Heavier feelings they brought to a meaning session:\n' + lines.map((x) => `  - ${x}`).join('\n'));
  }
  const corpus = parts.join('\n\n');

  const userPrompt = `A Hearth reader has been noticing, writing, and keeping what moves them. Read across everything below and reflect back, gently, the shape of THEIR unique sense of meaning as it stands this season.

"""
${corpus}
"""

Write a "meaning narrative": two to four sentences in Hearth's voice that mirror how this person makes meaning, framed through how they GIVE (what they offer), RECEIVE (what moves them), and CARRY (what they hold). Notice the balance among the three, and the through-lines that repeat. Use their own register and, where it lands, their own words. This is a provisional reading of where they are now, not a verdict and never a personality type; write it as theirs to recognise or revise. No advice, no diagnosis, no flattery, no em dashes.

Then distil three short phrases (three to ten words each, lowercase, no full stop) for the glance: how they GIVE, what they RECEIVE, what they CARRY. These are the short form a reader sees first; the narrative is the longer read behind it.

Then name up to three threads: short phrases (two to four words) for the through-lines of their meaning, in their register.

If there is genuinely too little to read honestly, return everything empty rather than inventing.

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
      response_format: { type: 'json_schema', json_schema: { name: 'meaning_narrative', strict: true, schema: MEANING_NARRATIVE_SCHEMA } },
    });
    const text = completion.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'Empty response from AI service' });
    const data = JSON.parse(text);
    const narrativeText = (data.narrative || '').trim();
    const give = (data.give || '').trim();
    const receive = (data.receive || '').trim();
    const carry = (data.carry || '').trim();
    const threads = Array.isArray(data.threads) ? data.threads.filter(Boolean).slice(0, 3) : [];
    const generatedAt = new Date();
    await MeaningNarrative.findOneAndUpdate(
      { userId },
      { $set: { userId, narrative: narrativeText, give, receive, carry, threads, sourceCount: total, generatedAt } },
      { upsert: true },
    );
    res.json({ narrative: narrativeText, give, receive, carry, threads, sourceCount: total, generatedAt, cached: false });
  } catch (err) {
    console.error('[narrative]', err);
    res.status(500).json({ error: 'Failed to weave your meaning', detail: err.message });
  }
});
