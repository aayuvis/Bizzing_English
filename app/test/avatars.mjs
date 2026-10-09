/* avatars.mjs — the family engine's validate() returns [] for our 96; every face has its painting and
   its prompt; no face is a person or a deity; none repeats a sibling app's face. */
import { tally } from './_mem.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { validate, sacredSafe } from '../src/integration/bizzing-avatars.js';
import { AVATARS, ALL_AVATARS, OLYMPUS, PACK_NAMES, STARTERS } from '../src/data/avatars.js';
import { stateOf } from '../src/integration/bizzing-avatars.js';
const { ok, done } = tally('avatars');
const v = validate(AVATARS);
ok(`validate(avatars) returns [] ${v.slice(0, 3).join('; ')}`, v.length === 0);
ok('no sacred figure in a villain pack (there are none)', sacredSafe(AVATARS, []).length === 0 && !AVATARS.some((a) => a.sacred || a.real));
ok('12 pack names', PACK_NAMES.length === 12);
for (const a of AVATARS) ok(`${a.id}: painting exists`, existsSync(new URL('../public/' + a.art, import.meta.url)));
const py = readFileSync(new URL('../../tools/art/avatars_prompts.py', import.meta.url), 'utf8');
const pids = [...py.matchAll(/^\s+'([a-z]+)':/gm)].map((m) => m[1]);
ok('the prompts and the catalogue name the same 96 ids', pids.length === 96 && pids.slice().sort().join() === AVATARS.map((a) => a.id).sort().join());
ok('the welcome offers five free Commons', STARTERS.length === 5 && STARTERS.every((id) => ALL_AVATARS.find((a) => a.id === id)?.tier === 'common') && STARTERS[0] === 'quill');
ok('Quill, the app icon, is a free avatar outside the 96 (the packs keep their shape)', ALL_AVATARS.length === 97 + OLYMPUS.length && AVATARS.length === 96 && ALL_AVATARS[0].id === 'quill' && ALL_AVATARS[0].tier === 'common' && existsSync(new URL('../public/' + ALL_AVATARS[0].art, import.meta.url)));
const DENY = /\b(god|goddess|deity|krishna|shiva|ganesh|zeus|thor|odin|buddha|jesus|allah|prophet|king|queen|prince|princess|man|woman|boy|girl|person|human|child)\b/i;
ok('creatures only: no person or deity named in a prompt', !DENY.test(py.replace(/no people|No people|human figures|NOT an owl|nothing like an owl/g, '')));
/* no face in two apps' 96 (FAMILY-STANDARD §8) — compared by id against the siblings in this workspace */
const sib = ['../../../Bizzing-Bee/spellbound-app/avatars', '../../../Bizzing-Maths/app/public/avatars', '../../../Bizzing_Geography/app/public/avatars', '../../../bizzingfinance/app/public/avatars']
  .map((p) => new URL(p, import.meta.url).pathname).filter(existsSync).flatMap((d) => readdirSync(d).map((f) => f.replace(/\.\w+$/, '')));
const dup = ALL_AVATARS.filter((a) => sib.includes(a.id)).map((a) => a.id);
ok(`no id is a sibling's face (${dup.join(', ') || 'none'})`, dup.length === 0);
/* the cards (avcards.js + data/avatar-cards.js): every face has its words, stats in range, the same every time */
{ const { card, RANKS, STATS } = await import('../src/avcards.js'); const { CARD_TEXT } = await import('../src/data/avatar-cards.js');
  ok('every avatar (Quill too) has a card text, and no card text is for a face that does not exist', ALL_AVATARS.every((a) => CARD_TEXT[a.id]?.lore && CARD_TEXT[a.id]?.fact) && Object.keys(CARD_TEXT).every((id) => ALL_AVATARS.some((a) => a.id === id)));
  ok('card texts are short enough for a card (lore ≤ 120, fact ≤ 170)', Object.values(CARD_TEXT).every((t) => t.lore.length <= 120 && t.fact.length <= 170));
  ok('no emoji on a card', Object.values(CARD_TEXT).every((t) => !/\p{Extended_Pictographic}/u.test(t.lore + t.fact + (t.from || ''))));
  const cs = AVATARS.map((a) => card(a.id));
  ok('every card has four stats from 28 to 99, an overall, a rank from its tier and a power', cs.every((c) => STATS.every(([k]) => c.stats[k] >= 28 && c.stats[k] <= 99) && c.overall >= 28 && c.rank === RANKS[c.tier] && c.power));
  ok('a card is the same every time it is drawn', JSON.stringify(card('tortoise')) === JSON.stringify(card('tortoise')));
  const avg = (t) => { const xs = cs.filter((c) => c.tier === t); return xs.reduce((a, c) => a + c.overall, 0) / xs.length; };
  ok('rarer tiers are stronger on average', avg('common') < avg('rare') && avg('rare') < avg('epic') && avg('epic') < avg('legendary'));
}
/* Mount Olympus (owner, 9 Oct 2026): eight figures from the Greek myths, outside the 96, in the pack shape */
{ const tiers = (t) => OLYMPUS.filter((a) => a.tier === t).length;
  ok('Mount Olympus: eight figures, 2 common · 3 rare · 2 epic · 1 legendary, outside the 96', OLYMPUS.length === 8 && tiers('common') === 2 && tiers('rare') === 3 && tiers('epic') === 2 && tiers('legendary') === 1 && AVATARS.length === 96 && validate(AVATARS).length === 0);
  ok('Mount Olympus: every figure has its sticker, keyed to transparent', OLYMPUS.every((a) => existsSync(new URL('../public/' + a.art, import.meta.url))));
  ok('Mount Olympus: none is a face a sibling app already has (Bee: Zeus, Poseidon, Athena, Hades, Apollo)', !OLYMPUS.some((a) => ['zeus', 'poseidon', 'athena', 'hades', 'apollo'].includes(a.id)));
  ok('Mount Olympus: sold in The Forum (world 4); the legendary waits for a milestone the app records (word-7)', OLYMPUS.every((a) => a.world === 4) && OLYMPUS.find((a) => a.tier === 'legendary').milestone.id === 'word-7');
  ok('Mount Olympus: commons are free; a rare is a price once its world is open', stateOf(OLYMPUS[0], {}).state === 'owned' && stateOf(OLYMPUS.find((a) => a.tier === 'rare'), {}).state === 'world' && stateOf(OLYMPUS.find((a) => a.tier === 'rare'), { worlds: [4] }).state === 'buy');
  const pr = readFileSync(new URL('../../tools/art/olympus_prompts.py', import.meta.url), 'utf8');
  ok('Mount Olympus: every figure has its painting prompt, and the creatures-only prompts file stays creatures-only', OLYMPUS.every((a) => pr.includes(`'${a.id}':`)) && !/'(iris|nike|hermes|demeter|hephaestus|artemis|persephone|hera)':/.test(py));
}
done();
