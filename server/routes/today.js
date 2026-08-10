// server/routes/today.js
//
// One thing worth stopping for. Shared by everyone, generated once a
// day. Replaces /api/discover/today (see docs/DOCTRINE_AUDIT.md §10).
//
//   GET /api/today            today's thing; generates it if this is the
//                             first request of the day.
//   GET /api/today?refresh=1  regenerate (kept for operational use).

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, DAILY_THING_SCHEMA } from '../lib/ai.js';
import { DailyThing } from '../models/DailyThing.js';
import { fetchOgImage } from '../lib/og.js';

export const today = Router();
today.use(requireAuth);

const PROMPT_VERSION = 1;
// How many recent days to feed back as "not these again". Small, because
// the registers already force variety and the corpus of astonishing
// things is effectively unbounded.
const RECENT_WINDOW = 14;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function seedFromDate(date) {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0;
  return h;
}

// The registers. This rotation is where variety comes from now. The old
// reading room got variety from topic breadth, which is what made it
// feel like a feed; these are variety of KIND, which is what receiving
// actually wants. Frankl's experiential values are nature, art, beauty
// and truth, and four of these five map straight onto them.
const TODAY_REGISTERS = [
  {
    key: 'vast',
    brief: 'Something vast, ancient, or enormous: a fact about the natural world that quietly rearranges the reader\'s sense of scale. A forest that is one organism. A star older than the elements it is made of. Awe, in the precise sense: the sense of being small in a way that is a relief rather than a wound.',
  },
  {
    key: 'made',
    brief: 'Something a person made, and made well: an object, a building, a painting, a piece of craft, a piece of music. Beauty that somebody put there on purpose. Describe the thing, not the artist\'s biography.',
  },
  {
    key: 'true',
    brief: 'Something true that is stranger than it has any right to be: a small, verifiable fact about the world, an animal, a language, a place. Not trivia for its own sake. The kind of fact that makes the world feel less exhausted.',
  },
  {
    key: 'overlooked',
    brief: 'Something small and easily walked past, seen properly: a common object, an ordinary phenomenon, a thing underfoot. The register of noticing rather than of grandeur.',
  },
  {
    key: 'read',
    brief: 'One piece of writing genuinely worth a reader\'s whole attention today: an essay, a poem, a short profile. Only one, and only if it is unmistakably worth it. This register exists so that reading is still possible here, not so that a queue can return.',
  },
];

// Deterministic per day so the same date always produces the same
// register, and consecutive days differ.
function registerForDate(date) {
  // 'read' should be occasional, not one day in five, so the wheel
  // weights the wordless registers.
  const wheel = ['vast', 'made', 'true', 'overlooked', 'vast', 'made', 'read', 'true', 'overlooked', 'made'];
  const key = wheel[seedFromDate(date) % wheel.length];
  return TODAY_REGISTERS.find((r) => r.key === key) || TODAY_REGISTERS[0];
}

function toClient(doc) {
  return {
    date: doc.date,
    register: doc.register || '',
    title: doc.title || '',
    body: doc.body || '',
    sourceName: doc.sourceName || '',
    url: doc.url || '',
    image: doc.image || '',
  };
}

async function generate(date) {
  const register = registerForDate(date);

  const recent = await DailyThing.find({ date: { $lt: date } })
    .sort({ date: -1 }).limit(RECENT_WINDOW).select('title').lean();
  const seen = recent.map((r) => r.title).filter(Boolean);

  const userPrompt = `Find one thing worth stopping for today. One. Not a list, not a selection, not a room of pieces. One.

Today's register:
${register.brief}

${seen.length ? `Recently offered, do not repeat or circle these:\n${seen.map((t) => `  - ${t}`).join('\n')}\n` : ''}
Use the web_search tool to ground this in something real and verifiable. Never invent a fact, a place, a measurement, or a work. If you cannot verify it, choose something else you can.

Write it as follows.

title: a short, plain name for the thing. Not a headline, not a hook, not a question. "Pando". "The Great Bookcase". "Slime moulds".

body: at most two sentences. Say what it is and what is remarkable about it, and then stop. No argument, no lesson, no invitation to reflect, nothing for the reader to finish. Do not tell them how to feel about it and do not tell them what it means. The whole point is that it asks nothing.

sourceName: where this can be read about, plainly named, or an empty string.
url: a real, direct URL to a reputable page about it, or an empty string. Never a search page, never a guess.

Hearth's voice: quiet, specific, warm, unhurried. No em dashes. No exclamation marks. No "imagine", no "consider", no "isn't it remarkable". Never address the reader's feelings. Write the way a good field guide writes, if a field guide loved the world.

Return JSON matching the schema.`;

  const client = getOpenAI();
  const response = await client.responses.create({
    model: MODEL,
    instructions: HEARTH_VOICE,
    input: userPrompt,
    tools: [{ type: 'web_search' }],
    text: {
      format: { type: 'json_schema', name: 'daily_thing', strict: true, schema: DAILY_THING_SCHEMA },
    },
  });

  const text = response.output_text;
  if (!text) throw new Error('Empty response from AI service');
  const data = JSON.parse(text);

  let image = '';
  if (data.url) {
    try { image = (await fetchOgImage(data.url)) || ''; } catch { image = ''; }
  }

  // Upsert on date, so two readers arriving in the same second cannot
  // create two things for one day. The first write wins and the second
  // simply reads it back.
  const doc = await DailyThing.findOneAndUpdate(
    { date },
    {
      $set: {
        date,
        register: register.key,
        title: (data.title || '').trim(),
        body: (data.body || '').trim(),
        sourceName: (data.sourceName || '').trim(),
        url: (data.url || '').trim(),
        image,
        generatedAt: new Date(),
        promptVersion: PROMPT_VERSION,
      },
    },
    { upsert: true, new: true },
  );
  return doc;
}

today.get('/', async (req, res) => {
  const date = todayISO();

  try {
    const existing = await DailyThing.findOne({ date });
    if (existing && !req.query.refresh && existing.promptVersion === PROMPT_VERSION) {
      return res.json({ ...toClient(existing), cached: true });
    }
  } catch (err) {
    console.error('[today] read failed:', err);
  }

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }
  if (!client) return res.status(503).json({ error: 'AI service not configured' });

  try {
    const doc = await generate(date);
    res.json({ ...toClient(doc), cached: false });
  } catch (err) {
    console.error('[today]', err);
    // A generation failure must not leave the reader with a broken
    // surface. If anything at all exists for today, serve it.
    const fallback = await DailyThing.findOne({ date }).catch(() => null);
    if (fallback) return res.json({ ...toClient(fallback), cached: true });
    res.status(500).json({ error: 'Could not find today\'s thing', detail: err.message });
  }
});
