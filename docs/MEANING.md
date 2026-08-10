# Hearth — the meaning redesign

> Status: strategy / design reference. This is the north star we build
> against, not a record of what is shipped. Drafted 2026-06.
> Audited and amended 2026-08-09; §6 is now substantially built. The
> reasoning, including what was retracted, is in `DOCTRINE_AUDIT.md`.

Hearth is being re-centred on one idea: **a daily home for your sense of
meaning**, grounded in Viktor Frankl's logotherapy, applied so naturally
that the method is invisible and the experience is just human.

---

## 1. Repositioning

Hearth is **the daily home for your sense of meaning.** Not a calm app,
not a mood tracker, not a journaling app. Those are *hedonic* (feel
better) or *self-optimisation* tools. Frankl's argument is that the
modern malaise is the **existential vacuum** — emptiness, boredom, "what
is the point" — and that chasing pleasure or self-improvement to fill it
deepens it. Every other wellness app turns the user *inward toward the
self*. Hearth turns the user *outward toward meaning*. That
self-transcendence is both the therapy and the growth engine (see §6).

Positioning line: **"Tend your why."**
(Nietzsche, via Frankl: *he who has a why to live can bear almost any how.*)

Position explicitly against mood / meditation / productivity apps:
**not calm, not optimised — meaningful.**

## 2. The one governing principle

**The method is invisible; the experience is human.**

A user must never see the words "logotherapy", "Frankl", "attitudinal
values", or take a quiz that feels clinical. They should feel *met,
moved, and pointed somewhere that matters.* Frankl's machinery runs
underneath; the surface is a thoughtful friend with exquisite taste.
This is what keeps Hearth from becoming a scripture app or a study app.
Internally rigorous, outwardly warm.

## 3. The spine — the meaning triangle becomes the architecture

Frankl: meaning is found three ways. These three become the information
architecture, in plain language.

The three avenues map onto a simple, instantly graspable polarity:
**give outward · receive inward · carry steady.**

| Avenue (Frankl)     | User-facing | What it means                                                          | Lives here                                  |
|---------------------|-------------|------------------------------------------------------------------------|---------------------------------------------|
| Creative values     | **Give**    | meaning through what you offer the world: the deed, the work, the thing only you can bring into being | deed of the day, contribution, generativity |
| Experiential values | **Receive** | meaning through what you let in: beauty, awe, love, another person      | Attune, the reading room, companions        |
| Attitudinal values  | **Carry**   | meaning through how you hold what you cannot change                     | Kindle (the turning), reframing             |

One consoling idea carries the whole structure: *there is always a door
to meaning, even when one or two are closed.* When work collapses (Give),
love and beauty remain (Receive); when everything is taken, the freedom
to choose your response remains (Carry). That is the most consoling thing
logotherapy offers, and it becomes the app's shape.

## 4. Every feature recast as an applied method

Nothing already built is wasted; each surface is re-pointed.

- **Kindle → the flagship "Carry."** Already pure logotherapy: Socratic
  dialogue + the companion (a real or literary figure who carried light
  through the same dark) + the turning. The heart of the app. Keep it.
- **Attune → "Receive, through sound."** Mood → songs / a book passage /
  a poem (affective bibliotherapy via the iso-principle) is already
  experiential-values meaning. **Built (2026-08):** "Stay a moment" now
  follows the listening, and it is more than the one tap this called for.
  Name what it reached, three slow breaths with a longer out-breath,
  where it sits in the body, then a beat where nothing is asked. Bryant
  and Veroff are the ground; Hanson supplies the encoding. Frankl says
  where meaning is found and is silent on how a found moment is kept;
  this is the missing half, and it is never named as a technique.
- **Reading room → replaced (2026-08).** The re-aim called for here was
  attempted and the diagnosis went deeper: the room was topic-driven,
  which is a feed, and no re-aiming fixes the mechanic. It is now **one
  thing worth stopping for**, shared by everyone, with a rotating
  register (vast, made, true, overlooked, and occasionally one real
  read). The awe register survives and is now central rather than a
  buried walk.
  The "lead with exemplars" half was **rejected on doctrine**: a daily
  portrait of someone who lived well is a meaningful model, which is
  attitudinal, which is Carry. It would have duplicated the mirror while
  being worse than it. See `DOCTRINE_AUDIT.md` §10.2.
