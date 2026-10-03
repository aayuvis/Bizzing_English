/* narrate.js — the recorded narration (the family narrator, tools/voice/tts.py), with words lit as she
   reads. A clip's word timings are not recorded (the voice gives none), so the light moves through the
   words in proportion to the clip's time, weighted by each word's length — close enough to follow
   with a finger. No clip (or offline): the device's own voice reads it instead, word by word. */

import MAN from './data/voice-manifest.json';
import { loadDevice } from './store.js';
import { speak, stop as stopVoice } from './voice.js';
import { duck } from './sound.js';

let audio = null, raf = 0;
export const hasClip = (key) => !!MAN[key];
export const playing = () => !!audio && !audio.paused;

/* text: the words on screen, in order; onWord(i): index of the word now being read; onEnd() */
export function narrate(key, text, { onWord, onEnd } = {}) {
  stopNarration();
  const d = loadDevice();
  const words = [...String(text).matchAll(/[A-Za-z][A-Za-z'’-]*/g)];
  const weights = words.map((m) => 1 + m[0].length * 0.18), total = weights.reduce((a, b) => a + b, 0) || 1;
  const cum = []; weights.reduce((a, w, i) => (cum[i] = a + w), 0);
  if (!MAN[key] || d.sound === false) {
    if (d.sound === false) { onEnd?.(); return; }
    const starts = words.map((m) => m.index);
    speak(text, { onWord: (ci) => { let n = 0; while (n + 1 < starts.length && starts[n + 1] <= ci) n++; onWord?.(n); }, onEnd });
    return;
  }
  audio = new Audio(`voice/${key}.mp3`);
  audio.playbackRate = d.speed === 'slower' ? 0.85 : 1; audio.preservesPitch = true;
  duck(true);
  const a = audio, ms = MAN[key][0] / 1000;
  const lead = 0.25;   // the narrator draws breath before the first word
  const tick = () => {
    if (a !== audio || a.paused) return;
    const f = Math.max(0, Math.min(1, (a.currentTime - lead) / Math.max(0.5, (a.duration || ms) - lead - 0.3)));
    const target = f * total; let i = 0; while (i < cum.length - 1 && cum[i] < target) i++;
    onWord?.(i); raf = requestAnimationFrame(tick);
  };
  a.onplay = () => { raf = requestAnimationFrame(tick); };
  a.onended = () => { if (a === audio) { audio = null; duck(false); onEnd?.(); } };
  a.onerror = () => { if (a === audio) { audio = null; duck(false); speak(text, { onEnd }); } };
  a.play().catch(() => { if (a === audio) { audio = null; duck(false); onEnd?.(); } });
}
export function pauseNarration() { if (audio) { audio.pause(); cancelAnimationFrame(raf); } }
export function resumeNarration() { audio?.play(); }
export function stopNarration() { cancelAnimationFrame(raf); if (audio) { audio.pause(); audio = null; duck(false); } stopVoice(); }
