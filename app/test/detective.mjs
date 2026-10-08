/* detective.mjs — Inkwell Detective's engine held to the handover's acceptance tests (C §2.1.12 IC1–IC10 where a program
   can judge them; "six detectives" §11 P1–P6) and to the family rules: a perfect bot solves every case and Journey from
   the data alone, with each of the six detectives and with none; a random bot never solves one and never earns a coin;
   the board accepts a link only when a deduction supports it; a wrong or weak accusation never ends a case and sends the
   child back to the right document with the data's own line; nothing in a case reads a clock; a case paused anywhere
   resumes exactly after a reload; the Knack narrows and never names, and changes nothing but what the child sees; the
   Training Desk serves the child's tier, never blocks, and pays at most 10 a case; mastery moves only on a later day.
   IC2's 8–15 minutes, IC5/IC6 (phone, stage) and IC9 (the owner's own solve) are for the browser check and the owner. */
import { readFileSync, readdirSync } from 'node:fs';
import { T, tally } from './_mem.mjs';
import * as D from '../src/detective.js';
import * as S from '../src/detective-season.js';
import * as SC from '../src/detective-school.js';
import { setCases, loadCase, loadSeason } from '../src/detective-data.js';
import { PERSONAS, PERSONA_IDS } from '../src/data/inkwell-personas.js';
import { CARDS, BONUS } from '../src/data/inkwell-wordhoard.js';
import { KNACKS } from '../src/data/inkwell-knacks.js';
import { newHousehold, newKid, addKid } from '../src/model.js';
import { taught, stepOf } from '../src/mastery.js';
import { migrate, VERSION, saveHousehold, loadHousehold } from '../src/store.js';
import { makeBackup, KID_FIELDS } from '../src/backup.js';
import { rng } from '../src/rand.js';
import { WORKS, LINES } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { readText } from '../../tools/texts/levels.mjs';
const { ok, done } = tally('detective');
const DAY = 864e5;
const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const CASES = readdirSync(new URL('../src/data/cases/', import.meta.url)).filter((f) => /^case-\d\d\.json$/.test(f)).sort().map((f) => json(`../src/data/cases/${f}`));
const JOURNEYS = readdirSync(new URL('../src/data/journeys/', import.meta.url)).filter((f) => /^journey-\d\d\.json$/.test(f)).sort().map((f) => json(`../src/data/journeys/${f}`));
const ALL = [...CASES, ...JOURNEYS];
ok('12 town cases and 4 Ink Journeys are on disk', CASES.length === 12 && JOURNEYS.length === 4);
ok('the season lists all sixteen chapters, Journeys after Cases 3, 5, 7 and 9', S.SEASON.length === 16 && S.SEASON.map((s) => s.id).join() === 'case-00,case-01,case-02,case-03,journey-01,case-04,case-05,journey-02,case-06,case-07,journey-03,case-08,case-09,journey-04,case-10,case-11');
setCases(ALL);
ok('the loader answers from the files it is given', (await loadCase('journey-03'))?.id === 'journey-03' && (await loadSeason()).length === 16);

/* ---------- the perfect bot (IC2, P1): legal moves only, from the data alone ---------- */
function play(c, { persona = null, k = null, now = T, stopAt = null, knack = false, start = null } = {}) {
  let cs = start || D.newCase(c, { persona, now }); const sol = D.solution(c), rejected = [], events = []; let steps = 0;
  const ctx = { now, persona, k, knackFor: S.knackFor };
  const run = (a) => { if (stopAt != null && steps >= stopAt) return null; const r = D.step(c, cs, a, ctx); steps++; if (!r.ok) rejected.push({ a, why: r.say?.text || r.why }); cs = r.state; events.push(...r.events); return r; };
  const openAll = () => { let more = true; while (more) { more = false; for (const id of D.available(c, cs)) if (!cs.read.includes(id)) { if (!run({ type: 'open', doc: id })) return; more = true; } for (const q of D.questions(c, cs)) if (q.open && !q.asked) { if (!run({ type: 'ask', q: q.id })) return; more = true; } } };
  const markOpen = () => { for (const s of sol.marks) { const sp = D.prepare(c).spans.get(s); if (D.docOpen(c, cs, sp.doc) && !cs.marks.some((m) => m.id === s)) run({ type: 'mark', span: s }); } };
  const linkAll = () => { for (const l of sol.links) if (cs.marks.some((m) => m.id === l.a) && cs.marks.some((m) => m.id === l.b) && !cs.links.some((x) => x.a === l.a && x.b === l.b)) run(l); };
  const useKnack = () => { if (knack && persona) { const k2 = S.knackFor(c, persona); if (k2 && k2.chapter === cs.chapter && !(cs.knack[cs.chapter])) run({ type: 'knack' }); } };
  const go = (n) => { if (cs.chapter < n || cs.reached < n) run({ type: 'chapter', n }); };
  if (cs.reached < 2) { openAll(); markOpen(); useKnack(); go(2); }
  openAll(); markOpen(); useKnack(); go(3); openAll(); markOpen(); useKnack(); linkAll();
  go(4); openAll(); markOpen(); useKnack(); linkAll();
  sol.timeline.forEach((e, i) => { if (!cs.timeline.done) run({ type: 'place', event: e, at: i }); });
  (c.timeline.feast?.items || []).forEach((it, i) => run({ type: 'feast', i, answer: it.answer }));
  go(5); openAll(); markOpen();
  const r = run(sol.accusation);
  return { cs, rejected, events, verdict: r?.verdict, steps };
}
const coinsOf = (evs) => evs.filter((e) => e.ev !== 'mastery').reduce((a, e) => a + ({ answer: 1, stop: 5, contest: 10 }[e.ev] || 0), 0);
const base = {};
for (const c of ALL) {
  const r = play(c);
  ok(`IC2: the perfect bot solves ${c.id} with no detective chosen, every move legal${r.rejected.length ? ` (refused: ${JSON.stringify(r.rejected[0])})` : ''}`, r.cs.solved && r.verdict === 'solved' && !r.rejected.length);
  ok(`${c.id}: solved with full evidence on the first accusation scores 1 and pays contest once`, r.cs.firstScore === 1 && r.events.filter((e) => e.ev === 'contest').length === 1);
  ok(`${c.id}: the board, the timeline and the accusation each pay stop 5 once`, r.events.filter((e) => e.ev === 'stop').length === 3);
  ok(`${c.id}: deductions pay answer 1 each on the first try, never more than 10`, r.events.filter((e) => e.ev === 'answer').length === Math.min(10, D.prepare(c).needed.length + (c.deductions || []).filter((d) => d.optional && r.cs.proved.includes(d.id)).length));
  base[c.id] = coinsOf(r.events);
  for (const p of PERSONA_IDS) {
    const rp = play(c, { persona: p, knack: true });
    ok(`P1: ${c.id} solved by ${p}, using the Knack, with the same coins (P4)`, rp.cs.solved && !rp.rejected.length && coinsOf(rp.events) === base[c.id]);
  }
}

