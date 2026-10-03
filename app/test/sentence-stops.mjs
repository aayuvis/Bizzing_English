// The Sentence strand's written stops, levels 6–10 (data/sentence-stops.js), held to the rules
// (CLAUDE.md rules 2 and 6): ids s<6–10>-<slug> on their level, two stops a level, at least 12 items a
// stop; every question fair (one right answer, three distinct wrong ones, the answer not in the question
// or its quoted line unless every option is in it — a which-word item — and the right answer not the
// longest by over 40%); every quotation an exact (whitespace-collapsed) substring of a held text whose
// work is cleared in all three markets, and never containing its own answer. Then every item is run
// through the item engine (items.js kind `authored`), as test/items.mjs does: exactly one right option,
// distinct options, no favourite answer slot.
//
//   node app/test/sentence-stops.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
// The same normalising and whole-phrase match as test/items.mjs.
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

// ── Stops ───────────────────────────────────────────────────────────────────
const ids = new Set();
for (const s of SENTENCE_STOPS) {
  const tag = `stop ${s.id}`;
  ok(!ids.has(s.id), `${tag}: duplicate id`);
  ids.add(s.id);
  ok(/^s([6-9]|10)-[a-z0-9-]+$/.test(s.id), `${tag}: id must be s<6–10>-<slug>`);
  ok(Number.isInteger(s.level) && s.level >= 6 && s.level <= 10, `${tag}: level must be 6–10`);
  ok(s.id.startsWith(`s${s.level}-`), `${tag}: id does not match level ${s.level}`);
  ok(s.band === 2 || s.band === 3, `${tag}: band must be 2 or 3`);
  for (const k of ['title', 'iCan', 'story']) ok(typeof s[k] === 'string' && s[k].trim(), `${tag}: missing ${k}`);
  ok(/^I can /.test(s.iCan || ''), `${tag}: iCan must start "I can"`);
  ok(/\bQuill\b/.test(s.story || ''), `${tag}: the story is Quill's`);
  ok(s.learn && typeof s.learn.why === 'string' && s.learn.why.trim(), `${tag}: learn.why missing`);
  ok(Array.isArray(s.learn?.example) && s.learn.example.length >= 2 && s.learn.example.length <= 3, `${tag}: learn.example needs 2–3`);
  ok(Array.isArray(s.sources), `${tag}: sources[] missing`);
  ok(s.needsReview === undefined || typeof s.needsReview === 'boolean', `${tag}: needsReview must be true or false`);

  ok(Array.isArray(s.items) && s.items.length >= 12, `${tag}: needs at least 12 items (has ${s.items?.length || 0})`);
  (s.items || []).forEach((it, n) => {
    const qt = `${tag} item ${n + 1}`;
    ok(typeof it.q === 'string' && it.q.trim(), `${qt}: missing q`);
    ok(typeof it.right === 'string' && it.right.trim(), `${qt}: missing right`);
    if (!ok(Array.isArray(it.wrong) && it.wrong.length === 3 && it.wrong.every((w) => typeof w === 'string' && w.trim()), `${qt}: needs exactly 3 wrong answers`)) return;
    const opts = [it.right, ...it.wrong];
    ok(new Set(opts.map(norm)).size === opts.length, `${qt}: options are not distinct`);
    // The answer is not in the question or its line — unless every option is (a which-word item).
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
  });
}
for (let l = 6; l <= 10; l++) ok(SENTENCE_STOPS.filter((s) => s.level === l).length >= 2, `level ${l}: needs two stops`);

// ── Through the engine (as test/items.mjs draws them) ──────────────────────
const fresh = SENTENCE_STOPS.filter((s) => !AUTHORED.has(s.id));
addAuthored(fresh);
const slots = [0, 0, 0, 0];
for (const s of SENTENCE_STOPS) {
  const ks = keys('authored', { stop: s.id, band: 3 });
  ok(ks.length === s.items.length, `stop ${s.id}: the engine draws ${ks.length} of ${s.items.length} items`);
  for (const k of ks) {
    const it = make('authored', k, { stop: s.id, band: 3 });
    ok(it.type === 'mc' && it.options.length === 4, `${it.id}: not a four-option question`);
    ok(new Set(it.options.map(norm)).size === 4, `${it.id}: options repeat`);
    ok(check(it, it.answer) && it.options.every((_, i) => i === it.answer || !check(it, i)), `${it.id}: not exactly one right option`);
    const right = it.options[it.answer];
    if (it.select) ok(it.options.every((o) => inText(o, it.prompt + ' ' + (it.sub || ''))), `${it.id}: a which-word question whose options are not all in its line`);
    else ok(!inText(right, it.prompt) && !inText(right, it.sub || ''), `${it.id}: the answer "${right}" is in the question`);
    slots[it.answer]++;
  }
}
const total = slots.reduce((a, b) => a + b, 0);
slots.forEach((c, i) => ok(c / total >= 0.1 && c / total <= 0.4, `slot ${i + 1} holds ${Math.round((c / total) * 100)}% of answers`));

const items = SENTENCE_STOPS.reduce((a, s) => a + s.items.length, 0);
if (fails.length) {
  console.error(`sentence-stops: ${fails.length} of ${checks} failed`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`sentence-stops: all ${checks} passed (${SENTENCE_STOPS.length} stops, ${items} items, answer slots ${slots.join('/')})`);
