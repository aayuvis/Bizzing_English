/* ears.js (view) — Story Ears, the listening game (HANDOVER Part C §5): a story from the Library read
   aloud by the family narrator (her recorded clips; the device's voice only where a clip will not play,
   and then the screen says "computer voice"), a spoken question, and three or four PICTURES to tap — no
   reading needed. From level 3, three pictures to put in order. A miss holds on the item: the right
   picture lights and the sentence that holds the answer is played again, until Continue.

   The stage (§1.8): the story's own painting edge to edge; a mirrored HUD — listens left · the story and
   its level · stories heard; the pictures centred and largest (2×2 on a phone); Play the story and Hear
   the question again, centred. A story tree on the title card grows a fruit for every story heard, gold
   when every question was right — the thing a child carries from one day to the next.

   Keyboard AND touch: Space or Enter plays the story (or carries on after a miss); 1–4 pick a picture
   (and place one, in an order question); arrows move between pictures; Backspace takes the last one back;
   Q hears the question again, R the story. The voice stops the moment the page is left or hidden.
   Rules: src/ears.js (pure, test/ears.mjs). Coins: one a question right first time when the run reached
   50%, five a level passed — paid once, at the end, through app.js pay(). */

import '../../styles/ears.css';
import { S, kid, save, render, pay, checkMedals, isDark, confetti } from '../app.js';
import { esc, icon, btn, link, pageHead, mascot } from '../ui.js';
import { STORIES, LEVELS, MAX_LEVEL, KIND_SAYS, LISTENS, pic, storyScenes, sentences, holdingSentence, sentenceWindow, quietNear, earsNew, earsStep, curStory, curQ, totalQs,
  earsLevel, earsSetLevel, earsFinish, missHolds, treeFruit, story as storyById, earsScore, starsOf } from '../ears.js';
import { PASSAGES, WORKS } from '../data/library.js';
import { loadPassages, work } from '../reading.js';
import { loadDevice } from '../store.js';
import { speak, stop as stopVoice, canSpeak } from '../voice.js';
import { sfx, duck } from '../sound.js';
import { bumpDay } from '../model.js';
import { avatarOf } from './pages.js';
import MAN from '../data/voice-manifest.json';

const abs = (p) => new URL(p, document.baseURI).href;          // a url() inside a style resolves against the page, not the stylesheet
const storyArt = (passage, card) => `art/story/${passage}${card ? '-card' : ''}.webp`;
const passageOf = (id) => PASSAGES.find((p) => p.id === id);
let TEXTS = null;

/* ---------- the source line: every story names its book ---------- */
export function sourceOf(st) {
  const p = passageOf(st.passage), w = p && work(p.work);
  return w ? { title: p.title, book: w.title, author: w.author, year: w.year, cite: (w.sources || [])[0] || '' } : null;
}
const sourceLine = (st) => { const s = sourceOf(st); return s ? `From <i>${esc(s.book)}</i> by ${esc(s.author)} (${s.year})` : ''; };

/* ---------- the record ---------- */
function recOf() { const k = kid(); const g = (k.games ||= {}); return (g.ears ||= { level: 1, pick: null, top: 1, runs: 0, stars: {}, best: 0, heard: {} }); }

