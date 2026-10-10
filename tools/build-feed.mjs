/* build-feed.mjs — My Feed's cards, CUT from Bizzing English's own corpus (FAMILY-STANDARD §6a).

   Nothing here is typed for the feed. Every card names the object it came from (`src`) and
   app/test/feed.mjs resolves it; every word on a card is a field of that object (a stop's title,
   "I can…", why and examples; a passage's hook, its first lines and its own questions; a chapter's
   story-so-far, its people and questions; a work's summary; an exact line; a Bee definition…).
   Questions on cards are the app's OWN questions, reused exactly: written (authored) items, the
   generators' multiple-choice items, passage and chapter questions, and Figure Hunt's figures.
   The only words this file adds are the card furniture: a place line ("Word 3 · Prefixes"),
   "Taught at: …", a button label, and a question stem for a figure or a device.

   Left out on purpose: anything held for review (the object or its work — `needsReview`), any work
   not cleared in all three markets, the timeline (every date awaits a reviewer), and any question
   whose right answer is on the card before it is asked.

   `level` is the card's place on English's ladder: the level (1–10) of the strand stop it belongs
   to. Works, lines of the hour, Bee's words, figures, devices and games carry no level.

   THE NEW SOURCES (Tools, the deep dives, the Stage, certificates, the games' pools) and the level each
   is given. A card's level is its rung on English's ladder; where a source is not a strand stop, the rung is
   the strand level whose subject it is, set by the source's own difficulty field — never by hand per card:
     Vocabulary (public/data/vocab.json + Bee's lexicon, the tool's own decks; one card per word, in the
       first of its decks in this order: Mighty 500, Meaning Masters, Champ, Hard, Medium, Easy; the
       question is the tool's own vocItem, so its options are the tool's fair ones). Bee's 1–9 difficulty:
         The Mighty 500 (Bee's finals list) and Champ (Bee 7–9) → Word 10 · Ready for the Bee
         Hard: Bee 4 → Word 8, Bee 5–6 → Word 9 · Shades of meaning
         Meaning Masters (Bee's junior-final list): Bee 1–2 → Word 4, Bee 3 → Word 5 (≤ 7 letters) or
           Word 6 (longer), Bee 4–5 → Word 7
         Medium: Bee 2 → Word 3, Bee 3 → Word 4 · Easy (Bee 1) → Word 2 · What words mean
       Word origins (Bee's origin decks) are Language 1, cut from that stop's own generator (more of its
       items than the six the strand section takes).
     Idioms & Similes (src/data/idioms.json; meaning, Bee's example and the tool's own idiomItem question —
       NEVER the origin story, which awaits a reviewer): Bee's diff → idioms and proverbs easy → Language 5
       · Idioms, medium/hard → Language 6 · Register and dialect (when a saying fits); similes easy →
       Literature 5 · Figurative language, medium/hard → Word 9 · Shades of meaning.
     Quotes & Poems: the held lines only (LINES are already here; lines-more.js MORE_LINES are new), each at
       the Reading level of its work's passages. Bee's quotes (bee-quotes.json) are never read here.
     The Greek myths (data/deep.js): the journey's rooms and Who's who (exact quotes) at the Reading level of
       their passages; myth words as before (Word 7), skipping any deep.js holds back (heldBack).
     The authors: one card each and a "why read" card per work told in the Library, at the Reading level of
       their passages. Their quiz is their passages' own questions, already cut here, so it is not repeated.
     Typing Trainer lessons → Writing 1 · Copywork. The Elocution Contest's rounds → Speaking 1 (a passage),
       2 (a poem), 6 (a one-minute talk). Certificates → the level they certify (levels with a stop held for
       review are left out). The games' five levels each stay level-agnostic, as the games do.
     The games' pools (read when present): builder.json → Sentence 3 (band 1) or 4 (bands 2–3), "which part
       is the main clause?"; rush.json → "where does the comma go?" (one-comma sentences) at Sentence 4
       (compound), 5 (address, aside) or 7 (fronted openings); figures-more.js → Literature 5;
       rhetoric-more.js → the level of the Language stop that teaches the device (Language 7).
   THE DOUBLING (owner, 10 Oct 2026: "look for additional content and double the feed cards") — more of what the
   app already holds, each with its rung by the same rule:
     The whole books (Reading 8): each chapter's opening and its own line (exact), and its word bank met in the
       chapter's sentence with Bee's meaning (as the passages' words are).
     Words in context ("ctx"): a Vocabulary word of Bee difficulty ≥ 3 met in a sentence of a Library passage (the
       passage's Reading level) or a whole book's chapter (Reading 8) — or, for Bee's hardest words (rung 7–10), in
       any held, cleared text (the word's own rung, as its Vocabulary card; never a line of killing, death, war,
       worship or a nation, never a story's heading run into its sentence). See ctxCut.
     Where words come from ("etym"): Bee's etymology, as the word's page shows it, at the word's Vocabulary rung;
       never one with a date (dates await a reviewer).
     Register (Word 8): data/wordparts.js REGISTER, the formal word for an everyday one and back.
     The Podium's offered lines with exactly one device worked in (podium.js devicesIn), and Rhetoric Duel's
       real line against its plainer version written for the game: Language 7, where the devices are taught.
     Level-agnostic, as the games are: Story Ears' picture questions (the pictures' own words are the options; the
       words that hold the answer, exact, come after), Plot Line's stories (which scene first, which last), Root
       Forge's words (which word do these parts forge?), and each avatar card's real fact (the Collection).
     Left out: Inkwell Detective's cases (a spoiler), its Knacks and Word Hoard (held for review), Who Said It?
       (its lines are already cards, with their author), the idioms' origin stories, the Podium's lines with no
       device, and Bee's spelling hints (Bee owns spelling).
   A level holds at most BUDGET cards and BYTES of words (its file stays small): the strand stops, passages and
   small sources first, then the big pools in turn (a stable hash order, so no alphabet bias), then more of
   the generators' own items where a level is still short.

     node tools/build-feed.mjs           → app/src/data/feed/ (index.json + one group per level; loaded only when #/feed opens)
     node tools/build-feed.mjs --check   → exits 1 if those files are not today's cut */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STRANDS, allStops, stopById, level as levelOfStrand } from '../app/src/curriculum.js';
import { AUTHORED } from '../app/src/authored.js';
import { keys, make } from '../app/src/items.js';
import { PASSAGES, WORKS, LINES } from '../app/src/data/library.js';
import { cleared } from '../app/src/data/rights.js';
import { levelOf } from '../app/src/reading.js';
import { BOOKS } from '../app/src/book.js';
import { FIGURES } from '../app/src/data/literature.js';
import { RHETORIC } from '../app/src/data/language.js';
import { MYTH_WORDS } from '../app/src/data/myth-words.js';
import { GAMES } from '../app/src/games.js';
import { readText } from './texts/levels.mjs';
import { vocDecks, vocItem, idiomItem, TY_LESSONS, quoteShelf, authorKey } from '../app/src/tools.js';
import { MORE_LINES } from '../app/src/data/lines-more.js';
import { MYTH_JOURNEY, WHO, AUTHORS, heldBack, authorPassages, authorWorks, isGated, lifeNote } from '../app/src/data/deep.js';
import { ROUNDS } from '../app/src/contest.js';
import { hash, rng, shuffle } from '../app/src/rand.js';
import { STORIES as EARS_STORIES, pic as earsPic } from '../app/src/ears.js';
import { CARD_TEXT } from '../app/src/data/avatar-cards.js';
import { ALL_AVATARS, PACK_NAMES } from '../app/src/data/avatars.js';
import { TOPICS as POD_TOPICS, DEVICES as POD_DEVICES, devicesIn } from '../app/src/podium.js';
import { PLAIN, DEVICE_GLOSS } from '../app/src/data/duel.js';
import { plotStories } from '../app/src/games.js';
import { forgeOf } from '../app/src/forge.js';
import * as WP from '../app/src/data/wordparts.js';
import { kidSafe, defSafe, lineSafe, BLOCK } from '../app/src/safe.js';

const HERE = dirname(fileURLToPath(import.meta.url)), APP = join(HERE, '..', 'app');
const json = (p) => JSON.parse(readFileSync(join(APP, p), 'utf8'));
export const LEX = json('public/data/bee-words.json');
const TEXTS = Object.fromEntries(json('src/data/passages.json').map((p) => [p.id, p]));
const HOUR = json('src/data/hour-words.json');
const ART = json('src/data/story-art.json');
const BOOKDATA = Object.fromEntries(BOOKS.map((b) => [b.id, json(`src/data/book-${b.id}.json`)]));
export const VOCAB = json('public/data/vocab.json'), IDIOMS = json('src/data/idioms.json').items;
/* Bee's quotes are read for ONE thing: to keep them out (CLAUDE.md rule 2). A new card whose words hold one
   — a saying in Bee's idiom list that is also a famous quotation, a book's sentence Bee also quotes — is not cut. */
let BEE_Q, BEE_HEADS, HELD_ALL;
/* …unless the words are a held book's own (a line Bee also quotes is still the book's line): never on a card
   cut from Bee's own lists (a saying, a vocabulary word) */
const heldSomewhere = (q) => (HELD_ALL ??= WORKS.filter(quotable).map((w) => norm(held(w.id)))).some((t) => t.includes(q));
export function beeQuoted(c) {
  if (!BEE_Q) { BEE_Q = json('src/data/bee-quotes.json').quotes.map((x) => norm(x.q)).filter((q) => q.split(' ').length >= 3); BEE_HEADS = new Set(BEE_Q.map((q) => q.split(' ').slice(0, 3).join(' '))); }
  const t = norm([c.title, c.body, c.more, c.source, c.play?.q, ...(c.play?.opts || []), c.play?.after].filter(Boolean).join(' ')), w = t.split(' ');
  for (let i = 0; i + 3 <= w.length; i++) if (BEE_HEADS.has(w.slice(i, i + 3).join(' '))) { const at = w.slice(i).join(' '); const q = BEE_Q.find((x) => at.startsWith(x)); if (q && (c.kind === 'idiom' || c.kind === 'vocab' || !heldSomewhere(q))) return true; }
  return false;
}
/* the games' pools, written by their own agent: read only when they are there */
const optJson = (p) => { try { const j = json(p); return Array.isArray(j) ? j : []; } catch { return []; } };
const optMod = async (p) => { try { return await import(p); } catch { return {}; } };
export const POOLS = {
  builder: optJson('src/data/games/builder.json'), rush: optJson('src/data/games/rush.json'),
  figures: (await optMod('../app/src/data/figures-more.js')).FIGURES_MORE || [],
  rhetoric: (await optMod('../app/src/data/rhetoric-more.js')).RHETORIC_MORE || [],
  plain: (await optMod('../app/src/data/rhetoric-more.js')).PLAIN_MORE || {},
};

