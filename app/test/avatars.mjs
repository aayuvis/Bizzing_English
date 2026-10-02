/* avatars.mjs — the family engine's validate() returns [] for our 96; every face has its painting and
   its prompt; no face is a person or a deity; none repeats a sibling app's face. */
import { tally } from './_mem.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { validate, sacredSafe } from '../src/integration/bizzing-avatars.js';
import { AVATARS, PACK_NAMES, STARTERS } from '../src/data/avatars.js';
const { ok, done } = tally('avatars');
const v = validate(AVATARS);
ok(`validate(avatars) returns [] ${v.slice(0, 3).join('; ')}`, v.length === 0);
ok('no sacred figure in a villain pack (there are none)', sacredSafe(AVATARS, []).length === 0 && !AVATARS.some((a) => a.sacred || a.real));
ok('12 pack names', PACK_NAMES.length === 12);
for (const a of AVATARS) ok(`${a.id}: painting exists`, existsSync(new URL('../public/' + a.art, import.meta.url)));
const py = readFileSync(new URL('../../tools/art/avatars_prompts.py', import.meta.url), 'utf8');
const pids = [...py.matchAll(/^\s+'([a-z]+)':/gm)].map((m) => m[1]);
ok('the prompts and the catalogue name the same 96 ids', pids.length === 96 && pids.slice().sort().join() === AVATARS.map((a) => a.id).sort().join());
ok('the welcome offers five free Commons', STARTERS.length === 5 && STARTERS.every((id) => AVATARS.find((a) => a.id === id)?.tier === 'common'));
const DENY = /\b(god|goddess|deity|krishna|shiva|ganesh|zeus|thor|odin|buddha|jesus|allah|prophet|king|queen|prince|princess|man|woman|boy|girl|person|human|child)\b/i;
ok('creatures only: no person or deity named in a prompt', !DENY.test(py.replace(/no people|No people|human figures|NOT an owl|nothing like an owl/g, '')));
/* no face in two apps' 96 (FAMILY-STANDARD §8) — compared by id against the siblings in this workspace */
const sib = ['../../../Bizzing-Bee/spellbound-app/avatars', '../../../Bizzing-Maths/app/public/avatars', '../../../Bizzing_Geography/app/public/avatars', '../../../bizzingfinance/app/public/avatars']
  .map((p) => new URL(p, import.meta.url).pathname).filter(existsSync).flatMap((d) => readdirSync(d).map((f) => f.replace(/\.\w+$/, '')));
const dup = AVATARS.filter((a) => sib.includes(a.id)).map((a) => a.id);
ok(`no id is a sibling's face (${dup.join(', ') || 'none'})`, dup.length === 0);
done();
