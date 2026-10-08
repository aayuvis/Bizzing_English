/* detective.js — Inkwell Detective's case engine (handover Part C §2.1, Part D; season-one.md Parts 9–10).
   No screens live here: views/detective.js draws this state. Everything below is plain data in, plain data out.

   ─── The shape ────────────────────────────────────────────────────────────────────────────────────────────────
   A CASE is the JSON of data/cases/case-NN.json or data/journeys/journey-0N.json (format 1.1–1.3). It is never
   changed by play. A CASE STATE (`cs`) is one child's run through one case — JSON-safe, saved through the Store
   seam at k.inkwell.cases[caseId] (store v4), resumable mid-case:

     { v: 1, id, persona, started, chapter, reached, solved, solvedAt, replay,
       read:      [docId]                       documents opened
       marks:     [{ id, doc, span|null, text }] the notebook (a span id, or a loose note `n:doc:from-to`)
       asked:     [questionId]
       links:     [{ a, b, kind, d }]           accepted links on the board (d: the deduction it serves)
       misses:    { [deductionId]: n, board: n } rejected link attempts touching each deduction's clues
       proved:    [deductionId]
       timeline:  { line: [eventId], checks: n, done }
       accusations: [{ culprit, evidence: [id], place, verdict, score, at }]
       hints:     { [target]: level }   ink: n (hint currency: a score, never coins)
       knack:     { [chapter]: n }      the Knack's uses this chapter (UI only: it changes no score)
       desk:      { [exerciseId]: { tries, right, first, at } }
       hoard:     { card, tries, right } the Word Hoard card found at Case Closed
       paid:      { answer, desk, stop: [chapter], contest }   once per child per case, kept across replays
       score, firstScore }

   ─── The five chapters (§2.1.3, exactly) ───────────────────────────────────────────────────────────────────
     1 The scene · 2 Interviews · 3 The board · 4 The timeline · 5 The accusation   (6 = Case Closed)
   The child moves freely back to any chapter reached. Forward: 1→2→3 are open; 3→4 opens when every needed
   deduction is proved on the board; 4→5 when the timeline holds. A wrong or weak accusation never ends the case:
   the child is sent back to the document that matters, with Quill's own line from the data. There is no timer
   anywhere in a case (nothing here reads a clock except to date a record).

   ─── API ──────────────────────────────────────────────────────────────────────────────────────────────────────
     prepare(c)                     → the case, indexed (memoised; every function below calls it)
     newCase(c, { persona, now })   → a fresh case state      replayCase(c, prev, { persona, now }) → a replay (pays 0)
     step(c, cs, action, ctx)       → { state, ok, say, events, ... }  the one reducer; actions:
        { type: 'open', doc }                     read a document (never pays)
        { type: 'mark', span } | { type: 'mark', doc, from, to }   pin a phrase (word indexes into tokens(doc))
        { type: 'unmark', id }
        { type: 'ask', q }                        an interview question; its answer becomes a document
        { type: 'link', a, b, kind }              two notebook clues and what they show (DTYPES)
        { type: 'unlink', i }
        { type: 'chapter', n }                    go to chapter n (refused with a reason if it is not open yet)
        { type: 'place', event, at } | { type: 'unplace', event }   the washing line; it checks itself when full
        { type: 'accuse', culprit, evidence: [ids], place }
        { type: 'hint' }                          Quill's graded hint for where the child is (costs 1 ink)
        { type: 'knack' }                         this chapter's Knack candidates (UI only; never in chapter 5)
        { type: 'desk', x, answer }               a Training Desk exercise
        { type: 'origin', answer }                the Word Hoard card's one question, at Case Closed
     ctx = { now, englishLevel (1–5), persona, k (the child, for mastery credit), cards (Word Hoard) }
     Outputs: `say` { who, text } is Quill's (or the data's) line; `events` [{ ev, what }] is what to PAY — the view
     calls app.js pay(ev, what) for each (family events answer · stop · contest · mastery); `returnTo` { doc, spans }
     where a wrong/weak accusation sends the child; `hold` true when a miss must wait for Continue.

     Pure reads: available(c, cs) · questions(c, cs) · tokens(c, docId) · resolveMark(c, doc, from, to) ·
       suspects(c, cs) · accusable(c, cs) · canEnter(c, cs, n) · boardCleared(c, cs) · proofSets(d) ·
       judgeLink(c, cs, a, b, kind) · judgeAccusation(c, cs, acc) · caseScore(c, acc, cs) · nextLevel(level, pct) ·
       deskItems(c, cs, englishLevel) · deskTier(c, englishLevel) · minimalItems(c) · personaText(s, p, name)
     Ink Journeys run on this same engine (case.kind === 'journey').

   ─── Pay (§2.1.8, §2.1.8a; family events only; nothing random; never for opening, time or a wrong accusation) ──
     answer 1  per deduction proved on its first try (no rejected link touched its clues), paid when the board clears
               — at most 10 a case
     stop 5    when the board (3), the timeline (4) and the accusation (5) each clear with valid evidence — the board
               with no more than 2 rejected links per needed deduction, the timeline in no more than 3 checks
     contest 10 a case solved with full evidence on the first accusation
     Training Desk: answer 1 per right first try, at most 10 a case (the Word Hoard card counts within it), + 1 ink
     A case pays once per child, whichever persona solves it: a replay carries `paid` over and pays nothing again.
   Mastery: a skill or an exercise's objective is credited only through mastery.js spacedCheck — which promotes on
   a LATER day than the teaching, never the same day — and only on positive evidence. */

import { spacedCheck, stepOf } from './mastery.js';

