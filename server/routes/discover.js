import { Router } from 'express';
import { User } from '../models/User.js';
import { DailyDiscover } from '../models/DailyDiscover.js';
import { requireAuth } from '../middleware/auth.js';
import { getClaude, MODEL, HEARTH_VOICE, DISCOVER_SCHEMA, extractJSONFromMessage } from '../lib/claude.js';

export const discover = Router();
discover.use(requireAuth);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

discover.get('/today', async (req, res) => {
  const date = todayISO();
  const cached = await DailyDiscover.findOne({ userId: req.userId, date });
  if (cached && !req.query.refresh) {
    return res.json({ date, issueNote: cached.issueNote, items: cached.items, cached: true });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const interests = user.onboarding?.interests || [];
  const flower = user.onboarding?.flower || 'wisteria';
  const dailyTime = user.onboarding?.dailyTime || 'morning';

  const userPrompt = `Curate today's reading room for a Hearth reader.

The reader has expressed these interests during onboarding: ${interests.length > 0 ? interests.join(', ') : 'no specific interests yet, default to thoughtful general culture'}.
Their preferred reading time is ${dailyTime}. Their signature is "${flower}".
Today's date: ${date}.

Use the web_search tool to find 6 to 10 specific, recently-published or recently-relevant pieces of content that fit Hearth's editorial register and the reader's interests. Mix kinds: a long-form essay, a poem worth sharing, a book worth knowing about, a piece of slow news, a thoughtful interview. Avoid hot takes, listicles, partisan content, and AI/tech hype.

Search broadly across reputable editorial outlets. Prefer specificity (a real article with a real URL) over generic recommendations.

Return the result as JSON matching the schema. Each item must have a real source and a direct URL where you found it.`;

  let client;
  try {
    client = getClaude();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: [
        { type: 'text', text: HEARTH_VOICE, cache_control: { type: 'ephemeral' } },
      ],
      tools: [
        { type: 'web_search_20260209', name: 'web_search' },
      ],
      output_config: {
        format: { type: 'json_schema', schema: DISCOVER_SCHEMA },
      },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'Claude refused the request' });
    }

    const data = extractJSONFromMessage(message);

    await DailyDiscover.findOneAndUpdate(
      { userId: req.userId, date },
      { $set: { issueNote: data.issueNote, items: data.items } },
      { upsert: true, new: true },
    );

    res.json({ date, issueNote: data.issueNote, items: data.items, cached: false });
  } catch (err) {
    console.error('[discover]', err);
    res.status(500).json({ error: 'Failed to curate content', detail: err.message });
  }
});
