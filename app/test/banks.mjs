// banks.mjs — holds the Word and Sentence item banks (src/data/sentences.js, wordparts.js) to
// their structural rules. Run: node test/banks.mjs. Exits 1 on any failure.
//
// Every word in the word-part banks must be in Bizzing Bee's own word list, and every source
// must be a Bee concept chapter title or a Bee words-lore entry. That check needs Bee's data,
// pinned at /tmp/claude-0/beepin (BEE_PIN overrides); without it the check is skipped, loudly.

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as S from '../src/data/sentences.js';
import * as WP from '../src/data/wordparts.js';

let passed = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

const BANDS = [1, 2, 3];
const bandsOf = list => BANDS.map(b => list.filter(x => x.band === b).length);
const countAtLeast = (name, list, n) => check(`${name}: at least ${n} items`, list.length >= n, `has ${list.length}`);
const bandCheck = (name, list, mins = [10, 10, 10]) => {
  check(`${name}: every item has band 1|2|3`, list.every(x => BANDS.includes(x.band)),
    JSON.stringify(list.find(x => !BANDS.includes(x.band))));
  const counts = bandsOf(list);
  BANDS.forEach((b, i) => check(`${name}: band ${b} has ≥${mins[i]}`, counts[i] >= mins[i], `has ${counts[i]}`));
};
const endsSentence = s => /[.!?]$/.test(s);
const startsCap = s => /^[A-Z]/.test(s);

