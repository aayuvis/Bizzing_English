/* views/podium.js — THE PODIUM on the Stage (HANDOVER C §2.2; rules: src/podium.js; microphone: src/mic.js).

   A tournament of four rounds against five of Bee's rivals — the Poem, the Passage, a Prepared Speech
   planned in the green room, and the Impromptu Final — saved between rounds. Each round: one rehearsal
   (practice: its numbers shown, never scored), then the performance. Delivery points count only after the
   device has heard speech evidence; a plan's points only in a round so delivered.

   The microphone rules hold in every room here: it opens only from a real tap on Start; Stop ends every
   track at once (synchronously, before anything is counted); leaving the page, hiding the tab or running
   past the round's hard stop ends it too; nothing is recorded — numbers only; no speech recognition.

   The stage (§1.8, §2.2.5): the hall plate (the Playhouse) with the text or cue cards pinned centred in a
   reading frame that never scrolls the page while recording, the meter under it, Start and Stop centred,
   the rivals on two benches of one width; the green-room plate (the Lamplit Study) for planning.

   Keyboard AND touch: every control is a button; Space or Enter is the screen's main action; arrows move
   the cue cards; 1–3 choose a version, a line or a face; Escape closes a picker. Devices are dragged onto a
   card (pointer: mouse or finger) — or tapped, then a card's "Add it here" is tapped. */

import '../../styles/stage.css';
import '../../styles/podium.css';
import { S, kid, save, render, pay, checkMedals, mark, confetti } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { PASSAGES } from '../data/library.js';
import { shippable, passageText, loadPassages, work } from '../reading.js';
import { start as micStart, stop as micStop, isLive } from '../mic.js';
import { stopNarration } from '../narrate.js';
import { bumpDay } from '../model.js';
import { sfx, duck } from '../sound.js';
import { stage, afterRender, stillScene, onHidden } from '../stage.js';
import { avatarOf } from './pages.js';
import { contestOpen } from './contest.js';
import MAN from '../data/voice-manifest.json';
import { HOST } from '../podium-data.js';
import { rivalArt } from '../contest.js';
import { ROUNDS, CARDS, DEVICES, MAX, ROUND_MAX, PLAN_SECS, CUPS, levelCfg, canType, mustType, planCheck, devicesIn, offers, versions, topic, newTournament,
  roundSpec, roundScore, roundPays, rivalRound, standings, seeds, finish, field, podiumOf, playLevel, planOf, closeTournament, capSecs, felixPlan, blanks } from '../podium.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.round(s % 60))).padStart(2, '0')}`;
const clean = (t) => String(t || '').replace(/_/g, '');
const T = () => kid()?.podium?.cur || null;
const R = () => (S.run?.mode === 'podium' ? S.run : null);
const textsOf = (t) => { const o = { narr: {} }; for (const id of [t.poem, t.passage]) { const p = passageText(id); if (p) { o[id] = p; o.narr[id] = (p.scenes || []).reduce((a, _, i) => a + (MAN[`st/${id}-${i}`]?.[0] || 0), 0) / 1000; } } return o; };
const specOf = (t, ri) => roundSpec(t, ri, textsOf(t));
const topicOf = (t, ri) => topic(ri === 2 ? t.prep : t.final);
const RID = (ri) => ROUNDS[ri].id;
export const podiumOpen = contestOpen;

/* ---------- open, leave ---------- */
let clock = 0, capT = 0, planT = 0, offHide = () => {};
function timersOff() { clearInterval(clock); clearTimeout(capT); clearInterval(planT); offHide(); offHide = () => {}; }
export async function openPodium() {
  await loadPassages();
  const k = kid(); podiumOf(k);
  S.run = { mode: 'podium', view: 'lobby', act: 'perform', live: false, cue: 0, held: null, ver: null, example: null, err: '', msg: '', last: null, res: null, reveal: 0 };
}
export function leavePodium() {
  const r = R(), t = T();
  if (isLive()) micStop();
  timersOff(); stillScene(false); duck(false);
  if (r?.view === 'plan' && t && t.round === 3 && r.planLeft != null) { t.rounds[3].planned = true; save(); }   // the Final's minute is spent once
}

/* ---------- the level chip: Auto or 1–5; fixed while a tournament runs ---------- */
function levelChip(k) {
  const rec = podiumOf(k), cur = rec.pick || 'auto', L = rec.level || 1;
  const b = (v, label) => `<button class="pd-lvb${String(cur) === String(v) ? ' on' : ''}" role="radio" aria-checked="${String(cur) === String(v)}" data-act="pd-level" data-arg="${v}" aria-label="${v === 'auto' ? `Auto: level ${L}, moved by how you do` : `Level ${v}`}">${label}</button>`;
  return `<div class="pd-lv" role="radiogroup" aria-label="Podium level">${b('auto', `<b>Auto</b><small>L${L}</small>`)}${[1, 2, 3, 4, 5].map((v) => b(v, `<b>${v}</b>`)).join('')}</div>`;
}
const lvTag = (L, extra = '') => `<span class="lvtag"><b>Level ${L}</b>${extra ? ` · ${esc(extra)}` : ''}</span>`;
const face = (id, sz = 44) => `<img class="pd-face" src="${rivalArt(id)}" alt="" width="${sz}" height="${sz}">`;
const youFace = (k, sz = 44) => `<img class="pd-face you" src="${avatarOf(k)}" alt="" width="${sz}" height="${sz}">`;
const honest = `<p class="pd-honest">${icon('shield')}<span>Your points come only from what this device measures — and only after it hears a voice speaking. Your ideas and your expression are never scored. The rivals are made-up children from Bizzing Bee; their points are the app’s own.</span></p>`;
const totalSoFar = (t) => t.rounds.reduce((a, r) => a + (r.done ? r.total : 0), 0);
const mineSoFar = (t) => t.rounds.filter((r) => r.done).map((r) => r.total);

