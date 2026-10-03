/* gap-stops.js — WRITTEN stops that close gaps in the coverage map (tools/coverage/concepts.mjs):
   word classes beyond noun, verb and adjective (Sentence 1), tense and agreement (Sentence 2), the
   apostrophe and speech marks (Sentence 5), opposites and near-twins (Word 2) — and a poem-writing desk
   (Writing 6).

   Written in exactly the shape of LANG_STOPS (data/language.js) and run through the same engine
   (items.js kind `authored`), so test/items.mjs and test/gap-stops.mjs hold them to the same rules.

   Rules this file keeps (CLAUDE.md):
   - Grammar is the simple, undisputed kind taught in every school: no "data is/are", no "none is/are",
     no "each of them have". Agreement is standard written English, and the stop says so — a dialect
     that does it differently is not a mistake.
   - The engine compares options with their punctuation stripped (apostrophes kept), so no two options
     differ by punctuation alone. Apostrophe items differ by where the apostrophe sits (kept by the
     engine) or by a word; speech-mark items give every wrong option a different word as well as its
     punctuation slip.
   - A correctly punctuated speech sentence is a REAL line from a held, cleared classic, exact
     (`rightFrom` names the work; test/gap-stops.mjs checks it). The wrong versions are our own and are
     never attributed to anyone.
   - Opposites and near-twins use only undisputed pairs; a wrong option is never a second defensible
     answer.
   - Every item: one right answer, three wrong, the answer not in the question (unless every option is
     in the quoted line), the right answer not the longest by more than 40%.

   Bands: 1 = ages 6–7, 2 = ages 8–10. */

const NC = 'Department for Education, The National Curriculum in England: English programmes of study, key stages 1 and 2 (2013), Appendix 2: Vocabulary, grammar and punctuation';
const OZ = 'L. Frank Baum, The Wonderful Wizard of Oz (1900), held text — the correctly punctuated line';
const LW = 'Louisa May Alcott, Little Women (1868), held text — the correctly punctuated line';
const RAIL = 'E. Nesbit, The Railway Children (1906), held text — the correctly punctuated line';

const mc = (q, right, wrong, extra = {}) => ({ q, right, wrong, ...extra });
const KIND = (sentence, word) => `In "${sentence}", what kind of word is "${word}"?`;

