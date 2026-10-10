/* views/coach.js — the Coach (#/coach), Bizzing Bee's viewCoachDesk for English, with Quill as the coach:
   Quill's one-line read on a coloured band (from the misses only), today's rings beside it (→ the last thirty
   days, #/coach/days), the traps as a bar chart (tap, or ↑ ↓ ← → to switch), and the chosen trap as a path —
   meet it (the mistake) → see it (the rule, and a check to run in your head) → watch it work (worked examples:
   our own sentences or exact lines of held books) → beat it (the stops that teach it). Keyboard and touch. */

import '../../styles/coach.css';
import { S, kid, render } from '../app.js';
import { esc, icon, link, btn, mascot, pageHead } from '../ui.js';
import { TRAPS, TRAP_IDS, HABITS } from '../data/coach-rules.js';
import { missTraps, coachRead, todayMetrics, targets, ringsSVG, RING_COL, fmtMins, allClosed, metricDays, WINDOW } from '../coach.js';
import { activityLog } from '../family.js';
import { stopById, strand } from '../curriculum.js';
import { readingStop } from '../reading.js';
import { WORKS } from '../data/library.js';
import { STEP, due, learnedCount } from '../mastery.js';
import { speak } from '../voice.js';

const dayIdx = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
const stopTitle = (id) => stopById(id)?.title || readingStop(id)?.title || id;
const stopWhere = (id) => { const s = stopById(id) || readingStop(id); return s ? `${strand(s.strand)?.title || 'Reading'} · level ${s.level}` : ''; };
/* the trap on screen: the child's pick if it is one of theirs, else their worst; with no misses, none */
function selected(traps) { return traps.find((t) => t.id === S.coachTrap) || traps[0] || null; }

function todayPanel(k) {
  const m = todayMetrics(k, activityLog()), t = targets(k), done = allClosed(m);
  const row = (i, lab, v, of) => `<span class="co-tl"><i style="background:${RING_COL[i][0]}"></i><span>${lab}</span><b>${v}<small> / ${of}</small></b></span>`;
  return `<a class="co-today" href="#/coach/days" title="The last thirty days">${ringsSVG(72, [m.pApp, m.pPrac, m.pWords])}
    <span class="co-tls"><span class="co-tk">Today${done ? ` ${icon('check')}` : ''}</span>${row(0, 'App', fmtMins(m.app), `${t.app}m`)}${row(1, 'Practise', fmtMins(m.prac), `${t.prac}m`)}${row(2, 'Right', m.words, t.words)}
    <span class="co-tm">last 30 days ${icon('next')}</span></span></a>`;
}

