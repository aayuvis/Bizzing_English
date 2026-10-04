/* placement.mjs — "Find my starting place" (src/placement.js): its questions are fair (one right answer, not
   in the text, options distinct and never two that could both be right, no favourite slot), its scoring maps
   answers to levels sensibly, headStart honours the place, and placement never passes a stop, pays a coin or
   touches mastery. The checker itself is shown to catch a planted bad item before it is trusted. */
import { readFileSync } from 'node:fs';
import { T, tally } from './_mem.mjs';
import { keys, make, check, _test } from '../src/items.js';
import { wordItems, wordOver, scoreWord, scoreReading, readingPart, passageLevelFor, applyPlace, passageOk, levelOf, floorOf, PASSAGE_FOR, TIERS, WORD_N, READ_N } from '../src/placement.js';
import { newHousehold, newKid, addKid, levelOpen, headStart, bandStart } from '../src/model.js';
import { nextStep } from '../src/next.js';
import { feedPlace } from '../src/feed.js';
import { passage } from '../src/reading.js';
import { migrate, VERSION } from '../src/store.js';
import { makeBackup, KID_FIELDS } from '../src/backup.js';
import { kidSafe } from '../src/safe.js';
const { ok, done } = tally('placement');

const lex = JSON.parse(readFileSync(new URL('../public/data/bee-words.json', import.meta.url)));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const inText = (needle, hay) => new RegExp(`(^| )${norm(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(norm(hay));
const { sameSense } = _test;

/* the fairness checker, one item → a list of faults */
function faults(it, { passage: isPassage = false } = {}) {
  const f = [];
  if (it.type !== 'mc' || it.options.length !== 4) f.push('not a four-option question');
  if (new Set(it.options.map(norm)).size !== it.options.length) f.push(`options repeat: ${it.options.join(' | ')}`);
  if (!check(it, it.answer) || it.options.some((_, i) => i !== it.answer && check(it, i))) f.push('not exactly one right option');
  const right = it.options[it.answer];
  if (!isPassage && (inText(right, it.prompt) || inText(right, it.sub || ''))) f.push(`the answer "${right}" is in the question`);
  if (/Meaning$/.test(it.kind)) it.options.forEach((o, i) => { if (i !== it.answer && sameSense(o, right)) f.push(`"${o}" could also be right beside "${right}"`); });
  return f;
}

/* 0. the checker catches what it should (proved by breaking: a planted bad item must fail) */
const good = make('suffixMeaning', 'ful:0', { band: 3, lex });
ok('the checker passes a fair item', faults(good).length === 0);
ok('…and catches repeated options', faults({ ...good, options: [good.options[0], ...good.options.slice(0, 3)] }).length > 0);
ok('…and catches an answer in the question', faults({ ...good, prompt: `${good.prompt} (${good.options[good.answer]})` }).length > 0);
ok('…and catches two options that could both be right ("full of" beside "full of; like")', faults({ ...good, options: good.options.map((o, i) => (i === good.answer ? 'full of' : i === (good.answer + 1) % 4 ? 'full of; like' : o)) }).length > 0);

/* 1. every placement question, for many children and retakes */
const slots = [0, 0, 0, 0]; let items = 0, firstFault = '';
for (let s = 0; s < 300; s++) {
  const its = wordItems(lex, `kid${s}:${s % 3 ? T + s : 0}`);
  if (its.length !== WORD_N) { firstFault ||= `seed ${s}: ${its.length} word questions`; continue; }
  if (its.some((it, i) => it.tier !== Math.floor(i / 2) || it.kind !== TIERS[it.tier].kind)) firstFault ||= `seed ${s}: tiers out of order`;
  if (new Set(its.map((it) => norm(it.options[it.answer]))).size !== its.length) firstFault ||= `seed ${s}: two questions share an answer`;
  for (const it of its) {
    items++; slots[it.answer]++;
    const f = faults(it); if (f.length) firstFault ||= `${it.id}: ${f[0]}`;
    if (it.kind === 'word2def') { const w = it.id.split(':')[1]; if (!kidSafe(w, lex.words[w][0])) firstFault ||= `${it.id}: not kidSafe`; }
  }
}
ok(`every placement word question is fair (${items} drawn)${firstFault ? ' — ' + firstFault : ''}`, !firstFault);
ok(`no favourite answer slot across placement questions (${slots.join('/')})`, slots.every((n) => n > items * 0.15 && n < items * 0.35));
ok('the same child on the same try gets the same questions', JSON.stringify(wordItems(lex, 'a:0')) === JSON.stringify(wordItems(lex, 'a:0')));
ok('a retake draws different questions', JSON.stringify(wordItems(lex, 'a:0')) !== JSON.stringify(wordItems(lex, 'a:1')));

/* every prefix, suffix and root meaning item in the engine: no wrong option that could also be right */
let senseBad = '';
for (const kind of ['prefixMeaning', 'suffixMeaning', 'rootMeaning']) for (const band of [1, 3]) for (const k of keys(kind, { band, lex })) { const f = faults(make(kind, k, { band, lex })); if (f.length) senseBad ||= `${kind}:${k}: ${f[0]}`; }
ok(`no prefix, suffix or root question offers two meanings that could both be right${senseBad ? ' — ' + senseBad : ''}`, !senseBad);

/* 2. the passage part */
for (const [L, id] of Object.entries(PASSAGE_FOR)) {
  const p = passage(id);
  ok(`the level-${L} passage ${id} is held in all three markets, not awaiting review, with ${READ_N}+ questions`, passageOk(p));
  ok(`…and is on Reading level ${L}`, p && levelOf(p) === +L);
}
for (let ws = 1; ws <= 5; ws++) {
  const r = readingPart(ws);
  ok(`word start ${ws} → a level-${r.level} passage with ${READ_N} fair questions`, r.level === passageLevelFor(ws) && r.items.length === READ_N && r.items.every((it) => faults(it, { passage: true }).length === 0) && new Set(r.items.map((x) => x.id)).size === READ_N);
}
ok('the passage climbs with the word start', passageLevelFor(1) <= passageLevelFor(3) && passageLevelFor(3) <= passageLevelFor(5) && passageLevelFor(1) < passageLevelFor(5));

/* 3. scoring */
const A = (s) => [...s].map((c) => c === '1');
ok('all eight right → Word 5', scoreWord(A('11111111'), 1) === 5);
ok('nothing right (stopped after two) → Word 1 for a six-year-old', scoreWord(A('00'), 1) === 1);
ok('tier 1 cleared, then two misses → Word 2', scoreWord(A('1100'), 1) === 2);
ok('tiers 1–3 cleared, tier 4 missed → Word 4', scoreWord(A('11111101'), 2) === 4);
ok('a slip inside a tier stops the climb there (1 right of tier 2 → Word 2)', scoreWord(A('110111'), 1) === 2);
ok('an 11–14 who stumbles still starts one below the band, never on rhymes', scoreWord(A('00'), 3) === 2 && floorOf(3) === bandStart({ band: 3 }) - 1);
let mono = true;
for (let m = 0; m < 256; m++) { const a = A(m.toString(2).padStart(8, '0')); for (let i = 0; i < 8; i++) if (!a[i]) { const b = a.slice(); b[i] = true; if (scoreWord(b, 1) < scoreWord(a, 1)) mono = false; } }
ok('getting one more right never lowers the word start', mono);
ok('two misses in a row end the word part early; one does not', wordOver(A('100')) && !wordOver(A('0101')) && wordOver(A('11111111')) && !wordOver(A('1111111')));
ok('reading: three right → one above the passage', scoreReading(3, 2, 1) === 3);
ok('reading: two right → the passage\'s level', scoreReading(2, 2, 1) === 2);
ok('reading: fewer → one below, held to the floor', scoreReading(0, 2, 1) === 1 && scoreReading(0, 1, 1) === 1 && scoreReading(0, 1, 3) === 2);
ok('reading is capped at 5', scoreReading(3, 3, 3) === 4 && scoreReading(3, 5, 3) === 5);

/* 4. headStart honours the place, per strand */
const k1 = newKid('Ira', 1, 'x');
ok('with no place, the band gives the start', headStart(k1, 'word') === 1 && headStart(k1, 'reading') === 1 && !levelOpen(k1, 'word', 2));
k1.place = { word: 4, reading: 2, at: T };
ok('a place opens its strand up to that level', levelOpen(k1, 'word', 4) && !levelOpen(k1, 'word', 5) && levelOpen(k1, 'reading', 2) && !levelOpen(k1, 'reading', 3));
ok('a strand with no place keeps the band start', headStart(k1, 'sentence') === 1 && !levelOpen(k1, 'sentence', 2));
ok('a place is held to 1–5', headStart({ band: 1, place: { word: 9 } }, 'word') === 5 && headStart({ band: 3, place: { word: 0 } }, 'word') === 1);
const h = newHousehold(); addKid(h, k1);
const nx = nextStep(h, k1);
ok(`Continue goes to the placed level (${nx.stop?.id})`, nx.kind === 'stop' && nx.stop.strand === 'word' && nx.stop.level === 4);
ok('the feed reads the placed level', feedPlace(h, k1).level === 4);
const k0 = addKid(newHousehold(), newKid('Bo', 2, 'x'));
ok('an unplaced child\'s first stop is unchanged (band start, Word 2)', nextStep({ parent: { plan: 'free' }, kids: [k0], active: k0.id }, k0).stop?.level === 2);

/* 5. placement never passes a stop, pays, counts or touches mastery */
const k2 = newKid('Noor', 2, 'x'), before = JSON.stringify({ ...k2, place: undefined });
const wallet0 = localStorage.getItem('bizzing.wallet'), act0 = localStorage.getItem('bizzing.activity');
const its = wordItems(lex, k2.id + ':0'), ans = its.map((it) => check(it, it.answer));
const ws = scoreWord(ans, k2.band), rp = readingPart(ws);
const place = applyPlace(k2, { word: ws, reading: scoreReading(rp.items.filter((it) => check(it, it.answer)).length, rp.level, k2.band) }, { first: true, now: T });
ok('a perfect check places Word 5 and Reading 4', place.word === 5 && place.reading === 4 && place.at === T);
ok('placement marks no stop passed and changes nothing but k.place', JSON.stringify({ ...k2, place: undefined }) === before && Object.keys(k2.stops).length === 0);
ok('placement touches no mastery, mistakes or days', Object.keys(k2.mastery).length === 0 && k2.misses.length === 0 && Object.keys(k2.days).length === 0);
ok('placement pays nothing and writes no family key', localStorage.getItem('bizzing.wallet') === wallet0 && localStorage.getItem('bizzing.activity') === act0);

/* 6. taken again, it only moves forward */
const k3 = newKid('Sam', 2, 'x'); k3.place = { word: 4, reading: 3, at: T };
applyPlace(k3, { word: 2, reading: 5 });
ok('a retake never lowers a start, and can raise one', k3.place.word === 4 && k3.place.reading === 5);
const k4 = newKid('Ana', 3, 'x'); applyPlace(k4, { word: 2, reading: 2 });
ok('a retake for a child who skipped never drops below the band start', k4.place.word === 3 && k4.place.reading === 3);
const k5 = newKid('Lee', 3, 'x'); applyPlace(k5, { word: 2, reading: 2 }, { first: true });
ok('straight after the welcome, the start is what the check showed', k5.place.word === 2);

/* 7. the store and the backup */
const old = migrate({ v: 2, parent: { plan: 'free' }, kids: [{ id: 'a', stops: {}, reading: {}, writing: {} }] });
ok('store v2 → v3 gives every child an empty place', VERSION === 3 && old.v === 3 && old.kids[0].place === null);
ok('a backup carries the place (progress, not a name)', KID_FIELDS.includes('place') && makeBackup({ v: 3, parent: {}, kids: [k3] }).kids[0].place.word === 4);
ok('a new child has no place until the check is taken', newKid('Z', 2, 'x').place === null);

done();
