/* stage.js — speaking: recitation, then oratory (SPEC §5). The ladder, and its first rung built: read a
   passage aloud. The app measures what it honestly can on this device (time, pace, pauses, range);
   the child judges the rest with three ticks, and a grown-up can add a rubric behind the PIN. Each
   number on screen says who measured it. */

import { S, kid, save, render, pay, checkMedals, mark } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { strand } from '../curriculum.js';
import { PASSAGES } from '../data/library.js';
import { shippable, passageText, loadPassages, work } from '../reading.js';
import { start as micStart, stop as micStop, isLive } from '../mic.js';
import { bumpDay } from '../model.js';
import { taught } from '../mastery.js';
import { sfx, duck } from '../sound.js';

const SELF = ['I paused at the full stops', 'I spoke clearly enough for the back of the room', 'I looked up at the end of sentences'];

export function stageView() {
  const k = kid(), s = strand('speaking');
  const tries = (k.stage['sp1-aloud'] || []);
  const ladder = s.levels.map((l) => `<div class="stoprow${l.stops.length && k.stops[l.stops[0].id]?.passed ? ' passed' : ''}"><span class="st">${icon(l.stops.length ? (k.stops[l.stops[0].id]?.passed ? 'check' : 'mic') : 'lock')}</span>
    <span><b>${l.n}. ${esc(l.title)}</b><small>${esc(l.iCan)}${l.stops.length ? '' : ' — being written'}</small></span>${l.stops.length ? link('Open', '#/stage/aloud', { cls: 'small out' }) : '<span></span>'}</div>`).join('');
  return pageHead({ title: 'The Stage', sub: 'read aloud, recite, then speak', actions: [{ icon: 'mic', label: 'Read aloud', href: '#/stage/aloud' }] }) + `<div class="grid2" style="margin:0 20px">
    <div class="card pin stack" style="align-self:start"><div class="row"><img src="${mascot('point')}" alt="" style="width:110px;height:110px;object-fit:contain"><h3 style="margin:0">Read it aloud</h3></div><p style="margin:0">Pick a passage, tap Start, and read. The app listens only for loudness — never for your words — and keeps nothing but the numbers.</p>
      ${tries.length ? `<p class="tag ok">${icon('check')}${tries.length} time${tries.length > 1 ? 's' : ''} on the Stage · best pace ${Math.max(...tries.map((t) => t.wpm))} words a minute</p>` : ''}${link('Read aloud', '#/stage/aloud', { ic: 'mic' })}</div>
    <div class="card"><h3>The ladder</h3><div class="ladder">${ladder}</div></div></div>`;
}

export async function openAloud() {
  await loadPassages();
  const k = kid(), ps = PASSAGES.filter((p) => shippable(p) && p.band <= k.band && p.kind === 'prose');
  S.run = { mode: 'aloud', list: ps.map((p) => p.id), pid: ps[0]?.id, phase: 'pick', result: null, self: [] };
}

