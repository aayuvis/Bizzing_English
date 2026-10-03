/* play.js — the games (FAMILY-STANDARD §14): a title card, a three-second how-to, a BOARD painted in
   its world's style (the world's plate behind a framed play area, a track of the round, the child's
   avatar and Quill on the board), motion and sound on every answer, music, a finish screen naming
   what was practised, the score, the best, the accuracy, the level change and ONE next step — a route
   to the stop that teaches what was missed most — keyboard AND touch, and a score built on the
   learning decision, never luck. The rules live in games.js as pure reducers. */

import { S, kid, save, render, pay, checkMedals, isDark, confetti } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { builderNew, builderStep, rushNew, rushStep, whoRound, figureRound, quizNew, quizStep, plotRound, plotNew, plotStep, forgeRound, duelRound, duelNew, duelStep,
  nextLevel, accuracy, mostMissed, ROUND_MS, MAX_LEVEL } from '../games.js';
import { FIGURES } from '../data/literature.js';
import { RHETORIC } from '../data/language.js';
import { PLAIN, DEVICE_GLOSS } from '../data/duel.js';
import * as WP from '../data/wordparts.js';
import { cleared } from '../data/rights.js';
import { shippedLines, loadPassages, shippable } from '../reading.js';
import { loadLexicon } from '../lexicon.js';
import { WORKS, PASSAGES } from '../data/library.js';
import { stopById } from '../curriculum.js';
import { plate } from '../worlds.js';
import { sfx, music, stopMusic } from '../sound.js';
import { bumpDay } from '../model.js';
import { avatarOf } from './pages.js';

const LV = (a) => Object.fromEntries(a.map((t, i) => [i + 1, t]));
export const GAMES = {
  builder: { name: 'Sentence Builder', world: 'scriptorium', music: 'games-sentence', timed: true, practises: 'main and dependent clauses, in both orders', how: 'Tap the three parts in an order that makes a sentence. Build it the other way round next time for a bonus.', keys: '1 2 3 pick · Backspace undo',
    levels: LV(['short sentences, first-band words', 'longer clauses from the second band', 'every band, starting a little further along', 'longer sentences from the start', 'the longest clauses first']) },
  rush: { name: 'Punctuation Rush', world: 'study', music: 'games-sentence', timed: true, practises: 'where commas go — lists, openings, names and asides', how: 'Tap every gap that needs a comma, then Enter. Right commas score; wrong ones cost a point.', keys: '← → move · Space comma · Enter next',
    levels: LV(['one comma a sentence', 'one comma, then a few with two', 'one comma, then lists and asides', 'mostly two commas or more', 'lists and asides first']) },
  figure: { name: 'Figure Hunt', world: 'lakeside', music: 'games-word', practises: 'similes, metaphors, personification and alliteration in real lines', how: 'Read the line from a classic. Which figure of speech is it — or is it none?', keys: '1–5 choose · Enter next',
    levels: LV(['simile, alliteration or none', 'metaphor joins in', 'all five, evenly', 'more metaphor and personification', 'the subtle ones, mostly']) },
  who: { name: 'Who Said It?', world: 'playhouse', music: 'games-reading', practises: 'famous lines from the books in the Library', how: 'Read the line. Who said it — or wrote it?', keys: '1–4 choose · Enter next',
    levels: LV(['famous lines from children’s books', 'poems, plays and novels join in', 'every shelf; rivals from the same shelf', 'rivals from the same author’s books', 'poems, plays, essays and speeches']) },
  plot: { name: 'Plot Line', world: 'garden', music: 'games-reading', practises: 'the order of events in a story', how: 'Each card opens a scene of one story. Tap them in the order they happen.', keys: '1–5 place · ← → choose · Enter place · Backspace undo',
    levels: LV(['four scenes from first stories', 'four scenes, longer stories', 'five scenes', 'five scenes from the oldest books', 'five scenes, the hardest stories']) },
  root: { name: 'Root Forge', world: 'scriptorium', music: 'games-word', practises: 'prefixes, suffixes and roots that make real words', how: 'One word part and four pieces. Forge the one that makes a real word.', keys: '1–4 forge · Enter next',
    levels: LV(['first prefixes and endings', 'more prefixes and endings', 'every prefix and ending', 'Latin roots join in', 'mostly roots and harder parts']) },
  duel: { name: 'Rhetoric Duel', world: 'forum', music: 'games-sentence', practises: 'why a sentence is strong — the devices great writers use', how: 'Two versions of one sentence. Pick the stronger — then say why. The reason scores.', keys: '1 2 pick · 1–4 why · Enter next',
    levels: LV(['alliteration and questions', 'groups of three and repeated openings', 'every device', 'every device, longer lines', 'antithesis and the hardest lines']) },
};
const ROUND_OF = { who: 8, figure: 10, plot: 4, root: 10, duel: 8 };

