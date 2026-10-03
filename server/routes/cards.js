// server/routes/cards.js
//
// A printed card made from a Carry session: the picture of its mirror on
// the front, the mirror's words (as the reader left them) and their own
// note on the back, posted to someone they choose, or to themselves.
//
//   GET    /api/cards/words/:sid          the words a card starts from
//   POST   /api/cards                     build the print files and send them to print
//   GET    /api/cards                     the reader's cards, newest first
//                                         (?sessionId= for one session's)
//   POST   /api/cards/print-file          the postcard PDF, to download and share
//   GET    /api/cards/print-image/:sid    the front at full resolution
//
// While printing is being tested, the print room is an inbox: every card
// goes to CARD_PRINT_TO by email, with the print PDF, the front as a
// full-resolution image, the words and the address, and cards are free.
// See models/CardOrder.js for where payment will slot in.

import mongoose from 'mongoose';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buildCardPdf, missingCharacters, CardFitError } from '../lib/cardPdf.js';
import { bestPicture, frontImage, thumbFor } from '../lib/cardFiles.js';
import { generateCardWords } from '../lib/cardWords.js';
import { getOpenAI } from '../lib/ai.js';
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
  closing: 300,
  forName: 60,
  fromName: 60,
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

// The words of a card from a request, checked. Returns { card, fields },
// where fields holds a message for each field that needs another look.
// Each field is checked against the fonts it is set in: the title is set
// twice, in italic on the back and in spaced capitals on the front.
const FONTS_FOR = { title: ['title', 'caps'], body: ['body'], closing: ['note'], forName: ['note'], fromName: ['note'] };
function readWords(b) {
  const card = {
    title: clean(b.title),
    body: clean(b.body, { multiline: true }),
    closing: clean(b.closing, { multiline: true }),
    forName: clean(b.forName),
    fromName: clean(b.fromName),
  };
  const fields = {};
  if (!card.title) fields.title = 'The card needs a title.';
  if (!card.body) fields.body = 'The card needs some words on the back.';
  for (const k of Object.keys(card)) {
    if (card[k].length > LIMITS[k]) fields[k] = `Keep this under ${LIMITS[k]} characters.`;
  }
  for (const k of Object.keys(card)) {
    if (fields[k] || !card[k]) continue;
    const missing = [...new Set(FONTS_FOR[k].flatMap((f) => missingCharacters(card[k], f)))];
    if (missing.length) fields[k] = `The card cannot print ${missing.slice(0, 5).join(' ')} yet.`;
  }
  return { card, fields };
}

// The card's date, as it reads on the front: "4 October 2026". The page
// sends the reader's own calendar date, so a card made late in the
// evening carries that evening's date wherever the server is.
function cardDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof value === 'string' ? value : '');
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// The session and its picture, if both are this reader's.
async function sessionAndPicture(sessionId, userId) {
  if (!mongoose.isValidObjectId(sessionId)) return {};
  const session = await KindleSession.findOne({ _id: sessionId, userId }).lean();
  if (!session) return {};
  const image = await KindleImage.findOne({ sessionId: session._id, userId });
  return { session, image };
}

function kickerFor(session) {
  return MIRROR_LABEL[session.session?.companion?.kind] || MIRROR_LABEL.image;
}

