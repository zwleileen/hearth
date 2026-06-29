import { Router } from 'express';
import { User } from '../models/User.js';
import { DailyDiscover } from '../models/DailyDiscover.js';
import { requireAuth } from '../middleware/auth.js';

export const profile = Router();
profile.use(requireAuth);

profile.get('/', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: user.toClient() });
});

profile.patch('/', async (req, res) => {
  const { name, onboarding } = req.body || {};
  const update = {};
  if (typeof name === 'string') update.name = name;
  if (onboarding && typeof onboarding === 'object') {
    for (const key of ['flower', 'reasons', 'interests', 'dailyTime']) {
      if (onboarding[key] !== undefined) update[`onboarding.${key}`] = onboarding[key];
    }
  }
  const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Reading-room content is generated from interests + reading time and
  // cached per day. If either just changed, drop today's cached room so
  // it regenerates with the new preferences the next time it opens. The
  // quote and journal prompts read preferences live, so they need no
  // invalidation; the flower is UI-only.
  if (onboarding && typeof onboarding === 'object' &&
      (onboarding.interests !== undefined || onboarding.dailyTime !== undefined)) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await DailyDiscover.deleteOne({ userId: req.userId, date: today });
    } catch (err) {
      console.warn('[profile] reading-room cache invalidation failed:', err.message);
    }
  }

  res.json({ user: user.toClient() });
});
