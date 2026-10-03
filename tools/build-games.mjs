/* build-games.mjs — the big content pools for Sentence Builder and Punctuation Rush, CUT from the
   held texts (never typed): every sentence is an exact (whitespace-collapsed) substring of a text in
   app/public/texts/ whose work is held, cleared in all three markets (src/data/rights.js) and NOT
   waiting on a reviewer (needsReview works are skipped whole, so no band ever meets them).

   builder.json — the MAIN_CLAUSE shape of src/data/sentences.js:
     { s: 'When the bell rang, [we went out to play].', band, work, src }
     one main clause in [brackets] and exactly one subordinate clause opened by a SUBORDINATOR, either
     first (then a comma) or after the main clause, so games.js builderSentence rebuilds the book's own
     sentence exactly (a comma the book put before a trailing clause is the one thing it drops). The
     main clause is a full clause — its subject first, then a verb — and holds no second clause.
   rush.json — the COMMAS shape:
     { s, rule: 'list' | 'fronted' | 'address' | 'aside' | 'compound', band, work, src }
     (the rule names play.js already maps: an introductory opener is 'fronted', two clauses joined by
     a coordinator 'compound'). Every comma in a sentence belongs to its one rule; nothing else is
     punctuated inside it.

   The cut is strict on purpose — fewer and right beats more and debatable. A sentence is refused for
   quotation marks (except an address line, which is the words INSIDE a quotation), semicolons, colons,
   dashes, brackets, digits, italics, capitals for emphasis, archaic words (thee, hath, ere, -eth…),
   anything unkind or frightening for a six-year-old, and any shape the rules below cannot prove.
   Band: each pool is cut into equal thirds by difficulty (length, the rarest word, the average word
   length). Band 1 holds only short, plain sentences from stories (never an essay or a speech); a word
   kept for the oldest readers (war, ghost, died…) puts a sentence in band 3 whatever its length.

     node tools/build-games.mjs           → app/src/data/games/builder.json, rush.json
     node tools/build-games.mjs --check   → exits 1 if those files are not today's cut
     node tools/build-games.mjs --why     → counts of every rejection reason */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { WORKS } from '../app/src/data/library.js';
import { cleared } from '../app/src/data/rights.js';

const HERE = dirname(fileURLToPath(import.meta.url)), APP = join(HERE, '..', 'app'), OUT = join(APP, 'src', 'data', 'games');
const CHECK = process.argv.includes('--check'), WHY = process.argv.includes('--why');
export const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/* ---------------------------------------------------------------- the works */
const PROSE = new Set(['children', 'fable', 'novel', 'essay', 'speech']);
export const eligible = (w) => !!w && w.held && cleared(w) && !w.needsReview && existsSync(join(APP, 'public', 'texts', `${w.id}.txt`));
const works = WORKS.filter((w) => eligible(w) && PROSE.has(w.shelf));
const srcOf = (w) => `${String(w.author).split(', told by')[0]}, ${w.title}`;

/* ---------------------------------------------------------------- words */
const W = (s) => new Set(s.split(/\s+/).filter(Boolean));
export const SUBS = ['when', 'because', 'if', 'although', 'after', 'before', 'while', 'until', 'since', 'as', 'unless', 'once', 'whenever', 'though'];
const SUBSET = new Set(SUBS);
const PRON = W('i he she it we they you');
const DET = W('the a an his her my our their its your this that these those every each some no all both one two three many several another such either neither');
const AUX = W('am is are was were has have had do does did can could will would shall should may might must');
const IRREG = W(`ate awoke began beheld bent bit bled blew bore bought bound broke brought built burnt burst came caught chose clung crept cut dealt did drew dreamt drank drove dug dwelt fed fell felt fled flew flung forgot forgave found froze gave got grew hid held hung hurt kept knelt knew laid lay leant leapt learnt led left lent let lit lost made meant met paid put quit ran rang rode rose sang sank sat saw said sent set shook shone shot shut slept slid slung smelt sold sought spent spoke sprang spread spun stood stole stuck stung strode struck swam swept swore swung taught tore thought threw told took trod understood went wept woke won wore wound wrote
  becomes begins brings calls comes falls feels finds gets gives goes grows has hears helps holds keeps knows leaves likes lives looks loves makes means needs runs says sees seems shows sits stands takes tells thinks turns walks wants works`);
