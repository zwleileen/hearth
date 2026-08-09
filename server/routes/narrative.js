// server/routes/narrative.js
//
// Your Meaning Narrative: the capstone synthesis. Reads only the two
// signals that robustly shape a person's sense of meaning — the lines
// they keep in answer to the meaning of the moment (meaning logs) and
// the heavier feelings they bring to a Carry session (Kindle) — and
// reflects back, in voice, the shape of their meaning, framed through
// give / receive / carry.
//
// Deliberately NOT everything they keep: journal entries and Nook saves
// are noisier proxies and grow without bound, which would let the prompt
// (and cost, and drift) balloon over time. We read a recent window of
// the two high-signal sources instead, so the input stays flat as a
// reader's history grows.
//
//   GET   /api/narrative      cached; regenerated when inputs grow, when
//                             it ages past a week, or on ?refresh=1.
//   PATCH /api/narrative      the reader affirms a row, or replaces it
//                             in their own words. Their words win, and
//                             a re-weave never overwrites them.

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, REFLECTION_VOICE, MEANING_NARRATIVE_SCHEMA } from '../lib/ai.js';
import { MeaningLog } from '../models/MeaningLog.js';
import { KindleSession } from '../models/KindleSession.js';
import { MeaningNarrative } from '../models/MeaningNarrative.js';

export const narrative = Router();
narrative.use(requireAuth);

const MIN_SOURCES = 3;
const REGEN_DAYS = 7;
// Bump when the prompt or voice changes so every reader re-weaves once
// into the new voice rather than waiting out their cache.
const PROMPT_VERSION = 2;
// Recent-window caps. Bound the corpus so the prompt stays a constant
// size no matter how long someone has used Hearth — recency over volume.
const RECENT_LOGS = 40;
const RECENT_SESSIONS = 8;
const AVENUE_WORD = { give: 'Give', receive: 'Receive', carry: 'Carry' };

// The reader's own wording always wins on render, and a row they have
// written themselves is never re-generated over. Everything downstream
// (Home's glance, the full narrative page) reads through this, so there
// is exactly one place where authorship is decided.
function withAuthorship(row, doc) {
  const own = doc?.own || {};
  const affirmed = doc?.affirmed || {};
  return {
    ...row,
    give: (own.give || '').trim() || row.give,
    receive: (own.receive || '').trim() || row.receive,
    carry: (own.carry || '').trim() || row.carry,
    own: { give: own.give || '', receive: own.receive || '', carry: own.carry || '' },
    affirmed: { give: !!affirmed.give, receive: !!affirmed.receive, carry: !!affirmed.carry },
  };
}

