/* games.js — the games' rules as pure reducers (state, action) → state, so test/games.mjs can play
   them both ways and soak them for 60 simulated seconds with overlapping events (Finance's Change
   Rush froze for good once when a loop spliced an array it had cleared). The learning IS the
   mechanic; nothing is random in scoring.

   MEMORY (every game). k.games[id].seen = { itemKey: { n, last, p, miss } } — how often an item was
   met, when (ms), in which play (`p`, a play is one round), and whether it was last missed. A round
   draws, from the level's pool: items the child has never met; then up to a quarter of the round from
   items MISSED whose two-day gap is over ("to win back"); then the least recently met. Never the same
   item twice in a round, never an item met in the last three plays unless the pool runs out. It is
   deterministic given (seed, seen, plays, now) — `memDraw` — so the tests can hold it to that.
   Capped at MEM_CAP keys; the oldest drop first.

   A RUN (every game). A level is played as three rounds and a FINAL — the level's top ramp; the timed
   games add a time bonus there (time adds points, never removes one earned). The run's accuracy gives
   the level 1–3 stars (`starsFor`) and moves the level: up one at 80% or better, down one below 40%
   (`nextLevel`, never below 1). A COMBO counts right answers in a row; every third in a row is worth
   one point more. It rewards accuracy only — a wrong answer resets it, and nothing about it is chance.

   Sentence Builder (60 s a round) — join a main clause and a dependent clause with their subordinator,
     in either order; building the other order earns a variety bonus. The final is rush hour: the
     level's longest sentences, +1 for each built inside 8 seconds.
   Punctuation Rush (60 s a round) — tap the gaps that need commas. +1 a right comma, −1 a wrong one
     (never below zero), a clean sentence +1. Final: the most commas, +1 a clean one inside 10 s.
   Who Said It? — Detective: a line from a held text; up to three clues on request (the kind of book
     and its year, what the book is, its title). Answering before any clue scores 3, after one 2, after
     more 1 — still one right answer among four.
   Figure Hunt — which figure of speech is this real line? From level 3 half the round is a hunt: a few
     sentences of a held passage; tap the one that holds the figure, then name it (both scored).
   Plot Line — the opening sentence of each scene of a story, shuffled: place them on the line (drag,
     tap or keys). 4, then 5, then 6 scenes; the final from level 3 asks which scene is missing.
   Root Forge — a base word (or a Latin root) and four pieces: forge the one REAL word. The final forges
     a family: three words from one base or root.
   Rhetoric Duel — a duel against one of Bee's rivals, best of five: pick the stronger of two versions,
     then say WHY (the reason scores). The rival's points are the app's own, seeded, and say so. */

import { rng, shuffle, sample, permute, hash } from './rand.js';
import { MAIN_CLAUSE, COMMAS } from './data/sentences.js';

/* The games as the Play page lists them: a world (whose painting is the board), what each practises,
   a three-second how-to, its keys, and what each of its five levels means. */
const LV = (a) => Object.fromEntries(a.map((t, i) => [i + 1, t]));
export const GAMES = {
  builder: { name: 'Sentence Builder', world: 'scriptorium', music: 'games-sentence', timed: true, practises: 'main and dependent clauses, in both orders', how: 'Tap the three parts in an order that makes a sentence. Build it the other way round next time for a bonus.', keys: '1 2 3 pick · Backspace undo',
    final: 'Rush hour — the longest sentences; +1 for each built inside 8 seconds',
    levels: LV(['short sentences, first-band words', 'longer clauses from the second band', 'every band, starting a little further along', 'longer sentences from the start', 'the longest clauses first']) },
  rush: { name: 'Punctuation Rush', world: 'study', music: 'games-sentence', timed: true, practises: 'where commas go — lists, openings, names and asides', how: 'Tap every gap that needs a comma, then Enter. Right commas score; wrong ones cost a point.', keys: '← → move · Space comma · Enter next',
    final: 'Rush hour — the most commas; +1 for each clean sentence inside 10 seconds',
    levels: LV(['one comma a sentence', 'one comma, then a few with two', 'one comma, then lists and asides', 'mostly two commas or more', 'lists and asides first']) },
  figure: { name: 'Figure Hunt', world: 'lakeside', music: 'games-word', practises: 'similes, metaphors, personification and alliteration in real lines', how: 'Read the line from a classic. Which figure of speech is it — or is it none? From level 3, find the figure in a passage first.', keys: '1–5 choose · Enter next',
    final: 'The figures of the level above',
    levels: LV(['simile, alliteration or none', 'metaphor joins in', 'all five, and hunts in passages', 'more metaphor and personification', 'the subtle ones, mostly']) },
  who: { name: 'Who Said It?', world: 'playhouse', music: 'games-reading', practises: 'famous lines from the books in the Library', how: 'Detective: read the line. Who said it — or wrote it? Answer with no clue for 3 points; each clue you open costs one.', keys: '1–4 choose · C clue · Enter next',
    final: 'The hardest lines of the level, rivals from the level above',
    levels: LV(['famous lines from children’s books', 'poems, plays and novels join in', 'every shelf; rivals from the same shelf', 'rivals from the same author’s books', 'poems, plays, essays and speeches']) },
  plot: { name: 'Plot Line', world: 'garden', music: 'games-reading', practises: 'the order of events in a story', how: 'Each card opens a scene of one story. Drag them onto the line in the order they happen — or tap them in order.', keys: '1–6 place · ← → card · ↑ ↓ slot · Enter place · Backspace undo',
    final: 'From level 3: which scene is missing?',
    levels: LV(['four scenes from first stories', 'four scenes, longer stories', 'five scenes', 'five scenes from the oldest books', 'six scenes, the hardest stories']) },
  root: { name: 'Root Forge', world: 'scriptorium', music: 'games-word', practises: 'prefixes, suffixes and roots that make real words', how: 'One word part and four pieces. Forge the one that makes a real word.', keys: '1–4 forge · Enter next',
    final: 'Forge a family — three real words from one base or root',
    levels: LV(['first prefixes and endings', 'more prefixes and endings', 'every prefix and ending', 'Latin roots join in', 'mostly roots and harder parts']) },
  duel: { name: 'Rhetoric Duel', world: 'forum', music: 'games-sentence', practises: 'why a sentence is strong — the devices great writers use', how: 'A duel with one of Bee’s rivals, best of five. Pick the stronger version — then say why. The reason scores.', keys: '1 2 pick · 1–4 why · Enter next',
    final: 'The strongest rival and the hardest lines',
    levels: LV(['alliteration and questions', 'groups of three and repeated openings', 'every device', 'every device, longer lines', 'antithesis and the hardest lines']) },
};

export const ROUND_MS = 60000;
export const MAX_LEVEL = 5;
export const RUN_ROUNDS = 3;                 // + the final
export const ROUND_OF = { who: 5, figure: 6, plot: 3, root: 6, duel: 5 };
const SUBS = /^(when|because|if|although|after|before|while|until|since|as|unless|once|whenever|though)\b/i;
const clampLevel = (l) => Math.max(1, Math.min(MAX_LEVEL, Math.round(+l || 1)));
const bump = (o, k) => ({ ...o, [k]: (o[k] || 0) + 1 });
const comboOf = (s, ok) => { const combo = ok ? s.combo + 1 : 0; return { combo, bestCombo: Math.max(s.bestCombo || 0, combo), comboBonus: ok && combo > 0 && combo % 3 === 0 ? 1 : 0 }; };
const sp = (s) => String(s).replace(/\s+/g, ' ').trim();
export const itemKey = (p, s) => p + hash(sp(s)).toString(36);

