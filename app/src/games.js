/* games.js — the games' rules as pure reducers (state, action) → state, so test/games.mjs can play
   them both ways and soak them for 60 simulated seconds with overlapping events (Finance's Change
   Rush froze for good once when a loop spliced an array it had cleared). The learning IS the
   mechanic; nothing is random in scoring.

   Every game has a LEVEL (1–5, kept per child in k.games[id].level): it rises one step when a round
   is played at 80% or better and falls one step below 40% (never below 1) — `nextLevel`. Inside a
   round the items also climb: the round is sorted from its easiest item to its hardest.
   A COMBO counts right answers in a row; every third in a row is worth one point more. It rewards
   accuracy only — a wrong answer resets it, and nothing about it is chance.

   Sentence Builder (60 s) — join a main clause and a dependent clause with their subordinator, in
     either order: "When the rain stopped, the children ran outside." or "The children ran outside
     when the rain stopped." Scored on correctness, then variety: building the other order earns a
     bonus. Short clauses first; a higher level reaches the longer, later-band sentences.
   Punctuation Rush (60 s) — sentences arrive one at a time with their commas taken out; tap the gaps
     that need them. +1 a right comma, −1 a wrong one (never below zero), a clean sentence +1.
     One-comma sentences first, then the lists and asides with two or more.
   Who Said It? — a line from a held text: which character or author said it? Famous children's
     lines first; higher levels bring essays and speeches, and rivals from the same shelf.
   Figure Hunt — which figure of speech is this real line? Level 1 offers simile, alliteration or
     none; metaphor, then personification join; the top levels lean on the subtle ones.
   Plot Line — the opening sentence of each scene of a story, shuffled: put them in order. Scored on
     the pairs placed next to each other in the right order.
   Root Forge — a base word (or a Latin root) and four prefixes or suffixes: forge the one REAL word.
     Every accepted word is in Bee's word list; every rival makes no word in it.
   Rhetoric Duel — a real line beside a plainer version written for the game: which is stronger,
     and WHY? Scored on the reason. */

import { rng, shuffle, sample, permute, hash } from './rand.js';
import { MAIN_CLAUSE, COMMAS } from './data/sentences.js';

/* The games as the Play page lists them: a world (whose painting is the board), what each practises,
   a three-second how-to, its keys, and what each of its five levels means. */
const LV = (a) => Object.fromEntries(a.map((t, i) => [i + 1, t]));
export const GAMES = {
  builder: { name: 'Sentence Builder', world: 'scriptorium', music: 'games-sentence', timed: true, practises: 'main and dependent clauses, in both orders', how: 'Tap the three parts in an order that makes a sentence. Build it the other way round next time for a bonus.', keys: '1 2 3 pick · Backspace undo',
    levels: LV(['short sentences, first-band words', 'longer clauses from the second band', 'every band, starting a little further along', 'longer sentences from the start', 'the longest clauses first']) },
  rush: { name: 'Punctuation Rush', world: 'study', music: 'games-sentence', timed: true, practises: 'where commas go — lists, openings, names and asides', how: 'Tap every gap that needs a comma, then Enter. Right commas score; wrong ones cost a point.', keys: '← → move · Space comma · Enter next',
    levels: LV(['one comma a sentence', 'one comma, then a few with two', 'one comma, then lists and asides', 'mostly two commas or more', 'lists and asides first']) },
  figure: { name: 'Figure Hunt', world: 'lakeside', music: 'games-word', practises: 'similes, metaphors, personification and alliteration in real lines', how: 'Read the line from a classic. Which figure of speech is it — or is it none?', keys: '1–5 choose · Enter next',
    levels: LV(['simile, alliteration or none', 'metaphor joins in', 'all five, evenly', 'more metaphor and personification', 'the subtle ones, mostly']) },
  who: { name: 'Who Said It?', world: 'playhouse', music: 'games-reading', practises: 'famous lines from the books in the Library', how: 'Read the line. Who said it — or wrote it?', keys: '1–4 choose · Enter next',
    levels: LV(['famous lines from children’s books', 'poems, plays and novels join in', 'every shelf; rivals from the same shelf', 'rivals from the same author’s books', 'poems, plays, essays and speeches']) },
  plot: { name: 'Plot Line', world: 'garden', music: 'games-reading', practises: 'the order of events in a story', how: 'Each card opens a scene of one story. Tap them in the order they happen.', keys: '1–5 place · ← → choose · Enter place · Backspace undo',
    levels: LV(['four scenes from first stories', 'four scenes, longer stories', 'five scenes', 'five scenes from the oldest books', 'five scenes, the hardest stories']) },
  root: { name: 'Root Forge', world: 'scriptorium', music: 'games-word', practises: 'prefixes, suffixes and roots that make real words', how: 'One word part and four pieces. Forge the one that makes a real word.', keys: '1–4 forge · Enter next',
    levels: LV(['first prefixes and endings', 'more prefixes and endings', 'every prefix and ending', 'Latin roots join in', 'mostly roots and harder parts']) },
  duel: { name: 'Rhetoric Duel', world: 'forum', music: 'games-sentence', practises: 'why a sentence is strong — the devices great writers use', how: 'Two versions of one sentence. Pick the stronger — then say why. The reason scores.', keys: '1 2 pick · 1–4 why · Enter next',
    levels: LV(['alliteration and questions', 'groups of three and repeated openings', 'every device', 'every device, longer lines', 'antithesis and the hardest lines']) },
};

