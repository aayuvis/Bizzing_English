/* sentence-stops.js — the Sentence strand, levels 6–10 (spec §2 strand 2: combining, openings,
   parallelism, periodic and loose sentences, sentences on demand).

   Written stops in the LANG_STOPS shape (data/language.js), run through the item engine as kind
   `authored`. Everything is our own wording, British spelling, except the quotations: every `quote` is
   an exact substring of a held text whose work is cleared in all three markets (test/sentence-stops.mjs
   checks each one, whitespace collapsed). The faulty sentences offered as wrong answers are our own and
   are never attributed to an author.

   Rules this file keeps (CLAUDE.md rule 6): one right answer, three distinct wrong ones, the answer not
   in the question (unless every option is in the line, a which-word item), the right answer never the
   longest by more than 40%. On level 10 exactly one option meets every rule of the brief, and every
   wrong option breaks at least one, named in a comment beside it. The engine compares options with their punctuation stripped, so no two
   options may differ by punctuation alone: a comma splice and a run-on of the same words count as one.

   Bands: 2 = ages 8–10, 3 = ages 11–14. */

const mc = (q, right, wrong, extra = {}) => ({ q, right, wrong, ...extra });
const BEST = (a) => `Which is the best single sentence made from these? “${a}”`;

// Level 7: how a sentence opens. The same four options on every item; the item's id permutes them.
const OPEN = { adv: 'with an adverb', prep: 'with a prepositional phrase', ing: 'with an -ing phrase', sub: 'with a subordinate clause' };
const opener = (kind, quote, work) => mc('How does this sentence begin?', OPEN[kind], Object.keys(OPEN).filter((k) => k !== kind).map((k) => OPEN[k]), { quote, work });

// Level 9: periodic or loose.
const KIND = {
  periodic: 'periodic: the main point waits until the end',
  loose: 'loose: the main point comes first, details follow',
  fragment: 'a fragment: it has no main clause',
  question: 'a question: it asks rather than tells',
};
const kindOf = (kind, quote, work) => mc('What kind of sentence is this?', KIND[kind], Object.keys(KIND).filter((k) => k !== kind).map((k) => KIND[k]), { quote, work });

// Level 10: the brief. Every option of a check item is a phrase of the brief itself (a which-part item).
const BRIEF = 'The brief: it is one sentence, begins with a subordinate clause, contains a list of three, and uses a semicolon correctly.';
const RULE = { one: 'is one sentence', sub: 'begins with a subordinate clause', list: 'contains a list of three', semi: 'uses a semicolon correctly' };
const misses = (rule, sentence) => mc(`${BRIEF} Which part of the brief does this sentence miss? “${sentence}”`, RULE[rule], Object.keys(RULE).filter((k) => k !== rule).map((k) => RULE[k]));
const MEET = (...rules) => `Which sentence meets ALL of these rules: ${rules.join('; ')}?`;

