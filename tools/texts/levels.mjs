#!/usr/bin/env node
// Cut each passage in app/src/data/library.js out of its held text, level it, and write
// app/src/data/passages.json (imported lazily by the app).
//
//   node tools/texts/levels.mjs           # write passages.json
//   node tools/texts/levels.mjs --check   # exit 1 if passages.json is out of date
//
// Level: Flesch–Kincaid grade, computed here. Verse and archaic prose carry a hand
// `fkOverride` in library.js (FK counts sentences, and a poem's sentences are not prose
// sentences); `level` is the override when there is one, else the computed grade.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');
const TEXTS = join(ROOT, 'app', 'public', 'texts');
export const OUT = join(ROOT, 'app', 'src', 'data', 'passages.json');
export const RETOLD = 'Retold for younger readers — the original is in the Library';

// A start/end string matches the text with any run of whitespace standing for any other.
export function looseRegex(s) {
  const parts = s.trim().split(/\s+/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(parts.join('\\s+'), 'g');
}

export function locate(text, start, end) {
  const rs = looseRegex(start);
  const ms = rs.exec(text);
  if (!ms) return { error: `start not found: ${JSON.stringify(start)}` };
  const re = looseRegex(end);
  re.lastIndex = ms.index;
  const me = re.exec(text);
  if (!me) return { error: `end not found after start: ${JSON.stringify(end)}` };
  return { from: ms.index, to: me.index + me[0].length };
}

export const GATED = join(ROOT, 'tools', 'texts', 'gated');   // held, but not cleared in all three markets (data/rights.js)
export function readText(work) {
  for (const d of [TEXTS, GATED]) { const f = join(d, `${work}.txt`); if (existsSync(f)) return readFileSync(f, 'utf8'); }
  return null;
}
/* What the app ships: passages of works cleared in all three markets only. */
export const shipped = (passages, WORKS, cleared) => passages.filter((p) => cleared(WORKS.find((w) => w.id === p.work)));

// Prose: paragraphs joined into single lines. Verse: lines kept, common indent removed.
export function shape(raw, p) {
  let t = raw.replace(/\r/g, '');
  if (p.stripLineNumbers) t = t.replace(/[ \t]{2,}\d+[ \t]*$/gm, '');
  const lines = t.split('\n').map((l) => l.replace(/\s+$/, ''));
  if (p.kind === 'verse') {
    // An editor's item numbers between poems (Lear's "2.") are not part of the verse.
    for (let i = lines.length - 1; i >= 0; i--) if (/^\s*\d+\.$/.test(lines[i])) lines.splice(i, 1);
    const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(ind)).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\s+$/g, '');
  }
  return lines.join('\n').split(/\n\s*\n/).map((para) => para.trim().replace(/\s+/g, ' ')).filter(Boolean).join('\n\n');
}

export function syllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function measure(raw) {
  // An ellipsis (or PG #4's '. . .' for a dash) is a pause, not a sentence end.
  const text = raw.replace(/\.(\s*\.){2,}/g, ',');
  const words = text.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  const sentences = Math.max(1, (text.match(/[.!?]+(?=["'’”)\]]*(\s|$))/g) || []).length);
  const syl = words.reduce((n, w) => n + w.split('-').reduce((m, part) => m + syllables(part), 0), 0);
  const n = Math.max(1, words.length);
  const fk = 0.39 * (n / sentences) + 11.8 * (syl / n) - 15.59;
  return { words: words.length, sentences, syllables: syl, fk: Math.round(fk * 10) / 10 };
}

export function buildPassages(PASSAGES) {
  const out = [];
  const errors = [];
  for (const p of PASSAGES) {
    const text = readText(p.work);
    if (text == null) { errors.push(`${p.id}: no held text for ${p.work}`); continue; }
    const at = locate(text, p.start, p.end);
    if (at.error) { errors.push(`${p.id}: ${at.error}`); continue; }
    // Verse keeps its indentation, so cut from the start of the line the poem begins on.
    const from = p.kind === 'verse' ? text.lastIndexOf('\n', at.from) + 1 : at.from;
    const body = shape(text.slice(from, at.to), p);
    const m = measure(body);
    out.push({
      id: p.id, work: p.work, title: p.title, band: p.band, kind: p.kind,
      abridged: !!p.abridged, ...(p.abridged ? { label: RETOLD } : {}),
      text: body,
      fk: m.fk, ...(p.fkOverride != null ? { fkOverride: p.fkOverride } : {}),
      level: p.fkOverride != null ? p.fkOverride : Math.max(0, m.fk),
      words: m.words, sentences: m.sentences, syllables: m.syllables,
      questions: p.questions, evaluate: p.evaluate, wordBank: p.words,
      ...(p.needsReview ? { needsReview: true, reviewNote: p.reviewNote } : {}),
    });
  }
  return { passages: out, errors };
}

export const serialise = (passages) => JSON.stringify(passages, null, 2) + '\n';

async function main() {
  const { PASSAGES, WORKS } = await import(pathToFileURL(join(ROOT, 'app', 'src', 'data', 'library.js')).href);
  const { cleared } = await import(pathToFileURL(join(ROOT, 'app', 'src', 'data', 'rights.js')).href);
  const { passages: all, errors } = buildPassages(PASSAGES);
  if (errors.length) { for (const e of errors) console.error('  ' + e); process.exit(1); }
  const passages = shipped(all, WORKS, cleared);
  const json = serialise(passages);
  if (process.argv.includes('--check')) {
    const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (now !== json) { console.error('passages.json is out of date: run node tools/texts/levels.mjs'); process.exit(1); }
    console.log('passages.json is up to date');
    return;
  }
  writeFileSync(OUT, json);
  for (const p of passages) {
    console.log(`  ${p.id.padEnd(24)} band ${p.band}  ${String(p.words).padStart(4)} words  FK ${String(p.fk).padStart(5)}${p.fkOverride != null ? `  (level ${p.fkOverride}, hand-set)` : ''}`);
  }
  console.log(`levels: ${passages.length} passages written to app/src/data/passages.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
