// Hearth — a card from a Carry session.
//
// The picture of the mirror on the front. On the back, laid out as a
// postcard back, the mirror's own words, which the reader can change in
// place, and a note of their own. Then it is shared: as a postcard PDF,
// or the picture alone, to keep, print or pass on.
//
// Posting a printed card (Mail it) is built but switched off while
// printing is worked out; see MAIL_ENABLED.
//
// The preview is drawn to the print file's numbers (server/lib/
// cardPdf.js): a 4 x 6 inch card, type sized in points against the
// card's width, the same safe margin, and the body type stepping down a
// quarter point at a time when the words run long, as the print file
// does. What the reader sees is what is printed. The server still has
// the last word on fit, and says so beside the words if they disagree.
//
// Sharing rules (BRAND_BRIEF §5.12): the mirror is a conclusion, so it
// may leave the app. The feeling the reader brought to the session is
// never on the card.

import React from 'react';
import { Headline, Kicker, Rule, Icon } from './atoms.jsx';
import { api } from './api.js';
import { prefersShareSheet } from './share.jsx';

// The keepsake card in points, matching LAYOUT in server/lib/cardPdf.js
// (and the design in carry_postcard/). The preview is the full 4.25 x
// 6.25 in page, so every point here is a fraction of PAGE_W.
const PAGE_W = 306;
const L = {
  plate: { x: 40.3, y: 33.8, w: 225.4, h: 345.4 },
  impression: 3.5,
  frontTitleY: 401,
  frontTitleSize: 6.3,
  frontDateSize: 5,
  column: { x: 40.3, w: 225.4 },
  kickerY: 58,
  kickerSize: 5.3,
  titleSize: 15,
  bodySize: 8.6,
  bodyFloor: 7.4,
  bodyLeading: 1.53,
  closingStep: 1,
  wordsBottom: 342,
  ruleY: 360,
  ruleW: 19,
  inscriptionY: 389,
  inscriptionGutter: 16,
  labelSize: 7.5,
  nameSize: 8.5,
  markBaseY: 424,
};

// Posting a printed card. Off for now: readers share the postcard
// themselves. Turn it back on once the print room is connected and
// printing is settled; the whole flow, its server route and its email
// are kept as they were.
const MAIL_ENABLED = false;

// What a shared postcard says alongside it. Plain and first person, the
// one place Hearth is not literary (BRAND_BRIEF §5.12).
const SHARE_TEXT = 'I made this for you.';
// Ceilings against abuse, as on the server. Fit is what really limits
// the words, and the preview measures it.
const LIMIT = { title: 90, body: 2000, closing: 300, forName: 60, fromName: 60 };

const MIRROR_LABEL = {
  person: 'Someone who stood here',
  story: 'Someone who stood here',
  nature: 'An image that meets you',
  parable: 'A small parable',
  image: 'An image that meets you',
};

const ADDRESS_FIELDS = [
  { key: 'name', label: 'Their name', autoComplete: 'name', required: true, max: 100 },
  { key: 'line1', label: 'Address', autoComplete: 'address-line1', required: true, max: 120 },
  { key: 'line2', label: 'Flat, suite or building', autoComplete: 'address-line2', max: 120, hint: 'Optional' },
  { key: 'city', label: 'Town or city', autoComplete: 'address-level2', required: true, max: 80, half: true },
  { key: 'postalCode', label: 'Postcode', autoComplete: 'postal-code', max: 20, half: true, hint: 'If there is one' },
  { key: 'region', label: 'State or region', autoComplete: 'address-level1', max: 80, half: true, hint: 'Optional' },
  { key: 'country', label: 'Country', autoComplete: 'country-name', required: true, max: 60, half: true },
];
const EMPTY_ADDRESS = { name: '', line1: '', line2: '', city: '', postalCode: '', region: '', country: '' };

// The mirror's own words, for when the card's words cannot be fetched.
function mirrorWords(session) {
  const c = session?.session?.companion || {};
  return {
    title: c.name || '',
    body: [c.predicament, c.turning].filter(Boolean).join('\n\n'),
    closing: '',
  };
}

