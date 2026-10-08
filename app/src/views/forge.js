/* views/forge.js — ROOT FORGE on the stage (handover C §4.3, §1.3–§1.8): a tray of parts, each with its
   meaning; an anvil of two or three slots; drag a part onto the anvil (or tap it, or press its number — or
   ← → and Enter), lift one off (tap it, or Backspace), and STRIKE (the button, Space or S). A real word —
   one in Bee's list, kid-safe, made of its parts — glows, shows its meaning and goes into the child's FORGE
   BOOK; a non-word cracks, holds, and says what each piece means. The round shows "k of N found" (N is
   every word the tray can forge, counted before it was dealt) and a goal to reach; the run is the shared
   one (play.js: three rounds and a family final, the level chip, pay at the finish). The engine is
   src/forge.js — the only file that knows how parts make a word, so a family drop-in can replace it.

   The Forge Book is the thing a child grows: every word forged, kept by its parts, a part STAMPED once three
   of its words are in it, and the smith's rank rising with the book alone (never with time). It lives on
   k.games.root.book, inside the game record the Store keeps and a backup carries.

   Bee's list (1.2 MB) is fetched in idle time from the Play tab, with its progress on the title, and the
   forge is built from it in a second idle slice — so Start is instant once the fire is lit. */

import '../../styles/forge.css';
import { S, kid, save, render, isDark } from '../app.js';
import { esc, icon, btn, mascot } from '../ui.js';
import { GAMES } from '../games.js';
import { playLevel } from '../hubs.js';
import { stage } from '../stage.js';
import { levelChip, levelTag } from './hubs.js';
import { missCard } from '../miss.js';
import { sfx } from '../sound.js';
import { lexReady, lex as lexNow, setLexicon, loadLexicon } from '../lexicon.js';
import { forgeOf, forgeNew, forgeStep, forgeAccuracy, forgeGoalMet, forgeFamily, forgeIds, bookAdd, bookSize, bookByPart, stamped, rankOf, levelCfg, RULES, STAMP } from '../forge.js';
import * as WP from '../data/wordparts.js';

/* ---------- the fire: Bee's list, fetched with its progress, then the forge built ---------- */
const LOAD = { pct: 0, state: 'idle' };
let F = null, pending = null;
export const forge = () => F;
async function fetchLex() {
  if (lexReady()) return lexNow();
  LOAD.state = 'loading';
  try {
    const res = await fetch('data/bee-words.json'); if (!res.ok || !res.body?.getReader) throw new Error('no stream');
    const total = +res.headers.get('content-length') || 0, rd = res.body.getReader(), parts = []; let got = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; LOAD.pct = Math.min(99, Math.round((100 * got) / Math.max(total, 1210000, got + 1))); paintLoad(); }
    const buf = new Uint8Array(got); let at = 0; for (const p of parts) { buf.set(p, at); at += p.length; }
    const j = JSON.parse(new TextDecoder().decode(buf)); if (!lexReady()) setLexicon(j); return lexNow() || j;
  } catch { return loadLexicon(); }
}
const idle = (f) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 60));
/* the forge, ready: Bee's list fetched, the forge built in an idle slice */
export function forgeReady() {
  if (F) return Promise.resolve(F);
  return (pending ||= fetchLex().then((j) => new Promise((ok) => {
    if (!j?.words) { LOAD.state = 'error'; pending = null; return ok(null); }
    LOAD.pct = 100; paintLoad();
    idle(() => { F = forgeOf(j, WP); LOAD.state = 'ready'; paintLoad(); if (typeof document !== 'undefined') document.documentElement.dataset.forge = 'hot'; ok(F); });   // the browser check reads data-forge
  })));
}
/* the Play tab and the title call this: the list is fetched while the child is still choosing */
export function preloadForge() { if (!F && !pending) idle(() => forgeReady().then(() => { if (S.run?.id === 'root' && S.run.phase === 'title') render(); })); }
function paintLoad() {
  const el = typeof document !== 'undefined' && document.querySelector('[data-forge-load]'); if (!el) return;
  el.querySelector('i')?.style.setProperty('width', `${LOAD.pct}%`);
  const t = el.querySelector('span'); if (t) t.textContent = LOAD.state === 'ready' ? 'The forge is hot.' : LOAD.state === 'error' ? 'Bee’s word list did not load.' : `Lighting the forge — Bee’s words ${LOAD.pct}%`;
  el.classList.toggle('done', LOAD.state === 'ready');
}

