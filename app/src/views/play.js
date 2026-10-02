/* play.js — the games (FAMILY-STANDARD §14): a title card, a three-second how-to, painted art from
   its world, motion and sound on every answer, music, a finish screen naming what was practised and
   the child's best, keyboard AND touch, and a score built on the learning decision — never luck. */

import { S, kid, save, render, pay, checkMedals, isDark } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { builderNew, builderStep, rushNew, rushStep, whoRound, ROUND_MS } from '../games.js';
import { shippedLines } from '../reading.js';
import { WORKS } from '../data/library.js';
import { plate } from '../worlds.js';
import { sfx, music, stopMusic } from '../sound.js';
import { bumpDay } from '../model.js';

export const GAMES = {
  builder: { name: 'Sentence Builder', world: 'scriptorium', practises: 'main and dependent clauses, in both orders', how: 'Tap the three parts in an order that makes a sentence. Build it the other way round next time for a bonus.', keys: '1 2 3 pick · Backspace undo' },
  rush: { name: 'Punctuation Rush', world: 'study', practises: 'where commas go — lists, openings, names and asides', how: 'Tap every gap that needs a comma, then Enter. Right commas score; wrong ones cost a point.', keys: '← → move · Space comma · Enter next' },
  who: { name: 'Who Said It?', world: 'playhouse', practises: 'famous lines from the books in the Library', how: 'Read the line. Who said it — or wrote it?', keys: '1–4 choose' },
};

export function playView() {
  const k = kid();
  return pageHead({ title: 'Play', sub: 'games where the learning is the game' }) + `<div class="grid3" style="margin:0 20px">${Object.entries(GAMES).map(([id, g]) => `<a class="card" href="#/play/${id}" style="text-decoration:none;color:inherit;padding:0;overflow:hidden">
    <div style="height:120px;background:url('${plate({ id: g.world }, isDark(), true)}') center/cover"></div><div style="padding:14px 16px"><h3>${esc(g.name)}</h3><p class="muted" style="margin:0 0 6px">Practises ${esc(g.practises)}.</p>
    ${k.games[id]?.best != null ? `<span class="tag ok">${icon('star')}Your best: ${k.games[id].best}</span>` : `<span class="tag">New</span>`}</div></a>`).join('')}</div>`;
}

let timer = null;
const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };
export function openGame(id) { stopTimer(); S.run = { mode: 'game', id, phase: 'title', g: null }; }
export function leaveGame() { stopTimer(); stopMusic(); }

function startGame() {
  const r = S.run, k = kid(), seed = `${k.id}:${Date.now()}`;
  r.phase = 'play';
  if (r.id === 'who') { r.g = { kind: 'who', rounds: whoRound(shippedLines(), WORKS, seed), i: 0, score: 0, state: null }; music('games'); return render(); }
  r.g = r.id === 'builder' ? builderNew(seed, k.band) : rushNew(seed, k.band);
  music('games');
  let last = performance.now();
  timer = setInterval(() => { const now = performance.now(); step({ type: 'tick', dt: now - last }); last = now; }, 250);
  render();
}

function step(a) {
  const r = S.run; if (!r?.g || r.g.over) return;
  const before = r.g;
  r.g = r.g.kind === 'builder' ? builderStep(r.g, a) : rushStep(r.g, a);
  if (r.g.flash !== before.flash && r.g.flash) sfx(r.g.flash.ok ? 'right' : 'wrong');
  if (r.g.over) return finish();
  if (a.type === 'tick') { const el = document.querySelector('.gamehud .time'); if (el) el.textContent = Math.ceil((ROUND_MS - r.g.t) / 1000) + 's'; return; }
  render();
}

function finish() {
  stopTimer(); stopMusic();
  const r = S.run, k = kid(), g = r.g, rec = (k.games[r.id] ||= { best: 0, plays: 0 });
  rec.plays++; const newBest = g.score > (rec.best || 0); rec.best = Math.max(rec.best || 0, g.score);
  const right = g.kind === 'builder' ? g.built : g.kind === 'rush' ? g.right : g.score;
  for (let i = 0; i < Math.min(right, 10); i++) pay('answer');
  bumpDay(k, 'right', right); bumpDay(k, 'answers', right);
  k.last = { what: 'game', title: GAMES[r.id].name, right: g.kind === 'builder' ? `${g.built} sentences` : g.kind === 'rush' ? `${g.right} commas` : `${g.score} lines`, at: Date.now() };
  r.phase = 'done'; r.newBest = newBest; sfx('finish'); save(); render(); checkMedals(); render();
}

