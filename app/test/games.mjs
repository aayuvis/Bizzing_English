/* games.mjs — every game playable both ways (the same reducer takes taps and keys), scored on the
   learning decision, its difficulty climbing inside a round and across levels, and a 60-second soak
   with overlapping events never freezes or throws. The MEMORY is held to its rules: unseen first, never
   twice in a round, a missed item back after its two-day gap, nothing from the last three plays while
   the pool has more, the same round from the same (seed, seen); ten plays at level 1 meet at least 80%
   distinct items wherever the pool allows (the measured figure is printed). Every item is held to the
   item rules: exactly one right option, distinct options, the answer never in its own text (nor in a
   Detective clue), no slot over 35%, and every line or passage from a book an exact substring of its
   held text. Each new mechanic is played to a perfect score. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { tally } from './_mem.mjs';
import * as G from '../src/games.js';
import { LINES, WORKS } from '../src/data/library.js';
import { MORE_LINES } from '../src/data/lines-more.js';
import { FIGURES } from '../src/data/literature.js';
import { RHETORIC } from '../src/data/language.js';
import { PLAIN, DEVICE_GLOSS } from '../src/data/duel.js';
import { cleared } from '../src/data/rights.js';
import { RIVALS, field } from '../src/contest.js';
import { BOOKS } from '../src/book.js';
import * as WP from '../src/data/wordparts.js';
const { builderNew, builderStep, builderJudge, builderSentence, builderPool, builderRoad, builderLevelPool, builderLen, rushNew, rushStep, rushRoad, rushLevelPool, whoRound, whoLines, whoLevelPool, figureRound, figureStep, figurePool, huntsFrom, FIGURE_KINDS, HUNT_KINDS,
  quizNew, quizStep, plotRound, plotNew, plotStep, plotPairs, plotStories, plotPool, opening, forgeRound, forgePools, forgeFamilies, forgeFamilyRound, duelRound, duelNew, duelStep, duelRival, duelTally, GAMES, nextLevel, accuracy, mostMissed,
  memDraw, memRecord, memCounts, memOf, roundLog, itemKey, mentions, starsFor, runNew, runAdd, runScore, runPct, isFinal, ROUND_MS, MAX_LEVEL, MEM_GAP, MEM_CAP, ROUND_OF, RUN_ROUNDS, CLUE_POINTS } = G;
const { ok, done } = tally('games');
const url = (p) => new URL(p, import.meta.url);
const lex = JSON.parse(readFileSync(url('../public/data/bee-words.json')));
const PJ = JSON.parse(readFileSync(url('../src/data/passages.json')));
const sp = (s) => String(s).replace(/\s+/g, ' ').trim();
const TEXTS = Object.fromEntries(readdirSync(url('../public/texts/')).filter((f) => f.endsWith('.txt')).map((f) => [f.replace(/\.txt$/, ''), sp(readFileSync(url(`../public/texts/${f}`), 'utf8'))]));
const held = (work, text) => (TEXTS[work] || '').includes(sp(text));
const shipped = (id) => cleared(WORKS.find((w) => w.id === id));
const LV = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);
const SEEDS = Array.from({ length: 60 }, (_, i) => 's' + i);
const NOW = Date.UTC(2026, 9, 3, 12), DAY = 864e5;

/* the other pools, when they are there (another hand fills them); today's pools when they are not */
const json = (p) => (existsSync(url(p)) ? JSON.parse(readFileSync(url(p))) : []);
const mod = async (p) => (existsSync(url(p)) ? import(p) : {});
const XB = json('../src/data/games/builder.json'), XR = json('../src/data/games/rush.json');
const { FIGURES_MORE = [] } = await mod('../src/data/figures-more.js'), { RHETORIC_MORE = [], PLAIN_MORE = {} } = await mod('../src/data/rhetoric-more.js');
console.log(`games: pools — builder +${XB.length}, rush +${XR.length}, figures +${FIGURES_MORE.length}, rhetoric +${RHETORIC_MORE.length}`);
const lines = [...LINES, ...MORE_LINES].filter((l) => shipped(l.work));
const figs = [...FIGURES, ...FIGURES_MORE].filter((f) => shipped(f.work));
const rhet = [...RHETORIC, ...RHETORIC_MORE].filter((x) => shipped(x.work)), plain = { ...PLAIN, ...PLAIN_MORE };
const shipP = PJ.filter((p) => shipped(p.work));
const chapters = BOOKS.flatMap((b) => JSON.parse(readFileSync(url(`../src/data/book-${b.id}.json`))).chapters.map((c) => ({ book: b.id, n: c.n, short: b.short, band: b.band, scenes: c.scenes })));
const HUNTS = huntsFrom(figs, Object.entries(TEXTS).filter(([w]) => shipped(w)).map(([work, text]) => ({ work, text })), WORKS);

/* ---------- Sentence Builder ---------- */
ok('Sentence Builder has a pool in every band', [1, 2, 3].every((b) => builderPool(b, XB).length >= 5));
let s = builderNew('t', 3); const c = s.cur;
const order = (ks) => ks.map((k) => c.tiles.findIndex((t) => t.k === k));
ok('front order is a sentence', builderJudge(c, order(['sub', 'dep', 'main'])) === 'front');
ok('end order is a sentence', builderJudge(c, order(['main', 'sub', 'dep'])) === 'end');
ok('a scramble is not', builderJudge(c, order(['dep', 'sub', 'main'])) === null);
ok('the front sentence has its comma', /, /.test(builderSentence(c, 'front')));
ok('tiles are never dealt already built', SEEDS.every((sd) => { const g = builderNew(sd, 2); return builderJudge(g.cur, [0, 1, 2]) === null; }));
const build = (g, ks) => { const cc = g.cur; for (const k of ks) g = builderStep(g, { type: 'pick', i: cc.tiles.findIndex((t) => t.k === k) }); return g; };
s = build(s, ['sub', 'dep', 'main']);
ok('a built sentence scores 2', s.score === 2 && s.built === 1);
s = build(s, ['main', 'sub', 'dep']);
ok('building the other way round earns the variety bonus', s.score === 5 && s.variety === 1);
const c3 = s.cur; s = build(s, ['dep', 'sub', 'main']);
ok('a wrong build scores nothing and holds the tiles', s.score === 5 && s.wrong === 1 && s.cur === c3 && s.combo === 0 && s.misses.clause === 1 && s.curWrong);
ok('a tile cannot be picked twice', builderStep({ ...s, picks: [0] }, { type: 'pick', i: 0 }).picks.length === 1);
let sameTwice = builderNew('u', 3); sameTwice = build(build(sameTwice, ['sub', 'dep', 'main']), ['sub', 'dep', 'main']);
ok('the same order twice earns no bonus', sameTwice.score === 4 && sameTwice.variety === 0);
let cb = builderNew('cb', 1); for (let n = 0; n < 3; n++) cb = build(cb, ['sub', 'dep', 'main']);
ok('three right in a row: the third earns the combo point', cb.combo === 3 && cb.score === 7 && cb.flash.combo === 1);
/* rush hour: a sentence built inside 8 s earns +1; a slow one earns none; time never takes a point away */
let rh = builderNew('rh', 3, { final: true }); rh = builderStep(rh, { type: 'tick', dt: 3000 }); rh = build(rh, ['sub', 'dep', 'main']);
ok('rush hour: built inside 8 s is +1', rh.score === 3 && rh.speed === 1 && rh.flash.fast === 1);
rh = builderStep(rh, { type: 'tick', dt: 9000 }); rh = build(rh, ['main', 'sub', 'dep']);
ok('rush hour: a slow one keeps its points, with no time bonus', rh.score === 3 + 3 && rh.speed === 1);
const wl = builderLen;
ok('Sentence Builder: level 1 is first-band only', builderRoad(1, { extra: XB }).every((x) => x.band === 1));
ok('Sentence Builder: inside a round the first twenty sentences grow', SEEDS.slice(0, 10).every((sd) => LV.every((L) => { const r = builderRoad(L, { seed: sd, extra: XB }).slice(0, 20); return r.every((x, i) => !i || wl(x) >= wl(r[i - 1])); })));
const avgW = (L, f) => { const p = builderLevelPool(L, XB, f); return p.reduce((a, x) => a + wl(x), 0) / p.length; };
ok('Sentence Builder: each level reaches longer sentences, and the final is longer still', LV.slice(1).every((L) => avgW(L) >= avgW(L - 1)) && avgW(5) > avgW(1) && LV.every((L) => avgW(L, true) >= avgW(L)));

