/* curriculum.js — the spine (SPEC §2): seven strands in the owner's order, ten levels each.

   A child moves through the strands IN PARALLEL, not down one road (Maths' worldOpen pattern):
   a strand opens by age band or by the strand before it (`opens`), and its levels open in order.
   Every stop teaches in Maths' pattern — Story → Learn (the why, worked) → Your turn → Check —
   and states ONE objective as an "I can…" sentence. A stop is PASSED on its check; the objective
   is LEARNED only on a later-day check (mastery.js). Levels with no stops yet say so honestly
   and point somewhere useful; they are never a dead end.

   `kind` names the item generator in items.js; `plan` marks what the family plan opens. */
import { LANG_STOPS } from './data/language.js';
import { LIT_STOPS, CASE_DESK } from './data/literature.js';
import { WORD_STOPS } from './data/word-stops.js';
import { SENTENCE_STOPS } from './data/sentence-stops.js';

export const BANDS = [
  { id: 1, label: '6–7', age: 'ages 6–7' },
  { id: 2, label: '8–10', age: 'ages 8–10' },
  { id: 3, label: '11–14', age: 'ages 11–14' },
];

const L = (n, title, iCan, stops = [], opts = {}) => ({ n, title, iCan, stops, ...opts });
const S = (id, title, kind, iCan, story, learn, extra = {}) => ({ id, title, kind, iCan, story, learn, ...extra });

