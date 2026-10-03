// The Tools tab (src/tools.js, views/tools.js), held by a test:
// - Idioms & Similes: Bee's figurative data, pinned, kid-safe only, every card has a meaning, an example, an
//   origin story and Bee's confidence in it; every deck is big enough; every meaning question is fair.
// - Vocabulary: Bee's lists and lexicon decks; every word's question has one right answer (its own
//   definition), four distinct options, the word not in its right answer, and no slot above 35%.
// - Typing: Bee's lessons are typeable on the on-screen keyboard; the WPM and accuracy maths.
// - Quotes & Poems: every held line exact in a cleared held text; Bee's quotations pinned and kept OUT of
//   LINES, the feed and every question (only views/tools.js may import them).
// - The tab and its routes exist, and every tool has its painting.
// Each kind of check is proven by breaking it at the end.
//
//   node app/test/tools.mjs

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { TOOLS, SMALL_TOOLS, TOOL_ROUTES, BEE_COMMIT, OC, ORIGIN_NOTE, figDecks, idiomItem, idiomRound, idiomStory, STORY_LINKS, vocDecks, vocItem, vocBuildSet, vocFinish, vocSetSize, VOC_PASS,
  TY_LESSONS, TY_ROWS, tySeqFor, tyTestSeq, typingScore, quoteShelf, QUOTE_CATS } from '../src/tools.js';
import { LINES, WORKS, PASSAGES } from '../src/data/library.js';
import { MORE_LINES } from '../src/data/lines-more.js';
import { cleared } from '../src/data/rights.js';
import WRITING from '../src/data/writing.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return cond; };
const json = (p) => JSON.parse(readFileSync(join(APP, p), 'utf8'));

/* a fair four-option question: one right, distinct options, the right one where `answer` says */
const fair = (it, right, text) => it.options.length === 4 && new Set(it.options.map((o) => o.toLowerCase().trim())).size === 4 && it.options[it.answer] === right
  && it.options.filter((o) => o === right).length === 1 && !right.toLowerCase().includes(text.toLowerCase());
const slots = (items) => { const c = [0, 0, 0, 0]; for (const it of items) c[it.answer]++; return Math.max(...c) / items.length; };