export const ROUND_MS = 60000;
export const MAX_LEVEL = 5;
const SUBS = /^(when|because|if|although|after|before|while|until|since|as|unless|once|whenever|though)\b/i;
const clampLevel = (l) => Math.max(1, Math.min(MAX_LEVEL, Math.round(+l || 1)));
const bump = (o, k) => ({ ...o, [k]: (o[k] || 0) + 1 });
const comboOf = (s, ok) => { const combo = ok ? s.combo + 1 : 0; return { combo, bestCombo: Math.max(s.bestCombo || 0, combo), comboBonus: ok && combo > 0 && combo % 3 === 0 ? 1 : 0 }; };

/* ---------- levels ---------- */
/* ≥ 80% → up one, < 40% → down one, never below 1 or above MAX_LEVEL; a round with no attempts moves nothing. */
export function nextLevel(level, pct) {
  const l = clampLevel(level);
  if (pct == null || Number.isNaN(pct)) return l;
  if (pct >= 0.8) return Math.min(MAX_LEVEL, l + 1);
  if (pct < 0.4) return Math.max(1, l - 1);
  return l;
}
/* What a finished round got right, out of how many decisions it asked for. */
export function accuracy(g) {
  let right = 0, total = 0;
  if (g.kind === 'builder') { right = g.built; total = g.built + g.wrong; }
  else if (g.kind === 'rush') { right = g.right; total = g.right + g.wrongs; }
  else if (g.kind === 'plot') { right = g.right; total = g.total; }
  else { right = g.right; total = g.answered ?? g.rounds.length; }
  return { right, total, pct: total ? right / total : null };
}
/* The thing missed most this round (a category key), or null for a clean round. */
export function mostMissed(g) {
  const e = Object.entries(g.misses || {}).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return e.length ? e[0][0] : null;
}