/* ---------- the random bot (IC1, P2): random marks, links, questions, chapters, accusations — and a Knack ---------- */
function randomBot(c, seed, budget = 300, persona = null) {
  const R = rng(`rb:${c.id}:${seed}`), pick = (a) => a[Math.floor(R() * a.length)];
  let cs = D.newCase(c, { persona, now: T }); let coins = 0; const ctx = { now: T, persona, knackFor: S.knackFor };
  for (let i = 0; i < budget; i++) {
    const av = D.available(c, cs), x = R(); let a;
    if (x < 0.1) a = { type: 'open', doc: pick(av) };
    else if (x < 0.33) { const d = pick(av), Tk = D.tokens(c, d), f0 = Math.floor(R() * Tk.length); a = { type: 'mark', doc: d, from: f0, to: f0 + Math.floor(R() * 8) }; }
    else if (x < 0.4) { const q = D.questions(c, cs).filter((q2) => q2.open); a = q.length ? { type: 'ask', q: pick(q).id } : { type: 'chapter', n: 2 }; }
    else if (x < 0.48) a = { type: 'chapter', n: 1 + Math.floor(R() * 5) };
    else if (x < 0.5) a = { type: 'knack' };
    else if (x < 0.75) a = { type: 'link', a: pick(cs.marks)?.id, b: pick(cs.marks)?.id, kind: pick(D.DTYPES) };
    else if (x < 0.85) { const ev = (c.timeline.events || []).filter((e) => e.placedByChild !== false); a = { type: 'place', event: pick(ev)?.id, at: Math.floor(R() * ev.length) }; }
    else { const ids = [...cs.proved, ...cs.marks.map((m) => m.id)]; a = { type: 'accuse', culprit: pick((c.cast || []).map((p) => p.id)), evidence: [pick(ids), pick(ids), pick(ids), pick(ids)].slice(0, 3 + Math.floor(R() * 2)), place: c.accusation.place ? pick(c.accusation.place.options) : null }; }
    const r = D.step(c, cs, a, ctx); cs = r.state; coins += coinsOf(r.events);
  }
  return { cs, coins };
}
let rbSolved = 0, rbCoins = 0, rbRuns = 0;
for (const c of ALL) for (let s = 0; s < 24; s++) { const r = randomBot(c, s, 300, PERSONA_IDS[s % 6]); rbRuns++; if (r.cs.solved) rbSolved++; rbCoins += r.coins; }
ok(`IC1/P2: ${rbRuns} random runs (300 moves each, a Knack each) solve nothing and earn nothing`, rbSolved === 0 && rbCoins === 0);
// a stronger cheat: every clue already marked, every link tried at random — the board's pay still needs evidence, not spraying
let cheatCoins = 0;
for (const c of ALL) for (let s = 0; s < 8; s++) {
  const P = D.prepare(c), R = rng(`cheat:${c.id}:${s}`), pick = (a) => a[Math.floor(R() * a.length)];
  let cs = D.newCase(c, { now: T }); cs.reached = 3; cs.chapter = 3; cs.asked = [...P.qById.keys()];
  for (const id of P.spans.keys()) cs.marks.push({ id, doc: P.spans.get(id).doc, span: id, text: '' });
  for (let i = 0; i < 300; i++) { const r = D.step(c, cs, { type: 'link', a: pick(cs.marks).id, b: pick(cs.marks).id, kind: pick(D.DTYPES) }, { now: T }); cs = r.state; cheatCoins += coinsOf(r.events); }
}
ok('a bot that marks every clue and sprays 300 random links earns nothing (first-try and no-spraying rules)', cheatCoins === 0);

