// Hearth — someone you saw.
//
// Frankl ranks encounter highest within the experiential values: meaning
// received "by experiencing another human being in his very uniqueness,
// by loving him". Until now Hearth had no surface for the people
// actually in a reader's life as meaning received. Give has the letter,
// which turns outward. This is the receiving half.
//
// THE ONE QUESTION THAT DOES THE WORK.
//
// "What did you notice that most people would walk past?" asks for
// something about THEM. Not what they did for you: that is the letter,
// and its frame is still your own benefit. This asks you to look at a
// person as unrepeatable rather than as their function to you, which is
// the whole of what encounter means, and the constraint makes it
// operational without ever naming the idea.
//
// It is also the purest dereflection in the app. Every other surface
// points a reader inward; for the length of this one, their attention is
// entirely on somebody else.
//
// STRANGERS COUNT, ON PURPOSE. The man at the bus stop, the woman who
// let you go first. Frankl's uniqueness applies to anyone, and if this
// only worked for people you are close to it would become friendship
// admin and could only be done occasionally.
//
// WHAT THIS IS NOT. Not a contact list. No cadence, no last-seen, no
// counts, no reminders about a named person, nothing ever overdue. The
// moment an app keeps a ledger of your relationships it has made people
// into tasks, which is precisely the relation encounter exists to
// escape.
//
// AND NOT A SOURCE OF MEANING BY DEFAULT. Noticing is free and
// unweighted; keeping is deliberate and weighted. These observations do
// not reach the meaning narrative, because a month of incidental
// noticing would otherwise produce a portrait claiming that what moves
// this reader is baristas and strangers at bus stops. Only an explicit
// "this one mattered" writes a meaning-log line.

import React from 'react';
import { Headline, Kicker, Icon, Rule } from './atoms.jsx';
import { api } from './api.js';
import { SavourMoment } from './savour.jsx';

function todayKey() { return new Date().toISOString().slice(0, 10); }

const quietLink = {
  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
  color: 'var(--paper-mute)', fontFamily: 'var(--mono)', fontSize: 9.5,
  letterSpacing: '0.16em', textTransform: 'uppercase',
};
const solidBtn = {
  background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0,
  padding: '13px 22px', cursor: 'pointer', fontFamily: 'var(--sans)',
  fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
};