export const CHAPTERS = [
  { n: 1, id: 'scene', title: 'The scene', skill: 'Locating key details' },
  { n: 2, id: 'interviews', title: 'Interviews', skill: 'Questioning; reading for purpose' },
  { n: 3, id: 'board', title: 'The board', skill: 'Inference, reference, vocabulary in context, fact and opinion' },
  { n: 4, id: 'timeline', title: 'The timeline', skill: 'Sequence; tense (past perfect)' },
  { n: 5, id: 'accusation', title: 'The accusation', skill: 'Argument from evidence' },
];
export const CLOSED = 6;
/* What two clues can show: the board's wheel (season-one Part 10 §10.2). */
export const DTYPES = ['contradiction', 'timeline', 'pronoun', 'meaning', 'fact-opinion', 'figurative', 'voice', 'inference'];
export const DTYPE_LABEL = { contradiction: 'contradiction', timeline: 'timeline', pronoun: 'who "she" is', meaning: 'what the word means here', 'fact-opinion': 'fact or opinion', figurative: 'figurative', voice: 'voice', inference: 'inference' };
/* the bible's skill tags → the wheel's kinds, for a deduction that also tests a second skill */
const SKILL_KIND = { sequence: 'timeline', vocab: 'meaning', factopinion: 'fact-opinion', pronoun: 'pronoun', figurative: 'figurative', voice: 'voice', inference: 'inference', contradiction: 'contradiction' };
/* Skill tags → the curriculum stop each one is later-day evidence for (mastery.js). detail, inference and
   contradiction have no stop of their own in the curriculum yet, so they are counted in the case, not credited. */
export const SKILL_OBJECTIVE = { pronoun: 's1-more', sequence: 's2-tense', punctuation: 's5-comma', figurative: 'li5-simile', vocab: 'w2-word', voice: 'la6-register', factopinion: 'w8-purpose', detail: null, inference: null, contradiction: null };
export const ANSWER_CAP = 10, DESK_CAP = 10, INK_START = 3;
/* A chapter pays only when it clears WITH evidence, not by trying everything: the board's stop needs no more than
   two rejected links per needed deduction, the timeline's no more than three full checks. */
export const BOARD_MISSES_PER_DEDUCTION = 2, TIMELINE_CHECKS = 3;
export const boardMisses = (cs) => Object.values(cs.misses || {}).reduce((a, b) => a + b, 0);
export const PAY = { deduction: 'answer', chapter: 'stop', solve: 'contest', desk: 'answer' };

/* ---------- small helpers ---------- */
const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const uniq = (a) => [...new Set(a)];
const clone = (o) => JSON.parse(JSON.stringify(o));
const SPAN_RE = /\[\[c:([A-Za-z0-9_-]+)\|([\s\S]*?)\]\]/g;
export const plain = (t) => String(t || '').replace(SPAN_RE, '$2').replace(/<\/?[a-z][^>]*>/gi, '').replace(/[*_~]+/g, '');
const chapterOf = (v, dflt) => { if (typeof v === 'number') return v; const m = String(v || '').match(/chapter\s*(\d)/i); return m ? +m[1] : dflt; };

/* {det} tokens (format 1.3): {det} the persona's name; {det.he}/{det.him}/{det.his} (also capitalised {Det.he}…) */
export function personaText(s, p, name) {
  const P = p?.pronouns === 'he' ? { he: 'he', him: 'him', his: 'his' } : p?.pronouns === 'she' ? { he: 'she', him: 'her', his: 'her' } : { he: 'they', him: 'them', his: 'their' };
  const nm = name || p?.name || 'the new detective', cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  return String(s ?? '').replace(/\{(det|Det)(?:\.(he|him|his))?\}/g, (_, d, f) => { const w = f ? P[f] : nm; return d === 'Det' ? cap(w) : w; });
}

/* ---------- prepare: index a case once ---------- */
const PREP = new WeakMap();
export function prepare(c) {
  let P = PREP.get(c); if (P) return P;
  const spans = new Map(), docs = new Map(), toks = new Map();
  for (const d of c.docs || []) {
    docs.set(d.id, d);
    for (const m of String(d.body || '').matchAll(SPAN_RE)) spans.set(m[1], { id: m[1], doc: d.id, text: m[2] });
  }
  const answerOf = new Map(), qById = new Map(), qOfDoc = new Map();
  for (const iv of c.interviews || []) for (const q of iv.questions || []) { qById.set(q.id, { ...q, suspect: iv.suspect, iv }); answerOf.set(q.answerDoc, q.id); if (!qOfDoc.has(q.answerDoc)) qOfDoc.set(q.answerDoc, q.id); }
  const deds = new Map((c.deductions || []).map((d) => [d.id, d]));
  const needed = (c.deductions || []).filter((d) => !d.optional).map((d) => d.id);
  /* the board's own chapter needs these; a deduction "finished in chapter 4" (finishIn: 4) waits for documents that
     arrive there, so the board stays open for it in chapter 4 and the accusation waits for it instead */
  const needed3 = (c.deductions || []).filter((d) => !d.optional && !(d.finishIn > 3)).map((d) => d.id);
  const castIds = new Set((c.cast || []).map((p) => p.id));
  const ev = (c.timeline?.events || []).slice().sort((a, b) => a.order - b.order);
  P = { c, spans, docs, toks, answerOf, qById, qOfDoc, deds, needed, needed3, castIds, events: ev, childEvents: ev.filter((e) => e.placedByChild !== false) };
  PREP.set(c, P);
  return P;
}

/* ---------- state ---------- */
export function newCase(c, { persona = null, now = Date.now() } = {}) {
  return { v: 1, id: c.id, persona, started: now, chapter: 1, reached: 1, solved: false, solvedAt: null, replay: 0,
    read: [], marks: [], asked: [], links: [], misses: { board: 0 }, proved: [], timeline: { line: [], checks: 0, done: false },
    accusations: [], hints: {}, ink: INK_START, inkSpent: 0, knack: {}, desk: {}, hoard: null,
    paid: { answer: 0, desk: 0, stop: [], contest: false }, score: null, firstScore: null };
}
/* A replay with the same or another persona: everything fresh but what was paid (a case pays once per child). */
export function replayCase(c, prev, o = {}) {
  const s = newCase(c, o); if (prev) { s.paid = clone(prev.paid || s.paid); s.replay = (prev.replay || 0) + 1; s.paidDesk = clone(prev.desk || {}); s.everSolved = !!(prev.solved || prev.everSolved); }
  return s;
}
/* A saved state is plain JSON: serialise and restore through the Store seam. restore() also repairs a record
   saved by an older engine (missing fields take their defaults), so a case paused mid-board resumes exactly. */
