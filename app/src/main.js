/* main.js — boot, routes, render, and one delegated listener for every data-act (the family idiom).
   Hash routes, so back always stays in the app; #/continue and ?from=hive work; the chrome is the
   family shell, never rebuilt here. */

import '../styles/app.css';
import { shell, bindShell } from './integration/bizzing-shell.js';
import { S, kid, render, onRender, save, go, applyDevice, isDark, setDevice, checkMedals } from './app.js';
import { esc, icon, empty, link, mascot } from './ui.js';
import { homeView, HOME_ACTIONS } from './views/home.js';
import { atlasView, strandView } from './views/atlas.js';
import { openStop, openCheck, runnerView, RUN_ACTIONS, runKey } from './views/runner.js';
import { openRead, readerView, READ_ACTIONS, readKey, wordCard, showWord } from './views/reader.js';
import { libraryView, bookView, wordView } from './views/library.js';
import { stageView, openAloud, aloudView, STAGE_ACTIONS, aloudPick, isLive, micStop } from './views/stage.js';
/* Play and Tools load on their own routes (their pools, boards and Bee's tools kept initial JS under budget —
   brief v4, R2); their actions join ACTIONS when they arrive */
let PLAY = null, TOOLS = null;
const loadPlay = async () => PLAY || (PLAY = await import('./views/play.js').then((m) => (Object.assign(ACTIONS, m.PLAY_ACTIONS), m)));
const loadTools = async () => TOOLS || (TOOLS = await import('./views/tools.js').then((m) => (Object.assign(ACTIONS, m.TOOL_ACTIONS), m)));
import { meView, medalsView, collectionView, shopView, practiceView, logView, recordingsView, helpView, privacyView, searchView, grownupsView,
  settingsSheet, kidSheet, coinSheet, medalSheet, addKidSheet, PAGE_ACTIONS, onChange, avatarOf, certificateView, certSheet } from './views/pages.js';
import { landingView, onboardView, OB_ACTIONS } from './views/welcome.js';
import { openStory, storyView, openExercises, exercisesView, openExercise, talkView, wholeView, openChapter, openChapterExercises, chapterExercisesView, openChapterExercise, STORY_ACTIONS, storyKey, stopNarration } from './views/stories.js';
import { loadBook, chapterKey } from './book.js';
import { openDesk, deskView, deskDoneView, DESK_ACTIONS, deskInput } from './views/desk.js';
import { openSpeak, speakView, SPEAK_ACTIONS, speakInput } from './views/speak.js';
import { applyExtras } from './extras.js';
import { openContest, contestView, CONTEST_ACTIONS } from './views/contest.js';
import { openFeed, feedView } from './views/feed-view.js';
import { stopById } from './curriculum.js';
import { nextStep } from './next.js';
import { headline } from './model.js';
import { balance, startActivity } from './family.js';
import { world, scene } from './worlds.js';
import { loadLexicon } from './lexicon.js';
import { stop as stopVoice } from './voice.js';
import { stopMusic, syncMusic, musicFor } from './sound.js';
import { demoHousehold } from './demo.js';
import { readingStop } from './reading.js';
import { isDemo } from './store.js';
import { due } from './mastery.js';

const DEMO = /[?&]demo\b/.test(location.search);
if (DEMO) S.h = demoHousehold();

const TABS = [
  { id: 'home', label: 'Home', icon: 'home', href: '#/home', color: '#C2410C' },
  { id: 'atlas', label: 'Atlas', icon: 'map', href: '#/atlas', color: '#0E6F6A' },
  { id: 'library', label: 'Library', icon: 'book', href: '#/library', color: '#047857' },
  { id: 'tools', label: 'Tools', icon: 'key', href: '#/tools', color: '#B91C1C' },   // the Stage is a tool now (owner, 3 Oct)
  { id: 'play', label: 'Play', icon: 'play', href: '#/play', color: '#3D7DF0' },
  { id: 'feed', label: 'My Feed', icon: 'feed', href: '#/feed', color: '#6C4FE0' },
];
const TAB_OF = { home: 'home', atlas: 'atlas', stop: 'atlas', practice: 'home', library: 'library', book: 'library', read: 'library', story: 'library', whole: 'library', word: 'library', bank: 'library', stage: 'tools', recordings: 'tools', desk: 'tools', tools: 'tools', play: 'play', feed: 'feed' };

