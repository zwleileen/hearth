import mongoose from 'mongoose';

const onboardingSchema = new mongoose.Schema({
  flower: { type: String, default: 'wisteria' },
  reasons: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  dailyTime: { type: String, enum: ['morning', 'afternoon', 'evening'], default: 'morning' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  onboarding: { type: onboardingSchema, default: () => ({}) },
}, { timestamps: true });

userSchema.method('toClient', function () {
  const { _id, email, name, onboarding, createdAt } = this;
  return { id: _id.toString(), email, name, onboarding, createdAt };
});

export const User = mongoose.model('User', userSchema);
