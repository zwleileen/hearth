// server/lib/cardFiles.js
//
// The files a card is printed from, beyond the PDF itself.

import sharp from 'sharp';
import { CARD } from './cardPdf.js';

const PAGE_W_IN = (CARD.trimW + 2 * CARD.bleed) / 72;
const PAGE_H_IN = (CARD.trimH + 2 * CARD.bleed) / 72;

// The best copy of a picture this card has: the print master when there
// is one, the screen copy for pictures made before there was.
export function bestPicture(image) {
  return image.print?.length ? image.print : image.data;
}

// The front of the card as an image a printer can use on its own:
// cropped from the centre to the exact proportions of the card with its
// bleed (4.25 x 6.25 in), at full resolution, tagged with the dpi that
// makes it that size. Returns { buffer, width, height, dpi }.
export async function frontImage(image) {
  const source = bestPicture(image);
  const meta = await sharp(source).metadata();
  const ratio = PAGE_H_IN / PAGE_W_IN;
  let width = meta.width;
  let height = Math.round(width * ratio);
  if (height > meta.height) {
    height = meta.height;
    width = Math.round(height / ratio);
  }
  const left = Math.floor((meta.width - width) / 2);
  const top = Math.floor((meta.height - height) / 2);
  const dpi = Math.round(width / PAGE_W_IN);
  const buffer = await sharp(source)
    .extract({ left, top, width, height })
    .withMetadata({ density: dpi })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toBuffer();
  return { buffer, width, height, dpi };
}

// A small copy for lists. Older pictures have none, so one is made the
// first time it is asked for and kept.
export async function thumbFor(image) {
  if (image.thumb?.length) return image.thumb;
  const thumb = await sharp(image.data).resize({ width: 240 }).jpeg({ quality: 78 }).toBuffer();
  image.thumb = thumb;
  await image.save().catch(() => {});
  return thumb;
}
