/* coach.js — the Coach's reading of a child (Bizzing Bee's Coach, for English; Quill is the coach). Pure: it reads
   what the app already records and nothing else — the mistakes deck (k.misses: a wrong answer in a check or a
   story's exercise), the games' and tools' slips (k.slips) — sorts each into one trap of the rulebook
   (data/coach-rules.js), and says the one thing. No model, no free text read, nothing sent.

   It also owns the daily goal (Bee's three rings): App time from the family activity feed (minutes the drop-in
   counted as active), Practise time from k.days[date].prac (seconds practising, practice-time.js), and Right
   answers from k.days[date].right, against per-child targets. The rings are a daily goal, never learning:
   learning is counted only by right answers and later-day checks (mastery.js). */

import { TRAPS, TRAP_IDS, KIND_TRAP, STOP_TRAP, GAME_TRAP, UNMARKED, TARGET_DEFAULTS } from './data/coach-rules.js';
export { TARGET_DEFAULTS };
import { stopById } from './curriculum.js';
import { readingStop } from './reading.js';
import { today } from './model.js';

export const WINDOW = 30 * 864e5;   // a miss older than thirty days has had its say

/* ---------- which trap ---------- */
export function trapOfStop(id) {
  if (!id) return null;
  if (STOP_TRAP[id]) return STOP_TRAP[id];
  if (/^(rd|bk)-/.test(id) && readingStop(id)) return 'reading';
  const st = stopById(id); if (!st || UNMARKED.includes(st.kind)) return null;
  return KIND_TRAP[st.kind] || null;
}
/* an item id is `<kind>:<key>`; a written question is `au:<stop>:<i>` */
export function trapOfItem(item) {
  const [kind, sid] = String(item || '').split(':');
  if (kind === 'au') return trapOfStop(sid);
  return KIND_TRAP[kind] || null;
}
export const trapOfMiss = (m) => (m && (trapOfStop(m.stop) || trapOfItem(m.item))) || null;
export function trapOfSlip(s) {
  const t = GAME_TRAP[s?.g]; if (!t) return null;
  return typeof t === 'string' ? t : t[s.c] || t['*'] || null;
}

/* A game or a tool records its misses here: { g, c, n, at } — the game, the miss's category, how many. Kept to
   the last 200, like the mistakes deck. Numbers and ids only. */
export function recordSlips(k, g, misses, t = Date.now()) {
  if (!k || !GAME_TRAP[g]) return;
  const add = typeof misses === 'string' ? { [misses]: 1 } : misses || {};
  const L = (k.slips ||= []);
  for (const [c, n] of Object.entries(add)) if (n > 0) L.push({ g, c: String(c).slice(0, 40), n: Math.min(20, Math.round(n)), at: t });
  if (L.length > 200) L.splice(0, L.length - 200);
}

/* every trap that caught this child in the window, worst first: [{ id, label, n, stops: {id: n} }] */
export function missTraps(k, t = Date.now()) {
  const by = {};
  const add = (id, n, stop) => { if (!id || !TRAPS[id]) return; const x = (by[id] ||= { id, label: TRAPS[id].label, n: 0, stops: {} }); x.n += n; if (stop) x.stops[stop] = (x.stops[stop] || 0) + n; };
  for (const m of k?.misses || []) if (m && !m.ok && t - (m.at || 0) < WINDOW) add(trapOfMiss(m), 1, m.stop && (stopById(m.stop) || readingStop(m.stop)) ? m.stop : null);
  for (const s of k?.slips || []) if (s && t - (s.at || 0) < WINDOW) add(trapOfSlip(s), s.n || 1, null);
  return Object.values(by).sort((a, b) => b.n - a.n || TRAP_IDS.indexOf(a.id) - TRAP_IDS.indexOf(b.id));
}
export const topTrap = (k, t) => missTraps(k, t)[0] || null;

