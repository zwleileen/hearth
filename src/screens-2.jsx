// Hearth — Discover, Attune, Rituals (editorial rebuild)
// Aesop / Frama register. Old Lace + Midnight Green carry every
// screen. Ecru / Carolina Blue / Pale Dogwood used as full
// color blocks for ownership of a single section, never as
// gradients or chrome decoration.

import React from 'react';
import { BackRow, ColorBlock, Headline, Icon, Kicker, Ph, Photo, Rule } from './atoms.jsx';
import { HEARTH_DATA } from './data.js';
import { api } from './api.js';

const { useState: useState2 } = React;

// ─────────────────────────────────────────────────────────────
// DISCOVER — long-scroll editorial issue
// Cover → masthead → feature → two field reports → shelf → letter
// ─────────────────────────────────────────────────────────────
function DiscoverScreen({ go }) {
  const M = HEARTH_DATA.magazine;
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* ── Masthead ─────────────────────────────── */}
      <section style={{ padding: '14px 22px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Kicker>The reading room · Fortnightly</Kicker>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
            № 14
          </span>
        </div>
      </section>

      {/* ── Cover ────────────────────────────────── */}
      <section style={{ padding: '28px 22px 0' }}>
        <Headline size="display" italic>
          Builders of<br/>warmer worlds.
        </Headline>
        <p className="body" style={{ margin: '18px 0 22px', maxWidth: 320 }}>
          {M.cover.dek}
        </p>
        <Photo accent="dogwood" h={300} caption={M.cover.caption}/>
        <p className="mono" style={{
          marginTop: 22, fontSize: 9.5, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--paper-mute)',
        }}>
          {M.date} · Five conversations
        </p>
      </section>

      {/* ── Index of stories ──────────────────────── */}
      <section style={{ padding: '40px 22px 0' }}>
        <Rule/>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 9.5, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--paper-mute)',
          padding: '14px 0 6px', fontWeight: 500,
        }}>In this issue</div>
        {M.stories.slice(0, 5).map((s, i) => (
          <button key={i} onClick={() => go('article', s)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: 'transparent', border: 0, padding: '14px 0',
            borderTop: '1px solid rgba(31, 64, 69, 0.10)',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span className="mono" style={{
                fontSize: 11, color: 'var(--hh-green)',
                letterSpacing: '0.06em', minWidth: 28,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{ flex: 1 }}>
                <div className="serif" style={{
                  fontSize: 17, fontWeight: 400, color: 'var(--hh-green)',
                  fontStyle: 'italic', lineHeight: 1.2,
                }}>{s.title}</div>
                <div style={{
                  fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--hh-green-3)',
                  marginTop: 4, fontWeight: 380,
                }}>{s.author}</div>
              </div>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--paper-mute)' }}>
                {s.readTime}
              </span>
            </div>
          </button>
        ))}
        <Rule/>
      </section>

      {/* ── Feature 01 (full bleed photo) ─────────── */}
      <section style={{ padding: '50px 22px 0' }}>
        <Kicker>{M.stories[0].kicker}</Kicker>
        <Headline size="title" italic style={{ marginTop: 14 }}>
          {M.stories[0].title}.
        </Headline>
        <p className="serif" style={{
          margin: '8px 0 18px', fontSize: 14, fontStyle: 'italic',
          color: 'var(--hh-green-3)', fontWeight: 380,
        }}>{M.stories[0].author}</p>
        <Photo accent="ecru" h={240}/>
        <p className="body" style={{ margin: '18px 0 14px' }}>{M.stories[0].dek}</p>
        <button onClick={() => go('article', M.stories[0])} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 14,
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hh-green)',
        }}>
          <span>Read</span><span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </section>

      {/* ── Color block: feature 02 (Carolina Blue) ─ */}
      <ColorBlock accent="blue" style={{ marginTop: 50 }}>
        <Kicker accent="green">{M.stories[1].kicker}</Kicker>
        <Headline size="title" italic style={{ marginTop: 14 }}>
          {M.stories[1].title}.
        </Headline>
        <p className="serif" style={{
          margin: '8px 0 18px', fontSize: 14, fontStyle: 'italic',
          color: 'var(--hh-green-3)', fontWeight: 380,
        }}>{M.stories[1].author}</p>
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 14.5, lineHeight: 1.55,
          fontWeight: 380, color: 'var(--hh-green)', margin: '0 0 22px', maxWidth: 340,
        }}>{M.stories[1].dek}</p>
        <button onClick={() => go('article', M.stories[1])} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 14,
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hh-green)',
        }}>
          <span>Read · {M.stories[1].readTime}</span>
          <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </ColorBlock>

      {/* ── Field notes ──────────────────────────── */}
      <section style={{ padding: '50px 22px 0' }}>
        <Kicker>Field notes</Kicker>
        <Headline size="title" italic style={{ marginTop: 14 }}>
          {M.stories[3].title}.
        </Headline>
        <p className="serif" style={{
          margin: '8px 0 18px', fontSize: 14, fontStyle: 'italic',
          color: 'var(--hh-green-3)', fontWeight: 380,
        }}>{M.stories[3].author}</p>
        <Photo accent="isabel" h={200}/>
        <p className="body" style={{ marginTop: 18 }}>{M.stories[3].dek}</p>
      </section>

      {/* ── Reading list (essay) ─────────────────── */}
      <section style={{ padding: '50px 22px 0' }}>
        <Rule/>
        <Kicker style={{ marginTop: 22 }}>{M.stories[2].kicker}</Kicker>
        <Headline size="title" italic style={{ marginTop: 14 }}>
          {M.stories[2].title}.
        </Headline>
        <p className="body" style={{ margin: '14px 0 22px' }}>{M.stories[2].dek}</p>
        <div>
          {M.shelf.map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '14px 0',
              borderBottom: i === M.shelf.length - 1 ? 0 : '1px solid rgba(31, 64, 69, 0.10)',
            }}>
              <span className="serif" style={{
                fontSize: 17, fontStyle: 'italic', fontWeight: 400, color: 'var(--hh-green)',
              }}>{s.name}</span>
              <span className="mono" style={{
                fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'var(--paper-mute)',
              }}>{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Editor's letter ──────────────────────── */}
      <ColorBlock accent="green" style={{ marginTop: 50 }}>
        <Kicker accent="mute" style={{ color: 'rgba(249,244,230,0.6)' }}>
          {M.stories[4].kicker} · A note from the editor
        </Kicker>
        <Headline size="title" italic style={{ marginTop: 14, color: 'var(--hh-lace)' }}>
          {M.stories[4].title}.
        </Headline>
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 14.5, lineHeight: 1.6,
          fontWeight: 380, color: 'rgba(249,244,230,0.85)',
          margin: '18px 0 0', maxWidth: 340,
        }}>{M.stories[4].dek}</p>
        <p className="mono" style={{
          marginTop: 28, fontSize: 9.5, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'rgba(249,244,230,0.5)',
        }}>, End of issue 14</p>
      </ColorBlock>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ATTUNE — quiet input → reading
