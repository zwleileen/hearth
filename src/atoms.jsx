// Hearth — shared icons + editorial atoms
// EDITORIAL DIRECTION (Apr '26): Aesop / Frama register.
// Old Lace = paper. Midnight Green = ink. The other four
// (Ecru, Carolina Blue, Pale Dogwood, Isabelline) are
// FEATURE ACCENTS only — used as full color blocks for a
// section, never as gradients or tints. No botanical
// vocabulary. No leaves. No sprigs. No fire metaphor in chrome.

const Icon = {
  pen: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4l6 6L8 22H2v-6z"/><path d="M13 5l6 6"/>
    </svg>
  ),
  compass: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>
    </svg>
  ),
  wave: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12c2 0 2-3 4-3s2 6 4 6 2-9 4-9 2 6 4 6"/>
    </svg>
  ),
  // Headphone-ish — for Attune. Replaces leaf entirely.
  ear: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 1 1 16 0v4a2 2 0 0 1-2 2h-2v-7h4M4 13v4a2 2 0 0 0 2 2h2v-7H4"/>
    </svg>
  ),
  // Hearth tab — a single horizontal line over a square (a hearth/mantel)
  home: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>
    </svg>
  ),
  arrow: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  back: (s = 22, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6l-6 6 6 6"/>
    </svg>
  ),
  more: (s = 22, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>
    </svg>
  ),
  bookmark: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-6-4-6 4z"/>
    </svg>
  ),
  plus: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  check: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7"/>
    </svg>
  ),
  play: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M7 4l13 8-13 8z"/></svg>
  ),
  // legacy callers — neutral fallbacks so old screens don't crash
  flame: (s = 18, c = 'currentColor') => Icon.home(s, c),
  book: (s = 18, c = 'currentColor') => Icon.bookmark(s, c),
  leaf: (s = 18, c = 'currentColor') => Icon.ear(s, c),
};

// ─────────────────────────────────────────────────────────────
// EDITORIAL ATOMS — Aesop / Frama vocabulary.
// Photography placeholders, kickers, large serif headlines,
// hairline rules, and a "color block" (Ecru / Carolina Blue /
// Pale Dogwood / Midnight Green) — the four ways a section
// can take ownership of the page.
// ─────────────────────────────────────────────────────────────

// Editorial photo placeholder. Quiet, no diagonal hatch.
function Photo({ caption, h = 220, accent = 'isabel', style = {} }) {
  // accent: which palette swatch the placeholder lives in
  const bg = ({
    isabel: 'var(--hh-isabel)',
    blue:   'var(--hh-blue)',
    dogwood:'var(--hh-dogwood)',
    ecru:   'var(--hh-ecru)',
    green:  'var(--hh-green-3)',
  })[accent] || 'var(--hh-isabel)';
  const ink = accent === 'green' ? 'var(--hh-lace)' : 'var(--hh-green)';
  return (
    <figure style={{ margin: 0, ...style }}>
      <div style={{
        height: h, background: bg, position: 'relative', overflow: 'hidden',
        borderRadius: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.18), transparent 60%)',
          pointerEvents: 'none',
        }}/>
      </div>
      {caption && (
        <figcaption className="mono" style={{
          marginTop: 8, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--paper-mute)',
        }}>{caption}</figcaption>
      )}
    </figure>
  );
}
// alias used by older screens
const Ph = Photo;

// All-caps editorial kicker. The single small voice above a headline.
function Kicker({ children, accent = 'green', style = {} }) {
  const color = ({
    green:   'var(--hh-green)',
    ecru:    'var(--hh-ecru-deep)',
    blue:    'var(--hh-blue-deep)',
    dogwood: 'var(--dogwood-deep)',
    mute:    'var(--paper-mute)',
  })[accent] || 'var(--hh-green)';
  return (
    <div style={{
      fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 500,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color, ...style,
    }}>{children}</div>
  );
}
// Eyebrow alias for older callers — collapse onto Kicker
function Eyebrow({ children, ember, tone, style = {} }) {
  const accent = ember ? 'ecru'
    : tone === 'ember' ? 'ecru'
    : tone === 'bloom' || tone === 'dew' ? 'blue'
    : tone === 'rose' || tone === 'dogwood' ? 'dogwood'
    : tone === 'wisteria' || tone === 'meadow' || tone === 'fern' || tone === 'sig' ? 'green'
    : 'green';
  return <Kicker accent={accent} style={style}>{children}</Kicker>;
}

