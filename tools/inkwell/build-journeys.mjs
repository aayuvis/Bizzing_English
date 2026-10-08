#!/usr/bin/env node
// build-journeys.mjs — the four Ink Journeys as case files (format 1.3, kind "journey"), so detective.js plays them with
// the same engine: app/src/data/journeys/journey-01.json … journey-04.json.
//
//   node tools/inkwell/build-journeys.mjs           write them
//   node tools/inkwell/build-journeys.mjs --check   exit 1 if any is out of date (the gate runs it)
//
// The script is the source (tools/inkwell/scripts/journey-0N.md, cut from docs/inkwell/season-one.md Part 9b). Every word
// a child reads — documents, answers, statements, Quill's lines, the reveal, the epilogue, the Training Desk — is read
// from it by journey-parse.mjs, word for word. What this file adds is only STRUCTURE the scripts state in prose: ids, who
// is a suspect, which clues prove a deduction, which document a question unlocks. The validator then holds every document
// body to its script (validate-cases.mjs --scripts) and the solver bot proves each Journey solvable (test/detective.mjs).
//
// QUOTATIONS (CLAUDE.md hard rule 2): the Journeys quote the Homeric Hymn to Hermes (Evelyn-White, 1914), the Poetic Edda
// (Bellows, 1923), Romeo and Juliet and Mark Twain's letters. None of those texts is held by the app today (tools/texts,
// data/library.js), so no line can be checked against a held text: every such quotation is listed in `quotes` with
// `held: false, needsReview: true`, and test/detective.mjs keeps it that way until the work is held and the line found.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as J from './journey-parse.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const OUT = path.join(ROOT, 'app', 'src', 'data', 'journeys');
const read = (n) => fs.readFileSync(path.join(HERE, 'scripts', `journey-0${n}.md`), 'utf8');
const C = J.cleanMd;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- per-Journey structure (what the scripts say in prose) ---------- */
const SPEC = {
  1: {
    title: 'The Case of the Backwards Cattle', level: 2, world: 'olympus', setting: 'the Homeric Hymn to Hermes: Pieria, Onchestus, Mount Cyllene and Olympus',
    companion: 'nell', judge: 'zeus', badge: 'katha', souvenir: { id: 'plectrum', name: 'a tortoise-shell plectrum' }, after: 'case-03',
    source: 'the Homeric Hymn to Hermes (Hymn 4), retold; quoted lines from H. G. Evelyn-White\'s translation (Loeb, 1914)',
    skills: ['inference', 'sequence', 'detail', 'figurative'],
    cast: { 'The old man of Onchestus': ['oldman', 'suspect'], 'Maia': ['maia', 'suspect'], 'Hermes': ['hermes', 'suspect'], 'Apollo': ['apollo', 'client'], 'Kleon': ['kleon', 'witness'], 'Zeus': ['zeus', 'helper'] },
    extraCast: [['nell', 'Nell Okafor-Hart', 'agency'], ['quill', 'Quill', 'agency']],
    who: { 'The old man of Onchestus': 'oldman', 'Maia': 'maia', 'Hermes, one day old': 'hermes', 'Apollo': 'apollo' },
    ch4Questions: { who: 'oldman', where: 'maia' },          // "New interview line, on the cloud" / "Maia's secret, on the next cloud"
    deductions: {
      D1: { type: 'inference', skill: 'inference', label: 'the impossible thing', min: [['tracks-in', 'empty']] },
      D2: { type: 'inference', skill: 'detail', alsoKinds: ['figurative'], label: 'the disguise', min: [['fig', 'twigs'], ['broom', 'om-knee']] },
      D3: { type: 'contradiction', skill: 'contradiction', alsoKinds: ['timeline'], label: 'the alibi', min: [['noon', 'not-stirred'], ['shell', 'her-twang']] },
    },
    culprit: 'hermes', theories: { 'wolf': ['the wolf', 'a wolf'], 'lost-count': ['Apollo lost count'] },
    redHerrings: [
      { suspect: 'oldman', clearedBy: ['om-knee', 'fig', 'om-feet'], suspicion: ['om-brush', 'om-vines', 'om-promise', 'om-staff'] },
      { suspect: 'maia', clearedBy: ['maia-sisters'], suspicion: ['maia-dodge', 'maia-things'] },
    ],
    wrongTheoryClears: { wolf: ['no-wolf', 'not-man'] },
    unlocks: {},
  },
  2: {
    title: 'The Case of the Missing Hammer', level: 3, world: 'asgard', setting: 'Þrymskviða, the Lay of Thrym: Thor\'s hall, the dwarves\' forge, Jötunheim and the Thing',
    companion: 'dev', judge: 'heimdall', badge: 'katha', souvenir: { id: 'falcon-feather', name: 'a falcon feather from Freyja\'s cloak' }, after: 'case-05',
    source: 'Þrymskviða, the Lay of Thrym, in the Poetic Edda, retold; quoted lines from Henry Adams Bellows\'s translation (1923)',
    skills: ['inference', 'factopinion', 'figurative', 'voice'],
    cast: { 'Loki': ['loki', 'suspect'], 'Brokkr and Sindri': ['dwarves', 'suspect'], 'Tooth-Gnasher and Tooth-Grinder': ['goats', 'suspect'], 'Thrym': ['thrym', 'suspect'], 'Thor': ['thor', 'client'], 'Sif': ['sif', 'witness'], 'Freyja': ['freyja', 'witness'], 'Heimdall': ['heimdall', 'helper'] },
    extraCast: [['dev', 'Dev Raman', 'agency'], ['quill', 'Quill', 'agency']],
    who: { 'Loki': 'loki', 'Brokkr and Sindri': 'dwarves', 'Tooth-Gnasher and Tooth-Grinder': 'goats', 'Thrym, lord of the giants': 'thrym', 'The goats': 'goats' },
    deductions: {
      D1: { type: 'inference', skill: 'inference', label: 'someone from the north', min: [['rime', 'rime-lore']] },
      D2: { type: 'fact-opinion', skill: 'factopinion', label: 'the boast is a confession', min: [['thrym-hid', 'thrym-price'], ['thrym-price', 'freyja']] },
      D3: { type: 'contradiction', skill: 'contradiction', alsoKinds: ['timeline'], label: 'Loki is cleared', min: [['cloak-sunrise', 'roof-creak', 'slate-loki']], finishIn: 4 },
      D4: { type: 'inference', skill: 'inference', alsoKinds: ['figurative'], label: 'the impossible thing', min: [['peg-under', 'soot-stripe'], ['roof-creak', 'thrym-feet']] },
    },
    culprit: 'thrym', theories: { 'loki-let-him-in': ['Loki let the giant in'] },
    redHerrings: [
      { suspect: 'loki', clearedBy: ['cloak-sunrise', 'roof-creak', 'slate-loki', 'slate-cord'], suspicion: ['loki-dusk', 'loki-nothing', 'thrym-hint'] },
      { suspect: 'dwarves', clearedBy: ['dw-hot', 'dw-tracks', 'no-prints'] },
      { suspect: 'goats', clearedBy: ['goats-no', 'goats-latched'] },
    ],
    feast: true,
    unlocks: {},
  },
  3: {
    title: 'The Letter That Never Came', level: 4, world: 'verona', setting: 'Romeo and Juliet: Will\'s room in London, about 1595, and Verona',
    companion: 'felix', judge: 'prince', badge: 'katha-notes', souvenir: { id: 'wills-quill', name: 'Will\'s quill, a goose-feather pen' }, after: 'case-07',
    source: 'William Shakespeare, Romeo and Juliet (about 1595); his source, Arthur Brooke, The Tragicall Historye of Romeus and Juliet (1562)',
    skills: ['sequence', 'inference', 'contradiction', 'voice', 'figurative'],
    cast: { 'Friar John': ['friar-john', 'suspect'], 'Balthasar': ['balthasar', 'suspect'], 'Lord Capulet': ['capulet', 'suspect'], 'Friar Laurence': ['laurence', 'suspect'] },
    extraCast: [['chain', 'A chain of three links: nobody a villain', 'answer'], ['will', 'Will', 'client'], ['prince', 'Prince Escalus', 'helper'], ['felix', 'Felix Moreno-Lindqvist', 'agency'], ['quill', 'Quill', 'agency']],
    who: { 'Friar John': 'friar-john', 'Balthasar': 'balthasar', 'Lord Capulet': 'capulet', 'Friar Laurence': 'laurence' },
    deductions: {
      D1: { type: 'timeline', skill: 'sequence', label: 'haste', min: [['tochurch', 'tomorrownight']] },
      D2: { type: 'inference', skill: 'inference', alsoKinds: ['meaning'], label: 'chance: the sealed door', min: [['sealed', 'shutbook'], ['searchers', 'couldnotsend']], finishIn: 4 },
      D3: { type: 'inference', skill: 'inference', label: 'fast and wrong', min: [['isaw', 'gatebal']] },
      D4: { type: 'inference', skill: 'inference', label: 'a plan with no spare', min: [['onebrother', 'myletters'], ['onebrother', 'writeagain']] },
      D5: { type: 'contradiction', skill: 'contradiction', label: 'the lie', min: [['caplie', 'toosoon'], ['caplie', 'notthursday']], isTheLie: true },
    },
    culprit: 'chain', theories: { 'the-stars': ['the stars'] },
    redHerrings: [
      { suspect: 'friar-john', clearedBy: ['sealed', 'shutbook', 'twofriars', 'askedmessenger', 'couldnotsend'], suspicion: ['detained', 'nofriar', 'window', 'waved'] },
      { suspect: 'balthasar', clearedBy: ['isaw'] },
      { suspect: 'laurence', clearedBy: ['onebrother', 'learned'] },
    ],
    wrongTheoryClears: { 'the-stars': ['starcrossd', 'tellsend'] },
    unlocks: { 'J3.7': 'balthasar-q1', 'J3.8': 'balthasar-q1' },
  },
  4: {
    title: 'The Pirated Chapter', level: 4, world: 'mississippi', setting: 'the steamer Delta Wren on the Mississippi, spring 1882',
    companion: 'asha', judge: 'mott', badge: 'katha-notes', souvenir: { id: 'lead-line-marker', name: 'a leather lead-line marker, the two-fathom tag' }, after: 'case-09',
    source: 'Mark Twain, Life on the Mississippi (1883), his letters and published notes; the visit, the boat and every suspect are made up',
    skills: ['voice', 'inference', 'contradiction', 'sequence', 'punctuation'],
    cast: { 'Mr Halloway Brisk': ['brisk', 'suspect'], 'Miss Prudence Lark': ['lark', 'suspect'], 'Jem': ['jem', 'suspect'], 'Miss Honora Fitch': ['fitch', 'suspect'] },
    extraCast: [['twain', 'Mark Twain', 'client'], ['mott', 'Captain Ezra Mott', 'helper'], ['strode', 'Mr Caleb Strode', 'witness'], ['pryce', 'Mr Lemuel Pryce', 'witness'], ['holt', 'Mr Gus Holt', 'witness'], ['asha', 'Asha Raman', 'agency'], ['quill', 'Quill', 'agency']],
    who: { 'Mr Halloway Brisk': 'brisk', 'Miss Prudence Lark': 'lark', 'Jem': 'jem', 'Miss Honora Fitch': 'fitch', 'Mark Twain': 'twain', 'Miss Lark': 'lark', 'Miss Fitch': 'fitch' },
    deductions: {
      D1: { type: 'voice', skill: 'voice', label: 'the copier did not understand', min: [['keel-words', 'copy-never']] },
      D2: { type: 'voice', skill: 'voice', label: 'one writer', requiredLinks: [['copy-shall', 'brisk-shall'], ['copy-forty', 'brisk-forty']] },
      D3: { type: 'timeline', skill: 'sequence', alsoKinds: ['contradiction'], label: 'Jem was working', min: [['log-leadsin', 'watch-wheel']], finishIn: 4 },
      D4: { type: 'inference', skill: 'inference', label: 'the impossible thing', min: [['twodoors', 'twain-hook'], ['locked', 'log-lamp']] },
      D5: { type: 'contradiction', skill: 'contradiction', label: 'the one lie', min: [['brisk-lie', 'stew-thu']], isTheLie: true, finishIn: 4 },
    },
    culprit: 'brisk', theories: { 'sleepwalking': ['Mr Twain did it himself, sleepwalking', 'Mr Twain moved the pages himself, sleepwalking'] },
    redHerrings: [
      { suspect: 'jem', clearedBy: ['watch-wheel', 'watch-never', 'log-cub', 'jem-river'], suspicion: ['log-leadsin', 'no9', 'jem-copybook'] },
      { suspect: 'lark', clearedBy: ['first-dawn', 'lark-cairo', 'lark-missed'] },
      { suspect: 'fitch', clearedBy: ['fitch-keep', 'fitch-never', 'fitch-3'] },
    ],
    wrongTheoryClears: { sleepwalking: ['copy-never', 'copy-batch'] },
    unlocks: {},
  },
};