// ── Idioms & Similes ──────────────────────────────────────────────────────
const ID = json('src/data/idioms.json'), P = ID.items;
ok(ID.bee === BEE_COMMIT, `idioms.json is not from the pinned Bee commit (${ID.bee})`);
ok(P.length >= 2000, `idioms: only ${P.length} phrases (Bee has ~2,370 kid-safe)`);
ok(new Set(P.map((x) => x.p.toLowerCase())).size === P.length, 'idioms: a phrase appears twice');
for (const x of P) {
  const tag = `idiom "${x.p}"`;
  ok(['idiom', 'proverb', 'simile'].includes(x.t), `${tag}: unknown type ${x.t}`);
  for (const f of ['m', 'os', 'ex']) ok(typeof x[f] === 'string' && x[f].trim().length > 3, `${tag}: missing ${f}`);
  ok(Object.hasOwn(OC, x.oc), `${tag}: origin confidence ${x.oc} is not Bee's documented / disputed / folk`);
  ok(Array.isArray(x.th) && x.th.length > 0, `${tag}: no theme`);
  ok(['easy', 'medium', 'hard'].includes(x.diff), `${tag}: no difficulty`);
  ok(!('kid' in x) && !('s' in x), `${tag}: carries a field English does not take`);
}
ok(/awaiting a named reviewer/.test(ORIGIN_NOTE), 'the origin note no longer says the stories await a named reviewer');
const BEE = join(APP, '..', '..', 'Bizzing-Bee');
if (existsSync(join(BEE, '.git'))) {   // kid-safe only, checked against Bee itself at the pinned commit
  const win = {}; vm.runInNewContext(execFileSync('git', ['-C', BEE, 'show', `${BEE_COMMIT}:spellbound-app/figurative-data.js`], { maxBuffer: 1 << 28 }).toString(), { window: win });
  const kid = new Set([...win.SB_FIG.idioms, ...win.SB_FIG.similes].filter((x) => x.kid === true).map((x) => x.p.toLowerCase().trim()));
  ok(P.every((x) => kid.has(x.p.toLowerCase().trim())), 'idioms: a phrase Bee does not mark kid: true was imported');
  ok(P.length === kid.size, `idioms: Bee has ${kid.size} kid-safe phrases, English took ${P.length}`);
} else console.log('tools: Bee checkout not found — the kid-safe check against Bee was skipped');
const D = figDecks(P);
ok(D.length >= 10 && D.every((d) => d.items.length >= 8 && d.items.length <= 30), 'idioms: a learning deck is under 8 or over 30 cards');
const IQ = P.map((x, i) => idiomItem(P, x, i));
const badI = IQ.filter((it) => !fair(it, it.item.m, it.phrase));
ok(badI.length === 0, `idioms: ${badI.length} unfair meaning questions, e.g. "${badI[0]?.phrase}"`);
ok(slots(IQ) <= 0.35, `idioms: the right answer leans on one slot (${Math.round(slots(IQ) * 100)}%)`);
for (const seed of ['a', 'b', 'c']) { const R = idiomRound(P, seed, 10); ok(R.length === 10 && R.every((it) => fair(it, it.item.m, it.phrase)), `idioms: quiz round ${seed} is not ten fair questions`); }
const LIB = new Set(PASSAGES.filter((p) => cleared(WORKS.find((w) => w.id === p.work))).map((p) => p.id));
ok(STORY_LINKS.every(([, , id]) => PASSAGES.some((p) => p.id === id)), 'idioms: a story link names a passage that does not exist');
const linked = P.filter((x) => idiomStory(x, LIB));
ok(linked.length >= 5, `idioms: only ${linked.length} sayings link to a Library story`);
ok(!!idiomStory({ p: 'the Midas touch', os: '' }, LIB) && !idiomStory({ p: 'a flash in the pan', os: '' }, LIB), 'idioms: story links match the wrong sayings');

// ── Vocabulary ────────────────────────────────────────────────────────────
const VOC = json('public/data/vocab.json'), LEX = json('public/data/bee-words.json');
ok(VOC.bee === BEE_COMMIT, 'vocab.json is not from the pinned Bee commit');
ok(Object.values(VOC.lists).flat().every((r) => !/\s[A-Z]/.test(r[1].slice(1))), 'vocab: a definition names a person or a place');
const VD = vocDecks(VOC, LEX);
ok(VD.length >= 10, `vocabulary: only ${VD.length} decks`);
ok(['vocab26', 'nsf500', 'easy', 'medium', 'latin', 'greek'].every((id) => VD.some((d) => d.id === id)), 'vocabulary: Bee’s lists, a level deck or an origin deck is missing');
let vq = 0;
for (const d of VD) {
  const items = d.words.map((e, i) => vocItem(d, e, i));
  const bad = items.filter((it) => !fair(it, it.entry.d, it.word));
  vq += items.length;
  ok(bad.length === 0, `vocabulary ${d.id}: ${bad.length} unfair questions, e.g. "${bad[0]?.word}"`);
  ok(slots(items) <= 0.35, `vocabulary ${d.id}: the right answer leans on one slot (${Math.round(slots(items) * 100)}%)`);
}
// the ladder: a set, a pass at 80%, a fail queues the misses, revision empties the queue
{ const d = VD[0], v = { lv: {}, revise: {}, seen: {}, cur: {}, carry: {}, last: {}, known: {}, miss: {} };
  const set = vocBuildSet(v, d, vocSetSize(2)); ok(set.length === 20 && new Set(set.map((e) => e.w)).size === 20, 'vocabulary: a set is not 20 distinct words');
  ok(vocBuildSet(v, d, 20).map((e) => e.w).join() === set.map((e) => e.w).join(), 'vocabulary: coming back reshuffles the set being learned');
  const fail = vocFinish(v, d.id, 'check', 15, 20, set.slice(0, 5).map((e) => e.w)); ok(!fail.passed && v.revise[d.id].length === 5 && !v.lv[d.id], 'vocabulary: 75% passed, or the misses were not queued');
  const rev = vocFinish(v, d.id, 'revise', 5, 5, []); ok(rev.remaining === 0, 'vocabulary: revising every miss right did not empty the queue');
  const pass = vocFinish(v, d.id, 'check', 16, 20, [set[0].w]); ok(pass.passed && v.lv[d.id] === 1 && v.carry[d.id].length === 1 && VOC_PASS === 0.8, 'vocabulary: 80% did not pass, or the miss was not carried');
  const next = vocBuildSet(v, d, 20); ok(next[0].w === set[0].w && next.slice(1).every((e) => !set.some((x) => x.w === e.w)), 'vocabulary: the next set is not the carried miss then new words'); }