export function coachView() {
  const k = kid(), traps = missTraps(k), read = coachRead(k), sel = selected(traps), top = traps[0];
  const col = top ? TRAPS[top.id].col : 'var(--bz-accent)';
  const line = esc(read.text).replace(/\[\[(.+?)\]\]/, '<b>$1</b>');
  const hero = `<section class="co-hero" style="--tc:${col}" data-coach="hero"><div class="co-hero-in">
      <div class="co-say"><img src="${mascot(traps.length ? 'think' : 'cheer')}" alt=""><div><span class="co-k">Quill’s read on ${esc(k.name)}</span><p class="co-read" data-coach="read">${line}</p></div></div>
      ${todayPanel(k)}</div></section>`;

  const maxN = top ? top.n : 1;
  const chart = traps.length ? `<div class="co-traps" role="group" aria-label="What catches you — use the arrow keys to switch" data-coach="traps">${traps.map((t) => { const r = TRAPS[t.id], on = sel?.id === t.id;
    return `<button class="co-trap${on ? ' on' : ''}" data-act="coach-trap" data-arg="${t.id}" aria-pressed="${on}" style="--tc:${r.col}"><span class="co-tn">${esc(r.label)}</span><span class="co-bar"><i style="width:${Math.max(12, Math.round((t.n / maxN) * 100))}%"></i></span><b class="co-tc">${t.n}</b></button>`; }).join('')}</div>
    <p class="note co-keys">Tap a trap, or use the arrow keys.</p>`
    : '<p class="muted" style="margin:0">No pattern yet. When an answer slips, it shows up here.</p>';

  let detail;
  if (!sel) {
    detail = `<div class="co-none" data-coach="none"><img src="${mascot('cheer')}" alt=""><h2>Nothing is catching you yet</h2>
      <p>Answer some questions and come back. Every answer that slips teaches me something about how you read and write — the one time a mistake is worth more than a right answer.</p>${link('Go and practise', '#/continue', { ic: 'next' })}</div>`;
  } else {
    const r = TRAPS[sel.id], first = r.practise[0];
    const step = (n, kick, body) => `<li class="co-step"><span class="co-n">${n}</span><div><b class="co-sk">${kick}</b>${body}</div></li>`;
    const eg = (e) => { const w = e.work && WORKS.find((x) => x.id === e.work);
      return `<li class="co-eg"><button class="co-say-btn" data-act="coach-say" data-arg="${esc(e.s)}" aria-label="Hear it">${icon('speaker')}</button><span>${w ? `<q>${esc(e.s)}</q> <small class="muted">— ${esc(w.title)}, ${esc(w.author)}</small>` : `<span class="co-egs">${esc(e.s)}</span>`}<small class="co-why">${esc(e.why)}</small></span></li>`; };
    const mine = Object.entries(sel.stops).sort((a, b) => b[1] - a[1]).map(([id]) => id).filter((id) => !r.practise.includes(id)).slice(0, 3);
    const stopRow = (id, why) => `<a class="stoprow" href="#/stop/${id}" data-coach-stop="${id}"><span class="st">${icon('next')}</span><span><b>${esc(stopTitle(id))}</b><small>${esc(stopWhere(id))} · ${esc(why || STEP[k.mastery[id]?.step || 0])}</small></span><span></span></a>`;
    detail = `<div class="co-detail" style="--tc:${r.col}" data-coach="detail" data-trap="${sel.id}">
      <div class="co-dh"><span class="co-dot"></span><div><h2>${esc(r.label)}</h2><small>caught you <b>${sel.n}</b> time${sel.n === 1 ? '' : 's'} in the last thirty days</small></div>
        <a class="btn" href="#/stop/${first}" data-coach="practise">${icon('next')}<span>Practise this</span></a></div>
      <ol class="co-path">
        ${step(1, 'Meet it — what goes wrong', `<p>${esc(r.mistake)}</p>`)}
        ${step(2, 'See it — the rule', `<p>${esc(r.rule)}</p><p class="co-check"><b>In your head:</b> ${esc(r.check)}</p>`)}
        ${step(3, 'Watch it work', `<ul class="co-egl">${r.egs.map(eg).join('')}</ul>`)}
        ${step(4, 'Beat it — the stops that teach it', `<div class="stoplist">${r.practise.map((id) => stopRow(id)).join('')}${mine.map((id) => stopRow(id, 'where it caught you')).join('')}</div>`)}
      </ol></div>`;
  }

  const slips = traps.reduce((a, t) => a + t.n, 0), passed = Object.values(k.stops).filter((x) => x.passed).length, d = due(k).length;
  const stat = (v, l, href) => `<a class="co-stat" href="${href}"><b>${v}</b><small>${l}</small></a>`;
  const numbers = `<div class="co-stats">${stat(passed, 'stops passed', '#/atlas')}${stat(learnedCount(k), 'learned on a later day', '#/practice')}${stat(slips, 'slips, 30 days', '#/practice')}${stat(d, 'ready to prove', '#/practice')}</div>`;
  const hi = ((S.coachTip ?? dayIdx()) % HABITS.length + HABITS.length) % HABITS.length, [ht, hb] = HABITS[hi];
  const habit = `<div class="co-habit"><img src="${mascot('point')}" alt=""><div><b>${esc(ht)}</b><p>${esc(hb)}</p></div></div><div class="row">${btn('Another one', 'coach-tip', { ic: 'next', cls: 'out small' })}<small class="muted">${hi + 1} of ${HABITS.length}</small></div>`;

  return pageHead({ title: 'Coach', sub: 'what Quill makes of your answers', back: { label: 'Home', href: '#/home' } }) + `<div class="co-wrap">${hero}
    <div class="co-grid"><div class="co-side"><section class="card stack"><h2>What catches you</h2>${chart}</section><section class="card stack"><h2>Your numbers</h2>${numbers}</section></div>
      <section class="card">${detail}</section></div>
    <div class="grid2"><section class="card stack"><h2>Quill’s habit of the day</h2>${habit}</section>
      <section class="card stack"><h2>How the Coach reads you</h2><p style="margin:0">From your answers only: a wrong answer in a check or a story’s exercises, and a miss in a game or a quiz. Each one is sorted into one trap. Nothing you write is read, and nothing leaves this device.</p>
      <p class="note" style="margin:0">The rings are a daily goal, not learning. Learning is counted only by right answers, and only on a later day.</p></section></div></div>`;
}