export const serialise = (cs) => JSON.stringify(cs);
export function restore(c, saved) {
  const raw = typeof saved === 'string' ? JSON.parse(saved) : saved;
  if (!raw || raw.id !== c.id) return null;
  const base = newCase(c, { persona: raw.persona ?? null, now: raw.started });
  return { ...base, ...clone(raw), paid: { ...base.paid, ...(raw.paid || {}) }, timeline: { ...base.timeline, ...(raw.timeline || {}) }, misses: { ...base.misses, ...(raw.misses || {}) } };
}

/* ---------- documents and questions ---------- */
function docChapter(d) { return chapterOf(d.arrivesInChapter ?? d.unlockedIn ?? d.chapterShown, 1); }
export function questionOpen(c, cs, q) {
  const P = prepare(c); if (typeof q === 'string') q = P.qById.get(q); if (!q) return false;
  const ch = chapterOf(q.chapter ?? q.unlockedAt ?? q.chapterShown ?? q.unlockedIn, 2);
  if (cs.reached < ch || cs.chapter < 2) return false;
  if (q.appearsAfter && P.qById.has(q.appearsAfter) && !cs.asked.includes(q.appearsAfter)) return false;
  for (const d of [q.unlockedAfterDoc, q.offeredAfter, q.afterDoc]) if (d && !cs.read.includes(d)) return false;
  const iv = q.iv; if (iv?.unlockedBy && P.deds.has(iv.unlockedBy) && !cs.proved.includes(iv.unlockedBy)) return false;
  if (q.unlockedBy && P.deds.has(q.unlockedBy) && !cs.proved.includes(q.unlockedBy)) return false;
  return true;
}
export function questions(c, cs) {
  const out = [];
  for (const iv of c.interviews || []) for (const q of iv.questions || []) out.push({ id: q.id, suspect: iv.suspect, type: q.type, q: q.q, asked: cs.asked.includes(q.id), open: questionOpen(c, cs, q.id), answerDoc: q.answerDoc, expression: q.expression || null });
  return out;
}
export function docOpen(c, cs, id) {
  const P = prepare(c), d = P.docs.get(id); if (!d) return false;
  if (d.afterSolve) return !!cs.solved;
  if (P.answerOf.has(id)) return cs.asked.includes(P.answerOf.get(id));
  if (d.unlockedBy && P.qById.has(d.unlockedBy)) return cs.asked.includes(d.unlockedBy);
  if (d.unlockedBy && P.qById.size && !P.deds.has(d.unlockedBy)) { const q = [...P.qById.values()].find((x) => x.unlocks === id); if (q) return cs.asked.includes(q.id); }
  if (d.chapter === 'interview') return cs.reached >= 2;
  const q = [...P.qById.values()].find((x) => x.unlocks === id); if (q) return cs.asked.includes(q.id);
  return cs.reached >= docChapter(d);
}
export const available = (c, cs) => (c.docs || []).filter((d) => docOpen(c, cs, d.id)).map((d) => d.id);

/* A document's words, in reading order, each knowing the clue span it sits in (or null). The view marks a phrase
   by word indexes; the clue spans are never shown until the child marks them (Part 10: "the interface never does
   the reading for the child"). */
export function tokens(c, docId) {
  const P = prepare(c); if (P.toks.has(docId)) return P.toks.get(docId);
  const d = P.docs.get(docId); if (!d) return [];
  const out = []; let line = 0, last = 0;
  const push = (txt, span) => { for (const part of txt.split(/(\n)/)) { if (part === '\n') { line++; continue; } for (const w of part.split(/\s+/).filter(Boolean)) out.push({ i: out.length, t: plain(w), span, line }); } };
  const body = String(d.body || '');
  for (const m of body.matchAll(SPAN_RE)) { push(body.slice(last, m.index), null); push(m[2], m[1]); last = m.index + m[0].length; }
  push(body.slice(last), null);
  P.toks.set(docId, out); return out;
}
/* Which clue (if any) a pressed-and-held phrase is: the span it overlaps most, if the phrase covers at least half
   of it (all of a one- or two-word span) and runs no more than a few words past it. Anything else is a loose note. */
export function resolveMark(c, docId, from, to) {
  const T = tokens(c, docId); if (!T.length) return null;
  const a = Math.max(0, Math.min(from, to)), b = Math.min(T.length - 1, Math.max(from, to));
  const sel = T.slice(a, b + 1), count = {};
  for (const t of sel) if (t.span) count[t.span] = (count[t.span] || 0) + 1;
  let best = null;
  for (const [id, n] of Object.entries(count)) {
    const len = T.filter((t) => t.span === id).length, need = len <= 2 ? len : Math.ceil(len / 2), extra = sel.length - n;
    if (n >= need && extra <= Math.max(3, Math.floor(len / 2)) && (!best || n > best.n)) best = { id, n };
  }
  return { span: best ? best.id : null, text: sel.map((t) => t.t).join(' '), from: a, to: b };
}

/* ---------- people ---------- */
const castOpen = (c, cs, p) => (p.unlockedBy ? cs.proved.includes(p.unlockedBy) : p.unlockedBySpan ? cs.marks.some((m) => m.span === p.unlockedBySpan) : true);
/* the suspects board: suspects, a hidden culprit once found, a revealed answer card once found */
export const suspects = (c, cs) => (c.cast || []).filter((p) => ['suspect', 'culprit-hidden', 'answer'].includes(p.role) && castOpen(c, cs, p)).map((p) => p.id);
/* who may be named in the drawing room: the suspects board, the adversary, anyone the case's answer is */
export function accusable(c, cs) {
  const a = c.accusation || {}, ids = new Set([...suspects(c, cs), ...(c.cast || []).filter((p) => p.role === 'adversary' && castOpen(c, cs, p)).map((p) => p.id)]);
  for (const k of Object.keys(a.wrongSuspect || {})) { const p = (c.cast || []).find((x) => x.id === k); if (p && castOpen(c, cs, p)) ids.add(k); }
  return [...ids];
}

/* ---------- the board ---------- */
/* The alternative sets of clues that prove a deduction (format 1.1 `required`; the scripts' `minimum`,
   `minimumLink` (any one set) and `pairs` (any one pair)); null = any two of its clues. */
