/* podium-ui.mjs — THE PODIUM in the BUILT app, in Chromium (HANDOVER C §2.2.6). Run after a build
   (BZ_BUILD=<dir> to point at another build, as test/ui.mjs does). BZ_ONLY=1,4 runs those sections.

   The microphone is Chromium's fake one: its own beep (section 1–3), or a sound file made by
   test/podium-audio.mjs and played through --use-file-for-fake-audio-capture (sections 4–5): silence,
   constant noise, rhythmic noise, a six-second stop, and a speech-like voice. Nothing real is ever heard.

   Checks: the page head, the shell's Tools tab lit on the Stage, #/stage/contest → #/stage/podium, Tools links
   to the Podium; the microphone opens only on Start, every track has ended within 100 ms of Stop, on leaving
   the page, on pagehide and when the tab is hidden (the take is not counted); ST4 — on a phone the text stays in
   view while recording and the page does not scroll; T15 — the HUD and the benches mirrored, the frame and the
   controls centred within 4 px; T14 — no flat colour over 6%, no pure white or black over 2%; the planner by
   keyboard, by mouse drag and by touch; ST3 — the same shape with other words gets the same marks; ST1 — a beep,
   silence, constant noise, rhythmic noise and a six-second stop score 0 and earn 0; a speech-like voice passes
   and pays; a whole tournament: the finish card's coins equal the wallet's change (T6), the typed plans never in
   a backup and cleared at the end; nothing transmitted (no request leaves 127.0.0.1, no POST at all). */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync, writeFileSync } from 'node:fs';
import { checkPageHead } from '../src/integration/shell-check.mjs';
import { makeBackup } from '../src/backup.js';
import { PNG } from './_png.mjs';
import * as A from './podium-audio.mjs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-podium-' + process.pid, PORT = 8990 + Math.floor(Math.random() * 100);
if (!existsSync(BUILD)) { console.log('podium-ui: run `npm run build` first'); process.exit(1); }
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
const WAVS = SITE + '-wav'; rmSync(WAVS, { recursive: true, force: true }); mkdirSync(WAVS);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`;
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const ONLY = process.env.BZ_ONLY ? process.env.BZ_ONLY.split(',').map(Number) : null, want = (k) => !ONLY || ONLY.includes(k);
let fail = 0, n = 0; const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } };
const ALLOWED = (u) => u.startsWith(`http://127.0.0.1:${PORT}/`) || u.startsWith('data:') || u.startsWith('blob:');
const BEE_AUDIO = 'https://raw.githubusercontent.com/aayuvis/Bizzing-Bee/main/spellbound-app/voice/w/';

