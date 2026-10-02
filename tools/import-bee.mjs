#!/usr/bin/env node
/* import-bee.mjs — borrow from Bizzing Bee, never fork it (SPEC §9).

   Reads a PINNED Bee commit and writes only the fields English needs:
     app/public/data/bee-words.json   the lexicon: every word in the held passages, the Word strand's
                                      pools and the word parts — { w: [definition, respelling, part of
                                      speech, difficulty 1–9, origin, etymology, memory hint] }
     app/src/data/bee-manifest.json   the Bee commit, the sha-256 of every source file read, the record
                                      counts and the sha-256 of what was written
   test/bee.mjs fails if the manifest and the data disagree. Never hand-edit the output: fix it in
   Bee and re-import. Bee's quotes are NOT imported (unsourced — SPEC §9); nor its avatars.

     BEE_REPO=../Bizzing-Bee BEE_COMMIT=28948f81c node tools/import-bee.mjs
   The commit must be at or after 28948f81c (the proper-noun clean-up of 2 Oct 2026). */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const HERE = dirname(new URL(import.meta.url).pathname);
const ROOT = resolve(HERE, '..');
const REPO = resolve(ROOT, process.env.BEE_REPO || '../Bizzing-Bee');
const COMMIT = process.env.BEE_COMMIT || '28948f81c40387ca4bd12c865bd7b49a7855515c';
const FILES = ['spellbound-app/words-full.js', 'spellbound-app/words-lore.js'];

const sha = (b) => createHash('sha256').update(b).digest('hex');
const show = (f) => execFileSync('git', ['-C', REPO, 'show', `${COMMIT}:${f}`], { maxBuffer: 1 << 30 });
const fullCommit = execFileSync('git', ['-C', REPO, 'rev-parse', COMMIT]).toString().trim();

const src = {}, hashes = {};
for (const f of FILES) { const b = show(f); hashes[f] = sha(b); src[f] = b.toString(); }
const win = {}; vm.runInNewContext(src[FILES[0]] + '\n' + src[FILES[1]], { window: win });
const FULL = JSON.parse(win.SB_FULL), LORE = win.SB_LORE || {};
const byW = new Map(FULL.map((r) => [r.w, r]));

