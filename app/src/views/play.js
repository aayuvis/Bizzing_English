/* play.js — the games (FAMILY-STANDARD §14; handover C §1, §4): the Play tab's cards, the two hubs and
   their modes, and the games still on their own card. A RUN is three rounds and a final; the level is the
   child's to choose (the chip) and the owner's rule moves it; coins are paid at the finish for learning
   only (games.js roundPay / runPay) and the finish card says exactly what reached the wallet. A miss holds
   on the item with the answer in place (src/miss.js) until Continue. The hub modes play on the symmetric
   stage (src/stage.js): mirrored HUD, the world's plate edge to edge, the play object centred and largest,
   no scroll; the clock of a timed mode stops while the tab is hidden and the world backdrop stands still.
   Keyboard AND touch (and a drag for Plot Line). The rules and the memory live in games.js as pure
   functions; this file loads the pools (the big ones lazily) and draws. */

import '../../styles/stage.css';
import '../../styles/hubs.css';
import { S, kid, save, render, pay, checkMedals, isDark, confetti } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { builderNew, builderStep, rushNew, rushStep, whoRound, figureRound, figureStep, figurePhase, quizNew, quizStep, plotRound, plotNew, plotStep, duelRound, duelNew, duelStep, duelRival, duelTally,
  CHANCE, accuracy, mostMissed, starsFor, runNew, runAdd, runScore, runPct, runPay, runStarPct, roundPay, isFinal, memOf, memRecord, memCounts, memDraw, roundLog, huntsFrom, huntable, figurePool, itemKey,
  builderLevelPool, rushLevelPool, whoLevelPool, plotPool, duelLevelPool, FIGURE_LEVELS, FIGURE_KINDS, ROUND_OF, ROUND_MS, RUN_ROUNDS, STAR_LINE, GAMES } from '../games.js';
import { HUBS, isHub, hubOf, playLevel, setPick, settleLevel } from '../hubs.js';
import { missCard } from '../miss.js';
import { stage, plateUrl, afterRender, stillScene, onHidden } from '../stage.js';
import { playView as cardsView, hubView, levelChip, levelTag, starRow } from './hubs.js';
import { FIGURES } from '../data/literature.js';
import { RHETORIC } from '../data/language.js';
import { PLAIN, DEVICE_GLOSS } from '../data/duel.js';
import { MORE_LINES } from '../data/lines-more.js';
import { cleared } from '../data/rights.js';
import { shippedLines, loadPassages, shippable } from '../reading.js';
import { forgeReady, preloadForge, forgeStart, forgeAct, forgeTitle, forgePlay, forgeBook, forgeKey, forgeActions, setDragAct } from './forge.js';   // Root Forge: its own view on the shared run
import { BOOKS, loadBook, chapterKey, bookMeta } from '../book.js';
import { WORKS, PASSAGES } from '../data/library.js';
import { field, rivalArt } from '../contest.js';
import { stopById } from '../curriculum.js';
import { sfx, music, stopMusic } from '../sound.js';
import { bumpDay } from '../model.js';
import { avatarOf } from './pages.js';
import { ownsMode, buyMode, MODE_PRICE, modeWhat } from '../modes.js';
import { balance, spend } from '../family.js';
const boardPlate = (world) => plateUrl(world, isDark());

export { GAMES };

/* the one next step: the stop that teaches what was missed most (or, for a clean run, the next stop up) */
const NEXT = {
  builder: { clause: 's4-combine', clean: 's6-join' },
  rush: { list: 's5-comma', fronted: 's5-comma', address: 's5-comma', yesno: 's5-comma', compound: 's5-comma', aside: 's6-fold', clean: 's6-fold' },
  figure: { simile: 'li5-simile', metaphor: 'li5-simile', none: 'li5-simile', personification: 'li5-sound', alliteration: 'li5-sound', clean: 'la7-devices' },
  root: { prefix: 'w3-make', suffix: 'w4-make', root: 'w5-find', clean: 'w6-build' },
  duel: { anaphora: 'la7-devices', tricolon: 'la7-devices', alliteration: 'la7-devices', 'rhetorical question': 'la7-devices', antithesis: 'la7-antithesis', simile: 'la7-devices', clean: 'la7-antithesis' },
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

export function playView() { stillScene(false); afterRender(); preloadForge(); return cardsView(); }

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
  if (id === 'root') await forgeReady();
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
  return null;
}

/* ---------- the clock: real time, stopped while the tab is hidden or a miss holds ---------- */
let timer = null, adv = null, offHidden = null;
const stopTimer = () => { if (timer) clearInterval(timer); timer = null; if (adv) clearTimeout(adv); adv = null; if (offHidden) offHidden(); offHidden = null; };
function startClock() {
  let last = performance.now();
  const run = () => { if (timer) return; last = performance.now(); timer = setInterval(() => { const now = performance.now(); step({ type: 'tick', dt: now - last }); last = now; }, 250); };
  const pause = () => { if (timer) { const now = performance.now(); step({ type: 'tick', dt: now - last }); clearInterval(timer); timer = null; } if (S.run) S.run.paused = true; };
  const resume = () => { if (S.run) S.run.paused = false; if (S.run?.phase === 'play' && S.run.g && !S.run.g.over) run(); };
  run(); offHidden = onHidden(pause, resume);
}

const recOf = (id) => (kid().games[id] ||= { best: 0, plays: 0, level: 1, pick: null });
export function openGame(id, sub) {
  stopTimer();
  if (isHub(id) && !sub) { S.run = { mode: 'game', hub: id, phase: 'hub' }; return; }
  if (isHub(id)) { if (!HUBS[id].modes.includes(sub)) { S.run = { mode: 'game', id: sub, phase: 'title' }; return; } id = sub; }
  if (!GAMES[id]) { S.run = { mode: 'game', id, phase: 'title' }; return; }
  const r = (S.run = { mode: 'game', id, hub: hubOf(id), phase: 'title', g: null, ready: false });
  prepare(id).then(() => { if (S.run !== r) return; r.ready = true; if (r.phase === 'title') render(); });
}
export function leaveGame() { stopTimer(); stopMusic(); stillScene(false); }

