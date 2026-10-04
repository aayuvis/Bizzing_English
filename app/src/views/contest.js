/* views/contest.js — the Elocution Contest on the Stage (engine: src/contest.js). Three rounds against
   five of Bee's rivals; the microphone rules of mic.js hold in every round (a real tap opens it, Stop ends
   every track, nothing recorded, no speech recognition). The child's points are shown with where each one
   came from; the rivals' are said to be the app's own. One contest coin event when a contest is finished. */

import { S, kid, save, render, pay, checkMedals, mark, confetti } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { PASSAGES } from '../data/library.js';
import { shippable, passageText, loadPassages, work } from '../reading.js';
import { start as micStart, stop as micStop, isLive } from '../mic.js';
import { stopNarration } from '../narrate.js';
import { stopById } from '../curriculum.js';
import { bumpDay } from '../model.js';
import { sfx, duck } from '../sound.js';
import MAN from '../data/voice-manifest.json';
import { ROUNDS, TALK_TARGET, field, rivalArt, rivalRound, standings, score, windowFor, breaths } from '../contest.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const narratorSecs = (pid) => (passageText(pid)?.scenes || []).reduce((a, _, i) => a + (MAN[`st/${pid}-${i}`]?.[0] || 0), 0) / 1000;
const clean = (t) => String(t || '').replace(/_/g, '');
export const contestOpen = (k) => !!k.stops['sp1-aloud']?.passed;

export async function openContest() {
  await loadPassages();
  const k = kid(), n = (k.contests ||= []).length + 1;
  const fit = (p, lo, hi) => { const w = passageText(p.id)?.words || 0; return w >= lo && w <= hi; };
  const poems = PASSAGES.filter((p) => shippable(p) && p.kind === 'verse' && p.band <= k.band && fit(p, 30, 160));
  const prose = PASSAGES.filter((p) => shippable(p) && p.kind === 'prose' && p.band <= k.band && fit(p, 60, 260));
  const topics = stopById('sp9-impromptu')?.speak.prompts || ['What makes a good friend?'];
  S.run = { mode: 'contest', n, round: 0, phase: 'intro', mine: [], detail: [], think: 0,
    poem: poems[(n * 7) % Math.max(1, poems.length)]?.id, prose: prose[(n * 5) % Math.max(1, prose.length)]?.id, topic: topics[(n * 3) % topics.length] };
}

function roundSpec(r) {
  const rd = ROUNDS[r.round];
  if (rd.id === 'talk') return { rd, target: TALK_TARGET, words: 0, places: 1 };
  const pid = r[rd.id], t = passageText(pid), verse = rd.id === 'poem';
  return { rd, pid, t, target: windowFor(t?.words || 0, narratorSecs(pid)), words: t?.words || 0, places: breaths(clean(t?.text), verse) };
}

const face = (id, name, sz = 54) => `<img class="rv" src="${id === 'you' ? '' : rivalArt(id)}" alt="" width="${sz}" height="${sz}" style="width:${sz}px;height:${sz}px">`;

