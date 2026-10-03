/* word-stops.js — the Word strand's WRITTEN stops: levels 6, 8, 9 and 10 (level 7 lives elsewhere).

   Levels 1–5 are generated from Bizzing Bee's lexicon (items.js). These levels need judgement a
   generator cannot make — which words share a root, which word is formal, which word is stronger —
   so they are written, in exactly the shape of LANG_STOPS (data/language.js), and run through the
   same engine (items.js kind `authored`), so test/items.mjs holds them to the same rules.

   Rules this file keeps (CLAUDE.md):
   - A root or an origin comes from Bizzing Bee's pinned word list (its etymology field), cited
     "Bizzing Bee word list: <word>". A word's family is never guessed: a "does not belong" word is
     one whose history plainly has nothing to do with the root (chrome is Greek khroma, colour;
     district is from distringere, not dicere; speedometer is Old English sped, not pes).
   - Register and shades of meaning offer ONE defensible answer: the wrong options are plainly on the
     other side (slang against a formal word; a mild word against a far stronger one).
   - Every quotation is an exact substring of a held, cleared text (test/words.mjs).
   - Bee owns spelling competition (CLAUDE.md rule 10). Level 10 readies a child for the Bee by
     depth — meaning, origin, roots, homophones — and sends them to Bizzing Bee to compete. Nothing
     here asks a child to spell a word or races them against anyone.
   - Every item: one right answer, three wrong, the answer not in the question (unless every option
     is in the quoted line), the right answer not the longest by more than 40%.

   Bands: 2 = ages 8–10, 3 = ages 11–14. */

const BEE = (...words) => words.map((w) => `Bizzing Bee word list: ${w}`);
const mc = (q, right, wrong, extra = {}) => ({ q, right, wrong, ...extra });

