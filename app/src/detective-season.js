/* detective-season.js — Inkwell Detective around the cases: the child's record, the season's order and gates, the
   personas and their Knacks, the Word Hoard, the casebook wall, the shelf, the Blot Ledger, the Reading Door, ranks
   and the detective level. The case itself is detective.js; this file never judges a clue.

   ─── The child's record: k.inkwell (store v5; backed up — never a name) ─────────────────────────────────────────
     { v: 1,
       cases:   { [caseId]: caseState }               detective.js newCase/step — one live state per case
       closed:  { [caseId]: { at, score, full, persona, culprit, replays } }   the casebook wall's stamps
       persona: personaId | null                      chosen in Case 0; changed between cases at the coat stand
       level:   { n: 1–5, pick: n | null }            the detective level (owner's rule on each case score); pick = the
                                                      child's own choice, which sticks until the next case moves it
       hoard:   { [personaId]: [cardId] }             the Word Hoard book: one card per case, per persona played
       found:   { [cardId]: dayFoundOn }              for the later-day origin questions at the Training Desk
       school:  { timeline, who, spotter }            Detective School: { level, pick, plays } each (games.js memory shape)
     }
     k.inkwellName — the persona's name if the child renamed it (12 characters, the name filter); never backed up.

   ─── API ──────────────────────────────────────────────────────────────────────────────────────────────────────
     newInkwell() · inkOf(k)                         the record, created on first use
     SEASON · ACTS · seasonEntry(id)                 the sixteen chapters in order (handover §4.3)
     released(c, { tester })                         a case is shown to children only once the owner signed it off
                                                     (source.signedOffBy); unsigned cases appear only in tester mode
     seasonList(k, cases, { tester })                [{ id, kind, title, level, act, open, solved, why }] — the Casebook
     choosePersona(k, id) · renamePersona(k, name) · personaOf(k) · suggestPersona(k)
     knackFor(c, personaId)                          { chapter, line, candidates[3], … } — UI only (detective.js step 'knack')
     startCase(k, c, { now, replay }) · caseOf(k, c) · save the result of detective.step back with putCase(k, c, cs)
     closeCase(k, c, cs, { now })                    → { wall, shelf, ledger, card, level, rank, door } after a solve
     wall(k, cases) · shelf(k, cases) · ledgerWords(k, cases) · door(k) · rankOf(k) · RANKS
     hoardCard(personaId, caseId) · hoardBook(k, personaId)
     originDue(k, now) · answerOrigin(k, cardId, answer, now)   later-day Word Hoard questions (credit only, no coins)
     englishLevelOf(k, strand)                       the child's own English level 1–5 for the Training Desk
     setLevel(k, n | null) · levelAfter(k, score)    the level chip */

import { PERSONAS, personaById } from './data/inkwell-personas.js';
import { CARDS, BONUS } from './data/inkwell-wordhoard.js';
import { KNACKS } from './data/inkwell-knacks.js';
import { newCase, replayCase, nextLevel, credit, restore } from './detective.js';
import { lineSafe } from './safe.js';
import { levelDone, headStart } from './model.js';

