import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mode: { type: String, enum: ['morning', 'afternoon', 'evening', 'free'], default: 'free' },
  title: { type: String, default: '' },
  body: { type: String, required: true },
  mood: { type: String, default: null },
  shift: { type: Number, min: 0, max: 4, default: null },
  tags: { type: [String], default: [] },
  promptTitle: { type: String, default: null },
  promptLineage: { type: String, default: null },
}, { timestamps: true });

journalEntrySchema.method('toClient', function () {
  const { _id, userId, mode, title, body, mood, shift, tags, promptTitle, promptLineage, createdAt, updatedAt } = this;
  return {
    id: _id.toString(),
    userId: userId.toString(),
    mode, title, body, mood, shift, tags, promptTitle, promptLineage,
    createdAt, updatedAt,
  };
});

export const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
