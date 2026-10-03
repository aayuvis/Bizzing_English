/* game-pools.mjs — the games' big pools, held to the rules they were cut by (CLAUDE.md hard rules 1, 2,
   5 and 6; tools/build-games.mjs):

   · every sentence and line is an exact (whitespace-collapsed) substring of a held text whose work is
     cleared in all three markets and not waiting on a reviewer;
   · builder.json — each item parses the way games.js builderPool parses it (one [main clause], one
     subordinate clause opened by a subordinator, before it with a comma or after it), and
     builderSentence rebuilds the book's own sentence: exactly, or with only the optional comma before a
     trailing subordinate clause dropped; the main clause opens with a word builderSentence may safely
     lower-case (or I, or a name);
   · rush.json — each item's commas are exactly its rule's shape (list, fronted, address, aside,
     compound) and nothing else is punctuated inside it;
   · figures-more.js — the Figure Hunt rules of test/literature.mjs ('none' has no like/as and no two
     neighbouring words alike in first letter; a simile compares with like/as), and no simile, metaphor
     or personification line hides a run of alliteration that would make it a second right answer;
   · rhetoric-more.js — every line held, `also` never names its own device and leaves three wrong
     reasons, every line has a plainer version and no plainer version is a quotation; Rhetoric Duel
     and Figure Hunt rounds built from the new lines keep one right answer;
   · counts per band meet their minimums; nothing is duplicated (within a pool or against the bank it
     joins). Each check is shown to fail on a planted fault before the counts are reported.

     node app/test/game-pools.mjs */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { MAIN_CLAUSE, COMMAS } from '../src/data/sentences.js';
import { FIGURES } from '../src/data/literature.js';
import { RHETORIC } from '../src/data/language.js';
import { PLAIN, DEVICE_GLOSS } from '../src/data/duel.js';
import { FIGURES_MORE } from '../src/data/figures-more.js';
import { RHETORIC_MORE, PLAIN_MORE } from '../src/data/rhetoric-more.js';
import * as G from '../src/games.js';

const url = (p) => new URL(p, import.meta.url);
const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); return !!cond; };
/* run a checker on a planted fault: it must complain */
const catches = (fn, x) => { const before = fails.length; fn(x, 'probe'); return fails.splice(before).length > 0; };

// ── the held texts ──────────────────────────────────────────────────────────
const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();
const TEXTS = Object.fromEntries(readdirSync(url('../public/texts/')).filter((f) => f.endsWith('.txt')).map((f) => [f.replace(/\.txt$/, ''), collapse(readFileSync(url(`../public/texts/${f}`), 'utf8'))]));
const works = new Map(WORKS.map((w) => [w.id, w]));
const quotable = (id) => { const w = works.get(id); return !!(w && w.held && cleared(w) && !w.needsReview && TEXTS[id]); };
const exact = (id, s) => quotable(id) && TEXTS[id].includes(collapse(s));
const inAnyText = (s) => Object.values(TEXTS).some((t) => t.includes(collapse(s)));
const load = (p) => (existsSync(url(p)) ? JSON.parse(readFileSync(url(p), 'utf8')) : null);
const B = load('../src/data/games/builder.json'), RU = load('../src/data/games/rush.json');
ok(Array.isArray(B), 'src/data/games/builder.json is missing — run node tools/build-games.mjs');
ok(Array.isArray(RU), 'src/data/games/rush.json is missing — run node tools/build-games.mjs');

/* The minimums. Rush meets the 600 a band asked for. Builder does not, and the shortfall is the
   honest yield of the strict cut over the cleared, unreviewed prose (one subordinator at the clause
   boundary, a full main clause, no dialogue marks, semicolons or dashes, 5–24 words): ~330 a band.
   Raise the floor only with the cut, never by loosening it. */
const MIN = { builder: 300, rush: 600, figures: 300, metaphor: 40, personification: 40, rhetoric: 80 };