// ── POS ────────────────────────────────────────────────────────────────────────────────────
const TAGS = new Set(Object.keys(S.POS_TAGS));
const PUNCT = new Set([',', '.', '!', '?', '—']);
countAtLeast('POS', S.POS, 90);
bandCheck('POS', S.POS);
for (const { s } of S.POS) {
  const toks = s.split(' ').map(t => {
    const i = t.lastIndexOf('/');
    return { w: t.slice(0, i), tag: t.slice(i + 1) };
  });
  check('POS: every token is word/TAG with a known tag', toks.every(t => t.w && TAGS.has(t.tag)), s);
  check('POS: punctuation and only punctuation is tagged "."',
    toks.every(t => PUNCT.has(t.w) === (t.tag === '.')), s);
  check('POS: no token mixes letters and punctuation', toks.every(t => t.tag === '.' || /^[A-Za-z'-]+$/.test(t.w)), s);
  const tags = new Set(toks.map(t => t.tag));
  check('POS: has a noun, a verb and an adjective or adverb', tags.has('N') && tags.has('V') && (tags.has('A') || tags.has('R')), s);
  check('POS: starts with a capital and ends with . ! or ?', startsCap(toks[0].w) && ['.', '!', '?'].includes(toks.at(-1).w), s);
}

// ── SUBJECT ────────────────────────────────────────────────────────────────────────────────
countAtLeast('SUBJECT', S.SUBJECT, 50);
bandCheck('SUBJECT', S.SUBJECT);
for (const { s } of S.SUBJECT) {
  const parts = s.split('|');
  check('SUBJECT: exactly one "|"', parts.length === 2, s);
  check('SUBJECT: both sides non-empty', parts.length === 2 && parts.every(p => p.trim()), s);
  check('SUBJECT: a statement (capital, full stop, no question)', startsCap(s) && s.endsWith('.') && !s.includes('?'), s);
}

// ── PHRASE_CLAUSE ──────────────────────────────────────────────────────────────────────────
countAtLeast('PHRASE_CLAUSE', S.PHRASE_CLAUSE, 50);
bandCheck('PHRASE_CLAUSE', S.PHRASE_CLAUSE);
for (const x of S.PHRASE_CLAUSE) {
  check('PHRASE_CLAUSE: kind is phrase or clause', x.kind === 'phrase' || x.kind === 'clause', x.text);
  check('PHRASE_CLAUSE: shown without a capital (except I) or final punctuation',
    !/[.!?,]$/.test(x.text) && (/^[a-z]/.test(x.text) || /^I /.test(x.text)), x.text);
}
{
  const ph = S.PHRASE_CLAUSE.filter(x => x.kind === 'phrase').length;
  const cl = S.PHRASE_CLAUSE.length - ph;
  check('PHRASE_CLAUSE: phrases and clauses roughly half and half', Math.abs(ph - cl) <= S.PHRASE_CLAUSE.length * 0.2, `${ph} phrases, ${cl} clauses`);
}

// ── MAIN_CLAUSE ────────────────────────────────────────────────────────────────────────────
countAtLeast('MAIN_CLAUSE', S.MAIN_CLAUSE, 40);
bandCheck('MAIN_CLAUSE', S.MAIN_CLAUSE, [5, 10, 10]);
for (const { s } of S.MAIN_CLAUSE) {
  const m = s.match(/^([^[\]]*)\[([^[\]]+)\]([^[\]]*)$/);
  check('MAIN_CLAUSE: exactly one [..] pair', !!m && (s.match(/\[/g) || []).length === 1 && (s.match(/\]/g) || []).length === 1, s);
  if (m) {
    const outside = (m[1] + m[3]).replace(/[,.!?\s]/g, '');
    check('MAIN_CLAUSE: a dependent clause outside the brackets', outside.length > 0, s);
    check('MAIN_CLAUSE: the bracketed clause holds no punctuation', !/[,.!?]/.test(m[2]), s);
  }
  check('MAIN_CLAUSE: a full sentence', startsCap(s.replace(/^\[/, '')) && endsSentence(s), s);
}

// ── CONJ ───────────────────────────────────────────────────────────────────────────────────
const FAN = new Set(S.FANBOYS);
const SUB = new Set(S.SUBORDINATORS);
// Pairs that can both be right somewhere — never set one against the other.
const TWINS = [['but', 'yet'], ['for', 'because'], ['since', 'because'], ['while', 'although'], ['while', 'until']];
const NEVER_WRONG = { so: ['and'], but: ['and'] }; // 'and' can quietly carry a result or a contrast
countAtLeast('CONJ', S.CONJ, 50);
bandCheck('CONJ', S.CONJ);
for (const x of S.CONJ) {
  const id = `${x.a} / ${x.b}`;
  const fam = FAN.has(x.right) ? FAN : SUB.has(x.right) ? SUB : null;
  check('CONJ: right is a FANBOYS word or a known subordinator', !!fam, id);
  check('CONJ: at least two wrong options', Array.isArray(x.wrong) && x.wrong.length >= 2, id);
  check('CONJ: right is not among the wrong', !x.wrong.includes(x.right), id);
  check('CONJ: wrong options are distinct', new Set(x.wrong).size === x.wrong.length, id);
  check('CONJ: wrong options come from the same family as right', !!fam && x.wrong.every(w => fam.has(w)), id);
  check('CONJ: subordinators only in band 3', fam !== SUB || x.band === 3, id);
  check('CONJ: never sets two words that can both be right against each other',
    !TWINS.some(([p, q]) => (x.right === p && x.wrong.includes(q)) || (x.right === q && x.wrong.includes(p))), id);
  check('CONJ: "and" is never the wrong answer to "so" or "but"', !(NEVER_WRONG[x.right] || []).some(w => x.wrong.includes(w)), id);
  check('CONJ: a starts with a capital; a and b carry no final punctuation',
    startsCap(x.a) && !/[.,!?;]$/.test(x.a) && !/[.,!?;]$/.test(x.b) && x.b.trim() === x.b, id);
}

// ── COMMAS ─────────────────────────────────────────────────────────────────────────────────
const RULES = new Set(['list', 'fronted', 'address', 'yesno', 'aside', 'compound']);
countAtLeast('COMMAS', S.COMMAS, 60);
bandCheck('COMMAS', S.COMMAS);
for (const x of S.COMMAS) {
  const n = (x.s.match(/,/g) || []).length;
  check('COMMAS: at least one comma', n >= 1, x.s);
  check('COMMAS: a known rule', RULES.has(x.rule), x.s);
  check('COMMAS: a full sentence', startsCap(x.s) && endsSentence(x.s), x.s);
  if (x.rule === 'list') check('COMMAS: no Oxford comma', !/, (and|or) /.test(x.s) && n >= 1, x.s);
  if (x.rule === 'aside') check('COMMAS: an aside is closed by a second comma', n === 2, x.s);
  if (x.rule === 'yesno') check('COMMAS: yes/no opens the sentence', /^(Yes|No), /.test(x.s), x.s);
  if (x.rule === 'compound') check('COMMAS: the comma comes before a FANBOYS word', /, (for|and|nor|but|or|yet|so) /.test(x.s), x.s);
}
check('COMMAS: every rule is represented', [...RULES].every(r => S.COMMAS.some(x => x.rule === r)));

// ── CAPS ───────────────────────────────────────────────────────────────────────────────────
countAtLeast('CAPS', S.CAPS, 40);
bandCheck('CAPS', S.CAPS);
for (const { s } of S.CAPS) {
  const words = s.replace(/[.,!?]/g, '').split(' ');
  check('CAPS: starts with a capital and ends a sentence', startsCap(s) && endsSentence(s), s);
  check('CAPS: something to find besides the first word', words.slice(1).some(w => /^[A-Z]/.test(w)), s);
  check('CAPS: no all-capital words', words.every(w => w === 'I' || !/^[A-Z]{2,}$/.test(w)), s);
}

// ── END ────────────────────────────────────────────────────────────────────────────────────
countAtLeast('END', S.END, 40);
bandCheck('END', S.END);
for (const { s } of S.END) check('END: one end mark, at the end', /^[^.!?]+[.!?]$/.test(s.replace(/o'clock/, 'oclock')), s);
for (const mark of ['.', '?', '!']) {
  const n = S.END.filter(x => x.s.endsWith(mark)).length;
  check(`END: "${mark}" is a quarter or more of the bank`, n >= S.END.length / 4, `${n} of ${S.END.length}`);
}

// ── ORDER ──────────────────────────────────────────────────────────────────────────────────
countAtLeast('ORDER', S.ORDER, 50);
bandCheck('ORDER', S.ORDER);
for (const { s } of S.ORDER) {
  const words = s.replace(/[.!?]$/, '').split(' ');
  check('ORDER: 5–12 words', words.length >= 5 && words.length <= 12, `${words.length}: ${s}`);
  const low = words.map(w => w.toLowerCase());
  check('ORDER: no word used twice (else one order is unprovable)', new Set(low).size === low.length, s);
  check('ORDER: no comma or mid-sentence punctuation', !/[,;:—]/.test(s), s);
  check('ORDER: a full sentence', startsCap(s) && endsSentence(s), s);
}

// ── COMBINE ────────────────────────────────────────────────────────────────────────────────
const norm = t => t.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]$/, '');
countAtLeast('COMBINE', S.COMBINE, 30);
bandCheck('COMBINE', S.COMBINE);
for (const x of S.COMBINE) {
  const id = `${x.a} + ${x.b}`;
  check('COMBINE: two full sentences to join', [x.a, x.b].every(t => startsCap(t) && endsSentence(t)), id);
  check('COMBINE: accept is non-empty', Array.isArray(x.accept) && x.accept.length > 0, id);
  check('COMBINE: says what to use', typeof x.use === 'string' && x.use.length > 0, id);
  check('COMBINE: accepted answers are full sentences', (x.accept || []).every(t => startsCap(t) && endsSentence(t)), id);
  check('COMBINE: accepted answers are distinct once normalised', new Set((x.accept || []).map(norm)).size === (x.accept || []).length, id);
  check('COMBINE: an answer is not just one of the inputs', !(x.accept || []).some(t => norm(t) === norm(x.a) || norm(t) === norm(x.b)), id);
  if (/^[a-z]+$/.test(x.use) && !['adjective', 'phrase', 'participle'].includes(x.use))
    check('COMBINE: the first answer uses the word asked for', new RegExp(`\\b${x.use}\\b`, 'i').test(x.accept[0]), id);
}

// ── Word parts ─────────────────────────────────────────────────────────────────────────────
const PIN = process.env.BEE_PIN || '/tmp/claude-0/beepin';
let bee = null;
if (existsSync(`${PIN}/words-full.js`)) {
  const require = createRequire(import.meta.url);
  globalThis.window = globalThis.window || {};
  require(`${PIN}/words-full.js`);
  const words = new Map(JSON.parse(window.SB_FULL).map(r => [r.w, r]));
  let titles = null, lore = null;
  if (existsSync(`${PIN}/concepts-data.js`) && existsSync(`${PIN}/adv-concepts-data.js`)) {
    require(`${PIN}/concepts-data.js`);
    require(`${PIN}/adv-concepts-data.js`);
    titles = new Set([...window.SB_CONCEPTS.chapters, ...window.SB_ADV_CONCEPTS.chapters].map(c => c.title));
  }
  if (existsSync(`${PIN}/words-lore.js`)) { require(`${PIN}/words-lore.js`); lore = window.SB_LORE; }
  bee = { words, titles, lore };
} else {
  console.warn(`banks: WARNING — Bee data not found at ${PIN}; word-existence and source checks SKIPPED`);
}
const inBee = w => !bee || bee.words.has(w);
const sourceOk = src => {
  if (typeof src !== 'string' || !src) return false;
  if (!bee) return true;
  const m = src.match(/^Bee words-lore: ([a-z-]+)$/);
  if (m) return !bee.lore || !!bee.lore[m[1]];
  return !bee.titles || bee.titles.has(src);
};
const wordOk = w => typeof w === 'string' && /^[a-z][a-z-]*$/.test(w);

// RIMES
countAtLeast('RIMES', WP.RIMES, 16);
for (const r of WP.RIMES) {
  check('RIMES: 8–14 words', r.words.length >= 8 && r.words.length <= 14, `${r.rime}: ${r.words.length}`);
  check('RIMES: no repeats', new Set(r.words).size === r.words.length, r.rime);
  for (const w of r.words) {
    check('RIMES: word ends in its rime', w.endsWith(r.rime), `${r.rime}: ${w}`);
    check('RIMES: lower-case word', wordOk(w), w);
    check('RIMES: word is in Bee', inBee(w), `${r.rime}: ${w}`);
    check('RIMES: word is Bee difficulty 1–2', !bee || (bee.words.get(w)?.y ?? 9) <= 2, `${r.rime}: ${w}`);
  }
}

// PREFIXES
const NEED_P = ['un', 're', 'pre', 'dis', 'mis', 'non', 'over', 'under', 'sub', 'inter', 'super', 'anti', 'in', 'im', 'trans', 'semi', 'bi', 'tri', 'auto'];
countAtLeast('PREFIXES', WP.PREFIXES, 14);
for (const p of NEED_P) check('PREFIXES: covers the required prefix', WP.PREFIXES.some(x => x.p === p), p);
for (const x of WP.PREFIXES) {
  check('PREFIXES: has a meaning', !!x.meaning, x.p);
  check('PREFIXES: cites a Bee chapter or words-lore entry', sourceOk(x.source), `${x.p}: ${x.source}`);
  check('PREFIXES: at least 8 pairs', x.words.length >= 8, `${x.p}: ${x.words.length}`);
  for (const [w, base] of x.words) {
    check('PREFIXES: word = prefix + base', w === x.p + base, `${x.p}: ${w} / ${base}`);
    check('PREFIXES: lower-case words', wordOk(w) && wordOk(base), w);
    check('PREFIXES: word is in Bee', inBee(w), `${x.p}: ${w}`);
    check('PREFIXES: base is in Bee', inBee(base), `${x.p}: ${base}`);
  }
}

// SUFFIXES
const NEED_S = ['ful', 'less', 'ness', 'ly', 'er', 'ment', 'able', 'ish', 'ous', 'tion', 'est', 'y'];
const MAKES = new Set(['noun', 'adjective', 'adverb', 'verb']);
countAtLeast('SUFFIXES', WP.SUFFIXES, 12);
for (const s of NEED_S) check('SUFFIXES: covers the required suffix', WP.SUFFIXES.some(x => x.s === s), s);
for (const x of WP.SUFFIXES) {
  check('SUFFIXES: has a meaning and the class it makes', !!x.meaning && MAKES.has(x.makes), x.s);
  check('SUFFIXES: cites a Bee chapter or words-lore entry', sourceOk(x.source), `${x.s}: ${x.source}`);
  check('SUFFIXES: at least 8 pairs', x.words.length >= 8, `${x.s}: ${x.words.length}`);
  for (const [w, base] of x.words) {
    check('SUFFIXES: word ends in the suffix', w.endsWith(x.s), `${x.s}: ${w}`);
    // the base may change its end (happy → happi-, bake → bak-) but keeps its start
    const stem = base.replace(/(y|e)$/, '');
    check('SUFFIXES: word is built on the base', w.startsWith(stem.slice(0, Math.max(2, stem.length - 1))) && w !== base, `${x.s}: ${w} / ${base}`);
    check('SUFFIXES: lower-case words', wordOk(w) && wordOk(base), w);
    check('SUFFIXES: word is in Bee', inBee(w), `${x.s}: ${w}`);
    check('SUFFIXES: base is in Bee', inBee(base), `${x.s}: ${base}`);
  }
}

// ROOTS
countAtLeast('ROOTS', WP.ROOTS, 30);
check('ROOTS: no root listed twice', new Set(WP.ROOTS.map(r => r.root)).size === WP.ROOTS.length);
for (const r of WP.ROOTS) {
  check('ROOTS: meaning and origin given', !!r.meaning && /^(Latin|Greek) /.test(r.from || ''), r.root);
  check('ROOTS: band 2 or 3', r.band === 2 || r.band === 3, r.root);
  check('ROOTS: cites a Bee chapter or words-lore entry', sourceOk(r.source), `${r.root}: ${r.source}`);
  check('ROOTS: at least 5 words', r.words.length >= 5, `${r.root}: ${r.words.length}`);
  check('ROOTS: no repeats', new Set(r.words).size === r.words.length, r.root);
  const forms = r.root.split(' / ');
  for (const w of r.words) {
    check('ROOTS: word contains the root', forms.some(f => w.includes(f)), `${r.root}: ${w}`);
    check('ROOTS: lower-case word', wordOk(w), w);
    check('ROOTS: word is in Bee', inBee(w), `${r.root}: ${w}`);
  }
}

// REGISTER
countAtLeast('REGISTER', WP.REGISTER, 30);
check('REGISTER: no formal word twice', new Set(WP.REGISTER.map(x => x.formal)).size === WP.REGISTER.length);
check('REGISTER: no informal word twice', new Set(WP.REGISTER.map(x => x.informal)).size === WP.REGISTER.length);
for (const x of WP.REGISTER) {
  check('REGISTER: band 3', x.band === 3, x.formal);
  check('REGISTER: two different lower-case words', wordOk(x.formal) && wordOk(x.informal) && x.formal !== x.informal, x.formal);
  check('REGISTER: both words are in Bee', inBee(x.formal) && inBee(x.informal), `${x.formal} / ${x.informal}`);
}

// ── Result ─────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  const shown = [...new Set(failures)];
  console.error(`banks: ${failures.length} failed, ${passed} passed`);
  for (const f of shown.slice(0, 60)) console.error(`  ✗ ${f}`);
  if (shown.length > 60) console.error(`  … and ${shown.length - 60} more`);
  process.exit(1);
}
console.log(`banks: all ${passed} passed`);
