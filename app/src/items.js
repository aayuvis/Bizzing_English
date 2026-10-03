/* items.js — every question the app asks, generated from data and checked by test/items.mjs:
   one right answer, distinct options, the answer never in the prompt, answer slots even.

   Item types beyond multiple choice (SPEC §6.2 — English must lead the family on item variety):
     mc       choose one                       tapmulti  tap every word that is a…
     gaps     tap the gap(s) between words     caps      tap the words that need a capital
     chunk    tap the part of the sentence     order     tap the words into order
     type     type the combined sentence       copy      copy a line exactly (checked by kind of error)

   ctx = { band, lex } — lex is Bee's lexicon (bee-words.json), loaded before a Word stop runs.
   An item's id is its seed: the same id always draws the same options in the same order. */

import { rng, pick, shuffle, sample, permute, hash } from './rand.js';
import WRITING from './data/writing.js';
import { AUTHORED, AUTHORED_STOPS } from './authored.js';
import { imitate as imitateCheck, SHAPES } from './writing.js';
import * as SB from './data/sentences.js';
import * as WP from './data/wordparts.js';
import { LINES as ALL_LINES, WORKS } from './data/library.js';
import { cleared } from './data/rights.js';
const LINES = ALL_LINES.filter((l) => cleared(WORKS.find((w) => w.id === l.work)));

const q = (s) => `“${s}”`;
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const byBand = (list, band) => { const b = list.filter((x) => !x.band || x.band <= band); return b.length >= 8 ? b : list; };
const norm = (s) => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const lexOf = (ctx) => ctx.lex?.words || {};
const DEF = 0, PS = 2, Y = 3, ORIGIN = 4, ETYM = 5;

function mc(id, kind, prompt, right, wrongs, extra = {}) {
  const { options, answer } = permute(id, [right, ...wrongs]);
  return { id, kind, type: 'mc', prompt, options, answer, ...extra };
}

/* ---------------- the Word strand ---------------- */

const OTHER_RIME = (r) => WP.RIMES.filter((x) => x.rime !== r.rime && x.rime.slice(-2) !== r.rime.slice(-2));