- **Encounter → built (2026-08).** The real gap in Receive, and the one
  Frankl ranks highest: the people actually in your life, as meaning
  received. One person, looked at properly. Never a contact list.
- **Journal → "Socratic dialogue."** Replace generic prompts with
  logotherapy's actual technique: questions that draw out the person's
  *own* meaning, tagged by avenue. The crown jewel is the Copernican
  flip: **"What is life asking of you today?"** (not what I want from
  life, but what life wants from me). The weekly brief becomes **the
  Meaning Mirror.**
- **Nook → "Your sources of meaning."** Reframe the saved shelf from
  "bookmarks" to a personal anthology of what gives life meaning — the
  songs, people, lines, ideas one returns to. The weekly brief already
  reads the shelf; rename it to point at meaning.
- **Rituals → "Small acts of meaning."** Evidence-based interventions as
  repeatable practices, each tied to an avenue and a real technique:
  - **Dereflection** (Give/Receive): turn attention off the self and
    toward another — a deed of kindness, attention to someone who needs
    it. Frankl's antidote to anxiety / hyper-reflection.
  - **The deed of the day** (Give): one small thing only you can do.
  - **Savoring & awe** (Receive): a short awe walk, a gratitude letter
    (Lyubomirsky / Seligman).
  - **Paradoxical intention** (Carry): the playful technique for
    anxiety/insomnia, used lightly and with humour.

## 5. The daily loop — the habit hook

The home screen becomes **"The meaning of this moment."** Frankl held
that each situation poses a unique meaning waiting to be answered. One
gentle daily invitation, rotating through the three avenues:

- *Give day:* "Who could use something only you can give today?"
- *Receive day:* "What is one thing worth stopping for today?"
- *Carry day:* "What are you holding that you could carry differently?"

A one-line answer captures into a private **Meaning Log**, which over
time becomes a beautiful, visible record of a life being noticed — the
retention surface and the emotional payoff.

The question is **the same for everyone, every day**. This was originally
built per-user and that was a mistake: a question everyone is asked today
is an event, one generated privately for you is a notification. Frankl's
consolation is that nobody is alone in the dark, and a shared question is
the cheapest way to mean it.

**No aggressive streaks.** Guilt-based streaks contradict the philosophy
and the voice. Use a gentle continuity image: meaning *accumulates* like
light; it is not *lost* when a day is missed.

**Built (2026-08):** the accumulating light behind the home masthead,
growing with everything ever kept, governed by one rule — it can only
ever grow. No decay, no reset, no broken state. Loss aversion is the
engine of a streak and the point here is the opposite feeling.

**Tried and reverted:** the home hero yielding to the reader's own kept
line. A private line set in display serif inside curly quotes reads as
self-important, not moving, and it spends the quotation marks, which only
work while they mean "someone wrote this, in a book, and it lasted". The
quote hero is for the canon. The reader's own words are set plainly,
dated, below. The underlying problem is real and still open: their
meaning wants a more prominent home, in a different form, not a bigger
font. See `DOCTRINE_AUDIT.md` §7.

## 6. The growth engine *is* the methodology

Logotherapy's core mechanism is **self-transcendence**: meaning comes
from reaching beyond the self, usually toward another person. So the
viral loop is not a growth hack bolted on — it is the therapy.

- **A letter. Built (2026-08), and it is the centre of Give.** The reader
  writes what someone did and what it gave them; Hearth typesets it and
  it is actually sent. This is the loop and the method in one act: the
  sender benefits from the giving, and the person receiving it gets the
  most considered thing anyone has sent them this year. No referral
  scheme, no incentive, nothing to feel grubby about.
