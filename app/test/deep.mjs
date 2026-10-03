// The Library's deep dives (src/data/deep.js): the Greek myths as a journey, and the authors' pages.
// Held to CLAUDE.md rules 1, 2, 4, 6 and the "never write history from memory" rule:
// - every myth stop resolves to a shipped myth passage, and every myth passage is on the journey once;
// - every myth word shown has an exact quotation in its held text; a word whose entry asks a reviewer to
//   confirm the link first is not shown;
// - every Who's who quotation is exact in the passage it names (or in Bulfinch's held book, for a
//   Greek name), and every figure is named in the passage it cites;
// - every author's works exist; a gated author has no passage, line or quiz served;
// - NO YEAR IS TYPED in deep.js: every four-digit number in the file must appear in the data of the
//   works it is about; an author's death year is read from a rights note, never written;
// - every quiz item is a passage's own question, reused exactly: one right answer, distinct options,
//   the answer not in the question, no answer slot over 35% (per author, and over all);
// - the routes the pages link to exist (stops, stage rooms, story ids, author ids).
// Each check is proven by breaking it at the end.
//
//   node app/test/deep.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from '../src/data/deep.js';
import { WORKS, PASSAGES } from '../src/data/library.js';
import { MYTH_PASSAGES } from '../src/data/library-myths.js';
import { MYTH_WORDS } from '../src/data/myth-words.js';
import { cleared } from '../src/data/rights.js';
import { stopById } from '../src/curriculum.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();
const norm = (s) => ` ${String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const work = (id) => WORKS.find((w) => w.id === id);
const built = new Map(JSON.parse(readFileSync(join(APP, 'src/data/passages.json'), 'utf8')).map((p) => [p.id, p]));
const held = new Map();
function heldText(id) {
  if (!held.has(id)) { const w = work(id); const f = w?.held && cleared(w) && w.file && join(APP, 'public', w.file); held.set(id, f && existsSync(f) ? collapse(readFileSync(f, 'utf8')) : null); }
  return held.get(id);
}
const inPassage = (q, pid) => !!built.get(pid) && collapse(built.get(pid).text).includes(collapse(q));
const inWork = (q, wid) => !!heldText(wid) && heldText(wid).includes(collapse(q));

function audit(d) {
  const f = [];
  const bad = (c, m) => { if (!c) f.push(m); };
  // ── the myths ──
  const stops = d.MYTH_JOURNEY.flatMap((r) => r.stops);
  for (const id of stops) {
    const p = MYTH_PASSAGES.find((x) => x.id === id);
    bad(p, `myth stop ${id}: not a myth passage`);
    bad(p && cleared(work(p.work)) && built.has(id), `myth stop ${id}: not a shipped passage`);
  }
  for (const p of MYTH_PASSAGES) bad(stops.filter((x) => x === p.id).length === 1, `myth ${p.id}: must be on the journey exactly once`);
  for (const r of d.MYTH_JOURNEY) bad(r.title && r.note && r.stops.length, `region ${r.id}: needs a title, a note and stops`);
  for (const id of stops) for (const m of d.mythWords(id)) {
    bad(m.quote && inWork(m.quote, m.work), `word ${m.word}: quote not exact in ${m.work}`);
    bad(!d.heldBack(m), `word ${m.word}: its entry asks a reviewer to confirm the link first`);
  }
  bad(MYTH_WORDS.filter((m) => !d.heldBack(m)).every((m) => stops.includes(m.passage)), 'a myth word belongs to a myth not on the journey');
  for (const s of d.WORD7) bad(stopById(s.id), `Word 7 stop ${s.id} does not exist`);
  const groups = new Set(d.WHO_GROUPS.map((g) => g[0]));
  for (const c of d.WHO) {
    const tag = `who ${c.name}`;
    bad(groups.has(c.group), `${tag}: unknown group`);
    bad(stops.includes(c.passage), `${tag}: cites ${c.passage}, not a myth on the journey`);
    bad(inPassage(c.quote, c.passage), `${tag}: quote not exact in ${c.passage}: "${c.quote}"`);
    const first = c.name.replace(/^The /, '').split(' ')[0];
    bad(norm(built.get(c.passage)?.text || '').includes(norm(first)), `${tag}: the name is not in the passage it cites`);
    for (const x of [c.greek, c.also].filter(Boolean)) {
      bad(x.passage ? inPassage(x.quote, x.passage) : inWork(x.quote, x.work), `${tag}: extra quote not exact: "${x.quote}"`);
    }
    if (c.greek) bad(norm(c.greek.quote).includes(norm(c.greek.name.split(' ').pop())) && norm(c.greek.quote).includes(norm(c.greek.as || first)), `${tag}: the Greek pairing quote must name both`);
  }
  bad(inWork(d.NAMES_NOTE.quote, d.NAMES_NOTE.work), 'names note: quote not exact');
  // ── the authors ──
  const ids = new Set();
  for (const a of d.AUTHORS) {
    const tag = `author ${a.id}`;
    bad(!ids.has(a.id), `${tag}: duplicate`); ids.add(a.id);
    bad(a.works.length && a.works.every(work), `${tag}: a work is missing`);
    const ws = a.works.map(work).filter(Boolean);
    const names = new Set(ws.map((w) => w.author));
    bad(names.size === 1, `${tag}: works by more than one author string`);
    bad(WORKS.filter((w) => names.has(w.author)).every((w) => a.works.includes(w.id)), `${tag}: a work by this author is left off`);
    if (d.isGated(a)) {
      bad(!d.authorPassages(a).length && !d.authorLines(a).length && !d.quizFor(a).length, `${tag}: gated, yet passages, lines or a quiz are served`);
    }
    const life = d.lifeNote(a);
    if (life) bad(life.basis.includes(`died ${life.year}`) && a.works.includes(life.work.id), `${tag}: life note not read from a rights note`);
    for (const s of a.speak || []) {
      const m = /^#\/stage\/(?:aloud\/([a-z0-9-]+)|(contest)|([a-z0-9-]+))$/.exec(s.href);
      bad(m, `${tag}: speak link ${s.href} is not a Stage route`);
      if (m?.[1]) bad(d.authorPassages(a).some((p) => p.id === m[1]), `${tag}: ${s.href} is not one of their shipped passages`);
      if (m?.[3]) bad(stopById(m[3])?.speak, `${tag}: ${s.href} is not a speaking stop`);
    }
    if (a.wordsStop) bad(d.langStop(a.wordsStop)?.learn?.why, `${tag}: words stop ${a.wordsStop} missing`);
    if (a.howTo) bad(d.langStop(a.howTo)?.learn?.why, `${tag}: how-to stop ${a.howTo} missing`);
    for (const r of a.retold || []) bad(work(r.work) && PASSAGES.some((p) => p.id === r.passage && p.work === r.work), `${tag}: retelling ${r.work}/${r.passage} missing`);
    for (const x of d.whyRead(a)) bad(typeof x.why === 'string' && x.why === x.work.why, `${tag}: "why read" must be the work's own why`);
    // the quiz
    const quiz = d.quizFor(a), slots = [0, 0, 0, 0];
    bad(quiz.length % 4 === 0 && quiz.length <= 8, `${tag}: quiz must be 4 or 8 long (is ${quiz.length})`);
    if (!d.isGated(a) && d.authorPassages(a).some((p) => p.questions?.length >= 1)) bad(quiz.length >= 4, `${tag}: has passages with questions but no quiz`);
    const seen = new Set();
    for (const it of quiz) {
      const [pid, qi] = it.id.split(':'), p = d.authorPassages(a).find((x) => x.id === pid), q = p?.questions?.[+qi];
      bad(q, `${tag} ${it.id}: not one of their passages' questions`);
      if (!q) continue;
      bad(q.q === it.q && q.right === it.right && it.options[it.answer] === q.right, `${tag} ${it.id}: not reused exactly`);
      bad([q.right, ...q.wrong].every((o) => it.options.includes(o)) && it.options.length === 4, `${tag} ${it.id}: options are not the question's own`);
      bad(new Set(it.options.map(norm)).size === 4, `${tag} ${it.id}: options not distinct`);
      bad(it.options.filter((o) => o === q.right).length === 1, `${tag} ${it.id}: more than one right option`);
      bad(!norm(it.q).includes(norm(it.right)), `${tag} ${it.id}: the answer is in the question`);
      bad(!seen.has(it.id), `${tag} ${it.id}: asked twice`); seen.add(it.id);
      slots[it.answer]++; ALL[it.answer]++;
    }
    if (quiz.length) bad(Math.max(...slots) / quiz.length <= 0.35, `${tag}: an answer slot holds ${Math.max(...slots)} of ${quiz.length}`);
  }
  // ── no year typed by hand ──
  const src = d.__source ?? readFileSync(join(APP, 'src/data/deep.js'), 'utf8');
  const dataOf = JSON.stringify(d.AUTHORS.flatMap((a) => a.works.map(work)).concat(['wonderbook', 'tanglewood', 'heroes', 'bulfinch'].map(work)));
  for (const y of src.match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || []) bad(dataOf.includes(y), `deep.js types the year ${y}, which no work's data states`);
  for (const a of d.AUTHORS) {
    const own = JSON.stringify(a.works.map(work));
    for (const y of JSON.stringify(a).match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || []) bad(own.includes(y), `author ${a.id}: the year ${y} is not in their works' data`);
  }
  return f;
}

