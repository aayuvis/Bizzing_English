/* tools.js — the Tools tab's rules, pure (no DOM, no storage), so test/tools.mjs can hold them.

   Vocabulary, Idioms & Similes and the Typing Trainer are taken from Bizzing Bee (the owner, 3 Oct 2026),
   ported from spellbound-app/app3.js @ Bee 2f74e99d76723aca80040ccf549c933c38a2cd47:
     - Vocabulary: viewVocab / vocProg / vocBuildSet / vocFinishCheck / vocBuildCheck (app3.js ~4081–4240) —
       study a set, check yourself on those exact words, 80% unlocks the next set; misses are revised first.
       Bee's lists (Meaning Masters, The Mighty 500) come from tools/import-bee-tools.mjs; the level and
       origin decks from Bee's lexicon (tools/import-bee.mjs). Bee's example sentences are not carried.
     - Idioms & Similes: figPool / FIG_OC / figDecks / figDeckItems / viewFigurative (app3.js ~4047–4300) on
       Bee's figurative-data.js (kid: true only).
     - Typing Trainer: TY_LESSONS / TY_FINGER / tyClean / tyFinish (app3.js ~4300–4378).
   Adapted only to English: its state (k.games.*), its wallet (standard events), its band, its own held
   sentences for the "sentences" drill, and one right answer per question permuted by rand.permute.
   Quotes & Poems is English's own: held, checked lines only (Bee's quotes are unsourced and never imported). */

import { permute, rng, shuffle } from './rand.js';
import { kidSafe, lineSafe } from './safe.js';

export const BEE_COMMIT = '2f74e99d76723aca80040ccf549c933c38a2cd47';

/* ---------- the shelf ---------- */
export const TOOLS = [
  { id: 'stage', href: '#/stage', kick: 'Speaking', title: 'The Stage', blurb: 'Read aloud, the speaking ladder, the Elocution Contest.', c: '#B91C1C', ic: 'lectern', cta: 'Speak' },
  { id: 'desk', href: '#/tools/desk', kick: 'Writing', title: 'The Writing Desk', blurb: 'Paragraphs, letters, essays — counts, never marks.', c: '#3F4FB0', ic: 'quill', cta: 'Write' },
  { id: 'vocab', href: '#/tools/vocab', kick: 'Meaning', title: 'Vocabulary', blurb: 'Word to meaning, vocabulary-bee style.', c: '#0A6B5D', ic: 'book', cta: 'Study' },
  { id: 'idioms', href: '#/tools/idioms', kick: 'Sayings', title: 'Idioms & Similes', blurb: 'Thousands of phrases and the story behind each one.', c: '#7A2F8C', ic: 'bubble', cta: 'Open' },
  { id: 'typing', href: '#/tools/typing', kick: 'Speed', title: 'Typing Trainer', blurb: 'Touch-type, then race the sixty-second test.', c: '#2A55C0', ic: 'pen', cta: 'Practise' },
  { id: 'quotes', href: '#/tools/quotes', kick: 'Voices', title: 'Quotes & Poems', blurb: 'Lines worth knowing by heart, from the books themselves.', c: '#8A5B00', ic: 'quote', cta: 'Read' },
];
export const SMALL_TOOLS = [
  { id: 'bank', href: '#/library/words', title: 'Word bank', blurb: 'every word you tapped or learned', ic: 'bank' },
  { id: 'dictionary', href: '#/search', title: 'Dictionary', blurb: 'look up any word in Bizzing Bee’s list', ic: 'search' },
];
export const TOOL_ROUTES = ['', 'desk', 'vocab', 'idioms', 'typing', 'quotes'];