const ARCHAIC = /\b(thee|thou|thy|thine|ye|hath|doth|dost|hast|shalt|wilt|ere|nay|yea|whence|thither|hither|whither|wherefore|methinks|verily|forsooth|unto|prithee|quoth)\b/i;
const SUBWORDS = ['when', 'because', 'if', 'although', 'after', 'before', 'while', 'until', 'since', 'as', 'unless', 'once', 'whenever', 'though'];
const SUBS = /^(when|because|if|although|after|before|while|until|since|as|unless|once|whenever|though)\b/i;   // games.js
const OPENERS = /^(The|A|An|My|Our|Your|His|Her|Its|Their|We|They|He|She|It|You|Everyone|Everybody|Nobody|No|This|That|These|Those|Some|All|Every|Each|Most|Many|Both|There)\b/;
const NOT_A_SUBJECT = /^(Then|Now|So|But|And|Yet|Or|Still|Here|Suddenly|Presently|Perhaps|Indeed|However|Thus|Once|Soon|Again|Only|Just|Even|Why|What|How|Well|Oh|Ah|Yes|No,|Of|In|On|At|To|For|With|From|By|After|Before|When|If|As|Since|Until|While|Though|Although|Because|Unless)\b/;
const plainOf = (s) => s.replace(/[[\]]/g, '');
const lc = (s) => s.toLowerCase();
const wordsOf = (s) => lc(s).replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(Boolean);
/* a subordinator word that is no clause boundary: "as well", "such as", "as white as", "at once", "once more", "after all" */
const fixedSub = (w, i) => (w[i] === 'as' && (w[i + 1] === 'well' || w[i - 1] === 'such' || w[i + 2] === 'as' || (i >= 2 && w[i - 2] === 'as')))
  || (w[i] === 'once' && (w[i - 1] === 'at' || w[i + 1] === 'more' || w[i + 1] === 'again')) || (w[i] === 'after' && w[i + 1] === 'all');
const subCount = (s) => { const w = wordsOf(s); return w.filter((x, i) => SUBWORDS.includes(x) && !fixedSub(w, i)).length; };

/* the same parse as games.js builderPool */
function parseBuilder(x) {
  const m = x.s.match(/^(.*)\[(.+)\](.*)$/); if (!m) return null;
  const before = m[1].replace(/,\s*$/, '').trim(), after = m[3].replace(/^[,\s]+/, '').replace(/[.!?]$/, '').trim();
  if (before && after) return null;
  const dep = (before || after).trim(), main = m[2].trim(), sm = dep.match(SUBS);
  if (!sm || !main) return null;
  return { sub: sm[1].toLowerCase(), dep: dep.slice(sm[1].length).trim(), main: main.replace(/[.!?]$/, ''), end: x.s.trim().slice(-1), band: x.band || 1, front: !!before };
}

