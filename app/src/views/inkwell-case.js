/* inkwell-case.js — a case, on the stage (handover C §2.1.3, §2.1.9; season-one Part 10): the comic-panel opening, the
   Document Desk (notebook · document on painted paper · suspects on cork), the interviews, the cork board with red string,
   the washing-line timeline, the drawing-room accusation and Case Solved. Every rule is detective.js (step, judgeLink,
   judgeAccusation…); this file draws the state and turns taps, drags and keys into the engine's actions. Nothing here reads
   a clock to decide anything: there is no timer in a case. Text is always live HTML; the paintings carry no words.

   Marking: press and hold a phrase (drag to extend), or tap its first word and its last and press Mark, or by keyboard:
   arrows move a cursor word by word (up/down by line), Shift extends, Enter / Space / M marks, Esc clears.
   The board: drag one clue card onto another, or select two (tap, or Space) — then the wheel asks what they show.
   The washing line: drag a postcard onto a peg, or pick it up (tap / Space) and put it down on a peg (tap / Space). */

import { S, kid, save, render, pay, mark, isDark, go, confetti, checkMedals } from '../app.js';
import { esc, icon, pageHead } from '../ui.js';
import * as D from '../detective.js';
import * as SE from '../detective-season.js';
import { PERSONAS, personaById } from '../data/inkwell-personas.js';
import { sfx } from '../sound.js';
import { speak, stop as stopVoice, canSpeak } from '../voice.js';
import { rng, shuffle, hash } from '../rand.js';
import { figure, sticker, plateBg, casePlate, caseWash, paperBg, handOf, whoIs, flyCard, sweep, reduced, artUrl, WASH, matVars, fitInk } from './inkwell-kit.js';

/* ---------- state ---------- */
export const st = () => S.ink;
const C = () => S.ink.c, CS = () => S.ink.cs;
export const personaId = () => SE.inkOf(kid())?.persona || null;
export const pname = () => SE.detectiveName(kid());
export const pt = (s) => D.personaText(s, personaById(personaId()), kid()?.inkwellName);
const ctx = () => { const k = kid(), pid = personaId(); return { now: Date.now(), persona: pid, k, englishLevel: SE.englishLevelOf(k), knackFor: SE.knackFor, sergeant: SE.sergeant(k), level: SE.levelNow(k), card: pid ? SE.hoardCard(pid, C().id) : null }; };

/* the one door to the engine: step, keep, pay what it says, save */
export function act(a) {
  const s = st(), k = kid(), r = D.step(s.c, s.cs, a, ctx());
  if (r.state !== s.cs) { s.cs = r.state; SE.putCase(k, s.c, s.cs); }
  let coins = 0;
  for (const e of r.events || []) { coins += pay(e.ev, e.what) || 0; if (e.ev === 'stop' || e.ev === 'contest') mark('stop', e.what); }
  if (coins) { s.cs = { ...s.cs, coins: (s.cs.coins || 0) + coins }; SE.putCase(k, s.c, s.cs); s.coinPop = { n: coins, t: Date.now() }; }
  save(); return r;
}
/* a line from Quill (or anyone), optionally held until Continue */
export function say(text, { who = 'QUILL', hold = false, then = null, tone = '' } = {}) { st().say = text ? { who, text: pt(text), hold, then, tone } : null; }
/* the tutorial's own lines (Case 0), each said once per case run */
function tut(step) {
  const t = (C().tutorial || []).find((x) => x.step === step); if (!t) return null;
  const s = CS(), seen = s.tutSeen || []; if (seen.includes(step)) return null;
  st().cs = { ...s, tutSeen: [...seen, step] }; SE.putCase(kid(), C(), st().cs);
  return t.quill;
}

/* ---------- opening a case ---------- */
export function openCase(c, sub) {
  const k = kid(), prev = S.ink?.c?.id === c.id ? S.ink : null;
  let cs = SE.startCase(k, c, { now: Date.now() }); if (!cs.persona && personaId() && !cs.solved) { cs = { ...cs, persona: personaId() }; SE.putCase(k, c, cs); } save();
  const fresh = !cs.read.length && !cs.marks.length && cs.chapter === 1 && !cs.solved;
  const keep = prev ? { say: prev.say, doc: prev.doc, seg: prev.seg, ret: prev.ret, hint: prev.hint, acc: prev.acc, panel: prev.panel, closed: prev.closed, who: prev.who, centre: prev.centre, lastQ: prev.lastQ, expr: prev.expr, lens: prev.lens, focus: prev.focus, fly: prev.fly, flash: prev.flash, accWeak: prev.accWeak, retPending: prev.retPending, epi: prev.epi, coinPop: prev.coinPop } : {};
  S.ink = { ...S.ink, c, cs, doc: null, seg: 'doc', centre: 'doc', who: null, expr: null, cur: 0, anc: null, kbd: false, pick: [], wheel: null, flash: null, tl: { pick: null, cur: 0, slot: 0 }, acc: { culprit: null, ev: [], place: null }, panel: 0, ...keep };
  const s = S.ink;
  const want = sub || (cs.solved ? 'solved' : fresh ? 'opening' : ({ 3: 'board', 4: 'timeline', 5: 'accuse' }[cs.chapter] || 'desk'));
  s.sub = want === 'persona' || (want === 'desk' && !personaId() && c.id === 'case-00') ? 'persona' : want;
  if (s.sub === 'solved' && cs.solved && !s.closed) s.closed = SE.closeCase(k, c, cs, { now: Date.now() }), save();
  if (s.sub === 'reveal' && !cs.solved) s.sub = 'desk';
  if (['board', 'timeline', 'accuse'].includes(s.sub)) { const n = { board: 3, timeline: 4, accuse: 5 }[s.sub]; if (cs.reached < n) s.sub = 'desk'; else if (cs.chapter !== n && !cs.solved) act({ type: 'chapter', n }); }
  if (s.sub === 'desk' && !s.doc) s.doc = D.available(c, s.cs).find((d) => !s.cs.read.includes(d)) || D.available(c, s.cs)[0] || null;
  if (s.sub === 'desk' && s.cs.chapter > 2 && !s.cs.solved) act({ type: 'chapter', n: Math.min(2, s.cs.reached) });
  if (s.sub === 'desk' && !s.say) { const t = tut('read-aloud'); if (t) say(t); }
  if (s.sub === 'board' && !s.say) { const t = tut('link') || (c.boardIntro || [])[0]?.text; if (t) say(t); }
  if (s.sub === 'timeline' && !s.say) { const t = tut('timeline') || 'Put things in the order they happened. Which words say when?'; say(t); }
  if (s.sub === 'accuse' && !s.say) { const t = tut('accuse') || c.accusation?.question; if (t) say(t); }
}
export const leaveCase = () => { stopVoice(); };

/* ---------- small pieces ---------- */
const CH = [{ n: 1, sub: 'desk', label: 'Scene', ic: 'search' }, { n: 2, sub: 'desk', label: 'Interviews', ic: 'mic' }, { n: 3, sub: 'board', label: 'Board', ic: 'path' }, { n: 4, sub: 'timeline', label: 'Timeline', ic: 'clock' }, { n: 5, sub: 'accuse', label: 'Accuse', ic: 'star' }];
const castName = (id) => (id === 'quill' ? 'Quill' : (C().cast || []).find((p) => p.id === id)?.name || id);
const shortName = (id) => { const n = castName(id); return n.replace(/^(Mrs|Mr|Ms|Miss|Dr|Constable)\s+(\S+\s+)?/, (m, t, mid) => `${t} `).replace(/\s+/g, ' ').trim().split(' ').slice(0, 2).join(' '); };
const docOf = (id) => D.prepare(C()).docs.get(id);
const spanText = (id) => D.plain(D.prepare(C()).spans.get(id)?.text || '');
const dedOf = (id) => D.prepare(C()).deds.get(id);
const needed = () => D.prepare(C()).needed;
const markLabel = (m) => pt(m.text);
const hold = () => !!st().say?.hold;
const quillImg = () => sticker('quill-detective', { cls: 'ink-quill', alt: 'Quill', fallback: 'Q' });

function frame({ sub, main, mods = '', seg = true, title }) {
  const c = C(), cs = CS(), s = st(), dark = isDark();
  const pop = s.coinPop && Date.now() - s.coinPop.t < 2500 ? `<span class="ink-coinpop" aria-live="polite">+${s.coinPop.n} ${icon('coin')}</span>` : '';
  const left = cs.solved ? { v: 'Solved', l: 'case closed' } : { v: `${Math.min(5, cs.chapter)}<small>/5</small>`, l: 'chapter' };
  const lvl = SE.levelNow(kid());
  return pageHead({ title: c.title, back: { label: 'Agency', href: '#/inkwell' } }) + `<section class="stg ink ink-${sub} ${mods}" data-inkfit data-ink="${sub}" style="--ink-plate:${plateBg(casePlate(c), dark, caseWash(c))};${matVars()}">
  <header class="stg-hud"><div class="stg-pod stg-l" data-hud="l"><b>${left.v}</b><small>${esc(left.l)}</small></div>
    <div class="stg-mid"><h2 class="stg-title">${esc(title || D.CHAPTERS[Math.min(5, cs.chapter) - 1].title)}</h2><span class="lvtag"><b>Level ${c.level}</b> · ${esc(c.kind === 'journey' ? 'An Ink Journey' : c.label || 'A Bizzing mystery')}${lvl !== c.level ? ` · you: ${lvl}` : ''}</span></div>
    <div class="stg-pod stg-r" data-hud="r" aria-label="Ink for hints"><b>${cs.ink}</b><small>ink</small>${pop}</div></header>
  ${sub === 'opening' || sub === 'reveal' || sub === 'solved' || sub === 'persona' ? '' : rail()}
  <div class="ink-main" data-stage-main>${main}</div>
  ${sayBox()}
  ${seg && !['opening', 'reveal', 'solved', 'persona'].includes(sub) ? segBar(sub) : ''}
</section>`;
}
function rail() {
  const cs = CS(), s = st();
  const here = s.sub === 'desk' ? (cs.chapter <= 2 ? cs.chapter : 1) : { board: 3, timeline: 4, accuse: 5 }[s.sub];
  return `<nav class="ink-rail" aria-label="Chapters">${CH.map((h) => { const open = cs.reached >= h.n || D.canEnter(C(), cs, h.n).ok; const on = here === h.n;
    return `<button class="ink-ch${on ? ' on' : ''}${open ? '' : ' locked'}${cs.reached >= h.n ? ' reached' : ''}" data-act="ink-ch" data-arg="${h.n}"${on ? ' aria-current="step"' : ''} aria-label="Chapter ${h.n}: ${esc(h.label)}${open ? '' : ' (not open yet)'}"><i>${open ? h.n : icon('lock')}</i><span>${esc(h.label)}</span></button>`; }).join('<b class="ink-ch-gap" aria-hidden="true"></b>')}</nav>`;
}
export function sayBox() {
  const s = st(); if (!s.say) return '';
  const w = s.say.who, img = w === 'QUILL' ? quillImg() : (() => { const id = whoIs(C(), w, personaId()); return id ? figure(id.id, { cls: 'ink-say-fig', name: w }) : quillImg(); })();
  return `<div class="ink-say${s.say.hold ? ' hold' : ''}${s.say.tone ? ' ' + s.say.tone : ''}" role="${s.say.hold ? 'alertdialog' : 'status'}" aria-live="polite">${img}<p><b>${esc(w === 'QUILL' ? 'Quill' : pt(w).toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase()))}</b>${esc(s.say.text)}</p>${s.say.hold ? `<button class="btn ink-go" data-act="ink-cont">${icon('next')}<span>${esc(s.say.then?.label || 'Continue')}</span></button>` : `<button class="ink-x" data-act="ink-hush" aria-label="Close">${icon('close')}</button>`}</div>`;
}
function segBar(sub) {
  const s = st(), on = sub === 'desk' ? s.seg : 'board';
  const b = (id, label, ic) => `<button class="ink-sg${on === id ? ' on' : ''}" data-act="ink-seg" data-arg="${id}" aria-pressed="${on === id}">${icon(ic)}<span>${label}</span></button>`;
  return `<nav class="ink-segbar" aria-label="Views">${b('nb', 'Notebook', 'book')}${b('doc', 'Document', 'scroll')}${b('sus', 'Suspects', 'user')}${b('board', 'Board', 'path')}</nav>`;
}