/* the one next step: the stop that teaches what was missed most (or, for a clean round, the next stop up) */
const NEXT = {
  builder: { clause: 's4-combine', clean: 's6-join' },
  rush: { list: 's5-comma', fronted: 's5-comma', address: 's5-comma', yesno: 's5-comma', compound: 's5-comma', aside: 's6-fold', clean: 's6-fold' },
  figure: { simile: 'li5-simile', metaphor: 'li5-simile', none: 'li5-simile', personification: 'li5-sound', alliteration: 'li5-sound', clean: 'la7-devices' },
  root: { prefix: 'w3-make', suffix: 'w4-make', root: 'w5-find', clean: 'w6-build' },
  duel: { anaphora: 'la7-devices', tricolon: 'la7-devices', alliteration: 'la7-devices', 'rhetorical question': 'la7-devices', antithesis: 'la7-antithesis', clean: 'la7-antithesis' },
  plot: { clean: 'li1-problem' },
  who: { clean: 'li7-genre' },
};
export function nextStepFor(id, g) {
  const m = mostMissed(g), stop = (sid, why) => ({ href: `#/stop/${sid}`, label: stopById(sid)?.title || sid, why });
  if (id === 'plot' && m) { const p = PASSAGES.find((x) => x.id === m); return { href: `#/story/${m}`, label: `Hear “${p?.title || 'the story'}” told`, why: 'the story whose order slipped most' }; }
  if (id === 'who' && m) { const w = WORKS.find((x) => x.id === m), p = PASSAGES.find((x) => x.work === m && shippable(x)); return p ? { href: `#/story/${p.id}`, label: `Read “${p.title}”`, why: `from ${w?.title || 'the book'} — the line you missed` } : { href: `#/book/${m}`, label: w?.title || 'The book', why: 'the line you missed' }; }
  const sid = (m && NEXT[id][m]) || NEXT[id].clean;
  return stop(sid, m ? 'it teaches what you missed most' : 'a clean round — the next thing up');
}

export function playView() {
  const k = kid();
  return pageHead({ title: 'Play', sub: 'games where the learning is the game' }) + `<div class="grid3" style="margin:0 20px">${Object.entries(GAMES).map(([id, g]) => { const rec = k.games[id]; return `<a class="card gcard" href="#/play/${id}" style="text-decoration:none;color:inherit;padding:0;overflow:hidden">
    <div style="height:120px;background:url('${plate({ id: g.world }, isDark(), true)}') center/cover"></div><div style="padding:14px 16px"><h3>${esc(g.name)}</h3><p class="muted" style="margin:0 0 6px">Practises ${esc(g.practises)}.</p>
    <div class="row" style="gap:6px">${rec?.best != null ? `<span class="tag ok">${icon('star')}Your best: ${rec.best}</span>` : `<span class="tag">New</span>`}<span class="tag">Level ${rec?.level || 1}</span></div></div></a>`; }).join('')}</div>`;
}

