/* inkwell-more.js — the agency's other rooms: Quill's Training Desk (handover C §2.1.8a: a case's own English exercises
   at the child's tier, offered between chapters and never blocking; a later-day Word Hoard question), the Word Hoard book
   (the six detectives §3) and Detective School (C §2.1.6: Timeline — Plot Line's mechanic; Who Wrote This? — Who Said It?'s;
   Clue Spotter, the one timed drill in Inkwell, from cases already solved). Rules: detective.js step('desk'),
   detective-season.js (originDue, answerOrigin, hoardBook), detective-school.js (rounds, judging, pay). */

import { S, kid, save, render, pay, isDark, confetti } from '../app.js';
import { esc, icon, pageHead } from '../ui.js';
import * as D from '../detective.js';
import * as SE from '../detective-season.js';
import * as SC from '../detective-school.js';
import { loadCase } from '../detective-data.js';
import { PERSONAS, personaById } from '../data/inkwell-personas.js';
import { sfx } from '../sound.js';
import { onHidden } from '../stage.js';
import { act, say, sayBox, pt } from './inkwell-case.js';
import { sticker, figure, plateBg, WASH, matVars } from './inkwell-kit.js';

const I = () => S.ink;
const stageWrap = ({ cls, plate = 'agency', wash, l, r, title, chip, main, back = { label: 'Agency', href: '#/inkwell' }, head }) =>
  pageHead({ title: head || title, back }) + `<section class="stg ink ${cls}" data-inkfit style="--ink-plate:${plateBg(plate, isDark(), wash || WASH.agency)};${matVars()}">
  <header class="stg-hud"><div class="stg-pod stg-l"><b>${l.v}</b><small>${esc(l.l)}</small></div><div class="stg-mid"><h2 class="stg-title">${esc(title)}</h2>${chip ? `<span class="lvtag">${chip}</span>` : ''}</div><div class="stg-pod stg-r"><b>${r.v}</b><small>${esc(r.l)}</small></div></header>
  <div class="ink-main" data-stage-main>${main}</div>${sayBox()}</section>`;

/* ---------- open ---------- */
export async function openMore(view, id, sub) {
  const s = I(); s.say = null;
  if (view === 'desk') {
    const c = id ? (s.cases.find((x) => x.id === id) || (await loadCase(id))) : null;
    s.c = c; s.cs = c ? SE.caseOf(kid(), c) : null; s.dk = { i: 0, seq: [] };
  } else if (view === 'hoard') { s.hp = id || SE.inkOf(kid()).persona || PERSONAS[0].id; s.hflip = null; }
  else if (view === 'school') { s.sch = null; if (id) await startDrill(id); }
}
export function leaveMore() { const s = I(); if (s?.sch?.stopT) { clearInterval(s.sch.stopT); s.sch.unhide?.(); } }
export function moreView() { const s = I(); return s.view === 'desk' ? deskView() : s.view === 'hoard' ? hoardView() : schoolView(); }