function startRun(challenge = false) {
  const r = S.run; if (!r?.id) return;
  if (challenge && !ownsMode(kid(), r.id)) return;
  r.run = runNew(playLevel(recOf(r.id))); r.result = null; r.err = null; r.challenge = !!challenge;
  r.wallet0 = balance(kid().name);
  if (challenge) r.run.round = RUN_ROUNDS;          // the final, straight away
  return startRound();
}
/* a challenge's finish: its own best only — no level moves, no star, no coin (modes.js) */
function finishChallenge() {
  stopTimer(); stopMusic(); stillScene(false);
  const r = S.run, k = kid(), id = r.id, run = r.run, rec = recOf(id), score = runScore(run), pct = runPct(run);
  rec.chRuns = (rec.chRuns || 0) + 1; const newBest = score > (rec.chBest || 0); rec.chBest = Math.max(rec.chBest || 0, score);
  r.result = { challenge: true, score, pct, newBest, best: rec.chBest, played: run.level, bestCombo: run.bestCombo, coins: 0, next: nextStepFor(id, { misses: run.misses }) };
  k.last = { what: 'game', title: `${GAMES[id].name} challenge`, right: `${run.right} ${UNIT[id]}`, at: Date.now() };
  r.phase = 'done'; sfx('finish'); save(); render(); if (newBest) confetti();
}
async function startRound() {
  stopTimer();
  const r = S.run, k = kid(), id = r.id, run = r.run, L = run.level, gm = GAMES[id], final = isFinal(run), seed = `${k.id}:${Date.now()}:${run.round}`;
  const o = { mem: memOf(k.games[id]), now: Date.now(), final };
  r.err = null; r.final = final; r.paused = false;
  await prepare(id); if (S.run !== r) return;
  if (id === 'builder' || id === 'rush') {
    r.g = id === 'builder' ? builderNew(seed, L, { ...o, extra: D.extra?.builder }) : rushNew(seed, L, { ...o, extra: D.extra?.rush }); r.phase = 'play';
    music(gm.music); startClock();
    return render();
  }
  let g = null;
  if (id === 'figure') { const hunts = await huntsFor(seed, o.mem); if (S.run !== r) return; g = quizNew('figure', figureRound(figPool(), WORKS, seed, L, ROUND_OF.figure, { ...o, hunts }), L); }
  else if (id === 'who') g = quizNew('who', whoRound(whoPool(), WORKS, seed, L, ROUND_OF.who, o), L);
  else if (id === 'duel') {
    const rivals = field(k.band), rv = final ? rivals[rivals.length - 1] : rivals[run.round % Math.max(1, rivals.length - 1)], rounds = duelRound(rhetPool(), plainPool(), seed, L, ROUND_OF.duel, o);
    g = duelNew(rounds, L, rv ? { id: rv.id, name: rv.name, age: rv.age, tell: rv.tell, pts: duelRival(rv, seed, rounds.length) } : null);
  }
  else if (id === 'plot') g = plotNew(plotRound(D.passages || [], seed, L, ROUND_OF.plot, WORKS, { ...o, chapters: D.chapters || [] }), L);
  else if (id === 'root') { g = forgeStart(seed, L, final, o); if (!g) { r.err = 'Bee’s word list did not load. Check the connection and try again.'; r.phase = 'title'; return render(); } }
  if (S.run !== r) return;
  if (!g || g.over) { r.err = 'This game has nothing to play just now.'; r.phase = 'title'; return render(); }
  r.g = g; r.phase = 'play'; music(gm.music); render();
}

/* motion on every answer: the play object pops or shakes, a "+N" flies up, the combo bumps. Added after
   the render, so it plays once per answer; CSS stills it under reduced motion, the device's "Reduce
   motion" (html.still) and Calm mode (no confetti). */
function juice(fx) {
  if (!fx) return;
  sfx(fx.ok ? 'right' : 'wrong');
  requestAnimationFrame(() => {
    const f = document.querySelector('[data-play]') || document.querySelector('.gb-frame'); if (!f) return;
    f.classList.add(fx.ok ? 'gb-ok' : 'gb-no');
    if (fx.ok && fx.gain > 0) { const s = document.createElement('span'); s.className = 'gb-fly'; s.setAttribute('aria-hidden', 'true'); s.textContent = `+${fx.gain}`; f.appendChild(s); setTimeout(() => s.remove(), 950); }
    if (fx.combo) document.querySelector('.gb-combo')?.classList.add('gb-bump');
  });
}

/* the timed modes: one step of the reducer; the clock's ticks repaint only the clock */
function step(a) {
  const r = S.run; if (!r?.g || r.g.over || r.phase !== 'play' || !(r.g.kind === 'builder' || r.g.kind === 'rush')) return;
  const before = r.g;
  r.g = r.g.kind === 'builder' ? builderStep(r.g, a) : rushStep(r.g, a);
  if (r.g.over) return endRound();
  if (a.type === 'tick') {
    const left = ROUND_MS - r.g.t, el = document.querySelector('[data-clock]'), bar = document.querySelector('.stg-time i');
    if (el) el.textContent = Math.ceil(left / 1000); if (bar) bar.style.width = `${(100 * left) / ROUND_MS}%`;
    return;
  }
  if (r.g === before) return;
  render();
  if (r.g.seq !== before.seq) juice(r.g.flash);
}

const REDUCE = { figure: figureStep, who: quizStep, root: forgeAct, plot: plotStep, duel: duelStep };
function act(a) {
  const r = S.run; if (!r?.g || r.g.over || r.phase !== 'play' || !REDUCE[r.g.kind]) return;
  const before = r.g, g = (r.g = REDUCE[r.g.kind](r.g, a));
  if (g === before) return;
  if (g.over) return endRound();
  render();
  if (g.seq !== before.seq) {
    if (g.kind === 'duel' && g.which && !before.which) return juice({ ok: g.which.ok, gain: g.which.ok ? 1 : 0 });
    if (g.kind === 'figure' && g.spot && !before.spot) return juice(g.spot);
    if (g.kind === 'figure' && g.wres && !before.wres) return juice({ ok: g.wres.ok, gain: g.wres.ok ? 1 : 0 });
    juice(g.state);
    if (g.state?.ok) { const seq = g.seq; if (adv) clearTimeout(adv); adv = setTimeout(() => { adv = null; if (S.run === r && r.g?.seq === seq && r.g.state) act({ type: 'next' }); }, g.kind === 'plot' && g.rounds[g.i].type !== 'missing' ? 1600 : 1100); }
  }
}

const UNIT = { builder: 'sentences', rush: 'commas', figure: 'figures', who: 'lines', plot: 'scenes in order', root: 'words forged', duel: 'lines made strong' };
/* a round ends: its items go into the memory, what it earned is banked, and the run adds it up */
function endRound() {
  stopTimer();
  const r = S.run, k = kid(), g = r.g, rec = recOf(r.id), now = Date.now();
  const log = roundLog(g), had = rec.seen || {}, met = new Set(log.filter((x) => x.key && !had[x.key]).map((x) => x.key)).size;
  const mem = memRecord(memOf(rec), log, now); rec.seen = mem.seen; rec.rounds = mem.plays; rec.plays = (rec.plays || 0) + 1;   // a round played (the Game On medal counts these)
  const acc = accuracy(g);
  bumpDay(k, 'right', acc.right); bumpDay(k, 'answers', acc.total);
  r.last = { score: g.score, acc, met, earned: r.challenge ? 0 : roundPay(g), duel: g.kind === 'duel' ? { ...duelTally(g), rival: g.rival } : null, speed: g.speed || 0 };
  r.run = runAdd(r.run, g, met);
  save();
  if (r.run.round <= RUN_ROUNDS) { stopMusic(); stillScene(false); r.phase = 'between'; sfx('finish'); render(); return; }
  finishRun();
}

/* the finish: stars, the level check (the owner's rule, from the level played), and the coins — paid here,
   all of them, so the card can say exactly what reached the wallet (T6) */
