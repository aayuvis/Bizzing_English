/* home.js — exactly Bee's three rows, through the family shell's home() (SPEC §8, §8a.5):
   greeting · daily ring · word of the hour / Next on your journey (the ONE filled Continue) · the
   book you are reading / a tip · a line of the hour (sourced: from a held text only). */

import { home } from '../integration/bizzing-shell.js';
import { S, kid } from '../app.js';
import { esc, mascot } from '../ui.js';
import { nextStep, stopsOf } from '../next.js';
import { strand, level } from '../curriculum.js';
import { headline, today } from '../model.js';
import { STRAND_WORLD, plate } from '../worlds.js';
import { PASSAGES as ALLP, WORKS } from '../data/library.js';
import { shippedLines, shippable } from '../reading.js';
const PASSAGES = ALLP.filter(shippable);
const LINES = shippedLines().filter((l) => !/^["'“‘]/.test(l.text));   // the card adds its own quotation marks
import HOUR from '../data/hour-words.json';

const TIPS = [
  'Read it aloud once — your ear catches what your eye skips.',
  'Stuck on a word? Tap it. It goes into your word bank.',
  'Copy a great sentence slowly, and you will see how it is built.',
  'When you read, picture it. When you write, help your reader picture it.',
  'A comma is a small breath. A full stop is a full breath.',
  'Before you answer, read the question twice.',
  'Say a new word in a sentence of your own. Then it is yours.',
];

const hourIdx = (n) => Math.floor(Date.now() / 36e5) % Math.max(1, n);
export const greetHello = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,'; };

function ringSVG(parts) {
  const R = [44, 33, 22], C = (r) => 2 * Math.PI * r;
  return `<svg viewBox="0 0 104 104" aria-hidden="true">${parts.map((p, i) => {
    const c = C(R[i]), f = Math.min(1, p.of ? p.n / p.of : 0);
    return `<circle cx="52" cy="52" r="${R[i]}" fill="none" stroke="${p.col}" stroke-opacity=".18" stroke-width="9"/><circle cx="52" cy="52" r="${R[i]}" fill="none" stroke="${p.col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 52 52)"/>`;
  }).join('')}</svg>`;
}

export function bookOf(k) {
  const p = (k.book && PASSAGES.find((x) => x.id === k.book.passage)) || PASSAGES.find((x) => x.band <= k.band && !k.stops['rd-' + x.id]?.passed) || PASSAGES[0];
  return p || null;
}

export function greetLine(k, nx) {
  const L = k.last;
  const nextT = nx.stop?.title ? `“${nx.stop.title}”` : 'your next stop';
  if (!L) return `Hello! Shall we start with ${nextT}?`;
  if (L.what === 'stop') return `Last time: ${L.title}, ${L.right} of ${L.n} right. ${nx.resume ? 'Shall we finish it?' : nextT + ' is next.'}`;
  if (L.what === 'read') return `You read “${L.title}” last time. ${nextT} is next.`;
  if (L.what === 'game') return `You built ${L.right} in ${L.title}. Ready for ${nextT}?`;
  if (L.what === 'stage') return `You read aloud at ${L.right} words a minute. ${nextT} is next.`;
  return `Welcome back. ${nextT} is next.`;
}

export function homeView() {
  const k = kid(), nx = nextStep(S.h, k), d = k.days[today()] || {};
  const st = nx.stop, sd = st ? strand(st.strand) : null, lv = st ? level(st.strand, st.level) : null;
  const lvStops = st ? stopsOf(st.strand).filter((x) => x.level === st.level) : [];
  const lvDone = lvStops.filter((x) => k.stops[x.id]?.passed).length;
  const dark = document.documentElement.hasAttribute('data-bz-dark');
  const next = nx.kind === 'check'
    ? { kicker: 'Next on your journey', title: 'Check what you know', sub: `${nx.ids.length} stops are ready to prove on a later day`, chip: 'Practice', icon: 'check', href: '#/continue', plate: plate({ id: 'scriptorium' }, dark, true), cta: 'Continue' }
    : nx.kind === 'stop'
      ? { kicker: 'Next on your journey', title: st.title, sub: st.iCan, chip: `${sd.title} · level ${st.level}`, icon: sd.icon, href: '#/continue', plate: plate({ id: STRAND_WORLD[st.strand] }, dark, true), cta: nx.resume ? 'Continue where you left off' : 'Continue',
        progress: { pct: lvStops.length ? (lvDone / lvStops.length) * 100 : 0, label: `${lv?.title || ''} · ${lvDone} of ${lvStops.length} stops` } }
      : { kicker: 'Next on your journey', title: 'Every open stop is done', sub: 'The Library is full of books to read next.', chip: 'Library', icon: 'book', href: '#/continue', plate: plate({ id: 'study' }, dark, true), cta: 'Continue' };
  const p = bookOf(k), w = p && WORKS.find((x) => x.id === p.work);
  const inWork = p ? PASSAGES.filter((x) => x.work === p.work) : [];
  const readN = inWork.filter((x) => k.stops['rd-' + x.id]?.passed).length;
  const second = p && { kicker: 'The book you’re reading', title: w?.title || p.title, sub: `${p.title} · ${w?.author || ''}`, chip: w?.era || 'Classic', icon: 'book', href: `#/read/${p.id}`, plate: plate({ id: 'study' }, dark, true), cta: 'Read on', ctaIcon: 'book',
    progress: { pct: inWork.length ? (readN / inWork.length) * 100 : 0, label: `${readN} of ${inWork.length} passages read` } };
  const hourWords = (p?.words || []).filter((x) => HOUR[x.toLowerCase()]);
  const hw = hourWords[hourIdx(hourWords.length)] || Object.keys(HOUR)[hourIdx(Object.keys(HOUR).length)];
  const line = LINES[hourIdx(LINES.length)];
  const lw = line && WORKS.find((x) => x.id === line.work);
  const t = k.targets;
  const parts = [{ n: d.right || 0, of: t.words, col: '#C2410C', label: 'right answers' }, { n: d.pages || 0, of: t.pages, col: '#0E6F6A', label: 'passages read' }];
  if (t.speak) parts.push({ n: Math.round((d.speak || 0) / 60), of: t.speak, col: '#6C4FE0', label: 'minutes spoken' });
  const ring = `<div class="rings">${ringSVG(parts)}<ul>${parts.map((x) => `<li><i style="background:${x.col}"></i><span><b>${x.n}</b> / ${x.of} ${esc(x.label)}</span></li>`).join('')}</ul></div>`;
  return home({
    greet: { mascot: mascot(k.last ? 'point' : 'wave'), hello: greetHello(), name: k.name, line: greetLine(k, nx) },
    ring: { html: ring, foot: { kicker: 'Your level', title: headline(k), href: '#/me' } },
    hour: { kicker: 'Word of the hour', title: hw || '—', sub: HOUR[hw] || '', icon: 'key', href: `#/word/${encodeURIComponent(hw || '')}` },
    next, second,
    tip: { kicker: 'Tip', text: TIPS[hourIdx(TIPS.length)], href: '#/help' },
    quote: line && { kicker: 'Line of the hour', text: line.text, who: / in /.test(line.who) || !lw ? line.who : `${line.who}, ${lw.title}`, href: `#/book/${line.work}` },
    foot: `<a href="#/privacy">Privacy</a> · Nothing leaves this device · Bizzing™ is a trademark of its owner`,
  });
}
