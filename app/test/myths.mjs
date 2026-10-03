// The Greek myths and the words English took from them (data/library-myths.js, data/myth-words.js),
// held by a test (CLAUDE.md rules 1, 2, 6):
// - the three myth books are held, cleared in all three markets, and on disk; every myth passage is a
//   held passage on Reading level 2 and is in passages.json;
// - every MYTH_WORDS entry names a myth passage that exists, its quotation is an exact
//   (whitespace-collapsed) substring of a held, cleared text, its origin is sourced (Bizzing Bee's lore)
//   or it is under review and names what a reviewer should check;
// - the Word level 7 stops have the language.js shape, at least 12 items each, every band covered, and
//   every item is fair: one right answer, three distinct wrong ones, the answer not in the question or
//   in the quotation shown with it, the right answer not the longest by over 40%, every origin sourced.
// Each check is proven by breaking it at the end.
//
//   node app/test/myths.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MYTH_WORKS, MYTH_PASSAGES } from '../src/data/library-myths.js';
import { MYTH_WORDS, MYTH_WORD_STOPS } from '../src/data/myth-words.js';
import { WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { levelOf } from '../src/reading.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };

const norm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();
const words = (s) => ` ${norm(s).replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const hasWord = (needle, hay) => words(hay).includes(words(needle));
const sourced = (x) => Array.isArray(x) && x.length > 0 && x.every((s) => typeof s === 'string' && s.trim().length > 8);
const ORIGIN = /\b(?:comes? from|came from|named after|named for|from (?:his|her|its|their|them|it)\b|is (?:her|his|their) name|shares his name|built from)/i;

// ── Held texts ──────────────────────────────────────────────────────────────
const works = new Map(WORKS.map((w) => [w.id, w]));
const corpus = new Map();
function heldText(id) {
  if (corpus.has(id)) return corpus.get(id);
  const w = works.get(id);
  let text = null;
  if (w && w.held && cleared(w) && w.file) {
    const path = join(APP, 'public', w.file);
    if (existsSync(path)) text = collapse(readFileSync(path, 'utf8'));
  }
  corpus.set(id, text);
  return text;
}
const quoteFound = (text, work) => { const body = heldText(work); return !!body && body.includes(collapse(text)); };
function checkQuote(text, work, tag) {
  const w = works.get(work);
  if (!ok(w, `${tag}: unknown work "${work}"`)) return;
  if (!ok(w.held && cleared(w), `${tag}: work "${work}" is not held and cleared in all three markets`)) return;
  ok(quoteFound(text, work), `${tag}: not found verbatim in ${work}: "${text}"`);
}

// ── Works ───────────────────────────────────────────────────────────────────
ok(MYTH_WORKS.length >= 3, `need the three myth books (have ${MYTH_WORKS.length})`);
for (const w of MYTH_WORKS) {
  const tag = `work ${w.id}`;
  ok(works.get(w.id) === w, `${tag}: not merged into library.js WORKS`);
  ok(w.held && w.file === `texts/${w.id}.txt`, `${tag}: must be held as texts/${w.id}.txt`);
  ok(['us', 'uk', 'in'].every((k) => w.rights?.[k] === 'PD') && cleared(w), `${tag}: must be public domain in the US, UK and India`);
  ok(existsSync(join(APP, 'public', w.file || '')), `${tag}: held text missing (run tools/texts/fetch.mjs ${w.id})`);
  ok(w.sources?.some((s) => /Project Gutenberg #\d+/.test(s)), `${tag}: must name its Project Gutenberg number`);
}

// ── Passages ────────────────────────────────────────────────────────────────
const MYTH_WORK_IDS = new Set([...MYTH_WORKS.map((w) => w.id), 'bulfinch']);
const built = new Map(JSON.parse(readFileSync(join(APP, 'src', 'data', 'passages.json'), 'utf8')).map((p) => [p.id, p]));
const passIds = new Set(MYTH_PASSAGES.map((p) => p.id));
ok(MYTH_PASSAGES.length >= 12 && MYTH_PASSAGES.length <= 16, `need 12–16 myth passages (have ${MYTH_PASSAGES.length})`);
for (const b of [2, 3]) ok(MYTH_PASSAGES.filter((p) => p.band === b).length >= 5, `band ${b}: needs at least 5 myth passages`);
for (const p of MYTH_PASSAGES) {
  const tag = `passage ${p.id}`;
  ok(MYTH_WORK_IDS.has(p.work), `${tag}: work ${p.work} is not a myth book`);
  ok(levelOf(p) === 2, `${tag}: should land on Reading level 2 (fairy tales and myths), lands on ${levelOf(p)}`);
  ok(built.has(p.id), `${tag}: not in passages.json (run node tools/texts/levels.mjs)`);
  if (p.needsReview) ok(typeof p.reviewNote === 'string' && p.reviewNote.trim(), `${tag}: needsReview without a grown-up note`);
}

// ── The words ───────────────────────────────────────────────────────────────
ok(MYTH_WORDS.length >= 30, `need at least 30 myth words (have ${MYTH_WORDS.length})`);
const seen = new Set();
const BEE_LORE = /^Bizzing Bee word list \(.*words-lore\.js @ [0-9a-f]{7,}\): .+ — “.+”$/;
for (const m of MYTH_WORDS) {
  const tag = `word ${m.word}`;
  ok(!seen.has(norm(m.word)), `${tag}: duplicate`);
  seen.add(norm(m.word));
  for (const k of ['word', 'from', 'meaning']) ok(typeof m[k] === 'string' && m[k].trim(), `${tag}: missing ${k}`);
  ok(passIds.has(m.passage), `${tag}: passage "${m.passage}" is not a myth passage`);
  ok(typeof m.needsReview === 'boolean', `${tag}: needsReview must be true or false`);
  ok(sourced(m.sources), `${tag}: sources[] empty`);
  if (m.quote !== undefined) { ok(typeof m.work === 'string', `${tag}: a quote needs its work`); checkQuote(m.quote, m.work, tag); }
  else ok(m.needsReview, `${tag}: no quotation from a held text, so it must be under review`);
  // An origin is cleared only when Bee's lore gives it; otherwise a reviewer must check a named dictionary.
  if (!m.needsReview) ok((m.sources || []).some((s) => BEE_LORE.test(s)), `${tag}: origin not sourced from Bee's lore, so needsReview must be true`);
  else ok((m.sources || []).some((s) => /^To check: /.test(s)) || m.note, `${tag}: under review but names no dictionary entry to check`);
}

