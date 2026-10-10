/* model.js — the household and its children (SPEC §12). State is a HOUSEHOLD { v, parent, kids[],
   active }, never a child: a second child inherits nothing of the first's (test/model.mjs).

   A child is first name + age band + avatar — never a birthdate, surname, school, photo or
   location. Their free writing and recordings never enter this record (SPEC §5, §6.3): the
   writing desk keeps drafts per child in the same household only as text the child typed, and
   recordings are never kept at all — only the numbers measured from them. */

import { VERSION } from './store.js';
import { STRANDS, strand, level } from './curriculum.js';
import { readingStops, bookStops } from './reading.js';
import { TARGET_DEFAULTS } from './data/coach-rules.js';

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
    days: {},                                                // date → { answers, right, stops, …, prac } — counts, and prac: seconds practising (practice-time.js)
    last: null,                                              // the last thing done, for the greeting and Continue
    targets: { ...TARGET_DEFAULTS[[1, 2, 3].includes(band) ? band : 2], pages: 1, made: 1 },   // Bee's daily goal (coach.js), set by the grown-up: minutes on the app, minutes practising, right answers
    slips: [],                                               // what games and tools missed, for the Coach: [{ g, c, n, at }] (coach.js recordSlips)
    prefs: { readAloud: band === 1 },
    milestones: [],                                          // named learning milestones reached (legendary avatars)
    writing: {},                                             // free writing: desk pieces, talk-about-it thoughts — on this device only, never in a backup
    place: null,                                             // "Find my starting place": { word, reading, at } — where each road starts (placement.js)
  };
}

export const activeKid = (h) => h?.kids.find((k) => k.id === h.active) || null;

export function addKid(h, kid) { h.kids.push(kid); h.active = kid.id; return kid; }
export function removeKid(h, id) { h.kids = h.kids.filter((k) => k.id !== id); if (h.active === id) h.active = h.kids[0]?.id || null; }

/* Pronoun-neutral by construction: the report says the name, or "they". */
export const they = (k) => (k?.name ? k.name : 'they');

/* ---------- gates (Maths' worldOpen pattern) ---------- */

/* a level's stops: Reading's are its passages and book chapters (reading.js), which the curriculum table does
   not list — reading them from the table left every Reading level "not done", so Speaking (after Reading 1)
   and Literature (after Reading 2) never opened below band 3 (brief v4, the demo's locked strands) */
export const levelStops = (sid, n) => (sid === 'reading' ? [...readingStops(), ...bookStops()].filter((s) => s.level === n) : level(sid, n)?.stops || []);
/* A level is DONE (it opens what follows it) when every stop is passed — except Reading, where a level holds up to
   24 passages or chapters: there it is done after READING_ENOUGH of them, or all if it holds fewer (owner, 4 Oct).
   A level is COMPLETE (its certificate: "every stop passed") only when every one is. */
export const READING_ENOUGH = 3;
export const levelComplete = (k, sid, n) => { const ss = levelStops(sid, n); return ss.length > 0 && ss.every((s) => k.stops[s.id]?.passed); };
export const levelDone = (k, sid, n) => {
  if (sid !== 'reading') return levelComplete(k, sid, n);
  const ss = levelStops(sid, n); return ss.length > 0 && ss.filter((s) => k.stops[s.id]?.passed).length >= Math.min(READING_ENOUGH, ss.length);
};

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

/* Levels open in order; the age band gives a head start (a twelve-year-old does not start on rhymes), and
   "Find my starting place" (placement.js) can set a strand's own start in k.place — Word and Reading — held
   to 1–5. A start only opens levels: nothing below it is marked passed. */
export const bandStart = (k) => (k.band === 3 ? 3 : k.band === 2 ? 2 : 1);
export const headStart = (k, sid) => { const p = k?.place?.[sid]; return Number.isFinite(p) ? Math.max(1, Math.min(5, Math.round(p))) : bandStart(k); };
export const placed = (k, sid) => Number.isFinite(k?.place?.[sid]);
export function levelOpen(k, sid, n) {
  if (n <= headStart(k, sid)) return true;
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
