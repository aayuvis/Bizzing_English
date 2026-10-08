/* tools.js (view) — the Tools tab (the owner, 3 Oct 2026: "a Tools tab where Stage can be a speaking tool…
   then we can borrow tools from Bizzing Bee"). A shelf of tool cards in Bee's shape (spellbound-app/app3.js
   viewExplore ~4852 and index.html .lib-* @ Bee 2f74e99d7): a painted header with a kicker pill and the tool's
   name drawn over it, a one-line blurb, a coloured button. The Stage keeps its own room (#/stage); the
   writing desks keep theirs (#/desk/<id>). Vocabulary, Idioms & Similes and the Typing Trainer are Bee's,
   ported (src/tools.js says from where); Quotes & Poems shows English's held lines and Bee's quotations.

   Keyboard AND touch everywhere: 1–4 answer, Enter goes on after a wrong answer, Space flips a card, ← →
   move through a deck; the Typing Trainer takes the keyboard, and a touch screen gets keys on the screen.
   Coins only on the family's standard events (pay): a right answer, a set passed, a deck or a typing lesson
   finished the first time. Speed alone earns nothing. */

import '../../styles/tools.css';
import { S, kid, save, render, pay, checkMedals } from '../app.js';
import { esc, icon, btn, link, pageHead, empty } from '../ui.js';
import { TOOLS, SMALL_TOOLS, vocDecks, vocProg, vocBuildSet, vocCheck, vocFinish, vocSetSize, VOC_PASS, OC, ORIGIN_NOTE, figDecks, figDeckItems, figFilter, figThemes,
  idiomRound, idiomStory, TY_LESSONS, TY_FINGER, TY_FCOLOR, TY_ROWS, TEST_SECS, TY_PASS, tySeqFor, tyTestSeq, typingScore, tyStats, tyCorpus, tyPays, tyPractised, tyElapsed, tyTimeLeft, tyPause, tyResume, quoteShelf, showLine, authorKey, QUOTE_CATS, quoteFilter } from '../tools.js';
import { loadLexicon, lex } from '../lexicon.js';
import { allStops, strand } from '../curriculum.js';
import { WORKS, PASSAGES } from '../data/library.js';
import { MORE_LINES } from '../data/lines-more.js';
import WRITING from '../data/writing.js';
import { shippedLines, shippable, cleared, work, loadPassages, passageText } from '../reading.js';
import { addToBank, bumpDay } from '../model.js';
import { sayWord, speak, stop as stopVoice } from '../voice.js';
import { sfx } from '../sound.js';

const BACK = { label: 'Tools', href: '#/tools' };
const rand = () => Math.random().toString(36).slice(2, 8);
let VOCAB = null, IDIOMS = null, QUOTES = null, DECKS = null, FIG = null;
const loadVocab = () => (VOCAB ? Promise.resolve(VOCAB) : fetch('data/vocab.json').then((r) => r.json()).then((j) => (VOCAB = j)).catch(() => null));
const loadIdioms = () => (IDIOMS ? Promise.resolve(IDIOMS) : import('../data/idioms.json').then((m) => (IDIOMS = m.default.items)));
const loadQuotes = () => (QUOTES ? Promise.resolve(QUOTES) : import('../data/bee-quotes.json').then((m) => (QUOTES = m.default.quotes)));
const decks = () => (DECKS ||= vocDecks(VOCAB, lex()));
const figD = () => (FIG ||= figDecks(IDIOMS));
const LIB_IDS = new Set(PASSAGES.filter(shippable).map((p) => p.id));
const passageTitle = (id) => PASSAGES.find((p) => p.id === id)?.title || 'the story';
const ALL_LINES = () => [...shippedLines(), ...MORE_LINES.filter((l) => cleared(work(l.work)))];

/* ---------- routing: #/tools[/desk|vocab[/deck]|idioms[/deck/<id>|/quiz]|typing[/<lesson>|/test]|quotes[/<author>|/voices]] ---------- */
export async function openTool(parts) {
  const [, tool, a, b] = parts;
  const keep = S.run?.mode === 'tool' && S.run.key === parts.join('/');
  if (keep) return;
  stopTyping();
  const r = { mode: 'tool', key: parts.join('/'), tool: tool || '' };
  if (tool === 'vocab') { await Promise.all([loadVocab(), loadLexicon()]); if (a) Object.assign(r, { deck: a, phase: 'study', i: 0, flip: false }); }
  else if (tool === 'idioms') { await loadIdioms(); Object.assign(r, a === 'deck' ? { phase: 'deck', deck: b, i: 0, flip: false } : a === 'quiz' ? newQuiz() : { phase: 'browse', q: a === 'p' ? b || '' : '', type: 'all', theme: 'all', page: 0 }); }   // #/tools/idioms/p/<phrase>: that phrase, found (My Feed's button)
  else if (tool === 'typing') { await Promise.all([loadLexicon(), loadVocab(), loadPassages()]); if (a) Object.assign(r, newTyping(a)); }
  else if (tool === 'quotes') { await loadPassages(); if (a === 'voices') { await loadQuotes(); Object.assign(r, { phase: 'voices', cat: b || 'all', q: '', page: 0 }); } else Object.assign(r, { phase: 'lines', author: a || 'all' }); }
  S.run = r;
}
export function toolsView() {
  const r = S.run?.mode === 'tool' ? S.run : { tool: '' };
  switch (r.tool) {
    case 'desk': return deskShelf();
    case 'vocab': return r.deck ? vocabDeckView(r) : vocabHome();
    case 'idioms': return idiomsView(r);
    case 'typing': return r.ty ? typingRun(r) : typingHome();
    case 'quotes': return quotesView(r);
    default: return shelf();
  }
}

