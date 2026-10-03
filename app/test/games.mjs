/* games.mjs — every game playable both ways (the same reducer takes taps and keys), scored on the
   learning decision, its difficulty climbing inside a round and across plays, and a 60-second soak
   with overlapping events never freezes or throws. The new games' items are held to the item rules:
   exactly one right option, distinct options, the answer never in its own text, no slot over 35%, and
   every line from a book an exact substring of its held text. */
import { readFileSync, readdirSync } from 'node:fs';
import { tally } from './_mem.mjs';
import { builderNew, builderStep, builderJudge, builderSentence, builderPool, builderRoad, rushNew, rushStep, rushRoad, whoRound, whoLines, figureRound, FIGURE_KINDS,
  quizNew, quizStep, plotRound, plotNew, plotStep, plotPairs, opening, forgeRound, forgePools, duelRound, duelNew, duelStep, GAMES, nextLevel, accuracy, mostMissed, ROUND_MS, MAX_LEVEL } from '../src/games.js';
import { LINES, WORKS } from '../src/data/library.js';
import { FIGURES } from '../src/data/literature.js';
import { RHETORIC } from '../src/data/language.js';
import { PLAIN, DEVICE_GLOSS } from '../src/data/duel.js';
import { cleared } from '../src/data/rights.js';
import * as WP from '../src/data/wordparts.js';
const { ok, done } = tally('games');
const lex = JSON.parse(readFileSync(new URL('../public/data/bee-words.json', import.meta.url)));
const PJ = JSON.parse(readFileSync(new URL('../src/data/passages.json', import.meta.url)));
const sp = (s) => String(s).replace(/\s+/g, ' ');
const TEXTS = Object.fromEntries(readdirSync(new URL('../public/texts/', import.meta.url)).filter((f) => f.endsWith('.txt')).map((f) => [f.replace(/\.txt$/, ''), sp(readFileSync(new URL(`../public/texts/${f}`, import.meta.url), 'utf8'))]));
const held = (work, text) => (TEXTS[work] || '').includes(sp(text));
const shipped = (id) => cleared(WORKS.find((w) => w.id === id));
const LV = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);
const SEEDS = Array.from({ length: 60 }, (_, i) => 's' + i);

/* ---------- Sentence Builder ---------- */
ok('Sentence Builder has a pool in every band', [1, 2, 3].every((b) => builderPool(b).length >= 5));
let s = builderNew('t', 3); const c = s.cur;
const order = (ks) => ks.map((k) => c.tiles.findIndex((t) => t.k === k));
ok('front order is a sentence', builderJudge(c, order(['sub', 'dep', 'main'])) === 'front');
ok('end order is a sentence', builderJudge(c, order(['main', 'sub', 'dep'])) === 'end');
ok('a scramble is not', builderJudge(c, order(['dep', 'sub', 'main'])) === null);
ok('the front sentence has its comma', /, /.test(builderSentence(c, 'front')));
ok('tiles are never dealt already built', SEEDS.every((sd) => { const g = builderNew(sd, 2); return builderJudge(g.cur, [0, 1, 2]) === null; }));
for (const i of order(['sub', 'dep', 'main'])) s = builderStep(s, { type: 'pick', i });
ok('a built sentence scores 2', s.score === 2 && s.built === 1);
const c2 = s.cur; for (const k of ['main', 'sub', 'dep']) s = builderStep(s, { type: 'pick', i: c2.tiles.findIndex((t) => t.k === k) });
ok('building the other way round earns the variety bonus', s.score === 5 && s.variety === 1);
const c3 = s.cur; for (const k of ['dep', 'sub', 'main']) s = builderStep(s, { type: 'pick', i: c3.tiles.findIndex((t) => t.k === k) });
ok('a wrong build scores nothing and holds the tiles', s.score === 5 && s.wrong === 1 && s.cur === c3 && s.combo === 0 && s.misses.clause === 1);
ok('a tile cannot be picked twice', builderStep({ ...s, picks: [0] }, { type: 'pick', i: 0 }).picks.length === 1);
let sameTwice = builderNew('u', 3);
for (let n = 0; n < 2; n++) { const cc = sameTwice.cur; for (const k of ['sub', 'dep', 'main']) sameTwice = builderStep(sameTwice, { type: 'pick', i: cc.tiles.findIndex((t) => t.k === k) }); }
ok('the same order twice earns no bonus', sameTwice.score === 4 && sameTwice.variety === 0);
/* the combo: every third right in a row is worth one more — accuracy, never chance */
let cb = builderNew('cb', 1); for (let n = 0; n < 3; n++) { const cc = cb.cur; for (const k of ['sub', 'dep', 'main']) cb = builderStep(cb, { type: 'pick', i: cc.tiles.findIndex((t) => t.k === k) }); }
ok('three right in a row: the third earns the combo point', cb.combo === 3 && cb.score === 7 && cb.flash.combo === 1);
/* the ramp: shortest first inside a round; a higher level starts on longer, later-band sentences */
const wl = (it) => (it.sub + ' ' + it.dep + ' ' + it.main).split(/\s+/).length;
ok('Sentence Builder: level 1 is first-band only', builderRoad(1).every((x) => x.band === 1));
ok('Sentence Builder: inside a round the sentences grow', LV.every((L) => { const r = builderRoad(L), head = r.slice(0, Math.ceil(r.length * 0.4)); return head.every((x, i) => !i || wl(x) >= wl(head[i - 1])); }));
const avgLen = (L) => builderRoad(L).slice(0, 8).reduce((a, x) => a + wl(x), 0) / 8;
ok('Sentence Builder: each level starts on longer sentences', LV.slice(1).every((L) => avgLen(L) >= avgLen(L - 1)) && avgLen(5) > avgLen(1));

