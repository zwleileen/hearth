import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { auth } from './routes/auth.js';
import { journal } from './routes/journal.js';
import { profile } from './routes/profile.js';
import { bookmarks } from './routes/bookmarks.js';
import { discover } from './routes/discover.js';
import { attune } from './routes/attune.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

// CORS: allow localhost dev, the Vercel production domain, any Vercel
// preview deploy for this project, and any extra origins listed in
// CORS_ORIGINS (comma-separated). Set CORS_ORIGINS in Render to your
// Vercel production URL once it's known.
const STATIC_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
]);
const VERCEL_PREVIEW = /^https:\/\/hearth(-[a-z0-9-]+)?\.vercel\.app$/i;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server, curl, etc.
      if (STATIC_ORIGINS.has(origin)) return callback(null, true);
      if (VERCEL_PREVIEW.test(origin)) return callback(null, true);
      callback(new Error(`CORS: origin not allowed (${origin})`));
    },
    credentials: false,
  }),
);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', auth);
app.use('/api/journal', journal);
app.use('/api/profile', profile);
app.use('/api/bookmarks', bookmarks);
app.use('/api/discover', discover);
app.use('/api/attune', attune);

app.use((err, req, res, _next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server] failed to start:', err);
    process.exit(1);
  });