/* ---------- the shelf (Bee's tool cards) ---------- */
function shelf() {
  const k = kid(), ty = tyStats(k), v = vocProg(k);
  const stat = { typing: ty.bestWpm ? `best ${ty.bestWpm} wpm` : '', vocab: Object.values(v.lv).reduce((a, b) => a + b, 0) ? `${Object.values(v.lv).reduce((a, b) => a + b, 0)} set${(Object.values(v.lv).reduce((a, b) => a + b, 0)) === 1 ? '' : 's'} passed` : '', stage: (k.stage['sp1-aloud'] || []).length ? `${k.stage['sp1-aloud'].length} time${(k.stage['sp1-aloud'].length) === 1 ? '' : 's'} on the Stage` : '' };
  const tile = (t) => `<a class="tl-tile" href="${t.href}" data-tool="${t.id}"><span class="tl-art"><img src="art/tool-${t.id}-card.webp" alt="" loading="lazy" decoding="async">
      <span class="tl-kick">${esc(t.kick)}</span><span class="tl-h">${esc(t.title)}</span></span>
      <span class="tl-body"><p>${esc(t.blurb)}</p><span class="tl-foot"><span class="tl-go" style="background:${t.c}">${icon(t.ic)}<span>${esc(t.cta)}</span></span>${stat[t.id] ? `<span class="tl-stat">${esc(stat[t.id])}</span>` : ''}</span></span></a>`;
  const podium = `<a class="card tl-small" href="#/stage/podium" data-tool="podium">${icon('lectern')}<span><b>The Podium</b><small>${k.podium?.cur ? `round ${k.podium.cur.round + 1} of 4 waiting` : 'the speaking tournament, on the Stage'}</small></span>${icon('next')}</a>`;   // The Stage's flagship, one tap from Tools
  const small = podium + SMALL_TOOLS.map((t) => `<a class="card tl-small" href="${t.href}" data-tool="${t.id}">${icon(t.ic)}<span><b>${esc(t.title)}</b><small>${esc(t.blurb)}</small></span>${icon('next')}</a>`).join('');
  return pageHead({ title: 'Tools', sub: 'speak, write, and train with words' }) + `<div class="tl-wrap"><div class="tl-grid">${TOOLS.map(tile).join('')}</div><div class="tl-smalls">${small}</div></div>`;
}

/* ---------- the writing desks ---------- */
function deskShelf() {
  const k = kid(), desks = allStops().filter((s) => s.kind === 'desk');
  const rows = desks.map((s) => { const done = k.stops[s.id]?.passed;
    return `<a class="stoprow${done ? ' passed' : ''}" href="#/desk/${s.id}"><span class="st">${icon(done ? 'check' : 'quill')}</span><span><b>${esc(s.title)}</b><small>${esc(strand(s.strand)?.title || '')} ${s.level} · ${esc(s.iCan || '')}</small></span><span>${icon('next')}</span></a>`; }).join('');
  return pageHead({ title: 'The Writing Desk', sub: 'parts to write, a checklist, counts — never marks', back: BACK }) +
    `<div class="tl-wrap stack"><div class="card"><p style="margin:0">Each desk gives you a model, the parts to write and a checklist you tick yourself. The app counts sentences and words; it never marks your writing, and what you write stays on this device.</p></div><div class="card"><div class="ladder">${rows}</div></div></div>`;
}

