/* atlas.js — the Atlas of English (SPEC §2, §8). One painted land (art/atlas.webp, by day and by night)
   where each strand is a PLACE: the garden is Word, the monastery Sentence, the townhouse Reading, the
   lake Writing, the forum Speaking, the playhouse Literature, the castle Language. The pins, their
   progress rings and the child standing where they are next are drawn by the app over the painting —
   ATLAS_PINS are measured against atlas.webp; repaint it, re-measure.

   Each strand opens onto its own board: its world painted full width, one winding road with the ten
   levels as stations and every stop as a stepping stone, stars for how well it went, and the child's
   avatar on the stone they are on. Phones get the same road drawn top to bottom. */

import { S, kid, isDark } from '../app.js';
import { esc, icon, pageHead, empty, link } from '../ui.js';
import { STRANDS, strand, level } from '../curriculum.js';
import { stopsOf, nextStep } from '../next.js';
import { strandOpen, planOpen, levelOpen, levelDone } from '../model.js';
import { stepOf, STEP } from '../mastery.js';
import { STRAND_WORLD, plate } from '../worlds.js';
import { avatarOf } from './pages.js';

/* [x %, y %] on atlas.webp, at the foot of each place */
export const ATLAS_PINS = { word: [21, 70], sentence: [55, 82], reading: [27, 41], writing: [79, 58], speaking: [50, 50], literature: [72, 31], language: [46, 19] };

const passedIn = (k, sid) => stopsOf(sid).filter((s) => k.stops[s.id]?.passed).length;
const levelsDone = (k, sid) => strand(sid).levels.filter((l) => levelDone(k, sid, l.n)).length;
export function stars(k, st) {
  const r = k.stops[st.id]; if (!r?.passed) return 0;
  const n = st.kind === 'passage' ? 5 : 8, b = r.best || 0;
  return b >= n ? 3 : b >= n - 1 ? 2 : 1;
}
function lockSay(k, s) {
  if (!planOpen(S.h, s.id)) return 'Opens with the family plan';
  if (!strandOpen(k, s.id)) { const a = s.opens?.after; return a ? `Opens after ${strand(a[0]).title} level ${a[1]}` : 'Opens later'; }
  return '';
}
const ring = (f, col) => { const c = 2 * Math.PI * 21; return `<svg class="pring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="5"/><circle cx="24" cy="24" r="21" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/></svg>`; };

export function atlasView() {
  const k = kid(), nx = nextStep(S.h, k);
  const total = STRANDS.reduce((a, s) => a + stopsOf(s.id).length, 0), done = STRANDS.reduce((a, s) => a + passedIn(k, s.id), 0);
  const tier = done < 12 ? 1 : done < 40 ? 2 : 3;
  const here = nx.stop?.strand;
  const pins = STRANDS.map((s) => {
    const [x, y] = ATLAS_PINS[s.id], lock = lockSay(k, s), n = stopsOf(s.id).length, p = passedIn(k, s.id);
    return `<a class="apin${lock ? ' locked' : ''}${here === s.id ? ' here' : ''}" href="#/atlas/${s.id}" style="left:${x}%;top:${y}%;--c:${s.colour}" aria-label="${esc(s.title)}: ${lock || `${p} of ${n} stops`}">
      <span class="pdot">${ring(n ? p / n : 0, s.colour)}<i>${icon(lock ? 'lock' : s.icon)}</i></span><span class="plab"><b>${esc(s.title)}</b><small>${lock ? 'locked' : `${levelsDone(k, s.id)}/10`}</small></span>
      ${here === s.id ? `<img class="pme" src="${avatarOf(k)}" alt="">` : ''}</a>`;
  }).join('');
  const map = `<div class="atlasmap" style="background-image:url('art/atlas${isDark() ? '-night' : ''}${innerWidth <= 720 ? '-small' : ''}.webp')">${pins}</div>`;
  /* the next stop in each open strand: three ways in, one of them the Continue */
  const fronts = STRANDS.filter((s) => !lockSay(k, s)).map((s) => ({ s, st: stopsOf(s.id).find((x) => !k.stops[x.id]?.passed && levelOpen(k, s.id, x.level)) })).filter((f) => f.st).slice(0, 3);
  const three = fronts.length ? `<div class="grid3" style="margin:0 20px">${fronts.map(({ s, st }) => `<a class="card nextcard" href="#/stop/${st.id}" style="--c:${s.colour}"><span class="kick" style="color:${s.colour}">${esc(s.title)} · level ${st.level}</span><h3>${esc(st.title)}</h3><p class="muted" style="margin:0">${esc(st.iCan)}</p></a>`).join('')}</div>` : '';
  return pageHead({ title: 'The Atlas', sub: 'seven places, ten levels each', actions: [{ icon: 'check', label: 'Revise', href: '#/practice' }, { icon: 'bank', label: 'My words', href: '#/library/words' }],
    strip: { chip: `Tier ${tier} of 3`, pct: total ? (done / total) * 100 : 0, label: done ? `${done} of ${total} stops passed` : 'on your way' } })
    + `<div class="atlaswrap">${map}</div><h2 class="sechead">Where to next</h2>${three}`;
}

/* ---------- a strand's board: the road ---------- */
const N = 10;
const curveD = (t) => [60 + t * 880, 300 - t * 170 + 78 * Math.sin(t * Math.PI * 3)];          // desktop 1000 × 400
const curveP = (t) => [200 + 115 * Math.sin(t * Math.PI * 3.2), 60 + t * 980];                // phone 400 × 1100, level 1 at the top
const pathOf = (f, steps = 140) => 'M' + Array.from({ length: steps + 1 }, (_, i) => f(i / steps).map((v) => v.toFixed(1)).join(' ')).join(' L');

