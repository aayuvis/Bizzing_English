/* wordparts.js — the Word strand's building blocks: word families (rimes), prefixes, suffixes,
   Latin and Greek roots, and register pairs. Every word below is in Bizzing Bee's own word list
   (test/banks.mjs checks it against the pinned Bee data), lower-case, no proper nouns.

   Every prefix, suffix and root cites where Bee teaches it: a Bee concept chapter by its exact
   title, or — where no chapter teaches it — the Bee words-lore etymology of one of its words
   ('Bee words-lore: <word>'). A fact with no Bee source is not here. */

// ── Word families (band 1) ─────────────────────────────────────────────────────────────────
// Each word ends in the rime and rhymes with it. All are Bee words at difficulty 1–2.
export const RIMES = [
  { rime: 'at',   words: ['cat', 'hat', 'mat', 'bat', 'rat', 'sat', 'fat', 'pat', 'flat', 'chat', 'spat', 'vat'] },
  { rime: 'an',   words: ['can', 'fan', 'man', 'pan', 'ran', 'tan', 'van', 'plan', 'scan', 'span', 'clan', 'ban'] },
  { rime: 'ap',   words: ['cap', 'map', 'nap', 'tap', 'lap', 'gap', 'clap', 'flap', 'snap', 'trap', 'slap', 'sap'] },
  { rime: 'ag',   words: ['bag', 'rag', 'tag', 'flag', 'drag', 'brag', 'snag', 'stag', 'sag'] },
  { rime: 'ig',   words: ['big', 'dig', 'fig', 'pig', 'wig', 'rig', 'gig', 'brig'] },
  { rime: 'ip',   words: ['dip', 'hip', 'lip', 'sip', 'tip', 'zip', 'chip', 'clip', 'drip', 'flip', 'ship', 'skip', 'slip', 'trip'] },
  { rime: 'it',   words: ['bit', 'fit', 'hit', 'kit', 'lit', 'pit', 'sit', 'wit', 'grit', 'quit', 'spit', 'slit'] },
  { rime: 'op',   words: ['hop', 'mop', 'pop', 'top', 'cop', 'crop', 'drop', 'flop', 'shop', 'stop', 'prop'] },
  { rime: 'ug',   words: ['bug', 'dug', 'hug', 'jug', 'mug', 'rug', 'tug', 'plug', 'slug'] },
  { rime: 'un',   words: ['bun', 'fun', 'run', 'sun', 'spun', 'stun', 'shun', 'pun'] },
  { rime: 'ub',   words: ['cub', 'rub', 'tub', 'hub', 'club', 'sub', 'scrub', 'dub'] },
  { rime: 'et',   words: ['bet', 'get', 'jet', 'let', 'met', 'net', 'pet', 'set', 'vet', 'wet', 'yet', 'fret'] },
  { rime: 'ake',  words: ['cake', 'lake', 'make', 'take', 'wake', 'fake', 'shake', 'snake', 'stake'] },
  { rime: 'ame',  words: ['came', 'fame', 'game', 'name', 'same', 'blame', 'frame', 'shame'] },
  { rime: 'ight', words: ['light', 'night', 'right', 'sight', 'tight', 'fight', 'might', 'bright', 'flight', 'slight'] },
  { rime: 'ell',  words: ['bell', 'fell', 'sell', 'tell', 'well', 'cell', 'shell', 'smell', 'spell'] },
  { rime: 'ill',  words: ['fill', 'hill', 'mill', 'will', 'still', 'skill', 'till', 'bill'] },
  { rime: 'ock',  words: ['rock', 'sock', 'lock', 'dock', 'block', 'clock', 'flock', 'shock', 'stock'] },
  { rime: 'ack',  words: ['back', 'pack', 'sack', 'black', 'crack', 'snack', 'stack', 'track', 'rack', 'shack'] },
  { rime: 'ain',  words: ['rain', 'main', 'pain', 'gain', 'brain', 'drain', 'grain', 'plain', 'train'] },
  { rime: 'ay',   words: ['day', 'hay', 'lay', 'may', 'pay', 'say', 'way', 'clay', 'play', 'pray', 'stay', 'tray', 'spray'] },
  { rime: 'eep',  words: ['beep', 'deep', 'jeep', 'keep', 'peep', 'sheep', 'sleep', 'steep', 'sweep', 'creep'] },
  { rime: 'est',  words: ['best', 'chest', 'nest', 'pest', 'rest', 'test', 'vest', 'west', 'zest', 'quest', 'crest'] },
  { rime: 'ump',  words: ['bump', 'dump', 'hump', 'jump', 'lump', 'pump', 'plump', 'stump'] },
  { rime: 'ink',  words: ['ink', 'link', 'pink', 'rink', 'sink', 'wink', 'blink', 'drink', 'think', 'stink'] },
  { rime: 'ank',  words: ['bank', 'tank', 'sank', 'blank', 'drank', 'plank', 'prank', 'thank', 'crank'] },
  { rime: 'ail',  words: ['mail', 'nail', 'rail', 'sail', 'tail', 'hail', 'trail', 'fail'] },
  { rime: 'ook',  words: ['book', 'cook', 'hook', 'look', 'took', 'brook', 'shook', 'crook'] },
  { rime: 'all',  words: ['all', 'ball', 'call', 'fall', 'hall', 'tall', 'wall', 'small', 'mall'] },
];