const GEN = {
  rhyme: {
    keys: () => WP.RIMES.flatMap((r) => r.words.map((_, i) => `${r.rime}:${i}`)),
    make(key) {
      const [rime, i] = key.split(':'); const r = WP.RIMES.find((x) => x.rime === rime); const R = rng(key);
      const t = r.words[+i], right = r.words[(+i + 1 + Math.floor(R() * (r.words.length - 1))) % r.words.length];
      const wr = sample(R, OTHER_RIME(r).flatMap((x) => x.words).filter((w) => !w.endsWith(rime)), 3);
      return mc('rhyme:' + key, 'rhyme', `Which word rhymes with ${q(t)}?`, right, wr,
        { hint: ['Say the word aloud.', 'Listen to how it ENDS, not how it starts.'], explain: `${q(right)} rhymes with ${q(t)}: both end in “-${rime}”.` });
    },
  },
  onset: {
    keys: (ctx) => WP.RIMES.filter((r) => (ctx.lex?.rimes?.[r.rime]?.non || []).length >= 3).flatMap((r) => r.words.map((w, i) => (w === r.rime ? null : `${r.rime}:${i}`)).filter(Boolean)),
    make(key, ctx) {
      const [rime, i] = key.split(':'); const r = WP.RIMES.find((x) => x.rime === rime);
      const right = r.words[+i], wr = sample(rng(key), ctx.lex.rimes[rime].non, 3);
      return mc('onset:' + key, 'onset', 'Which one is a real word?', right, wr,
        { sub: `Every one ends in “-${rime}”.`, hint: ['Read each one aloud.', 'Which have you heard someone say?'], explain: `${q(right)} is a real word. The others are not words in our dictionary.` });
    },
  },
  oddrime: {
    keys: () => WP.RIMES.filter((r) => r.words.length >= 4).flatMap((r) => r.words.map((_, i) => `${r.rime}:${i}`)),
    make(key) {
      const [rime, i] = key.split(':'); const r = WP.RIMES.find((x) => x.rime === rime); const R = rng(key);
      const fam = sample(R, r.words.filter((_, j) => j !== +i), 2).concat(r.words[+i]);
      const odd = pick(R, OTHER_RIME(r).flatMap((x) => x.words).filter((w) => !w.endsWith(rime)));
      return mc('oddrime:' + key, 'oddrime', `Which word is NOT in the “-${rime}” family?`, odd, fam,
        { hint: ['Look at the end of each word.'], explain: `${q(odd)} does not end in “-${rime}”.` });
    },
  },
  def2word: {
    keys: (ctx) => (ctx.lex?.pools?.def || []).filter((w) => (lexOf(ctx)[w]?.[Y] || 9) <= (ctx.band === 1 ? 2 : 3)),
    make(key, ctx) {
      const L = lexOf(ctx), t = L[key], wr = defDistractors(key, ctx, 3);
      return mc('def2word:' + key, 'def2word', cap1(t[DEF]), key, wr,
        { sub: 'Which is it?', hint: ['Read the whole meaning.', 'Try each word in a sentence in your head.'], explain: `${q(key)} means: ${t[DEF]}` });
    },
  },
  word2def: {
    keys: (ctx) => GEN.def2word.keys(ctx),
    make(key, ctx) {
      const L = lexOf(ctx), wr = defDistractors(key, ctx, 3).map((w) => cap1(L[w][DEF]));
      return mc('word2def:' + key, 'word2def', `What does ${q(key)} mean?`, cap1(L[key][DEF]), wr,
        { hint: ['Think of a sentence you have heard it in.'], explain: `${q(key)} means: ${L[key][DEF]}`, say: key });
    },
  },
  prefixMeaning: affixMeaning('prefixMeaning', () => WP.PREFIXES, (a) => a.p, (a) => `${a.p}-`),
  suffixMeaning: affixMeaning('suffixMeaning', () => WP.SUFFIXES, (a) => a.s, (a) => `-${a.s}`),
  prefixMake: affixMake('prefixMake', () => WP.PREFIXES, (a) => a.p, 'prefixNon', (a) => `${a.p}-`),
  suffixMake: affixMake('suffixMake', () => WP.SUFFIXES, (a) => a.s, 'suffixNon', (a) => `-${a.s}`),
  rootMeaning: {
    keys: (ctx) => byBand(WP.ROOTS, ctx.band).map((r) => r.root),
    make(key) {
      const r = WP.ROOTS.find((x) => x.root === key), R = rng(key), ex = pick(R, r.words);
      const wr = sample(R, uniq(WP.ROOTS.filter((x) => x.root !== key && norm(x.meaning) !== norm(r.meaning)).map((x) => x.meaning)), 3);
      return mc('rootMeaning:' + key, 'rootMeaning', `The root ${q(r.root)}, as in ${q(ex)}, means…`, r.meaning, wr,
        { hint: ['Think of other words with the same root.', 'What do they have in common?'], explain: `${q(r.root)} comes from ${r.from} and means “${r.meaning}”.`, source: r.source });
    },
  },
  rootFind: {
    keys: (ctx) => byBand(WP.ROOTS, ctx.band).flatMap((r) => r.words.map((w, i) => (r.root.split(/\s*\/\s*/).includes(w) || norm(r.meaning).split(' ').includes(w) ? null : `${r.root}:${i}`)).filter(Boolean)),
    make(key) {
      const [root, i] = key.split(':'); const r = WP.ROOTS.find((x) => x.root === root), R = rng(key), right = r.words[+i];
      const wr = sample(R, uniq(WP.ROOTS.filter((x) => x.root !== root).flatMap((x) => x.words)).filter((w) => !w.includes(root) && w !== right), 3);
      return mc('rootFind:' + key, 'rootFind', `Which word is built on the root ${q(root)} — “${r.meaning}”?`, right, wr,
        { hint: ['Look inside each word for the root.', 'Check the meaning fits.'], explain: `${q(right)} is built on ${q(root)}, from ${r.from}, “${r.meaning}”.`, source: r.source });
    },
  },
  origin: {
    keys: (ctx) => (ctx.lex?.pools?.origin || []).filter((w) => (lexOf(ctx)[w]?.[Y] || 9) <= (ctx.band === 1 ? 3 : 5)),
    make(key, ctx) {
      const t = lexOf(ctx)[key], R = rng(key), langs = ['French', 'Latin', 'Greek', 'Hindi', 'Arabic', 'Spanish', 'Italian', 'German', 'Dutch', 'Old Norse', 'Japanese', 'Persian'];
      const wr = sample(R, langs.filter((l) => l !== t[ORIGIN]), 3);
      return mc('origin:' + key, 'origin', `Which language did English borrow ${q(key)} from?`, t[ORIGIN], wr,
        { sub: cap1(t[DEF]), hint: ['Look at the shape of the word.', 'Where might you meet the thing it names?'], explain: `${q(key)} came into English from ${t[ORIGIN]}.${t[ETYM] ? ' ' + t[ETYM] : ''}`, source: 'Bizzing Bee’s word list' });
    },
  },

  /* ---------------- the Sentence strand ---------------- */

  tapNouns: tapPos('tapNouns', ['N'], 'Tap every noun.', 'A noun names a person, an animal, a place or a thing.'),
  tapVerb: tapPos('tapVerb', ['V'], 'Tap every verb.', 'A verb says what someone does or is.'),
  tapAdj: tapPos('tapAdj', ['A', 'R'], 'Tap every describing word — adjectives and adverbs.', 'An adjective describes a noun; an adverb describes a verb.'),
  split: {
    keys: (ctx) => keysOf(SB.SUBJECT, ctx),
    make(key) {
      const it = SB.SUBJECT[+key]; const [a, b] = it.s.split('|').map((x) => x.trim());
      const tokens = (a + ' ' + b).split(/\s+/), at = a.split(/\s+/).length - 1;
      return { id: 'split:' + key, kind: 'split', type: 'gaps', prompt: 'Tap the gap where the subject ends.', tokens, answer: [at], multi: false,
        hint: ['Find the verb first.', 'The subject is everything before it.'], explain: `The subject is “${a}”. The predicate starts with the verb.` };
    },
  },
  subject: {
    keys: (ctx) => keysOf(SB.SUBJECT, ctx).filter((k) => SB.SUBJECT[+k].s.split('|')[0].trim().split(/\s+/).length >= 2),
    make(key) {
      const it = SB.SUBJECT[+key]; const [a, b] = it.s.split('|').map((x) => x.trim()); const aw = a.split(/\s+/), bw = b.replace(/[.!?]$/, '').split(/\s+/);
      const wr = uniq([aw.slice(1).join(' '), aw.slice(-1)[0], [...aw, bw[0]].join(' '), bw.join(' ')]).filter((x) => x && x !== a).slice(0, 3);
      return mc('subject:' + key, 'subject', `${a} ${b}`, a, wr, { select: true, sub: 'Which is the complete subject?', hint: ['Who or what is the sentence about?', 'Take ALL the words that tell you.'], explain: `The complete subject is “${a}”.` });
    },
  },
  phraseClause: {
    keys: (ctx) => keysOf(SB.PHRASE_CLAUSE, ctx),
    make(key) {
      const it = SB.PHRASE_CLAUSE[+key]; const opts = ['Phrase', 'Clause'];
      return { id: 'phraseClause:' + key, kind: 'phraseClause', type: 'mc', prompt: it.text, sub: 'Phrase or clause?', options: opts, answer: it.kind === 'clause' ? 1 : 0, fixed: true,
        hint: ['Is someone or something doing something?', 'A clause has a subject and a verb.'], explain: it.kind === 'clause' ? 'It has a subject and a verb, so it is a clause.' : 'It has no subject-and-verb pair, so it is a phrase.' };
    },
  },
  mainClause: {
    keys: (ctx) => keysOf(SB.MAIN_CLAUSE, ctx),
    make(key) {
      const s = SB.MAIN_CLAUSE[+key].s, m = s.match(/^(.*)\[(.+)\](.*)$/);
      const chunks = [m[1], m[2], m[3]].map((x) => x.trim()).filter((x) => x && !/^[.,!?]$/.test(x));
      const main = m[2].trim();
      return { id: 'mainClause:' + key, kind: 'mainClause', type: 'chunk', prompt: 'Tap the main clause.', text: s.replace(/[[\]]/g, ''), chunks, answer: chunks.indexOf(main),
        hint: ['Which part could be a sentence on its own?', 'A part starting with when, because, if or although cannot.'], explain: `“${main}” makes sense on its own: it is the main clause.` };
    },
  },
  conj: {
    keys: (ctx) => keysOf(SB.CONJ, ctx),
    make(key) {
      const it = SB.CONJ[+key], fan = /^(for|and|nor|but|or|yet|so)$/.test(it.right);
      const shown = `${it.a}${fan ? ',' : ''} ___ ${it.b}.`;
      return mc('conj:' + key, 'conj', shown, it.right, it.wrong.slice(0, 3),
        { sub: 'Which joining word makes sense?', hint: ['Read both halves.', 'Do they add, contrast, give a reason or a result?'], explain: `${it.a}${fan ? ',' : ''} ${it.right} ${it.b}.` });
    },
  },
  combine: {
    keys: (ctx) => keysOf(SB.COMBINE, ctx),
    make(key) {
      const it = SB.COMBINE[+key];
      return { id: 'combine:' + key, kind: 'combine', type: 'type', prompt: `${it.a} ${it.b}`, sub: 'Combine them into one sentence.', accept: it.accept,
        hint: ['What do the two sentences share?', 'Fold the describing word into the other sentence.'], explain: `One way: ${it.accept[0]}` };
    },
  },
  caps: {
    keys: (ctx) => keysOf(SB.CAPS, ctx),
    make(key) {
      const toks = SB.CAPS[+key].s.split(/\s+/);
      const answer = toks.map((t, i) => (/^[A-Z]/.test(t) ? i : -1)).filter((i) => i >= 0);
      return { id: 'caps:' + key, kind: 'caps', type: 'caps', prompt: 'Tap every word that needs a capital letter.', tokens: toks.map((t) => t.toLowerCase()), answer,
        hint: ['The first word of a sentence.', 'Names of people, places, days, months — and “I”.'], explain: `${SB.CAPS[+key].s}` };
    },
  },
  endMark: {
    keys: (ctx) => keysOf(SB.END, ctx),
    make(key) {
      const s = SB.END[+key].s, mark = s.slice(-1);
      return { id: 'endMark:' + key, kind: 'endMark', type: 'mc', prompt: s.slice(0, -1) + ' ___', sub: 'How should it end?', options: ['Full stop .', 'Question mark ?', 'Exclamation mark !'], answer: '.?!'.indexOf(mark), fixed: true,
        hint: ['Is it telling, asking or exclaiming?'], explain: s };
    },
  },
  commas: {
    keys: (ctx) => keysOf(SB.COMMAS, ctx),
    make(key) {
      const words = SB.COMMAS[+key].s.split(/\s+/);
      const answer = words.map((w, i) => (w.endsWith(',') ? i : -1)).filter((i) => i >= 0);
      return { id: 'commas:' + key, kind: 'commas', type: 'gaps', prompt: 'Tap every gap that needs a comma.', tokens: words.map((w) => w.replace(/,$/, '')), answer, multi: true,
        hint: ['Is there a list?', 'Does the sentence open with a phrase, or speak to someone?'], explain: SB.COMMAS[+key].s };
    },
  },
  order: {
    keys: (ctx) => keysOf(SB.ORDER, ctx),
    make(key) {
      const s = SB.ORDER[+key].s, end = s.slice(-1), words = s.slice(0, -1).split(/\s+/);
      let tiles = shuffle(rng('order:' + key), words); if (tiles.join(' ') === words.join(' ')) tiles = [...tiles.slice(1), tiles[0]];
      return { id: 'order:' + key, kind: 'order', type: 'order', prompt: 'Tap the words in order to build the sentence.', tiles, answer: words, end,
        hint: ['Which word has the capital letter?', 'Who does what — then to what, then where or when.'], explain: s };
    },
  },
  /* dictation: a sentence from a classic, heard in the narrator's voice, written down; checked by kind */
  dictation: {
    keys: (ctx) => WRITING.dictation.filter((d) => d.band <= (ctx.band || 3)).map((d) => d.id),
    make(key) {
      const d = WRITING.dictation.find((x) => x.id === key);
      return { id: 'dictation:' + key, kind: 'dictation', type: 'dictation', prompt: 'Listen, then write down the sentence — every capital and comma.', clip: `dict/${key}`, text: d.text, work: d.work,
        hint: ['Play it again as often as you like.', 'Write a few words at a time, then check the end mark.'], explain: d.text };
    },
  },
  /* imitation: write your own sentence in the shape of a classic one; checked for SHAPE, not meaning */
  imitate: {
    keys: (ctx) => Object.values(WRITING.models).flat().filter((m) => m.band <= (ctx.band || 3) + 1).map((m) => m.id),
    make(key) {
      const m = Object.values(WRITING.models).flat().find((x) => x.id === key), S = SHAPES[m.shape];
      return { id: 'imitate:' + key, kind: 'imitate', type: 'imitate', prompt: 'Write your own sentence in the same shape — about anything you like.', model: m.text, shape: m.shape, shapeName: S.name, work: m.work,
        sub: `The shape: ${S.say}.`, hint: [`It ${S.say}.`, 'Choose your own subject: your school, a pet, the monsoon, a match.'], explain: '' };
    },
  },
  copy: {
    keys: () => LINES.map((_, i) => String(i)).filter((i) => LINES[+i].text.length <= 140),
    make(key) {
      const l = LINES[+key];
      return { id: 'copy:' + key, kind: 'copy', type: 'copy', prompt: 'Copy this line exactly — every capital and comma.', text: l.text, who: l.who, work: l.work,
        hint: ['Copy a few words at a time.', 'Check the capitals, then the commas.'], explain: l.text };
    },
  },
};

