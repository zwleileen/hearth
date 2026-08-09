// Hearth — a letter.
//
// WHY THIS IS THE MOST IMPORTANT SCREEN IN GIVE
// (docs/HEARTH_BRAND_BRIEF.md §5.3, docs/DOCTRINE_AUDIT.md).
//
// Give is the avenue of creative values and the engine of
// self-transcendence: meaning grows by reaching past yourself toward
// another person. Until now Give could only capture an intention. You
// could resolve to thank someone and Hearth would keep the resolution,
// which is the one part that does nothing for anybody.
//
// The gratitude letter is the oldest, best-evidenced version of this,
// and its evidence is strongest when the letter is actually delivered
// rather than only written. So this screen ends in sending.
//
// Three questions, in this order, because that order is the whole
// intervention: WHO (a named person, not kindness in general), WHAT they
// did (concrete, not a compliment), and WHAT IT GAVE YOU (the effect on
// your life, which is the part they almost never know).
//
// The letter is typeset on Old Lace in Fraunces and handed to the
// reader's own share sheet. Nothing is posted anywhere by Hearth, no
// account is required of the person receiving it, and there is no
// referral mechanic. The reader benefits from the giving; the person
// they send it to receives the most considered thing anyone has sent
// them this year. That is the whole loop, and it is clean because the
// method and the loop are the same act.

import React from 'react';
import { Headline, Kicker, Icon, Rule } from './atoms.jsx';
import { api } from './api.js';
import { shareLetter, SHARE_RESULT_MESSAGE } from './share.jsx';

function todayKey() { return new Date().toISOString().slice(0, 10); }

// Assemble the letter the way it will be read. Kept as one function so
// the preview, the image, and the shared text can never drift apart.
function composeLetter({ to, what, gave, from }) {
  const paragraphs = [];
  if (what.trim()) paragraphs.push(what.trim());
  if (gave.trim()) paragraphs.push(gave.trim());
  const body = paragraphs.join('\n\n');
  const plain = [
    to.trim() ? `${to.trim()},` : '',
    '',
    body,
    '',
    from.trim() ? from.trim() : '',
  ].filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');
  return { body, plain };
}

const STARTERS = [
  'Someone who taught you something you still use.',
  'Someone who was steady with you when you were not.',
  'Someone whose ordinary kindness you never mentioned.',
  'Someone who made a room easier to be in.',
];