// ── Sentence Builder ────────────────────────────────────────────────────────
function checkBuilder(x, tag) {
  ok(x && typeof x.s === 'string' && [1, 2, 3].includes(x.band) && typeof x.work === 'string' && typeof x.src === 'string' && Object.keys(x).length === 4, `${tag}: must be exactly { s, band, work, src }`);
  if (!x || typeof x.s !== 'string') return;
  ok((x.s.match(/\[/g) || []).length === 1 && (x.s.match(/\]/g) || []).length === 1, `${tag}: one [main clause] only`);
  ok(exact(x.work, plainOf(x.s)), `${tag}: not found word for word in a held, cleared, unreviewed text (${x.work})`);
  const n = plainOf(x.s).split(/\s+/).length;
  ok(n >= 5 && n <= 24, `${tag}: ${n} words (5–24)`);
  ok(!/["“”;:—–]|--/.test(x.s) && !/(^|\s)'|'(\s|[.,!?]|$)/.test(x.s), `${tag}: quotation marks, a semicolon, a colon or a dash`);
  ok(!ARCHAIC.test(x.s), `${tag}: an archaic word`);
  ok(subCount(plainOf(x.s)) === 1, `${tag}: must hold exactly one subordinator at a clause boundary`);
  const it = parseBuilder(x);
  if (!ok(it, `${tag}: games.js cannot parse it`)) return;
  ok(it.dep.split(/\s+/).length >= 2 && it.main.split(/\s+/).length >= 2, `${tag}: a clause too short`);
  ok(!NOT_A_SUBJECT.test(it.main) && /^([A-Z]|I\b|[a-z])/.test(it.main), `${tag}: the main clause does not open with its subject ("${it.main.split(' ')[0]}")`);
  const cur = { it }, front = G.builderSentence(cur, 'front'), end = G.builderSentence(cur, 'end'), book = collapse(plainOf(x.s));
  if (it.front) ok(front === book, `${tag}: builderSentence does not rebuild it: "${front}"`);
  else {
    ok(end === book || end === book.replace(`${it.main}, ${it.sub} `, `${it.main} ${it.sub} `), `${tag}: builderSentence does not rebuild it: "${end}"`);
    ok(OPENERS.test(it.main) || /^I('|\b)/.test(it.main) || (/^[A-Z][a-z]/.test(it.main) && !NOT_A_SUBJECT.test(it.main)), `${tag}: the front rebuild would keep a stray capital ("${it.main.split(' ')[0]}")`);
  }
}
const seenB = new Set(MAIN_CLAUSE.map((x) => collapse(plainOf(x.s))));
(B || []).forEach((x, i) => {
  const tag = `builder ${i + 1} "${String(x.s).slice(0, 40)}…"`;
  checkBuilder(x, tag);
  const k = collapse(plainOf(x.s));
  ok(!seenB.has(k), `${tag}: duplicate`);
  seenB.add(k);
});
/* the live parser agrees, when it takes an extra pool */
if (B && G.builderPool(3, B).length > G.builderPool(3).length) ok(G.builderPool(3, B).length === G.builderPool(3).length + B.length, `games.js builderPool drops ${G.builderPool(3).length + B.length - G.builderPool(3, B).length} builder.json items`);

// ── Punctuation Rush ────────────────────────────────────────────────────────
const COORD = new Set(['and', 'but', 'so', 'yet', 'or']);
function rushShape(x) {
  const w = x.s.trim().split(/\s+/), bare = w.map((t) => lc(t).replace(/[^a-z']/g, '')), c = w.map((t, j) => (t.endsWith(',') ? j : -1)).filter((j) => j >= 0), n = w.length;
  if (!c.length || c.some((j) => j >= n - 1)) return 'a comma at the end';
  if (x.rule === 'compound') return c.length === 1 && COORD.has(bare[c[0] + 1]) && c[0] >= 3 ? null : 'compound: one comma, then and / but / so / yet / or';
  if (x.rule === 'fronted') return c.length === 1 && c[0] <= 10 && !COORD.has(bare[c[0] + 1]) ? null : 'fronted: one comma after an opener of at most eleven words';
  if (x.rule === 'address') return c.length === 1 && (c[0] <= 1 || c[0] >= n - 3) && /^[A-Z]/.test(c[0] <= 1 ? w[0] : w[c[0] + 1]) ? null : 'address: one comma setting off a name at the start or the end';
  if (x.rule === 'aside') return c.length === 2 && c[0] <= 4 && c[1] - c[0] <= 10 ? null : 'aside: two commas around the aside';
  if (x.rule === 'list') {
    const and = bare.map((b, j) => (b === 'and' ? j : -1)).filter((j) => j > c[c.length - 1]);
    return c.length >= 2 && and.length === 1 && !w[and[0] - 1].endsWith(',') ? null : 'list: two or more commas, one "and" after the last, no comma before it';
  }
  return 'unknown rule';
}
function checkRush(x, tag) {
  ok(x && typeof x.s === 'string' && ['list', 'fronted', 'address', 'aside', 'compound'].includes(x.rule) && [1, 2, 3].includes(x.band) && typeof x.work === 'string' && typeof x.src === 'string' && Object.keys(x).length === 5, `${tag}: must be exactly { s, rule, band, work, src }`);
  if (!x || typeof x.s !== 'string') return;
  ok(exact(x.work, x.s), `${tag}: not found word for word in a held, cleared, unreviewed text (${x.work})`);
  ok(!/["“”‘’;:()—–]|--/.test(x.s) && !/(^|\s)'|'(\s|[.,!?]|$)/.test(x.s), `${tag}: quotation marks, a semicolon, a colon, a bracket or a dash`);
  ok(!ARCHAIC.test(x.s), `${tag}: an archaic word`);
  ok(/^[A-Z]/.test(x.s) && /[a-z][.!?]$/.test(x.s), `${tag}: not a whole sentence`);
  const bad = rushShape(x);
  ok(!bad, `${tag}: commas do not match the rule — ${bad}`);
}
const seenR = new Set(COMMAS.map((x) => collapse(x.s)));
(RU || []).forEach((x, i) => {
  const tag = `rush ${i + 1} "${String(x.s).slice(0, 40)}…"`;
  checkRush(x, tag);
  ok(!seenR.has(collapse(x.s)), `${tag}: duplicate`);
  seenR.add(collapse(x.s));
});
/* every rush item survives the live parse with all its commas */
if (RU) { const live = G.rushPool(3, RU), base = G.rushPool(3); if (live.length > base.length) ok(live.length === base.length + RU.length, `games.js rushPool drops ${base.length + RU.length - live.length} rush.json items`); }

// ── Figure Hunt ─────────────────────────────────────────────────────────────
const FIGS = ['simile', 'metaphor', 'personification', 'alliteration', 'none'];
const STOP = new Set(('a an the and or but of to in on at by for with from into onto as is are was were be been it its ' +
  'he she they them his her their him this that these those what which who whom how why when where one two both ' +
  'not no very more most all any some each other than then there here so do does did has have had can will would ' +
  'about after before over under up down out off our your you we i me my').split(' '));
const norm = (s) => collapse(lc(s).replace(/[‘’]/g, "'"));
const content = (s) => norm(s).replace(/[^a-z0-9' -]/g, ' ').split(/[\s-]+/).map((w) => w.replace(/^'+|'+$/g, '').replace(/'s$/, '')).filter((w) => w.length >= 3 && !STOP.has(w));
function checkFigure(f, tag) {
  ok(f && FIGS.includes(f.figure), `${tag}: unknown figure ${f && f.figure}`);
  ok(typeof f.text === 'string' && f.text.length <= 200, `${tag}: at most 200 characters`);
  ok(exact(f.work, f.text), `${tag}: not found word for word in a held, cleared, unreviewed text (${f.work})`);
  const t = ' ' + norm(f.text) + ' ', w = content(f.text);
  if (f.figure === 'simile') ok(/ (like|as) /.test(t), `${tag}: a simile must compare with "like" or "as"`);
  if (f.figure !== 'simile') ok(!/ like /.test(t), `${tag}: "like" in a line that is not a simile`);
  if (f.figure === 'none') {
    ok(!/ like | as /.test(t), `${tag}: marked none, but it has like / as`);
    const twin = w.findIndex((x, i) => i > 0 && x[0] === w[i - 1][0] && x !== w[i - 1]);
    ok(twin < 0, `${tag}: marked none, but "${w[twin - 1]} ${w[twin]}" alliterates`);
  }
  if (f.figure === 'simile' || f.figure === 'metaphor' || f.figure === 'personification') {
    const run = w.findIndex((x, i) => i >= 2 && [w[i - 1], w[i - 2], w[i - 3]].filter((y) => y && y[0] === x[0]).length >= 2);
    ok(run < 0, `${tag}: marked ${f.figure}, but a run of alliteration ends at "${w[run]}" — two right answers`);
  }
  if (f.figure === 'alliteration') ok(w.some((x, i) => i >= 1 && [w[i - 1], w[i - 2]].filter((y) => y && y[0] === x[0]).length >= 1), `${tag}: marked alliteration, but no two words close together share a first letter`);
}
const seenF = new Set(FIGURES.map((f) => collapse(f.text)));
const figCount = Object.fromEntries(FIGS.map((k) => [k, 0]));
FIGURES_MORE.forEach((f, i) => {
  const tag = `figure ${i + 1} "${String(f.text).slice(0, 40)}…"`;
  checkFigure(f, tag);
  figCount[f.figure] = (figCount[f.figure] || 0) + 1;
  ok(!seenF.has(collapse(f.text)), `${tag}: duplicate`);
  seenF.add(collapse(f.text));
});
{ /* a Figure Hunt round from the new lines: one right answer, the line's own figure */
  const figs = FIGURES_MORE.filter((f) => quotable(f.work));
  for (let L = 1; L <= 5; L++) for (let s = 0; s < 20; s++) {
    let r; try { r = G.figureRound(figs, WORKS, 'gp' + s, L); } catch { r = null; }
    if (!Array.isArray(r) || !r.length || !r[0].options) continue;   // the round's signature changed: leave it to test/games.mjs
    ok(r.every((q) => q.options.length >= 3 && q.answer >= 0 && q.answer < q.options.length && new Set(q.options).size === q.options.length), `Figure Hunt L${L}: a round from figures-more.js has a bad item`);
  }
}

// ── Rhetoric Duel ───────────────────────────────────────────────────────────
const DEVICES = ['anaphora', 'tricolon', 'antithesis', 'rhetorical question', 'alliteration', 'simile'];
function checkRhetoric(r, tag, plain = PLAIN_MORE) {
  ok(r && DEVICES.includes(r.device), `${tag}: device must be one of the duel's six (${r && r.device})`);
  ok(Array.isArray(r.also) && r.also.every((d) => DEVICES.includes(d)), `${tag}: also must list devices`);
  ok(!(r.also || []).includes(r.device), `${tag}: also lists its own device`);
  const wrong = DEVICES.filter((d) => d !== r.device && !(r.also || []).includes(d)).length + (r.device === 'rhetorical question' ? 1 : 0);
  ok(wrong >= 3, `${tag}: only ${wrong} wrong reasons left — also is too long`);
  ok(exact(r.work, r.text), `${tag}: not found word for word in a held, cleared, unreviewed text (${r.work})`);
  ok(DEVICE_GLOSS[r.device], `${tag}: no gloss for ${r.device}`);
  const p = plain[r.text];
  if (ok(typeof p === 'string' && p.trim().length > 5, `${tag}: no plainer version`)) {
    ok(!inAnyText(p), `${tag}: the plainer version is a quotation from a held text`);
    ok(norm(p) !== norm(r.text), `${tag}: the plainer version is the line itself`);
  }
}
const seenH = new Set(RHETORIC.map((r) => norm(r.text)));
RHETORIC_MORE.forEach((r, i) => {
  const tag = `rhetoric ${i + 1} "${String(r.text).slice(0, 40)}…"`;
  checkRhetoric(r, tag);
  ok(!seenH.has(norm(r.text)), `${tag}: duplicate`);
  seenH.add(norm(r.text));
});
ok(Object.keys(PLAIN_MORE).every((t) => RHETORIC_MORE.some((r) => r.text === t)), 'PLAIN_MORE has a version for a line that is not in RHETORIC_MORE');
ok(Object.keys(PLAIN_MORE).every((t) => !PLAIN[t]), 'PLAIN_MORE repeats a line PLAIN already has');
{ /* a Rhetoric Duel round from the new lines: four reasons, one right, never an `also` device */
  const rh = RHETORIC_MORE.filter((r) => quotable(r.work));
  for (let L = 1; L <= 5; L++) for (let s = 0; s < 20; s++) {
    let r; try { r = G.duelRound(rh, PLAIN_MORE, 'gp' + s, L); } catch { r = null; }
    if (!Array.isArray(r) || !r.length || !r[0].options) continue;
    ok(r.every((q) => q.options.length === 4 && new Set(q.options).size === 4 && q.options[q.answer] === q.device && q.options.every((o, k) => k === q.answer || !(rh.find((x) => x.text === q.original)?.also || []).includes(o))), `Rhetoric Duel L${L}: a round from rhetoric-more.js has a bad item`);
  }
}

// ── the checks must be able to fail ─────────────────────────────────────────
{
  const b0 = (B || [])[0] || { s: 'When the bell rang, [we went out to play].', band: 1, work: 'oz', src: 'x' };
  ok(catches(checkBuilder, { ...b0, s: b0.s.replace(/[a-z]{3,}/, (m) => m + 'x') }), 'the builder exactness check accepted an altered sentence: it is blind');
  ok(catches(checkBuilder, { ...b0, s: plainOf(b0.s) }), 'the builder parse check accepted a sentence with no [main clause]: it is blind');
  ok(catches(checkBuilder, { ...b0, work: 'peterpan' }), 'the builder rights check accepted a held-back work: it is blind');
  ok(catches(checkBuilder, { ...b0, extra: 1 }), 'the builder shape check accepted an extra field: it is blind');
  const end = (B || []).find((x) => x.s.startsWith('['));
  if (end) ok(catches(checkBuilder, { ...end, s: end.s.replace(/^\[(\S+) /, (m, w) => `[Then ${lc(w)} `) }), 'the builder subject check accepted a main clause opened by "Then": it is blind');
  const r0 = (RU || []).find((x) => x.rule === 'compound') || { s: 'The sky grew dark, so we ran inside.', rule: 'compound', band: 1, work: 'oz', src: 'x' };
  ok(catches(checkRush, { ...r0, rule: 'aside' }), 'the rush shape check accepted a compound sentence marked as an aside: it is blind');
  ok(rushShape({ ...r0, s: r0.s.replace(/ (\S+) (\S+)\.$/, ' $1, $2.') }) !== null, 'the rush shape check accepted a stray extra comma: it is blind');
  ok(rushShape({ s: 'We bought apples, pears, and plums.', rule: 'list' }) !== null, 'the rush list check accepted a comma before "and": it is blind');
  ok(catches(checkRush, { ...r0, s: r0.s + ' x' }), 'the rush exactness check accepted an altered sentence: it is blind');
  const none = FIGURES_MORE.find((f) => f.figure === 'none');
  ok(catches(checkFigure, { ...none, text: none.text.replace(/\.$/, ' like a cat.') }), 'the none check accepted a line with "like": it is blind');
  ok(catches(checkFigure, { text: 'Peter Piper picked a peck of pickled peppers.', work: 'oz', figure: 'none' }), 'the figure exactness / alliteration check is blind');
  ok(catches(checkFigure, { ...FIGURES_MORE.find((f) => f.figure === 'alliteration'), figure: 'metaphor' }), 'the hidden-alliteration check accepted an alliteration line marked metaphor: it is blind');
  const h0 = RHETORIC_MORE[0];
  ok(catches(checkRhetoric, { ...h0, also: [h0.device] }), 'the also check accepted a line whose also lists its own device: it is blind');
  ok(catches(checkRhetoric, { ...h0, also: DEVICES.filter((d) => d !== h0.device).slice(0, 3) }), 'the three-wrong-reasons check is blind');
  ok(catches((r, t) => checkRhetoric(r, t, { [h0.text]: 'It was the best of times' }), h0), 'the plain-version check accepted a quotation: it is blind');
  ok(catches(checkRhetoric, { ...h0, work: 'douglass' }), 'the rhetoric rights check accepted a work waiting on a reviewer: it is blind');
}

// ── counts ──────────────────────────────────────────────────────────────────
const per = (a, b) => (a || []).filter((x) => x.band === b).length;
for (const b of [1, 2, 3]) {
  ok(per(B, b) >= MIN.builder, `builder band ${b}: ${per(B, b)} sentences (needs ${MIN.builder})`);
  ok(per(RU, b) >= MIN.rush, `rush band ${b}: ${per(RU, b)} sentences (needs ${MIN.rush})`);
}
ok(FIGURES_MORE.length >= MIN.figures, `figures-more: ${FIGURES_MORE.length} lines (needs ${MIN.figures})`);
ok(figCount.metaphor >= MIN.metaphor && figCount.personification >= MIN.personification, `figures-more: metaphor ${figCount.metaphor}, personification ${figCount.personification} (needs ${MIN.metaphor} each)`);
ok(RHETORIC_MORE.length >= MIN.rhetoric, `rhetoric-more: ${RHETORIC_MORE.length} lines (needs ${MIN.rhetoric})`);

if (fails.length) {
  for (const f of fails.slice(0, 60)) console.error('  ✗ ' + f);
  if (fails.length > 60) console.error(`  … and ${fails.length - 60} more`);
  console.error(`game-pools: ${fails.length} of ${checks} checks failed`);
  process.exit(1);
}
const rules = [...new Set((RU || []).map((x) => x.rule))].map((r) => `${r} ${(RU || []).filter((x) => x.rule === r).length}`).join(', ');
console.log(`game-pools: all ${checks} passed — builder ${B.length} (${[1, 2, 3].map((b) => per(B, b)).join('/')}), rush ${RU.length} (${[1, 2, 3].map((b) => per(RU, b)).join('/')}; ${rules}), ` +
  `figures +${FIGURES_MORE.length} (${FIGS.map((k) => `${k} ${figCount[k]}`).join(', ')}), rhetoric +${RHETORIC_MORE.length}`);
