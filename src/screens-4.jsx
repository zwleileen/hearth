// Hearth — journal depth, reading view, mini-player, weekly digest, states

// ─────────────────────────────────────────────────────────────
// JOURNAL — archive (search + filter + tags)
// ─────────────────────────────────────────────────────────────
const SAMPLE_ENTRIES = [
  { id: 'e1', date: 'Yesterday · evening', title: 'A small unhurried good', mood: 'tender', shift: '+1', tone: 'rose',
    excerpt: "The kettle was the loudest thing in the kitchen, and that was enough. I noticed I was holding my shoulders the way…",
    body: "The kettle was the loudest thing in the kitchen, and that was enough. I noticed I was holding my shoulders the way I used to, before I learned to put them down. The day asked little of me — just to be present for the small unhurried goods. The light through the window. The cat's slow blink. A friend's voicemail I'd forgotten to listen to until tonight.\n\nWhat I want to remember: that not every evening has to be a recovery from the day. Some evenings, I just step into them.",
    tags: ['gratitude', 'tender'], lineage: 'Three good things' },
  { id: 'e2', date: 'Wed · morning', title: 'WOOP for the meeting', mood: 'restless', shift: '+2', tone: 'citron',
    excerpt: "Wish: that the proposal lands. Outcome: relief and a small celebration. Obstacle: I rush when I'm nervous…",
    body: "Wish: that the proposal lands well with the team.\nOutcome: relief, a small celebration, and a few hours where I'm not bracing.\nObstacle: I rush when I'm nervous, and rush sounds like I haven't thought it through.\nPlan: when I feel the rush rising, I'll take a sip of water before answering. Water as a comma.",
    tags: ['intention', 'work'], lineage: 'WOOP' },
  { id: 'e3', date: 'Tue · evening', title: 'Three good things', mood: 'grateful', shift: '+1', tone: 'meadow',
    excerpt: "The bread rose. The walk back was longer than I needed and I let it be. A stranger smiled, and I let it land…",
    body: "The bread rose. The walk back was longer than I needed and I let it be. A stranger smiled, and I let it land.\n\nWhy: I'd left margin in the day. I'd told myself I could.\n\nMy part: I'd planned for an unhurried evening — and I held to it.",
    tags: ['gratitude'], lineage: 'Three good things' },
  { id: 'e4', date: 'Mon · evening', title: 'A letter to myself', mood: 'heavy', shift: '0', tone: 'wisteria',
    excerpt: "Dear friend, you are not behind. You are exactly where the work has put you, which is a different thing from where…",
    body: "Dear friend,\n\nYou are not behind. You are exactly where the work has put you, which is a different thing from where you imagined you'd be. Imagination is generous; it doesn't account for weather.\n\nBe kind tonight. The morning will know what to do.",
    tags: ['self-compassion'], lineage: 'Letter of self-compassion' },
  { id: 'e5', date: 'Sun · morning', title: 'Best possible self · year', mood: 'hopeful', shift: '+2', tone: 'ember',
    excerpt: "A year from now, I'm in a quiet kitchen at 7. The sourdough is on a fourth fold. I'm working on something I'm…",
    body: "A year from now, I'm in a quiet kitchen at 7. The sourdough is on a fourth fold. I'm working on something I'm proud to talk about, but I don't bring it up first. My friendships are smaller in number and richer per minute. I'm sleeping well. I'm walking before reading the news.",
    tags: ['vision', 'hopeful'], lineage: 'Best possible self' },
  { id: 'e6', date: 'Sat · evening', title: 'Pennebaker · twenty minutes', mood: 'raw', shift: '+1', tone: 'fern',
    excerpt: "What I haven't said out loud is that I'm tired in a way sleep doesn't fix. I think the tiredness is grief…",
    body: "[Twenty minutes of expressive writing — kept private.]",
    tags: ['expressive', 'grief'], lineage: 'Expressive writing' },
];

