/* sound.js — effects and music, composed in code with WebAudio (FAMILY-STANDARD §11): nothing to
   download, nothing licensed. Effects: right · wrong · finish · medal · coin · unlock, soft and
   short, under one mute. Music: one composed loop per world, one for Home and one per game family
   (the scores are src/music.js, loaded on the first loop heard), default 40%, ducks under the voice,
   pauses when the page is hidden, off in Calm mode, and never under a live microphone.
   Credits: music/CREDITS.md. */

import { loadDevice } from './store.js';
import { isLive as micLive } from './mic.js';

let ctx = null, master = null, musicGain = null;
let gestured = false;                                     // no AudioContext before a real tap or key
function ac() {
  if (ctx) return ctx;
  if (!gestured) return null;
  const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) return null;
  ctx = new C(); master = ctx.createGain(); master.connect(ctx.destination);
  musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(ctx.destination);   // music has its own level, apart from the effects
  return ctx;
}
const dev = () => loadDevice();
function tone(f, t0, dur, type = 'sine', vol = 0.18, dest) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.02);
}
const FX = {
  right: [[659, 0, 0.16], [880, 0.08, 0.22]],
  wrong: [[220, 0, 0.22, 'triangle', 0.12]],
  finish: [[523, 0, 0.2], [659, 0.1, 0.2], [784, 0.2, 0.2], [1047, 0.3, 0.4]],
  medal: [[784, 0, 0.25], [988, 0.12, 0.25], [1175, 0.24, 0.5]],
  coin: [[1318, 0, 0.08, 'square', 0.06], [1760, 0.06, 0.14, 'square', 0.06]],
  unlock: [[392, 0, 0.18], [523, 0.1, 0.18], [784, 0.2, 0.35]],
  tap: [[880, 0, 0.05, 'sine', 0.06]],
};
export function sfx(name) {
  const d = dev(); if (!d.sound || !FX[name]) return;
  if (!ac()) return; if (ctx.state === 'suspended') ctx.resume();
  master.gain.value = Math.max(0, Math.min(1, d.volume ?? 0.4)) * (d.calm ? 0.6 : 1) * 2;
  const t = ctx.currentTime + 0.01; for (const [f, at, dur, type, vol] of FX[name]) tone(f, t + at, dur, type, vol);
}

/* ---------- music: the rules, as pure functions (test/music.mjs) ---------- */

export const WORLD_LOOPS = ['garden', 'study', 'playhouse', 'forum', 'scriptorium', 'lakeside'];
export const GAME_LOOPS = ['games', 'games-word', 'games-sentence', 'games-reading'];
export const FADE = 1.5;                                  // a world change crossfades over this many seconds
export const DUCK = 0.2;                                  // under a voice the music keeps a fifth of its level
const MUSIC_SCALE = 0.5;                                  // the loops are written quiet; the slider's 40% sits low under reading

/* Which loop a screen plays: Home has its own, the Stage (every microphone room) is silent, a game keeps
   its family's loop while it is played, everything else plays the child's current world. null = silence. */
export function musicFor(route, worldId, run) {
  const name = route?.name || 'home', p = route?.parts || [];
  if (name === 'stage' || name === 'recordings') return null;
  if (name === 'play' && p[1] && run?.mode === 'game') return run.phase === 'play' ? 'games' : null;   // a game's own loop while it is played; quiet on its title and result
  if (!worldId || name === 'home' || name === 'settings' || name === 'welcome') return 'home';
  return WORLD_LOOPS.includes(worldId) ? worldId : 'home';
}
/* A game family's loop satisfies a request for 'games' (play.js may ask for its own family). */
export const sameLoop = (want, have) => want === have || (want === 'games' && GAME_LOOPS.includes(have));
export const resolveLoop = (id) => (WORLD_LOOPS.includes(id) || GAME_LOOPS.includes(id) || id === 'home' ? id : null);

/* The music's gain for a device and a moment: 0 when switched off, in Calm mode, hidden or under a live
   microphone; a fifth of itself under a voice; otherwise the one volume slider (default 40%). */
export function musicLevel(d, { ducked = false, mic = false, hidden = false } = {}) {
  if (!d || d.music === false || d.calm || mic || hidden) return 0;
  const v = Math.max(0, Math.min(1, d.volume ?? 0.4)) * MUSIC_SCALE;
  return ducked ? v * DUCK : v;
}
/* May a loop be playing at all (as opposed to merely quiet)? */
export const musicAllowed = (d, mic) => !!d && d.music !== false && !d.calm && !mic;

/* ---------- music: the player ---------- */

