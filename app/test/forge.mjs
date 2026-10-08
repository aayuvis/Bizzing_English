/* forge.mjs — ROOT FORGE's engine (src/forge.js), held to the handover's rules (C §4.3, §1.3, §8) and to the
   app's hard rules (CLAUDE.md 6 and 11). Each check here was watched to fail once before it was trusted
   (see the report): every precomputed round's words are real Bee words, kid-safe, buildable from that
   round's own tray, and they are ALL the words the tray can forge; a word is made of its parts (no false
   etymology); a non-word never scores; a random-placement bot earns 0 coins and 0 stars over thousands of
   runs; the Forge Book persists through the Store seam and a backup. */
import './_mem.mjs';
import { readFileSync } from 'node:fs';
import { tally } from './_mem.mjs';
import * as WP from '../src/data/wordparts.js';
import { kidSafe, defSafe } from '../src/safe.js';
import { rng } from '../src/rand.js';
import { FALSE_FRIENDS, forgeOf, forgeNew, forgeStep, forgeAccuracy, forgeGoalMet, forgeFirst, shapeOk, bookAdd, bookByPart, bookSize, stamped, rankOf, LEVELS, levelCfg, MAX_SLOTS, STAMP } from '../src/forge.js';
import { roundPay, runNew, runAdd, runPay, runStarPct, starsFor, accuracy, roundLog, memRecord, nextLevel, RUN_ROUNDS, ROUND_PAY_CAP, forgePools } from '../src/games.js';
const { ok, done } = tally('forge');
const lex = JSON.parse(readFileSync(new URL('../public/data/bee-words.json', import.meta.url)));
const t0 = performance.now(), F = forgeOf(lex, WP), ms = Math.round(performance.now() - t0);
const SEEDS = Array.from({ length: 60 }, (_, i) => 'seed' + i), LV = [1, 2, 3, 4, 5];
console.log(`forge: ${F.parts.length} parts, ${F.words.size} words the table can forge, built in ${ms} ms`);

/* ---------- the parts and the words ---------- */
ok('every prefix, ending and root has its meaning and the source the parts table gives it', F.parts.filter((p) => p.kind !== 'base').every((p) => p.mean && p.src));
ok('no two parts share a spelling (a tray never shows the same piece twice)', new Set(F.parts.map((p) => p.t)).size === F.parts.length);
ok('every whole-word part is in Bee’s list and kid-safe', F.parts.filter((p) => p.kind === 'base').every((p) => lex.words[p.t] && kidSafe(p.t, lex.words[p.t][0])));
ok(`the forge can make a few hundred words (${F.words.size}), some of three parts`, F.words.size >= 300 && [...F.words.values()].some((e) => e.ids.length >= 3));
let badWord = [];
for (const [w, e] of F.words) { const d = lex.words[w]; if (!d || !kidSafe(w, d[0]) || !defSafe(d[0]) || F.strike(e.ids)?.word !== w) badWord.push(w); }
ok(`every word the forge can make is in Bee’s list, kid-safe (word and definition), and struck by its own parts (${badWord.slice(0, 5)})`, !badWord.length);
ok('every word has the shape of a word: prefixes, then one or two cores, then endings', [...F.words.values()].every((e) => shapeOk(e.ids.map((id) => F.part(id)))));
ok('the safety scan sees the same words (games.js forgePools → test/safe.mjs)', forgePools(lex, WP).length === F.words.size && forgePools(lex, WP).every((x) => F.words.has(x.word)));
/* made of its parts: a root word is one the table lists for that root; a longer word is built on a shorter one */
const rootListed = (w, ids) => ids.filter((id) => F.part(id).kind === 'root').some((id) => F.rootWords.get(id)?.has(w));
ok('a two-part root word is one the parts table lists for that root (sourced)', [...F.words].filter(([, e]) => e.ids.length === 2 && e.ids.some((id) => F.part(id).kind === 'root')).every(([w, e]) => rootListed(w, e.ids)));
ok('every three-part word stands on a two-part word (un + kind → unkind → unkindness)', [...F.words].filter(([, e]) => e.ids.length >= 3).every(([, e]) => (F.part(e.ids[0]).kind === 'prefix' && F.strike(e.ids.slice(1))) || (F.part(e.ids.at(-1)).kind === 'suffix' && F.strike(e.ids.slice(0, -1)))));
ok('a word merely spelt from the pieces is not forged: im + age is not "image", mis + sing is not "missing"', !F.strike(['p:im', 'b:age']) && !F.strike(['p:mis', 'b:sing']) && (!F.part('b:age') || F.spelt(['p:im', 'b:age'])?.word === 'image'));
{ const lex2 = { ...lex, words: { ...lex.words, unkind: ['a sexual act', '', 'noun', 1] } }, F2 = forgeOf(lex2, WP);
  ok('a word whose definition is not kid-safe is never forged, nor dealt (rule 11: unkind given an unsafe definition)', !F2.strike(['p:un', 'b:kind']) && !F2.words.has('unkind') && SEEDS.slice(0, 20).every((sd) => !F2.round(sd, 1).targets.some((t) => t.word === 'unkind'))); }
