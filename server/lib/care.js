// server/lib/care.js
//
// The care backstop, shared by every surface where a reader writes free
// text (Carry sessions, the journal, Attune). Two jobs:
//
//   1. detectDistress — a cheap keyword scan that runs alongside (never
//      instead of) a model's own read. We OR the two so help still shows
//      when the model misses the signal.
//   2. resourcesFor  — real crisis lines, composed HERE and never by a
//      model, so a hallucinated number can never reach a reader at their
//      lowest.
//
// A NOTE ON SCOPE (docs/HEARTH_BRAND_BRIEF.md §5.9). Hearth is a
// companion, not a clinician, and this file is deliberately small
// because of it. It does not assess, triage, score, or plan. It notices
// that someone may be carrying more than a reading can hold, and it
// hands them a real number. That is the whole remit.

// ── Detection ─────────────────────────────────────────────────────────
//
// Two tiers. EXPLICIT catches stated intent. OBLIQUE catches the way
// distress is far more often actually written: hopelessness, feeling
// like a burden, valediction, disappearing. Oblique phrasing is the
// common presentation, so leaving it out was the real gap.
//
// Word-boundary matched so substrings ("therapist", "assist") never
// trip it. We deliberately err toward showing help: a false positive
// costs a reader one quiet block they can ignore, a false negative is
// the failure that matters.

const EXPLICIT = [
  /\bkill(?:ing)? myself\b/i,
  /\bend (?:it|it all|my life|things)\b/i,
  /\b(?:want|going|plan(?:ning)?) to die\b/i,
  /\bwant to be dead\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\btake my own life\b/i,
  /\bself[-\s]?harm\b/i,
  /\bhurt(?:ing)? myself\b/i,
  /\bcut(?:ting)? myself\b/i,
  /\boverdos(?:e|ing)\b/i,
];