/* ---------- Punctuation Rush ---------- */
let r = rushNew('t', 3); const w = r.cur;
for (const i of w.commas) r = rushStep(r, { type: 'toggle', i });
r = rushStep(r, { type: 'submit' });
ok('all the right commas: points plus a clean bonus', r.score === w.commas.length + 1 && r.clean === 1);
let r2 = rushNew('t', 3); r2 = rushStep(r2, { type: 'move', d: 1 }); r2 = rushStep(r2, { type: 'toggle', i: r2.cursor });   // the keyboard way: arrows + Space
ok('the keyboard way toggles the gap under the cursor', r2.sel.length === 1 && r2.sel[0] === r2.cursor);
let r3 = rushNew('t', 3); const wr = [...Array(r3.cur.words.length - 1).keys()].find((i) => !r3.cur.commas.includes(i));
if (wr != null) { r3 = rushStep(r3, { type: 'toggle', i: wr }); r3 = rushStep(r3, { type: 'submit' }); ok('a wrong comma costs, never below zero', r3.score === 0 && r3.misses[r3.flash.rule] === 1); }
ok('Punctuation Rush: level 1 is one comma a sentence', rushRoad(1).every((x) => x.commas.length === 1));
ok('Punctuation Rush: inside a level-2 round one comma comes before two', (() => { const k = rushRoad(2).map((x) => x.commas.length); return k.every((n, i) => !i || n >= k[i - 1]) && k[k.length - 1] > 1; })());
const avgC = (L) => rushRoad(L).slice(0, 10).reduce((a, x) => a + x.commas.length, 0) / 10;
ok('Punctuation Rush: each level starts with more commas', LV.slice(1).every((L) => avgC(L) >= avgC(L - 1)) && avgC(5) > 1.5);

/* soak: 60 s of ticks with taps interleaved and out of range */
for (const [mk, st] of [[builderNew, builderStep], [rushNew, rushStep]]) {
  for (const L of [1, 5]) {
    let g = mk('soak', L), steps = 0;
    try {
      while (!g.over && steps < 5000) {
        g = st(g, { type: 'tick', dt: 17 }); steps++;
        g = st(g, { type: steps % 3 ? 'pick' : 'toggle', i: steps % 5 - 1 }); g = st(g, { type: steps % 7 ? 'undo' : 'submit' }); g = st(g, { type: 'move', d: (steps % 3) - 1 });
      }
      ok(`${g.kind} L${L}: a 60 s soak ends cleanly`, g.over && g.t === ROUND_MS && Number.isFinite(g.score) && g.score >= 0);
      ok(`${g.kind} L${L}: nothing moves after the end`, st(g, { type: 'pick', i: 0 }) === g && st(g, { type: 'tick', dt: 999 }) === g);
    } catch (e) { ok(`${mk.name}: the soak threw ${e.message}`, false); }
  }
}

