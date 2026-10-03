/* stories.js — the Library as a STORY ROOM, after Bizzing India's Stories (the owner's model): a bar that
   tells you one, rails of painted story cards, a story told scene by scene over its painting in the
   family narrator's voice with the words lit as she reads, and then the exercises LINKED to that
   story — its questions, its words, its commas, its sentences, a line to copy, saying it aloud on the
   Stage, and something to talk about. The whole book (Alice) is told the same way, a chapter a night,
   with a bookmark, the story so far, and the people you have met.

   Hearing it again is never going backwards: a story is not used up. */

import { S, kid, save, render, pay, checkMedals, mark, isDark, go } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { PASSAGES, WORKS } from '../data/library.js';
import { shippable, loadPassages, passageText, work, levelOf } from '../reading.js';
import { loadLexicon, lex, lookup } from '../lexicon.js';
import { storyExercises } from '../items.js';
import { narrate, stopNarration, pauseNarration, playing } from '../narrate.js';
import { addToBank, bumpDay } from '../model.js';
import { taught } from '../mastery.js';
import { sfx } from '../sound.js';
import { showWord } from './reader.js';
import { loadBook, book, chapterText } from '../book.js';
import ART from '../data/story-art.json';

const SHIPPED = () => PASSAGES.filter(shippable);
const BANDS = ['', '6–7', '8–10', '11–14'];
/* a painting if one exists (data/story-art.json, written by tools/art/process.py), else the world of its shelf */
const SHELF_WORLD = { fable: 'garden', children: 'garden', poetry: 'lakeside', novel: 'study', drama: 'playhouse', speech: 'forum', essay: 'scriptorium' };
const shelfPlate = (pid) => { const p = PASSAGES.find((x) => x.id === pid), w = p && work(p.work); const wid = p?.kind === 'verse' ? 'lakeside' : SHELF_WORLD[w?.shelf] || 'study'; return `art/w-${wid}${isDark() ? '-night' : ''}-card.webp`; };
export const storyCard = (id) => (ART.includes(`story/${id}`) ? `art/story/${id}-card.webp` : shelfPlate(id));
export const storyArt = (id, two) => (ART.includes(`story/${id}-2`) && two ? `art/story/${id}-2.webp` : ART.includes(`story/${id}`) ? `art/story/${id}.webp` : shelfPlate(id));
const bookArt = (n, small) => (ART.includes(`book/alice-${n}`) ? `art/book/alice-${n}${small ? '-card' : ''}.webp` : `art/w-study${isDark() ? '-night' : ''}-card.webp`);
const bg = (src) => `background-image:url('${src}')`;
export const EX = [['understand', 'Understand it', 'check'], ['words', 'Words from the story', 'key'], ['commas', 'The author’s commas', 'quill'],
  ['order', 'Rebuild a sentence', 'blocks'], ['copy', 'Copy a line', 'pen'], ['aloud', 'Say it aloud', 'mic'], ['talk', 'Talk about it', 'bubble']];
const exDone = (k, pid) => k.reading[pid]?.ex || {};
const exCount = (k, pid) => EX.filter(([e]) => exDone(k, pid)[e]).length;

/* ---------------- the story room ---------------- */
function card(p, k) {
  const w = work(p.work), n = exCount(k, p.id), heard = k.reading[p.id]?.heard;
  return `<a class="scard" href="#/story/${p.id}"><span class="pic" style="${bg(storyCard(p.id))}"></span>
    ${heard ? `<span class="sdone">${icon('check')}${n}/7</span>` : ''}<span class="nm">${esc(p.title)}</span><span class="hk">${esc(p.hook || w?.title || '')}</span>
    <span class="meta">${esc(w?.author || '')} · ages ${BANDS[p.band]}</span></a>`;
}
const RAILS = [
  ['fable', 'Fables and fairy tales', 'Short, sharp and very old — each ends on a lesson.', (p, w) => w?.shelf === 'fable'],
  ['children', 'Children’s classics', 'Rabbit-holes, secret gardens, river-banks and jungles — in the original words.', (p, w) => w?.shelf === 'children'],
  ['poetry', 'Poems to hear and say', 'Better aloud. Listen once, then say it with her.', (p, w) => p.kind === 'verse' || w?.shelf === 'poetry'],
  ['novel', 'Novels and stories', 'Chapters from the great novels and short stories.', (p, w) => w?.shelf === 'novel'],
  ['stage', 'Plays, speeches and essays', 'Words written to be spoken — and argued with.', (p, w) => /^(drama|speech|essay)$/.test(w?.shelf)],
];