/* ---------- Punctuation Rush ---------- */
let r = rushNew('t', 3); const w = r.cur;
for (const i of w.commas) r = rushStep(r, { type: 'toggle', i });
r = rushStep(r, { type: 'submit' });
ok('all the right commas: points plus a clean bonus', r.score === w.commas.length + 1 && r.clean === 1);
let r2 = rushNew('t', 3); r2 = rushStep(r2, { type: 'move', d: 1 }); r2 = rushStep(r2, { type: 'toggle', i: r2.cursor });
ok('the keyboard way toggles the gap under the cursor', r2.sel.length === 1 && r2.sel[0] === r2.cursor);
let r3 = rushNew('t', 3); const wr = [...Array(r3.cur.words.length - 1).keys()].find((i) => !r3.cur.commas.includes(i));
if (wr != null) { r3 = rushStep(r3, { type: 'toggle', i: wr }); r3 = rushStep(r3, { type: 'submit' }); ok('a wrong comma costs, never below zero', r3.score === 0 && r3.misses[r3.flash.rule] === 1); }
let rf2 = rushNew('rf', 3, { final: true }); rf2 = rushStep(rf2, { type: 'tick', dt: 4000 }); const wf = rf2.cur; for (const i of wf.commas) rf2 = rushStep(rf2, { type: 'toggle', i }); rf2 = rushStep(rf2, { type: 'submit' });
ok('rush hour: a clean sentence inside 10 s is +1', rf2.score === wf.commas.length + 2 && rf2.speed === 1);
ok('Punctuation Rush: level 1 is one comma a sentence', rushRoad(1, { extra: XR }).every((x) => x.commas.length === 1));
const avgC = (L, f) => { const p = rushLevelPool(L, XR, f); return p.reduce((a, x) => a + x.commas.length, 0) / p.length; };
ok('Punctuation Rush: each level brings more commas, the final the most', LV.slice(1).every((L) => avgC(L) >= avgC(L - 1)) && avgC(5) > 1.5 && LV.every((L) => avgC(L, true) >= avgC(L)));
ok('Punctuation Rush: every comma sits between two words', rushLevelPool(5, XR).every((x) => x.commas.every((j) => j >= 0 && j < x.words.length - 1)));

/* soak: 60 s of ticks with taps interleaved and out of range, normal and final */
for (const [mk, st] of [[builderNew, builderStep], [rushNew, rushStep]]) {
  for (const [L, final] of [[1, false], [5, false], [3, true]]) {
    let g = mk('soak', L, { final }), steps = 0;
    try {
      while (!g.over && steps < 5000) {
        g = st(g, { type: 'tick', dt: 17 }); steps++;
        g = st(g, { type: steps % 3 ? 'pick' : 'toggle', i: steps % 5 - 1 }); g = st(g, { type: steps % 7 ? 'undo' : 'submit' }); g = st(g, { type: 'move', d: (steps % 3) - 1 });
      }
      ok(`${g.kind} L${L}${final ? ' final' : ''}: a 60 s soak ends cleanly`, g.over && g.t === ROUND_MS && Number.isFinite(g.score) && g.score >= 0);
      ok(`${g.kind} L${L}${final ? ' final' : ''}: nothing moves after the end`, st(g, { type: 'pick', i: 0 }) === g && st(g, { type: 'tick', dt: 999 }) === g);
      ok(`${g.kind}: the round's log names what was met`, roundLog(g).length >= 1 && roundLog(g).every((x) => x.key));
    } catch (e) { ok(`${mk.name}: the soak threw ${e.message}`, false); }
  }
}

/* ---------- levels, runs, stars ---------- */
ok('a level rises at 80%', nextLevel(2, 0.8) === 3 && nextLevel(1, 1) === 2);
ok('a level holds between 40% and 80%', nextLevel(3, 0.79) === 3 && nextLevel(3, 0.4) === 3);
ok('a level falls one step below 40%', nextLevel(3, 0.39) === 2 && nextLevel(4, 0) === 3);
ok('never below 1, never above the top', nextLevel(1, 0) === 1 && nextLevel(MAX_LEVEL, 1) === MAX_LEVEL);
ok('a run with no attempts moves nothing', nextLevel(3, null) === 3);
ok('stars: 1 for a finished run, 2 at 70%, 3 at 90%', starsFor(0) === 1 && starsFor(0.69) === 1 && starsFor(0.7) === 2 && starsFor(0.89) === 2 && starsFor(0.9) === 3 && starsFor(null) === 0);
let run = runNew(2); for (let i = 0; i < RUN_ROUNDS; i++) { ok(`round ${i + 1} is not the final`, !isFinal(run)); run = runAdd(run, { kind: 'who', score: 3, right: 1, answered: 2, rounds: [], misses: { a: 1 }, bestCombo: 1 }, 2); }
ok('after three rounds comes the final', isFinal(run));
run = runAdd(run, { kind: 'who', score: 5, right: 2, answered: 2, rounds: [], misses: { b: 2 }, bestCombo: 2 }, 1);
ok('a run adds its rounds: score, accuracy, misses, new items', runScore(run) === 14 && runPct(run) === 5 / 8 && run.misses.a === 3 && run.misses.b === 2 && run.met === 7 && run.bestCombo === 2 && mostMissed(run) === 'a');