let timer = null, adv = null;
const stopTimer = () => { if (timer) clearInterval(timer); timer = null; if (adv) clearTimeout(adv); adv = null; };
export function openGame(id) { stopTimer(); S.run = { mode: 'game', id, phase: 'title', g: null }; }
export function leaveGame() { stopTimer(); stopMusic(); }
const levelOf = (id) => Math.max(1, Math.min(MAX_LEVEL, kid().games[id]?.level || 1));

async function startGame() {
  stopTimer();
  const r = S.run, k = kid(), seed = `${k.id}:${Date.now()}`, id = r.id, L = levelOf(id), gm = GAMES[id];
  r.level = L; r.err = null;
  if (id === 'builder' || id === 'rush') {
    r.g = id === 'builder' ? builderNew(seed, L) : rushNew(seed, L); r.phase = 'play';
    music(gm.music);
    let last = performance.now();
    timer = setInterval(() => { const now = performance.now(); step({ type: 'tick', dt: now - last }); last = now; }, 250);
    return render();
  }
  let g = null;
  if (id === 'figure') g = quizNew('figure', figureRound(FIGURES.filter((f) => cleared(WORKS.find((w) => w.id === f.work))), WORKS, seed, L, ROUND_OF.figure), L);
  else if (id === 'who') g = quizNew('who', whoRound(shippedLines(), WORKS, seed, L, ROUND_OF.who), L);
  else if (id === 'duel') g = duelNew(duelRound(RHETORIC.filter((x) => cleared(WORKS.find((w) => w.id === x.work))), PLAIN, seed, L, ROUND_OF.duel), L);
  else if (id === 'plot') { const T = await loadPassages(); g = plotNew(plotRound(Object.values(T || {}).filter(shippable), seed, L, ROUND_OF.plot, WORKS), L); }
  else if (id === 'root') { const lx = await loadLexicon(); if (!lx) { r.err = 'Bee’s word list did not load. Check the connection and try again.'; return render(); } g = quizNew('root', forgeRound(lx, WP, seed, L, ROUND_OF.root), L); }
  if (S.run !== r) return;
  if (!g || g.over) { r.err = 'This game has nothing to play just now.'; return render(); }
  r.g = g; r.phase = 'play'; music(gm.music); render();
}

/* motion on every answer: the frame pops or shakes, a "+N" flies up, the combo bumps. Added after the
   render, so it plays once per answer; CSS stills it under reduced motion, the device's "Reduce
   motion" (html.still) and Calm mode (no confetti). */
function juice(fx) {
  if (!fx) return;
  sfx(fx.ok ? 'right' : 'wrong');
  requestAnimationFrame(() => {
    const f = document.querySelector('.gb-frame'); if (!f) return;
    f.classList.add(fx.ok ? 'gb-ok' : 'gb-no');
    if (fx.ok && fx.gain > 0) { const s = document.createElement('span'); s.className = 'gb-fly'; s.setAttribute('aria-hidden', 'true'); s.textContent = `+${fx.gain}`; f.appendChild(s); setTimeout(() => s.remove(), 950); }
    if (fx.combo) document.querySelector('.gb-combo')?.classList.add('gb-bump');
  });
}

function step(a) {
  const r = S.run; if (!r?.g || r.g.over) return;
  const before = r.g;
  r.g = r.g.kind === 'builder' ? builderStep(r.g, a) : rushStep(r.g, a);
  if (r.g.over) return finish();
  if (a.type === 'tick') {
    const left = ROUND_MS - r.g.t, el = document.querySelector('.gb-bar .time'), bar = document.querySelector('.gb-time i');
    if (el) el.textContent = Math.ceil(left / 1000) + 's'; if (bar) bar.style.width = `${(100 * left) / ROUND_MS}%`;
    return;
  }
  render();
  if (r.g.seq !== before.seq) juice(r.g.flash);
}

