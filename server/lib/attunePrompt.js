// server/lib/attunePrompt.js
//
// Pure function for building the Attune user prompt. Extracted from
// the route so both production traffic and offline simulators
// (scripts/simulate_attune.js) share the exact same prompt logic.
// Changing the prompt here changes both at once; there's no second
// place where the wording can drift.

// Preference vocabularies. Mirror the AttuneEntry schema enums and
// the frontend chips.
export const GENRE_VALUES = ['any', 'folk', 'classical', 'jazz', 'soul', 'electronic', 'indie', 'hiphop', 'world'];
export const VOCALS_VALUES = ['either', 'with', 'without'];

// Map enum → human-readable phrase the model can read. The "any" /
// "either" values resolve to null so we can skip the line entirely
// rather than instruct the model with a no-op.
const GENRE_PHRASE = {
  any: null,
  folk: 'folk, singer-songwriter, or contemporary acoustic',
  classical: 'classical, modern classical, or chamber music',
  jazz: 'jazz, in any of its eras',
  soul: 'soul, R&B, or related vocal traditions',
  electronic: 'electronic, ambient, or contemporary instrumental',
  indie: 'indie, alt-rock, or art-rock',
  hiphop: 'hip-hop or contemporary rap',
  world: 'music from outside the Anglophone canon (Brazilian, African, Latin, Asian traditions, etc.)',
};
const VOCALS_PHRASE = {
  either: null,
  with: 'songs that have a clear vocal lead; no purely instrumental pieces',
  without: 'instrumental pieces only; no vocals or spoken-word',
};

export function normalisePreferences({ genre, vocals } = {}) {
  return {
    genre: GENRE_VALUES.includes(genre) ? genre : 'any',
    vocals: VOCALS_VALUES.includes(vocals) ? vocals : 'either',
  };
}

export function buildPreferenceBlock(prefs) {
  const lines = [];
  const genreLine = GENRE_PHRASE[prefs.genre];
  const vocalsLine = VOCALS_PHRASE[prefs.vocals];
  if (!genreLine && !vocalsLine) return '';
  lines.push('');
  lines.push('The reader has set these preferences for the music in this reading. These are hard constraints, not suggestions:');
  if (genreLine) lines.push(`  Genre: ${genreLine}.`);
  if (vocalsLine) lines.push(`  Vocals: ${vocalsLine}.`);
  lines.push('Every song you recommend MUST satisfy these. Choose the register honestly within those bounds, then pick titles that meet both the register and the preferences. If the preferences narrow the field hard enough that the obvious register answer is no longer available, find the corner of that genre/vocal space that still meets the register honestly.');
  return lines.join('\n');
}

export function buildDiversityBlock({ recentArtists = [], recentPoets = [], recentAuthors = [], recentRegisters = [] } = {}) {
  if (recentArtists.length === 0 && recentPoets.length === 0 && recentAuthors.length === 0) return '';
  const lines = [];
  lines.push('');
  lines.push('Recently recommended to this reader (across their last few readings):');
  if (recentArtists.length > 0) lines.push(`  Artists: ${recentArtists.join(', ')}`);
  if (recentPoets.length > 0) lines.push(`  Poets: ${recentPoets.join(', ')}`);
  if (recentAuthors.length > 0) lines.push(`  Excerpt authors: ${recentAuthors.join(', ')}`);
  if (recentRegisters.length > 0) lines.push(`  Registers used: ${recentRegisters.join(', ')}`);
  lines.push('');
  lines.push('Treat this list as a strong signal to look elsewhere unless the current mood specifically calls for one of these. The reader is not well-served by hearing the same names every time. Go to a different corner of the canon when the texture allows.');
  return lines.join('\n');
}

// Build the full user prompt for an Attune reading. Pure function;
// no I/O, no DB reads. Caller is responsible for trimming mood and
// loading any recent-history context.
export function buildAttuneUserPrompt({ mood, preferences, diversity }) {
  const prefs = normalisePreferences(preferences || {});
  const preferenceBlock = buildPreferenceBlock(prefs);
  const diversityBlock = buildDiversityBlock(diversity || {});

  return `A Hearth reader has shared how they're feeling, in their own words:

"""
${(mood || '').trim()}
"""

Read the texture of what they shared, then commit to a register before you pick titles. Different moods deserve different registers. A celebratory mood asks for kinetic music, not introspective folk. A grieving mood asks for music that holds silence, not music about grief. A restless mood asks for sound that rides the edge with them. Match the register first; the titles flow from there.

Open with a moodSummary: a quiet, two- or three-sentence reflection that names what you're hearing in their words. No advice. No fixing. Just a clear seeing.

Then state the register: 3 to 6 lowercase words naming the texture this mood asks for. Examples: "holding silence", "kinetic celebration", "tender and warm", "restless and alive", "sitting with weight", "awake and walking out the door". This register MUST shape every recommendation that follows. The register tells you which corner of the reference points to draw from; do not pull artists from a register that does not match the mood.

The register choice is the most important choice in this reading. If the mood is celebratory or kinetic, the songs must be celebratory or kinetic, not introspective folk under any banner. If the mood is restless, the songs must ride that edge, not pull toward stillness. If the mood is tender or warm, draw from soul, jazz, classic R&B; do not default to melancholic indie folk because it is familiar. Match the register honestly.${preferenceBlock}${diversityBlock}

Recommend exactly three songs, one book excerpt, and one poem that meet this register specifically. Pieces with genuine craft and depth that match the texture, not just the surface topic. Each "why" should be brief, specific, and grounded, citing relevant research on music or reading and mood when credible (without inventing studies).

The book excerpt is bibliotherapy in the affective sense: a short passage from real literature, memoir, or essay (never self-help, never a how-to) that meets the reader exactly where this mood is, so they recognise their own feeling in someone else's words. Match the register, not the surface topic; a grieving reader meets a passage that holds the silence, not one that explains grief. Keep it short, one to four sentences. Quote it EXACTLY as written, never paraphrased or reconstructed; for in-copyright books keep to a brief quotation (a sentence or two), and reproduce a fuller passage only for works unambiguously in the public domain that you know verbatim. If you cannot quote a real passage accurately, leave the excerpt text empty and give a url where the reader can find the book. A misquoted passage is worse than none. The "why" names how the passage meets the feeling, no advice, no fixing.

For the poem, prefer to include the full text inline ONLY when the poem is unambiguously in the public domain (typically pre-1929 in the US; classical translations; Whitman, Dickinson, early Frost, Hopkins, Tennyson, Donne, Yeats early work, etc.) AND you know it verbatim. Reproduce line breaks accurately using \\n. NEVER paraphrase or reconstruct a poem from memory; misquoting a poem is worse than linking out to it. When in doubt, leave the text field as an empty string and provide a url to a reputable source instead (poetryfoundation.org, poets.org, the poet's own page, the publisher). At least one of the two fields (text or url) must be non-empty.

Return the result as JSON matching the schema.`;
}
