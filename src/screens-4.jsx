// Hearth — journal depth, reading view, mini-player, weekly digest, states

import React from 'react';
import { BackRow, ColorBlock, Eyebrow, Headline, Icon, Kicker, LeafMark, Ph, Rule } from './atoms.jsx';
import { HEARTH_DATA } from './data.js';
import { api } from './api.js';

// ─────────────────────────────────────────────────────────────
// Helpers — format backend records for display
// ─────────────────────────────────────────────────────────────
const MOOD_TONE = {
  tender: 'rose', grateful: 'meadow', heavy: 'wisteria', hopeful: 'ember',
  raw: 'fern', restless: 'citron', quiet: 'wisteria', joyful: 'meadow',
  anxious: 'citron', sad: 'wisteria', content: 'rose',
};

function moodTone(mood) {
  if (!mood) return 'wisteria';
  return MOOD_TONE[mood.toLowerCase()] || 'wisteria';
}

function formatEntryDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const sameYesterday = d.toDateString() === yesterday.toDateString();
  const hour = d.getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  if (sameDay) return `Today · ${partOfDay}`;
  if (sameYesterday) return `Yesterday · ${partOfDay}`;
  return `${weekday} · ${partOfDay}`;
}

function entryExcerpt(body, max = 140) {
  if (!body) return '';
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > max ? flat.slice(0, max).trimEnd() + '…' : flat;
}

// ─────────────────────────────────────────────────────────────
// JOURNAL — archive (search + filter + tags)
// ─────────────────────────────────────────────────────────────
const SAMPLE_ENTRIES = [
  { id: 'e1', date: 'Yesterday · evening', title: 'A small unhurried good', mood: 'tender', shift: '+1', tone: 'rose',
    excerpt: "The kettle was the loudest thing in the kitchen, and that was enough. I noticed I was holding my shoulders the way…",
    body: "The kettle was the loudest thing in the kitchen, and that was enough. I noticed I was holding my shoulders the way I used to, before I learned to put them down. The day asked little of me, just to be present for the small unhurried goods. The light through the window. The cat's slow blink. A friend's voicemail I'd forgotten to listen to until tonight.\n\nWhat I want to remember: that not every evening has to be a recovery from the day. Some evenings, I just step into them.",
    tags: ['gratitude', 'tender'], lineage: 'Three good things' },
  { id: 'e2', date: 'Wed · morning', title: 'WOOP for the meeting', mood: 'restless', shift: '+2', tone: 'citron',
    excerpt: "Wish: that the proposal lands. Outcome: relief and a small celebration. Obstacle: I rush when I'm nervous…",
    body: "Wish: that the proposal lands well with the team.\nOutcome: relief, a small celebration, and a few hours where I'm not bracing.\nObstacle: I rush when I'm nervous, and rush sounds like I haven't thought it through.\nPlan: when I feel the rush rising, I'll take a sip of water before answering. Water as a comma.",
    tags: ['intention', 'work'], lineage: 'WOOP' },
  { id: 'e3', date: 'Tue · evening', title: 'Three good things', mood: 'grateful', shift: '+1', tone: 'meadow',
    excerpt: "The bread rose. The walk back was longer than I needed and I let it be. A stranger smiled, and I let it land…",
    body: "The bread rose. The walk back was longer than I needed and I let it be. A stranger smiled, and I let it land.\n\nWhy: I'd left margin in the day. I'd told myself I could.\n\nMy part: I'd planned for an unhurried evening, and I held to it.",
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
    body: "[Twenty minutes of expressive writing, kept private.]",
    tags: ['expressive', 'grief'], lineage: 'Expressive writing' },
];