/* Quill's one-line read, from the evidence only. Plain text with the trap's name marked as [[…]] for the view. */
export function coachRead(k, t = Date.now()) {
  const traps = missTraps(k, t), all = traps.reduce((a, x) => a + x.n, 0);
  if (!all) return { kind: 'none', text: 'Nothing has slipped yet for me to read. Go and answer some questions — a wrong answer is the fastest way to make me useful.' };
  const top = traps[0];
  if (traps.length >= 3 && top.n <= 1) return { kind: 'spread', top, text: 'Your slips are spread thin — no single trap is catching you, which is a good place to be. Pick any one below and make it yours.' };
  const share = top.n >= all * 0.5 ? 'Most of what slips goes the same way' : 'More of your slips go this way than any other';
  return { kind: 'top', top, text: `${share}: [[${top.label.toLowerCase()}]]. Fix that one thing and ${top.n} of your ${all} slip${all === 1 ? '' : 's'} stop happening.` };
}

/* ---------- the daily goal ---------- */
export const RING_COL = [['#E8458C', '#FF8FC0'], ['#2FA35C', '#6FD48F'], ['#3D7DF0', '#8FB6FF']];   // Bee's: app · practise · count
/* sensible defaults by age band: minutes on the app, minutes practising, right answers */
export const TARGET_MAX = { app: 180, prac: 120, words: 100 };
export function targets(k) {
  const d = TARGET_DEFAULTS[k?.band] || TARGET_DEFAULTS[2], t = k?.targets || {};
  const one = (f) => { const v = Math.round(+t[f]); return v > 0 ? Math.min(TARGET_MAX[f], v) : d[f]; };   // unset or 0 → the band's default
  return { app: one('app'), prac: one('prac'), words: one('words') };
}
/* the family feed's active minutes for this child on a day (the drop-in writes whole minutes) */
export function appMinutes(log, name, day) {
  const who = String(name || '').trim().toLowerCase(); let m = 0;
  for (const x of log || []) if (x && x.a === 'english' && x.d === day && String(x.who || '').trim().toLowerCase() === who) m += x.m || 0;
  return m;
}
/* today's three, as Bee's todayMetrics: app and prac in SECONDS, words a count; p* are fractions of the target
   (above 1 draws the second lap) */
export function todayMetrics(k, log, t = Date.now()) {
  const day = today(t), d = k?.days?.[day] || {}, tg = targets(k);
  const app = appMinutes(log, k?.name, day) * 60, prac = Math.max(0, Math.round(d.prac || 0)), words = d.right || 0;
  return { app, prac, words, tApp: tg.app * 60, tPrac: tg.prac * 60, tWords: tg.words, pApp: app / (tg.app * 60), pPrac: prac / (tg.prac * 60), pWords: words / tg.words };
}
export const allClosed = (m) => m.pApp >= 1 && m.pPrac >= 1 && m.pWords >= 1;
/* the last n days, oldest first: { day, app (s), prac (s), words } */
export function metricDays(k, log, n = 30, t = Date.now()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const day = today(t - i * 864e5), d = k?.days?.[day] || {};
    out.push({ day, app: appMinutes(log, k?.name, day) * 60, prac: Math.round(d.prac || 0), words: d.right || 0 }); }
  return out;
}
export function fmtMins(sec) { sec = Math.max(0, Math.round(sec || 0)); const m = Math.floor(sec / 60); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }

/* Bee's ringsSVG: three nested rings, no numbers inside; past the target a second lap is drawn in a lighter shade */
export function ringsSVG(size, vals) {
  const R = [52, 39, 26], W = 13;
  return `<svg class="bz-rings" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true" focusable="false" style="transform:rotate(-90deg)">${vals.map((v, i) => {
    const r = R[i], C = 2 * Math.PI * r, p = Math.max(0, +v || 0), base = Math.min(1, p), over = Math.max(0, Math.min(1, p - 1)), [col, lite] = RING_COL[i];
    return `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width="${W}"/>`
      + (base > 0 ? `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="${W}" stroke-linecap="round" stroke-dasharray="${(C * base).toFixed(2)} ${C.toFixed(2)}" data-ring="${i}"/>` : '')
      + (over > 0 ? `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${lite}" stroke-width="${W - 4}" stroke-linecap="round" stroke-dasharray="${(C * over).toFixed(2)} ${C.toFixed(2)}" data-lap="${i}"/>` : '');
  }).join('')}</svg>`;
}