/* ---------- the item rules, as one checker (and proved by breaking it below) ---------- */
function slotLean(items, n, key = (q) => q.answer) { const c = Array(n).fill(0); for (const q of items) c[key(q)]++; return Math.max(...c) / items.length; }
function fair(q, rightOf, textOf = () => '') {
  const errs = [];
  if (!(q.answer >= 0 && q.answer < q.options.length)) errs.push('answer out of range');
  if (q.options[q.answer] !== rightOf(q)) errs.push('the keyed option is not the right one');
  if (new Set(q.options.map((o) => String(o).toLowerCase())).size !== q.options.length) errs.push('options repeat');
  if (q.options.filter((o) => o === rightOf(q)).length !== 1) errs.push('more than one right option');
  const t = textOf(q).toLowerCase(); if (t && String(rightOf(q)).toLowerCase().split(/[^a-z]+/).filter((x) => x.length > 2 && !['the', 'lord', 'and'].includes(x)).some((x) => new RegExp(`\\b${x}\\b`).test(t))) errs.push('the answer is in the text');
  return errs;
}

/* ---------- MEMORY ---------- */
const items = Array.from({ length: 40 }, (_, i) => ({ id: 'x' + i }));
const kx = (x) => x.id;
const seenOf = (ids, p, last, miss = 0) => Object.fromEntries(ids.map((id) => [id, { n: 1, last, p, miss }]));
/* unseen first: with 30 of 40 met (long ago, all right), a round of 8 is all unseen */
const unseenFirst = (round, mem) => { const S = mem.seen, firstSeen = round.findIndex((x) => S[kx(x)]); return round.every((x, i) => !S[kx(x)] || (firstSeen >= 0 && i >= firstSeen)) && (firstSeen < 0 || round.filter((x) => !S[kx(x)]).length === round.slice(0, firstSeen).length); };
const m30 = { seen: seenOf(items.slice(0, 30).map(kx), 0, NOW - 30 * DAY), plays: 10 };
const d8 = memDraw(items, kx, m30, 'a', 8, NOW);
ok('memory: unseen items come first', d8.every((x) => !m30.seen[x.id]) && unseenFirst(memDraw(items, kx, m30, 'b', 15, NOW), m30));
ok('memory: never the same item twice in a round', SEEDS.every((sd) => { const d = memDraw([...items, ...items], kx, m30, sd, 30, NOW); return new Set(d.map(kx)).size === d.length; }));
ok('memory: the same seed and seen give the same round', SEEDS.every((sd) => JSON.stringify(memDraw(items, kx, m30, sd, 12, NOW)) === JSON.stringify(memDraw(items, kx, m30, sd, 12, NOW))));
ok('memory: a different seed deals a different round', new Set(SEEDS.map((sd) => memDraw(items, kx, EMPTYM(), sd, 6, NOW).map(kx).join())).size > 50);
function EMPTYM() { return { seen: {}, plays: 0 }; }
/* missed: back after its two-day gap (even while unseen items wait), not before */
const missMem = (gapDays, pAgo) => ({ seen: { ...seenOf(items.slice(0, 20).map(kx), 0, NOW - 30 * DAY), x5: { n: 1, last: NOW - gapDays * DAY, p: 10 - pAgo, miss: 1 } }, plays: 10 });
ok('memory: a missed item comes back once its gap is over, ahead of the unseen', SEEDS.every((sd) => memDraw(items, kx, missMem(2.1, 4), sd, 8, NOW).some((x) => x.id === 'x5')));
ok('memory: …but not before the gap', SEEDS.every((sd) => !memDraw(items, kx, missMem(1.5, 4), sd, 8, NOW).some((x) => x.id === 'x5')));
ok('memory: …nor while it was in the last three plays', SEEDS.every((sd) => !memDraw(items, kx, missMem(3, 2), sd, 8, NOW).some((x) => x.id === 'x5')));
ok('memory: a right answer clears the miss', memRecord(missMem(3, 4), [{ key: 'x5', ok: true }], NOW).seen.x5.miss === 0 && memRecord(missMem(3, 4), [{ key: 'x5', ok: null }], NOW).seen.x5.miss === 1);
/* the last three plays wait while the pool has more; when it runs out, the least recently met come first */
const small = items.slice(0, 12); let mm = EMPTYM(), log3 = [];
for (let p = 0; p < 3; p++) { const d = memDraw(small, kx, mm, 'p' + p, 3, NOW + p); log3.push(d.map(kx)); mm = memRecord(mm, d.map((x) => ({ key: kx(x), ok: true })), NOW + p); }
const d4 = memDraw(small, kx, mm, 'p4', 3, NOW + 4);
ok('memory: nothing from the last three plays while the pool has more', d4.length === 3 && d4.every((x) => !log3.flat().includes(x.id)) && new Set(log3.flat()).size === 9);
const d5 = memDraw(small, kx, mm, 'p5', 5, NOW + 5);
ok('memory: when the pool runs out, the least recently met fill the round', d5.length === 5 && d5.slice(0, 3).every((x) => !log3.flat().includes(x.id)) && d5.slice(3).every((x) => log3[0].includes(x.id)));
const big = memRecord(EMPTYM(), Array.from({ length: MEM_CAP + 50 }, (_, i) => ({ key: 'k' + i, ok: true })), NOW);
ok(`memory: capped at ${MEM_CAP} keys`, Object.keys(big.seen).length === MEM_CAP);
ok('memory: counts new, to win back and the pool', JSON.stringify(memCounts(items, kx, missMem(3, 4))) === JSON.stringify({ fresh: 20, back: 1, pool: 40 }));
/* prove the unseen-first check by breaking it: a round that ignores the memory fails it */
ok('the unseen-first check catches a round that ignores the memory', SEEDS.some((sd) => !unseenFirst(memDraw(items, kx, EMPTYM(), sd, 15, NOW), m30)));