function finishRun() {
  if (S.run?.challenge) return finishChallenge();
  stopTimer(); stopMusic(); stillScene(false);
  const r = S.run, k = kid(), id = r.id, gm = GAMES[id], run = r.run, rec = recOf(id), L = run.level;
  const score = runScore(run), pct = runPct(run), stars = starsFor(runStarPct(run)), enough = run.total >= (gm.timed ? 4 : 1);
  rec.runs = (rec.runs || 0) + 1; const newBest = score > (rec.best || 0); rec.best = Math.max(rec.best || 0, score);
  rec.stars = { ...(rec.stars || {}) }; const newStars = stars > (rec.stars[L] || 0); rec.stars[L] = Math.max(rec.stars[L] || 0, stars);
  const lv = settleLevel(rec, L, enough ? pct : null);
  const owed = runPay(run); let coins = 0;
  for (let i = 0; i < owed; i++) coins += pay('answer', `${gm.name}: level ${L}`);
  if (lv.firstUp) coins += pay('stop', `${gm.name}: level ${lv.after} reached`);
  r.result = { pct, stars, newStars, score, before: lv.before, after: lv.after, lv, played: L, next: nextStepFor(id, { misses: run.misses }), bestCombo: run.bestCombo, met: run.met, scores: run.scores, bonus: run.bonus, coins, owed, banked: run.banked || 0 };
  k.last = { what: 'game', title: gm.name, right: `${run.right} ${UNIT[id]}`, at: Date.now() };
  r.phase = 'done'; r.newBest = newBest; sfx('finish'); save(); render(); if (newBest || stars === 3) confetti(); checkMedals(); render();
}

/* ---------- the screens ---------- */
const roundName = (run) => (isFinal(run) ? 'Final' : `Round ${run.round + 1} of ${RUN_ROUNDS}`);
const backTo = (r) => (r.hub ? { label: HUBS[r.hub].name, href: `#/play/${r.hub}` } : { label: 'Play', href: '#/play' });

export function gameView() {
  const r = S.run;
  if (r?.phase === 'hub') { stillScene(false); afterRender(); return hubView(r.hub); }
  const gm = GAMES[r?.id]; if (!gm) return empty('oops', 'That game is not here.', link('Play', '#/play'));
  const id = r.id, onStage = !!gm.hub;
  stillScene(r.phase === 'play'); afterRender();
  const head = pageHead({ title: gm.name, sub: `practises ${gm.practises}`, back: backTo(r) });
  if (id === 'root' && r.phase === 'title') return head + forgeTitle(r, challengeButton(id, kid(), recOf(id)));   // Root Forge: views/forge.js
  if (id === 'root' && r.phase === 'book') return head + forgeBook(r);
  if (id === 'root' && r.phase === 'play') return head + `<div class="game">${forgePlay(r.g, r, { roundName: roundName(r.run), runScore: runScore(r.run) })}</div>`;
  if (r.phase === 'title') return head + (onStage ? titleStage(id, r) : titleCard(id, r));
  if (r.phase === 'done') return head + (r.result?.challenge ? challengeDoneView(id, r) : doneView(id, r));
  if (r.phase === 'between') return head + betweenView(id, r);
  return head + `<div class="game">${onStage ? stagePlay(id, r.g, r) : board(id, r.g, bodyOf(id, r.g))}</div>`;
}

/* the title of a hub mode, on its stage: how it plays, the level chip, what is new, Start and Challenge */
function titleStage(id, r) {
  const gm = GAMES[id], k = kid(), rec = k.games[id] || {}, L = playLevel(rec), pool = r.ready ? levelPool(id, L) : null, c = pool ? memCounts(pool.items, pool.key, memOf(rec)) : null;
  const stars = Object.values(rec.stars || {}).reduce((a, b) => a + (b || 0), 0);
  return `<div class="game">${stage({ id: 'title-' + id, world: gm.world, dark: isDark(), mods: 'stg-title-card',
    left: { v: rec.best || '—', l: 'best' }, right: { v: stars, l: `star${stars === 1 ? '' : 's'}` }, title: gm.name, chip: levelChip(id, { stars: true }),
    main: `<div class="stg-paper stg-howto" data-play><img class="stg-quill" src="${mascot('wave')}" alt=""><p class="stg-lead">${esc(gm.how)}</p>
      <p class="gb-level"><b>Level ${L}</b> · ${esc(gm.levels[L])}</p>
      <p class="gb-mem" data-mem>${c ? `<b>${c.fresh}</b> new to you · <b>${c.back}</b> to win back · pool ${c.pool}` : 'Getting the cards ready…'}</p>
      <p class="note">A run is ${RUN_ROUNDS} rounds and a final — ${esc(gm.final.charAt(0).toLowerCase() + gm.final.slice(1))}. Stars and coins come only from what you get right: half right earns the first star.</p>
      <p class="note">Keys: ${esc(gm.keys)} — or just tap.</p>${r.err ? `<p class="note" role="alert">${esc(r.err)}</p>` : ''}</div>`,
    controls: `${btn('Start', 'game-start', { ic: 'next', cls: 'stg-go' })}${challengeButton(id, k, rec)}`, fit: true })}</div>`;
}
/* the title card of a game on its own card (Who Said It?, Plot Line, Root Forge) */
function titleCard(id, r) {
  const gm = GAMES[id], k = kid(), rec = k.games[id] || {}, L = playLevel(rec), pool = r.ready ? levelPool(id, L) : null, c = pool ? memCounts(pool.items, pool.key, memOf(rec)) : null;
  return `<div class="game"><div class="card titlecard"><div class="plate" style="background-image:url('${boardPlate(gm.world)}')"><img class="gb-ava" src="${avatarOf(k)}" alt=""><img class="tc-quill" src="${mascot('wave')}" alt=""></div>
    <h2>${esc(gm.name)}</h2><p style="margin:0;max-width:52ch">${esc(gm.how)}${gm.more ? ` ${esc(gm.more)}` : ''}</p><p class="note" style="margin:0">Keys: ${esc(gm.keys)} — or just tap.</p>
    ${levelChip(id, { stars: true })}
    <p class="gb-level" style="margin:0"><b>Level ${L}</b> · ${esc(gm.levels[L])}${rec.best ? ` · your best ${rec.best}` : ''}</p>
    <p class="gb-mem" data-mem style="margin:0">${c ? `<b>${c.fresh}</b> new to you · <b>${c.back}</b> to win back · pool ${c.pool}` : 'Getting the cards ready…'}</p>
    <p class="note" style="margin:0">A run is ${RUN_ROUNDS} rounds and a final — ${esc(gm.final.charAt(0).toLowerCase() + gm.final.slice(1))}. Stars and coins come from what you get right.</p>
    ${r.err ? `<p class="note" role="alert">${esc(r.err)}</p>` : ''}<div class="row" style="justify-content:center">${btn('Start', 'game-start', { ic: 'next' })}${challengeButton(id, k, rec)}</div></div></div>`;
}