/* ---------- the opening: comic panels over the scene ---------- */
function panelsOf(list) { return (list || []).map((p) => ({ place: p.place, lines: (p.lines || []).map((l) => ({ who: l.who, text: l.text })) })); }
function comicPanel(p, i, n, { label = 'Panel', next = 'ink-pnext', skip = 'ink-pskip' } = {}) {
  const c = C(), pid = personaId();
  const speakers = []; for (const l of p.lines) { const w = whoIs(c, l.who, pid); if (w && !speakers.some((x) => x.id === w.id)) speakers.push(w); }
  const figs = speakers.slice(0, 3).map((w, j) => `<div class="cp-fig cp-fig-${j}" style="--j:${j}">${w.persona ? figure(pid || 'player', { name: pname() }) : figure(w.id, { expr: /!|gone|vanished/.test(p.lines.find((l) => whoIs(c, l.who, pid)?.id === w.id)?.text || '') ? 'nervous' : 'calm', name: castName(w.id) })}</div>`).join('');
  const lines = p.lines.map((l) => { const w = whoIs(c, l.who, pid); return w ? `<p class="cp-bubble"><b>${esc(w.persona ? pname() : w.quill ? 'Quill' : shortName(w.id))}</b>${esc(pt(l.text))}</p>` : `<p class="cp-cap">${esc(pt(l.text))}</p>`; }).join('');
  const zoom = [[50, 50, 1], [30, 60, 1.25], [70, 40, 1.35], [50, 70, 1.5], [20, 40, 1.3], [80, 60, 1.3]][i % 6];
  return `<article class="cpanel" data-panel="${i}" style="--px:${zoom[0]}%;--py:${zoom[1]}%;--pz:${zoom[2]}"><div class="cp-scene"></div>
    ${p.place ? `<p class="cp-place">${esc(pt(p.place))}</p>` : ''}<div class="cp-figs" data-n="${Math.min(3, speakers.length)}">${figs}</div><div class="cp-lines">${lines}</div></article>
    <div class="cp-nav"><button class="btn out ink-pv" data-act="ink-pprev"${i === 0 ? ' disabled' : ''} aria-label="Back">${icon('back')}</button><span class="cp-dots" aria-label="${label} ${i + 1} of ${n}">${Array.from({ length: n }, (_, j) => `<i class="${j === i ? 'on' : j < i ? 'past' : ''}"></i>`).join('')}</span><button class="btn ink-go" data-act="${next}" aria-label="Next">${icon('next')}</button></div>
    <button class="ink-skip" data-act="${skip}">Skip</button>`;
}
function openingView() {
  const c = C(), P = panelsOf(c.cutscene || c.opening), s = st(), i = Math.min(s.panel || 0, Math.max(0, P.length - 1));
  const card = i === P.length - 1 && c.card?.text ? `<p class="cp-card">${esc(pt(c.card.text))}</p>` : '';
  return frame({ sub: 'opening', title: 'The case begins', main: `<div class="comic" data-play>${P.length ? comicPanel(P[i], i, P.length) : ''}${card}</div>` });
}

/* ---------- choose your detective ---------- */
const DEMO = {
  gap: 'The note has <mark>no name</mark>, <mark>no capital</mark> and <mark>no time</mark>.',
  paraphrase: '“He was taken in” <span class="kd-arrow">→</span> <mark>somebody carried him indoors</mark>.',
  ravens: '<mark>Cold</mark> in the report. <mark>Cold</mark> in the note. One word, two places.',
  slot: 'took him in <span class="kd-gap"><mark>?</mark></span> went up to bed',
  viewpoint: '<mark>Knew</mark> · <mark>wanted</mark> · <mark>did not know yet</mark>',
  voice: '“<mark>dont</mark> <mark>wory</mark>” — no capitals, <mark>no full stops</mark>.',
};
export function personaView({ coats = false } = {}) {
  const k = kid(), cur = personaId(), s = S.ink || {}, sel = s.pick1 || cur || SE.suggestPersona(k) || null;
  const cards = PERSONAS.map((p, i) => {
    const card = SE.hoardCard(p.id, 'case-00'), on = sel === p.id;
    return `<button class="pcard-d${on ? ' on' : ''}" data-act="ink-pick" data-arg="${p.id}" data-i="${i}" aria-pressed="${on}" aria-label="${esc(p.name)}: ${esc(p.knack.name)}">
      <span class="pd-art" style="--h:${(i * 57 + 20) % 360}">${sticker(`emb-${p.id}`, { cls: 'pd-emb', alt: '' })}${figure(p.id, { cls: 'pd-fig', name: p.name })}</span>
      <span class="pd-body"><b class="pd-name">${esc(p.name)}</b><i class="pd-sig">“${esc(p.signature)}”</i><span class="pd-gift">${esc(p.gift)}</span>
      <span class="pd-knack"><small>Knack · ${esc(p.knack.name)}</small><span class="kd kd-${p.knack.kind}">${DEMO[p.knack.kind] || ''}</span></span>
      ${card ? `<span class="pd-word"><small>A word to find</small><b>${esc(card.word)}</b></span>` : ''}</span></button>`;
  }).join('');
  const p = personaById(sel);
  const confirm = p ? `<div class="pd-confirm"><label for="ink-name">Call your detective</label><input id="ink-name" data-act="ink-name" maxlength="12" autocomplete="off" spellcheck="false" value="${esc(s.pname ?? (cur === sel ? k.inkwellName || '' : '') ?? '')}" placeholder="${esc(p.name)}" aria-describedby="ink-name-why">
     <small id="ink-name-why">Up to 12 letters. Leave it empty to keep ${esc(p.name)}.</small><button class="btn ink-go" data-act="ink-choose">${icon('check')}<span>Be ${esc(p.name)}</span></button><button class="btn out" data-act="ink-say-p">${icon('speaker')}<span>Read aloud</span></button></div>` : '';
  const head = `<div class="pd-head">${quillImg()}<p>${esc((C()?.tutorial || []).find((t) => t.step === 'choose-persona')?.quill || 'Every detective here reads in their own way. Which one are you?')}</p></div>`;
  const main = `<div class="pd-wrap" data-play>${head}<div class="pd-grid" role="group" aria-label="Choose your detective">${cards}</div>${confirm}</div>`;
  if (coats) return pageHead({ title: 'Change coats', back: { label: 'Agency', href: '#/inkwell' } }) + `<section class="stg ink ink-persona" data-inkfit style="--ink-plate:${plateBg('agency', isDark(), WASH.agency)};${matVars()}"><header class="stg-hud"><div class="stg-pod stg-l"><b>6</b><small>detectives</small></div><div class="stg-mid"><h2 class="stg-title">Choose your detective</h2><span class="lvtag">Progress stays yours, whoever you play</span></div><div class="stg-pod stg-r"><b>${Object.values(SE.inkOf(k).hoard).reduce((a, b) => a + b.length, 0)}</b><small>words found</small></div></header><div class="ink-main" data-stage-main>${main}</div></section>`;
  return frame({ sub: 'persona', title: 'Choose your detective', main });
}

