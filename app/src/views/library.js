/* library.js — the classics, word cards and literature cards (SPEC §3, §7, §8). Sub-nav: Books ·
   Words · Poems · Speeches · Authors — each a route, so back works; never a second sub-nav.
   A modern work is a card only (our summary, why it matters), never quoted. A work not cleared in
   all three markets says so, and its passages wait. */

import { bookMeta } from '../book.js';
import { S, kid } from '../app.js';
import { esc, icon, pageHead, link, empty, btn, plural } from '../ui.js';
import { WORKS, PASSAGES } from '../data/library.js';
import { cleared, shippable, shippedLines, levelOf } from '../reading.js';
import { lookup, lexReady } from '../lexicon.js';
import { storyRoom, storyCard as storyArt } from './stories.js';
import { stepOf } from '../mastery.js';
import { mythsPage, mythProgress, authorCards, authorView } from './deep.js';
import { author, authorOf } from '../data/deep.js';

/* six chips at most (the shell's rule): Speeches share the Poems room, and the Greek myths have their own */
const NAV = (cur) => [['stories', 'Stories', 'play'], ['myths', 'Greek myths', 'lamp'], ['books', 'Books', 'book'], ['poems', 'Poems & speeches', 'quill'], ['authors', 'Authors', 'user'], ['words', 'Words', 'key']]
  .map(([id, label, ic]) => ({ label, icon: ic, href: `#/library/${id}`, active: id === cur || (cur === 'speeches' && id === 'poems') || (cur === 'author' && id === 'authors') }));
const SHELF = { fable: 'Fables and fairy tales', children: 'Children’s classics', novel: 'Novels and stories', poetry: 'Poetry', drama: 'Drama', speech: 'Speeches', essay: 'Essays' };
const COLOURS = ['#7a3b2e', '#2f5d50', '#3b4a7a', '#7a5a1e', '#5b3a6e', '#2e5b7a', '#7a2e4a', '#4a6a2e'];
const col = (id) => COLOURS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLOURS.length];
const LINES = shippedLines();

function spine(w) {
  const t = w.title.replace(/^(The|A) /, ''), lines = t.length > 22 ? 2 : 1, h = Math.min(230, Math.max(140, Math.ceil(t.length / lines) * 8 + 34)), wd = (lines === 2 ? 50 : 38) + (w.year % 3) * 4;
  return `<a class="spine${w.held ? '' : ' modern'}" href="#/book/${w.id}" style="--c:${col(w.id)};--h:${h}px;--w:${wd}px" aria-label="${esc(w.title)} by ${esc(w.author)}">${esc(t.length > 52 ? t.slice(0, 50) + '…' : t)}</a>`;
}

export function libraryView(tab = 'stories') {
  const head = (sub, strip) => pageHead({ title: 'The Library', sub, back: { label: 'Home', href: '#/home' }, nav: NAV(tab), strip });
  const k = kid();
  if (tab === 'stories') return pageHead({ title: 'The Library', sub: 'stories from the classics, read aloud', nav: NAV(tab) }) + storyRoom();
  if (tab === 'words') return head('every word you have met') + wordsTab(k);
  if (tab === 'myths') { const pr = mythProgress(k); return head('the old stories, and the words they gave English', { chip: `${pr.heard} of ${pr.n} heard`, pct: pr.n ? (pr.heard / pr.n) * 100 : 0, label: 'a myth is heard when she has told it to the end' }) + mythsPage(); }
  if (tab === 'author') { const a = author(S.route.parts[2]); return pageHead({ title: a ? a.name : 'Authors', sub: a ? (a.deepest ? 'a deep dive: the plays, the poems, the words' : 'a deep dive') : '', back: { label: 'Authors', href: '#/library/authors' } }) + authorView(S.route.parts[2]); }
  if (tab === 'poems') return head('poems to hear, and speeches to say') + `<div class="rail wrap">${PASSAGES.filter((p) => shippable(p) && (p.kind === 'verse' || WORKS.find((w) => w.id === p.work)?.shelf === 'poetry')).map((p) => `<a class="scard" href="#/story/${p.id}"><span class="pic" style="background-image:url('${storyArt(p.id)}')"></span><span class="nm">${esc(p.title)}</span><span class="hk">${esc(p.hook || '')}</span><span class="meta">${esc(WORKS.find((w) => w.id === p.work)?.author || '')}</span></a>`).join('')}</div>` + listWorks(WORKS.filter((w) => w.shelf === 'poetry'), k, true) + `<h3 class="railh" id="speeches" style="margin-left:0">Speeches</h3>` + listWorks(WORKS.filter((w) => w.shelf === 'speech'), k, true);
  if (tab === 'speeches') return head('great speeches, and the art of them') + listWorks(WORKS.filter((w) => w.shelf === 'speech'), k, true);
  if (tab === 'authors') return head('who wrote them') + `<h3 class="railh" style="margin-left:0">Deep dives</h3><p class="railn" style="margin-left:0">Each author’s stories, lines, a quiz — pictured by a painting of their own work.</p>` + authorCards() + `<h3 class="railh" style="margin-left:0">Every author on the shelves</h3>` + authorsTab();
  const met = WORKS.filter((w) => PASSAGES.some((p) => p.work === w.id && k.stops['rd-' + p.id]?.passed)).length;
  const shelves = Object.entries(SHELF).map(([id, name]) => {
    const ws = WORKS.filter((w) => w.shelf === id); if (!ws.length) return '';
    return `<section class="card" style="padding:14px 0 0;overflow:hidden"><h3 style="padding:0 20px">${esc(name)} <small class="muted" style="font:600 13px var(--bz-body)">${ws.length}</small></h3><div class="shelf">${ws.map(spine).join('')}</div></section>`;
  }).join('');
  return head('everything the Atlas reads', { chip: `${met} of ${WORKS.length} met`, pct: (met / WORKS.length) * 100, label: 'a work is “met” when you understand a passage from it' })
    + `<div class="stack">${shelves}<p class="note" style="margin:0 20px">Striped spines are modern books: we tell you about them in our own words, but they are not ours to print.</p></div>`;
}

