/* ui.js — small shared view helpers. Icons are the family's SVG set (bizzing-shell.js icon()):
   never emoji in a control, tab, heading or chip (the browser check counts them). */

export { icon, pageHead } from './integration/bizzing-shell.js';
import { icon } from './integration/bizzing-shell.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const btn = (label, act, { arg = '', ic = '', cls = '', dis = false, attrs = '' } = {}) =>
  `<button class="btn ${cls}" data-act="${act}"${arg !== '' ? ` data-arg="${esc(arg)}"` : ''}${dis ? ' disabled' : ''} ${attrs}>${ic ? icon(ic) : ''}<span>${esc(label)}</span></button>`;
export const link = (label, href, { ic = '', cls = '' } = {}) => `<a class="btn ${cls}" href="${esc(href)}">${ic ? icon(ic) : ''}<span>${esc(label)}</span></a>`;
export const mascot = (pose = 'wave') => `mascot/${pose}.webp`;
export function empty(pose, text, action) {
  return `<div class="card empty"><img src="${mascot(pose)}" alt=""><p>${esc(text)}</p>${action || ''}</div>`;
}
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
export function sheet(title, ic, body, { back = false } = {}) {
  return `<div class="scrim" data-act="sheet-close" data-self="1"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <header>${back ? `<button class="ib" data-act="sheet-close" aria-label="Back">${icon('back')}</button>` : '<span></span>'}<h2>${ic ? icon(ic) : ''}${esc(title)}</h2>
  <button class="ib x" data-act="sheet-close" aria-label="Close">${icon('close')}</button></header><div class="body">${body}</div></div></div>`;
}
