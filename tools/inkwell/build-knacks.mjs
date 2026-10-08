#!/usr/bin/env node
// build-knacks.mjs — Knack candidates for the town cases whose scripts do not carry a persona block yet (format 1.3 §10:
// `case.persona`). The Journeys carry their own (scripted, in data/journeys/*.json) and Case 0 carries six variants in
// its tutorial; for Cases 1–11 this builds a stand-in from each case's own data, so every persona has a fair Knack today.
// Writes app/src/data/inkwell-knacks.js; `--check` exits 1 if it is out of date.
//
// Every stand-in is `generated: true, needsReview: true`: the handover (§9.1.3) wants these lists AUTHORED and reviewed
// by a person. Its line is the persona's own signature line (no new words are put in a character's mouth). Rules, each
// held by test/detective.mjs (§2.4): exactly three candidates; at most one from the minimal evidence; never in chapter 5;
// Signe marks a slot, never an event; nothing here can link, mark or score anything — the Knack is UI only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const CASES = path.join(ROOT, 'app', 'src', 'data', 'cases'), OUT = path.join(ROOT, 'app', 'src', 'data', 'inkwell-knacks.js');
const D = await import(pathToFileURL(path.join(ROOT, 'app', 'src', 'detective.js')).href);
const { PERSONAS } = await import(pathToFileURL(path.join(ROOT, 'app', 'src', 'data', 'inkwell-personas.js')).href);

const CHAPTER = { thea: 1, milo: 1, hari: 2, vani: 2, oskar: 3, signe: 4 };