// Editorial: full-page question, large textarea, seed phrases as
// a flat list. Reading screen uses Pale Dogwood color block for
// the songs section. Poems section follows on the cream paper.
// Books moved to the home reading room (DiscoverScreen) so the
// bench here stays focused on what fits an in-the-moment mood:
// listen now, read in a sitting. Long-form lives upstairs.
// ─────────────────────────────────────────────────────────────
function AttuneScreen({ go }) {
  const D = HEARTH_DATA;
  const [text, setText] = useState2('');
  const [reading, setReading] = useState2(null);
  const [busy, setBusy] = useState2(false);
  const [error, setError] = useState2(null);
  const [saved, setSaved] = React.useState({}); // saveKey -> true
  const [expandedPoems, setExpandedPoems] = React.useState({}); // saveKey -> bool

  async function generateReading() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.attune.recommend(text.trim());
      setReading(data);
      setSaved({});
    } catch (err) {
      if (err.status === 401) {
        setError({ kind: 'unauthed' });
      } else if (err.status === 503) {
        setError({ kind: 'unconfigured', detail: err.data?.detail });
      } else {
        setError({ kind: 'other', detail: err.data?.error || err.message });
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveItem(kind, item, key) {
    if (saved[key]) return;
    try {
      await api.bookmarks.create({
        kind,
        title: item.title,
        source: item.artist || item.author || item.poet || '',
        excerpt: item.why || '',
        meta: { savedFrom: 'attune' },
      });
      setSaved(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      if (err.status === 409) {
        setSaved(prev => ({ ...prev, [key]: true }));
      }
    }
  }

  // ── Reading view ───────────────────────────────
  if (reading) {
    return (
      <div className="fade-in" style={{ paddingBottom: 32 }}>
        {/* breadcrumb */}
        <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { setReading(null); setText(''); }} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            {Icon.back(18, 'currentColor')}<span>Try again</span>
          </button>
          <span className="mono" style={{
            fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)',
            textTransform: 'uppercase',
          }}>A reading</span>
        </section>

        {/* Mood summary + register */}
        <section style={{ padding: '36px 22px 0' }}>
          <Kicker>What I'm hearing</Kicker>
          <p className="serif" style={{
            margin: '14px 0 0',
            fontSize: 22, lineHeight: 1.4, fontWeight: 360, fontStyle: 'italic',
            color: 'var(--hh-green)', maxWidth: 540,
          }}>
            {reading.moodSummary}
          </p>
          {reading.register && (
            <div className="mono" style={{
              marginTop: 18,
              fontSize: 9.5,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--paper-mute)',
            }}>
              Register · {reading.register}
            </div>
          )}
        </section>

        {/* Songs, Pale Dogwood block */}
        <ColorBlock accent="dogwood" style={{ marginTop: 40 }}>
          <Kicker>Songs · for your ears</Kicker>
          <div style={{ marginTop: 18 }}>
            {(reading.songs || []).map((s, i) => {
              const key = `song-${i}-${s.title}`;
              const isSaved = saved[key];
              return (
                <div key={key} style={{
                  paddingTop: i === 0 ? 0 : 22,
                  paddingBottom: 22,
                  borderBottom: i < (reading.songs.length - 1) ? '1px solid rgba(31, 64, 69, 0.18)' : 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <button onClick={() => saveItem('song', s, key)} disabled={isSaved}
                      className="hearth-save-btn" data-saved={isSaved}>
                      {Icon.bookmark(12, 'currentColor')}
                      <span>{isSaved ? 'Saved to Nook' : 'Save'}</span>
                    </button>
                  </div>
                  <Headline size="section" italic style={{ marginTop: 6, fontWeight: 380 }}>
                    {s.title}
                  </Headline>
                  <p className="serif" style={{
                    margin: '4px 0 10px', fontSize: 14, fontStyle: 'italic',
                    color: 'var(--hh-green-3)', fontWeight: 380,
                  }}>{s.artist}</p>
                  <p className="body" style={{ margin: 0, maxWidth: 540 }}>{s.why}</p>
                </div>
              );
            })}
          </div>
        </ColorBlock>

        {/* Poems · text inline when public-domain & known verbatim,
            otherwise a "Read at <source>" link out. The expand state
            is per-card so multiple poems can be open simultaneously. */}
        <section style={{ padding: '40px 22px 0' }}>
          <Kicker>Poems · for the page</Kicker>
          <div style={{ marginTop: 18 }}>
            {(reading.poems || []).map((p, i) => {
              const key = `poem-${i}-${p.title}`;
              const isSaved = saved[key];
              const hasText = typeof p.text === 'string' && p.text.trim().length > 0;
              const hasUrl = typeof p.url === 'string' && p.url.trim().length > 0;
              const isExpanded = expandedPoems[key];
              let sourceLabel = '';
              if (hasUrl) {
                try {
                  sourceLabel = new URL(p.url).hostname.replace(/^www\./, '');
                } catch { sourceLabel = 'source'; }
              }
              return (
                <div key={key} style={{
                  paddingTop: i === 0 ? 0 : 22,
                  paddingBottom: 22,
                  borderBottom: i < (reading.poems.length - 1) ? '1px solid var(--paper-line-2)' : 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <button onClick={() => saveItem('poem', p, key)} disabled={isSaved}
                      className="hearth-save-btn" data-saved={isSaved}>
                      {Icon.bookmark(12, 'currentColor')}
                      <span>{isSaved ? 'Saved to Nook' : 'Save'}</span>
                    </button>
                  </div>
                  <Headline size="section" italic style={{ marginTop: 6, fontWeight: 380 }}>
                    {p.title}
                  </Headline>
                  <p className="serif" style={{
                    margin: '4px 0 10px', fontSize: 14, fontStyle: 'italic',
                    color: 'var(--hh-green-3)', fontWeight: 380,
                  }}>{p.poet}</p>
                  <p className="body" style={{ margin: '0 0 14px', maxWidth: 540 }}>{p.why}</p>

                  {hasText && (
                    <>
                      <button onClick={() => setExpandedPoems(prev => ({ ...prev, [key]: !prev[key] }))}
                        style={{
                          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                          color: 'var(--ember)', fontFamily: 'var(--sans)', fontSize: 11,
                          fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
                        }}>
                        {isExpanded ? 'Close poem' : 'Read poem'}
                      </button>
                      {isExpanded && (
                        <pre className="serif" style={{
                          marginTop: 14, marginBottom: 0,
                          fontSize: 16, lineHeight: 1.7, fontStyle: 'italic',
                          fontWeight: 380, color: 'var(--hh-green)',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          fontFamily: 'inherit', maxWidth: 560,
                          padding: '14px 0 4px', borderTop: '1px solid var(--paper-line-2)',
                        }}>{p.text}</pre>
                      )}
                    </>
                  )}
                  {!hasText && hasUrl && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-block', color: 'var(--ember)',
                        fontFamily: 'var(--sans)', fontSize: 11,
                        fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
                        textDecoration: 'none', borderBottom: '1px solid currentColor',
                        paddingBottom: 2,
                      }}>
                      Read at {sourceLabel} →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Closing */}
        <section style={{ padding: '40px 22px 0', textAlign: 'left' }}>
          <Rule/>
          <p className="serif" style={{
            margin: '22px 0 0', fontSize: 16, fontStyle: 'italic',
            color: 'var(--hh-green-3)', lineHeight: 1.5, fontWeight: 350,
            maxWidth: 320,
          }}>
            Music and reading are not prescriptions.<br/>They're company.
          </p>
        </section>
      </div>
    );
  }

  // ── Loading view ──────────────────────────────
  if (busy) {
    return (
      <div className="fade-in" style={{ paddingBottom: 32 }}>
        <section style={{ padding: '14px 22px 0' }}>
          <Kicker>Attune</Kicker>
          <Headline size="display" italic style={{ marginTop: 14 }}>
            Reading you,<br/>now.
          </Headline>
          <p className="body" style={{ margin: '18px 0 28px', maxWidth: 380 }}>
            One quiet moment. Choosing what fits.
          </p>
          <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.4, marginTop: 18, width: '70%' }}/>
          <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '50%' }}/>
          <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '85%' }}/>
        </section>
      </div>
    );
  }

  // ── Input view ────────────────────────────────
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <section style={{ padding: '14px 22px 0' }}>
        <Kicker>Attune</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          How are you,<br/><span style={{ fontStyle: 'italic' }}>really?</span>
        </Headline>
        <p className="body" style={{ margin: '18px 0 28px', maxWidth: 380 }}>
          Tell me in a sentence. I'll find three songs and three poems shaped to where you are. Chosen on what the research says actually helps.
        </p>

        <textarea
          className="hearth-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="I feel…"
          style={{ minHeight: 140, background: 'var(--hh-isabel)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '18px 18px' }}
        />

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
          {text.trim().length < 6 ? (
            <button disabled
              style={{
                background: 'transparent', color: 'var(--paper-mute)',
                border: '1px solid rgba(31, 64, 69, 0.18)',
                padding: '14px 22px', cursor: 'not-allowed',
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>Type a sentence</button>
          ) : (
            <button onClick={generateReading}
              style={{
                background: 'var(--hh-green)', color: 'var(--hh-lace)',
                border: 0, padding: '14px 22px', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                display: 'inline-flex', alignItems: 'center', gap: 14,
              }}>
              <span>Read me</span>
              <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 22, padding: 16, background: 'var(--hh-isabel)', borderLeft: '2px solid var(--ember)' }}>
            {error.kind === 'unauthed' && (
              <p className="body" style={{ margin: 0 }}>
                <span onClick={() => go('auth')} style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--ember)' }}>Sign in</span> to use Attune.
              </p>
            )}
            {error.kind === 'unconfigured' && (
              <p className="body" style={{ margin: 0 }}>
                Attune needs an OpenAI key configured on the server.
              </p>
            )}
            {error.kind === 'other' && (
              <p className="body" style={{ margin: 0 }}>
                {error.detail || 'Something went wrong. Try again.'}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Seed phrases */}
      <section style={{ padding: '50px 22px 0' }}>
        <Rule/>
        <Kicker style={{ marginTop: 22 }}>Or borrow a phrase</Kicker>
        <div style={{ marginTop: 14 }}>
          {D.attuneSeeds.map((s, i) => (
            <button key={i} onClick={() => setText(s)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'transparent', border: 0,
              borderBottom: '1px solid rgba(31, 64, 69, 0.10)',
              padding: '18px 0', cursor: 'pointer',
            }}>
              <span className="mono" style={{
                fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)',
                textTransform: 'uppercase', marginRight: 12,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="serif" style={{
                fontSize: 16, fontStyle: 'italic', fontWeight: 400, color: 'var(--hh-green)',
              }}>{s}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// RITUALS — index + five practices
// Editorial: numbered list, hairline rules, no left-bar accents.
// ─────────────────────────────────────────────────────────────
function RitualsScreen({ go }) {
  const D = HEARTH_DATA;
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <section style={{ padding: '14px 22px 0' }}>
        <Kicker>Rituals · Five practices</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          Small practices,<br/><span style={{ fontStyle: 'italic' }}>kept gently.</span>
        </Headline>
        <p className="body" style={{ margin: '18px 0 0', maxWidth: 340 }}>
          Five short rituals, each grounded in evidence. None take long. The goal is repetition, not perfection.
        </p>
      </section>

      <section style={{ padding: '38px 22px 0' }}>
        <Rule/>
        {D.rituals.map((r, i) => (
          <button key={r.key} onClick={() => go('ritual-detail', { ritual: r })}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'transparent', border: 0,
              borderBottom: '1px solid rgba(31, 64, 69, 0.14)',
              padding: '26px 0', cursor: 'pointer',
            }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div className="mono" style={{
                fontSize: 11, fontWeight: 500, color: 'var(--hh-green)',
                letterSpacing: '0.06em', minWidth: 32, paddingTop: 6,
              }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <Headline size="section" italic style={{ fontWeight: 380, flex: 1, minWidth: 0 }}>{r.name}.</Headline>
                  <span className="mono" style={{
                    fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--paper-mute)',
                    textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>{r.duration}</span>
                </div>
                <p className="body" style={{ margin: '14px 0 14px' }}>{r.blurb}</p>
                <Kicker accent="mute" style={{ fontSize: 9.5 }}>
                  {r.lineage} · {r.pattern}
                </Kicker>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* Weekly review entry, quiet card */}
      <section style={{ padding: '34px 22px 0' }}>
        <button onClick={() => go('weekly-digest')} style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: 'var(--hh-isabel)', border: 0, padding: '24px 22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Kicker accent="green" style={{ fontSize: 9.5 }}>Sunday · Week 48</Kicker>
            <Headline size="section" italic style={{ marginTop: 8, fontSize: 22 }}>
              The weekly review is ready.
            </Headline>
            <p className="body" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
              Five evenings, three goods, one phrase that came twice.
            </p>
          </div>
          {Icon.arrow(16, 'var(--hh-green)')}
        </button>
      </section>

      {/* Build your own, new */}
      <section style={{ padding: '20px 22px 0' }}>
        <button onClick={() => go('ritual-builder')} style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(31, 64, 69, 0.22)',
          padding: '22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Kicker accent="mute" style={{ fontSize: 9.5 }}>Yours · A ritual of your own</Kicker>
            <Headline size="section" italic style={{ marginTop: 8, fontSize: 22 }}>
              Build a small practice.
            </Headline>
            <p className="body" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
              Pick a moment, a length, and one prompt. Three choices is the whole thing.
            </p>
          </div>
          <span style={{ fontSize: 18, color: 'var(--hh-green)' }}>+</span>
        </button>
      </section>
    </div>
  );
}

function RitualBuilderScreen({ go }) {
  const [name, setName] = useState2('Evening shutdown');
  const [moment, setMoment] = useState2('evening');
  const [length, setLength] = useState2(5);
  const [prompt, setPrompt] = useState2('What can rest tonight?');
  const [days, setDays] = useState2(['M','T','W','Th','F']);
  const [saved, setSaved] = useState2(false);

  const allDays = ['M','T','W','Th','F','Sa','Su'];
  const moments = [
    { v: 'morning',   l: 'On waking',     hint: 'before the inbox' },
    { v: 'midday',    l: 'Midday pause',  hint: 'between meetings' },
    { v: 'evening',   l: 'After work',    hint: 'before dinner' },
    { v: 'night',     l: 'Before sleep',  hint: 'phone in another room' },
  ];
  const lengths = [2, 4, 5, 8, 12];
  const promptIdeas = [
    'What can rest tonight?',
    'Three small goods today.',
    'What was alive in me today?',
    'Where did I meet myself with kindness?',
    'What is one move toward, not away?',
  ];

  function toggleDay(d) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  if (saved) {
    return (
      <div className="fade-in" style={{ padding: '60px 28px 32px', textAlign: 'center' }}>
        <Kicker>Kept</Kicker>
        <Headline size="display" italic style={{ marginTop: 14 }}>
          Saved.
        </Headline>
        <p className="body" style={{ margin: '18px auto 0', maxWidth: 280 }}>
          <span className="serif" style={{ fontStyle: 'italic' }}>{name}.</span> {length} minutes, {days.length === 7 ? 'every day' : days.join(' · ')}, {moments.find(m => m.v === moment)?.l.toLowerCase()}.
        </p>
        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => go('rituals')} style={{
            padding: '16px 20px', background: 'var(--hh-green)', color: 'var(--hh-lace)',
            border: 0, cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>Back to rituals</button>
          <button onClick={() => { setSaved(false); }} style={{
            padding: '14px 20px', background: 'transparent', color: 'var(--hh-green)',
            border: '1px solid rgba(31, 64, 69, 0.22)', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>Edit again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <section style={{ padding: '4px 22px 0' }}>
        <BackRow go={go} label="Rituals" dest="rituals"/>
      </section>

      <section style={{ padding: '20px 22px 0' }}>
        <Kicker>A ritual of your own</Kicker>
        <Headline size="display" italic style={{ marginTop: 14 }}>
          Three<br/>small choices.
        </Headline>
        <p className="body" style={{ margin: '18px 0 0', maxWidth: 320 }}>
          When, how long, and one prompt to begin. Add days if you like a rhythm.
        </p>
      </section>

      {/* Name */}
      <section style={{ padding: '36px 22px 0' }}>
        <Rule/>
        <div style={{ paddingTop: 22 }}>
          <Kicker accent="mute">01 · Call it something</Kicker>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="A short name" maxLength={40}
            style={{
              width: '100%', marginTop: 14, padding: '8px 0',
              background: 'transparent', border: 0,
              borderBottom: '1px solid rgba(31, 64, 69, 0.28)',
              fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 350, fontStyle: 'italic',
              color: 'var(--hh-green)', outline: 'none', letterSpacing: '-0.01em',
            }}
          />
        </div>
      </section>

      {/* Moment */}
      <section style={{ padding: '36px 22px 0' }}>
        <Rule/>
        <div style={{ paddingTop: 22 }}>
          <Kicker accent="mute">02 · When does it want to live</Kicker>
          <div style={{ marginTop: 14 }}>
            {moments.map((m, i) => (
              <button key={m.v} onClick={() => setMoment(m.v)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                width: '100%', textAlign: 'left', cursor: 'pointer',
                background: 'transparent', border: 0,
                borderBottom: i < moments.length - 1 ? '1px solid rgba(31, 64, 69, 0.10)' : 0,
                padding: '16px 0', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flex: 1 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '1px solid var(--hh-green)',
                    background: moment === m.v ? 'var(--hh-green)' : 'transparent',
                    flexShrink: 0, transform: 'translateY(2px)',
                  }}/>
                  <span className="serif" style={{
                    fontSize: 18, fontWeight: 380,
                    fontStyle: moment === m.v ? 'italic' : 'normal',
                    color: 'var(--hh-green)',
                  }}>{m.l}</span>
                </div>
                <span className="mono" style={{
                  fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--paper-mute)',
                }}>{m.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Length */}
      <section style={{ padding: '36px 22px 0' }}>
        <Rule/>
        <div style={{ paddingTop: 22 }}>
          <Kicker accent="mute">03 · How long</Kicker>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            {lengths.map(l => (
              <button key={l} onClick={() => setLength(l)} style={{
                flex: 1, padding: '14px 0', cursor: 'pointer',
                background: length === l ? 'var(--hh-green)' : 'transparent',
                color: length === l ? 'var(--hh-lace)' : 'var(--hh-green)',
                border: '1px solid var(--hh-green)',
                fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 350,
                letterSpacing: '-0.01em',
              }}>{l}<span style={{ fontSize: 11, opacity: 0.7, marginLeft: 2 }}>m</span></button>
            ))}
          </div>
        </div>
      </section>

      {/* Days */}
      <section style={{ padding: '36px 22px 0' }}>
        <Rule/>
        <div style={{ paddingTop: 22 }}>
          <Kicker accent="mute">04 · Which days</Kicker>
          <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
            {allDays.map(d => {
              const on = days.includes(d);
              return (
                <button key={d} onClick={() => toggleDay(d)} style={{
                  flex: 1, padding: '12px 0', cursor: 'pointer',
                  background: on ? 'var(--hh-green)' : 'transparent',
                  color: on ? 'var(--hh-lace)' : 'var(--hh-green)',
                  border: `1px solid ${on ? 'var(--hh-green)' : 'rgba(31, 64, 69, 0.22)'}`,
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.06em',
                }}>{d}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={() => setDays(['M','T','W','Th','F'])} className="mono" style={{
              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
              fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--paper-mute)',
            }}>Weekdays</button>
            <span className="mono" style={{ color: 'var(--paper-faint)', fontSize: 9.5 }}>·</span>
            <button onClick={() => setDays(['Sa','Su'])} className="mono" style={{
              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
              fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--paper-mute)',
            }}>Weekend</button>
            <span className="mono" style={{ color: 'var(--paper-faint)', fontSize: 9.5 }}>·</span>
            <button onClick={() => setDays(allDays)} className="mono" style={{
              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
              fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--paper-mute)',
            }}>Every day</button>
          </div>
        </div>
      </section>

      {/* Prompt */}
      <section style={{ padding: '36px 22px 0' }}>
        <Rule/>
        <div style={{ paddingTop: 22 }}>
          <Kicker accent="mute">05 · One prompt to begin</Kicker>
          <textarea
            value={prompt} onChange={e => setPrompt(e.target.value)}
            rows={2} maxLength={120}
            style={{
              width: '100%', marginTop: 14, padding: '12px 14px',
              background: 'var(--hh-isabel)', border: 0, borderRadius: 0,
              fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 380, fontStyle: 'italic',
              color: 'var(--hh-green)', outline: 'none', resize: 'none', lineHeight: 1.4,
            }}
          />
          <div className="mono" style={{
            marginTop: 16, fontSize: 9.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--paper-mute)',
          }}>Or borrow:</div>
          <div style={{ marginTop: 10 }}>
            {promptIdeas.map((p, i) => (
              <button key={i} onClick={() => setPrompt(p)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 0', background: 'transparent', border: 0, cursor: 'pointer',
                borderBottom: i < promptIdeas.length - 1 ? '1px solid rgba(31, 64, 69, 0.08)' : 0,
                fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 380, fontStyle: 'italic',
                color: 'var(--paper-2)',
              }}>{p}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Save */}
      <section style={{ padding: '40px 22px 0' }}>
        <button onClick={() => setSaved(true)} disabled={!name || !prompt || days.length === 0}
          style={{
            width: '100%', padding: '16px 20px',
            background: !name || !prompt || days.length === 0 ? 'rgba(31, 64, 69, 0.18)' : 'var(--hh-green)',
            color: !name || !prompt || days.length === 0 ? 'var(--paper-mute)' : 'var(--hh-lace)',
            border: 0, cursor: !name || !prompt || days.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
          Keep this ritual
        </button>
        <p className="body" style={{
          margin: '14px 0 0', textAlign: 'center', fontSize: 12,
          color: 'var(--paper-mute)',
        }}>
          You can change it anytime. Or stop. The point is to be tended, not measured.
        </p>
      </section>
    </div>
  );
}


function RitualDetailScreen({ go, payload }) {
  const r = payload?.ritual || HEARTH_DATA.rituals[0];
  if (r.key === 'breath')    return <BreathRitual go={go}/>;
  if (r.key === 'gratitude') return <GratitudeRitual go={go}/>;
  if (r.key === 'awe')       return <AweRitual go={go}/>;
  if (r.key === 'values')    return <ValuesRitual go={go}/>;
  if (r.key === 'shutdown')  return <ShutdownRitual go={go}/>;
  return null;
}

function RitualHeader({ go, kicker, title, body }) {
  return (
    <>
      <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => go('rituals')} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          {Icon.back(18, 'currentColor')}<span>Rituals</span>
        </button>
      </section>
      <section style={{ padding: '28px 22px 0' }}>
        <Kicker>{kicker}</Kicker>
        <Headline size="display" italic style={{ marginTop: 14 }}>
          {title}
        </Headline>
        {body && <p className="body" style={{ margin: '18px 0 0', maxWidth: 340 }}>{body}</p>}
      </section>
    </>
  );
}

function BreathRitual({ go }) {
  const [phase, setPhase] = useState2('in');
  React.useEffect(() => {
    const seq = ['in', 'hold1', 'out', 'hold2'];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % 4; setPhase(seq[i]); }, 4000);
    return () => clearInterval(id);
  }, []);
  const label = phase === 'in' ? 'Breathe in' : phase === 'out' ? 'Breathe out' : 'Hold';
  const scale = phase === 'in' ? 1 : phase === 'out' ? 0.55 : (phase === 'hold1' ? 1 : 0.55);

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go}
        kicker="01 · Box breathing · 4·4·4·4"
        title={<>Match the orb.<br/>It holds the count.</>}
      />
      <ColorBlock accent="blue" style={{ marginTop: 36, padding: '50px 22px', textAlign: 'center' }}>
        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 220, height: 220, borderRadius: '50%',
            background: 'var(--hh-green)',
            transform: `scale(${scale})`,
            transition: 'transform 4s ease-in-out',
          }}/>
        </div>
        <Headline size="title" italic style={{ marginTop: 28 }}>
          {label}.
        </Headline>
        <p className="mono" style={{
          marginTop: 14, fontSize: 9.5, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--hh-green-3)',
        }}>Cycle 02 of 06</p>
      </ColorBlock>
      <section style={{ padding: '36px 22px 0' }}>
        <p className="body" style={{ margin: 0, maxWidth: 320 }}>
          Equal-ratio breathing increases heart-rate variability and dampens the stress response within four minutes.
        </p>
        <button onClick={() => go('rituals')} style={{
          marginTop: 30,
          background: 'transparent', border: '1px solid var(--hh-green)',
          color: 'var(--hh-green)', padding: '13px 22px', cursor: 'pointer',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>End softly</button>
      </section>
    </div>
  );
}

function GratitudeRitual({ go }) {
  const [items, setItems] = useState2(['', '', '']);
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go}
        kicker="02 · Three good things · Seligman, 2005"
        title={<>Three small goods<br/>from today.</>}
        body="Name three. For each, why did it go well? What part did you play?"
      />
      <section style={{ padding: '36px 22px 0' }}>
        {items.map((v, i) => (
          <div key={i} style={{
            paddingTop: 22, paddingBottom: 22,
            borderBottom: i === 2 ? '1px solid rgba(31, 64, 69, 0.14)' : '1px solid rgba(31, 64, 69, 0.10)',
            borderTop: i === 0 ? '1px solid rgba(31, 64, 69, 0.14)' : 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span className="mono" style={{
                fontSize: 11, color: 'var(--hh-green)', letterSpacing: '0.06em',
                minWidth: 28, fontWeight: 500,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <textarea value={v}
                onChange={e => { const n = items.slice(); n[i] = e.target.value; setItems(n); }}
                placeholder={['the warmth of the kettle', 'a friend remembered', 'the quiet hour before dinner'][i]}
                style={{
                  flex: 1, background: 'transparent', border: 0, outline: 'none', resize: 'none',
                  fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
                  fontWeight: 380, color: 'var(--hh-green)', minHeight: 44, lineHeight: 1.45,
                }}/>
            </div>
          </div>
        ))}
        <button onClick={() => go('rituals')} style={{
          marginTop: 28,
          background: 'var(--hh-green)', color: 'var(--hh-lace)',
          border: 0, padding: '14px 22px', cursor: 'pointer',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 14,
        }}>
          <span>Keep these</span>
          <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </section>
    </div>
  );
}

function AweRitual({ go }) {
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go}
        kicker="03 · Awe walk · Sturm & Keltner, 2020"
        title={<>Fifteen minutes,<br/>looking outward.</>}
      />
      <section style={{ padding: '32px 22px 0' }}>
        <Photo accent="ecru" h={220} caption="ph · winter park, low light through trees"/>
        <p className="body" style={{ margin: '22px 0 0' }}>
          Walk somewhere familiar. Turn your attention away from yourself and toward the vast, the small, the unexpected. A peeling bark, a long sky, a stranger's kindness.
        </p>
      </section>
      <section style={{ padding: '36px 22px 0' }}>
        <Rule/>
        <Kicker style={{ marginTop: 22 }}>Three notices</Kicker>
        <div style={{ marginTop: 14 }}>
          {['One thing larger than you', 'One thing smaller than your hand', 'One thing you would not have seen yesterday'].map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '18px 0', alignItems: 'baseline',
              borderBottom: i === 2 ? 0 : '1px solid rgba(31, 64, 69, 0.10)',
            }}>
              <span className="mono" style={{
                fontSize: 11, color: 'var(--hh-green)', letterSpacing: '0.06em',
                minWidth: 28, fontWeight: 500,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="serif" style={{
                fontSize: 17, fontStyle: 'italic', fontWeight: 400, color: 'var(--hh-green)',
              }}>{s}</span>
            </div>
          ))}
        </div>
        <button style={{
          marginTop: 28,
          background: 'var(--hh-green)', color: 'var(--hh-lace)',
          border: 0, padding: '14px 22px', cursor: 'pointer',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 14,
        }}>
          <span>Begin walk</span>
          <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </section>
    </div>
  );
}

function ValuesRitual({ go }) {
  const D = HEARTH_DATA;
  const [picked, setPicked] = useState2(['Care', 'Craft', 'Wonder']);
  function toggle(v) {
    setPicked(p => p.includes(v) ? p.filter(x => x !== v) : (p.length < 5 ? [...p, v] : p));
  }
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go}
        kicker="04 · Values check-in · ACT · weekly"
        title={<>What's most alive<br/>this week?</>}
        body="Choose up to five. Not what you should care about, what you actually do."
      />
      <section style={{ padding: '32px 22px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {D.values.map(v => (
            <button key={v} onClick={() => toggle(v)} style={{
              background: picked.includes(v) ? 'var(--hh-green)' : 'transparent',
              color: picked.includes(v) ? 'var(--hh-lace)' : 'var(--hh-green)',
              border: '1px solid var(--hh-green)', borderRadius: 0,
              padding: '10px 16px', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>{v}</button>
          ))}
        </div>
      </section>
      <ColorBlock accent="ecru" style={{ marginTop: 36 }}>
        <Kicker>One small move</Kicker>
        <Headline size="title" italic style={{ marginTop: 14 }}>
          This week I will do one thing in service of <span style={{ fontStyle: 'normal', textDecoration: 'underline', textUnderlineOffset: 4 }}>{picked[0] || ', '}</span>.
        </Headline>
        <textarea placeholder="It will be small. It will be specific. It will be soon."
          style={{
            marginTop: 22, width: '100%',
            background: 'transparent', border: 0,
            borderBottom: '1px solid rgba(31, 64, 69, 0.30)',
            outline: 'none', resize: 'none',
            fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
            fontWeight: 380, color: 'var(--hh-green)',
            minHeight: 70, padding: '10px 0', lineHeight: 1.5,
          }}/>
      </ColorBlock>
    </div>
  );
}

function ShutdownRitual({ go }) {
  const D = HEARTH_DATA;
  const [done, setDone] = useState2([false, false, false, false, false]);
  const all = done.every(Boolean);
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go}
        kicker="05 · Shutdown · Newport · Deep Work"
        title={<>Close the day.<br/>Let it be closed.</>}
        body="A consistent end-of-day routine reduces work-rumination and improves sleep onset. Five small acts."
      />
      <section style={{ padding: '32px 22px 0' }}>
        <Rule/>
        {D.shutdownChecklist.map((t, i) => (
          <button key={i} onClick={() => { const n = done.slice(); n[i] = !n[i]; setDone(n); }}
            style={{
              width: '100%', textAlign: 'left',
              background: 'transparent', border: 0,
              padding: '20px 0',
              borderBottom: i === D.shutdownChecklist.length - 1 ? '1px solid rgba(31, 64, 69, 0.14)' : '1px solid rgba(31, 64, 69, 0.10)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
            <div style={{
              width: 22, height: 22, flexShrink: 0,
              border: '1px solid var(--hh-green)',
              background: done[i] ? 'var(--hh-green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {done[i] && Icon.check(14, 'var(--hh-lace)')}
            </div>
            <span className="serif" style={{
              fontSize: 17, fontStyle: 'italic', fontWeight: 400,
              color: done[i] ? 'var(--paper-mute)' : 'var(--hh-green)',
              textDecoration: done[i] ? 'line-through' : 'none',
            }}>{t}</span>
          </button>
        ))}
      </section>
      {all && (
        <ColorBlock accent="green" style={{ marginTop: 32, textAlign: 'center', padding: '50px 22px' }}>
          <Headline size="title" italic style={{ color: 'var(--hh-lace)' }}>
            The work day<br/>is complete.
          </Headline>
          <p style={{
            fontFamily: 'var(--sans)', fontSize: 14.5, lineHeight: 1.55, fontWeight: 380,
            color: 'rgba(249,244,230,0.8)', margin: '18px auto 0', maxWidth: 280,
          }}>Sleep well. Tomorrow has its own light.</p>
        </ColorBlock>
      )}
    </div>
  );
}

export { DiscoverScreen, AttuneScreen, RitualsScreen, RitualDetailScreen, RitualBuilderScreen };