/* ---------- the round and the book ---------- */
const recOf = () => (kid().games.root ||= { best: 0, plays: 0, level: 1, pick: null });
export const bookOf = () => recOf().book || {};
/* a new round's state, or null when the forge has nothing to deal */
export function forgeStart(seed, level, final, o = {}) {
  if (!F) return null;
  const round = F.round(seed, level, { ...o, final });
  return round ? forgeNew(round, level) : null;
}
/* one step of the round; a word new to the child goes into the book the moment it is forged */
export function forgeAct(g, a) {
  if (!F) return g;
  const s = forgeStep(F, g, a);
  if (s !== g && s.state?.ok && !s.state.again && s.state !== g.state) {
    const rec = recOf(), had = !!(rec.book || {})[s.state.word];
    if (!had) { rec.book = bookAdd(rec.book || {}, s.state.word, s.state.ids); save(); }
    s.state = { ...s.state, newInBook: !had, rank: rankOf(rec.book) };
    s.shown = s.state;
  }
  if (s !== g && s.state && !s.state.ok) s.shown = null;
  return s;
}

/* ---------- drawing a part ---------- */
const label = (p) => (p.kind === 'prefix' ? `${p.t}-` : p.kind === 'suffix' ? `-${p.t}` : p.t);
const KIND = { prefix: 'prefix', suffix: 'ending', root: 'root', base: 'word' };
/* the part's meaning in this word: the ending -er says "more" on a describing word (bigger), "a person who" on a doer (baker) */
export function senseOf(p, word) {
  if (p.kind === 'suffix' && p.t === 'er' && word && /^(adjective|adverb)$/.test(F?.lex.words[word]?.[2] || '')) return 'more';
  return p.kind === 'base' ? 'a whole word' : p.mean;
}
const partTile = (p, i, g, book) => {
  const on = g.anvil.includes(i), key = g.key === p.id, st = stamped(book, p.id);
  return `<button class="fg-part fg-${p.kind}${on ? ' used' : ''}${g.cursor === i && !on ? ' cursor' : ''}${key ? ' key' : ''}" data-act="fg-place" data-arg="${i}" data-part="${esc(p.id)}" ${on || g.state && !g.state.ok ? 'disabled' : ''} aria-label="${esc(label(p))}: ${esc(senseOf(p))}${on ? ' (on the anvil)' : ''}">
    <kbd>${i + 1}</kbd><b>${esc(label(p))}</b><small>${esc(p.kind === 'base' ? 'word' : p.mean)}</small>${st ? `<i class="fg-stamp" title="stamped in your Forge Book">${icon('star')}</i>` : ''}${key ? '<i class="fg-keytag">family</i>' : ''}</button>`;
};
const ingot = (p, j, g, word) => `<button class="fg-ingot fg-${p.kind}" data-act="fg-lift" data-arg="${j}" ${g.state ? 'disabled' : ''} aria-label="lift ${esc(label(p))} off the anvil"><b>${esc(label(p))}</b><small>${esc(word ? senseOf(p, word) : p.kind === 'base' ? 'word' : p.mean)}</small></button>`;