function listWorks(ws, k, withPassages) {
  if (!ws.length) return empty('sleep', 'Nothing on this shelf yet.', link('All books', '#/library/books'));
  return `<div class="grid2">${ws.map((w) => {
    const ps = PASSAGES.filter((p) => p.work === w.id && shippable(p));
    return `<a class="card" href="#/book/${w.id}" style="text-decoration:none;color:inherit"><span class="kick">${esc(w.era)} · ${w.year}</span><h3>${esc(w.title)}</h3><p class="muted" style="margin:0">${esc(w.author)}</p><p style="margin:8px 0 0">${esc(w.why)}</p>
      ${withPassages && ps.length ? `<p class="tag ok" style="margin-top:8px">${icon('book')}${plural(ps.length, 'passage')} to read</p>` : ''}</a>`;
  }).join('')}</div>`;
}

function authorsTab() {
  const by = {};
  for (const w of WORKS) (by[w.author] ||= []).push(w);
  return `<div class="grid3">${Object.entries(by).sort((a, b) => a[0].localeCompare(b[0])).map(([a, ws]) => `<div class="card"><h3>${authorOf(ws[0].id) ? `<a href="#/library/author/${authorOf(ws[0].id).id}">${esc(a)}</a>` : esc(a)}</h3>${ws.map((w) => `<a href="#/book/${w.id}" style="display:block;padding:6px 0;min-height:32px">${esc(w.title)} <small class="muted">(${w.year})</small></a>`).join('')}</div>`).join('')}</div>`;
}

function wordsTab(k) {
  const words = Object.entries(k.bank).sort((a, b) => b[1].at - a[1].at);
  const form = `<form class="row card" data-act="word-search" style="padding:12px"><label class="sr" for="ws">Find a word</label><input id="ws" class="field" name="q" placeholder="Find any word in Bizzing Bee’s list" style="flex:1;min-width:180px">${btn('Find', 'word-search-go', { ic: 'search' })}</form>`;
  if (!words.length) return form + empty('sleep', 'Your word bank is empty. Tap a word while you read, and it lands here.', link('Read something', '#/continue', { ic: 'book' }));
  return form + `<div class="grid3">${words.map(([w, v]) => {
    const e = lexReady() ? lookup(w) : null;
    return `<a class="card" href="#/word/${encodeURIComponent(w)}" style="text-decoration:none;color:inherit"><h3 style="font:700 21px var(--read)">${esc(w)}</h3>${e ? `<p class="muted" style="margin:0">${esc(e.def)}</p>` : ''}</a>`;
  }).join('')}</div>`;
}

