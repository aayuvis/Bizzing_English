/* safe.js — which of Bee's words a DRILL may put in front of a child (brief v4, S4).

   Bee's list is a spelling list for 8–15s, built from a general dictionary: it filters slurs (its
   SB_UNSAFE_RE and SLUR_DEF, mirrored below) but not sex, drugs, insults or killing — and the Typing
   Trainer asked a band-1 child to type "porn". Anything English DRAWS from Bee's lexicon on its own
   (typing pools, vocabulary decks, the definition and origin pools behind Word stops, Root Forge, feed
   cards) passes `kidSafe` first. A word the child TAPS in a classic still gets its meaning: that is the
   book's word, not ours. test/safe.mjs scans every pool against BLOCK and fails on any hit. */

// Bee's own slur filters (spellbound-app/app3.js), kept in step by hand
const BEE_UNSAFE = /(nigger|nigga|faggot|niggard|currymuncher|towelhead|raghead|\bkike\b|\bchink|wetback|\bgook\b|\bcoon\b|darkie|\bwop\b|\bdago\b|beaner|\bspic\b|\bcunt|motherfuck|\bfuck|\bshit\b|fellat|cunniling|catamit|pederast|paedophil|pedophil|coprophil|klismaphil|frotteur|\bvoyeur|masturbat|onanis|ejaculat|copulat|fornicat|\bwhore|\bslut\b|bestialit|zoophil|necrophil|scatophil|analingus)/i;
const SLUR_DEF = /\b(offensive|derogatory|disparaging|pejorative|vulgar|contemptuous|insulting|racist|racial|ethnic|obscene|taboo)\b[^.]{0,40}\b(terms?|words?|names?|slang|epithets?|slurs?|expression|reference)\b/i;

/* Headwords never drilled: sex and the body, drink and drugs, insults about the mind, killing and
   self-harm, swearing. Matched on the whole word or its start (so "nudes", "drunken", "murderer"). */
export const BLOCK = /^(porn|sex(y|ier|iest|ual|ually|uality|ism|ist|es)?$|bisexual|nud|naked|erotic|orgasm|rap(e|ed|es|ing|ist)$|whor|slut|prostitut|brothel|harlot|strip(per|tease)|lust|seduc|incest|adulter(y|er|ers|ess|ous)$|fornicat|masturbat|penis|phallic|vagin|genital|testic|condoms?$|pubic|pubert|horny|kinky|bitch|bastard|damn|hell$|hells$|hellish|crap|piss|arse$|ass$|asses$|bum$|boob|bosom|breast|nipple|bra$|bras$|underwear|knicker|lingerie|drunk|alcohol|booze|boozy|liquor|vodka|whisk(e)?y|cocaine|heroin$|opium|marijuana|cannabis|narcotic|hashish|stoned$|moron|idiot|imbecil|retard|cretin|dimwit|halfwit|nitwit|lunatic|loony|fatso|suicid|murder|homicid|massacr|slaughter|tortur|genocid|kill|assassin|corpse|gore$|gory|behead|strangl|rapist|abuse|abortion|hooker|pimp|scrotum|semen|sperm|virgin|syphil|gonorr|venereal|intercourse|coitus|carnal|lewd|obscen|smut|raunch|grope|molest|pervert|perverse|fetish|bondage|harem|concubin|mistress|gigolo|stripper|nympho|lecher|leche?ry|libid|aphrodis|shag|bonk|wank|turd|poo$|fart$|farts$|farting|vomit|puke|slave|lynch|noose|gallows|hang(ed|ing|man)$|guillotin|crucif|terror|bomb|grenade|gun$|guns$|pistol|rifle|bullet|nazi|hitler|swastika)/;
// a definition that is about sex, drink, drugs or killing a person marks its word too
const DEF_BLOCK = /\b(sexual(ly)?|horny|perverts?|erotic|pornograph\w*|genitals?|unclothed|naked|nude|nudity|prostitut\w*|intercourse|alcoholic|alcohol|liquor|intoxicat\w*|drunken|drunkard\w*|narcotic|addict\w*|subnormal|mentally deficient|suicide|killing of a human|put to death|torture|brothel)\b/i;

/* a definition or meaning a drill may show: no slur, nothing about sex, drink, drugs or killing a person */
export const defSafe = (d) => !(BEE_UNSAFE.test(d) || SLUR_DEF.test(d) || DEF_BLOCK.test(d));

export function kidSafe(word, def = '') {
  const w = String(word || '').toLowerCase(), d = String(def || '');
  if (!w) return false;
  if (BLOCK.test(w) || BEE_UNSAFE.test(w)) return false;
  if (d && (BEE_UNSAFE.test(d) || SLUR_DEF.test(d) || DEF_BLOCK.test(d))) return false;
  return true;
}
/* A sentence WE cut from a held classic for a drill or game (Typing, Sentence Builder, Punctuation Rush):
   the books are the books, but a punctuation drill has no need of "the milk in her breasts" or an
   archaic "intercourse" — so a cut sentence carrying any of these is simply not cut. */
export const LINE_BLOCK = /^(porn\w*|sexes|horny|pervert\w*|sexual\w*|sexy|nude\w*|naked\w*|rap(e|ed|es|ing|ist)|whor(e|es|ing)|slut\w*|harlot\w*|prostitut\w*|brothel\w*|seduc\w*|intercourse|breasts?|bosoms?|nipples?|virgins?|lust|lustful|lusts|carnal|lewd|obscen\w*|mistress(es)?|adulter(y|er|ess|ous)|narcotics?|liquor|drunk\w*|whisk(e)?y|bastards?|damn\w*|crap|piss\w*|wank\w*|fuck\w*|shit\w*|cunt|arse|idiots?|moron\w*|imbecil\w*|retard\w*|cretin\w*|nigger\w*|negro(es)?|savages?|suicid\w*|strangl\w*|tortur\w*|slaughter\w*)$/;
export const lineSafe = (s) => !String(s || '').toLowerCase().split(/[^a-z]+/).some((w) => w && (LINE_BLOCK.test(w) || (BEE_UNSAFE.test(w) && !/^snigger/.test(w))));   // Bee's pattern has no \b on one slur, so it reads "sniggered" as one

/* "Which one is a real word?" pairs a real word with three made-up ones: an onset + rime that Bee's list
   does not know. Bee's list lacks some everyday words, and some letter strings are rude or slurs, so a
   made-up rival must be neither (a child was shown "crap" and "wank" as not-words, and "that" as one). */
const NON_SKIP = new Set(('that than drug drat frag cig crit trug kame brock tock veep chook gran grig nill yall dap spag gink wack ' +
  'crap wank fap fag jap nig vag shit clit cock frig gook wop fook fock fack cack crip jip gyp slag shag twat tit bum poop prat spunk snot ' +
  'clag stan').split(' '));
export const nonWordSafe = (w) => !NON_SKIP.has(String(w).toLowerCase()) && kidSafe(w);
