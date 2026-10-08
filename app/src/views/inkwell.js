/* inkwell.js — Inkwell Detective's screens, loaded on their own route (main.js loadInk): the Agency hub, the town map,
   Change coats, and the router for a case (views/inkwell-case.js) and for the Training Desk, the Word Hoard and Detective
   School (views/inkwell-more.js). Handover C §2.1, the six detectives §2–§4, season-one Part 10.

   Routes
     #/inkwell                       the Agency: the office painting, the casebook wall, the shelf, the Ledger, the Door
     #/inkwell/map                   the town map: a wax-seal pin per case; the walk to the next one
     #/inkwell/detective             Change coats (choose your detective between cases)
     #/inkwell/case/<id>[/<view>]    a case: opening · persona · desk · board · timeline · accuse · reveal · solved
     #/inkwell/desk/<id>             Quill's Training Desk for a case (never blocking)
     #/inkwell/hoard[/<persona>]     the Word Hoard book
     #/inkwell/school[/<drill>]      Detective School: timeline · who · spotter

   Unsigned cases show only in tester mode (h.parent.tester) — detective-season.js released(). */

import '../../styles/stage.css';
import '../../styles/inkwell.css';
import { S, kid, save, render, isDark, go } from '../app.js';
import { esc, icon, pageHead } from '../ui.js';
import * as D from '../detective.js';
import * as SE from '../detective-season.js';
import { loadSeason, loadCase } from '../detective-data.js';
import { personaById } from '../data/inkwell-personas.js';
import { stop as stopVoice } from '../voice.js';
import { fitStage } from '../stage.js';
import { openCase, caseView, CASE_ACTIONS, caseKey, casePointerDown, casePointerMove, casePointerUp, personaView, leaveCase, st } from './inkwell-case.js';
import { openMore, moreView, MORE_ACTIONS, moreKey, leaveMore } from './inkwell-more.js';
import { figure, sticker, plateBg, plate, WASH, manifestPins, artUrl } from './inkwell-kit.js';

/* The Play tab's card for Inkwell Detective (views/play.js is merged by hand: render INKWELL_CARD.html() among the cards). */
export const INKWELL_CARD = {
  id: 'inkwell', name: 'Inkwell Detective', href: '#/inkwell', practises: 'reading like a detective: finding the words that matter, linking them, proving it',
  html: () => `<article class="pcard inkcard" data-card="inkwell"><a class="pc-art" href="#/inkwell" style="background-image:url('${plate('agency', isDark()) || ''}')" aria-label="Inkwell Detective"><span class="pc-kind">The flagship</span></a>
    <div class="pc-body"><h3><a href="#/inkwell">Inkwell Detective</a></h3><p class="muted">Read like a detective. Every case is solved by reading closely, and proved with the text.</p>
    <div class="row pc-foot"><span class="tag">${esc(SE.rankOf(kid()).name)}</span><a class="btn small" href="#/inkwell">${icon('play')}<span>Open the Agency</span></a></div></div></article>`,
};

const tester = () => !!S.h.parent?.tester;
const list = () => SE.seasonList(kid(), S.ink?.cases || [], { tester: tester() });
const byId = (id) => (S.ink?.cases || []).find((c) => c.id === id);
const pick = () => { const L = list(); return L.find((x) => x.open && x.paused) || L.find((x) => x.open && !x.solved) || null; };

/* ---------- route ---------- */
export async function openInkwell(parts) {
  const [, view, id, sub] = parts;
  S.run = null;
  if (!S.ink?.cases) S.ink = { ...(S.ink || {}), cases: await loadSeason() };
  const s = S.ink; s.view = view || 'hub'; s.say = view === 'case' && s.c?.id === id ? s.say : view === 'case' ? null : s.say;
  if (view === 'case') {
    const c = byId(id) || (await loadCase(id));
    if (!c || !SE.released(c, { tester: tester() }) || !list().find((x) => x.id === id)?.open && !SE.inkOf(kid()).closed[id]) { s.view = 'hub'; s.say = { who: 'QUILL', text: c ? 'That case is not open yet.' : 'No such case.' }; return; }
    openCase(c, sub);
  } else if (view === 'detective') { s.coats = true; s.pick1 = SE.inkOf(kid()).persona; }
  else if (view === 'desk' || view === 'hoard' || view === 'school') await openMore(view, id, sub);
  else if (view === 'map') { s.mapSel = s.mapSel || pick()?.id || null; }
}
export function leaveInkwell() { stopVoice(); leaveCase(); leaveMore(); document.documentElement.classList.remove('bz-playing'); }

