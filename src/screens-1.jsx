// Hearth — Home + Journal screens (editorial rebuild v3)
// Aesop / Frama. Old Lace paper, Midnight Green ink, four
// feature accents used as full color blocks, never tints.

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
function HomeScreen({ go, partOfDay, streak }) {
  const D = window.HEARTH_DATA;
  const isEvening = partOfDay === 'evening';
  const greet = partOfDay === 'morning'
    ? 'Good morning.'
    : isEvening
      ? 'Welcome back.'
      : 'Good afternoon.';
  const promptOfDay = isEvening ? D.eveningPrompts[0] : D.morningPrompts[0];
  const featured = D.magazine.stories[0];
  const promptAccent = isEvening ? 'green' : 'ecru'; // dark for evening, warm for morning

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* ── 1. Greeting on Old Lace ───────────────── */}
      <section style={{ padding: '14px 22px 36px' }}>
        <Kicker>Friday · 27 November · {isEvening ? '5:42 pm' : '7:18 am'}</Kicker>
        <Headline size="display" style={{ marginTop: 14 }}>
          {greet}
        </Headline>
        <p className="body" style={{ margin: '14px 0 0', maxWidth: 320 }}>
          {isEvening
            ? 'The light is going. The kettle is on. There is no hurry tonight.'
            : 'A quiet hour, before the day asks anything of you.'}
        </p>
        <div style={{ display: 'flex', gap: 22, marginTop: 26 }}>
          <HomeStat n={streak} label="day streak"/>
          <HomeStat n={42} label="entries kept"/>
          <HomeStat n={6} label="this week"/>
        </div>
      </section>

      {/* ── 2. Tonight's prompt — full color block ── */}
      <ColorBlock accent={promptAccent}>
        <Kicker accent={promptAccent === 'green' ? 'mute' : 'green'}
          style={{ color: promptAccent === 'green' ? 'rgba(249,244,230,0.6)' : 'var(--hh-green)' }}>
          {isEvening ? "Tonight's prompt" : "This morning's prompt"} · {promptOfDay.lineage}
        </Kicker>
        <Headline size="title" italic
          style={{
            marginTop: 14, maxWidth: 320,
            color: promptAccent === 'green' ? 'var(--hh-lace)' : 'var(--hh-green)',
          }}>
          {promptOfDay.title}.
        </Headline>
        <p style={{
          margin: '14px 0 26px', fontFamily: 'var(--sans)',
          fontSize: 14.5, lineHeight: 1.55, fontWeight: 380,
          color: promptAccent === 'green' ? 'rgba(249,244,230,0.8)' : 'var(--hh-green)',
          opacity: promptAccent === 'green' ? 1 : 0.85,
          maxWidth: 340,
        }}>{promptOfDay.prompt}</p>
        <button onClick={() => go('journal-write', { mode: partOfDay, prompt: promptOfDay })}
          style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 14,
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: promptAccent === 'green' ? 'var(--hh-lace)' : 'var(--hh-green)',
          }}>
          <span>Begin writing</span>
          <span style={{ width: 28, height: 1, background: 'currentColor' }}/>
        </button>
      </ColorBlock>

      {/* ── 3. Featured reading ───────────────────── */}
      <section style={{ padding: '40px 22px 0' }}>
        <Kicker>From the reading room · Issue 14</Kicker>
        <div onClick={() => go('article', featured)} style={{ cursor: 'pointer', marginTop: 18 }}>
          <Photo accent="dogwood" h={220}/>
          <Headline size="title" italic style={{ marginTop: 18 }}>
            {featured.title}
          </Headline>
          <p className="body" style={{ margin: '12px 0 0', maxWidth: 340 }}>
            {featured.dek}
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 16, alignItems: 'center' }}>
            <Kicker accent="mute">{featured.kicker}</Kicker>
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)' }}>· {featured.readTime}</span>
          </div>
        </div>
      </section>

      {/* ── 4. Three-up index ────────────────────── */}
      <section style={{ padding: '46px 22px 0' }}>
        <Rule/>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 0, marginTop: 0,
        }}>
          {[
            { n: '01', label: 'Journal', sub: 'Write yourself warm', route: 'journal' },
            { n: '02', label: 'Attune',  sub: 'Music for the mood',  route: 'attune' },
            { n: '03', label: 'Rituals', sub: 'Four-minute practices', route: 'rituals' },
          ].map((it, i) => (
            <button key={it.n} onClick={() => go(it.route)}
              style={{
                background: 'transparent', border: 0, padding: '24px 8px 8px 0',
                borderRight: i < 2 ? '1px solid rgba(31, 64, 69, 0.12)' : '0',
                paddingLeft: i > 0 ? 14 : 0,
                cursor: 'pointer', textAlign: 'left',
              }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--paper-mute)' }}>
                {it.n}
              </span>
              <div className="serif" style={{
                fontSize: 17, fontWeight: 400, color: 'var(--hh-green)',
                marginTop: 10, lineHeight: 1.15,
              }}>{it.label}</div>
              <div style={{
                fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--hh-green-3)',
                marginTop: 4, lineHeight: 1.35, fontWeight: 380,
              }}>{it.sub}</div>
            </button>
          ))}
        </div>
        <Rule/>
      </section>

      {/* ── 5. Closing line ──────────────────────── */}
      <section style={{ padding: '54px 22px 0', textAlign: 'left' }}>
        <Kicker accent="mute">Colophon</Kicker>
        <p className="serif" style={{
          margin: '14px 0 0', fontSize: 17, fontStyle: 'italic',
          color: 'var(--hh-green-3)', lineHeight: 1.5, fontWeight: 350,
          maxWidth: 320,
        }}>
          "Tell me, what is it you plan to do with your one wild and precious life?"
        </p>
        <p className="mono" style={{
          fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--paper-mute)',
          marginTop: 14, textTransform: 'uppercase',
        }}>Mary Oliver · 1990</p>
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
function JournalScreen({ go }) {
  const D = window.HEARTH_DATA;
  const [tab, setTab] = useState1('evening');
  const list = tab === 'morning' ? D.morningPrompts : D.eveningPrompts;

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

      {/* Recent entries — editorial list */}
      <section style={{ padding: '40px 22px 0' }}>
        <Kicker>Recent entries</Kicker>
        <div style={{ marginTop: 14 }}>
          {[
            { date: 'Yesterday · evening', title: 'A small unhurried good', mood: 'tender',  shift: '+1' },
            { date: 'Wed · morning',       title: 'WOOP for the meeting',  mood: 'restless', shift: '+2' },
            { date: 'Tue · evening',       title: 'Three good things',     mood: 'grateful', shift: '+1' },
          ].map((e, i) => (
            <div key={i} onClick={() => go('entry-detail', e)}
              style={{
                padding: '18px 0', borderBottom: '1px solid rgba(31, 64, 69, 0.10)',
                cursor: 'pointer',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                  {e.date}
                </span>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--hh-green)', textTransform: 'uppercase' }}>
                  {e.mood} · {e.shift}
                </span>
              </div>
              <div className="serif" style={{
                fontSize: 18, fontWeight: 400, color: 'var(--hh-green)',
                marginTop: 8, fontStyle: 'italic',
              }}>{e.title}</div>
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
      </section>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// JOURNAL WRITE — editorial
// ─────────────────────────────────────────────────────────────
function JournalWriteScreen({ go, payload }) {
  const D = window.HEARTH_DATA;
  const prompt = payload?.prompt || D.eveningPrompts[0];
  const mode = payload?.mode || 'evening';
  const [text, setText] = useState1('');
  const [step, setStep] = useState1('write');
  const [mood, setMood] = useState1(null);
  const [shift, setShift] = useState1(2);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

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
          <button className="btn btn-ember" onClick={() => setStep('done')}>
            Keep this entry
          </button>
        </div>
      </>}

      {step === 'done' && <div style={{ paddingTop: 80 }}>
        <Kicker>Kept</Kicker>
        <Headline size="display" italic style={{ marginTop: 14 }}>
          One more<br/>evening, written.
        </Headline>
        <p className="body" style={{ margin: '20px 0 32px', maxWidth: 320 }}>
          Felt {mood}. Writing made it {shift > 0 ? `${shift} lighter` : shift < 0 ? `${Math.abs(shift)} heavier` : 'unchanged'}. The page is the better friend tonight.
        </p>
        <button className="btn btn-ghost" onClick={() => go('home')}>Back home</button>
      </div>}
    </div>
  );
}

Object.assign(window, { HomeScreen, JournalScreen, JournalWriteScreen });
