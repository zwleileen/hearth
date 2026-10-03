// server/lib/cardWords.js
//
// The words on the back of a keepsake card, set from a Carry session's
// mirror. A session's mirror is written to the reader: it tells the
// story, then turns it toward their own life ("your wish for impact
// might be like that"). A card goes to someone who never saw the
// session, so its words tell the story alone, and end on the turning
// distilled into a line that can stand by itself (carry_postcard/ is
// the design this follows).
//
// Made alongside the picture, kept with it, and only ever a starting
// point: the reader can change every word on the card page.

import { MODEL } from './ai.js';

const SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'The mirror\'s name as a title, in sentence case, a few words. For example: The river and the side stream. For a real person, their name.',
    },
    body: {
      type: 'string',
      description: 'The mirror told plainly, in two short paragraphs separated by a blank line, 90 to 120 words in all: what it faced, then how it turned.',
    },
    closing: {
      type: 'string',
      description: 'One or two sentences, 25 words at most: the turning, distilled, in the story\'s own terms.',
    },
  },
  required: ['title', 'body', 'closing'],
  additionalProperties: false,
};

const WRITER = `You set the words for the back of a Hearth keepsake card. On the front is a painting of a mirror: a person, a figure from a story, an image from nature or a small parable that held a difficulty and found its way through. On the back, under its title, the mirror is told in a few short lines, and the card ends on one line that can be kept.

The card may be given to someone who never saw the session it came from, so it speaks to no one in particular.

# The body
- Tell the mirror plainly, in the third person, in two short paragraphs: first what it faced, then how it turned. 90 to 120 words in all, never more: it has to fit on a small card.
- Keep the mirror's own images and its best phrases. Tighten; do not embellish.
- Leave out every sentence that speaks to or about the reader: no "you", no "your", no "like you", no advice.
- For a real person, keep to what is true and known. Never invent a fact, a scene or a quotation.

# The closing
- One or two sentences, 25 words at most: the turning, distilled, so it can stand alone and be remembered.
- In the story's own terms, not the reader's. For example: The river has not betrayed its source by splitting. It has found more than one way to be itself.
- If the mirror has a line genuinely spoken or written by a real person and it fits, the closing may be that line, quoted exactly, in quotation marks.
- Do not repeat a sentence that is already in the body.

# Voice
Quiet, warm and exact, like a good essayist. No em dashes. No exclamation marks. Quotation marks only for real quotations, or for words the story itself puts in quotes.`;

function buildPrompt({ companion = {}, keepsake = '' }) {
  const lines = [
    `The form of the mirror: ${companion.kind || 'image'}`,
    `Its name: ${companion.name || ''}`,
    `Where it is from: ${companion.source || ''}`,
    `What it faced or holds: ${companion.predicament || ''}`,
    `How it turned: ${companion.turning || ''}`,
  ];
  if (companion.line) lines.push(`A line attributed to them: ${companion.line}`);
  if (keepsake) lines.push(`The line the reader was given to keep (for its spirit, not to copy): ${keepsake}`);
  return `Here is the mirror.\n\n${lines.join('\n')}\n\nSet the words for the back of the card. Return JSON matching the schema.`;
}

const BODY_MAX_WORDS = 130;

function wordCount(s) {
  return (s || '').split(/\s+/).filter(Boolean).length;
}

// What makes a draft wrong for the card, as a note for one corrective
// pass, or null. In testing the writer ran long and repeated its closing
// inside the body, both of which a reader would then have to fix.
function problems({ body, closing }) {
  const notes = [];
  const n = wordCount(body);
  if (n > BODY_MAX_WORDS) notes.push(`The body is ${n} words. Bring it to between 90 and 120 words, keeping the best images.`);
  const start = (closing || '').toLowerCase().replace(/[^a-z ]/g, '').split(' ').slice(0, 6).join(' ');
  if (start && (body || '').toLowerCase().replace(/[^a-z ]/g, '').includes(start)) {
    notes.push('The closing line also appears in the body. Remove it from the body, so the card ends on it only once.');
  }
  return notes.length ? notes.join(' ') : null;
}

async function call(client, messages) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'card_words', strict: true, schema: SCHEMA },
    },
  });
  const text = completion.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI service');
  const data = JSON.parse(text);
  return {
    title: (data.title || '').trim(),
    body: (data.body || '').trim(),
    closing: (data.closing || '').trim(),
  };
}

// Returns { title, body, closing }.
export async function generateCardWords(client, { session, replyTurning } = {}) {
  const companion = session?.companion || {};
  const keepsake = replyTurning?.step?.keepsake || session?.step?.keepsake || '';
  const messages = [
    { role: 'system', content: WRITER },
    { role: 'user', content: buildPrompt({ companion, keepsake }) },
  ];
  // Up to two corrective passes: the writer tends to run long, and a
  // single note does not always bring it in.
  let draft = await call(client, messages);
  for (let pass = 0; pass < 2; pass += 1) {
    const fix = problems(draft);
    if (!fix) break;
    messages.push({ role: 'assistant', content: JSON.stringify(draft) });
    messages.push({ role: 'user', content: `${fix} Change nothing else.` });
    draft = await call(client, messages);
  }
  return draft;
}
