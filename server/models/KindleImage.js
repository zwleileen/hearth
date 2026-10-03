// server/models/KindleImage.js
//
// The picture that accompanies one Carry session. At most one per
// session, made only when the reader asks for it.
//
// Kept in its own collection rather than on KindleSession because the
// logbook reads whole session records, thirty at a time, and a picture
// with its print copy is about a megabyte and a half. The session carries only a hasImage
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
    // The copy for the screen.
    data: { type: Buffer, required: true },
    // The print master, at full resolution (lib/kindleImage.js). Absent
    // on pictures made before cards were printed; those print from data.
    print: { type: Buffer },
    printWidth: { type: Number },
    printHeight: { type: Number },
    // A small copy for lists, made lazily for older pictures.
    thumb: { type: Buffer },
    contentType: { type: String, default: 'image/jpeg' },
    // What the art director decided (lib/kindleImage.js): the essence the
    // picture must carry, the visual idea that carries it, the scene it
    // wrote for the painter, and one sentence describing the result for a
    // reader who cannot see it.
    essence: { type: String, default: '' },
    idea: { type: String, default: '' },
    scene: { type: String, default: '' },
    alt: { type: String, default: '' },
    imageModel: { type: String, default: '' },
    promptVersion: { type: Number, default: 1 },
    // The words for the back of the card (lib/cardWords.js), set from the
    // mirror when the picture is made. A starting point the reader edits.
    cardWords: {
      title: { type: String, default: '' },
      body: { type: String, default: '' },
      closing: { type: String, default: '' },
    },
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
