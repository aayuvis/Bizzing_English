/* podium-audio.mjs — made-up sound for testing The Podium's speech evidence (HANDOVER C §2.2.4, §2.2.6):
   the harness's fake inputs (a beep, silence, constant noise, rhythmic noise, a six-second stop) and a
   speech-like signal (a voice whose pitch wanders 100–300 Hz, vowels that change, syllables at a speaking
   rate, breaths between phrases). Pure, seeded, no files unless wav() is asked for one.
   frames(samples, sr) runs mic.js features() exactly as the analyser loop does: every 25 ms, the last
   2048 samples. */
import { features, STEP_MS } from '../src/mic.js';

export const SR = 48000;
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

export function silence(secs, sr = SR) { return new Float32Array(Math.round(secs * sr)); }
export function tone(secs, hz = 440, amp = 0.3, sr = SR) { const a = new Float32Array(Math.round(secs * sr)); for (let i = 0; i < a.length; i++) a[i] = amp * Math.sin((2 * Math.PI * hz * i) / sr); return a; }
/* Chromium's own fake microphone: a 400 Hz square beep, 20 ms long, every 500 ms */
export function beep(secs, sr = SR) { const a = new Float32Array(Math.round(secs * sr)), per = sr / 400; for (let i = 0; i < a.length; i++) { const inBeep = (i % (sr / 2)) < sr * 0.02; a[i] = inBeep ? ((i % per) < per / 2 ? 0.3 : -0.3) : 0; } return a; }
export function noise(secs, amp = 0.15, seed = 7, sr = SR) { const R = seeded(seed), a = new Float32Array(Math.round(secs * sr)); for (let i = 0; i < a.length; i++) a[i] = amp * (R() * 2 - 1); return a; }
/* noise in syllable-sized bursts: 150 ms on, rest off, `rate` a second */
export function rhythmicNoise(secs, rate = 3.6, seed = 9, sr = SR) {
  const a = noise(secs, 0.2, seed, sr), per = sr / rate, on = sr * 0.15;
  for (let i = 0; i < a.length; i++) { const p = i % per; a[i] *= p < on ? Math.sin((Math.PI * p) / on) : 0; }
  return a;
}
/* a tone in syllable-sized bursts: the pitch never moves */
export function rhythmicTone(secs, rate = 4, hz = 220, sr = SR) {
  const a = new Float32Array(Math.round(secs * sr)), per = sr / rate, on = sr * 0.17;
  for (let i = 0; i < a.length; i++) { const p = i % per, env = p < on ? Math.sin((Math.PI * p) / on) : 0; let v = 0; for (let h = 1; h <= 8; h++) v += Math.sin((2 * Math.PI * hz * h * i) / sr) / h; a[i] = 0.25 * env * v; }
  return a;
}
const VOWELS = [[730, 1090], [270, 2290], [300, 870], [530, 1840], [660, 1720], [440, 1020]];   // a, i, u, e, æ, o
/* A speech-like voice: `syl` syllables at about `rate` a second, a breath every 6–9 syllables. Returns
   { samples, syllables }. Each syllable: a vowel (two formants over a harmonic voice), a pitch that starts
   somewhere in 110–270 Hz and glides, a rise and fall of loudness. */
export function speechLike(syl = 80, rate = 4, seed = 3, sr = SR) {
  const R = seeded(seed), out = [];
  let left = 6 + Math.floor(R() * 4);
  for (let s = 0; s < syl; s++) {
    const dur = (0.7 + R() * 0.25) / rate, gap = 1 / rate - dur + (--left <= 0 ? ((left = 6 + Math.floor(R() * 4)), 0.35) : 0);
    const n = Math.round(dur * sr), f0a = 110 + R() * 160, f0b = Math.max(100, Math.min(300, f0a * (0.8 + R() * 0.4))), [F1, F2] = VOWELS[Math.floor(R() * VOWELS.length)];
    let ph = 0; const seg = new Float32Array(n + Math.round(gap * sr));
    for (let i = 0; i < n; i++) {
      const u = i / n, f0 = f0a + (f0b - f0a) * u, env = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.5; ph += (2 * Math.PI * f0) / sr;
      let v = 0; for (let h = 1; h * f0 < 4000; h++) { const hz = h * f0, g = 1 / (1 + ((hz - F1) / 90) ** 2) + 0.6 / (1 + ((hz - F2) / 120) ** 2) + 0.05 / h; v += g * Math.sin(h * ph); }
      seg[i] = 0.12 * env * v;
    }
    out.push(seg);
  }
  const len = out.reduce((a, x) => a + x.length, 0), samples = new Float32Array(len + Math.round(0.3 * sr)); let o = Math.round(0.3 * sr);   // a breath before the first word
  for (const x of out) { samples.set(x, o); o += x.length; }
  return { samples, syllables: syl };
}
export function concat(...parts) { const n = parts.reduce((a, p) => a + p.length, 0), out = new Float32Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; }

/* the analyser loop, offline: every 25 ms, the 2048 samples before it, through features() */
export function frames(samples, sr = SR, win = 2048) {
  const out = [], hop = Math.round((STEP_MS / 1000) * sr); let prev = null;
  for (let end = win, t = 0; end <= samples.length; end += hop, t += STEP_MS) { const f = features(samples.subarray(end - win, end), sr, prev); prev = f.bands; out.push([t, f.db, f.f0, f.flux]); }
  return out;
}
/* 16-bit mono WAV, for Chromium's --use-file-for-fake-audio-capture */
export function wav(samples, sr = SR) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  return b;
}
