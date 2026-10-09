/* avatars.js — Bizzing English's own 96 (FAMILY-STANDARD §8): 12 packs × 8, shaped 2 common ·
   3 rare · 2 epic · 1 legendary, two packs to each world. Creatures from the classics — fables,
   fairy tales, Carroll, Kipling, Grahame, Shakespeare, the Romantics, medieval margins — never
   a person, never a deity, and no face that is in a sibling app's 96. The painting prompts live
   in tools/art/avatars_prompts.py under the same ids (test/avatars.mjs holds the two together).
   Ownership lives in the child's record (store.js); the engine is integration/bizzing-avatars.js. */

const P = (pack, list) => list.map(([id, name, tier, ms]) => ({ id, name, pack, tier, art: `avatars/${id}.webp`, ...(ms ? { milestone: ms } : {}) }));
const M = (id, label) => ({ id, label });

export const PACK_NAMES = ['Fable Friends', 'Once Upon a Time', 'Study Pets', 'Baker Street', 'The Players', 'Storm and Spell',
  'The Orators', 'Debate Club', 'Illuminated Beasts', 'Word Beasts', 'Romantic Wildlife', 'Mist and Mountain'];

export const AVATARS = [
  ...P(1, [['tortoise', 'Steady Tortoise', 'common'], ['fieldmouse', 'Field Mouse', 'common'], ['hare', 'Racing Hare', 'rare'], ['crow', 'Clever Crow', 'rare'],
    ['ant', 'Busy Ant', 'rare'], ['lion', 'Gentle Lion', 'epic'], ['grasshopper', 'Fiddling Grasshopper', 'epic'],
    ['goldengoose', 'Golden Goose', 'legendary', M('word-2', 'Finish Word level 2')]]),
  ...P(2, [['crownfrog', 'Crowned Frog', 'common'], ['bearcub', 'Porridge Cub', 'common'], ['bootcat', 'Cat in Boots', 'rare'], ['redhen', 'Little Red Hen', 'rare'],
    ['nightcapwolf', 'Wolf in a Nightcap', 'rare'], ['coachmouse', 'Coach Mouse', 'epic'], ['stork', 'Chimney Stork', 'epic'],
    ['firebird', 'Firebird', 'legendary', M('sentence-2', 'Finish Sentence level 2')]]),
  ...P(3, [['bookworm', 'Bookworm', 'common'], ['candlemoth', 'Candle Moth', 'common'], ['inkbeetle', 'Ink Beetle', 'rare'], ['dormouse', 'Teacup Dormouse', 'rare'],
    ['bulldog', 'Bookend Bulldog', 'rare'], ['cheshire', 'Grinning Cat', 'epic'], ['marchhare', 'Hare in a Hat', 'epic'],
    ['toad', 'Toad in Goggles', 'legendary', M('word-4', 'Finish Word level 4')]]),
  ...P(4, [['terrier', 'Sleuth Terrier', 'common'], ['pigeon', 'Message Pigeon', 'common'], ['magnicat', 'Magnifying Cat', 'rare'], ['moorhound', 'Moor Hound', 'rare'],
    ['keyraven', 'Key Raven', 'rare'], ['fiddleferret', 'Fiddling Ferret', 'epic'], ['badger', 'Lantern Badger', 'epic'],
    ['mole', 'Mole Afloat', 'legendary', M('sentence-4', 'Finish Sentence level 4')]]),
  ...P(5, [['raccoon', 'Masked Raccoon', 'common'], ['pug', 'Jester Pug', 'common'], ['donkey', 'Rose-Crowned Donkey', 'rare'], ['shylion', 'Shy Stage Lion', 'rare'],
    ['turkey', 'Turkey in a Ruff', 'rare'], ['lanterndog', 'Moonshine Dog', 'epic'], ['stag', 'Oak-Crowned Stag', 'epic'],
    ['bear', 'Bear, Pursuing', 'legendary', M('word-6', 'Finish Word level 6')]]),
  ...P(6, [['gull', 'Sailor Gull', 'common'], ['crab', 'Pearl Crab', 'common'], ['parrot', 'Captain Parrot', 'rare'], ['petrel', 'Storm Petrel', 'rare'],
    ['greycat', 'Cauldron Cat', 'rare'], ['jeweltoad', 'Jewelled Toad', 'epic'], ['flyingfish', 'Flying Fish', 'epic'],
    ['lark', 'Dawn Lark', 'legendary', M('sentence-6', 'Finish Sentence level 6')]]),
  ...P(7, [['dove', 'Olive Dove', 'common'], ['parakeet', 'Podium Parakeet', 'common'], ['eagle', 'Laurel Eagle', 'rare'], ['goose', 'Alarm Goose', 'rare'],
    ['wolf', 'Steps Wolf', 'rare'], ['elephant', 'Toga Elephant', 'epic'], ['bull', 'Garland Bull', 'epic'],
    ['lyrebird', 'Golden Lyrebird', 'legendary', M('word-8', 'Finish Word level 8')]]),
  ...P(8, [['magpie', 'Chatty Magpie', 'common'], ['seal', 'Clapping Seal', 'common'], ['howler', 'Howler Monkey', 'rare'], ['woodpecker', 'Gavel Woodpecker', 'rare'],
    ['goat', 'Soapbox Goat', 'rare'], ['mynah', 'Mynah', 'epic'], ['orangutan', 'Pondering Orangutan', 'epic'],
    ['cockatoo', 'Crowned Cockatoo', 'legendary', M('sentence-8', 'Finish Sentence level 8')]]),
  ...P(9, [['scribecat', 'Scribe Cat', 'common'], ['armoursnail', 'Brave Snail', 'common'], ['swordrabbit', 'Margin Rabbit', 'rare'], ['trumpethare', 'Trumpet Hare', 'rare'],
    ['wyvern', 'Inkpot Wyvern', 'rare'], ['pelican', 'Emblem Pelican', 'epic'], ['islandwhale', 'Island Whale', 'epic'],
    ['ouroboros', 'Gold-Leaf Dragon', 'legendary', M('word-10', 'Finish Word level 10')]]),
  ...P(10, [['inkpup', 'Ink Pup', 'common'], ['porcupine', 'Quill Porcupine', 'common'], ['hodge', 'Dictionary Cat', 'rare'], ['chauntecleer', 'Chauntecleer', 'rare'],
    ['pressbeetle', 'Press Beetle', 'rare'], ['snark', 'Snark', 'epic'], ['bandersnatch', 'Bandersnatch', 'epic'],
    ['jabberwock', 'Jabberwock', 'legendary', M('sentence-10', 'Finish Sentence level 10')]]),
  ...P(11, [['lamb', 'Little Lamb', 'common'], ['robin', 'Garden Robin', 'common'], ['heron', 'Still Heron', 'rare'], ['cricket', 'Hearth Cricket', 'rare'],
    ['vole', 'Water Vole', 'rare'], ['albatross', 'Albatross', 'epic'], ['kingfisher', 'Kingfisher', 'epic'],
    ['tyger', 'Tyger', 'legendary', M('word-5', 'Finish Word level 5')]]),
  ...P(12, [['dipper', 'Stream Dipper', 'common'], ['herdwick', 'Fell Sheep', 'common'], ['highlandcow', 'Shaggy Cow', 'rare'], ['trout', 'Leaping Trout', 'rare'],
    ['osprey', 'Osprey', 'rare'], ['dragonfly', 'Lace Dragonfly', 'epic'], ['mountainhare', 'Mountain Hare', 'epic'],
    ['miststag', 'Mist Stag', 'legendary', M('sentence-5', 'Finish Sentence level 5')]]),
];
/* Quill, the app's own fox and its icon, is a free avatar for every child (owner, 5 Oct) — outside the family's
   96 (the twelve packs of eight keep their shape and validate() its rules), drawn first in the picker and the
   Collection. Its art is the mascot's waving sticker. */