/* ---------- Sentence Builder ---------- */
export function builderPool(band = 3) {
  return MAIN_CLAUSE.map((x, i) => ({ ...x, i })).filter((x) => (x.band || 1) <= band).map((x) => {
    const m = x.s.match(/^(.*)\[(.+)\](.*)$/); const before = m[1].replace(/,\s*$/, '').trim(), after = m[3].replace(/^[,\s]+/, '').replace(/[.!?]$/, '').trim();
    const dep = (before || after).trim(), main = m[2].trim();
    const sm = dep.match(SUBS); if (!sm) return null;
    return { id: x.i, sub: sm[1].toLowerCase(), dep: dep.slice(sm[1].length).trim(), main: main.replace(/[.!?]$/, ''), end: x.s.trim().slice(-1), band: x.band || 1 };
  }).filter(Boolean);
}
const builderLen = (it) => (it.sub + ' ' + it.dep + ' ' + it.main).split(/\s+/).length;
/* The round's road: the level's bands, shortest sentence first; a higher level starts further along. */
export function builderRoad(level = 1) {
  const L = clampLevel(level), pool = builderPool(Math.min(3, L)).sort((a, b) => builderLen(a) - builderLen(b) || a.band - b.band || a.id - b.id);
  const start = Math.floor(pool.length * [0, 0, 0.15, 0.3, 0.45, 0.55][L]);
  return [...pool.slice(start), ...pool.slice(0, start)];
}
export function builderNew(seed, level = 1) {
  const pool = builderRoad(level);
  return { kind: 'builder', level: clampLevel(level), t: 0, over: false, score: 0, built: 0, wrong: 0, lastOrder: null, variety: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, pool, n: 0, picks: [], flash: null, cur: tilesFor(pool[0], seed) };
}
function tilesFor(it, seed) {
  if (!it) return null;
  const subWord = it.sub.charAt(0).toUpperCase() + it.sub.slice(1);
  let tiles = shuffle(rng('t:' + seed + it.id), [{ k: 'sub', text: it.sub }, { k: 'dep', text: it.dep }, { k: 'main', text: it.main }]);
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

export function builderStep(s, a) {
  if (s.over) return s;
  if (a.type === 'tick') { const t = s.t + a.dt; return t >= ROUND_MS ? { ...s, t: ROUND_MS, over: true } : { ...s, t }; }
  if (!s.cur) return { ...s, over: true };
  if (a.type === 'pick') {
    if (a.i < 0 || a.i >= s.cur.tiles.length || s.picks.includes(a.i)) return s;
    const picks = [...s.picks, a.i];
    if (picks.length < 3) return { ...s, picks };
    const order = builderJudge(s.cur, picks);
    if (!order) return { ...s, ...comboOf(s, false), picks: [], wrong: s.wrong + 1, misses: bump(s.misses, 'clause'), seq: s.seq + 1, flash: { ok: false, text: 'Not a sentence yet — which part could stand alone?' } };
    const bonus = s.lastOrder && s.lastOrder !== order ? 1 : 0, c = comboOf(s, true);
    const n = s.n + 1, next = s.pool[n % s.pool.length];
    return { ...s, ...c, picks: [], score: s.score + 2 + bonus + c.comboBonus, built: s.built + 1, variety: s.variety + bonus, lastOrder: order, n, seq: s.seq + 1, cur: tilesFor(next, 'r' + n),
      flash: { ok: true, text: builderSentence(s.cur, order), bonus, combo: c.comboBonus, gain: 2 + bonus + c.comboBonus } };
  }
  if (a.type === 'undo') return s.picks.length ? { ...s, picks: s.picks.slice(0, -1) } : s;
  return s;
}

/* ---------- Punctuation Rush ---------- */
export function rushPool(band = 3) {
  return COMMAS.map((x, i) => ({ ...x, i })).filter((x) => (x.band || 1) <= band).map((x) => {
    const words = x.s.split(/\s+/); return { id: x.i, rule: x.rule, band: x.band || 1, words: words.map((w) => w.replace(/,$/, '')), commas: words.map((w, j) => (w.endsWith(',') ? j : -1)).filter((j) => j >= 0), s: x.s };
  });
}
/* One-comma sentences first, then two or more; a higher level starts further along the road. */
export function rushRoad(level = 1) {
  const L = clampLevel(level), all = rushPool(3).sort((a, b) => a.commas.length - b.commas.length || a.words.length - b.words.length || a.id - b.id);
  const one = all.filter((x) => x.commas.length === 1), multi = all.filter((x) => x.commas.length > 1);
  if (L === 1) return one.filter((x) => x.band <= 2);
  if (L === 2) return [...one, ...multi.filter((x) => x.band <= 2)];
  if (L === 3) { const k = Math.floor(one.length / 3); return [...one.slice(k), ...multi, ...one.slice(0, k)]; }
  if (L === 4) return [...one.slice(-8), ...multi, ...one.slice(0, -8)];
  return [...multi, ...one.slice().reverse()];
}
export function rushNew(seed, level = 1) {
  const pool = rushRoad(level);
  return { kind: 'rush', level: clampLevel(level), t: 0, over: false, score: 0, right: 0, wrongs: 0, clean: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, pool, n: 0, sel: [], cursor: 0, flash: null, cur: pool[0] || null };
}
export function rushStep(s, a) {
  if (s.over) return s;
  if (a.type === 'tick') { const t = s.t + a.dt; return t >= ROUND_MS ? { ...s, t: ROUND_MS, over: true } : { ...s, t }; }
  if (!s.cur) return { ...s, over: true };
  const gaps = s.cur.words.length - 1;
  if (a.type === 'toggle') { if (a.i < 0 || a.i >= gaps) return s; return { ...s, cursor: a.i, sel: s.sel.includes(a.i) ? s.sel.filter((x) => x !== a.i) : [...s.sel, a.i] }; }
  if (a.type === 'move') return { ...s, cursor: Math.max(0, Math.min(gaps - 1, s.cursor + a.d)) };
  if (a.type === 'submit') {
    const want = new Set(s.cur.commas), right = s.sel.filter((i) => want.has(i)).length, wrong = s.sel.length - right, missed = s.cur.commas.length - right;
    const clean = !wrong && !missed ? 1 : 0, c = comboOf(s, !!clean);
    const n = s.n + 1, gain = right - wrong + clean + c.comboBonus;
    return { ...s, ...c, score: Math.max(0, s.score + gain), right: s.right + right, wrongs: s.wrongs + wrong + missed, clean: s.clean + clean, n, sel: [], cursor: 0, seq: s.seq + 1,
      misses: clean ? s.misses : bump(s.misses, s.cur.rule), cur: s.pool[n % s.pool.length], flash: { ok: !!clean, text: s.cur.s, rule: s.cur.rule, gain, combo: c.comboBonus } };
  }
  return s;
}

/* ---------- the untimed games: one reducer for a round of choices ---------- */
/* Every item: { options, answer, cat }. A right pick scores 1 (+1 on every third in a row); a wrong
   one holds until 'next' — the screen explains it on the exact item. */
export function quizNew(kind, rounds, level = 1) {
  return { kind, level: clampLevel(level), rounds, i: 0, score: 0, right: 0, answered: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, results: [], state: null, over: !rounds.length };
}
export function quizStep(s, a) {
  if (s.over) return s;
  const q = s.rounds[s.i];
  if (a.type === 'pick') {
    if (s.state || !(a.i >= 0 && a.i < q.options.length)) return s;
    const ok = a.i === q.answer, c = comboOf(s, ok);
    return { ...s, ...c, state: { pick: a.i, ok, gain: ok ? 1 + c.comboBonus : 0, combo: c.comboBonus }, score: s.score + (ok ? 1 + c.comboBonus : 0), right: s.right + (ok ? 1 : 0), answered: s.answered + 1,
      misses: ok ? s.misses : bump(s.misses, q.cat), seq: s.seq + 1, results: [...s.results, ok] };
  }
  if (a.type === 'next') { if (!s.state) return s; const i = s.i + 1; return { ...s, i: Math.min(i, s.rounds.length - 1), state: null, over: i >= s.rounds.length }; }
  return s;
}

/* ---------- Who Said It? ---------- */
const TIER = { children: 1, fable: 1, poetry: 2, drama: 2, novel: 2, essay: 3, speech: 3 };
const STOP = new Set(['the', 'a', 'an', 'of', 'in', 'lord', 'and']);
const nameWords = (n) => n.split(/[^A-Za-z]+/).filter((w) => w && !STOP.has(w.toLowerCase()));
const mentions = (text, name) => nameWords(name).some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));
/* A line's speaker, and whether the speaker is the author of the work it comes from. */
export function speakerOf(l, works) {
  const w = works.find((x) => x.id === l.work) || {}, author = String(w.author || '').split(', told by')[0];
  if (l.who.includes(', in ')) return { name: l.who.split(', in ')[0].trim(), author, isAuthor: false, shelf: w.shelf, title: w.title || '' };
  if (author && l.who.startsWith(author)) return { name: author, author, isAuthor: true, shelf: w.shelf, title: w.title || '' };
  return { name: l.who.split(',')[0].trim(), author, isAuthor: false, shelf: w.shelf, title: w.title || '' };
}
/* Fair lines only: the answer is never named in the line itself. */
export function whoLines(lines, works) {
  return lines.filter((l) => l.text.length <= 160).map((l) => ({ ...l, sp: speakerOf(l, works) })).filter((l) => !mentions(l.text, l.sp.name));
}
export function whoRound(lines, works, seed, level = 1, n = 8) {
  const L = clampLevel(level), all = whoLines(lines, works), tier = (l) => TIER[l.sp.shelf] || 2;
  const pool = all.filter((l) => (L === 1 ? tier(l) === 1 : L === 2 ? tier(l) <= 2 : L >= 5 ? tier(l) >= 2 : true));
  const R = rng('who:' + seed), picked = sample(R, pool.length >= n ? pool : all, n).sort((a, b) => tier(a) - tier(b) || a.text.length - b.text.length);
  const people = [...new Map(all.map((l) => [l.sp.name, l.sp])).values()];
  return picked.map((l, i) => {
    const sp = l.sp, right = sp.name;
    /* a rival is never the right line's author, never a character of the right author's when the
       answer IS the author, never named in the line; near rivals (same shelf, same author's other
       characters) only from level 3 */
    const fair = people.filter((p) => p.name !== right && p.name !== sp.author && !mentions(l.text, p.name) && !(sp.isAuthor && p.author === sp.author) && !(p.isAuthor && p.name === sp.author)
      && (L >= 4 || p.author !== sp.author));
    const near = L >= 3 ? fair.filter((p) => p.shelf === sp.shelf) : [];
    const R2 = rng('w' + seed + i), wrong = [...sample(R2, near, 3), ...sample(R2, fair.filter((p) => !near.includes(p)), 3)].slice(0, 3).map((p) => p.name);
    const { options, answer } = permute(`who:${hash(String(seed))}:${i}`, [right, ...wrong]);
    return { text: l.text, work: sp.title, workId: l.work, options, answer, right, cat: l.work, tier: tier(l) };
  });
}

