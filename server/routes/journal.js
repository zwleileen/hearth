import { Router } from 'express';
import { JournalEntry } from '../models/JournalEntry.js';
import { requireAuth } from '../middleware/auth.js';
import { detectDistress, careBlockFor, regionFromTimeZone } from '../lib/care.js';

export const journal = Router();
journal.use(requireAuth);

journal.get('/', async (req, res) => {
  const entries = await JournalEntry.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(200);
  res.json({ entries: entries.map(e => e.toClient()) });
});

journal.get('/:id', async (req, res) => {
  const entry = await JournalEntry.findOne({ _id: req.params.id, userId: req.userId });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json({ entry: entry.toClient() });
});

journal.post('/', async (req, res) => {
  const { mode, title, body, mood, shift, tags, promptTitle, promptLineage } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body is required' });
  const entry = await JournalEntry.create({
    userId: req.userId,
    mode, title, body, mood, shift, tags, promptTitle, promptLineage,
  });

  // The care backstop runs here too, not only in a Carry session. The
  // journal is the longest free-text field in Hearth and it is written
  // at night: if someone is going to put the heaviest thing they have
  // written all year anywhere, it is on this page. Leaving it uncovered
  // was the real gap. Resources are composed server-side and chosen for
  // the reader's own region. Null when nothing was seen, so the calm
  // case stays completely quiet.
  const care = careBlockFor(
    detectDistress(body),
    regionFromTimeZone(req.get('X-Hearth-TZ') || ''),
  );

  res.status(201).json({ entry: entry.toClient(), care });
});

journal.patch('/:id', async (req, res) => {
  const { title, body, mood, shift, tags } = req.body || {};
  const entry = await JournalEntry.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { title, body, mood, shift, tags } },
    { new: true, omitUndefined: true },
  );
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json({ entry: entry.toClient() });
});

journal.delete('/:id', async (req, res) => {
  const result = await JournalEntry.deleteOne({ _id: req.params.id, userId: req.userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ ok: true });
});