/* ---------- what English needs ---------- */
const want = new Set();
const ok = (w) => /^[a-z][a-z'-]*$/.test(w);
/* Bee's proper-noun clean-up (28948f81c) missed some: a definition that names anyone or anywhere — any
   capitalised word after its first — marks a name, a place or a myth, not an everyday word. Such words
   never enter a question pool (they also leaked the answer: "German Nazi dictator" → German). */
const plain = (r) => r.d && !/\s[A-Z]/.test(r.d.slice(1)) && !/^\(/.test(r.d);

// 1. every word in the held passages (so tap-a-word always has an answer where Bee has one)
const pj = resolve(ROOT, 'app/src/data/passages.json');
const passages = existsSync(pj) ? JSON.parse(readFileSync(pj, 'utf8')) : [];
const lemma = (w) => [w, w.replace(/'s$/, ''), w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ies$/, 'y'), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'),
  w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/([b-df-hj-np-tv-z])\1(ed|ing)$/, '$1'), w.replace(/ly$/, ''), w.replace(/ier$/, 'y'), w.replace(/iest$/, 'y'), w.replace(/er$/, ''), w.replace(/est$/, '')];
for (const p of passages) for (const raw of p.text.toLowerCase().match(/[a-z][a-z'-]*/g) || []) { const hit = lemma(raw).find((x) => byW.has(x)); if (hit) want.add(hit); }

// 2. the Word strand's pools, chosen here once so the app and the tests read the same lists
const simple = (r) => plain(r) && r.d.length <= 80 && r.y <= 2 && r.w.length <= 10 && ok(r.w) && r.w.length >= 3 && /^(noun|verb|adjective)$/.test(r.ps)
  && !r.d.toLowerCase().includes(r.w.slice(0, Math.max(4, r.w.length - 2))) && !/^(past tense|plural|present participle|third-person|comparative|superlative|alternative|variant|abbreviation)/i.test(r.d);
const defPool = FULL.filter(simple).map((r) => r.w);
const ORIGINS = ['French', 'Latin', 'Greek', 'Hindi', 'Arabic', 'Spanish', 'Italian', 'German', 'Dutch', 'Old Norse', 'Japanese', 'Persian', 'Sanskrit', 'Tamil', 'Malay', 'Portuguese', 'Chinese', 'Urdu', 'Turkish', 'Russian', 'Gujarati', 'Bengali', 'Marathi', 'Telugu', 'Malayalam', 'Kannada'];
// borrowed words a child might know: everyday difficulty, or any word from an Indian language (the diaspora hook)
const originPool = FULL.filter((r) => ok(r.w) && plain(r) && ORIGINS.includes(r.o) && !r.d.toLowerCase().includes(r.o.toLowerCase()) && r.o !== 'Latin' && r.o !== 'French' && (r.y <= 2 || (/^(Hindi|Urdu|Sanskrit|Tamil|Gujarati|Bengali|Marathi|Telugu|Malayalam|Kannada)$/.test(r.o) && r.y <= 6)))
  .concat(FULL.filter((r) => ok(r.w) && plain(r) && (r.o === 'Latin' || r.o === 'French') && r.y <= 1)).map((r) => r.w);
for (const w of [...defPool, ...originPool]) want.add(w);

// 3. the word parts (written by the content author; every word must be Bee's)
const wpPath = resolve(ROOT, 'app/src/data/wordparts.js');
let parts = null;
if (existsSync(wpPath)) {
  parts = await import(wpPath);
  const add = (w) => { if (byW.has(w)) want.add(w); };
  for (const r of parts.RIMES || []) r.words.forEach(add);
  for (const p of [...(parts.PREFIXES || []), ...(parts.SUFFIXES || [])]) p.words.flat().forEach(add);
  for (const r of parts.ROOTS || []) r.words.forEach(add);
  for (const r of parts.REGISTER || []) { add(r.formal); add(r.informal); }
}

// 4. word families: a non-word for every rime (onset + rime that Bee does not know), so "which is a
//    real word?" has one right answer by construction
const ONSETS = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'y', 'z', 'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sh', 'sl', 'sn', 'sp', 'st', 'th', 'tr'];
const rimes = {};
for (const r of parts?.RIMES || []) rimes[r.rime] = { non: ONSETS.map((o) => o + r.rime).filter((w) => !byW.has(w) && !byW.has(w + 's')) };

// 5. affixes: for each [word, base] pair, the OTHER affixes that make no word with that base in Bee
//    (with the usual spelling changes tried), so "which prefix makes a real word?" has one answer
const joins = (b, x, pre) => pre ? [x + b, x + '-' + b] : [b + x, b.replace(/e$/, '') + x, b.replace(/y$/, 'i') + x, b + b.slice(-1) + x, b.replace(/le$/, '') + x];
const prefixNon = {}, suffixNon = {};
for (const a of parts?.PREFIXES || []) for (const [w, b] of a.words) prefixNon[w] = (parts.PREFIXES).filter((x) => x.p !== a.p && !joins(b, x.p, true).some((j) => byW.has(j))).map((x) => x.p);
for (const a of parts?.SUFFIXES || []) for (const [w, b] of a.words) suffixNon[w] = (parts.SUFFIXES).filter((x) => x.s !== a.s && !joins(b, x.s, false).some((j) => byW.has(j))).map((x) => x.s);

const words = {};
for (const w of [...want].sort()) {
  const r = byW.get(w); if (!r) continue;
  const lo = LORE[w] || (r.r ? [r.r, r.h] : null);
  words[w] = [r.d || '', r.p || '', r.ps || '', r.y || 0, r.o || '', lo?.[0] || '', lo?.[1] || ''];
}
const out = { commit: fullCommit, words, pools: { def: defPool.filter((w) => words[w]), origin: originPool.filter((w) => words[w]) }, rimes, prefixNon, suffixNon };
const body = JSON.stringify(out);
mkdirSync(resolve(ROOT, 'app/public/data'), { recursive: true });
writeFileSync(resolve(ROOT, 'app/public/data/bee-words.json'), body);
// 6. Home's word of the hour: the harder words of every passage, with Bee's definition, small enough to
//    bundle (Home must not wait for the whole lexicon)
const libPath = resolve(ROOT, 'app/src/data/library.js');
const hour = {};
if (existsSync(libPath)) { const { PASSAGES } = await import(libPath); for (const p of PASSAGES) for (const w of p.words || []) { const k = w.toLowerCase(); const hit = lemma(k).find((x) => byW.has(x)); if (hit && byW.get(hit).d) hour[k] = byW.get(hit).d; } }
const hourBody = JSON.stringify(hour);
writeFileSync(resolve(ROOT, 'app/src/data/hour-words.json'), hourBody + '\n');

const manifest = { bee: 'aayuvis/Bizzing-Bee', commit: fullCommit, read: hashes, counts: { beeWords: FULL.length, lexicon: Object.keys(words).length, defPool: out.pools.def.length, originPool: out.pools.origin.length, rimes: Object.keys(rimes).length, passages: passages.length },
  wrote: { 'app/public/data/bee-words.json': sha(body), 'app/src/data/hour-words.json': sha(hourBody + '\n') }, at: new Date().toISOString().slice(0, 10) };
writeFileSync(resolve(ROOT, 'app/src/data/bee-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`bee import: ${Object.keys(words).length} words (${(body.length / 1024 / 1024).toFixed(2)} MB) from ${fullCommit.slice(0, 9)}`, manifest.counts);