export function bookView(id) {
  const w = WORKS.find((x) => x.id === id), k = kid();
  if (!w) return empty('oops', 'That book is not in the Library.', link('The Library', '#/library'));
  const ps = PASSAGES.filter((p) => p.work === id);
  const ok = cleared(w), lines = LINES.filter((l) => l.work === id);
  const liked = (w.liked || []).map((x) => WORKS.find((y) => y.id === x)).filter(Boolean);
  const rights = `<p class="note"><b>Rights.</b> US: ${esc(w.rights.us)} · UK: ${esc(w.rights.uk)} · India: ${esc(w.rights.in)} — ${esc(w.rights.basis)} (checked ${esc(w.rights.checked)}).</p>`;
  const passages = !w.held ? `<p class="note">This is a modern book: we tell you about it in our own words. Look for it in a library or bookshop.</p>`
    : !ok ? `<p class="note">The rights in one of our three countries are still being checked, so its passages wait until they are confirmed.</p>`
      : ps.length ? `<div class="stoplist">${ps.map((p) => `<a class="stoprow${k.stops['rd-' + p.id]?.passed ? ' passed' : ''}" href="#/story/${p.id}"><span class="st">${icon(k.stops['rd-' + p.id]?.passed ? 'check' : 'book')}</span><span><b>${esc(p.title)}</b><small>ages ${['', '6–7', '8–10', '11–14'][p.band]} · Reading level ${levelOf(p)}${stepOf(k, 'rd-' + p.id) >= 2 ? ' · understood' : ''}</small></span><span>${icon('next')}</span></a>`).join('')}</div>`
        : `<p class="note">No passages from this book yet.</p>`;
  return pageHead({ title: w.title, sub: `${w.author} · ${w.year}`, back: { label: 'Library', href: '#/library' } }) + `<div class="stack">
    <div class="card bookcard"><div class="bookcover" style="--c:${col(w.id)}">${esc(w.title)}</div><div><span class="kick">${esc(w.era)}</span><p style="font-size:17px;margin:4px 0 8px"><b>${esc(w.why)}</b></p><p style="margin:0">${esc(w.summary)}</p>
      ${w.needsReview ? `<p class="tag warn" style="margin-top:10px">${icon('help')}A note for grown-ups</p><p class="note">${esc(w.reviewNote || 'This book carries attitudes of its time. A named reviewer has not yet cleared it.')}</p>` : ''}</div></div>
    ${authorOf(id) ? `<p style="margin:0">${link(`More about ${authorOf(id).name}`, `#/library/author/${authorOf(id).id}`, { ic: 'user', cls: 'out small' })}</p>` : ''}
    <div class="card"><h3>Read</h3>${bookMeta(id) ? `<p>${link('Read the whole book, chapter by chapter', `#/whole/${id}`, { ic: 'book' })}</p>` : ''}${passages}</div>
    ${lines.length ? `<div class="card lines"><h3>Famous lines</h3>${lines.map((l) => `<blockquote>${esc(l.text)}<br><small class="muted" style="font:13px var(--bz-body)">— ${esc(l.who)}</small></blockquote>`).join('')}</div>` : ''}
    ${liked.length ? `<div class="card"><h3>If you liked this…</h3><div class="row">${liked.map((x) => `<a class="bz-chip" href="#/book/${x.id}">${esc(x.title)}</a>`).join('')}</div></div>` : ''}
    <div class="card">${rights}<p class="source">${(w.sources || []).map(esc).join(' · ')}</p></div></div>`;
}

export function wordView(w) {
  const e = lexReady() ? lookup(w) : null;
  return pageHead({ title: w, sub: 'from Bizzing Bee’s word list', back: { label: 'Words', href: '#/library/words' } }) + (e
    ? `<div class="card stack" style="max-width:720px"><div class="row"><h2 style="font:700 34px var(--read);margin:0">${esc(e.w)}</h2><span class="say">${esc(e.say)}</span><span class="tag">${esc(e.ps)}</span>${btn('Hear it', 'sayword', { arg: e.w, ic: 'speaker', cls: 'out small' })}</div>
      <p style="font-size:18px;margin:0">${esc(e.def)}</p>${e.etym ? `<p><b>Where it comes from:</b> ${esc(e.etym)}</p>` : e.origin ? `<p><b>From</b> ${esc(e.origin)}</p>` : ''}${e.hint ? `<p><b>Remember it:</b> ${esc(e.hint)}</p>` : ''}
      <p class="note">For spelling it in a contest, Bizzing Bee is the place: <a href="https://www.bizzingbee.com/">open Bizzing Bee</a>.</p></div>`
    : empty('think', lexReady() ? 'That word is not in our list yet.' : 'Looking it up…', link('All my words', '#/library/words')));
}
