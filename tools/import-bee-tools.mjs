#!/usr/bin/env node
/* import-bee-tools.mjs — the Tools tab's borrowings from Bizzing Bee, read from a PINNED Bee commit
   (the owner, 3 Oct 2026: "take Vocabulary, Idioms & Similes and the Typing Trainer directly from Bee").

     app/src/data/idioms.json   Bee's figurative data (window.SB_FIG, figurative-data.js): every kid-safe
                                idiom, proverb and simile (kid: true), with its meaning, example, origin
                                story, origin language and Bee's own confidence in that story
                                (documented / disputed / folk). Loaded on demand by views/tools.js.
     app/public/data/vocab.json Bee's two vocabulary-bee lists — "Meaning Masters" (nsf-vocab26-data.js,
                                SB_VOCAB26) and "The Mighty 500" (nsf-finals500-data.js, SB_NSF500) — as
                                [word, definition, respelling, origin, difficulty, part of speech, root, hint].
     app/src/data/bee-quotes.json Bee's quotations (quotes.js + quotes-lib.js, window.SB_QUOTES) exactly as Bee
                                has them — the line, Bee's attribution, Bee's category, who they were, Bee's
                                plain-words meaning (the owner, 3 Oct 2026: "add bee quotes nonlabelled").
                                They are shown ONLY in Tools → Quotes & Poems. They never enter LINES, the
                                lines of the hour, the feed or any question (CLAUDE.md rule 2), and
                                test/texts.mjs's held-text check does not apply to them (they are not held text).

   What is NOT carried: Bee's example sentences (`s`, written for Bee, unsourced) and anything Bee
   marks kid: false. A vocabulary word is dropped when its definition names a person or a place (a
   capital after its first letter — the rule import-bee.mjs applies to the lexicon: Bee's list once
   defined "begin" as Menachem Begin) or contains the word itself (the answer would be in the question).
   Never hand-edit the output: fix it in Bee and re-import.

     BEE_REPO=../Bizzing-Bee BEE_COMMIT=2f74e99d7 node tools/import-bee-tools.mjs */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import { lineSafe } from '../app/src/safe.js';

const HERE = dirname(new URL(import.meta.url).pathname);
const ROOT = resolve(HERE, '..');
const REPO = resolve(ROOT, process.env.BEE_REPO || '../Bizzing-Bee');
const COMMIT = execFileSync('git', ['-C', REPO, 'rev-parse', process.env.BEE_COMMIT || '2f74e99d76723aca80040ccf549c933c38a2cd47']).toString().trim();
const show = (f) => execFileSync('git', ['-C', REPO, 'show', `${COMMIT}:spellbound-app/${f}`], { maxBuffer: 1 << 28 }).toString();
const sha = (s) => createHash('sha256').update(s).digest('hex');
const win = {};
const src = {};
for (const f of ['figurative-data.js', 'nsf-vocab26-data.js', 'nsf-finals500-data.js', 'quotes.js', 'quotes-lib.js']) { src[f] = show(f); vm.runInNewContext(src[f], { window: win }); }

/* ---------- idioms, proverbs and similes ---------- */
const KEEP = ['p', 't', 'm', 'os', 'oc', 'ol', 'ex', 'th', 'diff', 'lit', 'pattern', 'region', 'eq'];
const seen = new Set(), items = [];
for (const x of [...win.SB_FIG.idioms, ...win.SB_FIG.similes]) {
  if (x.kid !== true) continue;
  if (!lineSafe([x.p, x.m, x.ex].join(' '))) continue;            // Bee's kid flag missed "three sheets to the wind" (very drunk)
  const key = x.p.toLowerCase().trim(); if (seen.has(key)) continue; seen.add(key);
  const o = {}; for (const k of KEEP) { const v = x[k]; if (v == null || v === '' || (Array.isArray(v) && !v.length) || (k === 'region' && v === 'global')) continue; o[k] = v; }
  items.push(o);
}
writeFileSync(resolve(ROOT, 'app/src/data/idioms.json'), JSON.stringify({ bee: COMMIT, source: 'spellbound-app/figurative-data.js', sha256: sha(src['figurative-data.js']), items }));

/* ---------- the vocabulary-bee lists ---------- */
const plain = (d) => !!d && d.trim().length > 3 && !/\s[A-Z]/.test(d.slice(1)) && !/^\(/.test(d);
const leaks = (w, d) => d.toLowerCase().includes(w.slice(0, Math.max(4, w.length - 2)));
const lists = {}, dropped = {};
for (const [id, data] of [['vocab26', win.SB_VOCAB26], ['nsf500', win.SB_NSF500]]) {
  const have = new Set(); lists[id] = []; dropped[id] = 0;
  for (const r of data.words) {
    const w = String(r.w || '').toLowerCase().trim();
    if (!/^[a-z][a-z' -]*$/.test(w) || have.has(w) || !plain(r.d) || leaks(w, r.d)) { dropped[id]++; continue; }
    have.add(w);
    lists[id].push([w, r.d.trim(), r.p || '', r.o || '', r.y || 3, r.ps || '', r.r || '', r.h || '']);
  }
}
writeFileSync(resolve(ROOT, 'app/public/data/vocab.json'), JSON.stringify({ bee: COMMIT, sources: { vocab26: 'spellbound-app/nsf-vocab26-data.js', nsf500: 'spellbound-app/nsf-finals500-data.js' }, lists }));
/* ---------- Bee's quotations (Quotes & Poems only) ---------- */
const qSeen = new Set(), quotes = [];
for (const x of win.SB_QUOTES || []) { const q = String(x.q || '').trim(); if (!q || qSeen.has(q)) continue; qSeen.add(q); const o = { q, a: x.a || '', c: x.c || '' }; if (x.who) o.who = x.who; if (x.m) o.m = x.m; quotes.push(o); }
writeFileSync(resolve(ROOT, 'app/src/data/bee-quotes.json'), JSON.stringify({ bee: COMMIT, sources: ['spellbound-app/quotes.js', 'spellbound-app/quotes-lib.js'], sha256: { 'quotes.js': sha(src['quotes.js']), 'quotes-lib.js': sha(src['quotes-lib.js']) }, quotes }));
console.log(`Bee quotes: ${quotes.length}`);
console.log(`Bee ${COMMIT.slice(0, 9)}: ${items.length} idioms, proverbs and similes; vocabulary ${Object.entries(lists).map(([k, v]) => `${k} ${v.length} (dropped ${dropped[k]})`).join(', ')}`);
