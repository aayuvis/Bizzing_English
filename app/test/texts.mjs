// The Library's rules, held by a test (docs/00-spec.md §3, §4, §7):
// rights and sources on every work, held texts present, passages cut from their texts and
// up to date, every LINE found verbatim in its text (the spec's check-quotes), and every
// question fair: one right answer, distinct options, no answer in the question, no
// "longest option is right" leak.
//
//   node app/test/texts.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKS, PASSAGES, LINES } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { buildPassages, serialise, locate, readText, OUT, shipped, splitScenes, measure } from '../../tools/texts/levels.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };

const RIGHTS = new Set(['PD', 'not PD', 'check']);
const SHELVES = new Set(['fable', 'children', 'novel', 'poetry', 'drama', 'speech', 'essay']);
const ERAS = new Set(['Fable & myth', 'Ancient', 'Elizabethan', '18th century', 'Romantic', 'Victorian',
  'Edwardian', 'American', 'Indian writers in English', 'Modern']);
const byId = new Map();

// ── Works ───────────────────────────────────────────────────────────────────
for (const w of WORKS) {
  const tag = `work ${w.id}`;
  ok(!byId.has(w.id), `${tag}: duplicate id`);
  byId.set(w.id, w);
  for (const k of ['title', 'author', 'why', 'summary']) ok(typeof w[k] === 'string' && w[k].trim(), `${tag}: missing ${k}`);
  ok(Number.isInteger(w.year), `${tag}: year must be a number`);
  ok(ERAS.has(w.era), `${tag}: unknown era ${w.era}`);
  ok(SHELVES.has(w.shelf), `${tag}: unknown shelf ${w.shelf}`);
  const r = w.rights || {};
  for (const k of ['us', 'uk', 'in']) ok(RIGHTS.has(r[k]), `${tag}: rights.${k} must be PD / not PD / check`);
  ok(typeof r.basis === 'string' && r.basis.length > 10, `${tag}: rights.basis missing`);
  ok(/^\d{4}-\d{2}-\d{2}$/.test(r.checked || ''), `${tag}: rights.checked must be a date`);
  ok(Array.isArray(w.sources) && w.sources.length > 0 && w.sources.every((s) => typeof s === 'string' && s.trim()), `${tag}: sources[] empty`);
  if (w.needsReview) ok(typeof w.reviewNote === 'string' && w.reviewNote.trim(), `${tag}: needsReview without reviewNote`);
  ok(typeof w.held === 'boolean', `${tag}: held must be true or false`);
  const anyNotPD = ['us', 'uk', 'in'].some((k) => r[k] === 'not PD');
  if (w.held) {
    ok(w.file === `texts/${w.id}.txt`, `${tag}: held work must have file texts/${w.id}.txt`);
    const gatedFile = join(APP, '..', 'tools', 'texts', 'gated', `${w.id}.txt`);
    if (cleared(w)) ok(existsSync(join(APP, 'public', w.file || '')), `${tag}: held file app/public/${w.file} is missing (run tools/texts/fetch.mjs)`);
    else { ok(existsSync(gatedFile), `${tag}: not cleared in all three markets, so its text belongs in tools/texts/gated/`);
      ok(!existsSync(join(APP, 'public', w.file || '')), `${tag}: not cleared in all three markets, but its full text is in the published site`); }
    ok(r.us === 'PD' || w.gated, `${tag}: held text must be public domain in the US unless gated`);
    ok(!anyNotPD || w.gated, `${tag}: held text is "not PD" in some market and is not gated`);
    ok(w.sources.some((s) => /Project Gutenberg #\d+/.test(s)), `${tag}: held text must name its Project Gutenberg number`);
  } else {
    ok(!w.file, `${tag}: a work that is not held must not name a file`);
  }
  // Modern = still in copyright somewhere: a card only, never held, never quoted.
  if (anyNotPD) ok(!w.held || w.gated, `${tag}: modern / in-copyright work must be held: false`);
}
for (const w of WORKS) for (const l of w.liked || []) ok(byId.has(l) && l !== w.id, `work ${w.id}: liked "${l}" is not another work`);
const heldWorks = WORKS.filter((w) => w.held);
const modern = WORKS.filter((w) => !w.held);

// ── Passages ────────────────────────────────────────────────────────────────
const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const passIds = new Set();
for (const p of PASSAGES) {
  const tag = `passage ${p.id}`;
  ok(!passIds.has(p.id), `${tag}: duplicate id`);
  passIds.add(p.id);
  const w = byId.get(p.work);
  if (!ok(w && w.held, `${tag}: work ${p.work} is not a held work`)) continue;
  ok([1, 2, 3].includes(p.band), `${tag}: band must be 1, 2 or 3`);
  ok(['prose', 'verse'].includes(p.kind), `${tag}: kind must be prose or verse`);
  ok(p.abridged === false || p.abridged === true, `${tag}: abridged must be stated`);
  const text = readText(p.work);
  const at = text && locate(text, p.start, p.end);
  ok(at && !at.error, `${tag}: ${at ? at.error : 'no text'}`);
  ok(typeof p.evaluate === 'string' && p.evaluate.includes('?'), `${tag}: needs one evaluative question`);
  if (p.needsReview) ok(typeof p.reviewNote === 'string' && p.reviewNote.trim(), `${tag}: needsReview without reviewNote`);
  ok(Array.isArray(p.questions) && p.questions.length >= 4 && p.questions.length <= 5, `${tag}: needs 4–5 questions`);
  ok(Array.isArray(p.words) && p.words.length >= 3 && p.words.length <= 6, `${tag}: needs 3–6 bank words`);
  (p.questions || []).forEach((q, i) => {
    const qt = `${tag} q${i + 1}`;
    ok(['literal', 'inferential'].includes(q.depth), `${qt}: depth must be literal or inferential (evaluative is never machine-marked)`);
    ok(typeof q.right === 'string' && q.right.trim(), `${qt}: exactly one right answer`);
    ok(Array.isArray(q.wrong) && q.wrong.length === 3, `${qt}: needs exactly 3 distractors`);
    const opts = [q.right, ...(q.wrong || [])].map(norm);
    ok(new Set(opts).size === opts.length, `${qt}: options are not distinct`);
    ok(!(q.wrong || []).map(norm).includes(norm(q.right)), `${qt}: right answer repeated among the wrong ones`);
    ok(!norm(q.q).includes(norm(q.right)), `${qt}: the right answer appears in the question`);
    const longestWrong = Math.max(...(q.wrong || []).map((s) => s.length));
    ok(!(q.right.length > longestWrong * 1.4), `${qt}: right answer is the longest option by over 40% (${q.right.length} vs ${longestWrong})`);
  });
}

// passages.json must be exactly what levels.mjs builds from library.js now.
const { passages: built, errors } = buildPassages(PASSAGES);
ok(errors.length === 0, `levels: ${errors.join('; ')}`);
ok(existsSync(OUT) && readFileSync(OUT, 'utf8') === serialise(shipped(built, WORKS, cleared)), 'passages.json is out of date with library.js: run node tools/texts/levels.mjs');
for (const p of built) {
  ok(typeof p.fk === 'number' && Number.isFinite(p.fk), `passage ${p.id}: fk not computed`);
  ok(typeof p.level === 'number' && Number.isFinite(p.level), `passage ${p.id}: level not set`);
  if (p.kind === 'prose') ok(p.words >= 150 && p.words <= 450, `passage ${p.id}: prose must be 150–450 words (${p.words})`);
  if (p.abridged) ok(p.label === 'Retold for younger readers — the original is in the Library', `passage ${p.id}: an abridgement must carry the retold label`);
  const body = norm(p.text);
  for (const word of p.wordBank) ok(body.includes(word.toLowerCase()), `passage ${p.id}: bank word "${word}" is not in the passage`);
}
for (const b of [1, 2, 3]) ok(built.filter((p) => p.band === b).length >= 6, `band ${b}: needs at least 6 passages`);
ok(built.length >= 24, `need at least 24 passages (have ${built.length})`);

// ── Stories: each passage is told scene by scene over a painting ────────────
// hook: one line of our own (no ending given away); scenes: markers where the 2nd, 3rd…
// scenes start, found in order; paint (and paint2, a later moment for longer prose): a
// painting prompt with no quoted words for a model to letter.
const QUOTES = /["“”‘]|(^|\s)'[^']+'(\s|[.,;]|$)/;
const squash = (s) => s.replace(/\s+/g, ' ').trim();
const lib = new Map(PASSAGES.map((p) => [p.id, p]));
for (const p of PASSAGES) {
  const tag = `passage ${p.id}`;
  ok(typeof p.hook === 'string' && p.hook.trim() && p.hook.length <= 90, `${tag}: needs a hook of at most 90 characters`);
  for (const k of ['paint', 'paint2']) {
    if (k === 'paint2' && p[k] == null) continue;
    const v = p[k];
    if (!ok(typeof v === 'string' && v.length > 80, `${tag}: ${k} must be a painting prompt`)) continue;
    ok(!QUOTES.test(v), `${tag}: ${k} quotes words a painter would letter`);
    const sentences = (v.match(/[.!?](\s|$)/g) || []).length;
    ok(sentences >= 2 && sentences <= 4, `${tag}: ${k} should be 2–4 sentences (has ${sentences})`);
  }
  ok(Array.isArray(p.scenes) && p.scenes.every((m) => typeof m === 'string' && m.trim()), `${tag}: scenes must be a list of markers`);
}
for (const p of built) {
  const tag = `passage ${p.id}`;
  const src = lib.get(p.id);
  const n = p.scenes.length;
  ok(n >= (p.kind === 'verse' ? 2 : 3) && n <= 6, `${tag}: ${n} scenes (prose 3–6, verse 2–6)`);
  ok(n === (src.scenes || []).length + 1, `${tag}: a scene marker was not found in order`);
  ok(squash(p.scenes.join(' ')) === squash(p.text), `${tag}: scenes joined are not the passage text`);
  if (p.kind === 'prose') p.scenes.forEach((s, i) => { const w = measure(s).words; ok(w >= 25 && w <= 140, `${tag}: scene ${i + 1} is ${w} words (prose scenes are 25–140)`); });
  if (src.paint2) ok(p.kind === 'prose' && n >= 4, `${tag}: paint2 is for prose told in 4 or more scenes`);
}
// The scene check must be able to fail: a marker with one word changed is not found.
{
  const b = built.find((x) => lib.get(x.id).scenes?.length);
  const p = lib.get(b.id);
  const bent = p.scenes.map((m, i) => (i === 0 ? m.replace(/[A-Za-z]+/, (w) => w + 'x') : m));
  ok(!!splitScenes(b.text, bent).error, 'scene check accepted an altered marker: the check is blind');
  ok(!!splitScenes(b.text, [...p.scenes].reverse()).error || p.scenes.length < 2, 'scene check accepted markers out of order');
}
const ship = shipped(built, WORKS, cleared);
const MIN = { 1: 10, 2: 14, 3: 12 };
ok(ship.length >= 42, `need at least 42 shippable passages (have ${ship.length})`);
for (const b of [1, 2, 3]) ok(ship.filter((p) => p.band === b).length >= MIN[b], `band ${b}: needs at least ${MIN[b]} shippable passages`);

// ── LINES: the check-quotes lint ────────────────────────────────────────────
const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const corpus = new Map();
const quoteFound = (line) => {
  if (!corpus.has(line.work)) corpus.set(line.work, collapse(readText(line.work) || ''));
  return corpus.get(line.work).includes(collapse(line.text));
};
const seen = new Set();
for (const l of LINES) {
  const tag = `line "${l.text.slice(0, 40)}…"`;
  const w = byId.get(l.work);
  if (!ok(w && w.held, `${tag}: work ${l.work} is not held, so it cannot be quoted`)) continue;
  ok(typeof l.who === 'string' && l.who.trim(), `${tag}: who is missing`);
  ok(l.text.length <= 200, `${tag}: longer than 200 characters`);
  ok(!seen.has(l.text), `${tag}: duplicate line`);
  seen.add(l.text);
  ok(quoteFound(l), `${tag}: not found in texts/${l.work}.txt (never paraphrase, never quote from memory)`);
}
ok(LINES.length >= 40, `need at least 40 lines (have ${LINES.length})`);
// The lint must be able to fail: a line with one word changed is rejected.
const broken = { ...LINES[0], text: LINES[0].text.replace(/[A-Za-z]+/, (m) => m + 'x') };
ok(!quoteFound(broken), 'check-quotes accepted an altered line: the lint is blind');

// ── Report ──────────────────────────────────────────────────────────────────
if (fails.length) {
  for (const f of fails) console.error('  ✗ ' + f);
  console.error(`texts: ${fails.length} of ${checks} checks failed`);
  process.exit(1);
}
const bands = [1, 2, 3].map((b) => built.filter((p) => p.band === b).length).join('/');
const shipBands = [1, 2, 3].map((b) => ship.filter((p) => p.band === b).length).join('/');
console.log(`texts: all ${checks} passed — ${heldWorks.length} held works, ${modern.length} summary-only, ` +
  `${built.length} passages (bands ${bands}; ${ship.length} shipped, ${shipBands}), ${LINES.length} lines`);