/* ---------- Vocabulary ---------- */
export const VOC_PASS = 0.8;                                   // Bee's bar for unlocking a new set
export const vocSetSize = (band) => (band >= 3 ? 50 : band === 2 ? 20 : 10);   // Bee's set is 50; a 6-year-old meets 10
const okWord = (w) => /^[a-z][a-z' -]*$/.test(w);
const plainDef = (w, d) => !!d && d.trim().length > 3 && d.length <= 170 && !/\s[A-Z]/.test(d.slice(1)) && !/^\(/.test(d) && !d.toLowerCase().includes(w.slice(0, Math.max(4, w.length - 2)));
const entry = (w, d, p, o, y, ps, r, h) => ({ w, d: d.trim(), p: p || '', o: o || '', y: +y || 3, ps: ps || '', r: r || '', h: h || '' });

/* Bee's origin decks (coachCatalog's "Word Origins" group), by the origin Bee records. */
const ORIGIN_DECKS = [
  ['latin', 'Latin Legends', 'Words with roots from Latin', ['Latin']],
  ['greek', 'Greek Heroes', 'Words with roots from Greek', ['Greek']],
  ['french', 'French Flair', 'Loanwords from French', ['French', 'Old French', 'Anglo-Norman']],
  ['oe', 'Old English Originals', 'Anglo-Saxon roots', ['Old English']],
  ['norse', 'Viking Words', 'Old Norse roots', ['Norse', 'Old Norse']],
  ['hindi', 'Hindi & Sanskrit Treasures', 'Indian-language loanwords', ['Hindi', 'Sanskrit', 'Urdu', 'Tamil', 'Malayalam', 'Bengali', 'Gujarati', 'Marathi', 'Telugu', 'Kannada']],
  ['dutch', 'Dutch Treasures', 'Loanwords from Dutch', ['Dutch']],
  ['german', 'German Treasures', 'Loanwords from German', ['German']],
  ['italian', 'Italian Treasures', 'Loanwords from Italian', ['Italian']],
  ['spanish', 'Spanish Treasures', 'Loanwords from Spanish', ['Spanish']],
  ['arabic', 'Arabic Treasures', 'Loanwords from Arabic', ['Arabic']],
];
/* Bee's difficulty decks (Easy · Medium · Hard · Champ), on Bee's 1–9 scale. */
const LEVEL_DECKS = [['easy', 'Easy', 'Everyday words', 1, 1], ['medium', 'Medium', 'A step up', 2, 3], ['hard', 'Hard', 'Words a strong reader knows', 4, 6], ['champ', 'Champ', 'Real bee-final words', 7, 9]];
export const MIN_DECK = 12;                                    // Bee: below 8 a fair 4-option quiz cannot be built; English keeps 12

/* vocab: public/data/vocab.json ({ lists: { vocab26, nsf500 } }); lex: public/data/bee-words.json. */
export function vocDecks(vocab, lex) {
  const lists = vocab?.lists || {};
  const fromList = (id) => (lists[id] || []).map((r) => entry(...r)).filter((e) => okWord(e.w) && plainDef(e.w, e.d) && kidSafe(e.w, e.d));
  const lexWords = Object.entries(lex?.words || {}).map(([w, r]) => entry(w, r[0], r[1], r[4], r[3], r[2], r[5], r[6])).filter((e) => /^[a-z]+$/.test(e.w) && plainDef(e.w, e.d) && kidSafe(e.w, e.d));
  const order = (ws) => ws.slice().sort((a, b) => a.y - b.y || a.w.localeCompare(b.w));
  const D = [
    { id: 'vocab26', group: 'Bee’s lists', label: 'Meaning Masters', sub: 'Bee’s practice list for the junior vocabulary final', words: order(fromList('vocab26')) },
    { id: 'nsf500', group: 'Bee’s lists', label: 'The Mighty 500', sub: 'Bee’s high-probability finals words', words: order(fromList('nsf500')) },
    ...LEVEL_DECKS.map(([id, label, sub, lo, hi]) => ({ id, group: 'By level', label, sub, words: order(lexWords.filter((e) => e.y >= lo && e.y <= hi)) })),
  ];
  const all = new Map(); for (const d of D) for (const e of d.words) if (!all.has(e.w)) all.set(e.w, e);
  for (const [id, label, sub, os] of ORIGIN_DECKS) D.push({ id, group: 'By origin', label, sub, words: order([...all.values()].filter((e) => os.includes(e.o))) });
  return D.filter((d) => d.words.length >= MIN_DECK).map((d) => ({ ...d, n: d.words.length }));
}

export function vocProg(k) {
  const g = (k.games ||= {}); const v = (g.vocab ||= {});
  for (const f of ['lv', 'revise', 'seen', 'cur', 'carry', 'last', 'known', 'miss']) v[f] ||= {};
  return v;
}
/* Bee's vocBuildSet: carried-over misses first, then words this deck has not served, then repeats. */
export function vocBuildSet(v, deck, size) {
  const byW = new Map(deck.words.map((e) => [e.w, e]));
  const saved = (v.cur[deck.id] || []).map((w) => byW.get(w)).filter(Boolean);
  if (saved.length >= Math.min(5, size)) return saved;
  const carry = (v.carry[deck.id] || []).map((w) => byW.get(w)).filter(Boolean).slice(0, 10);
  const seen = new Set([...(v.seen[deck.id] || []), ...carry.map((e) => e.w)]);
  const want = size - carry.length;
  let picked = deck.words.filter((e) => !seen.has(e.w)).slice(0, want);
  if (picked.length < want) { const rest = deck.words.filter((e) => !picked.includes(e) && !carry.includes(e)); picked = picked.concat(shuffle(rng(`vset:${deck.id}:${v.lv[deck.id] || 0}`), rest).slice(0, want - picked.length)); }
  const set = carry.concat(picked);
  v.cur[deck.id] = set.map((e) => e.w); v.carry[deck.id] = [];
  v.seen[deck.id] = [...(v.seen[deck.id] || []), ...set.map((e) => e.w)].slice(-600);
  return set;
}
/* One meaning question per word: the right definition and three other real definitions from the same
   deck at a similar difficulty (Bee's vocBuildCheck), all distinct, the slot rotated by permute. */
export function vocItem(deck, e, i, tag = '') {
  const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, '').trim();
  const near = deck.words.filter((x) => x.w !== e.w && Math.abs(x.y - e.y) <= 1), src = near.length >= 8 ? near : deck.words.filter((x) => x.w !== e.w);
  const used = new Set([norm(e.d)]), wrong = [];
  for (const x of shuffle(rng(`vq:${deck.id}:${e.w}`), src)) { const n = norm(x.d); if (used.has(n) || x.d.toLowerCase().includes(e.w)) continue; used.add(n); wrong.push(x.d); if (wrong.length === 3) break; }
  const { options, answer } = permute(`voc:${deck.id}${tag}:${i}`, [e.d, ...wrong]);
  return { id: `voc:${deck.id}:${e.w}`, word: e.w, entry: e, options, answer };
}
export const vocCheck = (deck, words, tag = '') => words.map((e, i) => vocItem(deck, e, i, tag));
/* Bee's vocFinishCheck: pass → level up, a few misses carried into the next set; fail → revise first. */
export function vocFinish(v, deckId, mode, right, total, missed) {
  const pct = total ? right / total : 0, out = { pct, passed: false };
  if (mode === 'revise') { const still = new Set(missed); v.revise[deckId] = (v.revise[deckId] || []).filter((w) => still.has(w)); out.remaining = v.revise[deckId].length; return out; }
  v.last[deckId] = { right, total, at: Date.now() };
  if (pct >= VOC_PASS) { v.lv[deckId] = (v.lv[deckId] || 0) + 1; v.revise[deckId] = []; v.carry[deckId] = missed.slice(0, 10); v.cur[deckId] = []; out.passed = true; }
  else v.revise[deckId] = missed.slice();
  return out;
}

/* ---------- Idioms & Similes ---------- */
/* Bee's FIG_OC, said as Bee's confidence in the story — never as English's verdict (a reviewer has not read them). */
export const OC = {
  documented: { label: 'Documented', say: 'Bee’s list calls this origin documented' },
  disputed: { label: 'Disputed', say: 'Bee’s list calls this origin a best guess' },
  folk: { label: 'Folk tale', say: 'Bee’s list says the famous story is a myth' },
};
export const ORIGIN_NOTE = 'Origin story from Bizzing Bee’s list — awaiting a named reviewer';
export const IDIOMS_NEED_REVIEW = true;
const THEMED = [['animals', 'Animal idioms'], ['body', 'Body idioms'], ['cuisine', 'Food & kitchen'], ['emotions', 'Feelings'], ['sports', 'Games & sport'], ['weather', 'Weather & sky'], ['economics', 'Money & trade'], ['war', 'Battle words'], ['seafaring', 'Sea & sailing'], ['music', 'Music & stage'], ['linguistics', 'Words about words']];
const DIFF = { easy: 0, medium: 1, hard: 2 };
export function figDecks(P) {
  const D = [];
  for (const [th, label] of THEMED) { const n = P.filter((x) => x.t === 'idiom' && (x.th || []).includes(th)).length; if (n >= 12) D.push({ id: 'th:' + th, label }); }
  const regions = [...new Set(P.filter((x) => x.lit && x.region).map((x) => x.region))].map((r) => [r, P.filter((x) => x.lit && x.region === r).length]).filter((x) => x[1] >= 12).sort((a, b) => b[1] - a[1]);
  for (const [r] of regions.slice(0, 8)) D.push({ id: 'rg:' + r, label: 'From ' + r });
  D.push({ id: 'world', label: 'Around the world (mixed)' }, { id: 'proverbs', label: 'Proverbs' }, { id: 'sim:asas', label: 'Similes — as … as' }, { id: 'sim:like', label: 'Similes — like a …' }, { id: 'folk', label: 'Busted! Famous myth origins' });
  return D.map((d) => ({ ...d, items: figDeckItems(P, d.id) })).filter((d) => d.items.length >= 8);
}
export function figDeckItems(P, id) {
  let items = [];
  if (id.startsWith('th:')) items = P.filter((x) => x.t === 'idiom' && (x.th || []).includes(id.slice(3)));
  else if (id.startsWith('rg:')) items = P.filter((x) => x.lit && x.region === id.slice(3));
  else if (id === 'world') items = P.filter((x) => x.lit);
  else if (id === 'proverbs') items = P.filter((x) => x.t === 'proverb');
  else if (id === 'sim:asas') items = P.filter((x) => x.t === 'simile' && x.pattern === 'as-as');
  else if (id === 'sim:like') items = P.filter((x) => x.t === 'simile' && x.pattern === 'like');
  else if (id === 'folk') items = P.filter((x) => x.oc === 'folk');
  return items.slice().sort((a, b) => (DIFF[a.diff] ?? 1) - (DIFF[b.diff] ?? 1) || a.p.localeCompare(b.p)).slice(0, 30);
}
export function figFilter(P, { q = '', type = 'all', theme = 'all' } = {}) {
  const s = q.trim().toLowerCase();
  return P.filter((x) => (type === 'all' || x.t === type) && (theme === 'all' || (x.th || []).includes(theme)) && (!s || x.p.toLowerCase().includes(s) || x.m.toLowerCase().includes(s)));
}
export const figThemes = (P) => [...new Set(P.flatMap((x) => x.th || []))].sort();
/* A meaning question: "What does ‘break the ice’ mean?" — the right meaning and three other meanings of the
   same kind (idiom, proverb, simile) at the same difficulty, distinct, none of them containing the phrase. */
export function idiomItem(P, x, i, seed = '') {
  const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, '').trim();
  const same = P.filter((y) => y !== x && y.t === x.t && y.diff === x.diff), src = same.length >= 8 ? same : P.filter((y) => y !== x && y.t === x.t);
  const used = new Set([norm(x.m)]), wrong = [];
  for (const y of shuffle(rng(`iq:${x.p}`), src)) { const n = norm(y.m); if (used.has(n) || n.includes(norm(x.p))) continue; used.add(n); wrong.push(y.m); if (wrong.length === 3) break; }
  const { options, answer } = permute(`idiom${seed}:${i}`, [x.m, ...wrong]);
  return { id: `idiom:${x.p}`, phrase: x.p, item: x, options, answer };
}
export function idiomRound(P, seed, n = 10, pool = P) {
  const pick = shuffle(rng(`iround:${seed}`), pool.filter((x) => !norm2(x.m).includes(norm2(x.p)))).slice(0, n);
  return pick.map((x, i) => idiomItem(P, x, i, `:${seed}`));
}
const norm2 = (s) => s.toLowerCase().replace(/[^a-z ]/g, '').trim();
/* Sayings that come from a story the Library tells: a pattern on the phrase or Bee's origin story → a passage. */
/* Sayings that come from a story the Library tells: [pattern on the phrase, pattern on Bee's origin story
   (case-sensitive, so a figure's NAME is meant — "an echo of old tales" is not the nymph), passage]. */
