#!/usr/bin/env node
// validate-cases.mjs — checks Inkwell Detective case files against SCHEMA.md.
// Usage: node validate-cases.mjs [dir-with-case-json] [--scripts dir-with-case-md]   (exit 1 on any error)
// Format 1.3 (the six detectives and the Ink Journeys, owner's brief 6 Oct 2026): journey-0N.json files in the same
// directory shape are checked too (kind "journey": no Ledger word, their own worlds, margin notes with sources, six
// persona blocks); every case and Journey's Knack candidate sets hold exactly 3 items with at most 1 from the minimal
// evidence; no {det} line breaks the level limits with any of the six names; no extremist-coded rune sign anywhere.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--')) || path.dirname(new URL(import.meta.url).pathname);
const si = args.indexOf('--scripts'); const scriptsDir = si >= 0 ? args[si + 1] : null;

const LEDGER = ['UNDER', 'THE', 'CLOCK', 'THAT', 'NEVER', 'STRIKES', 'LIES', 'EVERY', 'WORD', 'FOR', 'EVERYONE'];
const LIMIT = { 1: [40, 10], 2: [70, 14], 3: [100, 18], 4: [140, 22], 5: [180, 26] };
const SUSPECTS = { 1: [3, 3], 2: [3, 4], 3: [4, 4], 4: [4, 4], 5: [5, 5] };
const MIN_DED = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
const WORLDS = ['garden', 'study', 'playhouse', 'forum', 'scriptorium', 'lakeside', 'quayside'];
const JOURNEY_WORLDS = ['olympus', 'asgard', 'verona', 'mississippi'];
const PERSONAS = { thea: 'Thea', milo: 'Milo', oskar: 'Oskar', signe: 'Signe', hari: 'Hari', vani: 'Vani' };
// §6.4 / §10: no runic symbols that hate groups have taken up
const RUNE_BLOCK = /\b(valknut|othala|odal rune|black sun|sonnenrad|wolfsangel|totenkopf|sig runes?)\b/i;
// P9: no Hindu deity speaks in any chapter
const DEITY_SPEAKERS = /^(VISHNU|SARASWATI|LAKSHMI|SHIVA|GANESHA|KRISHNA|RAMA|HANUMAN|DURGA|PARVATI|BRAHMA|JAGANNATH)$/;
const SKILLS = ['detail', 'sequence', 'pronoun', 'inference', 'vocab', 'punctuation', 'factopinion', 'figurative', 'voice', 'contradiction'];
const DTYPES = ['contradiction', 'timeline', 'pronoun', 'meaning', 'fact-opinion', 'figurative', 'voice', 'inference'];
// Kid-safe blocklist (whole words). Period words allowed in classics are not in play here: every case is original.
const BLOCK = ['porn', 'sexy', 'sexual', 'sex', 'rape', 'raped', 'raping', 'nude', 'nudes', 'nudity', 'naked', 'horny', 'slut', 'sluts',
  'cum', 'whore', 'moron', 'retard', 'retarded', 'cretin', 'piss', 'stoned', 'whisky', 'whiskey', 'vodka', 'drunk', 'drunken', 'alcohol',
  'cocaine', 'heroin', 'drugs', 'suicide', 'murder', 'murdered', 'murderer', 'stab', 'stabbed', 'damn', 'crap', 'gypsy', 'negro'];
// Soft words: fine in context ("a dead end", "I'd die of embarrassment"), but a person reviews each one.
const SOFT = ['dead', 'die', 'died', 'kill', 'killed', 'blood', 'bloody', 'gun', 'guns', 'knife', 'hate', 'stupid', 'idiot', 'dumb',
  'beer', 'wine', 'hell', 'drug', 'poison', 'weapon', 'fight'];
const SOFT_RE = new RegExp(`\\b(${SOFT.join('|')})\\b`, 'i');
const BLOCK_RE = new RegExp(`\\b(${BLOCK.join('|')})\\b`, 'i');

