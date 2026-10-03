// server/lib/cardPdf.js
//
// The keepsake card made from a Carry session: two pages, 4.25 x 6.25
// inches. It is the file a reader downloads and shares, and the file a
// printer prints, so it is one design for both. The design follows
// carry_postcard/ (hearth_keepsake_front.png and _back.png), measured
// from those files at 300 dpi, the same page as this one.
//
//   Front. The painting as a plate: a paper margin all round and a faint
//   impression line just outside it, like a print tipped into a book.
//   Below it, the title in small spaced capitals and the card's date in
//   gold, the way a print is titled and dated. No logo, so it can stand
//   on a shelf as a picture.
//
//   Back. One centred page: a kicker, the title in italic, a small gold
//   diamond, the mirror told in a few short lines, then its closing line
//   in italic a shade darker. Lower down, a short rule and a flyleaf
//   inscription on one line: For on the left, From on the right, each
//   with room for handwriting or a typed name. Hearth's arch with its
//   gold ember at the foot, as a colophon.
//
// Everything sits on flat Old Lace, so the page can be printed at 4.25 x
// 6.25 in, or trimmed to 4 x 6 with the outer eighth of an inch as bleed.
// Type is kept as type, so it prints crisp.
//
// The server is the judge of fit. If the words cannot fit above the
// inscription even with the type stepped down to its floor, buildCardPdf
// throws a CardFitError and the route says so.

import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import * as fontkit from 'fontkit';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const FONT = {
  title: path.join(ASSETS, 'fonts', 'Fraunces-72pt-340-Italic.woff'),
  body: path.join(ASSETS, 'fonts', 'Fraunces-9pt-380.woff'),
  note: path.join(ASSETS, 'fonts', 'Fraunces-9pt-380-Italic.woff'),
  caps: path.join(ASSETS, 'fonts', 'Fraunces-9pt-560.woff'),
};

const PT = 72; // points per inch
export const CARD = {
  trimW: 4 * PT,
  trimH: 6 * PT,
  bleed: 0.125 * PT,
  safe: 0.25 * PT,
};
const PAGE_W = CARD.trimW + 2 * CARD.bleed; // 306
const PAGE_H = CARD.trimH + 2 * CARD.bleed; // 450
const CENTRE = PAGE_W / 2;

const INK = '#1F4045';
const BODY_INK = '#3F5F64';
const GOLD = '#A8893E';
const EMBER = '#E1BE74';
const LACE = '#F9F4E6';

// The layout, in points on the page. The preview (src/card.jsx) uses
// the same numbers.
export const LAYOUT = {
  // Front
  plate: { x: 40.3, y: 33.8, w: 225.4, h: 345.4 }, // the painting
  impression: 3.5, // the faint line sits this far outside the painting
  frontTitleY: 401, // top of the spaced-capital title
  frontTitleSize: 6.3,
  frontDateSize: 5,
  // Back
  column: { x: 40.3, w: 225.4 },
  kickerY: 58,
  kickerSize: 5.3,
  titleSize: 15,
  bodySize: 8.6,
  bodyFloor: 7.4,
  bodyLeading: 1.53,
  closingStep: 1, // the closing line is this much larger than the body
  wordsBottom: 342, // the words must end above here
  ruleY: 360,
  ruleW: 19,
  // The inscription, one line: For in the left half of the column, From
  // in the right, a gutter between.
  inscriptionY: 389, // the baseline rule both names sit on
  inscriptionGutter: 16,
  labelSize: 7.5,
  nameSize: 8.5,
  markBaseY: 424, // the colophon's floor
};

export class CardFitError extends Error {}

// Every character must exist in the fonts, or the printer gets an empty
// box where a letter should be. The fonts carry the Latin set, which
// covers English and most Western European text.
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
    .filter(Boolean);
}

function register(doc) {
  for (const [name, file] of Object.entries(FONT)) doc.registerFont(name, file);
}

// The gap that gives a target line pitch (size x leading), whatever the
// font's own line height is.
function lineGapFor(doc, size, leading) {
  doc.fontSize(size);
  return Math.max(0, size * leading - doc.currentLineHeight(true));
}