/* ---------- Quill's Training Desk ---------- */
function deskItemsNow() { const s = I(); return s.c && s.cs ? D.deskItems(s.c, s.cs, SE.englishLevelOf(kid())) : []; }
function deskView() {
  const s = I(), k = kid(), items = deskItemsNow(), due = SE.originDue(k), all = [...items.map((x) => ({ kind: 'x', x })), ...due.map((card) => ({ kind: 'o', card }))];
  const i = Math.min(s.dk.i, Math.max(0, all.length - 1)), cur = all[i], done = items.filter((x) => x.done).length;
  const tabs = all.map((a, j) => `<button class="dk-tab${j === i ? ' on' : ''}${a.kind === 'x' && a.x.done ? ' done' : ''}" data-act="ink-dk-go" data-arg="${j}" aria-label="Exercise ${j + 1}${a.kind === 'x' && a.x.done ? ', done' : ''}">${a.kind === 'x' && a.x.done ? icon('check') : j + 1}</button>`).join('');
  let body = '';
  if (!s.c) body = `<p class="dk-empty">Open a case first. Its Training Desk fills as you read.</p>`;
  else if (!s.cs) body = `<p class="dk-empty">Start ${esc(s.c.title)} first. The desk fills with exercises from its documents as you go.</p>`;
  else if (!cur) body = `<p class="dk-empty">Nothing on the desk yet. Finish a chapter and Quill will leave exercises here, made from its documents.</p>`;
  else if (cur.kind === 'x') {
    const x = cur.x, order = Array.isArray(x.answer), seq = s.dk.seq;
    const opts = order ? x.options.map((o, j) => { const n = seq.indexOf(o); return `<button class="btn out dk-opt${n >= 0 ? ' on' : ''}" data-act="ink-dk-ord" data-arg="${j}"${x.done ? ' disabled' : ''}><b>${n >= 0 ? n + 1 : '·'}</b><span>${esc(pt(o))}</span></button>`; }).join('') + (x.done ? '' : `<button class="btn ink-go" data-act="ink-dk-check"${seq.length === x.options.length ? '' : ' aria-disabled="true"'}>${icon('check')}<span>Check the order</span></button>`)
      : x.options.map((o, j) => `<button class="btn out dk-opt${x.done && String(o) === String(x.answer) ? ' right' : ''}" data-act="ink-dk-ans" data-arg="${j}"${x.done ? ' disabled' : ''}><b>${j + 1}</b><span>${esc(pt(o))}</span></button>`).join('');
    body = `<article class="dk-paper"><small class="dk-type">${esc(String(x.type).replace(/-/g, ' '))}</small><p class="dk-prompt">${esc(pt(x.prompt))}</p><div class="dk-opts${order ? ' order' : ''}">${opts}</div>${x.done ? `<p class="dk-ok">${icon('check')}<span>${esc(pt(x.explain || 'Right.'))}</span></p>` : ''}</article>`;
  } else {
    const card = cur.card;
    body = `<article class="dk-paper origin"><small class="dk-type">A word from your Word Hoard, on a later day</small><p class="dk-prompt">${esc(card.question.prompt)}</p><div class="dk-opts">${card.question.options.map((o, j) => `<button class="btn out dk-opt" data-act="ink-dk-org" data-arg="${j}"><b>${j + 1}</b><span>${esc(o)}</span></button>`).join('')}</div></article>`;
  }
  const main = `<div class="tdesk" data-play><div class="dk-quill">${sticker('quill-think', { alt: 'Quill', fallback: 'Q' })}<p>${esc(s.c ? `Exercises from ${s.c.title}, at your level. They never hold up the case. Each one right first time earns a coin and a drop of ink.` : 'My Training Desk.')}</p></div>
    ${all.length ? `<nav class="dk-tabs" aria-label="Exercises">${tabs}</nav>` : ''}${body}
    ${s.c && s.cs && !s.cs.solved ? `<a class="btn out small dk-back" href="#/inkwell/case/${s.c.id}">${icon('back')}<span>Back to the case</span></a>` : ''}</div>`;
  return stageWrap({ cls: 'ink-tdesk', plate: 'agency', l: { v: `${done}/${items.length}`, l: 'done' }, r: { v: s.cs?.ink ?? '—', l: 'ink' }, title: 'Quill’s Training Desk', chip: s.c ? `${esc(s.c.title)} · your tier: ${esc(D.deskTier(s.c, SE.englishLevelOf(kid())) || '—')}` : '', main, back: s.c ? { label: s.cs?.solved ? 'Agency' : 'The case', href: s.cs?.solved || !s.cs ? '#/inkwell' : `#/inkwell/case/${s.c.id}` } : undefined });
}
function deskAnswer(x, answer) {
  const s = I(), r = act({ type: 'desk', x: x.id, answer }); if (!r.ok) { say(r.say?.text); return render(); }
  if (r.right) { sfx('right'); say(r.explain || 'Right.', { tone: 'gold' }); s.dk.seq = []; }
  else { sfx('wrong'); say(r.explain, { hold: true }); s.dk.seq = []; }
  render();
}