/* ---------- the board accepts a link ONLY when a deduction supports it ---------- */
for (const c of ALL) {
  const P = D.prepare(c), cs = D.newCase(c); cs.chapter = 3; cs.reached = 3;
  for (const id of P.spans.keys()) cs.marks.push({ id, doc: P.spans.get(id).doc, span: id, text: '' });
  const ids = [...P.spans.keys()]; let bad = 0, n = 0, wl = 0, wlOk = 0;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) for (const kind of D.DTYPES) {
    const a = ids[i], b = ids[j], v = D.judgeLink(c, cs, a, b, kind); n++;
    const supported = (c.deductions || []).some((d) => d.spans.includes(a) && d.spans.includes(b) && !(d.contrastSpans || []).includes(a) && !(d.contrastSpans || []).includes(b) && (d.type === kind || (d.alsoKinds || []).includes(kind) || [...[].concat(d.alsoSkill || []), ...(d.alsoSkills || []), ...(d.extraSkills || [])].some((sk) => ({ sequence: 'timeline', vocab: 'meaning', factopinion: 'fact-opinion', pronoun: 'pronoun', figurative: 'figurative', voice: 'voice', inference: 'inference', contradiction: 'contradiction' })[sk] === kind)));
    if (v.ok !== supported) bad++;
  }
  for (const w of c.wrongLinks || []) { const [a, b] = w.spans; const v = D.judgeLink(c, cs, a, b, 'inference'); if (!v.ok && v.quill) { wl++; if (v.quill === w.quill || !(c.deductions || []).some((d) => d.spans.includes(a) && d.spans.includes(b))) wlOk += v.quill === w.quill ? 1 : 0; } }
  ok(`${c.id}: of ${n} (pair, kind) links, exactly those a deduction supports are accepted`, bad === 0);
  if ((c.wrongLinks || []).length) ok(`${c.id}: a tempting wrong pair gets Quill's own line from the data`, wlOk >= 1);
}
{ const c = CASES[0], cs = D.newCase(c); cs.chapter = 3; cs.reached = 3;
  ok('a link between clues not in the notebook is refused', !D.judgeLink(c, cs, 'strangers', 'nohonk', 'inference').ok);
  cs.marks.push({ id: 'strangers', span: 'strangers' }, { id: 'nohonk', span: 'nohonk' });
  ok('…and the same pair, marked, with the right kind, is accepted; with the wrong kind it is not', D.judgeLink(c, cs, 'strangers', 'nohonk', 'inference').ok && !D.judgeLink(c, cs, 'strangers', 'nohonk', 'voice').ok); }

/* ---------- wrong and weak accusations never end a case (IC4) ---------- */
for (const c of ALL) {
  const pre = play(c, { stopAt: play(c).steps - 1 }).cs;   // everything done but the accusation
  const a = c.accusation, sol = D.solution(c);
  ok(`${c.id}: the drawing room is open, the case not yet solved`, pre.chapter === 5 && !pre.solved);
  let cs = pre;
  for (const [who, line] of Object.entries(a.wrongSuspect || {})) {
    if (!D.accusable(c, cs).includes(who)) continue;
    const r = D.step(c, cs, { type: 'accuse', culprit: who, evidence: sol.accusation.evidence, place: sol.accusation.place }, { now: T });
    ok(`IC4 ${c.id}: accusing ${who} gives Quill's line from the data, keeps the case open and points to a document that is on the desk`, r.ok && r.verdict === 'wrong' && r.say.text === line && !r.state.solved && r.state.chapter === 5 && (!r.returnTo || D.docOpen(c, r.state, r.returnTo.doc)) && !r.events.length);
    cs = r.state;
  }
  for (const [key, t] of Object.entries(a.wrongTheory || {})) {
    if (D.prepare(c).castIds.has(key)) continue;
    const r = D.step(c, cs, { type: 'accuse', culprit: key, evidence: [] }, { now: T });
    ok(`IC4 ${c.id}: the wrong theory "${key}" gets its own line and ends nothing`, r.ok && r.verdict === 'theory' && r.say.text === (typeof t === 'string' ? t : t.quill) && !r.state.solved);
    cs = r.state;
  }
  const weakEv = sol.accusation.evidence.slice(1);
  const w = D.step(c, cs, { type: 'accuse', culprit: a.culprit, evidence: weakEv, place: sol.accusation.place }, { now: T });
  ok(`IC4 ${c.id}: the right person with one proof missing is "weak": the data's line, a document to return to, the case still open`, w.ok && w.verdict === 'weak' && [a.weakEvidence, a.partialEvidence?.quill || a.partialEvidence].includes(w.say.text) && w.returnTo && D.docOpen(c, w.state, w.returnTo.doc) && !w.state.solved && !w.events.length);
  cs = w.state;
  if (a.place) { const wrongPlace = a.place.options.find((o) => o !== a.place.answer); const p = D.step(c, cs, { type: 'accuse', culprit: a.culprit, evidence: sol.accusation.evidence, place: wrongPlace }, { now: T });
    ok(`${c.id}: the right person in the wrong place is not solved`, p.ok && p.verdict === 'place' && !p.state.solved); cs = p.state; }
  const fin = D.step(c, cs, sol.accusation, { now: T });
  ok(`${c.id}: after wrong tries the right accusation still solves it — without the first-accusation contest coins`, fin.state.solved && !fin.events.some((e) => e.ev === 'contest') && fin.state.score === cs.firstScore);
  ok(`${c.id}: the case score is the FIRST accusation's (a wrong suspect first scores 0)`, D.caseScore(c, fin.state) === (Object.keys(a.wrongSuspect || {}).some((x) => D.accusable(c, pre).includes(x)) ? 0 : D.caseScore(c, fin.state)));
}

