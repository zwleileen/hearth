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

A no-build React prototype using Babel standalone, so JSX runs directly in the browser without a bundler. React 18 is loaded via CDN.

## Running locally

The app uses `<script type="text/babel" src="...">`, so it must be served over HTTP rather than opened as a `file://` URL. From the project root:

```bash
# Python 3
python3 -m http.server 8000

# or Node
npx serve .
```

Then visit `http://localhost:8000`.

The fully bundled `dist/hearth-standalone.html` works without a server, just open it directly in a browser.

## Project structure

```
hearth/
├── index.html         Dev entry point
├── src/               React source (jsx, data, styles)
├── dist/              Bundled standalone artifacts
└── docs/              Audit screenshots and design references
```

## Status

Early prototype. Design and core flows in active iteration.