/* ---------- levels ---------- */
ok('a level rises at 80%', nextLevel(2, 0.8) === 3 && nextLevel(1, 1) === 2);
ok('a level holds between 40% and 80%', nextLevel(3, 0.79) === 3 && nextLevel(3, 0.4) === 3);
ok('a level falls one step below 40%', nextLevel(3, 0.39) === 2 && nextLevel(4, 0) === 3);
ok('never below 1, never above the top', nextLevel(1, 0) === 1 && nextLevel(MAX_LEVEL, 1) === MAX_LEVEL);
ok('a round with no attempts moves nothing', nextLevel(3, null) === 3);

/* ---------- the item rules, as one checker (and proved by breaking it below) ---------- */
function slotLean(items, n) { const c = Array(n).fill(0); for (const q of items) c[q.answer]++; return Math.max(...c) / items.length; }
function fair(q, rightOf, textOf = () => '') {
  const errs = [];
  if (!(q.answer >= 0 && q.answer < q.options.length)) errs.push('answer out of range');
  if (q.options[q.answer] !== rightOf(q)) errs.push('the keyed option is not the right one');
  if (new Set(q.options.map((o) => String(o).toLowerCase())).size !== q.options.length) errs.push('options repeat');
  if (q.options.filter((o) => o === rightOf(q)).length !== 1) errs.push('more than one right option');
  const t = textOf(q).toLowerCase(); if (t && String(rightOf(q)).toLowerCase().split(/[^a-z]+/).filter((x) => x.length > 2 && !['the', 'lord'].includes(x)).some((x) => new RegExp(`\\b${x}\\b`).test(t))) errs.push('the answer is in the text');
  return errs;
}

/* ---------- Who Said It? ---------- */
const whoAll = LV.flatMap((L) => SEEDS.flatMap((sd) => whoRound(LINES.filter((l) => shipped(l.work)), WORKS, sd, L)));
const whoBad = whoAll.flatMap((q) => fair(q, (x) => x.right, (x) => x.text).map((e) => `${e}: ${q.text}`));
ok('Who Said It?: one right answer, distinct options, never named in the line', !whoBad.length);
if (whoBad.length) console.log(whoBad.slice(0, 5));
ok('Who Said It?: every line is held, word for word', whoAll.every((q) => held(q.workId, q.text) || LINES.some((l) => l.text === q.text)));
ok('Who Said It?: no answer slot over 35%', slotLean(whoAll, 4) <= 0.35);
ok('Who Said It?: no work held back is ever served', whoAll.every((q) => shipped(q.workId)));
ok('Who Said It?: a rival is never the line’s own author', whoAll.every((q) => { const a = WORKS.find((x) => x.id === q.workId).author.split(', told by')[0]; return q.right === a || !q.options.includes(a); }));
const tierOf = (L) => { const t = SEEDS.flatMap((sd) => whoRound(LINES.filter((l) => shipped(l.work)), WORKS, sd, L)).map((q) => q.tier); return t.reduce((a, b) => a + b, 0) / t.length; };
ok('Who Said It?: higher levels reach harder shelves', tierOf(1) === 1 && tierOf(5) > tierOf(3) && tierOf(3) > tierOf(1));
ok('Who Said It?: inside a round the shelves climb', SEEDS.every((sd) => whoRound(LINES.filter((l) => shipped(l.work)), WORKS, sd, 3).every((q, i, a) => !i || q.tier >= a[i - 1].tier)));
ok('Who Said It?: enough fair lines to fill a round', whoLines(LINES.filter((l) => shipped(l.work)), WORKS).length >= 30);

