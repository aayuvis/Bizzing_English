/* store.js — the ONLY module that touches storage (the family's Phase 1 linchpin).

   Two keys, both on this device and never transmitted:
     bizzing-english.household   the household { v, parent, kids[], active } — versioned
     bizzing-english.device      device preferences (dark, sound, music, volume, calm, motion, text size)
   The shared family keys (bizzing.wallet, bizzing.activity) are written only by the drop-ins in
   integration/, never here.

   Versioned: a change of shape adds a vN_to_vN+1 step to STEPS; an old step is never edited.
   ?demo holds a sample household in memory: nothing is read from or written to storage. */

export const VERSION = 5;
const KEY = 'bizzing-english.household';
const DEV = 'bizzing-english.device';

/* vN → vN+1. Never edit an old step; add the next. */
const STEPS = {
  /* v2: a child's free writing gets its own record, k.writing, which no backup ever carries. The "talk
     about it" thoughts lived in k.reading[passage].thoughts, inside a field backups do carry. */
  1: (h) => {
    for (const k of h.kids || []) {
      k.writing ||= {};
      for (const [pid, r] of Object.entries(k.reading || {})) if (r && r.thoughts != null) { (k.writing.talk ||= {})[pid] = r.thoughts; delete r.thoughts; }
    }
    h.v = 2; return h;
  },
  /* v3: "Find my starting place" — k.place { word, reading, at }, where a road starts; null until the
     check is taken (the band's head start holds until then) */
  2: (h) => { for (const k of h.kids || []) if (k.place === undefined) k.place = null; h.v = 3; return h; },
  /* v4 (the games' level chip, handover C §1.4 — src/hubs.js): every game record gets `pick`, the level the
     child chose by hand (null = Auto), and its own `level` kept to 1–5. Only the Play games' records; the
     Tools' records under k.games (vocab, typing, idioms, figday) are not games with levels. */
  3: (h) => {
    const GAMES = ['builder', 'rush', 'figure', 'who', 'plot', 'root', 'duel'];
    for (const k of h.kids || []) for (const id of GAMES) { const r = k.games?.[id]; if (!r || typeof r !== 'object') continue; if (r.pick === undefined) r.pick = null; r.level = Math.max(1, Math.min(5, Math.round(+r.level || 1))); }
    h.v = 4; return h;
  },
  /* v5: Inkwell Detective — k.inkwell { cases, persona, level, hoard, … } (detective-season.js newInkwell), null
     until the child first opens the Agency; the persona's own name, if the child renames it, sits apart in
     k.inkwellName, which no backup carries (a child may type their own name there) */
  4: (h) => { for (const k of h.kids || []) { if (k.inkwell === undefined) k.inkwell = null; if (k.inkwellName === undefined) k.inkwellName = null; } h.v = 5; return h; },
};

export function migrate(h) {
  if (!h || typeof h !== 'object') return null;
  let v = h.v || 1;
  while (v < VERSION) { if (!STEPS[v]) return null; h = STEPS[v](h); v = h.v; }
  return h;
}

const mem = { demo: false, household: null, device: null };
const ls = () => { try { return globalThis.localStorage || null; } catch { return null; } };

export function setDemo(h) { mem.demo = true; mem.household = h; }
export const isDemo = () => mem.demo;

export function loadHousehold() {
  if (mem.demo) return mem.household;
  try { const raw = ls()?.getItem(KEY); return raw ? migrate(JSON.parse(raw)) : null; } catch { return null; }
}
export function saveHousehold(h) {
  if (mem.demo) { mem.household = h; return true; }
  try { ls()?.setItem(KEY, JSON.stringify(h)); return true; } catch { return false; }
}
export function eraseHousehold() { if (mem.demo) { mem.household = null; return; } try { ls()?.removeItem(KEY); } catch {} }

export const DEVICE_DEFAULTS = { dark: null, sound: true, music: true, volume: 0.4, calm: false, motion: true, text: 'M', speed: 'normal' };
export function loadDevice() {
  if (mem.device) return mem.device;
  let d = {};
  if (!mem.demo) { try { d = JSON.parse(ls()?.getItem(DEV) || '{}') || {}; } catch {} }
  return (mem.device = { ...DEVICE_DEFAULTS, ...d });
}
export function saveDevice(patch) {
  const d = { ...loadDevice(), ...patch };
  mem.device = d;
  if (!mem.demo) { try { ls()?.setItem(DEV, JSON.stringify(d)); } catch {} }
  return d;
}

/* Every key this app owns, for the privacy page and "erase everything". */
export const KEYS = [KEY, DEV];
