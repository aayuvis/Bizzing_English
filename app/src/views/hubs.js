/* views/hubs.js — the Play tab's cards, the two hubs (Sentence Studio, Writer's Craft) and the level chip
   every card and hub mode carries (handover C §1.4, §4.0). The lineup and the level rule are src/hubs.js;
   the stage is src/stage.js; the games themselves are views/play.js. */

import { earsCard } from './ears.js';
import { kid, isDark } from '../app.js';
import { esc, icon, pageHead } from '../ui.js';
import { GAMES, MAX_LEVEL } from '../games.js';
import { HUBS, CARDS, isHub, AUTO, levelOf, pickOf, playLevel } from '../hubs.js';
import { stage, plateUrl } from '../stage.js';

const recOf = (id) => kid().games?.[id] || {};
const starsAt = (rec, L) => (rec?.stars || {})[L] || 0;
const totalStars = (rec) => Object.values(rec?.stars || {}).reduce((a, b) => a + (b || 0), 0);
export const starRow = (n, of = 3) => `<span class="gb-stars" role="img" aria-label="${n} of ${of} stars">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}">${icon('star')}</i>`).join('')}</span>`;

/* THE LEVEL CHIP: Auto (the game's own level, moved by the rule) or a level the child sets by hand, which
   sticks until the next run's check. One button each, so a tap or a key chooses; arrows move along it. */
export function levelChip(id, { stars = false, compact = false } = {}) {
  const rec = recOf(id), pick = pickOf(rec), L = levelOf(rec), cur = pick || AUTO;
  const b = (v, label, extra = '') => `<button class="lvc-b${String(cur) === String(v) ? ' on' : ''}" role="radio" aria-checked="${String(cur) === String(v)}" data-act="lv-set" data-arg="${esc(id)}:${v}" aria-label="${v === AUTO ? `Auto: level ${L}, moved by how you do` : `Level ${v}`}">${label}${extra}</button>`;
  return `<div class="lvchip${compact ? ' compact' : ''}" role="radiogroup" aria-label="${esc(GAMES[id]?.name || id)} level">${b(AUTO, `<b>Auto</b><small>L${L}</small>`)}${Array.from({ length: MAX_LEVEL }, (_, i) => b(i + 1, `<b>${i + 1}</b>`, stars ? starRow(starsAt(rec, i + 1)) : '')).join('')}</div>`;
}
/* a still chip for the HUD during play */
export const levelTag = (L, extra = '') => `<span class="lvtag"><b>Level ${L}</b>${extra ? ` · ${esc(extra)}` : ''}</span>`;

/* ---------- the Play tab ---------- */
export function playView() {
  const cards = CARDS.map((id) => (id === 'inkwell' ? inkwellCard() : id === 'ears' ? earsCard(levelChip('ears', { compact: true })) : isHub(id) ? hubCard(id) : gameCard(id))).join('');
  return pageHead({ title: 'Play', sub: 'games where the learning is the game' }) + `<div class="pcards" data-cards="${CARDS.length}">${cards}</div>`;
}
/* the flagship's card: light on purpose (Inkwell's own modules load only on #/inkwell) */
function inkwellCard() {
  const plate = `art/inkwell/agency${isDark() ? '-night' : ''}-720.webp`;
  return `<article class="pcard inkcard" data-card="inkwell"><a class="pc-art" href="#/inkwell" style="background-image:url('${plate}')" aria-label="Inkwell Detective"><span class="pc-kind">The flagship</span></a>
    <div class="pc-body"><h3><a href="#/inkwell">Inkwell Detective</a></h3><p class="muted">Read like a detective: mark the words that matter, link them on the board, and prove who did it with the text. Twelve cases, four Journeys through the Reading Door, and Detective School.</p>
    <div class="row pc-foot"><span class="tag">Season One · The Vanishing Words</span><a class="btn small" href="#/inkwell">${icon('play')}<span>Open the Agency</span></a></div></div></article>`;
}
function hubCard(id) {
  const h = HUBS[id], best = Math.max(0, ...h.modes.map((m) => recOf(m).best || 0)), stars = h.modes.reduce((a, m) => a + totalStars(recOf(m)), 0);
  return `<article class="pcard hubcard" data-card="${id}"><a class="pc-art" href="#/play/${id}" style="background-image:url('${plateUrl(h.world, isDark(), true)}')" aria-label="${esc(h.name)}"><span class="pc-kind">${h.modes.length} modes</span></a>
    <div class="pc-body"><h3><a href="#/play/${id}">${esc(h.name)}</a></h3><p class="muted">${esc(h.promise)}</p>
    <div class="pc-modes">${h.modes.map((m) => `<a class="pc-mode" href="#/play/${id}/${m}">${esc(GAMES[m].name)}<small>Level ${playLevel(recOf(m))}${recOf(m).best ? ` · best ${recOf(m).best}` : ''}</small></a>`).join('')}</div>
    <div class="row pc-foot">${best ? `<span class="tag ok">${icon('star')}${stars} star${stars === 1 ? '' : 's'} · best ${best}</span>` : '<span class="tag">New</span>'}<a class="btn small" href="#/play/${id}">${icon('play')}<span>Open</span></a></div></div></article>`;
}
function gameCard(id) {
  const g = GAMES[id], rec = recOf(id), L = playLevel(rec);
  return `<article class="pcard" data-card="${id}"><a class="pc-art" href="#/play/${id}" style="background-image:url('${plateUrl(g.world, isDark(), true)}')" aria-label="${esc(g.name)}"></a>
    <div class="pc-body"><h3><a href="#/play/${id}">${esc(g.name)}</a></h3><p class="muted">Practises ${esc(g.practises)}.</p>
    ${levelChip(id, { compact: true })}
    <div class="row pc-foot">${rec.best > 0 ? `<span class="tag ok">${icon('star')}Your best: ${rec.best}</span>` : '<span class="tag">New</span>'}${starsAt(rec, L) ? starRow(starsAt(rec, L)) : ''}<a class="btn small" href="#/play/${id}">${icon('play')}<span>Play</span></a></div></div></article>`;
}

/* ---------- a hub: its modes as tiles on the stage ---------- */
export function hubView(id) {
  const h = HUBS[id], k = kid();
  const stars = h.modes.reduce((a, m) => a + totalStars(recOf(m)), 0), best = Math.max(0, ...h.modes.map((m) => recOf(m).best || 0));
  const tiles = h.modes.map((m) => { const g = GAMES[m], rec = recOf(m), L = playLevel(rec);
    return `<article class="htile" data-mode="${m}"><a class="ht-art" href="#/play/${id}/${m}" style="background-image:url('${plateUrl(g.world, isDark(), true)}')" aria-label="Play ${esc(g.name)}"><span class="ht-lv">Level ${L}</span></a>
      <div class="ht-text"><h3>${esc(g.name)}</h3><p class="ht-promise">${esc(g.promise || g.how)}</p></div>
      ${levelChip(m)}
      <div class="ht-foot"><span class="ht-best">${rec.best ? `${icon('star')}Best ${rec.best}` : 'New to you'}</span>${starRow(starsAt(rec, L))}<a class="btn ht-play" href="#/play/${id}/${m}">${icon('play')}<span>Play</span></a></div></article>`; }).join('');
  return pageHead({ title: h.name, sub: h.practises, back: { label: 'Play', href: '#/play' } }) + `<div class="game">${stage({
    id: 'hub-' + id, world: h.world, dark: isDark(), mods: 'stg-hub',
    left: { v: stars, l: `star${stars === 1 ? '' : 's'}` }, right: { v: best || '—', l: 'best' }, title: h.name,
    chip: `<span class="lvtag">${h.modes.length} modes · ${esc(k.name)}’s levels</span>`,
    main: `<div class="htiles" data-n="${h.modes.length}">${tiles}</div>`,
  })}</div>`;
}
