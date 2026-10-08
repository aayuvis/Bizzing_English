/* mic.js — the microphone, under Finance's rules (SPEC §5), verbatim:
   • it opens ONLY from a real tap (start() is called from a click handler, never on load);
   • its track STOPS the instant recording ends — a stream left open is a microphone left on (and the page
     going away ends it too: pagehide);
   • a recorded voice NEVER leaves the device: nothing is recorded at all. A WebAudio analyser hands over
     a few milliseconds of sound at a time; each moment is turned into NUMBERS at once (loudness, a pitch,
     how much the spectrum moved) and the sound itself is dropped. Only the numbers survive: duration,
     pace (the known text's words ÷ duration), pauses (silence ≥ 0.35 s between speech), volume range —
     and the speech evidence below.
   No speech recognition of any kind: the browser's SpeechRecognition sends audio to a server, and
   is forbidden here. The app never claims to mark what it cannot measure — expression and eye
   contact are judged by the child and a grown-up, and the screen says which.

   SPEECH EVIDENCE (HANDOVER C §2.2.4) — before any delivery point counts in The Podium, the numbers must
   look like a person speaking, not a beep, a hum, a fan or a tapping pencil:
     voiced     a pitch 80–400 Hz (autocorrelation) in ≥ 35% of the frames above the noise floor
     movement   the pitch moves: a spread of ≥ 1.5 semitones across the voiced frames (a beep has none)
     change     the spectrum's shape changes (band flux) in ≥ 40% of the voiced time (steady tones do not)
     rhythm     loudness peaks ≈ the text's syllables ± 30% (readings); 2–5 a second (speeches)
   Each is a number per frame, computed inside the analyser loop; evidence() decides from the numbers. */

let live = null;
export const isLive = () => !!live;

export const STEP_MS = 25;                       // one frame of numbers every 25 ms
const FFT = 2048;                                // ~43 ms of sound at 48 kHz: three periods of an 80 Hz voice

export async function start(onLevel) {
  if (live) return false;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const C = globalThis.AudioContext || globalThis.webkitAudioContext, ctx = new C();
  const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = FFT; an.smoothingTimeConstant = 0; src.connect(an);
  const buf = new Float32Array(an.fftSize);
  const m = { t0: performance.now(), frames: [], stream, ctx, timer: 0, prev: null };
  m.timer = setInterval(() => {
    an.getFloatTimeDomainData(buf);
    const f = features(buf, ctx.sampleRate, m.prev); m.prev = f.bands;            // the sound is dropped here: only the numbers go on
    m.frames.push([performance.now() - m.t0, f.db, f.f0, f.flux]); onLevel?.(Math.max(0, Math.min(1, (f.db + 60) / 50)));
  }, STEP_MS);
  live = m; return true;
}

/* Stop at once: every track ended, the context closed — THEN the numbers are read. Returns the measured
   numbers only, with the speech evidence (o: { syllables, mode: 'reading' | 'speech', minSecs }). */
export function stop(words = 0, o = {}) {
  const m = live; if (!m) return null;
  live = null; clearInterval(m.timer);
  m.stream.getTracks().forEach((t) => t.stop());
  m.ctx.close?.();
  const out = measure(m.frames, words); out.ev = evidence(m.frames, o);
  m.frames = null; return out;
}
/* the page going away (a closed tab, a navigation off the site) ends the microphone too */
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { if (live) stop(); });

export const PARTIAL_WPM = 230, FLOOR_DB = -70;
const dtOf = (frames, i) => (i ? frames[i][0] - frames[i - 1][0] : (frames[1]?.[0] ?? 50) - frames[0][0] || 50);
function gate(frames) {
  const dbs = frames.map((f) => f[1]).sort((a, b) => a - b);
  const floor = dbs[Math.floor(dbs.length * 0.1)], loud = dbs[Math.floor(dbs.length * 0.95)];
  return floor + Math.max(6, (loud - floor) * 0.35);
}
export function measure(frames, words) {
  if (!frames.length) return { secs: 0, wpm: 0, pauses: 0, range: 0 };
  /* noise suppression hands back DIGITAL silence (−180 dB), which once made a "109 dB loud-to-soft range";
     nothing quieter than a still room (−70 dB) is counted as itself */
  frames = frames.map(([t, db]) => [t, Math.max(FLOOR_DB, db)]);
  const thr = gate(frames);
  const speech = frames.filter((f) => f[1] > thr);
  if (!speech.length) return { secs: +(frames.at(-1)[0] / 1000).toFixed(1), wpm: 0, pauses: 0, range: 0, quiet: true };
  const first = speech[0][0], last = speech.at(-1)[0], secs = Math.max(0.5, (last - first) / 1000);
  let pauses = 0, run = 0;
  frames.forEach(([t, db], i) => { if (t < first || t > last) return; if (db <= thr) run += dtOf(frames, i); else { if (run >= 350) pauses++; run = 0; } });
  const sp = speech.map((f) => f[1]).sort((a, b) => a - b);
  /* pace assumes the whole text was read; faster than anyone reads aloud (230 words a minute) means it was not,
     so no pace is claimed — the reading is marked partial (a 3-second stop once claimed 4,950 words a minute) */
  const raw = words ? words / (secs / 60) : 0, partial = !!words && raw > PARTIAL_WPM;
  return { secs: +secs.toFixed(1), wpm: partial ? 0 : Math.round(raw), partial, pauses, range: Math.round(sp[Math.floor(sp.length * 0.9)] - sp[Math.floor(sp.length * 0.1)]) };   // the loud and soft of the SPEECH, its outer tenths set aside
}

