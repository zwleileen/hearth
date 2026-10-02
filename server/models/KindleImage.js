// server/models/KindleImage.js
//
// The picture that accompanies one Carry session. At most one per
// session, made only when the reader asks for it.
//
// Kept in its own collection rather than on KindleSession because the
// logbook reads whole session records, thirty at a time, and a picture
// is several hundred kilobytes. The session carries only a hasImage
// flag; the bytes are read one at a time, when a session is opened.

import mongoose from 'mongoose';

const kindleImageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KindleSession',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    data: { type: Buffer, required: true },
    contentType: { type: String, default: 'image/jpeg' },
    // The scene the text model wrote for the painter, and one sentence
    // describing the result for a reader who cannot see it.
    scene: { type: String, default: '' },
    alt: { type: String, default: '' },
    imageModel: { type: String, default: '' },
    promptVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

kindleImageSchema.method('toClient', function () {
  return {
    image: `data:${this.contentType};base64,${this.data.toString('base64')}`,
    alt: this.alt || '',
  };
});

export const KindleImage = mongoose.model('KindleImage', kindleImageSchema);
