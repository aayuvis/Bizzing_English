// The Word strand's written stops (src/data/word-stops.js), held to the same rules as the Language
// strand's (CLAUDE.md rules 2, 6): ids unique and on their level (6, 8, 9, 10 — the empty Word levels
// these stops fill); at least 12 items a stop; three distinct wrong answers; the right answer not in
// the question (unless every option is in the question or the quoted line — a which-word item); the
// right answer never the longest by over 40%; every quotation an exact (whitespace-collapsed)
// substring of a held, cleared text; every word cited from Bizzing Bee's list really in the lexicon;
// any origin claim sourced and its stop under review; no spelling contest (rule 10).
//
//   node app/test/words.mjs          (PROBE=1 also proves each check can fail)

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORD_STOPS } from '../src/data/word-stops.js';
import { WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { level as curriculumLevel } from '../src/curriculum.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEX = JSON.parse(readFileSync(join(APP, 'public/data/bee-words.json'), 'utf8')).words;
const LEVELS = [6, 8, 9, 10];

const norm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();
const sourced = (x) => Array.isArray(x) && x.length > 0 && x.every((s) => typeof s === 'string' && s.trim().length > 8);
const ORIGIN = /\b(?:borrowed|came (?:in)?to English|came from|comes from|takes its name|named after|reached English|traces?|back to which language|first record)\b/i;
const CONTEST = /\b(?:spell(?:ing)? (?:contest|bee|race|battle)|spell it (?:out|aloud)|how do you spell|which spelling is correct)\b/i;

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

/* Every check, as a function of the stops, so a planted fault can prove it fails. */
function audit(stops) {
  const fails = [];
  let checks = 0;
  const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };
  const quote = (text, work, tag) => {
    const w = works.get(work);
    if (!ok(w, `${tag}: unknown work "${work}"`)) return;
    if (!ok(cleared(w), `${tag}: work "${work}" is not cleared in all three markets`)) return;
    const body = heldText(work);
    if (!ok(body, `${tag}: work "${work}" has no held text`)) return;
    ok(body.includes(collapse(text)), `${tag}: not found verbatim in ${work}: "${text}"`);
  };
  const bee = (list, tag) => {
    for (const s of list || []) {
      const m = /^Bizzing Bee word list: (.+)$/.exec(s);
      if (m) ok(Object.hasOwn(LEX, m[1]), `${tag}: cites "${m[1]}", which is not in Bizzing Bee's lexicon`);
    }
  };

  const ids = new Set();
  for (const s of stops) {
    const tag = `stop ${s.id}`;
    ok(!ids.has(s.id), `${tag}: duplicate id`);
    ids.add(s.id);
    ok(/^w(\d+)-[a-z0-9-]+$/.test(s.id), `${tag}: id must be w<level>-<slug>`);
    ok(LEVELS.includes(s.level), `${tag}: level must be one of ${LEVELS.join(', ')}`);
    ok(s.id.startsWith(`w${s.level}-`), `${tag}: id does not match level ${s.level}`);
    ok(curriculumLevel('word', s.level), `${tag}: no curriculum level ${s.level} in the word strand`);
    ok([1, 2, 3].includes(s.band), `${tag}: band must be 1, 2 or 3`);
    if (s.level === 10) ok(s.band === 3, `${tag}: Ready for the Bee is for ages 11–14`);
    for (const k of ['title', 'iCan', 'story']) ok(typeof s[k] === 'string' && s[k].trim(), `${tag}: missing ${k}`);
    ok(/^I can /.test(s.iCan || ''), `${tag}: iCan must start "I can"`);
    ok(/\bQuill\b/.test(s.story || ''), `${tag}: the story is Quill's`);
    ok(s.learn && typeof s.learn.why === 'string' && s.learn.why.trim(), `${tag}: learn.why missing`);
    ok(Array.isArray(s.learn?.example) && s.learn.example.length >= 2 && s.learn.example.length <= 3, `${tag}: learn.example needs 2–3`);
    ok(Array.isArray(s.sources), `${tag}: sources[] missing`);
    ok(typeof s.needsReview === 'boolean', `${tag}: needsReview must be true or false`);
    bee(s.sources, tag);
    const told = [s.story, s.learn?.why, ...(s.learn?.example || [])].join(' ');
    if (ORIGIN.test(told)) {
      ok(sourced(s.sources), `${tag}: story/learn makes an origin claim but sources[] is empty`);
      ok(s.needsReview === true, `${tag}: makes an origin claim, so needsReview must stay true`);
    }

    ok(Array.isArray(s.items) && s.items.length >= 12, `${tag}: needs at least 12 items (has ${s.items?.length || 0})`);
    (s.items || []).forEach((it, n) => {
      const qt = `${tag} item ${n + 1}`;
      ok(typeof it.q === 'string' && it.q.trim(), `${qt}: missing q`);
      ok(typeof it.right === 'string' && it.right.trim(), `${qt}: missing right`);
      ok(Array.isArray(it.wrong) && it.wrong.length === 3 && it.wrong.every((w) => typeof w === 'string' && w.trim()), `${qt}: needs exactly 3 wrong answers`);
      const opts = [it.right, ...(it.wrong || [])].map(norm);
      ok(new Set(opts).size === opts.length, `${qt}: options are not distinct`);
      // The answer is not in the question or its line — unless every option is there (a which-word item).
      const shown = norm(`${it.q || ''} ${it.quote || ''}`);
      const all = opts.every((o) => shown.includes(o));
      ok(all || !shown.includes(norm(it.right)), `${qt}: the right answer "${it.right}" appears in the question`);
      if (all) ok(/which word/i.test(it.q), `${qt}: every option is in the line, so it must ask "which word"`);
      const longestWrong = Math.max(...(it.wrong || ['']).map((w) => w.length));
      ok(!(it.right.length > longestWrong * 1.4), `${qt}: right answer is the longest option by over 40% (${it.right.length} vs ${longestWrong})`);
      ok(!CONTEST.test([it.q, it.right, ...(it.wrong || [])].join(' ')), `${qt}: English never runs a spelling contest — that is Bizzing Bee's`);
      if (ORIGIN.test([it.q, it.right, ...(it.wrong || [])].join(' '))) {
        ok(sourced(it.sources), `${qt}: makes an origin claim but has no sources[]`);
        ok(s.needsReview === true, `${qt}: an origin claim puts its stop under review`);
      }
      if ('sources' in it) { ok(sourced(it.sources), `${qt}: sources[] is empty`); bee(it.sources, qt); }
      if (it.quote !== undefined) {
        ok(typeof it.work === 'string', `${qt}: a quote needs its work`);
        quote(it.quote, it.work, qt);
      }
    });
  }
  for (const l of LEVELS) ok(stops.filter((s) => s.level === l).length >= 2, `level ${l}: needs two stops`);
  return { fails, checks };
}