function betweenView(id, r) {
  const gm = GAMES[id], run = r.run, x = r.last, pct = x.acc.pct == null ? '—' : `${Math.round(x.acc.pct * 100)}%`, nextFinal = isFinal(run);
  const duel = x.duel?.rival ? `<p class="gb-duelres">${x.duel.you > x.duel.them ? `You won the duel against ${esc(x.duel.rival.name)}, ${x.duel.you}–${x.duel.them}.` : x.duel.you < x.duel.them ? `${esc(x.duel.rival.name)} won this one, ${x.duel.them}–${x.duel.you}. Your lines still scored.` : `A draw with ${esc(x.duel.rival.name)}, ${x.duel.you}–${x.duel.them}.`}</p>` : '';
  const banked = r.challenge ? '' : `<p class="note gb-banked" data-banked="${run.banked || 0}">${run.banked ? `${run.banked} coin${run.banked === 1 ? '' : 's'} waiting — paid at the finish if the whole run is half right or better${CHANCE[id] ? ', counting out lucky guesses' : ''}.` : 'Coins come for what you get right first time — and reach your wallet at the finish.'}</p>`;
  return `<div class="game">${stage({ id: 'between-' + id, world: gm.world, dark: isDark(), mods: 'stg-between',
    left: { v: x.score, l: 'this round' }, right: { v: runScore(run), l: 'run so far' }, title: nextFinal ? 'Now the final' : `Round ${run.round} done`, chip: levelTag(run.level, `${run.round} of ${RUN_ROUNDS + 1} done`),
    main: `<div class="stg-paper stack gb-between" data-game="${id}" data-play>${duel}
      <div class="gb-stats"><span><b>${pct}</b><small>accuracy</small></span><span><b>${x.met}</b><small>new to you</small></span></div>
      ${x.speed ? `<p class="note">${x.speed} built fast — +${x.speed} time bonus.</p>` : ''}${banked}
      <p class="note">${nextFinal ? `The final: ${esc(gm.final.charAt(0).toLowerCase() + gm.final.slice(1))}.` : 'The next round brings new ones — anything you missed comes back on another day.'}</p></div>`,
    controls: btn(nextFinal ? 'Play the final' : 'Next round', 'game-round', { ic: 'next', cls: 'stg-go' }), fit: true })}</div>`;
}

/* Challenge mode on the title card: play it if owned, else its printed price (the wallet decides; never below zero) */
function challengeButton(id, k, rec) {
  if (ownsMode(k, id)) return btn(`Challenge${rec.chBest ? ` · best ${rec.chBest}` : ''}`, 'game-challenge', { cls: 'out', ic: 'star' });
  const bal = balance(k.name);
  return `<span class="gb-mode">${btn(`Unlock Challenge · ${MODE_PRICE} coins`, 'game-mode-buy', { cls: 'out', ic: 'lock', dis: bal < MODE_PRICE })}<small class="note">${esc(modeWhat)}${bal < MODE_PRICE ? ` — you have ${bal}` : ''}</small></span>`;
}
function challengeDoneView(id, r) {
  const gm = GAMES[id], res = r.result, pct = res.pct == null ? '—' : `${Math.round(res.pct * 100)}%`;
  return `<div class="game">${stage({ id: 'done-' + id, world: gm.world, dark: isDark(), mods: 'stg-done gb-done',
    left: { v: res.score, l: 'score' }, right: { v: res.best, l: 'challenge best' }, title: 'Challenge', chip: levelTag(res.played),
    main: `<div class="stg-paper finish stack" data-play data-coins="0"><img src="${mascot(res.pct >= STAR_LINE ? 'cheer' : 'think')}" alt=""><div class="score">${res.score}</div>
      <p>${res.newBest ? 'A new best!' : `Your best is ${res.best}.`} A challenge moves no level and earns no coins — it is for the fun of beating yourself.</p>
      <div class="gb-stats"><span><b>${pct}</b><small>accuracy</small></span><span><b>${res.bestCombo}</b><small>most in a row</small></span></div>
      <a class="gb-next card" href="${esc(res.next.href)}" data-next>${icon('path')}<span><small>Your next step — ${esc(res.next.why)}</small><b>${esc(res.next.label)}</b></span>${icon('next')}</a></div>`,
    controls: `${btn('Again', 'game-challenge', { ic: 'undo' })}${btn('A normal run', 'game-start', { cls: 'out', ic: 'play' })}`, fit: true })}</div>`;
}
function doneView(id, r) {
  const gm = GAMES[id], res = r.result, pct = res.pct == null ? '—' : `${Math.round(res.pct * 100)}%`, lv = res.lv;
  const lvLine = !lv.checked ? `Level ${res.played} stays — nothing was tried, so nothing moved.` : lv.up ? `Level ${lv.before} → ${lv.after}: up a level — ${gm.levels[lv.after]}.` : lv.drop ? lv.line : `Level ${lv.after} stays — ${gm.levels[lv.after]}. 80% moves you up.`;
  const half = CHANCE[id] ? 'half right or better, counting out lucky guesses' : 'half right or better';
  const coinLine = res.coins ? `${res.coins} coin${res.coins === 1 ? '' : 's'} to your wallet — for what you got right${lv.firstUp ? `, and level ${lv.after} reached` : ''}.` : res.banked && !res.owed ? `No coins this time: coins come when the whole run is ${half}.` : res.owed && !res.coins ? 'Your coins for today are all earned — come back tomorrow.' : 'No coins this time: coins come for what you get right first time.';
  return `<div class="game">${stage({ id: 'done-' + id, world: gm.world, dark: isDark(), mods: 'stg-done gb-done',
    left: { v: res.score, l: 'run score' }, right: { v: kid().games[id].best, l: r.newBest ? 'a new best' : 'your best' }, title: gm.name, chip: levelTag(res.played),
    main: `<div class="stg-paper finish stack" data-play data-coins="${res.coins}"><img src="${mascot(res.stars ? 'cheer' : 'think')}" alt="">${starRow(res.stars)}
      <p>Level ${res.played}: ${res.stars ? `${res.stars} star${res.stars === 1 ? '' : 's'}${res.newStars ? ' — your most yet on this level' : ''}` : `no star this time — ${CHANCE[id] ? 'half right, counting out lucky guesses,' : 'half right'} earns the first`}. Rounds ${res.scores.slice(0, RUN_ROUNDS).join(' · ')} · final ${res.scores[RUN_ROUNDS] ?? 0}${res.bonus ? ` (with +${res.bonus} for speed)` : ''}.</p>
      <div class="gb-stats"><span><b>${pct}</b><small>accuracy</small></span><span><b>${res.met}</b><small>new items met</small></span><span><b class="gb-coins">${res.coins}</b><small>coins</small></span></div>
      <p class="note gb-coinline">${esc(coinLine)}</p>
      <p class="note">You practised ${esc(gm.practises)}. Most in a row: ${res.bestCombo}.</p><p class="gb-lvchange${lv.drop ? ' gb-kind' : ''}">${esc(lvLine)}</p>
      <a class="gb-next card" href="${esc(res.next.href)}" data-next>${icon('path')}<span><small>Your next step — ${esc(res.next.why)}</small><b>${esc(res.next.label)}</b></span>${icon('next')}</a></div>`,
    controls: `${btn('Play again', 'game-start', { ic: 'undo' })}${link(r.hub ? HUBS[r.hub].name : 'All games', r.hub ? `#/play/${r.hub}` : '#/play', { cls: 'out', ic: 'play' })}`, fit: true })}</div>`;
}