/* ---------- the Word Hoard ---------- */
function hoardView() {
  const s = I(), k = kid(), pid = s.hp, p = personaById(pid), book = SE.hoardBook(k, pid), got = book.filter((x) => !x.empty).length;
  const tabs = PERSONAS.map((x) => `<button class="hb-tab${x.id === pid ? ' on' : ''}" data-act="ink-hb" data-arg="${x.id}" aria-pressed="${x.id === pid}">${sticker(`emb-${x.id}`, { alt: '', fallback: esc(x.name[0]) })}<span>${esc(x.name)}</span></button>`).join('');
  const slots = book.map((x) => x.empty ? `<div class="hb-slot empty"><small>Case ${esc(String(+x.case.slice(-2)))}</small></div>`
    : `<button class="hb-slot${s.hflip === x.id ? ' flip' : ''}" data-act="ink-hflip" data-arg="${x.id}"><b>${esc(x.word)}</b><ol>${(x.path || []).map((y) => `<li>${esc(y)}</li>`).join('')}</ol>${s.hflip === x.id ? `<p>${esc(x.story || x.line || '')}</p>${x.askFamily ? '<em>Ask your family.</em>' : ''}` : ''}</button>`).join('');
  const main = `<div class="hoard" data-play><nav class="hb-tabs" aria-label="Detectives">${tabs}</nav><div class="hb-book"><div class="hb-grid">${slots}</div></div><p class="hb-note">${esc(p ? `${p.name}’s Word Hoard fills only while ${p.name} is played. Every word came from somewhere.` : '')}</p></div>`;
  return stageWrap({ cls: 'ink-hoard', l: { v: got, l: 'of 12' }, r: { v: Object.values(SE.inkOf(k).hoard).reduce((a, b) => a + b.length, 0), l: 'in all' }, title: 'The Word Hoard', chip: p ? esc(p.name) : '', main });
}

