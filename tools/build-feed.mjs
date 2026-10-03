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

     node tools/build-feed.mjs           → app/src/data/feed/ (index.json + one group per level; loaded only when #/feed opens)
     node tools/build-feed.mjs --check   → exits 1 if those files are not today's cut */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STRANDS, allStops, level as levelOfStrand } from '../app/src/curriculum.js';
import { AUTHORED } from '../app/src/authored.js';
import { keys, make } from '../app/src/items.js';
import { PASSAGES, WORKS, LINES } from '../app/src/data/library.js';
import { cleared } from '../app/src/data/rights.js';
import { levelOf } from '../app/src/reading.js';
import { BOOKS } from '../app/src/book.js';
import { FIGURES } from '../app/src/data/literature.js';
import { RHETORIC } from '../app/src/data/language.js';
import { MYTH_WORDS, MYTH_WORD_STOPS } from '../app/src/data/myth-words.js';

const HERE = dirname(fileURLToPath(import.meta.url)), APP = join(HERE, '..', 'app');
const json = (p) => JSON.parse(readFileSync(join(APP, p), 'utf8'));
export const LEX = json('public/data/bee-words.json');
const TEXTS = Object.fromEntries(json('src/data/passages.json').map((p) => [p.id, p]));
const HOUR = json('src/data/hour-words.json');
const ART = json('src/data/story-art.json');
const BOOKDATA = Object.fromEntries(BOOKS.map((b) => [b.id, json(`src/data/book-${b.id}.json`)]));

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
const sentences = (t) => String(t).replace(/\s+/g, ' ').split(/(?<=[.!?][’”"']?)\s+(?=[A-Z“"‘'])/).filter(Boolean);
/* the opening of a held text, cut at a sentence end: 120–320 characters, exact */
export function opening(text) {
  let out = '';
  for (const s of sentences(text)) { if (out && (out + ' ' + s).length > 320) break; out = out ? out + ' ' + s : s; if (out.length >= 120) break; }
  return out.length <= 360 ? out : '';
}
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
        let n = 0;
        for (const key of ks) {
          if (n >= 6) break;
          let it; try { it = make(st.kind, key, { band: b, lex: LEX, stop: st.id }); } catch { continue; }
          if (!it || it.type !== 'mc' || it.say || it.fixed) continue;
          const right = it.options[it.answer], c = { ...base, bands: [b], id: `${st.id}~g${b}~${String(key).replace(/[^\w-]+/g, '_').slice(0, 40)}`, kind: 'question',
            src: `gen:${st.kind}#${b}#${key}`, title: st.title, body: it.sub || '', play: play(it.prompt, right, it.options.filter((_, j) => j !== it.answer), it.explain || ''), more: taught };
          if (leaks(c) || cards.some((x) => x.id === c.id)) continue;
          add(c); n++;
        }
      }
    }
  }

  /* 2. myth words (Word 7): the word, where it comes from, and the myth that tells it */
  for (const m of MYTH_WORDS) {
    const p = PASSAGES.find((x) => x.id === m.passage), w = work(m.work);
    if (m.needsReview || !p || p.needsReview || !TEXTS[p.id] || !quotable(w)) continue;
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
      const line = sents.find((x) => x.length <= 300 && new RegExp(`\\b${esc(wd)}\\b`, 'i').test(x)); if (!line) continue;
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
  /* 10. the games (their own names and what they practise, read from views/play.js) */
  for (const g of games()) add({ id: `game~${g.id}`, kind: 'game', src: `game:${g.id}`, bands: [1, 2, 3], topics: [`game:${g.id}`], where: 'Play', title: g.name, body: g.how, more: stop(`Practises ${g.practises}`), route: `#/play/${g.id}`, cta: `Play ${g.name}` });

  /* no favourite slot: a card whose right option lands where too many already sit is still kept — the
     engine's order() spreads them; the test holds the whole set to ≤ 35% in any slot */
  return cards.map((c) => Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined && v !== '')));
}

/* the games, as views/play.js names them (that file belongs to the games; only its words are read) */
export function games() {
  const src = readFileSync(join(APP, 'src', 'views', 'play.js'), 'utf8');
  const out = [];
  for (const m of src.matchAll(/^\s+([a-z]+): \{ name: '([^']+)', world: '[^']*', practises: '([^']+)', how: '((?:[^'\\]|\\.)+)'/gm)) out.push({ id: m[1], name: m[2], practises: m[3], how: m[4].replace(/\\'/g, "'") });
  return out;
}

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
export function files(cards) {
  const out = { 'index.json': JSON.stringify(cards.map(indexOf)) + '\n' };
  for (const g of GROUPS) out[`g-${g}.json`] = JSON.stringify(Object.fromEntries(cards.filter((c) => groupOf(c) === g).map((c) => [c.id, c]))) + '\n';
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