/* ---------- the views ---------- */
export function podiumView() {
  const r = R(), k = kid();
  const head = (sub) => pageHead({ title: 'The Podium', sub, back: { label: 'Stage', href: '#/stage' } });
  if (!r) return head('the speaking tournament') + empty('oops', 'The Podium is not ready.', link('The Stage', '#/stage'));
  if (!podiumOpen(k)) return head('the speaking tournament') + empty('point', 'Read a passage aloud on the Stage first — then the Podium opens.', link('Read aloud', '#/stage/aloud', { ic: 'mic' }));
  afterRender();
  const t = T();
  if (r.view === 'final') return head('the results') + finalView(k);
  if (!t || r.view === 'lobby') return head(t ? `round ${t.round + 1} of 4 next` : 'four rounds against Bee’s rivals') + lobbyView(k, t);
  const sub = `round ${t.round + 1} of 4 · ${ROUNDS[t.round].title}`;
  if (r.view === 'topic') return head(sub) + topicView(k, t);
  if (r.view === 'plan') return head(sub) + planView(k, t);
  if (r.view === 'practice') return head(sub) + practiceView(k, t);
  if (r.view === 'result') return head(sub) + resultView(k, t);
  return head(sub) + stageView(k, t);
}

function lobbyView(k, t) {
  const rec = podiumOf(k), L = t ? t.level : playLevel(rec), cup = CUPS[L];
  const sd = seeds(k.band, rec.best), half = Math.ceil(sd.length / 2);
  const row = (x) => `<li class="${x.you ? 'you' : ''}"><span class="pd-seed">${x.seed}</span>${x.you ? youFace(k, 36) : face(x.id, 36)}<b>${esc(x.name)}</b>${t && t.round ? `<small>${x.you ? totalSoFar(t) : mineSoFar(t).reduce((a, _, ri) => a + rivalRound(field(k.band).find((v) => v.id === x.id), t.n, ri).total, 0)}</small>` : ''}</li>`;
  const bracket = `<div class="pd-bracket"><ol class="pd-bench-list">${sd.slice(0, half).map(row).join('')}</ol><ol class="pd-bench-list">${sd.slice(half).map(row).join('')}</ol></div>`;
  const strip = `<ol class="pd-rounds">${ROUNDS.map((rd, i) => { const x = t?.rounds[i], st = !t ? '' : x.done ? 'done' : i === t.round ? 'now' : ''; return `<li class="${st}"><span class="pd-rn">${x?.done ? icon('check') : i + 1}</span><b>${esc(rd.short)}</b><small>${x?.done ? `${x.total}/${ROUND_MAX[i]}${x.verified ? '' : ' · not heard'}` : i === t?.round ? 'next' : `${ROUND_MAX[i]} pts`}</small></li>`; }).join('')}</ol>`;
  const host = `<div class="pd-host stg-paper"><img src="${mascot(t ? 'point' : 'cheer')}" alt=""><p>${esc(t ? `${HOST[RID(t.round)]}` : HOST.lobby)}</p></div>`;
  const main = `${host}${strip}${bracket}${honest}`;
  const go = t ? btn(`${t.round ? 'Continue' : 'Begin'}: round ${t.round + 1}, ${ROUNDS[t.round].title}`, 'pd-go', { ic: 'next', cls: 'stg-go', attrs: 'data-primary' }) : btn(`Enter ${cup}`, 'pd-new', { ic: 'lectern', cls: 'stg-go', attrs: 'data-primary' });
  const hist = (k.contests || []).filter((c) => c.max).slice(-3).reverse();
  return stage({ id: 'podium-lobby', world: 'playhouse', dark: document.documentElement.hasAttribute('data-bz-dark'), mods: 'pd pd-lobby', fit: false,
    left: { v: t ? `${t.round + 1}/4` : '—', l: 'round' }, right: { v: rec.best ? `#${rec.best}` : '—', l: 'best place' },
    title: cup, chip: t ? lvTag(L, 'in play') : levelChip(k), main,
    controls: go + (hist.length ? `<span class="pd-hist">${hist.map((c) => `<span>${esc(CUPS[c.level] || 'Podium')} · place ${c.place} of ${c.of} · ${c.total}/${c.max}</span>`).join('')}</span>` : '') });
}

function topicView(k, t) {
  const ri = t.round;
  if (ri === 2) {
    const cards = t.prepChoices.map((id, i) => { const tp = topic(id); return `<button class="pd-topic stg-paper" data-act="pd-topic" data-arg="${esc(id)}"><kbd>${i + 1}</kbd><b>${esc(tp.title)}</b><small>Level ${tp.level} topic</small></button>`; }).join('');
    return stage({ id: 'podium-topic', world: 'study', dark: dark(), mods: 'pd pd-green', left: { v: '3/4', l: 'round' }, right: { v: '2', l: 'topics' }, title: 'Choose your topic', chip: lvTag(t.level),
      main: `<p class="prompt">Pick the speech you want to give. You will plan it in the green room.</p><div class="pd-topics">${cards}</div>` });
  }
  const tp = topicOf(t, 3);
  return stage({ id: 'podium-topic', world: 'playhouse', dark: dark(), mods: 'pd pd-final', left: { v: '4/4', l: 'round' }, right: { v: `${PLAN_SECS}s`, l: 'to plan' }, title: 'The Final', chip: lvTag(t.level, 'impromptu'),
    main: `<div class="pd-card-reveal stg-paper"><span class="kick">Your topic</span><b class="pd-topic-big">${esc(tp.title)}</b><p>Sixty seconds to plan — the clock starts when you tap. Then sixty seconds to speak.</p></div>`,
    controls: btn(`Start my ${PLAN_SECS} seconds`, 'pd-plan-go', { ic: 'clock', cls: 'stg-go', attrs: 'data-primary' }) });
}
const dark = () => document.documentElement.hasAttribute('data-bz-dark');