/* ---------- no timer anywhere in a case ---------- */
const SRC = ['detective.js', 'detective-season.js', 'detective-data.js'].map((f) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')).join('\n');
ok('no timer in the case engine: no setTimeout, setInterval, requestAnimationFrame, performance.now or deadline', !/setTimeout|setInterval|requestAnimationFrame|performance\.now|deadline/.test(SRC));
for (const c of [CASES[0], CASES[11], JOURNEYS[1]]) {
  const a = play(c, { now: T }).cs, b = play(c, { now: T + 400 * DAY }).cs, strip = (s) => JSON.stringify({ ...s, started: 0, solvedAt: 0, accusations: s.accusations.map((x) => ({ ...x, at: 0 })) });
  ok(`${c.id}: the same play a year later is the same case — time spent changes nothing`, strip(a) === strip(b));
}
ok('Clue Spotter is the only timed drill, and it lives in Detective School, not in a case', SC.SPOTTER_MS === 60000 && !/SPOTTER_MS/.test(SRC));

/* ---------- a paused case resumes exactly (IC7) ---------- */
for (const c of [CASES[0], CASES[6], CASES[10], JOURNEYS[2]]) {
  const total = play(c).steps; let same = 0, tried = 0;
  for (let stop = 1; stop < total; stop += Math.max(1, Math.floor(total / 9))) {
    tried++;
    const half = play(c, { stopAt: stop }).cs, back = D.restore(c, JSON.parse(D.serialise(half)));
    if (JSON.stringify(back) !== JSON.stringify(half)) continue;
    const resumed = play(c, { start: back }).cs, straight = play(c).cs;
    if (resumed.solved && JSON.stringify(resumed.proved.slice().sort()) === JSON.stringify(straight.proved.slice().sort()) && JSON.stringify(resumed.paid) === JSON.stringify(straight.paid)) same++;
  }
  ok(`IC7 ${c.id}: paused at ${tried} points (mid-board among them), saved, reloaded and resumed, it ends exactly as one sitting does`, same === tried);
}
{ // through the real Store seam
  const h = newHousehold(), k = addKid(h, newKid('Ada', 2, 'owl')), c = CASES[3], ink = S.inkOf(k);
  let at = 1; while (at < 400) { const m = play(c, { stopAt: at }).cs; if (m.chapter === 3 && m.links.length > 0) break; at++; }
  const mid = play(c, { stopAt: at }).cs; S.putCase(k, c, mid);
  ok('the half-played board is mid-chapter 3', mid.chapter === 3 && mid.links.length > 0 && !D.boardCleared(c, mid));
  saveHousehold(h); const h2 = loadHousehold(), k2 = h2.kids[0], again = S.caseOf(k2, c);
  ok('IC7: saved through the Store seam and loaded again, the case is exactly where it was', JSON.stringify(again) === JSON.stringify(mid) && ink === k.inkwell);
  ok('…and it plays on to the end', play(c, { start: again }).cs.solved);
}
ok(`store v${VERSION}: a v4 household gains k.inkwell (null) and k.inkwellName (null)`, VERSION >= 5 && (() => { const m = migrate({ v: 4, parent: {}, kids: [{ id: 'a', games: {} }] }); return m.v === VERSION && m.kids[0].inkwell === null && m.kids[0].inkwellName === null; })());
{ const k = newKid('Mo', 2, 'x'); S.inkOf(k); S.renamePersona(k, 'Mo');
  const bk = makeBackup({ v: VERSION, parent: {}, kids: [k] });
  ok('a backup carries Inkwell progress but never the detective name the child typed', KID_FIELDS.includes('inkwell') && !KID_FIELDS.includes('inkwellName') && 'inkwell' in bk.kids[0] && !JSON.stringify(bk).includes('"Mo"')); }

/* ---------- chapters, hints, ink ---------- */
{ const c = CASES[1]; let cs = D.newCase(c);
  ok('chapters 1 → 2 → 3 are open; 4 waits for the board; 5 for the timeline', D.canEnter(c, cs, 2).ok && !D.canEnter(c, cs, 3).ok && (cs = D.step(c, cs, { type: 'chapter', n: 2 }).state) && D.canEnter(c, cs, 3).ok && (cs = D.step(c, cs, { type: 'chapter', n: 3 }).state) && !D.canEnter(c, cs, 4).ok && !D.canEnter(c, cs, 5).ok);
  const h = D.step(c, cs, { type: 'hint' }, { now: T });
  ok('a hint costs one ink and pays nothing', h.ok && h.state.ink === D.INK_START - 1 && !h.events.length && h.say.text);
  let s2 = h.state; for (let i = 0; i < 10; i++) s2 = D.step(c, s2, { type: 'hint' }).state;
  ok('with no ink left, Quill says where ink comes from instead', s2.ink === 0 && /Training Desk/.test(D.step(c, s2, { type: 'hint' }).say?.text || '')); }

/* ---------- the Knack: fair, narrow, UI only (P3, §2.3, §2.4) ---------- */
for (const c of ALL) {
  const mins = D.minimalItems(c);
  for (const p of PERSONA_IDS) {
    const k = S.knackFor(c, p);
    ok(`P3 ${c.id}/${p}: a Knack exists, outside chapter 5, with exactly 3 candidates`, !!k && k.chapter >= 1 && k.chapter <= 4 && k.candidates.length === 3 && new Set(k.candidates).size === 3);
    const isMin = (x) => { const [kind, rest] = [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)]; if (kind === 'span') return mins.has(rest); if (kind === 'link') { const [a, b] = rest.split('+'); return (c.accusation.minimalEvidence || []).some((id) => { const d = D.prepare(c).deds.get(id); return d && d.spans.includes(a) && d.spans.includes(b); }) || (mins.has(a) && mins.has(b)); } return false; };
    ok(`P3 ${c.id}/${p}: at most one candidate is minimal evidence`, (k?.candidates || []).filter(isMin).length <= 1);
    if (p === 'signe') ok(`${c.id}: the Spindle marks a slot, never an event`, (k?.candidates || []).every((x) => /^(slot|pair):/.test(x)));
  }
  // UI only: the knack step changes nothing but its own use counter, pays nothing, and is refused in the drawing room
  const pre = play(c, { stopAt: 3, persona: 'thea' }).cs; const k = S.knackFor(c, 'thea'); let cs = pre; cs.chapter = k.chapter; cs.reached = Math.max(cs.reached, k.chapter);
  const r = D.step(c, cs, { type: 'knack' }, { persona: 'thea', knackFor: S.knackFor });
  ok(`${c.id}: the Knack shows its candidates and changes nothing else (no mark, link, proof, ink or coin)`, r.ok && !r.events.length && JSON.stringify({ ...r.state, knack: {} }) === JSON.stringify({ ...cs, knack: {} }) && r.knack.candidates.length === 3);
  ok(`${c.id}: once per chapter`, !D.step(c, r.state, { type: 'knack' }, { persona: 'thea', knackFor: S.knackFor }).ok);
  const five = { ...cs, chapter: 5, reached: 5 };
  ok(`${c.id}: greyed out in the accusation`, !D.step(c, five, { type: 'knack' }, { persona: 'thea', knackFor: S.knackFor }).ok);
}
ok('the town cases without a scripted persona block use stand-ins that say so (needsReview)', Object.values(KNACKS).every((byP) => Object.values(byP).every((k) => k.generated && k.needsReview)));