/* ---------- the Document Desk ---------- */
function deskView() {
  const s = st(), cs = CS(), mode = s.centre === 'interview' && s.who ? 'iv' : 'doc';
  return frame({ sub: 'desk', mods: `seg-${s.seg}`, main: `<div class="desk3" data-play>${notebookCol()}<div class="ink-col ink-centre" data-col="doc">${mode === 'iv' ? interviewPane() : docPane()}</div>${suspectsCol()}</div>${toolsRow()}` });
}
function toolsRow() {
  const s = st(), cs = CS(), c = C(), pid = personaId(), kn = pid ? SE.knackFor(c, pid) : null, used = (cs.knack[cs.chapter] || 0) >= 1 + (cs.chapter === 3 && SE.sergeant(kid()) ? 1 : 0);
  const knOk = kn && kn.chapter === cs.chapter && !used && cs.chapter < 5;
  const deskN = D.deskItems(c, cs, SE.englishLevelOf(kid())).filter((x) => !x.done).length;
  const p = personaById(pid);
  const glow = c.id === 'case-00' && s.doc === '0.3' && knOk ? ' glow' : '';
  return `<div class="ink-tools"><button class="btn out small ink-knack${glow}" data-act="ink-knack"${knOk ? '' : ' aria-disabled="true"'} title="K">${icon('star')}<span>${esc(p ? p.knack.name : 'Knack')}</span></button>
    <button class="btn out small" data-act="ink-read" title="R">${icon('speaker')}<span>Read aloud</span></button>
    <button class="btn out small${s.lens ? ' on' : ''}" data-act="ink-lens" aria-pressed="${!!s.lens}" title="L">${icon('search')}<span>Magnifier</span></button>
    <button class="btn out small" data-act="ink-hint" title="H">${icon('lamp')}<span>Hint · 1 ink</span></button>
    ${deskN ? `<a class="btn out small ink-tdesk" href="#/inkwell/desk/${c.id}">${icon('quill')}<span>Training Desk · ${deskN}</span></a>` : ''}
    ${nextBtn()}</div>${s.knackShow ? knackPanel() : ''}`;
}
function nextBtn() {
  const cs = CS(), c = C(), n = Math.min(5, cs.chapter) + 1, s = st();
  if (cs.solved) return '';
  if (s.sub === 'desk' && cs.chapter === 1) return `<button class="btn small ink-next" data-act="ink-ch" data-arg="2">${icon('next')}<span>Interviews</span></button>`;
  if (s.sub === 'desk' && cs.chapter === 2) return `<button class="btn small ink-next" data-act="ink-ch" data-arg="3">${icon('next')}<span>The board</span></button>`;
  if (n <= 5 && D.canEnter(c, cs, n).ok && s.sub !== 'desk') return `<button class="btn small ink-next" data-act="ink-ch" data-arg="${n}">${icon('next')}<span>${esc(D.CHAPTERS[n - 1].title)}</span></button>`;
  return '';
}
function knackPanel() {
  const k = st().knackShow, c = C(), P = D.prepare(c);
  const human = (s) => String(s).replace(/[-_]/g, ' ');
  const item = (x) => { const [kind, rest = ''] = String(x).split(/:(.*)/s);
    if (kind === 'span') { const sp = P.spans.get(rest); return sp ? `<li><q>${esc(pt(D.plain(sp.text)))}</q><small>${esc(P.docs.get(sp.doc)?.title || '')}</small><button class="btn out small" data-act="ink-open" data-arg="${esc(sp.doc)}">Read it</button></li>` : ''; }
    if (kind === 'link') { const [a, b] = rest.split('+'); const t = (id) => (P.spans.has(id) ? D.plain(P.spans.get(id).text) : human(id)); return `<li><q>${esc(pt(t(a)))}</q> <span class="kd-arrow">and</span> <q>${esc(pt(t(b)))}</q></li>`; }
    if (kind === 'para') return `<li><q>${esc(pt(rest))}</q></li>`;
    if (/^(knew|wanted|didntKnow)$/.test(kind)) return `<li><b>${kind === 'didntKnow' ? 'Did not know yet' : kind === 'knew' ? 'Knew' : 'Wanted'}:</b> ${rest.split('|').map((o) => `<span class="kn-opt">${esc(pt(o))}</span>`).join(' ')}</li>`;
    return `<li>${esc(human(rest || kind))}</li>`; };
  return `<div class="ink-knackp" role="dialog" aria-label="Your Knack">${sticker(`emb-${personaId()}`, { cls: 'kn-emb', alt: '' })}<div><p class="kn-line">${esc(pt(k.line || ''))}</p><ul>${(k.candidates || []).map(item).join('')}</ul><small>Three to look at. It points; it never tells.</small></div><button class="ink-x" data-act="ink-knack-x" aria-label="Close">${icon('close')}</button></div>`;
}
function notebookCol() {
  const cs = CS(), marks = cs.marks.slice().reverse(), inLink = new Set(cs.links.flatMap((l) => [l.a, l.b]));
  const card = (m) => `<li class="nb-card${inLink.has(m.id) ? ' linked' : ''}" data-mark="${esc(m.id)}"><button class="nb-text" data-act="ink-goto" data-arg="${esc(m.id)}"><q>${esc(markLabel(m))}</q><small>${esc(docOf(m.doc)?.title || '')}</small></button><button class="nb-x" data-act="ink-unmark" data-arg="${esc(m.id)}" aria-label="Take back: ${esc(markLabel(m))}">${icon('close')}</button></li>`;
  return `<aside class="ink-col ink-nb" data-col="nb" aria-label="Notebook"><h3>${icon('book')}<span>Notebook</span><small>${cs.marks.length}</small></h3>
    ${marks.length ? `<ul class="nb-list">${marks.map(card).join('')}</ul>` : `<p class="nb-empty">Press and hold the words that matter. They come here as clue cards.</p>`}</aside>`;
}
function people() {
  const c = C(), cs = CS(), sus = new Set(D.suspects(c, cs)), ids = [];
  for (const iv of c.interviews || []) if (!ids.includes(iv.suspect)) { const p = (c.cast || []).find((x) => x.id === iv.suspect); if (!p || !p.unlockedBy || cs.proved.includes(p.unlockedBy)) ids.push(iv.suspect); }
  for (const id of sus) if (!ids.includes(id)) ids.push(id);
  return ids.map((id) => ({ id, p: (c.cast || []).find((x) => x.id === id), suspect: sus.has(id) }));
}
function suspectsCol() {
  const c = C(), cs = CS(), s = st();
  const list = people().map(({ id, p, suspect }) => { const iv = (c.interviews || []).find((x) => x.suspect === id); const qs = D.questions(c, cs).filter((q) => q.suspect === id); const open = qs.filter((q) => q.open && !q.asked).length;
    return `<li><button class="sus${s.who === id && s.centre === 'interview' ? ' on' : ''}" data-act="ink-who" data-arg="${esc(id)}"><span class="sus-pic">${figure(iv?.answeredBy && iv.answeredBy !== id ? id : id, { expr: s.who === id ? s.expr || 'calm' : 'calm', name: p?.name || id })}</span><b>${esc(shortName(id))}</b><small>${esc(suspect ? 'suspect' : p?.role === 'client' ? 'client' : 'witness')}${cs.chapter >= 2 && open ? ` · ${open} to ask` : ''}</small></button></li>`; }).join('');
  return `<aside class="ink-col ink-sus" data-col="sus" aria-label="Suspects"><h3>${icon('user')}<span>Suspects</span><small>${D.suspects(c, cs).length}</small></h3><ul class="sus-list">${list}</ul></aside>`;
}
function docTray() {
  const c = C(), cs = CS(), s = st(), av = D.available(c, cs).filter((id) => !D.prepare(c).answerOf.has(id) || cs.asked.includes(D.prepare(c).answerOf.get(id)));
  return `<div class="doc-tray" role="tablist" aria-label="Documents">${av.map((id) => { const d = docOf(id); return `<button role="tab" class="dt${s.doc === id ? ' on' : ''}${cs.read.includes(id) ? '' : ' new'}" data-act="ink-open" data-arg="${esc(id)}" aria-selected="${s.doc === id}" title="${esc(pt(d.title))}"><i class="dt-${handOf(d.type)}"></i><span>${esc(pt(d.title))}</span></button>`; }).join('')}</div>`;
}
function docPane() {
  const s = st();
  return `${docTray()}${s.doc ? paper(s.doc) : '<p class="nb-empty">Choose a document.</p>'}`;
}
/* a document on its painted paper, every word a markable span (clue spans are never shown until marked) */
export function paper(docId, { markable = true } = {}) {
  const c = C(), cs = CS(), s = st(), d = docOf(docId); if (!d) return '';
  const T = D.tokens(c, docId), marked = new Set();
  for (const m of cs.marks.filter((x) => x.doc === docId)) {
    if (m.span) T.forEach((t) => { if (t.span === m.span) marked.add(t.i); });
    else { const r = String(m.id).match(/:(\d+)-(\d+)$/); if (r) for (let i = +r[1]; i <= +r[2]; i++) marked.add(i); }
  }
  const sel = s.anc != null && s.selDoc === docId ? [Math.min(s.anc, s.cur), Math.max(s.anc, s.cur)] : null;
  const hintSp = s.hint?.doc === docId ? s.hint : null, hintLine = hintSp?.span ? T.find((t) => t.span === hintSp.span)?.line : hintSp?.line;
  const ret = s.ret?.doc === docId ? new Set(s.ret.spans || []) : null;
  const lines = []; let cur = -1;
  for (const t of T) {
    if (t.line !== cur) { lines.push([]); cur = t.line; }
    const cls = ['w'];
    if (marked.has(t.i)) cls.push('mk');
    if (sel && t.i >= sel[0] && t.i <= sel[1]) cls.push('sel');
    if (s.kbd && s.selDoc === docId && s.cur === t.i) cls.push('cur');
    if (hintSp && hintSp.level >= 3 && hintSp.span && t.span === hintSp.span) cls.push('hinted');
    else if (hintSp && hintSp.level >= 2 && t.line === hintLine) cls.push('hint-line');
    if (ret && t.span && ret.has(t.span)) cls.push('ret');
    lines[lines.length - 1].push(`<span class="${cls.join(' ')}" data-i="${t.i}">${esc(pt(t.t))}</span>`);
  }
  const talk = cs.read.includes(docId) && (d.talk || []).length ? `<div class="doc-talk">${d.talk.slice(0, 3).map((l) => { const w = whoIs(c, l.who, personaId()); return `<p>${w ? figure(w.persona ? personaId() || 'player' : w.id, { cls: 'dk-fig', name: l.who }) : ''}<span><b>${esc(w?.quill ? 'Quill' : w ? shortName(w.id) : l.who)}</b>${esc(pt(l.text))}</span></p>`; }).join('')}</div>` : '';
  const pick = sel ? `<div class="doc-pick" role="toolbar"><q>${esc(T.slice(sel[0], sel[1] + 1).map((t) => pt(t.t)).join(' '))}</q><button class="btn small ink-go" data-act="ink-mark">${icon('pen')}<span>Mark</span></button><button class="btn out small" data-act="ink-unsel" aria-label="Cancel">${icon('close')}</button></div>` : '';
  return `<article class="paper paper-${handOf(d.type)}" data-doc="${esc(docId)}" style="--paper:${paperBg(d.type)}">
    <header class="pp-head"><small class="pp-type">${esc(d.type)}</small><h3>${esc(pt(d.title))}</h3>${d.author || d.when || d.where ? `<p class="pp-meta">${[d.author, d.when, d.where].filter(Boolean).map((x) => esc(pt(x))).join(' · ')}</p>` : ''}</header>
    <div class="pp-body${markable ? ' markable' : ''}" data-body="${esc(docId)}" tabindex="0" role="application" aria-roledescription="document" aria-label="${esc(pt(d.title))}. Arrows move word by word, Shift extends, Enter marks.">${lines.map((l) => `<p>${l.join(' ')}</p>`).join('')}</div>
    ${talk}</article>${pick}${s.lens ? '<div class="ink-lens" aria-hidden="true"><div class="ink-lens-in"></div></div>' : ''}`;
}
function interviewPane() {
  const c = C(), cs = CS(), s = st(), id = s.who, iv = (c.interviews || []).find((x) => x.suspect === id), p = (c.cast || []).find((x) => x.id === id);
  const face = iv?.answeredBy && (c.cast || []).some((x) => x.id === iv.answeredBy) ? iv.answeredBy : id;
  const qs = D.questions(c, cs).filter((q) => q.suspect === id);
  const cards = qs.map((q, i) => q.open || q.asked ? `<button class="qcard${q.asked ? ' asked' : ''}${s.lastQ === q.id ? ' on' : ''}" data-act="ink-ask" data-arg="${esc(q.id)}" style="--r:${(i - (qs.length - 1) / 2) * 3}deg"><small>${esc(String(q.type || 'ask').toUpperCase())}</small><span>${esc(pt(q.q))}</span>${q.asked ? '<i>read the answer</i>' : ''}</button>` : `<span class="qcard down" style="--r:${(i - (qs.length - 1) / 2) * 3}deg" aria-label="A question for later">${icon('lock')}<small>Later</small></span>`).join('');
  const ans = s.lastQ && qs.some((q) => q.id === s.lastQ && q.asked) ? paper(qs.find((q) => q.id === s.lastQ).answerDoc) : '';
  const talk = !ans && (iv?.talk || []).length ? `<div class="doc-talk">${iv.talk.slice(0, 3).map((l) => { const w = whoIs(c, l.who, personaId()); return `<p>${w ? figure(w.id, { cls: 'dk-fig', name: l.who }) : ''}<span><b>${esc(w ? shortName(w.id) : l.who)}</b>${esc(pt(l.text))}</span></p>`; }).join('')}</div>` : '';
  return `<div class="iv"><div class="iv-stage"><div class="iv-fig">${figure(face, { expr: s.expr || 'calm', name: p?.name || id, alt: `${castName(face)}, looking ${s.expr || 'calm'}` })}</div>
    <div class="iv-plate"><b>${esc(castName(id))}</b>${face !== id ? `<small>answered by ${esc(castName(face))}</small>` : p?.manner ? `<small>${esc(p.manner)}</small>` : ''}</div>
    <button class="btn out small iv-back" data-act="ink-centre" data-arg="doc">${icon('scroll')}<span>Documents</span></button></div>
    ${cs.chapter < 2 && !cs.asked.length ? `<p class="iv-wait">Interviews come in chapter 2. Read the scene first.</p>` : `<div class="qfan" role="group" aria-label="Questions">${cards}</div>`}${ans}${talk}</div>`;
}

