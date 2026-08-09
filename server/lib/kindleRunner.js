// server/lib/kindleRunner.js
//
// Single source of truth for the Kindle call (+ one corrective retry).
// Used by the production route and any offline simulator so both run
// the same logic.
//
// The retry exists because the load-bearing parts of a session (the
// companion must be a named figure with a real turning; the widening
// must pose an answerable question) occasionally come back thin under
// strict JSON mode. One retry with the gap named resolves it.

import { MODEL, SESSION_VOICE, KINDLE_SESSION_SCHEMA, KINDLE_TURNING_SCHEMA, KINDLE_RESEEING_SCHEMA } from './ai.js';
import { buildKindleSessionPrompt, buildKindleTurningPrompt, buildKindleReseeingPrompt } from './kindlePrompt.js';

// Temperature. The old single value of 0.85 was a creativity setting
// applied to the whole session including the seeing, which is the one
// movement where being inventive is a defect: if the reflection of what
// someone just said is embellished, they do not feel met, and nothing
// after that lands. Variety is wanted in the mirror, not in the mirror's
// accuracy. Since one call produces both, we sit at 0.7: still varied
// enough that six sessions do not converge on the same figure (the
// companion-diversity block does that work), tighter on the reflection.
const SESSION_TEMPERATURE = 0.7;
// The re-seeing and the closing turning both work directly from the
// reader's own words, so they want accuracy over invention.
const CLOSE_TEMPERATURE = 0.6;

async function callModel(client, messages, schema, name, temperature = SESSION_TEMPERATURE) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature,
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: { name, strict: true, schema },
    },
  });
  const text = completion.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI service');
  return JSON.parse(text);
}

// What makes a session too thin to ship. Returns a correction string,
// or null if the session is whole.
function sessionGaps(data) {
  const parts = [];
  if (!data?.companion?.name?.trim()) parts.push('The companion has no name. Name a real person or a character from a named work who faced this predicament or heavier.');
  if (!data?.companion?.turning?.trim()) parts.push('The companion needs an honest account of how they found or held meaning, not a vague silhouette.');
  if (!data?.widening?.question?.trim()) parts.push('The widening must pose one open question the reader can answer in a sentence.');
  if (!data?.seeing?.trim()) parts.push('The seeing must reflect what the reader actually said, two or three sentences, before anything else moves.');
  return parts.length ? parts.join(' ') : null;
}

// Generate the opening session. Returns { data, retried }.
export async function generateKindleSession(client, { feeling, diversity, knowing } = {}) {
  const userPrompt = buildKindleSessionPrompt({ feeling, diversity, knowing });
  const baseMessages = [
    { role: 'system', content: SESSION_VOICE },
    { role: 'user', content: userPrompt },
  ];

  let data = await callModel(client, baseMessages, KINDLE_SESSION_SCHEMA, 'kindle_session');
  let retried = false;

  const gaps = sessionGaps(data);
  if (gaps) {
    retried = true;
    data = await callModel(
      client,
      [
        ...baseMessages,
        { role: 'assistant', content: JSON.stringify(data) },
        { role: 'user', content: `${gaps} Keep everything else as it is; only repair what is named above. Stay in Hearth's voice.` },
      ],
      KINDLE_SESSION_SCHEMA,
      'kindle_session',
    );
  }

  return { data, retried };
}

// Generate the follow-up turning after the reader answers the question.
// No retry loop needed here; the shape is simpler and self-contained.
export async function generateKindleTurning(client, { feeling, session, reply } = {}) {
  const userPrompt = buildKindleTurningPrompt({ feeling, session, reply });
  const data = await callModel(
    client,
    [
      { role: 'system', content: SESSION_VOICE },
      { role: 'user', content: userPrompt },
    ],
    KINDLE_TURNING_SCHEMA,
    'kindle_turning',
    CLOSE_TEMPERATURE,
  );
  return { data };
}

// Re-see the reader after they say the opening seeing missed them.
// Returns only the corrected naming and seeing; the rest of the session
// stands. Kept deliberately cheap: one call, one small schema.
export async function generateKindleReseeing(client, { feeling, session, correction } = {}) {
  const userPrompt = buildKindleReseeingPrompt({ feeling, session, correction });
  const data = await callModel(
    client,
    [
      { role: 'system', content: SESSION_VOICE },
      { role: 'user', content: userPrompt },
    ],
    KINDLE_RESEEING_SCHEMA,
    'kindle_reseeing',
    CLOSE_TEMPERATURE,
  );
  return { data };
}

// ── Acute-distress backstop ───────────────────────────────────────────
// Moved to server/lib/care.js so every free-text surface (Carry, the
// journal, Attune) shares one detector and one set of real, region-aware
// crisis lines. Re-exported here so existing importers keep working.
export { detectDistress, resourcesFor, careBlockFor, regionFromTimeZone, CARE_RESOURCES } from './care.js';