function uniq(a) { return [...new Set(a)]; }
function keysOf(list, ctx) { return byBand(list.map((x, i) => ({ ...x, i })), ctx.band).map((x) => String(x.i)); }

function tapPos(kind, tags, prompt, why) {
  return {
    keys: (ctx) => keysOf(SB.POS, ctx).filter((k) => SB.POS[+k].s.split(/\s+/).some((t) => tags.includes(t.split('/')[1]))),
    make(key) {
      const toks = SB.POS[+key].s.split(/\s+/).map((t) => { const i = t.lastIndexOf('/'); return [t.slice(0, i), t.slice(i + 1)]; });
      const answer = toks.map(([, tag], i) => (tags.includes(tag) ? i : -1)).filter((i) => i >= 0);
      return { id: kind + ':' + key, kind, type: 'tapmulti', prompt, tokens: toks.map(([w]) => w), punct: toks.map(([, t]) => t === '.'), answer,
        hint: [why], explain: `${why} Here: ${answer.map((i) => q(toks[i][0])).join(', ')}.` };
    },
  };
}

function affixMeaning(kind, list, aff, label) {
  return {
    keys: () => list().flatMap((a) => a.words.map((_, i) => `${aff(a)}:${i}`)),
    make(key) {
      const [p, i] = key.split(':'); const a = list().find((x) => aff(x) === p), [word] = a.words[+i];
      const wr = sample(rng(key), uniq(list().filter((x) => norm(x.meaning) !== norm(a.meaning)).map((x) => x.meaning)), 3);
      return mc(kind + ':' + key, kind, `In ${q(word)}, what does ${q(label(a))} mean?`, a.meaning, wr,
        { hint: ['Take the affix off. What is left?', 'How has the meaning changed?'], explain: `${q(label(a))} means “${a.meaning}”: ${word}.`, source: a.source });
    },
  };
}

