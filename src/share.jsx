// Hearth — the shareable object.
//
// WHY THIS EXISTS (docs/MEANING.md §6, docs/DOCTRINE_AUDIT.md).
//
// Hearth's growth loop was written down long before it was built: people
// do not share "I use an app", they share a beautiful thing. And the one
// principle that makes sharing clean here rather than grubby is Frankl's
// own. Meaning is found by reaching past yourself, so a reader who sends
// something to someone else is not doing marketing for Hearth, they are
// doing the thing the whole app is about. The loop and the method are
// the same act.
//
// The atom is deliberately the kept LINE, not the journal entry. A
// journal entry is confessional and unshareable; one noticed line is a
// haiku. Small, not exposing, and the editorial restraint that reads as
// a marketing liability is exactly what makes it worth a screenshot.
//
// Everything is drawn on a canvas at share time. No server render, no
// upload, no link that outlives the moment: the image is made on the
// reader's own device and handed to their own share sheet. Nothing about
// a person's inner life leaves Hearth to make this work.

// Card geometry. 4:5 is the portrait ratio that survives every feed
// without being cropped.
const W = 1080;
const H = 1350;

const LACE = '#F9F4E6';
const GREEN = '#1F4045';
const ECRU = '#E1BE74';
const MUTE = '#6e8489';

