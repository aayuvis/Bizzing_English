/* model.mjs — the household, the gates, mastery's later-day rule, one nextStep, no streaks. */
import { T, tally } from './_mem.mjs';
import { newHousehold, newKid, addKid, levelDone, strandOpen, levelOpen, goodDays, bumpDay, they } from '../src/model.js';
import { taught, spacedCheck, due, stepOf } from '../src/mastery.js';
import { nextStep } from '../src/next.js';
import { migrate, VERSION } from '../src/store.js';
import { makeBackup, restoreBackup, KID_FIELDS } from '../src/backup.js';
import { award } from '../src/medals.js';
const { ok, done } = tally('model');
const D = 864e5;

const h = newHousehold(), a = addKid(h, newKid('Asha', 1, 'tortoise')), b = addKid(h, newKid('Kabir', 3, 'hare'));
a.stops['w1-rhyme'] = { passed: true }; a.bank.cat = { at: T }; a.coins = 5;
ok('a second child inherits nothing', Object.keys(b.stops).length === 0 && Object.keys(b.bank).length === 0 && b.avatar === 'hare');
ok('a child is first name, band and avatar only — no birthdate, surname, school, photo, location', !['birthdate', 'surname', 'school', 'photo', 'location', 'email'].some((f) => f in a));
ok('the report is pronoun-neutral', they(a) === 'Asha' && they(null) === 'they');

/* gates */
const c = newKid('Mira', 1, 'tortoise');
ok('Word is open to everyone', strandOpen(c, 'word'));
ok('Writing waits for Sentence level 1 (band 1)', !strandOpen(c, 'writing'));
for (const id of ['s1-noun', 's1-verb', 's1-adj']) c.stops[id] = { passed: true };
ok('…and opens after it', levelDone(c, 'sentence', 1) && strandOpen(c, 'writing'));
ok('levels open in order', levelOpen(c, 'word', 1) && !levelOpen(c, 'word', 2));
ok('an 11–14 starts at level 3, not rhymes', levelOpen(newKid('Zed', 3, 'x'), 'word', 3));

/* mastery: learned only on a LATER day; a miss drops one step */
const m = newKid('Lo', 2, 'x');
taught(m, 'w1-rhyme', T);
ok('a same-day check is practice, not learning', spacedCheck(m, 'w1-rhyme', 10, 10, T + 1000) === 'practice' && stepOf(m, 'w1-rhyme') === 1);
ok('the next day it is due', due(m, T + D).includes('w1-rhyme') && !due(m, T).includes('w1-rhyme'));
ok('a later-day check of 8/10 makes it learned', spacedCheck(m, 'w1-rhyme', 8, 10, T + D) === 'learned' && stepOf(m, 'w1-rhyme') === 2);
ok('mastered needs another week', spacedCheck(m, 'w1-rhyme', 9, 10, T + 3 * D) === 'held' && spacedCheck(m, 'w1-rhyme', 9, 10, T + 8 * D) === 'mastered');
ok('a slip drops ONE step and is recorded', spacedCheck(m, 'w1-rhyme', 3, 10, T + 9 * D) === 'lapse' && stepOf(m, 'w1-rhyme') === 2 && m.mastery['w1-rhyme'].lapses === 1);
const z = newKid('Zo', 2, 'x'); taught(z, 'x', T); spacedCheck(z, 'x', 1, 10, T + D);
ok('a slip never resets to zero', stepOf(z, 'x') === 1);

/* nextStep: one door; an abandoned lesson comes back */
const hh = newHousehold(), k = addKid(hh, newKid('Ria', 1, 'tortoise'));
const first = nextStep(hh, k);
ok('a new child starts on a Word or Sentence stop', first.kind === 'stop' && /^(word|sentence)$/.test(first.stop.strand));
k.stops['w1-odd'] = { passed: false, step: 2, at: T };
ok('an unfinished stop comes back first', nextStep(hh, k).stop?.id === 'w1-odd' && nextStep(hh, k).resume);
ok('the free plan never offers a family-plan strand', !['reading', 'writing', 'speaking', 'literature', 'language'].includes(nextStep(hh, newKid('Q', 3, 'x')).stop?.strand));

/* no streaks: good days in a window; missing a day costs nothing */
const g = newKid('G', 2, 'x');
for (const d of [0, 1, 3, 4, 6]) bumpDay(g, 'right', 5, T - d * D);
ok('good days are counted in a window, not a run', goodDays(g, 7, T) === 5);
ok('medals come from evidence and are recorded once', (() => { const e = newKid('E', 2, 'x'); e.stops['w1-rhyme'] = { passed: true }; const f1 = award(e, T).map((x) => x.id); const f2 = award(e, T); return f1.includes('first-stop') && f2.length === 0; })());

/* judged objectives (writing, speaking): never due for a machine check; a grown-up on a later day */
import { judge } from '../src/mastery.js';
const j = newKid('J', 2, 'x'); taught(j, 'wr4-para', T, { judged: true });
ok('a judged objective is never due for a machine check', !due(j, T + 3 * D).includes('wr4-para'));
ok('a grown-up judging on the same day is practice', judge(j, 'wr4-para', 4, T + 1000) === 'practice' && stepOf(j, 'wr4-para') === 1);
ok('a 3 from a grown-up on a later day makes it learned', judge(j, 'wr4-para', 3, T + D) === 'learned');
/* store v1 → v2: free writing leaves the reading record (which backups carry) for k.writing (which they never do) */
const old = { v: 1, parent: { plan: 'free' }, kids: [{ id: 'a', name: 'Old', band: 2, avatar: 'x', reading: { p1: { heard: true, thoughts: 'my secret thoughts' } } }], active: 'a' };
const m2 = migrate(JSON.parse(JSON.stringify(old)));
ok('v1 households migrate to v2', m2.v === 2 && m2.kids[0].writing.talk.p1 === 'my secret thoughts' && !('thoughts' in m2.kids[0].reading.p1));
const wk = addKid(newHousehold(), newKid('W', 2, 'x')); wk.writing = { 'wr4-para': [{ parts: ['My private paragraph.'] }], talk: { p1: 'private' } };
const hw = newHousehold(); hw.kids.push(wk);
ok('a backup never carries free writing', !JSON.stringify(makeBackup(hw)).includes('private'));
/* store and backup */
ok('the store migrates the current version unchanged', migrate({ v: VERSION, kids: [] })?.v === VERSION);
const bk = makeBackup(h);
ok('a backup never holds a name', !JSON.stringify(bk).includes('Asha') && bk.kids.every((x) => !('name' in x)));
ok('a backup is an allow-list: an unknown field is left out', !('coins' in bk.kids[0]) && Object.keys(bk.kids[0]).every((f) => KID_FIELDS.includes(f)));
const h2 = newHousehold(); restoreBackup(h2, bk, ['Asha', 'Kabir']);
ok('restore asks for the names and brings the progress back', h2.kids[0].name === 'Asha' && h2.kids[0].stops['w1-rhyme']?.passed);
done();
