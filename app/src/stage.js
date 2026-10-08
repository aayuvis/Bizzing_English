/* stage.js — THE STAGE, the one place a game or hub screen is framed (handover C §1.8, Bee spec §5.0),
   kept behind this one module so a family drop-in (integration/bizzing-stage.*) can replace it whole:

     · a mirrored HUD — a stat on the left, the title and the level chip centred, a stat on the right,
       the two side pods the same width so the centre is the true centre;
     · the world's painted plate edge to edge behind everything;
     · the play object centred and the largest thing on it;
     · controls centred, or mirrored in pairs of equal width;
     · no white: paper is painted parchment (styles/stage.css), never a white box;
     · no scroll during play: fitStage() sizes the stage to the room the page leaves it.

   Also here, because every timed mode needs them: onHidden(pause, resume) — a hidden tab stops the clock
   and a shown one starts it again without counting the time away (C §1.5) — and stillScene(on), which
   stills the living world backdrop behind a game, so the board runs at full frame rate. */

import { esc } from './ui.js';
import { plate } from './worlds.js';

/* A url() inside a custom property resolves against the stylesheet that USES it, not the page — resolve
   the plate against the page (brief v4, G5). */
export const plateUrl = (world, dark, card) => new URL(plate({ id: world }, dark, card), document.baseURI).href;

const pod = (side, x) => `<div class="stg-pod stg-${side}" data-hud="${side}"${x?.label ? ` aria-label="${esc(x.label)}"` : ''}>${x ? `${x.img ? `<img src="${esc(x.img)}" alt="">` : ''}<b${x.live ? ' aria-live="polite"' : ''}${x.cls ? ` class="${esc(x.cls)}"` : ''}>${x.v}</b><small>${esc(x.l || '')}</small>` : ''}</div>`;

/* o: { id, world, dark, left: { v, l, img? }, right, title, chip (html), track (html), main (html), tray (html),
   controls (html), mods (classes), fit (true during play) } */
export function stage(o) {
  return `<section class="stg${o.mods ? ' ' + o.mods : ''}" data-stage="${esc(o.id || '')}"${o.fit !== false ? ' data-fit' : ''} style="--plate:url('${plateUrl(o.world, o.dark)}')">
  <header class="stg-hud">${pod('l', o.left)}<div class="stg-mid"><h2 class="stg-title">${esc(o.title)}</h2>${o.chip || ''}</div>${pod('r', o.right)}</header>
  ${o.track ? `<div class="stg-track">${o.track}</div>` : ''}
  <div class="stg-main" data-stage-main>${o.main || ''}</div>
  ${o.tray ? `<div class="stg-tray">${o.tray}</div>` : ''}
  ${o.controls ? `<div class="stg-ctl">${o.controls}</div>` : ''}
</section>`;
}

/* Size every [data-fit] stage to the room the page leaves it: the viewport, less what stands above it and
   what the page keeps below it (the phone's tab bar clearance), so the page does not scroll. Never under
   MIN — a very short window scrolls rather than crushing the play. */
const MIN = 380;
export function fitStage() {
  if (typeof document === 'undefined') return;
  for (const el of document.querySelectorAll('.stg[data-fit]')) {
    el.style.height = '';
    const doc = document.documentElement, r = el.getBoundingClientRect(), top = r.top + scrollY, below = Math.max(0, doc.scrollHeight - (r.bottom + scrollY));
    const room = Math.floor(innerHeight - top - below);
    el.style.height = `${Math.max(MIN, room)}px`;
  }
}
if (typeof window !== 'undefined') { let t = null; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitStage, 80); }); }
/* after a render: fit on the next frame (the DOM is in place by then) */
export const afterRender = () => { if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(fitStage); };

/* The world backdrop stands still behind a game in play (C §1.5: 4–15 fps with it running, 55–60 without). */
export function stillScene(on) { if (typeof document !== 'undefined') document.documentElement.classList.toggle('bz-playing', !!on); }

/* A hidden tab pauses a timed mode; showing it again resumes, without counting the time away. Returns the
   function that stops listening. */
export function onHidden(pause, resume) {
  if (typeof document === 'undefined') return () => {};
  const f = () => (document.hidden ? pause() : resume());
  document.addEventListener('visibilitychange', f);
  if (document.hidden) pause();
  return () => document.removeEventListener('visibilitychange', f);
}