function JournalArchiveScreen({ go }) {
  const [q, setQ] = React.useState('');
  const [tag, setTag] = React.useState(null);
  const [entries, setEntries] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { entries } = await api.journal.list();
        if (!cancelled) setEntries(entries.map(e => ({
          id: e.id,
          rawDate: e.createdAt,
          date: formatEntryDate(e.createdAt),
          title: e.title || 'Untitled',
          mood: e.mood,
          shift: e.shift !== null && e.shift !== undefined ? `${e.shift > 0 ? '+' : ''}${e.shift}` : '',
          tone: moodTone(e.mood),
          excerpt: entryExcerpt(e.body),
          body: e.body,
          tags: e.tags || [],
          lineage: e.promptLineage,
          mode: e.mode,
        })));
      } catch (err) {
        if (!cancelled) setLoadError(err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loadError && loadError.status === 401) {
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px', textAlign: 'center' }}>
        <BackRow go={go} label="Journal" dest="journal"/>
        <Eyebrow ember style={{ marginTop: 32 }}>Sign in</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 14px', fontWeight: 350 }}>
          Your archive<br/><span style={{ fontStyle: 'italic' }}>is kept private.</span>
        </h1>
        <p className="body" style={{ maxWidth: 280, margin: '0 auto 22px' }}>
          Sign in to see what you've written here.
        </p>
        <button className="btn btn-ember" onClick={() => go('auth')}>Sign in</button>
      </div>
    );
  }

  const list = entries || [];
  const allTags = Array.from(new Set(list.flatMap(e => e.tags)));
  const filtered = list.filter(e => {
    if (tag && !e.tags.includes(tag)) return false;
    if (q && !((e.title || '') + ' ' + (e.excerpt || '') + ' ' + (e.body || '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fade-in" style={{ padding: '4px 22px 32px' }}>
      <BackRow go={go} label="Journal" dest="journal"/>
      <Eyebrow ember style={{ marginTop: 18 }}>The kept</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
        Everything you've<br/><span style={{ fontStyle: 'italic' }}>written here.</span>
      </h1>
      <p className="body" style={{ margin: '0 0 18px', maxWidth: 420 }}>
        Your own words, kept warm. Search by phrase, mood, or theme.
      </p>

      <div style={{ position: 'relative' }}>
        <input className="hearth-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by word, mood, or month…"
          style={{ fontSize: 15, paddingLeft: 42 }}/>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--paper-faint)' }}>
          {Icon.compass(18, 'var(--paper-faint)')}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        <button onClick={() => setTag(null)} className={`chip ${tag === null ? 'chip-ember' : ''}`}
          style={{ cursor: 'pointer', border: tag === null ? undefined : '1px solid var(--paper-line)' }}>All · {list.length}</button>
        {allTags.map(t => (
          <button key={t} onClick={() => setTag(t === tag ? null : t)} className={`chip ${tag === t ? 'chip-meadow' : ''}`}
            style={{ cursor: 'pointer', border: tag === t ? undefined : '1px solid var(--paper-line)' }}>{t}</button>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        {entries === null ? (
          <LoadingShimmer lines={4}/>
        ) : list.length === 0 ? (
          <EmptyState
            title="A quiet shelf for now."
            sub="When you write something you want to keep, it lands here."
            action="Open the Journal"
            onAction={() => go('journal')}/>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing matches yet."
            sub="Try a softer word, or clear the filter."/>
        ) : (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((e) => (
              <div key={e.id} className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => go('entry-detail', { entry: e })}>
                <div aria-hidden style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 2, background: `var(--${e.tone})`, borderRadius: 2 }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: `var(--${e.tone})`, textTransform: 'uppercase' }}>
                    {e.date}
                  </span>
                  {e.mood && <span className={`chip chip-${e.tone}`}>{e.mood}{e.shift ? ` · ${e.shift}` : ''}</span>}
                </div>
                <h3 className="serif" style={{ margin: '8px 0 6px', fontSize: 18, fontStyle: 'italic', fontWeight: 380 }}>{e.title}</h3>
                <p className="body-sm" style={{ margin: 0 }}>{e.excerpt}</p>
                {e.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {e.tags.map(t => <span key={t} className="chip" style={{ fontSize: 10, padding: '4px 10px' }}>{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
        {/* pressed leaf in the margin, the user's signature on a kept entry */}
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
  const M = HEARTH_DATA.magazine;
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
        Building with what is local, earth, light, the patience of a community that has agreed to spend its Saturdays, is not a romantic gesture. It is, the architect would tell you, the only way a building can know the climate it stands in.
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
      Every prompt and ritual in Hearth is drawn from a body of peer-reviewed work. We don't claim novelty, we curate replication.
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
  const [bookmarks, setBookmarks] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { bookmarks } = await api.bookmarks.list();
        if (!cancelled) setBookmarks(bookmarks);
      } catch (err) {
        if (!cancelled) setLoadError(err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function removeBookmark(id) {
    try {
      await api.bookmarks.remove(id);
      setBookmarks(prev => (prev || []).filter(b => b.id !== id));
    } catch {
      // surface inline later if useful
    }
  }

  if (loadError && loadError.status === 401) {
    return (
      <div className="fade-in" style={{ padding: '40px 28px 32px', textAlign: 'center' }}>
        <Eyebrow tone="rose" style={{ marginTop: 32 }}>The Nook</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 14px', fontWeight: 350 }}>
          A quiet shelf,<br/><span style={{ fontStyle: 'italic' }}>kept private.</span>
        </h1>
        <p className="body" style={{ maxWidth: 320, margin: '0 auto 22px' }}>
          Sign in to see the songs, books, poems, and articles you've saved.
        </p>
        <button className="btn btn-ember" onClick={() => go('auth')}>Sign in</button>
      </div>
    );
  }

  const KIND_LABEL = { article: 'Articles', essay: 'Essays', poem: 'Poems', book: 'Books', news: 'News', song: 'Songs' };
  const KIND_TONE = { article: 'ember', essay: 'wisteria', poem: 'rose', book: 'meadow', news: 'citron', song: 'bloom' };
  const KIND_ORDER = ['song', 'poem', 'book', 'essay', 'article', 'news'];

  const list = bookmarks || [];
  const visible = filter === 'all' ? list : list.filter(b => b.kind === filter);
  const counts = list.reduce((acc, b) => { acc[b.kind] = (acc[b.kind] || 0) + 1; return acc; }, {});
  const presentKinds = KIND_ORDER.filter(k => counts[k]);

  // Group visible items by kind for editorial layout when filter is 'all'
  const grouped = (() => {
    if (filter !== 'all') return [{ kind: filter, items: visible }];
    return presentKinds.map(k => ({ kind: k, items: visible.filter(b => b.kind === k) }));
  })();

  const KIND_ACCENT = {
    song:    { color: 'var(--hh-dogwood)', deep: 'var(--hh-dogwood-deep)' },
    poem:    { color: 'var(--hh-dogwood)', deep: 'var(--hh-dogwood-deep)' },
    book:    { color: 'var(--hh-blue)',    deep: 'var(--hh-blue-deep)' },
    essay:   { color: 'var(--hh-ecru)',    deep: 'var(--hh-ecru-deep)' },
    article: { color: 'var(--hh-ecru)',    deep: 'var(--hh-ecru-deep)' },
    news:    { color: 'var(--hh-green)',   deep: 'var(--hh-green)' },
  };

  return (
    <div className="fade-in" style={{ padding: '14px 22px 32px' }}>
      <Eyebrow tone="rose">The Nook</Eyebrow>
      <h1 className="h-display serif" style={{ margin: '8px 0 8px', fontWeight: 350 }}>
        Everything you've<br/><span style={{ fontStyle: 'italic' }}>kept close.</span>
      </h1>
      <p className="body" style={{ margin: '0 0 18px', maxWidth: 420 }}>
        Songs, poems, books, and articles you've saved from Hearth and Attune. Yours alone, here whenever you want them.
      </p>

      {bookmarks !== null && list.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 22 }}>
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'chip-ember' : ''}`}
            style={{ cursor: 'pointer', border: filter === 'all' ? undefined : '1px solid var(--paper-line)' }}>All · {list.length}</button>
          {presentKinds.map(k => (
            <button key={k} onClick={() => setFilter(k)} className={`chip ${filter === k ? `chip-${KIND_TONE[k] || 'meadow'}` : ''}`}
              style={{ cursor: 'pointer', border: filter === k ? undefined : '1px solid var(--paper-line)' }}>
              {KIND_LABEL[k] || k} · {counts[k]}
            </button>
          ))}
        </div>
      )}

      {bookmarks === null ? (
        <LoadingShimmer lines={4}/>
      ) : list.length === 0 ? (
        <div style={{ marginTop: 20, padding: '32px 0', borderTop: '1px solid var(--paper-line-2)', borderBottom: '1px solid var(--paper-line-2)' }}>
          <p className="serif" style={{ margin: 0, fontSize: 18, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-mute)', maxWidth: 380 }}>
            The Nook is empty for now. Save what you want to come back to.
          </p>
          <p className="body-sm" style={{ marginTop: 14, maxWidth: 380 }}>
            Tap <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--hh-green)', padding: '2px 8px', border: '1px solid var(--paper-line)', borderRadius: 999 }}>Save</span> on any article on Hearth or any song, book, or poem from Attune. It will appear here.
          </p>
          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            <button className="btn btn-ember" onClick={() => go('home')}>Go to Hearth</button>
            <button className="btn btn-ghost" onClick={() => go('attune')}>Open Attune</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {grouped.map(({ kind, items }) => {
            if (!items.length) return null;
            const accent = KIND_ACCENT[kind] || { color: 'var(--hh-green)', deep: 'var(--hh-green)' };
            return (
              <section key={kind}>
                {filter === 'all' && (
                  <div className="hearth-dept-head">
                    <span className="hearth-dept-head-title" style={{ color: accent.deep }}>
                      {KIND_LABEL[kind] || kind}
                    </span>
                    <span className="hearth-dept-head-meta">
                      {items.length} {items.length === 1 ? 'kept' : 'kept'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {items.map((b, i) => {
                    const open = () => {
                      if (b.url) window.open(b.url, '_blank', 'noopener,noreferrer');
                    };
                    return (
                      <div key={b.id} style={{
                        display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative',
                        padding: '20px 0',
                        borderBottom: '1px solid var(--paper-line-2)',
                      }}>
                        <div aria-hidden style={{
                          width: 28, flexShrink: 0,
                          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em',
                          color: accent.deep, fontWeight: 500, paddingTop: 2,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div style={{ flex: 1, cursor: b.url ? 'pointer' : 'default', minWidth: 0 }} onClick={open}>
                          <h3 className="serif" style={{ margin: 0, fontSize: 19, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.2, color: 'var(--hh-green)' }}>{b.title}</h3>
                          {b.source && (
                            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase', marginTop: 6 }}>
                              {b.source}
                            </div>
                          )}
                          {b.excerpt && (
                            <p className="body-sm" style={{ margin: '10px 0 0', color: 'var(--paper-2)', lineHeight: 1.55 }}>
                              {b.excerpt}
                            </p>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeBookmark(b.id); }}
                          aria-label="Remove from Nook"
                          style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', color: 'var(--paper-faint)', flexShrink: 0 }}
                          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--paper-mute)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--paper-faint)'; }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Remove</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// WEEKLY DIGEST — real data: last 7 days of journal + bookmarks
// ─────────────────────────────────────────────────────────────
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function dayKey(d) { return startOfDay(d).toISOString().slice(0, 10); }
function wordCount(s) { return (s || '').trim().split(/\s+/).filter(Boolean).length; }

function computeWeekly(entries, bookmarks) {
  const now = new Date();
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6); // 7-day window ending today

  const weekEntries = (entries || []).filter(e => new Date(e.createdAt) >= weekStart);
  const weekBookmarks = (bookmarks || []).filter(b => new Date(b.createdAt) >= weekStart);

  // Per-day: array of 7 day keys (oldest -> today), each with count + avg shift
  const dayKeys = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    dayKeys.push(dayKey(d));
  }
  const perDay = dayKeys.map(k => {
    const entriesForDay = weekEntries.filter(e => dayKey(new Date(e.createdAt)) === k);
    const shifts = entriesForDay.map(e => e.shift).filter(s => s !== null && s !== undefined);
    const avgShift = shifts.length ? shifts.reduce((a, b) => a + b, 0) / shifts.length : null;
    const date = new Date(k + 'T00:00:00');
    return {
      key: k,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase().slice(0, 3),
      count: entriesForDay.length,
      avgShift,
    };
  });

  const daysWritten = perDay.filter(d => d.count > 0).length;
  const totalWords = weekEntries.reduce((sum, e) => sum + wordCount(e.body), 0);
  const writingMinutes = Math.max(0, Math.round(totalWords / 30)); // ~30 wpm for thoughtful writing
  const allShifts = weekEntries.map(e => e.shift).filter(s => s !== null && s !== undefined);
  const avgShift = allShifts.length ? (allShifts.reduce((a, b) => a + b, 0) / allShifts.length) : null;

  // Tags + lineages
  const tagFreq = {};
  const lineageFreq = {};
  for (const e of weekEntries) {
    for (const t of (e.tags || [])) tagFreq[t] = (tagFreq[t] || 0) + 1;
    if (e.promptLineage) lineageFreq[e.promptLineage] = (lineageFreq[e.promptLineage] || 0) + 1;
  }
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topLineages = Object.entries(lineageFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Bookmarks by source
  const attuneSaves = weekBookmarks.filter(b => b.meta?.savedFrom === 'attune');
  const homeSaves = weekBookmarks.filter(b => b.meta?.savedFrom === 'home');

  // Notable phrase: longest sentence under 200 chars from the most recent entry
  let phrase = null;
  if (weekEntries.length) {
    const recent = weekEntries[0]; // entries returned newest-first
    const sentences = (recent.body || '').split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(s => s.length > 30 && s.length < 200);
    if (sentences.length) phrase = sentences.sort((a, b) => b.length - a.length)[0];
  }

  return {
    weekStart, now,
    perDay,
    daysWritten,
    totalEntries: weekEntries.length,
    totalWords,
    writingMinutes,
    avgShift,
    topTags,
    topLineages,
    attuneSaves,
    homeSaves,
    weekBookmarks,
    phrase,
    weekEntries,
  };
}

function WeeklyDigestScreen({ go }) {
  const [entries, setEntries] = React.useState(null);
  const [bookmarks, setBookmarks] = React.useState(null);
  const [unauthed, setUnauthed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [j, b] = await Promise.all([api.journal.list(), api.bookmarks.list()]);
        if (cancelled) return;
        setEntries(j.entries || []);
        setBookmarks(b.bookmarks || []);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) setUnauthed(true);
        else { setEntries([]); setBookmarks([]); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (unauthed) {
    return (
      <div className="fade-in" style={{ padding: '40px 22px 32px', textAlign: 'center' }}>
        <Eyebrow tone="ember" style={{ marginTop: 32 }}>Weekly review</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 14px', fontWeight: 350 }}>
          Your week is yours,<br/><span style={{ fontStyle: 'italic' }}>kept private.</span>
        </h1>
        <p className="body" style={{ maxWidth: 320, margin: '0 auto 22px' }}>
          Sign in to see a real reflection on what you've written and saved.
        </p>
        <button className="btn btn-ember" onClick={() => go('auth')}>Sign in</button>
      </div>
    );
  }

  if (entries === null || bookmarks === null) {
    return (
      <div className="fade-in" style={{ padding: '14px 22px 32px' }}>
        <Eyebrow tone="ember">Weekly review</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 18px', fontWeight: 350 }}>
          Gathering<br/><span style={{ fontStyle: 'italic' }}>the week…</span>
        </h1>
        <LoadingShimmer lines={5}/>
      </div>
    );
  }

  const w = computeWeekly(entries, bookmarks);
  const weekRange = (() => {
    const s = w.weekStart, n = w.now;
    const fmt = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return `${fmt(s)} – ${fmt(n)}`;
  })();

  // Mood arc geometry — only render line through days with data
  const arcPoints = w.perDay.map((d, i) => {
    if (d.avgShift === null) return null;
    const x = 20 + i * 43;
    // shift range -2..+2 -> y range minY..maxY (inverted for SVG)
    const y = 86 - ((d.avgShift + 2) / 4) * (86 - 14);
    return { x, y, ...d };
  });
  const linePath = (() => {
    const pts = arcPoints.filter(Boolean);
    if (pts.length < 2) return null;
    return `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  })();

  // Mood arc copy
  const arcLine = (() => {
    if (w.daysWritten === 0) return 'No entries this week. The line is drawn the day you next write.';
    if (w.daysWritten === 1) return 'One day kept. The line begins.';
    const written = w.perDay.filter(d => d.avgShift !== null);
    if (written.length >= 2) {
      const first = written[0].avgShift, last = written[written.length - 1].avgShift;
      if (last > first + 0.4) return `The line lifted across the week. ${w.daysWritten} days written.`;
      if (last < first - 0.4) return `The line softened across the week. That, too, is information.`;
    }
    return `${w.daysWritten} days written. The line steadies, neither lifting nor falling much.`;
  })();

  const isEmpty = w.totalEntries === 0 && w.weekBookmarks.length === 0;

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Cover */}
      <section style={{ padding: '14px 22px 0' }}>
        <Eyebrow tone="ember">Weekly review · {weekRange}</Eyebrow>
        <h1 className="h-display serif" style={{ margin: '8px 0 14px', fontWeight: 350 }}>
          A small look back<br/><span style={{ fontStyle: 'italic' }}>at the week.</span>
        </h1>
        <p className="body" style={{ margin: '0 0 0', maxWidth: 380 }}>
          {isEmpty
            ? 'A quiet week on Hearth. Nothing to review yet, and that is its own kind of rest.'
            : `${w.daysWritten} of 7 days kept. ${w.weekBookmarks.length} ${w.weekBookmarks.length === 1 ? 'piece' : 'pieces'} added to the Nook.`}
        </p>
      </section>

      {/* Stats */}
      <section style={{ padding: '40px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">By the numbers</span>
          <span className="hearth-dept-head-meta">{w.totalEntries} {w.totalEntries === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
          marginTop: 14, borderTop: '1px solid var(--paper-line)',
        }}>
          {[
            { big: `${w.daysWritten}/7`, label: 'days kept' },
            { big: String(w.totalEntries), label: w.totalEntries === 1 ? 'entry' : 'entries' },
            { big: w.writingMinutes ? `${w.writingMinutes}m` : ', ', label: 'of writing' },
            { big: w.avgShift !== null ? `${w.avgShift > 0 ? '+' : ''}${w.avgShift.toFixed(1)}` : ', ', label: 'avg shift' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '20px 0',
              borderBottom: '1px solid var(--paper-line)',
              borderRight: i % 2 === 0 ? '1px solid var(--paper-line)' : 'none',
              paddingLeft: i % 2 === 0 ? 0 : 18,
              paddingRight: i % 2 === 0 ? 18 : 0,
            }}>
              <div className="serif" style={{ fontSize: 36, fontWeight: 350, letterSpacing: '-0.02em', color: 'var(--paper)', lineHeight: 1 }}>{s.big}</div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--paper-mute)', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mood arc */}
      <section style={{ padding: '40px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title" style={{ color: 'var(--hh-blue-deep)' }}>Mood arc</span>
          <span className="hearth-dept-head-meta">7 days</span>
        </div>
        <div style={{ marginTop: 18 }}>
          <svg viewBox="0 0 300 110" style={{ width: '100%', height: 130 }}>
            {[14, 38, 62, 86].map(y => (
              <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(31, 64, 69, 0.08)" strokeWidth="0.5"/>
            ))}
            {/* zero line */}
            <line x1="0" x2="300" y1={50} y2={50} stroke="rgba(31, 64, 69, 0.20)" strokeDasharray="2 4" strokeWidth="0.6"/>
            {linePath && (
              <path d={linePath} stroke="var(--hh-green)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            )}
            {arcPoints.map((p, i) => {
              const x = 20 + i * 43;
              if (!p) {
                return <circle key={i} cx={x} cy={50} r={3} fill="var(--hh-lace)" stroke="var(--paper-faint)" strokeWidth="1"/>;
              }
              return <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--hh-green)" stroke="var(--hh-green)" strokeWidth="1"/>;
            })}
          </svg>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 4,
            fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em',
            color: 'var(--paper-mute)', padding: '0 14px',
          }}>
            {w.perDay.map(d => <span key={d.key}>{d.label}</span>)}
          </div>
        </div>
        <p className="body" style={{ margin: '18px 0 0', fontSize: 14, color: 'var(--paper-mute)' }}>
          {arcLine} Filled dots are days you wrote.
        </p>
      </section>

      {/* What was alive, themes */}
      {(w.topTags.length > 0 || w.topLineages.length > 0) && (
        <section style={{ padding: '40px 22px 0' }}>
          <div className="hearth-dept-head">
            <span className="hearth-dept-head-title" style={{ color: 'var(--hh-ecru-deep)' }}>What was alive</span>
            <span className="hearth-dept-head-meta">themes</span>
          </div>
          {w.topTags.length > 0 && (
            <Headline size="section" style={{ marginTop: 18, fontWeight: 380 }}>
              You wrote about{' '}
              {w.topTags.map(([t], i) => (
                <span key={t}>
                  <span style={{ color: 'var(--hh-ecru-deep)', fontStyle: 'italic' }}>{t}</span>
                  {i < w.topTags.length - 2 ? ', ' : i === w.topTags.length - 2 ? ', and ' : ''}
                </span>
              ))}
              {' '}most.
            </Headline>
          )}
          {w.topLineages.length > 0 && (
            <p className="body" style={{ margin: '16px 0 0' }}>
              Practices used: {w.topLineages.map(([l, n], i) => (
                <span key={l}>
                  {l}{n > 1 ? ` (${n})` : ''}{i < w.topLineages.length - 1 ? ', ' : '.'}
                </span>
              ))}
            </p>
          )}
        </section>
      )}

      {/* A phrase from the week */}
      {w.phrase && (
        <section style={{ padding: '36px 0 0' }}>
          <ColorBlock accent="green" bleed style={{ padding: '38px 28px' }}>
            <Kicker accent="ecru" style={{ color: 'var(--hh-ecru)' }}>From your own page</Kicker>
            <p className="serif" style={{
              margin: '14px 0 0', fontSize: 24, fontStyle: 'italic',
              fontWeight: 360, lineHeight: 1.32, color: 'var(--hh-lace)',
            }}>
              &ldquo;{w.phrase}&rdquo;
            </p>
          </ColorBlock>
        </section>
      )}

      {/* What was attuned, saved this week */}
      {(w.attuneSaves.length > 0 || w.homeSaves.length > 0) && (
        <section style={{ padding: '40px 22px 0' }}>
          <div className="hearth-dept-head">
            <span className="hearth-dept-head-title" style={{ color: 'var(--hh-dogwood-deep)' }}>What was attuned</span>
            <span className="hearth-dept-head-meta">{w.weekBookmarks.length} kept</span>
          </div>
          <p className="body" style={{ margin: '14px 0 18px', maxWidth: 480 }}>
            What you reached for this week, kept close in the Nook.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {w.weekBookmarks.slice(0, 6).map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--paper-line-2)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                    {b.kind}{b.source ? ` · ${b.source}` : ''}
                  </div>
                  <div className="serif" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 400, color: 'var(--hh-green)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {w.weekBookmarks.length > 6 && (
            <button className="btn btn-ghost" onClick={() => go('bookmarks')} style={{ marginTop: 18 }}>
              See all in Nook
            </button>
          )}
        </section>
      )}

      {/* Recent entries this week */}
      {w.weekEntries.length > 0 && (
        <section style={{ padding: '40px 22px 0' }}>
          <div className="hearth-dept-head">
            <span className="hearth-dept-head-title">This week's entries</span>
            <span className="hearth-dept-head-meta">{w.weekEntries.length}</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' }}>
            {w.weekEntries.slice(0, 5).map(e => (
              <div key={e.id} onClick={() => go('entry-detail', { entry: {
                id: e.id,
                date: new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'short' }) + ' · ' + (new Date(e.createdAt).getHours() < 12 ? 'morning' : new Date(e.createdAt).getHours() < 18 ? 'afternoon' : 'evening'),
                title: e.title || 'Untitled',
                mood: e.mood,
                shift: e.shift !== null && e.shift !== undefined ? `${e.shift > 0 ? '+' : ''}${e.shift}` : '',
                tone: 'wisteria',
                body: e.body, tags: e.tags || [], lineage: e.promptLineage,
              } })}
                style={{ padding: '14px 0', borderBottom: '1px solid var(--paper-line-2)', cursor: 'pointer' }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--paper-mute)', textTransform: 'uppercase' }}>
                  {new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 400, color: 'var(--hh-green)', marginTop: 6 }}>
                  {e.title || 'Untitled'}
                </div>
                {e.mood && (
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--hh-green)', textTransform: 'uppercase', marginTop: 6 }}>
                    {e.mood}{e.shift !== null && e.shift !== undefined ? ` · ${e.shift > 0 ? '+' : ''}${e.shift}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The week ahead */}
      <section style={{ padding: '40px 22px 0' }}>
        <div className="hearth-dept-head">
          <span className="hearth-dept-head-title">For the week ahead</span>
          <span className="hearth-dept-head-meta">a soft suggestion</span>
        </div>
        <Headline size="section" italic style={{ marginTop: 14 }}>
          {w.daysWritten === 0 ? 'A first quiet entry.' : w.daysWritten >= 5 ? 'Keep the rhythm gentle.' : 'One small move.'}
        </Headline>
        <p className="body" style={{ margin: '14px 0 18px' }}>
          {w.daysWritten === 0
            ? 'Pick one prompt that feels easy and write four sentences. The shape of the practice is built first, before the weight.'
            : w.daysWritten >= 5
              ? 'You wrote often this week. Let some days be empty without making it a verdict.'
              : 'Two more days kept this week would be enough. Pick the days you already feel quietest.'}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ember" onClick={() => go('journal')}>
            Open journal
          </button>
          <button className="btn btn-ghost" onClick={() => go('rituals')}>
            Open rituals
          </button>
        </div>
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
        <button className="btn btn-ember" style={{ justifyContent: 'center' }} onClick={() => go('journal-write', { mode: 'evening', prompt: HEARTH_DATA.eveningPrompts[0] })}>
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
  const D = HEARTH_DATA;
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
        You're offline. Hearth still works, your writing waits here.
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

export {
  JournalArchiveScreen, EntryDetailScreen,
  ArticleScreen, BookmarksScreen,
  WeeklyDigestScreen, StreakBrokenScreen,
  AttuneHistoryScreen,
  MiniPlayer,
  EmptyState, LoadingShimmer, OfflineBanner, Toast,
  SAMPLE_ENTRIES,
};
