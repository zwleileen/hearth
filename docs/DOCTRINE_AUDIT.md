# Hearth — doctrine audit and refinements

> A record of a full review of Hearth against its own principles, what
> survived, what was wrong, and what shipped as a result.
> Written 2026-08-09. Companion docs: `HEARTH_BRAND_BRIEF.md` (the
> doctrine), `MEANING.md` (the north star), `STATUS.md` (where things are).

---

## 0. Why this document exists

Hearth was reviewed twice: once as a consumer product, once through a
clinical lens. The second review was more rigorous than the first and
more wrong, because it drifted into treating Hearth as a therapy app.
It is not one, and the brief already said so.

This document records the audit, so the reasoning is not lost and the
same mistake is not made again by anyone, including a future session of
this work.

**The line that governs everything below:** Hearth is not a counselling
app, a therapy app, or a crisis service. It is a daily home where anyone
can find and build their own meaning, in the moment. It uses the most
robust ideas available about how people find meaning, and it hides every
one of them behind an ordinary human experience.

---

## 1. Are the original principles robust?

Tested one by one. Nearly all hold.

| Principle (BRAND_BRIEF §6) | Verdict |
|---|---|
| 1. The method is invisible; the experience is human | **Holds**, with one refinement (§3.1) |
| 2. Self-transcendent, not self-absorbed | **Holds, and is under-built.** The doctrine is right and the product contradicted it: five surfaces invited reflection, and Give, the one that turns a person outward, was the thinnest screen in the app |
| 3. Provisional and revisable | **Holds, and was being violated.** See §2.1 |
| 4. Evidence, not novelty | **Holds, and was being violated.** See §2.2 |
| 5. Restraint | **Holds**, with one refinement (§3.3) |
| Positioning: never position by contrast | **Holds**, with one refinement (§3.2) |
| Safety §5.9: a companion, not a clinician | **Holds, emphatically.** This is the principle that caught the clinical review's worst suggestion |

The architecture (Give · Receive · Carry as literal navigation) is the
strongest thing about Hearth and needs no revision. It is a real
information architecture derived from a real idea, which almost nothing
else in the category has.

The Carry session's method block (`server/lib/kindlePrompt.js`) is also
unusually good and was left substantially alone. Two clauses in
particular are load-bearing and should never be removed:

- *"Not every feeling is a weight"* — the instruction to savour rather
  than to fix when someone brings joy. Almost every AI wellbeing tool
  pathologises. This one does not.
- *"Someone had it worse is forbidden"* — with the mirror allowed to be
  an image or a parable rather than a person, which is the elegant way
  out of the comparative-suffering trap.

---

## 2. Where the product was contradicting its own doctrine

These were not new ideas. They were places where the code had drifted
from the brief, and they were fixed.

### 2.1 The app was filing a verdict on the reader

`MEANING_NARRATIVE_SCHEMA` says "provisional… never a verdict, never a
personality type", on Frankl's caution against typology (§5.6). The
screen printed three declarative lines about a person's life with no way
to answer back. An app telling someone who they are is the exact
authority inversion the brief exists to prevent.

