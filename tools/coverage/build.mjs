#!/usr/bin/env node
/* build.mjs — the Bizzing English coverage map, made from the app's own data (the curriculum, the passages,
   the whole books) and concepts.mjs. Writes docs/coverage.html, an Artifact-ready page (no doctype: the
   publisher wraps it). Re-run after any content change:  node tools/coverage/build.mjs  */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = new URL('../../', import.meta.url).pathname;
const imp = (p) => import(pathToFileURL(ROOT + p).href);
const { STRANDS, allStops, BANDS } = await imp('app/src/curriculum.js');
const { readingStops, bookStops } = await imp('app/src/reading.js');
const { BOOKS } = await imp('app/src/book.js');
const { WORKS, PASSAGES } = await imp('app/src/data/library.js');
const { cleared } = await imp('app/src/data/rights.js');
const { CONCEPTS, PLACES } = await imp('tools/coverage/concepts.mjs');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strandOf = (id) => STRANDS.find((s) => s.id === id);
const READ = readingStops(), BOOKSTOPS = bookStops();
const STOPS = [...allStops().filter((s) => s.strand !== 'reading'), ...READ.map((s) => ({ ...s, strand: 'reading' })), ...BOOKSTOPS];
const workOf = (id) => WORKS.find((w) => w.id === id);
const shippedPassages = PASSAGES.filter((p) => cleared(workOf(p.work)));
const held = WORKS.filter((w) => w.held), heldCleared = held.filter((w) => cleared(w)), cards = WORKS.filter((w) => !w.held);
const lvTitle = (sid, n) => strandOf(sid).levels.find((l) => l.n === n)?.title || '';

/* resolve a concept's `where` to stops and places */
function resolve(where) {
  const stops = [], places = [];
  for (const w of where) {
    if (w.startsWith('@')) { if (PLACES[w]) places.push(PLACES[w]); continue; }
    if (w.startsWith('reading:')) { const n = +w.slice(8); stops.push(...(n ? READ.filter((s) => s.level === n) : READ)); continue; }
    if (w.startsWith('book:')) { stops.push(...BOOKSTOPS); continue; }
    stops.push(...STOPS.filter((s) => (w.endsWith('-') ? s.id.startsWith(w) : s.id === w)));
  }
  return { stops: [...new Map(stops.map((s) => [s.id, s])).values()], places };
}
function whereHTML(stops, places) {
  const by = new Map();
  for (const s of stops) { const k = `${s.strand}:${s.level}`; (by.get(k) || by.set(k, []).get(k)).push(s); }
  const parts = [...by.entries()].map(([k, ss]) => { const [sid, n] = k.split(':'); const st = strandOf(sid);
    const names = sid === 'reading' && ss.length > 3 ? `${ss.length} passages — ${ss.slice(0, 3).map((s) => esc(s.title)).join(', ')}…` : ss.map((s) => esc(s.title)).join(', ');
    return `<b>${esc(st.title)} ${n} · ${esc(lvTitle(sid, +n))}</b> — ${names}`; });
  for (const [name, what] of places) parts.push(`<b>${esc(name)}</b> — ${esc(what)}`);
  return parts.join(' · ');
}
const rows = CONCEPTS.map((g) => ({ ...g, rows: g.rows.map(([name, ages, where, part]) => { const r = resolve(where); const any = r.stops.length || r.places.length;
  return { name, ages, status: part === 'part' ? (any ? 'part' : 'miss') : any ? 'ok' : 'miss', where: any ? whereHTML(r.stops, r.places) : '' }; }) }));
const count = (st) => rows.reduce((a, g) => a + g.rows.filter((r) => r.status === st).length, 0);
const nOK = count('ok'), nPart = count('part'), nMiss = count('miss'), nAll = nOK + nPart + nMiss;