const browsers = [];
async function launch(wav = null) {
  const args = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'];
  if (wav) { const f = `${WAVS}/${wav.name}.wav`; writeFileSync(f, A.wav(wav.samples)); args.push(`--use-file-for-fake-audio-capture=${f}`); }
  const b = await chromium.launch({ executablePath: EXE, args }); browsers.push(b); return b;
}
async function ctxFor(browser, { phone = false, dark = false } = {}) {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light', permissions: ['microphone'] });
  const page = await ctx.newPage(); page.reqs = []; page.posts = []; page.errs = [];
  page.on('request', (r) => { page.reqs.push(r.url()); if (r.method() !== 'GET') page.posts.push(`${r.method()} ${r.url()}`); });
  page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
  page.on('response', (res) => { if (res.status() >= 400) page.errs.push(`${res.status()} ${res.url()}`); });
  await page.route((u) => u.href.startsWith(BEE_AUDIO), (r) => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }));
  await page.addInitScript(() => {   // every microphone track, and the moment each was stopped
    window.__tracks = []; const md = navigator.mediaDevices; if (!md) return; const g = md.getUserMedia.bind(md);
    md.getUserMedia = async (c) => { const s = await g(c); for (const t of s.getTracks()) { const stop = t.stop.bind(t); t.stop = () => { t.__stoppedAt = performance.now(); stop(); }; window.__tracks.push(t); } return s; };
  });
  return { ctx, page };
}
const go = async (p, hash) => { if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); } await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(500); };
async function makeKid(page, name = 'Mira', band = '8–10') {
  await page.goto(BASE); await page.waitForTimeout(600);
  await page.click('[data-act=ob-start]'); await page.fill('#obn', name); await page.click('[data-act=ob-name]');
  await page.click(`button:has-text("ages ${band}")`); await page.click('[data-act=ob-face] >> nth=0'); await page.click('[data-act=ob-go]');
  await page.waitForTimeout(700);
  await page.evaluate(() => { const k = window.__bz.S.h.kids[0]; k.stops['sp1-aloud'] = { passed: true, tries: 1 }; });   // the Stage's one gate: a passage read aloud before
}
const S = (page) => page.evaluate(() => { const r = window.__bz.S.run, k = window.__bz.S.h.kids[0]; return { view: r?.view, act: r?.act, live: r?.live, err: r?.err, res: r?.res, ev: r?.last?.ev, end: r?.end ? { coins: r.end.coins, total: r.end.total, place: r.end.place } : null, cur: k.podium?.cur || null, podium: k.podium, writing: k.writing?.podium || null }; });
const wallet = (page, who) => page.evaluate((w) => { try { return JSON.parse(localStorage.getItem('bizzing.wallet')).kids[w]?.coins || 0; } catch { return 0; } }, who);
const tracks = (page) => page.evaluate(() => window.__tracks.map((t) => t.readyState));
/* set the round's text by id (the harness's choice of a poem whose syllables fit the made-up voice) */
const useText = (page, poem, passage = poem) => page.evaluate(([a, b]) => { const t = window.__bz.S.h.kids[0].podium.cur; t.poem = a; t.passage = b; window.__bz.render(); }, [poem, passage]);
async function enter(page, { level = null } = {}) {
  await go(page, '#/stage/podium');
  if (level) await page.click(`[data-act=pd-level][data-arg="${level}"]`);
  await page.click('[data-act=pd-new]'); await page.waitForTimeout(250);
}
/* a take: Start, wait, Stop; returns how long after the click every track had ended */
async function take(page, secs) {
  await page.click('[data-act=pd-start]'); await page.waitForTimeout(secs * 1000);
  return page.evaluate(() => { const b = document.querySelector('[data-act=pd-stop]'); const t0 = performance.now(); b.click(); const ts = window.__tracks.map((t) => [t.readyState, (t.__stoppedAt ?? Infinity) - t0]); return { ended: ts.every((x) => x[0] === 'ended'), ms: Math.max(...ts.map((x) => x[1])) }; });
}
/* the planner, by choosing: each card a line (keys), then one device dragged onto the hook (mouse) */
async function choosePlan(page, { touch = false } = {}) {
  for (const [card, i] of [['hook', 0], ['p1', 0], ['p2', 1], ['p3', 1], ['close', 0]]) {
    if (touch) await page.tap(`.pd-card[data-card=${card}] .pd-line >> nth=${i}`);
    else { await page.focus(`.pd-card[data-card=${card}] .pd-line >> nth=0`); await page.keyboard.press(String(i + 1)); }
    await page.waitForTimeout(80);
  }
}
async function addDevice(page, card, { touch = false } = {}) {
  const dev = await page.evaluate((c) => { const k = window.__bz.S.h.kids[0], t = k.podium.cur, rid = t.round === 2 ? 'prepared' : 'final'; return k.writing.podium[rid][c]; }, card);
  const chip = touch ? null : await page.$('.pd-dev >> nth=0');
  if (touch) { await page.tap('.pd-dev >> nth=0'); await page.waitForTimeout(100); if (!(await page.$(`[data-act=pd-drop][data-arg=${card}]`))) await page.tap('.pd-dev >> nth=1'); await page.waitForTimeout(100); await page.tap(`[data-act=pd-drop][data-arg=${card}]`); }
  else {
    const a = await chip.boundingBox(), b = await (await page.$(`.pd-card[data-card=${card}]`)).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(a.x + 40, a.y - 30, { steps: 4 }); await page.mouse.move(b.x + b.width / 2, b.y + 20, { steps: 8 }); await page.mouse.up();
  }
  await page.waitForTimeout(200);
  if (!(await page.$('.pd-ver'))) return { picked: false, before: dev };
  if (touch) await page.tap('.pd-ver .pd-line >> nth=0'); else await page.keyboard.press('1');
  await page.waitForTimeout(150); return { picked: true, before: dev };
}