export const SEASON = [
  { id: 'case-00', kind: 'case', act: 1 }, { id: 'case-01', kind: 'case', act: 1 }, { id: 'case-02', kind: 'case', act: 1 }, { id: 'case-03', kind: 'case', act: 1 },
  { id: 'journey-01', kind: 'journey', act: 1, door: 1 },
  { id: 'case-04', kind: 'case', act: 2 }, { id: 'case-05', kind: 'case', act: 2 }, { id: 'journey-02', kind: 'journey', act: 2, door: 2 },
  { id: 'case-06', kind: 'case', act: 2 }, { id: 'case-07', kind: 'case', act: 2 }, { id: 'journey-03', kind: 'journey', act: 3, door: 3 },
  { id: 'case-08', kind: 'case', act: 3 }, { id: 'case-09', kind: 'case', act: 3 }, { id: 'journey-04', kind: 'journey', act: 3, door: 4 },
  { id: 'case-10', kind: 'case', act: 3 }, { id: 'case-11', kind: 'case', act: 3 },
];
/* Act I = Cases 0–3 and the Olympus Journey (the release plan's first batch, handover §4.3, §12). */
export const ACTS = { 1: 'Act I: The Vanishing Begins', 2: 'Act II', 3: 'Act III' };
export const seasonEntry = (id) => SEASON.find((s) => s.id === id) || null;
/* the Reading Door opens after four cases are on the wall (Case 3), then after Cases 5, 7 and 9 (§4.1) */
export const DOOR_AFTER = { 1: 'case-03', 2: 'case-05', 3: 'case-07', 4: 'case-09' };
/* Detective rank by cases solved with FULL evidence on the first accusation (mastery evidence, never time, §2.1.7, §2.3) */
export const RANKS = [{ id: 'cadet', name: 'Cadet', at: 0 }, { id: 'constable', name: 'Constable', at: 2 }, { id: 'sergeant', name: 'Detective Sergeant', at: 4 }, { id: 'inspector', name: 'Inspector', at: 7 }, { id: 'chief', name: 'Chief Inspector', at: 11 }];

export const newInkwell = () => ({ v: 1, cases: {}, closed: {}, persona: null, level: { n: 1, pick: null }, hoard: {}, found: {}, school: {} });
export function inkOf(k) { if (!k) return null; if (!k.inkwell) k.inkwell = newInkwell(); const i = k.inkwell; i.cases ||= {}; i.closed ||= {}; i.level ||= { n: 1, pick: null }; i.hoard ||= {}; i.found ||= {}; i.school ||= {}; return i; }

/* ---------- release and gates ---------- */
export const signed = (c) => !!c?.source?.signedOffBy;
export const released = (c, { tester = false } = {}) => !!c && (signed(c) || tester);
/* The Casebook: every chapter of the season, in order. A chapter opens when the one before it is solved (the story is
   a season); a Journey also needs its Door. Nothing time-limited; a paused case stays open on the wall. */
export function seasonList(k, cases, { tester = false } = {}) {
  const ink = inkOf(k), byId = new Map((cases || []).map((c) => [c.id, c])), out = [];
  let prevSolved = true;
  for (const s of SEASON) {
    const c = byId.get(s.id), solved = !!ink.closed[s.id], live = ink.cases[s.id];
    const rel = released(c, { tester }), doorOk = !s.door || !!ink.closed[DOOR_AFTER[s.door]];
    const open = !!c && rel && (tester || (prevSolved && doorOk));
    out.push({ id: s.id, kind: s.kind, act: s.act, title: c?.title || s.id, level: c?.level || null, solved, paused: !!live && !live.solved && !solved, open,
      why: !c ? 'not written yet' : !rel ? 'waiting for the owner to sign it off' : open ? null : !doorOk ? 'the Reading Door has not opened yet' : 'solve the case before it first' });
    if (rel) prevSolved = solved;
  }
  return out;
}