// Measure the back's words at a body size: the top block (kicker,
// title, diamond) and then the paragraphs and the closing line.
function measureBack(doc, { kicker, title, body, closing }, size) {
  const L = LAYOUT;
  const w = L.column.w;
  doc.font('caps').fontSize(L.kickerSize);
  const kickerH = doc.heightOfString(kicker.toUpperCase(), { width: w, characterSpacing: L.kickerSize * 0.3, align: 'center' });
  doc.font('title').fontSize(L.titleSize);
  const titleH = doc.heightOfString(title, { width: w, align: 'center', lineGap: 1 });
  const top = L.kickerY + kickerH + 9 + titleH + 14 + 4 + 18; // kicker, gap, title, gap, diamond, gap
  doc.font('body');
  const gap = lineGapFor(doc, size, L.bodyLeading);
  const paras = paragraphs(body);
  let h = 0;
  paras.forEach((p, i) => {
    h += doc.heightOfString(p, { width: w, lineGap: gap });
    if (i < paras.length - 1) h += size * 0.75;
  });
  let closingH = 0;
  if (closing) {
    doc.font('note');
    const cs = size + L.closingStep;
    const cgap = lineGapFor(doc, cs, 1.45);
    closingH = size * 1.2 + doc.heightOfString(paragraphs(closing).join(' '), { width: w, lineGap: cgap });
  }
  const end = top + h + closingH;
  return { top, kickerH, titleH, gap, end, fits: end <= L.wordsBottom };
}

// The two halves of the inscription line: where each label sits and
// where its hairline runs. The preview (src/card.jsx) lays them out the
// same way.
function inscriptionHalves(doc) {
  const L = LAYOUT;
  const halfW = (L.column.w - L.inscriptionGutter) / 2;
  doc.font('note').fontSize(L.labelSize);
  return [
    { key: 'for', label: 'For', x: L.column.x },
    { key: 'from', label: 'From', x: L.column.x + halfW + L.inscriptionGutter },
  ].map((h) => {
    const labelW = doc.widthOfString(h.label);
    const lineX = h.x + labelW + 5;
    return { ...h, lineX, lineW: h.x + halfW - lineX };
  });
}

// The arch mark, drawn from public/brand/symbol-paper.svg: a floor, an
// arched opening, and the gold ember inside it. Strokes are heavier than
// the SVG's, because at colophon size its own would print as a hairline.
function drawMark(doc, cx, baseY, scale) {
  doc.save();
  doc.translate(cx - 120 * scale, baseY - 196 * scale).scale(scale);
  // Full ink: the lines above leave a faint stroke opacity set.
  doc.moveTo(52, 196).lineTo(188, 196).lineWidth(5).strokeColor(INK, 1).stroke();
  doc.path('M 76 196 L 76 132 A 44 44 0 0 1 164 132 L 164 196')
    .lineWidth(5.5).lineCap('square').strokeColor(INK, 1).stroke();
  doc.circle(120, 178, 10).fill(EMBER);
  doc.restore();
}

