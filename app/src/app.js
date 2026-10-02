/* app.js — the running state and the few verbs every screen shares. The family idiom: state →
   render() + data-act dispatch. Views are `state → string`; actions mutate state, save, re-render. */

import { loadHousehold, saveHousehold, loadDevice, saveDevice, isDemo } from './store.js';
import { newHousehold, activeKid } from './model.js';
import { sfx } from './sound.js';
import { award } from './medals.js';
import { earn, milestone } from './family.js';
import { esc } from './ui.js';

export const S = {
  h: loadHousehold() || newHousehold(),
  dev: loadDevice(),
  route: { name: 'home', parts: [] },
  sheet: null,          // { kind, ... } an overlay sheet
  run: null,            // the running stop / passage / game
  wordcard: null,       // tap-a-word
  fromHive: /[?&]from=hive/.test(globalThis.location?.search || ''),
};
export const kid = () => activeKid(S.h);

let renderFn = () => {};
export const onRender = (f) => { renderFn = f; };
export const render = () => renderFn();
export function save() { saveHousehold(S.h); }
export function setDevice(p) { S.dev = saveDevice(p); applyDevice(); }
export function applyDevice() {
  const d = S.dev, html = document.documentElement;
  const dark = d.dark == null ? matchMedia('(prefers-color-scheme: dark)').matches : d.dark;
  if (dark) html.setAttribute('data-bz-dark', ''); else html.removeAttribute('data-bz-dark');
  html.dataset.text = d.text || 'M';
  html.classList.toggle('calm', !!d.calm);
  html.classList.toggle('still', d.motion === false);
}
export const isDark = () => document.documentElement.hasAttribute('data-bz-dark');

export function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

export function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2700);
}
export function confetti() {
  if (S.dev.calm || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
  const cols = ['#0E6F6A', '#C2410C', '#f0b429', '#6C4FE0', '#16956B'];
  c.innerHTML = Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 53) % 100}%;background:${cols[i % 5]};animation-delay:${(i % 10) * 60}ms"></i>`).join('');
  document.body.appendChild(c); setTimeout(() => c.remove(), 2200);
}

/* Coins for a learning event (the family's standard amounts; the wallet enforces the daily lid). */
export function pay(ev) { const k = kid(); if (!k) return 0; const n = earn(k.name, ev); if (n) sfx('coin'); return n; }

/* After any learning event: medals deserved are recorded and celebrated once. */
export function checkMedals() {
  const k = kid(); if (!k) return;
  const fresh = award(k);
  if (fresh.length) { save(); S.sheet = { kind: 'medal', medals: fresh.map((m) => m.id) }; sfx('medal'); confetti(); }
}
export function mark(ev, label) { const k = kid(); if (k) milestone(k.name, ev, label); }
export { isDemo, esc };
