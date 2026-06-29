// server/routes/meaning.js
//
// The Meaning Log: lines kept in answer to "the meaning of this moment".
//
//   POST   /api/meaning        keep a line
//   GET    /api/meaning        recent lines, newest first
//   DELETE /api/meaning/:id    remove one

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { MeaningLog } from '../models/MeaningLog.js';

export const meaning = Router();
meaning.use(requireAuth);

const TEXT_MAX = 1000;
const LIST_DEFAULT = 30;
const LIST_MAX = 100;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

meaning.post('/', async (req, res) => {
  const { text, prompt, avenue, date } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > TEXT_MAX) {
    return res.status(400).json({ error: `text is too long, please keep it under ${TEXT_MAX} characters` });
  }
  const day = (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : todayISO();
  try {
    const row = await MeaningLog.create({
      userId: req.userId,
      date: day,
      prompt: (prompt || '').slice(0, 500),
      text: text.trim().slice(0, TEXT_MAX),
      avenue: (avenue || '').slice(0, 20),
    });
    res.json({ entry: row.toClient() });
  } catch (err) {
    console.error('[meaning] create failed:', err);
    res.status(500).json({ error: 'Failed to keep your line' });
  }
});

meaning.get('/', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || LIST_DEFAULT, 1), LIST_MAX);
  try {
    const rows = await MeaningLog.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const entries = rows.map((r) => ({
      id: r._id.toString(), date: r.date, prompt: r.prompt, text: r.text, avenue: r.avenue, createdAt: r.createdAt,
    }));
    res.json({ entries });
  } catch (err) {
    console.error('[meaning] list failed:', err);
    res.status(500).json({ error: 'Failed to load your meaning log' });
  }
});

meaning.delete('/:id', async (req, res) => {
  try {
    const r = await MeaningLog.deleteOne({ _id: req.params.id, userId: req.userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[meaning] delete failed:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});