/* ---------- routing ---------- */
function parse() {
  const parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/').map(decodeURIComponent);
  return { name: parts[0] || 'home', parts };
}
async function route() {
  const r = parse(); const prev = S.route.name;
  if (isLive()) micStop(0);                              // any Stage room: leaving switches the microphone off                              // leaving the Stage mid-reading: the microphone goes off at once
  stopVoice(); stopNarration(); S.wordcard = null; S.sheet = S.sheet?.kind === 'medal' || S.sheet?.kind === 'cert' ? S.sheet : null;
  if (prev === 'play' && S.run?.mode === 'game') PLAY?.leaveGame();
  if (prev === 'tools') TOOLS?.leaveTools();
  if (r.name === 'myths' || r.name === 'author') { location.replace(`#/library/${r.parts.map(encodeURIComponent).join('/')}`); return; }   // the Library's deep dives (views/deep.js)
  if (r.name === 'continue') { if (!kid()) return go('#/welcome'); const nx = nextStep(S.h, kid()); location.replace(nx.href === '#/continue' ? '#/home' : nx.href); return; }
  if (!kid() && !/^(welcome|privacy|help)$/.test(r.name)) { location.replace('#/welcome'); return; }
  S.route = r;
  const sk = r.name === 'stop' && stopById(r.parts[1]);
  if (sk && sk.kind === 'desk') { location.replace(`#/desk/${sk.id}`); return; }
  if (sk && sk.kind === 'speak') { location.replace(`#/stage/${sk.id}`); return; }
  if (sk && sk.kind === 'readAloud') { location.replace('#/stage/aloud'); return; }
  if (r.name === 'desk') { if (r.parts[2] !== 'done') openDesk(r.parts[1]); else S.run = null; }
  else if (r.name === 'stage' && r.parts[1] === 'contest') await openContest();
  else if (r.name === 'stage' && r.parts[1] && r.parts[1] !== 'aloud') await openSpeak(r.parts[1], r.parts[2]);
  else if (r.name === 'stop') { const rs = readingStop(r.parts[1]); if (rs) { location.replace(rs.chapter ? `#/whole/${rs.book}/${rs.chapter}` : `#/story/${rs.passage}`); return; } await openStop(r.parts[1]); }
  else if (r.name === 'read') { location.replace(`#/story/${r.parts[1]}`); return; }
  else if (r.name === 'story') {
    const [, id, sub, ex] = r.parts;
    if (sub === 'do') { await openExercises(id); if (ex && !openExercise(id, ex)) { location.replace(`#/story/${id}/do`); return; } }
    else if (sub === 'talk') { const ck = chapterKey(id); if (ck) await loadBook(ck.id); }
    else if (!(await openStory(id))) return;
  }
  else if (r.name === 'whole') {
    const [, id, n, sub, ex] = r.parts; if (!id) { location.replace('#/library/books'); return; } await loadBook(id);
    if (!n) S.run = null;
    else if (sub === 'do') { await openChapterExercises(id, n); if (ex && !openChapterExercise(n, ex)) { location.replace(`#/whole/${id}/${n}/do`); return; } }
    else if (sub === 'talk') S.run = null;
    else await openChapter(id, n);
  }
  else if (r.name === 'practice' && r.parts[1] === 'check') { const nx = nextStep(S.h, kid()); await openCheck(nx.kind === 'check' ? nx.ids : due(kid())); }
  else if (r.name === 'read') await openRead(r.parts[1]);
  else if (r.name === 'stage' && r.parts[1] === 'aloud') await openAloud(r.parts[2]);
  else if (r.name === 'play') { await loadPlay(); if (r.parts[1]) PLAY.openGame(r.parts[1]); else S.run = null; }
  else if (r.name === 'feed') { S.run = null; await openFeed(); }
  else if (r.name === 'tools') { S.run = null; await loadTools(); await TOOLS.openTool(r.parts); }
  else if (r.name === 'word' || r.name === 'search' || (r.name === 'library' && r.parts[1] === 'words')) await loadLexicon();
  else S.run = null;
  render(); window.scrollTo(0, 0);
  requestAnimationFrame(() => document.querySelector('main h1, main .prompt')?.closest('main') && document.getElementById('main')?.focus?.({ preventScroll: true }));
}