const REDUCE = { figure: quizStep, who: quizStep, root: quizStep, plot: plotStep, duel: duelStep };
function act(a) {
  const r = S.run; if (!r?.g || r.g.over || r.phase !== 'play') return;
  const before = r.g, g = (r.g = REDUCE[r.g.kind](r.g, a));
  if (g === before) return;
  if (g.over) return finish();
  render();
  if (g.seq !== before.seq) {
    if (g.kind === 'duel' && g.stage === 'why' && before.stage === 'which') return juice({ ok: g.which.ok, gain: 0 });
    juice(g.state);
    if (g.state?.ok) { const seq = g.seq; if (adv) clearTimeout(adv); adv = setTimeout(() => { adv = null; if (S.run === r && r.g?.seq === seq && r.g.state) act({ type: 'next' }); }, g.kind === 'plot' ? 1600 : 1100); }
  }
}

function finish() {
  stopTimer(); stopMusic();
  const r = S.run, k = kid(), g = r.g, rec = (k.games[r.id] ||= { best: 0, plays: 0 });
  rec.plays = (rec.plays || 0) + 1; const newBest = g.score > (rec.best || 0); rec.best = Math.max(rec.best || 0, g.score);
  const acc = accuracy(g), before = Math.max(1, rec.level || 1), enough = acc.total >= (GAMES[r.id].timed ? 4 : 1);
  rec.level = nextLevel(before, enough ? acc.pct : null);
  r.result = { acc, before, after: rec.level, next: nextStepFor(r.id, g), bestCombo: g.bestCombo || 0 };
  const right = acc.right;
  for (let i = 0; i < Math.min(right, 10); i++) pay('answer');
  bumpDay(k, 'right', right); bumpDay(k, 'answers', acc.total);
  const unit = { builder: 'sentences', rush: 'commas', figure: 'figures', who: 'lines', plot: 'pairs in order', root: 'words forged', duel: 'reasons' }[r.id];
  k.last = { what: 'game', title: GAMES[r.id].name, right: `${right} ${unit}`, at: Date.now() };
  r.phase = 'done'; r.newBest = newBest; sfx('finish'); save(); render(); if (newBest) confetti(); checkMedals(); render();
}

/* ---------- the board ---------- */
function pips(g, n) {
  const res = g.results || [];
  return `<div class="gb-pips" role="img" aria-label="${res.length} of ${n} done">${Array.from({ length: n }, (_, i) => `<i class="pip${i < res.length ? (res[i] ? ' ok' : ' no') : i === g.i ? ' cur' : ''}"></i>`).join('')}</div>`;
}
function board(id, g, body) {
  const gm = GAMES[id], k = kid(), timed = gm.timed, last = timed ? g.flash : g.kind === 'duel' && !g.state ? g.which : g.state;
  const pose = last ? (last.ok ? 'cheer' : 'think') : 'point';
  const track = timed ? `<div class="gb-time"><i style="width:${(100 * (ROUND_MS - g.t)) / ROUND_MS}%"></i></div><span class="time" aria-label="seconds left">${Math.ceil((ROUND_MS - g.t) / 1000)}s</span>`
    : pips(g, g.rounds.length);
  return `<div class="gboard" data-game="${id}" style="--plate:url('${plate({ id: gm.world }, isDark())}')">
    <div class="gb-bar"><img class="gb-ava" src="${avatarOf(k)}" alt="">${track}
      <span class="gb-combo${g.combo >= 2 ? ' on' : ''}" aria-live="polite">${g.combo >= 2 ? `${g.combo} in a row` : ''}</span>
      <span class="gb-score"><b>${g.score}</b><small>points</small></span></div>
    <div class="gb-frame">${body}</div>
    <div class="gb-foot"><img class="gb-quill" src="${mascot(pose)}" alt=""><span class="gb-level"><b>Level ${g.level}</b> · ${esc(gm.levels[g.level])}</span></div></div>`;
}

