/* bee.mjs — what was borrowed from Bizzing Bee matches its manifest: the pinned commit is at or after
   the proper-noun clean-up, the data on disk is exactly what the import wrote, nothing was hand-edited,
   and no Bee quote came across. */
import { tally } from './_mem.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
const { ok, done } = tally('bee');
const M = JSON.parse(readFileSync(new URL('../src/data/bee-manifest.json', import.meta.url)));
const root = new URL('../../', import.meta.url).pathname;
ok('pinned to a full Bee commit', /^[0-9a-f]{40}$/.test(M.commit));
ok('at or after 28948f81c (the proper-noun clean-up)', M.commit.startsWith('28948f81c') || !!M.after28948f81c);
for (const [f, h] of Object.entries(M.wrote)) ok(`${f} is exactly what the import wrote (re-import, never hand-edit)`, createHash('sha256').update(readFileSync(root + f)).digest('hex') === h);
const lex = JSON.parse(readFileSync(root + 'app/public/data/bee-words.json'));
ok('the lexicon names the same commit', lex.commit === M.commit);
ok('record counts agree', Object.keys(lex.words).length === M.counts.lexicon && lex.pools.def.length === M.counts.defPool && lex.pools.origin.length === M.counts.originPool);
ok('every pool word is in the lexicon', [...lex.pools.def, ...lex.pools.origin].every((w) => lex.words[w]));
ok('no question pool word is a name (its definition names no one)', [...lex.pools.def, ...lex.pools.origin].every((w) => !/\s[A-Z]/.test(lex.words[w][0].slice(1))));
ok('Bee’s quotes are not imported', !existsSync(root + 'app/src/data/quotes.js') && !JSON.stringify(M).includes('quotes'));
done();
