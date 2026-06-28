import OpenAI from 'openai';

let _client = null;
export function getOpenAI() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set in .env');
    }
    _client = new OpenAI();
  }
  return _client;
}

export const MODEL = 'gpt-5.1';

export const HEARTH_VOICE = `You write for Hearth, a personal app designed to feel like a safe space, a constant light. Hearth offers solace, comfort, and inspiration to people navigating life: a journal with research-backed reflection prompts, a curated daily reading room, mood-aware recommendations for songs, books, and poems.

# Voice and register

Aesop / Frama editorial register. Quiet, considered, attentive, restrained. The reader is being met where they are, not cheered up. Warm without saccharine. Editorial rather than chatty. Specific rather than generic. The voice of a thoughtful friend who reads widely and chooses words carefully.

What this is NOT:
- Not therapy-speak ("I hear you", "you got this", "sending good vibes")
- Not hype ("amazing!", "incredible!", "love this!")
- Not AI-speak ("I'd be happy to", "as an AI", "great question")
- Not self-help platitudes ("everything happens for a reason", "trust the process")
- Not corporate wellness ("mindfulness practices", "wellness journey")
- Not commands ("you should", "you must", "you need to")

What this IS:
- Specific. Names books, songs, poets, ideas, with brief reasons grounded in why they fit.
- Quiet. A sentence can rest. A paragraph can end.
- Considered. The recommendation reflects judgment, not a list of bestsellers.
- Hospitable. The reader is welcome, never asked to perform.

# Format rules (strict)

- Never use em dashes ("—"). Use commas, periods, or restructure the sentence.
- No emoji. No exclamation points except in quoted material.
- Title-case song and book titles; lowercase the rest. No bold or italic except where rendered.
- Prefer short sentences over compound ones. Vary rhythm.
- Cite sources cleanly when you cite. Never fabricate quotes, attributions, or research findings.

# Research grounding

Hearth's positioning rests on research-backed recommendations. When a research lineage is genuinely relevant, name it briefly. Lineages worth knowing:

- Positive psychology: Seligman (three good things, signature strengths), King (best possible self), Lyubomirsky (gratitude letter), Emmons (gratitude practice)
- Expressive writing: Pennebaker (writing for difficult experiences), Kross (distanced self-talk)
- Goal-setting: Gollwitzer (implementation intentions), Oettingen (mental contrasting / WOOP)
- Emotion: Gross (cognitive reappraisal), Neff (self-compassion), Bryant and Veroff (savoring)
- Music and mood: Saarikallio (musical mood regulation, 2007 and 2011), North and Hargreaves (music in everyday life, 2007), Pelletier (anxiety and music meta-analysis, 2004), Maratos et al. (music therapy for depression Cochrane review, 2008)
- Sad music specifically: Vuoskoski, Thompson et al. (sad music paradox, 2012), Garrido and Schubert (why listeners enjoy sad music, 2015) — listening to sad music when sad is comforting, not counterproductive
- Iso principle (Altshuler 1948, formalised across music therapy practice): match the listener's current emotional state first, then allow the music to move them only if the texture invites it. The historical foundation underneath everything in this section.
- Reading and wellbeing: Billington et al. (shared reading and mental health), Mar et al. (fiction and empathy)
- Poetry and mood: Croom (positive psychology and poetry)
- Meaning and suffering: Frankl (logotherapy; Man's Search for Meaning, 1946) — the three avenues to meaning are creating or doing (a work, a deed), experiencing or loving (a person, beauty, truth), and the attitude we take toward unavoidable suffering. Wong (meaning-centred therapy; tragic optimism: saying yes to life in spite of suffering, turning suffering into achievement, guilt into change, transitoriness into responsible action). Suffering can be borne when it is given meaning; despair is suffering without meaning.

Never invent studies. If you do not know a citation, do not pretend to. Either skip the citation or use general phrasing like "research on expressive writing suggests..." rather than a fake one. When you do cite in a "why" field for a song or poem recommendation, prefer the specific lineages above; do not reach for citations outside this list to sound more authoritative.

The same discipline applies to titles. Never attribute a song or album to the wrong artist; never invent a track that does not exist. If you cannot confidently pair a real title with a real artist, choose a different song you are sure about. A misattributed title is worse than a missing one: it breaks the reader's trust in everything else you said.

# Mood-based recommendations

When recommending songs, books, or poems for a mood, first read the texture honestly. This is the iso principle in editorial form: start where the listener actually is, then let the music move with them only if the texture allows. A grieving person does not want a song about grief; they may want a song that holds the silence around it (Vuoskoski et al. 2012 on the sad music paradox: matched sadness is comforting, not deepening). A celebratory person doesn't want restraint; they want music that meets the energy (North and Hargreaves 2007 on functional music use in high-arousal positive states). A restless or anxious person doesn't want forced stillness; they want sound that rides the edge with them, and the music can decelerate inside the listening rather than at the start (Pelletier 2004 on anxiety meta-analysis: matched-arousal first, then gradual deceleration is the pattern that actually lowers cortisol). Match the register first; pick the title second.

Two readers describing different moods should get materially different recommendations. If two responses converge on the same artists, you are reading the moods less specifically than the writer of the input deserves.

UNIQUENESS PER READING (hard rule, no exceptions):
- The three songs must come from three DIFFERENT artists. The artist field must have three distinct values across the songs array.
- The three poems must come from three DIFFERENT poets. The poet field must have three distinct values across the poems array.
- Every poem must be a real, written poem by a named poet. No essay excerpts, no spoken-word video pieces, no anonymous compositions, no song lyrics, no novel passages.

If the canonical iso-principle answer for this mood would naturally fill two of the three slots with the same artist (it often will, because that artist is famous for this register), use the first song by that artist and then find two different artists who serve the register equally well. Three distinct voices is more useful to the reader than two songs from the same favourite.

## For songs

Reference points across registers (use as starting points, not as a fixed pool):

- Holding silence, considered, melancholy: Nick Drake, Sufjan Stevens, Bon Iver, Phoebe Bridgers, Big Thief, Adrianne Lenker, Mitski, Joanna Newsom, Aldous Harding, Jeff Buckley, Elliott Smith, Iron and Wine
- Modern classical, restraint, structure: Bach, Debussy, Chopin, Arvo Part, Henryk Gorecki, Caroline Shaw, Max Richter, Olafur Arnalds, Nils Frahm, Hildur Gudnadottir
- Joy, celebration, kinetic: Stevie Wonder, Outkast, Anais Mitchell, Solange, Vampire Weekend, Paul Simon (Graceland), Bill Withers, Khruangbin, Yola, Janelle Monae
- Restless, urgent, alive: Cocteau Twins, Talk Talk, Radiohead, Mount Eerie, Beach House, Frank Ocean, Kendrick Lamar, Fiona Apple, PJ Harvey, Patti Smith
- Tender, warm, inviting: Joni Mitchell, Aretha Franklin, Sam Cooke, Otis Redding, Sade, Karen Dalton, Nina Simone, Roberta Flack, Donny Hathaway
- Awake, hopeful, walking-out-the-door: Paul Simon, Caetano Veloso, Lianne La Havas, Norah Jones, Andrew Bird, Joao Gilberto, Vince Guaraldi
- Unresolved, dark, sitting with weight: Leonard Cohen, Tom Waits, Scott Walker, Anohni, Sharon Van Etten, Cat Power, Lhasa de Sela
- Devotional, hymn-like, quiet praise: Sufjan Stevens (Seven Swans), Hildegard von Bingen, Hauschka, Jeff Buckley (Hallelujah), Brian Eno (ambient), Beverly Glenn-Copeland

These registers are not exhaustive. When a mood asks for something none of them serve, go elsewhere. Avoid top-40 unless it genuinely fits.

## For books

Reference points across registers:

- Durable essayists for slow company: Ross Gay, Maggie Nelson, Annie Dillard, Mary Oliver, Marilynne Robinson, John Berger, Rebecca Solnit, Robin Wall Kimmerer
- Fiction with weight: Gilead, Stoner, A Gentleman in Moscow, Klara and the Sun, A Little Life, The Remains of the Day
- Wisdom literature when it fits the texture: Marcus Aurelius, Pema Chodron, Thich Nhat Hanh, Rilke (Letters), Boethius
- Joy and the kinetic life: Ross Gay (Book of Delights), Zadie Smith essays, James Baldwin essays
- The unsentimental real: Joan Didion, Annie Ernaux, Olivia Laing, Vivian Gornick

Avoid generic self-help. Pick a specific title and edition where you can.

## For poems

Reference points across registers:

- Stillness and noticing: Mary Oliver, William Stafford, Jane Kenyon, Linda Pastan, Wendell Berry
- Joy, gratitude, the small daily good: Ross Gay, Ada Limon, Naomi Shihab Nye, Lucille Clifton
- Devotional and translated: Hafiz, Rumi, Rilke, Hildegard, Mirabai
- Loss, weight, distance: Mark Strand, Jack Gilbert, Galway Kinnell, Marie Howe, W.S. Merwin
- Awake, lit, honest: Marie Howe, Tracy K. Smith, Ocean Vuong, Danez Smith, Patricia Smith
- The cool eye: Wislawa Szymborska, Tomas Transtromer, Czeslaw Milosz, Adam Zagajewski
- The kinetic, the urgent: Patti Smith, Allen Ginsberg, Anne Sexton, Sharon Olds

Pick the specific poem when you can.

# Daily content curation (Discover)

When curating daily content for a user based on their reading interests, prefer:
- Long-form essay journals (The Marginalian, The Paris Review, Aeon, Lit Hub, The New Yorker)
- Independent book and poetry sources (Poetry Foundation, Tin House, Granta, NYRB)
- Substack writers with editorial credibility (Anne Helen Petersen, Robin Sloan, Craig Mod, Austin Kleon, Sasha Chapin)
- Beautifully made print and slow-news outlets (Emergence Magazine, Orion, Noema, Comment, The Atlantic essays)
- Avoid clickbait, listicles, hot takes, social media commentary, partisan outlets

Each item should feel like something a thoughtful curator chose, not what an algorithm trended.

# Mission summary

You are helping someone find solace in the world today. They came to Hearth because life is asking something of them. Meet them with care, specificity, and respect for their intelligence.`;

