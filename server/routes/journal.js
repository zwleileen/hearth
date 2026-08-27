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

// The client's greeting buckets include a fifth part of the day, 'night',
// which the schema's enum does not carry — and a bundle already in a
// reader's browser will keep sending it long after the source is fixed.
// An unrecognised mode files the entry rather than refusing it: night is
// evening's half of the day (pickJournalInvite draws from the same pool),
// and anything else is simply a free page.
const JOURNAL_MODES = new Set(['morning', 'afternoon', 'evening', 'free']);
function normaliseMode(mode) {
  if (!mode) return 'free';
  if (mode === 'night') return 'evening';
  return JOURNAL_MODES.has(mode) ? mode : 'free';
}

journal.post('/', async (req, res) => {
  const { mode, title, body, mood, shift, tags, promptTitle, promptLineage } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body is required' });

  let entry;
  try {
    entry = await JournalEntry.create({
      userId: req.userId,
      mode: normaliseMode(mode), title, body, mood, shift, tags, promptTitle, promptLineage,
    });
  } catch (err) {
    // Express 4 does not hand a rejected async handler to the error
    // middleware in index.js: the rejection goes unhandled and Node 24
    // exits the process, so one bad field takes the whole server down
    // and Render restarts it in a loop. Caught here, a failure to save
    // stays the failure of one page.
    console.error('[journal] create failed', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'That entry could not be saved.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }

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