/* ---------- the numbers of one moment of sound (pure: test/podium.mjs feeds it made-up sound) ---------- */
export const VERIFY = {
  f0: [80, 400],          // a speaking voice's pitch
  clarity: 0.6,           // how periodic a frame must be to have a pitch at all (normalised autocorrelation)
  voiced: 0.35,           // of the frames above the noise floor
  semis: 1.5,             // the pitch's spread, in semitones (interquartile, so a stray octave slip is not "movement")
  fluxDb: 0.9,            // a frame's spectral change, dB per band, loudness taken out
  flux: 0.4,              // of the voiced frames
  sylTol: 0.3,            // readings: peaks within ±30% of the text's syllables
  sylCal: 1,              // peaks the envelope finds per spoken syllable (the owner calibrates on real readings, locally)
  rate: [2, 5],           // speeches: syllables a second
  minVoicedSecs: 1.5,     // less voiced sound than this is not a speech
};
const DSR = 16000;        // every frame is looked at as 16 kHz sound (cheap; still twice a voice's 4 kHz)
const BANDS = 18;

export function features(buf, sr, prevBands = null) {
  let s2 = 0; for (let i = 0; i < buf.length; i++) s2 += buf[i] * buf[i];
  const rms = Math.sqrt(s2 / buf.length), db = 20 * Math.log10(rms + 1e-9);
  const D = Math.max(1, Math.round(sr / DSR)), rate = sr / D, n = Math.floor(buf.length / D), x = new Float64Array(n);
  let mean = 0; for (let j = 0; j < n; j++) { let a = 0; for (let k = 0; k < D; k++) a += buf[j * D + k]; x[j] = a / D; mean += x[j]; }
  mean /= n; for (let j = 0; j < n; j++) x[j] -= mean;
  /* pitch: the normalised autocorrelation's best lag between 1/400 s and 1/80 s; the shortest lag nearly as good
     wins (a voice an octave down is the commonest slip) */
  let f0 = 0, clarity = 0;
  if (rms > 1e-4) {
    const lo = Math.floor(rate / VERIFY.f0[1]), hi = Math.min(n - 2, Math.ceil(rate / VERIFY.f0[0])), r = new Float64Array(hi + 2);
    let best = 0;
    for (let l = lo - 1; l <= hi + 1; l++) { let num = 0, den = 0; for (let i = 0; i + l < n; i++) { num += x[i] * x[i + l]; den += x[i] * x[i] + x[i + l] * x[i + l]; } r[l] = den > 0 ? (2 * num) / den : 0; if (l >= lo && l <= hi && r[l] > best) best = r[l]; }
    if (best >= VERIFY.clarity) {
      let L = 0; for (let l = lo; l <= hi; l++) if (r[l] >= best * 0.9 && r[l] >= r[l - 1] && r[l] >= r[l + 1]) { L = l; break; }
      if (L) { const a = r[L - 1], b = r[L], c = r[L + 1], d = a - 2 * b + c, off = d ? (0.5 * (a - c)) / d : 0, hz = rate / (L + Math.max(-0.5, Math.min(0.5, off)));
        if (hz >= VERIFY.f0[0] && hz <= VERIFY.f0[1]) { f0 = hz; clarity = b; } }
    }
  }
  /* the spectrum's shape: power in log-spaced bands from 100 Hz to 4 kHz (a Hann window, a small FFT) */
  let N = 1; while (N * 2 <= n) N *= 2;
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N; i++) re[i] = x[n - N + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  fft(re, im);
  const top = Math.min(4000, rate * 0.48), edges = Array.from({ length: BANDS + 1 }, (_, i) => 100 * (top / 100) ** (i / BANDS)), bands = new Array(BANDS).fill(0);
  for (let k = 1; k < N / 2; k++) { const hz = (k * rate) / N; if (hz < edges[0] || hz >= edges[BANDS]) continue; let b = 0; while (hz >= edges[b + 1]) b++; bands[b] += re[k] * re[k] + im[k] * im[k]; }
  for (let b = 0; b < BANDS; b++) bands[b] = 10 * Math.log10(bands[b] + 1e-12);
  let flux = 0;
  if (prevBands) { const d = bands.map((v, b) => v - prevBands[b]), m = d.reduce((a, v) => a + v, 0) / BANDS; flux = d.reduce((a, v) => a + Math.abs(v - m), 0) / BANDS; }
  return { db, f0, clarity, flux, bands };
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) { const a = i + j, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
  }
}