/* ---------- memory ---------- */
export const MEM_CAP = 2000, MEM_RECENT = 3, MEM_GAP = 2 * 864e5;
const EMPTY = { seen: {}, plays: 0 };
export const memOf = (rec) => ({ seen: rec?.seen || {}, plays: rec?.rounds || 0 });
const isRecent = (e, mem) => !!e && e.p >= (mem.plays || 0) - MEM_RECENT;   // met in one of the last three plays
const isDue = (e, now) => !!e && !!e.miss && now - e.last >= MEM_GAP;
/* The round's items, n of them, in the memory's order (see the head of this file). */
export function memDraw(items, keyOf, mem = EMPTY, seed = '', n = items.length, now = Date.now()) {
  const byKey = new Map();
  for (const it of items) { const k = keyOf(it); if (!byKey.has(k)) byKey.set(k, it); }
  const S = mem.seen || {}, keys = [...byKey.keys()], tie = (k) => hash(seed + '~' + k);
  const old = (a, b) => S[a].p - S[b].p || S[a].last - S[b].last || tie(a) - tie(b);
  const fresh = shuffle(rng('mem:' + seed), keys.filter((k) => !S[k]));
  const met = keys.filter((k) => S[k]), recent = met.filter((k) => isRecent(S[k], mem)).sort(old);
  const due = met.filter((k) => !isRecent(S[k], mem) && isDue(S[k], now)).sort((a, b) => S[a].last - S[b].last || tie(a) - tie(b));
  const rest = met.filter((k) => !isRecent(S[k], mem) && !isDue(S[k], now)).sort(old);
  const back = fresh.length ? due.slice(0, Math.max(1, Math.floor(n / 4))) : due;
  const order = [...back, ...fresh, ...due.slice(back.length), ...rest, ...recent];
  return order.slice(0, n).map((k) => byKey.get(k));
}
/* After a play: each item met, right (true), missed (false) or only seen (null). */
export function memRecord(mem = EMPTY, results = [], now = Date.now()) {
  const seen = { ...(mem.seen || {}) };
  for (const { key, ok } of results) {
    if (!key) continue; const e = seen[key];
    seen[key] = { n: (e?.n || 0) + 1, last: now, p: mem.plays || 0, miss: ok === false ? 1 : ok === true ? 0 : e?.miss || 0 };
  }
  const ks = Object.keys(seen);
  if (ks.length > MEM_CAP) ks.sort((a, b) => seen[a].p - seen[b].p || seen[a].last - seen[b].last || (a < b ? -1 : 1)).slice(0, ks.length - MEM_CAP).forEach((k) => delete seen[k]);
  return { seen, plays: (mem.plays || 0) + 1 };
}
/* For the title card: new to you · to win back (missed, waiting to be won) · the pool. */
export function memCounts(items, keyOf, mem = EMPTY) {
  const S = mem.seen || {}, keys = new Set(items.map(keyOf));
  let fresh = 0, back = 0; for (const k of keys) { if (!S[k]) fresh++; else if (S[k].miss) back++; }
  return { fresh, back, pool: keys.size };
}
/* What a finished round met, for memRecord: [{ key, ok }]. */
export function roundLog(g) {
  if (g.kind === 'builder' || g.kind === 'rush') {
    const cur = g.cur ? [{ key: g.kind === 'builder' ? g.cur.it.key : g.cur.key, ok: g.curWrong ? false : null }] : [];
    return [...g.log, ...cur];
  }
  return g.rounds.slice(0, g.results.length).map((q, j) => ({ key: q.key, ok: g.results[j] }));
}

/* ---------- levels, runs, stars ---------- */
/* ≥ 80% → up one, < 40% → down one, never below 1 or above MAX_LEVEL; a run with no attempts moves nothing. */
export function nextLevel(level, pct) {
  const l = clampLevel(level);
  if (pct == null || Number.isNaN(pct)) return l;
  if (pct >= 0.8) return Math.min(MAX_LEVEL, l + 1);
  if (pct < 0.4) return Math.max(1, l - 1);
  return l;
}
/* A finished run earns 1 star; 70% earns 2; 90% earns 3. */
export const starsFor = (pct) => (pct == null ? 0 : pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1);
/* What a finished round got right, out of how many decisions it asked for. */
export function accuracy(g) {
  let right = 0, total = 0;
  if (g.kind === 'builder') { right = g.built; total = g.built + g.wrong; }
  else if (g.kind === 'rush') { right = g.right; total = g.right + g.wrongs; }
  else if (g.kind === 'plot') { right = g.right; total = g.total; }
  else { right = g.right; total = g.answered ?? g.rounds.length; }
  return { right, total, pct: total ? right / total : null };
}
/* The thing missed most (a category key), or null for a clean round. */
export function mostMissed(g) {
  const e = Object.entries(g.misses || {}).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return e.length ? e[0][0] : null;
}
/* A run: three rounds and a final, added up as they finish. */
export function runNew(level) { return { level: clampLevel(level), round: 0, scores: [], right: 0, total: 0, misses: {}, met: 0, bestCombo: 0, bonus: 0 }; }
export function runAdd(run, g, met = 0) {
  const a = accuracy(g), misses = { ...run.misses }; for (const [k, v] of Object.entries(g.misses || {})) misses[k] = (misses[k] || 0) + v;
  return { ...run, round: run.round + 1, scores: [...run.scores, g.score], right: run.right + a.right, total: run.total + a.total, misses, met: run.met + met, bestCombo: Math.max(run.bestCombo, g.bestCombo || 0), bonus: run.bonus + (g.speed || 0) };
}
export const runScore = (run) => run.scores.reduce((a, b) => a + b, 0);
export const runPct = (run) => (run.total ? run.right / run.total : null);
export const isFinal = (run) => run.round >= RUN_ROUNDS;

/* A level's slice of a pool sorted easiest first: a higher level starts further along; the final takes
   the top of the level's slice. Never fewer than `min` items while the pool has them. */
const RAMP = { 1: [0, 0.6], 2: [0.1, 0.7], 3: [0.25, 0.85], 4: [0.4, 1], 5: [0.55, 1] };
export function rampWindow(sorted, level, final = false, min = 12) {
  const n = sorted.length, [a, b] = RAMP[clampLevel(level)], want = Math.min(min, n);
  let lo = Math.floor(n * (final ? Math.max(a, b - 0.35) : a)), hi = Math.ceil(n * b);
  while (hi - lo < want) { if (hi < n) hi++; if (hi - lo < want && lo > 0) lo--; }
  return sorted.slice(lo, hi);
}