narrative.get('/', async (req, res) => {
  const userId = req.userId;
  const refresh = !!req.query.refresh;

  let logs = [], sessions = [];
  try {
    [logs, sessions] = await Promise.all([
      MeaningLog.find({ userId }).sort({ createdAt: -1 }).limit(RECENT_LOGS).lean(),
      KindleSession.find({ userId }).sort({ createdAt: -1 }).limit(RECENT_SESSIONS).lean(),
    ]);
  } catch (err) {
    console.error('[narrative] load failed:', err);
    return res.status(500).json({ error: 'Failed to read your records' });
  }

  const total = logs.length + sessions.length;

  // Cache: return as-is unless the inputs have grown (something new to
  // weave), it has aged past a week, the voice changed, or a refresh was
  // asked for.
  const cached = await MeaningNarrative.findOne({ userId });
  const ageOk = cached?.generatedAt && (Date.now() - new Date(cached.generatedAt).getTime()) < REGEN_DAYS * 86400000;
  // A non-empty cache from before the give/receive/carry distillation
  // lacks those fields; treat it as stale so it re-weaves once.
  const hasShape = !cached?.narrative || cached?.give || cached?.receive || cached?.carry;
  const voiceOk = cached?.promptVersion === PROMPT_VERSION;
  if (cached && !refresh && cached.sourceCount === total && ageOk && hasShape && voiceOk) {
    return res.json(withAuthorship({
      narrative: cached.narrative, give: cached.give || '', receive: cached.receive || '', carry: cached.carry || '',
      threads: cached.threads || [], sourceCount: total, generatedAt: cached.generatedAt, cached: true,
    }, cached));
  }

  // Cold start: too little to read honestly. Cache the empty result.
  if (total < MIN_SOURCES) {
    await MeaningNarrative.findOneAndUpdate(
      { userId },
      { $set: { userId, narrative: '', give: '', receive: '', carry: '', threads: [], sourceCount: total, generatedAt: new Date() } },
      { upsert: true },
    );
    return res.json(withAuthorship({ narrative: '', give: '', receive: '', carry: '', threads: [], sourceCount: total, cached: false }, cached));
  }

  // Keep each free-text input bounded so one long entry can't dominate
  // the prompt (and so cost stays flat). Collapse whitespace for a clean read.
  const SESSION_TEXT_MAX = 400;
  const clip = (s) => {
    const t = (s || '').trim().replace(/\s+/g, ' ');
    return t.length > SESSION_TEXT_MAX ? t.slice(0, SESSION_TEXT_MAX) + '…' : t;
  };

  const parts = [];
  if (logs.length) {
    parts.push('Lines they have kept in answer to the meaning of the moment (newest first):\n' +
      logs.map((l) => `  - [${AVENUE_WORD[l.avenue] || 'note'}] ${l.text}`).join('\n'));
  }
  if (sessions.length) {
    // From a Carry session we read ONLY the reader's own words: the feeling
    // they brought, and, if they replied, what they said back. Never the
    // companion, mirror, metaphor, image, or turning the session offered
    // them. Those are Hearth's words, not theirs; folding them in makes the
    // synthesis mistake the app's images (e.g. "a stone laid by a mason")
    // for the reader's own sources of meaning.
    const blocks = sessions.map((s) => {
      const brought = clip(s.feeling);
      const said = clip(s.reply);
      if (!brought && !said) return '';
      const rows = [];
      if (brought) rows.push(`  - brought: ${brought}`);
      if (said) rows.push(`    and answered, in their own words: ${said}`);
      return rows.join('\n');
    }).filter(Boolean);
    if (blocks.length) parts.push('Heavier things they brought to a Carry session, in their own words. These are burdens they came to sit with, what they hold, not necessarily what gives them meaning:\n' + blocks.join('\n'));
  }
  const corpus = parts.join('\n\n');

  const userPrompt = `A Hearth reader has been noticing, writing, and keeping what moves them. Read across everything below and reflect back, gently, the shape of THEIR unique sense of meaning as it stands this season.

"""
${corpus}
"""

Write a "meaning narrative": two to four sentences that mirror how this person makes meaning, framed through how they GIVE (what they offer), RECEIVE (what moves them), and CARRY (what they hold). Notice the balance among the three, and the through-lines that repeat. Use their own words where you can. This is a provisional reading of where they are now, not a verdict and never a personality type; write it as theirs to recognise or revise.

Reflect back only what THEY brought and said. If a person, character, metaphor, image, or parable appears in their words, it was a mirror offered to them in a session, not a thing they love or draw meaning from; never fold it into what they give, receive, or carry. What grounds them and moves them are the real, concrete things of their own life.

${REFLECTION_VOICE}

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
    // Note the $set list: it never touches `own` or `affirmed`. A
    // re-weave may replace Hearth's reading; it must never replace what
    // the reader wrote about their own life.
    const saved = await MeaningNarrative.findOneAndUpdate(
      { userId },
      { $set: { userId, narrative: narrativeText, give, receive, carry, threads, sourceCount: total, generatedAt, promptVersion: PROMPT_VERSION } },
      { upsert: true, new: true },
    );
    res.json(withAuthorship({ narrative: narrativeText, give, receive, carry, threads, sourceCount: total, generatedAt, cached: false }, saved));
  } catch (err) {
    console.error('[narrative]', err);
    res.status(500).json({ error: 'Failed to weave your meaning', detail: err.message });
  }
});

// ── PATCH /api/narrative ──────────────────────────────────────────────
//
// The reader answers back. Two moves, both cheap and both local to one
// row (give / receive / carry):
//
//   { row: 'give', affirmed: true }      yes, that's it
//   { row: 'give', text: 'in my words' } no, let me say it
//   { row: 'give', text: '' }            take mine away, use yours again
//
// No model call: this is the reader's own sentence, and running it
// through a model to be improved would defeat the entire point.
const ROWS = new Set(['give', 'receive', 'carry']);
const OWN_MAX = 140;

narrative.patch('/', async (req, res) => {
  const { row, text, affirmed } = req.body || {};
  if (!ROWS.has(row)) {
    return res.status(400).json({ error: 'row must be give, receive, or carry' });
  }

  const update = {};
  if (typeof text === 'string') {
    // A short phrase, matching the glance. Trimmed, never rewritten.
    update[`own.${row}`] = text.trim().slice(0, OWN_MAX);
    // Writing your own version is itself the strongest form of "this is
    // mine", so it affirms the row too.
    if (text.trim()) update[`affirmed.${row}`] = true;
  }
  if (typeof affirmed === 'boolean') {
    update[`affirmed.${row}`] = affirmed;
  }
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'nothing to change' });
  }

  try {
    const doc = await MeaningNarrative.findOneAndUpdate(
      { userId: req.userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json(withAuthorship({
      narrative: doc.narrative || '',
      give: doc.give || '', receive: doc.receive || '', carry: doc.carry || '',
      threads: doc.threads || [],
      sourceCount: doc.sourceCount || 0,
      generatedAt: doc.generatedAt,
      cached: true,
    }, doc));
  } catch (err) {
    console.error('[narrative] patch failed:', err);
    res.status(500).json({ error: 'Failed to keep your words' });
  }
});
