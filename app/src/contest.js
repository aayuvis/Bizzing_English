/* contest.js — the Elocution Contest (SPEC §14, Phase 4): three rounds on the Stage — a poem, a passage,
   a one-minute talk — against five of Bizzing Bee's ten rivals (the same made-up children who sit the
   Mock Bee and star in Maths' stories). Bee owns SPELLING contests; this is speaking, which Bee does not run.

   Honest by construction:
   • The child's score is made ONLY from what the device can measure (mic.js): timing against a window,
     pace when the words are known, pauses against the places a reader breathes, and volume range in the
     talk. Each round is out of 10 and the screen shows where every point came from. Expression, the
     words chosen and whether it moved anyone are never scored — the child and a grown-up judge those.
   • The rivals are characters. Their scores are drawn by the app from their Bee traits (skill, nerve,
     pace), seeded by the contest's number so a contest replays the same — and the screen says so.
   • Never a leaderboard against real children. Nothing leaves the device: a contest keeps its numbers. */

import { rng } from './rand.js';

export const RIVALS = [
  { id: 'pixel', name: 'Pip', age: 8, skill: .52, nerve: .74, pace: 1.35, tell: 'races to the last line before anyone has settled' },
  { id: 'koi', name: 'Nova', age: 9, skill: .58, nerve: .70, pace: 1.0, tell: 'says the first line twice under her breath, then begins' },
  { id: 'beaker', name: 'Rafi', age: 10, skill: .63, nerve: .58, pace: 0.95, tell: 'counts the full stops on his fingers before he starts' },
  { id: 'panda', name: 'Suki', age: 11, skill: .66, nerve: .93, pace: 1.0, tell: 'breathes out, then speaks — the lights do nothing to her' },
  { id: 'comet', name: 'Dax', age: 11, skill: .71, nerve: .34, pace: 1.25, tell: 'is brilliant in round one; watch him in round three' },
  { id: 'astro', name: 'Mira', age: 12, skill: .70, nerve: .66, pace: 0.9, tell: 'finds the one word in every line worth leaning on' },
  { id: 'scopey', name: 'Theo', age: 12, skill: .69, nerve: .80, pace: 0.8, tell: 'pauses at every comma, and some that are not there' },
  { id: 'melody', name: 'Ines', age: 13, skill: .74, nerve: .72, pace: 1.0, tell: 'hears it as music first, then says it' },
  { id: 'samurai', name: 'Kwame', age: 14, skill: .80, nerve: .78, pace: 1.0, tell: 'stands dead still, hands behind his back' },
  { id: 'goldlegend', name: 'Vesper', age: 15, skill: .87, nerve: .95, pace: 1.05, tell: 'won last year, and has not looked at anyone since' },
];
const FIELD = { 1: ['pixel', 'koi', 'beaker', 'panda', 'comet'], 2: ['beaker', 'panda', 'comet', 'astro', 'scopey'], 3: ['astro', 'scopey', 'melody', 'samurai', 'goldlegend'] };
export const field = (band) => (FIELD[band] || FIELD[2]).map((id) => RIVALS.find((r) => r.id === id));
export const rivalArt = (id) => `rivals/${id}.webp`;

export const ROUNDS = [
  { id: 'poem', title: 'A poem', say: 'Recite or read a short poem. Breathe at the ends of lines.' },
  { id: 'prose', title: 'A passage', say: 'Read a passage from a classic aloud, at a storyteller’s pace.' },
  { id: 'talk', title: 'A one-minute talk', say: 'Thirty seconds to think, then talk for a minute on a topic you have just been given.' },
];
export const TALK_TARGET = [50, 75];

/* The window a reading should fall in: from the narrator's own time when there is one (0.9×–1.4×), else
   from the words at 100–160 words a minute. */
export function windowFor(words, narratorSecs = 0) {
  if (narratorSecs > 5) return [Math.round(narratorSecs * 0.9), Math.round(narratorSecs * 1.4)];
  return [Math.round((words / 160) * 60), Math.round((words / 100) * 60)];
}
/* the places a reader breathes: each sentence's end, and each line's end in verse */
export function breaths(text, verse) {
  const ends = (String(text).match(/[.!?;:]+(?=\s|$|['’"”)])/g) || []).length;
  const lines = verse ? String(text).split('\n').filter((l) => l.trim()).length : 0;
  return Math.max(1, verse ? Math.max(ends, lines) : ends);
}

/* One round's score from the measured numbers — every point labelled with where it came from. */
export function score(round, m, { target, words = 0, places = 1 } = {}) {
  if (!m || m.quiet || m.secs < 5) return { total: 0, parts: [['Too quiet to measure', 0, 10]] };
  const [lo, hi] = target, s = m.secs, slack = (hi - lo) * 0.5 + 4;
  const timing = s >= lo && s <= hi ? 4 : (s >= lo - slack && s <= hi + slack) ? 2 : 0;
  const parts = [['Timing — inside the window', timing, 4]];
  if (round === 'talk') {
    const perMin = m.pauses / (s / 60);
    parts.push(['Phrasing — spoke in phrases, not one breathless run', perMin >= 6 && perMin <= 26 ? 3 : perMin >= 3 && perMin <= 34 ? 2 : 1, 3]);
    parts.push(['Volume — some lines louder, some softer', m.range >= 12 ? 3 : m.range >= 7 ? 2 : 1, 3]);
  } else {
    const wpm = words ? Math.round(words / (s / 60)) : m.wpm;
    parts.push(['Pace — a steady speaking pace', wpm >= 100 && wpm <= 160 ? 3 : wpm >= 80 && wpm <= 185 ? 2 : 1, 3]);
    const ratio = m.pauses / places;
    parts.push(['Pauses — about one at each full stop or line end', ratio >= 0.6 && ratio <= 1.7 ? 3 : ratio >= 0.3 && ratio <= 2.5 ? 2 : 1, 3]);
  }
  return { total: parts.reduce((a, p) => a + p[1], 0), parts };
}

/* A rival's round: drawn from their Bee traits, seeded by the contest number, round and rival. Skill
   sets the centre; nerve decides how much later rounds shake them; a fast-paced rival loses timing. */
export function rivalRound(rv, n, ri) {
  const r = rng(`contest:${n}:${ri}:${rv.id}`);
  let v = 4.5 + rv.skill * 5.5 + (r() - 0.5) * 2.4 - (1 - rv.nerve) * ri * 1.3 - Math.abs(rv.pace - 1) * 2.5;
  v = Math.max(3, Math.min(10, Math.round(v)));
  const line = v >= 9 ? `${rv.name} ${rv.tell} — and it lands.` : v >= 7 ? `${rv.name} ${rv.tell}.` : rv.pace > 1.15 ? `${rv.name} rushed it and finished early.` : rv.pace < 0.9 ? `${rv.name} ran over the time.` : `${rv.name} lost the thread for a moment, and found it again.`;
  return { total: v, line };
}

/* Standings after the rounds played: totals, highest first; ties share a place. */
export function standings(n, band, mine) {
  const rows = [{ id: 'you', name: 'You', total: mine.reduce((a, x) => a + x, 0), you: true },
    ...field(band).map((rv) => ({ id: rv.id, name: rv.name, total: mine.reduce((a, _, ri) => a + rivalRound(rv, n, ri).total, 0) }))];
  rows.sort((a, b) => b.total - a.total || (a.you ? -1 : b.you ? 1 : 0));
  rows.forEach((row, i) => { row.place = i && rows[i - 1].total === row.total ? rows[i - 1].place : i + 1; });
  return rows;
}