// Make sure the brand serif is actually rasterised before we draw with
// it. Without this the first card of a session silently falls back to
// Georgia, which is a different, worse object.
async function ensureFonts() {
  try {
    if (!document.fonts) return;
    await Promise.all([
      document.fonts.load('italic 300 72px Fraunces'),
      document.fonts.load('500 22px Inter'),
      document.fonts.load('400 20px "JetBrains Mono"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fallback fonts still produce a usable card.
  }
}

// Greedy wrap. Returns the lines, and shrinks the size until the block
// fits the space it was given, so a long line degrades gracefully
// instead of running off the card.
function layoutText(ctx, text, { maxWidth, maxHeight, font, startSize, minSize, lineHeight }) {
  let size = startSize;
  for (;;) {
    ctx.font = font(size);
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    const height = lines.length * size * lineHeight;
    if (height <= maxHeight || size <= minSize) {
      return { lines, size, height };
    }
    size -= 4;
  }
}

// The Threshold mark, drawn rather than loaded: an arched door on a
// baseline with the ember at the sill. Same geometry as the brand kit,
// scaled into the card.
function drawMark(ctx, cx, cy, scale) {
  const s = scale / 240;
  ctx.save();
  ctx.translate(cx - 120 * s, cy - 120 * s);
  ctx.scale(s, s);
  ctx.strokeStyle = GREEN;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(20, 196);
  ctx.lineTo(220, 196);
  ctx.stroke();

  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(76, 196);
  ctx.lineTo(76, 132);
  ctx.arc(120, 132, 44, Math.PI, 0);
  ctx.lineTo(164, 196);
  ctx.stroke();

  ctx.fillStyle = ECRU;
  ctx.beginPath();
  ctx.arc(120, 178, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Render one card. `text` is the line; `attribution` is the small mono
// label above it (e.g. the question it answered); `footer` overrides the
// wordmark line at the bottom.
export async function renderCard({ text, attribution = '', footer = 'Hearth · tend your why' }) {
  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Paper.
  ctx.fillStyle = LACE;
  ctx.fillRect(0, 0, W, H);

  // The hearth glow. The one sanctioned gradient in the whole brand,
  // and this is the one place a card earns it.
  const glow = ctx.createRadialGradient(W / 2, H * 0.34, 0, W / 2, H * 0.34, W * 0.72);
  glow.addColorStop(0, 'rgba(225, 190, 116, 0.28)');
  glow.addColorStop(1, 'rgba(225, 190, 116, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const margin = 110;
  const maxWidth = W - margin * 2;

  // The line itself: Fraunces italic, centred, sized to fit.
  const { lines, size } = layoutText(ctx, `“${text}”`, {
    maxWidth,
    maxHeight: H * 0.46,
    font: (s) => `italic 300 ${s}px Fraunces, Georgia, serif`,
    startSize: 78,
    minSize: 34,
    lineHeight: 1.28,
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = GREEN;
  ctx.font = `italic 300 ${size}px Fraunces, Georgia, serif`;
  const blockHeight = lines.length * size * 1.28;
  let y = H / 2 - blockHeight / 2 + size;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += size * 1.28;
  }

  // The small label above.
  if (attribution) {
    ctx.font = '400 22px "JetBrains Mono", monospace';
    ctx.fillStyle = MUTE;
    const label = attribution.toUpperCase();
    // Letter-spacing by hand: canvas has no tracking control.
    const spaced = label.split('').join(' ');
    ctx.fillText(spaced, W / 2, H / 2 - blockHeight / 2 - 54);
  }

  // Mark and wordmark at the foot.
  drawMark(ctx, W / 2, H - 220, 108);
  ctx.font = '500 24px Inter, system-ui, sans-serif';
  ctx.fillStyle = MUTE;
  ctx.fillText(footer, W / 2, H - 118);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95));
}

// A letter is a different object from a line. It is longer, it is
// addressed to someone, and it wants to be read rather than glanced at,
// so it sets left-aligned on a taller card at a calmer size.
export async function renderLetterCard({ to, body, from }) {
  await ensureFonts();

  const paragraphs = String(body).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  const margin = 108;
  const maxWidth = W - margin * 2;
  const measure = canvas.getContext('2d');

  // Lay out first so the card can be exactly as tall as the letter needs.
  const size = 40;
  const lineHeight = 1.55;
  const blocks = paragraphs.map((p) => layoutText(measure, p, {
    maxWidth,
    maxHeight: Infinity,
    font: (s) => `300 ${s}px Fraunces, Georgia, serif`,
    startSize: size,
    minSize: size,
    lineHeight,
  }));

  const salutationH = to ? size * 2.2 : 0;
  const bodyH = blocks.reduce((sum, b) => sum + b.lines.length * size * lineHeight + size * 0.9, 0);
  const signH = from ? size * 2.6 : 0;
  // Cap the canvas. A letter has no length limit worth imposing on the
  // reader, but browsers do impose one on canvas dimensions, and past it
  // toBlob quietly returns null and the share degrades to text with no
  // explanation. 6000px is far longer than any real letter and safely
  // inside every engine's limit.
  const MAX_H = 6000;
  const height = Math.min(MAX_H, Math.max(H, margin * 2 + salutationH + bodyH + signH + 300));

  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = LACE;
  ctx.fillRect(0, 0, W, height);
  const glow = ctx.createRadialGradient(W / 2, height * 0.18, 0, W / 2, height * 0.18, W * 0.8);
  glow.addColorStop(0, 'rgba(225, 190, 116, 0.22)');
  glow.addColorStop(1, 'rgba(225, 190, 116, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, height);

  ctx.textAlign = 'left';
  let y = margin + size * 1.6;

  if (to) {
    ctx.font = `italic 300 ${size + 8}px Fraunces, Georgia, serif`;
    ctx.fillStyle = GREEN;
    ctx.fillText(`${to},`, margin, y);
    y += salutationH;
  }

  ctx.fillStyle = GREEN;
  for (const b of blocks) {
    ctx.font = `300 ${size}px Fraunces, Georgia, serif`;
    for (const l of b.lines) {
      ctx.fillText(l, margin, y);
      y += size * lineHeight;
    }
    y += size * 0.9;
  }

  if (from) {
    ctx.font = `italic 300 ${size}px Fraunces, Georgia, serif`;
    ctx.fillText(from, margin, y + size * 0.6);
  }

  drawMark(ctx, W / 2, height - 172, 88);
  ctx.textAlign = 'center';
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  ctx.fillStyle = MUTE;
  ctx.fillText('written at Hearth', W / 2, height - 88);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95));
}

// Share a letter. The words lead, because a letter is meant to be read
// and forwarded, and the image rides along where the platform allows it.
export async function shareLetter({ to, body, from, plain }) {
  let blob = null;
  try {
    blob = await renderLetterCard({ to, body, from });
  } catch {
    blob = null;
  }
  const file = blob ? new File([blob], 'a-letter.png', { type: 'image/png' }) : null;

  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: plain });
      return 'shared';
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return 'cancelled';
  }
  try {
    if (navigator.share) {
      await navigator.share({ text: plain });
      return 'shared';
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(plain);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// Hand the card to the reader's own share sheet. Falls back, in order,
// to downloading the image and then to copying the text, so this always
// does something useful on every browser.
//
// Returns a short status string so the caller can say what happened.
export async function shareCard({ text, attribution, footer, shareText }) {
  let blob = null;
  try {
    blob = await renderCard({ text, attribution, footer });
  } catch {
    blob = null;
  }

  const file = blob ? new File([blob], 'hearth.png', { type: 'image/png' }) : null;

  // 1. Native share with the image.
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: shareText || undefined });
      return 'shared';
    }
  } catch (err) {
    // A user cancelling the sheet throws AbortError. That is not a
    // failure and must not cascade into a download they did not ask for.
    if (err && err.name === 'AbortError') return 'cancelled';
  }

  // 2. Native share, text only.
  try {
    if (navigator.share) {
      await navigator.share({ text: shareText || text });
      return 'shared';
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return 'cancelled';
  }

  // 3. Save the image.
  if (blob) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hearth.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return 'saved';
    } catch { /* fall through to text */ }
  }

  // 4. Copy the words.
  try {
    await navigator.clipboard.writeText(shareText || text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export const SHARE_RESULT_MESSAGE = {
  shared: 'Sent.',
  saved: 'Saved to your device.',
  copied: 'Copied.',
  cancelled: '',
  failed: 'Could not share that just now.',
};
