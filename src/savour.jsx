// Hearth — "Stay a moment".
//
// The one beat Hearth was missing. Everything in Receive, and every good
// turning in Carry, used to end the same way: the reader reads something
// true, and then scrolls. The moment lands and goes straight through
// them. This holds it open for about twenty seconds so it has a chance
// to be kept.
//
// WHY IT IS BUILT THIS WAY (see docs/HEARTH_BRAND_BRIEF.md §5.4, §5.10):
//
// Frankl gives Hearth its architecture: meaning is received through what
// we let in, and experiential values are as real an avenue as any other.
// What logotherapy does not describe is the mechanics of *keeping* a
// good moment once it arrives. Bryant and Veroff's savouring work is the
// academic ground for that, and Rick Hanson's practical synthesis is the
// clearest account of the encoding itself: a positive experience is far
// more likely to be retained when attention rests on it a little longer,
// when it is felt in the body, and when the person lets it land rather
// than moving straight on.
//
// So the four movements below, in the reader's language and never named
// as a technique:
//
//   1. name it     what did that reach in you (one line, theirs)
//   2. stay        three slow breaths, the out-breath longer
//   3. where       where it sits in the body, one tap, skippable
//   4. settle      three seconds where nothing at all is asked
//
// On the breathing: Carry keeps box breathing (4·4·4·4) because its job
// there is to bring a loud feeling down. This is a different job. An
// out-breath longer than the in-breath is the pattern with the better
// recent evidence for settling, and settling is what an absorbed moment
// wants. Same brand, different instrument.
//
// One deliberate omission. Hanson's fourth move, holding a good thing
// alongside a hard one so it gradually softens it, is the deepest idea
// here and is left out for now. It can flood someone when the hard thing
// is too big, and gating it properly is its own piece of work. Recorded
// in docs/DOCTRINE_AUDIT.md rather than half-built.
//
// The whole thing is skippable at every step, and skipping is never
// treated as a failure. Nothing here is a streak.

import React from 'react';
import { Kicker, Icon } from './atoms.jsx';
import { api } from './api.js';

// The breath. Four seconds in, six out, three times: about thirty
// seconds, which is long enough to settle and short enough that nobody
// abandons it. Held as data so the ring and the label never disagree.
const BREATH = [
  { key: 'in', label: 'Breathe in', ms: 4000, scale: 1 },
  { key: 'out', label: 'And out, slowly', ms: 6000, scale: 0.58 },
];
const BREATH_ROUNDS = 3;

// Where a feeling sits. Plain words, no body-scan vocabulary, and a way
// out for the reader who does not find this useful.
const PLACES = ['chest', 'throat', 'stomach', 'shoulders', 'hands', 'behind the eyes', 'all over', 'nowhere I can name'];

function todayKey() { return new Date().toISOString().slice(0, 10); }

