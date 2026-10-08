/* ears.js — Story Ears, the listening game (HANDOVER Part C §5), as pure rules: no DOM, no storage, no
   audio. test/ears.mjs holds every rule here; views/ears.js draws and plays.

   PROMISE: listen to a story and show what you heard. For ages 6–7 first; no reading needed.

   A STORY is a run of scenes of a rights-cleared Library passage (data/library.js + data/rights.js), read
   by the family narrator from her existing clips (voice/st/<passage>-<scene>.mp3), so a level's length is
   counted in the passage's own sentences (`sentences`). Its QUESTIONS are authored here and spoken; each
   is answered with PICTURES — the family's painted avatars (public/avatars) or the plain drawings below
   (no lettering, no people). Every question names the words in the story that hold its answer (`holds`,
   an exact substring of what was read): a wrong answer replays that sentence with the right picture lit.

   LEVELS (§5): 1 · 2–3 sentences, who / where · 2 · 4–5 sentences, + what happened · 3 · a paragraph
   (6–10), + order three pictures · 4 · two paragraphs (9–14), + what happened next · 5 · a whole passage,
   + why. The level moves on the owner's rule (§1.4): 80% or better up one, under 50% down one, never
   below 1; the child may pick a level by hand, and it sticks until the next check (`earsSetLevel`).

   PAY (§1.3, §6): one coin a question right first try — the only try: a miss shows the answer — paid at
   the end of the run and only when the run reached 50% (the line where the stars begin); five for a
   level passed. Stars: 0 under 50% · 1 · 2 at 70% · 3 at 90%. Nothing for listening, time or finishing. */

import { rng, shuffle, permute, hash } from './rand.js';

export const MAX_LEVEL = 5;
export const LEVELS = {
  1: { says: 'short stories — who and where', min: 2, max: 3, kinds: ['who', 'where'], opts: 4, stories: 4 },
  2: { says: 'longer stories — and what happened', min: 4, max: 5, kinds: ['who', 'where', 'what'], opts: 4, stories: 3 },
  3: { says: 'a paragraph — and the order of three pictures', min: 6, max: 10, kinds: ['who', 'where', 'what', 'order'], opts: 4, stories: 3 },
  4: { says: 'two paragraphs — and what happened next', min: 9, max: 14, kinds: ['who', 'where', 'what', 'order', 'next'], opts: 4, stories: 2 },
  5: { says: 'a whole story — and why', min: 10, max: 30, kinds: ['who', 'where', 'what', 'order', 'next', 'why'], opts: 4, stories: 2, whole: true },
};
export const LISTENS = 3;                    // a story may be heard three times; replaying a missed sentence is free
export const PASS = 0.5, UP = 0.8;           // pay and stars begin at 50%; a level moves up at 80%
export const KIND_SAYS = { who: 'who', where: 'where', what: 'what happened', order: 'the order things happened', next: 'what happened next', why: 'why' };