export function proofSets(d) {
  if (arr(d.requiredLinks).length) return [uniq(arr(d.requiredLinks).flat())];
  if (arr(d.required).length) return [arr(d.required)];
  if (arr(d.minimum).length) return [arr(d.minimum)];
  if (arr(d.minimumLink).length) return arr(d.minimumLink).map((x) => arr(x));
  if (arr(d.pairs).length) return arr(d.pairs).map((x) => arr(x));
  return null;
}
const kindsOf = (d) => uniq([d.type, ...arr(d.alsoKinds), ...[...arr(d.alsoSkill), ...arr(d.alsoSkills), ...arr(d.extraSkills)].map((s) => SKILL_KIND[s]).filter(Boolean)]);
const pool = (d) => arr(d.spans).filter((s) => !arr(d.contrastSpans).includes(s));
const touches = (d, a, b) => d.spans.includes(a) || d.spans.includes(b);
function components(links) {
  const parent = new Map(), f = (x) => { if (!parent.has(x)) parent.set(x, x); while (parent.get(x) !== x) x = parent.get(x); return x; };
  for (const l of links) { const ra = f(l.a), rb = f(l.b); if (ra !== rb) parent.set(ra, rb); }
  return f;
}
export function isProved(d, links) {
  const mine = links.filter((l) => l.d === d.id); if (!mine.length) return false;
  const f = components(mine), seen = new Set(mine.flatMap((l) => [l.a, l.b]));
  if (arr(d.requiredLinks).length) return arr(d.requiredLinks).every(([x, y]) => seen.has(x) && seen.has(y) && f(x) === f(y));   // each pair linked
  const sets = proofSets(d); if (!sets) return true;
  return sets.some((S) => S.length < 2 ? S.every((s) => seen.has(s)) : S.every((s) => seen.has(s)) && new Set(S.map(f)).size === 1);
}
const markedSpans = (cs) => new Set(cs.marks.filter((m) => m.span).map((m) => m.span));
/* Is (a, b, kind) a link the case's evidence graph supports? Pure. */
export function judgeLink(c, cs, a, b, kind) {
  const P = prepare(c), have = new Set(cs.marks.map((m) => m.id));
  if (!a || !b || a === b) return { ok: false, why: 'same' };
  if (!have.has(a) || !have.has(b)) return { ok: false, why: 'unmarked' };
  if (!DTYPES.includes(kind)) return { ok: false, why: 'kind' };
  if (cs.links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))) return { ok: false, why: 'linked' };
  const wl = arr(c.wrongLinks).find((w) => arr(w.spans).includes(a) && arr(w.spans).includes(b));
  const fits = (c.deductions || []).filter((d) => pool(d).includes(a) && pool(d).includes(b));
  if (!fits.length) return { ok: false, why: 'unsupported', quill: wl?.quill || 'What do these two really say?' };
  const right = fits.filter((d) => kindsOf(d).includes(kind));
  if (!right.length) return { ok: false, why: 'kind-wrong', quill: wl?.quill || 'These two do belong together. But is that what they show? Read them again.' };
  const d = right.find((x) => !cs.proved.includes(x.id) && P.needed.includes(x.id)) || right.find((x) => !cs.proved.includes(x.id)) || right[0];
  return { ok: true, d: d.id };
}
export const boardCleared = (c, cs) => prepare(c).needed.every((id) => cs.proved.includes(id));
/* what opens chapter 4: the deductions the board's own chapter can finish */
export const boardReady = (c, cs) => prepare(c).needed3.every((id) => cs.proved.includes(id));

/* ---------- the timeline ---------- */
/* Two events the script "joins" (joinWith: two documents meeting at one time-word) may hang in either order. */
export function timelineCheck(c, line) {
  const P = prepare(c), want = P.childEvents.map((e) => e.id);
  if (line.length !== want.length || line.some((x) => x == null)) return { complete: false, ok: false };
  const ord = (e) => { const j = e.joinWith && P.events.find((x) => x.id === e.joinWith); return j ? Math.min(j.order, e.order) : e.order; };
  for (let i = 1; i < line.length; i++) {
    const a = P.events.find((e) => e.id === line[i - 1]), b = P.events.find((e) => e.id === line[i]);
    if (ord(a) > ord(b)) return { complete: true, ok: false, pair: [a.id, b.id] };
  }
  return { complete: true, ok: true };
}
/* Journey 2's feast (the explanations game) sits in chapter 4: every oddity needs Loki's reply that fits. */
export const feastDone = (c, cs) => !c.timeline?.feast || (c.timeline.feast.items || []).every((_, i) => (cs.timeline.feast || {})[i] === true);
export const timelineDone = (c, cs) => !!cs.timeline.done && feastDone(c, cs);

/* ---------- the accusation ---------- */
/* The minimal evidence as slots, each with the ids that satisfy it (format 1.1/1.2 `evidenceRule` in its three
   shapes: per-slot alternatives, evidence groups, and count/required/oneOf). */
