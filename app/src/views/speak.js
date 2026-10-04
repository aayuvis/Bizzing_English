/* speak.js — Speaking levels 2–10 (SPEC §5): recite a poem learned by fading, recite with expression,
   tell a story, show and tell, a one- and a three-minute speech, a famous speech, impromptu, debate.

   The microphone rules hold for every one (mic.js): it opens only from a real tap, every track stops
   the instant speaking ends, nothing is recorded, no speech recognition. What is measured on the device
   is said plainly — time, pace (when the words are known), pauses, volume range. What cannot be
   measured (expression, eye contact, whether it persuaded) is judged by the child's own ticks and a
   grown-up's rubric behind the PIN, and the screen says which. Notes a child plans with are free
   writing: they stay in k.writing, on this device. */

import { S, kid, save, render, pay, checkMedals, mark } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { stopById, level } from '../curriculum.js';
import { PASSAGES } from '../data/library.js';
import { shippable, passageText, loadPassages, work } from '../reading.js';
import { start as micStart, stop as micStop, isLive } from '../mic.js';
import { narrate, stopNarration } from '../narrate.js';
import { bumpDay } from '../model.js';
import { taught } from '../mastery.js';
import { sfx, duck } from '../sound.js';
import MAN from '../data/voice-manifest.json';
import { storyArt } from './stories.js';

const SELF = {
  recite: ['I said it without looking', 'I paused at the ends of lines', 'I spoke clearly'],
  express: ['I paused where the marks said', 'I leaned on one word in each line', 'Some lines were softer, some louder'],
  story: ['I kept the events in order', 'I used my own words', 'I looked at my listener'],
  talk: ['I said what it is and why it matters', 'I looked up as I spoke', 'I asked a question at the end'],
  speech: ['I opened with a hook', 'I made three points', 'I closed strongly', 'I paused instead of saying “um”'],
  declaim: ['I paused where the speaker paused', 'I stood up straight', 'I looked up at the end of sentences'],
  impromptu: ['I said my answer first', 'I gave two reasons', 'I finished by saying my answer again'],
  debate: ['I gave three reasons for', 'I gave three reasons against', 'I was fair to the side I disagree with'],
};
const W = (k) => (k.writing ||= {});
const plan = (k, id) => ((W(k).speech ||= {})[id] ||= { hook: '', p1: '', p2: '', p3: '', close: '', against: '' });
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export async function openSpeak(id, pre) {   // pre: a verse passage to recite (Tools → Quotes & Poems → Learn it by heart)
  await loadPassages();
  const k = kid(), st = stopById(id);
  if (!st?.speak) { S.run = { mode: 'speak', error: true }; return; }
  const cfg = st.speak, tries = (k.stage[id] || []).length;
  const poems = PASSAGES.filter((p) => shippable(p) && p.kind === 'verse' && p.band <= k.band && (passageText(p.id)?.words || 999) <= 140);
  const heard = PASSAGES.filter((p) => shippable(p) && p.kind !== 'verse' && k.reading[p.id]?.heard);
  const stories = heard.length ? heard : PASSAGES.filter((p) => shippable(p) && p.kind !== 'verse' && p.band <= k.band);
  const r = { mode: 'speak', id, st, cfg, phase: 'prep', fade: 0, side: 'for', results: [], self: [], think: 0 };
  if (cfg.mode === 'recite') r.pid = (poems[tries % Math.max(1, poems.length)] || PASSAGES.find((p) => p.kind === 'verse'))?.id;
  if (cfg.mode === 'recite' && pre && PASSAGES.some((p) => p.id === pre && p.kind === 'verse' && shippable(p))) r.pid = pre;
  if (cfg.mode === 'story') r.pid = stories[tries % stories.length]?.id;
  if (cfg.mode === 'declaim') r.pid = cfg.passage;
  if (cfg.prompts) r.prompt = cfg.prompts[tries % cfg.prompts.length];
  S.run = r;
}

/* fading: hide every 4th word, then every 2nd, then all but each line's first letter, then everything */
function faded(text, step) {
  let i = 0;
  return text.split('\n').map((line) => line.replace(/[A-Za-z][A-Za-z'’-]*/g, (w) => {
    const n = i++, hide = step === 1 ? n % 4 === 3 : step === 2 ? n % 2 === 1 : step >= 3;
    if (!hide) return esc(w);
    return step === 3 ? `<span class="fade">${esc(w[0])}${'_'.repeat(Math.max(1, w.length - 1))}</span>` : `<span class="fade">${'_'.repeat(w.length)}</span>`;
  })).join('<br>');
}
/* expression marks: a pause after each comma or full stop, a long pause at each line's end, and the
   longest word of each line in bold to lean on — offered as a suggestion, never a rule */
