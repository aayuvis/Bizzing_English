/* contest.mjs — the Elocution Contest scores only what is measured, the rivals replay, and the Extras are
   a fixed-price look. */
import { score, windowFor, breaths, rivalRound, standings, field, RIVALS, TALK_TARGET } from '../src/contest.js';
import { EXTRAS, validate, owns, wearing, wear, buyExtra, extrasOf } from '../src/extras.js';
import { existsSync } from 'node:fs';
let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };

// a perfect reading: inside the window, a steady pace, a pause at each breath
const w = windowFor(150, 0); ok(w[0] === 56 && w[1] === 90, 'window from words at 100–160 wpm');
ok(windowFor(150, 60)[0] === 54 && windowFor(150, 60)[1] === 84, 'window from the narrator 0.9×–1.4×');
const good = score('prose', { secs: 70, wpm: 129, pauses: 10, range: 14 }, { target: w, words: 150, places: 10 });
ok(good.total === 10, 'a steady, well-paused, on-time reading scores 10: ' + good.total);
ok(good.parts.every(([label]) => /Timing|Pace|Pauses/.test(label)), 'every point names what measured it');
ok(score('prose', { secs: 20, wpm: 0, pauses: 0, range: 0, quiet: true }, { target: w }).total === 0, 'too quiet scores nothing');
ok(score('prose', { secs: 30, wpm: 300, pauses: 0, range: 3 }, { target: w, words: 150, places: 10 }).total < 4, 'a breathless sprint scores low');
const talk = score('talk', { secs: 62, wpm: 0, pauses: 14, range: 13 }, { target: TALK_TARGET });
ok(talk.total === 10 && talk.parts.every(([l]) => /Timing|Phrasing|Volume/.test(l)), 'the talk scores timing, phrasing, volume only');
for (let s = 0; s <= 400; s += 7) for (const p of [0, 3, 9, 30]) { const x = score('poem', { secs: s, wpm: 0, pauses: p, range: 8 }, { target: [40, 60], words: 100, places: 8 }).total; ok(x >= 0 && x <= 10 && Number.isInteger(x), `score in 0..10 (${s}s, ${p} pauses)`); }
ok(breaths('One. Two! Three?', false) === 3 && breaths('a line\nanother line\nthird', true) === 3, 'breaths: sentence ends, or line ends in verse');

// rivals: Bee's ten, replayable, in range, nerve shows late
ok(RIVALS.length === 10 && RIVALS.every((r) => existsSync(new URL(`../public/rivals/${r.id}.webp`, import.meta.url))), "Bee's ten rivals, each with a face");
for (const b of [1, 2, 3]) ok(field(b).length === 5 && field(b).every(Boolean), `band ${b}: a field of five`);
for (const rv of RIVALS) for (let c = 1; c <= 40; c++) for (let ri = 0; ri < 3; ri++) { const a = rivalRound(rv, c, ri), b = rivalRound(rv, c, ri); ok(a.total === b.total && a.line === b.line && a.total >= 3 && a.total <= 10, 'rival replays and stays in range'); }
const avg = (id, ri) => { const rv = RIVALS.find((r) => r.id === id); let s = 0; for (let c = 1; c <= 200; c++) s += rivalRound(rv, c, ri).total; return s / 200; };
ok(avg('comet', 2) < avg('comet', 0) - 1, 'Dax (low nerve) fades by round three');
ok(avg('goldlegend', 0) > avg('pixel', 0), 'Vesper outscores Pip');
// winnable: a perfect child wins in every band, more often than not
for (const b of [1, 2, 3]) { let wins = 0; for (let c = 1; c <= 100; c++) if (standings(c, b, [10, 10, 10]).find((x) => x.you).place === 1) wins++; ok(wins >= 90, `band ${b}: a perfect night wins (${wins}/100)`); }
const st = standings(3, 2, [6, 7, 5]); ok(st.length === 6 && st[0].place === 1 && st.every((r, i) => !i || r.total <= st[i - 1].total), 'standings sorted, places from 1');

// Extras: fixed prices, one free per kind, a buy goes through the wallet
ok(validate().length === 0, 'extras validate: ' + validate().join('; '));
const k = { name: 'Asha' };
ok(wearing(k, 'paper') === 'paper-plain' && owns(k, 'curtain-red') && !owns(k, 'curtain-gold'), 'free first, others not owned');
ok(!wear(k, 'curtain-gold'), 'cannot wear what is not owned');
ok(!buyExtra(k, 'curtain-gold', () => false) && !owns(k, 'curtain-gold'), 'no coins, no curtain');
let paid = 0, why = ''; ok(buyExtra(k, 'curtain-gold', (p, y) => { paid = p; why = y; return true; }) && paid === 150 && why === 'extra:curtain-gold', 'a buy spends the printed price');
ok(wearing(k, 'curtain') === 'curtain-gold' && !buyExtra(k, 'curtain-gold', () => true), 'worn at once, never bought twice');
const k2 = { name: 'Ben' }; ok(!owns(k2, 'curtain-gold') && extrasOf(k2).owned.length === 0, 'a second child inherits nothing');
// Figure Hunt: every line from the bank, the five answers fixed, every round has a real answer
const { figureRound, FIGURE_KINDS } = await import('../src/games.js'); const { FIGURES } = await import('../src/data/literature.js');
for (let sd = 0; sd < 60; sd++) { const r = figureRound(FIGURES, [], 's' + sd); ok(r.length === 10 && r.every((q) => q.answer >= 0 && q.answer < 5 && FIGURES.some((f) => f.text === q.text)) && new Set(r.map((q) => q.text)).size === 10, 'figure round: ten different real lines'); }
ok(FIGURE_KINDS.every(([k]) => FIGURES.filter((f) => f.figure === k).length >= 12), 'at least 12 lines of each figure');
console.log(`contest: ${n - fails}/${n}`); if (fails) process.exit(1);