// ── The stops ───────────────────────────────────────────────────────────────
const allWords = new Set(MYTH_WORDS.map((m) => norm(m.word)));
function itemFaults(it) {
  const out = [];
  if (!(typeof it.q === 'string' && it.q.trim())) out.push('missing q');
  if (!(typeof it.right === 'string' && it.right.trim())) out.push('missing right');
  if (!(Array.isArray(it.wrong) && it.wrong.length === 3 && it.wrong.every((w) => typeof w === 'string' && w.trim()))) { out.push('needs exactly 3 wrong answers'); return out; }
  const opts = [it.right, ...it.wrong].map(norm);
  if (new Set(opts).size !== opts.length) out.push('options are not distinct');
  if (norm(it.q).includes(norm(it.right)) || hasWord(it.right, it.q)) out.push('the right answer appears in the question');
  if (it.quote && hasWord(it.right, it.quote)) out.push('the right answer appears in the quotation shown with it');
  const longestWrong = Math.max(...it.wrong.map((w) => w.length));
  if (it.right.length > longestWrong * 1.4) out.push(`right answer is the longest option by over 40% (${it.right.length} vs ${longestWrong})`);
  if (it.wrong.some((w) => allWords.has(norm(w)))) out.push('a wrong answer is itself a word from the myths');
  if (ORIGIN.test(it.q) && !sourced(it.sources)) out.push('states an origin but has no sources[]');
  if ('sources' in it && !sourced(it.sources)) out.push('sources[] is empty');
  return out;
}
const ids = new Set();
ok(MYTH_WORD_STOPS.length === 3, `need 3 Word level 7 stops (have ${MYTH_WORD_STOPS.length})`);
for (const b of [1, 2, 3]) ok(MYTH_WORD_STOPS.some((s) => s.band === b), `band ${b}: no Word level 7 myth stop`);
for (const s of MYTH_WORD_STOPS) {
  const tag = `stop ${s.id}`;
  ok(!ids.has(s.id), `${tag}: duplicate id`);
  ids.add(s.id);
  ok(/^w7-[a-z0-9-]+$/.test(s.id) && s.level === 7, `${tag}: id must be w7-<slug> on level 7`);
  ok([1, 2, 3].includes(s.band), `${tag}: band must be 1, 2 or 3`);
  for (const k of ['title', 'iCan', 'story']) ok(typeof s[k] === 'string' && s[k].trim(), `${tag}: missing ${k}`);
  ok(/^I can /.test(s.iCan || ''), `${tag}: iCan must start "I can"`);
  ok(/\bQuill\b/.test(s.story || ''), `${tag}: the story is Quill's`);
  ok(s.learn && typeof s.learn.why === 'string' && s.learn.why.trim(), `${tag}: learn.why missing`);
  ok(Array.isArray(s.learn?.example) && s.learn.example.length >= 2 && s.learn.example.length <= 3, `${tag}: learn.example needs 2–3`);
  ok(sourced(s.sources), `${tag}: sources[] empty`);
  ok(s.needsReview === true, `${tag}: states word origins (Bee's lore is itself unsourced), so needsReview must stay true`);
  ok(Array.isArray(s.items) && s.items.length >= 12, `${tag}: needs at least 12 items (has ${s.items?.length || 0})`);
  (s.items || []).forEach((it, n) => {
    const qt = `${tag} item ${n + 1}`;
    for (const f of itemFaults(it)) ok(false, `${qt}: ${f}`);
    checks++;
    if (it.quote !== undefined) { ok(typeof it.work === 'string', `${qt}: a quote needs its work`); checkQuote(it.quote, it.work, qt); }
  });
}