/* ---------- Figure Hunt ---------- */
/* A line from a held text (data/literature.js FIGURES, each checked word for word by test/literature.mjs):
   which figure of speech is it? The answers keep one fixed order, so no slot can lean; a round is
   balanced across the kinds its level offers. */
export const FIGURE_KINDS = [['simile', 'Simile', 'compares two things using “like” or “as”'], ['metaphor', 'Metaphor', 'says one thing IS another'],
  ['personification', 'Personification', 'gives a thing or an idea a person’s actions or feelings'], ['alliteration', 'Alliteration', 'repeats the first sound of words close together'], ['none', 'None of these', 'says it plainly — no figure at all']];
const FIG_HARD = { simile: 1, alliteration: 1, metaphor: 2, personification: 3, none: 3 };
/* the kinds a level offers, and how many of each in a round of ten */
export const FIGURE_LEVELS = { 1: { simile: 4, alliteration: 3, none: 3 }, 2: { simile: 3, alliteration: 2, metaphor: 3, none: 2 },
  3: { simile: 2, alliteration: 2, metaphor: 2, personification: 2, none: 2 }, 4: { simile: 1, alliteration: 2, metaphor: 3, personification: 2, none: 2 }, 5: { simile: 1, alliteration: 1, metaphor: 3, personification: 3, none: 2 } };