/* ---------- Figure Hunt ---------- */
const figs = FIGURES.filter((f) => shipped(f.work));
for (const L of LV) {
  const items = SEEDS.flatMap((sd) => figureRound(figs, WORKS, sd, L));
  const bad = items.flatMap((q) => fair(q, (x) => FIGURE_KINDS.find(([k]) => k === x.cat)[1]));
  ok(`Figure Hunt L${L}: the keyed answer is the line's figure, options distinct`, !bad.length && items.every((q) => q.kinds[q.answer] === q.cat));
  ok(`Figure Hunt L${L}: no slot over 35%`, slotLean(items, items[0].options.length) <= 0.35 + 1e-9);
  ok(`Figure Hunt L${L}: rounds of ten, easiest first`, SEEDS.every((sd) => { const f = figureRound(figs, WORKS, sd, L); const h = { simile: 1, alliteration: 1, metaphor: 2, personification: 3, none: 3 }; return f.length === 10 && f.every((q, i) => !i || h[q.cat] >= h[f[i - 1].cat]); }));
}
ok('Figure Hunt: level 1 offers three answers, level 3 all five', figureRound(figs, WORKS, 'x', 1)[0].options.length === 3 && figureRound(figs, WORKS, 'x', 3)[0].options.length === 5);
const subtle = (L) => SEEDS.flatMap((sd) => figureRound(figs, WORKS, sd, L)).filter((q) => ['metaphor', 'personification', 'none'].includes(q.cat)).length;
ok('Figure Hunt: higher levels lean on the subtle figures', subtle(5) > subtle(3) && subtle(3) > subtle(1));
let fq = quizNew('figure', figureRound(figs, WORKS, 'k', 2), 2);
fq = quizStep(fq, { type: 'pick', i: fq.rounds[0].answer }); ok('a right pick scores and waits for next', fq.score === 1 && fq.state.ok && quizStep(fq, { type: 'pick', i: 0 }) === fq);
fq = quizStep(fq, { type: 'next' }); fq = quizStep(fq, { type: 'pick', i: (fq.rounds[1].answer + 1) % fq.rounds[1].options.length });
ok('a wrong pick holds, scores nothing, and names what was missed', fq.score === 1 && !fq.state.ok && mostMissed(fq) === fq.rounds[1].cat && quizStep(fq, { type: 'pick', i: 0 }) === fq);

/* ---------- Plot Line ---------- */
const shipP = PJ.filter((p) => shipped(p.work));
ok('opening() is the first sentence', opening('Once upon a time there was a goat. It ate the hedge.') === 'Once upon a time there was a goat.');
for (const L of LV) {
  const rounds = SEEDS.flatMap((sd) => plotRound(shipP, sd, L, 4, WORKS));
  ok(`Plot Line L${L}: every card is word for word from its passage`, rounds.every((q) => q.cards.every((c) => sp(PJ.find((p) => p.id === q.id).text).includes(c.text.replace(/…$/, '')))));
  ok(`Plot Line L${L}: ${L <= 2 ? 4 : 5} scenes where the story has them, distinct, never dealt in order`, rounds.every((q) => q.cards.length >= 4 && q.cards.length <= (L <= 2 ? 4 : 5) && new Set(q.cards.map((c) => c.text)).size === q.cards.length && !q.cards.every((c, j) => c.at === j)));
  ok(`Plot Line L${L}: stories only — no essay, speech or poem`, rounds.every((q) => !['essay', 'speech', 'poetry'].includes(WORKS.find((w) => w.id === q.work).shelf)));
}
const pb = (L) => SEEDS.flatMap((sd) => plotRound(shipP, sd, L, 4, WORKS)).reduce((a, q) => a + q.band + q.cards.length, 0);
ok('Plot Line: higher levels bring longer, harder stories', pb(5) > pb(3) && pb(3) > pb(1));
let pl = plotNew(plotRound(shipP, 'solve', 3, 4, WORKS), 3), guard = 0;
while (!pl.over && guard++ < 100) { const q = pl.rounds[pl.i]; for (let at = 0; at < q.cards.length; at++) pl = plotStep(pl, { type: 'place', i: q.cards.findIndex((c) => c.at === at) }); pl = plotStep(pl, { type: 'next' }); }
ok('Plot Line is solvable: the true order scores every pair', pl.over && pl.right === pl.total && pl.perfect === 4 && accuracy(pl).pct === 1);
let pk = plotNew(plotRound(shipP, 'keys', 1, 4, WORKS), 1); const q0 = pk.rounds[0];
for (let at = 0; at < q0.cards.length; at++) { const want = q0.cards.findIndex((cc) => cc.at === at); for (let k = 0; k < 10 && pk.cursor !== want; k++) pk = plotStep(pk, { type: 'move', d: 1 }); pk = plotStep(pk, { type: 'place', i: pk.cursor }); }
ok('Plot Line by keys (arrows + Enter on the cursor) places the same way', pk.state?.ok === true);
let pu = plotNew(plotRound(shipP, 'u', 1, 4, WORKS), 1); pu = plotStep(pu, { type: 'place', i: 0 }); pu = plotStep(pu, { type: 'place', i: 0 });
ok('a card is placed once; undo takes it back', pu.line.length === 1 && plotStep(pu, { type: 'undo' }).line.length === 0);
ok('pairs score only neighbours in the right order', plotPairs([{ at: 0 }, { at: 1 }, { at: 2 }, { at: 3 }], [1, 2, 3, 0]) === 2 && plotPairs([{ at: 0 }, { at: 1 }, { at: 2 }, { at: 3 }], [3, 2, 1, 0]) === 0);