export function storyRoom() {
  const k = kid(), all = SHIPPED(), mine = all.filter((p) => p.band <= k.band);
  const loved = all.filter((p) => k.reading[p.id]?.loved);
  const goingOn = all.filter((p) => k.reading[p.id]?.heard && exCount(k, p.id) < 7).slice(0, 8);
  const mosaic = all.slice(0, 12).map((p) => `<i style="${bg(storyCard(p.id))}"></i>`).join('');
  const bk = book();
  const rail = (title, note, list) => (list.length ? `<h3 class="railh">${esc(title)}</h3>${note ? `<p class="railn">${esc(note)}</p>` : ''}<div class="rail">${list.map((p) => card(p, k)).join('')}</div>` : '');
  return `<a class="pickbar" href="#/story/random"><span class="mosaic" aria-hidden="true">${mosaic}</span><span class="pbveil"></span>
      <span class="pbbody"><span><b>Tell me one</b><small>${all.length} stories in the original words, read aloud. Nothing to finish — you can have the same one again tomorrow.</small></span><span class="btn">${icon('play')}<span>Tell me one</span></span></span></a>
    <div class="topdoors">
      <a class="bigdoor" href="#/whole/alice"><span class="bdart" style="${bg(bookArt(1))}"></span><span class="pbveil"></span><span class="bdbody"><small>The whole book · 12 chapters</small><b>Alice’s Adventures in Wonderland</b><span>${bk ? `${(k.reading['book:alice']?.done || []).length} of 12 chapters` : 'One chapter a night. A bookmark keeps your place.'}</span></span></a>
      <a class="bigdoor" href="#/library/poems"><span class="bdart" style="${bg(storyArt((all.find((p) => p.kind === 'verse') || all[0]).id))}"></span><span class="pbveil"></span><span class="bdbody"><small>${all.filter((p) => p.kind === 'verse').length} poems</small><b>Poems to say aloud</b><span>Hear one, then say it on the Stage.</span></span></a>
    </div>
    ${rail('Going on', 'Stories you have heard, with exercises still to do.', goingOn)}
    ${rail('For you', `Chosen for ages ${BANDS[k.band]}.`, mine.filter((p) => !k.reading[p.id]?.heard).slice(0, 10))}
    ${rail('Again', 'The ones you loved. A story is not used up.', loved)}
    ${RAILS.map(([, t, n, f]) => rail(t, n, all.filter((p) => f(p, work(p.work))))).join('')}`;
}

/* ---------------- the player ---------------- */
export async function openStory(id) {
  await Promise.all([loadPassages(), loadLexicon()]);
  const k = kid(), all = SHIPPED();
  if (id === 'random') { const pool = all.filter((p) => p.band <= k.band && !k.reading[p.id]?.heard); const p = (pool.length ? pool : all)[Math.floor(Math.random() * (pool.length || all.length))]; location.replace(`#/story/${p.id}`); return false; }
  const p = PASSAGES.find((x) => x.id === id && shippable(x)), t = p && passageText(id);
  if (!p || !t) { S.run = { mode: 'story', error: true }; return true; }
  S.run = { mode: 'story', kind: 'passage', id, scenes: t.scenes?.length ? t.scenes : [t.text], i: 0, auto: !!k.prefs.readAloud, now: -1, title: p.title, sub: `${work(p.work).title} · ${work(p.work).author}`,
    art: (i, n) => storyArt(id, p.paint2 && i >= Math.ceil(n / 2)), clip: (i) => `st/${id}-${i}`, back: { label: 'Stories', href: '#/library' }, verse: p.kind === 'verse' };
  k.book = { work: p.work, passage: id }; save();
  return true;
}
export async function openChapter(n) {
  await Promise.all([loadBook(), loadLexicon()]);
  const b = book(), c = b?.chapters.find((x) => x.n === +n), t = c && chapterText(+n);
  if (!c || !t) { S.run = { mode: 'story', error: true }; return; }
  const k = kid(); (k.reading['book:alice'] ||= { at: 1, done: [] }).at = +n; save();
  S.run = { mode: 'story', kind: 'chapter', id: `alice-${n}`, n: +n, scenes: t.scenes, i: 0, auto: !!k.prefs.readAloud, now: -1, title: `${c.n}. ${c.title}`, sub: 'Alice’s Adventures in Wonderland · Lewis Carroll',
    art: () => bookArt(n), clip: (i) => `bk/alice-${n}-${i}`, back: { label: 'Alice', href: '#/whole/alice' } };
}

