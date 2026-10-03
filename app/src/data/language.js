/* language.js — the Language strand, levels 2–10 (spec §2 strand 7, §7: "English itself").

   Level 1 (Word origins) lives in curriculum.js. Everything here is our own wording, British
   spelling, except the quotations, and every quotation is an exact substring of a held, cleared
   text (test/language.mjs checks each one, whitespace collapsed).

   Rules this file keeps (CLAUDE.md, spec §7):
   - Never write history from memory. Every dated or historical fact carries sources[] (on the item
     when an item states it, on the stop when its story or learn states it), and every stop that
     states one is needsReview: true until a named reviewer clears it.
   - A word's origin comes from Bizzing Bee's pinned word list (cited "Bizzing Bee word list: <word>").
     Distractors for a borrowed word are languages it plainly did not come from, so a word that
     travelled through two languages never has a second defensible answer.
   - Shakespeare's words are "first recorded in" (the OED's earliest written example), never
     "invented".
   - Dialects are not mistakes.
   - Every item: one right answer, three wrong, the answer not in the question, the right answer not
     the longest by more than 40%.

   Bands: 2 = ages 8–10, 3 = ages 11–14. */

// ── Sources ─────────────────────────────────────────────────────────────────
const CRYSTAL = 'David Crystal, The Cambridge Encyclopedia of the English Language (Cambridge University Press, 3rd edition, 2019)';
const BAUGH = 'Albert C. Baugh and Thomas Cable, A History of the English Language (Routledge, 6th edition, 2013)';
const CRYSTAL_SH = 'David Crystal, Think on My Words: Exploring Shakespeare\'s Language (Cambridge University Press, 2008)';
const OED = (entry) => `The Oxford English Dictionary, entry: ${entry}`;
const OED_HISTORY = 'The Oxford English Dictionary: "History of the OED" (Oxford University Press, oed.com)';
const OALD = (entry) => `Oxford Advanced Learner's Dictionary, entry: ${entry}`;
const HOBSON = (entry) => `Henry Yule and A. C. Burnell, Hobson-Jobson: A Glossary of Colloquial Anglo-Indian Words and Phrases (John Murray, 1886), entry: ${entry}`;
const HOBSON_BOOK = 'Henry Yule and A. C. Burnell, Hobson-Jobson: A Glossary of Colloquial Anglo-Indian Words and Phrases (John Murray, 1886)';
const BL = (page) => `British Library, Collection items: ${page}`;
const BEDE = 'Bede, Ecclesiastical History of the English People (completed 731), Book I, chapter 15';
const ASC = 'The Anglo-Saxon Chronicle, entries for 793 and 1066';
const WEBSTER = 'Noah Webster, An American Dictionary of the English Language (1828)';
const ABRAMS = 'M. H. Abrams and Geoffrey Galt Harpham, A Glossary of Literary Terms (Cengage, 11th edition, 2015)';
const AESOP = (fable) => `The Fables of Aesop, ed. Joseph Jacobs (1894), held text: "${fable}"`;
const BULFINCH = (chapter) => `Thomas Bulfinch, The Age of Fable (1855), held text: ${chapter}`;
const DREAM = 'William Shakespeare, A Midsummer Night\'s Dream (held text)';
const BEE = (...words) => words.map((w) => `Bizzing Bee word list: ${w}`);

const mc = (q, right, wrong, extra = {}) => ({ q, right, wrong, ...extra });

// ── The rhetoric shelf: every text an exact substring of its held work ──────
// `device` is the one it shows most clearly; `also` lists devices it arguably shows too, which are
// therefore never offered as a wrong answer for it.
export const RHETORIC = [
  { device: 'anaphora', also: ['tricolon'], work: 'gettysburg', text: 'we cannot dedicate. . .we cannot consecrate. . . we cannot hallow this ground' },
  { device: 'tricolon', also: ['alliteration'], work: 'gettysburg', text: 'government of the people. . .by the people. . .for the people' },
  { device: 'antithesis', also: [], work: 'gettysburg', text: 'The world will little note, nor long remember, what we say here, but it can never forget what they did here.' },
  { device: 'antithesis', also: [], work: 'gettysburg', text: 'The brave men, living and dead' },
  { device: 'tricolon', also: [], work: 'essays-bacon', text: 'Reading maketh a full man; conference a ready man; and writing an exact man.' },
  { device: 'tricolon', also: ['anaphora'], work: 'essays-bacon', text: 'STUDIES serve for delight, for ornament, and for ability.' },
  { device: 'tricolon', also: [], work: 'essays-bacon', text: 'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested' },
  { device: 'tricolon', also: ['antithesis'], work: 'essays-bacon', text: 'Crafty men contemn studies, simple men admire them, and wise men use them' },
  { device: 'antithesis', also: [], work: 'essays-bacon', text: 'Prosperity is not without many fears and distastes; and adversity is not without comforts and hopes.' },
  { device: 'anaphora', also: ['tricolon'], work: 'essays-bacon', text: 'if a man write little, he had need have a great memory; if he confer little, he had need have a present wit: and if he read little, he had need have much cunning' },
  { device: 'antithesis', also: [], work: 'douglass', text: 'You have seen how a man was made a slave; you shall see how a slave was made a man.' },
  { device: 'antithesis', also: ['alliteration'], work: 'midsummer', text: 'Love looks not with the eyes, but with the mind' },
  { device: 'antithesis', also: [], work: 'midsummer', text: 'though she be but little, she is fierce.' },
  { device: 'tricolon', also: ['alliteration'], work: 'midsummer', text: 'The lunatic, the lover, and the poet' },
  { device: 'rhetorical question', also: ['simile'], work: 'sonnets', text: "Shall I compare thee to a summer's day?" },
  { device: 'anaphora', also: [], work: 'sonnets', text: 'So long as men can breathe, or eyes can see, So long lives this, and this gives life to thee.' },
  { device: 'alliteration', also: [], work: 'sonnets', text: 'When to the sessions of sweet silent thought' },
  { device: 'anaphora', also: ['alliteration', 'tricolon'], work: 'sonnets', text: "And needy nothing trimm'd in jollity, And purest faith unhappily forsworn, And gilded honour shamefully misplac'd" },
  { device: 'alliteration', also: [], work: 'raven', text: 'Doubting, dreaming dreams no mortals ever dared to dream before' },
  { device: 'alliteration', also: [], work: 'raven', text: 'And the silken sad uncertain rustling of each purple curtain' },
  { device: 'alliteration', also: [], work: 'mariner', text: 'The fair breeze blew, the white foam flew, The furrow followed free' },
  { device: 'anaphora', also: ['alliteration'], work: 'mariner', text: 'Alone, alone, all, all alone, Alone on a wide wide sea!' },
  { device: 'rhetorical question', also: ['alliteration'], work: 'blake', text: 'What immortal hand or eye Could frame thy fearful symmetry?' },
  { device: 'tricolon', also: ['alliteration'], work: 'carol', text: 'I will live in the Past, the Present, and the Future.' },
  { device: 'rhetorical question', also: [], work: 'carol', text: 'Are there no prisons?' },
  { device: 'rhetorical question', also: [], work: 'alice', text: "what is the use of a book,' thought Alice 'without pictures or conversations?" },
  { device: 'anaphora', also: ['alliteration'], work: 'gitanjali', text: 'Where the mind is without fear and the head is held high; Where knowledge is free;' },
  { device: 'anaphora', also: ['antithesis'], work: 'kipling-rewards', text: 'If you can dream--and not make dreams your master; If you can think--and not make thoughts your aim,' },
  { device: 'alliteration', also: [], work: 'tennyson', text: 'The splendour falls on castle walls And snowy summits old in story' },
  { device: 'alliteration', also: ['anaphora'], work: 'lookingglass', text: 'Of shoes--and ships--and sealing-wax-- Of cabbages--and kings--' },
  { device: 'antithesis', also: [], work: 'frankenstein', text: 'I was benevolent and good; misery made me a fiend.' },
  { device: 'antithesis', also: ['anaphora'], work: 'lookingglass', text: 'jam to-morrow and jam yesterday--but never jam to-day.' },
];

/* The wrong answers for a device item: every device that is neither the answer nor arguably also
   present. The longest candidate is always offered, so the answer is never the stand-out longest;
   a rhetorical question always meets "personification", which none of them shows. */
const DEVICES = ['anaphora', 'tricolon', 'antithesis', 'rhetorical question', 'alliteration', 'simile'];
function deviceItem(i, turn = 0) {
  const r = RHETORIC[i];
  let pool = DEVICES.filter((d) => d !== r.device && !r.also.includes(d));
  if (r.device === 'rhetorical question') pool = ['personification', ...pool];
  pool.sort((a, b) => b.length - a.length);
  const [longest, ...rest] = pool;
  const k = turn % rest.length;
  const wrong = [longest, ...rest.slice(k), ...rest.slice(0, k)].slice(0, 3);
  return { q: 'Which device does this line use most clearly?', right: r.device, wrong, quote: r.text, work: r.work };
}
const rhet = (text) => {
  const i = RHETORIC.findIndex((r) => r.text === text);
  if (i < 0) throw new Error(`language.js: no RHETORIC entry for ${text}`);
  return i;
};