export const STRANDS = [
  { id: 'word', n: 1, title: 'Word', sub: 'spelling and vocabulary', icon: 'key', colour: '#C2410C', free: true,
    levels: [
      L(1, 'Word families', 'I can hear and build words that rhyme.', [
        S('w1-rhyme', 'Rhyme time', 'rhyme', 'I can find the word that rhymes.',
          'Quill is writing a poem for the garden party and needs a word to rhyme with "cat". The hat is taken. What else?',
          { why: 'Words that end with the same sound rhyme. Cat, hat and mat all end in the sound "-at" — that ending is called the rime, and words that share it make a family.', example: ['cat', 'hat', 'mat', 'bat'] }),
        S('w1-build', 'Build a word', 'onset', 'I can make a real word by changing its first sound.',
          'A gust of wind has blown the first letters off Quill\'s word cards. Only the endings are left.',
          { why: 'Keep the ending, change the start, and you get a new word: "-ig" can be big, dig, fig, pig. But not every start works — "zig" on its own is not a word here.', example: ['b + ig = big', 'd + ig = dig', 'p + ig = pig'] }),
        S('w1-odd', 'Odd one out', 'oddrime', 'I can spot the word that does not belong to a family.',
          'Four words are queuing for the "-op" family photo. One of them has sneaked in from another family.',
          { why: 'Look at the END of each word, not the start. Hop, top and mop end in "-op". A word that ends differently is from another family.', example: ['hop', 'top', 'mop', 'map ← not -op'] }),
      ]),
      L(2, 'What words mean', 'I can match a word to its meaning.', [
        S('w2-meaning', 'Which word means…?', 'def2word', 'I can choose the word that matches a meaning.',
          'Quill found a dictionary with the words torn off the top of each entry. Only the meanings are left.',
          { why: 'A definition says what a word means in other words. Read the whole definition, then try each word in your head: does it mean exactly that?', example: ['"a baby cat" → kitten'] }),
        S('w2-word', 'What does it mean?', 'word2def', 'I can choose the meaning of a word.',
          'Now the opposite: the words are there, but the meanings have blown away.',
          { why: 'If you are not sure, think of a sentence you have heard the word in. The meaning that fits that sentence is usually right.', example: ['gigantic → very, very big'] }),
      ]),
      L(3, 'Prefixes', 'I can use a prefix to change what a word means.', [
        S('w3-meaning', 'What a prefix means', 'prefixMeaning', 'I can say what a common prefix means.',
          'Quill has a box of little word-starts — un-, re-, pre-, mis- — and each one changes a word in its own way.',
          { why: 'A prefix sits at the FRONT of a word and changes its meaning. "Un-" means not: unhappy is not happy. "Re-" means again: rebuild is build again.', example: ['un + happy = not happy', 're + build = build again'] }),
        S('w3-make', 'Make the word', 'prefixMake', 'I can choose the prefix that makes a meaning.',
          'A word needs a new front to mean something new. Which prefix will do it?',
          { why: 'Work out what you need the new word to mean — "not", "again", "before", "badly" — then pick the prefix that carries that meaning.', example: ['"to judge badly" → mis + judge'] }),
      ]),
      L(4, 'Suffixes', 'I can use a suffix to change a word\'s meaning and job.', [
        S('w4-meaning', 'What a suffix means', 'suffixMeaning', 'I can say what a common suffix means.',
          'Word-ends this time: -ful, -less, -ness. They hang on the back of a word like a tail.',
          { why: 'A suffix sits at the END of a word. "-less" means without: fearless is without fear. "-ful" means full of. A suffix often changes the word\'s job too — "kind" describes, "kindness" is a thing.', example: ['fear + less = without fear', 'kind + ness = being kind'] }),
        S('w4-make', 'Make the word', 'suffixMake', 'I can choose the suffix that makes a meaning.',
          'Quill needs a word that means "full of colour". Which tail does the job?',
          { why: 'Decide what the new word must mean, then choose the suffix that carries that meaning. Watch for spelling changes: happy + ness = happiness.', example: ['"full of colour" → colour + ful'] }),
      ]),
      L(5, 'Latin and Greek roots', 'I can use a root to work out a new word.', [
        S('w5-root', 'What the root means', 'rootMeaning', 'I can say what a Latin or Greek root means.',
          'Inside many long English words is a short old word from Latin or Greek. Find it, and the long word opens up.',
          { why: 'A root is the core of a word. "Dict" comes from Latin dicere, to say — so a dictionary is a book of sayings, and to predict is to say before.', example: ['dict = say → dictate, predict, contradict'] }),
        S('w5-find', 'Find the root', 'rootFind', 'I can find the word that contains a root.',
          'Quill is hunting for words built on "port" — to carry. Which one really has it?',
          { why: 'Look for the root inside the word, and check the meaning fits: a portable thing can be carried. A word can contain the letters without the meaning — check both.', example: ['port = carry → transport, portable'] }),
      ]),
      L(6, 'More roots and their families', 'I can group words by the root they share.'),
      L(7, 'Words from the classics', 'I can use the hard words from the books I read.'),
      L(8, 'Register', 'I can choose a formal or an everyday word on purpose.'),
      L(9, 'Shades of meaning', 'I can choose the most precise word.'),
      L(10, 'Ready for the Bee', 'I can spell and use the vocabulary of the texts I have studied.'),
    ] },
  { id: 'sentence', n: 2, title: 'Sentence', sub: 'structure and grammar', icon: 'blocks', colour: '#1D4ED8', free: true,
    levels: [
      L(1, 'Parts of speech', 'I can name the job each word does.', [
        S('s1-noun', 'Naming words', 'tapNouns', 'I can find the nouns in a sentence.',
          'Quill is labelling everything in the study: the lamp, the desk, the fire. Every label is a noun.',
          { why: 'A noun names a person, an animal, a place or a thing: girl, tiger, Delhi, umbrella. If you can put "the" or "a" in front of it, it is often a noun.', example: ['The [fox] found a [quill] in the [garden].'] }),
        S('s1-verb', 'Doing words', 'tapVerb', 'I can find the verb in a sentence.',
          'Something is always happening in a story. The word that tells you what happens is the verb.',
          { why: 'A verb says what someone does or is: run, jumped, is, thought. Ask "what happened?" — the answer is the verb.', example: ['The fox [jumped] over the gate.'] }),
        S('s1-adj', 'Describing words', 'tapAdj', 'I can find the adjective or adverb in a sentence.',
          'Quill wants every sentence to paint a picture. The words that add colour are adjectives and adverbs.',
          { why: 'An adjective describes a noun (a RED kite). An adverb describes a verb — how, when or where (she ran QUICKLY).', example: ['The [tiny] mouse squeaked [loudly].'] }),
      ]),
      L(2, 'Subject and predicate', 'I can split a sentence into who it is about and what they do.', [
        S('s2-split', 'Where the subject ends', 'split', 'I can show where the subject ends.',
          'Every sentence has two halves, like a seesaw: who it is about, and what they did.',
          { why: 'The subject is who or what the sentence is about. The predicate is everything said about them, starting with the verb. Find the verb — the subject is the part before it.', example: ['The old lighthouse keeper | climbed the stairs.'] }),
        S('s2-subject', 'Find the subject', 'subject', 'I can find the complete subject.',
          'Who is this sentence really about? Not just one word — the whole subject.',
          { why: 'The complete subject is all the words that tell you who or what: not "keeper" but "the old lighthouse keeper".', example: ['[The old lighthouse keeper] climbed the stairs.'] }),
      ]),
      L(3, 'Phrases and clauses', 'I can tell a phrase from a clause.', [
        S('s3-pc', 'Phrase or clause?', 'phraseClause', 'I can tell whether a group of words is a phrase or a clause.',
          'Some groups of words can stand up on their own two feet. Others need a sentence to lean on.',
          { why: 'A clause has a subject AND a verb: "the bell rang". A phrase is missing one of them: "after the bell". Look for someone doing something.', example: ['the bell rang → clause', 'after the bell → phrase'] }),
        S('s3-main', 'The main clause', 'mainClause', 'I can find the main clause in a sentence.',
          'A long sentence often has a main clause — the part that could be a sentence all by itself — and a helper.',
          { why: 'A main clause makes sense alone. A clause that begins with when, because, if or although cannot stand alone: it depends on the main clause.', example: ['When the rain stopped, [the children ran outside].'] }),
      ]),
      L(4, 'Joining words', 'I can join two ideas with the right conjunction.', [
        S('s4-conj', 'Choose the joining word', 'conj', 'I can choose the conjunction that makes sense.',
          'Two short sentences want to hold hands. The joining word you choose changes the meaning.',
          { why: 'And adds. But shows a surprise or a contrast. So shows a result. Because gives a reason. Read both halves, decide how they are linked, then choose.', example: ['I was tired, so I went to bed.', 'I was tired, but I kept reading.'] }),
        S('s4-combine', 'Make one sentence', 'combine', 'I can combine two short sentences into one.',
          'Quill\'s story is full of short, choppy sentences. Time to combine them.',
          { why: 'When two sentences describe the same thing, you can often fold one into the other: "The kite was red. It flew high." becomes "The red kite flew high."', example: ['The kite was red. The kite flew high. → The red kite flew high.'] }),
      ]),
      L(5, 'Punctuation', 'I can punctuate a sentence correctly.', [
        S('s5-caps', 'Capital letters', 'caps', 'I can put capital letters where they belong.',
          'The capital letters have all fallen off this page. Quill needs help putting them back.',
          { why: 'A capital letter starts every sentence. Names of people, places, days, months and festivals get one too — and so does "I".', example: ['last monday priya and i… → Last Monday Priya and I…'] }),
        S('s5-end', 'How it ends', 'endMark', 'I can choose a full stop, question mark or exclamation mark.',
          'Every sentence needs a full stop at the end — unless it is asking, or exclaiming.',
          { why: 'A statement ends with a full stop. A question ends with a question mark. A strong feeling or a "What a…!" ends with an exclamation mark.', example: ['Where is my hat?', 'What a huge wave that was!'] }),
        S('s5-comma', 'Commas', 'commas', 'I can put commas where they are needed.',
          'Commas are tiny pauses that stop words bumping into each other.',
          { why: 'Commas separate items in a list (eggs, milk and bread), follow an opening phrase (After lunch, we…), and mark who you are talking to (Mira, come here).', example: ['After lunch, we bought eggs, milk and bread.'] }),
        S('s5-order', 'Build the sentence', 'order', 'I can put words in order to make a sentence.',
          'The words of a sentence have been tipped out of the box. Put them back in order.',
          { why: 'English usually goes: who, does what, to what, then where or when. Start with the capital letter and end with the full stop.', example: ['dog / the / barked → The dog barked.'] }),
      ]),
      L(6, 'Sentence combining', 'I can combine sentences in more than one way.'),
      L(7, 'Varied openings', 'I can start sentences in different ways on purpose.'),
      L(8, 'Parallelism', 'I can keep a list or a pair in the same shape.'),
      L(9, 'Periodic and loose sentences', 'I can hold the main idea back for effect.'),
      L(10, 'Sentences on demand', 'I can write simple, compound, complex and compound-complex sentences.'),
    ] },
  { id: 'reading', n: 3, title: 'Reading', sub: 'the classics', icon: 'book', colour: '#047857', opens: { band: 1 },
    levels: [
      L(1, 'Fables', 'I can say what happened in a fable and what it teaches.', [], { band: 1 }),
      L(2, 'Fairy tales', 'I can follow a fairy tale and explain why a character acts.', [], { band: 1 }),
      L(3, 'Children\'s classics', 'I can read a chapter of a children\'s classic in the original.', [], { band: 2 }),
      L(4, 'Poems', 'I can read a poem aloud and say what it pictures.', [], { band: 1 }),
      L(5, 'Short stories', 'I can read a short story and explain its turning point.', [], { band: 2 }),
      L(6, 'Novels in extracts', 'I can read an extract and infer what a character feels.', [], { band: 3 }),
      L(7, 'Drama', 'I can read a scene and say what each speaker wants.', [], { band: 3 }),
      L(8, 'Whole novels', 'I can read a whole novel, chapter by chapter.'),
      L(9, 'Essays', 'I can follow an essay\'s argument.', [], { band: 3 }),
      L(10, 'Close reading', 'I can read a poem closely and defend what I find.'),
    ] },
  { id: 'writing', n: 4, title: 'Writing', sub: 'copywork to composition', icon: 'pen', colour: '#7C3AED', opens: { after: ['sentence', 1] },
    levels: [
      L(1, 'Copywork', 'I can copy a line from a great writer exactly.', [
        S('wr1-copy', 'Copy it exactly', 'copy', 'I can copy a line from a classic exactly, with every capital and comma.',
          'Long ago, children learned to write by copying great sentences — and noticed how they were built.',
          { why: 'Copying slowly trains your eye: you notice where the commas fall, which words are capitalised, how a long sentence holds together. Every mistake is a thing you have just learned to see.', example: ['Copy one line. Then check: spelling, capitals, punctuation.'] }),
      ]),
      L(2, 'Dictation', 'I can write down a sentence I hear.', [
        S('wr2-dict', 'Write what you hear', 'dictation', 'I can write down a sentence from a classic as I hear it.',
          'Quill reads a sentence from a book in the Library, slowly. Can you catch every word — and every comma?',
          { why: 'Dictation joins your ears to your hand. Listen to the whole sentence first. Then write it a few words at a time. A pause in the voice is often a comma; the voice dropping at the end is a full stop; rising is a question.', example: ['Listen once all the way through.', 'Write, then listen again to check.'] }),
      ]),
      L(3, 'Sentence imitation', 'I can write my own sentence in a writer’s shape.', [
        S('wr3-imitate', 'In the same shape', 'imitate', 'I can write my own sentence in the shape of a great one.',
          'Writers learn from writers. Quill has found a beautiful sentence — now borrow its shape, and fill it with your own words.',
          { why: 'Every sentence has a shape: it might start with “When…”, or list three things, or compare one thing to another. Keep the shape, change everything else. The app checks the shape — what you say is yours.', example: ['Model: When the rain stopped, the children ran outside.', 'Mine: When the bell rang, my little brother cheered.'] }),
      ]),
      L(4, 'The paragraph', 'I can write a paragraph with a topic sentence.', [
        S('wr4-para', 'One good paragraph', 'desk', 'I can write a paragraph: a topic sentence, three details and a closing sentence.',
          'A paragraph is a little house for one idea. The topic sentence is the front door.',
          { why: 'Start with a topic sentence that says what the paragraph is about. Add three sentences that each give a detail or an example. Finish with a sentence that closes the door.', example: ['Topic: My grandmother’s kitchen is the busiest room in our house.', 'Then three details, then a closing sentence.'] },
          { desk: { prompts: ['The best place in my home', 'A food I could eat every day', 'Why I like rainy days (or why I don’t)', 'An animal I would like to be for a day', 'The most useful thing in my school bag'],
            parts: [['Topic sentence', 'What is the paragraph about?'], ['Three details', 'Three sentences, each with one detail or example.'], ['Closing sentence', 'Close the door: sum up, or say how you feel.']],
            check: ['My first sentence says what the paragraph is about', 'Every other sentence is about the same idea', 'My last sentence closes the paragraph', 'Each sentence starts with a capital and ends with a full stop'], min: 4 } }),
      ]),
      L(5, 'Retelling', 'I can retell a story in my own words.', [
        S('wr5-retell', 'Tell it back', 'desk', 'I can retell a story I heard, in my own words, in order.',
          'You have heard a story in the Library. Now it is your turn to tell it — in your own words.',
          { why: 'A good retelling keeps the order: the beginning (who, where), the middle (what went wrong), the end (how it was solved). Use your own words — do not copy the book. Short is fine; clear is the point.', example: ['Beginning: who and where.', 'Middle: the problem.', 'End: how it turned out.'] },
          { desk: { story: true, parts: [['Beginning', 'Who is in the story, and where are they?'], ['Middle', 'What goes wrong, or what happens?'], ['End', 'How does it turn out?']],
            check: ['I kept the events in order', 'I used my own words, not the book’s', 'I named the main character', 'My ending says how it turned out'], min: 5 } }),
      ]),
      L(6, 'Description', 'I can describe a place so a reader sees it.', [
        S('wr6-describe', 'Paint it in words', 'desk', 'I can describe a picture so a reader can see it, using my senses.',
          'Look at the painting. Someone who cannot see it is waiting for you to tell them what is there.',
          { why: 'Describe from big to small: first the whole place, then the things in it, then one tiny detail. Use more than your eyes: what would you hear, smell, feel? Choose exact words — not “nice” but “golden”, not “big” but “towering”.', example: ['Big: the whole scene.', 'Small: one detail no one else would notice.', 'Senses: sound, smell, touch.'] },
          { desk: { picture: true, parts: [['The whole scene', 'What is the place? What is the light like?'], ['Things in it', 'What do you see, from near to far?'], ['The senses', 'What would you hear, smell or feel there?']],
            check: ['I described the whole scene first', 'I used at least two senses besides sight', 'I chose at least three exact describing words', 'I included one small detail'], min: 5 } }),
      ]),
      L(7, 'Persuasion', 'I can write to change someone’s mind.', [
        S('wr7-persuade', 'Change my mind', 'desk', 'I can write to persuade: an opinion, three reasons, and a call to act.',
          'Quill wants a longer story time every evening. The grown-ups are not sure. Can words change their minds?',
          { why: 'Say clearly what you think. Give three reasons, each with an example. Answer the other side fairly (“Some people say… but…”). End by asking your reader to do something.', example: ['Opinion → three reasons → the other side → what to do.'] },
          { desk: { prompts: ['Our school should have a reading hour every week', 'Every child should learn to swim', 'Homework should be banned on Fridays', 'Our town needs more trees', 'Families should eat one meal together every day'],
            parts: [['My opinion', 'What do you think? Say it in one sentence.'], ['Three reasons', 'Each reason, with an example.'], ['The other side', '“Some people say… but…”'], ['What to do', 'Ask your reader to do something.']],
            check: ['My opinion is clear in the first sentence', 'I gave three reasons', 'I answered the other side fairly', 'I ended by asking the reader to act'], min: 6 } }),
      ]),
      L(8, 'The letter', 'I can write a clear letter.', [
        S('wr8-letter', 'Dear…', 'desk', 'I can write a letter with a greeting, a clear reason for writing, and a sign-off.',
          'Letters have crossed oceans and changed minds. Quill has a sheet of paper and an envelope.',
          { why: 'A letter has a greeting (Dear…), a first line that says why you are writing, a middle with the details, and a sign-off (With love, / Yours sincerely,). Write to a real person, or a character from a story.', example: ['Dear Mowgli,', 'I am writing because…', 'Yours sincerely,'] },
          { desk: { prompts: ['To a character from a story you heard: ask them a question', 'To your grandparent: tell them about your week', 'To your headteacher: suggest one change', 'To a friend far away: describe your town', 'To your future self, ten years from now'],
            parts: [['Greeting', 'Dear …,'], ['Why I am writing', 'One or two sentences.'], ['The details', 'What you want to tell or ask.'], ['Sign-off', 'With love, / Yours sincerely, and your first name.']],
            check: ['I started with a greeting', 'My first sentence says why I am writing', 'I wrote to one person the whole way through', 'I ended with a sign-off'], min: 4 } }),
      ]),
      L(9, 'The essay', 'I can write an essay with a deliberate structure.', [
        S('wr9-essay', 'A short essay', 'desk', 'I can write a short essay: an introduction, three paragraphs, and a conclusion.',
          'An essay is an attempt — the word means “a try”. Francis Bacon wrote short ones four hundred years ago.',
          { why: 'The introduction says what the essay will argue or explore. Each middle paragraph takes one point, with evidence. The conclusion draws the points together — it does not just repeat them.', example: ['Introduction → point, point, point → conclusion.'] },
          { desk: { prompts: ['Is it better to read the book or watch the film?', 'What makes a good friend?', 'Should children have a say in family decisions?', 'Why do old stories still matter?', 'Is it ever right to break a rule?'],
            parts: [['Introduction', 'What will this essay explore?'], ['First point', 'One point, with an example.'], ['Second point', 'One point, with an example.'], ['Third point', 'One point, with an example.'], ['Conclusion', 'Draw it together — what do you conclude?']],
            check: ['My introduction says what the essay is about', 'Each middle paragraph has one point and an example', 'My conclusion does more than repeat', 'I used paragraphs'], min: 10 } }),
      ]),
      L(10, 'After a model', 'I can write a creative piece after a great model.', [
        S('wr10-model', 'In the manner of…', 'desk', 'I can write a short piece in the manner of a classic I have read.',
          'Kipling wrote “How the Elephant got its Trunk”. What other “How the … got its …” stories are waiting to be written?',
          { why: 'Read a model, notice what makes it special — its opening, its voice, its repeated phrases — then write your own piece that borrows those things. This is how writers have always learned.', example: ['A “Just So” story: How the Zebra got its Stripes.', 'A fable with a one-line moral.'] },
          { desk: { prompts: ['A “Just So” story: How the … got its …', 'A fable: two animals, one mistake, and a one-line moral', 'A poem in the shape of “My Shadow”: something that follows you', 'A letter from Alice to her sister, from Wonderland', 'A new scene for the Wind in the Willows'],
            parts: [['The model', 'Which classic are you writing after, and what will you borrow from it?'], ['Your piece', 'Write it.']],
            check: ['I borrowed something special from the model', 'My piece has a beginning, a middle and an end', 'I chose my words with care', 'I read it aloud once and fixed what sounded wrong'], min: 6 } }),
      ]),
    ] },
  { id: 'speaking', n: 5, title: 'Speaking', sub: 'recitation, then oratory', icon: 'mic', colour: '#B91C1C', opens: { after: ['reading', 1] },
    levels: [
      L(1, 'Read aloud', 'I can read a passage aloud at a steady pace.', [
        S('sp1-aloud', 'Read it aloud', 'readAloud', 'I can read a passage aloud at a steady pace, with pauses at the full stops.',
          'Quill clears its throat. A story read aloud is a story twice told.',
          { why: 'Good reading aloud has a steady pace — about 100 to 150 words a minute — and a small pause at every full stop. The app can measure your time, pace and pauses on this device. It cannot hear expression — you and your grown-up judge that.', example: ['Breathe at the full stops.', 'Look up at the end of a sentence.'] }),
      ]),
      L(2, 'Recite a short poem', 'I can recite a short poem from memory.', [
        S('sp2-recite', 'Learn it by heart', 'speak', 'I can recite a short poem from memory.',
          'A poem you know by heart is yours for ever. Quill will help you learn one, a little at a time.',
          { why: 'Hear the poem. Say it with the words in front of you. Then some words fade away — and you say them anyway. Then more fade. Soon there is nothing on the screen, and the poem is in you.', example: ['Hear it → say it → the words fade → say it from memory.'] },
          { speak: { mode: 'recite', fade: true, target: [10, 180] } }),
      ]),
      L(3, 'Recite with expression', 'I can recite with expression.', [
        S('sp3-express', 'Say it like you mean it', 'speak', 'I can recite a poem with expression: pauses, stress and changes of volume.',
          'The same words can sound sleepy or thrilling. Expression is what you add.',
          { why: 'Mark the poem: a pause at every comma and full stop, a longer pause at the end of each verse, and one word in each line to lean on. Speak some lines softer and some louder. The app measures your pauses and how far your volume moves — the feeling itself is for you and your grown-up to judge.', example: ['/ = pause    // = long pause', 'Lean on one word in each line.'] },
          { speak: { mode: 'recite', marks: true, target: [10, 180] } }),
      ]),
      L(4, 'Tell a story', 'I can tell a story aloud.', [
        S('sp4-story', 'Tell it aloud', 'speak', 'I can tell a story I heard, aloud, in my own words, in order.',
          'Storytellers told stories long before books. Now you are the storyteller.',
          { why: 'Look at the pictures to remember what happened. Begin with who and where. Tell what went wrong. Finish with how it turned out. Speak to someone — a grown-up, a toy, a mirror.', example: ['Once… then one day… so… in the end…'] },
          { speak: { mode: 'story', target: [45, 180] } }),
      ]),
      L(5, 'Show and tell', 'I can talk about something I chose.', [
        S('sp5-show', 'Show and tell', 'speak', 'I can talk for a minute about something I chose, so others want to see it.',
          'Everyone has a treasure: a shell, a medal, a book with a torn cover. Tell the room about yours.',
          { why: 'Hold it up. Say what it is. Tell where it came from, or a story about it. Say why it matters to you. Ask the room one question at the end.', example: ['What it is → where it came from → why it matters → a question.'] },
          { speak: { mode: 'talk', target: [30, 120], prompts: ['Something I would save from a fire', 'My favourite book, and why', 'A gift I will always keep', 'Something I made', 'A photo that makes me smile (describe it)', 'The best thing in my bedroom'] } }),
      ]),
      L(6, 'A one-minute speech', 'I can give a one-minute speech: hook, three points, close.', [
        S('sp6-minute', 'One minute', 'speak', 'I can give a one-minute speech with a hook, three points and a close.',
          'Sixty seconds is longer than it sounds. With a plan, it is plenty.',
          { why: 'A hook makes them listen (a question, a surprising fact, a tiny story). Three points, one sentence or two each. A close that brings it home. Plan on paper first — then speak, looking up.', example: ['Hook → one → two → three → close.'] },
          { speak: { mode: 'speech', plan: true, target: [45, 80], prompts: ['Why everyone should keep a pet', 'The best season of the year', 'A hero from a book', 'Why we should read every day', 'If I could change one thing about school', 'The most important invention'] } }),
      ]),
      L(7, 'A three-minute speech', 'I can give a three-minute speech.', [
        S('sp7-three', 'Three minutes', 'speak', 'I can give a three-minute speech with a clear structure and examples.',
          'Three minutes: enough for a story, an argument, and an ending people remember.',
          { why: 'The same skeleton — hook, three points, close — but each point now has an example or a story. Signpost as you go (“My second reason is…”). Slow down: pauses are not empty, they let the room think.', example: ['Signposts: First… My second point… Finally…'] },
          { speak: { mode: 'speech', plan: true, target: [150, 210], prompts: ['The book everyone should read', 'What I would do if I ran my town for a day', 'Why stories matter', 'The power of kindness', 'A journey I will never forget', 'Should children vote?'] } }),
      ]),
      L(8, 'Declamation', 'I can deliver a famous speech.', [
        S('sp8-declaim', 'A famous speech', 'speak', 'I can deliver a famous speech, at a speaker’s pace, with its pauses.',
          'In 1863, at Gettysburg, Abraham Lincoln spoke for about two minutes. People still learn his words.',
          { why: 'Hear the speech read well. Notice where the voice slows, where it pauses, which words it leans on. Then deliver it yourself, standing up. The app compares your time with the narrator’s — you judge the rest.', example: ['Hear it → mark the pauses → stand → deliver.'] },
          { speak: { mode: 'declaim', passage: 'gettysburg-address', target: [60, 240] } }),
      ]),
      L(9, 'Impromptu', 'I can speak well from a prompt.', [
        S('sp9-impromptu', 'On the spot', 'speak', 'I can speak for a minute on a topic I have only just been given.',
          'No time to write a speech? Thirty seconds to think, and then — speak.',
          { why: 'Use a ready-made shape: say your answer, give two reasons, finish by saying your answer again. It is fine to pause and think — a pause sounds thoughtful, not lost.', example: ['Answer → reason → reason → answer again.'] },
          { speak: { mode: 'impromptu', think: 30, target: [40, 90], prompts: ['Would you rather fly or be invisible?', 'What is the best animal, and why?', 'Is it better to be early or late?', 'What should every child learn to cook?', 'Mountains or the sea?', 'What makes a good teacher?', 'Should zoos exist?', 'What would you take to a desert island?'] } }),
      ]),
      L(10, 'Debate', 'I can argue one side of a motion, then the other.', [
        S('sp10-debate', 'Both sides', 'speak', 'I can argue for a motion, then against it, fairly and clearly.',
          'A debate has two sides. A great speaker can argue either — and understand both.',
          { why: 'First argue FOR the motion: your three best reasons. Then argue AGAINST it, just as fairly. Arguing the side you disagree with is how you learn to understand people who disagree with you.', example: ['For: three reasons.', 'Against: three reasons.'] },
          { speak: { mode: 'debate', plan: true, target: [45, 120], prompts: ['This house believes homework should be optional', 'This house believes every school should have a garden', 'This house believes books are better than films', 'This house believes children should have a phone by age ten', 'This house believes school uniforms should be scrapped'] } }),
      ]),
    ] },
  { id: 'literature', n: 6, title: 'Literature', sub: 'knowing the great works', icon: 'lamp', colour: '#A16207', opens: { after: ['reading', 2] },
    levels: [
      L(1, 'Story elements', 'I can name a story\'s character, setting and problem.'),
      L(2, 'Character', 'I can say what a character wants.'),
      L(3, 'Setting and mood', 'I can say how a setting makes me feel.'),
      L(4, 'Theme', 'I can say what a story is really about.'),
      L(5, 'Figurative language', 'I can find a simile and a metaphor.'),
      L(6, 'Poetic form', 'I can name a sonnet, a ballad and free verse.'),
      L(7, 'Genre', 'I can tell an adventure from a mystery.'),
      L(8, 'Literary periods', 'I can place a work in its age.'),
      L(9, 'Comparing works', 'I can compare two works.'),
      L(10, 'My case for this book', 'I can defend a favourite book.'),
    ] },
  { id: 'language', n: 7, title: 'Language', sub: 'English itself', icon: 'scroll', colour: '#0F766E', opens: { after: ['word', 3] },
    levels: [
      L(1, 'Word origins', 'I can say which language an English word came from.', [
        S('la1-origin', 'Where words come from', 'origin', 'I can say which language a borrowed English word came from.',
          'English is a magpie: it has borrowed words from almost every language it met. Bungalow, shampoo and jungle came from India.',
          { why: 'Many English words were borrowed. Their origin often shows in their shape: "-ology" words are Greek, words with "ph" for f are often Greek, and bungalow, shampoo and pyjamas came from Indian languages.', example: ['bungalow ← Hindi/Gujarati bangla', 'ballet ← French'] }),
      ]),
      L(2, 'Borrowed words', 'I can spot borrowed words in English.'),
      L(3, 'The story of English', 'I can tell the story of English from Old English to today.'),
      L(4, 'Shakespeare\'s words', 'I can name words that first appear in Shakespeare.'),
      L(5, 'Idioms', 'I can explain where an idiom comes from.'),
      L(6, 'Register and dialect', 'I can tell a dialect from a mistake.'),
      L(7, 'Rhetoric\'s devices', 'I can name anaphora, tricolon and antithesis.'),
      L(8, 'Style and editing', 'I can edit a paragraph for style.'),
      L(9, 'The great cadences', 'I can hear the rhythm of the King James Bible and Shakespeare.'),
      L(10, 'World Englishes', 'I can describe Indian English and other Englishes.'),
    ] },
];