export function inkwellView() {
  const s = S.ink; if (!s?.cases) return '';
  queueMicrotask(() => requestAnimationFrame(after));
  switch (s.view) {
    case 'case': return caseView();
    case 'map': return mapView();
    case 'detective': return personaView({ coats: true });
    case 'desk': case 'hoard': case 'school': return moreView();
    default: return hubView();
  }
}
function after() {
  if (S.route.name !== 'inkwell') return; fitStage();
  const s = S.ink; if (s?.view === 'map') { const cur = document.querySelector('.mp-pin.cur, .mp-pin.sel'), box = document.querySelector('.mp-scroll'); if (cur && box && box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, cur.offsetLeft - box.clientWidth / 2); }
}

/* ---------- the Agency ---------- */
/* Places on the office painting, as % of the plate (agency.webp, 1600 × 893) — measured against the painting; repaint it,
   re-measure. */
const SPOT = { wall: [10.6, 21, 13.9, 43], hats: [1, 27, 10.5, 72], shelf: [71, 21, 16, 44.5], door: [89, 15, 10.5, 85], desk: [31, 60, 37, 30], window: [38.5, 16, 23, 40.5], school: [62.4, 38.6, 6.2, 14], books: [57, 55, 7.8, 12] };
const at = (r) => `left:${r[0]}%;top:${r[1]}%;width:${r[2]}%;height:${r[3]}%`;
function hubView() {
  const k = kid(), ink = SE.inkOf(k), s = S.ink, L = list(), nx = pick(), rank = SE.rankOf(k), solved = Object.keys(ink.closed).length, dark = isDark();
  const p = personaById(ink.persona), door = SE.door(k), ledger = SE.ledgerWords(k, s.cases), wall = L.slice(0, 16);
  const pinned = wall.map((x, i) => `<i class="ag-pin${x.solved ? ' solved' : x.paused ? ' paused' : x.open ? ' open' : ''}" style="--i:${i}" title="${esc(x.title)}">${x.solved ? '' : ''}</i>`).join('');
  const objs = s.cases.filter((c) => c.kind !== 'journey' && ink.closed[c.id]).map((c) => { const o = c.officeObject; const n = c.number ?? +c.id.slice(-2); return o ? `<span class="ag-obj" style="--n:${n}" title="${esc(o.name)}">${sticker(`obj-${o.id}`, { alt: o.name, fallback: icon('star') })}</span>` : ''; }).join('');
  const greet = s.say?.text || (nx ? (nx.paused ? `Welcome back, ${SE.detectiveName(k)}. ${nx.title} is still on the desk.` : solved ? `Good to see you, ${SE.detectiveName(k)}. A new case is waiting.` : 'Good. A new detective. Sit down. Detectives do not guess. They read.') : tester() ? 'Every case is on the wall.' : 'The first cases are with the owner, waiting to be signed off. A grown-up can open them in tester mode.');
  const nc = nx ? byId(nx.id) : null;
  const cont = nx ? `<a class="btn ink-go big ag-cont" href="#/inkwell/case/${nx.id}" data-ink="continue">${icon('play')}<span>${nx.paused ? 'Continue the case' : solved ? 'Start the next case' : 'Start your first case'}</span></a><p class="ag-next">${nc?.kind === 'journey' ? 'Ink Journey' : `Case ${nc?.number ?? ''}`} · ${esc(nx.title)} · Level ${nx.level || 1}</p>`
    : `<button class="btn ink-go big ag-cont" aria-disabled="true" data-ink="continue">${icon('lock')}<span>Waiting for sign-off</span></button>`;
  const inked = new Map(ledger.map((w) => [w.i, w.word]));
  const ledgerHtml = s.cases.filter((c) => c.vanishedWord).sort((a, b) => a.ledgerIndex - b.ledgerIndex).map((c) => (inked.has(c.ledgerIndex) ? `<b>${esc(inked.get(c.ledgerIndex))}</b>` : '<i class="blot" role="img" aria-label="a blot"></i>')).join('');
  const scene = `<div class="ag-scene" style="--ag:${plateBg('agency', dark, WASH.agency)}" data-play>
    <a class="ag-spot ag-wall" href="#/inkwell/map" style="${at(SPOT.wall)}" aria-label="The casebook wall: ${solved} solved. Open the town map"><span class="ag-pins">${pinned}</span></a>
    <button class="ag-spot ag-hats" data-act="ink-hats" style="${at(SPOT.hats)}" aria-label="The hat stand: your rank, ${esc(rank.name)}"></button>
    <a class="ag-spot ag-shelf" href="#/inkwell/map" style="${at(SPOT.shelf)}" aria-label="The shelf: ${solved} objects from solved cases"><span class="ag-niches">${objs}</span></a>
    <button class="ag-spot ag-door${door.keyhole ? ' brim' : ''}${door.opened ? ' opened' : ''}" data-act="ink-door" style="${at(SPOT.door)}" aria-label="The Reading Door: ${door.opened ? `opened ${door.opened} time${door.opened === 1 ? '' : 's'}` : 'it has never opened'}"><i class="ag-keyhole"></i></button>
    <a class="ag-spot ag-books" href="#/inkwell/hoard" style="${at(SPOT.books)}" aria-label="The Word Hoard book"></a>
    <a class="ag-spot ag-school" href="#/inkwell/school" style="${at(SPOT.school)}" aria-label="Detective School"></a>
    <div class="ag-quill">${sticker('quill-detective', { alt: 'Quill at the desk', fallback: 'Q' })}</div>
    <a class="ag-ledger" href="#/inkwell/map" aria-label="The Blot Ledger: ${ledger.length} words inked">${sticker('ui-ledger', { alt: '', fallback: icon('book') })}</a>
    ${p ? `<div class="ag-det">${figure(p.id, { name: p.name, alt: SE.detectiveName(k) })}</div>` : ''}
    <p class="ag-bubble">${esc(greet)}</p></div>`;
  const chips = `<nav class="ag-chips" aria-label="The agency">${[['#/inkwell/map', 'map', 'Town map'], [nx ? `#/inkwell/desk/${nx.id}` : '#/inkwell/school', 'quill', 'Training Desk'], ['#/inkwell/hoard', 'book', 'Word Hoard'], ['#/inkwell/school', 'school', 'Detective School'], ['#/inkwell/detective', 'user', 'Change coats']].map(([h, ic, l]) => `<a class="btn out small" href="${h}">${icon(ic === 'school' ? 'learn' : ic)}<span>${l}</span></a>`).join('')}</nav>`;
  const hats = s.hats ? `<div class="ag-ranks" role="dialog" aria-label="Ranks"><h3>${icon('medal')}<span>Ranks</span></h3><ol>${SE.RANKS.map((r) => `<li class="${r.id === rank.id ? 'on' : ''}"><b>${esc(r.name)}</b><small>${r.at ? `${r.at} cases solved with full evidence, first time` : 'where everyone starts'}</small></li>`).join('')}</ol><p class="muted">Ranks move only on evidence: a case solved with the right evidence on the first accusation.</p><button class="btn out small" data-act="ink-hats">${icon('close')}<span>Close</span></button></div>` : '';
  const doorNote = s.doorNote ? `<p class="ag-note" role="status">${esc(door.opened ? `The Reading Door has opened ${door.opened} time${door.opened === 1 ? '' : 's'}.${door.keyhole ? ' Its keyhole is brimming with ink: an Ink Journey is waiting.' : ''}` : 'Nell has tried it with every key in town. It opens when the agency has read enough: four cases on the wall.')}</p>` : '';
  const panels = `<div class="ag-panels"><section class="ag-card"><h3>${icon('book')}<span>The Blot Ledger</span></h3><p class="ag-led">${ledgerHtml}</p><small>${ledger.length ? `${ledger.length} word${ledger.length === 1 ? '' : 's'} inked back` : 'Words that vanished come back here, one a case.'}</small></section>
    <section class="ag-card"><h3>${icon('medal')}<span>${esc(rank.name)}</span></h3><p>${(() => { const nxR = SE.RANKS.find((r) => r.at > Object.values(ink.closed).filter((w) => w.full).length); return nxR ? `${nxR.name} at ${nxR.at} cases solved with full evidence.` : 'The highest rank in the agency.'; })()}</p><small>${p ? `Detective: ${esc(SE.detectiveName(k))}${k.inkwellName ? ` (${esc(p.name)})` : ''}` : 'No detective chosen yet'}</small></section>
    <section class="ag-card"><h3>${icon('key')}<span>The Reading Door</span></h3><p>${door.opened ? `Opened ${door.opened} of 4 times.` : 'It has never opened.'}</p><small>${door.keyhole ? 'An Ink Journey is waiting.' : door.opened < 4 ? 'It opens when the agency has read enough.' : 'Every Journey is open.'}</small></section></div>`;
  return pageHead({ title: 'Inkwell Detective', back: { label: 'Play', href: '#/play' } }) + `<section class="stg ink ink-hub" style="--ink-plate:${plateBg('agency', dark, WASH.agency)}">
    <header class="stg-hud"><div class="stg-pod stg-l"><b>${solved}</b><small>solved</small></div><div class="stg-mid"><h2 class="stg-title">The Inkwell Detective Agency</h2><span class="lvtag"><b>${esc(rank.name)}</b> · level ${SE.levelNow(k)}${tester() ? ' · tester mode' : ''}</span></div><div class="stg-pod stg-r"><b>${Object.values(ink.hoard).reduce((a, b) => a + b.length, 0)}</b><small>words found</small></div></header>
    <div class="ink-main" data-stage-main>${scene}<div class="ag-act">${cont}${chips}</div>${hats}${doorNote}${panels}</div></section>`;
}

