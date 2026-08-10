# Hearth — Project Status & Handoff

> A living record of where Hearth is, so work can continue across
> sessions. Last updated 2026-08-09.
> Companion docs: `docs/MEANING.md` (design north star),
> `docs/HEARTH_BRAND_BRIEF.md` (logotherapy + brand + design system, cited),
> `docs/DOCTRINE_AUDIT.md` (the 2026-08 audit: what held, what was wrong,
> what was retracted, what shipped).

> **Most recent work:** see [Session log — 2026-08-09](#session-log--2026-08-09)
> at the bottom for what changed this session and where we left off.

---

## What Hearth is now

A **logotherapy-based meaning app**: a daily home for finding meaning,
built on Viktor Frankl's three avenues to meaning, rendered in plain
language as **Give · Receive · Carry**. (Rebuilt this arc from a general
wellness app.)

## Stack & deploy

- **Repo:** github.com/zwleileen/hearth · local: `/Users/eileen/hearth`
- **Frontend:** Vite + React → **Vercel** (auto-deploys on push to `main`).
- **Backend:** Node / Express / Mongoose / MongoDB Atlas → **Render**
  (`hearth-9f2o.onrender.com`, auto-redeploys on push). `vercel.json`
  rewrites `/api/*` to Render.
- **Important:** backend changes need Render to redeploy before they work
  live. Local `.env` points at the **production** Mongo. Offline scripts
  must load `dotenv/config` for `OPENAI_API_KEY` and run from the repo
  root for `node_modules`.
- AI: OpenAI (model id `gpt-5.1`) for Attune, Kindle, the weekly briefs,
  and the Meaning Narrative.

## Architecture (the navigation)

**Today · Give · Receive · Carry · Yours** (Frankl's three avenues plus a
personal space). Tab icons: the Threshold symbol (Today), an open hand
(Give), a flower (Receive), a heart (Carry), a bookmark (Yours).

- **Today (home):** the daily quote as a large, wallpaper-worthy hero;
  "Your meaning, this season" (a 3-line distilled narrative, full prose
  one tap away); "the meaning of this moment" (a daily prompt the reader
  answers in a line and keeps); "what you've been noticing" (recent kept
  lines).
- **Give:** a "deed of the day" plus ways to give; answers are kept to the
  Meaning Log. (Creative values / self-transcendence.)
- **Receive:** Attune (describe a mood, get **3 songs + 1 book excerpt +
  1 poem** matched to its texture via the iso-principle; the excerpt is
  affective bibliotherapy) and the Reading Room (a small daily curated
  set). (Experiential values.)
- **Carry:** Kindle, a guided logotherapy session (seeing → widening →
  companion → turning → step) plus steadying practices. (Attitudinal
  values.)
- **Yours:** Your Meaning (the full narrative), Journal (Socratic prompts
  + a blank page), the Meaning Log, and the Nook (saved anthology).

## Backend: models & endpoints

- **Models:** User, JournalEntry, Bookmark, AttuneEntry, KindleSession,
  DailyDiscover, WeeklyBibliotherapy, WeeklyBrief, **MeaningLog**,
  **MeaningNarrative**.
- **Endpoints (added/changed in this arc):**
  - `/api/meaning` — Meaning Log (POST keep, GET recent, DELETE).
  - `/api/narrative` — the Meaning Narrative synthesis. **Now reads only
    the two robust signals: MeaningLog + Kindle (Carry) sessions**, each
    bounded to a recent window (40 logs / 8 sessions) so the prompt stays
    flat as history grows. (Journal + Bookmarks were dropped, 2026-07-01.)
    Returns short give/receive/carry lines + full prose + threads +
    `generatedAt`. Cached per user; re-weaves when inputs grow, every 7
    days, when `promptVersion` bumps, or on `?refresh=1`. Cold (< 3) empty.
  - `/api/digest/journal-brief` and `/nook-brief` — reflections at the top
    of the Journal and Nook. **Rolling 7-day regeneration** (one living
    row per user+kind via `generatedAt`/`promptVersion`, no longer per ISO
    week); also re-weaves when new material is added or on `?refresh=1`.
  - `/api/digest/bibliotherapy` + `WeeklyBibliotherapy` + the
    `WeeklyDigestScreen` exist but are **orphaned** (the screen is exported
    yet never routed in `app.jsx`; left from a retired weekly-review page).
    We chose to put bibliotherapy in Attune as excerpts instead of
    reviving this. Safe to delete if we want the cleanup.
  - `/api/discover/today` — the reading room (rotates interests; cache
    invalidated by a profile change to interests/dailyTime).

## Brand & logo

- The **Threshold** mark (an arched door on a baseline with the ember as
  the constant light) is applied app-wide: favicon, the Today tab, the
  desktop sidebar (horizontal lockup), the mobile topbar (wordmark), the
  landing (lockup + wordmark + the ink symbol on the dark call), the
  onboarding welcome (vertical lockup), and sign-in (symbol).
- In-app assets: `public/brand/` (SVG; `paper` variants for light grounds,
  `ink` for dark). Full source kit: `hearth-brand-kit/` (currently
  untracked in git).
- Primary tagline: **"Tend your why."**

## Launch assets (Product Hunt)

- Tagline: "Tend your why." (alt: "Find the meaning in your days.")
- Product description (~442 chars) and a maker's-note first comment
  (~280 words) are recorded in the session memory and can be regenerated.

## Pending / next

1. **Visual QA on a real device** (cannot render in chat): logo sizes,
   the home hearth-glow, the deep-green narrative block on the landing
   (lace-on-green contrast), and the Give "tap a way → scroll to the
   capture" interaction.
2. **Self-authoring of the Meaning Narrative** (let the reader edit or add
   their own line). Designed in principle, not built.
3. Decide whether to commit the `hearth-brand-kit/` source folder (the app
   only needs `public/brand/`).
4. Optional: a PDF/.docx of the brand brief; a shorter first-comment
   variant; PWA `safe-area-inset-top` if shipping as a standalone app.

## Voice rules (enforced everywhere)

- Describe only what Hearth **is** and the value it brings; never position
  by contrast with other apps. The uniqueness is self-evident.
- **No em dashes** in any user-facing copy.
- Quiet, literary, warm (Aesop / Frama register). No therapy-speak, no
  hype, no gamification, no emoji in product copy.
- **Reflections** (Meaning Narrative + Journal/Nook briefs) use a separate
  shared voice, `REFLECTION_VOICE` in `server/lib/ai.js`: a world-class
  therapist who knows you, plain and warm, with an explicit ban on
  AI-language and therapy clichés. Bump each surface's `promptVersion` when
  the voice/prompt changes so cached copies re-weave once.

---

## Session log — 2026-07-01

Where we left off. Four shipped commits this session (HEAD `f0fe34a`),
all on `main`; Vercel + Render auto-deploy from `main`.

1. **Auth: stay signed in across cold launches** (`85d4196`).
   `src/app.jsx` `refreshUser` was clearing the token on *any* failed
   `/auth/me`, so a sleeping Render backend logged people out (worst from
   the home-screen PWA). Now it clears only on a real **401**; transient
   failures keep the token and mark the session `unverified`, and a quiet
   retry (backoff + on `online`/focus) recovers it. Boot no longer bounces
   unverified users to the landing page.

2. **Reflections: sources, cadence, voice** (`0f14911`).
   - Meaning Narrative reads only MeaningLog + Carry sessions, bounded
     (see endpoints above). `MeaningNarrative` gained `promptVersion`.
   - Journal + Nook briefs → rolling 7-day regen. `WeeklyBrief` gained
     `generatedAt` + `promptVersion`; kept its legacy index by updating one
     row in place (no migration). Old per-week rows are harmless orphans.
   - Shared `REFLECTION_VOICE` applied to all three; versions bumped.

3. **Bibliotherapy → Attune as excerpts** (`0f14911`).
   Attune now returns **3 songs + 1 book excerpt + 1 poem** (poems 3→1).
   Decision rationale: affective bibliotherapy works by *resonance with
   current feeling* (excerpt) → belongs in Attune's iso-principle flow;
   whole-book recs are thematic/longitudinal, not mood-gated. Excerpt has
   the same copyright discipline as poems (brief quote / public-domain full
   text / url fallback, never fabricated). Touched: `ATTUNE_SCHEMA`,
   `attunePrompt.js` (+ excerpt-author diversity), `attuneRunner.js`
   (count + `excerptMissing` retry), `AttuneEntry` (`excerpt` subdoc),
   `attune.js`, and the Attune reading view in `src/screens-2.jsx`.
   **Saving:** an excerpt saves to the Nook as a `book` bookmark and keeps
   the **passage itself** (the "why" goes to `meta.note`); poems save as
   `poem`. `Bookmark.kind` already allows `book`/`poem`.

4. **Attune copy** (`f0fe34a`). Updated the input line, the Receive door,
   and the about copy from "three songs and three poems" to "songs, a book
   passage, and a poem."

**Open / next:**
- **Eyeball real excerpts:** run Attune against the live OpenAI API once to
  check quote accuracy/quality before relying on it (hallucination risk on
  prose quotes is the main watch-item; guardrails mirror poems).
- **Keep Render warm:** the auth fix tolerates cold starts, but a cron ping
  to `/api/health` (or a paid always-on plan) removes the ~30-60s wake.
- Optional cleanup: delete the orphaned bibliotherapy weekly-digest stack
  (`WeeklyDigestScreen`, `/api/digest/bibliotherapy`, `WeeklyBibliotherapy`,
  `BIBLIOTHERAPY_SCHEMA`) now that excerpts live in Attune.


---

## Session log — 2026-08-09

A full audit of the product against its own doctrine, then the
refinements shipped in one pass. Reasoning, including two retracted
proposals, is in `docs/DOCTRINE_AUDIT.md`; this is the shipping record.

**New surfaces**

- **A letter** (`src/letter.jsx`). Give's centre. Who it is for, what
  they did, what it gave you; typeset on Old Lace and handed to the
  reader's own share sheet. Recorded to the meaning log only once it is
  actually sent. This is the growth loop and the method in one act.
- **"Stay a moment"** (`src/savour.jsx`). Name what it reached, three
  breaths with a longer out-breath, where it sits, then a beat where
  nothing is asked. Wired into Attune, Three Good Things, the awe walk,
  and a Carry turning. Skippable everywhere.
- **Shareable cards** (`src/share.jsx`). Canvas-drawn on the reader's own
  device: a kept line, a keepsake, a letter. `navigator.share` first,
  then save, then copy, so it always does something on every browser.
- **The care block** (`src/care.jsx`), shared by every free-text surface.

**Backend**

- `server/lib/care.js` — one detector, two tiers (stated intent and the
  oblique phrasing distress is actually written in), plus region-aware
  crisis lines resolved from an `X-Hearth-TZ` header the client sends on
  every request. `findahelpline.com` is always appended. Applied in
  `routes/kindle.js`, `routes/journal.js`, `routes/attune.js`.
- `POST /api/kindle/:id/reseen` — the reader says the seeing missed them
  and says how; only the naming and the seeing regenerate, the rest of
  the session stands. The prompt forbids apologising or explaining.
- **Continuity** — `buildKnowingBlock` passes the meaning narrative plus
  the reader's own recent words into a session. Never the mirrors or
  turnings Hearth itself offered them, and never to be performed back.
- **`SESSION_VOICE`** (`lib/ai.js`) now governs Carry instead of
  `HEARTH_VOICE`, which is mostly a content-curation brief. Plainness for
  everything said to the reader; the literary register kept for the
  mirror. Temperature 0.85 → 0.7 for a session, 0.6 for the close and the
  re-seeing.
- `PATCH /api/narrative` — affirm a row or replace it in your own words.
  `own` and `affirmed` are excluded from the re-weave `$set`, so a
  synthesis can never overwrite what a person said about their own life.
- `MeaningLog.forWhom`; `GET /api/meaning` also returns `total`.

**Home**

- The accumulating light: grows with everything ever kept, can only ever
  grow.
- The hero yields: after five kept lines, the reader's own line takes the
  masthead and the quote steps down beneath it.
- The daily question is now the same for everyone.

**Corrections**

- Evidence copy no longer over-claims (Three Good Things, the awe walk,
  the breath).
- Three Good Things restored its attribution field.
- Real timers replaced hardcoded `03:42` and `Cycle 02 of 06`.
- Hover-only Remove buttons (invisible on touch) are always present, and
  take two taps.
- Banned styling removed: side-stripe borders, avatar gradients,
  glassmorphism, 24px radii, the retired sprig code.
- The reminders screen was deleted. It was a mock with no scheduler
  behind it, and onboarding's promise of "one quiet nudge" was removed
  with it. Both come back when push is real.

**Verified before shipping:** full production build; server boots against
Atlas; care detection unit-checked over 19 phrasings including
false-positive guards; region routing checked for GB / US / none; a live
Carry session, a live re-seeing, and a second session confirming
continuity does not leak back into the copy; narrative authorship
persisted and surviving a re-read.

**Open / next** (fuller list in `DOCTRINE_AUDIT.md` §6): notifications
done Hearth's way (outward-turning by default), password reset, draft
autosave and an offline shell, the seasonal question, a finite "season"
covering the meaning already made, account deletion and export, play
links in Attune, and real URLs.


---

## Session log — 2026-08-10

Two corrections and one long-missing feature.

**Quotation marks are for quotations** (`f2aa31f`). The home hero briefly
held the reader's own kept line, in display Fraunces inside curly quotes.
A private line set as an epigraph reads as self-important, and it spends
the quote marks, which only work while they mean "someone wrote this, in
a book, and it lasted". The hero is the canon again. Cards take `quoted`,
off by default. Recorded in `DOCTRINE_AUDIT.md` §7.

**A principle for sharing, and the surfaces to match it** (§8). Sharing
had landed on the meaning log on purpose and on journal entries by
accident, because a dead ShareSheet was sitting in that file and got
repaired rather than deleted. The rule now: share what gives, do not
broadcast what needs explaining.

- Removed from the journal. It was sharing `body.split(/\n+/)[0]`, the
  first line of an entry, on a page that tells you not to edit; that is
  reliably its least considered sentence. Copy remains.
- Added to the Nook, which had none despite holding only other people's
  already-public work.
- Added to the daily quote, reading-room pieces, Attune's songs, passage
  and poem, and the Carry mirror and its line.
- One `ShareLink` component for all of it, replacing two near-duplicates.
  A quiet mono link, never an icon.

**Listening** (§9). Attune recommended three songs and gave no way to
hear them. Each song now deep-links to a search on Spotify, Apple Music
or YouTube Music, switchable in one tap and remembered per device.
Universal https links, not URI schemes, so a missing app falls back to
the web player instead of a tap that does nothing. Resolving the exact
track needs a Spotify developer app and a client secret, which only the
account owner can create; scoped in `DOCTRINE_AUDIT.md` §9.

**Also fixed: a crash from the initial commit.** `EntryDetailScreen`
assumed `shift` was always a signed string. Home builds it that way, but
the journal archive passes the raw API record where it is a number, and
older entries have none, so opening an entry from All entries could
crash on `.startsWith` of undefined. Normalised, and the block hides when
there is nothing to report. Verified across eight shapes of the field.
