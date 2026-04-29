# Hearth

A personal app that feels like a safe space, a place to seek solace, comfort, and inspiration to continue another day. Hearth is meant to be a constant light for anyone who needs it.

## What Hearth does

### Journal
Research-backed morning and evening reflection prompts, designed around the best practices for starting and ending the day with intention.

### Daily inspiration
A curated stream of news, journals, articles, books, and poems chosen to remind you that the world, and life, is good.

### Mood-aware recommendations
Describe how you're feeling, and Hearth suggests songs, books, or poems shown to lift mood in the moment, grounded in research on what actually helps.

## Tech

MERN stack with Vite.

- **Frontend**: React 18 + Vite, JSX components as ES modules
- **Backend**: Node.js + Express, Mongoose for MongoDB Atlas
- **Auth**: JWT bearer tokens (stored in localStorage on the client)
- **AI**: Anthropic Claude (Opus 4.7) for the Discover and Attune features, with the `web_search` tool for daily content curation

## Running locally

### 1. Configure environment
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

You will need:
- `MONGODB_URI` — Atlas connection string
- `JWT_SECRET` — any long random string for development
- `ANTHROPIC_API_KEY` — required for the Discover and Attune endpoints (the rest of the app works without it)

### 2. Install and run

```bash
npm install
npm run dev:all   # runs frontend (5173) and backend (4000) together
```

Or run them in separate terminals:
```bash
npm run dev       # Vite dev server, http://localhost:5173
npm run server    # Express API, http://localhost:4000
```

The Vite dev server proxies `/api/*` to the backend automatically.

### 3. Useful scripts

```bash
npm run build           # production frontend build to dist/
npm run preview         # preview the production build
npm run server:start    # run the backend without --watch
```

The original no-build prototype lives in `prototype-bundle/`.

## API surface (v1)

All endpoints are under `/api`. Authenticated routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check |
| `POST` | `/auth/signup` | — | Body: `{ email, password, name?, onboarding? }` |
| `POST` | `/auth/signin` | — | Returns `{ token, user }` |
| `GET` | `/auth/me` | ✓ | Current user |
| `GET`/`PATCH` | `/profile` | ✓ | Update name, onboarding (flower, interests, dailyTime) |
| `GET`/`POST`/`PATCH`/`DELETE` | `/journal[/:id]` | ✓ | Journal entry CRUD |
| `GET`/`POST`/`DELETE` | `/bookmarks[/:id]` | ✓ | Saved articles, songs, books, poems |
| `GET` | `/discover/today` | ✓ | AI-curated daily reading room (cached per user per day; pass `?refresh=1` to regenerate) |
| `POST` | `/attune` | ✓ | AI mood-based recs. Body: `{ mood: "free text" }` |

The frontend client is in [src/api.js](src/api.js).

## Project structure

```
hearth/
├── index.html              Vite entry
├── src/                    React frontend
│   ├── main.jsx            App mount point
│   ├── app.jsx             Routing + tab bar
│   ├── api.js              API client (talks to /api/*)
│   ├── atoms.jsx           Editorial atoms
│   ├── ios-frame.jsx       iOS device frame
│   ├── tweaks-panel.jsx    Dev tweaks panel
│   ├── screens-1..4.jsx    Screen components
│   ├── data.js             Static prompt + content fixtures
│   └── styles.css
├── server/                 Express API
│   ├── index.js            Server entry
│   ├── config/db.js        Mongoose connection
│   ├── middleware/auth.js  JWT verification
│   ├── lib/
│   │   ├── jwt.js          Token signing/verification
│   │   └── claude.js       Anthropic SDK wrapper, voice prompt, schemas
│   ├── models/             User, JournalEntry, Bookmark, DailyDiscover
│   └── routes/             auth, journal, profile, bookmarks, discover, attune
├── prototype-bundle/       Original no-build artifacts
└── docs/                   Audit screenshots and design references
```

## Status

Early prototype. Backend live; frontend screens still rendering from static fixtures and need to be migrated to the API one by one.