function JournalArchiveScreen({ go }) {
  const [q, setQ] = React.useState('');
  const [tag, setTag] = React.useState(null);

  const allTags = Array.from(new Set(SAMPLE_ENTRIES.flatMap(e => e.tags)));
  const filtered = SAMPLE_ENTRIES.filter(e => {
    if (tag && !e.tags.includes(tag)) return false;
    if (q && !(e.title + ' ' + e.excerpt + ' ' + e.body).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fade-in" style={{ padding: '4px 22px 32px' }}>
      <BackRow go={go} label="Journal" dest="journal"/>
      <Eyebrow ember style={{ marginTop: 18 }}>The kept</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 14px', fontWeight: 350 }}>
        Everything you've<br/><span style={{ fontStyle: 'italic' }}>written here.</span>
      </h1>

      {/* search */}
      <div style={{ position: 'relative' }}>
        <input className="hearth-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by word, mood, or month…"
          style={{ fontSize: 15, paddingLeft: 42 }}/>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--paper-faint)' }}>
          {Icon.compass(18, 'var(--paper-faint)')}
        </div>
      </div>

      {/* tag chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        <button onClick={() => setTag(null)} className={`chip ${tag === null ? 'chip-ember' : ''}`}
          style={{ cursor: 'pointer', border: tag === null ? undefined : '1px solid var(--paper-line)' }}>All · {SAMPLE_ENTRIES.length}</button>
        {allTags.map(t => (
          <button key={t} onClick={() => setTag(t === tag ? null : t)} className={`chip ${tag === t ? 'chip-meadow' : ''}`}
            style={{ cursor: 'pointer', border: tag === t ? undefined : '1px solid var(--paper-line)' }}>{t}</button>
        ))}
      </div>

      {/* monthly grouping */}
      <div style={{ marginTop: 22 }}>
        <Rule glyph="◆ november ◆"/>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing matches yet."
              sub="Try a softer word, or clear the filter."/>
          ) : filtered.map((e, i) => (
            <div key={e.id} className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => go('entry-detail', { entry: e })}>
              <div aria-hidden style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 2, background: `var(--${e.tone})`, borderRadius: 2 }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: `var(--${e.tone})`, textTransform: 'uppercase' }}>
                  {e.date}
                </span>
                <span className={`chip chip-${e.tone}`}>{e.mood} · {e.shift}</span>
              </div>
              <h3 className="serif" style={{ margin: '8px 0 6px', fontSize: 18, fontStyle: 'italic', fontWeight: 380 }}>{e.title}</h3>
              <p className="body-sm" style={{ margin: 0 }}>{e.excerpt}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {e.tags.map(t => <span key={t} className="chip" style={{ fontSize: 10, padding: '4px 10px' }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 26, textAlign: 'center' }}>
        <button className="btn btn-ghost">Load older months</button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// JOURNAL — entry detail
// ─────────────────────────────────────────────────────────────
function EntryDetailScreen({ go, payload }) {
  const e = payload?.entry || SAMPLE_ENTRIES[0];
  const [showShare, setShowShare] = React.useState(false);

  return (
    <div className="fade-in" style={{ padding: '4px 22px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => go('journal-archive')} style={{ background: 'transparent', border: 0, color: 'var(--paper-2)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          {Icon.back(20, 'var(--paper-2)')}
          <span className="sans" style={{ fontSize: 13 }}>Archive</span>
        </button>
        <button onClick={() => setShowShare(true)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--paper-2)' }}>
          {Icon.more(20, 'var(--paper-2)')}
        </button>
      </div>

      <div style={{ marginTop: 22, position: 'relative' }}>
        {/* pressed leaf in the margin — the user's signature on a kept entry */}
        <div style={{ position: 'absolute', right: -4, top: 6, opacity: 0.35, pointerEvents: 'none', transform: 'rotate(18deg)' }}>
          <LeafMark size={48} tone="sig"/>
        </div>
        <span className="mono" style={{ fontSize: 10, color: `var(--${e.tone})`, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          {e.date} · {e.lineage}
        </span>
        <h1 className="serif" style={{ margin: '10px 0 14px', fontSize: 32, fontStyle: 'italic', fontWeight: 360, lineHeight: 1.1, letterSpacing: '-0.005em' }}>
          {e.title}
        </h1>

        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          <span className={`chip chip-${e.tone}`}>{e.mood} · {e.shift}</span>
          {e.tags.map(t => <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>)}
        </div>

        <div className="serif" style={{ fontSize: 17, lineHeight: 1.6, fontWeight: 350, color: 'var(--paper)', whiteSpace: 'pre-wrap' }}>
          {e.body}
        </div>

        <hr className="divider" style={{ margin: '24px 0' }}/>

        <Eyebrow tone={e.tone}>How writing it sat</Eyebrow>
        <div className="card-soft" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `var(--${e.tone})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--night)', fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', flexShrink: 0 }}>
            {e.shift}
          </div>
          <p className="serif" style={{ margin: 0, fontSize: 15, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-2)', lineHeight: 1.4 }}>
            Felt {e.mood}. Writing made it {e.shift === '0' ? 'unchanged' : (e.shift.startsWith('+') ? `${e.shift.slice(1)} lighter` : `${e.shift.replace('-', '')} heavier`)}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={() => go('journal')}>Write again</button>
          <button className="btn btn-ghost" onClick={() => setShowShare(true)}>Share quietly</button>
        </div>
      </div>

      {showShare && <ShareSheet entry={e} onClose={() => setShowShare(false)}/>}
    </div>
  );
}

function ShareSheet({ entry, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(13,16,14,0.5)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        width: '100%', background: 'var(--night)', borderRadius: '24px 24px 0 0',
        padding: 22, paddingBottom: 30, borderTop: '1px solid var(--paper-line)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--paper-line)', margin: '0 auto 14px' }}/>
        <Eyebrow tone="rose">Share quietly</Eyebrow>
        <h3 className="h-section serif" style={{ margin: '6px 0 14px', fontStyle: 'italic', fontWeight: 380 }}>
          How would you like to keep it?
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Export as PDF',     sub: 'Letter-pressed paper feel',         tone: 'ember' },
            { label: 'Email to yourself', sub: 'A future-you postcard',             tone: 'rose' },
            { label: 'Copy as text',      sub: 'For wherever else it belongs',      tone: 'meadow' },
            { label: 'Read-only link',    sub: 'Expires in 7 days · no account',    tone: 'wisteria' },
          ].map(o => (
            <button key={o.label} className="card-soft" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: '1px solid var(--paper-line)', textAlign: 'left' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `var(--${o.tone}-tint)`, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 380 }}>{o.label}</div>
                <div className="body-sm" style={{ marginTop: 2 }}>{o.sub}</div>
              </div>
              {Icon.arrow(14, 'var(--paper-faint)')}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>Close</button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// DISCOVER — article reading view
// ─────────────────────────────────────────────────────────────
function ArticleScreen({ go, payload }) {
  const M = window.HEARTH_DATA.magazine;
  const story = payload?.story || M.stories[0];
  const isScience = payload?.slug === 'science';

  return (
    <div className="fade-in" style={{ padding: '4px 22px 40px' }}>
      <BackRow go={go} label="Discover" dest="discover"/>
      {isScience ? <ScienceArticle/> : <FeatureArticle story={story}/>}

      <hr className="divider" style={{ margin: '28px 0' }}/>
      <Eyebrow style={{ marginBottom: 12 }}>You might also sit with</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {M.stories.slice(0, 2).map((s, i) => (
          <div key={i} className="card-soft" style={{ padding: 12, display: 'flex', gap: 12, cursor: 'pointer' }} onClick={() => go('article', { story: s })}>
            <div className="ph" style={{ width: 70, height: 70, flexShrink: 0 }}><span className="ph-cap">ph</span></div>
            <div style={{ flex: 1 }}>
              <div className="mag-rule" style={{ color: 'var(--rose)' }}>{s.kicker}</div>
              <div className="serif" style={{ fontSize: 15, fontStyle: 'italic', fontWeight: 380, lineHeight: 1.2, marginTop: 4 }}>{s.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureArticle({ story }) {
  return <>
    <span className="mag-rule" style={{ color: 'var(--rose)', marginTop: 18, display: 'block' }}>{story.kicker}</span>
    <h1 className="serif" style={{ margin: '10px 0 12px', fontSize: 36, fontWeight: 320, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.015em' }}>
      {story.title}
    </h1>
    <p className="body" style={{ margin: '0 0 8px', fontSize: 17, lineHeight: 1.5 }}>{story.dek}</p>
    <p className="body-sm" style={{ color: 'var(--rose-soft)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14 }}>
      {story.author} · {story.readTime}
    </p>
    <Ph caption={story.caption} h={240} style={{ marginTop: 18 }}/>

    <div className="serif" style={{ fontSize: 17, lineHeight: 1.65, fontWeight: 350, color: 'var(--paper)', marginTop: 22 }}>
      <p style={{ margin: '0 0 16px' }}>
        <span className="serif" style={{ fontSize: 48, fontStyle: 'italic', fontWeight: 320, color: 'var(--rose)', float: 'left', lineHeight: 0.9, marginRight: 8, marginTop: 6 }}>T</span>
        he first time the kiln was lit, the village stood at a distance, then closer, then close enough to feel the heat. What had been a pile of clay was now a wall. What had been a wall was, by sundown, a school.
      </p>
      <p style={{ margin: '0 0 16px' }}>
        Building with what is local — earth, light, the patience of a community that has agreed to spend its Saturdays — is not a romantic gesture. It is, the architect would tell you, the only way a building can know the climate it stands in.
      </p>
    </div>

    <div className="card-rose" style={{ marginTop: 18 }}>
      <Eyebrow tone="rose">A line worth carrying</Eyebrow>
      <p className="serif" style={{ margin: '8px 0 0', fontSize: 19, fontStyle: 'italic', fontWeight: 380, lineHeight: 1.35 }}>
        "The work is not to build for them. The work is to build with them, and to step back when the wall remembers itself."
      </p>
    </div>

    <div className="serif" style={{ fontSize: 17, lineHeight: 1.65, fontWeight: 350, color: 'var(--paper)', marginTop: 18 }}>
      <p style={{ margin: '0 0 16px' }}>
        He pauses, the way someone pauses when the next sentence is about a person they loved. "My mother boiled water in this clay. The clay knew her."
      </p>
    </div>

    <div style={{ display: 'flex', gap: 8, marginTop: 26, alignItems: 'center' }}>
      <button className="btn btn-rose">{Icon.bookmark(14, 'var(--on-rose)')} Save to shelf</button>
      <button className="btn btn-ghost">Listen · 11 min</button>
    </div>
  </>;
}

function ScienceArticle() {
  return <>
    <span className="mag-rule" style={{ color: 'var(--meadow)', marginTop: 18, display: 'block' }}>About Hearth</span>
    <h1 className="serif" style={{ margin: '10px 0 12px', fontSize: 32, fontWeight: 320, fontStyle: 'italic', lineHeight: 1.05 }}>
      The science behind the warmth
    </h1>
    <p className="body" style={{ fontSize: 16 }}>
      Every prompt and ritual in Hearth is drawn from a body of peer-reviewed work. We don't claim novelty — we curate replication.
    </p>
    {[
      { tone: 'ember',    title: 'Three good things',   cite: 'Seligman et al., 2005',  body: 'A two-week intervention produced sustained reductions in depressive symptoms at six months. Among the most replicated findings in positive psychology.' },
      { tone: 'meadow',   title: 'Awe walks',           cite: 'Sturm & Keltner, 2020', body: 'In an 8-week trial with older adults, weekly awe-oriented walks were associated with greater daily joy and pro-social emotion.' },
      { tone: 'wisteria', title: 'Expressive writing',  cite: 'Pennebaker, 1997',      body: 'Twenty-minute sessions across multiple days correlate with measurable health and immune-function improvements over months.' },
      { tone: 'bloom',    title: 'Box breathing',       cite: 'Bernardi et al., 2006', body: 'Slow equal-ratio breathing increases heart-rate variability and reduces sympathetic arousal within minutes.' },
      { tone: 'rose',     title: 'Self-compassion',     cite: 'Neff, 2003',            body: 'Self-compassionate reframing reduces shame and rumination more reliably than self-esteem-based scripts.' },
    ].map(c => (
      <div key={c.title} className="card-soft" style={{ marginTop: 12, position: 'relative' }}>
        <div aria-hidden style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 2, background: `var(--${c.tone})`, borderRadius: 2 }}/>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: `var(--${c.tone})`, textTransform: 'uppercase' }}>{c.cite}</div>
        <h3 className="serif" style={{ margin: '6px 0 6px', fontSize: 19, fontStyle: 'italic', fontWeight: 380 }}>{c.title}</h3>
        <p className="body-sm" style={{ margin: 0 }}>{c.body}</p>
      </div>
    ))}
  </>;
}


// ─────────────────────────────────────────────────────────────
// BOOKMARKS
// ─────────────────────────────────────────────────────────────
function BookmarksScreen({ go }) {
  const M = window.HEARTH_DATA.magazine;
  const tones = ['ember', 'rose', 'meadow', 'wisteria', 'citron'];
  return (
    <div className="fade-in" style={{ padding: '4px 22px 32px' }}>
      <BackRow go={go} label="Settings" dest="settings"/>
      <Eyebrow tone="rose" style={{ marginTop: 18 }}>Bookmarks</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 18px', fontWeight: 350 }}>
        On the shelf,<br/><span style={{ fontStyle: 'italic' }}>for later.</span>
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {M.stories.map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 12, cursor: 'pointer', position: 'relative' }} onClick={() => go('article', { story: s })}>
            <div aria-hidden style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 2, background: `var(--${tones[i % tones.length]})`, borderRadius: 2 }}/>
            <div className="ph" style={{ width: 80, height: 100, flexShrink: 0 }}><span className="ph-cap">cover</span></div>
            <div style={{ flex: 1 }}>
              <div className="mag-rule" style={{ color: `var(--${tones[i % tones.length]})` }}>{s.kicker}</div>
              <h3 className="serif" style={{ margin: '4px 0 4px', fontSize: 17, fontStyle: 'italic', fontWeight: 380, lineHeight: 1.15 }}>{s.title}</h3>
              <p className="body-sm" style={{ margin: 0, color: 'var(--paper-mute)' }}>{s.readTime} · saved 3 days ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// WEEKLY DIGEST
// ─────────────────────────────────────────────────────────────
function WeeklyDigestScreen({ go }) {
  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const moods = [4.0, 4.6, 4.2, 5.5, 6.4, 7.1, 7.8]; // /10
  const kept = [true, true, false, true, true, true, false];
  const maxY = 90, minY = 14;
  const yFor = (m) => maxY - ((m - 3) / 6) * (maxY - minY);

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Editorial cover — ColorBlock */}
      <ColorBlock accent="ecru" bleed style={{ padding: '36px 22px 32px' }}>
        <BackRow go={go} label="Home" dest="home"/>
        <div style={{ marginTop: 20 }}>
          <Kicker accent="green">Sunday review · Week 48</Kicker>
          <Headline size="display" italic style={{ marginTop: 14 }}>
            A small look<br/>back at the week.
          </Headline>
          <p className="body" style={{ margin: '20px 0 0', maxWidth: 320 }}>
            Five evenings tended. Three small goods named. One ember of a long-lost friendship rekindled.
          </p>
        </div>
      </ColorBlock>

      {/* Stats — full-width grid, no card chrome */}
      <section style={{ padding: '32px 22px 0' }}>
        <Kicker>By the numbers</Kicker>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
          marginTop: 16, borderTop: '1px solid rgba(31, 64, 69, 0.14)',
        }}>
          {[
            { big: '5/7', label: 'evenings kept' },
            { big: '14',  label: 'goods named' },
            { big: '32m', label: 'of writing' },
            { big: '+1.4', label: 'avg shift' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '20px 0',
              borderBottom: '1px solid rgba(31, 64, 69, 0.14)',
              borderRight: i % 2 === 0 ? '1px solid rgba(31, 64, 69, 0.14)' : 'none',
              paddingLeft: i % 2 === 0 ? 0 : 18,
              paddingRight: i % 2 === 0 ? 18 : 0,
            }}>
              <div className="serif" style={{ fontSize: 36, fontWeight: 350, letterSpacing: '-0.02em', color: 'var(--paper)', lineHeight: 1 }}>{s.big}</div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--paper-mute)', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mood arc — minimal editorial chart */}
      <section style={{ padding: '36px 22px 0' }}>
        <Kicker>Mood arc</Kicker>
        <div style={{ marginTop: 18, position: 'relative' }}>
          <svg viewBox="0 0 300 110" style={{ width: '100%', height: 130 }}>
            {/* baseline grid */}
            {[14, 38, 62, 86].map(y => (
              <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(31, 64, 69, 0.08)" strokeWidth="0.5"/>
            ))}
            {/* line */}
            <path d={`M ${days.map((_, i) => `${20 + i * 43} ${yFor(moods[i])}`).join(' L ')}`}
              stroke="var(--hh-green)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {/* dots */}
            {days.map((_, i) => (
              <g key={i}>
                <circle cx={20 + i * 43} cy={yFor(moods[i])} r={kept[i] ? 4 : 3}
                  fill={kept[i] ? 'var(--hh-green)' : 'var(--hh-lace)'}
                  stroke={kept[i] ? 'var(--hh-green)' : 'var(--paper-mute)'} strokeWidth="1"/>
              </g>
            ))}
          </svg>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 4,
            fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em',
            color: 'var(--paper-mute)', padding: '0 14px',
          }}>
            {days.map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
        <p className="body" style={{ margin: '18px 0 0', fontSize: 14, color: 'var(--paper-mute)' }}>
          Filled marks are evenings you wrote. The line lifted on Thursday — you noted the call with M.
        </p>
      </section>

      {/* What was alive — editorial pull */}
      <section style={{ padding: '40px 22px 0' }}>
        <Rule/>
        <Kicker style={{ marginTop: 26 }}>What was alive</Kicker>
        <Headline size="section" style={{ marginTop: 14 }}>
          You wrote about <span style={{ color: 'var(--hh-ecru-deep)' }}>care</span>, <span style={{ color: 'var(--hh-ecru-deep)' }}>craft</span>, and <span style={{ color: 'var(--hh-ecru-deep)' }}>patience</span> most.
        </Headline>
        <p className="body" style={{ margin: '16px 0 0' }}>
          Wonder showed up twice. Discipline didn't this week — and that's information, not a verdict.
        </p>
      </section>

      {/* A phrase you wrote twice */}
      <section style={{ padding: '36px 0 0' }}>
        <ColorBlock accent="green" bleed style={{ padding: '38px 28px' }}>
          <Kicker accent="ecru">A phrase you wrote twice</Kicker>
          <p className="serif" style={{
            margin: '14px 0 0', fontSize: 26, fontStyle: 'italic',
            fontWeight: 360, lineHeight: 1.22, color: 'var(--hh-lace)',
          }}>
            "I don't have to earn the evening."
          </p>
        </ColorBlock>
      </section>

      {/* The week ahead — gentle suggestion */}
      <section style={{ padding: '36px 22px 0' }}>
        <Kicker>For the week ahead</Kicker>
        <Headline size="section" italic style={{ marginTop: 14 }}>
          One small move.
        </Headline>
        <p className="body" style={{ margin: '14px 0 18px' }}>
          Box breathing on Tuesday morning, before the meeting that tightens you. Four minutes is enough.
        </p>
        <button className="btn btn-ghost" onClick={() => go('rituals')} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>Open Rituals</span> {Icon.arrow(14, 'currentColor')}
        </button>
      </section>

      <section style={{ padding: '32px 22px 0' }}>
        <button onClick={() => go('home')} style={{
          width: '100%', padding: '16px 20px',
          background: 'var(--hh-green)', color: 'var(--hh-lace)',
          border: 0, borderRadius: 0, cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          Begin Sunday
        </button>
      </section>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// STREAK BROKEN — soft re-entry
// ─────────────────────────────────────────────────────────────
function StreakBrokenScreen({ go }) {
  return (
    <div className="fade-in" style={{ padding: '40px 28px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '70vh' }}>
      <div>
        <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto',
          background: 'radial-gradient(circle at 35% 30%, rgba(122,74,48,0.4), rgba(122,74,48,0.1) 60%, transparent 80%)',
          border: '1px solid rgba(122,74,48,0.3)' }}/>
        <Eyebrow style={{ marginTop: 28 }}>The fire went low</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '10px 0 14px', fontWeight: 350, fontStyle: 'italic' }}>
          That's all right.
        </h1>
        <p className="body" style={{ maxWidth: 300, margin: '0 auto' }}>
          Streaks are for keeping company, not for keeping score. The fire is happy to be relit. Pick up wherever you are.
        </p>
        <div className="card-soft" style={{ marginTop: 24, textAlign: 'left' }}>
          <Eyebrow tone="rose">Tonight, gently</Eyebrow>
          <p className="serif" style={{ margin: '8px 0 0', fontSize: 18, fontStyle: 'italic', fontWeight: 380, lineHeight: 1.35 }}>
            One sentence about today. Anything. The smallest spark counts.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280 }}>
        <button className="btn btn-ember" style={{ justifyContent: 'center' }} onClick={() => go('journal-write', { mode: 'evening', prompt: window.HEARTH_DATA.eveningPrompts[0] })}>
          Light it again {Icon.arrow(14, 'var(--on-ember)')}
        </button>
        <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => go('home')}>Maybe tomorrow</button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ATTUNE — reading history
// ─────────────────────────────────────────────────────────────
function AttuneHistoryScreen({ go }) {
  const D = window.HEARTH_DATA;
  const READS = [
    { date: 'Tonight',    arche: D.attuneArchetypes[0], felt: 'tender' },
    { date: 'Wed evening',arche: D.attuneArchetypes[1], felt: 'restless' },
    { date: 'Mon morning',arche: D.attuneArchetypes[4], felt: 'hopeful' },
    { date: 'Last Friday',arche: D.attuneArchetypes[2], felt: 'alight' },
    { date: 'Two weeks ago', arche: D.attuneArchetypes[3], felt: 'uncertain' },
  ];
  return (
    <div className="fade-in" style={{ padding: '4px 22px 32px' }}>
      <BackRow go={go} label="Attune" dest="attune"/>
      <Eyebrow tone="bloom" style={{ marginTop: 18 }}>Past readings</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 18px', fontWeight: 350 }}>
        How you've<br/><span style={{ fontStyle: 'italic' }}>been listening.</span>
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {READS.map((r, i) => (
          <div key={i} className="card-soft" style={{ display: 'flex', gap: 12, padding: 14 }}>
            <div className="ph" style={{ width: 60, height: 60, flexShrink: 0 }}><span className="ph-cap">art</span></div>
            <div style={{ flex: 1 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--paper-faint)', textTransform: 'uppercase' }}>
                {r.date} · felt {r.felt}
              </div>
              <div className="serif" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 380, marginTop: 4, lineHeight: 1.2 }}>
                {r.arche.song.title}
              </div>
              <div className="body-sm" style={{ color: 'var(--paper-mute)' }}>{r.arche.song.artist}</div>
            </div>
            <button style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--bloom)' }}>
              {Icon.play(16, 'var(--bloom)')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// MINI PLAYER (mounted in App)
// ─────────────────────────────────────────────────────────────
function MiniPlayer({ song, onClose, onOpen }) {
  const [playing, setPlaying] = React.useState(true);
  if (!song) return null;
  return (
    <div className="fade-in" onClick={onOpen} style={{
      position: 'absolute', left: 16, right: 16, bottom: 96, zIndex: 9,
      background: 'rgba(247,245,238,0.92)',
      backdropFilter: 'blur(28px) saturate(160%)',
      border: '1px solid var(--paper-line)',
      borderRadius: 16, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 14px 40px rgba(28,30,25,0.10)',
      cursor: 'pointer',
    }}>
      <div className="ph" style={{ width: 38, height: 38, flexShrink: 0, padding: 0 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
        <div className="body-sm" style={{ fontSize: 11, marginTop: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); setPlaying(p => !p); }} style={{
        background: 'var(--bloom)', border: 0, width: 32, height: 32, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
      }}>
        {playing
          ? <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--on-bloom)"><rect x="2" y="1" width="3" height="10" rx="0.5"/><rect x="7" y="1" width="3" height="10" rx="0.5"/></svg>
          : Icon.play(12, 'var(--on-bloom)')}
      </button>
      <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--paper-faint)', fontSize: 18, lineHeight: 1, padding: 0, width: 18, height: 18 }}>
        ×
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// EMPTY / LOADING / OFFLINE atoms
// ─────────────────────────────────────────────────────────────
function EmptyState({ title, sub, action, onAction, tone = 'ember' }) {
  return (
    <div className="card-soft" style={{ textAlign: 'center', padding: '32px 18px' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, var(--${tone}-tint), transparent 70%)`,
        border: `1px solid var(--${tone}-line)` }}/>
      <h3 className="serif" style={{ margin: '14px 0 6px', fontSize: 18, fontStyle: 'italic', fontWeight: 380 }}>{title}</h3>
      {sub && <p className="body-sm" style={{ margin: 0, maxWidth: 260, marginInline: 'auto' }}>{sub}</p>}
      {action && <button className={`btn btn-${tone}`} style={{ marginTop: 16 }} onClick={onAction}>{action}</button>}
    </div>
  );
}

function LoadingShimmer({ lines = 3 }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          height: 12, borderRadius: 4, marginTop: i ? 10 : 0,
          width: i === lines - 1 ? '60%' : '100%',
          background: 'linear-gradient(90deg, rgba(28,30,25,0.04), rgba(28,30,25,0.10), rgba(28,30,25,0.04))',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s linear infinite',
        }}/>
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function OfflineBanner({ onClose }) {
  return (
    <div className="fade-in" style={{
      position: 'absolute', top: 100, left: 16, right: 16, zIndex: 8,
      background: 'var(--wisteria-tint)', border: '1px solid var(--wisteria-line)',
      borderRadius: 12, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wisteria)' }}/>
      <span className="serif" style={{ flex: 1, fontSize: 14, fontStyle: 'italic', fontWeight: 380, color: 'var(--wisteria-deep)' }}>
        You're offline. Hearth still works — your writing waits here.
      </span>
      {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--wisteria)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>}
    </div>
  );
}

function Toast({ message, tone = 'meadow' }) {
  return (
    <div className="fade-in" style={{
      position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 12,
      background: `var(--${tone})`, color: `var(--on-${tone})`,
      padding: '10px 18px', borderRadius: 999,
      fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', fontWeight: 380,
      boxShadow: '0 8px 24px rgba(28,30,25,0.18)',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

Object.assign(window, {
  JournalArchiveScreen, EntryDetailScreen,
  ArticleScreen, BookmarksScreen,
  WeeklyDigestScreen, StreakBrokenScreen,
  AttuneHistoryScreen,
  MiniPlayer,
  EmptyState, LoadingShimmer, OfflineBanner, Toast,
  SAMPLE_ENTRIES,
});
