/* games.mjs — every game playable both ways (the same reducer takes taps and keys), scored on the
   learning decision, and a 60-second soak with overlapping events never freezes or throws. */
import { tally } from './_mem.mjs';
import { builderNew, builderStep, builderJudge, builderSentence, builderPool, rushNew, rushStep, whoRound, ROUND_MS } from '../src/games.js';
import { LINES, WORKS } from '../src/data/library.js';
const { ok, done } = tally('games');

ok('Sentence Builder has a pool in every band', [1, 2, 3].every((b) => builderPool(b).length >= 5));
let s = builderNew('t', 3); const c = s.cur;
const order = (ks) => ks.map((k) => c.tiles.findIndex((t) => t.k === k));
ok('front order is a sentence', builderJudge(c, order(['sub', 'dep', 'main'])) === 'front');
ok('end order is a sentence', builderJudge(c, order(['main', 'sub', 'dep'])) === 'end');
ok('a scramble is not', builderJudge(c, order(['dep', 'sub', 'main'])) === null);
ok('the front sentence has its comma', /, /.test(builderSentence(c, 'front')));
for (const i of order(['sub', 'dep', 'main'])) s = builderStep(s, { type: 'pick', i });
ok('a built sentence scores 2', s.score === 2 && s.built === 1);
const c2 = s.cur; for (const k of ['main', 'sub', 'dep']) s = builderStep(s, { type: 'pick', i: c2.tiles.findIndex((t) => t.k === k) });
ok('building the other way round earns the variety bonus', s.score === 5 && s.variety === 1);
const c3 = s.cur; for (const k of ['dep', 'sub', 'main']) s = builderStep(s, { type: 'pick', i: c3.tiles.findIndex((t) => t.k === k) });
ok('a wrong build scores nothing and holds the tiles', s.score === 5 && s.wrong === 1 && s.cur === c3);
ok('a tile cannot be picked twice', builderStep({ ...s, picks: [0] }, { type: 'pick', i: 0 }).picks.length === 1);

let sameTwice = builderNew('u', 3);
for (let n = 0; n < 2; n++) { const cc = sameTwice.cur; for (const k of ['sub', 'dep', 'main']) sameTwice = builderStep(sameTwice, { type: 'pick', i: cc.tiles.findIndex((t) => t.k === k) }); }
ok('the same order twice earns no bonus', sameTwice.score === 4 && sameTwice.variety === 0);
let r = rushNew('t', 3); const w = r.cur;
for (const i of w.commas) r = rushStep(r, { type: 'toggle', i });
r = rushStep(r, { type: 'submit' });
ok('all the right commas: points plus a clean bonus', r.score === w.commas.length + 1 && r.clean === 1);
let r2 = rushNew('t', 3); r2 = rushStep(r2, { type: 'move', d: 1 }); r2 = rushStep(r2, { type: 'toggle', i: r2.cursor });   // the keyboard way: arrows + Space
ok('the keyboard way toggles the gap under the cursor', r2.sel.length === 1 && r2.sel[0] === r2.cursor);
let r3 = rushNew('t', 3); const wr = r3.cur.words.length - 2 >= 0 ? [...Array(r3.cur.words.length - 1).keys()].find((i) => !r3.cur.commas.includes(i)) : null;
if (wr != null) { r3 = rushStep(r3, { type: 'toggle', i: wr }); r3 = rushStep(r3, { type: 'submit' }); ok('a wrong comma costs, never below zero', r3.score === 0); }

/* soak: 60 s of ticks with taps interleaved and out of range */
for (const [mk, st] of [[builderNew, builderStep], [rushNew, rushStep]]) {
  let g = mk('soak', 2), steps = 0;
  try {
    while (!g.over && steps < 5000) {
      g = st(g, { type: 'tick', dt: 17 }); steps++;
      g = st(g, { type: steps % 3 ? 'pick' : 'toggle', i: steps % 5 - 1 }); g = st(g, { type: steps % 7 ? 'undo' : 'submit' }); g = st(g, { type: 'move', d: (steps % 3) - 1 });
    }
    ok(`${g.kind}: a 60 s soak ends cleanly`, g.over && g.t === ROUND_MS);
    ok(`${g.kind}: nothing moves after the end`, st(g, { type: 'pick', i: 0 }) === g);
  } catch (e) { ok(`${mk.name}: the soak threw ${e.message}`, false); }
}
const rounds = whoRound(LINES, WORKS, 'x');
ok('Who Said It? has one right answer per line', rounds.length === 8 && rounds.every((q) => q.options[q.answer] === q.right && new Set(q.options).size === q.options.length));
done();