/* the green room: Hook · Point 1–3 · Close, the devices tray, the checklist */
function planView(k, t) {
  const r = R(), ri = t.round, tp = topicOf(t, ri), L = t.level, plan = planOf(k, RID(ri)), pc = planCheck(plan, L);
  const card = ([id, name]) => {
    const txt = plan[id] || '', devs = devicesIn(txt), typed = canType(L), must = mustType(L, id), ofs = must ? [] : offers(tp, id);
    const chosen = ofs.findIndex((l) => l.t === txt || Object.values(l.v).includes(txt));
    const lines = ofs.length ? `<div class="pd-lines" role="radiogroup" aria-label="${esc(name)}: choose a line">${ofs.map((l, i) => { const on = i === chosen; return `<button class="pd-line${on ? ' on' : ''}" role="radio" aria-checked="${on}" data-act="pd-line" data-arg="${id}:${i}"><kbd>${i + 1}</kbd><span>${esc(on ? txt : l.t)}</span></button>`; }).join('')}</div>` : '';
    const input = typed ? `<label class="pd-type"><span class="sr">${esc(name)}: your own words</span><input class="field" data-act="pd-type" data-arg="${id}" id="pd-in-${id}" maxlength="140" autocomplete="off" spellcheck="true" placeholder="${must ? 'Type your line' : 'Or type your own line'}" value="${esc(chosen >= 0 ? '' : txt)}"></label>` : '';
    const drop = r.held ? `<button class="pd-drop" data-act="pd-drop" data-arg="${id}">${icon('next')}<span>Add ${esc(DEVICES.find((d) => d.id === r.held).name.toLowerCase())} here</span></button>` : '';
    const ver = r.ver?.card === id ? `<div class="pd-ver" role="dialog" aria-label="Choose a version"><b>${esc(DEVICES.find((d) => d.id === r.ver.dev).name)}: choose a version</b>${r.ver.opts.map((o, i) => `<button class="pd-line" data-act="pd-ver" data-arg="${i}"><kbd>${i + 1}</kbd><span>${esc(o.text)}</span>${o.own ? '<small>fill the gaps ___ with your words</small>' : ''}</button>`).join('')}<button class="btn out small" data-act="pd-ver-x">${icon('close')}<span>Keep my line</span></button></div>` : '';
    return `<section class="pd-card stg-paper${devs.length ? ' has-dev' : ''}" data-card="${id}" aria-label="${esc(name)}"><header><b>${esc(name)}</b>${devs.map((d) => `<span class="pd-tag">${esc(DEVICES.find((x) => x.id === d).name)}</span>`).join('')}${blanks(txt) ? '<span class="pd-tag warn">fill the gaps</span>' : ''}</header>${lines}${input}${drop}${ver}</section>`;
  };
  const tray = `<div class="pd-tray" aria-label="Devices from Writer’s Craft — drag one onto a card, or tap it and then a card">${DEVICES.map((d) => `<button class="pd-dev${r.held === d.id ? ' on' : ''}" data-act="pd-hold" data-arg="${d.id}" data-dev="${d.id}" aria-pressed="${r.held === d.id}" title="${esc(d.how)}">${icon('quill')}<span><b>${esc(d.name)}</b><small>${esc(d.how)}</small></span></button>`).join('')}</div>`;
  const checks = `<ul class="pd-checks" id="pd-checks">${checksHtml(pc)}</ul>`;
  const left = ri === 3 ? { v: `<span id="pd-plan-left">${r.planLeft ?? PLAN_SECS}</span>s`, l: 'to plan', live: true } : { v: `<span id="pd-pc">${pc.points}</span>/4`, l: 'plan marks' };
  const ex = r.example ? exampleView() : '';
  return stage({ id: 'podium-plan', world: 'study', dark: dark(), mods: 'pd pd-green pd-planner',
    left, right: { v: `<span id="pd-dc">${pc.devices.length}</span>/${pc.need}`, l: 'devices' }, title: tp.title, chip: lvTag(L, levelCfg(L).type === 'choose' ? 'choose your lines' : levelCfg(L).type === 'all' ? 'type every card' : 'choose or type'),
    main: `${r.msg ? `<p class="pd-msg" role="status">${esc(r.msg)}</p>` : ''}<div class="pd-plan">${CARDS.map(card).join('')}</div>${checks}<p class="pd-note">The planner marks the shape of your speech — a hook, three points, a close that echoes the hook, the devices. Your ideas are yours: they are never marked. Typed lines stay on this device and are cleared when the tournament ends.</p>${ex}`,
    tray, controls: `${btn('An example plan', 'pd-example', { ic: 'book', cls: 'out stg-pair' })}${btn(ri === 3 ? 'I am ready' : 'To the stage', 'pd-planned', { ic: 'next', cls: 'stg-pair', attrs: 'data-primary' })}` });
}
function checksHtml(pc) { return pc.items.map((i) => `<li class="${i.ok ? 'ok' : ''}">${icon(i.ok ? 'check' : 'star')}<span>${esc(i.label)}${i.id === 'devices' ? ` (${i.got})` : ''}</span></li>`).join(''); }
let FELIX = null;
function exampleView() {
  const f = FELIX; if (!f) return `<div class="pd-example stg-paper" role="dialog"><p>Opening the example…</p></div>`;
  const sec = (name, lines) => `<section><b>${esc(name)}</b>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</section>`;
  return `<div class="pd-example stg-paper" role="dialog" aria-label="An example plan"><header><b>An example plan: ${esc(f.title)}</b><button class="btn out small" data-act="pd-example-x">${icon('close')}<span>Close</span></button></header>
    <p class="pd-note">From Inkwell Detective, case 7 — a Bizzing mystery, written for this app. Felix opens with a hook, makes three points, and closes by turning back to the lantern he began with.</p>
    <div class="pd-ex-body">${sec('Hook', f.hook)}${sec('Point 1', f.points[0])}${sec('Point 2', f.points[1])}${sec('Point 3', f.points[2])}${sec('Close', f.close)}</div></div>`;
}