/* ---------- personas ---------- */
export const personaOf = (k) => personaById(inkOf(k)?.persona);
export function choosePersona(k, id) { if (!personaById(id)) return false; inkOf(k).persona = id; return true; }
/* The child may rename the detective (§2.1.6): 12 characters, the same filter as names; stored apart from backups. */
export function renamePersona(k, name) {
  const n = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 12);
  if (!n) { k.inkwellName = null; return true; }
  if (!lineSafe(n) || !/^[\p{L}\p{M}' -]+$/u.test(n)) return false;
  k.inkwellName = n; return true;
}
export const detectiveName = (k) => k?.inkwellName || personaOf(k)?.name || 'the new detective';
/* Winged Words is the default suggestion for the youngest band (§1.3); otherwise no suggestion — never by heritage,
   faith or gender (§2.1, §13.7). */
export const suggestPersona = (k) => (k?.band === 1 ? 'milo' : null);

/* The Knack for this case and persona: the Journey's own persona block (format 1.3), Case 0's tutorial variant, or the
   generated stand-in (needsReview). UI only: detective.js step('knack') returns it and changes nothing else. */
export function knackFor(c, pid) {
  if (c?.persona?.[pid]) { const p = c.persona[pid]; return { chapter: p.knack?.chapter ?? p.line?.chapter, line: p.line?.text ?? p.line, candidates: p.knack?.candidates || [], ...p.knack, scripted: true }; }
  const tut = (c?.tutorial || []).find((t) => t.step === 'knack');
  if (tut?.variants?.[pid]) return { chapter: 1, doc: '0.3', line: tut.variants[pid].line, candidates: tut.variants[pid].candidates, scripted: true };
  return KNACKS[c?.id]?.[pid] || null;
}

/* ---------- cases in the record ---------- */
export function caseOf(k, c) { const ink = inkOf(k), raw = ink.cases[c.id]; return raw ? restore(c, raw) : null; }
export function startCase(k, c, { now = Date.now(), replay = false } = {}) {
  const ink = inkOf(k), prev = caseOf(k, c);
  if (prev && !replay) return prev;
  const cs = prev || ink.closed[c.id] ? replayCase(c, prev || { paid: ink.closed[c.id]?.paid, solved: true }, { persona: ink.persona, now }) : newCase(c, { persona: ink.persona, now });
  ink.cases[c.id] = cs; return cs;
}
export function putCase(k, c, cs) { inkOf(k).cases[c.id] = cs; return cs; }

/* After a solve: the wall's stamp, the shelf object, the Ledger word, the Word Hoard card, the level, the rank and the
   Door. Pays nothing itself (detective.js already returned what to pay). Idempotent for a case already closed. */
export function closeCase(k, c, cs, { now = Date.now() } = {}) {
  const ink = inkOf(k); if (!cs?.solved) return null;
  const was = ink.closed[c.id], full = cs.firstScore === 1;
  const rankBefore = rankOf(k).id;
  ink.closed[c.id] = { at: was?.at || now, score: was ? was.score : cs.score, full: !!(was?.full || full), persona: cs.persona, culprit: c.accusation?.culprit || null, replays: (was?.replays || 0) + (was ? 1 : 0), paid: cs.paid };
  const levelBefore = levelNow(k);
  if (!was) { ink.level.n = nextLevel(ink.level.pick ?? ink.level.n, cs.score); ink.level.pick = null; }
  // the Word Hoard: this persona's card for this case (a Journey gives every persona its bonus card)
  const card = cs.persona ? hoardCard(cs.persona, c.id) : null;
  if (card) { const book = (ink.hoard[cs.persona] ||= []); if (!book.includes(card.id)) book.push(card.id); ink.found[card.id] ||= dayOf(now); }
  return { wall: wall(k, [c]).find((w) => w.id === c.id), shelf: c.officeObject || c.souvenir || null, ledgerWord: c.vanishedWord || null, card,
    level: { before: levelBefore, after: ink.level.n, dropped: ink.level.n < levelBefore }, rank: { before: rankBefore, after: rankOf(k).id }, door: door(k) };
}
const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

/* the casebook wall: every case started or solved, with its stamp; unsolved cases stay open */
export function wall(k, cases) {
  const ink = inkOf(k);
  return (cases || []).filter((c) => ink.closed[c.id] || ink.cases[c.id]).map((c) => {
    const w = ink.closed[c.id];
    return { id: c.id, title: c.title, kind: c.kind || 'case', stamp: w ? 'SOLVED' : null, full: !!w?.full, culprit: w?.culprit || null, paused: !w };
  });
}
/* the office shelf: each solved case's object (and, by the Door, each Journey's souvenir) — earned, never bought */
export const shelf = (k, cases) => (cases || []).filter((c) => inkOf(k).closed[c.id]).map((c) => ({ id: c.id, object: c.officeObject || c.souvenir || null, byDoor: c.kind === 'journey' }));
/* the Blot Ledger: the vanished words inked so far, in their order (UNDER … EVERYONE) */
export const ledgerWords = (k, cases) => (cases || []).filter((c) => c.vanishedWord && inkOf(k).closed[c.id]).sort((a, b) => a.ledgerIndex - b.ledgerIndex).map((c) => ({ i: c.ledgerIndex, word: c.vanishedWord }));
/* the Reading Door: how many times it has opened (0–4), and whether its keyhole is brimming for the next Journey */
export function door(k) { const ink = inkOf(k); const opened = [1, 2, 3, 4].filter((n) => ink.closed[DOOR_AFTER[n]]).length; return { opened, next: opened < 4 ? opened + 1 : null, keyhole: opened > 0 && !ink.closed[`journey-0${opened}`] }; }
export function rankOf(k) { const n = Object.values(inkOf(k).closed).filter((w) => w.full).length; return [...RANKS].reverse().find((r) => n >= r.at); }
export const sergeant = (k) => RANKS.findIndex((r) => r.id === rankOf(k).id) >= 2;

/* ---------- the level chip (§1.4; owner's rule) ---------- */
export function setLevel(k, n) { const ink = inkOf(k); ink.level.pick = n == null ? null : Math.max(1, Math.min(5, Math.round(n))); return ink.level; }
export const levelNow = (k) => { const l = inkOf(k).level; return l.pick ?? l.n; };
export const levelAfter = (k, score) => nextLevel(levelNow(k), score);
export const DROP_LINE = (n) => `Let's warm up on Level ${n}. You can move back up any time.`;

/* ---------- the Word Hoard ---------- */
export function hoardCard(pid, caseId) {
  const b = BONUS.find((x) => x.case === caseId); if (b) return b;
  return CARDS.find((x) => x.persona === pid && x.case === caseId) || null;
}
export const hoardBook = (k, pid) => { const got = new Set(inkOf(k).hoard[pid] || []); return CARDS.filter((x) => x.persona === pid).map((x) => (got.has(x.id) ? x : { id: x.id, case: x.case, empty: true })); };
/* Origin questions recur at the Training Desk on a LATER day (§3.1); only that later answer credits the objective. */
export function originDue(k, now = Date.now()) {
  const ink = inkOf(k), d = dayOf(now);
  return Object.entries(ink.found).filter(([, on]) => on < d).map(([id]) => CARDS.find((x) => x.id === id)).filter((x) => x && x.question && !(ink.originDone || {})[x.id]);
}
export function answerOrigin(k, cardId, answer, now = Date.now()) {
  const ink = inkOf(k), card = CARDS.find((x) => x.id === cardId); if (!card) return null;
  if (!originDue(k, now).some((x) => x.id === cardId)) return { right: false, why: 'not due' };
  const right = String(answer) === String(card.question.answer);
  if (!right) return { right: false, hold: true, explain: card.question.explain };
  (ink.originDone ||= {})[cardId] = dayOf(now);
  const out = credit(k, card.objective, 1, 1, now);
  return { right: true, explain: card.question.explain, events: out === 'learned' || out === 'mastered' ? [{ ev: 'mastery', what: `${out === 'mastered' ? 'Mastered' : 'Learned'}: ${card.objective}` }] : [] };
}

/* ---------- the child's own English level (the Training Desk's tier) ---------- */
/* The app's level for the strand (1–10: the highest level done, plus one; or the start the band gives), on the
   bible's five-level scale (Part 7: two app levels to one detective level). */
export function englishLevelOf(k, strand = 'reading') {
  if (!k) return 1;
  let done = 0; for (let n = 1; n <= 10; n++) { try { if (levelDone(k, strand, n)) done = n; else break; } catch { break; } }
  const working = done ? Math.min(10, done + 1) : headStart(k, strand);
  return Math.max(1, Math.min(5, Math.ceil(working / 2)));
}
export { PERSONAS };
