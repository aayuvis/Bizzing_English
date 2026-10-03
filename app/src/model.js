/* model.js — the household and its children (SPEC §12). State is a HOUSEHOLD { v, parent, kids[],
   active }, never a child: a second child inherits nothing of the first's (test/model.mjs).

   A child is first name + age band + avatar — never a birthdate, surname, school, photo or
   location. Their free writing and recordings never enter this record (SPEC §5, §6.3): the
   writing desk keeps drafts per child in the same household only as text the child typed, and
   recordings are never kept at all — only the numbers measured from them. */

import { VERSION } from './store.js';
import { STRANDS, strand, level } from './curriculum.js';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function newHousehold() {
  return { v: VERSION, parent: { pin: null, plan: 'free', tester: false, hiveLink: true }, kids: [], active: null };
}

export function newKid(name, band, avatar) {
  return {
    id: uid(), name: String(name).trim().slice(0, 20), band: [1, 2, 3].includes(band) ? band : 2, avatar, created: Date.now(),
    owned: [], worlds: [], world: 1,                         // avatars bought, worlds bought, the world being worn
    stops: {},                                               // stopId → { passed, best, at, tries, step } (step: unfinished lesson position)
    mastery: {},                                             // objective (stop id) → see mastery.js
    misses: [],                                              // the mistakes deck: { stop, item, at, ok? }
    bank: {},                                                // word bank: word → { at, from }
    reading: {},                                             // passageId → { read, at, checks }
    book: null,                                              // the book being read: { work, passage }
    medals: {},                                              // id → time earned
    seen: {},                                                // celebrated once
    games: {},                                               // game id → { best, plays }
    stage: {},                                               // speaking: stopId → [{ at, secs, wpm, pauses }] (numbers only)
    contests: [],                                            // Elocution Contest: [{ at, n, band, rounds, total, place, of }] (numbers only)
    extras: { owned: [], wear: {} },                         // the Shop's Extras: bought ids, and what is worn per kind
    copy: {},                                                // copywork: line id → { at, ok }
    days: {},                                                // date → { answers, right, stops } — counts, never minutes
    last: null,                                              // the last thing done, for the greeting and Continue
    targets: { words: 10, pages: 1, made: 1 },               // daily ring targets, set by the grown-up: right answers, passages, things said or written
    prefs: { readAloud: band === 1 },
    milestones: [],                                          // named learning milestones reached (legendary avatars)
    writing: {},                                             // free writing: desk pieces, talk-about-it thoughts — on this device only, never in a backup
  };
}

export const activeKid = (h) => h?.kids.find((k) => k.id === h.active) || null;

export function addKid(h, kid) { h.kids.push(kid); h.active = kid.id; return kid; }
export function removeKid(h, id) { h.kids = h.kids.filter((k) => k.id !== id); if (h.active === id) h.active = h.kids[0]?.id || null; }

/* Pronoun-neutral by construction: the report says the name, or "they". */
export const they = (k) => (k?.name ? k.name : 'they');

/* ---------- gates (Maths' worldOpen pattern) ---------- */

export const levelDone = (k, sid, n) => { const l = level(sid, n); return !!l && l.stops.length > 0 && l.stops.every((s) => k.stops[s.id]?.passed); };

/* A strand opens by band or by the strand before it; a free child sees every strand, and a
   family-plan strand says so plainly rather than hiding. */
export function strandOpen(k, sid) {
  const s = strand(sid); if (!s) return false;
  if (!s.opens) return true;
  if (s.opens.band && k.band >= s.opens.band) return true;
  if (s.opens.after) { const [a, n] = s.opens.after; return levelDone(k, a, n) || k.band >= 3; }
  return false;
}
export const planOpen = (h, sid) => strand(sid)?.free || h.parent.plan === 'family' || h.parent.tester;

/* Levels open in order; the age band gives a head start (a twelve-year-old does not start on rhymes). */
export const headStart = (k) => (k.band === 3 ? 3 : k.band === 2 ? 2 : 1);
export function levelOpen(k, sid, n) {
  if (n <= headStart(k)) return true;
  return levelDone(k, sid, n - 1);
}

/* ---------- recording work ---------- */

export function bumpDay(k, f, n = 1, t = Date.now()) { const d = (k.days[today(t)] ||= { answers: 0, right: 0, stops: 0, words: 0, pages: 0, speak: 0 }); d[f] = (d[f] || 0) + n; }

/* Good days in the last N days — a count in a window, never a run (no streaks: SPEC §12). */
export function goodDays(k, n = 7, t = Date.now()) {
  let c = 0;
  for (let i = 0; i < n; i++) { const d = k.days[today(t - i * 864e5)]; if (d && (d.right >= 5 || d.stops >= 1)) c++; }
  return c;
}

export function addToBank(k, w, from) { const key = String(w).toLowerCase(); if (!k.bank[key]) k.bank[key] = { at: Date.now(), from: from || '' }; }

/* The level shown in the ring foot: the highest finished level across strands, named. */
/* the highest level finished, in any strand: { s, l } or null */
export function bestLevel(k) {
  let best = null;
  for (const s of STRANDS) for (const l of s.levels) if (levelDone(k, s.id, l.n)) if (!best || l.n > best.l.n) best = { s, l };
  return best;
}
export function headline(k) { const best = bestLevel(k); return best ? `${best.s.title} ${best.l.n} · ${best.l.title}` : 'Just starting'; }