/* ---------- replays pay once per child (P4, §2.5) ---------- */
{ const h = newHousehold(), k = addKid(h, newKid('Bo', 2, 'x')), c = CASES[2]; S.choosePersona(k, 'milo');
  let cs = S.startCase(k, c, { now: T }); const r1 = play(c, { persona: 'milo', start: cs }); S.putCase(k, c, r1.cs); S.closeCase(k, c, r1.cs, { now: T });
  S.choosePersona(k, 'vani'); cs = S.startCase(k, c, { now: T + DAY, replay: true });
  const r2 = play(c, { persona: 'vani', start: cs });
  ok('P4: a replay with another detective solves the case and pays nothing again', coinsOf(r1.events) > 0 && r2.cs.solved && coinsOf(r2.events) === 0 && cs.persona === 'vani');
  const out = S.closeCase(k, c, r2.cs, { now: T + DAY });
  ok('…but earns that detective\'s Word Hoard card', out.card?.persona === 'vani' && S.inkOf(k).hoard.vani.includes(out.card.id) && S.inkOf(k).hoard.milo.length === 1); }

/* ---------- the Training Desk (IC10, §2.1.8a) ---------- */
for (const c of ALL) {
  const tiers = [...new Set(c.exercises.map((x) => x.tier))];
  for (let lv = 1; lv <= 5; lv++) {
    const t = D.deskTier(c, lv), want = tiers.map((x) => [x, Math.max(1, Math.min(5, c.level + { easier: -1, at: 0, harder: 1 }[x]))]).sort((a, b) => Math.abs(a[1] - lv) - Math.abs(b[1] - lv) || a[1] - b[1])[0][0];
    if (t !== want) { ok(`IC10 ${c.id}: an English level ${lv} child gets the "${want}" tier`, false); break; }
  }
}
{ const c = CASES[6]; const done3 = play(c).cs;   // a level-3 case, solved: every chapter's items are on offer
  const items = D.deskItems(c, done3, 2);
  ok('IC10: a level-2 child on a level-3 case sees only the easier items', items.length > 0 && items.every((x) => x.tier === 'easier'));
  ok('IC10: an item for after chapter n is offered only once the child is past n (clue-revealing items wait for the solve)', D.deskItems(c, { ...D.newCase(c), reached: 2 }, 3).every((x) => x.chapter < 2) && D.deskItems(c, { ...D.newCase(c), reached: 5 }, 3).every((x) => x.chapter < 5));
  ok('IC10: the desk never blocks a chapter (the perfect bot never opened it)', ALL.every((cc) => !JSON.stringify(D.canEnter.toString()).includes('desk')));
  let cs = done3, n = 0, ink0 = cs.ink, paid = 0; const all = D.deskItems(c, cs, 3);
  for (const x of all) { const r = D.step(c, cs, { type: 'desk', x: x.id, answer: x.answer }, { englishLevel: 3, now: T }); cs = r.state; n += r.ok && r.right ? 1 : 0; paid += r.events.filter((e) => e.ev === 'answer').length; }
  ok(`IC10: ${n} right first tries pay ${paid} — at most 10 a case — and each earns 1 ink`, paid === Math.min(10, n) && cs.ink === ink0 + n && n > 0);
  // the cap, where a tier holds more than ten: a case whose desk offers fourteen right first tries pays ten
  const big = { ...c, id: c.id + '-big', exercises: Array.from({ length: 14 }, (_, i) => ({ ...all[i % all.length], id: 'big' + i })) };
  let bs = { ...D.newCase(big), reached: 6, solved: true }, bigPaid = 0;
  for (const x of big.exercises) { const r = D.step(big, bs, { type: 'desk', x: x.id, answer: x.answer }, { englishLevel: 3 }); bs = r.state; bigPaid += r.events.length; }
  ok('IC10: fourteen right first tries at the desk pay 10, the cap — and fourteen ink', bigPaid === D.DESK_CAP && bigPaid === 10 && bs.ink === D.INK_START + 14);
  let cs2 = done3; const x = all[0], wrong = Array.isArray(x.answer) ? ['nope'] : x.options ? x.options.find((o) => o !== x.answer) : 'nope';
  const m = D.step(c, cs2, { type: 'desk', x: x.id, answer: wrong }, { englishLevel: 3 });
  ok('a miss holds, with the exercise\'s own explanation, and pays nothing', m.ok && m.hold && m.explain === x.explain && !m.events.length);
  const m2 = D.step(c, m.state, { type: 'desk', x: x.id, answer: x.answer }, { englishLevel: 3 });
  ok('…and right on the second try pays nothing (first tries only), though it earns its ink', m2.right && !m2.events.length && m2.state.ink === m.state.ink + 1); }

