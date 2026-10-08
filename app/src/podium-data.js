/* podium-data.js — The Podium's speech topics and the lines a younger speaker chooses from (HANDOVER C §2.2.2).

   Written FOR THIS GAME, never quoted, never attributed: a child at Level 1–2 builds a speech by choosing one
   of three offered lines for each card (Hook · Point 1 · Point 2 · Point 3 · Close); from Level 3 they may
   type their own. Each offered line carries one or two VERSIONS with a device worked in — the four devices of
   Writer's Craft a speech uses most (a question, a rule of three, repetition, a contrast) — which a child
   drags onto the card and picks from. test/podium.mjs holds every line to its claims: a plain line shows no
   device, each version shows its device (by podium.js devicesIn, the same structural check the planner uses),
   every hook and every close share the topic's word (so a chosen plan can echo its hook), nothing fails the
   kid-safe filter.

   Kept here: the topics (by level), the cups (one per level), the host's lines, and how Felix's model speech
   (Inkwell Detective, case 7 — a Bizzing mystery) splits into three points. */

const L = (t, v = {}) => ({ t, v });

export const TOPICS = [
  /* ---- Level 1 ---- */
  { id: 'pets', level: 1, title: 'The best pet', key: 'pet',
    hooks: [
      L('Let me tell you about the best pet in the world.', { question: 'What is the best pet in the world?', three: 'A pet is a friend, a helper, and a clown.' }),
      L('Every family should think about having a pet.', { question: 'Should every family have a pet?', contrast: 'A pet is not a toy but a friend for life.' }),
      L('My favourite pet is a dog.', { question: 'Can you guess my favourite pet?', repeat: 'My pet is my friend. My pet is my alarm clock.' }),
    ],
    points: [
      L('A dog will play with you all day.', { three: 'A dog will run, jump, and play with you all day.', contrast: 'A dog does not get bored but plays all day.' }),
      L('A cat is soft and calm to stroke.', { question: 'Is anything softer than a cat?', three: 'A cat is soft, warm, and calm to stroke.' }),
      L('Looking after a pet teaches you to be kind.', { repeat: 'A pet teaches you to be kind. A pet teaches you to be patient.', contrast: 'A pet needs care but gives back love.' }),
      L('A pet is always happy to see you.', { question: 'Who is always happy to see you?', repeat: 'A pet is happy in the morning. A pet is happy at night.' }),
      L('Fish are quiet pets for a small home.', { contrast: 'Fish are not noisy but quiet and calm.', three: 'Fish are quiet, pretty, and easy to keep.' }),
      L('A pet helps you feel less lonely.', { question: 'Who feels lonely with a pet beside them?', contrast: 'A house without a pet is quiet but a house with one is full of life.' }),
    ],
    closes: [
      L('So think about the best pet for you.', { question: 'So which pet will you choose?', repeat: 'Choose a pet. Choose a friend.' }),
      L('That is why a pet is the best friend of all.', { three: 'A pet is a friend, a teacher, and a joy.', contrast: 'A pet is not just an animal but the best friend of all.' }),
      L('Thank you for listening and please give a pet a home.', { question: 'Will you give a pet a home?', repeat: 'Give a pet a home. Give a pet a chance.' }),
    ] },
  { id: 'outside', level: 1, title: 'Why we should play outside', key: 'outside',
    hooks: [
      L('I want to talk about playing outside.', { question: 'When did you last play outside?', three: 'Outside there is sun, wind, and room to run.' }),
      L('The best games happen outside.', { question: 'Where do the best games happen? Outside!', repeat: 'Outside you can run. Outside you can shout.' }),
      L('Every child needs time outside.', { contrast: 'Every child needs time outside rather than only time on a screen.', question: 'Does every child get time outside?' }),
    ],
    points: [
      L('Running about makes your body strong.', { three: 'Running, climbing, and jumping make your body strong.', question: 'Do you want to be strong?' }),
      L('Fresh air helps you think clearly.', { contrast: 'Stale air makes you sleepy but fresh air wakes you up.', repeat: 'Fresh air wakes you up. Fresh air clears your head.' }),
      L('You can see birds and bugs and trees.', { three: 'You can see birds, bugs, and tall green trees.', question: 'Have you ever watched a beetle for a whole minute?' }),
      L('Playing with friends is more fun in the park.', { contrast: 'Indoors is small but the park is huge.', repeat: 'In the park we race. In the park we laugh.' }),
      L('Muddy knees are the sign of a good day.', { question: 'Is there anything better than muddy knees?', contrast: 'Clean knees are fine but muddy knees mean a good day.' }),
      L('Sunshine makes most people feel happy.', { three: 'Sunshine makes you warm, bright, and happy.', question: 'Who does not smile in the sunshine?' }),
    ],
    closes: [
      L('So go and play outside today.', { repeat: 'Go outside. Go outside today.', question: 'So will you play outside today?' }),
      L('That is why I love being outside.', { three: 'Outside is fun, fresh, and free.', contrast: 'Inside is nice but outside is where I love to be.' }),
      L('Put on your shoes and head outside.', { question: 'Where are your shoes? Head outside!', repeat: 'Put on your shoes. Put on your coat. Head outside.' }),
    ] },
  /* ---- Level 2 ---- */
  { id: 'swim', level: 2, title: 'Everyone should learn to swim', key: 'swim',
    hooks: [
      L('I believe everyone should learn to swim.', { question: 'Can you swim?', contrast: 'Swimming is not just a sport but a skill that keeps you safe.' }),
      L('Learning to swim was the bravest thing I ever did.', { repeat: 'I was scared to swim. I was scared of the deep end.', question: 'What is the bravest thing you have done? For me it was learning to swim.' }),
      L('Water covers most of our planet so we should all swim.', { three: 'Rivers, lakes, and seas are everywhere so we should all swim.', question: 'Did you know water covers most of our planet? We should all swim.' }),
    ],
    points: [
      L('Swimming keeps you safe near water.', { repeat: 'Swimming keeps you safe at the beach. Swimming keeps you safe by the river.', question: 'Would you feel safe if you fell in a lake?' }),
      L('Swimming is good exercise for the whole body.', { three: 'Swimming works your arms, legs, and heart.', contrast: 'Some sports use only your legs but swimming uses everything.' }),
      L('You can swim at any age.', { contrast: 'Some sports are for the young while swimming is for everyone.', three: 'Babies, children, and grandparents can all swim.' }),
      L('Pools are a fun place to meet friends.', { question: 'Where is the best place to splash with friends?', repeat: 'At the pool we splash. At the pool we race.' }),
      L('Swimming makes you feel calm afterwards.', { contrast: 'You may jump in tired but you climb out calm.', three: 'After a swim you feel calm, clean, and sleepy.' }),
      L('Once you learn you never forget.', { repeat: 'Learn it once. Learn it for life.', question: 'What else stays with you for life?' }),
    ],
    closes: [
      L('So please learn to swim if you can.', { question: 'So will you learn to swim?', repeat: 'Learn to swim. Learn to be safe.' }),
      L('Swimming is a gift you keep for life.', { contrast: 'A toy breaks but the gift of swimming lasts for life.', three: 'Swimming is safe, healthy, and fun.' }),
      L('See you at the pool for a swim.', { question: 'Who will join me at the pool for a swim?', repeat: 'See you at the pool. See you for a swim.' }),
    ] },
  { id: 'saturday', level: 2, title: 'The best day of the week', key: 'saturday',
    hooks: [
      L('I think Saturday is the best day of the week.', { question: 'Which day is the best? I say Saturday.', contrast: 'Monday is busy but Saturday is mine.' }),
      L('Let me tell you why I love Saturday.', { repeat: 'I love Saturday mornings. I love Saturday nights.', three: 'Saturday means sleep, sun, and games.' }),
      L('Everybody waits all week for Saturday.', { question: 'What do we all wait for? Saturday!', three: 'We work, we wait, and then comes Saturday.' }),
    ],
    points: [
      L('There is no school so you can rest.', { contrast: 'Weekdays are for school while Saturday is for rest.', question: 'Who does not like a lie-in?' }),
      L('Families have time to do things together.', { three: 'Families can cook, walk, and play together.', repeat: 'We eat together. We talk together.' }),
      L('You can try a new hobby.', { question: 'Have you ever wanted to try painting?', three: 'You can paint, build, or bake.' }),
      L('Saturday markets are full of good food.', { three: 'Markets have bread, fruit, and cheese.', repeat: 'There is bread to smell. There is fruit to taste.' }),
      L('Sport matches often happen at the weekend.', { question: 'Who is playing football this weekend?', contrast: 'On Friday we practise but on Saturday we play.' }),
      L('You can stay up a little later.', { contrast: 'On school nights we sleep early but on Saturday we stay up.', repeat: 'One more story. One more game.' }),
    ],
    closes: [
      L('That is why Saturday is the best day.', { question: 'So which day is the best? Saturday!', three: 'Saturday is restful, busy, and fun.' }),
      L('Enjoy your next Saturday.', { repeat: 'Rest on Saturday. Play on Saturday.', contrast: 'Do not waste your Saturday but enjoy every minute.' }),
      L('I cannot wait until Saturday comes again.', { question: 'How many days until Saturday?', repeat: 'Saturday is coming. Saturday is nearly here.' }),
    ] },
  /* ---- Level 3 ---- */
  { id: 'garden', level: 3, title: 'Every school should have a garden', key: 'garden',
    hooks: [
      L('Imagine a school with a garden full of vegetables.', { question: 'What would you grow in a school garden?', three: 'Picture a garden of beans, bees, and sunflowers.' }),
      L('I believe every school should have a garden.', { contrast: 'A school garden is not a luxury but a classroom.', question: 'Why does every school not have a garden?' }),
      L('Our playground could become a garden.', { repeat: 'Our playground is grey. Our playground could be a green garden.', question: 'What if our playground became a garden?' }),
    ],
    points: [
      L('Children learn where food comes from.', { question: 'Where does a carrot come from?', contrast: 'Food does not come from a shop but from the soil.' }),
      L('Gardening teaches patience.', { contrast: 'A screen is quick while a seed takes weeks.', repeat: 'You plant. You water. You wait.' }),
      L('A garden brings birds and bees back to town.', { three: 'A garden brings birds, bees, and butterflies.', question: 'Where else will the bees go?' }),
      L('Working outdoors is good for our minds.', { three: 'Digging is calming, cheerful, and good for our minds.', repeat: 'Fresh air helps. Green plants help.' }),
      L('Pupils can cook what they grow.', { three: 'We could grow, pick, and cook our own lunch.', question: 'What tastes better than a tomato you grew?' }),
      L('Everyone can help in a garden.', { contrast: 'Not everyone can win a race but everyone can pull a weed.', repeat: 'Every hand can dig. Every hand can plant.' }),
    ],
    closes: [
      L('So let us plant a school garden this spring.', { question: 'Who will help plant our garden?', repeat: 'Let us dig. Let us plant. Let us grow a garden.' }),
      L('A garden would make our school greener and kinder.', { three: 'A garden would make our school greener, calmer, and kinder.', contrast: 'Concrete stays grey while a garden grows.' }),
      L('Give every school a garden and watch it grow.', { repeat: 'Give us seeds. Give us soil. Give us a garden.', question: 'Will you give our school a garden?' }),
    ] },
  { id: 'books', level: 3, title: 'Books are better than films', key: 'book',
    hooks: [
      L('I think a book is better than a film.', { question: 'Have you ever finished a book and found the film too short?', contrast: 'A film shows you a story while a book lets you build it.' }),
      L('A good book is a world in your hands.', { three: 'A good book is a door, a ship, and a world in your hands.', question: 'What fits a whole world in your hands? A book.' }),
      L('Every great film started as a book.', { question: 'Did you know so many films started as a book?', repeat: 'The book comes first. The book is always first.' }),
    ],
    points: [
      L('You picture the characters yourself.', { contrast: 'A film chooses the faces while a reader dreams them.', question: 'What does your dragon look like?' }),
      L('A story on paper has more detail.', { three: 'Pages give thoughts, feelings, and secrets.', contrast: 'A film has two hours while pages have all the time they need.' }),
      L('Reading grows your vocabulary.', { repeat: 'Every page has new words. Every page has new worlds.', question: 'Where did you learn your best words?' }),
      L('You can read anywhere at any time.', { three: 'You can read on a bus, in bed, or under a tree.', contrast: 'A film needs a screen while a story needs only you.' }),
      L('Reading slowly lets you think.', { question: 'Can you pause a cinema to think?', repeat: 'Read a little. Think a little.' }),
      L('Stories on paper last for centuries.', { three: 'Old stories are read by parents, children, and grandchildren.', contrast: 'Screens change every year while stories last for centuries.' }),
    ],
    closes: [
      L('So next time pick up the book first.', { repeat: 'Read the book. Read it before the film.', question: 'So will you read the book first?' }),
      L('That is why I will always choose a book.', { contrast: 'Films are fun but a book is forever.', three: 'A book is deeper, longer, and all mine.' }),
      L('Open a book tonight and see the film in your head.', { question: 'What film will your book play tonight?', repeat: 'Open a book. Open your mind.' }),
    ] },
  /* ---- Level 4 ---- */
  { id: 'friend', level: 4, title: 'What makes a good friend', key: 'friend',
    hooks: [
      L('Everyone needs a good friend.', { question: 'What makes a good friend?', contrast: 'Anyone can be popular while only a few can be a good friend.' }),
      L('My best friend once shared her last biscuit with me.', { repeat: 'She saw I was sad. She saw I was hungry. She was my friend.', question: 'Has a friend ever shared their last biscuit with you?' }),
      L('A good friend is worth more than gold.', { three: 'A good friend is worth more than gold, silver, and jewels.', contrast: 'Gold sits in a box while a friend sits beside you.' }),
    ],
    points: [
      L('A good friend listens to you.', { contrast: 'A bad listener waits to talk while a good one waits to understand.', question: 'When did someone last really listen to you?' }),
      L('A good friend tells the truth kindly.', { repeat: 'A friend tells the truth. A friend tells it gently.', contrast: 'A flatterer says nice things while a friend says true things.' }),
      L('A good friend sticks with you in hard times.', { three: 'A friend stays when you lose, when you fall, and when you cry.', question: 'Who stayed with you on your worst day?' }),
      L('Friends make each other laugh.', { repeat: 'We laugh at jokes. We laugh at nothing.', three: 'Friends giggle, snort, and roar together.' }),
      L('A good friend is happy when you do well.', { contrast: 'A rival is jealous while a friend cheers.', question: 'Who cheers loudest when you win?' }),
      L('Being a friend means keeping promises.', { repeat: 'A promise made. A promise kept.', three: 'Friends keep promises, secrets, and their word.' }),
    ],
    closes: [
      L('So try to be the friend you would like to have.', { repeat: 'Be kind. Be honest. Be the friend you want.', question: 'So are you the friend you would like to have?' }),
      L('A good friend makes every day brighter.', { three: 'A good friend makes every day brighter, warmer, and funnier.', contrast: 'A day alone can be grey while a day with a friend is bright.' }),
      L('Go and thank a friend today.', { question: 'Who will you thank today, friend?', repeat: 'Thank a friend. Tell a friend. Treasure a friend.' }),
    ] },
  { id: 'early', level: 4, title: 'Is it better to be early or late?', key: 'early',
    hooks: [
      L('I am here to argue that early is always better.', { question: 'Is it better to be early or late?', contrast: 'Late is a rush while early is a rest.' }),
      L('Being early has saved me more than once.', { repeat: 'Early saved my seat. Early saved my day.', question: 'Has being early ever saved you?' }),
      L('The early bird catches the worm.', { question: 'Have you heard that the early bird catches the worm?', three: 'The early bird gets the worm, the sun, and the best branch.' }),
    ],
    points: [
      L('Arriving early means you are calm.', { contrast: 'The late person arrives flustered while the early person arrives calm.', three: 'Early means calm, ready, and relaxed.' }),
      L('People trust someone who is on time.', { question: 'Would you trust a pilot who was always late?', repeat: 'Be on time and people trust you. Be on time and people rely on you.' }),
      L('You get the best seat when you come early.', { three: 'Early birds get the best seat, the best view, and the best snacks.', question: 'Who wants a seat behind a pillar?' }),
      L('Being late wastes other people’s time.', { contrast: 'Your minutes matter yet so do everyone else’s.', repeat: 'They wait. They wait. They wait for you.' }),
      L('An early start gives you time to fix mistakes.', { question: 'What if you forgot your homework at the door?', three: 'Early leaves time to check, to fix, and to breathe.' }),
      L('Morning is the quietest time to think.', { repeat: 'Quiet streets. Quiet rooms. Quiet minds.', contrast: 'Afternoons are noisy but mornings are still.' }),
    ],
    closes: [
      L('So set your alarm and be early tomorrow.', { repeat: 'Get up early. Get there early. Be ready.', question: 'So will you be early tomorrow?' }),
      L('Being early is a habit worth having.', { contrast: 'Early is not just a time but a habit.', three: 'Early is calm, kind, and clever.' }),
      L('Be the early bird and enjoy the worm.', { contrast: 'The late bird gets the crumbs while the early bird gets the worm.', repeat: 'Be early. Be ready. Be the early bird.' }),
    ] },
  /* ---- Level 5 ---- */
  { id: 'failure', level: 5, title: 'Failure is a good teacher', key: 'fail',
    hooks: [
      L('Every great inventor has failed many times.', { question: 'How many times did inventors fail before the first light bulb worked?', repeat: 'They failed once. They failed again. They failed their way forward.' }),
      L('I want to defend failure today.', { contrast: 'Failure is not the opposite of success but part of it.', question: 'What if failing is the best thing that can happen to you?' }),
      L('My first cake was a failure and that is why I bake so well today.', { three: 'My first cake was flat, burnt, and wonderful to fail at.', question: 'Have you ever failed at something you now do well?' }),
    ],
    points: [
      L('Mistakes show us exactly what to fix.', { question: 'How can you fix something if you never see it break?', repeat: 'A mistake points. A mistake explains. A mistake teaches.' }),
      L('Failing builds courage for the next try.', { contrast: 'Fear keeps you still while failing moves you on.', three: 'Each fall makes you braver, tougher, and wiser.' }),
      L('People who never fail never try anything hard.', { contrast: 'Easy tasks never fail but they never teach.', question: 'Who learns more, the one who never tries or the one who falls?' }),
      L('Scientists learn as much from failed tests as from good ones.', { three: 'Scientists test, fail, and test again.', repeat: 'Test it. Fail it. Test it again.' }),
      L('Failing teaches us to be kind to others who struggle.', { question: 'Who understands a struggling friend better than someone who has struggled?', contrast: 'Success can make us proud while failure makes us kind.' }),
      L('The best stories are about getting up again.', { three: 'Heroes fall, rise, and try again.', repeat: 'They fell down. They got up. They went on.' }),
    ],
    closes: [
      L('So learn from every failure.', { repeat: 'Fail. Learn. Fail better.', question: 'So what will you dare to fail at next?' }),
      L('Failure is the teacher who never gives up on you.', { three: 'Failure is patient, honest, and always there to teach.', contrast: 'Success pats you on the back while failure shows you the way.' }),
      L('Go out and fail well.', { repeat: 'Fail bravely. Fail often. Fail well.', question: 'Will you go out and fail well?' }),
    ] },
  { id: 'rules', level: 5, title: 'Children should help make school rules', key: 'rules',
    hooks: [
      L('Rules work best when the people who follow them help to write them.', { question: 'Who should write the rules?', contrast: 'Rules handed down are obeyed while rules made together are believed.' }),
      L('I believe children should help make school rules.', { repeat: 'We follow the rules. We know the rules. We should help make the rules.', question: 'Should children help make school rules?' }),
      L('Imagine a school where pupils help shape the rules.', { three: 'Imagine pupils who listen, suggest, and vote on rules.', question: 'What would change if pupils helped shape the rules?' }),
    ],
    points: [
      L('Children understand what happens in the playground.', { question: 'Who knows the playground better than the people who play in it?', contrast: 'Adults see the playground from the window while children see it from inside.' }),
      L('People keep rules they helped to make.', { repeat: 'If you make it you keep it. If you choose it you defend it.', three: 'A rule you help make is clearer, fairer, and easier to keep.' }),
      L('Making rules teaches how democracy works.', { three: 'We would learn to argue, listen, and vote.', question: 'Where better to learn democracy than at school?' }),
      L('Pupils notice when a rule is unfair.', { contrast: 'A rule may look fair on paper but feel unfair in the corridor.', repeat: 'We see it. We feel it. We can name it.' }),
      L('Teachers and pupils would understand each other better.', { three: 'Talking builds trust, respect, and understanding.', question: 'What if teachers heard our reasons and we heard theirs?' }),
      L('A school council can share ideas from every class.', { repeat: 'Every class has a voice. Every voice is heard.', contrast: 'One person sees one corner while a council sees the whole school.' }),
    ],
    closes: [
      L('So let us make the rules together.', { repeat: 'Let us talk. Let us listen. Let us make the rules together.', question: 'So shall we make the rules together?' }),
      L('Good rules are made with people and not just for them.', { three: 'Good rules are fair, clear, and made together.', question: 'Why not make the rules with us?' }),
      L('Give pupils a voice and the rules will grow stronger.', { contrast: 'Silence makes rules brittle while voices make them strong.', repeat: 'Give us a voice. Give us a vote. Give us the rules to share.' }),
    ] },
];

/* One cup per level: a tournament's name says how hard it is */
export const CUPS = { 1: 'The Acorn Cup', 2: 'The Lantern Cup', 3: 'The Quill Shield', 4: 'The Oak Lectern', 5: 'The Grand Podium' };

/* Quill, the host, opens each round (spoken by nobody but the page) */
export const HOST = {
  lobby: 'Welcome to the Podium. Four rounds, five rivals, one stage. I am Quill, and I will be your host.',
  poem: 'Round one: a poem. Let the line ends breathe.',
  passage: 'Round two: a passage from a classic. Tell it like a story.',
  prepared: 'Round three: your own speech. The green room is yours — plan it, rehearse it once, then take the stage.',
  final: 'The Final. A topic you have not seen. Sixty seconds to plan, sixty to speak.',
};

/* Felix's reveal speech (Inkwell Detective, case 7) runs Hook → three points → Close. Its points start at
   these lines; anything else falls back to thirds. */
export const FELIX_SPLIT = ['In her log', 'This afternoon', 'Mr Hale wrote'];