export function gameView() {
  const r = S.run, gm = GAMES[r?.id]; if (!gm) return empty('oops', 'That game is not here.', link('Play', '#/play'));
  const head = pageHead({ title: gm.name, sub: `practises ${gm.practises}`, back: { label: 'Play', href: '#/play' } });
  if (r.phase === 'title') return head + `<div class="game"><div class="card titlecard"><div class="plate" style="background-image:url('${plate({ id: gm.world }, isDark())}')"></div>
    <h2>${esc(gm.name)}</h2><p style="margin:0;max-width:52ch">${esc(gm.how)}</p><p class="note" style="margin:0">Keys: ${esc(gm.keys)} — or just tap.</p>${btn('Start', 'game-start', { ic: 'next' })}</div></div>`;
  const g = r.g;
  if (r.phase === 'done') {
    const what = g.kind === 'builder' ? `${g.built} sentences built, ${g.variety} turned round` : g.kind === 'rush' ? `${g.right} commas placed, ${g.clean} sentences perfect` : `${g.score} of ${g.rounds.length} lines matched`;
    return head + `<div class="game"><div class="card finish stack pop"><img src="${mascot('cheer')}" alt=""><div class="score">${g.score}</div><p>${esc(what)}.</p><p class="note">You practised ${esc(gm.practises)}. Your best: ${kid().games[r.id].best}${r.newBest ? ' — a new best' : ''}.</p>
      <div class="row" style="justify-content:center">${btn('Play again', 'game-start', { ic: 'undo' })}${link('All games', '#/play', { cls: 'out', ic: 'play' })}</div></div></div>`;
  }
  if (g.kind === 'who') {
    const q = g.rounds[g.i], st = g.state;
    return head + `<div class="game"><div class="gamehud"><span>Line ${g.i + 1} of ${g.rounds.length}</span><span>Score ${g.score}</span></div>
      <div class="card item"><blockquote class="prompt big" style="margin:0">“${esc(q.text)}”</blockquote><p class="subp">Who said it — or wrote it?</p>
      <div class="opts">${q.options.map((o, i) => `<button class="opt${st ? (i === q.answer ? ' right' : st.pick === i ? ' wrong' : '') : ''}" data-act="who-pick" data-arg="${i}" ${st ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>
      ${st ? `<div class="feedback ${st.ok ? 'ok pop' : 'no'}"><div class="hd">${icon(st.ok ? 'check' : 'cross')}${st.ok ? 'Right!' : 'Not this time'}</div><div>${esc(q.right)}${q.work ? `, ${esc(q.work)}` : ''}.</div>${st.ok ? '' : btn('Next', 'who-next', { ic: 'next' })}</div>` : ''}</div></div>`;
  }
  const hud = `<div class="gamehud"><span>Score ${g.score}</span><span class="time" aria-label="seconds left">${Math.ceil((ROUND_MS - g.t) / 1000)}s</span></div>`;
  const fl = g.flash ? `<div class="feedback ${g.flash.ok ? 'ok pop' : 'no shake'}" role="status"><div class="hd">${icon(g.flash.ok ? 'check' : 'cross')}${g.flash.ok ? (g.kind === 'builder' && g.flash.bonus ? 'Built — the other way round! +1' : 'Right!') : 'Not quite'}</div><div>${esc(g.flash.text)}</div></div>` : '';
  if (g.kind === 'builder') {
    const c = g.cur;
    return head + `<div class="game">${hud}<div class="card item"><p class="prompt">Build one sentence from these three parts.</p>
      <div class="built">${g.picks.map((i) => `<span class="tile">${esc(c.tiles[i].text)}</span>`).join('')}</div>
      <div class="tiles">${c.tiles.map((t, i) => `<button class="tile" data-act="b-pick" data-arg="${i}" ${g.picks.includes(i) ? 'disabled' : ''}><kbd style="font:700 12px var(--mono);opacity:.6;margin-right:6px">${i + 1}</kbd>${esc(t.text)}</button>`).join('')}</div>
      <div class="row">${btn('Undo', 'b-undo', { ic: 'undo', cls: 'out', dis: !g.picks.length })}</div>${fl}</div></div>`;
  }
  const c = g.cur;
  return head + `<div class="game">${hud}<div class="card item"><p class="prompt">Tap every gap that needs a comma.</p>
    <div class="sent">${c.words.map((w, i) => `<span class="word">${esc(w)}</span>${i < c.words.length - 1 ? `<button class="gap${g.sel.includes(i) ? ' on' : ''}${g.cursor === i ? ' cursor' : ''}" data-act="r-gap" data-arg="${i}" aria-pressed="${g.sel.includes(i)}" aria-label="gap after ${esc(w)}">${g.sel.includes(i) ? ',' : ''}</button>` : ''}`).join('')}</div>
    <div class="row">${btn('Next sentence', 'r-submit', { ic: 'next' })}</div>${fl}</div></div>`;
}

export const PLAY_ACTIONS = {
  'game-start': () => startGame(),
  'b-pick': (a) => { sfx('tap'); step({ type: 'pick', i: +a }); },
  'b-undo': () => step({ type: 'undo' }),
  'r-gap': (a) => { sfx('tap'); step({ type: 'toggle', i: +a }); },
  'r-submit': () => step({ type: 'submit' }),
  'who-pick': (a) => { const g = S.run.g, q = g.rounds[g.i]; if (g.state) return; const ok = +a === q.answer; g.state = { pick: +a, ok }; if (ok) { g.score++; sfx('right'); setTimeout(() => { if (S.run?.g === g && g.state?.ok) whoNext(); }, 1100); } else sfx('wrong'); render(); },
  'who-next': () => whoNext(),
};
function whoNext() { const g = S.run.g; g.i++; g.state = null; if (g.i >= g.rounds.length) { g.over = true; finish(); } else render(); }

export function playKey(e) {
  const r = S.run; if (!r || r.mode !== 'game' || r.phase !== 'play') return false;
  const g = r.g;
  if (g.kind === 'who') { if (/^[1-4]$/.test(e.key) && !g.state) { PLAY_ACTIONS['who-pick'](+e.key - 1); return true; } if (e.key === 'Enter' && g.state && !g.state.ok) { whoNext(); return true; } return false; }
  if (g.kind === 'builder') { if (/^[1-3]$/.test(e.key)) { step({ type: 'pick', i: +e.key - 1 }); return true; } if (e.key === 'Backspace') { step({ type: 'undo' }); return true; } return false; }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { step({ type: 'move', d: e.key === 'ArrowRight' ? 1 : -1 }); return true; }
  if (e.key === ' ') { step({ type: 'toggle', i: g.cursor }); return true; }
  if (e.key === 'Enter') { step({ type: 'submit' }); return true; }
  return false;
}
