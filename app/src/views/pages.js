/* pages.js — the ☰ pages and the sheets: My page, Medals, Shop, Collection, Settings (the family's
   one layout, §5), Grown-ups (PIN, report card), Practice (the mistakes deck and spaced checks), the
   reading log, Help, Privacy, Search, the coin history and the child switcher. */

import { S, kid, save, render, go, toast, pay, isDark, setDevice, applyDevice, confetti } from '../app.js';
import { esc, icon, btn, link, pageHead, empty, mascot, sheet, plural } from '../ui.js';
import { AVATARS, PACK_NAMES, byId, STARTERS } from '../data/avatars.js';
import { stateOf, buy, buyWorld, worldOpen, TIERS, WORLD_PRICE } from '../integration/bizzing-avatars.js';
import { balance, ledger } from '../family.js';
import { MEDALS } from '../medals.js';
import { WORLDS, plate } from '../worlds.js';
import { STRANDS, strand, BANDS, stopById } from '../curriculum.js';
import { stopsOf } from '../next.js';
import { levelDone, goodDays, newKid, addKid, removeKid, they, headline, today } from '../model.js';
import { due, learnedCount, masteredCount, STEP } from '../mastery.js';
import { isUnlocked, tryPin, setPin, lock } from '../pin.js';
import { makeBackup, restoreBackup } from '../backup.js';
import { KEYS, eraseHousehold, isDemo } from '../store.js';
import { WORKS, PASSAGES } from '../data/library.js';
import { readingStop } from '../reading.js';
import { search as lexSearch, loadLexicon } from '../lexicon.js';
import { sfx } from '../sound.js';

const ctx = (k) => ({ owned: k.owned, worlds: k.worlds, plan: S.h.parent.plan, milestones: k.milestones, who: k.name });
const avImg = (id) => byId(id)?.art || 'avatars/tortoise.webp';
export const avatarOf = (k) => avImg(k?.avatar);

/* ---------- My page ---------- */
export function meView() {
  const k = kid();
  const rows = STRANDS.map((s) => { const st = stopsOf(s.id), d = st.filter((x) => k.stops[x.id]?.passed).length; const top = s.levels.filter((l) => levelDone(k, s.id, l.n)).length;
    return `<div class="stoprow"><span class="st" style="background:${s.colour};border-color:${s.colour};color:#fff">${icon(s.icon)}</span><span><b>${esc(s.title)}</b><small>${top} of 10 levels finished · ${d} of ${st.length} stops</small></span><span></span></div>`; }).join('');
  return pageHead({ title: 'My page', sub: 'your level, your week and your medals', back: { label: 'Home', href: '#/home' } }) + `<div class="grid2">
    <div class="card pin stack"><div class="row"><img src="${avatarOf(k)}" alt="" style="width:84px;height:84px"><div><h2 style="margin:0">${esc(k.name)}</h2><p class="muted" style="margin:0">${esc(headline(k))}</p></div></div>
      <div class="stats"><div class="stat"><b>${goodDays(k, 7)}</b><small>good days in the last 7</small></div><div class="stat"><b>${learnedCount(k)}</b><small>things learned (proved on a later day)</small></div><div class="stat"><b>${Object.keys(k.bank).length}</b><small>words in your bank</small></div><div class="stat"><b>${Object.keys(k.medals).length}</b><small>medals</small></div></div>
      <div class="row">${link('Medals', '#/medals', { cls: 'out', ic: 'medal' })}${link('Collection', '#/collection', { cls: 'out', ic: 'star' })}${link('Reading log', '#/log', { cls: 'out', ic: 'book' })}</div></div>
    <div class="card"><h3>The seven strands</h3><div class="stoplist">${rows}</div></div></div>`;
}

export function medalsView() {
  const k = kid();
  return pageHead({ title: 'Medals', sub: 'what you have done, and what is next', back: { label: 'My page', href: '#/me' } }) + `<div class="medals">${MEDALS.map((m) => `<div class="card medal${k.medals[m.id] ? '' : ' no'}"><img src="art/${m.art}.webp" alt=""><h3 style="font-size:15.5px">${esc(m.name)}</h3><p class="note" style="margin:0">${esc(m.how)}</p>${k.medals[m.id] ? `<span class="tag ok" style="margin-top:6px">${icon('check')}Earned</span>` : ''}</div>`).join('')}</div>`;
}