/* the hall: the frame (text or cue cards), the benches, the meter, Start / Stop */
function frameHtml(k, t, ri, rehearse) {
  const r = R(), sp = specOf(t, ri);
  if (ROUNDS[ri].kind === 'reading') {
    const p = PASSAGES.find((x) => x.id === sp.pid), tx = passageText(sp.pid);
    if (!p || !tx) return `<p>No piece for this round yet.</p>`;
    const body = ROUNDS[ri].verse ? `<p class="pd-verse">${esc(clean(tx.text)).replace(/\n/g, '<br>')}</p>` : clean(tx.text).split(/\n\s*\n/).map((x) => `<p>${esc(x)}</p>`).join('');
    return `<header class="pd-fhead"><b>${esc(p.title)}</b><small>${esc(work(p.work)?.author || '')}</small></header><div class="pd-text">${body}</div>`;
  }
  const plan = planOf(k, RID(ri)), cards = CARDS.map(([id, name], i) => ({ id, name, text: plan[id] || '—', i }));
  if (rehearse) { const c = cards[Math.min(r.cue, 4)]; return `<header class="pd-fhead"><b>Cue card ${c.i + 1} of 5 · ${esc(c.name)}</b><small>${esc(topicOf(t, ri).title)}</small></header><div class="pd-cue big"><p>${esc(c.text)}</p></div>`; }
  return `<header class="pd-fhead"><b>${esc(topicOf(t, ri).title)}</b><small>your cue cards</small></header><ol class="pd-cues">${cards.map((c) => `<li class="${c.i === r.cue ? 'on' : ''}"><b>${esc(c.name)}</b><span>${esc(c.text)}</span></li>`).join('')}</ol>`;
}
function benches(k, t) {
  const rv = field(k.band), mine = mineSoFar(t);
  const seat = (x) => `<div class="pd-seat">${face(x.id, 48)}<b>${esc(x.name)}</b><small>${mine.reduce((a, _, ri) => a + rivalRound(x, t.n, ri).total, 0)}</small></div>`;
  const quill = `<div class="pd-seat host"><img class="pd-face" src="${mascot('wave')}" alt="" width="48" height="48"><b>Quill</b><small>host</small></div>`;
  return [`<div class="pd-bench l" aria-label="Rivals">${rv.slice(0, 3).map(seat).join('')}</div>`, `<div class="pd-bench r" aria-label="Rivals and the host">${rv.slice(3).map(seat).join('')}${quill}</div>`];
}
function stageView(k, t) {
  const r = R(), ri = t.round, sp = specOf(t, ri), [lo, hi] = sp.target, rehearse = r.act === 'rehearse', x = t.rounds[ri];
  const [bl, br] = benches(k, t), rows = standings(t.n, t.band, mineSoFar(t)), lead = rows.find((y) => !y.you);
  const pace = rehearse ? `<div class="pd-pace" aria-hidden="true"><i class="${r.live ? 'run' : ''}" style="--pace:${ROUNDS[ri].kind === 'reading' ? Math.round((lo + hi) / 2) : Math.round((lo + hi) / 10)}s"></i></div>` : '';
  const main = `<div class="pd-hall">${bl}<div class="pd-frame stg-paper" data-frame tabindex="0">${frameHtml(k, t, ri, rehearse)}</div>${br}</div>
    ${pace}<div class="pd-meter${r.live ? ' on' : ''}" aria-hidden="true"><b id="pd-lvl"></b></div>
    <p class="pd-status" role="status">${r.live ? `${rehearse ? 'Rehearsing' : 'Speaking'} — <b id="pd-clock">0:00</b> · aim for ${fmt(lo)}–${fmt(hi)}. Listening for loudness, pitch and rhythm only.` : rehearse ? `A rehearsal: practice only, never scored. Aim for ${fmt(lo)}–${fmt(hi)}.` : `Aim for ${fmt(lo)}–${fmt(hi)}. The microphone opens only when you tap Start; nothing you say is recorded or sent anywhere.`}</p>
    ${r.err ? `<p class="pd-msg no" role="alert">${esc(r.err)}</p>` : ''}`;
  let controls;
  if (r.live) controls = `${rehearse && ROUNDS[ri].kind === 'speech' ? btn('Back a card', 'pd-cue', { arg: '-1', ic: 'back', cls: 'out stg-pair' }) : ''}${btn('Stop', 'pd-stop', { ic: 'close', cls: 'stg-go pd-stopbtn', attrs: 'data-primary' })}${rehearse && ROUNDS[ri].kind === 'speech' ? btn('Next card', 'pd-cue', { arg: '1', ic: 'next', cls: 'out stg-pair' }) : ''}`;
  else if (rehearse) controls = `${btn('Back', 'pd-act', { arg: 'perform', ic: 'back', cls: 'out stg-pair' })}${btn('Start the rehearsal', 'pd-start', { ic: 'mic', cls: 'stg-pair', attrs: 'data-primary' })}`;
  else controls = `${btn(x.rehearsed ? 'Rehearsal used' : 'Rehearse once', 'pd-act', { arg: 'rehearse', ic: 'undo', cls: 'out stg-pair', dis: x.rehearsed })}${btn('Start', 'pd-start', { ic: 'mic', cls: 'stg-pair', attrs: 'data-primary', dis: ROUNDS[ri].kind === 'reading' && !sp.pid })}`;
  return stage({ id: 'podium-hall', world: 'playhouse', dark: dark(), mods: `pd pd-hallst${r.live ? ' pd-live' : ''}${rehearse ? ' pd-reh' : ''}`,
    left: { v: totalSoFar(t), l: 'you', img: avatarOf(k) }, right: { v: lead ? lead.total : 0, l: lead ? lead.name : '', img: lead ? rivalArt(lead.id) : '' },
    title: rehearse ? `Rehearsal · ${ROUNDS[ri].short}` : ROUNDS[ri].title, chip: lvTag(t.level, `round ${ri + 1} of 4`), main, controls });
}

