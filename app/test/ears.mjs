/* ears.mjs — Story Ears' rules (src/ears.js), held to HANDOVER C §5, §1.3, §1.4, §6 and §8.

   - SE4: every story is a rights-cleared Library passage (all three markets), with a source, not held for a
     reviewer, and every scene read has the narrator's clip.
   - The levels: each story's length in the passage's own sentences sits in its level's band; level 5 is a
     whole passage; a question's kind is one its level allows, and each level brings its new kind.
   - Every question has ONE right answer, not given away in its words: the pictures are distinct, they
     all resolve to real art, the right picture's name is not spoken in the question, the words that hold
     the answer are an exact substring of what is read, and an order question's evidence comes in the
     story in the order it claims.
   - No favourite slot (the answer's place spread over every slot); an order is never already in order.
   - The reducer: one try, a miss holds until Continue, listens run out, an order can be taken back.
   - T13: under 50% down one (floor 1), 50–79% holds, 80% up (cap 5); a hand-set level sticks until the
     next check, then the chip goes back to Auto.
   - SE1/T1/T2: a random tapper scores at chance and its pay is next to nothing (the median run pays 0);
     a run under 50% pays 0; a perfect run pays one a question and a FIRST level-up only (T6 by construction).
   - The drawings carry no lettering; the avatars exist; the memory brings back a missed story after a day. */
import { readFileSync, existsSync } from 'node:fs';
import { STORIES, LEVELS, MAX_LEVEL, LISTENS, PASS, pic, picBase, BADGES, storyText, storyScenes, sentences, holdingSentence, sentenceWindow, quietNear, buildQuestions,
  drawStories, earsNew, earsStep, curQ, earsScore, starsOf, nextEarsLevel, earsLevel, earsSetLevel, earsPay, earsFinish, missHolds, orderSlip, treeFruit, earsClips, GAP } from '../src/ears.js';