/* ---------- Collection and Shop ---------- */
function avCard(a, k, buyable) {
  const st = stateOf(a, ctx(k)), cur = k.avatar === a.id;
  return `<figure class="bz-av${cur ? ' cur' : ''}" data-tier="${a.tier}" data-state="${st.state}"><button data-act="${st.state === 'owned' ? 'wear' : buyable && st.state === 'buy' && !st.short ? 'buy-av' : 'noop'}" data-arg="${a.id}" aria-label="${esc(a.name)}, ${esc(st.label)}: ${esc(st.say)}">
    <img src="${a.art}" alt="" loading="lazy"><figcaption>${esc(a.name)} <b>${st.label}</b><small>${esc(cur ? 'Wearing' : st.say)}</small></figcaption></button></figure>`;
}
export function collectionView() {
  const k = kid();
  return pageHead({ title: 'Collection', sub: '96 avatars, 12 packs', back: { label: 'My page', href: '#/me' }, actions: [{ icon: 'bag', label: 'Shop', href: '#/shop' }] })
    + PACK_NAMES.map((n, i) => `<section class="card" style="margin-bottom:13px"><h3>${esc(n)} <small class="muted" style="font:600 13px var(--bz-body)">${esc(WORLDS[Math.ceil((i + 1) / 2) - 1].name)}</small></h3>
      <div class="avgrid">${AVATARS.filter((a) => a.pack === i + 1).map((a) => avCard(a, k, true)).join('')}</div></section>`).join('');
}
export function shopView(tab = 'avatars') {
  const k = kid(), bal = balance(k.name);
  const nav = [['avatars', 'Avatars', 'star'], ['worlds', 'Worlds', 'globe'], ['extras', 'Extras', 'bag']].map(([id, label, ic]) => ({ label, icon: ic, href: `#/shop/${id}`, active: id === tab }));
  const head = pageHead({ title: 'Shop', sub: 'fixed prices, nothing random', back: { label: 'Home', href: '#/home' }, nav, strip: { chip: `${bal} coins`, pct: Math.min(100, (bal / 500) * 100), label: 'coins come from learning, in every Bizzing app' } });
  let body = '';
  if (tab === 'worlds') body = `<div class="grid3">${WORLDS.map((w) => { const open = worldOpen(w.n, ctx(k));
    return `<div class="card" style="padding:0;overflow:hidden"><img src="${plate(w, isDark(), true)}" alt="" style="width:100%;height:120px;object-fit:cover;display:block${open ? '' : ';filter:grayscale(.6)'}"><div style="padding:12px 14px"><h3>${esc(w.name)}</h3><p class="muted" style="margin:0 0 8px">${esc(w.what)}</p>
      ${open ? (k.world === w.n ? `<span class="tag ok">${icon('check')}You are here</span>` : btn('Go there', 'wear-world', { arg: w.n, cls: 'out small', ic: 'map' })) : `${btn(`${WORLD_PRICE} coins`, 'buy-world', { arg: w.n, cls: 'small', ic: 'coin', dis: bal < WORLD_PRICE })}<p class="note">${bal < WORLD_PRICE ? `${WORLD_PRICE - bal} more to go — or it opens with the family plan.` : 'Or it opens with the family plan.'}</p>`}</div></div>`; }).join('')}</div>`;
  else if (tab === 'extras') body = empty('sleep', 'Extras — bookplates, reading lamps and stage curtains — arrive with the next update. Avatars and worlds are here now.', link('Avatars', '#/shop/avatars', { ic: 'star' }));
  else body = `<p class="note" style="margin:0 20px 10px">Commons are free for everyone. Rares cost 120, Epics 250, Legendaries 500 — and a Legendary first needs its learning milestone.</p>`
    + PACK_NAMES.map((n, i) => { const w = Math.ceil((i + 1) / 2); return `<section class="card" style="margin-bottom:13px"><h3>${esc(n)}</h3><div class="avgrid">${AVATARS.filter((a) => a.pack === i + 1).map((a) => avCard(a, k, true)).join('')}</div></section>`; }).join('');
  const L = ledger(k.name).slice(-30).reverse();
  return head + body + `<section class="card" style="margin-top:13px"><h3>Your coin history</h3>${historyList(L)}</section>`;
}
const APPNAME = { english: 'English', bee: 'Bee', maths: 'Maths', geography: 'Geography', india: 'India', finance: 'Finance' };
const WHY = { answer: 'a right answer', stop: 'a stop finished', contest: 'a contest', mastery: 'something proved on a later day', migrated: 'coins brought over' };
function historyList(L) {
  if (!L.length) return '<p class="muted">No coins yet. Every right answer in a check earns one.</p>';
  return `<ul class="ledger">${L.map((x) => `<li><span>${esc(x.n > 0 ? WHY[x.why] || x.why : x.why.startsWith('avatar:') ? 'avatar: ' + (byId(x.why.slice(7))?.name || x.why.slice(7)) : x.why.startsWith('world:') ? 'world ' + x.why.slice(6) : x.why)} · ${esc(APPNAME[x.a] || x.a)}</span><b class="${x.n > 0 ? 'plus' : 'minus'}">${x.n > 0 ? '+' : ''}${x.n}</b></li>`).join('')}</ul>`;
}

