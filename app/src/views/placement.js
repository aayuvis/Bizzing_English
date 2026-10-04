/* views/placement.js — "Find my starting place" (placement.js decides; this only draws and listens).
   #/place/first comes straight from the welcome; #/place is the same check taken again later, which only
   moves a start forward. Eight meaning questions, then one passage read on screen with three questions.
   A right answer advances, a wrong one holds until "Got it" (the runner's rule); keys 1–4 and Enter.
   Nothing here pays a coin, counts a day's answers, adds to the mistakes deck or touches mastery. */

import '../../styles/placement.css';
import { S, kid, save, render } from '../app.js';
import { esc, icon, btn, link, mascot, pageHead } from '../ui.js';
import { check } from '../items.js';
import { loadLexicon } from '../lexicon.js';
import { loadPassages, passageText, work } from '../reading.js';
import { level } from '../curriculum.js';
import { wordItems, wordOver, scoreWord, scoreReading, readingPart, applyPlace, WORD_N } from '../placement.js';
import { sfx } from '../sound.js';

export async function openPlace(first = false) {
  const k = kid(); if (!k) return;
  const [lex] = await Promise.all([loadLexicon(), loadPassages()]);
  const items = lex ? wordItems(lex, `${k.id}:${k.place?.at || 0}`) : [];
  S.place = { first, phase: items.length ? 'word' : 'passage', items, i: 0, answers: [], state: null, wordStart: null, read: null, readRight: 0, result: null };
  if (!items.length) startPassage();
}

function startPassage() {
  const p = S.place, k = kid();
  p.wordStart = scoreWord(p.answers, k.band);
  p.read = readingPart(p.wordStart); p.phase = 'passage'; p.i = 0; p.state = null;
}

function finish() {
  const p = S.place, k = kid();
  const res = { word: p.wordStart, reading: scoreReading(p.readRight, p.read.level, k.band) };
  p.result = applyPlace(k, res, { first: p.first }); p.phase = 'done';
  save();
}

const guide = (line, pose = 'think') => `<div class="pl-guide"><img src="${mascot(pose)}" alt=""><div class="bubble">${esc(line)}</div></div>`;