// ── Prefixes ───────────────────────────────────────────────────────────────────────────────
// Pairs are [prefixed word, base word]. Each prefix really carries its meaning in every pair:
// no false prefixes (uncle, read, disaster, pressure).
export const PREFIXES = [
  { p: 'un', meaning: 'not', band: 1, source: 'un- (not / reverse action)', words: [
    ['unhappy', 'happy'], ['unkind', 'kind'], ['unfair', 'fair'], ['unlucky', 'lucky'], ['unsafe', 'safe'],
    ['unwell', 'well'], ['untidy', 'tidy'], ['unable', 'able'], ['unknown', 'known'], ['unusual', 'usual'], ['unfriendly', 'friendly']] },
  { p: 're', meaning: 'again', band: 1, source: 're- (again / back)', words: [
    ['retake', 'take'], ['rebuild', 'build'], ['reread', 'read'], ['rewrite', 'write'], ['refill', 'fill'],
    ['retell', 'tell'], ['reheat', 'heat'], ['replay', 'play'], ['reopen', 'open'], ['repaint', 'paint']] },
  { p: 'pre', meaning: 'before', band: 2, source: 'pre- / pro- (before / forward)', words: [
    ['preview', 'view'], ['prepay', 'pay'], ['preheat', 'heat'], ['prehistoric', 'historic'], ['preschool', 'school'],
    ['preset', 'set'], ['precook', 'cook'], ['prearrange', 'arrange'], ['prewar', 'war'], ['predate', 'date']] },
  { p: 'dis', meaning: 'not; the opposite of', band: 2, source: 'dis- (apart / not / opposite)', words: [
    ['dislike', 'like'], ['disagree', 'agree'], ['disobey', 'obey'], ['dishonest', 'honest'], ['disappear', 'appear'],
    ['disconnect', 'connect'], ['discomfort', 'comfort'], ['disloyal', 'loyal'], ['disorder', 'order'], ['disallow', 'allow']] },
  { p: 'mis', meaning: 'wrongly; badly', band: 2, source: 'mis- (wrongly / badly)', words: [
    ['misspell', 'spell'], ['misread', 'read'], ['misplace', 'place'], ['misbehave', 'behave'], ['mislead', 'lead'],
    ['misjudge', 'judge'], ['misunderstand', 'understand'], ['miscount', 'count'], ['misprint', 'print'], ['mismatch', 'match']] },
  { p: 'non', meaning: 'not', band: 2, source: 'Bee words-lore: nontraditional', words: [
    ['nonsense', 'sense'], ['nonstop', 'stop'], ['nonfiction', 'fiction'], ['nonliving', 'living'], ['nonverbal', 'verbal'],
    ['nontoxic', 'toxic'], ['nonviolent', 'violent'], ['nonessential', 'essential'], ['nontraditional', 'traditional']] },
  { p: 'over', meaning: 'too much', band: 2, source: 'Bee words-lore: overeager', words: [
    ['overeat', 'eat'], ['oversleep', 'sleep'], ['overcook', 'cook'], ['overload', 'load'], ['overspend', 'spend'],
    ['overcharge', 'charge'], ['overheat', 'heat'], ['overwork', 'work'], ['overeager', 'eager'], ['overfeed', 'feed']] },
  { p: 'under', meaning: 'below; beneath', band: 2, source: 'Bee words-lore: undergarment', words: [
    ['underground', 'ground'], ['underwater', 'water'], ['underline', 'line'], ['undersea', 'sea'], ['undergarment', 'garment'],
    ['undercurrent', 'current'], ['underside', 'side'], ['underarm', 'arm'], ['underfoot', 'foot']] },
  { p: 'sub', meaning: 'under; below', band: 2, source: 'sub- / sur- / super- / supra- (under / above)', words: [
    ['submarine', 'marine'], ['subway', 'way'], ['subset', 'set'], ['subsoil', 'soil'], ['subconscious', 'conscious'],
    ['subtitle', 'title'], ['subsection', 'section'], ['subtotal', 'total'], ['subgroup', 'group']] },
  { p: 'inter', meaning: 'between; among', band: 2, source: 'inter- / intra- (between / within)', words: [
    ['international', 'national'], ['interact', 'act'], ['interchange', 'change'], ['intercity', 'city'], ['interconnect', 'connect'],
    ['interlock', 'lock'], ['intermix', 'mix'], ['interweave', 'weave'], ['interstate', 'state']] },
  { p: 'super', meaning: 'above; beyond', band: 2, source: 'sub- / sur- / super- / supra- (under / above)', words: [
    ['superhuman', 'human'], ['superstar', 'star'], ['superpower', 'power'], ['supernatural', 'natural'], ['superstructure', 'structure'],
    ['supersonic', 'sonic'], ['superimpose', 'impose'], ['supermarket', 'market']] },
  { p: 'anti', meaning: 'against', band: 2, source: 'anti- / hyper- / hypo- (against / over / under)', words: [
    ['antisocial', 'social'], ['antifreeze', 'freeze'], ['antitank', 'tank'], ['antibacterial', 'bacterial'], ['antiseptic', 'septic'],
    ['antibody', 'body'], ['anticlockwise', 'clockwise'], ['antibiotic', 'biotic'], ['antiaircraft', 'aircraft']] },
  { p: 'im', meaning: 'not', band: 2, source: 'in- / im- / il- / ir- (not / without)', words: [
    ['impossible', 'possible'], ['impatient', 'patient'], ['impolite', 'polite'], ['imperfect', 'perfect'], ['immature', 'mature'],
    ['immobile', 'mobile'], ['impure', 'pure'], ['immortal', 'mortal'], ['imbalance', 'balance']] },
  { p: 'in', meaning: 'not', band: 2, source: 'in- / im- / il- / ir- (not / without)', words: [
    ['incorrect', 'correct'], ['inactive', 'active'], ['incomplete', 'complete'], ['invisible', 'visible'], ['informal', 'formal'],
    ['indirect', 'direct'], ['inaccurate', 'accurate'], ['inexpensive', 'expensive'], ['insecure', 'secure'], ['inedible', 'edible']] },
  { p: 'trans', meaning: 'across', band: 3, source: 'trans- / per- (across / through)', words: [
    ['transform', 'form'], ['transplant', 'plant'], ['transcontinental', 'continental'], ['transnational', 'national'],
    ['transcode', 'code'], ['transoceanic', 'oceanic'], ['translocate', 'locate'], ['transshipment', 'shipment']] },
  { p: 'semi', meaning: 'half; partly', band: 3, source: 'duc / duct (lead)', words: [
    ['semicircle', 'circle'], ['semifinal', 'final'], ['semiarid', 'arid'], ['semiautomatic', 'automatic'], ['semiformal', 'formal'],
    ['semiprecious', 'precious'], ['semiconductor', 'conductor'], ['semiannual', 'annual'], ['semisolid', 'solid']] },
  { p: 'bi', meaning: 'two', band: 3, source: 'Number Prefixes 1–10: Latin & Greek', words: [
    ['bicycle', 'cycle'], ['biplane', 'plane'], ['bilingual', 'lingual'], ['biweekly', 'weekly'], ['biannual', 'annual'],
    ['bimonthly', 'monthly'], ['bilateral', 'lateral'], ['bifocal', 'focal'], ['binational', 'national']] },
  { p: 'tri', meaning: 'three', band: 3, source: 'Number Prefixes 1–10: Latin & Greek', words: [
    ['tricycle', 'cycle'], ['triangle', 'angle'], ['triangular', 'angular'], ['trilateral', 'lateral'], ['tricentennial', 'centennial'],
    ['trisyllabic', 'syllabic'], ['tricorner', 'corner'], ['tritone', 'tone']] },
  { p: 'auto', meaning: 'self', band: 3, source: 'Ego & Self — ego / auto / alter', words: [
    ['autograph', 'graph'], ['autopilot', 'pilot'], ['autobiography', 'biography'], ['automobile', 'mobile'], ['autofocus', 'focus'],
    ['autocorrect', 'correct'], ['autoimmune', 'immune'], ['autosuggestion', 'suggestion']] },
];

