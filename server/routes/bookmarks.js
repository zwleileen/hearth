import { Router } from 'express';
import { Bookmark } from '../models/Bookmark.js';
import { requireAuth } from '../middleware/auth.js';

export const bookmarks = Router();
bookmarks.use(requireAuth);

bookmarks.get('/', async (req, res) => {
  const items = await Bookmark.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(500);
  res.json({ bookmarks: items.map(b => b.toClient()) });
});

bookmarks.post('/', async (req, res) => {
  const { kind, title, source, url, excerpt, meta } = req.body || {};
  if (!kind || !title) return res.status(400).json({ error: 'kind and title required' });
  try {
    const bookmark = await Bookmark.create({
      userId: req.userId,
      kind, title, source, url, excerpt, meta,
    });
    res.status(201).json({ bookmark: bookmark.toClient() });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Already bookmarked' });
    throw err;
  }
});

bookmarks.delete('/:id', async (req, res) => {
  const result = await Bookmark.deleteOne({ _id: req.params.id, userId: req.userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Bookmark not found' });
  res.json({ ok: true });
});
