// server/lib/attuneRunner.js
//
// Single source of truth for the Attune call+retry pipeline. Used by
// the production route and the offline simulator so both run the same
// logic and surface the same behaviour.
//
// The retry exists because prompt-level instructions alone aren't
// enough to keep the model from returning the same artist twice in
// one reading (it happens most when the iso-principle answer for a
// mood is dominated by a single artist, e.g. Bon Iver for quiet
// grief). One retry with the rejected response in context resolves
// it ~always.

import { MODEL, HEARTH_VOICE, ATTUNE_SCHEMA } from './ai.js';
import { buildAttuneUserPrompt, normalisePreferences } from './attunePrompt.js';

// Inspect a response for issues that warrant a single corrective
// retry: duplicate artists, duplicate poets, or wrong item counts.
// The exact-three enforcement lives here rather than in the schema
// because OpenAI's strict mode for structured outputs doesn't permit
// minItems / maxItems on arrays.
export function findDuplicates(data) {
  const dupArtists = [];
  const dupPoets = [];
  const seenA = new Map();
  for (const s of data?.songs || []) {
    const k = (s.artist || '').trim().toLowerCase();
    if (!k) continue;
    seenA.set(k, (seenA.get(k) || 0) + 1);
  }
  for (const [k, n] of seenA) if (n > 1) dupArtists.push(k);
  const seenP = new Map();
  for (const p of data?.poems || []) {
    const k = (p.poet || '').trim().toLowerCase();
    if (!k) continue;
    seenP.set(k, (seenP.get(k) || 0) + 1);
  }
  for (const [k, n] of seenP) if (n > 1) dupPoets.push(k);
  const songCount = Array.isArray(data?.songs) ? data.songs.length : 0;
  const poemCount = Array.isArray(data?.poems) ? data.poems.length : 0;
  return {
    dupArtists,
    dupPoets,
    songCountOff: songCount !== 3 ? songCount : null,
    poemCountOff: poemCount !== 3 ? poemCount : null,
  };
}

async function callModel(client, messages) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    frequency_penalty: 0.4,
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'attune_response', strict: true, schema: ATTUNE_SCHEMA },
    },
  });
  const text = completion.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI service');
  return JSON.parse(text);
}

// Generate one Attune reading. Handles the duplicate-artist retry
// internally. Caller passes a configured OpenAI client and the
// scenario inputs.
//
// Returns: { data, retried }
//   data    : the final reading
//   retried : boolean, true if the first response had duplicates
//             and we issued a correction call
export async function generateAttuneReading(client, { mood, preferences, diversity } = {}) {
  const prefs = normalisePreferences(preferences || {});
  const userPrompt = buildAttuneUserPrompt({ mood, preferences: prefs, diversity });

  const baseMessages = [
    { role: 'system', content: HEARTH_VOICE },
    { role: 'user', content: userPrompt },
  ];
  let data = await callModel(client, baseMessages);
  let retried = false;

  const issues = findDuplicates(data);
  const needsRetry = issues.dupArtists.length > 0
    || issues.dupPoets.length > 0
    || issues.songCountOff != null
    || issues.poemCountOff != null;

  if (needsRetry) {
    retried = true;
    const parts = [];
    if (issues.songCountOff != null) parts.push(`You returned ${issues.songCountOff} songs; you must return exactly three.`);
    if (issues.poemCountOff != null) parts.push(`You returned ${issues.poemCountOff} poems; you must return exactly three.`);
    if (issues.dupArtists.length > 0) parts.push(`You returned the same artist twice in songs: ${issues.dupArtists.join(', ')}. Replace duplicates so all three songs are by three different artists.`);
    if (issues.dupPoets.length > 0) parts.push(`You returned the same poet twice in poems: ${issues.dupPoets.join(', ')}. Replace duplicates so all three poems are by three different poets.`);
    const correction = parts.join(' ') + ' Keep the register and the moodSummary as they are; only swap the items needed to satisfy the rules above. The result must have exactly three songs by three different artists and exactly three poems by three different poets.';
    data = await callModel(client, [
      ...baseMessages,
      { role: 'assistant', content: JSON.stringify(data) },
      { role: 'user', content: correction },
    ]);
  }

  // Hard guarantee on the way out: even if the retry still returned
  // a wrong count (rare), truncate to three so the client never sees
  // a malformed reading. We don't pad upward; if the model returned
  // fewer than three after retry, the client gets fewer (better than
  // making up entries).
  if (Array.isArray(data?.songs) && data.songs.length > 3) data.songs = data.songs.slice(0, 3);
  if (Array.isArray(data?.poems) && data.poems.length > 3) data.poems = data.poems.slice(0, 3);

  return { data, retried, preferencesUsed: prefs };
}
