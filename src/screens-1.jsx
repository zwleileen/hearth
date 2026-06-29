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

// The three avenues to meaning (see docs/MEANING.md). Give outward,
// receive inward, carry steady. The home surfaces one as today's
// invitation and all three as standing doors. Each routes to the
// feature that lives most truly under it.
const AVENUES = [
  {
    key: 'give', word: 'Give', accent: 'var(--hh-ecru)', ink: 'var(--hh-ecru-deep)',
    meaning: 'Meaning through what you offer. The deed, the work, the thing only you can do.',
    route: 'rituals', cta: 'Begin a small act',
    prompts: [
      'Who could use something only you can give today?',
      'What small thing are you uniquely placed to do for someone?',
      'Where is your effort needed, not only wanted?',
      'What would you make today if no one were watching?',
    ],
  },
  {
    key: 'receive', word: 'Receive', accent: 'var(--hh-blue)', ink: 'var(--hh-blue-deep)',
    meaning: 'Meaning through what you let in. Beauty, awe, ideas worth stopping for.',
    route: 'receive', cta: 'Find what moves you',
    prompts: [
      'What is one thing worth stopping for today?',
      'What beauty have you been walking past?',
      'Who, or what, could you let move you today?',
      'If you slowed down once today, what would you notice?',
    ],
  },
  {
    key: 'carry', word: 'Carry', accent: 'var(--hh-dogwood)', ink: 'var(--hh-dogwood-deep)',
    meaning: 'Meaning through how you hold what you cannot change. The one freedom never taken from you.',
    route: 'kindle', cta: 'Sit with it',
    prompts: [
      'What are you holding that you could carry differently?',
      'What cannot be changed today, and how will you meet it?',
      'Where might there be meaning in something hard you carry?',
      'What would it mean to be gentle with the weight you carry?',
    ],
  },
];