/* Persona blocks the scripts give as prose (Journey 3) are set here as candidate ids taken from the script's own table. */
const PERSONA_J3 = {
  thea: { chapter: 3, candidates: ['gap:no-letter-in-J3.8', 'gap:no-hour-after-vespers', 'gap:no-reason-for-detained'] },
  milo: { chapter: 1, candidates: ['para:Romeo will learn the plan from my letter.', 'para:Romeo will write me a letter about the plan.', 'para:Romeo learned the plan from my letters yesterday.'], on: 'myletters' },
  oskar: { chapter: 2, candidates: ['link:wedtomorrow+toosoon', 'link:noon+vespers', 'link:dreams+sleeplooks'], memory: 'Wednesday' },
  signe: { chapter: 4, candidates: ['slot:between-8-10', 'slot:between-1-2', 'pair:12+13'] },
  hari: { chapter: 2, candidates: ['knew:isaw', 'wanted:to bring news every day', 'didntKnow:about the Friar\'s letter'], writer: 'balthasar' },
  vani: { chapter: 3, candidates: ['root:message', 'root:mess', 'root:messy'], word: 'messenger' },
};

/* Quotations of real texts, by where they sit. None of these works is held by the app (see the header). */
const QUOTES = {
  1: [
    { text: 'Born with the dawning, at mid-day he played on the lyre, and in the evening he stole the cattle of far-shooting Apollo', where: 'margin note, chapter 1', work: 'Homeric Hymn 4, To Hermes, trans. H. G. Evelyn-White (1914)' },
    { text: 'I was born yesterday, and my feet are soft and the ground beneath is rough', where: 'margin note, chapter 2', work: 'Homeric Hymn 4, To Hermes, trans. H. G. Evelyn-White (1914)' },
  ],
  2: [
    { text: 'Wild was Vingthor when he awoke, / And when his mighty hammer he missed', where: 'margin note, chapter 1', work: 'The Poetic Edda, "Thrymskvitha", trans. H. A. Bellows (1923)' },
    { text: 'So hot was her longing for Jotunheim', where: 'chapter 4, the feast', work: 'The Poetic Edda, "Thrymskvitha", trans. H. A. Bellows (1923)' },
    { text: 'eight miles beneath the earth', where: 'handover §6.1 (Thrym\'s boast is paraphrased in the script)', work: 'The Poetic Edda, "Thrymskvitha", trans. H. A. Bellows (1923)' },
  ],
  3: 'docs',   // every 📜 document is the play's own lines: listed from the documents below
  4: [
    { text: 'the difference between the almost right word & the right word', where: 'margin note, chapter 4', work: 'Mark Twain, letter of 15 October 1888 (printed in G. Bainton, The Art of Authorship, 1890)' },
    { text: 'the difference between the lightning-bug & the lightning', where: 'margin note, chapter 4', work: 'Mark Twain, letter of 15 October 1888 (printed in G. Bainton, The Art of Authorship, 1890)' },
    { text: 'The report of my death was an exaggeration.', where: 'Detective School drill, round three', work: 'Mark Twain, 1897 note (New York Journal, 2 June 1897)' },
  ],
};

