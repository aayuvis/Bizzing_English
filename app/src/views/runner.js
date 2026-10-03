/* runner.js — a stop, in Maths' pattern: Story → Learn (the why, worked) → Your turn (3, with step
   hints) → Check (8). A right answer advances by itself; a wrong one HOLDS, explains on the exact
   item, and waits for a tap (the family rule). The child's place is saved at every phase, so an
   abandoned lesson comes back (next.js), never skipped. Every item works by keyboard and touch:
   1–4 choose, arrows move, Space/Enter toggle and check, Backspace undoes. */

import { S, kid, save, render, pay, checkMedals, mark, go, toast } from '../app.js';
import { esc, icon, btn, mascot, pageHead, empty, link } from '../ui.js';
import { stopById, strand, level } from '../curriculum.js';
import { draw, check, copyDiff, passageItems } from '../items.js';
import { taught, spacedCheck, stepOf, STEP } from '../mastery.js';
import { bumpDay, levelDone, today } from '../model.js';
import { loadLexicon, lex } from '../lexicon.js';
import { sfx } from '../sound.js';
import { speak, stop as stopVoice } from '../voice.js';
import { stopsOf } from '../next.js';
import { readingStop, passage, loadPassages } from '../reading.js';
import { finishExercise, finishChapterExercise } from './stories.js';
import { imitate as imitateCheck } from '../writing.js';
import { narrate } from '../narrate.js';
import { WORKS } from '../data/library.js';
const workTitle = (id) => WORKS.find((w) => w.id === id)?.title || 'a classic';

const PHASES = ['story', 'learn', 'turn', 'check', 'done'];
const WORDY = /^(onset|def2word|word2def|prefixMake|suffixMake|origin)$/;
const ctxOf = () => ({ band: kid().band, lex: lex() });

/* ---------- starting and resuming ---------- */

export async function openStop(id) {
  const k = kid(); const st = stopById(id);
  if (!st) { S.run = { error: true }; return; }
  if (WORDY.test(st.kind)) await loadLexicon();
  const rec = (k.stops[id] ||= { passed: false, best: 0, tries: 0, step: 0, at: Date.now() });
  const phase = rec.passed ? 'learn' : PHASES[Math.min(rec.step || 0, 2)];
  S.run = { mode: 'stop', id, st, phase, items: [], i: 0, right: 0, state: null, hintN: 0 };
  if (phase === 'turn') start('turn');
}

/* A spaced check: 10 items drawn across the due stops, on a later day (mastery.js decides). */
export async function openCheck(ids) {
  const k = kid(); await loadLexicon(); await loadPassages();
  const per = Math.max(2, Math.ceil(10 / Math.max(1, ids.length)));
  const items = ids.flatMap((id) => itemsFor(id, per, 'c' + today())).slice(0, 10);
  S.run = { mode: 'check', ids, phase: 'check', items, i: 0, right: 0, state: null, hintN: 0, byStop: {} };
  if (!items.length) S.run.phase = 'done';
}

function itemsFor(id, n, salt) {
  const rs = readingStop(id);
  if (rs) return passageItems(rs.questions ? { id, questions: rs.questions } : passage(rs.passage)).slice(0, n).map((it) => ({ ...it, stop: id }));
  const st = stopById(id); if (!st) return [];
  return draw(st.kind, n, ctxOf(), salt).map((it) => ({ ...it, stop: id }));
}

function start(phase) {
  const r = S.run, k = kid();
  r.phase = phase; r.i = 0; r.right = 0; r.state = null; r.hintN = 0;
  const n = phase === 'turn' ? 3 : 8;
  r.items = draw(r.st.kind, n, ctxOf(), `${phase}:${k.id}:${(k.stops[r.id]?.tries || 0)}`);
  k.stops[r.id].step = PHASES.indexOf(phase); k.stops[r.id].at = Date.now(); save();
}

/* ---------- views ---------- */