/* ---------- the pictures ---------- */
/* Avatars: [file id, what the picture shows] — the label is for screen readers, never shown as a clue. */
const AV = {
  lion: ['lion', 'a lion'], mouse: ['fieldmouse', 'a mouse'], hare: ['hare', 'a hare'], tortoise: ['tortoise', 'a tortoise'], donkey: ['donkey', 'a donkey'],
  dog: ['moorhound', 'a dog'], bigdog: ['bulldog', 'a big dog'], toto: ['terrier', 'a little dog'], cat: ['hodge', 'a cat'], rooster: ['chauntecleer', 'a rooster'],
  frog: ['crownfrog', 'a frog'], ccat: ['cheshire', 'a grinning cat'], marchhare: ['marchhare', 'a hare in a hat'], wrabbit: ['swordrabbit', 'a white rabbit'],
  rabbit: ['mountainhare', 'a rabbit'], birds: ['lark', 'a small brown bird'], crow: ['crow', 'a crow'], elephant: ['elephant', 'an elephant'], crab: ['crab', 'a crab'],
  seal: ['seal', 'a seal'], goose: ['goose', 'a goose'], mole: ['mole', 'a mole'], hen: ['redhen', 'a hen'],
};
const O = '#3b2a1f';                         // the drawings' outline
const svg = (inner) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" stroke="${O}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;
/* Plain drawings: [what it shows, how it reads as a badge on a creature, the drawing]. */
const DRAW = {
  wood: ['a wood', 'in a wood', `<path d="M2 84h96v10H2z" fill="#7cb15a"/><path d="M26 22 12 50h8L8 72h38L34 50h8z" fill="#2e8b57"/><path d="M23 72h6v12h-6z" fill="#8b5a2b"/><path d="M56 8 38 44h9L34 70h44L65 44h9z" fill="#3a9d63"/><path d="M53 70h6v14h-6z" fill="#8b5a2b"/><path d="M82 30 68 56h6l-10 20h36L88 56h6z" fill="#2e8b57"/><path d="M79 76h6v8h-6z" fill="#8b5a2b"/>`],
  tree: ['a tree', 'by a tree', `<path d="M44 92V58h12v34" fill="#8b5a2b"/><circle cx="50" cy="38" r="24" fill="#4caf50"/><circle cx="30" cy="48" r="15" fill="#43a047"/><circle cx="70" cy="48" r="15" fill="#43a047"/><path d="M20 92h60" fill="none"/>`],
  house: ['a house', 'at a house', `<path d="M22 46h56v42H22z" fill="#f4d9a8"/><path d="M12 50 50 16l38 34z" fill="#c0392b"/><path d="M44 62h14v26H44z" fill="#8b5a2b"/><path d="M28 56h12v12H28zM62 56h12v12H62z" fill="#ffd54a"/>`],
  castle: ['a castle', 'at a castle', `<path d="M26 44h48v44H26z" fill="#b0b7c3"/><path d="M12 30h18v58H12zM70 30h18v58H70z" fill="#9aa3b0"/><path d="M12 30v-8h5v8m3 0v-8h5v8m3 0v-8M70 30v-8h5v8m3 0v-8h5v8m3 0v-8" fill="none"/><path d="M42 88V70a8 8 0 0 1 16 0v18z" fill="#6d4c41"/><path d="M50 44V14" fill="none"/><path d="M50 14h16l-5 5 5 5H50z" fill="#e74c3c"/>`],
  town: ['a town', 'in a town', `<path d="M8 44h26v46H8z" fill="#e8a87c"/><path d="M36 20h28v70H36z" fill="#85c1e9"/><path d="M66 50h28v40H66z" fill="#f7dc6f"/><path d="M14 52h6v6h-6zM24 52h6v6h-6zM14 66h6v6h-6zM42 28h6v6h-6zM52 28h6v6h-6zM42 42h6v6h-6zM52 42h6v6h-6zM42 56h6v6h-6zM72 58h6v6h-6zM82 58h6v6h-6z" fill="#fff8e1" stroke-width="2"/><path d="M4 90h92" fill="none"/>`],
  beach: ['a beach by the sea', 'at the sea', `<circle cx="78" cy="22" r="10" fill="#ffcc33"/><path d="M2 48q12-6 24 0t24 0 24 0 24 0v24H2z" fill="#4aa3df"/><path d="M2 70q24-8 48 0t48 0v24H2z" fill="#f4d58d"/>`],
  mountain: ['a mountain', 'on a mountain', `<path d="M4 88 36 24l24 38 12-18 24 44z" fill="#8e9aaf"/><path d="M28 40l8-16 8 13-6 5-4-4z" fill="#fff8ec"/><path d="M68 50l4-6 7 11-6 2z" fill="#fff8ec"/>`],
  boat: ['a boat', 'in a boat', `<path d="M50 14v50" fill="none"/><path d="M52 18l26 40H52z" fill="#fff8ec"/><path d="M48 24 26 58h22z" fill="#fdebd0"/><path d="M12 64h76l-12 16H24z" fill="#a0522d"/><path d="M4 88q8-5 16 0t16 0 16 0 16 0 16 0 12 0" fill="none" stroke="#2e86c1"/>`],
  pond: ['a pool of water', 'by the water', `<ellipse cx="50" cy="66" rx="42" ry="18" fill="#5dade2"/><ellipse cx="46" cy="66" rx="18" ry="6" fill="none" stroke="#d6eaf8" stroke-width="2"/><path d="M82 52V24M88 54V30M14 54V32" fill="none" stroke="#2e7d32"/><path d="M80 24h4v10h-4zM12 32h4v9h-4z" fill="#795548" stroke-width="2"/>`],
  fire: ['a fire', 'by a fire', `<path d="M18 86 82 72M18 72l64 14" fill="none" stroke="#6d4c41" stroke-width="8"/><path d="M50 18c-8 14-22 24-22 40a22 22 0 0 0 44 0c0-10-6-16-10-24-2 8-6 10-8 10 2-10 0-18-4-26z" fill="#ff8f00"/><path d="M50 44c-4 8-10 12-10 20a10 10 0 0 0 20 0c0-8-6-12-10-20z" fill="#ffd54f"/>`],
  bed: ['a bed', 'under a bed', `<path d="M8 36h10v50H8z" fill="#8b5a2b"/><path d="M18 58h74v14H18z" fill="#fff8ec"/><path d="M42 52h50v20H42z" fill="#5b8def"/><ellipse cx="30" cy="54" rx="11" ry="6" fill="#fff8ec"/><path d="M18 72h74v6H18zM86 78v8M22 78v8" fill="#8b5a2b"/>`],
  table: ['a table', 'on a table', `<path d="M8 44h84v10H8z" fill="#a0522d"/><path d="M16 54h8v34h-8zM76 54h8v34h-8z" fill="#8b4513"/>`],
  feast: ['a table full of food', 'at a feast', `<path d="M6 60h88v8H6z" fill="#a0522d"/><path d="M14 68h6v22h-6zM80 68h6v22h-6z" fill="#8b4513"/><path d="M18 40h26v20H18z" fill="#f7c6d0"/><path d="M18 40q6 6 9 0t8 0 9 0" fill="#fff8ec"/><circle cx="31" cy="34" r="4" fill="#e53935"/><path d="M52 60a14 14 0 0 1 28 0z" fill="#e74c3c"/><path d="M58 50q8-4 16 0" fill="none" stroke="#ffcdd2"/>`],
  trap: ['a trap', 'in a trap', `<path d="M16 34h68v50H16z" fill="#fdf2e9" fill-opacity=".4"/><path d="M28 34v50M40 34v50M52 34v50M64 34v50M76 34v50" fill="none" stroke="#7f8c8d" stroke-width="4"/><path d="M16 34h68v50H16z" fill="none" stroke-width="5"/><path d="M38 34q12-16 24 0" fill="none" stroke-width="4"/><path d="M10 84h80v6H10z" fill="#8b5a2b"/>`],
  net: ['a net', 'caught in a net', `<path d="M14 90V14M86 90V14" fill="none" stroke="#8b5a2b" stroke-width="6"/><path d="M14 20q36 14 72 0v50q-36 14-72 0z" fill="#e8f5e9" fill-opacity=".5" stroke="#5d6d7e" stroke-width="2"/><path d="M26 24v52M38 27v52M50 28v52M62 27v52M74 24v52M14 36q36 14 72 0M14 52q36 14 72 0" fill="none" stroke="#5d6d7e" stroke-width="2"/>`],
  rope: ['a rope', 'with a rope', `<circle cx="50" cy="54" r="30" fill="#d4a373"/><circle cx="50" cy="54" r="20" fill="none" stroke="#a47148" stroke-width="5"/><circle cx="50" cy="54" r="10" fill="none" stroke="#a47148" stroke-width="5"/><path d="M78 62q12 10 4 26" fill="none" stroke="#a47148" stroke-width="6"/>`],
  ball: ['a golden ball', 'with a golden ball', `<circle cx="50" cy="54" r="32" fill="#f5c518"/><path d="M22 46q28 14 56 0" fill="none" stroke="#c99700"/><ellipse cx="38" cy="38" rx="9" ry="6" fill="#fff8c4" stroke="none"/>`],
  cake: ['a cake', 'eating cake', `<ellipse cx="50" cy="84" rx="38" ry="6" fill="#ecf0f1"/><path d="M20 50h60v32H20z" fill="#f7c6d0"/><path d="M20 50q7 10 12 0t12 0 12 0 12 0 12 0v-6H20z" fill="#fff8ec"/><path d="M20 66h60" fill="none" stroke="#d98ba0"/><circle cx="50" cy="36" r="6" fill="#e53935"/>`],
  umbrella: ['an umbrella', 'with an umbrella', `<path d="M10 50a40 40 0 0 1 80 0q-10-8-20 0-10-8-20 0-10-8-20 0-10-8-20 0z" fill="#e74c3c"/><path d="M50 50v32a8 8 0 0 1-16 0" fill="none" stroke-width="5"/>`],
  cheese: ['cheese', 'with cheese', `<path d="M10 74h80V46L30 30z" fill="#f9d34a"/><path d="M10 74 30 30" fill="none"/><circle cx="56" cy="58" r="6" fill="#e0b62d"/><circle cx="76" cy="52" r="4" fill="#e0b62d"/><circle cx="40" cy="64" r="4" fill="#e0b62d"/>`],
  bread: ['a loaf of bread', 'with bread', `<path d="M12 70q-4-34 38-34t38 34z" fill="#d9984a"/><path d="M12 70h76v10H12z" fill="#c1813e"/><path d="M32 46l6 10M48 42l6 10M64 46l6 10" fill="none" stroke="#f3d1a0"/>`],
  shoe: ['a shoe', 'losing a shoe', `<path d="M12 70V44q14 2 22 10l30 8q24 4 24 16v4H12z" fill="#6d4c41"/><path d="M12 76h76v8H12z" fill="#3e2723"/><path d="M36 56l6-6M44 58l6-6" fill="none" stroke="#d7ccc8" stroke-width="2"/>`],
  flag: ['a finishing flag', 'at the finish', `<path d="M26 90V12" fill="none" stroke-width="5"/><path d="M28 14h56v36H28z" fill="#fff8ec"/><path d="M28 14h14v12H28zM56 14h14v12H56zM42 26h14v12H42zM70 26h14v12H70zM28 38h14v12H28zM56 38h14v12H56z" fill="#333" stroke="none"/>`],
  book: ['a book', 'with a book', `<path d="M50 30q-18-10-40-6v54q22-4 40 6z" fill="#fff8ec"/><path d="M50 30q18-10 40-6v54q-22-4-40 6z" fill="#fdfefe"/><path d="M18 36q14-2 26 4M18 48q14-2 26 4M56 40q12-6 26-4M56 52q12-6 26-4" fill="none" stroke="#aab7b8" stroke-width="2"/><path d="M10 78q22-4 40 6 18-10 40-6v6q-22-4-40 6-18-10-40-6z" fill="#c0392b"/>`],
  paw: ['a paw', 'waving a paw', `<ellipse cx="50" cy="64" rx="20" ry="17" fill="#8d6e63"/><ellipse cx="26" cy="42" rx="8" ry="10" fill="#8d6e63"/><ellipse cx="42" cy="30" rx="8" ry="10" fill="#8d6e63"/><ellipse cx="58" cy="30" rx="8" ry="10" fill="#8d6e63"/><ellipse cx="74" cy="42" rx="8" ry="10" fill="#8d6e63"/>`],
  wind: ['the wind', 'in the wind', `<path d="M8 36h50a10 10 0 1 0-10-10M8 54h70a12 12 0 1 1-12 12M8 72h36a8 8 0 1 1-8 8" fill="none" stroke="#5d8aa8" stroke-width="6"/>`],
  drum: ['a drum', 'with a drum', `<path d="M20 36v36a30 10 0 0 0 60 0V36" fill="#e74c3c"/><ellipse cx="50" cy="36" rx="30" ry="10" fill="#fdebd0"/><path d="M20 44l12 30 12-28 12 28 12-28 12 26" fill="none" stroke="#f9e79f" stroke-width="2"/><path d="M60 22 84 6M70 26 94 14" fill="none" stroke="#8b5a2b" stroke-width="4"/>`],
  garden: ['a vegetable garden', 'in a garden', `<path d="M4 86h92v8H4z" fill="#8d6e63"/><circle cx="18" cy="78" r="7" fill="#7cb342"/><circle cx="38" cy="78" r="7" fill="#7cb342"/><circle cx="62" cy="78" r="7" fill="#7cb342"/><circle cx="82" cy="78" r="7" fill="#7cb342"/><path d="M8 40v28M20 36v32M32 40v28M68 40v28M80 36v32M92 40v28M4 50h34M62 50h34M4 62h34M62 62h34" fill="none" stroke="#a1887f" stroke-width="4"/><path d="M40 38h20v30H40z" fill="#bcaaa4"/><path d="M40 38l20 30M60 38 40 68" fill="none" stroke="#8d6e63"/>`],
  lettuce: ['a lettuce', 'eating lettuce', `<circle cx="50" cy="58" r="30" fill="#7cb342"/><path d="M30 46q20-18 40 0M26 62q24-16 48 0M34 76q16-10 32 0" fill="none" stroke="#c5e1a5"/><circle cx="50" cy="56" r="10" fill="#aed581"/>`],
  fish: ['a fish', 'with a fish', `<path d="M14 54q30-30 60 0-30 30-60 0z" fill="#ff8a65"/><path d="M72 54l18-14v28z" fill="#ff7043"/><circle cx="28" cy="50" r="3" fill="${O}"/><path d="M40 42q8 12 0 24" fill="none" stroke="#ffccbc"/>`],
  apple: ['an apple', 'with an apple', `<path d="M50 34q-24-12-32 12-4 30 22 40 10-4 20 0 26-10 22-40-8-24-32-12z" fill="#e53935"/><path d="M50 34q0-10 6-18" fill="none" stroke="#6d4c41"/><path d="M56 22q14-6 18 4-12 6-18-4z" fill="#66bb6a"/>`],
  flower: ['a flower', 'with a flower', `<path d="M50 56v34" fill="none" stroke="#388e3c" stroke-width="5"/><path d="M50 78q14-14 24-6-12 10-24 6z" fill="#66bb6a"/><circle cx="50" cy="26" r="11" fill="#f48fb1"/><circle cx="34" cy="38" r="11" fill="#f48fb1"/><circle cx="66" cy="38" r="11" fill="#f48fb1"/><circle cx="40" cy="54" r="11" fill="#f48fb1"/><circle cx="60" cy="54" r="11" fill="#f48fb1"/><circle cx="50" cy="42" r="9" fill="#ffd54f"/>`],
  berries: ['blackberries', 'picking blackberries', `<path d="M50 30q20-22 34-12-14 18-34 12z" fill="#66bb6a"/><circle cx="40" cy="44" r="9" fill="#4a235a"/><circle cx="56" cy="46" r="9" fill="#5b2c6f"/><circle cx="32" cy="60" r="9" fill="#5b2c6f"/><circle cx="48" cy="62" r="9" fill="#4a235a"/><circle cx="64" cy="62" r="9" fill="#4a235a"/><circle cx="40" cy="77" r="9" fill="#5b2c6f"/><circle cx="56" cy="78" r="9" fill="#4a235a"/>`],
  gem: ['jewels', 'with jewels', `<path d="M24 36h52l14 14-40 38-40-38z" fill="#76d7ea"/><path d="M10 50h80M36 36l-8 14 22 38 22-38-8-14M28 50h44" fill="none" stroke="#2e86c1" stroke-width="2"/>`],
  hat: ['a hat', 'in a hat', `<path d="M32 22h36v44H32z" fill="#333"/><path d="M32 54h36v8H32z" fill="#c0392b"/><path d="M14 66h72v8H14z" fill="#333"/>`],
  cart: ['a waggon', 'with a waggon', `<path d="M14 40h62l-6 26H20z" fill="#c68642"/><path d="M14 40h62M24 40v26M44 40v26M64 40v26" fill="none" stroke="#8b5a2b" stroke-width="2"/><path d="M76 46l16-8" fill="none" stroke="#8b5a2b" stroke-width="5"/><circle cx="30" cy="74" r="12" fill="#8b5a2b"/><circle cx="64" cy="74" r="12" fill="#8b5a2b"/><circle cx="30" cy="74" r="3" fill="#fdebd0"/><circle cx="64" cy="74" r="3" fill="#fdebd0"/>`],
  lamp: ['a shining light', 'seeing a light', `<circle cx="50" cy="56" r="34" fill="#fff59d" fill-opacity=".55" stroke="none"/><path d="M40 20h20l4 10H36z" fill="#5d6d7e"/><path d="M36 30h28v40H36z" fill="#ffd54f"/><path d="M36 30h28v40H36zM50 30v40" fill="none" stroke="#5d6d7e"/><path d="M32 70h36v8H32z" fill="#5d6d7e"/><path d="M44 20a6 6 0 0 1 12 0" fill="none"/>`],
  balloon: ['a balloon in the sky', 'in a balloon', `<path d="M50 8a28 30 0 0 0-26 42q8 14 18 20h16q10-6 18-20A28 30 0 0 0 50 8z" fill="#e74c3c"/><path d="M50 8q-14 30-8 62M50 8q14 30 8 62" fill="none" stroke="#f9e79f" stroke-width="4"/><path d="M42 70l2 12M58 70l-2 12" fill="none" stroke-width="2"/><path d="M40 82h20v10H40z" fill="#a0522d"/>`],
  cradle: ['a baby’s cradle', 'in a cradle', `<path d="M14 82q36 14 72 0" fill="none" stroke="#8b5a2b" stroke-width="6"/><path d="M22 44h56l-6 34H28z" fill="#f5cba7"/><path d="M22 44h56" fill="none"/><path d="M20 44q2-22 24-22h4v22" fill="#f5cba7"/><path d="M30 56h40v12H30z" fill="#aed6f1"/>`],
  kite: ['a kite', 'with a kite', `<path d="M56 8 82 34 56 70 30 34z" fill="#f39c12"/><path d="M56 8v62M30 34h52" fill="none" stroke="#b9770e" stroke-width="2"/><path d="M56 70q-8 10 0 16t-4 12" fill="none" stroke-width="2"/><path d="M50 80l6 4-6 4zM48 92l6 2-6 4z" fill="#e74c3c" stroke-width="1"/>`],
  key: ['a key', 'with a key', `<circle cx="30" cy="50" r="16" fill="#f5c518"/><circle cx="30" cy="50" r="6" fill="#fff8ec"/><path d="M46 46h44v8H46zM76 54v12M86 54v10" fill="#f5c518"/>`],
  carrot: ['a carrot', 'with a carrot', `<path d="M38 30h24L50 92z" fill="#f57c00"/><path d="M44 46h8M46 60h6M48 74h4" fill="none" stroke="#bf360c" stroke-width="2"/><path d="M50 30q-12-14-6-22 6 8 6 22 0-14 10-20 2 12-10 20" fill="#66bb6a"/>`],
  watch: ['a watch', 'with a watch', `<path d="M50 10q-14 0-14 10" fill="none" stroke="#c99700"/><path d="M44 18h12v8H44z" fill="#c99700"/><circle cx="50" cy="58" r="32" fill="#f5c518"/><circle cx="50" cy="58" r="25" fill="#fffde7"/><path d="M50 58V40M50 58l12 6" fill="none" stroke-width="4"/>`],
  hole: ['a hole in the ground', 'going down a hole', `<path d="M4 82q46-50 92 0z" fill="#7cb342"/><ellipse cx="50" cy="76" rx="22" ry="12" fill="#3e2723"/><path d="M12 82h76" fill="none"/>`],
  window: ['a broken window', 'breaking a window', `<path d="M18 14h64v72H18z" fill="#aed6f1"/><path d="M18 14h64v72H18zM50 14v72M18 50h64" fill="none" stroke="#8b5a2b" stroke-width="5"/><path d="M28 22l10 12-6 6 12 6M62 58l8 10-8 4 10 8" fill="none" stroke="#fff" stroke-width="3"/>`],
  parsley: ['some parsley', 'looking for parsley', `<path d="M50 92V48M50 70 32 46M50 64 70 40" fill="none" stroke="#2e7d32" stroke-width="4"/><circle cx="50" cy="38" r="12" fill="#43a047"/><circle cx="30" cy="40" r="10" fill="#4caf50"/><circle cx="72" cy="34" r="10" fill="#4caf50"/><circle cx="42" cy="30" r="8" fill="#66bb6a"/><circle cx="60" cy="28" r="8" fill="#66bb6a"/>`],
  barn: ['a barn for cows and horses', 'by a barn', `<path d="M14 44 50 18l36 26v44H14z" fill="#c0392b"/><path d="M38 56h24v32H38z" fill="#fdebd0"/><path d="M38 56l24 32M62 56 38 88" fill="none" stroke="#c0392b" stroke-width="3"/><path d="M44 36h12v10H44z" fill="#fdebd0"/>`],
  ladder: ['a ladder', 'on a ladder', `<path d="M30 92 38 8M70 92 62 8" fill="none" stroke="#a0522d" stroke-width="6"/><path d="M37 20h26M36 36h28M34 52h32M32 68h36M31 84h38" fill="none" stroke="#a0522d" stroke-width="5"/>`],
  note: ['music', 'making music', `<path d="M34 74V26l40-10v48" fill="none" stroke-width="5"/><ellipse cx="26" cy="74" rx="10" ry="8" fill="${O}"/><ellipse cx="66" cy="64" rx="10" ry="8" fill="${O}"/><path d="M34 26l40-10v10l-40 10z" fill="${O}"/>`],
  cloud: ['a rain cloud', 'in the rain', `<path d="M24 58a14 14 0 0 1 4-28 18 18 0 0 1 34-4 14 14 0 0 1 14 32z" fill="#b0bec5"/><path d="M32 68l-4 12M50 68l-4 12M68 68l-4 12" fill="none" stroke="#42a5f5" stroke-width="4"/>`],
  plate: ['a golden plate', 'with a golden plate', `<ellipse cx="50" cy="58" rx="40" ry="22" fill="#f5c518"/><ellipse cx="50" cy="58" rx="26" ry="13" fill="#ffe066"/>`],
  jacket: ['a blue jacket', 'without a jacket', `<path d="M30 18 14 30l6 50h20V40l10-20 10 20v40h20l6-50-16-12-12 4-8 10-8-10z" fill="#3f6fd8"/><circle cx="44" cy="50" r="3" fill="#f5c518"/><circle cx="44" cy="62" r="3" fill="#f5c518"/><circle cx="56" cy="50" r="3" fill="#f5c518"/><circle cx="56" cy="62" r="3" fill="#f5c518"/>`],
  field: ['fields in the country', 'in the country', `<circle cx="78" cy="22" r="10" fill="#ffcc33"/><path d="M2 66q30-26 60 0t36-6v34H2z" fill="#8bc34a"/><path d="M2 80q40-16 96 0v14H2z" fill="#689f38"/><path d="M10 70v14M24 68v14M38 70v14M6 74h36" fill="none" stroke="#8d6e63" stroke-width="3"/>`],
  bank: ['a grassy river bank', 'on a river bank', `<path d="M2 46q48-14 96 0v24H2z" fill="#7cb342"/><path d="M2 68h96v26H2z" fill="#5dade2"/><path d="M14 80q8-4 16 0M54 84q8-4 16 0" fill="none" stroke="#d6eaf8" stroke-width="2"/><circle cx="24" cy="48" r="4" fill="#fff8ec" stroke-width="1.5"/><circle cx="60" cy="44" r="4" fill="#fff8ec" stroke-width="1.5"/><circle cx="80" cy="50" r="4" fill="#fff8ec" stroke-width="1.5"/>`],
  rake: ['a garden rake', 'with a rake', `<path d="M66 12 28 88" fill="none" stroke="#8b5a2b" stroke-width="6"/><path d="M50 8l32 16" fill="none" stroke="#7f8c8d" stroke-width="6"/><path d="M54 10l-4 10M62 14l-4 10M70 18l-4 10M78 22l-4 10" fill="none" stroke="#7f8c8d" stroke-width="4"/>`],
  /* badges only: how a creature is shown doing something */
  zzz: ['sleep', 'asleep', `<path d="M22 22h22L22 46h22M54 44h16L54 62h16M74 66h12L74 80h12" fill="none" stroke="#3949ab" stroke-width="6"/>`],
  speech: ['talking', 'talking', `<path d="M14 20h72v44H44L26 82l4-18H14z" fill="#fff8ec"/><circle cx="34" cy="42" r="5" fill="${O}"/><circle cx="50" cy="42" r="5" fill="${O}"/><circle cx="66" cy="42" r="5" fill="${O}"/>`],
  run: ['running', 'running away', `<path d="M10 30h40M4 50h50M14 70h36" fill="none" stroke="#e67e22" stroke-width="7"/><circle cx="74" cy="50" r="16" fill="#d7ccc8"/><circle cx="86" cy="64" r="10" fill="#d7ccc8"/>`],
};
/* Specials: two creatures side by side, and the Bremen animals standing on one another's backs. */
const SPECIAL = {
  twomice: { label: 'two mice', pair: ['fieldmouse', 'coachmouse'] },
  stack: { label: 'a donkey, a dog, a cat and a rooster standing on one another', stack: ['donkey', 'moorhound', 'hodge', 'chauntecleer'] },
};
export const BADGES = Object.keys(DRAW);
/* A picture key: an avatar ('lion'), a drawing ('tree'), a special ('stack'), or a creature or drawing
   with a badge ('lion+zzz' — the lion, asleep). */
