/* play.js — the games (FAMILY-STANDARD §14): a title card with the level map (five levels, each with
   the stars won) and what is new to the child; a three-second how-to; a RUN of three rounds and a final
   on a BOARD painted in its world's style (the world's plate behind a framed play area, a track of the
   round, the child's avatar and Quill); motion and sound on every answer; music; a finish naming what
   was practised, the run's stars, the score, the best, the accuracy, the new items met, the level change
   and ONE next step — a route to the stop that teaches what was missed most. Keyboard AND touch (and a
   drag for Plot Line), and a score built on the learning decision, never luck. The rules and the memory
   live in games.js as pure functions; this file loads the pools (the big ones lazily) and draws. */

import { S, kid, save, render, pay, checkMedals, isDark, confetti } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { builderNew, builderStep, rushNew, rushStep, whoRound, figureRound, figureStep, quizNew, quizStep, plotRound, plotNew, plotStep, forgeRound, forgeFamilyRound, duelRound, duelNew, duelStep, duelRival, duelTally,
  nextLevel, accuracy, mostMissed, starsFor, runNew, runAdd, runScore, runPct, isFinal, memOf, memRecord, memCounts, memDraw, roundLog, huntsFrom, huntable, figurePool, itemKey,
  builderLevelPool, rushLevelPool, whoLevelPool, plotPool, duelLevelPool, forgePools, FORGE_LEVELS, FIGURE_LEVELS, FIGURE_KINDS, HUNT_KINDS, ROUND_OF, ROUND_MS, MAX_LEVEL, RUN_ROUNDS, GAMES } from '../games.js';
import { FIGURES } from '../data/literature.js';
import { RHETORIC } from '../data/language.js';
import { PLAIN, DEVICE_GLOSS } from '../data/duel.js';
import { MORE_LINES } from '../data/lines-more.js';
import * as WP from '../data/wordparts.js';
import { cleared } from '../data/rights.js';
import { shippedLines, loadPassages, shippable } from '../reading.js';
import { loadLexicon } from '../lexicon.js';
import { BOOKS, loadBook, chapterKey, bookMeta } from '../book.js';
import { WORKS, PASSAGES } from '../data/library.js';
import { field, rivalArt } from '../contest.js';
import { stopById } from '../curriculum.js';
import { plate } from '../worlds.js';
import { sfx, music, stopMusic } from '../sound.js';
import { bumpDay } from '../model.js';
import { avatarOf } from './pages.js';

export { GAMES };

/* the one next step: the stop that teaches what was missed most (or, for a clean run, the next stop up) */
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
  if (id === 'plot' && m) {
    const ch = chapterKey(m); if (ch) { const b = bookMeta(ch.id); return { href: `#/whole/${ch.id}/${ch.n}`, label: `Hear ${b?.short || 'the book'}, chapter ${ch.n}, told`, why: 'the story whose order slipped most' }; }
    const p = PASSAGES.find((x) => x.id === m); return { href: `#/story/${m}`, label: `Hear “${p?.title || 'the story'}” told`, why: 'the story whose order slipped most' };
  }
  if (id === 'who' && m) { const w = WORKS.find((x) => x.id === m), p = PASSAGES.find((x) => x.work === m && shippable(x)); return p ? { href: `#/story/${p.id}`, label: `Read “${p.title}”`, why: `from ${w?.title || 'the book'} — the line you missed` } : { href: `#/book/${m}`, label: w?.title || 'The book', why: 'the line you missed' }; }
  const sid = (m && NEXT[id][m]) || NEXT[id].clean;
  return stop(sid, m ? 'it teaches what you missed most' : 'a clean run — the next thing up');
}