const SPAN_RE = /\[\[c:([A-Za-z0-9_-]+)\|([\s\S]*?)\]\]/g;
const strip = (t) => String(t || '').replace(SPAN_RE, '$2').replace(/<\/?[a-z][^>]*>/gi, '').replace(/[*_~]+/g, '');
const words = (t) => (strip(t).replace(/\b\d{1,2}[.:]\d{2}\b/g, 'TIME').match(/[A-Za-z0-9'’]+/g) || []).length;
// a sentence ends at . ! ? — also when a closing quote follows it ("…suspected." What…), which the first cut missed
const sentences = (t) => strip(t).split(/\n|(?<=[.!?]["”’']?)\s+/).map((s) => s.trim()).filter(Boolean);

let totalErrors = 0, totalWarnings = 0;
const files = fs.readdirSync(dir).filter((f) => /^(case|journey)-\d\d\.json$/.test(f)).sort();
if (!files.length) { console.error('No case-NN.json files in', dir); process.exit(1); }

for (const f of files) {
  const errs = [], warns = [];
  const E = (m) => errs.push(m), W = (m) => warns.push(m);
  let c;
  try { c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { console.log(`✗ ${f}: invalid JSON — ${e.message}`); totalErrors++; continue; }

  // 1. shape
  const journey = c.kind === 'journey';
  const need = { format: 'number', id: 'string', number: 'number', title: 'string', label: 'string', level: 'number', world: 'string',
    skills: 'array', ...(journey ? { souvenir: 'object', marginNotes: 'array', persona: 'object' } : { officeObject: 'object' }), arc: 'array', card: 'object', cast: 'array', docs: 'array', interviews: 'array',
    deductions: 'array', redHerrings: 'array', timeline: 'object', accusation: 'object', reveal: 'array', epilogue: 'array', drill: 'object', art: 'object', source: 'object' };
  for (const [k, t] of Object.entries(need)) {
    const v = c[k]; const ok = t === 'array' ? Array.isArray(v) : (v !== undefined && v !== null && typeof v === t && !Array.isArray(v));
    if (!ok) E(`field "${k}" missing or not ${t}`);
  }
  if (errs.length) { report(f, c, errs, warns); continue; }
  if (c.id !== f.replace('.json', '')) E(`id "${c.id}" does not match file name`);
  if (c.label !== 'A Bizzing mystery') E('label must be "A Bizzing mystery"');
  if (!LIMIT[c.level]) E(`level ${c.level} not 1–5`);
  if (!(journey ? JOURNEY_WORLDS : WORLDS).includes(c.world)) E(`world "${c.world}" unknown`);
  c.skills.forEach((s) => SKILLS.includes(s) || E(`skill "${s}" not a bible tag`));
  if (journey) { if (c.vanishedWord !== null) E('a Journey adds no word to the Ledger (vanishedWord null)'); if (c.format < 1.3) E('a Journey is format 1.3'); }
  else if (c.number === 0) { if (c.vanishedWord !== null) E('case-00 has no vanished word (null)'); }
  else if (c.vanishedWord !== LEDGER[c.number - 1]) E(`vanishedWord "${c.vanishedWord}" should be ${LEDGER[c.number - 1]}`);
  if (!journey && c.number > 0 && c.ledgerIndex !== c.number) E(`ledgerIndex should be ${c.number}`);
  if (c.number === 0 && !(Array.isArray(c.tutorial) && c.tutorial.length >= 4)) E('case-00 needs ≥ 4 tutorial steps');

  // ids
  const castIds = new Set(); c.cast.forEach((p) => { if (!p.id || castIds.has(p.id)) E(`cast id "${p.id}" missing/duplicate`); castIds.add(p.id); });
  const docIds = new Set(); c.docs.forEach((d) => { if (!d.id || docIds.has(d.id)) E(`doc id "${d.id}" missing/duplicate`); docIds.add(d.id); });
  const dedIds = new Set(); c.deductions.forEach((d) => { if (!d.id || dedIds.has(d.id)) E(`deduction id "${d.id}" missing/duplicate`); dedIds.add(d.id); });

  // 2. spans
  const spans = new Map();
  for (const d of c.docs) {
    if (typeof d.body !== 'string' || !d.body.trim()) { E(`doc ${d.id}: empty body`); continue; }
    const opens = (d.body.match(/\[\[/g) || []).length, closes = (d.body.match(/\]\]/g) || []).length;
    if (opens !== closes) E(`doc ${d.id}: unbalanced [[ ]]`);
    for (const m of d.body.matchAll(SPAN_RE)) {
      if (spans.has(m[1])) E(`span "${m[1]}" defined twice (docs ${spans.get(m[1]).doc} and ${d.id})`);
      spans.set(m[1], { doc: d.id, text: m[2] });
    }
  }
  const cited = new Set();
  const cite = (id, where) => { if (dedIds.has(id)) return; cited.add(id); if (!spans.has(id)) E(`${where}: cites unknown span/deduction "${id}"`); };

  // 3. fair play
  for (const d of c.deductions) {
    if (!DTYPES.includes(d.type)) E(`${d.id}: type "${d.type}" unknown`);
    if (d.skill && !SKILLS.includes(d.skill)) E(`${d.id}: skill "${d.skill}" unknown`);
    if (!Array.isArray(d.spans) || d.spans.length < 2) E(`${d.id}: needs ≥ 2 spans`);
    (d.spans || []).forEach((s) => cite(s, d.id));
    if (!d.statement) E(`${d.id}: no statement`);
  }
  for (const r of c.redHerrings) {
    if (!castIds.has(r.suspect)) E(`red herring suspect "${r.suspect}" not in cast`);
    if (!Array.isArray(r.clearedBy) || !r.clearedBy.length) E(`red herring ${r.suspect}: needs ≥ 1 clearing span`);
    (r.clearedBy || []).forEach((s) => cite(s, `red herring ${r.suspect}`));
  }
  const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  for (const w of arr(c.wrongLinks)) arr(w.spans).forEach((s) => cite(s, 'wrongLinks'));
  for (const m of arr(c.extraMarks)) { if (m && m.span) cite(m.span, 'extraMarks'); else E('extraMarks entry without span'); }
  const ROLES = ['agency','suspect','culprit-hidden','answer','adversary','witness','helper','client'];
  for (const p of c.cast) if (!ROLES.includes(p.role)) E(`cast ${p.id}: role "${p.role}" not one of ${ROLES.join(', ')}`);
  const AKEYS = new Set(['culprit','place','question','questionAfterReveal','note','minimalEvidence','acceptableEvidence','evidenceRule','evidenceSpans','partialEvidence','wrongSuspect','wrongSuspectPoints','wrongSuspectFollowUp','wrongTheory','weakEvidence','weakExamples']);
  for (const k of Object.keys(c.accusation || {})) if (!AKEYS.has(k)) W(`unknown accusation field "${k}"`);
  const QTYPES = ['who','what','when','where','why','how'];
  for (const iv of c.interviews) for (const q of iv.questions || []) if (!QTYPES.includes(q.type)) E(`question ${q.id}: type "${q.type}" unknown`);
  for (const m of arr(c.arcMarks)) { const id = typeof m === 'string' ? m : m && m.span; if (id) cite(id, 'arcMarks'); else E('arcMarks entry without span'); }
  arr((c.accusation || {}).weakExamples).forEach((s) => cite(s, 'weakExamples'));
  for (const t of arr(c.tutorial)) if (t && t.span) cite(t.span, 'tutorial');
  for (const r of c.redHerrings) { if (r.suspicion !== undefined && !Array.isArray(r.suspicion)) E(`red herring ${r.suspect}: suspicion must be an array of span ids`); arr(r.suspicion).forEach((s) => typeof s === 'string' ? cite(s, `suspicion ${r.suspect}`) : E(`red herring ${r.suspect}: suspicion entries must be span ids`)); }
  for (const d of c.deductions) for (const r of d.required || []) if (!(d.spans || []).includes(r)) E(`${d.id}: required span "${r}" not in spans`);
  for (const k of Object.keys((c.accusation || {}).wrongSuspect || {})) if (!castIds.has(k)) E(`wrongSuspect key "${k}" is not a cast id (use accusation.wrongTheory)`);
  const KNOWN = new Set(['format','id','number','title','label','level','world','setting','skills','vanishedWord','ledgerIndex','officeObject','arc','tutorial','card','cutscene','cast','docs','interviews','deductions','redHerrings','timeline','accusation','reveal','epilogue','drill','art','source','wrongLinks','arcMarks','revealSetting','aside','extraMarks','speeches','boardIntro','exercises',
    'kind','souvenir','companion','judge','badge','after','sourceText','grownUps','marginNotes','persona','bonusCard','quotes']);
  for (const k of Object.keys(c)) if (!KNOWN.has(k)) W(`unknown top-level field "${k}" (move it to aside or art.notes)`);
  const ev = c.timeline.events || [];
  if (!ev.length) W('timeline has no events');
  ev.forEach((e, i) => { (e.spans || []).forEach((s) => cite(s, `timeline ${e.id}`)); if (e.order !== i + 1) W(`timeline ${e.id}: order ${e.order} ≠ position ${i + 1}`); });
  const a = c.accusation;
  if (!castIds.has(a.culprit)) E(`culprit "${a.culprit}" not in cast`);
  const minEv = a.minimalEvidence || [];
  if (minEv.length < 3) E('minimalEvidence needs ≥ 3 items');
  minEv.forEach((x) => cite(x, 'minimalEvidence'));
  (a.acceptableEvidence || []).forEach((x) => cite(x, 'acceptableEvidence'));
  if (c.level >= 3 && minEv.filter((x) => dedIds.has(x)).length < 2) E('levels 3–5: minimalEvidence needs ≥ 2 deductions');
  const suspects = c.cast.filter((p) => p.role === 'suspect' || p.role === 'culprit-hidden');  // an 'answer' role (revealed answer card) is not a suspect
  for (const s of suspects) if (s.id !== a.culprit && !(a.wrongSuspect || {})[s.id]) E(`no wrongSuspect line for "${s.id}"`);
  if (!a.weakEvidence) E('no weakEvidence line');
  for (const iv of c.interviews) {
    if (!castIds.has(iv.suspect)) E(`interview suspect "${iv.suspect}" not in cast`);
    for (const q of iv.questions || []) if (!docIds.has(q.answerDoc)) E(`question ${q.id}: answerDoc "${q.answerDoc}" missing`);
  }
  for (const p of c.cast) if (p.unlockedBySpan) cite(p.unlockedBySpan, `cast ${p.id}`);
  for (const p of c.cast) if (p.unlockedBy && !dedIds.has(p.unlockedBy)) E(`cast ${p.id}: unlockedBy "${p.unlockedBy}" not a deduction`);
  for (const [id] of spans) if (!cited.has(id)) W(`span "${id}" is never cited (orphan clue)`);


  // 9. exercises (format 1.2)
  const XT = ['vocab-in-context','pronoun','punctuation','tense-sequence','fact-opinion','figurative','spelling','sentence-combine','word-parts','voice','inference','summarise', 'word-origin', 'stress'];
  const STRANDS = ['word','sentence','reading','writing','speaking','literature','language'];
  const xs = Array.isArray(c.exercises) ? c.exercises : [];
  if (!xs.length) E('no exercises (format 1.2 needs ≥ 12)');
  else {
    if (xs.length < 12) E(`${xs.length} exercises; need ≥ 12`);
    const tiers = c.level === 1 ? ['at','harder'] : c.level === 5 ? ['easier','at'] : ['easier','at','harder'];
    const want = { easier: c.level - 1, at: c.level, harder: c.level + 1 };
    for (const t of tiers) { const n = xs.filter((x) => x.tier === t).length; if (n < 4) E(`exercises: ${n} in tier "${t}"; need ≥ 4`); }
    const ids = new Set();
    for (const x of xs) {
      const w = `exercise ${x.id}`;
      if (!x.id || ids.has(x.id)) E(`${w}: id missing/duplicate`); ids.add(x.id);
      if (!tiers.includes(x.tier)) E(`${w}: tier "${x.tier}" not allowed at level ${c.level}`);
      else if (x.level !== want[x.tier]) E(`${w}: level ${x.level} should be ${want[x.tier]} for tier ${x.tier}`);
      if (!XT.includes(x.type)) E(`${w}: type "${x.type}" unknown`);
      if (!SKILLS.includes(x.skill)) E(`${w}: skill "${x.skill}" unknown`);
      if (!STRANDS.includes(x.strand)) E(`${w}: strand "${x.strand}" unknown`);
      if (!(x.chapter >= 1 && x.chapter <= 5)) E(`${w}: chapter must be 1–5`);
      if (journey && x.source && x.source.doc == null && x.source.from) { /* a Journey exercise built from its epilogue, a margin note or the drill */ }
      else if (!x.source || !docIds.has(x.source.doc)) E(`${w}: source.doc "${x.source && x.source.doc}" missing`);
      else if (x.source.span && !spans.has(x.source.span)) E(`${w}: source.span "${x.source.span}" missing`);
      if (!x.prompt || x.answer === undefined || x.answer === null || x.answer === '') E(`${w}: prompt/answer missing`);
      if (!x.explain) E(`${w}: explain missing`);
      if (x.options) {
        if (!Array.isArray(x.options) || x.options.length < 3) E(`${w}: needs ≥ 3 options`);
        else if (!Array.isArray(x.answer) && !x.options.includes(x.answer)) E(`${w}: answer not among options`);
      }
      const lim = (LIMIT[x.level] || [0, 99])[1];
      for (const s2 of sentences(x.prompt || '')) { const k = words(s2); if (k > lim + 4) E(`${w}: prompt sentence of ${k} words > ${lim + 4}`); }
    }
    const types = new Set(xs.map((x) => x.type)); if (types.size < 4) E(`exercises: only ${types.size} types; need ≥ 4`);
    const mc = xs.filter((x) => Array.isArray(x.options) && !Array.isArray(x.answer));
    const longestRight = mc.filter((x) => { const L = x.options.map((o) => String(o).length); return String(x.answer).length === Math.max(...L) && L.filter((l) => l === Math.max(...L)).length === 1; }).length;
    if (mc.length >= 6 && longestRight / mc.length > 0.5) W(`exercises: the right option is the longest in ${longestRight}/${mc.length} multiple-choice items`);
  }

  // 4. level limits
  const [mw, ms] = LIMIT[c.level] || [999, 99];
  for (const d of c.docs) {
    if (d.chapter === 'arc') continue;
    const n = words(d.body); if (n > mw) E(`doc ${d.id}: ${n} words > ${mw}`);
    for (const s of sentences(d.body)) { const k = words(s); if (k > ms) E(`doc ${d.id}: sentence of ${k} words > ${ms}: "${s.slice(0, 60)}…"`); }
  }
  if (words(c.card.text) > 60) E(`card: ${words(c.card.text)} words > 60`);
  const rv = c.reveal.reduce((n, l) => n + words(l.text), 0); if (rv > 400) E(`reveal: ${rv} words > 400`);

  // 5. level structure
  const [smin, smax] = SUSPECTS[c.level] || [0, 99];
  if (suspects.length < smin || suspects.length > smax) E(`${suspects.length} suspects; level ${c.level} wants ${smin === smax ? smin : smin + '–' + smax}`);
  if (c.deductions.filter((d) => !d.optional).length < (MIN_DED[c.level] || 0)) E(`${c.deductions.filter((d) => !d.optional).length} deductions; level ${c.level} wants ≥ ${MIN_DED[c.level]}`);

  // 6. kid-safe
  const scan = (v, where) => { if (typeof v === 'string') { const t = strip(v); const m = t.match(BLOCK_RE); if (m) E(`blocklisted word "${m[1]}" in ${where}`); const n = t.match(SOFT_RE); if (n) W(`review word "${n[1]}" in ${where}`); }
    else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, `${where}.${k}`); };
  scan(c, c.id);

  // 10. format 1.3: personas, Knacks, {det} lines, margin notes, runes, deities
  const minIds = new Set(minEv); const dedOf = new Map(c.deductions.map((d) => [d.id, d]));
  for (const id of minEv) { const d = dedOf.get(id); if (d) for (const s of [...(d.required || []), ...((d.minimumLink || []).flat()), ...((d.requiredLinks || []).flat()), ...(d.minimum || [])]) minIds.add(s); }
  const candMinimal = (k) => { const [kind, rest] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
    if (kind === 'span') return minIds.has(rest);
    if (kind === 'link') { const [a, b] = rest.split('+'); return [...minEv].some((id) => { const d = dedOf.get(id); return d && d.spans.includes(a) && d.spans.includes(b); }) || (minIds.has(a) && minIds.has(b)); }
    return false; };
  const knackSets = [];
  if (c.persona) for (const [pid, p] of Object.entries(c.persona)) knackSets.push([pid, p && p.knack]);
  const tut = (c.tutorial || []).find((t) => t.step === 'knack'); if (tut && tut.variants) for (const [pid, v] of Object.entries(tut.variants)) knackSets.push([pid, { chapter: 1, candidates: v.candidates }]);
  if (journey || c.persona) for (const pid of Object.keys(PERSONAS)) if (!c.persona || !c.persona[pid]) E(`format 1.3: no persona block for ${pid}`);
  if (!journey && !c.persona && !tut) W('format 1.3: no persona blocks yet (the engine uses generated Knack stand-ins, data/inkwell-knacks.js)');
  for (const [pid, k] of knackSets) {
    if (!PERSONAS[pid]) { E(`persona "${pid}" unknown`); continue; }
    if (!k || !Array.isArray(k.candidates) || k.candidates.length !== 3) { E(`${pid}: a Knack shows exactly 3 candidates`); continue; }
    if (k.chapter === 5) E(`${pid}: no Knack works in chapter 5`);
    const n = k.candidates.filter((x) => typeof x === 'string' && candMinimal(x)).length; if (n > 1) E(`${pid}: Knack candidates hold ${n} minimal-evidence items (at most 1)`);
    for (const x of k.candidates) { if (typeof x !== 'string' || !x.includes(':')) E(`${pid}: candidate "${x}" is not kind:id`); else if (/^(span|link):/.test(x)) for (const s of x.slice(5).split('+')) {
        // a span id, or "<doc id> <exact words>" for a phrase that is not a clue span (Case 0: "0.2 cold and windy")
        const ph = s.match(/^(\S+) (.+)$/), d = ph && c.docs.find((dd) => dd.id === ph[1]);
        if (ph ? !(d && strip(d.body).includes(ph[2])) : !spans.has(s)) E(`${pid}: candidate cites unknown span or phrase "${s}"`);
      } }
  }
  const longest = Object.values(PERSONAS).sort((a, b) => b.length - a.length)[0];
  for (const d of c.docs) { if (d.chapter === 'arc' || !/\{det/.test(d.body)) continue; const t = d.body.replace(/\{det(\.\w+)?\}/g, longest); if (words(t) > mw) E(`doc ${d.id}: over the level limit with {det} = ${longest}`); }
  if (journey) for (const m of c.marginNotes || []) if (!m.source) E(`margin note "${String(m.text).slice(0, 40)}…" has no source`);
  { const all = JSON.stringify(c); const r = all.match(RUNE_BLOCK); if (r) E(`extremist-coded rune sign "${r[1]}" named in the data`); }
  for (const l of [...c.reveal, ...c.epilogue, ...(c.cutscene || []).flatMap((p) => p.lines || [])]) if (DEITY_SPEAKERS.test(String(l.who || '').trim())) E(`P9: a deity speaks (${l.who})`);

  // 8. verbatim against the script
  if (scriptsDir) {
    const sp = path.join(scriptsDir, (c.source && c.source.script) || `${c.id}.md`);
    if (!fs.existsSync(sp)) W(`script ${sp} not found; verbatim check skipped`);
    else {
      const quotes = fs.readFileSync(sp, 'utf8').split('\n').filter((l) => /^\s*>/.test(l)).map((l) => l.replace(/^\s*>\s?/, '').trim()).join('\n');
      const norm = (t) => t.replace(/<\/?[a-z][^>]*>/gi, '').replace(/[*_~]+/g, '').replace(/\s+/g, ' ').trim();
      const Q = norm(quotes);
      for (const d of c.docs) for (const line of d.body.split('\n').map((x) => x.trim()).filter(Boolean)) if (!Q.includes(norm(line))) E(`doc ${d.id}: line not verbatim in script: "${line.slice(0, 70)}"`);
    }
  }
  report(f, c, errs, warns);
}

function report(f, c, errs, warns) {
  totalErrors += errs.length; totalWarnings += warns.length;
  const head = `${errs.length ? '✗' : '✓'} ${f}${c && c.title ? ' — ' + c.title : ''}${c && c.level ? ' (L' + c.level + ')' : ''}`;
  console.log(head + (errs.length || warns.length ? `: ${errs.length} error(s), ${warns.length} warning(s)` : ''));
  errs.forEach((m) => console.log('   ERROR', m)); warns.forEach((m) => console.log('   warn ', m));
}
console.log(`\n${files.length} case(s) · ${totalErrors} error(s) · ${totalWarnings} warning(s)`);
process.exit(totalErrors ? 1 : 0);