// ── The story of English, as a timeline ─────────────────────────────────────
export const TIMELINE = [
  { year: 449, approx: true, event: 'Angles, Saxons and Jutes begin to settle in Britain. Their speech becomes Old English.', sources: [BEDE, CRYSTAL] },
  { year: 597, event: 'Augustine\'s mission reaches Kent. Old English begins borrowing Latin words from the Church.', sources: [CRYSTAL, BAUGH] },
  { year: 793, event: 'Viking raiders attack Lindisfarne. Settlers from Scandinavia later give English Norse words such as egg and window.', sources: [ASC, CRYSTAL, ...BEE('egg', 'window')] },
  { year: 1000, approx: true, event: 'Beowulf, the great Old English poem, is copied into the one manuscript that survives.', sources: [BL('Beowulf (Cotton MS Vitellius A XV)'), CRYSTAL] },
  { year: 1066, event: 'The Normans conquer England. French becomes the language of the new rulers, and thousands of French words enter English.', sources: [ASC, CRYSTAL, BAUGH] },
  { year: 1362, event: 'The Statute of Pleading orders that cases in the law courts be pleaded in English.', sources: [BAUGH, CRYSTAL] },
  { year: 1400, event: 'Geoffrey Chaucer dies, leaving The Canterbury Tales, the best-known work in Middle English, unfinished.', sources: [CRYSTAL, BL('The Canterbury Tales')] },
  { year: 1476, event: 'William Caxton sets up the first printing press in England, at Westminster. Printing helps spelling settle.', sources: [CRYSTAL, BL('Caxton\'s Chaucer')] },
  { year: 1564, event: 'William Shakespeare is born in Stratford-upon-Avon (baptised 26 April).', sources: [CRYSTAL_SH, CRYSTAL] },
  { year: 1604, event: 'Robert Cawdrey\'s Table Alphabeticall, the first English dictionary of English words, explains "hard usuall English wordes".', sources: [CRYSTAL, BL('A Table Alphabeticall')] },
  { year: 1611, event: 'The King James Bible is published, made to be read aloud in churches.', sources: [CRYSTAL, BL('The King James Bible')] },
  { year: 1623, event: 'The First Folio collects thirty-six of Shakespeare\'s plays.', sources: [BL('Shakespeare\'s First Folio'), CRYSTAL_SH] },
  { year: 1755, event: 'Samuel Johnson publishes his Dictionary of the English Language, showing each word\'s use with quotations from writers.', sources: [BL('Samuel Johnson\'s Dictionary'), CRYSTAL] },
  { year: 1828, event: 'Noah Webster\'s American Dictionary gives American spellings such as color and center.', sources: [WEBSTER, CRYSTAL] },
  { year: 1884, event: 'The first part of the Oxford English Dictionary appears, edited by James Murray.', sources: [OED_HISTORY, CRYSTAL] },
  { year: 1886, event: 'Hobson-Jobson collects the words English had taken from India, from bungalow to tiffin.', sources: [HOBSON_BOOK, CRYSTAL] },
  { year: 1928, event: 'The Oxford English Dictionary is completed.', sources: [OED_HISTORY] },
  { year: 2000, event: 'The Oxford English Dictionary goes online, and is revised there ever since — including hundreds of words of Indian English.', sources: [OED_HISTORY, OED('prepone, v.')] },
];
export const TIMELINE_NEEDS_REVIEW = true;