export function gameView() {
  const r = S.run, gm = GAMES[r?.id]; if (!gm) return empty('oops', 'That game is not here.', link('Play', '#/play'));
  const id = r.id, k = kid(), rec = k.games[id] || {}, L = levelOf(id);
  const head = pageHead({ title: gm.name, sub: `practises ${gm.practises}`, back: { label: 'Play', href: '#/play' } });
  if (r.phase === 'title') return head + `<div class="game"><div class="card titlecard"><div class="plate" style="background-image:url('${plate({ id: gm.world }, isDark())}')"><img class="gb-ava" src="${avatarOf(k)}" alt=""><img class="tc-quill" src="${mascot('wave')}" alt=""></div>
    <h2>${esc(gm.name)}</h2><p style="margin:0;max-width:52ch">${esc(gm.how)}</p><p class="note" style="margin:0">Keys: ${esc(gm.keys)} — or just tap.</p>
    <p class="gb-level" style="margin:0"><b>Level ${L}</b> · ${esc(gm.levels[L])}${rec.best != null ? ` · your best ${rec.best}` : ''}</p>
    ${r.err ? `<p class="note" role="alert">${esc(r.err)}</p>` : ''}${btn('Start', 'game-start', { ic: 'next' })}</div></div>`;
  const g = r.g;
  if (r.phase === 'done') return head + doneView(id, g, r);
  return head + `<div class="game">${board(id, g, bodyOf(id, g))}</div>`;
}

function doneView(id, g, r) {
  const gm = GAMES[id], res = r.result, pct = res.acc.pct == null ? '—' : `${Math.round(res.acc.pct * 100)}%`;
  const what = { builder: `${g.built} sentences built, ${g.variety} turned round`, rush: `${g.right} commas placed, ${g.clean} sentences perfect`, figure: `${g.right} of ${g.rounds.length} figures spotted`,
    who: `${g.right} of ${g.rounds.length} lines matched`, plot: `${g.right} of ${g.total} pairs in order, ${g.perfect} stories perfect`, root: `${g.right} of ${g.rounds.length} real words forged`, duel: `${g.right} of ${g.rounds.length} reasons right (${g.strongRight} stronger versions spotted)` }[id];
  const lv = res.after > res.before ? `Level ${res.before} → ${res.after}: up a level — ${gm.levels[res.after]}.` : res.after < res.before ? `Level ${res.before} → ${res.after}: one step back to steady it — ${gm.levels[res.after]}.` : `Level ${res.after} stays — ${gm.levels[res.after]}. 80% moves you up.`;
  const nx = res.next;
  return `<div class="game"><div class="gboard gb-done" data-game="${id}" style="--plate:url('${plate({ id: gm.world }, isDark())}')"><div class="gb-frame finish stack">
    <img src="${mascot('cheer')}" alt=""><div class="score">${g.score}</div><p style="margin:0">${esc(what)}.</p>
    <div class="gb-stats"><span><b>${g.score}</b><small>score</small></span><span><b>${kid().games[id].best}</b><small>${r.newBest ? 'a new best' : 'your best'}</small></span><span><b>${pct}</b><small>accuracy</small></span><span><b>${res.bestCombo}</b><small>most in a row</small></span></div>
    <p class="note" style="margin:0">You practised ${esc(gm.practises)}.</p><p class="gb-lvchange" style="margin:0">${esc(lv)}</p>
    <a class="gb-next card" href="${esc(nx.href)}" data-next>${icon('path')}<span><small>Your next step — ${esc(nx.why)}</small><b>${esc(nx.label)}</b></span>${icon('next')}</a>
    <div class="row" style="justify-content:center">${btn('Play again', 'game-start', { ic: 'undo' })}${link('All games', '#/play', { cls: 'out', ic: 'play' })}</div></div></div></div>`;
}