// ── Suffixes ───────────────────────────────────────────────────────────────────────────────
// Pairs are [suffixed word, base word]; the base keeps its own spelling (happy → happiness).
export const SUFFIXES = [
  { s: 'ful', meaning: 'full of', makes: 'adjective', band: 1, source: 'Bee words-lore: peaceful', words: [
    ['hopeful', 'hope'], ['careful', 'care'], ['joyful', 'joy'], ['helpful', 'help'], ['peaceful', 'peace'],
    ['playful', 'play'], ['thankful', 'thank'], ['painful', 'pain'], ['fearful', 'fear'], ['beautiful', 'beauty'], ['cheerful', 'cheer']] },
  { s: 'less', meaning: 'without', makes: 'adjective', band: 1, source: 'Bee words-lore: tasteless', words: [
    ['fearless', 'fear'], ['careless', 'care'], ['helpless', 'help'], ['homeless', 'home'], ['endless', 'end'],
    ['harmless', 'harm'], ['hopeless', 'hope'], ['sleepless', 'sleep'], ['painless', 'pain'], ['spotless', 'spot'], ['tasteless', 'taste']] },
  { s: 'ness', meaning: 'the state of being', makes: 'noun', band: 2, source: '-ity / -ness / -hood / -ship / -dom (abstract state)', words: [
    ['kindness', 'kind'], ['darkness', 'dark'], ['happiness', 'happy'], ['sadness', 'sad'], ['illness', 'ill'],
    ['fitness', 'fit'], ['weakness', 'weak'], ['goodness', 'good'], ['softness', 'soft'], ['brightness', 'bright'], ['loneliness', 'lonely']] },
  { s: 'ly', meaning: 'in a way', makes: 'adverb', band: 1, source: 'Bee words-lore: gratingly', words: [
    ['quickly', 'quick'], ['slowly', 'slow'], ['quietly', 'quiet'], ['happily', 'happy'], ['sadly', 'sad'],
    ['loudly', 'loud'], ['gently', 'gentle'], ['bravely', 'brave'], ['softly', 'soft'], ['carefully', 'careful']] },
  { s: 'er', meaning: 'a person who', makes: 'noun', band: 1, source: 'Agent Suffixes: -er / -or / -ist / -ian / -eur / -eer', words: [
    ['teacher', 'teach'], ['painter', 'paint'], ['farmer', 'farm'], ['baker', 'bake'], ['singer', 'sing'],
    ['dancer', 'dance'], ['writer', 'write'], ['player', 'play'], ['swimmer', 'swim'], ['runner', 'run'], ['builder', 'build'], ['driver', 'drive']] },
  { s: 'ment', meaning: 'the act or result of', makes: 'noun', band: 2, source: 'Bee words-lore: abandonment', words: [
    ['payment', 'pay'], ['enjoyment', 'enjoy'], ['movement', 'move'], ['agreement', 'agree'], ['amazement', 'amaze'],
    ['treatment', 'treat'], ['argument', 'argue'], ['statement', 'state'], ['development', 'develop'], ['excitement', 'excite'], ['improvement', 'improve']] },
  { s: 'able', meaning: 'can be', makes: 'adjective', band: 2, source: '-able / -ible (capable of being)', words: [
    ['washable', 'wash'], ['readable', 'read'], ['breakable', 'break'], ['enjoyable', 'enjoy'], ['drinkable', 'drink'],
    ['lovable', 'love'], ['reliable', 'rely'], ['adaptable', 'adapt'], ['believable', 'believe'], ['returnable', 'return']] },
  { s: 'ish', meaning: 'somewhat; rather like', makes: 'adjective', band: 2, source: 'Bee words-lore: earlyish', words: [
    ['childish', 'child'], ['foolish', 'fool'], ['reddish', 'red'], ['greenish', 'green'], ['smallish', 'small'],
    ['bluish', 'blue'], ['babyish', 'baby'], ['boyish', 'boy'], ['yellowish', 'yellow'], ['earlyish', 'early']] },
  { s: 'ous', meaning: 'full of', makes: 'adjective', band: 2, source: '-ous / -ious / -eous / -uous (full of / having quality)', words: [
    ['dangerous', 'danger'], ['famous', 'fame'], ['joyous', 'joy'], ['poisonous', 'poison'], ['mountainous', 'mountain'],
    ['courageous', 'courage'], ['adventurous', 'adventure'], ['glorious', 'glory'], ['mysterious', 'mystery'], ['envious', 'envy']] },
  { s: 'tion', meaning: 'the act or result of', makes: 'noun', band: 3, source: '-tion / -sion / -cion (action / state / result)', words: [
    ['action', 'act'], ['invention', 'invent'], ['collection', 'collect'], ['protection', 'protect'], ['direction', 'direct'],
    ['decoration', 'decorate'], ['education', 'educate'], ['celebration', 'celebrate'], ['creation', 'create'], ['prediction', 'predict'], ['connection', 'connect']] },
  { s: 'est', meaning: 'the most', makes: 'adjective', band: 1, source: 'Bee words-lore: properest', words: [
    ['tallest', 'tall'], ['smallest', 'small'], ['fastest', 'fast'], ['biggest', 'big'], ['happiest', 'happy'],
    ['largest', 'large'], ['oldest', 'old'], ['longest', 'long'], ['greatest', 'great'], ['coldest', 'cold']] },
  { s: 'y', meaning: 'full of; like', makes: 'adjective', band: 1, source: 'Bee words-lore: fiery', words: [
    ['rainy', 'rain'], ['sunny', 'sun'], ['windy', 'wind'], ['cloudy', 'cloud'], ['snowy', 'snow'],
    ['muddy', 'mud'], ['sandy', 'sand'], ['noisy', 'noise'], ['salty', 'salt'], ['dusty', 'dust'], ['rocky', 'rock'], ['smoky', 'smoke']] },
];