function affixMake(kind, list, aff, nonKey, label) {
  return {
    keys: (ctx) => list().flatMap((a) => a.words.map(([w], i) => [a, w, i])).filter(([a, w]) => (ctx.lex?.[nonKey]?.[w] || []).length >= 3).map(([a, , i]) => `${aff(a)}:${i}`),
    make(key, ctx) {
      const [p, i] = key.split(':'); const a = list().find((x) => aff(x) === p), [word, base] = a.words[+i];
      const others = ctx.lex[nonKey][word].map((x) => list().find((y) => aff(y) === x)).filter(Boolean);
      const wr = sample(rng(key), others, 3).map(label);
      return mc(kind + ':' + key, kind, `Which ${kind.startsWith('prefix') ? 'prefix' : 'ending'} makes a real word with ${q(base)}?`, label(a), wr,
        { sub: `The new word means something like “${a.meaning}”.`, hint: ['Try each one aloud with the word.', 'Only one makes a word you could find in a dictionary.'], explain: `${q(word)} — ${a.meaning}.`, source: a.source });
    },
  };
}

/* Distractors for a meaning item: same part of speech, near difficulty, a different first letter, and no
   shared content word with the target's definition (two definitions that share "flower" could both be
   right). The pool is indexed once per lexicon — every item of every band reads the same index. */