/* ---------- the town map ---------- */
/* districts on the map painting (map.webp, 1600 × 893), as % — measured against the painting */
const DISTRICT = { quayside: [39, 74], garden: [21, 58], study: [15, 22], forum: [86, 42], playhouse: [49, 14], scriptorium: [73, 19], lakeside: [79, 72], library: [50, 46] };
const NUDGE = [[0, 0], [6, -5], [-6, 5], [5, 6]];
function pinPos(id) {
  const P = manifestPins(); if (P && P[id] && Array.isArray(P[id])) return P[id];
  const c = byId(id); if (!c) return [50, 50];
  const key = c.kind === 'journey' ? 'library' : c.world in DISTRICT ? c.world : 'library';
  const same = (S.ink.cases || []).filter((x) => (x.kind === 'journey' ? 'library' : x.world in DISTRICT ? x.world : 'library') === key);
  const j = same.findIndex((x) => x.id === id), [x, y] = DISTRICT[key], [dx, dy] = key === 'library' ? [[-9, -9], [9, -9], [-9, 9], [9, 9]][j % 4] : NUDGE[j % 4];
  return [x + dx, y + dy];
}
function mapView() {
  const k = kid(), s = S.ink, L = list(), nx = pick(), dark = isDark(), p = personaById(SE.inkOf(k).persona), solved = L.filter((x) => x.solved).length;
  const sel = L.find((x) => x.id === s.mapSel) || nx || L[0];
  const pins = L.map((x, i) => { const [px, py] = pinPos(x.id), c = byId(x.id), cur = nx && nx.id === x.id;
    const cls = ['mp-pin', x.solved ? 'solved' : '', x.open ? 'open' : 'locked', cur ? 'cur' : '', sel?.id === x.id ? 'sel' : '', x.kind === 'journey' ? 'journey' : ''].filter(Boolean).join(' ');
    return `<button class="${cls}" style="left:${px}%;top:${py}%" data-act="ink-msel" data-arg="${x.id}" aria-label="${esc(x.kind === 'journey' ? 'Ink Journey' : `Case ${c?.number ?? i}`)}: ${esc(x.title)}${x.solved ? ', solved' : x.open ? '' : ', locked'}">${sticker('ui-seal', { cls: 'mp-seal', alt: '', fallback: '' })}<b>${x.solved ? icon('check') : x.open ? (x.kind === 'journey' ? icon('key') : esc(String(c?.number ?? i))) : icon('lock')}</b></button>`; }).join('');
  let walk = '';
  if (s.walkFrom && nx && s.walkFrom !== nx.id) { const [fx, fy] = pinPos(s.walkFrom), [tx, ty] = pinPos(nx.id); walk = `<svg class="mp-walk" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M${fx},${fy} Q${(fx + tx) / 2},${Math.min(fy, ty) - 12} ${tx},${ty}"/></svg><div class="mp-walker" style="--fx:${fx}%;--fy:${fy}%;--tx:${tx}%;--ty:${ty}%">${p ? figure(p.id, { name: p.name }) : ''}</div>`; s.walkFrom = null; }
  else if (nx && p) { const [tx, ty] = pinPos(nx.id); walk = `<div class="mp-walker still" style="--fx:${tx}%;--fy:${ty}%;--tx:${tx}%;--ty:${ty}%">${figure(p.id, { name: p.name })}</div>`; }
  const sc = sel ? byId(sel.id) : null;
  const card = sel ? `<div class="mp-card"><small>${sc?.kind === 'journey' ? 'Ink Journey' : `Case ${sc?.number ?? ''}`} · Level ${sel.level || 1}${sel.solved ? ' · solved' : sel.paused ? ' · on the desk' : ''}</small><h3>${esc(sel.title)}</h3>${sc?.card?.text && sel.open ? `<p>${esc(D.personaText(sc.card.text, p, k.inkwellName))}</p>` : ''}
    ${sel.open ? `<a class="btn ink-go" href="#/inkwell/case/${sel.id}">${icon('play')}<span>${sel.solved ? 'Read it again' : sel.paused ? 'Continue the case' : 'Open the case'}</span></a>` : `<p class="muted">${icon('lock')} ${esc(sel.why ? sel.why.charAt(0).toUpperCase() + sel.why.slice(1) : 'Not open yet')}.</p>`}</div>` : '';
  return pageHead({ title: 'The town map', back: { label: 'Agency', href: '#/inkwell' } }) + `<section class="stg ink ink-map" style="--ink-plate:${plateBg('map', dark, WASH.agency)}">
    <header class="stg-hud"><div class="stg-pod stg-l"><b>${solved}</b><small>of ${L.length}</small></div><div class="stg-mid"><h2 class="stg-title">Inkwell</h2><span class="lvtag">Six districts round the Great Library</span></div><div class="stg-pod stg-r"><b>${SE.ledgerWords(k, s.cases).length}</b><small>words inked</small></div></header>
    <div class="ink-main" data-stage-main><div class="mp-scroll"><div class="mp-map" style="--mp:${plateBg('map', dark, WASH.agency)}" data-play>${walk}${pins}<a class="mp-ledger" href="#/inkwell" aria-label="The Blot Ledger">${sticker('ui-ledger', { alt: '', fallback: icon('book') })}</a></div></div>${card}</div></section>`;
}