const ANVIL = `<svg class="fg-iron" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true"><defs>
  <linearGradient id="fgI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a9099"/><stop offset=".12" stop-color="#5d636c"/><stop offset=".55" stop-color="#3a3e45"/><stop offset="1" stop-color="#1e2126"/></linearGradient>
  <linearGradient id="fgH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9a3c" stop-opacity="0"/><stop offset=".5" stop-color="#ff9a3c" stop-opacity=".38"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></linearGradient></defs>
  <path d="M0 22 C40 20 80 12 112 4 L112 0 L600 0 L600 104 L566 108 C520 114 486 122 470 140 L462 164 L512 178 L522 200 L138 200 L148 178 L198 164 L190 140 C176 122 150 112 120 106 C80 86 40 54 0 22 Z" fill="url(#fgI)"/>
  <path d="M6 22 C44 19 82 11 112 3 H596" fill="none" stroke="#c3c8cf" stroke-opacity=".55" stroke-width="3"/>
  <path d="M190 150 H470 L462 164 H198 Z" fill="url(#fgH)"/><rect x="138" y="190" width="384" height="10" fill="url(#fgH)"/></svg>`;
/* the sum, as the glow and the book show it: un (not) + happy (a whole word) = unhappy */
const sumOf = (ids, word) => ids.map((id) => F.part(id)).map((p) => `<span class="fg-term fg-${p.kind}"><b>${esc(label(p))}</b><small>${esc(senseOf(p, word))}</small></span>`).join('<i class="fg-plus">+</i>');

function plaque(st) {
  if (!st) return '';
  if (st.again) return `<div class="fg-plaque again" role="status"><p class="fg-word">${esc(st.word)}</p><p class="fg-def">You forged that one already this round — try another.</p></div>`;
  const def = st.def ? `${st.ps ? `<i>${esc(st.ps)}</i> — ` : ''}${esc(st.def.replace(/[:;.]\s*$/, ''))}.` : '';
  return `<div class="fg-plaque" role="status" data-glow="${esc(st.word)}"><div class="fg-sum">${sumOf(st.ids, st.word)}<i class="fg-eq">=</i><b class="fg-word">${esc(st.word)}</b></div>
    ${def ? `<p class="fg-def">${def}</p>` : ''}${st.rule ? `<p class="fg-rule">${esc(RULES[st.rule])}</p>` : ''}
    <p class="fg-tags">${st.newInBook ? `<span class="fg-new">${icon('book')}New in your Forge Book</span>` : '<span class="fg-had">Already in your Forge Book</span>'}${st.first ? '' : '<span class="fg-had">rearranged after a crack — kept, no coin</span>'}${st.family ? '<span class="fg-new">a family word</span>' : ''}</p></div>`;
}
/* the crack, held on the anvil: each piece and what it means, and why they do not fit */
function crackCard(g) {
  const st = g.state, pieces = st.ids.map((id) => F.part(id));
  const each = `<ul class="fg-why">${pieces.map((p) => `<li><b class="fg-${p.kind}">${esc(label(p))}</b> <span>${esc(KIND[p.kind])}: ${esc(senseOf(p))}${p.makes ? ` — makes ${p.makes === 'adjective' ? 'an adjective' : p.makes === 'adverb' ? 'an adverb' : 'a noun'}` : ''}</span></li>`).join('')}</ul>`;
  const why = `${each}<p>“${esc(st.text)}” is not a word in Bee’s list${st.friend ? '' : ' — so it cracks'}. ${esc(st.why || '')}${st.again ? ' You tried that one already — it does not count twice.' : ''}</p>`;
  const title = st.friend ? `“${st.friend}” is a word, but not made of these pieces` : st.again ? 'Cracked again' : 'Cracked — no such word';
  return missCard({ type: 'note', why: st.friend ? `${each}<p>The pieces do not carry their meaning in “${esc(st.friend)}”, so the forge cannot count it. No crack, no coin.</p>` : why }, null, { title, whyHtml: true, go: 'Clear the anvil' });
}

/* ---------- the room: the stage fills what the page leaves it ----------
   The shared fitStage (src/stage.js) measures the room by the page's height with the stage at its natural
   height, so a stage whose content is shorter than the room (the forge, on a phone) is held at its content
   height and leaves a band of backdrop under it. Here the stage is measured at a tall height instead — the
   page's own clearance below it is then exact — and the result is kept, so the next render is born at it.
   It runs in the same frame as fitStage, after it, so nothing flickers. (The fix belongs in fitStage.) */
