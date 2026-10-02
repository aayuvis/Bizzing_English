/* sentences.js — the Sentence strand's item banks (spec §2 strand 2, §6.2).

   Every sentence here is our own, written for this app: never a quotation, never a real living
   person. British spelling. Every item carries band 1 | 2 | 3 (ages 6–7 | 8–10 | 11–14).
   test/banks.mjs holds each bank to its structural rules. */

// ── Parts of speech ────────────────────────────────────────────────────────────────────────
// 'word/TAG' tokens. N noun · V verb (auxiliaries too) · A adjective · R adverb · P preposition ·
// D determiner (articles, this/that/each/every/no, and the possessive determiners my/our/his/its/their)
// C conjunction · PR pronoun · I interjection · '.' punctuation (, . ! ? — each its own token).
// Kept out on purpose, because their class is debatable for a child: gerunds, participle
// adjectives, 'there is', phrasal-verb particles, 'than', 'to' + verb, numbers, noun modifiers.
export const POS_TAGS = {
  N: 'noun', V: 'verb', A: 'adjective', R: 'adverb', P: 'preposition', D: 'determiner',
  C: 'conjunction', PR: 'pronoun', I: 'interjection', '.': 'punctuation',
};

const pos = (band, list) => list.map(s => ({ s, band }));

