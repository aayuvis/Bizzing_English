/* music.js — the loops, composed in code (FAMILY-STANDARD §11; SPEC: "Music: composed in code (WebAudio),
   one loop per world, one for Home and one for the games"). No audio files: every loop is a score built
   here from a key, a tempo, a chord progression and a few voices, and a seeded generator writes the tune,
   so the same loop is the same notes every time (test/music.mjs). Loaded lazily by sound.js on the first
   loop a child hears — nothing here is in the first load.

   A loop is { id, name, key, bpm, meter, bars, length (s), notes: [{ t, dur, midi, voice, vel }] },
   every note starting inside [0, length), so the score repeats without a seam; a tail may ring into the
   next pass, as it would in a room. Calm, low and sparse by design: it sits under reading. */

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], pentatonic: [0, 2, 4, 7, 9],
};
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/* The scores. root is the tonic's MIDI number; prog is a scale degree (0 = I) per bar, cycled;
   pad/bass/arp/melody describe each voice's part. */
export const SCORES = {
  home: {
    name: "Quill's Hearth", mood: 'a fireside music box, unhurried', root: 65, mode: 'major', bpm: 84, meter: 4, bars: 28,
    prog: [0, 0, 3, 3, 5, 5, 4, 4, 0, 0, 3, 3, 1, 1, 4, 4],
    pad: { voice: 'pad', oct: -12, rhythm: 'hold', vel: 0.05 },
    bass: { voice: 'bass', oct: -24, pattern: 'root', vel: 0.09 },
    melody: { voice: 'bell', oct: 12, vel: 0.06, rhythms: [[2, 2], [1, 1, 2], [3, 1], [4]], rest: 0.25 },
  },
  garden: {
    name: 'Petals and Bells', mood: 'bright pentatonic bells in a morning garden', root: 60, mode: 'major', tune: 'pentatonic', bpm: 96, meter: 4, bars: 32,
    prog: [0, 0, 4, 4, 5, 5, 3, 4],
    pad: { voice: 'pad', oct: -12, rhythm: 'hold', vel: 0.04 },
    bass: { voice: 'bass', oct: -24, pattern: 'root5', vel: 0.08 },
    arp: { voice: 'bell', oct: 12, sub: 1, pattern: [0, 2, 1, 3], vel: 0.035, every: 2 },
    melody: { voice: 'bell', oct: 12, vel: 0.055, rhythms: [[1, 1, 2], [2, 1, 1], [1, 1, 1, 1], [3, 1], [4]], rest: 0.2 },
  },
  study: {
    name: 'Lamplight', mood: 'warm piano chords in a candlelit study', root: 63, mode: 'major', bpm: 64, meter: 4, bars: 20,
    prog: [0, 5, 3, 4, 0, 2, 3, 4, 5, 3],
    pad: { voice: 'piano', oct: -12, rhythm: 'pulse', vel: 0.05 },
    bass: { voice: 'bass', oct: -24, pattern: 'root', vel: 0.08 },
    melody: { voice: 'piano', oct: 0, vel: 0.06, rhythms: [[2, 2], [3, 1], [1, 1, 2], [4]], rest: 0.35 },
  },
  playhouse: {
    name: 'The Open-Air Waltz', mood: 'a gentle waltz under a summer awning', root: 67, mode: 'major', bpm: 108, meter: 3, bars: 40,
    prog: [0, 0, 4, 4, 4, 4, 0, 0, 3, 3, 0, 0, 1, 4, 0, 0],
    pad: { voice: 'pluck', oct: -12, rhythm: 'waltz', vel: 0.04 },
    bass: { voice: 'bass', oct: -24, pattern: 'waltz', vel: 0.09 },
    melody: { voice: 'flute', oct: 12, vel: 0.05, rhythms: [[2, 1], [1, 1, 1], [3], [1, 2]], rest: 0.25 },
  },
  forum: {
    name: 'The Steps of the Forum', mood: 'stately brass triads, slow and noble', root: 58, mode: 'major', bpm: 72, meter: 4, bars: 24,
    prog: [0, 3, 4, 0, 5, 3, 1, 4],
    pad: { voice: 'brass', oct: 0, rhythm: 'halves', vel: 0.04 },
    bass: { voice: 'bass', oct: -24, pattern: 'root5', vel: 0.09 },
    melody: { voice: 'brass', oct: 12, vel: 0.04, rhythms: [[2, 2], [3, 1], [4], [2, 1, 1]], rest: 0.4 },
  },
  scriptorium: {
    name: 'Vellum and Plainsong', mood: 'modal, chant-like pads in a stone room', root: 62, mode: 'dorian', bpm: 60, meter: 4, bars: 18,
    prog: [0, 0, 6, 0, 3, 3, 6, 6, 0],
    pad: { voice: 'choir', oct: -12, rhythm: 'hold', vel: 0.05 },
    bass: { voice: 'bass', oct: -24, pattern: 'drone', vel: 0.06 },
    melody: { voice: 'choir', oct: 0, vel: 0.05, rhythms: [[2, 2], [4], [1, 1, 2], [3, 1]], rest: 0.3 },
  },
  lakeside: {
    name: 'Still Water', mood: 'soft harp plucks rippling by a lake', root: 57, mode: 'lydian', bpm: 76, meter: 4, bars: 24,
    prog: [0, 0, 1, 1, 0, 0, 4, 4, 3, 3, 4, 4],
    pad: { voice: 'pad', oct: 0, rhythm: 'hold', vel: 0.03 },
    bass: { voice: 'bass', oct: -12, pattern: 'root', vel: 0.07 },
    arp: { voice: 'pluck', oct: 0, sub: 2, pattern: [0, 1, 2, 3, 4, 3, 2, 1], vel: 0.04 },
    melody: { voice: 'flute', oct: 12, vel: 0.04, rhythms: [[3, 1], [2, 2], [4]], rest: 0.5 },
  },
  games: {
    name: 'Quick Wits', mood: 'light and bouncing, for play', root: 64, mode: 'major', bpm: 108, meter: 4, bars: 36,
    prog: [0, 5, 3, 4],
    pad: { voice: 'pluck', oct: -12, rhythm: 'offbeat', vel: 0.035 },
    bass: { voice: 'bass', oct: -24, pattern: 'root5', vel: 0.09 },
    melody: { voice: 'marimba', oct: 12, vel: 0.06, rhythms: [[1, 1, 1, 1], [1, 1, 2], [0.5, 0.5, 1, 2], [2, 2]], rest: 0.15 },
  },
  'games-word': {
    name: 'Word Hop', mood: 'a marimba skipping from word to word', root: 62, mode: 'major', tune: 'pentatonic', bpm: 112, meter: 4, bars: 40,
    prog: [0, 3, 0, 4],
    pad: { voice: 'pluck', oct: -12, rhythm: 'offbeat', vel: 0.03 },
    bass: { voice: 'bass', oct: -24, pattern: 'root5', vel: 0.09 },
    melody: { voice: 'marimba', oct: 12, vel: 0.06, rhythms: [[1, 1, 1, 1], [0.5, 0.5, 1, 2], [1, 1, 2], [2, 1, 1]], rest: 0.15 },
  },
  'games-sentence': {
    name: 'Building Blocks', mood: 'plucked strings stacking up a sentence', root: 65, mode: 'major', bpm: 104, meter: 4, bars: 36,
    prog: [0, 4, 5, 3, 0, 4, 3, 4],
    pad: { voice: 'pluck', oct: -12, rhythm: 'pulse', vel: 0.035 },
    bass: { voice: 'bass', oct: -24, pattern: 'root5', vel: 0.09 },
    arp: { voice: 'pluck', oct: 12, sub: 2, pattern: [0, 2, 1, 2], vel: 0.025, every: 2 },
    melody: { voice: 'bell', oct: 12, vel: 0.05, rhythms: [[1, 1, 2], [2, 2], [1, 1, 1, 1], [3, 1]], rest: 0.2 },
  },
  'games-reading': {
    name: 'Turning Pages', mood: 'celeste and soft bass, a quick story', root: 67, mode: 'mixolydian', bpm: 100, meter: 4, bars: 32,
    prog: [0, 6, 3, 0],
    pad: { voice: 'pad', oct: -12, rhythm: 'hold', vel: 0.035 },
    bass: { voice: 'bass', oct: -24, pattern: 'root5', vel: 0.085 },
    melody: { voice: 'bell', oct: 12, vel: 0.055, rhythms: [[1, 1, 2], [2, 1, 1], [1, 1, 1, 1], [4]], rest: 0.2 },
  },
};
export const LOOP_IDS = Object.keys(SCORES);