export function figureRound(figures, works, seed, level = 3, n = 10) {
  const L = clampLevel(level), mix = FIGURE_LEVELS[L], kinds = FIGURE_KINDS.filter(([k]) => mix[k]);
  const R = rng('fig:' + seed + ':' + L), counts = Object.entries(mix);
  /* rotate which kind gets the round's extra places, so across plays every offered slot is equal */
  const rot = Math.floor(R() * counts.length), want = {};
  counts.forEach(([k, c], j) => { want[k] = c; }); if (L <= 2) { const ks = counts.map(([k]) => k); const extra = ks[rot]; for (const k of ks) want[k] = Math.floor(n / ks.length); want[extra] += n - ks.length * Math.floor(n / ks.length); }
  const out = [];
  for (const [k] of counts) out.push(...sample(rng('fk:' + seed + k), figures.filter((f) => f.figure === k), want[k]));
  return out.sort((a, b) => FIG_HARD[a.figure] - FIG_HARD[b.figure] || hash(seed + a.text) - hash(seed + b.text)).slice(0, n).map((f) => ({
    text: f.text, work: works.find((w) => w.id === f.work)?.title || '', kinds: kinds.map(([k]) => k), options: kinds.map(([, name]) => name),
    answer: kinds.findIndex(([k]) => k === f.figure), cat: f.figure }));
}

