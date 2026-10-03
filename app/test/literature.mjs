// The Literature strand's rules, held by a test (docs/00-spec.md §3, §7, §8; CLAUDE.md hard rules 1, 2, 6):
// stops for levels 1–9 with unique ids, ≥ 12 fair items each (one right answer, three distinct wrong
// ones, the right answer's words not in the question or its quote, no "longest is right" leak);
// every quote, every line option and every Figure Hunt text found verbatim in a held, cleared text;
// no passage that waits on a reviewer; the Figure Hunt bank balanced and strict; the Library ≥ 100 works.
//
//   node app/test/literature.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIT_STOPS, FIGURES, CASE_PROMPTS, CASE_DESK } from '../src/data/literature.js';
import { WORKS, PASSAGES } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };

const works = new Map(WORKS.map((w) => [w.id, w]));
const passages = new Map(PASSAGES.map((p) => [p.id, p]));
const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const norm = (s) => collapse(s.toLowerCase().replace(/[‘’]/g, "'"));
const corpus = new Map();
const textOf = (id) => {
  if (!corpus.has(id)) {
    const f = join(APP, 'public', 'texts', `${id}.txt`);
    corpus.set(id, existsSync(f) ? collapse(readFileSync(f, 'utf8')) : null);
  }
  return corpus.get(id);
};
/* A quotation may come only from a held text that all three markets clear. */
const quotable = (id) => { const w = works.get(id); return !!(w && w.held && cleared(w) && textOf(id)); };
const found = (id, s) => quotable(id) && textOf(id).includes(collapse(s));

// Words that may appear in both a question and its answer without giving anything away.
const STOP = new Set(('a an the and or but of to in on at by for with from into onto as is are was were be been it its ' +
  'he she they them his her their him this that these those what which who whom how why when where one two both ' +
  'not no very more most all any some each other than then there here so do does did has have had can will would ' +
  'about after before over under up down out off our your you we i me my').split(' '));
const words = (s) => norm(s).replace(/[^a-z0-9' -]/g, ' ').split(/[\s-]+/).map((w) => w.replace(/^'+|'+$/g, '').replace(/'s$/, ''))
  .filter((w) => w.length >= 3 && !STOP.has(w));

const FIGS = ['simile', 'metaphor', 'personification', 'alliteration', 'none'];
const figOf = new Map(FIGURES.map((f) => [collapse(f.text), f.figure]));

// ── Stops ───────────────────────────────────────────────────────────────────
function checkItem(it, tag, stop) {
  ok(typeof it.q === 'string' && it.q.trim().length > 8, `${tag}: question missing`);
  ok(typeof it.right === 'string' && it.right.trim(), `${tag}: exactly one right answer`);
  if (!ok(Array.isArray(it.wrong) && it.wrong.length === 3 && it.wrong.every((w) => typeof w === 'string' && w.trim()), `${tag}: needs exactly 3 wrong answers`)) return;
  const opts = [it.right, ...it.wrong].map(norm);
  ok(new Set(opts).size === 4, `${tag}: options are not distinct`);
  const longestWrong = Math.max(...it.wrong.map((s) => s.length));
  ok(!(it.right.length > longestWrong * 1.4), `${tag}: right answer is the longest option by over 40% (${it.right.length} vs ${longestWrong})`);
  // The right answer is not given away by the question or the line it asks about.
  const asked = new Set([...words(it.q), ...(it.quote ? words(it.quote) : [])]);
  const leak = it.lines ? [] : words(it.right).filter((w) => asked.has(w));
  ok(leak.length === 0, `${tag}: the right answer's words are in the question or quote (${leak.join(', ')})`);
  ok(!norm(it.q).includes(norm(it.right)), `${tag}: the right answer appears in the question`);
  if (it.work !== undefined) ok(works.has(it.work), `${tag}: unknown work ${it.work}`);
  if (it.passage !== undefined) {
    const p = passages.get(it.passage);
    if (ok(p, `${tag}: unknown passage ${it.passage}`)) {
      ok(!p.needsReview, `${tag}: passage ${p.id} waits on a reviewer (needsReview) and may not be used`);
      ok(cleared(works.get(p.work)), `${tag}: passage ${p.id} is from a work not cleared in all three markets`);
      if (it.work) ok(p.work === it.work, `${tag}: passage ${p.id} is from ${p.work}, not ${it.work}`);
      if (it.quote) ok(norm(p.text || '').includes(norm(it.quote)) || found(p.work, it.quote), `${tag}: quote is not in passage ${p.id}`);
    }
  }
  if (it.quote !== undefined) {
    ok(typeof it.work === 'string', `${tag}: a quote must name its work`);
    ok(quotable(it.work), `${tag}: ${it.work} is not a held, cleared text, so it cannot be quoted`);
    ok(found(it.work, it.quote), `${tag}: quote not found in texts/${it.work}.txt: "${it.quote.slice(0, 50)}…"`);
  }
  if (it.lines) {
    const all = [it.right, ...it.wrong];
    if (ok(Array.isArray(it.from) && it.from.length === 4, `${tag}: a lines item needs a work for each of its 4 options`)) {
      all.forEach((line, i) => ok(found(it.from[i], line), `${tag}: option "${line.slice(0, 40)}…" not found in texts/${it.from[i]}.txt`));
    }
  }
  // Figure items: the right line has the figure; no wrong line does (each line is classified in FIGURES).
  if (it.figure !== undefined) {
    ok(FIGS.includes(it.figure) && it.figure !== 'none', `${tag}: unknown figure ${it.figure}`);
    const target = it.lines ? it.right : it.quote;
    ok(figOf.get(collapse(target || '')) === it.figure, `${tag}: "${(target || '').slice(0, 40)}…" is not a ${it.figure} in FIGURES`);
    if (it.lines) for (const w of it.wrong) {
      const f = figOf.get(collapse(w));
      ok(f !== undefined, `${tag}: wrong line "${w.slice(0, 40)}…" is not classified in FIGURES`);
      ok(f !== it.figure, `${tag}: wrong line "${w.slice(0, 40)}…" is also a ${it.figure}: two right answers`);
    }
  }
  return stop;
}