// ── Typing Trainer ────────────────────────────────────────────────────────
const KEYS = new Set([...TY_ROWS.join(''), ' ', ...'abcdefghijklmnopqrstuvwxyz'.toUpperCase(), "'"]);
const typeable = (s) => s.length > 0 && [...s].every((c) => KEYS.has(c) || c === "'");
const sentences = WRITING.dictation.filter((s) => cleared(WORKS.find((w) => w.id === s.work))).map((s) => s.text);
for (const l of TY_LESSONS) for (const band of [1, 2, 3]) { const s = tySeqFor(l, { lex: LEX, band, sentences, seed: 'q' }); ok(typeable(s.replace(/'/g, '')), `typing ${l.id} (band ${band}): "${s.slice(0, 40)}" has a key the on-screen keyboard lacks`); }
ok(TY_LESSONS.length === 15, 'typing: Bee has 15 lessons');
ok(tyTestSeq(LEX, 2, 'x').split(' ').length >= 60, 'typing: the sixty-second test has too few words');
const s1 = typingScore({ typed: 250, errors: 0, ms: 60000 }), s2 = typingScore({ typed: 250, errors: 25, ms: 60000 }), s3 = typingScore({ typed: 0, errors: 0, ms: 1000 }), s4 = typingScore({ typed: 100, errors: 0, ms: 30000 });
ok(s1.wpm === 50 && s1.acc === 100, `typing: 250 clean keys in a minute is not 50 wpm, 100% (${JSON.stringify(s1)})`);
ok(s2.wpm === 45 && s2.acc === 90, `typing: 25 slips in 250 keys is not 45 wpm, 90% (${JSON.stringify(s2)})`);
ok(s3.wpm === 0 && s3.acc === 0, 'typing: nothing typed is not 0 and 0');
ok(s4.wpm === 40, 'typing: 100 keys in 30 seconds is not 40 wpm');

// ── Quotes & Poems ────────────────────────────────────────────────────────
const collapse = (s) => s.replace(/\s+/g, ' ').trim(), T = {};
const held = (l) => { const w = WORKS.find((x) => x.id === l.work); if (!cleared(w) || !w.held) return false; T[l.work] ||= collapse(readFileSync(join(APP, 'public', w.file), 'utf8')); return T[l.work].includes(collapse(l.text)); };
const shipped = [...LINES.filter((l) => cleared(WORKS.find((w) => w.id === l.work))), ...MORE_LINES];
const notHeld = shipped.filter((l) => !held(l));
ok(notHeld.length === 0, `quotes: ${notHeld.length} lines not found word for word in a cleared held text, e.g. "${notHeld[0]?.text}"`);
ok(shipped.length >= 300, `quotes: only ${shipped.length} held lines`);
ok(quoteShelf(shipped, WORKS).reduce((a, s) => a + s.lines.length, 0) === shipped.length, 'quotes: the shelf loses lines');
const BQ = json('src/data/bee-quotes.json');
ok(BQ.bee === BEE_COMMIT && BQ.quotes.length >= 1000, 'Bee quotes: not pinned, or fewer than 1,000');
ok(BQ.quotes.every((x) => x.q && x.a && QUOTE_CATS[x.c]), 'Bee quotes: a quotation without its line, attribution or a known category');
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const importers = walk(join(APP, 'src')).filter((f) => /\.js$/.test(f) && /(import\(|from )\s*['"][^'"]*bee-quotes\.json/.test(readFileSync(f, 'utf8'))).map((f) => f.slice(APP.length + 1));
ok(importers.length === 1 && importers[0] === 'src/views/tools.js', `Bee quotes: read outside Quotes & Poems (${importers.join(', ')}) — never the lines of the hour, the feed or a question`);

// ── the tab, the routes, the paintings ────────────────────────────────────
const main = readFileSync(join(APP, 'src/main.js'), 'utf8');
ok(/id: 'tools', label: 'Tools'/.test(main) && !/id: 'stage', label: 'Stage'/.test(main), 'main.js: the Tools tab is missing, or the Stage is still a tab');
ok(/case 'tools': return toolsView\(\)/.test(main) && /case 'stage':/.test(main), 'main.js: #/tools or #/stage is not routed');
for (const t of TOOLS) {
  ok(t.href === '#/stage' || TOOL_ROUTES.includes(t.href.replace('#/tools/', '')), `tool ${t.id}: ${t.href} is not a route`);
  for (const f of [`art/tool-${t.id}-card.webp`, `art/tool-${t.id}.webp`]) ok(existsSync(join(APP, 'public', f)), `tool ${t.id}: ${f} is missing (tools/art/gen.py --group tools, then process.py --tools)`);
  ok(/^#[0-9A-F]{6}$/i.test(t.c) && t.kick && t.cta && t.blurb, `tool ${t.id}: needs a colour, a kicker, a button and a blurb`);
}
ok(['MEANING', 'SAYINGS', 'SPEED', 'VOICES'].every((k) => TOOLS.some((t) => t.kick.toUpperCase() === k)), 'the shelf lost one of Bee’s kicker pills');
ok(SMALL_TOOLS.some((t) => t.href === '#/library/words') && SMALL_TOOLS.some((t) => t.href === '#/search'), 'the Word bank or the Dictionary card is missing');

// ── prove the checks can fail ─────────────────────────────────────────────
const it0 = IQ[0];
ok(!fair({ ...it0, options: [it0.options[0], it0.options[0], it0.options[2], it0.options[3]] }, it0.item.m, it0.phrase), 'fair() accepted two identical options: the check is blind');
ok(!fair({ ...it0, answer: (it0.answer + 1) % 4 }, it0.item.m, it0.phrase), 'fair() accepted the wrong slot: the check is blind');
ok(slots([...Array(10)].map(() => ({ answer: 1 }))) > 0.35, 'slots() missed a favourite slot: the check is blind');
ok(!held({ ...MORE_LINES[0], text: MORE_LINES[0].text.replace(/[A-Za-z]+/, (m) => m + 'x') }), 'quotes: an altered line was found: the check is blind');
ok(!typeable('naïve'), 'typing: a key the board lacks was accepted: the check is blind');

if (fails.length) { console.log(fails.slice(0, 30).map((f) => '  ✗ ' + f).join('\n')); console.log(`tools: ${fails.length} of ${checks} checks failed`); process.exit(1); }
console.log(`tools: all ${checks} passed — ${P.length} sayings in ${D.length} decks (${linked.length} linked to a Library story), ${VD.length} vocabulary decks (${vq} questions), ${TY_LESSONS.length} typing lessons, ${shipped.length} held lines + ${BQ.quotes.length} of Bee’s quotations`);
