/* lexicon.js — Bizzing Bee's words, borrowed at build time (tools/import-bee.mjs) and loaded on
   demand: a Word stop, the reader and search await it; Home never does. Word audio streams from
   Bee's own published clips (voice/w/<word>.mp3, the path Bee's voice-cdn.js uses), so nothing is
   duplicated; the privacy page names that one request. A word with no clip falls back to the
   device's own voice. */

let LEX = null, pending = null;
export const lexReady = () => !!LEX;
export const lex = () => LEX;
export function loadLexicon() {
  if (LEX) return Promise.resolve(LEX);
  return (pending ||= fetch('data/bee-words.json').then((r) => r.json()).then((j) => (LEX = j)).catch(() => (pending = null, null)));
}
export function setLexicon(j) { LEX = j; }   // tests and the demo

const FORMS = (w) => [w, w.replace(/'s$/, ''), w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ies$/, 'y'), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'),
  w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/([b-df-hj-np-tv-z])\1(ed|ing)$/, '$1'), w.replace(/ly$/, ''), w.replace(/ier$/, 'y'), w.replace(/iest$/, 'y'), w.replace(/er$/, ''), w.replace(/est$/, '')];

/* A word as the reader meets it ("wolves'", "Running") → its entry, or null. */
export function lookup(raw) {
  if (!LEX) return null;
  const w = String(raw).toLowerCase().replace(/[^a-z'-]/g, '').replace(/^'+|'+$/g, '');
  for (const f of FORMS(w)) { const r = LEX.words[f]; if (r) return { w: f, def: r[0], say: r[1], ps: r[2], y: r[3], origin: r[4], etym: r[5], hint: r[6] }; }
  return null;
}

export function search(qs, n = 12) {
  if (!LEX || !qs) return [];
  const s = qs.toLowerCase().trim(), out = [];
  for (const w in LEX.words) { if (w.startsWith(s)) out.push(w); if (out.length >= n) break; }
  return out;
}

export const clipUrl = (w) => 'https://raw.githubusercontent.com/aayuvis/Bizzing-Bee/main/spellbound-app/voice/w/' + String(w).toLowerCase().replace(/[^a-z0-9]/g, '-') + '.mp3';