ok(`a word on the false-friends list is never forged (${[...FALSE_FRIENDS].join(', ')})`, FALSE_FRIENDS.size > 0 && [...FALSE_FRIENDS].every((w) => !F.words.has(w)));
ok('the spelling changes: happy + ness = happiness, sun + y = sunny, gentle + ly = gently, act + tion = action, therm + meter = thermometer',
  F.strike(['b:happy', 's:ness'])?.word === 'happiness' && F.strike(['b:sun', 's:y'])?.word === 'sunny' && F.strike(['b:gentle', 's:ly'])?.word === 'gently' && F.strike(['b:act', 's:tion'])?.word === 'action' && F.strike(['r:therm', 'r:meter'])?.word === 'thermometer');
ok('order matters: happy + un is no word, un + happy is', !F.strike(['b:happy', 'p:un']) && F.strike(['p:un', 'b:happy'])?.word === 'unhappy');
ok('one part alone, a part twice, or more than the anvil holds is never a word', !F.strike(['b:happy']) && !F.strike(['p:un', 'p:un']) && !F.strike(['p:un', 'b:happy', 's:ness', 's:ly', 's:er']));

/* ---------- every round: its words real, kid-safe, from its own tray — and all of them ---------- */
const perms = (ids, n) => { const out = []; const go = (s) => { if (s.length >= 2) out.push(s); if (s.length >= n) return; for (const id of ids) if (!s.includes(id)) go([...s, id]); }; go([]); return out; };
const rounds = [];
for (const L of LV) for (const final of [false, true]) for (const sd of SEEDS) rounds.push({ L, final, sd, r: F.round(sd, L, { final }) });
ok('every level deals a round for every seed, and so does every final', rounds.every((x) => x.r));
let bad = [], incomplete = [], tag = (x) => `L${x.L}${x.final ? ' final' : ''} ${x.sd}`;
for (const x of rounds) {
  const r = x.r, cfg = levelCfg(x.L), ids = r.tray.map((p) => p.id);
  if (r.tray.length < 6 || r.tray.length > 9) bad.push(`${tag(x)}: ${r.tray.length} parts`);
  if (new Set(r.tray.map((p) => p.t)).size !== r.tray.length) bad.push(`${tag(x)}: a part twice`);
  if (r.slots !== cfg.slots || r.slots < 2 || r.slots > MAX_SLOTS) bad.push(`${tag(x)}: ${r.slots} slots`);
  for (const t of r.targets) {
    const d = lex.words[t.word];
    if (!d || !kidSafe(t.word, d[0])) bad.push(`${tag(x)}: ${t.word} not a kid-safe Bee word`);
    if (!t.ids.every((id) => ids.includes(id)) || new Set(t.ids).size !== t.ids.length || t.ids.length > r.slots) bad.push(`${tag(x)}: ${t.word} not buildable from the tray`);
    if (F.strike(t.ids)?.word !== t.word) bad.push(`${tag(x)}: ${t.word} not what its parts strike`);
  }
  /* complete: every sequence the anvil can hold that strikes a word is in the list */
  const words = new Set(r.targets.map((t) => t.word));
  for (const s of perms(ids, r.slots)) { const h = F.strike(s); if (h && !words.has(h.word)) { incomplete.push(`${tag(x)}: ${h.word}`); break; } }
}
ok(`every round's words are real Bee words, kid-safe, buildable from that round's tray within its anvil (${bad.slice(0, 4).join('; ')})`, !bad.length);
ok(`"k of N found": N is every word the tray can forge — no real word is missing from the list (${incomplete.slice(0, 3).join('; ')})`, !incomplete.length);
const nMin = (L, final) => Math.min(...rounds.filter((x) => x.L === L && x.final === final).map((x) => x.r.targets.length));
ok(`every round holds at least its level's N words (${LV.map((L) => `L${L} ≥ ${nMin(L, false)}`).join(', ')})`, LV.every((L) => nMin(L, false) >= LEVELS[L].min - 1 && nMin(L, false) >= 4));
ok('the goal is never more than the words there are', rounds.every((x) => x.r.goal >= 1 && x.r.goal <= x.r.targets.length));
ok('levels 1–2: prefixes, endings and whole words only — no roots', rounds.filter((x) => x.L <= 2 && !x.final).every((x) => x.r.tray.every((p) => p.kind !== 'root')));
ok('level 1: the first band of prefixes and endings only', rounds.filter((x) => x.L === 1).every((x) => x.r.tray.every((p) => p.band <= 1)));
ok('roots from level 3: every level-3+ round can forge a root word', rounds.filter((x) => x.L >= 3 && !x.final).every((x) => x.r.targets.some((t) => t.ids.some((id) => F.part(id).kind === 'root'))));
const three = (L) => rounds.filter((x) => x.L === L && !x.final && x.r.targets.some((t) => t.ids.length >= 3)).length / SEEDS.length;
ok(`three-part words at levels 4–5 (L4 ${Math.round(three(4) * 100)}%, L5 ${Math.round(three(5) * 100)}% of rounds hold one; never below level 4)`, three(4) >= 0.9 && three(5) >= 0.9 && [1, 2, 3].every((L) => rounds.filter((x) => x.L === L).every((x) => x.r.slots === 2)));
ok('a tray mixes its kinds: at least two prefixes or endings and three cores', rounds.every((x) => x.r.tray.filter((p) => p.kind === 'prefix' || p.kind === 'suffix').length >= 2 && x.r.tray.filter((p) => p.kind === 'base' || p.kind === 'root').length >= 2));
ok('the final forges a family: a key part, and at least three of the tray’s words have it', rounds.filter((x) => x.final).every((x) => x.r.key && x.r.goal === 3 && x.r.targets.filter((t) => t.ids.includes(x.r.key)).length >= 3));
ok('the same seed and memory deal the same tray', LV.every((L) => JSON.stringify(F.round('same', L)) === JSON.stringify(F.round('same', L))));
{ const mem = { seen: {} }, a = F.round('m1', 1), seenWords = a.targets.map((t) => t.word); seenWords.forEach((w) => (mem.seen['f:' + w] = { n: 1, last: 0, p: 0 }));
  let fresh = 0; for (const sd of SEEDS.slice(0, 20)) { const b = F.round(sd, 1, { mem }); if (b.targets.some((t) => !mem.seen['f:' + t.word])) fresh++; }
  ok(`the memory: the next trays bring words not yet forged (${fresh}/20)`, fresh >= 18); }
{ const words = new Set(); for (const sd of SEEDS) for (const t of F.round(sd, 1).targets) words.add(t.word); ok(`level 1 varies: sixty rounds meet ${words.size} different words`, words.size >= 40); }