const DIDX = new WeakMap();
function defIndex(lx) {
  let ix = DIDX.get(lx); if (ix) return ix;
  const content = (d) => new Set(norm(d).split(' ').filter((w) => w.length >= 5));
  ix = { byPs: {}, content: {} };
  for (const w of lx.pools.def || []) { const r = lx.words[w]; if (!r) continue; (ix.byPs[r[PS]] ||= []).push(w); ix.content[w] = content(r[DEF]); }
  DIDX.set(lx, ix); return ix;
}
function defDistractors(key, ctx, n) {
  const L = lexOf(ctx), t = L[key], R = rng('d:' + key), ix = defIndex(ctx.lex), tc = ix.content[key] || new Set();
  const pool = (ix.byPs[t[PS]] || []).filter((w) => w !== key && Math.abs(L[w][Y] - t[Y]) <= 1 && w[0] !== key[0]
    && !L[w][DEF].toLowerCase().includes(key) && !t[DEF].toLowerCase().includes(w) && ![...ix.content[w]].some((x) => tc.has(x)));
  const out = [], defs = new Set([norm(t[DEF])]);
  for (const w of shuffle(R, pool)) { if (out.length >= n) break; const d = norm(L[w][DEF]); if (!out.some((o) => o[0] === w[0]) && !defs.has(d)) { out.push(w); defs.add(d); } }
  return out;
}