- **Shareable artifacts. Built (2026-08).** The atom is the kept **line**,
  not the journal entry: an entry is confessional and unshareable, one
  noticed line is a haiku. Cards are drawn on the reader's own device and
  handed to their own share sheet, so nothing about a person's inner life
  leaves Hearth to make this work. The restrained editorial design most
  wellness apps lack is exactly what gets screenshotted.
- **Gift a turning / gift a companion.** Still open. The keepsake from a
  turning is shareable as a card; sending a whole companion to a named
  friend is the next step.
- **Optional, later: a quiet wall of why.** Anonymised turnings /
  companions from others facing the same thing — solidarity, "you are
  not alone in this dark." High moderation cost; phase in only with
  resources to support it.

## 7. Personalisation — the Meaning Profile

A warm, **Socratic onboarding** (never a clinical quiz) that surfaces:
current sources of meaning, which avenue the user leans on, and their
"existential temperature" — Steger's distinction between *presence* of
meaning and *search* for meaning (the one validated construct, used
invisibly). This profile tunes every surface: which avenue to nudge,
which companions to choose, what the reading room surfaces. The spine for
this already exists (diversity windows, weekly briefs).

## 8. Measurement that doubles as user value

Track *presence vs. search for meaning* lightly over time (a one-tap
monthly check). It is the credibility / investor metric **and** a moving
artifact the user values ("your sense of meaning, this season").
Frankl-aligned, research-grounded, retentive.

## 9. Safety (non-negotiable)

**Built (2026-08).** The care backstop is app-wide: the model's careFlag
OR a server-side scan, on every free-text surface, with real
server-composed crisis lines chosen for the reader's own region.
Detection catches oblique phrasing (burden, hopelessness, valediction),
not only stated intent, because that is how distress is actually written.

And a hard limit, which was tested and held: Hearth stops there. It does
not administer safety plans or clinical screeners, however
well-evidenced those are elsewhere. Doing so would make Hearth a crisis
product and import a duty of care it cannot staff. Everywhere, be
explicit: *a companion, not a clinician.* See `DOCTRINE_AUDIT.md` §4.

## 10. Voice & visual

Keep the Aesop / Frama restraint — it is a moat, not a liability. For
"everyone," lower the literary barrier at the *entry* (meet people in
plain language; let depth reveal itself). Central image: **light in
darkness** (the hearth fire, dawn) — Frankl's own metaphor for the
defiant power of the human spirit.

## 11. Roadmap on the current codebase

> Items 2, 3, 5 and most of 6 shipped 2026-08-09. What remains open, in
> priority order, is in `DOCTRINE_AUDIT.md` §6: notifications, password
> reset, draft autosave, the seasonal question, a finite "season", and
> real URLs.

1. **Reposition + IA.** Three avenues (Give / Receive / Carry);
   rewrite landing + onboarding into the Socratic Meaning Profile.
2. **Recast existing.** Re-aim Journal prompts (avenue-tagged Socratic +
   the Copernican question); re-aim Discover toward meaning-rich /
   exemplar content; rename Nook + briefs to "sources of meaning."
3. **Daily loop.** The meaning-of-the-moment home hook + Meaning Log +
   gentle continuity visual.
4. **Companions as a first-class surface.** A growing constellation of
   figures, not just a field inside Kindle.
5. **Shareable artifacts** (companion / turning / mirror cards) — the
   growth engine.
6. **Gifting**, then optionally the wall of why.

## 12. Naming

Keep **Hearth** — the fire you tend is meaning itself. Tagline: *"Tend
your why."*

---

## The single most important idea

**Make the three avenues the architecture. Make self-transcendence the
growth loop. Keep Frankl invisible.**

## Research lineage (kept invisible to users)

Frankl (logotherapy; *Man's Search for Meaning*, 1946) — the three
avenues, dereflection, paradoxical intention, the Copernican turn,
tragic optimism, self-transcendence, the existential vacuum. Wong
(meaning-centred therapy; tragic optimism). Steger (Meaning in Life
Questionnaire: presence vs. search). Keltner (awe). Bryant (savoring).
Lyubomirsky, Seligman (gratitude, evidence-based interventions). The
same lineage already encoded in `server/lib/ai.js` HEARTH_VOICE.