/* -ed words that are not past-tense verbs */
const NOT_ED = W('bed red fed shed sled wed bred fled led sped shred hundred sacred naked wicked kindred ragged rugged crooked beloved aged blessed wretched learned dogged jagged hatred need speed seed feed deed weed breed greed indeed steed bleed creed freed reed heed proceed exceed succeed sheltered gifted talented interested tired frightened excited pleased surprised ashamed delighted scared worried bored amazed astonished contented crowded wooded skilled loaded beaded striped spotted coloured colored');
const BEE = new Set(Object.keys(JSON.parse(readFileSync(join(APP, 'public', 'data', 'bee-words.json'), 'utf8')).words));
const LEXV = new Set(Object.entries(JSON.parse(readFileSync(join(APP, 'public', 'data', 'bee-words.json'), 'utf8')).words).filter(([w, r]) => r[2] === 'verb' && /[a-z]ed$/.test(w) && !NOT_ED.has(w)).map(([w]) => w));
const NEG = /^(don't|doesn't|didn't|can't|couldn't|won't|wouldn't|shan't|shouldn't|isn't|wasn't|aren't|weren't|hasn't|haven't|hadn't|mustn't|cannot)$/;
const isVerb = (w) => AUX.has(w) || IRREG.has(w) || NEG.test(w) || LEXV.has(w) || (/^[a-z]{3,}ed$/.test(w) && !NOT_ED.has(w) && !/eed$/.test(w));
/* a pronoun with its verb fused on: I'll, he's, they'd… */
const CONTRACT = /^(i|he|she|it|we|they|you|that|there|who)'(m|ll|d|ve|re|s)$/;
const SUBJ_WORD = W('there nobody everyone everybody someone somebody something nothing everything none');
const SING = W('he she it');
const ADV1 = W('never always often soon still only just also quite almost hardly nearly suddenly quickly slowly really soon presently immediately instantly gently quietly');
const ADV0 = W('suddenly presently soon then now immediately');
const ARCHAIC = W(`thee thou thy thine ye hath doth dost hast hadst art shalt wilt wast wert 'tis 'twas ere nay yea whence thither hither whither wherefore methinks verily forsooth unto o oh ah alas lo prithee anon aught naught nought betwixt oft fain mayhap perchance quoth`);
const UNSAFE = W(`pierce pierced pierces piercing kill kills killed killing murder murdered murderer murderers blood bloody bleed bleeding corpse corpses coffin gun guns pistol pistols rifle shot shoot shooting stab stabbed knife knives hanged hang hanging gallows whip whipped whipping flog flogged beat beating beaten drunk drunken drink drank wine beer gin rum brandy whisky ale tobacco cigar opium devil devils hell damn damned satan demon slave slaves slavery savage savages negro negroes nigger niggers indian indians gipsy gipsies gypsy gypsies jew jews cripple idiot stupid cruel cruelty torture tortured scream screamed screaming horror horrible terror blind deaf lunatic madman poison poisoned suicide execution executed thief thieves rob robbed robber robbers agony sin sins evil gore naked bible priest priests sob sobbed`);
/* spellings of speech (Joe Gargery's, Silver's, Alan Breck's): a child should not learn them as English */
const DIALECT = W(`nows thens yer gal wot nae ken dinna canna summat doo sich agin afeard onst arter sartin wery wos ses sez meantersay ain't 'em o' ha' wi' bein goin doin nothin somethin mebbe mayhap aye shipmates matey ye'll y'are hisself theirselves them's thar wal shan't'st oncommon partickler conwict wittles`);
/* fine for the oldest band (11–14), never for the first two */
const OLDER = W(`bosom arrow arrows war wars battle battles sword swords soldier soldiers enemy enemies prisoner prisoners prison fight fights fought fighting wicked witch witches ghost ghosts god gods lord lords mass pipe smoke smoked smoking hunting hunt hunted hunter hunters fool fools mad ugly fat hate hated hates kiss kissed kissing lover dead died die dies dying death deaths wound wounded pain buried bury grave graves weep wept`);
const tokens = (s) => s.split(/\s+/);
const bare = (t) => t.toLowerCase().replace(/^[^a-z]+|[^a-z']+$/g, '');

/* ---------------------------------------------------------------- the corpus */
const raw = Object.fromEntries(works.map((w) => [w.id, readFileSync(join(APP, 'public', 'texts', `${w.id}.txt`), 'utf8')]));
const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, collapse(v)]));
/* paragraphs: blank-line blocks, collapsed; a block of verse or a heading is short or ragged — skipped */
function paragraphs(text) {
  return text.split(/\n\s*\n/).filter((p) => {
    const lines = p.split('\n').filter((l) => l.trim());
    if (lines.length >= 2 && lines.slice(0, -1).some((l) => l.trim().length < 45)) return false;   // verse, lists, tables
    return /^\s{0,4}\S/.test(p) && lines.every((l) => !/^\s{6,}/.test(l));
  }).map(collapse).filter((p) => p.length > 30);
}
const ABBR = /\b(Mr|Mrs|Dr|St|Mt|Jr|Sr|Capt|Col|Gen|Lt|Prof|Rev|vs|etc|No|i\.e|e\.g)\.$/;
function sentences(p) {
  const out = []; let start = 0;
  const re = /[.!?](?=\s+[A-Z])/g; let m;
  while ((m = re.exec(p))) { const piece = p.slice(start, m.index + 1); if (ABBR.test(piece)) continue; out.push(piece.trim()); start = m.index + 1; }
  out.push(p.slice(start).trim());
  return out.filter(Boolean);
}
/* frequency of each lower-case word, and which words are names */
const freq = new Map(), capMid = new Map(), lowMid = new Map();
for (const t of Object.values(flat)) {
  const toks = t.split(' ');
  for (let i = 0; i < toks.length; i++) {
    const b = bare(toks[i]); if (!b) continue;
    freq.set(b, (freq.get(b) || 0) + 1);
    if (i > 0 && !/[.!?]["')]*$/.test(toks[i - 1])) {
      if (/^[A-Z][a-z]/.test(toks[i].replace(/^[^A-Za-z]+/, ''))) capMid.set(b, (capMid.get(b) || 0) + 1); else lowMid.set(b, (lowMid.get(b) || 0) + 1);
    }
  }
}
export const isName = (b0) => { const b = b0.replace(/'s$/, ''); return isName1(b); };
/* a word is a NAME when the corpus capitalises it mid-sentence nearly always */
const isName1 = (b) => (capMid.get(b) || 0) >= 3 && (capMid.get(b) || 0) > 9 * (lowMid.get(b) || 0) && !PRON.has(b) && !DET.has(b) && b !== 'i';
const rank = new Map([...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w], i) => [w, i + 1]));
const rankOf = (b) => (isName(b) ? 1 : b.includes('-') ? Math.max(...b.split('-').filter(Boolean).map(rankOf)) : rank.get(b.replace(/'s$/, '')) || rank.get(b) || 1e9);

/* ---------------------------------------------------------------- shared refusals */
function refuse(s) {
  if (!/^[A-Z]/.test(s)) return 'not a capital start';
  if (!/[a-z][.!?]$/.test(s)) return 'odd ending';
  if (/["“”‘’]/.test(s) || /(^|\s)'|'(\s|[.,!?]|$)/.test(s)) return 'quotation marks';
  if (/[;:()[\]{}_*\d&/\\]/.test(s) || /--|—|–| - /.test(s)) return 'semicolon, colon, dash, bracket or digit';
  if (/\b[A-Z]{2,}\b/.test(s)) return 'capitals for emphasis';
  if (/\w- |\s-\w/.test(s)) return 'a broken word';
  { const T = tokens(s); if (T.some((t, i) => i > 0 && /^[A-Z][a-z]/.test(t) && !/^I('|$)/.test(t) && (capMid.get(bare(t).replace(/'s$/, '')) || 0) < 3 && !/^[A-Z]/.test(T[i + 1] || '') && !(i > 1 && /^[A-Z]/.test(T[i - 1])) && !/[.!?]$/.test(T[i - 1]))) return 'a capital that is not a name'; }
  if (/(^|\s)[A-Z]\./.test(s) || /\b(St|Mt)\b/.test(s)) return 'initials';
  const ws = tokens(s).map(bare);
  if (ws.some((w) => ARCHAIC.has(w) || /^[a-z]{3,}eth$/.test(w) && !/^(teeth|beneath|elizabeth|macbeth)$|ieth$/.test(w) || /^[a-z]+'st$|^(canst|couldst|wouldst|shouldst|didst|art|doest|knowest)$/.test(w))) return 'archaic';
  const parts = ws.flatMap((w) => w.replace(/'s$/, '').split('-'));
  if (parts.some((w) => UNSAFE.has(w))) return 'not for a young child';
  if (ws.some((w) => w.replace(/'s$/, '').length > 13)) return 'a very long word';
  if (ws.some((w) => /'/.test(w) && !/^[a-z]+'(s|ll|re|ve|d|m)$/.test(w) && !/^(do|does|did|ca|could|wo|would|sha|should|is|was|are|were|has|have|had|must|need|might)n't$/.test(w))) return 'dialect';
  if (ws.some((w) => /^a-[a-z]+ing$/.test(w) || DIALECT.has(w))) return 'dialect';
  return null;
}
/* A full clause: a subject at its start (pronoun, a determiner phrase, or a name), then a verb within
   a few words. Returns the index of the verb, or -1. `lead` says whether the first word was the
   sentence's own capital (so a capital proves nothing about a name). */
const BASE = W('go come see get take make know think look want give use find tell ask work seem feel try leave call keep let begin help show hear play run move live believe bring happen write sit stand lose pay meet like love need hope wish say do have be eat sleep walk talk turn stay wait read sing laugh fall grow open close mean remember understand speak carry hold follow stop learn reach build climb catch jump swim fly ride buy sell send cut wear win break draw drive choose forget forgive hide');
const NOT_SUBJ = W('and or but who which that to of in on at by for with from not then there here so very too also only just even yet now');
function clause(ws, raw, lead = false) {
  if (!ws.length) return -1;
  let i = 0;
  if (ADV0.has(ws[0]) && ws.length > 2) i = 1;            // "when suddenly they came"
  const w0 = ws[i], r0 = (raw[i] || '').replace(/^[^A-Za-z]+/, '');
  if (CONTRACT.test(w0)) return i;
  if (PRON.has(w0) || SUBJ_WORD.has(w0)) {
    i++;
    if (i < ws.length && ADV1.has(ws[i])) i++;
    if ((SING.has(w0) || SUBJ_WORD.has(w0)) && i < ws.length && /^[a-z]{3,}[^s]s$/.test(ws[i]) && !/(ous|ss|us|is)$/.test(ws[i])) return i;
    if (['i', 'you', 'we', 'they'].includes(w0) && i < ws.length && BASE.has(ws[i])) return i;
  } else if (DET.has(w0) || isName(w0) && /^[A-Z]/.test(r0)) {
    if (isName(w0) && !DET.has(w0) && !lead && i === 0 && !/^[A-Z]/.test(raw[0])) return -1;
    const s0 = i; i++;
    if (/^(a|an|the|his|her|my|our|their|its|your|every|another)$/.test(w0)) i++;   // an article needs its noun: "a bit" is no clause
    while (i < ws.length && i - s0 < 7 && !isVerb(ws[i]) && !SUBSET.has(ws[i]) && !PRON.has(ws[i]) && !NOT_SUBJ.has(ws[i]) && !/ly$/.test(ws[i]) || i < ws.length && ['of', 'in', 'on', 'at', 'with', 'from'].includes(ws[i]) && i - s0 < 5 && i + 1 < ws.length && !isVerb(ws[i + 1])) i++;
    if (i < ws.length && ADV1.has(ws[i])) i++;
  } else if (/^[a-z]+s$/.test(w0) && !NOT_SUBJ.has(w0) && i + 1 < ws.length && isVerb(ws[i + 1]) && !isVerb(w0) && /^[a-z]/.test(r0)) {
    return i + 1;                                         // "when people came" — a bare plural subject, lower case
  } else return -1;
  if (i < ws.length && ws[i] === 'not') i++;
  return i < ws.length && isVerb(ws[i]) ? i : -1;
}
const words = (s) => tokens(s).map(bare);
const len = (s) => tokens(s).length;
/* Difficulty: length, the rarest word (corpus frequency rank; names count as common) and the average
   word length. `floor` is the lowest band a sentence may sit in: band 1 is short, plain and from a story
   (never an essay or a speech); a word kept for the oldest band (OLDER) puts it in band 3. The bands are
   then cut as equal thirds of each pool by difficulty (spread), each item no lower than its floor. */
function bandOf(s, w) {
  const ws = words(s).filter(Boolean), n = ws.length;
  const rare = Math.max(...ws.map(rankOf)), avg = ws.reduce((a, x) => a + x.length, 0) / n;
  const score = n + (rare > 2500 ? 2 : 0) + (rare > 6000 ? 3 : 0) + (rare > 15000 ? 3 : 0) + Math.max(0, avg - 4) * 4;
  let floor = 1;
  if (w.shelf === 'essay' || w.shelf === 'speech' || n > 15 || rare > 8000 || ws.some((x) => x.length > 10)) floor = 2;
  if (ws.some((x) => x.replace(/'s$/, '').split('-').some((y) => OLDER.has(y)))) floor = 3;
  return { score, floor };
}
function spread(pool) {
  const by = pool.slice().sort((a, b) => a.d.score - b.d.score || (a.s < b.s ? -1 : 1)), third = Math.ceil(pool.length / 3);
  let n1 = 0, n2 = 0;
  for (const x of by) {
    if (x.d.floor <= 1 && n1 < third) { x.band = 1; n1++; } else if (x.d.floor <= 2 && n2 < third) { x.band = 2; n2++; } else x.band = 3;
  }
  for (const x of pool) delete x.d;
}

/* ---------------------------------------------------------------- Sentence Builder */
const BEFORE_SUB = W('just even only so as such ever soon shortly right not and but or that than long almost nearly hours days minutes weeks years months moments time later earlier');
const AFTER_SUB = { as: W('if though soon well long much far many to for good usual it yet regards'), once: W('more again upon'), since: W('then'), before: W('long that'), after: W('all that'), when: W('that') };
/* "She asked me if I knew" — an object clause, not an adverb clause: turned round it breaks */
const ASKING = W('ask asked asking wonder wondered wondering know knew known knows see saw seen tell told inquire inquired doubt doubted care cared sure question learn learned judge find found try tried look looked hear heard remember remembered forget forgot say said decide decided show showed guess guessed mind matter idea notice noticed understand understood');
const THINK = W('recall forget forgot guess ask inquire learn learned understand understood decide decided notice noticed thought think thinks believe believed suppose supposed knew know felt feel said say says hope hoped expect expected fancied fancy saw see heard hear remember remembered wish wished found find told tell declared replied answered cried exclaimed added asked wondered doubt imagine imagined');
const COMPARE = W('so such same as more less rather than well soon long much');
const OPENERS = /^(The|A|An|My|Our|Your|His|Her|Its|Their|We|They|He|She|It|You|Everyone|Everybody|Nobody|No|This|That|These|Those|Some|All|Every|Each|Most|Many|Both|Grandma|Grandpa|Mum|Dad|There)\b/;
/* a main clause may carry a list or an aside inside its own commas, never a second clause */
function oneClause(toks) {
  const chunks = []; let cur = [];
  for (const t of toks) { cur.push(t); if (t.endsWith(',')) { chunks.push(cur); cur = []; } }
  chunks.push(cur);
  if (chunks.length > 3) return false;
 const all = words(toks.join(' '));
  /* "… and it'll be an hour": a second clause joined without a comma */
  if (all.some((x, j) => j > 0 && (COORD_ALL.has(x) || x === 'and') && clause(all.slice(j + 1), toks.slice(j + 1)) >= 0)) return false;
  /* "when it happened I could…": a second subject and verb after the first verb */
  const v = clause(all, toks, true), NOM = W('i he she we they');
  if (v >= 0 && all.some((x, j) => j > v && NOM.has(x) && !['that', 'which', 'who', 'whom', 'what', 'how', 'why', 'where', 'whose'].includes(all[j - 1]) && j + 1 < all.length && (isVerb(all[j + 1]) || ADV1.has(all[j + 1])))) return false;
  return chunks.slice(1).every((c) => { const ws = words(c.join(' ')); return ws.length >= 2 && !COORD_ALL.has(ws[0]) && !isVerb(ws[0]) && !PRON.has(ws[0]) && clause(ws, c) < 0 && !ws.some((x) => SUBSET.has(x)); });
}
const COORD_ALL = W('and but so yet or nor for then while whereupon');
function builder(s, w) {
  if (!/[.!]$/.test(s)) return ['not a statement'];
  const n = len(s); if (n < 5 || n > 24) return ['length'];
  const toks = tokens(s), ws = words(s);
  if (s.endsWith('!') && !OPENERS.test(s) && !/^I\b/.test(s) && !SUBSET.has(ws[0])) return ['an exclamation'];
  /* "as well", "such as", "as white as", "at once", "once more", "after all", "ever since" are no clause boundary */
  const fixed = (x, i) => x === 'as' && (ws[i + 1] === 'well' || ws[i - 1] === 'such' || ws[i + 2] === 'as' && !SUBSET.has(ws[i + 1]) || ws[i - 2] === 'as' && i >= 2 && ws[i - 2] !== ws[0] + '!' && i - 2 !== 0)
    || x === 'once' && (ws[i - 1] === 'at' || ws[i + 1] === 'more' || ws[i + 1] === 'again')
    || x === 'after' && ws[i + 1] === 'all';
  const subIdx = ws.map((x, i) => (SUBSET.has(x) && !fixed(x, i) ? i : -1)).filter((i) => i >= 0);
  if (ws.some((x, i) => x === 'as' && (ws[i + 1] === 'if' || ws[i + 1] === 'though' || ws[i + 1] === 'soon' || ws[i + 1] === 'long'))) return ['a joining phrase'];
  if (subIdx.length !== 1) return [subIdx.length ? 'more than one subordinator' : 'no subordinator'];
  const k = subIdx[0], sub = ws[k];
  if (!/^[A-Za-z]+$/.test(toks[k])) return ['punctuation on the joining word'];
  if (ws.includes('whether') || ws.includes('so') && ws[ws.indexOf('so') + 1] === 'that') return ['another joining word'];
  if ((AFTER_SUB[sub] || new Set()).has(ws[k + 1])) return ['not a clause boundary'];
  const commas = (s.match(/,/g) || []).length;
  if (k === 0) {
    // front: Sub dep, main.
    const ci = toks.findIndex((t) => t.endsWith(','));
    if (ci < 0) return ['front: no comma'];
    const dep = toks.slice(1, ci + 1), main = toks.slice(ci + 1);
    if (!oneClause(main)) return ['front: more than one clause after the comma'];
    if (dep.length < 2 || main.length < 2) return ['too short a clause'];
    if (!oneClause([...dep.slice(0, -1), dep[dep.length - 1].replace(/,$/, '')])) return ['front: more than one clause before the comma'];
    if (clause(words(dep.join(' ')), dep) < 0) return ['dependent part is not a clause'];
    if (clause(words(main.join(' ')), main) < 0) return ['main part is not a clause'];
    if (/^[A-Z]/.test(main[0]) && !isName(bare(main[0])) && main[0] !== 'I') return ['main clause capital'];
    if (sub === 'as' && words(main.join(' ')).some((x) => COMPARE.has(x))) return ['a comparison, not a clause'];
    const ml = words(main.join(' ')).filter(Boolean).pop();
    if (AUX.has(ml) || /^(not|so|as|too|very|be|been|being)$/.test(ml)) return ['the main clause is not finished'];
    const depS = dep.join(' ').replace(/,$/, ''), mainS = main.join(' ').replace(/[.!]$/, '');
    return [null, `${toks[0]} ${depS}, [${mainS}]${s.slice(-1)}`];
  }
  // end: main sub dep. — no comma, or one just before the joining word (games.js drops it; the rest is exact)
  if (BEFORE_SUB.has(ws[k - 1])) return ['not a clause boundary'];
  const main = toks.slice(0, k), dep = toks.slice(k + 1), mw = ws.slice(0, k);
  if (dep.some((t) => t.includes(','))) return ['end: a comma in the dependent clause'];
  if (sub === 'as' && main[main.length - 1].endsWith(',') && dep.length <= 4) return ['an aside, not a clause'];
  if (!oneClause(dep)) return ['end: more than one clause after the joining word'];
  if (!oneClause(main[main.length - 1].endsWith(',') ? [...main.slice(0, -1), main[main.length - 1].slice(0, -1)] : main)) return ['end: more than one clause before the joining word'];
  if (main.length < 3 || dep.length < 2) return ['too short a clause'];
  if (main[main.length - 1].endsWith(',') && dep.some((t) => t.endsWith(','))) return ['a clause set off inside the sentence'];
  if (clause(mw, main, true) < 0) return ['main part is not a clause'];
  if (clause(ws.slice(k + 1), dep) < 0) return ['dependent part is not a clause'];
  if (!(OPENERS.test(main[0]) || main[0] === 'I' || isName(bare(main[0])))) return ['main clause opener'];
  if (/^(Grandma|Grandpa|Mum|Dad)$/.test(main[0])) return ['main clause opener'];
  if ((sub === 'if' || sub === 'when' || sub === 'whenever' || sub === 'once') && mw.some((x) => ASKING.has(x))) return ['an object clause, not an adverb clause'];
  if (THINK.has(mw[mw.length - 1])) return ['the main clause wants an object'];
  if (AUX.has(mw[mw.length - 1]) || ADV1.has(mw[mw.length - 1]) || /^(not|so|as|too|very|is|be|been|being|seem|seemed|looked|became|become|felt)$/.test(mw[mw.length - 1])) return ['the main clause is not finished'];
  if (mw.some((x) => x === 'that' || x === 'which' || x === 'who' || x === 'what' || x === 'how' || x === 'where')) return ['a clause inside the main clause'];
  if (sub === 'as' && mw.some((x) => COMPARE.has(x))) return ['a comparison, not a clause'];
  if (mw[0] === 'it' && (mw[1] === 'was' || mw[1] === 'is') && (sub === 'when' || sub === 'since' || sub === 'before' || sub === 'after')) return ['a cleft'];
  return [null, `[${main.join(' ').replace(/,$/, '')}]${main[main.length - 1].endsWith(',') ? ',' : ''} ${toks[k]} ${dep.join(' ')}`];
}

/* ---------------------------------------------------------------- Punctuation Rush */
const COORD = W('and but so yet or');
const PREP = W('in at on after before during with without under over across through behind beside near by from into upon along among around beyond inside outside towards toward against above below beneath between since until');
const TRANSITION = W('suddenly finally meanwhile however unfortunately fortunately luckily afterwards instead naturally gradually slowly quickly quietly soon');
const RELATION = W('friend friends brother sister master mistress servant man woman boy girl son daughter father mother uncle aunt cousin doctor captain name husband wife king queen lord lady companion neighbour neighbor child children guest host partner fellow colleague nephew niece grandfather grandmother sir madam');
const VOC = W('mother father children boys girls grandmother grandfather uncle aunt sister brother captain doctor teacher friends');
function itemOK(seg) {   // one list item: 1–3 words, no verb, no pronoun, no joining word, no preposition first
  const ws = words(seg); if (!ws.length || ws.length > 3) return false;
  if (PREP.has(ws[0]) || ['of', 'for', 'to', 'as', 'than', 'like', 'very', 'so', 'too', 'both', 'either', 'neither', 'all', 'save', 'except'].includes(ws[0])) return false;
  return !ws.some((x) => isVerb(x) || PRON.has(x) || SUBSET.has(x) || COORD.has(x) || ['who', 'which', 'that', 'then', 'there', 'to', 'not', 'no', 'doubt', 'nor'].includes(x) || /ly$/.test(x) || /ing$/.test(x));
}
function rush(s, w, inner = false) {
  const n = len(s); if (n < 5 || n > 24) return ['length'];
  const toks = tokens(s), ws = words(s), commas = toks.map((t, i) => (t.endsWith(',') ? i : -1)).filter((i) => i >= 0);
  if (!commas.length) return ['no comma'];
  if (ws.some((x) => ['oh', 'well', 'yes', 'no', 'why', 'now', 'indeed', 'perhaps', 'however', 'besides', 'still', 'then', 'there', 'here', 'say', 'please', 'sir', 'madam', 'dear'].includes(x) && toks[ws.indexOf(x)].endsWith(','))) {
    if (!(TRANSITION.has(ws[0]) && commas.length === 1 && commas[0] === 0)) return ['an interjection or a doubtful comma'];
  }
  /* no comma is missing: no two clauses joined by a coordinator without one */
  if (ws.some((x, j) => j > 0 && COORD.has(x) && !toks[j - 1].endsWith(',') && clause(ws.slice(j + 1), toks.slice(j + 1)) >= 0)) return ['a comma is missing before a joined clause'];
  const segs = []; let a = 0; for (const c of commas) { segs.push(toks.slice(a, c + 1).join(' ').replace(/,$/, '')); a = c + 1; } segs.push(toks.slice(a).join(' '));
  const last = segs[segs.length - 1].replace(/[.!?]$/, '');
  // address: a name at the start or the end, set off by its one comma (the words inside a quotation)
  if (inner) {
    if (commas.length !== 1) return ['address: not one comma'];
    const head = segs[0], tail = last, isVoc = (seg) => { const t = tokens(seg); return t.length <= 2 && t.every((x) => /^[A-Z][a-z]+$/.test(x) && (isName(x.toLowerCase()) || VOC.has(x.toLowerCase()))) && !t.some((x) => PRON.has(x.toLowerCase()) || DET.has(x.toLowerCase())); };
    if (isVoc(head) && tokens(tail).length >= 3 && !isVoc(tail)) {
      const rest = words(tail); if (!(clause(rest, tokens(tail)) >= 0 || isVerb(rest[0]) || /^(come|go|look|run|stop|wait|help|tell|give|take|let|be|do|don't|sit|stand|listen|hurry|bring|show|get|put|keep|try|see|make)$/.test(rest[0]))) return ['address: rest is not a clause'];
      return [null, 'address'];
    }
    if (isVoc(tail) && tokens(head).length >= 3 && !isVoc(head)) {
      const rest = words(head);
      if (RELATION.has(rest[rest.length - 1]) || !(rest.some((x) => /^(you|your|yourself|you're|you'll|you've|you'd)$/.test(x)) || /[?!]$/.test(s) || /^(come|go|look|let|tell|give|take|wait|stop|listen)$/.test(rest[0]))) return ['address: the name may be an apposition']; if (!(clause(rest, tokens(head), true) >= 0 || /^(come|go|look|run|stop|wait|help|tell|give|take|let|be|do|don't|sit|stand|listen|hurry|bring|show|get|put|keep|try|see|make|what|where|how|why|who|can|will|would|could|are|is|did|do|have|thank)$/.test(rest[0]))) return ['address: rest is not a clause'];
      return [null, 'address'];
    }
    return ['address: no name set off'];
  }
  // compound: clause, coordinator clause
  if (commas.length === 1 && COORD.has(words(segs[1])[0]) && !/^and$/.test(words(segs[1])[0]) || commas.length === 1 && words(segs[1])[0] === 'and' && clause(words(segs[1]).slice(1), tokens(segs[1]).slice(1)) >= 0) {
    const L = words(segs[0]), R = words(segs[1]).slice(1);
    if (L.length < 4 || R.length < 3) return ['compound: a side too short'];
    if (clause(L, tokens(segs[0]), true) < 0) return ['compound: first part is not a clause'];
    if (clause(R, tokens(segs[1]).slice(1)) < 0) return ['compound: second part is not a clause'];
    if (R[0] === 'that' || words(segs[1])[0] === 'so' && R[0] === 'that') return ['compound: so that'];
    if (ws.some((x, i) => i > 0 && SUBSET.has(x))) return ['compound: a subordinate clause too'];
    if (/^[A-Z]/.test(tokens(segs[1])[1]) && !isName(R[0]) && tokens(segs[1])[1] !== 'I') return ['compound: capital'];
    return [null, 'compound'];
  }
  // fronted: an opener, then the main clause
  if (commas.length === 1 && commas[0] <= 10) {
    const op = words(segs[0]), main = words(segs[1]), w0 = op[0];
    const ok = (SUBSET.has(w0) && clause(op.slice(1), tokens(segs[0]).slice(1)) >= 0)
      || (PREP.has(w0) && op.length >= 4 && !op.some(isVerb) && !op.some((x) => PRON.has(x)))
      || (op.length === 1 && TRANSITION.has(w0))
      || (/ing$/.test(w0) && op.length >= 2 && op.length <= 6 && !op.slice(1).some(isVerb) && !op.some((x) => PRON.has(x) && x !== 'it' && x !== 'you') && !['nothing', 'something', 'everything', 'anything', 'morning', 'evening', 'king', 'thing', 'spring', 'ring', 'sing', 'bring', 'wing', 'string'].includes(w0));
    if (ok) {
      if (clause(main, tokens(segs[1])) < 0) return ['fronted: main part is not a clause'];
      if (main.slice(1).some((x) => SUBSET.has(x)) || main.some((x) => COORD.has(x) && x !== 'and')) return ['fronted: more inside'];
      if (/^[A-Z]/.test(tokens(segs[1])[0]) && !isName(main[0]) && !/^I('|$)/.test(tokens(segs[1])[0])) return ['fronted: capital'];
      return [null, 'fronted'];
    }
  }
  // aside: subject, aside, the rest of the main clause
  if (commas.length === 2) {
    const subj = words(segs[0]), mid = words(segs[1]), rest = words(segs[2]);
    const subjOK = subj.length <= 5 && !subj.some(isVerb) && !subj.some((x) => SUBSET.has(x) || COORD.has(x)) && (DET.has(subj[0]) || isName(subj[0]) || PRON.has(subj[0]) && subj.length === 1);
    const midOK = (['who', 'which'].includes(mid[0]) && mid.slice(1).some(isVerb) && mid.length <= 10)
      || (['however', 'therefore', 'perhaps', 'indeed'].includes(mid[0]) && mid.length === 1)
      || (['a', 'an', 'the'].includes(mid[0]) && mid.length <= 6 && !mid.some(isVerb) && isName(subj[0]) && subj.length <= 2);
    if (subjOK && midOK && isVerb(rest[0]) && !rest.some((x) => SUBSET.has(x))) return [null, 'aside'];
  }
  // list: … A, B, C and D. — four or more short, alike items at the end of a sentence whose clause comes first
  {
    const lw = last.split(' '), andAt = lw.findIndex((x) => x === 'and');
    if (andAt > 0 && segs.length >= 3 && lw.filter((x) => x === 'and' || x === 'or').length === 1) {
      const xn = lw.slice(0, andAt).join(' '), y = lw.slice(andAt + 1).join(' '), mids = segs.slice(1, -1), items = [...mids, xn, y];
      const detd = (seg) => DET.has(words(seg)[0]);
      const short = segs.length === 2 ? items.every((x) => words(x).length <= 2) && !words(segs[0]).some((x) => /^(two|three|four|five|six|both|pair|couple|namely|several)$/.test(x)) : true;
      if (short && items.every(itemOK) && (items.every(detd) || items.every((x) => !detd(x)))) {
        const first = words(segs[0]), lastFirst = first[first.length - 1];
        if (clause(first, tokens(segs[0]), true) >= 0 && !first.some((x) => SUBSET.has(x) || COORD.has(x)) && !PREP.has(lastFirst) && !isVerb(lastFirst) && !PRON.has(lastFirst) && !/ly$/.test(lastFirst)
          && (items.every(detd) ? DET.has(first[first.length - 2]) || DET.has(first[first.length - 3]) : !DET.has(first[first.length - 2]) || first.length >= 3)) return [null, 'list'];
      }
    }
    return ['no rule fits every comma'];
  }
}
/* the sentences inside a quotation: "Toto, come here!" (double marks, or single marks between spaces) */
function quoted(text) {
  const spans = [];
  for (const m of text.matchAll(/(?:^|\s)["“]([^"“”]{8,400}?)["”](?=[\s,.!?;:]|$)/g)) spans.push(m[1]);
  for (const m of text.matchAll(/(?:^|\s)['‘]([A-Z](?:[^'‘’]|[A-Za-z]'[a-z]){8,400}?[.!?,])['’](?=[\s.;:]|$)/g)) spans.push(m[1]);
  const out = [];
  for (const sp of spans) {
    const ss = sentences(sp);
    ss.forEach((q, i) => { if (/[.!?]$/.test(q) && /^[A-Z]/.test(q)) out.push(q); });
  }
  return out;
}

/* ---------------------------------------------------------------- the cut */
const why = new Map(), tally = (r) => why.set(r, (why.get(r) || 0) + 1);
const B = [], R = [], seen = new Set();
for (const w of works) {
  const paras = paragraphs(raw[w.id]);
  for (const p of paras) {
    for (const s of sentences(p)) {
      const key = collapse(s).toLowerCase(); if (seen.has(key)) continue;
      const r = refuse(s); if (r) { tally(r); continue; }
      const band = 0, d = bandOf(s, w);
      const [rb, out] = builder(s, w), [rr, rule] = rush(s, w);
      if (!rb) B.push({ s: out, band, d, work: w.id, src: srcOf(w) });
      if (!rr) R.push({ s, rule, band, d, work: w.id, src: srcOf(w) });
      if (rb) tally('builder: ' + rb); if (rr) tally('rush: ' + rr);
      if (!rb || !rr) { seen.add(key); continue; }
    }
    for (const q of quoted(p)) {
      const key = collapse(q).toLowerCase(); if (seen.has(key)) continue;
      const r = refuse(q); if (r) continue;
      if (words(q).some((x) => x && !isName(x) && (freq.get(x) || 0) <= 3 && !BEE.has(x.replace(/'s$/, '')))) continue;
      const band = 0, d = bandOf(q, w);
      const [rr, rule] = rush(q, w, true), [rb, out] = builder(q, w);
      if (!rr) R.push({ s: q, rule, band, d, work: w.id, src: srcOf(w) });
      if (!rb) B.push({ s: out, band, d, work: w.id, src: srcOf(w) });
      if (!rr || !rb) seen.add(key);
    }
  }
}
/* every item is exact in its text, or it does not ship */
const plain = (s) => s.replace(/[[\]]/g, '');
const exact = (x) => flat[x.work].includes(plain(x.s));
const lost = [...B, ...R].filter((x) => !exact(x));
if (lost.length) { console.error('build-games: not exact in its text:', lost.slice(0, 5)); process.exit(1); }

spread(B); spread(R);
const order = (a, b) => a.band - b.band || (a.work < b.work ? -1 : a.work > b.work ? 1 : 0) || (a.s < b.s ? -1 : 1);
B.sort(order); R.sort(order);
const files = { 'builder.json': JSON.stringify(B, null, 0).replace(/},{/g, '},\n{') + '\n', 'rush.json': JSON.stringify(R, null, 0).replace(/},{/g, '},\n{') + '\n' };
const count = (a, f) => [1, 2, 3].map((b) => a.filter((x) => x.band === b && (!f || f(x))).length).join('/');
const rules = [...new Set(R.map((x) => x.rule))].map((r) => `${r} ${count(R, (x) => x.rule === r)}`).join(', ');
if (CHECK) {
  const stale = Object.entries(files).filter(([f, body]) => !existsSync(join(OUT, f)) || readFileSync(join(OUT, f), 'utf8') !== body);
  if (stale.length) { console.error('build-games: stale — run node tools/build-games.mjs:', stale.map(([f]) => f).join(', ')); process.exit(1); }
  console.log('build-games: up to date');
} else {
  mkdirSync(OUT, { recursive: true });
  for (const [f, body] of Object.entries(files)) writeFileSync(join(OUT, f), body);
  console.log(`build-games: builder ${B.length} (bands ${count(B)}), rush ${R.length} (bands ${count(R)}; ${rules}) from ${works.length} works`);
}
if (WHY) for (const [r, c] of [...why.entries()].sort((a, b) => b[1] - a[1])) console.log(String(c).padStart(7), r);