/* ---------- Plot Line ---------- */
/* The first sentence of a scene, exactly as the book has it — cut at a word with "…" if it runs long. */
export function opening(scene, max = 150) {
  const t = String(scene).replace(/\s+/g, ' ').trim();
  const re = /[.!?]['"’”]?(?=\s+["“‘']?[A-Z]|$)/g; let m, end = t.length;
  while ((m = re.exec(t))) { const e = m.index + m[0].length; if (e >= 28) { end = e; break; } }
  let s = t.slice(0, end);
  if (s.length > max) { s = s.slice(0, max); s = s.slice(0, s.lastIndexOf(' ')).replace(/[,;:—–-]+$/, '') + '…'; }
  return s;
}
/* passages: the shipped prose stories with their scenes (data/passages.json via reading.js) */
/* stories only: an essay, a speech or a prose poem has no events in an order */
const NOT_STORY = new Set(['essay', 'speech', 'poetry']);
export function plotPool(passages, level = 1, works = []) {
  const L = clampLevel(level), size = L <= 2 ? 4 : 5, cap = [0, 1, 2, 2, 3, 3][L];
  const ok = passages.filter((p) => p.kind === 'prose' && (p.scenes || []).length >= 4 && !NOT_STORY.has(works.find((w) => w.id === p.work)?.shelf)).map((p) => {
    const scenes = p.scenes.slice(0, Math.min(size, p.scenes.length)), cards = scenes.map((sc, at) => ({ text: opening(sc), at }));
    return new Set(cards.map((c) => c.text)).size === cards.length ? { id: p.id, title: p.title, work: p.work, band: p.band || 1, cards } : null;
  }).filter(Boolean);
  const inBand = ok.filter((p) => (L >= 5 ? p.band >= 2 : p.band <= cap));
  return inBand.length >= 4 ? inBand : ok;
}
export function plotRound(passages, seed, level = 1, n = 4, works = []) {
  const pool = plotPool(passages, level, works), R = rng('plot:' + seed);
  return sample(R, pool, n).sort((a, b) => a.cards.length - b.cards.length || a.band - b.band).map((p, i) => {
    let cards = shuffle(rng('pc:' + seed + p.id), p.cards);
    if (cards.every((c, j) => c.at === j)) cards = [...cards.slice(1), cards[0]];   // never dealt in order
    return { ...p, cards, cat: p.id };
  });
}
export function plotNew(rounds, level = 1) { return { kind: 'plot', level: clampLevel(level), rounds, i: 0, score: 0, right: 0, total: 0, perfect: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, results: [], line: [], cursor: 0, state: null, over: !rounds.length }; }
/* pairs in the child's line that stand next to each other in the story's order */
export const plotPairs = (cards, line) => line.slice(1).reduce((n, c, j) => n + (cards[c].at === cards[line[j]].at + 1 ? 1 : 0), 0);
export function plotStep(s, a) {
  if (s.over) return s;
  const q = s.rounds[s.i], free = q.cards.map((_, j) => j).filter((j) => !s.line.includes(j));
  if (a.type === 'place') {
    if (s.state || !(a.i >= 0 && a.i < q.cards.length) || s.line.includes(a.i)) return s;
    const line = [...s.line, a.i], rest = free.filter((j) => j !== a.i);
    if (line.length < q.cards.length) return { ...s, line, cursor: rest.length ? rest[0] : 0 };
    const pairs = plotPairs(q.cards, line), max = q.cards.length - 1, ok = pairs === max, c = comboOf(s, ok);
    return { ...s, ...c, line, state: { pairs, max, ok, gain: pairs + c.comboBonus, combo: c.comboBonus }, score: s.score + pairs + c.comboBonus, right: s.right + pairs, total: s.total + max, perfect: s.perfect + (ok ? 1 : 0),
      misses: ok ? s.misses : { ...s.misses, [q.cat]: (s.misses[q.cat] || 0) + (max - pairs) }, seq: s.seq + 1, results: [...s.results, ok] };
  }
  if (a.type === 'undo') return s.state || !s.line.length ? s : { ...s, line: s.line.slice(0, -1), cursor: s.line[s.line.length - 1] };
  if (a.type === 'move') { if (s.state || !free.length) return s; const k = free.indexOf(s.cursor); return { ...s, cursor: free[((k < 0 ? 0 : k + a.d) % free.length + free.length) % free.length] }; }
  if (a.type === 'next') { if (!s.state) return s; const i = s.i + 1; return { ...s, i: Math.min(i, s.rounds.length - 1), line: [], cursor: 0, state: null, over: i >= s.rounds.length }; }
  return s;
}

