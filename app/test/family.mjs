/* family.mjs — the family drop-ins are BYTE-IDENTICAL to Bizzing_Schedule's (pinned by hash: they are
   updated by re-copying, never edited here), and coins move only on the standard events. */
import { T, tally } from './_mem.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
const { ok, done } = tally('family');
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const PIN = JSON.parse(readFileSync(new URL('./family-pins.json', import.meta.url)));
const HERE = new URL('../src/integration/', import.meta.url).pathname, SCHED = new URL('../../../Bizzing_Schedule/integration/', import.meta.url).pathname;
for (const [f, h] of Object.entries(PIN)) {
  ok(`${f} matches its pinned hash (re-copy from Bizzing_Schedule, never edit)`, sha(HERE + f) === h);
  if (existsSync(SCHED + f)) ok(`${f} is byte-identical to Bizzing_Schedule's copy`, sha(SCHED + f) === sha(HERE + f));
}
const W = await import('../src/integration/bizzing-wallet.js');
ok('english is a family app id', W.earn('english', 'Ana', 'answer', T) === 1);
ok('only the standard events pay', ['time', 'login', 'streak', 'dice', 'read', 'minute'].every((e) => W.earn('english', 'Ana', e, T) === 0));
ok('standard amounts: stop 5, mastery 20', W.earn('english', 'Ana', 'stop', T) === 5 && W.earn('english', 'Ana', 'mastery', T) === 20);
for (let i = 0; i < 50; i++) W.earn('english', 'Ana', 'mastery', T);
ok('100 a day at most', W.ledger('Ana').filter((x) => x.a === 'english').reduce((a, x) => a + x.n, 0) === 100);
/* every coin the app pays goes through app.js pay() → family.js earn(), with a standard event name */
const src = ['app.js', 'views/runner.js', 'views/reader.js', 'views/stage.js', 'views/play.js'].map((f) => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8')).join('\n');
const evs = [...src.matchAll(/pay\('([a-z]+)'\)/g)].map((m) => m[1]);
ok(`coins are paid only for standard events (${[...new Set(evs)].join(', ')})`, evs.length > 0 && evs.every((e) => ['answer', 'stop', 'contest', 'mastery'].includes(e)));
ok('no app code writes the shared keys directly', !/localStorage\.setItem\(['"]bizzing\./.test(src + readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')));
done();