/* ---------- the board: cork, clue cards, red string ---------- */
function boardView() {
  const c = C(), cs = CS(), s = st(), nd = needed(), have = nd.filter((d) => cs.proved.includes(d)).length;
  const marks = cs.marks, picked = new Set(s.pick);
  const cards = marks.map((m, i) => { const r = ((hash(m.id) % 9) - 4) * 0.8; const linked = cs.links.some((l) => l.a === m.id || l.b === m.id);
    return `<button class="bd-card${picked.has(m.id) ? ' on' : ''}${linked ? ' linked' : ''}${s.flash?.ids?.includes(m.id) ? ' ' + s.flash.kind : ''}" data-act="ink-bpick" data-arg="${esc(m.id)}" data-card="${esc(m.id)}" data-i="${i}" style="--r:${r}deg" aria-pressed="${picked.has(m.id)}"><i class="bd-pin" data-pin="${esc(m.id)}"></i><q>${esc(markLabel(m))}</q><small>${esc(docOf(m.doc)?.title || '')}</small></button>`; }).join('');
  const proved = cs.proved.map((id) => dedOf(id)).filter(Boolean).map((d) => `<li>${icon('check')}<span>${esc(pt(d.label || d.id))}</span></li>`).join('');
  const people = D.suspects(c, cs).map((id) => `<span class="bd-sus">${figure(id, { name: castName(id) })}<b>${esc(shortName(id))}</b></span>`).join('');
  const main = `<div class="board" data-play><div class="bd-cork"><div class="bd-sus-row">${people}</div><svg class="bd-strings" aria-hidden="true"></svg><div class="bd-cards" data-n="${marks.length}">${cards || '<p class="nb-empty">Your notebook is empty. Mark clues in the documents first.</p>'}</div></div>
    <aside class="bd-side"><h3>${icon('path')}<span>Deductions</span><small>${have} of ${nd.length}</small></h3><ul class="bd-proved">${proved || '<li class="muted">None yet. Two clues together can say more than each alone.</li>'}</ul></aside></div>${toolsRow()}${s.wheel ? wheelView() : ''}`;
  return frame({ sub: 'board', main });
}
function wheelView() {
  const s = st(), [a, b] = s.wheel, m = (id) => CS().marks.find((x) => x.id === id);
  const kinds = D.DTYPES;
  return `<div class="wheel-scrim" data-act="ink-wheel-x" data-self="1"><div class="wheel" role="dialog" aria-label="What do these two show?"><div class="wh-center"><q>${esc(markLabel(m(a)))}</q><span>and</span><q>${esc(markLabel(m(b)))}</q><b>What do they show together?</b></div>
    ${kinds.map((k, i) => `<button class="wh-opt${s.wheelI === i ? ' cur' : ''}" style="--a:${(i / kinds.length) * 360 - 90}deg" data-act="ink-link" data-arg="${k}"><b>${i + 1}</b>${esc(D.DTYPE_LABEL[k])}</button>`).join('')}
    <button class="ink-x wh-x" data-act="ink-wheel-x" aria-label="Cancel">${icon('close')}</button></div></div>`;
}

/* ---------- the timeline: a washing line ---------- */
function tlModel() {
  const c = C(), cs = CS(), P = D.prepare(c), kids = P.childEvents, n = kids.length;
  const line = cs.timeline.line.slice(); while (line.length < n) line.push(null);
  const fixed = P.events.filter((e) => e.placedByChild === false);
  const seq = []; let k = 0;
  const childOrders = kids.map((e) => e.order);
  for (let j = 0; j <= n; j++) {
    for (const f of fixed) if (childOrders.filter((o) => o < f.order).length === j) seq.push({ fixed: f });
    if (j < n) seq.push({ slot: j, ev: line[j] ? P.events.find((e) => e.id === line[j]) : null });
  }
  let pile = kids.filter((e) => !line.includes(e.id));
  pile = shuffle(rng('tl:' + c.id), pile); if (pile.length > 1 && pile.every((e, j) => j === 0 || e.order > pile[j - 1].order)) pile = [...pile.slice(1), pile[0]];
  return { seq, pile, n, line, done: cs.timeline.done };
}
function tlQuote(e) { const cs = CS(); const q = (e.spans || []).filter((sp) => { const x = D.prepare(C()).spans.get(sp); return x && cs.read.includes(x.doc); }).map(spanText); return q.length ? `<small class="tl-q">${q.map((x) => `“${esc(pt(x))}”`).join(' · ')}</small>` : ''; }
function timelineView() {
  const s = st(), M = tlModel(), cs = CS(), c = C(), pick = s.tl.pick, clash = new Set(s.flash?.clash || []);
  const peg = (x) => x.fixed ? `<div class="tl-peg fixed"><div class="tl-card fixed"><span>${esc(pt(x.fixed.text))}</span><small class="tl-by">pegged by Quill</small></div></div>`
    : `<div class="tl-peg${s.tl.holding && s.tl.slot === x.slot ? ' cur' : ''}" data-at="${x.slot}">${x.ev ? `<button class="tl-card${pick === x.ev.id ? ' on' : ''}${clash.has(x.ev.id) ? ' clash' : ''}" data-act="ink-tpick" data-arg="${esc(x.ev.id)}" data-ev="${esc(x.ev.id)}"><span>${esc(pt(x.ev.text))}</span>${tlQuote(x.ev)}</button>` : `<button class="tl-empty" data-act="ink-tslot" data-arg="${x.slot}" aria-label="Peg ${x.slot + 1}${pick ? ': put the card here' : ''}"><i>${x.slot + 1}</i></button>`}</div>`;
  const rows = []; const per = matchMedia('(max-width: 720px)').matches ? 3 : M.seq.length > 8 ? Math.ceil(M.seq.length / 2) : M.seq.length;
  for (let i = 0; i < M.seq.length; i += per) rows.push(M.seq.slice(i, i + per));
  const pile = M.pile.map((e, i) => `<button class="tl-card pile${pick === e.id ? ' on' : ''}${!s.tl.holding && s.kbd && s.tl.cur === i ? ' cur' : ''}" data-act="ink-tpick" data-arg="${esc(e.id)}" data-ev="${esc(e.id)}" style="--r:${((hash(e.id) % 7) - 3) * 1.5}deg"><span>${esc(pt(e.text))}</span>${tlQuote(e)}</button>`).join('');
  const feast = cs.timeline.done && c.timeline?.feast && !D.feastDone(c, cs) ? feastView() : '';
  const main = `<div class="tline${s.flash?.kind === 'shake' ? ' shake' : ''}" data-play>${rows.map((r) => `<div class="tl-row" style="--n:${r.length}">${r.map(peg).join('')}</div>`).join('')}
    ${M.done ? `<p class="tl-done">${icon('check')}<span>The line holds.</span></p>` : `<div class="tl-pile" data-pile="1" aria-label="Postcards to peg">${pile || '<p class="muted">Every card is on the line.</p>'}</div>`}${feast}</div>${toolsRow()}`;
  return frame({ sub: 'timeline', main });
}
function feastView() {
  const c = C(), cs = CS(), F = c.timeline.feast, f = cs.timeline.feast || {}, i = F.items.findIndex((_, j) => f[j] !== true); if (i < 0) return '';
  const it = F.items[i];
  return `<div class="feast"><h3>${esc(F.title || 'The feast')}</h3><p class="fe-q">${esc(pt(it.prompt))}</p><div class="fe-opts">${it.options.map((o, j) => `<button class="btn out" data-act="ink-feast" data-arg="${i}:${j}"><b>${j + 1}</b><span>${esc(pt(o))}</span></button>`).join('')}</div></div>`;
}

