/* inkwell-ui.mjs — Inkwell Detective in the BUILT app, in Chromium at its real sub-path (/Bizzing_English/), desktop 1280
   and phone 390 (handover C §2.1.12 IC4–IC7 where a browser can judge them; §1.8 T14/T15; season-one Part 10).

   Case 0 is played from the Agency to Case Solved twice over: on a desktop by KEYBOARD (with one phrase marked by
   press-and-hold, one string dragged and one postcard dragged by mouse), and on a phone by TOUCH (taps only). Along the
   way: clue marks reach the notebook; a link the evidence does not support is rejected with the data's own line from
   Quill and holds until dismissed; a supported one turns the string gold; the washing line shakes on a wrong order and
   holds when right; a wrong accusation returns the child to the document that clears the suspect, with its words lit; the
   right one solves the case; the coins shown at Case Solved equal the change in the wallet; a reload mid-board resumes
   exactly; the hub keeps the family shell (checkShell / checkPageHead []); no page errors, no 4xx, no third-party request;
   on the phone no page scroll during play, marking targets ≥ 44 px, the segmented control symmetric within 4 px; T14
   (no flat colour over 6%, no pure white or black over 2%) and T15 (mirrored HUD, the play centred) on the desk and the
   board, light and night; and no timer anywhere in a case. Tester mode is on, so the unsigned cases show.

   Run after a build:  npx vite build --outDir <dir> && BZ_BUILD=<dir> node test/inkwell-ui.mjs   (SHOTS=<dir> saves screenshots) */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync, readFileSync } from 'node:fs';
import { checkShell, checkPageHead } from '../src/integration/shell-check.mjs';
import * as D from '../src/detective.js';
import { PNG } from './_png.mjs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-site-ink' + (process.env.BZ_BUILD ? '-' + process.pid : ''), PORT = 8700 + Math.floor(Math.random() * 80);
const SHOTS = process.env.SHOTS || null; if (SHOTS) mkdirSync(SHOTS, { recursive: true });
if (!existsSync(BUILD)) { console.log('inkwell-ui: build first (npx vite build, or BZ_BUILD=<dir>)'); process.exit(1); }
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
process.on('exit', () => srv.kill());   // a crashed run must not leave its server answering on the port
process.on('uncaughtException', (e) => { console.log('✗ crashed:', e.message); srv.kill(); process.exit(1); });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`;
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: EXE });
let fail = 0, n = 0; const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } else if (process.env.VERBOSE) console.log('✓', m); };
const ALLOWED = (u) => u.startsWith(`http://127.0.0.1:${PORT}/`) || u.startsWith('data:') || u.startsWith('blob:');
const C0 = JSON.parse(readFileSync(new URL('../src/data/cases/case-00.json', import.meta.url), 'utf8'));
const P0 = D.prepare(C0), SOL = D.solution(C0);
const spanAt = (id) => { const sp = P0.spans.get(id), T = D.tokens(C0, sp.doc).filter((t) => t.span === id); return { doc: sp.doc, from: T[0].i, to: T[T.length - 1].i }; };

async function ctxFor({ phone = false, dark = false } = {}) {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.reqs = []; page.errs = [];
  page.on('request', (r) => page.reqs.push(r.url()));
  page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
  page.on('response', (res) => { if (res.status() >= 400) page.errs.push(`${res.status()} ${res.url()}`); });
  return { ctx, page };
}
const wait = (p, ms = 250) => p.waitForTimeout(ms);
const go = async (p, hash) => { if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await wait(p, 150); } await p.evaluate((h) => { location.hash = h; }, hash); await wait(p, 700); };
const EMO = () => [...document.querySelectorAll('.ink button, .ink h1, .ink h2, .ink h3, .ink a.btn, .bz-ph h1')].map((e) => e.textContent).join(' ').match(/\p{Extended_Pictographic}/gu) || [];
const shot = async (p, name, sel) => { const e = await p.evaluate(`(${EMO})()`).catch(() => []); if (e.length) (p.emoji ||= []).push(`${name}: ${e.join('')}`); if (!SHOTS && !sel) return null; await wait(p, 350); const o = { path: SHOTS ? `${SHOTS}/${name}.png` : undefined }; return sel ? (await p.$(sel)).screenshot(o) : p.screenshot(o); };
const ink = (p) => p.evaluate(() => JSON.parse(JSON.stringify({ cs: window.__bz.S.ink?.cs || null, sub: window.__bz.S.ink?.sub, say: window.__bz.S.ink?.say || null, doc: window.__bz.S.ink?.doc, ret: window.__bz.S.ink?.ret || null })));
const coins = (p) => p.evaluate(() => Number(document.querySelector('.bz-coins')?.textContent.replace(/[^\d]/g, '') || 0));
async function makeKid(page) {
  await page.goto(BASE); await wait(page, 600);
  await page.click('[data-act=ob-start]'); await page.fill('#obn', 'Mira'); await page.click('[data-act=ob-name]');
  await page.click('button:has-text("ages 8–10")'); await page.click('[data-act=ob-face] >> nth=0'); await page.click('[data-act=ob-go]'); await wait(page, 700);
  await page.evaluate(() => { window.__bz.S.h.parent.tester = true; });   // the cases are unsigned: tester mode shows them
}