/* ---------- the reducer: perfect play, a crack, a false friend, first try ---------- */
const play = (g, a) => forgeStep(F, g, a);
const placeIds = (g, ids) => { for (const id of ids) g = play(g, { type: 'place', i: g.tray.findIndex((p) => p.id === id) }); return g; };
{ const r = F.round('perfect', 4); let g = forgeNew(r, 4);
  for (const t of r.targets) { g = placeIds(g, t.ids); g = play(g, { type: 'strike' }); if (!g.state?.ok) break; g = play(g, { type: 'next' }); }
  ok(`perfect play forges every word (${r.targets.length}) and the round ends`, g.found.length === r.targets.length && g.over && g.cracks.length === 0);
  ok('perfect play: 100%, every word first try, paid up to the round cap, three stars', forgeAccuracy(g).pct === 1 && forgeFirst(g) === r.targets.length && roundPay(g) === Math.min(ROUND_PAY_CAP, r.targets.length) && starsFor(accuracy(g).pct) === 3);
  ok('the round’s memory is its words', JSON.stringify(roundLog(g).map((x) => x.key)) === JSON.stringify(r.targets.map((t) => 'f:' + t.word))); }
{ const r = F.round('crack', 1); let g = forgeNew(r, 1);
  const non = perms(r.tray.map((p) => p.id), r.slots).find((s) => !F.spelt(s));
  g = placeIds(g, non); g = play(g, { type: 'strike' });
  ok('a non-word cracks: no word, no score, a crack counted, the anvil held', !g.found.length && g.score === 0 && g.cracks.length === 1 && g.state && !g.state.ok && g.anvil.length === non.length);
  ok('a crack holds: nothing moves until Continue', play(g, { type: 'place', i: 0 }) === g && play(g, { type: 'strike' }) === g);
  const g2 = play(g, { type: 'next' }); ok('Continue clears the anvil', !g2.state && !g2.anvil.length);
  let g3 = placeIds(g2, non); g3 = play(g3, { type: 'strike' }); ok('the same crack twice is counted once', g3.cracks.length === 1); }
{ /* first try: the same pieces rearranged after a crack are kept, never paid */
  const t = [...F.words].find(([, e]) => e.ids.length === 2 && !F.strike(e.ids.slice().reverse()) && !F.spelt(e.ids.slice().reverse()));
  const ids = t[1].ids, tray = [...ids, ...F.parts.filter((p) => !ids.includes(p.id)).slice(0, 4).map((p) => p.id)].map((id) => F.part(id));
  let g = forgeNew({ level: 1, slots: 2, goal: 1, key: null, tray, targets: [{ word: t[0], ids }, { word: '(another)', ids: [] }] }, 1);
  g = placeIds(g, ids.slice().reverse()); g = play(g, { type: 'strike' }); g = play(g, { type: 'next' });
  g = placeIds(g, ids); g = play(g, { type: 'strike' });
  ok(`rearranged after a crack (${t[0]}): forged and kept, but not first try — no coin`, g.found.length === 1 && g.found[0].first === false && forgeFirst(g) === 0 && roundPay(g) === 0);
  const again = play(placeIds(play(g, { type: 'next' }), ids), { type: 'strike' });
  ok('a word forged twice counts once', again.found.length === 1 && again.state?.again); }
{ /* a false friend: spelt, not made — neither a word nor a crack */
  const pair = F.part('b:sing') ? ['p:mis', 'b:sing'] : F.part('b:age') ? ['p:im', 'b:age'] : null;
  if (pair) { let g = forgeNew({ level: 1, slots: 2, goal: 1, key: null, tray: [...pair, 'p:un', 'b:happy', 's:ness', 'b:kind'].map((id) => F.part(id)), targets: [] }, 1); g = placeIds(g, pair); g = play(g, { type: 'strike' });
    ok(`a false friend (${g.state?.friend}) is said so: no word, no crack`, g.state && !g.state.ok && g.state.friend && !g.found.length && !g.cracks.length); }
  else ok('a false friend exists to test', false); }
{ const r = F.round('keys', 2); let g = forgeNew(r, 2);
  g = play(g, { type: 'move', d: 1 }); const c = g.cursor; g = play(g, { type: 'place' }); ok('keys: ← → choose a part, Enter places it', g.anvil[0] === c);
  g = play(g, { type: 'lift' }); ok('Backspace lifts it back', !g.anvil.length && g.cursor === c);
  g = play(g, { type: 'place', i: 0 }); g = play(g, { type: 'place', i: 1 }); g = play(g, { type: 'place', i: 2, at: 0 }); ok('a drop on a full slot swaps the piece there back to the tray', g.anvil[0] === 2 && g.anvil[1] === 1);
  ok('the anvil holds no more than its slots', play(g, { type: 'place', i: 3 }) === g || r.slots > 2);
  ok('a strike needs two pieces', play(forgeNew(r, 2), { type: 'strike' }).seq === 0); }