export function slotsOf(c) {
  const a = c.accusation || {}, r = a.evidenceRule, P = prepare(c), min = arr(a.minimalEvidence);
  if (r && typeof r === 'object' && (r.required || r.oneOf || r.count)) {
    const req = arr(r.required), groups = arr(r.oneOf).map(arr), count = r.count || min.length, slots = req.map((x) => [x]);
    for (const g of groups) if (!g.every((x) => req.includes(x))) slots.push(g.filter((x) => !req.includes(x)));
    const pool2 = uniq([...min, ...req, ...groups.flat(), ...arr(a.acceptableEvidence).filter((x) => P.deds.has(x))]);
    while (slots.length < count) slots.push(pool2);
    return { slots, kind: 'rule' };
  }
  if (r && typeof r === 'object' && r.evidenceGroups) return { slots: min.map((x) => uniq([x, ...arr(r.evidenceGroups[x])])), kind: 'groups' };
  if (r && typeof r === 'object') return { slots: min.map((x) => uniq([x, ...arr(r[x])])), kind: 'alternatives' };
  // default: each deduction in the minimal set must be pinned itself; a clue slot may be filled by an accepted clue
  const extra = uniq([...arr(a.acceptableEvidence), ...arr(a.evidenceSpans)].filter((x) => !P.deds.has(x)));
  return { slots: min.map((x) => (P.deds.has(x) ? [x] : uniq([x, ...extra]))), kind: 'default' };
}
/* Every id that is part of the minimal proof: the slots' own ids and, for a deduction, the clues that prove it. */
export function minimalItems(c) {
  const P = prepare(c), out = new Set();
  for (const id of arr(c.accusation?.minimalEvidence)) { out.add(id); const d = P.deds.get(id); if (d) for (const S of proofSets(d) || [pool(d)]) S.forEach((s) => out.add(s)); }
  return out;
}
function fillSlots(slots, valid) {
  // a slot takes one pinned id; an id fills one slot (small bipartite matching: slots ≤ 6)
  const used = new Map(), match = (si, seen) => { for (const id of slots[si]) { if (!valid.has(id) || seen.has(id)) continue; seen.add(id); if (!used.has(id) || match(used.get(id), seen)) { used.set(id, si); return true; } } return false; };
  let n = 0; const filled = [];
  for (let i = 0; i < slots.length; i++) if (match(i, new Set())) n++;
  for (const [, si] of used) filled.push(si);
  return { n, filled: new Set(filled) };
}
const heldIds = (c, cs) => new Set([...cs.proved, ...markedSpans(cs)]);
/* Judge an accusation. Pure. → { verdict: 'solved' | 'weak' | 'wrong' | 'theory' | 'place' | 'unknown', say, returnTo, score } */
export function judgeAccusation(c, cs, { culprit, evidence = [], place = null } = {}) {
  const P = prepare(c), a = c.accusation || {}, quill = (text) => ({ who: 'QUILL', text });
  const pts = (ids) => { const sp = arr(ids).map((x) => P.deds.get(x) ? (proofSets(P.deds.get(x)) || [pool(P.deds.get(x))])[0][0] : x).filter((x) => P.spans.has(x)); return sp.length ? { doc: P.spans.get(sp[0]).doc, spans: sp } : null; };
  const scoreOf = (sat) => { const need = slotsOf(c).slots.length + (a.place ? 1 : 0); return need ? sat / need : 0; };
  if (!culprit) return { verdict: 'unknown', say: quill('Who? Choose someone first.'), score: 0 };
  if (!P.castIds.has(culprit) || !accusable(c, cs).includes(culprit)) {
    const t = a.wrongTheory && a.wrongTheory[culprit];
    if (t) return { verdict: 'theory', say: quill(typeof t === 'string' ? t : t.quill || t.text), returnTo: pts(t.points || []), score: 0 };
    return { verdict: 'unknown', say: quill('Who is that? Choose someone from the board.'), score: 0 };
  }
  const { slots } = slotsOf(c), held = heldIds(c, cs), pinned = uniq(arr(evidence)).filter((x) => held.has(x));
  const valid = new Set(pinned), { n: sat, filled } = fillSlots(slots, valid);
  const placeOk = !a.place || (place != null && place === a.place.answer);
  if (culprit !== a.culprit) {
    const line = (a.wrongSuspect || {})[culprit], rh = arr(c.redHerrings).find((r) => r.suspect === culprit);
    const back = pts((a.wrongSuspectPoints || {})[culprit] || rh?.clearedBy || []);
    return { verdict: 'wrong', say: quill(line || 'Read again: what clears them?'), followUp: a.wrongSuspectFollowUp || null, returnTo: back, score: 0 };
  }
  if (!placeOk) {
    const w = a.place.wrong && place != null ? a.place.wrong[place] : null;
    return { verdict: 'place', say: quill(w || `Right person. Now: ${a.place.prompt || 'where?'}`), score: scoreOf(sat), returnTo: null };
  }
  if (sat < slots.length) {
    const firstGap = slots.findIndex((_, i) => !filled.has(i)), gap = slots[firstGap] || [], weak = arr(evidence).filter((x) => !slots.some((s) => s.includes(x)) || !held.has(x));
    const half = sat >= Math.ceil(slots.length / 2) && a.partialEvidence;
    return { verdict: 'weak', say: quill(half ? (typeof a.partialEvidence === 'string' ? a.partialEvidence : a.partialEvidence.quill || a.weakEvidence) : a.weakEvidence), returnTo: pts(gap), weakPins: weak, score: scoreOf(sat + (a.place ? 1 : 0)) };
  }
  return { verdict: 'solved', say: null, score: 1 };
}
/* Case score (§2.1.5): valid evidence placed ÷ evidence needed, on the FIRST accusation (a wrong suspect scores 0). */
export const caseScore = (c, cs) => (cs.accusations.length ? cs.accusations[0].score : null);
/* The owner's rule (§1.4): ≥ 80% up one, under 50% down one (never below 1, never above 5), else keep. */
export function nextLevel(level, pct) {
  const l = Math.max(1, Math.min(5, Math.round(level) || 1));
  if (pct == null || Number.isNaN(pct)) return l;
  if (pct >= 0.8) return Math.min(5, l + 1);
  if (pct < 0.5) return Math.max(1, l - 1);
  return l;
}

/* ---------- chapters ---------- */
export function canEnter(c, cs, n) {
  if (!(n >= 1 && n <= CLOSED)) return { ok: false, why: 'No such chapter.' };
  if (n <= cs.reached) return { ok: true };
  if (n === CLOSED) return { ok: false, why: 'Solve it first.' };
  if (n === 4 && !boardReady(c, cs)) return { ok: false, why: 'The board is not finished yet. Which deductions are still missing?' };
  if (n === 5 && !timelineDone(c, cs)) return { ok: false, why: c.timeline?.feast && cs.timeline.done ? 'The feast is not over yet.' : 'Put the timeline in order first.' };
  if (n === 5 && !boardCleared(c, cs)) return { ok: false, why: 'One deduction is still waiting on the board. A new document may finish it.' };
  if (n > cs.reached + 1) return { ok: false, why: 'One chapter at a time.' };
  return { ok: true };
}