export const POS = [
  ...pos(1, [
    'The/D hungry/A fox/N jumped/V over/P the/D fence/N ./.',
    'A/D small/A frog/N sat/V on/P the/D log/N ./.',
    'The/D sun/N is/V hot/A ./.',
    'My/D cat/N sleeps/V quietly/R ./.',
    'We/PR ate/V sweet/A mangoes/N ./.',
    'The/D red/A kite/N flew/V above/P the/D trees/N ./.',
    'She/PR sang/V a/D happy/A song/N ./.',
    'The/D baby/N laughed/V loudly/R ./.',
    'Grandpa/N told/V a/D funny/A story/N ./.',
    'The/D brown/A dog/N barked/V at/P the/D postman/N ./.',
    'Rain/N fell/V softly/R on/P the/D roof/N ./.',
    'They/PR played/V cricket/N in/P the/D big/A park/N ./.',
    'The/D tiny/A ant/N carried/V a/D crumb/N ./.',
    'I/PR have/V a/D blue/A bicycle/N ./.',
    'The/D ducks/N swam/V slowly/R across/P the/D pond/N ./.',
    'Our/D teacher/N is/V kind/A ./.',
    'Wow/I ,/. the/D fireworks/N are/V bright/A !/.',
    'The/D cold/A wind/N shook/V the/D windows/N ./.',
    'He/PR kicked/V the/D ball/N gently/R ./.',
    'A/D tall/A giraffe/N ate/V leaves/N ./.',
    'Dad/N made/V hot/A chapatis/N ./.',
    'The/D wise/A owl/N hooted/V at/P night/N ./.',
    'The/D kitten/N drank/V warm/A milk/N ./.',
    'Leaves/N fell/V from/P the/D old/A tree/N ./.',
    'We/PR walked/V carefully/R to/P school/N ./.',
    'The/D bees/N buzzed/V happily/R ./.',
    'Ravi/N found/V a/D shiny/A shell/N ./.',
    'The/D clown/N wore/V big/A shoes/N ./.',
    'My/D sister/N reads/V quietly/R ./.',
    'The/D farmer/N fed/V the/D hungry/A goats/N ./.',
    'Oh/I ,/. the/D soup/N is/V salty/A !/.',
    'The/D bus/N stopped/V suddenly/R ./.',
  ]),
  ...pos(2, [
    'The/D noisy/A monkeys/N climbed/V quickly/R into/P the/D trees/N ./.',
    'Priya/N and/C Sam/N built/V a/D tall/A tower/N with/P blocks/N ./.',
    'The/D heavy/A rain/N flooded/V the/D narrow/A streets/N of/P the/D village/N ./.',
    'During/P the/D festival/N ,/. the/D families/N lit/V bright/A lamps/N ./.',
    'Grandma/N gently/R stirred/V the/D thick/A soup/N ./.',
    'The/D bowler/N ran/V swiftly/R towards/P the/D wicket/N ./.',
    'The/D goalkeeper/N dived/V and/C caught/V the/D muddy/A ball/N ./.',
    'Our/D class/N visited/V a/D huge/A museum/N in/P the/D city/N ./.',
    'The/D astronaut/N floated/V calmly/R inside/P the/D spacecraft/N ./.',
    'A/D curious/A squirrel/N watched/V us/PR from/P the/D branch/N ./.',
    'The/D old/A clock/N ticked/V loudly/R in/P the/D hall/N ./.',
    'We/PR will/V happily/R visit/V our/D cousins/N in/P December/N ./.',
    'The/D clever/A girl/N solved/V the/D puzzle/N quickly/R ./.',
    'The/D chef/N chopped/V the/D onions/N very/R finely/R ./.',
    'Hooray/I ,/. our/D team/N won/V the/D match/N easily/R !/.',
    'The/D lazy/A cat/N stretched/V and/C yawned/V ./.',
    'Stars/N twinkled/V brightly/R above/P the/D quiet/A village/N ./.',
    'The/D students/N listened/V carefully/R to/P the/D visitor/N ./.',
    'The/D brave/A firefighter/N rescued/V a/D small/A puppy/N ./.',
    'Snow/N covered/V the/D steep/A mountains/N ./.',
    'The/D children/N danced/V happily/R around/P the/D bonfire/N ./.',
    'A/D gentle/A breeze/N cooled/V the/D hot/A afternoon/N ./.',
    'The/D hungry/A crocodile/N slid/V silently/R into/P the/D river/N ./.',
    'She/PR packed/V a/D sandwich/N and/C a/D juicy/A apple/N for/P lunch/N ./.',
    'The/D river/N flows/V gently/R past/P the/D temple/N ./.',
    'Dad/N cooked/V spicy/A dal/N for/P dinner/N ./.',
    'The/D batsman/N hit/V the/D red/A ball/N over/P the/D boundary/N ./.',
    'Our/D neighbours/N planted/V colourful/A flowers/N in/P spring/N ./.',
    'The/D robot/N moved/V slowly/R across/P the/D dusty/A floor/N ./.',
    'The/D library/N is/V always/R quiet/A ./.',
    'Meera/N wrote/V a/D long/A letter/N to/P Grandpa/N ./.',
    'The/D comet/N raced/V silently/R through/P space/N ./.',
  ]),
  ...pos(3, [
    'The/D ancient/A fort/N stood/V proudly/R on/P the/D rocky/A hill/N ,/. and/C tourists/N admired/V its/D massive/A walls/N ./.',
    'Although/C the/D path/N was/V steep/A ,/. the/D hikers/N reached/V the/D summit/N before/P sunset/N ./.',
    'The/D scientist/N carefully/R examined/V the/D strange/A rock/N under/P a/D microscope/N ./.',
    'Alas/I ,/. the/D delicate/A vase/N slipped/V from/P his/D hands/N ./.',
    'The/D orchestra/N played/V beautifully/R ,/. but/C the/D hall/N was/V extremely/R cold/A ./.',
    'Lanterns/N glowed/V warmly/R in/P every/D window/N during/P Diwali/N ./.',
    'The/D villagers/N gathered/V eagerly/R because/C the/D harvest/N was/V plentiful/A ./.',
    'The/D enormous/A whale/N rose/V gracefully/R from/P the/D icy/A ocean/N ./.',
    'Our/D grandparents/N clearly/R remember/V a/D time/N without/P televisions/N ./.',
    'The/D captain/N spoke/V confidently/R ,/. and/C the/D nervous/A players/N felt/V calmer/A ./.',
    'Swiftly/R and/C silently/R ,/. the/D leopard/N crept/V through/P the/D tall/A grass/N ./.',
    'The/D market/N was/V noisy/A ,/. so/C we/PR quickly/R found/V a/D quieter/A street/N ./.',
    'Each/D winter/N ,/. huge/A flocks/N of/P cranes/N arrive/V at/P the/D lake/N ./.',
    'The/D pilot/N calmly/R guided/V the/D plane/N through/P the/D fierce/A storm/N ./.',
    'We/PR celebrated/V Eid/N with/P our/D neighbours/N and/C shared/V delicious/A sweets/N ./.',
    'The/D detective/N studied/V the/D muddy/A footprints/N ,/. yet/C she/PR found/V no/D answer/N ./.',
    'The/D tiny/A seed/N slowly/R became/V a/D tall/A sunflower/N ./.',
    'Goodness/I ,/. that/D storm/N was/V incredibly/R loud/A !/.',
    'The/D wise/A judge/N listened/V patiently/R to/P each/D witness/N ./.',
    'During/P Christmas/N ,/. bright/A lights/N decorated/V the/D busy/A streets/N ./.',
    'The/D rover/N carefully/R collected/V samples/N from/P the/D red/A planet/N ./.',
    'My/D uncle/N rarely/R loses/V his/D temper/N ,/. but/C he/PR shouted/V angrily/R at/P the/D referee/N ./.',
    'The/D poet/N chose/V each/D word/N with/P great/A care/N ./.',
    'The/D waves/N crashed/V violently/R against/P the/D steep/A cliffs/N ./.',
    'Although/C Arjun/N was/V nervous/A ,/. he/PR recited/V the/D poem/N perfectly/R ./.',
    'The/D museum/N displays/V rare/A coins/N from/P ancient/A Rome/N ./.',
    'Bravo/I ,/. you/PR played/V that/D song/N wonderfully/R !/.',
    'The/D gardener/N watered/V the/D thirsty/A plants/N before/P breakfast/N ./.',
    'Fog/N drifted/V lazily/R over/P the/D silent/A harbour/N ./.',
    'The/D twins/N argued/V loudly/R ,/. but/C they/PR soon/R made/V peace/N ./.',
    'The/D choir/N sang/V joyfully/R at/P the/D festival/N of/P Holi/N ./.',
    'The/D explorer/N bravely/R crossed/V the/D icy/A desert/N of/P Antarctica/N ./.',
    'Quietly/R ,/. the/D nurse/N checked/V each/D patient/N ./.',
  ]),
];

// ── Subject and predicate ──────────────────────────────────────────────────────────────────
// '|' splits the complete subject from the predicate. No inversions, questions or openers.
const subj = (band, list) => list.map(s => ({ s, band }));