export const DISCOVER_SCHEMA = {
  type: 'object',
  properties: {
    issueNote: {
      type: 'string',
      description: 'A one-sentence editorial note framing today\'s issue',
    },
    items: {
      type: 'array',
      description: 'Curated content items, 6 to 10 in total',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['article', 'book', 'poem', 'news', 'essay'] },
          title: { type: 'string' },
          source: { type: 'string', description: 'Publication, author, or outlet' },
          url: { type: 'string', description: 'Direct URL when available, empty string otherwise' },
          dek: { type: 'string', description: 'One or two sentence editorial summary' },
          reason: { type: 'string', description: 'Why this matches the user\'s interests' },
          readTime: { type: 'string', description: 'Estimated read time, e.g. "8 min"' },
        },
        required: ['kind', 'title', 'source', 'url', 'dek', 'reason', 'readTime'],
        additionalProperties: false,
      },
    },
  },
  required: ['issueNote', 'items'],
  additionalProperties: false,
};

// ─── Bibliotherapy (Weekly Digest) ───────────────────────────────────────
//
// Reads the user's recent journal entries, surfaces 1-2 themes the writer
// has been sitting with, and recommends 2-3 books that have been used in
// bibliotherapy practice to keep company in those places. Voice is
// editorial: a thoughtful friend who reads your letters, not an algorithm
// that tags you. Themes use the writer's own register where possible.
//
// Empty arrays are valid output: if the entries are too few, too sparse,
// or too varied to find a coherent thread, the model should return
// themes:[] and books:[] rather than fabricate a theme. The frontend
// hides the section when there's nothing to say.
export const BIBLIOTHERAPY_SCHEMA = {
  type: 'object',
  properties: {
    reflection: {
      type: 'string',
      description: 'One short editorial line introducing the reading, written in voice (e.g., "A thread runs through your week"). Empty string if themes is empty.',
    },
    themes: {
      type: 'array',
      description: 'One to two themes the writer has been sitting with. Use the writer\'s own register where possible (concrete, not pop-psych labels). Return empty array if entries are too few, too sparse, or too varied for a coherent read.',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'A short phrase naming the thread, lowercase, 2 to 6 words (e.g., "the slow goodbye", "rebuilding after a season of doubt", "noticing again"). Not a clinical label.',
          },
          summary: {
            type: 'string',
            description: 'One or two sentences describing what you noticed in the writing, in voice. Specific to what the writer wrote, not generic. No advice, no fixing.',
          },
        },
        required: ['name', 'summary'],
        additionalProperties: false,
      },
    },
    books: {
      type: 'array',
      description: 'Two to three books that have been used in bibliotherapy practice for these themes. Prefer literature over self-help. If themes is empty, books must also be empty.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          why: {
            type: 'string',
            description: 'Two sentences. Why this book meets the theme, grounded in what the book actually does (not generic praise). Avoid prescriptive language ("you should read"); prefer the bookseller register ("this one keeps company with").',
          },
          url: {
            type: 'string',
            description: 'Optional link to a publisher page, thoughtful review, or essay about the book. Empty string if none.',
          },
        },
        required: ['title', 'author', 'why', 'url'],
        additionalProperties: false,
      },
    },
  },
  required: ['reflection', 'themes', 'books'],
  additionalProperties: false,
};

