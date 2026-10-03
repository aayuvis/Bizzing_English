#!/usr/bin/env node
// Cut a whole book into chapters and scenes from its held text, level each chapter, and write
// app/src/data/book-<id>.json (docs/00-spec.md §4, "A whole book").
//
//   node tools/texts/book.mjs           # write book-alice.json
//   node tools/texts/book.mjs --check   # exit 1 if it is out of date
//
// The chapter list, summaries, characters and questions live in app/src/data/book-<id>.js;
// this file only adds the text. Each chapter runs from its `start` to its `end` (inclusive),
// searched in order through the held file; each scene marker starts a new scene. Text is
// whitespace-normalised: one paragraph per line run, paragraphs separated by a blank line,
// and a row of asterisks (the book's own break) becomes "* * *".

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT, looseRegex, readText, measure } from './levels.mjs';

export const BOOKS = ['alice'];
export const outFile = (id) => join(ROOT, 'app', 'src', 'data', `book-${id}.json`);
export const srcFile = (id) => join(ROOT, 'app', 'src', 'data', `book-${id}.js`);

/** Find `s` (any whitespace run matching any other) at or after `from`. */
export function find(text, s, from = 0) {
  const re = looseRegex(s);
  re.lastIndex = from;
  const m = re.exec(text);
  return m ? { at: m.index, to: m.index + m[0].length } : null;
}

export function normalise(raw) {
  return raw.replace(/\r/g, '').split(/\n\s*\n/)
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .map((p) => (/^(\*\s*)+$/.test(p) ? '* * *' : p))
    .join('\n\n');
}

/** Locate every chapter and scene in the held text. Returns { chapters: [{from, to, cuts}], errors }. */
export function locateBook(book, text) {
  const errors = [];
  const out = [];
  let pos = 0;
  for (const c of book.chapters) {
    const tag = `chapter ${c.n}`;
    const s = find(text, c.start, pos);
    if (!s) { errors.push(`${tag}: start not found after the previous chapter: ${JSON.stringify(c.start)}`); continue; }
    const e = find(text, c.end, s.at);
    if (!e) { errors.push(`${tag}: end not found after its start: ${JSON.stringify(c.end)}`); continue; }
    const cuts = [s.at];
    let at = s.at;
    for (const m of c.scenes || []) {
      const f = find(text, m, at + 1);
      if (!f || f.at >= e.at) { errors.push(`${tag}: scene marker not found in order inside the chapter: ${JSON.stringify(m)}`); continue; }
      cuts.push(f.at);
      at = f.at;
    }
    out.push({ n: c.n, from: s.at, to: e.to, cuts });
    pos = e.to;
  }
  return { chapters: out, errors };
}

export function buildBook(book, text) {
  const { chapters: located, errors } = locateBook(book, text);
  if (errors.length) return { errors };
  const chapters = book.chapters.map((c, i) => {
    const L = located[i];
    const bounds = [...L.cuts, L.to];
    const scenes = L.cuts.map((from, k) => normalise(text.slice(from, bounds[k + 1])));
    const body = scenes.join('\n\n');
    const m = measure(body);
    return {
      n: c.n, title: c.title,
      words: m.words, sentences: m.sentences, syllables: m.syllables, fk: m.fk, level: Math.max(0, m.fk),
      sceneWords: scenes.map((s) => measure(s).words),
      sofar: c.sofar,
      meet: c.meet.map(({ id, name, about }) => ({ id, name, about })),
      questions: c.questions, evaluate: c.evaluate, wordBank: c.words,
      line: c.line, paint: c.paint,
      scenes,
    };
  });
  return {
    book: { id: book.id, work: book.work, title: book.title, author: book.author, chapters },
    errors: [],
  };
}

export const serialise = (b) => JSON.stringify(b, null, 2) + '\n';

export async function loadBook(id) {
  const { BOOK } = await import(pathToFileURL(srcFile(id)).href);
  return BOOK;
}

async function main() {
  const check = process.argv.includes('--check');
  let bad = false;
  for (const id of BOOKS) {
    const book = await loadBook(id);
    const text = readText(book.work);
    if (text == null) { console.error(`${id}: no held text for ${book.work}`); process.exit(1); }
    const { book: built, errors } = buildBook(book, text);
    if (errors.length) { for (const e of errors) console.error('  ' + e); process.exit(1); }
    const json = serialise(built);
    const out = outFile(id);
    if (check) {
      const now = existsSync(out) ? readFileSync(out, 'utf8') : '';
      if (now !== json) { console.error(`book-${id}.json is out of date: run node tools/texts/book.mjs`); bad = true; }
      else console.log(`book-${id}.json is up to date`);
      continue;
    }
    writeFileSync(out, json);
    for (const c of built.chapters) {
      console.log(`  ${String(c.n).padStart(2)}  ${c.title.padEnd(34)} ${String(c.words).padStart(5)} words  FK ${String(c.fk).padStart(4)}  ${c.scenes.length} scenes (${c.sceneWords.join(' ')})`);
    }
    const words = built.chapters.reduce((n, c) => n + c.words, 0);
    console.log(`book: ${built.title}: ${built.chapters.length} chapters, ${words} words, written to app/src/data/book-${id}.json`);
  }
  if (bad) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