export const SUBJECT = [
  ...subj(1, [
    'The little puppy | wagged its tail.',
    'My grandmother | makes the best pickles.',
    'The yellow bus | stopped at the gate.',
    'Tom and Aisha | built a sandcastle.',
    'A big brown bear | caught a fish.',
    'The whole class | sang a song together.',
    'Our teacher | read us a story.',
    'The rain | made puddles everywhere.',
    'Three white geese | waddled across the road.',
    'I | like spicy noodles.',
    'The moon | shone over the sea.',
    'My best friend | lives in a village.',
    'The silly monkey | stole a banana.',
    'We | flew a kite on the beach.',
    'The children in the garden | picked ripe strawberries.',
    'She | painted a rainbow.',
    'Baby elephants | love mud baths.',
  ]),
  ...subj(2, [
    'The players on our cricket team | practised every evening.',
    'A huge flock of parrots | landed in the guava tree.',
    'The boy with the red cap | scored the winning goal.',
    'Dark clouds over the hills | warned us of the monsoon.',
    'My uncle from Chennai | brought us a box of sweets.',
    'The bright lamps in every window | glowed all through Diwali.',
    'Our neighbour\'s grey cat | sleeps on the warm wall.',
    'The astronauts on the space station | grow vegetables in tiny pots.',
    'Every child in the school | planted a tree.',
    'The tall girl at the back of the room | asked a clever question.',
    'A small blue boat | drifted across the lake.',
    'The museum near the river | opened a new dinosaur gallery.',
    'My little brother and I | baked a chocolate cake.',
    'The farmers in the village | waited for the rain.',
    'The old man next door | feeds the pigeons every morning.',
    'The crowd at the stadium | cheered loudly.',
    'Lanterns of every colour | floated above the crowd.',
  ]),
  ...subj(3, [
    'The scientist who discovered the comet | won a famous prize.',
    'Everyone at the Eid feast | shared dates and sweet vermicelli.',
    'The ancient walls of the city | have stood for eight hundred years.',
    'The gentle sound of the waves | helped the travellers sleep.',
    'A young girl with a notebook full of drawings | sat quietly on the train.',
    'The heavy rain that fell all night | flooded the low fields.',
    'Both the captain and the coach | praised the team\'s courage.',
    'The smell of fresh bread from the bakery | drifted down the street.',
    'The bridge across the wide river | was built by hundreds of workers.',
    'The tallest tree in the whole forest | is over a thousand years old.',
    'Anyone with a library card | can borrow these books.',
    'The rover that landed on Mars | sent back photographs of red dust.',
    'The light from distant stars | takes many years to reach us.',
    'A lantern made of paper and bamboo | hung above the doorway.',
    'The dancers in their bright costumes | moved in perfect time with the drums.',
    'Each of the three explorers | carried a heavy pack.',
    'The students who finished their work | helped tidy the classroom.',
  ]),
];

// ── Phrase or clause ───────────────────────────────────────────────────────────────────────
// A clause has a subject and a finite verb; a phrase does not. Shown without capital or stop.
const pc = (band, kind, list) => list.map(text => ({ text, kind, band }));

export const PHRASE_CLAUSE = [
  ...pc(1, 'phrase', [
    'under the old bridge', 'the big red balloon', 'in the middle of the night', 'behind the school gate',
    'a basket of ripe mangoes', 'across the dusty playground', 'on top of the cupboard', 'a cup of hot milk',
    'inside the dark cave',
  ]),
  ...pc(1, 'clause', [
    'the dog barked', 'she smiled', 'we waited', 'the rain stopped', 'the bees buzzed', 'I found my shoe',
    'the team cheered', 'the moon rose', 'they laughed',
  ]),
  ...pc(2, 'phrase', [
    'after the long match', 'during the festival of lights', 'before breakfast', 'near the busy station',
    'the tallest girl in the class', 'a flock of noisy geese', 'through the open window', 'after the heavy rain',
    'at the end of the street',
  ]),
  ...pc(2, 'clause', [
    'when the bell rang', 'because it was raining', 'after the sun set', 'while the baby slept',
    'if you finish early', 'because the shop was closed', 'when Grandpa visits', 'before the guests arrived',
    'the kite flew',
  ]),
  ...pc(3, 'phrase', [
    'having finished her homework', 'to win the championship', 'despite the terrible weather',
    'the ancient temple on the hill', 'covered in golden leaves', 'with great care and patience',
    'beneath the surface of the lake', 'running through the wet grass',
  ]),
  ...pc(3, 'clause', [
    'although the water was cold', 'since the river flooded', 'unless we hurry', 'who lives next door',
    'as the crowd cheered', 'while the kettle boiled', 'that she painted', 'until the storm passed',
  ]),
];

// ── Find the main clause ───────────────────────────────────────────────────────────────────
// Exactly one independent clause in [brackets] and one dependent clause.
const mc = (band, list) => list.map(s => ({ s, band }));

