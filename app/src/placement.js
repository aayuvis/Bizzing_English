/* placement.js — "Find my starting place": a three-minute check that sets where a new child starts on
   the Word and Reading roads, instead of only the age band's head start (audit A6). Pure: no DOM.

   The word part is EIGHT meaning questions in four tiers of two, each tier the Word level whose
   questions it asks, climbing:
     tier 1 · Word 2  what a word means (Bee's meanings, kidSafe — items.js word2def)
     tier 2 · Word 3  what a prefix means
     tier 3 · Word 4  what a suffix means
     tier 4 · Word 5  what a Latin or Greek root means
   Two misses in a row end the word part early. The reading part is ONE held passage, read on screen,
   at a level the word part points to, with three of its own questions (items.js passageItems).

   Scoring (scoreWord, scoreReading):
     Word     a tier is CLEARED when both its questions are right; tiers count from the bottom and stop
              at the first one not cleared. The start is the level of the hardest tier cleared (none → 1).
     Reading  the passage's level L comes from the word start (1–2 → fables, 3 → fairy tales, 4–5 →
              children's classics); three right → L + 1, two → L, fewer → L − 1.
   Both are held between a floor (one below the band's start: a twelve-year-old who stumbles twice
   still does not begin on rhymes) and 5, the cap headStart keeps.

   What placement does: it writes k.place = { word, reading, at }, which model.headStart reads to open
   levels. What it never does: mark a stop passed, pay a coin, touch mastery (mastery.js is the only
   door), count a day's answers or add to the mistakes deck. Taken again later, it only moves a start
   forward — never takes away a level that is already open. */

import { make, keys, passageItems } from './items.js';
import { rng, shuffle } from './rand.js';
import { passage, levelOf, shippable } from './reading.js';
import { bandStart, headStart } from './model.js';
import { kidSafe } from './safe.js';

export const TIERS = [
  { level: 2, kind: 'word2def', title: 'what a word means' },
  { level: 3, kind: 'prefixMeaning', title: 'prefixes' },
  { level: 4, kind: 'suffixMeaning', title: 'suffixes' },
  { level: 5, kind: 'rootMeaning', title: 'Latin and Greek roots' },
];
export const PER_TIER = 2;
export const WORD_N = TIERS.length * PER_TIER;      // 8
export const READ_N = 3;
export const CAP = 5;
/* one short held passage per reading level the check can ask at: Aesop, Grimm, Kipling (test/placement.mjs
   holds each to: shipped in all three markets, no review pending, on that level, three or more questions) */
export const PASSAGE_FOR = { 1: 'aesop-hare-tortoise', 2: 'grimm-old-man', 3: 'jungle-mowgli' };

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const DEF = 0, Y = 3;
export const floorOf = (band) => Math.max(1, bandStart({ band }) - 1);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* the right answer of an item, normalised, and the "thing" it is about (a prefix, a root, a word), so no
   two questions in one check ask the same thing or share an answer */
const rightOf = (it) => norm(it.options[it.answer]);
const subjectOf = (kind, key) => (kind === 'word2def' ? key : key.split(':')[0]);

/* The eight word questions for a child. `seed` varies the draw (the child's id, and which try this is). */
export function wordItems(lex, seed = '') {
  const R = rng('place:' + seed), out = [], used = new Set(), answers = new Set();
  for (const t of TIERS) {
    const ctx = t.kind === 'word2def' ? { band: 1, lex } : { band: 3, lex };
    let ks = keys(t.kind, ctx);
    if (t.kind === 'word2def') {
      const L = lex?.words || {};
      ks = ks.filter((w) => kidSafe(w, L[w][DEF]) && /^[a-z]+$/.test(w) && !/s$/.test(w));   // a plain headword: no plurals ("dudes")
      /* the first is a short Bee year-1 word, the second a year-2 word: the climb starts inside the tier */
      const pools = [ks.filter((w) => L[w][Y] === 1 && w.length <= 6), ks.filter((w) => L[w][Y] === 2 && w.length <= 9)];
      for (const pool of pools) for (const w of shuffle(R, pool)) { const it = make(t.kind, w, ctx); if (it.options.length === 4 && !answers.has(rightOf(it))) { out.push(it); used.add(w); answers.add(rightOf(it)); break; } }
      continue;
    }
    let n = 0;
    for (const key of shuffle(R, ks)) {
      if (n >= PER_TIER) break;
      const sub = subjectOf(t.kind, key); if (used.has(t.kind + sub)) continue;
      const it = make(t.kind, key, ctx); if (it.options.length !== 4 || answers.has(rightOf(it))) continue;
      out.push(it); used.add(t.kind + sub); answers.add(rightOf(it)); n++;
    }
  }
  return out.map((it, i) => ({ ...it, tier: Math.floor(i / PER_TIER) }));
}

/* the word part ends early on two misses in a row */
export const wordOver = (answers) => answers.length >= WORD_N || (answers.length >= 2 && !answers.at(-1) && !answers.at(-2));

export function scoreWord(answers, band) {
  let cleared = 0;
  for (let t = 0; t < TIERS.length; t++) { const a = answers.slice(t * PER_TIER, (t + 1) * PER_TIER); if (a.length === PER_TIER && a.every(Boolean)) cleared++; else break; }
  return clamp(cleared ? TIERS[cleared - 1].level : 1, floorOf(band), CAP);
}

export const passageLevelFor = (wordStart) => (wordStart <= 2 ? 1 : wordStart === 3 ? 2 : 3);
export function scoreReading(right, level, band) {
  return clamp(level + (right >= READ_N ? 1 : right === READ_N - 1 ? 0 : -1), floorOf(band), CAP);
}

/* the reading part: the passage for a word start, and three of its own questions — the first two that
   ask what happened, then the first that asks why */
export function readingPart(wordStart) {
  const L = passageLevelFor(wordStart), p = passage(PASSAGE_FOR[L]);
  const items = passageItems(p), qs = p.questions;
  const lit = qs.map((q, i) => (q.depth === 'literal' ? i : -1)).filter((i) => i >= 0).slice(0, 2);
  const inf = qs.findIndex((q) => q.depth !== 'literal');
  const pick = [...lit, inf].filter((i) => i >= 0);
  while (pick.length < READ_N) { const j = qs.findIndex((_, i) => !pick.includes(i)); if (j < 0) break; pick.push(j); }
  return { level: L, passage: p, items: pick.slice(0, READ_N).map((i) => items[i]) };
}
export const passageOk = (p) => !!p && shippable(p) && !p.needsReview && (p.questions || []).length >= READ_N;
export { levelOf };

/* Write the result. `first` (straight after the welcome, nothing done yet): the start is what the check
   showed. Otherwise it only moves forward: never below the start the child already has. */
export function applyPlace(k, res, { first = false, now = Date.now() } = {}) {
  const place = { at: now };
  for (const sid of ['word', 'reading']) place[sid] = clamp(first ? res[sid] : Math.max(headStart(k, sid), res[sid]), 1, CAP);
  k.place = place;
  return place;
}
