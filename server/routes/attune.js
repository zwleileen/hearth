import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, ATTUNE_SCHEMA } from '../lib/ai.js';
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

// Preference vocabularies. Mirror the AttuneEntry schema enums and the
// frontend chips. Validation here keeps the prompt-injection block clean.
const GENRE_VALUES = ['any', 'folk', 'classical', 'jazz', 'soul', 'electronic', 'indie', 'hiphop', 'world'];
const VOCALS_VALUES = ['either', 'with', 'without'];

// Map enum → human-readable phrase the model can read. The "any" /
// "either" values resolve to null so we can skip the line entirely
// rather than instruct the model with a no-op.
const GENRE_PHRASE = {
  any: null,
  folk: 'folk, singer-songwriter, or contemporary acoustic',
  classical: 'classical, modern classical, or chamber music',
  jazz: 'jazz, in any of its eras',
  soul: 'soul, R&B, or related vocal traditions',
  electronic: 'electronic, ambient, or contemporary instrumental',
  indie: 'indie, alt-rock, or art-rock',
  hiphop: 'hip-hop or contemporary rap',
  world: 'music from outside the Anglophone canon (Brazilian, African, Latin, Asian traditions, etc.)',
};
const VOCALS_PHRASE = {
  either: null,
  with: 'songs that have a clear vocal lead; no purely instrumental pieces',
  without: 'instrumental pieces only; no vocals or spoken-word',
};

function buildPreferenceBlock(prefs) {
  const lines = [];
  const genreLine = GENRE_PHRASE[prefs.genre];
  const vocalsLine = VOCALS_PHRASE[prefs.vocals];
  if (!genreLine && !vocalsLine) return '';
  lines.push('');
  lines.push('The reader has set these preferences for the music in this reading. These are hard constraints, not suggestions:');
  if (genreLine) lines.push(`  Genre: ${genreLine}.`);
  if (vocalsLine) lines.push(`  Vocals: ${vocalsLine}.`);
  lines.push('Every song you recommend MUST satisfy these. Choose the register honestly within those bounds, then pick titles that meet both the register and the preferences. If the preferences narrow the field hard enough that the obvious register answer is no longer available, find the corner of that genre/vocal space that still meets the register honestly.');
  return lines.join('\n');
}

// ── POST /api/attune ──────────────────────────────────────────────────
// Generate a reading for the user's current mood. After success, save
// the entry as a logbook record and use the most recent entries to
// nudge the next call away from familiar artists/poets.
attune.post('/', async (req, res) => {
  const userId = req.user._id;
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
  const prefs = {
    genre: GENRE_VALUES.includes(genre) ? genre : 'any',
    vocals: VOCALS_VALUES.includes(vocals) ? vocals : 'either',
  };
  const preferenceBlock = buildPreferenceBlock(prefs);

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

  const diversityBlock = (() => {
    if (recentArtists.length === 0 && recentPoets.length === 0) return '';
    const lines = [];
    lines.push('');
    lines.push('Recently recommended to this reader (across their last few readings):');
    if (recentArtists.length > 0) {
      lines.push(`  Artists: ${recentArtists.join(', ')}`);
    }
    if (recentPoets.length > 0) {
      lines.push(`  Poets: ${recentPoets.join(', ')}`);
    }
    if (recentRegisters.length > 0) {
      lines.push(`  Registers used: ${recentRegisters.join(', ')}`);
    }
    lines.push('');
    lines.push('Treat this list as a strong signal to look elsewhere unless the current mood specifically calls for one of these. The reader is not well-served by hearing the same names every time. Go to a different corner of the canon when the texture allows.');
    return lines.join('\n');
  })();

  const userPrompt = `A Hearth reader has shared how they're feeling, in their own words:

"""
${mood.trim()}
"""

Read the texture of what they shared, then commit to a register before you pick titles. Different moods deserve different registers. A celebratory mood asks for kinetic music, not introspective folk. A grieving mood asks for music that holds silence, not music about grief. A restless mood asks for sound that rides the edge with them. Match the register first; the titles flow from there.

Open with a moodSummary: a quiet, two- or three-sentence reflection that names what you're hearing in their words. No advice. No fixing. Just a clear seeing.

Then state the register: 3 to 6 lowercase words naming the texture this mood asks for. Examples: "holding silence", "kinetic celebration", "tender and warm", "restless and alive", "sitting with weight", "awake and walking out the door". This register MUST shape every recommendation that follows. The register tells you which corner of the reference points to draw from; do not pull artists from a register that does not match the mood.

The register choice is the most important choice in this reading. If the mood is celebratory or kinetic, the songs must be celebratory or kinetic, not introspective folk under any banner. If the mood is restless, the songs must ride that edge, not pull toward stillness. If the mood is tender or warm, draw from soul, jazz, classic R&B; do not default to melancholic indie folk because it is familiar. Match the register honestly.${preferenceBlock}${diversityBlock}

Recommend exactly three songs and three poems that meet this register specifically. Pieces with genuine craft and depth that match the texture, not just the surface topic. Each "why" should be brief, specific, and grounded, citing relevant research on music or reading and mood when credible (without inventing studies).

For each poem, prefer to include the full text inline ONLY when the poem is unambiguously in the public domain (typically pre-1929 in the US; classical translations; Whitman, Dickinson, early Frost, Hopkins, Tennyson, Donne, Yeats early work, etc.) AND you know it verbatim. Reproduce line breaks accurately using \\n. NEVER paraphrase or reconstruct a poem from memory; misquoting a poem is worse than linking out to it. When in doubt, leave the text field as an empty string and provide a url to a reputable source instead (poetryfoundation.org, poets.org, the poet's own page, the publisher). At least one of the two fields (text or url) must be non-empty for every poem.

Books are no longer part of this reading. Don't include them.

Return the result as JSON matching the schema.`;

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  let data;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      // Temperature 0.9 + frequency_penalty 0.4 open up the register
      // space the prompt now invites. The bigger anti-convergence lever
      // is the diversityBlock above, which feeds the user's recent
      // history back into the prompt so the model has concrete names
      // to avoid rather than relying on temperature alone.
      temperature: 0.9,
      frequency_penalty: 0.4,
      messages: [
        { role: 'system', content: HEARTH_VOICE },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'attune_response',
          strict: true,
          schema: ATTUNE_SCHEMA,
        },
      },
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) {
      return res.status(502).json({ error: 'Empty response from AI service' });
    }
    data = JSON.parse(text);
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
  const userId = req.user._id;
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
  const userId = req.user._id;
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
