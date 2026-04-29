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
app.use(cors({ origin: ['http://localhost:5173'], credentials: false }));

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