// Headline — generous serif, italic optional, tight leading.
function Headline({ children, size = 'display', italic = false, style = {} }) {
  const sizes = {
    display:  { fontSize: 38, lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 340 },
    title:    { fontSize: 26, lineHeight: 1.08, letterSpacing: '-0.01em', fontWeight: 360 },
    section:  { fontSize: 20, lineHeight: 1.15, letterSpacing: '-0.005em', fontWeight: 400 },
  };
  return (
    <h1 className="serif" style={{
      margin: 0, fontFamily: 'var(--serif)', color: 'var(--hh-green)',
      fontStyle: italic ? 'italic' : 'normal',
      ...sizes[size], ...style,
    }}>{children}</h1>
  );
}

// Hairline rule. No center glyph by default — Aesop never decorates.
function Rule({ glyph, style = {} }) {
  if (!glyph) return <hr style={{
    border: 0, height: 1, background: 'rgba(31, 64, 69, 0.18)',
    margin: 0, ...style,
  }}/>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--paper-mute)', ...style }}>
      <hr style={{ flex: 1, border: 0, height: 1, background: 'rgba(31, 64, 69, 0.18)' }}/>
      <span className="mono" style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{glyph}</span>
      <hr style={{ flex: 1, border: 0, height: 1, background: 'rgba(31, 64, 69, 0.18)' }}/>
    </div>
  );
}

// BackRow — small back link with chevron, sits at top of detail screens.
function BackRow({ go, label = 'Back', dest }) {
  return (
    <button onClick={() => go(dest)} style={{
      background: 'transparent', border: 0, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 0', fontFamily: 'var(--mono)',
      fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--paper-mute)',
    }}>
      <span style={{ fontSize: 14, lineHeight: 1, transform: 'translateY(-1px)' }}>‹</span>
      {label}
    </button>
  );
}

// Color block — a section that takes one full palette swatch.
// Bleeds to the device edges if `bleed`. Ink color flips when
// the block is dark (Midnight Green).
function ColorBlock({ accent = 'isabel', children, bleed = false, padded = true, style = {} }) {
  const map = {
    isabel:  { bg: 'var(--hh-isabel)',  ink: 'var(--hh-green)' },
    ecru:    { bg: 'var(--hh-ecru)',    ink: 'var(--hh-green)' },
    blue:    { bg: 'var(--hh-blue)',    ink: 'var(--hh-green)' },
    dogwood: { bg: 'var(--hh-dogwood)', ink: 'var(--hh-green)' },
    green:   { bg: 'var(--hh-green)',   ink: 'var(--hh-lace)' },
    lace:    { bg: 'var(--hh-lace)',    ink: 'var(--hh-green)' },
  };
  const { bg, ink } = map[accent] || map.isabel;
  return (
    <section style={{
      background: bg, color: ink,
      marginLeft: bleed ? -22 : 0, marginRight: bleed ? -22 : 0,
      padding: padded ? '40px 28px' : 0,
      ...style,
    }}>{children}</section>
  );
}

// Hearth wordmark — set in Fraunces, no flame dot.
// Used in topbar and onboarding.
function HearthMarkSmall({ size = 14, color = 'var(--hh-green)' }) {
  return (
    <span className="serif" style={{
      fontSize: size, fontStyle: 'italic', fontWeight: 400, color,
      letterSpacing: '-0.01em', display: 'inline-block', lineHeight: 1,
    }}>h.</span>
  );
}

// Topbar — minimalist. Title centered, two icon slots.
function HearthTopbar({ title, leading, trailing }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 22px 8px',
    }}>
      <div style={{ width: 32 }}>{leading}</div>
      <div className="serif" style={{
        fontSize: 17, fontWeight: 400, color: 'var(--hh-green)',
        letterSpacing: '0.04em',
      }}>{title}</div>
      <div style={{ width: 32, display: 'flex', justifyContent: 'flex-end' }}>{trailing}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Legacy stubs — render NOTHING. Old screens still call these
// but the editorial direction has dropped the metaphor entirely.
// ─────────────────────────────────────────────────────────────
function LeafMark() { return null; }
function LeafScatter() { return null; }
function Sprig() { return null; }
const FlowerMark = LeafMark;
const PetalScatter = LeafScatter;
const FlowerGarden = Sprig;
const GrassSprig = LeafMark;

Object.assign(window, {
  Icon, HearthMarkSmall, HearthTopbar,
  Photo, Ph, Kicker, Eyebrow, Headline, Rule, ColorBlock,
  LeafMark, LeafScatter, Sprig,
  FlowerMark, GrassSprig, PetalScatter, FlowerGarden,
});
