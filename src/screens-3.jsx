// Hearth — onboarding, auth, settings, notification mocks

import React from 'react';
import { BackRow, Eyebrow, Icon, LeafMark, Ph, Sprig } from './atoms.jsx';
import { api, setToken } from './api.js';

// ─────────────────────────────────────────────────────────────
// READING GARDEN — interest taxonomy (Step 3)
// Cross-disciplinary, world-spanning. Each maps to a botanical tone.
// ─────────────────────────────────────────────────────────────
const READING_GARDEN = [
  { k: 'repair',    label: 'Quiet repair',         sub: 'Restoration · slow ecology · craft revivals',           tone: 'fern',     glyph: '❀' },
  { k: 'craft',     label: 'Hands & makers',       sub: 'Bakers, builders, weavers, gardeners',                  tone: 'ember',    glyph: '✦' },
  { k: 'ideas',     label: 'Long ideas',           sub: 'Philosophy, literature, the long view',                 tone: 'wisteria', glyph: '◆' },
  { k: 'science',   label: 'Quiet science',        sub: 'Mind, body, climate · the human-scale findings',        tone: 'meadow',   glyph: '☘' },
  { k: 'place',     label: 'Places & journeys',    sub: 'Field notes from cities, coasts, kitchens',             tone: 'rose',     glyph: '✿' },
  { k: 'justice',   label: 'Just worlds',          sub: 'People building fairer systems',                        tone: 'bloom',    glyph: '✧' },
  { k: 'food',      label: 'The table',            sub: 'Cooking, growing, the rituals of feeding',              tone: 'citron',   glyph: '✺' },
  { k: 'creative',  label: 'Studio life',          sub: 'Artists, architects, designers at work',                tone: 'fern',     glyph: '❉' },
  { k: 'wisdom',    label: 'Old wisdom',           sub: 'Ancient practice translated for now',                   tone: 'wisteria', glyph: '✶' },
];

// ─────────────────────────────────────────────────────────────
// SPRIGS — signature sprig (Step 4)
// THREE trees. Each maps to a distinct tone in the new
// Hygge Haven palette. Restraint over abundance — three
// real choices land harder than seven near-identical ones.
// Keys retained for storage compatibility with old saves.
// ─────────────────────────────────────────────────────────────
const SPRIGS = [
  { k: 'wisteria', label: 'Oak',   meaning: 'endurance, deep roots',  tone: 'wisteria' }, // midnight green
  { k: 'poppy',    label: 'Birch', meaning: 'beginnings, light',      tone: 'ember'    }, // ecru gold
  { k: 'cornflower',label: 'Pine', meaning: 'steadiness through cold',tone: 'bloom'    }, // carolina blue
];
// Back-compat alias
const FLOWERS = SPRIGS;