/* loudness peaks: the envelope smoothed over 75 ms; a peak stands ≥ 4 dB above the dip before it, above the
   speech gate, and ≥ 120 ms after the last one */
export function peaks(frames, thr) {
  const db = frames.map((f) => Math.max(FLOOR_DB, f[1])), sm = db.map((_, i) => (db[Math.max(0, i - 1)] + db[i] + db[Math.min(db.length - 1, i + 1)]) / 3);
  let n = 0, high = false, top = -Infinity, valley = Infinity, lastT = -1e9;
  for (let i = 0; i < sm.length; i++) {
    const v = sm[i], t = frames[i][0];
    if (high) { if (v > top) top = v; else if (v < top - 4) { high = false; valley = v; } }       // the syllable has fallen away
    else if (v > thr && v - valley >= 4 && t - lastT >= 120) { high = true; top = v; n++; lastT = t; }
    else valley = Math.min(valley, v);
  }
  return n;
}

const pc = (v) => `${Math.round(v * 100)}%`;
/* The evidence, from the numbers alone. frames: [t ms, dB, pitch Hz (0 = none), flux dB]. */
export function evidence(frames, { syllables = 0, mode = 'reading', minSecs = 0 } = {}) {
  const V = VERIFY, fail = (why) => ({ ok: false, why, checks: [] });
  if (!frames || frames.length < 8) return fail('too short');
  const fr = frames.map(([t, db, f0 = 0, flux = 0]) => [t, Math.max(FLOOR_DB, db), f0, flux]);
  const thr = gate(fr), above = fr.filter((f) => f[1] > thr), voiced = above.filter((f) => f[2] >= V.f0[0] && f[2] <= V.f0[1]);
  const step = fr.length > 1 ? (fr.at(-1)[0] - fr[0][0]) / (fr.length - 1) : STEP_MS;
  const voicedFrac = above.length ? voiced.length / above.length : 0, voicedSecs = (voiced.length * step) / 1000;
  /* movement: the interquartile spread of the pitch in semitones, as a standard deviation (IQR ÷ 1.349) */
  let semis = 0;
  if (voiced.length >= 8) { const st = voiced.map((f) => 12 * Math.log2(f[2] / 100)).sort((a, b) => a - b), q = (p) => st[Math.floor(p * (st.length - 1))]; semis = (q(0.75) - q(0.25)) / 1.349; }
  const fluxFrac = voiced.length ? voiced.filter((f) => f[3] >= V.fluxDb).length / voiced.length : 0;
  const pk = peaks(fr, thr), firstT = above.length ? above[0][0] : fr[0][0], span = Math.max(0.001, (fr.at(-1)[0] - firstT) / 1000);
  const want = syllables * V.sylCal, rate = pk / span;
  const rhythm = mode === 'speech' ? rate >= V.rate[0] && rate <= V.rate[1] && span >= minSecs : syllables > 0 && Math.abs(pk - want) <= V.sylTol * want;
  const checks = [
    { id: 'voiced', label: 'A voice: a pitch a person speaks at', ok: voicedFrac >= V.voiced && voicedSecs >= V.minVoicedSecs, got: pc(voicedFrac), need: `${pc(V.voiced)} of the sound` },
    { id: 'pitch', label: 'The pitch moves, as speech does', ok: semis >= V.semis, got: `${semis.toFixed(1)} semitones`, need: `${V.semis} or more` },
    { id: 'change', label: 'The sound keeps changing shape', ok: fluxFrac >= V.flux, got: pc(fluxFrac), need: `${pc(V.flux)} of the voice` },
    mode === 'speech'
      ? { id: 'rhythm', label: 'Syllables at a speaking rhythm', ok: rhythm, got: `${rate.toFixed(1)} a second over ${Math.round(span)} s`, need: `${V.rate[0]}–${V.rate[1]} a second${minSecs ? `, for ${Math.round(minSecs)} s or more` : ''}` }
      : { id: 'rhythm', label: 'About one beat for each syllable', ok: rhythm, got: `${pk} beats`, need: `${Math.round(want * (1 - V.sylTol))}–${Math.round(want * (1 + V.sylTol))} (the text has ${syllables} syllables)` },
  ];
  return { ok: checks.every((c) => c.ok), checks, peaks: pk, rate: +rate.toFixed(2), voicedFrac: +voicedFrac.toFixed(3), semis: +semis.toFixed(2), fluxFrac: +fluxFrac.toFixed(3) };
}
