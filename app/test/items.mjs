/* items.mjs — every question has ONE right answer that is not in its text, distinct options, and no
   favourite answer slot (SPEC §12, §13). Draws EVERY key of every kind for every band.
   Never loosen it to make a generator pass — fix the generator. */
import { readFileSync } from 'node:fs';
import { KINDS, keys, make, check, copyDiff, passageItems } from '../src/items.js';
import { PASSAGES } from '../src/data/library.js';
import { allStops } from '../src/curriculum.js';

const lex = JSON.parse(readFileSync(new URL('../public/data/bee-words.json', import.meta.url)));
let fail = 0, n = 0; const bad = (m) => { if (fail < 40) console.log('✗', m); fail++; };
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const inText = (needle, hay) => new RegExp(`(^| )${norm(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(norm(hay));
const slots = {};

/* every authored stop names a generator that exists */
for (const st of allStops()) if (!/^(readAloud|desk|speak)$/.test(st.kind) && !KINDS.includes(st.kind)) bad(`stop ${st.id}: kind ${st.kind} has no generator`);
for (const st of allStops().filter((x) => x.kind === 'desk')) if (!st.desk?.parts?.length || !st.desk.check?.length || !(st.desk.min > 0)) bad(`desk ${st.id}: needs parts, a checklist and a minimum`);
for (const st of allStops().filter((x) => x.kind === 'speak')) if (!st.speak?.mode || !(st.speak.target?.[0] < st.speak.target?.[1])) bad(`speak ${st.id}: needs a mode and a target window`);

/* rhyme, by Bee's respelling: the last syllable's vowel and coda ("KAT" → "AT") */
const rime = (w) => { const p = (lex.words[w]?.[1] || '').split(/[-\s]/).filter(Boolean).at(-1)?.toUpperCase() || ''; const m = p.match(/[AEIOUY].*$/); return m ? m[0] : null; };

for (const band of [1, 2, 3]) {
  const ctx = { band, lex };
  for (const kind of KINDS) {
    const ks = keys(kind, ctx);
    if (!ks.length) { bad(`${kind} band ${band}: no items`); continue; }
    for (const key of ks) {
      const it = make(kind, key, ctx); n++;
      if (!it || !it.id) { bad(`${kind}:${key} made nothing`); continue; }
      if (it.type === 'mc') {
        if (it.options.length < 2) bad(`${it.id}: ${it.options.length} options`);
        if (new Set(it.options.map(norm)).size !== it.options.length) bad(`${it.id}: options repeat: ${it.options.join(' | ')}`);
        if (!(it.answer >= 0 && it.answer < it.options.length)) bad(`${it.id}: answer out of range`);
        if (!check(it, it.answer) || it.options.some((_, i) => i !== it.answer && check(it, i))) bad(`${it.id}: not exactly one right option`);
        const right = it.options[it.answer];
        if (it.select && kind === 'authored' && !it.options.every((o) => inText(o, it.prompt + ' ' + (it.sub || '')))) bad(`${it.id}: a which-word question whose options are not all in its line`);
        if (!it.fixed && !it.select && kind !== 'passage' && (inText(right, it.prompt) || inText(right, it.sub || ''))) bad(`${it.id}: the answer "${right}" is in the question`);
        if (!it.fixed && it.options.length === 4) { const s = (slots[kind] ||= [0, 0, 0, 0]); s[it.answer]++; }
        if (kind === 'rhyme') {
          const t = it.prompt.match(/“(.+)”/)[1], rt = rime(t);
          it.options.forEach((o, i) => { if (i !== it.answer && rt && rime(o) === rt) bad(`${it.id}: "${o}" also rhymes with "${t}" by Bee's respelling`); });
        }
      } else if (it.type === 'tapmulti' || it.type === 'caps' || it.type === 'gaps') {
        if (!it.answer.length) bad(`${it.id}: nothing to tap`);
        if (!check(it, it.answer)) bad(`${it.id}: its own answer is not right`);
        if (check(it, [])) bad(`${it.id}: tapping nothing is right`);
        if (it.type === 'caps' && it.tokens.some((t) => /[A-Z]/.test(t))) bad(`${it.id}: a capital shows in the question`);
        if (it.type === 'gaps' && it.tokens.some((t) => /,$/.test(t) && it.kind === 'commas')) bad(`${it.id}: a comma shows in the question`);
      } else if (it.type === 'order') {
        if (!check(it, it.answer)) bad(`${it.id}: its own order is not right`);
        if (it.tiles.join(' ') === it.answer.join(' ')) bad(`${it.id}: tiles start in the right order`);
        if (it.tiles.slice().sort().join() !== it.answer.slice().sort().join()) bad(`${it.id}: tiles are not the sentence's words`);
      } else if (it.type === 'chunk') {
        if (!(it.answer >= 0) || !check(it, it.answer) || it.chunks.some((_, i) => i !== it.answer && check(it, i))) bad(`${it.id}: not exactly one main clause`);
      } else if (it.type === 'type') {
        if (!it.accept.length || !check(it, it.accept[0])) bad(`${it.id}: its own answer is not accepted`);
        if (check(it, it.prompt)) bad(`${it.id}: typing the two sentences back is accepted`);
      } else if (it.type === 'copy') {
        if (!check(it, it.text)) bad(`${it.id}: the exact text is not accepted`);
        if (check(it, it.text.toLowerCase()) && /[A-Z]/.test(it.text)) bad(`${it.id}: a copy with no capitals is accepted`);
      }
    }
  }
}
/* no favourite slot: every slot gets 10–40% of each 4-option kind's answers */
for (const [kind, s] of Object.entries(slots)) { const t = s.reduce((a, b) => a + b, 0); if (t >= 40) s.forEach((c, i) => { if (c / t < 0.1 || c / t > 0.4) bad(`${kind}: slot ${i + 1} holds ${Math.round((c / t) * 100)}% of answers`); }); }
/* fixed-order kinds are balanced by their data */
for (const kind of ['phraseClause', 'endMark']) { const ks = keys(kind, { band: 3, lex }); const c = {}; ks.forEach((k) => { const a = make(kind, k, { band: 3, lex }).answer; c[a] = (c[a] || 0) + 1; }); Object.values(c).forEach((v) => { if (v / ks.length < 0.25) bad(`${kind}: one answer is only ${Math.round((v / ks.length) * 100)}% of items`); }); }
/* passages */
for (const p of PASSAGES) for (const it of passageItems(p)) { n++; if (!check(it, it.answer) || it.options.some((_, i) => i !== it.answer && check(it, i))) bad(`${it.id}: not exactly one right`); }
/* every shipped story's own exercises: one right answer, the author's commas and order recoverable */
import { storyExercises } from '../src/items.js';
import { WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
const PJ = JSON.parse(readFileSync(new URL('../src/data/passages.json', import.meta.url)));
for (const pj of PJ) {
  const p = PASSAGES.find((x) => x.id === pj.id); const sets = storyExercises(p, pj.text, lex);
  if (!sets.understand.length) bad(`${p.id}: no comprehension questions`);
  if (!sets.words.length) bad(`${p.id}: none of its words is in the lexicon`);
  for (const it of [...sets.words, ...sets.commas, ...sets.order, ...sets.copy]) {
    n++;
    if (it.type === 'mc' && (new Set(it.options.map(norm)).size !== it.options.length || !check(it, it.answer))) bad(`${it.id}: options repeat or answer wrong`);
    if (it.type === 'gaps' && (!it.answer.length || !check(it, it.answer) || it.tokens.some((t) => /,$/.test(t)))) bad(`${it.id}: commas not recoverable`);
    if (it.type === 'order' && (!check(it, it.answer) || it.tiles.join(' ') === it.answer.join(' '))) bad(`${it.id}: order item broken`);
    if (it.type === 'copy' && (!check(it, it.text) || !pj.text.replace(/\s+/g, ' ').includes(it.text))) bad(`${it.id}: the copy line is not the author's`);
  }
}
/* imitation: every model has its own shape; a copy is refused; a child's own sentence in the shape passes */
import { imitate, SHAPES } from '../src/writing.js';
import WRITING from '../src/data/writing.js';
for (const m of Object.values(WRITING.models).flat()) {
  n++;
  if (!SHAPES[m.shape].test(m.text)) bad(`model ${m.id} is not its own shape: ${m.text}`);
  if (imitate(m.shape, m.text, m.text).ok) bad(`model ${m.id}: copying the model is accepted`);
  if (!PJ.some((p) => p.text.replace(/\s+/g, ' ').includes(m.text)) && !readFileSync(new URL(`../public/texts/${m.work}.txt`, import.meta.url), 'utf8').replace(/\s+/g, ' ').includes(m.text)) bad(`model ${m.id} is not a real sentence of ${m.work}`);
}
const MINE = { opener: 'When the bell rang, my little brother cheered loudly.', list3: 'We packed apples, bananas and a big flask of tea.', simile: 'The lake was as smooth as a mirror this morning.',
  but: 'I wanted to play cricket outside, but the monsoon had other plans.', fronted: 'Slowly, the old tortoise crossed the dusty road.', question: 'Why does the moon follow our car at night?' };
for (const [k, v] of Object.entries(MINE)) { n++; if (!imitate(k, 'A completely different model sentence.', v).ok) bad(`shape ${k}: a good sentence of a child's own is refused: ${imitate(k, 'x', v).why}`); }
for (const [k, v] of Object.entries(MINE)) for (const [k2] of Object.entries(MINE)) if (k !== k2 && SHAPES[k2].test(MINE[k]) && !(k === 'but' && k2 === 'opener')) { /* overlap is allowed: a sentence can have two shapes */ }
if (imitate('opener', 'x', 'the bell rang and we ran').ok) bad('imitation accepts a sentence with no capital or end mark');
for (const d of WRITING.dictation) { n++; if (!PJ.find((p) => p.id === d.passage)?.text.replace(/\s+/g, ' ').includes(d.text)) bad(`dictation ${d.id} is not a real sentence of its passage`); }
/* copywork names the kind of mistake */
const d = copyDiff('Where the mind is without fear,', 'where the mind is without fear');
if (d.ok || d.errors.map((e) => e.kind).join() !== 'capital letter,punctuation') bad(`copyDiff: ${JSON.stringify(d.errors)}`);
if (copyDiff('a b', 'a  b').ok !== true) bad('copyDiff: a double space is not a mistake');
/* prove the checks can fail: a leaked answer and a doubled right answer */
const probe = { id: 'probe', type: 'mc', prompt: 'Which word rhymes with “cat”? (hat)', options: ['hat', 'dog', 'sun', 'pen'], answer: 0 };
if (!inText(probe.options[0], probe.prompt)) bad('the leak check is blind');
if (check({ ...probe, options: ['hat', 'hat'] }, 1)) bad('check() accepted the wrong slot');

if (fail) { console.log(`items: ${fail} FAILED of ${n}`); process.exit(1); }
console.log(`items: all ${n} items passed (${KINDS.length} kinds × 3 bands, plus ${PASSAGES.length} passages)`);