// ── Latin and Greek roots ──────────────────────────────────────────────────────────────────
export const ROOTS = [
  // Taught in a Bee concept chapter.
  { root: 'aud', meaning: 'hear', from: 'Latin audire', band: 2, source: 'aud (hear)', words: ['audience', 'audio', 'audition', 'auditorium', 'audible', 'inaudible'] },
  { root: 'dict', meaning: 'say', from: 'Latin dicere', band: 2, source: 'dict / dic (say / speak)', words: ['dictionary', 'predict', 'contradict', 'verdict', 'dictate', 'diction'] },
  { root: 'port', meaning: 'carry', from: 'Latin portare', band: 2, source: 'port (carry)', words: ['transport', 'export', 'import', 'portable', 'porter', 'report'] },
  { root: 'scrib / script', meaning: 'write', from: 'Latin scribere', band: 2, source: 'scrib / script (write)', words: ['describe', 'script', 'manuscript', 'prescription', 'inscription', 'subscribe', 'scribble'] },
  { root: 'spect', meaning: 'look', from: 'Latin specere', band: 2, source: 'spec / spect / spic (see / look)', words: ['inspect', 'spectator', 'spectacles', 'respect', 'inspector', 'spectacular'] },
  { root: 'duc / duct', meaning: 'lead', from: 'Latin ducere', band: 3, source: 'duc / duct (lead)', words: ['conductor', 'educate', 'produce', 'introduce', 'aqueduct', 'deduce'] },
  { root: 'mit / miss', meaning: 'send', from: 'Latin mittere', band: 3, source: 'miss / mit (send)', words: ['transmit', 'submit', 'mission', 'missile', 'emit', 'dismiss', 'permit'] },
  { root: 'vert / vers', meaning: 'turn', from: 'Latin vertere', band: 3, source: 'vert / vers (turn)', words: ['reverse', 'convert', 'invert', 'divert', 'introvert', 'extrovert'] },
  { root: 'ten / tain', meaning: 'hold', from: 'Latin tenere', band: 3, source: 'ten / tain / tent (hold)', words: ['contain', 'retain', 'maintain', 'tenant', 'detain', 'obtain'] },
  { root: 'cred', meaning: 'believe', from: 'Latin credere', band: 3, source: 'cred (believe)', words: ['credit', 'incredible', 'credible', 'credulous', 'credibility', 'credentials'] },
  { root: 'fer', meaning: 'carry; bear', from: 'Latin ferre', band: 3, source: 'fer (carry / bear)', words: ['transfer', 'conifer', 'infer', 'refer', 'prefer', 'suffer'] },
  { root: 'graph', meaning: 'write', from: 'Greek graphein', band: 2, source: 'graph / gram (write / record)', words: ['autograph', 'paragraph', 'photograph', 'biography', 'geography', 'telegraph'] },
  { root: 'phon', meaning: 'sound; voice', from: 'Greek phone', band: 2, source: 'phon / phone (sound / voice)', words: ['telephone', 'microphone', 'headphones', 'symphony', 'phonics', 'saxophone', 'xylophone'] },
  { root: 'chron', meaning: 'time', from: 'Greek chronos', band: 3, source: 'chron (time)', words: ['chronicle', 'chronological', 'chronic', 'chronometer', 'chronology'] },
  { root: 'scope', meaning: 'look at', from: 'Greek skopein', band: 2, source: 'scop / scope (see / examine)', words: ['telescope', 'microscope', 'periscope', 'kaleidoscope', 'stethoscope'] },
  { root: 'logy', meaning: 'study of', from: 'Greek logos', band: 3, source: 'log / logy (word / reason / study)', words: ['biology', 'geology', 'zoology', 'ecology', 'archaeology', 'meteorology'] },
  { root: 'phil', meaning: 'love', from: 'Greek philos', band: 3, source: 'phil / phile (love)', words: ['philosophy', 'philanthropy', 'philosopher', 'philharmonic', 'philanthropist'] },
  { root: 'gen', meaning: 'birth; produce', from: 'Greek genos', band: 3, source: 'gen / genesis (birth / origin / produce)', words: ['generate', 'genetic', 'gene', 'genesis', 'oxygen', 'hydrogen'] },
  { root: 'dem', meaning: 'people', from: 'Greek demos', band: 3, source: 'dem / demo (people)', words: ['democracy', 'epidemic', 'demographic', 'pandemic', 'democrat'] },
  { root: 'path', meaning: 'feeling; suffering', from: 'Greek pathos', band: 3, source: 'path / pathy (suffering / feeling / disease)', words: ['sympathy', 'empathy', 'telepathy', 'pathetic', 'apathy'] },
  { root: 'morph', meaning: 'form; shape', from: 'Greek morphe', band: 3, source: 'morph (form / shape)', words: ['metamorphosis', 'morph', 'amorphous', 'anthropomorphic', 'polymorphous'] },
  { root: 'bio', meaning: 'life', from: 'Greek bios', band: 2, source: 'bio- / geo- / photo- / hydro- / thermo-', words: ['biology', 'biography', 'biodegradable', 'antibiotic', 'biosphere'] },
  { root: 'geo', meaning: 'earth', from: 'Greek ge', band: 2, source: 'bio- / geo- / photo- / hydro- / thermo-', words: ['geography', 'geology', 'geometry', 'geothermal', 'geologist'] },
  { root: 'photo', meaning: 'light', from: 'Greek phos', band: 2, source: 'bio- / geo- / photo- / hydro- / thermo-', words: ['photograph', 'photosynthesis', 'photographer', 'photocopy', 'telephoto'] },
  { root: 'hydr', meaning: 'water', from: 'Greek hydor', band: 2, source: 'bio- / geo- / photo- / hydro- / thermo-', words: ['hydrant', 'dehydrated', 'hydroelectric', 'hydrogen', 'hydraulic'] },
  { root: 'therm', meaning: 'heat', from: 'Greek therme', band: 2, source: 'bio- / geo- / photo- / hydro- / thermo-', words: ['thermometer', 'thermostat', 'thermal', 'geothermal', 'thermodynamics'] },
  { root: 'tele', meaning: 'far', from: 'Greek tele', band: 2, source: 'auto- / tele- / micro- / macro- / mega-', words: ['telephone', 'television', 'telescope', 'telegraph', 'telegram', 'teleport'] },
  { root: 'micro', meaning: 'small', from: 'Greek mikros', band: 2, source: 'auto- / tele- / micro- / macro- / mega-', words: ['microscope', 'microphone', 'microwave', 'microchip', 'microorganism'] },
  { root: 'meter', meaning: 'measure', from: 'Greek metron', band: 2, source: 'Medical Suffixes: -itis / -osis / -ectomy / -plasty / -scope / -meter', words: ['thermometer', 'speedometer', 'barometer', 'pedometer', 'odometer'] },
  { root: 'loqu', meaning: 'speak', from: 'Latin loqui', band: 3, source: 'Talking & Speaking — loqu / phon / verb', words: ['eloquent', 'loquacious', 'soliloquy', 'colloquial', 'ventriloquism'] },
  { root: 'ver', meaning: 'true', from: 'Latin verus', band: 3, source: 'Honesty & Deception — ver / mendax / cred / pseudo', words: ['verify', 'verdict', 'veracity', 'verification', 'verifiable'] },
  { root: 'fort', meaning: 'strong', from: 'Latin fortis', band: 3, source: 'Courage & Fear — aud / fort / tim / phob', words: ['fortress', 'fortify', 'fortitude', 'comfort', 'effort'] },
  { root: 'phob', meaning: 'fear', from: 'Greek phobos', band: 3, source: 'Courage & Fear — aud / fort / tim / phob', words: ['phobia', 'claustrophobia', 'acrophobia', 'hydrophobia', 'agoraphobia'] },
  { root: 'bene', meaning: 'well; good', from: 'Latin bene', band: 3, source: 'Kindness & Cruelty — ben / mal / clem', words: ['benefit', 'benefactor', 'benevolent', 'beneficial', 'benediction'] },
  { root: 'mal', meaning: 'bad; badly', from: 'Latin malus', band: 3, source: 'mal- (bad / evil / ill)', words: ['malfunction', 'malnutrition', 'malice', 'malicious', 'malformed', 'malnourished'] },
  { root: 'anthrop', meaning: 'human being', from: 'Greek anthropos', band: 3, source: 'Social & Solitary — greg / anthrop / soci / mis', words: ['anthropology', 'philanthropy', 'misanthrope', 'anthropomorphic', 'philanthropist'] },
  // No Bee chapter teaches these; each cites the Bee words-lore etymology of one of its words.
  { root: 'rupt', meaning: 'break', from: 'Latin rumpere', band: 2, source: 'Bee words-lore: interrupt', words: ['interrupt', 'erupt', 'rupture', 'disrupt', 'eruption', 'abrupt'] },
  { root: 'struct', meaning: 'build', from: 'Latin struere', band: 2, source: 'Bee words-lore: destruction', words: ['structure', 'construct', 'destruction', 'instruct', 'construction', 'infrastructure'] },
  { root: 'tract', meaning: 'pull; draw', from: 'Latin trahere', band: 2, source: 'Bee words-lore: attraction', words: ['tractor', 'attract', 'subtract', 'extract', 'distract', 'traction'] },
  { root: 'vis / vid', meaning: 'see', from: 'Latin videre', band: 2, source: 'Bee words-lore: vision', words: ['vision', 'visible', 'invisible', 'video', 'supervise', 'evidence', 'visual'] },
  { root: 'ped', meaning: 'foot', from: 'Latin pes, pedis', band: 2, source: 'Bee words-lore: pedestrian', words: ['pedal', 'pedestrian', 'centipede', 'pedicure', 'pedometer'] },
  { root: 'man / manu', meaning: 'hand', from: 'Latin manus', band: 3, source: 'Bee words-lore: manuscript', words: ['manual', 'manufacture', 'manuscript', 'manicure', 'manipulate'] },
  { root: 'ject', meaning: 'throw', from: 'Latin jacere', band: 3, source: 'Bee words-lore: eject', words: ['eject', 'project', 'projector', 'reject', 'inject', 'projectile'] },
  { root: 'fid', meaning: 'trust; faith', from: 'Latin fides', band: 3, source: 'Bee words-lore: fidelity', words: ['fidelity', 'confident', 'confidence', 'confide', 'diffident'] },
  { root: 'mort', meaning: 'death', from: 'Latin mors, mortis', band: 3, source: 'Bee words-lore: mortal', words: ['mortal', 'immortal', 'mortality', 'immortality', 'mortician'] },
  { root: 'vac', meaning: 'empty', from: 'Latin vacare', band: 3, source: 'Bee words-lore: vacuum', words: ['vacuum', 'vacant', 'vacation', 'evacuate', 'vacancy'] },
  { root: 'voc', meaning: 'call; voice', from: 'Latin vocare', band: 3, source: 'Bee words-lore: vocabulary', words: ['vocabulary', 'vocal', 'advocate', 'vocation', 'vocalist'] },
  { root: 'jud', meaning: 'judge', from: 'Latin judex', band: 3, source: 'Bee words-lore: prejudice', words: ['judge', 'judicial', 'prejudice', 'judgement', 'judicious'] },
];

