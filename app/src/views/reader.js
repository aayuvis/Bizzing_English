/* reader.js — a passage from a classic, in the original (SPEC §4). A real book face at ≥ 18px,
   60–75 characters a line, never justified. Tap any word (or type it in the box — the keyboard
   way) for its meaning, sound, origin and a memory hint from Bizzing Bee; the tap puts it in the
   word bank. "Read it to me" reads along in the device's own voice, word by word. Then the
   questions: literal and inferential are checked; the evaluative one never is — it is for
   talking about, and the screen says so. */

import { S, kid, save, render, pay, checkMedals, mark } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { passage, passageText, loadPassages, work, readingStop, levelOf, shippable } from '../reading.js';
import { passageItems, check } from '../items.js';
import { lookup, loadLexicon } from '../lexicon.js';
import { addToBank, bumpDay } from '../model.js';
import { taught } from '../mastery.js';
import { speak, stop as stopVoice, sayWord } from '../voice.js';
import { sfx } from '../sound.js';
import { duck } from '../sound.js';

export async function openRead(id) {
  await Promise.all([loadPassages(), loadLexicon()]);
  const p = passage(id);
  S.run = p && shippable(p) ? { mode: 'read', id, phase: 'read', items: passageItems(p), i: 0, right: 0, state: null, now: -1 } : { mode: 'read', error: true };
  if (p && kid()) { kid().book = { work: p.work, passage: id }; save(); }
}