export function runnerView() {
  const r = S.run;
  if (!r || r.error) return empty('oops', 'That stop could not be found.', link('Back to the Atlas', '#/atlas'));
  if (r.mode === 'check') return checkView();
  if (r.mode === 'ex') return pageHead({ title: r.name, sub: r.title, back: { label: 'Exercises', href: r.chapter ? `#/whole/alice/${r.chapter}/do` : `#/story/${r.pid}/do` } })
    + `<div class="runner"><div class="phases">${r.items.map((_, i) => `<i class="${i <= r.i ? 'on' : ''}"></i>`).join('')}</div>${itemView(r)}</div>`;
  const st = r.st, sd = strand(st.strand), lv = level(st.strand, st.level);
  const head = pageHead({ title: st.title, sub: `${sd.title} · level ${st.level} · ${lv.title}`, back: { label: sd.title, href: `#/atlas/${st.strand}` } });
  const ph = `<div class="phases" aria-hidden="true">${['story', 'learn', 'turn', 'check'].map((p, i) => `<i class="${PHASES.indexOf(r.phase) >= i ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if (r.phase === 'story') body = `<div class="card pin story"><img src="${mascot('think')}" alt=""><div><span class="kick">The story</span><p>${esc(st.story)}</p></div></div>
    <div class="row">${btn('Show me how', 'run-phase', { arg: 'learn', ic: 'next' })}${btn('Read it to me', 'say', { arg: st.story, ic: 'speaker', cls: 'out' })}</div>`;
  else if (r.phase === 'learn') body = `<div class="card pin"><span class="kick">Learn · ${esc(st.iCan)}</span><p class="why">${esc(st.learn.why)}</p>
    <ul class="examples">${st.learn.example.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>
    <div class="row">${btn('Your turn', 'run-phase', { arg: 'turn', ic: 'next' })}${btn('Read it to me', 'say', { arg: st.learn.why, ic: 'speaker', cls: 'out' })}${kid().stops[r.id]?.passed ? btn('Take the check again', 'run-phase', { arg: 'check', cls: 'out', ic: 'check' }) : ''}</div>`;
  else if (r.phase === 'turn' || r.phase === 'check') body = itemView(r);
  else body = finishView(r);
  return head + `<div class="runner">${ph}${body}</div>`;
}

function checkView() {
  const r = S.run;
  const head = pageHead({ title: 'Check what you know', sub: 'proving it on a later day', back: { label: 'Practice', href: '#/practice' } });
  if (r.phase === 'done') {
    const lines = Object.entries(r.result || {}).map(([id, v]) => `<li><b>${esc(stopById(id)?.title || readingStop(id)?.title || id)}</b> — ${esc(v)}</li>`).join('');
    return head + `<div class="runner"><div class="card finish stack"><img src="${mascot(r.right >= r.items.length * 0.8 ? 'cheer' : 'think')}" alt=""><div class="score">${r.right} / ${r.items.length}</div>
      <ul style="text-align:left">${lines || '<li>Nothing was due.</li>'}</ul><div class="row" style="justify-content:center">${link('Home', '#/home', { ic: 'home' })}</div></div></div>`;
  }
  return head + `<div class="runner"><div class="phases"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></div>${itemView(r)}</div>`;
}

function itemView(r) {
  const it = r.items[r.i]; if (!it) return '';
  const st = r.state, lbl = r.mode === 'check' ? 'Check' : r.phase === 'turn' ? 'Your turn' : 'Check';
  const top = `<div class="row" style="justify-content:space-between"><span class="kick">${lbl} · ${r.i + 1} of ${r.items.length}</span>${it.source ? `<span class="source">From ${esc(it.source)}</span>` : ''}</div>`;
  let ui = '';
  const mark = (i) => (st?.done ? (i === it.answer ? ' right' : st.pick === i ? ' wrong' : '') : '');
  if (it.type === 'mc') ui = `<div class="opts" role="group" aria-label="Choices">${it.options.map((o, i) => `<button class="opt${mark(i)}" data-act="pick" data-arg="${i}" ${st?.done ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>`;
  else if (it.type === 'tapmulti' || it.type === 'caps') {
    const sel = st?.sel || [];
    ui = `<div class="sent">${it.tokens.map((t, i) => (it.punct?.[i] ? `<span class="tok pun">${esc(t)}</span>` : `<button class="tok${sel.includes(i) ? ' on' : ''}${st?.done ? (it.answer.includes(i) ? (sel.includes(i) ? ' right' : ' missed') : sel.includes(i) ? ' wrong' : '') : ''}" data-act="tok" data-arg="${i}" aria-pressed="${sel.includes(i)}" ${st?.done ? 'disabled' : ''}>${esc(st?.done && it.type === 'caps' && it.answer.includes(i) ? it.tokens[i].charAt(0).toUpperCase() + it.tokens[i].slice(1) : t)}</button>`)).join('')}</div>${st?.done ? '' : btn('Check', 'submit', { ic: 'check' })}`;
  } else if (it.type === 'gaps') {
    const sel = st?.sel || [], cur = st?.cur ?? -1;
    ui = `<div class="sent">${it.tokens.map((t, i) => `<span class="word">${esc(t)}</span>${i < it.tokens.length - 1 ? `<button class="gap${sel.includes(i) ? ' on' : ''}${cur === i ? ' cursor' : ''}${st?.done ? (it.answer.includes(i) ? (sel.includes(i) ? ' right' : ' missed') : sel.includes(i) ? ' wrong' : '') : ''}" data-act="gap" data-arg="${i}" aria-label="gap after ${esc(t)}" aria-pressed="${sel.includes(i)}" ${st?.done ? 'disabled' : ''}>${sel.includes(i) || (st?.done && it.answer.includes(i)) ? (it.kind === 'split' ? '|' : ',') : ''}</button>` : ''}`).join('')}</div>${st?.done ? '' : btn('Check', 'submit', { ic: 'check' })}`;
  } else if (it.type === 'chunk') ui = `<div class="sent" style="gap:8px">${it.chunks.map((c, i) => `<button class="chunk${mark(i)}" data-act="pick" data-arg="${i}" ${st?.done ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>`;
  else if (it.type === 'order') {
    const built = st?.built || [];
    ui = `<div class="built" aria-live="polite">${built.map((i) => `<span class="tile">${esc(it.tiles[i])}</span>`).join('')}<span>${built.length === it.tiles.length ? esc(it.end) : ''}</span></div>
      <div class="tiles">${it.tiles.map((t, i) => `<button class="tile" data-act="tile" data-arg="${i}" ${built.includes(i) || st?.done ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>
      ${st?.done ? '' : `<div class="row">${btn('Undo', 'untile', { ic: 'undo', cls: 'out', dis: !built.length })}${btn('Check', 'submit', { ic: 'check', dis: built.length !== it.tiles.length })}</div>`}`;
  } else if (it.type === 'dictation' || it.type === 'imitate') {
    const head = it.type === 'dictation'
      ? `<div class="row">${btn(st?.done ? 'Hear it again' : 'Play the sentence', 'dict-play', { arg: it.clip, ic: 'speaker' })}<span class="note">from ${esc(workTitle(it.work))} — read by the narrator</span></div>`
      : `<blockquote class="passage" style="margin:0;border-left:4px solid var(--bz-pin);padding-left:14px">${esc(it.model)}<br><small class="muted" style="font:13px var(--bz-body)">— ${esc(workTitle(it.work))}</small></blockquote><p class="tag" style="margin:0">${icon('blocks')}${esc(it.shapeName)}</p>`;
    ui = `${head}<form data-act="submit-form"><label class="sr" for="ans">Your sentence</label><textarea id="ans" class="field" name="ans" rows="2" aria-label="Your sentence" spellcheck="false" autocomplete="off" ${st?.done ? 'disabled' : ''}>${esc(st?.text || '')}</textarea>
      ${st?.done ? '' : `<div class="row" style="margin-top:10px">${btn('Check', 'submit', { ic: 'check' })}</div>`}</form>`;
    if (st?.done && it.type === 'dictation' && !st.ok) ui += `<div class="diff">${diffHTML(it.text, st.text)}</div>`;
  } else if (it.type === 'type' || it.type === 'copy') {
    ui = `${it.type === 'copy' ? `<blockquote class="passage" style="margin:0;border-left:4px solid var(--bz-pin);padding-left:14px">${esc(it.text)}<br><small class="muted" style="font:13px var(--bz-body)">— ${esc(it.who)}</small></blockquote>` : ''}
      <form data-act="submit-form"><textarea class="field" name="ans" rows="${it.type === 'copy' ? 3 : 2}" aria-label="Your answer" spellcheck="false" autocomplete="off" ${st?.done ? 'disabled' : ''}>${esc(st?.text || '')}</textarea>
      ${st?.done ? '' : `<div class="row" style="margin-top:10px">${btn('Check', 'submit', { ic: 'check' })}</div>`}</form>`;
    if (st?.done && it.type === 'copy' && !st.ok) ui += `<div class="diff">${diffHTML(it.text, st.text)}</div>`;
  }
  const hints = !st?.done && it.hint?.length ? `<div class="hints">${r.hintN < it.hint.length ? btn(r.hintN ? 'Another hint' : 'A hint', 'hint', { ic: 'lamp', cls: 'ghost small' }) : ''}${it.hint.slice(0, r.hintN).map((h) => `<span class="hintline">${esc(h)}</span>`).join('')}</div>` : '';
  const fb = st?.done ? (st.ok ? `<div class="feedback ok pop" role="status"><div class="hd">${icon('check')}${it.type === 'imitate' ? 'That is the shape' : 'Right!'}</div>${st.why ? `<div>${esc(st.why)}</div>` : ''}</div>`
    : `<div class="feedback no shake" role="status"><div class="hd">${icon('cross')}Not this time</div><div>${esc(st.why || it.explain || '')}</div><div>${btn('Got it', 'next-item', { ic: 'next' })}</div></div>`) : '';
  const say = it.say ? btn('Hear it', 'sayword', { arg: it.say, ic: 'speaker', cls: 'ghost small' }) : '';
  return `<div class="card item">${top}<p class="prompt${it.type === 'mc' && it.prompt.length > 60 ? ' big' : ''}">${esc(it.prompt)}</p>${it.sub ? `<p class="subp">${esc(it.sub)}</p>` : ''}${say}${ui}${hints}${fb}</div>`;
}

export function diffHTML(want, got) {
  const { errors } = copyDiff(want, got), byAt = Object.fromEntries(errors.map((e) => [e.at, e]));
  const W = String(want).trim().split(/\s+/);
  const out = W.map((w, i) => (byAt[i] ? `<mark title="${esc(byAt[i].kind)}">${esc(w)}</mark><span class="k">${esc(byAt[i].kind)}</span>` : esc(w)));
  const extra = errors.filter((e) => e.kind === 'extra word').map((e) => `<mark>${esc(e.got)}</mark><span class="k">extra word</span>`);
  return out.concat(extra).join(' ');
}

function finishView(r) {
  const k = kid(), passed = r.right >= Math.ceil(r.items.length * 0.75), st = r.st;
  const msg = passed ? `${r.right} of ${r.items.length} — ${st.iCan.replace(/^I can /, 'you can ')}` : `${r.right} of ${r.items.length}. Have another look at how it works, then try again.`;
  const lvDone = levelDone(k, st.strand, st.level);
  return `<div class="card finish stack pop"><img src="${mascot(passed ? 'cheer' : 'think')}" alt=""><div class="score">${r.right} / ${r.items.length}</div><p>${esc(msg)}</p>
    ${passed ? `<p class="note">Passed. Come back on another day to prove it stuck — that is when it counts as learned.</p>` : ''}
    ${passed && lvDone ? `<p class="tag ok">${icon('star')} Level ${st.level} finished</p>` : ''}
    <div class="row" style="justify-content:center">${passed ? link('Continue', '#/continue', { ic: 'next' }) : btn('Try again', 'run-phase', { arg: 'learn', ic: 'undo' })}${link('Atlas', `#/atlas/${st.strand}`, { cls: 'out', ic: 'map' })}</div></div>`;
}

/* ---------- actions ---------- */

function answer(resp) {
  const r = S.run, it = r.items[r.i], k = kid();
  if (!it || r.state?.done) return;
  const ok = check(it, resp);
  r.state = { ...(r.state || {}), done: true, ok, pick: typeof resp === 'number' ? resp : undefined, text: typeof resp === 'string' ? resp : r.state?.text, why: r.state?.why };
  bumpDay(k, 'answers');
  if (ok) {
    r.right++; bumpDay(k, 'right'); sfx('right');
    if (r.phase === 'check') pay('answer');
    if (r.byStop && it.stop) (r.byStop[it.stop] ||= [0, 0])[0]++;
    setTimeout(() => { if (S.run === r && r.state?.done && r.state.ok) advance(); }, 950);
  } else {
    sfx('wrong');
    if (r.phase === 'check' || r.mode === 'check') { k.misses.push({ stop: it.stop || r.id || (r.chapter ? `bk-alice-${r.chapter}` : r.pid && r.ex === 'understand' ? 'rd-' + r.pid : null), item: it.id, at: Date.now() }); if (k.misses.length > 200) k.misses.splice(0, k.misses.length - 200); }
  }
  if (r.byStop && it.stop) (r.byStop[it.stop] ||= [0, 0])[1]++;
  save(); render();
}

function advance() {
  const r = S.run; r.i++; r.state = null; r.hintN = 0;
  if (r.i < r.items.length) { render(); focusFirst(); return; }
  if (r.mode === 'check') return finishCheck();
  if (r.mode === 'ex') return r.chapter ? finishChapterExercise() : finishExercise();
  if (r.phase === 'turn') { start('check'); render(); focusFirst(); return; }
  finishStop();
}

function finishStop() {
  const r = S.run, k = kid(), rec = k.stops[r.id], st = r.st;
  const passed = r.right >= Math.ceil(r.items.length * 0.75);
  rec.tries = (rec.tries || 0) + 1; rec.best = Math.max(rec.best || 0, r.right); rec.at = Date.now();
  k.last = { what: 'stop', title: st.title, right: r.right, n: r.items.length, at: Date.now() };
  if (passed) {
    const first = !rec.passed;
    rec.passed = true; rec.step = 0; taught(k, r.id); bumpDay(k, 'stops');
    if (first) { pay('stop'); mark('stop', `${st.title} (${strand(st.strand).title} ${st.level})`); sfx('finish'); }
    if (first && levelDone(k, st.strand, st.level)) {
      const ms = `${st.strand}-${st.level}`; if (!k.milestones.includes(ms)) k.milestones.push(ms);
      mark('band', `Finished ${strand(st.strand).title} level ${st.level}: ${level(st.strand, st.level).title}`);
    }
  } else rec.step = 1;   // back to Learn; the stop stays unfinished, so Continue returns to it
  r.phase = 'done'; save(); render(); checkMedals(); render();
}

function finishCheck() {
  const r = S.run, k = kid(); r.phase = 'done'; r.result = {};
  for (const [id, [right, n]] of Object.entries(r.byStop)) {
    const scaled = Math.round((right / n) * 10);
    const out = spacedCheck(k, id, scaled, 10);
    r.result[id] = { learned: 'Learned — it stuck', mastered: 'Mastered', lapse: 'Slipped a step — it will come back soon', practice: 'Practised', held: 'Held where it was' }[out];
    if (out === 'learned' || out === 'mastered') { pay('mastery'); mark('mastery', `${out === 'mastered' ? 'Mastered' : 'Learned'}: ${stopById(id)?.title || readingStop(id)?.title || id}`); }
  }
  k.last = { what: 'stop', title: 'a check of what you know', right: r.right, n: r.items.length, at: Date.now() };
  sfx('finish'); save(); render(); checkMedals(); render();
}

function focusFirst() { requestAnimationFrame(() => document.querySelector('.item .opt:not([disabled]), .item .tok:not([disabled]), .item .gap, .item .tile:not([disabled]), .item textarea, .item .chunk')?.focus({ preventScroll: true })); }

export const RUN_ACTIONS = {
  'run-phase': (a) => { const r = S.run; if (a === 'turn' || a === 'check') start(a); else { r.phase = a; kid().stops[r.id].step = PHASES.indexOf(a); save(); } render(); if (a === 'turn' || a === 'check') focusFirst(); },
  pick: (a) => answer(+a),
  tok: (a) => { const r = S.run; const sel = (r.state ||= { sel: [] }).sel ||= []; const i = +a; r.state.sel = sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]; sfx('tap'); render(); document.querySelector(`[data-act=tok][data-arg="${i}"]`)?.focus(); },
  gap: (a) => { const r = S.run, it = r.items[r.i]; const st = (r.state ||= { sel: [] }); const i = +a; st.sel ||= []; st.cur = i;
    st.sel = it.multi ? (st.sel.includes(i) ? st.sel.filter((x) => x !== i) : [...st.sel, i]) : (st.sel[0] === i ? [] : [i]); sfx('tap'); render(); document.querySelector(`[data-act=gap][data-arg="${i}"]`)?.focus(); },
  tile: (a) => { const r = S.run; const st = (r.state ||= { built: [] }); st.built ||= []; if (!st.built.includes(+a)) st.built.push(+a); sfx('tap'); render(); document.querySelector('.tile:not([disabled])')?.focus() || document.querySelector('[data-act=submit]')?.focus(); },
  untile: () => { const r = S.run; r.state?.built?.pop(); render(); },
  submit: () => {
    const r = S.run, it = r.items[r.i];
    if (it.type === 'mc' || it.type === 'chunk') return;
    if (it.type === 'order') return answer((r.state?.built || []).map((i) => it.tiles[i]));
    if (it.type === 'type' || it.type === 'copy' || it.type === 'dictation' || it.type === 'imitate') {
      const v = document.querySelector('.item textarea')?.value || ''; if (!v.trim()) return;
      r.state = { text: v, why: it.type === 'imitate' ? imitateCheck(it.shape, it.model, v).why : '' }; return answer(v);
    }
    answer(r.state?.sel || []);
  },
  'next-item': () => advance(),
  hint: () => { S.run.hintN++; render(); },
  say: (a) => speak(a),
  'dict-play': (a) => { const it = S.run.items[S.run.i]; narrate(a, it.text); setTimeout(() => document.querySelector('.item textarea')?.focus({ preventScroll: true }), 50); },
};

/* Keyboard: 1–4 pick; ←/→ walk the gaps or tokens; Space toggles; Enter checks or moves on. */
export function runKey(e) {
  const r = S.run; if (!r || !r.items?.length || !['turn', 'check'].includes(r.phase) || !/^(stop|check|ex)$/.test(r.mode)) return false;
  const it = r.items[r.i]; if (!it) return false;
  if (e.target.tagName === 'TEXTAREA') { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); r.state?.done ? (!r.state.ok && advance()) : RUN_ACTIONS.submit(); return true; } return false; }
  if (r.state?.done) { if (e.key === 'Enter' && !r.state.ok) { e.preventDefault(); advance(); return true; } return false; }
  if ((it.type === 'mc' || it.type === 'chunk') && /^[1-9]$/.test(e.key) && +e.key <= (it.options || it.chunks).length) { answer(+e.key - 1); return true; }
  if (it.type === 'gaps' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    const st = (r.state ||= { sel: [] }); const n = it.tokens.length - 1; st.cur = Math.max(0, Math.min(n - 1, (st.cur ?? -1) + (e.key === 'ArrowRight' ? 1 : -1)));
    render(); document.querySelector(`[data-act=gap][data-arg="${st.cur}"]`)?.focus(); e.preventDefault(); return true;
  }
  if (it.type === 'order' && e.key === 'Backspace') { RUN_ACTIONS.untile(); e.preventDefault(); return true; }
  if (e.key === 'Enter' && !/^(BUTTON|A)$/.test(e.target.tagName) && it.type !== 'mc') { RUN_ACTIONS.submit(); e.preventDefault(); return true; }
  return false;
}
export { stopVoice };