export function aloudView() {
  const r = S.run; if (!r || r.mode !== 'aloud') return '';
  const head = pageHead({ title: 'Read it aloud', sub: 'Speaking · level 1', back: { label: 'Stage', href: '#/stage' } });
  if (!r.pid) return head + empty('sleep', 'No passages for your age yet.', link('The Library', '#/library'));
  const p = PASSAGES.find((x) => x.id === r.pid), t = passageText(r.pid);
  if (r.phase === 'pick' || r.phase === 'live') {
    const pick = r.phase === 'pick' ? `<div class="row"><label for="pp" class="sr">Choose a passage</label><select id="pp" class="field" data-act="aloud-pick" style="max-width:420px">${r.list.map((id) => { const q = PASSAGES.find((x) => x.id === id); return `<option value="${id}" ${id === r.pid ? 'selected' : ''}>${esc(q.title)} — ${esc(work(q.work).title)}</option>`; }).join('')}</select></div>` : '';
    return head + `<div class="reader">${pick}<article class="card passage">${(t?.text || '').split(/\n\s*\n/).map((x) => `<p>${esc(x)}</p>`).join('')}</article>
      <div class="card stack"><div class="meter" aria-hidden="true"><b id="lvl"></b></div>
      <div class="row">${r.phase === 'live' ? btn('Stop', 'aloud-stop', { ic: 'close' }) : btn('Start reading aloud', 'aloud-start', { ic: 'mic' })}<span class="note">${r.phase === 'live' ? 'Listening for loudness only. Tap Stop when you finish — the microphone switches off at once.' : 'The microphone opens only when you tap Start, and nothing you say is recorded or sent anywhere.'}</span></div>
      ${r.err ? `<p class="feedback no">${esc(r.err)}</p>` : ''}</div></div>`;
  }
  const m = r.result, steady = m.wpm >= 90 && m.wpm <= 170;
  return head + `<div class="reader"><div class="card stack"><span class="kick">Measured on this device</span>
    <div class="stats"><div class="stat"><b>${Math.floor(m.secs / 60)}:${String(Math.round(m.secs % 60)).padStart(2, '0')}</b><small>time</small></div><div class="stat"><b>${m.wpm}</b><small>words a minute</small></div><div class="stat"><b>${m.pauses}</b><small>pauses</small></div><div class="stat"><b>${m.range} dB</b><small>loud-to-soft range</small></div></div>
    <p style="margin:0">${m.quiet ? 'It was very quiet — try again a little closer to the device.' : `You read ${t.words} words in ${m.secs} seconds — ${m.wpm} words a minute, with ${m.pauses} pauses. ${steady ? 'That is a steady reading pace.' : m.wpm > 170 ? 'That is quick — try breathing at each full stop.' : 'That is unhurried — good for a story told slowly.'}`}</p>
    <p class="note">The app cannot hear expression, so it does not say anything about it. You judge that — and so can a grown-up, on the grown-ups’ page.</p></div>
    <div class="card stack"><span class="kick">You judge</span>${SELF.map((x, i) => `<button class="opt" data-act="aloud-self" data-arg="${i}" aria-pressed="${r.self.includes(i)}">${icon(r.self.includes(i) ? 'check' : 'star')}<span>${esc(x)}</span></button>`).join('')}
    <div class="row">${btn('Save', 'aloud-save', { ic: 'check' })}${btn('Try again', 'aloud-again', { cls: 'out', ic: 'undo' })}</div></div></div>`;
}

export const STAGE_ACTIONS = {
  'aloud-start': async () => {
    const r = S.run; r.err = '';
    try { await micStart((v) => { const b = document.getElementById('lvl'); if (b) b.style.width = Math.round(v * 100) + '%'; }); r.phase = 'live'; duck(true); }
    catch { r.err = 'The microphone could not open. A grown-up may need to allow it in the browser’s settings.'; }
    render();
  },
  'aloud-stop': () => { const r = S.run; const t = passageText(r.pid); r.result = micStop(t?.words || 0); duck(false); r.phase = 'done'; sfx('finish'); render(); },
  'aloud-self': (a) => { const r = S.run, i = +a; r.self = r.self.includes(i) ? r.self.filter((x) => x !== i) : [...r.self, i]; render(); },
  'aloud-again': () => { S.run.phase = 'pick'; S.run.result = null; S.run.self = []; render(); },
  'aloud-save': () => {
    const r = S.run, k = kid(), m = r.result;
    (k.stage['sp1-aloud'] ||= []).push({ at: Date.now(), passage: r.pid, secs: m.secs, wpm: m.wpm, pauses: m.pauses, range: m.range, self: r.self.length });
    bumpDay(k, 'speak', Math.round(m.secs));
    k.last = { what: 'stage', right: m.wpm, at: Date.now() };
    const rec = (k.stops['sp1-aloud'] ||= { passed: false, tries: 0 }); rec.tries++;
    if (!rec.passed && !m.quiet && m.secs >= 20) { rec.passed = true; taught(k, 'sp1-aloud'); pay('stop'); mark('stop', 'Read a passage aloud on the Stage'); }
    save(); location.hash = '#/stage'; checkMedals();
  },
};
export function aloudPick(v) { S.run.pid = v; render(); }
export { isLive, micStop };