/* ---------- Detective School ---------- */
const DRILLS = [
  { id: 'timeline', name: 'Timeline', what: 'Put a real story’s scenes in order, by its time words.', ic: 'clock' },
  { id: 'who', name: 'Who Wrote This?', what: 'Read a line. Whose words are they? Decide by the language, not by memory.', ic: 'quote' },
  { id: 'spotter', name: 'Clue Spotter', what: 'Sixty seconds: tap the clue words in a document from a case you have solved.', ic: 'search' },
];
const recOf = (id) => { const sc = SE.inkOf(kid()).school; return (sc[id] ||= { level: 1, pick: null, plays: 0 }); };
const lvOf = (id) => { const r = recOf(id); return r.pick ?? r.level ?? 1; };
async function startDrill(id) {
  const s = I(), k = kid(), L = lvOf(id), seed = `${k.id}:${id}:${recOf(id).plays}`;
  const sch = { id, i: 0, results: [], coins: 0, state: null, over: false, items: [] };
  if (id === 'timeline') {
    const [{ loadPassages, shippable }, { BOOKS, loadBook }, { WORKS }] = await Promise.all([import('../reading.js'), import('../book.js'), import('../data/library.js')]);
    const T = await loadPassages(), passages = Object.values(T || {}).filter(shippable);
    const bs = await Promise.all(BOOKS.map((b) => loadBook(b.id))), chapters = BOOKS.flatMap((b, i) => (bs[i]?.chapters || []).map((c) => ({ book: b.id, n: c.n, short: b.short, band: b.band, scenes: c.scenes || [] })));
    const solvedDrills = s.cases.filter((c) => SE.inkOf(k).closed[c.id]).map((c) => SC.caseDrill(c)).filter((d) => d && d.kind === 'timeline').map((d) => ({ title: d.title, cards: d.items[0].cards.map((t) => ({ text: t, at: d.items[0].answer.indexOf(t) })) }));
    const rounds = SC.timelineRound({ passages, works: WORKS, chapters }, seed, L, { n: 3, mem: recOf(id).mem, now: Date.now() });
    sch.items = [...solvedDrills.slice(0, 1), ...rounds].slice(0, 3).map((q) => ({ kind: 'order', title: q.title, cards: q.cards, line: [] }));
  } else if (id === 'who') {
    const [{ shippedLines, cleared, work }, { WORKS }, { MORE_LINES }] = await Promise.all([import('../reading.js'), import('../data/library.js'), import('../data/lines-more.js')]);
    const lines = [...shippedLines(), ...MORE_LINES.filter((l) => cleared(work(l.work)))];
    sch.items = SC.whoRound({ lines, works: WORKS }, seed, L, { n: 5 }).map((q) => ({ kind: 'who', ...q }));
  } else if (id === 'spotter') {
    const solved = Object.keys(SE.inkOf(k).closed);
    sch.items = SC.spotterRound(s.cases, solved, seed, L, 3).map((x) => ({ kind: 'spot', ...x, marked: [] }));
    sch.left = SC.SPOTTER_MS; sch.last = Date.now(); sch.paused = false;
    if (sch.items.length) {
      sch.stopT = setInterval(() => { const x = I()?.sch; if (!x || x.over || x.paused || x.state) return; const now = Date.now(); x.left -= now - x.last; x.last = now; if (x.left <= 0) { x.left = 0; spotJudge(); } else { const b = document.querySelector('.stg-time i'); if (b) b.style.width = `${(x.left / SC.SPOTTER_MS) * 100}%`; const t = document.querySelector('[data-hud=r] b'); if (t) t.textContent = Math.ceil(x.left / 1000); } }, 250);
      sch.unhide = onHidden(() => { const x = I()?.sch; if (x) { x.paused = true; } }, () => { const x = I()?.sch; if (x) { x.paused = false; x.last = Date.now(); } });
    }
  }
  s.sch = sch;
}
function finishDrill() {
  const s = I(), x = s.sch, r = recOf(x.id), right = x.results.filter((y) => y.ok).length, pct = x.results.length ? right / x.results.length : 0;
  x.over = true; if (x.stopT) { clearInterval(x.stopT); x.unhide?.(); }
  r.plays = (r.plays || 0) + 1; const before = lvOf(x.id); if (r.pick == null) r.level = SC.nextLevel(r.level || 1, pct); else r.pick = null;
  for (const e of SC.drillPay(x.results, `Detective School: ${DRILLS.find((d) => d.id === x.id).name}`)) x.coins += pay(e.ev, e.what) || 0;
  x.levelLine = r.level < before ? SE.DROP_LINE(r.level) : r.level > before ? `Level ${r.level} next time.` : `Level ${r.level} again next time.`;
  save(); sfx('finish'); if (pct >= 0.8) confetti();
}
function spotJudge() {
  const s = I(), x = s.sch, it = x.items[x.i]; if (!it || x.state) return;
  const j = SC.spotterJudge(it, it.marked); x.state = j; x.results.push({ ok: j.perfect || j.score >= Math.ceil(j.max / 2), first: true });
  sfx(j.perfect ? 'right' : 'wrong'); render();
}
function schoolView() {
  const s = I(), x = s.sch;
  if (!x) {
    const solved = Object.keys(SE.inkOf(kid()).closed).length;
    const tiles = DRILLS.map((d) => `<article class="chalk"><h3>${icon(d.ic)}<span>${esc(d.name)}</span></h3><p>${esc(d.what)}</p><div class="ch-lv" role="radiogroup" aria-label="${esc(d.name)} level">${[1, 2, 3, 4, 5].map((n) => `<button class="lvc-b${lvOf(d.id) === n ? ' on' : ''}" role="radio" aria-checked="${lvOf(d.id) === n}" data-act="ink-sl" data-arg="${d.id}:${n}">${n}</button>`).join('')}</div>
      ${d.id === 'spotter' && !solved ? '<p class="muted">Solve a case first: the spotter uses only cases you have solved.</p>' : `<a class="btn ink-go" href="#/inkwell/school/${d.id}">${icon('play')}<span>Start</span></a>`}</article>`).join('');
    return stageWrap({ cls: 'ink-school', l: { v: DRILLS.reduce((a, d) => a + (recOf(d.id).plays || 0), 0), l: 'drills' }, r: { v: solved, l: 'solved' }, title: 'Detective School', chip: 'Practise the moves before a case', main: `<div class="school" data-play><div class="chalks">${tiles}</div></div>` });
  }
  const D0 = DRILLS.find((d) => d.id === x.id), it = x.items[x.i];
  if (!x.items.length) return stageWrap({ cls: 'ink-school', l: { v: lvOf(x.id), l: 'level' }, r: { v: '—', l: '' }, title: D0.name, main: `<div class="school" data-play><p class="dk-empty">Nothing to practise here yet. ${x.id === 'spotter' ? 'Solve a case first.' : ''}</p><a class="btn out" href="#/inkwell/school">${icon('back')}<span>Detective School</span></a></div>`, back: { label: 'Detective School', href: '#/inkwell/school' } });
  if (x.over) {
    const right = x.results.filter((y) => y.ok).length;
    return stageWrap({ cls: 'ink-school', l: { v: right, l: 'right' }, r: { v: x.coins, l: 'coins' }, title: D0.name, chip: `Level ${lvOf(x.id)}`, back: { label: 'Detective School', href: '#/inkwell/school' },
      main: `<div class="school sch-end" data-play><p class="sch-big">${right} of ${x.results.length}</p><p>${esc(x.levelLine || '')}</p><p class="sv-coins">${icon('coin')}<b>${x.coins}</b><span>coins</span></p><div class="row"><button class="btn ink-go" data-act="ink-sagain" data-arg="${x.id}">${icon('play')}<span>Again</span></button><a class="btn out" href="#/inkwell/school">${icon('back')}<span>Detective School</span></a></div></div>` });
  }
  let main = '';
  if (it.kind === 'order') {
    const placed = new Set(it.line), st2 = x.state;
    main = `<div class="school sch-order" data-play><p class="prompt">${esc(it.title || 'Put the scenes in order')}</p><ol class="so-line">${it.cards.map((_, j) => { const ci = it.line[j]; return `<li class="${ci != null ? 'full' : ''}${st2 ? (ci != null && it.cards[ci].at === j ? ' ok' : ' no') : ''}">${ci != null ? `<button data-act="ink-so-un" data-arg="${j}"${st2 ? ' disabled' : ''}>${esc(it.cards[ci].text)}</button>` : `<i>${j + 1}</i>`}</li>`; }).join('')}</ol>
      <div class="so-pile">${it.cards.map((c, j) => placed.has(j) ? '' : `<button class="btn out so-card" data-act="ink-so" data-arg="${j}"><span>${esc(c.text)}</span></button>`).join('')}</div>
      ${st2 && !st2.ok ? `<div class="so-right"><b>The story’s own order:</b><ol>${it.cards.slice().sort((a, b) => a.at - b.at).map((c) => `<li>${esc(c.text)}</li>`).join('')}</ol></div>` : ''}${st2 ? `<button class="btn ink-go" data-act="ink-snext">${icon('next')}<span>Next</span></button>` : ''}</div>`;
  } else if (it.kind === 'who') {
    const st2 = x.state;
    main = `<div class="school sch-who" data-play><blockquote class="sw-line">${esc(it.text)}</blockquote><p class="prompt">Whose words are these?</p><div class="dk-opts">${it.options.map((o, j) => `<button class="btn out dk-opt${st2 && j === it.answer ? ' right' : ''}${st2 && st2.pick === j && j !== it.answer ? ' wrong' : ''}" data-act="ink-sw" data-arg="${j}"${st2 ? ' disabled' : ''}><b>${j + 1}</b><span>${esc(o)}</span></button>`).join('')}</div>
      ${st2 ? `<div class="sw-after">${st2.ok ? `<p>${icon('check')} ${esc(it.right)}, in ${esc(it.work)}.</p>` : `<p>It was ${esc(it.right)}, in ${esc(it.work)}.</p>${it.compare ? `<p class="muted">Another line by the same hand, to compare:</p><blockquote>${esc(it.compare)}</blockquote>` : ''}`}<button class="btn ink-go" data-act="ink-snext">${icon('next')}<span>Next</span></button></div>` : ''}</div>`;
  } else {
    const st2 = x.state, marked = new Set(it.marked), clueW = new Set(Object.values(it.spans).flat()), missedW = st2 ? new Set(st2.missed.flatMap((sp) => it.spans[sp])) : null;
    const lines = []; let cur = -1; for (const w of it.words) { if (w.line !== cur) { lines.push([]); cur = w.line; } lines[lines.length - 1].push(`<button class="sp-w${marked.has(w.i) ? ' mk' : ''}${st2 && missedW.has(w.i) ? ' missed' : ''}${st2 && marked.has(w.i) && !clueW.has(w.i) ? ' extra' : ''}" data-act="ink-sp" data-arg="${w.i}"${st2 ? ' disabled' : ''}>${esc(w.t)}</button>`); }
    main = `<div class="school sch-spot" data-play><p class="prompt">${esc(it.title)}: tap the clue words</p><article class="paper sp-paper"><div class="pp-body">${lines.map((l) => `<p>${l.join(' ')}</p>`).join('')}</div></article>
      ${st2 ? `<p class="sp-res">${st2.found.length} of ${st2.max} clues found${st2.extra ? `, ${st2.extra} extra` : ''}.</p><button class="btn ink-go" data-act="ink-snext">${icon('next')}<span>Next</span></button>` : `<button class="btn ink-go" data-act="ink-spdone">${icon('check')}<span>Done</span></button>`}</div>`;
  }
  const timer = x.id === 'spotter' ? `<div class="stg-time" role="progressbar" aria-label="Time left"><i style="width:${(x.left / SC.SPOTTER_MS) * 100}%"></i></div>` : '';
  return stageWrap({ cls: `ink-school ${timer ? 'timed' : ''}`, l: { v: `${x.i + 1}/${x.items.length}`, l: 'item' }, r: x.id === 'spotter' ? { v: Math.ceil(x.left / 1000), l: 'seconds' } : { v: x.results.filter((y) => y.ok).length, l: 'right' }, title: D0.name, chip: `Level ${lvOf(x.id)}`, main: timer + main, back: { label: 'Detective School', href: '#/inkwell/school' } });
}
function schoolNext() { const s = I(), x = s.sch; x.state = null; x.i++; if (x.i >= x.items.length) finishDrill(); else if (x.id === 'spotter') x.last = Date.now(); render(); }

