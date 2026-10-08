/* hubs.js — the Play tab's lineup and the level rule every game card shares (handover C §1.4, §3, §4.0).

   THE LINEUP. Look-alikes merge into one card with modes, as Bee Trivia is one card (owner, 3–5 Oct):
   Sentence Builder + Punctuation Rush are SENTENCE STUDIO; Figure Hunt + Rhetoric Duel are WRITER'S CRAFT.
   A hub is one Play card that opens a hub of mode tiles; each mode keeps its own route, its own level,
   its own memory (k.games[mode], so nothing a child earned moves), the shared miss card and the pay rules.
   One in, one out: the card count never rises, and every card that came in names the cards it replaced
   (LEDGER; test/games.mjs T16). The names sit behind NAMES — the owner's to confirm (C §3.3).

   THE LEVEL RULE. A game's level is its own (k.games[id].level, moved by games.js nextLevel: under 50%
   down one, 50–79% holds, 80% up). The child may choose — a level chip, Level 1–5 or Auto, on every card
   and hub mode — and a hand-set level (k.games[id].pick) sticks until the next check: the run played at
   it moves the level from there, and the chip goes back to Auto. A drop says so kindly. Stored per child
   per game through the Store seam (store v4 gives every game record its `pick`). */

import { GAMES, nextLevel, clampLevel, MAX_LEVEL } from './games.js';

export const NAMES = { studio: 'Sentence Studio', craft: 'Writer’s Craft' };
export const HUBS = {
  studio: { id: 'studio', name: NAMES.studio, world: 'scriptorium', practises: 'clauses, capitals and commas', promise: 'Build sentences and punctuate them: clauses, capitals and commas.', modes: ['builder', 'rush'] },
  craft: { id: 'craft', name: NAMES.craft, world: 'forum', practises: 'figures of speech and the devices of strong writing', promise: 'Find the figures great writers use, then make a line strong yourself.', modes: ['figure', 'duel'] },
};
/* The Play tab, in order: a card is a hub or a single game. */
export const CARDS = ['inkwell', 'studio', 'craft', 'root', 'ears'];
/* The seven Play cards before the hubs (3 Oct 2026), and what came in for what. */
export const BEFORE = ['builder', 'rush', 'figure', 'who', 'plot', 'root', 'duel'];
export const LEDGER = [
  { in: 'studio', out: ['builder', 'rush'], why: 'the same shell and strand: sentences built and punctuated' },
  { in: 'craft', out: ['figure', 'duel'], why: 'both name devices in real lines; together, find it and then use it' },
  { in: 'inkwell', out: ['plot'], why: 'Inkwell Detective, the flagship, in for Plot Line (C §2.1); its timeline board is Detective School’s Timeline' },
  { in: 'ears', out: ['who'], why: 'Story Ears in for Who Said It? (C §5); its attribution lives on in Detective School’s Who Wrote This?' },
];
/* The most cards Play may show. It only ever comes down (T16); the Detective School swap brings it to 4. */
export const CARD_LIMIT = 5;
/* a game that left the tab without becoming a hub mode: where its mechanic plays now (module, export) */
export const LIVES_ON = { who: ['detective-school.js', 'whoRound', 'Inkwell Detective · Detective School: Who Wrote This?'], plot: ['detective-school.js', 'timelineRound', 'Inkwell Detective · Detective School: Timeline'] };
export const isHub = (id) => !!HUBS[id];
export const hubOf = (game) => Object.values(HUBS).find((h) => h.modes.includes(game))?.id || null;
export const cardName = (id) => HUBS[id]?.name || GAMES[id]?.name || id;

/* ---------- the level chip ---------- */
export const AUTO = 'auto';
export const levelOf = (rec) => clampLevel(rec?.level || 1);
export const pickOf = (rec) => (Number.isInteger(rec?.pick) && rec.pick >= 1 && rec.pick <= MAX_LEVEL ? rec.pick : null);
/* the level the next run is played at: the hand-set one if there is one, else the game's own */
export const playLevel = (rec) => pickOf(rec) || levelOf(rec);
/* the chip: 'auto' or 1–5 */
export function setPick(rec, v) { rec.pick = v === AUTO || v == null || v === '' ? null : clampLevel(v); return rec; }
export const dropLine = (L) => `Let’s warm up on Level ${L}. You can move back up any time.`;
/* The check after a run played at `played` with accuracy `pct` (null: nothing was tried, so nothing is
   checked and a hand-set level still sticks). The level moves from the level PLAYED; the chip goes back to
   Auto. `firstUp` is a level reached for the first time — the only level-up the wallet pays (choosing
   Level 1 again and again cannot farm coins). */
export function settleLevel(rec, played, pct) {
  const before = clampLevel(played), top = Math.max(1, rec.top || 1, levelOf(rec));
  if (pct == null || Number.isNaN(pct)) return { before, after: before, drop: false, up: false, firstUp: false, checked: false };
  const after = nextLevel(before, pct);
  rec.level = after; rec.pick = null; rec.top = Math.max(top, after);
  return { before, after, drop: after < before, up: after > before, firstUp: after > top, checked: true, line: after < before ? dropLine(after) : '' };
}