/* every game: the same (seed, seen) gives the same round; no repeats inside a round; 10 plays at level 1 */
const DEALS = {
  who: (sd, L, o) => whoRound(lines, WORKS, sd, L, ROUND_OF.who, o).map((q) => q.key),
  figure: (sd, L, o) => figureRound(figs, WORKS, sd, L, ROUND_OF.figure, { ...o, hunts: HUNTS }).map((q) => q.key),
  plot: (sd, L, o) => plotRound(shipP, sd, L, ROUND_OF.plot, WORKS, { ...o, chapters }).map((q) => q.key),
  root: (sd, L, o) => (o.final ? forgeFamilyRound(lex, WP, sd, L, 2, o) : forgeRound(lex, WP, sd, L, ROUND_OF.root, o)).map((q) => q.key),
  duel: (sd, L, o) => duelRound(rhet, plain, sd, L, ROUND_OF.duel, o).map((q) => q.key),
  builder: (sd, L, o) => builderRoad(L, { ...o, seed: sd, extra: XB }).slice(0, 8).map((x) => x.key),
  rush: (sd, L, o) => rushRoad(L, { ...o, seed: sd, extra: XR }).slice(0, 8).map((x) => x.key),
};
const POOLS = {
  who: (L) => whoLevelPool(lines, WORKS, L).length, figure: (L) => figurePool(figs).filter((f) => G.FIGURE_LEVELS[L][f.figure]).length, plot: (L) => plotPool(shipP, L, WORKS, chapters).length,
  root: (L) => forgePools(lex, WP).filter((x) => x.kind !== 'root' && x.band <= G.FORGE_LEVELS[L].cap).length, duel: (L) => G.duelLevelPool(rhet, plain, L).length, builder: (L) => builderLevelPool(L, XB).length, rush: (L) => rushLevelPool(L, XR).length,
};
const measured = {};
for (const [id, deal] of Object.entries(DEALS)) {
  let mem = EMPTYM(), all = [], dupIn = false;
  for (let p = 0; p < 10; p++) { const keys = deal(`play${p}`, 1, { mem, now: NOW + p * 600e3 }); if (new Set(keys).size !== keys.length) dupIn = true; all.push(...keys); mem = memRecord(mem, keys.map((key) => ({ key, ok: true })), NOW + p * 600e3); }
  const distinct = new Set(all).size, pct = distinct / all.length, pool = POOLS[id](1);
  measured[id] = `${distinct}/${all.length} = ${Math.round(pct * 100)}% (level-1 pool ${pool})`;
  ok(`${id}: no item twice in a round, across ten plays`, !dupIn);
  ok(`${id}: ten plays at level 1 meet ≥ 80% distinct items, or every item in the pool (${measured[id]})`, distinct >= Math.min(Math.ceil(0.8 * all.length), pool));
  ok(`${id}: the same seed and seen deal the same round`, LV.every((L) => JSON.stringify(deal('same', L, { mem, now: NOW })) === JSON.stringify(deal('same', L, { mem, now: NOW }))));
  ok(`${id}: the round after uses the memory (no item from the last play while the pool has more)`, (() => { const a = deal('m1', 2, { mem: EMPTYM(), now: NOW }), m2 = memRecord(EMPTYM(), a.map((key) => ({ key, ok: true })), NOW), b = deal('m2', 2, { mem: m2, now: NOW + 1 }); return POOLS[id](2) < a.length * 2 || b.every((k) => !a.includes(k)); })());
}
console.log('games: ten plays at level 1 —', Object.entries(measured).map(([k, v]) => `${k} ${v}`).join(' · '));

/* ---------- Who Said It? — the Detective ---------- */
const whoAll = LV.flatMap((L) => SEEDS.flatMap((sd) => [...whoRound(lines, WORKS, sd, L, ROUND_OF.who), ...whoRound(lines, WORKS, sd, L, ROUND_OF.who, { final: true })]));
const whoBad = whoAll.flatMap((q) => fair(q, (x) => x.right, (x) => x.text).map((e) => `${e}: ${q.text}`));
ok('Who Said It?: one right answer, distinct options, never named in the line', !whoBad.length);
if (whoBad.length) console.log(whoBad.slice(0, 5));
ok('Who Said It?: every line is held, word for word', whoAll.every((q) => held(q.workId, q.text)));
ok('Who Said It?: no answer slot over 35%', slotLean(whoAll, 4) <= 0.35);
ok('Who Said It?: no work held back is ever served', whoAll.every((q) => shipped(q.workId)));
ok('Who Said It?: a rival is never the line’s own author', whoAll.every((q) => { const a = WORKS.find((x) => x.id === q.workId).author.split(', told by')[0]; return q.right === a || !q.options.includes(a); }));
ok('Who Said It?: never one of Bee’s quotes — only held lines', whoAll.every((q) => lines.some((l) => l.text === q.text)));
const clueBad = whoAll.flatMap((q) => q.clues.filter((c) => q.options.some((o) => mentions(c.text, o))).map((c) => `${c.text} ⟵ ${q.right}`));
ok('Detective: no clue names any of the four options', !clueBad.length); if (clueBad.length) console.log(clueBad.slice(0, 5));
ok('Detective: up to three clues, most lines with all three', whoAll.every((q) => q.clues.length <= 3) && whoAll.filter((q) => q.clues.length === 3).length / whoAll.length > 0.7);
ok('Detective: the clues go kind → what it is → title (or author)', whoAll.every((q) => q.clues.map((c) => c.k).join() === ['kind', 'about', 'title', 'author'].filter((k) => q.clues.some((c) => c.k === k)).join()));
const tierOf = (L) => { const t = SEEDS.flatMap((sd) => whoRound(lines, WORKS, sd, L, 8)).map((q) => q.tier); return t.reduce((a, b) => a + b, 0) / t.length; };
ok('Who Said It?: higher levels reach harder shelves', tierOf(1) === 1 && tierOf(5) > tierOf(3) && tierOf(3) > tierOf(1));
ok('Who Said It?: inside a round the shelves climb', SEEDS.every((sd) => whoRound(lines, WORKS, sd, 3, 8).every((q, i, a) => !i || q.tier >= a[i - 1].tier)));
ok('Who Said It?: the level-1 pool holds enough fair lines for ten plays', whoLevelPool(lines, WORKS, 1).length >= 50 && whoLines(lines, WORKS).length >= 200);
/* the clue scoring, played: no clue 3, one clue 2, two clues 1, three clues 1 — and the combo on every third right */
let dq = quizNew('who', whoRound(lines, WORKS, 'det', 2, 5), 2);
ok('Detective: a clue cannot be opened past the last, nor after answering', (() => { let t = dq; for (let i = 0; i < 6; i++) t = quizStep(t, { type: 'clue' }); return t.clue === t.rounds[0].clues.length; })());
const gains = [];
for (let i = 0; i < 4; i++) { for (let c = 0; c < i; c++) dq = quizStep(dq, { type: 'clue' }); dq = quizStep(dq, { type: 'pick', i: dq.rounds[dq.i].answer }); gains.push(dq.state.gain - dq.state.combo); ok('Detective: no clue once answered', quizStep(dq, { type: 'clue' }) === dq); dq = quizStep(dq, { type: 'next' }); }
ok(`Detective: points 3 / 2 / 1 / 1 by the clues opened (${gains.join(' ')})`, gains.join() === CLUE_POINTS.join() && dq.clue === 0);
let dperf = quizNew('who', whoRound(lines, WORKS, 'perf', 3, 5), 3); while (!dperf.over) { dperf = quizStep(dperf, { type: 'pick', i: dperf.rounds[dperf.i].answer }); dperf = quizStep(dperf, { type: 'next' }); }
ok('Detective is solvable: five right with no clues scores 3 each plus the combo point', dperf.right === 5 && dperf.score === 5 * 3 + 1 && accuracy(dperf).pct === 1);