/* Word levels 6–10: written stops (data/word-stops.js; level 7, the words from the myths, in data/myth-words.js) */
const wordLevels = STRANDS.find((x) => x.id === 'word').levels;
for (const x of WORD_STOPS) wordLevels.find((l) => l.n === x.level).stops.push({ ...x, kind: 'authored' });

/* Sentence levels 6–10: written stops (data/sentence-stops.js) */
const sentenceLevels = STRANDS.find((x) => x.id === 'sentence').levels;
for (const x of SENTENCE_STOPS) sentenceLevels.find((l) => l.n === x.level).stops.push({ ...x, kind: 'authored' });

/* Literature levels 1–9: written stops (data/literature.js); level 10 is a writing desk — the child's case for a book */
for (const l of STRANDS.find((x) => x.id === 'literature').levels) {
  if (l.n <= 9) l.stops.push(...LIT_STOPS.filter((x) => x.level === l.n).map((x) => ({ ...x, kind: 'authored' })));
  else l.stops.push(S('li10-case', 'My case for this book', 'desk', 'I can make the case for a book I love, with reasons and lines from it.',
    'Quill has a favourite book and a friend who will not read it. "It is old," says the friend. Quill smiles: "Then let me make my case."',
    { why: 'A case has a claim, reasons, evidence from the book itself — a line, a moment — an answer to the other side, and a close. You are not marked on which book you choose, only on how well you argue for it.', example: ['Claim: Treasure Island is the best adventure ever written.', "Evidence: “Fifteen men on the dead man's chest” — you hear the danger in one line."] }, { desk: CASE_DESK }));
}
/* Language levels 2–10: written stops (data/language.js), run as kind `authored` */
for (const l of STRANDS.find((x) => x.id === 'language').levels) if (l.n >= 2) l.stops.push(...LANG_STOPS.filter((x) => x.level === l.n).map((x) => ({ ...x, kind: 'authored' })));

/* Reading levels carry no authored stops: their stops are made from the passages (reading.js). */
export const strand = (id) => STRANDS.find((s) => s.id === id);
export const level = (sid, n) => strand(sid)?.levels.find((l) => l.n === n);
export const allStops = () => STRANDS.flatMap((s) => s.levels.flatMap((l) => l.stops.map((st) => ({ ...st, strand: s.id, level: l.n }))));
export const stopById = (id) => allStops().find((s) => s.id === id);
/* The free plan: Word and Sentence, worlds 1–2 (owner's default, SPEC §16.3). */
export const isFree = (sid) => !!strand(sid)?.free;
