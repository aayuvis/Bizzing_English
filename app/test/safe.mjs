/* safe.mjs — nothing English DRAWS from Bee's list on its own shows a child a word from safe.js's block
   lists (brief v4, S4: the Typing Trainer asked a band-1 child to type "porn"). Scans every pool:
   typing words, lessons and tests for every band; vocabulary decks; every Word-strand item; Root Forge;
   the sentences cut for Sentence Builder and Punctuation Rush; and the feed's own words. */
import { readFileSync, readdirSync } from 'node:fs';
import { BLOCK, kidSafe, defSafe, nonWordSafe, lineSafe } from '../src/safe.js';
import { tyWords, tySeqFor, tyTestSeq, TY_LESSONS, vocDecks, tyCorpus, tyMeanings, TY_PURGE, TY_MIN } from '../src/tools.js';
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

// typing (T7, HANDOVER C §1.2, §4.4): every pool, 1,000 drawn items per band, zero blocklist hits — and a pool
// word is a curated word: kid-safe, a real word of the Library's own passages, long enough, never purged
const sentences = PASSAGES.flatMap((p) => String(p.text || '').split(/(?<=[.!?])\s+/));
const PJ = json('../src/data/passages.json'), corpus = tyCorpus(PJ.map((p) => p.text)), decks = vocDecks(vocab, lex);
const dictation = (await import('../src/data/writing.js')).default.dictation.map((d) => d.text);
const badMemo = new Map(), tyBad = (w, band) => { const k = band + w; if (!badMemo.has(k)) badMemo.set(k, BLOCK.test(w) || !kidSafe(w, lex.words[w]?.[0]) || TY_PURGE.has(w) || !corpus.has(w) || w.length < TY_MIN[band]); return badMemo.get(k); };
const tyItem = (pool, band, seq) => {   // the first thing wrong with one drawn item, or ''
  if (pool === 'sent') return lineSafe(seq) ? '' : 'a blocked word';
  if (pool === 'mean') { if (!lineSafe(seq) || !defSafe(seq)) return 'a blocked word or meaning'; const heads = seq.split(/\.\s*/).filter(Boolean).map((c) => c.split(',')[0].trim().toLowerCase()); const h = heads.find((w) => !kidSafe(w, lex.words[w]?.[0]) || TY_PURGE.has(w)); return h ? `"${h}"` : ''; }
  const w = toks(seq).find((x) => tyBad(x, band)); return w ? `"${w}"` : '';
};
const KNOWN = ['porn', 'sexy', 'sexual', 'raped', 'naked', 'cum', 'rape', 'raping', 'nudes', 'nudity', 'horny', 'sluts', 'moron', 'retard', 'piss', 'stoned', 'whisky', 'randy', 'drunk', 'damn', 'alcohol', 'bisexual', 'col', 'doc', 'wont'];
let ty7 = 0;
for (const band of [1, 2, 3]) {
  const words = tyWords(lex, band, corpus), means = tyMeanings(decks, band);
  if (words.length < 300) bad(`typing band ${band}: only ${words.length} curated words`);
  if (means.length < 30) bad(`typing band ${band}: only ${means.length} meanings`);
  for (const { w } of words) { n++; if (tyBad(w, band)) bad(`typing band ${band}: "${w}" in the word pool`); }
  for (const { w, d } of means) { n++; if (!kidSafe(w, d) || !defSafe(d)) bad(`typing band ${band}: "${w}" — ${d.slice(0, 60)}`); }
  for (const w of KNOWN) { n++; if (words.some((x) => x.w === w) || means.some((x) => x.w === w || new RegExp(`\\b${w}\\b`, 'i').test(x.d))) bad(`typing band ${band}: the known hit "${w}" is still in a pool`); }
  const L = Object.fromEntries(TY_LESSONS.filter((l) => l.dyn).map((l) => [l.dyn, l]));
  for (const [pool, draw] of [['bee', (s) => tySeqFor(L.bee, { lex, band, seed: s, corpus })], ['test', (s) => tyTestSeq(lex, band, s, corpus)],
    ['sent', (s) => tySeqFor(L.sent, { lex, band, sentences: dictation, seed: s })], ['mean', (s) => tySeqFor(L.mean, { lex, band, seed: s, decks })]]) {
    for (let s = 0; s < 1000; s++) { const seq = draw('t7:' + s); n++; ty7++; const why = tyItem(pool, band, seq); if (why) bad(`T7 typing ${pool} band ${band}: ${why} in “${seq.slice(0, 80)}”`); for (const w of KNOWN) if (toks(seq).includes(w)) bad(`T7 typing ${pool} band ${band}: "${w}"`); }
  }
}
// the checks are not blind: an unfiltered pool and a planted item are caught
{ const raw = tyWords(lex, 1); if (!raw.some((x) => tyBad(x.w, 1))) bad('T7: without the corpus the pool is still clean — the corpus check is blind');
  if (!tyItem('bee', 1, 'cat doc dog')) bad('T7: a planted fragment "doc" was not caught');
  if (!tyItem('sent', 2, 'He was drunk and the moron fell.')) bad('T7: a planted sentence was not caught'); }
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
console.log(fail ? `safe: ${fail} failures in ${n} checks` : `safe: ${n} checks, no blocked word in any drawn pool (T7: ${ty7} typing items, 1,000 per band per pool)`);
process.exit(fail ? 1 : 0);