/* ---------- Sentence Builder ---------- */
/* extra: data/games/builder.json (MAIN_CLAUSE's shape), merged in when it is there. */
export function builderPool(band = 3, extra = []) {
  const have = new Set(), src = [...MAIN_CLAUSE, ...(Array.isArray(extra) ? extra : [])].filter((x) => x && typeof x.s === 'string' && !have.has(x.s) && have.add(x.s));
  return src.map((x, i) => ({ ...x, i })).filter((x) => (x.band || 1) <= band).map((x) => {
    const m = x.s.match(/^(.*)\[(.+)\](.*)$/); if (!m) return null;
    const before = m[1].replace(/,\s*$/, '').trim(), after = m[3].replace(/^[,\s]+/, '').replace(/[.!?]$/, '').trim();
    if (before && after) return null;
    const dep = (before || after).trim(), main = m[2].trim();
    const sm = dep.match(SUBS); if (!sm || !main) return null;
    return { id: x.i, key: itemKey('b', x.s), sub: sm[1].toLowerCase(), dep: dep.slice(sm[1].length).trim(), main: main.replace(/[.!?]$/, ''), end: x.s.trim().slice(-1), band: x.band || 1 };
  }).filter((x) => x && x.dep && x.main);
}
export const builderLen = (it) => (it.sub + ' ' + it.dep + ' ' + it.main).split(/\s+/).length;
const byBuild = (a, b) => builderLen(a) - builderLen(b) || a.band - b.band || (a.key < b.key ? -1 : 1);
export function builderLevelPool(level = 1, extra = [], final = false) {
  const L = clampLevel(level); return rampWindow(builderPool(Math.min(3, L), extra).sort(byBuild), L, final);
}
/* The round's road: the memory's order; its first twenty climb from the shortest to the longest. */
export function builderRoad(level = 1, o = {}) {
  const order = memDraw(builderLevelPool(level, o.extra, o.final), (x) => x.key, o.mem, 'b:' + (o.seed ?? ''), undefined, o.now);
  return [...order.slice(0, 20).sort(byBuild), ...order.slice(20)];
}
export function builderNew(seed, level = 1, o = {}) {
  const pool = builderRoad(level, { ...o, seed });
  return { kind: 'builder', level: clampLevel(level), final: !!o.final, t: 0, over: false, score: 0, built: 0, wrong: 0, lastOrder: null, variety: 0, speed: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0,
    pool, n: 0, picks: [], flash: null, itemT: 0, curWrong: false, log: [], cur: tilesFor(pool[0], seed) };
}
function tilesFor(it, seed) {
  if (!it) return null;
  const subWord = it.sub.charAt(0).toUpperCase() + it.sub.slice(1);
  let tiles = shuffle(rng('t:' + seed + it.key), [{ k: 'sub', text: it.sub }, { k: 'dep', text: it.dep }, { k: 'main', text: it.main }]);
  if (tiles.map((t) => t.k).join() === 'sub,dep,main' || tiles.map((t) => t.k).join() === 'main,sub,dep') tiles = [tiles[1], tiles[0], tiles[2]];   // never dealt already built
  return { it, tiles, subWord };
}
/* The two right orders: [sub, dep, main] (front-loaded, comma) or [main, sub, dep] (end-loaded). */
export function builderJudge(cur, picks) {
  const ks = picks.map((i) => cur.tiles[i].k).join(',');
  if (ks === 'sub,dep,main') return 'front';
  if (ks === 'main,sub,dep') return 'end';
  return null;
}
export function builderSentence(cur, order) {
  const { it } = cur; const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return order === 'front' ? `${cap(it.sub)} ${it.dep}, ${lowerFirst(it.main)}${it.end}` : `${cap(it.main)} ${it.sub} ${it.dep}${it.end}`;
}
/* A main clause that opened the original sentence carries a capital only for that reason — unless its
   first word is a name. Lower-case it only when the first word is a common opener. */
