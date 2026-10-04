/* next.js — THE next step. Home's Continue, #/continue and the end of the welcome all ask nextStep();
   nothing else decides (Finance and India each had two "next" functions that disagreed).
   1. an unfinished stop — an abandoned lesson comes back, never skipped (trap 10)
   2. a spaced check that is due (learning is proved on a later day)
   3. the next stop in the open strands, Word and Sentence first, the least-advanced strand first */

import { STRANDS } from './curriculum.js';
import { strandOpen, planOpen, levelOpen, headStart, placed } from './model.js';
import { due } from './mastery.js';
import { readingStops, bookStops } from './reading.js';

export function stopsOf(sid) {
  if (sid === 'reading') return [...readingStops(), ...bookStops()];
  const s = STRANDS.find((x) => x.id === sid);
  return s.levels.flatMap((l) => l.stops.map((st) => ({ ...st, strand: sid, level: l.n })));
}

export function nextStep(h, k) {
  if (!k) return { kind: 'welcome', href: '#/welcome', title: 'Start' };
  const all = STRANDS.flatMap((s) => stopsOf(s.id));
  const open = (st) => strandOpen(k, st.strand) && planOpen(h, st.strand) && levelOpen(k, st.strand, st.level) && (!st.band || st.band <= k.band + 1);
  const unfinished = all.filter((st) => k.stops[st.id]?.step && !k.stops[st.id]?.passed && open(st)).sort((a, b) => (k.stops[b.id].at || 0) - (k.stops[a.id].at || 0))[0];
  if (unfinished) return { kind: 'stop', stop: unfinished, resume: true, href: `#/stop/${unfinished.id}` };
  const d = due(k);
  if (d.length >= 2 || (d.length && Object.keys(k.stops).length > 6)) return { kind: 'check', ids: d, href: '#/practice/check' };
  /* where a road's next stop is looked for: a placed road starts at its place; otherwise the band's start
     (at most 3), and Reading from its first level */
  const floor = (sid) => (placed(k, sid) ? headStart(k, sid) : Math.min(headStart(k, sid), 3) - (sid === 'reading' ? 9 : 0));
  const fronts = [];
  for (const s of STRANDS) {
    if (!strandOpen(k, s.id) || !planOpen(h, s.id)) continue;
    const st = stopsOf(s.id).filter((x) => open(x) && !k.stops[x.id]?.passed && x.level >= floor(s.id))
      .sort((a, b) => a.level - b.level)[0];
    if (st) fronts.push({ st, done: stopsOf(s.id).filter((x) => k.stops[x.id]?.passed).length, n: s.n });
  }
  if (!fronts.length) return { kind: 'library', href: '#/library', title: 'Every open stop is done' };
  const word = fronts.filter((f) => f.n <= 2);
  const pool = word.length && word.reduce((a, f) => a + f.done, 0) < 4 ? word : fronts;
  pool.sort((a, b) => a.done - b.done || a.n - b.n);
  return { kind: 'stop', stop: pool[0].st, href: `#/stop/${pool[0].st.id}` };
}
