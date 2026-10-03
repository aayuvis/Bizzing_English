/* reading.js — the Reading strand's stops are the passages (SPEC §4): one stop per passage, placed on
   a level by its shelf. The texts load on demand (data/passages.json), never on Home's first paint.
   A passage is READ when its questions are passed; UNDERSTOOD only when they are passed again on a
   later day (mastery.js) — the reading log counts that, never minutes. */

import { PASSAGES, WORKS, LINES } from './data/library.js';
import { cleared } from './data/rights.js';

let TEXTS = null, pending = null;
export function loadPassages() {
  if (TEXTS) return Promise.resolve(TEXTS);
  return (pending ||= import('./data/passages.json').then((m) => (TEXTS = Object.fromEntries((m.default || m).map((p) => [p.id, p])))).catch(() => (pending = null, {})));
}
export const passageText = (id) => TEXTS?.[id] || null;
export const work = (id) => WORKS.find((w) => w.id === id) || null;
export const passage = (id) => PASSAGES.find((p) => p.id === id) || null;

const FAIRY = /^(grimm|andersen|arabian|bulfinch|wonderbook|tanglewood|heroes)/;   // fairy tales and myths: Reading level 2
const SHORT = /^(holmes|justso|kipling-rewards)/;
export function levelOf(p) {
  const w = work(p.work); const sh = w?.shelf;
  if (p.level) return p.level;                       // a passage may name its level (close reading: 10)
  if (sh === 'drama') return 7;                      // a play's verse is still drama
  if (p.kind === 'verse' || sh === 'poetry') return 4;
  if (sh === 'essay' || sh === 'speech') return 9;
  if (FAIRY.test(p.work)) return 2;
  if (sh === 'fable') return 1;
  if (SHORT.test(p.work)) return 5;
  if (sh === 'novel') return 6;
  return 3;
}
/* SPEC §3: a text ships only when ALL THREE markets (US, UK, India) clear it. There is no locale to
   gate by (the app never asks where a child is), so a work marked 'check' anywhere is held back
   from every child — its card says why — until the rights are confirmed. */
export { cleared };
export const shippedLines = () => LINES.filter((l) => cleared(work(l.work)));
export const shippable = (p) => cleared(work(p.work));
export const stopId = (p) => 'rd-' + p.id;
export function readingStops() {
  return PASSAGES.filter(shippable).map((p) => ({ id: stopId(p), passage: p.id, title: p.title, level: levelOf(p), band: p.band, kind: 'passage', strand: 'reading',
    iCan: `I can understand “${p.title}” from ${work(p.work)?.title || 'a classic'}.` }));
}
import { BOOKS } from './book.js';
/* the whole books: each chapter is a stop on Reading level 8 ("whole novels") */
export const bookStops = () => BOOKS.flatMap((b) => b.chapters.map((c) => ({ id: `bk-${b.id}-${c.n}`, book: b.id, chapter: c.n, title: `${b.short}, chapter ${c.n}: ${c.title}`, level: 8, band: b.band, kind: 'passage', strand: 'reading',
  iCan: `I can understand chapter ${c.n} of ${b.title}.`, questions: c.questions })));
export const readingStop = (id) => readingStops().find((s) => s.id === id) || bookStops().find((s) => s.id === id) || null;