const OBLIQUE = [
  /\bno (?:reason|point|purpose) (?:to|in) (?:living|going on|carrying on|being here|waking up)\b/i,
  /\b(?:can'?t|cannot|don'?t want to) go on\b/i,
  /\bbetter off (?:dead|without me)\b/i,
  /\b(?:everyone|they|the world|my family) would be (?:better|fine|happier) without me\b/i,
  /\bdon'?t want to (?:be here|be alive|live|wake up|exist)\b/i,
  /\bwish i (?:was|were) (?:dead|never born|gone)\b/i,
  /\bi(?:'m| am) (?:just )?a burden\b/i,
  /\bburden to (?:everyone|them|my family|anyone)\b/i,
  /\bnothing (?:left )?to live for\b/i,
  /\bwant (?:it all|it|this|everything|the pain|the hurt) to (?:stop|end|be over|go away)\b/i,
  /\bcan'?t (?:do|take) this any ?more\b/i,
  /\b(?:saying|say) goodbye (?:to everyone|for good)\b/i,
  /\bgiving away my\b/i,
  /\bwhen i(?:'m| am) gone\b/i,
  /\bdisappear(?: forever| for good)\b/i,
];

const PATTERNS = [...EXPLICIT, ...OBLIQUE];

export function detectDistress(text = '') {
  const t = String(text || '');
  if (!t.trim()) return false;
  return PATTERNS.some((re) => re.test(t));
}

// ── Resources ─────────────────────────────────────────────────────────
//
// Region-specific lines. The old list was Singapore-only, which meant a
// reader anywhere else was handed numbers they could not call at the one
// moment it mattered. Region comes from the client's own timezone (see
// regionFromTimeZone), so nothing needs to be asked of the reader.
//
// findahelpline.com is the fallback and is also appended to every
// region, because a reader may not be where their device thinks.

const NOTE =
  'What you are carrying sounds heavier than a reading can hold on its own. You do not have to hold it alone, and you do not have to wait until it gets worse to reach someone.';

const INTERNATIONAL = {
  name: 'Find a helpline where you are',
  detail: 'free, confidential, worldwide',
  contact: 'findahelpline.com',
};

const BY_REGION = {
  SG: [
    { name: 'Samaritans of Singapore (SOS)', detail: '24-hour hotline', contact: '1767' },
    { name: 'SOS CareText', detail: '24-hour WhatsApp', contact: '9151 1767' },
    { name: 'IMH Mental Health Helpline', detail: '24-hour', contact: '6389 2222' },
  ],
  US: [
    { name: '988 Suicide and Crisis Lifeline', detail: '24-hour, call or text', contact: '988' },
    { name: 'Crisis Text Line', detail: 'text HOME', contact: '741741' },
  ],
  CA: [
    { name: '9-8-8 Suicide Crisis Helpline', detail: '24-hour, call or text', contact: '988' },
  ],
  GB: [
    { name: 'Samaritans', detail: '24-hour, free to call', contact: '116 123' },
    { name: 'Shout', detail: 'text SHOUT', contact: '85258' },
  ],
  IE: [
    { name: 'Samaritans Ireland', detail: '24-hour, free to call', contact: '116 123' },
    { name: 'Text About It', detail: 'text HELLO', contact: '50808' },
  ],
  AU: [
    { name: 'Lifeline Australia', detail: '24-hour', contact: '13 11 14' },
    { name: 'Beyond Blue', detail: '24-hour', contact: '1300 22 4636' },
  ],
  NZ: [
    { name: 'Need to talk?', detail: '24-hour, call or text', contact: '1737' },
    { name: 'Lifeline Aotearoa', detail: '24-hour', contact: '0800 543 354' },
  ],
  IN: [
    { name: 'Tele-MANAS', detail: '24-hour, government helpline', contact: '14416' },
    { name: 'AASRA', detail: '24-hour', contact: '9820466726' },
  ],
  MY: [
    { name: 'Befrienders Kuala Lumpur', detail: '24-hour', contact: '03-7627 2929' },
  ],
  HK: [
    { name: 'The Samaritan Befrienders Hong Kong', detail: '24-hour', contact: '2389 2222' },
  ],
  PH: [
    { name: 'NCMH Crisis Hotline', detail: '24-hour', contact: '1553' },
  ],
  ZA: [
    { name: 'SADAG Suicide Crisis Helpline', detail: '24-hour', contact: '0800 567 567' },
  ],
  DE: [
    { name: 'Telefonseelsorge', detail: '24-hour, free to call', contact: '0800 111 0 111' },
  ],
  FR: [
    { name: 'Numéro national de prévention du suicide', detail: '24-hour', contact: '3114' },
  ],
  NL: [
    { name: '113 Zelfmoordpreventie', detail: '24-hour', contact: '113' },
  ],
  ES: [
    { name: 'Línea de atención a la conducta suicida', detail: '24-hour', contact: '024' },
  ],
  IT: [
    { name: 'Telefono Amico Italia', detail: 'daily', contact: '02 2327 2327' },
  ],
  BR: [
    { name: 'Centro de Valorização da Vida (CVV)', detail: '24-hour', contact: '188' },
  ],
  JP: [
    { name: 'TELL Lifeline', detail: 'daily, in English', contact: '03-5774-0992' },
  ],
};

// Map an IANA time zone to a region key. Deliberately coarse: we only
// need to land on the right hotline list, and anything unmapped falls
// through to the international line, which always works.
const ZONE_REGION = {
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Hong_Kong': 'HK',
  'Asia/Manila': 'PH',
  'Asia/Tokyo': 'JP',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Amsterdam': 'NL',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Africa/Johannesburg': 'ZA',
  'America/Sao_Paulo': 'BR',
  'Pacific/Auckland': 'NZ',
};

export function regionFromTimeZone(tz = '') {
  const zone = String(tz || '').trim();
  if (!zone) return null;
  if (ZONE_REGION[zone]) return ZONE_REGION[zone];
  // Coarse continent fallbacks for the zones we did not enumerate.
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Honolulu|Indiana|Kentucky|North_Dakota)/.test(zone)) return 'US';
  if (/^Pacific\/Honolulu$/.test(zone)) return 'US';
  if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal)/.test(zone)) return 'CA';
  if (/^Australia\//.test(zone)) return 'AU';
  return null;
}

// Compose the care block. `region` is a two-letter key; anything unknown
// yields the international line alone, which is always correct.
export function resourcesFor(region) {
  const key = String(region || '').toUpperCase();
  const lines = BY_REGION[key] ? [...BY_REGION[key], INTERNATIONAL] : [INTERNATIONAL];
  return { note: NOTE, lines };
}

// The shape the client renders. Returns null when nothing was seen, so
// a calm surface renders nothing at all.
export function careBlockFor(flagged, region) {
  if (!flagged) return null;
  return { flagged: true, ...resourcesFor(region) };
}

// Back-compat for callers that still import the old constant. Prefer
// resourcesFor(region).
export const CARE_RESOURCES = resourcesFor('SG');