export const STORY_LINKS = [
  [/\bmidas\b/i, /\bMidas\b/, 'wonderbook-midas'], [/\bpandora/i, /\bPandora\b/, 'wonderbook-pandora'], [/\bhercul/i, /\bHercules\b|\bAtlas\b/, 'wonderbook-atlas'],
  [/\blabyrinth|\btheseus|\bariadne|\bminotaur/i, /\bTheseus\b|\bAriadne\b|\bMinotaur\b/, 'tanglewood-labyrinth'], [/^$/, /\bthe nymph Echo\b|\bEcho, the nymph\b/, 'bulfinch-echo'], [/\bnarciss/i, /\bNarcissus\b/, 'bulfinch-narcissus'],
  [/\barachne/i, /\bArachne\b/, 'bulfinch-arachne'], [/\bicarus|\bdaedalus/i, /\bIcarus\b|\bDaedalus\b/, 'bulfinch-icarus'], [/^$/, /\bthe god Pan\b|\bPan, the\b/, 'bulfinch-pan'], [/\bsiren/i, /\bSirens?\b/, 'bulfinch-sirens'],
  [/\btantal/i, /\bTantalus\b/, 'bulfinch-tantalus'], [/\bpegasus|\bchimaera|\bchimera/i, /\bPegasus\b|\bChimaera\b/, 'bulfinch-pegasus'], [/\bperseus|\bmedusa|\bgorgon/i, /\bPerseus\b|\bMedusa\b/, 'heroes-perseus'],
  [/\bhare\b.*\btortoise|\btortoise\b.*\bhare\b|slow and steady|slow as a tortoise/i, /tortoise-and-hare|\bthe [Tt]ortoise and the [Hh]are\b/, 'aesop-hare-tortoise'], [/\blion\b.*\bmouse\b/i, /\bthe [Ll]ion and the [Mm]ouse\b/, 'aesop-lion-mouse'], [/\btown mouse|\bcountry mouse/i, /\b[Tt]own [Mm]ouse\b/, 'aesop-town-mouse'],
];
export function idiomStory(x, passageIds) {
  for (const [onP, onStory, id] of STORY_LINKS) if ((onP.test(x.p) || onStory.test(x.os || '')) && passageIds.has(id)) return id;
  return null;
}