/* ---------- Training Desk (§2.1.8a) ---------- */
const TIERS = { easier: -1, at: 0, harder: 1 };
/* The tier whose level is nearest the child's own English level (ties go to the easier one). */
export function deskTier(c, englishLevel) {
  const tiers = uniq((c.exercises || []).map((x) => x.tier)).filter((t) => t in TIERS);
  if (!tiers.length) return null;
  const lv = Math.max(1, Math.min(5, englishLevel || c.level)), lvOf = (t) => Math.max(1, Math.min(5, c.level + TIERS[t]));
  return tiers.sort((a, b) => Math.abs(lvOf(a) - lv) - Math.abs(lvOf(b) - lv) || TIERS[a] - TIERS[b])[0];
}
/* What the desk offers now: the child's tier, items for the chapters already finished (an item "after chapter n"
   once the child has gone past n; anything that points at the culprit is chapter 5, so after the solve). Never
   blocking: nothing in canEnter() reads the desk. */
export function deskItems(c, cs, englishLevel) {
  const tier = deskTier(c, englishLevel);
  return (c.exercises || []).filter((x) => x.tier === tier && cs.reached > x.chapter).map((x) => ({ ...x, done: !!cs.desk[x.id]?.right }));
}
const sameAnswer = (x, given) => (Array.isArray(x.answer) ? Array.isArray(given) && given.length === x.answer.length && given.every((g, i) => String(g).trim() === String(x.answer[i]).trim()) : String(given ?? '').trim().toLowerCase() === String(x.answer).trim().toLowerCase());

/* ---------- mastery credit (later day only, positive evidence only) ---------- */
export function credit(k, objective, right, n, now = Date.now()) {
  if (!k || !objective || !n || right / n < 0.8) return null;
  k.mastery ||= {};
  const before = stepOf(k, objective); if (before === 0) return 'held';   // not taught yet: the stop teaches; a case only proves
  return spacedCheck(k, objective, right, n, now);
}
function masteryEvents(outs) { return outs.filter(([, o]) => o === 'learned' || o === 'mastered').map(([id, o]) => ({ ev: 'mastery', what: `${o === 'mastered' ? 'Mastered' : 'Learned'}: ${id}`, objective: id })); }

