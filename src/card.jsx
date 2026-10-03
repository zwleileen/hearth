// Hearth — a card from a Carry session.
//
// The picture of the mirror on the front. On the back, the mirror's own
// words, which the reader can change in place, and a note of their own.
// Then it is posted to someone.
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

// Card geometry in points, matching cardPdf.js.
const TRIM_W = 288;
const SAFE = 18;
const ROOM = 432 - 2 * SAFE - 9 - 18; // above the wordmark
const TYPE = { kicker: 6.5, title: 17, body: 9, bodyFloor: 7.5, note: 9.5 };
// Ceilings against abuse, as on the server. Fit is what really limits
// the words, and the preview measures it.
const LIMIT = { title: 90, body: 2000, note: 320 };

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

function originalWords(session) {
  const c = session?.session?.companion || {};
  return {
    title: c.name || '',
    body: [c.predicament, c.turning].filter(Boolean).join('\n\n'),
    note: '',
  };
}

// The words survive leaving the page and coming back, on this device.
// The address does not: it belongs to someone else and is only kept
// with the order it was given for.
function draftKey(id) { return `hearth.card.${id}`; }
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

  const original = React.useMemo(() => originalWords(session), [sessionId]);
  const [words, setWords] = React.useState(() => ({ ...original, ...(sessionId ? readDraft(sessionId) : null) }));
  const [fit, setFit] = React.useState({ fits: true, bodyPt: TYPE.body });

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

  React.useEffect(() => { if (sessionId) writeDraft(sessionId, words); }, [words, sessionId]);

  // Size every text box to its words, then step the body type down
  // until the back fits, exactly as the print file does.
  const fitBack = React.useCallback(() => {
    const back = backRef.current;
    const content = contentRef.current;
    const body = bodyRef.current;
    if (!back || !content || !body) return;
    const k = back.clientWidth / TRIM_W; // px per point
    const room = (ROOM + SAFE) * k; // the content box starts at the top safe margin
    let pt = TYPE.body;
    for (;;) {
      body.style.fontSize = `${pt * k}px`;
      for (const ta of content.querySelectorAll('textarea')) {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      }
      if (content.scrollHeight <= room + 0.5 || pt <= TYPE.bodyFloor) break;
      pt = Math.max(TYPE.bodyFloor, pt - 0.25);
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

  async function downloadFile(kind) {
    if (download === 'pdf' || download === 'image') return;
    setDownload(kind);
    try {
      if (kind === 'pdf') {
        saveBlob(await api.cards.printFile({ sessionId, title: words.title, body: words.body, note: words.note }), 'hearth-card.pdf');
      } else {
        saveBlob(await api.cards.printImage(sessionId), 'hearth-card-front.jpg');
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

  const kicker = MIRROR_LABEL[session.session?.companion?.kind] || MIRROR_LABEL.image;
  const changed = words.title !== original.title || words.body !== original.body || words.note !== '';

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
    if (!words.title.trim()) e.title = 'The card needs a title.';
    if (!words.body.trim()) e.body = 'The card needs some words on the back.';
    for (const key of ['title', 'body', 'note']) {
      if (words[key].length > LIMIT[key]) e[key] = `Keep this under ${LIMIT[key]} characters.`;
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
        title: words.title,
        body: words.body,
        note: words.note,
        recipient: address,
        forSelf,
      });
      clearDraft(sessionId);
      setSent({ ...data, forSelf, title: words.title.trim(), name: address.name.trim(), city: address.city.trim() });
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

  const k = (pt) => `${(pt / TRIM_W) * 100}cqw`;

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
          Make it<br/><span style={{ fontStyle: 'italic' }}>a card.</span>
        </Headline>
        <p className="body" style={{ margin: '18px 0 0', maxWidth: 440 }}>
          The picture on the front. On the back, the words that came with it, yours to change, and room for a note of your own.
        </p>
      </section>

      {/* The card, both sides, at print proportions */}
      <section style={{ padding: '32px 22px 0' }}>
        <div className="card-sides">
          <figure className="card-side">
            <div className="card-face">
              <img src={picture.image} alt={picture.alt || ''} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}/>
            </div>
            <figcaption className="card-caption">Front</figcaption>
          </figure>

          <figure className="card-side">
            {/* The back is the query container and carries no padding, so
                every cqw below is a fraction of the card's full width, as
                every point in the print file is. */}
            <div ref={backRef} className="card-face card-back">
              <div ref={contentRef} style={{ padding: `${k(SAFE)} ${k(SAFE)} 0` }}>
                <div style={{
                  fontFamily: 'var(--sans)', fontWeight: 500, fontSize: k(TYPE.kicker), letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--hh-ecru-deep)', lineHeight: 1.4,
                }}>
                  {kicker}
                </div>
                <textarea
                  id="card-title" className="card-edit" rows={1} value={words.title} maxLength={LIMIT.title}
                  onChange={(e) => setWord('title', e.target.value.replace(/\n/g, ' '))}
                  aria-label="Title on the back of the card" aria-invalid={!!errors.title}
                  style={{
                    marginTop: k(12), fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 340,
                    fontVariationSettings: "'opsz' 72", fontSize: k(TYPE.title), lineHeight: 1.25, color: 'var(--hh-green)',
                  }}
                />
                <textarea
                  id="card-body" ref={bodyRef} className="card-edit" rows={4} value={words.body} maxLength={LIMIT.body}
                  onChange={(e) => setWord('body', e.target.value)}
                  aria-label="Words on the back of the card" aria-invalid={!!errors.body}
                  style={{
                    marginTop: k(12), fontFamily: 'var(--serif)', fontWeight: 380,
                    fontVariationSettings: "'opsz' 9", lineHeight: 1.75, color: 'var(--paper-2, #486A6E)',
                  }}
                />
                {words.note.trim() && (
                  <div style={{ width: k(24), height: 1, background: 'rgba(31, 64, 69, 0.3)', marginTop: k(8) }}/>
                )}
                <textarea
                  id="card-note" className="card-edit" rows={1} value={words.note} maxLength={LIMIT.note}
                  onChange={(e) => setWord('note', e.target.value)}
                  placeholder="Add a note of your own, if you like."
                  aria-label="Your note on the back of the card" aria-invalid={!!errors.note}
                  style={{
                    marginTop: k(8), fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 380,
                    fontVariationSettings: "'opsz' 9", fontSize: k(TYPE.note), lineHeight: 1.65, color: 'var(--hh-green)',
                  }}
                />
              </div>
              <img src="/brand/wordmark-paper.svg" alt="" aria-hidden="true" className="card-mark"
                style={{ height: k(9), bottom: k(SAFE) }}/>
            </div>
            <figcaption className="card-caption">Back</figcaption>
          </figure>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span className="mono" style={monoNote}>Tap the words on the back to change them</span>
          {changed && (
            <button onClick={() => setWords({ ...original })} style={quietLink}>Put the original words back</button>
          )}
        </div>
        {user?.printRoom && (
          <div style={{ marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <span className="mono" style={monoNote}>Print room</span>
            <button onClick={() => downloadFile('pdf')} style={quietLink}>
              {download === 'pdf' ? 'Making it…' : 'Download the print file'}
            </button>
            <button onClick={() => downloadFile('image')} style={quietLink}>
              {download === 'image' ? 'Making it…' : 'Download the front, full size'}
            </button>
            {download && download !== 'pdf' && download !== 'image' && (
              <span className="body" style={{ fontSize: 12.5, color: 'var(--hh-dogwood-deep)' }}>{download}</span>
            )}
          </div>
        )}
        {(errors.title || errors.body || errors.note || !fit.fits) && (
          <p role="alert" className="body" style={{ margin: '12px 0 0', color: 'var(--hh-dogwood-deep)' }}>
            {errors.title || errors.body || errors.note || 'The words run past the edge of the card. Shorten them a little.'}
          </p>
        )}
      </section>

      {/* Mail it */}
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
