#!/usr/bin/env node
// split-scripts.mjs — cuts docs/inkwell/season-one.md (Part 9 and Part 9b) into one script per case and per Ink Journey,
// so the validator can hold every doc body word for word against its own script (`validate-cases.mjs --scripts`).
//
//   node tools/inkwell/split-scripts.mjs            → tools/inkwell/scripts/case-00.md … case-11.md, journey-01.md … journey-04.md
//   node tools/inkwell/split-scripts.mjs --check    → exit 1 if a written script differs from the book (the gate runs this)
//
// The book is the source; these files are copies cut from it, never edited by hand. The only changes are the ones listed,
// with their reasons, in script-edits.mjs (for the owner to carry into the book).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyEdits, EDITS } from './script-edits.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BOOK = path.join(HERE, '..', '..', 'docs', 'inkwell', 'season-one.md');
const OUT = path.join(HERE, 'scripts');
const check = process.argv.includes('--check');

export function splitBook(text) {
  const lines = text.split('\n'), out = {};
  let cur = null;
  for (const line of lines) {
    const c = line.match(/^## CASE (\d+) — /), j = line.match(/^## JOURNEY (\d+) — /);
    if (c) { cur = `case-${String(c[1]).padStart(2, '0')}.md`; out[cur] = []; }
    else if (j) { cur = `journey-${String(j[1]).padStart(2, '0')}.md`; out[cur] = []; }
    else if (/^## (Part|Appendix) /.test(line)) cur = null;
    if (cur) out[cur].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, applyEdits(k, v.join('\n').replace(/\s+$/, '') + '\n')]));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const parts = splitBook(fs.readFileSync(BOOK, 'utf8'));
  const names = Object.keys(parts).sort();
  if (names.filter((n) => n.startsWith('case-')).length !== 12 || names.filter((n) => n.startsWith('journey-')).length !== 4) {
    console.error(`expected 12 case scripts and 4 journey scripts, found ${names.join(', ')}`); process.exit(1);
  }
  let bad = 0;
  if (!check) fs.mkdirSync(OUT, { recursive: true });
  for (const n of names) {
    const p = path.join(OUT, n);
    if (check) { if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== parts[n]) { console.log(`✗ ${n} differs from the book (run split-scripts.mjs)`); bad++; } }
    else fs.writeFileSync(p, parts[n]);
  }
  console.log(check ? `${names.length} scripts ${bad ? `· ${bad} stale` : `match the book (+ ${EDITS.length} listed edit${EDITS.length === 1 ? '' : 's'})`}` : `wrote ${names.length} scripts to ${path.relative(process.cwd(), OUT)}`);
  process.exit(bad ? 1 : 0);
}