/* ---------- render ---------- */
function screen() {
  const r = S.route, p = r.parts;
  if (!kid()) return r.name === 'welcome' && p[1] === 'you' ? onboardView() : r.name === 'privacy' ? privacyView() : r.name === 'help' ? helpView() : landingView();
  switch (r.name) {
    case 'home': return homeView();
    case 'atlas': return p[1] ? strandView(p[1]) : atlasView();
    case 'stop': case 'practice': return S.run ? runnerView() : practiceView();
    case 'read': return readerView();
    case 'story': return p[2] === 'talk' ? talkView(p[1]) : p[2] === 'do' ? (p[3] ? runnerView() : exercisesView()) : storyView();
    case 'whole': return !p[2] ? wholeView(p[1]) : p[3] === 'talk' ? talkView(`${p[1]}-${p[2]}`) : p[3] === 'do' ? (p[4] ? runnerView() : chapterExercisesView()) : storyView();
    case 'library': return libraryView(p[1] || 'stories');
    case 'book': return bookView(p[1]);
    case 'word': return wordView(p[1] || '');
    case 'bank': return libraryView('words');
    case 'stage': return p[1] === 'aloud' ? aloudView() : p[1] === 'contest' ? contestView() : p[1] ? speakView() : stageView();
    case 'desk': return p[2] === 'done' ? deskDoneView(p[1]) : deskView();
    case 'recordings': return recordingsView();
    case 'play': return !PLAY ? '' : p[1] ? PLAY.gameView() : PLAY.playView();
    case 'feed': return feedView();
    case 'tools': return TOOLS ? TOOLS.toolsView() : '';
    case 'me': return meView();
    case 'medals': return medalsView();
    case 'certificate': return certificateView(p.slice(1).join('/'));
    case 'collection': return collectionView();
    case 'shop': return shopView(p[1] || 'avatars');
    case 'log': return logView();
    case 'help': return helpView();
    case 'privacy': return privacyView();
    case 'search': return searchView(p.slice(1).join('/'));
    case 'grownups': return grownupsView();
    case 'settings': return homeView();
    case 'welcome': return homeView();
    default: return empty('oops', 'That page is not here. It may have moved.', link('Home', '#/home', { ic: 'home' }));
  }
}

let sceneKey = '';
function paintScene() {
  const k = kid(), w = world(k?.world || 1), dark = isDark(), key = w.id + dark;
  if (key === sceneKey) return; sceneKey = key;
  document.querySelector('.scene').innerHTML = scene(w, dark);
  document.documentElement.dataset.world = w.id;
}

function doRender() {
  applyDevice(); paintScene(); applyExtras(kid());
  syncMusic(musicFor(S.route, kid() ? world(kid().world || 1).id : null, S.run), S.route.parts.join('/'));   // music: the screen's loop (sound.js decides; silent on the Stage)
  const k = kid(), app = document.getElementById('app');
  const sheetHTML = S.sheet?.kind === 'settings' ? settingsSheet() : S.sheet?.kind === 'kids' ? kidSheet() : S.sheet?.kind === 'coins' ? coinSheet() : S.sheet?.kind === 'medal' ? medalSheet(S.sheet.medals) : S.sheet?.kind === 'addkid' ? addKidSheet() : S.sheet?.kind === 'cert' ? certSheet(S.sheet.id) : '';
  const demoBand = isDemo() ? `<div class="demo-band">A sample: Kavya, three weeks in. Nothing here is saved. <a href="./">Leave the sample</a></div>` : '';
  if (!k) { app.innerHTML = demoBand + `<main class="bz-content" id="main" tabindex="-1">${screen()}</main>${sheetHTML}`; return; }
  const hive = S.fromHive ? `<a class="bz-chip fromhive" href="https://aayuvis.github.io/Bizzing_Schedule/">${icon('back')}<span>back to my day</span></a>` : '';
  const inRun = (S.run?.mode === 'game' && S.run.phase === 'play') || (S.run?.mode === 'stop' && ['turn', 'check'].includes(S.run.phase));
  app.innerHTML = demoBand + shell({
    app: 'english', name: 'English', mascot: 'mascot/head.webp', tabs: TABS, active: TAB_OF[S.route.name] || '', coins: balance(k.name), dark: isDark(),
    kid: { name: k.name, avatar: avatarOf(k) }, search: 'Search any word, book or stop…', query: S.route.name === 'search' ? S.route.parts.slice(1).join('/') : '', inRun,
    drawer: { sub: headline(k), routes: { settings: '#/settings' }, app: [
      { icon: 'book', label: 'Reading log', sub: 'what you have heard, read and understood', href: '#/log' },
      { icon: 'bank', label: 'Word bank', sub: 'every word you tapped', href: '#/library/words' },
      { icon: 'mic', label: 'My recordings', sub: 'numbers only — no sound is kept', href: '#/recordings' },
      { icon: 'check', label: 'Practice', sub: 'prove it on a later day; your mistakes deck', href: '#/practice' }] },
    content: hive + screen(),
  }) + wordCard() + sheetHTML;
  if (S.sheet?.kind === 'kids') { const b = document.querySelector('.bz-kid')?.getBoundingClientRect(), m = document.querySelector('.kidmenu');
    if (b && m) { m.style.top = `${Math.round(b.bottom + 8)}px`; m.style.right = `${Math.max(8, Math.round(innerWidth - b.right))}px`; }
    requestAnimationFrame(() => (document.querySelector('.kidmenu [aria-current]') || document.querySelector('.kidmenu button'))?.focus()); }
  else if (S.sheet) requestAnimationFrame(() => document.querySelector('.sheet button, .sheet input')?.focus());
}
onRender(doRender);

