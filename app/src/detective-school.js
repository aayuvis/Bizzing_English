/* detective-school.js — Detective School (handover C §2.1.6): the agency's training room, three quick drills, each a
   mode with its own level chip. They are where a child practises the moves before a case. Pure functions; the boards
   live in views/detective.js. games.js is reused, never edited: Plot Line's and Who Said It?'s mechanics move in here.

     Timeline       — Plot Line's mechanic (games.plotRound/plotStep): real Library stories, scene openings shuffled;
                      plus each SOLVED case's own "then what?" drill. Pay: answer 1 per story fully ordered (≤ 10).
     Who Wrote This? — Who Said It?'s mechanic (games.whoRound/quizStep): attribute a line by evidence in the language;
                      a miss shows a second line by the same author to compare (`compare`); plus the cases' who-wrote
                      drills. Pay: answer 1 per right first try, in a round of 50% or more (≤ 10).
     Clue Spotter   — the only timed drill in Inkwell (SPOTTER_MS): a short document from a case the child has SOLVED
                      (never a spoiler), mark the clue words; scored on clues found minus phrases marked that are not.

   API
     caseDrill(c)                                 → { kind, title, intro, items: [{ kind: 'choice'|'order'|'model', … }] }
     timelineRound(src, seed, level, o)           src = { passages, works, chapters }; o = games.js options (mem, now)
     whoRound(src, seed, level, o)                src = { lines, works }
     spotterRound(cases, solvedIds, seed, level, n)
     spotterJudge(item, markedSpans)              → { found, missed, extra, score, max, perfect }
     drillPay(results)                            → [{ ev: 'answer', what }] for right-first-try items, ≤ 10, round ≥ 50%
     nextLevel (the owner's rule, shared with cases) */

import { plotRound, whoRound as gamesWhoRound, MAX_LEVEL } from './games.js';
import { rng, shuffle, hash } from './rand.js';
import { prepare, tokens, plain, minimalItems, proofSets, nextLevel } from './detective.js';

export const SPOTTER_MS = 60000;
export const DRILL_CAP = 10;
export { nextLevel };
const clamp = (l) => Math.max(1, Math.min(MAX_LEVEL, Math.round(l) || 1));

/* A case's own drill, normalised: an item with options is a choice; a timeline drill whose answers are positions is an
   order; anything else (a model answer, a comma to place) is shown and self-checked, never scored. */
export function caseDrill(c) {
  const d = c?.drill; if (!d) return null;
  const items = d.items || [];
  if (d.kind === 'timeline' && items.length && items.every((x) => /^\d+$/.test(String(x.answer)))) {
    const order = items.slice().sort((a, b) => +a.answer - +b.answer).map((x) => x.prompt);
    return { kind: 'timeline', title: d.title, intro: d.instructions || d.intro || null, feedback: d.feedback || null, items: [{ kind: 'order', cards: shuffle(rng('drill:' + c.id), order), answer: order }] };
  }
  return { kind: d.kind, title: d.title, intro: d.instructions || d.intro || null, feedback: d.feedback || null,
    items: items.map((x) => (Array.isArray(x.options) && x.options.length >= 2 && x.options.includes(x.answer) ? { kind: 'choice', prompt: x.prompt, options: x.options, answer: x.answer, explain: x.explain || x.quill || x.tell || x.proof || null } : { kind: 'model', prompt: x.prompt, answer: x.answer, note: x.note || x.proof || null })) };
}

/* ---------- Timeline (Plot Line's mechanic) ---------- */
export function timelineRound(src, seed, level = 1, o = {}) {
  const L = clamp(level);
  return plotRound(src.passages || [], seed, L, o.n || 3, src.works || [], { ...o, chapters: src.chapters || [] });
}

/* ---------- Who Wrote This? (Who Said It?'s mechanic) ---------- */
export function whoRound(src, seed, level = 1, o = {}) {
  const lines = src.lines || [], works = src.works || [];
  return gamesWhoRound(lines, works, seed, clamp(level), o.n || 5, o).map((q) => {
    const same = lines.filter((l) => l.work === q.workId && l.text !== q.text);
    const compare = same.length ? same[hash(String(seed) + q.key) % same.length].text : null;   // the miss card's second line
    return { ...q, compare };
  });
}

/* ---------- Clue Spotter ---------- */
/* From the cases the child has solved: a scene document with two to five clue spans that the case's proofs use. */
export function spotterRound(cases, solvedIds = [], seed = 0, level = 1, n = 5) {
  const L = clamp(level), pool = [];
  for (const c of cases || []) {
    if (!solvedIds.includes(c.id)) continue;
    const P = prepare(c), proof = new Set([...minimalItems(c), ...(c.deductions || []).flatMap((d) => (proofSets(d) || [d.spans]).flat())]);
    for (const d of c.docs || []) {
      if (d.chapter === 'arc' || d.afterSolve) continue;
      const T = tokens(c, d.id), clues = [...new Set(T.filter((t) => t.span && proof.has(t.span)).map((t) => t.span))];
      if (clues.length < 1 || clues.length > 5 || T.length > 40 + L * 25) continue;
      pool.push({ id: `${c.id}:${d.id}`, case: c.id, doc: d.id, title: d.title, level: c.level, words: T.map((t) => ({ i: t.i, t: t.t, line: t.line })), clues, spans: Object.fromEntries(clues.map((s) => [s, T.filter((t) => t.span === s).map((t) => t.i)])) });
    }
    // the case's own clue-spotter drill (choices) joins the pool as quick items
  }
  const near = pool.filter((p) => Math.abs(p.level - L) <= 1);
  return shuffle(rng('spot:' + seed), near.length >= n ? near : pool).slice(0, n);
}
/* Marked word indexes (or span ids) against the clues: found − extra, never below 0. */
export function spotterJudge(item, marked = []) {
  const ids = new Set(), words = new Set(marked.filter((m) => typeof m === 'number'));
  for (const m of marked) if (typeof m === 'string' && item.clues.includes(m)) ids.add(m);
  for (const [s, idx] of Object.entries(item.spans)) if (idx.filter((i) => words.has(i)).length >= Math.ceil(idx.length / 2)) ids.add(s);
  const clueWords = new Set(Object.values(item.spans).flat());
  const extraWords = [...words].filter((i) => !clueWords.has(i)).length, extra = Math.ceil(extraWords / 3) + marked.filter((m) => typeof m === 'string' && !item.clues.includes(m)).length;
  const found = [...ids], missed = item.clues.filter((s) => !ids.has(s)), score = Math.max(0, found.length - extra);
  return { found, missed, extra, score, max: item.clues.length, perfect: !missed.length && !extra };
}

/* ---------- pay ---------- */
/* results: [{ ok, first }] per item. Learning only: a right first try pays answer 1, in a round of 50% or more, ≤ 10. */
export function drillPay(results = [], what = 'Detective School') {
  const right = results.filter((r) => r.ok).length;
  if (!results.length || right / results.length < 0.5) return [];
  return results.filter((r) => r.ok && r.first !== false).slice(0, DRILL_CAP).map(() => ({ ev: 'answer', what }));
}
export const drillText = (s) => plain(s);
