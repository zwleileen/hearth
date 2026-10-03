// server/models/CardOrder.js
//
// One printed card, made from a Carry session's picture and posted to
// someone. The order keeps exactly what was printed (the words as the
// reader left them) and where it went, so a card can be reprinted or
// traced without asking the reader again.
//
// Status runs one way:
//   submitted      the order is saved and the print file is being sent
//   sent_to_print  the print room has the PDF and the address
//   failed         the print file could not be delivered; see `error`
//
// Payment. Cards are free while printing is tested, so payment.status
// is 'not_required'. When Stripe arrives, an order is created as
// 'awaiting_payment', the reader pays through Stripe Checkout, and the
// print file is sent from the payment webhook instead of from the
// request. The fields below are where that state will live.

import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    region: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, required: true },
  },
  { _id: false },
);

const cardOrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'KindleSession', required: true },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'KindleImage', required: true },
    card: {
      kicker: { type: String, default: '' },
      title: { type: String, default: '' },
      body: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    format: { type: String, default: 'flat-4x6' },
    recipient: { type: recipientSchema, required: true },
    // A card the reader posted to themselves, to receive later.
    forSelf: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['awaiting_payment', 'submitted', 'sent_to_print', 'failed'],
      default: 'submitted',
    },
    payment: {
      status: { type: String, enum: ['not_required', 'pending', 'paid', 'refunded'], default: 'not_required' },
      provider: { type: String, default: '' },
      reference: { type: String, default: '' },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: '' },
    },
    printTo: { type: String, default: '' },
    error: { type: String, default: '' },
  },
  { timestamps: true },
);

cardOrderSchema.index({ userId: 1, createdAt: -1 });

export const CardOrder = mongoose.model('CardOrder', cardOrderSchema);