/* ---------- mastery only on a later day (IC8) ---------- */
{ const c = CASES.find((cc) => cc.exercises.some((x) => x.objective && x.tier === 'at')), x = c.exercises.find((e) => e.objective && e.tier === 'at');
  const k = newKid('Lu', 2, 'x'); taught(k, x.objective, T);
  const solved = play(c).cs, r1 = D.step(c, solved, { type: 'desk', x: x.id, answer: x.answer }, { englishLevel: c.level, k, now: T + 3600e3 });
  ok(`IC8: a right Training Desk answer the same day as the teaching is practice (${x.objective} stays taught)`, r1.right && !r1.events.some((e) => e.ev === 'mastery') && stepOf(k, x.objective) === 1);
  const y = c.exercises.find((e) => e.objective === x.objective && e.id !== x.id && e.tier === 'at');
  if (y) { const r2 = D.step(c, r1.state, { type: 'desk', x: y.id, answer: y.answer }, { englishLevel: c.level, k, now: T + 2 * DAY });
    ok('IC8: the same objective proved on a LATER day is learned, through mastery.js, with its mastery coin to pay', r2.right && r2.events.some((e) => e.ev === 'mastery') && stepOf(k, x.objective) === 2); }
  const fresh = newKid('Ny', 2, 'x'); D.step(c, solved, { type: 'desk', x: x.id, answer: x.answer }, { englishLevel: c.level, k: fresh, now: T + 2 * DAY });
  ok('an objective never taught is not "learned" by a case: the stop teaches, the case only proves', stepOf(fresh, x.objective) === 0); }
{ const c = CASES[1];   // skills pronoun, vocab → s1-more, w2-word
  const k = newKid('Pi', 2, 'x'); taught(k, 's1-more', T); taught(k, 'w2-word', T);
  const same = play(c, { k, now: T + 3600e3 });
  ok('IC8: a case solved the same day as the teaching credits nothing', !same.events.some((e) => e.ev === 'mastery') && stepOf(k, 's1-more') === 1);
  const later = play(c, { k, now: T + DAY + 3600e3 });
  ok('IC8: the case\'s skills, used right on a later day, are learned', later.events.some((e) => e.ev === 'mastery') && stepOf(k, 's1-more') === 2); }

/* ---------- the owner's level rule (§1.4) ---------- */
ok('levels: ≥ 80% up one, 50–79% keeps, under 50% down one, never below 1 or above 5', D.nextLevel(2, 0.8) === 3 && D.nextLevel(2, 0.79) === 2 && D.nextLevel(2, 0.5) === 2 && D.nextLevel(2, 0.49) === 1 && D.nextLevel(1, 0) === 1 && D.nextLevel(5, 1) === 5);
{ const h = newHousehold(), k = addKid(h, newKid('Ru', 2, 'x')), c = CASES[3]; S.setLevel(k, 3);
  const pre = play(c, { stopAt: play(c).steps - 1 }).cs, wrong = Object.keys(c.accusation.wrongSuspect)[0];
  let cs = D.step(c, pre, { type: 'accuse', culprit: wrong, evidence: [] }, { now: T }).state; cs = D.step(c, cs, D.solution(c).accusation, { now: T }).state;
  const out = S.closeCase(k, c, cs, { now: T });
  ok('a first accusation of the wrong person scores 0: the chosen level 3 drops to 2, with the kind line', out.level.before === 3 && out.level.after === 2 && out.level.dropped && /warm up on Level 2/.test(S.DROP_LINE(2)) && S.inkOf(k).level.pick === null);
  const k2 = addKid(h, newKid('Su', 2, 'x')), full = play(c).cs; ok('a full first accusation moves the level up', S.closeCase(k2, c, full, { now: T }).level.after === 2); }