/* ---------- Figure Hunt ---------- */
for (const L of LV) for (const final of [false, true]) {
  const all = SEEDS.flatMap((sd) => figureRound(figs, WORKS, sd, L, ROUND_OF.figure, { hunts: HUNTS, final })), lns = all.filter((q) => !q.hunt), hs = all.filter((q) => q.hunt), tag = `Figure Hunt L${L}${final ? ' final' : ''}`;
  const bad = all.flatMap((q) => fair(q, (x) => FIGURE_KINDS.find(([k]) => k === x.cat)[1]));
  ok(`${tag}: the keyed answer is the figure, options distinct`, !bad.length && all.every((q) => q.kinds[q.answer] === q.cat));
  ok(`${tag}: no line slot over 35%`, !lns.length || slotLean(lns, lns[0].options.length) <= 0.35 + 1e-9);
  ok(`${tag}: rounds of ${ROUND_OF.figure}, easiest first, never a figure twice`, SEEDS.every((sd) => { const f = figureRound(figs, WORKS, sd, L, ROUND_OF.figure, { hunts: HUNTS, final }); const h = { simile: 1, alliteration: 1, metaphor: 2, personification: 3, none: 3 }; return f.length === ROUND_OF.figure && f.every((q, i) => !i || h[q.cat] >= h[f[i - 1].cat]) && new Set(f.map((q) => q.key)).size === f.length; }));
  const ML = final ? Math.min(5, L + 1) : L;
  ok(`${tag}: ${ML >= 3 ? 'half the round is a passage hunt' : 'no hunts below level 3'}`, ML >= 3 ? hs.length >= SEEDS.length * 2 : !hs.length);
  if (hs.length) {
    ok(`${tag}: hunts — the spot and the naming slots never lean past 35%`, slotLean(hs, 4, (q) => q.at) <= 0.35 && slotLean(hs, 4) <= 0.35);
  }
}
ok('Figure Hunt: level 1 offers three answers, level 3 all five', figureRound(figs, WORKS, 'x', 1)[0].options.length === 3 && figureRound(figs, WORKS, 'x', 3).find((q) => !q.hunt).options.length === 5);
const subtle = (L) => SEEDS.flatMap((sd) => figureRound(figs, WORKS, sd, L)).filter((q) => ['metaphor', 'personification', 'none'].includes(q.cat)).length;
ok('Figure Hunt: higher levels lean on the subtle figures', subtle(5) > subtle(3) && subtle(3) > subtle(1));
ok('Figure Hunt: every figure is held, word for word', figs.every((f) => held(f.work, f.text)));
/* the passage hunts: exact passages from the held text, the figure in the keyed sentence and nowhere else */
ok(`Figure Hunt: passages to hunt in (${HUNTS.length}), across at least three kinds`, HUNTS.length >= 15 && new Set(HUNTS.map((h) => h.figure)).size >= 3);
ok('Figure Hunt: every hunt passage (each window of it) is word for word from its held text', HUNTS.every((h) => h.windows.every((x) => held(h.work, x.sentences.join(' ')) && x.sentences[x.at].includes(sp(h.text)))));
ok('Figure Hunt: the figure sits in the keyed sentence, and only there', HUNTS.every((h) => h.sentences[h.at].includes(sp(h.text)) && h.sentences.every((x, i) => i === h.at || !x.includes(sp(h.text)))));
ok('Figure Hunt: the other sentences carry no simile marker and no other figure from the bank', HUNTS.every((h) => h.sentences.every((x, i) => i === h.at || (!/\blike\b|\bas if\b|\bas though\b|\bas \w+ as\b/i.test(x) && !figs.some((f) => f.figure !== 'none' && x.includes(sp(f.text)))))));
ok('Figure Hunt: three or four sentences, none of them a heading', HUNTS.every((h) => h.sentences.length >= 3 && h.sentences.length <= 4 && h.sentences.every((x) => /[a-z]/.test(x) && x.length <= 260)));
ok('Figure Hunt: no hunt of a plain line ("none")', HUNTS.every((h) => HUNT_KINDS.includes(h.figure)));
/* a hunt played: spot then name, both scored; a wrong spot holds, shows the sentence, then naming */
const huntRound = () => figureRound(figs, WORKS, 'hp', 4, ROUND_OF.figure, { hunts: HUNTS });
let fh = quizNew('figure', huntRound(), 4);
while (!fh.over) { const q = fh.rounds[fh.i]; if (q.hunt) { ok('a hunt cannot be named before it is spotted', figureStep(fh, { type: 'pick', i: q.answer }) === fh); fh = figureStep(fh, { type: 'spot', i: q.at }); } fh = figureStep(fh, { type: 'pick', i: q.answer }); fh = figureStep(fh, { type: 'next' }); }
const nh = huntRound().filter((q) => q.hunt).length;
ok(`Figure Hunt is solvable: every spot and every name right (${nh} hunts)`, nh >= 2 && fh.right === ROUND_OF.figure + nh && fh.answered === fh.right && accuracy(fh).pct === 1 && fh.results.every(Boolean));
let fw = quizNew('figure', huntRound(), 4); while (!fw.rounds[fw.i].hunt) { fw = figureStep(fw, { type: 'pick', i: fw.rounds[fw.i].answer }); fw = figureStep(fw, { type: 'next' }); }
const hq = fw.rounds[fw.i]; fw = figureStep(fw, { type: 'spot', i: (hq.at + 1) % hq.sentences.length });
ok('a wrong spot scores nothing and holds', !fw.spot.ok && !fw.found && figureStep(fw, { type: 'spot', i: hq.at }) === fw && figureStep(fw, { type: 'pick', i: hq.answer }) === fw);
fw = figureStep(fw, { type: 'next' }); ok('…next moves on to naming the figure', fw.found && fw.i === fw.rounds.indexOf(hq));
fw = figureStep(fw, { type: 'pick', i: hq.answer }); ok('…a right name after a wrong spot scores the name, and the item counts as missed', fw.state.ok && fw.results[fw.results.length - 1] === false);
let fq = quizNew('figure', figureRound(figs, WORKS, 'k', 2), 2);
fq = quizStep(fq, { type: 'pick', i: fq.rounds[0].answer }); ok('a right pick scores and waits for next', fq.score === 1 && fq.state.ok && quizStep(fq, { type: 'pick', i: 0 }) === fq);
fq = quizStep(fq, { type: 'next' }); fq = quizStep(fq, { type: 'pick', i: (fq.rounds[1].answer + 1) % fq.rounds[1].options.length });
ok('a wrong pick holds, scores nothing, and names what was missed', fq.score === 1 && !fq.state.ok && mostMissed(fq) === fq.rounds[1].cat && quizStep(fq, { type: 'pick', i: 0 }) === fq);