/* ---------------------------------------------------------------- shared rules */
export const norm = (s) => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const inText = (needle, hay) => !!norm(needle) && new RegExp(`(^| )${esc(norm(needle))}( |$)`).test(norm(hay));
/* a question leaks when its right answer is on the card before it is asked — unless the card names
   EVERY option (a which-word-in-this-line question: the line holds them all by design) */
export function leaks(c) {
  if (!c.play) return false;
  const text = `${c.title} ${c.body || ''} ${c.play.q}`, [right, ...wrong] = c.play.opts;
  return inText(right, text) && !wrong.every((o) => inText(o, text));
}
const work = (id) => WORKS.find((w) => w.id === id);
export const workOk = (w) => !!w && !w.needsReview && !['us', 'uk', 'in'].some((k) => w.rights?.[k] === 'check');
export const quotable = (w) => workOk(w) && cleared(w) && w.held;
const strandOf = (id) => STRANDS.find((s) => s.id === id);
const stop = (s) => (/[.?!…”]$/.test(s) ? s : s + '.');        // a sentence ends once: "Which word means…?" takes no full stop
export const placeName = (sid, n) => `${strandOf(sid).title} ${n} · ${levelOfStrand(sid, n)?.title || ''}`.replace(/ · $/, '');
const bandsFrom = (b) => (b ? [1, 2, 3].filter((x) => x >= b) : [1, 2, 3]);
export const stopRoute = (st) => (st.kind === 'desk' ? `#/desk/${st.id}` : st.kind === 'speak' ? `#/stage/${st.id}` : st.kind === 'readAloud' ? '#/stage/aloud' : `#/stop/${st.id}`);
const SHELF = { fable: 'Fables and fairy tales', children: 'Children’s classics', novel: 'Novels and stories', poetry: 'Poetry', drama: 'Drama', speech: 'Speeches', essay: 'Essays' };
const HELD = {}, held = (wid) => (HELD[wid] ??= String(readText(wid) || '').replace(/\s+/g, ' '));
const sentences = (t) => String(t).replace(/\s+/g, ' ').split(/(?<=[.!?][’”"']?)\s+(?=[A-Z“"‘'])/).filter(Boolean);
/* the opening of a held text, cut at a sentence end: 120–320 characters, exact */
export function opening(text) {
  let out = '';
  for (const s of sentences(text)) { if (out && (out + ' ' + s).length > 320) break; out = out ? out + ' ' + s : s; if (out.length >= 120) break; }
  return out.length <= 360 ? out : '';
}
/* A generated item's line under the question is kept only when it is the stop's own instruction
   ("Which is the complete subject?"); a line that is a Bee dictionary definition (Language 1's origin
   items show the word's meaning) is not a lesson, so the card says the stop's "I can…" instead. */
const DEFS = new Set(Object.values(LEX.words).map((e) => norm(e[0] || '')).filter(Boolean));
export const genBody = (it, st) => (it.sub && !DEFS.has(norm(it.sub)) ? it.sub : st.iCan);
/* stops that TEACH a word (figure, device): the stop's own "why" names it */
const teaches = (pre, word) => allStops().filter((s) => s.id.startsWith(pre) && !s.needsReview && new RegExp(`\\b${esc(word)}`, 'i').test(s.learn?.why || ''));

/* ---------------------------------------------------------------- the cut */
export function cut() {
  const cards = [], words = new Set();
  const add = (c) => {
    if (leaks(c)) return;
    const wk = (c.kind === 'word' || c.kind === 'inline') && `${c.kind}:${c.src.split('#')[1] || c.title}`;
    if (wk) { if (words.has(wk)) return; words.add(wk); }                       // one card of a kind per word, the first place it is met
    cards.push(c);
  };
  const play = (q, right, wrong, after) => ({ q, opts: [right, ...wrong], after: after || '' });

  /* 1. the strands' stops: the idea, the story, the examples, the stop's own questions */
  for (const st of allStops()) {
    if (st.needsReview) continue;
    const where = placeName(st.strand, st.level), bands = bandsFrom(st.band), route = stopRoute(st);
    const cta = st.kind === 'desk' ? `${st.title} at the writing desk` : st.kind === 'speak' || st.kind === 'readAloud' ? `${st.title} on the Stage` : `${st.title} on the ${strandOf(st.strand).title} road`;
    const base = { level: st.level, bands, topics: [`stop:${st.id}`, `strand:${st.strand}`], key: `stop:${st.id}`, where, route, cta };
    const taught = stop(`Taught at: ${where} — ${st.title}`);
    if (st.learn?.why) add({ ...base, id: `${st.id}~idea`, kind: 'lesson', src: `stop:${st.id}#why`, title: st.title, body: st.learn.why, more: st.iCan });
    if (st.story) add({ ...base, id: `${st.id}~story`, kind: 'story', src: `stop:${st.id}#story`, title: st.title, body: st.story, more: taught });
    if (st.learn?.example?.length) add({ ...base, id: `${st.id}~eg`, kind: 'example', src: `stop:${st.id}#example`, title: `${st.title}: for example`, body: st.learn.example.join(' · '), more: taught });
    if (st.kind === 'desk') (st.desk?.prompts || []).forEach((p, i) => add({ ...base, id: `${st.id}~p${i}`, kind: 'desk', src: `stop:${st.id}#prompt${i}`, title: p,
      body: (st.desk.parts || []).map((x) => x[0]).join(' · '), more: taught }));
    if (st.kind === 'speak') (st.speak?.prompts || []).forEach((p, i) => add({ ...base, id: `${st.id}~p${i}`, kind: 'speech', src: `stop:${st.id}#speak${i}`, title: p,
      body: st.iCan, more: taught }));
    const au = AUTHORED.get(st.id);
    if (au) au.items.forEach((x, i) => {
      if (x.quote && !quotable(work(x.work))) return;
      add({ ...base, id: `${st.id}~q${i}`, kind: 'question', src: `item:${st.id}#${i}`, title: st.title,
        body: x.quote ? `“${x.quote}”${x.work ? ` — ${work(x.work).title}` : ''}` : '', ...(x.quote ? { cite: x.work, quote: x.quote } : {}),
        play: play(x.q, x.right, x.wrong, x.why || ''), more: taught });
    });
    else if (!/^(desk|speak|readAloud|authored)$/.test(st.kind)) {
      /* a generator's own multiple-choice items: the first few keys of each band, made exactly as the stop makes them */
      for (const b of bands) {
        let ks; try { ks = keys(st.kind, { band: b, lex: LEX, stop: st.id }); } catch { continue; }
        let n = 0, miss = 0;
        for (const key of ks) {
          if (n >= 6 || miss >= 200) break;                      // a generator whose items are never a card's (tap, type, say) is left soon
          let it; try { it = make(st.kind, key, { band: b, lex: LEX, stop: st.id }); } catch { miss++; continue; }
          if (!it || it.type !== 'mc' || it.say || it.fixed) { miss++; continue; }
          const right = it.options[it.answer], c = { ...base, bands: [b], id: `${st.id}~g${b}~${String(key).replace(/[^\w-]+/g, '_').slice(0, 40)}`, kind: 'question',
            src: `gen:${st.kind}#${b}#${key}`, title: st.title, body: genBody(it, st), play: play(it.prompt, right, it.options.filter((_, j) => j !== it.answer), it.explain || ''), more: taught };
          const twin = cards.find((x) => x.key === c.key && x.src.startsWith('gen:') && x.play.q === c.play.q && x.play.opts.join('|') === c.play.opts.join('|') && (x.body || '') === (c.body || ''));
          if (twin) { if (!twin.bands.includes(b)) twin.bands.push(b); n++; continue; }   // the same item in two bands is one card for both
          if (leaks(c) || cards.some((x) => x.id === c.id)) continue;
          add(c); n++;
        }
      }
    }
  }

  /* 2. myth words (Word 7): the word, where it comes from, and the myth that tells it */
  for (const m of MYTH_WORDS) {
    const p = PASSAGES.find((x) => x.id === m.passage), w = work(m.work);
    if (m.needsReview || heldBack(m) || !p || p.needsReview || !TEXTS[p.id] || !quotable(w)) continue;
    add({ id: `myth~${m.word}`, kind: 'myth', src: `myth:${m.word}`, level: 7, bands: bandsFrom(p.band), topics: [`stop:rd-${p.id}`, 'strand:word', `work:${m.work}`],
      where: placeName('word', 7), title: `${m.word} — from ${m.from}`, body: `“${m.quote}”`, cite: m.work, quote: m.quote, source: `${w.title} — ${w.author}`,
      more: `Its meaning: ${stop(m.meaning)} Told in “${p.title}”.`, route: `#/story/${p.id}`, cta: `Hear “${p.title}”` });
  }

  /* 3. the Library's passages: the story, how it begins, its own questions */
  for (const p of PASSAGES) {
    const w = work(p.work), T = TEXTS[p.id];
    if (!T || p.needsReview || !quotable(w)) continue;
    const L = levelOf(p), where = `${placeName('reading', L)} · the Library`, bands = bandsFrom(p.band), art = ART.includes(`story/${p.id}`) ? `art/story/${p.id}-card.webp` : undefined;
    const base = { level: L, bands, topics: [`stop:rd-${p.id}`, 'strand:reading', `work:${p.work}`], key: `stop:rd-${p.id}`, where, source: `${w.title} — ${w.author}` };
    const taught = stop(`Taught at: ${placeName('reading', L)} — “${p.title}”`);
    add({ ...base, id: `rd~${p.id}`, kind: 'tale', src: `passage:${p.id}#hook`, title: p.title, body: p.hook, art, more: taught, route: `#/story/${p.id}`, cta: `Hear “${p.title}”` });
    const open = opening(T.text);
    if (open) add({ ...base, id: `rd~${p.id}~open`, kind: 'opening', src: `passage:${p.id}#open`, title: `How it begins: ${p.title}`, body: open, cite: p.work, quote: open, more: taught, route: `#/story/${p.id}`, cta: `Hear the rest of “${p.title}”` });
    (p.questions || []).forEach((x, i) => add({ ...base, id: `rd~${p.id}~q${i}`, kind: 'question', src: `passage:${p.id}#q${i}`, title: p.title, body: '',
      play: play(x.q, x.right, x.wrong, ''), more: taught, route: `#/story/${p.id}/do`, cta: `The exercises for “${p.title}”` }));
    if (p.evaluate) add({ ...base, id: `rd~${p.id}~talk`, kind: 'talk', src: `passage:${p.id}#talk`, title: `Talk about it: ${p.title}`, body: p.evaluate, more: 'Never marked — your own thoughts, kept on this device.', route: `#/story/${p.id}/talk`, cta: 'Talk about it' });
    /* its words, met in the author's own sentence (exact), with Bee's meaning under it */
    const sents = sentences(T.text);
    for (const wd of (T.wordBank || p.words || []).slice(0, 6)) {
      const lw = String(wd).toLowerCase(), e = LEX.words[lw]; if (!e || !e[0]) continue;
      const line = sents.find((x) => x.length <= 300 && held(p.work).includes(x) && new RegExp(`\\b${esc(wd)}\\b`, 'i').test(x)); if (!line) continue;
      add({ ...base, id: `rd~${p.id}~w~${lw}`, kind: 'inline', src: `pword:${p.id}#${lw}`, title: `“${lw}” in ${p.title}`, body: line, cite: p.work, quote: line,
        more: stop(`Bee’s meaning: ${e[0]}`), route: `#/story/${p.id}`, cta: `Hear “${p.title}”` });
    }
  }

  /* 4. the whole books, a chapter at a time (Reading 8) */
  for (const b of BOOKS) {
    const w = work(b.id); if (!quotable(w)) continue;
    for (const c of b.chapters) {
      if (c.needsReview) continue;
      const full = BOOKDATA[b.id].chapters.find((x) => x.n === c.n) || {}, where = `${placeName('reading', 8)} · ${b.title}`;
      const base = { level: 8, bands: bandsFrom(b.band), topics: [`stop:bk-${b.id}-${c.n}`, 'strand:reading', `work:${b.id}`], key: `stop:bk-${b.id}-${c.n}`, where, source: `${b.title} — ${b.author}` };
      const art = ART.includes(`book/${b.id}-${c.n}`) ? `art/book/${b.id}-${c.n}-card.webp` : undefined, route = `#/whole/${b.id}/${c.n}`, cta = `Chapter ${c.n}: ${c.title}`;
      const taught = stop(`Taught at: ${b.short}, chapter ${c.n}: ${c.title}`);
      const sofar = c.sofar || full.sofar;
      if (sofar) add({ ...base, id: `bk~${b.id}~${c.n}`, kind: 'chapter', src: `chapter:${b.id}/${c.n}#sofar`, title: `Chapter ${c.n}: ${c.title}`, body: sofar, art, more: taught, route, cta });
      (c.meet || full.meet || []).forEach((m, i) => add({ ...base, id: `bk~${b.id}~${c.n}~m${i}`, kind: 'person', src: `chapter:${b.id}/${c.n}#meet${i}`, title: m.name, body: m.about, more: stop(`Met in ${b.short}, chapter ${c.n}: ${c.title}`), route, cta }));
      (c.questions || full.questions || []).forEach((x, i) => add({ ...base, id: `bk~${b.id}~${c.n}~q${i}`, kind: 'question', src: `chapter:${b.id}/${c.n}#q${i}`, title: `${b.short}, chapter ${c.n}`, body: '',
        play: play(x.q, x.right, x.wrong, ''), more: taught, route: `${route}/do`, cta: `The exercises for chapter ${c.n}` }));
      const ev = c.evaluate || full.evaluate;
      if (ev) add({ ...base, id: `bk~${b.id}~${c.n}~talk`, kind: 'talk', src: `chapter:${b.id}/${c.n}#talk`, title: `Talk about it: ${b.short}, chapter ${c.n}`, body: ev, more: 'Never marked — your own thoughts, kept on this device.', route: `${route}/talk`, cta: 'Talk about it' });
    }
  }

  /* ------------------------------ level-agnostic ------------------------------ */
  /* 5. works: our own summary and why it matters (modern works are cards, never quotes) */
  for (const w of WORKS) {
    if (!workOk(w)) continue;
    const told = PASSAGES.filter((p) => p.work === w.id && TEXTS[p.id] && !p.needsReview).map((p) => `“${p.title}”`);
    add({ id: `work~${w.id}`, kind: 'book', src: `work:${w.id}`, bands: [1, 2, 3], topics: [`work:${w.id}`], where: `The Library · ${SHELF[w.shelf] || w.shelf}`, title: w.title, body: w.summary,
      source: `${w.author}, ${w.year}`, more: told.length ? `Told in the Library: ${told.slice(0, 3).join(' · ')}.` : w.why, route: `#/book/${w.id}`, cta: `${w.title} in the Library` });
  }
  /* 6. lines of the hour, exact */
  LINES.forEach((l, i) => {
    const w = work(l.work); if (!quotable(w)) return;
    add({ id: `line~${i}`, kind: 'line', src: `line:${i}`, bands: [1, 2, 3], topics: [`work:${l.work}`], where: 'A line of the hour', title: `A line from ${w.title}`, body: l.text, cite: l.work, quote: l.text,
      source: l.who, route: `#/book/${w.id}`, cta: `${w.title} in the Library` });
  });
  /* 7. Figure Hunt's lines: which figure of speech? */
  const KINDS = [...new Set(FIGURES.map((f) => f.figure))].sort();
  FIGURES.forEach((f, i) => {
    const w = work(f.work); if (!quotable(w)) return;
    const wrong = KINDS.filter((k) => k !== f.figure), by = teaches('li', f.figure)[0];
    add({ id: `fig~${i}`, kind: 'figure', src: `figure:${i}`, bands: [2, 3], topics: [`work:${f.work}`, 'game:figure'], where: 'Figure Hunt', title: `A line from ${w.title}`, body: f.text, cite: f.work, quote: f.text,
      source: w.author, play: play('Which figure of speech is this line?', f.figure, wrong, ''), more: by ? stop(`Taught at: ${placeName(by.strand, by.level)} — ${by.title}`) : '', route: '#/play/figure', cta: 'Figure Hunt' });
  });
  /* 8. the great speakers' devices */
  const DEV = [...new Set(RHETORIC.map((r) => r.device))].sort();
  RHETORIC.forEach((r, i) => {
    const w = work(r.work); if (!quotable(w)) return;
    const by = teaches('la', r.device)[0]; if (!by) return;
    const wrong = DEV.filter((d) => d !== r.device && !(r.also || []).includes(d)).slice(0, 3);
    add({ id: `rh~${i}`, kind: 'device', src: `rhetoric:${i}`, bands: bandsFrom(by.band), topics: [`stop:${by.id}`, `work:${r.work}`], where: placeName(by.strand, by.level), title: `A line from ${w.title}`, body: r.text, cite: r.work, quote: r.text,
      source: w.author, play: play('Which device is the speaker using here?', r.device, wrong, ''), more: stop(`Taught at: ${placeName(by.strand, by.level)} — ${by.title}`), route: stopRoute(by), cta: `${by.title} on the Language road` });
  });
  /* 9. Bee's words for the hour */
  for (const [wd, def] of Object.entries(HOUR)) {
    if (!LEX.words[wd]) continue;
    add({ id: `hw~${wd}`, kind: 'word', src: `hour:${wd}`, bands: [1, 2, 3], topics: [`word:${wd}`], where: 'A word from the books', title: wd, body: def, source: 'Bizzing Bee’s word list', route: `#/word/${encodeURIComponent(wd)}`, cta: `“${wd}” in the word list` });
  }
  /* 10. the games: their own names and what they practise (games.js) */
  for (const g of games()) add({ id: `game~${g.id}`, kind: 'game', src: `game:${g.id}`, bands: [1, 2, 3], topics: [`game:${g.id}`], where: 'Play', title: g.name, body: g.how, more: stop(`Practises ${g.practises}`), route: `#/play/${g.id}`, cta: `Play ${g.name}` });

  grow(cards, add, play);

  /* no favourite slot: a card whose right option lands where too many already sit is still kept — the
     engine's order() spreads them; the test holds the whole set to ≤ 35% in any slot */
  return cards.map((c) => Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined && v !== '')));
}

/* ---------------------------------------------------------------- the new sources (see the header) */
export const BUDGET = 1150, BYTES = 780000;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const hashOrder = (list, salt) => list.map((c) => [hash(salt + c.id), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
export const bandsOfLevel = (L) => (L <= 3 ? [1, 2, 3] : L <= 7 ? [2, 3] : [3]);
const DIFF_BANDS = { easy: [1, 2, 3], medium: [2, 3], hard: [3] };
const shippedP = (p) => !!p && TEXTS[p.id] && !p.needsReview && quotable(work(p.work));
/* a work's place on the ladder: the Reading level of its easiest passage the Library tells */
export const workLevel = (wid) => { const ls = PASSAGES.filter((p) => p.work === wid && shippedP(p)).map(levelOf); return ls.length ? Math.min(...ls) : null; };
const firstStop = (sid, L) => allStops().find((s) => s.strand === sid && s.level === L && !s.needsReview);
const taughtAt = (sid, L) => { const st = firstStop(sid, L); return st ? stop(`Taught at: ${placeName(sid, L)} — ${st.title}`) : ''; };

/* Vocabulary: the deck a word is carded from, and its rung */
export const VOCAB_HOME = ['nsf500', 'vocab26', 'champ', 'hard', 'medium', 'easy'];
export function vocabLevel(deckId, e) {
  if (deckId === 'nsf500' || deckId === 'champ') return 10;
  if (deckId === 'hard') return e.y <= 4 ? 8 : 9;
  if (deckId === 'vocab26') return e.y <= 2 ? 4 : e.y === 3 ? (e.w.length <= 7 ? 5 : 6) : 7;
  if (deckId === 'medium') return e.y <= 2 ? 3 : 4;
  if (deckId === 'easy') return 2;
  return null;
}
export const DECKS = vocDecks(VOCAB, LEX);
export const vocabQ = (w) => `What does “${w}” mean?`;
/* Idioms & Similes: [strand, level] by Bee's diff */
export const idiomPlace = (x) => (x.t === 'simile' ? (x.diff === 'easy' ? ['literature', 5] : ['word', 9]) : x.diff === 'easy' ? ['language', 5] : ['language', 6]);
export const idiomQ = (x) => `What does this ${x.t} mean?`;
export const idiomOk = (x) => !!x.ex && !norm(x.m).includes(norm(x.p)) && !norm(x.ex).includes(norm(x.m));
/* Sentence Builder's sentences: the main clause against three other cuts of the same sentence */
const SUBS = /^(when|because|if|although|after|before|while|until|since|as|unless|once|whenever|though)\b/i;
export const BUILDER_Q = 'Which part is the main clause — the part that could stand alone as a sentence?';
export function builderCut(x) {
  const m = String(x.s || '').match(/^(.*)\[(.+)\](.*)$/); if (!m) return null;
  const before = m[1].trim(), after = m[3].trim(); if (before && after) return null;
  const S = (m[1] + m[2] + m[3]).replace(/\s+/g, ' ').trim(), strip = (t) => t.replace(/^[,;:\s]+|[,.!?;:\s]+$/g, '');
  const main = strip(m[2]), dep = strip(before || after);
  if (!SUBS.test(dep) || /[;:—]/.test(main + dep)) return null;
  const M = main.split(' '), D = dep.split(' '); if (M.length < 3 || D.length < 3) return null;
  const cuts = after ? [[...M.slice(1), D[0]], [...M.slice(-2), ...D.slice(0, -1)]] : [[...D.slice(-2), ...M.slice(0, -1)], [...D, M[0]]];
  const opts = [main, dep, ...cuts.map((c) => strip(c.join(' ')))];
  return new Set(opts.map(norm)).size === 4 && opts.every((o) => inText(o, S)) ? { S, opts, level: (x.band || 1) <= 1 ? 3 : 4 } : null;
}
/* Punctuation Rush's sentences: where does the ONE comma go? Three other gaps, none a comma could fairly take */
export const RUSH_Q = 'Where does the comma go?';
export const RUSH_LEVEL = { compound: 4, address: 5, aside: 5, fronted: 7 }, RUSH_STOP = { 4: 's4-conj', 5: 's5-comma', 7: 's7-vary' };
const NOGAP = /^(and|but|or|so|yet|for|nor|which|who|whom|whose|when|where|while|if|because|though|although|as|then|too|until|unless|since|after|before|that|than|said|says|cried|asked|replied|however|perhaps|indeed|sir|madam)$/i;
export function rushCut(x) {
  const words = String(x.s || '').trim().split(/\s+/), at = words.map((w, j) => (w.endsWith(',') ? j : -1)).filter((j) => j >= 0);
  if (at.length !== 1 || at[0] >= words.length - 1 || words.some((w, j) => j !== at[0] && w.includes(','))) return null;
  const bare = words.map((w) => w.replace(/,$/, '')), label = (j) => bare[j].replace(/^[“"‘'(]+|[”"’'.!?;:)]+$/g, '');
  const once = (j) => bare.filter((_, i) => norm(label(i)) === norm(label(j))).length === 1, g = at[0];
  if (!label(g) || !once(g)) return null;
  const fair = (j) => j > 0 && j !== g && Math.abs(j - g) > 1 && j < bare.length - 1 && once(j) && bare[j] === label(j) && /^[a-z]+$/.test(bare[j]) && /^[a-z]+$/.test(bare[j + 1]) && !NOGAP.test(bare[j]) && !NOGAP.test(bare[j + 1]);
  const cand = bare.map((_, j) => j).filter(fair); if (cand.length < 3) return null;
  const wrong = shuffle(rng('rush:' + x.s), cand).slice(0, 3).sort((a, b) => a - b);
  return { body: bare.join(' '), right: `after “${label(g)}”`, wrong: wrong.map((j) => `after “${label(j)}”`), level: RUSH_LEVEL[x.rule] || 5 };
}
export const FIG_KINDS = () => [...new Set([...FIGURES, ...POOLS.figures].map((f) => f.figure))].sort();
export const DEV_ALL = () => [...new Set([...RHETORIC, ...POOLS.rhetoric].map((r) => r.device))].sort();
export const TYPING_LEVEL = 1, CONTEST_LEVEL = { prose: 1, poem: 2, talk: 6 };

/* ---- the doubling (owner, 10 Oct): more of what the app already holds ---- */
/* A word met in the author's own sentence. The word is a Vocabulary word (its first deck, as above) of Bee
   difficulty 3 or more; the question is "in Bee's word list, which word in this line means …?" — Bee's meaning
   (Bee gives one sense, as a tapped word's card does; the question says whose meaning it is), and four words of
   the line itself, so every option is on the card by design. The three others are Bee words of their own
   whose meanings share nothing with it (no word of one meaning in the other), never the same word family. A
   noun used as a verb, a verb used as a noun, or a word whose ending says another part of speech than Bee's
   entry is left out. One line per word, wherever it is first taken. */
export const VOC_HOME = (() => { const m = new Map(); for (const id of VOCAB_HOME) { const d = DECKS.find((x) => x.id === id); if (d) for (const e of d.words) if (!m.has(e.w)) m.set(e.w, { d, e, L: vocabLevel(d.id, e) }); } return m; })();
export const CTX_MIN_Y = 3, CTX_WORK_MIN = 7;
export const ctxQ = (e) => `In Bee’s word list, which word in this line means “${e.d.replace(/[.;:,\s]+$/, '')}”?`;
const CTX_SKIP = new Set('that this with from have were they them their there then than what when where which while would could should shall will been being into upon over under about after before again very just only also some such said says each much many more most other these those your yours ours mine here even ever never every whom whose like well back down still once must does done made make came come went gone take took know knew thought'.split(' '));
const NOUN_AS_VERB_BEFORE = /^(to|i|he|she|we|they|you|it|who|would|could|should|will|shall|can|may|might|must|not|never|did|does|do)$/;
const NOUN_AS_VERB_AFTER = /^(the|a|an|his|her|my|their|our|him|them|me|us|its|your)$/;
const VERB_AS_NOUN_BEFORE = /^(a|an|the|his|her|my|their|our|its|this|that|your|every|each)$/;
const toksOf = (s) => String(s).match(/[A-Za-z]+(?:[’'][a-z]+)?/g) || [];
const defWords = (d, n) => norm(d).split(' ').filter((x) => x.length >= n);
/* the sense check and the three other words, or null */
export function ctxCut(e, sent) {
  const T = toksOf(sent), low = T.map((t) => t.toLowerCase()), at = T.indexOf(e.w);
  if (at < 0 || low.filter((t) => t === e.w).length !== 1) return null;
  const b = low[at - 1] || '', a = low[at + 1] || '';
  if (/noun/.test(e.ps) && (NOUN_AS_VERB_BEFORE.test(b) || NOUN_AS_VERB_AFTER.test(a))) return null;
  if (/verb/.test(e.ps) && VERB_AS_NOUN_BEFORE.test(b)) return null;
  if (!shapeFits(e.w, e.ps)) return null;
  const mine = new Set(defWords(e.d, 4)), cands = [...new Set(T.filter((t) => /^[a-z]{4,}$/.test(t) && t !== e.w && !CTX_SKIP.has(t) && low.filter((x) => x === t).length === 1))]
    .filter((t) => ctxRival(e, t, mine));
  if (cands.length < 3) return null;
  return shuffle(rng(`ctx:${e.w}:${sent.length}`), cands.sort()).slice(0, 3);
}
export function ctxRival(e, t, mine = new Set(defWords(e.d, 4))) {
  const L = LEX.words[t], d = L && L[0];
  if (!d || !kidSafe(t, d) || BLOCK.test(t) || t.slice(0, 4) === e.w.slice(0, 4) || mine.has(t) || norm(d) === norm(e.d)) return false;
  const theirs = defWords(d, 4); return !theirs.includes(e.w) && !theirs.some((x) => x.length >= 5 && mine.has(x));
}
/* test/safe.mjs's rule for a feed card, kept here so a pool's line that fails it is never cut: a card that quotes
   is held to the sentence list; any other card's words to the word list (one word) or the definition list */
const QUOTED = /^(story|tale|opening|line|speech|talk|inline|figure|comma|example|question|idiom)$/;
export function feedSafe(c) {
  const quoted = QUOTED.test(c.kind) && !/^voc~/.test(c.id), toks = (x) => String(x || '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return [c.title, c.play?.q, ...(c.play?.opts || [])].every((x) => !x || (quoted ? lineSafe(x) : toks(x).length === 1 ? !BLOCK.test(toks(x)[0]) : defSafe(x)));
}
/* a story's heading run into its first sentence ("The Lion in Love A Lion once fell…") */
const HEAD_OK = /^(in|of|and|the|a|an|to|at|on|for|with|or|from)$/, HEAD_START = /^(A|An|The|Once|There|It|One|In|When|Long|Now|This)$/;
export function headed(s) {
  const T = s.split(/\s+/);
  for (let i = 2; i < Math.min(T.length, 9); i++) { if (!/^[A-Z][a-z]*$/.test(T[i - 1]) && !HEAD_OK.test(T[i - 1])) return false; if (HEAD_START.test(T[i]) && /^[A-Z]/.test(T[0])) return true; }
  return false;
}
/* a word whose ending says one part of speech while Bee's entry says another ("portable", given as a noun) is
   left out: the line will be using the other sense */
const ADJ_END = /(able|ible|ous|ful|ive|less|ic|ical|ish|ary)$/, NOUN_END = /(ness|ment|tion|sion|ity|ship|hood|ance|ence|ism)s?$/;
export const shapeFits = (w, ps) => !((/noun/.test(ps) && (ADJ_END.test(w) || /ly$/.test(w))) || (/(verb|adj)/.test(ps) && NOUN_END.test(w)));
/* a line from anywhere in a held text (not one of the Library's chosen passages) keeps clear of the dark and the
   sacred: no killing, death, war, cruelty or worship on a card cut this way */
export const DARK = /\b(kill\w*|slay|slain|slew|murder\w*|blood\w*|corpse\w*|dead|death\w*|die|died|dies|dying|tore|torn|limb|limbs|war|wars|battle\w*|wound\w*|gun\w*|shot|shoot\w*|hang\w*|whip\w*|beat|beaten|cruel\w*|devil\w*|god|gods|goddess\w*|lord|christ\w*|heaven\w*|hell|church\w*|pray\w*|bible|sin|sins|sinner\w*|negro\w*|savage\w*|slave\w*|indians?|race|races|wine|beer|drunk\w*|poison\w*|weapon\w*|sword\w*|sabre\w*|knife|knives|enem\w*|prison\w*|grave|graves|ghost\w*|germany|german|french|english|jew\w*|turk\w*|moor\w*)\b/i;
export const ctxSentOk = (s) => s.length >= 50 && s.length <= 260 && /^[“"‘']?[A-Z]/.test(s) && /[.!?][’”"']?$/.test(s) && !/[_[\]{}<>|*#]/.test(s) && lineSafe(s);
/* Story Ears' questions answered with pictures: the pictures' own words become the options */
export const earsLabel = (k) => earsPic(k)?.label || '';
export const EARS_FIRST = 'Which of these happened first?';
/* the Podium's offered lines with a device worked in: only a version that shows exactly its own device */
export const POD_Q = 'Which device from Writer’s Craft is worked into this line?';
export const podName = (id) => POD_DEVICES.find((d) => d.id === id)?.name;
export function podLines() {
  const out = [];
  for (const t of POD_TOPICS) for (const part of ['hooks', 'points', 'closes']) (t[part] || []).forEach((l, i) => {
    for (const [d, v] of Object.entries(l.v || {})) { const got = devicesIn(v); if (got.length === 1 && got[0] === d && podName(d)) out.push({ t, part, i, d, v }); }
  });
  return out;
}
/* Rhetoric Duel: the line as the writer wrote it against the plainer version written for the game */
export const duelQ = (device) => `Which line uses ${/^[aeiou]/.test(device) ? 'an' : 'a'} ${device} — ${DEVICE_GLOSS[device] || device}?`;
export const DUEL_BODY = 'One is the line as the writer wrote it; the other is a plainer version, written for this game.';
export const duelPools = () => [['duel', RHETORIC, PLAIN], ['duelm', POOLS.rhetoric, { ...PLAIN, ...POOLS.plain }]];
/* Plot Line: which scene comes first, and which last — the game's own stories and openings */
export const PLOT_Q = { first: 'Which of these happens first?', last: 'Which of these happens last?' };
export function plotSources() {
  const passages = Object.values(TEXTS).filter((t) => shippedP(PASSAGES.find((p) => p.id === t.id)));
  const chapters = BOOKS.filter((b) => quotable(work(b.id))).flatMap((b) => BOOKDATA[b.id].chapters.filter((c) => !b.chapters.find((x) => x.n === c.n)?.needsReview)
    .map((c) => ({ book: b.id, n: c.n, short: b.short, band: b.band, scenes: c.scenes || [] })));
  return plotStories(passages, WORKS, chapters, 4);
}
/* Where a word comes from: Bee's own etymology, as the word's page shows it ("Where it comes from") — never
   one with a date in it (a date awaits a reviewer, as the Language stops' do) */
export const etymOf = (w) => { const e = LEX.words[w], t = e && e[5]; return t && t.length <= 220 && !/\b1\d{3}\b|centur/i.test(t) && defSafe(t) && lineSafe(t) ? t : ''; };
/* Register: the Word strand's formal and everyday pairs (data/wordparts.js REGISTER). A wrong option is never a
   pair whose everyday word shares a meaning with this one (start · begin): those stand together here */
export const REG_SAME = [['start', 'begin'], ['finish', 'end', 'stop'], ['get', 'find'], ['live', 'home'], ['tell', 'show', 'answer'], ['leave', 'end'], ['watch', 'show'], ['need', 'extra']];
const regKin = (a, b) => a === b || REG_SAME.some((g) => g.includes(a) && g.includes(b));
export const REG_Q = { formal: (x) => `Which word is the formal way to say “${x.informal}”?`, informal: (x) => `Which everyday word means the same as “${x.formal}”?` };
export function regCut(i, side) {
  const x = WP.REGISTER[i], other = side === 'formal' ? 'informal' : 'formal', R = rng(`reg:${i}:${side}`);
  const wrong = shuffle(R, WP.REGISTER.filter((y, j) => j !== i && !regKin(y.informal, x.informal)).map((y) => y[side])).slice(0, 3);
  return wrong.length === 3 && !wrong.includes(x[side]) ? { q: REG_Q[side](x), right: x[side], wrong, ask: x[other] } : null;
}
/* Root Forge: the parts on the anvil, and the word they forge — against three words the forge makes from a part
   they share (or, short of those, any three) */
export const FORGE = forgeOf(LEX, WP);
export const FORGE_Q = 'Which word do these parts forge?';
export const forgeTitle = (ids) => `Root Forge: ${ids.map((id) => FORGE.part(id).t).join(' + ')}`;
export function forgeCut(word) {
  const e = FORGE.words.get(word); if (!e) return null;
  const same = (ids) => ids.length === e.ids.length && ids.every((id) => e.ids.includes(id));
  const all = [...FORGE.words].filter(([w, x]) => w !== word && !same(x.ids) && kidSafe(w, LEX.words[w]?.[0]) && !BLOCK.test(w)), R = rng('forge:' + word);
  const near = shuffle(R, all.filter(([, x]) => x.ids.some((id) => e.ids.includes(id))).map(([w]) => w).sort());
  const wrong = [...near, ...shuffle(R, all.map(([w]) => w).sort()).filter((w) => !near.includes(w))].slice(0, 3);
  return wrong.length === 3 ? { ids: e.ids, wrong } : null;
}

function grow(cards, add, play) {
  const have = new Set(cards.map((c) => c.id)), bodies = new Set(cards.map((c) => norm(c.body || '')));
  const A = [], B = {}, C = {};                                  // always · the big pools · more generator items
  const pool = (o, L, name, c) => (((o[L] ||= {})[name] ||= []).push(c));

  /* --- always: the small sources --- */
  TY_LESSONS.forEach((l, i) => A.push({ id: `typing~${l.id}`, kind: 'typing', src: `typing:${l.id}`, level: TYPING_LEVEL, bands: [1, 2, 3], topics: ['strand:writing', 'tool:typing'],
    where: `${placeName('writing', TYPING_LEVEL)} · Typing Trainer`, title: l.name, body: l.tip, more: l.seq ? `Practises the keys: ${l.seq}` : '', route: `#/tools/typing/${l.id}`, cta: `Lesson ${i + 1}: ${l.name}` }));
  for (const r of ROUNDS) { const L = CONTEST_LEVEL[r.id]; if (!L) continue;
    A.push({ id: `contest~${r.id}`, kind: 'contest', src: `contest:${r.id}`, level: L, bands: [1, 2, 3], topics: ['strand:speaking', 'contest'], where: `${placeName('speaking', L)} · The Elocution Contest`,
      title: `The Elocution Contest: ${r.title}`, body: r.say, more: taughtAt('speaking', L), route: '#/stage/contest', cta: 'The Elocution Contest' }); }
  // no certificate cards: they advertised a reward rather than taught anything (owner, 4 Oct — audit V3)
  for (const r of MYTH_JOURNEY) {
    const ps = r.stops.map((id) => PASSAGES.find((p) => p.id === id)).filter(shippedP); if (!ps.length) continue;
    const L = Math.min(...ps.map(levelOf));
    A.push({ id: `mythroom~${r.id}`, kind: 'myths', src: `mythroom:${r.id}`, level: L, bands: bandsFrom(Math.min(...ps.map((p) => p.band || 1))), topics: ['strand:reading', ...ps.map((p) => `stop:rd-${p.id}`)],
      where: `${placeName('reading', L)} · The Greek myths`, title: r.title, body: r.note, more: `Told in: ${ps.map((p) => `“${p.title}”`).join(' · ')}.`, route: '#/library/myths', cta: 'The Greek myths' });
  }
  for (const c of WHO) {
    const p = PASSAGES.find((x) => x.id === c.passage); if (!shippedP(p)) continue;
    const L = levelOf(p), base = { level: L, bands: bandsFrom(p.band), topics: [`stop:rd-${p.id}`, 'strand:reading', `work:${p.work}`], key: `stop:rd-${p.id}`, where: `${placeName('reading', L)} · Who’s who in the myths`,
      more: `Who’s who: ${c.fact}`, route: `#/story/${p.id}`, cta: `Hear “${p.title}”` };
    A.push({ ...base, id: `who~${slug(c.name)}`, kind: 'who', src: `who:${c.name}#quote`, title: c.name, body: `“${c.quote}”`, cite: p.work, quote: c.quote, source: `${p.title} — ${work(p.work).author}` });
    if (c.greek && quotable(work(c.greek.work))) A.push({ ...base, id: `who~${slug(c.name)}~greek`, kind: 'who', src: `who:${c.name}#greek`, title: `${c.name} and ${c.greek.name}`, body: `“${c.greek.quote}”`, cite: c.greek.work, quote: c.greek.quote, source: `${work(c.greek.work).title} — ${work(c.greek.work).author}` });
  }
  for (const a of AUTHORS) {
    if (isGated(a)) continue;
    const ps = authorPassages(a).filter(shippedP), ws = authorWorks(a).filter(workOk); if (!ps.length || !ws.length) continue;
    const L = Math.min(...ps.map(levelOf)), life = lifeNote(a);
    A.push({ id: `author~${a.id}`, kind: 'author', src: `author:${a.id}`, level: L, bands: bandsFrom(Math.min(...ps.map((p) => p.band || 1))), topics: ['strand:reading', ...ws.map((w) => `work:${w.id}`)],
      where: `${placeName('reading', L)} · The authors`, title: a.name, body: life && workOk(life.work) ? life.basis : '', more: `Their books in the Library: ${ws.map((w) => w.title).join(' · ')}.`,
      route: `#/library/author/${a.id}`, cta: `${a.name} in the Library` });
  }
  for (const w of WORKS) {
    if (!workOk(w) || !w.why) continue;
    const ps = PASSAGES.filter((p) => p.work === w.id && shippedP(p)); if (!ps.length) continue;
    const L = Math.min(...ps.map(levelOf));
    A.push({ id: `why~${w.id}`, kind: 'why', src: `why:${w.id}`, level: L, bands: bandsFrom(Math.min(...ps.map((p) => p.band || 1))), topics: ['strand:reading', `work:${w.id}`],
      where: `${placeName('reading', L)} · the Library`, title: `Why read ${w.title}?`, body: w.why, source: `${w.author}, ${w.year}`, more: `Told in the Library: ${ps.slice(0, 3).map((p) => `“${p.title}”`).join(' · ')}.`, route: `#/book/${w.id}`, cta: `${w.title} in the Library` });
  }
  const shelfKeys = new Set(quoteShelf([...LINES, ...MORE_LINES], WORKS).map((x) => x.key)), lineTexts = new Set(LINES.map((l) => norm(l.text)));
  MORE_LINES.forEach((l, i) => {
    const w = work(l.work), L = w && workLevel(w.id); if (!quotable(w) || !L || lineTexts.has(norm(l.text)) || !shelfKeys.has(authorKey(w.author))) return;
    A.push({ id: `mline~${i}`, kind: 'line', src: `mline:${i}`, level: L, bands: bandsOfLevel(L), topics: [`work:${l.work}`, 'tool:quotes'], where: `${placeName('reading', L)} · Quotes & Poems`, title: `A line from ${w.title}`,
      body: l.text, cite: l.work, quote: l.text, source: l.who, route: `#/tools/quotes/${authorKey(w.author)}`, cta: `${w.author} in Quotes & Poems` });
  });
  for (const g of games()) for (const [n, t] of Object.entries(g.levels)) A.push({ id: `game~${g.id}~${n}`, kind: 'game', src: `glevel:${g.id}#${n}`, bands: [1, 2, 3], topics: [`game:${g.id}`], where: `Play · ${g.name}`,
    title: `${g.name}, level ${n}`, body: stop(t.charAt(0).toUpperCase() + t.slice(1)), more: stop(`Practises ${g.practises}`), route: `#/play/${g.id}`, cta: `Play ${g.name}` });

  /* --- the doubling: the whole books' own lines, openings and words (Reading 8) --- */
  for (const b of BOOKS) {
    if (!quotable(work(b.id))) continue;
    for (const c of b.chapters) {
      if (c.needsReview) continue;
      const full = BOOKDATA[b.id].chapters.find((x) => x.n === c.n); if (!full) continue;
      const text = (full.scenes || []).join(' ').replace(/\s+/g, ' '), where = `${placeName('reading', 8)} · ${b.title}`, route = `#/whole/${b.id}/${c.n}`, cta = `Chapter ${c.n}: ${c.title}`;
      const base = { level: 8, bands: bandsFrom(b.band), topics: [`stop:bk-${b.id}-${c.n}`, 'strand:reading', `work:${b.id}`], key: `stop:bk-${b.id}-${c.n}`, where, source: `${b.title} — ${b.author}`, route, cta };
      const taught = stop(`Taught at: ${b.short}, chapter ${c.n}: ${c.title}`), open = opening(text);
      if (open && held(b.id).includes(open)) A.push({ ...base, id: `bk~${b.id}~${c.n}~open`, kind: 'opening', src: `chapter:${b.id}/${c.n}#open`, title: `How chapter ${c.n} begins: ${c.title}`, body: open, cite: b.id, quote: open, more: taught, cta: `Hear the rest of chapter ${c.n}` });
      if (full.line && held(b.id).includes(full.line)) A.push({ ...base, id: `bk~${b.id}~${c.n}~line`, kind: 'line', src: `chapter:${b.id}/${c.n}#line`, title: `A line from ${b.short}, chapter ${c.n}`, body: full.line, cite: b.id, quote: full.line, more: taught });
      const sents = sentences(text);
      for (const wd of full.wordBank || []) {
        const lw = String(wd).toLowerCase(), e = LEX.words[lw]; if (!e || !e[0] || !kidSafe(lw, e[0])) continue;
        const line = sents.find((x) => x.length <= 300 && held(b.id).includes(x) && new RegExp(`\\b${esc(wd)}\\b`, 'i').test(x)); if (!line) continue;
        A.push({ ...base, id: `bk~${b.id}~${c.n}~w~${lw}`, kind: 'inline', src: `chword:${b.id}/${c.n}#${lw}`, title: `“${lw}” in ${b.short}, chapter ${c.n}`, body: line, cite: b.id, quote: line, more: stop(`Bee’s meaning: ${e[0]}`) });
      }
    }
  }

  /* --- the doubling: Story Ears' questions (a game: no level) --- */
  const earsSeen = new Set();
  for (const st of EARS_STORIES) {
    const p = PASSAGES.find((x) => x.id === st.passage), w = p && work(p.work); if (!shippedP(p)) continue;
    const base = { bands: [1, 2, 3], topics: ['game:ears', `stop:rd-${p.id}`, `work:${p.work}`], where: 'Play · Story Ears', title: `Story Ears: ${p.title}`, more: stop(`Told in “${p.title}” — ${w.title}, ${w.author}`), route: '#/ears', cta: 'Play Story Ears' };
    st.qs.forEach((q, j) => {
      const holds = q.kind === 'order' ? q.holds[0] : q.holds; if (!holds || !held(p.work).includes(holds) || !lineSafe(holds)) return;
      const labels = (q.kind === 'order' ? q.seq : q.pics).map(earsLabel); if (labels.some((x) => !x) || new Set(labels.map(norm)).size !== labels.length) return;
      const same = `${p.id}|${q.kind === 'order' ? EARS_FIRST : q.ask}|${labels.join('|')}`; if (earsSeen.has(same)) return; earsSeen.add(same);   // the same question of the same story, asked by two runs
      A.push({ ...base, id: `ears~${st.id}~${j}`, kind: 'game', src: `ears:${st.id}#${j}`, play: play(q.kind === 'order' ? EARS_FIRST : q.ask, labels[0], labels.slice(1), `“${holds}”`) });
    });
  }
  /* --- the doubling: the avatars' cards — a real fact each (the Collection; no level) --- */
  for (const a of ALL_AVATARS) {
    const t = CARD_TEXT[a.id]; if (!t?.fact) continue;
    A.push({ id: `av~${a.id}`, kind: 'creature', src: `avatar:${a.id}`, bands: [1, 2, 3], topics: ['collection'], where: `The Collection · ${a.packName || PACK_NAMES[a.pack - 1] || 'Bizzing English'}`,
      title: a.name, body: t.fact, source: t.from || undefined, more: `On its card in the Collection: ${t.lore}`, route: '#/collection', cta: 'The Collection' });
  }
  /* --- the doubling: Plot Line's stories — which scene comes first (a game: no level) --- */
  for (const s of plotSources()) {
    const opts = s.cards.map((x) => x.text); if (opts.length < 3 || s.cards.some((x, j) => x.at !== j) || !opts.every((o) => defSafe(o) && lineSafe(o) && held(s.work).includes(o.replace(/…$/, '')))) continue;
    for (const [end, right] of [['first', 0], ['last', opts.length - 1]])
      A.push({ id: `plot~${s.id}~${end}`, kind: 'game', src: `plot:${s.id}#${end}`, bands: bandsFrom(s.band), topics: ['game:plot', `work:${s.work}`, ...(PASSAGES.some((p) => p.id === s.id) ? [`stop:rd-${s.id}`] : [])], where: 'Play · Plot Line',
        title: `Plot Line: ${s.title}`, play: play(PLOT_Q[end], opts[right], opts.filter((_, j) => j !== right), ''), more: stop(`Practises ${GAMES.plot.practises}`), source: `${work(s.work).title} — ${work(s.work).author}`, route: '#/play/plot', cta: 'Play Plot Line' });
  }
  /* --- the doubling: Root Forge — the parts, and the word they forge (a game: no level) --- */
  for (const [word, e] of FORGE.words) {
    const f = kidSafe(word, LEX.words[word]?.[0]) && forgeCut(word); if (!f) continue;
    const band = Math.max(...e.ids.map((id) => FORGE.part(id).band || 1));
    A.push({ id: `forge~${word}`, kind: 'game', src: `forge:${word}`, bands: bandsFrom(band), topics: ['game:root'], where: 'Play · Root Forge', title: forgeTitle(e.ids),
      play: play(FORGE_Q, word, f.wrong, stop(`Bee’s meaning: ${LEX.words[word][0]}`)), more: stop(`Practises ${GAMES.root.practises}`), route: '#/play/root', cta: 'Play Root Forge' });
  }
  /* --- the doubling: register — the formal word and the everyday one (Word 8) --- */
  const w8 = firstStop('word', 8);
  if (w8) WP.REGISTER.forEach((x, i) => { for (const side of ['formal', 'informal']) { const r = regCut(i, side); if (!r) continue;
    A.push({ id: `reg~${i}~${side}`, kind: 'register', src: `register:${i}#${side}`, level: 8, bands: bandsFrom(w8.band), topics: [`stop:${w8.id}`, 'strand:word'], key: `stop:${w8.id}`, where: placeName('word', 8),
      title: side === 'formal' ? `Said formally: “${x.informal}”` : `Said every day: “${x.formal}”`, play: play(r.q, r.right, r.wrong, ''), more: stop(`Taught at: ${placeName('word', 8)} — ${w8.title}`), route: stopRoute(w8), cta: `${w8.title} on the Word road` }); } });
  /* --- the doubling: Rhetoric Duel — the real line against its plainer version (Language 7) --- */
  for (const [pre, list, plain] of duelPools()) list.forEach((r, i) => {
    const w = work(r.work), p = plain[r.text]; if (!quotable(w) || !p || !held(r.work).includes(r.text) || ![r.text, p].every((o) => defSafe(o) && lineSafe(o)) || norm(p) === norm(r.text)) return;
    const by = teaches('la', r.device)[0], L = by ? by.level : 7;
    A.push({ id: `${pre}~${i}`, kind: 'device', src: `${pre}:${i}`, level: L, bands: by ? bandsFrom(by.band) : [2, 3], topics: ['strand:language', `work:${r.work}`, 'game:duel'], where: `${placeName('language', L)} · Rhetoric Duel`,
      title: `Two lines: ${w.title}`, body: DUEL_BODY, source: w.author, play: play(duelQ(r.device), r.text, [p], ''), more: by ? stop(`Taught at: ${placeName(by.strand, by.level)} — ${by.title}`) : taughtAt('language', 7),
      route: '#/play/duel', cta: 'Play Rhetoric Duel' });
  });

  /* --- the big pools --- */
  const seenWord = new Set(cards.filter((c) => c.src.startsWith('gen:def2word') || c.src.startsWith('gen:word2def')).map((c) => c.play.opts[0]));
  const carded = new Set();
  for (const id of VOCAB_HOME) {
    const d = DECKS.find((x) => x.id === id); if (!d) continue;
    d.words.forEach((e, i) => {
      if (carded.has(e.w) || seenWord.has(e.w)) return; carded.add(e.w);
      const L = vocabLevel(d.id, e), it = vocItem(d, e, i); if (!L || it.options.length !== 4) return;
      const right = it.options[it.answer], inLex = !!LEX.words[e.w];
      pool(B, L, 'vocab', { id: `voc~${slug(e.w)}`, kind: 'vocab', src: `vocab:${d.id}#${e.w}`, level: L, bands: bandsOfLevel(L), topics: ['strand:word', `word:${e.w}`, 'tool:vocab'], where: `${placeName('word', L)} · Vocabulary`,
        title: e.w, body: [e.ps, e.p].filter(Boolean).join(' · '), play: play(vocabQ(e.w), right, it.options.filter((_, j) => j !== it.answer), ''), more: `From Bee’s ${d.group === 'Bee’s lists' ? 'list' : 'deck'}: ${d.label} — ${d.sub}.`,
        route: inLex ? `#/word/${encodeURIComponent(e.w)}` : `#/tools/vocab/${d.id}`, cta: inLex ? `“${e.w}” in the word list` : `${d.label} in Vocabulary` });
    });
  }
  IDIOMS.forEach((x, i) => {
    if (!idiomOk(x)) return;
    const [sid, L] = idiomPlace(x), it = idiomItem(IDIOMS, x, i); if (it.options.length !== 4) return;
    pool(B, L, x.t === 'simile' ? 'simile' : 'idiom', { id: `idiom~${i}`, kind: 'idiom', src: `idiom:${i}`, level: L, bands: DIFF_BANDS[x.diff] || [2, 3], topics: [`strand:${sid}`, 'tool:idioms'], where: `${placeName(sid, L)} · Idioms & Similes`,
      title: `“${x.p}”`, body: x.ex, play: play(idiomQ(x), x.m, it.options.filter((_, j) => j !== it.answer), ''), more: `From Bizzing Bee’s Idioms & Similes list: ${x.t === 'proverb' ? 'a proverb' : `an ${x.t}`}.`.replace('an simile', 'a simile'),
      route: `#/tools/idioms/p/${encodeURIComponent(x.p)}`, cta: `“${x.p}” in Idioms & Similes` });
  });
  const s3 = stopById('s3-main');
  POOLS.builder.forEach((x, i) => {
    const w = work(x.work), b = quotable(w) && builderCut(x); if (!b || !held(x.work).includes(b.S)) return;
    pool(B, b.level, 'builder', { id: `build~${i}`, kind: 'clause', src: `builder:${i}`, level: b.level, bands: bandsFrom(x.band), topics: ['strand:sentence', 'game:builder', `work:${x.work}`], where: `${placeName('sentence', b.level)} · Sentence Builder`,
      title: `A sentence from ${w.title}`, body: b.S, cite: x.work, quote: b.S, source: w.author, play: play(BUILDER_Q, b.opts[0], b.opts.slice(1), ''), more: s3 ? stop(`Taught at: ${placeName('sentence', 3)} — ${s3.title}`) : '', route: '#/play/builder', cta: 'Play Sentence Builder' });
  });
  POOLS.rush.forEach((x, i) => {
    const w = work(x.work), r = quotable(w) && rushCut(x); if (!r) return;
    pool(B, r.level, 'rush', { id: `rush~${i}`, kind: 'comma', src: `rush:${i}`, level: r.level, bands: bandsFrom(x.band), topics: ['strand:sentence', 'game:rush', `work:${x.work}`], where: `${placeName('sentence', r.level)} · Punctuation Rush`,
      title: `A sentence from ${w.title}, its comma taken out`, body: r.body, source: w.author, play: play(RUSH_Q, r.right, r.wrong, ''), more: stop(`Taught at: ${placeName('sentence', r.level)} — ${stopById(RUSH_STOP[r.level]).title}`), route: '#/play/rush', cta: 'Play Punctuation Rush' });
  });
  const figTexts = new Set(FIGURES.map((f) => norm(f.text))), KINDS = FIG_KINDS();
  POOLS.figures.forEach((f, i) => {
    const w = work(f.work); if (!quotable(w) || figTexts.has(norm(f.text)) || !held(f.work).includes(f.text)) return;
    const by = teaches('li', f.figure)[0];
    pool(B, 5, 'figure', { id: `figm~${i}`, kind: 'figure', src: `figmore:${i}`, level: 5, bands: [2, 3], topics: ['strand:literature', `work:${f.work}`, 'game:figure'], where: `${placeName('literature', 5)} · Figure Hunt`,
      title: `A line from ${w.title}`, body: f.text, cite: f.work, quote: f.text, source: w.author, play: play('Which figure of speech is this line?', f.figure, KINDS.filter((k) => k !== f.figure), ''),
      more: by ? stop(`Taught at: ${placeName(by.strand, by.level)} — ${by.title}`) : taughtAt('literature', 5), route: '#/play/figure', cta: 'Figure Hunt' });
  });
  const rhTexts = new Set(RHETORIC.map((r) => norm(r.text))), DEV = DEV_ALL();
  POOLS.rhetoric.forEach((r, i) => {
    const w = work(r.work); if (!quotable(w) || rhTexts.has(norm(r.text)) || !held(r.work).includes(r.text)) return;
    const by = teaches('la', r.device)[0], L = by ? by.level : 7, wrong = DEV.filter((d) => d !== r.device && !(r.also || []).includes(d)).slice(0, 3); if (wrong.length < 3) return;
    pool(B, L, 'rhetoric', { id: `rhm~${i}`, kind: 'device', src: `rhmore:${i}`, level: L, bands: by ? bandsFrom(by.band) : [2, 3], topics: ['strand:language', `work:${r.work}`, 'game:duel'], where: by ? placeName(by.strand, by.level) : placeName('language', 7),
      title: `A line from ${w.title}`, body: r.text, cite: r.work, quote: r.text, source: w.author, play: play('Which device is the speaker using here?', r.device, wrong, ''),
      more: by ? stop(`Taught at: ${placeName(by.strand, by.level)} — ${by.title}`) : taughtAt('language', 7), route: by ? stopRoute(by) : '#/play/duel', cta: by ? `${by.title} on the Language road` : 'Play Rhetoric Duel' });
  });

  /* --- the doubling: the Podium's lines with a device worked in (Language 7, where the devices are taught) --- */
  for (const x of podLines()) {
    const dv = POD_DEVICES.find((d) => d.id === x.d), by = teaches('la', dv.craft)[0], L = by ? by.level : 7, right = podName(x.d);
    pool(B, L, 'podium', { id: `pod~${x.t.id}~${x.part[0]}${x.i}~${x.d}`, kind: 'craft', src: `podium:${x.t.id}/${x.part}/${x.i}#${x.d}`, level: L, bands: by ? bandsFrom(by.band) : [2, 3], topics: ['strand:language', 'game:podium'],
      where: `${placeName('language', L)} · The Podium`, title: `A line for a speech: ${x.t.title}`, body: x.v, play: play(POD_Q, right, POD_DEVICES.filter((d) => d.id !== x.d).map((d) => d.name), dv.how),
      more: by ? stop(`Taught at: ${placeName(by.strand, by.level)} — ${by.title}`) : taughtAt('language', 7), route: '#/stage/podium', cta: 'The Podium' });
  }
  /* --- the doubling: where a Vocabulary word comes from (the word's rung, as its Vocabulary card) --- */
  for (const [w, h] of VOC_HOME) {
    const t = etymOf(w); if (!t || !h.L) continue;
    pool(B, h.L, 'origin', { id: `etym~${slug(w)}`, kind: 'origin', src: `etym:${w}`, level: h.L, bands: bandsOfLevel(h.L), topics: ['strand:word', `word:${w}`], where: `${placeName('word', h.L)} · Where words come from`,
      title: w, body: t, source: 'Bizzing Bee’s word list', more: stop(`Its meaning: ${h.e.d}`), route: `#/word/${encodeURIComponent(w)}`, cta: `“${w}” in the word list` });
  }
  /* --- the doubling: a word met in the author's own sentence --- */
  const ctx = (e, sent, base) => { const wrong = ctxCut(e, sent); return wrong && { ...base, kind: 'context', body: sent, play: play(ctxQ(e), e.w, wrong, '') }; };
  const ctxWord = (w, skip) => { const h = VOC_HOME.get(w); return h && h.e.y >= CTX_MIN_Y && !skip.has(w) ? h : null; };
  /* (a) the whole books, chapter by chapter (Reading 8) */
  for (const b of BOOKS) {
    if (!quotable(work(b.id))) continue;
    for (const c of b.chapters) {
      const full = BOOKDATA[b.id].chapters.find((x) => x.n === c.n); if (c.needsReview || !full) continue;
      const skip = new Set((full.wordBank || []).map((x) => x.toLowerCase())), done = new Set();
      for (const s of sentences((full.scenes || []).join(' ').replace(/\s+/g, ' '))) {
        if (!ctxSentOk(s) || !held(b.id).includes(s)) continue;
        for (const t of new Set(toksOf(s))) { const h = !done.has(t) && ctxWord(t, skip); if (!h) continue;
          const c2 = ctx(h.e, s, { id: `cx~${b.id}${c.n}~${t}`, src: `ctx:chapter/${b.id}/${c.n}/${t}`, level: 8, bands: bandsFrom(b.band), topics: [`stop:bk-${b.id}-${c.n}`, 'strand:reading', `work:${b.id}`], key: `stop:bk-${b.id}-${c.n}`,
            where: `${placeName('reading', 8)} · ${b.title}`, title: `A line from ${b.short}, chapter ${c.n}`, cite: b.id, quote: s, source: `${b.title} — ${b.author}`, more: stop(`Met in ${b.short}, chapter ${c.n}: ${c.title}`), route: `#/whole/${b.id}/${c.n}`, cta: `Chapter ${c.n}: ${c.title}` });
          if (c2) { done.add(t); pool(B, 8, 'context', c2); } }
      }
    }
  }
  /* (b) the Library's passages (the passage's Reading level) */
  for (const p of PASSAGES) {
    const T = TEXTS[p.id]; if (!shippedP(p)) continue;
    const L = levelOf(p), skip = new Set((T.wordBank || p.words || []).map((x) => String(x).toLowerCase())), done = new Set();
    for (const s of sentences(T.text)) {
      if (!ctxSentOk(s) || !held(p.work).includes(s)) continue;
      for (const t of new Set(toksOf(s))) { const h = !done.has(t) && ctxWord(t, skip); if (!h) continue;
        const c2 = ctx(h.e, s, { id: `cx~${p.id}~${t}`, src: `ctx:passage/${p.id}/${t}`, level: L, bands: bandsFrom(p.band), topics: [`stop:rd-${p.id}`, 'strand:reading', `work:${p.work}`], key: `stop:rd-${p.id}`,
          where: `${placeName('reading', L)} · the Library`, title: `A line from “${p.title}”`, cite: p.work, quote: s, source: `${work(p.work).title} — ${work(p.work).author}`, more: stop(`Taught at: ${placeName('reading', L)} — “${p.title}”`), route: `#/story/${p.id}`, cta: `Hear “${p.title}”` });
        if (c2) { done.add(t); pool(B, L, 'context', c2); } }
    }
  }
  /* (c) Bee's hardest words (rung 7–10), met anywhere in a held, cleared text: the word's own rung */
  const want = new Map([...VOC_HOME].filter(([, h]) => h.L >= CTX_WORK_MIN && h.e.y >= CTX_MIN_Y));
  const told = new Set(PASSAGES.filter(shippedP).map((p) => p.work).concat(BOOKS.map((b) => b.id)));
  for (const w of [...WORKS.filter((x) => told.has(x.id)), ...WORKS.filter((x) => !told.has(x.id))]) {
    if (!want.size) break;
    if (!quotable(w)) continue;
    for (const s of sentences(held(w.id))) {
      if (!ctxSentOk(s) || DARK.test(s) || headed(s)) continue;
      for (const t of new Set(toksOf(s))) { const h = want.get(t); if (!h) continue;
        const c2 = ctx(h.e, s, { id: `cxw~${slug(t)}`, src: `ctx:work/${w.id}/${t}`, level: h.L, bands: bandsOfLevel(h.L), topics: ['strand:word', `work:${w.id}`], where: `${placeName('word', h.L)} · Bee’s words in the classics`,
          title: `A line from ${w.title}`, cite: w.id, quote: s, source: `${w.title} — ${w.author}`, more: stop(`Met in ${w.title}, by ${w.author}`), route: `#/book/${w.id}`, cta: `${w.title} in the Library` });
        if (c2) { want.delete(t); pool(B, h.L, 'context', c2); } }
    }
  }

  /* --- more of the generators' own items, for a level still short --- */
  const twin = new Set(cards.filter((c) => c.src.startsWith('gen:')).map((c) => `${c.key}|${c.play.q}|${[...c.play.opts].sort().join('|')}`));
  for (const st of allStops()) {
    if (st.needsReview || AUTHORED.get(st.id) || /^(desk|speak|readAloud|authored)$/.test(st.kind)) continue;
    const where = placeName(st.strand, st.level), taught = stop(`Taught at: ${where} — ${st.title}`), cta = `${st.title} on the ${strandOf(st.strand).title} road`;
    for (const b of bandsFrom(st.band)) {
      let ks; try { ks = keys(st.kind, { band: b, lex: LEX, stop: st.id }); } catch { continue; }
      let n = 0, miss = 0;
      for (const key of shuffle(rng(`fill:${st.id}:${b}`), ks)) {
        if (n >= 100 || miss >= 40) break;                        // a generator whose items are not a card's (tap, type, say) is left at once
        let it; try { it = make(st.kind, key, { band: b, lex: LEX, stop: st.id }); } catch { miss++; continue; }
        if (!it || it.type !== 'mc' || it.say || it.fixed) { miss++; continue; }
        const right = it.options[it.answer], tk = `stop:${st.id}|${it.prompt}|${[...it.options].sort().join('|')}`;
        if (twin.has(tk)) continue;
        const c = { level: st.level, bands: [b], topics: [`stop:${st.id}`, `strand:${st.strand}`], key: `stop:${st.id}`, where, route: stopRoute(st), cta, id: `${st.id}~g${b}~${String(key).replace(/[^\w-]+/g, '_').slice(0, 40)}`, kind: 'question',
          src: `gen:${st.kind}#${b}#${key}`, title: st.title, body: genBody(it, st), play: play(it.prompt, right, it.options.filter((_, j) => j !== it.answer), it.explain || ''), more: taught };
        if (have.has(c.id) || leaks(c)) continue;
        twin.add(tk); pool(C, st.level, st.id, c); n++;
      }
    }
  }

  /* --- fill each level: always the small sources, then the pools in turn, then the generators --- */
  const size = (c) => JSON.stringify(bodyOf(c)).length + 8, count = {}, bytes = {}, ctxTaken = new Set();
  for (const c of cards) if (c.level != null) { count[c.level] = (count[c.level] || 0) + 1; bytes[c.level] = (bytes[c.level] || 0) + size(c); }
  const take = (c) => {
    if (have.has(c.id) || leaks(c) || beeQuoted(c) || (c.body && c.kind !== 'game' && c.kind !== 'certificate' && bodies.has(norm(c.body)) && c.cite)) return false;
    if (c.kind === 'context' && ctxTaken.has(c.play.opts[0])) return false;   // one line per word
    if (!feedSafe(c)) return false;
    const L = c.level; if (L != null && ((count[L] || 0) >= BUDGET || (bytes[L] || 0) + size(c) > BYTES)) return false;
    const n0 = cards.length; add(c); if (cards.length === n0) return false;
    have.add(c.id); if (c.body) bodies.add(norm(c.body)); if (c.kind === 'context') ctxTaken.add(c.play.opts[0]); if (L != null) { count[L] = (count[L] || 0) + 1; bytes[L] = (bytes[L] || 0) + size(c); }
    return true;
  };
  A.forEach(take);
  for (const tier of [B, C]) for (let L = 1; L <= 10; L++) {
    const lists = Object.entries(tier[L] || {}).sort(([a], [b]) => (a < b ? -1 : 1)).map(([name, l]) => hashOrder(l, name));
    for (let i = 0, any = true; any && (count[L] || 0) < BUDGET; i++) { any = false; for (const l of lists) if (i < l.length) { any = true; take(l[i]); } }
  }
}

/* the games, as games.js names them (that file belongs to the games; only its words are read) */
export const games = () => Object.entries(GAMES).map(([id, g]) => ({ id, name: g.name, practises: g.practises, how: g.how, levels: g.levels || {} }));

export function manifest(cards) {
  const byLevel = {}; let agnostic = 0, plays = 0;
  for (const c of cards) { if (c.level == null) agnostic++; else byLevel[c.level] = (byLevel[c.level] || 0) + 1; if (c.play) plays++; }
  return { total: cards.length, byLevel, agnostic, plays };
}

/* The cards ship in two lazy steps (Maths' split): an INDEX with only the ranking fields (no words),
   loaded when #/feed opens, then one group of words per level (g-L1 … g-L10, g-any), loaded only for
   the levels today's session draws from. None of it is in Home's first load. */
export const DIR = join(APP, 'src', 'data', 'feed');
export const GROUPS = [...Array.from({ length: 10 }, (_, i) => 'L' + (i + 1)), 'any'];
export const groupOf = (c) => (c.level == null ? 'any' : 'L' + c.level);
export const indexOf = (c) => Object.fromEntries(Object.entries({ id: c.id, kind: c.kind, level: c.level, bands: c.bands, topics: c.topics, key: c.key, play: c.play ? 1 : undefined }).filter(([, v]) => v !== undefined));
/* a group holds a card's words; the ranking fields the index already carries (bands, topics, key) are not repeated */
export const bodyOf = (c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'bands' && k !== 'topics' && k !== 'key'));
export function files(cards) {
  const out = { 'index.json': JSON.stringify(cards.map(indexOf)) + '\n' };
  for (const g of GROUPS) out[`g-${g}.json`] = JSON.stringify(Object.fromEntries(cards.filter((c) => groupOf(c) === g).map((c) => [c.id, bodyOf(c)]))) + '\n';
  return out;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cards = cut(), m = manifest(cards), F = files(cards);
  if (process.argv.includes('--check')) {
    const stale = Object.entries(F).filter(([f, body]) => { try { return readFileSync(join(DIR, f), 'utf8') !== body; } catch { return true; } }).map(([f]) => f);
    console.log(stale.length ? `feed is stale (${stale.join(', ')}) — run node tools/build-feed.mjs` : 'feed is today’s cut'); process.exit(stale.length ? 1 : 0);
  }
  mkdirSync(DIR, { recursive: true });
  for (const [f, body] of Object.entries(F)) writeFileSync(join(DIR, f), body);
  console.log(`feed: ${m.total} cards (${m.plays} with a question) · by level ${JSON.stringify(m.byLevel)} · ${m.agnostic} level-agnostic`);
}