/* ---------- T14 / T15 / IC5 measures (games-ui.mjs's, on the Inkwell stage) ---------- */
function flatness(buf) {
  const { w, h, pixels } = PNG(buf), N = w * h; let white = 0, black = 0;
  const key = new Int32Array(N); for (let i = 0; i < N; i++) { const [r, g, b] = pixels[i]; key[i] = (r << 16) | (g << 8) | b; if (r >= 250 && g >= 250 && b >= 250) white++; if (r <= 5 && g <= 5 && b <= 5) black++; }
  const seen = new Uint8Array(N), stack = new Int32Array(N); let biggest = 0;
  for (let s = 0; s < N; s++) {
    if (seen[s]) continue; let top = 0, size = 0; stack[top++] = s; seen[s] = 1; const k = key[s];
    while (top) { const p = stack[--top]; size++; const x = p % w, y = (p / w) | 0;
      if (x > 0 && !seen[p - 1] && key[p - 1] === k) { seen[p - 1] = 1; stack[top++] = p - 1; }
      if (x < w - 1 && !seen[p + 1] && key[p + 1] === k) { seen[p + 1] = 1; stack[top++] = p + 1; }
      if (y > 0 && !seen[p - w] && key[p - w] === k) { seen[p - w] = 1; stack[top++] = p - w; }
      if (y < h - 1 && !seen[p + w] && key[p + w] === k) { seen[p + w] = 1; stack[top++] = p + w; } }
    if (size > biggest) biggest = size;
  }
  return { flat: biggest / N, white: white / N, black: black / N };
}
const t14 = (f) => f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02;
const pctf = (f) => `${(f.flat * 100).toFixed(1)}%, ${(f.white * 100).toFixed(1)}%, ${(f.black * 100).toFixed(1)}%`;
const symmetry = (page) => page.evaluate(() => {
  const st = document.querySelector('.stg.ink'); if (!st) return null;
  const s = st.getBoundingClientRect(), box = (q) => { const e = st.querySelector(q); return e ? e.getBoundingClientRect() : null; };
  const l = box('.stg-pod.stg-l'), r = box('.stg-pod.stg-r'), m = box('.stg-mid'), main = st.querySelector('[data-stage-main]'), play = main?.querySelector('[data-play]') || main;
  const p = play.getBoundingClientRect(), cx = s.left + s.width / 2;
  const kids = [...main.children].map((e) => e.getBoundingClientRect()), largest = kids.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a), kids[0] || p);
  return { hud: Math.abs((l.left - s.left) - (s.right - r.right)), podW: Math.abs(l.width - r.width), mid: Math.abs(m.left + m.width / 2 - cx), play: Math.abs(p.left + p.width / 2 - cx),
    playIsLargest: Math.abs(largest.width * largest.height - p.width * p.height) < 2, scrollY: document.documentElement.scrollHeight - innerHeight, scrollX: document.documentElement.scrollWidth - innerWidth };
});
const symOk = (s) => s && s.hud <= 4 && s.podW <= 4 && s.mid <= 4 && s.play <= 4 && s.playIsLargest && s.scrollY <= 1 && s.scrollX <= 0;
const segSym = (page) => page.evaluate(() => {
  const bar = document.querySelector('.ink-segbar'); if (!bar || getComputedStyle(bar).display === 'none') return null;
  const st = document.querySelector('.stg.ink').getBoundingClientRect(), b = bar.getBoundingClientRect(), segs = [...bar.querySelectorAll('.ink-sg')].map((e) => e.getBoundingClientRect());
  const tab = document.querySelector('.bz-tabbar'), tabTop = tab && getComputedStyle(tab).display !== 'none' ? tab.getBoundingClientRect().top : innerHeight;
  return { off: Math.abs((b.left - st.left) - (st.right - b.right)), widths: Math.max(...segs.map((r) => r.width)) - Math.min(...segs.map((r) => r.width)), n: segs.length, under: b.bottom - tabTop, minH: Math.min(...segs.map((r) => r.height)) };
});
async function stageChecks(page, tag, name) {
  const sym = await symmetry(page);
  ok(`${tag} T15 ${name}: HUD mirrored, the play centred and largest, no page scroll`, symOk(sym), JSON.stringify(sym));
  const f = flatness(await shot(page, `${tag.replace(/\s+/g, '-')}-${name}-stage`, '.stg.ink'));
  ok(`${tag} T14 ${name}: no flat colour over 6%, no pure white or black over 2% (${pctf(f)})`, t14(f));
}

