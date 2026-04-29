// Hearth API client. Calls go through Vite's /api proxy in dev,
// and to the same origin in production.

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
};
