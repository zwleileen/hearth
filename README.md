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

React 18 + Vite. JSX components live in `src/` as ES modules.

## Running locally

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build     # production build to dist/
npm run preview   # preview the production build
```

Then visit `http://localhost:5173`.

The original no-build prototype lives in `prototype-bundle/` (`hearth-standalone.html` opens directly in a browser, no server needed).

## Project structure

```
hearth/
├── index.html              Vite entry
├── src/
│   ├── main.jsx            App mount point
│   ├── app.jsx             Routing + tab bar
│   ├── atoms.jsx           Editorial atoms (Icon, Photo, Headline, etc.)
│   ├── ios-frame.jsx       iOS device frame components
│   ├── tweaks-panel.jsx    Dev tweaks panel + form controls
│   ├── screens-1..4.jsx    Screen components (Home, Journal, Discover, etc.)
│   ├── data.js             Content + research-backed prompt data
│   └── styles.css
├── prototype-bundle/       Original no-build artifacts (standalone HTML)
└── docs/                   Audit screenshots and design references
```

## Status

Early prototype. Design and core flows in active iteration.