/* ---------- playing Case 0 ---------- */
async function waitSub(page, want, ms = 3000) { for (let t = 0; t < ms; t += 100) { if ((await ink(page)).sub === want) return true; await wait(page, 100); } return false; }
async function press(page, key, times = 1) { for (let i = 0; i < times; i++) { await page.keyboard.press(key); await wait(page, 40); } }
async function tap(page, sel, touch) { const el = await page.waitForSelector(sel, { timeout: 4000 }); if (touch) await el.tap(); else await el.click(); await wait(page, 260); }
async function key(page, sel) { await page.focus(sel); await page.keyboard.press('Enter'); await wait(page, 260); }

async function openDocTab(page, doc, touch) { if (await page.$('[data-act=ink-centre][data-arg=doc]')) { if (touch) await tap(page, '[data-act=ink-centre][data-arg=doc]', true); else await key(page, '[data-act=ink-centre][data-arg=doc]'); } const sel = `.dt[data-arg="${doc}"]`; if (touch) await tap(page, sel, true); else await key(page, sel); }
async function markSpan(page, id, { touch = false, hold = false } = {}) {
  const { doc, from, to } = spanAt(id);
  if (touch && (await page.$('.ink-segbar')) && !(await page.$('.ink-desk.seg-doc'))) await tap(page, '[data-act=ink-seg][data-arg=doc]', true);
  await openDocTab(page, doc, touch);
  const before = (await ink(page)).cs.marks.length;
  if (hold) {   // press and hold, then drag across the phrase
    const a = await page.$(`.pp-body .w[data-i="${from}"]`), b = await page.$(`.pp-body .w[data-i="${to}"]`); await a.scrollIntoViewIfNeeded();
    const ra = await a.boundingBox(), rb = await b.boundingBox();
    await page.mouse.move(ra.x + 3, ra.y + ra.height / 2); await page.mouse.down(); await wait(page, 520);
    await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2, { steps: 6 }); await page.mouse.move(rb.x + rb.width - 2, rb.y + rb.height / 2); await page.mouse.up(); await wait(page, 400);
  } else if (touch) {   // tap the first word, tap the last, press Mark
    for (const i of from === to ? [from] : [from, to]) { const w = await page.$(`.pp-body .w[data-i="${i}"]`); await w.scrollIntoViewIfNeeded(); await w.tap(); await wait(page, 200); }
    await tap(page, '[data-act=ink-mark]', true);
  } else {      // keyboard: arrows to the first word, Shift+arrows to the last, Enter
    await page.focus('.pp-body'); await press(page, 'ArrowRight', from); await press(page, 'Shift+ArrowRight', to - from); await page.keyboard.press('Enter'); await wait(page, 300);
  }
  const s = await ink(page); return s.cs.marks.length === before + 1 && s.cs.marks.some((m) => m.id === id);
}
async function askAll(page, touch) {
  for (let round = 0; round < 4; round++) {
    const s = await ink(page), qs = D.questions(C0, s.cs).filter((q) => q.open && !q.asked); if (!qs.length) return true;
    for (const sus of [...new Set(qs.map((q) => q.suspect))]) {
      if (touch && !(await page.$('.ink-desk.seg-sus'))) await tap(page, '[data-act=ink-seg][data-arg=sus]', true);
      if (touch) await tap(page, `[data-act=ink-who][data-arg="${sus}"]`, true); else await key(page, `[data-act=ink-who][data-arg="${sus}"]`);
      for (let k = 0; k < 6; k++) {
        const cs = (await ink(page)).cs, list = D.questions(C0, cs).filter((q) => q.suspect === sus && (q.open || q.asked)), j = list.findIndex((q) => !q.asked); if (j < 0) break;
        if (touch) await tap(page, `[data-act=ink-ask][data-arg="${list[j].id}"]`, true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, String(j + 1)); await wait(page, 200); }
      }
    }
  }
  return D.questions(C0, (await ink(page)).cs).every((q) => !q.open || q.asked);
}
async function link(page, a, b, kind, { touch = false, drag = false } = {}) {
  if (drag) {
    const ea = await page.$(`.bd-card[data-card="${a}"]`), eb = await page.$(`.bd-card[data-card="${b}"]`), ra = await ea.boundingBox(), rb = await eb.boundingBox();
    await page.mouse.move(ra.x + ra.width / 2, ra.y + ra.height / 2); await page.mouse.down(); await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2, { steps: 10 }); await page.mouse.up(); await wait(page, 350);
  } else if (touch) { await tap(page, `.bd-card[data-card="${a}"]`, true); await tap(page, `.bd-card[data-card="${b}"]`, true); }
  else { await page.focus(`.bd-card[data-card="${a}"]`); await page.keyboard.press(' '); await wait(page, 250); await page.focus(`.bd-card[data-card="${b}"]`); await page.keyboard.press(' '); await wait(page, 300); }
  const wheel = !!(await page.$('.wheel'));
  const k = D.DTYPES.indexOf(kind);
  if (touch || drag) await tap(page, `.wh-opt[data-arg="${kind}"]`, touch); else { await page.keyboard.press(String(k + 1)); await wait(page, 350); }
  return wheel;
}