/* ---------- Plot Line ---------- */
ok('opening() is the first sentence', opening('Once upon a time there was a goat. It ate the hedge.') === 'Once upon a time there was a goat.');
const stories4 = plotStories(shipP, WORKS, chapters, 4);
ok(`Plot Line: at least 100 stories to order (${stories4.length}: passages and whole-book chapters)`, stories4.length >= 100);
const CARDS = new Set([4, 5, 6].flatMap((z) => plotStories(shipP, WORKS, chapters, z).flatMap((p) => p.cards.map((c) => c.text))));
const textOf = (q) => (q.id.match(/^([a-z]+)-(\d+)\.\d+$/) ? sp(chapters.find((c) => `${c.book}-${c.n}` === q.cat).scenes.join(' ')) : sp(PJ.find((p) => p.id === q.id).text));
for (const L of LV) {
  const rounds = SEEDS.flatMap((sd) => plotRound(shipP, sd, L, ROUND_OF.plot, WORKS, { chapters })), size = G.plotSize(L);
  ok(`Plot Line L${L}: every card is word for word from its story`, rounds.every((q) => q.cards.every((c) => textOf(q).includes(c.text.replace(/…$/, '')))));
  ok(`Plot Line L${L}: ${size} scenes where the story has them, distinct, never dealt in order`, rounds.every((q) => q.cards.length >= 4 && q.cards.length <= size && new Set(q.cards.map((c) => c.text)).size === q.cards.length && !q.cards.every((c, j) => c.at === j)));
  ok(`Plot Line L${L}: stories only — no essay, speech or poem`, rounds.every((q) => !['essay', 'speech', 'poetry'].includes(WORKS.find((w) => w.id === q.work).shelf)));
  const fin = SEEDS.flatMap((sd) => plotRound(shipP, sd, L, ROUND_OF.plot, WORKS, { chapters, final: true }));
  if (L >= 3) {
    ok(`Plot Line L${L} final: which scene is missing?`, fin.length && fin.every((q) => q.type === 'missing'));
    const bad = fin.flatMap((q) => fair(q, (x) => x.cards[x.gap].text));
    ok(`Plot Line L${L} final: one right scene, distinct options, the decoys from outside the story`, !bad.length && fin.every((q) => q.options.length === 4 && q.options.every((o, i) => i === q.answer || !q.cards.some((c) => c.text === o))));
    ok(`Plot Line L${L} final: no answer slot over 35%`, slotLean(fin, 4) <= 0.35);
    ok(`Plot Line L${L} final: every option a scene opening from a held story`, fin.every((q) => q.options.every((o) => CARDS.has(o))));
  } else ok(`Plot Line L${L} final: five scenes to order`, fin.every((q) => q.type === 'order' && q.cards.length >= 4 && q.cards.length <= 5) && fin.some((q) => q.cards.length === 5));
}
const pb = (L) => SEEDS.flatMap((sd) => plotRound(shipP, sd, L, 4, WORKS, { chapters })).reduce((a, q) => a + q.band + q.cards.length, 0);
ok('Plot Line: higher levels bring longer, harder stories', pb(5) > pb(3) && pb(3) > pb(1));
const solve = (g) => { let guard = 0; while (!g.over && guard++ < 100) { const q = g.rounds[g.i]; if (q.type === 'missing') g = plotStep(g, { type: 'pick', i: q.answer }); else for (let at = 0; at < q.cards.length; at++) g = plotStep(g, { type: 'place', i: q.cards.findIndex((c) => c.at === at) }); g = plotStep(g, { type: 'next' }); } return g; };
let pl = solve(plotNew(plotRound(shipP, 'solve', 5, 3, WORKS, { chapters }), 5));
ok('Plot Line is solvable: the true order scores every pair, six scenes at level 5', pl.over && pl.right === pl.total && pl.perfect === 3 && accuracy(pl).pct === 1);
let pm = solve(plotNew(plotRound(shipP, 'solve', 4, 3, WORKS, { chapters, final: true }), 4));
ok('Plot Line’s missing-scene final is solvable to a perfect score', pm.over && pm.right === 3 && pm.total === 3 && accuracy(pm).pct === 1);
/* the drag: a card dropped on a chosen slot; the slots filled in any order; a drop on a full slot sends its card back */
let pd = plotNew(plotRound(shipP, 'drag', 3, 3, WORKS, { chapters }), 3); const qd = pd.rounds[0], nD = qd.cards.length;
for (let at = nD - 1; at >= 0; at--) pd = plotStep(pd, { type: 'place', i: qd.cards.findIndex((c) => c.at === at), at });
ok('Plot Line by drag: each card dropped on its slot, last slot first, scores every pair', pd.state?.ok === true && pd.line.every((c, j) => qd.cards[c].at === j));
let pf = plotNew(plotRound(shipP, 'drag', 3, 3, WORKS, { chapters }), 3); pf = plotStep(pf, { type: 'place', i: 0, at: 2 }); pf = plotStep(pf, { type: 'place', i: 1, at: 2 });
ok('Plot Line: a card dropped on a full slot sends the other back', pf.line[2] === 1 && !pf.line.includes(0) && pf.stack.join() === '1');
let pk = plotNew(plotRound(shipP, 'keys', 1, 3, WORKS, { chapters }), 1); const q0 = pk.rounds[0];
pk = plotStep(pk, { type: 'slot', d: 1 }); pk = plotStep(pk, { type: 'slot', d: 1 }); pk = plotStep(pk, { type: 'slot', d: 1 });
ok('Plot Line by keys: ↑ ↓ move the slot cursor among the empty slots', pk.slot === 3);
for (const at of [3, 0, 1, 2]) { const want = q0.cards.findIndex((cc) => cc.at === at); if (pk.slot !== at) pk = plotStep(pk, { type: 'slot', at }); for (let k = 0; k < 10 && pk.cursor !== want; k++) pk = plotStep(pk, { type: 'move', d: 1 }); pk = plotStep(pk, { type: 'place', i: pk.cursor }); }
ok('Plot Line by keys (arrows to the card, the slot, Enter) places anywhere on the line', pk.state?.ok === true);
let pu = plotNew(plotRound(shipP, 'u', 1, 3, WORKS, { chapters }), 1); pu = plotStep(pu, { type: 'place', i: 0 }); pu = plotStep(pu, { type: 'place', i: 0 });
ok('a card is placed once; undo takes it back', pu.line.filter((x) => x != null).length === 1 && plotStep(pu, { type: 'undo' }).line.every((x) => x == null));
ok('pairs score only neighbours in the right order', plotPairs([{ at: 0 }, { at: 1 }, { at: 2 }, { at: 3 }], [1, 2, 3, 0]) === 2 && plotPairs([{ at: 0 }, { at: 1 }, { at: 2 }, { at: 3 }], [3, 2, 1, 0]) === 0);

