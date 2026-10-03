/* deep.js — the Library's deep dives: the Greek myths as one journey, and the great authors one page
   each. Nothing here is new content about the world. Every fact on these pages is a FIELD that already
   exists (a work's year, its rights note, its `why` and `summary`, a passage's questions, a line of the
   hour, a Language stop's learn text) or a QUOTATION, exact, from a held and cleared text — the Who's
   who cards below say what each figure is ONLY in words the held passage (or Bulfinch's own book, for a
   Greek name beside a Roman one) already says. test/deep.mjs holds every quote to its text, scans this
   file for any year typed by hand, and draws every quiz.

   Greek and Roman names: Hawthorne and Bulfinch tell the Greek myths with the names the Romans gave the
   gods (Ceres, Juno, Minerva, Ulysses); Kingsley uses the Greek ones (Pallas Athené). Where a card gives
   both, the pairing is quoted from Bulfinch's own book ("Juno (Hera) was the wife of Jupiter"). */

import { WORKS, PASSAGES, LINES } from './library.js';
import { MYTH_PASSAGES } from './library-myths.js';
import { MYTH_WORDS, MYTH_WORD_STOPS } from './myth-words.js';
import { LANG_STOPS } from './language.js';
import { cleared } from './rights.js';
import { permute } from '../rand.js';

const work = (id) => WORKS.find((w) => w.id === id) || null;
const shipped = (p) => !!p && cleared(work(p.work));

/* ─────────────────────────── The Greek myths ─────────────────────────── */

/* The journey, in an order a child can follow: how troubles came into the world, then mortals who
   crossed the gods, then the heroes, the long voyage, wings, the underworld and the seasons, and the
   gods of the wild and of sleep. Only myths held as passages are stops (no Prometheus: none is held). */
export const MYTH_JOURNEY = [
  { id: 'beginning', title: 'The box', note: 'Where the old stories begin: a box given to two children to keep shut.', stops: ['wonderbook-pandora'] },
  { id: 'pride', title: 'Wishes, pride and the gods', note: 'Mortals who wished too much, talked too much, loved themselves too much, or dared a goddess.', stops: ['wonderbook-midas', 'bulfinch-arachne', 'bulfinch-echo', 'bulfinch-narcissus'] },
  { id: 'heroes', title: 'The heroes', note: 'A Gorgon, a labyrinth, the sky itself, and a fire-breathing monster.', stops: ['heroes-perseus', 'tanglewood-labyrinth', 'wonderbook-atlas', 'bulfinch-pegasus'] },
  { id: 'voyage', title: 'The voyage home', note: 'A ship, a song, and a captain tied to the mast.', stops: ['bulfinch-sirens'] },
  { id: 'wings', title: 'Wings', note: 'The man who planned the labyrinth makes wings for himself and his son.', stops: ['bulfinch-icarus'] },
  { id: 'underworld', title: 'The underworld and the seasons', note: 'The land of the dead, and a mother whose grief stops everything growing.', stops: ['bulfinch-tantalus', 'tanglewood-ceres'] },
  { id: 'wild', title: 'Gods of the wild and of sleep', note: 'A god of woods and flocks, and a cave where nothing makes a sound.', stops: ['bulfinch-pan', 'bulfinch-iris'] },
];
export const mythStops = () => MYTH_JOURNEY.flatMap((r) => r.stops);
export const mythPassage = (id) => MYTH_PASSAGES.find((p) => p.id === id && shipped(p)) || null;

/* A word is shown with its myth unless its own entry asks a reviewer to confirm the link first
   (myth-words.js: nemesis — "A reviewer should confirm before the passage is linked to the word on screen"). */
export const heldBack = (m) => !m.quote || /confirm before the passage is linked/i.test(m.note || '');   // no quotation from the held text: not shown either
export const mythWords = (pid) => MYTH_WORDS.filter((m) => m.passage === pid && !heldBack(m));
export const WORD7 = MYTH_WORD_STOPS.map((s) => ({ id: s.id, title: s.title, band: s.band }));

/* Who's who — every `quote` is exact in the passage named (passages.json, the held text), and `fact`
   says no more than the quote does. `greek` pairs a Roman name with the Greek one, quoted from
   Bulfinch's own book (held text, work 'bulfinch'). */