/* ---------- Practice: spaced checks and the mistakes deck ---------- */
export function practiceView() {
  const k = kid(), d = due(k);
  const miss = [...new Set(k.misses.slice(-40).map((m) => m.stop))].filter((id) => stopById(id) || readingStop(id)).slice(0, 8);
  return pageHead({ title: 'Practice', sub: 'proving it on a later day', back: { label: 'Home', href: '#/home' } }) + `<div class="grid2">
    <div class="card pin stack"><h3>Check what you know</h3><p style="margin:0">${d.length ? `${plural(d.length, 'stop')} ${d.length === 1 ? 'is' : 'are'} ready to prove. A stop counts as learned only when you get it right on a later day than you learned it.` : 'Nothing is due yet. Stops you pass today can be proved from tomorrow.'}</p>
      ${d.length ? btn('Start the check', 'practice-check', { ic: 'check' }) : link('Continue the journey', '#/continue', { ic: 'next', cls: 'out' })}</div>
    <div class="card stack"><h3>Your mistakes deck</h3>${miss.length ? `<p style="margin:0">These stops had a slip. Going back over one is how it sticks.</p><div class="stoplist">${miss.map((id) => { const s = stopById(id) || readingStop(id); return `<a class="stoprow" href="#/stop/${id}"><span class="st">${icon('undo')}</span><span><b>${esc(s.title)}</b><small>${STEP[k.mastery[id]?.step || 0]}</small></span><span>${icon('next')}</span></a>`; }).join('')}</div>` : '<p class="muted" style="margin:0">No slips to go back over.</p>'}</div></div>`;
}

export function logView() {
  const k = kid();
  const read = PASSAGES.filter((p) => k.stops['rd-' + p.id]?.passed);
  const books = [...new Set(read.map((p) => p.work))];
  return pageHead({ title: 'Reading log', sub: 'what you have read and understood — never minutes', back: { label: 'My page', href: '#/me' } }) + (read.length
    ? `<div class="grid2"><div class="card"><div class="stats"><div class="stat"><b>${books.length}</b><small>books met</small></div><div class="stat"><b>${read.length}</b><small>passages read</small></div><div class="stat"><b>${read.filter((p) => (k.mastery['rd-' + p.id]?.step || 0) >= 2).length}</b><small>understood on a later day</small></div></div></div>
      <div class="card"><div class="stoplist">${read.map((p) => `<a class="stoprow passed" href="#/read/${p.id}"><span class="st">${icon('check')}</span><span><b>${esc(p.title)}</b><small>${esc(WORKS.find((w) => w.id === p.work)?.title || '')} · ${STEP[k.mastery['rd-' + p.id]?.step || 0]}</small></span><span></span></a>`).join('')}</div></div></div>`
    : empty('sleep', 'Nothing in the log yet. Read a passage and answer its questions.', link('Read something', '#/library', { ic: 'book' })));
}

export function recordingsView() {
  const k = kid(), a = (k.stage['sp1-aloud'] || []).slice().reverse();
  return pageHead({ title: 'My recordings', sub: 'numbers only — no sound is ever kept', back: { label: 'Stage', href: '#/stage' } }) + (a.length
    ? `<div class="card"><ul class="ledger">${a.map((x) => `<li><span>${new Date(x.at).toLocaleDateString()} · ${esc(PASSAGES.find((p) => p.id === x.passage)?.title || '')}</span><b>${x.wpm} wpm · ${x.pauses} pauses · ${x.secs}s</b></li>`).join('')}</ul></div><p class="note">The app never records your voice. It keeps only these numbers, measured while you read.</p>`
    : empty('sleep', 'No readings yet. The Stage is waiting.', link('The Stage', '#/stage', { ic: 'mic' })));
}

