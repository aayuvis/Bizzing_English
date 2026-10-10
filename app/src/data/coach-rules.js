/* coach-rules.js — the Coach's rulebook (Bizzing Bee's coach-rules.js, for English). Hardcoded, offline, no
   model anywhere, and no free text is ever read: the Coach reads only what the app already records as a miss
   (k.misses from a check, k.slips from a game or a tool) and says what it means from this book.

   For every TRAP: the mistake in the child's own terms, the rule that fixes it, a check to run in your head,
   worked examples, and the stops that teach it. An example is our own sentence, or — when it has `work` — an
   exact substring of a line held in that book (test/coach.mjs holds it to the Library's lines and to the held
   text itself: never an invented quotation).

   The maps below send EVERY item kind (items.js KINDS and a story's own exercise kinds), EVERY stop (by its kind,
   or by name for a written stop), every game's miss categories and every tool's misses to exactly one trap.
   test/coach.mjs proves each map is whole. Stops that are never machine-marked — the writing desk, the Stage —
   can never be a miss (CLAUDE.md rules 8, 9), so they are listed apart in UNMARKED and the test says so. */

export const TRAPS = {
  sounds: {
    label: 'Sounds and word families', col: '#B4530F',
    mistake: 'You look at how a word starts when the question is about how it ends — or you trust how a word looks instead of how it sounds.',
    rule: 'Words rhyme when their endings sound the same: the vowel and everything after it. Cat, hat and flat share “-at”. The start of the word does not matter at all. A real word is one you have heard people say; a made-up one only looks like a word.',
    check: 'Cover the first letter with your finger and say what is left. Do the two endings sound the same?',
    egs: [{ s: 'cat · hat · flat', why: 'all three end in “-at”, so they rhyme' }, { s: 'cake · make — but not cat', why: '“-ake” and “-at” end differently, so cat is in another family' },
      { s: 'pig is a word; zig is not', why: 'you have heard “pig” said; “zig” on its own is not a word in our dictionary' }],
    practise: ['w1-rhyme', 'w1-build', 'w1-odd'],
  },
  meanings: {
    label: 'Word meanings', col: '#1F6FB2',
    mistake: 'You choose a word because it looks or sounds like the right one, not because it means exactly that.',
    rule: 'A meaning has to fit the whole definition, not one part of it. Two words can be close cousins — big and enormous — and still not be the same size. Try the word in a sentence: if the sentence still says what it meant, the meaning fits.',
    check: 'Put each choice into the sentence in your head. Which one makes the sentence say exactly what it meant?',
    egs: [{ s: 'gigantic → very, very big', why: '“big” alone is too small a word for it' }, { s: 'warm · hot · scorching', why: 'three steps up the same ladder: choose the step the sentence needs' },
      { s: 'thrifty praises; stingy blames', why: 'nearly the same meaning, but one is kind and one is not' }],
    practise: ['w2-meaning', 'w2-word', 'w2-opposite'],
  },
  affixes: {
    label: 'Prefixes and suffixes', col: '#8A4FD0',
    mistake: 'You pick a prefix or a suffix that looks right but turns the meaning the wrong way.',
    rule: 'A prefix at the front changes the meaning: un- means not, re- means again, pre- means before, mis- means wrongly. A suffix at the end changes the meaning and often the word’s job: -less means without, -ful means full of, -ness turns a describing word into a thing.',
    check: 'Peel the word apart — front, middle, end. Say what each piece means, then put the meanings back together.',
    egs: [{ s: 're + build = build again', why: 're- means again' }, { s: 'mis + read = read wrongly', why: 'mis- means wrongly or badly' },
      { s: 'care + less = without care', why: 'and careful is full of care: the opposite, from the ending alone' }, { s: 'kind + ness = kindness', why: 'a describing word has become a thing you can have' }],
    practise: ['w3-meaning', 'w3-make', 'w4-meaning', 'w4-make'],
  },
  roots: {
    label: 'Roots', col: '#0E7C66',
    mistake: 'A long word looks like one solid block, so you guess at it instead of reading its parts.',
    rule: 'Many long English words are built from Greek and Latin roots, and a root keeps its meaning wherever it goes. Graph means write, tele means far, scope means look, port means carry. Find the root and you have most of the meaning.',
    check: 'Find the part you have met in other words. What do those other words share?',
    egs: [{ s: 'telescope = far + look', why: 'a tool for looking at things far away' }, { s: 'autograph = self + write', why: 'your name, written by yourself' },
      { s: 'transport · export · portable', why: 'all of them carry something: port means carry' }],
    practise: ['w5-root', 'w5-find', 'w6-families', 'w6-build'],
  },
  origins: {
    label: 'Where words come from', col: '#9A5B13',
    mistake: 'You guess where a word came from by how it looks today, or mix up the stories behind the words.',
    rule: 'English is a borrower. Old English gave the everyday words, the Normans brought French, scholars took Greek and Latin, and travellers and traders brought words from India and everywhere else. A borrowed word carries the story of how it arrived.',
    check: 'Ask what kind of word it is: an everyday thing, a name from a story, a word from science, or a word from far away? Each kind has its usual source.',
    egs: [{ s: 'cow in the field, beef on the table', why: 'the animal kept its Old English name; the meat took the Normans’ French one' },
      { s: 'echo', why: 'the name of a nymph in a Greek myth who could only repeat what others said' }, { s: 'shampoo', why: 'one of the many English words borrowed from India' }],
    practise: ['la1-origin', 'w7-myth-names', 'la2-world', 'la2-india'],
  },
  classes: {
    label: 'Word classes', col: '#B4235A',
    mistake: 'You decide what kind of word it is from the word alone, instead of from the job it does in the sentence.',
    rule: 'A word’s class is its job. A noun names a person, place or thing; a verb says what someone does or is; an adjective describes a noun; an adverb describes a verb; a pronoun stands in for a noun. The same word can change jobs: “run” is a verb in “I run” and a noun in “a long run”.',
    check: 'Ask the word what it is doing here: naming, doing, describing a thing, describing an action, or standing in for a name?',
    egs: [{ s: 'The fox ran quickly home.', why: 'fox names (a noun), ran does (a verb), quickly says how it ran (an adverb)' },
      { s: 'We went for a run. I run every day.', why: 'the same word: a noun in the first sentence, a verb in the second' }, { s: 'Quill was tired, so she slept.', why: '“she” stands in for Quill’s name: a pronoun' }],
    practise: ['s1-noun', 's1-verb', 's1-adj', 's1-more'],
  },
  tense: {
    label: 'Tense and agreement', col: '#3D63C9',
    mistake: 'The verb does not match when it happened, or does not match who is doing it.',
    rule: 'A time word — yesterday, now, tomorrow — sets the tense, and the verb must follow it. The verb also agrees with its subject: one dog barks, two dogs bark. Find the real subject first: in “The box of pencils is here”, the subject is the box, not the pencils.',
    check: 'Find the time word, then find who is doing it. Does the verb fit both?',
    egs: [{ s: 'Yesterday Quill walked to the river.', why: '“yesterday” asks for the past' }, { s: 'The dog barks. The dogs bark.', why: 'one dog takes the -s; more than one does not' },
      { s: 'The box of pencils is on the desk.', why: 'the subject is the box — one box — so “is”' }],
    practise: ['s2-tense', 's2-agree'],
  },
  clauses: {
    label: 'Joining clauses', col: '#0F766E',
    mistake: 'You join two ideas with a word that says the wrong thing, or cannot find the main part of the sentence.',
    rule: 'A clause has a subject and a verb; a phrase does not. The main clause can stand alone as a sentence. Joining words carry meaning: “and” adds, “but” turns, “so” gives a result, “because” gives a reason. Pick the joining word that says how the two ideas fit together.',
    check: 'Cover everything except the part you think is the main one. Can it stand alone as a sentence?',
    egs: [{ s: 'The rain stopped, so we went outside.', why: '“so” says the second thing happened because of the first' },
      { s: 'Although it was late, Quill kept reading.', why: '“Quill kept reading” stands alone: that is the main clause' }, { s: 'under the old bridge', why: 'no verb, so it is a phrase, not a clause' }],
    practise: ['s3-pc', 's3-main', 's4-conj', 's4-combine', 's6-join'],
  },
  capitals: {
    label: 'Capitals and end marks', col: '#A13C2F',
    mistake: 'A capital goes missing from a name or the start of a sentence, or the sentence ends with the wrong mark.',
    rule: 'Every sentence starts with a capital letter. So do the names of people, places, days and months, and the word “I”. A sentence ends with a full stop if it tells, a question mark if it asks, and an exclamation mark if it is said with strong feeling.',
    check: 'Read your first word, then every name. Then say the sentence aloud: does your voice stop, rise, or shout at the end?',
    egs: [{ s: 'On Monday, Asha and I went to Delhi.', why: 'the first word, a day, a person, “I” and a place: five capitals' }, { s: 'Where is my hat?', why: 'it asks, so it ends with a question mark' },
      { s: 'There is no place like home.', work: 'oz', why: 'it tells, so it ends with a full stop' }],
    practise: ['s5-caps', 's5-end'],
  },
  commas: {
    label: 'Commas', col: '#C2410C',
    mistake: 'You put a comma wherever you would take a breath, or leave one out where it keeps two parts apart.',
    rule: 'A comma has a job, not just a pause. It separates the things in a list, follows an opening word or phrase, sets off the name of the person spoken to, and fences off an aside you could lift out. It comes before “and”, “but” or “so” when they join two whole sentences.',
    check: 'Name the job each comma is doing. If you cannot name a job, the comma probably does not belong.',
    egs: [{ s: 'We packed bread, cheese, apples and tea.', why: 'commas separate the things in a list' }, { s: 'After lunch, we went down to the river.', why: 'a comma follows the opening phrase' },
      { s: '"Christmas won\'t be Christmas without any presents," grumbled Jo, lying on the rug.', work: 'littlewomen', why: 'one comma closes Jo’s words; another fences off “lying on the rug”' }],
    practise: ['s5-comma', 's6-fold'],
  },
  apostrophes: {
    label: 'Apostrophes', col: '#7C3AED',
    mistake: 'An apostrophe sneaks into a plain plural, or goes missing from a word that owns something.',
    rule: 'An apostrophe has two jobs only. It shows belonging (the cat’s tail) and it shows letters left out (do not → don’t). A plain plural never takes one: two cats, not two cat’s. “Its” (belonging) has none; “it’s” always means “it is” or “it has”.',
    check: 'Ask: does it own something, or are letters missing? If neither, no apostrophe. For its and it’s, say “it is” in its place — if that works, write it’s.',
    egs: [{ s: 'I have never forgotten my mother\'s advice;', work: 'blackbeauty', why: 'the advice belongs to the mother' }, { s: 'The cat chased its own tail.', why: '“it is own tail” makes no sense, so no apostrophe' },
      { s: 'three apples, not three apple’s', why: 'a plain plural owns nothing' }],
    practise: ['s5-apostrophe'],
  },
  speech: {
    label: 'Speech marks', col: '#BE185D',
    mistake: 'The speech marks close in the wrong place, or the comma ends up outside them.',
    rule: 'Speech marks go round the exact words spoken, and the punctuation that belongs to those words goes inside them. When “said” comes after, the spoken words end with a comma inside the marks, not a full stop. A new speaker starts a new line.',
    check: 'Put your finger on the first and the last word actually spoken. The marks wrap those, and the comma or question mark sits inside.',
    egs: [{ s: '"It will come again to-morrow," said Peter.', work: 'heidi', why: 'Peter’s words, a comma inside the marks, then “said Peter”' },
      { s: '“Are you coming?” asked Quill.', why: 'a question mark takes the comma’s place, still inside' }, { s: 'Quill said, “Wait for me.”', why: 'when “said” comes first, a comma before the marks and a full stop inside' }],
    practise: ['s5-speech'],
  },
  shape: {
    label: 'The shape of a sentence', col: '#4F46A5',
    mistake: 'The matching parts of your sentence do not match, or you rebuild a sentence in an order that does not read.',
    rule: 'A good sentence has a shape. Its matching parts match — “to run, to jump and to swim”, not “to run, jumping and to swim”. Its opening can change so a paragraph does not plod. And where the main point comes changes the effect: put it last and the reader waits for it.',
    check: 'Read the list or the pattern aloud. Does every part start the same way? Where does the main point arrive?',
    egs: [{ s: 'Jim cleaned the cabin, polished the brass and made the beds.', why: 'three parts, all the same shape: cleaned, polished, made' },
      { s: 'they came to jeer, but remained to whitewash.', work: 'tomsawyer', why: 'two halves of the same shape, set against each other' },
      { s: 'Because the river had risen, the bridge was closed.', why: 'the reason comes first, so the main point arrives last' }],
    practise: ['s5-order', 's7-vary', 's8-fix', 's9-spot'],
  },
  reference: {
    label: 'Who is doing it?', col: '#57534E',
    mistake: 'An opening phrase seems to belong to the wrong person or thing, so the sentence says something silly.',
    rule: 'An opening phrase belongs to the first noun after the comma. “Running for the bus, my bag fell open” says the bag was running. Put the one doing it straight after the comma. And say who did what, plainly: “Sam broke the window” is clearer than “The window was broken”.',
    check: 'Ask the opening phrase: who is doing this? Is that who comes right after the comma?',
    egs: [{ s: 'Running for the bus, I dropped my hat.', why: 'I was running, and “I” comes straight after the comma' },
      { s: 'Walking home, we were caught by the rain.', why: 'not “Walking home, the rain began” — the rain was not walking home' }, { s: 'Sam broke the window.', why: 'the active voice names who did it first' }],
    practise: ['la8-modifiers'],
  },
  copying: {
    label: 'Copying exactly', col: '#0369A1',
    mistake: 'A capital, a comma or a letter changes on the way from the page to your writing.',
    rule: 'Copying exactly is a skill of attention. Read a few words, hold them in your head, write them, then check them against the page before you go on. The small marks — capitals, commas, apostrophes, hyphens — are part of the sentence, not decoration.',
    check: 'After each chunk, put one finger on the page and one on your writing, and read both word by word.',
    egs: [{ s: 'Old Marley was as dead as a door-nail.', work: 'carol', why: 'a capital M for a name, and a hyphen in door-nail' },
      { s: 'Little friends may prove great friends.', work: 'aesop', why: 'six words: copy three, check them, then copy three more' }, { s: 'read it back aloud', why: 'your ear catches the word your eye skipped' }],
    practise: ['wr1-copy', 'wr2-dict'],
  },
  reading: {
    label: 'Reading between the lines', col: '#047857',
    mistake: 'You choose an answer because its words appear in the story, not because the story shows it is true.',
    rule: 'A good reading answer is proved by the text. Some answers are said outright; others you work out from what a character says and does. Find the sentence that proves your answer. If you cannot point to it, think again.',
    check: 'Before you answer, ask: which sentence in the story proves this?',
    egs: [{ s: 'You see, but you do not observe.', work: 'holmes', why: 'Holmes’s rule for reading too: looking is not the same as noticing' },
      { s: '"Christmas won\'t be Christmas without any presents," grumbled Jo', work: 'littlewomen', why: '“grumbled” shows how Jo feels without ever saying she is cross' },
      { s: 'The Hare stopped for a nap halfway.', why: 'that is why he lost — the story shows it, so you can point to it' }],
    practise: ['li1-problem', 'li2-traits', 'li3-mood', 'li4-theme'],
  },
  figures: {
    label: 'Figures of speech', col: '#B45309',
    mistake: 'You mix up a simile and a metaphor, or call any lively line a figure of speech.',
    rule: 'A simile compares using “like” or “as”. A metaphor says one thing IS another. Personification gives a thing human actions or feelings. Alliteration repeats a first sound. An idiom means more than its words: “sour grapes” is not about fruit.',
    check: 'Look for “like” or “as” first. No “like” or “as”, but one thing called another? A metaphor. A thing acting like a person? Personification.',
    egs: [{ s: 'Old Marley was as dead as a door-nail.', work: 'carol', why: '“as … as”: a simile' }, { s: 'Hope is the thing with feathers', work: 'dickinson', why: 'hope IS a bird here: a metaphor' },
      { s: 'sour grapes', why: 'an idiom from a fable: pretending not to want what you cannot have' }],
    practise: ['li5-simile', 'li5-sound', 'la5-fables', 'la7-devices'],
  },
  register: {
    label: 'Formal or everyday?', col: '#6D28D9',
    mistake: 'You pick a word that means the right thing but sounds wrong for the reader — too chatty for a letter, too stiff for a friend.',
    rule: 'Many things have an everyday word and a formal one: buy and purchase, tell and inform, put off and postpone. Neither is wrong. Choose by your reader: a friend gets the everyday word, a report or a letter to a stranger gets the formal one. A dialect word is not a mistake either; it belongs to a place.',
    check: 'Picture who will read it. Would they use this word themselves?',
    egs: [{ s: 'buy → purchase', why: 'the same meaning; “purchase” suits a formal letter' }, { s: 'The match was postponed.', why: 'the formal way to say “put off”' },
      { s: 'a wee dog', why: 'Scottish for “small”: a dialect word, not an error' }],
    practise: ['w8-formal', 'w8-purpose', 'la6-register', 'la6-dialect'],
  },
  forms: {
    label: 'Poems, genres and ages', col: '#7E22CE',
    mistake: 'You name a poem’s form or a book’s genre from what it is about, instead of from its shape and its features.',
    rule: 'Form is shape: a sonnet has fourteen lines, a ballad tells a story in short verses, free verse keeps no regular rhyme or beat. Genre is the kind of story: a fable is short and ends with a moral, a mystery hides a puzzle. A period is when it was written, so a date places a work in its age.',
    check: 'Count the lines, listen for the beat, look at how it ends — then decide.',
    egs: [{ s: 'Shall I compare thee to a summer\'s day?', work: 'sonnets', why: 'the opening of a sonnet: fourteen lines, ending in a rhyming couplet' },
      { s: 'Little friends may prove great friends.', work: 'aesop', why: 'a fable ends with a moral like this one' }, { s: 'com-PARE', why: 'the beat falls on the second part — da-DUM, the beat of an iamb' }],
    practise: ['li6-form', 'li7-genre', 'li8-periods', 'la9-stress'],
  },
};
export const TRAP_IDS = Object.keys(TRAPS);

