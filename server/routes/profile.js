import { Router } from 'express';
import { User } from '../models/User.js';
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
  res.json({ user: user.toClient() });
});