export const SENTENCE_STOPS = [
  // ── Level 6 · Sentence combining ──
  {
    id: 's6-join', level: 6, band: 2, needsReview: false,
    title: 'Two into one', iCan: 'I can join two sentences into one without changing what they mean.',
    story: 'Quill has two short sentences that belong together, like two halves of a biscuit. "Joined well, they make one good sentence," says Quill. "Joined badly, they make a mess — or say something new."',
    learn: {
      why: 'To join two sentences, choose a joining word that shows how the ideas link: and, but, so, because, when, while, although. A comma alone cannot hold two sentences together — that is a comma splice. Read your joined sentence back: does it still say what the two said?',
      example: ['The rain stopped. We went outside. → When the rain stopped, we went outside.', 'Not: The rain stopped, we went outside. (a comma splice)'],
    },
    sources: [],
    items: [
      mc(BEST('The rain stopped. We went outside.'), 'When the rain stopped, we went outside.',
        ['The rain stopped, we went outside.', 'The rain stopped because we went outside.', 'Although the rain stopped, we went outside.']),
      mc(BEST('Mole was tired. He kept on sweeping.'), 'Mole was tired, but he kept on sweeping.',
        ['Mole was tired, so he kept on sweeping.', 'Mole was tired, he kept on sweeping.', 'Mole was tired and he stopped sweeping.']),
      mc(BEST('The kettle boiled. Quill made the tea.'), 'As soon as the kettle boiled, Quill made the tea.',
        ['The kettle boiled, Quill made the tea.', 'Although the kettle boiled, Quill made the tea.', 'As soon as Quill made the tea, the kettle boiled.']),
      mc(BEST('Priya missed the bus. She was late for school.'), 'Priya missed the bus, so she was late for school.',
        ['Priya missed the bus, but she was late for school.', 'Priya missed the bus because she was late for school.', 'Priya missed the bus she was late for school.']),
      mc(BEST('The road was icy. The driver went slowly.'), 'Because the road was icy, the driver went slowly.',
        ['Because the driver went slowly, the road was icy.', 'The road was icy, the driver went slowly.', 'Unless the road was icy, the driver went slowly.']),
      mc(BEST('The sun set. The stars came out.'), 'Once the sun had set, the stars came out.',
        ['The sun set, the stars came out.', 'Before the sun set, the stars came out.', 'The sun set because the stars came out.']),
      mc(BEST('Heidi climbed the mountain. She reached the hut by noon.'), 'Heidi climbed the mountain and reached the hut by noon.',
        ['Heidi reached the hut by noon and climbed the mountain.', 'Heidi climbed the mountain, she reached the hut by noon.', 'Heidi climbed the mountain because she reached the hut by noon.']),
      mc(BEST('The old dog was slow. He never missed his dinner.'), 'Although the old dog was slow, he never missed his dinner.',
        ['Although the old dog was slow, so he never missed his dinner.', 'Because the old dog was slow, he never missed his dinner.', 'The old dog was slow, he never missed his dinner.']),
      mc(BEST('Tom whitewashed the fence. His friends watched.'), 'Tom whitewashed the fence while his friends watched.',
        ['Tom whitewashed the fence, his friends watched.', 'His friends whitewashed the fence while Tom watched.', 'Tom whitewashed the fence unless his friends watched.']),
      mc(BEST('The bell rang. The children ran outside.'), 'After the bell rang, the children ran outside.',
        ['After the children ran outside, the bell rang.', 'The bell rang, the children ran outside.', 'Until the bell rang, the children ran outside.']),
      mc(BEST('The fox was hungry. The fox was clever.'), 'The fox was hungry and clever.',
        ['The fox was hungry, the fox was clever.', 'The fox was hungry and was the fox clever.', 'The fox, hungry, and clever.']),
      mc(BEST('The Rat rowed the boat. The Mole sat in the stern.'), 'The Rat rowed the boat while the Mole sat in the stern.',
        ['The Rat rowed the boat, the Mole sat in the stern.', 'The Rat rowed the boat because the Mole sat in the stern.', 'While the Rat rowed the boat. The Mole sat in the stern.']),
      mc('Which of these joined sentences is a comma splice?', 'The door creaked, a cold wind blew in.',
        ['The door creaked, and a cold wind blew in.', 'The door creaked open and a cold wind blew in.', 'As the door creaked, a cold wind blew in.']),
    ],
  },
  {
    id: 's6-fold', level: 6, band: 2, needsReview: false,
    title: 'Fold it in', iCan: 'I can fold one sentence into another with a describing phrase or a who or which clause.',
    story: 'Quill folds a letter so that one part tucks neatly inside the other. "Sentences fold too," says Quill: "the small one tucks inside the big one — as long as it sits next to the word it describes."',
    learn: {
      why: 'When a second sentence only tells you more about something in the first, fold it in: as an adjective (the red kite), a phrase (a fox with a quill), or a who or which clause between commas. A describing phrase must sit next to the noun it describes — or it describes the wrong thing.',
      example: ['Mr Toad lived at Toad Hall. He loved motor-cars. → Mr Toad, who lived at Toad Hall, loved motor-cars.', 'Not: Running for the bus, my bag fell open. (the bag was not running)'],
    },
    sources: [],
    items: [
      mc(BEST('Mr Toad lived at Toad Hall. Mr Toad loved motor-cars.'), 'Mr Toad, who lived at Toad Hall, loved motor-cars.',
        ['Mr Toad, which lived at Toad Hall, loved motor-cars.', 'Mr Toad lived at Toad Hall, loved motor-cars.', 'Mr Toad, whom lived at Toad Hall, loved motor-cars.']),
      mc(BEST('The kite was red. The kite flew over the hill.'), 'The red kite flew over the hill.',
        ['The kite flew over the red hill.', 'The kite was red, flew over the hill.', 'The kite was red, it flew over the hill.']),
      mc(BEST('Alice found a bottle. The bottle was labelled DRINK ME.'), 'Alice found a bottle that was labelled DRINK ME.',
        ['Alice, labelled DRINK ME, found a bottle.', 'Alice found a bottle, it was labelled DRINK ME.', 'Alice found a bottle who was labelled DRINK ME.']),
      mc(BEST('Quill is a fox. Quill loves books.'), 'Quill, a fox, loves books.',
        ['Quill, a fox, love books.', 'Quill loves a fox and books.', 'Quill is a fox, loves books.']),
      mc(BEST('The Mole threw down his brush. He ran out into the sunshine.'), 'Throwing down his brush, the Mole ran out into the sunshine.',
        ['Throwing down his brush, the sunshine called the Mole outside.', 'The Mole threw down his brush, he ran out into the sunshine.', 'Thrown down his brush, the Mole ran out into the sunshine.']),
      mc('Which sentence has a describing phrase attached to the wrong noun?', 'Running for the bus, my bag fell open.',
        ['Running for the bus, I dropped my bag.', 'My bag fell open as I ran for the bus.', 'While I was running for the bus, my bag fell open.']),
      mc(BEST('The castle stood on a hill. The castle was very old.'), 'The very old castle stood on a hill.',
        ['The castle stood on a very old hill.', 'The castle stood on a hill, it was very old.', 'Very old, the hill had a castle on it.']),
      mc(BEST('The river ran past the mill. The river was full of fish.'), 'The river, which was full of fish, ran past the mill.',
        ['The river, who was full of fish, ran past the mill.', 'The mill, which was full of fish, ran past the river.', 'The river ran past the mill, it was full of fish.']),
      mc(BEST('The cat slept. It slept on the warm windowsill.'), 'The cat slept on the warm windowsill.',
        ['The cat slept, it slept on the warm windowsill.', 'On the cat slept the warm windowsill.', 'The warm windowsill slept on the cat.']),
      mc(BEST('Jo wrote a play. The play was funny. Her sisters acted in it.'), 'Jo wrote a funny play, and her sisters acted in it.',
        ['Jo wrote a funny play, her sisters acted in it.', 'Jo’s sisters wrote a funny play, and she acted in it.', 'Jo wrote a play, it was funny, her sisters acted in it.']),
      mc('Which sentence puts its describing phrase next to the right noun?', 'Covered in mud, the dog ran into the kitchen.',
        ['Covered in mud, the kitchen was where the dog ran.', 'Covered in mud, Mother saw the dog run inside.', 'Covered in mud, the kitchen floor was where he stood.']),
      mc(BEST('The ship sailed at dawn. It carried a hundred sailors.'), 'The ship, carrying a hundred sailors, sailed at dawn.',
        ['Carrying a hundred sailors, the dawn saw the ship sail.', 'The ship sailed at dawn, it carried a hundred sailors.', 'The ship sailed at dawn carrying, a hundred sailors.']),
      mc(BEST('The puppy was small. It was brown. It chased its tail.'), 'The small brown puppy chased its tail.',
        ['The small puppy chased its brown tail.', 'The puppy was small, brown, chased its tail.', 'The small brown puppy, it chased its tail.']),
    ],
  },

  // ── Level 7 · Varied openings ──
  {
    id: 's7-name', level: 7, band: 2, needsReview: false,
    title: 'How does it begin?', iCan: 'I can name the way a writer opens a sentence.',
    story: 'Quill is reading the first words of sentences in the Library — just the first few. "Suddenly… Behind the hut… Seeing who it was… When Mary Lennox… Every writer has more than one way in."',
    learn: {
      why: 'Most sentences start with the subject. Good writers also open with an adverb (Suddenly, Slowly), a prepositional phrase (Behind the hut, At the end of the day), an -ing phrase (Seeing who it was) or a subordinate clause (When…, If…, As soon as…). A clause has its own subject and verb; a phrase does not.',
      example: ['Slowly, the door opened. → adverb', 'Under the bridge, a toad waited. → prepositional phrase', 'When the bell rang, we ran. → subordinate clause'],
    },
    sources: [],
    items: [
      opener('adv', 'Suddenly a clear rippling little sound broke out near her and she turned round.', 'secretgarden'),
      opener('adv', 'Gradually the balloon swelled out and rose into the air, until finally the basket just touched the ground.', 'oz'),
      opener('adv', 'Presently they all sat down to luncheon together.', 'wind'),
      opener('prep', 'Behind the hut stood three old fir trees, with long, thick, unlopped branches.', 'heidi'),
      opener('prep', 'Over the whiteness and silence brooded a ghostly calm.', 'call-wild'),
      opener('prep', 'At the end of half an hour they were wading through the tall grass of the graveyard.', 'tomsawyer'),
      opener('ing', 'Seeing who it was, we stood still under our lime-tree, and let them come up to us.', 'blackbeauty'),
      opener('ing', 'Taking a big golden key from a peg on the wall, he opened another gate', 'oz'),
      opener('ing', 'Leaving the others to console Beth, she departed to the kitchen, which was in a most discouraging state of confusion.', 'littlewomen'),
      opener('ing', 'Looking out between the trees, we could see a great side of mountain, running down exceeding steep into the waters of the loch.', 'kidnapped'),
      opener('sub', 'When Mary Lennox was sent to Misselthwaite Manor to live with her uncle everybody said she was the most disagreeable-looking child ever seen.', 'secretgarden'),
      opener('sub', 'As soon as she was small enough to get through the door, she ran out of the house, and found quite a crowd of little animals and birds waiting outside.', 'alice'),
      opener('sub', 'If he hadn\'t run out of whitewash he would have bankrupted every boy in the village.', 'tomsawyer'),
    ],
  },
  {
    id: 's7-vary', level: 7, band: 2, needsReview: false,
    title: 'Vary the start', iCan: 'I can change how my sentences begin so a paragraph does not plod.',
    story: 'Quill reads a paragraph aloud: "The fox ran. The fox jumped. The fox slept." Quill yawns. "Every sentence starts the same way — let us give them different doors."',
    learn: {
      why: 'When every sentence starts with the subject, a paragraph plods like footsteps. Move a part to the front — a time, a place, a how, a reason — and the rhythm wakes up. Put a comma after a longer opening, before the main clause begins.',
      example: ['The fox slept when the sun went down. → When the sun went down, the fox slept.', 'An old toad sat under the bridge. → Under the bridge sat an old toad.'],
    },
    sources: [],
    items: [
      mc('Every sentence here starts with “The fox”. Which rewrite of the last one varies the opening? “The fox crept to the river. The fox drank deeply. The fox slept under a willow when the sun went down.”',
        'When the sun went down, the fox slept under a willow.',
        ['The fox slept under a willow at sundown.', 'The fox, when the sun went down, slept under a willow.', 'The fox went to sleep under a willow when the sun set.']),
      mc('Rewrite it to begin with an -ing phrase: “Anne ran down the lane and waved to Diana.”', 'Running down the lane, Anne waved to Diana.',
        ['Anne, running down the lane, waved to Diana.', 'Down the lane ran Anne, waving to Diana.', 'As she ran down the lane, Anne waved to Diana.']),
      mc('Rewrite it to begin with a prepositional phrase: “An old toad sat under the bridge.”', 'Under the bridge sat an old toad.',
        ['Sitting under the bridge was an old toad.', 'An old toad sat quietly under the bridge.', 'Quietly, an old toad sat under the bridge.']),
      mc('Rewrite it to begin with an adverb: “The door opened slowly.”', 'Slowly, the door opened.',
        ['The door slowly opened.', 'With a creak, the door opened.', 'As we watched, the door opened.']),
      mc('Rewrite it to begin with a subordinate clause: “We stayed indoors because it was snowing.”', 'Because it was snowing, we stayed indoors.',
        ['We stayed indoors, as it was snowing.', 'Indoors we stayed, because it was snowing.', 'Snowed in, we stayed indoors all day.']),
      mc('Which paragraph has the most varied sentence openings?', 'At dawn the ship sailed. Slowly the coast slipped away. When night fell, the crew sang.',
        ['The ship sailed at dawn. The coast slipped away. The crew sang at night.', 'The ship sailed at dawn. The ship left the coast. The ship’s crew sang at night.', 'Then the ship sailed. Then the coast slipped away. Then the crew sang.']),
      mc('This paragraph already opens with an adverb, then a prepositional phrase. Which next sentence adds a new kind of opening? “Quietly, Mary opened the door. Inside the garden, roses climbed the walls.”',
        'Kneeling by a flower bed, she pulled out the weeds.',
        ['Carefully, she pulled out the weeds by a flower bed.', 'By a flower bed, she pulled out the weeds.', 'Gently, she knelt and pulled out the weeds.']),
      mc('Which sentence begins with a subordinate clause?', 'Although the path was steep, Heidi ran all the way.',
        ['Up the steep path ran Heidi, all the way.', 'Panting hard, Heidi ran up the steep path.', 'Happily, Heidi ran all the way up the path.']),
      mc('Which sentence begins with an -ing phrase?', 'Clutching the map, Jim crept towards the stockade.',
        ['At the stockade, Jim clutched the map.', 'Carefully, Jim crept towards the stockade.', 'When Jim reached the stockade, he clutched the map.']),
      mc('Which sentence begins with a prepositional phrase?', 'Beneath the floorboards, Tom found a rusty key.',
        ['Searching the floor, Tom found a rusty key.', 'Luckily, Tom found a rusty key under the floor.', 'While he searched, Tom found a rusty key.']),
      mc('Which sentence begins with an adverb?', 'Silently, the snow covered the sleeping town.',
        ['Over the sleeping town, the snow fell.', 'Falling all night, the snow covered the town.', 'As the town slept, the snow covered it.']),
      mc('Why do good writers vary the way their sentences begin?', 'to keep the rhythm lively and show how ideas link',
        ['because every sentence must begin differently', 'because starting with the subject is a mistake', 'to make each sentence as long as possible']),
      mc('When a longer opening phrase or clause comes first, what usually follows it?', 'a comma, before the main clause begins',
        ['a full stop, before the main clause begins', 'a semicolon, and then the word “and”', 'a capital letter in the middle']),
    ],
  },

  // ── Level 8 · Parallelism ──
  {
    id: 's8-spot', level: 8, band: 3, needsReview: false,
    title: 'Spot the odd one out', iCan: 'I can spot the part of a sentence that breaks its pattern.',
    story: 'Quill lines up three pebbles — round, round, and a jagged one. "The eye goes straight to the odd one," says Quill. "In a sentence, the ear does the same."',
    learn: {
      why: 'Parts that do the same job in a sentence should have the same shape: reading, writing and swimming — not reading, writing and to swim. Great speeches and books use matching shapes on purpose, so the ideas line up in the listener\'s mind.',
      example: ['Not parallel: She was kind, clever, and had courage.', 'Parallel: She was kind, clever and brave.'],
    },
    sources: [],
    items: [
      mc('Which sentence is NOT parallel?', 'Quill likes reading, writing, and to swim.',
        ['Quill likes reading, writing and swimming.', 'Quill likes to read, to write and to swim.', 'Quill likes to read, write and swim.']),
      mc('Which list breaks the pattern?', 'She was kind, clever, and had courage.',
        ['She was kind, clever and brave.', 'She had kindness, cleverness and courage.', 'She was kind, she was clever, she was brave.']),
      mc('Which sentence is NOT parallel?', 'The coach told us to stretch, to run, and that we should rest.',
        ['The coach told us to stretch, to run and to rest.', 'The coach told us to stretch, run and rest.', 'The coach told us that we should stretch, run and rest.']),
      mc('Which part of this sentence breaks the pattern? “Mary weeded the beds, watered the roses, and the paths were swept.”', 'the paths were swept',
        ['weeded the beds', 'watered the roses', 'Mary']),
      mc('How many matching parts does Bacon line up in this sentence?', 'three', ['two', 'four', 'five'],
        { quote: 'STUDIES serve for delight, for ornament, and for ability.', work: 'essays-bacon' }),
      mc('Lincoln builds this line on one repeated pattern. Which words begin each part?', 'we cannot', ['this ground', 'consecrate', 'hallow'],
        { quote: 'we cannot dedicate. . .we cannot consecrate. . . we cannot hallow this ground', work: 'gettysburg' }),
      mc('Dickens builds a list of matching parts. What is repeated in each part?', 'a verb, then “his” and a body part',
        ['a name, then a describing word', 'a question, then its answer', 'a place, then a time of day'],
        { quote: 'The cold within him froze his old features, nipped his pointed nose, shrivelled his cheek, stiffened his gait;', work: 'carol' }),
      mc('Dickens pairs each part with its opposite. Which phrase is paired with “the age of wisdom”?', 'the age of foolishness',
        ['the best of times', 'the worst of times', 'it was'],
        { quote: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness', work: 'two-cities' }),
      mc('Bacon leaves a word out of the second and third parts, because the pattern lets the reader supply it. Which word is left out?', 'maketh',
        ['man', 'full', 'Reading'],
        { quote: 'Reading maketh a full man; conference a ready man; and writing an exact man.', work: 'essays-bacon' }),
      mc('What makes the two halves of Brutus\'s line parallel?', 'the same shape, with two words changed',
        ['they rhyme with each other at the end', 'they both ask the listener a question', 'they list three things Brutus did'],
        { quote: 'Not that I loved Caesar less, but that I loved Rome more.', work: 'caesar' }),
      mc('Which sentence is parallel?', 'Tom would rather fish than whitewash a fence.',
        ['Tom would rather fish than whitewashing a fence.', 'Tom would rather fishing than to whitewash a fence.', 'Tom would rather to fish than whitewashing a fence.']),
      mc('Which sentence is NOT parallel?', 'The castle was old, cold, and it had many draughts.',
        ['The castle was old, cold and draughty.', 'The castle was old and cold and draughty.', 'The castle was old, it was cold, it was draughty.']),
      mc('Which sentence is parallel?', 'She was not only clever but also kind.',
        ['She not only was clever but also kind.', 'Not only was she clever but also kindness.', 'She was not only clever but also had kindness.']),
    ],
  },
  {
    id: 's8-fix', level: 8, band: 3, needsReview: false,
    title: 'Make it match', iCan: 'I can rebuild a sentence so its matching parts match.',
    story: 'Quill finds a sentence with one part out of step, like a marcher on the wrong foot. "Do not throw the sentence away," says Quill. "Just change the part that broke the pattern."',
    learn: {
      why: 'To fix a sentence that is not parallel, find the pattern most of its parts already follow, then rebuild the odd part in the same shape: a verb to match verbs, an adjective to match adjectives, "to" to match "to". Pairs joined by than, or, either…or and not only…but also must match too.',
      example: ['Jim cleaned the cabin, polished the brass, and was making the beds. → … and made the beds.', 'It is better to give than receiving. → It is better to give than to receive.'],
    },
    sources: [],
    items: [
      mc('Make it parallel: “Jim cleaned the cabin, polished the brass, and was making the beds.”', 'Jim cleaned the cabin, polished the brass, and made the beds.',
        ['Jim cleaned the cabin, polishing the brass, and made the beds.', 'Jim was cleaning the cabin, polished the brass, and made the beds.', 'Jim cleaned the cabin, polished the brass, and the beds were made.']),
      mc('Make it parallel: “Mole likes rowing, picnics, and to lie in the sun.”', 'Mole likes rowing, picnicking, and lying in the sun.',
        ['Mole likes to row, picnicking, and lying in the sun.', 'Mole likes rowing, to picnic, and lying in the sun.', 'Mole likes rowing, picnicking, and to lie in the sun.']),
      mc('Make it parallel: “The storm was sudden, violent, and it frightened everyone.”', 'The storm was sudden, violent, and frightening.',
        ['The storm was sudden, violent, and it was frightening.', 'The storm was sudden, it was violent, and frightening.', 'The storm was suddenly, violent, and frightening.']),
      mc('Make it parallel: “She wanted to travel, to paint, and writing poems.”', 'She wanted to travel, to paint, and to write poems.',
        ['She wanted to travel, painting, and to write poems.', 'She wanted travelling, to paint, and to write poems.', 'She wanted to travel, to paint, and writing a poem.']),
      mc('Make it parallel: “Either we leave now or staying until dawn.”', 'Either we leave now or we stay until dawn.',
        ['Either leaving now or we stay until dawn.', 'Either we leave now or to stay until dawn.', 'Either we leave now or we staying until dawn.']),
      mc('Make it parallel: “The dog was fast, strong, and had loyalty.”', 'The dog was fast, strong, and loyal.',
        ['The dog was fast, strong, and with loyalty.', 'The dog was fast, strength, and loyal.', 'The dog had speed, strong, and loyal.']),
      mc('Make it parallel: “He not only lost his map but also his compass.”', 'He lost not only his map but also his compass.',
        ['He not only lost his map but also his compass too.', 'He lost not only his map but also losing his compass.', 'He not only lost his map but also a compass lost.']),
      mc('Brutus builds four parts on one pattern. What comes first in every part?', 'a clause beginning with “as”',
        ['a question to the crowd', 'a list of three names', 'the word “but”'],
        { quote: 'As Caesar loved me, I weep for him; as he was fortunate, I rejoice at it; as he was valiant, I honor him; but as he was ambitious, I slew him', work: 'caesar' }),
      mc('Lincoln\'s three phrases change only one word each time. What kind of word changes?', 'a preposition: of, by, for',
        ['a noun: people, nation, earth', 'a verb: govern, rule, lead', 'an adjective: free, equal, brave'],
        { quote: 'government of the people. . .by the people. . .for the people', work: 'gettysburg' }),
      mc('Which version is parallel? “In the morning, after lunch, and when evening came, Quill read.”', 'In the morning, after lunch, and before bed, Quill read.',
        ['In the morning, after lunch, and when it was bedtime, Quill read.', 'Mornings, after lunch, and when evening came, Quill read.', 'In the morning, after lunch, and evening came, Quill read.']),
      mc('Which fix keeps the pair parallel? “It is better to give than receiving.”', 'It is better to give than to receive.',
        ['It is better giving than to receive.', 'It is better to give than receiving gifts.', 'It is better to giving than receive.']),
      mc('Why does parallel structure help a reader?', 'matching shapes show which ideas belong together',
        ['it makes every sentence shorter', 'it hides the main idea until the end', 'it lets the writer skip punctuation']),
      mc('How many describing words does Dickens line up here?', 'three', ['two', 'four', 'one'],
        { quote: 'secret, and self-contained, and solitary as an oyster', work: 'carol' }),
    ],
  },

  // ── Level 9 · Periodic and loose sentences ──
  {
    id: 's9-spot', level: 9, band: 3, needsReview: false,
    title: 'Periodic or loose?', iCan: 'I can tell a periodic sentence from a loose one.',
    story: 'Quill tells two jokes: one gives away the punchline first, the other makes you wait for it. "Sentences work the same way," says Quill. "Some say the main thing at once; some hold it back."',
    learn: {
      why: 'A loose sentence states its main clause first and then adds details: you could stop early and still have a sentence. A periodic sentence builds up phrases and clauses first, and the main point arrives only at the end. To tell them apart, find the main clause — the part that could stand alone — and see where it falls.',
      example: ['Loose: The dogs pulled the sled through the snow, past the lake, over the hill.', 'Periodic: Through the snow, past the lake, over the hill, the dogs pulled the sled.'],
    },
    sources: [],
    items: [
      kindOf('periodic', 'Because men, groping in the Arctic darkness, had found a yellow metal, and because steamship and transportation companies were booming the find, thousands of men were rushing into the Northland.', 'call-wild'),
      kindOf('periodic', 'My father\'s family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip.', 'great-expectations'),
      kindOf('periodic', 'When she found the entire fence whitewashed, and not only whitewashed but elaborately coated and recoated, and even a streak added to the ground, her astonishment was almost unspeakable.', 'tomsawyer'),
      kindOf('periodic', 'If he could have known that he was an orphan, left to the tender mercies of church-wardens and overseers, perhaps he would have cried the louder.', 'oliver'),
      kindOf('periodic', 'Far less than half-way to the hamlet, very little beyond the bottom of the hill, we must come forth into the moonlight.', 'treasure'),
      kindOf('periodic', 'If he could only get away from the holes in the banks, he thought, there would be no more faces.', 'wind'),
      kindOf('loose', 'The Mole had been working very hard all the morning, spring-cleaning his little home.', 'wind'),
      kindOf('loose', 'I will begin the story of my adventures with a certain morning early in the month of June, the year of grace 1751, when I took the key for the last time out of the door of my father\'s house.', 'kidnapped'),
      kindOf('loose', 'Presently a vagrant poodle dog came idling along, sad at heart, lazy with the summer softness and the quiet, weary of captivity, sighing for change.', 'tomsawyer'),
      kindOf('loose', 'Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tide-water dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego.', 'call-wild'),
      kindOf('loose', 'Gradually the balloon swelled out and rose into the air, until finally the basket just touched the ground.', 'oz'),
      kindOf('loose', 'Instantly I began to extricate myself and crawl back again, with what speed and silence I could manage, to the more open portion of the wood.', 'treasure'),
    ],
  },
  {
    id: 's9-effect', level: 9, band: 3, needsReview: false,
    title: 'Why make us wait?', iCan: 'I can say what holding back the main point does.',
    story: 'Quill slowly lifts the lid of a box, a little at a time. "The waiting is half the fun," Quill whispers. "A periodic sentence lifts the lid slowly; a loose one opens it at once and shows you around."',
    learn: {
      why: 'Holding back the main clause builds suspense or weight: the reader gathers the reasons, places or details first, and the point lands hard at the end. A loose sentence is easier to follow and feels natural, like talk, adding picture after picture. Most writing is loose; a periodic sentence is saved for a moment that matters.',
      example: ['Periodic: Just as the last candle flickered out, the door creaked open.', 'Loose: The door creaked open just as the last candle flickered out.'],
    },
    sources: [],
    items: [
      mc('Jack London makes us wait through two “because” clauses before the main clause. What does the wait do?', 'builds up the reasons before the big result lands',
        ['hides who is speaking until the end', 'turns the whole sentence into a question', 'makes the main point come first'],
        { quote: 'Because men, groping in the Arctic darkness, had found a yellow metal, and because steamship and transportation companies were booming the find, thousands of men were rushing into the Northland.', work: 'call-wild' }),
      mc('Why does Dickens hold back the name until the very last word?', 'so the short name lands like a punchline',
        ['because a name must end every sentence', 'to show that he has forgotten his name', 'so the sentence can be read backwards'],
        { quote: 'My father\'s family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip.', work: 'great-expectations' }),
      mc('What does the long build-up before the main clause do here?', 'piles up all she sees, so we feel her surprise grow',
        ['tells us that Tom did not whitewash the fence', 'shows that she has gone to sleep in the sun', 'lists the tools that Tom used for the job'],
        { quote: 'When she found the entire fence whitewashed, and not only whitewashed but elaborately coated and recoated, and even a streak added to the ground, her astonishment was almost unspeakable.', work: 'tomsawyer' }),
      mc('Twain names the dog first, then adds detail after detail. What does that do?', 'lets the picture grow as we read, like a stroll',
        ['keeps us guessing who the sentence is about', 'saves the most important word for last', 'makes the dog sound fierce and dangerous'],
        { quote: 'Presently a vagrant poodle dog came idling along, sad at heart, lazy with the summer softness and the quiet, weary of captivity, sighing for change.', work: 'tomsawyer' }),
      mc('Which version is periodic, with the main point saved for the end? “The bridge collapsed after weeks of rain and a night of storms.”', 'After weeks of rain and a night of storms, the bridge collapsed.',
        ['The bridge collapsed after a night of storms and weeks of rain.', 'The bridge collapsed, after weeks of rain, in a night of storms.', 'Weeks of rain fell, and then the bridge collapsed in the storm.']),
      mc('Which version is loose, with the main point first? “Through the snow, past the frozen lake, and over the last hill, the dogs pulled the sled.”', 'The dogs pulled the sled through the snow, past the frozen lake, and over the last hill.',
        ['Over the last hill, past the frozen lake, and through the snow, the dogs pulled the sled.', 'Through the snow and past the frozen lake, the dogs pulled the sled over the hill.', 'Through the snow, past the frozen lake, over the last hill: the dogs and the sled.']),
      mc('Which of these is a periodic sentence?', 'Just as the last candle flickered out, the door creaked open.',
        ['The door creaked open just as the last candle flickered out.', 'The door creaked open, and the last candle flickered out.', 'The candle went out; the door creaked open in the dark.']),
      mc('Which of these is a loose sentence?', 'Quill curled up by the fire, warm, full and half asleep.',
        ['Warm, full and half asleep, Quill curled up by the fire.', 'By the fire, warm and half asleep, curled the tired Quill.', 'When he was warm and full, Quill curled up by the fire.']),
      mc('When is a periodic sentence most useful?', 'when you want the reader to wait for the big moment',
        ['when you want the main point stated first', 'whenever a sentence is very short', 'when you are writing a list of things to buy']),
      mc('Why do most writers use more loose sentences than periodic ones?', 'loose ones read easily; too many periodic ones tire',
        ['periodic sentences break the rules of grammar', 'loose sentences are always shorter', 'periodic sentences cannot use commas']),
      mc('Stevenson puts the main clause first and then adds when and where. What does that do?', 'tells us at once what the sentence is about',
        ['keeps us in suspense until the very end', 'hides the narrator until the last word', 'turns the opening into a riddle'],
        { quote: 'I will begin the story of my adventures with a certain morning early in the month of June, the year of grace 1751, when I took the key for the last time out of the door of my father\'s house.', work: 'kidnapped' }),
      mc('Dickens opens with an “if” clause and makes us wait for the main clause. What does the delay do?', 'makes us feel the sad facts before the cry',
        ['tells us that Oliver knew he was an orphan', 'makes the sentence a question for the reader', 'shows that Oliver is laughing, not crying'],
        { quote: 'If he could have known that he was an orphan, left to the tender mercies of church-wardens and overseers, perhaps he would have cried the louder.', work: 'oliver' }),
      mc('Jim names the places before the main clause. What does the delay do?', 'builds dread as they near the open moonlight',
        ['tells us the hamlet is far behind them', 'shows the moonlight is a welcome friend', 'names the place where the treasure is'],
        { quote: 'Far less than half-way to the hamlet, very little beyond the bottom of the hill, we must come forth into the moonlight.', work: 'treasure' }),
    ],
  },

  // ── Level 10 · Sentences on demand ──
  {
    id: 's10-meet', level: 10, band: 3, needsReview: false,
    title: 'Meet the brief', iCan: 'I can choose the sentence that meets every rule of a brief.',
    story: 'Quill has a job card: "One sentence. Start with a when-clause. Include three things." Quill grins. "A writer can build any sentence to order — if every rule is checked, one at a time."',
    learn: {
      why: 'A brief is a set of rules a sentence must meet, all at once. Check each rule separately against each sentence: Is it one sentence? How does it begin — a subordinate clause has its own subject and verb? Is there a list of three, in matching shapes? Does each semicolon join two complete sentences, or separate list items that already contain commas?',
      example: ['Brief: begins with a subordinate clause; contains a list of three.', 'When the storm passed, we found branches, leaves and a broken kite.'],
    },
    sources: [],
    items: [
      mc(MEET('it begins with a subordinate clause', 'it contains a list of three'), 'When the storm passed, we found branches, leaves and a broken kite.',
        ['After the storm, we found branches, leaves and a broken kite.', // a phrase, not a clause
          'When the storm passed, we found branches and a broken kite.', // a list of two
          'We found branches, leaves and a broken kite when the storm passed.']), // the clause comes last
      mc(MEET('it is one sentence', 'it uses a semicolon correctly'), 'The fox was hungry; the henhouse was locked.',
        ['The fox was hungry; because the henhouse was locked.', // semicolon before a clause that cannot stand alone
          'The fox was hungry. The henhouse was locked tight.', // two sentences, no semicolon
          'The fox was hungry, and the henhouse was locked.']), // no semicolon
      mc(MEET('it begins with an -ing phrase', 'it uses a semicolon correctly'), 'Hearing the whistle, Bobbie ran to the fence; the train was coming.',
        ['Hearing the whistle, Bobbie ran to the fence, for the train was coming.', // no semicolon
          'When she heard the whistle, Bobbie ran to the fence; the train was coming.', // opens with a clause
          'Hearing the whistle; Bobbie ran to the fence.']), // semicolon after a phrase
      mc(MEET('it contains a list of three', 'the list is parallel'), 'Jo liked writing plays, reading novels and climbing trees.',
        ['Jo liked writing plays, reading novels and to climb trees.', // not parallel
          'Jo liked writing plays and reading novels in the attic.', // a list of two
          'Jo liked to write plays, reading novels and climbing trees.']), // not parallel
      mc(MEET('it is one sentence', 'it begins with a subordinate clause', 'it uses a semicolon correctly'), 'Although the boat leaked, Rat kept rowing; Mole bailed out the water.',
        ['Although the boat leaked; Rat kept rowing and Mole bailed out the water.', // semicolon after the clause
          'Although the boat leaked, Rat kept rowing. Mole bailed it out.', // two sentences, no semicolon
          'Rat kept rowing although the boat leaked; Mole bailed out the water.']), // does not begin with the clause
      mc(MEET('it begins with a prepositional phrase', 'it contains a list of three'), 'In the old trunk, Anne found ribbons, letters and a silver locket.',
        ['Opening the old trunk, Anne found ribbons, letters and a silver locket.', // an -ing phrase
          'In the old trunk, Anne found ribbons and a silver locket.', // a list of two
          'Anne found ribbons, letters and a silver locket in the old trunk.']), // the phrase comes last
      mc(MEET('it is one sentence', 'it is periodic: the main clause comes last'), 'After three days of searching the hills, the shepherd found his lamb.',
        ['The shepherd found his lamb after three days of searching the hills.', // loose
          'After three days of searching the hills. Then the shepherd found his lamb.', // a fragment and a sentence
          'The shepherd searched the hills for three days, and he found his lamb.']), // main clause first
      mc(MEET('it lists three places', 'semicolons separate list items that contain commas'), 'We visited Pune, in India; Paris, in France; and Lima, in Peru.',
        ['We visited Pune, in India, Paris, in France, and also Lima, in Peru.', // commas only, no semicolons
          'We visited Pune, in India; and Paris, in France.', // two places
          'We visited Pune, in India; Paris, in France; Lima, in Peru; and Delhi.']), // four places
      mc(MEET('it begins with a subordinate clause', 'it contains a list of three', 'the list is parallel'), 'Before the guests arrived, we swept the floor, set the table and lit the candles.',
        ['Before the guests arrived, we swept the floor, set the table and the candles were lit.', // not parallel
          'Before the guests’ arrival, we swept the floor, set the table and lit the candles.', // a phrase, no verb of its own
          'We swept the floor, set the table and lit the candles before the guests arrived.']), // the clause comes last
      mc(MEET('it is one sentence', 'it begins with an -ing phrase', 'it contains a list of three'), 'Grinning widely, Tom showed us a marble, a dead rat and a key.',
        ['Grinning widely, Tom showed us a marble and a key.', // a list of two
          'Tom grinned widely and showed us a marble, a dead rat and a key.', // begins with the subject
          'Grinning widely, Tom showed us a marble, a dead rat and a key. Then he ran.']), // two sentences
      mc(MEET('it is one sentence', 'it begins with an adverb', 'it uses a semicolon correctly'), 'Slowly, the tide went out; the rock pools shone in the sun.',
        ['Slowly, the tide went out, and the rock pools shone in the sun.', // no semicolon
          'As the tide went out slowly; the rock pools shone in the sun.', // opens with a clause; semicolon after it
          'The tide went out slowly; the rock pools shone in the sun.']), // begins with the subject
      mc(MEET('it is one sentence', 'it begins with a subordinate clause', 'it contains a list of three', 'it uses a semicolon correctly'),
        'When winter came, the birds left, the pond froze and the fields turned white; only the robin stayed.',
        ['When winter came, the birds left, the pond froze and the fields turned white. Only the robin stayed behind.', // two sentences, no semicolon
          'When winter came, the birds left and the pond froze; only the robin stayed.', // a list of two
          'The birds left, the pond froze and the fields turned white when winter came; only the robin stayed.']), // the clause comes last
    ],
  },
  {
    id: 's10-check', level: 10, band: 3, needsReview: false,
    title: 'Check against the brief', iCan: 'I can find the rule a sentence misses.',
    story: 'Quill is the editor today, with a red pencil and a brief pinned to the desk. "Each of these sentences nearly made it," says Quill. "Find the one rule each one missed."',
    learn: {
      why: 'Checking your own sentence against a brief is the same skill as building one. Go rule by rule: count the sentences (full stops), look at the first words (a subordinate clause has a joining word like when, because or although, then a subject and a verb), count the list, and test each semicolon — could the words on each side stand alone?',
      example: ['Brief: one sentence; begins with a subordinate clause; a list of three; a correct semicolon.', 'If the sun shines, we will swim and sail; the boat is ready. → misses the list of three'],
    },
    sources: [],
    items: [
      misses('semi', 'If the sun shines, we will swim, fish and sail, the boat is ready.'),
      misses('list', 'If the sun shines, we will swim and sail; the boat is ready.'),
      misses('sub', 'In the sunshine, we will swim, fish and sail; the boat is ready.'),
      misses('one', 'If the sun shines, we will swim, fish and sail; the boat is ready. Bring a towel.'),
      misses('semi', 'Because the path was steep; we carried water, bread and rope, and nobody complained.'),
      misses('sub', 'Carrying water, bread and rope, we climbed the steep path; nobody complained.'),
      misses('list', 'Because the path was steep, we carried water and rope; nobody complained.'),
      misses('one', 'Because the path was steep, we carried water, bread and rope. Nobody complained; we sang.'),
      misses('semi', 'When the circus came, we saw clowns, jugglers and a lion, it roared at us.'),
      misses('sub', 'At the circus, we saw clowns, jugglers and a lion; it roared at us.'),
      misses('list', 'When the circus came, we saw clowns and a lion; it roared at us.'),
      misses('one', 'When the circus came, we saw clowns, jugglers and a lion; it roared. We cheered.'),
      misses('semi', 'Although Toad promised; he bought a car, a boat and a caravan, and Rat sighed.'),
    ],
  },
];

export const sentenceStops = (level) => SENTENCE_STOPS.filter((s) => s.level === level);