function marked(text) {
  return text.split('\n').map((line) => {
    const ws = line.match(/[A-Za-z][A-Za-z'’-]*/g) || []; const lean = ws.slice().sort((a, b) => b.length - a.length)[0];
    let leaned = false;
    return esc(line).replace(/([,.;:!?])/g, '$1 <span class="pmark">/</span>').replace(/[A-Za-z][A-Za-z'’-]*/g, (w) => (!leaned && w === lean ? (leaned = true, `<b class="lean">${w}</b>`) : w)) + ' <span class="pmark">//</span>';
  }).join('<br>');
}
const clipsOf = (pid) => (passageText(pid)?.scenes || []).map((_, i) => `st/${pid}-${i}`);
const narratorSecs = (pid) => clipsOf(pid).reduce((a, k) => a + (MAN[k]?.[0] || 0), 0) / 1000;

export function speakView() {
  const r = S.run, k = kid();
  if (!r || r.error) return empty('oops', 'That speaking stop is not here.', link('The Stage', '#/stage'));
  const st = r.st, cfg = r.cfg, lv = level('speaking', st.level);
  const head = pageHead({ title: st.title, sub: `Speaking · level ${st.level} · ${lv.title}`, back: { label: 'Stage', href: '#/stage' } });
  const p = r.pid && PASSAGES.find((x) => x.id === r.pid), t = r.pid && passageText(r.pid);
  const text = t ? t.text.replace(/_/g, '') : '';
  const [lo, hi] = cfg.target;
  let brief = '';
  if (cfg.mode === 'recite') brief = `<div class="card stack"><div class="row" style="justify-content:space-between"><b>${esc(p.title)}</b><small class="muted">${esc(work(p.work).author)}</small></div>
      <div class="poem passage verse">${cfg.marks ? marked(text) : faded(text, r.phase === 'prep' ? r.fade : 4)}</div>
      ${cfg.marks ? '<p class="note" style="margin:0"><span class="pmark">/</span> a pause · <span class="pmark">//</span> a longer pause · <b>bold</b> a word to lean on — a suggestion, not a rule.</p>' : ''}
      <div class="row">${btn('Hear it', 'sp-hear', { ic: 'speaker', cls: 'out' })}${cfg.fade && r.phase === 'prep' ? (r.fade < 4 ? btn(r.fade ? 'I said it — fade more' : 'I said it with the words — now fade some', 'sp-fade', { ic: 'next' }) : '') : ''}</div>
      ${cfg.fade && r.phase === 'prep' ? `<p class="note" style="margin:0">Step ${r.fade + 1} of 5: ${['say it with all the words', 'every fourth word has gone', 'half the words have gone', 'only first letters are left', 'nothing left — it is in you'][r.fade]}.</p>` : ''}</div>`;
  else if (cfg.mode === 'story') brief = `<div class="card stack"><b>Tell it: ${esc(p.title)}</b><div class="storystrip">${(t?.scenes || []).map((sc, i) => `<div><img src="${storyArt(p.id, i >= Math.ceil((t.scenes.length) / 2))}" alt=""><small>${i + 1}. ${esc(sc.replace(/_/g, '').split(/(?<=[.!?])\s/)[0].slice(0, 90))}…</small></div>`).join('')}</div><p class="note" style="margin:0">The first words of each scene, to jog your memory. Tell it in your own words.</p></div>`;
  else if (cfg.mode === 'declaim') brief = `<div class="card stack"><b>${esc(p.title)}</b><div class="passage">${text.split(/\n\s*\n/).map((x) => `<p>${esc(x)}</p>`).join('')}</div><div class="row">${btn('Hear it read', 'sp-hear', { ic: 'speaker', cls: 'out' })}<span class="note">The narrator takes ${fmt(narratorSecs(r.pid))}.</span></div></div>`;
  else {
    const pl = plan(k, r.id);
    const field = (key, label) => `<label class="deskpart"><span><b>${esc(label)}</b></span><textarea class="field" rows="2" data-act="sp-plan" data-arg="${key}" spellcheck="true" aria-label="${esc(label)}">${esc(pl[key])}</textarea></label>`;
    const planner = cfg.mode === 'debate' ? field('p1', 'Reasons FOR the motion') + field('against', 'Reasons AGAINST the motion')
      : cfg.plan ? field('hook', 'Hook — a question, a surprising fact, a tiny story') + field('p1', 'First point') + field('p2', 'Second point') + field('p3', 'Third point') + field('close', 'Close')
        : cfg.mode === 'talk' ? field('hook', 'What it is, and where it came from') + field('p1', 'Why it matters to me') + field('close', 'My question for the room') : '';
    brief = `<div class="card pin stack"><span class="kick">${cfg.mode === 'debate' ? 'The motion' : cfg.mode === 'impromptu' ? 'Your topic' : 'Your topic'}</span><p class="prompt" style="margin:0">${esc(r.prompt)}</p>${btn('A different one', 'sp-other', { cls: 'ghost small', ic: 'undo' })}</div>
      ${cfg.mode === 'impromptu' ? `<div class="card stack"><p style="margin:0">${r.think ? `Think: <b id="think">${r.think}</b> seconds…` : 'Thirty seconds to think, then speak for a minute.'}</p>${r.think ? '' : btn('Start my 30 seconds', 'sp-think', { ic: 'clock', cls: 'out' })}</div>` : ''}
      ${planner ? `<div class="card stack"><span class="kick">Plan — notes stay on this device</span>${planner}</div>` : ''}`;
  }
  const side = cfg.mode === 'debate' ? (r.results.length ? 'AGAINST' : 'FOR') : '';
  const timer = `<div class="card stack"><div class="row" style="justify-content:space-between"><b>${r.phase === 'live' ? 'Speaking…' : side ? `Now argue ${side} the motion` : 'When you are ready'}</b><span class="tag">aim for ${fmt(lo)}–${fmt(hi)}</span></div>
    <div class="meter" aria-hidden="true"><b id="lvl"></b></div><div class="clock" id="clock">${r.phase === 'live' ? '0:00' : ''}</div>
    <div class="row">${r.phase === 'live' ? btn('Stop', 'sp-stop', { ic: 'close' }) : btn(side ? `Start — ${side}` : 'Start speaking', 'sp-start', { ic: 'mic' })}<span class="note">${r.phase === 'live' ? 'Listening for loudness only. Tap Stop when you finish — the microphone switches off at once.' : 'The microphone opens only when you tap Start. Nothing you say is recorded or sent anywhere.'}</span></div>${r.err ? `<p class="feedback no">${esc(r.err)}</p>` : ''}</div>`;
  if (r.phase === 'done') {
    const rows = r.results.map((m, i) => `<div class="stats">${cfg.mode === 'debate' ? `<div class="stat"><b>${i ? 'Against' : 'For'}</b><small>side</small></div>` : ''}<div class="stat"><b>${fmt(m.secs)}</b><small>time ${m.secs >= lo && m.secs <= hi ? '— on target' : m.secs < lo ? '— a little short' : '— a little long'}</small></div>
      ${m.wpm ? `<div class="stat"><b>${m.wpm}</b><small>words a minute</small></div>` : ''}<div class="stat"><b>${m.pauses}</b><small>pauses</small></div><div class="stat"><b>${m.range} dB</b><small>loud-to-soft range</small></div></div>`).join('');
    const nar = (cfg.mode === 'declaim' || cfg.mode === 'recite') && r.pid ? `<p style="margin:0">The narrator took ${fmt(narratorSecs(r.pid))}; you took ${fmt(r.results[0].secs)}.</p>` : '';
    return head + `<div class="reader"><div class="card stack"><span class="kick">Measured on this device</span>${rows}${nar}<p class="note" style="margin:0">The app measures time, pace, pauses and volume. It cannot hear expression, so it says nothing about it — you and a grown-up judge that.</p></div>
      <div class="card stack"><span class="kick">You judge</span>${(SELF[cfg.marks ? 'express' : cfg.mode] || SELF.talk).map((x, i) => `<button class="opt" data-act="sp-self" data-arg="${i}" aria-pressed="${r.self.includes(i)}">${icon(r.self.includes(i) ? 'check' : 'star')}<span>${esc(x)}</span></button>`).join('')}
      <div class="row">${btn('Save', 'sp-save', { ic: 'check' })}${btn('Try again', 'sp-again', { cls: 'out', ic: 'undo' })}</div></div></div>`;
  }
  return head + `<div class="reader"><div class="card stack"><span class="kick">${esc(st.iCan)}</span><p style="margin:0">${esc(st.learn.why)}</p></div>${brief}${(cfg.mode !== 'recite' || !cfg.fade || r.fade >= 4) ? timer : ''}</div>`;
}

let clock = 0, thinker = 0;
function playSeq(keys, texts) { let i = 0; const next = () => { if (i < keys.length) narrate(keys[i], texts[i++], { onEnd: next }); }; next(); }
export const SPEAK_ACTIONS = {
  'sp-hear': () => { const r = S.run, t = passageText(r.pid); playSeq(clipsOf(r.pid), t.scenes); },
  'sp-fade': () => { S.run.fade = Math.min(4, S.run.fade + 1); sfx('tap'); render(); },
  'sp-other': () => { const r = S.run; const ps = r.cfg.prompts; r.prompt = ps[(ps.indexOf(r.prompt) + 1) % ps.length]; render(); },
  'sp-think': () => { const r = S.run; r.think = r.cfg.think || 30; render(); clearInterval(thinker);
    thinker = setInterval(() => { if (S.run !== r) return clearInterval(thinker); r.think--; const el = document.getElementById('think'); if (el) el.textContent = r.think; if (r.think <= 0) { clearInterval(thinker); sfx('unlock'); render(); } }, 1000); },
  'sp-start': async () => {
    const r = S.run; r.err = ''; stopNarration();
    try {
      await micStart((v) => { const b = document.getElementById('lvl'); if (b) b.style.width = Math.round(v * 100) + '%'; });
      r.phase = 'live'; r.t0 = Date.now(); duck(true); render();
      clearInterval(clock); clock = setInterval(() => { const el = document.getElementById('clock'); if (!isLive() || !el) return clearInterval(clock); el.textContent = fmt((Date.now() - r.t0) / 1000); }, 250);
    } catch { r.err = 'The microphone could not open. A grown-up may need to allow it in the browser’s settings.'; render(); }
  },
  'sp-stop': () => {
    const r = S.run; clearInterval(clock);
    const words = (r.cfg.mode === 'recite' || r.cfg.mode === 'declaim') && r.pid ? passageText(r.pid)?.words || 0 : 0;
    const m = micStop(words); duck(false); r.results.push(m); sfx('finish');
    r.phase = r.cfg.mode === 'debate' && r.results.length < 2 ? 'prep' : 'done'; render();
  },
  'sp-self': (a) => { const r = S.run, i = +a; r.self = r.self.includes(i) ? r.self.filter((x) => x !== i) : [...r.self, i]; render(); },
  'sp-again': () => { const r = S.run; r.phase = 'prep'; r.results = []; r.self = []; r.fade = r.cfg.fade ? 4 : 0; render(); },
  'sp-save': () => {
    const r = S.run, k = kid(), [lo] = r.cfg.target;
    for (const [i, m] of r.results.entries()) (k.stage[r.id] ||= []).push({ at: Date.now() + i, prompt: r.prompt || null, passage: r.pid || null, side: r.cfg.mode === 'debate' ? (i ? 'against' : 'for') : null, secs: m.secs, wpm: m.wpm, pauses: m.pauses, range: m.range, self: r.self.length });
    const secs = r.results.reduce((a, m) => a + m.secs, 0); bumpDay(k, 'speak', Math.round(secs)); bumpDay(k, 'made');
    k.last = { what: 'stage', wpm: r.results[0]?.wpm || 0, secs: Math.round(secs), at: Date.now() };   // never seconds called words a minute
    const valid = r.results.length && r.results.every((m) => !m.quiet && !m.partial && m.secs >= Math.min(lo, 20)) && (r.cfg.mode !== 'debate' || r.results.length === 2);
    const rec = (k.stops[r.id] ||= { passed: false, tries: 0 }); rec.tries++; rec.at = Date.now();
    if (valid && !rec.passed) { rec.passed = true; taught(k, r.id, Date.now(), { judged: true }); pay('stop', `Spoke: ${r.st.title}`); mark('stop', `Spoke: ${r.st.title}`); }
    save(); location.hash = '#/stage'; checkMedals();
  },
};
export function speakInput(t) { const k = kid(), r = S.run; plan(k, r.id)[t.dataset.arg] = t.value.slice(0, 2000); clearTimeout(speakInput.tm); speakInput.tm = setTimeout(save, 400); }
export { isLive, micStop };