const opt = (act, i, label, st, answer, extra = '') => `<button class="opt${st ? (i === answer ? ' right' : st.pick === i ? ' wrong' : '') : ''}" data-act="${act}" data-arg="${i}" ${st ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${label}</span>${extra}</button>`;
const fb = (st, title, body, nextAct = 'q-next') => (st ? `<div class="feedback ${st.ok ? 'ok' : 'no'}" role="status"><div class="hd">${icon(st.ok ? 'check' : 'cross')}${esc(title)}</div><div>${body}</div>${st.ok ? '' : btn('Next', nextAct, { ic: 'next' })}</div>` : '');

function bodyOf(id, g) {
  if (g.kind === 'builder') {
    const c = g.cur, fl = g.flash ? `<div class="feedback ${g.flash.ok ? 'ok' : 'no'}" role="status"><div class="hd">${icon(g.flash.ok ? 'check' : 'cross')}${g.flash.ok ? (g.flash.bonus ? 'Built — the other way round! +1' : 'Right!') : 'Not quite'}</div><div>${esc(g.flash.text)}</div></div>` : '';
    return `<p class="prompt">Build one sentence from these three parts.</p>
      <div class="built">${g.picks.map((i, j) => `<span class="tile${j === g.picks.length - 1 ? ' gb-slide' : ''}">${esc(c.tiles[i].text)}</span>`).join('') || '<span class="muted">tap a part to start</span>'}</div>
      <div class="tiles">${c.tiles.map((t, i) => `<button class="tile" data-act="b-pick" data-arg="${i}" ${g.picks.includes(i) ? 'disabled' : ''}><kbd style="font:700 12px var(--mono);opacity:.6;margin-right:6px">${i + 1}</kbd>${esc(t.text)}</button>`).join('')}</div>
      <div class="row">${btn('Undo', 'b-undo', { ic: 'undo', cls: 'out', dis: !g.picks.length })}</div>${fl}`;
  }
  if (g.kind === 'rush') {
    const c = g.cur, fl = g.flash ? `<div class="feedback ${g.flash.ok ? 'ok' : 'no'}" role="status"><div class="hd">${icon(g.flash.ok ? 'check' : 'cross')}${g.flash.ok ? 'Right!' : 'Not quite — here it is'}</div><div>${esc(g.flash.text)}</div></div>` : '';
    return `<p class="prompt">Tap every gap that needs a comma.</p>
      <div class="sent">${c.words.map((w, i) => `<span class="word">${esc(w)}</span>${i < c.words.length - 1 ? `<button class="gap${g.sel.includes(i) ? ' on' : ''}${g.cursor === i ? ' cursor' : ''}${g.sel.includes(i) && g.cursor === i ? ' gb-glow' : ''}" data-act="r-gap" data-arg="${i}" aria-pressed="${g.sel.includes(i)}" aria-label="gap after ${esc(w)}">${g.sel.includes(i) ? ',' : ''}</button>` : ''}`).join('')}</div>
      <div class="row">${btn('Next sentence', 'r-submit', { ic: 'next' })}</div>${fl}`;
  }
  const q = g.rounds[g.i], st = g.state;
  if (g.kind === 'figure') {
    const kind = q.kinds[q.answer], name = q.options[q.answer], gloss = { simile: 'compares two things using “like” or “as”', metaphor: 'says one thing IS another', personification: 'gives a thing or an idea a person’s actions or feelings', alliteration: 'repeats the first sound of words close together', none: 'says it plainly — no figure at all' }[kind];
    return `<blockquote class="prompt big" style="margin:0">“${esc(q.text)}”</blockquote><p class="subp">${esc(q.work)} — which figure of speech?</p>
      <div class="opts">${q.options.map((o, i) => opt('q-pick', i, esc(o), st, q.answer)).join('')}</div>${fb(st, st?.ok ? 'Right!' : `It is ${name.toLowerCase()}`, `${esc(name)}: it ${esc(gloss)}.`)}`;
  }
  if (g.kind === 'who') {
    return `<blockquote class="prompt big" style="margin:0">“${esc(q.text)}”</blockquote><p class="subp">Who said it — or wrote it?</p>
      <div class="opts">${q.options.map((o, i) => opt('q-pick', i, esc(o), st, q.answer)).join('')}</div>${fb(st, st?.ok ? 'Right!' : 'Not this time', `${esc(q.right)}${q.work ? `, ${esc(q.work)}` : ''}.`)}`;
  }
  if (g.kind === 'root') {
    const piece = st ? q.options[st.pick] : '?', aff = (x) => `<span class="gb-aff${st ? (st.ok ? ' ok' : ' no') : ''}">${esc(x)}</span>`, base = `<span class="gb-base">${esc(q.base)}</span>`;
    return `<p class="prompt">${q.kind === 'root' ? `The root “${esc(q.base)}” means “${esc(q.meaning)}”. Which piece forges a real word?` : `Which ${q.before ? 'prefix' : 'ending'} makes a real word with “${esc(q.base)}”?`}</p>
      <div class="gb-forge${st?.ok ? ' gb-fused' : ''}">${q.before ? aff(piece.replace(/-$/, '')) + base : base + aff(piece.replace(/^-/, ''))}</div>
      <div class="opts four">${q.options.map((o, i) => opt('q-pick', i, esc(o), st, q.answer)).join('')}</div>
      ${fb(st, st?.ok ? `Forged: ${q.word}` : 'No such word in Bee’s list', `${st && !st.ok ? `“${esc(q.options[st.pick].replace(/-/g, ''))}” and “${esc(q.base)}” make no word in the list. The real one is <b>${esc(q.word)}</b>. ` : ''}${q.def ? `<b>${esc(q.word)}</b>${q.ps ? ` (${esc(q.ps)})` : ''}: ${esc(q.def)}.` : ''}`)}`;
  }
  if (g.kind === 'plot') {
    const n = q.cards.length, done = !!st;
    const slots = Array.from({ length: n }, (_, j) => { const c = g.line[j]; const good = done && j > 0 && q.cards[c].at === q.cards[g.line[j - 1]].at + 1;
      return `<li class="gb-slot${c != null ? ' full' : ''}${done ? (good || (j === 0 && q.cards[c].at === 0) ? ' ok' : ' no') : ''}${c != null && j === g.line.length - 1 && !done ? ' gb-slide' : ''}"><b>${j + 1}</b><span>${c != null ? esc(q.cards[c].text) : ''}</span>${done ? `<small>scene ${q.cards[c].at + 1}</small>` : ''}</li>`; }).join('');
    const cards = q.cards.map((c, i) => g.line.includes(i) ? '' : `<button class="tile gb-card${g.cursor === i ? ' cursor' : ''}" data-act="pl-place" data-arg="${i}"><kbd>${i + 1}</kbd><span>${esc(c.text)}</span></button>`).join('');
    return `<p class="prompt">${esc(q.title)}: tap the scenes in the order they happen.</p><ol class="gb-line">${slots}</ol>
      ${done ? '' : `<div class="gb-cards">${cards}</div><div class="row">${btn('Undo', 'pl-undo', { ic: 'undo', cls: 'out', dis: !g.line.length })}</div>`}
      ${fb(st, st?.ok ? 'In order — every scene!' : `${st?.pairs} of ${st?.max} pairs in order`, st ? `Each card is the first sentence of a scene in “${esc(q.title)}”. The small number is where it really comes.` : '')}`;
  }
  if (g.kind === 'duel') {
    const w = g.which, wt = WORKS.find((x) => x.id === q.work);
    const vers = q.versions.map((v, i) => `<button class="gb-version${w ? (i === q.strong ? ' right' : w.pick === i ? ' wrong' : '') : ''}" data-act="du-pick" data-arg="${i}" ${w ? 'disabled' : ''}><kbd>${i + 1}</kbd><span class="gb-vtext">${esc(v)}</span>
      ${w ? `<small>${i === q.strong ? `The original — ${esc(wt?.author || '')}, ${esc(wt?.title || '')}` : 'A plainer version, written for this game'}</small>` : ''}</button>`).join('');
    return `<p class="prompt">${w ? 'Why is the original stronger?' : 'Which version is stronger?'}</p><div class="gb-duel">${vers}</div>
      ${w ? `<p class="subp">${w.ok ? 'Yes — that one is the original.' : 'The other one is the original.'} Now the part that scores: why?</p>
      <div class="opts">${q.options.map((o, i) => opt('q-pick', i, `${esc(o)} <small class="muted">— ${esc(DEVICE_GLOSS[o] || '')}</small>`, st, q.answer)).join('')}</div>` : ''}
      ${fb(st, st?.ok ? `Right — ${q.device}` : `It is ${q.device}`, `${esc(q.device.charAt(0).toUpperCase() + q.device.slice(1))}: ${esc(DEVICE_GLOSS[q.device] || '')}.`)}`;
  }
  return '';
}