/* the level map: strands × levels, a pill per stop shaded by its age band */
const pill = (s) => `<span class="pill b${s.band || 1}" title="ages ${esc(BANDS.find((b) => b.id === (s.band || 1))?.label)}">${esc(s.title)}</span>`;
const mapRows = STRANDS.map((st) => {
  const cells = st.levels.map((l) => {
    const ss = st.id === 'reading' ? (l.n === 8 ? BOOKSTOPS : READ.filter((s) => s.level === l.n)) : l.stops;
    if (!ss.length) return '<td class="empty"></td>';
    const show = st.id === 'reading' ? (l.n === 8 ? BOOKS.map((b) => pill({ title: `${b.title} · ${b.chapters.length} chapters`, band: b.band })) : ss.slice(0, 3).map(pill)) : ss.map(pill);
    const more = st.id === 'reading' && l.n !== 8 && ss.length > 3 ? `<span class="more">+${ss.length - 3} more</span>` : '';
    return `<td><small class="lt">${esc(l.title)}</small><div class="pills">${show.join('')}${more}</div></td>`;
  }).join('');
  const n = st.id === 'reading' ? READ.length + BOOKSTOPS.length : st.levels.reduce((a, l) => a + l.stops.length, 0);
  return `<tr><th class="sc" style="--sc:${st.colour}"><span class="dot"></span>${esc(st.title)}<small>${esc(st.sub)}</small></th>${cells}<td class="tot">${n}</td></tr>`;
}).join('');
const filled = STRANDS.reduce((a, st) => a + st.levels.filter((l) => (st.id === 'reading' ? (l.n === 8 ? BOOKSTOPS.length : READ.filter((s) => s.level === l.n).length) : l.stops.length) > 0).length, 0);

/* the three journeys, by age band */
const opensFor = (b, st) => !st.opens || (st.opens.band && b >= st.opens.band) || (st.opens.after && b >= 3);
const head = (b) => (b === 3 ? 3 : b === 2 ? 2 : 1);
const JOURNEY = { 1: 'Rhymes and word families, naming and doing words, capitals and full stops, fables and poems heard in the narrator’s voice, copywork, and reading aloud.',
  2: 'Meanings, prefixes and suffixes, clauses and joining words, children’s classics and whole books, dictation and the paragraph, reciting by heart, story elements and borrowed words.',
  3: 'Roots and their families, shades of meaning, parallel and periodic sentences, drama, essays and close reading, the essay and writing after a model, speeches and debate, literary periods, rhetoric and world Englishes.' };
const journeys = BANDS.map((b) => {
  const open = STRANDS.filter((st) => opensFor(b.id, st)), later = STRANDS.filter((st) => !opensFor(b.id, st));
  const mine = STOPS.filter((s) => (s.band || 1) <= b.id).length;
  return `<li><div class="jn"><b>${esc(b.label)}</b><span>ages</span></div><div><p class="jh">Starts at level ${head(b.id)} of every open strand</p><p>${esc(JOURNEY[b.id])}</p>
    <div class="chips">${open.map((st) => `<span style="--sc:${st.colour}"><i></i>${esc(st.title)}</span>`).join('')}</div>
    ${later.length ? `<p class="small">Opens on the way: ${later.map((st) => `${esc(st.title)} (after ${esc(strandOf(st.opens.after[0]).title)} ${st.opens.after[1]})`).join(', ')}.</p>` : ''}
    <p class="small">${mine} stops written for this age or younger.</p></div></li>`;
}).join('');