function paint(text, kind, k) {
  let n = 0;
  // split into words and the rest FIRST, then escape each piece — escaping first turned quotes into "&quot;" words
  const words = (s) => s.split(/([A-Za-z][A-Za-z'’-]*)/).map((m, i) => (i % 2 ? `<span class="w${k.bank[m.toLowerCase()] ? ' banked' : ''}" data-act="word" data-arg="${esc(m)}" data-n="${n++}">${esc(m)}</span>` : esc(m))).join('');
  return text.split(/\n\s*\n/).map((para) => `<p>${words(para.trim())}</p>`).join('');
}

export function readerView() {
  const r = S.run, k = kid();
  if (!r || r.error) return empty('oops', 'That passage is not on the shelf.', link('The Library', '#/library'));
  const p = passage(r.id), t = passageText(r.id), w = work(p.work);
  const head = pageHead({ title: p.title, sub: `${w.title} · ${w.author}`, back: { label: 'Library', href: `#/book/${w.id}` },
    actions: [{ icon: 'speaker', label: r.reading ? 'Stop reading' : 'Read it to me', href: '#', act: 'readalong' }] });
  if (r.phase === 'read') {
    return head + `<div class="reader">
      ${p.abridged ? `<p class="retold">Retold for younger readers — the original is in the Library.</p>` : ''}
      ${p.needsReview ? `<p class="note">${icon('help')} A note for grown-ups is on this book’s card.</p>` : ''}
      <article class="card passage${p.kind === 'verse' ? ' verse' : ''}" aria-label="${esc(p.title)}">${paint(t?.text || '', p.kind, k)}</article>
      <form class="row" data-act="lookup-form"><label class="sr" for="lk">Look up a word</label><input id="lk" class="field" name="w" placeholder="Look up a word from the passage" autocomplete="off" style="flex:1;min-width:200px">${btn('Look up', 'lookup', { ic: 'search', cls: 'out' })}</form>
      <p class="note">Tap any word to see what it means. Words you tap go into your word bank. ${t ? `About ${t.words} words · reading level ${t.level ?? Math.round(t.fk)}.` : ''}</p>
      <div class="row">${btn('I’ve read it — questions', 'read-questions', { ic: 'next' })}${link('The whole book', `#/book/${w.id}`, { cls: 'out', ic: 'book' })}</div>
      <p class="source">From ${esc(w.title)} (${w.year}), ${esc(w.sources?.[0] || '')}. In the public domain.</p></div>`;
  }
  if (r.phase === 'questions') return head + `<div class="reader">${questionView(r)}</div>`;
  const passed = r.right >= Math.ceil(r.items.length * 0.75);
  return head + `<div class="reader"><div class="card finish stack pop"><img src="${mascot(passed ? 'cheer' : 'think')}" alt=""><div class="score">${r.right} / ${r.items.length}</div>
    <p>${passed ? 'You understood it. Come back another day and answer again — that is when it counts as understood.' : 'Read it once more — look for the answers in the words — then try again.'}</p>
    <div class="card" style="text-align:left;background:var(--bz-chip)"><span class="kick">Talk about it</span><p style="font:600 17px/1.5 var(--read);margin:6px 0">${esc(p.evaluate || '')}</p>
    <p class="note">There is no right answer to this one, so the app does not mark it. Talk it over with a grown-up, or write your thoughts on the writing desk.</p></div>
    <div class="row" style="justify-content:center">${passed ? link('Continue', '#/continue', { ic: 'next' }) : btn('Read it again', 'read-again', { ic: 'undo' })}${link('Library', '#/library', { cls: 'out', ic: 'book' })}</div></div></div>`;
}

function questionView(r) {
  const it = r.items[r.i], st = r.state;
  const opts = it.options.map((o, i) => `<button class="opt${st?.done ? (i === it.answer ? ' right' : st.pick === i ? ' wrong' : '') : ''}" data-act="rpick" data-arg="${i}" ${st?.done ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('');
  const fb = st?.done ? (st.ok ? `<div class="feedback ok pop" role="status"><div class="hd">${icon('check')}Right!</div></div>`
    : `<div class="feedback no shake" role="status"><div class="hd">${icon('cross')}Not this time</div><div>The passage says: ${esc(it.explain)}</div><div>${btn('Got it', 'rnext', { ic: 'next' })}${btn('Look back at the passage', 'read-look', { cls: 'ghost small', ic: 'book' })}</div></div>`) : '';
  return `<div class="card item"><div class="row" style="justify-content:space-between"><span class="kick">Question ${r.i + 1} of ${r.items.length}</span><span class="tag">${it.depth === 'literal' ? 'In the words' : 'Between the lines'}</span></div>
    <p class="prompt">${esc(it.prompt)}</p><div class="opts">${opts}</div>${fb}</div>`;
}

function rAnswer(i) {
  const r = S.run, it = r.items[r.i], k = kid(); if (r.state?.done) return;
  const ok = check(it, i); r.state = { done: true, ok, pick: i }; bumpDay(k, 'answers');
  if (ok) { r.right++; bumpDay(k, 'right'); sfx('right'); pay('answer'); setTimeout(() => { if (S.run === r && r.state?.ok) rNext(); }, 950); } else sfx('wrong');
  save(); render();
}
function rNext() {
  const r = S.run; r.i++; r.state = null;
  if (r.i < r.items.length) return render();
  const k = kid(), p = passage(r.id), id = 'rd-' + p.id, rec = (k.stops[id] ||= { passed: false, best: 0, tries: 0 });
  r.phase = 'done'; rec.tries++; rec.best = Math.max(rec.best, r.right); rec.at = Date.now();
  k.reading[p.id] = { ...(k.reading[p.id] || {}), read: true, at: Date.now() };
  bumpDay(k, 'pages'); k.last = { what: 'read', title: p.title, at: Date.now() };
  if (r.right >= Math.ceil(r.items.length * 0.75) && !rec.passed) { rec.passed = true; taught(k, id); pay('stop'); mark('stop', `Read “${p.title}”`); sfx('finish'); }
  save(); render(); checkMedals(); render();
}

export function wordCard() {
  const c = S.wordcard; if (!c) return '';
  const e = c.entry;
  return `<div class="wordcard" role="dialog" aria-label="${esc(c.raw)}"><div class="card stack">
    <div class="row" style="justify-content:space-between"><h3>${esc(e ? e.w : c.raw)}</h3><button class="ib" data-act="word-close" aria-label="Close">${icon('close')}</button></div>
    ${e ? `<div class="row"><span class="say">${esc(e.say)}</span><span class="tag">${esc(e.ps)}</span>${btn('Hear it', 'sayword', { arg: e.w, ic: 'speaker', cls: 'ghost small' })}</div>
    <p style="margin:0;font-size:16.5px">${esc(e.def)}</p>${e.etym ? `<p class="note" style="margin:0"><b>Where it comes from:</b> ${esc(e.etym)}</p>` : e.origin ? `<p class="note" style="margin:0"><b>From</b> ${esc(e.origin)}</p>` : ''}
    ${e.hint ? `<p class="note" style="margin:0"><b>Remember it:</b> ${esc(e.hint)}</p>` : ''}<p class="source" style="margin:0">From Bizzing Bee’s word list · in your word bank now</p>`
    : `<p style="margin:0">This word is not in our dictionary yet. Ask a grown-up, or try reading the sentence around it.</p>`}</div></div>`;
}

export function showWord(raw, from) {
  const e = lookup(raw); S.wordcard = { raw, entry: e };
  if (e && kid()) { addToBank(kid(), e.w, from || ''); save(); checkMedals(); }
}

let reading = null;
export const READ_ACTIONS = {
  'read-questions': () => { stopVoice(); S.run.phase = 'questions'; S.run.i = 0; S.run.right = 0; S.run.state = null; render(); },
  'read-again': () => { S.run.phase = 'read'; render(); },
  'read-look': () => { S.run.phase = 'read'; render(); },
  rpick: (a) => rAnswer(+a),
  rnext: () => rNext(),
  word: (a) => { showWord(a, S.run?.id); render(); sayWord(S.wordcard.entry?.w || a); },
  'word-close': () => { S.wordcard = null; render(); },
  sayword: (a) => sayWord(a),
  lookup: () => { const v = document.querySelector('#lk')?.value.trim(); if (v) { showWord(v, S.run?.id); render(); } },
  readalong: () => {
    const r = S.run; if (!r || r.mode !== 'read') return;
    if (r.reading) { stopVoice(); r.reading = false; duck(false); render(); return; }
    const t = passageText(r.id)?.text || ''; r.reading = true; duck(true); render();
    const starts = []; t.replace(/[A-Za-z][A-Za-z'’-]*/g, (m, i) => { starts.push(i); return m; });
    speak(t.replace(/\n\s*\n/g, '\n'), {
      onWord: (ci) => { let n = 0; while (n + 1 < starts.length && starts[n + 1] <= ci) n++; document.querySelectorAll('.passage span.now').forEach((x) => x.classList.remove('now')); document.querySelector(`.passage span[data-n="${n}"]`)?.classList.add('now'); },
      onEnd: () => { r.reading = false; duck(false); document.querySelectorAll('.passage span.now').forEach((x) => x.classList.remove('now')); },
    });
  },
};
export function readKey(e) {
  const r = S.run; if (!r || r.mode !== 'read' || r.phase !== 'questions') return false;
  if (r.state?.done) { if (e.key === 'Enter' && !r.state.ok) { rNext(); return true; } return false; }
  if (/^[1-9]$/.test(e.key) && +e.key <= r.items[r.i].options.length) { rAnswer(+e.key - 1); return true; }
  return false;
}
export { levelOf, readingStop };