export function contestView() {
  const r = S.run, k = kid();
  const head = pageHead({ title: 'Elocution Contest', sub: r?.phase === 'final' ? 'the results' : r && r.phase !== 'intro' ? `round ${r.round + 1} of 3 · ${ROUNDS[r.round].title}` : 'three rounds on the Stage', back: { label: 'Stage', href: '#/stage' } });
  if (!r || r.mode !== 'contest') return head + empty('oops', 'The contest is not ready.', link('The Stage', '#/stage'));
  if (!contestOpen(k)) return head + empty('point', 'Read a passage aloud on the Stage first — then the contest opens.', link('Read aloud', '#/stage/aloud', { ic: 'mic' }));
  const rivals = field(k.band);
  const honest = `<p class="note" style="margin:0">${icon('shield')} Your points come only from what this device can measure — timing, pace, pauses, volume. Your words and your expression are never scored. The rivals are made-up children from Bizzing Bee; their points are the app’s own.</p>`;
  if (r.phase === 'intro') {
    return head + `<div class="curtain" aria-hidden="true"></div><div class="reader"><div class="card pin stack"><div class="row"><img src="${mascot('cheer')}" alt="" style="width:96px;height:96px;object-fit:contain"><div><h3 style="margin:0">Contest ${r.n}</h3><p style="margin:0">${ROUNDS.map((x, i) => `${i + 1}. ${esc(x.title)}`).join(' · ')}</p></div></div>${honest}</div>
      <div class="card stack"><span class="kick">Tonight’s field</span><div class="rivals">${rivals.map((rv) => `<div class="rival">${face(rv.id)}<span><b>${esc(rv.name)}, ${rv.age}</b><small>${esc(rv.tell)}</small></span></div>`).join('')}</div>
      ${btn('Begin round 1', 'ct-begin', { ic: 'next' })}</div>
      ${(k.contests || []).length ? `<div class="card"><span class="kick">Your contests</span><ul class="ledger">${k.contests.slice(-5).reverse().map((c) => `<li><span>Contest ${c.n} · ${new Date(c.at).toLocaleDateString()}</span><b>${c.total}/30 · place ${c.place} of ${c.of}</b></li>`).join('')}</ul></div>` : ''}</div>`;
  }
  const sp = roundSpec(r), [lo, hi] = sp.target;
  if (r.phase === 'result' || r.phase === 'final') {
    const mine = r.detail[r.round], rows = standings(r.n, k.band, r.mine);
    const parts = mine.parts.map(([label, got, of]) => `<li><span>${esc(label)}</span><b>${got}/${of}</b></li>`).join('');
    const theirs = rivals.map((rv) => { const x = rivalRound(rv, r.n, r.round); return `<div class="rival">${face(rv.id, rv.name, 40)}<span><b>${esc(rv.name)} · ${x.total}/10</b><small>${esc(x.line)}</small></span></div>`; }).join('');
    const table = `<ol class="standings">${rows.map((x) => `<li class="${x.you ? 'you' : ''}"><span class="pl">${x.place}</span>${x.you ? `<span class="rv you">${icon('user')}</span>` : face(x.id, x.name, 32)}<span>${esc(x.name)}</span><b>${x.total}</b></li>`).join('')}</ol>`;
    if (r.phase === 'final') {
      const me = rows.find((x) => x.you);
      const say = me.place === 1 ? 'First place. The timing, the pace and the pauses all came together.' : me.place <= 3 ? `Place ${me.place} of ${rows.length}. A strong night on the Stage.` : `Place ${me.place} of ${rows.length}. Look at the round where your timing slipped — that is the easiest point to win back.`;
      return head + `<div class="reader"><div class="card finish stack pop"><img src="${mascot(me.place <= 3 ? 'cheer' : 'point')}" alt=""><h2>${me.total} of 30</h2><p style="margin:0">${esc(say)}</p><ul class="ledger" style="text-align:left">${r.detail.map((d, i) => `<li><span>${esc(ROUNDS[i].title)}</span><b>${d.total}/10</b></li>`).join('')}</ul><div class="rivals" style="text-align:left">${theirs}</div>${table}${honest}
        <div class="row" style="justify-content:center">${link('The Stage', '#/stage', { ic: 'lectern' })}${link('Another contest', '#/stage/contest', { cls: 'out', ic: 'undo' })}</div></div></div>`;
    }
    return head + `<div class="reader"><div class="card stack"><span class="kick">Your round — measured on this device</span><div class="stats"><div class="stat"><b>${fmt(r.last.secs)}</b><small>time · aim ${fmt(lo)}–${fmt(hi)}</small></div><div class="stat"><b>${r.last.pauses}</b><small>pauses</small></div><div class="stat"><b>${mine.total}/10</b><small>points</small></div></div>
      <ul class="ledger">${parts}</ul></div><div class="card stack"><span class="kick">The rivals</span><div class="rivals">${theirs}</div></div>
      <div class="card stack"><span class="kick">After round ${r.round + 1}</span>${table}${btn(r.round < 2 ? `Round ${r.round + 2}: ${ROUNDS[r.round + 1].title}` : 'The results', 'ct-next', { ic: 'next' })}</div></div>`;
  }
  let brief = '';
  if (sp.rd.id === 'talk') brief = `<div class="card pin stack"><span class="kick">Your topic</span><p class="prompt" style="margin:0">${esc(r.topic)}</p><p style="margin:0">${r.think ? `Think: <b id="think">${r.think}</b> seconds…` : 'Thirty seconds to think, then talk for about a minute.'}</p>${r.think || r.thought ? '' : btn('Start my 30 seconds', 'ct-think', { ic: 'clock', cls: 'out' })}</div>`;
  else if (sp.t) { const p = PASSAGES.find((x) => x.id === sp.pid);
    brief = `<div class="card stack"><div class="row" style="justify-content:space-between"><b>${esc(p.title)}</b><small class="muted">${esc(work(p.work).author)}</small></div><div class="passage${sp.rd.id === 'poem' ? ' verse poem' : ''}">${sp.rd.id === 'poem' ? esc(clean(sp.t.text)).replace(/\n/g, '<br>') : clean(sp.t.text).split(/\n\s*\n/).map((x) => `<p>${esc(x)}</p>`).join('')}</div></div>`; }
  else brief = `<div class="card">${empty('sleep', 'No piece for this round at your age yet.', '')}</div>`;
  const live = r.phase === 'live';
  return head + `<div class="reader"><div class="card stack"><span class="kick">Round ${r.round + 1} · ${esc(sp.rd.title)}</span><p style="margin:0">${esc(sp.rd.say)}</p></div>${brief}
    <div class="card stack"><div class="row" style="justify-content:space-between"><b>${live ? 'Speaking…' : 'When you are ready'}</b><span class="tag">aim for ${fmt(lo)}–${fmt(hi)}</span></div>
    <div class="meter" aria-hidden="true"><b id="lvl"></b></div><div class="clock" id="clock">${live ? '0:00' : ''}</div>
    <div class="row">${live ? btn('Stop', 'ct-stop', { ic: 'close' }) : btn('Start', 'ct-start', { ic: 'mic', dis: !sp.t && sp.rd.id !== 'talk' })}<span class="note">${live ? 'Listening for loudness only. Tap Stop when you finish — the microphone switches off at once.' : 'The microphone opens only when you tap Start. Nothing you say is recorded or sent anywhere.'}</span></div>${r.err ? `<p class="feedback no">${esc(r.err)}</p>` : ''}</div></div>`;
}