// ── POST /api/cards ───────────────────────────────────────────────────
cards.post('/', async (req, res) => {
  const userId = req.userId;
  const b = req.body || {};

  if (!mongoose.isValidObjectId(b.sessionId)) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const { card, fields } = readWords(b);
  const forSelf = b.forSelf === true;
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
  for (const k of ['name', 'line1', 'city', 'country']) {
    if (!recipient[k]) fields[k] = 'Required.';
  }
  for (const k of Object.keys(recipient)) {
    if (recipient[k].length > LIMITS[k]) fields[k] = `Keep this under ${LIMITS[k]} characters.`;
  }
  if (Object.keys(fields).length) {
    return res.status(400).json({ error: 'Some details need another look.', fields });
  }

  const { session, image } = await sessionAndPicture(b.sessionId, userId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!image) return res.status(409).json({ error: 'This session has no picture yet.' });

  if (!mailConfigured()) {
    return res.status(503).json({ error: 'Cards cannot be sent yet. The print room is not connected.' });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await CardOrder.countDocuments({ userId, createdAt: { $gte: since } });
  if (recent >= DAILY_LIMIT) {
    return res.status(429).json({ error: 'That is as many cards as can be sent in one day. Try again tomorrow.' });
  }

  card.kicker = kickerFor(session);
  const date = cardDate(b.date);

  let pdf;
  let front;
  try {
    [pdf, front] = await Promise.all([buildCardPdf({ image: bestPicture(image), ...card, date }), frontImage(image)]);
  } catch (err) {
    if (err instanceof CardFitError) {
      return res.status(422).json({ error: err.message, fields: { body: err.message } });
    }
    console.error('[cards] print files failed:', err);
    return res.status(500).json({ error: 'Failed to make the print file' });
  }

  const order = await CardOrder.create({
    userId,
    sessionId: session._id,
    imageId: image._id,
    card,
    recipient,
    forSelf,
    printTo: PRINT_TO(),
  });
  const ref = order._id.toString().slice(-6).toUpperCase();

  const user = await User.findById(userId).select('email name').lean().catch(() => null);
  const lines = addressLines(recipient);
  const sender = `${user?.name ? `${user.name}, ` : ''}${user?.email || 'unknown'}`;
  const resolution = `${front.width} x ${front.height} px, which is 4.25 x 6.25 in at ${front.dpi} dpi${front.dpi < 300 ? ' (below 300 dpi: an older, smaller picture)' : ''}`;
  const words = [card.kicker.toUpperCase(), '', card.title, '', card.body,
    ...(card.closing ? ['', card.closing] : []),
    ...(card.forName ? ['', `For ${card.forName}`] : []),
    ...(card.fromName ? [`From ${card.fromName}`] : [])]
    .flatMap((l) => l.split('\n'));

  const text = [
    `Card ${ref}, to print and post${forSelf ? ' (the sender is sending it to themself)' : ''}.`,
    '',
    'POST TO',
    ...lines.map((l) => `  ${l}`),
    '',
    'PRINT',
    '  Flat card, 4 x 6 in, printed both sides, trimmed from 4.25 x 6.25 in.',
    `  hearth-card-${ref}.pdf: page 1 is the front, page 2 the back, 0.125 in bleed on every side, text kept as type.`,
    `  hearth-card-${ref}-front.jpg: the front on its own, ${resolution}, bleed included.`,
    '',
    'ON THE BACK',
    ...words.map((l) => (l ? `  ${l}` : '')),
    '',
    `From: ${sender}`,
    `Order: ${order._id}`,
    'Payment: not required (test)',
  ].join('\n');

  const label = 'margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#6e8489';
  const html = `<div style="font-family:Georgia,serif;color:#1F4045;line-height:1.5;max-width:560px">
<p>Card <strong>${ref}</strong>, to print and post${forSelf ? ' (the sender is sending it to themself)' : ''}.</p>
<p style="${label}">Post to</p>
<p style="margin:0 0 20px;font-size:17px">${lines.map(escapeHtml).join('<br>')}</p>
<p style="${label}">Print</p>
<p style="margin:0 0 20px">Flat card, 4 x 6 in, printed both sides, trimmed from 4.25 x 6.25 in.<br>
<strong>hearth-card-${ref}.pdf</strong>: page 1 is the front, page 2 the back, 0.125 in bleed on every side, text kept as type.<br>
<strong>hearth-card-${ref}-front.jpg</strong>: the front on its own, ${escapeHtml(resolution)}, bleed included.</p>
<p style="${label}">On the back</p>
<div style="margin:0 0 20px;padding:16px 18px;background:#F9F4E6">
<p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#A8893E">${escapeHtml(card.kicker)}</p>
<p style="margin:0 0 10px;font-size:19px;font-style:italic">${escapeHtml(card.title)}</p>
${card.body.split(/\n\s*\n|\n/).map((p) => `<p style="margin:0 0 8px;color:#486A6E">${escapeHtml(p)}</p>`).join('')}
${card.closing ? `<p style="margin:14px 0 0;font-style:italic">${escapeHtml(card.closing)}</p>` : ''}
${card.forName || card.fromName ? `<p style="margin:14px 0 0;font-style:italic;color:#6e8489">${[card.forName && `For ${escapeHtml(card.forName)}`, card.fromName && `From ${escapeHtml(card.fromName)}`].filter(Boolean).join('<br>')}</p>` : ''}
</div>
<p style="color:#6e8489;font-size:13px">From ${escapeHtml(sender)}<br>Order ${order._id}<br>Payment: not required (test)</p>
</div>`;

  try {
    await sendMail({
      to: order.printTo,
      subject: `Card ${ref} to print: ${recipient.name}, ${recipient.city}, ${recipient.country}`,
      text,
      html,
      replyTo: user?.email,
      attachments: [
        { filename: `hearth-card-${ref}.pdf`, content: pdf, contentType: 'application/pdf' },
        { filename: `hearth-card-${ref}-front.jpg`, content: front.buffer, contentType: 'image/jpeg' },
      ],
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

// ── GET /api/cards ────────────────────────────────────────────────────
// The reader's own cards that reached the print room, newest first. With
// ?sessionId=, only the cards made from that session. Each carries a
// small copy of its picture, so a list can show what was sent.
cards.get('/', async (req, res) => {
  const userId = req.userId;
  const query = { userId, status: 'sent_to_print' };
  if (req.query.sessionId) {
    if (!mongoose.isValidObjectId(req.query.sessionId)) return res.json({ cards: [] });
    query.sessionId = req.query.sessionId;
  }
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 30);
  try {
    const orders = await CardOrder.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    const images = await KindleImage.find({ _id: { $in: orders.map((o) => o.imageId) }, userId })
      .select('data thumb');
    const thumbs = new Map();
    await Promise.all(images.map(async (img) => {
      const t = await thumbFor(img);
      thumbs.set(img._id.toString(), `data:image/jpeg;base64,${t.toString('base64')}`);
    }));
    res.json({
      cards: orders.map((o) => ({
        id: o._id.toString(),
        ref: o._id.toString().slice(-6).toUpperCase(),
        sessionId: o.sessionId.toString(),
        title: o.card?.title || '',
        forSelf: !!o.forSelf,
        to: o.recipient?.name || '',
        city: o.recipient?.city || '',
        thumb: thumbs.get(o.imageId.toString()) || '',
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error('[cards] list failed:', err);
    res.status(500).json({ error: 'Failed to load your cards' });
  }
});

// ── The postcard, to download and share ───────────────────────────────
// Open to every reader, for their own sessions only: the postcard is
// theirs to keep, print or pass on.

// POST /api/cards/print-file: the postcard PDF, from the words on the
// card page now. The same file a printer prints.
cards.post('/print-file', async (req, res) => {
  const b = req.body || {};
  const { card, fields } = readWords(b);
  if (Object.keys(fields).length) return res.status(400).json({ error: 'Some details need another look.', fields });
  const { session, image } = await sessionAndPicture(b.sessionId, req.userId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!image) return res.status(409).json({ error: 'This session has no picture yet.' });
  try {
    const pdf = await buildCardPdf({ image: bestPicture(image), kicker: kickerFor(session), ...card, date: cardDate(b.date) });
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="hearth-keepsake.pdf"');
    res.send(pdf);
  } catch (err) {
    if (err instanceof CardFitError) return res.status(422).json({ error: err.message, fields: { body: err.message } });
    console.error('[cards] print-file failed:', err);
    res.status(500).json({ error: 'Failed to make the print file' });
  }
});

// GET /api/cards/print-image/:sessionId: the painting itself, whole and
// at full resolution, for keeping or printing on its own.
cards.get('/print-image/:sessionId', async (req, res) => {
  const { session, image } = await sessionAndPicture(req.params.sessionId, req.userId);
  if (!session || !image) return res.status(404).json({ error: 'No picture for this session' });
  res.set('Content-Type', 'image/jpeg');
  res.set('Content-Disposition', 'attachment; filename="hearth-painting.jpg"');
  res.send(bestPicture(image));
});

// GET /api/cards/words/:sessionId: the words the card starts with. The words are set when the picture is painted;
// pictures made before that have theirs set now, once, and kept. If they
// cannot be set, the card starts from the mirror's own words.
cards.get('/words/:sessionId', async (req, res) => {
  const { session, image } = await sessionAndPicture(req.params.sessionId, req.userId);
  if (!session || !image) return res.status(404).json({ error: 'No picture for this session' });
  let words = image.cardWords?.body ? image.cardWords : null;
  if (!words) {
    try {
      words = await generateCardWords(getOpenAI(), { session: session.session, replyTurning: session.replyTurning });
      await KindleImage.updateOne({ _id: image._id }, { $set: { cardWords: words } });
    } catch (err) {
      console.warn('[cards] card words failed:', err.message);
      const c = session.session?.companion || {};
      words = { title: c.name || '', body: [c.predicament, c.turning].filter(Boolean).join('\n\n'), closing: '' };
    }
  }
  res.json({
    title: words.title || '',
    body: words.body || '',
    closing: words.closing || '',
    kicker: kickerFor(session),
  });
});