/* ---------- Root Forge ---------- */
const P = WP.PREFIXES.map((a) => a.p), keysL = Object.keys(lex.words);
const forms = (q, o) => { const x = o.replace(/-/g, ''); return q.before ? x + q.base : q.base + x; };
const rivalIsNoWord = (q, o) => q.kind === 'root' ? !keysL.some((k) => k.startsWith(forms(q, o))) : !lex.words[forms(q, o)] && !(lex[q.kind === 'prefix' ? 'prefixNon' : 'suffixNon'][q.word] || []).every((x) => x !== o.replace(/-/g, ''));
for (const L of LV) for (const final of [false, true]) {
  const its = SEEDS.flatMap((sd) => (final ? forgeFamilyRound(lex, WP, sd, L, 2) : forgeRound(lex, WP, sd, L, ROUND_OF.root))), tag = `Root Forge L${L}${final ? ' family' : ''}`;
  const bad = its.flatMap((q) => fair(q, () => q.options[q.answer]));
  ok(`${tag}: one keyed piece, distinct pieces`, !bad.length && its.every((q) => q.options.length === 4));
  ok(`${tag}: every accepted word is in Bee's list`, its.every((q) => !!lex.words[q.word]));
  ok(`${tag}: every rival makes no word in Bee's list`, its.every((q) => q.options.every((o, i) => i === q.answer || rivalIsNoWord(q, o))));
  ok(`${tag}: no slot over 35%`, slotLean(its, 4) <= 0.35);
  ok(`${tag}: a meaning to show on success`, its.every((q) => q.def));
}
ok('Root Forge: roots join from level 4', SEEDS.every((sd) => !forgeRound(lex, WP, sd, 3).some((q) => q.kind === 'root') && forgeRound(lex, WP, sd, 4).some((q) => q.kind === 'root')));
ok('Root Forge: a root round forges an exact root word', forgePools(lex, WP).filter((x) => x.kind === 'root').every((x) => x.word === x.aff + x.base && P.includes(x.aff)));
const FAMS = forgeFamilies(lex, WP);
ok(`Root Forge: families of three or more words from one base or root (${FAMS.length})`, FAMS.length >= 6 && FAMS.every((f) => f.members.length >= 3 && f.members.every((x) => x.base === f.base)));
ok('Root Forge: a family round is two families of three different words, from one base each', SEEDS.every((sd) => { const f = forgeFamilyRound(lex, WP, sd, 2, 2); const ids = [...new Set(f.map((q) => q.family.id))]; return f.length === 6 && ids.length === 2 && ids.every((id) => { const m = f.filter((q) => q.family.id === id); return m.length === 3 && new Set(m.map((q) => q.word)).size === 3 && m.every((q, j) => q.family.step === j && q.base === m[0].base); }); }));
let rf = quizNew('root', forgeRound(lex, WP, 'play', 4), 4);
while (!rf.over) { rf = quizStep(rf, { type: 'pick', i: rf.rounds[rf.i].answer }); rf = quizStep(rf, { type: 'next' }); }
ok('Root Forge is solvable: ten right, combo points on every third', rf.right === 10 && rf.score === 13 && rf.bestCombo === 10);
let ff = quizNew('root', forgeFamilyRound(lex, WP, 'fam', 5, 2), 5);
while (!ff.over) { ff = quizStep(ff, { type: 'pick', i: ff.rounds[ff.i].answer }); ff = quizStep(ff, { type: 'next' }); }
ok('Forge a family is solvable: six words forged, a perfect score', ff.right === 6 && ff.score === 8 && accuracy(ff).pct === 1);

