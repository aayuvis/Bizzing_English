/* welcome.js — the landing page, then one question a screen with Quill the fox as guide (the family's
   onboarding, §16): first name, age band, a face — and the first stop within five taps. "Try it
   first" opens the labelled sample (?demo) before any profile exists. */

import { S, save, go, render } from '../app.js';
import { esc, icon, btn, mascot } from '../ui.js';
import { BANDS } from '../curriculum.js';
import { STARTERS, byId } from '../data/avatars.js';
import { newKid, addKid } from '../model.js';

export function landingView() {
  return `<div class="welcome"><div class="card hero"><img src="${mascot('wave')}" alt="Quill the fox"><div><span class="kick">Bizzing English · ages 6–14</span>
    <h1>A child who reads the great books, writes a sentence worth reading, and can hold a room.</h1>
    <p>Reading · Writing · Speaking — the language arts, through the classics. Seven strands, from words and sentences to speeches and the story of English.</p>
    <div class="row">${btn('Start', 'ob-start', { ic: 'next' })}<a class="btn out" href="?demo">${icon('play')}<span>Try it first</span></a></div></div></div>
    <div class="promises card"><div>${icon('book')}<span>56 classics in the original, from Aesop to Tagore</span></div><div>${icon('shield')}<span>No ads, no accounts, no tracking — nothing leaves this device</span></div>
      <div>${icon('mic')}<span>The microphone opens only on a tap, and no voice is ever kept</span></div><div>${icon('check')}<span>Learned means remembered: proved again on a later day</span></div></div>
    <p class="foot"><a href="#/privacy">Privacy</a> · Part of the Bizzing family · <a href="https://aayuvis.github.io/Bizzing_Schedule/">the Hive</a></p></div>`;
}

export function onboardView() {
  const o = (S.ob ||= { step: 'name', name: '', band: 0, face: '' });
  const guide = (line, pose = 'wave') => `<div class="guide"><img src="${mascot(pose)}" alt=""><div class="bubble">${esc(line)}</div></div>`;
  if (o.step === 'name') return `<div class="ob">${guide('Hello! I’m Quill. What’s your first name?')}<form data-act="ob-name-form" class="stack"><label class="sr" for="obn">First name</label>
    <input id="obn" class="field" name="name" maxlength="20" autocomplete="off" value="${esc(o.name)}" placeholder="First name" required>${btn('Next', 'ob-name', { ic: 'next' })}<p class="note">Just a first name. No surname, no birthday, no email — ever.</p></form></div>`;
  if (o.step === 'band') return `<div class="ob">${guide(`Lovely to meet you, ${o.name}. How old are you?`, 'think')}<div class="bandpick">${BANDS.map((b) => btn(b.age, 'ob-band', { arg: b.id, cls: 'out wide' })).join('')}</div></div>`;
  return `<div class="ob">${guide('Pick a face. You can collect more as you go.', 'point')}<div class="facepick">${STARTERS.map((id) => `<button data-act="ob-face" data-arg="${id}" aria-pressed="${o.face === id}" aria-label="${esc(byId(id).name)}"><img src="${byId(id).art}" alt=""></button>`).join('')}</div>
    ${btn('Start my journey', 'ob-go', { ic: 'next', dis: !o.face })}</div>`;
}

export const OB_ACTIONS = {
  'ob-start': () => { S.ob = { step: 'name', name: '', band: 0, face: '' }; go('#/welcome/you'); },
  'ob-name': () => { const v = document.querySelector('#obn')?.value.trim(); if (!v) return; S.ob.name = v.slice(0, 20); S.ob.step = 'band'; render(); },
  'ob-band': (a) => { S.ob.band = +a; S.ob.step = 'face'; render(); },
  'ob-face': (a) => { S.ob.face = a; render(); },
  'ob-go': () => { const o = S.ob; if (!o.face) return; addKid(S.h, newKid(o.name, o.band || 2, o.face)); save(); S.ob = null; go('#/continue'); },
};
