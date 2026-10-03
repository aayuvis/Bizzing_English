/* desk.js — the writing desk (SPEC §6.3): the paragraph, the retelling, the description, the letter, the
   persuasion, the essay, the piece after a model. The child writes in parts (a scaffold), ticks a
   checklist they judge themselves, and sees COUNTS — sentences, words, how many ways the sentences open,
   words from their own word bank — labelled as counts, never as a mark. A grown-up's rubric behind the
   PIN judges quality; that is the only door to "learned" for a piece of writing (mastery.judge).

   What the child writes stays on this device: kept in k.writing, which no backup carries, never sent,
   never analysed anywhere else. A draft saves as they type, so nothing is lost. */

import { S, kid, save, render, pay, checkMedals, mark, isDark } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot } from '../ui.js';
import { stopById, strand, level } from '../curriculum.js';
import { counts } from '../writing.js';
import { taught } from '../mastery.js';
import { bumpDay } from '../model.js';
import { sfx } from '../sound.js';
import { PASSAGES } from '../data/library.js';
import { shippable, work } from '../reading.js';
import { storyArt } from './stories.js';

const W = (k) => (k.writing ||= {});
const draftOf = (k, id) => (W(k).drafts ||= {})[id];
export function openDesk(id) {
  const k = kid(), st = stopById(id);
  if (!st?.desk) { S.run = { mode: 'desk', error: true }; return; }
  let d = draftOf(k, id);
  if (!d) {
    const heard = PASSAGES.filter((p) => shippable(p) && k.reading[p.id]?.heard && p.kind !== 'verse');
    const pool = (st.desk.story || st.desk.picture) ? (heard.length ? heard : PASSAGES.filter((p) => shippable(p) && p.band <= k.band && p.kind !== 'verse')) : [];
    const n = (W(k)[id] || []).length;
    d = W(k).drafts[id] = { prompt: st.desk.prompts ? st.desk.prompts[n % st.desk.prompts.length] : null, story: pool.length ? pool[n % pool.length].id : null, parts: st.desk.parts.map(() => ''), ticks: [], at: Date.now() };
    save();
  }
  S.run = { mode: 'desk', id, st };
}