function board(k, s, phone) {
  const f = phone ? curveP : curveD, [W, H] = phone ? [400, 1100] : [1000, 400];
  const stops = stopsOf(s.id), lock = lockSay(k, s), nx = nextStep(S.h, k);
  let g = '';
  for (let L = 1; L <= N; L++) {
    const t0 = (L - 1) / (N - 1), [x, y] = f(t0), ls = stops.filter((x) => x.level === L), lv = level(s.id, L);
    const d = levelDone(k, s.id, L), open = !lock && levelOpen(k, s.id, L), has = ls.length > 0;
    /* the stones between this station and the next */
    if (L < N) ls.forEach((st, i) => {
      const t = t0 + ((i + 1) / (ls.length + 1)) / (N - 1), [sx, sy] = f(t), r = k.stops[st.id], cur = nx.stop?.id === st.id;
      const sc = stars(k, st), op = open || r?.passed;
      g += `<a href="${op ? `#/stop/${st.id}` : `#/atlas/${s.id}`}" class="stone${r?.passed ? ' done' : ''}${cur ? ' cur' : ''}${op ? '' : ' shut'}" aria-label="${esc(st.title)}${r?.passed ? `, ${sc} star${sc > 1 ? 's' : ''}` : op ? '' : ', not open yet'}">
        <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${phone ? 15 : 12}"/>${r?.passed ? `<text x="${sx.toFixed(1)}" y="${(sy + (phone ? 5 : 4)).toFixed(1)}" text-anchor="middle">${'★'.repeat(sc)}</text>` : ''}
        ${cur ? `<image href="${avatarOf(k)}" x="${(sx - 26).toFixed(1)}" y="${(sy - (phone ? 70 : 62)).toFixed(1)}" width="52" height="52"/>` : ''}<title>${esc(st.title)}</title></a>`;
    });
    g += `<a href="#lv-${L}" class="station${d ? ' done' : has ? (open ? ' open' : ' shut') : ' soon'}" aria-label="Level ${L}: ${esc(lv.title)}${d ? ', finished' : has ? '' : ', being written'}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${phone ? 30 : 24}"/><text x="${x.toFixed(1)}" y="${(y + (phone ? 9 : 7)).toFixed(1)}" text-anchor="middle">${L}</text><title>Level ${L}: ${esc(lv.title)}</title></a>`;
  }
  return `<svg class="roadsvg ${phone ? 'ph' : 'dk'}" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(s.title)}: the road of ten levels">
    <path d="${pathOf(f)}" class="roadbed"/><path d="${pathOf(f)}" class="roadline"/>${g}</svg>`;
}

export function strandView(sid) {
  const k = kid(), s = strand(sid);
  if (!s) return empty('oops', 'That place is not on the map.', link('Back to the Atlas', '#/atlas'));
  const lock = lockSay(k, s), stops = stopsOf(sid);
  const w = { id: STRAND_WORLD[sid] };
  const roads = `<div class="roadboard" style="background-image:url('${plate(w, isDark())}')">${board(k, s, false)}${board(k, s, true)}</div>`;
  const levels = s.levels.map((l) => {
    const ls = stops.filter((x) => x.level === l.n), open = !lock && levelOpen(k, sid, l.n), d = levelDone(k, sid, l.n);
    const rows = ls.map((st) => {
      const r = k.stops[st.id], sc = stars(k, st);
      const say = r?.passed ? `${'★'.repeat(sc)}${'☆'.repeat(3 - sc)} · ${STEP[stepOf(k, st.id)]}` : r?.step ? 'Started — come back to it' : open ? 'Ready' : 'Opens when the level before is done';
      return `<a class="stoprow${r?.passed ? ' passed' : ''}" href="${open || r?.passed ? `#/stop/${st.id}` : `#/atlas/${sid}`}">
        <span class="st">${icon(r?.passed ? 'check' : st.kind === 'passage' ? 'book' : open ? 'next' : 'lock')}</span><span><b>${esc(st.title)}</b><small>${esc(say)}</small></span>${st.band ? `<span class="tag">ages ${['', '6–7', '8–10', '11–14'][st.band]}</span>` : '<span></span>'}</a>`;
    }).join('');
    const body = ls.length ? `<div class="stoplist">${rows}</div>` : `<p class="note">The stops for this level are being written. The levels before it are ready.</p>`;
    return `<details class="card lvcard" id="lv-${l.n}"${(open && !d && ls.length) || (l.n === 1 && !lock) ? ' open' : ''}><summary><h3><span class="num${d ? ' done' : ''}">${l.n}</span>${esc(l.title)}<small class="muted">${ls.length ? `${ls.filter((x) => k.stops[x.id]?.passed).length}/${ls.length}` : 'soon'}</small></h3></summary><p class="muted" style="margin:0">${esc(l.iCan)}</p>${body}</details>`;
  }).join('');
  return pageHead({ title: s.title, sub: s.sub, back: { label: 'Atlas', href: '#/atlas' },
    strip: lock ? { chip: 'Not open yet', pct: 0, label: lock } : { chip: `${levelsDone(k, sid)} of 10 levels`, pct: stops.length ? (passedIn(k, sid) / stops.length) * 100 : 0, label: `${passedIn(k, sid)} of ${stops.length} stops` } })
    + roads + `<div style="height:13px"></div><div class="levels">${levels}</div>`;
}