const OPENERS = /^(The|A|An|My|Our|Your|His|Her|Its|Their|We|They|He|She|It|You|Everyone|Everybody|Nobody|No|This|That|These|Those|Some|All|Every|Each|Most|Many|Both|Grandma|Grandpa|Mum|Dad|There)\b/;
const lowerFirst = (s) => (OPENERS.test(s) && !/^(Grandma|Grandpa|Mum|Dad)\b/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const BUILD_FAST = 8000, RUSH_FAST = 10000;

export function builderStep(s, a) {
  if (s.over) return s;
  if (a.type === 'tick') { const t = s.t + a.dt; return t >= ROUND_MS ? { ...s, t: ROUND_MS, over: true } : { ...s, t }; }
  if (!s.cur) return { ...s, over: true };
  if (a.type === 'pick') {
    if (a.i < 0 || a.i >= s.cur.tiles.length || s.picks.includes(a.i)) return s;
    const picks = [...s.picks, a.i];
    if (picks.length < 3) return { ...s, picks };
    const order = builderJudge(s.cur, picks);
    if (!order) return { ...s, ...comboOf(s, false), picks: [], wrong: s.wrong + 1, curWrong: true, misses: bump(s.misses, 'clause'), seq: s.seq + 1, flash: { ok: false, text: 'Not a sentence yet — which part could stand alone?' } };
    const bonus = s.lastOrder && s.lastOrder !== order ? 1 : 0, c = comboOf(s, true), fast = s.final && s.t - s.itemT <= BUILD_FAST ? 1 : 0;
    const n = s.n + 1, next = s.pool[n % s.pool.length], gain = 2 + bonus + c.comboBonus + fast;
    return { ...s, ...c, picks: [], score: s.score + gain, built: s.built + 1, variety: s.variety + bonus, speed: s.speed + fast, lastOrder: order, n, seq: s.seq + 1, cur: tilesFor(next, 'r' + n),
      itemT: s.t, curWrong: false, log: [...s.log, { key: s.cur.it.key, ok: !s.curWrong }], flash: { ok: true, text: builderSentence(s.cur, order), bonus, combo: c.comboBonus, fast, gain } };
  }
  if (a.type === 'undo') return s.picks.length ? { ...s, picks: s.picks.slice(0, -1) } : s;
  return s;
}

/* ---------- Punctuation Rush ---------- */
/* extra: data/games/rush.json (COMMAS' shape). */
export function rushPool(band = 3, extra = []) {
  const have = new Set(), src = [...COMMAS, ...(Array.isArray(extra) ? extra : [])].filter((x) => x && typeof x.s === 'string' && x.s.includes(',') && !have.has(x.s) && have.add(x.s));
  return src.map((x, i) => ({ ...x, i })).filter((x) => (x.band || 1) <= band).map((x) => {
    const words = x.s.trim().split(/\s+/);
    return { id: x.i, key: itemKey('r', x.s), rule: x.rule || 'list', band: x.band || 1, words: words.map((w) => w.replace(/,$/, '')), commas: words.map((w, j) => (w.endsWith(',') ? j : -1)).filter((j) => j >= 0 && j < words.length - 1), s: x.s.trim() };
  }).filter((x) => x.commas.length && x.words.every((w) => w && !w.includes(',')));
}
const rushHard = (x) => x.commas.length * 1000 + x.words.length;
const byRush = (a, b) => rushHard(a) - rushHard(b) || (a.key < b.key ? -1 : 1);
/* one comma first; the levels above lean on the sentences with two or more (the lists and asides), which are
   fewer, so a level is built from both kinds rather than cut from one sorted list */
export function rushLevelPool(level = 1, extra = [], final = false) {
  const L = clampLevel(level), all = rushPool(3, extra).sort(byRush), one = all.filter((x) => x.commas.length === 1), multi = all.filter((x) => x.commas.length > 1);
  const longest = (k) => one.slice(Math.max(0, one.length - k));
  if (L === 1) { const easy = one.filter((x) => x.band <= 2); return final ? easy.slice(Math.floor(easy.length * 0.5)) : easy.slice(0, Math.max(12, Math.ceil(easy.length * 0.8))); }
  if (final) return [...longest(Math.max(6, Math.round(multi.length * 0.35))), ...multi];
  if (L === 2) return [...one.slice(Math.floor(one.length * 0.1)), ...multi.filter((x) => x.band <= 2)];
  if (L === 3) return [...one.slice(Math.floor(one.length * 0.4)), ...multi];
  if (L === 4) return [...longest(Math.max(8, Math.round(multi.length * 0.7))), ...multi];
  return [...longest(Math.max(6, Math.round(multi.length * 0.5))), ...multi];
}
export function rushRoad(level = 1, o = {}) {
  const order = memDraw(rushLevelPool(level, o.extra, o.final), (x) => x.key, o.mem, 'r:' + (o.seed ?? ''), undefined, o.now);
  return [...order.slice(0, 20).sort(byRush), ...order.slice(20)];
}
export function rushNew(seed, level = 1, o = {}) {
  const pool = rushRoad(level, { ...o, seed });
  return { kind: 'rush', level: clampLevel(level), final: !!o.final, t: 0, over: false, score: 0, right: 0, wrongs: 0, clean: 0, speed: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, pool, n: 0, sel: [], cursor: 0, flash: null,
    itemT: 0, curWrong: false, log: [], cur: pool[0] || null };
}
export function rushStep(s, a) {
  if (s.over) return s;
  if (a.type === 'tick') { const t = s.t + a.dt; return t >= ROUND_MS ? { ...s, t: ROUND_MS, over: true } : { ...s, t }; }
  if (!s.cur) return { ...s, over: true };
  const gaps = s.cur.words.length - 1;
  if (a.type === 'toggle') { if (!(a.i >= 0 && a.i < gaps)) return s; return { ...s, cursor: a.i, sel: s.sel.includes(a.i) ? s.sel.filter((x) => x !== a.i) : [...s.sel, a.i] }; }
  if (a.type === 'move') return { ...s, cursor: Math.max(0, Math.min(gaps - 1, s.cursor + (a.d || 0))) };
  if (a.type === 'submit') {
    const want = new Set(s.cur.commas), right = s.sel.filter((i) => want.has(i)).length, wrong = s.sel.length - right, missed = s.cur.commas.length - right;
    const clean = !wrong && !missed ? 1 : 0, c = comboOf(s, !!clean), fast = clean && s.final && s.t - s.itemT <= RUSH_FAST ? 1 : 0;
    const n = s.n + 1, gain = right - wrong + clean + c.comboBonus + fast;
    return { ...s, ...c, score: Math.max(0, s.score + gain), right: s.right + right, wrongs: s.wrongs + wrong + missed, clean: s.clean + clean, speed: s.speed + fast, n, sel: [], cursor: 0, seq: s.seq + 1,
      itemT: s.t, log: [...s.log, { key: s.cur.key, ok: !!clean }],
      misses: clean ? s.misses : bump(s.misses, s.cur.rule), cur: s.pool[n % s.pool.length], flash: { ok: !!clean, text: s.cur.s, rule: s.cur.rule, gain, combo: c.comboBonus, fast } };
  }
  return s;
}

/* ---------- the untimed games: one reducer for a round of choices ---------- */
/* Every item: { options, answer, cat, key }. A right pick scores 1 (+1 on every third in a row) — or,
   for a Detective line, 3 / 2 / 1 by the clues opened; a wrong one holds until 'next' — the screen
   explains it on the exact item. */
export const CLUE_POINTS = [3, 2, 1, 1];
export function quizNew(kind, rounds, level = 1) {
  return { kind, level: clampLevel(level), rounds, i: 0, score: 0, right: 0, answered: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, results: [], state: null, clue: 0, over: !rounds.length };
}
export function quizStep(s, a) {
  if (s.over) return s;
  const q = s.rounds[s.i];
  if (a.type === 'clue') { if (s.state || !q.clues || (s.clue || 0) >= q.clues.length) return s; return { ...s, clue: (s.clue || 0) + 1 }; }
  if (a.type === 'pick') {
    if (s.state || !(a.i >= 0 && a.i < q.options.length)) return s;
    const ok = a.i === q.answer, c = comboOf(s, ok), base = q.clues ? CLUE_POINTS[Math.min(s.clue || 0, 3)] : 1, gain = ok ? base + c.comboBonus : 0;
    return { ...s, ...c, state: { pick: a.i, ok, gain, combo: c.comboBonus, clues: s.clue || 0 }, score: s.score + gain, right: s.right + (ok ? 1 : 0), answered: s.answered + 1,
      misses: ok ? s.misses : bump(s.misses, q.cat), seq: s.seq + 1, results: [...s.results, ok] };
  }
  if (a.type === 'next') { if (!s.state) return s; const i = s.i + 1; return { ...s, i: Math.min(i, s.rounds.length - 1), state: null, clue: 0, over: i >= s.rounds.length }; }
  return s;
}

/* ---------- Who Said It? (Detective) ---------- */
const TIER = { children: 1, fable: 1, poetry: 2, drama: 2, novel: 2, essay: 3, speech: 3 };
const STOP = new Set(['the', 'a', 'an', 'of', 'in', 'lord', 'and']);
const nameWords = (n) => String(n).split(/[^A-Za-z]+/).filter((w) => w && !STOP.has(w.toLowerCase()));
export const mentions = (text, name) => nameWords(name).some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));
/* A line's speaker, and whether the speaker is the author of the work it comes from. */
export function speakerOf(l, works) {
  const w = works.find((x) => x.id === l.work) || {}, author = String(w.author || '').split(', told by')[0];
  if (l.who.includes(', in ')) return { name: l.who.split(', in ')[0].trim(), author, isAuthor: false, shelf: w.shelf, title: w.title || '' };
  if (author && l.who.startsWith(author)) return { name: author, author, isAuthor: true, shelf: w.shelf, title: w.title || '' };
  return { name: l.who.split(',')[0].trim(), author, isAuthor: false, shelf: w.shelf, title: w.title || '' };
}
/* Fair lines only: the answer is never named in the line itself; one line once. */
export function whoLines(lines, works) {
  const have = new Set();
  return lines.filter((l) => l && l.text && l.text.length <= 160 && !have.has(sp(l.text)) && have.add(sp(l.text))).map((l) => ({ ...l, key: itemKey('w', l.text), sp: speakerOf(l, works) })).filter((l) => l.sp.name && !mentions(l.text, l.sp.name));
}
const whoTier = (l) => TIER[l.sp.shelf] || 2;
const byWho = (a, b) => whoTier(a) - whoTier(b) || a.text.length - b.text.length || (a.key < b.key ? -1 : 1);
export function whoLevelPool(lines, works, level = 1, final = false) {
  const L = clampLevel(level), all = whoLines(lines, works);
  let pool = all.filter((l) => (L === 1 ? whoTier(l) === 1 : L === 2 ? whoTier(l) <= 2 : L >= 5 ? whoTier(l) >= 2 : true));
  if (pool.length < 12) pool = all;
  pool = pool.sort(byWho);
  return final ? pool.slice(Math.floor(pool.length / 2)) : pool;
}
const SHELF_WORD = { children: 'a children’s book', fable: 'a fable or fairy tale', poetry: 'a poem', drama: 'a play', novel: 'a novel', essay: 'an essay', speech: 'a speech' };
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const firstSentence = (s) => (String(s || '').match(/^.*?[.!?](?=\s|$)/) || [String(s || '')])[0];
/* Up to three clues, none naming any of the four options (right or wrong): what kind of book and when;
   what the book is (its own one-line "why", never its title); then its title — or, if the title names
   an option, its author. */