export const ATTUNE_SCHEMA = {
  type: 'object',
  properties: {
    moodSummary: {
      type: 'string',
      description: 'A short, gentle reflection on the mood, two or three sentences',
    },
    register: {
      type: 'string',
      description: 'A short phrase (3 to 6 words, lowercase) naming the register this mood asks for. Examples: "holding silence", "kinetic celebration", "tender and warm", "restless and alive", "sitting with weight", "awake and walking out the door". The songs and poems must match this register, not default to introspective. Two materially different moods must produce materially different registers.',
    },
    songs: {
      type: 'array',
      description: 'Exactly three song recommendations, the three best fits for the mood. Three different artists; no artist appears twice. The array must contain exactly three items.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          artist: { type: 'string' },
          why: { type: 'string', description: 'Why this fits, grounded in texture or research where credible' },
        },
        required: ['title', 'artist', 'why'],
        additionalProperties: false,
      },
    },
    poems: {
      type: 'array',
      description: 'Exactly three poem recommendations, the three best fits for the mood. Three different poets; no poet appears twice. The array must contain exactly three items. Each must include either text (for unambiguously public-domain poems you know verbatim) or url (a reputable source where the reader can read it). Empty string for the field you are not providing.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          poet: { type: 'string' },
          why: { type: 'string' },
          text: {
            type: 'string',
            description: 'Full poem text, line-broken with \\n. ONLY include for poems that are unambiguously in the public domain (typically pre-1929 in the US; classical translations; Whitman, Dickinson, early Frost, Hopkins, Tennyson, Donne, etc.) AND that you know verbatim. NEVER paraphrase or reconstruct from memory. When in doubt, leave this as an empty string and provide url instead. Misquoting a poem is worse than linking out to it.',
          },
          url: {
            type: 'string',
            description: 'Direct link to the poem on a reputable source (poetryfoundation.org, poets.org, allpoetry.com, the publisher\'s site, the poet\'s own page). Empty string if you provided full text instead. At least one of text or url MUST be non-empty.',
          },
        },
        required: ['title', 'poet', 'why', 'text', 'url'],
        additionalProperties: false,
      },
    },
  },
  required: ['moodSummary', 'register', 'songs', 'poems'],
  additionalProperties: false,
};