/* ---------- the accusation: the drawing room ---------- */
function accuseView() {
  const c = C(), cs = CS(), s = st(), a = c.accusation || {}, slots = D.slotsOf(c).slots.length, A = s.acc;
  const easels = D.accusable(c, cs).map((id, i) => `<button class="easel${A.culprit === id ? ' on' : ''}" data-act="ink-culprit" data-arg="${esc(id)}" aria-pressed="${A.culprit === id}"><span class="ea-frame">${figure(id, { expr: A.culprit === id ? 'nervous' : 'calm', name: castName(id) })}</span><b>${esc(shortName(id))}</b><small>${i + 1}</small></button>`).join('');
  const theories = Object.keys(a.wrongTheory || {}).map((t) => `<button class="easel idea${A.culprit === t ? ' on' : ''}" data-act="ink-culprit" data-arg="${esc(t)}" aria-pressed="${A.culprit === t}"><span class="ea-frame idea">${icon('lamp')}</span><b>No one: ${esc(t.replace(/-/g, ' '))}</b></button>`).join('');
  const weak = new Set(s.accWeak || []);
  const ded = cs.proved.map((id) => dedOf(id)).filter(Boolean).map((d) => ({ id: d.id, t: pt(d.label || d.id), k: 'deduction' }));
  const clues = cs.marks.map((m) => ({ id: m.id, t: markLabel(m), k: 'clue' }));
  const ev = [...ded, ...clues].map((x) => `<button class="ev ev-${x.k}${A.ev.includes(x.id) ? ' on' : ''}${weak.has(x.id) ? ' weak' : ''}" data-act="ink-ev" data-arg="${esc(x.id)}" aria-pressed="${A.ev.includes(x.id)}"><small>${x.k}</small><span>${esc(x.t)}</span></button>`).join('');
  const pins = Array.from({ length: slots }, (_, i) => { const id = A.ev[i]; const x = [...ded, ...clues].find((y) => y.id === id); return `<span class="pin-slot${x ? ' full' : ''}${x && weak.has(x.id) ? ' weak' : ''}">${x ? esc(x.t) : `pin ${i + 1}`}</span>`; }).join('');
  const place = a.place ? `<div class="ac-place"><b>${esc(pt(a.place.prompt))}</b><div>${a.place.options.map((o) => `<button class="btn out small${A.place === o ? ' on' : ''}" data-act="ink-place" data-arg="${esc(o)}" aria-pressed="${A.place === o}">${esc(pt(o))}</button>`).join('')}</div></div>` : '';
  const ready = A.culprit && A.ev.length === slots && (!a.place || A.place);
  const main = `<div class="drawing" data-play><p class="ac-q">${esc(pt(a.question || 'Who did it?'))}</p><div class="easels" data-n="${D.accusable(c, cs).length}">${easels}${theories}</div>
    <div class="ac-pins"><span class="ac-who">${A.culprit ? esc(castName(A.culprit)) : 'Choose who'}</span><div class="pin-row">${pins}</div></div>
    <div class="ac-ev" role="group" aria-label="Evidence: choose ${slots}">${ev}</div>${place}
    <div class="ac-go"><button class="btn ink-go big" data-act="ink-accuse"${ready ? '' : ' aria-disabled="true"'}>${icon('star')}<span>Accuse</span></button><small>The Knack rests here. You accuse alone.</small></div></div>`;
  return frame({ sub: 'accuse', main });
}

/* ---------- the reveal and Case Solved ---------- */
function revealPanels() {
  const c = C(), out = []; let cur = null;
  for (const l of c.reveal || []) { const stage = /^(STAGE|CAPTION|SETTING)$/i.test(l.who); if (!cur || cur.lines.length >= 3 || (stage && cur.lines.length)) { cur = { place: null, lines: [] }; out.push(cur); } if (stage && !cur.place && !cur.lines.length) cur.place = l.text; else cur.lines.push(l); }
  return out.filter((p) => p.lines.length || p.place);
}
function revealView() {
  const P = revealPanels(), s = st(), i = Math.min(s.panel || 0, Math.max(0, P.length - 1));
  return frame({ sub: 'reveal', title: 'The reveal', main: `<div class="comic reveal" data-play>${P.length ? comicPanel(P[i], i, P.length, { label: 'Scene', next: 'ink-rnext', skip: 'ink-rskip' }) : ''}</div>` });
}
function solvedView() {
  const c = C(), cs = CS(), s = st(), k = kid(), cl = s.closed || {}, obj = c.officeObject || c.souvenir, card = cl.card;
  const objImg = obj ? sticker(`obj-${obj.id}`, { cls: 'sv-obj', alt: obj.name, fallback: icon('star') }) : '';
  const ledger = SE.ledgerWords(k, s.cases || [c]);
  const word = c.vanishedWord ? `<div class="sv-ledger"><small>The Blot Ledger</small><p>${ledger.map((w) => `<b class="${w.word === c.vanishedWord ? 'ink-new' : ''}">${esc(w.word)}</b>`).join(' ')}</p></div>` : '';
  const lv = cl.level, lvLine = !lv ? '' : lv.dropped ? SE.DROP_LINE(lv.after) : lv.after > lv.before ? `Level ${lv.after} next. Your reading earned it.` : `Level ${lv.after}: you choose, any time.`;
  const h = cs.hoard, origin = card ? `<div class="sv-card${h?.right ? ' done' : ''}"><div class="oc-face"><small>A word found in this case</small><b class="oc-word">${esc(card.word)}</b><ol class="oc-path">${(card.path || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p>${esc(card.story || card.line || '')}</p>${card.doubt ? `<p class="muted">${esc(card.doubt)}</p>` : ''}${card.askFamily ? '<p class="oc-ask">Ask your family.</p>' : ''}</div>
    ${card.question && !h?.right ? `<div class="oc-q"><b>${esc(card.question.prompt)}</b>${card.question.options.map((o, i) => `<button class="btn out small" data-act="ink-origin" data-arg="${esc(o)}"><b>${i + 1}</b><span>${esc(o)}</span></button>`).join('')}</div>` : h?.right ? `<p class="oc-ok">${icon('check')}<span>Filed in ${esc(pname())}’s Word Hoard.</span></p>` : ''}</div>` : '';
  const skills = (c.skills || []).map((x) => `<li>${esc({ detail: 'finding a detail', sequence: 'putting events in order', inference: 'working out what is not said', pronoun: 'who “she” or “it” is', vocab: 'a word in its context', factopinion: 'fact or opinion', figurative: 'figurative or literal', voice: 'whose voice it is', punctuation: 'punctuation that changes meaning', contradiction: 'spotting a contradiction' }[x] || x)}</li>`).join('');
  const epi = s.epi ? `<div class="sv-epi">${(c.epilogue || []).map((l) => { const w = whoIs(c, l.who, personaId()); return `<p>${w ? `<b>${esc(w.persona ? pname() : w.quill ? 'Quill' : shortName(w.id))}</b>` : ''}${esc(pt(l.text))}</p>`; }).join('')}</div>` : '';
  const main = `<div class="solved" data-play><div class="sv-office"><div class="sv-shelf">${objImg}<small>${esc(obj?.name || '')}</small></div><div class="sv-file"><b>${esc(c.title)}</b><span class="sv-stamp">SOLVED</span><small>${cl.wall?.full || cs.firstScore === 1 ? 'full evidence, first time' : 'solved'}</small></div></div>
    <div class="sv-facts"><p class="sv-coins">${icon('coin')}<b data-coins="${cs.coins || 0}">${cs.coins || 0}</b><span>coins from this case</span></p>${lvLine ? `<p class="sv-level">${esc(lvLine)}</p>` : ''}${skills ? `<div class="sv-skills"><small>What you read for</small><ul>${skills}</ul></div>` : ''}</div>
    ${word}${origin}${epi}
    <div class="sv-go"><a class="btn ink-go big" href="#/inkwell" data-arrive="${esc(c.id)}">${icon('home')}<span>Back to the Agency</span></a><button class="btn out" data-act="ink-epi">${icon('book')}<span>${s.epi ? 'Hide' : 'Read'} the epilogue</span></button><a class="btn out" href="#/inkwell/desk/${c.id}">${icon('quill')}<span>Training Desk</span></a></div></div>`;
  return frame({ sub: 'solved', title: 'Case solved', main });
}

/* ---------- the case view ---------- */
export function caseView() {
  const s = st(); if (!s?.c) return '';
  queueMicrotask(() => requestAnimationFrame(post));
  switch (s.sub) {
    case 'opening': return openingView();
    case 'persona': return personaView();
    case 'board': return boardView();
    case 'timeline': return timelineView();
    case 'accuse': return accuseView();
    case 'reveal': return revealView();
    case 'solved': return solvedView();
    default: return deskView();
  }
}

/* after a render: fit the stage, draw the strings, fly the card, keep the cursor in view */
function post() {
  const s = st(); if (!s?.c || S.route.name !== 'inkwell') return;
  fitInk();
  if (s.sub === 'board') drawStrings();
  if (s.sub === 'desk') lensAfter();
  if (s.fly) { const nb = document.querySelector('.ink-nb .nb-card') || document.querySelector('[data-act=ink-seg][data-arg=nb]'); flyCard(s.fly.rect, nb, s.fly.text); sweep(s.fly.rect); s.fly = null; }
  if (s.kbd) document.querySelector('.pp-body .w.cur')?.scrollIntoView({ block: 'nearest' });
  if (s.focus) { document.querySelector(s.focus)?.focus({ preventScroll: true }); s.focus = null; }
  if (s.flash && Date.now() - (s.flash.t || 0) > 1600) s.flash = null;
}
function drawStrings(extra) {
  const svg = document.querySelector('.bd-strings'), cork = document.querySelector('.bd-cork'); if (!svg || !cork) return;
  const R = cork.getBoundingClientRect(), pin = (id) => { const e = cork.querySelector(`[data-pin="${CSS.escape(id)}"]`); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2 - R.left, r.top + r.height / 2 - R.top]; };
  svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
  const path = (p, q, sag = 26) => { const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 + sag; return `M${p[0]},${p[1]} Q${mx},${my} ${q[0]},${q[1]}`; };
  const cs = CS(), s = st(); let html = '';
  cs.links.forEach((l, i) => { const p = pin(l.a), q = pin(l.b); if (!p || !q) return; const fresh = s.flash?.kind === 'gold' && s.flash.ids?.includes(l.a) && s.flash.ids?.includes(l.b);
    html += `<path class="str gold${fresh ? ' fresh' : ''}" d="${path(p, q, 10)}"/><g class="str-badge" transform="translate(${(p[0] + q[0]) / 2},${(p[1] + q[1]) / 2 + 5})"><circle r="9"/><path d="M-4 0l3 3 5-6"/></g>`; });
  if (s.flash?.kind === 'slack' && s.flash.ids) { const p = pin(s.flash.ids[0]), q = pin(s.flash.ids[1]); if (p && q) html += `<path class="str slack" d="${path(p, q, 70)}"/>`; }
  if (s.pick.length === 1 && extra) { const p = pin(s.pick[0]); if (p) html += `<path class="str live" d="${path(p, [extra[0] - R.left, extra[1] - R.top], 18)}"/>`; }
  if (s.wheel) { const p = pin(s.wheel[0]), q = pin(s.wheel[1]); if (p && q) html += `<path class="str live" d="${path(p, q, 18)}"/>`; }
  svg.innerHTML = html;
}