export function whoClues(w = {}, options = []) {
  const names = (t) => options.some((o) => mentions(t, o)), out = [];
  const kind = `${cap1(SHELF_WORD[w.shelf] || 'a book')}${w.year ? ` from ${w.year}` : ''}${w.era && w.era !== 'Fable & myth' ? ` · ${w.era}` : ''}`;
  if (!names(kind)) out.push({ k: 'kind', text: kind });
  const titled = (t) => w.title && t.toLowerCase().includes(String(w.title).toLowerCase());
  const about = [w.why, firstSentence(w.summary)].find((t) => t && t.length <= 200 && !names(t) && !titled(t));
  if (about) out.push({ k: 'about', text: about });
  if (w.title && !names(w.title)) out.push({ k: 'title', text: `From “${w.title}”` });
  else { const au = String(w.author || '').split(', told by')[0]; if (au && !names(au)) out.push({ k: 'author', text: `By ${au}` }); }
  return out;
}
export function whoRound(lines, works, seed, level = 1, n = 5, o = {}) {
  const L = clampLevel(level), RL = o.final ? Math.min(MAX_LEVEL, L + 1) : L, all = whoLines(lines, works);
  const picked = memDraw(whoLevelPool(lines, works, L, o.final), (l) => l.key, o.mem, 'who:' + seed, n, o.now).sort(byWho);
  const people = [...new Map(all.map((l) => [l.sp.name, l.sp])).values()];
  return picked.map((l, i) => {
    const sp = l.sp, right = sp.name;
    /* a rival is never the right line's author, never a character of the right author's when the
       answer IS the author, never named in the line; near rivals (same shelf, same author's other
       characters) only from level 3 */
    const fair = people.filter((p) => p.name !== right && p.name !== sp.author && !mentions(l.text, p.name) && !(sp.isAuthor && p.author === sp.author) && !(p.isAuthor && p.name === sp.author)
      && (RL >= 4 || p.author !== sp.author));
    const near = RL >= 3 ? fair.filter((p) => p.shelf === sp.shelf) : [];
    const R2 = rng('w' + seed + l.key), wrong = [...sample(R2, near, 3), ...sample(R2, fair.filter((p) => !near.includes(p)), 3)].slice(0, 3).map((p) => p.name);
    const { options, answer } = permute(`who:${hash(String(seed))}:${i}`, [right, ...wrong]);
    const w = works.find((x) => x.id === l.work) || {};
    return { text: l.text, work: sp.title, workId: l.work, options, answer, right, cat: l.work, tier: whoTier(l), key: l.key, clues: whoClues(w, options) };
  });
}

/* ---------- Figure Hunt ---------- */
/* A line from a held text (data/literature.js FIGURES + data/figures-more.js, each checked word for word):
   which figure of speech is it? The answers keep one fixed order, so no slot can lean; a round is
   balanced across the kinds its level offers. */
export const FIGURE_KINDS = [['simile', 'Simile', 'compares two things using “like” or “as”'], ['metaphor', 'Metaphor', 'says one thing IS another'],
  ['personification', 'Personification', 'gives a thing or an idea a person’s actions or feelings'], ['alliteration', 'Alliteration', 'repeats the first sound of words close together'], ['none', 'None of these', 'says it plainly — no figure at all']];
const FIG_HARD = { simile: 1, alliteration: 1, metaphor: 2, personification: 3, none: 3 };
export const HUNT_KINDS = ['simile', 'metaphor', 'personification', 'alliteration'];
/* the kinds a level offers, and how many of each in a round of ten */
export const FIGURE_LEVELS = { 1: { simile: 4, alliteration: 3, none: 3 }, 2: { simile: 3, alliteration: 2, metaphor: 3, none: 2 },
  3: { simile: 2, alliteration: 2, metaphor: 2, personification: 2, none: 2 }, 4: { simile: 1, alliteration: 2, metaphor: 3, personification: 2, none: 2 }, 5: { simile: 1, alliteration: 1, metaphor: 3, personification: 3, none: 2 } };
const figKey = (f) => itemKey('f', f.text);
export function figurePool(figures) {
  const have = new Set(); return figures.filter((f) => f && f.text && FIG_HARD[f.figure] && !have.has(sp(f.text)) && have.add(sp(f.text)));
}
/* how many of each kind in a round of m: the level's mix scaled, the spare places rotating by seed so
   across plays every offered slot is equal (levels 1–2 split evenly) */
function figureWant(L, m, R) {
  const mix = FIGURE_LEVELS[L], ks = Object.keys(mix), want = {}, rot = Math.floor(R() * ks.length);
  const share = L <= 2 ? Object.fromEntries(ks.map((k) => [k, 1])) : mix, tot = ks.reduce((a, k) => a + share[k], 0);
  let used = 0; for (const k of ks) { want[k] = Math.floor((share[k] * m) / tot); used += want[k]; }
  for (let j = 0; used < m; j++) { want[ks[(rot + j) % ks.length]]++; used++; }
  return want;
}
export function figureRound(figures, works, seed, level = 3, n = 10, o = {}) {
  const L = clampLevel(level), ML = o.final ? Math.min(MAX_LEVEL, L + 1) : L, kinds = FIGURE_KINDS.filter(([k]) => FIGURE_LEVELS[ML][k]);
  const pool = figurePool(figures), R = rng('fig:' + seed + ':' + ML), title = (id) => works.find((w) => w.id === id)?.title || '';
  /* the hunts: from level 3, half the round, the kinds taken in turn so the naming slot cannot lean */
  const hunts = [];
  const place = Math.floor(R() * 4);
  if (ML >= 3 && o.hunts?.length) {
    const kinds = HUNT_KINDS.filter((k) => o.hunts.some((x) => x.figure === k)), want = Math.floor(n / 2), rot = Math.floor(R() * kinds.length), used = new Set(), at = (h, a) => (h.windows || [h]).some((w) => w.at === a);
    for (let j = 0; hunts.length < want && j < want * 3; j++) {
      const k = kinds[(rot + hunts.length) % kinds.length], a = (place + hunts.length) % 4, free = o.hunts.filter((x) => !used.has(x.key));
      /* the kind the naming slot wants and the place the spot slot wants, as near as the pool allows */
      const tiers = [free.filter((x) => x.figure === k && at(x, a)), free.filter((x) => x.figure === k), free.filter((x) => at(x, a)), free];
      const [h] = memDraw(tiers.find((t) => t.length) || [], (x) => x.key, o.mem, 'hunt:' + seed + ':' + j, 1, o.now);
      if (!h) break; used.add(h.key); hunts.push(h);
    }
  }
  const huntKeys = new Set(hunts.map((h) => h.key)), want = figureWant(ML, n - hunts.length, R), out = [];
  for (const [k] of kinds) out.push(...memDraw(pool.filter((f) => f.figure === k && !huntKeys.has(figKey(f))), figKey, o.mem, 'fk:' + seed + k, want[k] || 0, o.now));
  const lines = out.map((f) => ({ text: f.text, work: title(f.work), workId: f.work, kinds: kinds.map(([k]) => k), options: kinds.map(([, name]) => name), answer: kinds.findIndex(([k]) => k === f.figure), cat: f.figure, key: figKey(f) }));
  const hunted = hunts.map((h, j) => ({ hunt: true, text: h.text, ...(({ sentences, at }) => ({ sentences, at }))(huntWindow(h, (place + j) % 4)), work: title(h.work), workId: h.work, kinds: HUNT_KINDS, options: HUNT_KINDS.map((k) => FIGURE_KINDS.find(([x]) => x === k)[1]), answer: HUNT_KINDS.indexOf(h.figure), cat: h.figure, key: h.key }));
  return [...lines, ...hunted].sort((a, b) => FIG_HARD[a.cat] - FIG_HARD[b.cat] || hash(seed + a.text) - hash(seed + b.text)).slice(0, n);
}
/* The passage hunt's passages: a figure found inside a held prose passage (data/passages.json or a whole
   book's chapter), with three or four of the sentences around it — exact, as the passage has them. The
   figure's sentence sits in a different place from item to item; the other sentences carry no "like",
   "as if" or "as … as" and no other figure from the bank. */
