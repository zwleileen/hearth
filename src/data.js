// Hearth — content & data
// Sources noted in comments where relevant.

window.HEARTH_DATA = {

  // ─────────────────────────────────────────────────────────────
  // JOURNAL PROMPTS — drawn from the most cited, evidence-supported
  // protocols in positive psychology + clinical writing research.
  //
  // Morning lineage: Implementation intentions (Gollwitzer, 1999),
  // self-affirmation (Cohen & Sherman, 2014), best possible self
  // (King, 2001 — improved well-being in RCTs), savoring (Bryant
  // & Veroff, 2007), and mental contrasting / WOOP (Oettingen).
  //
  // Evening lineage: Three good things (Seligman et al., 2005 —
  // sustained well-being gains at 6 months), expressive writing
  // (Pennebaker, 1997), self-compassion (Neff, 2003), gratitude
  // letter (Lyubomirsky), and cognitive reappraisal (Gross).
  // ─────────────────────────────────────────────────────────────

  morningPrompts: [
    {
      title: "Best possible self",
      lineage: "King, 2001",
      prompt: "Imagine yourself a year from now, having lived this year well. What does your day look like — who are you with, what are you working on, what feels different in your body?"
    },
    {
      title: "One small intention",
      lineage: "Gollwitzer · implementation intentions",
      prompt: "Today, when ___ happens, I will ___. Pick one situation you can predict, and one response you'd be proud of."
    },
    {
      title: "What matters today",
      lineage: "ACT · values in action",
      prompt: "Of everything on your plate, what would make today feel meaningful even if nothing else gets done? Why does that one thing matter to you?"
    },
    {
      title: "WOOP",
      lineage: "Oettingen · mental contrasting",
      prompt: "Wish — what do you want today? Outcome — how will you feel when it's done? Obstacle — what inside you might get in the way? Plan — what will you do when the obstacle arrives?"
    },
    {
      title: "Anchor of gratitude",
      lineage: "Emmons & McCullough, 2003",
      prompt: "Name one ordinary thing already true this morning that you'd miss if it were gone. Sit with it for a breath before you write."
    },
  ],

  eveningPrompts: [
    {
      title: "Three good things",
      lineage: "Seligman et al., 2005",
      prompt: "Three things that went well today — however small. For each, why did it go well? What part did you play?"
    },
    {
      title: "Expressive writing",
      lineage: "Pennebaker, 1997",
      prompt: "Write continuously for the next ten minutes about something on your mind. Don't edit. Don't worry about grammar. Let the deepest layer surface."
    },
    {
      title: "Letter of self-compassion",
      lineage: "Neff, 2003",
      prompt: "If a dear friend had your day, what would you say to them tonight? Now, write that — to yourself."
    },
    {
      title: "What did you learn?",
      lineage: "Cognitive reappraisal · Gross",
      prompt: "Pick one moment that didn't go the way you hoped. What's a more generous reading of it? What did it teach you about yourself?"
    },
    {
      title: "Tomorrow, lighter",
      lineage: "Newport · shutdown ritual",
      prompt: "What's left on your mind from today? Write it down so you don't have to carry it through the night."
    },
  ],

  moodTags: ["tender", "tired", "alight", "restless", "grateful", "uncertain", "hopeful", "heavy", "open", "raw"],

  // ─────────────────────────────────────────────────────────────
  // DISCOVER — people and projects creating systemic change.
  // Real public figures & organizations whose work is on the record.
  // ─────────────────────────────────────────────────────────────
  magazine: {
    issue: "Issue 14",
    date: "Late November, 2026",
    cover: {
      kicker: "The long work",
      title: "Builders of warmer worlds",
      dek: "Five conversations with people whose practice is repair — of soil, of cities, of the way we speak to each other.",
      caption: "ph · long-exposure of bakery window in snow"
    },
    stories: [
      {
        kind: "feature",
        kicker: "Architecture · Burkina Faso",
        title: "Earth, light, and patience",
        author: "On Diébédo Francis Kéré",
        dek: "The Pritzker laureate on community-built schools, raw clay walls, and why a building should know the climate it stands in.",
        readTime: "12 min",
        caption: "ph · gando primary school courtyard, midday"
      },
      {
        kind: "interview",
        kicker: "Food systems · Copenhagen",
        title: "If a kitchen could repair a forest",
        author: "Inside Refettorio's volunteer kitchens",
        dek: "Massimo Bottura's nonprofit feeds dignity, not leftovers — and rewrites who gets to eat well.",
        readTime: "8 min",
        caption: "ph · long table, communal meal, candlelight"
      },
      {
        kind: "essay",
        kicker: "Books · this week",
        title: "Three quiet manifestos",
        author: "Reading list",
        dek: "Robin Wall Kimmerer on reciprocity. Kate Raworth on doughnut economics. Bayo Akomolafe on slowing down in urgent times.",
        readTime: "6 min",
        caption: "ph · stack of books on wool blanket"
      },
      {
        kind: "field",
        kicker: "Restoration · Pacific Northwest",
        title: "A river remembered",
        author: "Klamath dam removal, one year on",
        dek: "The largest dam removal in U.S. history is letting a watershed find its own shape again. Field notes from the lower river.",
        readTime: "10 min",
        caption: "ph · river bend at dawn, undammed"
      },
      {
        kind: "letter",
        kicker: "Practice",
        title: "On working slowly",
        author: "A note from the editor",
        dek: "Why Hearth keeps a small reading list, on purpose.",
        readTime: "3 min",
        caption: "ph · handwritten margin notes"
      },
    ],
    shelf: [
      { name: "Bryan Stevenson", note: "Equal Justice Initiative" },
      { name: "Wangari Maathai's legacy", note: "Green Belt Movement" },
      { name: "Studio Gang", note: "Civic architecture" },
      { name: "Ruth Asawa Foundation", note: "Art as public right" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ATTUNE — mood → song + book.
  // Music selections lean on research on sad-music & emotion
  // regulation (Sachs, Damasio, Habibi 2015) and on familiar
  // music & nostalgia (Sedikides, Wildschut). Pieces below are
  // chosen for evidence-suggested calming or uplifting effects.
  // ─────────────────────────────────────────────────────────────
  attuneArchetypes: [
    {
      key: "tender",
      keywords: ["sad", "grieving", "heavy", "tender", "missing", "lonely"],
      readingOfYou: "Something tender is asking to be held.",
      science: "Slow, melancholic music can deepen — and then ease — felt sadness, a process linked to lower cortisol and a sense of being accompanied (Sachs et al., 2015).",
      song: {
        title: "Spiegel im Spiegel",
        artist: "Arvo Pärt",
        why: "63 BPM. Two voices, no rush. It will sit with you, not over you."
      },
      book: {
        title: "The Wild Edge of Sorrow",
        author: "Francis Weller",
        why: "An invitation to let grief be a practice, not an emergency."
      }
    },
    {
      key: "restless",
      keywords: ["anxious", "wired", "spiraling", "restless", "buzzing", "panicky"],
      readingOfYou: "Your nervous system is moving faster than the room.",
      science: "Slow tempos (60–80 BPM) and predictable structure can entrain heart rate and reduce sympathetic arousal (Bernardi et al., 2006).",
      song: {
        title: "Avril 14th",
        artist: "Aphex Twin",
        why: "A simple piano, played the way breath returns."
      },
      book: {
        title: "When Things Fall Apart",
        author: "Pema Chödrön",
        why: "Short chapters for a mind that can't settle. Begin anywhere."
      }
    },
    {
      key: "alight",
      keywords: ["happy", "alive", "alight", "joyful", "energized", "in love", "grateful"],
      readingOfYou: "Stay here a moment. Savoring extends the glow.",
      science: "Deliberate savoring — naming and noticing positive states — predicts higher well-being weeks later (Bryant & Veroff, 2007).",
      song: {
        title: "Harvest Moon",
        artist: "Neil Young",
        why: "Joy that doesn't shout. Slow-dance tempo."
      },
      book: {
        title: "Bittersweet",
        author: "Susan Cain",
        why: "On why our brightest moments live next to our most tender ones."
      }
    },
    {
      key: "uncertain",
      keywords: ["lost", "stuck", "uncertain", "scared", "unsure", "doubt"],
      readingOfYou: "Not lost — between rooms.",
      science: "Self-distancing language (\"you\" instead of \"I\") in writing about uncertainty improves problem-solving and lowers reactivity (Kross, 2014).",
      song: {
        title: "An Ending (Ascent)",
        artist: "Brian Eno",
        why: "Spaciousness for thoughts that need air."
      },
      book: {
        title: "Letters to a Young Poet",
        author: "Rainer Maria Rilke",
        why: "\"Live the questions now.\" A century old, still on time."
      }
    },
    {
      key: "hopeful",
      keywords: ["hopeful", "open", "curious", "ready", "starting", "beginning"],
      readingOfYou: "The door is open. Walk through gently.",
      science: "Best-possible-self visualization paired with a small, concrete next step strengthens follow-through (King, 2001; Gollwitzer).",
      song: {
        title: "On the Nature of Daylight",
        artist: "Max Richter",
        why: "A swelling that asks nothing of you. Just listen."
      },
      book: {
        title: "Braiding Sweetgrass",
        author: "Robin Wall Kimmerer",
        why: "Hope as practice, rooted in reciprocity."
      }
    },
  ],

  // Sample free-write seeds (placeholder text)
  attuneSeeds: [
    "I feel quietly tender today. The morning was heavier than I expected.",
    "I'm a little wired — too many tabs open, in my head and on the screen.",
    "I'm grateful and a bit afraid of how good this feels.",
    "I don't know what I want. Just sitting with that.",
  ],

  // ─────────────────────────────────────────────────────────────
  // RITUALS — short, science-backed practices.
  // ─────────────────────────────────────────────────────────────
  rituals: [
    {
      key: "breath",
      name: "Box breathing",
      lineage: "Vagal tone · Navy SEAL & clinical use",
      duration: "4 minutes",
      pattern: "4 · 4 · 4 · 4",
      blurb: "Inhale 4, hold 4, exhale 4, hold 4. Equal-ratio breathing increases heart-rate variability and dampens the stress response within minutes."
    },
    {
      key: "gratitude",
      name: "Three good things",
      lineage: "Seligman et al., 2005",
      duration: "5 minutes",
      pattern: "3 things · why · your part",
      blurb: "One of the most replicated positive-psychology interventions: depressive symptoms down, well-being up at 6 months."
    },
    {
      key: "awe",
      name: "Awe walk",
      lineage: "Sturm, Keltner, 2020",
      duration: "15 minutes",
      pattern: "walk · notice · expand",
      blurb: "A weekly walk with attention turned outward toward the vast or beautiful. Older adults reported greater daily joy and pro-social emotion in an 8-week trial."
    },
    {
      key: "values",
      name: "Values check-in",
      lineage: "ACT · Hayes",
      duration: "8 minutes",
      pattern: "weekly",
      blurb: "Pick the values most alive for you this week. Rate how much your time matched them. Choose one small move toward, not away."
    },
    {
      key: "shutdown",
      name: "Shutdown ritual",
      lineage: "Newport · Deep Work",
      duration: "6 minutes",
      pattern: "review · capture · close",
      blurb: "A consistent close-of-day routine reduces work-rumination, improves sleep onset, and protects the boundary between effort and rest."
    }
  ],

  values: [
    "Care", "Craft", "Courage", "Curiosity", "Honesty",
    "Service", "Patience", "Play", "Justice", "Wonder",
    "Discipline", "Friendship", "Faith", "Place", "Health"
  ],

  shutdownChecklist: [
    "Capture every loose thread on paper.",
    "Decide the first thing to do tomorrow.",
    "Close all tabs. Yes, all of them.",
    "Tidy one surface in the room.",
    "Say, out loud: \"the work day is complete.\""
  ],
};
