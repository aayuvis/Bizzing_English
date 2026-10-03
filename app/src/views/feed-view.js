/* feed-view.js — the #/feed screen: the app's page head, about twenty of the family's cards, and the
   family's ending pointing at Continue (FAMILY-STANDARD §6a). The cards' data is lazy, in two steps
   (data/feed/, built by tools/build-feed.mjs): the index — the ranking's fields, no words — when
   #/feed opens, then only the level groups today's session draws from. None of it is on Home.

   A card's question is answered ON the card, by touch (tap an option) or by keyboard (1–4 on the
   focused card, or the first unanswered one on screen; Enter to go on after a wrong answer). A right
   answer pays once, through pay('answer'); a wrong one holds, says the right answer, and waits. */
import '../integration/bizzing-feed.css';
import '../../styles/feed.css';
import { S, kid, save, render, pay } from '../app.js';
import { pageHead, esc } from '../ui.js';
import { feedCard, feedEnd, bindFeedKeys } from '../integration/bizzing-feed.js';
import { session, markSeen, dayNo, levelName, payOnce } from '../feed.js';
import { nextStep } from '../next.js';
import { sfx } from '../sound.js';
import { bumpDay } from '../model.js';

let INDEX = null, BY = {};
const BODY = {}, have = new Set();
const GROUP_OF = (x) => (x.level == null ? 'any' : 'L' + x.level);
const LOAD = (g) => import(`../data/feed/g-${g}.json`).then((m) => m.default || m);
export const feedReady = () => !!INDEX;

/* today's session, drawn again only when the child has done something new */
const stampOf = (k) => [dayNo(), k.id, k.band, Object.keys(k.stops || {}).length, Object.values(k.stops || {}).filter((r) => r.passed).length, k.last?.at || 0,
  Object.keys(k.reading || {}).length, Object.keys(k.bank || {}).length].join('|');
function todays(h, k) {
  const st = stampOf(k), F = S.feed;
  if (F && F.stamp === st && F.kid === k.id) return F.list;
  const list = session(h, k, INDEX);
  S.feed = { stamp: st, kid: k.id, list, play: {} };
  markSeen(k, list.map((x) => x.id)); save();
  return list;
}

/* the route opens here: the index, today's session, and the groups it needs — then render */
export async function openFeed() {
  const k = kid(); if (!k) return;
  if (!INDEX) { const m = await import('../data/feed/index.json'); INDEX = m.default || m; BY = Object.fromEntries(INDEX.map((x) => [x.id, x])); }
  if (S.h.parent.feedOff) return;
  const list = todays(S.h, k);
  const want = [...new Set(list.map((x) => GROUP_OF(BY[x.id])))].filter((g) => !have.has(g));
  await Promise.all(want.map((g) => LOAD(g).then((b) => { Object.assign(BODY, b); have.add(g); })));
  bindFeedKeys();
}
/* the groups today's session drew from — the browser check proves nothing more was loaded */
export const loadedGroups = () => [...have].sort();

/* The family's card shows a title and a body. An English card also says WHERE it lives (a place line
   above the title) and how it is TAUGHT (a line under the body) — both cut from the corpus too. */
function withMore(html, it) {
  let out = html;
  if (it.where) out = out.replace('<h3>', `<p class="bzf-where">${esc(it.where)}</p><h3>`);
  if (it.more) {
    const at = ['<p class="bzf-q">', '<div class="bzf-row">'].map((m) => out.indexOf(m)).filter((i) => i >= 0);
    const i = at.length ? Math.min(...at) : out.lastIndexOf('</div></article>');
    out = out.slice(0, i) + `<p class="bzf-more">${esc(it.more)}</p>` + out.slice(i);
  }
  return out;
}

export function feedView() {
  const h = S.h, k = kid();
  const head = pageHead({ title: 'My Feed', sub: `Picked for you from across the app, for ${levelName(h, k)} — about twenty, and then it ends.` });
  if (h.parent.feedOff) return head + `<div class="bzf-list"><article class="bzf-card bz-card"><div class="bzf-in"><h3>My Feed is switched off on this device.</h3><p class="bzf-body">A grown-up can switch it back on behind the PIN.</p><div class="bzf-row"><a class="bz-btn" href="#/home">Home →</a></div></div></article></div>`;
  if (!INDEX || !S.feed) return head + `<div class="bzf-list"><article class="bzf-card bz-card" role="status"><div class="bzf-in"><h3>Opening your feed…</h3></div></article></div>`;
  const P = S.feed.play, nx = nextStep(h, k);
  const cards = S.feed.list.map((x) => {
    let it = BODY[x.id] && { ...BODY[x.id], kind: x.kind }, st = P[x.id] || {};
    if (!it) return '';
    if (it.play && st.st === 'done') { it = { ...it, play: undefined }; st = {}; }
    return withMore(feedCard(it, x, st), it);
  }).join('');
  const label = nx.kind === 'stop' ? `Continue: ${nx.stop.title}` : nx.kind === 'check' ? 'Continue: prove it on a later day' : 'Continue your journey';
  return head + `<div class="bzf-list" data-feed="1">${cards}${feedEnd({ href: '#/continue', label, alt: { href: '#/home', label: 'Home' } })}</div>`;
}

/* the one question a card may ask: right pays once, wrong holds until Continue */
function answer(id, o) {
  const it = BODY[id], P = S.feed?.play; if (!it || !it.play || !P || (P[id] && P[id].st)) return;
  const k = kid();
  if (+o === 0) { P[id] = { st: 'right', o: 0 }; sfx('right'); bumpDay(k, 'right'); bumpDay(k, 'answers'); if (payOnce(k, id)) pay('answer', 'My Feed'); save(); }
  else { P[id] = { st: 'wrong', o: +o }; sfx('wrong'); }
  refocus(id);
}
function cont(id) { const P = S.feed?.play; if (P && P[id]) { P[id].st = 'done'; refocus(id); } }
function refocus(id) {
  render();
  requestAnimationFrame(() => { const c = document.querySelector(`.bzf-card[data-id="${CSS.escape(id)}"]`); if (c) c.focus({ preventScroll: true }); });
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-bzf]'); if (!t || S.route.name !== 'feed') return;
    e.preventDefault();
    if (t.dataset.bzf === 'ans') answer(t.dataset.id, t.dataset.o);
    else if (t.dataset.bzf === 'cont') cont(t.dataset.id);
  });
  document.addEventListener('keydown', (e) => {
    if (S.route.name !== 'feed' || S.sheet || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const focused = document.activeElement?.closest?.('.bzf-card');
    const onScreen = () => [...document.querySelectorAll('.bzf-card')].find((c) => { const r = c.getBoundingClientRect(); return c.querySelector('.bzf-opt:not([disabled]), [data-bzf=cont]') && r.bottom > 60 && r.top < innerHeight; });
    const card = focused && focused.querySelector('.bzf-opt:not([disabled]), [data-bzf=cont]') ? focused : onScreen();
    if (!card) return;
    if (/^[1-9]$/.test(e.key)) {
      const b = card.querySelectorAll('.bzf-opt')[+e.key - 1];
      if (b && !b.disabled) { e.preventDefault(); answer(b.dataset.id, b.dataset.o); }
    } else if (e.key === 'Enter' && card.querySelector('[data-bzf=cont]') && !e.target.closest('a,button:not([data-bzf=cont])')) { e.preventDefault(); cont(card.dataset.id); }
  });
}