export const MAIN_CLAUSE = [
  ...mc(1, [
    'When the bell rang, [we went out to play].',
    '[The cat hid] because the dog barked.',
    '[I wore my coat] because it was cold.',
    'When Grandma visits, [she brings sweets].',
    '[We clapped] when the show ended.',
    'If it rains, [we will play inside].',
    '[The baby slept] while we read.',
    'After we ate lunch, [we fed the ducks].',
    '[Sam smiled] when he saw the puppy.',
    'Before the match started, [the players stretched].',
  ]),
  ...mc(2, [
    'Although the water was cold, [Leela jumped into the pool].',
    '[The crowd cheered] as the runners crossed the line.',
    'Because the roads were flooded, [the school closed early].',
    '[We lit the lamps] before the guests arrived.',
    'While Dad cooked the biryani, [I set the table].',
    '[The batsman kept going] until the last ball was bowled.',
    'If you water the seeds every day, [they will sprout].',
    '[The village celebrated] after the harvest was gathered.',
    'Since the bus was late, [we walked to the station].',
    '[Nobody spoke] while the teacher was reading.',
    'Unless we hurry, [we will miss the fireworks].',
    '[The kitten purred] whenever Ayaan stroked it.',
    'When the monsoon arrived, [the frogs began to sing].',
    '[The lights went out] just as the film began.',
    'Even though she was tired, [Meena finished her painting].',
    '[We waited under the tree] until the storm passed.',
  ]),
  ...mc(3, [
    'Although the telescope was old, [it showed the rings of Saturn clearly].',
    '[The astronauts zipped themselves into sleeping bags] so that they would not float away.',
    'Whenever the tide went out, [the children searched the rock pools for crabs].',
    '[The baker rose before dawn] so that the bread would be ready by six.',
    'As soon as the referee blew the whistle, [the stadium erupted with noise].',
    '[The old bridge was closed] because engineers had found cracks in its pillars.',
    'Once the lanterns were lit, [the whole street glowed gold].',
    '[My grandfather still writes letters by hand], although he owns a phone.',
    'If the volcano erupts again, [the villagers will have to leave].',
    '[The museum stayed open late] so that visitors could watch the eclipse.',
    'Wherever the explorers travelled, [they kept a careful diary].',
    '[The choir rehearsed every evening] until every note was perfect.',
    'Because the desert nights are cold, [the travellers carried thick blankets].',
    'Before the festival of Pongal began, [the family cleaned and decorated the house].',
    '[The scientists cheered] when the rover landed safely.',
    'Even though the climb was steep, [the old pilgrim reached the top].',
  ]),
];

// ── Choose the conjunction ─────────────────────────────────────────────────────────────────
// Joined as a + ', ' + right + ' ' + b (FANBOYS) or a + ' ' + right + ' ' + b (subordinators).
// Only the right word makes sense; each wrong one clearly breaks the meaning. Pairs that can
// both be right are never set against each other: but/yet, for/because, since/because,
// while/although, while/until. 'and' is never a wrong answer to 'so' or 'but'.
export const FANBOYS = ['for', 'and', 'nor', 'but', 'or', 'yet', 'so'];
export const SUBORDINATORS = ['because', 'although', 'unless', 'until', 'while', 'since'];

const cj = (band, list) => list.map(([a, b, right, wrong]) => ({ a, b, right, wrong, band }));

export const CONJ = [
  ...cj(1, [
    ['I wanted to play outside', 'it was raining', 'but', ['so', 'or']],
    ['The soup smelled lovely', 'it was far too salty', 'but', ['so', 'or']],
    ['Leo looked everywhere for his shoe', 'he could not find it', 'but', ['so', 'or']],
    ['The puppy is small', 'it has very big paws', 'but', ['so', 'or']],
    ['We ran to the station', 'the train had already left', 'but', ['so', 'or']],
    ['It was raining', 'we stayed inside', 'so', ['but', 'or']],
    ['Mira was thirsty', 'she drank a glass of water', 'so', ['but', 'or']],
    ['The road was icy', 'Dad drove slowly', 'so', ['but', 'or']],
    ['The baby was asleep', 'we whispered', 'so', ['but', 'or']],
    ['I was cold', 'I put on my jumper', 'so', ['but', 'or']],
    ['Hurry up', 'we will miss the bus', 'or', ['so', 'and']],
    ['Wear your raincoat', 'you will get soaked', 'or', ['so', 'and']],
    ['We can walk to the park', 'we can ride our bikes', 'or', ['so', 'for']],
    ['You can have the red cup', 'you can have the blue one', 'or', ['so', 'for']],
    ['Finish your homework', 'you cannot watch the match', 'or', ['so', 'and']],
    ['I brushed my teeth', 'I washed my face', 'and', ['or', 'nor']],
    ['Grandma made the rice', 'Grandpa fried the fish', 'and', ['or', 'nor']],
    ['Asha fed the goats', 'her brother fed the hens', 'and', ['or', 'nor']],
  ]),
  ...cj(2, [
    ['We wore our coats', 'it was freezing outside', 'for', ['or', 'nor']],
    ['The farmer smiled', 'the rain had finally come', 'for', ['or', 'nor']],
    ['Aisha packed an umbrella', 'the sky looked stormy', 'for', ['or', 'nor']],
    ['The crowd fell silent', 'the singer had stepped onto the stage', 'for', ['or', 'nor']],
    ['The cat hid under the bed', 'it was afraid of the thunder', 'for', ['or', 'nor']],
    ['The puzzle looked easy', 'nobody could solve it', 'yet', ['so', 'or']],
    ['Ravi practised every day', 'he still found the song difficult', 'yet', ['so', 'or']],
    ['The desert is very dry', 'many animals live there', 'yet', ['so', 'or']],
    ['The ant is tiny', 'it can carry heavy loads', 'yet', ['so', 'or']],
    ['She was exhausted', 'she kept running to the finish line', 'yet', ['so', 'or']],
    ['Ben does not like spinach', 'does he like peas', 'nor', ['for', 'or']],
    ['The shop was not open', 'was the café next door', 'nor', ['for', 'or']],
    ['We did not see any tigers', 'did we see any elephants', 'nor', ['for', 'or']],
    ['Priya cannot whistle', 'can her brother', 'nor', ['for', 'or']],
    ['The old radio does not work', 'does the television', 'nor', ['for', 'or']],
    ['The bowler ran up to the crease', 'the batsman raised his bat', 'and', ['nor', 'or']],
    ['The lamps were lit', 'the music began', 'and', ['nor', 'or']],
    ['The bridge was closed', 'we drove the long way round', 'so', ['yet', 'or']],
  ]),
  ...cj(3, [
    ['The match was cancelled', 'the pitch was flooded', 'because', ['although', 'unless']],
    ['Mina wore sunglasses', 'the sun was dazzling', 'because', ['although', 'unless']],
    ['The plants wilted', 'nobody had watered them', 'because', ['although', 'unless']],
    ['Arjun finished the race', 'he had a sore ankle', 'although', ['because', 'unless']],
    ['The tea was still hot', 'it had been poured an hour ago', 'although', ['because', 'unless']],
    ['We enjoyed the picnic', 'a few ants joined us', 'although', ['because', 'unless']],
    ['The plants will die', 'someone waters them', 'unless', ['because', 'since']],
    ['You will not catch the bus', 'you leave now', 'unless', ['because', 'since']],
    ['The puppy will not settle', 'its blanket is in the basket', 'unless', ['because', 'since']],
    ['We waited at the gate', 'the bus arrived', 'until', ['because', 'although']],
    ['The children played on the beach', 'the sun went down', 'until', ['because', 'although']],
    ['Grandpa read the newspaper', 'the kettle boiled', 'while', ['because', 'unless']],
    ['The cat slept on the sofa', 'the children did their homework', 'while', ['because', 'unless']],
    ['We have lived in Pune', 'I was four years old', 'since', ['although', 'unless']],
    ['Grandma has grown roses', 'she was a girl', 'since', ['although', 'unless']],
    ['The comet has not been seen', 'our grandparents were young', 'since', ['although', 'unless']],
    ['The explorers kept walking', 'their legs ached', 'although', ['because', 'unless']],
  ]),
];