// ─────────────────────────────────────────────────────────────
// ONBOARDING — 6 screens
// ─────────────────────────────────────────────────────────────
function OnboardingScreen({ go, payload, onAuthed }) {
  const step = payload?.step || 0;
  const [name, setName] = React.useState(payload?.name || '');
  const [reasons, setReasons] = React.useState(payload?.reasons || []);
  const [time, setTime] = React.useState(payload?.time || 'evening');
  const [interests, setInterests] = React.useState(payload?.interests || []);
  const [flower, setFlower] = React.useState(payload?.flower || 'wisteria'); // key kept as 'flower' for tweak-state compat
  const [email, setEmail] = React.useState(payload?.email || '');
  const [password, setPassword] = React.useState(payload?.password || '');
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);

  const REASONS = [
    { k: 'rest',     label: 'Rest more easily',     tone: 'wisteria' },
    { k: 'clarity',  label: 'Find clarity',         tone: 'bloom' },
    { k: 'gratitude',label: 'Practice gratitude',   tone: 'rose' },
    { k: 'focus',    label: 'Work with intention',  tone: 'citron' },
    { k: 'grief',    label: 'Sit with something hard', tone: 'fern' },
    { k: 'wonder',   label: 'Notice more',          tone: 'meadow' },
  ];

  const TOTAL = 7;
  const state = { name, reasons, time, interests, flower, email, password };
  const goStep = (n) => go('onboarding', { step: n, ...state });

  async function submitSignup() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { token } = await api.auth.signup({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        onboarding: { flower, reasons, interests, dailyTime: time },
      });
      setToken(token);
      if (typeof onAuthed === 'function') {
        await onAuthed();
      }
      go('home');
    } catch (err) {
      setSubmitError(err.data?.error || err.message || 'Something went wrong');
      setSubmitting(false);
    }
  }

  function toggleReason(k) {
    setReasons(rs => rs.includes(k) ? rs.filter(x => x !== k) : [...rs, k]);
  }
  function toggleInterest(k) {
    setInterests(is => is.includes(k) ? is.filter(x => x !== k) : [...is, k]);
  }

  // step 0 — welcome
  if (step === 0) {
    return (
      <div className="fade-in" style={{ padding: '60px 28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '70vh', justifyContent: 'space-between' }}>
        <div>
          <div className="flicker" style={{ width: 80, height: 80, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #f3c98a, #d4a574 40%, #6e431f 90%)',
            margin: '0 auto', boxShadow: '0 0 60px rgba(212,165,116,0.5)' }}/>
          <h1 className="serif" style={{ margin: '32px 0 12px', fontSize: 42, fontWeight: 320, letterSpacing: '-0.01em' }}>
            Hearth
          </h1>
          <p className="serif" style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 350, color: 'var(--paper-2)', margin: '0 0 32px', lineHeight: 1.4, maxWidth: 300 }}>
            A small fire to come home to,<br/>at the start and end of each day.
          </p>
          <p className="body-sm" style={{ maxWidth: 280, margin: '0 auto' }}>
            Five minutes. Pen-and-paper feel. Built on the most replicated work in positive and clinical psychology.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
          <button className="btn btn-ember" style={{ justifyContent: 'center' }} onClick={() => goStep(1)}>
            Begin
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => go('auth')}>
            I have an account
          </button>
        </div>
      </div>
    );
  }

  // step 1 — name
  if (step === 1) {
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px' }}>
        <OnboardingProgress n={1} total={TOTAL}/>
        <Eyebrow ember style={{ marginTop: 28 }}>Step one</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
          What should I<br/><span style={{ fontStyle: 'italic' }}>call you?</span>
        </h1>
        <p className="body" style={{ margin: '0 0 22px' }}>
          Just a first name, or something you'd like the app to use.
        </p>
        <input className="hearth-input" value={name} onChange={e => setName(e.target.value)} placeholder="Friend"
          style={{ fontSize: 22 }}/>
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button className="btn btn-ghost" onClick={() => goStep(0)}>Back</button>
          <button className="btn btn-ember" onClick={() => goStep(2)}>
            Continue {Icon.arrow(14, 'var(--on-ember)')}
          </button>
        </div>
      </div>
    );
  }

  // step 2 — reasons
  if (step === 2) {
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px' }}>
        <OnboardingProgress n={2} total={TOTAL}/>
        <Eyebrow tone="meadow" style={{ marginTop: 28 }}>Step two</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
          What brought<br/><span style={{ fontStyle: 'italic' }}>you here?</span>
        </h1>
        <p className="body" style={{ margin: '0 0 22px' }}>
          Pick any that ring true. We'll seed your prompts with these in mind.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REASONS.map(r => {
            const on = reasons.includes(r.k);
            return (
              <button key={r.k} onClick={() => toggleReason(r.k)} className={on ? `card-${r.tone}` : 'card-soft'}
                style={{ padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, border: on ? undefined : '1px solid var(--paper-line)' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: '1.5px solid ' + (on ? `var(--${r.tone})` : 'var(--paper-line)'),
                  background: on ? `var(--${r.tone})` : 'transparent',
                }}/>
                <span className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 380 }}>{r.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button className="btn btn-ghost" onClick={() => goStep(1)}>Back</button>
          <button className="btn btn-meadow" onClick={() => goStep(3)}>
            Continue {Icon.arrow(14, 'var(--on-meadow)')}
          </button>
        </div>
      </div>
    );
  }

  // step 3 — reading garden (NEW)
  if (step === 3) {
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px' }}>
        <OnboardingProgress n={3} total={TOTAL}/>
        <Eyebrow tone="rose" style={{ marginTop: 28 }}>Step three · Reading garden</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
          What stories<br/><span style={{ fontStyle: 'italic' }}>nourish you?</span>
        </h1>
        <p className="body" style={{ margin: '0 0 16px' }}>
          Pick a few. We'll bring you slow, well-sourced reading from around the world. Never more than a handful a day.
        </p>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--paper-faint)', textTransform: 'uppercase', marginBottom: 12 }}>
          {interests.length} of 9 chosen · pick 2–6 for variety
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {READING_GARDEN.map(g => {
            const on = interests.includes(g.k);
            return (
              <button key={g.k} onClick={() => toggleInterest(g.k)}
                className={on ? `card-${g.tone}` : 'card-soft'}
                style={{
                  padding: '12px 12px', textAlign: 'left', cursor: 'pointer',
                  border: on ? undefined : '1px solid var(--paper-line)',
                  position: 'relative', minHeight: 92,
                }}>
                <span style={{
                  fontSize: 18, color: on ? `var(--${g.tone}-deep)` : 'var(--paper-faint)',
                  display: 'block', marginBottom: 4, lineHeight: 1,
                }}>{g.glyph}</span>
                <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', fontWeight: 380, lineHeight: 1.15, color: 'var(--paper)' }}>
                  {g.label}
                </div>
                <div className="body-sm" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.3 }}>
                  {g.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* tiny preview of what they'll get */}
        {interests.length >= 2 && (
          <div className="card-rose fade-in" style={{ marginTop: 18, padding: 14 }}>
            <Eyebrow tone="rose">Your morning post</Eyebrow>
            <p className="serif" style={{ margin: '8px 0 0', fontSize: 15, fontStyle: 'italic', fontWeight: 380, lineHeight: 1.4 }}>
              Three letters a day, hand-picked from {interests.length} of your interests. Friday brings a longer essay; Sundays, a shelf of books.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={() => goStep(2)}>Back</button>
          <button className="btn btn-rose" disabled={interests.length === 0}
            style={{ opacity: interests.length === 0 ? 0.5 : 1 }}
            onClick={() => goStep(4)}>
            Continue {Icon.arrow(14, 'var(--on-rose)')}
          </button>
        </div>
      </div>
    );
  }

  // step 4 — signature sprig (the delight)
  if (step === 4) {
    const picked = SPRIGS.find(f => f.k === flower) || SPRIGS[0];
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px' }}>
        <OnboardingProgress n={4} total={TOTAL}/>
        <Eyebrow tone={picked.tone} style={{ marginTop: 28 }}>Step four · A small delight</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
          Choose a<br/><span style={{ fontStyle: 'italic' }}>signature sprig.</span>
        </h1>
        <p className="body" style={{ margin: '0 0 18px' }}>
          It will quietly appear throughout your hearth: beside your name, on lock-screen nudges, in the margin of every entry. Change it any season.
        </p>

        {/* preview vignette */}
        <SprigPreview sprig={picked} name={name || 'Friend'}/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
          {SPRIGS.map(f => {
            const on = flower === f.k;
            return (
              <button key={f.k} onClick={() => setFlower(f.k)}
                style={{
                  padding: '18px 10px', cursor: 'pointer', textAlign: 'center',
                  background: on ? `var(--${f.tone}-tint)` : 'rgba(255,255,255,0.4)',
                  border: '1px solid ' + (on ? `var(--${f.tone})` : 'var(--paper-line)'),
                  borderRadius: 14, transition: 'all 0.2s ease',
                  position: 'relative',
                }}>
                <LeafGlyph tone={f.tone} size={36} active={on}/>
                <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', fontWeight: 380, marginTop: 8, color: on ? `var(--${f.tone}-deep)` : 'var(--paper-2)' }}>
                  {f.label}
                </div>
              </button>
            );
          })}
        </div>

        <p className="serif" style={{ margin: '14px 0 0', fontSize: 14, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', textAlign: 'center' }}>
          {picked.label} · <span style={{ color: `var(--${picked.tone}-deep)` }}>{picked.meaning}</span>
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={() => goStep(3)}>Back</button>
          <button className={`btn btn-${picked.tone}`} onClick={() => goStep(5)}>
            Continue {Icon.arrow(14, `var(--on-${picked.tone})`)}
          </button>
        </div>
      </div>
    );
  }

  // step 5 — when to write
  if (step === 5) {
    const TIMES = [
      { k: 'morning',   label: 'Mornings',   sub: 'Set the day before it sets you', tone: 'rose' },
      { k: 'evening',   label: 'Evenings',   sub: 'Close the day before sleep',     tone: 'wisteria' },
      { k: 'both',      label: 'Both',       sub: 'A small fire, twice a day',      tone: 'ember' },
      { k: 'flexible',  label: 'When I can', sub: 'No reminders, just here when needed', tone: 'meadow' },
    ];
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px' }}>
        <OnboardingProgress n={5} total={TOTAL}/>
        <Eyebrow tone="wisteria" style={{ marginTop: 28 }}>Step five</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
          When do you<br/><span style={{ fontStyle: 'italic' }}>tend the fire?</span>
        </h1>
        <p className="body" style={{ margin: '0 0 22px' }}>
          We'll send one quiet nudge, and only one. Change it any time.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIMES.map(t => {
            const on = time === t.k;
            return (
              <button key={t.k} onClick={() => setTime(t.k)} className={on ? `card-${t.tone}` : 'card-soft'}
                style={{ padding: '14px 16px', textAlign: 'left', cursor: 'pointer', border: on ? undefined : '1px solid var(--paper-line)' }}>
                <div className="serif" style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 380 }}>{t.label}</div>
                <div className="body-sm" style={{ marginTop: 4 }}>{t.sub}</div>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button className="btn btn-ghost" onClick={() => goStep(4)}>Back</button>
          <button className="btn btn-wisteria" onClick={() => goStep(6)}>
            Continue {Icon.arrow(14, 'var(--on-wisteria)')}
          </button>
        </div>
      </div>
    );
  }

  // step 6 — make a hearth (email + password)
  if (step === 6) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordOk = password.length >= 8;
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px' }}>
        <OnboardingProgress n={6} total={TOTAL}/>
        <Eyebrow tone="ember" style={{ marginTop: 28 }}>Step six · Make a hearth</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
          Keep your<br/><span style={{ fontStyle: 'italic' }}>fire safe.</span>
        </h1>
        <p className="body" style={{ margin: '0 0 22px' }}>
          An email and a password we can use to bring you back to your entries on any device.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
            <input className="hearth-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@somewhere.kind" type="email" autoComplete="email" style={{ fontSize: 17 }}/>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>Password</div>
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                  color: 'var(--ember)', textTransform: 'uppercase' }}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <input className="hearth-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least eight characters" type={showPw ? 'text' : 'password'} autoComplete="new-password" style={{ fontSize: 17 }}/>
            <div className="body-sm" style={{ marginTop: 6, color: passwordOk ? 'var(--meadow-deep, var(--paper-mute))' : 'var(--paper-mute)' }}>
              {password.length === 0 ? 'Pick something only you would know.' : passwordOk ? 'Looks good.' : `${8 - password.length} more characters`}
            </div>
          </div>
        </div>

        <p className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--paper-faint)', textTransform: 'uppercase', textAlign: 'center', marginTop: 22 }}>
          Private by default. No ads. Your entries are never used to train models.
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={() => goStep(5)}>Back</button>
          <button className="btn btn-ember" disabled={!emailOk || !passwordOk}
            style={{ opacity: (!emailOk || !passwordOk) ? 0.5 : 1 }}
            onClick={() => goStep(7)}>
            Continue {Icon.arrow(14, 'var(--on-ember)')}
          </button>
        </div>
      </div>
    );
  }

  // step 7 — light the fire (creates the account)
  const pickedFlower = SPRIGS.find(f => f.k === flower) || SPRIGS[0];
  return (
    <div className="fade-in" style={{ padding: '60px 28px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '70vh', justifyContent: 'space-between' }}>
      <div>
        <OnboardingProgress n={7} total={TOTAL}/>
        <div style={{ position: 'relative', width: 110, height: 110, margin: '40px auto 0' }}>
          <div className="flicker" style={{ position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #f3c98a, #d4a574 40%, #6e431f 90%)',
            boxShadow: '0 0 80px rgba(212,165,116,0.6)' }}/>
          <div style={{ position: 'absolute', right: -8, top: -6, transform: 'rotate(12deg)' }}>
            <LeafGlyph tone={pickedFlower.tone} size={42} active/>
          </div>
        </div>
        <h1 className="h-display serif" style={{ margin: '32px 0 10px', fontWeight: 350, fontStyle: 'italic' }}>
          Welcome, {name || 'friend'}.
        </h1>
        <p className="body" style={{ maxWidth: 300, margin: '0 auto' }}>
          Your fire is lit, your {pickedFlower.label.toLowerCase()} is in bloom, and your reading is on its way. Your first prompt is waiting on the home screen.
        </p>
        {submitError && (
          <p className="body-sm" style={{ marginTop: 22, color: 'var(--ember-deep, var(--ember))', maxWidth: 280, marginInline: 'auto' }}>
            {submitError}
            {' '}
            <span onClick={() => goStep(6)} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Edit account</span>.
          </p>
        )}
      </div>
      <button className={`btn btn-${pickedFlower.tone}`} disabled={submitting}
        style={{ width: '100%', maxWidth: 280, justifyContent: 'center', opacity: submitting ? 0.6 : 1 }}
        onClick={submitSignup}>
        {submitting ? 'Lighting the fire…' : <>Step inside {Icon.arrow(14, `var(--on-${pickedFlower.tone})`)}</>}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LEAF GLYPHS — pure SVG, theme-aware. Single pointed leaf with
// center vein, herbarium register.
// ─────────────────────────────────────────────────────────────
function LeafGlyph({ tone = 'rose', size = 24, active = true }) {
  const c = active ? `var(--${tone})` : 'var(--paper-faint)';
  const cDeep = active ? `var(--${tone}-deep)` : 'var(--paper-faint)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 C 17 6, 18 14, 12 22 C 6 14, 7 6, 12 2 Z" fill={c} opacity="0.85"/>
      <path d="M12 3 L 12 21" stroke={cDeep} strokeWidth="0.7" opacity="0.7" fill="none"/>
      <path d="M12 8 L 9 11 M12 8 L 15 11 M12 13 L 9.5 15.5 M12 13 L 14.5 15.5"
        stroke={cDeep} strokeWidth="0.4" opacity="0.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
// alias for any old callers
const FlowerGlyph = LeafGlyph;

function SprigPreview({ sprig, name }) {
  return (
    <div style={{ position: 'relative', borderRadius: 16, padding: 18, overflow: 'hidden',
      background: `linear-gradient(135deg, var(--${sprig.tone}-tint) 0%, var(--paper-2-bg, rgba(247,245,238,0.4)) 100%)`,
      border: `1px solid var(--${sprig.tone}-line)` }}>
      {/* avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%',
          background: `linear-gradient(135deg, var(--${sprig.tone}) 0%, var(--${sprig.tone}-deep) 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: `var(--on-${sprig.tone})`, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, fontWeight: 380, position: 'relative' }}>
          {(name[0] || 'F').toUpperCase()}
          <div style={{ position: 'absolute', right: -4, bottom: -4, background: 'var(--night)', borderRadius: '50%', padding: 2 }}>
            <LeafGlyph tone={sprig.tone} size={14} active/>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: `var(--${sprig.tone}-deep)`, textTransform: 'uppercase' }}>
            Tonight at the hearth
          </div>
          <div className="serif" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 380, marginTop: 4 }}>
            Three good things, {name.toLowerCase() || 'friend'}.
          </div>
        </div>
      </div>
      {/* scattered leaves */}
      <div style={{ position: 'absolute', right: 12, top: 8, opacity: 0.4, transform: 'rotate(20deg)' }}>
        <LeafGlyph tone={sprig.tone} size={36} active/>
      </div>
      <div style={{ position: 'absolute', left: -8, bottom: -10, opacity: 0.25, transform: 'rotate(-30deg)' }}>
        <LeafGlyph tone={sprig.tone} size={56} active/>
      </div>
    </div>
  );
}
// alias for any old callers
const FlowerPreview = ({ flower, name }) => <SprigPreview sprig={flower} name={name}/>;

function OnboardingProgress({ n, total }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 2, flex: 1, borderRadius: 999,
          background: i < n ? 'var(--ember)' : 'var(--paper-line)',
        }}/>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// AUTH — sign in
// ─────────────────────────────────────────────────────────────
function AuthScreen({ go, onAuthed }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailOk && password.length >= 8 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const { token } = await api.auth.signin({
        email: email.trim().toLowerCase(),
        password,
      });
      setToken(token);
      if (typeof onAuthed === 'function') {
        await onAuthed();
      }
      go('home');
    } catch (err) {
      setError(err.data?.error || err.message || 'Something went wrong');
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && canSubmit) submit();
  }

  return (
    <div className="fade-in" style={{ padding: '40px 28px 32px' }}>
      <button onClick={() => go('onboarding', { step: 0 })} style={{ background: 'transparent', border: 0, color: 'var(--paper-2)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        {Icon.back(20, 'var(--paper-2)')}
        <span className="sans" style={{ fontSize: 13 }}>Back</span>
      </button>
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <span className="hearth-mark" style={{ display: 'inline-block', width: 28, height: 28 }}/>
        <h1 className="h-display serif" style={{ margin: '20px 0 8px', fontWeight: 350 }}>
          Welcome back.
        </h1>
        <p className="body" style={{ margin: 0 }}>
          Pick up where you left off.
        </p>
      </div>

      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
          <input className="hearth-input" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKeyDown}
            placeholder="you@somewhere.kind" type="email" autoComplete="email" style={{ fontSize: 17 }}/>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>Password</div>
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                color: 'var(--ember)', textTransform: 'uppercase' }}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          <input className="hearth-input" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKeyDown}
            placeholder="" type={showPw ? 'text' : 'password'} autoComplete="current-password" style={{ fontSize: 17 }}/>
        </div>
      </div>

      <button className="btn btn-ember" disabled={!canSubmit} onClick={submit}
        style={{ marginTop: 18, width: '100%', justifyContent: 'center', opacity: canSubmit ? 1 : 0.5 }}>
        {busy ? 'Tending the fire…' : 'Sign in'}
      </button>

      {error && (
        <p className="body-sm" style={{ textAlign: 'center', marginTop: 14, color: 'var(--ember-deep, var(--ember))' }}>
          {error}
        </p>
      )}

      <p className="body-sm" style={{ textAlign: 'center', marginTop: 22 }}>
        First time here?{' '}
        <span onClick={() => go('onboarding', { step: 0 })}
          style={{ color: 'var(--ember)', cursor: 'pointer', textDecoration: 'underline' }}>
          Make a hearth
        </span>
      </p>
      <p className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', textAlign: 'center', color: 'var(--paper-faint)', marginTop: 30 }}>
        PRIVATE BY DEFAULT · NO ADS · NEVER USED TO TRAIN MODELS
      </p>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────
const TIME_OPTIONS = [
  { k: 'morning',  label: 'Mornings',   sub: 'Set the day before it sets you',     tone: 'rose' },
  { k: 'evening',  label: 'Evenings',   sub: 'Close the day before sleep',         tone: 'wisteria' },
  { k: 'both',     label: 'Both',       sub: 'A small fire, twice a day',          tone: 'ember' },
  { k: 'flexible', label: 'When I can', sub: 'No reminders, just here when needed',tone: 'meadow' },
];

const REASON_OPTIONS = [
  { k: 'rest',      label: 'Rest more easily' },
  { k: 'clarity',   label: 'Find clarity' },
  { k: 'gratitude', label: 'Practice gratitude' },
  { k: 'focus',     label: 'Work with intention' },
  { k: 'grief',     label: 'Sit with something hard' },
  { k: 'wonder',    label: 'Notice more' },
];

function SettingsScreen({ go, user, refreshUser, onSignOut }) {
  const [counts, setCounts] = React.useState({ entries: null, bookmarks: null });
  const [savingKey, setSavingKey] = React.useState(null);
  const [savedKey, setSavedKey] = React.useState(null);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [j, b] = await Promise.all([api.journal.list(), api.bookmarks.list()]);
        if (cancelled) return;
        setCounts({ entries: j.entries?.length || 0, bookmarks: b.bookmarks?.length || 0 });
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="fade-in" style={{ padding: '40px 22px 32px', textAlign: 'center' }}>
        <Eyebrow tone="bloom" style={{ marginTop: 32 }}>Settings</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 14px', fontWeight: 350 }}>
          Tend the fire,<br/><span style={{ fontStyle: 'italic' }}>your way.</span>
        </h1>
        <p className="body" style={{ maxWidth: 320, margin: '0 auto 22px' }}>
          Sign in to find your atmosphere, your kept entries, and what's on your shelf.
        </p>
        <button className="btn btn-ember" onClick={() => go('auth')}>Sign in</button>
      </div>
    );
  }

  const onb = user.onboarding || {};
  const flower = onb.flower || 'wisteria';
  const reasons = onb.reasons || [];
  const interests = onb.interests || [];
  const dailyTime = onb.dailyTime || 'morning';
  const initial = (user.name || user.email || 'F')[0].toUpperCase();

  async function updateOnboarding(patch, key) {
    setSavingKey(key);
    try {
      await api.profile.update({ onboarding: patch });
      await refreshUser();
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1500);
    } catch {
      // could surface error inline; keep silent for now
    } finally {
      setSavingKey(null);
    }
  }

  function toggleInArray(arr, k) {
    return arr.includes(k) ? arr.filter(x => x !== k) : [...arr, k];
  }

  return (
    <div className="fade-in" style={{ padding: '14px 22px 32px' }}>
      <Eyebrow tone="bloom">Settings</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
        Tend the fire,<br/><span style={{ fontStyle: 'italic' }}>your way.</span>
      </h1>
      <p className="body" style={{ margin: '0 0 22px', maxWidth: 420 }}>
        What you choose here shapes what Hearth becomes for you. Adjust any time.
      </p>

      {/* Account card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0', borderTop: '2px solid var(--hh-green)', borderBottom: '1px solid var(--paper-line-2)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%',
          background: `linear-gradient(135deg, var(--${SPRIGS.find(s => s.k === flower)?.tone || 'wisteria'}) 0%, var(--hh-ecru) 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--hh-green)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, fontWeight: 380 }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 380, color: 'var(--hh-green)' }}>{user.name || 'Friend'}</div>
          <div className="body-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}{counts.entries !== null ? ` · ${counts.entries} ${counts.entries === 1 ? 'entry kept' : 'entries kept'}` : ''}
          </div>
        </div>
        <button onClick={() => go('settings-profile')} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--paper-2)', padding: 4 }}>
          {Icon.arrow(16, 'var(--paper-2)')}
        </button>
      </div>

      {/* Atmosphere */}
      <section style={{ marginTop: 28 }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title" style={{ color: 'var(--hh-ecru-deep)' }}>Atmosphere</span>
          <span className="hearth-dept-head-meta">applies live</span>
        </div>

        {/* Signature sprig */}
        <div style={{ marginTop: 18 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 8 }}>
            Signature sprig
            {savingKey === 'flower' && <span style={{ marginLeft: 10, color: 'var(--paper-faint)' }}>saving</span>}
            {savedKey === 'flower' && <span style={{ marginLeft: 10, color: 'var(--meadow-deep, var(--hh-green))' }}>saved</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {SPRIGS.map(s => {
              const on = flower === s.k;
              return (
                <button key={s.k} onClick={() => updateOnboarding({ flower: s.k }, 'flower')}
                  disabled={savingKey === 'flower'}
                  style={{
                    padding: '16px 10px', cursor: 'pointer', textAlign: 'center',
                    background: on ? `var(--${s.tone}-tint)` : 'transparent',
                    border: '1px solid ' + (on ? `var(--${s.tone})` : 'var(--paper-line)'),
                    borderRadius: 12,
                    transition: 'all 0.18s ease',
                  }}>
                  <LeafGlyph tone={s.tone} size={32} active={on}/>
                  <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', fontWeight: 380, marginTop: 6, color: on ? `var(--${s.tone}-deep)` : 'var(--paper-2)' }}>
                    {s.label}
                  </div>
                  <div className="body-sm" style={{ fontSize: 11, marginTop: 2, color: 'var(--paper-mute)' }}>
                    {s.meaning}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* When you tend the fire */}
        <div style={{ marginTop: 24 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 8 }}>
            When you tend the fire
            {savingKey === 'dailyTime' && <span style={{ marginLeft: 10, color: 'var(--paper-faint)' }}>saving</span>}
            {savedKey === 'dailyTime' && <span style={{ marginLeft: 10, color: 'var(--meadow-deep, var(--hh-green))' }}>saved</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TIME_OPTIONS.map(t => {
              const on = dailyTime === t.k;
              return (
                <button key={t.k} onClick={() => updateOnboarding({ dailyTime: t.k }, 'dailyTime')}
                  disabled={savingKey === 'dailyTime'}
                  style={{
                    padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                    background: on ? `var(--${t.tone}-tint)` : 'transparent',
                    border: '1px solid ' + (on ? `var(--${t.tone})` : 'var(--paper-line)'),
                    borderRadius: 10,
                  }}>
                  <div className="serif" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 380, color: 'var(--hh-green)' }}>{t.label}</div>
                  <div className="body-sm" style={{ marginTop: 2 }}>{t.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* What brought you here */}
        <div style={{ marginTop: 24 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 8 }}>
            What brought you here
            {savingKey === 'reasons' && <span style={{ marginLeft: 10, color: 'var(--paper-faint)' }}>saving</span>}
            {savedKey === 'reasons' && <span style={{ marginLeft: 10, color: 'var(--meadow-deep, var(--hh-green))' }}>saved</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {REASON_OPTIONS.map(r => {
              const on = reasons.includes(r.k);
              return (
                <button key={r.k}
                  onClick={() => updateOnboarding({ reasons: toggleInArray(reasons, r.k) }, 'reasons')}
                  disabled={savingKey === 'reasons'}
                  className={`chip ${on ? 'chip-ember' : ''}`}
                  style={{ cursor: 'pointer', border: on ? undefined : '1px solid var(--paper-line)' }}>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading garden */}
        <div style={{ marginTop: 24 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 8 }}>
            Reading garden
            {savingKey === 'interests' && <span style={{ marginLeft: 10, color: 'var(--paper-faint)' }}>saving</span>}
            {savedKey === 'interests' && <span style={{ marginLeft: 10, color: 'var(--meadow-deep, var(--hh-green))' }}>saved</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {READING_GARDEN.map(g => {
              const on = interests.includes(g.k);
              return (
                <button key={g.k}
                  onClick={() => updateOnboarding({ interests: toggleInArray(interests, g.k) }, 'interests')}
                  disabled={savingKey === 'interests'}
                  className={`chip ${on ? `chip-${g.tone}` : ''}`}
                  style={{ cursor: 'pointer', border: on ? undefined : '1px solid var(--paper-line)' }}>
                  {g.label}
                </button>
              );
            })}
          </div>
          <p className="body-sm" style={{ marginTop: 10, color: 'var(--paper-mute)' }}>
            What we'll search for when curating tomorrow's reading room.
          </p>
        </div>
      </section>

      {/* Daily / shortcuts */}
      <section style={{ marginTop: 36 }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">Where to find things</span>
          <span className="hearth-dept-head-meta"></span>
        </div>
        <div style={{ marginTop: 4 }}>
          <SettingsLink onClick={() => go('weekly-digest')} icon={Icon.wave(16, 'var(--hh-green)')}
            label="Weekly review" right="A look back"/>
          <SettingsLink onClick={() => go('bookmarks')} icon={Icon.bookmark(16, 'var(--hh-green)')}
            label="The Nook" right={counts.bookmarks !== null ? `${counts.bookmarks} ${counts.bookmarks === 1 ? 'kept' : 'kept'}` : ''}/>
          <SettingsLink onClick={() => go('journal-archive')} icon={Icon.pen(16, 'var(--hh-green)')}
            label="Journal archive" right={counts.entries !== null ? `${counts.entries} ${counts.entries === 1 ? 'entry' : 'entries'}` : ''}/>
        </div>
      </section>

      {/* Account */}
      <section style={{ marginTop: 36 }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">Account</span>
          <span className="hearth-dept-head-meta"></span>
        </div>
        <div style={{ marginTop: 4 }}>
          <SettingsLink onClick={() => go('settings-profile')} icon={Icon.more(16, 'var(--hh-green)')}
            label="Edit profile" right={user.name || ''}/>
          {onSignOut && (
            <SettingsLink onClick={onSignOut} icon={Icon.back(16, 'var(--paper-mute)')}
              label="Sign out"/>
          )}
        </div>
      </section>

      <p className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', textAlign: 'center', color: 'var(--paper-faint)', marginTop: 28, textTransform: 'uppercase' }}>
        Made slowly · v0.1
      </p>
    </div>
  );
}

function SettingsLink({ onClick, icon, label, right }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 0', background: 'transparent', border: 0,
      borderBottom: '1px solid var(--paper-line-2)',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <span className="serif" style={{ flex: 1, fontSize: 16, fontStyle: 'italic', fontWeight: 380, color: 'var(--hh-green)' }}>{label}</span>
      {right && <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>{right}</span>}
      {Icon.arrow(14, 'var(--paper-faint)')}
    </button>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <Eyebrow style={{ marginBottom: 10 }}>{title}</Eyebrow>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, right, onClick, danger, tone }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: 'transparent', border: 0,
      borderBottom: '1px solid var(--paper-line-2)',
      cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
    }}>
      {icon && <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: tone ? `var(--${tone}-tint)` : 'rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>}
      <span className="serif" style={{ flex: 1, fontSize: 16, fontStyle: 'italic', fontWeight: 380, color: danger ? 'var(--rose)' : 'var(--paper)' }}>{label}</span>
      {right && <span className="body-sm" style={{ color: 'var(--paper-mute)' }}>{right}</span>}
      {onClick && Icon.arrow(14, 'var(--paper-faint)')}
    </button>
  );
}


// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS — schedule
// ─────────────────────────────────────────────────────────────
function NotificationsScreen({ go }) {
  const [morning, setMorning] = React.useState(true);
  const [evening, setEvening] = React.useState(true);
  const [weekly,  setWeekly]  = React.useState(true);

  return (
    <div className="fade-in" style={{ padding: '4px 22px 32px' }}>
      <BackRow go={go} label="Settings" dest="settings"/>
      <Eyebrow tone="ember" style={{ marginTop: 18 }}>Reminders</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
        Quiet nudges,<br/><span style={{ fontStyle: 'italic' }}>not noise.</span>
      </h1>
      <p className="body" style={{ margin: '0 0 22px' }}>
        Hearth never beeps. Reminders arrive as a single gentle line on your lock screen.
      </p>

      <ReminderRow tone="ember"   on={morning} onChange={setMorning} title="Morning prompt" sub="A line to begin the day" time="7:15 am"/>
      <ReminderRow tone="wisteria" on={evening} onChange={setEvening} title="Evening prompt" sub="Close the day before sleep" time="8:30 pm"/>
      <ReminderRow tone="meadow"  on={weekly}  onChange={setWeekly}  title="Sunday review" sub="A small look back" time="Sundays · 5:00 pm"/>

      <Eyebrow style={{ marginTop: 28 }}>Preview</Eyebrow>
      <div style={{ marginTop: 12, padding: 18, borderRadius: 18, background: 'linear-gradient(180deg, var(--hh-green-2) 0%, var(--hh-green) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, background: 'radial-gradient(circle at 70% 20%, rgba(225,190,116,0.35), transparent 50%)' }}/>
        <div style={{ position: 'relative' }}>
          <div className="mono" style={{ color: 'rgba(247,245,238,0.6)', fontSize: 10, letterSpacing: '0.2em', textAlign: 'center' }}>
            FRIDAY · NOV 27
          </div>
          <div className="serif" style={{ color: 'rgba(247,245,238,0.95)', fontSize: 38, fontWeight: 320, textAlign: 'center', margin: '4px 0 18px' }}>
            8:30
          </div>
          <div style={{ background: 'rgba(247,245,238,0.10)', backdropFilter: 'blur(20px)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="hearth-mark" style={{ width: 14, height: 14 }}/>
            <div style={{ flex: 1 }}>
              <div className="sans" style={{ color: 'rgba(247,245,238,0.95)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                Hearth
                <LeafMark size={10} tone="sig" opacity={0.95}/>
              </div>
              <div className="serif" style={{ color: 'rgba(247,245,238,0.85)', fontSize: 14, fontStyle: 'italic', marginTop: 2, fontWeight: 350 }}>
                The light is going. Sit a moment with three good things.
              </div>
            </div>
            <span className="mono" style={{ color: 'rgba(247,245,238,0.5)', fontSize: 9 }}>now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReminderRow({ tone, on, onChange, title, sub, time }) {
  return (
    <div className={`card${on ? '-' + tone : '-soft'}`} style={{ marginBottom: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 380 }}>{title}</div>
        <div className="body-sm" style={{ marginTop: 2 }}>{sub} · <span className="mono" style={{ fontSize: 11 }}>{time}</span></div>
      </div>
      <button onClick={() => onChange(!on)} style={{
        width: 44, height: 26, borderRadius: 999, border: 0, cursor: 'pointer', flexShrink: 0,
        background: on ? `var(--${tone})` : 'var(--paper-line)',
        position: 'relative', transition: 'background 0.2s ease',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--night)',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}/>
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────
function ProfileScreen({ go, user, refreshUser }) {
  const [name, setName] = React.useState(user?.name || '');
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [stats, setStats] = React.useState({ entries: null, bookmarks: null, words: 0, joined: null });

  React.useEffect(() => { setName(user?.name || ''); }, [user?.name]);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [j, b] = await Promise.all([api.journal.list(), api.bookmarks.list()]);
        if (cancelled) return;
        const words = (j.entries || []).reduce((sum, e) => sum + (e.body || '').trim().split(/\s+/).filter(Boolean).length, 0);
        setStats({
          entries: j.entries?.length || 0,
          bookmarks: b.bookmarks?.length || 0,
          words,
          joined: user.createdAt || null,
        });
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="fade-in" style={{ padding: '40px 22px 32px', textAlign: 'center' }}>
        <BackRow go={go} label="Settings" dest="settings"/>
        <Eyebrow tone="rose" style={{ marginTop: 32 }}>Your hearth</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 14px', fontWeight: 350 }}>
          Sign in to find<br/><span style={{ fontStyle: 'italic' }}>your profile.</span>
        </h1>
        <button className="btn btn-ember" onClick={() => go('auth')}>Sign in</button>
      </div>
    );
  }

  async function saveName() {
    if (saving) return;
    if ((name.trim() || '') === (user.name || '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await api.profile.update({ name: name.trim() });
      await refreshUser();
      setEditing(false);
    } catch {
      // surface inline if needed
    } finally {
      setSaving(false);
    }
  }

  const onb = user.onboarding || {};
  const flower = onb.flower || 'wisteria';
  const sprig = SPRIGS.find(s => s.k === flower) || SPRIGS[0];
  const reasonsText = (onb.reasons || []).join(', ') || 'Not yet set';
  const interestsText = (onb.interests || [])
    .map(k => READING_GARDEN.find(g => g.k === k)?.label || k)
    .join(', ') || 'Not yet set';
  const dailyTimeLabel = ({
    morning: 'Mornings', afternoon: 'Afternoons', evening: 'Evenings',
    both: 'Mornings and evenings', flexible: 'When you can',
  })[onb.dailyTime || 'morning'];
  const tz = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; }
  })();
  const initial = (user.name || user.email || 'F')[0].toUpperCase();
  const joined = stats.joined ? new Date(stats.joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="fade-in" style={{ padding: '4px 22px 32px' }}>
      <BackRow go={go} label="Settings" dest="settings"/>
      <Eyebrow tone="rose" style={{ marginTop: 18 }}>Your hearth</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 18px', fontWeight: 350 }}>
        How the fire<br/><span style={{ fontStyle: 'italic' }}>knows you.</span>
      </h1>

      <div style={{ textAlign: 'center', margin: '8px 0 24px' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%',
          background: `linear-gradient(135deg, var(--${sprig.tone}) 0%, var(--hh-ecru) 100%)`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--hh-green)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 40, fontWeight: 380 }}>
          {initial}
        </div>
        {joined && (
          <p className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginTop: 12 }}>
            With Hearth since {joined}
          </p>
        )}
      </div>

      {/* Display name (editable) */}
      <div style={{ borderTop: '1px solid var(--paper-line)', padding: '14px 0', borderBottom: '1px solid var(--paper-line-2)' }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--paper-faint)' }}>Display name</div>
        {editing ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <input className="hearth-input" value={name} onChange={e => setName(e.target.value)}
              autoFocus style={{ fontSize: 17, flex: 1 }}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setName(user.name || ''); setEditing(false); } }}/>
            <button onClick={saveName} disabled={saving}
              className="hearth-save-btn" data-saved={saving}>
              <span>{saving ? 'Saving' : 'Save'}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
            <div className="serif" style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 380, color: 'var(--hh-green)' }}>
              {user.name || 'Friend'}
            </div>
            <button onClick={() => setEditing(true)} className="hearth-save-btn">
              <span>Edit</span>
            </button>
          </div>
        )}
      </div>

      <ProfileField label="Email" value={user.email}/>
      {tz && <ProfileField label="Time zone" value={tz}/>}
      <ProfileField label="When you tend the fire" value={dailyTimeLabel}/>
      <ProfileField label="Brought you here" value={reasonsText} tone="meadow"/>
      <ProfileField label="Signature sprig" value={`${sprig.label} · ${sprig.meaning}`} tone={sprig.tone}/>
      <ProfileField label="Reading garden" value={interestsText} tone="rose"/>

      <button onClick={() => go('settings')} className="btn btn-ghost" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}>
        Edit atmosphere in Settings
      </button>

      <div style={{ marginTop: 28 }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title" style={{ color: 'var(--hh-ecru-deep)' }}>Your fire, in numbers</span>
          <span className="hearth-dept-head-meta"></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginTop: 14, borderTop: '1px solid var(--paper-line)' }}>
          {[
            { big: stats.entries === null ? '…' : String(stats.entries), label: stats.entries === 1 ? 'entry kept' : 'entries kept' },
            { big: stats.bookmarks === null ? '…' : String(stats.bookmarks), label: stats.bookmarks === 1 ? 'in the Nook' : 'in the Nook' },
            { big: stats.words ? `${(stats.words / 1000).toFixed(stats.words >= 10000 ? 0 : 1)}k` : '0', label: 'words written' },
            { big: stats.entries !== null && stats.entries > 0 ? Math.max(1, Math.round(stats.words / 30)) + 'm' : '—', label: 'of attention' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '20px 0',
              borderBottom: '1px solid var(--paper-line)',
              borderRight: i % 2 === 0 ? '1px solid var(--paper-line)' : 'none',
              paddingLeft: i % 2 === 0 ? 0 : 18,
              paddingRight: i % 2 === 0 ? 18 : 0,
            }}>
              <div className="serif" style={{ fontSize: 30, fontWeight: 350, letterSpacing: '-0.01em', color: 'var(--hh-green)', lineHeight: 1 }}>{s.big}</div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--paper-mute)', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, tone }) {
  return (
    <div style={{ borderBottom: '1px solid var(--paper-line-2)', padding: '14px 0' }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: tone ? `var(--${tone}-deep, var(--paper-faint))` : 'var(--paper-faint)' }}>{label}</div>
      <div className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 380, marginTop: 4, color: 'var(--hh-green)' }}>{value}</div>
    </div>
  );
}

function Stat({ tone, big, label }) {
  return (
    <div className={`card-${tone}`} style={{ padding: 16, textAlign: 'center' }}>
      <div className="serif" style={{ fontSize: 32, fontWeight: 360, fontStyle: 'italic', color: `var(--${tone}-deep)`, lineHeight: 1 }}>{big}</div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--${tone})`, marginTop: 6 }}>{label}</div>
    </div>
  );
}

export { OnboardingScreen, AuthScreen, SettingsScreen, NotificationsScreen, ProfileScreen, LeafGlyph, FlowerGlyph, READING_GARDEN, SPRIGS, FLOWERS };