/* ---------- Vocabulary ---------- */
function vocabHome() {
  if (!VOCAB || !lex()) return pageHead({ title: 'Vocabulary', back: BACK }) + empty('sleep', 'The word lists could not load. Try again when you are online.', link('Tools', '#/tools'));
  const k = kid(), v = vocProg(k), groups = {};
  for (const d of decks()) (groups[d.group] ||= []).push(d);
  const card = (d) => { const lv = v.lv[d.id] || 0, rev = (v.revise[d.id] || []).length, last = v.last[d.id];
    return `<a class="card tl-deck" href="#/tools/vocab/${d.id}" data-deck="${d.id}"><b>${esc(d.label)}</b><small>${esc(d.sub)}</small><small>${d.n} words · set ${lv + 1}${rev ? ` · ${rev} to revise` : ''}${last ? ` · last check ${last.right}/${last.total}` : ''}</small><span class="tl-bar"><i style="width:${Math.min(100, Math.round(((lv * vocSetSize(k.band)) / d.n) * 100))}%"></i></span></a>`; };
  return pageHead({ title: 'Vocabulary', sub: 'word to meaning, vocabulary-bee style', back: BACK }) + `<div class="tl-wrap stack">
    <div class="card"><p style="margin:0">Study a set of ${vocSetSize(k.band)} words, then check yourself on those exact words. ${Math.round(VOC_PASS * 100)}% or better opens the next set; any you miss come back first. The words and meanings are Bizzing Bee’s.</p></div>
    ${Object.entries(groups).map(([g, ds]) => `<h2 class="tl-h2">${esc(g)}</h2><div class="grid3">${ds.map(card).join('')}</div>`).join('')}</div>`;
}
function vocDeck(r) { return decks().find((d) => d.id === r.deck); }
function vocabDeckView(r) {
  const d = vocDeck(r), k = kid();
  if (!d) return pageHead({ title: 'Vocabulary', back: { label: 'Vocabulary', href: '#/tools/vocab' } }) + empty('oops', 'That deck is not here.', link('All decks', '#/tools/vocab'));
  const v = vocProg(k), head = (sub) => pageHead({ title: d.label, sub, back: { label: 'Vocabulary', href: '#/tools/vocab' } });
  if (r.phase === 'check' || r.phase === 'revise') return head(r.phase === 'revise' ? 'revising the words you missed' : `checking set ${(v.lv[d.id] || 0) + 1}`) + quizCard(r, (it) => `<span class="tl-say"><span class="tl-word">${esc(it.word)}</span>${it.entry.p ? `<small class="muted">${esc(it.entry.p)}</small>` : ''}<button class="btn out small" data-act="tl-hear" data-arg="${esc(it.word)}" aria-label="Hear the word">${icon('speaker')}</button></span><p class="muted" style="margin:0">What does it mean?</p>`);
  if (r.phase === 'done') {
    const o = r.result, pct = Math.round(o.pct * 100);
    return head('your check') + `<div class="tl-wrap"><div class="card stack tl-result"><span class="kick">${r.qmode === 'revise' ? 'Revision' : 'Check'}</span><h2>${r.right} of ${r.items.length} — ${pct}%</h2>
      <p style="margin:0">${r.qmode === 'revise' ? (o.remaining ? `${o.remaining} word${o.remaining > 1 ? 's' : ''} still to revise before the next set opens.` : 'All revised — the next set is open.') : o.passed ? `Passed. Set ${(v.lv[d.id] || 0) + 1} is open${r.missed.length ? `, and the ${r.missed.length} you missed come along with it` : ''}.` : `Below ${Math.round(VOC_PASS * 100)}%: revise the ${r.missed.length} you missed, and the next set opens.`}</p>
      <div class="row">${(v.revise[d.id] || []).length ? btn(`Revise ${(v.revise[d.id] || []).length} words`, 'voc-revise', { ic: 'undo' }) : btn('Study the next set', 'voc-study', { ic: 'book' })}${link('All decks', '#/tools/vocab', { cls: 'out' })}</div></div></div>`;
  }
  const set = r.set ||= vocBuildSet(v, d, vocSetSize(k.band)); save();
  const e = set[Math.min(r.i, set.length - 1)], rev = (v.revise[d.id] || []).length;
  return head(`set ${(v.lv[d.id] || 0) + 1} · ${set.length} words`) + `<div class="tl-wrap stack">
    ${rev ? `<div class="card row" style="justify-content:space-between"><span>${rev} word${rev > 1 ? 's' : ''} to revise before the next set opens.</span>${btn('Revise them', 'voc-revise', { ic: 'undo' })}</div>` : ''}
    <div class="tl-progress" aria-hidden="true"><i style="width:${Math.round(((r.i + 1) / set.length) * 100)}%"></i></div>
    <button class="card tl-flip" data-act="tl-flip" aria-label="Turn the card">
      <span class="kick">${r.i + 1} / ${set.length}${e.ps ? ` · ${esc(e.ps)}` : ''}</span><span class="tl-word">${esc(e.w)}</span>${e.p ? `<small class="muted">${esc(e.p)}</small>` : ''}
      ${r.flip ? `<span class="tl-back"><b>${esc(e.d)}</b>${e.o ? `<small>Origin: ${esc(e.o)}${e.r ? ` — ${esc(e.r)}` : ''}</small>` : ''}${e.h ? `<small>Memory hint: ${esc(e.h)}</small>` : ''}</span>` : '<small class="muted">Tap the card, or press Space, to see the meaning</small>'}</button>
    <div class="row" style="justify-content:center">${btn('Back', 'tl-nav', { arg: '-1', cls: 'out', ic: 'back', dis: r.i === 0 })}${btn('Hear it', 'tl-hear', { arg: e.w, cls: 'out', ic: 'speaker' })}${btn('Next', 'tl-nav', { arg: '1', ic: 'next', dis: r.i >= set.length - 1 })}</div>
    <div class="card row" style="justify-content:space-between"><span>Know them? Check yourself on all ${set.length}.</span>${btn('Check yourself', 'voc-check', { ic: 'check', dis: rev > 0 })}</div></div>`;
}

/* one shared question card for the vocabulary check and the idiom quiz */
function quizCard(r, top) {
  const it = r.items[r.qi]; if (!it) return '';
  const st = r.state;
  const opt = (o, i) => { const cls = st ? (i === it.answer ? (st.pick === i ? ' right' : ' missed') : st.pick === i ? ' wrong' : '') : '';
    return `<button class="opt${cls}" data-act="tl-ans" data-arg="${i}" ${st ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`; };
  const fb = st && !st.ok ? `<div class="feedback no" role="status"><b>Not this one.</b><span>${esc(r.explain(it))}</span><div>${btn('Got it — next', 'tl-next', { ic: 'next' })}</div></div>` : st?.ok ? '<p class="feedback ok" role="status">Right!</p>' : '';
  return `<div class="tl-wrap stack"><div class="tl-progress" aria-hidden="true"><i style="width:${Math.round((r.qi / r.items.length) * 100)}%"></i></div>
    <div class="card stack tl-q"><span class="kick">${r.qi + 1} of ${r.items.length} · ${r.right} right</span>${top(it)}<div class="opts">${it.options.map(opt).join('')}</div>${fb}</div>
    <p class="note">Press 1–4 or tap. After a wrong answer, Enter goes on.</p></div>`;
}
function startQuiz(r, items, qmode, explain) { Object.assign(r, { phase: qmode, qmode, items, qi: 0, right: 0, missed: [], state: null, explain }); }
let adv = null;
function answer(i) {
  const r = S.run; if (r?.mode !== 'tool' || !r.items || r.state) return;
  const it = r.items[r.qi]; if (!it || i < 0 || i >= it.options.length) return;
  const ok = i === it.answer, k = kid(); r.state = { pick: i, ok };
  bumpDay(k, 'answers'); if (ok) { bumpDay(k, 'right'); r.right++; } else r.missed.push(r.tool === 'vocab' ? it.word : it.phrase);
  if (r.tool === 'vocab') { const v = vocProg(k); (ok ? v.known : v.miss)[it.word] = Date.now(); if (ok) addToBank(k, it.word, 'Vocabulary'); if (ok) pay('answer', `Vocabulary: ${it.word}`); }
  if (r.tool === 'idioms' && ok) pay('answer', `Idioms: ${it.phrase}`);
  sfx(ok ? 'right' : 'wrong'); save(); render();
  if (ok) { clearTimeout(adv); adv = setTimeout(() => { if (S.run === r && r.state?.ok) next(); }, 900); }
}
function next() {
  const r = S.run; if (!r?.items) return; clearTimeout(adv);
  r.state = null; r.qi++;
  if (r.qi >= r.items.length) finishQuiz(r);
  render(); requestAnimationFrame(() => document.querySelector('.tl-q .opt')?.focus({ preventScroll: true }));
}
function finishQuiz(r) {
  const k = kid();
  if (r.tool === 'vocab') {
    const v = vocProg(k), d = vocDeck(r);
    r.result = vocFinish(v, d.id, r.qmode, r.right, r.items.length, r.missed);
    if (r.result.passed) pay('stop', `Vocabulary: ${d.label}, set ${v.lv[d.id]}`);
    r.set = null; r.i = 0; r.phase = 'done';
  } else { r.phase = 'quizdone'; }
  sfx('finish'); save(); checkMedals();
}