/* ---------- Help and Privacy ---------- */
export function helpView() {
  return pageHead({ title: 'Help', sub: 'how coins, worlds and mastery work', back: { label: 'Home', href: '#/home' } }) + `<div class="grid2">
    <div class="card"><h3>The journey</h3><p>Seven strands — Word, Sentence, Reading, Writing, Speaking, Literature, Language — each ten levels. You move along several at once. Every stop goes: a story, how it works, your turn, then a check.</p></div>
    <div class="card"><h3>Learned means remembered</h3><p>Passing a stop’s check means you can do it today. It counts as <b>learned</b> when you get it right again on a later day, and <b>mastered</b> a week after that. A slip moves it back one step, never to the start.</p></div>
    <div class="card"><h3>Bizzing coins</h3><p>One coin for each right answer in a check, five for finishing a stop, twenty for proving something on a later day — at most 100 a day. Coins buy avatars and worlds at fixed prices. Nothing is random, and coins never buy lessons.</p></div>
    <div class="card"><h3>Worlds</h3><p>The Story Garden and the Lamplit Study are open to everyone. The other four open with the family plan, or one at a time for 240 coins.</p></div>
    <div class="card"><h3>The Stage</h3><p>When you read aloud, the app measures time, pace and pauses on this device. It cannot hear expression, so it never pretends to — you and a grown-up judge that.</p></div>
    <div class="card"><h3>Spelling contests</h3><p>For spelling bees, Bizzing Bee is the place. English uses Bee’s word list for meanings and sounds, and leaves the competition to Bee.</p></div></div>`;
}
export function privacyView() {
  return pageHead({ title: 'Privacy', sub: 'what stays on this device', back: { label: 'Home', href: '#/home' } }) + `<div class="card stack" style="max-width:820px">
    <p><b>Everything stays on this device.</b> No accounts, no analytics, no ads, no tracking. A child is a first name, an age band and an avatar — never a birthdate, surname, school, photo or location.</p>
    <p><b>What is stored, and where:</b> this device’s browser storage keeps the household (${KEYS.map((x) => `<code>${x}</code>`).join(', ')}), plus the family’s shared keys <code>bizzing.wallet</code> (coins) and <code>bizzing.activity</code> (active minutes and milestones, which the Bizzing Hive reads on this same device).</p>
    <p><b>The microphone</b> opens only when a child taps Start on the Stage and closes the moment they tap Stop. No sound is recorded, kept or sent — only the numbers measured from loudness (time, pace, pauses). No speech recognition is used.</p>
    <p><b>Writing</b> a child types (copywork) is checked on this device and never sent anywhere.</p>
    <p><b>One request leaves the device:</b> when a child taps a word to hear it, the recorded pronunciation is fetched from Bizzing Bee’s own published files on GitHub (<code>raw.githubusercontent.com</code>), exactly as Bizzing Bee does. GitHub sees the device’s address and which word — nothing about the child. With no connection, the device’s own voice reads the word instead.</p>
    <p><b>Read it to me</b> uses only voices that run on the device.</p>
    <p><b>The grown-ups’ PIN</b> is a deterrent, not security: it keeps small fingers out, not a determined person with developer tools.</p>
    <p class="note">If any of this changes, this page changes first.</p></div>`;
}

/* ---------- Search ---------- */
export function searchView(q) {
  const s = q.toLowerCase();
  const stops = STRANDS.flatMap((x) => stopsOf(x.id)).filter((st) => (st.title + ' ' + (st.iCan || '')).toLowerCase().includes(s)).slice(0, 12);
  const works = WORKS.filter((w) => (w.title + ' ' + w.author).toLowerCase().includes(s)).slice(0, 12);
  const words = lexSearch(s, 16);
  return pageHead({ title: `Search: ${q}`, sub: 'stops, books and words', back: { label: 'Home', href: '#/home' } }) + `<div class="grid3">
    <div class="card"><h3>Stops</h3>${stops.length ? stops.map((st) => `<a href="#/stop/${st.id}" style="display:block;padding:7px 0">${esc(st.title)} <small class="muted">${esc(strand(st.strand).title)} ${st.level}</small></a>`).join('') : '<p class="muted">None.</p>'}</div>
    <div class="card"><h3>Books</h3>${works.length ? works.map((w) => `<a href="#/book/${w.id}" style="display:block;padding:7px 0">${esc(w.title)} <small class="muted">${esc(w.author)}</small></a>`).join('') : '<p class="muted">None.</p>'}</div>
    <div class="card"><h3>Words</h3>${words.length ? words.map((w) => `<a href="#/word/${encodeURIComponent(w)}" style="display:inline-block;padding:6px 10px 6px 0">${esc(w)}</a>`).join('') : '<p class="muted">None in our list.</p>'}</div></div>`;
}