/* ---------- Typing Trainer (Bee's lessons, word for word) ---------- */
export const TY_LESSONS = [
  { id: 'home1', name: 'F & J — the bumps', seq: 'fj fj jf fjf jfj ff jj fjfj jfjf fj', tip: 'Rest your index fingers on F and J — feel the little bumps? Never look down!' },
  { id: 'home2', name: 'D & K', seq: 'dk dk kd dkd kdk fd jk dfk jkd dkfj', tip: 'Middle fingers on D and K. Index fingers stay home on F and J.' },
  { id: 'home3', name: 'S & L', seq: 'sl sl ls sls lsl sd lk sdf lkj sldk', tip: 'Ring fingers on S and L — they are the wobbliest, be patient with them.' },
  { id: 'home4', name: 'A & ;', seq: 'a; a; ;a a;a ;a; as ;l asdf jkl; aa;;', tip: 'Pinkies on A and semicolon. The whole home row is yours now!' },
  { id: 'home5', name: 'Home-row words', seq: 'dad sad lad ask all fall lass salad flask', tip: 'Real words, home keys only. Keep your eyes on the screen.' },
  { id: 'top1', name: 'E & I', seq: 'ed ik de ki die lie side like idea slide', tip: 'Reach up with your middle fingers, then come straight home.' },
  { id: 'top2', name: 'R & U', seq: 'rf uj fur run rude sure lure user rule', tip: 'Index fingers reach up for R and U.' },
  { id: 'top3', name: 'W O T Y Q P', seq: 'wow top yet toy quote power query type', tip: 'The rest of the top row — pinkies get Q and P.' },
  { id: 'bot1', name: 'V N C M', seq: 'vn cm van can move nice mind cave once', tip: 'Index and middle fingers dip down. Thumbs stay on the space bar.' },
  { id: 'bot2', name: 'X Z and , .', seq: 'zax mix, zoom. exact, prize. dozen fizz.', tip: 'Pinkies and ring fingers dive for the corners.' },
  { id: 'caps', name: 'Capitals with Shift', seq: 'Fox Jam Kid Sun The Bee Wins Big Now', tip: 'Hold Shift with the OPPOSITE pinky, then tap the letter.' },
  { id: 'words', name: 'Common words', seq: 'the and you that was for are with they have this from', tip: 'The twelve most common words — type them until they flow.' },
  { id: 'bee', name: 'Bee words at your level', dyn: 'bee', tip: 'Words from Bizzing Bee’s list at your level — type them fast AND right.' },
  { id: 'sent', name: 'Sentences from the classics', dyn: 'sent', tip: 'Real sentences from the books in the Library — capitals, commas, full stops.' },
  { id: 'mean', name: 'Type the meaning', dyn: 'mean', tip: 'A word and its meaning — typing and vocabulary in one drill.' },
];
export const TY_FINGER = { q: 'p', a: 'p', z: 'p', w: 'r', s: 'r', x: 'r', e: 'm', d: 'm', c: 'm', r: 'i', f: 'i', v: 'i', t: 'i', g: 'i', b: 'i', y: 'I', h: 'I', n: 'I', u: 'I', j: 'I', m: 'I', i: 'M', k: 'M', ',': 'M', o: 'R', l: 'R', '.': 'R', p: 'P', ';': 'P' };
export const TY_FCOLOR = { p: '#E8458C', r: '#F0A82A', m: '#13A892', i: '#3D7DF0', I: '#7B52E0', M: '#13A892', R: '#F0A82A', P: '#E8458C' };
export const TY_ROWS = ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,.'];
export const TEST_SECS = 60;
export const tyClean = (t) => String(t || '').replace(/[‘’]/g, "'").replace(/[“”"]/g, '').replace(/[^a-zA-Z ,.;']/g, ' ').replace(/\s+/g, ' ').trim();
/* the words a drill may use: Bee's lexicon at the child's band, plain letters, nine or fewer */
const BAND_Y = { 1: [1, 1], 2: [1, 2], 3: [2, 4] };
export function tyWords(lex, band) { const [lo, hi] = BAND_Y[band] || BAND_Y[2]; return Object.entries(lex?.words || {}).filter(([w, r]) => /^[a-z]+$/.test(w) && w.length <= 9 && r[3] >= lo && r[3] <= hi && kidSafe(w, r[0])).map(([w, r]) => ({ w, d: r[0] })); }
/* Bee's tySeqFor, with English's held sentences for the sentence drill. */
export function tySeqFor(l, { lex, band = 2, sentences = [], seed = 'x' } = {}) {
  if (!l.dyn) return l.seq;
  const r = rng(`ty:${l.id}:${seed}`);
  if (l.dyn === 'sent') { const picked = shuffle(r, sentences.map(tyClean).filter((x) => x.length >= 25 && x.length <= 130 && lineSafe(x))).slice(0, 2); if (picked.length) return picked.join(' '); }
  const ws = tyWords(lex, band);
  if (l.dyn === 'mean') { const picked = shuffle(r, ws.filter((w) => w.d.length >= 20 && w.d.length <= 110 && plainDef(w.w, w.d))).slice(0, 2).map((w) => tyClean(w.w + ', ' + w.d)); if (picked.length) return picked.join('. ') + '.'; }
  return shuffle(r, ws).slice(0, 8).map((w) => w.w).join(' ') || 'bee hive honey spell word queen';
}
export function tyTestSeq(lex, band, seed) { return shuffle(rng(`tytest:${seed}`), tyWords(lex, band).filter((w) => w.w.length <= 10)).slice(0, 90).map((w) => w.w).join(' ') || 'the quick brown fox jumps over the lazy dog'; }
/* Bee's tyFinish maths: a word is five keystrokes; only correct keystrokes count towards speed. */
export function typingScore({ typed, errors, ms }) {
  const mins = Math.max(0.05, ms / 60000), correct = Math.max(0, typed - errors);
  return { wpm: Math.max(0, Math.round(correct / 5 / mins)), acc: typed ? Math.round((correct / typed) * 100) : 0 };
}
export function tyStats(k) { const g = (k.games ||= {}); const t = (g.typing ||= { bestWpm: 0, bestAcc: 0, tests: 0, lessons: {}, paid: {} }); t.lessons ||= {}; t.paid ||= {}; return t; }

/* ---------- Quotes & Poems: English's held lines only ---------- */
export const showLine = (s) => s.replace(/--/g, '—').replace(/_([^_]+)_/g, '$1');   // the text's own dashes and italics, for the eye only
export function quoteShelf(lines, works) {
  const byId = new Map(works.map((w) => [w.id, w])), by = new Map();
  for (const l of lines) { const w = byId.get(l.work); if (!w) continue; const a = w.author; if (!by.has(a)) by.set(a, []); by.get(a).push({ ...l, title: w.title, author: a }); }
  return [...by.entries()].map(([author, ls]) => ({ author, key: authorKey(author), lines: ls })).sort((a, b) => b.lines.length - a.lines.length || a.author.localeCompare(b.author));
}
export const authorKey = (a) => a.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

/* Bee's quotations (src/data/bee-quotes.json, tools/import-bee-tools.mjs): shown in Quotes & Poems exactly as Bee
   has them, with Bee's attribution — never in LINES, the lines of the hour, the feed or a question (CLAUDE.md rule 2). */
export const QUOTE_CATS = { courage: 'Courage', kindness: 'Kindness', perseverance: 'Never give up', learning: 'Learning', dreams: 'Dreams', friendship: 'Friendship', honesty: 'Honesty',
  curiosity: 'Curiosity', teamwork: 'Teamwork', imagination: 'Imagination', gratitude: 'Gratitude', leadership: 'Leadership', happiness: 'Happiness', hardwork: 'Hard work', believe: 'Believe in yourself',
  creativity: 'Creativity', nature: 'Nature', change: 'Making a difference', wisdom: 'Wisdom', humor: 'Fun & humour', science: 'Science', sports: 'Sports', reading: 'Reading & words', poetry: 'Poetry' };
export function quoteFilter(Q, { cat = 'all', q = '' } = {}) {
  const s = q.trim().toLowerCase();
  return Q.filter((x) => (cat === 'all' || x.c === cat) && (!s || x.q.toLowerCase().includes(s) || x.a.toLowerCase().includes(s)));
}