export const GAP_STOPS = [
  // ── Sentence 1 · More word classes ──
  {
    id: 's1-more', level: 1, strand: 'sentence', band: 1, needsReview: false,
    title: 'Adverbs, pronouns and prepositions', iCan: 'I can say whether a word is an adverb, a pronoun or a preposition.',
    story: 'Quill the fox crept quietly under the gate, and then it looked for Bee. "Three little words in that sentence do three different jobs," says Quill. "Can you spot them?"',
    learn: {
      why: 'An adverb tells you more about a verb: how, when or where something happens (crept QUIETLY). A pronoun stands in for a noun so you do not have to repeat it (Quill → it, Bee and Quill → they). A preposition sits in front of a noun and shows where or when it is: under the gate, after lunch, between the trees.',
      example: ['adverb: Quill crept [quietly].', 'pronoun: [It] looked for Bee.', 'preposition: Quill crept [under] the gate.'],
    },
    sources: [NC],
    items: [
      mc(KIND('The fox ran quickly home', 'quickly'), 'an adverb', ['a noun', 'a pronoun', 'a preposition']),
      mc(KIND('She found a red kite', 'She'), 'a pronoun', ['an adverb', 'a verb', 'a preposition']),
      mc(KIND('The cat slept under the table', 'under'), 'a preposition', ['an adverb', 'a pronoun', 'an adjective']),
      mc(KIND('They waited for the bus', 'They'), 'a pronoun', ['a preposition', 'an adjective', 'an adverb']),
      mc(KIND('The baby sang softly', 'softly'), 'an adverb', ['a pronoun', 'a noun', 'a preposition']),
      mc(KIND('Quill hid behind the door', 'behind'), 'a preposition', ['a pronoun', 'an adjective', 'an adverb']),
      mc(KIND('The dog wagged its tail because it was happy', 'it'), 'a pronoun', ['an adverb', 'a preposition', 'a verb']),
      mc(KIND('The horse jumped over the fence', 'over'), 'a preposition', ['a pronoun', 'a noun', 'an adjective']),
      mc(KIND('Bee waved happily at the bus', 'happily'), 'an adverb', ['a preposition', 'a pronoun', 'a noun']),
      mc(KIND('Grandma gave us a story', 'us'), 'a pronoun', ['an adverb', 'a preposition', 'an adjective']),
      mc(KIND('A river runs between the hills', 'between'), 'a preposition', ['an adverb', 'a pronoun', 'an adjective']),
      mc(KIND('The owl hooted loudly', 'loudly'), 'an adverb', ['a noun', 'a preposition', 'a pronoun']),
      mc(KIND('We planted seeds in the garden', 'We'), 'a pronoun', ['a noun', 'an adverb', 'a preposition']),
      mc(KIND('The mouse ran into its hole', 'into'), 'a preposition', ['an adjective', 'a pronoun', 'an adverb']),
      mc('Which word could take the place of "Quill" in "Quill ate an apple"?', 'It', ['Under', 'Slowly', 'Apple']),
      mc('Which word tells you HOW the bird sang in "The bird sang sweetly in the willow"?', 'sweetly', ['bird', 'willow', 'in']),
    ],
  },

  // ── Sentence 2 · Past, present, future ──
  {
    id: 's2-tense', level: 2, strand: 'sentence', band: 1, needsReview: false,
    title: 'Past, present, future', iCan: 'I can choose the verb that shows when something happens.',
    story: 'Yesterday Quill the fox painted the gate. Right now Quill is washing the brushes. Tomorrow Quill will paint the shed. "Same fox, same paint," says Quill, "but my verbs keep changing!"',
    learn: {
      why: 'The verb tells you WHEN. The past has already happened: Quill painted, Quill went. The present is happening now: Quill is painting. The future has not happened yet: Quill will paint. Many past verbs end in -ed, but some of the commonest do not: go → went, eat → ate, fly → flew. Time words like yesterday, now and tomorrow are clues.',
      example: ['past: Yesterday Quill [painted] the gate.', 'present: Right now Quill [is washing] the brushes.', 'future: Tomorrow Quill [will paint] the shed.'],
    },
    sources: [NC],
    items: [
      mc('Choose the verb: "Yesterday Quill ___ to the river."', 'walked', ['walking', 'will walk', 'is walking']),
      mc('Choose the verb: "Tomorrow Quill ___ its grandmother."', 'will visit', ['visited', 'was visiting', 'has visited']),
      mc('Choose the verb: "Look! Quill ___ across the field right now."', 'is running', ['ran', 'will run', 'was running']),
      mc('Choose the verb: "Yesterday Quill ___ a kite."', 'flew', ['flied', 'flyed', 'will fly']),
      mc('Choose the verb: "Last night the fox ___ a strange dream."', 'had', ['haved', 'will have', 'is having']),
      mc('Choose the verb: "Yesterday Quill ___ to the shop."', 'went', ['goed', 'will go', 'is going']),
      mc('Choose the verb: "Yesterday the fox ___ three plums."', 'ate', ['eated', 'will eat', 'is eating']),
      mc('Choose the verb: "Next week Bee ___ a new song."', 'will learn', ['learned', 'was learning', 'has learned']),
      mc('Choose the verb: "Shh! The baby ___ at this very moment."', 'is sleeping', ['slept', 'will sleep', 'was sleeping']),
      mc('Choose the verb: "Last summer we ___ a sandcastle."', 'built', ['builded', 'will build', 'are building']),
      mc('Which time word fits? "___, Quill will paint the shed."', 'Tomorrow', ['Yesterday', 'Last week', 'Long ago']),
      mc('Which time word fits? "___, Quill painted the gate."', 'Yesterday', ['Tomorrow', 'Next week', 'Next year']),
      mc('Which time word fits? "___, Quill is washing the brushes."', 'Right now', ['Yesterday', 'Last week', 'Long ago']),
      mc('Which sentence is about the FUTURE?', 'Bee will sing at the party.', ['Bee sang at the party.', 'Bee is singing at the party.', 'Bee was singing at the party.']),
      mc('Which sentence is about the PAST?', 'The owl caught a mouse.', ['The owl will catch a mouse.', 'The owl is catching a mouse.', 'The owl catches mice every night.']),
    ],
  },

  // ── Sentence 2 · Does it agree? ──
  {
    id: 's2-agree', level: 2, strand: 'sentence', band: 2, needsReview: false,
    title: 'Does it agree?', iCan: 'I can choose a verb that agrees with its subject.',
    story: 'Quill the fox wrote "The birds sings" and frowned. "One bird sings. Two birds sing," says Quill. "My verb has to match who is doing it."',
    learn: {
      why: 'In standard written English the verb agrees with its subject. One fox runs; two foxes run. I am, you are, she is, they are. Find the subject first — the real one. In "The box of crayons is on the table", the subject is the box (one box), not the crayons. Two subjects joined by "and" make a plural: Quill and Bee are friends. (Some dialects do this differently, and that is not a mistake; here we practise the standard written form.)',
      example: ['One bird [sings]. Two birds [sing].', 'The box of crayons [is] on the table.', 'Quill and Bee [are] friends.'],
    },
    sources: [NC],
    items: [
      mc('Choose the verb that agrees: "The dogs ___ at the postman."', 'bark', ['barks', 'is barking', 'was barking']),
      mc('Choose the verb that agrees: "My sister ___ the piano."', 'plays', ['play', 'are playing', 'were playing']),
      mc('Choose the verb that agrees: "The children ___ in the park."', 'are', ['is', 'am', 'was']),
      mc('Choose the verb that agrees: "Quill and Bee ___ best friends."', 'are', ['is', 'am', 'was']),
      mc('Choose the verb that agrees: "The box of crayons ___ on the table."', 'is', ['are', 'were', 'am']),
      mc('Choose the verb that agrees: "He ___ to school on the bus."', 'goes', ['go', 'are going', 'were going']),
      mc('Choose the verb that agrees: "They ___ their homework after tea."', 'do', ['does', 'is doing', 'was doing']),
      mc('Choose the verb that agrees: "I ___ very hungry."', 'am', ['is', 'are', 'be']),
      mc('Choose the verb that agrees: "There ___ three apples in the bowl."', 'are', ['is', 'was', 'am']),
      mc('Choose the verb that agrees: "The flowers in the window box ___ water."', 'need', ['needs', 'is needing', 'was needing']),
      mc('Which sentence has a verb that does NOT agree with its subject?', 'The birds sings at dawn.', ['The bird sings at dawn.', 'The birds sang at dawn.', 'Birds sing at dawn.']),
      mc('Which sentence has a verb that does NOT agree with its subject?', 'My brothers plays football.', ['My brother plays football.', 'My brothers play football.', 'My brothers played football.']),
      mc('Which sentence has a verb that does NOT agree with its subject?', 'The cat and the dog is asleep.', ['The cat and the dog are asleep.', 'The cat is asleep.', 'The dog was asleep.']),
      mc('Which sentence has a verb that does NOT agree with its subject?', 'The leaves on the tree is falling.', ['The leaves on the tree are falling.', 'The leaf on the tree is falling.', 'The leaves were falling.']),
      mc('Which sentence has a verb that does NOT agree with its subject?', 'Quill want a sandwich.', ['Quill wants a sandwich.', 'The foxes want sandwiches.', 'We want a sandwich.']),
    ],
  },

  // ── Sentence 5 · The apostrophe ──
  {
    id: 's5-apostrophe', level: 5, strand: 'sentence', band: 2, needsReview: false,
    title: 'Whose is it? The apostrophe', iCan: 'I can use an apostrophe to show belonging or a missing letter, and leave it out of a plain plural.',
    story: 'Quill the fox found a sign at the market: "Fresh apple\'s!" "Nothing belongs to the apples," laughs Quill, "and no letters are missing. That apostrophe has wandered in by mistake."',
    learn: {
      why: 'An apostrophe does two jobs. It shows belonging: the dog\'s bowl (one dog), the dogs\' bowls (more than one dog), the children\'s coats. And it shows where letters are missing: can\'t = cannot, it\'s = it is. A plain plural never needs one: three apples. Watch "its": its tail means the tail belonging to it, with no apostrophe — "it\'s" always means "it is" or "it has".',
      example: ['belonging: the dog\'s bowl · the dogs\' bowls', 'missing letters: can\'t = cannot · it\'s = it is', 'plain plural: three apples (no apostrophe)'],
    },
    sources: [NC],
    items: [
      mc('Choose the word: "The cat chased ___ own tail."', 'its', ["it's", "its'", "it is"]),
      mc('In "It\'s raining", what does "It\'s" stand for?', 'it is', ['belonging to it', 'more than one it', 'it was not']),
      mc('Choose the word: "I bought three ___ at the market."', 'apples', ["apple's", "apples'", "apple'"]),
      mc('Choose the word (the coats belong to the children): "The ___ coats hung in a row."', "children's", ["childrens'", 'childrens', "childs'"]),
      mc('Choose the word (the tails of TWO dogs): "Both ___ tails were wagging."', "dogs'", ["dog's", 'dogs', "dogs's"]),
      mc('Choose the word (the hat of ONE man): "The ___ hat blew away."', "man's", ["mans'", "mens'", 'mans']),
      mc('Choose the word: "We ___ go out until the rain stops."', "can't", ["cant'", "ca'nt", "cann't"]),
      mc('Choose the word: "She ___ finished her lunch yet."', "hasn't", ["has'nt", "hasnt'", 'hasnt']),
      mc('Choose the word: "___ coat is this on the floor?"', 'Whose', ["Who's", "Whos'", "Whose'"]),
      mc('In "the dogs\' bowls", how many dogs are there?', 'two or more', ['only one', 'no dogs at all', 'exactly half']),
      mc('In "the dog\'s bowls", how many dogs are there?', 'only one', ['two or more', 'no dogs at all', 'exactly ten']),
      mc('What does the apostrophe in "don\'t" show?', 'letters left out', ['something owned', 'more than one', 'a person\'s name']),
      mc('What does the apostrophe in "Quill\'s hat" show?', 'belonging', ['letters left out', 'more than one', 'a question']),
      mc('Choose the word (the nest of ONE bird): "The ___ nest was full of eggs."', "bird's", ["birds'", 'birds', "birds's"]),
      mc('Choose the word: "The fox licked ___ paw clean."', 'its', ["it's", "its'", "it'is"]),
    ],
  },

  // ── Sentence 5 · Speech marks ──
  {
    id: 's5-speech', level: 5, strand: 'sentence', band: 2, needsReview: false,
    title: 'Speech marks', iCan: 'I can punctuate the words someone says.',
    story: 'Quill the fox is reading The Wonderful Wizard of Oz aloud and doing all the voices. "The speech marks tell me when to switch," says Quill, "and the commas tell me when to breathe."',
    learn: {
      why: 'Speech marks go around the exact words someone says. The spoken words start with a capital letter. Their last mark — a comma, a question mark or an exclamation mark — goes INSIDE the closing speech mark, and the words that tell you who spoke come after. If the speaker comes first, put a comma after "said" and then open the speech marks. A new speaker starts a new paragraph.',
      example: ['"Anyone would know that," said Dorothy.', '"Are you a Munchkin?" asked Dorothy.', 'Bobbie said, "Come on, Phil; I\'ll race you to the gate."'],
    },
    sources: [NC, OZ, RAIL, LW],
    items: [
      mc('Which sentence punctuates the speech correctly?', '"Are you a Munchkin?" asked Dorothy.',
        ['"Are you a Munchkin"? Dorothy asked.', '"Are you a Munchkin? asked the girl."', 'Are you a Munchkin? wondered Dorothy.'], { rightFrom: 'oz', sources: [OZ] }),
      mc('Which sentence punctuates the speech correctly?', '"Anyone would know that," said Dorothy.',
        ['"Anyone would know that." Dorothy said.', '"Anyone would know that" said the girl.', '"Anyone would know that, replied Dorothy."'], { rightFrom: 'oz', sources: [OZ] }),
      mc('Which sentence punctuates the speech correctly?', '"Did you speak?" asked the girl, in wonder.',
        ['"Did you speak"? asked the child, in wonder.', 'Did you speak? asked the girl, in surprise.', '"Did you speak, asked Dorothy in wonder?"'], { rightFrom: 'oz', sources: [OZ] }),
      mc('Which sentence punctuates the speech correctly?', '"It may be," said the Lion.',
        ['"It may be." replied the Lion.', '"It may be, said the big Lion."', 'It may be, said the old Lion.'], { rightFrom: 'oz', sources: [OZ] }),
      mc('Which sentence punctuates the speech correctly?', '"Oh, gracious!" cried Dorothy.',
        ['"Oh, gracious"! cried the girl.', '"Oh, gracious! shouted Dorothy."', 'Oh, gracious! called Dorothy.'], { rightFrom: 'oz', sources: [OZ] }),
      mc('Which sentence punctuates the speech correctly?', '"Come on, Phil," cried Peter, eagerly.',
        ['"Come on, Phil" cried Peter, loudly.', '"Come on, Phil, shouted Peter, eagerly."', 'Come on, Phil, called Peter, eagerly.'], { rightFrom: 'railway', sources: [RAIL] }),
      mc('Which sentence punctuates the speech correctly?', 'Bobbie said, "Come on, Phil; I\'ll race you to the gate."',
        ['Bobbie shouted, "come on, Phil; I\'ll race you to the gate".', 'Bobbie said, Come on, Phil; I\'ll race you to the big gate.', 'Bobbie called, "Come on, Phil; I\'ll race you to the gate.'], { rightFrom: 'railway', sources: [RAIL] }),
      mc('Which sentence punctuates the speech correctly?', '"Christmas won\'t be Christmas without any presents," grumbled Jo, lying on the rug.',
        ['"Christmas won\'t be Christmas without any presents" grumbled Meg, lying on the rug.', '"Christmas won\'t be Christmas without any presents, sighed Jo, lying on the rug."', 'Christmas won\'t be Christmas without any gifts, grumbled Jo, lying on the rug.'], { rightFrom: 'littlewomen', sources: [LW] }),
      mc('When the spoken words come first and end with a comma, where does that comma go?', 'inside the closing speech marks',
        ['outside the closing speech marks', 'straight after the word said', 'before the opening speech marks']),
      mc('What goes around the exact words a person says?', 'speech marks', ['brackets', 'full stops', 'capital letters']),
      mc('In a story, when a different person starts to speak, the writer usually…', 'starts a new paragraph', ['uses brackets', 'leaves out the commas', 'writes in capitals']),
      mc('Which word in this line tells you how the words were spoken?', 'said', ['send', 'back', 'Kansas'],
        { quote: '"Or send me back to Kansas," said Dorothy.', work: 'oz', sources: [OZ] }),
      mc('Which words in this line are spoken aloud?', 'Good day', ['said the Scarecrow', 'husky voice', 'the Scarecrow'],
        { quote: '"Good day," said the Scarecrow, in a rather husky voice.', work: 'oz', sources: [OZ] }),
      mc('Why does "and" have no capital letter in this line?', 'the same sentence goes on', ['it is not spoken', 'the girl whispers it', 'it follows a name'],
        { quote: '"My name is Dorothy," said the girl, "and I am going to the Emerald City', work: 'oz', sources: [OZ] }),
      mc('Why does this line end its spoken words with a question mark, not a comma?', 'the words ask something', ['Dorothy is a name', 'the line is very short', 'the speaker is a girl'],
        { quote: '"What makes you a coward?" asked Dorothy,', work: 'oz', sources: [OZ] }),
    ],
  },

  // ── Word 2 · Opposites and near-twins ──
  {
    id: 'w2-opposite', level: 2, strand: 'word', band: 1, needsReview: false,
    title: 'Opposites and near-twins', iCan: 'I can find a word that means the same, or the opposite.',
    story: 'Quill the fox has two piles of word cards: twins that mean the same (big, large) and opposites that pull apart (big, small). "A word can have both," says Quill, "and knowing them makes my sentences sharper."',
    learn: {
      why: 'Words that mean the same, or nearly the same, are synonyms: big and large, start and begin. Words that mean the opposite are antonyms: hot and cold, full and empty. To check an opposite, put the two words in the same sentence — "The cup is full. The cup is empty." — and see if they pull in opposite directions. Watch out: a synonym can sneak in among the opposites.',
      example: ['same: big → large · start → begin', 'opposite: hot → cold · full → empty'],
    },
    sources: ['Oxford Thesaurus of English (Oxford University Press, 3rd edition, 2009)'],
    items: [
      mc('Which word means the OPPOSITE of "hot"?', 'cold', ['boiling', 'bright', 'sweet']),
      mc('Which word means the OPPOSITE of "big"?', 'small', ['large', 'round', 'loud']),
      mc('Which word means the OPPOSITE of "happy"?', 'sad', ['glad', 'kind', 'sleepy']),
      mc('Which word means the OPPOSITE of "full"?', 'empty', ['heavy', 'round', 'packed']),
      mc('Which word means the OPPOSITE of "asleep"?', 'awake', ['tired', 'quiet', 'dreaming']),
      mc('Which word means the OPPOSITE of "early"?', 'late', ['soon', 'quick', 'often']),
      mc('Which word means the OPPOSITE of "ancient"?', 'modern', ['old', 'broken', 'famous']),
      mc('Which word means the OPPOSITE of "generous"?', 'selfish', ['kind', 'giving', 'brave']),
      mc('Which word means the SAME as "big"?', 'large', ['tiny', 'slow', 'soft']),
      mc('Which word means the SAME as "start"?', 'begin', ['finish', 'stop', 'wait']),
      mc('Which word means the SAME as "quick"?', 'fast', ['slow', 'late', 'weak']),
      mc('Which word means the SAME as "little"?', 'small', ['huge', 'tall', 'wide']),
      mc('Which word means the SAME as "glad"?', 'happy', ['cross', 'sad', 'tired']),
      mc('Which word means the SAME as "enormous"?', 'huge', ['tiny', 'narrow', 'gentle']),
      mc('Which pair are opposites?', 'loud and quiet', ['loud and noisy', 'quiet and silent', 'soft and gentle']),
      mc('Which pair mean the same?', 'angry and cross', ['angry and calm', 'cross and pleased', 'happy and sad']),
    ],
  },
];

