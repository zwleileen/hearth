import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOpenAI, MODEL, HEARTH_VOICE, ATTUNE_SCHEMA } from '../lib/ai.js';

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

Recommend exactly two songs, two books, and two poems that meet this mood specifically. Choose the two best fits in each category — pieces with genuine craft and depth that match the texture of what they shared, not just the surface topic. Each "why" should be brief, specific, and grounded, citing relevant research on music or reading and mood when credible (without inventing studies).

Open with a moodSummary: a quiet, two- or three-sentence reflection that names what you're hearing in their words. No advice. No fixing. Just a clear seeing.

Return the result as JSON matching the schema.`;

  let client;
  try {
    client = getOpenAI();
  } catch (err) {
    return res.status(503).json({ error: 'AI service not configured', detail: err.message });
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
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
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error('[attune]', err);
    res.status(500).json({ error: 'Failed to generate recommendations', detail: err.message });
  }
});