const ABBR = /\b(Mr|Mrs|Dr|St|Mt|Jr|Sr|vs|Mme|Messrs|Capt|Col|Gen|Prof|Rev|i\.e|e\.g)\.$/;
export function sentencesOf(t) {
  const out = [], re = /[.!?]['"’”)\]]*(?=\s+["“‘'(\[]?[A-Z])/g; let start = 0, m;
  while ((m = re.exec(t))) { const end = m.index + m[0].length; if (ABBR.test(t.slice(Math.max(0, end - 8), end))) continue; out.push([start, end]); start = end; while (t[start] === ' ') start++; }
  if (start < t.length) out.push([start, t.length]);
  return out;
}
const SIMILE_RE = /\blike\b|\bas if\b|\bas though\b|\bas \w+ as\b/i;
export function huntOf(fig, text, others = []) {
  const t = /\s\s|\n/.test(text) ? sp(text) : text, f = sp(fig.text), idx = t.indexOf(f); if (idx < 0) return null;
  const lo = Math.max(0, idx - 1500), region = t.slice(lo, idx + f.length + 1500);
  let ss = sentencesOf(region).map(([a, b]) => [a + lo, b + lo]);
  if (lo > 0) ss = ss.slice(1); if (idx + f.length + 1500 < t.length) ss = ss.slice(0, -1);
  const j = ss.findIndex(([a, b]) => a <= idx && idx + f.length <= b); if (j < 0) return null;
  const key = figKey(fig), clean = (s) => s.length >= 12 && s.length <= 260 && /[a-z]/.test(s) && !/CHAPTER|\[Illustration|_/.test(s), windows = [];
  for (const size of [4, 3]) for (let p = 0; p < size; p++) {
    const a = j - p; if (a < 0 || a + size > ss.length) continue;
    const sentences = ss.slice(a, a + size).map(([x, y]) => t.slice(x, y));
    if (!sentences.every(clean) || sentences.join(' ').length > 720) continue;
    if (sentences.some((s, i) => i !== p && (SIMILE_RE.test(s) || s.includes(f) || others.some((o) => o !== f && s.includes(o))))) continue;
    windows.push({ sentences, at: p });
  }
  if (!windows.length) return null;
  const w0 = windows[hash(key) % windows.length];
  return { key, figure: fig.figure, work: fig.work, text: fig.text, sentences: w0.sentences, at: w0.at, windows };
}
/* the window a round shows: the figure's sentence in the place the round wants (so no place leans) */
const huntWindow = (h, at) => (h.windows || [h]).find((w) => w.at === at && w.sentences.length === 4) || (h.windows || [h]).find((w) => w.at === at) || (h.windows || [h]).slice().sort((a, b) => Math.abs(a.at - at) - Math.abs(b.at - at))[0];
/* sources: [{ work, text }] — the held prose the app already has (passages, chapters) */
const VERSE = new Set(['poetry', 'drama']);
export const huntable = (f, works = []) => HUNT_KINDS.includes(f.figure) && !VERSE.has(works.find((w) => w.id === f.work)?.shelf);
export function huntsFrom(figures, sources, works = []) {
  const pool = figurePool(figures).filter((f) => huntable(f, works)), others = pool.map((f) => sp(f.text)), out = [], flat = sources.map((s) => ({ work: s.work, text: sp(s.text) }));
  for (const f of pool) { const src = flat.find((s) => s.work === f.work && s.text.includes(sp(f.text))); const h = src && huntOf(f, src.text, others); if (h) out.push(h); }
  return out;
}
/* A hunt is two decisions: SPOT the sentence (1 point), then NAME the figure (1 point, the quiz). A wrong
   spot holds, showing the right sentence, until 'next' moves on to naming. */
export function figureStep(s, a) {
  if (s.over) return s;
  const q = s.rounds[s.i];
  if (q.hunt && !s.found) {
    if (a.type === 'spot') {
      if (s.spot || !(a.i >= 0 && a.i < q.sentences.length)) return s;
      const ok = a.i === q.at, c = comboOf(s, ok);
      return { ...s, ...c, spot: { pick: a.i, ok, gain: ok ? 1 + c.comboBonus : 0, combo: c.comboBonus }, found: ok, score: s.score + (ok ? 1 + c.comboBonus : 0), right: s.right + (ok ? 1 : 0), answered: s.answered + 1,
        misses: ok ? s.misses : bump(s.misses, q.cat), seq: s.seq + 1 };
    }
    if (a.type === 'next' && s.spot && !s.spot.ok) return { ...s, found: true };
    return s;
  }
  const t = quizStep(s, a);
  if (t === s) return s;
  if (a.type === 'pick' && q.hunt) return { ...t, results: [...t.results.slice(0, -1), !!(s.spot?.ok && t.state.ok)] };
  if (a.type === 'next') return { ...t, spot: null, found: false };
  return t;
}

/* ---------- Plot Line ---------- */
/* The first sentence of a scene, exactly as the book has it — cut at a word with "…" if it runs long. */
export function opening(scene, max = 150) {
  const t = String(scene).replace(/\s+/g, ' ').trim();
  const re = /[.!?]['"’”]?(?=\s+["“‘']?[A-Z])|[.!?]['"’”]?$/g; let m, end = t.length;
  while ((m = re.exec(t))) { const e = m.index + m[0].length; if (e >= 28) { end = e; break; } }
  let s = t.slice(0, end);
  if (s.length > max) { s = s.slice(0, max); s = s.slice(0, s.lastIndexOf(' ')).replace(/[,;:—–-]+$/, '') + '…'; }
  return s;
}
/* stories only: an essay, a speech or a prose poem has no events in an order */
const NOT_STORY = new Set(['essay', 'speech', 'poetry']);
export const plotSize = (level) => { const L = clampLevel(level); return L <= 2 ? 4 : L <= 4 ? 5 : 6; };
/* Every story the game can deal at a size: each shippable prose passage with ≥ 4 scenes, and each whole
   book's chapter cut into runs of `size` scenes in a row. chapters: [{ book, n, short, band, scenes }]. */
const STORIES = new WeakMap();
export function plotStories(passages, works = [], chapters = [], size = 4) {
  let memo = STORIES.get(passages); if (!memo) STORIES.set(passages, (memo = []));
  const hit = memo.find((m) => m.works === works && m.chapters === chapters && m.size === size); if (hit) return hit.out;
  const out = storiesOf(passages, works, chapters, size); memo.push({ works, chapters, size, out }); return out;
}
function storiesOf(passages, works, chapters, size) {
  const mk = (id, cat, title, work, band, scenes) => { const cards = scenes.map((sc, at) => ({ text: opening(sc), at })); return new Set(cards.map((c) => c.text)).size === cards.length && cards.every((c) => c.text.length >= 12) ? { id, cat, key: 'p:' + id + '@' + cards.length, title, work, band, cards } : null; };
  const out = passages.filter((p) => p.kind === 'prose' && (p.scenes || []).length >= 4 && !NOT_STORY.has(works.find((w) => w.id === p.work)?.shelf))
    .map((p) => mk(p.id, p.id, p.title, p.work, p.band || 1, p.scenes.slice(0, Math.min(size, p.scenes.length))));
  for (const c of chapters) {
    const w = Math.floor((c.scenes || []).length / size);
    for (let j = 0; j < w; j++) out.push(mk(`${c.book}-${c.n}.${j + 1}`, `${c.book}-${c.n}`, `${c.short}, chapter ${c.n}${w > 1 ? ` (part ${j + 1} of ${w})` : ''}`, c.book, c.band || 2, c.scenes.slice(j * size, j * size + size)));
  }
  return out.filter(Boolean);
}
const plotHard = (p) => p.band * 1000 + p.cards.length * 100 + Math.round(p.cards.reduce((a, c) => a + c.text.length, 0) / p.cards.length / 4);
export function plotPool(passages, level = 1, works = [], chapters = [], final = false) {
  const L = clampLevel(level), size = final && L <= 2 ? 5 : plotSize(L);
  const all = plotStories(passages, works, chapters, size).sort((a, b) => plotHard(a) - plotHard(b) || (a.id < b.id ? -1 : 1));
  return rampWindow(all, L, final);
}
export function plotRound(passages, seed, level = 1, n = 3, works = [], o = {}) {
  const L = clampLevel(level);
  if (o.final && L >= 3) return plotMissing(passages, seed, L, n, works, o);
  const pool = plotPool(passages, L, works, o.chapters || [], o.final);
  return memDraw(pool, (p) => p.key, o.mem, 'plot:' + seed, n, o.now).sort((a, b) => a.cards.length - b.cards.length || a.band - b.band || (a.id < b.id ? -1 : 1)).map((p) => {
    let cards = shuffle(rng('pc:' + seed + p.id), p.cards);
    if (cards.every((c, j) => c.at === j)) cards = [...cards.slice(1), cards[0]];   // never dealt in order
    return { ...p, type: 'order', cards };
  });
}
/* Which scene is missing? The story's scenes in order with one taken out; four openings to choose from —
   the missing one, and three from the same book's other stories (or, short of those, the same band's). */
export function plotMissing(passages, seed, level = 3, n = 3, works = [], o = {}) {
  const L = clampLevel(level), size = plotSize(L), chapters = o.chapters || [];
  const all = plotStories(passages, works, chapters, size), pool = plotPool(passages, L, works, chapters, true).filter((p) => p.cards.length >= 5);
  const R = rng('miss:' + seed);
  return memDraw(pool.length ? pool : all.filter((p) => p.cards.length >= 5), (p) => p.key + ':m', o.mem, 'miss:' + seed, n, o.now).map((p, i) => {
    const gap = hash(seed + p.id) % p.cards.length, mine = new Set(p.cards.map((c) => c.text));
    const from = (f) => [...new Set(all.filter((x) => x.cat !== p.cat && f(x)).flatMap((x) => x.cards.map((c) => c.text)).filter((t) => !mine.has(t)))];
    let decoys = sample(R, from((x) => x.work === p.work), 3);
    if (decoys.length < 3) decoys = [...decoys, ...sample(R, from((x) => x.work !== p.work && x.band === p.band).filter((t) => !decoys.includes(t)), 3 - decoys.length)];
    const { options, answer } = permute(`miss:${hash(String(seed))}:${i}`, [p.cards[gap].text, ...decoys]);
    return { type: 'missing', id: p.id, cat: p.cat, key: p.key + ':m', title: p.title, work: p.work, band: p.band, cards: p.cards, gap, options, answer };
  }).filter((q) => q.options.length === 4);
}
export function plotNew(rounds, level = 1) { return { kind: 'plot', level: clampLevel(level), rounds, i: 0, score: 0, right: 0, total: 0, perfect: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, results: [], ...fresh(rounds[0]), state: null, over: !rounds.length }; }
const fresh = (q) => ({ line: q?.type === 'missing' ? [] : Array((q?.cards || []).length).fill(null), stack: [], cursor: 0, slot: 0 });
/* pairs in the child's line that stand next to each other in the story's order */
export const plotPairs = (cards, line) => line.slice(1).reduce((n, c, j) => n + (c != null && line[j] != null && cards[c].at === cards[line[j]].at + 1 ? 1 : 0), 0);
export function plotStep(s, a) {
  if (s.over) return s;
  const q = s.rounds[s.i];
  if (a.type === 'next') { if (!s.state) return s; const i = s.i + 1; return { ...s, i: Math.min(i, s.rounds.length - 1), ...fresh(s.rounds[i]), state: null, over: i >= s.rounds.length }; }
  if (q.type === 'missing') {
    if (a.type !== 'pick' || s.state || !(a.i >= 0 && a.i < q.options.length)) return s;
    const ok = a.i === q.answer, c = comboOf(s, ok), gain = ok ? 1 + c.comboBonus : 0;
    return { ...s, ...c, state: { pick: a.i, ok, gain, combo: c.comboBonus }, score: s.score + gain, right: s.right + (ok ? 1 : 0), total: s.total + 1, perfect: s.perfect + (ok ? 1 : 0),
      misses: ok ? s.misses : bump(s.misses, q.cat), seq: s.seq + 1, results: [...s.results, ok] };
  }
  const n = q.cards.length, placed = new Set(s.line.filter((x) => x != null)), free = q.cards.map((_, j) => j).filter((j) => !placed.has(j));
  const empties = (line) => line.map((c, j) => (c == null ? j : -1)).filter((j) => j >= 0);
  if (a.type === 'place') {
    if (s.state || !(a.i >= 0 && a.i < n) || placed.has(a.i)) return s;
    const at = a.at != null ? a.at : s.line[s.slot] == null ? s.slot : empties(s.line)[0];
    if (!(at >= 0 && at < n)) return s;
    const line = s.line.slice(), stack = s.stack.filter((j) => j !== line[at]); line[at] = a.i; stack.push(a.i);   // dropped on a full slot: the card there goes back
    const left = empties(line), rest = q.cards.map((_, j) => j).filter((j) => !line.includes(j));
    if (left.length) return { ...s, line, stack, cursor: rest.includes(s.cursor) ? s.cursor : rest[0], slot: left[0] };
    const pairs = plotPairs(q.cards, line), max = n - 1, ok = pairs === max, c = comboOf(s, ok);
    return { ...s, ...c, line, stack, state: { pairs, max, ok, gain: pairs + c.comboBonus, combo: c.comboBonus }, score: s.score + pairs + c.comboBonus, right: s.right + pairs, total: s.total + max, perfect: s.perfect + (ok ? 1 : 0),
      misses: ok ? s.misses : { ...s.misses, [q.cat]: (s.misses[q.cat] || 0) + (max - pairs) }, seq: s.seq + 1, results: [...s.results, ok] };
  }
  if (s.state) return s;
  if (a.type === 'undo') { if (!s.stack.length) return s; const last = s.stack[s.stack.length - 1], at = s.line.indexOf(last), line = s.line.slice(); line[at] = null; return { ...s, line, stack: s.stack.slice(0, -1), cursor: last, slot: at }; }
  if (a.type === 'move') { if (!free.length) return s; const k = free.indexOf(s.cursor); return { ...s, cursor: free[((k < 0 ? 0 : k + (a.d || 0)) % free.length + free.length) % free.length] }; }
  if (a.type === 'slot') { const e = empties(s.line); if (!e.length) return s; if (a.at != null) return e.includes(a.at) && a.at !== s.slot ? { ...s, slot: a.at } : s; const k = e.indexOf(s.slot); return { ...s, slot: e[((k < 0 ? 0 : k + (a.d || 0)) % e.length + e.length) % e.length] }; }
  return s;
}

/* ---------- Root Forge ---------- */
/* lex: Bee's word list (public/data/bee-words.json: words, prefixNon, suffixNon); wp: data/wordparts.js.
   prefixNon[word] / suffixNon[word] list the affixes that make NO word in Bee's list with that word's
   base — the import computed them — so a rival is never a real word. Root rounds check Bee's list
   directly: a rival prefix starts no word in it at all. */
const KEYS = new WeakMap(), POOLS = new WeakMap();
const lexKeys = (lex) => { let k = KEYS.get(lex); if (!k) KEYS.set(lex, (k = Object.keys(lex.words))); return k; };
export function forgePools(lex, wp) {
  const memo = POOLS.get(lex); if (memo && memo.wp === wp) return memo.out;
  const P = wp.PREFIXES.map((a) => a.p), S = wp.SUFFIXES.map((a) => a.s), keys = lexKeys(lex), out = [];
  for (const a of wp.PREFIXES) a.words.forEach(([word, base]) => { const non = (lex.prefixNon?.[word] || []).filter((x) => P.includes(x) && x !== a.p); if (lex.words[word] && non.length >= 3) out.push({ kind: 'prefix', aff: a.p, base, word, non, band: a.band || 1, meaning: a.meaning }); });
  for (const a of wp.SUFFIXES) a.words.forEach(([word, base]) => { const non = (lex.suffixNon?.[word] || []).filter((x) => S.includes(x) && x !== a.s); if (lex.words[word] && non.length >= 3) out.push({ kind: 'suffix', aff: a.s, base, word, non, band: a.band || 1, meaning: a.meaning }); });
  for (const r of wp.ROOTS) for (const rt of r.root.split(/\s*\/\s*/)) for (const word of r.words) for (const p of P) {
    if (word !== p + rt || !lex.words[word]) continue;
    const non = P.filter((q) => q !== p && !keys.some((k) => k.startsWith(q + rt)));
    if (non.length >= 3) out.push({ kind: 'root', aff: p, base: rt, word, non, band: 4, meaning: r.meaning });
  }
  POOLS.set(lex, { wp, out });
  return out;
}
const affLabel = (kind, x) => (kind === 'suffix' ? '-' + x : x + '-');
export const FORGE_LEVELS = { 1: { cap: 1, roots: 0 }, 2: { cap: 2, roots: 0 }, 3: { cap: 3, roots: 0 }, 4: { cap: 3, roots: 4 }, 5: { cap: 3, roots: 6, min: 2 } };
function forgeItem(lex, x, seed, id) {
  const wrong = sample(rng('fw:' + seed + x.word), x.non, 3);
  const { options, answer } = permute(id, [x.aff, ...wrong].map((y) => affLabel(x.kind, y)));
  const d = lex.words[x.word];
  return { kind: x.kind, base: x.base, word: x.word, before: x.kind !== 'suffix', options, answer, cat: x.kind, key: 'f:' + x.word, meaning: x.meaning, def: d ? d[0] : '', ps: d ? d[2] : '' };
}
export function forgeRound(lex, wp, seed, level = 1, n = 10, o = {}) {
  const L = clampLevel(level), cfg = FORGE_LEVELS[o.final ? Math.min(MAX_LEVEL, L + 1) : L], all = forgePools(lex, wp), k = (x) => 'f:' + x.word;
  const affix = all.filter((x) => x.kind !== 'root' && x.band <= cfg.cap && x.band >= (cfg.min || 1)), roots = all.filter((x) => x.kind === 'root'), nr = Math.round((cfg.roots * n) / 10);
  const pr = memDraw(roots, k, o.mem, 'forge-r:' + seed, nr, o.now), picked = [...memDraw(affix, k, o.mem, 'forge:' + seed, n - pr.length, o.now), ...pr].sort((a, b) => a.band - b.band || (a.word < b.word ? -1 : 1));
  return picked.map((x, i) => forgeItem(lex, x, seed, `forge:${hash(String(seed))}:${i}`));
}
/* Families: three or more words from one base ("happy": unhappy, happiness, happily) or one root ("port"). */
export function forgeFamilies(lex, wp) {
  const by = new Map();
  for (const x of forgePools(lex, wp)) { const id = (x.kind === 'root' ? 'root:' : 'base:') + x.base; if (!by.has(id)) by.set(id, new Map()); if (!by.get(id).has(x.word)) by.get(id).set(x.word, x); }
  return [...by.entries()].filter(([, m]) => m.size >= 3).map(([id, m]) => ({ id, key: 'fam:' + id, root: id.startsWith('root:'), base: id.split(':')[1], members: [...m.values()] }));
}
/* The final: `k` families, three words each, one after another. */
export function forgeFamilyRound(lex, wp, seed, level = 1, k = 2, o = {}) {
  const fams = memDraw(forgeFamilies(lex, wp), (f) => f.key, o.mem, 'fam:' + seed, k, o.now), out = [];
  fams.forEach((f) => {
    const three = memDraw(f.members, (x) => 'f:' + x.word, o.mem, 'fm:' + seed + f.id, 3, o.now).sort((a, b) => (a.word < b.word ? -1 : 1));
    three.forEach((x, j) => out.push({ ...forgeItem(lex, x, seed, `fam:${hash(String(seed))}:${out.length}`), family: { id: f.id, key: f.key, base: f.base, root: f.root, step: j, of: three.length, words: three.map((y) => y.word) } }));
  });
  return out;
}

/* ---------- Rhetoric Duel ---------- */
const DEVICES = ['anaphora', 'tricolon', 'antithesis', 'rhetorical question', 'alliteration', 'simile'];
const DUEL_HARD = { alliteration: 1, 'rhetorical question': 1, tricolon: 2, anaphora: 2, antithesis: 3 };
const duelHard = (r) => DUEL_HARD[r.device] || 2;
/* rhetoric: data/language.js RHETORIC (+ rhetoric-more.js); plain: data/duel.js PLAIN (+ PLAIN_MORE). */
export function duelLevelPool(rhetoric, plain, level = 1, final = false) {
  const L = clampLevel(final ? level + 1 : level), have = new Set(), all = rhetoric.filter((r) => r && plain[r.text] && DUEL_HARD[r.device] && !have.has(r.text) && have.add(r.text));
  const pool = all.filter((r) => (L === 1 ? duelHard(r) === 1 : L === 2 ? duelHard(r) <= 2 : L >= 5 ? duelHard(r) >= 2 : true));
  return pool.length >= 5 ? pool : all;
}
export function duelRound(rhetoric, plain, seed, level = 1, n = 5, o = {}) {
  const pool = duelLevelPool(rhetoric, plain, level, o.final);
  return memDraw(pool, (r) => itemKey('d', r.text), o.mem, 'duel:' + seed, n, o.now).sort((a, b) => duelHard(a) - duelHard(b) || a.text.length - b.text.length).map((r, i) => {
    let others = DEVICES.filter((d) => d !== r.device && !(r.also || []).includes(d));
    if (r.device === 'rhetorical question') others = ['personification', ...others];
    others.sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
    const [longest, ...rest] = others, wrong = [longest, ...sample(rng('dw:' + seed + i), rest, 2)];
    const id = `duel:${hash(String(seed))}:${i}`, { options, answer } = permute(id, [r.device, ...wrong]);
    const strong = hash(id + ':ab') % 2, versions = strong ? [plain[r.text], r.text] : [r.text, plain[r.text]];
    return { original: r.text, work: r.work, device: r.device, versions, strong, options, answer, cat: r.device, key: itemKey('d', r.text) };
  });
}
/* The rival's points, line by line: the app's own, seeded from the duel and the rival's Bee traits — the
   child's score never depends on them. */
export function duelRival(rv, seed, n) { const R = rng(`duel-rival:${seed}:${rv.id}`); return Array.from({ length: n }, () => R() < 0.25 + (rv.skill || 0.6) * 0.6); }
export function duelNew(rounds, level = 1, rival = null) { return { ...quizNew('duel', rounds, level), stage: 'which', which: null, strongRight: 0, rival }; }
/* Stage one: which version is stronger (shown right or wrong, never scored). Stage two: why — scored. */
export function duelStep(s, a) {
  if (s.over) return s;
  if (s.stage === 'which') {
    if (a.type !== 'pick' || !(a.i === 0 || a.i === 1)) return s;
    const q = s.rounds[s.i], ok = a.i === q.strong;
    return { ...s, stage: 'why', which: { pick: a.i, ok }, strongRight: s.strongRight + (ok ? 1 : 0), seq: s.seq + 1 };
  }
  const t = quizStep(s, a);
  if (a.type === 'next' && t !== s) return { ...t, stage: 'which', which: null };
  return t;
}
/* the duel so far: the child's points (reasons right) against the rival's, over the lines played */
export function duelTally(g) { const played = g.results.length, rv = g.rival?.pts || []; return { you: g.results.filter(Boolean).length, them: rv.slice(0, played).filter(Boolean).length, played }; }