function words(text, k) {
  let n = 0;
  text = String(text).replace(/_([^_]+)_/g, '$1').replace(/_/g, '');   // the edition's italics marks are not read, so not shown
  return text.split(/\n\s*\n|(?<=\n)/).map((para) => `<p>${para.split(/([A-Za-z][A-Za-z'’-]*)/).map((m, i) => (i % 2 ? `<span class="w${k.bank[m.toLowerCase()] ? ' banked' : ''}" data-act="word" data-arg="${esc(m)}" data-n="${n++}">${esc(m)}</span>` : esc(m))).join('')}</p>`).join('');
}

export function storyView() {
  const r = S.run, k = kid();
  if (!r || r.error) return empty('oops', 'That story is not on the shelf.', link('Stories', '#/library'));
  if (r.i >= r.scenes.length) return storyEnd();
  const N = r.scenes.length, text = r.scenes[r.i];
  return `<div class="story-player">
    <div class="sp-head"><a class="bz-back" href="${r.back.href}">${icon('back')}<span>${esc(r.back.label)}</span></a><div class="dots" aria-label="scene ${r.i + 1} of ${N}">${r.scenes.map((_, i) => `<i class="${i <= r.i ? 'on' : ''}"></i>`).join('')}</div><span class="tag">${esc(r.kind === 'chapter' ? 'Chapter ' + r.n : 'Scene ' + (r.i + 1))}</span></div>
    <div class="sp-stage" style="${bg(r.art(r.i, N))}"><div class="sp-title"><h1>${esc(r.title)}</h1><small>${esc(r.sub)}</small></div></div>
    <article class="sp-text passage${r.verse ? ' verse' : ''}" aria-live="off">${words(text, k)}</article>
    <div class="sp-foot row">${btn(playing() ? 'Pause' : r.i === 0 && !r.started ? 'Read it to me' : 'Again', 'sp-play', { ic: playing() ? 'close' : 'speaker', cls: 'out' })}
      ${r.i > 0 ? btn('Back', 'sp-prev', { ic: 'back', cls: 'ghost' }) : ''}
      ${btn(r.i === N - 1 ? (r.kind === 'chapter' ? 'End of the chapter' : 'The end') : 'Then what happened?', 'sp-next', { ic: 'next', cls: 'grow' })}</div>
    <p class="note" style="text-align:center">Tap any word to see what it means. ${r.auto ? 'She reads each scene as it opens.' : ''}</p></div>`;
}