/* the evidence, as the device measured it */
const evList = (ev) => `<ul class="pd-ev">${(ev?.checks || []).map((c) => `<li class="${c.ok ? 'ok' : 'no'}">${icon(c.ok ? 'check' : 'cross')}<span><b>${esc(c.label)}</b><small>${esc(c.got)} · needs ${esc(c.need)}</small></span></li>`).join('')}</ul>`;
function practiceView(k, t) {
  const r = R(), ri = t.round, m = r.last, sp = specOf(t, ri);
  const heard = m?.ev?.ok;
  return stage({ id: 'podium-practice', world: 'playhouse', dark: dark(), mods: 'pd', left: { v: fmt(m?.secs || 0), l: 'time' }, right: { v: m?.pauses ?? 0, l: 'pauses' }, title: 'How the rehearsal went', chip: lvTag(t.level, 'practice — never scored'),
    main: `<div class="pd-card stg-paper pd-res"><span class="kick">Measured on this device · practice only</span><p>${heard ? 'The device heard a voice speaking. ' : 'We couldn’t hear the words clearly. Try a little closer to the mic, and read every line. '}You took ${fmt(m?.secs || 0)}; the aim is ${fmt(sp.target[0])}–${fmt(sp.target[1])}.</p>${evList(m?.ev)}<p class="pd-note">Nothing here counts. The performance is next.</p></div>`,
    controls: btn('To the performance', 'pd-act', { arg: 'perform', ic: 'next', cls: 'stg-go', attrs: 'data-primary' }) });
}
const FACES = [['wobbly', 'It felt wobbly', 'M14 30 q6 -4 12 0'], ['fine', 'It felt fine', 'M14 29 h12'], ['great', 'It felt great', 'M13 26 q7 7 14 0']];
const faceSvg = (d) => `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="currentColor" opacity=".16"/><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="14.5" cy="16" r="2.2" fill="currentColor"/><circle cx="25.5" cy="16" r="2.2" fill="currentColor"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;
function resultView(k, t) {
  const r = R(), ri = t.round, x = t.rounds[ri], res = r.res || { verified: x.verified, delivery: x.delivery, plan: x.plan, total: x.total, parts: [] }, m = r.last;
  const rv = field(k.band), rows = standings(t.n, t.band, mineSoFar(t)), me = rows.find((y) => y.you);
  const theirs = rv.map((v, i) => { const y = rivalRound(v, t.n, ri); return `<li style="--i:${i}">${face(v.id, 36)}<span><b>${esc(v.name)} · ${y.total}/${ROUND_MAX[ri]}</b><small>${esc(y.line)}</small></span></li>`; }).join('');
  const table = `<ol class="pd-standings">${rows.map((y) => `<li class="${y.you ? 'you' : ''}"><span class="pd-pl">${y.place}</span>${y.you ? youFace(k, 28) : face(y.id, 28)}<span>${esc(y.name)}</span><b>${y.total}</b></li>`).join('')}</ol>`;
  const parts = res.verified ? `<ul class="pd-parts">${res.parts.map(([l, g, o]) => `<li><span>${esc(l)}</span><b>${g}/${o}</b></li>`).join('')}${ROUNDS[ri].plan ? `<li><span>The plan — its shape: hook, three points, an echo, devices</span><b>${res.plan}/4</b></li>` : ''}</ul>` : '';
  const heard = res.verified ? `<p class="pd-say ok">${icon('check')} The device heard you speaking${m ? ` for ${fmt(m.secs)}` : ''}.${x.paid ? ' This round earned its coins.' : ROUNDS[ri].plan && !res.planOk ? ' The plan was not complete, so this round earns no coins.' : ''}</p>` : `<p class="pd-say no">We couldn’t hear the words. Try again a little closer to the mic.</p>`;
  const self = `<div class="pd-self"><span class="kick">You judge: how did your expression feel?</span><div class="pd-faces" role="radiogroup" aria-label="How did it feel">${FACES.map(([id, label, d], i) => `<button class="pd-facebtn${x.self === i ? ' on' : ''}" role="radio" aria-checked="${x.self === i}" data-act="pd-self" data-arg="${i}" aria-label="${label}">${faceSvg(d)}<small>${label}</small></button>`).join('')}</div>
    <span class="kick">A grown-up’s view (optional) — theirs, not the app’s</span><div class="pd-grown" role="radiogroup" aria-label="A grown-up's view">${['Getting there', 'Clear', 'It moved me'].map((l, i) => `<button class="pd-gbtn${x.grown === i ? ' on' : ''}" role="radio" aria-checked="${x.grown === i}" data-act="pd-grown" data-arg="${i}">${esc(l)}</button>`).join('')}</div></div>`;
  const next = ri < 3 ? `Round ${ri + 2}: ${ROUNDS[ri + 1].title}` : 'The results';
  return stage({ id: 'podium-result', world: 'playhouse', dark: dark(), mods: 'pd pd-result', fit: false,
    left: { v: `${res.total}/${ROUND_MAX[ri]}`, l: 'this round', img: avatarOf(k) }, right: { v: `#${me.place}`, l: `of ${rows.length}` }, title: `${ROUNDS[ri].title}: the scores`, chip: lvTag(t.level, `round ${ri + 1} of 4`),
    main: `<div class="pd-resgrid"><div class="pd-card stg-paper pd-res"><span class="kick">Your round — measured on this device</span>${heard}${m ? evList(m.ev) : ''}${parts}${self}</div>
      <div class="pd-card stg-paper pd-res"><span class="kick">The rivals — the app’s own points</span><ol class="pd-rivals">${theirs}</ol><span class="kick">After round ${ri + 1}</span>${table}</div></div>${honest}`,
    controls: `${!res.verified && r.res ? btn('Try again', 'pd-retry', { ic: 'undo', cls: 'out stg-pair' }) : ''}${btn(next, 'pd-next', { ic: 'next', cls: 'stg-pair', attrs: 'data-primary' })}` });
}
function finalView(k) {
  const r = R(), e = r.end; if (!e) return '';
  const top = e.rows.slice(0, 3), order = [top[1], top[0], top[2]].filter(Boolean);
  const block = (y) => `<div class="pd-step p${y.place}${y.you ? ' you' : ''}">${y.you ? youFace(k, 56) : face(y.id, 56)}<b>${esc(y.name)}</b><small>${y.total}</small><span class="pd-plinth">${y.place}</span></div>`;
  const say = e.place === 1 ? 'First place. The judges — this device — heard every round.' : e.place <= 3 ? `Place ${e.place} of ${e.rows.length}: on the podium.` : `Place ${e.place} of ${e.rows.length}. Look at the round that was not heard, or where the timing slipped — those are the easiest points to win back.`;
  return stage({ id: 'podium-final', world: 'playhouse', dark: dark(), mods: 'pd pd-finalst', fit: false,
    left: { v: `${e.total}/${e.max}`, l: 'points', img: avatarOf(k) }, right: { v: `#${e.place}`, l: `of ${e.rows.length}` }, title: CUPS[e.levelPlayed] || 'The Podium', chip: lvTag(e.level.after, e.level.up ? 'up a level' : e.level.drop ? 'a warm-up level' : 'level kept'),
    main: `<div class="pd-podium" aria-label="The podium">${order.map(block).join('')}</div>
      <div class="pd-card stg-paper pd-res pd-finish"><p class="pd-say">${esc(say)}</p>
      <ul class="pd-parts">${ROUNDS.map((rd, i) => `<li><span>${esc(rd.title)}${e.rounds[i].verified ? '' : ' — not heard'}</span><b>${e.totals[i]}/${ROUND_MAX[i]}</b></li>`).join('')}</ul>
      <p class="pd-coins" data-coins="${e.coins}">${icon('coin')}<span>${e.coins} coin${e.coins === 1 ? '' : 's'} this tournament — 5 a round the device heard${e.pays ? ', and 10 for the tournament' : ''}.</span></p>
      ${e.level.line ? `<p class="pd-note">${esc(e.level.line)}</p>` : e.level.up ? `<p class="pd-note">Next time: Level ${e.level.after}.</p>` : ''}
      <p class="pd-note">${icon('shield')} Your typed plans have been cleared from this device.</p></div>${honest}`,
    controls: `${link('The Stage', '#/stage', { ic: 'lectern', cls: 'out stg-pair' })}${btn('Another tournament', 'pd-again', { ic: 'undo', cls: 'stg-pair', attrs: 'data-primary' })}` });
}

