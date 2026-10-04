/* demo.js — ?demo: a labelled sample child with three weeks of believable progress, held IN MEMORY.
   It saves nothing and writes no shared key (store.js setDemo; family.js no-ops). The progress is
   made by DRIVING THE ENGINE — passing stops on past days, then spaced checks on later days —
   never typed in, so the sample can only show states the real app can reach. */

import { setDemo } from './store.js';
import { newHousehold, newKid, addKid, bumpDay, addToBank, today } from './model.js';
import { taught, spacedCheck } from './mastery.js';
import { setDemoCoins, setDemoLedger, setDemoActivity } from './family.js';
import { stopById, level } from './curriculum.js';
import { readingStop, readingStops } from './reading.js';

const DAY = 864e5;
export function demoHousehold(now = Date.now()) {
  const h = newHousehold(), k = addKid(h, newKid('Kavya', 2, 'bookworm'));
  h.parent.plan = 'family';
  const plan = [['w1-rhyme', 20], ['w1-build', 20], ['s1-noun', 19], ['w1-odd', 18], ['s1-verb', 17], ['rd-aesop-town-mouse', 16], ['w2-meaning', 15], ['s1-adj', 14],
    ['w2-word', 12], ['s2-split', 11], ['rd-justso-elephant', 10], ['s2-subject', 9], ['w3-meaning', 7], ['la1-origin', 6], ['s3-pc', 5], ['wr1-copy', 4], ['w3-make', 2]];
  /* the whole of Sentence 1 and Reading 1, so the strands they open (Writing, Speaking) are open for the
     stops she passed in them — the audit found both locked with a passed stop inside (brief v4) */
  const have = new Set(plan.map(([id]) => id));
  const fill = [...level('sentence', 1).stops.map((s) => s.id), ...readingStops().filter((s) => s.level === 1).map((s) => s.id)].filter((id) => !have.has(id));
  fill.forEach((id, i) => plan.push([id, 19 - (i % 12)]));
  plan.sort((a, b) => b[1] - a[1]);
  for (const [id, ago] of plan) {
    const t = now - ago * DAY;
    k.stops[id] = { passed: true, best: 7, tries: 1, step: 0, at: t };
    taught(k, id, t); bumpDay(k, 'stops', 1, t); bumpDay(k, 'right', 7, t); bumpDay(k, 'answers', 8, t);
    if (id.startsWith('rd-')) bumpDay(k, 'pages', 1, t);
  }
  for (const [id, ago] of plan.filter(([, a]) => a >= 9)) spacedCheck(k, id, 9, 10, now - (ago - 2) * DAY);   // proved two days later
  for (const [id, ago] of plan.filter(([, a]) => a >= 17)) spacedCheck(k, id, 8, 10, now - (ago - 10) * DAY); // and again a week on
  spacedCheck(k, 's1-adj', 5, 10, now - 3 * DAY);                                                              // one honest slip
  for (const w of ['heartily', 'scamper', 'refreshment', 'insatiable', 'curiosity', 'satiable', 'banks', 'scrumptious', 'grovelling', 'mastiffs']) addToBank(k, w, 'demo');
  k.stops['s3-main'] = { passed: false, best: 0, tries: 0, step: 2, at: now - DAY };                         // an unfinished lesson: Continue returns to it
  k.games = { builder: { best: 14, plays: 3 }, rush: { best: 11, plays: 2 } };
  k.stage['sp1-aloud'] = [{ at: now - 8 * DAY, passage: 'aesop-town-mouse', secs: 118, wpm: 121, pauses: 14, range: 18, self: 2 }];
  k.stops['sp1-aloud'] = { passed: true, tries: 1 };
  k.medals = { 'first-stop': now - 20 * DAY, mastery: now - 18 * DAY, game: now - 12 * DAY, stage: now - 8 * DAY, wordsmith: now - 12 * DAY };
  k.book = { work: 'jungle', passage: 'jungle-mowgli' };
  k.last = { what: 'stop', title: 'Make the word', right: 7, n: 8, at: now - 2 * DAY };
  k.owned = ['hare'];
  /* the sample's wallet is made from what it did: seven right answers and a stop for each passed stop, a
     mastery for each one proved on a later day — so the balance and the history always agree */
  const L = [], notes = (k.coinNotes = {}), name = (id) => stopById(id)?.title || readingStop(id)?.title || id;
  for (const [id, ago] of plan) { const t = now - ago * DAY;
    for (let i = 0; i < 7; i++) { L.push({ a: 'english', t: t + i * 1000, n: 1, why: 'answer' }); notes[t + i * 1000] = name(id); }
    L.push({ a: 'english', t: t + 9000, n: 5, why: 'stop' }); notes[t + 9000] = name(id); }
  for (const [id, ago] of plan.filter(([, a]) => a >= 9)) { const t = now - (ago - 2) * DAY + 5000; L.push({ a: 'english', t, n: 20, why: 'mastery' }); notes[t] = `Learned: ${name(id)}`; }
  L.sort((a, b) => a.t - b.t);
  /* the family feed's sessions for the report's Time: one session on each day she played, its minutes from
     what she did that day (about a minute and a half a stop) */
  const days = {}; for (const [, ago] of plan) days[ago] = (days[ago] || 0) + 1;
  setDemoActivity(Object.entries(days).map(([ago, n]) => { const d = new Date(now - ago * DAY); return { a: 'english', d: today(d.getTime()), t: 17 * 60 + 10, m: 6 + n * 4, who: 'Kavya' }; }));
  setDemo(h); setDemoLedger(L); setDemoCoins(L.reduce((a, x) => a + x.n, 0));
  return h;
}