// Returns a Buffer holding the two-page PDF.
//   image     the painting (JPEG or PNG buffer)
//   kicker    the mirror's label, e.g. "An image that meets you"
//   title, body, closing   the words on the back
//   forName, fromName      optional, set on the inscription lines
//   date      the card's date as it should read, e.g. "4 October 2026"
export async function buildCardPdf({ image, kicker, title, body, closing = '', forName = '', fromName = '', date = '' }) {
  const L = LAYOUT;
  const doc = new PDFDocument({
    size: [PAGE_W, PAGE_H],
    margin: 0,
    autoFirstPage: false,
    info: { Title: `Hearth keepsake: ${title}`, Author: 'Hearth' },
  });
  register(doc);
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Find the largest body size that fits, stepping down to the floor.
  const text = { kicker, title, body, closing };
  let size = L.bodySize;
  let m = measureBack(doc, text, size);
  while (!m.fits && size > L.bodyFloor) {
    size = Math.max(L.bodyFloor, Math.round((size - 0.2) * 100) / 100);
    m = measureBack(doc, text, size);
  }
  if (!m.fits) {
    doc.end();
    throw new CardFitError('The words are too long to fit on the back of the card. Shorten them a little.');
  }

  // ── Front ──────────────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(LACE);
  const P = L.plate;
  const e = L.impression;
  doc.rect(P.x - e, P.y - e, P.w + 2 * e, P.h + 2 * e).lineWidth(0.5).strokeColor(INK, 0.12).stroke();
  doc.save();
  doc.rect(P.x, P.y, P.w, P.h).clip();
  doc.image(image, P.x, P.y, { cover: [P.w, P.h], align: 'center', valign: 'center' });
  doc.restore();

  // The title in spaced capitals, stepping down if it is long, and the
  // card's date in gold beneath it.
  const capsW = P.w + 2 * e;
  const capsOpts = (sz) => ({ width: capsW, align: 'center', characterSpacing: sz * 0.25 });
  let ts = L.frontTitleSize;
  doc.font('caps').fontSize(ts);
  while (doc.heightOfString(title.toUpperCase(), capsOpts(ts)) > ts * 2.8 && ts > 5) {
    ts -= 0.25;
    doc.fontSize(ts);
  }
  doc.fillColor(INK).text(title.toUpperCase(), P.x - e, L.frontTitleY, capsOpts(ts));
  if (date) {
    doc.font('caps').fontSize(L.frontDateSize).fillColor(GOLD)
      .text(date.toUpperCase(), P.x - e, doc.y + 4, { width: capsW, align: 'center', characterSpacing: L.frontDateSize * 0.3 });
  }

  // ── Back ───────────────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(LACE);
  const C = L.column;
  let y = L.kickerY;
  doc.font('caps').fontSize(L.kickerSize).fillColor(GOLD)
    .text(kicker.toUpperCase(), C.x, y, { width: C.w, align: 'center', characterSpacing: L.kickerSize * 0.3 });
  y += m.kickerH + 9;
  doc.font('title').fontSize(L.titleSize).fillColor(INK)
    .text(title, C.x, y, { width: C.w, align: 'center', lineGap: 1 });
  y += m.titleH + 14;
  // The small gold diamond.
  doc.save();
  doc.translate(CENTRE, y + 2).rotate(45);
  doc.rect(-1.6, -1.6, 3.2, 3.2).fill(EMBER);
  doc.restore();
  y = m.top;

  doc.font('body').fontSize(size).fillColor(BODY_INK);
  const paras = paragraphs(body);
  paras.forEach((p, i) => {
    doc.text(p, C.x, y, { width: C.w, lineGap: m.gap });
    y = doc.y + (i < paras.length - 1 ? size * 0.75 : 0);
  });
  if (closing) {
    y += size * 1.2;
    const cs = size + L.closingStep;
    doc.font('note');
    const cgap = lineGapFor(doc, cs, 1.45);
    doc.fillColor(INK).text(paragraphs(closing).join(' '), C.x, y, { width: C.w, lineGap: cgap });
  }

  // The inscription: a short rule, then one line with For on the left
  // and From on the right, each label in italic with a hairline after it
  // to the edge of its half, waiting for a name.
  doc.moveTo(CENTRE - L.ruleW / 2, L.ruleY).lineTo(CENTRE + L.ruleW / 2, L.ruleY)
    .lineWidth(0.5).strokeColor(INK, 0.3).stroke();
  for (const half of inscriptionHalves(doc)) {
    const name = half.key === 'for' ? forName : fromName;
    // Label and name share one baseline, just above the hairline.
    doc.font('note').fontSize(L.labelSize).fillColor(INK, 0.75)
      .text(half.label, half.x, L.inscriptionY - 2, { lineBreak: false, baseline: 'alphabetic' });
    doc.fillOpacity(1);
    doc.moveTo(half.lineX, L.inscriptionY).lineTo(half.lineX + half.lineW, L.inscriptionY)
      .lineWidth(0.5).strokeColor(INK, 0.28).stroke();
    if (name) {
      doc.font('note').fontSize(L.nameSize).fillColor(INK)
        .text(name, half.lineX + 2, L.inscriptionY - 2, { width: half.lineW - 4, lineBreak: false, ellipsis: true, align: 'center', baseline: 'alphabetic' });
    }
  }

  // The colophon: the arch and its ember, small, at the foot.
  drawMark(doc, CENTRE, L.markBaseY, 0.12);

  doc.end();
  return done;
}
