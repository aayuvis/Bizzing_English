/* mastery.js — the ONLY module that may say a child has learned something (Finance's rule).

   Per objective (one per stop), the steps are:
     0 new → 1 taught (the stop's check passed) → 2 learned (a check of ≥ 8/10 on a LATER day
     than the teaching — India's ledger rule: a check on the same day is practice, not learning)
     → 3 mastered (another ≥ 8/10 check at least 7 days after it was learned).
   A miss on a spaced check (< 6/10) drops ONE step and is recorded as a lapse — never hidden,
   never a reset to zero. Coins for mastery fire here, on spaced evidence only — never on a level-up
   (Bee paid for that once). */

import { today } from './model.js';

export const STEP = ['new', 'taught', 'learned', 'mastered'];
const rec = (k, id) => (k.mastery[id] ||= { step: 0, taughtOn: null, learnedOn: null, checks: [], lapses: 0 });
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

/* The stop's own check, passed: the objective is taught (today). `judged`: writing pieces and speeches
   cannot be marked by a program, so they never fall due for a machine check — only a grown-up's rubric,
   on a later day, can say they are learned (judge() below). */
export function taught(k, id, t = Date.now(), { judged = false } = {}) {
  const r = rec(k, id);
  if (judged) r.judged = true;
  if (r.step < 1) { r.step = 1; r.taughtOn = today(t); }
  return r;
}

/* A grown-up's rubric (1–4) on a judged objective: 3 or more on a LATER day than the teaching makes it
   learned; another 3+ a week after that, mastered; a 1 drops one step. The screen says a grown-up judged it. */
export function judge(k, id, score, t = Date.now()) {
  const r = rec(k, id), d = today(t); r.judged = true;
  r.checks.push({ d, right: score, n: 4, by: 'grown-up' }); if (r.checks.length > 20) r.checks.splice(0, r.checks.length - 20);
  if (r.step === 0) return 'held';
  if (score <= 1) { r.step = Math.max(1, r.step - 1); r.lapses++; return 'lapse'; }
  if (score < 3) return 'held';
  if (r.step === 1) { if (r.taughtOn && d > r.taughtOn) { r.step = 2; r.learnedOn = d; return 'learned'; } return 'practice'; }
  if (r.step === 2 && r.learnedOn && daysBetween(r.learnedOn, d) >= 7) { r.step = 3; return 'mastered'; }
  return 'held';
}

/* A spaced check (Practice → "Check what you know"): right of n. Returns what changed:
   'learned' | 'mastered' | 'lapse' | 'practice' (same day — counted, not promoted) | 'held'. */
export function spacedCheck(k, id, right, n, t = Date.now()) {
  const r = rec(k, id), d = today(t), score = right / n;
  r.checks.push({ d, right, n });
  if (r.checks.length > 20) r.checks.splice(0, r.checks.length - 20);
  if (r.step === 0) return 'held';
  if (score < 0.6) { r.step = Math.max(1, r.step - 1); r.lapses++; return 'lapse'; }
  if (score < 0.8) return 'held';
  if (r.step === 1) { if (r.taughtOn && d > r.taughtOn) { r.step = 2; r.learnedOn = d; return 'learned'; } return 'practice'; }
  if (r.step === 2) { if (r.learnedOn && daysBetween(r.learnedOn, d) >= 7) { r.step = 3; return 'mastered'; } return 'held'; }
  return 'held';
}

/* What is due for a spaced check today, oldest first: taught before today, or learned 7+ days ago. */
export function due(k, t = Date.now()) {
  const d = today(t);
  return Object.entries(k.mastery)
    .filter(([, r]) => !r.judged)
    .filter(([, r]) => (r.step === 1 && r.taughtOn && r.taughtOn < d) || (r.step === 2 && r.learnedOn && daysBetween(r.learnedOn, d) >= 7))
    .sort((a, b) => (a[1].learnedOn || a[1].taughtOn).localeCompare(b[1].learnedOn || b[1].taughtOn))
    .map(([id]) => id);
}

export const stepOf = (k, id) => k.mastery[id]?.step || 0;
export const learnedCount = (k) => Object.values(k.mastery).filter((r) => r.step >= 2).length;
export const masteredCount = (k) => Object.values(k.mastery).filter((r) => r.step >= 3).length;