// ── Prove the checks can fail ───────────────────────────────────────────────
{
  const m = MYTH_WORDS.find((x) => x.quote);
  ok(!quoteFound(m.quote.replace(/[A-Za-z]+/, (w) => w + 'x'), m.work), 'check-quotes accepted an altered quotation: the check is blind');
  ok(!quoteFound(m.quote, 'andersen'), 'check-quotes found a quotation in a work that is not cleared: the rights gate is blind');
  const it = MYTH_WORD_STOPS[0].items[0];
  ok(itemFaults({ ...it, q: `${it.q} (${it.right})` }).some((f) => /in the question/.test(f)), 'leak check accepted the answer planted in the question');
  ok(itemFaults({ ...it, quote: `and ${it.right} again` }).some((f) => /quotation/.test(f)), 'leak check accepted the answer planted in the quotation');
  ok(itemFaults({ ...it, right: it.right + ' and a great deal more besides' }).some((f) => /longest/.test(f)), 'length check accepted an over-long right answer');
  ok(itemFaults({ ...it, wrong: [it.wrong[0], it.wrong[0], it.wrong[1]] }).some((f) => /distinct/.test(f)), 'distinct check accepted a repeated option');
  ok(itemFaults({ ...it, wrong: ['panic', ...it.wrong.slice(1)] }).some((f) => /myths/.test(f)) || it.right === 'panic', 'myth-word distractor check is blind');
  ok(itemFaults({ ...it, q: 'Which word comes from her name?', sources: undefined }).some((f) => /origin/.test(f)), 'origin check accepted an unsourced origin');
}

const items = MYTH_WORD_STOPS.reduce((a, s) => a + s.items.length, 0);
if (fails.length) {
  console.error(`myths: ${fails.length} of ${checks} failed`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`myths: all ${checks} passed (${MYTH_WORKS.length} books, ${MYTH_PASSAGES.length} passages, ${MYTH_WORDS.length} words, ${MYTH_WORD_STOPS.length} stops with ${items} items)`);
