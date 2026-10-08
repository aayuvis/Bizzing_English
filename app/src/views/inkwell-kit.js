/* inkwell-kit.js — Inkwell Detective's drawing kit: where every painting is, the cast as cut-outs, the papers, the
   stand-ins drawn in CSS/SVG when a painting has not landed yet, and the small motions (a card flying to the notebook,
   the magnifier's sweep). No game rule lives here.

   ART. The painted set is listed by data/inkwell-art.js (the art pipeline's manifest) when it exists; until then by the
   list below (what was on disk when these screens were built). A path that is in neither is never requested: the screen
   draws its stand-in instead, so a missing painting is never a broken image and never a 404 (test/inkwell-ui.mjs). */

import { esc } from '../ui.js';

/* ---------- what is painted ---------- */
const FALLBACK_TOP = 'agency-night agency case-00-night case-00 case-01-night case-01 case-02-night case-02 case-03-night case-03 case-04-night case-04 case-05-night case-05 case-06-night case-06 case-07-night case-07 case-08-night case-08 case-09-night case-09 case-10-night case-10 case-11-night case-11 emb-hari emb-hoard emb-milo emb-oskar emb-signe emb-thea emb-vani-veena emb-vani journey-asgard journey-mississippi journey-olympus journey-verona map-night map mat-cork mat-desk mat-diary mat-letter mat-newspaper mat-notice obj-bottle obj-brass-lantern obj-charter-ribbon obj-dividers obj-fountain-pen obj-gavel-handle obj-goose-feather obj-green-pen obj-pole-tip obj-red-pencil obj-rosette obj-stone-frog quill-detective quill-think ui-card ui-ledger ui-magnifier ui-seal';
const FALLBACK_CAST = { achterberg: 'amused calm guilty nervous offended relieved', ada: 'amused calm guilty nervous offended relieved remembering thoughtful', admiral: 'asleep calm honking', asante: 'amused calm nervous offended relieved', asha: 'amused calm nervous relieved thoughtful', bellamy: 'amused calm nervous offended relieved', biscuit: 'asleep calm', bright: 'amused calm guilty nervous offended relieved', cat: 'calm', celeste: 'amused calm guilty nervous offended relieved', crane: 'amused calm guilty nervous offended relieved', dev: 'amused calm nervous relieved thoughtful', dot: 'amused calm offended relieved', dunmore: 'calm guilty offended relieved worried', encore: 'amused asleep offended one-eye-open smug yawning', felix: 'amused calm nervous relieved thoughtful', fosse: 'calm guilty nervous offended relieved', gnomes: 'amused calm offended relieved', grail: 'amused calm guilty nervous offended relieved', grandpa: 'amused calm nervous relieved', gundersen: 'amused calm relieved', hale: 'calm guilty nervous offended relieved', hari: 'amused calm nervous relieved thoughtful', hugo: 'amused calm guilty nervous offended relieved', ito: 'amused calm offended relieved', ivy: 'amused calm guilty nervous offended relieved', juniper: 'amused calm guilty nervous offended relieved', kip: 'amused calm nervous relieved', leela: 'amused calm', marlowe: 'amused calm guilty nervous offended relieved', marsh: 'amused calm relieved', mbeki: 'amused calm guilty nervous offended relieved', milo: 'amused calm nervous relieved thoughtful', moss: 'amused calm nervous offended relieved', nell: 'amused calm nervous relieved thoughtful', odile: 'amused calm guilty nervous offended relieved', osei: 'calm', oskar: 'amused calm nervous relieved thoughtful', pell: 'calm', penhallow: 'amused calm guilty nervous offended relieved worried', petra: 'calm', pettigrew: 'amused calm guilty nervous offended relieved', prout: 'calm nervous offended relieved', qadir: 'calm', quarrender: 'calm', quayle: 'calm', rafi: 'calm', rosa: 'amused calm', sami: 'calm', semicolon: 'calm', signe: 'amused calm nervous relieved thoughtful', sully: 'amused calm nervous', sunny: 'calm', swale: 'calm', tam: 'amused calm guilty nervous relieved', thea: 'amused calm nervous relieved thoughtful', tully: 'amused calm nervous offended relieved worried', vani: 'amused calm nervous relieved thoughtful', zuri: 'calm' };
const PLATES_720 = /^(agency|map|case-\d\d|journey-[a-z]+)(-night)?$/;