/* ---------- the stage: the hub modes in play ---------- */
const kb = (n) => `<kbd>${n}</kbd>`;
const optBtn = (act, i, label, st, answer, extra = '') => `<button class="opt${st ? (i === answer ? ' right' : st.pick === i ? ' wrong' : '') : ''}" data-act="${act}" data-arg="${i}" ${st ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${label}</span>${extra}</button>`;
const GLOSS = Object.fromEntries(FIGURE_KINDS.map(([k, , g]) => [k, g]));
const okNote = (title, body) => `<div class="feedback ok" role="status"><div class="hd">${icon('check')}${esc(title)}</div>${body ? `<div>${body}</div>` : ''}</div>`;
const pipsOf = (g) => `<div class="gb-pips" role="img" aria-label="${(g.results || []).length} of ${g.rounds.length} done">${g.rounds.map((_, i) => `<i class="pip${i < g.results.length ? (g.results[i] ? ' ok' : ' no') : i === g.i ? ' cur' : ''}"></i>`).join('')}</div>`;

function stagePlay(id, g, r) {
  const gm = GAMES[id], k = kid(), timed = gm.timed, run = r.run;
  const left = timed ? { v: `<span data-clock>${Math.ceil((ROUND_MS - g.t) / 1000)}</span>`, l: r.paused ? 'paused' : 'seconds', label: 'seconds left' }
    : g.kind === 'duel' ? { v: duelTally(g).you, l: 'you', img: avatarOf(k) } : { v: `${Math.min(g.i + 1, g.rounds.length)}/${g.rounds.length}`, l: 'item' };
  const right = g.kind === 'duel' && g.rival ? { v: duelTally(g).them, l: g.rival.name, img: rivalArt(g.rival.id) } : { v: `<span class="gb-score-v">${g.score}</span>`, l: `run ${runScore(run) + g.score}` };
  const track = timed ? `<div class="stg-time"><i style="width:${(100 * (ROUND_MS - g.t)) / ROUND_MS}%"></i></div>` : pipsOf(g);
  const parts = id === 'builder' ? builderStage(g) : id === 'rush' ? rushStage(g) : id === 'figure' ? figureStage(g) : duelStage(g);
  return stage({ id, world: gm.world, dark: isDark(), mods: `stg-play${r.final ? ' stg-final' : ''}`, left, right, title: gm.name,
    chip: `${levelTag(g.level, roundName(run))}<span class="gb-combo${g.combo >= 2 ? ' on' : ''}" aria-live="polite">${g.combo >= 2 ? `${g.combo} in a row` : ''}</span>`, track, ...parts, fit: true });
}

