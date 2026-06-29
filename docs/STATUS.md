# Hearth — Project Status & Handoff

> A living record of where Hearth is, so work can continue across
> sessions. Last updated 2026-06-30 (last commit before this doc: `e6e3f15`).
> Companion docs: `docs/MEANING.md` (design north star),
> `docs/HEARTH_BRAND_BRIEF.md` (logotherapy + brand + design system, cited).

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
- **Receive:** Attune (describe a mood, get songs + poems by its texture)
  and the Reading Room (a small daily curated set). (Experiential values.)
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
  - `/api/narrative` — the Meaning Narrative synthesis. Reads across
    MeaningLog + Journal + Bookmark + Kindle; returns short
    give/receive/carry lines + full prose + threads + `generatedAt`.
    Cached per user; re-weaves when inputs grow **or** every 7 days, or on
    `?refresh=1`. Cold start (< 3 sources) returns empty.
  - `/api/digest/journal-brief` and `/nook-brief` — weekly reflections
    (cached per ISO week).
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