let roomH = 0;
function fitForge() {
  const el = typeof document !== 'undefined' && document.querySelector('.fg-stage[data-fit]'); if (!el) return;
  el.style.height = '4000px';
  const r = el.getBoundingClientRect(), below = Math.max(0, document.documentElement.scrollHeight - (r.bottom + scrollY));
  roomH = Math.max(380, Math.floor(innerHeight - (r.top + scrollY) - below)); el.style.height = `${roomH}px`;
}
const fitLater = () => { if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(fitForge); };
if (typeof window !== 'undefined') { let t = null; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitForge, 140); }); }
/* the stage, born at the room it had last time */
const onStage = (o) => { fitLater(); const html = stage(o); return roomH ? html.replace('style="--plate', `style="height:${roomH}px;--plate`) : html; };

/* ---------- the screens ---------- */
const rankLine = (book) => { const r = rankOf(book); return r.next ? `${r.n} word${r.n === 1 ? '' : 's'} forged — ${r.next.at - r.n} more to ${r.next.name}` : `${r.n} words forged — the top rank`; };
const rankBar = (book) => { const r = rankOf(book), lo = [0, 10, 25, 50, 100][r.i], hi = r.next?.at || lo; return `<div class="fg-rank"><b>${esc(r.name)}</b><span class="fg-bar"><i style="width:${hi > lo ? Math.round((100 * (r.n - lo)) / (hi - lo)) : 100}%"></i></span><small>${esc(rankLine(book))}</small></div>`; };

/* the title: how it plays, the level chip, the fire's progress, the rank; Start, the Forge Book, Challenge */
export function forgeTitle(r, challenge = '') {
  preloadForge();
  const gm = GAMES.root, k = kid(), rec = k.games.root || {}, L = playLevel(rec), book = bookOf(), cfg = levelCfg(L);
  const stars = Object.values(rec.stars || {}).reduce((a, b) => a + (b || 0), 0), ready = !!F;
  const demo = `<div class="fg-demo" aria-hidden="true"><span class="fg-term fg-prefix"><b>re-</b><small>again</small></span><i class="fg-plus">+</i><span class="fg-term fg-root"><b>port</b><small>carry</small></span><i class="fg-eq">=</i><b class="fg-word">report</b></div>`;
  return `<div class="game">${onStage({ id: 'title-root', world: gm.world, dark: isDark(), mods: 'stg-title-card fg-stage',
    left: { v: bookSize(book), l: 'in your book' }, right: { v: stars, l: `star${stars === 1 ? '' : 's'}` }, title: gm.name, chip: levelTag(L, rankOf(book).name),
    main: `<div class="stg-paper stg-howto fg-howto" data-play>${demo}<p class="stg-lead">${esc(gm.how)}</p>${levelChip('root', { stars: true })}
      <p class="gb-level"><b>Level ${L}</b> · ${esc(gm.levels[L])} — ${cfg.tray} parts, an anvil of ${cfg.slots}.</p>
      ${rankBar(book)}
      <div class="fg-load${ready ? ' done' : ''}" data-forge-load><span>${ready ? 'The forge is hot.' : LOAD.state === 'error' ? 'Bee’s word list did not load.' : `Lighting the forge — Bee’s words ${LOAD.pct}%`}</span><span class="fg-bar"><i style="width:${ready ? 100 : LOAD.pct}%"></i></span></div>
      <p class="note">Three rounds, then a final: ${esc(gm.final.charAt(0).toLowerCase() + gm.final.slice(1))}. A coin for each word forged first time, in a round at least half words. Keys: ${esc(gm.keys)} — or drag, or tap.</p>${r.err ? `<p class="note" role="alert">${esc(r.err)}</p>` : ''}</div>`,
    controls: `${btn('Forge Book', 'forge-book', { ic: 'book', cls: 'out stg-pair' })}${btn('Start', 'game-start', { ic: 'next', cls: 'stg-go' })}${challenge}`, fit: true })}</div>`;
}