// ── Commas ─────────────────────────────────────────────────────────────────────────────────
// Every comma is required and has ONE rule. No Oxford comma, ever.
// list · fronted (after a fronted adverbial) · address · yesno · aside (around a non-essential
// clause) · compound (before a FANBOYS word joining two main clauses).
const cm = (band, rule, list) => list.map(s => ({ s, rule, band }));

export const COMMAS = [
  ...cm(1, 'list', [
    'We bought apples, bananas and grapes.',
    'My bag holds a book, a pencil and a ruler.',
    'The farm has cows, goats, hens and ducks.',
    'I can see red, yellow and green lights.',
  ]),
  ...cm(2, 'list', [
    'Mum packed sandwiches, samosas, oranges and a flask of chai.',
    'The rainbow had red, orange, yellow, green, blue, indigo and violet stripes.',
    'We rode the swings, ate candyfloss and watched the puppets.',
    'Leopards, tigers and lions are all big cats.',
  ]),
  ...cm(3, 'list', [
    'The astronauts checked their suits, tested the radio and opened the hatch.',
    'We cleaned the house, drew rangoli and lit the lamps.',
    'The recipe needs flour, butter, sugar and two eggs.',
    'Mercury, Venus, Earth and Mars are the rocky planets.',
  ]),
  ...cm(1, 'fronted', [
    'After lunch, we played in the garden.',
    'Early in the morning, the birds began to sing.',
    'Without a sound, the cat crept closer.',
    'At the end of the day, we went home.',
  ]),
  ...cm(2, 'fronted', [
    'During the monsoon, the river rises very fast.',
    'After the long match, the players drank cold water.',
    'Under the old banyan tree, the children told stories.',
    'Before the guests arrived, we hung the paper lanterns.',
  ]),
  ...cm(3, 'fronted', [
    'As the sun set over the desert, the camels lay down to rest.',
    'Far beneath the icy surface, strange fish swim in the dark.',
    'With a deep breath, the young diver stepped off the board.',
    'Long before the first cities were built, people painted animals on cave walls.',
  ]),
  ...cm(1, 'address', [
    'Mira, come here.',
    'Thank you, Grandpa.',
    'Sam, please shut the door.',
  ]),
  ...cm(2, 'address', [
    'Can you help me with this sum, Leo?',
    'Ravi, your bus is here.',
    'Look at the shooting star, Anya!',
    'Children, please line up by the door.',
  ]),
  ...cm(3, 'address', [
    'Ladies and gentlemen, the concert will begin in five minutes.',
    'I promise you, Grandma, that I will water your roses.',
    'Captain, the storm is getting closer.',
  ]),
  ...cm(1, 'yesno', [
    'Yes, I would like some more.',
    'No, the shop is closed.',
    'Yes, I can tie my laces.',
  ]),
  ...cm(2, 'yesno', [
    'No, the train has not arrived yet.',
    'Yes, we finished the whole jigsaw.',
    'No, I have never seen snow.',
  ]),
  ...cm(3, 'yesno', [
    'Yes, the experiment worked exactly as we had hoped.',
    'No, the museum is closed on Mondays.',
    'Yes, the swallows return to the barn every spring.',
  ]),
  ...cm(2, 'aside', [
    'My grandmother, who lives in Kochi, grows mangoes.',
    'Our dog, who is very old, sleeps all afternoon.',
    'The Nile, which flows through Egypt, is a very long river.',
    'Mr Das, who teaches us music, plays the sitar.',
  ]),
  ...cm(3, 'aside', [
    'Mount Everest, which is the highest mountain on Earth, lies in the Himalayas.',
    'The library, which opened last year, has a room full of comics.',
    'My cousin Zara, who loves cricket, bowls faster than anyone in her class.',
    'The blue whale, which can grow longer than a bus, eats tiny krill.',
    'Our old car, which Dad bought before I was born, still runs well.',
  ]),
  ...cm(2, 'compound', [
    'I wanted to go swimming, but the pool was closed.',
    'The sky grew dark, so we ran inside.',
    'We could take the bus to the beach, or we could cycle along the river.',
    'The kitten was tiny, yet it climbed to the top of the wardrobe.',
  ]),
  ...cm(3, 'compound', [
    'The scientists waited for hours, but the comet never appeared.',
    'The road through the hills was blocked, so the travellers turned back.',
    'Arjun had practised the speech all week, yet his hands still shook.',
    'You must water the seedlings every morning, or they will dry out.',
    'The fishermen did not go out that day, nor did they mend their nets.',
    'The crowd went quiet, for the final ball was about to be bowled.',
  ]),
];

