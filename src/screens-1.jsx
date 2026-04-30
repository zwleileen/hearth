// Hearth — Home + Journal screens (editorial rebuild v3)
// Aesop / Frama. Old Lace paper, Midnight Green ink, four
// feature accents used as full color blocks, never tints.

import React from 'react';
import { ColorBlock, Headline, Icon, Kicker, Photo, Rule } from './atoms.jsx';
import { HEARTH_DATA } from './data.js';
import { api } from './api.js';

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
function computeJournalStats(entries) {
  const total = entries.length;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeek = entries.filter(e => new Date(e.createdAt) >= startOfWeek).length;

  const dayKey = (d) => d.toDateString();
  const dates = new Set(entries.map(e => dayKey(new Date(e.createdAt))));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dates.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { total, thisWeek, streak };
}

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

// Pick a quote deterministically from today's date so it stays stable
// across reloads within a day, but changes each new day.
function pickDailyQuote(quotes) {
  if (!quotes || !quotes.length) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return quotes[dayOfYear % quotes.length];
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
  const intro = (() => {
    if (part === 'morning')   return 'A quiet hour, before the day asks anything of you.';
    if (part === 'afternoon') return 'The day is mid-stride. A small return, on your terms.';
    if (part === 'evening')   return 'The light is going. The kettle is on. There is no hurry tonight.';
    return 'The world is quiet. You are still here, and that is something.';
  })();
  const quote = pickDailyQuote(D.dailyQuotes);

  const [stats, setStats] = useState1({ total: 0, thisWeek: 0, streak: 0 });
  const [items, setItems] = useState1(null);
  const [issueNote, setIssueNote] = useState1('');
  const [feedState, setFeedState] = useState1('loading'); // loading|ready|empty|unauthed
  const [savedFeed, setSavedFeed] = React.useState({}); // url -> true

  async function saveDiscoverItem(item) {
    const key = item.url || `${item.kind}:${item.title}`;
    if (savedFeed[key]) return;
    try {
      const kind = ['article', 'essay', 'news'].includes(item.kind) ? 'article' : item.kind;
      await api.bookmarks.create({
        kind,
        title: item.title,
        source: item.source || '',
        url: item.url || '',
        excerpt: item.dek || '',
        meta: { savedFrom: 'home', readTime: item.readTime, image: item.image },
      });
      setSavedFeed(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      if (err.status === 409) {
        setSavedFeed(prev => ({ ...prev, [key]: true }));
      }
    }
  }

  useEffect1(() => {
    let cancelled = false;
    (async () => {
      try {
        const { entries } = await api.journal.list();
        if (!cancelled) setStats(computeJournalStats(entries));
      } catch {
        // not authed or error: keep zeros
      }
    })();
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
        <p className="body" style={{ margin: '14px 0 0', maxWidth: 380 }}>
          {intro}
        </p>
        <div style={{ display: 'flex', gap: 28, marginTop: 26 }}>
          <HomeStat n={stats.streak} label="day streak"/>
          <HomeStat n={stats.total} label="entries kept"/>
          <HomeStat n={stats.thisWeek} label="this week"/>
        </div>
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

      {/* ── 3. Editorial spread — full reading room ── */}
      <section style={{ padding: '40px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <Kicker>From the reading room</Kicker>
          {feedState === 'ready' && (
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
              Today · {items.length} pieces
            </span>
          )}
        </div>
        {issueNote && feedState === 'ready' && (
          <p className="serif" style={{ margin: '6px 0 0', fontSize: 16, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-2)', maxWidth: 540, lineHeight: 1.4 }}>
            {issueNote}
          </p>
        )}

        {feedState === 'loading' && (
          <div style={{ marginTop: 22 }}>
            <Rule/>
            <div style={{ height: 220, background: 'var(--paper-line)', opacity: 0.3, marginTop: 18 }}/>
            <div style={{ height: 22, background: 'var(--paper-line)', opacity: 0.4, marginTop: 18, width: '70%' }}/>
            <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 10, width: '90%' }}/>
          </div>
        )}

        {feedState === 'unauthed' && (
          <div style={{ marginTop: 18 }}>
            <p className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 380 }}>
              Your reading room opens once you sign in.
            </p>
            <button className="btn btn-ghost" onClick={() => go('auth')} style={{ marginTop: 14 }}>
              Sign in
            </button>
          </div>
        )}

        {feedState === 'empty' && (
          <div style={{ marginTop: 18 }}>
            <p className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 380 }}>
              Today's reading room is being curated for you.
            </p>
          </div>
        )}

        {feedState === 'ready' && hero && (() => {
          const heroKey = hero.url || `${hero.kind}:${hero.title}`;
          const heroSaved = savedFeed[heroKey];
          return (
            <article style={{ marginTop: 22 }}>
              <div onClick={() => hero.url && window.open(hero.url, '_blank', 'noopener,noreferrer')}
                style={{ cursor: hero.url ? 'pointer' : 'default' }}>
                {hero.image ? (
                  <img
                    src={hero.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block', background: 'var(--paper-line)' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <Rule/>
                )}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Kicker accent="mute">{hero.kind}</Kicker>
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
                <Headline size="title" italic style={{ marginTop: 12 }}>
                  {hero.title}
                </Headline>
                <p className="body" style={{ margin: '12px 0 0', maxWidth: 540 }}>
                  {hero.dek}
                </p>
              </div>
            </article>
          );
        })()}

        {feedState === 'ready' && rest.length > 0 && (
          <>
            <div style={{ marginTop: 36 }}><Rule/></div>
            <div className="hearth-feed-grid" style={{ marginTop: 22 }}>
              {rest.map((it, i) => {
                const itemKey = it.url || `${it.kind}:${it.title}:${i}`;
                const itemSaved = savedFeed[itemKey];
                return (
                  <article key={itemKey} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div onClick={() => it.url && window.open(it.url, '_blank', 'noopener,noreferrer')}
                      style={{ cursor: it.url ? 'pointer' : 'default' }}>
                      {it.image ? (
                        <img
                          src={it.image}
                          alt=""
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', background: 'var(--paper-line)' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}
                      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Kicker accent="mute" style={{ fontSize: 9 }}>{it.kind}</Kicker>
                        {it.source && (
                          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                            · {it.source}
                          </span>
                        )}
                      </div>
                      <h3 className="serif" style={{ margin: '8px 0 6px', fontSize: 18, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.2, color: 'var(--hh-green)' }}>
                        {it.title}
                      </h3>
                      <p className="body-sm" style={{ margin: 0, lineHeight: 1.5 }}>
                        {it.dek}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10 }}>
                      {it.readTime ? (
                        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                          {it.readTime}
                        </div>
                      ) : <div/>}
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
          </>
        )}

        {/* Begin journal CTA — under the editorial spread */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--paper-line-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <p className="serif" style={{ margin: 0, fontSize: 17, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-2)' }}>
            And then, the page.
          </p>
          <button className="btn btn-ember" onClick={() => go('journal')}>
            Begin today's entry {Icon.arrow(14, 'var(--on-ember)')}
          </button>
        </div>
      </section>
    </div>
  );
}

// Small editorial stat — number in serif, label all-caps below
function HomeStat({ n, label }) {
  return (
    <div>
      <div className="serif" style={{
        fontSize: 28, fontWeight: 360, color: 'var(--hh-green)',
        lineHeight: 1, letterSpacing: '-0.01em',
      }}>{n}</div>
      <div style={{
        fontFamily: 'var(--sans)', fontSize: 9.5, fontWeight: 500,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--paper-mute)', marginTop: 6,
      }}>{label}</div>
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

function JournalScreen({ go }) {
  const D = HEARTH_DATA;
  const [tab, setTab] = useState1('evening');
  const list = tab === 'morning' ? D.morningPrompts : D.eveningPrompts;
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

  return (
    <div className="fade-in">
      {/* Cover */}
      <section style={{ padding: '14px 22px 32px' }}>
        <Kicker>The journal · Five & five</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          Write yourself<br/>warm.
        </Headline>
        <p className="body" style={{ margin: '14px 0 0', maxWidth: 320 }}>
          Five prompts for the morning, five for the evening. Drawn from the most replicated work in positive and clinical psychology — Seligman, Pennebaker, Neff, King.
        </p>
      </section>

      {/* Segmented — flat, editorial, no pill */}
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

      {/* Prompt list — numbered editorial */}
      <section style={{ padding: '0 22px' }}>
        {list.map((p, i) => (
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
                <Headline size="section" italic style={{ fontWeight: 380 }}>{p.title}.</Headline>
                <p className="body" style={{ margin: '8px 0 12px' }}>{p.prompt}</p>
                <Kicker accent="mute" style={{ fontSize: 9.5 }}>{p.lineage}</Kicker>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* Recent entries — only what the user has actually saved */}
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
