// server/routes/encounter.js
//
// One person, looked at properly. See models/Encounter.js for why this
// is its own record and never a contact list.
//
//   POST   /api/encounter        keep an observation
//   GET    /api/encounter        the gallery, grouped by person
//   POST   /api/encounter/:id/keep   promote one into the meaning log
//   DELETE /api/encounter/:id

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Encounter } from '../models/Encounter.js';
import { MeaningLog } from '../models/MeaningLog.js';

export const encounter = Router();
encounter.use(requireAuth);

const PERSON_MAX = 80;
const TEXT_MAX = 600;
const LIST_LIMIT = 300;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

encounter.post('/', async (req, res) => {
  const { person, noticed, potential, date } = req.body || {};
  if (!person || typeof person !== 'string' || !person.trim()) {
    return res.status(400).json({ error: 'person is required' });
  }
  if (!noticed || typeof noticed !== 'string' || !noticed.trim()) {
    return res.status(400).json({ error: 'noticed is required' });
  }
  const day = (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : todayISO();

  try {
    const row = await Encounter.create({
      userId: req.userId,
      person: person.trim().slice(0, PERSON_MAX),
      noticed: noticed.trim().slice(0, TEXT_MAX),
      potential: (potential || '').trim().slice(0, TEXT_MAX),
      date: day,
    });
    res.json({ entry: row.toClient() });
  } catch (err) {
    console.error('[encounter] create failed:', err);
    res.status(500).json({ error: 'Could not keep that' });
  }
});

// The gallery. Grouped BY PERSON rather than by date, because that
// grouping is the whole point: someone seen once shows one line and is
// complete, while someone seen across a year shows the sequence, and
// reading it is the thing nothing else in Hearth holds.
//
// Deliberately absent from the response: counts, last-seen, gaps,
// anything that could be rendered as a cadence. Grouping is presentation
// only; the store stays a plain log of moments.
encounter.get('/', async (req, res) => {
  try {
    const rows = await Encounter.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(LIST_LIMIT)
      .lean();

    // Case-insensitive grouping so "Dad" and "dad" are one person, with
    // the most recent spelling shown.
    const byKey = new Map();
    for (const r of rows) {
      const key = r.person.trim().toLowerCase();
      if (!byKey.has(key)) byKey.set(key, { person: r.person.trim(), notes: [] });
      byKey.get(key).notes.push({
        id: r._id.toString(),
        noticed: r.noticed,
        potential: r.potential || '',
        date: r.date,
        kept: !!r.kept,
        createdAt: r.createdAt,
      });
    }

    // People in order of most recently seen, which is the order a reader
    // thinks in. Never in order of frequency: that would be a ranking of
    // the people in someone's life.
    const people = [...byKey.values()];
    res.json({ people });
  } catch (err) {
    console.error('[encounter] list failed:', err);
    res.status(500).json({ error: 'Could not load the people you have seen' });
  }
});

// The deliberate promotion. Noticing is free and unweighted; keeping is
// deliberate and weighted. Only this writes to the meaning log, and only
// because the reader said so.
encounter.post('/:id/keep', async (req, res) => {
  try {
    const row = await Encounter.findOne({ _id: req.params.id, userId: req.userId });
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (row.kept) return res.json({ entry: row.toClient(), already: true });

    await MeaningLog.create({
      userId: req.userId,
      date: row.date,
      prompt: 'Someone I saw',
      text: `${row.person}. ${row.noticed}`,
      avenue: 'receive',
      forWhom: row.person,
    });

    row.kept = true;
    await row.save();
    res.json({ entry: row.toClient() });
  } catch (err) {
    console.error('[encounter] keep failed:', err);
    res.status(500).json({ error: 'Could not keep that' });
  }
});

encounter.delete('/:id', async (req, res) => {
  try {
    const r = await Encounter.deleteOne({ _id: req.params.id, userId: req.userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[encounter] delete failed:', err);
    res.status(500).json({ error: 'Could not remove that' });
  }
});