// ── Capital letters ────────────────────────────────────────────────────────────────────────
// Capitals only for: the start of the sentence, people's names, places, days, months,
// festivals and 'I'. Nothing capitalised for an optional reason.
const cp = (band, list) => list.map(s => ({ s, band }));

export const CAPS = [
  ...cp(1, [
    'Last summer Priya visited her grandmother in Jaipur.',
    'On Monday I went to the park with Sam.',
    'My friend Leo has a dog called Biscuit.',
    'We will go to London in May.',
    'Anya and I painted pictures on Friday.',
    'Ravi lives in a village near Pune.',
    'In December we light candles for Christmas.',
    'Tom said I could ride his bike on Saturday.',
    'My birthday is in June.',
    'We played cricket with Arjun on Sunday.',
    'The cat next door is called Pepper.',
    'I saw Meera at the market on Tuesday.',
    'We ate sweets at Diwali with Leela.',
    'My sister Zoya was born in March.',
  ]),
  ...cp(2, [
    'Every April we celebrate Vaisakhi in Amritsar.',
    'My cousins from Nairobi will stay with us in August.',
    'During Eid we visit Uncle Farid in Hyderabad.',
    'The train from Delhi to Agra leaves on Wednesday.',
    'Kofi and I flew kites on the beach in Goa.',
    'In January the river near Lucknow is covered in mist.',
    'Our class wrote letters to children in Tokyo.',
    'At Hanukkah, Noah lights a candle every evening.',
    'We celebrated Onam in Kerala with a huge feast.',
    'Mrs Patel said that I could hand out the books on Thursday.',
    'The football match in Manchester starts on Saturday.',
    'Lin will make dumplings with her grandmother in Beijing.',
    'In October we carved pumpkins with Jack and Ella.',
  ]),
  ...cp(3, [
    'Every year in January, families in Chennai celebrate Pongal.',
    'Aisha says that the bazaar in Istanbul is the busiest she has ever seen.',
    'When I visited Edinburgh in September, it rained every single day.',
    'Our school trip to Mysore is planned for the first Friday in November.',
    'Kwame told me that Accra is hot and humid in March.',
    'At Holi, Rohan and I threw coloured powder in Mathura.',
    'The longest river in Africa, the Nile, flows north into the sea.',
    'Grandma Esther remembers snow in Paris one cold February.',
    'Since Tuesday, Dev and I have been building a robot.',
    'Before Christmas, Sofia and her brothers decorate a tree in Madrid.',
    'The ferry from Mumbai to Alibaug was cancelled on Monday.',
    'Last July I watched the monsoon clouds roll over Shillong.',
    'Hiro and I flew from Osaka to Sydney in December.',
  ]),
];

// ── End punctuation ────────────────────────────────────────────────────────────────────────
// Statements are calm, questions are plainly questions, exclamations are unmistakable.
const ep = (band, list) => list.map(s => ({ s, band }));

export const END = [
  ...ep(1, [
    'The cat is asleep on the mat.',
    'We had rice and dal for lunch.',
    'My shoes are blue.',
    'The bus stops near our school.',
    'Where did you put my blue umbrella?',
    'Is it time for lunch?',
    'Who ate the last biscuit?',
    'Can you see the moon?',
    'What a huge wave that was!',
    'How tall you have grown!',
    'Ouch, that really hurts!',
    'What a lovely surprise!',
    'Do you like mangoes?',
    'The ducks swim on the pond.',
  ]),
  ...ep(2, [
    'The library opens at nine o\'clock.',
    'Grandpa grows tomatoes in his garden.',
    'Our team practises on Tuesdays.',
    'The kettle is on the stove.',
    'Why is the sky blue?',
    'How many legs does a spider have?',
    'Which bus goes to the station?',
    'Have you finished your painting?',
    'What a brilliant catch that was!',
    'How beautifully the choir sang!',
    'Hooray, we won the cup!',
    'What a mess this room is!',
    'When does the festival begin?',
    'The swallows fly south in autumn.',
  ]),
  ...ep(3, [
    'The museum closes early on Sundays.',
    'Most deserts receive very little rain.',
    'The bridge was built over a hundred years ago.',
    'Owls can turn their heads a very long way.',
    'Why do leaves change colour in autumn?',
    'How far is the nearest star from Earth?',
    'Whose footprints are those in the snow?',
    'Would you rather visit the mountains or the sea?',
    'What an enormous elephant that is!',
    'How quickly the snow has melted!',
    'What a terrible storm we had last night!',
    'How brightly the lanterns glow tonight!',
    'Wow, what a view from the top!',
    'The baker sells fresh bread every morning.',
  ]),
];

// ── Put the words in order ─────────────────────────────────────────────────────────────────
// The words admit one grammatical order only: no movable adverbs or time phrases, one
// adjective (that fits only one noun), at most one determiner unless 'a/an' pins it, no two
// nouns that could plausibly swap roles, no word used twice. 5–12 words.
const od = (band, list) => list.map(s => ({ s, band }));