export function pic(key) {
  const [b, badge] = String(key).split('+');
  const base = AV[b] ? { av: AV[b][0], label: AV[b][1] } : DRAW[b] ? { svg: svg(DRAW[b][2]), label: DRAW[b][0] } : SPECIAL[b] ? { ...SPECIAL[b] } : null;
  if (!base) return null;
  if (!badge) return { key, ...base };
  if (!DRAW[badge]) return null;
  return { key, ...base, badge: svg(DRAW[badge][2]), label: `${base.label}, ${DRAW[badge][1]}` };
}
/* what a picture is OF, for "are the pictures distinct?": the base image and its badge */
export const picBase = (key) => String(key).split('+')[0];

/* ---------- the stories (authored; every `holds` is an exact substring of what is read) ---------- */
/* id · passage · scenes [from, to] · level · questions. A question: kind, the words spoken (`ask`), the
   pictures (the right one FIRST, then three that are wrong in this story), and the words that hold it.
   An order question: `seq` (three pictures in the order they happen) and one `holds` for each. */
const Q = (kind, ask, pics, holds) => ({ kind, ask, pics, holds });
const ORD = (seq, holds, ask = 'Tap the three pictures in the order they happened: first, next, last.') => ({ kind: 'order', ask, seq, holds });
export const STORIES = [
  // ── level 1: two or three sentences; who and where ──────────────────────────
  { id: 'l1-lion', passage: 'aesop-lion-mouse', scenes: [0, 0], level: 1, qs: [
    Q('who', 'Who was asleep at the start of the story?', ['lion', 'tortoise', 'donkey', 'frog'], 'Once when a Lion was asleep'),
    Q('who', 'Who ran up and down on the sleeping animal?', ['mouse', 'hare', 'cat', 'crow'], 'a little Mouse began running up and down upon him'),
  ] },
  { id: 'l1-wood', passage: 'grimm-musicians', scenes: [0, 0], level: 1, qs: [
    Q('where', 'Where did the animals go to sleep when night came?', ['wood', 'house', 'boat', 'castle'], 'they went into a wood to sleep'),
    Q('who', 'Who climbed up into the branches?', ['cat', 'donkey', 'lion', 'frog'], 'the cat climbed up into the branches'),
    Q('who', 'Who flew up to the very top of the tree?', ['rooster', 'donkey', 'dog', 'tortoise'], 'flew up to the very top of the tree'),
  ] },
  { id: 'l1-spring', passage: 'grimm-frog-prince', scenes: [0, 0], level: 1, qs: [
    Q('where', 'Where did the princess go for a walk?', ['wood', 'town', 'beach', 'mountain'], 'went out to take a walk by herself in a wood'),
    Q('where', 'Where did she sit down to rest?', ['pond', 'fire', 'bed', 'boat'], 'when she came to a cool spring of water'),
  ] },
  { id: 'l1-mice', passage: 'aesop-town-mouse', scenes: [1, 1], level: 1, qs: [
    Q('where', 'Where did the two mice go together?', ['town', 'wood', 'beach', 'mountain'], 'the two mice set off for the town'),
    Q('who', 'Who ate up jellies and cakes in the grand room?', ['twomice', 'dog', 'cat', 'lion'], 'the two mice were eating up jellies and cakes'),
  ] },
  { id: 'l1-ropes', passage: 'aesop-lion-mouse', scenes: [3, 3], level: 1, qs: [
    Q('who', 'Who came along and bit through the ropes?', ['mouse', 'crow', 'hare', 'elephant'], 'soon gnawed away the ropes'),
    Q('who', 'Who was tied up with the ropes?', ['lion', 'frog', 'goose', 'crab'], 'seeing the sad plight in which the Lion was'),
  ] },
  { id: 'l1-tree', passage: 'aesop-lion-mouse', scenes: [1, 2], level: 1, qs: [
    Q('who', 'Who was caught in a trap?', ['lion', 'mouse', 'hare', 'goose'], 'the Lion was caught in a trap'),
    Q('where', 'Where did the hunters tie him?', ['tree', 'house', 'boat', 'pond'], 'tied him to a tree'),
  ] },
  { id: 'l1-promise', passage: 'grimm-frog-prince', scenes: [3, 3], level: 1, qs: [
    Q('who', 'Who did the princess think was silly?', ['frog', 'goose', 'cat', 'mole'], 'this silly frog is talking'),
    Q('where', 'Where did she think he could never get out of?', ['pond', 'tree', 'house', 'boat'], 'He can never even get out of the spring'),
  ] },
  { id: 'l1-bank', passage: 'alice-rabbit-hole', scenes: [0, 1], level: 1, qs: [
    Q('where', 'Where was Alice sitting at the start?', ['bank', 'boat', 'castle', 'town'], 'sitting by her sister on the bank'),
    Q('who', 'Who ran close by her?', ['wrabbit', 'dog', 'frog', 'hen'], 'a White Rabbit with pink eyes ran close by her'),
  ] },

  // ── level 2: four or five sentences; + what happened ────────────────────────
  { id: 'l2-trap', passage: 'aesop-lion-mouse', scenes: [2, 3], level: 2, qs: [
    Q('what', 'What caught the Lion?', ['trap', 'ball', 'cake', 'umbrella'], 'the Lion was caught in a trap'),
    Q('where', 'Where did the hunters tie him?', ['tree', 'house', 'boat', 'pond'], 'tied him to a tree'),
    Q('what', 'What did the little animal bite through?', ['rope', 'cheese', 'ball', 'shoe'], 'gnawed away the ropes'),
  ] },
  { id: 'l2-race', passage: 'aesop-hare-tortoise', scenes: [1, 1], level: 2, qs: [
    Q('who', 'Who said, “I accept your challenge”?', ['tortoise', 'hare', 'lion', 'mouse'], 'The Tortoise said quietly, "I accept your challenge."'),
    Q('who', 'Who said he could dance round the other all the way?', ['hare', 'tortoise', 'donkey', 'frog'], '"That is a good joke," said the Hare'),
    Q('what', 'What did the two of them agree to have?', ['flag', 'cake', 'boat', 'book'], 'Shall we race?'),
  ] },
  { id: 'l2-cat', passage: 'alice-cheshire', scenes: [2, 2], level: 2, qs: [
    Q('who', 'Which animal did the Cat say lives nearby?', ['marchhare', 'tortoise', 'lion', 'elephant'], 'lives a March Hare'),
    Q('what', 'What did the Cat wave round to show the way?', ['paw', 'umbrella', 'flag', 'book'], 'waving its right paw round'),
    Q('who', 'Who was Alice talking to?', ['ccat', 'frog', 'mole', 'dog'], "the Cat said, waving its right paw round"),
  ] },
  { id: 'l2-toto', passage: 'oz-cyclone', scenes: [2, 2], level: 2, qs: [
    Q('who', 'Who jumped out of Dorothy’s arms?', ['toto', 'cat', 'wrabbit', 'hen'], "Toto jumped out of Dorothy's arms"),
    Q('where', 'Where did he hide?', ['bed', 'tree', 'boat', 'table'], 'hid under the bed'),
    Q('what', 'What made the house shake so hard?', ['wind', 'elephant', 'drum', 'ball'], 'there came a great shriek from the wind, and the house shook so hard'),
  ] },
  { id: 'l2-ball', passage: 'grimm-frog-prince', scenes: [0, 1], level: 2, qs: [
    Q('what', 'What did the princess have in her hand?', ['ball', 'book', 'umbrella', 'kite'], 'she had a golden ball in her hand'),
    Q('where', 'Where did it fall?', ['pond', 'tree', 'bed', 'fire'], 'till at last it fell down into the spring'),
    Q('what', 'What did she say she would give to get it back?', ['gem', 'cake', 'shoe', 'kite'], 'I would give all my fine clothes and jewels'),
  ] },
  { id: 'l2-frog', passage: 'grimm-frog-prince', scenes: [2, 2], level: 2, qs: [
    Q('who', 'Who put its head out of the water?', ['frog', 'goose', 'crab', 'seal'], 'a frog put its head out of the water'),
    Q('where', 'Where had the golden ball fallen?', ['pond', 'tree', 'bed', 'fire'], 'My golden ball has fallen into the spring'),
    Q('what', 'What did the frog want to eat from?', ['plate', 'hat', 'boat', 'kite'], 'eat from off your golden plate'),
  ] },
  { id: 'l2-shoes', passage: 'grimm-elves', scenes: [1, 1], level: 2, qs: [
    Q('what', 'What did the shoemaker find ready in the morning?', ['shoe', 'cake', 'hat', 'ball'], 'there stood the shoes all ready made'),
    Q('where', 'Where were they standing?', ['table', 'bed', 'tree', 'boat'], 'upon the table'),
  ] },

  // ── level 3: a paragraph; + order three pictures ────────────────────────────
  { id: 'l3-garden', passage: 'peterrabbit-garden', scenes: [1, 2], level: 3, qs: [
    ORD(['berries', 'lettuce', 'parsley'], ['went down the lane to gather blackberries', 'First he ate some lettuces', 'he went to look for some parsley']),
    Q('where', 'Where did Peter run straight away?', ['garden', 'wood', 'beach', 'town'], "ran straight away to Mr. McGregor's garden"),
    Q('what', 'What did Peter eat first?', ['lettuce', 'cake', 'fish', 'cheese'], 'First he ate some lettuces'),
    Q('what', 'What did the three good bunnies go to gather?', ['berries', 'lettuce', 'apple', 'flower'], 'went down the lane to gather blackberries'),
  ] },
  { id: 'l3-lion', passage: 'aesop-lion-mouse', scenes: [0, 3], level: 3, qs: [
    ORD(['lion+zzz', 'lion+trap', 'mouse+rope'], ['Once when a Lion was asleep', 'the Lion was caught in a trap', 'soon gnawed away the ropes']),
    Q('who', 'Who lifted up a paw and let the other go?', ['lion', 'mouse', 'tortoise', 'crow'], 'he lifted up his paw and let him go'),
    Q('what', 'What did the hunters go to look for?', ['cart', 'boat', 'ball', 'cake'], 'went in search of a waggon to carry him on'),
  ] },
  { id: 'l3-race', passage: 'aesop-hare-tortoise', scenes: [1, 2], level: 3, qs: [
    ORD(['tortoise+speech', 'hare+zzz', 'tortoise+flag'], ['The Tortoise said quietly, "I accept your challenge."', 'lay down to have a nap', 'saw the Tortoise just near the winning-post']),
    Q('who', 'Who lay down to have a nap?', ['hare', 'tortoise', 'lion', 'donkey'], 'lay down to have a nap'),
    Q('who', 'Who was near the winning post when the other one woke up?', ['tortoise', 'hare', 'mouse', 'frog'], 'he saw the Tortoise just near the winning-post'),
  ] },
  { id: 'l3-light', passage: 'grimm-musicians', scenes: [0, 1], level: 3, qs: [
    ORD(['tree', 'rooster+lamp', 'house'], ['they went into a wood to sleep', 'he saw afar off something bright and shining', 'came close to a house']),
    Q('what', 'What did the rooster see far away?', ['lamp', 'kite', 'cake', 'boat'], 'There must be a house no great way off, for I see a light'),
    Q('who', 'Who wanted a bone or a bit of meat?', ['dog', 'cat', 'rooster', 'donkey'], "added the dog, 'I should not be the worse for a bone or two"),
  ] },
  { id: 'l3-net', passage: 'peterrabbit-garden', scenes: [2, 3], level: 3, qs: [
    ORD(['garden', 'shoe', 'net'], ['whom should he meet but Mr. McGregor', 'He lost one of his shoes among the cabbages', 'run into a gooseberry net']),
    Q('what', 'What did Peter lose among the cabbages?', ['shoe', 'jacket', 'umbrella', 'kite'], 'He lost one of his shoes among the cabbages'),
    Q('what', 'What did Peter run into and get caught in?', ['net', 'trap', 'boat', 'cart'], 'run into a gooseberry net, and got caught'),
  ] },
  { id: 'l3-cyclone', passage: 'oz-cyclone', scenes: [3, 4], level: 3, qs: [
    ORD(['house+wind', 'balloon', 'cradle'], ['The house whirled around two or three times', 'as if she were going up in a balloon', 'like a baby in a cradle']),
    Q('what', 'What did Dorothy feel she was going up in?', ['balloon', 'boat', 'cart', 'ladder'], 'Dorothy felt as if she were going up in a balloon'),
    Q('what', 'What did she feel rocked gently like?', ['cradle', 'ball', 'kite', 'drum'], 'she felt as if she were being rocked gently, like a baby in a cradle'),
  ] },
  { id: 'l3-frog', passage: 'grimm-frog-prince', scenes: [2, 4], level: 3, qs: [
    ORD(['frog+speech', 'frog+ball', 'house'], ['a frog put its head out of the water', 'he came up again, with the ball in his mouth', 'ran home with it as fast as she could']),
    Q('what', 'What did the frog bring up in his mouth?', ['ball', 'shoe', 'fish', 'cake'], 'he came up again, with the ball in his mouth'),
    Q('who', 'Who called, “Stay, princess, and take me with you”?', ['frog', 'goose', 'mouse', 'cat'], 'The frog called after her'),
  ] },
  { id: 'l3-hole', passage: 'alice-rabbit-hole', scenes: [0, 4], level: 3, qs: [
    ORD(['book', 'wrabbit+watch', 'hole'], ['peeped into the book her sister was reading', 'TOOK A WATCH OUT OF ITS WAISTCOAT-POCKET', 'pop down a large rabbit-hole under the hedge']),
    Q('what', 'What did the Rabbit take out of its pocket?', ['watch', 'key', 'carrot', 'cake'], 'TOOK A WATCH OUT OF ITS WAISTCOAT-POCKET'),
    Q('where', 'Where did the Rabbit go?', ['hole', 'tree', 'house', 'boat'], 'pop down a large rabbit-hole under the hedge'),
  ] },

  // ── level 4: two paragraphs; + what happened next ───────────────────────────
  { id: 'l4-dogs', passage: 'aesop-town-mouse', scenes: [1, 2], level: 4, qs: [
    Q('where', 'Where did the two mice find the remains of a fine feast?', ['feast', 'wood', 'beach', 'boat'], 'took his friend into the grand dining-room'),
    Q('who', 'Who came in when the door flew open?', ['bigdog', 'cat', 'lion', 'rooster'], 'in came two huge mastiffs'),
    Q('next', 'What did the mice do right after the door flew open?', ['twomice+run', 'twomice+cake', 'twomice+zzz', 'twomice+note'], 'the two mice had to scamper down and run off'),
    ORD(['twomice+cake', 'bigdog+speech', 'twomice+run'], ['the two mice were eating up jellies and cakes', 'Suddenly they heard growling and barking', 'the two mice had to scamper down and run off']),
  ] },
  { id: 'l4-robbers', passage: 'grimm-musicians', scenes: [1, 3], level: 4, qs: [
    Q('who', 'Who was the tallest, and peeped in at the window?', ['donkey', 'dog', 'cat', 'rooster'], 'The ass, being the tallest of the company, marched up to the window and peeped in'),
    ORD(['lamp', 'feast', 'stack'], ['I see a light', 'I see a table spread with all kinds of good things', 'the cock flew up and sat upon the cat\'s head']),
    Q('next', 'What did the animals do right after they made their music?', ['window', 'tree', 'boat', 'pond'], 'they all broke through the window at once'),
  ] },
  { id: 'l4-peter', passage: 'peterrabbit-garden', scenes: [1, 3], level: 4, qs: [
    ORD(['lettuce', 'garden', 'net'], ['First he ate some lettuces', 'whom should he meet but Mr. McGregor', 'run into a gooseberry net']),
    Q('next', 'What did Mr. McGregor do right after he saw Peter?', ['rake', 'umbrella', 'kite', 'flag'], 'he jumped up and ran after Peter, waving a rake'),
    Q('what', 'What did Peter go to look for when he felt sick?', ['parsley', 'lettuce', 'cake', 'carrot'], 'he went to look for some parsley'),
  ] },
  { id: 'l4-cellar', passage: 'oz-cyclone', scenes: [1, 2], level: 4, qs: [
    Q('where', 'Where did Uncle Henry run to look after the stock?', ['barn', 'wood', 'beach', 'town'], 'he ran toward the sheds where the cows and horses were kept'),
    Q('what', 'What did Uncle Henry say was coming?', ['wind', 'cart', 'drum', 'boat'], "There's a cyclone coming, Em"),
    Q('next', 'What did Toto do right after Aunt Em called, “Run for the cellar”?', ['toto+bed', 'toto+ladder', 'toto+tree', 'toto+boat'], "Toto jumped out of Dorothy's arms and hid under the bed"),
    ORD(['barn', 'toto+bed', 'ladder'], ['he ran toward the sheds', 'hid under the bed', 'climbed down the ladder']),
  ] },

  // ── level 5: a whole story; + why ───────────────────────────────────────────
  { id: 'l5-race', passage: 'aesop-hare-tortoise', scenes: [0, 2], level: 5, qs: [
    Q('who', 'Who was boasting at the start?', ['hare', 'tortoise', 'lion', 'mouse'], 'The Hare was once boasting of his speed'),
    ORD(['hare+speech', 'hare+zzz', 'tortoise+flag'], ['The Hare was once boasting of his speed', 'lay down to have a nap', 'saw the Tortoise just near the winning-post']),
    Q('why', 'Why did the Hare lose the race?', ['hare+zzz', 'hare+trap', 'hare+cake', 'hare+cloud'], 'lay down to have a nap'),
    Q('next', 'What did the Hare see right after he woke from his nap?', ['tortoise+flag', 'tortoise+zzz', 'lion', 'cart'], 'he saw the Tortoise just near the winning-post'),
  ] },
  { id: 'l5-mice', passage: 'aesop-town-mouse', scenes: [0, 2], level: 5, qs: [
    Q('what', 'What food did the Country Mouse have to offer?', ['cheese', 'cake', 'fish', 'apple'], 'Beans and bacon, cheese and bread'),
    ORD(['field', 'twomice+cake', 'bigdog'], ['went on a visit to his cousin in the country', 'the two mice were eating up jellies and cakes', 'in came two huge mastiffs']),
    Q('why', 'Why did the Country Mouse leave so soon?', ['bigdog', 'bread', 'bed', 'umbrella'], 'I do not like that music at my dinner'),
    Q('next', 'What did the two mice do right after they reached the town?', ['twomice+cake', 'twomice+zzz', 'twomice+run', 'twomice+note'], 'There they found the remains of a fine feast'),
  ] },
  { id: 'l5-peter', passage: 'peterrabbit-garden', scenes: [0, 4], level: 5, qs: [
    Q('what', 'What did old Mrs. Rabbit buy at the baker’s?', ['bread', 'fish', 'cheese', 'apple'], 'She bought a loaf of brown bread'),
    Q('who', 'Who heard Peter crying and flew to him?', ['birds', 'cat', 'frog', 'mouse'], 'his sobs were overheard by some friendly sparrows'),
    ORD(['lettuce', 'net', 'jacket'], ['First he ate some lettuces', 'run into a gooseberry net', 'leaving his jacket behind him']),
    Q('why', 'Why did Peter leave his jacket behind?', ['net', 'cloud', 'fire', 'cake'], 'got caught by the large buttons on his jacket'),
  ] },
  { id: 'l5-musicians', passage: 'grimm-musicians', scenes: [0, 3], level: 5, qs: [
    Q('who', 'Who sat on top of the cat’s head?', ['rooster', 'dog', 'donkey', 'mouse'], "the cock flew up and sat upon the cat's head"),
    ORD(['tree', 'stack', 'window'], ['they went into a wood to sleep', 'the dog got upon his back', 'they all broke through the window at once']),
    Q('why', 'Why did the robbers run away?', ['note', 'fire', 'cloud', 'bigdog'], 'The robbers, who had been not a little frightened by the opening concert'),
    Q('next', 'What did the animals do right after they climbed on one another?', ['note', 'boat', 'tree', 'bed'], 'they began their music'),
  ] },
  { id: 'l5-frog', passage: 'grimm-frog-prince', scenes: [0, 4], level: 5, qs: [
    ORD(['ball', 'frog+speech', 'house'], ['she had a golden ball in her hand', 'a frog put its head out of the water', 'ran home with it as fast as she could']),
    Q('why', 'Why was the princess crying?', ['pond+ball', 'shoe', 'cloud', 'dog'], 'the ball bounded away, and rolled along upon the ground, till at last it fell down into the spring'),
    Q('who', 'Who dived deep under the water?', ['frog', 'goose', 'seal', 'crab'], 'Then the frog put his head down, and dived deep under the water'),
    Q('next', 'What did the princess do right after she got her ball back?', ['house', 'pond', 'tree', 'boat'], 'ran home with it as fast as she could'),
  ] },
];

