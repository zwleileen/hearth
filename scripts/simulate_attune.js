#!/usr/bin/env node
//
// scripts/simulate_attune.js
//
// Offline harness that runs the Attune prompt against OpenAI on a set
// of varied mood inputs and scores the outputs against:
//
//   - Register coherence       : did the model choose a register that
//                                 matches the mood category?
//   - Genre constraint         : when preferences set a genre, do the
//                                 recommended artists actually live in
//                                 that genre?
//   - Vocals constraint        : when preferences set "without",
//                                 are recommendations actually
//                                 instrumental?
//   - Diversity                : across two calls for the same mood,
//                                 do the artists differ meaningfully?
//   - Artist convergence       : across the full run, what's the
//                                 frequency of any single artist?
//
// Uses the same buildAttuneUserPrompt() that production uses, so
// changes to the prompt are reflected here without drift. Does NOT
// touch MongoDB. Diversity context is passed in directly as part of
// the scenario.
//
// Usage:
//   node scripts/simulate_attune.js
//   node scripts/simulate_attune.js --short    # 3 scenarios only
//   node scripts/simulate_attune.js --json     # raw output
//
// Cost note: ~$0.05-0.10 per call with gpt-5.1. The default run is
// 8 calls = ~$0.40-0.80. Use --short for a 3-call sanity check.

import 'dotenv/config';
import { getOpenAI, MODEL } from '../server/lib/ai.js';
import { generateAttuneReading } from '../server/lib/attuneRunner.js';

const args = new Set(process.argv.slice(2));
const SHORT = args.has('--short');
const JSON_OUT = args.has('--json');

// ── Scenarios ────────────────────────────────────────────────────────
// Each scenario has a mood (the reader's words), an expected_category
// (what the model should pick up on), and optional preferences/
// diversity context. The expected_category lets us auto-score
// register coherence.

const SCENARIOS = [
  {
    name: 'celebratory',
    mood: "i got the offer. the dream job. i can't stop smiling and i'm a little dizzy with it.",
    expected_category: 'kinetic',
    valid_registers: ['kinetic', 'celebration', 'joyful', 'alive', 'walking out the door', 'awake', 'bright'],
    invalid_registers: ['holding silence', 'sitting with weight', 'tender and warm', 'unresolved'],
  },
  {
    name: 'grieving',
    mood: "my grandmother died last week. i'm not sad in the way i thought i would be. just empty, like a room after everyone has left.",
    expected_category: 'silence/weight',
    valid_registers: ['holding silence', 'sitting with weight', 'tender and warm', 'devotional', 'unresolved'],
    invalid_registers: ['kinetic', 'celebration', 'restless and alive'],
  },
  {
    name: 'anxious-restless',
    mood: "my chest is tight. i can't sit still. tomorrow morning i present to the board and i keep rehearsing in my head.",
    expected_category: 'restless',
    valid_registers: ['restless', 'urgent', 'alive', 'sitting with weight', 'awake and walking out the door'],
    invalid_registers: ['kinetic celebration', 'holding silence', 'tender and warm'],
  },
  // Diversity probe: same celebratory mood, second call should give
  // different artists IF we feed the first run's artists back as
  // diversity context.
  {
    name: 'celebratory-repeat-with-diversity',
    mood: "i got the offer. the dream job. i can't stop smiling and i'm a little dizzy with it.",
    expected_category: 'kinetic',
    valid_registers: ['kinetic', 'celebration', 'joyful', 'alive', 'walking out the door', 'awake'],
    invalid_registers: ['holding silence', 'sitting with weight'],
    // Populated dynamically by the runner from scenario index 0
    diversity_from_scenario: 'celebratory',
  },
  // Preference probes
  {
    name: 'tender-jazz-with-vocals',
    mood: "my partner has been gentle with me all week. i want to lean into that.",
    expected_category: 'tender/warm',
    valid_registers: ['tender and warm', 'devotional', 'awake and walking out the door'],
    invalid_registers: ['kinetic celebration', 'restless and alive'],
    preferences: { genre: 'jazz', vocals: 'with' },
    expected_genre_family: 'jazz',
    expected_vocals: 'with',
  },
  {
    name: 'grieving-classical-instrumental',
    mood: "my grandmother died last week. i'm not sad in the way i thought i would be. just empty, like a room after everyone has left.",
    expected_category: 'silence/weight',
    valid_registers: ['holding silence', 'sitting with weight', 'tender and warm', 'devotional'],
    invalid_registers: ['kinetic celebration', 'restless and alive'],
    preferences: { genre: 'classical', vocals: 'without' },
    expected_genre_family: 'classical',
    expected_vocals: 'without',
  },
  {
    name: 'hopeful-walking-out',
    mood: "first warm morning of the year. i'm meeting a friend for coffee and i feel ready for the day in a way i haven't in months.",
    expected_category: 'awake/hopeful',
    valid_registers: ['awake and walking out the door', 'tender and warm', 'kinetic celebration', 'bright'],
    invalid_registers: ['holding silence', 'sitting with weight', 'unresolved'],
  },
  {
    name: 'unresolved-dark',
    mood: "we're not okay. i don't know what to do but i can't keep pretending.",
    expected_category: 'unresolved',
    valid_registers: ['unresolved', 'sitting with weight', 'restless and alive', 'holding silence'],
    invalid_registers: ['kinetic celebration', 'awake and walking out the door'],
  },
];

