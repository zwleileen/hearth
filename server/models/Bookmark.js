import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: { type: String, enum: ['article', 'song', 'book', 'poem'], required: true },
  title: { type: String, required: true },
  source: { type: String, default: '' },
  url: { type: String, default: '' },
  excerpt: { type: String, default: '' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

bookmarkSchema.index({ userId: 1, url: 1 }, { unique: true, partialFilterExpression: { url: { $type: 'string', $ne: '' } } });

bookmarkSchema.method('toClient', function () {
  const { _id, userId, kind, title, source, url, excerpt, meta, createdAt } = this;
  return { id: _id.toString(), userId: userId.toString(), kind, title, source, url, excerpt, meta, createdAt };
});

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
