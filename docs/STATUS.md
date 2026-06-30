# Hearth — Project Status & Handoff

> A living record of where Hearth is, so work can continue across
> sessions. Last updated 2026-07-01 (HEAD: `f0fe34a`).
> Companion docs: `docs/MEANING.md` (design north star),
> `docs/HEARTH_BRAND_BRIEF.md` (logotherapy + brand + design system, cited).

> **Most recent work:** see [Session log — 2026-07-01](#session-log--2026-07-01)
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
