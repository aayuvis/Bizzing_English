#!/usr/bin/env node
/* story-prompts.mjs — the painting prompt for every story and chapter, taken from the data itself. */
import { writeFileSync, existsSync } from 'node:fs';
const ROOT = new URL('../../', import.meta.url);
const out = {};
const { PASSAGES } = await import(new URL('app/src/data/library.js', ROOT));
for (const p of PASSAGES) { if (p.paint) out[`story-${p.id}`] = p.paint; if (p.paint2) out[`story-${p.id}-2`] = p.paint2; }
const bk = new URL('app/src/data/book-alice.js', ROOT);
if (existsSync(bk)) { const { BOOK } = await import(bk); for (const c of BOOK.chapters) out[`book-alice-${c.n}`] = c.paint; }
writeFileSync(new URL('tools/art/story-prompts.json', ROOT), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out).length, 'prompts');