/* ---------- Root Forge ---------- */
/* lex: Bee's word list (public/data/bee-words.json: words, prefixNon, suffixNon); wp: data/wordparts.js.
   prefixNon[word] / suffixNon[word] list the affixes that make NO word in Bee's list with that word's
   base — the import computed them — so a rival is never a real word. Root rounds check Bee's list
   directly: a rival prefix starts no word in it at all. */
const KEYS = new WeakMap();
const lexKeys = (lex) => { let k = KEYS.get(lex); if (!k) KEYS.set(lex, (k = Object.keys(lex.words))); return k; };
export function forgePools(lex, wp) {
  const P = wp.PREFIXES.map((a) => a.p), S = wp.SUFFIXES.map((a) => a.s), keys = lexKeys(lex), out = [];
  for (const a of wp.PREFIXES) a.words.forEach(([word, base]) => { const non = (lex.prefixNon?.[word] || []).filter((x) => P.includes(x) && x !== a.p); if (lex.words[word] && non.length >= 3) out.push({ kind: 'prefix', aff: a.p, base, word, non, band: a.band || 1, meaning: a.meaning }); });
  for (const a of wp.SUFFIXES) a.words.forEach(([word, base]) => { const non = (lex.suffixNon?.[word] || []).filter((x) => S.includes(x) && x !== a.s); if (lex.words[word] && non.length >= 3) out.push({ kind: 'suffix', aff: a.s, base, word, non, band: a.band || 1, meaning: a.meaning }); });
  for (const r of wp.ROOTS) for (const rt of r.root.split(/\s*\/\s*/)) for (const word of r.words) for (const p of P) {
    if (word !== p + rt || !lex.words[word]) continue;
    const non = P.filter((q) => q !== p && !keys.some((k) => k.startsWith(q + rt)));
    if (non.length >= 3) out.push({ kind: 'root', aff: p, base: rt, word, non, band: 4, meaning: r.meaning });
  }
  return out;
}
const affLabel = (kind, x) => (kind === 'suffix' ? '-' + x : x + '-');
export const FORGE_LEVELS = { 1: { cap: 1, roots: 0 }, 2: { cap: 2, roots: 0 }, 3: { cap: 3, roots: 0 }, 4: { cap: 3, roots: 4 }, 5: { cap: 3, roots: 6, min: 2 } };
export function forgeRound(lex, wp, seed, level = 1, n = 10) {
  const L = clampLevel(level), cfg = FORGE_LEVELS[L], all = forgePools(lex, wp), R = rng('forge:' + seed);
  const affix = all.filter((x) => x.kind !== 'root' && x.band <= cfg.cap && x.band >= (cfg.min || 1)), roots = all.filter((x) => x.kind === 'root');
  const picked = [...sample(R, affix, n - cfg.roots), ...sample(R, roots, cfg.roots)].sort((a, b) => a.band - b.band || (a.word < b.word ? -1 : 1));
  return picked.map((x, i) => {
    const wrong = sample(rng('fw:' + seed + x.word), x.non, 3);
    const { options, answer } = permute(`forge:${hash(String(seed))}:${i}`, [x.aff, ...wrong].map((y) => affLabel(x.kind, y)));
    const d = lex.words[x.word];
    return { kind: x.kind, base: x.base, word: x.word, before: x.kind !== 'suffix', options, answer, cat: x.kind, meaning: x.meaning, def: d ? d[0] : '', ps: d ? d[2] : '' };
  });
}

