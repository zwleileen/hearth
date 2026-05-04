// Hearth — Home + Journal screens (editorial rebuild v3)
// Aesop / Frama. Old Lace paper, Midnight Green ink, four
// feature accents used as full color blocks, never tints.

import React from 'react';
import { ColorBlock, Headline, Icon, Kicker, Photo, Rule } from './atoms.jsx';
import { HEARTH_DATA } from './data.js';
import { api, bookmarkKindFor, isItemBookmarked } from './api.js';

const { useState: useState1, useEffect: useEffect1 } = React;

// ─────────────────────────────────────────────────────────────
// HOME — editorial
// Structure:
//   1. Quiet greeting on Old Lace
//   2. Color block: tonight's prompt (Ecru / Carolina Blue
//      depending on time of day)
//   3. Editorial photo + featured story
//   4. Three-up index of practices
//   5. Closing line
// ─────────────────────────────────────────────────────────────
// Local-time greeting buckets. Reads the user's machine timezone.
function timeOfDay() {
  const h = new Date().getHours();
  if (h < 5)  return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

function formatTodayKicker() {
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  const dayMonth = now.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${weekday} · ${dayMonth} · ${time}`;
}

// Stable string hash (32-bit, jhash-style). Used to give each user a
// different starting offset into the quote pool so two readers don't
// see the same quote on the same day.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Pick a quote deterministically from today's date so it stays stable
// across reloads within a day, but changes each new day.
//
// Filters the pool by the user's 'What brought you here' reasons
// (rest, clarity, gratitude, focus, grief, wonder) so the quote
// reflects what they came to Hearth for. Mixes in a per-user offset
// so two readers with the same reasons still see different quotes
// on the same day. Falls back to the full pool if the user has no
// reasons set, or if no quote matches their reasons.
function pickDailyQuote(quotes, user) {
  if (!quotes || !quotes.length) return null;
  const reasons = user?.onboarding?.reasons || [];
  let pool = quotes;
  if (reasons.length > 0) {
    const filtered = quotes.filter(q => (q.themes || []).some(t => reasons.includes(t)));
    if (filtered.length > 0) pool = filtered;
  }
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const userOffset = user?.id ? hashStr(user.id) : 0;
  return pool[(dayOfYear + userOffset) % pool.length];
}

function HomeScreen({ go, user }) {
  const D = HEARTH_DATA;
  const part = timeOfDay(); // 'night' | 'morning' | 'afternoon' | 'evening'
  const firstName = user?.name?.split(/\s+/)[0]?.trim();
  const greet = (() => {
    const tail = firstName ? `, ${firstName}` : '';
    if (part === 'morning')   return `Good morning${tail}.`;
    if (part === 'afternoon') return `Good afternoon${tail}.`;
    if (part === 'evening')   return `Good evening${tail}.`;
    return `Welcome back${tail}.`; // night / late
  })();
  const quote = pickDailyQuote(D.dailyQuotes, user);

  const [items, setItems] = useState1(null);
  const [issueNote, setIssueNote] = useState1('');
  const [feedState, setFeedState] = useState1('loading'); // loading|ready|empty|unauthed
  // Bookmarks are the source of truth for "Saved" buttons. Per-screen
  // `saved` maps used to lose state on unmount, so users could save
  // the same item multiple times by navigating away and back. The
  // bookmarks list is fetched on mount and updated locally on save.
  const [bookmarks, setBookmarks] = React.useState([]);

  async function saveDiscoverItem(item) {
    if (isItemBookmarked(bookmarks, item)) return;
    try {
      const kind = bookmarkKindFor(item);
      const { bookmark } = await api.bookmarks.create({
        kind,
        title: item.title,
        source: item.source || '',
        url: item.url || '',
        excerpt: item.dek || '',
        meta: { savedFrom: 'home', readTime: item.readTime, image: item.image },
      });
      if (bookmark) setBookmarks(prev => [bookmark, ...prev]);
    } catch (err) {
      // 409 on URL uniqueness collision. Refetch to sync the in-memory
      // list with the server-side state so the button flips to Saved.
      if (err.status === 409) {
        try {
          const { bookmarks: latest } = await api.bookmarks.list();
          setBookmarks(latest || []);
        } catch {}
      }
    }
  }

  useEffect1(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.discover.today();
        if (cancelled) return;
        const list = data.items || [];
        setItems(list);
        setIssueNote(data.issueNote || '');
        setFeedState(list.length > 0 ? 'ready' : 'empty');
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) setFeedState('unauthed');
        else setFeedState('empty');
      }
    })();
    (async () => {
      try {
        const { bookmarks: list } = await api.bookmarks.list();
        if (!cancelled) setBookmarks(list || []);
      } catch {
        // Unauth or transient — render with empty bookmarks; saving
        // will fail with 401 if user isn't signed in, which is fine.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const hero = items?.[0];
  const rest = items?.slice(1) || [];

  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      {/* ── 1. Greeting ─────────────────────────── */}
      <section style={{ padding: '14px 22px 32px' }}>
        <Kicker>{formatTodayKicker()}</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          {greet}
        </Headline>
      </section>

      {/* ── 2. Daily quote (replaces the prompt block) ── */}
      {quote && (
        <section style={{ padding: '24px 22px 8px' }}>
          <Rule glyph="◆"/>
          <div style={{ padding: '32px 0 28px', textAlign: 'center' }}>
            <p className="serif" style={{
              margin: '0 auto', maxWidth: 540,
              fontSize: 24, lineHeight: 1.4, fontWeight: 360, fontStyle: 'italic',
              color: 'var(--hh-green)', letterSpacing: '-0.005em',
            }}>
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mono" style={{
              fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--paper-mute)',
              marginTop: 22, textTransform: 'uppercase',
            }}>
              {quote.author}{quote.source ? ` · ${quote.source}` : ''}{quote.year ? ` · ${quote.year}` : ''}
            </p>
          </div>
          <Rule glyph="◆"/>
        </section>
      )}

      {/* ── 3. Editorial spread, full reading room ── */}
      <section style={{ padding: '48px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">The reading room</span>
          {feedState === 'ready' && (
            <span className="hearth-dept-head-meta">Today · {items.length} {items.length === 1 ? 'piece' : 'pieces'}</span>
          )}
        </div>
        {issueNote && feedState === 'ready' && (
          <p className="serif" style={{ margin: '14px 0 0', fontSize: 17, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-2)', maxWidth: 580, lineHeight: 1.45 }}>
            {issueNote}
          </p>
        )}

        {feedState === 'loading' && (
          <div style={{ marginTop: 28 }}>
            <div style={{ height: 280, background: 'var(--paper-line)', opacity: 0.25 }}/>
            <div style={{ height: 24, background: 'var(--paper-line)', opacity: 0.35, marginTop: 18, width: '70%' }}/>
            <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.25, marginTop: 10, width: '90%' }}/>
          </div>
        )}

        {feedState === 'unauthed' && (
          <div style={{ marginTop: 22 }}>
            <p className="serif" style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 420 }}>
              Your reading room opens once you sign in. We keep it small, and we keep it yours.
            </p>
            <button className="btn btn-ember" onClick={() => go('auth')} style={{ marginTop: 18 }}>
              Sign in
            </button>
          </div>
        )}

        {feedState === 'empty' && (
          <div style={{ marginTop: 22 }}>
            <p className="serif" style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 420 }}>
              Today's reading room is being gathered for you. Check back in a moment.
            </p>
          </div>
        )}

        {/* Hero article — magazine cover treatment */}
        {feedState === 'ready' && hero && (() => {
          const heroSaved = isItemBookmarked(bookmarks, hero);
          return (
            <article style={{ marginTop: 28 }}>
              <div onClick={() => hero.url && window.open(hero.url, '_blank', 'noopener,noreferrer')}
                style={{ cursor: hero.url ? 'pointer' : 'default' }}>
                {hero.image ? (
                  <img
                    src={hero.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block', background: 'var(--paper-line)' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 18, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--hh-ecru-deep)', textTransform: 'uppercase', fontWeight: 500 }}>
                    Cover · {hero.kind}
                  </span>
                  {hero.source && (
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                      · {hero.source}
                    </span>
                  )}
                  {hero.readTime && (
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)' }}>· {hero.readTime}</span>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); saveDiscoverItem(hero); }}
                  disabled={heroSaved} className="hearth-save-btn" data-saved={heroSaved}>
                  {Icon.bookmark(12, 'currentColor')}
                  <span>{heroSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
              <div onClick={() => hero.url && window.open(hero.url, '_blank', 'noopener,noreferrer')}
                style={{ cursor: hero.url ? 'pointer' : 'default' }}>
                <h2 className="serif" style={{
                  margin: '14px 0 12px', fontSize: 30, lineHeight: 1.1, fontStyle: 'italic',
                  fontWeight: 360, letterSpacing: '-0.01em', color: 'var(--hh-green)',
                }}>
                  {hero.title}
                </h2>
                <p className="body" style={{ margin: 0, maxWidth: 580, fontSize: 16, lineHeight: 1.55 }}>
                  {hero.dek}
                </p>
              </div>
            </article>
          );
        })()}

        {/* Heavier hairline between hero and the grid */}
        {feedState === 'ready' && rest.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <hr className="hearth-hero-rule"/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.26em', color: 'var(--hh-green)', textTransform: 'uppercase', fontWeight: 500 }}>
                Also in this issue
              </span>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                {rest.length} {rest.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>
          </div>
        )}

        {/* Grid of remaining items, each on a rotating accent */}
        {feedState === 'ready' && rest.length > 0 && (() => {
          const ACCENTS = [
            { color: 'var(--hh-ecru)',    deep: 'var(--hh-ecru-deep)' },
            { color: 'var(--hh-blue)',    deep: 'var(--hh-blue-deep)' },
            { color: 'var(--hh-dogwood)', deep: 'var(--hh-dogwood-deep)' },
            { color: 'var(--hh-green)',   deep: 'var(--hh-green)' },
          ];
          return (
            <div className="hearth-feed-grid" style={{ marginTop: 28 }}>
              {rest.map((it, i) => {
                const itemKey = it.url || `${it.kind}:${it.title}:${i}`;
                const itemSaved = isItemBookmarked(bookmarks, it);
                const accent = ACCENTS[i % ACCENTS.length];
                return (
                  <article key={itemKey} className="hearth-article"
                    style={{
                      '--card-accent': accent.color,
                      '--card-accent-deep': accent.deep,
                    }}>
                    <div onClick={() => it.url && window.open(it.url, '_blank', 'noopener,noreferrer')}
                      style={{ cursor: it.url ? 'pointer' : 'default' }}>
                      <div className="hearth-article-no">
                        № {String(i + 1).padStart(2, '0')} · {it.kind}
                      </div>
                      {it.image ? (
                        <img
                          src={it.image}
                          alt=""
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', background: 'var(--paper-line)', marginTop: 14 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}
                      <h3 className="hearth-article-title">{it.title}</h3>
                      <p className="body-sm" style={{ margin: 0, lineHeight: 1.6 }}>
                        {it.dek}
                      </p>
                      {(it.source || it.readTime) && (
                        <div className="hearth-article-source">
                          {it.source}{it.source && it.readTime ? ' · ' : ''}{it.readTime}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 14 }}>
                      <button onClick={(e) => { e.stopPropagation(); saveDiscoverItem(it); }}
                        disabled={itemSaved} className="hearth-save-btn" data-saved={itemSaved}>
                        {Icon.bookmark(11, 'currentColor')}
                        <span>{itemSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })()}

        {/* Heavy section break to journal CTA */}
        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '2px solid var(--hh-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p className="serif" style={{ margin: 0, fontSize: 18, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper)', maxWidth: 380, lineHeight: 1.4 }}>
              When the reading is done, the page is here. Five minutes is enough.
            </p>
            <button className="btn btn-ember" onClick={() => go('journal')}>
              Begin today's entry {Icon.arrow(14, 'var(--on-ember)')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// JOURNAL — editorial
// Magazine cover → segmented (morning / evening) → numbered list
// of prompts with a hairline rule between each.
// ─────────────────────────────────────────────────────────────
function formatJournalListDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const hour = d.getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  if (sameDay) return `Today · ${partOfDay}`;
  if (isYesterday) return `Yesterday · ${partOfDay}`;
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} · ${partOfDay}`;
}

// Score a prompt against the user's signal tags. Each match counts 1.
// Onboarding reasons are durable signals (set once, persist); recent
// moods are situational (last few entries). We weight them equally and
// let stronger overlap rise to the top. Ties preserve original order
// via a stable sort (Array.prototype.sort is stable in V8/Node since
// 2018), so the original editorial sequence remains the tiebreaker.
function scorePromptForUser(prompt, signalTags) {
  if (!Array.isArray(prompt?.tags) || signalTags.size === 0) return 0;
  let score = 0;
  for (const t of prompt.tags) if (signalTags.has(t)) score += 1;
  return score;
}

function JournalScreen({ go, user }) {
  const D = HEARTH_DATA;
  const [tab, setTab] = useState1('evening');
  const [recent, setRecent] = useState1(null);
  const [recentError, setRecentError] = useState1(null);

  useEffect1(() => {
    let cancelled = false;
    (async () => {
      try {
        const { entries } = await api.journal.list();
        if (!cancelled) setRecent(entries.slice(0, 3));
      } catch (err) {
        if (!cancelled) setRecentError(err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Build the per-user signal tag set from onboarding reasons (durable)
  // plus the most recent 5 entries' moods (situational). When the user
  // has no signals yet, the list renders in original editorial order.
  const signalTags = (() => {
    const tags = new Set();
    const reasons = user?.onboarding?.reasons || [];
    for (const r of reasons) tags.add(r);
    if (Array.isArray(recent)) {
      for (const e of recent.slice(0, 5)) if (e?.mood) tags.add(e.mood);
    }
    return tags;
  })();

  const baseList = tab === 'morning' ? D.morningPrompts : D.eveningPrompts;
  // Score-then-sort. We tag each item with its score to drive the
  // "for you" eyebrow on the top match (only when score > 0 — no
  // misleading hints when there are no signals).
  const scoredList = baseList.map(p => ({ ...p, _score: scorePromptForUser(p, signalTags) }));
  const list = signalTags.size > 0
    ? [...scoredList].sort((a, b) => b._score - a._score)
    : scoredList;
  const topScore = list.length > 0 ? list[0]._score : 0;

  return (
    <div className="fade-in">
      {/* Cover */}
      <section style={{ padding: '14px 22px 32px' }}>
        <Kicker>The journal · A curated bench</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          Write yourself<br/>warm.
        </Headline>
        <p className="body" style={{ margin: '14px 0 0', maxWidth: 340 }}>
          Fifteen prompts, drawn from the most replicated work in positive and clinical psychology: Seligman, Pennebaker, Neff, King, Lyubomirsky, Gollwitzer, Oettingen, Borkovec. We surface the ones closest to where you are today.
        </p>
      </section>

      {/* Segmented, flat, editorial, no pill */}
      <section style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', borderTop: '1px solid var(--hh-green)', borderBottom: '1px solid var(--hh-green)' }}>
          {['morning', 'evening'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: tab === t ? 'var(--hh-green)' : 'transparent',
              color: tab === t ? 'var(--hh-lace)' : 'var(--hh-green)',
              border: 0, padding: '14px 0', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>{t}</button>
          ))}
        </div>
      </section>

      {/* Prompt list, numbered editorial. Top match (score > 0)
          gets a subtle italic eyebrow above the title — a soft
          "this one fits where you are" cue, no algorithmic chrome. */}
      <section style={{ padding: '0 22px' }}>
        {list.map((p, i) => {
          const isTopMatch = i === 0 && topScore > 0 && p._score === topScore;
          return (
            <button key={p.title} onClick={() => go('journal-write', { mode: tab, prompt: p })}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'transparent', border: 0,
                borderBottom: '1px solid rgba(31, 64, 69, 0.14)',
                padding: '26px 0', cursor: 'pointer',
              }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div className="mono" style={{
                  fontSize: 11, fontWeight: 500, color: 'var(--hh-green)',
                  letterSpacing: '0.06em', minWidth: 28, paddingTop: 6,
                }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ flex: 1 }}>
                  {isTopMatch && (
                    <p className="serif" style={{
                      margin: '0 0 6px', fontSize: 12, fontStyle: 'italic',
                      fontWeight: 400, color: 'var(--ember)', letterSpacing: '0.01em',
                    }}>
                      {tab === 'morning' ? 'For you, this morning' : 'For you, tonight'}
                    </p>
                  )}
                  <Headline size="section" italic style={{ fontWeight: 380 }}>{p.title}.</Headline>
                  <p className="body" style={{ margin: '8px 0 12px' }}>{p.prompt}</p>
                  <Kicker accent="mute" style={{ fontSize: 9.5 }}>{p.lineage}</Kicker>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Recent entries, only what the user has actually saved */}
      <section style={{ padding: '40px 22px 0' }}>
        <Kicker>Recent entries</Kicker>

        {recentError && recentError.status === 401 && (
          <p className="body" style={{ marginTop: 14, color: 'var(--paper-mute)' }}>
            <span onClick={() => go('auth')} style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--ember)' }}>Sign in</span>{' '}
            to see your kept entries here.
          </p>
        )}

        {!recentError && recent === null && (
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 12, width: '60%' }}/>
            <div style={{ height: 18, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '85%' }}/>
          </div>
        )}

        {!recentError && Array.isArray(recent) && recent.length === 0 && (
          <p className="serif" style={{ marginTop: 14, fontSize: 16, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 380 }}>
            Nothing kept yet. Pick a prompt above and write yourself a first entry.
          </p>
        )}

        {!recentError && Array.isArray(recent) && recent.length > 0 && (
          <>
            <div style={{ marginTop: 14 }}>
              {recent.map((e) => (
                <div key={e.id} onClick={() => go('entry-detail', { entry: {
                  id: e.id,
                  date: formatJournalListDate(e.createdAt),
                  title: e.title || 'Untitled',
                  mood: e.mood,
                  shift: e.shift !== null && e.shift !== undefined ? `${e.shift > 0 ? '+' : ''}${e.shift}` : '',
                  tone: 'wisteria',
                  body: e.body,
                  tags: e.tags || [],
                  lineage: e.promptLineage,
                } })}
                  style={{
                    padding: '18px 0', borderBottom: '1px solid rgba(31, 64, 69, 0.10)',
                    cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                      {formatJournalListDate(e.createdAt)}
                    </span>
                    {e.mood && (
                      <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--hh-green)', textTransform: 'uppercase' }}>
                        {e.mood}{e.shift !== null && e.shift !== undefined ? ` · ${e.shift > 0 ? '+' : ''}${e.shift}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="serif" style={{
                    fontSize: 18, fontWeight: 400, color: 'var(--hh-green)',
                    marginTop: 8, fontStyle: 'italic',
                  }}>{e.title || 'Untitled'}</div>
                </div>
              ))}
            </div>
            <button onClick={() => go('journal-archive')} style={{
              background: 'transparent', border: 0, padding: 0, marginTop: 24,
              cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hh-green)',
              display: 'inline-flex', alignItems: 'center', gap: 14,
            }}>
              <span>All entries</span>
              <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
            </button>
          </>
        )}
      </section>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// JOURNAL WRITE — editorial
// ─────────────────────────────────────────────────────────────
function JournalWriteScreen({ go, payload }) {
  const D = HEARTH_DATA;
  const prompt = payload?.prompt || D.eveningPrompts[0];
  const mode = payload?.mode || 'evening';
  const [text, setText] = useState1('');
  const [step, setStep] = useState1('write');
  const [mood, setMood] = useState1(null);
  const [shift, setShift] = useState1(2);
  const [saving, setSaving] = useState1(false);
  const [saveError, setSaveError] = useState1(null);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  async function keepEntry() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.journal.create({
        mode,
        title: prompt.title || '',
        body: text,
        mood,
        shift,
        promptTitle: prompt.title || null,
        promptLineage: prompt.lineage || null,
      });
      setStep('done');
    } catch (err) {
      if (err.status === 401) {
        setSaveError('Sign in to keep this entry. Your draft is still here.');
      } else {
        setSaveError(err.data?.error || err.message || 'Could not save. Try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in" style={{ padding: '4px 22px 24px' }}>
      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => go('journal')} style={{
          background: 'transparent', border: 0, color: 'var(--hh-green)',
          cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          {Icon.back(18, 'currentColor')}<span>Journal</span>
        </button>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
          {mode} · {prompt.lineage}
        </span>
      </div>

      {step === 'write' && <>
        <Headline size="title" italic style={{ marginTop: 28 }}>
          {prompt.title}.
        </Headline>
        <p className="body" style={{ margin: '14px 0 26px' }}>{prompt.prompt}</p>

        <textarea
          className="hearth-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Begin anywhere. Don't edit. Let the deepest layer surface…"
          style={{ minHeight: 240, background: 'transparent', borderBottom: '1px solid rgba(31, 64, 69, 0.18)' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
            {wordCount} words · 03:42
          </span>
          <button className="btn btn-ember" onClick={() => setStep('mood')}>
            Continue
          </button>
        </div>
      </>}

      {step === 'mood' && <>
        <Headline size="title" italic style={{ marginTop: 28 }}>
          How does it sit, now?
        </Headline>
        <p className="body" style={{ margin: '14px 0 26px' }}>
          One word. Self-distancing language helps clarify what you actually feel.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {D.moodTags.map(t => (
            <button key={t} onClick={() => setMood(t)}
              style={{
                background: mood === t ? 'var(--hh-green)' : 'transparent',
                color: mood === t ? 'var(--hh-lace)' : 'var(--hh-green)',
                border: '1px solid var(--hh-green)', borderRadius: 0,
                padding: '10px 16px', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>{t}</button>
          ))}
        </div>
        <div style={{ marginTop: 28 }}>
          <button className="btn btn-ember" disabled={!mood}
            onClick={() => setStep('shift')} style={{ opacity: mood ? 1 : 0.4 }}>
            Continue
          </button>
        </div>
      </>}

      {step === 'shift' && <>
        <Headline size="title" italic style={{ marginTop: 28 }}>
          Did writing shift you?
        </Headline>
        <p className="body" style={{ margin: '14px 0 26px' }}>
          Reappraisal is a learnable skill. Naming the shift strengthens it.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 14 }}>
          {[-2, -1, 0, 1, 2].map(v => (
            <button key={v} onClick={() => setShift(v)} style={{
              padding: '18px 0',
              border: '1px solid var(--hh-green)',
              background: shift === v ? 'var(--hh-green)' : 'transparent',
              color: shift === v ? 'var(--hh-lace)' : 'var(--hh-green)',
              fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400,
              cursor: 'pointer', borderRadius: 0,
            }}>{v > 0 ? `+${v}` : v}</button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--paper-mute)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          <span>Heavier</span><span>Unchanged</span><span>Lighter</span>
        </div>
        <div style={{ marginTop: 32 }}>
          <button className="btn btn-ember" disabled={saving} onClick={keepEntry}
            style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Keeping…' : 'Keep this entry'}
          </button>
        </div>
        {saveError && (
          <p className="body-sm" style={{ marginTop: 14, color: 'var(--ember-deep, var(--ember))' }}>
            {saveError}
            {saveError.includes('Sign in') && (
              <> <span onClick={() => go('auth')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Sign in</span>.</>
            )}
          </p>
        )}
      </>}

      {step === 'done' && <div style={{ paddingTop: 80 }}>
        <Kicker>Kept</Kicker>
        <Headline size="display" italic style={{ marginTop: 14 }}>
          One more<br/>evening, written.
        </Headline>
        <p className="body" style={{ margin: '20px 0 32px', maxWidth: 320 }}>
          Felt {mood}. Writing made it {shift > 0 ? `${shift} lighter` : shift < 0 ? `${Math.abs(shift)} heavier` : 'unchanged'}. The page is the better friend tonight.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => go('home')}>Back home</button>
          <button className="btn btn-ghost" onClick={() => go('journal-archive')}>See the archive</button>
        </div>
      </div>}
    </div>
  );
}

export { HomeScreen, JournalScreen, JournalWriteScreen };