function storyEnd() {
  const r = S.run, k = kid();
  if (r.kind === 'chapter') {
    const c = book().chapters.find((x) => x.n === r.n);
    return `<div class="story-player"><div class="sp-stage end" style="${bg(r.art())}"></div><div class="card finish stack pop"><img src="${mascot('cheer')}" alt=""><h2>End of chapter ${r.n}</h2>
      ${c.line ? `<blockquote class="lines" style="margin:0"><blockquote>${esc(c.line)}</blockquote></blockquote>` : ''}
      <div class="row" style="justify-content:center">${link('Now the exercises', `#/whole/alice/${r.n}/do`, { ic: 'check' })}${btn('Hear it again', 'sp-again', { ic: 'undo', cls: 'out' })}${r.n < 12 ? link('Next chapter', `#/whole/alice/${r.n + 1}`, { cls: 'out', ic: 'next' }) : ''}</div></div></div>`;
  }
  const p = PASSAGES.find((x) => x.id === r.id), w = work(p.work), loved = k.reading[p.id]?.loved;
  return `<div class="story-player"><div class="sp-stage end" style="${bg(r.art(0, 1))}"></div><div class="card finish stack pop"><img src="${mascot('cheer')}" alt=""><h2>${esc(p.title)}</h2>
    <p style="margin:0">From <b>${esc(w.title)}</b> by ${esc(w.author)}, ${w.year}.</p>
    <div class="row" style="justify-content:center">${link('Now the exercises', `#/story/${p.id}/do`, { ic: 'check' })}${btn('Hear it again', 'sp-again', { ic: 'undo', cls: 'out' })}${btn(loved ? 'Loved' : 'I loved this', 'sp-love', { ic: 'star', cls: 'out' })}${link('Another one', '#/story/random', { cls: 'ghost', ic: 'play' })}</div>
    <p class="note" style="margin:0">Hearing it again is not going backwards. That is how you end up knowing it by heart.</p></div>
    <div class="card note"><b>Where this comes from.</b> ${esc(w.sources?.[0] || '')}. ${w.year} — in the public domain.${p.needsReview ? ' A note for grown-ups is on the book’s card.' : ''} <a href="#/book/${w.id}">About the book</a></div></div>`;
}

function readScene() {
  const r = S.run; r.started = true;
  const text = r.scenes[r.i];
  narrate(r.clip(r.i), text, {
    onWord: (n) => { if (n === r.now) return; r.now = n; document.querySelectorAll('.sp-text span.now').forEach((x) => x.classList.remove('now')); const el = document.querySelector(`.sp-text span[data-n="${n}"]`); el?.classList.add('now'); },
    onEnd: () => { document.querySelectorAll('.sp-text span.now').forEach((x) => x.classList.remove('now')); const b = document.querySelector('[data-act=sp-play] span'); if (b) b.textContent = 'Again'; },
  });
  requestAnimationFrame(() => { const b = document.querySelector('[data-act=sp-play] span'); if (b) b.textContent = 'Pause'; });
}
function heard() {
  const r = S.run, k = kid();
  if (r.kind === 'chapter') { const b = (k.reading['book:alice'] ||= { at: r.n, done: [] }); b.heard = [...new Set([...(b.heard || []), r.n])]; }
  else { k.reading[r.id] = { ...(k.reading[r.id] || {}), heard: true, at: Date.now() }; k.last = { what: 'read', title: r.title, at: Date.now() }; }
  bumpDay(k, 'pages'); save();
}

/* ---------------- the exercises ---------------- */
export async function openExercises(pid) {
  await Promise.all([loadPassages(), loadLexicon()]);
  const p = PASSAGES.find((x) => x.id === pid && shippable(x)), t = p && passageText(pid);
  S.run = p && t ? { mode: 'exlist', pid, sets: storyExercises(p, t.text, lex()), title: p.title } : { mode: 'exlist', error: true };
}
export function exercisesView() {
  const r = S.run, k = kid();
  if (!r || r.error) return empty('oops', 'Those exercises are not here.', link('Stories', '#/library'));
  const p = PASSAGES.find((x) => x.id === r.pid), d = exDone(k, r.pid);
  const tile = ([id, name, ic]) => {
    const n = id === 'aloud' || id === 'talk' ? 1 : r.sets[id]?.length || 0; if (!n) return '';
    const href = id === 'aloud' ? `#/stage/aloud/${r.pid}` : id === 'talk' ? `#/story/${r.pid}/talk` : `#/story/${r.pid}/do/${id}`;
    const say = d[id] ? (typeof d[id] === 'object' ? `${d[id].right} of ${d[id].n} right` : 'Done') : id === 'understand' ? 'The questions — this one passes the stop' : id === 'aloud' ? 'On the Stage' : id === 'talk' ? 'No right answer — talk it over' : `${n} to do`;
    return `<a class="extile${d[id] ? ' done' : ''}" href="${href}"><span class="exi">${icon(d[id] ? 'check' : ic)}</span><b>${esc(name)}</b><small>${esc(say)}</small></a>`;
  };
  return pageHead({ title: p.title, sub: 'the exercises for this story', back: { label: 'The story', href: `#/story/${r.pid}` }, strip: { chip: `${exCount(k, r.pid)} of 7`, pct: (exCount(k, r.pid) / 7) * 100, label: 'all from the story you just heard' } })
    + `<div class="exgrid">${EX.map(tile).join('')}</div>`;
}
export function openExercise(pid, ex) {
  const r = S.run; if (!r?.sets?.[ex]) return false;
  S.run = { mode: 'ex', pid, ex, items: r.sets[ex], i: 0, right: 0, state: null, hintN: 0, phase: 'check', sets: r.sets, title: r.title, name: EX.find((x) => x[0] === ex)[1] };
  return true;
}
export function finishExercise() {
  const r = S.run, k = kid(), rec = (k.reading[r.pid] ||= {}); rec.ex ||= {};
  rec.ex[r.ex] = { right: r.right, n: r.items.length, at: Date.now() };
  if (r.ex === 'understand') {
    const id = 'rd-' + r.pid, st = (k.stops[id] ||= { passed: false, best: 0, tries: 0 }); st.tries++; st.best = Math.max(st.best || 0, r.right); st.at = Date.now();
    if (r.right >= Math.ceil(r.items.length * 0.75) && !st.passed) { st.passed = true; taught(k, id); pay('stop'); mark('stop', `Understood “${r.title}”`); }
  }
  sfx('finish'); save(); checkMedals();
  S.run = { mode: 'exlist', pid: r.pid, sets: r.sets, title: r.title };
  location.hash = `#/story/${r.pid}/do`;
}
export function talkView(pid) {
  const ch = /^alice-(\d+)$/.exec(pid), c = ch && book()?.chapters.find((x) => x.n === +ch[1]);
  const p = c ? { title: `${c.n}. ${c.title}`, evaluate: c.evaluate } : PASSAGES.find((x) => x.id === pid), k = kid(), mine = k.reading[pid]?.thoughts || '';
  const back = c ? `#/whole/alice/${c.n}/do` : `#/story/${pid}/do`;
  return pageHead({ title: 'Talk about it', sub: p.title, back: { label: 'Exercises', href: back } }) + `<div class="reader"><div class="card stack pin"><p class="prompt big" style="margin:0">${esc(p.evaluate || '')}</p>
    <p class="note" style="margin:0">There is no right answer, so the app never marks this. Talk it over with a grown-up — or write your thoughts here. They stay on this device.</p>
    <label class="sr" for="th">Your thoughts</label><textarea id="th" class="field" rows="4" spellcheck="true">${esc(mine)}</textarea>
    <div class="row">${btn('Keep my thoughts', 'talk-save', { arg: pid, ic: 'check' })}${btn('We talked about it', 'talk-done', { arg: pid, cls: 'out', ic: 'bubble' })}</div></div></div>`;
}