**Shipped:** every row of the glance can now be affirmed ("yes, that's
it") or replaced in the reader's own words. Their wording wins on render
and is never overwritten by a re-weave. `own` and `affirmed` are
deliberately excluded from the `$set` list in `routes/narrative.js`.

### 2.2 The evidence copy over-claimed

Principle 4 is "evidence, not novelty", and the voice rules forbid
overstating a finding. Three blurbs stated 2005-era effect sizes at full
strength. Later meta-analytic work correcting for small-sample bias puts
positive-psychology intervention effects well below the original
reports, and the awe-walk citation was a trial of 52 older adults.

**Shipped:** honest copy. Quieter, and true, which is also better copy.

### 2.3 Three Good Things had lost its active ingredient

The protocol is three things *and*, for each, why it went well and what
your own part in it was. That causal attribution is the mechanism: it is
what turns "nice things happened to me" into "I had a hand in this". The
instruction was in the header and the UI gave one undifferentiated box,
so in practice people wrote "coffee with Sam" and stopped.

**Shipped:** two fields per row, the second appearing once the first is
filled.

### 2.4 The care backstop covered one surface in four

`careFlag` existed only in Carry. The journal — the longest free-text
field in Hearth, written at night — had nothing. Detection also only
caught stated intent, and real distress is written obliquely. The hotline
list was Singapore-only, so a reader anywhere else was handed numbers
they could not call.

**Shipped:** `server/lib/care.js`, shared by Carry, the journal and
Attune; oblique-phrasing detection; region-aware lines derived from the
reader's own time zone, with findahelpline.com always appended.

### 2.5 Design-doctrine violations in shipped code

- Side-stripe accent borders (banned, §8.9) in the care block, the Carry
  error blocks, and the Attune excerpt → full Isabelline blocks.
- Gradient chrome (banned, §8.4) on the Settings and Profile avatars →
  flat Ecru.
- Glassmorphism and 24px radii (banned, §8.5/§8.9) in the share sheet
  and the reminders mock → removed with them.
- Botanical sprig code — gradients, 16px radii, leaf glyphs — left over
  from a retired onboarding step, rendered by nothing. Deleted.

### 2.6 Placeholders and promises that were not kept

- The journal's writing timer read a hardcoded `03:42` for everyone, on
  every entry, forever. It counts now.
- The breath ritual read `Cycle 02 of 06` for its whole four minutes. It
  counts now, and completes.
- The share sheet was four buttons with no click handlers.
- Onboarding promised "we'll send one quiet nudge, and only one". Nothing
  sends. The copy no longer promises it, and the reminders screen, a
  mock with no scheduler behind it, was deleted rather than left to imply
  a feature that does not exist. It returns when push is real.

---

## 3. Refinements to the doctrine itself

Four. Each is recorded in `HEARTH_BRAND_BRIEF.md` §6.

### 3.1 Invisible method, visible language

"The method is invisible" is right and, applied at full strength, leaves
the reader with no words for what happened to them. People only spread
what they can name.

The vocabulary already exists: **Give, Receive, Carry**. Lean on it until
people say it out loud. *"I'm having a Carry day."* That is how a frame
travels. Frankl stays invisible; the three words become common speech.

### 3.2 The rule governs sentences; the product makes the argument

"Never position by contrast" is right for copy — stated contrast is
defensive and cheap. But every category-defining product has a felt
enemy, and Hearth's is the doom-scroll and the self-optimisation
treadmill. Do not say it. Show a screen with one line on it and let the
contrast land in the body.

### 3.3 Restraint forbids ten moments of magic, not one

"If an element is not earning its place, it is removed" is good
discipline that had produced an app with no moment of surprise anywhere
in it. The doctrine already names where the one moment belongs: light
that accumulates (§8.9). It had never been built.

### 3.4 Single-player by default, two-player by design

Nothing in the docs said Hearth is solitary; everything was built that
way, which quietly contradicts "self-transcendent, not self-absorbed".
Give is where another person enters. Now stated, so the roadmap follows.

---

## 4. What was retracted, and why

Recorded because these were argued for at length and are wrong.

**A safety plan (Stanley & Brown).** Well-evidenced, standard of care,
and completely wrong here. §5.9 is explicit that Hearth is meaning-centred
and not crisis intervention. Building a safety plan makes Hearth a crisis
product, imports a duty of care nobody can staff, and puts a clinical
artifact inside a home for meaning. The care block hands someone a real
number and gets out of the way. That is the whole remit.

**PHQ-2 / GAD-2, visible or hidden.** Medicalises a non-clinical product,
generates false positives nobody can triage, and invites regulatory
attention. No.

**A validated questionnaire for measurement.** The lineage is sanctioned
(§5.6 cites both the Purpose in Life Test and the Meaning in Life
Questionnaire) but a ten-item scale on screen is not. The invisible form
is one question a season, in Hearth's own voice, never scored back to the
reader. Designed, not yet built.

**Clinical vocabulary in the specification.** "Alliance", "rupture
repair", "outcome monitoring", "contraindicated". Teams build the
language they are given: write "rupture repair" and someone ships a
feedback widget. The same mechanic, correctly framed, is *the reader is
the author, so the app must be correctable*.

---

## 5. What shipped

| Refinement | Where |
|---|---|
| Co-authored narrative: affirm a row, or replace it in your own words | `routes/narrative.js`, `models/MeaningNarrative.js`, `screens-1.jsx` |
| "That's not quite it": correct the seeing, and the session moves on from your version | `routes/kindle.js`, `lib/kindlePrompt.js`, `screens-5.jsx` |
| Let the fire know you: the narrative and recent sessions, in the reader's own words only, as context to listen with | `lib/kindlePrompt.js`, `routes/kindle.js` |
| "Stay a moment": name it, three breaths with a longer out-breath, where it sits, let it settle | `src/savour.jsx`, wired into Attune, Three Good Things, the awe walk, and a turning |
| A letter: written here, typeset, and actually sent | `src/letter.jsx`, `src/share.jsx` |
| Give asks who it is for | `screens-1.jsx`, `models/MeaningLog.js` |
| The shareable line, drawn on the reader's own device | `src/share.jsx` |
| The accumulating light, which can only ever grow | `screens-1.jsx`, `styles.css` |
| The hero yields: after enough kept lines, yours takes the masthead | `screens-1.jsx` |
| One question, asked of everyone, today | `screens-1.jsx` |
| Care on all four free-text surfaces, oblique detection, region-aware lines | `lib/care.js`, `src/care.jsx`, three routes |
| The session's own voice, and a temperature that suits a reflection | `lib/ai.js`, `lib/kindleRunner.js` |
| Three Good Things: the attribution restored | `screens-2.jsx` |
| Honest evidence copy; placeholders replaced; banned styling removed | `data.js`, `screens-1/2/3/4/5.jsx` |

### Notes on two choices

**The breath.** Carry keeps box breathing (4·4·4·4); its job there is to
bring a loud feeling down. The savour beat uses a longer out-breath,
because its job is to settle something in. Different instrument, same
brand. The evidence for exhale-biased breathing on mood is good and
recent but rests largely on one trial, so it is used where the stakes are
low and box breathing keeps the steadying role.

**What was deliberately not built.** Holding a good thing alongside a
hard one, so the good gradually softens the hard, is the deepest idea in
the savouring literature and is structurally the same move as saying yes
to life in spite of it. It is also the one that can flood someone when
the hard thing is too big. It needs the care flag clear, explicit opt-in,
and the positive kept firmly in the foreground. Recorded here rather than
half-built.

---

## 7. A reversal: quotation marks belong to the canon

Shipped, then reverted the same day, and recorded because the mistake is
an easy one to make again.

The home hero briefly yielded: once a reader had kept five lines, one of
**their** lines took the masthead in display Fraunces, inside curly
quotes, where Mary Oliver had been. The reasoning was sound — an app
about building your own meaning should not let a borrowed sentence own
its largest space forever.

The execution was wrong, and wrong in a way that matters to the brand.
A private, tender line ("Yong, for always being the open hearted,
generous optimist. He is the light.") set as an epigraph does not read as
moving. It reads as self-important. Personal writing and literature are
different registers, and the display-quote treatment is a claim the
sentence cannot support.

It also spends something Hearth cannot afford to spend. Quotation marks
carry weight only while they mean *someone wrote this, in a book, and it
lasted*. Put them around everything and they mean nothing, and the whole
restrained editorial register goes with them.

**The rule, from here:** the quote hero, and the quotation-mark treatment
anywhere, is for **actual quotations** — books, poems, philosophers,
scripture, the mystics. The pool (49 entries: Oliver, Berry, Dillard,
Robinson, Rilke, Dickinson, Eliot, Szymborska, Tranströmer, Baldwin,
Hurston, Julian of Norwich, Augustine, Rumi, Hafiz) is exactly right and
should stay that standard.

The reader's own words are set **plainly**: dated, smaller, in "what
you've been noticing", which is the register they actually want. On a
shared card, `quoted` now defaults to false, so a personal line is set
without marks and only a genuine quotation gets them.

Small, muted, in-context echoes of what the reader wrote ("You wrote:
…" in a Carry session, the mood line above a past Attune reading) are
fine and stay. Those are reported speech, not epigraph.

The underlying point still stands and is still unsolved: the reader's own
meaning deserves a home more prominent than a list below the fold. The
answer is a different form, not a bigger font.

---

## 8. What may be shared, and what may not

The first pass put sharing on the meaning log and on journal entries.
Asked what the principle was, there turned out not to be a clean one:
the meaning log was right on purpose and the journal was right by
accident, because a dead `ShareSheet` component was already sitting in
that file and got repaired rather than deleted. Archaeology, not design.

**The principle, stated properly.** Hearth only offers to share
something where the sharing is itself a meaning act (`MEANING.md` §6:
self-transcendence is the loop, so sharing must be giving and never
broadcasting). That sorts everything a reader writes or receives into
three kinds:

| Kind | Examples | Shareable |
|---|---|---|
| Conclusions | a kept line, the keepsake from a turning | **Yes.** Short, arrived-at, and able to stand outside your life because they do not need your life explained first |
| Quotations | the daily quote, a saved poem or passage, the line a mirror is remembered for | **Yes**, and these are the only things allowed the quote marks (§7) |
| Elsewhere | a reading-room piece, a saved article, a song | **Yes**, as a link. The object is the thing, not a picture of its title |
| Drafts and confessions | a journal entry, the feeling brought to Carry, the mood typed into Attune | **No** |

The short form: **share what gives, do not broadcast what needs
explaining.** A letter is neither; it is giving, and it has its own
screen.

**Why the journal is a hard no**, beyond being confessional: it was
sharing `body.split(/\n+/)[0]`, the *first* line of the entry, on a page
whose own placeholder reads "Begin anywhere. Don't edit." The first line
of unedited writing is reliably its least considered sentence, so the
feature took the most private text in Hearth and published its worst
one. There is also a mechanism argument: expressive writing works partly
because it is unwitnessed, and a shareable journal quietly turns people
into writers-for-an-audience, which makes the entries worse. The journal
keeps *copy*, which moves something you own somewhere else you own.

**Where sharing was missing.** The Nook had none, which is the same
error in reverse: everything in it is someone else's already-public
work, so there is no exposure at all, and a saved poem or passage is a
genuine quotation. Under the principle it should have had sharing before
the journal ever did. Also added: the daily quote (the single most
obviously shareable object in the app), reading-room pieces, Attune's
songs, passage and poem, and the Carry mirror and its line.

All of it goes through one `ShareLink` component: a quiet mono link,
never an icon. An icon on every object is itself the tacky thing.

**What the message says.** The first version put the quote in the image
and then the same quote in the message body, so the recipient read the
same sentence twice and the whole thing looked automated. Two shapes now:

- **Card shares** (the words are already in the image): the message is
  what you would actually type when handing something to someone, then a
  blank line, then `Hearth, a daily home for meaning.` and the app's own
  address. Never the words again.
- **Link shares** (no image): the message names the thing and carries the
  external link only. No Hearth address; the object belongs to someone
  else, and two links in one message is clutter.

The address comes from `window.location.origin`, so a shared card always
points back to wherever Hearth is actually running, with nothing to
configure and nothing to keep in sync with a deploy.

The lines live in `SHARE_MESSAGE` in `src/share.jsx`, one per kind of
object, and they went through two drafts worth recording.

"In case it resonates" is unusable: `REFLECTION_VOICE` bans "resonate"
along with "journey", "navigate", "holds space" and "speaks to". The
replacement, "in case it finds you too", avoided the banned word and
introduced a worse problem: it is abstract, and it has the tell of
machine-written warmth, gesturing at feeling without saying anything a
person would actually say.

The rule that settled it: **if a line could not be typed with one thumb
while walking, it is wrong.** Nobody sending a poem writes "in case it
finds you". They write "this made me think of you". Every line is now
short, first person, and about the real reason you are sending it.
Longest is 29 characters.

The register elsewhere in Hearth is literary because a reader is alone
with it. A share message is not read by the reader; it is read by their
friend, in a message thread, next to everything else in their life. It
has to sound like the person who sent it, not like the app.

---

## 9. Listening

Attune recommended three songs, with a real reason each, and gave the
reader no way to hear any of them. The next move was to retype the title
into another app, at the exact moment their intent was highest.

**Shipped:** a search deep link per song, plus a one-tap switch between
Spotify, Apple Music and YouTube Music, remembered per device. Universal
`https` links rather than `spotify:` URI schemes, because a URI scheme
fails silently on a device without the app, and a tap that does nothing
is the worst outcome available.

**Not shipped, and what it would take.** Resolving the *exact* track
instead of a search needs the Spotify Web API: a developer app, a client
ID and secret in Render's environment, a client-credentials token cache,
and a resolver that runs once per reading and stores the resulting URL
on the `AttuneEntry`. Roughly half a day, and it is blocked on
credentials only the account owner can create. It buys a direct link and
album art. Note that Spotify restricted `preview_url` for new API
clients in late 2024, so in-app 30-second previews should not be
promised. A full per-user OAuth connection ("save this reading as a
playlist") is a multi-day piece and only worth it if Attune becomes the
primary loop.

---

## 10. Receive, rebuilt

The reading room was six to ten interest-matched pieces a day. It was
the weakest surface in the app and the diagnosis turned out to be
structural rather than a curation problem.

**The asymmetry.** Attune works because it is *state-driven*: you bring
how you are, and it meets you. The reading room was *topic-driven*: you
ticked interests once, months ago, in a grid, and it fetched matching
articles forever. State-driven is Hearth. Topic-driven is the mechanic
of every content app ever built, and it was competing with products that
do topic-matching better, faster, and with more volume. No amount of
better curation fixes that; the prompt was already well engineered, with
interest rotation and anti-repetition memory. It was sophistication in
service of the wrong mechanic.

**The doctrinal mismatch.** Frankl's experiential values are "goodness,
truth and beauty… nature and culture… another human being in his very
uniqueness". The reading room delivered *subjects*. Everything in
Receive was also text, at one temperature, and most of what Frankl lists
is not verbal.

**And it was a queue.** Ten items accrue guilt, which the app refuses
everywhere else, and you cannot stay with ten things, which made the
savour beat incoherent wherever it was attached.

### 10.1 What replaced it

**One thing worth stopping for, shared by everyone, every day.** An
image, an object, a place, one astonishing fact. Two sentences at most,
no argument, nothing to finish. Then the savour beat, which finally has
something to stay with.

Shared rather than personalised, for three reasons: it makes the day an
event ("today, everyone at Hearth stopped for this", the same reasoning
that made the daily question shared); beauty and scale are not topics,
so there is nothing to match; and it takes the cost of the surface from
one generation per reader per day to one generation per day.

Variety now comes from a rotating **register** rather than from topic
breadth: something *vast* (awe, scale), something *made* (craft, art),
something *true* (a fact stranger than it has a right to be), something
*overlooked* (the small thing seen properly), and occasionally *read*
(one piece of writing genuinely worth a whole reading). Four of those
five map directly onto Frankl's list.

### 10.2 A considered rejection: "one person a day"

The first proposal was a daily exemplar, a portrait of someone who lived
well. It was wrong and is recorded here because it was nearly built.

Frankl's "experiencing another human being" means encounter with a real
person in their uniqueness, by loving them. It does not mean reading
about an admirable stranger. A daily exemplar is a **meaningful model**,
and the function of a meaningful model is to widen your sense of what
stance is available toward difficulty. That is *attitudinal*. That is
Carry.

It would also have duplicated Carry's mirror while being strictly worse:
the mirror is chosen for the thing you brought today, takes whichever
form fits (person, story, image, parable), arrives when you need it, and
is actively diversified against your last six. A scheduled generic
exemplar has none of that, and delivering figures who bore things well
*unprompted* edges toward the comparative-suffering framing the Carry
prompt explicitly forbids.

The lesson: "this mechanism works well" is not the same as "this
mechanism belongs in this avenue."

### 10.3 Encounter, which was the real gap

Frankl ranks encounter highest within experiential values, and Hearth
had no surface for the people actually in a reader's life as meaning
*received*. Give has the letter, which turns outward; this is the
receiving half.

One question does the work: **"What did you notice that most people
would walk past?"** It asks for something about *them*, not about what
they did for you, which is the letter's frame and is still about your
own benefit. The constraint makes I-Thou operational without ever naming
it, and for the length of it a reader's attention is entirely off
themselves, which makes it the purest dereflection in the app.

Strangers count on purpose. If it only worked for people you are close
to it would become friendship admin and could only be done occasionally.

An optional third question, never a field: **"What can you see in them
that they might not see in themselves?"** Frankl held that seeing the
potential participates in bringing it about.

**The gallery groups by person, not by date.** Someone seen once shows
one line and is complete; someone seen across a year shows the sequence,
and reading that is the thing nothing else in Hearth holds.

**What it must never become.** Not a contact list. No cadence, no
last-seen, no counts, no reminders about a named person, nothing ever
overdue. The moment an app keeps a ledger of your relationships it has
made people into tasks, which is exactly the I-It relation encounter
exists to escape. Every personal-CRM product makes this mistake and it
is why they feel faintly shameful to use.

**"Tell them" was deliberately not built.** The letter already exists
and does that job.

### 10.4 The weighting rule

> **Noticing is free and unweighted. Keeping is deliberate and weighted.**

Encounters live in their own record and the meaning narrative never
reads them. If they did, a month of incidental noticing would produce a
portrait claiming that what moves this reader is baristas and strangers
at bus stops, which would be false and slightly absurd. Only an explicit
"this one mattered" writes a meaning-log line, so the reader stays the
author of what counts as their meaning. The rule generalises and should
be applied to any future surface that captures a lot of small input.

### 10.5 What that made obsolete, and was removed

Nothing read `interests` once the day's thing became shared, so asking
for them was asking a reader to do work that changed nothing. The
reading garden step is gone and onboarding is five steps instead of six.

Removed with it, all of it either replaced or never routed:

| Gone | Why |
|---|---|
| `ReadingRoomScreen`, `DiscoverScreen`, `ArticleScreen` | the reading room and its in-app reader |
| `/api/discover`, `DailyDiscover`, `DISCOVER_SCHEMA` | replaced by `/api/today`, `DailyThing`, `DAILY_THING_SCHEMA` |
| Reading garden (onboarding step 3, Settings section, profile field) | nothing read `interests` any more |
| `WeeklyDigestScreen`, `computeWeekly`, `/api/digest/bibliotherapy`, `WeeklyBibliotherapy`, `BIBLIOTHERAPY_SCHEMA` | orphaned since bibliotherapy moved into Attune as excerpts |
| `AttuneHistoryScreen` | a mock of five hardcoded readings, duplicating Attune's real logbook |
| `MiniPlayer` | a mock with no audio behind it, shown only by a dev toggle |
| `StreakBrokenScreen`, the streak tweak | Hearth refuses streaks; this was the last of that vocabulary |
| `RitualsScreen`, `RitualBuilderScreen` | never routed; a scheduler for practices is cadence, which Hearth declined |
| `magazine`, `attuneArchetypes` fixtures | nothing rendered them |

`User.onboarding.interests` stays on the schema. The field is harmless,
holds real data readers entered, and dropping it would need a migration
for no gain.

---

## 6. What is still open

Ranked. Nothing below is blocked by anything above.

1. **Notifications, done Hearth's way.** The single biggest lever on
   whether anyone returns. Note the clinical caveat: a daily nudge to
   look inward increases self-focused attention, which is the thing
   Hearth exists to interrupt. The default must be outward-turning
   ("someone could use you today"), introspective only on request.
2. **Password reset.** There is still no way back in for someone who
   forgets. For an app whose whole value is an accumulating record, this
   is the most damaging thing left in the codebase.
3. **Draft autosave**, then an offline shell.
4. **The seasonal question** (presence versus search, one line, never
   scored back).
5. **A season**: a finite, optional sequence through the sources of
   meaning, including the one Hearth has no home for at all — the
   meaning already made, the life lived, what you would hand on.
6. **Account deletion and export.**
7. **Play links in Attune.** Three songs are still recommended with no
   way to hear them.
8. **URLs.** Routing is `useState`, so there is no history, no deep
   link, and nothing to share. This blocks notification tap-through.
