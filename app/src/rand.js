/* rand.js — seeded, so an item is the same item every time it is drawn (its id is its seed), and
   the order of its options is permuted FROM ITS ID (Finance's shuffledDrill): authored answers
   once put 11 of 12 in slot B; position must never leak the answer. */

export function hash(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) {
  let a = typeof seed === 'number' ? seed : hash(String(seed));
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export function shuffle(r, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export function sample(r, a, n) { return shuffle(r, a).slice(0, n); }
/* options: the right one first in `opts`; returns { options, answer } permuted by the item id */
/* The right answer's slot ROTATES with the item's ordinal (consecutive items take consecutive slots), so no
   bank can lean on one slot by chance; the wrong options are shuffled from the id. */
export function permute(id, opts) {
  const n = opts.length, ord = String(id).split(':').reduce((a, p) => a + (/^\d+$/.test(p) ? +p : hash(p)), 0);
  const rest = shuffle(rng('perm:' + id), opts.slice(1)), slot = ord % n;
  const options = [...rest.slice(0, slot), opts[0], ...rest.slice(slot)];
  return { options, answer: slot };
}