/* ---------------- the whole book ---------------- */
export function wholeView() {
  const b = book(), k = kid();
  if (!b) return empty('think', 'Opening the book…', '');
  const st = k.reading['book:alice'] || { at: 1, done: [] }, done = st.done || [], at = st.at || 1;
  const met = b.chapters.filter((c) => (st.heard || []).includes(c.n) || done.includes(c.n)).flatMap((c) => c.meet || []);
  const cur = b.chapters.find((c) => c.n === at);
  return pageHead({ title: 'Alice’s Adventures in Wonderland', sub: 'Lewis Carroll · 1865 · the whole book', back: { label: 'Stories', href: '#/library' }, strip: { chip: `${done.length} of 12`, pct: (done.length / 12) * 100, label: 'a chapter counts when its questions are passed' } }) + `<div class="grid2">
    <div class="card pin stack"><span class="kick">Your bookmark · chapter ${at}</span><h2 style="margin:0">${esc(cur.title)}</h2><p style="margin:0"><b>The story so far.</b> ${esc(cur.sofar)}</p>${link(at > 1 || (st.heard || []).length ? 'Read on' : 'Begin', `#/whole/alice/${at}`, { ic: 'book' })}</div>
    <div class="card"><h3>People you have met</h3>${met.length ? `<ul class="metlist">${met.map((m) => `<li><b>${esc(m.name)}</b> — ${esc(m.about)}</li>`).join('')}</ul>` : '<p class="muted">Nobody yet. Alice is sitting on a bank by a river, with nothing to do…</p>'}</div></div>
    <div class="chapters">${b.chapters.map((c) => `<a class="chap${done.includes(c.n) ? ' done' : ''}${c.n === at ? ' at' : ''}" href="#/whole/alice/${c.n}"><span class="cpic" style="${bg(bookArt(c.n, true))}"></span><span class="cbody"><small>Chapter ${c.n}</small><b>${esc(c.title)}</b><span>${done.includes(c.n) ? 'Done' : (st.heard || []).includes(c.n) ? 'Heard — exercises to do' : c.n === at ? 'Your bookmark' : ''}</span></span></a>`).join('')}</div>`;
}
export async function openChapterExercises(n) {
  await Promise.all([loadBook(), loadLexicon()]);
  const c = book().chapters.find((x) => x.n === +n), t = chapterText(+n);
  const p = { id: `alice-${n}`, work: 'alice', questions: c.questions, words: c.wordBank };
  const sets = storyExercises(p, t.text, lex());
  sets.copy = c.line ? [{ id: `chapcopy:${n}`, kind: 'copy', type: 'copy', prompt: 'Copy this line exactly — every capital and comma.', text: c.line, who: 'Lewis Carroll', work: 'alice', hint: ['Copy a few words at a time.'], explain: c.line }] : sets.copy;
  S.run = { mode: 'chapex', n: +n, sets, title: `${c.n}. ${c.title}`, evaluate: c.evaluate };
}
export function chapterExercisesView() {
  const r = S.run, k = kid(), d = k.reading[`alice-${r.n}`]?.ex || {};
  const tiles = EX.filter(([e]) => e !== 'aloud').map(([id, name, ic]) => {
    const n = id === 'talk' ? 1 : r.sets[id]?.length || 0; if (!n) return '';
    const href = id === 'talk' ? `#/whole/alice/${r.n}/talk` : `#/whole/alice/${r.n}/do/${id}`;
    return `<a class="extile${d[id] ? ' done' : ''}" href="${href}"><span class="exi">${icon(d[id] ? 'check' : ic)}</span><b>${esc(name)}</b><small>${d[id] ? (typeof d[id] === 'object' ? `${d[id].right} of ${d[id].n} right` : 'Done') : id === 'understand' ? 'Passing this marks the chapter done' : `${n} to do`}</small></a>`;
  }).join('');
  return pageHead({ title: r.title, sub: 'the exercises for this chapter', back: { label: 'Alice', href: '#/whole/alice' } }) + `<div class="exgrid">${tiles}</div>`;
}
export function openChapterExercise(n, ex) {
  const r = S.run; if (!r?.sets?.[ex]) return false;
  S.run = { mode: 'ex', pid: `alice-${n}`, chapter: +n, ex, items: r.sets[ex], i: 0, right: 0, state: null, hintN: 0, phase: 'check', sets: r.sets, title: r.title, name: EX.find((x) => x[0] === ex)[1], evaluate: r.evaluate };
  return true;
}
export function finishChapterExercise() {
  const r = S.run, k = kid(), key = `alice-${r.chapter}`, rec = (k.reading[key] ||= {}); rec.ex ||= {};
  rec.ex[r.ex] = { right: r.right, n: r.items.length, at: Date.now() };
  if (r.ex === 'understand' && r.right >= Math.ceil(r.items.length * 0.75)) {
    const id = `bk-alice-${r.chapter}`, st = (k.stops[id] ||= { passed: false, best: 0, tries: 0 }); st.tries++; st.best = Math.max(st.best, r.right);
    const b = (k.reading['book:alice'] ||= { at: r.chapter, done: [] });
    if (!st.passed) { st.passed = true; taught(k, id); pay('stop'); mark('stop', `Alice, chapter ${r.chapter}`); b.done = [...new Set([...(b.done || []), r.chapter])]; if (r.chapter < 12) b.at = r.chapter + 1; }
  }
  sfx('finish'); save(); checkMedals();
  location.hash = `#/whole/alice/${r.chapter}/do`;
}

