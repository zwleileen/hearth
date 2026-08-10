// Hearth — where to go and hear it.
//
// Attune's whole flow used to dead-end at the moment of highest intent:
// three songs, chosen carefully, with a real reason each, and no way to
// hear any of them. The reader's next move was to retype the title into
// another app.
//
// WHY A SEARCH LINK RATHER THAN THE EXACT TRACK.
//
// Resolving the precise track needs the Spotify Web API: a developer
// app, a client secret on the server, token caching, and a resolver that
// runs per reading. That is a real upgrade and it is worth doing later
// (it also gives album art). But a search deep link costs nothing, needs
// no key, no auth, no rate limit and no maintenance, works for every
// reader on day one, and lands on the right song the overwhelming
// majority of the time. Ship the cheap one, earn the expensive one.
//
// WHY THREE SERVICES.
//
// Hardcoding Spotify quietly tells an Apple Music reader that Hearth was
// not built for them. The choice is remembered per device; nobody is
// asked twice.
//
// A NOTE ON THE LINK FORM. These are https universal links, not
// spotify:/music: URI schemes. A universal link opens the native app
// when it is installed and falls back to the web player when it is not.
// A URI scheme fails silently on a device without the app, which is the
// worst possible outcome: a tap that does nothing at all.

const KEY = 'hearth.listen';

export const SERVICES = [
  {
    key: 'spotify',
    label: 'Spotify',
    url: (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  },
  {
    key: 'apple',
    label: 'Apple Music',
    url: (q) => `https://music.apple.com/search?term=${encodeURIComponent(q)}`,
  },
  {
    key: 'youtube',
    label: 'YouTube Music',
    url: (q) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
  },
];

const DEFAULT = 'spotify';

export function getListenService() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && SERVICES.some((s) => s.key === stored)) return stored;
  } catch { /* private mode, or storage disabled */ }
  return DEFAULT;
}

export function setListenService(key) {
  try {
    if (SERVICES.some((s) => s.key === key)) localStorage.setItem(KEY, key);
  } catch { /* nothing to do; the default still works */ }
}

export function serviceLabel(key) {
  return (SERVICES.find((s) => s.key === key) || SERVICES[0]).label;
}

// The next service in the list, so "change" is one tap rather than a menu.
export function nextService(key) {
  const i = SERVICES.findIndex((s) => s.key === key);
  return SERVICES[(i + 1) % SERVICES.length].key;
}

// Build the link. Title and artist together, because a title alone
// ("Anthem", "Wild Geese") is far too ambiguous to land anywhere useful.
export function listenUrl(service, { title, artist } = {}) {
  const svc = SERVICES.find((s) => s.key === service) || SERVICES[0];
  const query = [title, artist].map((x) => (x || '').trim()).filter(Boolean).join(' ');
  if (!query) return null;
  return svc.url(query);
}