export const ORDER = [
  ...od(1, [
    'Priya ate a juicy mango.',
    'She hugged the fluffy puppy.',
    'We built a huge sandcastle.',
    'He kicked the muddy ball.',
    'They planted tiny sunflower seeds.',
    'She fed the hungry ducks.',
    'We shared a plate of crispy samosas.',
    'He wore a woolly hat.',
    'They sang a happy song.',
    'I found a shiny shell.',
    'She rode a red bicycle.',
    'We picked a basket of ripe strawberries.',
    'He drew a funny monkey.',
    'They watched a noisy parade.',
    'I hugged my kind grandmother.',
    'She caught a slippery fish.',
    'We baked a chocolate cake.',
    'I drank a glass of fizzy lemonade.',
  ]),
  ...od(2, [
    'Grandpa told us a story about tigers.',
    'Zara saved a powerful penalty.',
    'We visited a museum of ancient coins.',
    'He scored a brilliant goal.',
    'They applauded the tired runners.',
    'I borrowed a book about volcanoes.',
    'She packed a lunchbox full of fruit.',
    'Our neighbour grows juicy watermelons.',
    'The farmer sold baskets of fresh eggs.',
    'We heard a rumble of thunder.',
    'I counted seventeen spotted ladybirds.',
    'She photographed a dazzling comet.',
    'We followed a trail of footprints.',
    'Cheeky monkeys snatched Ravi\'s sandwich.',
    'She solved the tricky puzzle.',
    'They admired a glowing rainbow.',
    'I tasted a spoonful of honey.',
    'We lit tiny clay lamps.',
    'He carried a pile of books.',
  ]),
  ...od(3, [
    'Scientists discovered a species of glowing mushroom.',
    'The orchestra performed a symphony.',
    'Engineers designed an elegant bridge.',
    'Archaeologists uncovered a hoard of coins.',
    'The detective examined an envelope.',
    'Our grandparents remember a world without smartphones.',
    'She recited a poem about monsoons.',
    'The explorers crossed an icy desert.',
    'Volunteers planted an orchard of apple trees.',
    'The lighthouse warned sailors about hidden rocks.',
    'The historian translated an ancient manuscript.',
    'Her quiet courage amazed everyone.',
    'The committee approved an ambitious plan.',
    'Thousands of cranes visit the wetland.',
    'The novelist invented an underwater city.',
    'She explained the water cycle.',
    'The athletes ran a gruelling marathon.',
    'The museum displays an enormous skeleton.',
    'Farmers welcomed the long-awaited rain.',
    'The judges praised an unusual sculpture.',
    'They mended a tangled fishing net.',
    'The violinist played an exquisite melody.',
    'Pilgrims climbed a steep mountain path.',
    'Forest rangers protect endangered rhinos.',
  ]),
];

// ── Sentence combining (type to combine) ───────────────────────────────────────────────────
// `use` names the joining word or move the child is asked for; `accept` lists every reasonable
// correct answer (the app normalises case, spaces and the final full stop).
const cb = (band, list) => list.map(([a, b, use, accept]) => ({ a, b, use, accept, band }));

