/* practice-time.js — the Practise ring's clock (Bizzing Bee's metricTick, for English). It counts real seconds
   spent PRACTISING — inside a stop or a check, a story's exercises, a game round, Story Ears, an Inkwell case,
   the Podium or a Stage room, the writing desk, a Tools quiz or a typing lesson — and nothing on a menu, a map,
   a shelf or a result screen. It ticks only while the tab is visible and the child has touched, typed or
   scrolled in the last two minutes (the family activity drop-in's rule), so a game left open on the table counts
   for nothing. The seconds go into k.days[date].prac through the household (store.js), never anywhere else.

   `practising` reads the running state and decides; it is pure, so test/coach.mjs holds it to the screens. */

import { today } from './model.js';

export const IDLE = 2 * 60 * 1000, TICK = 1000;

/* route { name, parts } · run S.run · ink S.ink (Inkwell keeps its own state) */
export function practising(route, run, ink) {
  const n = route?.name, p = route?.parts || [];
  if (!n) return false;
  if (n === 'stop' || n === 'practice') return (run?.mode === 'stop' && ['story', 'learn', 'turn', 'check'].includes(run.phase)) || (run?.mode === 'check' && run.phase === 'check');
  if (n === 'story' || n === 'whole') return run?.mode === 'ex' && !!run.items?.length;
  if (n === 'play') return run?.mode === 'game' && run.phase === 'play';
  if (n === 'ears') return run?.mode === 'ears' && run.phase === 'play';
  if (n === 'inkwell') return p[1] === 'case' && ink?.view === 'case';
  if (n === 'desk') return run?.mode === 'desk' && !run.error && p[2] !== 'done';
  if (n === 'stage') {
    if (run?.mode === 'podium') return ['plan', 'stage', 'practice'].includes(run.view);
    if (run?.mode === 'speak') return !run.error;
    if (run?.mode === 'aloud') return run.phase === 'live';
    return false;
  }
  if (n === 'tools') {
    if (run?.mode !== 'tool') return false;
    if (run.ty) return !run.ty.done;
    return ['check', 'revise', 'quiz', 'study'].includes(run.phase) || (run.phase === 'deck' && !!run.deck);
  }
  return false;
}

/* one tick: whole seconds added to today's practice when every condition holds. Returns the seconds added. */
export function tickPractice(k, ms, { visible, idleMs, practising: on }, t = Date.now()) {
  if (!k || !visible || !on || idleMs > IDLE) return 0;
  const s = Math.max(0, Math.min(5, Math.round(ms / 1000)));   // a stalled tab (a long gap) adds at most five seconds
  if (!s) return 0;
  const d = (k.days[today(t)] ||= { answers: 0, right: 0, stops: 0, words: 0, pages: 0, speak: 0 });
  d.prac = (d.prac || 0) + s;
  return s;
}

/* the clock itself: started once by main.js */
export function startPracticeClock({ kid, isPractising, save }) {
  if (typeof window === 'undefined') return () => {};
  let last = Date.now(), input = Date.now(), dirty = 0;
  const poke = () => { input = Date.now(); };
  const EV = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
  EV.forEach((e) => addEventListener(e, poke, { passive: true, capture: true }));
  const flush = () => { if (dirty) { dirty = 0; save(); } };
  const timer = setInterval(() => {
    const now = Date.now(), ms = now - last; last = now;
    const add = tickPractice(kid(), ms, { visible: document.visibilityState === 'visible', idleMs: now - input, practising: !!isPractising() }, now);
    if (add) { dirty += add; if (dirty >= 15) flush(); }
  }, TICK);
  const hide = () => { if (document.visibilityState !== 'visible') flush(); };
  document.addEventListener('visibilitychange', hide);
  addEventListener('pagehide', flush);
  return () => { clearInterval(timer); flush(); EV.forEach((e) => removeEventListener(e, poke, { capture: true })); document.removeEventListener('visibilitychange', hide); };
}
