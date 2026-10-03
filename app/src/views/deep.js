/* deep.js (view) — the Library's deep dives: #/library/myths (the Greek myths as one journey: each myth's
   painting, its hook, hear it, its exercises, the words it gave English, and a Who's who quoted from the
   passages) and #/library/author/<id> (a great author's page: read, their words, say it, the words first
   recorded in them, how to read them, test yourself, why read them). #/myths and #/author/<id> lead here.

   Everything on these pages is data that already exists or an exact quotation (src/data/deep.js says how;
   test/deep.mjs holds it). The quiz is answered ON the page by touch (tap an option) or by keyboard (1–4;
   Enter, Space or → to go on after a wrong answer, which holds and explains until dismissed). A right
   answer advances, and pays once per question through pay('answer'). */

import '../../styles/deep.css';
import { S, kid, save, render, pay } from '../app.js';
import { esc, icon, link, btn, empty, plural } from '../ui.js';
import { WORKS, PASSAGES } from '../data/library.js';
import { MYTH_WORDS } from '../data/myth-words.js';
import { bookMeta } from '../book.js';
import { levelOf } from '../reading.js';
import { stepOf } from '../mastery.js';
import { bumpDay } from '../model.js';
import { sfx } from '../sound.js';
import { MYTH_JOURNEY, mythStops, mythPassage, mythWords, WHO, WHO_GROUPS, NAMES_NOTE, WORD7, AUTHORS, author, authorWorks, authorPassages, authorLines,
  isGated, lifeNote, whyRead, quizFor, langStop } from '../data/deep.js';
import { storyCard, EX } from './stories.js';

const BANDS = ['', '6–7', '8–10', '11–14'];
const bg = (src) => `background-image:url('${src}')`;
const work = (id) => WORKS.find((w) => w.id === id);
const PASS = (id) => PASSAGES.find((p) => p.id === id);
const exN = (k, pid) => Object.keys(k.reading[pid]?.ex || {}).filter((e) => EX.some(([x]) => x === e)).length;
const wordHref = (w) => (/\s/.test(w) ? '' : `#/word/${encodeURIComponent(w.toLowerCase())}`);

/* ───────────── The Greek myths ───────────── */
export function mythProgress(k) {
  const ids = mythStops().filter(mythPassage), words = MYTH_WORDS.filter((m) => ids.includes(m.passage) && m.quote);
  return { heard: ids.filter((id) => k.reading[id]?.heard).length, n: ids.length, banked: words.filter((m) => k.bank[m.word.toLowerCase()]).length, words: words.length,
    passed: WORD7.filter((s) => k.stops[s.id]?.passed).length, learned: WORD7.filter((s) => stepOf(k, s.id) >= 2).length };
}

export function mythsPage() {
  const k = kid(), pr = mythProgress(k);
  const intro = `<div class="card dp-intro"><p style="margin:0">Fifteen myths, told in the words of three old books — Nathaniel Hawthorne’s, Charles Kingsley’s and Thomas Bulfinch’s — and the English words that came out of them. Hear one, do its exercises, then meet its words.</p>
    <p class="note" style="margin:8px 0 0">${esc(NAMES_NOTE.say)} <q>${esc(NAMES_NOTE.quote)}</q> — Bulfinch, ${esc(work(NAMES_NOTE.work).title)}. Kingsley uses the Greek names.</p>
    <p class="dp-prog" data-deep-progress>${icon('check')}<span><b>${pr.heard} of ${pr.n}</b> myths heard · <b>${pr.banked} of ${pr.words}</b> of their words in your word bank · Word level 7: <b>${pr.passed} of ${WORD7.length}</b> stops passed${pr.learned ? `, ${pr.learned} learned` : ''}</span></p>
    <div class="row">${WORD7.map((s) => link(s.title, `#/stop/${s.id}`, { ic: 'key', cls: 'out small' })).join('')}</div></div>`;
  let n = 0;
  const road = MYTH_JOURNEY.map((r) => {
    const stops = r.stops.map(mythPassage).filter(Boolean);
    if (!stops.length) return '';
    return `<li class="mj-region"><div class="mj-rhead"><h3>${esc(r.title)}</h3><p class="note">${esc(r.note)}</p></div><div class="mj-stops">${stops.map((p) => mythStop(p, k, ++n)).join('')}</div></li>`;
  }).join('');
  const who = WHO_GROUPS.map(([g, title]) => {
    const cs = WHO.filter((c) => c.group === g && mythPassage(c.passage));
    return cs.length ? `<h3 class="railh dp-sub">${esc(title)}</h3><div class="grid3 dp-pad">${cs.map(whoCard).join('')}</div>` : '';
  }).join('');
  return `<div class="stack dp">${intro}
    <h2 class="railh">The journey</h2><p class="railn">Start anywhere. A filled stone is a myth you have heard.</p>
    <ol class="mj-road">${road}</ol>
    <h2 class="railh" id="whos-who">Who’s who</h2><p class="railn">Every line here is taken from the myth it names — tap the title to hear it.</p>${who}</div>`;
}

