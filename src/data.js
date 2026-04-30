// Hearth — content & data
// Sources noted in comments where relevant.

export const HEARTH_DATA = {

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
      prompt: "Imagine yourself a year from now, having lived this year well. What does your day look like, who are you with, what are you working on, what feels different in your body?"
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
      prompt: "Wish, what do you want today? Outcome, how will you feel when it's done? Obstacle, what inside you might get in the way? Plan, what will you do when the obstacle arrives?"
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
      prompt: "Three things that went well today, however small. For each, why did it go well? What part did you play?"
    },
    {
      title: "Expressive writing",
      lineage: "Pennebaker, 1997",
      prompt: "Write continuously for the next ten minutes about something on your mind. Don't edit. Don't worry about grammar. Let the deepest layer surface."
    },
    {
      title: "Letter of self-compassion",
      lineage: "Neff, 2003",
      prompt: "If a dear friend had your day, what would you say to them tonight? Now, write that, to yourself."
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
      dek: "Five conversations with people whose practice is repair, of soil, of cities, of the way we speak to each other.",
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
        dek: "Massimo Bottura's nonprofit feeds dignity, not leftovers, and rewrites who gets to eat well.",
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
      science: "Slow, melancholic music can deepen, and then ease, felt sadness, a process linked to lower cortisol and a sense of being accompanied (Sachs et al., 2015).",
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
      science: "Deliberate savoring, naming and noticing positive states, predicts higher well-being weeks later (Bryant & Veroff, 2007).",
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
      readingOfYou: "Not lost, between rooms.",
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
    "I'm a little wired, too many tabs open, in my head and on the screen.",
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

  // ─────────────────────────────────────────────────────────────
  // DAILY QUOTES — rotates by day-of-year. Curated to fit Hearth's
  // editorial register (Aesop / Frama / NYRB). Voices the system
  // prompt already trusts: Mary Oliver, Wendell Berry, Annie Dillard,
  // Marilynne Robinson, Jane Kenyon, Ross Gay, Ada Limón, Mary Ruefle,
  // Rebecca Solnit, Kathleen Norris, John Berger, James Baldwin,
  // Maggie Nelson, Wisława Szymborska, Tomas Tranströmer, Rilke.
  // ─────────────────────────────────────────────────────────────
  dailyQuotes: [
    { text: "Tell me, what is it you plan to do with your one wild and precious life?", author: "Mary Oliver", source: "The Summer Day", year: 1990 },
    { text: "Attention is the beginning of devotion.", author: "Mary Oliver", source: "Upstream", year: 2016 },
    { text: "I don't know exactly what a prayer is. I do know how to pay attention, how to fall down into the grass, how to kneel down in the grass.", author: "Mary Oliver", source: "The Summer Day", year: 1990 },
    { text: "When despair for the world grows in me, I come into the peace of wild things who do not tax their lives with forethought of grief.", author: "Wendell Berry", source: "The Peace of Wild Things", year: 1968 },
    { text: "Be joyful though you have considered all the facts.", author: "Wendell Berry", source: "Manifesto: The Mad Farmer Liberation Front", year: 1973 },
    { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard", source: "The Writing Life", year: 1989 },
    { text: "Beauty and grace are performed whether or not we will or sense them. The least we can do is try to be there.", author: "Annie Dillard", source: "Pilgrim at Tinker Creek", year: 1974 },
    { text: "Memory believes before knowing remembers.", author: "Marilynne Robinson", source: "Gilead", year: 2004 },
    { text: "There is a reason that we are alone, each of us, in our bodies, and it is so we can attend to one another.", author: "Marilynne Robinson", source: "Gilead", year: 2004 },
    { text: "I had not known I was so tired.", author: "Jane Kenyon", source: "Otherwise", year: 1996 },
    { text: "It might have been otherwise.", author: "Jane Kenyon", source: "Otherwise", year: 1996 },
    { text: "My delight is sturdier than your contempt.", author: "Ross Gay", source: "The Book of Delights", year: 2019 },
    { text: "What if joy is the practice of survival?", author: "Ross Gay", source: "Inciting Joy", year: 2022 },
    { text: "Even the smallest of attentions is a kind of love.", author: "Ada Limón", source: "The Hurting Kind", year: 2022 },
    { text: "We are made of all those who have built and broken us.", author: "Ada Limón", source: "Bright Dead Things", year: 2015 },
    { text: "The best things in life are silly.", author: "Mary Ruefle", source: "Madness, Rack, and Honey", year: 2012 },
    { text: "Hope is not a lottery ticket; it is an axe you break down doors with in an emergency.", author: "Rebecca Solnit", source: "Hope in the Dark", year: 2004 },
    { text: "The grounds for hope are in the shadows, in the people who are inventing the world while no one looks.", author: "Rebecca Solnit", source: "Hope in the Dark", year: 2004 },
    { text: "Love is the will to extend one's self for the purpose of nurturing one's own or another's spiritual growth.", author: "Kathleen Norris", source: "The Cloister Walk", year: 1996 },
    { text: "We who draw do so not only to make something visible to others, but also to accompany something invisible to its incalculable destination.", author: "John Berger", source: "Berger on Drawing", year: 2005 },
    { text: "I imagine one of the reasons people cling to their hates so stubbornly is because they sense, once hate is gone, they will be forced to deal with pain.", author: "James Baldwin", source: "Notes of a Native Son", year: 1955 },
    { text: "There is never a single approach to something remembered.", author: "Maggie Nelson", source: "Bluets", year: 2009 },
    { text: "We're extremely fortunate to not know precisely the kind of world we live in.", author: "Wisława Szymborska", source: "Nobel Lecture", year: 1996 },
    { text: "Our skill is keeping the right distance.", author: "Tomas Tranströmer", source: "The Half-Finished Heaven", year: 2001 },
    { text: "Be patient toward all that is unsolved in your heart and try to love the questions themselves.", author: "Rainer Maria Rilke", source: "Letters to a Young Poet", year: 1903 },
    { text: "Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage.", author: "Rainer Maria Rilke", source: "Letters to a Young Poet", year: 1904 },
    { text: "I am the rest between two notes.", author: "Rainer Maria Rilke", source: "The Book of Hours", year: 1905 },
    { text: "I want to beg you, as much as I can, to be patient toward all that is unresolved.", author: "Rainer Maria Rilke", source: "Letters to a Young Poet", year: 1903 },
    { text: "There are years that ask questions and years that answer.", author: "Zora Neale Hurston", source: "Their Eyes Were Watching God", year: 1937 },
    { text: "Fairy tales do not tell children the dragons exist. Children already know that dragons exist. Fairy tales tell children the dragons can be killed.", author: "G.K. Chesterton", source: "Tremendous Trifles", year: 1909 },
    { text: "Tell the truth but tell it slant, Success in Circuit lies.", author: "Emily Dickinson", source: "Poem 1129", year: 1872 },
    { text: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson", source: "Poem 254", year: 1862 },
    { text: "We must be still and still moving into another intensity.", author: "T.S. Eliot", source: "Four Quartets", year: 1942 },
    { text: "What we call the beginning is often the end. And to make an end is to make a beginning.", author: "T.S. Eliot", source: "Little Gidding", year: 1942 },
    { text: "Stop the words now. Open the window in the center of your chest, and let the spirits fly in and out.", author: "Rumi", source: "The Essential Rumi", year: 1995 },
    { text: "What you seek is seeking you.", author: "Rumi", source: "The Essential Rumi", year: 1995 },
    { text: "Even after all this time the sun never says to the earth, you owe me. Look what happens with a love like that. It lights the whole sky.", author: "Hafiz", source: "The Gift", year: 1999 },
    { text: "Some part of our being knows this is where we came from. We long to return.", author: "Carl Sagan", source: "Cosmos", year: 1980 },
    { text: "We are an impossibility in an impossible universe.", author: "Ray Bradbury", source: "Yestermorrow", year: 1991 },
    { text: "Owe nothing to anyone except for love.", author: "Romans 13:8", source: "letter to the Roman church", year: 60 },
    { text: "Patience is the companion of wisdom.", author: "Augustine", source: "On Patience", year: 418 },
    { text: "There is a crack in everything. That's how the light gets in.", author: "Leonard Cohen", source: "Anthem", year: 1992 },
    { text: "Forget your perfect offering.", author: "Leonard Cohen", source: "Anthem", year: 1992 },
    { text: "The world is not respectable; it is mortal, tormented, confused, deluded forever; but it is shot through with beauty, with love, with glints of courage and laughter.", author: "George Santayana", source: "Soliloquies in England", year: 1922 },
    { text: "We must not cease from exploration. And the end of all our exploring will be to arrive where we began and to know the place for the first time.", author: "T.S. Eliot", source: "Little Gidding", year: 1942 },
    { text: "It is not how busy you are, but why you are busy.", author: "Mary Oliver", source: "Of Power and Time", year: 2016 },
    { text: "I want to think again of dangerous and noble things.", author: "Mary Oliver", source: "Have You Ever Tried to Enter the Long Black Branches?", year: 1999 },
    { text: "Tomorrow do thy worst, for I have lived today.", author: "Horace", source: "Odes", year: -23 },
    { text: "All shall be well, and all manner of thing shall be well.", author: "Julian of Norwich", source: "Revelations of Divine Love", year: 1395 },
    { text: "We do not believe in ourselves until someone reveals that deep inside us something is valuable, worth listening to, worthy of our trust.", author: "E.E. Cummings", source: "A Miscellany", year: 1958 },
  ],
};