/* the manifest, if the art pipeline has written it (import.meta.glob answers {} when the file is absent) */
let MANIFEST = null;
try { const g = import.meta.glob('../data/inkwell-art.js', { eager: true }); MANIFEST = Object.values(g)[0] || null; } catch { MANIFEST = null; }
const KNOWN = new Set(); let PINS = null;
(function index() {
  const add = (p) => { const m = String(p).replace(/^.*?art\/inkwell\//, '').match(/^([a-z0-9/_-]+)\.webp$/i); if (m) KNOWN.add(m[1]); };
  const walk = (v, key, depth = 0) => {
    if (depth > 6 || v == null) return;
    if (typeof v === 'string') return add(v);
    if (Array.isArray(v)) return v.forEach((x) => walk(x, key, depth + 1));
    if (typeof v === 'object') { if (/pins/i.test(key || '') && !PINS) PINS = v; for (const [k, x] of Object.entries(v)) walk(x, k, depth + 1); }
  };
  if (MANIFEST) for (const [k, v] of Object.entries(MANIFEST)) walk(v, k);
  if (!KNOWN.size) {
    for (const n of FALLBACK_TOP.split(' ')) { KNOWN.add(n); if (PLATES_720.test(n)) KNOWN.add(n + '-720'); }
    for (const [who, ex] of Object.entries(FALLBACK_CAST)) for (const e of ex.split(' ')) KNOWN.add(`cast/${who}-${e}`);
  }
})();
export const has = (name) => KNOWN.has(name);
export const artUrl = (name) => (KNOWN.has(name) ? `art/inkwell/${name}.webp` : null);
export const manifestPins = () => PINS;
/* the manifest's measured places (hotspots, Quill's spot, shelf niches, map places), or null */
export const manifestAgency = () => (MANIFEST && Object.values(MANIFEST).find((v) => v && v.agency)?.agency) || null;
export const manifestMap = () => (MANIFEST && Object.values(MANIFEST).find((v) => v && v.map)?.map) || null;

const phone = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 720px)').matches;
/* a painted plate (day or lamplit night; the 720 px one on a phone), or null when it is not painted */
export function plate(base, dark) {
  const order = [dark ? `${base}-night` : base, base];
  for (const n of order) { const small = `${n}-720`; if (phone() && KNOWN.has(small)) return `art/inkwell/${small}.webp`; if (KNOWN.has(n)) return `art/inkwell/${n}.webp`; }
  return null;
}
/* a plate as a CSS background: the painting over a stand-in wash, so a missing one is a wash, never a hole */
/* a url() inside a custom property resolves against the stylesheet that uses it, so the painting goes in as an absolute url */
const abs = (u) => (typeof document !== 'undefined' ? new URL(u, document.baseURI).href : u);
export const plateBg = (base, dark, wash) => { const u = plate(base, dark); return `${u ? `url('${abs(u)}') center / cover no-repeat, ` : ''}${wash || WASH.agency}`; };
/* the materials as custom properties for the stylesheet: cork, the desk, letter paper */
export const matVars = () => ['cork', 'desk', 'letter'].map((m) => { const u = artUrl(`mat-${m}`); return `--ink-${m}:${u ? `url('${abs(u)}')` : 'none'}`; }).join(';');
export const WASH = {
  agency: 'radial-gradient(ellipse at 50% 35%, #2f6e6a, #12313a 70%, #0b1d24)',
  quayside: 'linear-gradient(180deg, #e9b9a0, #6f8fa3 55%, #2c4656)', garden: 'linear-gradient(180deg, #cfe3b6, #5f8f52 60%, #2f4d2a)',
  study: 'linear-gradient(180deg, #4b4a6e, #2c2a44 60%, #191828)', forum: 'linear-gradient(180deg, #e7dcc5, #a69273 60%, #5a4a35)',
  playhouse: 'linear-gradient(180deg, #7a3b46, #4a2230 60%, #24121a)', scriptorium: 'linear-gradient(180deg, #8a7a5a, #4b4130 60%, #241f17)',
  lakeside: 'linear-gradient(180deg, #bcd8e3, #5a8fa6 60%, #2a4b5c)', olympus: 'linear-gradient(180deg, #f3e3b5, #c9a35c 60%, #6d5328)',
  asgard: 'linear-gradient(180deg, #a9c1d9, #4f6d8f 60%, #23324a)', verona: 'linear-gradient(180deg, #e9c7a2, #a0654a 60%, #4d2b20)', mississippi: 'linear-gradient(180deg, #d8c79d, #7d8a5a 60%, #3a4129)',
  cork: 'radial-gradient(ellipse at 50% 40%, #c69a5e, #8e6738 75%, #6a4a27)', desk: 'linear-gradient(170deg, #6b4428, #3e2615)',
};
/* the scene plate a case is set against */
export const casePlate = (c) => (c?.kind === 'journey' ? `journey-${c.world}` : c?.id || 'agency');
export const caseWash = (c) => WASH[c?.world] || WASH.agency;

/* ---------- papers: each document type on its painted material ---------- */
const PAPER = { letter: 'letter', note: 'letter', card: 'letter', postcard: 'letter', 'letter-book': 'letter', 'copy-sheet': 'letter', remarks: 'letter', autograph: 'letter',
  notice: 'notice', sign: 'notice', poster: 'notice', plaque: 'notice', programme: 'notice', tablet: 'notice', stave: 'notice', prologue: 'notice',
  diary: 'diary', log: 'diary', list: 'diary', 'day-book': 'diary', 'gate-book': 'diary', 'notebook-page': 'diary', 'word-book': 'diary', 'autograph-book': 'diary',
  report: 'newspaper', transcript: 'newspaper', newspaper: 'newspaper', scene: 'newspaper', other: 'newspaper' };
export const paperOf = (type) => PAPER[type] || 'letter';
export const paperBg = (type) => { const m = paperOf(type), u = artUrl(`mat-${m}`); return `${u ? `url('${abs(u)}') center / cover, ` : ''}linear-gradient(172deg, #f3e5c3, #e3cc9a)`; };
/* the handwriting a document is set in: a note or a letter is handwritten (a legible face), a typed report is typed */
export const handOf = (type) => (['note', 'letter', 'postcard', 'card', 'diary', 'list', 'remarks'].includes(type) ? 'hand' : ['transcript', 'report', 'log', 'gate-book', 'day-book'].includes(type) ? 'typed' : 'print');

/* ---------- the cast as cut-outs ---------- */
/* who in a line is who in the cast: "MRS PROUT" → prout, "TULLY" → tully, "YOU" → the player */
export function whoIs(c, who, personaId) {
  const w = String(who || '').trim().toLowerCase();
  if (!w || ['caption', 'stage', 'narrator', 'all', 'everyone'].includes(w)) return null;
  if (/^(you|detective|the new detective|player|det)$/.test(w) || w.includes('{det')) return { id: personaId || 'player', persona: true };
  if (w === 'quill') return { id: 'quill', quill: true };
  const cast = c?.cast || [], direct = cast.find((p) => p.id === w);
  if (direct) return { id: direct.id, p: direct };
  const words = w.replace(/[^a-z' ]/g, ' ').split(/\s+/).filter((x) => x && !['mr', 'mrs', 'ms', 'miss', 'dr', 'the', 'old', 'young'].includes(x));
  let best = null, bestN = 0;
  for (const p of cast) {
    const name = String(p.name || '').toLowerCase(); let n = 0;
    for (const x of words) if (new RegExp(`\\b${x}\\b`).test(name)) n++;
    if (/\bmrs\b/.test(w) && /\bmrs\b/.test(name)) n += 0.5;
    if (n > bestN) { best = p; bestN = n; }
  }
  return best ? { id: best.id, p: best } : { id: w.replace(/[^a-z]/g, '') || 'someone' };
}
/* the cut-out's image for an expression (falling back to calm, then to any painted expression), or null */
export function castUrl(id, expr = 'calm') {
  if (id === 'quill') return artUrl(expr === 'thoughtful' || expr === 'think' ? 'quill-think' : 'quill-detective');
  for (const e of [expr, 'calm', 'amused', 'relieved', 'thoughtful']) { const u = artUrl(`cast/${id}-${e}`); if (u) return u; }
  for (const n of KNOWN) if (n.startsWith(`cast/${id}-`)) return `art/inkwell/${n}.webp`;
  return null;
}
const hue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
const initials = (name) => String(name || '?').replace(/^(Mrs|Mr|Ms|Miss|Dr|Constable|Admiral)\s+/i, '').split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
/* A drawn stand-in for a figure not painted yet: a silhouette on the same canvas as the cut-outs (3:4, feet on the
   bottom edge), so it stands where the painting will stand. */
export function standIn(name, { cls = '' } = {}) {
  const h = hue(name);
  return `<svg class="ink-standin ${cls}" viewBox="0 0 120 160" role="img" aria-label="${esc(name)}"><defs><linearGradient id="si${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h} 45% 58%)"/><stop offset="1" stop-color="hsl(${h} 40% 34%)"/></linearGradient></defs>
    <path d="M60 18c14 0 25 11 25 26s-11 27-25 27-25-12-25-27 11-26 25-26z" fill="url(#si${h})" stroke="#fff" stroke-width="4"/>
    <path d="M14 160c2-40 20-66 46-66s44 26 46 66z" fill="url(#si${h})" stroke="#fff" stroke-width="4"/>
    <text x="60" y="52" text-anchor="middle" font-size="20" font-weight="800" fill="#fff" font-family="var(--bz-body)">${esc(initials(name))}</text></svg>`;
}
/* A cast member as a cut-out <img> (or its stand-in). opts: { expr, cls, name, alt } */
export function figure(id, { expr = 'calm', cls = '', name = '', alt = '' } = {}) {
  const u = castUrl(id, expr);
  return u ? `<img class="ink-fig ${cls}" src="${esc(u)}" alt="${esc(alt)}" draggable="false" data-who="${esc(id)}" data-expr="${esc(expr)}">` : standIn(name || id, { cls: `ink-fig ${cls}` });
}
/* a sticker (office object, emblem, ui) or a drawn stand-in */
export function sticker(name, { cls = '', alt = '', fallback = '' } = {}) {
  const u = artUrl(name);
  return u ? `<img class="ink-stk ${cls}" src="${esc(u)}" alt="${esc(alt)}" draggable="false">` : `<span class="ink-stk ink-stk-drawn ${cls}" role="img" aria-label="${esc(alt)}">${fallback}</span>`;
}

/* ---------- motion ---------- */
export const reduced = () => typeof document !== 'undefined' && (document.documentElement.classList.contains('still') || document.documentElement.classList.contains('calm') || matchMedia('(prefers-reduced-motion: reduce)').matches);
/* a clue card flies from where the phrase was marked to the notebook (a fade under reduced motion) */
export function flyCard(fromRect, toEl, text) {
  if (!fromRect || !toEl || typeof document === 'undefined') return;
  const to = toEl.getBoundingClientRect(), el = document.createElement('div');
  el.className = 'ink-flycard'; el.setAttribute('aria-hidden', 'true'); el.textContent = text.length > 60 ? text.slice(0, 57) + '…' : text;
  Object.assign(el.style, { left: `${fromRect.left}px`, top: `${fromRect.top}px`, width: `${Math.max(120, Math.min(260, fromRect.width))}px` });
  document.body.appendChild(el);
  const dx = to.left - fromRect.left, dy = to.top - fromRect.top;
  const anim = reduced() ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }) : el.animate([{ transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) rotate(-8deg) scale(1.05)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx}px, ${dy}px) rotate(-2deg) scale(.7)`, opacity: 0.2 }], { duration: 720, easing: 'cubic-bezier(.3,.7,.2,1)' });
  anim.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1200);
}
/* the magnifying glass sweeps over a marked phrase */
export function sweep(rect) {
  if (!rect || typeof document === 'undefined' || reduced()) return;
  const u = artUrl('ui-magnifier'), el = document.createElement('div');
  el.className = 'ink-sweep'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = u ? `<img src="${u}" alt="">` : '<i></i>';
  Object.assign(el.style, { left: `${rect.left - 30}px`, top: `${rect.top - 34}px` });
  document.body.appendChild(el);
  const a = el.animate([{ transform: 'translate(0,0) rotate(-12deg)', opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: `translate(${Math.max(40, rect.width)}px, 0) rotate(8deg)`, opacity: 1, offset: 0.85 }, { transform: `translate(${Math.max(40, rect.width) + 20}px, -10px) rotate(10deg)`, opacity: 0 }], { duration: 650, easing: 'ease-in-out' });
  a.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1000);
}

/* ---------- fitting the stage to the window (no page scroll during play) ---------- */
/* The stage takes the room between where it starts and the bottom of the window — above the phone's tab bar — never
   under MIN (a very short window scrolls rather than crushing the play). */
const MIN = 400;
export function fitInk() {
  if (typeof document === 'undefined') return;
  for (const el of document.querySelectorAll('.stg[data-inkfit]')) {
    const box = el.closest('.bz-content'), pb = box ? parseFloat(getComputedStyle(box).paddingBottom) || 0 : 20;   // the page keeps this below (the phone's tab bar clearance)
    const top = el.getBoundingClientRect().top + scrollY, room = Math.floor(innerHeight - top - pb);
    el.style.height = `${Math.max(MIN, room)}px`;
  }
}
if (typeof window !== 'undefined') { let t = null; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitInk, 80); }); }
