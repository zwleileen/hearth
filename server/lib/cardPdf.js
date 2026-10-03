// server/lib/cardPdf.js
//
// The print file for a Carry card: a flat 4 x 6 inch card, two pages.
//   Page 1, the front: the picture of the mirror, full bleed.
//   Page 2, the back: the mirror's words on Old Lace, set in Hearth's
//   own type, with the reader's note under them and a small wordmark.
//
// Print conventions: each page carries 0.125 in of bleed on every side
// (so the page is 4.25 x 6.25 in, trimmed to 4 x 6), and all type sits
// inside a further 0.25 in safe margin, so nothing is lost if the cut
// wanders. The on-screen preview in src/card.jsx is drawn from the same
// numbers, so what the reader edits is what gets printed.
//
// The server is the judge of fit. If the words cannot fit the back even
// with the body type stepped down to its floor, buildCardPdf throws a
// CardFitError and the route says so, rather than printing a card with
// its last line cut off.

import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import * as fontkit from 'fontkit';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const FONT = {
  title: path.join(ASSETS, 'fonts', 'Fraunces-72pt-340-Italic.woff'),
  body: path.join(ASSETS, 'fonts', 'Fraunces-9pt-380.woff'),
  note: path.join(ASSETS, 'fonts', 'Fraunces-9pt-380-Italic.woff'),
  kicker: path.join(ASSETS, 'fonts', 'Inter-500.woff'),
};
const WORDMARK = path.join(ASSETS, 'hearth-wordmark-ink.png');

const PT = 72; // points per inch
export const CARD = {
  trimW: 4 * PT,
  trimH: 6 * PT,
  bleed: 0.125 * PT,
  safe: 0.25 * PT,
};
const PAGE_W = CARD.trimW + 2 * CARD.bleed;
const PAGE_H = CARD.trimH + 2 * CARD.bleed;
const INSET = CARD.bleed + CARD.safe;
const TEXT_W = PAGE_W - 2 * INSET;

const INK = '#1F4045';
const BODY_INK = '#486A6E';
const KICKER_INK = '#A8893E';
const LACE = '#F9F4E6';

// Type sizes in points. The preview uses the same values.
const TYPE = {
  kicker: 6.5,
  title: 17,
  body: 9,
  bodyFloor: 7.5,
  note: 9.5,
};
const WORDMARK_H = 9;

export class CardFitError extends Error {}

// Every character the reader typed must exist in the fonts, or the
// printer gets an empty box where a letter should be. The fonts carry
// the Latin set, which covers English and most Western European text.
const coverage = {};
function fontFor(key) {
  if (!coverage[key]) coverage[key] = fontkit.openSync(FONT[key]);
  return coverage[key];
}
export function missingCharacters(text, key) {
  const font = fontFor(key);
  const missing = new Set();
  for (const ch of text || '') {
    if (/\s/.test(ch)) continue;
    if (!font.hasGlyphForCodePoint(ch.codePointAt(0))) missing.add(ch);
  }
  return [...missing];
}

function paragraphs(text) {
  return (text || '')
    .split(/\n\s*\n|\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

// Measure the back at a given body size. Returns the heights of each
// part and whether the whole fits between the top inset and the
// wordmark.
function measureBack(doc, { kicker, title, body, note }, bodySize) {
  const h = {};
  doc.font('kicker').fontSize(TYPE.kicker);
  h.kicker = doc.heightOfString(kicker.toUpperCase(), { width: TEXT_W, characterSpacing: TYPE.kicker * 0.22 });
  doc.font('title').fontSize(TYPE.title);
  h.title = doc.heightOfString(title, { width: TEXT_W, lineGap: 1 });
  doc.font('body').fontSize(bodySize);
  h.body = doc.heightOfString(paragraphs(body), { width: TEXT_W, lineGap: bodySize * 0.5, paragraphGap: bodySize * 0.6 });
  h.note = 0;
  if (note) {
    doc.font('note').fontSize(TYPE.note);
    h.note = 16 + doc.heightOfString(paragraphs(note), { width: TEXT_W, lineGap: TYPE.note * 0.45 });
  }
  const total = h.kicker + 12 + h.title + 12 + h.body + h.note;
  const room = PAGE_H - 2 * INSET - WORDMARK_H - 18;
  return { h, total, room, fits: total <= room };
}

function register(doc) {
  for (const [name, file] of Object.entries(FONT)) doc.registerFont(name, file);
}

// Returns a Buffer holding the two-page PDF.
export async function buildCardPdf({ image, kicker, title, body, note = '' }) {
  const doc = new PDFDocument({
    size: [PAGE_W, PAGE_H],
    margin: 0,
    autoFirstPage: false,
    info: { Title: `Hearth card: ${title}`, Author: 'Hearth' },
  });
  register(doc);
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Find the largest body size that fits, stepping down by a quarter
  // point to the floor.
  const text = { kicker, title, body, note };
  let bodySize = TYPE.body;
  let m = measureBack(doc, text, bodySize);
  while (!m.fits && bodySize > TYPE.bodyFloor) {
    bodySize = Math.max(TYPE.bodyFloor, bodySize - 0.25);
    m = measureBack(doc, text, bodySize);
  }
  if (!m.fits) {
    doc.end();
    throw new CardFitError('The words are too long to fit on the back of the card. Shorten them a little.');
  }

  // Front: the picture, full bleed, cropped to fill.
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(LACE);
  doc.image(image, 0, 0, { cover: [PAGE_W, PAGE_H], align: 'center', valign: 'center' });

  // Back.
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(LACE);
  let y = INSET;
  doc.font('kicker').fontSize(TYPE.kicker).fillColor(KICKER_INK)
    .text(kicker.toUpperCase(), INSET, y, { width: TEXT_W, characterSpacing: TYPE.kicker * 0.22 });
  y += m.h.kicker + 12;
  doc.font('title').fontSize(TYPE.title).fillColor(INK)
    .text(title, INSET, y, { width: TEXT_W, lineGap: 1 });
  y += m.h.title + 12;
  doc.font('body').fontSize(bodySize).fillColor(BODY_INK)
    .text(paragraphs(body), INSET, y, { width: TEXT_W, lineGap: bodySize * 0.5, paragraphGap: bodySize * 0.6 });
  y += m.h.body;
  if (note) {
    y += 8;
    doc.moveTo(INSET, y).lineTo(INSET + 24, y).lineWidth(0.5).strokeColor(INK, 0.3).stroke();
    y += 8;
    doc.font('note').fontSize(TYPE.note).fillColor(INK)
      .text(paragraphs(note), INSET, y, { width: TEXT_W, lineGap: TYPE.note * 0.45 });
  }
  // The signature stays small: a card that works as an advertisement
  // stops working as a gift (BRAND_BRIEF §8.9).
  doc.image(WORDMARK, 0, PAGE_H - INSET - WORDMARK_H, { fit: [PAGE_W, WORDMARK_H], align: 'center', valign: 'center' });

  doc.end();
  return done;
}