function EncounterScreen({ go }) {
  // write → the three questions; kept → what you wrote, and what next;
  // gallery → the people you have seen.
  const [view, setView] = React.useState('write');

  const [person, setPerson] = React.useState('');
  const [noticed, setNoticed] = React.useState('');
  const [potential, setPotential] = React.useState('');
  const [showPotential, setShowPotential] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(null);
  const [savour, setSavour] = React.useState(false);
  const [keeping, setKeeping] = React.useState(false);

  const [gallery, setGallery] = React.useState({ people: null, error: null });
  const [pendingRemove, setPendingRemove] = React.useState(null);

  const ready = person.trim().length >= 1 && noticed.trim().length >= 3 && !busy;

  async function keep() {
    if (!ready) return;
    setBusy(true);
    try {
      const { entry } = await api.encounter.create({
        person: person.trim(),
        noticed: noticed.trim(),
        potential: potential.trim(),
        date: todayKey(),
      });
      setSaved(entry);
      setView('kept');
    } catch { /* leave the words in the box so nothing is lost */ }
    finally { setBusy(false); }
  }

  // The deliberate promotion. This is the only path from here into the
  // meaning log, and it exists so the reader stays the author of what
  // counts as their meaning.
  async function markMattered() {
    if (!saved || saved.kept || keeping) return;
    setKeeping(true);
    try {
      const { entry } = await api.encounter.keep(saved.id);
      if (entry) setSaved(entry);
    } catch { /* no-op */ }
    finally { setKeeping(false); }
  }

  async function openGallery() {
    setView('gallery');
    if (gallery.people) return;
    try {
      const data = await api.encounter.list();
      setGallery({ people: data.people || [], error: null });
    } catch (err) {
      setGallery({
        people: [],
        error: err.status === 401 ? 'Sign in to see the people you have seen.' : 'Could not load them just now.',
      });
    }
  }

  async function remove(id) {
    try {
      await api.encounter.remove(id);
      setGallery((g) => ({
        ...g,
        people: (g.people || [])
          .map((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) }))
          .filter((p) => p.notes.length > 0),
      }));
    } catch { /* leave it */ }
  }
  function confirmRemove(id) {
    if (pendingRemove === id) { setPendingRemove(null); remove(id); return; }
    setPendingRemove(id);
    setTimeout(() => setPendingRemove((cur) => (cur === id ? null : cur)), 4000);
  }

  function begin() {
    setPerson(''); setNoticed(''); setPotential('');
    setShowPotential(false); setSaved(null); setSavour(false);
    setView('write');
  }

  // ── The gallery ───────────────────────────────────────────────────
  //
  // Grouped BY PERSON, not by date. Someone seen once shows one line and
  // is complete. Someone seen across a year shows the sequence, and
  // reading it is the thing nothing else in Hearth holds.
  if (view === 'gallery') {
    const people = gallery.people;
    return (
      <div className="fade-in" style={{ paddingBottom: 48 }}>
        <section style={{ padding: '4px 22px 0' }}>
          <button onClick={() => setView(saved ? 'kept' : 'write')} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            {Icon.back(18, 'currentColor')}<span>Back</span>
          </button>
        </section>

        <section style={{ padding: '24px 22px 0' }}>
          <Kicker accent="blue">The people you've seen</Kicker>
          <Headline size="display" style={{ marginTop: 14 }}>
            Who you've<br/>looked at.
          </Headline>

          {gallery.error && (
            <p className="body" style={{ marginTop: 26, color: 'var(--paper-mute)' }}>{gallery.error}</p>
          )}

          {!gallery.error && people === null && (
            <div style={{ marginTop: 26 }}>
              <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, width: '55%' }}/>
              <div style={{ height: 14, background: 'var(--paper-line)', opacity: 0.3, marginTop: 10, width: '80%' }}/>
            </div>
          )}

          {!gallery.error && Array.isArray(people) && people.length === 0 && (
            <p className="serif" style={{
              marginTop: 26, fontSize: 17, fontStyle: 'italic', fontWeight: 380,
              color: 'var(--paper-mute)', maxWidth: 420, lineHeight: 1.5,
            }}>
              Nobody yet. The next time you actually look at someone, they will be here.
            </p>
          )}

          {Array.isArray(people) && people.length > 0 && (
            <div style={{ marginTop: 30 }}>
              {people.map((p) => (
                <div key={p.person} style={{ marginBottom: 34 }}>
                  <Rule/>
                  <h3 className="serif" style={{
                    margin: '18px 0 0', fontSize: 22, fontStyle: 'italic',
                    fontWeight: 380, color: 'var(--hh-green)',
                  }}>{p.person}</h3>
                  {p.notes.map((n) => (
                    <div key={n.id} style={{ padding: '16px 0 0' }}>
                      <div className="mono" style={{
                        fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: 'var(--paper-mute)', marginBottom: 6,
                      }}>
                        {new Date(n.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <p className="body" style={{ margin: 0, maxWidth: 560, lineHeight: 1.65 }}>{n.noticed}</p>
                      {n.potential && (
                        <p className="serif" style={{
                          margin: '10px 0 0', fontSize: 16, lineHeight: 1.55, fontStyle: 'italic',
                          color: 'var(--hh-green)', maxWidth: 540,
                        }}>{n.potential}</p>
                      )}
                      <button onClick={() => confirmRemove(n.id)} style={{ ...quietLink, marginTop: 10 }}>
                        {pendingRemove === n.id ? 'Tap again to remove' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Kept ──────────────────────────────────────────────────────────
  if (view === 'kept' && saved) {
    if (savour) {
      return (
        <div className="fade-in" style={{ paddingBottom: 48 }}>
          <section style={{ padding: '24px 22px 0' }}>
            <Kicker accent="blue">{saved.person}</Kicker>
            <Headline size="display" style={{ marginTop: 14 }}>Stay with it.</Headline>
          </section>
          <SavourMoment
            question="What was it like, seeing them properly?"
            avenue="receive"
            prompt="Seeing someone properly"
            onDone={() => go('receive')}
          />
        </div>
      );
    }
    return (
      <div className="fade-in" style={{ paddingBottom: 48 }}>
        <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => go('receive')} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            {Icon.back(18, 'currentColor')}<span>Receive</span>
          </button>
          <button onClick={openGallery} style={quietLink}>The people you've seen</button>
        </section>

        <section style={{ padding: '30px 22px 0' }}>
          <Kicker accent="blue">Kept</Kicker>
          <Headline size="display" italic style={{ marginTop: 14 }}>{saved.person}</Headline>
          <p className="body" style={{ margin: '18px 0 0', maxWidth: 560, lineHeight: 1.7 }}>
            {saved.noticed}
          </p>
          {saved.potential && (
            <p className="serif" style={{
              margin: '18px 0 0', fontSize: 18, lineHeight: 1.55, fontStyle: 'italic',
              color: 'var(--hh-green)', maxWidth: 540,
            }}>
              {saved.potential}
            </p>
          )}
        </section>

        <section style={{ padding: '30px 22px 0', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setSavour(true)} style={solidBtn}>Stay a moment</button>
          <button onClick={begin} style={quietLink}>Someone else</button>
          <button onClick={() => go('receive')} style={quietLink}>Done</button>
        </section>

        {/* The only path from here into the meaning log, and it is the
            reader's decision. Most noticing is not a source of meaning
            and should not be treated as one. */}
        <section style={{ padding: '34px 22px 0' }}>
          <Rule/>
          {saved.kept ? (
            <p className="body-sm" style={{ margin: '20px 0 0', color: 'var(--paper-mute)', maxWidth: 460 }}>
              Kept to your meaning log too.
            </p>
          ) : (
            <>
              <p className="body-sm" style={{ margin: '20px 0 0', color: 'var(--paper-mute)', maxWidth: 460 }}>
                This stays here with the people you have seen. If it belongs to more than that, say so and it will join what you keep.
              </p>
              <button onClick={markMattered} disabled={keeping} style={{ ...quietLink, marginTop: 12 }}>
                {keeping ? 'Keeping…' : 'This one mattered'}
              </button>
            </>
          )}
        </section>
      </div>
    );
  }

  // ── Write ─────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ paddingBottom: 48 }}>
      <section style={{ padding: '4px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => go('receive')} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hh-green)',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          {Icon.back(18, 'currentColor')}<span>Receive</span>
        </button>
        <button onClick={openGallery} style={quietLink}>The people you've seen</button>
      </section>

      <section style={{ padding: '20px 22px 0' }}>
        <Kicker accent="blue">Someone you saw</Kicker>
        <Headline size="display" style={{ marginTop: 12 }}>
          Who did you<br/><span style={{ fontStyle: 'italic' }}>really see?</span>
        </Headline>
        <p className="body" style={{ margin: '16px 0 0', maxWidth: 460 }}>
          Anyone. Someone you love, or the man at the bus stop. It only has to be one person you actually looked at.
        </p>
      </section>

      <section style={{ padding: '30px 22px 0' }}>
        <input
          className="hearth-input"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          maxLength={80}
          placeholder="A name, or who they were"
          style={{
            fontSize: 19, background: 'var(--hh-isabel)', padding: '14px 16px',
            borderBottom: '1px solid rgba(31, 64, 69, 0.18)',
          }}
        />
      </section>

      {/* The second question only appears once there is somebody to ask
          it about, so the page never opens as a form. */}
      {person.trim() && (
        <section className="fade-in" style={{ padding: '28px 22px 0' }}>
          <Kicker>What you noticed</Kicker>
          <p className="serif" style={{
            margin: '12px 0 0', fontSize: 20, lineHeight: 1.4, fontStyle: 'italic',
            color: 'var(--hh-green)', maxWidth: 480,
          }}>
            What did you notice that most people would walk past?
          </p>
          <p className="body-sm" style={{ margin: '10px 0 0', color: 'var(--paper-mute)', maxWidth: 460 }}>
            Something about them, not about you.
          </p>
          <textarea
            className="hearth-input"
            value={noticed}
            onChange={(e) => setNoticed(e.target.value)}
            maxLength={600}
            placeholder="He waits with his hands behind his back, like someone who has decided not to be in a hurry…"
            style={{
              minHeight: 96, marginTop: 16, background: 'var(--hh-isabel)',
              padding: '14px 16px', borderBottom: '1px solid rgba(31, 64, 69, 0.18)',
            }}
          />
        </section>
      )}

      {/* Never a field. A quiet offer, and most days it will rightly be
          left alone. */}
      {noticed.trim().length >= 3 && (
        <section className="fade-in" style={{ padding: '24px 22px 0' }}>
          {showPotential ? (
            <>
              <Kicker accent="mute">If you want</Kicker>
              <p className="serif" style={{
                margin: '12px 0 0', fontSize: 18, lineHeight: 1.45, fontStyle: 'italic',
                color: 'var(--hh-green)', maxWidth: 480,
              }}>
                What can you see in them that they might not see in themselves?
              </p>
              <textarea
                className="hearth-input"
                value={potential}
                onChange={(e) => setPotential(e.target.value)}
                maxLength={600}
                placeholder="…"
                style={{
                  minHeight: 80, marginTop: 14, background: 'var(--hh-isabel)',
                  padding: '14px 16px', borderBottom: '1px solid rgba(31, 64, 69, 0.18)',
                }}
              />
            </>
          ) : (
            <button onClick={() => setShowPotential(true)} style={quietLink}>
              And, if you want: what can you see in them that they might not?
            </button>
          )}
        </section>
      )}

      <section style={{ padding: '30px 22px 0', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={keep} disabled={!ready} style={{
          background: ready ? 'var(--hh-green)' : 'transparent',
          color: ready ? 'var(--hh-lace)' : 'var(--paper-mute)',
          border: ready ? 0 : '1px solid rgba(31, 64, 69, 0.25)',
          padding: '13px 22px', cursor: ready ? 'pointer' : 'default',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          {busy ? 'Keeping…' : 'Keep it'}
        </button>
        <button onClick={() => go('receive')} style={quietLink}>Not now</button>
      </section>
    </div>
  );
}

export { EncounterScreen };