/* ---------- actions, keys, pointer ---------- */
export const INK_ACTIONS = {
  ...CASE_ACTIONS, ...MORE_ACTIONS,
  'ink-hats': () => { S.ink.hats = !S.ink.hats; render(); },
  'ink-door': () => { S.ink.doorNote = !S.ink.doorNote; render(); },
  'ink-msel': (id) => { S.ink.mapSel = id; render(); },
  'ink-name-go': () => CASE_ACTIONS['ink-choose'](),
};
export function inkKey(e) {
  const s = S.ink; if (!s || S.route.name !== 'inkwell') return false;
  if (s.view === 'case') return caseKey(e);
  if (s.view === 'detective') { const cards = [...document.querySelectorAll('.pcard-d')], i = cards.indexOf(document.activeElement), cols = matchMedia('(max-width: 720px)').matches ? 2 : 3, mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key]; if (mv != null && cards.length) { cards[i < 0 ? 0 : Math.max(0, Math.min(cards.length - 1, i + mv))].focus(); return true; } return false; }
  if (s.view === 'map' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const L = list(), i = L.findIndex((x) => x.id === s.mapSel); s.mapSel = L[Math.max(0, Math.min(L.length - 1, (i < 0 ? 0 : i) + (e.key === 'ArrowRight' ? 1 : -1)))].id; render(); requestAnimationFrame(() => document.querySelector('.mp-pin.sel')?.focus()); return true; }
  if (s.view === 'desk' || s.view === 'hoard' || s.view === 'school') return moreKey(e);
  return false;
}
export function inkInput(t) { if (t.dataset.act === 'ink-name' && S.ink) S.ink.pname = t.value; }
/* a solve returns to the Agency and then the map walks to the next pin */
document.addEventListener('click', (e) => { const a = e.target.closest?.('[data-arrive]'); if (a && S.ink) S.ink.walkFrom = a.dataset.arrive; }, true);
document.addEventListener('pointerdown', (e) => { if (S.route.name === 'inkwell' && S.ink?.view === 'case') casePointerDown(e); });
document.addEventListener('pointermove', (e) => { if (S.route.name === 'inkwell' && S.ink?.view === 'case') casePointerMove(e); }, { passive: false });
document.addEventListener('pointerup', (e) => { if (S.route.name === 'inkwell' && S.ink?.view === 'case') casePointerUp(e); });
document.addEventListener('pointercancel', (e) => { if (S.route.name === 'inkwell' && S.ink?.view === 'case') casePointerUp(e); });
/* the comic swipes: left for the next panel, right for the one before */
let sw = null;
document.addEventListener('touchstart', (e) => { sw = S.route.name === 'inkwell' && e.target.closest?.('.comic') && e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
document.addEventListener('touchend', (e) => { if (!sw) return; const t = e.changedTouches[0], dx = t.clientX - sw[0], dy = t.clientY - sw[1]; sw = null; if (Math.abs(dx) < 45 || Math.abs(dx) < 1.5 * Math.abs(dy)) return; const s = st(); const nx = s.sub === 'reveal' ? 'ink-rnext' : 'ink-pnext'; CASE_ACTIONS[dx < 0 ? nx : 'ink-pprev'](); }, { passive: true });