/* the concept tables */
const ST = { ok: ['ok', 'Taught'], part: ['part', 'Partly'], miss: ['miss', 'Missing'] };
const tables = rows.map((g) => { const st = strandOf(g.ic); const ok = g.rows.filter((r) => r.status === 'ok').length;
  return `<section class="area" id="${esc(g.n.toLowerCase().replace(/[^a-z]+/g, '-'))}"><header><h3 style="--sc:${st.colour}"><span class="dot"></span>${esc(g.n)}</h3><span class="tally">${ok} of ${g.rows.length} taught</span></header>
  <div class="tw"><table class="ct"><thead><tr><th>Sub-concept</th><th>Ages</th><th>Status</th><th>Where</th></tr></thead><tbody>${g.rows.map((r) => `<tr><td class="cn">${esc(r.name)}</td><td class="ages">${esc(r.ages)}</td><td><span class="st ${ST[r.status][0]}">${ST[r.status][1]}</span></td><td class="wh">${r.where || '<span class="none">Not in the app yet</span>'}</td></tr>`).join('')}</tbody></table></div></section>`; }).join('');

/* beyond the Atlas */
const games = [['Sentence Builder', 'build sentences from real books, both orders, against the clock'], ['Punctuation Rush', 'commas in 1,937 real sentences'], ['Who Said It?', 'a detective: the line, then clues — guess early, score more'], ['Figure Hunt', 'name the figure, then find it inside a passage'], ['Plot Line', 'drag scenes onto a timeline'], ['Root Forge', 'parts into real words; forge a family'], ['Rhetoric Duel', 'the stronger line and why, best of five']];
const stillMiss = rows.flatMap((g) => g.rows.filter((r) => r.status === 'miss').map((r) => r.name));
const stillPart = rows.flatMap((g) => g.rows.filter((r) => r.status === 'part').map((r) => r.name));
const review = [...PASSAGES.filter((p) => p.needsReview), ...WORKS.filter((w) => w.needsReview)].length;
const gated = WORKS.filter((w) => w.held !== undefined && !cleared(w) && w.rights).map((w) => w.title);