function dayOfYearNum(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

// Today's single invitation: an avenue chosen by the day, then a prompt
// within it. Deterministic per day (stable across reloads), rotates
// across days, and mixes in a per-user offset so two readers differ.
function pickMeaningOfMoment(user) {
  const doy = dayOfYearNum();
  const off = user?.id ? hashStr(user.id) : 0;
  const avenue = AVENUES[(doy + off) % AVENUES.length];
  const prompt = avenue.prompts[(doy + off) % avenue.prompts.length];
  return { avenue, prompt };
}

// A line you keep in answer to the meaning of the moment. Persisted to
// the account via /api/meaning, so the record follows you across devices
// and accrues over time.
function todayKey() { return new Date().toISOString().slice(0, 10); }

// A soft arrival, the day and its part, no clock. "Tuesday morning."
function softWhen() {
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  const h = now.getHours();
  const part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  return `${weekday} ${part}`;
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
  const moment = pickMeaningOfMoment(user);

  const [answer, setAnswer] = useState1('');
  const [log, setLog] = useState1([]);
  const [keeping, setKeeping] = useState1(false);
  useEffect1(() => {
    let cancelled = false;
    (async () => {
      try {
        const { entries } = await api.meaning.list({ limit: 30 });
        if (!cancelled) setLog(entries || []);
      } catch { /* unauthed or transient: leave the log empty */ }
    })();
    return () => { cancelled = true; };
  }, []);
  const keptToday = log.find((e) => e.date === todayKey());
  async function keepAnswer() {
    const t = answer.trim();
    if (t.length < 2 || keeping) return;
    setKeeping(true);
    try {
      const { entry } = await api.meaning.create({
        text: t, prompt: moment.prompt, avenue: moment.avenue.key, date: todayKey(),
      });
      if (entry) { setLog((prev) => [entry, ...prev]); setAnswer(''); }
    } catch { /* keep the text in the box so the reader can try again */ }
    finally { setKeeping(false); }
  }
  const past = log.filter((e) => e.date !== todayKey()).slice(0, 4);

  // Your meaning narrative — the synthesis across everything you keep.
  // null = loading; { narrative, threads } once loaded.
  const [narr, setNarr] = useState1(null);
  useEffect1(() => {
    let cancelled = false;
    api.narrative.get()
      .then((d) => { if (!cancelled) setNarr(d || { narrative: '', threads: [] }); })
      .catch(() => { if (!cancelled) setNarr({ narrative: '', threads: [] }); });
    return () => { cancelled = true; };
  }, []);
  function refreshNarr() {
    setNarr(null);
    api.narrative.get({ refresh: true })
      .then((d) => setNarr(d || { narrative: '', threads: [] }))
      .catch(() => setNarr({ narrative: '', threads: [] }));
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      {/* ── Masthead: a soft arrival, the greeting, the inscription ── */}
      <section className="hh-home-masthead" style={{ padding: '22px 22px 32px' }}>
        <div className="hh-home-glow" aria-hidden="true"/>
        <Kicker>{softWhen()}</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          {greet}
        </Headline>
        <p className="serif" style={{
          margin: '20px 0 0', fontSize: 18, lineHeight: 1.5, fontStyle: 'italic',
          fontWeight: 380, color: 'var(--paper-2)', maxWidth: 470,
        }}>
          Give, receive, carry. There is always a door to meaning, even when one or two are closed.
        </p>
      </section>

      {/* ── Your meaning, this season: the synthesis across everything ── */}
      <section style={{ padding: '34px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">Your meaning, this season</span>
          {narr && narr.narrative && (
            <button onClick={refreshNarr} className="hearth-dept-head-meta"
              style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
              Weave again
            </button>
          )}
        </div>
        {narr === null ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 13, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '92%' }}/>
            <div style={{ height: 13, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '78%' }}/>
            <div style={{ height: 13, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '58%' }}/>
          </div>
        ) : narr.narrative ? (
          <div className="fade-in">
            <p className="serif" style={{ margin: '16px 0 0', fontSize: 20, lineHeight: 1.55, fontWeight: 380, color: 'var(--hh-green)', maxWidth: 580 }}>
              {narr.narrative}
            </p>
            {Array.isArray(narr.threads) && narr.threads.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                {narr.threads.map((t, i) => (
                  <span key={i} className="mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--hh-green)', border: '1px solid rgba(31, 64, 69, 0.18)', padding: '5px 11px' }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="serif" style={{ margin: '16px 0 0', fontSize: 17, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 460, lineHeight: 1.5 }}>
            As you notice, write, and keep what moves you, your sense of meaning will take shape here.
          </p>
        )}
      </section>

      {/* ── The meaning of this moment: prompt + answer, one block ── */}
      <section style={{ padding: '40px 22px 0' }}>
        <div className="hh-moment" style={{ background: moment.avenue.accent }}>
          <span className="hh-moment-eyebrow">The meaning of this moment</span>
          <p className="hh-moment-prompt">{moment.prompt}</p>

          {keptToday ? (
            <div className="fade-in" style={{ marginBottom: 18 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hh-green)', opacity: 0.65, marginBottom: 8 }}>
                Kept. Today, you noticed
              </div>
              <p className="serif" style={{ margin: 0, fontSize: 18, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)' }}>
                {keptToday.text}
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 18 }}>
              <textarea
                className="hearth-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer in a line, if it comes to you…"
                style={{ minHeight: 64, background: 'var(--hh-lace)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '14px 16px' }}
              />
              <div style={{ marginTop: 14 }}>
                {(() => {
                  const ready = answer.trim().length >= 2 && !keeping;
                  return (
                    <button onClick={keepAnswer} disabled={!ready} style={{
                      background: ready ? 'var(--hh-green)' : 'transparent',
                      color: ready ? 'var(--hh-lace)' : 'var(--paper-mute)',
                      border: ready ? 0 : '1px solid rgba(31, 64, 69, 0.25)',
                      padding: '12px 20px', cursor: ready ? 'pointer' : (keeping ? 'wait' : 'not-allowed'),
                      fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
                      letterSpacing: '0.22em', textTransform: 'uppercase',
                    }}>
                      {keeping ? 'Keeping…' : 'Keep it'}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          <button onClick={() => go(moment.avenue.route)} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            color: 'var(--hh-green)', fontFamily: 'var(--mono)', fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span>Step into {moment.avenue.word}</span>
            {Icon.arrow(14, 'currentColor')}
          </button>
        </div>
      </section>

      {/* ── What you've been noticing: the meaning log ── */}
      {past.length > 0 && (
        <section style={{ padding: '34px 22px 0' }}>
          <div className="hearth-dept-head">
            <span className="hearth-dept-head-title">What you've been noticing</span>
            <button onClick={() => go('meaning-log')} className="hearth-dept-head-meta"
              style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
              See all
            </button>
          </div>
          <div style={{ marginTop: 4 }}>
            {past.map((e, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(31, 64, 69, 0.10)', padding: '16px 0' }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--paper-mute)', marginBottom: 6 }}>
                  {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <p className="serif" style={{ margin: 0, fontSize: 16, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)' }}>
                  {e.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── A closing grace: the daily quote, changes each day ── */}
      {quote && (
        <section style={{ padding: '48px 22px 8px' }}>
          <Rule glyph="◆"/>
          <div style={{ padding: '32px 0 28px', textAlign: 'center' }}>
            <p className="serif" style={{
              margin: '0 auto', maxWidth: 540,
              fontSize: 20, lineHeight: 1.45, fontWeight: 360, fontStyle: 'italic',
              color: 'var(--paper-2)', letterSpacing: '-0.005em',
            }}>
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mono" style={{
              fontSize: 9, letterSpacing: '0.22em', color: 'var(--paper-mute)',
              marginTop: 20, textTransform: 'uppercase',
            }}>
              {quote.author}{quote.source ? ` · ${quote.source}` : ''}{quote.year ? ` · ${quote.year}` : ''}
            </p>
          </div>
        </section>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// READING ROOM — the Receive surface (was the body of Home).
// A small daily-curated room of things worth taking in: essays,
// poems, slow news. Reached via the Receive door on Home.
// ─────────────────────────────────────────────────────────────
function ReadingRoomScreen({ go }) {
  const [items, setItems] = useState1(null);
  const [issueNote, setIssueNote] = useState1('');
  const [feedState, setFeedState] = useState1('loading'); // loading|ready|empty|unauthed
  const [bookmarks, setBookmarks] = React.useState([]);

  async function saveDiscoverItem(item) {
    if (isItemBookmarked(bookmarks, item)) return;
    try {
      const kind = bookmarkKindFor(item);
      const { bookmark } = await api.bookmarks.create({
        kind, title: item.title, source: item.source || '', url: item.url || '',
        excerpt: item.dek || '',
        meta: { savedFrom: 'reading', readTime: item.readTime, image: item.image },
      });
      if (bookmark) setBookmarks(prev => [bookmark, ...prev]);
    } catch (err) {
      if (err.status === 409) {
        try { const { bookmarks: latest } = await api.bookmarks.list(); setBookmarks(latest || []); } catch {}
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
        setFeedState(err.status === 401 ? 'unauthed' : 'empty');
      }
    })();
    (async () => {
      try { const { bookmarks: list } = await api.bookmarks.list(); if (!cancelled) setBookmarks(list || []); } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const hero = items?.[0];
  const rest = items?.slice(1) || [];

  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      {/* breadcrumb */}
      <section style={{ padding: '4px 22px 0' }}>
        <button onClick={() => go('home')} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          {Icon.back(18, 'currentColor')}<span>Home</span>
        </button>
      </section>

      {/* header */}
      <section style={{ padding: '20px 22px 0' }}>
        <Kicker>Receive</Kicker>
        <Headline size="display" style={{ marginTop: 12 }}>
          The reading room.
        </Headline>
        <p className="body" style={{ margin: '14px 0 0', maxWidth: 460 }}>
          A small room of things worth taking in. Essays, poems, slow news, gathered fresh for you each day. Meaning through what you let in.
        </p>
      </section>

      {/* the spread */}
      <section style={{ padding: '40px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">Today's room</span>
          {feedState === 'ready' && (
            <span className="hearth-dept-head-meta">{items.length} {items.length === 1 ? 'piece' : 'pieces'}</span>
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


// A door row, the shared building block of every avenue hub. onClick is
// a thunk so a row can open a screen or a specific practice.
function DoorRow({ word, meaning, ink, onClick }) {
  return (
    <button className="hh-door" onClick={onClick}>
      <span className="hh-door-head">
        <span className="hh-door-word" style={ink ? { color: ink } : undefined}>{word}</span>
        <span className="hh-door-arrow">{Icon.arrow(18, 'currentColor')}</span>
      </span>
      <span className="hh-door-meaning">{meaning}</span>
    </button>
  );
}

// Open a practice (ritual) by key, via the shared ritual-detail screen.
function openRitual(go, key) {
  const r = (HEARTH_DATA.rituals || []).find((x) => x.key === key);
  if (r) go('ritual-detail', { ritual: r });
}

// ─────────────────────────────────────────────────────────────
// GIVE — avenue hub. Meaning through what you offer: the deed only
// you can do, the turn toward someone who needs you. Frankl's
// creative values, and the engine of self-transcendence.
// ─────────────────────────────────────────────────────────────
const GIVE_DEEDS = [
  'Who could use something only you can give today?',
  'Send the message you have been meaning to send.',
  'Offer help to one person before they have to ask.',
  'Tell someone exactly what they did that mattered.',
  'Make something small, and give it away.',
  'Give one person your whole attention today.',
  'Do the quiet, unglamorous thing that helps everyone.',
];

function GiveScreen({ go, user }) {
  const off = user?.id ? hashStr(user.id) : 0;
  const deed = GIVE_DEEDS[(dayOfYearNum() + off) % GIVE_DEEDS.length];
  const ways = [
    { word: 'An act of kindness', prompt: 'One kindness you could do today, and who it is for.', meaning: 'A small kindness, done on purpose. The lift it gives the giver is one of the most reliable findings in the field.' },
    { word: 'A gratitude letter', prompt: 'Someone whose effect on you they may not know, and what you would tell them.', meaning: 'Name what they did and what it gave you. Deliver it if you can.' },
    { word: 'Share what you know', prompt: 'One thing only you can pass on, and who needs it.', meaning: 'Teach or hand on something only you carry. Meaning grows by being given away.' },
    { word: 'Give your attention', prompt: 'Who will have your whole, undivided attention today.', meaning: 'Be wholly present to one person. Attention is the rarest thing we have to offer.' },
  ];

  const [chosen, setChosen] = useState1(null);
  const captureRef = React.useRef(null);
  const activePrompt = chosen ? chosen.prompt : deed;
  const activeLabel = chosen ? chosen.word : 'The deed of the day';
  const [answer, setAnswer] = useState1('');
  const [log, setLog] = useState1([]);
  const [keeping, setKeeping] = useState1(false);
  useEffect1(() => {
    let cancelled = false;
    (async () => {
      try {
        const { entries } = await api.meaning.list({ limit: 30 });
        if (!cancelled) setLog((entries || []).filter((e) => e.avenue === 'give'));
      } catch { /* unauthed or transient */ }
    })();
    return () => { cancelled = true; };
  }, []);
  async function keepGiving() {
    const t = answer.trim();
    if (t.length < 2 || keeping) return;
    setKeeping(true);
    try {
      const { entry } = await api.meaning.create({ text: t, prompt: activePrompt, avenue: 'give', date: todayKey() });
      if (entry) { setLog((prev) => [entry, ...prev]); setAnswer(''); }
    } catch { /* keep the text so the reader can retry */ }
    finally { setKeeping(false); }
  }
  const ready = answer.trim().length >= 2 && !keeping;
  const recent = log.slice(0, 3);

  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      <section style={{ padding: '14px 22px 0' }}>
        <Kicker accent="ecru">Give</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          What you offer.
        </Headline>
        <p className="body" style={{ margin: '16px 0 0', maxWidth: 460 }}>
          Meaning through what you give, make, and do. The deed only you can do, the turn toward someone who needs you. We are most ourselves when we reach beyond ourselves.
        </p>
      </section>

      {/* The deed, with an inline keep into the meaning log */}
      <section style={{ padding: '34px 22px 0' }}>
        <div className="hh-moment" style={{ background: 'var(--hh-ecru)' }}>
          <span className="hh-moment-eyebrow">{activeLabel}</span>
          <p className="hh-moment-prompt">{activePrompt}</p>
          <textarea
            ref={captureRef}
            className="hearth-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Keep a line: what you'll give, or did…"
            style={{ minHeight: 64, background: 'var(--hh-lace)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '14px 16px' }}
          />
          <div style={{ marginTop: 14 }}>
            <button onClick={keepGiving} disabled={!ready} style={{
              background: ready ? 'var(--hh-green)' : 'transparent',
              color: ready ? 'var(--hh-lace)' : 'var(--paper-mute)',
              border: ready ? 0 : '1px solid rgba(31, 64, 69, 0.25)',
              padding: '12px 20px', cursor: ready ? 'pointer' : (keeping ? 'wait' : 'not-allowed'),
              fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>
              {keeping ? 'Keeping…' : 'Keep it'}
            </button>
          </div>
        </div>
      </section>

      {/* Ways to give — tap one to make it today's intention */}
      <section style={{ padding: '44px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">Ways to give</span>
          <span className="hearth-dept-head-meta">tap to choose</span>
        </div>
        <div className="hh-doors" style={{ marginTop: 6 }}>
          {ways.map((w) => {
            const on = chosen?.word === w.word;
            return (
              <button key={w.word} className="hh-door" onClick={() => {
                  const next = on ? null : w;
                  setChosen(next);
                  setAnswer('');
                  if (next && captureRef.current) {
                    captureRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { try { captureRef.current && captureRef.current.focus(); } catch {} }, 360);
                  }
                }}
                style={on ? { background: 'rgba(225, 190, 116, 0.20)' } : undefined}>
                <span className="hh-door-head">
                  <span className="hh-door-word" style={{ color: 'var(--hh-ecru-deep)' }}>{w.word}</span>
                  {on
                    ? <span className="mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--hh-ecru-deep)' }}>chosen ↑</span>
                    : <span className="hh-door-arrow">{Icon.arrow(18, 'currentColor')}</span>}
                </span>
                <span className="hh-door-meaning">{w.meaning}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* What you've given lately */}
      {recent.length > 0 && (
        <section style={{ padding: '40px 22px 0' }}>
          <div className="hearth-dept-head">
            <span className="hearth-dept-head-title">Lately, you gave</span>
          </div>
          <div style={{ marginTop: 4 }}>
            {recent.map((e, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(31, 64, 69, 0.10)', padding: '16px 0' }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--paper-mute)', marginBottom: 6 }}>
                  {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <p className="serif" style={{ margin: 0, fontSize: 16, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)' }}>
                  {e.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RECEIVE — avenue hub. Ways to be moved: Attune (sound), the
// reading room (words), and savoring (awe, noticing the good).
// Meaning through what you let in.
// ─────────────────────────────────────────────────────────────
function ReceiveScreen({ go }) {
  const ink = 'var(--hh-blue-deep)';
  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      <section style={{ padding: '14px 22px 0' }}>
        <Kicker accent="blue">Receive</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          What moves you.
        </Headline>
        <p className="body" style={{ margin: '16px 0 0', maxWidth: 460 }}>
          Meaning through what you let in: beauty, awe, ideas, another person. Let the world reach you.
        </p>
      </section>
      <section style={{ padding: '40px 22px 0' }}>
        <div className="hh-doors">
          <DoorRow word="Attune" ink={ink} meaning="Songs and poems shaped to how you feel right now. Met where you are, then moved with, gently." onClick={() => go('attune')} />
          <DoorRow word="The reading room" ink={ink} meaning="A small daily room of essays, poems, and slow news worth stopping for." onClick={() => go('reading')} />
        </div>
      </section>
      <section style={{ padding: '40px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">Savor</span>
          <span className="hearth-dept-head-meta">a few minutes</span>
        </div>
        <div className="hh-doors" style={{ marginTop: 6 }}>
          <DoorRow word="An awe walk" ink={ink} meaning="A walk with attention turned outward, toward the vast or the beautiful. It widens the day." onClick={() => openRitual(go, 'awe')} />
          <DoorRow word="Three good things" ink={ink} meaning="Notice three that went right, and your part in them. Small, and steadying over time." onClick={() => openRitual(go, 'gratitude')} />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// YOURS — your inner record. Journal, Nook, the weekly Meaning
// Mirror, and the reflective practices (values, the weekly review).
// ─────────────────────────────────────────────────────────────
function YoursScreen({ go }) {
  const [brief, setBrief] = useState1('');
  useEffect1(() => {
    let cancelled = false;
    (async () => {
      try { const { brief } = await api.digest.journalBrief(); if (!cancelled) setBrief(brief || ''); } catch { /* cold start / unauth */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      <section style={{ padding: '14px 22px 0' }}>
        <Kicker>Yours</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          Your inner record.
        </Headline>
        <p className="body" style={{ margin: '16px 0 0', maxWidth: 460 }}>
          What you have written, kept, and noticed. Yours alone, here whenever you want it.
        </p>
      </section>

      {brief && (
        <section style={{ padding: '32px 22px 0' }}>
          <div style={{ background: 'var(--hh-isabel)', padding: '22px 24px' }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hh-green)', marginBottom: 10 }}>
              The meaning mirror · this week
            </div>
            <p className="serif" style={{ margin: 0, fontSize: 17, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--hh-green)' }}>
              {brief}
            </p>
          </div>
        </section>
      )}

      <section style={{ padding: '36px 22px 0' }}>
        <div className="hh-doors">
          <DoorRow word="Journal" meaning="Your reflections. The page where you write yourself a little clearer." onClick={() => go('journal')} />
          <DoorRow word="The meaning log" meaning="Every line you've kept in answer to the meaning of the moment." onClick={() => go('meaning-log')} />
          <DoorRow word="Nook" meaning="Everything you have kept close. Your anthology of what matters." onClick={() => go('bookmarks')} />
        </div>
      </section>

      <section style={{ padding: '40px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">Look back</span>
        </div>
        <div className="hh-doors" style={{ marginTop: 6 }}>
          <DoorRow word="Values check-in" meaning="Name the values most alive this week, and one small move toward them." onClick={() => openRitual(go, 'values')} />
          <DoorRow word="The weekly review" meaning="A quiet look across your week: what threaded through, what kept company with you." onClick={() => go('weekly-digest')} />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MEANING LOG — the full record of lines kept in answer to the
// meaning of the moment (and to giving). Lives under Yours.
// ─────────────────────────────────────────────────────────────
const AVENUE_WORD = { give: 'Give', receive: 'Receive', carry: 'Carry' };

function MeaningLogScreen({ go }) {
  const [entries, setEntries] = useState1(null);
  const [error, setError] = useState1(null);
  useEffect1(() => {
    let cancelled = false;
    (async () => {
      try { const { entries } = await api.meaning.list({ limit: 100 }); if (!cancelled) setEntries(entries || []); }
      catch (e) { if (!cancelled) setError(e); }
    })();
    return () => { cancelled = true; };
  }, []);
  async function remove(id) {
    try { await api.meaning.remove(id); setEntries((prev) => (prev || []).filter((e) => e.id !== id)); } catch { /* leave as is */ }
  }
  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      <section style={{ padding: '4px 22px 0' }}>
        <button onClick={() => go('yours')} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          {Icon.back(18, 'currentColor')}<span>Yours</span>
        </button>
      </section>
      <section style={{ padding: '20px 22px 0' }}>
        <Kicker>The meaning log</Kicker>
        <Headline size="display" style={{ marginTop: 12 }}>What you've noticed.</Headline>
        <p className="body" style={{ margin: '14px 0 0', maxWidth: 460 }}>
          Every line you have kept, in answer to the meaning of the moment. Yours to return to.
        </p>
      </section>
      <section style={{ padding: '32px 22px 0' }}>
        {error && error.status === 401 && (
          <p className="body" style={{ color: 'var(--paper-mute)' }}>
            <span onClick={() => go('auth')} style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--ember)' }}>Sign in</span> to see your log.
          </p>
        )}
        {!error && entries === null && (
          <div>
            <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '50%' }}/>
            <div style={{ height: 18, background: 'var(--paper-line)', opacity: 0.3, marginTop: 10, width: '85%' }}/>
          </div>
        )}
        {!error && Array.isArray(entries) && entries.length === 0 && (
          <p className="serif" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 380 }}>
            Nothing kept yet. Answer the meaning of the moment on the home page, and your lines will gather here.
          </p>
        )}
        {Array.isArray(entries) && entries.length > 0 && entries.map((e) => (
          <div key={e.id} style={{ borderBottom: '1px solid rgba(31, 64, 69, 0.10)', padding: '20px 0', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                {new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              {AVENUE_WORD[e.avenue] && (
                <span className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--hh-green)', textTransform: 'uppercase', padding: '2px 9px', border: '1px solid rgba(31, 64, 69, 0.18)' }}>
                  {AVENUE_WORD[e.avenue]}
                </span>
              )}
            </div>
            <p className="serif" style={{ margin: '12px 0 0', fontSize: 18, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)' }}>
              {e.text}
            </p>
            {e.prompt && (
              <p className="body-sm" style={{ margin: '8px 0 0', color: 'var(--paper-mute)' }}>
                in answer to: {e.prompt}
              </p>
            )}
            <button onClick={() => remove(e.id)} aria-label="Remove" style={{
              position: 'absolute', top: 20, right: 0, background: 'transparent', border: 0,
              padding: '4px 8px', cursor: 'pointer', color: 'var(--paper-mute)',
              fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase',
              opacity: 0, transition: 'opacity 200ms ease',
            }}
              onMouseEnter={(ev) => ev.currentTarget.style.opacity = 1}
              onMouseLeave={(ev) => ev.currentTarget.style.opacity = 0}
              onFocus={(ev) => ev.currentTarget.style.opacity = 1}
              onBlur={(ev) => ev.currentTarget.style.opacity = 0}
            >Remove</button>
          </div>
        ))}
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

// A blank page — the free-write. Always available, for any mood that no
// prompt quite holds. The most evidence-based mode of all (Pennebaker's
// expressive writing is, at heart, a blank page).
const BLANK_PAGE = {
  title: 'A blank page',
  lineage: 'Pennebaker, 1997',
  prompt: 'No prompt, no shape. Write whatever is here, for as long as it wants to be written.',
};

function JournalScreen({ go, user }) {
  const D = HEARTH_DATA;
  const [tab, setTab] = useState1('evening');
  const [recent, setRecent] = useState1(null);
  const [recentError, setRecentError] = useState1(null);
  // Weekly reflection brief for the top of the page. Best-effort; a
  // failure or cold start just leaves it empty and the section hides.
  const [brief, setBrief] = useState1('');

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
    (async () => {
      try {
        const { brief } = await api.digest.journalBrief();
        if (!cancelled) setBrief(brief || '');
      } catch { /* cold start / unauth: leave empty */ }
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
        <p className="body" style={{ margin: '14px 0 0', maxWidth: 360 }}>
          Prompts drawn from the most replicated work in positive and clinical psychology: Seligman, Pennebaker, Neff, King, Lyubomirsky, Gollwitzer, Frankl. We surface the ones closest to where you are, and keep a blank page for the rest.
        </p>
      </section>

      {/* Weekly reflection — what's been on your mind, across the journal */}
      {brief && (
        <section style={{ padding: '0 22px 20px' }}>
          <div style={{ background: 'var(--hh-isabel)', padding: '22px 24px' }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hh-green)', marginBottom: 10 }}>
              This season in your journal
            </div>
            <p className="serif" style={{ margin: 0, fontSize: 16.5, lineHeight: 1.65, fontStyle: 'italic', color: 'var(--hh-green)' }}>
              {brief}
            </p>
          </div>
        </section>
      )}

      {/* A blank page — the free-write, always here, for any mood */}
      <section style={{ padding: '0 22px 22px' }}>
        <button onClick={() => go('journal-write', { prompt: BLANK_PAGE, mode: 'free' })} style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0,
          padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hh-lace)', opacity: 0.7, marginBottom: 8 }}>
              Begin anywhere
            </div>
            <Headline size="section" italic style={{ color: 'var(--hh-lace)', fontWeight: 380 }}>A blank page.</Headline>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--hh-lace)', opacity: 0.85 }}>
              No prompt, no shape. For whatever today is, or whatever a prompt does not quite hold.
            </p>
          </div>
          {Icon.arrow(16, 'var(--hh-lace)')}
        </button>
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

export { HomeScreen, ReadingRoomScreen, GiveScreen, ReceiveScreen, YoursScreen, MeaningLogScreen, JournalScreen, JournalWriteScreen };
