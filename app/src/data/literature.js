// The Literature strand (strand 6, "knowing the great works"): its authored stops for levels 1–9,
// the Figure Hunt bank, and the level-10 writing-desk prompts ("My case for this book").
//
// Rules this file keeps (docs/00-spec.md §3, §7; CLAUDE.md hard rules 1, 2, 5, 6):
// - Every item is about a story the child can hear in the Library, or a work on its shelves.
// - Every `quote`, every option of a `lines` item (with its work in `from`) and every FIGURES
//   `text` is an exact substring of a held, cleared text (app/public/texts/<work>.txt), any run
//   of whitespace matching any run. Never a paraphrase, never from memory.
// - No passage marked needsReview is used.
// - Every item has one defensible right answer whose words are not in its question or quote,
//   three distinct wrong answers, and the right answer is never the longest by more than 40%.
// - FIGURES is strict: a 'simile' compares with like / as / as if; 'none' carries no figure at all,
//   not even a stray alliteration. Lines that mix two figures are left out.
// test/literature.mjs holds all of this.

const Q = (q, right, wrong, x = {}) => ({ q, right, wrong, ...x });
const FIG = ['a simile', 'a metaphor', 'personification', 'alliteration'];
const fig = (right) => FIG.filter((f) => f !== right);

export const LIT_STOPS = [
  // ── Level 1 · Story elements ──────────────────────────────────────────────
  {
    id: 'li1-who-where', level: 1, title: 'Who and where', band: 1,
    iCan: 'I can name the main character and the setting of a story.',
    story: 'Quill is packing for a story and needs two things before he can set off: WHO is in it, and WHERE it happens. Without those, a story cannot even begin.',
    learn: {
      why: 'Characters are the people or animals a story is about; the main character is the one the story follows most. The setting is where (and when) it happens. In The Tale of Peter Rabbit, Peter is the main character, and most of the story is set in Mr. McGregor\'s vegetable garden.',
      example: ['Peter Rabbit: Peter, in a vegetable garden.', 'The Wind in the Willows: Mole and Rat, on a river.', 'Treasure Island: a boy and an old sea-dog, at an inn by the sea.'],
    },
    items: [
      Q("In Beatrix Potter's tale, which young rabbit disobeys his mother?", 'Peter', ['Flopsy', 'Mopsy', 'Cotton-tail'], { work: 'peterrabbit', passage: 'peterrabbit-garden' }),
      Q('Where does the naughty rabbit squeeze under a gate, though he was told not to go there?', "Mr. McGregor's garden", ["the baker's shop", 'a field of blackberries', 'the root of a fir-tree'], { work: 'peterrabbit', passage: 'peterrabbit-garden' }),
      Q('As the cyclone comes, who stands in the door holding Toto in her arms?', 'Dorothy', ['Aunt Em', 'Uncle Henry', 'the Witch'], { work: 'oz', passage: 'oz-cyclone' }),
      Q('When the cyclone comes, where does Aunt Em hide?', 'in the cellar', ['in the cow-shed', 'up in the attic', 'behind the barn'], { work: 'oz', passage: 'oz-cyclone' }),
      Q('Whom does Alice chase across the field at the start of her adventure?', 'a White Rabbit', ['a Cheshire Cat', 'her sister', 'a March Hare'], { work: 'alice', passage: 'alice-rabbit-hole' }),
      Q('Where is Alice sitting when the story begins?', 'on a bank by her sister', ['in a classroom', 'in a boat on a river', 'by the fire at home'], { work: 'alice', passage: 'alice-rabbit-hole' }),
      Q('Who takes the Mole for his first ride in a boat?', 'the Water Rat', ['Mr. Toad', 'the Badger', 'an Otter'], { work: 'wind', passage: 'wind-boats' }),
      Q("Where does the Mole's first boat ride happen?", 'on a river', ['at the seaside', 'on a frozen pond', 'in a city canal'], { work: 'wind', passage: 'wind-boats' }),
      Q('Who finds the hidden door under the ivy?', 'Mary', ['the robin', 'a gardener', 'a housemaid'], { work: 'secretgarden', passage: 'secretgarden-door' }),
      Q('What lies on the other side of the door that Mary unlocks?', 'a secret garden', ['a dark cellar', 'a stable', 'a library'], { work: 'secretgarden', passage: 'secretgarden-door' }),
      Q('In the Jungle Book story, who nearly leaps on the baby in the bushes?', 'Father Wolf', ['Mother Wolf', 'a tiger', 'a panther'], { work: 'jungle', passage: 'jungle-mowgli' }),
      Q("Where does the man's cub come one night?", "to a wolf's cave", ['to a village', 'to a river bank', "to a hunter's hut"], { work: 'jungle', passage: 'jungle-mowgli' }),
      Q('Who tells the story of the old sea-dog in Treasure Island?', "the innkeeper's son", ['the old captain', 'Squire Trelawney', 'a parrot'], { work: 'treasure', passage: 'treasure-benbow' }),
      Q('Where does the old seaman with the sabre cut come to stay?', 'at the Admiral Benbow inn', ['on Treasure Island', 'aboard a pirate ship', 'in a lighthouse'], { work: 'treasure', passage: 'treasure-benbow' }),
    ],
  },
  {
    id: 'li1-problem', level: 1, title: 'What goes wrong?', band: 1,
    iCan: 'I can say what the problem in a story is, and how it is sorted out.',
    story: 'Quill once read a story where nothing went wrong. Everyone was happy from the first page to the last. He fell asleep halfway through. A story needs a problem!',
    learn: {
      why: 'The problem is what goes wrong, or what a character has to deal with. It is what makes us want to read on. The plot is the chain of events: the problem starts it, things get harder, and the ending sorts it out. In The Hare and the Tortoise, the problem is a race the Hare is sure he cannot lose.',
      example: ['Peter Rabbit: Mr. McGregor chases him → he wriggles free, but loses his jacket.', 'The Wizard of Oz: a cyclone lifts the house into the sky.', 'The Lion and the Mouse: the Lion is caught → the Mouse gnaws the ropes.'],
    },
    items: [
      Q('What does the Hare do that loses him the race?', 'he lies down for a nap', ['he runs the wrong way', 'he trips over a stone', 'he stops to eat lunch'], { work: 'aesop', passage: 'aesop-hare-tortoise' }),
      Q("What keeps getting the Elephant's Child spanked?", 'he asks too many questions', ["he eats other animals' food", 'he tramples the gardens', 'he runs away from home'], { work: 'justso', passage: 'justso-elephant' }),
      Q('What spoils the feast when the Country Mouse visits the town?', 'two huge dogs burst in', ['the cheese has gone mouldy', 'a cat eats the cakes', 'the candles go out'], { work: 'aesop', passage: 'aesop-town-mouse' }),
      Q('Later in the fable, what happens to the Lion who let the Mouse go?', 'hunters catch him in a trap', ['he loses his roar', 'he falls into a river', 'he is chased by elephants'], { work: 'aesop', passage: 'aesop-lion-mouse' }),
      Q('How is the trapped Lion set free?', 'the Mouse gnaws through the ropes', ['the hunters set him free', 'he breaks the ropes himself', 'an elephant pulls the tree down'], { work: 'aesop', passage: 'aesop-lion-mouse' }),
      Q('What catches Peter Rabbit as he runs from Mr. McGregor?', 'a gooseberry net', ['a cucumber frame', 'a garden sieve', 'a watering-can'], { work: 'peterrabbit', passage: 'peterrabbit-garden' }),
      Q("How does Peter get away from Mr. McGregor's sieve?", 'he wriggles out of his jacket', ['he jumps into the pond', 'he climbs an apple tree', 'he digs under the wall'], { work: 'peterrabbit', passage: 'peterrabbit-garden' }),
      Q('What do the four sisters in Little Women have to do without this Christmas?', 'presents', ['their mother', 'their home', 'a fire to sit by'], { work: 'littlewomen', passage: 'littlewomen-presents' }),
      Q("What danger comes to Dorothy's home in the story?", 'a cyclone', ['a flood', 'a forest fire', 'a swarm of locusts'], { work: 'oz', passage: 'oz-cyclone' }),
      Q('What problem does Alice have before she sees the White Rabbit?', 'she is bored, with nothing to do', ['she has lost her kitten', 'she is late for school', 'she is lost in a wood'], { work: 'alice', passage: 'alice-rabbit-hole' }),
      Q("What goes wrong at the end of Mole's first boat ride?", 'they crash into the bank', ['they spring a leak', 'Mole falls into the water', 'they lose both oars'], { work: 'wind', passage: 'wind-boats' }),
      Q('Why is the statue of the Happy Prince weeping?', 'he can see the misery of his city', ['his gold has been stolen', 'the Swallow has flown away', 'rain has spoiled his jewels'], { work: 'happyprince', passage: 'happyprince-swallow' }),
      Q('What has kept Mary out of the garden for ten years?', 'a locked door hidden by ivy', ['a pack of guard dogs', 'a deep, wide moat', 'a high gate with spikes'], { work: 'secretgarden', passage: 'secretgarden-door' }),
    ],
  },

  // ── Level 2 · Character ───────────────────────────────────────────────────
  {
    id: 'li2-wants', level: 2, title: 'What do they want?', band: 1,
    iCan: 'I can say what a character wants.',
    story: 'Quill wants a cosy den, a good book and a pear. Every character in a story wants something too, and that want is what pushes the story along.',
    learn: {
      why: 'A character\'s want is what they are trying to get or do. Listen for what they ask for, wish for, or set off to find. In Little Women, Jo wants a book, Amy wants drawing pencils and Beth wants new music: three sisters, three different wants.',
      example: ["The Elephant's Child wants to know what the Crocodile has for dinner.", 'The Happy Prince wants to help the poor of his city.', 'Jo wants to buy a book for herself.'],
    },
    items: [
      Q('What does Jo want to buy with her dollar?', 'a book for herself', ['drawing pencils', 'new music', 'a present for Mother'], { work: 'littlewomen', passage: 'littlewomen-presents' }),
      Q('What does Amy want to buy?', 'pencils', ['a book', 'music', 'gloves'], { work: 'littlewomen', passage: 'littlewomen-presents' }),
      Q("What does the Elephant's Child want to know?", 'what the Crocodile has for dinner', ['why the sky is blue', 'where the Limpopo River ends', 'how the Ostrich lays eggs'], { work: 'justso', passage: 'justso-elephant' }),
      Q('What does the Happy Prince ask the Swallow to take to the poor seamstress?', 'a ruby from his sword', ['a bag of gold coins', 'a loaf of fresh bread', 'a basket of oranges'], { work: 'happyprince', passage: 'happyprince-swallow' }),
      Q('What does the Rabbit want the Skin Horse to explain?', 'what being Real means', ['how to be wound up', 'where Nana keeps the toys', 'why the boy is ill'], { work: 'velveteen', passage: 'velveteen-real' }),
      Q('What does the old seaman want from the inn?', 'a quiet spot to watch ships', ['a job serving at the bar', 'a map of a treasure island', 'a room for his family'], { work: 'treasure', passage: 'treasure-benbow' }),
      Q('What does the Town Mouse want to show his cousin?', 'how grandly he lives', ['how to grow beans', 'the way to the farm', 'his collection of cheese'], { work: 'aesop', passage: 'aesop-town-mouse' }),
      Q("What does Mother Wolf want to do with the man's cub?", 'raise him with her children', ['take him back to the village', 'give him to the tiger', 'send him away at dawn'], { work: 'jungle', passage: 'jungle-mowgli' }),
      Q('What does the little Mouse promise when he begs for his life?', 'to do the King a good turn some day', ['to bring him a fat goose', 'to leave the forest for ever', 'to find him a new den'], { work: 'aesop', passage: 'aesop-lion-mouse' }),
      Q('In "The Champa Flower", what does the child want to do?', 'play a hiding game with mother', ['grow up very fast', 'read the Ramayana alone', 'go to the cow-shed at night'], { work: 'crescentmoon', passage: 'tagore-champa' }),
      Q('What does the Hare want everyone to see?', 'how fast he can run', ['how kind he is to friends', 'how well he can dig', 'how long he can sleep'], { work: 'aesop', passage: 'aesop-hare-tortoise' }),
      Q('What does Beth say they still have, even without presents?', 'Father and Mother, and each other', ['a warm house and good food', 'plenty of books to read', 'money saved for the spring'], { work: 'littlewomen', passage: 'littlewomen-presents' }),
      Q('In "The Land of Counterpane", how does the sick child pass the day?', 'playing with toys on the bed', ['reading books by the window', 'sleeping until supper', 'watching the rain outside'], { work: 'garden-verses', passage: 'stevenson-counterpane' }),
    ],
  },
  {
    id: 'li2-traits', level: 2, title: 'What are they like?', band: 2,
    iCan: 'I can describe a character from what they say and do.',
    story: 'Quill\'s friends say he is curious. Nobody had to tell them: they have watched him poke his nose into every burrow in the wood. Readers learn about characters the same way.',
    learn: {
      why: 'Writers rarely just say "she was brave". They SHOW us, through what a character says, does and thinks, and how others treat them. Dickens does not stop at one word for Scrooge: he piles up "squeezing, wrenching, grasping, scraping…" until we know. Find the evidence, then choose the word.',
      example: ['"I have never yet been beaten," says the Hare → boastful.', 'The Tortoise plods on and on → steady.', 'Beth: "We\'ve got Father and Mother, and each other" → grateful.'],
    },
    items: [
      Q('Which word best describes Scrooge in this line?', 'miserly', ['generous', 'cheerful', 'forgetful'], { work: 'carol', passage: 'carol-scrooge', quote: 'a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner!' }),
      Q("Which word best describes the Elephant's Child?", 'curious', ['lazy', 'cruel', 'timid'], { work: 'justso', passage: 'justso-elephant' }),
      Q('What sort of character is the Tortoise?', 'steady and patient', ['boastful and quick', 'sleepy and lazy', 'rude and greedy'], { work: 'aesop', passage: 'aesop-hare-tortoise' }),
      Q('Which word best describes the Hare here?', 'boastful', ['modest', 'frightened', 'gentle'], { work: 'aesop', passage: 'aesop-hare-tortoise', quote: '"I have never yet been beaten," said he, "when I put forth my full speed.' }),
      Q('What does this line tell us about the Mole?', 'he loves it at first sight', ['he is afraid it will sink', 'he thinks it is too small', 'he does not notice it'], { work: 'wind', passage: 'wind-boats', quote: "the Mole's whole heart went out to it at once" }),
      Q('Which word best describes Humpty Dumpty when he talks to Alice?', 'rude', ['kind', 'shy', 'polite'], { work: 'lookingglass', passage: 'lookingglass-humpty' }),
      Q('Which word best describes Alice when she talks to Humpty Dumpty?', 'polite', ['rude', 'boastful', 'angry'], { work: 'lookingglass', passage: 'lookingglass-humpty' }),
      Q('Which word best describes the Skin Horse?', 'wise', ['boastful', 'silly', 'unkind'], { work: 'velveteen', passage: 'velveteen-real' }),
      Q('Which word best describes the old seaman at the Admiral Benbow?', 'fierce', ['timid', 'gentle', 'shy'], { work: 'treasure', passage: 'treasure-benbow' }),
      Q('How does Mary feel as she finds the door?', 'thrilled', ['bored', 'ashamed', 'sleepy'], { work: 'secretgarden', passage: 'secretgarden-door', quote: "Mary's heart began to thump and her hands to shake a little in her delight and excitement." }),
      Q('What does this line show about Beth?', 'she is grateful for her family', ['she is angry about money', 'she wishes she were rich', 'she is jealous of her sisters'], { work: 'littlewomen', passage: 'littlewomen-presents', quote: '"We\'ve got Father and Mother, and each other," said Beth contentedly from her corner.' }),
      Q('What does this line show about the Happy Prince?', 'he feels sorry for his people', ['he is proud of his gold', 'he is afraid of the Swallow', 'he wants to be left alone'], { work: 'happyprince', passage: 'happyprince-swallow', quote: 'though my heart is made of lead yet I cannot chose but weep.' }),
      Q('What does this line show about Mother Wolf?', 'she is tender towards the baby', ['she wants to eat the cub', 'she is frightened of men', 'she is angry with Father Wolf'], { work: 'jungle', passage: 'jungle-mowgli', quote: '"How little! How naked, and--how bold!" said Mother Wolf softly.' }),
    ],
  },

  // ── Level 3 · Setting and mood ────────────────────────────────────────────
  {
    id: 'li3-mood', level: 3, title: 'How does it feel?', band: 2,
    iCan: 'I can say how a setting makes me feel.',
    story: 'On a sunny morning Quill\'s wood is a playground. On a stormy night, the very same wood makes his fur stand on end. Same place, different feeling: that feeling is the mood.',
    learn: {
      why: 'The setting is where and when a story happens. The mood is the feeling the writing gives you: cosy, gloomy, spooky, joyful. Writers build mood from the setting and from their choice of words. "A gray cat walking a gray fence in a gray backyard": three grays make the moment feel dull and sad.',
      example: ['"Ten thousand dancing in the breeze" → lively', '"It was very dark, and the wind howled horribly" → frightening', '"I almost get a creepy feeling" → spooky'],
    },
    items: [
      Q('What mood does this line from a poem about a swing create?', 'joyful', ['gloomy', 'fearful', 'bored'], { work: 'garden-verses', passage: 'stevenson-swing', quote: 'Oh, I do think it the pleasantest thing Ever a child can do!' }),
      Q('Which word best describes the mood here?', 'frightening', ['peaceful', 'funny', 'cosy'], { work: 'oz', passage: 'oz-cyclone', quote: 'It was very dark, and the wind howled horribly around her' }),
      Q('Which word best describes the mood of this scene?', 'dreary', ['exciting', 'cheerful', 'furious'], { work: 'magi', passage: 'magi-della', quote: 'looked out dully at a gray cat walking a gray fence in a gray backyard' }),
      Q('Which word best describes the mood of this line?', 'lively', ['gloomy', 'angry', 'sleepy'], { work: 'wordsworth', passage: 'wordsworth-daffodils', quote: 'Ten thousand dancing in the breeze.' }),
      Q('What mood is the niece creating for her visitor?', 'spooky', ['jolly', 'sleepy', 'angry'], { work: 'saki', passage: 'saki-window', quote: 'I almost get a creepy feeling that they will all walk in through that window' }),
      Q('Which word best describes the mood here?', 'lonely', ['crowded', 'noisy', 'merry'], { work: 'secretgarden', passage: 'secretgarden-door', quote: 'No one was coming. No one ever did come, it seemed,' }),
      Q('Which word best describes the mood around Scrooge?', 'bleak', ['warm', 'jolly', 'playful'], { work: 'carol', passage: 'carol-scrooge', quote: 'The cold within him froze his old features' }),
      Q('How do the sailors feel in these lines?', 'hopeless', ['joyful', 'busy', 'silly'], { work: 'mariner', passage: 'mariner-calm', quote: 'Day after day, day after day, We stuck, nor breath nor motion;' }),
      Q('Which word best describes the mood of this winter evening?', 'hushed', ['noisy', 'angry', 'busy'], { work: 'keats', passage: 'keats-grasshopper', quote: 'On a lone winter evening, when the frost Has wrought a silence' }),
      Q('What mood do these lines create?', 'dark and fierce', ['soft and sleepy', 'silly and playful', 'calm and sunny'], { work: 'blake', passage: 'blake-tiger', quote: 'Tiger, tiger, burning bright In the forests of the night,' }),
      Q("Where does the child play in \"The Land of Counterpane\"?", 'in bed, among the sheets', ['in a garden by a pond', 'at the seaside', 'in a busy toyshop'], { work: 'garden-verses', passage: 'stevenson-counterpane' }),
      Q('Where was the Gettysburg Address spoken?', 'on a battlefield', ['in a royal palace', 'on a ship at sea', 'in a schoolroom'], { work: 'gettysburg', passage: 'gettysburg-address' }),
      Q('Where are the four sisters as they grumble about Christmas?', 'at home by the fire', ['in church', 'at school', 'in a shop in town'], { work: 'littlewomen', passage: 'littlewomen-presents' }),
    ],
  },

  // ── Level 4 · Theme ───────────────────────────────────────────────────────
  {
    id: 'li4-theme', level: 4, title: 'What is it really about?', band: 2,
    iCan: 'I can say what a story is really about.',
    story: 'Quill told a story about a tortoise who won a race. "So it is about racing?" asked his friend. "No," said Quill. "It is about something much bigger than that."',
    learn: {
      why: 'The plot is what happens; the theme is what the story is really ABOUT, the big idea underneath. A fable often states its lesson as a moral: "Plodding wins the race". The theme is that steady effort beats careless talent. To find a theme, ask: what does the main character learn, or what would the writer like us to think about?',
      example: ['The Hare and the Tortoise → steady effort wins.', 'The Lion and the Mouse → the small can help the great.', 'The Happy Prince → kindness to those in need.'],
    },
    items: [
      Q('What is the lesson of the race between the Hare and the Tortoise?', 'slow, steady effort beats showing off', ['the fastest runner always wins', 'never race against a friend', 'always rest before a race'], { work: 'aesop', passage: 'aesop-hare-tortoise' }),
      Q('What does this moral mean?', 'even the small can help the mighty', ['never trust a lion', 'big animals are always kind', 'mice should stay at home'], { work: 'aesop', passage: 'aesop-lion-mouse', quote: 'Little friends may prove great friends.' }),
      Q('What does the Country Mouse mean?', 'a plain, safe life is best', ['town food is tastier', 'cousins should share', 'dogs are good company'], { work: 'aesop', passage: 'aesop-town-mouse', quote: 'Better beans and bacon in peace than cakes and ale in fear.' }),
      Q("What is the Skin Horse's talk about being Real really about?", 'love is what changes you', ['toys should be kept new', 'old things are worthless', 'clockwork toys are best'], { work: 'velveteen', passage: 'velveteen-real' }),
      Q('Which theme fits the story of the Happy Prince and the Swallow?', 'kindness to those in need', ['the beauty of gold statues', 'the fun of travel', 'winning a contest'], { work: 'happyprince', passage: 'happyprince-swallow' }),
      Q('Which theme fits "Where the mind is without fear"?', 'a free country of free minds', ['the joy of a summer holiday', 'a quarrel between friends', 'a journey across the sea'], { work: 'gitanjali', passage: 'gitanjali-35' }),
      Q('What is the big idea of the Gettysburg Address?', 'honour the dead by finishing their work', ['wars should be won quickly', 'soldiers should be paid more', 'a new capital city is needed'], { work: 'gettysburg', passage: 'gettysburg-address' }),
      Q("Which theme fits the sisters' talk at the start of Little Women?", 'family matters more than things', ['money brings happiness', 'winter is the best season', 'sisters should never share'], { work: 'littlewomen', passage: 'littlewomen-presents' }),
      Q('What is this poem saying about hope?', 'it keeps singing through hard times', ['it flies away at the first storm', 'it costs more than anyone can pay', 'it belongs only to little birds'], { work: 'dickinson', passage: 'dickinson-hope', quote: 'Hope is the thing with feathers' }),
      Q('What is Thoreau saying in "Why I went to the woods"?', 'live on purpose, not by habit', ['cities are better than forests', 'hard work is a waste of time', 'never live alone'], { work: 'walden', passage: 'walden-woods' }),
      Q("What does Dickens show about Scrooge's meanness?", 'it shuts him off from everyone', ['it makes him many friends', 'it keeps him warm in winter', 'it makes him famous'], { work: 'carol', passage: 'carol-scrooge' }),
      Q("Which theme fits the Elephant's Child?", 'asking questions is worth it', ['always do as your aunts say', 'crocodiles make good friends', 'never travel far from home'], { work: 'justso', passage: 'justso-elephant' }),
      Q('Which theme fits "The Gift of the Magi"?', 'giving up something precious for love', ['the excitement of shopping in town', 'how to save money for a holiday', 'pride in fine clothes and jewels'], { work: 'magi', passage: 'magi-della' }),
    ],
  },

  // ── Level 5 · Figurative language ─────────────────────────────────────────
  {
    id: 'li5-simile', level: 5, title: 'Like, as, or is?', band: 2,
    iCan: 'I can find a simile and a metaphor.',
    story: 'Quill said his tail was like a flame. Then he said, "My tail IS a flame." His friend looked worried and fetched a bucket of water. Words that compare can be very powerful.',
    learn: {
      why: 'A simile compares two different things using "like", "as" or "as if": "I wandered lonely as a Cloud". A metaphor says one thing IS another, with no "like" or "as": "Hope is the thing with feathers". Both make us see something in a new way. The two things compared must really be different: hope is not a bird, which is what makes the metaphor surprising.',
      example: ['simile: "We bear her along like a pearl on a string."', 'metaphor: "Life\'s but a walking shadow"', 'neither: "Suddenly Uncle Henry stood up."'],
    },
    items: [
      Q('Which figure of speech is in this line?', 'a simile', fig('a simile'), { figure: 'simile', work: 'wordsworth', passage: 'wordsworth-daffodils', quote: 'I wandered lonely as a Cloud' }),
      Q('Which figure of speech is in this line?', 'a metaphor', fig('a metaphor'), { figure: 'metaphor', work: 'dickinson', passage: 'dickinson-hope', quote: 'Hope is the thing with feathers' }),
      Q('Which figure of speech is in this line?', 'a simile', fig('a simile'), { figure: 'simile', work: 'anne', quote: 'Anne flew up like a rocket.' }),
      Q('Which figure of speech is in this line from Macbeth?', 'a metaphor', fig('a metaphor'), { figure: 'metaphor', work: 'macbeth', quote: 'Out, out, brief candle!' }),
      Q('Which figure of speech is in this line from Black Beauty?', 'a simile', fig('a simile'), { figure: 'simile', work: 'blackbeauty', quote: "my coat was brushed every day till it shone like a rook's wing." }),
      Q('Which figure of speech is Bacon using here?', 'a metaphor', fig('a metaphor'), { figure: 'metaphor', work: 'essays-bacon', passage: 'bacon-studies', quote: 'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested;' }),
      Q('Which figure of speech is in this line?', 'a metaphor', fig('a metaphor'), { figure: 'metaphor', work: 'carol', passage: 'carol-scrooge', quote: 'He carried his own low temperature always about with him;' }),
      Q('Which line uses a simile?', 'Dorothy felt as if she were going up in a balloon.', ['Then a strange thing happened.', 'Suddenly Uncle Henry stood up.', "Twenty dollars a week doesn't go far."], { figure: 'simile', lines: true, from: ['oz', 'oz', 'oz', 'magi'], passage: 'oz-cyclone' }),
      Q('Which line uses a simile?', 'she felt as if she were being rocked gently, like a baby in a cradle.', ['Uncle Henry sat upon the doorstep and looked anxiously at the sky,', 'Then he ran toward the sheds where the cows and horses were kept.', "Toto jumped out of Dorothy's arms and hid under the bed,"], { figure: 'simile', lines: true, from: ['oz', 'oz', 'oz', 'oz'], passage: 'oz-cyclone' }),
      Q('Which line uses a simile?', 'The rabbit-hole went straight on like a tunnel for some way,', ['In another moment down went Alice after it,', 'There was nothing so VERY remarkable in that;', 'She put the key in and turned it.'], { figure: 'simile', lines: true, from: ['alice', 'alice', 'alice', 'secretgarden'] }),
      Q('Which line uses a metaphor?', 'Hope is the thing with feathers', ['It was the knob of a door.', 'Nobody spoke for a minute;', 'So a course was fixed and a start was made.'], { figure: 'metaphor', lines: true, from: ['dickinson', 'secretgarden', 'littlewomen', 'aesop'] }),
      Q('Which line uses a metaphor?', 'I wanted to live deep and suck out all the marrow of life,', ['My father told him no, very little company, the more was the pity.', 'First he ate some lettuces and some French beans;', 'Twenty dollars a week doesn\'t go far.'], { figure: 'metaphor', lines: true, from: ['walden', 'treasure', 'peterrabbit', 'magi'] }),
      Q('Which line is a metaphor, not a simile?', 'Out, out, brief candle!', ['Anne flew up like a rocket.', 'We bear her along like a pearl on a string.', "my coat was brushed every day till it shone like a rook's wing."], { figure: 'metaphor', lines: true, from: ['macbeth', 'anne', 'naidu', 'blackbeauty'] }),
      Q('Which line is a simile, not a metaphor?', 'he doth bestride the narrow world Like a Colossus,', ['There is a tide in the affairs of men', 'The poetry of earth is never dead:', 'If we shadows have offended,'], { figure: 'simile', lines: true, from: ['caesar', 'caesar', 'keats', 'midsummer'] }),
    ],
  },
  {
    id: 'li5-sound', level: 5, title: 'Voices and echoes', band: 2,
    iCan: 'I can find personification and alliteration.',
    story: 'Quill was sure the brook was laughing at him. Then he noticed his own name in a line of poetry: "quick, quiet Quill". One trick gives things a human voice; the other makes words echo.',
    learn: {
      why: 'Personification gives a human action or feeling to something that is not human: "the brook laughing", "the waves beside them danced". Alliteration repeats the same first sound in words close together: "the great grey-green, greasy Limpopo River". Personification is about MEANING; alliteration is about SOUND, so say the line aloud to hear it.',
      example: ['personification: "only the wind is sighing by."', 'alliteration: "Double, double, toil and trouble;"', 'neither: "She put the key in and turned it."'],
    },
    items: [
      Q('Which figure of speech is in this line from Anne of Green Gables?', 'personification', fig('personification'), { figure: 'personification', work: 'anne', quote: 'And I can hear the brook laughing all the way up here.' }),
      Q('Which figure of speech is in these words?', 'alliteration', fig('alliteration'), { figure: 'alliteration', work: 'justso', passage: 'justso-elephant', quote: 'the great grey-green, greasy Limpopo River' }),
      Q('Which figure of speech is in this line?', 'personification', fig('personification'), { figure: 'personification', work: 'blake', passage: 'blake-lamb', quote: 'Making all the vales rejoice?' }),
      Q('Which figure of speech is in this line from "The Raven"?', 'alliteration', fig('alliteration'), { figure: 'alliteration', work: 'raven', quote: 'While I nodded, nearly napping, suddenly there came a tapping,' }),
      Q('Which figure of speech is in these lines?', 'personification', fig('personification'), { figure: 'personification', work: 'dickinson', quote: 'Because I could not stop for Death, He kindly stopped for me;' }),
      Q('Which figure of speech is in this line?', 'alliteration', fig('alliteration'), { figure: 'alliteration', work: 'tennyson', quote: 'Blow, bugle, blow, set the wild echoes flying,' }),
      Q('Which figure of speech do the witches use here?', 'alliteration', fig('alliteration'), { figure: 'alliteration', work: 'macbeth', quote: 'Double, double, toil and trouble;' }),
      Q('Which line uses personification?', 'The waves beside them danced', ['Suddenly Uncle Henry stood up.', 'It was the knob of a door.', 'Nobody spoke for a minute;'], { figure: 'personification', lines: true, from: ['wordsworth', 'oz', 'secretgarden', 'littlewomen'] }),
      Q('Which line uses personification?', 'When the stars threw down their spears, And watered heaven with their tears,', ['He lost one of his shoes among the cabbages, and the other shoe amongst the potatoes.', 'Uncle Henry sat upon the doorstep and looked anxiously at the sky,', 'My father told him no, very little company, the more was the pity.'], { figure: 'personification', lines: true, from: ['blake', 'peterrabbit', 'oz', 'treasure'] }),
      Q('Which line uses personification?', 'there came a great shriek from the wind', ['Then a strange thing happened.', 'She put the key in and turned it.', 'So a course was fixed and a start was made.'], { figure: 'personification', lines: true, from: ['oz', 'oz', 'secretgarden', 'aesop'] }),
      Q('Which line uses alliteration?', 'Down dropt the breeze, the sails dropt down,', ['She put the key in and turned it.', 'Toto jumped out of Dorothy\'s arms and hid under the bed,', 'Then a strange thing happened.'], { figure: 'alliteration', lines: true, from: ['mariner', 'secretgarden', 'oz', 'oz'] }),
      Q('Which line uses alliteration?', 'Once upon a midnight dreary, while I pondered, weak and weary,', ['Tomorrow would be Christmas Day, and she had only $1.87 with which to buy Jim a present.', 'Then he ran toward the sheds where the cows and horses were kept.', 'First he ate some lettuces and some French beans;'], { figure: 'alliteration', lines: true, from: ['raven', 'magi', 'oz', 'peterrabbit'] }),
      Q('Which line uses alliteration, not personification?', 'Fair is foul, and foul is fair:', ['Making all the vales rejoice?', 'And I can hear the brook laughing all the way up here.', "Nor shall death brag thou wander'st in his shade,"], { figure: 'alliteration', lines: true, from: ['macbeth', 'blake', 'anne', 'sonnets'] }),
      Q('Which line uses personification, not alliteration?', 'The blossom has not opened; only the wind is sighing by.', ['Gaily, O gaily we glide and we sing,', 'Double, double, toil and trouble;', 'The fair breeze blew, the white foam flew, The furrow followed free:'], { figure: 'personification', lines: true, from: ['gitanjali', 'naidu', 'macbeth', 'mariner'] }),
    ],
  },

  // ── Level 6 · Poetic form ─────────────────────────────────────────────────
  {
    id: 'li6-form', level: 6, title: 'The shape of a poem', band: 3,
    iCan: 'I can name a sonnet, a ballad and free verse.',
    story: 'Quill found three poems pinned to a tree. One had fourteen lines; one had five and made him laugh; one rolled on like the sea with no rhyme at all. "Each of them," said Quill, "has chosen a shape."',
    learn: {
      why: 'Poets choose a form: a shape with rules. A sonnet has 14 lines, often with a rhyming couplet at the end. A limerick has 5 lines, rhymes AABBA and is meant to be funny. A ballad tells a story in short stanzas (groups of lines), often of four lines, like an old song. Free verse follows no fixed rhyme or beat: Walt Whitman\'s lines run as long as his breath. Blank verse has a steady beat but no rhyme, as in much of Shakespeare.',
      example: ['14 lines → sonnet (Shakespeare, Keats)', '5 lines, AABBA, funny → limerick (Lear)', 'a story in four-line stanzas → ballad (Coleridge)', 'no rhyme, no fixed beat → free verse (Whitman)'],
    },
    items: [
      Q('This poem has fourteen lines and ends with a rhyming couplet. What form is it?', 'a sonnet', ['a limerick', 'a ballad', 'free verse'], { work: 'sonnets', passage: 'sonnet-18', quote: "Shall I compare thee to a summer's day?" }),
      Q("Keats's poem about the grasshopper and the cricket has fourteen lines, with a turn after the eighth. What form is it?", 'a sonnet', ['a limerick', 'a ballad', 'free verse'], { work: 'keats', passage: 'keats-grasshopper', quote: 'The poetry of earth is never dead:' }),
      Q('This funny poem has five lines that rhyme AABBA. What form is it?', 'a limerick', ['a sonnet', 'a ballad', 'free verse'], { work: 'lear', passage: 'lear-limericks', quote: 'There was an Old Man with a beard, Who said, "It is just as I feared!--' }),
      Q('This long poem tells the story of a voyage in four-line stanzas, like an old song. What form is it?', 'a ballad', ['a sonnet', 'a limerick', 'free verse'], { work: 'mariner', passage: 'mariner-calm', quote: 'The fair breeze blew, the white foam flew, The furrow followed free:' }),
      Q('Whitman\'s poem has long lines with no rhyme scheme and no fixed beat. What form is it?', 'free verse', ['a sonnet', 'a limerick', 'a ballad'], { work: 'leaves', quote: 'I hear America singing, the varied carols I hear,' }),
      Q('Whitman lets each line run as long as he needs, with no rhyme and no regular beat. What is this called?', 'free verse', ['a sonnet', 'a limerick', 'blank verse'], { work: 'leaves', quote: 'A noiseless patient spider,' }),
      Q('How many lines does a sonnet have?', 'fourteen', ['five', 'eight', 'twenty'], {}),
      Q('How many lines does a limerick have?', 'five', ['four', 'fourteen', 'ten'], {}),
      Q('In a limerick, which lines rhyme with the first line?', 'the second and the fifth', ['only the third', 'the third and the fourth', 'none of them'], { work: 'lear', passage: 'lear-limericks' }),
      Q('In "The Lamb" this line comes back again and again. What is a returning line called?', 'a refrain', ['a couplet', 'a simile', 'a sonnet'], { work: 'blake', passage: 'blake-lamb', quote: 'Little lamb, who made thee?' }),
      Q('Two lines in a row whose last words sound alike, like these, are called…', 'a rhyming couplet', ['two lines of free verse', 'a limerick', 'a refrain'], { work: 'garden-verses', passage: 'stevenson-counterpane', quote: 'When I was sick and lay a-bed, I had two pillows at my head,' }),
      Q('This line from Macbeth has ten syllables in a steady da-DUM beat, and the speech does not rhyme. What is that called?', 'blank verse', ['free verse', 'a limerick', 'a ballad'], { work: 'macbeth', quote: 'Creeps in this petty pace from day to day,' }),
      Q('A group of lines in a poem, set apart like a paragraph, is called…', 'a stanza', ['a chapter', 'a refrain', 'a sentence'], {}),
    ],
  },

  // ── Level 7 · Genre ───────────────────────────────────────────────────────
  {
    id: 'li7-genre', level: 7, title: 'Which shelf?', band: 2,
    iCan: 'I can tell an adventure from a mystery, and name other genres.',
    story: 'Quill was sorting the Library shelves: talking animals with a lesson here, detectives over there, pirates and treasure by the window. "Every book," he said, "belongs to a family."',
    learn: {
      why: 'A genre is a family of stories that share features. A fable is short, has animals that talk, and ends with a moral. A fairy tale has magic and wonder. An adventure has journeys and danger. A mystery has a puzzle or a crime to solve from clues. Fantasy builds an impossible world. A play is written to be acted, with speakers\' names before their lines. A speech is spoken aloud to an audience.',
      example: ['The Hare and the Tortoise → fable', 'Treasure Island → adventure', 'The Hound of the Baskervilles → mystery', "A Midsummer Night's Dream → play"],
    },
    items: [
      Q('The Hare and the Tortoise is short, has talking animals and ends with a moral. What genre is it?', 'a fable', ['a mystery', 'a play', 'a speech'], { work: 'aesop', passage: 'aesop-hare-tortoise' }),
      Q('In The Adventures of Sherlock Holmes, a detective solves puzzling crimes from clues. What genre is it?', 'mystery', ['fable', 'fairy tale', 'poetry'], { work: 'holmes' }),
      Q('Treasure Island has pirates, a map, a sea voyage and danger at every turn. What genre is it?', 'adventure', ['fable', 'mystery', 'speech'], { work: 'treasure' }),
      Q("A Midsummer Night's Dream is written with speakers' names before their lines, to be acted on a stage. What is it?", 'a play', ['a novel', 'a fable', 'a speech'], { work: 'midsummer' }),
      Q('Lincoln said these words aloud to a crowd at Gettysburg. What kind of text is it?', 'a speech', ['a play', 'a fable', 'a sonnet'], { work: 'gettysburg', passage: 'gettysburg-address' }),
      Q('Alice falls down a hole into a world where cats vanish and playing cards talk. What genre is it?', 'fantasy', ['fable', 'mystery', 'speech'], { work: 'alice' }),
      Q('The Time Machine imagines an invention that carries a man far into the future. What genre is it?', 'science fiction', ['historical fiction', 'fairy tale', 'fable'], { work: 'timemachine' }),
      Q('Bacon\'s "Of Studies" is a short piece of prose giving the writer\'s own thoughts on a subject. What is it?', 'an essay', ['a novel', 'a play', 'a fable'], { work: 'essays-bacon', passage: 'bacon-studies' }),
      Q('A statue that weeps, a talking swallow, a palace where sorrow may not enter: what genre is "The Happy Prince"?', 'fairy tale', ['detective story', 'speech', 'essay'], { work: 'happyprince', passage: 'happyprince-swallow' }),
      Q('The Hound of the Baskervilles: a death on the moor, giant footprints, and Holmes on the case. What genre?', 'mystery', ['fable', 'fairy tale', 'essay'], { work: 'hound' }),
      Q('Kidnapped: a boy is shipwrecked and flees across the Highlands with an outlaw. What genre?', 'adventure', ['a fable', 'an essay', 'a love sonnet'], { work: 'kidnapped' }),
      Q('Little Women follows four sisters through ordinary family life, with no magic at all. What genre is it?', 'realistic fiction', ['fantasy', 'fable', 'science fiction'], { work: 'littlewomen' }),
      Q("Walden is Thoreau's true account of two years he lived in a hut by a pond. What kind of writing is it?", 'non-fiction', ['fantasy', 'a fable', 'a fairy tale'], { work: 'walden', passage: 'walden-woods' }),
      Q('Which of these is most likely to end with a moral?', 'a fable', ['a mystery', 'a sonnet', 'a speech'], {}),
    ],
  },

  // ── Level 8 · Literary periods ────────────────────────────────────────────
  {
    id: 'li8-periods', level: 8, title: 'The ages of writing', band: 3,
    iCan: 'I can place a work in its age.',
    story: 'Quill laid the books out on a long table, oldest at one end, newest at the other. Suddenly they looked like a family tree: each age of writing had its own voice.',
    learn: {
      why: 'Writers belong to their times. The Elizabethan age (the late 1500s, Shakespeare\'s time) loved plays and sonnets. The 18th century brought the first English novels, such as Robinson Crusoe and Gulliver\'s Travels. The Romantic poets (about 1790 to 1830) wrote about nature and feeling. The Victorian age (1837 to 1901) was the age of the great novel: Dickens, the Brontës, Alice. Edwardian writers (from 1901) gave us The Wind in the Willows and Peter Rabbit.',
      example: ["A Midsummer Night's Dream (1600) → Elizabethan", 'Wordsworth\'s daffodils (1807) → Romantic', 'A Christmas Carol (1843) → Victorian', 'The Wind in the Willows (1908) → Edwardian'],
    },
    items: [
      Q("Gulliver's Travels was published in 1726. Which period does it belong to?", 'the 18th century', ['the Victorian age', 'the Romantic age', 'the Edwardian age'], { work: 'gulliver' }),
      Q("Wordsworth's poems about daffodils and hills came out in 1807. Which period do they belong to?", 'the Romantic age', ['the Victorian age', 'the Elizabethan age', 'the 18th century'], { work: 'wordsworth' }),
      Q('A Christmas Carol was published in 1843. Which period does it belong to?', 'the Victorian age', ['the Elizabethan age', 'the Romantic age', 'the 18th century'], { work: 'carol' }),
      Q("A Midsummer Night's Dream was first printed in 1600. Which period does it belong to?", 'the Elizabethan age', ['the Victorian age', 'the Romantic age', 'the Edwardian age'], { work: 'midsummer' }),
      Q('The Wind in the Willows was published in 1908. Which period does it belong to?', 'the Edwardian age', ['the Elizabethan age', 'the Romantic age', 'the 18th century'], { work: 'wind' }),
      Q("Francis Bacon's Essays first appeared in 1597. Which period do they belong to?", 'the Elizabethan age', ['the Victorian age', 'the Edwardian age', 'the 18th century'], { work: 'essays-bacon' }),
      Q("Mary Shelley's Frankenstein appeared in 1818. Which period does it belong to?", 'the Romantic age', ['the Elizabethan age', 'the Edwardian age', 'the 18th century'], { work: 'frankenstein' }),
      Q('Which of these works is the oldest?', "A Midsummer Night's Dream", ['Robinson Crusoe', 'Pride and Prejudice', "Alice's Adventures in Wonderland"], {}),
      Q('Which of these was written in the Victorian age?', 'Great Expectations', ["Gulliver's Travels", 'The Wind in the Willows', "Shakespeare's Sonnets"], {}),
      Q('Which of these was written in the Romantic age?', 'The Rime of the Ancient Mariner', ['A Christmas Carol', 'The Hound of the Baskervilles', "Gulliver's Travels"], {}),
      Q('Which of these was written in the Edwardian age?', 'Just So Stories', ['Oliver Twist', 'Robinson Crusoe', 'Songs of Innocence and of Experience'], {}),
      Q("Which of these comes from the same age as Alice's Adventures in Wonderland (1865)?", 'A Christmas Carol', ["Gulliver's Travels", 'The Tale of Peter Rabbit', "A Midsummer Night's Dream"], {}),
      Q('Which of these was published LAST?', 'The Wind in the Willows', ['Treasure Island', 'The Rime of the Ancient Mariner', "Alice's Adventures in Wonderland"], {}),
      Q('Who was on the throne for most of the years when Dickens and the Brontës were writing?', 'Queen Victoria', ['Queen Elizabeth I', 'King Edward VII', 'King Henry VIII'], {}),
    ],
  },

  // ── Level 9 · Comparing works ─────────────────────────────────────────────
  {
    id: 'li9-compare', level: 9, title: 'Side by side', band: 3,
    iCan: 'I can compare two works.',
    story: 'Quill put two books side by side and found they were whispering to each other: the same worry, the same hope, told in different ways. Comparing is listening to that conversation.',
    learn: {
      why: 'To compare two works, look for what is the SAME (a theme, a kind of character, a setting) and what is DIFFERENT (the form, the mood, who tells the story). Blake\'s "The Lamb" and "The Tiger" ask the same question, "who made you?", but one is gentle and the other fierce.',
      example: ['Same: The Lamb and The Tiger both ask who made the creature.', 'Different: the lamb is meek and mild; the tiger burns bright.', 'Same: Alice and Dorothy are both carried off into strange lands.'],
    },
    items: [
      Q('Blake\'s "The Lamb" and "The Tiger" both ask the same question. What is it?', 'who made the creature', ['where the creature lives', 'what the creature eats', 'how old the creature is'], { work: 'blake' }),
      Q('How are the moods of "The Lamb" and "The Tiger" different?', 'one is gentle, the other fearsome', ['one is funny, the other dull', 'both are sleepy and calm', 'one is angry, the other bored'], { work: 'blake' }),
      Q('What do Alice (down the rabbit-hole) and Dorothy (in the cyclone) have in common?', 'both are carried off into strange lands', ['both are chased by a farmer', 'both are looking for a lost dog', 'both are princesses in disguise'], {}),
      Q('Which of these stories is told by a narrator who was there, saying "I"?', 'Treasure Island', ["Alice's Adventures in Wonderland", 'The Wonderful Wizard of Oz', 'The Wind in the Willows'], {}),
      Q('What do Della in The Gift of the Magi and the sisters in Little Women share?', 'barely any money at Christmas', ['a house by the sea', 'a father who is a sailor', 'a love of horses'], {}),
      Q('What do Scrooge and the Happy Prince (while he was alive) have in common?', 'both ignored the poor around them', ['both were kind to beggars', 'both lived in palaces', 'both were always cheerful'], {}),
      Q('Which pair of works were both written by Rudyard Kipling?', 'The Jungle Book and Just So Stories', ['Treasure Island and Kidnapped', 'Alice and Through the Looking-Glass', 'Kim and Black Beauty'], {}),
      Q('Which pair of works were both written by Robert Louis Stevenson?', 'Treasure Island and Kidnapped', ['The Jungle Book and Kim', 'Little Women and Heidi', 'Oliver Twist and Walden'], {}),
      Q('Both "I wandered lonely as a Cloud" and "On the Grasshopper and Cricket" celebrate…', 'the joys of nature', ['life in a busy city', 'a famous battle', 'the sorrow of war'], {}),
      Q('"Where the mind is without fear" and the Gettysburg Address both hope for…', 'a nation that is truly free', ['a return to the old ways', 'a richer king', 'a voyage to new lands'], {}),
      Q('Robinson Crusoe and The Tempest (in Tales from Shakespeare) share which kind of setting?', 'an island far from home', ['a busy London street', 'a frozen mountain pass', 'a palace in the desert'], {}),
      Q('What do the Hare and the Town Mouse have in common?', 'both are too proud of themselves', ['both are kind to strangers', 'both live in the country', 'both are afraid of dogs'], {}),
      Q('A sonnet by Shakespeare and a limerick by Lear: how do they differ most?', 'one is solemn, one is silly', ['one rhymes, one never does', 'one is a play, one a novel', 'one is sung, one is acted'], {}),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FIGURES — the Figure Hunt bank (SPEC §8: "find the simile, metaphor or alliteration").
// Each text is an exact line or sentence from a held, cleared text. A line that mixes figures
// (a simile with alliteration in it, say) is left out, so every entry has ONE right answer.
// ─────────────────────────────────────────────────────────────────────────────
const F = (figure, work, text) => ({ text, work, figure });
export const FIGURES = [
  // simile: like / as / as if, comparing two different things
  F('simile', 'wordsworth', 'I wandered lonely as a Cloud'),
  F('simile', 'naidu', 'We bear her along like a pearl on a string.'),
  F('simile', 'mariner', 'As idle as a painted ship Upon a painted ocean.'),
  F('simile', 'oz', 'Dorothy felt as if she were going up in a balloon.'),
  F('simile', 'oz', 'she felt as if she were being rocked gently, like a baby in a cradle.'),
  F('simile', 'magi', "So now Della's beautiful hair fell about her rippling and shining like a cascade of brown waters."),
  F('simile', 'garden-verses', 'For he sometimes shoots up taller like an india-rubber ball,'),
  F('simile', 'alice', 'The rabbit-hole went straight on like a tunnel for some way,'),
  F('simile', 'treasure', 'This, when it was brought to him, he drank slowly, like a connoisseur,'),
  F('simile', 'railway', "my heart's thumping like a steam-engine"),
  F('simile', 'anne', 'Anne flew up like a rocket.'),
  F('simile', 'blackbeauty', "my coat was brushed every day till it shone like a rook's wing."),
  F('simile', 'blackbeauty', 'I steamed all over, Joe used to say, like a pot on the fire.'),
  F('simile', 'five-children', "All its fur stood out like a cat's when it is going to fight."),
  F('simile', 'caesar', 'he doth bestride the narrow world Like a Colossus,'),
  F('simile', 'hound', 'It was drifting slowly in our direction and banked itself up like a wall on that side of us, low but thick and well defined.'),
  // metaphor: one thing said to BE another
  F('metaphor', 'dickinson', 'Hope is the thing with feathers'),
  F('metaphor', 'macbeth', 'Out, out, brief candle!'),
  F('metaphor', 'essays-bacon', 'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested;'),
  F('metaphor', 'walden', 'I wanted to live deep and suck out all the marrow of life,'),
  F('metaphor', 'carol', 'He carried his own low temperature always about with him;'),
  F('metaphor', 'keats', 'The poetry of earth is never dead:'),
  F('metaphor', 'caesar', 'There is a tide in the affairs of men'),
  F('metaphor', 'caesar', 'Cry "Havoc!" and let slip the dogs of war,'),
  F('metaphor', 'midsummer', 'If we shadows have offended,'),
  F('metaphor', 'littlewomen', 'Jo, who was a bookworm.'),
  F('metaphor', 'gettysburg', 'shall have a new birth of freedom'),
  F('metaphor', 'walden', 'to drive life into a corner, and reduce it to its lowest terms,'),
  F('metaphor', 'walden', 'Time is but the stream I go a-fishing in.'),
  F('metaphor', 'macbeth', 'O, full of scorpions is my mind, dear wife!'),
  // personification: a human action or feeling given to something not human
  F('personification', 'wordsworth', 'The waves beside them danced'),
  F('personification', 'wordsworth', 'Outdid the sparkling waves in glee'),
  F('personification', 'carol', 'The heaviest rain, and snow, and hail, and sleet, could boast of the advantage over him in only one respect.'),
  F('personification', 'blake', 'When the stars threw down their spears, And watered heaven with their tears,'),
  F('personification', 'sonnets', "Nor shall death brag thou wander'st in his shade,"),
  F('personification', 'oz', 'there came a great shriek from the wind'),
  F('personification', 'blake', 'Making all the vales rejoice?'),
  F('personification', 'anne', 'And I can hear the brook laughing all the way up here.'),
  F('personification', 'gitanjali', 'The blossom has not opened; only the wind is sighing by.'),
  F('personification', 'dickinson', 'Because I could not stop for Death, He kindly stopped for me;'),
  F('personification', 'mariner', 'And now the STORM-BLAST came, and he Was tyrannous and strong:'),
  F('personification', 'hound', 'Beyond, two copses of trees moaned and swung in a rising wind.'),
  F('personification', 'dickinson', 'It tried to be a rose And failed, and all the summer laughed.'),
  // alliteration: the same first sound repeated in words close together
  F('alliteration', 'justso', 'the great grey-green, greasy Limpopo River'),
  F('alliteration', 'mariner', 'The fair breeze blew, the white foam flew, The furrow followed free:'),
  F('alliteration', 'mariner', 'Down dropt the breeze, the sails dropt down,'),
  F('alliteration', 'raven', 'Once upon a midnight dreary, while I pondered, weak and weary,'),
  F('alliteration', 'raven', 'While I nodded, nearly napping, suddenly there came a tapping,'),
  F('alliteration', 'raven', 'Deep into that darkness peering, long I stood there wondering, fearing,'),
  F('alliteration', 'raven', 'Thrilled me--filled me with fantastic terrors never felt before;'),
  F('alliteration', 'tennyson', 'Blow, bugle, blow, set the wild echoes flying,'),
  F('alliteration', 'tennyson', 'The long light shakes across the lakes,'),
  F('alliteration', 'macbeth', 'Double, double, toil and trouble;'),
  F('alliteration', 'macbeth', 'Fair is foul, and foul is fair:'),
  F('alliteration', 'naidu', 'Gaily, O gaily we glide and we sing,'),
  F('alliteration', 'lear', 'And some small spotty dogs,'),
  // none: plain, literal sentences with no figure at all
  F('none', 'oz', 'Suddenly Uncle Henry stood up.'),
  F('none', 'oz', 'Then a strange thing happened.'),
  F('none', 'oz', 'Then he ran toward the sheds where the cows and horses were kept.'),
  F('none', 'oz', "Toto jumped out of Dorothy's arms and hid under the bed,"),
  F('none', 'oz', 'Uncle Henry sat upon the doorstep and looked anxiously at the sky,'),
  F('none', 'secretgarden', 'She put the key in and turned it.'),
  F('none', 'secretgarden', 'It was the knob of a door.'),
  F('none', 'treasure', 'My father told him no, very little company, the more was the pity.'),
  F('none', 'peterrabbit', 'He lost one of his shoes among the cabbages, and the other shoe amongst the potatoes.'),
  F('none', 'peterrabbit', 'First he ate some lettuces and some French beans;'),
  F('none', 'magi', 'Tomorrow would be Christmas Day, and she had only $1.87 with which to buy Jim a present.'),
  F('none', 'magi', "Twenty dollars a week doesn't go far."),
  F('none', 'aesop', 'So a course was fixed and a start was made.'),
  F('none', 'littlewomen', 'Nobody spoke for a minute;'),
  F('none', 'alice', 'In another moment down went Alice after it,'),
  F('none', 'alice', 'There was nothing so VERY remarkable in that;'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Level 10 · My case for this book — a writing-desk piece (kept, counted, never machine-marked;
// a grown-up's rubric on a later day decides, as for every desk piece).
// ─────────────────────────────────────────────────────────────────────────────
export const CASE_PROMPTS = [
  'Choose a book from the Library and argue that it is the best one for a child your age.',
  'Pick a character you admire from any story in the Library, and make the case that they are the true hero of their book.',
  'Choose two books you have met in the Library. Argue which one a new reader should start with, and why.',
  'Choose a poem from the Library and argue that everyone should learn it by heart.',
  'Pick a book written more than a hundred years ago and argue that it still matters today.',
  'Choose a book some people call too hard or too old-fashioned, and make the case for giving it a chance.',
];

/* The desk shape for level 10, in the form curriculum.js gives every desk stop. */
export const CASE_DESK = {
  prompts: CASE_PROMPTS,
  parts: [
    ['My claim', 'Name the book (or poem, or character) and say what you will argue, in one sentence.'],
    ['Reason one', 'Your best reason, with a moment or a line from the book as evidence.'],
    ['Reason two', 'Another reason, with its own evidence.'],
    ['The other side', '"Some readers say… but…" Answer them fairly.'],
    ['My claim again', 'Finish by saying your claim again, in new words.'],
  ],
  check: ['I named the book and my claim in the first sentence', 'I gave two reasons', 'Each reason has evidence from the book', 'I answered the other side fairly', 'I ended by restating my claim'],
  min: 6,
};