/* ---------------- the public face ---------------- */

/* written questions (authored.js): a stop's own items when the runner names the stop, every stop's when
   the item test asks for the whole pool; a quoted line is shown under the question, with its book */
GEN.authored = {
  keys: (ctx) => (ctx.stop ? (AUTHORED.get(ctx.stop)?.items || []).map((_, i) => `${ctx.stop}:${i}`) : AUTHORED_STOPS.filter((s) => !ctx.band || !s.band || s.band <= ctx.band + 1).flatMap((s) => s.items.map((_, i) => `${s.id}:${i}`))),
  make: (key) => { const [sid, i] = key.split(':'), x = AUTHORED.get(sid).items[+i];
    return mc(`au:${sid}:${i}`, 'authored', x.q, x.right, x.wrong, { sub: x.quote ? `“${x.quote}”${x.work ? ` — ${WORKS.find((w) => w.id === x.work)?.title || ''}` : ''}` : '', explain: `${x.right}.`, sources: x.sources,
      select: [x.right, ...x.wrong].every((o) => `${x.q} ${x.quote || ''}`.toLowerCase().includes(o.toLowerCase())) }); },  // a which-word-in-this-line question: every option is in the line

};

export const KINDS = Object.keys(GEN);
export const keys = (kind, ctx) => GEN[kind].keys(ctx);
export const make = (kind, key, ctx) => GEN[kind].make(key, ctx);