async function playCase0({ phone = false, dark = false, touch = false }) {
  const tag = `${phone ? 'phone' : 'desktop'} ${dark ? 'night' : 'day'} ${touch ? 'touch' : 'keyboard'}`, nm = (x) => `${phone ? 'phone' : 'desktop'}-${dark ? 'dark' : 'light'}-${x}`;
  const { ctx, page } = await ctxFor({ phone, dark });
  await makeKid(page);
  const startCoins = await coins(page);

  /* the Agency: the family shell holds */
  await go(page, '#/inkwell'); await page.waitForSelector('.ink-hub');
  /* checkShell measures the chrome and, on Home, Home's own tiles; on the Agency only the chrome applies */
  const HOME_ONLY = /tile|journey card|tip card|quote card|primary buttons on home|top tiles|home grid|on phone home/i;
  const shellF = (await checkShell(page, { phone })).filter((f) => !HOME_ONLY.test(f)); ok(`${tag}: the Agency keeps the family shell (checkShell [] for the chrome)`, shellF.length === 0, shellF.join('; '));
  const headF = await checkPageHead(page, { phone }); ok(`${tag}: the Agency's page head matches Bee (checkPageHead [])`, headF.length === 0, headF.join('; '));
  ok(`${tag}: the Agency shows the office, the casebook wall, the shelf, the Ledger and the Reading Door`, await page.evaluate(() => ['.ag-scene', '.ag-wall', '.ag-shelf', '.ag-door', '.ag-led'].every((q) => document.querySelector(q))));
  ok(`${tag}: one primary action, "Start your first case"`, await page.evaluate(() => document.querySelectorAll('.ink-hub .btn.ink-go').length === 1 && /first case/i.test(document.querySelector('[data-ink=continue]').textContent)));
  ok(`${tag}: the Agency is the painting (the plate and Quill's cut-out load, no stand-ins)`, await page.evaluate(() => /url\(/.test(document.querySelector('.ag-scene').style.getPropertyValue('--ag')) && !!document.querySelector('.ag-quill img') && !document.querySelector('.ink-hub .ink-standin, .ink-hub .ink-stk-drawn')));
  await shot(page, nm('hub'));
  if (!phone && !dark) { await go(page, '#/inkwell/map'); ok(`${tag}: the town map draws a wax seal for each of the 16 chapters`, (await page.$$('.mp-pin')).length === 16); await shot(page, nm('map')); await go(page, '#/inkwell'); }

  /* into Case 0: the comic opening */
  if (touch) await tap(page, '[data-ink=continue]', true); else await key(page, '[data-ink=continue]');
  ok(`${tag}: Continue opens the comic-panel opening`, await waitSub(page, 'opening') && !!(await page.$('.cpanel')));
  await shot(page, nm('opening'));
  for (let i = 0; i < 8 && (await ink(page)).sub === 'opening'; i++) { if (touch) await tap(page, '[data-act=ink-pnext]', true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, 'ArrowRight'); await wait(page, 200); } }

  /* choose your detective */
  ok(`${tag}: the opening ends at "Choose your detective"`, await waitSub(page, 'persona'));
  const grid = await page.evaluate(() => { const cs = [...document.querySelectorAll('.pcard-d')].map((e) => e.getBoundingClientRect()); return { n: cs.length, cols: new Set(cs.map((r) => Math.round(r.left))).size, rows: new Set(cs.map((r) => Math.round(r.top))).size }; });
  ok(`${tag}: six detective cards, ${phone ? '2 × 3' : '3 × 2'}`, grid.n === 6 && grid.cols === (phone ? 2 : 3) && grid.rows === (phone ? 3 : 2), JSON.stringify(grid));
  ok(`${tag}: the detectives are painted cut-outs, not stand-ins`, await page.evaluate(() => document.querySelectorAll('.pcard-d img.pd-fig').length === 6));
  await shot(page, nm('persona'));
  if (touch) { await tap(page, '[data-act=ink-pick][data-arg=milo]', true); await page.fill('#ink-name', 'Mo'); await tap(page, '[data-act=ink-choose]', true); }
  else { await page.focus('.pcard-d'); await press(page, 'ArrowRight'); await page.keyboard.press('Enter'); await wait(page, 300); await key(page, '[data-act=ink-choose]'); }
  const persona = await page.evaluate(() => window.__bz.S.h.kids[0].inkwell?.persona);
  ok(`${tag}: the detective is chosen (${persona})`, persona === 'milo');
  ok(`${tag}: the desk opens after choosing, with Quill's line`, await waitSub(page, 'desk') && /Good/.test((await ink(page)).say?.text || ''), JSON.stringify((await ink(page)).say));

  /* chapter 1: the scene — mark the clues */
  const ch1 = SOL.marks.filter((id) => D.docOpen(C0, { ...D.newCase(C0) }, spanAt(id).doc));
  let marked = 0;
  for (const [i, id] of ch1.entries()) if (await markSpan(page, id, { touch, hold: !touch && i === 0 })) marked++;
  ok(`${tag}: ${ch1.length} clues marked in chapter 1${!touch ? ' (one by press-and-hold)' : ''}`, marked === ch1.length, `${marked}`);
  ok(`${tag}: the notebook holds the clue cards`, (await page.$$('.ink-nb .nb-card')).length === marked || phone);
  if (!phone) await stageChecks(page, tag, 'desk');
  if (phone) {
    const ic5 = await page.evaluate(() => { const ws = [...document.querySelectorAll('.pp-body .w')].map((e) => e.getBoundingClientRect().height); return { min: Math.min(...ws), scroll: document.documentElement.scrollHeight - innerHeight }; });
    ok(`${tag} IC5: marking targets are at least 44 px tall (${ic5.min.toFixed(1)})`, ic5.min >= 44);
    ok(`${tag} IC5: no page scroll in the document view (${ic5.scroll})`, ic5.scroll <= 1);
    const sg = await segSym(page); ok(`${tag} IC5: the segmented control is centred within 4 px, four equal segments, above the tab bar`, sg && sg.off <= 4 && sg.widths <= 1 && sg.n === 4 && sg.under <= 0 && sg.minH >= 44, JSON.stringify(sg));
    await stageChecks(page, tag, 'desk');
  }
  ok(`${tag}: the desk stands on the case's painted plate; suspects are cut-outs`, await page.evaluate(() => /url\(/.test(document.querySelector('.stg.ink').style.getPropertyValue('--ink-plate')) && document.querySelectorAll('.sus-pic img').length >= 3 && !document.querySelector('.sus-pic .ink-standin')));
  await shot(page, nm('desk'));

  /* no timer in a case: nothing counts down and the state does not move by itself */
  { const a = JSON.stringify((await ink(page)).cs); await wait(page, 2200); const b = JSON.stringify((await ink(page)).cs);
    ok(`${tag}: no timer in a case (no clock on screen; the case state does not change while the child waits)`, a === b && !(await page.$('.stg.ink .stg-time, .stg.ink [role=timer]'))); }

  /* chapter 2: interviews */
  if (touch) { if (phone) await tap(page, '[data-act=ink-ch][data-arg="2"]', true); else await tap(page, '.ink-next', true); } else await key(page, '.ink-next');
  ok(`${tag}: chapter 2 opens`, (await ink(page)).cs.chapter === 2);
  ok(`${tag}: every question asked; each answer is a document on the desk`, await askAll(page, touch));
  ok(`${tag}: the interview shows the suspect's cut-out with an expression`, await page.evaluate(() => !!document.querySelector('.iv-fig [data-expr], .iv-fig .ink-standin')) || phone);
  await shot(page, nm('interview'));
  marked = 0; const ch2 = SOL.marks.filter((id) => !ch1.includes(id));
  for (const id of ch2) if (await markSpan(page, id, { touch })) marked++;
  ok(`${tag}: ${ch2.length} more clues marked from the interviews`, marked === ch2.length, `${marked}`);

  /* chapter 3: the board */
  if (touch) await tap(page, '[data-act=ink-seg][data-arg=board]', true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, 'b'); }
  ok(`${tag}: the board opens (${touch ? 'the Board segment' : 'B'})`, await waitSub(page, 'board'));
  await shot(page, nm('board'));
  // a link the evidence does not support: slack string, the data's own line, held until dismissed
  { const cs = (await ink(page)).cs, v = D.judgeLink(C0, cs, 'flour', 'strangers', 'contradiction');
    await link(page, 'flour', 'strangers', 'contradiction', { touch });
    const s = await ink(page);
    ok(`${tag}: an unsupported link is rejected — no string kept`, s.cs.links.length === 0 && !v.ok);
    ok(`${tag}: Quill answers with the case's own line, and it holds until dismissed`, s.say?.hold && s.say.text === v.quill && !!(await page.$('.ink-say.hold [data-act=ink-cont]')), JSON.stringify(s.say));
    await shot(page, nm('board-rejected'));
    if (touch) await tap(page, '[data-act=ink-cont]', true); else { await page.keyboard.press('Enter'); await wait(page, 250); }
    ok(`${tag}: Continue dismisses it`, !(await ink(page)).say?.hold); }
  // the supported links: gold
  let golds = 0;
  for (const [i, l] of SOL.links.entries()) {
    const wheel = await link(page, l.a, l.b, l.kind, { touch, drag: !touch && i === 1 });
    const s = await ink(page); if (s.cs.links.some((x) => x.a === l.a && x.b === l.b)) golds++;
    if (i === 0) { ok(`${tag}: the deduction wheel opens for two cards`, wheel); ok(`${tag}: a supported link turns the string gold`, (await page.$$('.bd-strings .str.gold')).length === 1 && s.say?.tone === 'gold'); await shot(page, nm('board-gold')); }
  }
  ok(`${tag}: ${SOL.links.length} gold strings${!touch ? ' (one dragged)' : ''}; the board clears`, golds === SOL.links.length && D.boardReady(C0, (await ink(page)).cs), `${golds}`);

  /* IC7: a case paused mid-board resumes exactly after a reload */
  if (!touch) {
    const before = (await ink(page)).cs;
    await page.reload(); await wait(page, 1500);
    const after = await ink(page);
    ok(`${tag} IC7: after a reload the case resumes on the board, exactly`, after.sub === 'board' && JSON.stringify(after.cs.marks) === JSON.stringify(before.marks) && JSON.stringify(after.cs.links) === JSON.stringify(before.links) && JSON.stringify(after.cs.proved) === JSON.stringify(before.proved), `${after.sub}`);
    await page.evaluate(() => { window.__bz.S.h.parent.tester = true; });
  }
  if (phone) await stageChecks(page, tag, 'board'); else await stageChecks(page, tag, 'board');

  /* chapter 4: the washing line — a wrong order shakes and holds; the right one holds the line */
  if (touch) await tap(page, '.ink-next', true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, 't'); }
  ok(`${tag}: the timeline opens (${touch ? 'Next' : 'T'})`, await waitSub(page, 'timeline'));
  await shot(page, nm('timeline'));
  const order = SOL.timeline.slice(); const wrong = [order[1], order[0], ...order.slice(2)];
  for (const [i, ev] of wrong.entries()) {
    if (touch) { await tap(page, `.tl-card[data-ev="${ev}"]`, true); await tap(page, `[data-act=ink-tslot][data-arg="${i}"]`, true); }
    else if (i === 2) {   // one postcard by mouse drag
      const c = await page.$(`.tl-card[data-ev="${ev}"]`), t = await page.$(`.tl-peg[data-at="${i}"]`), rc = await c.boundingBox(), rt = await t.boundingBox();
      await page.mouse.move(rc.x + rc.width / 2, rc.y + rc.height / 2); await page.mouse.down(); await page.mouse.move(rt.x + rt.width / 2, rt.y + rt.height / 2, { steps: 10 }); await page.mouse.up(); await wait(page, 300);
    } else { await page.focus(`.tl-card[data-ev="${ev}"]`); await page.keyboard.press(' '); await wait(page, 200); await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press(' '); await wait(page, 250); }
  }
  { const s = await ink(page); ok(`${tag}: a wrong order shakes the line and Quill's line holds`, !s.cs.timeline.done && s.say?.hold && s.cs.timeline.checks === 1 && !!(await page.$('.tline.shake, .tl-card.clash')), JSON.stringify(s.cs.timeline));
    await shot(page, nm('timeline-shake'));
    if (touch) await tap(page, '[data-act=ink-cont]', true); else { await page.keyboard.press('Enter'); await wait(page, 250); } }
  // swap the first two back: pick the card on peg 2 and put it on peg 1
  if (touch) { await tap(page, `.tl-card[data-ev="${order[0]}"]`, true); await tap(page, `.tl-card[data-ev="${order[1]}"]`, true); }   // hold one postcard, tap the one it swaps with
  else { await page.focus(`.tl-card[data-ev="${order[0]}"]`); await page.keyboard.press(' '); await wait(page, 200); await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press(' '); await wait(page, 300); }
  { const s = await ink(page); ok(`${tag}: the right order holds the line`, s.cs.timeline.done && D.timelineDone(C0, s.cs), JSON.stringify(s.cs.timeline)); }
  if (await page.$('.ink-say.hold')) { await page.keyboard.press('Enter'); await wait(page, 200); }

  /* chapter 5: the accusation — wrong first, back to the right document; then right */
  if (touch) await tap(page, '.ink-next', true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, 'a'); }
  ok(`${tag}: the drawing room opens (${touch ? 'Next' : 'A'})`, await waitSub(page, 'accuse'));
  ok(`${tag}: the Knack rests in the accusation`, (await ink(page)).cs.chapter === 5 && /alone/.test(await page.evaluate(() => document.querySelector('.ac-go small')?.textContent || '')));
  const pickEv = async (ids) => { for (const id of ids) { if (touch) await tap(page, `[data-act=ink-ev][data-arg="${id}"]`, true); else await key(page, `[data-act=ink-ev][data-arg="${id}"]`); } };
  const placeIt = async (o) => { if (!o) return; if (touch) await tap(page, `[data-act=ink-place][data-arg="${o}"]`, true); else await key(page, `[data-act=ink-place][data-arg="${o}"]`); };
  { const accusable = D.accusable(C0, (await ink(page)).cs), j = accusable.indexOf('prout');
    if (touch) await tap(page, '[data-act=ink-culprit][data-arg=prout]', true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, String(j + 1)); await wait(page, 200); }
    await pickEv(SOL.accusation.evidence); await placeIt(SOL.accusation.place);
    await shot(page, nm('accuse'));
    const v = D.judgeAccusation(C0, (await ink(page)).cs, { culprit: 'prout', evidence: SOL.accusation.evidence, place: SOL.accusation.place });
    if (touch) await tap(page, '[data-act=ink-accuse]', true); else await key(page, '[data-act=ink-accuse]');
    const s = await ink(page);
    ok(`${tag} IC4: a wrong accusation does not end the case, and Quill says the data's line`, !s.cs.solved && s.say?.hold && s.say.text === v.say.text, JSON.stringify(s.say));
    await shot(page, nm('accuse-wrong'));
    if (touch) await tap(page, '[data-act=ink-cont]', true); else { await page.keyboard.press('Enter'); await wait(page, 400); }
    const r = await ink(page);
    ok(`${tag} IC4: it returns the child to the document that clears the suspect (${v.returnTo?.doc}), its words lit`, r.sub === 'desk' && r.doc === v.returnTo.doc && (await page.$$('.pp-body .w.ret')).length > 0, `${r.sub} ${r.doc}`);
    await shot(page, nm('returned')); }
  if (touch) await tap(page, '[data-act=ink-ch][data-arg="5"]', true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, 'a'); }
  await waitSub(page, 'accuse');
  { const s0 = await ink(page);
    if (touch) await tap(page, `[data-act=ink-culprit][data-arg=${SOL.accusation.culprit}]`, true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, String(D.accusable(C0, s0.cs).indexOf(SOL.accusation.culprit) + 1)); await wait(page, 200); }
    const have = (await ink(page)); const pinned = await page.evaluate(() => window.__bz.S.ink.acc.ev.slice());
    for (const id of pinned) if (!SOL.accusation.evidence.includes(id)) { if (touch) await tap(page, `[data-act=ink-ev][data-arg="${id}"]`, true); else await key(page, `[data-act=ink-ev][data-arg="${id}"]`); }
    const still = await page.evaluate(() => window.__bz.S.ink.acc.ev.slice());
    await pickEv(SOL.accusation.evidence.filter((x) => !still.includes(x)));
    if (!(await page.evaluate(() => window.__bz.S.ink.acc.place))) await placeIt(SOL.accusation.place);
    void have;
    if (touch) await tap(page, '[data-act=ink-accuse]', true); else await key(page, '[data-act=ink-accuse]');
    ok(`${tag}: the right accusation solves the case and plays the reveal`, (await ink(page)).cs.solved && await waitSub(page, 'reveal'));
    await shot(page, nm('reveal')); }
  for (let i = 0; i < 30 && (await ink(page)).sub === 'reveal'; i++) { if (touch) await tap(page, '[data-act=ink-rnext]', true); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, 'ArrowRight'); await wait(page, 120); } }
  ok(`${tag}: Case Solved: the stamp, the object on the shelf`, await waitSub(page, 'solved') && !!(await page.$('.sv-stamp')) && !!(await page.$('.sv-obj')));
  await wait(page, 600);
  { const shown = await page.evaluate(() => Number(document.querySelector('[data-coins]')?.dataset.coins)), now = await coins(page);
    ok(`${tag}: the coins shown at Case Solved (${shown}) equal the change in the wallet (${now - startCoins})`, shown === now - startCoins && shown > 0); }
  await shot(page, nm('solved'));
  // the Word Hoard card: one question; a right answer files it
  { const card = await page.$('.oc-q .btn'); ok(`${tag}: the Word Hoard card turns over with its one question`, !!card); if (card) { const ans = await page.evaluate(() => { const q = window.__bz.S.ink.closed?.card?.question; return q ? q.options.indexOf(q.answer) : -1; });
      if (touch) await (await page.$$('.oc-q .btn'))[ans].tap(); else { await page.evaluate(() => document.activeElement?.blur()); await press(page, String(ans + 1)); } await wait(page, 400);
      ok(`${tag}: the Word Hoard card is answered and filed`, !!(await page.$('.oc-ok'))); } }
  { const shown = await page.evaluate(() => Number(document.querySelector('[data-coins]')?.dataset.coins)), now = await coins(page);
    ok(`${tag}: after the Word Hoard card the coins shown still equal the wallet's change (${shown} = ${now - startCoins})`, shown === now - startCoins); }
  // back at the Agency: the shelf has its object and the wall its stamp
  if (touch) await tap(page, '[data-arrive]', true); else await key(page, '[data-arrive]');
  await page.waitForSelector('.ink-hub');
  ok(`${tag}: the Agency's shelf holds Case 0's object and the wall its pin`, !!(await page.$('.ag-obj')) && !!(await page.$('.ag-pin.solved')));
  await shot(page, nm('hub-after'));
  if (!touch) { await go(page, '#/inkwell/map'); ok(`${tag}: the map walks the detective to the next pin`, !!(await page.$('.mp-walker:not(.still)')) && !!(await page.$('.mp-pin.cur'))); await shot(page, nm('map-walk')); }
  /* the other rooms open: Training Desk, Word Hoard, Detective School */
  for (const [h, sel, name] of [['#/inkwell/desk/case-00', '.tdesk', 'training-desk'], ['#/inkwell/hoard', '.hoard', 'hoard'], ['#/inkwell/school', '.chalks', 'school'], ['#/inkwell/detective', '.pd-grid', 'coats']]) {
    await go(page, h); ok(`${tag}: ${h} draws`, !!(await page.$(sel))); const f = await checkPageHead(page, { phone }); ok(`${tag}: ${h} page head matches Bee`, f.length === 0, f.join('; ')); await shot(page, nm(name));
    const w = await page.evaluate(() => document.documentElement.scrollWidth); ok(`${tag}: ${h} does not scroll sideways (${w})`, w <= (phone ? 390 : 1280));
  }
  if (!phone) { await go(page, '#/inkwell/school/spotter'); await wait(page, 600); ok(`${tag}: Clue Spotter is the one timed drill: a clock, from a solved case`, !!(await page.$('.stg-time')) && (await page.$$('.sp-w')).length > 0); await shot(page, nm('spotter')); await go(page, '#/inkwell'); }
  /* the browser's view of all of it */
  ok(`${tag}: no page errors and no 4xx`, page.errs.length === 0, page.errs.slice(0, 4).join(' | '));
  ok(`${tag}: no third-party requests`, page.reqs.every(ALLOWED), page.reqs.filter((u) => !ALLOWED(u)).slice(0, 3).join(' '));
  ok(`${tag}: no emoji in the Inkwell controls and headings (every screen visited)`, !page.emoji?.length, (page.emoji || []).slice(0, 3).join(' | '));
  await ctx.close();
}