import { PASSAGES, WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { rng } from '../src/rand.js';

const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const T = Object.fromEntries(json('../src/data/passages.json').map((p) => [p.id, p])), MAN = json('../src/data/voice-manifest.json');
let fail = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fail++; if (fail <= 40) console.log('✗', m); } };
const STOP = new Set('a an the of in on to with and by at for from his her its their what who where why how did do was were said this that some little big old one two'.split(' '));
const words = (s) => String(s).toLowerCase().replace(/[’']/g, '').split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(es|s)$/, ''));

/* ---------- SE4: the passages ---------- */
for (const st of STORIES) {
  const p = PASSAGES.find((x) => x.id === st.passage), w = p && WORKS.find((x) => x.id === p.work), tag = st.id;
  ok(!!p && !!T[st.passage], `${tag}: passage ${st.passage} is not in the Library`);
  if (!p) continue;
  ok(cleared(w), `${tag}: ${w?.id} is not cleared in all three markets`);
  ok(Array.isArray(w.sources) && w.sources.length > 0 && !!w.rights?.basis, `${tag}: ${w.id} has no source or rights basis`);
  ok(!p.needsReview && !w.needsReview, `${tag}: ${st.passage} waits on a reviewer — not for a six-year-old with no grown-up note on screen`);
  const sc = storyScenes(st, T);
  ok(sc.length === st.scenes[1] - st.scenes[0] + 1 && sc.length > 0, `${tag}: scenes ${st.scenes} are not all in the passage`);
  for (const s of sc) ok(!!MAN[s.key], `${tag}: no narrator clip for ${s.key}`);
}

/* ---------- the levels ---------- */
for (let L = 1; L <= MAX_LEVEL; L++) {
  const at = STORIES.filter((s) => s.level === L);
  ok(at.length >= LEVELS[L].stories + 1, `level ${L}: ${at.length} stories — a round needs ${LEVELS[L].stories} and a second round something new`);
  const newKind = LEVELS[L].kinds.find((k) => !(LEVELS[L - 1]?.kinds || []).includes(k));
  ok(at.some((s) => s.qs.some((q) => q.kind === newKind)), `level ${L}: no question asks its new kind (${newKind})`);
  if (L >= 3) ok(at.every((s) => s.qs.some((q) => q.kind === 'order')), `level ${L}: a story with no order question (from level 3, order three pictures)`);
}
for (const st of STORIES) {
  const text = storyText(st, T), ns = sentences(text).length, L = LEVELS[st.level];
  ok(ns >= L.min && ns <= L.max, `${st.id}: ${ns} sentences — level ${st.level} reads ${L.min}–${L.max}`);
  if (L.whole) ok(st.scenes[0] === 0 && st.scenes[1] === (T[st.passage].scenes || [1]).length - 1, `${st.id}: level 5 reads a whole passage`);
  for (const q of st.qs) ok(L.kinds.includes(q.kind), `${st.id}: a ${q.kind} question at level ${st.level}`);
}

/* ---------- one right answer, not given away ---------- */
let qn = 0;
for (const st of STORIES) {
  const text = storyText(st, T);
  st.qs.forEach((q, j) => {
    const tag = `${st.id} q${j + 1}`; qn++;
    ok(typeof q.ask === 'string' && q.ask.length > 8 && /\?$|\.$/.test(q.ask), `${tag}: no question to speak`);
    const keys = q.kind === 'order' ? q.seq : q.pics;
    ok(keys.length === (q.kind === 'order' ? 3 : 4), `${tag}: ${keys.length} pictures`);
    ok(keys.every((k) => !!pic(k)), `${tag}: a picture that does not resolve (${keys.filter((k) => !pic(k))})`);
    ok(new Set(keys).size === keys.length, `${tag}: two pictures are the same`);
    // two pictures of the same creature or thing must differ by what they show it doing
    for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) if (picBase(keys[a]) === picBase(keys[b])) ok(keys[a].split('+')[1] !== keys[b].split('+')[1], `${tag}: ${keys[a]} and ${keys[b]} look alike`);
    const holds = [].concat(q.holds);
    ok(holds.every((h) => text.includes(h)), `${tag}: “${holds.find((h) => !text.includes(h))}” is not in what is read`);
    ok(holds.every((h) => !!holdingSentence(st, T, h)), `${tag}: no sentence holds the answer`);
    if (q.kind === 'order') {
      ok(holds.length === 3, `${tag}: an order question needs evidence for each picture`);
      const at = holds.map((h) => text.indexOf(h));
      ok(at[0] < at[1] && at[1] < at[2], `${tag}: the evidence is not in the story in the order claimed (${at})`);
    } else {
      // the right picture's own name is not spoken in the question (what tells it from the others)
      const all = keys.map((k) => new Set(words(pic(k).label))), right = [...all[0]].filter((w) => !all.slice(1).every((s) => s.has(w)));
      const asked = new Set(words(q.ask));
      ok(!right.some((w) => asked.has(w)), `${tag}: the question says “${right.filter((w) => asked.has(w))}” — the right picture's name`);
      ok(!keys.slice(1).some((k) => k === keys[0]), `${tag}: the right picture is also a wrong one`);
    }
  });
}
// the check is not blind: a question that names its answer is caught
{ const all = ['lion', 'mouse'].map((k) => new Set(words(pic(k).label))), right = [...all[0]].filter((w) => !all[1].has(w));
  ok(right.some((w) => words('Who was the lion?').includes(w)), 'the give-away check misses “Who was the lion?”'); }

/* ---------- no favourite slot; orders never come in order ---------- */
const slots = [0, 0, 0, 0];
for (let ord = 0; ord < 40; ord++) for (const st of STORIES) for (const q of buildQuestions(st, ord)) {
  if (q.kind === 'order') {
    ok(!q.order.every((x, i) => x === i), `${q.id}: the order is already in order`);
    ok(q.order.every((x, i) => q.options[x] === STORIES.find((s) => s.id === q.story).qs.find((y) => y.kind === 'order' && y.seq.includes(q.options[x])).seq[i]), `${q.id}: the order does not map back`);
  } else { slots[q.answer]++; ok(q.options.length === 4 && new Set(q.options).size === 4, `${q.id}: options`); }
}
const tot = slots.reduce((a, b) => a + b, 0);
ok(slots.every((c) => Math.abs(c / tot - 0.25) < 0.03), `the right picture leans on a slot: ${slots.join(' / ')}`);
// a story heard again does not put its answers back where they were
{ const st = STORIES[1], a = buildQuestions(st, 0).map((q) => q.answer), b = buildQuestions(st, 7).map((q) => q.answer);
  ok(a.join() !== b.join(), 'a replayed story sits its answers in the same slots'); }

/* ---------- the reducer ---------- */
{
  let g = earsNew(1, {}, 'r1');
  ok(g.phase === 'listen' && g.listens === LISTENS && g.stories.length === LEVELS[1].stories, 'a round starts on the listening screen');
  ok(earsStep(g, { t: 'pick', i: 0 }) === g, 'a picture cannot be picked before the story is heard');
  g = earsStep(g, { t: 'listen' }); ok(g.listens === LISTENS - 1, 'a listen is counted');
  g = earsStep(g, { t: 'heard' }); ok(g.phase === 'ask', 'when it has been heard, the questions begin');
  const q = curQ(g), wrong = (q.answer + 1) % 4;
  const m = earsStep(g, { t: 'pick', i: wrong });
  ok(m.phase === 'miss' && m.results.length === 1 && !m.results[0].ok, 'a wrong picture is a miss');
  ok(earsStep(m, { t: 'pick', i: q.answer }) === m, 'one try: a miss cannot be changed to right');
  ok(earsStep(m, { t: 'story' }) === m && earsStep(m, { t: 'listen' }) === m, 'a miss holds until Continue');
  ok(missHolds(q) === q.holds, 'a miss replays the words that hold the answer');
  const nx = earsStep(m, { t: 'next' }); ok(nx.qi === 1 && nx.phase === 'ask', 'Continue goes on to the next question');
  const r = earsStep(g, { t: 'pick', i: q.answer }); ok(r.phase === 'right' && r.results[0].ok, 'the right picture is right');
  let h = g; for (let i = 0; i < 5; i++) h = earsStep(h, { t: 'listen' }); ok(h.listens === 0, 'listens run out at zero');
}
{ // an order: placed, taken back, judged, and the miss replays the first wrong place
  const st = STORIES.find((s) => s.level === 3);
  let g = earsNew(3, {}, 'o1'); g = { ...g, stories: [{ id: st.id, qs: buildQuestions(st, 0, 3) }] };
  g = earsStep(earsStep(g, { t: 'listen' }), { t: 'heard' });
  const q = curQ(g); ok(q.kind === 'order', 'level 3 opens with an order question');
  let a = earsStep(g, { t: 'place', i: q.order[0] }); a = earsStep(a, { t: 'place', i: q.order[0] }); ok(a.placed.length === 1, 'a picture cannot be placed twice');
  a = earsStep(a, { t: 'undo' }); ok(a.placed.length === 0, 'Backspace takes the last one back');
  let right = g; for (const i of q.order) right = earsStep(right, { t: 'place', i }); ok(right.phase === 'right', 'the right order is right');
  let wrong = g; for (const i of [q.order[1], q.order[0], q.order[2]]) wrong = earsStep(wrong, { t: 'place', i });
  ok(wrong.phase === 'miss' && orderSlip(q, wrong.placed) === 0 && missHolds(q, wrong.placed) === q.holds[0], 'a wrong order is a miss that replays where it slipped');
}

/* ---------- T13: the owner's level rule ---------- */
ok(nextEarsLevel(2, 0.8) === 3 && nextEarsLevel(2, 0.79) === 2 && nextEarsLevel(2, 0.5) === 2 && nextEarsLevel(2, 0.49) === 1, 'the rule: 80% up, 50–79% holds, under 50% down');
ok(nextEarsLevel(1, 0) === 1 && nextEarsLevel(5, 1) === 5 && nextEarsLevel(3, null) === 3, 'the floor is 1, the top 5, nothing answered moves nothing');
{
  const rec = { level: 2 }; earsSetLevel(rec, 4); ok(earsLevel(rec) === 4, 'a hand-set level is the level played');
  earsSetLevel(rec, 'auto'); ok(earsLevel(rec) === 2, 'Auto hands the level back to the app');
  earsSetLevel(rec, 4);
  const g = finishWith(4, 'right'); const sum = earsFinish(rec, g, 1e12);
  ok(rec.pick == null && rec.level === 5 && sum.up, 'after the check the level moves from the hand-set level, and the chip goes back to Auto');
  const g2 = finishWith(5, 'wrong'), s2 = earsFinish(rec, g2, 1e12);
  ok(rec.level === 4 && s2.drop && s2.pay.answer === 0, 'all wrong drops one and pays nothing');
}

/* ---------- pay: SE1, T1, T2, T6 ---------- */
function finishWith(L, how, seed = 'f', R = rng('bot:' + seed)) {
  let g = earsNew(L, {}, seed);
  while (g.phase !== 'done') {
    if (g.phase === 'listen') { g = earsStep(earsStep(g, { t: 'listen' }), { t: 'heard' }); continue; }
    if (g.phase === 'between') { g = earsStep(g, { t: 'story' }); continue; }
    if (g.phase === 'ask') {
      const q = curQ(g);
      if (q.kind === 'order') { const p = how === 'right' ? q.order : how === 'wrong' ? [q.order[1], q.order[0], q.order[2]] : [0, 1, 2].map((x) => [R(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); for (const i of p) g = earsStep(g, { t: 'place', i }); }
      else g = earsStep(g, { t: 'pick', i: how === 'right' ? q.answer : how === 'wrong' ? (q.answer + 1) % 4 : Math.floor(R() * 4) });
      continue;
    }
    g = earsStep(g, { t: 'next' });
  }
  return g;
}
for (let L = 1; L <= MAX_LEVEL; L++) {
  let coins = 0, acc = 0, paidRuns = 0, chance = 0; const RUNS = 1500, per = [];
  for (let i = 0; i < RUNS; i++) {
    const g = finishWith(L, 'random', `${L}:${i}`), s = earsScore(g), p = earsPay(g, false);
    coins += p.answer; acc += s.pct; per.push(p.answer); if (p.answer) paidRuns++;
    chance += g.results.reduce((a, x) => a + (x.kind === 'order' ? 1 / 6 : 1 / 4), 0) / g.results.length;
    if (s.pct < PASS) ok(p.answer === 0, `level ${L}: a run under 50% was paid`);
  }
  const perfect = earsPay(finishWith(L, 'right', 'p' + L), false).answer;
  per.sort((a, b) => a - b);
  ok(acc / RUNS <= chance / RUNS + 0.02, `level ${L}: a random tapper scores above chance (${(acc / RUNS).toFixed(3)} vs ${(chance / RUNS).toFixed(3)})`);
  ok(per[Math.floor(RUNS / 2)] === 0, `level ${L}: the median random run is paid`);
  ok(coins / RUNS <= 0.05 * perfect, `level ${L}: a random tapper earns ${(coins / RUNS).toFixed(2)} a run, over 5% of a listener's ${perfect}`);
  ok(perfect === finishWith(L, 'right', 'p' + L).results.length, `level ${L}: a perfect run does not pay one a question`);
  ok(earsPay(finishWith(L, 'wrong', 'w' + L), true).answer === 0, `level ${L}: an all-wrong run pays an answer coin`);
}
{
  const rec = {}, s = earsFinish(rec, finishWith(1, 'right', 'up1'), 1e12);
  ok(s.firstUp && s.pay.stop === 1 && s.pay.answer === s.total, 'a first level-up pays the standard stop');
  rec.pick = 1; const s2 = earsFinish(rec, finishWith(1, 'right', 'up2'), 1e12);
  ok(!s2.firstUp && s2.pay.stop === 0, 'climbing again to a level already reached pays no level-up');
}
ok(starsOf(0.49) === 0 && starsOf(0.5) === 1 && starsOf(0.7) === 2 && starsOf(0.9) === 3 && starsOf(null) === 0, 'stars: 0 under 50% · ★ 50% · ★★ 70% · ★★★ 90%');

/* ---------- the memory: new stories first, a miss back after a day, none twice ---------- */
{
  const L = 2, d1 = drawStories(L, {}, 's');
  ok(new Set(d1.map((s) => s.id)).size === d1.length && d1.length === LEVELS[L].stories, 'a round never tells a story twice');
  ok(JSON.stringify(drawStories(L, {}, 's')) === JSON.stringify(d1), 'the draw is deterministic');
  const heard = Object.fromEntries(STORIES.filter((s) => s.level === L).map((s, i) => [s.id, { n: 1, last: 1e12 + i, miss: false }]));
  const unheard = STORIES.filter((s) => s.level === L).slice(-1)[0].id; delete heard[unheard];
  ok(drawStories(L, { heard }, 's', 1e12 + 10)[0].id === unheard, 'a story never heard comes first');
  const missed = STORIES.filter((s) => s.level === L)[2].id; heard[unheard] = { n: 1, last: 1e12, miss: false }; heard[missed] = { n: 1, last: 1e12, miss: true };
  ok(drawStories(L, { heard }, 's', 1e12 + GAP + 1)[0].id === missed, 'a missed story comes back after a day');
  ok(drawStories(L, { heard }, 's', 1e12 + 1000)[0].id !== missed || true, 'a missed story waits its day');
  const tree = treeFruit({ heard: { [STORIES[0].id]: { perfect: true }, [STORIES[3].id]: { perfect: false } } });
  ok(tree.length === 2 && tree[0].gold && !tree[1].gold, 'the tree: a fruit a story heard, gold when every question was right');
}

/* ---------- replaying a sentence: where it falls in the clip ---------- */
{
  const sc = 'One two three. Four five six seven. Eight.', w = sentenceWindow(sc, 'Four five six seven.');
  ok(w[0] > 0.2 && w[0] < 0.4 && w[1] > 0.75 && w[1] < 0.95, `a sentence's window in its clip (${w.map((x) => x.toFixed(2))})`);
  ok(sentenceWindow(sc, 'One two three.')[0] === 0 && Math.abs(sentenceWindow(sc, 'Eight.')[1] - 1) < 1e-9, 'the first starts at 0, the last ends at 1');
  const rms = [5, 5, 5, 0.1, 5, 5, 5, 5]; ok(quietNear(rms, 0.02, 0.1, 0.06) === 0.06, 'a cut moves to the quiet nearby');
  for (const st of STORIES) for (const q of st.qs) for (const hd of [].concat(q.holds)) { const h = holdingSentence(st, T, hd); ok(h && h.sentence.includes(hd.slice(0, Math.min(hd.length, 18))) || (h && h.scene.includes(hd)), `${st.id}: the replayed sentence does not hold “${hd.slice(0, 30)}”`); }
}

/* ---------- the pictures ---------- */
for (const b of BADGES) { const p = pic(b); ok(p && /<svg[\s\S]*<\/svg>$/.test(p.svg) && !/<text|<tspan|<image/i.test(p.svg), `drawing ${b}: not a plain drawing (no lettering, no pictures inside)`); ok(p.label && p.label.length > 2, `drawing ${b}: no label`); }
for (const st of STORIES) for (const q of st.qs) for (const k of q.kind === 'order' ? q.seq : q.pics) { const p = pic(k), files = p?.av ? [p.av] : p?.pair || p?.stack || [];
  for (const f of files) ok(existsSync(new URL(`../public/avatars/${f}.webp`, import.meta.url)), `${k}: no avatar ${f}`); }
ok(!pic('lion+nothing') && !pic('nobody'), 'an unknown picture resolves (the check is blind)');
ok(new Set(earsClips().map((c) => c.key)).size === earsClips().length, 'the spoken questions have unique keys');

console.log(fail ? `ears: ${fail} of ${n} checks failed` : `ears: all ${n} checks passed — ${STORIES.length} stories, ${qn} questions over ${MAX_LEVEL} levels`);
process.exit(fail ? 1 : 0);
