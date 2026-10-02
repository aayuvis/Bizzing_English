/* atlas.js — the strand map and the journey (SPEC §2, §8). Seven strands in parallel, each a painted
   road of ten levels; the road and its pins are drawn by the app over the painting, so a pin never
   depends on where a model put a path. A level with no stops yet says so — never a dead end. */

import { S, kid } from '../app.js';
import { esc, icon, pageHead, empty, link } from '../ui.js';
import { STRANDS, strand } from '../curriculum.js';
import { stopsOf, nextStep } from '../next.js';
import { strandOpen, planOpen, levelOpen, levelDone } from '../model.js';
import { stepOf, STEP } from '../mastery.js';
import { STRAND_WORLD, plate } from '../worlds.js';

const dark = () => document.documentElement.hasAttribute('data-bz-dark');
const passedIn = (k, sid) => stopsOf(sid).filter((s) => k.stops[s.id]?.passed).length;

function lockSay(k, s) {
  if (!planOpen(S.h, s.id)) return 'Opens with the family plan — a grown-up can switch it on';
  if (!strandOpen(k, s.id)) { const a = s.opens?.after; return a ? `Opens after ${strand(a[0]).title} level ${a[1]}` : 'Opens later'; }
  return '';
}

export function atlasView() {
  const k = kid();
  const total = STRANDS.reduce((a, s) => a + stopsOf(s.id).length, 0), done = STRANDS.reduce((a, s) => a + passedIn(k, s.id), 0);
  const tier = done < 10 ? 1 : done < 30 ? 2 : 3;
  const cards = STRANDS.map((s) => {
    const lock = lockSay(k, s);
    const lv = s.levels.map((l) => `<i class="${levelDone(k, s.id, l.n) ? 'done' : !lock && levelOpen(k, s.id, l.n) && stopsOf(s.id).some((x) => x.level === l.n) ? 'open' : ''}"></i>`).join('');
    return `<a class="strand${lock ? ' locked' : ''}" href="#/atlas/${s.id}"><div class="pl" style="background-image:url('${plate({ id: STRAND_WORLD[s.id] }, dark(), true)}')"><span class="badge" style="background:${s.colour}">${icon(s.icon)}</span></div>
      <div class="bd"><span class="kick">Strand ${s.n} · ${esc(s.sub)}</span><h3>${esc(s.title)}</h3><div class="lv" aria-label="levels">${lv}</div>
      <small class="muted">${lock ? esc(lock) : `${passedIn(k, s.id)} of ${stopsOf(s.id).length} stops passed`}</small></div></a>`;
  }).join('');
  return pageHead({ title: 'The Atlas', sub: 'seven strands, ten levels each', actions: [{ icon: 'clock', label: 'Revise', href: '#/practice' }, { icon: 'bank', label: 'My words', href: '#/bank' }],
    strip: { chip: `Tier ${tier} of 3`, pct: total ? (done / total) * 100 : 0, label: done ? `${done} stops passed` : 'on your way' } }) + `<div class="strands">${cards}</div>`;
}

export function strandView(sid) {
  const k = kid(), s = strand(sid);
  if (!s) return empty('oops', 'That strand is not on the map.', link('Back to the Atlas', '#/atlas'));
  const lock = lockSay(k, s), nx = nextStep(S.h, k);
  const stops = stopsOf(sid);
  const pins = s.levels.map((l) => {
    const has = stops.some((x) => x.level === l.n), d = levelDone(k, sid, l.n), open = !lock && levelOpen(k, sid, l.n);
    const cls = d ? 'done' : !has ? 'soon' : open ? '' : 'locked';
    return `<a class="lvpin ${cls}" href="#lv-${l.n}" ${nx.stop?.strand === sid && nx.stop.level === l.n ? 'aria-current="true"' : ''} aria-label="Level ${l.n}: ${esc(l.title)}">${l.n}</a>`;
  }).join('');
  const road = `<div class="road" style="background-image:url('${plate({ id: STRAND_WORLD[sid] }, dark())}')">
    <svg class="path" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true"><path d="M50 196 C 150 150, 200 200, 300 170 S 450 120, 550 165 S 750 200, 850 150 S 950 120, 980 140" fill="none" stroke="#fff8ec" stroke-width="14" stroke-linecap="round" stroke-dasharray="2 22" opacity=".85"/></svg>
    <div class="pins">${pins}</div></div>`;
  const levels = s.levels.map((l) => {
    const ls = stops.filter((x) => x.level === l.n), open = !lock && levelOpen(k, sid, l.n);
    const rows = ls.map((st) => {
      const r = k.stops[st.id], step = stepOf(k, st.id);
      const say = r?.passed ? `Passed · ${STEP[step]}` : r?.step ? 'Started — come back to it' : open ? 'Ready' : 'Opens when the level before is done';
      return `<a class="stoprow${r?.passed ? ' passed' : ''}" href="${open || r?.passed ? `#/stop/${st.id}` : `#/atlas/${sid}`}" ${open || r?.passed ? '' : 'aria-disabled="true"'}>
        <span class="st">${icon(r?.passed ? 'check' : st.kind === 'passage' ? 'book' : open ? 'next' : 'lock')}</span><span><b>${esc(st.title)}</b><small>${esc(say)}</small></span>${st.band ? `<span class="tag">ages ${['', '6–7', '8–10', '11–14'][st.band]}</span>` : '<span></span>'}</a>`;
    }).join('');
    const body = ls.length ? `<div class="stoplist">${rows}</div>` : `<p class="note">The stops for this level are being written. ${sid === 'literature' ? 'Meanwhile, the Library has every work’s card.' : 'Meanwhile, the levels before it are ready.'}</p>`;
    return `<section class="card lvcard" id="lv-${l.n}"><h3><span class="num">${l.n}</span>${esc(l.title)}</h3><p class="muted" style="margin:0">${esc(l.iCan)}</p>${body}</section>`;
  }).join('');
  return pageHead({ title: s.title, sub: s.sub, back: { label: 'Atlas', href: '#/atlas' }, strip: lock ? { chip: 'Not open yet', pct: 0, label: lock } : { chip: `Strand ${s.n}`, pct: stops.length ? (passedIn(k, sid) / stops.length) * 100 : 0, label: `${passedIn(k, sid)} of ${stops.length} stops` } })
    + road + `<div style="height:13px"></div><div class="levels">${levels}</div>`;
}