/* ---------- build ---------- */
function castFrom(md, spec) {
  const s = J.sections(md).find((x) => /^Cast$/.test(x.head)); const rows = J.table(s.lines);
  const head = rows.shift().map((h) => h.toLowerCase()), col = (r, k) => { const i = head.findIndex((h) => h.startsWith(k)); return i >= 0 ? r[i] : ''; };
  const out = [];
  for (const r of rows) {
    const first = r[0], name = (first.match(/\*\*([^*]+)\*\*/) || [, first])[1].trim();
    const key = Object.keys(spec.cast).find((k) => name.startsWith(k)); if (!key) continue;
    const [id, role] = spec.cast[key];
    out.push({ id, name: C(first).replace(/\s*\(one suspect card\)\s*/, ''), role, look: C(col(r, 'look')), manner: C(col(r, 'manner')), note: C(col(r, 'motive')) || null,
      expressions: C(col(r, 'portrait')).split(/,\s*/).filter(Boolean).map((e) => e.replace(/\s*\(.*$/, '')), unlockedBy: null });
  }
  for (const [id, name, role] of spec.extraCast || []) if (!out.some((p) => p.id === id)) out.push({ id, name, role, look: '', manner: '', expressions: [], unlockedBy: null });
  return out;
}
function cardFrom(md) {
  const s = J.sections(md).find((x) => /^(Case|Journey) card$/.test(x.head));
  const q = J.quoteBody(s.lines).body; if (q) return { text: q, readAloud: true };
  const para = s.lines.filter((l) => l.trim() && !/^\*\(|^\*\*Grown-ups|^---/.test(l)).join(' ');
  return { text: C(para), readAloud: true };
}
function grownUps(md) { const m = md.match(/\*\*Grown-ups:\*\*\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/); return m ? C(m[1]) : null; }
function cutsceneFrom(md) {
  const L = md.split('\n'); let i = L.findIndex((l) => /^### Opening|^\*\*Opening panels/.test(l)); if (i < 0) return [];
  const items = []; let cur = null;
  for (let j = i + 1; j < L.length && !/^(---|#{2,4} )/.test(L[j]); j++) {
    const m = L[j].match(/^(\d+)\.\s+(.*)$/);
    if (m) { if (cur) items.push(cur); cur = { panel: +m[1], raw: m[2] }; } else if (cur && L[j].trim()) cur.raw += ' ' + L[j].trim();
  }
  if (cur) items.push(cur);
  return items.map((p) => {
    const lines = [...p.raw.matchAll(/\*\*([A-Z][A-Z ]+)\*\*\s*(?:\*\([^)]*\)\*)?:?\s*[“"]([^”"]+)[”"]/g)].map((m) => ({ who: m[1].trim(), text: m[2] }));
    lines.push(...[...p.raw.matchAll(/(?:^|\s)([A-Z]{3,}):\s*[“"]([^”"]+)[”"]/g)].map((m) => ({ who: m[1], text: m[2] })).filter((x) => !lines.some((y) => y.text === x.text)));
    const place = (p.raw.match(/^\*\*([^*]+)\*\*/) || [, null])[1];
    return { panel: p.panel, place: place ? C(place).replace(/\.$/, '') : null, picture: C(p.raw.replace(/\*\*[A-Z][A-Z ]+\*\*.*$/, '').replace(/\s[A-Z]{3,}:\s*[“"].*$/, '')), lines };
  });
}
function deductionsFrom(md, spec) {
  const L = md.split('\n'), out = [];
  for (const [id, d] of Object.entries(spec.deductions)) {
    const at = L.findIndex((l) => new RegExp(`^\\*\\*${id} · `).test(l)); if (at < 0) throw new Error(`${id} not found`);
    const blk = []; for (let j = at + 1; j < L.length && !/^\*\*D\d · |^#{2,4} |^\*\*RED|^\*\*Other/.test(L[j]); j++) blk.push(L[j]);
    const text = blk.join('\n');
    const bullet = (re) => { const m = text.match(new RegExp(`- (?:\\*\\*|\\*)?${re}:?(?:\\*\\*|\\*)?:?\\s*([\\s\\S]*?)(?=\\n- (?:\\*\\*|\\*)|$)`)); return m ? m[1].replace(/\n\s+/g, ' ').trim() : null; };
    const statement = C(bullet('Statement(?: the child forms)?') || '').replace(/^"|"$/g, '');
    const sup = (bullet('Supporting spans') || '') + ' ' + (bullet('Also') || '');
    const spans = [...new Set([...J.spansIn(sup), ...(d.min || []).flat(), ...(d.requiredLinks || []).flat()])];
    const rec = { id, type: d.type, skill: d.skill, label: d.label, statement, spans, why: C(bullet('Why it matters') || '') };
    if (d.min?.length === 1) rec.required = d.min[0]; else if (d.min) rec.minimumLink = d.min;
    if (d.requiredLinks) rec.requiredLinks = d.requiredLinks;
    if (d.alsoKinds) rec.alsoKinds = d.alsoKinds;
    if (d.optional) rec.optional = true;
    if (d.isTheLie) rec.isTheLie = true;
    if (d.finishIn) rec.finishIn = d.finishIn;   // "started in chapter 3, finished in chapter 4": the board stays open for it
    out.push(rec);
  }
  return out;
}
function wrongLinksFrom(md) {
  const s = md.match(/\*\*Wrong-link hints[^\n]*\n([\s\S]*?)(?=\n\n|\n\*\*Chapter|\n---)/) || md.match(/#### Wrong-link hints[^\n]*\n([\s\S]*?)(?=\n---)/);
  if (!s) return [];
  return s[1].split(/\n- /).map((b) => { const sp = J.spansIn(b); const q = b.match(/:\s*[“"]([\s\S]+)[”"]\s*$/); return sp.length === 2 && q ? { spans: sp, quill: C(q[1]) } : null; }).filter(Boolean);
}
function timelineFrom(md) {
  const L = md.split('\n'), at = L.findIndex((l) => /^(\*\*EVENTS\*\*|#### EVENTS)/.test(l)); const rows = []; for (let j = at + 1; j < L.length && !/^(\*\*Timeline|\*\*The line|\*\*The forty|#### |### |\*\*Signe|---)/.test(L[j]); j++) rows.push(L[j]);
  const t = J.table(rows); const head = t.shift().map((h) => h.toLowerCase());
  const ci = (k) => head.findIndex((h) => h.includes(k)), E = ci('event'), S = ci('span'), P = head.findIndex((h) => /place/.test(h)), W = ci('day');
  const events = t.map((r) => {
    const n = +r[0], placed = /\*\*yes\*\*|★/.test(r[P] || ''), join = (r[P] || '').match(/join with (\d+)/);
    return { id: `T${n}`, order: n, text: C(r[E]).replace(/^\(|\)$/g, ''), when: W >= 0 ? C(r[W]) : undefined, spans: J.spansIn(r[S] || ''), timeWords: C(r[S] || '') || null, placedByChild: placed, ...(join ? { joinWith: `T${join[1]}` } : {}) };
  });
  const shake = []; const sh = md.match(/\*\*The line(?:'s little)? shakes?:?\*\*[^\n]*(?:\n(?!\n)[^\n]*)*/);
  if (sh) for (const m of sh[0].matchAll(/Quill says:?\s*[“"]([^”"]+)[”"]|QUILL:\s*[“"]([^”"]+)[”"]/g)) shake.push({ quill: m[1] || m[2] });
  return { events, shake };
}
function accusationFrom(md, spec, cast) {
  const s = J.sections(md).find((x) => /^Chapter 5/.test(x.head)), text = s.lines.join('\n');
  const minBlock = (text.match(/\*\*MINIMAL EVIDENCE SET[^\n]*\n([\s\S]*?)\n\n/) || [])[1] || '';
  const minimal = [...minBlock.matchAll(/^\d+\.\s+\*\*(D\d)/gm)].map((m) => m[1]);
  const accBlock = (text.match(/\((?:D3 is accepted|Also accepted)[^)]*\)/) || text.match(/\*\*ACCEPTABLE AS SUPPORTING EVIDENCE[\s\S]*?(?=\n\*\*WRONG)/) || [''])[0];
  const acceptable = [...new Set([...[...accBlock.matchAll(/\bD\d\b/g)].map((m) => m[0]), ...J.spansIn(accBlock)])].filter((x) => !minimal.includes(x));
  const wrongSuspect = {}, wrongSuspectPoints = {};
  const ws = (text.match(/\*\*WRONG-SUSPECT RESPONSES[^\n]*\n([\s\S]*?)(?=\n\n\*\*)/) || [])[1] || '';
  for (const b of ws.split(/\n- /)) {
    const m = b.match(/\*\*([^*:]+):\*\*\s*[“"]([\s\S]+?)[”"]\s*(\*\(points\s+to[^)]*\)\*)?\s*$/); if (!m || /^Wrong theory/.test(m[1])) continue;
    const who = cast.find((p) => p.name.startsWith(m[1].trim()) || m[1].trim().startsWith(p.name.split(',')[0]))?.id || Object.entries(spec.who).find(([k]) => k.startsWith(m[1].trim()))?.[1];
    if (!who) throw new Error(`wrong suspect ${m[1]}`);
    wrongSuspect[who] = C(m[2]); if (m[3]) wrongSuspectPoints[who] = J.spansIn(m[3]);
  }
  const wrongTheory = {};
  for (const m of text.matchAll(/\*\*WRONG-THEORY RESPONSE(?:,\s*[“"]([^”"]+)[”"]|\s*—\s*([^:*]+)):?\s*(?:\(Quill\))?:?\*\*:?\s*[“"]([\s\S]+?)[”"](?:\s*\*\(points to([^)]*)\)\*)?/g)) {
    const name = (m[1] || m[2]).trim(), key = Object.entries(spec.theories).find(([, names]) => names.some((n) => n.toLowerCase() === name.toLowerCase()))?.[0] || slug(name);
    wrongTheory[key] = { quill: C(m[3]), name, points: J.spansIn(m[4] || '') };
  }
  // Journey 1 states its wrong theories as list items under the wrong-suspect heading ("Wrong theory, "the wolf":")
  for (const b of ws.split(/\n- /)) { const m = b.match(/\*\*Wrong theory,\s*[“"]([^”"]+)[”"]:\*\*\s*[“"]([\s\S]+?)[”"]\s*(\*\(points\s+to[^)]*\)\*)?/); if (m) { const key = Object.entries(spec.theories).find(([, n]) => n.includes(m[1]))?.[0] || slug(m[1]); wrongTheory[key] = { quill: C(m[2]), name: m[1], points: J.spansIn(m[3] || '') }; } }
  const weak = text.match(/\*\*WEAK-EVIDENCE RESPONSE[^*]*\*\*:?\s*[“"]([\s\S]+?)[”"]\s*\n/);
  const partial = text.match(/\*\*PARTIAL[^*]*\*\*:?\s*[“"]([\s\S]+?)[”"]\s*\n/);
  const question = text.match(/\*\*THE QUESTION[^*]*\*\*:?\s*[“"]([^”"]+)[”"]/) || text.match(/\*\*CAPTAIN MOTT:\*\*\s*[“"]([^”"]+)[”"]/) || text.match(/\*\*THE PRINCE:\*\*[^\n]*?\)\*\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/);
  const placeM = text.match(/\*\*PLACE\*\*[^:]*:\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/);
  let place = null;
  if (placeM) { const opts = placeM[1].replace(/\s+/g, ' ').split(' · ').map((o) => o.trim()); place = { prompt: 'Where was it?', options: opts.map((o) => C(o)), answer: C(opts.find((o) => /^\*\*/.test(o))) }; }
  const note = (text.match(/\*\*CULPRIT:\*\*\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/) || text.match(/\*\*THE ANSWER:\*\*\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/) || [])[1];
  return { question: question ? C(question[1]) : null, culprit: spec.culprit, place, minimalEvidence: minimal, acceptableEvidence: acceptable, wrongSuspect, wrongSuspectPoints, wrongTheory, weakEvidence: weak ? C(weak[1]) : null, ...(partial ? { partialEvidence: C(partial[1]) } : {}), note: note ? C(note) : null };
}
function sectionDialogue(md, re) { const s = J.sections(md).find((x) => re.test(x.head) && x.level === 3); return s ? J.dialogue(s.lines) : []; }
function exercisesFrom(md, docIds, spanDoc) {
  return J.exercises(md).map((x) => {
    const docM = x.sourceRaw.match(/(?:DOC )?(J\d\.\d+)/), doc = docM ? docM[1] : x.span ? spanDoc.get(x.span) : null;
    const from = doc ? null : slug(x.sourceRaw.replace(/^DOC /, ''));
    const unquote = (t) => String(t).trim().replace(/^["“]([\s\S]*)["”]$/, '$1');
    let opts = x.optionsRaw ? x.optionsRaw.split(/\s+·\s+/).map((o) => unquote(C(o).replace(/\s*✓$/, ''))) : null;
    // "the three lines above": the options are the quoted lines in the prompt
    if (opts && opts.length === 1 && /lines above/.test(opts[0])) opts = [...(x.prompt || '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    // a multi-select ("… — tap them; distractors: …"): every syllable is an option; the answer is the tapped set
    let multi = null;
    if (opts && opts.some((o) => /distractors:/.test(o))) { const raw = x.optionsRaw.replace(/\s*\(all \w+\)\s*—\s*tap them;\s*distractors:\s*/, ' · '); const all = raw.split(/\s+·\s+/).map((o) => C(o)); multi = all.slice(0, all.length / 2); opts = (x.prompt.match(/"([^"]+)"/) || [, ''])[1].replace(/[?,.!]/g, '').split(/\s+/).flatMap((w) => all.filter((o) => o.replace(/-/g, '') && w.toLowerCase().includes(o.replace(/-/g, '').toLowerCase()))).filter((v, i, a) => a.indexOf(v) === i); if (opts.length < all.length) opts = all; }
    let answer = C(x.answerRaw || '');
    if (/^\[[\s\S]*\]$/.test(answer)) { try { answer = JSON.parse(answer); } catch { /* keep */ } }
    if (multi) answer = multi;
    else if (Array.isArray(answer) && opts) answer = answer.map((a) => opts.find((o) => o === unquote(a)) || unquote(a));
    else if (x.order && opts) answer = answer.split(/\s*→\s*/).map((part) => { const p = unquote(part).replace(/…$/, '').trim(); return opts.find((o) => o.startsWith(p)) || part; });
    else if (opts) answer = unquote(answer);
    return { id: x.id, tier: x.tier, level: x.level, type: x.type, skill: x.skill, strand: x.strand || strandOf(x.type), objective: x.objective, chapter: x.chapter, source: { doc, span: x.span, ...(from ? { from } : {}) },
      prompt: C(x.prompt), ...(opts ? { options: opts } : {}), answer, ...(multi ? { select: 'many' } : x.order ? { select: 'order' } : {}), explain: C(x.explain) };
  });
}
const strandOf = (t) => ({ 'vocab-in-context': 'word', 'word-origin': 'word', 'word-parts': 'word', spelling: 'word', punctuation: 'sentence', 'sentence-combine': 'sentence', 'tense-sequence': 'sentence', figurative: 'literature', voice: 'literature', stress: 'language' }[t] || 'reading');
function personaFrom(md, n) {
  if (n === 3) {
    const L = md.split('\n'), rows = J.table(L.slice(L.findIndex((l) => /^### Persona knacks/.test(l))));
    rows.shift(); const out = {};
    for (const r of rows) { const pid = C(r[0]).split(/\s|·/)[0].toLowerCase(); if (!PERSONA_J3[pid]) continue; const line = (r[2].match(/[“"]([^”"]+)[”"]/) || [, C(r[2])])[1]; out[pid] = { line: { chapter: PERSONA_J3[pid].chapter, text: C(line) }, knack: { chapter: PERSONA_J3[pid].chapter, candidates: PERSONA_J3[pid].candidates, ...Object.fromEntries(Object.entries(PERSONA_J3[pid]).filter(([k]) => !['chapter', 'candidates'].includes(k))) }, origin: 'bonus-journey-03' }; }
    return out;
  }
  const L = md.split('\n'), at = L.findIndex((l) => /^### Persona (block|knacks)/.test(l)); const rows = J.table(L.slice(at, at + 20)); rows.shift();
  const out = {};
  for (const r of rows) {
    const pid = C(r[0]).split(/\s|·/)[0].toLowerCase(), ch = +(r[1].match(/\d/) || [0])[0];
    const line = (r[2].match(/[“"]([^”"]+)[”"]/) || [, C(r[2])])[1];
    let cands = [...(r[3] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    if (cands.length < 3) cands = [...r[2].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    out[pid] = { line: { chapter: ch, text: C(line) }, knack: { chapter: ch, candidates: cands.map((c) => c.replace(/\s.*$/, '')) }, origin: `bonus-journey-0${n}` };
  }
  return out;
}
function bonusFrom(md, n) {
  const a = md.match(/### Word Hoard — bonus card[^\n]*\n([\s\S]*?)\n---/), b = md.match(/\*\*Bonus origin card \(every persona\): \*([^*]+)\*\.\*\*\n([\s\S]*?)\n\n/);
  const t = a ? a[1] : b ? b[2] : ''; const get = (k) => { const m = t.match(new RegExp(`- (?:\\*\\*|\\*)${k}:(?:\\*\\*|\\*)\\s*([\\s\\S]*?)(?=\\n- (?:\\*\\*|\\*)|$)`)); return m ? m[1].replace(/\n\s+/g, ' ').trim() : null; };
  const word = a ? C(get('Word')) : C(b[1]); const qRaw = get('Question') || '';
  const parts = qRaw.split(/\s+·\s+|\s+—\s+/).map((x) => x.trim()).filter(Boolean);
  const p0 = C(parts.shift()), prompt = /^["“][^"“”]*["”]$/.test(p0) ? p0.slice(1, -1) : p0;
  let answer = null; const options = [];
  for (const p of parts) { const am = p.match(/^\*\*Answer:\*\*\s*(.+)$/); if (am) { answer = C(am[1]); continue; } const o = C(p).replace(/\s*✓$/, '').replace(/\.$/, ''); if (/✓/.test(p)) answer = o; options.push(o); }
  const srcRaw = get('Sources') || get('Objective') || '';
  return { id: `bonus-journey-0${n}`, persona: null, case: `journey-0${n}`, word, bonus: true, path: C(get('Path') || '').split(/\s*→\s*/).map((x) => x.replace(/\.$/, '')), story: C(get('Story') || ''),
    question: { prompt, options, answer, explain: C(get('Story') || '') }, objective: ((srcRaw.match(/`([\w-]+)`/) || (t.match(/Objective:\s*`([\w-]+)`/)) || [])[1]) || 'la10-world',
    sources: C(srcRaw.replace(/\.?\s*Objective:.*$/, '').replace(/^.*?sources:\s*/i, '')).split(/;\s*/).filter(Boolean), askFamily: false, needsReview: true };
}
function drillFrom(md) {
  const s = J.sections(md).find((x) => /^Detective School drill/.test(x.head) && x.level === 3); if (!s) return null;
  const title = C(s.head.replace(/^Detective School drill\s*—\s*/, '')).replace(/^[“"*]+|[”"*]+$/g, '');
  const rows = J.table(s.lines); const head = rows.shift() || [];
  const H = head.map((h) => h.toLowerCase()), hi = (re) => H.findIndex((h) => re.test(h));
  const A = hi(/version a/), ans = hi(/really went|what it names|keeps the voice|answer/), proof = hi(/prove|explains|proving/);
  const items = rows.map((r) => { const o = A >= 0 ? [C(r[A]), C(r[A + 1])] : null; let a = C(r[ans >= 0 ? ans : 1] || ''); if (o && /^[AB]$/.test(a)) a = o[a === 'A' ? 0 : 1];
    return { prompt: C(r[0]).replace(/^"|"$/g, ''), answer: a, ...(proof >= 0 ? { proof: C(r[proof]) } : {}), ...(o ? { options: o } : {}), ...(A < 0 && hi(/comes from/) >= 0 ? { from: C(r[hi(/comes from/)]) } : {}) }; });
  const intro = C(s.lines.filter((l) => l.trim() && !/^\|/.test(l)).slice(0, 2).join(' '));
  const L2 = s.lines.join('\n').split(/\n(?=\d+\.\s)/);
  for (const b of L2) { const m = b.replace(/\s+/g, ' ').match(/^(\d+)\.\s+(.*?)\s*\*\*Answer:\*\*\s*(.*?)\s*\(Options:\s*(.*?)\.?\)/); if (m) items.push({ prompt: C(m[2]), answer: C(m[3]).replace(/\.$/, ''), options: m[4].split(/\s+·\s+/).map((o) => C(o).replace(/\.$/, '')) }); }
  return { kind: /voice|Spell/.test(title) ? 'who-wrote' : /Tomorrow|Way/.test(title) ? 'timeline' : 'other', title, intro, items, rounds: J.quoteBody(s.lines).body || null };
}
function feastFrom(md) {
  const L = md.split('\n'), at = L.findIndex((l) => /^#### Part 3 · The feast/.test(l)); if (at < 0) return null;
  const knows = (md.match(/\*\*What Thrym knows\*\*[^:]*:\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/) || [])[1];
  const rows = J.table(L.slice(at, at + 20)); rows.shift();
  return { title: 'The feast (the explanations game)', knows: knows ? C(knows).split(/\s+·\s+/) : [], items: rows.map((r) => { const opts = r[2].split(/\s+·\s+/); return { prompt: C(r[1].replace(/\s*\*\([^)]*\)\*\s*/g, ' ')).replace(/\s+:/, ':'), panel: C((r[1].match(/\*\(([^)]*)\)\*/g) || []).map((x) => x.replace(/^\*\(|\)\*$/g, '')).filter((x) => !/drunk/.test(x)).join(' ')) || null, options: opts.map((o) => C(o).replace(/^"|"$/g, '').replace(/^“|”$/g, '')), answer: C(opts.find((o) => /\*\*/.test(o))).replace(/^"|"$/g, '').replace(/^“|”$/g, ''), why: C(r[4] || '') }; }),
    lesson: C((md.match(/The lesson, in one line on screen: \*\*([^*]+)\*\*/) || [])[1] || '') || null };
}

export function buildJourney(n) {
  const md = read(n), spec = SPEC[n], cast = castFrom(md, spec);
  const rawDocs = J.docs(md);
  const docs = rawDocs.map((d) => {
    const quotes = n === 3 && /📜/.test(d.author || '') && /play's own/.test(d.author || '');
    return { id: d.id, chapter: 'scene', type: slug(d.type), title: d.typeRaw.replace(/^[a-z]/, (x) => x.toUpperCase()), author: d.author, when: d.when, where: d.where, picture: d.picture, readAloud: spec.level <= 2 || n === 1,
      body: d.body, ...(d.chapterIn > 1 && !spec.unlocks[d.id] ? { arrivesInChapter: d.chapterIn } : {}), ...(spec.unlocks[d.id] ? { unlockedBy: spec.unlocks[d.id] } : {}), ...(quotes ? { quoted: { work: 'Romeo and Juliet', held: false, needsReview: true } } : {}) };
  });
  // interviews: each answer becomes a document (n.Sx.Qy), each question names it
  const ivs = [], byWho = new Map(); let qn = {};
  for (const q of J.interviews(md)) {
    let who = q.chapter === 4 && spec.ch4Questions ? spec.ch4Questions[q.type] : Object.entries(spec.who).find(([k]) => q.who && q.who.startsWith(k.split(',')[0]))?.[1];
    if (!who) throw new Error(`journey ${n}: no cast id for "${q.who}"`);
    if (!byWho.has(who)) { byWho.set(who, { suspect: who, questions: [] }); ivs.push(byWho.get(who)); }
    const si = ivs.findIndex((x) => x.suspect === who) + 1; qn[who] = (qn[who] || 0) + 1;
    const qid = q.personaQ ? `${who}-qp` : `${who}-q${qn[who]}`, docId = `J${n}.S${si}.Q${q.personaQ ? 'P' : qn[who]}`;
    const person = cast.find((p) => p.id === who);
    docs.push({ id: docId, chapter: 'interview', type: 'transcript', title: `${person.name.split(',')[0]}: ${q.q}`, author: person.name.split(',')[0], readAloud: spec.level <= 2, body: q.body });
    byWho.get(who).questions.push({ id: qid, type: q.type, q: q.q, answerDoc: docId, expression: q.expression ? q.expression.split(/,| then |→/)[0].trim() : 'calm',
      ...(q.chapter === 4 ? { chapter: 4 } : {}), ...(q.afterDoc ? { unlockedAfterDoc: q.afterDoc } : {}), ...(q.perPersona ? { perPersona: q.perPersona } : {}) });
  }
  // a question that unlocks documents (Journey 3: "unlocked by the first Balthasar question")
  const spanDoc = new Map(); for (const d of docs) for (const m of String(d.body).matchAll(J.SPAN_RE)) spanDoc.set(m[1], d.id);
  const deductions = deductionsFrom(md, spec);
  const tl = timelineFrom(md);
  const accusation = accusationFrom(md, spec, cast);
  if (spec.wrongTheoryClears) for (const [k, pts] of Object.entries(spec.wrongTheoryClears)) if (accusation.wrongTheory[k]) accusation.wrongTheory[k].points = [...new Set([...(accusation.wrongTheory[k].points || []), ...pts])];
  const exercises = exercisesFrom(md, new Set(docs.map((d) => d.id)), spanDoc);
  let quotes = QUOTES[n];
  // the play's own lines: whole documents marked "📜 the play's own lines", minus speech labels, stage directions and
  // Will's margin notes; in a made-up document, only the line it says is the play's (the Friar's carved motto)
  if (quotes === 'docs') quotes = docs.filter((d) => d.quoted).flatMap((d) => d.body.split('\n').filter((l) => (/made up/.test(d.author) ? /^Carved above/.test(l) : true) && !/^[A-Z][A-Z ,'-]+:?$/.test(l.trim()) && !/^[A-Z]{3,}[A-Z ,.]*(—|:)/.test(l.trim()) && !/^[A-Z]{3,}.*:\s*$/.test(l.trim()) && !/^(Enter|Will's note|In the margin|…\s*$)/.test(l)).map((l) => l.replace(/^Carved above the door of the cell:\s*/, '')).map((l) => ({ text: J.cleanMd(l.replace(J.SPAN_RE, '$2')).replace(/^[A-Z ]+:\s*/, '').replace(/^…\s*|\s*…$/g, ''), where: `DOC ${d.id}`, work: 'William Shakespeare, Romeo and Juliet' })).filter((q) => q.text.length > 8));
  const c = {
    format: 1.3, kind: 'journey', id: `journey-0${n}`, number: 100 + n, title: spec.title, label: 'A Bizzing mystery', level: spec.level, world: spec.world, setting: spec.setting,
    skills: spec.skills, vanishedWord: null, ledgerIndex: null, officeObject: null, souvenir: spec.souvenir, companion: spec.companion, judge: spec.judge, badge: spec.badge,
    after: spec.after, sourceText: spec.source, grownUps: grownUps(md), arc: [], tutorial: [], card: cardFrom(md), cutscene: cutsceneFrom(md), cast, docs, interviews: ivs,
    boardIntro: [], deductions, redHerrings: spec.redHerrings, wrongLinks: wrongLinksFrom(md).filter((w) => w.spans.every((s) => spanDoc.has(s))),
    timeline: { events: tl.events, shake: tl.shake, ...(spec.feast ? { feast: feastFrom(md) } : {}) }, accusation,
    reveal: sectionDialogue(md, /^The reveal$/), epilogue: sectionDialogue(md, /^Epilogue$/), drill: drillFrom(md), marginNotes: J.marginNotes(md),
    persona: personaFrom(md, n), bonusCard: bonusFrom(md, n), quotes: quotes.map((q) => ({ ...q, held: false, needsReview: true })),
    art: { notes: 'See the script\'s "Art and scene notes"; no lettering in any painting.' }, exercises,
    source: { script: `journey-0${n}.md`, signedOffBy: null, signedOffOn: null },
  };
  return c;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const check = process.argv.includes('--check'); let bad = 0;
  if (!check) fs.mkdirSync(OUT, { recursive: true });
  for (const n of [1, 2, 3, 4]) {
    const json = JSON.stringify(buildJourney(n), null, 2) + '\n', p = path.join(OUT, `journey-0${n}.json`);
    if (check) { if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== json) { console.log(`✗ journey-0${n}.json is out of date: run node tools/inkwell/build-journeys.mjs`); bad++; } }
    else fs.writeFileSync(p, json);
  }
  console.log(check ? (bad ? `${bad} Journey file(s) stale` : '4 Journeys up to date') : `wrote 4 Journeys to ${path.relative(process.cwd(), OUT)}`);
  process.exit(bad ? 1 : 0);
}
