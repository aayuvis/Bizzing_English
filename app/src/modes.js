/* modes.js — game modes bought with coins (audit K6; the owner, 4 Oct). One per game: CHALLENGE, the run's
   final played straight away, with its own best. It changes how a game is played, never what is taught:
   every level, every item and every coin-earning run stays free, and a challenge moves no level, pays no
   coin and earns no star. Fixed printed prices through the wallet (never below zero), no chance, no timer
   to unlock it. Small on purpose, so the Shop can list modes without loading games.js. */

export const MODE_PRICE = 150;
export const MODE_GAMES = { builder: 'Sentence Builder', rush: 'Punctuation Rush', figure: 'Figure Hunt', who: 'Who Said It?', plot: 'Plot Line', root: 'Root Forge', duel: 'Rhetoric Duel' };
export const modeId = (game) => `challenge-${game}`;
export const modeWhat = 'the final, straight away, at your level — beat your own best';

export function modesOf(k) { return (k.modes ||= []); }
export const ownsMode = (k, game) => modesOf(k).includes(modeId(game));
/* buy: the spend goes through the wallet at the printed price; the caller passes spend (family.spend) */
export function buyMode(k, game, spend) {
  if (!MODE_GAMES[game] || ownsMode(k, game)) return false;
  if (!spend(MODE_PRICE, `mode:${modeId(game)}`)) return false;
  modesOf(k).push(modeId(game)); return true;
}