/* ---------- Rhetoric Duel ---------- */
ok('Rhetoric Duel: every rhetoric line has a plainer version', rhet.every((x) => plain[x.text]) && Object.keys(plain).every((t) => [...RHETORIC, ...RHETORIC_MORE].some((x) => x.text === t)));
ok('Rhetoric Duel: every original is held, word for word', [...RHETORIC, ...RHETORIC_MORE].every((x) => held(x.work, x.text)));
ok('Rhetoric Duel: no plainer version is a quotation', Object.values(plain).every((p) => !Object.values(TEXTS).some((t) => t.includes(p))));
ok('Rhetoric Duel: every device has a gloss', rhet.every((x) => DEVICE_GLOSS[x.device]));
for (const L of LV) for (const final of [false, true]) {
  const its = SEEDS.flatMap((sd) => duelRound(rhet, plain, sd, L, ROUND_OF.duel, { final })), tag = `Rhetoric Duel L${L}${final ? ' final' : ''}`;
  const bad = its.flatMap((q) => fair(q, (x) => x.device, (x) => x.original));
  ok(`${tag}: one right reason, distinct, never an "also" device`, !bad.length && its.every((q) => q.options.length === 4 && q.options.every((o, i) => i === q.answer || !(rhet.find((x) => x.text === q.original).also || []).includes(o))));
  ok(`${tag}: no reason slot over 35%`, slotLean(its, 4) <= 0.35);
  const strong = its.filter((q) => q.strong === 1).length / its.length;
  ok(`${tag}: the original sits left and right alike`, strong >= 0.4 && strong <= 0.6);
  ok(`${tag}: the original is the strong version`, its.every((q) => q.versions[q.strong] === q.original && q.versions[1 - q.strong] === plain[q.original]));
  ok(`${tag}: the right reason never stands out as the longest`, its.every((q) => q.options.some((o, i) => i !== q.answer && o.length >= q.device.length - 4)));
}
const hardD = (L) => SEEDS.flatMap((sd) => duelRound(rhet, plain, sd, L, 8)).filter((q) => q.device === 'antithesis').length;
ok('Rhetoric Duel: antithesis waits for the higher levels', hardD(1) === 0 && hardD(2) === 0 && hardD(5) > hardD(3));
/* the rival: one of Bee's, seeded, the same every time for the same duel; the child's score never depends on it */
const rv = field(2)[0], rvPts = duelRival(rv, 'seedA', 5);
ok('the duel’s rival is one of Bee’s rivals, by band, the strongest in the final', field(1).every((x) => RIVALS.includes(x)) && field(3)[4].skill >= Math.max(...field(3).slice(0, 4).map((x) => x.skill)));
ok('the rival’s points are seeded: the same duel, the same points', JSON.stringify(rvPts) === JSON.stringify(duelRival(rv, 'seedA', 5)) && rvPts.length === 5);
const duelPlay = (rival) => { let d = duelNew(duelRound(rhet, plain, 'rivals', 3, 5), 3, rival); while (!d.over) { d = duelStep(d, { type: 'pick', i: d.rounds[d.i].strong }); d = duelStep(d, { type: 'pick', i: d.rounds[d.i].answer }); d = duelStep(d, { type: 'next' }); } return d; };
const dA = duelPlay({ ...rv, pts: duelRival(rv, 'x', 5) }), dB = duelPlay({ ...field(3)[4], pts: [true, true, true, true, true] }), dC = duelPlay(null);
ok('the child’s score is the same whoever the rival is — no luck in scoring', dA.score === dB.score && dB.score === dC.score && dA.right === 5);
ok('Rhetoric Duel is solvable: five reasons right, best of five won', dA.right === 5 && duelTally(dA).you === 5 && duelTally(dA).played === 5 && duelTally(dB).them === 5);
let du = duelNew(duelRound(rhet, plain, 'd', 3, 5), 3);
ok('Rhetoric Duel: the reason cannot be picked before the stronger version', duelStep(du, { type: 'next' }) === du && duelStep(du, { type: 'pick', i: 5 }) === du);
du = duelStep(du, { type: 'pick', i: 1 - du.rounds[0].strong });
ok('Rhetoric Duel: choosing the plain one scores nothing and moves to why', du.stage === 'why' && du.score === 0 && !du.which.ok);
du = duelStep(du, { type: 'pick', i: du.rounds[0].answer });
ok('Rhetoric Duel: the right reason scores, even after a wrong pick of version', du.score === 1 && du.state.ok);
du = duelStep(du, { type: 'next' }); ok('Rhetoric Duel: next goes back to "which is stronger?"', du.stage === 'which' && du.i === 1 && du.which === null);
let dw = duelNew(duelRound(rhet, plain, 'w', 2, 5), 2); dw = duelStep(dw, { type: 'pick', i: dw.rounds[0].strong }); dw = duelStep(dw, { type: 'pick', i: (dw.rounds[0].answer + 1) % 4 });
ok('Rhetoric Duel: the right version with the wrong reason scores nothing', dw.score === 0 && dw.strongRight === 1 && mostMissed(dw) === dw.rounds[0].device);

/* ---------- the untimed reducers soak too: overlapping, out-of-range events never throw or stick ---------- */
for (const [name, g0, st] of [['who', quizNew('who', whoRound(lines, WORKS, 'z', 3), 3), quizStep], ['figure', quizNew('figure', figureRound(figs, WORKS, 'z', 4, 6, { hunts: HUNTS }), 4), figureStep],
  ['plot', plotNew(plotRound(shipP, 'z', 4, 3, WORKS, { chapters }), 4), plotStep], ['plot final', plotNew(plotRound(shipP, 'z', 4, 3, WORKS, { chapters, final: true }), 4), plotStep], ['duel', duelNew(duelRound(rhet, plain, 'z', 4), 4), duelStep], ['root', quizNew('root', forgeRound(lex, WP, 'z', 5), 5), quizStep]]) {
  let g = g0, steps = 0;
  try {
    while (!g.over && steps < 4000) { steps++; for (const a of [{ type: 'pick', i: steps % 6 - 1 }, { type: 'spot', i: steps % 5 - 1 }, { type: 'clue' }, { type: 'place', i: steps % 7 - 1, at: steps % 4 === 0 ? steps % 6 : undefined }, { type: 'move', d: steps % 3 - 1 }, { type: 'slot', d: steps % 3 - 1 }, { type: steps % 5 ? 'move' : 'undo', d: 1 }, { type: steps % 4 ? 'tick' : 'next', dt: 17 }]) g = st(g, a); }
    ok(`${name}: a soak of overlapping events ends the round cleanly`, g.over && steps < 4000 && Number.isFinite(g.score));
    ok(`${name}: nothing moves after the end`, st(g, { type: 'pick', i: 0 }) === g && st(g, { type: 'next' }) === g);
    ok(`${name}: its log has one entry per item`, roundLog(g).length === g.rounds.length && roundLog(g).every((x) => x.key && typeof x.ok === 'boolean'));
  } catch (e) { ok(`${name}: the soak threw ${e.message}`, false); }
}

/* ---------- every game is listed with a world, what it practises, how, its keys, its final and five level meanings ---------- */
ok('seven games, each with a world, practises, how, keys, a final and five level meanings', Object.keys(GAMES).length === 7 && Object.values(GAMES).every((g) => g.world && g.practises && g.how && g.keys && g.final && Object.keys(g.levels).length === MAX_LEVEL));

/* ---------- prove the checkers by breaking them: a planted unfair item must be caught ---------- */
const plant = whoAll[0], dup = { ...plant, options: plant.options.map((o, i) => (i === (plant.answer + 1) % 4 ? plant.right : o)) };
ok('the checker catches a planted second right answer', fair(dup, (x) => x.right).length > 0);
ok('the checker catches the answer planted in the line', fair({ ...plant, text: `${plant.text} said ${plant.right}` }, (x) => x.right, (x) => x.text).length > 0);
ok('the checker catches a leaning slot', slotLean(whoAll.map((q) => ({ ...q, answer: 0 })), 4) > 0.35);
ok('the clue check catches a clue that names the answer', [{ ...plant, clues: [...plant.clues, { k: 'title', text: `From the life of ${plant.right}` }] }].some((q) => q.clues.some((c) => q.options.some((o) => mentions(c.text, o)))));
ok('the plain-version check catches a planted quotation', !Object.values({ ...plain, x: RHETORIC[0].text }).every((p) => !Object.values(TEXTS).some((t) => t.includes(p))));
const h0 = HUNTS[0], brokenHunt = { ...h0, sentences: h0.sentences.map((x, i) => (i === (h0.at + 1) % h0.sentences.length ? x + ' It was like a dream.' : x)) };
ok('the hunt check catches a planted simile in a neighbouring sentence', !brokenHunt.sentences.every((x, i) => i === brokenHunt.at || !/\blike\b/i.test(x)));
done();