/* ---------- 1. the screens: head, shell, routes, T14/T15, ST4, desktop + phone, light + dark ---------- */
if (want(1)) {
  const browser = await launch();
  for (const phone of [false, true]) for (const dark of [false, true]) {
    const tag = `${phone ? 'phone' : 'desktop'} ${dark ? 'dark' : 'light'}`, { ctx, page } = await ctxFor(browser, { phone, dark });
    await makeKid(page, 'Mira');
    await go(page, '#/stage/contest');
    ok(`${tag}: #/stage/contest opens the Podium`, page.url().endsWith('#/stage/podium') && !!(await page.$('[data-stage=podium-lobby]')));
    const f = await checkPageHead(page, { phone }); ok(`${tag}: the page head matches the family's`, f.length === 0, f.join('; '));
    ok(`${tag}: the Tools tab is lit on the Stage`, await page.evaluate(() => [...document.querySelectorAll('[aria-current="page"], .on, .active')].some((e) => /Tools/.test(e.textContent))));
    ok(`${tag}: the microphone is not opened by visiting the Podium`, (await tracks(page)).length === 0);
    await page.click('[data-act=pd-new]'); await page.waitForTimeout(300);
    ok(`${tag}: a tournament begins at the poem, saved at once`, (await S(page)).view === 'stage' && await page.evaluate(() => JSON.parse(localStorage.getItem('bizzing-english.household')).kids[0].podium.cur.round === 0));
    /* T15 */
    const sym = await page.evaluate(() => { const st = document.querySelector('.stg').getBoundingClientRect(), pods = [...document.querySelectorAll('.stg-hud > .stg-pod')].map((e) => e.getBoundingClientRect()), fr = document.querySelector('.pd-frame').getBoundingClientRect(),
      bl = document.querySelector('.pd-bench.l').getBoundingClientRect(), br = document.querySelector('.pd-bench.r').getBoundingClientRect(), ctl = [...document.querySelectorAll('.stg-ctl > *')].map((e) => e.getBoundingClientRect()), cl = Math.min(...ctl.map((c) => c.left)), cr = Math.max(...ctl.map((c) => c.right)), mid = (st.left + st.right) / 2;
      return { hud: Math.abs((pods[0].left - st.left) - (st.right - pods[1].right)), pods: Math.abs(pods[0].width - pods[1].width), frame: Math.abs((fr.left + fr.right) / 2 - mid), benches: Math.abs(bl.width - br.width) + Math.abs(((bl.left + br.right) / 2) - mid), ctl: Math.abs((cl + cr) / 2 - mid), scroll: document.documentElement.scrollWidth }; });
    ok(`${tag}: T15 the HUD is mirrored within 4 px (${sym.hud.toFixed(1)}, pods ${sym.pods.toFixed(1)})`, sym.hud <= 4 && sym.pods <= 4);
    ok(`${tag}: T15 the frame is centred (${sym.frame.toFixed(1)}), the benches mirrored (${sym.benches.toFixed(1)}), the controls centred (${sym.ctl.toFixed(1)})`, sym.frame <= 4 && sym.benches <= 4 && sym.ctl <= 4);
    ok(`${tag}: no sideways scroll (${sym.scroll})`, sym.scroll <= (phone ? 390 : 1280));
    /* T14 */
    await page.evaluate(() => document.querySelectorAll('.stg *').forEach((e) => { e.style.animation = 'none'; }));
    const png = await (await page.$('.stg')).screenshot(), shot = PNG(png), bins = new Map(); let white = 0, black = 0;
    if (process.env.BZ_SHOTS) writeFileSync(`${process.env.BZ_SHOTS}/podium-${tag.replace(' ', '-')}.png`, png);
    for (const [r, g, b] of shot.pixels) { if (r >= 250 && g >= 250 && b >= 250) white++; if (r <= 5 && g <= 5 && b <= 5) black++; const k = (r >> 3) << 10 | (g >> 3) << 5 | b >> 3; bins.set(k, (bins.get(k) || 0) + 1); }
    const N = shot.pixels.length, flat = Math.max(...bins.values()) / N;
    ok(`${tag}: T14 no flat colour over 6% of the stage (${(flat * 100).toFixed(1)}%)`, flat <= 0.06);
    ok(`${tag}: T14 no pure white or black over 2% (${((white / N) * 100).toFixed(1)}% / ${((black / N) * 100).toFixed(1)}%)`, white / N <= 0.02 && black / N <= 0.02);
    /* ST4: while recording, the text stays in view and the page does not scroll */
    await page.click('[data-act=pd-start]'); await page.waitForTimeout(700);
    const st4 = await page.evaluate(() => { const fr = document.querySelector('.pd-frame').getBoundingClientRect(), tb = document.querySelector('.bz-tabbar'), lim = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().top : innerHeight, stop = document.querySelector('[data-act=pd-stop]').getBoundingClientRect();
      return { top: fr.top, bottom: fr.bottom, h: fr.height, lim, stop: stop.bottom, scroll: document.documentElement.scrollHeight - innerHeight }; });
    ok(`${tag}: ST4 the reading frame is in view while recording (${Math.round(st4.top)}–${Math.round(st4.bottom)} of ${Math.round(st4.lim)}), Stop too`, st4.top >= 0 && st4.bottom <= st4.lim && st4.h >= 120 && st4.stop <= st4.lim);
    ok(`${tag}: ST4 the page does not scroll while recording (${st4.scroll}px)`, st4.scroll <= 1);
    const t1 = await page.evaluate(() => { const b = document.querySelector('[data-act=pd-stop]'), t0 = performance.now(); b.click(); return { ended: window.__tracks.every((t) => t.readyState === 'ended'), ms: Math.max(...window.__tracks.map((t) => (t.__stoppedAt ?? Infinity) - t0)) }; });
    ok(`${tag}: ST5 Stop ends every track within 100 ms (${t1.ms.toFixed(1)} ms)`, t1.ended && t1.ms <= 100);
    ok(`${tag}: no emoji in a control or heading`, !(await page.evaluate(() => [...document.querySelectorAll('button, h1, h2, h3, .btn')].map((e) => e.textContent).join(' ').match(/\p{Extended_Pictographic}/u))));
    ok(`${tag}: no page errors and no 4xx/5xx`, page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
    ok(`${tag}: nothing transmitted (local requests only, no POST)`, page.reqs.every(ALLOWED) && page.posts.length === 0, [...page.reqs.filter((u) => !ALLOWED(u)), ...page.posts].slice(0, 3).join(' '));
    await ctx.close();
  }
  /* Tools links to the Podium; the Stage offers it */
  const { ctx, page } = await ctxFor(browser); await makeKid(page, 'Tia');
  await go(page, '#/tools'); ok('Tools: a card goes straight to the Podium', !!(await page.$('a[href="#/stage/podium"]')));
  await go(page, '#/stage'); ok('the Stage offers the Podium with Bee’s rivals', /The Podium/.test(await page.textContent('main')) && (await page.$$('.rivalrow img')).length === 5 && !!(await page.$('a[href="#/stage/podium"]')));
  await ctx.close();
}

/* ---------- 2. the microphone: on a tap only; off on Stop, on leaving, on pagehide, when hidden; a beep earns 0 ---------- */
if (want(2)) {
  const browser = await launch(), { ctx, page } = await ctxFor(browser);
  await makeKid(page, 'Ravi'); const w0 = await wallet(page, 'ravi');
  await enter(page);
  ok('mic: entering a tournament does not open the microphone', (await tracks(page)).length === 0);
  await page.click('[data-act=pd-act][data-arg=rehearse]'); await page.waitForTimeout(150);
  ok('mic: choosing to rehearse does not open it either', (await tracks(page)).length === 0);
  const reh = await take(page, 1.2);
  ok(`mic: the rehearsal's Stop ends every track (${reh.ms.toFixed(1)} ms)`, reh.ended && reh.ms <= 100);
  ok('mic: the rehearsal is practice — its evidence shown, nothing scored, the rehearsal used', (await S(page)).view === 'practice' && /practice/i.test(await page.textContent('.stg')) && (await S(page)).cur.rounds[0].rehearsed && !(await S(page)).cur.rounds[0].done);
  await page.click('[data-act=pd-act][data-arg=perform]'); await page.waitForTimeout(150);
  ok('mic: one rehearsal a round — the button is spent', await page.$eval('[data-act=pd-act][data-arg=rehearse]', (b) => b.disabled));
  /* the Chromium beep, as the performance: ST1 */
  const beep = await take(page, 3);
  const s1 = await S(page);
  ok(`ST1 (Chromium's beep): the performance's Stop ends every track (${beep.ms.toFixed(1)} ms)`, beep.ended && beep.ms <= 100);
  ok(`ST1 (Chromium's beep): no speech evidence, 0 points (${s1.ev?.checks.filter((c) => !c.ok).map((c) => c.id)})`, s1.ev && !s1.ev.ok && s1.res.total === 0 && s1.cur.rounds[0].total === 0);
  ok('ST1 (Chromium\'s beep): earns 0 and says so kindly, never "wrong"', (await wallet(page, 'ravi')) === w0 && !s1.cur.rounds[0].paid && /couldn’t hear the words/.test(await page.textContent('.stg')) && !/wrong/i.test(await page.textContent('.stg')));
  /* hidden tab mid-take: the microphone goes off, the take is not counted */
  await page.click('[data-act=pd-retry]'); await page.waitForTimeout(150);
  await page.click('[data-act=pd-start]'); await page.waitForTimeout(600);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(150);
  ok('mic: a hidden tab switches the microphone off', (await tracks(page)).every((t) => t === 'ended'));
  const sh = await S(page); ok('mic: …and the take is not counted', !sh.live && /hidden/.test(sh.err) && !sh.cur.rounds[0].done);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  /* pagehide mid-take */
  await page.click('[data-act=pd-start]'); await page.waitForTimeout(500);
  ok('mic: Start opens it again, on a tap', (await tracks(page)).at(-1) === 'live');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.waitForTimeout(100);
  ok('mic: the page going away (pagehide) switches it off', (await tracks(page)).every((t) => t === 'ended'));
  await go(page, '#/stage'); await go(page, '#/stage/podium'); await page.click('[data-act=pd-go]'); await page.waitForTimeout(150);
  ok('the tournament resumes where it was left (round 1, the rehearsal still spent)', (await S(page)).cur.round === 0 && (await S(page)).cur.rounds[0].rehearsed);
  /* leaving mid-take */
  await page.click('[data-act=pd-start]'); await page.waitForTimeout(500); await go(page, '#/home');
  ok('mic: leaving the Podium mid-take switches it off', (await tracks(page)).every((t) => t === 'ended'));
  ok('mic: nothing transmitted (local requests only, no POST)', page.reqs.every(ALLOWED) && page.posts.length === 0);
  ok('mic: no page errors', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- 3. the planner: keyboard, mouse drag, touch; marks structure only (ST3); typed plans kept off backups ---------- */
if (want(3)) {
  const browser = await launch();
  { const { ctx, page } = await ctxFor(browser);
    await makeKid(page, 'Kai'); await enter(page);
    await page.evaluate(() => { const t = window.__bz.S.h.kids[0].podium.cur; t.round = 2; t.rounds[0].done = t.rounds[1].done = true; }); await go(page, '#/stage'); await go(page, '#/stage/podium'); await page.click('[data-act=pd-go]'); await page.waitForTimeout(200);
    ok('planner: round 3 offers two topics', (await page.$$('[data-act=pd-topic]')).length === 2);
    await page.keyboard.press('1'); await page.waitForTimeout(200);
    ok('planner: a key chooses the topic, and the green room opens', (await S(page)).view === 'plan' && !!(await page.$('[data-stage=podium-plan]')));
    await choosePlan(page);
    let marks = await page.$$eval('.pd-checks li.ok', (l) => l.length);
    ok(`planner (keyboard): a line chosen for every card — hook, points, echo (${marks}/4)`, marks === 3);
    const d = await addDevice(page, 'hook');
    const after = await S(page);
    ok(`planner (mouse): a device dragged onto the hook offers versions, and one is chosen (“${after.writing.prepared.hook}”)`, d.picked && after.writing.prepared.hook !== d.before);
    marks = await page.$$eval('.pd-checks li.ok', (l) => l.length);
    ok(`planner: the plan is complete (${marks}/4)`, marks === 4);
    await page.click('[data-act=pd-example]'); await page.waitForTimeout(500);
    ok('planner: the example plan is Felix’s speech, as Hook, three points, Close', /Felix/.test(await page.textContent('.pd-example')) && (await page.$$('.pd-ex-body section')).length === 5);
    await page.keyboard.press('Escape'); await page.waitForTimeout(150); ok('planner: Escape closes it', !(await page.$('.pd-example')));
    ok('planner: the typed/chosen plan lives in k.writing (no backup carries it)', !!after.writing.prepared.hook && !JSON.stringify(makeBackup(await page.evaluate(() => JSON.parse(localStorage.getItem('bizzing-english.household'))))).includes(after.writing.prepared.hook));
    ok('planner: no page errors', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
    await ctx.close(); }
  /* touch, on a phone */
  { const { ctx, page } = await ctxFor(browser, { phone: true });
    await makeKid(page, 'Noa', '6–7'); await enter(page);
    await page.evaluate(() => { const t = window.__bz.S.h.kids[0].podium.cur; t.round = 2; t.rounds[0].done = t.rounds[1].done = true; }); await go(page, '#/stage'); await go(page, '#/stage/podium'); await page.tap('[data-act=pd-go]'); await page.waitForTimeout(200);
    await page.tap('[data-act=pd-topic] >> nth=1'); await page.waitForTimeout(200);
    await choosePlan(page, { touch: true });
    const d = await addDevice(page, 'p1', { touch: true });
    ok('planner (touch): tap a device, tap “Add it here”, tap a version', d.picked);
    ok(`planner (touch): complete by touch alone (${await page.$$eval('.pd-checks li.ok', (l) => l.length)}/4)`, (await page.$$eval('.pd-checks li.ok', (l) => l.length)) === 4);
    const low = await page.evaluate(() => { const tb = document.querySelector('.bz-tabbar'), lim = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().top : innerHeight; return [...document.querySelectorAll('.stg-tray button, .stg-ctl button')].filter((b) => b.getBoundingClientRect().bottom > lim).length; });
    ok('planner (phone): the devices and the controls stay above the tab bar', low === 0);
    ok('planner (phone): every device and line is at least 44 px tall', await page.$$eval('.pd-dev, .pd-line', (bs) => bs.every((b) => b.getBoundingClientRect().height >= 44)));
    await ctx.close(); }
  /* ST3: typed at Level 3 — the same shape with other words gets the same marks */
  { const { ctx, page } = await ctxFor(browser);
    await makeKid(page, 'Ola', '11–14'); await enter(page, { level: 3 });
    await page.evaluate(() => { const t = window.__bz.S.h.kids[0].podium.cur; t.round = 2; t.rounds[0].done = t.rounds[1].done = true; }); await go(page, '#/stage'); await go(page, '#/stage/podium'); await page.click('[data-act=pd-go]'); await page.click('[data-act=pd-topic] >> nth=0'); await page.waitForTimeout(200);
    const typePlan = async (p) => { for (const [c, v] of Object.entries(p)) { await page.fill(`#pd-in-${c}`, v); await page.waitForTimeout(40); } await page.waitForTimeout(150); return page.$$eval('.pd-checks li', (l) => l.map((x) => x.classList.contains('ok'))); };
    const a = await typePlan({ hook: 'Have you ever planted a seed in a garden?', p1: 'Seeds teach patience.', p2: 'Plants feed us, the bees, and the birds.', p3: 'Weeding is good exercise for everyone.', close: 'So go and plant a garden today.' });
    const b = await typePlan({ hook: 'Have you ever polished a trumpet in a cupboard?', p1: 'Trumpets teach elbows.', p2: 'Spoons tickle us, the clouds, and the soup.', p3: 'Purple is good soup for everyone.', close: 'So go and polish a trumpet today.' });
    ok(`ST3: the same shape with silly ideas gets the same marks (${a} / ${b})`, a.every(Boolean) && JSON.stringify(a) === JSON.stringify(b));
    const c = await typePlan({ close: 'So go and do it today.' });
    ok('ST3: what is marked is the shape — a close with no echo of the hook loses only that mark', JSON.stringify(c) === JSON.stringify([true, true, false, true]));
    await page.waitForTimeout(500);
    const typed = await page.evaluate(() => JSON.parse(localStorage.getItem('bizzing-english.household')));
    ok('typed plan: kept on this device as it is typed', JSON.stringify(typed.kids[0].writing.podium).includes('polished a trumpet'));
    ok('typed plan: never in a backup', !JSON.stringify(makeBackup(typed)).includes('trumpet') && JSON.stringify(makeBackup(typed)).includes('"podium"'));
    /* jump to the end: the typed plans are cleared when the tournament ends */
    await page.evaluate(() => { const t = window.__bz.S.h.kids[0].podium.cur; t.round = 3; t.rounds.forEach((r, i) => Object.assign(r, { done: true, total: [6, 6, 8, 0][i], verified: i < 3 })); window.__bz.S.run.view = 'result'; window.__bz.render(); });
    await page.click('[data-act=pd-next]'); await page.waitForTimeout(400);
    const end = await page.evaluate(() => localStorage.getItem('bizzing-english.household'));
    ok('typed plan: cleared at the end of the tournament', !end.includes('trumpet') && !end.includes('plant a garden') && !JSON.parse(end).kids[0].writing?.podium && /cleared from this device/.test(await page.textContent('.stg')));
    ok('the finish: the podium drawn, the tournament closed', !!(await page.$('.pd-podium')) && JSON.parse(end).kids[0].podium.cur === null && JSON.parse(end).kids[0].contests.length === 1);
    ok('typed plan: no page errors', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
    await ctx.close(); }
}

/* ---------- 4. ST1 with sound files: silence, constant noise, rhythmic noise, a six-second stop — 0 points, 0 coins ---------- */
const HOPE = 84;   // dickinson-hope's syllables (passages.json): the rhythmic noise and the stop are cut to match its beat count
if (want(4)) {
  for (const [name, samples, secs] of [
    ['silence', A.silence(12), 6],
    ['constant noise', A.noise(14), 10],
    ['rhythmic noise', A.concat(A.rhythmicNoise(22, HOPE / 21), A.silence(8)), 22],
    ['a six-second stop', A.concat(A.speechLike(24, 4, 21).samples, A.silence(30)), 20],
  ]) {
    const browser = await launch({ name: name.replace(/\W+/g, '-'), samples }), { ctx, page } = await ctxFor(browser);
    await makeKid(page, 'Zed'); const w0 = await wallet(page, 'zed');
    await enter(page); await useText(page, 'dickinson-hope');
    const t = await take(page, secs), s = await S(page);
    ok(`ST1 (${name}): every track ended within 100 ms of Stop (${t.ms.toFixed(1)} ms)`, t.ended && t.ms <= 100);
    ok(`ST1 (${name}): no speech evidence (${s.ev?.checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.got}`).join('; ')})`, s.ev && !s.ev.ok);
    if (process.env.BZ_DEBUG) console.log(name, JSON.stringify(s.ev));
    if (name === 'a six-second stop') ok('ST1 (a six-second stop): the voice in the file is heard — the stop fails only on its syllables', s.ev.checks.filter((c) => !c.ok).map((c) => c.id).join() === 'rhythm');
    if (name === 'rhythmic noise') ok('ST1 (rhythmic noise): it has beats the microphone counts — and no voice', s.ev.peaks >= 10 && !s.ev.checks.find((c) => c.id === 'voiced').ok);
    ok(`ST1 (${name}): 0 points and 0 coins`, s.res.total === 0 && s.res.delivery === 0 && (await wallet(page, 'zed')) === w0 && !s.cur.rounds[0].paid);
    ok(`ST1 (${name}): no page errors, nothing transmitted`, page.errs.length === 0 && page.reqs.every(ALLOWED) && page.posts.length === 0, page.errs.slice(0, 2).join(' | '));
    await ctx.close(); await browser.close();
  }
}

/* ---------- 5. a speech-like voice: it passes and pays; a whole tournament at Level 3 with typed plans (T6) ---------- */
if (want(5)) {
  const voice = A.speechLike(133, 4, 3);   // the-lamb's 133 syllables at four a second: ~34 s, then a breath of silence
  const browser = await launch({ name: 'voice', samples: A.concat(voice.samples, A.silence(12)) }), { ctx, page } = await ctxFor(browser);
  await makeKid(page, 'Ada', '11–14'); const w0 = await wallet(page, 'ada');
  await enter(page, { level: 3 }); await useText(page, 'blake-lamb');
  const SECS = 37;
  for (let ri = 0; ri < 4; ri++) {
    if (ri) { await page.click('[data-act=pd-next]'); await page.waitForTimeout(200); await page.click('[data-act=pd-go]'); await page.waitForTimeout(200); }
    if (ri === 2) { await page.click('[data-act=pd-topic] >> nth=0'); await page.waitForTimeout(200); }
    if (ri === 3) { await page.click('[data-act=pd-plan-go]'); await page.waitForTimeout(200); }
    if (ri >= 2) {
      const lines = ri === 2 ? { hook: 'Have you ever wondered why we speak at all?', p1: 'Words carry ideas from one head to another.', p2: 'A voice can be loud, soft, and everything between.', p3: 'Speaking well helps friends understand each other.', close: 'So now you know why we speak.' }
        : { hook: 'Who decides what is fair?', p1: 'Rules help everyone play.', p2: 'A fair rule is clear, kind, and simple.', p3: 'People keep rules they understand.', close: 'So fair rules help everyone decide.' };
      for (const [c, v] of Object.entries(lines)) await page.fill(`#pd-in-${c}`, v);
      await page.waitForTimeout(200);
      ok(`round ${ri + 1}: the typed plan is complete (${await page.$$eval('.pd-checks li.ok', (l) => l.length)}/4)`, (await page.$$eval('.pd-checks li.ok', (l) => l.length)) === 4);
      await page.click('[data-act=pd-planned]'); await page.waitForTimeout(200);
    }
    const before = await wallet(page, 'ada'), t = await take(page, SECS), s = await S(page);
    ok(`round ${ri + 1} (a speech-like voice): Stop ends every track within 100 ms (${t.ms.toFixed(1)} ms)`, t.ended && t.ms <= 100);
    ok(`round ${ri + 1} (a speech-like voice): the device hears speech (${s.ev?.checks.map((c) => `${c.id} ${c.ok ? '✓' : '✗'} ${c.got}`).join('; ')})`, s.ev?.ok && s.res.verified);
    ok(`round ${ri + 1}: verified speech${ri >= 2 ? ' and a complete plan' : ''} pays its 5 (${(await wallet(page, 'ada')) - before})`, (await wallet(page, 'ada')) - before === 5 && s.cur.rounds[ri].paid && s.res.total > 0);
    if (ri === 0) { await page.click('[data-act=pd-self][data-arg="2"]'); await page.click('[data-act=pd-grown][data-arg="1"]'); await page.waitForTimeout(100);
      ok('the child’s and a grown-up’s views are kept as theirs — numbers, beside the device’s', (await S(page)).cur.rounds[0].self === 2 && (await S(page)).cur.rounds[0].grown === 1 && /theirs, not the app’s/.test(await page.textContent('.stg'))); }
  }
  const mid = await page.evaluate(() => localStorage.getItem('bizzing-english.household'));
  ok('the typed plans are on the device during the tournament', mid.includes('fair rules help everyone'));
  await page.click('[data-act=pd-next]'); await page.waitForTimeout(500);
  const s = await S(page), shown = +(await page.getAttribute('.pd-coins', 'data-coins')), gained = (await wallet(page, 'ada')) - w0;
  ok(`T6: the finish card's coins equal the wallet's change (${shown} shown, ${gained} gained)`, shown === gained && gained >= 20);
  ok(`the contest 10 is paid only with verified speech in ≥ 3 rounds and ≥ 50% (${s.end.total}/48, ${gained} coins)`, (s.end.total >= 24) === (gained === 30));
  const end = await page.evaluate(() => localStorage.getItem('bizzing-english.household'));
  ok('the typed plans are cleared at the end', !end.includes('fair rules help everyone') && !end.includes('why we speak'));
  ok('a whole tournament transmits nothing (local requests only, no POST)', page.reqs.every(ALLOWED) && page.posts.length === 0);
  ok('a whole tournament: no page errors', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

for (const b of browsers) await b.close().catch(() => {});
srv.kill(); rmSync(SITE, { recursive: true, force: true }); rmSync(WAVS, { recursive: true, force: true });
console.log(fail ? `podium-ui: ${fail} of ${n} checks failed` : `podium-ui: all ${n} checks passed`);
process.exit(fail ? 1 : 0);