function builderStage(g) {
  const c = g.cur;
  if (g.hold) return { main: `<div class="stg-paper strip held" data-play>${missCard({ type: 'sentence', right: g.hold.right, why: g.hold.why.text }, g.hold.given)}</div>` };
  const pieces = g.picks.map((i, j) => { let t = c.tiles[i].text; if (j === 0 && g.cap) t = t.charAt(0).toUpperCase() + t.slice(1);
    return `<span class="piece${j === g.picks.length - 1 ? ' gb-slide' : ''}">${esc(t)}</span><button class="cgap${g.commas.includes(j) ? ' on' : ''}" data-act="b-comma" data-arg="${j}" aria-pressed="${g.commas.includes(j)}" aria-label="a comma after “${esc(c.tiles[i].text)}”">${g.commas.includes(j) ? ',' : ''}</button>`; }).join('');
  const fl = g.flash?.ok ? `<p class="stg-flash ok" role="status">${icon('check')}${g.flash.bonus ? 'The other way round! +1' : 'Right!'}${g.flash.fast ? ' Fast: +1' : ''} <span>${esc(g.flash.text)}</span></p>` : '';
  return {
    main: `<p class="prompt">${g.final ? 'Rush hour: build each inside 8 seconds for +1. ' : ''}Build one sentence. One piece does not belong.</p>
      <div class="stg-paper strip" data-play><button class="capbtn${g.cap ? ' on' : ''}" data-act="b-cap" aria-pressed="${g.cap}" aria-label="a capital letter at the start" ${g.picks.length ? '' : 'disabled'}>Aa</button>
        <div class="built-line">${pieces || '<span class="muted">tap a piece to start</span>'}${g.picks.length ? `<span class="endmark">${esc(c.it.end)}</span>` : ''}</div></div>${fl}`,
    tray: `<div class="tiles stg-tiles">${c.tiles.map((t, i) => `<button class="tile" data-act="b-pick" data-arg="${i}" ${g.picks.includes(i) ? 'disabled' : ''}>${kb(i + 1)}${esc(t.text)}</button>`).join('')}</div>`,
    controls: `${btn('Undo', 'b-undo', { ic: 'undo', cls: 'out stg-pair', dis: !g.picks.length })}${btn('Check', 'b-check', { ic: 'check', cls: 'stg-pair', dis: g.picks.length < 2 })}`,
  };
}
function rushStage(g) {
  const c = g.cur;
  if (g.hold) return { main: `<div class="stg-paper strip held" data-play>${missCard({ type: 'commas', words: c.words, commas: c.commas, rule: c.rule }, g.hold.sel)}</div>` };
  const fl = g.flash?.ok ? `<p class="stg-flash ok" role="status">${icon('check')}Clean!${g.flash.fast ? ' Fast: +1' : ''}</p>` : '';
  return {
    main: `<p class="prompt">${g.final ? 'Rush hour: a clean sentence inside 10 seconds is +1. ' : ''}Tap every gap that needs a comma.</p>
      <div class="stg-paper strip" data-play><div class="sent rush-sent">${c.words.map((w, i) => `<span class="word">${esc(w)}</span>${i < c.words.length - 1 ? `<button class="gap${g.sel.includes(i) ? ' on' : ''}${g.cursor === i ? ' cursor' : ''}${g.sel.includes(i) && g.cursor === i ? ' gb-glow' : ''}" data-act="r-gap" data-arg="${i}" aria-pressed="${g.sel.includes(i)}" aria-label="gap after ${esc(w)}">${g.sel.includes(i) ? ',' : ''}</button>` : ''}`).join('')}</div></div>${fl}`,
    controls: btn('Next sentence', 'r-submit', { ic: 'next', cls: 'stg-go' }),
  };
}
function figureStage(g) {
  const q = g.rounds[g.i], st = g.state, ph = figurePhase(g, q), name = q.options[q.answer], kind = q.kinds[q.answer];
  const src = `<p class="subp">${esc(q.work)} — exact, as the book has it.</p>`;
  if (ph === 'spot') {
    const sp = g.spot;
    if (sp && !sp.ok) return { main: `<div class="stg-paper" data-play>${missCard({ type: 'spot', sentences: q.sentences, at: q.at, why: `The figure is in sentence ${q.at + 1}. Now: the words that make it, and its name.` }, sp.pick, { title: 'Not that one', go: 'Go on' })}</div>${src}` };
    return { main: `<p class="prompt">Hunt it: one of these sentences holds a figure of speech. Tap it.</p><div class="stg-paper gb-passage" data-play>${q.sentences.map((s, i) => `<button class="gb-sent" data-act="fig-spot" data-arg="${i}">${kb(i + 1)}<span>${esc(s)}</span></button>`).join('')}</div>${src}` };
  }
  const lineHtml = `<blockquote class="stg-paper prompt big" data-play>“${esc(q.text)}”</blockquote>`;
  if (ph === 'words') {
    const w = g.wres;
    if (w && !w.ok) return { main: `<div class="stg-paper" data-play>${missCard({ type: 'words', tokens: q.tokens, want: q.want, why: q.wordRule === 'simile' ? 'A simile’s comparison word is “like” or “as” — the lit words.' : 'Alliteration: the lit words share their first sound.' }, w.sel, { title: 'Not those words', go: 'Go on — name it' })}</div>${src}` };
    const sel = new Set(g.wsel || []);
    return { main: `<p class="prompt">${q.hunt ? 'Found it. ' : ''}Tap the words that make the figure — then Check.</p><div class="stg-paper wordline" data-play>${q.tokens.map((t, i) => `<button class="wtok${sel.has(i) ? ' on' : ''}" data-act="fig-tap" data-arg="${i}" aria-pressed="${sel.has(i)}">${esc(t)}</button>`).join('')}</div>${src}`,
      controls: btn('Check the words', 'fig-words', { ic: 'check', cls: 'stg-go', dis: !sel.size }) };
  }
  const tapped = q.want && g.wres?.ok ? `<p class="note">The words: ${q.want.map((i) => `<b>${esc(q.tokens[i])}</b>`).join(' ')}</p>` : '';
  return { main: `<p class="prompt">${q.want || q.hunt ? 'Now name the figure.' : 'Which figure of speech is this — or none?'}</p>${lineHtml}${src}${tapped}
      ${st && !st.ok ? missCard({ type: 'choice', options: q.options, answer: q.answer, why: `${name}: it ${GLOSS[kind]}.` }, st.pick, { title: `It is ${name.toLowerCase()}` }) : ''}${st?.ok ? okNote(st.whole ? 'Right!' : `Right — ${name.toLowerCase()}`, `${esc(name)}: it ${esc(GLOSS[kind])}.`) : ''}`,
    tray: `<div class="opts stg-opts">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>` };
}
function duelStage(g) {
  const q = g.rounds[g.i], st = g.state, wt = WORKS.find((x) => x.id === q.work), who = wt ? `${wt.author}, ${wt.title}` : '', rv = g.rival;
  /* the rival is said to be what it is: one of Bee's made-up rivals, its points the app's own (never a real child) */
  const rvNote = rv ? `<p class="subp gb-rival-note">${esc(rv.name)}, ${rv.age}, is one of Bizzing Bee’s made-up rivals; the points are the app’s own.${st ? ` <b class="gb-rvline">${esc(rv.name)}: ${rv.pts[g.i] ? 'made this one strong' : 'missed this one'}</b>` : ''}</p>` : '';
  const gloss = `${q.device.charAt(0).toUpperCase() + q.device.slice(1)}: ${DEVICE_GLOSS[q.device] || ''}.`;
  if (g.stage === 'which') return { main: `<p class="prompt">Which line is stronger?</p><div class="gb-duel" data-play>${q.versions.map((v, i) => `<button class="stg-paper gb-version" data-act="du-pick" data-arg="${i}">${kb(i + 1)}<span class="gb-vtext">${esc(v)}</span></button>`).join('')}</div>${rvNote}` };
  const whichNote = g.which ? `<p class="subp gb-which ${g.which.ok ? 'ok' : 'no'}">${g.which.ok ? 'Yes — that was the original.' : 'The other one was the original.'}</p>` : '';
  if (st && !st.ok) return { main: `${whichNote}<div class="stg-paper strip held" data-play>${missCard({ type: 'line', right: q.original, why: `${st.buildOk ? 'You built it — but picked the plain line first. ' : ''}${gloss} — ${who}` }, st.buildOk ? '' : st.built, { title: st.buildOk ? 'Built — the pick was the plain one' : 'Here is the line as it was written' })}</div>${rvNote}` };
  if (st?.ok) return { main: `<div class="stg-paper strip" data-play><p class="built-line done">${esc(q.original)}</p></div>${okNote(`Strong! That is ${q.device}`, `${esc(gloss)} <small>— ${esc(who)}</small>`)}${rvNote}` };
  return {
    main: `${whichNote}<p class="prompt">Make it strong: build the line as the author wrote it. One piece is plain and does not belong.</p>
      <p class="subp gb-plain"><span>The plain version</span> ${esc(q.plain)}</p>
      <div class="stg-paper strip" data-play><div class="built-line">${g.picks.map((i, j) => `<span class="piece${j === g.picks.length - 1 ? ' gb-slide' : ''}">${esc(q.tiles[i].text)}</span>`).join('') || '<span class="muted">tap the pieces in order</span>'}</div></div>${rvNote}`,
    tray: `<div class="tiles stg-tiles">${q.tiles.map((t, i) => `<button class="tile" data-act="du-tile" data-arg="${i}" ${g.picks.includes(i) ? 'disabled' : ''}>${kb(i + 1)}${esc(t.text)}</button>`).join('')}</div>`,
    controls: `${btn('Undo', 'du-undo', { ic: 'undo', cls: 'out stg-pair', dis: !g.picks.length })}${btn('Check', 'du-check', { ic: 'check', cls: 'stg-pair', dis: !g.picks.length })}`,
  };
}

