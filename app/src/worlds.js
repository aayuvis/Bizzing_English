/* worlds.js — six worlds (SPEC §8, FAMILY-STANDARD §7): a complete dress for the app, each a painted
   place by day AND by night (a separately painted night, never a daylight plate on a dark page),
   three layers of ambient life (two parallax planes, place particles, an idle loop), its own
   music (sound.js) and two avatar packs. Worlds 1–2 are open to everyone; 3–6 open with the
   family plan or one at a time for 240 coins (bizzing-avatars.js buyWorld). */

export const WORLDS = [
  { n: 1, id: 'garden', name: 'The Story Garden', what: 'fables and fairy tales', particle: 'petal', idle: 'butterfly', hue: '#2F7D4F' },
  { n: 2, id: 'study', name: 'The Lamplit Study', what: 'Victorian novels by candlelight', particle: 'rain', idle: 'moth', hue: '#7A3B2E' },
  { n: 3, id: 'playhouse', name: 'The Playhouse', what: 'Shakespeare in the open air', particle: 'dust', idle: 'pennant', hue: '#9A3412' },
  { n: 4, id: 'forum', name: 'The Forum', what: 'the art of speaking well', particle: 'leaf', idle: 'dove', hue: '#B45309' },
  { n: 5, id: 'scriptorium', name: 'The Scriptorium', what: 'the story of English', particle: 'mote', idle: 'quill', hue: '#1E40AF' },
  { n: 6, id: 'lakeside', name: 'The Poet’s Lakeside', what: 'poems by the water', particle: 'mist', idle: 'swallow', hue: '#3F6F5E' },
];
export const world = (n) => WORLDS.find((w) => w.n === n) || WORLDS[0];
export const plate = (w, dark, card) => `art/w-${w.id}${dark ? '-night' : ''}${card ? '-card' : ''}.webp`;
/* Which world's painting dresses each strand on the Atlas */
export const STRAND_WORLD = { word: 'garden', sentence: 'scriptorium', reading: 'study', writing: 'lakeside', speaking: 'forum', literature: 'playhouse', language: 'scriptorium' };

/* The living backdrop: the plate (far plane), a soft near plane, particles and one idle loop.
   Built once outside #app so a re-render never restarts it; paused when the page is hidden and
   frozen to the still under reduced motion or Calm mode (styles/worlds.css). */
export function scene(w, dark) {
  const P = { petal: 14, rain: 26, dust: 16, leaf: 10, mote: 18, mist: 6 }[w.particle] || 10;
  const parts = Array.from({ length: P }, (_, i) => `<i style="--i:${i};--x:${(i * 37) % 100};--d:${6 + (i * 7) % 9}s;--dl:${-(i * 1.3) % 9}s"></i>`).join('');
  const small = (globalThis.innerWidth || 1280) <= 720;   // a phone gets the 720-wide plate: the first screen stays under 1.5 MB
  return `<div class="scn-far" style="background-image:url('${plate(w, dark, small)}')"></div><div class="scn-near"></div>
<div class="scn-parts p-${w.particle}">${parts}</div><div class="scn-idle i-${w.idle}"><b></b></div>`;
}
