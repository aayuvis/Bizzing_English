/* voice.js — "read it to me", in the DEVICE's own voice (the owner's default for v1: no new
   recorded narration). Only voices that run ON the device are used (localService): some browsers
   offer network voices that send the text away, and a child's reading never leaves this device.
   A US English voice is preferred first (the owner, 3 Oct 2026: the English app speaks US English). */

import { loadDevice } from './store.js';
import { clipUrl } from './lexicon.js';

let voice = null;
function pickVoice() {
  const vs = (globalThis.speechSynthesis?.getVoices() || []).filter((v) => v.localService && /^en/i.test(v.lang));
  return vs.find((v) => /en-US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || vs[0] || null;
}
export const canSpeak = () => !!globalThis.speechSynthesis && !!(voice ||= pickVoice());
globalThis.speechSynthesis?.addEventListener?.('voiceschanged', () => { voice = pickVoice(); });

/* Speak text; onWord(charIndex) fires on each word boundary for read-along highlighting. */
export function speak(text, { onWord, onEnd, rate } = {}) {
  stop();
  if (!canSpeak()) { onEnd?.(); return false; }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice; u.lang = voice.lang;
  u.rate = rate || (loadDevice().speed === 'slower' ? 0.8 : 0.95);
  if (onWord) u.onboundary = (e) => { if (e.name === 'word' || e.charIndex != null) onWord(e.charIndex); };
  u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
  return true;
}
export function stop() { try { globalThis.speechSynthesis?.cancel(); } catch {} cur?.pause?.(); }

/* A word: Bee's recorded clip first, the device's voice if there is none (or offline). */
let cur = null;
export function sayWord(w) {
  stop();
  if (loadDevice().sound === false) return;
  try {
    cur = new Audio(clipUrl(w));
    cur.play().catch(() => speak(w));
    cur.onerror = () => speak(w);
  } catch { speak(w); }
}
