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

import { MODEL, HEARTH_VOICE, KINDLE_SESSION_SCHEMA, KINDLE_TURNING_SCHEMA } from './ai.js';
import { buildKindleSessionPrompt, buildKindleTurningPrompt } from './kindlePrompt.js';

async function callModel(client, messages, schema, name) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.85,
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
export async function generateKindleSession(client, { feeling, diversity } = {}) {
  const userPrompt = buildKindleSessionPrompt({ feeling, diversity });
  const baseMessages = [
    { role: 'system', content: HEARTH_VOICE },
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
      { role: 'system', content: HEARTH_VOICE },
      { role: 'user', content: userPrompt },
    ],
    KINDLE_TURNING_SCHEMA,
    'kindle_turning',
  );
  return { data };
}

// ── Acute-distress backstop ───────────────────────────────────────────
// A cheap keyword scan that runs alongside the model's careFlag. We OR
// the two so the resources block shows even if the model misses the
// signal. Deliberately err toward showing help; a false positive costs
// the reader nothing but a gentle line, a false negative is the failure
// that matters. Word-boundary matched to avoid catching substrings
// ("therapist", "assist") that contain these letters.
const DISTRESS_PATTERNS = [
  /\bkill myself\b/i,
  /\bkilling myself\b/i,
  /\bend (?:it|my life|things)\b/i,
  /\b(?:want|going|plan) to die\b/i,
  /\bwant to be dead\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bself[-\s]?harm\b/i,
  /\bhurt(?:ing)? myself\b/i,
  /\bcut(?:ting)? myself\b/i,
  /\bno (?:reason|point) (?:to|in) (?:living|going on|being here)\b/i,
  /\b(?:can'?t|cannot) go on\b/i,
  /\bbetter off (?:dead|without me)\b/i,
  /\bdon'?t want to (?:be here|live|wake up)\b/i,
];

export function detectDistress(text = '') {
  const t = String(text || '');
  return DISTRESS_PATTERNS.some((re) => re.test(t));
}

// Real, stable Singapore crisis lines, with an international fallback.
// Composed server-side and never model-generated so a hallucinated
// hotline number can never reach a reader at their lowest.
export const CARE_RESOURCES = {
  note: 'What you are carrying sounds heavier than a reading can hold on its own. You do not have to hold it alone, and you do not have to wait until it gets worse to reach someone.',
  lines: [
    { name: 'Samaritans of Singapore (SOS)', detail: '24-hour hotline', contact: '1767' },
    { name: 'SOS CareText', detail: '24-hour WhatsApp', contact: '9151 1767' },
    { name: 'IMH Mental Health Helpline', detail: '24-hour', contact: '6389 2222' },
    { name: 'If you are outside Singapore', detail: 'find a local line', contact: 'findahelpline.com' },
  ],
};