export const PLAY_ACTIONS = {
  'game-start': () => startGame(),
  'b-pick': (a) => { sfx('tap'); step({ type: 'pick', i: +a }); },
  'b-undo': () => step({ type: 'undo' }),
  'r-gap': (a) => { sfx('tap'); step({ type: 'toggle', i: +a }); },
  'r-submit': () => step({ type: 'submit' }),
  'q-pick': (a) => act({ type: 'pick', i: +a }),
  'q-next': () => act({ type: 'next' }),
  'pl-place': (a) => { sfx('tap'); act({ type: 'place', i: +a }); },
  'pl-undo': () => act({ type: 'undo' }),
  'du-pick': (a) => act({ type: 'pick', i: +a }),
  // the old names, kept for links and tests written before the reducers
  'who-pick': (a) => act({ type: 'pick', i: +a }), 'fig-pick': (a) => act({ type: 'pick', i: +a }), 'who-next': () => act({ type: 'next' }),
};

export function playKey(e) {
  const r = S.run; if (!r || r.mode !== 'game' || r.phase !== 'play' || !r.g) return false;
  const g = r.g;
  if (g.kind === 'builder') { if (/^[1-3]$/.test(e.key)) { step({ type: 'pick', i: +e.key - 1 }); return true; } if (e.key === 'Backspace') { step({ type: 'undo' }); return true; } return false; }
  if (g.kind === 'rush') {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { step({ type: 'move', d: e.key === 'ArrowRight' ? 1 : -1 }); return true; }
    if (e.key === ' ') { step({ type: 'toggle', i: g.cursor }); return true; }
    if (e.key === 'Enter') { step({ type: 'submit' }); return true; }
    return false;
  }
  if (g.state && !g.state.ok) { if (e.key === 'Enter') { act({ type: 'next' }); return true; } return false; }
  if (g.state) return false;
  if (g.kind === 'plot') {
    const n = g.rounds[g.i].cards.length;
    if (new RegExp(`^[1-${n}]$`).test(e.key)) { act({ type: 'place', i: +e.key - 1 }); return true; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') { act({ type: 'move', d: e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1 }); return true; }
    if (e.key === 'Enter' || e.key === ' ') { act({ type: 'place', i: g.cursor }); return true; }
    if (e.key === 'Backspace') { act({ type: 'undo' }); return true; }
    return false;
  }
  const n = g.kind === 'duel' && g.stage === 'which' ? 2 : g.rounds[g.i].options.length;
  if (new RegExp(`^[1-${n}]$`).test(e.key)) { act({ type: 'pick', i: +e.key - 1 }); return true; }
  return false;
}
