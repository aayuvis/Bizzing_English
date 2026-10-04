/* safe.mjs — nothing English DRAWS from Bee's list on its own shows a child a word from safe.js's block
   lists (brief v4, S4: the Typing Trainer asked a band-1 child to type "porn"). Scans every pool:
   typing words, lessons and tests for every band; vocabulary decks; every Word-strand item; Root Forge;
   the sentences cut for Sentence Builder and Punctuation Rush; and the feed's own words. */
import { readFileSync, readdirSync } from 'node:fs';
import { BLOCK, kidSafe, defSafe, nonWordSafe, lineSafe } from '../src/safe.js';
import { tyWords, tySeqFor, tyTestSeq, TY_LESSONS, vocDecks } from '../src/tools.js';
import { KINDS, keys, make } from '../src/items.js';
import { forgePools } from '../src/games.js';
import * as WP from '../src/data/wordparts.js';
import { PASSAGES } from '../src/data/library.js';

const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const lex = json('../public/data/bee-words.json'), vocab = json('../public/data/vocab.json');
let fail = 0, n = 0; const bad = (m) => { if (fail < 40) console.log('✗', m); fail++; };
const toks = (s) => String(s || '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
const wordsOk = (where, s) => { n++; for (const w of toks(s)) if (BLOCK.test(w) || !nonWordSafe(w) && w.length > 2 && !lex.words[w]) { bad(`${where}: "${w}" in “${String(s).slice(0, 80)}”`); return; } };

// the filter itself: the words the auditor saw, and a word whose Bee definition is the problem
for (const w of ['porn', 'sexy', 'naked', 'rape', 'nudes', 'drunken', 'moron']) if (kidSafe(w, lex.words[w]?.[0])) bad(`kidSafe lets "${w}" through`);
if (kidSafe('come', lex.words.come?.[0])) bad('kidSafe lets "come" through on Bee’s definition of it');
for (const w of ['crap', 'wank', 'that']) if (nonWordSafe(w)) bad(`nonWordSafe offers "${w}" as a made-up word`);
for (const w of ['children', 'cattle', 'session', 'sextant', 'trans', 'chocolate']) if (!kidSafe(w, lex.words[w]?.[0] || '')) bad(`kidSafe blocks the ordinary word "${w}"`);

// typing: every word at every band, every lesson and test across seeds
const sentences = PASSAGES.flatMap((p) => String(p.text || '').split(/(?<=[.!?])\s+/));
for (const band of [1, 2, 3]) {
  for (const { w, d } of tyWords(lex, band)) { n++; if (!kidSafe(w, d)) bad(`typing band ${band}: "${w}"`); }
  for (let s = 0; s < 60; s++) {
    wordsOk(`typing test band ${band}`, tyTestSeq(lex, band, 's' + s));
    for (const l of TY_LESSONS) if (l.dyn) { const seq = tySeqFor(l, { lex, band, sentences, seed: 's' + s }); n++; if (!lineSafe(seq) || (l.dyn === 'bee' && toks(seq).some((w) => BLOCK.test(w)))) bad(`typing ${l.id} band ${band}: “${seq.slice(0, 90)}”`); }
  }
}
// vocabulary decks (and so the feed's vocab cards, which are cut from them)
for (const d of vocDecks(vocab, lex)) for (const e of d.words) { n++; if (!kidSafe(e.w, e.d)) bad(`vocab ${d.id}: "${e.w}"`); }
// every item of every Bee-drawn Word kind: options and question
const BEE_KINDS = KINDS.filter((k) => !/^(authored|passage)$/.test(k));
for (const band of [1, 2, 3]) for (const kind of BEE_KINDS) for (const key of keys(kind, { band, lex })) {
  const it = make(kind, key, { band, lex }); if (!it) continue; n++;
  for (const o of it.options || []) { if (toks(o).length === 1 && (BLOCK.test(o) || !lex.words[o] && !nonWordSafe(o))) bad(`${it.id}: option "${o}"`); }
  if (!lineSafe(it.prompt)) bad(`${it.id}: “${it.prompt}”`);
}
for (const x of forgePools(lex, WP)) { n++; if (!kidSafe(x.word, lex.words[x.word]?.[0])) bad(`Root Forge: "${x.word}"`); }
// sentences cut for the games
for (const f of ['builder', 'rush']) { const j = json(`../src/data/games/${f}.json`); for (const s of JSON.stringify(j).match(/"s":"(?:[^"\\]|\\.)*"/g) || []) { n++; if (!lineSafe(s)) bad(`${f}: ${s.slice(0, 90)}`); } }
// the feed: a card that quotes a book or a saying is held to the sentence list; a card English wrote
// from Bee's list is held to the word list, its meanings to the definition list, its made-up words to
// the made-up-word list
const FEED = new URL('../src/data/feed/', import.meta.url);
const QUOTED = /^(story|tale|opening|line|speech|talk|inline|figure|comma|example|question|idiom)$/;
for (const f of readdirSync(FEED).filter((x) => /^g-/.test(x))) for (const c of Object.values(json(`../src/data/feed/${f}`))) {
  n++; const quoted = QUOTED.test(c.kind) && !/^voc~/.test(c.id), made = /^w1-build/.test(c.id) || /^onset/.test(c.src || '');
  const fails = (s) => { const t = toks(s); if (quoted) return !lineSafe(s);
    if (t.length === 1) return BLOCK.test(t[0]) || (made && !lex.words[t[0]] && !nonWordSafe(t[0]));
    return !defSafe(s); };
  const hit = [c.title, c.play?.q, ...(c.play?.opts || [])].find((s) => s && fails(s));
  if (hit) bad(`feed ${c.id} (${c.kind}): “${String(hit).slice(0, 80)}”`);
}
console.log(fail ? `safe: ${fail} failures in ${n} checks` : `safe: ${n} checks, no blocked word in any drawn pool`);
process.exit(fail ? 1 : 0);