/* ---------- Grown-ups ---------- */
function minutes(k, days = 7) {
  let tot = 0; try { const o = JSON.parse(localStorage.getItem('bizzing.activity') || '{}'); const from = today(Date.now() - (days - 1) * 864e5);
    for (const x of o.s || []) if (x.a === 'english' && x.d >= from && (x.who || '').toLowerCase() === k.name.toLowerCase()) tot += x.m || 0; } catch {}
  return tot;
}
export function grownupsView() {
  if (!isUnlocked()) return pageHead({ title: 'Grown-ups', sub: 'report card, plan and backup', back: { label: 'Home', href: '#/home' } }) + pinPad();
  const h = S.h;
  const cards = h.kids.map((k) => {
    const stops = STRANDS.map((s) => [s, stopsOf(s.id).filter((x) => k.stops[x.id]?.passed).length]);
    const lapses = Object.entries(k.mastery).filter(([, r]) => r.lapses).sort((a, b) => b[1].lapses - a[1].lapses).slice(0, 3);
    const help = lapses.length ? `${they(k)} slipped on ${lapses.map(([id]) => `“${stopById(id)?.title || readingStop(id)?.title || id}”`).join(', ')} — a spaced check will bring ${lapses.length > 1 ? 'them' : 'it'} back.` : due(k).length ? `${due(k).length} stops are ready for ${they(k)} to prove on a later day (Practice).` : `Nothing needs help yet. ${they(k)}’s next stop is on Home.`;
    const tries = (k.stage['sp1-aloud'] || []).slice(-3);
    return `<section class="card stack"><div class="row"><img src="${avatarOf(k)}" alt="" style="width:56px;height:56px"><div><h3 style="margin:0">${esc(k.name)}</h3><small class="muted">${BANDS[k.band - 1].age}</small></div></div>
      <div class="stats"><div class="stat"><b>${minutes(k)}</b><small>active minutes, last 7 days</small></div><div class="stat"><b>${Object.values(k.stops).filter((x) => x.passed).length}</b><small>stops passed</small></div><div class="stat"><b>${learnedCount(k)}</b><small>learned (later-day check)</small></div><div class="stat"><b>${masteredCount(k)}</b><small>mastered</small></div></div>
      <p class="note" style="margin:0"><b>Time</b> is active minutes from the family feed — it never counts as learning. <b>Progress</b> and <b>mastery</b> count only right answers, and mastery only on a later day.</p>
      <div class="stoplist">${stops.map(([s, n]) => `<div class="stoprow"><span class="st" style="color:${s.colour}">${icon(s.icon)}</span><span><b>${esc(s.title)}</b><small>${n} of ${stopsOf(s.id).length} stops · ${s.levels.filter((l) => levelDone(k, s.id, l.n)).length} levels</small></span><span></span></div>`).join('')}</div>
      <p style="margin:0"><b>What to help with next:</b> ${esc(help)}</p>
      ${tries.length ? `<div><b>Reading aloud</b> (measured by the app: pace and pauses; expression is yours to judge):<ul class="ledger">${tries.map((t) => `<li><span>${new Date(t.at).toLocaleDateString()} · ${t.wpm} wpm · ${t.pauses} pauses</span><span class="row">${[1, 2, 3, 4].map((v) => `<button class="bz-chip" data-act="rubric" data-arg="${k.id}:${t.at}:${v}" aria-pressed="${t.rubric === v}"${t.rubric === v ? ' aria-current="page"' : ''}>${v}</button>`).join('')}</span></li>`).join('')}</ul><p class="note">Your rating, 1–4, for expression — judged by a grown-up.</p></div>` : ''}
      <div class="setrow"><label>Age band</label><div class="seg">${BANDS.map((b) => `<button data-act="kid-band" data-arg="${k.id}:${b.id}" aria-pressed="${k.band === b.id}">${b.label}</button>`).join('')}</div></div>
      <div class="setrow"><label>Daily ring<small>right answers · passages · minutes spoken</small></label><div class="row">${['words', 'pages', 'speak'].map((f) => `<label class="sr" for="t-${k.id}-${f}">${f}</label><input id="t-${k.id}-${f}" type="number" min="0" max="60" value="${k.targets[f]}" data-act="kid-target" data-arg="${k.id}:${f}" class="field" style="width:76px;min-height:44px;padding:6px 8px">`).join('')}</div></div>
      <div class="setrow"><label>Read aloud automatically</label><button class="switch" role="switch" aria-checked="${!!k.prefs.readAloud}" data-act="kid-readaloud" data-arg="${k.id}" aria-label="Read aloud"></button></div>
      <div class="row">${btn(`Delete ${k.name}`, 'kid-delete', { arg: k.id, cls: 'out small', ic: 'close' })}</div></section>`;
  }).join('');
  return pageHead({ title: 'Grown-ups', sub: 'report card, plan and backup', back: { label: 'Home', href: '#/home' }, actions: [{ icon: 'lock', label: 'Lock', href: '#', act: 'pin-lock' }] }) + `<div class="stack">
    <p class="note" style="margin:0 20px">The PIN is a deterrent, not security. Nothing here is sent anywhere.</p>
    <div class="grid2">${cards}<section class="card stack"><h3>The household</h3>
      <div class="setrow"><label>Family plan<small>Opens Reading, Writing, Speaking, Literature, Language and worlds 3–6. Until the family server exists this is a switch here; nothing is charged.</small></label><button class="switch" role="switch" aria-checked="${h.parent.plan === 'family'}" data-act="plan" aria-label="Family plan"></button></div>
      <div class="setrow"><label>Tester mode<small>Opens every gate. It never rewrites a child’s record.</small></label><button class="switch" role="switch" aria-checked="${!!h.parent.tester}" data-act="tester" aria-label="Tester mode"></button></div>
      <div class="row">${btn('Add a child', 'add-kid', { ic: 'user', cls: 'out small' })}${btn('Save a backup', 'backup', { ic: 'check', cls: 'out small' })}<label class="btn out small" for="restore">${icon('undo')}<span>Restore</span></label><input type="file" id="restore" accept="application/json" data-act="restore" class="sr"></div>
      <p class="note" style="margin:0">A backup file holds progress, never a name or a voice; restoring asks for each child’s first name.</p>
      <div class="row">${btn('Change the PIN', 'pin-change', { cls: 'out small', ic: 'lock' })}${btn('Erase everything', 'erase', { cls: 'out small', ic: 'close' })}</div>
      <p class="note" style="margin:0">Across every Bizzing app: <a href="https://aayuvis.github.io/Bizzing_Schedule/">the Hive’s grown-ups page</a>.</p></section></div></div>`;
}
function pinPad() {
  const p = S.h.parent, n = (S.pinBuf || '').length;
  return `<div class="card stack" style="max-width:420px;margin:0 auto;text-align:center"><img src="${mascot('think')}" alt="" style="width:110px;height:110px;margin:0 auto">
    <h3>${p.pin ? 'Enter the grown-ups’ PIN' : 'Choose a 4-digit PIN'}</h3><p class="note" style="margin:0">${p.pin ? 'A deterrent, not security.' : 'It keeps this page for grown-ups. It is a deterrent, not security — and it is stored as a hash, never the digits.'}</p>
    <div class="pindots" aria-label="${n} of 4 digits">${[0, 1, 2, 3].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>${S.pinErr ? `<p class="feedback no" style="margin:0">That is not the PIN.</p>` : ''}
    <div class="pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d) => (d === '' ? '<span></span>' : `<button data-act="pin" data-arg="${d}" aria-label="${d === '⌫' ? 'Delete' : d}">${d === '⌫' ? icon('back') : d}</button>`)).join('')}</div>
    <p class="note">Type the digits on a keyboard too.</p></div>`;
}