/* ---------- audio: the narrator's clips, the device voice as a labelled fallback ---------- */
const A = { el: null, raf: 0, timer: 0, token: 0, computer: false, playing: false, story: false, env: new Map() };
const rate = () => { const d = loadDevice(); return d.calm || d.speed === 'slower' ? 0.85 : 1; };   // Calm mode slows the narration 15% (§5)
const soundOff = () => loadDevice().sound === false;
function stopAudio() {
  A.token++; cancelAnimationFrame(A.raf); clearTimeout(A.timer);
  if (A.el) { try { A.el.pause(); } catch {} A.el.onended = A.el.onerror = null; A.el = null; }
  stopVoice(); duck(false); A.playing = false; A.story = false;
}
/* a story stopped before its end (a second tap, a hidden tab) gives its listen back */
function refundListen() { const r = R(); if (A.story && r?.g) r.g = { ...r.g, listens: Math.min(LISTENS, r.g.listens + 1) }; }
/* play the story's scenes in turn; onSentence(i) lights the dots; onEnd when the last scene ends */
function playStory(scenes, { onSentence, onEnd } = {}) {
  stopAudio(); const tok = A.token; A.playing = true; A.story = true; A.computer = false; duck(true);
  const sents = scenes.map((s) => sentences(s.text)); let base = 0;
  const step = (i) => {
    if (tok !== A.token) return;
    if (i >= scenes.length) { A.playing = false; A.story = false; duck(false); onEnd?.(); return; }
    const sc = scenes[i], ss = sents[i], start = base; base += ss.length;
    const next = () => step(i + 1);
    if (!MAN[sc.key]) return voiceFallback(sc.text, tok, () => { onSentence?.(start + ss.length - 1); next(); });
    const a = new Audio(`voice/${sc.key}.mp3`); A.el = a; a.playbackRate = rate(); a.preservesPitch = true;
    const cuts = ss.map((s) => sentenceWindow(sc.text, s)[1]);
    const tick = () => { if (tok !== A.token || a !== A.el) return; const dur = a.duration || MAN[sc.key][0] / 1000, f = Math.max(0, Math.min(1, (a.currentTime - 0.25) / Math.max(0.5, dur - 0.55)));
      let j = 0; while (j < cuts.length - 1 && cuts[j] < f) j++; onSentence?.(start + j); A.raf = requestAnimationFrame(tick); };
    a.onplay = () => { A.raf = requestAnimationFrame(tick); };
    a.onended = () => { if (a === A.el) { cancelAnimationFrame(A.raf); next(); } };
    a.onerror = () => { if (a === A.el) voiceFallback(sc.text, tok, next); };
    a.play().catch(() => { if (a === A.el && tok === A.token) voiceFallback(sc.text, tok, next); });
  };
  step(0);
}
function voiceFallback(text, tok, then) {
  if (tok !== A.token) return;
  A.el = null; A.computer = true; markComputer();
  if (!speak(text, { rate: rate() * 0.95, onEnd: () => { if (tok === A.token) then(); } })) then();
}
const markComputer = () => document.querySelectorAll('[data-voice]').forEach((e) => { e.hidden = false; });
/* the loudness of a clip, every 20 ms, so a replayed sentence starts and ends in the narrator's breath */
async function envelope(key) {
  if (A.env.has(key)) return A.env.get(key);
  let env = null;
  try {
    const buf = await fetch(`voice/${key}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : null));
    const AC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
    if (buf && AC) {
      const audio = await new AC(1, 44100, 44100).decodeAudioData(buf), d = audio.getChannelData(0), hop = Math.round(audio.sampleRate * 0.02), rms = [];
      for (let i = 0; i < d.length; i += hop) { let s = 0; const e = Math.min(d.length, i + hop); for (let j = i; j < e; j++) s += d[j] * d[j]; rms.push(Math.sqrt(s / Math.max(1, e - i))); }
      env = { rms, hop: 0.02, dur: audio.duration };
    }
  } catch { env = null; }
  A.env.set(key, env); return env;
}
/* the one sentence that holds the answer: cut from its scene's clip, snapped to the quiet either side */
async function playSentence(st, holds, onEnd) {
  stopAudio(); const tok = A.token;
  const h = holdingSentence(st, TEXTS, holds); if (!h) { onEnd?.(); return; }
  setCaption(h.sentence, holds);
  if (soundOff()) { onEnd?.(); return; }
  if (!MAN[h.key]) return voiceFallback(h.sentence, tok, () => onEnd?.());
  const env = await envelope(h.key); if (tok !== A.token) return;
  const dur = env?.dur || MAN[h.key][0] / 1000, [f0, f1] = sentenceWindow(h.scene, h.sentence), lead = 0.25, span = Math.max(0.5, dur - lead - 0.3);
  let t0 = lead + f0 * span, t1 = lead + f1 * span;
  if (env) { t0 = f0 <= 0 ? 0 : quietNear(env.rms, env.hop, t0); t1 = f1 >= 1 ? dur : quietNear(env.rms, env.hop, t1); }
  else { t0 = Math.max(0, t0 - 0.3); t1 = Math.min(dur, t1 + 0.3); }
  if (t1 - t0 < 0.6) { t0 = Math.max(0, t0 - 0.4); t1 = Math.min(dur, t1 + 0.4); }
  const a = new Audio(`voice/${h.key}.mp3`); A.el = a; a.playbackRate = rate(); a.preservesPitch = true; duck(true); A.playing = true;
  const done = () => { if (a !== A.el) return; cancelAnimationFrame(A.raf); try { a.pause(); } catch {} A.el = null; A.playing = false; duck(false); onEnd?.(); };
  const tick = () => { if (a !== A.el) return; if (a.currentTime >= t1 || a.ended) return done(); A.raf = requestAnimationFrame(tick); };
  a.onloadedmetadata = () => { try { a.currentTime = t0; } catch {} };
  a.onerror = () => { if (a === A.el) voiceFallback(h.sentence, tok, () => onEnd?.()); };
  a.onended = done;
  a.play().then(() => { if (a.currentTime < t0 - 0.05) try { a.currentTime = t0; } catch {} A.raf = requestAnimationFrame(tick); }).catch(() => { if (a === A.el && tok === A.token) voiceFallback(h.sentence, tok, () => onEnd?.()); });
}
function setCaption(sentence, holds) {
  const el = document.querySelector('[data-caption]'); if (!el) return;
  const i = sentence.indexOf(holds);
  el.innerHTML = i < 0 ? esc(sentence) : `${esc(sentence.slice(0, i))}<mark>${esc(holds)}</mark>${esc(sentence.slice(i + holds.length))}`;
  el.hidden = false;
}
function askAloud(q) {
  if (!q || soundOff()) return;
  stopAudio();
  const said = speak(q.ask, { rate: rate() * 0.95 });
  document.querySelectorAll('[data-qvoice]').forEach((e) => { e.hidden = !said; });
}

/* ---------- routes: #/ears ---------- */
export async function openEars() {
  stopAudio();
  TEXTS = await loadPassages();
  S.run = { mode: 'ears', phase: 'title', sum: null };
}
const R = () => (S.run?.mode === 'ears' ? S.run : null);

/* ---------- the Play tab's card: the same shape as views/hubs.js gameCard; the caller passes its level chip
   (views/hubs.js levelChip('ears', { compact: true })) — the record k.games.ears has the shape it reads ---------- */
export function earsCard(chip = '') {
  const k = kid(), rec = k?.games?.ears || {}, heard = treeFruit(rec).length, L = earsLevel(rec);
  return `<article class="pcard" data-card="ears"><a class="pc-art" href="#/ears" style="background-image:url('${abs(storyArt('aesop-lion-mouse', true))}')" aria-label="Story Ears"></a>
    <div class="pc-body"><h3><a href="#/ears">Story Ears</a></h3><p class="muted">Practises listening: hear a story from the Library, then show what you heard in pictures. No reading needed.</p>
    ${chip || `<span class="tag">Level ${L}</span>`}
    <div class="row pc-foot">${heard ? `<span class="tag ok">${icon('book')}${heard} stor${heard === 1 ? 'y' : 'ies'} heard</span>` : '<span class="tag">New</span>'}<a class="btn small" href="#/ears">${icon('play')}<span>Play</span></a></div></div></article>`;
}

/* ---------- views ---------- */
export function earsView() {
  const r = R(); if (!r) return '';
  const head = pageHead({ title: 'Story Ears', sub: 'listen to a story, then show what you heard', back: { label: 'Play', href: '#/play' } });
  if (r.phase === 'title') return head + titleView(r);
  if (r.phase === 'done') return head + doneView(r);
  return head + stageView(r);
}

/* the story tree: a fruit for every story heard — its painting in a circle, gold when all was right */
const SLOTS = (() => { const out = []; const rows = [[50, 22, 3], [50, 34, 5], [50, 46, 7], [50, 58, 7], [50, 70, 5]]; for (const [cx, y, n] of rows) for (let i = 0; i < n; i++) out.push([cx + (i - (n - 1) / 2) * 11.5 + (y % 2 ? 2 : -2), y]); return out; })();
function treeSVG(rec) {
  const fruit = new Map(treeFruit(rec).map((f) => [f.id, f]));
  const cells = STORIES.map((s, i) => { const [x, y] = SLOTS[i % SLOTS.length], f = fruit.get(s.id);
    if (!f) return `<circle cx="${x}" cy="${y}" r="3" class="se-bud"/>`;
    return `<g class="se-fruit${f.gold ? ' gold' : ''}"><clipPath id="sef${i}"><circle cx="${x}" cy="${y}" r="5"/></clipPath><image href="${abs(storyArt(f.passage, true))}" x="${x - 6}" y="${y - 6}" width="12" height="12" clip-path="url(#sef${i})" preserveAspectRatio="xMidYMid slice"/><circle cx="${x}" cy="${y}" r="5" class="se-rim"/></g>`; }).join('');
  return `<svg class="se-tree" viewBox="0 0 100 100" role="img" aria-label="Your story tree: ${fruit.size} of ${STORIES.length} stories heard">
    <path d="M46 98 48 76 40 66l4-1 6 8 6-9 4 2-8 10 2 22z" class="se-trunk"/>
    <ellipse cx="50" cy="45" rx="44" ry="34" class="se-crown"/><ellipse cx="30" cy="54" rx="22" ry="18" class="se-crown2"/><ellipse cx="70" cy="54" rx="22" ry="18" class="se-crown2"/><ellipse cx="50" cy="28" rx="26" ry="18" class="se-crown2"/>
    ${cells}</svg>`;
}
function levelChips(rec) {
  const L = earsLevel(rec), star = (n) => `<span class="se-stars" aria-label="${n} of 3 stars">${[0, 1, 2].map((i) => `<i class="${i < n ? 'on' : ''}">${icon('star')}</i>`).join('')}</span>`;
  return `<div class="se-chips" role="group" aria-label="Level">
    <button class="se-chip${!rec.pick ? ' on' : ''}" data-act="se-level" data-arg="auto" aria-pressed="${!rec.pick}" aria-label="Auto: level ${rec.level || 1}, moved by how you do"><b>Auto</b><small>level ${rec.level || 1}</small></button>
    ${Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((n) => `<button class="se-chip${rec.pick === n ? ' on' : ''}${L === n ? ' cur' : ''}" data-act="se-level" data-arg="${n}" aria-pressed="${rec.pick === n}" aria-label="Level ${n}"><b>${n}</b>${star(rec.stars?.[n] || 0)}</button>`).join('')}</div>`;
}
function titleView(r) {
  const k = kid(), rec = recOf(), L = earsLevel(rec), fr = treeFruit(rec).length, gold = treeFruit(rec).filter((f) => f.gold).length;
  const plate = abs(`art/w-garden${isDark() ? '-night' : ''}.webp`);
  return `<div class="se-wrap"><section class="se-stage se-title" style="--se-plate:url('${plate}')">
    <div class="se-hud"><span class="se-stat"><b>${fr}</b><small>stories heard</small></span><span class="se-mid"><span class="se-lv">Level ${L}</span></span><span class="se-stat"><b>${gold}</b><small>golden</small></span></div>
    <div class="se-treebox">${treeSVG(rec)}<img class="se-quill" src="${mascot('point')}" alt=""><img class="se-me" src="${avatarOf(k)}" alt=""></div>
    <p class="se-says">${r.drop ? `Let’s warm up on Level ${L}. You can move back up any time.` : `Level ${L}: ${esc(LEVELS[L].says)}. Listen to the story, then tap the picture.`}</p>
    <div class="se-controls">${btn('Listen', 'se-start', { ic: 'speaker', cls: 'se-big' })}</div>
    ${levelChips(rec)}
    <p class="se-note">Every story is from a book in the Library, read by the narrator. ${LEVELS[L].stories} stories a round; a coin for each picture right first time when you get half or more.</p>
  </section></div>`;
}
function hud(r, st) {
  const rec = recOf(), heard = treeFruit(rec).length;
  return `<div class="se-hud"><span class="se-stat" data-listens><b>${r.g.listens}</b><small>listens left</small></span>
    <span class="se-mid"><span class="se-lv">Level ${r.g.level}</span><small>Story ${r.g.si + 1} of ${r.g.stories.length}</small></span>
    <span class="se-stat"><b>${heard}</b><small>stories heard</small></span></div>`;
}
const pictureHTML = (key) => {
  const p = pic(key); if (!p) return '';
  const img = p.av ? `<img src="avatars/${p.av}.webp" alt="" draggable="false">` : p.svg ? p.svg
    : p.pair ? `<span class="se-pair">${p.pair.map((a) => `<img src="avatars/${a}.webp" alt="" draggable="false">`).join('')}</span>`
    : `<span class="se-stack">${p.stack.map((a) => `<img src="avatars/${a}.webp" alt="" draggable="false">`).join('')}</span>`;
  return `${img}${p.badge ? `<span class="se-badge">${p.badge}</span>` : ''}`;
};
function stageView(r) {
  const g = r.g, st = storyById(curStory(g).id), sc = storyScenes(st, TEXTS), nS = sc.reduce((a, s) => a + sentences(s.text).length, 0);
  const q = curQ(g), plate = abs(storyArt(st.passage));
  const listenBtn = (label) => btn(label, 'se-listen', { ic: 'speaker', cls: g.phase === 'listen' ? 'se-big' : 'out', dis: g.listens <= 0 && !A.playing, attrs: `data-listen` });
  let body = '';
  if (g.phase === 'listen') {
    body = `<div class="se-listen"><div class="se-art${A.playing ? ' playing' : ''}" data-art><img src="${storyArt(st.passage)}" alt=""><span class="se-ring"></span><span class="se-ring r2"></span></div>
      <div class="se-dots" aria-hidden="true">${Array.from({ length: nS }, (_, i) => `<i data-dot="${i}"></i>`).join('')}</div>
      <p class="se-src">${sourceLine(st)}</p>
      ${soundOff() ? `<p class="se-note" role="alert">Sound is off on this device. Switch it on in Settings to hear the story — or a grown-up can read it aloud:</p><blockquote class="se-text">${esc(sc.map((s) => s.text).join(' '))}</blockquote>` : ''}
      <span class="se-voice" data-voice ${A.computer ? '' : 'hidden'}>${icon('speaker')} Computer voice — the device is reading this one</span></div>`;
  } else if (g.phase === 'between') {
    const rs = g.results.filter((x) => x.story === st.id), right = rs.filter((x) => x.ok).length;
    body = `<div class="se-between"><div class="se-art done"><img src="${storyArt(st.passage)}" alt=""></div>
      <h2>${right === rs.length ? 'Every one right — a golden fruit for your tree' : `${right} of ${rs.length} right — a new fruit for your tree`}</h2><p class="se-src">${sourceLine(st)}</p></div>`;
  } else body = askView(g, q, st);
  const controls = g.phase === 'listen' ? `${listenBtn(A.playing ? 'Listening…' : g.heard ? 'Hear it again' : 'Play the story')}${g.heard || soundOff() ? btn('Questions', 'se-heard', { ic: 'next', cls: 'out' }) : ''}`
    : g.phase === 'between' ? btn(g.si + 1 < g.stories.length ? 'Next story' : 'See how you did', 'se-story', { ic: 'next', cls: 'se-big' })
    : g.phase === 'miss' ? btn('Continue', 'se-next', { ic: 'next', cls: 'se-big' })
    : `${btn('Hear the question again', 'se-ask', { ic: 'speaker', cls: 'se-q' })}${listenBtn(`Hear the story again (${g.listens})`)}${q?.kind === 'order' && g.placed.length && g.phase === 'ask' ? btn('Take one back', 'se-undo', { ic: 'undo', cls: 'out' }) : ''}`;
  return `<div class="se-wrap"><section class="se-stage se-play se-ph-${g.phase}" style="--se-plate:url('${plate}')" data-phase="${g.phase}">${hud(r, st)}
    <div class="se-centre">${body}</div><div class="se-controls">${controls}</div></section></div>`;
}
function askView(g, q, st) {
  if (!q) return '';
  const order = q.kind === 'order', done = g.phase === 'right' || g.phase === 'miss';
  const cards = q.options.map((key, i) => {
    const p = pic(key), at = order ? g.placed.indexOf(i) : -1;
    let cls = '';
    if (!order && done) cls = i === q.answer ? ' right' : i === g.picked ? ' wrong' : ' dim';
    if (order && done) cls = g.phase === 'right' ? ' right' : ' shown';
    if (order && !done && at >= 0) cls = ' placed';
    const num = order ? (done ? q.order.indexOf(i) + 1 : at >= 0 ? at + 1 : '') : '';
    return `<button class="se-card${cls}" data-act="se-pick" data-arg="${i}" data-card="${i}" aria-label="${esc(p?.label || key)}"${done ? ' aria-disabled="true"' : ''}>
      <span class="se-pic">${pictureHTML(key)}</span><kbd>${i + 1}</kbd>${num ? `<span class="se-num">${num}</span>` : ''}</button>`;
  }).join('');
  const slots = order ? `<div class="se-slots" aria-label="first, next, last">${[0, 1, 2].map((j) => { const i = done ? q.order[j] : g.placed[j]; const ok = done && g.placed[j] === q.order[j];
    return `<span class="se-slot${i != null ? ' full' : ''}${done ? (ok ? ' ok' : ' no') : ''}"><b>${['first', 'next', 'last'][j]}</b>${i != null ? `<span class="se-pic">${pictureHTML(q.options[i])}</span>` : ''}</span>`; }).join('')}</div>` : '';
  return `<div class="se-ask"><div class="se-qbar"><button class="se-speak" data-act="se-ask" aria-label="Hear the question again">${icon('speaker')}</button>
      <p class="se-qtext">${esc(q.ask)}</p><span class="se-voice" data-qvoice hidden>computer voice</span></div>
    ${slots}<div class="se-cards n${q.options.length}${order ? ' order' : ''}" role="group" aria-label="${order ? 'Pictures to put in order' : 'Pick a picture'}">${cards}</div>
    ${g.phase === 'miss' ? `<p class="se-miss" role="status">${order ? 'Here is the order it happened in. Listen again:' : 'This is the one. Listen again:'}</p><p class="se-caption" data-caption hidden></p>` : ''}
    ${g.phase === 'right' ? '<p class="se-yes" role="status">Yes — you heard it.</p>' : ''}</div>`;
}
function doneView(r) {
  const s = r.sum, k = kid(), rec = recOf();
  const stars = `<span class="se-stars big" aria-label="${s.stars} of 3 stars">${[0, 1, 2].map((i) => `<i class="${i < s.stars ? 'on' : ''}">${icon('star')}</i>`).join('')}</span>`;
  const lv = s.up ? `Level ${s.after} is open — you moved up${s.firstUp ? '' : ' again'}.` : s.drop ? `Let’s warm up on Level ${s.after}. You can move back up any time.` : `You stay on Level ${s.after}. Eight in ten moves you up.`;
  const stories = r.g.stories.map((x) => { const st = storyById(x.id), src = sourceOf(st), rs = r.g.results.filter((y) => y.story === x.id);
    return `<li><img src="${storyArt(st.passage, true)}" alt=""><span><b>${esc(src?.title || '')}</b><small>${src ? `${esc(src.book)}, ${esc(src.author)} (${src.year}) · ${esc(src.cite)}` : ''}</small><small>${rs.filter((y) => y.ok).length} of ${rs.length} right</small></span></li>`; }).join('');
  const missed = s.missed && storyById(s.missed), next = missed ? { href: `#/story/${missed.passage}`, label: `Hear “${sourceOf(missed)?.title}” with the words`, why: 'the story you missed most — the words light up as she reads' }
    : { href: '#/library', label: 'Find a story in the Library', why: 'a clean round — every story there is told aloud' };
  return `<div class="se-wrap"><section class="se-stage se-done" style="--se-plate:url('${abs(`art/w-garden${isDark() ? '-night' : ''}.webp`)}')">
    <div class="se-donecard"><span class="kick">Round finished</span>${stars}
      <div class="se-stats"><span><b>${s.right}/${s.total}</b><small>right first time</small></span><span><b>${s.total ? Math.round(s.pct * 100) : 0}%</b><small>accuracy</small></span><span><b>${r.coins}</b><small>coins</small></span><span><b>${treeFruit(rec).length}</b><small>on your tree</small></span></div>
      <p class="se-lvchange">${lv}</p>
      <p style="margin:0">You practised listening for ${s.kinds.map((x) => KIND_SAYS[x]).join(', ')}.${r.coins ? '' : s.pct != null && s.pct < 0.5 ? ' Coins come when half or more are right.' : ''}</p>
      <ul class="se-heard">${stories}</ul>
      <a class="card se-next-step" href="${esc(next.href)}">${icon('book')}<span><b>${esc(next.label)}</b><small>${esc(next.why)}</small></span>${icon('next')}</a>
      <div class="se-controls">${btn('Another round', 'se-start', { ic: 'undo', cls: 'se-big' })}${btn('Story tree', 'se-title', { ic: 'book', cls: 'out' })}${link('Play', '#/play', { cls: 'out' })}</div></div></section></div>`;
}

/* ---------- moving ---------- */
let adv = 0;
const seedNow = () => `${Date.now().toString(36)}`;
function start() {
  const r = R(); if (!r) return; stopAudio(); clearTimeout(adv);
  const rec = recOf(), L = earsLevel(rec);
  r.g = earsNew(L, rec, seedNow(), Date.now()); r.phase = 'play'; r.coins = 0; r.sum = null; r.drop = false;
  sfx('tap'); render(); focusMain();
}
function step(a) {
  const r = R(); if (!r?.g) return null;
  const before = r.g; r.g = earsStep(r.g, a); return r.g === before ? null : r.g;
}
function listen() {
  const r = R(); if (!r?.g || soundOff()) return;
  if (A.playing) { refundListen(); stopAudio(); render(); return; }   // a second tap stops her (and does not cost a listen)
  if (!step({ t: 'listen' })) return;
  const st = storyById(curStory(r.g).id), scenes = storyScenes(st, TEXTS), g = r.g;
  playStory(scenes, {
    onSentence: (i) => document.querySelectorAll('[data-dot]').forEach((d) => d.classList.toggle('on', +d.dataset.dot <= i)),
    onEnd: () => { if (R() !== r || r.g !== g && r.g.si !== g.si) return; const was = r.g.phase; step({ t: 'heard' }); render(); if (was === 'listen') setTimeout(() => askAloud(curQ(r.g)), 350); },
  });
  render();
}
function pickCard(i) {
  const r = R(), g = r?.g, q = g && curQ(g); if (!q || g.phase !== 'ask') return;
  const ng = step(q.kind === 'order' ? { t: 'place', i } : { t: 'pick', i }); if (!ng) return;
  stopAudio();
  if (ng.phase === 'ask') { sfx('tap'); render(); return; }                       // one more picture placed in the order
  const ok = ng.phase === 'right';
  sfx(ok ? 'right' : 'wrong'); bumpDay(kid(), 'answers', 1); if (ok) bumpDay(kid(), 'right', 1);
  render();
  requestAnimationFrame(() => document.querySelector('.se-cards')?.classList.add(ok ? 'se-pop' : 'se-shake'));
  if (ok) { clearTimeout(adv); adv = setTimeout(() => { if (R() === r && r.g.phase === 'right' && r.g.results.length === ng.results.length) nextQ(); }, 1200); return; }
  playSentence(storyById(q.story), missHolds(q, ng.placed), () => {});
}
function nextQ() {
  const r = R(); clearTimeout(adv); const ng = step({ t: 'next' }); if (!ng) return;
  stopAudio();
  if (ng.phase === 'ask') { render(); setTimeout(() => R() === r && askAloud(curQ(r.g)), 250); return; }
  if (ng.phase === 'between') { sfx('finish'); save(); render(); return; }
  finish();
}
function nextStory() {
  const r = R(); const ng = step({ t: 'story' }); if (!ng) return finish();
  stopAudio(); render(); focusMain();
}
function finish() {
  const r = R(); if (!r?.g || r.phase === 'done') return; stopAudio();
  const k = kid(), rec = recOf(), sum = earsFinish(rec, r.g, Date.now());
  let coins = 0;
  for (let i = 0; i < sum.pay.answer; i++) coins += pay('answer', 'Story Ears: a picture right first time');
  if (sum.pay.stop) coins += pay('stop', `Story Ears: level ${sum.before} passed`);
  k.last = { what: 'game', title: 'Story Ears', right: `${sum.right} of ${sum.total} pictures`, at: Date.now() };
  r.sum = sum; r.coins = coins; r.phase = 'done'; r.drop = sum.drop;
  sfx('finish'); save(); render(); if (sum.stars === 3) confetti(); checkMedals(); render();
}
const focusMain = () => requestAnimationFrame(() => document.getElementById('main')?.focus?.({ preventScroll: true }));

export const EARS_ACTIONS = {
  'se-start': () => start(),
  'se-title': () => { const r = R(); if (!r) return; stopAudio(); r.phase = 'title'; render(); },
  'se-level': (v) => { const rec = recOf(); earsSetLevel(rec, v === 'auto' ? 'auto' : +v); save(); sfx('tap'); render(); },
  'se-listen': () => listen(),
  'se-heard': () => { const r = R(); if (!r?.g) return; stopAudio(); if (step({ t: 'heard' })) { render(); setTimeout(() => askAloud(curQ(r.g)), 250); } },
  'se-ask': () => askAloud(curQ(R()?.g || {})),
  'se-pick': (i) => pickCard(+i),
  'se-undo': () => { if (step({ t: 'undo' })) { sfx('tap'); render(); } },
  'se-next': () => nextQ(),
  'se-story': () => nextStory(),
};

/* keys: Space/Enter play or carry on; 1–4 pick or place; arrows move between pictures; Backspace undo; Q, R */
export function earsKey(e) {
  if (S.route.name !== 'ears') return false;
  const r = R(); if (!r) return false;
  const onCard = !!e.target.closest?.('.se-card, .se-chip, button, a');
  if (r.phase === 'title') {
    if (/^[1-5]$/.test(e.key)) { EARS_ACTIONS['se-level'](e.key); return true; }
    if (e.key === '0' || e.key === 'a') { EARS_ACTIONS['se-level']('auto'); return true; }
    if ((e.key === 'Enter' || e.key === ' ') && !onCard) { start(); return true; }
    return false;
  }
  if (r.phase === 'done') { if (e.key === 'Enter' && !onCard) { start(); return true; } return false; }
  const g = r.g, q = curQ(g);
  if (g.phase === 'listen') { if ((e.key === ' ' || e.key === 'Enter') && !onCard) { listen(); return true; } if (e.key === 'ArrowRight' && g.heard) { EARS_ACTIONS['se-heard'](); return true; } return false; }
  if (g.phase === 'between') { if ((e.key === ' ' || e.key === 'Enter') && !onCard) { nextStory(); return true; } return false; }
  if (g.phase === 'miss') { if (e.key === ' ' || e.key === 'Enter') { nextQ(); return true; } return false; }
  if (g.phase === 'right') { if (e.key === ' ' || e.key === 'Enter') { nextQ(); return true; } return false; }
  if (g.phase !== 'ask' || !q) return false;
  if (/^[1-4]$/.test(e.key) && +e.key <= q.options.length) { pickCard(+e.key - 1); return true; }
  if (e.key === 'Backspace') { EARS_ACTIONS['se-undo'](); return true; }
  if (e.key === 'q' || e.key === 'Q' || (e.key === ' ' && !onCard)) { askAloud(q); return true; }
  if (e.key === 'r' || e.key === 'R') { listen(); return true; }
  if (/^Arrow(Left|Right|Up|Down)$/.test(e.key)) {
    const cs = [...document.querySelectorAll('.se-card')], i = cs.indexOf(document.activeElement), cols = q.options.length === 4 && innerWidth < 700 ? 2 : q.options.length;
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? cols : -cols;
    (cs[i < 0 ? 0 : (i + d + cs.length) % cs.length])?.focus(); return true;
  }
  return false;
}

/* the voice never runs on a page nobody is looking at, nor after the page is left */
export function leaveEars() { stopAudio(); clearTimeout(adv); }
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden && (A.playing || A.el)) { refundListen(); stopAudio(); if (R()) render(); } });
  addEventListener('pagehide', () => stopAudio());
}
