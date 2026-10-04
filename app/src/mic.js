/* mic.js — the microphone, under Finance's rules (SPEC §5), verbatim:
   • it opens ONLY from a real tap (start() is called from a click handler, never on load);
   • its track STOPS the instant recording ends — a stream left open is a microphone left on;
   • a recorded voice NEVER leaves the device: nothing is recorded at all. A WebAudio analyser reads
     loudness, frame by frame, and only the numbers survive: duration, pace (the known text's words ÷
     duration), pauses (silence ≥ 0.35 s between speech) and volume range.
   No speech recognition of any kind: the browser's SpeechRecognition sends audio to a server, and
   is forbidden here. The app never claims to mark what it cannot measure — expression and eye
   contact are judged by the child and a grown-up, and the screen says which. */

let live = null;
export const isLive = () => !!live;

export async function start(onLevel) {
  if (live) return false;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const C = globalThis.AudioContext || globalThis.webkitAudioContext, ctx = new C();
  const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
  const buf = new Float32Array(an.fftSize);
  const m = { t0: performance.now(), frames: [], stream, ctx, timer: 0 };
  m.timer = setInterval(() => {
    an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v;
    const db = 20 * Math.log10(Math.sqrt(s / buf.length) + 1e-9);
    m.frames.push([performance.now() - m.t0, db]); onLevel?.(Math.max(0, Math.min(1, (db + 60) / 50)));
  }, 50);
  live = m; return true;
}

/* Stop at once: every track ended, the context closed. Returns the measured numbers only. */
export function stop(words = 0) {
  const m = live; if (!m) return null;
  live = null; clearInterval(m.timer);
  m.stream.getTracks().forEach((t) => t.stop());
  m.ctx.close?.();
  return measure(m.frames, words);
}

export const PARTIAL_WPM = 230, FLOOR_DB = -70;
export function measure(frames, words) {
  if (!frames.length) return { secs: 0, wpm: 0, pauses: 0, range: 0 };
  /* noise suppression hands back DIGITAL silence (−180 dB), which once made a "109 dB loud-to-soft range";
     nothing quieter than a still room (−70 dB) is counted as itself */
  frames = frames.map(([t, db]) => [t, Math.max(FLOOR_DB, db)]);
  const dbs = frames.map((f) => f[1]).sort((a, b) => a - b);
  const floor = dbs[Math.floor(dbs.length * 0.1)], loud = dbs[Math.floor(dbs.length * 0.95)];
  const thr = floor + Math.max(6, (loud - floor) * 0.35);
  const speech = frames.filter((f) => f[1] > thr);
  if (!speech.length) return { secs: +(frames.at(-1)[0] / 1000).toFixed(1), wpm: 0, pauses: 0, range: 0, quiet: true };
  const first = speech[0][0], last = speech.at(-1)[0], secs = Math.max(0.5, (last - first) / 1000);
  let pauses = 0, run = 0;
  for (const [t, db] of frames) { if (t < first || t > last) continue; if (db <= thr) run += 50; else { if (run >= 350) pauses++; run = 0; } }
  const sp = speech.map((f) => f[1]).sort((a, b) => a - b);
  /* pace assumes the whole text was read; faster than anyone reads aloud (230 words a minute) means it was not,
     so no pace is claimed — the reading is marked partial (a 3-second stop once claimed 4,950 words a minute) */
  const raw = words ? words / (secs / 60) : 0, partial = !!words && raw > PARTIAL_WPM;
  return { secs: +secs.toFixed(1), wpm: partial ? 0 : Math.round(raw), partial, pauses, range: Math.round(sp[Math.floor(sp.length * 0.9)] - sp[Math.floor(sp.length * 0.1)]) };   // the loud and soft of the SPEECH, its outer tenths set aside
}