/* ---------- Settings (FAMILY-STANDARD §5: Me · Sound & music · Look · Comfort · Grown-ups) ---------- */
export function settingsSheet() {
  const k = kid(), d = S.dev;
  const sw = (act, on, label) => `<button class="switch" role="switch" aria-checked="${!!on}" data-act="${act}" aria-label="${esc(label)}"></button>`;
  const seg = (act, cur, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-act="${act}" data-arg="${v}" aria-pressed="${String(cur) === String(v)}">${esc(l)}</button>`).join('')}</div>`;
  return sheet('Settings', 'settings', `
    <section class="card" data-section="me"><h3>Me</h3><div class="setrow"><label for="dn">Display name</label><input id="dn" class="field" value="${esc(k?.name || '')}" data-act="rename" style="max-width:220px"></div>
      <div class="setrow"><label>Avatar</label>${link('Collection', '#/collection', { cls: 'out small', ic: 'star' })}</div><div class="setrow"><label>Switch child</label>${btn('Switch', 'kid-sheet', { cls: 'out small', ic: 'user' })}</div></section>
    <section class="card" data-section="sound"><h3>Sound &amp; music</h3><div class="setrow"><label>Sound effects</label>${sw('dev-sound', d.sound, 'Sound effects')}</div><div class="setrow"><label>Music</label>${sw('dev-music', d.music, 'Music')}</div>
      <div class="setrow"><label for="vol">Volume</label><input id="vol" type="range" min="0" max="1" step="0.05" value="${d.volume}" data-act="dev-volume"></div>
      <div class="setrow"><label>Read aloud<small>in this device’s own voice</small></label>${sw('kid-readaloud-me', k?.prefs.readAloud, 'Read aloud')}</div><div class="setrow"><label>Reading speed</label>${seg('dev-speed', d.speed, [['slower', 'Slower'], ['normal', 'Normal']])}</div></section>
    <section class="card" data-section="look"><h3>Look</h3><div class="worldpick">${WORLDS.map((w) => { const open = k && worldOpen(w.n, ctx(k)); return `<button data-act="${open ? 'wear-world' : 'noop'}" data-arg="${w.n}" aria-pressed="${k?.world === w.n}"><img src="${plate(w, isDark(), true)}" alt=""><span>${esc(w.name)}<small>${open ? (k?.world === w.n ? 'You are here' : 'Open') : 'Opens with the family plan or 240 coins'}</small></span></button>`; }).join('')}</div>
      <div class="setrow"><label>Light or dark</label>${seg('dev-dark', d.dark == null ? 'auto' : d.dark ? 'dark' : 'light', [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Match device']])}</div>
      <div class="setrow"><label>Text size</label>${seg('dev-text', d.text, [['S', 'S'], ['M', 'M'], ['L', 'L']])}</div></section>
    <section class="card" data-section="comfort"><h3>Comfort</h3><div class="setrow"><label>Reduce motion</label>${sw('dev-motion', d.motion === false, 'Reduce motion')}</div><div class="setrow"><label>Calm mode<small>music off, softer sounds, no confetti</small></label>${sw('dev-calm', d.calm, 'Calm mode')}</div></section>
    <section class="card" data-section="grownups"><h3>Grown-ups</h3><div class="setrow"><label>Age band, daily targets, plan, backup, tester mode<small>behind the PIN</small></label>${link('Open', '#/grownups', { cls: 'out small', ic: 'lock' })}</div></section>
    <p class="foot"><a href="#/privacy">Privacy</a> · <a href="#/help">About</a> · version 0.1</p>`);
}

export function kidSheet() {
  return sheet('Who is reading?', 'user', `<div class="kids">${S.h.kids.map((k) => `<button class="kidrow" data-act="switch-kid" data-arg="${k.id}" aria-current="${k.id === S.h.active}"><img src="${avatarOf(k)}" alt=""><span><b>${esc(k.name)}</b><br><small class="muted">${esc(headline(k))}</small></span></button>`).join('')}</div>
    ${btn('Add a child (grown-ups)', 'add-kid', { cls: 'out', ic: 'lock' })}
    <div class="setrow"><label>Sound</label><button class="switch" role="switch" aria-checked="${!!S.dev.sound}" data-act="dev-sound" aria-label="Sound"></button></div>
    <div class="setrow"><label>Dark</label><button class="switch" role="switch" aria-checked="${isDark()}" data-act="theme-toggle" aria-label="Dark"></button></div>`);
}
export function coinSheet() {
  const k = kid(), L = ledger(k.name).slice(-30).reverse();
  return sheet('Bizzing coins', 'coin', `<div class="row"><span class="score">${balance(k.name)}</span><span class="muted">coins, shared by every Bizzing app on this device</span></div>${historyList(L)}<p class="note">Coins come from learning — right answers, finished stops, things proved on a later day — and buy avatars and worlds at fixed prices. ${link('Shop', '#/shop', { cls: 'small out', ic: 'bag' })}</p>`);
}
export function medalSheet(ids) {
  const ms = ids.map((id) => MEDALS.find((m) => m.id === id));
  return sheet('A new medal', 'medal', `<div class="finish stack" style="text-align:center;justify-items:center">${ms.map((m) => `<img src="art/${m.art}.webp" alt="" style="width:150px;height:150px"><h2>${esc(m.name)}</h2><p style="margin:0">${esc(m.how)}</p>`).join('')}${btn('Lovely', 'sheet-close', { ic: 'check' })}</div>`);
}
export function addKidSheet() {
  return sheet('Add a child', 'user', `<form data-act="add-kid-form" class="stack"><label for="nk">First name only</label><input id="nk" class="field" name="name" maxlength="20" autocomplete="off" required>
    <div class="seg" role="group" aria-label="Age band">${BANDS.map((b) => `<button type="button" data-act="nk-band" data-arg="${b.id}" aria-pressed="${(S.nkBand || 2) === b.id}">${b.label}</button>`).join('')}</div>
    ${btn('Add', 'add-kid-go', { ic: 'check' })}<p class="note">A first name, an age band and an avatar. Nothing else, ever.</p></form>`);
}

/* ---------- actions ---------- */
async function pinDigit(a) {
  const p = S.h.parent; S.pinErr = false;
  if (a === '⌫') S.pinBuf = (S.pinBuf || '').slice(0, -1); else if ((S.pinBuf || '').length < 4) S.pinBuf = (S.pinBuf || '') + a;
  if ((S.pinBuf || '').length === 4) {
    const v = S.pinBuf; S.pinBuf = '';
    if (!p.pin || S.pinChange) { await setPin(p, v); S.pinChange = false; save(); toast('PIN saved'); }
    else if (!(await tryPin(p, v))) S.pinErr = true;
  }
  render();
}
export const PAGE_ACTIONS = {
  pin: (a) => pinDigit(a),
  'pin-lock': () => { lock(); render(); },
  'pin-change': () => { S.pinChange = true; lock(); render(); },
  wear: (a) => { const k = kid(); k.avatar = a; save(); sfx('tap'); render(); },
  'buy-av': (a) => { const k = kid(), av = byId(a); if (buy('english', k.name, av, ctx(k))) { k.owned.push(a); k.avatar = a; save(); sfx('unlock'); confetti(); toast(`${av.name} is yours`); } render(); },
  'buy-world': (a) => { const k = kid(); if (buyWorld('english', k.name, +a, ctx(k))) { k.worlds.push(+a); k.world = +a; save(); sfx('unlock'); confetti(); } render(); },
  'wear-world': (a) => { const k = kid(); k.world = +a; save(); render(); },
  noop: () => {},
  'practice-check': () => go('#/practice/check'),
  rename: () => {},
  'kid-sheet': () => { S.sheet = { kind: 'kids' }; render(); },
  'switch-kid': (a) => { S.h.active = a; save(); S.sheet = null; go('#/home'); },
  'add-kid': () => { if (!isUnlocked() && S.h.kids.length) { S.sheet = null; go('#/grownups'); return; } S.sheet = { kind: 'addkid' }; render(); },
  'nk-band': (a) => { S.nkBand = +a; render(); },
  'add-kid-go': () => { const n = document.querySelector('#nk')?.value.trim(); if (!n) return; addKid(S.h, newKid(n, S.nkBand || 2, STARTERS[S.h.kids.length % STARTERS.length])); save(); S.sheet = null; go('#/home'); },
  'kid-band': (a) => { const [id, b] = a.split(':'); const k = S.h.kids.find((x) => x.id === id); k.band = +b; save(); render(); },
  'kid-readaloud': (a) => { const k = S.h.kids.find((x) => x.id === a); k.prefs.readAloud = !k.prefs.readAloud; save(); render(); },
  'kid-readaloud-me': () => { const k = kid(); k.prefs.readAloud = !k.prefs.readAloud; save(); render(); },
  'kid-delete': (a) => { const k = S.h.kids.find((x) => x.id === a); if (confirm(`Delete ${k.name} and everything ${k.name} has done? This cannot be undone.`)) { removeKid(S.h, a); save(); go(S.h.kids.length ? '#/grownups' : '#/welcome'); } },
  plan: () => { S.h.parent.plan = S.h.parent.plan === 'family' ? 'free' : 'family'; save(); render(); },
  tester: () => { S.h.parent.tester = !S.h.parent.tester; save(); render(); },
  rubric: (a) => { const [id, at, v] = a.split(':'); const t = (S.h.kids.find((x) => x.id === id)?.stage['sp1-aloud'] || []).find((x) => String(x.at) === at); if (t) { t.rubric = +v; save(); render(); } },
  backup: () => { const b = new Blob([JSON.stringify(makeBackup(S.h), null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `bizzing-english-backup-${today()}.json`; a.click(); },
  erase: () => { if (confirm('Erase every child and all progress on this device? Coins in the family wallet stay with the family.')) { eraseHousehold(); location.hash = '#/welcome'; location.reload(); } },
  'dev-sound': () => { setDevice({ sound: !S.dev.sound }); render(); },
  'dev-music': () => { setDevice({ music: !S.dev.music }); render(); },
  'dev-speed': (a) => { setDevice({ speed: a }); render(); },
  'dev-dark': (a) => { setDevice({ dark: a === 'auto' ? null : a === 'dark' }); render(); },
  'dev-text': (a) => { setDevice({ text: a }); render(); },
  'dev-motion': () => { setDevice({ motion: S.dev.motion === false }); render(); },
  'dev-calm': () => { setDevice({ calm: !S.dev.calm }); render(); },
  'theme-toggle': () => { setDevice({ dark: !isDark() }); render(); },
};
export async function onChange(t) {
  const act = t.dataset.act, a = t.dataset.arg;
  if (act === 'dev-volume') setDevice({ volume: +t.value });
  if (act === 'rename') { const k = kid(); const v = t.value.trim().slice(0, 20); if (v) { k.name = v; save(); } }
  if (act === 'kid-target') { const [id, f] = a.split(':'); const k = S.h.kids.find((x) => x.id === id); k.targets[f] = Math.max(0, Math.min(60, +t.value || 0)); save(); }
  if (act === 'restore' && t.files?.[0]) {
    try { const f = JSON.parse(await t.files[0].text()); const names = (f.kids || []).map((_, i) => prompt(`First name for child ${i + 1}?`) || `Reader ${i + 1}`);
      if (restoreBackup(S.h, f, names)) { save(); toast('Restored'); go('#/home'); } else toast('That file is not a Bizzing English backup'); } catch { toast('That file could not be read'); }
  }
}
export { isDemo };