/* ---------- actions ---------- */
function toChapter(n) {
  const c = C(), cs = CS(), s = st();
  if (n <= 2) { if (cs.reached < n) { const r = act({ type: 'chapter', n }); if (!r.ok) return say(r.say?.text); } else if (cs.chapter !== n && !cs.solved) act({ type: 'chapter', n }); s.sub = 'desk'; s.seg = 'doc';
    if (n === 2) { const t = tut('interview') || (c.aside || []).find((x) => /chapter 2/i.test(x.where))?.text; say(t || 'Pick someone from the suspects board and ask your questions.'); if (!s.who) { const first = people()[0]; if (first) { s.who = first.id; s.centre = 'interview'; } } }
    deskNudge(); return go(`#/inkwell/case/${c.id}/desk`); }
  const r = act({ type: 'chapter', n }); if (!r.ok) { sfx('wrong'); return say(r.say?.text), render(); }
  s.sub = { 3: 'board', 4: 'timeline', 5: 'accuse' }[n]; s.pick = []; s.wheel = null; s.say = null;
  if (n === 3) say(tut('link') || (c.boardIntro || [])[0]?.text || 'Two clues together can say more than each alone. Drag one clue card onto another.');
  if (n === 4) say(tut('timeline') || 'Put things in the order they happened. Which words say when?');
  if (n === 5) say(tut('accuse') || c.accusation?.question || 'Choose who did it, and pin your evidence.');
  deskNudge();
  go(`#/inkwell/case/${c.id}/${s.sub}`);
}
/* between chapters: the Training Desk is offered, never required */
function deskNudge() { const n = D.deskItems(C(), CS(), SE.englishLevelOf(kid())).filter((x) => !x.done).length; if (n && st().say && !st().say.hold) st().say.text += ` (Quill’s Training Desk has ${n} exercise${n === 1 ? '' : 's'} for you, whenever you like.)`; }
function markRange(docId, from, to, rect) {
  const s = st(), c = C(), r = act({ type: 'mark', doc: docId, from, to });
  s.anc = null; s.selDoc = docId;
  if (!r.ok) { if (r.say) say(r.say.text); return render(); }
  if (r.already) { say('That is already in your notebook.'); return render(); }
  sfx('tap'); s.fly = rect ? { rect, text: CS().marks.find((m) => m.id === r.mark)?.text || '' } : null; s.ret = null;
  if (c.id === 'case-00' && docId === '0.1' && (c.tutorial || []).some((t) => t.step === 'mark')) {
    if (r.clue && r.mark === 'creak') say(tut('mark-success') || 'That is a clue card. It lives in your notebook now.');
    else if (!r.clue) { s.miss01 = (s.miss01 || 0) + 1; const t = (c.tutorial || []).find((x) => x.step === (s.miss01 >= 2 ? 'mark-hint' : 'mark-miss')); if (t) say(t.quill); }
  } else if (!CS().tutSeen?.includes('mark-success') && CS().marks.length === 1) say(tut('mark-success') || 'That is a clue card. It lives in your notebook now. To take it back, press the little cross.');
  render();
}
function selRect() { const ws = [...document.querySelectorAll('.pp-body .w.sel')]; if (!ws.length) { const c = document.querySelector('.pp-body .w.cur'); return c ? c.getBoundingClientRect() : null; } const a = ws[0].getBoundingClientRect(), b = ws[ws.length - 1].getBoundingClientRect(); return { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), width: Math.max(40, Math.abs(b.right - a.left)), height: a.height }; }
function openDoc(id) {
  const s = st(), r = act({ type: 'open', doc: id }); if (!r.ok) { say(r.say?.text); return render(); }
  s.doc = id; s.centre = 'doc'; s.seg = 'doc'; s.anc = null; s.cur = 0; s.selDoc = id; if (s.hint && s.hint.doc !== id) s.hint = null;
  if (C().id === 'case-00') { if (id === '0.1' && !CS().marks.length) { const t = tut('mark'); if (t) say(t); } if (id === '0.3') { const t = tut('knack'); if (t) say(t); } }
  s.focus = '.pp-body'; render();
}
function tryLink(a, b, kind) {
  const s = st(), r = act({ type: 'link', a, b, kind }); s.wheel = null; s.pick = [];
  if (r.ok) { sfx('right'); s.flash = { kind: 'gold', ids: [a, b], t: Date.now() };
    if (r.proved) { const d = dedOf(r.proved); say(d.statement, { tone: 'gold' }); }
    else say(tut('link-gold') || 'Yes. The string goes gold when two clues truly belong together.', { tone: 'gold' });
    if (r.cleared === 3) { sfx('finish'); confetti(); say(`${dedOf(r.proved)?.statement || ''} The board holds. Next: the timeline.`, { tone: 'gold' }); }
  } else if (r.why === 'unsupported' || r.why === 'kind-wrong') { sfx('wrong'); s.flash = { kind: 'slack', ids: [a, b], t: Date.now() }; say(r.say?.text || tut('link-slack') || 'What do these two really say?', { hold: true }); }
  else say(r.say?.text);
  render();
}
function place(ev, at) {
  const s = st(), r = act({ type: 'place', event: ev, at }); s.tl.pick = null; s.tl.holding = false;
  if (!r.ok) return render();
  sfx('tap');
  if (r.shake) { sfx('wrong'); s.flash = { kind: 'shake', clash: r.shake, t: Date.now() }; say(tut('timeline-wrong') || r.say?.text, { hold: true }); }
  else if (r.cleared === 4 || CS().timeline.done) { sfx('finish'); say(r.say?.text || 'The line holds.', { tone: 'gold' }); const t = (C().timeline?.talk || []).find((l) => l.who !== 'QUILL'); if (t && !C().timeline?.feast) st().say.text += ` ${shortName(whoIs(C(), t.who)?.id || '')}: “${pt(t.text)}”`; }
  render();
}
function accuse() {
  const s = st(), c = C(), A = s.acc, slots = D.slotsOf(c).slots.length;
  if (!A.culprit) return say('Who? Choose someone first.'), render();
  if (A.ev.length < slots) return say(`Pin ${slots} pieces of evidence. A good detective never accuses empty-handed.`), render();
  if (c.accusation?.place && !A.place) return say(c.accusation.place.prompt), render();
  const r = act({ type: 'accuse', culprit: A.culprit, evidence: A.ev, place: A.place });
  if (!r.ok) return say(r.say?.text), render();
  if (r.verdict === 'solved') {
    sfx('finish'); confetti(); s.sub = 'reveal'; s.panel = 0; s.say = null; s.accWeak = [];
    s.closed = SE.closeCase(kid(), c, CS(), { now: Date.now() }); mark('stop', `Solved: ${c.title}`); save(); checkMedals();
    return go(`#/inkwell/case/${c.id}/reveal`);
  }
  sfx('wrong'); s.accWeak = r.weakPins || [];
  if (r.verdict === 'place') { A.place = null; say(r.say?.text, { hold: true }); return render(); }
  const back = r.returnTo; s.retPending = back || null;
  say(r.say?.text, { hold: true, then: back ? { label: 'Show me where', act: 'ret' } : null });
  render();
}
function speakDoc() {
  const s = st(), d = s.doc && docOf(s.doc); if (!d) return;
  const text = `${pt(d.title)}. ${D.tokens(C(), s.doc).map((t) => pt(t.t)).join(' ')}`;
  if (!canSpeak()) return say('This device has no voice to read with.'), render();
  say('Read in this device’s computer voice.', { tone: 'quiet' }); render();
  speak(text, { onEnd: () => { if (C()?.id === 'case-00') { const t = tut('magnifier'); if (t) { say(t); render(); } } } });
}