/* ---------- events ---------- */
const ACTIONS = { ...HOME_ACTIONS, ...CONTEST_ACTIONS, ...DESK_ACTIONS, ...SPEAK_ACTIONS, ...STORY_ACTIONS, ...RUN_ACTIONS, ...READ_ACTIONS, ...STAGE_ACTIONS, ...PAGE_ACTIONS, ...OB_ACTIONS, 
  'sheet-close': () => { S.sheet = S.certNext ? { kind: 'cert', id: S.certNext } : null; S.certNext = null; if (S.route.name === 'settings') return go('#/home'); render(); },
};
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]'); if (!t || t.closest('[data-bz-act]') && !t.dataset.act) return;
  if (t.dataset.self && e.target !== t) return;          // a click inside a sheet is not a click on its scrim
  const f = ACTIONS[t.dataset.act]; if (!f) return;
  if (t.tagName === 'A' || t.tagName === 'BUTTON' || t.dataset.self) e.preventDefault();
  f(t.dataset.arg ?? '');
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-act]'); if (!f) return; e.preventDefault();
  const a = f.dataset.act;
  if (a === 'submit-form') RUN_ACTIONS.submit();
  else if (a === 'lookup-form') READ_ACTIONS.lookup();
  else if (a === 'ob-name-form') OB_ACTIONS['ob-name']();
  else if (a === 'add-kid-form') PAGE_ACTIONS['add-kid-go']();
  else if (a === 'word-search') { const q = f.q.value.trim(); if (q) go(`#/search/${encodeURIComponent(q)}`); }
});
document.addEventListener('input', (e) => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.dataset.act === 'desk-type') deskInput(t);
  else if (t.dataset.act === 'sp-plan') speakInput(t);
  else if (t.dataset.act === 'tl-q') TOOLS?.toolsInput(t);
});
document.addEventListener('change', (e) => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.dataset.act === 'aloud-pick') return aloudPick(t.value);
  if (t.dataset.act === 'tl-theme') return TOOLS?.toolsChange(t);
  onChange(t);
});
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (S.sheet?.kind === 'kids' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { const items = [...document.querySelectorAll('.kidmenu button')], i = items.indexOf(document.activeElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); e.preventDefault(); return; }
  if (e.key === 'Escape') { if (S.wordcard) { S.wordcard = null; render(); return; } if (S.sheet) { ACTIONS['sheet-close'](); return; } }
  if (S.route.name === 'grownups' && /^[0-9]$|^Backspace$/.test(e.key) && document.querySelector('.pinpad') && !/INPUT|TEXTAREA/.test(e.target.tagName)) { PAGE_ACTIONS.pin(e.key === 'Backspace' ? '⌫' : e.key); return; }
  if (/INPUT|SELECT/.test(e.target.tagName)) return;
  if (TOOLS?.toolsKey(e) || runKey(e) || readKey(e) || PLAY?.playKey(e) || storyKey(e)) e.preventDefault();
});
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('hidden', document.hidden));

bindShell({
  onTheme: () => { setDevice({ dark: !isDark() }); render(); },
  onLock: () => go('#/grownups'),
  onKid: () => { S.sheet = { kind: 'kids' }; render(); },
  onCoins: () => { S.sheet = { kind: 'coins' }; render(); },
  onSearch: (q) => { if (q) go(`#/search/${encodeURIComponent(q)}`); },
  onSound: () => { setDevice({ sound: !S.dev.sound }); render(); },
});

window.addEventListener('hashchange', () => { if (parse().name === 'settings') { S.sheet = { kind: 'settings' }; } route().then(() => { if (parse().name === 'settings') { S.sheet = { kind: 'settings' }; render(); } }); });
startActivity(() => kid()?.name);
if (!location.hash) location.replace(kid() ? '#/home' : '#/welcome');
route().then(() => { if (parse().name === 'settings') { S.sheet = { kind: 'settings' }; render(); } });
if ('serviceWorker' in navigator && !DEMO && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
/* idle: warm the lexicon so the first tapped word is instant */
setTimeout(() => { if (kid()) loadLexicon(); }, 3000);
setTimeout(() => { if (kid()) { loadPlay(); loadTools(); } }, 6000);   // fetched when idle, so Play and Tools work offline too
window.__bz = { S, render, checkMedals };   // the browser check reads state (and asks for a ceremony) through this; nothing else does
