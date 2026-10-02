/* games.js — the games' rules as pure reducers (state, action) → state, so test/games.mjs can play
   them both ways and soak them for 60 simulated seconds with overlapping events (Finance's Change
   Rush froze for good once when a loop spliced an array it had cleared). The learning IS the
   mechanic; nothing is random in scoring; a round is 60 seconds.

   Sentence Builder — join a main clause and a dependent clause with their subordinator, in either
     order: "When the rain stopped, the children ran outside." or "The children ran outside when the
     rain stopped." Scored on correctness, then variety: building the other order earns a bonus.
   Punctuation Rush — sentences arrive one at a time with their commas taken out; tap the gaps that
     need them. +1 a right comma, −1 a wrong one (never below zero), a clean sentence +1.
   Who Said It? — a line from a held text: which character or author said it? */

import { rng, shuffle, sample } from './rand.js';
import { MAIN_CLAUSE, COMMAS } from './data/sentences.js';

export const ROUND_MS = 60000;
const SUBS = /^(when|because|if|although|after|before|while|until|since|as|unless|once|whenever|though)\b/i;

/* ---------- Sentence Builder ---------- */
export function builderPool(band = 3) {
  return MAIN_CLAUSE.map((x, i) => ({ ...x, i })).filter((x) => (x.band || 1) <= band).map((x) => {
    const m = x.s.match(/^(.*)\[(.+)\](.*)$/); const before = m[1].replace(/,\s*$/, '').trim(), after = m[3].replace(/^[,\s]+/, '').replace(/[.!?]$/, '').trim();
    const dep = (before || after).trim(), main = m[2].trim();
    const sm = dep.match(SUBS); if (!sm) return null;
    return { id: x.i, sub: sm[1].toLowerCase(), dep: dep.slice(sm[1].length).trim(), main: main.replace(/[.!?]$/, ''), end: x.s.trim().slice(-1), band: x.band };
  }).filter(Boolean);
}
export function builderNew(seed, band) {
  const pool = shuffle(rng('builder:' + seed), builderPool(band));
  return { kind: 'builder', t: 0, over: false, score: 0, built: 0, wrong: 0, lastOrder: null, variety: 0, pool, n: 0, picks: [], flash: null, cur: tilesFor(pool[0], seed) };
}
function tilesFor(it, seed) {
  if (!it) return null;
  const subWord = it.sub.charAt(0).toUpperCase() + it.sub.slice(1);
  const tiles = shuffle(rng('t:' + seed + it.id), [{ k: 'sub', text: it.sub }, { k: 'dep', text: it.dep }, { k: 'main', text: it.main }]);
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
    if (!order) return { ...s, picks: [], wrong: s.wrong + 1, flash: { ok: false, text: 'Not a sentence yet — which part could stand alone?' } };
    const bonus = s.lastOrder && s.lastOrder !== order ? 1 : 0;
    const n = s.n + 1, next = s.pool[n % s.pool.length];
    return { ...s, picks: [], score: s.score + 2 + bonus, built: s.built + 1, variety: s.variety + bonus, lastOrder: order, n, cur: tilesFor(next, 'r' + n), flash: { ok: true, text: builderSentence(s.cur, order), bonus } };
  }
  if (a.type === 'undo') return { ...s, picks: s.picks.slice(0, -1) };
  return s;
}

/* ---------- Punctuation Rush ---------- */
export function rushPool(band = 3) {
  return COMMAS.map((x, i) => ({ ...x, i })).filter((x) => (x.band || 1) <= band).map((x) => {
    const words = x.s.split(/\s+/); return { id: x.i, rule: x.rule, words: words.map((w) => w.replace(/,$/, '')), commas: words.map((w, j) => (w.endsWith(',') ? j : -1)).filter((j) => j >= 0), s: x.s };
  });
}
export function rushNew(seed, band) {
  const pool = shuffle(rng('rush:' + seed), rushPool(band));
  return { kind: 'rush', t: 0, over: false, score: 0, right: 0, wrongs: 0, clean: 0, pool, n: 0, sel: [], cursor: 0, flash: null, cur: pool[0] || null };
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
    const clean = !wrong && !missed ? 1 : 0;
    const n = s.n + 1;
    return { ...s, score: Math.max(0, s.score + right - wrong + clean), right: s.right + right, wrongs: s.wrongs + wrong + missed, clean: s.clean + clean, n, sel: [], cursor: 0,
      cur: s.pool[n % s.pool.length], flash: { ok: !!clean, text: s.cur.s, rule: s.cur.rule } };
  }
  return s;
}

/* ---------- Who Said It? ---------- */
export function whoRound(lines, works, seed, n = 8) {
  const R = rng('who:' + seed), who = (l) => l.who.split(',')[0].trim();
  const all = [...new Set(lines.map(who))];
  return sample(R, lines.filter((l) => l.text.length <= 160), n).map((l, i) => {
    const right = who(l), wrong = sample(rng('w' + seed + i), all.filter((x) => x !== right), 3);
    const opts = shuffle(rng('o' + seed + i + l.text), [right, ...wrong]);
    return { text: l.text, work: works.find((w) => w.id === l.work)?.title || '', options: opts, answer: opts.indexOf(right), right };
  });
}
