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
import { missCard } from '../src/miss.js';
const { builderNew, builderStep, builderJudge, builderSentence, clauseText, roundPay, runPay, figureWords, wordsRight, figurePhase, duelPieces, duelFair, duelBuilt, builderPool, builderRoad, builderLevelPool, builderLen, rushNew, rushStep, rushRoad, rushLevelPool, whoRound, whoLines, whoLevelPool, figureRound, figureStep, figurePool, huntsFrom, FIGURE_KINDS, HUNT_KINDS,
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
console.log(`games: ${HUNTS.length} passage hunts (${HUNT_KINDS.map((k) => `${k} ${HUNTS.filter((h) => h.figure === k).length}`).join(", ")})`);

/* ---------- Clause Builder (Sentence Studio) ---------- */
ok('Clause Builder has a pool in every band', [1, 2, 3].every((b) => builderPool(b, XB).length >= 5));
let s = builderNew('t', 3); const c = s.cur;
/* the pieces of a right build, found from the right sentence itself */
const piecesFor = (cc, order) => { const want = bare(cc.right[order === 'front' ? 0 : 1]);
  const go = (rest, used) => { if (!rest) return []; for (let i = 0; i < cc.tiles.length; i++) { const t = bare(cc.tiles[i].text); if (used.includes(i) || cc.tiles[i].k === 'decoy' || !(rest === t || rest.startsWith(t + ' '))) continue; const r = go(rest.slice(t.length).trim(), [...used, i]); if (r) return [i, ...r]; } return null; };
  return go(want, []); };
/* where the comma goes in a front build: after the piece that ends the joining word's clause */
const commaAt = (cc, ps) => { const head = bare(cc.it.sub + ' ' + cc.it.dep); let acc = ''; for (let j = 0; j < ps.length; j++) { acc = (acc ? acc + ' ' : '') + bare(cc.tiles[ps[j]].text); if (acc === head) return j; } return -1; };
const bare = (x) => String(x).toLowerCase().replace(/[,.!?]/g, '').replace(/\s+/g, ' ').trim();
/* build it: the pieces, the capital if the first piece lacks it, the comma after the dependent clause when it comes first */
const build = (g, order, o = {}) => { const cc = g.cur, ps = piecesFor(cc, order); for (const i of ps) g = builderStep(g, { type: 'pick', i });
  if (order === 'front' && !o.noComma) g = builderStep(g, { type: 'comma', at: commaAt(cc, ps) });
  if (!o.noCap && cc.right[order === 'front' ? 0 : 1].charAt(0) !== clauseText(cc, g.picks, g.commas, false).charAt(0)) g = builderStep(g, { type: 'cap' });
  return builderStep(g, { type: 'check' }); };
ok('front order, with its capital and comma, is the sentence', builderJudge(c, piecesFor(c, 'front'), [commaAt(c, piecesFor(c, 'front'))], true) === 'front');
ok('end order, with its capital, is the sentence', builderJudge(c, piecesFor(c, 'end'), [], c.right[1].charAt(0) !== c.tiles[piecesFor(c, 'end')[0]].text.charAt(0)) === 'end');
ok('the right orders rebuild the book’s sentence exactly', clauseText(c, piecesFor(c, 'front'), [commaAt(c, piecesFor(c, 'front'))], true) === builderSentence(c, 'front'));
/* C §4.1: phrase tiles (each clause in 1–3), one decoy, 5–9 in all; lower-case — the main clause's capital gave the answer away in 412 of 445 */
const allCur = LV.flatMap((L) => SEEDS.slice(0, 20).map((sd) => builderNew(sd, L, { extra: XB }).cur)).filter(Boolean);
ok('Clause Builder: the joining word, one decoy, the clauses in phrase pieces — 5 to 9 tiles', allCur.every((cc) => cc.tiles.filter((t) => t.k === 'decoy').length === 1 && cc.tiles.filter((t) => t.k === 'sub').length === 1 && cc.tiles.length >= 5 && cc.tiles.length <= 9 && cc.tiles.filter((t) => t.k === 'dep').length >= 1 && cc.tiles.filter((t) => t.k === 'main').length >= 1));
ok('Clause Builder: no tile carries a capital the child should add — a capital on a tile is the book’s own (I, a name), kept mid-sentence too', allCur.every((cc) => cc.tiles.every((t) => !/^[A-Z]/.test(t.text) || [0, 1].some((j) => cc.right[j].indexOf(t.text, 1) > 0))));
ok('Clause Builder: the decoy can never join a clause — no subordinator, so the book’s sentence is the one right answer', allCur.every((cc) => !/^(when|because|if|although|after|before|while|until|since|as|unless|once|whenever|though)$/.test(cc.tiles.find((t) => t.k === 'decoy').text)));
ok('Clause Builder: tiles are never dealt already built', allCur.every((cc) => cc.tiles.filter((t) => t.k !== 'decoy').map((t) => t.text).join(' ') !== bare(cc.right[0]) && bare(cc.tiles.filter((t) => t.k !== 'decoy').map((t) => t.text).join(' ')) !== bare(cc.right[1])));
ok('Clause Builder: every dealt item can be built both ways', allCur.every((cc) => piecesFor(cc, 'front') && piecesFor(cc, 'end')));
s = build(s, 'front');
ok('a built sentence scores 2', s.score === 2 && s.built === 1 && !s.hold);
s = build(s, 'end');
ok('building the other way round earns the variety bonus (score, never coins)', s.score === 5 && s.variety === 1 && roundPay(s) === 2);
{ const c3 = s.cur; let w = build(s, 'front', { noComma: true });
  ok('a missing comma is a miss: it holds the item, scores nothing, names the comma', w.hold && w.score === 5 && w.wrong === 1 && w.cur === c3 && w.combo === 0 && w.misses.clause === 1 && w.hold.why.k === 'comma');
  ok('T3: a held miss takes no tap and no tick until Continue', builderStep(w, { type: 'pick', i: 0 }) === w && builderStep(w, { type: 'tick', dt: 5000 }) === w && builderStep(w, { type: 'check' }) === w);
  ok('T3: the hold carries the right sentence(s) — both orders — and what was built', w.hold.right.length === 2 && w.hold.right.includes(builderSentence(c3, 'front')) && typeof w.hold.given === 'string');
  w = builderStep(w, { type: 'continue' }); ok('T3: Continue clears the board and moves on (one try an item)', !w.hold && w.picks.length === 0 && w.cur !== c3 && w.n === s.n + 1);
  let x = build(s, 'end', { noCap: true }); if (x.hold) ok('a missing capital is a miss, named as the capital', x.hold.why.k === 'capital');
  let y = s; const dec = y.cur.tiles.findIndex((t) => t.k === 'decoy'); for (const i of [dec, ...piecesFor(y.cur, 'end').slice(1)]) y = builderStep(y, { type: 'pick', i }); y = builderStep(y, { type: 'check' });
  ok('the decoy used is a miss, and the miss says why it cannot join', y.hold && y.hold.why.k === 'decoy' && /needs a noun/.test(y.hold.why.text)); }
ok('a tile cannot be picked twice', builderStep({ ...s, picks: [0] }, { type: 'pick', i: 0 }).picks.length === 1);
let sameTwice = builderNew('u', 3); sameTwice = build(build(sameTwice, 'front'), 'front');
ok('the same order twice earns no bonus', sameTwice.score === 4 && sameTwice.variety === 0);
let cb = builderNew('cb', 1); for (let k = 0; k < 3; k++) cb = build(cb, 'front');
ok('three right in a row: the third earns the combo point', cb.combo === 3 && cb.score === 7 && cb.flash.combo === 1);
/* rush hour: a sentence built inside 8 s earns +1; a slow one earns none; time never takes a point away */
let rh = builderNew('rh', 3, { final: true }); rh = builderStep(rh, { type: 'tick', dt: 3000 }); rh = build(rh, 'front');
ok('rush hour: built inside 8 s is +1', rh.score === 3 && rh.speed === 1 && rh.flash.fast === 1);
rh = builderStep(rh, { type: 'tick', dt: 9000 }); rh = build(rh, 'end');
ok('rush hour: a slow one keeps its points, with no time bonus', rh.score === 3 + 3 && rh.speed === 1);
const wl = builderLen;
ok('Clause Builder: level 1 is first-band only', builderRoad(1, { extra: XB }).every((x) => x.band === 1));
ok('Clause Builder: inside a round the first twenty sentences grow', SEEDS.slice(0, 10).every((sd) => LV.every((L) => { const r = builderRoad(L, { seed: sd, extra: XB }).slice(0, 20); return r.every((x, i) => !i || wl(x) >= wl(r[i - 1])); })));
const avgW = (L, f) => { const p = builderLevelPool(L, XB, f); return p.reduce((a, x) => a + wl(x), 0) / p.length; };
ok('Clause Builder: each level reaches longer sentences, and the final is longer still', LV.slice(1).every((L) => avgW(L) >= avgW(L - 1)) && avgW(5) > avgW(1) && LV.every((L) => avgW(L, true) >= avgW(L)));

/* ---------- Comma Rush (Sentence Studio) ---------- */
let r = rushNew('t', 3); const w = r.cur;
for (const i of w.commas) r = rushStep(r, { type: 'toggle', i });
r = rushStep(r, { type: 'submit' });
ok('all the right commas: points plus a clean bonus, and on to the next', r.score === w.commas.length + 1 && r.clean === 1 && !r.hold && r.cur !== w);
let r2 = rushNew('t', 3); r2 = rushStep(r2, { type: 'move', d: 1 }); r2 = rushStep(r2, { type: 'toggle', i: r2.cursor });
ok('the keyboard way toggles the gap under the cursor', r2.sel.length === 1 && r2.sel[0] === r2.cursor);
let r3 = rushNew('t', 3); const w3 = r3.cur, wr = [...Array(r3.cur.words.length - 1).keys()].find((i) => !r3.cur.commas.includes(i));
if (wr != null) { r3 = rushStep(r3, { type: 'toggle', i: wr }); r3 = rushStep(r3, { type: 'submit' }); ok('a wrong comma costs, never below zero', r3.score === 0 && r3.misses[r3.flash.rule] === 1);
  ok('T3 Comma Rush: a wrong sentence holds — the item stays, with the commas chosen kept for the miss card', r3.hold && r3.cur === w3 && r3.hold.sel.join() === String(wr) && rushStep(r3, { type: 'toggle', i: 0 }) === r3 && rushStep(r3, { type: 'tick', dt: 4000 }) === r3 && rushStep(r3, { type: 'submit' }) === r3);
  const m = missCard({ type: 'commas', words: w3.words, commas: w3.commas, rule: w3.rule }, r3.hold?.sel || []);
  ok('T3 the miss card: the missed commas inserted in green, the extra one struck out, in the sentence itself', (m.match(/class="miss-fix"/g) || []).length === w3.commas.length && (m.match(/class="miss-del"/g) || []).length === 1 && /data-act="miss-go"/.test(m) && w3.words.every((x) => m.includes(x.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'))));
  const r4 = rushStep(r3, { type: 'continue' }); ok('T3: Continue moves on to a fresh sentence', !r4.hold && r4.cur !== w3 && r4.sel.length === 0); }
{ let rr = rushNew('rp', 3); const cur = rr.cur; for (const i of cur.commas) rr = rushStep(rr, { type: 'toggle', i }); const extra = [...Array(cur.words.length - 1).keys()].find((i) => !cur.commas.includes(i)); rr = rushStep(rr, { type: 'toggle', i: extra }); rr = rushStep(rr, { type: 'submit' });
  ok('pay: right commas beside a wrong one earn no coin — only a clean sentence does', rr.right === cur.commas.length && rr.clean === 0 && roundPay(rr) === 0); }
let rf2 = rushNew('rf', 3, { final: true }); rf2 = rushStep(rf2, { type: 'tick', dt: 4000 }); const wf = rf2.cur; for (const i of wf.commas) rf2 = rushStep(rf2, { type: 'toggle', i }); rf2 = rushStep(rf2, { type: 'submit' });
ok('rush hour: a clean sentence inside 10 s is +1', rf2.score === wf.commas.length + 2 && rf2.speed === 1);
ok('Comma Rush: level 1 is one comma a sentence', rushRoad(1, { extra: XR }).every((x) => x.commas.length === 1));
const avgC = (L, f) => { const p = rushLevelPool(L, XR, f); return p.reduce((a, x) => a + x.commas.length, 0) / p.length; };
ok('Comma Rush: each level brings more commas, the final the most', LV.slice(1).every((L) => avgC(L) >= avgC(L - 1)) && avgC(5) > 1.5 && LV.every((L) => avgC(L, true) >= avgC(L)));
ok('Comma Rush: every comma sits between two words', rushLevelPool(5, XR).every((x) => x.commas.every((j) => j >= 0 && j < x.words.length - 1)));

/* soak: 60 s of ticks with taps interleaved and out of range, holds and Continue, normal and final */
for (const [mk, st] of [[builderNew, builderStep], [rushNew, rushStep]]) {
  for (const [L, final] of [[1, false], [5, false], [3, true]]) {
    let g = mk('soak', L, { final }), steps = 0;
    try {
      while (!g.over && steps < 20000) {
        g = st(g, { type: 'tick', dt: 17 }); steps++;
        g = st(g, { type: steps % 3 ? 'pick' : 'toggle', i: steps % 5 - 1 }); g = st(g, { type: ['undo', 'submit', 'check', 'comma', 'cap', 'continue'][steps % 6], at: steps % 4 - 1 }); g = st(g, { type: 'move', d: (steps % 3) - 1 });
      }
      ok(`${g.kind} L${L}${final ? ' final' : ''}: a 60 s soak ends cleanly`, g.over && g.t === ROUND_MS && Number.isFinite(g.score) && g.score >= 0);
      ok(`${g.kind} L${L}${final ? ' final' : ''}: nothing moves after the end`, st(g, { type: 'pick', i: 0 }) === g && st(g, { type: 'tick', dt: 999 }) === g);
      ok(`${g.kind}: the round's log names what was met`, roundLog(g).length >= 1 && roundLog(g).every((x) => x.key));
    } catch (e) { ok(`${mk.name}: the soak threw ${e.message}`, false); }
  }
}

/* ---------- levels, runs, stars — the owner's rule (C §1.4, T13) and the star line (C §1.3) ---------- */
ok('T13: a level rises at 80%', nextLevel(2, 0.8) === 3 && nextLevel(1, 1) === 2);
ok('T13: a level holds from 50% to 79%', nextLevel(3, 0.79) === 3 && nextLevel(3, 0.5) === 3 && nextLevel(3, 0.65) === 3);
ok('T13: a level falls one step under 50%', nextLevel(3, 0.49) === 2 && nextLevel(4, 0) === 3 && nextLevel(5, 0.4) === 4);
ok('T13: never below 1, never above the top', nextLevel(1, 0) === 1 && nextLevel(MAX_LEVEL, 1) === MAX_LEVEL);
ok('T13: a run with no attempts moves nothing', nextLevel(3, null) === 3);
ok('stars: none under 50%, 1 from 50%, 2 at 70%, 3 at 90%', starsFor(0) === 0 && starsFor(0.49) === 0 && starsFor(0.5) === 1 && starsFor(0.69) === 1 && starsFor(0.7) === 2 && starsFor(0.89) === 2 && starsFor(0.9) === 3 && starsFor(null) === 0);
let run = runNew(2); for (let i = 0; i < RUN_ROUNDS; i++) { ok(`round ${i + 1} is not the final`, !isFinal(run)); run = runAdd(run, { kind: 'who', score: 3, right: 1, answered: 2, rounds: [], results: [true, false], misses: { a: 1 }, bestCombo: 1 }, 2); }
ok('after three rounds comes the final', isFinal(run));
run = runAdd(run, { kind: 'who', score: 5, right: 2, answered: 2, rounds: [], results: [true, true], misses: { b: 2 }, bestCombo: 2 }, 1);
ok('a run adds its rounds: score, accuracy, misses, new items, coins banked', runScore(run) === 14 && runPct(run) === 5 / 8 && run.misses.a === 3 && run.misses.b === 2 && run.met === 7 && run.bestCombo === 2 && mostMissed(run) === 'a' && run.banked === 0 + 0 + 0 + 2);
ok('pay: the finish pays what was banked when the run is half right or better — beyond chance, where a guess is right one time in four', run.kind === 'who' && G.fairPct('who', 5 / 8) === 0.5 && runPay(run) === 2 && runPay({ ...run, right: 4 }) === 0 && runPay({ ...run, kind: 'rush', right: 4 }) === 2);
ok('beyond chance: a guess-level score is 0, a perfect one 100%, and games with no lucky guess are unchanged', G.fairPct('root', 0.25) === 0 && G.fairPct('root', 1) === 1 && G.fairPct('figure', 0.4) === 0.4 && G.fairPct('builder', 0.6) === 0.6);
/* the chip (src/hubs.js): a hand-set level sticks until the run's check, which moves the level from the level PLAYED */
{ const H = await import('../src/hubs.js'), rec = { level: 2, pick: null, top: 2 };
  ok('T13 chip: Auto plays the game’s own level', H.playLevel(rec) === 2);
  H.setPick(rec, 4); ok('T13 chip: a hand-set level is played next', H.playLevel(rec) === 4 && rec.pick === 4);
  const copy = JSON.parse(JSON.stringify(rec)); ok('T13 chip: the hand-set level is plain data — it survives a save and a load', H.playLevel(copy) === 4);
  let x = H.settleLevel(rec, 4, null); ok('T13 chip: a run with nothing tried checks nothing — the hand-set level still sticks', !x.checked && rec.pick === 4 && H.playLevel(rec) === 4);
  x = H.settleLevel(rec, 4, 0.3); ok('T13 chip: the check moves the level from the level played (4, 30% → 3), says it kindly, and the chip goes back to Auto', x.drop && x.after === 3 && rec.level === 3 && rec.pick === null && H.playLevel(rec) === 3 && /warm up on Level 3/.test(x.line) && /move back up any time/.test(x.line));
  x = H.settleLevel(rec, 3, 0.6); ok('T13 chip: 60% holds', !x.drop && !x.up && rec.level === 3);
  x = H.settleLevel(rec, 3, 0.85); ok('T13 chip: 85% moves up', x.up && rec.level === 4 && x.firstUp);
  H.setPick(rec, 1); x = H.settleLevel(rec, 1, 1); ok('T13 chip: a level-up below the highest reached is no first — choosing Level 1 again cannot farm the level-up coins', x.up && !x.firstUp && rec.level === 2);
  H.setPick(rec, 'auto'); ok('T13 chip: Auto clears the hand-set level', rec.pick === null);
  ok('T13 chip: a level out of range is held to 1–5', H.playLevel(H.setPick({ level: 9 }, 7)) === 5 && H.playLevel({ level: 0 }) === 1);
  /* the Store seam: v4 gives every game record its pick; nothing else moves */
  const { migrate, VERSION } = await import('../src/store.js');
  const m = migrate({ v: 3, parent: {}, kids: [{ id: 'a', place: null, games: { rush: { level: 3, best: 9 }, vocab: { x: 1 }, figure: { level: 7 } } }] });
  ok('store v3 → v4: every game record gains pick (Auto), its level held to 1–5, the Tools’ records untouched', VERSION >= 4 && m.v === VERSION && m.kids[0].games.rush.pick === null && m.kids[0].games.rush.level === 3 && m.kids[0].games.rush.best === 9 && m.kids[0].games.figure.level === 5 && !('pick' in m.kids[0].games.vocab));
  /* T16: one in, one out */
  ok(`T16: the Play tab never grows — ${H.CARDS.length} cards, at most ${H.CARD_LIMIT}, fewer than the ${H.BEFORE.length} before`, H.CARDS.length <= H.CARD_LIMIT && H.CARD_LIMIT <= H.BEFORE.length - 2);
  ok('T16: every card that came in names the cards it replaced, and they are gone from the tab', H.CARDS.filter((c) => !H.BEFORE.includes(c)).every((c) => { const e = H.LEDGER.find((l) => l.in === c); return e && e.out.length && e.out.every((o) => H.BEFORE.includes(o) && !H.CARDS.includes(o)); }));
  ok('T16: every game before is still reachable — on the tab or as a hub mode', H.BEFORE.every((g) => H.CARDS.includes(g) || Object.values(H.HUBS).some((h) => h.modes.includes(g))));
  ok('the hubs are named behind one constant (C §3.3)', H.HUBS.studio.name === H.NAMES.studio && H.HUBS.craft.name === H.NAMES.craft && H.NAMES.studio === 'Sentence Studio' && H.NAMES.craft === 'Writer’s Craft');
  ok('every hub mode knows its hub', Object.values(H.HUBS).every((h) => h.modes.every((m) => H.hubOf(m) === h.id && GAMES[m].hub === h.id)));
}


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
/* Challenge mode (modes.js): one per game, a printed price through the wallet, never below zero */
{ const M = await import('../src/modes.js');
  ok('modes: one Challenge for every game, named as the game is', Object.keys(M.MODE_GAMES).sort().join() === Object.keys(G.GAMES).sort().join() && Object.entries(M.MODE_GAMES).every(([g, n]) => G.GAMES[g].name === n));
  ok('modes: a round printed price', Number.isInteger(M.MODE_PRICE) && M.MODE_PRICE > 0 && M.MODE_PRICE % 10 === 0);
  const kx = {}, spent = []; const pay = (n, why) => { spent.push([n, why]); return true; };
  ok('modes: buying spends the printed price once and owns it', M.buyMode(kx, 'rush', pay) && M.ownsMode(kx, 'rush') && spent.length === 1 && spent[0][0] === M.MODE_PRICE && !M.buyMode(kx, 'rush', pay) && spent.length === 1);
  ok('modes: a wallet that says no buys nothing', !M.buyMode(kx, 'duel', () => false) && !M.ownsMode(kx, 'duel'));
  ok('modes: no mode for a game that does not exist', !M.buyMode(kx, 'nope', pay));
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
  ok(`${tag}: hunts from level 1 — half the round is a passage hunt, of the kinds the level offers`, hs.length >= SEEDS.length * 2 && hs.every((q) => G.FIGURE_LEVELS[ML][q.cat]));
  if (hs.length) {
    ok(`${tag}: hunts — the spot and the naming slots never lean past 35%`, slotLean(hs, 4, (q) => q.at) <= 0.35 && slotLean(hs, 4) <= 0.35);
  }
}
ok('Figure Hunt: level 1 offers three answers, level 3 all five', figureRound(figs, WORKS, 'x', 1)[0].options.length === 3 && figureRound(figs, WORKS, 'x', 3).find((q) => !q.hunt).options.length === 5);
const subtle = (L) => SEEDS.flatMap((sd) => figureRound(figs, WORKS, sd, L)).filter((q) => ['metaphor', 'personification', 'none'].includes(q.cat)).length;
ok('Figure Hunt: higher levels lean on the subtle figures', subtle(5) > subtle(3) && subtle(3) > subtle(1));
ok('Figure Hunt: every figure is held, word for word', figs.every((f) => held(f.work, f.text)));
/* the passage hunts: exact passages from the held text, the figure in the keyed sentence and nowhere else */
ok(`Figure Hunt: passages to hunt in (${HUNTS.length}), across at least three kinds`, HUNTS.length >= (FIGURES_MORE.length ? 100 : 15) && new Set(HUNTS.map((h) => h.figure)).size >= 3);
ok('Figure Hunt: every hunt passage (each window of it) is word for word from its held text', HUNTS.every((h) => h.windows.every((x) => held(h.work, x.sentences.join(' ')) && x.sentences[x.at].includes(sp(h.text)))));
ok('Figure Hunt: the figure sits in the keyed sentence, and only there', HUNTS.every((h) => h.sentences[h.at].includes(sp(h.text)) && h.sentences.every((x, i) => i === h.at || !x.includes(sp(h.text)))));
ok('Figure Hunt: the other sentences carry no simile marker and no other figure from the bank', HUNTS.every((h) => h.sentences.every((x, i) => i === h.at || (!/\blike\b|\bas if\b|\bas though\b|\bas \w+ as\b/i.test(x) && !figs.some((f) => f.figure !== 'none' && x.includes(sp(f.text)))))));
ok('Figure Hunt: three or four sentences, none of them a heading', HUNTS.every((h) => h.sentences.length >= 3 && h.sentences.length <= 4 && h.sentences.every((x) => /[a-z]/.test(x) && x.length <= 260)));
ok('Figure Hunt: no hunt of a plain line ("none")', HUNTS.every((h) => HUNT_KINDS.includes(h.figure)));
/* the words that make it (computed from the line, never typed): a simile's comparison word, alliteration's shared sound */
const SIM = figs.filter((f) => f.figure === 'simile').map((f) => ({ f, w: figureWords(f.text, 'simile') })), ALL = figs.filter((f) => f.figure === 'alliteration').map((f) => ({ f, w: figureWords(f.text, 'alliteration') }));
ok(`Figure Hunt words: nearly every simile has its comparison word to tap (${SIM.filter((x) => x.w.want).length}/${SIM.length})`, SIM.filter((x) => x.w.want).length >= 0.95 * SIM.length);
ok('Figure Hunt words: a simile’s words are its comparison words, and the comparison inside what may be tapped', SIM.filter((x) => x.w.want).every(({ w }) => w.want.every((i) => /^(like|as|if|though)$/.test(w.tokens[i].toLowerCase().replace(/[^a-z]/g, ''))) && w.want.every((i) => w.allow.includes(i)) && w.marks.every((m) => m.every((i) => w.want.includes(i)))));
ok(`Figure Hunt words: most alliteration has three or more words sharing one sound, and only one such run (${ALL.filter((x) => x.w.want).length}/${ALL.length})`, ALL.filter((x) => x.w.want).length >= 0.8 * ALL.length && ALL.filter((x) => x.w.want).every(({ w }) => w.want.length >= 3 && new Set(w.want.map((i) => G.soundOf(w.tokens[i].toLowerCase().replace(/[^a-z']/g, '')))).size === 1));
ok('Figure Hunt words: the tokens are the line, word for word', [...SIM, ...ALL].every(({ f, w }) => w.tokens.join(' ') === sp(f.text)));
ok('Figure Hunt words: the right words are right; tapping every word is not (unless the whole line is the figure)', [...SIM, ...ALL].filter((x) => x.w.want).every(({ w }) => wordsRight(w, w.marks ? w.marks[0] : w.want.slice(0, 2)) && (w.allow.length === w.tokens.length || !wordsRight(w, w.tokens.map((_, i) => i)))));
ok(`Figure Hunt words: a line that is all figure is rare (${[...SIM, ...ALL].filter((x) => x.w.want && x.w.allow.length === x.w.tokens.length).length})`, [...SIM, ...ALL].filter((x) => x.w.want && x.w.allow.length === x.w.tokens.length).length <= 0.15 * (SIM.length + ALL.length));
ok('Figure Hunt words: metaphor and personification are named only (no one has marked their words)', figs.filter((f) => f.figure === 'metaphor' || f.figure === 'personification').every((f) => !figureWords(f.text, f.figure).want));
/* a hunt played: spot, then the words, then the name — each scored; an item is right only when every step was */
const solveFig = (g) => { let guard = 0; while (!g.over && guard++ < 300) { const q = g.rounds[g.i], ph = figurePhase(g, q);
  if (g.state) { g = figureStep(g, { type: 'next' }); continue; }
  if (ph === 'spot') g = figureStep(g, { type: 'spot', i: q.at });
  else if (ph === 'words') { for (const i of q.marks ? q.marks[0] : q.want.slice(0, 2)) g = figureStep(g, { type: 'tap', i }); g = figureStep(g, { type: 'words' }); }
  else g = figureStep(g, { type: 'pick', i: q.answer }); } return g; };
const huntRound = () => figureRound(figs, WORKS, 'hp', 1, ROUND_OF.figure, { hunts: HUNTS });
{ const g0 = quizNew('figure', huntRound(), 1), h0 = g0.rounds.findIndex((q) => q.hunt), w0 = g0.rounds.findIndex((q) => q.want && !q.hunt);
  ok('a step cannot be skipped: no name before the spot', h0 >= 0 && figureStep({ ...g0, i: h0 }, { type: 'pick', i: g0.rounds[h0].answer }).state == null);
  ok('a step cannot be skipped: no name before the words', w0 < 0 || figureStep({ ...g0, i: w0 }, { type: 'pick', i: g0.rounds[w0].answer }).state == null); }
const fh = solveFig(quizNew('figure', huntRound(), 1)), nh = huntRound().filter((q) => q.hunt).length, nw = huntRound().filter((q) => q.want).length;
ok(`Figure Hunt is solvable at level 1: every spot, every word and every name right (${nh} hunts, ${nw} with words)`, nh >= 2 && nw >= 2 && fh.over && accuracy(fh).pct === 1 && fh.results.length === ROUND_OF.figure && fh.results.every(Boolean));
let fw = quizNew('figure', huntRound(), 1); { let guard = 0; while (!fw.rounds[fw.i].hunt && guard++ < 10) { const q = fw.rounds[fw.i]; if (figurePhase(fw, q) === 'words') { for (const i of q.marks ? q.marks[0] : q.want.slice(0, 2)) fw = figureStep(fw, { type: 'tap', i }); fw = figureStep(fw, { type: 'words' }); } fw = figureStep(fw, { type: 'pick', i: q.answer }); fw = figureStep(fw, { type: 'next' }); } }
const hq = fw.rounds[fw.i]; fw = figureStep(fw, { type: 'spot', i: (hq.at + 1) % hq.sentences.length });
ok('T3: a wrong spot scores nothing and holds', !fw.spot.ok && !fw.found && figureStep(fw, { type: 'spot', i: hq.at }) === fw && figureStep(fw, { type: 'pick', i: hq.answer }) === fw);
fw = figureStep(fw, { type: 'next' }); ok('…next moves on to the next step of the same item', fw.found && fw.i === fw.rounds.indexOf(hq) && figurePhase(fw) === (hq.want ? 'words' : 'name'));
if (hq.want) { const off = hq.tokens.map((_, i) => i).find((i) => !hq.allow.includes(i)); fw = figureStep(fw, { type: 'tap', i: off ?? 0 }); fw = figureStep(fw, { type: 'words' });
  ok('T3: a wrong tap of words holds — the words that make it shown in place — until next', fw.wres && !fw.wres.ok && figureStep(fw, { type: 'pick', i: hq.answer }) === fw && /class="miss-w miss-fix"/.test(missCard({ type: 'words', tokens: hq.tokens, want: hq.want }, fw.wres.sel)));
  fw = figureStep(fw, { type: 'next' }); ok('…next moves on to naming it', figurePhase(fw) === 'name'); }
fw = figureStep(fw, { type: 'pick', i: hq.answer }); ok('…a right name after a missed step scores the name, and the item counts as missed', fw.state.ok && fw.results[fw.results.length - 1] === false && !fw.state.whole);
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

/* ---------- Rhetoric Duel (Writer's Craft): "make it strong" ---------- */
ok('Rhetoric Duel: every rhetoric line has a plainer version', rhet.every((x) => plain[x.text]) && Object.keys(plain).every((t) => [...RHETORIC, ...RHETORIC_MORE].some((x) => x.text === t)));
ok('Rhetoric Duel: every original is held, word for word', [...RHETORIC, ...RHETORIC_MORE].every((x) => held(x.work, x.text)));
ok('Rhetoric Duel: no plainer version is a quotation', Object.values(plain).every((p) => !Object.values(TEXTS).some((t) => t.includes(p))));
ok('Rhetoric Duel: every device has a gloss', rhet.every((x) => DEVICE_GLOSS[x.device]));
const PIECES = rhet.map((x) => ({ x, d: duelPieces(x.text, plain[x.text], 'p') }));
ok(`Rhetoric Duel: every line can be built — three of its own pieces, joined with spaces, ARE the original (${PIECES.filter((p) => p.d).length}/${rhet.length})`, PIECES.every(({ x, d }) => d && d.pieces.length === 3 && d.pieces.join(' ') === x.text));
ok('Rhetoric Duel: the decoy is the plain version’s wording — never a piece, and never in the original', PIECES.every(({ x, d }) => !d.pieces.includes(d.decoy) && !` ${x.text} `.includes(` ${d.decoy.replace(/,$/, '')} `) && d.decoy.replace(/,$/, '').split(' ').some((w) => plain[x.text].toLowerCase().includes(w.toLowerCase().replace(/[^a-z']/g, '')))));
console.log(`games: Rhetoric Duel — stage one is fair (equal length ±10%, a question only with a question) for ${rhet.filter((x) => duelFair(x.text, plain[x.text])).length} of ${rhet.length} lines; the rest go straight to the build`);
for (const L of LV) for (const final of [false, true]) {
  const its = SEEDS.flatMap((sd) => duelRound(rhet, plain, sd, L, ROUND_OF.duel, { final })), tag = `Rhetoric Duel L${L}${final ? ' final' : ''}`;
  ok(`${tag}: stage one is asked only where it is fair — the plain line within 10% of the original’s length, a question only beside a question`, its.every((q) => q.scored === duelFair(q.original, q.plain)) && its.filter((q) => q.scored).every((q) => Math.abs(q.plain.length - q.original.length) <= q.original.length * 0.1 && /\?\s*$/.test(q.original) === /\?\s*$/.test(q.plain)));
  const strong = its.filter((q) => q.strong === 1).length / its.length;
  ok(`${tag}: the original sits left and right alike`, strong >= 0.4 && strong <= 0.6);
  ok(`${tag}: the original is the strong version`, its.every((q) => q.versions[q.strong] === q.original && q.versions[1 - q.strong] === plain[q.original]));
  ok(`${tag}: four tiles — three pieces of the line and one plain decoy — never dealt in order`, its.every((q) => q.tiles.length === 4 && q.tiles.filter((t) => t.k === 'x').length === 1 && !q.tiles.filter((t) => t.k === 'd').every((t, j) => t.at === j)));
}
const hardD = (L) => SEEDS.flatMap((sd) => duelRound(rhet, plain, sd, L, 8)).filter((q) => q.device === 'antithesis').length;
ok('Rhetoric Duel: antithesis waits for the higher levels', hardD(1) === 0 && hardD(2) === 0 && hardD(5) > hardD(3));
/* the rival: one of Bee's, seeded, the same every time for the same duel; the child's score never depends on it */
const rv = field(2)[0], rvPts = duelRival(rv, 'seedA', 5);
ok('the duel’s rival is one of Bee’s rivals, by band, the strongest in the final', field(1).every((x) => RIVALS.includes(x)) && field(3)[4].skill >= Math.max(...field(3).slice(0, 4).map((x) => x.skill)));
ok('the rival’s points are seeded: the same duel, the same points', JSON.stringify(rvPts) === JSON.stringify(duelRival(rv, 'seedA', 5)) && rvPts.length === 5);
const inOrder = (q) => q.tiles.map((t, i) => [t, i]).filter(([t]) => t.k === 'd').sort((a, b) => a[0].at - b[0].at).map(([, i]) => i);
const duelSolve = (d) => { let guard = 0; while (!d.over && guard++ < 100) { const q = d.rounds[d.i]; if (d.state) { d = duelStep(d, { type: 'next' }); continue; } if (d.stage === 'which') { d = duelStep(d, { type: 'pick', i: q.strong }); continue; } for (const i of inOrder(q)) d = duelStep(d, { type: 'tile', i }); d = duelStep(d, { type: 'check' }); } return d; };
const duelPlay = (rival) => duelSolve(duelNew(duelRound(rhet, plain, 'rivals', 3, 5), 3, rival));
const dA = duelPlay({ ...rv, pts: duelRival(rv, 'x', 5) }), dB = duelPlay({ ...field(3)[4], pts: [true, true, true, true, true] }), dC = duelPlay(null);
ok('the child’s score is the same whoever the rival is — no luck in scoring', dA.score === dB.score && dB.score === dC.score && dA.right === 5);
ok('Rhetoric Duel is solvable: five lines made strong, best of five won', dA.right === 5 && duelTally(dA).you === 5 && duelTally(dA).played === 5 && duelTally(dB).them === 5 && accuracy(dA).pct === 1);
{ const rounds = duelRound(rhet, plain, 'd', 3, 5), k = rounds.findIndex((q) => q.scored);
  if (k >= 0) { let du = duelNew(rounds.slice(k), 3);
    ok('Rhetoric Duel: nothing can be built before the stronger line is picked, where that is asked', du.stage === 'which' && duelStep(du, { type: 'tile', i: 0 }) === du && duelStep(du, { type: 'check' }) === du);
    du = duelStep(du, { type: 'pick', i: 1 - du.rounds[0].strong });
    ok('Rhetoric Duel: picking the plain line scores nothing and moves on to the build', du.stage === 'build' && du.score === 0 && !du.which.ok);
    for (const i of inOrder(du.rounds[0])) du = duelStep(du, { type: 'tile', i }); du = duelStep(du, { type: 'check' });
    ok('Rhetoric Duel: the build scores, but the item is right only with the pick right too', du.score === 1 && du.state.buildOk && !du.state.ok && du.results[0] === false && du.misses[du.rounds[0].device] === 1); }
  let dw = duelNew(rounds, 3); if (dw.stage === 'which') dw = duelStep(dw, { type: 'pick', i: dw.rounds[0].strong });
  const q0 = dw.rounds[0], dec = q0.tiles.findIndex((t) => t.k === 'x'); for (const i of [dec, ...inOrder(q0).slice(1)]) dw = duelStep(dw, { type: 'tile', i }); dw = duelStep(dw, { type: 'check' });
  ok('Rhetoric Duel: a build with the plain decoy is not the line', dw.state && !dw.state.buildOk && !dw.state.ok && duelBuilt(q0, dw.state.picks) !== q0.original);
  ok('T3 Rhetoric Duel: a wrong build holds — no tile, no check, until next', duelStep(dw, { type: 'tile', i: 0 }) === dw && duelStep(dw, { type: 'check' }) === dw && duelStep(dw, { type: 'undo' }) === dw);
  const m = missCard({ type: 'line', right: q0.original, why: 'x' }, dw.state.built);
  ok('T3 the miss card shows the line as written, in place, and what was built struck out', m.includes('<ins class="miss-fix">') && m.includes('<del class="miss-del">') && /data-act="miss-go"/.test(m));
  dw = duelStep(dw, { type: 'next' }); ok('…next goes on to the next line, the board clear', dw.i === 1 && dw.picks.length === 0 && !dw.state); }

/* ---------- the untimed reducers soak too: overlapping, out-of-range events never throw or stick ---------- */
for (const [name, g0, st] of [['who', quizNew('who', whoRound(lines, WORKS, 'z', 3), 3), quizStep], ['figure', quizNew('figure', figureRound(figs, WORKS, 'z', 4, 6, { hunts: HUNTS }), 4), figureStep],
  ['plot', plotNew(plotRound(shipP, 'z', 4, 3, WORKS, { chapters }), 4), plotStep], ['plot final', plotNew(plotRound(shipP, 'z', 4, 3, WORKS, { chapters, final: true }), 4), plotStep], ['duel', duelNew(duelRound(rhet, plain, 'z', 4), 4), duelStep], ['root', quizNew('root', forgeRound(lex, WP, 'z', 5), 5), quizStep]]) {
  let g = g0, steps = 0;
  try {
    while (!g.over && steps < 4000) { steps++; for (const a of [{ type: 'pick', i: steps % 6 - 1 }, { type: 'spot', i: steps % 5 - 1 }, { type: 'clue' }, { type: 'place', i: steps % 7 - 1, at: steps % 4 === 0 ? steps % 6 : undefined }, { type: 'move', d: steps % 3 - 1 }, { type: 'slot', d: steps % 3 - 1 }, { type: steps % 5 ? 'move' : 'undo', d: 1 }, { type: 'tap', i: steps % 9 - 1 }, { type: steps % 3 ? 'words' : 'tile', i: steps % 5 - 1 }, { type: 'check' }, { type: steps % 4 ? 'tick' : 'next', dt: 17 }]) g = st(g, a); }
    ok(`${name}: a soak of overlapping events ends the round cleanly`, g.over && steps < 4000 && Number.isFinite(g.score));
    ok(`${name}: nothing moves after the end`, st(g, { type: 'pick', i: 0 }) === g && st(g, { type: 'next' }) === g);
    ok(`${name}: its log has one entry per item`, roundLog(g).length === g.rounds.length && roundLog(g).every((x) => x.key && typeof x.ok === 'boolean'));
  } catch (e) { ok(`${name}: the soak threw ${e.message}`, false); }
}

/* ---------- T1: a random-play bot earns 0 coins and 0 stars in every game (C §1.3, §8) ---------- */
{ const { rng } = await import('../src/rand.js');
  const pickN = (R, n, k) => { const out = []; for (let j = 0; j < n && out.length < k; j++) { const i = Math.floor(R() * n); if (!out.includes(i)) out.push(i); } return out; };
  const botRound = (id, seed, L, final, R, mem) => {
    const o = { final, mem, now: NOW };
    if (id === 'builder' || id === 'rush') {
      let g = id === 'builder' ? builderNew(seed, L, { ...o, extra: XB }) : rushNew(seed, L, { ...o, extra: XR }), st = id === 'builder' ? builderStep : rushStep, guard = 0;
      while (!g.over && guard++ < 5000) {
        if (g.hold) { g = st(g, { type: 'continue' }); continue; }
        g = st(g, { type: 'tick', dt: 1500 + Math.floor(R() * 2000) }); if (g.over) break;
        if (id === 'builder') { for (const i of pickN(R, g.cur.tiles.length, 2 + Math.floor(R() * (g.cur.tiles.length - 1)))) g = st(g, { type: 'pick', i }); if (R() < 0.5) g = st(g, { type: 'cap' }); if (R() < 0.5) g = st(g, { type: 'comma', at: Math.floor(R() * g.picks.length) }); g = st(g, { type: 'check' }); }
        else { for (let i = 0; i < g.cur.words.length - 1; i++) if (R() < 0.3) g = st(g, { type: 'toggle', i }); g = st(g, { type: 'submit' }); }
      }
      return g;
    }
    let g = id === 'figure' ? quizNew('figure', figureRound(figs, WORKS, seed, L, ROUND_OF.figure, { ...o, hunts: HUNTS }), L) : id === 'who' ? quizNew('who', whoRound(lines, WORKS, seed, L, ROUND_OF.who, o), L)
      : id === 'root' ? quizNew('root', final ? forgeFamilyRound(lex, WP, seed, L, 2, o) : forgeRound(lex, WP, seed, L, ROUND_OF.root, o), L) : id === 'plot' ? plotNew(plotRound(shipP, seed, L, ROUND_OF.plot, WORKS, { ...o, chapters }), L)
      : duelNew(duelRound(rhet, plain, seed, L, ROUND_OF.duel, o), L, null);
    const st = { figure: figureStep, who: quizStep, root: quizStep, plot: plotStep, duel: duelStep }[id]; let guard = 0;
    while (!g.over && guard++ < 500) {
      const q = g.rounds[g.i];
      if (g.state) { g = st(g, { type: 'next' }); continue; }
      if (id === 'figure') { const ph = figurePhase(g, q); if (ph === 'spot') { g = st(g, { type: 'spot', i: Math.floor(R() * q.sentences.length) }); if (g.spot && !g.spot.ok) g = st(g, { type: 'next' }); continue; }
        if (ph === 'words') { for (const i of pickN(R, q.tokens.length, 1 + Math.floor(R() * 3))) g = st(g, { type: 'tap', i }); g = st(g, { type: 'words' }); if (g.wres && !g.wres.ok) g = st(g, { type: 'next' }); continue; } }
      if (id === 'duel') { if (g.stage === 'which') { g = st(g, { type: 'pick', i: Math.floor(R() * 2) }); continue; } for (const i of pickN(R, q.tiles.length, 1 + Math.floor(R() * q.tiles.length))) g = st(g, { type: 'tile', i }); g = st(g, { type: 'check' }); continue; }
      if (id === 'who' && R() < 0.3) g = st(g, { type: 'clue' });
      if (id === 'plot' && q.type !== 'missing') { for (const i of pickN(R, q.cards.length, q.cards.length * 3)) g = st(g, { type: 'place', i }); continue; }
      g = st(g, { type: 'pick', i: Math.floor(R() * q.options.length) });
    }
    return g;
  };
  const T1 = {};
  for (const id of Object.keys(GAMES)) {
    let coins = 0, stars = 0, best = 0, runs = 0;
    for (const L of [1, 3, 5]) for (let b = 0; b < (id === 'figure' || id === 'plot' ? 8 : 14); b++) {
      const R = rng(`bot:${id}:${L}:${b}`); let run = runNew(L), mem = memOf({});
      for (let k = 0; k <= RUN_ROUNDS; k++) { const g = botRound(id, `bot${b}:${k}`, L, k === RUN_ROUNDS, R, mem); mem = memRecord(mem, roundLog(g), NOW); run = runAdd(run, g, 0); }
      coins += runPay(run); stars += starsFor(G.runStarPct(run)); best = Math.max(best, G.runStarPct(run) || 0); runs++;
    }
    T1[id] = `${runs} runs, best ${Math.round(best * 100)}% (beyond chance)`;
    ok(`T1 ${GAMES[id].name}: a random-play bot earns 0 coins and 0 stars (${T1[id]})`, coins === 0 && stars === 0, `coins ${coins}, stars ${stars}`);
  }
  console.log('games: T1 random bots —', Object.entries(T1).map(([k, v]) => `${k} ${v}`).join(' · '));
  /* …and the same bot playing RIGHT earns coins and stars, so T1 is not passing for a game that pays nothing */
  let paid = 0; { let run = runNew(1); for (let k = 0; k <= RUN_ROUNDS; k++) { let g = rushNew('good' + k, 1, { extra: XR }); while (!g.over) { for (const i of g.cur.commas) g = rushStep(g, { type: 'toggle', i }); g = rushStep(g, { type: 'submit' }); g = rushStep(g, { type: 'tick', dt: 4000 }); } run = runAdd(run, g, 0); } paid = runPay(run);
    ok(`T1 is not blind: a child playing Comma Rush right earns coins (${paid}) and three stars`, paid > 0 && paid <= (RUN_ROUNDS + 1) * G.ROUND_PAY_CAP && starsFor(runPct(run)) === 3); }
  /* T6 (the reducer half; test/games-ui.mjs checks the wallet): what the finish pays is exactly what was banked, round by round */
  { let run = runNew(2), sum = 0; for (let k = 0; k <= RUN_ROUNDS; k++) { const g = duelSolve(duelNew(duelRound(rhet, plain, 't6' + k, 2, 5), 2)); sum += roundPay(g); run = runAdd(run, g, 0); }
    ok(`T6: the finish pays exactly the coins its rounds banked (${sum})`, runPay(run) === sum && sum === (RUN_ROUNDS + 1) * 5); }
  ok('pay: a round never pays more than its cap', roundPay({ kind: 'rush', clean: 40, right: 40, wrongs: 0 }) === G.ROUND_PAY_CAP);
  ok('pay: a quiz round under half right — beyond chance — pays nothing, even for its right answers', roundPay({ kind: 'root', right: 3, answered: 6, results: [true, true, true, false, false, false] }) === 0 && roundPay({ kind: 'root', right: 4, answered: 6, results: [true, true, true, true, false, false] }) === 4 && roundPay({ kind: 'figure', results: [true, true, true, false, false, false] }) === 3);
  ok('pay: Plot Line pays a story wholly in order, never a lucky pair', roundPay({ kind: 'plot', right: 7, total: 9, perfect: 2 }) === 2 && roundPay({ kind: 'plot', right: 4, total: 9, perfect: 1 }) === 0);
  /* the miss card's other shapes: the right sentence in both orders; the right option in place */
  const ms = missCard({ type: 'sentence', right: ['When it rained, we ran.', 'We ran when it rained.'], why: 'why' }, 'when it rained we ran.');
  ok('T3 the miss card: both right orders, the capital and comma lit, the attempt struck out', ms.replace(/<[^>]+>/g, '').includes('When it rained, we ran.') && ms.replace(/<[^>]+>/g, '').includes('We ran when it rained.') && (ms.match(/miss-fix/g) || []).length >= 3 && /<del class="miss-del">when it rained we ran\.<\/del>/.test(ms));
  const mc = missCard({ type: 'choice', options: ['Simile', 'Metaphor', 'None'], answer: 1, why: 'Metaphor: it says one thing IS another.' }, 0);
  ok('T3 the miss card: the right option named in place, the pick struck out, the gloss only now', /<ins class="miss-fix">Metaphor<\/ins>/.test(mc) && /<del class="miss-del">Simile<\/del>/.test(mc) && /IS another/.test(mc));
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