const ids = new Set();
let items = 0;
for (const s of LIT_STOPS) {
  const tag = `stop ${s.id}`;
  ok(!ids.has(s.id), `${tag}: duplicate id`);
  ids.add(s.id);
  const m = /^li(\d+)-[a-z0-9-]+$/.exec(s.id || '');
  ok(m && Number(m[1]) === s.level, `${tag}: id must be li<level>-<slug> and match level ${s.level}`);
  ok(Number.isInteger(s.level) && s.level >= 1 && s.level <= 9, `${tag}: level must be 1–9 (10 is the writing desk)`);
  ok([1, 2, 3].includes(s.band), `${tag}: band must be 1, 2 or 3`);
  ok(typeof s.title === 'string' && s.title.trim() && s.title.length <= 32, `${tag}: needs a short title`);
  ok(/^I can .+\.$/.test(s.iCan || ''), `${tag}: iCan must be an "I can …." sentence`);
  ok(typeof s.story === 'string' && /Quill/.test(s.story), `${tag}: the story is Quill's`);
  ok(typeof s.learn?.why === 'string' && s.learn.why.length > 80, `${tag}: learn.why must explain the idea`);
  ok(Array.isArray(s.learn?.example) && s.learn.example.length >= 2 && s.learn.example.length <= 4, `${tag}: learn.example needs 2–4 examples`);
  ok(Array.isArray(s.items) && s.items.length >= 12, `${tag}: needs at least 12 items (has ${s.items?.length || 0})`);
  (s.items || []).forEach((it, i) => { items++; checkItem(it, `${tag} item ${i + 1}`, s); });
  const qs = (s.items || []).map((it) => norm(it.q + ' ' + (it.quote || '') + (it.lines ? ' ' + it.right : '')));
  ok(new Set(qs).size === qs.length, `${tag}: two items ask the same thing`);
}
const perLevel = [];
for (let n = 1; n <= 9; n++) {
  const c = LIT_STOPS.filter((s) => s.level === n).length;
  perLevel.push(c);
  ok(c >= 1 && c <= 2, `level ${n}: needs one or two stops (has ${c})`);
}