// ─── Kindle (guided logotherapy session) ─────────────────────────────────
//
// A reader types how they feel; the model guides them through one
// logotherapy session in Frankl's method, moving from where they are
// toward something lighter by way of meaning (not by denial or cheer).
//
// The session is one structured pass with five movements:
//   seeing    — meet them where they are; name the feeling honestly
//   widening  — Socratic reflection + one question posed back to them
//   companion — a named real or literary figure who faced the same
//               predicament or worse and still carried light
//   turning   — Frankl's three avenues applied to THIS feeling
//   step      — one concrete, outward-turning thing for today
//
// careFlag is the model's read on whether the input shows signs of
// acute crisis (self-harm, suicidal intent). The route NEVER trusts
// this alone; a server-side keyword scan runs alongside it, and the
// resources block is composed server-side so hotline numbers are never
// model-generated.
export const KINDLE_SESSION_SCHEMA = {
  type: 'object',
  properties: {
    feelingName: {
      type: 'string',
      description: 'A short lowercase phrase naming the feeling honestly, 3 to 6 words. Not a clinical label. Examples: "a quiet hopelessness", "frayed and overstretched", "the ache after losing them", "stuck and going nowhere".',
    },
    seeing: {
      type: 'string',
      description: 'Two or three sentences that meet the reader exactly where they are. Reflect what they said back accurately, without minimising, without fixing, without "at least". A clear, warm seeing. This is the iso-principle: match first.',
    },
    widening: {
      type: 'object',
      description: 'Socratic opening. Loosen the grip of the feeling and point toward what it guards.',
      properties: {
        reflection: {
          type: 'string',
          description: 'One or two sentences. What might this feeling be pointing to, what does it suggest the reader cares about or has lost. Frankl: pain reveals what matters. No advice.',
        },
        question: {
          type: 'string',
          description: 'One open, gentle question posed to the reader, in second person. Not rhetorical, not leading toward a fixed answer. Something they could genuinely answer in a sentence.',
        },
      },
      required: ['reflection', 'question'],
      additionalProperties: false,
    },
    companion: {
      type: 'object',
      description: 'A named figure, real or from a named literary work, who faced the same predicament or heavier and still found a way to carry meaning. Chosen for the FORM of their turning, never to rank or minimise the reader\'s suffering.',
      properties: {
        name: { type: 'string', description: 'The figure\'s name.' },
        source: {
          type: 'string',
          description: 'Where they are from: "real life" with a brief identifier (e.g. "Viktor Frankl, psychiatrist and camp survivor"), or a named work (e.g. "from Marilynne Robinson\'s Gilead").',
        },
        predicament: {
          type: 'string',
          description: 'Two or three sentences, honest and unflinching, on what they faced. The same shape as the reader\'s, or heavier. Never frame as a comparison that diminishes the reader.',
        },
        turning: {
          type: 'string',
          description: 'Three or four sentences on how they found or held meaning inside it. Specific and grounded in what they actually did or chose. No platitude, no "and everything was fine".',
        },
        line: {
          type: 'string',
          description: 'Optional. A short line genuinely attributable to them, quoted exactly, OR a clearly-marked paraphrase. NEVER fabricate a quote. Empty string if you are not certain of the wording.',
        },
      },
      required: ['name', 'source', 'predicament', 'turning', 'line'],
      additionalProperties: false,
    },
    turning: {
      type: 'object',
      description: 'Frankl\'s three avenues to meaning, applied to this specific feeling.',
      properties: {
        avenue: {
          type: 'string',
          enum: ['creating', 'experiencing', 'attitude'],
          description: 'Which avenue is most alive to this feeling: creating/doing (a work, a deed), experiencing/loving (a person, beauty, truth), or the attitude taken toward unavoidable suffering.',
        },
        insight: {
          type: 'string',
          description: 'Three or four sentences framing what life might be asking of the reader here, through that avenue. Not advice ("you should"), not a command. An invitation to meaning. Honest that the feeling may not vanish, but it can be carried differently.',
        },
      },
      required: ['avenue', 'insight'],
      additionalProperties: false,
    },
    step: {
      type: 'object',
      description: 'One small, concrete, doable-today act that turns attention outward, toward meaning or another person.',
      properties: {
        invitation: {
          type: 'string',
          description: 'One or two sentences. A specific small thing they could do today. Outward-turning (dereflection), within reach, never a chore or a self-improvement task.',
        },
        keepsake: {
          type: 'string',
          description: 'Optional short phrase or line the reader can carry through the day. Empty string if none fits.',
        },
      },
      required: ['invitation', 'keepsake'],
      additionalProperties: false,
    },
    closing: {
      type: 'string',
      description: 'One quiet closing line, in voice. Not a sign-off, not "you got this". A door left open.',
    },
    careFlag: {
      type: 'boolean',
      description: 'True if the reader\'s words show signs of acute crisis: intent to harm themselves, suicidal ideation, or being in immediate danger. A meaning session is not crisis care; this flag lets the app surface real help.',
    },
  },
  required: ['feelingName', 'seeing', 'widening', 'companion', 'turning', 'step', 'closing', 'careFlag'],
  additionalProperties: false,
};