/* ---------- the microphone ---------- */
function onLevel(v) { const b = document.getElementById('pd-lvl'); if (b) b.style.width = Math.round(v * 100) + '%'; }
function voidTake(msg) {
  const r = R(); if (!r?.live) return;
  micStop(); timersOff(); duck(false); stillScene(false); r.live = false; r.err = msg; render();
}
async function startTake() {
  const r = R(), t = T(); if (!r || !t || r.live) return;
  r.err = ''; stopNarration();
  try { await micStart(onLevel); }
  catch { r.err = 'The microphone could not open. A grown-up may need to allow it in the browser’s settings.'; render(); return; }
  if (R() !== r) { micStop(); return; }                      // the page moved on while the browser asked
  r.live = true; r.t0 = Date.now(); r.cue = 0; duck(true); stillScene(true); render();
  const sp = specOf(t, t.round);
  clearInterval(clock); clock = setInterval(() => { const el = document.getElementById('pd-clock'); if (!isLive()) return clearInterval(clock); if (el) el.textContent = fmt((Date.now() - r.t0) / 1000); }, 250);
  clearTimeout(capT); capT = setTimeout(() => { if (R() === r && r.live) PODIUM_ACTIONS['pd-stop'](); }, capSecs(sp) * 1000);   // never a microphone left on
  offHide(); offHide = onHidden(() => voidTake('The page was hidden, so the microphone switched off. Nothing was counted — tap Start when you are ready.'), () => {});
}
function stopTake() {
  const r = R(), t = T(); if (!r?.live || !t) return null;
  const ri = t.round, sp = specOf(t, ri);
  const m = micStop(sp.words, { syllables: sp.syllables, mode: sp.mode, minSecs: sp.minSecs });   // every track ends HERE, before anything is counted
  timersOff(); duck(false); stillScene(false); r.live = false; sfx('finish');
  return m;
}

