/* coach.mjs — the Coach and Bee's daily goal (src/coach.js, src/data/coach-rules.js, src/practice-time.js):
   every item kind, every stop, every game's and tool's misses sort into exactly one trap; every trap has a whole
   rule whose practise stops exist; an example that quotes is an exact substring of a held line and its text;
   Quill's read names the top trap from planted misses; practice seconds count only inside practice, only while
   visible and active; the rings' percentages and second lap; targets per child; a second child inherits
   nothing; the store's v7 step and the backup allow-list. */
import { T, tally } from './_mem.mjs';
import { readFileSync } from 'node:fs';
import { TRAPS, TRAP_IDS, KIND_TRAP, STOP_TRAP, GAME_TRAP, UNMARKED, HABITS, TARGET_DEFAULTS } from '../src/data/coach-rules.js';
import { trapOfStop, trapOfItem, trapOfMiss, trapOfSlip, recordSlips, missTraps, topTrap, coachRead, targets, todayMetrics, appMinutes, metricDays, ringsSVG, allClosed, fmtMins, TARGET_MAX, WINDOW } from '../src/coach.js';
import { practising, tickPractice, IDLE } from '../src/practice-time.js';
import { KINDS } from '../src/items.js';
import { AUTHORED_STOPS } from '../src/authored.js';
import { allStops, stopById } from '../src/curriculum.js';
import { readingStops, bookStops, shippedLines } from '../src/reading.js';
import { WORKS } from '../src/data/library.js';
import { cleared } from '../src/data/rights.js';
import { GAMES } from '../src/games.js';
import { newHousehold, newKid, addKid, today } from '../src/model.js';
import { migrate, VERSION } from '../src/store.js';
import { makeBackup, KID_FIELDS } from '../src/backup.js';
import { readText } from '../../tools/texts/levels.mjs';
const { ok, done } = tally('coach');
const D = 864e5, src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

