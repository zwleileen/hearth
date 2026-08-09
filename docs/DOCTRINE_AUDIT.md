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
