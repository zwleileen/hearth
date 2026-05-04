// Hearth API client. Calls go through Vite's /api proxy in dev,
// and to the same origin in production.

// ─── Bookmark identity helpers ───────────────────────────────────────
// Match an item being rendered on a Save-able surface (home reading
// room item, attune song/poem, digest book) against the bookmarks
// list, so the "Saved" state survives navigation. The bug we're
// fixing: per-screen `saved` maps reset when the component unmounts,
// causing the same item to be savable multiple times.
//
// Bookmark.kind is one of: 'article' | 'song' | 'book' | 'poem'
// Item.kind on the wire can also be 'essay' or 'news' from the
// discover schema, both of which collapse to 'article' on save.

export function bookmarkKindFor(item) {
  if (!item || !item.kind) return null;
  if (item.kind === 'essay' || item.kind === 'news') return 'article';
  return item.kind;
}

// The item's "second name" — the artist for a song, poet for a poem,
// author for a book, source/publication for an article. Used as a
// secondary match signal when titles collide (common for one-word
// poem titles like "Wild geese" or generic article titles).
export function itemAuthor(item) {
  if (!item) return '';
  return item.artist || item.poet || item.author || item.source || '';
}

// Find an existing bookmark that represents this item, or null.
// Match priority: same-url first (most specific), then (kind, title)
// with author confirmation when both sides have one.
export function findBookmarkFor(bookmarks, item) {
  if (!Array.isArray(bookmarks) || !item) return null;
  const wantKind = bookmarkKindFor(item);
  if (!wantKind) return null;
  const wantUrl = (item.url || '').trim();
  const wantAuthor = itemAuthor(item).trim().toLowerCase();
  for (const b of bookmarks) {
    if (b.kind !== wantKind) continue;
    if (wantUrl && b.url && b.url === wantUrl) return b;
    if (!b.title || !item.title) continue;
    if (b.title.trim().toLowerCase() !== item.title.trim().toLowerCase()) continue;
    // Title match. Confirm with author if both sides have one;
    // otherwise accept the title match (no author available).
    const haveAuthor = (b.source || '').trim().toLowerCase();
    if (!haveAuthor || !wantAuthor) return b;
    if (haveAuthor === wantAuthor) return b;
  }
  return null;
}

export function isItemBookmarked(bookmarks, item) {
  return !!findBookmarkFor(bookmarks, item);
}

const TOKEN_KEY = 'hearth.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/health', { auth: false }),

  auth: {
    signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
    signin: (payload) => request('/auth/signin', { method: 'POST', body: payload, auth: false }),
    me: () => request('/auth/me'),
  },

  profile: {
    get: () => request('/profile'),
    update: (payload) => request('/profile', { method: 'PATCH', body: payload }),
  },

  journal: {
    list: () => request('/journal'),
    get: (id) => request(`/journal/${id}`),
    create: (entry) => request('/journal', { method: 'POST', body: entry }),
    update: (id, patch) => request(`/journal/${id}`, { method: 'PATCH', body: patch }),
    remove: (id) => request(`/journal/${id}`, { method: 'DELETE' }),
  },

  bookmarks: {
    list: () => request('/bookmarks'),
    create: (item) => request('/bookmarks', { method: 'POST', body: item }),
    remove: (id) => request(`/bookmarks/${id}`, { method: 'DELETE' }),
  },

  discover: {
    today: ({ refresh = false } = {}) =>
      request(`/discover/today${refresh ? '?refresh=1' : ''}`),
  },

  attune: {
    recommend: (mood) => request('/attune', { method: 'POST', body: { mood } }),
  },

  digest: {
    bibliotherapy: ({ refresh = false } = {}) =>
      request(`/digest/bibliotherapy${refresh ? '?refresh=1' : ''}`),
  },
};
