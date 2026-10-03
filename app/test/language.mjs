// The Language strand's rules, held by a test (docs/00-spec.md §2 strand 7, §7; CLAUDE.md rules 2, 6):
// ids unique and on levels 2–10; at least 12 items a stop; every question fair (one right answer,
// distinct options, the answer not in the question unless the question names every option, the
// right answer not the longest by over 40%); every dated or historical fact sourced and its stop
// under review; every quotation an exact (whitespace-collapsed) substring of a held, cleared text;
// the timeline in order with sources.
//
//   node app/test/language.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANG_STOPS, TIMELINE, RHETORIC } from '../src/data/language.js';
import { WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { level as curriculumLevel } from '../src/curriculum.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };

const norm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();
const sourced = (x) => Array.isArray(x) && x.length > 0 && x.every((s) => typeof s === 'string' && s.trim().length > 8);

// A dated fact: a year (400–1999 or 2000–2099), a century, or a first-record claim.
const DATED = /\b(?:[4-9]\d{2}|1\d{3}|20\d{2})\b|\bcentur(?:y|ies)\b|first recorded/i;
// A historical claim about where a word or idiom came from.
const ORIGIN = /\b(?:borrowed|came (?:in)?to English|came from|comes from|takes its name|named after|reached English|first record)\b/i;

// ── Held texts ──────────────────────────────────────────────────────────────
const works = new Map(WORKS.map((w) => [w.id, w]));
const corpus = new Map();
function heldText(id) {
  if (corpus.has(id)) return corpus.get(id);
  const w = works.get(id);
  let text = null;
  if (w && cleared(w) && w.held && w.file) {
    const path = join(APP, 'public', w.file);
    if (existsSync(path)) text = collapse(readFileSync(path, 'utf8'));
  }
  corpus.set(id, text);
  return text;
}
function checkQuote(text, work, tag) {
  const w = works.get(work);
  if (!ok(w, `${tag}: unknown work "${work}"`)) return;
  if (!ok(cleared(w), `${tag}: work "${work}" is not cleared in all three markets`)) return;
  const body = heldText(work);
  if (!ok(body, `${tag}: work "${work}" has no held text`)) return;
  ok(body.includes(collapse(text)), `${tag}: not found verbatim in ${work}: "${text}"`);
}

// ── Stops ───────────────────────────────────────────────────────────────────
const ids = new Set();
for (const s of LANG_STOPS) {
  const tag = `stop ${s.id}`;
  ok(!ids.has(s.id), `${tag}: duplicate id`);
  ids.add(s.id);
  ok(/^la([2-9]|10)-[a-z0-9-]+$/.test(s.id), `${tag}: id must be la<2–10>-<slug>`);
  ok(Number.isInteger(s.level) && s.level >= 2 && s.level <= 10, `${tag}: level must be 2–10`);
  ok(s.id.startsWith(`la${s.level}-`), `${tag}: id does not match level ${s.level}`);
  ok(curriculumLevel('language', s.level), `${tag}: no curriculum level ${s.level} in the language strand`);
  ok(s.band === 2 || s.band === 3, `${tag}: band must be 2 or 3`);
  for (const k of ['title', 'iCan', 'story']) ok(typeof s[k] === 'string' && s[k].trim(), `${tag}: missing ${k}`);
  ok(/^I can /.test(s.iCan || ''), `${tag}: iCan must start "I can"`);
  ok(/\bQuill\b/.test(s.story || ''), `${tag}: the story is Quill's`);
  ok(s.learn && typeof s.learn.why === 'string' && s.learn.why.trim(), `${tag}: learn.why missing`);
  ok(Array.isArray(s.learn?.example) && s.learn.example.length >= 2 && s.learn.example.length <= 3, `${tag}: learn.example needs 2–3`);
  ok(Array.isArray(s.sources), `${tag}: sources[] missing`);
  ok(typeof s.needsReview === 'boolean', `${tag}: needsReview must be true or false`);

  const told = [s.story, s.learn?.why, ...(s.learn?.example || [])].join(' ');
  if (DATED.test(told) || ORIGIN.test(told)) {
    ok(sourced(s.sources), `${tag}: story/learn states a dated or historical fact but sources[] is empty`);
    ok(s.needsReview === true, `${tag}: states a dated or historical fact, so needsReview must stay true`);
  }

  ok(Array.isArray(s.items) && s.items.length >= 12, `${tag}: needs at least 12 items (has ${s.items?.length || 0})`);
  (s.items || []).forEach((it, n) => {
    const qt = `${tag} item ${n + 1}`;
    ok(typeof it.q === 'string' && it.q.trim(), `${qt}: missing q`);
    ok(typeof it.right === 'string' && it.right.trim(), `${qt}: missing right`);
    ok(Array.isArray(it.wrong) && it.wrong.length === 3 && it.wrong.every((w) => typeof w === 'string' && w.trim()), `${qt}: needs exactly 3 wrong answers`);
    const opts = [it.right, ...(it.wrong || [])].map(norm);
    ok(new Set(opts).size === opts.length, `${qt}: options are not distinct`);
    // The answer is not in the question — unless the question names every option (a
    // "which word in this sentence…" item, where finding it is the task).
    const q = norm(it.q || '');
    const all = opts.every((o) => q.includes(o));
    ok(all || !q.includes(norm(it.right)), `${qt}: the right answer appears in the question`);
    const longestWrong = Math.max(...(it.wrong || ['']).map((w) => w.length));
    ok(!(it.right.length > longestWrong * 1.4), `${qt}: right answer is the longest option by over 40% (${it.right.length} vs ${longestWrong})`);
    const said = [it.q, it.right, ...(it.wrong || [])].join(' ');
    if (DATED.test(said) || ORIGIN.test(said)) {
      ok(sourced(it.sources), `${qt}: states a dated or historical fact but has no sources[]`);
      ok(s.needsReview === true, `${qt}: a dated or historical fact puts its stop under review`);
    }
    if ('sources' in it) ok(sourced(it.sources), `${qt}: sources[] is empty`);
    if (it.quote !== undefined) {
      ok(typeof it.work === 'string', `${qt}: a quote needs its work`);
      checkQuote(it.quote, it.work, qt);
      // A device item must not name its device inside the quotation.
      ok(!norm(it.quote).includes(norm(it.right)) || /which word|which phrase/i.test(it.q), `${qt}: the right answer is inside the quotation`);
    }
    for (const c of it.cites || []) checkQuote(c.text, c.work, `${qt} cite`);
    if (it.cites) {
      const cited = new Set(it.cites.map((c) => norm(c.text)));
      ok(opts.every((o) => cited.has(o)), `${qt}: every quoted option must be cited`);
    }
  });
}
for (let l = 2; l <= 10; l++) ok(LANG_STOPS.some((s) => s.level === l), `level ${l}: no stop`);

// ── The rhetoric shelf ──────────────────────────────────────────────────────
ok(RHETORIC.length >= 24, `RHETORIC: needs at least 24 examples (has ${RHETORIC.length})`);
const texts = new Set();
RHETORIC.forEach((r, n) => {
  const tag = `RHETORIC ${n + 1}`;
  ok(typeof r.device === 'string' && r.device.trim(), `${tag}: missing device`);
  ok(!texts.has(norm(r.text)), `${tag}: duplicate text`);
  texts.add(norm(r.text));
  ok(!(r.also || []).includes(r.device), `${tag}: also lists its own device`);
  checkQuote(r.text, r.work, tag);
});

// ── Timeline ────────────────────────────────────────────────────────────────
ok(TIMELINE.length >= 14, `TIMELINE: needs at least 14 events (has ${TIMELINE.length})`);
TIMELINE.forEach((e, n) => {
  const tag = `TIMELINE ${e.year}`;
  ok(Number.isInteger(e.year), `${tag}: year must be a whole number`);
  ok(typeof e.event === 'string' && e.event.trim(), `${tag}: missing event`);
  ok(sourced(e.sources), `${tag}: sources[] empty`);
  if (n > 0) ok(e.year >= TIMELINE[n - 1].year, `${tag}: out of order after ${TIMELINE[n - 1].year}`);
});

const items = LANG_STOPS.reduce((a, s) => a + s.items.length, 0);
if (fails.length) {
  console.error(`language: ${fails.length} of ${checks} failed`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`language: all ${checks} passed (${LANG_STOPS.length} stops, ${items} items, ${RHETORIC.length} rhetoric examples, ${TIMELINE.length} timeline events)`);