const { fails, checks } = audit(WORD_STOPS);

/* Prove the checks can fail: plant one fault of each kind; the audit must name it (each key is a
   piece of the message its check prints, so a fault caught by some other check does not count). */
const clone = () => JSON.parse(JSON.stringify(WORD_STOPS));
const plants = {
  'appears in the question': (st) => { st[0].items[0].q += ` (${st[0].items[0].right})`; },
  'longest option': (st) => { st[0].items[1].right = 'a very much longer right answer than any wrong one'; },
  'not distinct': (st) => { st[2].items[0].wrong[0] = st[2].items[0].right; },
  'exactly 3 wrong': (st) => { st[2].items[1].wrong.pop(); },
  'not found verbatim': (st) => { const it = st.flatMap((s) => s.items).find((x) => x.quote); it.quote = it.quote.replace(/ /, '  x '); },
  'not cleared': (st) => { const it = st.flatMap((s) => s.items).find((x) => x.quote); it.work = 'peterpan'; },
  "not in Bizzing Bee's lexicon": (st) => { st[0].items[0].sources = ['Bizzing Bee word list: zzquillzz']; },
  'duplicate id': (st) => { st[1].id = st[0].id; },
  'does not match level': (st) => { st[0].level = 8; },
  'at least 12 items': (st) => { st[3].items = st[3].items.slice(0, 11); },
  'spelling contest': (st) => { st[6].items[0].q = "How do you spell 'loquacious'?"; },
  'origin claim but has no sources': (st) => { st[7].items[0].sources = undefined; delete st[7].items[0].sources; },
};
const blind = [];
for (const [name, plant] of Object.entries(plants)) {
  const st = clone(); plant(st);
  if (!audit(st).fails.some((f) => f.includes(name))) blind.push(name);
}

const items = WORD_STOPS.reduce((a, s) => a + s.items.length, 0);
if (fails.length || blind.length) {
  console.error(`words: ${fails.length} of ${checks} failed${blind.length ? `; blind to: ${blind.join(', ')}` : ''}`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`words: all ${checks} passed (${WORD_STOPS.length} stops, ${items} items; ${Object.keys(plants).length} planted faults all caught)`);
