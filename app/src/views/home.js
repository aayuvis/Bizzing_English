/* home.js — exactly Bee's three rows, through the family shell's home() (SPEC §8, §8a.5):
   greeting · daily ring · word of the hour / Next on your journey (the ONE filled Continue) · the
   book you are reading / a tip · a line of the hour (sourced: from a held text only). */

import { home } from '../integration/bizzing-shell.js';
import { S, kid } from '../app.js';
import { esc, mascot } from '../ui.js';
import { nextStep, stopsOf } from '../next.js';
import { strand, level } from '../curriculum.js';
import { headline, today, bestLevel } from '../model.js';
import { STRAND_WORLD, plate } from '../worlds.js';
import { PASSAGES as ALLP, WORKS } from '../data/library.js';
import { shippedLines, shippable } from '../reading.js';
const PASSAGES = ALLP.filter(shippable);
const LINES = shippedLines().filter((l) => !/^["'“‘]/.test(l.text));   // the card adds its own quotation marks
import HOUR from '../data/hour-words.json';
import { MYTH_WORDS } from '../data/myth-words.js';
import { FIGURES } from '../data/literature.js';
import { FIGURE_KINDS } from '../data/figure-kinds.js';
import { cleared } from '../data/rights.js';
import { MEDALS } from '../medals.js';
import { icon } from '../ui.js';
import { save, render, pay } from '../app.js';
import { sfx } from '../sound.js';
import { storyCard } from './stories.js';
import { avatarOf } from './pages.js';

/* each tip opens the exact place that practises it, and says so */
const TIPS = [
  ['Read it aloud once — your ear catches what your eye skips.', '#/stage/aloud', 'Read it aloud, on the Stage'],
  ['Stuck on a word? Tap it. It goes into your word bank.', '#/library/words', 'your word bank'],
  ['Copy a great sentence slowly, and you will see how it is built.', '#/stop/wr1-copy', 'Copy it exactly'],
  ['When you read, picture it. When you write, help your reader picture it.', '#/stop/wr6-describe', 'Paint it in words'],
  ['A comma is a small breath. A full stop is a full breath.', '#/stop/s5-comma', 'Commas'],
  ['Before you answer, read the question twice.', '#/practice', 'your spaced checks'],
  ['Say a new word in a sentence of your own. Then it is yours.', '#/stop/w2-word', 'What does it mean?'],
  ['A simile says “like”; a metaphor says “is”. Spot them in real books.', '#/play/figure', 'Figure Hunt'],
  ['Many English words began as Greek myths — panic, echo, atlas.', '#/stop/w7-myth-names', 'Words from the myths'],
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
  /* the next step said as a whole clause, so a check or the Library never reads "your next stop is next." */
  const nextT = nx.stop?.title ? `“${nx.stop.title}”` : nx.kind === 'check' ? 'a quick check of what you learned' : nx.kind === 'library' ? 'a story in the Library' : 'the next stop';
  const isNext = nx.stop?.title ? `${nextT} is next.` : `Next: ${nextT}.`;
  if (!L) return `Hello! Shall we start? First: ${nextT}.`;
  if (L.what === 'stop') return `Last time: ${L.title}, ${L.right} of ${L.n} right. ${nx.resume ? 'Shall we finish it?' : isNext}`;
  if (L.what === 'read') return `You read “${L.title}” last time. ${isNext}`;
  if (L.what === 'game') return `You built ${L.right} in ${L.title}. Ready for ${nextT}?`;
  if (L.what === 'stage') return L.wpm ? `You read aloud at ${L.wpm} words a minute. ${isNext}` : L.secs ? `You spoke on the Stage for ${L.secs} seconds. ${isNext}` : `You spoke on the Stage last time. ${isNext}`;
  if (L.what === 'contest') return `You scored ${L.right} points in the Elocution Contest. ${isNext}`;
  return `Welcome back. ${isNext}`;
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
  const second = p && { kicker: 'The book you’re reading', title: w?.title || p.title, sub: `${p.title} · ${w?.author || ''}`, chip: w?.era || 'Classic', icon: 'book', href: `#/story/${p.id}`, plate: storyCard(p.id), cta: 'Read on', ctaIcon: 'book',
    progress: { pct: inWork.length ? (readN / inWork.length) * 100 : 0, label: `${readN} of ${inWork.length} passages read` } };
  const hourWords = (p?.words || []).filter((x) => HOUR[x.toLowerCase()]);
  const hw = hourWords[hourIdx(hourWords.length)] || Object.keys(HOUR)[hourIdx(Object.keys(HOUR).length)];
  const line = LINES[hourIdx(LINES.length)];
  const lw = line && WORKS.find((x) => x.id === line.work);
  const tip = TIPS[hourIdx(TIPS.length)];
  /* the line's own story, when a passage of that book is on the shelf for this child: open it, not the shelf */
  const lineStory = line && PASSAGES.find((x) => x.work === line.work && shippable(x) && x.band <= k.band);
  const t = k.targets;
  /* three rings, every day: right answers, passages read, and one thing made — said on the Stage or written at
     the desk. Counts of work, never minutes (today only: nothing carries over, so it is not a streak). */
  const parts = [{ n: d.right || 0, of: t.words, col: '#C2410C', label: 'right answers' }, { n: d.pages || 0, of: t.pages, col: '#0E6F6A', label: 'passages read' },
    { n: d.made || 0, of: t.made ?? 1, col: '#6C4FE0', label: 'said aloud or written' }];
  const ring = `<div class="rings">${ringSVG(parts)}<ul>${parts.map((x) => `<li><i style="background:${x.col}"></i><span>${x.of && x.n >= x.of ? `<b>${x.n}</b> ${esc(x.label)} — today’s ${x.of} done` : `<b>${x.n}</b> / ${x.of} ${esc(x.label)}`}</span></li>`).join('')}</ul></div>`;
  const page = home({
    greet: { mascot: avatarOf(k), hello: greetHello(), name: k.name, line: greetLine(k, nx) },   // the child's own avatar, as in Bee; a tap opens the deck
    ring: { html: ring, foot: { kicker: 'Your level', title: headline(k), href: bestLevel(k) ? `#/atlas/${bestLevel(k).s.id}` : st ? `#/atlas/${st.strand}` : '#/atlas' } },
    hour: { kicker: 'Word of the hour', title: hw || '—', sub: `${HOUR[hw] || ''}${p && (p.words || []).includes(hw) ? ` — from “${p.title}”, in ${w?.title || 'your book'}.` : ''} Tap for its origin and how to say it.`, icon: 'key', href: `#/word/${encodeURIComponent(hw || '')}` },
    next, second,
    tip: { kicker: 'Tip', text: `${tip[0]} Try it: ${tip[2]}.`, href: tip[1] },
    quote: line && { kicker: 'Line of the hour', text: line.text, who: `${/ in /.test(line.who) || !lw || line.who.includes(lw.title) ? line.who : `${line.who}, ${lw.title}`}${lw ? (line.who.includes(lw.author) ? `, ${lw.year}` : ` · ${lw.author}, ${lw.year}`) : ''}${lineStory ? ' — hear the story' : ' — about the book'}`, href: lineStory ? `#/story/${lineStory.id}` : `#/book/${line.work}` },
    foot: `<a href="#/privacy">Privacy</a> · Nothing leaves this device · Bizzing™ is a trademark of its owner`,
  });
  const av = avatarOf(k);
  return page.replace('<div class="bz-foot">', `<div class="fd">${feed(k)}</div><div class="bz-foot">`)
    .replace(`<section class="bz-card bz-greet" data-bz="greet"><img src="${esc(av)}" alt="">`, `<section class="bz-card bz-greet" data-bz="greet"><img src="${esc(av)}" alt="Your avatar cards" class="greet-av" data-act="av-deck" role="button" tabindex="0">`);   // the image stays the shell's own child, so its geometry holds
}

/* ---------- the feed under the journey cards (the family's: Maths' and Geography's Today's three, India's
   Keep going, Maths' Your progress). Every tile opens its OWN topic; the challenge is answered on the card. ---------- */
const dayIdx = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
const FIGS = FIGURES.filter((f) => cleared(WORKS.find((w) => w.id === f.work)));
const figOfDay = () => FIGS[(dayIdx() * 7) % FIGS.length];
const pick = (arr, salt) => arr[(dayIdx() * 31 + salt) % Math.max(1, arr.length)];

function feed(k) {
  const mine = PASSAGES.filter((p) => p.band <= k.band);
  /* a story in five minutes: today's, one the child has not heard if there is one */
  const fresh = mine.filter((p) => !k.reading[p.id]?.heard && p.kind !== 'verse'), st5 = pick(fresh.length ? fresh : mine, 3), w5 = st5 && WORKS.find((w) => w.id === st5.work);
  /* the myth of the day and the word it gave English */
  const myths = MYTH_WORDS.filter((m) => PASSAGES.some((p) => p.id === m.passage && p.band <= Math.max(2, k.band))), my = pick(myths, 11), mp = my && PASSAGES.find((p) => p.id === my.passage);
  /* the figure of the day: the same line in every house, answered here */
  const f = figOfDay(), fw = f && WORKS.find((w) => w.id === f.work), done = k.games.figday?.d === today() ? k.games.figday : null, right = FIGURE_KINDS.findIndex(([x]) => x === f?.figure);
  const challenge = f ? `<div class="bz-card fd-tile fd-fig"><span class="bz-kicker">Today’s challenge · the same line in every house</span><blockquote>“${esc(f.text)}”</blockquote><small>${esc(fw?.title || '')}${fw ? `, ${esc(fw.author)}` : ''}</small>
    <div class="fd-opts">${FIGURE_KINDS.map(([, name], i) => `<button data-act="fig-day" data-arg="${i}" ${done ? 'disabled' : ''} class="${done ? (i === right ? 'right' : i === done.pick ? 'wrong' : '') : ''}">${esc(name)}</button>`).join('')}</div>
    ${done ? `<p class="fd-say">${done.ok ? 'Right!' : `It is ${esc(FIGURE_KINDS[right][1].toLowerCase())}.`} ${esc(FIGURE_KINDS[right][1])}: it ${esc(FIGURE_KINDS[right][2])}. <a href="#/play/figure">Ten more in Figure Hunt</a></p>` : '<p class="fd-say">Which figure of speech is it — or none?</p>'}</div>` : '';
  const story = st5 ? `<a class="bz-card fd-tile fd-pic" href="#/story/${st5.id}"><span class="fd-art" style="background-image:url('${storyCard(st5.id)}')"></span><span class="fd-body"><span class="bz-kicker">A story in five minutes</span><b>${esc(st5.title)}</b><small>${esc(st5.hook || '')}</small><small class="fd-meta">${esc(w5?.title || '')} · ${esc(w5?.author || '')} · read aloud to you</small></span></a>` : '';
  const myth = my && mp ? `<a class="bz-card fd-tile fd-pic" href="#/story/${mp.id}"><span class="fd-art" style="background-image:url('${storyCard(mp.id)}')"></span><span class="fd-body"><span class="bz-kicker">Myth of the day · a word it gave English</span><b>${esc(my.from.charAt(0).toUpperCase() + my.from.slice(1))} → <i>${esc(my.word)}</i></b><small>${esc(my.meaning)}.</small><small class="fd-meta">Hear the myth: ${esc(mp.title)}</small></span></a>` : '';
  /* keep going: stories heard with exercises still to do — each opens its own exercises */
  const going = PASSAGES.filter((p) => k.reading[p.id]?.heard && Object.keys(k.reading[p.id]?.ex || {}).length < 7).slice(0, 3);
  const keep = going.length ? `<section class="fd-row"><h3 class="fd-h">Keep going</h3><div class="fd-keep">${going.map((p) => `<a class="bz-card fd-mini" href="#/story/${p.id}/do"><span class="fd-thumb" style="background-image:url('${storyCard(p.id)}')"></span><span><b>${esc(p.title)}</b><small>${Object.keys(k.reading[p.id]?.ex || {}).length} of 7 exercises done</small></span></a>`).join('')}</div></section>` : '';
  /* your progress: counts, each opening its own place */
  const read = PASSAGES.filter((p) => k.stops['rd-' + p.id]?.passed).length, bank = Object.keys(k.bank).length, medals = Object.keys(k.medals).length;
  const pieces = Object.entries(k.writing || {}).filter(([key, v]) => Array.isArray(v) && key !== 'talk').reduce((a, [, v]) => a + v.length, 0);
  const best = Math.max(0, ...(k.contests || []).map((c) => c.total));
  const prog = [['book', `${read} of ${PASSAGES.length}`, 'passages read', '#/log'], ['bank', String(bank), 'words in your bank', '#/library/words'], ['pen', String(pieces), 'pieces written', '#/atlas/writing'],
    ['lectern', best ? `${best} of 30` : '—', 'best contest', '#/stage/contest'], ['medal', `${medals} of ${MEDALS.length}`, 'medals', '#/medals']];
  return `<section class="fd-row"><h3 class="fd-h">Today’s three</h3><div class="fd-three">${story}${challenge}${myth}</div></section>${keep}
    <section class="fd-row"><h3 class="fd-h">Your progress</h3><div class="fd-prog">${prog.map(([ic, n, label, href]) => `<a class="bz-card fd-stat" href="${href}">${icon(ic)}<b>${n}</b><small>${label}</small></a>`).join('')}</div></section><p class="fd-gap"></p>`;
}

export const HOME_ACTIONS = {
  'fig-day': (a) => { const k = kid(), f = figOfDay(); if (!f || k.games.figday?.d === today()) return; const ok = FIGURE_KINDS[+a]?.[0] === f.figure;
    k.games.figday = { d: today(), pick: +a, ok }; if (ok) { pay('answer', 'Today’s challenge: a figure of speech'); sfx('right'); } else sfx('wrong'); save(); render(); },
};