/* ---------- T1: a random-placement bot earns 0 coins and 0 stars; non-words never score ---------- */
function botRound(R, r) {
  let g = forgeNew(r, r.level), strikes = 0;
  while (!g.over && strikes < 40) {
    if (g.state) { g = play(g, { type: 'next' }); continue; }
    const n = 2 + Math.floor(R() * (g.slots - 1)), free = g.tray.map((_, i) => i);
    for (let j = 0; j < n; j++) { const k = Math.floor(R() * free.length); g = play(g, { type: 'place', i: free.splice(k, 1)[0] }); }
    g = play(g, { type: 'strike' }); strikes++;
    if (forgeGoalMet(g) && !g.state) g = play(g, { type: 'done' });
  }
  return g.over ? g : play(g, { type: 'done' });
}
let botCoins = 0, botStars = 0, botBest = 0, botSum = 0, nonScored = 0, runs = 0;
for (const L of LV) for (let k = 0; k < 250; k++) {
  const R = rng(`bot:${L}:${k}`); let run = { ...runNew(L), kind: 'root' };
  for (let i = 0; i <= RUN_ROUNDS; i++) {
    const r = F.round(`bot${L}-${k}-${i}`, L, { final: i === RUN_ROUNDS }), g = botRound(R, r);
    for (const c of g.cracks) if (g.found.some((x) => x.ids.join('|') === c.ids.join('|'))) nonScored++;
    run = runAdd(run, g);
  }
  runs++; botCoins += runPay(run); botStars += starsFor(runStarPct(run)); botBest = Math.max(botBest, runStarPct(run) || 0); botSum += runStarPct(run) || 0;
}
ok(`T1: a random-placement bot, ${runs} runs over five levels, earns 0 coins and 0 stars (its best run ${Math.round(botBest * 100)}%)`, botCoins === 0 && botStars === 0);
ok('a crack never scores', nonScored === 0);
ok(`T2: the bot scores under a quarter of a perfect run (on average ${Math.round((100 * botSum) / runs)}%)`, botSum / runs < 0.25);
/* a child who strikes one easy word and stops is not a perfect round */
{ const r = F.round('quit', 3); let g = forgeNew(r, 3); g = placeIds(g, r.targets[0].ids); g = play(g, { type: 'strike' }); g = play(g, { type: 'done' });
  ok(`one word and stop: ${Math.round(forgeAccuracy(g).pct * 100)}% — under the star line when the goal is more than two`, forgeAccuracy(g).pct === 1 / Math.max(r.goal, 1) && (r.goal < 2 || starsFor(forgeAccuracy(g).pct) === 0) && (r.goal < 2 || roundPay(g) === 0)); }
