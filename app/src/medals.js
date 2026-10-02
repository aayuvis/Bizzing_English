/* medals.js — earned from EVIDENCE, shown on a shelf with what earned them, celebrated once
   (k.seen). Never for time, days logged in or coins. "Good days" is a count in a window, never a
   run: missing a day costs nothing. Praise names the work, never the child, never a comparison. */

import { levelDone, goodDays } from './model.js';
import { learnedCount } from './mastery.js';

const passed = (k, id) => !!k.stops[id]?.passed;
const nPassed = (k, pre) => Object.entries(k.stops).filter(([id, s]) => s.passed && id.startsWith(pre)).length;
const strandsWorked = (k) => new Set(Object.entries(k.stops).filter(([, s]) => s.passed).map(([id]) => id.split('-')[0].replace(/\d+$/, ''))).size;

export const MEDALS = [
  { id: 'first-stop', art: 'medal-first-stop', name: 'First Stop', how: 'Pass the check at the end of any stop.', test: (k) => Object.values(k.stops).some((s) => s.passed) },
  { id: 'wordsmith', art: 'medal-wordsmith', name: 'Wordsmith', how: 'Finish Word level 2 — what words mean.', test: (k) => levelDone(k, 'word', 2) },
  { id: 'roots', art: 'medal-roots', name: 'Root Finder', how: 'Finish Word level 5 — Latin and Greek roots.', test: (k) => levelDone(k, 'word', 5) },
  { id: 'sentence', art: 'medal-sentence', name: 'Sentence Builder', how: 'Finish Sentence level 2 — subject and predicate.', test: (k) => levelDone(k, 'sentence', 2) },
  { id: 'comma', art: 'medal-comma', name: 'Comma Keeper', how: 'Pass the Commas stop.', test: (k) => passed(k, 's5-comma') },
  { id: 'reader', art: 'medal-reader', name: 'Reader', how: 'Pass the questions on three passages.', test: (k) => nPassed(k, 'rd-') >= 3 },
  { id: 'bookworm', art: 'medal-bookworm', name: 'Bookworm', how: 'Put 20 words from your reading in your word bank.', test: (k) => Object.keys(k.bank).length >= 20 },
  { id: 'week', art: 'medal-week', name: 'A Good Week', how: 'Five good days in any seven — a good day is five right answers or a stop.', test: (k) => goodDays(k, 7) >= 5 },
  { id: 'mastery', art: 'medal-mastery', name: 'It Stuck', how: 'Prove you remember a stop on a later day.', test: (k) => learnedCount(k) >= 1 },
  { id: 'game', art: 'medal-game', name: 'Game On', how: 'Finish a round of Sentence Builder and of Punctuation Rush.', test: (k) => !!(k.games.builder?.plays && k.games.rush?.plays) },
  { id: 'stage', art: 'medal-stage', name: 'Read Aloud', how: 'Read a passage aloud on the Stage.', test: (k) => Object.values(k.stage).some((a) => a.length) },
  { id: 'world', art: 'medal-world', name: 'Explorer', how: 'Pass stops in four different strands.', test: (k) => strandsWorked(k) >= 4 },
];

/* Medals newly deserved: recorded, and returned once for the celebration. */
export function award(k, t = Date.now()) {
  const fresh = [];
  for (const m of MEDALS) if (!k.medals[m.id] && m.test(k)) { k.medals[m.id] = t; fresh.push(m); }
  return fresh;
}
