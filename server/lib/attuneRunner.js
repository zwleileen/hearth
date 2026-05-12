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

// Inspect a response for duplicate artists or duplicate poets.
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
  return { dupArtists, dupPoets };
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

  const dups = findDuplicates(data);
  if (dups.dupArtists.length > 0 || dups.dupPoets.length > 0) {
    retried = true;
    const parts = [];
    if (dups.dupArtists.length > 0) parts.push(`You returned the same artist twice in songs: ${dups.dupArtists.join(', ')}. Replace duplicates so all three songs are by three different artists.`);
    if (dups.dupPoets.length > 0) parts.push(`You returned the same poet twice in poems: ${dups.dupPoets.join(', ')}. Replace duplicates so all three poems are by three different poets.`);
    const correction = parts.join(' ') + ' Keep the register and the moodSummary as they are; only swap the duplicate(s) for different artists/poets that still serve the same register.';
    data = await callModel(client, [
      ...baseMessages,
      { role: 'assistant', content: JSON.stringify(data) },
      { role: 'user', content: correction },
    ]);
  }

  return { data, retried, preferencesUsed: prefs };
}