/* ---------- Rhetoric Duel ---------- */
const DEVICES = ['anaphora', 'tricolon', 'antithesis', 'rhetorical question', 'alliteration', 'simile'];
const DUEL_HARD = { alliteration: 1, 'rhetorical question': 1, tricolon: 2, anaphora: 2, antithesis: 3 };
/* rhetoric: data/language.js RHETORIC; plain: data/duel.js PLAIN (the flattened versions). */
export function duelRound(rhetoric, plain, seed, level = 1, n = 8) {
  const L = clampLevel(level), have = rhetoric.filter((r) => plain[r.text]);
  const hard = (r) => DUEL_HARD[r.device] || 2;
  const pool = have.filter((r) => (L === 1 ? hard(r) === 1 : L === 2 ? hard(r) <= 2 : L >= 5 ? hard(r) >= 2 : true));
  const R = rng('duel:' + seed);
  return sample(R, pool.length >= n ? pool : have, n).sort((a, b) => hard(a) - hard(b) || a.text.length - b.text.length).map((r, i) => {
    let others = DEVICES.filter((d) => d !== r.device && !(r.also || []).includes(d));
    if (r.device === 'rhetorical question') others = ['personification', ...others];
    others.sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
    const [longest, ...rest] = others, wrong = [longest, ...sample(rng('dw:' + seed + i), rest, 2)];
    const id = `duel:${hash(String(seed))}:${i}`, { options, answer } = permute(id, [r.device, ...wrong]);
    const strong = hash(id + ':ab') % 2, versions = strong ? [plain[r.text], r.text] : [r.text, plain[r.text]];
    return { original: r.text, work: r.work, device: r.device, versions, strong, options, answer, cat: r.device };
  });
}
export function duelNew(rounds, level = 1) { return { ...quizNew('duel', rounds, level), stage: 'which', which: null, strongRight: 0 }; }
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