export function knacksFor(c) {
  const P = D.prepare(c), minimal = D.minimalItems(c), isMin = (s) => minimal.has(s);
  const spansIn = (docIds) => [...P.spans.values()].filter((s) => docIds.includes(s.doc)).map((s) => s.id);
  const pick3 = (ids) => { const mins = ids.filter(isMin), rest = ids.filter((s) => !isMin(s)); if (rest.length < 2) return null; return (mins.length ? [mins[0], rest[0], rest[1]] : rest.slice(0, 3)).length === 3 ? (mins.length ? [rest[0], mins[0], rest[1]] : rest.slice(0, 3)) : null; };
  const scene = (c.docs || []).filter((d) => d.chapter === 'scene' && !d.arrivesInChapter && !d.afterSolve).map((d) => ({ d, ids: spansIn([d.id]) })).filter((x) => x.ids.length >= 3)
    .sort((a, b) => b.ids.filter((s) => !isMin(s)).length - a.ids.filter((s) => !isMin(s)).length || (a.d.id < b.d.id ? -1 : 1));
  const people = (c.interviews || []).map((iv) => ({ who: iv.suspect, ids: spansIn(iv.questions.filter((q) => !q.chapter && !q.unlockedAt).map((q) => q.answerDoc)) })).filter((x) => x.ids.length >= 3)
    .sort((a, b) => b.ids.length - a.ids.length || (a.who < b.who ? -1 : 1));
  // a case whose answers carry few clues each: every interview answer together, then the scene
  const anyone = { who: null, ids: spansIn((c.interviews || []).flatMap((iv) => iv.questions.filter((q) => !q.chapter && !q.unlockedAt).map((q) => q.answerDoc))) };
  people.push(anyone, ...scene.map((x) => ({ who: null, ids: x.ids })));
  const out = {}, sig = Object.fromEntries(PERSONAS.map((p) => [p.id, p.signature]));
  const spanKnack = (pid, src, extra) => { for (const x of src) { const ids = pick3(x.ids); if (ids) return { chapter: CHAPTER[pid], line: sig[pid], ...extra(x), candidates: ids.map((s) => `span:${s}`), generated: true, needsReview: true }; } return null; };
  out.thea = spanKnack('thea', scene, (x) => ({ doc: x.d.id }));
  out.milo = spanKnack('milo', scene.slice(1).concat(scene.slice(0, 1)), (x) => ({ doc: x.d.id }));
  out.hari = spanKnack('hari', people, (x) => ({ writer: x.who }));
  out.vani = spanKnack('vani', people.slice(1).concat(people.slice(0, 1)), (x) => ({ writer: x.who }));
  // Oskar's Thought: one real link (from a deduction that is NOT in the minimal evidence when there is one) and two
  // tempting false ones (the case's own wrongLinks first, then pairs no deduction supports)
  const minDeds = new Set((c.accusation?.minimalEvidence || []).filter((x) => P.deds.has(x)));
  const real = (c.deductions || []).filter((d) => !minDeds.has(d.id)).concat((c.deductions || []).filter((d) => minDeds.has(d.id)))
    .map((d) => { const S = (D.proofSets(d) || [d.spans])[0]; return S.length >= 2 ? [S[0], S[1]] : null; }).find(Boolean);
  const supported = (a, b) => (c.deductions || []).some((d) => d.spans.includes(a) && d.spans.includes(b));
  const linkMin = (a, b) => [...minDeds].some((id) => { const d = P.deds.get(id); return d.spans.includes(a) && d.spans.includes(b); }) || (isMin(a) && isMin(b));
  const fakes = [];
  for (const w of c.wrongLinks || []) if (w.spans?.length === 2 && !supported(...w.spans) && !linkMin(...w.spans)) fakes.push(w.spans);
  const all = [...P.spans.keys()].filter((s) => !isMin(s));
  for (let i = 0; i < all.length && fakes.length < 2; i++) for (let j = all.length - 1; j > i && fakes.length < 2; j--) if (!supported(all[i], all[j]) && !fakes.some((f) => f.includes(all[i]) || f.includes(all[j]))) fakes.push([all[i], all[j]]);
  out.oskar = real && fakes.length >= 2 ? { chapter: 3, line: sig.oskar, candidates: [`link:${fakes[0].join('+')}`, `link:${real.join('+')}`, `link:${fakes[1].join('+')}`], generated: true, needsReview: true } : null;
  // Signe: the slot of an event the child is not asked to place (pegged), else the slot after the first event
  const evs = (c.timeline?.events || []).slice().sort((a, b) => a.order - b.order), n = evs.length;
  const gap = Math.max(1, evs.findIndex((e, i) => i > 0 && e.placedByChild === false)), other = [0, 1, 2, 3].filter((x) => x !== gap && x < n).slice(0, 2);
  out.signe = n >= 3 ? { chapter: 4, line: sig.signe, candidates: [`slot:${other[0]}`, `slot:${gap}`, `slot:${other[1]}`].sort(), generated: true, needsReview: true } : null;
  return out;
}

function render(all) {
  return `/* inkwell-knacks.js — GENERATED by tools/inkwell/build-knacks.mjs from each town case's own data: stand-in Knack candidates
   for Cases 1–11 until their scripts carry authored persona blocks (handover §9.1.3). Every entry is needsReview.
   Do not edit by hand. */
export const KNACKS = ${JSON.stringify(all, null, 1)};
`;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const all = {};
  for (const f of fs.readdirSync(CASES).filter((x) => /^case-\d\d\.json$/.test(x)).sort()) {
    const c = JSON.parse(fs.readFileSync(path.join(CASES, f), 'utf8'));
    if (c.persona || c.number === 0) continue;
    all[c.id] = knacksFor(c);
    for (const [pid, k] of Object.entries(all[c.id])) if (!k) { console.error(`${c.id}: no fair Knack for ${pid}`); process.exitCode = 1; }
  }
  const js = render(all);
  if (process.argv.includes('--check')) { const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''; if (now !== js) { console.log('✗ inkwell-knacks.js is out of date: run node tools/inkwell/build-knacks.mjs'); process.exit(1); } console.log(`Knacks: ${Object.keys(all).length} cases × 6 personas, up to date`); }
  else { fs.writeFileSync(OUT, js); console.log(`wrote Knack stand-ins for ${Object.keys(all).length} cases to ${path.relative(process.cwd(), OUT)}`); }
}