const B = 'bulfinch';
export const WHO = [
  // the gods
  { name: 'Juno', group: 'gods', fact: 'Queen of the gods. She punished Echo for her talk.', quote: 'When Juno discovered it, she passed sentence upon Echo', passage: 'bulfinch-echo',
    greek: { name: 'Hera', quote: 'Juno (Hera) was the wife of Jupiter, and queen of the gods.', work: B } },
  { name: 'Minerva', group: 'gods', fact: 'The goddess of wisdom. Arachne challenged her to a weaving contest.', quote: 'Let Minerva try her skill with mine', passage: 'bulfinch-arachne',
    greek: { name: 'Pallas Athene', quote: 'Minerva (Pallas, Athene), the goddess of wisdom', work: B }, also: { quote: 'within it appeared Pallas Athené', passage: 'heroes-perseus', say: 'Kingsley, who uses the Greek names, calls her Pallas Athené when she comes to Perseus.' } },
  { name: 'Ceres', group: 'gods', fact: 'She looked after agriculture. While her daughter was lost, she let nothing grow.', quote: 'not a stalk of grain, nor a blade of grass', passage: 'tanglewood-ceres',
    greek: { name: 'Demeter', quote: 'Ceres (Demeter) was the daughter of Saturn and Rhea.', work: B }, also: { quote: 'Ceres presided over agriculture.', work: B } },
  { name: 'Proserpina', group: 'gods', fact: 'Ceres’s lost daughter. Hawthorne calls her Proserpina; Bulfinch, Proserpine.', quote: 'her heart was a little lightened of its grief for Proserpina', passage: 'tanglewood-ceres',
    greek: { name: 'Persephone', as: 'Proserpine', quote: 'daughter named Proserpine (Persephone)', work: B } },
  { name: 'Diana', group: 'gods', fact: 'A goddess of the chase. Echo hunted with her.', quote: 'She was a favorite of Diana, and attended her in the chase.', passage: 'bulfinch-echo',
    greek: { name: 'Artemis', quote: 'brother of Diana (Artemis)', work: B } },
  { name: 'Iris', group: 'gods', fact: 'The goddess of the rainbow and Juno’s messenger. She carries Juno’s message to the cave of Sleep.', quote: 'Juno sends you her commands', passage: 'bulfinch-iris',
    also: { quote: 'Iris, the goddess of the rainbow, was her attendant and messenger.', work: B } },
  { name: 'Somnus', group: 'gods', fact: 'A god who lies asleep in a silent cave.', quote: 'a mountain cave is the abode of the dull god Somnus', passage: 'bulfinch-iris',
    also: { quote: 'There the god reclines, his limbs relaxed with sleep.', passage: 'bulfinch-iris' } },
  { name: 'Morpheus', group: 'gods', fact: 'One of the sons of Somnus, the best at copying how people look, walk and speak.', quote: 'Morpheus,--the most expert in counterfeiting forms', passage: 'bulfinch-iris',
    also: { quote: 'Somnus called one of his numerous sons', passage: 'bulfinch-iris' } },
  { name: 'Pan', group: 'gods', fact: 'The god of woods and fields, of flocks and shepherds. He invented the shepherd’s pipe.', quote: 'Pan, the god of woods and fields, of flocks and shepherds', passage: 'bulfinch-pan',
    also: { quote: 'the inventor of the syrinx, or shepherd\'s pipe', passage: 'bulfinch-pan' } },
  // the heroes
  { name: 'Perseus', group: 'heroes', fact: 'The goddess asks him to face Medusa the Gorgon, and he answers: try me.', quote: 'Dare you brave Medusa the Gorgon?', passage: 'heroes-perseus' },
  { name: 'Theseus', group: 'heroes', fact: 'He went into the labyrinth with a sword in one hand and a silken string in the other.', quote: 'So the young man took the end of the silken string in his left hand', passage: 'tanglewood-labyrinth' },
  { name: 'Hercules', group: 'heroes', fact: 'A remarkably strong man, who took the sky on his shoulders while Atlas fetched the apples.', quote: 'Hercules, as you must be careful to remember, was a remarkably strong man', passage: 'wonderbook-atlas' },
  { name: 'Bellerophon', group: 'heroes', fact: 'A young warrior who rode Pegasus and beat the Chimaera.', quote: 'a gallant young warrior, whose name was Bellerophon', passage: 'bulfinch-pegasus',
    also: { quote: 'Bellerophon mounted him, rose with him into the air, soon found the Chimaera, and gained an easy victory over the monster.', passage: 'bulfinch-pegasus' } },
  { name: 'Ulysses', group: 'heroes', fact: 'The captain who had himself tied to the mast to hear the Sirens. The Greeks called him Odysseus.', quote: 'to cause himself to be bound to the mast', passage: 'bulfinch-sirens',
    greek: { name: 'Odysseus', quote: 'the wanderings of Ulysses (Odysseus in the Greek language)', work: B } },
  // mortals
  { name: 'Pandora', group: 'mortals', fact: 'She opened the box she had been trusted to keep shut.', quote: 'Naughty Pandora! why have you opened this wicked box?', passage: 'wonderbook-pandora' },
  { name: 'Midas', group: 'mortals', fact: 'A king whose touch turned things to gold. In Hawthorne’s telling his daughter is little Marygold.', quote: 'The Golden Touch had come to him with the first sunbeam!', passage: 'wonderbook-midas',
    also: { quote: 'which little Marygold had hemmed for him', passage: 'wonderbook-midas' } },
  { name: 'Arachne', group: 'mortals', fact: 'A maiden so skilled at weaving that the nymphs came to watch her.', quote: 'a maiden who had attained such skill in the arts of weaving and embroidery', passage: 'bulfinch-arachne' },
  { name: 'Echo', group: 'mortals', fact: 'A nymph who could only answer, never speak first.', quote: 'You shall still have the last word, but no power to speak first.', passage: 'bulfinch-echo' },
  { name: 'Narcissus', group: 'mortals', fact: 'A youth who fell in love with his own reflection.', quote: 'He fell in love with himself.', passage: 'bulfinch-narcissus' },
  { name: 'Ariadne', group: 'mortals', fact: 'She held the other end of the silk thread while Theseus was in the labyrinth.', quote: 'the tender-hearted Ariadne was still holding the other end', passage: 'tanglewood-labyrinth' },
  { name: 'Daedalus', group: 'mortals', fact: 'He planned the labyrinth — and made wings for himself and his son.', quote: 'the brain of a man like Daedalus, who planned it', passage: 'tanglewood-labyrinth',
    also: { quote: 'So he set to work to fabricate wings for himself and his young son Icarus.', passage: 'bulfinch-icarus' } },
  { name: 'Icarus', group: 'mortals', fact: 'He flew too near the sun, and the wax that held his feathers melted.', quote: 'The nearness of the blazing sun softened the wax', passage: 'bulfinch-icarus' },
  { name: 'Tantalus', group: 'mortals', fact: 'In the underworld he stands in water he can never drink.', quote: 'There was Tantalus, who stood in a pool, his chin level with the water', passage: 'bulfinch-tantalus' },
  // giants and creatures
  { name: 'Atlas', group: 'creatures', fact: 'A giant who holds up the sky.', quote: 'I am Atlas, the mightiest giant in the world! And I hold the sky upon my head!', passage: 'wonderbook-atlas' },
  { name: 'The Minotaur', group: 'creatures', fact: 'The monster in the labyrinth, whose cry was like a bull’s and like a man’s.', quote: 'so like a bull\'s roar, and withal so like a human voice', passage: 'tanglewood-labyrinth' },
  { name: 'Pegasus', group: 'creatures', fact: 'A winged horse, caught with a golden bridle.', quote: 'the winged horse Pegasus', passage: 'bulfinch-pegasus',
    also: { quote: 'Minerva came to him and gave him a golden bridle', passage: 'bulfinch-pegasus' } },
  { name: 'The Chimaera', group: 'creatures', fact: 'A fire-breathing monster: part lion, part goat, part dragon.', quote: 'The Chimaera was a fearful monster, breathing fire.', passage: 'bulfinch-pegasus',
    also: { quote: 'The fore part of its body was a compound of the lion and the goat, and the hind part a dragon\'s.', passage: 'bulfinch-pegasus' } },
  { name: 'The Sirens', group: 'creatures', fact: 'Sea-nymphs whose song drew sailors to their doom.', quote: 'The Sirens were sea-nymphs who had the power of charming by their song', passage: 'bulfinch-sirens' },
];
export const WHO_GROUPS = [['gods', 'The gods'], ['heroes', 'The heroes'], ['mortals', 'Mortals and nymphs'], ['creatures', 'Giants and creatures']];