await playCase0({ phone: false, dark: false, touch: false });
await playCase0({ phone: true, dark: true, touch: true });
/* IC6 also asks the other two corners: desktop at night, the phone by day — the desk and the board on the stage */
for (const [phone, dark] of [[false, true], [true, false]]) {
  const tag = `${phone ? 'phone' : 'desktop'} ${dark ? 'night' : 'day'}`, { ctx, page } = await ctxFor({ phone, dark });
  await makeKid(page); await page.evaluate(() => { const k = window.__bz.S.h.kids[0]; k.inkwell = { v: 1, cases: {}, closed: {}, persona: 'thea', level: { n: 1, pick: null }, hoard: {}, found: {}, school: {} }; });
  await go(page, '#/inkwell/case/case-00/desk'); await page.waitForSelector('.ink-desk'); await stageChecks(page, tag, 'desk');
  await go(page, '#/inkwell'); const f = flatness(await shot(page, `${tag.replace(' ', '-')}-hub-stage`, '.ag-scene')); ok(`${tag} T14 the Agency painting (${pctf(f)})`, t14(f));
  ok(`${tag}: no page errors and no 4xx`, page.errs.length === 0, page.errs.slice(0, 4).join(' | '));
  await ctx.close();
}

await browser.close(); srv.kill();
console.log(`inkwell-ui: ${n - fail}/${n} passed`);
process.exit(fail ? 1 : 0);