// ── The breath ring ───────────────────────────────────────────────────
// The hearth glow, breathing. This is the one place the brand's own
// image does something rather than sit there.
function BreathRing({ phase, running }) {
  const p = BREATH[phase % BREATH.length];
  return (
    <div style={{
      height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <div
        aria-hidden="true"
        style={{
          width: 168, height: 168, borderRadius: '50%',
          background: 'var(--hh-ecru)',
          opacity: 0.9,
          transform: `scale(${running ? p.scale : 0.58})`,
          transition: `transform ${p.ms}ms cubic-bezier(.37,0,.63,1)`,
        }}
      />
    </div>
  );
}

// ── Stay a moment ─────────────────────────────────────────────────────
//
// Props:
//   kicker   small label above ("Stay a moment" by default)
//   question the naming question, phrased for the surface it sits on
//   avenue   which avenue the kept line belongs to (default receive)
//   prompt   what the kept line is an answer to, for the meaning log
//   onDone   called when the reader finishes or closes
//
// The kept line goes to the meaning log like every other thing a reader
// keeps, so a savoured moment accrues into the same record and feeds the
// same narrative. Nothing here is a separate silo.
function SavourMoment({
  kicker = 'Stay a moment',
  question = 'What did that reach in you?',
  avenue = 'receive',
  prompt = 'What it reached in me',
  onDone,
}) {
  const [step, setStep] = React.useState('name'); // name | breath | where | settle | done
  const [text, setText] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [keeping, setKeeping] = React.useState(false);

  // Breath timer. Runs only while the breath step is on screen, and
  // tears down cleanly, so a reader who leaves mid-breath leaves nothing
  // ticking behind them.
  const [phase, setPhase] = React.useState(0);
  const [round, setRound] = React.useState(0);
  React.useEffect(() => {
    if (step !== 'breath') return undefined;
    let cancelled = false;
    let timer;
    const tick = (i) => {
      if (cancelled) return;
      const idx = i % BREATH.length;
      const r = Math.floor(i / BREATH.length);
      if (r >= BREATH_ROUNDS) { setStep('where'); return; }
      setPhase(idx);
      setRound(r);
      timer = setTimeout(() => tick(i + 1), BREATH[idx].ms);
    };
    tick(0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [step]);

  // The settle beat. Three seconds where nothing is asked of anyone.
  React.useEffect(() => {
    if (step !== 'settle') return undefined;
    const t = setTimeout(() => setStep('done'), 3000);
    return () => clearTimeout(t);
  }, [step]);

  async function keepAndBreathe() {
    const t = text.trim();
    if (t.length < 2 || keeping) return;
    setKeeping(true);
    try {
      await api.meaning.create({ text: t, prompt, avenue, date: todayKey() });
    } catch {
      // Unauthed, offline, or a cold backend. The moment still belongs
      // to the reader; losing the record must never cost them the beat.
    }
    setKeeping(false);
    setStep('breath');
  }

  const close = () => { if (typeof onDone === 'function') onDone(); };

  // ── 1. Name it ──
  if (step === 'name') {
    const ready = text.trim().length >= 2 && !keeping;
    return (
      <section style={{ padding: '40px 22px 0' }}>
        <div style={{ background: 'var(--hh-isabel)', padding: '26px 24px' }}>
          <Kicker>{kicker}</Kicker>
          <p className="serif" style={{
            margin: '14px 0 0', fontSize: 20, lineHeight: 1.4, fontStyle: 'italic',
            color: 'var(--hh-green)', maxWidth: 480,
          }}>
            {question}
          </p>
          <textarea
            className="hearth-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A line, if one comes…"
            style={{
              minHeight: 64, marginTop: 18, background: 'var(--hh-lace)',
              borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '14px 16px',
            }}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={keepAndBreathe} disabled={!ready} style={{
              background: ready ? 'var(--hh-green)' : 'transparent',
              color: ready ? 'var(--hh-lace)' : 'var(--paper-mute)',
              border: ready ? 0 : '1px solid rgba(31, 64, 69, 0.25)',
              padding: '12px 20px', cursor: ready ? 'pointer' : 'default',
              fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>
              {keeping ? 'Keeping…' : 'Keep it'}
            </button>
            <button onClick={close} style={ghostLink}>Not now</button>
          </div>
        </div>
      </section>
    );
  }

  // ── 2. Stay with it ──
  if (step === 'breath') {
    return (
      <section style={{ padding: '40px 22px 0' }}>
        <div style={{ background: 'var(--hh-isabel)', padding: '26px 24px', textAlign: 'center' }}>
          <Kicker>Stay with it</Kicker>
          <BreathRing phase={phase} running />
          <p className="serif" style={{
            margin: 0, fontSize: 22, lineHeight: 1.3, fontStyle: 'italic', color: 'var(--hh-green)',
          }}>
            {BREATH[phase].label}.
          </p>
          <p className="mono" style={{
            margin: '16px 0 0', fontSize: 9.5, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--paper-mute)',
          }}>
            Breath {Math.min(round + 1, BREATH_ROUNDS)} of {BREATH_ROUNDS}
          </p>
          <div style={{ marginTop: 18 }}>
            <button onClick={() => setStep('where')} style={ghostLink}>Skip</button>
          </div>
        </div>
      </section>
    );
  }

  // ── 3. Where it sits ──
  if (step === 'where') {
    return (
      <section style={{ padding: '40px 22px 0' }}>
        <div style={{ background: 'var(--hh-isabel)', padding: '26px 24px' }}>
          <Kicker>Where it sits</Kicker>
          <p className="serif" style={{
            margin: '14px 0 0', fontSize: 20, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--hh-green)',
          }}>
            Where do you feel it?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            {PLACES.map((pl) => {
              const on = place === pl;
              return (
                <button key={pl} onClick={() => { setPlace(pl); setStep('settle'); }} style={{
                  background: on ? 'var(--hh-green)' : 'transparent',
                  color: on ? 'var(--hh-lace)' : 'var(--hh-green)',
                  border: '1px solid rgba(31, 64, 69, 0.25)', borderRadius: 0,
                  padding: '10px 15px', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>{pl}</button>
              );
            })}
          </div>
          <div style={{ marginTop: 18 }}>
            <button onClick={() => setStep('settle')} style={ghostLink}>Skip</button>
          </div>
        </div>
      </section>
    );
  }

  // ── 4. Let it settle ──
  if (step === 'settle') {
    return (
      <section style={{ padding: '40px 22px 0' }}>
        <div style={{ background: 'var(--hh-isabel)', padding: '46px 24px', textAlign: 'center' }}>
          <p className="serif fade-in" style={{
            margin: 0, fontSize: 22, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--hh-green)',
          }}>
            Let it settle.
          </p>
        </div>
      </section>
    );
  }

  // ── Done ──
  return (
    <section style={{ padding: '40px 22px 0' }}>
      <div className="fade-in" style={{ background: 'var(--hh-isabel)', padding: '26px 24px' }}>
        <Kicker>Kept</Kicker>
        <p className="serif" style={{
          margin: '12px 0 0', fontSize: 19, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)',
        }}>
          {text.trim()}
        </p>
        {place && (
          <p className="body-sm" style={{ margin: '10px 0 0', color: 'var(--paper-mute)' }}>
            Felt in the {place}.
          </p>
        )}
        <p className="body-sm" style={{ margin: '16px 0 0', color: 'var(--paper-mute)', maxWidth: 420 }}>
          This is in your meaning log now, with everything else you have noticed.
        </p>
        <div style={{ marginTop: 18 }}>
          <button onClick={close} style={{
            background: 'transparent', border: '1px solid rgba(31, 64, 69, 0.25)',
            padding: '11px 20px', cursor: 'pointer', color: 'var(--hh-green)',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Close</button>
        </div>
      </div>
    </section>
  );
}

const ghostLink = {
  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
  color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5,
  letterSpacing: '0.18em', textTransform: 'uppercase',
};

// A quiet opener. Sits at the end of a surface and offers the beat
// without demanding it; expands in place when taken up. Used wherever a
// good moment has just happened.
function SavourOpener({ label = 'Stay a moment with this', ...props }) {
  const [open, setOpen] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  if (open) return <SavourMoment {...props} onDone={() => { setOpen(false); setDismissed(true); }} />;
  return (
    <section style={{ padding: '40px 22px 0' }}>
      <button onClick={() => setOpen(true)} style={{
        width: '100%', textAlign: 'left', background: 'var(--hh-isabel)',
        border: 0, padding: '20px 24px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <span className="serif" style={{
          fontSize: 18, fontStyle: 'italic', color: 'var(--hh-green)', fontWeight: 380,
        }}>{label}</span>
        {Icon.arrow(16, 'var(--hh-green)')}
      </button>
    </section>
  );
}

export { SavourMoment, SavourOpener };