// The words survive leaving the page and coming back, on this device.
// The address does not: it belongs to someone else and is only kept
// with the order it was given for.
// Versioned: drafts from the postcard design held a note, not a closing.
function draftKey(id) { return `hearth.keepsake.${id}`; }
function readDraft(id) {
  try { return JSON.parse(localStorage.getItem(draftKey(id)) || 'null'); } catch { return null; }
}
function writeDraft(id, words) {
  try { localStorage.setItem(draftKey(id), JSON.stringify(words)); } catch { /* private mode */ }
}
function clearDraft(id) {
  try { localStorage.removeItem(draftKey(id)); } catch { /* private mode */ }
}

function todayKey() { return new Date().toISOString().slice(0, 10); }

// Today in the reader's own calendar, as YYYY-MM-DD, for the card's date.
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The moment after sending. A card to someone else is a giving, so this
// is where Carry hands over to Give: the colour turns to Give's, and the
// reader can keep the giving in their meaning log, where Give and their
// meaning narrative will find it. A card to themselves stays in Carry.
// Keeping is one tap and never automatic: noticing is free, keeping is
// deliberate (BRAND_BRIEF §5.2).
function SentCard({ go, sent, picture, onBack }) {
  const self = sent.forSelf;
  const first = (sent.name || '').split(/\s+/)[0] || sent.name;
  const [line, setLine] = React.useState(self ? `A card to myself: ${sent.title}` : `A card for ${first}: ${sent.title}`);
  const [state, setState] = React.useState('idle'); // idle | keeping | kept | failed

  async function keep() {
    const text = line.trim();
    if (text.length < 2 || state === 'keeping') return;
    setState('keeping');
    try {
      await api.meaning.create({
        text,
        prompt: 'A card from Carry',
        avenue: self ? 'carry' : 'give',
        forWhom: self ? '' : sent.name,
        date: todayKey(),
      });
      setState('kept');
    } catch {
      setState('failed');
    }
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 56 }}>
      <section style={{ padding: '14px 22px 0' }}>
        <Kicker accent={self ? 'dogwood' : 'ecru'}>{self ? 'Carry' : 'Give'}</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          A card for<br/><span style={{ fontStyle: 'italic' }}>{self ? 'you, later.' : `${first}.`}</span>
        </Headline>
        <p className="body" style={{ margin: '18px 0 0', maxWidth: 440 }}>
          Card {sent.ref}. It will be printed and posted to {self ? 'you' : sent.name} in {sent.city}.
        </p>
        <img src={picture.image} alt={picture.alt || ''} style={{ display: 'block', width: 168, marginTop: 28 }}/>
      </section>

      <section style={{ padding: '36px 22px 0' }}>
        <div className="hh-moment" style={{ background: self ? 'var(--hh-dogwood)' : 'var(--hh-ecru)' }}>
          <span className="hh-moment-eyebrow">{self ? 'Keep it in Carry' : 'Keep it in what you gave'}</span>
          {state === 'kept' ? (
            <>
              <p className="hh-moment-prompt">{self ? 'Kept, for when it arrives.' : `Kept, with what you have given.`}</p>
              <div style={{ marginTop: 14 }}>
                {self
                  ? <button onClick={onBack} style={solidBtn}>Back to the session</button>
                  : <button onClick={() => go('give')} style={solidBtn}><span>See it in Give</span>{Icon.arrow(14, 'currentColor')}</button>}
              </div>
            </>
          ) : (
            <>
              <p className="hh-moment-prompt">{self ? 'A line for your meaning log, in your own words if you like.' : `A line for your meaning log. It will sit in Give, with ${first}'s name.`}</p>
              <textarea
                className="hearth-input"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                aria-label="The line to keep"
                style={{ minHeight: 64, background: 'var(--hh-lace)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '14px 16px' }}
              />
              <div style={{ marginTop: 14, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={keep} disabled={state === 'keeping' || line.trim().length < 2}
                  style={state === 'keeping' ? ghostBtn : solidBtn}>
                  {state === 'keeping' ? 'Keeping…' : 'Keep it'}
                </button>
                <button onClick={onBack} style={{ ...quietLink, textDecoration: 'none' }}>Not now</button>
              </div>
              {state === 'failed' && (
                <p className="body" style={{ margin: '12px 0 0' }}>That did not keep. Try again in a moment.</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// Hand a Blob to the browser as a download.
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function CardScreen({ go, payload, user }) {
  const picture = payload?.picture;
  const session = payload?.session;
  const sessionId = session?.id;

  // The words the card starts from, set for a card from the mirror
  // (server/lib/cardWords.js), with the picture's number. The reader's
  // own draft, if they have been here before, wins.
  const [start, setStart] = React.useState(null);
  const [words, setWords] = React.useState(() => (sessionId ? readDraft(sessionId) : null));
  const [fit, setFit] = React.useState({ fits: true, bodyPt: L.bodySize });
  React.useEffect(() => {
    if (!sessionId) return undefined;
    let live = true;
    const blank = { forName: '', fromName: '' };
    api.cards.words(sessionId)
      .then((d) => {
        if (!live) return;
        setStart(d);
        setWords((w) => w || { title: d.title, body: d.body, closing: d.closing, ...blank });
      })
      .catch(() => {
        if (!live) return;
        const m = mirrorWords(session);
        setStart({ ...m, kicker: null });
        setWords((w) => w || { ...m, ...blank });
      });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const [mailOpen, setMailOpen] = React.useState(false);
  // Who the card is for. Someone else is a giving; the reader themself is
  // a keepsake to receive later. Both are posted the same way.
  const [forSelf, setForSelf] = React.useState(false);
  const [address, setAddress] = React.useState(EMPTY_ADDRESS);
  const [download, setDownload] = React.useState(null); // null | 'pdf' | 'image' | error string
  const [errors, setErrors] = React.useState({});
  const [sendError, setSendError] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(null);

  const backRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  const firstFieldRef = React.useRef(null);

  React.useEffect(() => { if (sessionId && words) writeDraft(sessionId, words); }, [words, sessionId]);

  // Size every text box to its words, then step the body type down
  // until the words end above the inscription, exactly as the print file
  // does. The closing line follows the body's size, a point larger.
  const fitBack = React.useCallback(() => {
    const back = backRef.current;
    const content = contentRef.current;
    const body = bodyRef.current;
    if (!back || !content || !body) return;
    const k = back.clientWidth / PAGE_W; // px per point
    const room = (L.wordsBottom - L.kickerY) * k;
    const closing = content.querySelector('#card-closing');
    let pt = L.bodySize;
    for (;;) {
      body.style.fontSize = `${pt * k}px`;
      if (closing) {
        closing.style.fontSize = `${(pt + L.closingStep) * k}px`;
        closing.style.marginTop = `${pt * 1.2 * k}px`;
      }
      for (const ta of content.querySelectorAll('textarea')) {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      }
      if (content.scrollHeight <= room + 0.5 || pt <= L.bodyFloor) break;
      pt = Math.max(L.bodyFloor, Math.round((pt - 0.2) * 100) / 100);
    }
    const fits = content.scrollHeight <= room + 0.5;
    setFit((f) => (f.fits === fits && f.bodyPt === pt ? f : { fits, bodyPt: pt }));
  }, []);

  React.useLayoutEffect(() => { fitBack(); }, [words, fitBack]);
  React.useEffect(() => {
    if (!backRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => fitBack());
    ro.observe(backRef.current);
    // Fraunces may arrive after first paint and change every measure.
    if (document.fonts?.ready) document.fonts.ready.then(fitBack).catch(() => {});
    return () => ro.disconnect();
  }, [fitBack]);

  React.useEffect(() => { if (mailOpen) firstFieldRef.current?.focus(); }, [mailOpen]);

  function chooseFor(self) {
    setForSelf(self);
    // Their own name is the one field Hearth already knows.
    if (self && !address.name.trim() && user?.name) setField('name', user.name);
    if (!self && address.name === (user?.name || '')) setField('name', '');
  }

  // The postcard PDF for the words as they are now, made once and kept
  // until the words change, so sharing it can be instant.
  const w0 = words || { title: '', body: '', closing: '', forName: '', fromName: '' };
  const wordsKey = JSON.stringify([w0.title, w0.body, w0.closing, w0.forName, w0.fromName]);
  const postcard = React.useRef({ key: '', file: null });
  async function postcardFile() {
    if (postcard.current.key === wordsKey && postcard.current.file) return postcard.current.file;
    const blob = await api.cards.printFile({ sessionId, ...w0, date: localDate() });
    const file = new File([blob], 'hearth-keepsake.pdf', { type: 'application/pdf' });
    postcard.current = { key: wordsKey, file };
    return file;
  }

  // The Share button is for phones and tablets, where the share sheet
  // takes files. On a computer there is no Share button, only the two
  // downloads, which is how a file leaves a computer anyway (see
  // prefersShareSheet in share.jsx for what Chrome on a Mac did).
  const canShareFiles = React.useMemo(() => {
    try {
      return prefersShareSheet() && !!navigator.canShare
        && navigator.canShare({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] });
    } catch { return false; }
  }, []);

  // A share sheet only opens straight after a tap, and making the PDF
  // takes a moment, so it is made ahead, quietly, once the words settle.
  React.useEffect(() => {
    if (!canShareFiles || !sessionId || !fit.fits || !w0.title.trim() || !w0.body.trim()) return undefined;
    const t = setTimeout(() => { postcardFile().catch(() => {}); }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsKey, fit.fits, canShareFiles, sessionId]);

  // idle | making | ready | failed, or a message to show
  const [shareState, setShareState] = React.useState('idle');

  function readyToMake() {
    const e = {};
    if (!w0.title.trim()) e.title = 'The card needs a title.';
    if (!w0.body.trim()) e.body = 'The card needs some words on the back.';
    if (!fit.fits) e.body = 'The words run past the edge of the card. Shorten them a little.';
    setErrors((prev) => ({ ...prev, ...e }));
    return !Object.keys(e).length;
  }

  async function sharePostcard() {
    if (shareState === 'making' || !readyToMake()) return;
    const cached = postcard.current.key === wordsKey ? postcard.current.file : null;
    let file = cached;
    if (!file) {
      setShareState('making');
      try { file = await postcardFile(); } catch (err) {
        setShareState(err.data?.error || 'Could not make the card.');
        return;
      }
    }
    try {
      await navigator.share({ files: [file], text: SHARE_TEXT });
      setShareState('idle');
    } catch (err) {
      if (err?.name === 'AbortError') { setShareState('idle'); return; }
      // Making the file took long enough that the browser no longer
      // counts this as the reader's tap. It is ready now; one more tap.
      if (!cached && err?.name === 'NotAllowedError') { setShareState('ready'); return; }
      setShareState('failed');
    }
  }

  async function downloadFile(kind) {
    if (download === 'pdf' || download === 'image') return;
    if (kind === 'pdf' && !readyToMake()) return;
    setDownload(kind);
    try {
      if (kind === 'pdf') {
        saveBlob(await postcardFile(), 'hearth-keepsake.pdf');
      } else {
        saveBlob(await api.cards.printImage(sessionId), 'hearth-painting.jpg');
      }
      setDownload(null);
    } catch (err) {
      setDownload(err.data?.error || 'Could not make the file.');
    }
  }

  function backToSession() {
    go('kindle', session ? { reopen: session } : null);
  }

  // ── No session in hand (a reload, or arriving here directly) ──
  if (!picture?.image || !sessionId) {
    return (
      <div className="fade-in" style={{ padding: '14px 22px 40px' }}>
        <Kicker>Carry</Kicker>
        <Headline size="title" italic style={{ marginTop: 14 }}>Open a session to make its card.</Headline>
        <p className="body" style={{ margin: '16px 0 24px', maxWidth: 420 }}>
          A card is made from a session's picture. Open one from your sessions in Carry, then choose Create a card.
        </p>
        <button onClick={() => go('kindle')} style={lineBtn}>Go to Carry</button>
      </div>
    );
  }

  const kicker = start?.kicker || MIRROR_LABEL[session.session?.companion?.kind] || MIRROR_LABEL.image;
  const changed = !!(start && words) && (words.title !== start.title || words.body !== start.body || words.closing !== start.closing);

  function setWord(key, value) {
    setWords((w) => ({ ...w, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }
  function setField(key, value) {
    setAddress((a) => ({ ...a, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!w0.title.trim()) e.title = 'The card needs a title.';
    if (!w0.body.trim()) e.body = 'The card needs some words on the back.';
    for (const key of Object.keys(LIMIT)) {
      if ((w0[key] || '').length > LIMIT[key]) e[key] = `Keep this under ${LIMIT[key]} characters.`;
    }
    if (!fit.fits) e.body = 'The words run past the edge of the card. Shorten them a little.';
    for (const f of ADDRESS_FIELDS) {
      if (f.required && !address[f.key].trim()) e[f.key] = 'Required.';
    }
    return e;
  }

  async function send(ev) {
    ev.preventDefault();
    if (sending) return;
    setSendError(null);
    const e = validate();
    setErrors(e);
    const firstBad = Object.keys(e)[0];
    if (firstBad) {
      document.getElementById(`card-${firstBad}`)?.focus();
      return;
    }
    // Payment goes here. When Stripe Checkout arrives, this creates the
    // order as awaiting payment and hands the reader to Checkout; the
    // print file is sent from the payment webhook, not from here.
    setSending(true);
    try {
      const data = await api.cards.send({
        sessionId,
        ...w0,
        date: localDate(),
        recipient: address,
        forSelf,
      });
      clearDraft(sessionId);
      setSent({ ...data, forSelf, title: w0.title.trim(), name: address.name.trim(), city: address.city.trim() });
      // On a phone the page itself scrolls, on a wide screen the panel.
      document.getElementById('hearth-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      if (err.data?.fields) {
        setErrors(err.data.fields);
        const k = Object.keys(err.data.fields)[0];
        if (k) document.getElementById(`card-${k}`)?.focus();
      }
      setSendError(
        err.status === 401 ? 'Your session ended. Sign in again to send the card.'
          : err.data?.error || 'Something went wrong. Nothing was sent. Try again.',
      );
    } finally {
      setSending(false);
    }
  }

  // ── Sent ──
  if (sent) {
    return <SentCard go={go} sent={sent} picture={picture} onBack={backToSession}/>;
  }

  const k = (pt) => `${(pt / PAGE_W) * 100}cqw`;
  // The card's date, in the reader's own calendar, as it reads on the
  // front. The same date goes to the server for the PDF.
  const cardDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fade-in" style={{ paddingBottom: 56 }}>
      <section style={{ padding: '4px 22px 0' }}>
        <button onClick={backToSession} style={crumbBtn}>
          {Icon.back(18, 'currentColor')}<span>The session</span>
        </button>
      </section>

      <section style={{ padding: '24px 22px 0' }}>
        <Kicker>Carry</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          Make it<br/><span style={{ fontStyle: 'italic' }}>a keepsake.</span>
        </Headline>
        <p className="body" style={{ margin: '18px 0 0', maxWidth: 440 }}>
          The painting on the front, as a plate. On the back, its story and the line to keep, yours to change, and who it is for.
        </p>
      </section>

      {/* The keepsake, both sides, drawn to the print file's numbers */}
      <section style={{ padding: '32px 22px 0' }}>
        <div className="card-sides">
          <figure className="card-side">
            <div className="card-face card-page">
              {/* The plate: the painting with a faint impression line
                  just outside it, on a paper margin. */}
              <div aria-hidden="true" className="card-impression" style={{
                left: k(L.plate.x - L.impression), top: k(L.plate.y - L.impression),
                width: k(L.plate.w + 2 * L.impression), height: k(L.plate.h + 2 * L.impression),
              }}/>
              <img src={picture.image} alt={picture.alt || ''} style={{
                position: 'absolute', left: k(L.plate.x), top: k(L.plate.y), width: k(L.plate.w), height: k(L.plate.h),
                objectFit: 'cover', display: 'block',
              }}/>
              <div className="card-caps" style={{
                left: k(L.plate.x - L.impression), width: k(L.plate.w + 2 * L.impression), top: k(L.frontTitleY),
                fontSize: k(L.frontTitleSize), letterSpacing: '0.25em', color: 'var(--hh-green)',
              }}>
                {w0.title}
                <span style={{ display: 'block', marginTop: k(4), fontSize: k(L.frontDateSize), letterSpacing: '0.3em', color: 'var(--hh-ecru-deep)' }}>
                  {cardDate}
                </span>
              </div>
            </div>
            <figcaption className="card-caption">Front</figcaption>
          </figure>

          <figure className="card-side">
            {/* The page is the query container, so every cqw is a fraction
                of the page's width, as every point in the print file is. */}
            <div ref={backRef} className="card-face card-page">
              {!words ? (
                <p className="card-setting" style={{ top: k(L.kickerY), left: k(L.column.x), width: k(L.column.w), fontSize: k(9) }}>
                  Setting the words…
                </p>
              ) : (
                <div ref={contentRef} style={{ position: 'absolute', top: k(L.kickerY), left: k(L.column.x), width: k(L.column.w) }}>
                  <div className="card-caps" style={{
                    position: 'static', fontSize: k(L.kickerSize), letterSpacing: '0.3em', color: 'var(--hh-ecru-deep)',
                  }}>
                    {kicker}
                  </div>
                  <textarea
                    id="card-title" className="card-edit" rows={1} value={words.title} maxLength={LIMIT.title}
                    onChange={(e) => setWord('title', e.target.value.replace(/\n/g, ' '))}
                    aria-label="Title of the card" aria-invalid={!!errors.title}
                    style={{
                      marginTop: k(9), textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 340,
                      fontVariationSettings: "'opsz' 72", fontSize: k(L.titleSize), lineHeight: 1.2, color: 'var(--hh-green)',
                    }}
                  />
                  <div aria-hidden="true" className="card-diamond" style={{ width: k(3.2), height: k(3.2), margin: `${k(14)} auto ${k(18)}` }}/>
                  <textarea
                    id="card-body" ref={bodyRef} className="card-edit" rows={4} value={words.body} maxLength={LIMIT.body}
                    onChange={(e) => setWord('body', e.target.value)}
                    aria-label="The story on the back of the card" aria-invalid={!!errors.body}
                    style={{
                      fontFamily: 'var(--serif)', fontWeight: 380, fontVariationSettings: "'opsz' 9",
                      lineHeight: L.bodyLeading, color: '#3F5F64',
                    }}
                  />
                  <textarea
                    id="card-closing" className="card-edit" rows={1} value={words.closing} maxLength={LIMIT.closing}
                    onChange={(e) => setWord('closing', e.target.value)}
                    placeholder="A line to keep, if you like."
                    aria-label="The closing line of the card" aria-invalid={!!errors.closing}
                    style={{
                      fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 380, fontVariationSettings: "'opsz' 9",
                      lineHeight: 1.45, color: 'var(--hh-green)',
                    }}
                  />
                </div>
              )}

              {/* The inscription: a short rule, then one line with For on
                  the left and From on the right. Typed names are set on the
                  hairlines; left empty, they wait for handwriting. */}
              <div aria-hidden="true" className="card-rule" style={{ top: k(L.ruleY), left: k(PAGE_W / 2 - L.ruleW / 2), width: k(L.ruleW) }}/>
              <div className="card-inscription" style={{
                top: k(L.inscriptionY - 14), left: k(L.column.x), width: k(L.column.w), height: k(14), columnGap: k(L.inscriptionGutter),
              }}>
                {[['forName', 'For'], ['fromName', 'From']].map(([key, label]) => (
                  <div key={key} className="card-inscription-half" style={{ gap: k(5) }}>
                    <label htmlFor={`card-${key}`} className="card-label" style={{ fontSize: k(L.labelSize), paddingBottom: k(2) }}>{label}</label>
                    <input
                      id={`card-${key}`} className="card-name" value={w0[key]} maxLength={LIMIT[key]} disabled={!words}
                      onChange={(e) => setWord(key, e.target.value)}
                      aria-invalid={!!errors[key]}
                      style={{ fontSize: k(L.nameSize), height: k(14) }}
                    />
                  </div>
                ))}
              </div>

              {/* The colophon: Hearth's arch and its ember. */}
              <svg aria-hidden="true" viewBox="40 120 160 84" className="card-colophon"
                style={{ left: k(PAGE_W / 2 - 9.6), top: k(L.markBaseY - 9.1), width: k(19.2) }}>
                <line x1="52" y1="196" x2="188" y2="196" stroke="#1F4045" strokeWidth="5"/>
                <path d="M 76 196 L 76 132 A 44 44 0 0 1 164 132 L 164 196" stroke="#1F4045" strokeWidth="5.5" fill="none" strokeLinecap="square"/>
                <circle cx="120" cy="178" r="10" fill="#E1BE74"/>
              </svg>
            </div>
            <figcaption className="card-caption">Back</figcaption>
          </figure>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span className="mono" style={monoNote}>Tap the words on the back to change them</span>
          {changed && (
            <button onClick={() => setWords((w) => ({ ...w, title: start.title, body: start.body, closing: start.closing }))} style={quietLink}>
              Put the original words back
            </button>
          )}
        </div>
        {(errors.title || errors.body || errors.closing || errors.forName || errors.fromName || !fit.fits) && (
          <p role="alert" className="body" style={{ margin: '12px 0 0', color: 'var(--hh-dogwood-deep)' }}>
            {errors.title || errors.body || errors.closing || errors.forName || errors.fromName || 'The words run past the edge of the card. Shorten them a little.'}
          </p>
        )}
      </section>

      {/* Share it */}
      <section style={{ padding: '40px 22px 0' }}>
        <Rule/>
        <Kicker accent="dogwood" style={{ marginTop: 28 }}>Share it</Kicker>
        <p className="body" style={{ margin: '12px 0 22px', maxWidth: 440 }}>
          Both sides as a keepsake card, to keep, to print, or to pass on to someone it might meet too.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {canShareFiles && (
            <button onClick={sharePostcard} disabled={shareState === 'making'}
              style={shareState === 'making' ? ghostBtn : solidBtn}>
              <span>{shareState === 'making' ? 'Making it…' : shareState === 'ready' ? 'Ready. Tap to share' : 'Share the card'}</span>
              {shareState !== 'making' && <span style={{ width: 28, height: 1, background: 'currentColor' }}/>}
            </button>
          )}
          <button onClick={() => downloadFile('pdf')} disabled={download === 'pdf'}
            style={canShareFiles ? lineBtn : (download === 'pdf' ? ghostBtn : solidBtn)}>
            {download === 'pdf' ? 'Making it…' : 'Download the card'}
          </button>
          <button onClick={() => downloadFile('image')} disabled={download === 'image'} style={{ ...quietLink, padding: '8px 0' }}>
            {download === 'image' ? 'Making it…' : 'Download the painting, full size'}
          </button>
        </div>
        {(shareState === 'failed' || (shareState && !['idle', 'making', 'ready', 'failed'].includes(shareState))) && (
          <p role="alert" className="body" style={{ margin: '14px 0 0', color: 'var(--hh-dogwood-deep)' }}>
            {shareState === 'failed' ? 'Could not open sharing. Download the card and send it from there.' : shareState}
          </p>
        )}
        {download && download !== 'pdf' && download !== 'image' && (
          <p role="alert" className="body" style={{ margin: '14px 0 0', color: 'var(--hh-dogwood-deep)' }}>{download}</p>
        )}
        <p className="mono" style={{ ...monoNote, margin: '18px 0 0' }}>
          PDF, 4.25 × 6.25 in, both sides
        </p>
      </section>

      {/* Mail it (off for now, see MAIL_ENABLED) */}
      {MAIL_ENABLED && (
      <section style={{ padding: '40px 22px 0' }}>
        <Rule/>
        <div style={{ marginTop: 28 }}>
          <button
            onClick={() => setMailOpen((o) => !o)}
            aria-expanded={mailOpen} aria-controls="card-mail"
            style={mailOpen ? lineBtn : solidBtn}
          >
            <span>Mail it</span>
            <span aria-hidden="true" style={{
              display: 'inline-block', transform: mailOpen ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.3s cubic-bezier(.22, 1, .36, 1)',
            }}>{Icon.arrow(14, 'currentColor')}</span>
          </button>
        </div>

        {mailOpen && (
          <form id="card-mail" className="fade-in" onSubmit={send} noValidate style={{ marginTop: 28, maxWidth: 560 }}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ padding: 0 }}><Kicker accent="dogwood">Who is it for</Kicker></legend>
              <div role="radiogroup" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                {[[false, 'Someone else'], [true, 'Me']].map(([self, label]) => (
                  <button key={label} type="button" role="radio" aria-checked={forSelf === self}
                    onClick={() => chooseFor(self)}
                    style={forSelf === self ? { ...solidBtn, padding: '11px 18px' } : { ...lineBtn, padding: '11px 18px' }}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <p className="body" style={{ margin: '18px 0 22px', maxWidth: 440 }}>
              {forSelf
                ? 'Printed on a 4 by 6 inch card and posted to you, to find in your letterbox some days from now.'
                : 'Printed on a 4 by 6 inch card and posted to them at the address below.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 16, rowGap: 18 }}>
              {ADDRESS_FIELDS.map((f, i) => (
                <div key={f.key} style={{ flex: f.half ? '1 1 200px' : '1 1 100%', minWidth: 0 }}>
                  <label htmlFor={`card-${f.key}`} className="mono" style={fieldLabel}>
                    {f.key === 'name' ? (forSelf ? 'Your name' : 'Their name') : f.label}{f.hint && <span style={{ color: 'var(--paper-faint)' }}> · {f.hint}</span>}
                  </label>
                  <input
                    id={`card-${f.key}`}
                    ref={i === 0 ? firstFieldRef : undefined}
                    className="hearth-input"
                    value={address[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                    autoComplete={`shipping ${f.autoComplete}`}
                    maxLength={f.max}
                    required={!!f.required}
                    aria-invalid={!!errors[f.key]}
                    aria-describedby={errors[f.key] ? `card-${f.key}-error` : undefined}
                    style={{ marginTop: 8, padding: '12px 14px' }}
                  />
                  {errors[f.key] && (
                    <div id={`card-${f.key}-error`} className="body" style={{ marginTop: 6, fontSize: 12.5, color: 'var(--hh-dogwood-deep)' }}>
                      {errors[f.key]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 30, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" disabled={sending} style={sending ? ghostBtn : solidBtn}>
                <span>{sending ? 'Sending it…' : 'Send the card'}</span>
                {!sending && <span style={{ width: 28, height: 1, background: 'currentColor' }}/>}
              </button>
            </div>
            {sendError && (
              <div role="alert" style={{ marginTop: 16, padding: 14, background: 'var(--hh-isabel)' }}>
                <p className="body" style={{ margin: 0 }}>{sendError}</p>
              </div>
            )}
            <p className="body" style={{ margin: '22px 0 0', fontSize: 12.5, color: 'var(--paper-mute)', maxWidth: 440, lineHeight: 1.6 }}>
              Cards are free while we test printing. The address is used to post this card and for nothing else.
            </p>
          </form>
        )}
      </section>
      )}
    </div>
  );
}

const crumbBtn = {
  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.22em', textTransform: 'uppercase',
};
const quietLink = {
  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
  color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5,
  letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: 3,
};
const monoNote = {
  fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase',
};
const fieldLabel = {
  display: 'block', fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase',
};
const lineBtn = {
  background: 'transparent', color: 'var(--hh-green)', border: '1px solid rgba(31, 64, 69, 0.18)',
  padding: '13px 22px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11,
  fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
  display: 'inline-flex', alignItems: 'center', gap: 14,
};
const ghostBtn = {
  background: 'transparent', color: 'var(--paper-mute)', border: '1px solid rgba(31, 64, 69, 0.18)',
  padding: '14px 22px', cursor: 'not-allowed', fontFamily: 'var(--sans)', fontSize: 11,
  fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
};
const solidBtn = {
  background: 'var(--hh-green)', color: 'var(--hh-lace)', border: '1px solid var(--hh-green)', padding: '13px 22px',
  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.22em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 14,
};

export { CardScreen };
