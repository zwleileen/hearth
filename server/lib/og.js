// Lightweight Open Graph image extractor. Fetches a URL with a strict
// timeout and byte cap, reads only the <head>, and extracts og:image
// (or twitter:image as a fallback). Returns an absolute URL string,
// or null on any failure.

const TIMEOUT_MS = 6000;
// Some editorial sites (Poetry Foundation, etc.) have huge <head> sections
// with many preload links before the og:image meta. 250KB covers them.
const MAX_BYTES = 250_000;
// Use a real browser User-Agent. Many editorial sites (Cloudflare, etc.)
// 403 on bot UAs even when they otherwise allow scraping og:image.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchOgImage(url) {
  if (!url || typeof url !== 'string') return null;

  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let buffer = '';
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      total += value.length;
      if (/<\/head>/i.test(buffer)) break;
    }
    reader.cancel().catch(() => {});

    const head = buffer.split(/<\/head>/i)[0] || buffer;
    const candidate = extractMeta(head, ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']);
    if (!candidate) return null;

    try {
      const abs = new URL(candidate, url).toString();
      return abs.startsWith('http://') || abs.startsWith('https://') ? abs : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractMeta(head, properties) {
  for (const prop of properties) {
    const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re1 = new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]+content\\s*=\\s*["']([^"']+)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name)\\s*=\\s*["']${escaped}["']`, 'i');
    const m = head.match(re1) || head.match(re2);
    if (m && m[1]) return decodeHtmlEntities(m[1].trim());
  }
  return null;
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, '/');
}
