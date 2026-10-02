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

const FAIRY = /^(grimm|andersen|arabian)/;
const SHORT = /^(holmes|justso|kipling-rewards)/;
export function levelOf(p) {
  const w = work(p.work); const sh = w?.shelf;
  if (p.kind === 'verse' || sh === 'poetry') return 4;
  if (sh === 'drama') return 7;
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
export const readingStop = (id) => readingStops().find((s) => s.id === id) || null;
