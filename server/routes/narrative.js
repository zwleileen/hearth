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
import { AttuneEntry } from '../models/AttuneEntry.js';
import { MeaningNarrative } from '../models/MeaningNarrative.js';

export const narrative = Router();
narrative.use(requireAuth);

const REGEN_DAYS = 7;
// A row of the glance is a flat declarative sentence about someone's own
// life, printed on their home screen, and it needs its own evidence.
// Asking the model for that does not work: given seven Receive lines and
// nothing else, it invented a Give row in four runs out of four and a
// Carry row in four out of four, honesty instruction and all. So the
// floor is enforced in code below, after the model answers. Two lines is
// enough to be a pattern and few enough to see yourself early.
//
// This replaced a single global MIN_SOURCES, which was the wrong shape
// twice over: it made a reader with six Receive lines and no Give lines
// wait for nothing, and then handed them an invented Give row the moment
// they crossed it.
const ROW_MIN = 2;
// Bump when the prompt or voice changes so every reader re-weaves once
// into the new voice rather than waiting out their cache.
const PROMPT_VERSION = 2;
// Recent-window caps. Bound the corpus so the prompt stays a constant
// size no matter how long someone has used Hearth — recency over volume.
const RECENT_LOGS = 40;
const RECENT_SESSIONS = 8;
const RECENT_MOODS = 12;
const AVENUE_WORD = { give: 'Give', receive: 'Receive', carry: 'Carry' };
// The three rows of the glance. One list, used by both the weave (to
// decide which affirmations still stand) and the PATCH handler.
const ROWS = ['give', 'receive', 'carry'];

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

  // Two different quantities, and conflating them was a bug.
  //
  // `logs` and `sessions` are the WINDOW that actually gets read: bounded,
  // so the prompt stays a constant size however long someone has used
  // Hearth. `total` is the cache key, and it must count EVERYTHING they
  // have kept. These used to be the same number, which meant that once a
  // reader passed RECENT_LOGS + RECENT_SESSIONS the total pinned at its
  // ceiling of 48, `cached.sourceCount === total` was true forever, and
  // the "there is something new to weave" trigger never fired again. The
  // only survivor was the seven-day age check. It failed silently, and it
  // failed the most committed readers first: the people keeping the most
  // were the people whose narrative stopped answering them.
  let logs = [], sessions = [], moods = [], total = 0;
  try {
    let logCount = 0, sessionCount = 0;
    [logs, sessions, moods, logCount, sessionCount] = await Promise.all([
      MeaningLog.find({ userId }).sort({ createdAt: -1 }).limit(RECENT_LOGS).lean(),
      KindleSession.find({ userId }).sort({ createdAt: -1 }).limit(RECENT_SESSIONS).lean(),
      // Attune was the one surface a reader could use constantly and
      // never once appear in their own narrative: seventeen sessions,
      // every one of them invisible here. `mood` is what they typed
      // about their own state, in the first person, and it is the same
      // kind of material as the feeling brought to a Carry session,
      // which this weave has always read. Reading one and not the other
      // was an oversight, not a doctrine.
      //
      // Only `mood`. Never `moodSummary`, the songs or the poems: those
      // are Hearth's words about them, and the same exclusion applies
      // here as to a session's mirror.
      AttuneEntry.find({ userId }).sort({ createdAt: -1 }).limit(RECENT_MOODS).select('mood').lean(),
      MeaningLog.countDocuments({ userId }),
      KindleSession.countDocuments({ userId }),
    ]);
    total = logCount + sessionCount;
  } catch (err) {
    console.error('[narrative] load failed:', err);
    return res.status(500).json({ error: 'Failed to read your records' });
  }

  // Cache: return as-is unless they have kept something new since the
  // last weave, it has aged past a week, the voice changed, or a refresh
  // was asked for. `total` counts everything, so keeping one more line
  // always re-weaves, however long the reader's history is.
  const cached = await MeaningNarrative.findOne({ userId });
  const cachedRows = {
    give: cached?.give || '', receive: cached?.receive || '',
    carry: cached?.carry || '', threads: cached?.threads || [],
  };
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

  // What each row is allowed to be said on. A row is grounded in the
  // reader's own lines for that avenue, and Carry additionally in the
  // sessions they brought, which is material they wrote about what they
  // hold. Attune moods deliberately ground nothing: they enrich the
  // reading but they are states someone arrived in, not evidence of how
  // they give, what moves them, or how they carry it.
  const evidence = {
    give: logs.filter((l) => l.avenue === 'give').length,
    receive: logs.filter((l) => l.avenue === 'receive').length,
    carry: logs.filter((l) => l.avenue === 'carry').length + sessions.length,
  };
  const grounded = ROWS.filter((r) => evidence[r] >= ROW_MIN);

  // Cold start: nothing can be said honestly about any row yet. An empty
  // narrative is not a failure state here, it is the truthful one, and
  // the screen turns it into an invitation naming what is still missing.
  if (grounded.length === 0) {
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
      // The question each line answers, because stripped of it the act
      // and its subject are indistinguishable. "Yong, for always being
      // the open hearted, generous optimist" answers a gratitude-letter
      // prompt: the giving is the writing, the description is of Yong.
      // Read bare it says she gives open-hearted optimism, and that
      // leaked into her Give row in two runs out of six. Shown with the
      // question, none out of six.
      logs.map((l) => {
        const asked = (l.prompt || '').trim();
        const who = (l.forWhom || '').trim();
        const about = who ? ` (about ${who})` : '';
        const head = `  - [${AVENUE_WORD[l.avenue] || 'note'}]${about}`;
        return asked ? `${head} in answer to "${asked}": ${l.text}` : `${head} ${l.text}`;
      }).join('\n'));
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
  if (moods.length) {
    const lines = moods.map((m) => clip(m.mood)).filter(Boolean);
    if (lines.length) {
      parts.push('How they have described their own state when they came for music and words, in their own words. Like the burdens above, this is what they were carrying at the time, NOT what gives them meaning:\n' +
        lines.map((l) => `  - ${l}`).join('\n'));
    }
  }
  const corpus = parts.join('\n\n');

  // CONTINUITY. A self-portrait that is re-worded every week is not a
  // clearer sense of anything, and the weave used to start from scratch
  // every time. Six runs over the same reader's records agreed on the
  // reading every time and on the wording almost never: the same person
  // came back as "financial weight, doubt, and a faint flame", then
  // "money fears, failure worries, a faint but stubborn hope", then
  // "heavy hopes about work, worth, and money". Nothing about her had
  // changed. Only the sentence had.
  //
  // That churn is not cosmetic. It is the difference between a reader
  // recognising themselves and being introduced to a stranger with their
  // biography, and it quietly costs them their affirmations too: a row
  // whose words change is a row they have to be asked about again, so
  // constant rewording means never being able to say "yes, that's it"
  // and have it stay said.
  //
  // So the previous reading goes in, with instructions to keep the words
  // that still fit. Only Hearth's own previous rows: the reader's own
  // wording is theirs and must never come back as Hearth's reading of
  // them.
  // Which rows this reader has actually earned. Said in the prompt so
  // the prose does not claim what the rows cannot, and enforced in code
  // once the answer is back, because the prompt alone does not hold:
  // with no Give material at all it wrote a Give row four times in four.
  const ungrounded = ROWS.filter((r) => !grounded.includes(r));
  const rowRule = ungrounded.length === 0 ? '' : [
    '',
    'This reader has not yet kept enough about ' + ungrounded.join(' or ').toUpperCase() + ' for that to be said about them.',
    'Return those fields as an empty string, and never reach into the other avenues to fill them.',
    'Keep the narrative itself to what can honestly be said about ' + grounded.join(' and ').toUpperCase() + '.',
    'An empty row is the honest answer, and they will see an invitation in its place.',
    '',
  ].join('\n');

  const prior = [
    (cachedRows.give || '') && `  how they give: ${cachedRows.give}`,
    (cachedRows.receive || '') && `  what they receive: ${cachedRows.receive}`,
    (cachedRows.carry || '') && `  what they carry: ${cachedRows.carry}`,
    (cachedRows.threads || []).length ? `  threads: ${cachedRows.threads.join(', ')}` : '',
  ].filter(Boolean).join('\n');
  const continuity = prior ? `
This reader has been read before. Last time it came out as:

${prior}

Take each line above and test it against what they actually brought, before you decide anything. If their own material does not support a line, replace it: a line that no longer fits, or never fitted, must go, and the fact that it is the previous wording is never a reason to keep it. Accuracy comes first, always.

Only then, for each line the material DOES still support: keep that wording exactly as it stands, word for word, rather than saying the same thing in fresh words. Re-wording a reading that has not changed costs this reader the sense of being recognised rather than re-guessed.
` : '';

  const userPrompt = `A Hearth reader has been noticing, writing, and keeping what moves them. Read across everything below and reflect back, gently, the shape of THEIR unique sense of meaning as it stands this season.

"""
${corpus}
"""

Write a "meaning narrative": two to four sentences that mirror how this person makes meaning, framed through how they GIVE (what they offer), RECEIVE (what moves them), and CARRY (what they hold). Notice the balance among the three, and the through-lines that repeat. Use their own words where you can. This is a provisional reading of where they are now, not a verdict and never a personality type; write it as theirs to recognise or revise.

Reflect back only what THEY brought and said. If a person, character, metaphor, image, or parable appears in their words, it was a mirror offered to them in a session, not a thing they love or draw meaning from; never fold it into what they give, receive, or carry. What grounds them and moves them are the real, concrete things of their own life.

${REFLECTION_VOICE}

Then distil short phrases (three to ten words each, lowercase, no full stop) for the glance: how they GIVE, what they RECEIVE, what they CARRY. These are the short form a reader sees first; the narrative is the longer read behind it.
${rowRule}

Then name up to three threads: short phrases (two to four words) for the through-lines of their meaning, in their register.

If there is genuinely too little to read honestly, return everything empty rather than inventing.
${continuity}
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
    // The floor, enforced here rather than trusted to the prompt above.
    // A row without its own evidence is blanked whatever came back, so
    // the worst case is a reader seeing an invitation instead of a
    // sentence, rather than a confident claim about a part of their life
    // they have told Hearth nothing about.
    const keepRow = (name, value) => (grounded.includes(name) ? (value || '').trim() : '');
    const give = keepRow('give', data.give);
    const receive = keepRow('receive', data.receive);
    const carry = keepRow('carry', data.carry);
    const threads = Array.isArray(data.threads) ? data.threads.filter(Boolean).slice(0, 3) : [];
    const generatedAt = new Date();

    // Note the $set list: it never touches `own`. A re-weave may replace
    // Hearth's reading; it must never replace what the reader wrote
    // about their own life.
    //
    // `affirmed` is different, and leaving it alone was wrong. "Yes,
    // that's it" is said about a PARTICULAR sentence, not about the row
    // forever. When a re-weave changes a row the reader has not written
    // themselves, the old affirmation does not transfer: carrying it
    // over prints "You said this is right" under a sentence they have
    // never read, which is Hearth asserting the reader endorsed a claim
    // about their own life that they were never shown. That is the exact
    // authority inversion the narrative exists to avoid
    // (BRAND_BRIEF 5.6, 6.3), and it is worse than a stale flag: it
    // launders a generated line as the reader's own judgement.
    //
    // So an unchanged row keeps its affirmation, and a row the reader
    // owns keeps it too, because the sentence on screen is still theirs.
    // A row that changed underneath them goes back to asking.
    const fields = { userId, narrative: narrativeText, give, receive, carry, threads, sourceCount: total, generatedAt, promptVersion: PROMPT_VERSION };
    const nextRows = { give, receive, carry };
    for (const key of ROWS) {
      const ownsIt = ((cached?.own?.[key] || '').trim()).length > 0;
      const changed = (cached?.[key] || '') !== nextRows[key];
      if (!ownsIt && changed) fields[`affirmed.${key}`] = false;
    }
    const saved = await MeaningNarrative.findOneAndUpdate(
      { userId },
      { $set: fields },
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
const OWN_MAX = 140;

narrative.patch('/', async (req, res) => {
  const { row, text, affirmed } = req.body || {};
  if (!ROWS.includes(row)) {
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
