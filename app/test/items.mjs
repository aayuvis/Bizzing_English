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
for (const st of allStops()) if (st.kind !== 'readAloud' && !KINDS.includes(st.kind)) bad(`stop ${st.id}: kind ${st.kind} has no generator`);

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