/* n items for a stop, drawn from its pool; `salt` varies a session without changing any item */
export function draw(kind, n, ctx, salt = '') {
  const ks = keys(kind, ctx);
  return sample(rng(kind + salt), ks, Math.min(n, ks.length)).map((k) => make(kind, k, ctx));
}

/* A passage's own questions, as items (reading.js) */
export function passageItems(p) {
  return (p.questions || []).map((x, i) => mc(`passage:${p.id}:${i}`, 'passage', x.q, x.right, x.wrong, { depth: x.depth, explain: `${x.right}.` }));
}

const same = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
export function check(it, r) {
  switch (it.type) {
    case 'mc': case 'chunk': return r === it.answer;
    case 'tapmulti': case 'caps': case 'gaps': return Array.isArray(r) && same(r, it.answer);
    case 'order': return Array.isArray(r) && r.join(' ') === it.answer.join(' ');
    case 'type': { const n = (s) => norm(s); return it.accept.some((a) => n(a) === n(r)); }
    case 'copy': case 'dictation': return copyDiff(it.text, r).ok;
    case 'imitate': return imitateCheck(it.shape, it.model, r).ok;
    default: return false;
  }
}

/* Copywork, checked by KIND of error (SPEC §6.1): spelling, capitals, punctuation, missing/extra words.
   Whitespace runs count as one space. Returns { ok, errors: [{ at, kind, want, got }] } by word. */