/* A seeded generator, so a loop's tune is fixed by its name. */
function seed(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function rng(s) { return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const cache = {};
export function loop(id) {
  if (!SCORES[id]) return null;
  return cache[id] || (cache[id] = compose(id));
}

export function compose(id) {
  const S = SCORES[id], R = rng(seed(id));
  const scale = SCALES[S.mode], tune = SCALES[S.tune || S.mode];
  const spb = 60 / S.bpm, barLen = S.meter * spb, length = S.bars * barLen, notes = [];
  const deg = (d) => S.root + scale[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);        // scale degree → MIDI
  const chord = (b) => { const d = S.prog[b % S.prog.length]; return [deg(d), deg(d + 2), deg(d + 4), deg(d + 7), deg(d + 9)]; };
  const add = (t, dur, midi, voice, vel) => { if (t >= 0 && t < length - 1e-6) notes.push({ t: +t.toFixed(4), dur: +dur.toFixed(4), midi, voice, vel }); };

  for (let b = 0; b < S.bars; b++) {
    const t0 = b * barLen, c = chord(b);
    // the chords
    const P = S.pad, tri = c.slice(0, 3).map((m) => m + P.oct);
    if (P.rhythm === 'hold') {                                // held until the chord changes (or 4 bars), never across the loop's end
      const same = (x) => S.prog[x % S.prog.length] === S.prog[b % S.prog.length];
      if (b === 0 || !same(b - 1) || b % 4 === 0) { let run = 1; while (b + run < S.bars && run < 4 && (b + run) % 4 && same(b + run)) run++; tri.forEach((m) => add(t0, run * barLen * 0.98, m, P.voice, P.vel)); }
    }
    else if (P.rhythm === 'pulse') for (const beat of [0, S.meter / 2]) tri.forEach((m, i) => add(t0 + beat * spb + i * 0.03, (S.meter / 2) * spb * 0.95, m, P.voice, P.vel));
    else if (P.rhythm === 'halves') for (const beat of [0, 2]) tri.forEach((m) => add(t0 + beat * spb, 2 * spb * 0.9, m, P.voice, P.vel));
    else if (P.rhythm === 'waltz') for (const beat of [1, 2]) tri.forEach((m) => add(t0 + beat * spb, spb * 0.8, m, P.voice, P.vel));
    else if (P.rhythm === 'offbeat') for (let beat = 0; beat < S.meter; beat++) tri.forEach((m) => add(t0 + (beat + 0.5) * spb, spb * 0.4, m, P.voice, P.vel));
    // the bass
    const B = S.bass, root = c[0] + B.oct, fifth = c[2] + B.oct;
    if (B.pattern === 'root' || B.pattern === 'waltz') add(t0, B.pattern === 'waltz' ? spb * 0.9 : barLen * 0.95, root, B.voice, B.vel);
    else if (B.pattern === 'root5') { add(t0, (S.meter / 2) * spb * 0.9, root, B.voice, B.vel); add(t0 + (S.meter / 2) * spb, (S.meter / 2) * spb * 0.9, fifth, B.voice, B.vel * 0.85); }
    else if (B.pattern === 'drone') { if (b % 3 === 0) add(t0, Math.min(3, S.bars - b) * barLen * 0.98, S.root + B.oct, B.voice, B.vel); }
    // the ripple
    const A = S.arp;
    if (A && b % (A.every || 1) === 0) {
      const step = spb / A.sub, n = S.meter * A.sub;
      for (let i = 0; i < n; i++) add(t0 + i * step, step * 2.5, c[A.pattern[i % A.pattern.length]] + A.oct, A.voice, A.vel * (i === 0 ? 1.2 : 1));
    }
  }

  // the tune: four-bar phrases, A A′ B A, landing on the chord at each phrase's end
  const M = S.melody, toMidi = (i) => S.root + M.oct + tune[((i % tune.length) + tune.length) % tune.length] + 12 * Math.floor(i / tune.length);
  const near = (target, from) => { let best = from, bd = 1e9; for (let i = from - 8; i <= from + 8; i++) { const d = Math.abs(toMidi(i) - target) % 12; if ((d === 0) && Math.abs(i - from) < bd) { bd = Math.abs(i - from); best = i; } } return best; };
  const phrase = () => {                                     // two bars of rhythm and contour, made once, reused
    const bars = []; for (let k = 0; k < 2; k++) bars.push({ rh: M.rhythms[Math.floor(R() * M.rhythms.length)], steps: Array.from({ length: 6 }, () => (R() < 0.7 ? (R() < 0.5 ? 1 : -1) : (R() < 0.5 ? 2 : -2))) });
    return bars;
  };
  const A1 = phrase(), B1 = phrase();
  let pos = Math.floor(tune.length / 2);                     // the tune lives in about an octave and a half
  const lo = -3, hi = tune.length + 3;
  for (let b = 0; b < S.bars; b++) {
    const ph = Math.floor(b / 4) % 4, inPh = b % 4, t0 = b * barLen, c = chord(b);
    if (ph === 2 && R() < M.rest) continue;                   // breathing room
    if (inPh === 3) { pos = near(c[0], pos); add(t0, barLen * 0.9, toMidi(pos), M.voice, M.vel); continue; }   // cadence: one long chord tone
    const src = (ph === 2 ? B1 : A1)[inPh % 2], rh = src.rh;
    let t = t0;
    rh.forEach((d, i) => {
      if (i === 0) pos = near(c[(b % 2) * 2], pos);
      else pos += src.steps[i % src.steps.length] * (ph === 1 && inPh === 1 ? -1 : 1);
      if (pos < lo) pos = lo + (lo - pos); if (pos > hi) pos = hi - (pos - hi);   // reflect off the edges, never stick
      add(t, d * spb * 0.92, toMidi(pos), M.voice, M.vel * (i === 0 ? 1 : 0.85));
      t += d * spb;
    });
  }
  notes.sort((a, b) => a.t - b.t || a.midi - b.midi);
  return { id, name: S.name, mood: S.mood, key: `${NAMES[S.root % 12]} ${S.mode}`, bpm: S.bpm, meter: S.meter, bars: S.bars, length: +length.toFixed(4), notes };
}

/* The scheduler's one pure step: every note due before `until`, given where this loop is up to
   (st = { t0, i }: when the current pass began, the next note's index). It walks across the loop's
   end into the next pass, so the seam is just the next note. Mutates st. */
export function due(L, st, until) {
  const out = []; if (!L?.notes.length) return out;
  for (let guard = 0; guard < 10000; guard++) {
    const n = L.notes[st.i], at = st.t0 + n.t;
    if (at >= until) break;
    out.push({ ...n, at });
    if (++st.i >= L.notes.length) { st.i = 0; st.t0 += L.length; }
  }
  return out;
}

export const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* The instruments: two or three oscillators each, shaped by a gain envelope — cheap and soft. */
export function playNote(ctx, dest, n, at) {
  const f = hz(n.midi), v = n.vel, d = Math.max(0.05, n.dur);
  const g = ctx.createGain(); g.connect(dest);
  const oscs = [];
  const osc = (type, freq, vol, detune = 0, to = g) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = freq; o.detune.value = detune; og.gain.value = vol; o.connect(og); og.connect(to); oscs.push(o); return o; };
  const lp = (freq, q = 0.5) => { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = freq; fl.Q.value = q; fl.connect(g); return fl; };
  let end;
  const e = g.gain; e.setValueAtTime(0, at);
  switch (n.voice) {
    case 'pluck': { const fl = lp(2600); osc('triangle', f, 1, 0, fl); osc('sine', f * 2, 0.25, 0, fl); e.linearRampToValueAtTime(v, at + 0.005); end = at + Math.min(3, d + 1.2); e.exponentialRampToValueAtTime(0.0005, end); break; }
    case 'bell': { osc('sine', f, 1); osc('sine', f * 2.756, 0.18); e.linearRampToValueAtTime(v, at + 0.004); end = at + Math.min(3.5, d + 2); e.exponentialRampToValueAtTime(0.0005, end); break; }
    case 'marimba': { osc('sine', f, 1); osc('sine', f * 4, 0.08); e.linearRampToValueAtTime(v, at + 0.003); end = at + Math.min(1.2, d + 0.5); e.exponentialRampToValueAtTime(0.0005, end); break; }
    case 'piano': { const fl = lp(2200); osc('triangle', f, 1, 0, fl); osc('sine', f * 2, 0.2, 0, fl); e.linearRampToValueAtTime(v, at + 0.006); e.exponentialRampToValueAtTime(v * 0.35, at + Math.min(d, 1.2)); end = at + d + 0.5; e.setTargetAtTime(0.0001, at + d, 0.15); break; }
    case 'pad': { const fl = lp(850); osc('sawtooth', f, 0.5, -7, fl); osc('sawtooth', f, 0.5, 7, fl); e.linearRampToValueAtTime(v, at + Math.min(0.8, d / 3)); e.setValueAtTime(v, at + d); end = at + d + 1.4; e.linearRampToValueAtTime(0, end); break; }
    case 'choir': { const fl = lp(1100, 1.2); osc('triangle', f, 0.6, -5, fl); osc('triangle', f, 0.6, 5, fl); osc('sine', f * 2, 0.12, 0, fl); e.linearRampToValueAtTime(v, at + Math.min(1.4, d / 2.5)); e.setValueAtTime(v, at + d); end = at + d + 1.8; e.linearRampToValueAtTime(0, end); break; }
    case 'brass': { const fl = lp(500, 0.8); osc('sawtooth', f, 1, 0, fl); fl.frequency.setValueAtTime(500, at); fl.frequency.linearRampToValueAtTime(1300, at + 0.15); fl.frequency.linearRampToValueAtTime(900, at + 0.5); e.linearRampToValueAtTime(v, at + 0.12); e.setValueAtTime(v, at + d); end = at + d + 0.45; e.linearRampToValueAtTime(0, end); break; }
    case 'flute': { osc('sine', f, 1); osc('triangle', f, 0.15); e.linearRampToValueAtTime(v, at + 0.09); e.setValueAtTime(v * 0.85, at + d); end = at + d + 0.35; e.linearRampToValueAtTime(0, end); break; }
    default: { osc('sine', f, 1); osc('triangle', f, 0.3); e.linearRampToValueAtTime(v, at + 0.02); e.setValueAtTime(v * 0.8, at + d); end = at + d + 0.3; e.linearRampToValueAtTime(0, end); }   // bass
  }
  for (const o of oscs) { o.start(at); o.stop(end + 0.05); }
  oscs[0].onended = () => { try { g.disconnect(); } catch {} };
}
