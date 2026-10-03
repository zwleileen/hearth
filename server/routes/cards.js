// server/routes/cards.js
//
// A printed card made from a Carry session: the picture of its mirror on
// the front, the mirror's words (as the reader left them) and their own
// note on the back, posted to someone they choose.
//
//   POST   /api/cards     build the print file and send it to print
//
// While printing is being tested, the print room is an inbox: the PDF
// and the address go to CARD_PRINT_TO by email, and cards are free. See
// models/CardOrder.js for where payment will slot in.

import mongoose from 'mongoose';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buildCardPdf, missingCharacters, CardFitError } from '../lib/cardPdf.js';
import { mailConfigured, sendMail } from '../lib/mailer.js';
import { KindleSession } from '../models/KindleSession.js';
import { KindleImage } from '../models/KindleImage.js';
import { CardOrder } from '../models/CardOrder.js';
import { User } from '../models/User.js';

export const cards = Router();
cards.use(requireAuth);

const PRINT_TO = () => process.env.CARD_PRINT_TO || 'zwleileen@gmail.com';

// A generous ceiling while cards are free, so a stuck button or a
// curious reader cannot fill the print room's inbox.
const DAILY_LIMIT = 10;

// The label over the mirror on the back of the card. Set here from the
// session, never taken from the request: it names what the mirror is.
const MIRROR_LABEL = {
  person: 'Someone who stood here',
  story: 'Someone who stood here',
  nature: 'An image that meets you',
  parable: 'A small parable',
  image: 'An image that meets you',
};

// Ceilings against abuse, not the measure of a card. Whether the words
// fit is decided by the print file itself (lib/cardPdf.js), which holds
// about 1,500 characters on the back once the type steps down. A mirror's
// own words often run past 900, so a lower ceiling here refused cards
// that would have printed perfectly well.
const LIMITS = {
  title: 90,
  body: 2000,
  note: 320,
  name: 100,
  line1: 120,
  line2: 120,
  city: 80,
  region: 80,
  postalCode: 20,
  country: 60,
};

// Trim, drop control characters, and keep line breaks only where a
// line break means something.
function clean(value, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  const s = value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '');
  return (multiline ? s.replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ')).trim();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function addressLines(r) {
  return [
    r.name,
    r.line1,
    r.line2,
    [r.city, r.region, r.postalCode].filter(Boolean).join(', '),
    r.country,
  ].filter(Boolean);
}

// ── POST /api/cards ───────────────────────────────────────────────────
cards.post('/', async (req, res) => {
  const userId = req.userId;
  const b = req.body || {};

  if (!mongoose.isValidObjectId(b.sessionId)) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // The words, as the reader left them.
  const card = {
    title: clean(b.title),
    body: clean(b.body, { multiline: true }),
    note: clean(b.note, { multiline: true }),
  };
  const r = b.recipient || {};
  const recipient = {
    name: clean(r.name),
    line1: clean(r.line1),
    line2: clean(r.line2),
    city: clean(r.city),
    region: clean(r.region),
    postalCode: clean(r.postalCode),
    country: clean(r.country),
  };

  // Field errors come back keyed by field, so the form can put each one
  // beside the field it belongs to.
  const fields = {};
  if (!card.title) fields.title = 'The card needs a title.';
  if (!card.body) fields.body = 'The card needs some words on the back.';
  for (const k of ['name', 'line1', 'city', 'country']) {
    if (!recipient[k]) fields[k] = 'Required.';
  }
  for (const [k, max] of Object.entries(LIMITS)) {
    const v = k in card ? card[k] : recipient[k];
    if (v && v.length > max) fields[k] = `Keep this under ${max} characters.`;
  }
  for (const k of ['title', 'body', 'note']) {
    if (fields[k] || !card[k]) continue;
    const font = k === 'title' ? 'title' : k === 'note' ? 'note' : 'body';
    const missing = missingCharacters(card[k], font);
    if (missing.length) fields[k] = `The card cannot print ${missing.slice(0, 5).join(' ')} yet.`;
  }
  if (Object.keys(fields).length) {
    return res.status(400).json({ error: 'Some details need another look.', fields });
  }

  const session = await KindleSession.findOne({ _id: b.sessionId, userId }).lean();
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const image = await KindleImage.findOne({ sessionId: session._id, userId });
  if (!image) return res.status(409).json({ error: 'This session has no picture yet.' });

  if (!mailConfigured()) {
    return res.status(503).json({ error: 'Cards cannot be sent yet. The print room is not connected.' });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await CardOrder.countDocuments({ userId, createdAt: { $gte: since } });
  if (recent >= DAILY_LIMIT) {
    return res.status(429).json({ error: 'That is as many cards as can be sent in one day. Try again tomorrow.' });
  }

  card.kicker = MIRROR_LABEL[session.session?.companion?.kind] || MIRROR_LABEL.image;

  let pdf;
  try {
    pdf = await buildCardPdf({ image: image.data, ...card });
  } catch (err) {
    if (err instanceof CardFitError) {
      return res.status(422).json({ error: err.message, fields: { body: err.message } });
    }
    console.error('[cards] pdf failed:', err);
    return res.status(500).json({ error: 'Failed to make the print file' });
  }

  const order = await CardOrder.create({
    userId,
    sessionId: session._id,
    imageId: image._id,
    card,
    recipient,
    printTo: PRINT_TO(),
  });
  const ref = order._id.toString().slice(-6).toUpperCase();

  const user = await User.findById(userId).select('email name').lean().catch(() => null);
  const lines = addressLines(recipient);
  const text = [
    `Card ${ref}, to print and post.`,
    '',
    'Post to:',
    ...lines.map((l) => `  ${l}`),
    '',
    'Print: flat card, 4 x 6 in, two sides. The PDF is 4.25 x 6.25 in, which includes 0.125 in of bleed on every side. Page 1 is the front, page 2 the back.',
    '',
    `From: ${user?.name ? `${user.name}, ` : ''}${user?.email || 'unknown'}`,
    `Order: ${order._id}`,
    `Payment: not required (test)`,
  ].join('\n');
  const html = `<div style="font-family:Georgia,serif;color:#1F4045;line-height:1.5">
<p>Card <strong>${ref}</strong>, to print and post.</p>
<p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#6e8489">Post to</p>
<p style="margin:0 0 16px">${lines.map(escapeHtml).join('<br>')}</p>
<p>Print: flat card, 4 x 6 in, two sides. The PDF is 4.25 x 6.25 in, which includes 0.125 in of bleed on every side. Page 1 is the front, page 2 the back.</p>
<p style="color:#6e8489;font-size:13px">From ${escapeHtml(user?.name ? `${user.name}, ` : '')}${escapeHtml(user?.email || 'unknown')}<br>Order ${order._id}<br>Payment: not required (test)</p>
</div>`;

  try {
    await sendMail({
      to: order.printTo,
      subject: `Card ${ref} to print: ${recipient.name}, ${recipient.city}, ${recipient.country}`,
      text,
      html,
      replyTo: user?.email,
      attachments: [{ filename: `hearth-card-${ref}.pdf`, content: pdf, contentType: 'application/pdf' }],
    });
    order.status = 'sent_to_print';
    await order.save();
  } catch (err) {
    console.error('[cards] mail failed:', err);
    order.status = 'failed';
    order.error = err.message;
    await order.save().catch(() => {});
    return res.status(502).json({ error: 'The card could not reach the print room. Nothing was sent. Try again in a moment.' });
  }

  res.status(201).json({ id: order._id.toString(), ref, status: order.status });
});