let M = null, Mp = null;                                  // src/music.js, loaded on first need
const loadScores = () => Mp || (Mp = import('./music.js').then((m) => (M = m)));
let want = null, cur = null, ducked = false, routeKey = '', timer = 0, explicit = false;
const LOOKAHEAD = 1.2, TICK = 300;
const hidden = () => !!globalThis.document?.hidden;

function tick() {
  timer = 0; const c = cur; if (!c || !ctx) return;
  if (ctx.state === 'running') for (const n of M.due(c.L, c.st, ctx.currentTime + LOOKAHEAD)) if (n.at >= ctx.currentTime - 0.02) M.playNote(ctx, c.g, n, n.at);
  timer = setTimeout(tick, TICK);
}
function fadeOut(c, secs) {
  if (!c) return; const t = ctx.currentTime;
  c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value, t); c.g.gain.linearRampToValueAtTime(0, t + secs);
  setTimeout(() => { try { c.g.disconnect(); } catch {} }, secs * 1000 + 200);
}
function stopNow() {                                       // the microphone: every music voice off at once
  if (timer) clearTimeout(timer); timer = 0;
  if (cur && ctx) { cur.g.gain.cancelScheduledValues(ctx.currentTime); cur.g.gain.setValueAtTime(0, ctx.currentTime); try { cur.g.disconnect(); } catch {} }
  cur = null;
}
async function apply() {
  const d = dev(), mic = micLive();
  if (mic) { stopNow(); if (musicGain && ctx) musicGain.gain.setValueAtTime(0, ctx.currentTime); return; }
  const id = musicAllowed(d, mic) ? want : null;
  if (!id) { if (cur && ctx) { if (timer) clearTimeout(timer); timer = 0; fadeOut(cur, 0.4); cur = null; } return; }
  if (!ac()) return;                                       // waits for the first gesture
  if (ctx.state === 'suspended' && !hidden()) ctx.resume?.();
  musicGain.gain.setTargetAtTime(musicLevel(d, { ducked, hidden: hidden() }), ctx.currentTime, 0.25);
  if (cur && sameLoop(id, cur.id)) return;
  await loadScores();
  if (want !== id || micLive() || !musicAllowed(dev(), false)) return;   // changed while loading
  if (cur && sameLoop(id, cur.id)) return;
  const L = M.loop(id); if (!L) return;
  const old = cur, g = ctx.createGain(), t = ctx.currentTime;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + (old ? FADE : 0.8)); g.connect(musicGain);
  if (old) fadeOut(old, FADE);
  cur = { id, L, g, st: { t0: t + 0.08, i: 0 } };
  if (timer) clearTimeout(timer); tick();
}

/* A game asks for its loop (play.js): 'games', 'games-word', 'games-sentence', 'games-reading'. */
export function music(id) { want = resolveLoop(id) || (id ? 'games' : null); explicit = !!want; apply(); }
/* Leaving a game: its loop stops; the next render's syncMusic brings the world's back in. */
export function stopMusic() { explicit = false; want = null; apply(); }
/* main.js's one hook, every render: the screen's loop (musicFor) and where we are. A new route lifts a
   stale duck (route() has already stopped every voice). While a game holds the music, the game wins. */
export function syncMusic(id, key = '') {
  if (key !== routeKey) { routeKey = key; ducked = false; }
  if (explicit && id === 'games') { apply(); return; }
  explicit = false; want = id; apply();
}
/* Under a voice (narration, read-aloud): the music dips smoothly; under a live microphone it stops. */
export function duck(on) {
  ducked = !!on;
  if (on && micLive()) { apply(); return; }
  if (!on && !cur) { apply(); return; }
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(musicLevel(dev(), { ducked, mic: micLive(), hidden: hidden() }), ctx.currentTime, 0.25);
}

const D = globalThis.document;
const arm = () => { if (gestured) return; gestured = true; for (const e of ['pointerdown', 'keydown', 'touchend', 'click']) D.removeEventListener(e, arm, true); apply(); };
if (D?.addEventListener) {
  for (const e of ['pointerdown', 'keydown', 'touchend', 'click']) D.addEventListener(e, arm, true);
  D.addEventListener('visibilitychange', () => { if (!ctx) return; if (D.hidden) ctx.suspend?.(); else { ctx.resume?.(); apply(); } });
  D.addEventListener('change', (e) => { if (e.target?.dataset?.act === 'dev-volume') setTimeout(apply, 0); });   // the slider saves without a render
  D.addEventListener('input', (e) => { if (e.target?.dataset?.act === 'dev-volume' && musicGain && ctx) musicGain.gain.setTargetAtTime(musicLevel({ ...dev(), volume: +e.target.value }, { ducked }), ctx.currentTime, 0.1); });
}