/* ---------- the board: the games still on their own card ---------- */
function pips(g, n) {
  const res = g.results || [];
  return `<div class="gb-pips" role="img" aria-label="${res.length} of ${n} done">${Array.from({ length: n }, (_, i) => `<i class="pip${i < res.length ? (res[i] ? ' ok' : ' no') : i === g.i ? ' cur' : ''}"></i>`).join('')}</div>`;
}
function board(id, g, body) {
  const gm = GAMES[id], k = kid(), r = S.run, last = g.state;
  const pose = last ? (last.ok ? 'cheer' : 'think') : 'point';
  return `<div class="gboard${r.final ? ' gb-final' : ''}" data-game="${id}" style="--plate:url('${boardPlate(gm.world)}')">
    <div class="gb-bar"><img class="gb-ava" src="${avatarOf(k)}" alt=""><span class="gb-round">${roundName(r.run)}</span>${pips(g, g.rounds.length)}
      <span class="gb-combo${g.combo >= 2 ? ' on' : ''}" aria-live="polite">${g.combo >= 2 ? `${g.combo} in a row` : ''}</span>
      <span class="gb-score"><b>${g.score}</b><small>run ${runScore(r.run) + g.score}</small></span></div>
    <div class="gb-frame">${body}</div>
    <div class="gb-foot"><img class="gb-quill" src="${mascot(pose)}" alt=""><span class="gb-level"><b>Level ${g.level}</b> · ${esc(r.final ? gm.final : gm.levels[g.level])}</span></div></div>`;
}
const fb = (st, title, body, missItem) => (!st ? '' : st.ok ? okNote(title, body) : missCard(missItem || { type: 'note', why: '' }, st.pick, { title, whyHtml: true }));
function bodyOf(id, g) {
  const q = g.rounds[g.i], st = g.state;
  if (g.kind === 'who') {
    const shown = q.clues.slice(0, g.clue), worth = [3, 2, 1, 1][Math.min(g.clue, 3)];
    return `<blockquote class="prompt big" style="margin:0">“${esc(q.text)}”</blockquote>
      <div class="gb-case"><span class="gb-worth">${icon('search')}Worth ${worth} point${worth === 1 ? '' : 's'}</span>
        ${!st && g.clue < q.clues.length ? btn(g.clue ? 'Another clue' : 'A clue', 'who-clue', { ic: 'key', cls: 'out', attrs: 'data-clue' }) : ''}</div>
      ${shown.length ? `<ol class="gb-clues">${shown.map((c) => `<li class="gb-slide">${esc(c.text)}</li>`).join('')}</ol>` : ''}
      <p class="subp">Who said it — or wrote it?</p>
      <div class="opts">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>${fb(st, st?.ok ? `Right! +${st.gain}` : 'Not this time', `${esc(q.right)}${q.work ? `, ${esc(q.work)}` : ''}.`, { type: 'choice', options: q.options, answer: q.answer, why: `${esc(q.right)}${q.work ? `, ${esc(q.work)}` : ''}.` })}`;
  }
  if (g.kind === 'root') {
    const piece = st ? q.options[st.pick] : '?', aff = (x) => `<span class="gb-aff${st ? (st.ok ? ' ok' : ' no') : ''}">${esc(x)}</span>`, base = `<span class="gb-base">${esc(q.base)}</span>`, f = q.family;
    const done = f ? g.rounds.slice(g.i - f.step, g.i).map((x, j) => (g.results[g.i - f.step + j] ? x.word : '…')) : [];
    const famHead = f ? `<div class="gb-family"><span class="kick">Forge a family — word ${f.step + 1} of ${f.of}</span><b>${f.root ? `the root “${esc(f.base)}”` : `“${esc(f.base)}”`}</b><span class="gb-famwords">${[...done, ...Array(f.of - done.length).fill('?')].map((w) => `<i>${esc(w)}</i>`).join('')}</span></div>` : '';
    const def = q.def ? `<b>${esc(q.word)}</b>${q.ps ? ` (${esc(q.ps)})` : ''}: ${esc(q.def)}.` : '';
    return `${famHead}<p class="prompt">${q.kind === 'root' ? `The root “${esc(q.base)}” means “${esc(q.meaning)}”. Which piece forges a real word?` : `Which ${q.before ? 'prefix' : 'ending'} makes a real word with “${esc(q.base)}”?`}</p>
      <div class="gb-forge${st?.ok ? ' gb-fused' : ''}">${q.before ? aff(piece.replace(/-$/, '')) + base : base + aff(piece.replace(/^-/, ''))}</div>
      <div class="opts four">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>
      ${fb(st, st?.ok ? `Forged: ${q.word}` : 'No such word in Bee’s list', def, { type: 'choice', options: q.options, answer: q.answer, why: `${st && !st.ok ? `“${esc(q.options[st.pick].replace(/-/g, ''))}” and “${esc(q.base)}” make no word in the list. The real one is <b>${esc(q.word)}</b>. ` : ''}${def}` })}`;
  }
  if (g.kind === 'plot') {
    if (q.type === 'missing') {
      const rows = q.cards.map((c, j) => (j === q.gap ? `<li class="gb-slot gb-gap${st ? (st.ok ? ' ok' : ' no') : ''}"><b>${j + 1}</b><span>${st ? esc(c.text) : '?'}</span></li>` : `<li class="gb-slot full"><b>${j + 1}</b><span>${esc(c.text)}</span></li>`)).join('');
      return `<p class="prompt">${esc(q.title)}: one scene is missing. Which one goes in the gap?</p><ol class="gb-line">${rows}</ol>
        <div class="opts gb-scenes">${q.options.map((o, i) => optBtn('q-pick', i, esc(o), st, q.answer)).join('')}</div>
        ${fb(st, st?.ok ? 'That is the missing scene!' : 'Not that one', `Scene ${q.gap + 1} opens: “${esc(q.cards[q.gap].text)}” The others come from elsewhere in the book.`, { type: 'choice', options: q.options, answer: q.answer, why: `Scene ${q.gap + 1} opens: “${esc(q.cards[q.gap].text)}” — it now stands in the gap. The others come from elsewhere in the book.` })}`;
    }
    const n = q.cards.length, done = !!st;
    const slots = Array.from({ length: n }, (_, j) => { const c = g.line[j]; const good = done && j > 0 && q.cards[c].at === q.cards[g.line[j - 1]].at + 1;
      return `<li class="gb-slot${c != null ? ' full' : ''}${!done && c == null && g.slot === j ? ' cursor' : ''}${done ? (good || (j === 0 && q.cards[c].at === 0) ? ' ok' : ' no') : ''}${c != null && c === g.stack[g.stack.length - 1] && !done ? ' gb-slide' : ''}" data-slot="${j}" ${!done && c == null ? `data-act="pl-slot" data-arg="${j}"` : ''}><b>${j + 1}</b><span>${c != null ? esc(q.cards[c].text) : ''}</span>${done ? `<small${q.cards[c].at === j ? '' : ' class="miss-fix"'}>scene ${q.cards[c].at + 1}</small>` : ''}</li>`; }).join('');
    const cards = q.cards.map((c, i) => g.line.includes(i) ? '' : `<button class="tile gb-card${g.cursor === i ? ' cursor' : ''}" data-act="pl-place" data-arg="${i}"><kbd>${i + 1}</kbd><span>${esc(c.text)}</span></button>`).join('');
    return `<p class="prompt">${esc(q.title)}: drag the scenes onto the line in the order they happen — or tap them in order.</p><ol class="gb-line">${slots}</ol>
      ${done ? '' : `<div class="gb-cards">${cards}</div><div class="row">${btn('Undo', 'pl-undo', { ic: 'undo', cls: 'out', dis: !g.stack.length })}</div>`}
      ${fb(st, st?.ok ? 'In order — every scene!' : `${st?.pairs} of ${st?.max} pairs in order`, st ? `Each card is the first sentence of a scene in “${esc(q.title)}”. The small number is where it really comes.` : '', { type: 'note', why: st ? `Each card is the first sentence of a scene in “${esc(q.title)}”. The small number on each is where it really comes — the true order, in place.` : '' })}`;
  }
  return '';
}