export const story = (id) => STORIES.find((s) => s.id === id) || null;
export const storiesAt = (level) => STORIES.filter((s) => s.level === clampLevel(level));
export const clampLevel = (l) => Math.max(1, Math.min(MAX_LEVEL, Math.round(+l || 1)));

/* ---------- the text ---------- */
/* the narrator's text, cleaned as tools/voice/clips.mjs cleans it (so a held substring is what she says) */
export const cleanText = (s) => String(s || '').replace(/\[Illustration[^\]]*\]/gi, '').replace(/_/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
/* the passage's own sentences: a full stop, ! or ? (and any closing quote) before a capital or an opening quote */
export function sentences(text) {
  return cleanText(text).split(/(?<=[.!?]["”’')]?)\s+(?=["“‘'(]?[A-Z])/).map((s) => s.trim()).filter(Boolean);
}
/* passages: { id: { scenes: [...] } } (data/passages.json, keyed) */
export function storyScenes(st, passages) {
  const p = passages?.[st.passage]; if (!p) return [];
  const sc = p.scenes || [p.text], [a, b] = st.scenes;
  return sc.slice(a, b + 1).map((t, j) => ({ key: `st/${st.passage}-${a + j}`, text: cleanText(t), n: a + j }));
}
export const storyText = (st, passages) => storyScenes(st, passages).map((s) => s.text).join(' ');
/* the sentence that holds a question's answer, and the scene clip it is in */
export function holdingSentence(st, passages, holds) {
  for (const sc of storyScenes(st, passages)) {
    if (!sc.text.includes(holds)) continue;
    const ss = sentences(sc.text), at = sc.text.indexOf(holds);
    let pos = 0;
    for (const s of ss) { const i = sc.text.indexOf(s, pos); if (i <= at && at < i + s.length) return { key: sc.key, scene: sc.text, sentence: s, i }; pos = i + s.length; }
    return { key: sc.key, scene: sc.text, sentence: ss[ss.length - 1] || sc.text, i: 0 };
  }
  return null;
}
/* Where a sentence falls inside its scene's clip, as fractions of the clip's speech — each word weighted by
   its length, as narrate.js lights words. Snapped to the quiet between sentences by `quietNear`. */
export function sentenceWindow(scene, sentence) {
  const words = [...String(scene).matchAll(/[A-Za-z][A-Za-z'’-]*/g)], w = words.map((m) => 1 + m[0].length * 0.18), total = w.reduce((a, b) => a + b, 0) || 1;
  const at = scene.indexOf(sentence); if (at < 0) return [0, 1];
  const end = at + sentence.length; let a = 0, b = 0;
  words.forEach((m, i) => { if (m.index < at) a += w[i]; if (m.index < end) b += w[i]; });
  return [a / total, b / total];
}
/* the quietest frame within `radius` seconds of t, from an RMS envelope sampled every `hop` seconds */
export function quietNear(rms, hop, t, radius = 0.6) {
  if (!rms?.length) return t;
  const lo = Math.max(0, Math.floor((t - radius) / hop)), hi = Math.min(rms.length - 1, Math.ceil((t + radius) / hop));
  let best = Math.round(t / hop), bv = Infinity;
  for (let i = lo; i <= hi; i++) { const v = rms[i] + Math.abs(i * hop - t) * 1e-4; if (v < bv) { bv = v; best = i; } }
  return Math.max(0, best * hop);
}

/* ---------- a run ---------- */
/* The questions of one story, ready to show: options permuted from the play ordinal (`ord`), so a slot never
   leans and a replay does not sit the answer where it sat before. L1 shows three pictures, later levels four. */
export function buildQuestions(st, ord = 0, level = st.level) {
  const n = LEVELS[clampLevel(level)].opts;
  return st.qs.map((q, j) => {
    const id = `ears:${st.id}:${j}:${ord + j}`;
    if (q.kind === 'order') {
      let opts = shuffle(rng(id), q.seq.map((_, i) => i));
      if (opts.every((x, i) => x === i)) opts = [opts[1], opts[2], opts[0]];
      return { id, story: st.id, kind: 'order', ask: q.ask, options: opts.map((i) => q.seq[i]), order: q.seq.map((_, i) => opts.indexOf(i)), holds: q.holds };
    }
    const { options, answer } = permute(id, q.pics.slice(0, n));
    return { id, story: st.id, kind: q.kind, ask: q.ask, options, answer, holds: q.holds };
  });
}
/* Which stories a run tells: never heard first, then one missed whose day's gap is over, then the least
   recently heard — never the same story twice in a run. Deterministic given (level, rec, seed, now). */
export const GAP = 864e5;
export function drawStories(level, rec = {}, seed = '', now = Date.now()) {
  const pool = storiesAt(level), heard = rec.heard || {}, want = Math.min(LEVELS[clampLevel(level)].stories, pool.length);
  const tie = (s) => hash(seed + '~' + s.id);
  const fresh = shuffle(rng('ears-draw:' + seed), pool.filter((s) => !heard[s.id]));
  const due = pool.filter((s) => heard[s.id]?.miss && now - heard[s.id].last >= GAP).sort((a, b) => heard[a.id].last - heard[b.id].last || tie(a) - tie(b));
  const rest = pool.filter((s) => heard[s.id] && !due.includes(s)).sort((a, b) => heard[a.id].last - heard[b.id].last || tie(a) - tie(b));
  const order = [...due.slice(0, 1), ...fresh, ...due.slice(1), ...rest];
  return [...new Set(order)].slice(0, want);
}
export function earsNew(level, rec = {}, seed = '', now = Date.now()) {
  const L = clampLevel(level), ord = (rec.runs || 0) * 7;
  const picked = drawStories(L, rec, seed, now);
  let o = ord;
  const stories = picked.map((st) => { const qs = buildQuestions(st, o, L); o += qs.length; return { id: st.id, qs }; });
  return { level: L, seed, stories, si: 0, qi: 0, phase: 'listen', heard: false, listens: LISTENS, placed: [], picked: null, results: [] };
}
export const curStory = (run) => run.stories[run.si];
export const curQ = (run) => curStory(run)?.qs[run.qi] || null;
export const totalQs = (run) => run.stories.reduce((a, s) => a + s.qs.length, 0);

/* The reducer: (run, action) → run. Actions: listen (a play of the story begins — one of the listens),
   heard (it played to the end), pick i, place i, undo, next, story (on to the next story). A question has one
   try: right advances, wrong holds on the item until `next`, with the answer shown. */
export function earsStep(run, a) {
  const r = { ...run };
  const q = curQ(r);
  switch (a.t) {
    case 'listen':
      if (r.listens <= 0 || (r.phase !== 'listen' && r.phase !== 'ask')) return run;
      return { ...r, listens: r.listens - 1 };
    case 'heard':
      return r.phase === 'listen' ? { ...r, heard: true, phase: 'ask' } : run;
    case 'pick': {
      if (r.phase !== 'ask' || !q || q.kind === 'order' || !(a.i >= 0 && a.i < q.options.length)) return run;
      const ok = a.i === q.answer;
      return { ...r, picked: a.i, phase: ok ? 'right' : 'miss', results: [...r.results, { id: q.id, story: q.story, kind: q.kind, ok }] };
    }
    case 'place': {
      if (r.phase !== 'ask' || !q || q.kind !== 'order' || !(a.i >= 0 && a.i < q.options.length) || r.placed.includes(a.i)) return run;
      const placed = [...r.placed, a.i];
      if (placed.length < q.options.length) return { ...r, placed };
      const ok = placed.every((x, i) => x === q.order[i]);
      return { ...r, placed, phase: ok ? 'right' : 'miss', results: [...r.results, { id: q.id, story: q.story, kind: q.kind, ok }] };
    }
    case 'undo':
      return r.phase === 'ask' && r.placed.length ? { ...r, placed: r.placed.slice(0, -1) } : run;
    case 'next': {
      if (r.phase !== 'right' && r.phase !== 'miss') return run;
      const st = curStory(r);
      if (r.qi + 1 < st.qs.length) return { ...r, qi: r.qi + 1, phase: 'ask', picked: null, placed: [] };
      return { ...r, phase: r.si + 1 < r.stories.length ? 'between' : 'done', picked: null, placed: [] };
    }
    case 'story':
      return r.phase === 'between' ? { ...r, si: r.si + 1, qi: 0, phase: 'listen', heard: false, listens: LISTENS, picked: null, placed: [] } : run;
    default: return run;
  }
}
/* the first wrong place in an order answer: its evidence is what a miss replays */
export function orderSlip(q, placed) { const i = placed.findIndex((x, j) => x !== q.order[j]); return i < 0 ? 0 : i; }
export const missHolds = (q, placed = []) => (q.kind === 'order' ? q.holds[orderSlip(q, placed)] : q.holds);

/* ---------- scoring, levels, pay ---------- */
export function earsScore(run) { const right = run.results.filter((x) => x.ok).length, total = run.results.length; return { right, total, pct: total ? right / total : null }; }
export const starsOf = (pct) => (pct == null || pct < PASS ? 0 : pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1);
/* the owner's rule (§1.4): 80% up one, under 50% down one (floor 1), between holds; nothing answered moves nothing */
export function nextEarsLevel(level, pct) {
  const l = clampLevel(level);
  if (pct == null || Number.isNaN(pct)) return l;
  if (pct >= UP) return Math.min(MAX_LEVEL, l + 1);
  if (pct < PASS) return Math.max(1, l - 1);
  return l;
}
/* The record is k.games.ears, the same shape as every Play game's (src/hubs.js): `level` is the app's (moved by
   the rule), `pick` a level the child set by hand, `top` the highest level ever reached. */
export const earsLevel = (rec = {}) => clampLevel((Number.isInteger(rec.pick) && rec.pick) || rec.level || 1);
/* the level chip: a number picks by hand (it sticks until the next check); 'auto' hands it back to the app */
export function earsSetLevel(rec, v) { rec.pick = v === 'auto' || v == null || v === '' ? null : clampLevel(v); return rec; }
/* what a run pays, from its results only: a coin a question right (first try, its only try) when the run
   reached 50%; the standard `stop` for a level reached for the FIRST time (choosing Level 1 again and
   again cannot farm level-ups — the rule src/hubs.js keeps for every game) */
export function earsPay(run, firstUp) {
  const s = earsScore(run);
  return { answer: s.pct != null && s.pct >= PASS ? s.right : 0, stop: firstUp ? 1 : 0 };
}
/* After a run: the level moves from the level PLAYED by the rule, the hand-set pick goes back to Auto, the
   stars and the stories heard are kept. Returns what the finish card says. */
export function earsFinish(rec, run, now = Date.now()) {
  const s = earsScore(run), before = run.level, stars = starsOf(s.pct), top = Math.max(1, rec.top || 1, clampLevel(rec.level || 1));
  const after = s.total ? nextEarsLevel(before, s.pct) : before;
  if (s.total) { rec.level = after; rec.pick = null; rec.top = Math.max(top, after); }
  rec.runs = (rec.runs || 0) + 1;
  rec.stars ||= {}; rec.stars[before] = Math.max(rec.stars[before] || 0, stars);
  rec.best = Math.max(rec.best || 0, s.right);
  rec.heard ||= {};
  const missBy = {};
  for (const st of run.stories) {
    const rs = run.results.filter((x) => x.story === st.id); if (!rs.length) continue;
    const miss = rs.some((x) => !x.ok); missBy[st.id] = rs.filter((x) => !x.ok).length;
    const h = rec.heard[st.id] || { n: 0 };
    rec.heard[st.id] = { n: h.n + 1, last: now, miss, perfect: !!h.perfect || !miss };
  }
  const missedMost = Object.entries(missBy).sort((a, b) => b[1] - a[1])[0];
  const kinds = [...new Set(run.results.map((x) => x.kind))], firstUp = after > top;
  return { ...s, before, after, stars, pay: earsPay(run, firstUp), kinds, missed: missedMost && missedMost[1] ? missedMost[0] : null, drop: after < before, up: after > before, firstUp };
}
/* the tree: one fruit per story ever heard, golden when every question of a hearing was right */
export const treeFruit = (rec = {}) => STORIES.filter((s) => rec.heard?.[s.id]).map((s) => ({ id: s.id, passage: s.passage, gold: !!rec.heard[s.id].perfect }));

/* For tools/voice (if recorded questions are ever wanted): every spoken question, by a stable key. */
export const earsClips = () => STORIES.flatMap((s) => s.qs.map((q, j) => ({ key: `ears/${s.id}-${j}`, text: q.ask })));
