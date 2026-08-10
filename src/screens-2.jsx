// Hearth — Discover, Attune, Rituals (editorial rebuild)
// Aesop / Frama register. Old Lace + Midnight Green carry every
// screen. Ecru / Carolina Blue / Pale Dogwood used as full
// color blocks for ownership of a single section, never as
// gradients or chrome decoration.

import React from 'react';
import { BackRow, ColorBlock, Headline, Icon, Kicker, Ph, Photo, Rule } from './atoms.jsx';
import { HEARTH_DATA } from './data.js';
import { api, isItemBookmarked, bookmarkKindFor } from './api.js';
import { CareBlock } from './care.jsx';
import { SavourMoment, SavourOpener } from './savour.jsx';
import { ShareLink, SHARE_MESSAGE } from './share.jsx';
import { getListenService, setListenService, nextService, serviceLabel, listenUrl } from './listen.js';

const { useState: useState2 } = React;

// ─────────────────────────────────────────────────────────────
// DISCOVER — long-scroll editorial issue
// Cover → masthead → feature → two field reports → shelf → letter
// ─────────────────────────────────────────────────────────────
// DiscoverScreen was the first-generation reading room, kept alive only
// by the dev tweaks panel long after the routed version replaced it.
// Both are gone now; Receive opens on one thing instead.