/* ---------- the season: release, gates, Door, wall, shelf, Ledger, ranks ---------- */
{ const h = newHousehold(), k = addKid(h, newKid('Vi', 2, 'x'));
  const CASES = ALL.filter((c) => /^case-/.test(c.id)), JOURNEYS = ALL.filter((c) => /^journey-/.test(c.id));
  ok('the twelve cases are signed off (owner, 8 Oct 2026: "all 12 now"); the four Journeys are not — their quotations await their source texts', CASES.length === 12 && CASES.every((c) => c.source.signedOffBy && c.source.signedOffOn === '2026-10-08') && JOURNEYS.length === 4 && JOURNEYS.every((c) => c.source.signedOffBy === null));
  const kid0 = S.seasonList(k, ALL);
  ok('…so a child sees Case 0 first and no Journey', kid0.find((e) => e.id === 'case-00').open && JOURNEYS.every((c) => { const e = kid0.find((x) => x.id === c.id); return !e.open && /sign/.test(e.why); }));
  { const kc = addKid(h, newKid('Ro', 2, 'x')); for (const id of ['case-00', 'case-01', 'case-02', 'case-03']) { const c = ALL.find((x) => x.id === id); S.closeCase(kc, c, play(c).cs, { now: T }); }
    ok('an unsigned Journey never blocks the case after it: Case 4 opens after Case 3', S.seasonList(kc, ALL).find((e) => e.id === 'case-04').open); }
  const unsigned = ALL.map((c) => ({ ...c, source: { ...c.source, signedOffBy: null } }));
  ok('unsigned, a case is hidden from children', S.seasonList(k, unsigned).every((e) => !e.open && /sign/.test(e.why)));
  const t = S.seasonList(k, unsigned, { tester: true });
  ok('…and tester mode shows every one (h.parent.tester)', t.every((e) => e.open));
  const signedAll = ALL.map((c) => ({ ...c, source: { ...c.source, signedOffBy: 'owner' } }));
  let list = S.seasonList(k, signedAll);
  ok('signed, the season opens one chapter at a time: Case 0 first', list[0].open && !list[1].open);
  for (const id of ['case-00', 'case-01', 'case-02']) { const c = signedAll.find((x) => x.id === id); S.closeCase(k, c, play(c).cs, { now: T }); }
  list = S.seasonList(k, signedAll);
  ok('the Reading Door is shut until four cases are on the wall', !list.find((e) => e.id === 'journey-01').open && S.door(k).opened === 0);
  const c3 = signedAll.find((x) => x.id === 'case-03'); S.closeCase(k, c3, play(c3).cs, { now: T });
  list = S.seasonList(k, signedAll);
  ok('after Case 3 the Door opens on the Olympus Journey, and Case 4 waits for it', list.find((e) => e.id === 'journey-01').open && !list.find((e) => e.id === 'case-04').open && S.door(k).opened === 1);
  ok('the Blot Ledger inks UNDER, THE, CLOCK in order', S.ledgerWords(k, signedAll).map((w) => w.word).join(' ') === 'UNDER THE CLOCK');
  ok('the shelf holds each solved case\'s object; the casebook wall stamps each SOLVED', S.shelf(k, signedAll).length === 4 && S.wall(k, signedAll).every((w) => w.stamp === 'SOLVED'));
  ok('rank comes from cases solved with full evidence: four makes a Detective Sergeant', S.rankOf(k).id === 'sergeant' && S.sergeant(k));
  const j1 = signedAll.find((x) => x.id === 'journey-01'); S.choosePersona(k, 'oskar'); const jcs = S.startCase(k, j1, { now: T }); const out = S.closeCase(k, j1, play(j1, { persona: 'oskar', start: jcs }).cs, { now: T });
  ok('a Journey puts its souvenir by the Door and gives every detective its bonus card', out.shelf?.id === 'plectrum' && out.card?.id === 'bonus-journey-01' && S.shelf(k, signedAll).some((x) => x.byDoor)); }
{ const k = newKid('Wy', 1, 'x');
  ok('the persona picker suggests Milo (Winged Words) to the youngest band, and nobody else is sorted', S.suggestPersona(k) === 'milo' && S.suggestPersona(newKid('Xa', 3, 'x')) === null);
  ok('a detective can be renamed: 12 letters at most, the name filter applies', S.renamePersona(k, 'Starlight') && S.detectiveName(k) === 'Starlight' && !S.renamePersona(k, 'idiot') && S.renamePersona(k, 'Abcdefghijklmnop') && k.inkwellName.length === 12); }
ok('{det} renders with the persona\'s pronouns', D.personaText('{det} found {det.his} hat. {Det.he} smiled.', PERSONAS[0]) === 'Thea found her hat. She smiled.' && D.personaText('{det.he}', PERSONAS[1]) === 'he');

/* ---------- the six detectives (§1, §13) and the Word Hoard (§3.2, P5) ---------- */
ok('six detectives: three girls and three boys, two each from the Greek, Norse and Hindu stories; nobody is they/them', PERSONAS.length === 6 && PERSONAS.filter((p) => p.pronouns === 'she').length === 3 && PERSONAS.filter((p) => p.pronouns === 'he').length === 3 && ['greek', 'norse', 'hindu'].every((t) => PERSONAS.filter((p) => p.tradition === t).length === 2));
// §1.8 says every skill the season tags is served by at least two personas; the persona sheets give detail, pronoun and
// figurative to one Knack each, and punctuation and factopinion to none (reported to the owner). What holds is held here:
ok('the Knacks\' skills, as the persona sheets give them (sequence, inference, vocab, voice, contradiction by two each)', ['sequence', 'inference', 'vocab', 'voice', 'contradiction'].every((s) => PERSONAS.filter((p) => p.knack.skills.includes(s)).length >= 2) && ['detail', 'pronoun', 'figurative'].every((s) => PERSONAS.filter((p) => p.knack.skills.includes(s)).length === 1));
ok('the Hindu persona sheets wait on Bizzing India\'s reviewer (P8); a gift is never the god (no sacred token)', PERSONAS.filter((p) => p.tradition === 'hindu').every((p) => p.reviewRequired) && !PERSONAS.some((p) => /conch|discus|tilak|trident|chakra/i.test(p.token)));
ok('the Word Hoard holds 72 cards: 12 per detective, one for each case 0–11', CARDS.length === 72 && PERSONA_IDS.every((p) => { const cs = CARDS.filter((c) => c.persona === p).map((c) => c.case).sort(); return cs.length === 12 && cs.join() === CASES.map((c) => c.id).join(); }));
ok('P5: every card names two or more sources and waits on review until they are checked', CARDS.every((c) => c.sources.length >= 2 && c.needsReview && !c.sourcesChecked));
ok('P5: the seven ⚖ cards each carry their doubt line', CARDS.filter((c) => c.doubt).map((c) => c.word).sort().join() === ['atlas', 'Athens', 'caduceus', 'hermeneutics', 'berserk', 'Friday', 'verandah'].sort().join());
ok('every Hindu-set card says "Ask your family"; no other set is told to', CARDS.every((c) => c.askFamily === (c.persona === 'hari' || c.persona === 'vani')));
ok('the juggernaut card tells the misunderstanding plainly', /misunderstanding|exaggerated/.test(CARDS.find((c) => c.word === 'juggernaut').story));
ok('every card\'s one question has three different options and its answer among them', [...CARDS, ...BONUS].every((c) => c.question && c.question.options.length === 3 && new Set(c.question.options).size === 3 && c.question.options.includes(c.question.answer)));
ok('the four Journey bonus cards (plectrum, kenning, tragedy, fathom) come from their scripts, with sources', BONUS.map((b) => b.word).join() === 'plectrum,kenning,tragedy,fathom' && BONUS.every((b) => b.sources.length >= 2 && b.story && b.path.length >= 2));
{ const h = newHousehold(), k = addKid(h, newKid('Yo', 2, 'x')); S.choosePersona(k, 'thea'); taught(k, 'w7-myth-names', T);
  const c = CASES[0]; S.closeCase(k, c, play(c, { persona: 'thea' }).cs, { now: T });
  ok('a Word Hoard card is not asked again the same day it was found', !S.originDue(k, T).length);
  const due = S.originDue(k, T + DAY); const card = due[0];
  const r = S.answerOrigin(k, card.id, card.question.answer, T + DAY);
  ok('on a later day its question returns at the Training Desk, and a right answer is mastery evidence (w7-myth-names learned)', card.word === 'mentor' && r.right && r.events.length === 1 && stepOf(k, 'w7-myth-names') === 2); }