export const CASE_ACTIONS = {
  'ink-pnext': () => { const s = st(), n = panelsOf(C().cutscene || C().opening).length; if ((s.panel || 0) + 1 < n) { s.panel = (s.panel || 0) + 1; sfx('tap'); return render(); } CASE_ACTIONS['ink-pskip'](); },
  'ink-pprev': () => { const s = st(); s.panel = Math.max(0, (s.panel || 0) - 1); render(); },
  'ink-pskip': () => { const s = st(); s.panel = 0; if (!personaId()) { s.sub = 'persona'; return go(`#/inkwell/case/${C().id}/persona`); } toChapter(1); },
  'ink-rnext': () => { const s = st(), n = revealPanels().length; if ((s.panel || 0) + 1 < n) { s.panel = (s.panel || 0) + 1; sfx('tap'); return render(); } CASE_ACTIONS['ink-rskip'](); },
  'ink-rskip': () => { const s = st(); s.sub = 'solved'; s.panel = 0; go(`#/inkwell/case/${C().id}/solved`); },
  'ink-pick': (id) => { S.ink = S.ink || {}; S.ink.pick1 = id; S.ink.pname = null; sfx('tap'); render(); requestAnimationFrame(() => document.querySelector(`[data-act=ink-pick][data-arg="${id}"]`)?.focus({ preventScroll: true })); },
  'ink-say-p': () => { const p = personaById(S.ink?.pick1 || personaId()); if (p) speak(`${p.name}. ${p.signature} ${p.gift} Knack: ${p.knack.name}.`); },
  'ink-choose': () => {
    const k = kid(), s = S.ink, id = s.pick1 || personaId(); if (!id) return;
    const name = document.getElementById('ink-name')?.value ?? s.pname ?? '';
    if (!SE.renamePersona(k, name)) { say('That name will not do. Letters only, up to 12.', { hold: true }); return render(); }
    SE.choosePersona(k, id); s.pick1 = null; s.pname = null; if (s.c && s.cs && !s.cs.solved) { s.cs = { ...s.cs, persona: id }; SE.putCase(k, s.c, s.cs); } save(); sfx('unlock');
    if (s.coats || !s.c) { s.coats = false; return go('#/inkwell'); }
    const line = (C().tutorial || []).find((t) => t.step === 'choose-persona-confirm')?.quill || '{det}. Good. Now, about this case.';
    s.say = null; toChapter(1); say(line); render();
  },
  'ink-ch': (n) => { n = +n; const s = st(), cs = CS(); if (hold()) return; if (n <= cs.reached || D.canEnter(C(), cs, n).ok) return toChapter(n); sfx('wrong'); say(D.canEnter(C(), cs, n).why); render(); },
  'ink-seg': (id) => { const s = st(); if (id === 'board') { const cs = CS(); const n = cs.reached >= 5 ? 5 : cs.reached >= 4 ? 4 : 3; if (cs.reached >= 3 || D.canEnter(C(), cs, 3).ok) return toChapter(cs.chapter >= 3 ? cs.chapter : n); say('The board opens in chapter 3. Read and ask first.'); return render(); } s.seg = id; if (s.sub !== 'desk') { s.sub = 'desk'; return go(`#/inkwell/case/${C().id}/desk`); } render(); },
  'ink-open': (id) => { st().knackShow = null; openDoc(id); },
  'ink-who': (id) => { const s = st(); s.who = id; s.centre = 'interview'; s.seg = 'doc'; s.lastQ = null; s.expr = 'calm'; if (CS().chapter < 2) say((C().interviews || []).length ? 'Interviews come next. Finish reading the scene first.' : 'Nobody to ask yet.'); render(); },
  'ink-centre': (m) => { const s = st(); s.centre = m; render(); },
  'ink-ask': (q) => {
    const s = st(), r = act({ type: 'ask', q }); if (!r.ok) { say(r.say?.text); return render(); }
    s.lastQ = q; s.expr = r.expression || 'calm'; sfx('tap'); if (r.doc) { act({ type: 'open', doc: r.doc.id }); s.selDoc = r.doc.id; }
    if (C().id === 'case-00') { const t = tut('interview-faces'); if (t && CS().asked.length === 1) say(t); }
    render();
  },
  'ink-mark': () => { const s = st(); if (s.anc == null || !s.selDoc) return; markRange(s.selDoc, s.anc, s.cur, selRect()); },
  'ink-unsel': () => { st().anc = null; render(); },
  'ink-unmark': (id) => { act({ type: 'unmark', id }); sfx('tap'); render(); },
  'ink-goto': (id) => { const m = CS().marks.find((x) => x.id === id); if (!m) return; const s = st(); s.ret = m.span ? { doc: m.doc, spans: [m.span] } : null; openDoc(m.doc); },
  'ink-read': () => speakDoc(),
  'ink-lens': () => { const s = st(); s.lens = !s.lens; render(); },
  'ink-hint': () => {
    const s = st(), r = act({ type: 'hint' }); if (!r.ok) { say(r.say?.text); return render(); }
    say(r.say.text); const h = r.hint; if (h?.doc) { const line = D.tokens(C(), h.doc).find((t) => t.span === (h.span || D.hintFor(C(), CS())?.span))?.line; s.hint = { doc: h.doc, level: h.level, span: h.span, line }; if (s.sub === 'desk') { s.doc = h.doc; s.centre = 'doc'; s.seg = 'doc'; act({ type: 'open', doc: h.doc }); } }
    render();
  },
  'ink-knack': () => { const s = st(), r = act({ type: 'knack' }); if (!r.ok) { say(r.say?.text); return render(); } s.knackShow = r.knack; sfx('unlock'); render(); },
  'ink-knack-x': () => { st().knackShow = null; render(); },
  'ink-cont': () => { const s = st(), then = s.say?.then; s.say = null; s.flash = null;
    if (then?.act === 'ret' && s.retPending) { const b = s.retPending; s.retPending = null; s.ret = b; s.hint = null; toChapter(Math.min(2, CS().reached)); s.doc = b.doc; s.centre = 'doc'; s.seg = 'doc'; act({ type: 'open', doc: b.doc }); s.focus = '.pp-body'; return render(); }
    render(); },
  'ink-hush': () => { st().say = null; render(); },
  'ink-bpick': (id) => {
    const s = st(); if (hold()) return;
    if (s.pick.includes(id)) { s.pick = s.pick.filter((x) => x !== id); return render(); }
    s.pick = [...s.pick, id].slice(-2); sfx('tap');
    if (s.pick.length === 2) { s.wheel = s.pick.slice(); s.wheelI = 0; if (C().id === 'case-00') { const t = tut('link-wheel'); if (t) say(t); } s.focus = '.wh-opt'; }
    render();
  },
  'ink-link': (kind) => { const s = st(); if (!s.wheel) return; const [a, b] = s.wheel; tryLink(a, b, kind); },
  'ink-wheel-x': () => { const s = st(); s.wheel = null; s.pick = []; render(); },
  'ink-tpick': (id) => { const s = st(); if (hold() || CS().timeline.done) return; if (s.tl.pick === id) { s.tl.pick = null; s.tl.holding = false; return render(); } const at = tlModel().line.indexOf(id); if (s.tl.pick && at >= 0) return place(s.tl.pick, at); s.tl.pick = id; s.tl.holding = true; const M = tlModel(); s.tl.slot = Math.max(0, M.line.indexOf(null)); sfx('tap'); render(); },
  'ink-tslot': (at) => { const s = st(); if (!s.tl.pick) { say('Pick up a postcard first, then choose its peg.'); return render(); } place(s.tl.pick, +at); },
  'ink-feast': (arg) => { const [i, j] = arg.split(':').map(Number), it = C().timeline.feast.items[i], r = act({ type: 'feast', i, answer: it.options[j] }); if (!r.ok) return; if (r.right) { sfx('right'); say(r.explain, { tone: 'gold' }); } else { sfx('wrong'); say(r.explain, { hold: true }); } render(); },
  'ink-culprit': (id) => { const s = st(); if (hold()) return; s.acc.culprit = s.acc.culprit === id ? null : id; sfx('tap'); render(); },
  'ink-ev': (id) => { const s = st(), A = s.acc, slots = D.slotsOf(C()).slots.length; if (hold()) return; if (A.ev.includes(id)) A.ev = A.ev.filter((x) => x !== id); else if (A.ev.length < slots) A.ev = [...A.ev, id]; else { say(`Three pins at most. Take one off first.`.replace('Three', String(slots))); } sfx('tap'); render(); },
  'ink-place': (o) => { const s = st(); s.acc.place = s.acc.place === o ? null : o; render(); },
  'ink-accuse': () => accuse(),
  'ink-epi': () => { const s = st(); s.epi = !s.epi; render(); },
  'ink-origin': (ans) => { const s = st(), r = act({ type: 'origin', answer: ans }); if (!r.ok) return; if (r.right) { sfx('right'); say(r.explain || 'Yes.', { tone: 'gold' }); } else { sfx('wrong'); say(r.explain, { hold: true }); } render(); },
};

/* ---------- keys ---------- */
export function caseKey(e) {
  const s = st(); if (!s?.c) return false;
  const k = e.key, onBtn = /^(BUTTON|A)$/.test(e.target.tagName);
  if (s.say?.hold) { if (k === 'Enter' || k === ' ' || k === 'Escape') { CASE_ACTIONS['ink-cont'](); return true; } return false; }
  if (s.sub === 'opening' || s.sub === 'reveal') {
    const nx = s.sub === 'opening' ? 'ink-pnext' : 'ink-rnext';
    if ((k === 'ArrowRight' || ((k === 'Enter' || k === ' ') && !onBtn))) { CASE_ACTIONS[nx](); return true; }
    if (k === 'ArrowLeft') { CASE_ACTIONS['ink-pprev'](); return true; }
    if (k === 'Escape' || k === 's' || k === 'S') { CASE_ACTIONS[s.sub === 'opening' ? 'ink-pskip' : 'ink-rskip'](); return true; }
    return false;
  }
  if (s.sub === 'persona') {
    const cards = [...document.querySelectorAll('.pcard-d')], i = cards.indexOf(document.activeElement); if (!cards.length) return false;
    const cols = matchMedia('(max-width: 720px)').matches ? 2 : 3, mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[k];
    if (mv != null) { const j = i < 0 ? 0 : Math.max(0, Math.min(cards.length - 1, i + mv)); cards[j].focus(); return true; }
    if (k === 'Enter' && document.activeElement?.id !== 'ink-name' && document.querySelector('[data-act=ink-choose]') && i < 0 && !onBtn) { CASE_ACTIONS['ink-choose'](); return true; }
    return false;
  }
  if (s.wheel) {
    const n = D.DTYPES.length;
    if (/^[1-8]$/.test(k)) { CASE_ACTIONS['ink-link'](D.DTYPES[+k - 1]); return true; }
    if (k === 'ArrowRight' || k === 'ArrowDown') { s.wheelI = ((s.wheelI || 0) + 1) % n; render(); requestAnimationFrame(() => document.querySelectorAll('.wh-opt')[s.wheelI]?.focus()); return true; }
    if (k === 'ArrowLeft' || k === 'ArrowUp') { s.wheelI = ((s.wheelI || 0) - 1 + n) % n; render(); requestAnimationFrame(() => document.querySelectorAll('.wh-opt')[s.wheelI]?.focus()); return true; }
    if ((k === 'Enter' || k === ' ') && !onBtn) { CASE_ACTIONS['ink-link'](D.DTYPES[s.wheelI || 0]); return true; }
    if (k === 'Escape') { CASE_ACTIONS['ink-wheel-x'](); return true; }
    return false;
  }
  if (s.knackShow && k === 'Escape') { CASE_ACTIONS['ink-knack-x'](); return true; }
  const lower = k.length === 1 ? k.toLowerCase() : k;
  if (!e.shiftKey && s.sub !== 'solved') {
    if (lower === 'b') { CASE_ACTIONS['ink-ch'](3); return true; }
    if (lower === 't') { CASE_ACTIONS['ink-ch'](4); return true; }
    if (lower === 'a') { CASE_ACTIONS['ink-ch'](5); return true; }
    if (lower === 'k') { CASE_ACTIONS['ink-knack'](); return true; }
    if (lower === 'h') { CASE_ACTIONS['ink-hint'](); return true; }
    if (lower === 'r' && s.sub === 'desk') { speakDoc(); return true; }
    if (lower === 'l' && s.sub === 'desk') { CASE_ACTIONS['ink-lens'](); return true; }
  }
  if (s.sub === 'desk') return deskKey(e, onBtn);
  if (s.sub === 'board') return boardKey(e, onBtn);
  if (s.sub === 'timeline') return tlKey(e, onBtn);
  if (s.sub === 'accuse') { const ids = D.accusable(C(), CS()); if (/^[1-9]$/.test(k) && ids[+k - 1]) { CASE_ACTIONS['ink-culprit'](ids[+k - 1]); return true; } }
  if (s.sub === 'solved' && /^[1-4]$/.test(k)) { const b = document.querySelectorAll('.oc-q button')[+k - 1]; if (b) { b.click(); return true; } }
  return false;
}
function deskKey(e, onBtn) {
  const s = st(), k = e.key;
  if (s.lens && /^Arrow/.test(k)) { moveLens(k); return true; }
  if (s.lens && k === 'Escape') { s.lens = false; render(); return true; }
  if (s.centre === 'interview' && /^[1-9]$/.test(k)) { const qs = D.questions(C(), CS()).filter((q) => q.suspect === s.who && (q.open || q.asked)); if (qs[+k - 1]) { CASE_ACTIONS['ink-ask'](qs[+k - 1].id); return true; } }
  const docId = s.centre === 'interview' ? (s.lastQ && D.prepare(C()).qById.get(s.lastQ)?.answerDoc) : s.doc; if (!docId) return false;
  const inBody = e.target.closest?.('.pp-body') || e.target === document.body || e.target.id === 'main';
  if (!inBody && onBtn) return false;
  const T = D.tokens(C(), docId); if (!T.length) return false;
  if (s.selDoc !== docId) { s.selDoc = docId; s.cur = 0; s.anc = null; }
  const mv = (i) => { const j = Math.max(0, Math.min(T.length - 1, i)); if (e.shiftKey) { if (s.anc == null) s.anc = s.cur; } else s.anc = null; s.cur = j; s.kbd = true; if (e.shiftKey && s.anc == null) s.anc = j; render(); return true; };
  if (k === 'ArrowRight') return mv(s.cur + 1);
  if (k === 'ArrowLeft') return mv(s.cur - 1);
  if (k === 'ArrowDown' || k === 'ArrowUp') { const line = T[s.cur].line + (k === 'ArrowDown' ? 1 : -1), same = T.filter((t) => t.line === line); if (!same.length) return true; const col = s.cur - T.findIndex((t) => t.line === T[s.cur].line); return mv(same[Math.min(col, same.length - 1)].i); }
  if (k === 'Enter' || k === ' ' || k === 'm' || k === 'M') { if (onBtn && !inBody) return false; const from = s.anc ?? s.cur; s.kbd = true; s.anc = from; markRange(docId, from, s.cur, selRect()); s.focus = '.pp-body'; return true; }
  if (k === 'Escape') { if (s.anc != null) { s.anc = null; render(); return true; } return false; }
  return false;
}
function boardKey(e, onBtn) {
  const s = st(), k = e.key, cards = [...document.querySelectorAll('.bd-card')]; if (!cards.length) return false;
  const i = cards.indexOf(document.activeElement);
  if (/^Arrow/.test(k)) { const cols = Math.max(1, Math.round(document.querySelector('.bd-cards').getBoundingClientRect().width / Math.max(1, cards[0].getBoundingClientRect().width + 8))); const mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[k]; cards[Math.max(0, Math.min(cards.length - 1, (i < 0 ? 0 : i + mv)))].focus(); return true; }
  if (k === 'Escape' && s.pick.length) { s.pick = []; render(); return true; }
  return false;   // Space / Enter on a focused card is the card's own click
}
function tlKey(e, onBtn) {
  const s = st(), k = e.key, M = tlModel(); if (M.done) return false;
  if (s.tl.holding) {
    const empties = M.line.map((x, j) => (x == null ? j : -1)).filter((j) => j >= 0), all = M.line.map((_, j) => j);
    if (k === 'ArrowRight' || k === 'ArrowLeft') { const d = k === 'ArrowRight' ? 1 : -1, list = all; const p = list.indexOf(s.tl.slot); s.tl.slot = list[(p + d + list.length) % list.length]; render(); return true; }
    if (k === ' ' || k === 'Enter') { place(s.tl.pick, s.tl.slot); requestAnimationFrame(() => document.querySelector('.tl-pile .tl-card, .tl-card')?.focus()); return true; }
    if (k === 'Escape') { s.tl.pick = null; s.tl.holding = false; render(); return true; }
    if (k === 'Backspace' || k === 'Delete') { act({ type: 'unplace', event: s.tl.pick }); s.tl.pick = null; s.tl.holding = false; render(); return true; }
    void empties; return false;
  }
  return false;   // focus moves by Tab; Space / Enter on a postcard picks it up (its own click)
}