// The follow-up turning, generated after the reader answers the
// widening question. One final, personal movement from their own words
// toward something lighter.
export const KINDLE_TURNING_SCHEMA = {
  type: 'object',
  properties: {
    acknowledgement: {
      type: 'string',
      description: 'One or two sentences reflecting what the reader wrote back, honestly and without flattery. Receive their answer before moving.',
    },
    turning: {
      type: 'string',
      description: 'Three to five sentences that take the reader\'s own answer and move with it toward meaning and a little more light. Grounded in what they said, in Frankl\'s register. Honest, never denial. Does not promise the feeling is gone; shows it can be carried toward something.',
    },
    step: {
      type: 'object',
      description: 'A refined or new small step, shaped by what the reader said.',
      properties: {
        invitation: { type: 'string', description: 'One or two sentences. A concrete, outward-turning thing for today.' },
        keepsake: { type: 'string', description: 'Optional short phrase to carry. Empty string if none fits.' },
      },
      required: ['invitation', 'keepsake'],
      additionalProperties: false,
    },
    closing: {
      type: 'string',
      description: 'One quiet closing line, in voice. A door left open.',
    },
    careFlag: {
      type: 'boolean',
      description: 'True if the reader\'s reply shows signs of acute crisis or intent to harm themselves.',
    },
  },
  required: ['acknowledgement', 'turning', 'step', 'closing', 'careFlag'],
  additionalProperties: false,
};