/* ---------- the Ink Journeys (format 1.3) and their quotations ---------- */
ok('the Journeys are format 1.3, kind "journey", add no Ledger word, and carry a souvenir and margin notes with sources', JOURNEYS.every((j) => j.format === 1.3 && j.kind === 'journey' && j.vanishedWord === null && j.souvenir && j.marginNotes.length && j.marginNotes.every((m) => m.source)));
ok('Journey 3 has no culprit: its answer is a chain, and every link-person has a wrong-suspect line', JOURNEYS[2].accusation.culprit === 'chain' && ['friar-john', 'balthasar', 'capulet', 'laurence'].every((x) => JOURNEYS[2].accusation.wrongSuspect[x]));
ok('real people are never suspects: Will and Mark Twain are clients', JOURNEYS[2].cast.find((p) => p.id === 'will').role === 'client' && JOURNEYS[3].cast.find((p) => p.id === 'twain').role === 'client');
ok('the grown-up notes on the Verona and Mississippi cards are carried', /sad story/.test(JOURNEYS[2].grownUps) && /slavery/.test(JOURNEYS[3].grownUps));
{ const quotes = JOURNEYS.flatMap((j) => j.quotes.map((q) => ({ ...q, j: j.id }))); let fine = 0;
  for (const q of quotes) {
    const w = WORKS.find((x) => x.held && cleared(x) && q.work.toLowerCase().includes(x.title.toLowerCase()));
    const text = w && readText(w.id), norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase();
    if (w && text) { if (norm(text).includes(norm(q.text))) fine++; } else if (q.needsReview && !q.held) fine++;
  }
  ok(`hard rule 2: each of the Journeys' ${quotes.length} quotations is either found in a held text or held back for review (none of these works is held yet)`, fine === quotes.length && quotes.length > 0); }

/* ---------- Detective School ---------- */
ok('every case and Journey drill becomes Detective School items', ALL.every((c) => { const d = SC.caseDrill(c); return d && d.title && Array.isArray(d.items); }));
{ const d = SC.caseDrill(CASES[0]); ok('Case 0\'s "Then what?" is an ordering drill, dealt out of order', d.items[0].kind === 'order' && d.items[0].cards.join() !== d.items[0].answer.join()); }
{ const solved = ['case-00', 'case-01']; const round = SC.spotterRound(ALL, solved, 1, 1, 5);
  ok('Clue Spotter deals only documents from cases the child has solved (never a spoiler)', round.length > 0 && round.every((x) => solved.includes(x.case)));
  const it = round[0], j = SC.spotterJudge(it, it.clues), sloppy = SC.spotterJudge(it, it.words.map((w) => w.i));
  ok('Clue Spotter: marking exactly the clues is perfect; marking every word is not', j.perfect && j.score === it.clues.length && !sloppy.perfect && sloppy.score < it.clues.length); }
ok('drill pay: nothing for a round under 50%, answer 1 per right first try above it, at most 10', SC.drillPay([{ ok: true }, { ok: false }, { ok: false }]).length === 0 && SC.drillPay(Array(14).fill({ ok: true })).length === 10 && SC.drillPay([{ ok: true, first: false }, { ok: true }]).length === 1);
{ const PJ = json('../src/data/passages.json'); const works = WORKS.filter((w) => cleared(w));
  const t = SC.timelineRound({ passages: PJ, works }, 's1', 1, { now: T });
  ok('Detective School Timeline is Plot Line\'s mechanic on real Library stories', t.length > 0 && t.every((q) => q.cards.length >= 4 && q.work));
  const w = SC.whoRound({ lines: LINES.filter((l) => cleared(WORKS.find((x) => x.id === l.work))), works }, 's1', 2, { now: T });
  ok('Who Wrote This? is Who Said It?\'s mechanic; a miss can show a second line by the same author', w.length === 5 && w.every((q) => q.options.length === 4) && w.some((q) => q.compare && q.compare !== q.text)); }

done();