/* ---------- actions ---------- */
export const PODIUM_ACTIONS = {
  'pd-level': (a) => { const k = kid(), rec = podiumOf(k); if (T()) return; rec.pick = a === 'auto' ? null : Math.max(1, Math.min(5, +a)); sfx('tap'); save(); render(); },
  'pd-new': () => {
    const k = kid(), rec = podiumOf(k); if (T()) return PODIUM_ACTIONS['pd-go']();
    const list = PASSAGES.filter(shippable).map((p) => ({ ...p, words: passageText(p.id)?.words || 0, syllables: passageText(p.id)?.syllables || 0 })).filter((p) => p.words);
    rec.n = (rec.n || 0) + 1; rec.cur = newTournament({ n: rec.n, level: playLevel(rec), band: k.band, passages: list });
    if (k.writing) delete k.writing.podium;
    save(); sfx('unlock'); PODIUM_ACTIONS['pd-go']();
  },
  'pd-go': () => {
    const r = R(), t = T(); if (!r || !t) return;
    r.err = ''; r.msg = ''; r.res = null; r.last = null; r.act = 'perform'; r.cue = 0; r.held = null; r.ver = null;
    const ri = t.round;
    if (ri === 2) r.view = t.prep ? 'plan' : 'topic';
    else if (ri === 3) r.view = t.rounds[3].planned ? 'stage' : 'topic';
    else r.view = 'stage';
    render();
  },
  'pd-topic': (id) => { const r = R(), t = T(); if (!t || t.round !== 2 || !t.prepChoices.includes(id)) return; t.prep = id; save(); r.view = 'plan'; sfx('tap'); render(); },
  'pd-plan-go': () => {
    const r = R(), t = T(); if (!t || t.round !== 3) return;
    r.view = 'plan'; r.planLeft = PLAN_SECS; render();
    let paused = false; clearInterval(planT); offHide();
    offHide = onHidden(() => { paused = true; }, () => { paused = false; });
    planT = setInterval(() => { if (R() !== r || r.view !== 'plan') return clearInterval(planT); if (paused) return; r.planLeft--; const el = document.getElementById('pd-plan-left'); if (el) el.textContent = r.planLeft;
      if (r.planLeft <= 0) { clearInterval(planT); sfx('unlock'); PODIUM_ACTIONS['pd-planned'](); } }, 1000);
  },
  'pd-line': (a) => { const r = R(), t = T(); if (!t) return; const [card, i] = String(a).split(':'), tp = topicOf(t, t.round), l = offers(tp, card)[+i]; if (!l || mustType(t.level, card)) return;
    planOf(kid(), RID(t.round))[card] = l.t; r.ver = null; r.msg = ''; sfx('tap'); save(); render(); },
  'pd-hold': (dev) => { const r = R(); if (!r || !DEVICES.some((d) => d.id === dev)) return; r.held = r.held === dev ? null : dev; r.ver = null; r.msg = ''; sfx('tap'); render(); },
  'pd-drop': (card) => {
    const r = R(), t = T(); if (!r?.held || !t) return;
    const plan = planOf(kid(), RID(t.round)), dev = DEVICES.find((d) => d.id === r.held);
    if (!plan[card]) { r.msg = `Choose or type a line for that card first, then add ${dev.name.toLowerCase()}.`; render(); return; }
    const opts = versions(plan, card, r.held, t.level, topicOf(t, t.round));
    if (!opts.length) { r.msg = `That line has no version with ${dev.name.toLowerCase()}. Try another card, or another device.`; r.held = null; render(); return; }
    r.ver = { card, dev: r.held, opts }; r.held = null; r.msg = ''; render();
    requestAnimationFrame(() => document.querySelector('.pd-ver .pd-line')?.focus());
  },
  'pd-ver': (i) => { const r = R(), t = T(); if (!r?.ver || !t) return; const o = r.ver.opts[+i]; if (!o) return; const card = r.ver.card;
    planOf(kid(), RID(t.round))[card] = o.text; r.ver = null; sfx('right'); save(); render();
    if (o.own) requestAnimationFrame(() => { const el = document.getElementById(`pd-in-${card}`); if (el) { el.value = o.text; el.focus(); const j = o.text.indexOf('___'); if (j >= 0) el.setSelectionRange(j, j + 3); } }); },
  'pd-ver-x': () => { const r = R(); if (r) { r.ver = null; render(); } },
  'pd-example': async () => { const r = R(); if (!r) return; r.example = true; render(); if (!FELIX) { const c = await import('../data/cases/case-07.json'); FELIX = felixPlan((c.default || c).speeches?.[0]); if (R() === r && r.example) render(); } },
  'pd-example-x': () => { const r = R(); if (r) { r.example = false; render(); } },
  'pd-planned': () => { const r = R(), t = T(); if (!t) return; clearInterval(planT); offHide(); offHide = () => {}; if (t.round === 3) t.rounds[3].planned = true; r.planLeft = null; r.view = 'stage'; r.act = 'perform'; r.example = false; save(); render(); },
  'pd-act': (a) => { const r = R(), t = T(); if (!r || !t || r.live) return; if (a === 'rehearse' && t.rounds[t.round].rehearsed) return; r.act = a === 'rehearse' ? 'rehearse' : 'perform'; r.view = 'stage'; r.cue = 0; r.err = ''; render(); },
  'pd-cue': (d) => { const r = R(); if (!r) return; r.cue = Math.max(0, Math.min(4, r.cue + (+d || 0))); render(); },
  'pd-start': () => startTake(),
  'pd-stop': () => {
    const r = R(), t = T(); const m = stopTake(); if (!m) return;
    const k = kid(), ri = t.round, sp = specOf(t, ri), x = t.rounds[ri];
    bumpDay(k, 'speak', Math.round(m.secs || 0));
    if (r.act === 'rehearse') { x.rehearsed = true; r.last = m; r.view = 'practice'; save(); render(); return; }
    const plan = ROUNDS[ri].plan ? planCheck(planOf(k, RID(ri)), t.level) : null, res = roundScore(ri, m, m.ev, plan, sp);
    Object.assign(x, { done: true, total: res.total, delivery: res.delivery, plan: res.plan, verified: res.verified, planOk: res.planOk, secs: m.secs });
    if (roundPays(res) && !x.paid) { x.paid = true; const c = pay('stop', `The Podium: ${ROUNDS[ri].title}, heard and ${ROUNDS[ri].plan ? 'planned' : 'read'}`) || 0; t.coins += c; mark('stop', `The Podium: ${ROUNDS[ri].title}`); }
    k.last = { what: 'contest', right: totalSoFar(t), at: Date.now() };
    r.last = m; r.res = res; r.view = 'result'; save(); render();
  },
  'pd-retry': () => { const r = R(), t = T(); if (!r || !t) return; const x = t.rounds[t.round]; if (x.verified) return; x.done = false; r.res = null; r.last = null; r.act = 'perform'; r.view = 'stage'; save(); render(); },
  'pd-self': (i) => { const t = T(); if (!t) return; t.rounds[t.round].self = Math.max(0, Math.min(2, +i)); save(); render(); },
  'pd-grown': (i) => { const t = T(); if (!t) return; const x = t.rounds[t.round]; x.grown = x.grown === +i ? null : Math.max(0, Math.min(2, +i)); save(); render(); },
  'pd-next': () => {
    const r = R(), t = T(); if (!r || !t || !t.rounds[t.round].done) return;
    if (t.round < 3) { t.round++; save(); r.view = 'lobby'; r.res = null; r.last = null; sfx('tap'); render(); return; }
    const k = kid(), f = finish(t);
    if (f.pays && !t.contestPaid) { t.contestPaid = true; t.coins += pay('contest', `The Podium: ${CUPS[t.level]}, ${f.total} of ${f.max}`) || 0; mark('stop', `The Podium: ${CUPS[t.level]} finished`); }
    const coins = t.coins, rounds = t.rounds.map((x) => ({ verified: x.verified })), levelPlayed = t.level;
    const end = closeTournament(k, t);                                    // the typed plans are cleared here
    bumpDay(k, 'made'); save();
    r.end = { ...end, coins, rounds, levelPlayed }; r.view = 'final';
    if (end.place <= 3 && end.total > 0) confetti(); sfx('medal'); render(); checkMedals();
  },
  'pd-again': () => { const r = R(); if (!r) return; r.end = null; r.view = 'lobby'; render(); },
};

