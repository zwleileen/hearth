// Hearth — Kindle. A guided logotherapy session in Viktor Frankl's
// method. The reader types how they feel and is guided through five
// movements (a seeing, a widening question, a companion who faced the
// same dark, the avenue of meaning being asked of them, a small step),
// then answers the one question and receives a closing turning.
//
// Editorial register matches Attune: quiet, serif, Midnight Green ink on
// Old Lace paper, no chrome decoration. Built on the same view-state
// machine and logbook pattern as AttuneScreen.

import React from 'react';
import { Headline, Kicker, Rule, Icon } from './atoms.jsx';
import { HEARTH_DATA } from './data.js';
import { api } from './api.js';

const { useState: useState5 } = React;

// Frankl's three avenues, in the reader's language.
const AVENUE_LABEL = {
  creating: 'Through what you make',
  experiencing: 'Through who, and what, you love',
  attitude: 'Through how you carry it',
};

// ── Care block ────────────────────────────────────────────────────────
// Shown only when acute distress was detected. Quiet, never alarmist.
// The numbers come from the server (never the model), so they are real.
function CareBlock({ care }) {
  if (!care || !care.flagged) return null;
  return (
    <section style={{ padding: '28px 22px 0' }}>
      <div style={{
        background: 'var(--hh-isabel)', borderLeft: '2px solid var(--hh-green)',
        padding: '20px 22px',
      }}>
        <div className="mono" style={{
          fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--hh-green)', marginBottom: 12,
        }}>
          Before we go on
        </div>
        {care.note && (
          <p className="body" style={{ margin: 0, color: 'var(--paper-2)', lineHeight: 1.6 }}>
            {care.note}
          </p>
        )}
        <div style={{ marginTop: 16 }}>
          {(care.lines || []).map((l, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              gap: 12, padding: '8px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(31, 64, 69, 0.10)',
            }}>
              <span className="body" style={{ fontSize: 13.5, color: 'var(--hh-green)' }}>
                {l.name}
                {l.detail && <span style={{ color: 'var(--paper-mute)' }}> · {l.detail}</span>}
              </span>
              <span className="mono" style={{
                fontSize: 12, letterSpacing: '0.06em', color: 'var(--hh-green)', whiteSpace: 'nowrap',
              }}>
                {l.contact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// A labelled movement block: a kicker, then serif body. The shared
// shape of every part of the session.
function Movement({ label, accent = 'green', children, style = {} }) {
  return (
    <section style={{ padding: '40px 22px 0', ...style }}>
      <Kicker accent={accent}>{label}</Kicker>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

function KindleScreen({ go }) {
  const D = HEARTH_DATA;
  // input → typing; session → reading a session (live or from logbook);
  // logbook → browsing past sessions.
  const [view, setView] = useState5('input');
  const [text, setText] = useState5('');
  const [busy, setBusy] = useState5(false);
  const [error, setError] = useState5(null);

  // The session currently on screen. Shape:
  //   { id, session, care, reply, replyTurning, fromLogbook, createdAt }
  const [current, setCurrent] = useState5(null);
  const [reply, setReply] = useState5('');
  const [replyBusy, setReplyBusy] = useState5(false);
  const [replyError, setReplyError] = useState5(null);

  const [logbook, setLogbook] = useState5({ entries: [], hasMore: false, loading: false, error: null });

  function toError(err) {
    if (err.status === 401) return { kind: 'unauthed' };
    if (err.status === 503) return { kind: 'unconfigured' };
    return { kind: 'other', detail: err.data?.error || err.message };
  }

  async function beginSession() {
    if (busy || text.trim().length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.kindle.session({ feeling: text.trim() });
      setCurrent({
        id: data.id,
        feeling: text.trim(),
        session: data.session,
        care: data.care,
        reply: '',
        replyTurning: null,
        fromLogbook: false,
        createdAt: data.createdAt,
      });
      setReply('');
      setReplyError(null);
      setView('session');
      // Invalidate cached logbook so the new session appears next open.
      setLogbook({ entries: [], hasMore: false, loading: false, error: null });
    } catch (err) {
      setError(toError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReply() {
    if (replyBusy || !current?.id || reply.trim().length < 2) return;
    setReplyBusy(true);
    setReplyError(null);
    try {
      const data = await api.kindle.reply(current.id, { reply: reply.trim() });
      setCurrent((c) => ({
        ...c,
        reply: reply.trim(),
        replyTurning: data.turning,
        // A reply can surface distress even if the opening was calm.
        care: data.care || c.care,
      }));
    } catch (err) {
      setReplyError(toError(err));
    } finally {
      setReplyBusy(false);
    }
  }

  async function openLogbook() {
    setView('logbook');
    if (logbook.entries.length > 0 || logbook.loading) return;
    setLogbook((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.kindle.log({ limit: 30 });
      setLogbook({ entries: data.entries || [], hasMore: !!data.hasMore, loading: false, error: null });
    } catch (err) {
      setLogbook({
        entries: [], hasMore: false, loading: false,
        error: err.status === 401 ? 'Sign in to see your sessions.' : (err.data?.error || 'Could not load your sessions.'),
      });
    }
  }

  async function loadMoreLog() {
    if (logbook.loading || !logbook.hasMore || logbook.entries.length === 0) return;
    const oldest = logbook.entries[logbook.entries.length - 1];
    setLogbook((s) => ({ ...s, loading: true }));
    try {
      const data = await api.kindle.log({ limit: 30, before: oldest.createdAt });
      setLogbook((s) => ({
        entries: [...s.entries, ...(data.entries || [])],
        hasMore: !!data.hasMore, loading: false, error: null,
      }));
    } catch (err) {
      setLogbook((s) => ({ ...s, loading: false, error: err.data?.error || 'Could not load more.' }));
    }
  }

  function openLogEntry(entry) {
    setCurrent({
      id: entry.id,
      feeling: entry.feeling,
      session: entry.session,
      care: null, // resources are shown live, not re-surfaced in the calm of the logbook
      reply: entry.reply || '',
      replyTurning: entry.replyTurning || null,
      fromLogbook: true,
      createdAt: entry.createdAt,
    });
    setReply('');
    setReplyError(null);
    setView('session');
  }

  async function deleteLogEntry(id) {
    try {
      await api.kindle.deleteEntry(id);
      setLogbook((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
    } catch (err) {
      console.warn('Failed to delete session', err);
    }
  }

  // ── Loading view ──────────────────────────────
  if (busy) {
    return (
      <div className="fade-in" style={{ paddingBottom: 32 }}>
        <section style={{ padding: '14px 22px 0' }}>
          <Kicker>Carry</Kicker>
          <Headline size="display" italic style={{ marginTop: 14 }}>
            Sitting with<br/>you, a moment.
          </Headline>
          <p className="body" style={{ margin: '18px 0 28px', maxWidth: 380 }}>
            Reading what you wrote. Finding who has stood here before.
          </p>
          <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.4, marginTop: 18, width: '70%' }}/>
          <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '50%' }}/>
          <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 8, width: '85%' }}/>
        </section>
      </div>
    );
  }

  // ── Session view (live or from logbook) ───────
  if (view === 'session' && current?.session) {
    const s = current.session;
    const fromLog = current.fromLogbook;
    const rt = current.replyTurning;
    const avenue = AVENUE_LABEL[s.turning?.avenue] || "What's being asked";
    const MIRROR_LABEL = { person: 'Someone who stood here', story: 'Someone who stood here', nature: 'An image that meets you', parable: 'A small parable', image: 'An image that meets you' };
    const mirrorLabel = MIRROR_LABEL[s.companion?.kind] || 'Someone who stood here';

    return (
      <div className="fade-in" style={{ paddingBottom: 56 }}>
        {/* breadcrumb */}
        <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => {
            if (fromLog) { setCurrent(null); setView('logbook'); }
            else { setCurrent(null); setText(''); setView('input'); }
          }} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            {Icon.back(18, 'currentColor')}<span>{fromLog ? 'Sessions' : 'Start again'}</span>
          </button>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
            {fromLog ? 'A past session' : 'A session'}
          </span>
        </section>

        {/* What the reader wrote (always shown; grounds the session) */}
        <section style={{ padding: '24px 22px 0' }}>
          {fromLog && (
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 8 }}>
              {new Date(current.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
          <p className="body" style={{ margin: 0, fontStyle: 'italic', color: 'var(--paper-mute)' }}>
            "{current.feeling}"
          </p>
        </section>

        <CareBlock care={current.care}/>

        {/* 1. The seeing */}
        <Movement label={s.feelingName || 'Where you are'}>
          <p className="serif" style={{
            margin: 0, fontSize: 22, lineHeight: 1.45, fontWeight: 360,
            fontStyle: 'italic', color: 'var(--hh-green)', maxWidth: 560,
          }}>
            {s.seeing}
          </p>
        </Movement>

        {/* 2. The widening */}
        <Movement label="What it points to">
          <p className="body" style={{ margin: 0, lineHeight: 1.7, maxWidth: 560 }}>
            {s.widening?.reflection}
          </p>
          {s.widening?.question && (
            <p className="serif" style={{
              margin: '20px 0 0', fontSize: 19, lineHeight: 1.5, fontWeight: 400,
              fontStyle: 'italic', color: 'var(--hh-green)', maxWidth: 560,
            }}>
              {s.widening.question}
            </p>
          )}
        </Movement>

        {/* 3. The companion */}
        <section style={{ padding: '44px 22px 0' }}>
          <Rule glyph="◆"/>
        </section>
        <Movement label={mirrorLabel} accent="ecru" style={{ paddingTop: 28 }}>
          <Headline size="title" italic style={{ marginBottom: 6 }}>
            {s.companion?.name}
          </Headline>
          {s.companion?.source && (
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginBottom: 16 }}>
              {s.companion.source}
            </div>
          )}
          <p className="body" style={{ margin: 0, lineHeight: 1.7, maxWidth: 560 }}>
            {s.companion?.predicament}
          </p>
          <p className="body" style={{ margin: '14px 0 0', lineHeight: 1.7, maxWidth: 560 }}>
            {s.companion?.turning}
          </p>
          {s.companion?.line && (
            <blockquote className="serif" style={{
              margin: '22px 0 0', padding: '0 0 0 18px', borderLeft: '2px solid var(--hh-ecru-deep)',
              fontSize: 18, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)', maxWidth: 540,
            }}>
              {s.companion.line}
            </blockquote>
          )}
        </Movement>

        {/* 4. The turning (avenue) */}
        <section style={{ padding: '44px 22px 0' }}>
          <Rule glyph="◆"/>
        </section>
        <Movement label={avenue} accent="blue" style={{ paddingTop: 28 }}>
          <p className="serif" style={{
            margin: 0, fontSize: 20, lineHeight: 1.55, fontWeight: 380, color: 'var(--hh-green)', maxWidth: 560,
          }}>
            {s.turning?.insight}
          </p>
        </Movement>

        {/* 5. A small step */}
        <Movement label="A small step, today" accent="dogwood">
          <p className="body" style={{ margin: 0, lineHeight: 1.7, maxWidth: 560 }}>
            {s.step?.invitation}
          </p>
          {s.step?.keepsake && (
            <p className="serif" style={{
              margin: '16px 0 0', fontSize: 17, fontStyle: 'italic', color: 'var(--hh-green)',
            }}>
              Carry this: {s.step.keepsake}
            </p>
          )}
        </Movement>

        {/* Closing line */}
        {s.closing && (
          <section style={{ padding: '40px 22px 0' }}>
            <p className="serif" style={{
              margin: 0, fontSize: 18, lineHeight: 1.55, fontStyle: 'italic',
              color: 'var(--paper-2)', maxWidth: 540,
            }}>
              {s.closing}
            </p>
          </section>
        )}

        {/* ── The exchange: answer the question, receive the turning ── */}
        <section style={{ padding: '52px 22px 0' }}>
          <Rule/>
        </section>

        {rt ? (
          // Already answered — show the reader's words and the closing turning.
          <>
            <section style={{ padding: '34px 22px 0' }}>
              <Kicker accent="mute">You answered</Kicker>
              <p className="body" style={{ margin: '12px 0 0', fontStyle: 'italic', color: 'var(--paper-2)', lineHeight: 1.65, maxWidth: 560 }}>
                "{current.reply}"
              </p>
            </section>
            <Movement label="And so">
              {rt.acknowledgement && (
                <p className="body" style={{ margin: 0, lineHeight: 1.7, maxWidth: 560 }}>
                  {rt.acknowledgement}
                </p>
              )}
              <p className="serif" style={{
                margin: rt.acknowledgement ? '18px 0 0' : 0, fontSize: 20, lineHeight: 1.55,
                fontWeight: 380, color: 'var(--hh-green)', maxWidth: 560,
              }}>
                {rt.turning}
              </p>
              {rt.step?.invitation && (
                <p className="body" style={{ margin: '20px 0 0', lineHeight: 1.7, maxWidth: 560 }}>
                  {rt.step.invitation}
                </p>
              )}
              {rt.step?.keepsake && (
                <p className="serif" style={{ margin: '14px 0 0', fontSize: 17, fontStyle: 'italic', color: 'var(--hh-green)' }}>
                  Carry this: {rt.step.keepsake}
                </p>
              )}
              {rt.closing && (
                <p className="serif" style={{ margin: '24px 0 0', fontSize: 18, fontStyle: 'italic', color: 'var(--paper-2)', maxWidth: 540 }}>
                  {rt.closing}
                </p>
              )}
            </Movement>
            <section style={{ padding: '40px 22px 0' }}>
              <button onClick={() => go('journal')} style={{
                background: 'transparent', border: '1px solid rgba(31, 64, 69, 0.18)',
                padding: '13px 22px', cursor: 'pointer', color: 'var(--hh-green)',
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>
                Take this to the journal
              </button>
            </section>
          </>
        ) : (
          // Not yet answered. Invite the reply (skippable — the session
          // stands on its own).
          <section style={{ padding: '34px 22px 0' }}>
            <Kicker>If you'd like to answer</Kicker>
            <p className="body" style={{ margin: '12px 0 18px', maxWidth: 460 }}>
              No need to. But if the question reached something, a sentence back is enough, and Hearth will sit with it.
            </p>
            <textarea
              className="hearth-input"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="A sentence, if it helps…"
              style={{ minHeight: 110, background: 'var(--hh-isabel)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '16px 18px' }}
            />
            <div style={{ marginTop: 18 }}>
              {replyBusy ? (
                <button disabled style={ghostBtn}>Sitting with it…</button>
              ) : reply.trim().length < 2 ? (
                <button disabled style={ghostBtn}>Answer, if you'd like</button>
              ) : (
                <button onClick={submitReply} style={solidBtn}>
                  <span>Offer it</span>
                  <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
                </button>
              )}
            </div>
            {replyError && (
              <div style={{ marginTop: 16, padding: 14, background: 'var(--hh-isabel)', borderLeft: '2px solid var(--ember)' }}>
                <p className="body" style={{ margin: 0 }}>
                  {replyError.kind === 'unauthed' ? 'Your session ended. Sign in to continue.'
                    : replyError.detail || 'Something went wrong. Try again.'}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  // ── Logbook view ──────────────────────────────
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
            {Icon.back(18, 'currentColor')}<span>Back</span>
          </button>
        </section>
        <section style={{ padding: '24px 22px 0' }}>
          <Kicker>Your sessions</Kicker>
          <Headline size="display" style={{ marginTop: 14 }}>
            What you've<br/>carried here.
          </Headline>

          {logbook.loading && logbook.entries.length === 0 && (
            <p className="body" style={{ marginTop: 28, color: 'var(--paper-mute)' }}>Gathering them…</p>
          )}
          {logbook.error && (
            <p className="body" style={{ marginTop: 28, color: 'var(--paper-mute)' }}>{logbook.error}</p>
          )}
          {!logbook.loading && !logbook.error && logbook.entries.length === 0 && (
            <p className="body" style={{ marginTop: 28, color: 'var(--paper-mute)', maxWidth: 420 }}>
              No sessions yet. When you sit with something here, it will keep a quiet record for you to return to.
            </p>
          )}

          {logbook.entries.length > 0 && <div style={{ marginTop: 28 }}><Rule/></div>}

          {logbook.entries.map((entry) => (
            <div key={entry.id} style={{ borderBottom: '1px solid rgba(31, 64, 69, 0.10)', padding: '22px 0', position: 'relative' }}>
              <button onClick={() => openLogEntry(entry)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                    {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {entry.session?.companion?.name && (
                    <span className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--hh-green)', textTransform: 'uppercase', padding: '2px 10px', border: '1px solid rgba(31, 64, 69, 0.18)' }}>
                      {entry.session.companion.name}
                    </span>
                  )}
                </div>
                {entry.session?.feelingName && (
                  <p className="serif" style={{ margin: '12px 0 0', fontSize: 17, lineHeight: 1.5, fontWeight: 400, fontStyle: 'italic', color: 'var(--hh-green)' }}>
                    {entry.session.feelingName}
                  </p>
                )}
                {entry.feeling && (
                  <p className="body" style={{ margin: '8px 0 0', color: 'var(--paper-mute)', fontSize: 12.5, lineHeight: 1.55 }}>
                    You wrote: <span style={{ fontStyle: 'italic' }}>"{entry.feeling.length > 130 ? entry.feeling.slice(0, 130) + '…' : entry.feeling}"</span>
                  </p>
                )}
              </button>
              <button onClick={() => deleteLogEntry(entry.id)} aria-label="Delete session" style={{
                position: 'absolute', top: 22, right: 0, background: 'transparent', border: 0,
                padding: '4px 8px', cursor: 'pointer', color: 'var(--paper-mute)',
                fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em',
                textTransform: 'uppercase', opacity: 0, transition: 'opacity 200ms ease',
              }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                onFocus={(e) => e.currentTarget.style.opacity = 1}
                onBlur={(e) => e.currentTarget.style.opacity = 0}
              >Remove</button>
            </div>
          ))}

          {logbook.hasMore && (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <button onClick={loadMoreLog} disabled={logbook.loading} style={{
                background: 'transparent', border: '1px solid rgba(31, 64, 69, 0.18)',
                padding: '12px 22px', cursor: logbook.loading ? 'wait' : 'pointer', color: 'var(--hh-green)',
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>{logbook.loading ? 'Loading…' : 'Show more'}</button>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Input view ────────────────────────────────
  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <section style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Kicker>Carry</Kicker>
          <button onClick={openLogbook} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--hh-green)',
            fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 500, letterSpacing: '0.18em',
            textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span>Sessions</span>
            <span style={{ width: 14, height: 1, background: 'currentColor' }}/>
          </button>
        </div>
        <Headline size="display" style={{ marginTop: 14 }}>
          How are you,<br/><span style={{ fontStyle: 'italic' }}>really?</span>
        </Headline>
        <p className="body" style={{ margin: '18px 0 28px', maxWidth: 400 }}>
          Tell me where you are, heavy or light. I'll sit with it, find a mirror that meets it, and we'll look for the meaning in it, to carry, or to savour.
        </p>

        <textarea
          className="hearth-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Lately I've been feeling…"
          style={{ minHeight: 150, background: 'var(--hh-isabel)', borderBottom: '1px solid rgba(31, 64, 69, 0.18)', padding: '18px 18px' }}
        />

        <div style={{ marginTop: 22 }}>
          {text.trim().length < 6 ? (
            <button disabled style={ghostBtn}>Tell me where you are</button>
          ) : (
            <button onClick={beginSession} style={solidBtn}>
              <span>Sit with me</span>
              <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 22, padding: 16, background: 'var(--hh-isabel)', borderLeft: '2px solid var(--ember)' }}>
            {error.kind === 'unauthed' && (
              <p className="body" style={{ margin: 0 }}>
                <span onClick={() => go('auth')} style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--ember)' }}>Sign in</span> to use Carry.
              </p>
            )}
            {error.kind === 'unconfigured' && (
              <p className="body" style={{ margin: 0 }}>Carry needs an OpenAI key configured on the server.</p>
            )}
            {error.kind === 'other' && (
              <p className="body" style={{ margin: 0 }}>{error.detail || 'Something went wrong. Try again.'}</p>
            )}
          </div>
        )}
      </section>

      {/* Borrow a phrase */}
      <section style={{ padding: '50px 22px 0' }}>
        <Rule/>
        <Kicker style={{ marginTop: 22 }}>Or borrow a place to start</Kicker>
        <div style={{ marginTop: 14 }}>
          {(D.kindleSeeds || []).map((seed, i) => (
            <button key={i} onClick={() => setText(seed)} style={{
              display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0,
              borderBottom: '1px solid rgba(31, 64, 69, 0.10)', padding: '18px 0', cursor: 'pointer',
            }}>
              <span className="serif" style={{ fontSize: 16, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--hh-green)' }}>
                {seed}
              </span>
            </button>
          ))}
        </div>
        <p className="body" style={{ margin: '28px 0 0', fontSize: 12.5, color: 'var(--paper-mute)', maxWidth: 470, lineHeight: 1.6 }}>
          This space is inspired by logotherapy, Viktor Frankl's work on finding meaning, and the most replicated work in psychology. Hearth applies it to support you, not to treat you. We are not clinicians and cannot promise results, and Hearth is not a substitute for professional care. If a feeling runs deep or will not lift, or if Hearth does not leave you lighter, please reach someone trained to help. If you are ever in danger, contact a crisis line now.
        </p>
      </section>

      {/* To steady yourself first — the steadying practices live here in Carry */}
      <section style={{ padding: '40px 22px 0' }}>
        <Rule/>
        <Kicker style={{ marginTop: 22 }}>To steady yourself first</Kicker>
        <p className="body" style={{ margin: '12px 0 14px', maxWidth: 440 }}>
          If the feeling is too loud to think, you can begin here. A minute is enough.
        </p>
        <div>
          {['breath', 'shutdown'].map((k) => {
            const r = (D.rituals || []).find((x) => x.key === k);
            if (!r) return null;
            return (
              <button key={k} onClick={() => go('ritual-detail', { ritual: r })} style={{
                display: 'flex', width: '100%', textAlign: 'left', alignItems: 'baseline',
                justifyContent: 'space-between', gap: 14, background: 'transparent', border: 0,
                borderBottom: '1px solid rgba(31, 64, 69, 0.10)', padding: '16px 0', cursor: 'pointer',
              }}>
                <span className="serif" style={{ fontSize: 17, fontStyle: 'italic', color: 'var(--hh-green)' }}>{r.name}</span>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--paper-mute)', whiteSpace: 'nowrap' }}>{r.duration}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const ghostBtn = {
  background: 'transparent', color: 'var(--paper-mute)', border: '1px solid rgba(31, 64, 69, 0.18)',
  padding: '14px 22px', cursor: 'not-allowed', fontFamily: 'var(--sans)', fontSize: 11,
  fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
};
const solidBtn = {
  background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0, padding: '14px 22px',
  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.22em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 14,
};

export { KindleScreen };