/* ---------- pointer: press-and-hold to mark; drag to link; drag to peg ---------- */
let P0 = null;
export function casePointerDown(e) {
  const s = st(); if (!s?.c || S.route.name !== 'inkwell' || e.button > 0) return;
  const w = e.target.closest?.('.pp-body .w');
  if (w) { const body = w.closest('.pp-body'), docId = body.dataset.body, i = +w.dataset.i;
    P0 = { kind: 'word', doc: docId, i, x: e.clientX, y: e.clientY, holding: false, timer: setTimeout(() => { if (!P0 || P0.kind !== 'word') return; P0.holding = true; s.selDoc = docId; s.anc = i; s.cur = i; paintSel(); navigator.vibrate?.(8); }, 380) }; return; }
  const card = e.target.closest?.('.bd-card'); if (card && s.sub === 'board' && !s.wheel) { P0 = { kind: 'card', id: card.dataset.card, x: e.clientX, y: e.clientY, moved: false }; return; }
  const tc = e.target.closest?.('.tl-card[data-ev]'); if (tc && s.sub === 'timeline') { P0 = { kind: 'peg', id: tc.dataset.ev, x: e.clientX, y: e.clientY, moved: false, ghost: null }; return; }
  const lens = e.target.closest?.('.ink-lens'); if (lens) { P0 = { kind: 'lens', x: e.clientX, y: e.clientY }; lens.setPointerCapture?.(e.pointerId); }
}
export function casePointerMove(e) {
  if (!P0) return; const s = st(); const dist = Math.hypot(e.clientX - P0.x, e.clientY - P0.y);
  if (P0.kind === 'word') {
    if (!P0.holding) { if (dist > 10) { clearTimeout(P0.timer); P0 = null; } return; }
    e.preventDefault(); const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pp-body .w'); if (el && el.closest('.pp-body').dataset.body === P0.doc) { s.cur = +el.dataset.i; paintSel(); } return;
  }
  if (P0.kind === 'card') { if (dist > 8) { P0.moved = true; if (!s.pick.includes(P0.id)) { s.pick = [P0.id]; document.querySelector(`.bd-card[data-card="${CSS.escape(P0.id)}"]`)?.classList.add('on'); } drawStrings([e.clientX, e.clientY]); } return; }
  if (P0.kind === 'peg') { if (dist > 8) { P0.moved = true; if (!P0.ghost) { const src = document.querySelector(`.tl-card[data-ev="${CSS.escape(P0.id)}"]`); P0.ghost = src.cloneNode(true); P0.ghost.classList.add('tl-ghost'); document.body.appendChild(P0.ghost); src.classList.add('lifted'); } Object.assign(P0.ghost.style, { left: `${e.clientX - 60}px`, top: `${e.clientY - 30}px` }); } return; }
  if (P0.kind === 'lens') { placeLens(e.clientX, e.clientY); }
}
export function casePointerUp(e) {
  if (!P0) return; const s = st(), p = P0; P0 = null;
  if (p.kind === 'word') {
    clearTimeout(p.timer);
    if (p.holding) { e.preventDefault(); const rect = selRect(); markRange(p.doc, s.anc, s.cur, rect); p.swallow = true; swallowClick(); return; }
    // a tap: the first tap sets where the phrase starts; a second tap in the same document says where it ends
    if (s.anc != null && s.selDoc === p.doc) { s.cur = p.i; } else { s.selDoc = p.doc; s.anc = p.i; s.cur = p.i; }
    s.kbd = false; render(); return;
  }
  if (p.kind === 'card') { if (!p.moved) return; swallowClick(); const t = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.bd-card'); if (t && t.dataset.card !== p.id) { s.pick = [p.id, t.dataset.card]; s.wheel = s.pick.slice(); s.wheelI = 0; s.focus = '.wh-opt'; if (C().id === 'case-00') { const x = tut('link-wheel'); if (x) say(x); } render(); } else { s.pick = []; drawStrings(); render(); } return; }
  if (p.kind === 'peg') { p.ghost?.remove(); if (!p.moved) return; swallowClick(); const t = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.tl-peg[data-at]'); if (t) place(p.id, +t.dataset.at); else if (document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.tl-pile')) { act({ type: 'unplace', event: p.id }); render(); } else render(); }
}
function swallowClick() { const f = (ev) => { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click', f, { capture: true, once: true }); setTimeout(() => document.removeEventListener('click', f, { capture: true }), 0); }
function paintSel() { const s = st(), a = Math.min(s.anc, s.cur), b = Math.max(s.anc, s.cur); document.querySelectorAll(`.pp-body[data-body="${CSS.escape(s.selDoc)}"] .w`).forEach((w) => w.classList.toggle('sel', +w.dataset.i >= a && +w.dataset.i <= b)); }

/* ---------- the magnifier: a lens over the paper, the text under it ×1.6 ---------- */
let lensAt = null;
function placeLens(x, y) {
  const lens = document.querySelector('.ink-lens'), body = document.querySelector('.ink-centre .pp-body'); if (!lens || !body) return;
  const B = body.getBoundingClientRect(); x = Math.max(B.left, Math.min(B.right, x)); y = Math.max(B.top, Math.min(B.bottom, y)); lensAt = [x, y];
  const R = 70; Object.assign(lens.style, { left: `${x - R}px`, top: `${y - R}px` });
  const inner = lens.querySelector('.ink-lens-in'); if (!inner.firstChild) { const cl = body.cloneNode(true); cl.removeAttribute('tabindex'); cl.querySelectorAll('[data-i]').forEach((w) => w.removeAttribute('data-i')); Object.assign(cl.style, { width: `${B.width}px`, margin: 0 }); inner.appendChild(cl); }
  const Z = 1.6; inner.style.transform = `translate(${R - (x - B.left) * Z}px, ${R - (y - B.top + body.scrollTop) * Z}px) scale(${Z})`;
}
function moveLens(k) { const B = document.querySelector('.ink-centre .pp-body')?.getBoundingClientRect(); if (!B) return; const [x, y] = lensAt || [B.left + B.width / 2, B.top + 60]; const d = 24; placeLens(x + (k === 'ArrowRight' ? d : k === 'ArrowLeft' ? -d : 0), y + (k === 'ArrowDown' ? d : k === 'ArrowUp' ? -d : 0)); }
export function lensAfter() { if (st()?.lens) { const B = document.querySelector('.ink-centre .pp-body')?.getBoundingClientRect(); if (B) placeLens(...(lensAt || [B.left + B.width / 2, B.top + 60])); } }
