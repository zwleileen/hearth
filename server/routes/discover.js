import { Router } from 'express';
import { User } from '../models/User.js';
import { DailyDiscover } from '../models/DailyDiscover.js';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, DISCOVER_SCHEMA } from '../lib/ai.js';
import { fetchOgImage } from '../lib/og.js';

export const discover = Router();
discover.use(requireAuth);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Deterministic hash of a YYYY-MM-DD string. Stable per day (so the cache
// key and the generated issue stay consistent within a day) but different
// across consecutive days.
function seedFromDate(date) {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0;
  return h;
}

// Foreground a rotating 2-3 interest subset for the day. Dumping the full
// interest list every day let the most literal, most searchable token
// (e.g. "repair") dominate every issue while the abstract interests
// ("ideas", "wisdom") got folded into its frame. Seeding from the date
// keeps a given day stable while consecutive days lead with a different
// slice. Same literal-token trap the `flower` field hit (see note below).
function rotateInterests(interests, date) {
  if (interests.length <= 3) return interests;
  const seed = seedFromDate(date);
  const start = seed % interests.length;
  const count = 2 + (seed % 2); // 2 or 3
  const picked = [];
  for (let i = 0; i < count; i++) picked.push(interests[(start + i) % interests.length]);
  return picked;
}

discover.get('/today', async (req, res) => {
  const date = todayISO();
  const cached = await DailyDiscover.findOne({ userId: req.userId, date });
  if (cached && !req.query.refresh) {
    return res.json({ date, issueNote: cached.issueNote, items: cached.items, cached: true });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const allInterests = user.onboarding?.interests || [];
  const dailyTime = user.onboarding?.dailyTime || 'morning';

  // Note: onboarding.flower is intentionally NOT injected here. It's a
  // UI/aesthetic personalisation (which tints home-screen colours), not
  // a content-curation signal. Earlier versions of this prompt included
  // it as "their signature is wisteria/poppy/cornflower" — the LLM read
  // that as a thematic preference and over-rotated on literal wisteria
  // articles every day, especially because the legacy storage keys
  // (wisteria/poppy/cornflower) diverged from the renamed display labels
  // (Oak/Birch/Pine) without the prompt ever being updated.

  // Lead with a rotating subset so one literal interest can't dominate
  // every issue (the "repair" trap: a reader who listed repair/craft/
  // ideas/justice/wisdom/place was getting a daily file on mending).
  const leadInterests = rotateInterests(allInterests, date);

  // Anti-repetition memory: each daily issue is generated independently,
  // so without a record of what recently ran it reconverges on the same
  // dominant theme. Feed the last few issues' framing back as an explicit
  // "go elsewhere" signal.
  const recent = await DailyDiscover.find({ userId: req.userId, date: { $lt: date } })
    .sort({ date: -1 }).limit(5).lean();
  const recentThemes = recent.map((d) => d.issueNote).filter(Boolean);

  const userPrompt = `Curate today's reading room for a Hearth reader.

The reader expressed these interests during onboarding: ${allInterests.length > 0 ? allInterests.join(', ') : 'no specific interests yet, default to thoughtful general culture'}. Treat the full list as a palette to range ACROSS over time, not a fixed recipe for every issue.
Today, lead with: ${leadInterests.length > 0 ? leadInterests.join(', ') : 'thoughtful general culture'}. Let the other interests appear lightly, if at all. Do not let any single literal interest (for example "repair") become the frame for the whole room; a reader who listed "repair" wants a reading life, not a daily dossier on mending. Pull the abstract interests ("ideas", "wisdom", "place") toward concrete, surprising subjects rather than collapsing them into whichever interest is easiest to search.
Their preferred reading time is ${dailyTime}.
Today's date: ${date}.
${recentThemes.length > 0 ? `\nRecent issues already circled these framings, most recent first:\n${recentThemes.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}\nDeliberately go elsewhere today. Choose different subjects, registers, and source outlets so the room feels new. If recent issues leaned hard on one motif, do not return to it.\n` : ''}

Use the web_search tool to find 6 to 10 specific, recently-published or recently-relevant pieces of content that fit Hearth's editorial register and the reader's interests. Mix kinds:
  - At LEAST one long-form essay
  - At least one poem worth sharing (poetryfoundation.org, poets.org, etc.)
  - Optionally a piece of slow news, a thoughtful interview, an in-depth profile
  - Books are discretionary, not required: include a kind="book" item when (and only when) a specific book genuinely deserves to be surfaced as serendipitous discovery this issue. The reader receives theme-matched bibliotherapy book recommendations elsewhere in the app (the Weekly Digest), so the daily reading room's job for books is "here's something worth knowing about" rather than fulfilling a slot. When you include one, the url should point to a publisher page, an essay about the book, or a thoughtful review (NYRB, LARB, The Marginalian, Lit Hub, Granta, Paris Review interviews).

Avoid hot takes, listicles, partisan content, and AI/tech hype.

Search broadly across reputable editorial outlets. Prefer specificity (a real article with a real URL) over generic recommendations.

Return the result as JSON matching the schema. Each item must have a real source and a direct URL where you found it.`;

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  try {
    const response = await client.responses.create({
      model: MODEL,
      instructions: HEARTH_VOICE,
      input: userPrompt,
      tools: [{ type: 'web_search' }],
      text: {
        format: {
          type: 'json_schema',
          name: 'discover_response',
          strict: true,
          schema: DISCOVER_SCHEMA,
        },
      },
    });

    const text = response.output_text;
    if (!text) {
      return res.status(502).json({ error: 'Empty response from AI service' });
    }
    const data = JSON.parse(text);

    // Enrich items with og:image (best-effort, parallel, with per-URL timeout)
    const items = await Promise.all(
      (data.items || []).map(async (item) => {
        const image = item.url ? await fetchOgImage(item.url).catch(() => null) : null;
        return { ...item, image: image || null };
      }),
    );

    await DailyDiscover.findOneAndUpdate(
      { userId: req.userId, date },
      { $set: { issueNote: data.issueNote, items } },
      { upsert: true, new: true },
    );

    res.json({ date, issueNote: data.issueNote, items, cached: false });
  } catch (err) {
    console.error('[discover]', err);
    res.status(500).json({ error: 'Failed to curate content', detail: err.message });
  }
});