// ── FIGURES: the Figure Hunt bank ───────────────────────────────────────────
const seenFig = new Set();
const count = Object.fromEntries(FIGS.map((f) => [f, 0]));
for (const f of FIGURES) {
  const tag = `figure "${(f.text || '').slice(0, 40)}…"`;
  ok(FIGS.includes(f.figure), `${tag}: unknown figure ${f.figure}`);
  count[f.figure] = (count[f.figure] || 0) + 1;
  ok(typeof f.text === 'string' && f.text.length <= 200, `${tag}: must be at most 200 characters`);
  ok(!seenFig.has(collapse(f.text)), `${tag}: duplicate`);
  seenFig.add(collapse(f.text));
  ok(quotable(f.work), `${tag}: ${f.work} is not a held, cleared text`);
  ok(found(f.work, f.text), `${tag}: not found in texts/${f.work}.txt (never paraphrase, never quote from memory)`);
  const t = ' ' + norm(f.text) + ' ';
  if (f.figure === 'simile') ok(/ (like|as) /.test(t), `${tag}: a simile must compare with "like" or "as"`);
  if (f.figure === 'none') {
    ok(!/ like | as if | as [a-z]+ as /.test(t), `${tag}: marked none, but it compares with like / as`);
    // No accidental alliteration: two neighbouring content words that start with the same letter.
    const w = words(f.text);
    const twin = w.findIndex((x, i) => i > 0 && x[0] === w[i - 1][0] && x !== w[i - 1]);
    ok(twin < 0, `${tag}: marked none, but "${w[twin - 1]} ${w[twin]}" alliterates`);
  }
}
ok(FIGURES.length >= 70, `FIGURES needs at least 70 entries (has ${FIGURES.length})`);
for (const f of FIGS) ok(count[f] >= 12, `FIGURES needs at least 12 of ${f} (has ${count[f]})`);

// ── Level 10: My case for this book ─────────────────────────────────────────
ok(Array.isArray(CASE_PROMPTS) && CASE_PROMPTS.length === 6 && CASE_PROMPTS.every((p) => typeof p === 'string' && p.length > 30), 'CASE_PROMPTS needs 6 prompts');
ok(CASE_DESK && CASE_DESK.prompts === CASE_PROMPTS && CASE_DESK.parts.length >= 3 && CASE_DESK.check.length >= 3, 'CASE_DESK needs prompts, parts and a checklist');

// ── The Library: ~100 works by age 14 (SPEC §7) ─────────────────────────────
const RIGHTS = new Set(['PD', 'not PD', 'check']);
ok(WORKS.length >= 100, `the Library needs at least 100 works (has ${WORKS.length})`);
for (const w of WORKS) {
  const r = w.rights || {};
  ok(['us', 'uk', 'in'].every((k) => RIGHTS.has(r[k])) && typeof r.basis === 'string' && r.basis.length > 10 && /^\d{4}-\d{2}-\d{2}$/.test(r.checked || ''),
    `work ${w.id}: rights must give us / uk / in, a basis and a checked date`);
}

// ── The checks must be able to fail ─────────────────────────────────────────
{
  const f = FIGURES[0];
  ok(!found(f.work, f.text.replace(/[A-Za-z]+/, (m) => m + 'x')), 'the quote check accepted an altered line: it is blind');
  ok(!found('peterpan', 'Peter'), 'the quote check accepted a text that is not cleared');
  const probe = (it) => { const before = fails.length; checkItem(it, 'probe'); return fails.splice(before); };
  ok(probe({ q: 'Who finds the hidden gate?', right: 'the gardener', wrong: ['Mary', 'Dickon', 'the robin'] }).length === 0, 'a fair probe item was refused');
  ok(probe({ q: 'Who finds the hidden gate?', right: 'the gate-keeper', wrong: ['Mary', 'Dickon', 'the robin'] }).some((f) => /words are in the question/.test(f)), 'the leak check passed a leaking item: it is blind');
  ok(probe({ q: 'Who finds the hidden gate?', right: 'the old gardener with a spade', wrong: ['Mary', 'Dickon', 'the robin'] }).some((f) => /longest option/.test(f)), 'the length check passed a too-long right answer: it is blind');
}

// ── Report ──────────────────────────────────────────────────────────────────
if (fails.length) {
  for (const f of fails) console.error('  ✗ ' + f);
  console.error(`literature: ${fails.length} of ${checks} checks failed`);
  process.exit(1);
}
const held = WORKS.filter((w) => w.held).length;
console.log(`literature: all ${checks} passed — ${LIT_STOPS.length} stops (levels 1–9: ${perLevel.join('/')}), ${items} items, ` +
  `${FIGURES.length} figures (${FIGS.map((f) => `${f} ${count[f]}`).join(', ')}), ${WORKS.length} works (${held} held, ${WORKS.length - held} cards)`);
