/* sound.js — effects and music, composed in code with WebAudio (FAMILY-STANDARD §11): nothing to
   download, nothing licensed. Effects: right · wrong · finish · medal · coin · unlock, soft and
   short, under one mute. Music: one calm loop per world and one for the games, default 40%, ducks
   under the voice, pauses when the page is hidden, off in Calm mode. Credits: music/CREDITS.md. */

import { loadDevice } from './store.js';

let ctx = null, master = null, musicGain = null, loop = null;
function ac() {
  if (ctx) return ctx;
  const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) return null;
  ctx = new C(); master = ctx.createGain(); master.connect(ctx.destination); musicGain = ctx.createGain(); musicGain.connect(master);
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

/* A world's loop: a slow pentatonic pattern in that world's key, 8 bars, regenerated each bar. */
const KEYS = { garden: [262, 294, 330, 392, 440], study: [220, 247, 262, 330, 349], playhouse: [294, 330, 370, 440, 494], forum: [247, 277, 311, 370, 415], scriptorium: [196, 220, 247, 294, 330], lakeside: [233, 262, 294, 349, 392], games: [330, 370, 415, 494, 554] };
export function music(id) {
  stopMusic();
  const d = dev(); if (!d.music || d.calm || !id || !ac()) return;
  if (ctx.state === 'suspended') ctx.resume();
  const scale = KEYS[id] || KEYS.garden, bar = 2.4; let n = 0;
  musicGain.gain.value = (d.volume ?? 0.4) * 0.35;
  const play = () => {
    if (document.hidden) return;
    const t = ctx.currentTime + 0.05;
    for (let i = 0; i < 4; i++) tone(scale[(n * 3 + i * 2 + (n % 2)) % 5] / (i % 2 ? 1 : 2), t + i * bar / 4, bar / 2.2, 'sine', 0.05, musicGain);
    tone(scale[0] / 4, t, bar * 0.95, 'triangle', 0.035, musicGain);
    n++;
  };
  play(); loop = setInterval(play, bar * 1000);
}
export function stopMusic() { if (loop) clearInterval(loop); loop = null; }
export function duck(on) { if (musicGain && ctx) musicGain.gain.setTargetAtTime(on ? 0.02 : (dev().volume ?? 0.4) * 0.35, ctx.currentTime, 0.2); }
document.addEventListener?.('visibilitychange', () => { if (document.hidden && ctx) ctx.suspend?.(); else if (ctx) ctx.resume?.(); });