/* every item kind → its trap. items.js KINDS, plus a story's own exercises (storyword, storycomma, storyorder,
   storycopy — their ids carry the kind) and a passage's own questions. `authored` is a written stop: its trap
   is the stop's (STOP_TRAP). */
export const KIND_TRAP = {
  rhyme: 'sounds', onset: 'sounds', oddrime: 'sounds',
  def2word: 'meanings', word2def: 'meanings', storyword: 'meanings',
  prefixMeaning: 'affixes', suffixMeaning: 'affixes', prefixMake: 'affixes', suffixMake: 'affixes',
  rootMeaning: 'roots', rootFind: 'roots', origin: 'origins',
  tapNouns: 'classes', tapVerb: 'classes', tapAdj: 'classes',
  split: 'clauses', subject: 'clauses', phraseClause: 'clauses', mainClause: 'clauses', conj: 'clauses', combine: 'clauses',
  caps: 'capitals', endMark: 'capitals', commas: 'commas', storycomma: 'commas',
  order: 'shape', storyorder: 'shape', imitate: 'shape',
  dictation: 'copying', copy: 'copying', storycopy: 'copying',
  passage: 'reading',
};
/* the written stops (kind `authored`), by name */
export const STOP_TRAP = {
  'w2-opposite': 'meanings', 'w9-strength': 'meanings', 'w9-feeling': 'meanings', 'w10-meanings': 'meanings',
  'w6-families': 'roots', 'w6-build': 'roots', 'w10-clues': 'roots',
  'w7-myth-names': 'origins', 'w7-myth-heroes': 'origins', 'w7-myth-story-inside': 'origins',
  'la2-india': 'origins', 'la2-world': 'origins', 'la3-old-english': 'origins', 'la3-print': 'origins', 'la4-shakespeare': 'origins', 'la10-world': 'origins',
  'w8-formal': 'register', 'w8-purpose': 'register', 'la6-register': 'register', 'la6-dialect': 'register', 'la10-indian': 'register',
  's1-more': 'classes', 's2-tense': 'tense', 's2-agree': 'tense',
  's5-apostrophe': 'apostrophes', 's5-speech': 'speech',
  's6-join': 'clauses', 's6-fold': 'clauses',
  's7-name': 'shape', 's7-vary': 'shape', 's8-spot': 'shape', 's8-fix': 'shape', 's9-spot': 'shape', 's9-effect': 'shape', 's10-meet': 'shape', 's10-check': 'shape', 'la8-concise': 'shape',
  'la8-modifiers': 'reference',
  'li1-who-where': 'reading', 'li1-problem': 'reading', 'li2-wants': 'reading', 'li2-traits': 'reading', 'li3-mood': 'reading', 'li4-theme': 'reading', 'li9-compare': 'reading',
  'li5-simile': 'figures', 'li5-sound': 'figures', 'la5-fables': 'figures', 'la5-myths': 'figures', 'la7-devices': 'figures', 'la7-antithesis': 'figures',
  'li6-form': 'forms', 'li7-genre': 'forms', 'li8-periods': 'forms', 'la9-stress': 'forms', 'la9-pentameter': 'forms',
};
/* stops that are never machine-marked (the writing desk, the Stage): a grown-up's rubric judges them, so they
   can never be a miss — and the Coach never pretends to read them */