/* typed lines: kept as they are typed (on this device only); the marks update in place, so the field keeps its focus */
export function podiumInput(el) {
  const t = T(); if (!t || !ROUNDS[t.round].plan) return;
  const card = el.dataset.arg; if (!CARDS.some(([c]) => c === card)) return;
  const plan = planOf(kid(), RID(t.round)); plan[card] = String(el.value || '').slice(0, 140);
  const pc = planCheck(plan, t.level), c = document.getElementById('pd-checks'); if (c) c.innerHTML = checksHtml(pc);
  const a = document.getElementById('pd-pc'), b = document.getElementById('pd-dc'); if (a) a.textContent = pc.points; if (b) b.textContent = pc.devices.length;
  clearTimeout(podiumInput.t); podiumInput.t = setTimeout(save, 400);
}

/* keys: Space/Enter the main action, arrows the cue cards, 1–3 a version, a line or a face, Escape a picker */
export function podiumKey(e) {
  const r = R(); if (!r || S.route.name !== 'stage' || S.route.parts[1] !== 'podium') return false;
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return false;
  if (e.key === 'Escape') { if (r.ver) { r.ver = null; render(); return true; } if (r.example) { r.example = false; render(); return true; } if (r.held) { r.held = null; render(); return true; } return false; }
  if (/^[1-3]$/.test(e.key)) {
    const i = +e.key - 1;
    if (r.ver && r.ver.opts[i]) { PODIUM_ACTIONS['pd-ver'](i); return true; }
    if (r.view === 'result') { PODIUM_ACTIONS['pd-self'](i); return true; }
    if (r.view === 'topic' && T()?.round === 2 && i < 2) { PODIUM_ACTIONS['pd-topic'](T().prepChoices[i]); return true; }
    const c = e.target.closest?.('[data-card]'); if (r.view === 'plan' && c) { PODIUM_ACTIONS['pd-line'](`${c.dataset.card}:${i}`); return true; }
    return false;
  }
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && r.view === 'stage') { PODIUM_ACTIONS['pd-cue'](e.key === 'ArrowRight' ? 1 : -1); return true; }
  if ((e.key === ' ' || e.key === 'Enter') && !/BUTTON|A/.test(e.target.tagName)) { const b = document.querySelector('.pd [data-primary]:not([disabled])'); if (b) { b.click(); return true; } }
  return false;
}

/* drag a device onto a card: mouse or finger (a tap without a drag holds it, for a card's "Add it here") */
let drag = null;
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => { const d = e.target.closest?.('.pd-dev'); if (!d || e.button > 0) return; drag = { dev: d.dataset.dev, x: e.clientX, y: e.clientY, ghost: null, moved: false }; });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return; if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    if (!drag.moved) { drag.moved = true; const g = document.createElement('div'); g.className = 'pd-ghost'; g.textContent = DEVICES.find((x) => x.id === drag.dev)?.name || ''; document.body.appendChild(g); drag.ghost = g; }
    drag.ghost.style.transform = `translate(${e.clientX + 8}px, ${e.clientY + 8}px)`;
    document.querySelectorAll('.pd-card.over').forEach((c) => c.classList.remove('over')); document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pd-card')?.classList.add('over');
  });
  const end = (e) => {
    if (!drag) return; const d = drag; drag = null; d.ghost?.remove(); document.querySelectorAll('.pd-card.over').forEach((c) => c.classList.remove('over'));
    if (!d.moved || e.type === 'pointercancel') return;
    const card = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pd-card'), r = R();
    if (card && r) { r.held = d.dev; PODIUM_ACTIONS['pd-drop'](card.dataset.card); }
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click', swallow, { capture: true, once: true }); setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 50);
  };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
}
export { isLive, micStop };