// ── Register (band 3): the same idea, said formally and informally ─────────────────────────
export const REGISTER = [
  { formal: 'purchase', informal: 'buy' },
  { formal: 'assist', informal: 'help' },
  { formal: 'commence', informal: 'start' },
  { formal: 'conclude', informal: 'finish' },
  { formal: 'require', informal: 'need' },
  { formal: 'obtain', informal: 'get' },
  { formal: 'reside', informal: 'live' },
  { formal: 'depart', informal: 'leave' },
  { formal: 'sufficient', informal: 'enough' },
  { formal: 'attempt', informal: 'try' },
  { formal: 'inform', informal: 'tell' },
  { formal: 'observe', informal: 'watch' },
  { formal: 'consume', informal: 'eat' },
  { formal: 'inquire', informal: 'ask' },
  { formal: 'construct', informal: 'build' },
  { formal: 'demonstrate', informal: 'show' },
  { formal: 'permit', informal: 'let' },
  { formal: 'numerous', informal: 'many' },
  { formal: 'approximately', informal: 'about' },
  { formal: 'additional', informal: 'extra' },
  { formal: 'comprehend', informal: 'understand' },
  { formal: 'prior', informal: 'before' },
  { formal: 'residence', informal: 'home' },
  { formal: 'beverage', informal: 'drink' },
  { formal: 'infant', informal: 'baby' },
  { formal: 'fatigued', informal: 'tired' },
  { formal: 'ascend', informal: 'climb' },
  { formal: 'respond', informal: 'answer' },
  { formal: 'converse', informal: 'chat' },
  { formal: 'discover', informal: 'find' },
  { formal: 'terminate', informal: 'end' },
  { formal: 'cease', informal: 'stop' },
  { formal: 'retain', informal: 'keep' },
  { formal: 'inexpensive', informal: 'cheap' },
  { formal: 'perspire', informal: 'sweat' },
  { formal: 'initiate', informal: 'begin' },
].map(r => ({ ...r, band: 3 }));
