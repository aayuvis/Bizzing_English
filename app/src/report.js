/* report.js — "what to help with next", in specifics (FAMILY-STANDARD §15): never "nothing needs help". Each line
   names the stop, says what the evidence is, and links to it. Read from the mastery record, the mistakes deck,
   the stops' best scores, the pieces and speeches waiting for a grown-up's judgement, and the next step. Pure. */
import { stopById, strand } from './curriculum.js';
import { readingStop } from './reading.js';
import { due } from './mastery.js';
import { nextStep } from './next.js';

const title = (id) => stopById(id)?.title || readingStop(id)?.title || id;
const where = (id) => { const s = stopById(id) || readingStop(id); return s ? `${strand(s.strand)?.title || 'Reading'} ${s.level}` : ''; };
const href = (id) => `#/stop/${id}`;

export function helpNext(h, k, t = Date.now()) {
  const out = [], they = k.name;
  const lapses = Object.entries(k.mastery).filter(([, r]) => r.lapses).sort((a, b) => b[1].lapses - a[1].lapses).slice(0, 2);
  for (const [id, r] of lapses) out.push({ id, href: href(id), text: `${they} slipped on “${title(id)}” (${where(id)}) ${r.lapses > 1 ? `${r.lapses} times` : 'once'} on a later-day check — go through it together, then let the next check bring it back.` });
  const missed = {}; for (const m of k.misses || []) if (m.stop && !m.ok && t - (m.at || 0) < 21 * 864e5) missed[m.stop] = (missed[m.stop] || 0) + 1;
  const worst = Object.entries(missed).filter(([id]) => !lapses.some(([l]) => l === id)).sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] >= 2) out.push({ id: worst[0], href: href(worst[0]), text: `${worst[1]} wrong answers in “${title(worst[0])}” (${where(worst[0])}) these three weeks — the mistakes deck in Practice holds them.` });
  const weak = Object.entries(k.stops).filter(([id, s]) => s.passed && s.best != null && s.best <= 6 && !out.some((o) => o.id === id)).sort((a, b) => a[1].best - b[1].best)[0];
  if (weak) out.push({ id: weak[0], href: href(weak[0]), text: `Passed “${title(weak[0])}” (${where(weak[0])}) with ${weak[1].best} right — the narrowest pass so far; worth another look before its later-day check.` });
  const d = due(k, t);
  if (d.length) out.push({ href: '#/practice', text: `${d.length} stop${d.length > 1 ? 's are' : ' is'} ready to prove on a later day: ${d.slice(0, 3).map((id) => `“${title(id)}”`).join(', ')}${d.length > 3 ? ` and ${d.length - 3} more` : ''}.` });
  const waiting = Object.entries(k.writing || {}).filter(([key, v]) => Array.isArray(v) && key !== 'talk').flatMap(([id, a]) => a.filter((p) => !p.rubric).map(() => id));
  if (waiting.length) out.push({ href: '#/grownups', text: `${waiting.length} piece${waiting.length > 1 ? 's' : ''} of writing (${[...new Set(waiting)].map((id) => `“${title(id)}”`).join(', ')}) wait for your 1–4 judgement below — only that makes writing “learned”.` });
  const nx = nextStep(h, k, t);
  if (nx.kind === 'stop' && nx.stop) out.push({ id: nx.stop.id, href: href(nx.stop.id), text: `${nx.resume ? 'Unfinished' : 'Next on the road'}: “${nx.stop.title}” (${where(nx.stop.id)}) — ${nx.stop.iCan}` });
  return out.slice(0, 5);
}
