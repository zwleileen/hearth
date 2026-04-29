import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getClaude, MODEL, HEARTH_VOICE, ATTUNE_SCHEMA, extractJSONFromMessage } from '../lib/claude.js';

export const attune = Router();
attune.use(requireAuth);

attune.post('/', async (req, res) => {
  const { mood } = req.body || {};
  if (!mood || typeof mood !== 'string' || !mood.trim()) {
    return res.status(400).json({ error: 'mood (free text) is required' });
  }
  if (mood.length > 1000) {
    return res.status(400).json({ error: 'mood is too long, please keep it under 1000 characters' });
  }

  const userPrompt = `A Hearth reader has shared how they're feeling, in their own words:

"""
${mood.trim()}
"""

Recommend three songs, three books, and three poems that meet this mood specifically. Match the texture of what they shared, not just the surface topic. Each "why" should be brief, specific, and grounded, citing relevant research on music or reading and mood when credible (without inventing studies).

Open with a moodSummary: a quiet, two- or three-sentence reflection that names what you're hearing in their words. No advice. No fixing. Just a clear seeing.

Return the result as JSON matching the schema.`;

  let client;
  try {
    client = getClaude();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system: [
        { type: 'text', text: HEARTH_VOICE, cache_control: { type: 'ephemeral' } },
      ],
      output_config: {
        format: { type: 'json_schema', schema: ATTUNE_SCHEMA },
      },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'Claude refused the request' });
    }

    const data = extractJSONFromMessage(message);
    res.json(data);
  } catch (err) {
    console.error('[attune]', err);
    res.status(500).json({ error: 'Failed to generate recommendations', detail: err.message });
  }
});