/* ---------- actions ---------- */
const stepOrAct = (a) => (S.run?.g?.kind === 'builder' || S.run?.g?.kind === 'rush' ? step(a) : act(a));
export const PLAY_ACTIONS = {
  'game-start': () => startRun(),
  'game-challenge': () => startRun(true),
  'game-mode-buy': () => { const r = S.run, k = kid(); if (!r?.id) return; if (buyMode(k, r.id, (price, why) => spend(k.name, price, why))) { save(); sfx('unlock'); confetti(); } render(); },
  'game-round': () => { const r = S.run; if (r?.phase === 'between') startRound(); },
  /* the level chip: "<game>:<auto|1–5>" — a hand-set level sticks until the next run's check */
  'lv-set': (a) => { const [id, v] = String(a).split(':'); if (!GAMES[id] || S.run?.phase === 'play') return; setPick(recOf(id), v); sfx('tap'); save(); render(); },
  'game-level': (a) => { const r = S.run; if (!r?.id || r.phase !== 'title') return; PLAY_ACTIONS['lv-set'](`${r.id}:${a}`); },
  'miss-go': () => stepOrAct(S.run?.g?.kind === 'builder' || S.run?.g?.kind === 'rush' ? { type: 'continue' } : { type: 'next' }),
  'b-pick': (a) => { sfx('tap'); step({ type: 'pick', i: +a }); },
  'b-undo': () => step({ type: 'undo' }),
  'b-comma': (a) => { sfx('tap'); step({ type: 'comma', at: +a }); },
  'b-cap': () => { sfx('tap'); step({ type: 'cap' }); },
  'b-check': () => step({ type: 'check' }),
  'r-gap': (a) => { sfx('tap'); step({ type: 'toggle', i: +a }); },
  'r-submit': () => step({ type: 'submit' }),
  'q-pick': (a) => act({ type: 'pick', i: +a }),
  'q-next': () => act({ type: 'next' }),
  'who-clue': () => { sfx('tap'); act({ type: 'clue' }); },
  'fig-spot': (a) => act({ type: 'spot', i: +a }),
  'fig-tap': (a) => { sfx('tap'); act({ type: 'tap', i: +a }); },
  'fig-words': () => act({ type: 'words' }),
  'pl-place': (a) => { if (dragDone) return; sfx('tap'); act({ type: 'place', i: +a }); },
  'pl-slot': (a) => act({ type: 'slot', at: +a }),
  'pl-undo': () => act({ type: 'undo' }),
  'du-pick': (a) => act({ type: 'pick', i: +a }),
  'du-tile': (a) => { sfx('tap'); act({ type: 'tile', i: +a }); },
  'du-undo': () => act({ type: 'undo' }),
  'du-check': () => act({ type: 'check' }),
  ...forgeActions(act),
  // the old names, kept for links and tests written before the reducers
  'who-pick': (a) => act({ type: 'pick', i: +a }), 'fig-pick': (a) => act({ type: 'pick', i: +a }), 'who-next': () => act({ type: 'next' }),
};

setDragAct((a) => { sfx('tap'); act(a); });   // Root Forge's drag (views/forge.js) places through the same reducer
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

/* ---------- keys ---------- */
const notOnControl = (e) => !/^(BUTTON|A)$/.test(e.target?.tagName || '');
export function playKey(e) {
  const r = S.run; if (!r || r.mode !== 'game') return false;
  if (r.phase === 'hub') return false;
  if (!GAMES[r.id]) return false;
  if (r.phase === 'title') {
    if (e.key === 'Enter' && notOnControl(e)) { startRun(); return true; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const rec = recOf(r.id), cur = rec.pick || 0, nx = Math.max(0, Math.min(5, cur + (e.key === 'ArrowRight' ? 1 : -1))); PLAY_ACTIONS['lv-set'](`${r.id}:${nx || 'auto'}`); return true; }
    return false;
  }
  if (r.phase === 'between') { if (e.key === 'Enter' && notOnControl(e)) { startRound(); return true; } return false; }
  if (r.phase !== 'play' || !r.g) return false;
  const g = r.g;
  if ((g.kind === 'builder' || g.kind === 'rush') && g.hold) { if (e.key === 'Enter' || e.key === ' ') { step({ type: 'continue' }); return true; } return false; }
  if (g.kind === 'builder') {
    if (/^[1-9]$/.test(e.key)) { step({ type: 'pick', i: +e.key - 1 }); return true; }
    if (e.key === 'Backspace') { step({ type: 'undo' }); return true; }
    if (e.key === ',') { step({ type: 'comma' }); return true; }
    if (e.key === 'c' || e.key === 'C') { step({ type: 'cap' }); return true; }
    if (e.key === 'Enter') { step({ type: 'check' }); return true; }
    return false;
  }
  if (g.kind === 'rush') {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { step({ type: 'move', d: e.key === 'ArrowRight' ? 1 : -1 }); return true; }
    if (e.key === ' ') { step({ type: 'toggle', i: g.cursor }); return true; }
    if (e.key === 'Enter') { step({ type: 'submit' }); return true; }
    return false;
  }
  if (g.kind === 'root') return forgeKey(e, g, act);
  const q = g.rounds[g.i];
  if (g.kind === 'figure') {
    const ph = figurePhase(g, q);
    if (ph === 'spot') {
      if (g.spot && !g.spot.ok) { if (e.key === 'Enter') { act({ type: 'next' }); return true; } return false; }
      if (new RegExp(`^[1-${q.sentences.length}]$`).test(e.key)) { act({ type: 'spot', i: +e.key - 1 }); return true; }
      return false;
    }
    if (ph === 'words') {
      if (g.wres && !g.wres.ok) { if (e.key === 'Enter') { act({ type: 'next' }); return true; } return false; }
      if (e.key === 'Enter') { act({ type: 'words' }); return true; }
      if (/^[1-9]$/.test(e.key) && +e.key <= q.tokens.length) { act({ type: 'tap', i: +e.key - 1 }); return true; }
      return false;
    }
  }
  if (g.kind === 'duel') {
    if (g.state) { if (!g.state.ok && e.key === 'Enter') { act({ type: 'next' }); return true; } return false; }
    if (g.stage === 'which') { if (/^[12]$/.test(e.key)) { act({ type: 'pick', i: +e.key - 1 }); return true; } return false; }
    if (new RegExp(`^[1-${q.tiles.length}]$`).test(e.key)) { act({ type: 'tile', i: +e.key - 1 }); return true; }
    if (e.key === 'Backspace') { act({ type: 'undo' }); return true; }
    if (e.key === 'Enter') { act({ type: 'check' }); return true; }
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
  if (new RegExp(`^[1-${q.options.length}]$`).test(e.key)) { act({ type: 'pick', i: +e.key - 1 }); return true; }
  return false;
}
