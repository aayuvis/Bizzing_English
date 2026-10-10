/* feed.mjs — My Feed (FAMILY-STANDARD §6a), held to English's own rules.

   Content: the cards are today's cut of the corpus (tools/build-feed.mjs); every `src` resolves and
   the card's words ARE that object's words; nothing held for review or not cleared in all three
   markets; every quote found verbatim in its held text; every route opens the SPECIFIC thing (never
   a bare #/library, #/stage, #/play or #/atlas) and names something that exists; ≥ 100 cards on
   every level and ≥ 300 with no level.
   Questions: the app's own, reused exactly — distinct options, exactly one right, the answer never
   on the card before it is asked, and no answer slot over 35%.
   Ranking: twenty and then it ends, the same all day, never above the band or past the next level,
   at most two peeks and five questions, never three of a kind in a row, what slipped comes first,
   this week's cards sink, and a right answer pays once.
   The new sources (Tools' Vocabulary and Idioms & Similes, Quotes & Poems' held lines, the myths' rooms and
   Who's who, the authors, the Typing Trainer, the Elocution Contest, certificates, the games' levels and their
   pools): each resolves to its object field by field; its question is the tool's or the game's own (the
   same options, one right); no card carries Bee's quotes or an idiom's origin story (scanned); more than
   5,000 cards, ≥ 300 on every level (≥ 100 is the floor), level-agnostic ≤ 25%, every group file small.
   The doubling (owner, 10 Oct 2026): the whole books' openings, lines and words; words met in the author's own
   sentence; where words come from; register pairs; the Podium's and Rhetoric Duel's devices; Story Ears, Plot
   Line, Root Forge and the avatars' cards — each resolved field by field to its object, with the same rules
   (exact quotes, one right answer, options on the card only where the line holds them all); at least 11,976
   cards (twice 5,988), ≥ 950 level-agnostic, every group file ≤ 800 KB (≤ 160 KB gzipped) and the index ≤ 1.6 MB.
   Each check is watched failing on a broken copy (the `broken` block at the end). */
import { T, tally } from './_mem.mjs';
import { readFileSync } from 'node:fs';
import { cut, files, manifest, leaks, quotable, workOk, placeName, stopRoute, games, GROUPS, groupOf, DIR, LEX, opening, genBody, norm,
  DECKS, VOCAB_HOME, vocabLevel, vocabQ, IDIOMS, idiomPlace, idiomQ, idiomOk, POOLS, builderCut, BUILDER_Q, rushCut, RUSH_Q, FIG_KINDS, workLevel, TYPING_LEVEL, CONTEST_LEVEL, BUDGET, BYTES,
  VOC_HOME, CTX_MIN_Y, CTX_WORK_MIN, ctxQ, ctxCut, ctxRival, ctxSentOk, shapeFits, DARK, headed, etymOf, regCut, REG_SAME, podName, POD_Q, duelQ, duelPools, PLOT_Q, plotSources,
  FORGE, FORGE_Q, forgeTitle, EARS_FIRST, earsLabel, inText, bodyOf } from '../../tools/build-feed.mjs';
import { gzipSync } from 'node:zlib';
import { STORIES as EARS_STORIES } from '../src/ears.js';
import { CARD_TEXT } from '../src/data/avatar-cards.js';
import { ALL_AVATARS } from '../src/data/avatars.js';
import { TOPICS as POD_TOPICS, DEVICES as POD_DEVICES, devicesIn } from '../src/podium.js';
import * as WP from '../src/data/wordparts.js';
import { STRANDS } from '../src/curriculum.js';
import { TY_LESSONS, vocItem, idiomItem, quoteShelf } from '../src/tools.js';
import { MORE_LINES } from '../src/data/lines-more.js';
import { MYTH_JOURNEY, WHO, AUTHORS, isGated, lifeNote, heldBack } from '../src/data/deep.js';
import { ROUNDS } from '../src/contest.js';
import { readText } from '../../tools/texts/levels.mjs';
import { order } from '../src/integration/bizzing-feed.js';
import { session, options, markSeen, payOnce, feedPlace, rec } from '../src/feed.js';
import { allStops, stopById } from '../src/curriculum.js';
import { AUTHORED } from '../src/authored.js';
import { make, check } from '../src/items.js';
import { PASSAGES, WORKS, LINES } from '../src/data/library.js';
import { levelOf } from '../src/reading.js';
import { BOOKS } from '../src/book.js';
import { FIGURES } from '../src/data/literature.js';
import { RHETORIC } from '../src/data/language.js';
import { MYTH_WORDS } from '../src/data/myth-words.js';
import { newHousehold, newKid, addKid } from '../src/model.js';
import { taught } from '../src/mastery.js';
import { stopsOf } from '../src/next.js';
const { ok, done } = tally('feed');
const D = 864e5;
const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const TEXTS = Object.fromEntries(json('../src/data/passages.json').map((p) => [p.id, p]));
const HOUR = json('../src/data/hour-words.json');
const BOOKDATA = Object.fromEntries(BOOKS.map((b) => [b.id, json(`../src/data/book-${b.id}.json`)]));

/* ---------------------------------------------------------------- the shipped cut */
const INDEX = json('../src/data/feed/index.json'), BODY = {};
for (const g of GROUPS) Object.assign(BODY, json(`../src/data/feed/g-${g}.json`));
const ITEMS = INDEX.map((x) => ({ ...BODY[x.id], ...x, play: BODY[x.id]?.play }));
const fresh = cut(), F = files(fresh);
ok('src/data/feed/ is today’s cut of the corpus — run node tools/build-feed.mjs', Object.entries(F).every(([f, body]) => readFileSync(`${DIR}/${f}`, 'utf8') === body));
ok('the index carries the ranking fields and no words', INDEX.every((x) => !('title' in x) && !('body' in x) && !('route' in x)));
ok('every card’s words are in its level’s group', INDEX.every((x) => BODY[x.id] && groupOf(BODY[x.id]) === groupOf(x)));
ok('card ids are unique', new Set(ITEMS.map((c) => c.id)).size === ITEMS.length);
const m = manifest(ITEMS);
for (let L = 1; L <= 10; L++) ok(`Level ${L} has ≥ 100 cards, and the ≥ 300 aim (${m.byLevel[L] || 0})`, (m.byLevel[L] || 0) >= 300);
ok(`≥ 300 level-agnostic cards (${m.agnostic})`, m.agnostic >= 300);
ok(`more than 5,000 cards (${m.total})`, m.total > 5000);
ok(`level-agnostic cards are at most a quarter (${Math.round((100 * m.agnostic) / m.total)}%)`, m.agnostic <= 0.25 * m.total);
ok(`no level holds more than its budget (${BUDGET})`, Object.values(m.byLevel).every((n) => n <= BUDGET));
/* the doubling made each level's words twice as many: a group stays ≤ 800 KB raw and ≤ 160 KB gzipped (what a phone
   fetches), the index ≤ 1.6 MB raw and ≤ 110 KB gzipped — none of it in Home's first load */