function PreferenceRow({ label, value, onChange, options, style }) {
  return (
    <div style={style}>
      <div className="mono" style={{
        fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)',
        textTransform: 'uppercase', marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                background: active ? 'var(--hh-green)' : 'transparent',
                color: active ? 'var(--hh-lace)' : 'var(--hh-green)',
                border: '1px solid ' + (active ? 'var(--hh-green)' : 'rgba(31, 64, 69, 0.22)'),
                padding: '7px 14px',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                fontSize: 11,
                fontWeight: active ? 500 : 400,
                letterSpacing: '0.08em',
                transition: 'background 200ms ease, color 200ms ease, border-color 200ms ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Human-readable labels for the saved preferences shown on logbook
// rows + the past-reading view. Mirrors the option labels in
// PreferenceRow above but lives next to the place that renders them
// so both stay in sync at a glance.
const GENRE_LABEL = {
  any: 'Any genre',
  folk: 'Folk',
  classical: 'Classical',
  jazz: 'Jazz',
  soul: 'Soul & R&B',
  electronic: 'Electronic',
  indie: 'Indie',
  hiphop: 'Hip-hop',
  world: 'World',
};
const VOCALS_LABEL = {
  either: 'Either',
  with: 'With vocals',
  without: 'Instrumental',
};
// Reader-friendly: returns null when nothing was constrained, so the
// caller can skip rendering rather than print "Any genre · Either".
function formatPreferences(prefs) {
  if (!prefs) return null;
  const parts = [];
  if (prefs.genre && prefs.genre !== 'any') parts.push(GENRE_LABEL[prefs.genre] || prefs.genre);
  if (prefs.vocals && prefs.vocals !== 'either') parts.push(VOCALS_LABEL[prefs.vocals] || prefs.vocals);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function AttuneScreen({ go }) {
  const D = HEARTH_DATA;
  // View state machine: 'input' → user is typing or seed-picking;
  // 'reading' → the AI returned and we're rendering the response;
  // 'logbook' → user is browsing past entries; 'detail' → user is
  // looking at one past entry from the logbook.
  const [view, setView] = useState2('input');
  const [text, setText] = useState2('');
  const [reading, setReading] = useState2(null);
  const [busy, setBusy] = useState2(false);
  const [error, setError] = useState2(null);
  // Preferences: genre + vocals. Defaults to "no constraint" so the
  // model has full freedom unless the reader narrows the field. Reset
  // on "Try again" so each reading starts from a clean slate.
  const [genre, setGenre] = useState2('any');
  const [vocals, setVocals] = useState2('either');
  // Bookmarks list is the source of truth for "Saved" state, so the
  // button doesn't reset when the user navigates away and back. See
  // bookmarkKindFor / isItemBookmarked in api.js for the matcher.
  const [bookmarks, setBookmarks] = React.useState([]);
  const [expandedPoems, setExpandedPoems] = React.useState({});
  // Logbook state: loaded on demand when the user opens the logbook
  // view. The entries are reverse-chronological; moodSummary is what
  // the reader wanted preserved.
  const [logbook, setLogbook] = React.useState({ entries: [], hasMore: false, loading: false, error: null });
  // Where this reader listens. Held per device, never asked for twice.
  const [listen, setListen] = React.useState(() => getListenService());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { bookmarks: list } = await api.bookmarks.list();
        if (!cancelled) setBookmarks(list || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function openLogbook() {
    setView('logbook');
    if (logbook.entries.length > 0 || logbook.loading) return;
    setLogbook((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.attune.log({ limit: 30 });
      setLogbook({
        entries: data.entries || [],
        hasMore: !!data.hasMore,
        loading: false,
        error: null,
      });
    } catch (err) {
      setLogbook({
        entries: [],
        hasMore: false,
        loading: false,
        error: err.status === 401 ? 'Sign in to see your logbook.' : (err.data?.error || 'Could not load logbook.'),
      });
    }
  }

  async function loadMoreLog() {
    if (logbook.loading || !logbook.hasMore || logbook.entries.length === 0) return;
    const oldest = logbook.entries[logbook.entries.length - 1];
    setLogbook((s) => ({ ...s, loading: true }));
    try {
      const data = await api.attune.log({ limit: 30, before: oldest.createdAt });
      setLogbook((s) => ({
        entries: [...s.entries, ...(data.entries || [])],
        hasMore: !!data.hasMore,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setLogbook((s) => ({ ...s, loading: false, error: err.data?.error || 'Could not load more.' }));
    }
  }

  function openLogEntry(entry) {
    // Reuse the reading-view rendering for past entries. The reading
    // shape is the same JSON the model returns, so we just hand it to
    // setReading and flip the view.
    setReading({
      moodSummary: entry.moodSummary,
      register: entry.register,
      songs: entry.songs,
      excerpt: entry.excerpt,
      poems: entry.poems,
      _fromLogbook: true,
      _logbookMood: entry.mood,
      _logbookCreatedAt: entry.createdAt,
      _preferences: entry.preferences,
    });
    setView('reading');
  }

  // Removal is permanent, so it takes two taps. A confirm dialog would
  // be louder than anything else on the page; asking twice does the same
  // work quietly. Same pattern as the Carry logbook and the meaning log.
  const [pendingDelete, setPendingDelete] = React.useState(null);
  function confirmDelete(id) {
    if (pendingDelete === id) { setPendingDelete(null); deleteLogEntry(id); return; }
    setPendingDelete(id);
    setTimeout(() => setPendingDelete((cur) => (cur === id ? null : cur)), 4000);
  }

  async function deleteLogEntry(id) {
    try {
      await api.attune.deleteEntry(id);
      setLogbook((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
    } catch (err) {
      console.warn('Failed to delete log entry', err);
    }
  }

  async function generateReading() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.attune.recommend({ mood: text.trim(), genre, vocals });
      setReading({ ...data, _preferences: { genre, vocals } });
      setView('reading');
      // Invalidate cached logbook so the new entry shows next time the
      // user opens it. Cheap: just resets the loaded flag.
      setLogbook({ entries: [], hasMore: false, loading: false, error: null });
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

  async function saveItem(kind, item) {
    // Build a normalised item shape so the matcher and the create call
    // agree on author/source for songs (artist), poems (poet), books (author).
    const author = item.artist || item.author || item.poet || '';
    const probe = { kind, title: item.title, source: author, url: item.url || '' };
    if (isItemBookmarked(bookmarks, probe)) return;
    try {
      // For a book excerpt, keep the passage itself as the Nook excerpt
      // (the words are the point), and tuck the "why" into meta. Songs
      // and poems keep their short "why" as before.
      const isBookExcerpt = kind === 'book' && typeof item.text === 'string' && item.text.trim();
      const { bookmark } = await api.bookmarks.create({
        kind,
        title: item.title,
        source: author,
        url: item.url || '',
        excerpt: isBookExcerpt ? item.text.trim() : (item.why || ''),
        meta: { savedFrom: 'attune', ...(isBookExcerpt && item.why ? { note: item.why } : {}) },
      });
      if (bookmark) setBookmarks(prev => [bookmark, ...prev]);
    } catch (err) {
      if (err.status === 409) {
        try {
          const { bookmarks: latest } = await api.bookmarks.list();
          setBookmarks(latest || []);
        } catch {}
      }
    }
  }

  // ── Reading view ───────────────────────────────
  if (view === 'reading' && reading) {
    const fromLog = !!reading._fromLogbook;
    return (
      <div className="fade-in" style={{ paddingBottom: 32 }}>
        {/* breadcrumb */}
        <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => {
            // From the logbook: return to the logbook list.
            // From a fresh reading: return to the input view.
            if (fromLog) {
              setReading(null);
              setView('logbook');
            } else {
              setReading(null);
              setText('');
              setGenre('any');
              setVocals('either');
              setView('input');
            }
          }} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            {Icon.back(18, 'currentColor')}<span>{fromLog ? 'Logbook' : 'Try again'}</span>
          </button>
          <span className="mono" style={{
            fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)',
            textTransform: 'uppercase',
          }}>{fromLog ? 'A past reading' : 'A reading'}</span>
        </section>

        {/* When viewing a past reading, surface the original mood and date
            above the moodSummary so the reader sees what they typed and
            when. Keeps the logbook entries grounded in time. */}
        {fromLog && (
          <section style={{ padding: '24px 22px 0' }}>
            <div className="mono" style={{
              fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              {new Date(reading._logbookCreatedAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
              {formatPreferences(reading._preferences) && (
                <>
                  <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
                  {formatPreferences(reading._preferences)}
                </>
              )}
            </div>
            <p className="body" style={{ margin: 0, fontStyle: 'italic', color: 'var(--paper-mute)' }}>
              "{reading._logbookMood}"
            </p>
          </section>
        )}

        {/* Someone can put something very heavy into a box that only
            asked how they feel, and three songs are not the answer to
            it. Same block, same server signal, as Carry and the journal. */}
        {!fromLog && <CareBlock care={reading.care}/>}

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
              const isSaved = isItemBookmarked(bookmarks, { kind: 'song', title: s.title, source: s.artist });
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
                    <button onClick={() => saveItem('song', s)} disabled={isSaved}
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
                  {/* The reader's intent to hear this is never higher
                      than right here. It used to dead-end. */}
                  <div style={{ marginTop: 14, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                    {listenUrl(listen, s) && (
                      <a href={listenUrl(listen, s)} target="_blank" rel="noopener noreferrer"
                        style={{
                          color: 'var(--hh-green)', fontFamily: 'var(--mono)', fontSize: 9.5,
                          letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none',
                          borderBottom: '1px solid currentColor', paddingBottom: 2,
                        }}>
                        Listen on {serviceLabel(listen)} →
                      </a>
                    )}
                    <ShareLink
                      text={`${s.title} by ${s.artist}`}
                      url={listenUrl(listen, s)}
                      message={SHARE_MESSAGE.song}
                      label="Share"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* One tap to switch, so nobody is told which service Hearth
              assumes they use. */}
          <button
            onClick={() => { const n = nextService(listen); setListen(n); setListenService(n); }}
            style={{
              marginTop: 20, background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
              color: 'var(--hh-green)', opacity: 0.6, fontFamily: 'var(--mono)', fontSize: 9,
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
            Listening on {serviceLabel(listen)} · change
          </button>
        </ColorBlock>

        {/* Book excerpt · affective bibliotherapy. A short passage that
            meets the reader where this mood is, shown inline (it's brief),
            with a save to the Nook and a way to find the book. Hidden if
            the model returned nothing usable. */}
        {reading.excerpt && reading.excerpt.title && (() => {
          const ex = reading.excerpt;
          const isSaved = isItemBookmarked(bookmarks, { kind: 'book', title: ex.title, source: ex.author, url: ex.url });
          const hasText = typeof ex.text === 'string' && ex.text.trim().length > 0;
          const hasUrl = typeof ex.url === 'string' && ex.url.trim().length > 0;
          let sourceLabel = '';
          if (hasUrl) {
            try { sourceLabel = new URL(ex.url).hostname.replace(/^www\./, ''); }
            catch { sourceLabel = 'the book'; }
          }
          return (
            <section style={{ padding: '40px 22px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Kicker>A passage · to sit with</Kicker>
                <button onClick={() => saveItem('book', ex)} disabled={isSaved}
                  className="hearth-save-btn" data-saved={isSaved}>
                  {Icon.bookmark(12, 'currentColor')}
                  <span>{isSaved ? 'Saved to Nook' : 'Save'}</span>
                </button>
              </div>
              {hasText && (
                <pre className="serif" style={{
                  margin: '18px 0 0', fontSize: 18, lineHeight: 1.6, fontStyle: 'italic',
                  fontWeight: 380, color: 'var(--hh-green)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  fontFamily: 'inherit', maxWidth: 560,
                  background: 'var(--hh-isabel)', padding: '20px 22px',
                }}>{ex.text}</pre>
              )}
              <Headline size="section" italic style={{ marginTop: 14, fontWeight: 380 }}>
                {ex.title}
              </Headline>
              <p className="serif" style={{
                margin: '4px 0 10px', fontSize: 14, fontStyle: 'italic',
                color: 'var(--hh-green-3)', fontWeight: 380,
              }}>{ex.author}</p>
              {ex.why && <p className="body" style={{ margin: 0, maxWidth: 540 }}>{ex.why}</p>}
              {hasText && (
                <div style={{ marginTop: 14 }}>
                  <ShareLink text={ex.text} attribution={ex.author} quoted message={SHARE_MESSAGE.passage} label="Share this passage"/>
                </div>
              )}
              {hasUrl && (
                <a href={ex.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-block', marginTop: 12, color: 'var(--ember)',
                    fontFamily: 'var(--sans)', fontSize: 11,
                    fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
                    textDecoration: 'none', borderBottom: '1px solid currentColor',
                    paddingBottom: 2,
                  }}>
                  {hasText ? `Find the book` : `Read at ${sourceLabel}`} →
                </a>
              )}
            </section>
          );
        })()}

        {/* Poem · text inline when public-domain & known verbatim,
            otherwise a "Read at <source>" link out. */}
        <section style={{ padding: '40px 22px 0' }}>
          <Kicker>A poem · for the page</Kicker>
          <div style={{ marginTop: 18 }}>
            {(reading.poems || []).map((p, i) => {
              const key = `poem-${i}-${p.title}`;
              const isSaved = isItemBookmarked(bookmarks, { kind: 'poem', title: p.title, source: p.poet, url: p.url });
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
                    <button onClick={() => saveItem('poem', p)} disabled={isSaved}
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
                  <div style={{ marginTop: 14 }}>
                    {hasText
                      ? <ShareLink text={p.text} attribution={p.poet} quoted message={SHARE_MESSAGE.poem} label="Share this poem"/>
                      : hasUrl
                        ? <ShareLink text={`${p.title} by ${p.poet}`} url={p.url} message={SHARE_MESSAGE.poem} label="Share this poem"/>
                        : null}
                  </div>
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

        {/* Receiving used to end here, with the reader scrolling away
            from something that had just moved them. Meaning received
            through beauty is an avenue in its own right, and a moment
            that is noticed and stayed with is far more likely to be
            kept. See src/savour.jsx. */}
        {!fromLog && (
          <SavourOpener
            label="Stay a moment with what that reached"
            question="What did that reach in you?"
            avenue="receive"
            prompt="What the listening reached in me"
          />
        )}

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

  // ── Logbook view ───────────────────────────────
  // Reverse-chronological list of past readings. Each row shows the
  // date, the register chip, the moodSummary the reader liked, and the
  // beginning of their original mood text. Tap a row to revisit the
  // full reading. The list is paginated server-side (30 per page).
  if (view === 'logbook') {
    return (
      <div className="fade-in" style={{ paddingBottom: 32 }}>
        <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setView('input')} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            {Icon.back(18, 'currentColor')}<span>Attune</span>
          </button>
          <span className="mono" style={{
            fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)',
            textTransform: 'uppercase',
          }}>Logbook</span>
        </section>

        <section style={{ padding: '36px 22px 0' }}>
          <Kicker>Past readings</Kicker>
          <Headline size="display" italic style={{ marginTop: 14 }}>
            Where you've been.
          </Headline>
          <p className="body" style={{ margin: '18px 0 28px', maxWidth: 380 }}>
            Each reading saved with the words you wrote and what was heard back. Tap any entry to open the full reading.
          </p>
        </section>

        <section style={{ padding: '12px 22px 0' }}>
          {logbook.loading && logbook.entries.length === 0 && (
            <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 18, width: '80%' }}/>
          )}

          {logbook.error && (
            <div style={{ padding: 16, background: 'var(--hh-isabel)' }}>
              <p className="body" style={{ margin: 0 }}>{logbook.error}</p>
            </div>
          )}

          {!logbook.loading && !logbook.error && logbook.entries.length === 0 && (
            <div style={{ padding: '28px 0' }}>
              <p className="body" style={{ margin: 0, color: 'var(--paper-mute)' }}>
                No readings yet. The first one you write will appear here.
              </p>
            </div>
          )}

          {logbook.entries.length > 0 && (
            <Rule/>
          )}

          {logbook.entries.map((entry) => (
            <div key={entry.id} style={{
              borderBottom: '1px solid rgba(31, 64, 69, 0.10)',
              padding: '22px 0',
            }}>
              <button onClick={() => openLogEntry(entry)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <span className="mono" style={{
                    fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)',
                    textTransform: 'uppercase',
                  }}>
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                  {entry.register && (
                    <span className="mono" style={{
                      fontSize: 9, letterSpacing: '0.14em', color: 'var(--hh-green)',
                      textTransform: 'uppercase', padding: '2px 10px',
                      border: '1px solid rgba(31, 64, 69, 0.18)',
                    }}>
                      {entry.register}
                    </span>
                  )}
                </div>
                {/* Saved preferences strip. Only renders when the
                    reader actually narrowed the field (not "any /
                    either" defaults). */}
                {formatPreferences(entry.preferences) && (
                  <div className="mono" style={{
                    marginTop: 8, fontSize: 9, letterSpacing: '0.12em',
                    color: 'var(--paper-mute)', textTransform: 'uppercase',
                  }}>
                    {formatPreferences(entry.preferences)}
                  </div>
                )}
                {entry.moodSummary && (
                  <p className="serif" style={{
                    margin: '12px 0 0', fontSize: 16, lineHeight: 1.55,
                    fontWeight: 380, fontStyle: 'italic', color: 'var(--hh-green-2, var(--hh-green))',
                  }}>
                    {entry.moodSummary}
                  </p>
                )}
                {entry.mood && (
                  <p className="body" style={{
                    margin: '10px 0 0', color: 'var(--paper-mute)',
                    fontSize: 12.5, lineHeight: 1.55,
                  }}>
                    You wrote: <span style={{ fontStyle: 'italic' }}>"{entry.mood.length > 140 ? entry.mood.slice(0, 140) + '…' : entry.mood}"</span>
                  </p>
                )}
              </button>
              {/* This was hover-only (opacity 0 until mouseenter),
                  which on a phone means invisible and unreachable: the
                  reader could not remove a reading at all on the device
                  they actually use. Always present now, and in flow
                  rather than absolutely positioned, so it cannot sit on
                  top of the entry text. */}
              <button onClick={() => confirmDelete(entry.id)}
                aria-label="Remove reading"
                style={{
                  marginTop: 12, background: 'transparent', border: 0, padding: 0,
                  cursor: 'pointer', color: 'var(--paper-mute)',
                  fontFamily: 'var(--mono)', fontSize: 9.5,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>
                {pendingDelete === entry.id ? 'Tap again to remove' : 'Remove'}
              </button>
            </div>
          ))}

          {logbook.hasMore && (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <button onClick={loadMoreLog} disabled={logbook.loading} style={{
                background: 'transparent', border: '1px solid rgba(31, 64, 69, 0.18)',
                padding: '12px 22px', cursor: logbook.loading ? 'wait' : 'pointer',
                color: 'var(--hh-green)',
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>
                {logbook.loading ? 'Loading…' : 'Show more'}
              </button>
            </div>
          )}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Kicker>Attune</Kicker>
          <button onClick={openLogbook} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            color: 'var(--hh-green)',
            fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span>Logbook</span>
            <span style={{ width: 14, height: 1, background: 'currentColor' }}/>
          </button>
        </div>
        <Headline size="display" style={{ marginTop: 14 }}>
          How are you,<br/><span style={{ fontStyle: 'italic' }}>really?</span>
        </Headline>
        <p className="body" style={{ margin: '18px 0 28px', maxWidth: 380 }}>
          Tell me in a sentence. I'll find three songs, a passage from a book, and a poem shaped to where you are. Chosen on what the research says actually helps.
        </p>

        <textarea
          className="hearth-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="I feel…"
          style={{ minHeight: 140, background: 'var(--hh-isabel)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '18px 18px' }}
        />

        {/* ── Preferences ───────────────────────────────────
            Two rows of chips that scope the song picks: a genre
            and a vocals preference. Both default to the
            "no constraint" option so the reading stays as wide
            as before unless the reader narrows. The chips render
            in the same quiet editorial register as the seed-
            phrase row below. */}
        <div style={{ marginTop: 26 }}>
          <PreferenceRow
            label="Genre"
            value={genre}
            onChange={setGenre}
            options={[
              { value: 'any',         label: 'Any' },
              { value: 'folk',        label: 'Folk' },
              { value: 'classical',   label: 'Classical' },
              { value: 'jazz',        label: 'Jazz' },
              { value: 'soul',        label: 'Soul & R&B' },
              { value: 'electronic',  label: 'Electronic' },
              { value: 'indie',       label: 'Indie' },
              { value: 'hiphop',      label: 'Hip-hop' },
              { value: 'world',       label: 'World' },
            ]}
          />
          <PreferenceRow
            label="Vocals"
            value={vocals}
            onChange={setVocals}
            options={[
              { value: 'either',  label: 'Either' },
              { value: 'with',    label: 'With vocals' },
              { value: 'without', label: 'Instrumental' },
            ]}
            style={{ marginTop: 14 }}
          />
        </div>

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
// RitualsScreen (an index of all practices) and RitualBuilderScreen (a
// scheduler for them) are gone. Neither was routed: practices are
// reached directly from the avenue they belong to, which is the correct
// shape, and a builder for scheduling rituals was a plan Hearth decided
// against when it refused streaks and cadence.

function RitualDetailScreen({ go, payload }) {
  const r = payload?.ritual || HEARTH_DATA.rituals[0];
  const back = payload?.back || 'home';
  if (r.key === 'breath')    return <BreathRitual go={go} back={back}/>;
  if (r.key === 'gratitude') return <GratitudeRitual go={go} back={back}/>;
  if (r.key === 'awe')       return <AweRitual go={go} back={back}/>;
  if (r.key === 'values')    return <ValuesRitual go={go} back={back}/>;
  if (r.key === 'shutdown')  return <ShutdownRitual go={go} back={back}/>;
  return null;
}

function RitualHeader({ go, back, kicker, title, body }) {
  return (
    <>
      <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => go(back || 'home')} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          {Icon.back(18, 'currentColor')}<span>Back</span>
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

// Shared confirmation after a practice keeps something. Names exactly
// where it now lives and offers a direct way there, so every input is
// both stored and easy to find again.
function RitualKept({ go, back, kicker, line, where = 'meaning log', viewRoute = 'meaning-log' }) {
  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <RitualHeader go={go} back={back} kicker={kicker} title={<>Kept.</>}/>
      <section style={{ padding: '34px 22px 0' }}>
        <p className="serif" style={{ margin: 0, fontSize: 19, lineHeight: 1.55, fontStyle: 'italic', color: 'var(--hh-green)', maxWidth: 520 }}>{line}</p>
        <p className="body-sm" style={{ margin: '18px 0 0', color: 'var(--paper-mute)' }}>You'll find this in your {where}, on the Yours page.</p>
        <div style={{ marginTop: 26, display: 'flex', gap: 18, alignItems: 'center' }}>
          <button onClick={() => go(viewRoute)} style={{ background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0, padding: '13px 22px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase' }}>View {where}</button>
          <button onClick={() => go(back || 'home')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Done</button>
        </div>
      </section>
    </div>
  );
}

const BREATH_CYCLES = 6;

function BreathRitual({ go, back }) {
  const [phase, setPhase] = useState2('in');
  // The cycle counter used to read a hardcoded "Cycle 02 of 06" for the
  // whole four minutes. It counts now, and the ritual completes.
  const [cycle, setCycle] = useState2(0);
  const [done, setDone] = useState2(false);
  React.useEffect(() => {
    const seq = ['in', 'hold1', 'out', 'hold2'];
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i % seq.length === 0) {
        const completed = i / seq.length;
        if (completed >= BREATH_CYCLES) { setDone(true); clearInterval(id); return; }
        setCycle(completed);
      }
      setPhase(seq[i % seq.length]);
    }, 4000);
    return () => clearInterval(id);
  }, []);
  const label = phase === 'in' ? 'Breathe in' : phase === 'out' ? 'Breathe out' : 'Hold';
  const scale = phase === 'in' ? 1 : phase === 'out' ? 0.55 : (phase === 'hold1' ? 1 : 0.55);

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go} back={back}
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
          {done ? 'Done.' : `${label}.`}
        </Headline>
        <p className="mono" style={{
          marginTop: 14, fontSize: 9.5, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--hh-green-3)',
        }}>Cycle {String(Math.min(cycle + 1, BREATH_CYCLES)).padStart(2, '0')} of {String(BREATH_CYCLES).padStart(2, '0')}</p>
      </ColorBlock>
      <section style={{ padding: '36px 22px 0' }}>
        <p className="body" style={{ margin: 0, maxWidth: 320 }}>
          Slow, even breathing settles the body within a few minutes. Not a cure for anything. Often enough to be able to think again.
        </p>
        <button onClick={() => go(back || 'home')} style={{
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

// Three good things — with the part that actually does the work.
//
// The protocol is three things AND, for each, why it went well and what
// your own part in it was. That causal attribution is the mechanism: it
// is what turns "nice things happened to me" into "I had a hand in
// this", and it is the difference between noticing and building.
//
// The instruction was in the header and the UI gave one undifferentiated
// box per item, so in practice people wrote "coffee with Sam" and
// stopped. Two fields per row restores the intervention.
function GratitudeRitual({ go, back }) {
  const [items, setItems] = useState2([
    { what: '', why: '' }, { what: '', why: '' }, { what: '', why: '' },
  ]);
  const [kept, setKept] = useState2(false);
  const [keeping, setKeeping] = useState2(false);
  const [savour, setSavour] = useState2(false);
  const filled = items.filter((it) => it.what.trim());

  function setField(i, field, value) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  async function keep() {
    if (!filled.length || keeping) return;
    setKeeping(true);
    const text = filled
      .map((it, i) => `${i + 1}. ${it.what.trim()}${it.why.trim() ? `\n   ${it.why.trim()}` : ''}`)
      .join('\n');
    try {
      await api.meaning.create({ text, prompt: 'Three good things', avenue: 'receive', date: new Date().toISOString().slice(0, 10) });
    } catch { /* unauthed or transient; still let them finish */ }
    setKept(true); setKeeping(false);
  }

  // Having named three good things is precisely the moment worth staying
  // with, rather than closing the page on.
  if (kept && savour) {
    return (
      <div className="fade-in" style={{ paddingBottom: 32 }}>
        <RitualHeader go={go} back={back} kicker="Three good things · Kept" title={<>Stay with<br/>one of them.</>}/>
        <SavourMoment
          question="Pick the one that was best. What was it like?"
          avenue="receive"
          prompt="The best of three good things"
          onDone={() => go(back || 'home')}
        />
      </div>
    );
  }

  if (kept) return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go} back={back} kicker="Three good things · Kept" title={<>Kept.</>}
        body="Noticing what went well, and the part you played in it, gathers over time into your sense of what matters."/>
      <section style={{ padding: '32px 22px 0', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setSavour(true)} style={{
          background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0, padding: '14px 22px',
          cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>Stay a moment</button>
        <button onClick={() => go('meaning-log')} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-mute)',
          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>The meaning log</button>
      </section>
    </div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go} back={back}
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
              <div style={{ flex: 1 }}>
                <textarea value={v.what}
                  onChange={e => setField(i, 'what', e.target.value)}
                  placeholder={['the warmth of the kettle', 'a friend remembered', 'the quiet hour before dinner'][i]}
                  style={{
                    width: '100%', background: 'transparent', border: 0, outline: 'none', resize: 'none',
                    fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
                    fontWeight: 380, color: 'var(--hh-green)', minHeight: 44, lineHeight: 1.45,
                  }}/>
                {v.what.trim() && (
                  <div className="fade-in" style={{ marginTop: 8 }}>
                    <div className="mono" style={{
                      fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: 'var(--paper-mute)', marginBottom: 4,
                    }}>
                      Why it went well, and your part in it
                    </div>
                    <textarea value={v.why}
                      onChange={e => setField(i, 'why', e.target.value)}
                      placeholder="I made the time for it…"
                      style={{
                        width: '100%', background: 'transparent', border: 0, outline: 'none', resize: 'none',
                        fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 380,
                        color: 'var(--hh-green-3)', minHeight: 38, lineHeight: 1.5,
                      }}/>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <button onClick={keep} disabled={!filled.length || keeping} style={{
          marginTop: 28,
          background: filled.length ? 'var(--hh-green)' : 'transparent', color: filled.length ? 'var(--hh-lace)' : 'var(--paper-mute)',
          border: filled.length ? 0 : '1px solid rgba(31, 64, 69, 0.25)', padding: '14px 22px',
          cursor: (filled.length && !keeping) ? 'pointer' : 'default',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 14,
        }}>
          <span>{keeping ? 'Keeping…' : 'Keep these'}</span>
          <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </section>
    </div>
  );
}

// The awe walk as a ritual of crossing a threshold (Sturm & Keltner,
// 2020): an invitation, a send-off that turns attention outward and lets
// the app recede, and a return that savours one thing noticed and keeps
// it to the meaning log (avenue: receive), feeding the narrative.
const AWE_NOTICES = ['One thing larger than you', 'One thing smaller than your hand', 'One thing you would not have seen yesterday'];

function AweNotices({ pad = 18 }) {
  return (
    <div style={{ marginTop: 14 }}>
      {AWE_NOTICES.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, padding: `${pad}px 0`, alignItems: 'baseline', borderBottom: i === 2 ? 0 : '1px solid rgba(31, 64, 69, 0.10)' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--hh-green)', letterSpacing: '0.06em', minWidth: 28, fontWeight: 500 }}>{String(i + 1).padStart(2, '0')}</span>
          <span className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 400, color: 'var(--hh-green)' }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function AweRitual({ go, back }) {
  const [phase, setPhase] = useState2('intro'); // intro | out | done
  const [noticed, setNoticed] = useState2('');
  const [kept, setKept] = useState2(false);
  const [keeping, setKeeping] = useState2(false);
  const [savour, setSavour] = useState2(false);

  async function keepNotice() {
    const t = noticed.trim();
    if (t.length < 2 || keeping) return;
    setKeeping(true);
    try {
      await api.meaning.create({ text: t, prompt: 'What I noticed on an awe walk', avenue: 'receive', date: new Date().toISOString().slice(0, 10) });
    } catch { /* unauthed or transient; still let them finish */ }
    setKept(true);
    setKeeping(false);
  }

  const solid = {
    background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0, padding: '14px 22px', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
    display: 'inline-flex', alignItems: 'center', gap: 14,
  };

  // ── Step across: the send-off ──
  if (phase === 'out') {
    return (
      <div className="fade-in" style={{ paddingBottom: 40 }}>
        <RitualHeader go={go} back={back} kicker="Awe walk · Out in the world" title={<>Step out,<br/>look up.</>}/>
        <section style={{ padding: '34px 22px 0', textAlign: 'center' }}>
          <img src="/brand/symbol-paper.svg" alt="" aria-hidden="true" style={{ display: 'block', width: 86, height: 86, margin: '0 auto' }}/>
          <p className="serif" style={{ margin: '28px auto 0', maxWidth: 360, fontSize: 19, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)' }}>
            Put the phone in your pocket. Turn your attention outward, toward the vast, the small, the surprising. Let yourself feel small, in the good way.
          </p>
        </section>
        <section style={{ padding: '36px 22px 0' }}>
          <Rule/>
          <Kicker style={{ marginTop: 22 }}>Carry these</Kicker>
          <AweNotices pad={14}/>
          <p className="body-sm" style={{ margin: '24px 0 0', color: 'var(--paper-mute)', maxWidth: 380 }}>
            Take about fifteen minutes. Hearth will be here when you return.
          </p>
          <button onClick={() => setPhase('done')} style={{ ...solid, marginTop: 24 }}>
            <span>I'm back</span>
            <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
          </button>
        </section>
      </div>
    );
  }

  // ── Back: savour one thing, keep it to the meaning log ──
  if (phase === 'done') {
    return (
      <div className="fade-in" style={{ paddingBottom: 40 }}>
        <RitualHeader go={go} back={back} kicker="Awe walk · Back" title={<>What met<br/>your eyes?</>}/>
        <section style={{ padding: '34px 22px 0' }}>
          {kept ? (
            <div className="fade-in">
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--paper-mute)', marginBottom: 10 }}>Kept</div>
              <p className="serif" style={{ margin: 0, fontSize: 19, lineHeight: 1.55, fontStyle: 'italic', color: 'var(--hh-green)', maxWidth: 520 }}>
                The small things you stop to notice are where meaning often hides. They gather, over time, into your sense of what matters.
              </p>
              <p className="body-sm" style={{ margin: '18px 0 0', color: 'var(--paper-mute)' }}>You'll find this in your meaning log, on the Yours page.</p>
              <div style={{ marginTop: 26, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setSavour(true)} style={{ background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0, padding: '13px 22px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Stay a moment</button>
                <button onClick={() => go('meaning-log')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>View meaning log</button>
                <button onClick={() => go(back || 'home')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Done</button>
              </div>
              {savour && (
                <SavourMoment
                  question="Bring it back for a second. What was it like?"
                  avenue="receive"
                  prompt="What the walk reached in me"
                  onDone={() => go(back || 'home')}
                />
              )}
            </div>
          ) : (
            <>
              <p className="body" style={{ margin: 0, maxWidth: 380 }}>
                Name one thing you noticed that you would not have seen yesterday.
              </p>
              <textarea className="hearth-input" value={noticed} onChange={(e) => setNoticed(e.target.value)} placeholder="The thing I saw…"
                style={{ minHeight: 90, marginTop: 18, background: 'var(--hh-isabel)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '14px 16px' }}/>
              <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                {(() => {
                  const ready = noticed.trim().length >= 2 && !keeping;
                  return (
                    <button onClick={keepNotice} disabled={!ready} style={{
                      background: ready ? 'var(--hh-green)' : 'transparent', color: ready ? 'var(--hh-lace)' : 'var(--paper-mute)',
                      border: ready ? 0 : '1px solid rgba(31, 64, 69, 0.25)', padding: '12px 20px', cursor: ready ? 'pointer' : 'default',
                      fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
                    }}>{keeping ? 'Keeping…' : 'Keep it'}</button>
                  );
                })()}
                <button onClick={() => go(back || 'home')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Just close</button>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  // ── Intro: the invitation ──
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go} back={back} kicker="03 · Awe walk · Sturm & Keltner, 2020" title={<>Fifteen minutes,<br/>looking outward.</>}/>
      <section style={{ padding: '32px 22px 0' }}>
        <p className="body" style={{ margin: 0 }}>
          Walk somewhere familiar. Turn your attention away from yourself and toward the vast, the small, the unexpected. A peeling bark, a long sky, a stranger's kindness.
        </p>
      </section>
      <section style={{ padding: '36px 22px 0' }}>
        <Rule/>
        <Kicker style={{ marginTop: 22 }}>Three notices</Kicker>
        <AweNotices/>
        <button onClick={() => setPhase('out')} style={{ ...solid, marginTop: 28 }}>
          <span>Begin walk</span>
          <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </section>
    </div>
  );
}

function ValuesRitual({ go, back }) {
  const D = HEARTH_DATA;
  const [picked, setPicked] = useState2(['Care', 'Craft', 'Wonder']);
  const [move, setMove] = useState2('');
  const [kept, setKept] = useState2(false);
  const [keeping, setKeeping] = useState2(false);
  function toggle(v) {
    setPicked(p => p.includes(v) ? p.filter(x => x !== v) : (p.length < 5 ? [...p, v] : p));
  }
  const ready = picked.length || move.trim();

  async function keep() {
    if (!ready || keeping) return;
    setKeeping(true);
    const vals = picked.join(', ');
    const m = move.trim();
    const text = vals && m ? `Most alive: ${vals}.\nOne move: ${m}` : (m ? `One move: ${m}` : `Most alive: ${vals}.`);
    try {
      await api.meaning.create({ text, prompt: 'Values check-in', avenue: 'carry', date: new Date().toISOString().slice(0, 10) });
    } catch { /* unauthed or transient; still let them finish */ }
    setKept(true); setKeeping(false);
  }

  if (kept) return <RitualKept go={go} back={back} kicker="Values check-in · Kept"
    line="Naming what you actually live by, and one small move toward it, is how values turn from words into a week. This is now part of your record."/>;

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go} back={back}
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
        <textarea value={move} onChange={e => setMove(e.target.value)} placeholder="It will be small. It will be specific. It will be soon."
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
      <section style={{ padding: '26px 22px 0' }}>
        <button onClick={keep} disabled={!ready || keeping} style={{
          background: ready ? 'var(--hh-green)' : 'transparent', color: ready ? 'var(--hh-lace)' : 'var(--paper-mute)',
          border: ready ? 0 : '1px solid rgba(31, 64, 69, 0.25)', padding: '14px 22px',
          cursor: (ready && !keeping) ? 'pointer' : 'default',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 14,
        }}>
          <span>{keeping ? 'Keeping…' : 'Keep this'}</span>
          <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </section>
    </div>
  );
}

function ShutdownRitual({ go, back }) {
  const D = HEARTH_DATA;
  const [done, setDone] = useState2([false, false, false, false, false]);
  const all = done.every(Boolean);
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <RitualHeader go={go} back={back}
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

export { AttuneScreen, RitualDetailScreen };