const html = `<title>Bizzing English Coverage Map</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Hanken+Grotesk:wght@400;500;650;750&display=swap">
<style>
/* layout: a long reference page — one wide level map, then one table per area; Quill's teal as the single accent */
:root{
  --bg:#EFF4F2; --paper:#FFFFFF; --ink:#16232A; --muted:#566870; --line:#D6E2DE; --soft:#F5F8F7;
  --accent:#0F766E; --accent-ink:#FFFFFF; --b1:#CDEBE6; --b2:#7FC7BC; --b3:#0F766E;
  --ok:#17804A; --ok-t:#E0F3E7; --part:#A8670F; --part-t:#FBEFD9; --miss:#B8423A; --miss-t:#FBE7E5;
  --display:"Fraunces",Georgia,serif; --ui:"Hanken Grotesk",system-ui,-apple-system,sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;
  --bg:#0E1719; --paper:#152225; --ink:#E3EEEC; --muted:#93A9A6; --line:#26393B; --soft:#1A2A2D;
  --accent:#5FC7B8; --accent-ink:#0E1719; --b1:#1D3D3A; --b2:#2F7A70; --b3:#5FC7B8;
  --ok:#5CCB8C; --ok-t:#12301F; --part:#E3AE55; --part-t:#33270F; --miss:#EE8278; --miss-t:#3A1A17;}}
:root[data-theme="dark"]{color-scheme:dark;
  --bg:#0E1719; --paper:#152225; --ink:#E3EEEC; --muted:#93A9A6; --line:#26393B; --soft:#1A2A2D;
  --accent:#5FC7B8; --accent-ink:#0E1719; --b1:#1D3D3A; --b2:#2F7A70; --b3:#5FC7B8;
  --ok:#5CCB8C; --ok-t:#12301F; --part:#E3AE55; --part-t:#33270F; --miss:#EE8278; --miss-t:#3A1A17;}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:15px/1.55 var(--ui);margin:0}
.wrap{max-width:1240px;margin:0 auto;padding-inline:20px;padding-block:36px 64px;display:grid;gap:44px}
h1,h2,h3{font-family:var(--display);text-wrap:balance;margin:0;line-height:1.15}
h1{font-size:clamp(30px,4.4vw,48px);font-weight:800}
h2{font-size:clamp(22px,2.6vw,30px);font-weight:800}
.eyebrow{font-weight:750;letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:var(--accent)}
.lede{max-width:72ch;color:var(--muted);font-size:16px;margin:12px 0 0}
.lede b{color:var(--ink)}
.key{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:16px;font-size:13.5px;color:var(--muted)}
.key span{display:flex;gap:7px;align-items:center}
.st{display:inline-block;font-weight:750;font-size:12px;padding:2px 9px;border-radius:999px;white-space:nowrap}
.st.ok{background:var(--ok-t);color:var(--ok)}.st.part{background:var(--part-t);color:var(--part)}.st.miss{background:var(--miss-t);color:var(--miss)}
.tally-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}
.tally-row div{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:12px 16px;min-width:140px}
.tally-row b{display:block;font-family:var(--display);font-size:28px;font-variant-numeric:tabular-nums}
.tally-row small{color:var(--muted)}
.sec-h p{color:var(--muted);max-width:76ch;margin:8px 0 0}
.mw{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:var(--paper);margin-top:14px}
.map{border-collapse:separate;border-spacing:0;min-width:1320px;width:100%;font-size:12px}
.map th,.map td{border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:7px;vertical-align:top}
.map tr>*:last-child{border-right:0}.map tbody tr:last-child>*{border-bottom:0}
.map thead th{background:var(--soft);font-weight:750;text-align:center;position:sticky;top:0}
.map thead th small{display:block;font-weight:500;color:var(--muted)}
.sc{position:sticky;left:0;background:var(--paper);text-align:left;min-width:150px;z-index:1;font-weight:750;font-size:13.5px}
.sc small{display:block;font-weight:500;color:var(--muted);font-size:11.5px}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--sc);margin-right:7px;vertical-align:1px}
.lt{display:block;color:var(--muted);font-size:11px;margin-bottom:4px;line-height:1.3}
.pills{display:flex;flex-direction:column;gap:3px}
.pill{display:block;padding:2px 7px;border-radius:7px;line-height:1.35}
.pill.b1{background:var(--b1)}.pill.b2{background:var(--b2);color:var(--ink)}.pill.b3{background:var(--b3);color:var(--accent-ink)}
.more{color:var(--muted);font-size:11px;padding-left:4px}
.empty{background:repeating-linear-gradient(45deg,transparent 0 6px,var(--line) 6px 7px)}
.tot{text-align:center;font-weight:750;font-variant-numeric:tabular-nums;background:var(--soft)}
.mkey{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:13px;color:var(--muted)}
.mkey .pill{display:inline-block}
.jl{list-style:none;padding:0;margin:14px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px}
.jl>li{display:flex;gap:14px;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:16px;min-width:0}
.jn{flex:none;display:flex;flex-direction:column;align-items:center;width:64px}
.jn b{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-family:var(--display);font-size:17px}
.jn span{font-size:11px;color:var(--muted);margin-top:4px}
.jl p{margin:0 0 8px}.jh{font-weight:750}.small{font-size:13px;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
.chips span{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:2px 9px;display:flex;gap:6px;align-items:center}
.chips i{width:8px;height:8px;border-radius:50%;background:var(--sc)}
.areas{display:grid;gap:26px;margin-top:14px}
.area header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px}
.area h3{font-size:21px}.tally{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--paper)}
.ct{width:100%;min-width:720px;border-collapse:collapse;font-size:13.5px}
.ct th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--soft);padding:8px 12px}
.ct td{padding:9px 12px;border-top:1px solid var(--line);vertical-align:top}
.cn{font-weight:650;width:30%}.ages{white-space:nowrap;color:var(--muted);font-variant-numeric:tabular-nums;width:70px}
.wh{color:var(--ink)}.wh b{font-weight:650}.none{color:var(--muted);font-style:italic}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:14px;margin-top:14px}
.tile{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:16px;min-width:0}
.tile h3{font-size:18px;margin-bottom:6px}.tile p{margin:0;color:var(--muted)}.tile b.n{font-family:var(--display);font-size:26px;color:var(--accent)}
.tile ul{margin:6px 0 0;padding-left:18px}.tile li{margin:2px 0}
.todo{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin-top:14px}
.todo p{margin:0 0 10px;max-width:80ch}.todo p:last-child{margin:0}
.foot{color:var(--muted);font-size:13px;max-width:80ch}
a{color:var(--accent)}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
</style>
<div class="wrap">
<header>
  <span class="eyebrow">Bizzing English · curriculum coverage · ages 6–14</span>
  <h1>What Bizzing English teaches — seven strands, ten levels, every one filled</h1>
  <p class="lede">Every strand of school English from 6 to 14 — words, sentences, reading, writing, speaking, literature and the language itself — checked against the app as it is built today: <b>${STRANDS.length} strands × 10 levels, ${filled} of 70 levels with stops, ${STOPS.length} stops</b>, of which ${READ.length} are passages from the classics and ${BOOKSTOPS.length} are chapters of ${BOOKS.length} whole books; <b>${WORKS.length} works</b> in the Library (${heldCleared.length} held in full and cleared in the US, UK and India, ${cards.length} as cards); seven games with memory, the Elocution Contest, a Tools shelf with Bee’s Vocabulary, Idioms, Typing Trainer and quotes, Greek myths and 14 author deep dives, My Feed of 5,996 cards, and a writing desk judged only by a grown-up. “Where” names the strand, level and stops that teach it, or the place in the app.</p>
  <div class="key"><span><span class="st ok">Taught</span>a stop, game or room teaches it directly</span><span><span class="st part">Partly</span>used or touched, never taught as its own idea</span><span><span class="st miss">Missing</span>not in the app yet</span></div>
  <div class="tally-row"><div><b>${nOK}</b><small>sub-concepts taught</small></div><div><b>${nPart}</b><small>partly</small></div><div><b>${nMiss}</b><small>missing</small></div><div><b>${shippedPassages.length}</b><small>passages, narrated</small></div><div><b>${BOOKS.reduce((a, b) => a + b.chapters.length, 0)}</b><small>whole-book chapters</small></div></div>
</header>

<section>
  <div class="sec-h"><span class="eyebrow">Seven strands · ten levels</span><h2>What is taught at each level, strand by strand</h2>
  <p>Each row is a strand; each column one of its ten levels. A strand's levels open in order — a child passes a stop on its check and has <i>learned</i> it only when it holds on a later day — and an older child starts higher up. A pill is a stop, shaded by the youngest age it is written for. Reading's stops are passages; level 8 is the whole books.</p></div>
  <div class="mw"><table class="map"><thead><tr><th class="sc">Strand</th>${Array.from({ length: 10 }, (_, i) => `<th>L${i + 1}</th>`).join('')}<th>Stops</th></tr></thead><tbody>${mapRows}</tbody></table></div>
  <div class="mkey"><span class="pill b1">ages 6–7</span><span class="pill b2">ages 8–10</span><span class="pill b3">ages 11–14</span><span>· a hatched cell is a level with nothing in it yet</span></div>
</section>

<section>
  <div class="sec-h"><span class="eyebrow">Three journeys</span><h2>Where each age begins</h2>
  <p>The app never asks a child's age, only an age band. The band picks where each strand starts and which strands are open on day one; the rest open as the child goes.</p></div>
  <ol class="jl">${journeys}</ol>
</section>

<section>
  <div class="sec-h"><span class="eyebrow">${nAll} sub-concepts</span><h2>Every area of school English, and where it lives</h2></div>
  <div class="areas">${tables}</div>
</section>

<section>
  <div class="sec-h"><span class="eyebrow">Beyond the Atlas</span><h2>The rooms around the road</h2></div>
  <div class="grid3">
    <div class="tile"><h3>The Library</h3><p><b class="n">${shippedPassages.length}</b> passages told scene by scene over their paintings in the narrator's voice, each followed by seven exercises built from it. ${WORKS.length} works: ${heldCleared.length} held in full, ${cards.length} cards (modern works are never quoted).</p></div>
    <div class="tile"><h3>Whole books</h3><p>${BOOKS.map((b) => `<b>${esc(b.title)}</b> (${b.chapters.length} chapters)`).join(' and ')} — a chapter a night, with a bookmark, the story so far, the people met so far and the chapters' notes for grown-ups.</p></div>
    <div class="tile"><h3>Play</h3><ul>${games.map(([g, w]) => `<li><b>${esc(g)}</b> — ${esc(w)}</li>`).join('')}</ul></div>
    <div class="tile"><h3>Tools</h3><p>The Stage and the Writing Desk, and from Bizzing Bee: <b>Vocabulary</b> (17 decks), <b>Idioms &amp; Similes</b> (2,368 phrases), the <b>Typing Trainer</b> (15 lessons and a sixty-second test) and <b>Quotes &amp; Poems</b>.</p></div>
    <div class="tile"><h3>My Feed</h3><p><b class="n">5,996</b> cards cut from the app, 300–560 for every level, each with a reason, a question and a link to its exact topic — about twenty a visit, and then it ends.</p></div>
    <div class="tile"><h3>Greek myths and authors</h3><p>15 myths as a journey with the words they gave English; 14 author deep dives, Shakespeare deepest — every fact from the books and the Library’s own data.</p></div>
    <div class="tile"><h3>Games with memory</h3><p>Seven games remember what a child has met: new items first, missed ones back after two days — 84–100% new across ten plays. Every level is three rounds and a final, with stars.</p></div>
    <div class="tile"><h3>The Stage</h3><p>Every speaking level, plus the <b>Elocution Contest</b> against Bizzing Bee's rivals. The microphone measures time, pace, pauses and range on the device — nothing is recorded, and expression is judged by the child and a grown-up.</p></div>
    <div class="tile"><h3>The writing desk</h3><p>Seven kinds of writing, in parts, with a checklist the child ticks and counts — never marks. Only a grown-up's 1–4 rubric on a later day makes a piece “learned”. Nothing written leaves the device.</p></div>
    <div class="tile"><h3>Practice</h3><p>Spaced checks on a later day, and the mistakes deck. A stop is learned at 8 of 10 on a later day and mastered a week after that; a slip drops one step.</p></div>
  </div>
</section>

<section>
  <div class="sec-h"><span class="eyebrow">Still to come</span><h2>What is not taught yet</h2></div>
  <div class="todo">
    <p><b>Missing:</b> ${stillMiss.length ? stillMiss.map(esc).join('; ') : 'nothing'}.</p>
    <p><b>Partly taught</b> (touched, not taught as its own idea): ${stillPart.map(esc).join('; ')}.</p>
    <p><b>Waiting on a person:</b> a named reviewer for ${review} passages and works that carry period attitudes, and for every Language and Word stop that states a date or an origin; the rights of ${gated.length ? gated.map(esc).join(', ') : 'no works'}, held back from every child until all three markets clear them.</p>
  </div>
  <p class="foot">“Taught” means the app has a stop, game or room whose purpose is that idea; every question is drawn by a test that checks one right answer, not in its own text, with no favourite answer slot. Ages are typical ages when the idea is met in UK, US and Indian curricula — a guide, not a statement about any one syllabus. Generated from the app's own data on ${new Date().toISOString().slice(0, 10)}.</p>
</section>
</div>
`;
writeFileSync(ROOT + 'docs/coverage.html', html);
console.log(`coverage: ${STOPS.length} stops, ${filled}/70 levels filled, concepts ${nOK} taught / ${nPart} partly / ${nMiss} missing → docs/coverage.html`);