/* the play: the anvil, the plaque of the last word forged, the tray, and Lift · Strike · Done */
export function forgePlay(g, r, { roundName = '', runScore = 0 } = {}) {
  const gm = GAMES.root, book = bookOf(), st = g.state, held = st && !st.ok, done = forgeGoalMet(g);
  const found = g.found.length, N = g.targets.length;
  const keyP = g.key ? F.part(g.key) : null;
  const goalN = g.key ? forgeFamily(g) : found;
  const pips = `<div class="gb-pips fg-goal" role="img" aria-label="${goalN} of ${g.goal} to the goal">${Array.from({ length: g.goal }, (_, i) => `<i class="pip${i < goalN ? ' ok' : i === goalN ? ' cur' : ''}"></i>`).join('')}<span>${g.key ? `${esc(label(keyP))} family ${Math.min(goalN, g.goal)} of ${g.goal}` : `goal ${Math.min(goalN, g.goal)} of ${g.goal}`}</span></div>`;
  const slots = Array.from({ length: g.slots }, (_, j) => { const i = g.anvil[j];
    return `<div class="fg-slot${i != null ? ' full' : ''}" data-slot="${j}">${i != null ? ingot(g.tray[i], j, g, st?.ok ? st.word : null) : `<span class="fg-socket">${j + 1}</span>`}</div>`; }).join('');
  const prompt = g.key ? `Forge a family: three words with ${esc(label(keyP))} (${esc(senseOf(keyP))}).` : held ? 'The anvil holds the cracked pieces.' : g.anvil.length >= 2 ? 'Strike — or add a piece.' : 'Drag or tap two parts onto the anvil.';
  const anvil = `<div class="fg-forge${st?.ok && !st.again ? ' glow' : ''}${held ? ' crack' : ''}" data-anvil>
      <div class="fg-fire" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="fg-anvil" role="group" aria-label="the anvil, ${g.slots} slots">${st?.ok && !st.again ? `<div class="fg-bar-hot"><b>${esc(st.word)}</b></div>` : `<div class="fg-slots">${slots}</div>`}${ANVIL}</div>
      ${held ? '<svg class="fg-crackline" viewBox="0 0 100 40" aria-hidden="true"><path d="M50 0 L46 12 L54 18 L47 28 L52 40"/></svg>' : ''}
      ${st?.ok && !st.again ? '<div class="fg-sparks" aria-hidden="true">' + Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--d:${50 + (i * 37) % 40}px"></i>`).join('') + '</div>' : ''}</div>`;
  const rack = g.found.length ? `<div class="fg-rack" aria-label="words forged this round">${g.found.map((x) => `<span class="fg-chip${x.first ? '' : ' assisted'}${g.key && x.ids.includes(g.key) ? ' fam' : ''}">${esc(x.word)}</span>`).join('')}</div>` : '';
  const showing = !held && !!(g.shown || st?.ok);   // the plaque needs the room: the prompt steps aside (the track still names the goal)
  const main = `${showing ? '' : `<p class="prompt">${prompt}</p>`}<div class="fg-play" data-play>${anvil}${held ? `<div class="stg-paper fg-held">${crackCard(g)}</div>` : `${plaque(g.shown || (st?.ok ? st : null)) || (rack ? '' : `<p class="fg-hint">Any real word in Bee’s list counts.</p>`)}${rack}`}</div>`;
  const tray = held ? '' : `<div class="fg-tray${kbdMode ? ' kbd' : ''}" role="group" aria-label="the parts">${g.tray.map((p, i) => partTile(p, i, g, book)).join('')}</div>`;
  const controls = held ? '' : `${btn('Lift', 'fg-lift', { ic: 'undo', cls: 'out stg-pair', dis: !g.anvil.length || !!st })}${btn('Strike', 'fg-strike', { ic: 'blocks', cls: 'stg-go fg-strike', dis: g.anvil.length < 2 || !!(st && !st.ok) })}${btn(done ? 'Finish' : 'Done', 'fg-done', { ic: done ? 'check' : 'next', cls: `${done ? '' : 'out '}stg-pair` })}`;
  return onStage({ id: 'root', world: gm.world, dark: isDark(), mods: `stg-play fg-stage${g.final ? ' stg-final' : ''}`,
    left: { v: `${found}<small class="fg-of">/${N}</small>`, l: 'found', label: `${found} of ${N} found` }, right: { v: `<span class="gb-score-v">${g.score}</span>`, l: `run ${runScore + g.score}` },
    title: gm.name, chip: `${levelTag(g.level, roundName)}<span class="gb-combo${g.combo >= 2 ? ' on' : ''}" aria-live="polite">${g.combo >= 2 ? `${g.combo} in a row` : ''}</span>`,
    track: pips, main, tray, controls, fit: true });
}

/* the Forge Book: every word forged, by its parts; a part stamped at three words; the rank */
export function forgeBook(r) {
  const gm = GAMES.root, book = bookOf(), n = bookSize(book), rk = rankOf(book);
  const shelves = F ? bookByPart(F, book) : [], stampsN = shelves.filter((x) => x.stamp).length;
  const groups = [['prefix', 'Prefixes'], ['root', 'Roots'], ['base', 'Whole words'], ['suffix', 'Endings']].map(([kind, name]) => {
    const xs = shelves.filter((x) => x.part.kind === kind); if (!xs.length) return '';
    return `<section class="fg-shelf"><h3>${name}</h3><div class="fg-cards">${xs.map((x) => `<article class="fg-card fg-${kind}${x.stamp ? ' stamped' : ''}"><header><b>${esc(label(x.part))}</b><small>${esc(x.part.kind === 'base' ? 'a whole word' : x.part.mean)}</small>${x.stamp ? `<i class="fg-stamp" title="stamped">${icon('star')}</i>` : ''}</header>
      <p>${x.words.map((w) => `<span class="fg-chip">${esc(w)}</span>`).join(' ')}</p><span class="fg-bar"><i style="width:${Math.round((100 * x.words.length) / Math.max(1, x.of))}%"></i></span><small>${x.words.length} of the ${x.of} words it makes here${x.stamp ? '' : ` · ${STAMP - Math.min(STAMP, x.words.length)} more to its stamp`}</small></article>`).join('')}</div></section>`;
  }).join('');
  const body = !F ? `<p>Lighting the forge…</p>` : n ? groups : `<div class="fg-empty"><img src="${mascot('point')}" alt=""><p>Your Forge Book is empty. Every real word you forge is kept here, by its parts — and a part gets its stamp when three of its words are in.</p></div>`;
  return `<div class="game">${onStage({ id: 'book-root', world: gm.world, dark: isDark(), mods: 'fg-stage fg-bookstage',
    left: { v: n, l: `word${n === 1 ? '' : 's'}` }, right: { v: stampsN, l: `stamp${stampsN === 1 ? '' : 's'}` }, title: 'Forge Book', chip: `<span class="lvtag"><b>${esc(rk.name)}</b>${rk.next ? ` · ${rk.next.at - n} to ${esc(rk.next.name)}` : ''}</span>`,
    main: `<div class="stg-paper fg-book" data-play>${rankBar(book)}${body}</div>`,
    controls: btn('Back to the forge', 'forge-book-close', { ic: 'back', cls: 'stg-go' }), fit: true })}</div>`;
}

/* ---------- keys: ← → choose a part · Enter place · Backspace lift · Space or S strike · 1–9 place ---------- */
let kbdMode = false;
export function forgeKey(e, g, act) {
  if (!kbdMode && /^(Arrow|Enter$|Backspace$| $|[1-9]$|s$|S$)/.test(e.key)) { kbdMode = true; requestAnimationFrame(() => document.querySelector('.fg-tray')?.classList.add('kbd')); }
  if (g.state && !g.state.ok) { if (e.key === 'Enter' || e.key === ' ') { act({ type: 'next' }); return true; } return false; }
  if (/^[1-9]$/.test(e.key) && +e.key <= g.tray.length) { act({ type: 'place', i: +e.key - 1 }); return true; }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { act({ type: 'move', d: 1 }); return true; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { act({ type: 'move', d: -1 }); return true; }
  if (e.key === 'Backspace') { act({ type: 'lift' }); return true; }
  if (e.key === ' ' || e.key === 's' || e.key === 'S') { act({ type: 'strike' }); return true; }
  if (e.key === 'Enter') {
    if (/^(BUTTON|A)$/.test(e.target?.tagName || '') && !e.target.closest?.('.fg-part')) return false;
    act(g.anvil.length >= g.slots || g.state?.ok && g.anvil.length >= 2 ? { type: 'strike' } : { type: 'place' }); return true;
  }
  return false;
}

/* ---------- the actions (merged into play.js PLAY_ACTIONS) ---------- */
export function forgeActions(act) {
  return {
    'fg-place': (a) => { if (dragDone) return; sfx('tap'); act({ type: 'place', i: +a }); },
    'fg-lift': (a) => act(a === '' || a == null ? { type: 'lift' } : { type: 'lift', at: +a }),
    'fg-strike': () => act({ type: 'strike' }),
    'fg-done': () => act({ type: 'done' }),
    'forge-book': () => { const r = S.run; if (!r || r.id !== 'root') return; r.phase = 'book'; render(); forgeReady().then(() => { if (S.run === r && r.phase === 'book') render(); }); },
    'forge-book-close': () => { const r = S.run; if (!r || r.id !== 'root') return; r.phase = 'title'; render(); },
  };
}

/* ---------- drag: a part onto the anvil (a mouse, a finger or a pen); a press without a move is a tap ---------- */
let drag = null, dragDone = false, dragAct = null;
export const setDragAct = (f) => { dragAct = f; };
if (typeof document !== 'undefined') {
  const slotAt = (x, y) => { const els = document.elementsFromPoint(x, y); return { slot: els.map((el) => el.closest?.('.fg-slot[data-slot]')).find(Boolean) || null, anvil: els.map((el) => el.closest?.('[data-anvil]')).find(Boolean) || null }; };
  document.addEventListener('pointerdown', (e) => {
    if (kbdMode) { kbdMode = false; document.querySelector('.fg-tray')?.classList.remove('kbd'); }
    const c = e.target.closest?.('.fg-part[data-act=fg-place]'); if (!c || c.disabled || (e.button != null && e.button > 0)) return;
    drag = { el: c, i: +c.dataset.arg, x: e.clientX, y: e.clientY, on: false, id: e.pointerId, over: null };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) { if (Math.hypot(dx, dy) < 8) return; drag.on = true; drag.el.classList.add('fg-drag'); try { drag.el.setPointerCapture(e.pointerId); } catch { /* not every pointer can be captured */ } }
    drag.el.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-8, Math.min(8, dx / 20))}deg)`;
    const { slot, anvil } = slotAt(e.clientX, e.clientY), over = slot || anvil;
    if (over !== drag.over) { drag.over?.classList.remove('fg-over'); over?.classList.add('fg-over'); drag.over = over; }
    e.preventDefault();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; if (!d.on) return;
    d.el.style.transform = ''; d.el.classList.remove('fg-drag'); d.over?.classList.remove('fg-over');
    dragDone = true; setTimeout(() => { dragDone = false; }, 60);   // the click that follows a drag is not a tap
    if (e.type !== 'pointerup' || !dragAct) return;
    const { slot, anvil } = slotAt(e.clientX, e.clientY);
    if (slot || anvil) { const at = slot ? +slot.dataset.slot : null, full = slot?.classList.contains('full'); dragAct({ type: 'place', i: d.i, at: full ? at : null }); }
  };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
}

export { forgeAccuracy, forgeIds };