export const COMBINE = [
  ...cb(1, [
    ['The kite was red.', 'The kite flew high.', 'adjective', [
      'The red kite flew high.', 'The kite was red and flew high.', 'The kite was red and it flew high.', 'The kite was red, and it flew high.']],
    ['The dog was small.', 'The dog barked.', 'adjective', [
      'The small dog barked.', 'The dog was small and barked.', 'The dog was small and it barked.', 'The dog was small, and it barked.']],
    ['We ate rice.', 'We ate dal.', 'and', [
      'We ate rice and dal.', 'We ate dal and rice.']],
    ['Sam has a dog.', 'Sam has a cat.', 'and', [
      'Sam has a dog and a cat.', 'Sam has a cat and a dog.']],
    ['The cat sat on the mat.', 'The cat purred.', 'and', [
      'The cat sat on the mat and purred.', 'The cat purred and sat on the mat.',
      'The cat sat on the mat and it purred.', 'The cat sat on the mat, and it purred.']],
    ['I like apples.', 'I do not like pears.', 'but', [
      'I like apples, but I do not like pears.', 'I like apples but I do not like pears.',
      'I like apples but not pears.', 'I like apples, but not pears.']],
    ['It was cold.', 'I wore my hat.', 'so', [
      'It was cold, so I wore my hat.', 'It was cold so I wore my hat.', 'I wore my hat because it was cold.']],
    ['The ball was blue.', 'The ball rolled away.', 'adjective', [
      'The blue ball rolled away.', 'The ball was blue and rolled away.', 'The ball was blue and it rolled away.', 'The ball was blue, and it rolled away.']],
    ['Mira sang.', 'Leo danced.', 'and', [
      'Mira sang and Leo danced.', 'Mira sang, and Leo danced.', 'Leo danced and Mira sang.', 'Leo danced, and Mira sang.']],
    ['The sun was hot.', 'We sat in the shade.', 'so', [
      'The sun was hot, so we sat in the shade.', 'The sun was hot so we sat in the shade.', 'We sat in the shade because the sun was hot.']],
    ['The frog was green.', 'The frog jumped into the pond.', 'adjective', [
      'The green frog jumped into the pond.', 'The frog was green and jumped into the pond.',
      'The frog was green and it jumped into the pond.', 'The frog was green, and it jumped into the pond.']],
  ]),
  ...cb(2, [
    ['The puppy was tiny.', 'The puppy was fluffy.', 'and', [
      'The puppy was tiny and fluffy.', 'The puppy was fluffy and tiny.', 'The tiny puppy was fluffy.', 'The fluffy puppy was tiny.']],
    ['We went to the beach.', 'It started to rain.', 'but', [
      'We went to the beach, but it started to rain.', 'We went to the beach but it started to rain.']],
    ['The shop was closed.', 'We went home.', 'so', [
      'The shop was closed, so we went home.', 'The shop was closed so we went home.', 'We went home because the shop was closed.']],
    ['Ravi plays cricket.', 'Ravi plays football.', 'and', [
      'Ravi plays cricket and football.', 'Ravi plays football and cricket.']],
    ['The owl hooted.', 'The owl was in the tree.', 'phrase', [
      'The owl in the tree hooted.', 'The owl hooted in the tree.', 'In the tree, the owl hooted.', 'In the tree the owl hooted.']],
    ['I stayed at home.', 'I was ill.', 'because', [
      'I stayed at home because I was ill.', 'Because I was ill, I stayed at home.', 'Because I was ill I stayed at home.']],
    ['The river was deep.', 'The river was cold.', 'and', [
      'The river was deep and cold.', 'The river was cold and deep.', 'The deep river was cold.', 'The cold river was deep.']],
    ['We can play chess.', 'We can read comics.', 'or', [
      'We can play chess or read comics.', 'We can read comics or play chess.',
      'We can play chess, or we can read comics.', 'We can play chess or we can read comics.']],
    ['The lamp was old.', 'The lamp hung by the door.', 'adjective', [
      'The old lamp hung by the door.', 'The lamp was old and hung by the door.',
      'The lamp was old and it hung by the door.', 'The lamp was old, and it hung by the door.']],
    ['Grandma baked a cake.', 'The cake was for my birthday.', 'phrase', [
      'Grandma baked a cake for my birthday.', 'For my birthday, Grandma baked a cake.', 'For my birthday Grandma baked a cake.',
      'Grandma baked a birthday cake for me.', 'Grandma baked me a cake for my birthday.']],
    ['The bell rang.', 'The children ran outside.', 'when', [
      'When the bell rang, the children ran outside.', 'When the bell rang the children ran outside.',
      'The children ran outside when the bell rang.']],
  ]),
  ...cb(3, [
    ['My aunt lives in Mumbai.', 'My aunt is a doctor.', 'who', [
      'My aunt, who lives in Mumbai, is a doctor.', 'My aunt, who is a doctor, lives in Mumbai.',
      'My aunt who lives in Mumbai is a doctor.', 'My aunt who is a doctor lives in Mumbai.']],
    ['The bridge is very old.', 'The bridge crosses the river.', 'which', [
      'The bridge, which crosses the river, is very old.', 'The bridge, which is very old, crosses the river.',
      'The bridge which crosses the river is very old.', 'The bridge that crosses the river is very old.']],
    ['The match was cancelled.', 'The pitch was flooded.', 'because', [
      'The match was cancelled because the pitch was flooded.', 'Because the pitch was flooded, the match was cancelled.',
      'Because the pitch was flooded the match was cancelled.']],
    ['The path was steep.', 'The hikers reached the top.', 'although', [
      'Although the path was steep, the hikers reached the top.', 'Although the path was steep the hikers reached the top.',
      'The hikers reached the top although the path was steep.', 'The hikers reached the top, although the path was steep.']],
    ['The boy scored the goal.', 'The boy is my cousin.', 'who', [
      'The boy who scored the goal is my cousin.', 'The boy who is my cousin scored the goal.',
      'My cousin is the boy who scored the goal.', 'The boy that scored the goal is my cousin.']],
    ['We will miss the train.', 'We must hurry.', 'unless', [
      'We will miss the train unless we hurry.', 'Unless we hurry, we will miss the train.', 'Unless we hurry we will miss the train.']],
    ['The comet appeared.', 'Everyone gasped.', 'when', [
      'When the comet appeared, everyone gasped.', 'When the comet appeared everyone gasped.', 'Everyone gasped when the comet appeared.']],
    ['Zara opened the door.', 'Zara saw a parcel.', 'participle', [
      'Opening the door, Zara saw a parcel.', 'Having opened the door, Zara saw a parcel.', 'On opening the door, Zara saw a parcel.',
      'When Zara opened the door, she saw a parcel.', 'Zara opened the door and saw a parcel.']],
    ['The leopard was hungry.', 'The leopard crept through the grass.', 'adjective', [
      'The hungry leopard crept through the grass.', 'The leopard was hungry and crept through the grass.',
      'The leopard was hungry, and it crept through the grass.', 'The leopard was hungry and it crept through the grass.']],
    ['The festival lasts five days.', 'The festival is called Diwali.', 'which', [
      'The festival, which is called Diwali, lasts five days.', 'The festival, which lasts five days, is called Diwali.',
      'The festival called Diwali lasts five days.', 'Diwali is a festival which lasts five days.', 'Diwali is a festival that lasts five days.']],
    ['We waited by the gate.', 'The bus arrived.', 'until', [
      'We waited by the gate until the bus arrived.', 'Until the bus arrived, we waited by the gate.', 'Until the bus arrived we waited by the gate.']],
    ['The castle stands on a hill.', 'The castle is made of red stone.', 'which', [
      'The castle, which stands on a hill, is made of red stone.', 'The castle, which is made of red stone, stands on a hill.',
      'The castle which stands on a hill is made of red stone.']],
  ]),
];