/* ---------- the reducer ---------- */
export function step(c, cs0, action, ctx = {}) {
  const P = prepare(c), cs = clone(cs0), now = ctx.now ?? Date.now(), events = [];
  const out = (o = {}) => ({ state: cs, ok: true, events, ...o });
  const no = (why, o = {}) => ({ state: cs0, ok: false, events: [], say: why ? { who: 'QUILL', text: why } : null, ...o });
  const a = action || {};
  const payChapter = (n) => { if (!cs.paid.stop.includes(n)) { cs.paid.stop.push(n); events.push({ ev: 'stop', what: `${c.title}: ${CHAPTERS[n - 1].title}` }); } };

  switch (a.type) {
    case 'open': {
      if (!docOpen(c, cs, a.doc)) return no('That document is not on the desk yet.');
      if (!cs.read.includes(a.doc)) cs.read.push(a.doc);
      return out({ doc: P.docs.get(a.doc) });
    }
    case 'mark': {
      let span = null, doc = a.doc, text = '', id;
      if (a.span) { const s = P.spans.get(a.span); if (!s) return no(); span = s.id; doc = s.doc; text = plain(s.text); }
      else { const r = resolveMark(c, a.doc, a.from ?? 0, a.to ?? 0); if (!r) return no(); span = r.span; text = r.text; if (!span) id = `n:${a.doc}:${r.from}-${r.to}`; }
      if (!docOpen(c, cs, doc)) return no('That document is not on the desk yet.');
      if (cs.chapter === CLOSED) return no();
      id ||= span;
      if (cs.marks.some((m) => m.id === id)) return out({ mark: id, already: true });
      cs.marks.push({ id, doc, span, text });
      if (!cs.read.includes(doc)) cs.read.push(doc);
      return out({ mark: id, clue: !!span });
    }
    case 'unmark': {
      if (!cs.marks.some((m) => m.id === a.id)) return no();
      cs.marks = cs.marks.filter((m) => m.id !== a.id);
      cs.links = cs.links.filter((l) => l.a !== a.id && l.b !== a.id);
      cs.proved = cs.proved.filter((d) => isProved(P.deds.get(d), cs.links) || cs.reached > 3);   // a cleared board stays cleared
      return out();
    }
    case 'ask': {
      const q = P.qById.get(a.q); if (!q) return no();
      if (!questionOpen(c, cs, q)) return no(cs.chapter < 2 ? 'Interviews come next. Finish reading the scene first.' : 'Not yet. Something has to happen first.');
      if (!cs.asked.includes(q.id)) cs.asked.push(q.id);
      return out({ doc: P.docs.get(q.answerDoc), expression: q.expression || null, then: q.expressionThen || q.thenExpression || null });
    }
    case 'link': {
      if (cs.chapter !== 3 && cs.chapter !== 4) return no('Links are made on the board, in chapter 3.');
      const v = judgeLink(c, cs, a.a, a.b, a.kind);
      if (!v.ok) {
        if (v.why === 'unsupported' || v.why === 'kind-wrong') {
          let hit = false;
          for (const d of c.deductions || []) if (touches(d, a.a, a.b)) { cs.misses[d.id] = (cs.misses[d.id] || 0) + 1; hit = true; }
          if (!hit) cs.misses.board = (cs.misses.board || 0) + 1;
          return { state: cs, ok: false, events: [], say: { who: 'QUILL', text: v.quill }, why: v.why };
        }
        return no(v.why === 'unmarked' ? 'Mark both clues in your notebook first.' : v.why === 'linked' ? 'Those two are already linked.' : v.why === 'kind' ? 'What do they show? Choose one.' : null, { why: v.why });
      }
      cs.links.push({ a: a.a, b: a.b, kind: a.kind, d: v.d });
      const d = P.deds.get(v.d), fresh = !cs.proved.includes(d.id) && isProved(d, cs.links);
      if (fresh) cs.proved.push(d.id);
      const r = out({ link: v.d, proved: fresh ? d.id : null, say: fresh ? { who: 'QUILL', text: d.statement } : null, label: fresh ? d.label || null : null });
      if (fresh && boardCleared(c, cs) && !cs.paid.stop.includes(3)) {
        // the board clears: each deduction proved on its first try pays answer 1 (≤ 10 a case), and the chapter pays stop 5
        for (const id of cs.proved) { if (cs.paid.answer >= ANSWER_CAP) break; if ((cs.misses[id] || 0) === 0 && !(cs.paid.deds || []).includes(id)) { cs.paid.answer++; (cs.paid.deds ||= []).push(id); events.push({ ev: 'answer', what: `${c.title}: ${P.deds.get(id).label || P.deds.get(id).id}` }); } }
        if (boardMisses(cs) <= BOARD_MISSES_PER_DEDUCTION * P.needed.length) payChapter(3);
        r.cleared = 3;
      }
      return r;
    }
    case 'unlink': {
      if ((cs.chapter !== 3 && cs.chapter !== 4) || !(a.i >= 0 && a.i < cs.links.length)) return no();
      cs.links.splice(a.i, 1);
      if (cs.reached <= 3) cs.proved = cs.proved.filter((d) => isProved(P.deds.get(d), cs.links));
      return out();
    }
    case 'chapter': {
      const g = canEnter(c, cs, a.n); if (!g.ok) return no(g.why);
      cs.chapter = a.n; cs.reached = Math.max(cs.reached, a.n);
      if (a.n === 4) { for (const e of P.events) if (e.placedByChild === false) { /* pegged for the child */ } }
      return out({ chapter: a.n });
    }
    case 'place': {
      if (cs.chapter !== 4 || cs.timeline.done) return no();
      const e = P.childEvents.find((x) => x.id === a.event); if (!e) return no();
      const line = cs.timeline.line.slice(); const n = P.childEvents.length;
      while (line.length < n) line.push(null);
      const was = line.indexOf(e.id); if (was >= 0) line[was] = null;
      const at = a.at != null ? a.at : line.indexOf(null);
      if (!(at >= 0 && at < n)) return no();
      if (line[at] != null && was >= 0) line[was] = line[at];
      line[at] = e.id;
      cs.timeline.line = line;
      const ck = timelineCheck(c, line);
      if (!ck.complete) return out();
      cs.timeline.checks++;
      if (!ck.ok) { const sh = arr(c.timeline?.shake)[0]; return out({ shake: ck.pair, say: { who: 'QUILL', text: (typeof sh === 'string' ? sh : sh?.quill || sh?.text) || 'Which word says when? Read the two that disagree.' } }); }
      cs.timeline.done = true;
      if (!feastDone(c, cs)) return out({ say: { who: 'QUILL', text: 'The line holds. Now, the feast.' } });
      if (cs.timeline.checks <= TIMELINE_CHECKS) payChapter(4);
      return out({ cleared: 4, say: { who: 'QUILL', text: 'The line holds.' } });
    }
    case 'feast': {
      const F = c.timeline?.feast; if (cs.chapter !== 4 || !F) return no();
      const item = F.items[a.i]; if (!item) return no();
      const f = (cs.timeline.feast ||= {}), tries = (cs.timeline.feastTries ||= {});
      if (f[a.i] === true) return out({ right: true, already: true });
      tries[a.i] = (tries[a.i] || 0) + 1;
      const right = String(a.answer).trim() === String(item.answer).trim();
      if (!right) return out({ right: false, hold: true, explain: 'Does that fit everything Thrym knows? Read his list again.' });
      f[a.i] = true;
      const r = out({ right: true, explain: item.why, lesson: F.lesson || null });
      if (cs.timeline.done && feastDone(c, cs) && cs.timeline.checks <= TIMELINE_CHECKS && !cs.paid.stop.includes(4)) { payChapter(4); r.cleared = 4; }
      return r;
    }
    case 'unplace': {
      if (cs.chapter !== 4 || cs.timeline.done) return no();
      cs.timeline.line = cs.timeline.line.map((x) => (x === a.event ? null : x));
      return out();
    }
    case 'accuse': {
      if (cs.chapter !== 5 || cs.solved) return no(cs.solved ? null : 'The accusation is in chapter 5.');
      const v = judgeAccusation(c, cs, a);
      if (v.verdict === 'unknown') return no(v.say?.text);
      const first = cs.accusations.length === 0;
      cs.accusations.push({ culprit: a.culprit, evidence: arr(a.evidence), place: a.place ?? null, verdict: v.verdict, score: v.score, at: now });
      if (first) cs.firstScore = v.score;
      if (v.verdict !== 'solved') return out({ verdict: v.verdict, say: v.say, returnTo: v.returnTo || null, weakPins: v.weakPins || [], followUp: v.followUp || null });
      cs.solved = true; cs.solvedAt = now; cs.score = cs.firstScore; cs.chapter = CLOSED; cs.reached = CLOSED;
      payChapter(5);
      if (first && !cs.paid.contest && !cs.everSolved) { cs.paid.contest = true; events.push({ ev: 'contest', what: `${c.title}: solved with full evidence` }); }
      // later-day skill evidence: deductions proved first try, by skill
      if (ctx.k) {
        const by = {};
        for (const d of c.deductions || []) if (!d.optional && d.skill) { const s = (by[d.skill] ||= [0, 0]); s[1]++; if (cs.proved.includes(d.id) && !(cs.misses[d.id] || 0)) s[0]++; }
        const outs = Object.entries(by).map(([sk, [r, n]]) => [SKILL_OBJECTIVE[sk], credit(ctx.k, SKILL_OBJECTIVE[sk], r, n, now)]).filter(([o]) => o);
        events.push(...masteryEvents(outs));
      }
      return out({ verdict: 'solved', reveal: c.reveal || [], score: cs.score, firstTry: first, level: ctx.level != null ? nextLevel(ctx.level, cs.score) : null });
    }
    case 'hint': {
      const h = hintFor(c, cs); if (!h) return no('Nothing to hint at here.');
      if (cs.ink <= 0) return no('No ink left for hints. The Training Desk pays ink for right answers.');
      const lv = cs.hints[h.target] || 0; if (lv >= h.lines.length) return no('That is all I can say. The rest is reading.');
      cs.hints[h.target] = lv + 1; cs.ink--; cs.inkSpent++;
      return out({ say: { who: 'QUILL', text: h.lines[lv] }, hint: { target: h.target, level: lv + 1, doc: h.doc, span: lv + 1 >= h.lines.length ? h.span : null } });
    }
    case 'knack': {
      if (cs.chapter === 5 || cs.chapter === CLOSED) return no('The Knack is greyed out here. You accuse alone.');
      const pid = ctx.persona || cs.persona; if (!pid) return no('Choose a detective first.');
      const allowed = 1 + (cs.chapter === 3 && ctx.sergeant ? 1 : 0);
      if ((cs.knack[cs.chapter] || 0) >= allowed) return no('Your Knack works once in each chapter.');
      const k = ctx.knackFor ? ctx.knackFor(c, pid) : null;
      if (!k || k.chapter !== cs.chapter) return no(k ? `Your Knack helps most in chapter ${k.chapter}.` : 'No Knack here.');
      cs.knack[cs.chapter] = (cs.knack[cs.chapter] || 0) + 1;
      return out({ knack: k });   // UI only: candidates and a line; nothing here touches score, links or pay
    }
    case 'desk': {
      const x = (c.exercises || []).find((e) => e.id === a.x); if (!x) return no();
      const offer = deskItems(c, cs, ctx.englishLevel); if (!offer.some((e) => e.id === x.id)) return no('Not yet.');
      const r = (cs.desk[x.id] ||= { tries: 0, right: false, first: null, at: now });
      if (r.right) return out({ right: true, already: true });
      r.tries++; const right = sameAnswer(x, a.answer);
      if (r.first == null) r.first = right;
      if (!right) return out({ right: false, hold: true, explain: x.explain, answer: x.answer });
      r.right = true; r.at = now; cs.ink++;
      const paidBefore = (cs.paidDesk || {})[x.id]?.first;
      if (r.first && cs.paid.desk < DESK_CAP && !paidBefore && !(cs.paid.deskIds || []).includes(x.id)) { cs.paid.desk++; (cs.paid.deskIds ||= []).push(x.id); events.push({ ev: 'answer', what: `${c.title}: Training Desk` }); }
      if (r.first && ctx.k && x.objective) events.push(...masteryEvents([[x.objective, credit(ctx.k, x.objective, 1, 1, now)]]));
      return out({ right: true, explain: x.explain, ink: cs.ink });
    }
    case 'origin': {
      const card = ctx.card; if (!cs.solved || !card) return no();
      const r = (cs.hoard ||= { card: card.id, tries: 0, right: false, first: null });
      if (r.right) return out({ right: true, already: true });
      r.tries++; const right = String(a.answer).trim() === String(card.question.answer).trim();
      if (r.first == null) r.first = right;
      if (!right) return out({ right: false, hold: true, explain: card.question.explain || card.story });
      r.right = true; cs.ink++;
      if (r.first && cs.paid.desk < DESK_CAP && !(cs.paid.cards || []).includes(card.id) && !cs.everSolved) { cs.paid.desk++; (cs.paid.cards ||= []).push(card.id); events.push({ ev: 'answer', what: `Word Hoard: ${card.word}` }); }
      return out({ right: true, explain: card.question.explain || null });
    }
    default: return no();
  }
}