/* the line the page opens with about names, quoted, not told */
export const NAMES_NOTE = {
  say: 'Hawthorne and Bulfinch tell these Greek myths with the names the Romans gave the gods. Bulfinch’s own book gives both:',
  quote: 'Juno (Hera) was the wife of Jupiter, and queen of the gods.', work: B,
};

/* ─────────────────────────── The authors ─────────────────────────── */

/* `works` are WORKS ids (library.js and its beside-files); `surname` finds the death year in a work's own
   rights note ("Published 1609; Shakespeare died 1616.") — the year is read from the data, never typed.
   `speak` names Stage rooms that already use their words. `retold` is a retelling (CLAUDE.md rule 4). */
export const AUTHORS = [
  { id: 'shakespeare', name: 'William Shakespeare', surname: 'Shakespeare', works: ['midsummer', 'macbeth', 'caesar', 'sonnets'], deepest: true,
    speak: [{ label: 'Friends, Romans, countrymen — read it aloud', href: '#/stage/aloud/caesar-antony' }, { label: 'To-morrow, and to-morrow — read it aloud', href: '#/stage/aloud/macbeth-tomorrow' },
      { label: 'Sonnet 18 — learn it by heart', href: '#/stage/sp2-recite' }, { label: 'The Elocution Contest: a poem, a passage, a talk', href: '#/stage/contest' }],
    wordsStop: 'la4-shakespeare', howTo: 'la9-pentameter', retold: [{ work: 'lamb-tales', passage: 'lamb-tempest' }] },
  { id: 'dickens', name: 'Charles Dickens', surname: 'Dickens', works: ['carol', 'oliver', 'great-expectations', 'two-cities'] },
  { id: 'carroll', name: 'Lewis Carroll', surname: 'Carroll', works: ['alice', 'lookingglass'] },
  { id: 'kipling', name: 'Rudyard Kipling', surname: 'Kipling', works: ['jungle', 'justso', 'kipling-rewards', 'kim'],
    speak: [{ label: 'If — learn it by heart', href: '#/stage/sp2-recite' }] },
  { id: 'stevenson', name: 'Robert Louis Stevenson', surname: 'Stevenson', works: ['treasure', 'kidnapped', 'garden-verses', 'jekyll'],
    speak: [{ label: 'A poem from A Child’s Garden of Verses — learn it by heart', href: '#/stage/sp2-recite' }] },
  { id: 'wordsworth', name: 'William Wordsworth', surname: 'Wordsworth', works: ['wordsworth'],
    speak: [{ label: 'Say a poem with expression', href: '#/stage/sp3-express' }] },
  { id: 'austen', name: 'Jane Austen', surname: 'Austen', works: ['pride'] },
  { id: 'twain', name: 'Mark Twain', surname: 'Twain', works: ['tomsawyer', 'prince-pauper'] },
  { id: 'andersen', name: 'Hans Christian Andersen', surname: 'Andersen', works: ['andersen'] },
  { id: 'grimm', name: 'The Brothers Grimm', surname: 'Grimm', works: ['grimm'] },
  { id: 'aesop', name: 'Aesop', surname: 'Jacobs', teller: 'Joseph Jacobs, who told these fables in English,', works: ['aesop'] },
  { id: 'grahame', name: 'Kenneth Grahame', surname: 'Grahame', works: ['wind'] },
  { id: 'douglass', name: 'Frederick Douglass', surname: 'Douglass', works: ['douglass'] },
  { id: 'lincoln', name: 'Abraham Lincoln', surname: 'Lincoln', works: ['gettysburg'],
    speak: [{ label: 'Deliver the Gettysburg Address on the Stage', href: '#/stage/sp8-declaim' }] },
];
export const author = (id) => AUTHORS.find((a) => a.id === id) || null;
export const authorOf = (workId) => AUTHORS.find((a) => a.works.includes(workId)) || null;
export const authorWorks = (a) => a.works.map(work).filter(Boolean);
export const isGated = (a) => authorWorks(a).filter((w) => w.held).every((w) => !cleared(w));
export const authorPassages = (a) => PASSAGES.filter((p) => a.works.includes(p.work) && shipped(p));
export const authorLines = (a) => LINES.filter((l) => a.works.includes(l.work) && cleared(work(l.work)));
export const langStop = (id) => LANG_STOPS.find((s) => s.id === id) || null;