const starRow = (n, of = 3) => `<span class="gb-stars" role="img" aria-label="${n} of ${of} stars">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}">${icon('star')}</i>`).join('')}</span>`;
const levelStars = (rec, L) => (rec?.stars || {})[L] || 0;

export function playView() {
  const k = kid();
  return pageHead({ title: 'Play', sub: 'games where the learning is the game' }) + `<div class="grid3" style="margin:0 20px">${Object.entries(GAMES).map(([id, g]) => { const rec = k.games[id]; return `<a class="card gcard" href="#/play/${id}" style="text-decoration:none;color:inherit;padding:0;overflow:hidden">
    <div style="height:120px;background:url('${plate({ id: g.world }, isDark(), true)}') center/cover"></div><div style="padding:14px 16px"><h3>${esc(g.name)}</h3><p class="muted" style="margin:0 0 6px">Practises ${esc(g.practises)}.</p>
    <div class="row" style="gap:6px">${rec?.best > 0 ? `<span class="tag ok">${icon('star')}Your best: ${rec.best}</span>` : `<span class="tag">New</span>`}<span class="tag">Level ${rec?.level || 1}</span>${levelStars(rec, rec?.level || 1) ? starRow(levelStars(rec, rec?.level || 1)) : ''}</div></div></a>`; }).join('')}</div>`;
}

/* ---------- the pools: today's in the bundle, the big ones loaded when a game opens ---------- */
/* import.meta.glob so a pool file that is not there yet is simply absent (the build does not fail) */
const OPT = import.meta.glob(['../data/games/builder.json', '../data/games/rush.json', '../data/figures-more.js', '../data/rhetoric-more.js']);
const opt = (p) => (OPT[p] ? OPT[p]().then((m) => m).catch(() => null) : Promise.resolve(null));
const D = { extra: null, passages: null, chapters: null, lex: null, texts: new Map() };
async function extras() {
  if (D.extra) return D.extra;
  const [b, r, f, h] = await Promise.all([opt('../data/games/builder.json'), opt('../data/games/rush.json'), opt('../data/figures-more.js'), opt('../data/rhetoric-more.js')]);
  const list = (m) => (Array.isArray(m?.default) ? m.default : Array.isArray(m) ? m : []);
  return (D.extra = { builder: list(b), rush: list(r), figures: f?.FIGURES_MORE || [], rhetoric: h?.RHETORIC_MORE || [], plain: h?.PLAIN_MORE || {} });
}
const okWork = (id) => cleared(WORKS.find((w) => w.id === id));
const whoPool = () => [...shippedLines(), ...MORE_LINES.filter((l) => okWork(l.work))];
const figPool = () => [...FIGURES, ...(D.extra?.figures || [])].filter((f) => okWork(f.work));
const rhetPool = () => [...RHETORIC, ...(D.extra?.rhetoric || [])].filter((x) => okWork(x.work));
const plainPool = () => ({ ...PLAIN, ...(D.extra?.plain || {}) });
async function stories() {
  if (!D.passages) { const T = await loadPassages(); D.passages = Object.values(T || {}).filter(shippable); }
  if (!D.chapters) { const bs = await Promise.all(BOOKS.map((b) => loadBook(b.id))); D.chapters = BOOKS.flatMap((b, i) => (bs[i]?.chapters || []).map((c) => ({ book: b.id, n: c.n, short: b.short, band: b.band, scenes: c.scenes || [] }))); }
}
/* the held text of a work, for a passage hunt — fetched once, only for the works a round needs */
async function heldText(work) {
  if (D.texts.has(work)) return D.texts.get(work);
  const w = WORKS.find((x) => x.id === work), t = w?.file && okWork(work) ? await fetch(w.file).then((r) => (r.ok ? r.text() : '')).catch(() => '') : '';
  D.texts.set(work, t); return t;
}
async function huntsFor(seed, mem) {
  const cand = memDraw(figurePool(figPool()).filter((f) => huntable(f, WORKS)), (f) => itemKey('f', f.text), mem, 'hc:' + seed, 12);
  const works = []; for (const f of cand) if (!works.includes(f.work) && !D.texts.has(f.work) && works.length < 3) works.push(f.work);
  await Promise.all(works.map(heldText));
  return huntsFrom(figPool(), [...D.texts.entries()].filter(([, t]) => t).map(([work, text]) => ({ work, text })), WORKS);
}
async function prepare(id) {
  if (id === 'builder' || id === 'rush' || id === 'figure' || id === 'duel') await extras();
  if (id === 'plot') await stories();
  if (id === 'root' && !D.lex) D.lex = await loadLexicon();
}
/* the level's pool, as the title card counts it */
function levelPool(id, L) {
  const X = D.extra || {};
  if (id === 'builder') return { items: builderLevelPool(L, X.builder), key: (x) => x.key };
  if (id === 'rush') return { items: rushLevelPool(L, X.rush), key: (x) => x.key };
  if (id === 'who') return { items: whoLevelPool(whoPool(), WORKS, L), key: (x) => x.key };
  if (id === 'figure') return { items: figurePool(figPool()).filter((f) => FIGURE_LEVELS[L][f.figure]), key: (f) => itemKey('f', f.text) };
  if (id === 'plot') return D.passages ? { items: plotPool(D.passages, L, WORKS, D.chapters), key: (p) => p.key } : null;
  if (id === 'duel') return { items: duelLevelPool(rhetPool(), plainPool(), L), key: (r) => itemKey('d', r.text) };
  if (id === 'root' && D.lex) { const c = FORGE_LEVELS[L]; return { items: forgePools(D.lex, WP).filter((x) => (x.kind === 'root' ? c.roots > 0 : x.band <= c.cap && x.band >= (c.min || 1))), key: (x) => 'f:' + x.word }; }
  return null;
}

let timer = null, adv = null;
const stopTimer = () => { if (timer) clearInterval(timer); timer = null; if (adv) clearTimeout(adv); adv = null; };
const recOf = (id) => (kid().games[id] ||= { best: 0, plays: 0 });
const levelOf = (id) => Math.max(1, Math.min(MAX_LEVEL, kid().games[id]?.level || 1));
const topOf = (id) => Math.max(levelOf(id), Math.min(MAX_LEVEL, kid().games[id]?.top || 1));
export function openGame(id) {
  stopTimer(); if (!GAMES[id]) { S.run = { mode: 'game', id, phase: 'title' }; return; }
  const r = (S.run = { mode: 'game', id, phase: 'title', g: null, pick: levelOf(id), ready: false });
  prepare(id).then(() => { if (S.run !== r) return; r.ready = true; if (r.phase === 'title') render(); });
}
export function leaveGame() { stopTimer(); stopMusic(); }

function startRun() {
  const r = S.run; if (!r) return;
  r.run = runNew(r.pick || levelOf(r.id)); r.result = null; r.err = null;
  return startRound();
}
async function startRound() {
  stopTimer();
  const r = S.run, k = kid(), id = r.id, run = r.run, L = run.level, gm = GAMES[id], final = isFinal(run), seed = `${k.id}:${Date.now()}:${run.round}`;
  const o = { mem: memOf(k.games[id]), now: Date.now(), final };
  r.err = null; r.final = final;
  await prepare(id); if (S.run !== r) return;
  if (id === 'builder' || id === 'rush') {
    r.g = id === 'builder' ? builderNew(seed, L, { ...o, extra: D.extra?.builder }) : rushNew(seed, L, { ...o, extra: D.extra?.rush }); r.phase = 'play';
    music(gm.music);
    let last = performance.now();
    timer = setInterval(() => { const now = performance.now(); step({ type: 'tick', dt: now - last }); last = now; }, 250);
    return render();
  }
  let g = null;
  if (id === 'figure') { const ML = final ? Math.min(MAX_LEVEL, L + 1) : L, hunts = ML >= 3 ? await huntsFor(seed, o.mem) : []; if (S.run !== r) return; g = quizNew('figure', figureRound(figPool(), WORKS, seed, L, ROUND_OF.figure, { ...o, hunts }), L); }
  else if (id === 'who') g = quizNew('who', whoRound(whoPool(), WORKS, seed, L, ROUND_OF.who, o), L);
  else if (id === 'duel') {
    const rivals = field(k.band), rv = final ? rivals[rivals.length - 1] : rivals[run.round % Math.max(1, rivals.length - 1)], rounds = duelRound(rhetPool(), plainPool(), seed, L, ROUND_OF.duel, o);
    g = duelNew(rounds, L, rv ? { id: rv.id, name: rv.name, age: rv.age, tell: rv.tell, pts: duelRival(rv, seed, rounds.length) } : null);
  }
  else if (id === 'plot') g = plotNew(plotRound(D.passages || [], seed, L, ROUND_OF.plot, WORKS, { ...o, chapters: D.chapters || [] }), L);
  else if (id === 'root') { if (!D.lex) { r.err = 'Bee’s word list did not load. Check the connection and try again.'; r.phase = 'title'; return render(); } g = quizNew('root', final ? forgeFamilyRound(D.lex, WP, seed, L, 2, o) : forgeRound(D.lex, WP, seed, L, ROUND_OF.root, o), L); }
  if (S.run !== r) return;
  if (!g || g.over) { r.err = 'This game has nothing to play just now.'; r.phase = 'title'; return render(); }
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
  const r = S.run; if (!r?.g || r.g.over || r.phase !== 'play') return;
  const before = r.g;
  r.g = r.g.kind === 'builder' ? builderStep(r.g, a) : rushStep(r.g, a);
  if (r.g.over) return endRound();
  if (a.type === 'tick') {
    const left = ROUND_MS - r.g.t, el = document.querySelector('.gb-bar .time'), bar = document.querySelector('.gb-time i');
    if (el) el.textContent = Math.ceil(left / 1000) + 's'; if (bar) bar.style.width = `${(100 * left) / ROUND_MS}%`;
    return;
  }
  render();
  if (r.g.seq !== before.seq) juice(r.g.flash);
}

const REDUCE = { figure: figureStep, who: quizStep, root: quizStep, plot: plotStep, duel: duelStep };
function act(a) {
  const r = S.run; if (!r?.g || r.g.over || r.phase !== 'play') return;
  const before = r.g, g = (r.g = REDUCE[r.g.kind](r.g, a));
  if (g === before) return;
  if (g.over) return endRound();
  render();
  if (g.seq !== before.seq) {
    if (g.kind === 'duel' && g.stage === 'why' && before.stage === 'which') return juice({ ok: g.which.ok, gain: 0 });
    if (g.kind === 'figure' && g.spot && !before.spot) return juice(g.spot);
    juice(g.state);
    if (g.state?.ok) { const seq = g.seq; if (adv) clearTimeout(adv); adv = setTimeout(() => { adv = null; if (S.run === r && r.g?.seq === seq && r.g.state) act({ type: 'next' }); }, g.kind === 'plot' && g.rounds[g.i].type !== 'missing' ? 1600 : 1100); }
  }
}

const UNIT = { builder: 'sentences', rush: 'commas', figure: 'figures', who: 'lines', plot: 'scenes in order', root: 'words forged', duel: 'reasons' };
/* a round ends: its items go into the memory, its right answers are paid, and the run adds it up */
function endRound() {
  stopTimer();
  const r = S.run, k = kid(), g = r.g, rec = recOf(r.id), gm = GAMES[r.id], now = Date.now();
  const log = roundLog(g), had = rec.seen || {}, met = new Set(log.filter((x) => x.key && !had[x.key]).map((x) => x.key)).size;
  const mem = memRecord(memOf(rec), log, now); rec.seen = mem.seen; rec.rounds = mem.plays; rec.plays = (rec.plays || 0) + 1;   // a round played (the Game On medal counts these)
  const acc = accuracy(g), n = r.run.round + 1;
  for (let i = 0; i < Math.min(acc.right, 10); i++) pay('answer', `${gm.name}: ${n > RUN_ROUNDS ? 'final' : `round ${n}`}`);
  bumpDay(k, 'right', acc.right); bumpDay(k, 'answers', acc.total);
  r.last = { score: g.score, acc, met, duel: g.kind === 'duel' ? { ...duelTally(g), rival: g.rival } : null, speed: g.speed || 0 };
  r.run = runAdd(r.run, g, met);
  save();
  if (r.run.round <= RUN_ROUNDS) { stopMusic(); r.phase = 'between'; sfx('finish'); render(); return; }
  finishRun();
}

function finishRun() {
  stopTimer(); stopMusic();
  const r = S.run, k = kid(), id = r.id, gm = GAMES[id], run = r.run, rec = recOf(id), L = run.level;
  const score = runScore(run), pct = runPct(run), stars = starsFor(pct), enough = run.total >= (gm.timed ? 4 : 1);
  rec.runs = (rec.runs || 0) + 1; const newBest = score > (rec.best || 0); rec.best = Math.max(rec.best || 0, score);
  rec.stars = { ...(rec.stars || {}) }; const newStars = stars > (rec.stars[L] || 0); rec.stars[L] = Math.max(rec.stars[L] || 0, stars);
  const before = levelOf(id);
  if (L === before) rec.level = nextLevel(before, enough ? pct : null);
  rec.top = Math.max(rec.top || 1, rec.level || 1);
  if ((rec.level || 1) > before) pay('stop', `${gm.name}: level ${before} passed`);
  r.result = { pct, stars, newStars, score, before, after: rec.level || before, played: L, next: nextStepFor(id, { misses: run.misses }), bestCombo: run.bestCombo, met: run.met, scores: run.scores, bonus: run.bonus };
  k.last = { what: 'game', title: gm.name, right: `${run.right} ${UNIT[id]}`, at: Date.now() };
  r.phase = 'done'; r.newBest = newBest; sfx('finish'); save(); render(); if (newBest || stars === 3) confetti(); checkMedals(); render();
}

/* ---------- the board ---------- */
function pips(g, n) {
  const res = g.results || [];
  return `<div class="gb-pips" role="img" aria-label="${res.length} of ${n} done">${Array.from({ length: n }, (_, i) => `<i class="pip${i < res.length ? (res[i] ? ' ok' : ' no') : i === g.i ? ' cur' : ''}"></i>`).join('')}</div>`;
}
const roundName = (run) => (isFinal(run) ? 'Final' : `Round ${run.round + 1} of ${RUN_ROUNDS}`);
function board(id, g, body) {
  const gm = GAMES[id], k = kid(), r = S.run, timed = gm.timed, last = timed ? g.flash : g.kind === 'duel' && !g.state ? g.which : g.kind === 'figure' && !g.state ? g.spot : g.state;
  const pose = last ? (last.ok ? 'cheer' : 'think') : 'point';
  const track = timed ? `<div class="gb-time"><i style="width:${(100 * (ROUND_MS - g.t)) / ROUND_MS}%"></i></div><span class="time" aria-label="seconds left">${Math.ceil((ROUND_MS - g.t) / 1000)}s</span>`
    : pips(g, g.rounds.length);
  return `<div class="gboard${r.final ? ' gb-final' : ''}" data-game="${id}" style="--plate:url('${plate({ id: gm.world }, isDark())}')">
    <div class="gb-bar"><img class="gb-ava" src="${avatarOf(k)}" alt=""><span class="gb-round">${roundName(r.run)}</span>${track}
      <span class="gb-combo${g.combo >= 2 ? ' on' : ''}" aria-live="polite">${g.combo >= 2 ? `${g.combo} in a row` : ''}</span>
      <span class="gb-score"><b>${g.score}</b><small>run ${runScore(r.run) + g.score}</small></span></div>
    <div class="gb-frame">${body}</div>
    <div class="gb-foot"><img class="gb-quill" src="${mascot(pose)}" alt=""><span class="gb-level"><b>Level ${g.level}</b> · ${esc(r.final ? gm.final : gm.levels[g.level])}</span></div></div>`;
}

function levelMap(id, rec, pick) {
  const top = topOf(id);
  return `<div class="gb-map" role="group" aria-label="Levels">${Array.from({ length: MAX_LEVEL }, (_, i) => { const L = i + 1, open = L <= top;
    return `<button class="gb-lv${L === pick ? ' on' : ''}${open ? '' : ' locked'}" data-act="game-level" data-arg="${L}" ${open ? '' : 'disabled'} aria-pressed="${L === pick}" aria-label="Level ${L}${open ? `, ${levelStars(rec, L)} stars` : ', not open yet'}">
      <b>${open ? L : icon('lock')}</b>${starRow(levelStars(rec, L))}</button>`; }).join('')}</div>`;
}

export function gameView() {
  const r = S.run, gm = GAMES[r?.id]; if (!gm) return empty('oops', 'That game is not here.', link('Play', '#/play'));
  const id = r.id, k = kid(), rec = k.games[id] || {}, L = r.pick || levelOf(id);
  const head = pageHead({ title: gm.name, sub: `practises ${gm.practises}`, back: { label: 'Play', href: '#/play' } });
  if (r.phase === 'title') {
    const pool = r.ready ? levelPool(id, L) : null, c = pool ? memCounts(pool.items, pool.key, memOf(rec)) : null;
    return head + `<div class="game"><div class="card titlecard"><div class="plate" style="background-image:url('${plate({ id: gm.world }, isDark())}')"><img class="gb-ava" src="${avatarOf(k)}" alt=""><img class="tc-quill" src="${mascot('wave')}" alt=""></div>
    <h2>${esc(gm.name)}</h2><p style="margin:0;max-width:52ch">${esc(gm.how)}${gm.more ? ` ${esc(gm.more)}` : ''}</p><p class="note" style="margin:0">Keys: ${esc(gm.keys)} — or just tap.</p>
    ${levelMap(id, rec, L)}
    <p class="gb-level" style="margin:0"><b>Level ${L}</b> · ${esc(gm.levels[L])}${rec.best ? ` · your best ${rec.best}` : ''}</p>
    <p class="gb-mem" data-mem style="margin:0">${c ? `<b>${c.fresh}</b> new to you · <b>${c.back}</b> to win back · pool ${c.pool}` : 'Getting the cards ready…'}</p>
    <p class="note" style="margin:0">A run is ${RUN_ROUNDS} rounds and a final — ${esc(gm.final.charAt(0).toLowerCase() + gm.final.slice(1))}. Stars come from how many you get right.</p>
    ${r.err ? `<p class="note" role="alert">${esc(r.err)}</p>` : ''}${btn('Start', 'game-start', { ic: 'next' })}</div></div>`;
  }
  const g = r.g;
  if (r.phase === 'done') return head + doneView(id, g, r);
  if (r.phase === 'between') return head + betweenView(id, r);
  return head + `<div class="game">${board(id, g, bodyOf(id, g))}</div>`;
}

function betweenView(id, r) {
  const gm = GAMES[id], run = r.run, x = r.last, pct = x.acc.pct == null ? '—' : `${Math.round(x.acc.pct * 100)}%`, nextFinal = isFinal(run);
  const duel = x.duel?.rival ? `<p class="gb-duelres" style="margin:0">${x.duel.you > x.duel.them ? `You won the duel against ${esc(x.duel.rival.name)}, ${x.duel.you}–${x.duel.them}.` : x.duel.you < x.duel.them ? `${esc(x.duel.rival.name)} won this one, ${x.duel.them}–${x.duel.you}. Your reasons still scored.` : `A draw with ${esc(x.duel.rival.name)}, ${x.duel.you}–${x.duel.them}.`}</p>` : '';
  return `<div class="game"><div class="gboard gb-between" data-game="${id}" style="--plate:url('${plate({ id: gm.world }, isDark())}')"><div class="gb-frame stack">
    <span class="kick">${run.round} of ${RUN_ROUNDS + 1} done</span><h2 style="margin:0">${nextFinal ? 'Three rounds done — now the final' : `Round ${run.round} done`}</h2>${duel}
    <div class="gb-stats"><span><b>${x.score}</b><small>this round</small></span><span><b>${runScore(run)}</b><small>run so far</small></span><span><b>${pct}</b><small>accuracy</small></span><span><b>${x.met}</b><small>new to you</small></span></div>
    ${x.speed ? `<p class="note" style="margin:0">${x.speed} built fast — +${x.speed} time bonus.</p>` : ''}
    <p class="note" style="margin:0">${nextFinal ? `The final: ${esc(gm.final.charAt(0).toLowerCase() + gm.final.slice(1))}.` : 'The next round brings new ones — anything you missed comes back on another day.'}</p>
    <div class="row" style="justify-content:center">${btn(nextFinal ? 'Play the final' : 'Next round', 'game-round', { ic: 'next' })}</div></div></div></div>`;
}

function doneView(id, g, r) {
  const gm = GAMES[id], res = r.result, pct = res.pct == null ? '—' : `${Math.round(res.pct * 100)}%`;
  const lv = res.played !== res.before ? `You played level ${res.played}; your level stays ${res.after} — ${gm.levels[res.after]}.`
    : res.after > res.before ? `Level ${res.before} → ${res.after}: up a level — ${gm.levels[res.after]}.` : res.after < res.before ? `Level ${res.before} → ${res.after}: one step back to steady it — ${gm.levels[res.after]}.` : `Level ${res.after} stays — ${gm.levels[res.after]}. 80% moves you up.`;
  const nx = res.next;
  return `<div class="game"><div class="gboard gb-done" data-game="${id}" style="--plate:url('${plate({ id: gm.world }, isDark())}')"><div class="gb-frame finish stack">
    <img src="${mascot('cheer')}" alt="">${starRow(res.stars)}<div class="score">${res.score}</div>
    <p style="margin:0">Level ${res.played}: ${res.stars} star${res.stars === 1 ? '' : 's'}${res.newStars ? ' — your most yet on this level' : ''}. Rounds ${res.scores.slice(0, RUN_ROUNDS).join(' · ')} · final ${res.scores[RUN_ROUNDS] ?? 0}${res.bonus ? ` (with +${res.bonus} for speed)` : ''}.</p>
    <div class="gb-stats"><span><b>${res.score}</b><small>run score</small></span><span><b>${kid().games[id].best}</b><small>${r.newBest ? 'a new best' : 'your best'}</small></span><span><b>${pct}</b><small>accuracy</small></span><span><b>${res.met}</b><small>new items met</small></span></div>
    <p class="note" style="margin:0">You practised ${esc(gm.practises)}. Most in a row: ${res.bestCombo}.</p><p class="gb-lvchange" style="margin:0">${esc(lv)}</p>
    <a class="gb-next card" href="${esc(nx.href)}" data-next>${icon('path')}<span><small>Your next step — ${esc(nx.why)}</small><b>${esc(nx.label)}</b></span>${icon('next')}</a>
    <div class="row" style="justify-content:center">${btn('Play again', 'game-start', { ic: 'undo' })}${link('All games', '#/play', { cls: 'out', ic: 'play' })}</div></div></div></div>`;
}

const optBtn = (act, i, label, st, answer, extra = '') => `<button class="opt${st ? (i === answer ? ' right' : st.pick === i ? ' wrong' : '') : ''}" data-act="${act}" data-arg="${i}" ${st ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${label}</span>${extra}</button>`;
const fb = (st, title, body, nextAct = 'q-next') => (st ? `<div class="feedback ${st.ok ? 'ok' : 'no'}" role="status"><div class="hd">${icon(st.ok ? 'check' : 'cross')}${esc(title)}</div><div>${body}</div>${st.ok ? '' : btn('Next', nextAct, { ic: 'next' })}</div>` : '');
const GLOSS = Object.fromEntries(FIGURE_KINDS.map(([k, , g]) => [k, g]));

function bodyOf(id, g) {
  if (g.kind === 'builder') {
    const c = g.cur, fl = g.flash ? `<div class="feedback ${g.flash.ok ? 'ok' : 'no'}" role="status"><div class="hd">${icon(g.flash.ok ? 'check' : 'cross')}${g.flash.ok ? (g.flash.bonus ? 'Built — the other way round! +1' : 'Right!') + (g.flash.fast ? ' Fast: +1' : '') : 'Not quite'}</div><div>${esc(g.flash.text)}</div></div>` : '';
    return `<p class="prompt">${g.final ? 'Rush hour: build each inside 8 seconds for +1. ' : ''}Build one sentence from these three parts.</p>
      <div class="built">${g.picks.map((i, j) => `<span class="tile${j === g.picks.length - 1 ? ' gb-slide' : ''}">${esc(c.tiles[i].text)}</span>`).join('') || '<span class="muted">tap a part to start</span>'}</div>
      <div class="tiles">${c.tiles.map((t, i) => `<button class="tile" data-act="b-pick" data-arg="${i}" ${g.picks.includes(i) ? 'disabled' : ''}><kbd style="font:700 12px var(--mono);opacity:.6;margin-right:6px">${i + 1}</kbd>${esc(t.text)}</button>`).join('')}</div>
      <div class="row">${btn('Undo', 'b-undo', { ic: 'undo', cls: 'out', dis: !g.picks.length })}</div>${fl}`;
  }
  if (g.kind === 'rush') {
    const c = g.cur, fl = g.flash ? `<div class="feedback ${g.flash.ok ? 'ok' : 'no'}" role="status"><div class="hd">${icon(g.flash.ok ? 'check' : 'cross')}${g.flash.ok ? 'Right!' + (g.flash.fast ? ' Fast: +1' : '') : 'Not quite — here it is'}</div><div>${esc(g.flash.text)}</div></div>` : '';
    return `<p class="prompt">${g.final ? 'Rush hour: a clean sentence inside 10 seconds is +1. ' : ''}Tap every gap that needs a comma.</p>
      <div class="sent">${c.words.map((w, i) => `<span class="word">${esc(w)}</span>${i < c.words.length - 1 ? `<button class="gap${g.sel.includes(i) ? ' on' : ''}${g.cursor === i ? ' cursor' : ''}${g.sel.includes(i) && g.cursor === i ? ' gb-glow' : ''}" data-act="r-gap" data-arg="${i}" aria-pressed="${g.sel.includes(i)}" aria-label="gap after ${esc(w)}">${g.sel.includes(i) ? ',' : ''}</button>` : ''}`).join('')}</div>
      <div class="row">${btn('Next sentence', 'r-submit', { ic: 'next' })}</div>${fl}`;
  }
  const q = g.rounds[g.i], st = g.state;
  if (g.kind === 'figure') {
    const name = q.options[q.answer], kind = q.kinds[q.answer];
    if (q.hunt) {
      const sp = g.spot, found = g.found || (sp && sp.ok);
      const sents = q.sentences.map((s, i) => `<button class="gb-sent${sp ? (i === q.at ? ' right' : sp.pick === i ? ' wrong' : '') : ''}" data-act="fig-spot" data-arg="${i}" ${sp ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(s)}</span></button>`).join('');
      return `<p class="prompt">${found ? 'Now name the figure in the lit sentence.' : 'Hunt it: one of these sentences holds a figure of speech. Tap it.'}</p>
        <div class="gb-passage">${sents}</div><p class="subp">${esc(q.work)} — exact, as the book has it.</p>
        ${sp && !sp.ok && !g.found ? `<div class="feedback no" role="status"><div class="hd">${icon('cross')}Not that one</div><div>The figure is in sentence ${q.at + 1}: “${esc(q.text)}”.</div>${btn('Go on — name it', 'q-next', { ic: 'next' })}</div>` : ''}
        ${found ? `<div class="opts">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>${fb(st, st?.ok ? 'Right!' : `It is ${name.toLowerCase()}`, `“${esc(q.text)}” — ${esc(name)}: it ${esc(GLOSS[kind])}.`)}` : ''}`;
    }
    return `<blockquote class="prompt big" style="margin:0">“${esc(q.text)}”</blockquote><p class="subp">${esc(q.work)} — which figure of speech?</p>
      <div class="opts">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>${fb(st, st?.ok ? 'Right!' : `It is ${name.toLowerCase()}`, `${esc(name)}: it ${esc(GLOSS[kind])}.`)}`;
  }
  if (g.kind === 'who') {
    const shown = q.clues.slice(0, g.clue), worth = [3, 2, 1, 1][Math.min(g.clue, 3)];
    return `<blockquote class="prompt big" style="margin:0">“${esc(q.text)}”</blockquote>
      <div class="gb-case"><span class="gb-worth">${icon('search')}Worth ${worth} point${worth === 1 ? '' : 's'}</span>
        ${!st && g.clue < q.clues.length ? btn(g.clue ? 'Another clue' : 'A clue', 'who-clue', { ic: 'key', cls: 'out', attrs: 'data-clue' }) : ''}</div>
      ${shown.length ? `<ol class="gb-clues">${shown.map((c) => `<li class="gb-slide">${esc(c.text)}</li>`).join('')}</ol>` : ''}
      <p class="subp">Who said it — or wrote it?</p>
      <div class="opts">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>${fb(st, st?.ok ? `Right! +${st.gain}` : 'Not this time', `${esc(q.right)}${q.work ? `, ${esc(q.work)}` : ''}.`)}`;
  }
  if (g.kind === 'root') {
    const piece = st ? q.options[st.pick] : '?', aff = (x) => `<span class="gb-aff${st ? (st.ok ? ' ok' : ' no') : ''}">${esc(x)}</span>`, base = `<span class="gb-base">${esc(q.base)}</span>`, f = q.family;
    const done = f ? g.rounds.slice(g.i - f.step, g.i).map((x, j) => (g.results[g.i - f.step + j] ? x.word : '…')) : [];
    const famHead = f ? `<div class="gb-family"><span class="kick">Forge a family — word ${f.step + 1} of ${f.of}</span><b>${f.root ? `the root “${esc(f.base)}”` : `“${esc(f.base)}”`}</b><span class="gb-famwords">${[...done, ...Array(f.of - done.length).fill('?')].map((w) => `<i>${esc(w)}</i>`).join('')}</span></div>` : '';
    return `${famHead}<p class="prompt">${q.kind === 'root' ? `The root “${esc(q.base)}” means “${esc(q.meaning)}”. Which piece forges a real word?` : `Which ${q.before ? 'prefix' : 'ending'} makes a real word with “${esc(q.base)}”?`}</p>
      <div class="gb-forge${st?.ok ? ' gb-fused' : ''}">${q.before ? aff(piece.replace(/-$/, '')) + base : base + aff(piece.replace(/^-/, ''))}</div>
      <div class="opts four">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>
      ${fb(st, st?.ok ? `Forged: ${q.word}` : 'No such word in Bee’s list', `${st && !st.ok ? `“${esc(q.options[st.pick].replace(/-/g, ''))}” and “${esc(q.base)}” make no word in the list. The real one is <b>${esc(q.word)}</b>. ` : ''}${q.def ? `<b>${esc(q.word)}</b>${q.ps ? ` (${esc(q.ps)})` : ''}: ${esc(q.def)}.` : ''}`)}`;
  }
  if (g.kind === 'plot') {
    if (q.type === 'missing') {
      const rows = q.cards.map((c, j) => (j === q.gap ? `<li class="gb-slot gb-gap${st ? (st.ok ? ' ok' : ' no') : ''}"><b>${j + 1}</b><span>${st ? esc(c.text) : '?'}</span></li>` : `<li class="gb-slot full"><b>${j + 1}</b><span>${esc(c.text)}</span></li>`)).join('');
      return `<p class="prompt">${esc(q.title)}: one scene is missing. Which one goes in the gap?</p><ol class="gb-line">${rows}</ol>
        <div class="opts gb-scenes">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>
        ${fb(st, st?.ok ? 'That is the missing scene!' : 'Not that one', `Scene ${q.gap + 1} opens: “${esc(q.cards[q.gap].text)}” The others come from elsewhere in the book.`)}`;
    }
    const n = q.cards.length, done = !!st;
    const slots = Array.from({ length: n }, (_, j) => { const c = g.line[j]; const good = done && j > 0 && q.cards[c].at === q.cards[g.line[j - 1]].at + 1;
      return `<li class="gb-slot${c != null ? ' full' : ''}${!done && c == null && g.slot === j ? ' cursor' : ''}${done ? (good || (j === 0 && q.cards[c].at === 0) ? ' ok' : ' no') : ''}${c != null && c === g.stack[g.stack.length - 1] && !done ? ' gb-slide' : ''}" data-slot="${j}" ${!done && c == null ? `data-act="pl-slot" data-arg="${j}"` : ''}><b>${j + 1}</b><span>${c != null ? esc(q.cards[c].text) : ''}</span>${done ? `<small>scene ${q.cards[c].at + 1}</small>` : ''}</li>`; }).join('');
    const cards = q.cards.map((c, i) => g.line.includes(i) ? '' : `<button class="tile gb-card${g.cursor === i ? ' cursor' : ''}" data-act="pl-place" data-arg="${i}"><kbd>${i + 1}</kbd><span>${esc(c.text)}</span></button>`).join('');
    return `<p class="prompt">${esc(q.title)}: drag the scenes onto the line in the order they happen — or tap them in order.</p><ol class="gb-line">${slots}</ol>
      ${done ? '' : `<div class="gb-cards">${cards}</div><div class="row">${btn('Undo', 'pl-undo', { ic: 'undo', cls: 'out', dis: !g.stack.length })}</div>`}
      ${fb(st, st?.ok ? 'In order — every scene!' : `${st?.pairs} of ${st?.max} pairs in order`, st ? `Each card is the first sentence of a scene in “${esc(q.title)}”. The small number is where it really comes.` : '')}`;
  }
  if (g.kind === 'duel') {
    const w = g.which, wt = WORKS.find((x) => x.id === q.work), rv = g.rival, t = duelTally(g);
    const rivalBar = rv ? `<div class="gb-rival"><img src="${rivalArt(rv.id)}" alt="" width="40" height="40"><span><b>You ${t.you} · ${esc(rv.name)} ${t.them}</b><small>Best of ${g.rounds.length}. ${esc(rv.name)}, ${rv.age}, ${esc(rv.tell)}. ${esc(rv.name)} is one of Bizzing Bee’s made-up rivals; the points are the app’s own.</small></span>
      ${st ? `<em class="gb-rvline">${esc(rv.name)}: ${rv.pts[g.i] ? 'got this reason' : 'missed this one'}</em>` : ''}</div>` : '';
    const vers = q.versions.map((v, i) => `<button class="gb-version${w ? (i === q.strong ? ' right' : w.pick === i ? ' wrong' : '') : ''}" data-act="du-pick" data-arg="${i}" ${w ? 'disabled' : ''}><kbd>${i + 1}</kbd><span class="gb-vtext">${esc(v)}</span>
      ${w ? `<small>${i === q.strong ? `The original — ${esc(wt?.author || '')}, ${esc(wt?.title || '')}` : 'A plainer version, written for this game'}</small>` : ''}</button>`).join('');
    return `${rivalBar}<p class="prompt">${w ? 'Why is the original stronger?' : 'Which version is stronger?'}</p><div class="gb-duel">${vers}</div>
      ${w ? `<p class="subp">${w.ok ? 'Yes — that one is the original.' : 'The other one is the original.'} Now the part that scores: why?</p>
      <div class="opts">${q.options.map((o, i) => optBtn('q-pick', i, `${esc(o)} <small class="muted">— ${esc(DEVICE_GLOSS[o] || '')}</small>`, st, q.answer)).join('')}</div>` : ''}
      ${fb(st, st?.ok ? `Right — ${q.device}` : `It is ${q.device}`, `${esc(q.device.charAt(0).toUpperCase() + q.device.slice(1))}: ${esc(DEVICE_GLOSS[q.device] || '')}.`)}`;
  }
  return '';
}

export const PLAY_ACTIONS = {
  'game-start': () => startRun(),
  'game-round': () => { const r = S.run; if (r?.phase === 'between') startRound(); },
  'game-level': (a) => { const r = S.run; if (!r || r.phase !== 'title') return; const L = +a; if (L >= 1 && L <= topOf(r.id)) { r.pick = L; sfx('tap'); render(); } },
  'b-pick': (a) => { sfx('tap'); step({ type: 'pick', i: +a }); },
  'b-undo': () => step({ type: 'undo' }),
  'r-gap': (a) => { sfx('tap'); step({ type: 'toggle', i: +a }); },
  'r-submit': () => step({ type: 'submit' }),
  'q-pick': (a) => act({ type: 'pick', i: +a }),
  'q-next': () => act({ type: 'next' }),
  'who-clue': () => { sfx('tap'); act({ type: 'clue' }); },
  'fig-spot': (a) => act({ type: 'spot', i: +a }),
  'pl-place': (a) => { if (dragDone) return; sfx('tap'); act({ type: 'place', i: +a }); },
  'pl-slot': (a) => act({ type: 'slot', at: +a }),
  'pl-undo': () => act({ type: 'undo' }),
  'du-pick': (a) => act({ type: 'pick', i: +a }),
  // the old names, kept for links and tests written before the reducers
  'who-pick': (a) => act({ type: 'pick', i: +a }), 'fig-pick': (a) => act({ type: 'pick', i: +a }), 'who-next': () => act({ type: 'next' }),
};

/* Plot Line by pointer: drag a card onto a slot (a mouse, a finger or a pen); a press without a move is a tap. */
let drag = null, dragDone = false;
if (typeof document !== 'undefined') {
  const slotAt = (x, y) => document.elementsFromPoint(x, y).map((el) => el.closest?.('.gb-slot[data-slot]')).find(Boolean) || null;
  document.addEventListener('pointerdown', (e) => {
    const c = e.target.closest?.('.gb-card[data-act=pl-place]'); if (!c || (e.button != null && e.button > 0)) return;
    drag = { el: c, i: +c.dataset.arg, x: e.clientX, y: e.clientY, on: false, id: e.pointerId, over: null };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) { if (Math.hypot(dx, dy) < 8) return; drag.on = true; drag.el.classList.add('gb-drag'); try { drag.el.setPointerCapture(e.pointerId); } catch { /* not every pointer can be captured */ } }
    drag.el.style.transform = `translate(${dx}px, ${dy}px)`;
    const s = slotAt(e.clientX, e.clientY); if (s !== drag.over) { drag.over?.classList.remove('gb-over'); s?.classList.add('gb-over'); drag.over = s; }
    e.preventDefault();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; if (!d.on) return;
    d.el.style.transform = ''; d.el.classList.remove('gb-drag'); d.over?.classList.remove('gb-over');
    dragDone = true; setTimeout(() => { dragDone = false; }, 60);   // the click that follows a drag is not a tap
    const s = e.type === 'pointerup' ? slotAt(e.clientX, e.clientY) : null;
    if (s) { sfx('tap'); act({ type: 'place', i: d.i, at: +s.dataset.slot }); }
  };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
}

export function playKey(e) {
  const r = S.run; if (!r || r.mode !== 'game' || !GAMES[r.id]) return false;
  if (r.phase === 'title') {
    if (e.key === 'Enter' && !/^(BUTTON|A)$/.test(e.target?.tagName || '')) { startRun(); return true; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { PLAY_ACTIONS['game-level'](String((r.pick || 1) + (e.key === 'ArrowRight' ? 1 : -1))); return true; }
    return false;
  }
  if (r.phase === 'between') { if (e.key === 'Enter' && !/^(BUTTON|A)$/.test(e.target?.tagName || '')) { startRound(); return true; } return false; }
  if (r.phase !== 'play' || !r.g) return false;
  const g = r.g;
  if (g.kind === 'builder') { if (/^[1-3]$/.test(e.key)) { step({ type: 'pick', i: +e.key - 1 }); return true; } if (e.key === 'Backspace') { step({ type: 'undo' }); return true; } return false; }
  if (g.kind === 'rush') {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { step({ type: 'move', d: e.key === 'ArrowRight' ? 1 : -1 }); return true; }
    if (e.key === ' ') { step({ type: 'toggle', i: g.cursor }); return true; }
    if (e.key === 'Enter') { step({ type: 'submit' }); return true; }
    return false;
  }
  const q = g.rounds[g.i];
  if (g.kind === 'figure' && q.hunt && !g.found) {
    if (g.spot && !g.spot.ok) { if (e.key === 'Enter') { act({ type: 'next' }); return true; } return false; }
    if (new RegExp(`^[1-${q.sentences.length}]$`).test(e.key)) { act({ type: 'spot', i: +e.key - 1 }); return true; }
    return false;
  }
  if (g.state && !g.state.ok) { if (e.key === 'Enter') { act({ type: 'next' }); return true; } return false; }
  if (g.state) return false;
  if (g.kind === 'who' && (e.key === 'c' || e.key === 'C')) { act({ type: 'clue' }); return true; }
  if (g.kind === 'plot' && q.type !== 'missing') {
    const n = q.cards.length;
    if (new RegExp(`^[1-${n}]$`).test(e.key)) { act({ type: 'place', i: +e.key - 1 }); return true; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { act({ type: 'move', d: e.key === 'ArrowRight' ? 1 : -1 }); return true; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { act({ type: 'slot', d: e.key === 'ArrowDown' ? 1 : -1 }); return true; }
    if (e.key === 'Enter' || e.key === ' ') { act({ type: 'place', i: g.cursor }); return true; }
    if (e.key === 'Backspace') { act({ type: 'undo' }); return true; }
    return false;
  }
  const n = g.kind === 'duel' && g.stage === 'which' ? 2 : q.options.length;
  if (new RegExp(`^[1-${n}]$`).test(e.key)) { act({ type: 'pick', i: +e.key - 1 }); return true; }
  return false;
}