export const WORD_STOPS = [
  // ── Level 6 · More roots and their families ──
  {
    id: 'w6-families', level: 6, band: 2, needsReview: true,
    title: 'Root families', iCan: 'I can group words by the root they share.',
    story: 'Quill the fox is sorting word cards into families: telescope, microscope and periscope all go in one pile. "Same root, same family," says Quill — "but watch out for the cards that only look alike."',
    learn: {
      why: 'Many English words are built on an old Greek or Latin root. Words that share the root share a piece of meaning: "scope" comes from Greek skopein, to look, so a telescope looks far and a microscope looks at small things. But a word can have the same letters by chance — escape has nothing to do with looking. Check the meaning, not just the spelling. Bizzing Bee\'s word list gives each word\'s roots.',
      example: ['scope = look → telescope, microscope, periscope', 'graph = write → autograph, biography', 'chron = time → chronicle, chronology'],
    },
    sources: BEE('telescope', 'microscope', 'periscope', 'autograph', 'biography', 'chronicle', 'chronology'),
    items: [
      mc("Which word does NOT belong to the 'graph' family (graph = write)?", 'grapefruit', ['autograph', 'paragraph', 'biography'], { sources: BEE('autograph', 'paragraph', 'biography') }),
      mc("Which word does NOT belong to the 'chron' family (chron = time)?", 'chrome', ['chronicle', 'chronology', 'chronological'], { sources: BEE('chronicle', 'chronology', 'chronological') }),
      mc("Which word does NOT belong to the 'scope' family (scope = look)?", 'escape', ['telescope', 'microscope', 'periscope'], { sources: BEE('telescope', 'microscope', 'periscope') }),
      mc("Which word does NOT belong to the 'dict' family (dict = say)?", 'district', ['dictionary', 'contradict', 'benediction'], { sources: BEE('dictionary', 'contradict', 'benediction') }),
      mc("Which word does NOT belong to the 'struct' family (struct = build)?", 'strict', ['structure', 'destruction', 'superstructure'], { sources: BEE('destruction', 'superstructure') }),
      mc("Which word does NOT belong to the 'phon' family (phon = sound)?", 'phantom', ['telephone', 'symphony', 'microphone'], { sources: BEE('telephone', 'symphony', 'microphone') }),
      mc("Telephone, symphony, microphone: what does their shared root 'phon' mean?", 'sound', ['light', 'far', 'life'], { sources: BEE('telephone', 'symphony', 'microphone') }),
      mc("Biology, biography, antibiotic: what does their shared root 'bio' mean?", 'life', ['book', 'two', 'water'], { sources: BEE('biology', 'biography', 'antibiotic') }),
      mc("Chronicle, chronology, chronometer: what does their shared root 'chron' mean?", 'time', ['colour', 'sound', 'story'], { sources: BEE('chronicle', 'chronology', 'chronometer') }),
      mc("Telegraph, television, telescope: what does their shared root 'tele' mean?", 'far', ['small', 'loud', 'near'], { sources: BEE('telegraph', 'television', 'telescope') }),
      mc("Pedestrian, centipede, pedicure: what does their shared root 'ped' mean?", 'foot', ['hand', 'child', 'head'], { sources: BEE('pedestrian', 'centipede', 'pedicure') }),
      mc("Audience, auditorium, inaudible: what does their shared root 'aud' mean?", 'hear', ['see', 'speak', 'sit'], { sources: BEE('audience', 'auditorium', 'inaudible') }),
      mc("Manuscript, manicure, manufacture: what does their shared root 'manu' mean?", 'hand', ['man', 'foot', 'many'], { sources: BEE('manuscript', 'manicure', 'manufacture') }),
      mc("Which word belongs to the 'spect' family (spect = look)?", 'spectator', ['speckled', 'spaghetti', 'spinach'], { sources: BEE('spectator') }),
    ],
  },
  {
    id: 'w6-build', level: 6, band: 3, needsReview: true,
    title: 'Build from roots', iCan: 'I can put roots together to make and explain a long word.',
    story: 'Quill has two root cards in each paw: "far" and "look". "Put them together," says Quill, "and you get a word for the thing on my windowsill that shows me the moon."',
    learn: {
      why: 'Long words are often two or three roots joined. Learn the roots and you can take a new word apart — or build one. A stethoscope is stethos (chest) + skopein (to look); a philanthropist is philos (loving) + anthropos (human). Bizzing Bee\'s word list gives the roots of every word here.',
      example: ['therm (heat) + meter (measure) = thermometer', 'auto (self) + bio (life) + graph (write) = autobiography', 'a (without) + morph (form) = amorphous'],
    },
    sources: BEE('telescope', 'stethoscope', 'philanthropist', 'thermometer', 'autobiography', 'amorphous'),
    items: [
      mc("Which word is built from the roots for 'far' and 'look'?", 'telescope', ['microscope', 'periscope', 'telephone'], { sources: BEE('telescope', 'microscope', 'periscope', 'telephone') }),
      mc("Which word is built from the roots for 'self', 'life' and 'write'?", 'autobiography', ['biography', 'photography', 'autograph'], { sources: BEE('autobiography', 'biography', 'photography', 'autograph') }),
      mc("Which word is built from the roots for 'heat' and 'measure'?", 'thermometer', ['barometer', 'speedometer', 'chronometer'], { sources: BEE('thermometer', 'barometer', 'speedometer', 'chronometer') }),
      mc("Which word is built from the roots for 'hand' and 'care'?", 'manicure', ['pedicure', 'manuscript', 'manufacture'], { sources: BEE('manicure', 'pedicure', 'manuscript', 'manufacture') }),
      mc("Which word is built from the roots for 'foot' and 'measure'?", 'pedometer', ['odometer', 'pedicure', 'thermometer'], { sources: BEE('pedometer', 'odometer', 'pedicure', 'thermometer') }),
      mc("Which word is built from the roots for 'loving' and 'human'?", 'philanthropist', ['misanthrope', 'philharmonic', 'anthropomorphic'], { sources: BEE('philanthropist', 'misanthrope', 'philharmonic', 'anthropomorphic') }),
      mc("Which word is built from the roots for 'without' and 'form'?", 'amorphous', ['metamorphosis', 'polymorphous', 'anthropomorphic'], { sources: BEE('amorphous', 'metamorphosis', 'polymorphous', 'anthropomorphic') }),
      mc("Which word is built from the roots for 'chest' and 'look'?", 'stethoscope', ['periscope', 'kaleidoscope', 'telescope'], { sources: BEE('stethoscope', 'periscope', 'kaleidoscope', 'telescope') }),
      mc("Which word is built from the roots for 'around' and 'look'?", 'periscope', ['microscope', 'telescope', 'stethoscope'], { sources: BEE('periscope', 'microscope', 'telescope', 'stethoscope') }),
      mc("An odometer is built from Greek hodos (road) and metron (measure). So it measures…", 'distance travelled', ['height above the sea', 'air pressure outside', 'how hot an engine is'], { sources: BEE('odometer') }),
      mc("Which word does NOT belong to the 'ped' family (ped = foot)?", 'speedometer', ['pedestrian', 'centipede', 'pedicure'], { sources: BEE('speedometer', 'pedestrian', 'centipede', 'pedicure') }),
      mc("Loquacious, eloquent, colloquial: what does their shared root 'loqu' mean?", 'speak', ['write', 'hear', 'think'], { sources: BEE('loquacious', 'eloquent', 'colloquial') }),
      mc("Benefit, benevolent, benediction: what does their shared root 'bene' mean?", 'well', ['badly', 'twice', 'under'], { sources: BEE('benefit', 'benevolent', 'benediction') }),
      mc("Malicious, malnourished: what does their shared root 'mal' mean?", 'bad', ['good', 'many', 'under'], { sources: BEE('malicious', 'malnourished') }),
    ],
  },

  // ── Level 8 · Register ──
  {
    id: 'w8-formal', level: 8, band: 2, needsReview: false,
    title: 'The formal word', iCan: 'I can swap an everyday word for a formal one.',
    story: 'Quill is writing to the town library to ask for a new shelf of fox stories. "I can\'t say I\'m gutted there aren\'t any," Quill mutters, crossing it out. "This letter needs its best-clothes words."',
    learn: {
      why: 'Many everyday words have a formal partner with the same meaning. In a letter to someone you do not know, a report or a notice, the formal word sounds respectful and clear: "inform" for "tell", "error" for "mistake". With friends, the everyday word is the right one. Register is choosing on purpose.',
      example: ['tell → inform', 'mistake → error', 'about (roughly) → approximately'],
    },
    sources: BEE('inform', 'error', 'approximately', 'mother', 'conclude', 'receive', 'attempt', 'provide', 'numerous', 'extremely'),
    items: [
      mc("Which word is the formal way to say 'tell'?", 'inform', ['give a shout', 'fill in', 'ping']),
      mc("Which word is the formal way to say 'mistake'?", 'error', ['slip-up', 'goof', 'boo-boo']),
      mc("Which word is the formal way to say 'about' (as in 'about ten people')?", 'approximately', ['ten-ish', 'give or take', 'round about']),
      mc("Which word is the formal way to say 'mum'?", 'mother', ['mummy', 'mam', 'ma']),
      mc("Which word is the formal way to say 'end' (a meeting)?", 'conclude', ['wrap up', 'call it a day', 'pack in']),
      mc("Which word is the formal way to say 'try'?", 'attempt', ['have a go', 'give it a whirl', 'take a stab']),
      mc("Which word is the formal way to say 'give' (the school will ___ lunch)?", 'provide', ['chuck in', 'sort out', 'dish out']),
      mc("Which word is the formal way to say 'lots of' (___ visitors came)?", 'numerous', ['loads of', 'tons of', 'heaps of']),
      mc("Which word is the formal way to say 'really' (it was ___ cold)?", 'extremely', ['seriously', 'totally', 'dead']),
      mc("A formal letter says: 'I hope to ___ a reply soon.' Which word fits best?", 'receive', ['grab', 'snag', 'get hold of']),
      mc('Which word belongs in a chat with a friend, not in a formal letter?', 'gutted', ['disappointed', 'saddened', 'regretful']),
      mc('Which word belongs in a chat with a friend, not in a formal letter?', 'mate', ['friend', 'companion', 'colleague']),
      mc("A notice in the school hall says: 'Pupils must not ___ the stage.' Which word fits best?", 'enter', ['hop onto', 'barge onto', 'mess about on']),
      mc("Which word is the formal way to say 'show' (the chart will ___ the results)?", 'demonstrate', ['flash up', 'chuck up', 'splash about'], { sources: BEE('demonstrate') }),
    ],
  },
  {
    id: 'w8-purpose', level: 8, band: 3, needsReview: true,
    title: 'Register on purpose', iCan: 'I can choose a formal or an everyday word to suit my reader.',
    story: 'Quill sends a text to a friend: "Shall we commence our walk?" The friend replies: "Why are you talking like a letter from the bank?" Quill laughs. Too formal can be as wrong as too casual.',
    learn: {
      why: 'Register is a choice, not a ranking: formal words are not "better", they suit a different reader. A report, an application or a speech to strangers wants formal words — often longer ones that came into English from Latin or French ("conclude", "discover", "request"). A note to a friend wants short everyday ones ("put off", "look into"). A word in the wrong register sticks out, in either direction.',
      example: ['put off → postpone', 'look into → investigate', 'Too stiff for a friend: "Shall we commence?"'],
    },
    sources: BEE('conclude', 'discover', 'request', 'respond', 'increase'),
    items: [
      mc("Which word is the formal way to say 'put off' (a match)?", 'postpone', ['push back', 'bump', 'shelve for now']),
      mc("Which word is the formal way to say 'look into' (a problem)?", 'investigate', ['poke about in', 'nose around', 'dig about in']),
      mc("Which word is the formal way to say 'go up' (prices go up)?", 'increase', ['shoot up', 'creep up', 'jump about']),
      mc("Which word is the formal way to say 'find out'?", 'discover', ['suss out', 'twig', 'get wind of']),
      mc("Which word is the formal way to say 'answer' (a letter)?", 'respond to', ['get back to', 'drop a line to', 'holler back at']),
      mc("Which word is the formal way to say 'but' at the start of a sentence in an essay?", 'However', ['Thing is', 'Mind you', 'Still and all']),
      mc("Which word is the formal way to say 'so' (to give a result) in a report?", 'Therefore', ['Anyway', 'So yeah', 'Right then']),
      mc("Which word is the formal way to say 'worried' (in a letter to a council)?", 'concerned', ['stressed out', 'in a flap', 'freaking out']),
      mc('Which word would sound oddly stiff in a text to your best friend?', 'commence', ['start', 'begin', 'kick off']),
      mc('Which word would sound oddly stiff in a text to your best friend?', 'reside', ['live', 'stay', 'hang out']),
      mc('Which word sounds too casual in this job application: "I am keen, reliable and really into animals."?', 'into', ['keen', 'reliable', 'animals']),
      mc('Which word sounds too casual in this report: "The results show a massive rise in rainfall."?', 'massive', ['results', 'rise', 'rainfall']),
      mc('A science report says the metal "got bigger" when heated. Which formal word should replace "got bigger"?', 'expanded', ['puffed out', 'ballooned', 'blew up']),
      mc("Which opening suits a letter asking a museum for a class visit?", 'I am writing to request a visit.', ['Hey, can our class come round?', 'Fancy having our lot over?', 'Just wondering if we can pop by?'], { sources: BEE('request') }),
    ],
  },

  // ── Level 9 · Shades of meaning ──
  {
    id: 'w9-strength', level: 9, band: 2, needsReview: false,
    title: 'How strong a word?', iCan: 'I can choose a word for exactly how strong a feeling or a quality is.',
    story: 'Quill dips a paw in the river. "It\'s freezing!" Quill yelps — then admits it is only cool. Words are like a thermometer: warm, hot and scorching sit at different heights, and a good writer picks the exact one.',
    learn: {
      why: 'Words that mean nearly the same thing can be stronger or weaker. Warm, hot and scorching all describe heat, but scorching is far hotter. A writer who chooses the exact strength tells the reader precisely how it felt. The same is true of verbs: "walked" is plain, but "crept" and "marched" show HOW.',
      example: ['warm → hot → scorching', 'peckish → hungry → ravenous', 'walked → crept (quietly), marched (proudly)'],
    },
    sources: BEE('tiny', 'damp', 'drenched', 'crept', 'stared'),
    items: [
      mc('Which word is the hottest?', 'scorching', ['warm', 'mild', 'lukewarm']),
      mc('Which word is the coldest?', 'freezing', ['cool', 'chilly', 'fresh']),
      mc('Which word is the biggest?', 'gigantic', ['big', 'large', 'sizeable']),
      mc('Which word is the smallest?', 'tiny', ['small', 'little', 'smallish'], { sources: BEE('tiny') }),
      mc('Which word shows the MOST anger?', 'furious', ['annoyed', 'cross', 'irritated']),
      mc('Which word shows the LEAST hunger?', 'peckish', ['starving', 'ravenous', 'famished']),
      mc('Which word is the LEAST wet?', 'damp', ['soaked', 'drenched', 'sodden'], { sources: BEE('damp', 'drenched') }),
      mc('Which word shows the MOST happiness?', 'ecstatic', ['content', 'pleased', 'cheerful']),
      mc('Which word shows the MOST fear?', 'terrified', ['uneasy', 'nervous', 'worried']),
      mc('Which way of speaking is the quietest?', 'whispered', ['said', 'shouted', 'bellowed']),
      mc('Quill needs a verb for walking very quietly so as not to be heard. Which?', 'crept', ['marched', 'stomped', 'strode'], { sources: BEE('crept') }),
      mc('Quill needs a verb for walking slowly, dragging the feet. Which?', 'shuffled', ['strode', 'sprinted', 'marched']),
      mc('Quill needs a verb for eating fast and greedily. Which?', 'gobbled', ['nibbled', 'sipped', 'tasted']),
      mc('Quill needs a verb for looking at something for a long time without blinking. Which?', 'stared', ['glanced', 'peeped', 'winked'], { sources: BEE('stared') }),
      mc('Alice wanted to listen without being seen. Which word tells you she moved quietly?', 'crept', ['wood', 'listen', 'way'], { quote: 'crept a little way out of the wood to listen', work: 'alice' }),
      mc('Which word tells you Alice looked quickly, and a little secretly?', 'peeped', ['reading', 'sister', 'book'], { quote: 'once or twice she had peeped into the book her sister was reading', work: 'alice' }),
      mc('Which word shows Peter twisting his body to get free?', 'wriggled', ['leaving', 'jacket', 'time'], { quote: 'Peter wriggled out just in time, leaving his jacket behind him', work: 'peterrabbit' }),
    ],
  },
  {
    id: 'w9-feeling', level: 9, band: 3, needsReview: false,
    title: 'Words with feelings', iCan: 'I can tell a kind word from an unkind one that means nearly the same.',
    story: 'Quill counts every coin before spending one. "You\'re so thrifty," says one friend. "You\'re so stingy," says another. Same habit — but one friend is praising Quill, and the other is not.',
    learn: {
      why: 'Words carry feelings as well as meanings — this is called connotation. Thrifty and stingy both mean careful with money, but thrifty praises and stingy criticises. Slender flatters; scrawny does not. Writers choose the word whose feeling suits what they want the reader to think.',
      example: ['thrifty (praise) — stingy (criticism)', 'confident (praise) — arrogant (criticism)', 'childlike (innocent) — childish (immature)'],
    },
    sources: BEE('slender', 'scrawny', 'childish', 'cosy', 'mob', 'confident'),
    items: [
      mc('Which word praises someone who is careful with money?', 'thrifty', ['stingy', 'miserly', 'tight-fisted']),
      mc('Which word is an unkind way to say someone is careful with money?', 'stingy', ['thrifty', 'economical', 'sensible']),
      mc('Which word for a thin person is the most flattering?', 'slender', ['scrawny', 'bony', 'skinny'], { sources: BEE('slender', 'scrawny') }),
      mc('Which word criticises someone for being too sure of themselves?', 'arrogant', ['confident', 'self-assured', 'poised'], { sources: BEE('confident') }),
      mc('Which word criticises someone who asks too many questions about other people?', 'nosy', ['curious', 'interested', 'eager to learn']),
      mc('Which word praises someone who will not give up?', 'determined', ['stubborn', 'pig-headed', 'obstinate']),
      mc('Which word makes a small room sound the most welcoming?', 'cosy', ['cramped', 'poky', 'stuffy'], { sources: BEE('cosy') }),
      mc('Which word for a smell is pleasant?', 'scent', ['stench', 'stink', 'reek']),
      mc('Which word makes a crowd sound out of control?', 'mob', ['audience', 'gathering', 'assembly'], { sources: BEE('mob') }),
      mc("Which word criticises a grown-up's behaviour as silly and immature?", 'childish', ['childlike', 'youthful', 'playful'], { sources: BEE('childish') }),
      mc('Which word for laughing suggests making fun of someone unkindly?', 'sniggered', ['chuckled', 'giggled', 'beamed']),
      mc('"The house at the end of the lane was ___." Which word makes the reader uneasy?', 'eerie', ['charming', 'cheerful', 'welcoming']),
      mc('Which verb means said in a low, grumbling voice, half to yourself?', 'muttered', ['announced', 'declared', 'exclaimed']),
      mc('Which word for an old building sounds the most respectful?', 'historic', ['decrepit', 'crumbling', 'run-down']),
    ],
  },

  // ── Level 10 · Ready for the Bee ──
  {
    id: 'w10-meanings', level: 10, band: 3, needsReview: true,
    title: 'Hard words, real meanings', iCan: 'I can explain what a hard word means, not just recognise it.',
    story: 'Quill is getting ready for Bizzing Bee, where the spelling contests happen. "A speller who knows what a word MEANS," says Quill, "has a map. Every letter has a reason to be there."',
    learn: {
      why: 'Strong spellers know words deeply: what they mean, where they came from, what their roots are. Many hard words look like easier ones and mean something quite different — diffident is not "different", pensive is not "expensive". Learn the meaning here; take it to Bizzing Bee to compete. Every meaning on this stop is from Bizzing Bee\'s own word list.',
      example: ['loquacious — talking too freely', 'alacrity — cheerful readiness', 'diffident — modest and shy (not "different")'],
    },
    sources: BEE('loquacious', 'alacrity', 'diffident', 'pensive'),
    items: [
      mc("What does 'loquacious' mean?", 'very talkative', ['very quiet', 'easily scared', 'always late'], { sources: BEE('loquacious') }),
      mc("What does 'alacrity' mean?", 'cheerful readiness', ['deep sadness', 'careless anger', 'quiet fear'], { sources: BEE('alacrity') }),
      mc("What does 'fortitude' mean?", 'courage in hard times', ['a strong building', 'a lucky chance', 'a loud boast'], { sources: BEE('fortitude') }),
      mc("What does 'credulous' mean?", 'believing things too easily', ['hard to believe at all', 'deserving great praise', 'always doubting others'], { sources: BEE('credulous') }),
      mc("What does 'diffident' mean?", 'modest and shy', ['different in kind', 'proud and bold', 'angry and loud'], { sources: BEE('diffident') }),
      mc("What does 'covetous' mean?", 'wanting what others have', ['kept hidden and secret', 'generous to everyone', 'tired and very slow'], { sources: BEE('covetous') }),
      mc("What does 'pensive' mean?", 'deeply thoughtful', ['costing a lot', 'hanging down', 'ready to fight'], { sources: BEE('pensive') }),
      mc("What is a 'connoisseur'?", 'an expert judge of quality', ['a nervous beginner', 'a travelling seller', 'a guard at a gate'], { sources: BEE('connoisseur') }),
      mc("What is a 'misanthrope'?", 'someone who dislikes people', ['someone who loves people', 'someone who studies insects', 'someone who collects coins'], { sources: BEE('misanthrope') }),
      mc("What does 'treacherous' mean (a treacherous path)?", 'dangerously unpredictable', ['full of hidden treasure', 'wide and well kept', 'quiet and peaceful'], { sources: BEE('treacherous') }),
      mc("What does 'incorrigible' mean?", 'impossible to correct', ['impossible to see', 'easy to carry', 'easy to break'], { sources: BEE('incorrigible') }),
      mc("What does 'gingerly' mean (she lifted it gingerly)?", 'with great care', ['with a spicy taste', 'with red hair', 'with loud anger'], { sources: BEE('gingerly') }),
      mc("What does 'eloquent' mean?", 'speaking clearly and well', ['moving very slowly', 'behaving very badly', 'dressed very neatly'], { sources: BEE('eloquent') }),
      mc("What does 'prudence' mean?", 'wise caution', ['rude behaviour', 'great pride', 'sudden luck'], { sources: BEE('prudence') }),
    ],
  },
  {
    id: 'w10-clues', level: 10, band: 3, needsReview: true,
    title: 'A speller\'s clues', iCan: 'I can use a word\'s origin, roots and meaning as clues.',
    story: 'Before a big Bizzing Bee round, Quill asks three questions about every new word: Where did it come from? What are its roots? Does it sound like another word with a different meaning? "Then," says Quill, "I go to the Bee and spell it."',
    learn: {
      why: 'A word\'s history is a clue to its spelling and its meaning. Words from Greek often carry Greek roots (kaleidoscope: beautiful + shape + look); words borrowed from other languages keep traces of them. Homophones sound alike but mean different things — waist and waste — so the meaning tells you which one is meant. Bizzing Bee\'s word list gives each word\'s origin; the Bee is where you compete.',
      example: ['caravan ← Persian karwan, a group of desert travellers', 'claustrophobia = closed space + fear', 'waist (body) — waste (rubbish)'],
    },
    sources: BEE('caravan', 'kaleidoscope', 'claustrophobia', 'waist', 'waste'),
    items: [
      mc("Bizzing Bee's word list traces 'caravan' back to which language?", 'Persian', ['Japanese', 'Norse', 'Dutch'], { sources: BEE('caravan') }),
      mc("Bizzing Bee's word list traces 'mantra' back to which language?", 'Sanskrit', ['Spanish', 'Dutch', 'Norse'], { sources: BEE('mantra') }),
      mc("Bizzing Bee's word list traces 'paddy' (a rice field) back to which language?", 'Malay', ['Norse', 'German', 'Greek'], { sources: BEE('paddy') }),
      mc("Bizzing Bee's word list traces 'snack' back to which language?", 'Dutch', ['Arabic', 'Sanskrit', 'Greek'], { sources: BEE('snack') }),
      mc("Bizzing Bee's word list traces 'umbrella' (little shade) back to which language?", 'Italian', ['Norse', 'Hindi', 'Dutch'], { sources: BEE('umbrella') }),
      mc("Kaleidoscope is built from kalos (beautiful), eidos (shape) and skopein (to look). Those roots are…", 'Greek', ['Dutch', 'Hindi', 'Norse'], { sources: BEE('kaleidoscope') }),
      mc("'Jodhpurs', riding trousers, are named after a city in which country?", 'India', ['Italy', 'Egypt', 'Norway'], { sources: BEE('jodhpurs') }),
      mc("Chronometer = time + measure. So a chronometer is…", 'a very accurate clock', ['a tool for measuring heat', 'a chart of colours', 'a map of the stars'], { sources: BEE('chronometer') }),
      mc("Claustrophobia = closed space + fear. It is a fear of…", 'small closed spaces', ['being up very high', 'deep or open water', 'large crowds of people'], { sources: BEE('claustrophobia') }),
      mc("Amorphous = without + form. Something amorphous is…", 'without a clear shape', ['full of many colours', 'loved by everyone', 'lasting for ever'], { sources: BEE('amorphous') }),
      mc("Which word means 'the narrow part of the body between the ribs and hips'?", 'waist', ['waste', 'wrist', 'waits'], { sources: BEE('waist', 'waste') }),
      mc("Which word means 'having too high an opinion of yourself'?", 'vain', ['vein', 'vane', 'vague'], { sources: BEE('vain', 'vein') }),
      mc("Which word means 'a slice of meat'?", 'steak', ['stake', 'streak', 'stack'], { sources: BEE('steak', 'stake') }),
      mc("Which word means 'rough to the touch'?", 'coarse', ['course', 'cause', 'curse'], { sources: BEE('coarse', 'course') }),
      mc("Which word means 'the way someone walks'?", 'gait', ['gate', 'great', 'gaunt'], { sources: BEE('gait', 'gate') }),
      mc('Quill knows the meaning, origin and roots of a hard word. Where does a child go to compete in spelling it?', 'Bizzing Bee', ['this Word road', 'the Library', 'the Stage']),
    ],
  },
];