/* Quill's graded hint for where the child is: the paragraph (the document), then the sentence, then the phrase
   (§2.1.3). The scripts' own graded hints come first where a deduction has them. */
export function hintFor(c, cs) {
  const P = prepare(c), sentenceOf = (span) => { const s = P.spans.get(span); const body = plain(P.docs.get(s.doc).body); const line = body.split('\n').find((l) => l.includes(plain(s.text))) || plain(s.text); return line.trim(); };
  const ladder = (target, span, own) => { const s = P.spans.get(span); if (!s) return null; const doc = P.docs.get(s.doc);
    return { target, span, doc: s.doc, lines: arr(own).length ? arr(own) : [`Read "${doc.title}" again.`, `Look at this line: "${sentenceOf(span)}"`, `These words matter: "${plain(s.text)}"`] }; };
  if (cs.chapter <= 3) {
    const marked = markedSpans(cs);
    for (const id of P.needed) {
      if (cs.proved.includes(id)) continue;
      const d = P.deds.get(id), S = (proofSets(d) || [pool(d).slice(0, 2)]).find((s) => s.every((x) => docOpen(c, cs, P.spans.get(x)?.doc))) || (proofSets(d) || [pool(d).slice(0, 2)])[0];
      const need = S.find((x) => !marked.has(x)) || S[0];
      if (cs.chapter === 3 || !arr(d.hints).length) return ladder(id, need, cs.chapter === 3 ? d.hints : null);
      return ladder(id, need, null);
    }
    return null;
  }
  if (cs.chapter === 4 && !cs.timeline.done) {
    const ck = timelineCheck(c, cs.timeline.line), e = ck.pair ? P.events.find((x) => x.id === ck.pair[0]) : P.childEvents[0];
    const span = arr(e?.spans)[0]; return span ? ladder('timeline:' + e.id, span, null) : null;
  }
  if (cs.chapter === 5 && !cs.solved) {
    const { slots } = slotsOf(c), held = heldIds(c, cs), gap = slots.find((s) => !s.some((x) => held.has(x))) || slots[0];
    const id = gap[0], d = P.deds.get(id), span = d ? (proofSets(d) || [pool(d)])[0][0] : id;
    return ladder('accuse:' + id, span, null);
  }
  return null;
}

/* The perfect play, from the data alone: the moves that solve the case. Used by the solver bot (test/detective.mjs)
   and by tester mode's "show me". It reads only what the child could read. */
export function solution(c) {
  const P = prepare(c), moves = [], marks = new Set();
  const markAll = (ids) => { for (const s of ids) if (P.spans.has(s) && !marks.has(s)) { marks.add(s); moves.push({ type: 'mark', span: s }); } };
  const links = [];
  for (const id of P.needed) {
    const d = P.deds.get(id), S = (proofSets(d) || [pool(d).slice(0, 2)])[0];
    markAll(S);
    for (let i = 1; i < S.length; i++) links.push({ type: 'link', a: S[0], b: S[i], kind: d.type });
  }
  const a = c.accusation || {}, { slots } = slotsOf(c), ev = [];
  for (const s of slots) { const id = s.find((x) => !ev.includes(x)); ev.push(id); if (!P.deds.has(id)) markAll([id]); }
  return { marks: [...marks], links, timeline: P.childEvents.map((e) => e.id), accusation: { type: 'accuse', culprit: a.culprit, evidence: ev, place: a.place ? a.place.answer : null } };
}
