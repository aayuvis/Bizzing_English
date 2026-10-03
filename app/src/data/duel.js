/* duel.js — Rhetoric Duel's plain versions. Each key is a RHETORIC line (data/language.js), exact
   from its held text; each value is a flattened version written FOR THIS GAME — the same sense with
   the device taken out. A plain version is never a quotation and is never attributed to anyone: the
   game labels it "a plainer version, written for this game". test/games.mjs checks every RHETORIC
   line has one, and that no plain version is a substring of any held text. */

export const PLAIN = {
  'we cannot dedicate. . .we cannot consecrate. . . we cannot hallow this ground': 'we are not really able to make this ground holy',
  'government of the people. . .by the people. . .for the people': 'government that the people run for themselves',
  'The world will little note, nor long remember, what we say here, but it can never forget what they did here.': 'People will probably not pay much attention to these speeches, though they will remember the soldiers.',
  'The brave men, living and dead': 'The brave soldiers who fought here',
  'Reading maketh a full man; conference a ready man; and writing an exact man.': 'Reading, talking and writing are each good for a person in their own way.',
  'STUDIES serve for delight, for ornament, and for ability.': 'Studying is useful for several different things.',
  'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested': 'Some books deserve more careful reading than others do',
  'Crafty men contemn studies, simple men admire them, and wise men use them': 'Different kinds of people feel differently about studying',
  'Prosperity is not without many fears and distastes; and adversity is not without comforts and hopes.': 'Good times have their worries too, and hard times have some good parts.',
  'if a man write little, he had need have a great memory; if he confer little, he had need have a present wit: and if he read little, he had need have much cunning': 'a person who does not do much writing, talking or reading will need other skills to make up for it',
  'You have seen how a man was made a slave; you shall see how a slave was made a man.': 'You have read about how I was enslaved, and now you will read about how I became free.',
  'Love looks not with the eyes, but with the mind': 'People in love do not really judge by appearances',
  'though she be but little, she is fierce.': 'she is small and she has a bad temper.',
  'The lunatic, the lover, and the poet': 'Some people with strong imaginations',
  "Shall I compare thee to a summer's day?": 'You remind me of summer.',
  'So long as men can breathe, or eyes can see, So long lives this, and this gives life to thee.': 'This poem will last for a very long time and will keep your memory alive.',
  'When to the sessions of sweet silent thought': 'When I sit and think quietly by myself',
  "And needy nothing trimm'd in jollity, And purest faith unhappily forsworn, And gilded honour shamefully misplac'd": 'Worthless people do well while good people are let down',
  'Doubting, dreaming dreams no mortals ever dared to dream before': 'Wondering and imagining strange things that nobody had imagined',
  'And the silken sad uncertain rustling of each purple curtain': 'And the quiet noise that the curtains made',
  'The fair breeze blew, the white foam flew, The furrow followed free': 'The wind was good and the ship moved quickly through the water',
  'Alone, alone, all, all alone, Alone on a wide wide sea!': 'I was by myself in the middle of the ocean.',
  'What immortal hand or eye Could frame thy fearful symmetry?': 'Someone very powerful must have made your frightening shape.',
  'I will live in the Past, the Present, and the Future.': 'I will remember what I have learned at all times.',
  'Are there no prisons?': 'Poor people can be sent to prison.',
  "what is the use of a book,' thought Alice 'without pictures or conversations?": 'Alice thought that a book with no pictures or talking in it was dull.',
  'Where the mind is without fear and the head is held high; Where knowledge is free;': 'In a country where people are brave and can learn freely',
  'If you can dream--and not make dreams your master; If you can think--and not make thoughts your aim,': 'If you have dreams and ideas but stay practical about them,',
  'The splendour falls on castle walls And snowy summits old in story': 'The sunset lights up the castle and the mountains',
  'Of shoes--and ships--and sealing-wax-- Of cabbages--and kings--': 'About all sorts of different things',
  'I was benevolent and good; misery made me a fiend.': 'I used to be kind, until being unhappy changed me for the worse.',
  'jam to-morrow and jam yesterday--but never jam to-day.': 'you can have jam on some days, just not this one.',
};

/* What each device does, in a child's words — shown with the reasons and in the explanation. */
export const DEVICE_GLOSS = {
  anaphora: 'the same words begin each part',
  tricolon: 'a group of three, built alike',
  antithesis: 'opposites set side by side in matching shapes',
  'rhetorical question': 'a question asked for effect, not for an answer',
  alliteration: 'words close together start with the same sound',
  simile: 'compares two things using “like” or “as”',
  personification: 'gives a thing a person’s actions or feelings',
};