/* ---------- actions and keys ---------- */
export const MORE_ACTIONS = {
  'ink-dk-go': (j) => { const s = I(); s.dk.i = +j; s.dk.seq = []; s.say = null; render(); },
  'ink-dk-ans': (j) => { const x = deskItemsNow()[I().dk.i]; if (x) deskAnswer(x, x.options[+j]); },
  'ink-dk-ord': (j) => { const s = I(), x = deskItemsNow()[s.dk.i]; if (!x) return; const o = x.options[+j]; s.dk.seq = s.dk.seq.includes(o) ? s.dk.seq.filter((y) => y !== o) : [...s.dk.seq, o]; sfx('tap'); render(); },
  'ink-dk-check': () => { const s = I(), x = deskItemsNow()[s.dk.i]; if (x && s.dk.seq.length === x.options.length) deskAnswer(x, s.dk.seq); },
  'ink-dk-org': (j) => { const s = I(), k = kid(), items = deskItemsNow(), card = SE.originDue(k)[s.dk.i - items.length]; if (!card) return; const r = SE.answerOrigin(k, card.id, card.question.options[+j]);
    if (r?.right) { for (const e of r.events || []) pay(e.ev, e.what); sfx('right'); say(r.explain || 'Right.', { tone: 'gold' }); } else { sfx('wrong'); say(r?.explain || 'Not quite.', { hold: true }); } save(); render(); },
  'ink-hb': (id) => { I().hp = id; I().hflip = null; render(); },
  'ink-hflip': (id) => { I().hflip = I().hflip === id ? null : id; render(); },
  'ink-sl': (arg) => { const [id, n] = arg.split(':'); recOf(id).pick = +n; save(); render(); },
  'ink-sagain': (id) => { startDrill(id).then(render); },
  'ink-snext': () => schoolNext(),
  'ink-so': (j) => { const s = I(), it = s.sch.items[s.sch.i]; if (s.sch.state) return; const at = it.line.findIndex((v) => v == null); const line = it.line.slice(); while (line.length < it.cards.length) line.push(null); const k2 = line.indexOf(null); line[k2] = +j; it.line = line; sfx('tap');
    if (!line.includes(null)) { const ok = line.every((ci, p) => it.cards[ci].at === p); s.sch.state = { ok }; s.sch.results.push({ ok, first: true }); sfx(ok ? 'right' : 'wrong'); } void at; render(); },
  'ink-so-un': (p) => { const s = I(), it = s.sch.items[s.sch.i]; if (s.sch.state) return; it.line[+p] = null; render(); },
  'ink-sw': (j) => { const s = I(), it = s.sch.items[s.sch.i]; if (s.sch.state) return; const ok = +j === it.answer; s.sch.state = { ok, pick: +j }; s.sch.results.push({ ok, first: true }); sfx(ok ? 'right' : 'wrong'); render(); },
  'ink-sp': (i) => { const s = I(), it = s.sch.items[s.sch.i]; if (s.sch.state) return; i = +i; it.marked = it.marked.includes(i) ? it.marked.filter((y) => y !== i) : [...it.marked, i]; sfx('tap'); render(); },
  'ink-spdone': () => spotJudge(),
};
export function moreKey(e) {
  const s = I(), k = e.key;
  if (s.say?.hold && (k === 'Enter' || k === ' ' || k === 'Escape')) { s.say = null; render(); return true; }
  if (s.view === 'desk' && /^[1-6]$/.test(k)) { const b = document.querySelectorAll('.dk-opt')[+k - 1]; if (b && !b.disabled) { b.click(); return true; } }
  if (s.view === 'desk' && (k === 'ArrowRight' || k === 'ArrowLeft')) { const n = document.querySelectorAll('.dk-tab').length; if (n) { s.dk.i = Math.max(0, Math.min(n - 1, s.dk.i + (k === 'ArrowRight' ? 1 : -1))); s.dk.seq = []; s.say = null; render(); return true; } }
  if (s.view === 'school' && s.sch && !s.sch.over) {
    if (/^[1-9]$/.test(k)) { const b = document.querySelectorAll('.sch-who .dk-opt, .so-pile .so-card')[+k - 1]; if (b && !b.disabled) { b.click(); return true; } }
    if (k === 'Enter' && s.sch.state && !/^(BUTTON|A)$/.test(e.target.tagName)) { schoolNext(); return true; }
  }
  return false;
}
