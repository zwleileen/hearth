// Hearth — journal depth, reading view, mini-player, weekly digest, states

import React from 'react';
import { BackRow, ColorBlock, Eyebrow, Headline, Icon, Kicker, LeafMark, Ph, Rule } from './atoms.jsx';
import { HEARTH_DATA } from './data.js';
import { api, isItemBookmarked } from './api.js';
import { ShareLink, SHARE_MESSAGE } from './share.jsx';

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

  // shift arrives as a number from the API and as a signed string from
  // Home. Accept both, and treat missing as "not recorded" rather than
  // crashing or inventing a zero.
  const shiftValue = (() => {
    const raw = e?.shift;
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();
  const shiftLabel = shiftValue === null
    ? ''
    : shiftValue === 0
      ? 'unchanged'
      : shiftValue > 0
        ? `${shiftValue} lighter`
        : `${Math.abs(shiftValue)} heavier`;

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

        {/* This block used to assume `shift` was always a signed STRING
            ("+2", "-1"). Home builds it that way, but the journal archive
            hands over the raw API record where shift is a NUMBER, and may
            be null on entries saved before the field existed. So opening
            an entry from All entries could crash on `.startsWith` of
            undefined. Normalised here, and the whole block hides when
            there is nothing to report. */}
        {shiftLabel && (
          <>
            <Eyebrow tone={e.tone}>How writing it sat</Eyebrow>
            <div className="card-soft" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `var(--${e.tone})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--night)', fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', flexShrink: 0 }}>
                {shiftValue > 0 ? `+${shiftValue}` : String(shiftValue)}
              </div>
              <p className="serif" style={{ margin: 0, fontSize: 15, fontStyle: 'italic', fontWeight: 380, color: 'var(--paper-2)', lineHeight: 1.4 }}>
                {e.mood ? `Felt ${e.mood}. ` : ''}Writing made it {shiftLabel}.
              </p>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={() => go('journal')}>Write again</button>
          <button className="btn btn-ghost" onClick={() => setShowShare(true)}>Keep it</button>
        </div>
      </div>

      {showShare && <ShareSheet entry={e} onClose={() => setShowShare(false)}/>}
    </div>
  );
}

// Keep an entry.
//
// This is deliberately NOT a share sheet any more, and that is the
// point. A journal entry is the confessional surface: written to work
// something out, unfinished, and usually about other people who did not
// agree to appear in it. Expressive writing also works partly because it
// is unwitnessed, so making it shareable quietly makes the writing
// worse: people begin composing for an audience.
//
// The previous version was worse than merely misplaced. It shared
// `body.split(/\n+/)[0]`, the FIRST line of the entry, on a page whose
// own placeholder says "Begin anywhere. Don't edit." The first line of
// an unedited entry is reliably its least considered sentence. So it
// took the most private writing in Hearth and published its worst
// sentence.
//
// What is left is copying, which is moving something you already own
// into somewhere else you own. See docs/DOCTRINE_AUDIT.md §8.
function ShareSheet({ entry, onClose }) {
  const [note, setNote] = React.useState('');

  async function asText() {
    const body = [entry?.title, '', entry?.body].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(body);
      setNote('Copied.');
    } catch { setNote('Could not copy just now.'); }
  }

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(31, 64, 69, 0.35)',
      zIndex: 50, display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        width: '100%', background: 'var(--hh-lace)', padding: '24px 22px 30px',
        borderTop: '2px solid var(--hh-green)',
      }}>
        <Eyebrow>Keep it</Eyebrow>
        <h3 className="h-section serif" style={{ margin: '8px 0 6px', fontStyle: 'italic', fontWeight: 380 }}>
          Take it with you.
        </h3>
        <p className="body-sm" style={{ margin: '0 0 18px', maxWidth: 420 }}>
          Your entries stay yours. Copy this one wherever else it belongs. If a line in it is worth sending to someone, keep that line on its own and share it from the meaning log.
        </p>

        <button onClick={asText} style={{
          background: 'var(--hh-green)', color: 'var(--hh-lace)', border: 0,
          padding: '13px 22px', cursor: 'pointer',
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>Copy the entry</button>

        {note && <p className="body-sm" style={{ margin: '14px 0 0', color: 'var(--paper-mute)' }}>{note}</p>}

        <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}>Close</button>
      </div>
    </div>
  );
}


// The in-app article reader and its magazine fixtures are gone with the
// reading room. Today's one thing links out to its real source instead
// of reprinting someone else's writing inside Hearth.

function BookmarksScreen({ go }) {
  const [bookmarks, setBookmarks] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  // Weekly reflection brief. Best-effort; empty on cold start / unauth.
  const [brief, setBrief] = React.useState('');

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
    (async () => {
      try {
        const { brief } = await api.digest.nookBrief();
        if (!cancelled) setBrief(brief || '');
      } catch { /* cold start / unauth: leave empty */ }
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

      {/* Weekly reflection — what the shelf says about what matters now */}
      {brief && (
        <div style={{ background: 'var(--hh-isabel)', padding: '22px 24px', margin: '0 0 22px' }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hh-green)', marginBottom: 10 }}>
            What your shelf holds
          </div>
          <p className="serif" style={{ margin: 0, fontSize: 16.5, lineHeight: 1.65, fontStyle: 'italic', color: 'var(--hh-green)' }}>
            {brief}
          </p>
        </div>
      )}

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
                        {/* The Nook is the most naturally shareable place
                            in Hearth and had nothing. What is saved here
                            is someone else's already-public work, so there
                            is no exposure in passing it on, and a saved
                            poem or passage is a real quotation, which is
                            the only kind of text allowed the quote marks.
                            Where we hold the words we send the words;
                            where the object lives elsewhere we send the
                            link. See docs/DOCTRINE_AUDIT.md §8. */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
                          {(b.excerpt && (b.kind === 'poem' || b.kind === 'book'))
                            ? <ShareLink text={b.excerpt} attribution={b.source || ''} quoted message={SHARE_MESSAGE.saved} label="Share"/>
                            : b.url
                              ? <ShareLink text={[b.title, b.source].filter(Boolean).join(' · ')} url={b.url} message={SHARE_MESSAGE.saved} label="Share"/>
                              : <ShareLink text={[b.title, b.source].filter(Boolean).join(' · ')} message={SHARE_MESSAGE.saved} label="Share"/>}
                          <button onClick={(e) => { e.stopPropagation(); removeBookmark(b.id); }}
                            aria-label="Remove from Nook"
                            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-faint)' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--paper-mute)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--paper-faint)'; }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Remove</span>
                          </button>
                        </div>
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
// The weekly digest stack (computeWeekly, WeeklyDigestScreen) is gone.
// It was exported and never routed, left from a retired weekly-review
// page; bibliotherapy moved into Attune as excerpts long ago.

// StreakBrokenScreen is gone. Hearth refuses streaks on doctrine
// (BRAND_BRIEF §8.9: continuity is light that accumulates, never guilt),
// and a screen for having broken one was the last of that vocabulary.

// AttuneHistoryScreen is gone. It was a mock: five hardcoded readings
// from static fixtures, a fake of a feature that already exists for
// real inside Attune ("Logbook"). It was only still reachable from the
// mini player, which is also gone.

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
  JournalArchiveScreen, EntryDetailScreen, BookmarksScreen,
  EmptyState, LoadingShimmer, OfflineBanner, Toast,
};