function itemCard(it, n, of, lbl) {
  const p = S.place, st = p.state;
  const mark = (i) => (st?.done ? (i === it.answer ? ' right' : st.pick === i ? ' wrong' : '') : '');
  const opts = `<div class="opts" role="group" aria-label="Choices">${it.options.map((o, i) => `<button class="opt${mark(i)}" data-act="pl-pick" data-arg="${i}" ${st?.done ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>`;
  const fb = st?.done ? (st.ok ? `<div class="feedback ok pop" role="status"><div class="hd">${icon('check')}Right!</div></div>`
    : `<div class="feedback no shake" role="status"><div class="hd">${icon('cross')}Not this time</div><div>${esc(it.explain || '')}</div><div>${btn('Got it', 'pl-next', { ic: 'next' })}</div></div>`) : '';
  return `<div class="card item pl-item"><div class="row" style="justify-content:space-between"><span class="kick">${esc(lbl)} · ${n} of ${of}</span></div>
    <p class="prompt${it.prompt.length > 60 ? ' big' : ''}">${esc(it.prompt)}</p>${it.sub ? `<p class="subp">${esc(it.sub)}</p>` : ''}${opts}${fb}</div>`;
}

function passageHTML(pass) {
  const t = passageText(pass.id)?.text || '';
  return `<article class="card pl-passage" aria-label="${esc(pass.title)}"><span class="kick">${esc(pass.title)} · ${esc(work(pass.work)?.author || '')}</span>
    ${t.split(/\n\s*\n/).map((para) => `<p>${esc(para.replace(/\s+/g, ' ').trim())}</p>`).join('')}</article>`;
}

export function placeView() {
  const p = S.place, k = kid();
  const head = pageHead({ title: 'Find my starting place', back: { label: p?.first ? 'Skip' : 'My page', href: p?.first ? '#/continue' : '#/me' } });
  if (!p) return head;
  if (p.phase === 'word') {
    const line = p.i === 0 ? (p.first ? 'A few quick questions so I know where your road begins. It is not a test — guess if you are not sure.' : 'Let’s see if your road should start further on. This only ever moves you forward.')
      : p.i < 4 ? 'Good. They get a little harder as we go.' : 'These are the tricky ones. Do your best.';
    return head + `<div class="pl">${guide(line, p.i === 0 ? 'wave' : 'think')}<div class="pl-dots" aria-hidden="true">${p.items.map((_, i) => `<i class="${i < p.answers.length ? 'on' : i === p.i ? 'here' : ''}"></i>`).join('')}</div>
      ${itemCard(p.items[p.i], p.i + 1, WORD_N, 'Words')}</div>`;
  }
  if (p.phase === 'passage') return head + `<div class="pl">${guide('Now read this, as slowly as you like. Three questions come after.', 'point')}${passageHTML(p.read.passage)}
    <div class="row">${btn('I have read it', 'pl-read', { ic: 'next' })}</div></div>`;
  if (p.phase === 'read') return head + `<div class="pl">${itemCard(p.read.items[p.i], p.i + 1, p.read.items.length, 'The story')}
    <details class="pl-again"><summary>Read the story again</summary>${passageHTML(p.read.passage)}</details></div>`;
  const r = p.result, lw = level('word', r.word), lr = level('reading', r.reading);
  return head + `<div class="pl pl-done">${guide(`Thank you, ${k.name}. You’ll start at Word ${r.word} and Reading ${r.reading}.`, 'cheer')}
    <div class="card pl-result" role="status"><h2>You’ll start at Word ${r.word} and Reading ${r.reading}</h2>
      <div class="pl-starts"><div>${icon('key')}<span><b>Word ${r.word}</b> · ${esc(lw?.title || '')}</span></div><div>${icon('book')}<span><b>Reading ${r.reading}</b> · ${esc(lr?.title || '')}</span></div></div>
      <p class="note">Everything up to there is open for you. Nothing is ticked off for you — each stop still waits to be done, and you can go back to any earlier one.</p>
      <div class="row">${link('Start my journey', '#/continue', { ic: 'next' })}</div></div></div>`;
}

function answer(i) {
  const p = S.place; if (!p || !['word', 'read'].includes(p.phase) || p.state?.done) return;
  const it = p.phase === 'word' ? p.items[p.i] : p.read.items[p.i]; if (!it) return;
  const ok = check(it, i);
  p.state = { done: true, ok, pick: i };
  if (p.phase === 'word') p.answers.push(ok); else if (ok) p.readRight++;
  sfx(ok ? 'right' : 'wrong');
  if (ok) setTimeout(() => { if (S.place === p && p.state?.done && p.state.ok) advance(); }, 950);
  render();
}

function advance() {
  const p = S.place; if (!p) return;
  p.state = null;
  if (p.phase === 'word') { if (wordOver(p.answers)) startPassage(); else p.i++; }
  else if (p.phase === 'read') { p.i++; if (p.i >= p.read.items.length) finish(); }
  render(); focusFirst();
}

function focusFirst() { requestAnimationFrame(() => document.querySelector('.pl-item .opt:not([disabled]), .pl [data-act=pl-read], .pl-result a')?.focus({ preventScroll: true })); }

export const PLACE_ACTIONS = {
  'pl-pick': (a) => answer(+a),
  'pl-next': () => advance(),
  'pl-read': () => { const p = S.place; if (p?.phase !== 'passage') return; p.phase = 'read'; p.i = 0; p.state = null; render(); window.scrollTo(0, 0); focusFirst(); },
};

/* Keyboard: 1–4 choose; Enter dismisses a wrong answer, or says the passage is read. */
export function placeKey(e) {
  const p = S.place; if (!p || S.route.name !== 'place') return false;
  if ((p.phase === 'word' || p.phase === 'read') && !p.state?.done) {
    const it = p.phase === 'word' ? p.items[p.i] : p.read.items[p.i];
    if (it && /^[1-9]$/.test(e.key) && +e.key <= it.options.length) { answer(+e.key - 1); return true; }
    return false;
  }
  if (e.key !== 'Enter' || /^(BUTTON|A)$/.test(e.target.tagName)) return false;
  if ((p.phase === 'word' || p.phase === 'read') && p.state?.done && !p.state.ok) { advance(); return true; }
  if (p.phase === 'passage') { PLACE_ACTIONS['pl-read'](); return true; }
  return false;
}