/* ---------- the last thirty days: one metric at a time, bars against the target line (Bee's metricsCard) ---------- */
const METRICS = [['app', 'App time', 0], ['prac', 'Practise time', 1], ['words', 'Right answers', 2]];
export function coachDaysView() {
  const k = kid(), sel = METRICS.find((x) => x[0] === S.coachMetric) || METRICS[0], [key, label, ci] = sel, col = RING_COL[ci][0];
  const t = targets(k), tgt = key === 'words' ? t.words : t[key] * 60, days = metricDays(k, activityLog(), 30);
  const vals = days.map((d) => d[key]), top = Math.max(tgt * 1.25, ...vals, 1), fmt = (v) => (key === 'words' ? String(v) : fmtMins(v));
  const hit = vals.filter((v) => v >= tgt).length, avg = Math.round(vals.reduce((a, b) => a + b, 0) / days.length), H = 132;
  const bars = days.map((d) => { const v = d[key], h = Math.max(v > 0 ? 3 : 0, Math.round((v / top) * H));
    return `<span class="cd-bar" title="${d.day} · ${fmt(v)}"><i style="height:${h}px;background:${v >= tgt ? col : `color-mix(in srgb, ${col} 34%, transparent)`}"></i></span>`; }).join('');
  const ticks = days.map((d, i) => `<span>${i % 5 === 0 || i === days.length - 1 ? +d.day.slice(8) : ''}</span>`).join('');
  return pageHead({ title: 'The last 30 days', sub: 'your daily goal, a day at a time', back: { label: 'Coach', href: '#/coach' } }) + `<div class="co-wrap"><section class="card stack" data-coach="days">
    <div class="row cd-pick" role="group" aria-label="Choose a ring">${METRICS.map(([kk, l, i]) => `<button class="bz-chip cd-m" data-act="coach-metric" data-arg="${kk}" aria-pressed="${kk === key}" style="--tc:${RING_COL[i][0]}"><i style="background:${RING_COL[i][0]}"></i><span>${l}</span></button>`).join('')}</div>
    <div class="cd-stats">${[['Target', fmt(tgt)], ['Today', fmt(vals.at(-1) || 0)], ['Daily average', fmt(avg)], ['Days on target', `${hit} of ${days.length}`]].map(([l, v]) => `<span><b style="color:${col}">${esc(v)}</b><small>${l}</small></span>`).join('')}</div>
    <div class="cd-chart" style="height:${H}px"><span class="cd-line" style="top:${((1 - tgt / top) * H).toFixed(1)}px;border-color:${col}"></span>${bars}</div><div class="cd-ticks">${ticks}</div>
    <p class="note" style="margin:0">${esc(label)}: the dashed line is the target a grown-up set; a solid bar is a day that reached it. Days on target are counted in a window — a missed day costs nothing. ${key === 'words' ? 'Right answers count work done, not learning: learning is proved on a later day.' : 'Time is a daily goal, never learning.'}</p></section></div>`;
}

export const COACH_ACTIONS = {
  'coach-trap': (a) => { if (!TRAPS[a]) return; S.coachTrap = a; render(); requestAnimationFrame(() => document.querySelector(`[data-act=coach-trap][data-arg="${a}"]`)?.focus({ preventScroll: true })); },
  'coach-tip': () => { S.coachTip = (S.coachTip ?? dayIdx()) + 1; render(); document.querySelector('[data-act=coach-tip]')?.focus(); },
  'coach-metric': (a) => { if (!METRICS.some((x) => x[0] === a)) return; S.coachMetric = a; render(); document.querySelector(`[data-act=coach-metric][data-arg="${a}"]`)?.focus(); },
  'coach-say': (a) => speak(a),
};

/* ↑ ↓ ← → walk the traps (anywhere on the Coach but a field); the chosen one takes focus */
export function coachKey(e) {
  if (S.route.name !== 'coach' || S.route.parts[1] || S.sheet) return false;
  if (!/^Arrow(Up|Down|Left|Right)$/.test(e.key) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return false;
  const traps = missTraps(kid()); if (!traps.length) return false;
  const i = Math.max(0, traps.findIndex((t) => t.id === (selected(traps)?.id))), d = /Down|Right/.test(e.key) ? 1 : -1;
  COACH_ACTIONS['coach-trap'](traps[(i + d + traps.length) % traps.length].id);
  return true;
}
export { TRAP_IDS, WINDOW };