function mythStop(p, k, n) {
  const w = work(p.work), heard = k.reading[p.id]?.heard, done = exN(k, p.id), words = mythWords(p.id);
  return `<article class="mj-stop${heard ? ' heard' : ''}" data-myth="${esc(p.id)}">
    <span class="mj-stone" aria-hidden="true">${heard ? icon('check') : n}</span>
    <a class="mj-pic" href="#/story/${p.id}" style="${bg(storyCard(p.id))}" aria-label="Hear ${esc(p.title)}"></a>
    <div class="mj-body"><h4>${esc(p.title)}</h4><p class="mj-hook">${esc(p.hook || '')}</p><p class="meta">${esc(w.author)}, ${esc(w.title)} · ages ${BANDS[p.band]}${heard ? ' · heard' : ''}</p>
      <div class="row">${link('Hear it', `#/story/${p.id}`, { ic: 'speaker', cls: 'small' })}${link(`Exercises${done ? ` ${done}/7` : ''}`, `#/story/${p.id}/do`, { ic: 'check', cls: 'out small' })}</div>
      ${words.length ? `<div class="mj-words"><span class="kick">The words it gave English</span><ul>${words.map((m) => {
        const h = wordHref(m.word), banked = k.bank[m.word.toLowerCase()];
        return `<li>${h ? `<a href="${h}" class="mj-w${banked ? ' banked' : ''}">${esc(m.word)}</a>` : `<b class="mj-w">${esc(m.word)}</b>`} <span>— ${esc(m.meaning)}</span><small>from ${esc(m.from)}: <q>${esc(m.quote)}</q>${m.needsReview ? ' <span class="tag warn">origin waiting for a reviewer</span>' : ''}</small></li>`;
      }).join('')}</ul></div>` : ''}</div></article>`;
}

function whoCard(c) {
  const p = mythPassage(c.passage), q = (x) => `<blockquote>${esc(x.quote)}<small>— ${x.passage ? `<a href="#/story/${x.passage}">${esc(mythPassage(x.passage)?.title || '')}</a>` : `Bulfinch, ${esc(work(x.work)?.title || '')}`}</small></blockquote>`;
  return `<div class="card dp-who"><h4>${esc(c.name)}${c.greek ? ` <small class="muted">· the Greeks’ ${esc(c.greek.name)}</small>` : ''}</h4><p>${esc(c.fact)}</p>
    <blockquote>${esc(c.quote)}<small>— <a href="#/story/${p.id}">${esc(p.title)}</a></small></blockquote>${c.also ? q(c.also) : ''}${c.greek ? q(c.greek) : ''}</div>`;
}

/* ───────────── The authors ───────────── */
const firstArt = (a) => { const ps = authorPassages(a); return ps.length ? storyCard(ps[0].id) : storyCard(`${a.works[0]}-none`); };

export function authorCards() {
  return `<div class="dp-authors">${AUTHORS.map((a) => {
    const ps = authorPassages(a), life = lifeNote(a), ws = authorWorks(a);
    return `<a class="scard dp-acard" href="#/library/author/${a.id}" data-author="${a.id}"><span class="pic" style="${bg(firstArt(a))}"></span><span class="nm">${esc(a.name)}</span>
      <span class="hk">${isGated(a) ? 'Waiting on the rights — a card for now' : `${plural(ps.length, 'story', 'stories')} · ${plural(ws.length, 'work')}`}</span><span class="meta">${life ? `died ${life.year}` : esc(ws.map((w) => w.year).sort()[0] || '')}${a.deepest ? ' · the deepest dive' : ''}</span></a>`;
  }).join('')}</div>`;
}

const storyTile = (p, k) => { const heard = k.reading[p.id]?.heard; return `<a class="scard" href="#/story/${p.id}"><span class="pic" style="${bg(storyCard(p.id))}"></span>${heard ? `<span class="sdone">${icon('check')}${exN(k, p.id)}/7</span>` : ''}<span class="nm">${esc(p.title)}</span><span class="hk">${esc(p.hook || '')}</span><span class="meta">Reading level ${levelOf(p)} · ages ${BANDS[p.band]}</span></a>`; };

export function authorView(id) {
  const a = author(id), k = kid();
  if (!a) return empty('oops', 'That author has no page yet.', link('Authors', '#/library/authors'));
  const ws = authorWorks(a), ps = authorPassages(a), life = lifeNote(a), gated = isGated(a);
  const sec = (title, body, extra = '') => (body ? `<section class="card dp-sec"${extra}><h3>${title}</h3>${body}</section>` : '');
  const head = `<div class="card dp-head"><span class="dp-hart" style="${bg(firstArt(a))}" aria-hidden="true"></span><div>
      ${life ? `<p style="margin:0"><b>${a.teller ? esc(a.teller) + ' ' : ''}died ${life.year}</b> <span class="note">— from the rights note on ${esc(life.work.title)}: <q>${esc(life.basis.length > 160 ? life.basis.slice(0, life.basis.indexOf(`died ${life.year}`) + 9) + '…' : life.basis)}</q></span></p>` : ''}
      <div class="row" style="margin-top:8px">${ws.map((w) => `<a class="bz-chip" href="#/book/${w.id}">${esc(w.title)} · ${esc(w.year)}${w.held ? '' : ' · a card'}</a>`).join('')}</div>
      <p class="source" style="margin:8px 0 0">The years are each work’s own, from the Library’s data; every work names its source on its page.</p></div></div>`;
  if (gated) {
    const w = ws[0], miss = /Still missing:[^(]*/.exec(w.rights.basis)?.[0];
    return `<div class="stack dp">${head}${sec('Why read them', `<p>${esc(w.why)}</p><p>${esc(w.summary)}</p>`)}
      ${sec('Waiting on the rights', `<p>Our edition must be free to share in all three of our countries before its stories are read here. One of them is still being checked, so the stories wait.${miss ? ` <q>${esc(miss.trim())}</q>` : ''}</p>${link('The book’s card', `#/book/${w.id}`, { ic: 'book', cls: 'out' })}`)}</div>`;
  }
  // Read: every passage, grouped by work, then whole books
  const read = ws.map((w) => { const mine = ps.filter((p) => p.work === w.id); const whole = bookMeta(w.id);
    if (!mine.length && !whole) return '';
    return `<h4 class="dp-wt">${esc(w.title)}${w.shelf === 'drama' ? ' <small class="muted">· a play</small>' : ''}</h4>${whole ? `<p>${link(`Read the whole book, ${whole.chapters.length} chapters`, `#/whole/${w.id}`, { ic: 'book', cls: 'small' })}</p>` : ''}${mine.length ? `<div class="rail wrap">${mine.map((p) => storyTile(p, k)).join('')}</div>` : ''}`;
  }).join('');
  const retold = (a.retold || []).map((r) => { const w = work(r.work), p = PASS(r.passage); return p ? `<div class="dp-retold"><p class="tag warn">${icon('help')}Retold for younger readers — not ${esc(a.name.split(' ').pop())}’s own words</p><p class="note">${esc(w.title)}, by ${esc(w.author)} (${esc(w.year)}): ${esc(w.why)}</p><div class="rail wrap">${storyTile(p, k)}</div></div>` : ''; }).join('');
  const lines = authorLines(a);
  const say = (a.speak || []).concat(a.speak ? [] : ps.slice(0, 2).map((p) => ({ label: `${p.title} — read it aloud`, href: `#/stage/aloud/${p.id}` })));
  const wsStop = a.wordsStop && langStop(a.wordsStop), how = a.howTo && langStop(a.howTo);
  const learnBlock = (st) => `<blockquote class="dp-learn">${esc(st.learn.why)}</blockquote><ul class="dp-ex">${st.learn.example.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${st.needsReview ? `<p class="tag warn">${icon('help')}Waiting for a named reviewer to check its dates and sources</p>` : ''}<p>${link(st.title, `#/stop/${st.id}`, { ic: 'scroll', cls: 'out small' })}</p>`;
  const notes = ws.filter((w) => w.needsReview).map((w) => `<p class="note"><b>${esc(w.title)}.</b> ${esc(w.reviewNote || 'This book carries attitudes of its time. A named reviewer has not yet cleared it.')}</p>`)
    .concat(ps.filter((p) => p.needsReview && p.reviewNote).map((p) => `<p class="note"><b>${esc(p.title)}.</b> ${esc(p.reviewNote)}</p>`)).join('');
  return `<div class="stack dp">${head}
    ${sec('Read', read + retold)}
    ${sec('Their words', lines.map((l) => `<blockquote>${esc(l.text)}<small>— ${esc(l.who)}</small></blockquote>`).join(''), ' data-deep-lines')}
    ${sec('Say it', say.length ? `<div class="row">${say.map((s) => link(s.label, s.href, { ic: /contest/.test(s.href) ? 'lectern' : 'mic', cls: 'out small' })).join('')}</div><p class="note" style="margin:8px 0 0">The microphone opens only when you tap Start, and nothing you say is recorded.</p>` : '')}
    ${wsStop ? sec('Words first recorded in him', `<p class="note" style="margin-top:0">From the Language stop “${esc(wsStop.title)}”: first recorded means the earliest written example found — never proof that he invented it.</p>${learnBlock(wsStop)}`) : ''}
    ${how ? sec('How to read Shakespeare', `<p class="note" style="margin-top:0">From the Language stop “${esc(how.title)}”.</p>${learnBlock(how)}`) : ''}
    ${quizSection(a)}
    ${sec('Why read them', `<p>${whyRead(a).map((x) => `<b>${esc(x.work.title)}.</b> ${esc(x.why)}`).join(' ')}</p>`)}
    ${notes ? sec('A note for grown-ups', notes) : ''}</div>`;
}

/* ───────────── Test yourself ───────────── */
function quizState(a) {
  if (S.deep?.aid !== a.id) S.deep = { aid: a.id, i: 0, pick: null, right: 0 };
  return S.deep;
}
function quizSection(a) {
  const items = quizFor(a); if (!items.length) return '';
  const st = quizState(a), n = items.length;
  if (st.i >= n) return `<section class="card dp-sec dq" id="dq" data-deep-quiz="${a.id}"><h3>Test yourself</h3><p class="prompt">You got ${st.right} of ${n}.</p><p class="note">Every question came from one of ${esc(a.name)}’s stories. A right answer pays a coin the first time only.</p>
    <div class="row"><button class="btn" data-deep="again">${icon('undo')}<span>Again</span></button></div></section>`;
  const it = items[st.i], answered = st.pick != null, ok = answered && st.pick === it.answer;
  return `<section class="card dp-sec dq" id="dq" data-deep-quiz="${a.id}"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Test yourself</h3><span class="tag">Question ${st.i + 1} of ${n} · ${st.right} right</span></div>
    <p class="prompt">${esc(it.q)}</p><p class="note" style="margin:0">From <a href="#/story/${it.pid}">${esc(it.title)}</a></p>
    <div class="opts">${it.options.map((o, j) => `<button class="opt${answered ? (j === it.answer ? (ok ? ' right' : ' missed') : j === st.pick ? ' wrong' : '') : ''}" data-deep="ans" data-arg="${j}"${answered ? ' disabled' : ''}><kbd>${j + 1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>
    ${answered ? (ok ? `<div class="feedback ok" role="status"><span class="hd">${icon('check')}Right</span></div>`
      : `<div class="feedback no" role="status"><span class="hd">${icon('cross')}Not quite</span><span>The answer is “${esc(it.right)}” — it is in <a href="#/story/${it.pid}">${esc(it.title)}</a>, if you would like to hear it again.</span>
        <div class="row"><button class="btn" data-deep="next">${icon('next')}<span>Next question</span></button></div></div>`) : '<p class="note" style="margin:0">Tap an answer, or press 1 to 4.</p>'}</section>`;
}
function answer(j) {
  const a = author(S.route.parts[2]); if (!a) return;
  const items = quizFor(a), st = quizState(a), it = items[st.i]; if (!it || st.pick != null) return;
  st.pick = +j; const k = kid();
  if (+j === it.answer) {
    st.right++; sfx('right'); bumpDay(k, 'right'); bumpDay(k, 'answers');
    const paid = ((k.deep ||= {}).paid ||= {}); if (!paid[it.id]) { paid[it.id] = 1; pay('answer', `${a.name} deep dive`); }
    save(); redraw();
    const at = st.i; setTimeout(() => { if (S.deep === st && st.i === at && S.route.parts[2] === a.id) next(); }, 950);
  } else { sfx('wrong'); bumpDay(k, 'answers'); save(); redraw('[data-deep=next]'); }
}
function next() { const st = S.deep; if (!st) return; st.i++; st.pick = null; redraw(); }
function redraw(focus) {
  render();
  requestAnimationFrame(() => { const el = document.querySelector(focus || '#dq .opt:not([disabled]), #dq [data-deep]'); el?.focus({ preventScroll: true }); });
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-deep]'); if (!t || S.route.name !== 'library') return;
    e.preventDefault();
    if (t.dataset.deep === 'ans') answer(t.dataset.arg);
    else if (t.dataset.deep === 'next') next();
    else if (t.dataset.deep === 'again') { S.deep = null; redraw(); }
  });
  document.addEventListener('keydown', (e) => {
    if (S.route.name !== 'library' || S.route.parts[1] !== 'author' || S.sheet || S.wordcard || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const q = document.getElementById('dq'); if (!q || !S.deep) return;
    if (/^[1-4]$/.test(e.key) && S.deep.pick == null) { const b = q.querySelectorAll('[data-deep=ans]')[+e.key - 1]; if (b) { e.preventDefault(); answer(e.key - 1); } return; }
    const onControl = e.target.closest?.('a, button');
    if (e.key === 'ArrowRight' || ((e.key === 'Enter' || e.key === ' ') && !onControl)) {
      if (q.querySelector('[data-deep=next]')) { e.preventDefault(); next(); }
    }
  });
}