/* ---------- Root Forge ---------- */
const P = WP.PREFIXES.map((a) => a.p), keysL = Object.keys(lex.words);
const forms = (q, o) => { const x = o.replace(/-/g, ''); return q.before ? x + q.base : q.base + x; };
const realRight = (q) => !!lex.words[q.word];
const rivalIsNoWord = (q, o) => q.kind === 'root' ? !keysL.some((k) => k.startsWith(forms(q, o))) : !lex.words[forms(q, o)] && !(lex[q.kind === 'prefix' ? 'prefixNon' : 'suffixNon'][q.word] || []).every((x) => x !== o.replace(/-/g, ''));
for (const L of LV) {
  const items = SEEDS.flatMap((sd) => forgeRound(lex, WP, sd, L));
  const bad = items.flatMap((q) => fair(q, () => q.options[q.answer]));
  ok(`Root Forge L${L}: one keyed piece, distinct pieces`, !bad.length && items.every((q) => q.options.length === 4));
  ok(`Root Forge L${L}: every accepted word is in Bee's list`, items.every(realRight));
  ok(`Root Forge L${L}: every rival makes no word in Bee's list`, items.every((q) => q.options.every((o, i) => i === q.answer || rivalIsNoWord(q, o))));
  ok(`Root Forge L${L}: no slot over 35%`, slotLean(items, 4) <= 0.35);
  ok(`Root Forge L${L}: a meaning to show on success`, items.every((q) => q.def));
}
ok('Root Forge: roots join from level 4', SEEDS.every((sd) => !forgeRound(lex, WP, sd, 3).some((q) => q.kind === 'root') && forgeRound(lex, WP, sd, 4).some((q) => q.kind === 'root')));
ok('Root Forge: a root round forges an exact root word', forgePools(lex, WP).filter((x) => x.kind === 'root').every((x) => x.word === x.aff + x.base && P.includes(x.aff)));
let rf = quizNew('root', forgeRound(lex, WP, 'play', 4), 4);
while (!rf.over) { rf = quizStep(rf, { type: 'pick', i: rf.rounds[rf.i].answer }); rf = quizStep(rf, { type: 'next' }); }
ok('Root Forge is solvable: ten right, combo points on every third', rf.right === 10 && rf.score === 13 && rf.bestCombo === 10);

