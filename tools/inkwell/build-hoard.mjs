#!/usr/bin/env node
// build-hoard.mjs — the Word Hoard (handover "six detectives" §3.2): the 72 origin cards, read word for word from
// the handover's six tables, plus the four Journey bonus cards from the Journey scripts. Writes
// app/src/data/inkwell-wordhoard.js. `--check` exits 1 if that file is out of date (the gate runs it).
//
// What is the handover's and what is built here:
//   - word, case, persona and the one-line origin (`line`) are the handover's, verbatim (markdown emphasis removed);
//   - `doubt` is the handover's own ⚖ sentence; `askFamily` follows §3.1 (every Hindu-set card);
//   - `path` (three stops) and the one `question` are BUILT from the line and the persona's set, never from memory:
//     the question asks which family of words the word comes from — asked before the card turns, so its answer is
//     never on the face the child is looking at — and its options are the season's four families;
//   - `sources` NAME the two dictionary entries §3.2 requires (Etymonline, Merriam-Webster); none was opened from
//     here, so every card is `needsReview: true` until a reviewer checks both entries (and, for the Hindu set,
//     Bizzing India's named reviewer signs it: P8).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const HAND = path.join(ROOT, 'docs', 'inkwell', 'HANDOVER.md');
const OUT = path.join(ROOT, 'app', 'src', 'data', 'inkwell-wordhoard.js');

const PERSONA_HEAD = { Thea: 'thea', Milo: 'milo', Oskar: 'oskar', Signe: 'signe', Hari: 'hari', Vani: 'vani' };
export const FAMILIES = {
  myth: 'the Greek and Roman myths',
  norse: 'Old Norse and the Norse stories',
  india: 'a language of India (Sanskrit or Hindi)',
  cousin: 'a cousin word: Sanskrit and English share one ancient ancestor',
};
const FAMILY_OF = { thea: 'myth', milo: 'myth', oskar: 'norse', signe: 'norse', hari: 'india', vani: 'cousin' };
const OVERRIDE = { saturday: 'myth' };   // the line itself: "the one weekday that is Roman, not Norse"
const OBJECTIVE = { thea: 'w7-myth-names', milo: 'w7-myth-names', oskar: 'la3-old-english', signe: 'la3-old-english', hari: 'la2-india', vani: 'w6-families' };
const clean = (t) => t.replace(/\*\*?([^*]+)\*\*?/g, '$1').replace(/\s+/g, ' ').trim();
const hash = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

export function readHoard(text) {
  const lines = text.split('\n'), start = lines.findIndex((l) => /^#### 3\.2 The 72 words/.test(l));
  const end = lines.findIndex((l, i) => i > start && /^\*\*Why this set teaches/.test(l));
  const cards = []; let who = null;
  for (const l of lines.slice(start, end)) {
    const h = l.match(/^\*\*(Thea|Milo|Oskar|Signe|Hari|Vani) \(/); if (h) { who = PERSONA_HEAD[h[1]]; continue; }
    const r = l.match(/^\| (\d+) \| \*\*([^*]+)\*\* \| (.+) \|\s*$/); if (!r || !who) continue;
    const n = +r[1], word = r[2].trim(), raw = r[3].trim(), line = clean(raw);
    const doubtAt = line.indexOf('⚖');
    cards.push({ persona: who, n, word, line, doubt: doubtAt >= 0 ? line.slice(doubtAt + 1).trim() : null });
  }
  return cards;
}

/* the source a line names, when it opens with one ("Old Norse vindauga, 'wind-eye'." → "Old Norse vindauga") */
function sourceOf(line) {
  const m = line.match(/^(Old Norse|Old English|Greek|Latin|Sanskrit|Hindi)\s+([^\s,.;:()]+)/);
  return m ? `${m[1]} ${m[2]}` : null;
}
function question(card, fam) {
  const right = FAMILIES[fam], others = Object.entries(FAMILIES).filter(([k]) => k !== fam && !(fam === 'cousin' && k === 'india') && !(fam === 'india' && k === 'cousin')).map(([, v]) => v);
  const two = others.sort((a, b) => hash(card.word + a) - hash(card.word + b)).slice(0, 2), opts = [right, ...two].sort((a, b) => hash(card.word + '|' + a) - hash(card.word + '|' + b));
  return { prompt: `Where does the word "${card.word}" come from?`, options: opts, answer: right, explain: card.line };
}
export function buildCards(handover) {
  return readHoard(handover).map((c) => {
    const fam = OVERRIDE[c.word.toLowerCase()] || FAMILY_OF[c.persona], src = sourceOf(c.line);
    return {
      id: `${c.persona}-${String(c.n).padStart(2, '0')}`, persona: c.persona, case: `case-${String(c.n).padStart(2, '0')}`, word: c.word,
      family: fam, line: c.line, path: [src || FAMILIES[fam], 'into English', c.word], story: c.line, doubt: c.doubt,
      question: question(c, fam), objective: OBJECTIVE[c.persona],
      sources: [`Online Etymology Dictionary (etymonline.com), "${c.word.split(' / ')[0].toLowerCase()}"`, `Merriam-Webster, "${c.word.split(' / ')[0].toLowerCase()}"`],
      sourcesChecked: false, askFamily: c.persona === 'hari' || c.persona === 'vani', needsReview: true, questionBuilt: true,
    };
  });
}
/* the Journeys' bonus cards: built from each Journey's script by build-journeys.mjs (data/journeys/*.json bonusCard) */
export function buildBonus() {
  const dir = path.join(ROOT, 'app', 'src', 'data', 'journeys');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^journey-\d\d\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).bonusCard).filter(Boolean);
}

function render(cards, bonus) {
  return `/* inkwell-wordhoard.js — GENERATED by tools/inkwell/build-hoard.mjs from docs/inkwell/HANDOVER.md §3.2 and the Journey
   scripts. Do not edit by hand: change the source and rebuild (\`node tools/inkwell/build-hoard.mjs\`).
   Every card is needsReview until a reviewer opens both named dictionary entries (and P8 for the Hindu set). */
export const FAMILIES = ${JSON.stringify(FAMILIES, null, 2)};
export const CARDS = ${JSON.stringify(cards, null, 1)};
export const BONUS = ${JSON.stringify(bonus, null, 1)};
`;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const cards = buildCards(fs.readFileSync(HAND, 'utf8')), bonus = buildBonus();
  if (cards.length !== 72) { console.error(`expected 72 Word Hoard cards, read ${cards.length}`); process.exit(1); }
  const js = render(cards, bonus);
  if (process.argv.includes('--check')) { const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''; if (now !== js) { console.log('✗ inkwell-wordhoard.js is out of date: run node tools/inkwell/build-hoard.mjs'); process.exit(1); } console.log(`Word Hoard: ${cards.length} cards + ${bonus.length} bonus, up to date`); }
  else { fs.writeFileSync(OUT, js); console.log(`wrote ${cards.length} cards + ${bonus.length} bonus cards to ${path.relative(process.cwd(), OUT)}`); }
}
