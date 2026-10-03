/* music.mjs — the composed loops (src/music.js) and the rules that play them (src/sound.js), no browser:
   a loop for every world, Home and each game family; every loop 60–90 s and seamless; every note in a
   sane range; the same loop is the same notes every time; the scheduler walks the seam without a gap or
   a doubled note; and silence where the rules say silence (off, Calm, hidden, a live microphone, the Stage). */
import { tally } from './_mem.mjs';
import { readFileSync } from 'node:fs';
import { WORLDS } from '../src/worlds.js';
import { SCORES, LOOP_IDS, loop, compose, due, hz } from '../src/music.js';
import { musicFor, musicLevel, musicAllowed, sameLoop, resolveLoop, WORLD_LOOPS, GAME_LOOPS, DUCK } from '../src/sound.js';
const { ok, done } = tally('music');

// every place has its music
for (const w of WORLDS) ok(`world ${w.id} has a loop`, !!loop(w.id) && WORLD_LOOPS.includes(w.id));
ok('Home has a loop', !!loop('home'));
for (const g of GAME_LOOPS) ok(`${g} has a loop`, !!loop(g));
ok('every world loop is a world', WORLD_LOOPS.every((id) => WORLDS.some((w) => w.id === id)));

const keys = new Set();
for (const id of LOOP_IDS) {
  const L = loop(id), S = SCORES[id];
  ok(`${id}: 60–90 s (${L.length.toFixed(1)})`, L.length >= 60 && L.length <= 90);
  ok(`${id}: length is whole bars`, Math.abs(L.length - L.bars * L.meter * 60 / L.bpm) < 1e-3);
  ok(`${id}: has notes in every voice it names`, ['pad', 'bass', 'melody', 'arp'].every((v) => !S[v] || L.notes.some((n) => n.voice === S[v].voice)));
  ok(`${id}: every note starts inside the loop`, L.notes.every((n) => n.t >= 0 && n.t < L.length));
  ok(`${id}: notes are in order`, L.notes.every((n, i) => !i || L.notes[i - 1].t <= n.t));
  ok(`${id}: every pitch is sane (E1–C7, ${Math.min(...L.notes.map((n) => n.midi))}–${Math.max(...L.notes.map((n) => n.midi))})`, L.notes.every((n) => Number.isInteger(n.midi) && n.midi >= 28 && n.midi <= 96));
  ok(`${id}: every note is quiet and has a length`, L.notes.every((n) => n.vel > 0 && n.vel <= 0.12 && n.dur > 0 && n.dur < 25));
  ok(`${id}: calm — under nine notes a second, chords included`, L.notes.length / L.length < 9);
  ok(`${id}: the same notes every time`, JSON.stringify(compose(id)) === JSON.stringify(L));
  keys.add(`${L.key} ${L.bpm}`);
  // the scheduler: two passes, in small lookahead windows, give every note exactly twice, one length apart
  const st = { t0: 10, i: 0 }, got = [];
  for (let t = 10; t < 10 + 2 * L.length; t += 0.3) got.push(...due(L, st, t));
  got.push(...due(L, st, 10 + 2 * L.length));
  ok(`${id}: the scheduler plays both passes whole`, got.length === 2 * L.notes.length);
  ok(`${id}: the second pass is the first, one loop later (seamless)`, got.slice(L.notes.length).every((n, i) => Math.abs(n.at - got[i].at - L.length) < 1e-6 && n.midi === got[i].midi));
  ok(`${id}: nothing scheduled twice or out of order`, got.every((n, i) => !i || got[i - 1].at <= n.at));
  const st2 = { t0: 10, i: 0 };
  ok(`${id}: the scheduler is deterministic`, JSON.stringify(due(L, st2, 40)) === JSON.stringify(due(L, { t0: 10, i: 0 }, 40)));
}
ok('every loop has its own key or tempo', keys.size === LOOP_IDS.length);
ok('A4 is 440 Hz', hz(69) === 440);

// which loop a screen plays
const r = (h) => ({ name: h.split('/')[0], parts: h.split('/') });
ok('Home plays the Home loop', musicFor(r('home'), 'study', null) === 'home');
ok('a screen elsewhere plays the current world', musicFor(r('library/stories'), 'study', null) === 'study' && musicFor(r('atlas'), 'lakeside', null) === 'lakeside');
ok('a story plays its world (narration ducks it)', musicFor(r('story/x'), 'forum', { mode: 'story' }) === 'forum');
ok('the Stage is silent — never music under a microphone', ['stage', 'stage/aloud', 'stage/contest', 'stage/sp-1'].every((h) => musicFor(r(h), 'garden', null) === null));
ok('a game being played plays the games loop', musicFor(r('play/rush'), 'garden', { mode: 'game', phase: 'play' }) === 'games');
ok('a game\'s title and result are quiet', musicFor(r('play/rush'), 'garden', { mode: 'game', phase: 'title' }) === null && musicFor(r('play/rush'), 'garden', { mode: 'game', phase: 'done' }) === null);
ok('the Play shelf plays the world', musicFor(r('play'), 'garden', null) === 'garden');
ok('no child yet: the Home loop', musicFor(r('welcome'), null, null) === 'home');
ok('a game family satisfies "games"', GAME_LOOPS.every((g) => sameLoop('games', g)) && !sameLoop('garden', 'games') && !sameLoop('games-word', 'games'));
ok('unknown ids resolve to nothing', resolveLoop('nope') === null && resolveLoop('games-word') === 'games-word');

// how loud
const d = { music: true, calm: false, volume: 0.4 };
ok('default is the 40% slider', musicLevel({ music: true }) === musicLevel(d) && musicLevel(d) > 0);
ok('louder slider, louder music', musicLevel({ ...d, volume: 0.8 }) > musicLevel(d));
ok('off when Music is off', musicLevel({ ...d, music: false }) === 0 && !musicAllowed({ ...d, music: false }, false));
ok('off in Calm mode', musicLevel({ ...d, calm: true }) === 0 && !musicAllowed({ ...d, calm: true }, false));
ok('off while hidden', musicLevel(d, { hidden: true }) === 0);
ok('off under a live microphone', musicLevel(d, { mic: true }) === 0 && musicLevel(d, { mic: true, ducked: true }) === 0 && !musicAllowed(d, true));
ok('ducked under a voice, not silenced', Math.abs(musicLevel(d, { ducked: true }) - musicLevel(d) * DUCK) < 1e-9 && musicLevel(d, { ducked: true }) > 0);
ok('volume is clamped', musicLevel({ ...d, volume: 5 }) === musicLevel({ ...d, volume: 1 }) && musicLevel({ ...d, volume: -1 }) === 0);

// lazy: the scores are not in the first load — sound.js reaches them only by dynamic import
const snd = readFileSync(new URL('../src/sound.js', import.meta.url), 'utf8');
ok('sound.js loads the scores lazily', /import\('\.\/music\.js'\)/.test(snd) && !/^import .*music\.js/m.test(snd));
ok('no audio files, no fetch', !/fetch\(|\.mp3|\.ogg|new Audio/.test(snd + readFileSync(new URL('../src/music.js', import.meta.url), 'utf8')));
ok('no AudioContext before a gesture', /if \(!gestured\) return null/.test(snd));
const credits = readFileSync(new URL('../music/CREDITS.md', import.meta.url), 'utf8');
for (const id of LOOP_IDS) ok(`CREDITS names ${id} with its key and tempo`, credits.includes(`\`${id}\``) && credits.includes(loop(id).key) && credits.includes(`${loop(id).bpm} bpm`));

done();