const ALL = [0, 0, 0, 0];
const real = audit(D);
for (const m of real) console.log('✗', m);
const total = ALL.reduce((a, b) => a + b, 0);
if (total) { const top = Math.max(...ALL) / total; if (top > 0.35) { real.push('all quizzes: a slot over 35%'); console.log('✗ all quizzes: a slot holds', (top * 100).toFixed(0) + '%'); } }

// ── prove the checks by breaking them ──
const clone = (o) => ({ ...D, ...o });
const breaks = [
  ['a myth stop that is not a passage', clone({ MYTH_JOURNEY: [...D.MYTH_JOURNEY, { id: 'x', title: 'x', note: 'x', stops: ['bulfinch-prometheus'] }] })],
  ['a myth left off the journey', clone({ MYTH_JOURNEY: D.MYTH_JOURNEY.slice(1) })],
  ['a Who’s who quote changed by one word', clone({ WHO: [{ ...D.WHO[0], quote: D.WHO[0].quote.replace('Juno', 'Jupiter') }, ...D.WHO.slice(1)] })],
  ['a Greek name quoted from nowhere', clone({ WHO: [{ ...D.WHO[0], greek: { name: 'Hera', quote: 'Juno was called Hera by the Greeks', work: 'bulfinch' } }, ...D.WHO.slice(1)] })],
  ['a figure who is not in the passage cited', clone({ WHO: [{ ...D.WHO[0], name: 'Apollo' }, ...D.WHO.slice(1)] })],
  ['a year typed by hand', clone({ __source: 'const born = 1564;' })],
  ['an author year not in their data', clone({ AUTHORS: [{ ...D.AUTHORS[0], note: 'born 1564' }, ...D.AUTHORS.slice(1)] })],
  ['a quiz that is not their question', clone({ quizFor: (a) => D.quizFor(a).map((it, i) => (i ? it : { ...it, right: 'Something else', options: ['Something else', ...it.options.slice(1)], answer: 0 })) })],
  ['a quiz with a favourite slot', clone({ quizFor: (a) => D.quizFor(a).map((it) => { const o = it.options.filter((x) => x !== it.right); return { ...it, options: [it.right, ...o], answer: 0 }; }) })],
  ['a gated author served', clone({ isGated: (a) => a.id === 'shakespeare' })],
  ['a Stage link to a passage not theirs', clone({ AUTHORS: [{ ...D.AUTHORS[0], speak: [{ label: 'x', href: '#/stage/aloud/gettysburg-address' }] }, ...D.AUTHORS.slice(1)] })],
  ['a work left off an author', clone({ AUTHORS: [{ ...D.AUTHORS[0], works: D.AUTHORS[0].works.slice(1) }, ...D.AUTHORS.slice(1)] })],
];
let proven = 0;
for (const [name, d] of breaks) { ALL.fill(0); const f = audit(d); if (f.length) proven++; else { console.log('✗ blind check:', name); real.push('blind: ' + name); } }

const nq = D.AUTHORS.reduce((a, x) => a + D.quizFor(x).length, 0);
console.log(`deep: ${D.mythStops().length} myths on the journey, ${D.WHO.length} Who's who cards, ${D.AUTHORS.length} authors, ${nq} quiz items; ${proven}/${breaks.length} breaks caught`);
if (real.length) { console.log(`deep: ${real.length} failures`); process.exit(1); }
console.log('deep: ok');