let clock = 0, thinker = 0;
export const CONTEST_ACTIONS = {
  'ct-begin': () => { S.run.phase = 'prep'; sfx('tap'); render(); },
  'ct-think': () => { const r = S.run; r.think = 30; render(); clearInterval(thinker);
    thinker = setInterval(() => { if (S.run !== r) return clearInterval(thinker); r.think--; const el = document.getElementById('think'); if (el) el.textContent = r.think; if (r.think <= 0) { clearInterval(thinker); r.thought = true; sfx('unlock'); render(); } }, 1000); },
  'ct-start': async () => {
    const r = S.run; r.err = ''; stopNarration(); clearInterval(thinker); r.think = 0; r.thought = true;
    try {
      await micStart((v) => { const b = document.getElementById('lvl'); if (b) b.style.width = Math.round(v * 100) + '%'; });
      r.phase = 'live'; r.t0 = Date.now(); duck(true); render();
      clearInterval(clock); clock = setInterval(() => { const el = document.getElementById('clock'); if (!isLive() || !el) return clearInterval(clock); el.textContent = fmt((Date.now() - r.t0) / 1000); }, 250);
    } catch { r.err = 'The microphone could not open. A grown-up may need to allow it in the browser’s settings.'; render(); }
  },
  'ct-stop': () => {
    const r = S.run, sp = roundSpec(r); clearInterval(clock);
    const m = micStop(sp.words); duck(false); sfx('finish');
    const sc = score(sp.rd.id, m, sp); r.last = m; r.detail[r.round] = sc; r.mine[r.round] = sc.total;
    const k = kid(); bumpDay(k, 'speak', Math.round(m?.secs || 0)); save();
    if (r.round === 2) CONTEST_ACTIONS['ct-finish'](); else { r.phase = 'result'; render(); }
  },
  'ct-next': () => { const r = S.run; if (r.round < 2) { r.round++; r.phase = 'prep'; r.think = 0; r.thought = false; render(); } },
  'ct-finish': () => {
    const r = S.run, k = kid(), rows = standings(r.n, k.band, r.mine), me = rows.find((x) => x.you);
    bumpDay(k, 'made'); (k.contests ||= []).push({ at: Date.now(), n: r.n, band: k.band, rounds: r.mine.slice(), total: me.total, place: me.place, of: rows.length });
    k.last = { what: 'contest', right: me.total, at: Date.now() };
    if (me.total > 0) { pay('contest', `Elocution Contest ${r.n}: ${me.total} of 30`); mark('stop', `Elocution Contest ${r.n}: ${me.total} of 30`); }
    save(); r.phase = 'final'; if (me.place <= 3 && me.total > 0) confetti(); render(); checkMedals();
  },
};
export { isLive, micStop };