export const STORY_ACTIONS = {
  'sp-play': () => { const r = S.run; if (playing()) { pauseNarration(); render(); return; } readScene(); },
  'sp-next': () => {
    const r = S.run; stopNarration(); r.i++; r.now = -1; sfx('tap');
    if (r.i >= r.scenes.length) { heard(); render(); return; }
    render(); window.scrollTo({ top: 0, behavior: 'smooth' }); if (r.auto || r.started) readScene();
  },
  'sp-prev': () => { const r = S.run; stopNarration(); r.i = Math.max(0, r.i - 1); render(); },
  'sp-again': () => { const r = S.run; r.i = 0; r.started = false; render(); },
  'sp-love': () => { const k = kid(), r = S.run; k.reading[r.id] = { ...(k.reading[r.id] || {}), loved: !k.reading[r.id]?.loved }; save(); render(); },
  'talk-save': (pid) => { const k = kid(), key = pid; const v = document.querySelector('#th')?.value || ''; k.reading[key] = { ...(k.reading[key] || {}), thoughts: v.slice(0, 4000) }; (k.reading[key].ex ||= {}).talk = v.trim() ? 'thoughts' : k.reading[key].ex.talk; save(); history.back(); },
  'talk-done': (pid) => { const k = kid(); (k.reading[pid] ||= {}); (k.reading[pid].ex ||= {}).talk = 'talked'; save(); history.back(); },
};
export function storyKey(e) {
  const r = S.run; if (!r || r.mode !== 'story' || r.error || r.i >= (r.scenes?.length || 0)) return false;
  if (e.key === 'ArrowRight' || e.key === 'Enter') { STORY_ACTIONS['sp-next'](); return true; }
  if (e.key === 'ArrowLeft') { STORY_ACTIONS['sp-prev'](); return true; }
  if (e.key === ' ') { STORY_ACTIONS['sp-play'](); return true; }
  return false;
}
export { stopNarration };
