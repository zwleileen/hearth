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

Read the texture of what they shared, then commit to a register before you pick titles. Different moods deserve different registers. A celebratory mood asks for kinetic music, not introspective folk. A grieving mood asks for music that holds silence, not music about grief. A restless mood asks for sound that rides the edge with them. Match the register first; the titles flow from there.

Open with a moodSummary: a quiet, two- or three-sentence reflection that names what you're hearing in their words. No advice. No fixing. Just a clear seeing.

Then state the register: 3 to 6 lowercase words naming the texture this mood asks for. Examples: "holding silence", "kinetic celebration", "tender and warm", "restless and alive", "sitting with weight", "awake and walking out the door". This register MUST shape every recommendation that follows. If your songs end up Phoebe Bridgers and Bon Iver, your register had better be one of "holding silence" or similar; if your register is "kinetic celebration", the songs must NOT be Phoebe Bridgers and Bon Iver.

Recommend exactly two songs, two books, and two poems that meet this register specifically. Pieces with genuine craft and depth that match the texture, not just the surface topic. Each "why" should be brief, specific, and grounded, citing relevant research on music or reading and mood when credible (without inventing studies).

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
      // Temperature + frequency_penalty added to break the convergence
      // pattern where structured-JSON output collapses to the same handful
      // of artists regardless of mood input. 0.9 / 0.4 are conservative
      // values that preserve the editorial voice while letting the LLM
      // explore the wider register space the prompt now opens.
      temperature: 0.9,
      frequency_penalty: 0.4,
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