// ── The stops ───────────────────────────────────────────────────────────────
export const LANG_STOPS = [
  // ── Level 2 · Borrowed words ──
  {
    id: 'la2-india', level: 2, band: 2, needsReview: true,
    title: 'Words from India', iCan: 'I can name English words borrowed from Indian languages.',
    story: 'Quill the fox is packing for a camping trip: a cot, pyjamas, a bandana and a jar of chutney. "Every one of these words came to English from India," Quill grins. "English borrowed them — and never gave them back."',
    learn: {
      why: 'When people who speak different languages live and trade side by side, words cross over. Over centuries of trade and British rule in India, English borrowed hundreds of words from Indian languages. Bizzing Bee\'s word list notes where each word came from.',
      example: ['shampoo ← Hindi', 'catamaran ← Tamil kattumaram, "tied wood"', 'pyjamas ← Hindi pājāma, "leg garment"'],
    },
    sources: [...BEE('shampoo', 'catamaran', 'pajamas', 'pyjamas', 'cot', 'bandana', 'chutney'), HOBSON_BOOK, CRYSTAL],
    items: [
      mc("English borrowed the word 'shampoo' from which language?", 'Hindi', ['French', 'Norse', 'Japanese'], { sources: BEE('shampoo') }),
      mc("English borrowed the word 'jungle' from which language?", 'Hindi', ['Spanish', 'Greek', 'Dutch'], { sources: BEE('jungle') }),
      mc("English borrowed the word 'pyjamas' from which language?", 'Hindi', ['Italian', 'German', 'Russian'], { sources: BEE('pyjamas') }),
      mc("English borrowed the word 'catamaran' from which language?", 'Tamil', ['Spanish', 'Dutch', 'Greek'], { sources: BEE('catamaran') }),
      mc("English borrowed the word 'curry' from which language?", 'Tamil', ['Italian', 'Norse', 'German'], { sources: BEE('curry') }),
      mc("English borrowed the word 'bungalow' from which language?", 'Gujarati', ['French', 'Latin', 'Norse'], { sources: BEE('bungalow') }),
      mc("English borrowed the word 'karma' from which language?", 'Sanskrit', ['Latin', 'Japanese', 'Welsh'], { sources: BEE('karma') }),
      mc('Which of these words came into English from Hindi?', 'loot', ['ballet', 'piano', 'ski'], { sources: BEE('loot', 'ballet', 'piano', 'ski') }),
      mc('Which of these words came into English from Hindi?', 'cot', ['menu', 'umbrella', 'saga'], { sources: BEE('cot', 'menu', 'umbrella', 'saga') }),
      mc('Which of these words came into English from Sanskrit?', 'mantra', ['tsunami', 'kindergarten', 'algebra'], { sources: BEE('mantra', 'tsunami', 'kindergarten', 'algebra') }),
      mc("'Cushy', meaning easy and comfortable, comes from a Hindi word meaning…", 'pleasant, happy', ['soft, sleepy', 'rich, golden', 'quick, clever'], { sources: BEE('cushy') }),
      mc("'Catamaran' comes from Tamil words meaning…", 'tied wood', ['fast fish', 'two sails', 'river house'], { sources: BEE('catamaran') }),
      mc("'Pyjamas' comes from Hindi words meaning…", 'leg garment', ['night coat', 'soft cloth', 'sleep suit'], { sources: BEE('pajamas') }),
      mc('Jodhpurs, the riding trousers, are named after…', 'a city in Rajasthan', ['a famous racehorse', 'a British general', 'a river in Gujarat'], { sources: BEE('jodhpurs') }),
      mc('Which word reached English from Persian?', 'shawl', ['thug', 'chutney', 'bandana'], { sources: BEE('shawl', 'thug', 'chutney', 'bandana') }),
    ],
  },
  {
    id: 'la2-world', level: 2, band: 2, needsReview: true,
    title: 'Words from everywhere', iCan: 'I can say which language a borrowed English word came from.',
    story: 'Quill opens a lunch box: chocolate, yogurt and a spoonful of sugar. "Spanish, Turkish and Arabic," says Quill. "My lunch speaks three languages before I have taken a bite."',
    learn: {
      why: 'English takes words from every language it meets — through trade, travel, science, food and sport. A borrowed word often keeps a clue to where it came from: kindergarten is German for "children\'s garden".',
      example: ['kindergarten ← German Kinder + Garten', 'ukulele ← Hawaiian, "jumping flea"', 'robot ← Czech robota, "forced labour"'],
    },
    sources: [...BEE('chocolate', 'yogurt', 'sugar', 'kindergarten', 'ukulele', 'robot'), CRYSTAL],
    items: [
      mc("English borrowed the word 'kindergarten' from which language?", 'German', ['Italian', 'Spanish', 'Hindi'], { sources: BEE('kindergarten') }),
      mc("English borrowed the word 'robot' from which language?", 'Czech', ['Japanese', 'Greek', 'Welsh'], { sources: BEE('robot') }),
      mc("English borrowed the word 'ukulele' from which language?", 'Hawaiian', ['Swahili', 'Norse', 'Turkish'], { sources: BEE('ukulele') }),
      mc("English borrowed the word 'tsunami' from which language?", 'Japanese', ['Hindi', 'Greek', 'Italian'], { sources: BEE('tsunami') }),
      mc("English borrowed the word 'safari' from which language?", 'Swahili', ['French', 'Japanese', 'Russian'], { sources: BEE('safari') }),
      mc("English borrowed the word 'algebra' from which language?", 'Arabic', ['Norse', 'Dutch', 'Hindi'], { sources: BEE('algebra') }),
      mc("English borrowed the word 'piano' from which language?", 'Italian', ['Norse', 'Hindi', 'Japanese'], { sources: BEE('piano') }),
      mc("English borrowed the word 'ski' from which language?", 'Norwegian', ['Italian', 'Arabic', 'Hindi'], { sources: BEE('ski') }),
      mc("English borrowed the word 'taboo' from which language?", 'Tongan', ['Japanese', 'Norse', 'Welsh'], { sources: BEE('taboo') }),
      mc('Which of these words came into English from Dutch?', 'cookie', ['piano', 'yogurt', 'tsunami'], { sources: BEE('cookie', 'piano', 'yogurt', 'tsunami') }),
      mc('Which of these words came into English from Turkish?', 'yogurt', ['ballet', 'cookie', 'ski'], { sources: BEE('yogurt', 'ballet', 'cookie', 'ski') }),
      mc('Which of these words came into English from Norse, the language of the Vikings?', 'husband', ['menu', 'piano', 'safari'], { sources: [...BEE('husband', 'menu', 'piano', 'safari'), CRYSTAL] }),
      mc("'Umbrella' comes from an Italian word meaning…", 'little shade', ['rain bonnet', 'great wing', 'dry rooftop'], { sources: BEE('umbrella') }),
      mc("'Chocolate' goes back, through Spanish, to a Nahuatl word meaning…", 'bitter water', ['sweet bean', 'brown gold', 'warm cup'], { sources: BEE('chocolate') }),
    ],
  },

  // ── Level 3 · The story of English ──
  {
    id: 'la3-old-english', level: 3, band: 2, needsReview: true,
    title: 'From Old English to Chaucer', iCan: 'I can tell how Old English, the Vikings and the Normans made English.',
    story: 'Quill finds a page that looks like English but reads like a riddle. It begins "Hwæt!" — the first word of Beowulf, a poem in Old English that survives in a manuscript copied about a thousand years ago.',
    learn: {
      why: 'English began with the Angles, Saxons and Jutes, who settled in Britain in the fifth century. Vikings brought Norse words such as egg and window. In 1066 the Normans conquered England, and French became the language of the new rulers. That is why the animal in the field has an Old English name (cow, sheep, pig) and the meat on the table a French one (beef, mutton, pork). By Chaucer\'s time, around 1400, the language had become Middle English.',
      example: ['Old English: cow, sheep, pig, deer', 'Norman French: beef, mutton, pork, venison', 'Norse: egg, window, husband'],
    },
    sources: [CRYSTAL, BAUGH, BEDE, ASC, BL('Beowulf (Cotton MS Vitellius A XV)'), ...BEE('cow', 'sheep', 'pig', 'deer', 'beef', 'mutton', 'pork', 'venison', 'egg', 'window', 'husband')],
    items: [
      mc('Which word for a meat came to English from Norman French?', 'beef', ['cow', 'sheep', 'calf'], { sources: [...BEE('beef', 'cow', 'sheep', 'calf'), CRYSTAL] }),
      mc("The animal is a 'pig', an Old English word. Its meat has a French name. What is it?", 'pork', ['swine', 'piglet', 'sty'], { sources: [...BEE('pig', 'pork', 'swine'), CRYSTAL] }),
      mc('Venison, a word that came from French, is the meat of which animal?', 'deer', ['calf', 'sheep', 'goat'], { sources: BEE('venison', 'deer') }),
      mc('Which language did the Viking settlers bring to England?', 'Norse', ['Latin', 'French', 'Greek'], { sources: [CRYSTAL, BAUGH] }),
      mc("Which everyday word came from the Vikings' language?", 'egg', ['beef', 'menu', 'piano'], { sources: [...BEE('egg', 'beef', 'menu', 'piano'), CRYSTAL] }),
      mc('In what year did the Normans conquer England?', '1066', ['1215', '1415', '1666'], { sources: [ASC, CRYSTAL] }),
      mc('The Normans who conquered England spoke which language?', 'French', ['Norse', 'Welsh', 'Dutch'], { sources: [CRYSTAL, BAUGH] }),
      mc('What do we call the language of the Anglo-Saxons?', 'Old English', ['Middle English', 'Modern English', 'Norman French'], { sources: [CRYSTAL] }),
      mc('Beowulf, the great Old English poem, begins with which word?', 'Hwæt', ['Once', 'Whilom', 'Here'], { sources: [BL('Beowulf (Cotton MS Vitellius A XV)'), CRYSTAL] }),
      mc('Who wrote The Canterbury Tales?', 'Geoffrey Chaucer', ['William Caxton', 'Samuel Johnson', 'William Shakespeare'], { sources: [CRYSTAL, BL('The Canterbury Tales')] }),
      mc('Chaucer wrote in which kind of English?', 'Middle English', ['Old English', 'Modern English', 'American English'], { sources: [CRYSTAL] }),
      mc('Who settled in Britain in the fifth century and brought the speech that became English?', 'the Angles, Saxons and Jutes', ['the Romans and the Celts', 'the Normans and the French', 'the Greeks and the Romans'], { sources: [BEDE, CRYSTAL] }),
      mc("Why does English have both 'cow' and 'beef'?", 'Cow is Old English; beef came from French', ['Beef is the American word for cow', 'Cow is a newer, shorter word for beef', 'Beef once meant a very young calf'], { sources: [...BEE('cow', 'beef'), CRYSTAL] }),
      mc('In about which year did Geoffrey Chaucer die?', '1400', ['1066', '1611', '1755'], { sources: [CRYSTAL, BL('The Canterbury Tales')] }),
    ],
  },
  {
    id: 'la3-print', level: 3, band: 3, needsReview: true,
    title: 'Print, Shakespeare and the dictionaries', iCan: 'I can put the printing press, the King James Bible and the great dictionaries in order.',
    story: 'Quill visits the Library\'s oldest shelf. "Before printing, every book was copied by hand," says Quill, "and people spelled much as they pleased." Then came the press, the plays, the Bible of 1611 and the dictionaries.',
    learn: {
      why: 'William Caxton set up the first printing press in England, at Westminster, in 1476, and printed books helped spelling settle. Shakespeare\'s plays (collected in the First Folio of 1623) and the King James Bible (1611) gave English many of its best-known phrases. Samuel Johnson\'s Dictionary (1755) showed how words were used with quotations from writers; Noah Webster\'s American Dictionary (1828) gave American spellings such as "color". The Oxford English Dictionary began to appear in parts in 1884 and was completed in 1928.',
      example: ['1476 — Caxton\'s press at Westminster', '1611 — the King James Bible', '1755 — Johnson\'s Dictionary'],
    },
    sources: [CRYSTAL, BAUGH, BL('Caxton\'s Chaucer'), BL('The King James Bible'), BL('Shakespeare\'s First Folio'), BL('Samuel Johnson\'s Dictionary'), WEBSTER, OED_HISTORY],
    items: [
      mc('Who set up the first printing press in England?', 'William Caxton', ['Samuel Johnson', 'Geoffrey Chaucer', 'Noah Webster'], { sources: [CRYSTAL, BL('Caxton\'s Chaucer')] }),
      mc('When was the King James Bible first published?', '1611', ['1476', '1755', '1828'], { sources: [BL('The King James Bible'), CRYSTAL] }),
      mc("Samuel Johnson's Dictionary appeared in which year?", '1755', ['1611', '1066', '1884'], { sources: [BL('Samuel Johnson\'s Dictionary'), CRYSTAL] }),
      mc("Whose dictionary of 1828 gave American spellings such as 'color'?", 'Noah Webster', ['Samuel Johnson', 'James Murray', 'William Caxton'], { sources: [WEBSTER, CRYSTAL] }),
      mc("What did Johnson's Dictionary use to show how each word was used?", 'quotations from writers', ['pictures of each thing', 'rhymes for every word', 'maps of where it was said'], { sources: [BL('Samuel Johnson\'s Dictionary'), CRYSTAL] }),
      mc('In which year was the Oxford English Dictionary completed?', '1928', ['1755', '1611', '1476'], { sources: [OED_HISTORY] }),
      mc("Who was the Oxford English Dictionary's first great editor?", 'James Murray', ['Noah Webster', 'Samuel Johnson', 'William Caxton'], { sources: [OED_HISTORY, CRYSTAL] }),
      mc('Where did Caxton set up his press, in 1476?', 'Westminster', ['Stratford-upon-Avon', 'Canterbury', 'Oxford'], { sources: [CRYSTAL, BL('Caxton\'s Chaucer')] }),
      mc("Shakespeare's plays were first collected in the First Folio in which year?", '1623', ['1564', '1476', '1755'], { sources: [BL('Shakespeare\'s First Folio')] }),
      mc('The great change in how English long vowels were said, between about 1400 and 1700, is called…', 'the Great Vowel Shift', ['the Norman Conquest', 'the First Folio', 'the Statute of Pleading'], { sources: [CRYSTAL, BAUGH] }),
      mc('Why did printing help English spelling to settle?', 'Many copies spelled each word the same way', ['Printers invented a new alphabet', 'Kings fixed every spelling by law', 'Paper only had room for short words'], { sources: [CRYSTAL, BAUGH] }),
      mc('Which book of 1604 is called the first dictionary of English words in English?', "Robert Cawdrey's Table Alphabeticall", ["Samuel Johnson's Dictionary", "Webster's American Dictionary", 'Hobson-Jobson, the glossary'], { sources: [CRYSTAL, BL('A Table Alphabeticall')] }),
      mc('Hobson-Jobson (1886) was a dictionary of…', 'words English took from India', ["Shakespeare's newest words", 'American spellings', 'Old English poems'], { sources: [HOBSON_BOOK] }),
      mc('Which of these came first?', "Caxton's printing press", ["Johnson's Dictionary", 'the King James Bible', 'the Oxford English Dictionary'], { sources: [CRYSTAL, BL('Caxton\'s Chaucer'), BL('The King James Bible'), BL('Samuel Johnson\'s Dictionary'), OED_HISTORY] }),
    ],
  },

  // ── Level 4 · Shakespeare's words ──
  {
    id: 'la4-shakespeare', level: 4, band: 3, needsReview: true,
    title: 'First recorded in Shakespeare', iCan: 'I can name words first recorded in Shakespeare, and say what "first recorded" means.',
    story: 'Quill is reading A Midsummer Night\'s Dream and stops at "swaggering". "Did Shakespeare make that up?" Nobody can know — but it is the earliest written example the Oxford English Dictionary has found.',
    learn: {
      why: 'Dictionary makers search old books for the earliest written example of every word. When the first one they have found is in Shakespeare, we say the word is "first recorded in" Shakespeare. That does not prove he invented it: people may have said it long before anyone wrote it down, and older examples keep turning up in books nobody had searched.',
      example: ['swagger — first recorded in A Midsummer Night\'s Dream (OED)', 'bedroom — first recorded in A Midsummer Night\'s Dream, meaning room in a bed (OED)', 'lacklustre — first recorded in As You Like It (OED)'],
    },
    sources: [OED('swagger, v.'), OED('bedroom, n.'), OED('lacklustre, adj.'), CRYSTAL_SH, CRYSTAL, DREAM],
    items: [
      mc("What does 'first recorded in Shakespeare' mean?", 'His is the earliest written example found', ['He certainly made the word up himself', 'He was the last writer to use it', 'He spelled it in a new way'], { sources: [OED_HISTORY, CRYSTAL_SH] }),
      mc("Why can't we say Shakespeare invented a word just because his is the first example?", 'People may have said it before anyone wrote it', ['Shakespeare did not like new words', 'Dictionaries leave out all old words', 'No word can be made up by anyone'], { sources: [CRYSTAL_SH] }),
      mc('Which word in this line does the OED first record in Shakespeare?', 'swaggering', ['hempen', 'homespuns', 'here'], { quote: 'What hempen homespuns have we swaggering here,', work: 'midsummer', sources: [OED('swagger, v.')] }),
      mc("Lysander is asking for room to lie down. What did 'bed-room' mean in this line?", 'space in a bed', ['a room with a bed in it', 'a bedtime story', 'a warm blanket'], { quote: 'Then by your side no bed-room me deny;', work: 'midsummer', sources: [OED('bedroom, n.')] }),
      mc("Which play gives the OED its first record of 'swagger'?", "A Midsummer Night's Dream", ['The Merchant of Venice', 'Romeo and Juliet', 'The Comedy of Errors'], { sources: [OED('swagger, v.')] }),
      mc("'Lacklustre' is first recorded in which play?", 'As You Like It', ['Hamlet', 'King Lear', 'The Tempest'], { sources: [OED('lacklustre, adj.')] }),
      mc('Which word in this line is a compound, made of two older words?', 'eyeballs', ['wonted', 'sight', 'roll'], { quote: 'And make his eyeballs roll with wonted sight.', work: 'midsummer' }),
      mc("What does 'lacklustre' mean?", 'dull, without shine', ['full of colour', 'very loud', 'quick to anger']),
      mc('To swagger is to…', 'walk or act in a proud, showy way', ['whisper a secret', 'stumble when tired', 'swap one thing for another']),
      mc("An older example of a 'Shakespeare word' turns up in a forgotten book. What does the dictionary do?", 'It moves the first date earlier', ['It removes the word', "It changes Shakespeare's play", 'Nothing, ever'], { sources: [OED_HISTORY, CRYSTAL_SH] }),
      mc('What evidence does the OED use to date a word?', 'written examples with dates', ['what people remember', 'the length of the word', 'guesses from its sound'], { sources: [OED_HISTORY] }),
      mc("In this line from the Sonnets, what does 'ever-fixed' mean?", 'never moving', ['often broken', 'newly mended', 'lost at sea'], { quote: 'O, no! it is an ever-fixed mark,', work: 'sonnets' }),
      mc('Two ways Shakespeare often made new words were…', 'joining words, and changing a word\'s job', ['borrowing words only from Japanese', 'spelling all the old words backwards', 'taking every vowel out of words'], { sources: [CRYSTAL_SH] }),
    ],
  },

  // ── Level 5 · Idioms ──
  {
    id: 'la5-fables', level: 5, band: 2, needsReview: true,
    title: 'Idioms from the fables', iCan: 'I can tell the fable behind an idiom.',
    story: 'Quill leaps for a bunch of grapes, misses, and announces they were probably sour anyway. "Sour grapes!" hoots the owl. Many idioms are tiny stories — and some of the best-known are told in Aesop\'s Fables.',
    learn: {
      why: 'An idiom means more than its words. "Sour grapes" is not about fruit: it means pretending you never wanted what you could not get. Many idioms carry a whole fable inside them — read the story and the idiom explains itself.',
      example: ['sour grapes — The Fox and the Grapes', "the lion's share — The Lion's Share", "to cry wolf — The Shepherd's Boy"],
    },
    sources: [AESOP('The Fox and the Grapes'), AESOP('The Lion\'s Share'), AESOP('The Shepherd\'s Boy'), 'E. Cobham Brewer, Dictionary of Phrase and Fable (1898 edition)'],
    items: [
      mc("'Sour grapes' means…", "pretending not to want what you can't get", ['eating fruit that has gone bad', 'being cross first thing in the morning', 'sharing food you do not like']),
      mc('Who says this, and so gives us an idiom?', 'the Fox', ['the Lion', 'the Hare', 'the Crow'], { quote: 'I am sure they are sour.', work: 'aesop', sources: [AESOP('The Fox and the Grapes')] }),
      mc("To 'cry wolf' means…", 'to raise false alarms until no one believes you', ['to be scared of the dark woods', 'to howl when you are hungry', 'to warn the village of a real danger']),
      mc('This moral ends the fable behind which idiom?', 'to cry wolf', ['sour grapes', "the lion's share", 'a dog in the manger'], { quote: 'A liar will not be believed, even when he speaks the truth.', work: 'aesop', sources: [AESOP('The Shepherd\'s Boy')] }),
      mc("'The lion's share' means…", 'the biggest part', ['a small, fair slice', 'a royal crown', 'a loud roar']),
      mc('The Lion says this about the last quarter of the stag. Which idiom does the fable give us?', "the lion's share", ['sour grapes', 'to cry wolf', 'to bell the cat'], { quote: 'I should like to see which of you will dare to lay a paw upon it.', work: 'aesop', sources: [AESOP('The Lion\'s Share')] }),
      mc("A 'dog in the manger' is someone who…", "won't share what they can't even use", ['guards the house well at night', 'sleeps through the whole afternoon', 'barks at every stranger']),
      mc('This is the moral of which fable?', 'The Dog in the Manger', ['The Fox and the Grapes', "The Lion's Share", "The Shepherd's Boy"], { quote: 'people often grudge others what they cannot enjoy themselves.', work: 'aesop', sources: [AESOP('The Dog in the Manger')] }),
      mc("Asking 'who will bell the cat?' means asking who will…", 'take on the risky job no one wants', ['buy a present for a pet', 'ring the bell for dinner', 'keep the mice out of the kitchen']),
      mc('Who asks this question in the fable?', 'an old mouse', ['the cat', 'a young dog', 'the farmer'], { quote: 'who is to bell the Cat?', work: 'aesop', sources: [AESOP('Belling the Cat')] }),
      mc("To 'kill the goose that lays the golden eggs' means…", 'to destroy what keeps giving you good things', ['to win a prize at the fair', 'to cook a fine dinner for a king', 'to find gold where you did not expect it']),
      mc('Which fable ends with this moral?', 'The Goose With the Golden Eggs', ["The Lion's Share", 'The Dog in the Manger', 'The Hare and the Tortoise'], { quote: "Greed oft o'er reaches itself.", work: 'aesop', sources: [AESOP('The Goose With the Golden Eggs')] }),
      mc("'Don't count your chickens before they are hatched' means…", "don't plan on something before it happens", ['always count your hens each morning', 'eggs are worth more than hens', 'farmers should keep careful lists']),
      mc('In our book of fables, who says this?', "the milkmaid's mother", ['the old mouse', 'the wise man of the village', 'the Tortoise'], { quote: 'Do not count your chickens before they are hatched.', work: 'aesop', sources: [AESOP('The Milkmaid and Her Pail')] }),
      mc("'A wolf in sheep's clothing' is…", 'someone harmful pretending to be harmless', ['a shy person hiding in a big coat', 'a farmer dressed for winter', 'a very hungry animal']),
    ],
  },
  {
    id: 'la5-myths', level: 5, band: 3, needsReview: true,
    title: 'Idioms from the myths', iCan: 'I can explain an idiom from a Greek myth.',
    story: 'Quill\'s friend calls a tricky puzzle "a real Gordian knot". Quill grins: that phrase is a whole story from the Greek world, and Bulfinch\'s Age of Fable tells it.',
    learn: {
      why: 'Many English idioms come from Greek and Roman stories: an Achilles\' heel, the Midas touch, a Trojan horse, a Herculean task. Knowing the myth unlocks the idiom. Myths change as they are retold — in Bulfinch\'s telling, Pandora opens a jar.',
      example: ['an Achilles\' heel — a weak spot', 'the Midas touch — a gift for making money', 'to cut the Gordian knot — to solve a hard problem boldly'],
    },
    sources: [BULFINCH('Prometheus and Pandora'), BULFINCH('Midas'), BULFINCH('The Trojan War'), BULFINCH('Theseus'), 'E. Cobham Brewer, Dictionary of Phrase and Fable (1898 edition)'],
    items: [
      mc("An 'Achilles' heel' is…", 'a weak spot in someone strong', ['a person who runs very fast', 'a cut that will not heal', 'a soldier who never retreats']),
      mc("Why was Achilles' heel his only weak spot, in Bulfinch's telling?", 'his mother held it when she dipped him', ['an arrow had once hit it as a baby', 'he was born with a hurt foot', 'a god had cursed his left foot'], { quote: 'invulnerable except the heel by which she held him', work: 'bulfinch', sources: [BULFINCH('The Trojan War')] }),
      mc("The 'Midas touch' means…", 'a gift for making money', ['a gentle way with animals', 'a clumsy way of breaking things', 'the power to heal the sick']),
      mc('In Bulfinch, which god granted Midas this wish?', 'Bacchus', ['Jupiter', 'Apollo', 'Minerva'], { quote: 'whatever he might touch should be changed into GOLD', work: 'bulfinch', sources: [BULFINCH('Midas')] }),
      mc("A 'Trojan horse' is…", 'a trick that gets an enemy inside', ['a very strong racehorse', 'a statue in a city square', 'a gift that is truly kind']),
      mc('In Bulfinch, what was really inside this offering?', 'armed men', ['gold for the goddess', 'food for the city', 'a sleeping giant'], { quote: 'immense WOODEN HORSE, which they gave out was intended as a propitiatory offering to Minerva', work: 'bulfinch', sources: [BULFINCH('The Trojan War')] }),
      mc("To 'cut the Gordian knot' means…", 'to solve a hard problem in one bold stroke', ['to tie something very tightly', 'to give up on a hard puzzle', 'to make a promise you cannot keep']),
      mc('Who did this, according to Bulfinch?', 'Alexander the Great', ['Gordius, who tied it', 'Theseus of Athens', 'Midas of Phrygia'], { quote: 'he drew his sword and cut the knot.', work: 'bulfinch', sources: [BULFINCH('Midas and the Gordian knot')] }),
      mc("To 'tantalise' someone is to…", "tempt them with what they can't reach", ['frighten them on a dark night', 'tell them a long, dull story', 'teach them a very hard lesson']),
      mc('Which English word comes from this man\'s punishment?', 'tantalise', ['procrastinate', 'narcissistic', 'herculean'], { quote: 'when he bowed his hoary head, eager to quaff, the water fled away', work: 'bulfinch', sources: [BULFINCH('The Infernal Regions'), OED('tantalize, v.')] }),
      mc("A 'Herculean task' is…", 'one that needs huge strength or effort', ['one done quickly and in secret', 'one shared out among many people', 'one so easy a child could do it']),
      mc('A rule that cruelly forces everyone to fit one size is named after this robber. What is the word?', 'Procrustean', ['Herculean', 'Tantalising', 'Midas-like'], { quote: 'If they were shorter than the bed, he stretched their limbs to make them fit it', work: 'bulfinch', sources: [BULFINCH('Theseus'), OED('Procrustean, adj.')] }),
      mc("In Bulfinch's telling, what did Pandora open?", 'a jar', ['a box', 'a door', 'a book'], { sources: [BULFINCH('Prometheus and Pandora')] }),
      mc("In Bulfinch, what stayed at the bottom when Pandora's plagues escaped?", 'hope', ['gold', 'a key', 'a snake'], { quote: 'one thing only excepted, which lay at the bottom', work: 'bulfinch', sources: [BULFINCH('Prometheus and Pandora')] }),
    ],
  },

  // ── Level 6 · Register and dialect ──
  {
    id: 'la6-register', level: 6, band: 2, needsReview: false,
    title: 'Formal and informal', iCan: 'I can choose formal or informal words for my reader.',
    story: 'Quill writes two notes with the same news: one to a best friend ("Can\'t wait — see you at the park!") and one to the head teacher. Same news, different clothes. Choosing your words for your reader is called register.',
    learn: {
      why: 'Register is how formal your words are. With friends we use short, everyday words; in a letter, a report or a speech to strangers we often choose more formal ones: "purchase" for "buy", "assist" for "help". Neither is wrong — the right one is the one that suits the reader.',
      example: ['buy → purchase', 'help → assist', 'need → require'],
    },
    sources: BEE('purchase', 'assist', 'require', 'commence', 'depart', 'reside', 'obtain', 'inquire', 'sufficient'),
    items: [
      mc("Which word is the formal way to say 'buy'?", 'purchase', ['grab', 'pick up', 'snap up']),
      mc("Which word is the formal way to say 'help'?", 'assist', ['give a hand', 'pitch in', 'chip in']),
      mc("Which word is the formal way to say 'need'?", 'require', ['could do with', 'be after', 'be keen on']),
      mc("Which word is the formal way to say 'start'?", 'commence', ['kick off', 'get going', 'fire away']),
      mc("Which word is the formal way to say 'leave'?", 'depart', ['head off', 'clear off', 'push off']),
      mc("Which word is the formal way to say 'live' (in a place)?", 'reside', ['hang out', 'crash', 'stay over']),
      mc("Which word is the formal way to say 'get'?", 'obtain', ['grab', 'nab', 'get hold of']),
      mc("Which word is the formal way to say 'ask'?", 'inquire', ['check with', 'run it by', 'sound out']),
      mc("Which word is the formal way to say 'enough'?", 'sufficient', ['loads', 'heaps', 'more than plenty']),
      mc('Which sentence suits a letter to a head teacher?', 'I would be grateful for your help.', ['Could you give us a hand with this?', 'Help me out with this one, yeah?', 'Any chance of a bit of help, then?']),
      mc('Which sentence suits a text to a friend?', 'See you at the park later!', ['I shall meet you at the park.', 'We will convene at the park.', 'I look forward to our meeting.']),
      mc('Which word is informal?', 'kids', ['children', 'pupils', 'young people']),
      mc('Which word is informal?', 'awesome', ['excellent', 'remarkable', 'outstanding']),
      mc('A speech at a school prize-giving should mostly use…', 'clear, polite, fairly formal words', ['slang only your friends would know', 'as many long words as possible', 'text-message spellings']),
    ],
  },
  {
    id: 'la6-dialect', level: 6, band: 3, needsReview: true,
    title: 'Dialect is not a mistake', iCan: 'I can tell a dialect from a mistake.',
    story: 'A friend from Scotland tells Quill about a wee bairn by the loch. "Is that wrong?" asks a classmate. "Not at all," says Quill. "It is Scots — a way of speaking with its own words and its own rules."',
    learn: {
      why: 'A dialect is the English of a place or a community, with its own words, sounds and grammar. Scots "wee" and "bairn", American "sidewalk" and "fall", Indian "prepone" — each is correct in its own English. A mistake is different: it breaks the rules of the very English the writer is using, like writing "could of" for "could have". Standard English is the dialect used for formal writing everywhere; knowing it as well as your own is a gift, not a betrayal.',
      example: ['Scots: wee (small), bairn (child)', 'American: sidewalk, fall, faucet', 'A slip in any English: could of → could have'],
    },
    sources: [CRYSTAL, WEBSTER, ...BEE('wee', 'bairn', 'glen', 'loch', 'sidewalk', 'fall', 'faucet', 'cookie'), OED('bairn, n.')],
    items: [
      mc("A Scottish speaker says 'a wee dog'. What is 'wee' here?", 'a Scots word for small, correct in Scots', ["a spelling mistake for 'we'", 'baby talk that adults should avoid', 'a word that has no meaning at all'], { sources: [...BEE('wee'), CRYSTAL] }),
      mc("In Scots, a 'bairn' is…", 'a child', ['a barn', 'a bear cub', 'a bonfire'], { sources: [...BEE('bairn'), OED('bairn, n.')] }),
      mc("What Americans call the 'sidewalk', British speakers usually call…", 'the pavement', ['the road', 'the driveway', 'the high street'], { sources: [...BEE('sidewalk', 'pavement'), CRYSTAL] }),
      mc("Americans call the season after summer 'fall'. British speakers usually say…", 'autumn', ['winter', 'spring', 'midsummer'], { sources: [...BEE('fall', 'autumn'), CRYSTAL] }),
      mc('Which sentence has a real mistake in every kind of English?', 'I could of come earlier.', ['I could have come earlier.', "I could've come earlier.", 'I might have come earlier.']),
      mc("Why is 'could of' a mistake when 'wee' is not?", "'Could of' mishears could've; 'wee' is real Scots", ["'Wee' is older, so it is always allowed", "'Could of' is slang used only by children", 'Only words in Shakespeare can be correct'], { sources: [CRYSTAL, ...BEE('wee')] }),
      mc("'Colour' and 'color' are…", 'both correct: British and American spellings', ['one correct, one an old spelling mistake', 'two words with two different meanings', "both wrong: it is spelled 'culler'"], { sources: [...BEE('colour', 'color'), WEBSTER] }),
      mc("In which year did Webster's American Dictionary, with spellings like 'color', appear?", '1828', ['1611', '1755', '1928'], { sources: [WEBSTER, CRYSTAL] }),
      mc('What is a dialect?', 'the English of a place or community, with its own rules', ['English spoken badly by people who never learned it', 'a secret code used only by spies', 'the oldest form of a language'], { sources: [CRYSTAL] }),
      mc('What is Standard English?', 'the dialect used for formal writing and news', ['the only correct way anyone can speak', 'the English spoken in one small town', 'English with no grammar rules at all'], { sources: [CRYSTAL] }),
      mc("A British 'biscuit' is what Americans usually call a…", 'cookie', ['muffin', 'pancake', 'doughnut'], { sources: BEE('cookie') }),
      mc("A 'glen' in Scotland is…", 'a narrow valley', ['a small lake', 'a stone castle', 'a hilltop church'], { sources: BEE('glen') }),
      mc("In Scotland, a 'loch' is…", 'a lake or sea inlet', ['a mountain pass', 'a pine forest', 'a fishing boat'], { sources: BEE('loch') }),
      mc('A friend from another region says a word differently from you. The kind thing to do is…', 'enjoy it: their English has its own rules', ['correct them in front of everyone', 'copy them to make others laugh', 'tell them to speak properly']),
    ],
  },

  // ── Level 7 · Rhetoric's devices ──
  {
    id: 'la7-devices', level: 7, band: 2, needsReview: false,
    title: 'Four tricks of great speakers', iCan: 'I can name anaphora, tricolon, alliteration and a rhetorical question.',
    story: 'Quill practises a speech: "We will run, we will jump, we will win!" "That sounds strong," says a friend. "But why?" Because speakers and poets use the same handful of tricks — and the tricks have names.',
    learn: {
      why: 'Anaphora: the same words begin several clauses in a row ("we cannot… we cannot…"). Tricolon: a group of three, built alike ("of the people, by the people, for the people"). Alliteration: words close together begin with the same sound ("the furrow followed free"). A rhetorical question is asked for effect, not for an answer.',
      example: ['anaphora — "we cannot dedicate… we cannot consecrate"', 'tricolon — "the Past, the Present, and the Future"', 'alliteration — "the furrow followed free"'],
    },
    sources: [ABRAMS],
    items: [
      deviceItem(rhet('we cannot dedicate. . .we cannot consecrate. . . we cannot hallow this ground'), 0),
      deviceItem(rhet('government of the people. . .by the people. . .for the people'), 1),
      deviceItem(rhet('Reading maketh a full man; conference a ready man; and writing an exact man.'), 2),
      deviceItem(rhet('Some books are to be tasted, others to be swallowed, and some few to be chewed and digested'), 0),
      deviceItem(rhet("Shall I compare thee to a summer's day?"), 1),
      deviceItem(rhet('So long as men can breathe, or eyes can see, So long lives this, and this gives life to thee.'), 2),
      deviceItem(rhet('When to the sessions of sweet silent thought'), 0),
      deviceItem(rhet('Doubting, dreaming dreams no mortals ever dared to dream before'), 1),
      deviceItem(rhet('The fair breeze blew, the white foam flew, The furrow followed free'), 2),
      deviceItem(rhet('What immortal hand or eye Could frame thy fearful symmetry?'), 0),
      deviceItem(rhet('I will live in the Past, the Present, and the Future.'), 1),
      deviceItem(rhet("what is the use of a book,' thought Alice 'without pictures or conversations?"), 2),
      deviceItem(rhet('Where the mind is without fear and the head is held high; Where knowledge is free;'), 0),
      deviceItem(rhet('The splendour falls on castle walls And snowy summits old in story'), 1),
      deviceItem(rhet('Are there no prisons?'), 0),
    ],
  },
  {
    id: 'la7-antithesis', level: 7, band: 3, needsReview: false,
    title: 'Antithesis, and the whole toolkit', iCan: 'I can name antithesis, and tell it from anaphora and tricolon.',
    story: 'Quill reads Frederick Douglass aloud and stops, struck: "You have seen how a man was made a slave; you shall see how a slave was made a man." Two halves, the words swapped, the meaning turned upside down. That is antithesis.',
    learn: {
      why: 'Antithesis sets opposites side by side in matching shapes: "living and dead", "not with the eyes, but with the mind". The balance makes the contrast ring. Great speeches often stack devices — a tricolon whose parts begin alike is also anaphora — so ask which device the line shows most clearly.',
      example: ['"The world will little note… but it can never forget"', '"I was benevolent and good; misery made me a fiend."', '"though she be but little, she is fierce."'],
    },
    sources: [ABRAMS],
    items: [
      deviceItem(rhet('You have seen how a man was made a slave; you shall see how a slave was made a man.'), 0),
      deviceItem(rhet('The world will little note, nor long remember, what we say here, but it can never forget what they did here.'), 1),
      deviceItem(rhet('The brave men, living and dead'), 2),
      deviceItem(rhet('Prosperity is not without many fears and distastes; and adversity is not without comforts and hopes.'), 0),
      deviceItem(rhet('Love looks not with the eyes, but with the mind'), 1),
      deviceItem(rhet('though she be but little, she is fierce.'), 2),
      deviceItem(rhet('I was benevolent and good; misery made me a fiend.'), 0),
      deviceItem(rhet('jam to-morrow and jam yesterday--but never jam to-day.'), 1),
      deviceItem(rhet('Crafty men contemn studies, simple men admire them, and wise men use them'), 2),
      deviceItem(rhet('if a man write little, he had need have a great memory; if he confer little, he had need have a present wit: and if he read little, he had need have much cunning'), 0),
      deviceItem(rhet("And needy nothing trimm'd in jollity, And purest faith unhappily forsworn, And gilded honour shamefully misplac'd"), 1),
      deviceItem(rhet('If you can dream--and not make dreams your master; If you can think--and not make thoughts your aim,'), 2),
      deviceItem(rhet('And the silken sad uncertain rustling of each purple curtain'), 0),
      deviceItem(rhet('The lunatic, the lover, and the poet'), 1),
    ],
  },

  // ── Level 8 · Style and editing ──
  {
    id: 'la8-concise', level: 8, band: 2, needsReview: false,
    title: 'Say it once', iCan: 'I can cut a word that says the same thing twice.',
    story: 'Quill\'s first draft says: "We returned back home at the end of the day, and the end result was a free gift." Quill\'s editor, a patient owl, taps three words. "You said each of those twice," she says.',
    learn: {
      why: 'A redundant word repeats what another word already says: "return" already means go back, so "returned back" says it twice. Cutting it makes the sentence stronger. A good editor asks of every word: what would the reader lose without it?',
      example: ['returned back → returned', 'free gift → gift', 'end result → result'],
    },
    sources: [],
    items: [
      mc('Which word can go without changing the meaning? "We returned back home at six."', 'back', ['home', 'six', 'returned']),
      mc('Which word can go? "Everyone at the party got a free gift."', 'free', ['party', 'everyone', 'gift']),
      mc('Which word can go? "The end result was a draw."', 'end', ['result', 'draw', 'was']),
      mc('Which word can go? "Could you repeat that again, please?"', 'again', ['repeat', 'please', 'that']),
      mc('Which word can go? "The two twins share a bedroom."', 'two', ['twins', 'share', 'bedroom']),
      mc('Which word can go? "It was an unexpected surprise."', 'unexpected', ['surprise', 'was', 'an']),
      mc('Which word can go? "Everyone will join together and sing."', 'together', ['join', 'sing', 'everyone']),
      mc('Which word can go? "From past experience, I know the way."', 'past', ['experience', 'know', 'way']),
      mc('Which word can go? "The shop is in close proximity to the school."', 'close', ['proximity', 'shop', 'school']),
      mc('Which word can go? "Please revert back to the first page."', 'back', ['revert', 'first', 'page']),
      mc('Which version is the most concise?', 'We decided to leave.', ['We came to the decision that we would leave.', 'We made a decision to leave in the end.', 'It was decided by us that we would leave.']),
      mc('Which version is the most concise?', 'Most pupils walk to school.', ['The majority of the pupils walk to school.', 'A large number of pupils walk to school.', 'Most of the pupils walk on foot to school.']),
      mc('Which version reads best?', 'The reason is that the bridge was closed.', ['The reason is because the bridge was closed.', 'The reason why is because the bridge was closed.', 'The reason is due to the bridge being closed.']),
      mc('Which phrase can be cut from "In my opinion, I think the film was too long"?', 'I think', ['the film', 'too long', 'was']),
    ],
  },
  {
    id: 'la8-modifiers', level: 8, band: 3, needsReview: false,
    title: 'Who is doing it?', iCan: 'I can fix a dangling modifier and choose the active voice.',
    story: 'Quill reads a note on the fridge: "Running for the bus, my hat blew away." "Was the hat running?" Quill laughs. A sentence can say something its writer never meant.',
    learn: {
      why: 'An opening phrase such as "Running for the bus" describes whoever comes next in the sentence. If the next words are "my hat", the hat is running! Fix it by putting the person straight after the phrase: "Running for the bus, I lost my hat." Clear writing also prefers the active voice — "The dog chased the ball", not "The ball was chased by the dog" — so the reader knows who did what.',
      example: ['Running for the bus, my hat blew away. → Running for the bus, I lost my hat.', 'The window was broken. → The wind broke the window.'],
    },
    sources: [],
    items: [
      mc('Which sentence is clear?', 'Running for the bus, I lost my hat.', ['Running for the bus, my hat blew away.', 'Running for the bus, the hat fell off.', 'Running for the bus, the wind took my hat.']),
      mc('Which sentence is clear?', 'After finishing my homework, I watched a film.', ['After finishing my homework, the film came on.', 'After finishing my homework, the TV was switched on.', 'After finishing my homework, a film was watched.']),
      mc('Which sentence is clear?', 'Walking in the park, we saw a fox.', ['Walking in the park, a fox was seen.', 'Walking in the park, a fox appeared to us.', 'Walking in the park, the fox was spotted by us.']),
      mc('Which sentence is clear?', 'Excited by the news, Priya ran home.', ['Excited by the news, home was where Priya ran.', 'Excited by the news, the way home seemed short.', "Excited by the news, Priya's feet ran home."]),
      mc('Which opening phrase fits "…, the cat curled up by the fire"?', 'Tired after its hunt,', ['Reading my book,', 'After eating my dinner,', 'Tired after school,']),
      mc('Which fixes "Opening the box, a puppy jumped out" and keeps its meaning?', 'When I opened the box, a puppy jumped out.', ['Opening the box, out jumped a puppy.', 'A puppy, opening the box, jumped out.', 'Opening the box, a puppy was jumping out.']),
      mc('Why is "Running for the bus, my hat blew away" a problem?', 'It says the hat was running', ['It is far too short for a sentence', 'It does not have any verb at all', 'It should not use a comma there']),
      mc('Which sentence is in the active voice?', 'The class planted a tree.', ['A tree was planted by the class.', 'A tree was planted.', 'The tree was being planted.']),
      mc('Which sentence is in the active voice?', 'Quill wrote the letter.', ['The letter was written by Quill.', 'The letter was written.', 'The letter had been written by Quill.']),
      mc('In which sentence do we know who did it?', 'The wind broke the window.', ['The window was broken.', 'The window got broken.', 'The window had been broken.']),
      mc('Which version is clearest?', 'The team won the cup.', ['The cup was won by the team.', 'The cup was what the team won.', 'It was the cup that was won by the team.']),
      mc('Which sentence is the most direct?', 'Please close the door.', ['It would be appreciated if the door was closed.', 'The door should perhaps be closed, if possible.', 'Closing the door is something that could be done.']),
      mc('Which sentence is in a clear order?', 'Mira found a gold coin in the garden.', ['In the garden a coin Mira found, gold.', 'Mira, a coin of gold, in the garden found.', 'A gold coin found Mira in the garden.']),
    ],
  },

  // ── Level 9 · The great cadences ──
  {
    id: 'la9-stress', level: 9, band: 2, needsReview: false,
    title: 'The beat inside words', iCan: 'I can hear the strong beat in a word and count the syllables in a line.',
    story: 'Quill taps a drum: da-DUM, da-DUM. "Say compare," says Quill. "Hear the beat land on -PARE?" Every English word of more than one syllable has a strong beat, and poets build their lines out of them.',
    learn: {
      why: 'Say a word slowly and one syllable sounds stronger: TI-ger, com-PARE. Two syllables with the beat on the second (da-DUM) make an iamb; with the beat on the first (DUM-da), a trochee. Count the syllables in a line by clapping them.',
      example: ['com-PARE — an iamb (da-DUM)', 'TI-ger — a trochee (DUM-da)', 'The course of true love never did run smooth — 10 syllables'],
    },
    sources: [ABRAMS],
    items: [
      mc("Which syllable is stressed in 'compare'?", 'the second: com-PARE', ['the first: COM-pare', 'both equally', 'neither']),
      mc("Which syllable is stressed in 'tiger'?", 'the first: TI-ger', ['the second: ti-GER', 'both equally', 'neither']),
      mc('Which word has its strong beat on the SECOND syllable?', 'begin', ['garden', 'happy', 'summer']),
      mc('Which word has its strong beat on the FIRST syllable?', 'apple', ['about', 'delight', 'forget']),
      mc('How many syllables are in this line?', '10', ['8', '9', '12'], { quote: 'The course of true love never did run smooth', work: 'midsummer' }),
      mc('How many syllables are in this line?', '7', ['6', '8', '9'], { quote: 'Tiger, tiger, burning bright', work: 'blake' }),
      mc('How many syllables are in this line?', '10', ['8', '9', '11'], { quote: "Shall I compare thee to a summer's day?", work: 'sonnets' }),
      mc('How many syllables are in this line?', '7', ['5', '6', '8'], { quote: 'Lord, what fools these mortals be!', work: 'midsummer' }),
      mc("da-DUM, as in 'away', is called…", 'an iamb', ['a trochee', 'a sonnet', 'a rhyme']),
      mc("DUM-da, as in 'garden', is called…", 'a trochee', ['an iamb', 'a couplet', 'a stanza']),
      mc('Which word is an iamb (da-DUM)?', 'delight', ['happy', 'tiger', 'garden']),
      mc('Which word is a trochee (DUM-da)?', 'summer', ['compare', 'begin', 'forget']),
    ],
  },
  {
    id: 'la9-pentameter', level: 9, band: 3, needsReview: true,
    title: 'The heartbeat line', iCan: 'I can hear iambic pentameter in Shakespeare and say why the King James Bible was written to be heard.',
    story: 'Quill reads a sonnet aloud and feels a heartbeat under it: da-DUM, five times a line. "Shakespeare\'s lines," says Quill, "and the King James Bible of 1611 were written to be heard, not only read."',
    learn: {
      why: 'Shakespeare\'s characters often speak in iambic pentameter: five iambs (da-DUM) in a line of ten syllables, like a heartbeat. Unrhymed, it is called blank verse. In A Midsummer Night\'s Dream the lovers speak it, the workmen mostly speak prose, and the fairies\' songs skip in shorter lines that begin on a strong beat: "If we shadows have offended". The King James Bible (1611) was made to be read aloud in churches, so its translators listened to how every sentence sounded.',
      example: ['love LOOKS not WITH the EYES, but WITH the MIND — five beats', 'IF we SHAdows HAVE ofFENded — trochees', 'The King James Bible, 1611 — written for reading aloud'],
    },
    sources: [ABRAMS, CRYSTAL, CRYSTAL_SH, BL('The King James Bible'), DREAM],
    items: [
      mc('How many feet are in a line of pentameter?', 'five', ['four', 'six', 'ten'], { sources: [ABRAMS] }),
      mc('How many syllables does a regular line of iambic pentameter have?', 'ten', ['eight', 'twelve', 'fourteen'], { sources: [ABRAMS] }),
      mc('Unrhymed iambic pentameter is called…', 'blank verse', ['free verse', 'a ballad', 'a limerick'], { sources: [ABRAMS] }),
      mc('Which line is iambic pentameter?', 'Love looks not with the eyes, but with the mind', ['Once upon a midnight dreary, while I pondered, weak and weary', 'Tiger, tiger, burning bright In the forests of the night', 'If we shadows have offended, Think but this,--and all is mended,--'], {
        cites: [
          { text: 'Love looks not with the eyes, but with the mind', work: 'midsummer' },
          { text: 'Once upon a midnight dreary, while I pondered, weak and weary', work: 'raven' },
          { text: 'Tiger, tiger, burning bright In the forests of the night', work: 'blake' },
          { text: 'If we shadows have offended, Think but this,--and all is mended,--', work: 'midsummer' },
        ],
      }),
      mc("Puck's last speech begins on a strong beat: IF we SHA-dows. What kind of feet are these?", 'trochees (DUM-da)', ['iambs (da-DUM)', 'spondees (DUM-DUM)', 'anapaests (da-da-DUM)'], { quote: 'If we shadows have offended,', work: 'midsummer', sources: [ABRAMS] }),
      mc("In A Midsummer Night's Dream, Bottom and the other workmen mostly speak in…", 'prose', ['blank verse', 'rhyming couplets', 'sonnets'], { sources: [DREAM, CRYSTAL_SH] }),
      mc('The King James Bible, made to be read aloud in churches, was published in…', '1611', ['1476', '1623', '1755'], { sources: [BL('The King James Bible'), CRYSTAL] }),
      mc("Why did the King James Bible's translators care how it sounded?", 'It was meant to be read aloud', ['It had to fit on one page', 'It was a book of poems for children', 'Kings wanted every line to rhyme'], { sources: [BL('The King James Bible'), CRYSTAL] }),
      mc('How many lines are in a Shakespearean sonnet?', '14', ['10', '12', '16'], { sources: [ABRAMS] }),
      mc('These two rhyming lines end a sonnet. What are they called?', 'a couplet', ['a quatrain', 'a chorus', 'a refrain'], { quote: 'So long as men can breathe, or eyes can see, So long lives this, and this gives life to thee.', work: 'sonnets', sources: [ABRAMS] }),
      mc('Read it with the beat: rough WINDS do SHAKE the DAR-ling BUDS of MAY. How many strong beats?', 'five', ['four', 'six', 'three'], { quote: 'Rough winds do shake the darling buds of May,', work: 'sonnets' }),
      mc("How many years is 'four score and seven'?", '87', ['47', '74', '107'], { quote: 'Four score and seven years ago', work: 'gettysburg', sources: [OED('score, n.')] }),
      mc("Which word in this line is itself an iamb (da-DUM)?", 'compare', ["summer's", 'shall', 'day'], { quote: "Shall I compare thee to a summer's day?", work: 'sonnets' }),
    ],
  },

  // ── Level 10 · World Englishes ──
  {
    id: 'la10-indian', level: 10, band: 3, needsReview: true,
    title: 'Indian English', iCan: 'I can explain words and usages that are standard in Indian English.',
    story: 'Quill\'s cousin in Bengaluru messages: "Let\'s prepone the meeting — I\'ll be out of station next week." Quill\'s friend in London looks puzzled. "It is perfectly good English," says Quill. "Indian English."',
    learn: {
      why: 'English has been used in India for centuries and has grown its own words, meanings and idioms, standard for millions of speakers. "Prepone" (bring forward), "out of station" (away from your town) and "cousin-brother" (a male cousin) are Indian English. Older words such as "tiffin", "chit" and "lakh" were collected in Hobson-Jobson in 1886. A usage that is standard in one English can be new to another: that is a difference, not a mistake.',
      example: ['prepone — move to an earlier time', 'out of station — away from your town', 'cousin-brother — a male cousin'],
    },
    sources: [OED('prepone, v.'), OALD('cousin brother'), HOBSON('Station'), HOBSON('Tiffin'), HOBSON('Chit'), HOBSON('Lack (lakh)'), CRYSTAL, ...BEE('tiffin', 'chit', 'lakh', 'crore', 'godown', 'nullah', 'dekko')],
    items: [
      mc("In Indian English, to 'prepone' a meeting is to…", 'move it to an earlier time', ['cancel it altogether', 'make it last longer', 'move it to a later time'], { sources: [OED('prepone, v.')] }),
      mc("'I'll be out of station next week' means…", "I'll be away from my town", ["the trains won't be running", "I'll be out of work", "I'll be at the railway"], { sources: [HOBSON('Station'), CRYSTAL] }),
      mc("A 'cousin-brother' in Indian English is…", 'a male cousin', ['a brother who lives far away', 'a stepbrother', 'a best friend'], { sources: [OALD('cousin brother')] }),
      mc('A lakh is…', 'one hundred thousand', ['ten thousand', 'one million', 'ten million exactly'], { sources: [...BEE('lakh'), HOBSON('Lack (lakh)')] }),
      mc('A crore is…', 'ten million', ['one hundred thousand', 'one million', 'one thousand'], { sources: [...BEE('crore'), HOBSON('Crore')] }),
      mc("A 'tiffin' is…", 'a light midday meal', ['a small metal coin', 'a summer storm', 'a kind of drum'], { sources: [...BEE('tiffin'), HOBSON('Tiffin')] }),
      mc("A 'chit' is…", 'a short note or slip of paper', ['a small, fluffy baby bird', 'a quick nap after lunch', 'a card game for four players'], { sources: [...BEE('chit'), HOBSON('Chit')] }),
      mc("A 'godown' is…", 'a warehouse', ['a staircase', 'a downhill road', 'a sleeping mat'], { sources: [...BEE('godown'), HOBSON('Godown')] }),
      mc("A 'nullah' is…", 'a ravine or gully', ['a village well', 'a market stall', 'a rope bridge'], { sources: [...BEE('nullah'), HOBSON('Nullah')] }),
      mc('Hobson-Jobson, the great glossary of Anglo-Indian words, was published in…', '1886', ['1611', '1755', '1947'], { sources: [HOBSON_BOOK] }),
      mc("Is 'prepone' a mistake?", 'No — it is standard in Indian English', ['Yes — it is not a real word', 'Yes — only children say it', 'No — but only in poems'], { sources: [OED('prepone, v.'), CRYSTAL] }),
      mc("'Dekko', as in 'have a dekko' (have a look), came into English from…", 'Hindi', ['French', 'Norse', 'Greek'], { sources: BEE('dekko') }),
      mc("In British India, a 'station' first meant…", 'the town where officials lived and worked', ['a platform where the trains stop', 'a channel on the radio', 'an office for the police'], { sources: [HOBSON('Station')] }),
    ],
  },
  {
    id: 'la10-world', level: 10, band: 3, needsReview: true,
    title: 'Englishes around the world', iCan: 'I can describe how Englishes around the world borrow from the languages they meet.',
    story: 'Quill pins words on a world map: kangaroo in Australia, kiwi and haka in New Zealand, veld and trek in South Africa, sidewalk in America. "One language," says Quill, "many Englishes."',
    learn: {
      why: 'Wherever English settled, it met other languages and borrowed from them. Australian English took kangaroo and kookaburra from Aboriginal languages; New Zealand English uses Māori words such as kiwi and haka; South African English took veld and trek from Afrikaans. Each English is standard where it is spoken, and all of them belong to English.',
      example: ['kangaroo ← Guugu Yimithirr (Australia)', 'kiwi ← Māori (New Zealand)', 'veld ← Afrikaans (South Africa)'],
    },
    sources: [CRYSTAL, ...BEE('kangaroo', 'kookaburra', 'kiwi', 'haka', 'veld', 'trek', 'sidewalk')],
    items: [
      mc("'Kangaroo' came into English from…", 'Guugu Yimithirr, an Aboriginal language', ['Māori, a language of New Zealand', 'Afrikaans, from South Africa', 'Hawaiian, from the Pacific'], { sources: BEE('kangaroo') }),
      mc("'Kookaburra' came into English from…", 'Wiradjuri, an Aboriginal language', ['Māori, a language of New Zealand', 'Zulu, a language of South Africa', 'Malay, a language of Malaysia'], { sources: BEE('kookaburra') }),
      mc("The New Zealand bird 'kiwi' takes its name from…", 'Māori, imitating its call', ['Latin, meaning small bird', 'Dutch, meaning round egg', 'Spanish, meaning shy one'], { sources: BEE('kiwi') }),
      mc("The ceremonial dance called the 'haka' has a name from…", 'Māori', ['Afrikaans', 'Swahili', 'Zulu'], { sources: BEE('haka') }),
      mc("South African English 'veld', open grassland, came from…", 'Afrikaans', ['Māori', 'Hindi', 'Hawaiian'], { sources: BEE('veld') }),
      mc("'Trek', a long hard journey, came into English from…", 'Afrikaans', ['Russian', 'Hindi', 'Japanese'], { sources: BEE('trek') }),
      mc("An American 'faucet' is a British…", 'tap', ['sink', 'drain', 'bath'], { sources: BEE('faucet') }),
      mc("What Americans call an 'elevator', British speakers call a…", 'lift', ['hoist', 'crane', 'ladder'], { sources: [...BEE('elevator'), CRYSTAL] }),
      mc("'Aloha', used in Hawaii for hello and goodbye, comes from a Hawaiian word meaning…", 'love, peace, compassion', ['sunrise over the sea', 'welcome to the island', 'the end of the day'], { sources: BEE('aloha') }),
      mc("Which is true of the world's Englishes?", 'Each is standard where it is spoken', ['Only British English is correct', 'Only American English is correct', 'They are not really English']),
      mc('Indian, Nigerian, Singaporean and Australian English are all…', 'World Englishes', ['broken English', 'foreign languages', 'dialects of Latin'], { sources: [CRYSTAL] }),
      mc("'Paddy', a flooded rice field, came into English from…", 'Malay', ['Japanese', 'Spanish', 'Norse'], { sources: BEE('paddy') }),
      mc("'Potato' came into English through Spanish from which language of the Caribbean?", 'Taíno', ['Māori', 'Zulu', 'Hindi'], { sources: BEE('potato') }),
    ],
  },
];

export const langStops = (level) => LANG_STOPS.filter((s) => s.level === level);
