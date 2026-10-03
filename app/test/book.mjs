// Every whole book, held to its rules (docs/00-spec.md §4): chapters in order, cut from the held
// text without gaps or overlaps, scenes at paragraph starts, the character list growing
// without spoiling ahead, every line verbatim, every word in its chapter, fair questions,
// grown-up notes where a chapter needs review, and the built json up to date. Each
// app/src/data/book-<id>.js is tested.
//
//   node app/test/book.mjs

import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readText } from '../../tools/texts/levels.mjs';
import { buildBook, locateBook, serialise, outFile, srcFile, bookIds } from '../../tools/texts/book.mjs';

const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (text, w) => new RegExp(`(^|[^A-Za-z])${esc(w)}($|[^A-Za-z])`, 'i').test(text);
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'her', 'his',
  'its', 'she', 'he', 'it', 'they', 'them', 'their', 'was', 'were', 'had', 'has', 'have', 'is', 'are', 'be', 'that', 'this',
  'what', 'who', 'why', 'how', 'did', 'does', 'do', 'not', 'very', 'all', 'one', 'own', 'some', 'into', 'out', 'up', 'down',
  'would', 'could', 'should', 'there', 'when', 'after', 'before', 'about', 'only', 'because']);

// How each held text heads its chapters, and what keeps each book's pictures the same.
const HEADING = {
  alice: /^CHAPTER ([IVXL]+)\. (.+)$/gm,
  default: /^([IVXL]+)\. ([^a-z\n]+)$/gm,   // "I. THE RIVER BANK": a capitals-only line
};
const KEEP = {
  alice: { all: [/blue dress and white pinafore/] },
  wind: {
    all: [/Edwardian clothes/],
    // Whoever is named in a picture is drawn as the same animal every time.
    Mole: /small velvety black mole/, Ratty: /brown water rat in a straw boater/,
    Badger: /big grey badger with a white stripe/, Toad: /stout green toad/,
  },
};

const ids = bookIds();
ok(ids.includes('alice') && ids.length >= 2, `expected Alice and at least one more book, found ${ids.join(', ')}`);
for (const id of ids) {
  const { BOOK } = await import(pathToFileURL(srcFile(id)).href);
  testBook(id, BOOK);
}