// ── Writing 6 · A poem of your own (a writing desk, as wr4-para…wr10-model in curriculum.js) ──
export const POEM_DESK_STOP = {
  id: 'wr6-poem', level: 6, title: 'A poem of your own', kind: 'desk',
  iCan: 'I can write a short poem, line by line, with a picture and a sound pattern in it.',
  story: 'Quill the fox has learned a poem by heart, and now it wants to write one. "A poem is a picture made of sounds," says Quill. "Short lines, chosen words — and no one can tell you it is wrong."',
  learn: {
    why: 'A poem is written in LINES: you choose where each one ends, so press Enter at the end of every line. Start with one thing you can see, hear or feel, and give it a picture — a colour, a sound, a comparison ("as quiet as snow"). Then add one sound pattern: a rhyme, a line that repeats, or words that start with the same sound. A poem does not have to rhyme. Read it aloud and change any word that trips your tongue.',
    example: ['Robert Louis Stevenson: “I have a little shadow that goes in and out with me,”', 'One line: what you see. One line: what you hear.', 'A last line that surprises.'],
  },
  desk: {
    prompts: ['Rain on a window', 'An animal you have watched closely', 'The sounds of your home at night', 'A season: how it looks, sounds and smells', 'Your favourite food, as if it were treasure', 'A list poem: begin every line with “I wish…”'],
    parts: [['Title', 'Give your poem a name.'], ['Your poem', 'At least four lines. Press Enter at the end of each line. Rhyme if you like — it does not have to.'], ['Read it aloud', 'Which line sounds best to you? Say why in a sentence.']],
    check: ['I wrote at least four lines, each on its own line', 'I used at least one picture: a colour, a sound or a comparison', 'I tried a sound pattern: a rhyme, a repeated line, or words starting with the same sound', 'I read it aloud and changed one word to make it sound better'],
    min: 4,
    unit: 'lines',  // a poem is counted in LINES: writing.js counts sentences today (see the lead's note) — desk.js should read c[desk.unit || 'sentences']
  },
};