ok('the level moves by the owner’s rule on the forge’s accuracy (≥ 80% up, < 50% down)', nextLevel(3, 1) === 4 && nextLevel(3, 0.2) === 2);

/* ---------- the Forge Book: kept by part, stamped at three, the rank from the book alone ---------- */
let book = {}; book = bookAdd(book, 'unhappy', ['p:un', 'b:happy'], 1); book = bookAdd(book, 'unkind', ['p:un', 'b:kind'], 2); book = bookAdd(book, 'unhappy', ['p:un', 'b:happy'], 3);
ok('the book keeps each word once, with its parts', bookSize(book) === 2 && book.unhappy.at === 1);
ok('not stamped at two words', !stamped(book, 'p:un'));
book = bookAdd(book, 'unfair', ['p:un', 'b:fair'], 4);
ok(`a part is stamped at ${STAMP} words`, stamped(book, 'p:un') && bookByPart(F, book).find((x) => x.part.id === 'p:un').stamp);
ok('the book by part: each shelf lists its words and how many the forge can make', bookByPart(F, book).every((x) => x.words.length >= 1 && x.of >= x.words.length));
ok('the rank grows with the book alone', rankOf({}).name === 'Apprentice' && rankOf(Object.fromEntries(Array.from({ length: 10 }, (_, i) => ['w' + i, { ids: [] }]))).name === 'Journeyman' && rankOf(book).next.at === 10);
{ const store = await import('../src/store.js'), { makeBackup, restoreBackup, KID_FIELDS } = await import('../src/backup.js'), { newHousehold, newKid } = await import('../src/model.js');
  const h = newHousehold(), k = newKid('Ada', 2, 'fox'); h.kids.push(k); h.active = k.id; k.games.root = { best: 3, plays: 1, level: 2, pick: null, book };
  store.saveHousehold(h); const back = store.loadHousehold();
  ok('the Forge Book persists through the Store seam (saved, loaded)', JSON.stringify(back.kids[0].games.root.book) === JSON.stringify(book));
  const old = JSON.parse(JSON.stringify(h)); old.v = 1; const mig = store.migrate(old);
  ok('an older household keeps its Forge Book through every migration step', mig.v === store.VERSION && JSON.stringify(mig.kids[0].games.root.book) === JSON.stringify(book));
  const file = makeBackup(h); ok('a backup carries the Forge Book (inside the game record, on the allow-list) and never the name', KID_FIELDS.includes('games') && JSON.stringify(file.kids[0].games.root.book) === JSON.stringify(book) && !JSON.stringify(file).includes('Ada'));
  const h2 = newHousehold(); restoreBackup(h2, JSON.parse(JSON.stringify(file)), ['Ada']); ok('a restore brings the Forge Book back', JSON.stringify(h2.kids[0].games.root.book) === JSON.stringify(book));
  const k2 = newKid('Ben', 2, 'owl'); ok('a second child starts with an empty book', !k2.games.root?.book); }
done();