export const UNMARKED = ['desk', 'speak', 'readAloud'];

/* a game's or a tool's miss category → its trap (play.js run.misses; tools.js; ears.js). A string is the whole
   game's trap; an object maps each category, `*` for any other. */
export const GAME_TRAP = {
  builder: 'clauses', rush: 'commas', figure: 'figures', duel: 'figures', root: { root: 'roots', prefix: 'affixes', suffix: 'affixes', '*': 'roots' },
  plot: 'reading', who: 'reading', ears: 'reading', vocab: 'meanings', idioms: 'figures', typing: 'copying',
};

/* the daily goal's defaults by age band (coach.js targets): minutes on the app, minutes practising, right answers */
export const TARGET_DEFAULTS = { 1: { app: 15, prac: 10, words: 10 }, 2: { app: 20, prac: 10, words: 15 }, 3: { app: 30, prac: 15, words: 20 } };

/* Quill's habit of the day — one card, turned over (Bee's SB_COACH_TIPS) */
export const HABITS = [
  ['Read the question twice', 'Most slips are a question read too fast. Read it, then read it again before you look at the choices.'],
  ['Say it aloud', 'Your ear knows English better than your eye does. A sentence that sounds wrong usually is.'],
  ['Prove it with the text', 'In a reading question, put your finger on the sentence that proves your answer before you choose it.'],
  ['One slip is a clue', 'A wrong answer tells you exactly what to practise next. That makes it worth more than a lucky right one.'],
  ['Small chunks', 'When you copy or build a sentence, take three or four words at a time and check them before going on.'],
  ['Come back tomorrow', 'Something you got right today only counts as learned when you get it right again on a later day.'],
  ['Find the job', 'For a comma, a capital or a word class, ask what job it is doing. If it has no job, it does not belong.'],
  ['Picture your reader', 'Before you choose a word, picture who will read it. A friend and a headteacher need different words.'],
];