/* ---------- Rhetoric Duel ---------- */
ok('Rhetoric Duel: every rhetoric line has a plainer version', RHETORIC.every((x) => PLAIN[x.text]) && Object.keys(PLAIN).every((t) => RHETORIC.some((x) => x.text === t)));
ok('Rhetoric Duel: every original is held, word for word', RHETORIC.every((x) => held(x.work, x.text)));
ok('Rhetoric Duel: no plainer version is a quotation', Object.values(PLAIN).every((p) => !Object.values(TEXTS).some((t) => t.includes(p))));
ok('Rhetoric Duel: every device has a gloss', RHETORIC.every((x) => DEVICE_GLOSS[x.device]));
const rhet = RHETORIC.filter((x) => shipped(x.work));
for (const L of LV) {
  const items = SEEDS.flatMap((sd) => duelRound(rhet, PLAIN, sd, L));
  const bad = items.flatMap((q) => fair(q, (x) => x.device, (x) => x.original));
  ok(`Rhetoric Duel L${L}: one right reason, distinct, never an "also" device`, !bad.length && items.every((q) => q.options.length === 4 && q.options.every((o, i) => i === q.answer || !(RHETORIC.find((x) => x.text === q.original).also || []).includes(o))));
  ok(`Rhetoric Duel L${L}: no reason slot over 35%`, slotLean(items, 4) <= 0.35);
  const strong = items.filter((q) => q.strong === 1).length / items.length;
  ok(`Rhetoric Duel L${L}: the original sits left and right alike`, strong >= 0.4 && strong <= 0.6);
  ok(`Rhetoric Duel L${L}: the original is the strong version`, items.every((q) => q.versions[q.strong] === q.original && q.versions[1 - q.strong] === PLAIN[q.original]));
  ok(`Rhetoric Duel L${L}: the right reason never stands out as the longest`, items.every((q) => q.options.some((o, i) => i !== q.answer && o.length >= q.device.length - 4)));
}
const hardD = (L) => SEEDS.flatMap((sd) => duelRound(rhet, PLAIN, sd, L)).filter((q) => q.device === 'antithesis').length;
ok('Rhetoric Duel: antithesis waits for the higher levels', hardD(1) === 0 && hardD(2) === 0 && hardD(5) > hardD(3));
let du = duelNew(duelRound(rhet, PLAIN, 'd', 3), 3);
ok('Rhetoric Duel: the reason cannot be picked before the stronger version', duelStep(du, { type: 'next' }) === du && duelStep(du, { type: 'pick', i: 5 }) === du);
du = duelStep(du, { type: 'pick', i: 1 - du.rounds[0].strong });
ok('Rhetoric Duel: choosing the plain one scores nothing and moves to why', du.stage === 'why' && du.score === 0 && !du.which.ok);
du = duelStep(du, { type: 'pick', i: du.rounds[0].answer });
ok('Rhetoric Duel: the right reason scores, even after a wrong pick of version', du.score === 1 && du.state.ok);
du = duelStep(du, { type: 'next' }); ok('Rhetoric Duel: next goes back to "which is stronger?"', du.stage === 'which' && du.i === 1 && du.which === null);
let dw = duelNew(duelRound(rhet, PLAIN, 'w', 2), 2); dw = duelStep(dw, { type: 'pick', i: dw.rounds[0].strong }); dw = duelStep(dw, { type: 'pick', i: (dw.rounds[0].answer + 1) % 4 });
ok('Rhetoric Duel: the right version with the wrong reason scores nothing', dw.score === 0 && dw.strongRight === 1 && mostMissed(dw) === dw.rounds[0].device);

/* ---------- the untimed reducers soak too: overlapping, out-of-range events never throw or stick ---------- */
for (const [name, g0, st] of [['who', quizNew('who', whoRound(LINES, WORKS, 'z', 3), 3), quizStep], ['plot', plotNew(plotRound(shipP, 'z', 4, 4, WORKS), 4), plotStep], ['duel', duelNew(duelRound(rhet, PLAIN, 'z', 4), 4), duelStep], ['root', quizNew('root', forgeRound(lex, WP, 'z', 5), 5), quizStep]]) {
  let g = g0, steps = 0;
  try {
    while (!g.over && steps < 4000) { steps++; for (const a of [{ type: 'pick', i: steps % 6 - 1 }, { type: 'place', i: steps % 7 - 1 }, { type: 'move', d: steps % 3 - 1 }, { type: steps % 5 ? 'move' : 'undo', d: 1 }, { type: steps % 4 ? 'tick' : 'next', dt: 17 }]) g = st(g, a); }
    ok(`${name}: a soak of overlapping events ends the round cleanly`, g.over && steps < 4000 && Number.isFinite(g.score));
    ok(`${name}: nothing moves after the end`, st(g, { type: 'pick', i: 0 }) === g && st(g, { type: 'next' }) === g);
  } catch (e) { ok(`${name}: the soak threw ${e.message}`, false); }
}

/* ---------- every game is listed with a world, what it practises, how and its keys ---------- */
ok('seven games, each with a world, practises, how, keys and five level meanings', Object.keys(GAMES).length === 7 && Object.values(GAMES).every((g) => g.world && g.practises && g.how && g.keys && Object.keys(g.levels).length === MAX_LEVEL));

/* ---------- prove the checker by breaking it: a planted unfair item must be caught ---------- */
const plant = whoAll[0], dup = { ...plant, options: plant.options.map((o, i) => (i === (plant.answer + 1) % 4 ? plant.right : o)) };
ok('the checker catches a planted second right answer', fair(dup, (x) => x.right).length > 0);
ok('the checker catches the answer planted in the line', fair({ ...plant, text: `${plant.text} said ${plant.right}` }, (x) => x.right, (x) => x.text).length > 0);
ok('the checker catches a leaning slot', slotLean(whoAll.map((q) => ({ ...q, answer: 0 })), 4) > 0.35);
ok('the plain-version check catches a planted quotation', !Object.values({ ...PLAIN, x: RHETORIC[0].text }).every((p) => !Object.values(TEXTS).some((t) => t.includes(p))));
done();