export function copyDiff(want, got) {
  const W = String(want).trim().split(/\s+/), G = String(got || '').trim().split(/\s+/).filter(Boolean);
  const errors = [];
  const strip = (s) => s.replace(/[^A-Za-z0-9']/g, '');
  const n = Math.max(W.length, G.length);
  for (let i = 0; i < n; i++) {
    const w = W[i], g = G[i];
    if (w === g) continue;
    if (w == null) { errors.push({ at: i, kind: 'extra word', want: '', got: g }); continue; }
    if (g == null) { errors.push({ at: i, kind: 'missing word', want: w, got: '' }); continue; }
    if (strip(w) === strip(g)) errors.push({ at: i, kind: 'punctuation', want: w, got: g });
    else if (strip(w).toLowerCase() === strip(g).toLowerCase()) errors.push({ at: i, kind: 'capital letter', want: w, got: g });
    else errors.push({ at: i, kind: 'spelling', want: w, got: g });
  }
  return { ok: errors.length === 0, errors };
}

export const _test = { norm, hash };

/* ---------------- a story's own exercises (the Stories library) ----------------
   Built from the passage itself, so the practice is linked to what was just heard: its words (Bee's
   meanings), the AUTHOR's commas put back, the author's sentence rebuilt, a line copied. The comma and
   order items say "the author's" — a classic's punctuation is the writer's choice, and the child is
   asked to recover that choice, not to obey a rule it might not follow. */
const SENT = (t) => String(t).replace(/\s+/g, ' ').split(/(?<=[.!?][’”"']?)\s+(?=[A-Z“"‘'])/).map((s) => s.trim()).filter(Boolean);
const plainSentence = (s) => !/[;:—–()\[\]_*"“”]/.test(s) && !/\s'|'\s|^'|‘|’ /.test(s) && /^[A-Z]/.test(s) && /[.!?]$/.test(s);
export function storyExercises(p, text, lx) {
  const id = p.id, R = rng('story:' + id), out = {};
  out.understand = passageItems(p);
  /* words: Bee's meaning, three meanings from other stories' words as the wrong options */
  const L = lx?.words || {}, look = (w) => { const k = w.toLowerCase(); for (const f of [k, k.replace(/s$/, ''), k.replace(/es$/, ''), k.replace(/ed$/, ''), k.replace(/ed$/, 'e'), k.replace(/ing$/, ''), k.replace(/ing$/, 'e'), k.replace(/ies$/, 'y'), k.replace(/ly$/, '')]) if (L[f]) return [f, L[f]]; return null; };
  const others = ALL_WORDS_OF(p.id).map(look).filter(Boolean);
  out.words = (p.words || p.wordBank || []).map(look).filter(Boolean).slice(0, 5).map(([w, r], i) => {
    const seen = new Set([norm(r[DEF])]), pool = others.filter(([o, rr]) => { const d = norm(rr[DEF]); if (o === w || seen.has(d)) return false; seen.add(d); return true; });
    const same = pool.filter(([, rr]) => rr[PS] === r[PS]), pick3 = sample(rng(`sw:${id}:${w}`), same.length >= 3 ? same : pool, 3);
    return mc(`storyword:${id}:${i}`, 'storyword', `In the story, what does “${w}” mean?`, cap1(r[DEF]), pick3.map(([, rr]) => cap1(rr[DEF])), { say: w, explain: `“${w}” means: ${r[DEF]}`, source: 'Bizzing Bee’s word list' });
  });
  const sents = SENT(text).filter(plainSentence);
  out.commas = sample(R, sents.filter((s) => { const n = (s.match(/,/g) || []).length, w = s.split(' ').length; return n >= 1 && n <= 3 && w >= 6 && w <= 30; }), 3).map((s, i) => {
    const words = s.split(' ');
    return { id: `storycomma:${id}:${i}`, kind: 'storycomma', type: 'gaps', multi: true, prompt: 'Put back the author’s commas.', tokens: words.map((w) => w.replace(/,$/, '')),
      answer: words.map((w, j) => (w.endsWith(',') ? j : -1)).filter((j) => j >= 0), hint: ['Read it aloud: where does the voice pause?'], explain: s };
  });
  out.order = sample(R, sents.filter((s) => { const w = s.slice(0, -1).split(' '); return w.length >= 5 && w.length <= 11 && !/,/.test(s) && new Set(w.map((x) => x.toLowerCase())).size === w.length; }), 3).map((s, i) => {
    const end = s.slice(-1), words = s.slice(0, -1).split(' ');
    let tiles = shuffle(rng(`so:${id}:${i}`), words); if (tiles.join(' ') === words.join(' ')) tiles = [...tiles.slice(1), tiles[0]];
    return { id: `storyorder:${id}:${i}`, kind: 'storyorder', type: 'order', prompt: 'Rebuild the author’s sentence.', tiles, answer: words, end, hint: ['Which word has the capital letter?'], explain: s };
  });
  const cp = SENT(text).filter((s) => { const w = s.split(' ').length; return w >= 8 && w <= 24 && !/[_*]/.test(s); });
  out.copy = cp.length ? [{ id: `storycopy:${id}`, kind: 'copy', type: 'copy', prompt: 'Copy this line exactly — every capital and comma.', text: pick(rng('sc:' + id), cp), who: '', work: p.work, hint: ['Copy a few words at a time.'], explain: '' }] : [];
  out.copy.forEach((c) => (c.explain = c.text));
  return out;
}
let ALLW = null;
function ALL_WORDS_OF(except) { ALLW ||= [...new Set(ALL_PASSAGES.flatMap((x) => (x.words || []).map((w) => [x.id, w])).map((x) => x.join('|')))].map((x) => x.split('|')); return ALLW.filter(([pid]) => pid !== except).map(([, w]) => w); }
import { PASSAGES as ALL_PASSAGES } from './data/library.js';
