// The gap stops (data/gap-stops.js), held to the rules (CLAUDE.md rules 2 and 6): the LANG_STOPS shape,
// ids unique and not colliding with any other stop, at least 12 items a stop; every question fair (one
// right answer, three distinct wrong ones, the answer not in the question or its quoted line unless every
// option is in it — a which-word item — and the right answer not the longest by over 40%); every
// quotation, and every right answer said to come from a book (`rightFrom`), an exact (whitespace-
// collapsed) substring of a held text whose work is cleared in all three markets. Then every item is run
// through the item engine (items.js kind `authored`), as test/items.mjs does: exactly one right option,
// options distinct after the engine's own normalising (punctuation stripped), no favourite answer slot.
// And the poem desk (POEM_DESK_STOP) in the shape of the writing desks in curriculum.js.
//
//   node app/test/gap-stops.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAP_STOPS, POEM_DESK_STOP } from '../src/data/gap-stops.js';
import { allStops } from '../src/curriculum.js';
import { LANG_STOPS } from '../src/data/language.js';
import { LIT_STOPS } from '../src/data/literature.js';
import { WORD_STOPS } from '../src/data/word-stops.js';
import { SENTENCE_STOPS } from '../src/data/sentence-stops.js';
import { WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { AUTHORED, addAuthored } from '../src/authored.js';
import { make, keys, check } from '../src/items.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };

const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();
// The same normalising and whole-phrase match as test/items.mjs (and items.js).
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const inText = (needle, hay) => new RegExp(`(^| )${norm(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(norm(hay));

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

// ── Ids: unique here, and not taken by any other stop ──────────────────────
// (Once the lead wires GAP_STOPS into the curriculum, the same stop appears there too: a clash is a
// DIFFERENT stop with the same id, told by its title.)
const others = new Map();
for (const s of [...allStops(), ...LANG_STOPS, ...LIT_STOPS, ...WORD_STOPS, ...SENTENCE_STOPS]) if (!others.has(s.id)) others.set(s.id, s);
const ids = new Set();
for (const s of [...GAP_STOPS, POEM_DESK_STOP]) {
  ok(!ids.has(s.id), `stop ${s.id}: duplicate id`);
  ids.add(s.id);
  const o = others.get(s.id);
  ok(!o || o.title === s.title, `stop ${s.id}: id already used by "${o?.title}"`);
}

// ── Stops ───────────────────────────────────────────────────────────────────
for (const s of GAP_STOPS) {
  const tag = `stop ${s.id}`;
  ok(s.strand === 'sentence' || s.strand === 'word', `${tag}: strand must be sentence or word`);
  ok(new RegExp(`^${s.strand === 'word' ? 'w' : 's'}${s.level}-[a-z0-9-]+$`).test(s.id), `${tag}: id must be ${s.strand[0]}<level>-<slug>`);
  ok(Number.isInteger(s.level) && s.level >= 1 && s.level <= 10, `${tag}: level must be 1–10`);
  ok([1, 2, 3].includes(s.band), `${tag}: band must be 1, 2 or 3`);
  for (const k of ['title', 'iCan', 'story']) ok(typeof s[k] === 'string' && s[k].trim(), `${tag}: missing ${k}`);
  ok(/^I can /.test(s.iCan || ''), `${tag}: iCan must start "I can"`);
  ok(/\bQuill\b/.test(s.story || ''), `${tag}: the story is Quill's`);
  ok(s.learn && typeof s.learn.why === 'string' && s.learn.why.trim(), `${tag}: learn.why missing`);
  ok(Array.isArray(s.learn?.example) && s.learn.example.length >= 2 && s.learn.example.length <= 3, `${tag}: learn.example needs 2–3`);
  ok(Array.isArray(s.sources) && s.sources.length, `${tag}: sources[] missing`);
  ok(s.needsReview === undefined || typeof s.needsReview === 'boolean', `${tag}: needsReview must be true or false`);

  ok(Array.isArray(s.items) && s.items.length >= 12, `${tag}: needs at least 12 items (has ${s.items?.length || 0})`);
  (s.items || []).forEach((it, n) => {
    const qt = `${tag} item ${n + 1}`;
    ok(typeof it.q === 'string' && it.q.trim(), `${qt}: missing q`);
    ok(typeof it.right === 'string' && it.right.trim(), `${qt}: missing right`);
    if (!ok(Array.isArray(it.wrong) && it.wrong.length === 3 && it.wrong.every((w) => typeof w === 'string' && w.trim()), `${qt}: needs exactly 3 wrong answers`)) return;
    const opts = [it.right, ...it.wrong];
    ok(new Set(opts.map(norm)).size === opts.length, `${qt}: options are not distinct once punctuation is stripped: ${opts.join(' | ')}`);
    const text = `${it.q} ${it.quote || ''}`;
    const select = opts.every((o) => text.toLowerCase().includes(o.toLowerCase()));
    if (select) ok(opts.every((o) => inText(o, text)), `${qt}: a which-word item whose options are not all whole phrases of its line`);
    else ok(!inText(it.right, text), `${qt}: the right answer appears in the question or its line`);
    const longestWrong = Math.max(...it.wrong.map((w) => w.length));
    ok(!(it.right.length > longestWrong * 1.4), `${qt}: right answer is the longest option by over 40% (${it.right.length} vs ${longestWrong})`);
    if ('sources' in it) ok(Array.isArray(it.sources) && it.sources.length && it.sources.every((x) => typeof x === 'string' && x.trim().length > 8), `${qt}: sources[] is empty`);
    if (it.quote !== undefined) {
      ok(typeof it.work === 'string', `${qt}: a quote needs its work`);
      checkQuote(it.quote, it.work, qt);
      ok(select || !inText(it.right, it.quote), `${qt}: the right answer is inside the quotation`);
    } else ok(it.work === undefined, `${qt}: a work with no quote`);
    // A right answer said to be a book's own line is exactly that line; its wrong versions are not.
    if (it.rightFrom !== undefined) {
      checkQuote(it.right, it.rightFrom, `${qt} (right answer)`);
      const body = heldText(it.rightFrom) || '';
      it.wrong.forEach((w) => ok(!body.includes(collapse(w)), `${qt}: a wrong version is itself in ${it.rightFrom}: "${w}"`));
    }
  });
}

// ── Through the engine (as test/items.mjs draws them) ──────────────────────
addAuthored(GAP_STOPS.filter((s) => !AUTHORED.has(s.id)));
const slots = [0, 0, 0, 0];
for (const s of GAP_STOPS) {
  const ks = keys('authored', { stop: s.id, band: 3 });
  ok(ks.length === s.items.length, `stop ${s.id}: the engine draws ${ks.length} of ${s.items.length} items`);
  s.items.forEach((_, i) => {
    const it = make('authored', `${s.id}:${i}`, { stop: s.id, band: 3 });
    ok(it.type === 'mc' && it.options.length === 4, `${it.id}: not a four-option question`);
    ok(new Set(it.options.map(norm)).size === 4, `${it.id}: options repeat after the engine's normalising: ${it.options.join(' | ')}`);
    ok(check(it, it.answer) && it.options.every((_, j) => j === it.answer || !check(it, j)), `${it.id}: not exactly one right option`);
    ok(it.options[it.answer] === s.items[i].right, `${it.id}: the engine's answer is not the written right answer`);
    const right = it.options[it.answer];
    if (it.select) ok(it.options.every((o) => inText(o, it.prompt + ' ' + (it.sub || ''))), `${it.id}: a which-word question whose options are not all in its line`);
    else ok(!inText(right, it.prompt) && !inText(right, it.sub || ''), `${it.id}: the answer "${right}" is in the question`);
    slots[it.answer]++;
  });
}
const total = slots.reduce((a, b) => a + b, 0);
slots.forEach((c, i) => ok(c / total >= 0.1 && c / total <= 0.4, `slot ${i + 1} holds ${Math.round((c / total) * 100)}% of answers`));

// ── The poem desk ───────────────────────────────────────────────────────────
{
  const p = POEM_DESK_STOP, tag = `stop ${p.id}`;
  ok(p.id === 'wr6-poem' && p.level === 6 && p.kind === 'desk', `${tag}: must be wr6-poem, level 6, kind desk`);
  for (const k of ['title', 'iCan', 'story']) ok(typeof p[k] === 'string' && p[k].trim(), `${tag}: missing ${k}`);
  ok(/^I can /.test(p.iCan || ''), `${tag}: iCan must start "I can"`);
  ok(/\bQuill\b/.test(p.story || ''), `${tag}: the story is Quill's`);
  ok(p.learn && typeof p.learn.why === 'string' && Array.isArray(p.learn.example) && p.learn.example.length >= 2, `${tag}: learn needs why and examples`);
  const d = p.desk || {};
  ok(Array.isArray(d.prompts) && d.prompts.length === 6 && d.prompts.every((x) => typeof x === 'string' && x.trim()), `${tag}: needs six prompts`);
  ok(Array.isArray(d.parts) && d.parts.length >= 2 && d.parts.every((x) => Array.isArray(x) && x.length === 2 && x.every((y) => typeof y === 'string' && y.trim())), `${tag}: parts must be [label, hint] pairs`);
  ok(Array.isArray(d.check) && d.check.length >= 3 && d.check.every((x) => typeof x === 'string' && x.trim()), `${tag}: needs a checklist`);
  ok(d.min === 4, `${tag}: min must be 4`);
  ok(d.unit === 'lines', `${tag}: a poem is counted in lines (unit: 'lines')`);
  // The one quoted line in its learn is Stevenson's own.
  checkQuote('I have a little shadow that goes in and out with me,', 'garden-verses', `${tag} learn example`);
  ok(p.learn.example[0].includes('I have a little shadow that goes in and out with me,'), `${tag}: the learn example's quotation changed — re-check it`);
}

const items = GAP_STOPS.reduce((a, s) => a + s.items.length, 0);
if (fails.length) {
  console.error(`gap-stops: ${fails.length} of ${checks} failed`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`gap-stops: all ${checks} passed (${GAP_STOPS.length} stops + the poem desk, ${items} items, answer slots ${slots.join('/')})`);