const SCENARIO_LIST = SHORT ? SCENARIOS.slice(0, 3) : SCENARIOS;

// ── Genre family heuristics (for soft scoring, not strict) ───────────
// LLM outputs are messy; this is a fuzzy classifier that flags when an
// artist clearly doesn't fit the requested genre family. Misses are
// fine; false positives are not.
const GENRE_FAMILIES = {
  classical: [/bach/i, /beethoven/i, /chopin/i, /debussy/i, /satie/i, /ravel/i, /schubert/i, /arvo p[äa]rt/i, /g[óo]recki/i, /caroline shaw/i, /max richter/i, /[óo]lafur arnalds/i, /nils frahm/i, /hildur gudnad[óo]ttir/i, /ludovico einaudi/i, /philip glass/i, /hauschka/i, /johann j[óo]hannsson/i, /eric whitacre/i, /steve reich/i, /terry riley/i, /yann tiersen/i, /joep beving/i, /poppy ackroyd/i, /a winged victory/i],
  jazz: [/bill evans/i, /john coltrane/i, /miles davis/i, /thelonious monk/i, /chet baker/i, /ella fitzgerald/i, /sarah vaughan/i, /nina simone/i, /billie holiday/i, /brad mehldau/i, /keith jarrett/i, /pat metheny/i, /esperanza spalding/i, /robert glasper/i, /kamasi washington/i, /vince guaraldi/i, /dave brubeck/i, /art tatum/i, /oscar peterson/i, /charles mingus/i, /herbie hancock/i, /norah jones/i, /diana krall/i, /gregory porter/i, /cecile mclorin/i, /betty carter/i],
  soul: [/aretha franklin/i, /sam cooke/i, /otis redding/i, /donny hathaway/i, /roberta flack/i, /marvin gaye/i, /sade/i, /nina simone/i, /stevie wonder/i, /bill withers/i, /al green/i, /curtis mayfield/i, /lauryn hill/i, /erykah badu/i, /d'angelo/i, /maxwell/i, /jill scott/i, /alicia keys/i, /solange/i, /janelle mon[áa]e/i, /yola/i, /leon bridges/i, /anderson \.paak/i],
  folk: [/joni mitchell/i, /bob dylan/i, /nick drake/i, /sufjan stevens/i, /bon iver/i, /phoebe bridgers/i, /big thief/i, /adrianne lenker/i, /iron and wine/i, /elliott smith/i, /jeff buckley/i, /joanna newsom/i, /aldous harding/i, /sandy denny/i, /vashti bunyan/i, /karen dalton/i, /first aid kit/i, /fleet foxes/i, /ross gay/i, /mitski/i, /anais mitchell/i, /julien baker/i, /lucy dacus/i],
  indie: [/radiohead/i, /talk talk/i, /cocteau twins/i, /beach house/i, /mount eerie/i, /fiona apple/i, /pj harvey/i, /st\. vincent/i, /angel olsen/i, /weyes blood/i, /the national/i, /arcade fire/i, /modest mouse/i, /pavement/i, /the smiths/i, /sonic youth/i, /yo la tengo/i],
  hiphop: [/kendrick lamar/i, /frank ocean/i, /chance the rapper/i, /tyler.*creator/i, /j cole/i, /noname/i, /little simz/i, /mos def/i, /yasiin bey/i, /a tribe called/i, /q-tip/i, /nas/i, /common/i, /talib kweli/i],
  electronic: [/aphex twin/i, /boards of canada/i, /four tet/i, /caribou/i, /jon hopkins/i, /brian eno/i, /grouper/i, /tim hecker/i, /william basinski/i, /oneohtrix point never/i, /burial/i, /loscil/i, /stars of the lid/i, /max richter/i, /[óo]lafur arnalds/i, /nils frahm/i, /a winged victory/i],
  world: [/caetano veloso/i, /jo[ãa]o gilberto/i, /tom jobim/i, /elis regina/i, /milton nascimento/i, /astrud gilberto/i, /seu jorge/i, /fela kuti/i, /ali farka tour[ée]/i, /youssou n'dour/i, /a r rahman/i, /ravi shankar/i, /omara portuondo/i, /buena vista social/i, /lhasa de sela/i, /khruangbin/i],
};

function classifyGenre(artist) {
  if (!artist) return 'unknown';
  for (const [family, patterns] of Object.entries(GENRE_FAMILIES)) {
    if (patterns.some((p) => p.test(artist))) return family;
  }
  return 'unknown';
}

// Heuristic: is the artist/title likely vocal-led vs instrumental?
// Instrumental signal: classical composers, ambient/electronic producers,
// jazz with named instrumental work, etc.
const LIKELY_INSTRUMENTAL = [
  /bach/i, /beethoven/i, /chopin/i, /debussy/i, /satie/i, /ravel/i, /schubert/i, /arvo p[äa]rt/i, /g[óo]recki/i, /caroline shaw/i, /max richter/i, /[óo]lafur arnalds/i, /nils frahm/i, /hildur gudnad[óo]ttir/i, /ludovico einaudi/i, /philip glass/i, /hauschka/i, /johann j[óo]hannsson/i, /steve reich/i, /terry riley/i, /yann tiersen/i, /joep beving/i, /poppy ackroyd/i, /a winged victory/i, /bill evans/i, /brad mehldau/i, /keith jarrett/i, /aphex twin/i, /boards of canada/i, /jon hopkins/i, /brian eno/i, /tim hecker/i, /william basinski/i, /stars of the lid/i, /vince guaraldi/i,
];

function likelyInstrumental(artist, title) {
  const probe = `${artist} ${title}`;
  return LIKELY_INSTRUMENTAL.some((p) => p.test(probe));
}

// Soft register match: does the chosen register contain any of the
// expected/invalid keywords?
function classifyRegister(register, validList, invalidList) {
  if (!register) return { matched_valid: false, matched_invalid: false };
  const lc = register.toLowerCase();
  const matched_valid = validList.some((v) => lc.includes(v.toLowerCase()));
  const matched_invalid = invalidList.some((v) => lc.includes(v.toLowerCase()));
  return { matched_valid, matched_invalid };
}

// ── Run one scenario ─────────────────────────────────────────────────
async function runScenario(client, scenario, diversityFromPrevious) {
  const diversity = scenario.diversity_from_scenario && diversityFromPrevious
    ? diversityFromPrevious
    : {};

  const t0 = Date.now();
  // Goes through the same call+retry pipeline production uses, so
  // simulator output reflects what real users will see (including
  // duplicate-artist correction).
  const { data, retried } = await generateAttuneReading(client, {
    mood: scenario.mood,
    preferences: scenario.preferences || {},
    diversity,
  });
  const ms = Date.now() - t0;

  // ── Score ────────────────────────────────────────────────────────
  const registerCheck = classifyRegister(data.register, scenario.valid_registers, scenario.invalid_registers);
  const genreClassifications = data.songs.map((s) => ({ artist: s.artist, title: s.title, family: classifyGenre(s.artist) }));
  const vocalsClassifications = data.songs.map((s) => ({ artist: s.artist, title: s.title, instrumental_likely: likelyInstrumental(s.artist, s.title) }));

  let genreMatchRate = null;
  if (scenario.expected_genre_family) {
    const matches = genreClassifications.filter((c) => c.family === scenario.expected_genre_family).length;
    genreMatchRate = matches / data.songs.length;
  }

  let vocalsCompliance = null;
  if (scenario.expected_vocals === 'without') {
    // All three songs should look instrumental
    const allInstrumental = vocalsClassifications.every((c) => c.instrumental_likely);
    vocalsCompliance = allInstrumental;
  } else if (scenario.expected_vocals === 'with') {
    // None should be obviously instrumental composers
    const noneInstrumentalOnly = vocalsClassifications.every((c) => !c.instrumental_likely);
    vocalsCompliance = noneInstrumentalOnly;
  }

  return {
    scenario: scenario.name,
    mood: scenario.mood,
    moodSummary: data.moodSummary,
    register: data.register,
    songs: data.songs.map((s) => ({ artist: s.artist, title: s.title })),
    poems: data.poems.map((p) => ({ poet: p.poet, title: p.title })),
    ms,
    retried,
    scoring: {
      register: registerCheck,
      genres: genreClassifications,
      genreMatchRate,
      vocalsCompliance,
    },
    preferences: scenario.preferences || null,
    diversity_used: diversity,
  };
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in .env');
    process.exit(1);
  }
  const client = getOpenAI();

  console.log(`Running ${SCENARIO_LIST.length} Attune simulations against ${MODEL}…\n`);

  const results = [];
  const indexByName = {};
  for (let i = 0; i < SCENARIO_LIST.length; i++) {
    const scenario = SCENARIO_LIST[i];
    process.stdout.write(`[${i+1}/${SCENARIO_LIST.length}] ${scenario.name}… `);

    let diversityFromPrevious = null;
    if (scenario.diversity_from_scenario && indexByName[scenario.diversity_from_scenario] != null) {
      const priorIdx = indexByName[scenario.diversity_from_scenario];
      const prior = results[priorIdx];
      diversityFromPrevious = {
        recentArtists: prior.songs.map((s) => s.artist),
        recentPoets: prior.poems.map((p) => p.poet),
        recentRegisters: prior.register ? [prior.register] : [],
      };
    }

    try {
      const r = await runScenario(client, scenario, diversityFromPrevious);
      console.log(`done (${r.ms}ms)`);
      results.push(r);
      indexByName[scenario.name] = results.length - 1;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      results.push({ scenario: scenario.name, error: err.message });
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // ── Pretty report ───────────────────────────────────────────────
  console.log('\n' + '═'.repeat(72));
  console.log('RESULTS');
  console.log('═'.repeat(72));

  for (const r of results) {
    if (r.error) {
      console.log(`\n✗ ${r.scenario}: ${r.error}`);
      continue;
    }
    console.log(`\n── ${r.scenario} ────────────────────────────────────────`);
    console.log(`Mood:      "${r.mood}"`);
    console.log(`Summary:   ${r.moodSummary}`);
    console.log(`Register:  ${r.register}   ${r.scoring.register.matched_valid ? '✓ matches expected' : '⚠ register may be off'}${r.scoring.register.matched_invalid ? '  ⚠ HIT INVALID' : ''}${r.retried ? '   (corrected on retry)' : ''}`);
    if (r.preferences) {
      console.log(`Prefs:     genre=${r.preferences.genre || 'any'}  vocals=${r.preferences.vocals || 'either'}`);
    }
    console.log(`Songs:`);
    for (let i = 0; i < r.songs.length; i++) {
      const s = r.songs[i];
      const fam = r.scoring.genres[i].family;
      const inst = r.scoring.genres[i] ? r.scoring.genres[i].family : '?';
      console.log(`  ${i+1}. ${s.artist} — ${s.title}   [genre: ${fam}]`);
    }
    if (r.scoring.genreMatchRate != null) {
      const pct = Math.round(r.scoring.genreMatchRate * 100);
      const flag = r.scoring.genreMatchRate >= 0.66 ? '✓' : (r.scoring.genreMatchRate >= 0.33 ? '◐' : '✗');
      console.log(`  Genre compliance: ${pct}% in family   ${flag}`);
    }
    if (r.scoring.vocalsCompliance != null) {
      console.log(`  Vocals compliance: ${r.scoring.vocalsCompliance ? '✓ pass' : '✗ FAIL'}`);
    }
    console.log(`Poems:`);
    for (const p of r.poems) console.log(`  · ${p.poet} — ${p.title}`);
    if (r.diversity_used.recentArtists?.length > 0) {
      console.log(`Diversity context fed in:  artists=${r.diversity_used.recentArtists.join(', ')}`);
    }
  }

  // ── Aggregate report ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(72));
  console.log('AGGREGATE');
  console.log('═'.repeat(72));

  const allArtists = results.flatMap((r) => r.songs ? r.songs.map((s) => s.artist) : []);
  const counts = {};
  for (const a of allArtists) counts[a] = (counts[a] || 0) + 1;
  const repeated = Object.entries(counts).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
  console.log(`\nTotal song recommendations across run: ${allArtists.length}`);
  console.log(`Unique artists: ${Object.keys(counts).length}`);
  console.log(`Repeated artists (across scenarios):`);
  if (repeated.length === 0) {
    console.log('  none — every artist appeared at most once across all scenarios ✓');
  } else {
    for (const [a, n] of repeated) console.log(`  ${a}: ${n}x`);
  }

  // Bon Iver / Phoebe Bridgers check — the original convergence pattern
  const bonIverHits = allArtists.filter((a) => /bon iver|phoebe bridgers/i.test(a)).length;
  console.log(`\nBon Iver / Phoebe Bridgers appearances: ${bonIverHits}   ${bonIverHits === 0 ? '✓ no convergence' : bonIverHits <= 1 ? '◐ contextually appropriate' : '⚠ may still be over-represented'}`);

  // Register-match aggregate
  const registerMatches = results.filter((r) => r.scoring?.register?.matched_valid).length;
  const registerInvalid = results.filter((r) => r.scoring?.register?.matched_invalid).length;
  const total = results.filter((r) => !r.error).length;
  console.log(`\nRegister coherence: ${registerMatches}/${total} matched expected texture${registerInvalid > 0 ? `   ⚠ ${registerInvalid} hit invalid register` : ''}`);

  // Diversity probe
  const div = results.find((r) => r.scenario === 'celebratory-repeat-with-diversity');
  if (div) {
    const orig = results.find((r) => r.scenario === 'celebratory');
    if (orig) {
      const origArtists = new Set(orig.songs.map((s) => s.artist));
      const repeatedInSecond = div.songs.filter((s) => origArtists.has(s.artist)).length;
      console.log(`\nDiversity probe (celebratory, run 2 with first run's artists as avoid-list):`);
      console.log(`  Run 1 artists: ${[...origArtists].join(', ')}`);
      console.log(`  Run 2 artists: ${div.songs.map((s) => s.artist).join(', ')}`);
      console.log(`  Overlap: ${repeatedInSecond}/3   ${repeatedInSecond === 0 ? '✓ fully diverse' : repeatedInSecond === 1 ? '◐ partial' : '⚠ insufficient diversity'}`);
    }
  }

  console.log('\n' + '═'.repeat(72) + '\n');
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