export function deskView() {
  const r = S.run, k = kid();
  if (!r || r.error) return empty('oops', 'That writing desk is not here.', link('The Atlas', '#/atlas/writing'));
  const st = r.st, d = draftOf(k, r.id), lv = level('writing', st.level);
  const all = d.parts.join('\n\n'), c = counts(all, k.bank);
  const p = d.story && PASSAGES.find((x) => x.id === d.story);
  const brief = st.desk.picture && p
    ? `<div class="sp-stage" style="background-image:url('${storyArt(p.id)}');aspect-ratio:16/8"></div><p class="note" style="margin:0">A painting for “${esc(p.title)}”. Describe what you see — and what you would hear, smell and feel if you stepped inside.</p>`
    : st.desk.story && p ? `<div class="row"><img src="${storyArt(p.id)}" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:10px"><div><b>Retell: ${esc(p.title)}</b><br><small class="muted">${esc(work(p.work).title)} · <a href="#/story/${p.id}">hear it again</a></small></div></div>`
      : d.prompt ? `<p class="prompt" style="margin:0">${esc(d.prompt)}</p>` : '';
  const other = st.desk.prompts ? btn('A different one', 'desk-other', { cls: 'ghost small', ic: 'undo' }) : (st.desk.story || st.desk.picture) ? btn('A different story', 'desk-other', { cls: 'ghost small', ic: 'undo' }) : '';
  const parts = st.desk.parts.map(([label, hint], i) => `<label class="deskpart"><span><b>${esc(label)}</b><small>${esc(hint)}</small></span>
    <textarea class="field" rows="${st.desk.parts.length <= 2 ? 8 : 3}" data-act="desk-type" data-arg="${i}" spellcheck="true" aria-label="${esc(label)}">${esc(d.parts[i])}</textarea></label>`).join('');
  const ticks = st.desk.check.map((x, i) => `<button class="opt" data-act="desk-tick" data-arg="${i}" aria-pressed="${d.ticks.includes(i)}">${icon(d.ticks.includes(i) ? 'check' : 'star')}<span>${esc(x)}</span></button>`).join('');
  const done = (W(k)[r.id] || []).length;
  return pageHead({ title: st.title, sub: `Writing · level ${st.level} · ${lv.title}`, back: { label: 'Writing', href: '#/atlas/writing' } }) + `<div class="desk">
    <div class="card pin stack"><span class="kick">${esc(st.iCan)}</span>${brief}<div class="row">${other}${btn('How it works', 'desk-learn', { cls: 'ghost small', ic: 'lamp' })}</div>
      ${r.learn ? `<div class="note" style="font-size:15px">${esc(st.learn.why)}<ul class="examples">${st.learn.example.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}</div>
    <div class="deskgrid"><div class="card stack">${parts}<p class="note" style="margin:0">${icon('shield')} What you write stays on this device. It is saved as you type, never sent anywhere, and never marked by the app.</p></div>
      <aside class="stack"><div class="card"><span class="kick">Counts — not marks</span><div class="stats" style="margin-top:8px">
        <div class="stat"><b>${c.sentences}</b><small>sentences</small></div><div class="stat"><b>${c.words}</b><small>words</small></div>
        <div class="stat"><b>${c.avg}</b><small>words a sentence</small></div><div class="stat"><b>${c.openers}</b><small>different openings</small></div></div>
        ${c.bankUsed.length ? `<p class="note">Words from your word bank: ${c.bankUsed.map((w) => `<b>${esc(w)}</b>`).join(', ')}</p>` : '<p class="note">Try using a word from your word bank.</p>'}</div>
      <div class="card stack"><span class="kick">You check it</span>${ticks}</div>
      <div class="card stack">${btn(c.sentences >= st.desk.min ? 'Finish this piece' : `Write at least ${st.desk.min} sentences`, 'desk-finish', { ic: 'check', dis: c.sentences < st.desk.min })}
        <p class="note" style="margin:0">${done ? `You have finished ${done} piece${done > 1 ? 's' : ''} here.` : 'When you finish, a grown-up can read it and give their judgement.'}</p></div></aside></div></div>`;
}

let saveTimer = 0;
export function deskInput(t) {
  const k = kid(), r = S.run, d = draftOf(k, r.id); d.parts[+t.dataset.arg] = t.value.slice(0, 6000); d.at = Date.now();
  clearTimeout(saveTimer); saveTimer = setTimeout(() => { save(); const c = counts(d.parts.join('\n\n'), k.bank);
    const stats = document.querySelectorAll('.desk .stat b'); [c.sentences, c.words, c.avg, c.openers].forEach((v, i) => { if (stats[i]) stats[i].textContent = v; });
    const fin = document.querySelector('[data-act=desk-finish]'); if (fin) { const ok = c.sentences >= r.st.desk.min; fin.disabled = !ok; fin.querySelector('span').textContent = ok ? 'Finish this piece' : `Write at least ${r.st.desk.min} sentences`; } }, 350);
}

export const DESK_ACTIONS = {
  'desk-tick': (a) => { const d = draftOf(kid(), S.run.id), i = +a; d.ticks = d.ticks.includes(i) ? d.ticks.filter((x) => x !== i) : [...d.ticks, i]; save(); render(); },
  'desk-learn': () => { S.run.learn = !S.run.learn; render(); },
  'desk-other': () => { const k = kid(), id = S.run.id; const d = draftOf(k, id); if (d.parts.some((x) => x.trim()) && !confirm('Start a new piece? This draft will be cleared.')) return; delete W(k).drafts[id]; W(k)[id] = W(k)[id] || []; W(k).skip = (W(k).skip || 0) + 1;
    const st = S.run.st, n = (W(k)[id].length + W(k).skip); openDesk(id); const nd = draftOf(k, id);
    if (st.desk.prompts) nd.prompt = st.desk.prompts[n % st.desk.prompts.length]; else { const pool = PASSAGES.filter((p) => shippable(p) && p.kind !== 'verse' && p.band <= k.band); nd.story = pool[n % pool.length]?.id || nd.story; }
    save(); render(); },
  'desk-finish': () => {
    const k = kid(), r = S.run, d = draftOf(k, r.id), st = r.st, text = d.parts.join('\n\n');
    if (counts(text, k.bank).sentences < st.desk.min) return;
    (W(k)[r.id] ||= []).push({ at: Date.now(), prompt: d.prompt, story: d.story, parts: d.parts, ticks: d.ticks });
    delete W(k).drafts[r.id];
    const rec = (k.stops[r.id] ||= { passed: false, tries: 0 }); rec.tries++; rec.at = Date.now();
    if (!rec.passed) { rec.passed = true; taught(k, r.id, Date.now(), { judged: true }); pay('stop'); mark('stop', `Wrote: ${st.title}`); }
    bumpDay(k, 'stops'); k.last = { what: 'write', title: st.title, at: Date.now() };
    sfx('finish'); save(); S.run.finished = true; checkMedals(); location.hash = `#/desk/${r.id}/done`;
  },
};

export function deskDoneView(id) {
  const k = kid(), st = stopById(id), pieces = W(k)[id] || [], last = pieces.at(-1);
  if (!st || !last) return empty('oops', 'Nothing finished here yet.', link('The Atlas', '#/atlas/writing'));
  return pageHead({ title: st.title, sub: 'finished', back: { label: 'Writing', href: '#/atlas/writing' } }) + `<div class="reader"><div class="card finish stack pop"><img src="${mascot('cheer')}" alt=""><h2>Finished</h2>
    <p style="margin:0">A grown-up can read it on the grown-ups’ page and give their judgement. It stays on this device.</p>
    <div class="card passage" style="text-align:left;background:var(--bz-chip)">${last.parts.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
    <div class="row" style="justify-content:center">${link('Continue', '#/continue', { ic: 'next' })}${link('Write another', `#/desk/${id}`, { cls: 'out', ic: 'pen' })}</div></div></div>`;
}