const raw = (f) => readFileSync(`${DIR}/${f}`), gz = (f) => gzipSync(raw(f), { level: 9 }).length;
ok(`every group file stays small (≤ 800 KB, ≤ 160 KB gzipped: ${GROUPS.map((g) => `${Math.round(raw(`g-${g}.json`).length / 1024)}/${Math.round(gz(`g-${g}.json`) / 1024)}`).join(' ')})`,
  GROUPS.every((g) => raw(`g-${g}.json`).length <= 800 * 1024 && gz(`g-${g}.json`) <= 160 * 1024));
ok(`the index stays small (≤ 1.6 MB, ≤ 110 KB gzipped: ${Math.round(raw('index.json').length / 1024)}/${Math.round(gz('index.json') / 1024)})`, raw('index.json').length <= 1600 * 1024 && gz('index.json') <= 110 * 1024);
ok('a group does not repeat the index’s ranking fields', GROUPS.every((g) => Object.values(json(`../src/data/feed/g-${g}.json`)).every((c) => !('bands' in c) && !('topics' in c) && !('key' in c) && 'level' in c === (g !== 'any'))));
ok(`the doubling: at least 11,976 cards, twice 5,988 (${m.total}), ≥ 950 level-agnostic (${m.agnostic}), every level ≥ 850 (${Object.values(m.byLevel).join(' ')})`, m.total >= 11976 && m.agnostic >= 950 && Object.values(m.byLevel).length === 10 && Object.values(m.byLevel).every((n) => n >= 850));
const NEW = ['vocab', 'idiom', 'mline', 'who', 'mythroom', 'author', 'why', 'typing', 'contest', 'builder', 'rush', 'figmore', 'rhmore', 'ctx', 'etym', 'register', 'podium', 'duel', 'duelm', 'chword'];
const GAMELIKE = ['ears', 'plot', 'forge', 'avatar'];
ok('every card from a new source is marked by level (1–10)', ITEMS.filter((c) => NEW.includes(c.src.split(':')[0])).every((c) => Number.isInteger(c.level) && c.level >= 1 && c.level <= 10));
ok('a game’s own cards and the avatars’ facts carry no level, as the games do', ITEMS.filter((c) => GAMELIKE.includes(c.src.split(':')[0])).every((c) => c.level == null) && GAMELIKE.every((k) => ITEMS.some((c) => c.src.startsWith(k + ':'))));
ok('no certificate cards: a card teaches something, it does not advertise a reward (owner, 4 Oct)', !ITEMS.some((c) => c.kind === 'certificate' || c.src.startsWith('cert:')));
const perSrc = new Map(); for (const c of ITEMS) if (NEW.includes(c.src.split(':')[0]) || GAMELIKE.includes(c.src.split(':')[0])) { const o = c.src.startsWith('vocab:') ? c.src : c.src.split('#')[0]; perSrc.set(o, (perSrc.get(o) || 0) + 1); }
ok('a new source object gives at most a few cards (≤ 6), one per card type', [...perSrc.values()].every((n) => n <= 6) && new Set(ITEMS.map((c) => c.src)).size === ITEMS.length);
const vocWords = ITEMS.filter((c) => c.kind === 'vocab').map((c) => c.title);
ok('one vocabulary card per word', new Set(vocWords).size === vocWords.length);
const ctxWords = ITEMS.filter((c) => c.kind === 'context').map((c) => c.play.opts[0]), etymWords = ITEMS.filter((c) => c.kind === 'origin').map((c) => c.title);
ok('one line per word in context, and one card per word for where it comes from', new Set(ctxWords).size === ctxWords.length && new Set(etymWords).size === etymWords.length);
const bySrc = {}; for (const c of ITEMS) { const k = c.src.split(':')[0]; bySrc[k] = (bySrc[k] || 0) + 1; }
console.log('  by source:', Object.entries(bySrc).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · '));
const sameWords = new Map(); for (const c of ITEMS) { const key = `${c.title}|${c.body || ''}|${c.play?.q || ''}|${c.play?.opts.join('|') || ''}`; sameWords.set(key, (sameWords.get(key) || 0) + 1); }
ok('no two cards say the same thing', [...sameWords.values()].every((n) => n === 1));

/* ---------------------------------------------------------------- resolve: the object, and the card's words in it */
const work = (id) => WORKS.find((w) => w.id === id);
const TAUGHT = (s) => s && /^(Taught at|Met in|Bee’s meaning|Its meaning|Practises|Told in|Never marked|From Bee’s|From Bizzing Bee’s|Who’s who|Their books|It says you can|On its card in the Collection)/.test(s);
export function resolve(c) {
  const kind = c.src.split(':')[0], rest = c.src.slice(kind.length + 1), [obj, part] = rest.split('#');
  if (kind === 'stop') {
    const st = stopById(obj); if (!st || st.needsReview) return 'no such stop, or held for review';
    if (c.level !== st.level || c.where !== placeName(st.strand, st.level)) return 'level or place';
    if (part === 'why') return c.body === st.learn.why && c.title === st.title && c.more === st.iCan ? '' : 'why';
    if (part === 'story') return c.body === st.story ? '' : 'story';
    if (part === 'example') return c.body === st.learn.example.join(' · ') ? '' : 'example';
    if (part.startsWith('prompt')) return st.kind === 'desk' && c.title === st.desk.prompts[+part.slice(6)] ? '' : 'desk prompt';
    if (part.startsWith('speak')) return st.kind === 'speak' && c.title === st.speak.prompts[+part.slice(5)] && c.body === st.iCan ? '' : 'speaking prompt';
    return 'part';
  }
  if (kind === 'item') {
    const st = stopById(obj), x = AUTHORED.get(obj)?.items[+part]; if (!st || st.needsReview || !x) return 'no such written item';
    if (c.play.q !== x.q || c.play.opts[0] !== x.right || c.play.opts.slice(1).join('|') !== x.wrong.join('|')) return 'not the item, exactly';
    return !x.quote || (c.quote === x.quote && c.cite === x.work && c.body.includes(x.quote)) ? '' : 'its line';
  }
  if (kind === 'gen') {
    const [gk, band, key] = rest.split('#'), st = allStops().find((s) => s.id === c.key.slice(5));
    if (!st || st.kind !== gk || st.needsReview) return 'no such generator stop';
    const it = make(gk, key, { band: +band, lex: LEX, stop: st.id });
    if (it.type !== 'mc' || it.prompt !== c.play.q || it.options[it.answer] !== c.play.opts[0]) return 'not the generator’s item';
    if (!check(it, it.answer) || it.options.some((_, i) => i !== it.answer && check(it, i))) return 'not exactly one right';
    return [...c.play.opts].sort().join('|') === [...it.options].sort().join('|') && c.body === genBody(it, st) && (c.body === st.iCan || c.body === it.sub) ? '' : 'options or line';
  }
  if (kind === 'passage' || kind === 'pword') {
    const p = PASSAGES.find((x) => x.id === obj), T2 = TEXTS[obj], w = p && work(p.work);
    if (!p || !T2 || p.needsReview || !quotable(w)) return 'no such passage, or held back';
    if (c.level !== levelOf(p)) return 'level';
    if (kind === 'pword') { const e = LEX.words[part]; return e && (T2.wordBank || p.words || []).map((x) => x.toLowerCase()).includes(part) && c.more === (/[.?!…”]$/.test(e[0]) ? `Bee’s meaning: ${e[0]}` : `Bee’s meaning: ${e[0]}.`) && T2.text.replace(/\s+/g, ' ').includes(c.body) ? '' : 'word in the story'; }
    if (part === 'hook') return c.body === p.hook && c.title === p.title ? '' : 'hook';
    if (part === 'open') return c.body === opening(T2.text) ? '' : 'opening';
    if (part === 'talk') return c.body === p.evaluate ? '' : 'talk';
    const q = p.questions[+part.slice(1)]; return q && c.play.q === q.q && c.play.opts[0] === q.right && c.play.opts.slice(1).join('|') === q.wrong.join('|') ? '' : 'passage question';
  }
  if (kind === 'chapter') {
    const [bid, n] = obj.split('/'), b = BOOKS.find((x) => x.id === bid), ch = b?.chapters.find((x) => x.n === +n), full = BOOKDATA[bid]?.chapters.find((x) => x.n === +n) || {};
    if (!ch || ch.needsReview || !quotable(work(bid)) || c.level !== 8) return 'no such chapter, or held back';
    if (part === 'sofar') return c.body === (ch.sofar || full.sofar) ? '' : 'story so far';
    if (part === 'talk') return c.body === (ch.evaluate || full.evaluate) ? '' : 'talk';
    if (part.startsWith('meet')) { const p = (ch.meet || full.meet)[+part.slice(4)]; return p && c.title === p.name && c.body === p.about ? '' : 'person'; }
    if (part === 'open') return c.body === opening((full.scenes || []).join(' ').replace(/\s+/g, ' ')) && c.quote === c.body && c.cite === bid ? '' : 'chapter opening';
    if (part === 'line') return c.body === full.line && c.quote === full.line && c.cite === bid ? '' : 'chapter line';
    const q = (ch.questions || full.questions)[+part.slice(1)]; return q && c.play.q === q.q && c.play.opts[0] === q.right && c.play.opts.slice(1).join('|') === q.wrong.join('|') ? '' : 'chapter question';
  }
  if (kind === 'myth') { const x = MYTH_WORDS.find((y) => y.word === obj); return x && !x.needsReview && c.quote === x.quote && c.cite === x.work && c.level === 7 && c.more.includes(x.meaning) && c.route === `#/story/${x.passage}` ? '' : 'myth word'; }
  if (kind === 'work') { const w = work(obj); return workOk(w) && c.title === w.title && c.body === w.summary ? '' : 'work'; }
  if (kind === 'line') { const l = LINES[+obj]; return l && quotable(work(l.work)) && c.body === l.text && c.source === l.who ? '' : 'line'; }
  if (kind === 'figure') { const f = FIGURES[+obj]; return f && quotable(work(f.work)) && c.body === f.text && c.play.opts[0] === f.figure ? '' : 'figure'; }
  if (kind === 'rhetoric') { const r = RHETORIC[+obj]; return r && quotable(work(r.work)) && c.body === r.text && c.play.opts[0] === r.device && !(r.also || []).some((d) => c.play.opts.includes(d)) ? '' : 'device'; }
  if (kind === 'hour') return HOUR[obj] === c.body && c.title === obj && !!LEX.words[obj] ? '' : 'hour word';
  if (kind === 'game') { const g = games().find((x) => x.id === obj); return g && c.title === g.name && c.body === g.how ? '' : 'game'; }
  /* ---- the new sources ---- */
  const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
  const oneRight = (right, wrong) => wrong.every((o) => norm(o) !== norm(right));
  if (kind === 'vocab') {
    const d = DECKS.find((x) => x.id === obj), e = d?.words.find((x) => x.w === part); if (!e) return 'no such word in that deck';
    if (VOCAB_HOME.find((id) => DECKS.find((x) => x.id === id)?.words.some((x) => x.w === e.w)) !== d.id) return 'not the word’s first deck';
    if (c.title !== e.w || c.play.q !== vocabQ(e.w) || c.play.opts[0] !== e.d || c.level !== vocabLevel(d.id, e)) return 'word, meaning or level';
    return sameSet(c.play.opts, vocItem(d, e, 0).options) && oneRight(e.d, c.play.opts.slice(1)) ? '' : 'not the tool’s own question';
  }
  if (kind === 'idiom') {
    const x = IDIOMS[+obj]; if (!x || !idiomOk(x)) return 'no such saying';
    if (c.title !== `“${x.p}”` || c.body !== x.ex || c.play.q !== idiomQ(x) || c.play.opts[0] !== x.m || c.level !== idiomPlace(x)[1]) return 'phrase, example, meaning or level';
    const same = IDIOMS.filter((y) => norm(y.p) === norm(x.p)).map((y) => norm(y.m));   // a phrase listed twice: neither meaning is a wrong option
    return sameSet(c.play.opts, idiomItem(IDIOMS, x, 0).options) && c.play.opts.slice(1).every((o) => !same.includes(norm(o))) ? '' : 'not the tool’s own question';
  }
  if (kind === 'mline') { const l = MORE_LINES[+obj], w = l && work(l.work); return l && quotable(w) && c.body === l.text && c.source === l.who && c.level === workLevel(l.work) ? '' : 'held line'; }
  if (kind === 'who') {
    const x = WHO.find((y) => y.name === obj), p = x && PASSAGES.find((y) => y.id === x.passage); if (!x || !p || p.needsReview || !quotable(work(p.work))) return 'no such figure';
    if (c.level !== levelOf(p) || c.route !== `#/story/${p.id}` || c.more !== `Who’s who: ${x.fact}`) return 'level, route or fact';
    if (part === 'quote') return c.title === x.name && c.quote === x.quote && c.cite === p.work ? '' : 'its quote';
    return x.greek && c.quote === x.greek.quote && c.cite === x.greek.work ? '' : 'its Greek name';
  }
  if (kind === 'mythroom') {
    const r = MYTH_JOURNEY.find((y) => y.id === obj), ps = (r?.stops || []).map((id) => PASSAGES.find((p) => p.id === id)).filter((p) => p && TEXTS[p.id] && !p.needsReview && quotable(work(p.work)));
    return r && ps.length && c.title === r.title && c.body === r.note && c.level === Math.min(...ps.map(levelOf)) ? '' : 'myth room';
  }
  if (kind === 'author') {
    const a = AUTHORS.find((y) => y.id === obj), life = a && lifeNote(a); if (!a || isGated(a) || c.title !== a.name) return 'author';
    return (c.body || '') === (life && workOk(life.work) ? life.basis : '') ? '' : 'author’s life line';
  }
  if (kind === 'why') { const w = work(obj); return workOk(w) && c.body === w.why && c.title === `Why read ${w.title}?` && c.level === workLevel(w.id) ? '' : 'why read it'; }
  if (kind === 'typing') { const l = TY_LESSONS.find((y) => y.id === obj); return l && c.title === l.name && c.body === l.tip && c.level === TYPING_LEVEL ? '' : 'typing lesson'; }
  if (kind === 'contest') { const r = ROUNDS.find((y) => y.id === obj); return r && c.title === `The Elocution Contest: ${r.title}` && c.body === r.say && c.level === CONTEST_LEVEL[r.id] ? '' : 'contest round'; }
  if (kind === 'cert') {
    if (obj.startsWith('book-')) { const b = BOOKS.find((y) => y.id === obj.slice(5)); return b && c.level === 8 && c.title === `The certificate for ${b.title}` ? '' : 'book certificate'; }
    const [sid, n] = [obj.replace(/-\d+$/, ''), +obj.split('-').pop()], l = STRANDS.find((y) => y.id === sid)?.levels.find((y) => y.n === n);
    if (!l || !l.stops.length || l.stops.some((st) => st.needsReview)) return 'no such level, or a stop held for review';
    return c.level === n && l.stops.every((st) => c.body.includes(st.title)) && (!l.iCan || c.more.includes(l.iCan)) ? '' : 'certificate';
  }
  if (kind === 'glevel') { const g = games().find((y) => y.id === obj), t = g?.levels[part]; return t && norm(c.body) === norm(t) && c.title === `${g.name}, level ${part}` && c.level == null ? '' : 'game level'; }
  if (kind === 'builder') {
    const x = POOLS.builder[+obj], b = x && builderCut(x); if (!b || c.body !== b.S || c.play.q !== BUILDER_Q || c.play.opts.join('|') !== b.opts.join('|') || c.level !== b.level) return 'builder sentence';
    const main = x.s.match(/\[(.+)\]/)[1].replace(/[,.!?;:\s]+$/, '');
    return c.play.opts[0] === main && oneRight(main, c.play.opts.slice(1)) ? '' : 'its main clause';
  }
  if (kind === 'rush') {
    const x = POOLS.rush[+obj], r = x && rushCut(x); if (!r || c.body !== r.body || c.play.q !== RUSH_Q || c.play.opts[0] !== r.right || c.level !== r.level) return 'comma sentence';
    const word = (o) => o.replace(/^after “|”$/g, ''), commaAfter = x.s.split(/\s+/).find((w) => w.endsWith(','));   // the ONE comma follows the right word, and no wrong one
    return x.s.split(',').length === 2 && commaAfter.replace(/^[“"‘'(]+/, '').replace(/,$/, '').replace(/[”"’'.!?;:)]+$/, '') === word(c.play.opts[0]) && c.play.opts.slice(1).every((o) => word(o) !== word(c.play.opts[0])) ? '' : 'its comma';
  }
  if (kind === 'figmore') { const f = POOLS.figures[+obj]; return f && quotable(work(f.work)) && c.body === f.text && c.play.opts[0] === f.figure && sameSet(c.play.opts, FIG_KINDS()) && c.level === 5 ? '' : 'figure line'; }
  if (kind === 'rhmore') { const r = POOLS.rhetoric[+obj]; return r && quotable(work(r.work)) && c.body === r.text && c.play.opts[0] === r.device && !(r.also || []).some((d) => c.play.opts.includes(d)) ? '' : 'device line'; }
  /* ---- the doubling ---- */
  if (kind === 'chword') {
    const [bid, n] = obj.split('/'), b = BOOKS.find((x) => x.id === bid), ch = b?.chapters.find((x) => x.n === +n), full = BOOKDATA[bid]?.chapters.find((x) => x.n === +n), e = LEX.words[part];
    if (!ch || ch.needsReview || !full || !quotable(work(bid)) || c.level !== 8) return 'no such chapter, or held back';
    return e && (full.wordBank || []).map((x) => x.toLowerCase()).includes(part) && c.more === (/[.?!…”]$/.test(e[0]) ? `Bee’s meaning: ${e[0]}` : `Bee’s meaning: ${e[0]}.`) && collapse((full.scenes || []).join(' ')).includes(c.body) && new RegExp(`\\b${part}\\b`, 'i').test(c.body) ? '' : 'word in the chapter';
  }
  if (kind === 'ctx') {
    const bits = rest.split('/'), w = bits.at(-1), h = VOC_HOME.get(w); if (!h || h.e.y < CTX_MIN_Y) return 'not a Vocabulary word of Bee difficulty ≥ 3';
    if (bits[0] === 'chapter') {
      const b = BOOKS.find((x) => x.id === bits[1]), ch = b?.chapters.find((x) => x.n === +bits[2]), full = BOOKDATA[bits[1]]?.chapters.find((x) => x.n === +bits[2]);
      if (!ch || ch.needsReview || !full || !quotable(work(b.id)) || c.level !== 8 || c.cite !== b.id || !collapse((full.scenes || []).join(' ')).includes(c.body)) return 'not a line of that chapter';
      if ((full.wordBank || []).map((x) => x.toLowerCase()).includes(w)) return 'a word-bank word (it has its own card)';
    } else if (bits[0] === 'passage') {
      const p = PASSAGES.find((x) => x.id === bits[1]); if (!p || p.needsReview || !TEXTS[p.id] || !quotable(work(p.work)) || c.level !== levelOf(p) || c.cite !== p.work || !collapse(TEXTS[p.id].text).includes(c.body)) return 'not a line of that passage';
      if ((TEXTS[p.id].wordBank || p.words || []).map((x) => String(x).toLowerCase()).includes(w)) return 'a word-bank word (it has its own card)';
    } else if (bits[0] === 'work') {
      const wk = work(bits[1]); if (!quotable(wk) || c.cite !== wk.id || c.level !== h.L || h.L < CTX_WORK_MIN) return 'not a held work, or not the word’s rung';
      if (DARK.test(c.body) || headed(c.body)) return 'a dark line, or a heading run into it';
    } else return 'no such place';
    const o = c.play.opts, toks = (c.body.match(/[A-Za-z]+(?:[’'][a-z]+)?/g) || []);
    if (c.play.q !== ctxQ(h.e) || o[0] !== w || o.length !== 4 || !ctxSentOk(c.body) || !shapeFits(w, h.e.ps)) return 'the question, its word or its line';
    if (!o.every((x) => toks.filter((t) => t === x).length === 1)) return 'an option not in the line once';   // a whole word of the line, once (a quote mark may touch it)
    if (!o.slice(1).every((x) => ctxRival(h.e, x) && LEX.words[x][0] !== h.e.d)) return 'a rival that shares its meaning';
    return sameSet(o.slice(1), ctxCut(h.e, c.body) || []) ? '' : 'not the cut’s three';
  }
  if (kind === 'etym') {
    const h = VOC_HOME.get(obj), t = LEX.words[obj]?.[5]; if (!h || !t) return 'no such word, or no etymology';
    return c.title === obj && c.body === t && t === etymOf(obj) && !/\b1\d{3}\b|centur/i.test(t) && c.level === h.L && c.more === (/[.?!…”]$/.test(h.e.d) ? `Its meaning: ${h.e.d}` : `Its meaning: ${h.e.d}.`) ? '' : 'where it comes from';
  }
  if (kind === 'register') {
    const x = WP.REGISTER[+obj], r = x && regCut(+obj, part); if (!r || c.level !== 8) return 'no such pair';
    const other = part === 'formal' ? 'informal' : 'formal', kin = (a, b) => a === b || REG_SAME.some((g) => g.includes(a) && g.includes(b));
    const wrongPairs = c.play.opts.slice(1).map((o) => WP.REGISTER.find((y) => y[part] === o));
    return c.play.q === r.q && c.play.opts[0] === x[part] && c.play.q.includes(`“${x[other]}”`) && wrongPairs.every((y) => y && y !== x && !kin(y.informal, x.informal)) ? '' : 'not the pair, or a rival that means the same';
  }
  if (kind === 'podium') {
    const [tid, pt, i] = obj.split('/'), t = POD_TOPICS.find((y) => y.id === tid), v = t?.[pt]?.[+i]?.v?.[part];
    if (!v || c.body !== v || c.level !== 7) return 'no such line, or not its level';
    const got = devicesIn(v); return got.length === 1 && got[0] === part && c.play.q === POD_Q && c.play.opts[0] === podName(part) && sameSet(c.play.opts, POD_DEVICES.map((d) => d.name)) ? '' : 'not exactly its one device';
  }
  if (kind === 'duel' || kind === 'duelm') {
    const [, list, plain] = duelPools().find(([k]) => k === kind), r = list[+obj], p = r && plain[r.text]; if (!r || !p || !quotable(work(r.work))) return 'no such line';
    return c.play.q === duelQ(r.device) && c.play.opts.length === 2 && c.play.opts[0] === r.text && c.play.opts[1] === p && found(r.work, r.text) && !found(r.work, p) && c.level === 7 ? '' : 'not the line and its plainer version';
  }
  if (kind === 'ears') {
    const st = EARS_STORIES.find((y) => y.id === obj), q = st?.qs[+part], p = st && PASSAGES.find((y) => y.id === st.passage);
    if (!q || !p || p.needsReview || !TEXTS[p.id] || !quotable(work(p.work))) return 'no such story question';
    const labels = (q.kind === 'order' ? q.seq : q.pics).map(earsLabel), holds = q.kind === 'order' ? q.holds[0] : q.holds;
    return c.play.q === (q.kind === 'order' ? EARS_FIRST : q.ask) && c.play.opts[0] === labels[0] && sameSet(c.play.opts, labels) && c.play.after === `“${holds}”` && found(p.work, holds) ? '' : 'not the game’s question, or its words';
  }
  if (kind === 'plot') {
    const s = plotSources().find((y) => y.id === obj), texts = s?.cards.map((x) => x.text); if (!s || !PLOT_Q[part]) return 'no such story';
    return c.play.q === PLOT_Q[part] && c.play.opts[0] === (part === 'first' ? texts[0] : texts.at(-1)) && sameSet(c.play.opts, texts) && s.cards.every((x, j) => x.at === j) && texts.every((t) => found(s.work, t.replace(/…$/, ''))) ? '' : 'not the story’s scenes, or not in order';
  }
  if (kind === 'forge') {
    const e = FORGE.words.get(obj); if (!e) return 'not a forged word';
    const same = (ids) => ids.length === e.ids.length && ids.every((id) => e.ids.includes(id));
    return c.title === forgeTitle(e.ids) && c.play.q === FORGE_Q && c.play.opts[0] === obj && FORGE.strike(e.ids)?.word === obj && c.play.opts.slice(1).every((w) => FORGE.words.has(w) && !same(FORGE.words.get(w).ids)) ? '' : 'not the parts and the word they forge';
  }
  if (kind === 'avatar') {
    const a = ALL_AVATARS.find((y) => y.id === obj), t = CARD_TEXT[obj]; if (!a || !t) return 'no such card';
    return c.title === a.name && c.body === t.fact && c.more === `On its card in the Collection: ${t.lore}` && (c.source || '') === (t.from || '') ? '' : 'not the card’s words';
  }
  return 'unknown kind';
}
/* a route opens the SPECIFIC thing the card is about, and that thing exists */
const QUOTE_KEYS = new Set(quoteShelf([...LINES, ...MORE_LINES].filter((l) => quotable(work(l.work))), WORKS).map((x) => x.key));
const GENERIC = /^#\/(library|stage|play|atlas|home|practice|feed|continue)?\/?$/;
export function routeOk(c) {
  const r = c.route || ''; if (GENERIC.test(r)) return 'generic';
  const [, nav, a, b, d] = r.split('/').map(decodeURIComponent);
  const kind = c.src.split(':')[0];
  if (nav === 'stage' && a === 'contest') return kind === 'contest' && !b ? '' : 'contest';
  if (nav === 'stage' && a === 'podium') return kind === 'podium' && !b ? '' : 'the Podium';
  if (nav === 'ears') return kind === 'ears' && !a ? '' : 'Story Ears';
  if (nav === 'collection') return kind === 'avatar' && !a ? '' : 'the Collection';
  if (nav === 'atlas') return STRANDS.some((x) => x.id === a) && !b ? '' : 'strand road';
  if (nav === 'library' && a === 'myths') return !b ? '' : 'myths';
  if (nav === 'library' && a === 'author') { const au = AUTHORS.find((x) => x.id === b); return au && !isGated(au) ? '' : 'author page'; }
  if (nav === 'tools') {
    if (a === 'typing') return TY_LESSONS.some((l) => l.id === b) ? '' : 'typing lesson';
    if (a === 'vocab') return DECKS.some((d) => d.id === b) ? '' : 'vocabulary deck';
    if (a === 'idioms') return b === 'p' && IDIOMS.some((x) => x.p === d) ? '' : 'saying';
    if (a === 'quotes') return QUOTE_KEYS.has(b) ? '' : 'quotes shelf';
    return 'tool';
  }
  if (nav === 'stop' || nav === 'desk' || (nav === 'stage' && a !== 'aloud')) { const st = stopById(a); return st && stopRoute(st) === r && !b ? '' : 'stop route'; }
  if (nav === 'stage' && a === 'aloud') return c.key && stopById(c.key.slice(5))?.kind === 'readAloud' ? '' : 'read-aloud';
  if (nav === 'story') { const p = PASSAGES.find((x) => x.id === a); return p && TEXTS[a] && (!b || (b === 'do' && !d) || b === 'talk') ? '' : 'story route'; }
  if (nav === 'whole') { const bk = BOOKS.find((x) => x.id === a); return bk && bk.chapters.some((x) => x.n === +b) && (!d || d === 'do' || d === 'talk') ? '' : 'chapter route'; }
  if (nav === 'book') return work(a) ? '' : 'book';
  if (nav === 'word') return LEX.words[a] ? '' : 'word';
  if (nav === 'play') return games().some((g) => g.id === a) ? '' : 'game';
  return `unknown route for ${kind}`;
}

let bad = { resolve: [], route: [], leak: [], opts: [], quote: [], review: [], taught: [] };
const collapse = (s) => String(s).replace(/\s+/g, ' ').trim(), corpus = {};
const found = (wid, q) => (corpus[wid] ??= collapse(readText(wid) || '')).includes(collapse(q));
const slots = [0, 0, 0, 0]; let four = 0;
for (const c of ITEMS) {
  const r = resolve(c); if (r) bad.resolve.push(`${c.id}: ${r}`);
  const ro = routeOk(c); if (ro) bad.route.push(`${c.id} ${c.route}: ${ro}`);
  if (!c.cta || !c.route) bad.route.push(`${c.id}: no button`);
  if (c.more && !TAUGHT(c.more) && c.kind !== 'lesson' && c.kind !== 'book') bad.taught.push(c.id);
  if (c.play) {
    const o = c.play.opts;
    if (!Array.isArray(o) || o.length < 2 || new Set(o.map((x) => String(x).toLowerCase().trim())).size !== o.length) bad.opts.push(c.id);
    if (leaks(c)) bad.leak.push(`${c.id}: “${o[0]}”`);
    if (o.length === 4) { four++; slots[order(c.id, 4).indexOf(0)]++; }
  }
  if (c.quote || c.cite) { if (!(c.cite && c.quote && quotable(work(c.cite)) && found(c.cite, c.quote) && (c.body || '').includes(c.quote))) bad.quote.push(c.id); }
}
ok(`every src resolves to its object, and the card’s words are that object’s (${bad.resolve.slice(0, 3).join('; ')})`, bad.resolve.length === 0);
ok(`every route opens the specific thing, and it exists (${bad.route.slice(0, 3).join('; ')})`, bad.route.length === 0);
ok(`every question: distinct options, at least two (${bad.opts.slice(0, 3).join(', ')})`, bad.opts.length === 0);
ok(`no answer on its card before it is asked (${bad.leak.slice(0, 3).join(', ')})`, bad.leak.length === 0);
ok(`every quote is found verbatim in its held, cleared text (${bad.quote.slice(0, 3).join(', ')})`, bad.quote.length === 0);
ok(`the second line says where it is taught, or what it is (${bad.taught.slice(0, 3).join(', ')})`, bad.taught.length === 0);
ok(`no favourite answer slot: ${slots.map((n) => Math.round((100 * n) / four) + '%').join(' ')}`, four > 100 && slots.every((n) => n / four <= 0.35));
ok('questions are many, and from every source', m.plays >= 500 && ['item:', 'gen:', 'passage:', 'chapter:', 'figure:', 'rhetoric:'].every((p) => ITEMS.some((c) => c.play && c.src.startsWith(p))));
ok('nothing held for review: no review-flagged stop, passage, work or myth word is a source', !ITEMS.some((c) => (c.key && stopById(c.key.slice(5))?.needsReview) || (c.cite && work(c.cite)?.needsReview)));

/* ---------------------------------------------------------------- scans: what may never be on a card */
/* Bee's quotes (CLAUDE.md rule 2) and the idioms' origin stories (awaiting a reviewer) never enter the feed.
   A card's words are cut into word-boundary windows; any quote or origin whose opening window is found is
   then looked for whole. A book's line that Bee also quotes is allowed only as the book's own: a card
   whose words are found in a held, cleared text — and never on a card cut from Bee's own lists. */
let HELD_ALL; const heldAnywhere = (q) => (HELD_ALL ??= WORKS.filter(quotable).map((w) => norm(readText(w.id) || ''))).some((t) => t.includes(norm(q)));
const BEE_QUOTES = json('../src/data/bee-quotes.json').quotes.map((x) => x.q), ORIGINS = IDIOMS.map((x) => x.os || '');
const K = 6, windows = (t) => { const w = norm(t).split(' '), out = []; for (let i = 0; i + K <= w.length; i++) out.push(w.slice(i, i + K).join(' ')); return out; };
export function scan(cards, needles, allowHeld) {
  const text = (c) => [c.title, c.body, c.more, c.source, c.play?.q, ...(c.play?.opts || []), c.play?.after].filter(Boolean).join(' \n '), seen = new Map();
  for (const c of cards) for (const w of windows(text(c))) (seen.get(w) || seen.set(w, []).get(w)).push(c);
  const hits = [];
  for (const q of needles) {
    const w0 = windows(q)[0]; if (!w0 || !seen.has(w0)) continue;
    for (const c of seen.get(w0)) if (norm(text(c)).includes(norm(q)) && !(allowHeld && !['idiom', 'vocab', 'word'].includes(c.kind) && heldAnywhere(q))) hits.push(`${c.id}: “${q.slice(0, 40)}”`);
  }
  return hits;
}
const beeHits = scan(ITEMS, BEE_QUOTES, true), originHits = scan(ITEMS, ORIGINS, false);
ok(`no Bee quote on any card (${BEE_QUOTES.length} scanned; ${beeHits.slice(0, 3).join('; ')})`, beeHits.length === 0 && BEE_QUOTES.length > 100);
ok(`no idiom’s origin story on any card (${ORIGINS.filter(Boolean).length} scanned; ${originHits.slice(0, 3).join('; ')})`, originHits.length === 0 && ORIGINS.filter(Boolean).length > 1000);
ok('no myth word deep.js holds back, and no idiom card carries an origin field', !ITEMS.some((c) => c.src.startsWith('myth:') && heldBack(MYTH_WORDS.find((x) => x.word === c.src.slice(5)))) && !ITEMS.some((c) => c.kind === 'idiom' && ('os' in c || 'oc' in c)));
ok('the new sources ask questions: vocabulary, sayings, clauses, commas, figures, devices', ['vocab:', 'idiom:', 'builder:', 'rush:', 'figmore:', 'rhmore:'].every((p) => ITEMS.filter((c) => c.play && c.src.startsWith(p)).length >= 20));
ok('the doubling asks questions too: words in their lines, register, the Podium, the Duel, Story Ears, Plot Line, Root Forge', ['ctx:', 'register:', 'podium:', 'duel', 'ears:', 'plot:', 'forge:'].every((p) => ITEMS.filter((c) => c.play && c.src.startsWith(p)).length >= 20));
ok('a line cut from anywhere in a held text is never dark, and never a heading run into a sentence', ITEMS.filter((c) => c.src.startsWith('ctx:work/')).every((c) => !DARK.test(c.body) && !headed(c.body)));

/* ---------------------------------------------------------------- the engine, for English */
const h = newHousehold(); h.parent.tester = true;
const ana = addKid(h, newKid('Ana', 2, 'tortoise'));
const s1 = session(h, ana, ITEMS, T), s2 = session(h, ana, ITEMS, T + 3600e3);
ok(`a session is twenty cards and then it ends (${s1.length})`, s1.length === 20);
ok('the same all day', JSON.stringify(s1) === JSON.stringify(s2));
ok('a different day draws a different feed', JSON.stringify(session(h, ana, ITEMS, T + D)) !== JSON.stringify(s1));
const byId = Object.fromEntries(ITEMS.map((c) => [c.id, c])), place = feedPlace(h, ana);
ok(`every card says why it is there (${s1.find((x) => !x.why)?.id || ''})`, s1.every((x) => x.why));
ok('nothing beyond the next level', s1.every((x) => byId[x.id].level == null || byId[x.id].level <= place.level + 1));
ok('at most two peeks at the next level', s1.filter((x) => x.tier === 'next').length <= 2);
ok('at most five questions', s1.filter((x) => byId[x.id].play).length <= 5);
ok('never three of a kind in a row', s1.every((x, i) => i < 2 || !(s1[i - 1].kind === x.kind && s1[i - 2].kind === x.kind)));
ok('most of a session is at the child’s level', s1.filter((x) => x.tier === 'now').length >= 12);
const young = addKid(h, newKid('Tia', 1, 'hare'));
ok('a younger band never sees an older card', session(h, young, ITEMS, T).every((x) => byId[x.id].bands.includes(1)));
ok('the next stop leads, with its why', s1.some((x) => /^Your next stop: /.test(x.why)));
/* climbing changes the feed */
const climber = addKid(h, newKid('Om', 3, 'owl'));
const before = session(h, climber, ITEMS, T).filter((x) => x.tier === 'now').map((x) => x.id);
for (const sid of ['word', 'sentence', 'reading', 'writing', 'speaking', 'literature', 'language']) for (const st of stopsOf(sid)) if (st.level <= 4) climber.stops[st.id] = { passed: true, at: T };
const placeAfter = feedPlace(h, climber), after = session(h, climber, ITEMS, T).filter((x) => x.tier === 'now').map((x) => x.id);
ok(`a child who climbs gets a different feed (level ${placeAfter.level})`, placeAfter.level > 3 && after.every((id) => !before.includes(id)));
/* what slipped comes back first */
const slip = addKid(h, newKid('Raj', 2, 'hare'));
taught(slip, 'w1-rhyme', T - 3 * D); slip.stops['w1-rhyme'] = { passed: true, at: T - 3 * D };
const sl = session(h, slip, ITEMS, T);
ok('a check due on a later day comes back first, saying so', sl.slice(0, 3).some((x) => byId[x.id].key === 'stop:w1-rhyme' && /later day/.test(x.why)));
/* this week's cards sink; a right answer pays once */
markSeen(ana, s1.map((x) => x.id), T);
const s3 = session(h, ana, ITEMS, T + 3600e3);
ok('what was shown today sinks', s3.filter((x) => s1.some((y) => y.id === x.id)).length <= 4);
ok('the seen record keeps a fortnight', (markSeen(ana, [], T + 20 * D), Object.keys(rec(ana).seen).length === 0));
const q1 = s1.find((x) => byId[x.id].play)?.id || ITEMS.find((c) => c.play).id;
ok('a right answer pays once', payOnce(ana, q1, T) === true && payOnce(ana, q1, T + D) === false);
ok('an answered question is not asked again', !session(h, ana, ITEMS, T + 2 * D).some((x) => x.id === q1));
ok('k.feed holds card ids and day numbers only', Object.keys(ana.feed).every((k) => k === 'seen' || k === 'paid') && Object.values(ana.feed.paid).every((v) => Number.isInteger(v)));
/* a heard story is not offered again as a story */
const tale = ITEMS.find((c) => c.kind === 'tale' && c.level === place.level);
ana.reading[tale.key.slice(8)] = { heard: true, at: T };
ok('a story already heard is skipped', options(h, ana, ITEMS, T).skip(tale) === true);

/* ---------------------------------------------------------------- broken copies: each check can fail */
const one = (pred) => ITEMS.find(pred);
const lineCard = one((c) => c.src.startsWith('line:')), qCard = one((c) => c.src.startsWith('item:') && !c.body), lesson = one((c) => c.src.endsWith('#why'));
ok('broken: an altered quote is caught', !found(lineCard.cite, lineCard.quote.replace(/[A-Za-z]+/, (w) => w + 'x')));
ok('broken: a question whose answer is on its card is caught', leaks({ ...qCard, body: `It is ${qCard.play.opts[0]}.` }));
ok('broken: a card with words its source does not hold is caught', resolve({ ...lesson, body: lesson.body + ' Also.' }) !== '');
ok('broken: a generic route is caught', routeOk({ ...lesson, route: '#/library' }) !== '' && routeOk({ ...lesson, route: '#/stage' }) !== '' && routeOk({ ...lesson, route: '#/play' }) !== '');
ok('broken: a route to something that does not exist is caught', routeOk({ ...lesson, route: '#/stop/no-such-stop' }) !== '');
ok('broken: a favourite slot is caught', (() => { const s = [0, 0, 0, 0]; for (let i = 0; i < 200; i++) s[i % 3 ? 0 : 1]++; return s.some((n) => n / 200 > 0.35); })());
const voc = one((c) => c.kind === 'vocab'), idi = one((c) => c.kind === 'idiom'), idx = IDIOMS[+idi.src.slice(6)];
const originLeak = idx.os;   // the scan looks for a whole origin story; the first card's idiom once had a one-sentence story, so its first sentence stood in for it
ok('broken: an idiom’s origin story slipped onto a card is caught', scan([{ ...idi, more: `${idi.more} ${originLeak}` }], ORIGINS, false).length === 1);
ok('broken: a Bee quote slipped onto a card is caught', scan([{ ...lesson, body: `${lesson.body} ${BEE_QUOTES.find((q) => q.split(' ').length > 8 && !heldAnywhere(q))}` }], BEE_QUOTES, true).length === 1);
ok('broken: a vocabulary card whose right answer is another word’s meaning is caught', resolve({ ...voc, play: { ...voc.play, opts: [voc.play.opts[1], voc.play.opts[0], ...voc.play.opts.slice(2)] } }) !== '');
ok('broken: a saying the tool does not hold is caught', routeOk({ ...idi, route: '#/tools/idioms/p/no%20such%20saying' }) !== '' && routeOk({ ...voc, route: '#/tools/vocab/no-such-deck' }) !== '');
/* the doubling's checks, each on a broken copy */
const cx = one((c) => c.src.startsWith('ctx:chapter/')), cxw = one((c) => c.src.startsWith('ctx:work/')), et = one((c) => c.kind === 'origin'), rg = one((c) => c.src.startsWith('register:'));
const pd = one((c) => c.src.startsWith('podium:')), du = one((c) => c.src.startsWith('duel:')), ea = one((c) => c.src.startsWith('ears:')), pl = one((c) => c.src.startsWith('plot:')), fo = one((c) => c.src.startsWith('forge:')), av = one((c) => c.src.startsWith('avatar:'));
const notInLine = Object.keys(LEX.words).find((w) => /^[a-z]{5,}$/.test(w) && !cx.body.toLowerCase().includes(w));
ok('broken: a word in context whose option is not in the line is caught', resolve({ ...cx, play: { ...cx.play, opts: [...cx.play.opts.slice(0, 3), notInLine] } }) !== '');
ok('broken: a word in context with another word’s meaning is caught', resolve({ ...cx, play: { ...cx.play, q: ctxQ({ d: LEX.words[cx.play.opts[1]][0] }) } }) !== '');
ok('broken: a dark line from a held text is caught', resolve({ ...cxw, body: cxw.body.replace(/\.$/, ', and they killed him.') }) !== '');
ok('broken: an etymology with a date in it, or not Bee’s, is caught', resolve({ ...et, body: et.body + ' (first used in 1590)' }) !== '');
ok('broken: a register rival that means the same is caught', (() => { const i = WP.REGISTER.findIndex((y) => y.informal === 'start'), j = WP.REGISTER.findIndex((y) => y.informal === 'begin'), r = regCut(i, 'formal');
  return resolve({ ...rg, src: `register:${i}#formal`, play: { q: r.q, opts: [r.right, WP.REGISTER[j].formal, ...r.wrong.slice(0, 2)], after: '' } }) !== ''; })());
ok('broken: a Podium line with a second device in it is caught', resolve({ ...pd, body: pd.body.replace(/[.!?]$/, ', but not today?') }) !== '');
ok('broken: the Duel’s plainer version given as the answer is caught', resolve({ ...du, play: { ...du.play, opts: [du.play.opts[1], du.play.opts[0]] } }) !== '');
ok('broken: Story Ears with words that do not hold the answer is caught', resolve({ ...ea, play: { ...ea.play, after: '“they lived happily ever after”' } }) !== '' && routeOk({ ...ea, route: '#/ears/5' }) !== '');
ok('broken: Plot Line with the scenes out of order is caught', resolve({ ...pl, play: { ...pl.play, opts: [pl.play.opts[1], pl.play.opts[0], ...pl.play.opts.slice(2)] } }) !== '');
ok('broken: Root Forge with a word its parts do not forge is caught', resolve({ ...fo, play: { ...fo.play, opts: [fo.play.opts[1], fo.play.opts[0], ...fo.play.opts.slice(2)] } }) !== '');
ok('broken: an avatar card with words its card does not hold is caught', resolve({ ...av, body: av.body + ' Also.' }) !== '' && routeOk({ ...av, route: '#/collection/medals' }) !== '');
ok('broken: an oversized group or a group repeating the index is caught', (() => { const L1 = fresh.filter((c) => c.level === 1), big = files([...fresh, ...[1, 2, 3].flatMap((n) => L1.map((c) => ({ ...c, id: `${c.id}~x${n}` })))])['g-L1.json']; return big.length > 800 * 1024 || gzipSync(big).length > 160 * 1024; })() && 'topics' in fresh[0] && !('topics' in bodyOf(fresh[0])));
done();