/* ---------- 1. every item kind, every stop → exactly one trap ---------- */
for (const kind of KINDS) if (kind !== 'authored') ok(`item kind ${kind} sorts into a trap`, TRAPS[KIND_TRAP[kind]]);
/* every item id prefix items.js makes (generated, a passage's own questions, a story's exercises) */
const prefixes = new Set([...src('../src/items.js').matchAll(/(?:mc\(\s*[`']|id:\s*[`'])([A-Za-z0-9]+):/g)].map((m) => m[1]));
ok(`items.js makes item ids (${prefixes.size} prefixes found)`, prefixes.size >= 20 && ['storyword', 'storycomma', 'storyorder', 'storycopy', 'passage'].every((p) => prefixes.has(p)));
for (const p of prefixes) ok(`item id prefix ${p} sorts into a trap`, p === 'au' || TRAPS[trapOfItem(`${p}:x:0`)]);
for (const s of AUTHORED_STOPS.filter((x) => stopById(x.id))) ok(`a written question of ${s.id} sorts into its stop's trap`, TRAPS[trapOfItem(`au:${s.id}:0`)] && trapOfItem(`au:${s.id}:0`) === trapOfStop(s.id));
const stops = allStops();
for (const s of stops) {
  const t = trapOfStop(s.id);
  if (UNMARKED.includes(s.kind)) ok(`${s.id} (${s.kind}) is never machine-marked, so it is no trap's`, t === null);
  else ok(`stop ${s.id} (${s.kind}) sorts into exactly one trap`, TRAPS[t] && (s.kind === 'authored') === (s.id in STOP_TRAP));
}
for (const id of Object.keys(STOP_TRAP)) ok(`STOP_TRAP names a real written stop: ${id}`, stopById(id)?.kind === 'authored' && TRAPS[STOP_TRAP[id]]);
for (const s of [...readingStops(), ...bookStops()]) ok(`reading stop ${s.id} sorts into reading`, trapOfStop(s.id) === 'reading');
ok('every stop kind is either sorted by kind, written, or unmarked', stops.every((s) => KIND_TRAP[s.kind] || s.kind === 'authored' || UNMARKED.includes(s.kind)));

/* ---------- 2. every game's and tool's misses ---------- */
for (const g of Object.keys(GAMES)) ok(`game ${g} sorts its misses into a trap`, TRAPS[trapOfSlip({ g, c: 'anything' })]);
const NEXT = src('../src/views/play.js').match(/const NEXT = \{([\s\S]*?)\n\};/)[1];
for (const [, g, body] of NEXT.matchAll(/^\s*(\w+): \{([^}]*)\}/gm)) for (const [, c] of body.matchAll(/'?([\w ]+)'?:\s*'/g)) ok(`${g}'s miss category “${c}” sorts into a trap`, TRAPS[trapOfSlip({ g, c })]);
ok('Root Forge sorts a root into Roots and a prefix or suffix into Prefixes and suffixes', trapOfSlip({ g: 'root', c: 'root' }) === 'roots' && trapOfSlip({ g: 'root', c: 'prefix' }) === 'affixes' && trapOfSlip({ g: 'root', c: 'suffix' }) === 'affixes');
for (const g of ['ears', 'vocab', 'idioms', 'typing']) ok(`${g} sorts its misses into a trap`, TRAPS[trapOfSlip({ g, c: 'miss' })]);
ok('an unknown game is no trap', trapOfSlip({ g: 'nope', c: 'x' }) === null);
for (const [f, hook] of [['views/play.js', 'recordSlips(k, r.id, g.misses'], ['views/ears.js', "recordSlips(kid(), 'ears'"], ['views/tools.js', 'recordSlips(k, r.tool, '], ['views/tools.js', "recordSlips(k, 'typing'"]])
  ok(`${f} hands its misses to the Coach: ${hook}…`, src(`../src/${f}`).includes(hook));

/* ---------- 3. every trap has a whole rule ---------- */
const reach = new Set([...Object.values(KIND_TRAP), ...Object.values(STOP_TRAP), ...Object.values(GAME_TRAP).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v)))]);
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const LINES = shippedLines();
for (const id of TRAP_IDS) {
  const r = TRAPS[id];
  ok(`${id}: a label, a colour, the mistake, the rule and a check`, r.label && /^#[0-9a-f]{6}$/i.test(r.col) && [r.mistake, r.rule, r.check].every((x) => typeof x === 'string' && x.length >= 40));
  ok(`${id}: white type on its colour is ≥ 4.5:1 (the Coach's band)`, 1.05 / (lum(r.col) + 0.05) >= 4.5, (1.05 / (lum(r.col) + 0.05)).toFixed(2));
  ok(`${id}: at least two worked examples, each with a why`, r.egs.length >= 2 && r.egs.every((e) => e.s && e.why));
  ok(`${id}: practise stops exist and are machine-marked`, r.practise.length >= 1 && r.practise.every((s) => stopById(s) && !UNMARKED.includes(stopById(s).kind)));
  ok(`${id}: its first practise stop teaches this very trap`, trapOfStop(r.practise[0]) === id, trapOfStop(r.practise[0]));
  ok(`${id}: something the app records sorts into it`, reach.has(id));
  for (const e of r.egs.filter((x) => x.work)) {
    const w = WORKS.find((x) => x.id === e.work), text = readText(e.work) || '';
    ok(`${id}: “${e.s.slice(0, 40)}…” quotes a work that is cleared`, w && cleared(w));
    ok(`${id}: “${e.s.slice(0, 40)}…” is an exact substring of a held line of ${e.work}`, LINES.some((l) => l.work === e.work && l.text.includes(e.s)));
    ok(`${id}: “${e.s.slice(0, 40)}…” is in the held text of ${e.work} itself`, text.replace(/\s+/g, ' ').includes(e.s.replace(/\s+/g, ' ')));
  }
}
ok('at least one example per strand of punctuation quotes a held book (commas, apostrophes, speech)', ['commas', 'apostrophes', 'speech'].every((id) => TRAPS[id].egs.some((e) => e.work)));
ok('Quill has habits to turn over', HABITS.length >= 5 && HABITS.every(([t, b]) => t && b.length > 30));
ok('the rulebook carries no emoji', !/\p{Extended_Pictographic}/u.test(JSON.stringify(TRAPS) + JSON.stringify(HABITS)));

/* ---------- 4. Quill's read, from planted misses ---------- */
const h = newHousehold(), a = addKid(h, newKid('Asha', 2, 'tortoise')), b = addKid(h, newKid('Kabir', 3, 'hare'));
ok('a child with no misses: nothing is catching them yet', coachRead(a, T).kind === 'none' && missTraps(a, T).length === 0 && topTrap(a, T) === null);
a.misses.push({ stop: 's5-comma', item: 'commas:x', at: T - D }, { stop: 's5-comma', item: 'commas:y', at: T - 2 * D }, { stop: 's2-tense', item: 'au:s2-tense:1', at: T - D },
  { stop: null, item: 'storycomma:aesop-town-mouse:0', at: T - D }, { stop: 'w1-rhyme', item: 'rhyme:at:0', at: T - 40 * D }, { stop: 'w1-rhyme', item: 'rhyme:at:1', at: T - D, ok: true });
recordSlips(a, 'rush', { list: 2, aside: 1 }, T - D);
const tr = missTraps(a, T);
ok(`the traps, worst first (${tr.map((t) => `${t.id}:${t.n}`).join(' ')})`, tr[0].id === 'commas' && tr[0].n === 6 && tr[1].id === 'tense' && tr[1].n === 1 && tr.length === 2);
ok('a miss older than thirty days, or one marked ok, has had its say', !tr.some((t) => t.id === 'sounds') && WINDOW === 30 * D);
ok('the trap remembers where it caught them', tr[0].stops['s5-comma'] === 2);
const rd = coachRead(a, T);
ok(`the read names the top trap and how many slips it holds: “${rd.text}”`, rd.kind === 'top' && rd.top.id === 'commas' && /\[\[commas\]\]/.test(rd.text) && /6 of your 7 slips/.test(rd.text));
const sp = newKid('Spread', 2, 'x'); sp.misses.push({ stop: 's5-comma', at: T }, { stop: 's2-tense', at: T }, { stop: 'w1-rhyme', at: T });
ok('slips spread one each across traps: no single trap is catching them', coachRead(sp, T).kind === 'spread');
ok('a story exercise miss with no stop sorts by its item', trapOfMiss({ stop: null, item: 'storyorder:p:1' }) === 'shape' && trapOfMiss({ stop: null, item: 'storycopy:p' }) === 'copying' && trapOfMiss({ stop: null, item: 'storyword:p:0' }) === 'meanings');
ok('a whole-book chapter miss sorts into reading', trapOfMiss({ stop: bookStops()[0].id, item: 'passage:x:0' }) === 'reading');
recordSlips(a, 'rush', { list: 500 }, T); ok('a slip counts at most twenty', a.slips.at(-1).n === 20);
for (let i = 0; i < 250; i++) recordSlips(a, 'builder', 'clause', T);
ok('the slips are kept to the last 200', a.slips.length === 200);
recordSlips(a, 'evil', 'x', T); ok('an unknown game records nothing', a.slips.length === 200 && a.slips.at(-1).g === 'builder');

/* ---------- 5. practice seconds: only inside practice, only visible and active ---------- */
const R = (name, ...parts) => ({ name, parts: [name, ...parts] });
const YES = [[R('stop', 's5-comma'), { mode: 'stop', phase: 'turn' }], [R('stop', 's5-comma'), { mode: 'stop', phase: 'learn' }], [R('practice', 'check'), { mode: 'check', phase: 'check' }],
  [R('story', 'p', 'do', 'commas'), { mode: 'ex', items: [1] }], [R('whole', 'alice', '1', 'do', 'words'), { mode: 'ex', items: [1] }], [R('play', 'rush'), { mode: 'game', phase: 'play' }],
  [R('ears'), { mode: 'ears', phase: 'play' }], [R('desk', 'wr4-para'), { mode: 'desk' }], [R('stage', 'sp6-minute'), { mode: 'speak', phase: 'prep' }], [R('stage', 'aloud'), { mode: 'aloud', phase: 'live' }],
  [R('stage', 'podium'), { mode: 'podium', view: 'stage' }], [R('tools', 'vocab', 'd'), { mode: 'tool', phase: 'check', items: [1] }], [R('tools', 'idioms', 'quiz'), { mode: 'tool', phase: 'quiz' }],
  [R('tools', 'typing', 'home1'), { mode: 'tool', ty: { done: false } }]];
const NO = [[R('home'), null], [R('atlas', 'word'), null], [R('coach'), null], [R('practice'), null], [R('stop', 's5-comma'), { mode: 'stop', phase: 'done' }], [R('play'), null], [R('play', 'studio'), { mode: 'game', phase: 'hub' }],
  [R('play', 'rush'), { mode: 'game', phase: 'title' }], [R('play', 'rush'), { mode: 'game', phase: 'between' }], [R('play', 'rush'), { mode: 'game', phase: 'done' }], [R('story', 'p'), { mode: 'story' }],
  [R('story', 'p', 'do'), { mode: 'exlist' }], [R('ears'), { mode: 'ears', phase: 'title' }], [R('ears'), { mode: 'ears', phase: 'done' }], [R('desk', 'wr4-para', 'done'), null], [R('stage'), null],
  [R('stage', 'aloud'), { mode: 'aloud', phase: 'pick' }], [R('stage', 'podium'), { mode: 'podium', view: 'lobby' }], [R('stage', 'podium'), { mode: 'podium', view: 'final' }], [R('tools'), { mode: 'tool', tool: '' }],
  [R('tools', 'typing'), { mode: 'tool' }], [R('tools', 'typing', 'home1'), { mode: 'tool', ty: { done: true } }], [R('tools', 'vocab'), { mode: 'tool' }], [R('library'), null], [R('feed'), null], [R('shop'), null], [R('grownups'), null]];
for (const [r, run] of YES) ok(`practising inside ${r.parts.join('/')} (${run.phase || run.view || run.mode})`, practising(r, run, null));
for (const [r, run] of NO) ok(`not practising on ${r.parts.join('/')} (${run?.phase || run?.view || run?.mode || 'a menu'})`, !practising(r, run, null));
ok('Inkwell counts inside a case only', practising(R('inkwell', 'case', 'c1'), null, { view: 'case' }) && !practising(R('inkwell'), null, { view: 'hub' }) && !practising(R('inkwell', 'map'), null, { view: 'map' }));
const pk = newKid('Pia', 1, 'x'), on = { visible: true, idleMs: 1000, practising: true };
let s = 0; for (let i = 0; i < 60; i++) s += tickPractice(pk, 1000, on, T);
ok('sixty one-second ticks inside practice are sixty seconds', s === 60 && pk.days[today(T)].prac === 60);
ok('a hidden tab adds nothing', tickPractice(pk, 1000, { ...on, visible: false }, T) === 0);
ok('a menu adds nothing', tickPractice(pk, 1000, { ...on, practising: false }, T) === 0);
ok('a child idle for over two minutes adds nothing', tickPractice(pk, 1000, { ...on, idleMs: IDLE + 1 }, T) === 0);
ok('a stalled tab (a gap of minutes) adds at most five seconds', tickPractice(pk, 300000, on, T) === 5 && pk.days[today(T)].prac === 65);
ok('practice goes into the child’s own day, never another’s', !Object.keys(b.days).length);
ok('main.js starts the clock on the running state', /startPracticeClock\(\{ kid, isPractising: \(\) => practising\(S\.route, S\.run, S\.ink\)/.test(src('../src/main.js')));

/* ---------- 6. the rings ---------- */
const day = today(T), log = [{ a: 'english', d: day, t: 600, m: 12, who: 'Asha' }, { a: 'english', d: day, t: 700, m: 3, who: 'asha ' }, { a: 'maths', d: day, t: 600, m: 30, who: 'Asha' },
  { a: 'english', d: day, t: 600, m: 40, who: 'Kabir' }, { a: 'english', d: today(T - D), t: 600, m: 9, who: 'Asha' }];
ok('App time: this app, this child (any case), this day only', appMinutes(log, 'Asha', day) === 15 && appMinutes(log, 'Kabir', day) === 40 && appMinutes(log, 'Asha', today(T - D)) === 9);
a.days[day] = { right: 30, prac: 300 };
const m = todayMetrics(a, log, T), tg = targets(a);
ok(`Asha's targets are her band's defaults (${JSON.stringify(tg)})`, tg.app === TARGET_DEFAULTS[2].app && tg.prac === TARGET_DEFAULTS[2].prac && tg.words === TARGET_DEFAULTS[2].words);
ok(`the percentages: app 15/20 m, practise 5/10 m, right 30/15 (${[m.pApp, m.pPrac, m.pWords].map((x) => x.toFixed(2))})`, Math.abs(m.pApp - 0.75) < 1e-9 && Math.abs(m.pPrac - 0.5) < 1e-9 && m.pWords === 2 && !allClosed(m));
ok('time is shown as Bee shows it', fmtMins(m.app) === '15m' && fmtMins(5400) === '1h 30m' && fmtMins(0) === '0m');
const svg = ringsSVG(104, [m.pApp, m.pPrac, m.pWords]);
ok('three rings, no numbers inside', (svg.match(/<circle/g) || []).length === 3 + 3 + 1 && !/<text/.test(svg));
ok('past the target a second lap is drawn — and only then', /data-lap="2"/.test(svg) && !/data-lap="[01]"/.test(svg) && /data-ring="0"/.test(svg));
ok('an empty ring draws only its track', (ringsSVG(50, [0, 0, 0]).match(/<circle/g) || []).length === 3);
const md = metricDays(a, log, 30, T);
ok('the thirty days run oldest first, ending today', md.length === 30 && md.at(-1).day === day && md.at(-1).app === 900 && md.at(-1).prac === 300 && md.at(-2).app === 540);

/* ---------- 7. targets per child; a second child inherits nothing ---------- */
a.targets.app = 45; a.targets.words = 0; a.targets.prac = 999;
ok('a grown-up’s target holds, 0 falls back to the default, a huge one is capped', targets(a).app === 45 && targets(a).words === TARGET_DEFAULTS[2].words && targets(a).prac === TARGET_MAX.prac);
ok('Kabir keeps his own band’s targets', JSON.stringify(targets(b)) === JSON.stringify(TARGET_DEFAULTS[3]) && b.targets.app === 30);
ok('a second child inherits no misses, slips, practice or targets', b.misses.length === 0 && b.slips.length === 0 && !Object.keys(b.days).length && missTraps(b, T).length === 0 && coachRead(b, T).kind === 'none');
ok('a new child starts with an empty slips list and the band’s targets', Array.isArray(newKid('N', 1, 'x').slips) && newKid('N', 1, 'x').targets.app === TARGET_DEFAULTS[1].app);

/* ---------- 8. the store's step and the backup ---------- */
ok('the store is at v7', VERSION === 7);
const old = { v: 6, parent: {}, kids: [{ id: 'k1', name: 'Old', band: 3, targets: { words: 25, pages: 1, made: 1 }, days: {} }, { id: 'k2', name: 'Two', band: 1, days: {} }], active: 'k1' };
const mg = migrate(JSON.parse(JSON.stringify(old)));
ok(`v6 → v7: app and practise targets by band, the right-answers target kept, an empty slips list (${JSON.stringify(mg.kids[0].targets)})`, mg.v === 7 && mg.kids[0].targets.words === 25 && mg.kids[0].targets.app === 30 && mg.kids[0].targets.prac === 15 && mg.kids[1].targets.app === 15 && mg.kids[1].targets.words === 10 && Array.isArray(mg.kids[0].slips) && mg.kids[1].slips.length === 0);
const bk = makeBackup(h), ka = bk.kids.find((x) => x.id === a.id);
ok('a backup carries the slips (ids and counts), the days (with practice seconds) and the targets', KID_FIELDS.includes('slips') && ka.slips.length && ka.days[day].prac === 300 && ka.targets.app === 45);
ok('…and never a name', !JSON.stringify(bk).includes('Asha') && !JSON.stringify(bk).includes('Kabir'));
ok('a slip holds no typed word', a.slips.every((x) => Object.keys(x).sort().join() === 'at,c,g,n'));
done();