/* ---------- Idioms & Similes ---------- */
function newQuiz() { const r = { phase: 'quiz' }; return r; }
function originBlock(x) {
  const oc = OC[x.oc] || OC.documented, story = idiomStory(x, LIB_IDS);
  return `<div class="tl-origin"><span class="tag tl-oc tl-oc-${esc(x.oc || 'documented')}">${esc(oc.label)}</span> <span>${esc(x.os || '')}</span>
    <small class="muted">${esc(oc.say)}. ${esc(ORIGIN_NOTE)}.</small>${story ? `<a class="tl-story" href="#/story/${story}">${icon('book')}<span>Hear the story in the Library: ${esc(passageTitle(story))}</span></a>` : ''}</div>`;
}
function idiomCard(x) {
  return `<article class="card tl-idiom"><div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><h3>${esc(x.p)}</h3><button class="btn out small" data-act="tl-say" data-arg="${esc(x.p + '. ' + x.m)}" aria-label="Hear it">${icon('speaker')}</button></div>
    <div class="row" style="gap:6px"><span class="tag">${esc(x.t)}</span>${x.region ? `<span class="tag">${esc(x.region)}</span>` : ''}</div>
    <p class="tl-m">${esc(x.m)}</p>${x.lit ? `<p class="muted tl-s">Literally: ${esc(x.lit)}</p>` : ''}<p class="tl-ex">“${esc(x.ex || '')}”</p>${originBlock(x)}
    ${(x.eq || []).length ? `<p class="muted tl-s">Same idea elsewhere: ${x.eq.map((e) => `${esc(e.lang)}: “${esc(e.p)}”`).join(' · ')}</p>` : ''}</article>`;
}
const PER = 24;
function idiomResults(r) {
  const list = figFilter(IDIOMS, r), pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(r.page, pages - 1);
  return `<p class="muted tl-count">${list.length} of ${IDIOMS.length} phrases</p><div class="tl-idioms">${list.slice(pg * PER, pg * PER + PER).map(idiomCard).join('') || '<p class="muted">No matches — try another search.</p>'}</div>
    ${pages > 1 ? `<div class="row" style="justify-content:center">${btn('Previous', 'id-page', { arg: String(pg - 1), cls: 'out', ic: 'back', dis: pg === 0 })}<span class="muted">Page ${pg + 1} of ${pages}</span>${btn('Next', 'id-page', { arg: String(pg + 1), cls: 'out', ic: 'next', dis: pg >= pages - 1 })}</div>` : ''}`;
}
function idiomsView(r) {
  if (!IDIOMS) return pageHead({ title: 'Idioms & Similes', back: BACK }) + empty('sleep', 'The sayings could not load.', link('Tools', '#/tools'));
  const nav = (on) => [{ label: 'Browse', icon: 'search', href: '#/tools/idioms', active: on === 'browse' }, { label: 'Learn', icon: 'book', href: '#/tools/idioms/deck', active: on === 'deck' }, { label: 'Quiz', icon: 'check', href: '#/tools/idioms/quiz', active: on === 'quiz' }];
  const head = (on, sub) => pageHead({ title: 'Idioms & Similes', sub, back: BACK, nav: nav(on) });
  const k = kid(), seen = ((k.games.idioms ||= {}).decks ||= {});
  if (r.phase === 'deck' && !r.deck) return head('deck', 'learn deck by deck') + `<div class="tl-wrap"><div class="grid3">${figD().map((d) => { const n = seen[d.id] || 0, done = n >= d.items.length;
    return `<a class="card tl-deck" href="#/tools/idioms/deck/${encodeURIComponent(d.id)}" data-deck="${esc(d.id)}"><b>${esc(d.label)}${done ? ' — done' : ''}</b><small>${d.items.length} cards${n && !done ? ` · ${n} seen` : ''}</small><span class="tl-bar"><i style="width:${Math.round((Math.min(n, d.items.length) / d.items.length) * 100)}%"></i></span></a>`; }).join('')}</div></div>`;
  if (r.phase === 'deck') {
    const d = figD().find((x) => x.id === r.deck); if (!d) return head('deck') + empty('oops', 'That deck is not here.', link('All decks', '#/tools/idioms/deck'));
    const x = d.items[Math.min(r.i, d.items.length - 1)], oc = OC[x.oc] || OC.documented;
    return head('deck', d.label) + `<div class="tl-wrap stack"><div class="tl-progress" aria-hidden="true"><i style="width:${Math.round(((r.i + 1) / d.items.length) * 100)}%"></i></div>
      <button class="card tl-flip" data-act="tl-flip" aria-label="Turn the card"><span class="kick">${r.i + 1} / ${d.items.length} · ${esc(x.t)}</span><span class="tl-phrase">“${esc(x.p)}”</span>
      ${r.flip ? `<span class="tl-back"><b>${esc(x.m)}</b>${x.lit ? `<small>Literally: ${esc(x.lit)}</small>` : ''}<small><span class="tag tl-oc tl-oc-${esc(x.oc || 'documented')}">${esc(oc.label)}</span> ${esc(x.os || '')}</small><small><i>“${esc(x.ex || '')}”</i></small><small class="muted">${esc(ORIGIN_NOTE)}.</small></span>` : '<small class="muted">Tap the card, or press Space, for the meaning and its story</small>'}</button>
      ${r.flip && idiomStory(x, LIB_IDS) ? `<a class="tl-story" href="#/story/${idiomStory(x, LIB_IDS)}">${icon('book')}<span>Hear the story in the Library: ${esc(passageTitle(idiomStory(x, LIB_IDS)))}</span></a>` : ''}
      <div class="row" style="justify-content:center">${btn('Back', 'tl-nav', { arg: '-1', cls: 'out', ic: 'back', dis: r.i === 0 })}${btn('Hear it', 'tl-say', { arg: x.p + '. ' + (r.flip ? x.m : ''), cls: 'out', ic: 'speaker' })}${btn('Next', 'tl-nav', { arg: '1', ic: 'next', dis: r.i >= d.items.length - 1 })}</div></div>`;
  }
  if (r.phase === 'quiz' || r.phase === 'quizdone') {
    if (!r.items) startQuiz(r, idiomRound(IDIOMS, `${k.name}:${Date.now()}`, 10), 'quiz', (it) => `“${it.phrase}” means: ${it.item.m}.`);
    if (r.phase === 'quizdone') return head('quiz', 'what does it mean?') + `<div class="tl-wrap"><div class="card stack tl-result"><span class="kick">Quiz</span><h2>${r.right} of ${r.items.length}</h2><p style="margin:0">${r.missed.length ? `Worth another look: ${r.missed.map((p) => `“${esc(p)}”`).join(', ')}.` : 'Every one right.'}</p><div class="row">${btn('Another ten', 'id-again', { ic: 'undo' })}${link('Browse', '#/tools/idioms', { cls: 'out' })}</div></div></div>`;
    return head('quiz', 'what does it mean?') + quizCard(r, (it) => `<span class="tl-phrase">“${esc(it.phrase)}”</span><p class="muted" style="margin:0">What does this ${esc(it.item.t)} mean?</p>`);
  }
  const themes = figThemes(IDIOMS), seg = (t, l) => `<button class="bz-chip tl-seg" data-act="id-type" data-arg="${t}" aria-pressed="${r.type === t}">${esc(l)}</button>`;
  return head('browse', `${IDIOMS.length} phrases and the story behind each`) + `<div class="tl-wrap stack">
    <p class="note">${esc(ORIGIN_NOTE)}: each origin story carries Bee’s own confidence in it — documented, disputed, or a folk tale.</p>
    <div class="row tl-filters"><label class="sr" for="idq">Search phrases or meanings</label><input id="idq" class="field" data-act="tl-q" value="${esc(r.q)}" placeholder="Search phrases or meanings…" autocomplete="off">
      ${seg('all', 'All')}${seg('idiom', 'Idioms')}${seg('proverb', 'Proverbs')}${seg('simile', 'Similes')}
      <label class="sr" for="idth">Theme</label><select id="idth" class="field tl-sel" data-act="tl-theme"><option value="all">All themes</option>${themes.map((t) => `<option value="${esc(t)}" ${r.theme === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
    <div class="tl-results">${idiomResults(r)}</div></div>`;
}

/* ---------- Typing Trainer ---------- */
/* The pools are curated (tools.js): kid-safe Bee words that are real words of the Library's own passages,
   the held dictation sentences, and English's vocabulary decks for "Type the meaning". A lesson pays once,
   and only at 90% or better. The sixty-second test pauses while the tab is hidden and carries on with the
   next key. Under 400 px the on-screen keyboard splits into a left-hand and a right-hand block, so every
   key stays at least 40 px wide; the finger colours and the lit next key stay. */
let tyTimer = null, CORPUS = null;
function stopTyping() { if (tyTimer) clearInterval(tyTimer); tyTimer = null; }
const corpus = () => (CORPUS ||= tyCorpus(PASSAGES.map((p) => passageText(p.id)?.text || '')));
function newTyping(id) {
  const k = kid(), sentences = WRITING.dictation.filter((s) => cleared(work(s.work)) && s.band <= k.band).map((s) => s.text), base = { pos: 0, typed: 0, errors: 0, marks: [], startT: 0, paused: 0, pausedMs: 0, done: false, shift: false };
  if (id === 'test') return { ty: { ...base, mode: 'test', title: 'Sixty-second typing test', tip: '', seq: tyTestSeq(lex(), k.band, rand(), corpus()) } };
  const n = TY_LESSONS.findIndex((x) => x.id === id), l = TY_LESSONS[n < 0 ? 0 : n];
  return { ty: { ...base, mode: 'lesson', lesson: l.id, n: (n < 0 ? 0 : n) + 1, title: l.name, tip: l.tip, seq: tySeqFor(l, { lex: lex(), band: k.band, sentences, seed: rand(), corpus: corpus(), decks: VOCAB ? decks() : [] }) } };
}
function typingHome() {
  const st = tyStats(kid());
  const rows = TY_LESSONS.map((l, i) => { const acc = st.lessons[l.id];
    return `<a class="stoprow${acc >= TY_PASS ? ' passed' : ''}" href="#/tools/typing/${l.id}" data-lesson="${l.id}"><span class="st">${acc >= TY_PASS ? icon('check') : `<b>${i + 1}</b>`}</span><span><b>${esc(l.name)}</b><small>${acc != null ? `best accuracy ${acc}%` : 'not tried yet'}</small></span><span>${icon('next')}</span></a>`; }).join('');
  return pageHead({ title: 'Typing Trainer', sub: st.bestWpm ? `best ${st.bestWpm} words a minute · ${st.bestAcc}% accurate` : 'finger by finger, then the sixty-second test', back: BACK, actions: [{ icon: 'clock', label: '60-second test', href: '#/tools/typing/test' }] }) +
    `<div class="tl-wrap stack"><div class="card"><p style="margin:0">Learn to touch-type finger by finger — then race the sixty-second test. A keyboard is best; on a touch screen, keys appear on the screen. A lesson earns coins the first time you finish it at ${TY_PASS}% accuracy or better; speed alone never does.</p></div><div class="card"><div class="ladder tl-lessons">${rows}</div></div></div>`;
}
const keyId = (ch) => (ch === ' ' ? 'space' : ch === ';' ? 'semi' : ch === ',' ? 'comma' : ch === '.' ? 'dot' : ch);
function typingRun(r) {
  const t = r.ty, st = tyStats(kid());
  const head = pageHead({ title: t.title, sub: t.mode === 'test' ? 'the clock starts on your first key' : `lesson ${t.n} of ${TY_LESSONS.length}`, back: { label: 'Typing', href: '#/tools/typing' } });
  if (t.done) {
    const pr = tyPractised(t.seq, t.marks, t.pos), keys = pr.keys.map((c) => `<kbd class="ty-kb">${c === ' ' ? 'space' : esc(c)}</kbd>`).join('');
    const line = t.mode === 'test' ? (t.best ? 'A new best for you.' : `Your best is ${st.bestWpm} words a minute.`)
      : t.paid ? `${t.acc}% — lesson passed for the first time, and coins in your wallet.` : t.acc >= TY_PASS ? `${t.acc}% — passed. Coins come once, the first time.` : `${t.acc}% — the coins come at ${TY_PASS}%. Slow down a little: accuracy first, speed follows.`;
    return head + `<div class="tl-wrap"><div class="card stack tl-result"><span class="kick">${t.mode === 'test' ? 'Test complete' : 'Lesson complete'}</span>
    <div class="stats"><div class="stat"><b>${t.wpm}</b><small>words a minute</small></div><div class="stat"><b>${t.acc}%</b><small>accuracy</small></div></div>
    <p style="margin:0">${line}</p>
    <div class="ty-practised"><p style="margin:0"><b>You practised</b> ${t.mode === 'test' ? `${t.pos} keys of Bee words at your level` : esc(t.title)}: <span class="ty-kbs">${keys}</span></p>
    <p style="margin:0">${pr.missed.length ? `<b>Words to try again:</b> ${pr.missed.slice(0, 12).map((w) => esc(w)).join(', ')}` : '<b>No word missed.</b>'}</p></div>
    <div class="row">${t.mode === 'test' ? link('Test again', '#/tools/typing/test', { ic: 'undo' }) : btn('Once more', 'ty-again', { ic: 'undo' })}${link('All lessons', '#/tools/typing', { cls: 'out' })}</div></div></div>`;
  }
  // each word is one unbreakable group and each space a real space, so a line breaks BETWEEN words, never
  // inside one ('chec / ked' — brief v4)
  const cell = (ch, i) => `<span id="ty-c${i}" class="${i < t.pos ? (t.marks[i] ? 'ok' : 'err') : i === t.pos ? 'cur' : ''}">${ch === ' ' ? ' ' : esc(ch)}</span>`;
  let chars = '', at = 0;
  for (const part of t.seq.split(/( )/)) { if (!part) continue; const cells = part.split('').map((ch, j) => cell(ch, at + j)).join(''); chars += part === ' ' ? cells : `<span class="ty-w">${cells}</span>`; at += part.length; }
  const want = (t.seq[t.pos] || '').toLowerCase();
  const key = (ch) => { const f = TY_FINGER[ch]; return `<button class="ty-key${ch === want ? ' next' : ''}" id="ty-k-${keyId(ch)}" data-act="ty-tap" data-arg="${esc(ch)}" style="border-bottom-color:${f ? TY_FCOLOR[f] : '#9A93AB'}">${ch === ';' ? ';' : esc(ch.toUpperCase())}</button>`; };
  // the board as six half-rows: two columns on a wide screen (one keyboard), one under 400 px (left hand, then right)
  const halves = TY_ROWS.map((row) => [row.slice(0, 5), row.slice(5)]);
  const half = (keys, side, i) => `<div class="ty-half ty-${side}${i + 1}">${keys.split('').map(key).join('')}</div>`;
  const time = t.mode === 'test' ? `<b id="ty-time" class="ty-time">${t.paused ? 'paused' : `${t.startT ? tyTimeLeft(t) : TEST_SECS}s`}</b>` : '';
  return head + `<div class="tl-wrap stack ty">
    ${t.tip ? `<p class="note">${esc(t.tip)}</p>` : ''}<div class="row" style="justify-content:space-between"><div class="tl-progress" style="flex:1" aria-hidden="true"><i id="ty-prog" style="width:${Math.round((t.pos / t.seq.length) * 100)}%"></i></div>${time}</div>
    <div class="card ty-text" aria-label="Type this">${chars}</div>
    <div class="ty-board" aria-label="On-screen keyboard">${halves.map(([l, rr], i) => half(l, 'l', i) + half(rr, 'r', i)).join('')}
      <div class="ty-row ty-sp"><button class="ty-key ty-shift" data-act="ty-shift" aria-pressed="${t.shift}">Shift</button><button class="ty-key ty-space${want === ' ' ? ' next' : ''}" id="ty-k-space" data-act="ty-tap" data-arg=" ">space</button><button class="ty-key ty-shift" data-act="ty-tap" data-arg="Backspace">Back</button></div>
      <div class="ty-legend">${[['#E8458C', 'pinky'], ['#F0A82A', 'ring'], ['#13A892', 'middle'], ['#3D7DF0', 'left index'], ['#7B52E0', 'right index']].map(([c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join('')}</div></div>
    <p class="note">Type on your keyboard, or tap the keys — ${t.mode === 'test' ? 'the sixty-second clock starts on your first key, and stops while this page is hidden.' : 'accuracy first, speed follows.'}</p></div>`;
}
function tyCursor(t) {
  document.querySelectorAll('.ty-text .cur').forEach((e) => e.classList.remove('cur'));
  document.getElementById('ty-c' + t.pos)?.classList.add('cur');
  document.querySelectorAll('.ty-key.next').forEach((e) => e.classList.remove('next'));
  document.getElementById('ty-k-' + keyId((t.seq[t.pos] || '').toLowerCase()))?.classList.add('next');
  const p = document.getElementById('ty-prog'); if (p) p.style.width = Math.round((t.pos / t.seq.length) * 100) + '%';
}
function tyClock(r) {
  const t = r.ty; stopTyping();
  tyTimer = setInterval(() => { if (S.run !== r || t.done) { stopTyping(); return; } if (t.paused) return; const left = tyTimeLeft(t); const el = document.getElementById('ty-time'); if (el) el.textContent = left + 's'; if (left <= 0) tyFinish(r); }, 250);
}
function tyProcess(ch) {
  const r = S.run, t = r?.ty; if (!t || t.done) return;
  if (t.paused) { tyResume(t); if (t.mode === 'test') tyClock(r); const el = document.getElementById('ty-time'); if (el) el.textContent = tyTimeLeft(t) + 's'; }   // back from a hidden tab: the next key carries on
  if (!t.startT) { t.startT = Date.now(); if (t.mode === 'test') tyClock(r); }
  if (ch === 'Backspace') { if (t.pos > 0) { t.pos--; const sp = document.getElementById('ty-c' + t.pos); if (sp) sp.className = ''; tyCursor(t); } return; }
  if (ch.length !== 1) return;
  if (t.shift && /[a-z]/.test(ch)) { ch = ch.toUpperCase(); t.shift = false; document.querySelector('.ty-shift')?.setAttribute('aria-pressed', 'false'); }
  const ok = ch === t.seq[t.pos]; if (!ok) t.errors++;
  t.marks[t.pos] = ok; const sp = document.getElementById('ty-c' + t.pos); if (sp) sp.className = ok ? 'ok' : 'err';
  t.pos++; t.typed++;
  if (t.pos >= t.seq.length) return tyFinish(r);
  tyCursor(t);
}
function tyFinish(r) {
  const t = r.ty; if (t.done) return; t.done = true; stopTyping();
  Object.assign(t, typingScore({ typed: t.typed, errors: t.errors, ms: t.mode === 'test' ? Math.min(TEST_SECS * 1000, tyElapsed(t)) : tyElapsed(t) }));
  const k = kid(), st = tyStats(k);
  if (t.mode === 'test') { st.tests = (st.tests || 0) + 1; t.best = t.wpm > (st.bestWpm || 0); if (t.best) st.bestWpm = t.wpm; if (t.acc > (st.bestAcc || 0)) st.bestAcc = t.acc; }
  else { st.lessons[t.lesson] = Math.max(st.lessons[t.lesson] || 0, t.acc); st.sessions = (st.sessions || 0) + 1;
    if (tyPays(st, t.lesson, t.acc)) { st.paid[t.lesson] = Date.now(); t.paid = true; pay('stop', `Typing lesson ${t.n} at ${t.acc}%: ${t.title}`); } }
  sfx('finish'); save(); render();
}
/* a hidden tab pauses the clock (lessons and the test); the next key carries on */
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  const r = S.run, t = r?.mode === 'tool' ? r.ty : null; if (!t || t.done || !t.startT || !document.hidden) return;
  tyPause(t); stopTyping(); const el = document.getElementById('ty-time'); if (el) el.textContent = 'paused';
});

/* ---------- Quotes & Poems ---------- */
function versePassageFor(l) {
  const c = (s) => s.replace(/\s+/g, ' ').toLowerCase();
  const vs = PASSAGES.filter((p) => p.work === l.work && p.kind === 'verse' && shippable(p));
  return vs.find((p) => c(passageText(p.id)?.text || '').includes(c(l.text))) || null;
}
function quotesView(r) {
  const nav = [{ label: 'From the books', icon: 'book', href: '#/tools/quotes', active: r.phase === 'lines' }, { label: 'Quotations', icon: 'quote', href: '#/tools/quotes/voices', active: r.phase === 'voices' }];
  if (r.phase === 'voices') {
    if (!QUOTES) return pageHead({ title: 'Quotes & Poems', back: BACK, nav }) + empty('sleep', 'The quotations could not load.', link('Tools', '#/tools'));
    const cats = Object.keys(QUOTE_CATS).filter((c) => QUOTES.some((x) => x.c === c));
    const list = quoteFilter(QUOTES, r), pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(r.page, pages - 1);
    return pageHead({ title: 'Quotes & Poems', sub: `${QUOTES.length.toLocaleString('en-GB')} quotations`, back: BACK, nav }) + `<div class="tl-wrap stack">
      <div class="tl-chips">${[['all', 'All'], ...cats.map((c) => [c, QUOTE_CATS[c]])].map(([c, l]) => `<a class="bz-chip" href="#/tools/quotes/voices/${c}" ${r.cat === c ? 'aria-current="page"' : ''}>${esc(l)}</a>`).join('')}</div>
      <p class="muted tl-count">${list.length.toLocaleString('en-GB')} quotations${r.cat !== 'all' ? ` · ${esc(QUOTE_CATS[r.cat] || r.cat)}` : ''}</p>
      <div class="tl-quotes">${list.slice(pg * PER, pg * PER + PER).map((x) => `<figure class="card tl-quote"><blockquote>${esc(x.q)}</blockquote><figcaption>— ${esc(x.a)}${x.who ? `, <span class="muted">${esc(x.who)}</span>` : ''}</figcaption>${x.m ? `<p class="muted tl-s">${esc(x.m)}</p>` : ''}<button class="btn out small" data-act="tl-say" data-arg="${esc(x.q + ' — ' + x.a)}" aria-label="Hear it">${icon('speaker')}</button></figure>`).join('')}</div>
      ${pages > 1 ? `<div class="row" style="justify-content:center">${btn('Previous', 'q-page', { arg: String(pg - 1), cls: 'out', ic: 'back', dis: pg === 0 })}<span class="muted">Page ${pg + 1} of ${pages}</span>${btn('Next', 'q-page', { arg: String(pg + 1), cls: 'out', ic: 'next', dis: pg >= pages - 1 })}</div>` : ''}</div>`;
  }
  const shelfL = quoteShelf(ALL_LINES(), WORKS), cur = shelfL.find((a) => a.key === r.author);
  const lines = cur ? cur.lines : shelfL.flatMap((a) => a.lines);
  const card = (l) => { const p = versePassageFor(l), story = !p && PASSAGES.find((x) => x.work === l.work && shippable(x));
    return `<figure class="card tl-quote"><blockquote>${esc(showLine(l.text))}</blockquote><figcaption>— ${esc(l.who)}</figcaption>
      <div class="row tl-qacts">${link(l.title, `#/book/${l.work}`, { cls: 'out small', ic: 'book' })}${p ? link('Learn it by heart', `#/stage/sp2-recite/${p.id}`, { cls: 'small', ic: 'mic' }) : story ? link('Hear the story', `#/story/${story.id}`, { cls: 'out small', ic: 'speaker' }) : ''}</div></figure>`; };
  return pageHead({ title: 'Quotes & Poems', sub: `${lines.length} lines from the books in the Library`, back: BACK, nav }) + `<div class="tl-wrap stack">
    <p class="note">Every line here is word for word from a book the Library holds. Where it comes from a poem, learn it by heart on the Stage.</p>
    <div class="tl-chips"><a class="bz-chip" href="#/tools/quotes" ${!cur ? 'aria-current="page"' : ''}>Every author</a>${shelfL.map((a) => `<a class="bz-chip" href="#/tools/quotes/${a.key}" ${cur === a ? 'aria-current="page"' : ''}>${esc(a.author)} (${a.lines.length})</a>`).join('')}</div>
    <div class="tl-quotes">${lines.map(card).join('')}</div></div>`;
}

/* ---------- actions, keys, inputs ---------- */
export const TOOL_ACTIONS = {
  'tl-flip': () => { const r = S.run; if (r?.mode !== 'tool') return; r.flip = !r.flip; if (r.flip && r.tool === 'idioms' && r.deck) markSeen(r); render(); },
  'tl-nav': (a) => { const r = S.run; if (r?.mode !== 'tool') return; const n = r.tool === 'vocab' ? (r.set || []).length : figD().find((d) => d.id === r.deck)?.items.length || 0;
    r.i = Math.max(0, Math.min(n - 1, r.i + +a)); r.flip = false; if (r.tool === 'idioms') markSeen(r); render(); },
  'tl-hear': (w) => sayWord(w),
  'tl-say': (t) => { stopVoice(); speak(t); },
  'tl-ans': (a) => answer(+a),
  'tl-next': () => next(),
  'voc-check': () => { const r = S.run, d = vocDeck(r); if (!r.set) return; startQuiz(r, vocCheck(d, r.set, `:${vocProg(kid()).lv[d.id] || 0}`), 'check', (it) => `${it.word} means: ${it.entry.d}`); render(); },
  'voc-revise': () => { const r = S.run, d = vocDeck(r), v = vocProg(kid()); const ws = (v.revise[d.id] || []).map((w) => d.words.find((e) => e.w === w)).filter(Boolean);
    if (!ws.length) return; startQuiz(r, vocCheck(d, ws, `:r${Date.now() % 997}`), 'revise', (it) => `${it.word} means: ${it.entry.d}`); render(); },
  'voc-study': () => { const r = S.run; Object.assign(r, { phase: 'study', set: null, i: 0, flip: false, items: null }); render(); },
  'id-type': (t) => { const r = S.run; r.type = t; r.page = 0; render(); },
  'id-page': (p) => { const r = S.run; r.page = Math.max(0, +p); render(); window.scrollTo(0, 0); },
  'id-again': () => { const r = S.run; Object.assign(r, newQuiz(), { items: null }); render(); },
  'q-page': (p) => { const r = S.run; r.page = Math.max(0, +p); render(); window.scrollTo(0, 0); },
  'ty-tap': (ch) => tyProcess(ch || ' '),
  'ty-shift': () => { const t = S.run?.ty; if (!t) return; t.shift = !t.shift; document.querySelector('.ty-shift')?.setAttribute('aria-pressed', String(t.shift)); document.querySelectorAll('.ty-row .ty-key[data-arg]').forEach((b) => { const a = b.dataset.arg; if (/^[a-z]$/.test(a)) b.textContent = a.toUpperCase(); }); },
  'ty-again': () => { const r = S.run; if (!r?.ty) return; Object.assign(r, newTyping(r.ty.lesson)); render(); },
};
function markSeen(r) {
  const k = kid(), d = figD().find((x) => x.id === r.deck); if (!d) return;
  const g = (k.games.idioms ||= {}), seen = (g.decks ||= {}), done = (g.done ||= {});
  seen[d.id] = Math.max(seen[d.id] || 0, r.i + 1);
  if (seen[d.id] >= d.items.length && !done[d.id]) { done[d.id] = Date.now(); pay('stop', `Idioms deck: ${d.label}`); sfx('finish'); }
  save();
}
export function toolsInput(t) {
  const r = S.run; if (r?.mode !== 'tool' || r.tool !== 'idioms') return;
  r.q = t.value; r.page = 0; const box = document.querySelector('.tl-results'); if (box) box.innerHTML = idiomResults(r);
}
export function toolsChange(t) { const r = S.run; if (r?.mode !== 'tool') return; r.theme = t.value; r.page = 0; render(); }
export function toolsKey(e) {
  if (S.route.name !== 'tools') return false;
  const r = S.run; if (r?.mode !== 'tool') return false;
  if (r.ty && !r.ty.done) { if (e.key === 'Backspace' || e.key.length === 1) { tyProcess(e.key); return true; } return false; }
  if (r.items && (r.phase === 'check' || r.phase === 'revise' || r.phase === 'quiz')) {
    if (r.state) { if (e.key === 'Enter' && !r.state.ok) { next(); return true; } return false; }
    if (/^[1-4]$/.test(e.key)) { answer(+e.key - 1); return true; }
    return false;
  }
  if ((r.tool === 'vocab' && r.phase === 'study') || (r.tool === 'idioms' && r.phase === 'deck' && r.deck)) {
    const free = e.target === document.body || e.target.id === 'main' || !!e.target.closest?.('.tl-flip');
    if ((e.key === ' ' || e.key === 'Enter') && free) { TOOL_ACTIONS['tl-flip'](); return true; }
    if (e.key === 'ArrowRight') { TOOL_ACTIONS['tl-nav']('1'); return true; }
    if (e.key === 'ArrowLeft') { TOOL_ACTIONS['tl-nav']('-1'); return true; }
  }
  return false;
}
export function leaveTools() { stopTyping(); clearTimeout(adv); }