function testBook(id, BOOK) {
const P = `${id}: `;
const ok1 = (cond, msg) => ok(cond, P + msg);
const hero = BOOK.chapters[0]?.meet[0];   // the first character met: Alice, the Mole…
const stop = new Set([...STOP, ...norm(hero?.name || '').split(' ')]);
const content = (s) => norm(s).split(' ').filter((w) => w.length >= 4 && !stop.has(w));

const text = readText(BOOK.work);
ok1(text != null, `no held text for ${BOOK.work}`);

// ── The book's shape ─────────────────────────────────────────────────────────
ok1(BOOK.id === id && /^[a-z0-9-]+$/.test(BOOK.work) && BOOK.title && BOOK.author, 'book: id (its file name), work, title and author');
ok1(BOOK.chapters.length === 12, `book: expected 12 chapters, found ${BOOK.chapters.length}`);
BOOK.chapters.forEach((c, i) => ok1(c.n === i + 1, `chapter ${c.n}: out of order (position ${i + 1})`));

// ── Chapters cut from the text: in order, no overlap, nothing between but the headings ──
const { chapters: located, errors } = locateBook(BOOK, text);
for (const e of errors) ok1(false, e);
const headings = [...text.matchAll(HEADING[id] || HEADING.default)];
ok1(headings.length === BOOK.chapters.length, `text has ${headings.length} chapter headings, book has ${BOOK.chapters.length} chapters`);
if (!errors.length) {
  BOOK.chapters.forEach((c, i) => {
    const tag = `chapter ${c.n}`;
    const L = located[i];
    const h = headings[i];
    if (!ok1(h, `${tag}: no heading in the text`)) return;
    ok1(h[1] === ROMAN[i], `${tag}: heading is CHAPTER ${h[1]}`);
    const ht = h[2].trim();   // a capitals-only heading matches the title in any case
    ok1(ht === c.title || (ht === ht.toUpperCase() && ht === c.title.toUpperCase()), `${tag}: title ${JSON.stringify(c.title)} is not the text's ${JSON.stringify(ht)}`);
    // Between this heading and the chapter's start: nothing but whitespace.
    const before = text.slice(h.index + h[0].length, L.from);
    ok1(/^\s*$/.test(before), `${tag}: start skips text after the heading: ${JSON.stringify(before.trim().slice(0, 60))}`);
    // Between the chapter's end and the next heading (or THE END, or the end of the file): nothing but whitespace or a row of asterisks.
    const theEnd = text.indexOf('THE END');
    const next = headings[i + 1] ? headings[i + 1].index : theEnd >= 0 ? theEnd : text.length;
    const after = text.slice(L.to, next);
    ok1(/^[\s*]*$/.test(after), `${tag}: end leaves text before the next chapter: ${JSON.stringify(after.trim().slice(0, 60))}`);
    if (i > 0) ok1(L.from > located[i - 1].to, `${tag}: overlaps chapter ${c.n - 1}`);
    // Scenes start at the start of a paragraph, in order, inside the chapter.
    L.cuts.slice(1).forEach((at, k) => {
      ok1(/\n[ \t]*\n[ \t]*$/.test(text.slice(Math.max(0, at - 12), at)), `${tag}: scene ${k + 2} does not begin a paragraph: ${JSON.stringify(c.scenes[k])}`);
      ok1(at > L.cuts[k], `${tag}: scene ${k + 2} out of order`);
    });
  });
}

// ── Built json: up to date, and its scenes the right size ────────────────────
const built = buildBook(BOOK, text);
ok1(!built.errors.length, `build failed: ${built.errors.join('; ')}`);
const json = built.book ? serialise(built.book) : '';
const now = existsSync(outFile(BOOK.id)) ? readFileSync(outFile(BOOK.id), 'utf8') : '';
ok1(json && now === json, `book-${BOOK.id}.json is out of date: run node tools/texts/book.mjs ${BOOK.id}`);
const chapterText = new Map();
if (built.book) {
  for (const c of built.book.chapters) {
    chapterText.set(c.n, c.scenes.join('\n\n'));
    c.sceneWords.forEach((w, k) => ok1(w >= 100 && w <= 500, `chapter ${c.n}: scene ${k + 1} is ${w} words (100–500)`));
    ok1(c.scenes.length >= 5, `chapter ${c.n}: only ${c.scenes.length} scenes`);
  }
}

// ── Per chapter: line, words, characters, summary, questions ─────────────────
const metAt = new Map();   // id → chapter it is first met
for (const c of BOOK.chapters) for (const m of c.meet) { ok1(!metAt.has(m.id), `character ${m.id}: met twice (chapters ${metAt.get(m.id)} and ${c.n})`); if (!metAt.has(m.id)) metAt.set(m.id, c.n); }
ok1(hero && metAt.get(hero.id) === 1, 'the first character is met in chapter 1');
const names = new Map();   // id → names a summary could use
for (const c of BOOK.chapters) for (const m of c.meet) names.set(m.id, [m.name.replace(/^The /, ''), ...(m.also || [])]);
const inTitle = (cid) => names.get(cid).some((n) => hasWord(BOOK.title, n));   // Alice is in her title

for (const c of BOOK.chapters) {
  const tag = `chapter ${c.n}`;
  const body = chapterText.get(c.n) || '';

  ok1(typeof c.line === 'string' && c.line.length <= 160, `${tag}: line must be ≤ 160 characters`);
  ok1(body.includes(c.line), `${tag}: line is not an exact substring of the chapter: ${JSON.stringify(c.line)}`);

  ok1(c.words.length >= 4 && c.words.length <= 6, `${tag}: needs 4–6 words`);
  for (const w of c.words) ok1(hasWord(body, w), `${tag}: word "${w}" does not appear in the chapter`);

  for (const m of c.meet) {
    ok1(/^[a-z][a-z-]*$/.test(m.id) && m.name && typeof m.about === 'string' && m.about.length > 10, `${tag}: character ${m.id} needs id, name and about`);
    ok1(names.get(m.id).some((n) => hasWord(body, n.replace(/^[A-Z][a-z]*'s /, ''))), `${tag}: ${m.name} is not on the page in this chapter`);
    for (const later of metAt.keys()) {
      if (metAt.get(later) <= c.n || later === m.id) continue;
      ok1(!names.get(later).some((n) => hasWord(m.about, n)), `${tag}: ${m.id}'s note names ${later}, met in chapter ${metAt.get(later)}`);
    }
  }

  // The story so far: our own words, 1–3 sentences, never naming anyone not yet met.
  ok1(typeof c.sofar === 'string' && c.sofar.length > 20, `${tag}: needs sofar`);
  const sentences = (c.sofar.match(/[.!?](\s|$)/g) || []).length;
  ok1(sentences >= 1 && sentences <= 3, `${tag}: sofar is ${sentences} sentences (1–3)`);
  for (const [cid, n] of metAt) {
    if (inTitle(cid) || n < c.n) continue;   // a name in the title may be used; so may anyone met before this chapter
    const hit = names.get(cid).find((nm) => hasWord(c.sofar, nm));
    ok1(!hit, `${tag}: sofar names "${hit}" (${cid}), first met in chapter ${n}`);
  }

  ok1(typeof c.evaluate === 'string' && c.evaluate.trim().endsWith('?'), `${tag}: needs one evaluative question`);
  const keep = KEEP[id];
  ok1(keep, `no KEEP rule for this book's pictures`);
  ok1(typeof c.paint === 'string' && /no lettering/.test(c.paint) && /no signature/.test(c.paint), `${tag}: paint must ask for no lettering and no signature`);
  for (const re of keep?.all || []) ok1(re.test(c.paint || ''), `${tag}: paint loses ${re}`);
  for (const [who, re] of Object.entries(keep || {})) {
    if (who !== 'all' && hasWord(c.paint || '', who)) ok1(re.test(c.paint), `${tag}: paint names ${who} without drawing them the same way (${re})`);
  }

  // A note for grown-ups: our own words; a chapter that needs review always says why.
  if ('note' in c) ok1(typeof c.note === 'string' && c.note.length > 40, `${tag}: note must be a sentence or more for grown-ups`);
  if ('needsReview' in c) ok1(c.needsReview === true && typeof c.note === 'string', `${tag}: needsReview is true or absent, and comes with a note`);

  ok1(c.questions.length === 5, `${tag}: needs 5 questions`);
  ok1(c.questions.some((q) => q.depth === 'literal') && c.questions.some((q) => q.depth === 'inferential'), `${tag}: needs both literal and inferential questions`);
  c.questions.forEach((q, i) => {
    const qt = `${tag} q${i + 1}`;
    ok1(q.depth === 'literal' || q.depth === 'inferential', `${qt}: depth must be literal or inferential (evaluative is never machine-marked)`);
    ok1(typeof q.q === 'string' && q.q.trim().endsWith('?'), `${qt}: question must end with ?`);
    ok1(Array.isArray(q.wrong) && q.wrong.length === 3, `${qt}: needs exactly 3 distractors`);
    const opts = [q.right, ...(q.wrong || [])].map(norm);
    ok1(new Set(opts).size === opts.length, `${qt}: options are not distinct`);
    ok1(!norm(q.q).includes(norm(q.right)), `${qt}: the right answer appears in the question`);
    // No word of the right answer may sit in the question unless a wrong option shares it.
    const qw = new Set(content(q.q));
    const ww = new Set((q.wrong || []).flatMap(content));
    const leak = content(q.right).filter((w) => qw.has(w) && !ww.has(w));
    ok1(!leak.length, `${qt}: the right answer's word "${leak[0]}" is in the question`);
    const longestWrong = Math.max(...(q.wrong || []).map((s) => s.length));
    ok1(!(q.right.length > longestWrong * 1.4), `${qt}: right answer is the longest option by over 40% (${q.right.length} vs ${longestWrong})`);
  });
}

}

if (fails.length) {
  console.error(`book: ${fails.length} of ${checks} failed`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`book: all ${checks} passed`);
