/* panel.js — the story panel's behaviour (docs/story-panel-layout.md §5), wired once for every
   "picture + words, one page at a time" screen (a page that holds `#main > .storypanel`).

   Swipe: a sideways swipe presses the SAME [data-swipe=next|back] button a tap would, so it can never
     get past what a tap cannot (on the first scene there is no back button, and a swipe there does
     nothing). Sideways only: ≥ 60px, ≥ 1.6 × the vertical, under 0.7 s, one finger, not begun in a
     text field or in something that scrolls sideways itself, not while the painting is full screen.
     Passive listeners; the gesture is claimed with touch-action in panel.css, never preventDefault.
   Keys: turnKey(e) — ← and → press the same buttons (stories.js storyKey asks it).
   The painting, full screen: [data-full] opens on a click, a tap, Enter or Space. An overlay on <body>
     (an iPhone has no Fullscreen API outside video, and an overlay outside #app survives a re-render).
     A tap on the picture zooms 2.2× at the point tapped, then follows the pointer or the finger. Four
     ways out: ✕, Escape, Back, a tap outside the picture. Focus goes to ✕, and comes back to the
     picture on close. While it is open it owns the keyboard (a capture-phase listener), so nothing
     turns the page underneath and Escape does not also close a card or a sheet.

   Nothing here touches narration or the microphone: a page turn is the button's own action, and
   leaving the page still goes through main.js route(), which stops every track. */

import '../styles/panel.css';
import { icon, esc } from './ui.js';

const onPanel = () => !!document.querySelector('#main > .storypanel');
export const fullAttrs = (src) => ` data-full="${esc(src)}" role="button" tabindex="0" aria-label="See the painting full screen"`;

/* ---------- the painting, full screen ---------- */
let box = null;
export function openFull(src, from) {
  closeFull(true);
  const d = document.createElement('div');
  d.className = 'bzfull'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'The painting, full screen');
  d.innerHTML = `<img class="bzfull-img" src="${esc(src)}" alt=""><button class="bzfull-x" type="button" aria-label="Close">${icon('close')}</button>
    <p class="bzfull-hint">Tap the picture to look closer · tap outside it to close</p>`;
  document.body.appendChild(d);
  /* Back closes it: one history entry of its own, with the same address, so no route runs */
  history.pushState({ bzFull: 1 }, '');
  box = { el: d, from, zoom: false };
  const img = d.querySelector('.bzfull-img');
  const aim = (x, y) => { const r = img.getBoundingClientRect(); img.style.transformOrigin = `${Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))}% ${Math.max(0, Math.min(100, ((y - r.top) / r.height) * 100))}%`; };
  d.addEventListener('click', (e) => {
    if (e.target === img) { box.zoom = !box.zoom; if (box.zoom) aim(e.clientX, e.clientY); d.classList.toggle('zoomed', box.zoom); return; }
    closeFull();
  });
  d.addEventListener('pointermove', (e) => { if (box?.zoom && (e.pointerType === 'mouse' || e.buttons)) aim(e.clientX, e.clientY); });
  d.addEventListener('touchmove', (e) => { if (box?.zoom && e.touches[0]) { e.preventDefault(); aim(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
  d.querySelector('.bzfull-x').focus();
  document.documentElement.classList.add('bzfull-open');
}
/* byBack: the history entry is already gone (Back, or a new address) — do not step back again */
export function closeFull(byBack = false) {
  if (!box) return;
  const from = box.from; box.el.remove(); box = null;
  document.documentElement.classList.remove('bzfull-open');
  if (!byBack && history.state?.bzFull) history.back();
  const back = from && document.body.contains(from) ? from : document.querySelector('#main [data-full]');
  back?.focus({ preventScroll: true });
}
window.addEventListener('popstate', () => closeFull(true));
window.addEventListener('hashchange', () => closeFull(true));
window.addEventListener('keydown', (e) => {
  if (!box) return;
  e.stopImmediatePropagation();                     // the overlay owns the keyboard while it is open
  if (e.key === 'Escape') { e.preventDefault(); closeFull(); }
  else if (e.key === 'Tab') { e.preventDefault(); box.el.querySelector('.bzfull-x').focus(); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') e.preventDefault();
}, true);
document.addEventListener('click', (e) => {
  const f = e.target.closest?.('#main [data-full]'); if (!f || box) return;
  e.preventDefault(); e.stopPropagation(); openFull(f.getAttribute('data-full'), f);
}, true);
window.addEventListener('keydown', (e) => {
  const f = document.activeElement; if (box || (e.key !== 'Enter' && e.key !== ' ') || !f?.matches?.('#main [data-full]')) return;
  e.preventDefault(); e.stopImmediatePropagation(); openFull(f.getAttribute('data-full'), f);
}, true);

/* ---------- swipe to turn the page ---------- */
let t0 = null;
document.addEventListener('touchstart', (e) => {
  const t = e.touches?.[0];
  t0 = t && e.touches.length === 1 && !box && onPanel() && !e.target.closest?.('input, textarea, select, [contenteditable], [data-noswipe], .wordcard, .sheet') && !scrollsSideways(e.target)
    ? { x: t.clientX, y: t.clientY, at: Date.now() } : null;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  const t = e.changedTouches?.[0], s = t0; t0 = null;
  if (!t || !s || box || !onPanel()) return;
  const dx = t.clientX - s.x, dy = t.clientY - s.y;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - s.at > 700) return;
  press(dx < 0 ? 'next' : 'back');
}, { passive: true });
document.addEventListener('touchcancel', () => { t0 = null; }, { passive: true });
function scrollsSideways(el) {
  for (let e = el; e && e !== document.body; e = e.parentElement) { if (e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX)) return true; }
  return false;
}

/* one code path for a tap, a swipe and an arrow key: the button itself */
function press(way) {
  const b = document.querySelector(`#main > .storypanel [data-swipe="${way}"]`);
  if (b && !b.disabled) { b.click(); return true; }
  return false;
}
/* ← → on a story page, unless focus is in a text field (then the arrows move the caret) */
export function turnKey(e) {
  if ((e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') || !onPanel() || box) return false;
  if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '') || e.target?.isContentEditable) return false;
  press(e.key === 'ArrowRight' ? 'next' : 'back');
  return true;                                       // the page owns the arrows, even on the first scene
}