/* the life line, read from the works' own rights notes: { year, basis, work } or null */
export function lifeNote(a) {
  const re = new RegExp(`\\b${a.surname}(?:,? who)? died (\\d{4})`);
  for (const w of authorWorks(a)) { const m = re.exec(w.rights?.basis || ''); if (m) return { year: m[1], basis: w.rights.basis, work: w }; }
  return null;
}

/* "Why read them": the works' own `why` (our words, already in the data), held works first */
export const whyRead = (a) => authorWorks(a).sort((x, y) => (y.held ? 1 : 0) - (x.held ? 1 : 0)).map((w) => ({ work: w, why: w.why }));

/* ── Test yourself: drawn ONLY from their passages' existing questions ──
   Round-robin across the passages (one question from each, then the next), a multiple of four long (so
   the right answer's slot, which permute() rotates with the item's ordinal, falls equally in each slot),
   at most eight. A question whose right answer is in its own words is left out. */
const norm = (s) => ` ${String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
export const leaks = (q) => norm(q.q).includes(norm(q.right));
export function quizFor(a) {
  const ps = authorPassages(a).filter((p) => (p.questions || []).length), pool = [];
  for (let i = 0; pool.length < 8 && ps.some((p) => i < p.questions.length); i++)
    for (const p of ps) { const q = p.questions[i]; if (q && !leaks(q) && pool.length < 8) pool.push({ p, qi: i, q }); }
  const n = pool.length - (pool.length % 4);
  return pool.slice(0, n).map(({ p, qi, q }, i) => {
    const { options, answer } = permute(`deep:${a.id}:${i}`, [q.right, ...q.wrong]);
    return { id: `${p.id}:${qi}`, pid: p.id, title: p.title, q: q.q, options, answer, right: q.right };
  });
}