export const QUILL = { id: 'quill', name: 'Quill', pack: 0, tier: 'common', art: 'avatars/quill.webp', own: true };
/* Mount Olympus, the Greek-myth pack (owner, 9 Oct 2026: "we need greek gods avatar pack"): eight figures
   from the myths, outside the family's 96 like Quill, in the pack shape (2 common · 3 rare · 2 epic · 1
   legendary) and sold in The Forum's world (world 4). The owner's request overrides English's "never a
   deity" rule for this pack only; none is a face a sibling already has (Bee has Zeus, Poseidon, Athena,
   Hades and Apollo). Prompts: tools/art/olympus_prompts.py. */
export const OLYMPUS_NAME = 'Mount Olympus';
export const OLYMPUS = [['iris', 'Iris of the Rainbow', 'common'], ['nike', 'Nike, Winged Victory', 'common'], ['hermes', 'Hermes the Messenger', 'rare'],
  ['demeter', 'Demeter of the Harvest', 'rare'], ['hephaestus', 'Hephaestus the Smith', 'rare'], ['artemis', 'Artemis of the Moon', 'epic'],
  ['persephone', 'Persephone of the Spring', 'epic'], ['hera', 'Hera, Queen of Olympus', 'legendary', M('word-7', 'Finish Word level 7 — words from the Greek myths')]]
  .map(([id, name, tier, ms]) => ({ id, name, pack: 13, packName: OLYMPUS_NAME, world: 4, tier, sacred: true, art: `avatars/${id}.webp`, ...(ms ? { milestone: ms } : {}) }));
export const ALL_AVATARS = [QUILL, ...AVATARS, ...OLYMPUS];
export const byId = (id) => ALL_AVATARS.find((a) => a.id === id);
/* the five a new child is offered in the welcome: Commons from the two free worlds */
export const STARTERS = ['quill', 'tortoise', 'crownfrog', 'bookworm', 'terrier'];   // Quill first; Field Mouse waits in the Collection, free