function LetterScreen({ go, user }) {
  const [step, setStep] = React.useState('write'); // write | read | sent
  const [to, setTo] = React.useState('');
  const [what, setWhat] = React.useState('');
  const [gave, setGave] = React.useState('');
  const [from, setFrom] = React.useState(user?.name?.split(/\s+/)[0]?.trim() || '');
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState('');

  const ready = to.trim().length >= 1 && what.trim().length >= 10 && gave.trim().length >= 10;
  const { body, plain } = composeLetter({ to, what, gave, from });

  // Sending is the point, so keeping the record happens here rather than
  // at compose time: what goes to the meaning log is a letter that was
  // actually sent. Failing to record it must never block the sending.
  async function send() {
    if (busy) return;
    setBusy(true);
    setNote('');
    let result = 'failed';
    try {
      result = await shareLetter({ to: to.trim(), body, from: from.trim(), plain });
    } catch {
      result = 'failed';
    }
    if (result !== 'cancelled' && result !== 'failed') {
      try {
        await api.meaning.create({
          text: `Wrote to ${to.trim()}: ${what.trim().slice(0, 160)}`,
          prompt: 'A letter, sent',
          avenue: 'give',
          forWhom: to.trim(),
          date: todayKey(),
        });
      } catch { /* the letter was still sent, which is what mattered */ }
      setStep('sent');
    }
    setNote(SHARE_RESULT_MESSAGE[result] || '');
    setBusy(false);
  }

  const back = () => go('give');

  // ── Sent ──
  if (step === 'sent') {
    return (
      <div className="fade-in" style={{ paddingBottom: 48 }}>
        <section style={{ padding: '60px 22px 0' }}>
          <Kicker accent="ecru">Sent</Kicker>
          <Headline size="display" italic style={{ marginTop: 14 }}>
            {to.trim()} knows now.
          </Headline>
          <p className="body" style={{ margin: '20px 0 0', maxWidth: 440 }}>
            Most people never find out what they did for someone. This one has. {note}
          </p>
          <p className="body-sm" style={{ margin: '18px 0 0', color: 'var(--paper-mute)', maxWidth: 440 }}>
            It is in your meaning log, under what you have given.
          </p>
          <div style={{ marginTop: 30, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => go('meaning-log')} style={solidBtn}>The meaning log</button>
            <button onClick={() => {
              setTo(''); setWhat(''); setGave(''); setStep('write'); setNote('');
            }} style={ghostLink}>Write another</button>
          </div>
        </section>
      </div>
    );
  }

  // ── Read it back ──
  if (step === 'read') {
    return (
      <div className="fade-in" style={{ paddingBottom: 48 }}>
        <section style={{ padding: '4px 22px 0' }}>
          <button onClick={() => setStep('write')} style={backBtn}>
            {Icon.back(18, 'currentColor')}<span>Keep writing</span>
          </button>
        </section>

        <section style={{ padding: '24px 22px 0' }}>
          <Kicker accent="ecru">Read it back</Kicker>
          <p className="body" style={{ margin: '12px 0 0', maxWidth: 440 }}>
            This is how it will reach them.
          </p>
        </section>

        <section style={{ padding: '28px 22px 0' }}>
          <div style={{ background: 'var(--hh-isabel)', padding: '34px 30px' }}>
            <p className="serif" style={{
              margin: 0, fontSize: 21, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)',
            }}>{to.trim()},</p>
            {body.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="serif" style={{
                margin: '20px 0 0', fontSize: 19, lineHeight: 1.65, color: 'var(--hh-green)', fontWeight: 380,
              }}>{p}</p>
            ))}
            {from.trim() && (
              <p className="serif" style={{
                margin: '26px 0 0', fontSize: 19, fontStyle: 'italic', color: 'var(--hh-green)',
              }}>{from.trim()}</p>
            )}
          </div>
        </section>

        <section style={{ padding: '28px 22px 0' }}>
          <button onClick={send} disabled={busy} style={{ ...solidBtn, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Sending…' : 'Send it'}
          </button>
          {note && (
            <p className="body-sm" style={{ margin: '14px 0 0', color: 'var(--paper-mute)' }}>{note}</p>
          )}
          <p className="body-sm" style={{ margin: '18px 0 0', color: 'var(--paper-mute)', maxWidth: 440 }}>
            Hearth does not send this for you. It hands the letter to your phone, and you choose where it goes.
          </p>
        </section>
      </div>
    );
  }

  // ── Write ──
  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      <section style={{ padding: '4px 22px 0' }}>
        <button onClick={back} style={backBtn}>
          {Icon.back(18, 'currentColor')}<span>Give</span>
        </button>
      </section>

      <section style={{ padding: '20px 22px 0' }}>
        <Kicker accent="ecru">A letter</Kicker>
        <Headline size="display" style={{ marginTop: 12 }}>
          Tell them,<br/><span style={{ fontStyle: 'italic' }}>while you can.</span>
        </Headline>
        <p className="body" style={{ margin: '16px 0 0', maxWidth: 460 }}>
          Someone changed something for you and has no idea. A few sentences, named and specific, is all it takes. You will feel this as much as they do.
        </p>
      </section>

      <section style={{ padding: '34px 22px 0' }}>
        <div className="hh-moment" style={{ background: 'var(--hh-ecru)' }}>
          <span className="hh-moment-eyebrow">Who is it for</span>
          <input
            className="hearth-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            maxLength={60}
            placeholder="Their name"
            style={{
              fontSize: 19, background: 'var(--hh-lace)', padding: '14px 16px',
              borderBottom: '1px solid rgba(31, 64, 69, 0.18)',
            }}
          />
          {!to.trim() && (
            <div style={{ marginTop: 16 }}>
              {STARTERS.map((s) => (
                <p key={s} className="body-sm" style={{ margin: '6px 0 0', color: 'var(--hh-green)', opacity: 0.75 }}>
                  {s}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '34px 22px 0' }}>
        <Kicker>What they did</Kicker>
        <p className="body" style={{ margin: '10px 0 0', maxWidth: 460 }}>
          One thing, as concretely as you can remember it. Not what they are like. What they did.
        </p>
        <textarea
          className="hearth-input"
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          maxLength={1200}
          placeholder="You sat with me in the car park for an hour and did not once look at your phone…"
          style={{ minHeight: 110, marginTop: 16, background: 'var(--hh-isabel)', padding: '16px 18px', borderBottom: '1px solid rgba(31, 64, 69, 0.18)' }}
        />
      </section>

      <section style={{ padding: '30px 22px 0' }}>
        <Kicker>What it gave you</Kicker>
        <p className="body" style={{ margin: '10px 0 0', maxWidth: 460 }}>
          What it changed, and what is different in your life because of it. This is the part they do not know.
        </p>
        <textarea
          className="hearth-input"
          value={gave}
          onChange={(e) => setGave(e.target.value)}
          maxLength={1200}
          placeholder="I have thought about that hour every time I have had to sit with someone else…"
          style={{ minHeight: 110, marginTop: 16, background: 'var(--hh-isabel)', padding: '16px 18px', borderBottom: '1px solid rgba(31, 64, 69, 0.18)' }}
        />
      </section>

      <section style={{ padding: '30px 22px 0' }}>
        <Rule/>
        <div style={{ marginTop: 22, display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--paper-mute)' }}>
            Signed
          </span>
          <input
            className="hearth-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            maxLength={60}
            placeholder="Your name"
            style={{ fontSize: 17, flex: 1, minWidth: 160, borderBottom: '1px solid rgba(31, 64, 69, 0.18)' }}
          />
        </div>
      </section>

      <section style={{ padding: '30px 22px 0' }}>
        <button onClick={() => setStep('read')} disabled={!ready} style={{
          background: ready ? 'var(--hh-green)' : 'transparent',
          color: ready ? 'var(--hh-lace)' : 'var(--paper-mute)',
          border: ready ? 0 : '1px solid rgba(31, 64, 69, 0.25)',
          padding: '14px 22px', cursor: ready ? 'pointer' : 'default',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          Read it back
        </button>
        {!ready && (
          <p className="body-sm" style={{ margin: '14px 0 0', color: 'var(--paper-mute)' }}>
            A name, what they did, and what it gave you.
          </p>
        )}
      </section>
    </div>
  );
}

const solidBtn = {
  background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0,
  padding: '14px 22px', cursor: 'pointer', fontFamily: 'var(--sans)',
  fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
};
const ghostLink = {
  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
  color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5,
  letterSpacing: '0.18em', textTransform: 'uppercase',
};
const backBtn = {
  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.22em', textTransform: 'uppercase',
};

export { LetterScreen };
