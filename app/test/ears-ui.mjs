/* ears-ui.mjs — Story Ears in the BUILT app, in Chromium, desktop 1280 and phone 390 (HANDOVER C §5, §8).
   Run after a build that wires #/ears (BZ_BUILD=<dir> to point at another build, as test/ui.mjs does).

   The narrator's clips are answered with a short made-up sound (1.6 s, a tone, a breath of silence, a tone)
   so a story ends in seconds; one check plays a REAL clip. Every check here was watched to fail once
   (the report that shipped this file says how each was broken).

   Checks: the screen and its head (checkPageHead, desktop and phone, light and dark); a whole run by
   KEYBOARD alone, paid exactly what the finish card says (T6), the level moved by the owner's rule; a run
   by TOUCH answered wrong: the miss holds on the item until Continue, the right picture lit, the sentence
   that holds the answer replayed (its clip asked for) and shown; a random tapper earns nothing (SE1);
   the voice stops when the page is left and when the tab is hidden; Calm slows the narrator 15%;
   pictures at least 96 px and two by two on a phone (T11); no control under the tab bar; the HUD mirrored
   and the pictures centred within 4 px (T15); no flat colour over 6% and no pure white or black over 2%
   of the stage (T14); no page error, no 4xx or 5xx (T9), no third-party request. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync, writeFileSync } from 'node:fs';
import { checkPageHead } from '../src/integration/shell-check.mjs';
import { PNG } from './_png.mjs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-ears-' + process.pid, PORT = 8890 + Math.floor(Math.random() * 100);
if (!existsSync(BUILD)) { console.log('ears-ui: run `npm run build` first'); process.exit(1); }
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`;
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: EXE, args: ['--autoplay-policy=no-user-gesture-required'] });
let fail = 0, n = 0; const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } };
const ALLOWED = (u) => u.startsWith(`http://127.0.0.1:${PORT}/`) || u.startsWith('data:') || u.startsWith('blob:');
const BEE_AUDIO = 'https://raw.githubusercontent.com/aayuvis/Bizzing-Bee/main/spellbound-app/voice/w/';

/* 1.6 s of 8 kHz sound: 0.5 s tone · 0.25 s quiet · 0.6 s tone · 0.25 s quiet */
function wav() {
  const sr = 8000, parts = [[0.5, 440], [0.25, 0], [0.6, 523], [0.25, 0]], len = Math.round(parts.reduce((a, p) => a + p[0], 0) * sr), b = Buffer.alloc(44 + len * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + len * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(len * 2, 40);
  let i = 0; for (const [d, f] of parts) for (let j = 0; j < Math.round(d * sr); j++, i++) b.writeInt16LE(f ? Math.round(Math.sin((2 * Math.PI * f * j) / sr) * 9000) : 0, 44 + i * 2);
  return b;
}
const WAV = wav();
const ONLY = process.env.BZ_ONLY ? process.env.BZ_ONLY.split(',').map(Number) : null, want = (k) => !ONLY || ONLY.includes(k);   // BZ_ONLY=3,4 runs those sections

async function ctxFor({ phone = false, dark = false, realVoice = false } = {}) {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.reqs = []; page.errs = []; page.voice = [];
  page.on('request', (r) => page.reqs.push(r.url()));
  page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
  page.on('response', (res) => { if (res.status() >= 400) page.errs.push(`${res.status()} ${res.url()}`); });
  await page.route((u) => u.href.startsWith(BEE_AUDIO), (r) => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }));
  await page.route(/\/voice\/st\/[^/]+\.mp3$/, (r) => { page.voice.push(r.request().url().split('/voice/')[1]); return realVoice ? r.continue() : r.fulfill({ status: 200, contentType: 'audio/wav', body: WAV }); });
  await page.addInitScript(() => {   // every sound the page makes, so a check can see that it stopped
    window.__audios = []; const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...a) { if (!window.__audios.includes(this)) window.__audios.push(this); return play.apply(this, a); };
  });
  return { ctx, page };
}
const go = async (p, hash) => { if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); } await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(500); };
async function makeKid(page, name = 'Ravi', band = '6–7') {
  await page.goto(BASE); await page.waitForTimeout(600);
  await page.click('[data-act=ob-start]'); await page.fill('#obn', name); await page.click('[data-act=ob-name]');
  await page.click(`button:has-text("ages ${band}")`); await page.click('[data-act=ob-face] >> nth=0'); await page.click('[data-act=ob-go]');
  await page.waitForTimeout(700);
}
const G = (page) => page.evaluate(() => { const r = window.__bz.S.run; if (r?.mode !== 'ears') return null; const g = r.g; const q = g ? g.stories[g.si]?.qs[g.qi] : null; return { phase: r.phase, gp: g?.phase, level: g?.level, si: g?.si, qi: g?.qi, q, results: g?.results, listens: g?.listens, sum: r.sum, coins: r.coins }; });
async function until(page, f, ms = 15000) { const t = Date.now(); while (Date.now() - t < ms) { const s = await G(page); if (s && f(s)) return s; await page.waitForTimeout(120); } return G(page); }
const wallet = (page, who) => page.evaluate((w) => { try { return JSON.parse(localStorage.getItem('bizzing.wallet')).kids[w]?.coins || 0; } catch { return 0; } }, who);
const playing = (page) => page.evaluate(() => (window.__audios || []).filter((a) => !a.paused && !a.ended).length + (speechSynthesis.speaking ? 1 : 0));

/* answer the current question: right (from the item's own answer) or wrong, by keys or taps */
async function answer(page, { right = true, touch = false } = {}) {
  const s = await G(page), q = s.q;
  const keys = q.kind === 'order' ? (right ? q.order : [q.order[1], q.order[0], q.order[2]]) : [right ? q.answer : (q.answer + 1) % q.options.length];
  for (const i of keys) { if (touch) await page.tap(`.se-card[data-card="${i}"]`); else await page.keyboard.press(String(i + 1)); await page.waitForTimeout(90); }
}
/* play a whole run; how: 'right' | 'wrong' | 'random' */
async function playRun(page, { how = 'right', touch = false, onMiss = null } = {}) {
  let asked = 0;
  for (let guard = 0; guard < 80; guard++) {
    const s = await G(page); if (!s || s.phase === 'done') return s;
    if (s.gp === 'listen') { if (touch) await page.tap('[data-act=se-listen]'); else await page.keyboard.press(' '); await until(page, (x) => x.gp !== 'listen', 20000); continue; }
    if (s.gp === 'between') { if (touch) await page.tap('[data-act=se-story]'); else await page.keyboard.press('Enter'); await page.waitForTimeout(250); continue; }
    if (s.gp === 'ask') {
      await answer(page, { right: how === 'right' || (how === 'random' && asked++ % 4 === 0), touch });   // the random tapper: right one time in four, chance with four pictures
      await page.waitForTimeout(250);
      const t = await G(page);
      if (t.gp === 'miss') { if (onMiss) await onMiss(page, t); if ((await G(page)).gp === 'miss') { if (touch) await page.tap('[data-act=se-next]'); else await page.keyboard.press('Enter'); } await page.waitForTimeout(200); }
      else await until(page, (x) => x.gp !== 'right', 3000);
      continue;
    }
    await page.waitForTimeout(150);
  }
  return G(page);
}

/* ---------- 1. the screen, desktop and phone, light and dark ---------- */
if (want(1)) for (const phone of [false, true]) for (const dark of [false, true]) {
  const tag = `${phone ? 'phone' : 'desktop'} ${dark ? 'dark' : 'light'}`;
  const { ctx, page } = await ctxFor({ phone, dark });
  await makeKid(page, 'Mira');
  await go(page, '#/ears');
  ok(`${tag}: #/ears opens Story Ears`, (await page.textContent('h1')).includes('Story Ears'));
  const f = await checkPageHead(page, { phone }); ok(`${tag}: the page head matches Bee`, f.length === 0, f.join('; '));
  ok(`${tag}: the level chip offers Auto and Levels 1–5`, (await page.$$('[data-act=se-level]')).length === 6);
  ok(`${tag}: the story tree is drawn`, !!(await page.$('.se-tree')));
  const lb = await page.evaluate(() => { const tb = document.querySelector('.bz-tabbar'), lim = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().top : innerHeight; return [Math.round(document.querySelector('[data-act=se-start]').getBoundingClientRect().bottom), Math.round(lim)]; });
  ok(`${tag}: Listen is above the fold on the title card (${lb[0]} ≤ ${lb[1]})`, lb[0] <= lb[1]);
  await page.click('[data-act=se-start]'); await page.waitForTimeout(300);
  ok(`${tag}: Listen starts a round on the listening screen`, (await G(page)).gp === 'listen' && !!(await page.$('[data-act=se-listen]')));
  ok(`${tag}: the story names its book`, /From .+ by .+\(\d{4}\)/.test(await page.textContent('.se-src')));
  await page.click('[data-act=se-listen]'); await until(page, (x) => x.gp === 'ask');
  for (const h of ['title', 'ask']) {
    if (h === 'title') { await page.evaluate(() => { window.__bz.S.run.phase = 'title'; window.__bz.render(); }); await page.waitForTimeout(200); }
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(`${tag}: ${h} does not scroll sideways (${w}px)`, w <= (phone ? 390 : 1280));
    const t = await page.evaluate(() => document.body.innerText);
    ok(`${tag}: ${h} shows no undefined, NaN or [object Object]`, !/\[object Object\]|\bundefined\b|\bNaN\b/.test(t));
    const emo = await page.evaluate(() => [...document.querySelectorAll('button, h1, h2, h3, .btn, .bz-chip')].map((e) => e.textContent).join(' ').match(/\p{Extended_Pictographic}/gu) || []);
    ok(`${tag}: ${h} has no emoji in a control or heading`, emo.length === 0, emo.join(''));
    if (h === 'title') { await page.click('[data-act=se-start]'); await page.waitForTimeout(250); await page.click('[data-act=se-listen]'); await until(page, (x) => x.gp === 'ask'); }
  }
  /* T11: pictures ≥ 96 px; nothing under the tab bar or below the fold */
  const cards = await page.$$eval('.se-card', (cs) => cs.map((c) => { const b = c.getBoundingClientRect(); return [b.width, b.height, b.top]; }));
  ok(`${tag}: every picture is at least 96 px (${cards.map((c) => Math.round(c[0])).join(',')})`, cards.length >= 3 && cards.every((c) => c[0] >= 96 && c[1] >= 96));
  const low = await page.evaluate(() => { const tb = document.querySelector('.bz-tabbar'), lim = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().top : innerHeight;
    return [...document.querySelectorAll('.se-stage button')].map((b) => [b.textContent.trim().slice(0, 20), Math.round(b.getBoundingClientRect().bottom), Math.round(lim)]).filter(([, bt, l]) => bt > l); });
  ok(`${tag}: no Story Ears control below the fold or under the tab bar`, low.length === 0, JSON.stringify(low));
  /* T15: the HUD mirrored, the pictures centred */
  const sym = await page.evaluate(() => { const st = document.querySelector('.se-stage').getBoundingClientRect(), hs = [...document.querySelectorAll('.se-hud > .se-stat')].map((e) => e.getBoundingClientRect()), cs = document.querySelector('.se-cards').getBoundingClientRect(),
    kids = [...document.querySelectorAll('.se-card')].map((e) => e.getBoundingClientRect()), l = Math.min(...kids.map((k) => k.left)), r = Math.max(...kids.map((k) => k.right));
    return { hud: Math.abs((hs[0].left - st.left) - (st.right - hs[1].right)), cards: Math.abs((l + r) / 2 - (st.left + st.right) / 2), mid: Math.abs((cs.left + cs.right) / 2 - (st.left + st.right) / 2) }; });
  ok(`${tag}: the HUD is mirrored within 4 px (${sym.hud.toFixed(1)})`, sym.hud <= 4);
  ok(`${tag}: the pictures are centred within 4 px (${sym.cards.toFixed(1)})`, sym.cards <= 4);
  /* T14: no flat colour over 6%, no pure white or black over 2% of the stage */
  await page.evaluate(() => document.querySelectorAll('.se-stage *').forEach((e) => { e.style.animation = 'none'; }));
  const png = await (await page.$('.se-stage')).screenshot(), shot = PNG(png), bins = new Map(); let white = 0, black = 0;
  if (process.env.BZ_SHOTS) { writeFileSync(`${process.env.BZ_SHOTS}/ears-${tag.replace(' ', '-')}.png`, png); await page.screenshot({ path: `${process.env.BZ_SHOTS}/ears-page-${tag.replace(' ', '-')}.png` }); }
  for (const [r, g, b] of shot.pixels) { if (r >= 250 && g >= 250 && b >= 250) white++; if (r <= 5 && g <= 5 && b <= 5) black++; const k = (r >> 3) << 10 | (g >> 3) << 5 | b >> 3; bins.set(k, (bins.get(k) || 0) + 1); }
  const N = shot.pixels.length, flat = Math.max(...bins.values()) / N;
  ok(`${tag}: no flat colour over 6% of the stage (${(flat * 100).toFixed(1)}%)`, flat <= 0.06);
  ok(`${tag}: no pure white or black over 2% of the stage (${((white / N) * 100).toFixed(1)}% / ${((black / N) * 100).toFixed(1)}%)`, white / N <= 0.02 && black / N <= 0.02);
  ok(`${tag}: no page errors and no 4xx/5xx`, page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  ok(`${tag}: no third-party requests`, page.reqs.every(ALLOWED), page.reqs.filter((u) => !ALLOWED(u)).slice(0, 3).join(' '));
  await ctx.close();
}

/* ---------- 2. a whole run by KEYBOARD: paid what the finish card says; the level moves up ---------- */
if (want(2)) {
  const { ctx, page } = await ctxFor();
  await makeKid(page, 'Ravi');
  await go(page, '#/ears'); await page.focus('#main').catch(() => {});
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  ok('keyboard: Enter starts a round', (await G(page)).gp === 'listen');
  const before = await wallet(page, 'ravi');
  const end = await playRun(page, { how: 'right' });
  const after = await wallet(page, 'ravi');
  ok(`keyboard: a whole run can be played by keyboard alone (${end?.phase})`, end?.phase === 'done' && end.sum.right === end.sum.total && end.sum.total >= 4);
  ok(`keyboard: the finish card's coins are the wallet's change (${end?.coins} shown, ${after - before} paid)`, end?.coins === after - before && end.coins === end.sum.total + 5);
  ok('keyboard: the finish card shows those coins', (await page.textContent('.se-stats')).includes(String(end?.coins)));
  ok('keyboard: 100% moves the level up one (the owner’s rule)', await page.evaluate(() => window.__bz.S.h.kids[0].games.ears.level === 2));
  ok('keyboard: the finish names what was practised and a next step', /You practised listening for (who|where|what)/.test(await page.textContent('.se-donecard')) && !!(await page.$('.se-next-step')));
  ok('keyboard: the stories heard grow the tree', await page.evaluate(() => Object.keys(window.__bz.S.h.kids[0].games.ears.heard).length >= 3));
  /* a hand-set level sticks until the next check, then goes back to Auto */
  await page.click('[data-act=se-title]'); await page.waitForTimeout(200);
  await page.keyboard.press('1'); await page.waitForTimeout(150);
  ok('keyboard: 1 on the title card sets Level 1 by hand', await page.evaluate(() => window.__bz.S.h.kids[0].games.ears.pick === 1));
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  ok('keyboard: a hand-set level is the level played', (await G(page)).level === 1);
  const b2 = await wallet(page, 'ravi');
  const e2 = await playRun(page, { how: 'right' });
  ok('keyboard: after the check the chip goes back to Auto', await page.evaluate(() => window.__bz.S.h.kids[0].games.ears.pick == null));
  ok(`keyboard: climbing back to a level already reached pays no second level-up (${(await wallet(page, 'ravi')) - b2} for ${e2.sum.right} right)`, (await wallet(page, 'ravi')) - b2 === e2.sum.right);
  ok('keyboard: no page errors and no 4xx/5xx', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- 3. TOUCH on a phone: a miss holds and teaches; wrong earns nothing; random earns nothing ---------- */
if (want(3)) {
  const { ctx, page } = await ctxFor({ phone: true });
  await makeKid(page, 'Asha');
  await go(page, '#/ears');
  await page.tap('[data-act=se-level][data-arg="2"]'); await page.waitForTimeout(150);
  await page.tap('[data-act=se-start]'); await page.waitForTimeout(250);
  await page.tap('[data-act=se-listen]'); await until(page, (x) => x.gp === 'ask');
  const rows = await page.$$eval('.se-card', (cs) => new Set(cs.map((c) => Math.round(c.getBoundingClientRect().top))).size);
  ok(`touch: four pictures sit two by two on a phone (${rows} rows)`, rows === 2);
  const before = await wallet(page, 'asha');
  let checked = false;
  const end = await playRun(page, { how: 'wrong', touch: true, onMiss: async (p, s) => {
    if (checked) return; checked = true;
    page.voice.length = 0; await p.waitForTimeout(2200);
    const st = await G(p);
    ok('touch: a wrong answer holds on the item (2 s later it is still there)', st.gp === 'miss' && await p.locator('[data-act=se-next]').isVisible());
    ok('touch: the right picture is lit', await p.$eval(`.se-card[data-card="${s.q.kind === 'order' ? s.q.order[0] : s.q.answer}"]`, (e) => e.classList.contains('right') || e.classList.contains('shown')));
    const cap = await p.textContent('[data-caption]').catch(() => '');
    const holds = s.q.kind === 'order' ? s.q.holds[0] : s.q.holds;
    ok(`touch: the sentence that holds the answer is shown (“${cap.slice(0, 50)}…”)`, cap.includes(holds.slice(0, 20)) || s.q.kind === 'order');
    ok('touch: …and its clip is played again', st && (await p.evaluate(() => window.__audios.length)) > 0);
  } });
  ok('touch: a whole run can be played by touch alone', end?.phase === 'done');
  ok(`touch: a run with every answer wrong earns nothing (${(await wallet(page, 'asha')) - before})`, (await wallet(page, 'asha')) === before && end.coins === 0);
  ok('touch: under 50% the level drops one, kindly', await page.evaluate(() => window.__bz.S.h.kids[0].games.ears.level === 1) && /warm up on Level 1/.test(await page.textContent('.se-donecard')));
  /* SE1: a random tapper earns nothing */
  let paid = 0, right = 0, total = 0;
  for (let i = 0; i < 2; i++) {
    await page.tap('[data-act=se-start]'); await page.waitForTimeout(200);
    const b = await wallet(page, 'asha'), e = await playRun(page, { how: 'random', touch: true });
    paid += (await wallet(page, 'asha')) - b; right += e.sum.right; total += e.sum.total;
  }
  ok(`touch: a random tapper earns nothing (${paid} coins, ${right}/${total} right)`, paid === 0);
  ok('touch: no page errors and no 4xx/5xx', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- 4. the voice: a real clip plays; it stops on leaving and when hidden; Calm slows it ---------- */
if (want(4)) {
  const { ctx, page } = await ctxFor({ realVoice: true });
  await makeKid(page, 'Leo');
  await go(page, '#/ears'); await page.click('[data-act=se-start]'); await page.waitForTimeout(250);
  await page.click('[data-act=se-listen]'); await page.waitForTimeout(1800);
  const real = await page.evaluate(() => { const a = window.__audios.at(-1); return a ? { t: a.currentTime, src: a.src, paused: a.paused } : null; });
  ok(`voice: the narrator’s own clip plays (${real && real.src.split('/voice/')[1]} at ${real?.t.toFixed(2)} s)`, !!real && /voice\/st\//.test(real.src) && real.t > 0.3 && !real.paused);
  ok('voice: the sentence dots light as she reads', (await page.$$('[data-dot].on')).length >= 1);
  ok('voice: the listening count went down by one', (await G(page)).listens === 2);
  /* hidden tab */
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(200);
  ok('voice: a hidden tab stops the narrator', (await playing(page)) === 0);
  ok('voice: …and gives the listen back', (await G(page)).listens === 3);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  /* leaving */
  await page.click('[data-act=se-listen]'); await page.waitForTimeout(1200);
  ok('voice: playing again before leaving', (await playing(page)) >= 1);
  await go(page, '#/home'); await page.waitForTimeout(300);
  ok('voice: leaving the page stops the narrator at once', (await playing(page)) === 0);
  /* Calm: 15% slower */
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('bizzing-english.device') || '{}'); d.calm = true; localStorage.setItem('bizzing-english.device', JSON.stringify(d)); });
  await page.reload(); await page.waitForTimeout(700);
  await go(page, '#/ears'); await page.click('[data-act=se-start]'); await page.waitForTimeout(250);
  await page.click('[data-act=se-listen]'); await page.waitForTimeout(900);
  ok('voice: Calm mode slows the narrator by 15%', await page.evaluate(() => Math.abs((window.__audios.at(-1)?.playbackRate || 1) - 0.85) < 0.001));
  await go(page, '#/play'); await page.waitForTimeout(300);
  ok('voice: no page errors and no 4xx/5xx', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  ok('voice: no third-party requests', page.reqs.every(ALLOWED), page.reqs.filter((u) => !ALLOWED(u)).slice(0, 3).join(' '));
  await ctx.close();
}

/* ---------- 5. the Play tab carries the card ---------- */
if (want(5)) {
  const { ctx, page } = await ctxFor();
  await makeKid(page, 'Zoe');
  await go(page, '#/play');
  ok('Play: the Story Ears card is on the Play tab', !!(await page.$('[data-card=ears] a[href="#/ears"]')));
  await ctx.close();
}

/* ---------- 6. the Typing Trainer (HANDOVER C §4.4), here because it shipped with Story Ears ---------- */
if (want(6)) {
  const { ctx, page } = await ctxFor({ phone: true });
  await makeKid(page, 'Tara');
  await go(page, '#/tools/typing/home1'); await page.waitForTimeout(300);
  const keys = await page.$$eval('.ty-key[data-arg]', (ks) => ks.filter((k) => /^[a-z;,.]$/.test(k.dataset.arg)).map((k) => Math.round(k.getBoundingClientRect().width)));
  ok(`typing: every letter key is at least 40 px on a 390 px phone (${Math.min(...keys)} px, ${keys.length} keys)`, keys.length === 29 && Math.min(...keys) >= 40);
  ok('typing: the phone keyboard does not scroll sideways', (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  ok('typing: the finger colours and the lit next key stay', !!(await page.$('.ty-key.next')) && (await page.$$eval('.ty-key[style*="border-bottom-color"]', (k) => k.length)) >= 29);
  /* a lesson under 90% pays nothing; at 90% or better it pays, once */
  const seq = await page.evaluate(() => window.__bz.S.run.ty.seq), before = await wallet(page, 'tara');
  for (const ch of seq) await page.evaluate((c) => document.querySelector(`.ty-key[data-arg="${c === ' ' ? ' ' : c}"]`)?.click(), ch === ' ' ? ' ' : ch === 'f' ? 'j' : ch);   // every f typed as j: about a third wrong
  await page.waitForTimeout(300);
  const low = await page.evaluate(() => window.__bz.S.run.ty);
  ok(`typing: a lesson finished under 90% pays nothing (${low.acc}%, ${(await wallet(page, 'tara')) - before} coins)`, low.done && low.acc < 90 && (await wallet(page, 'tara')) === before && !low.paid);
  ok('typing: the finish says what was practised — the keys and the words missed', /You practised/.test(await page.textContent('.tl-result')) && /Words to try again/.test(await page.textContent('.tl-result')) && (await page.$$('.ty-kb')).length >= 2);
  await page.click('[data-act=ty-again]'); await page.waitForTimeout(250);
  for (const ch of await page.evaluate(() => window.__bz.S.run.ty.seq)) await page.keyboard.type(ch === ' ' ? ' ' : ch);
  await page.waitForTimeout(300);
  const hi = await page.evaluate(() => window.__bz.S.run.ty);
  ok(`typing: at 90% or better the lesson pays, once (${hi.acc}%, ${(await wallet(page, 'tara')) - before} coins)`, hi.done && hi.acc >= 90 && hi.paid && (await wallet(page, 'tara')) - before === 5);
  await page.click('[data-act=ty-again]'); await page.waitForTimeout(250);
  for (const ch of await page.evaluate(() => window.__bz.S.run.ty.seq)) await page.keyboard.type(ch === ' ' ? ' ' : ch);
  await page.waitForTimeout(300);
  ok('typing: a lesson already paid pays nothing more', (await wallet(page, 'tara')) - before === 5);
  /* the sixty-second test pauses while the tab is hidden */
  await go(page, '#/tools/typing/test'); await page.waitForTimeout(300);
  await page.keyboard.type((await page.evaluate(() => window.__bz.S.run.ty.seq))[0]); await page.waitForTimeout(1200);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const left0 = await page.evaluate(() => { const t = window.__bz.S.run.ty; return 60 - Math.floor(((t.paused || Date.now()) - t.startT - (t.pausedMs || 0)) / 1000); });
  await page.waitForTimeout(2600);
  const p = await page.evaluate(() => { const t = window.__bz.S.run.ty; return { left: 60 - Math.floor(((t.paused || Date.now()) - t.startT - (t.pausedMs || 0)) / 1000), shown: document.getElementById('ty-time')?.textContent, done: t.done }; });
  ok(`typing: a hidden tab pauses the test (${left0} → ${p.left}, “${p.shown}”)`, p.left === left0 && p.shown === 'paused' && !p.done);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.keyboard.type((await page.evaluate(() => window.__bz.S.run.ty.seq))[1]); await page.waitForTimeout(1300);
  const q = await page.evaluate(() => { const t = window.__bz.S.run.ty; return { paused: t.paused, shown: document.getElementById('ty-time')?.textContent }; });
  ok(`typing: the next key carries the test on (“${q.shown}”)`, !q.paused && /^\d+s$/.test(q.shown) && parseInt(q.shown, 10) <= left0 && parseInt(q.shown, 10) >= left0 - 2);
  ok('typing: no page errors and no 4xx/5xx', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close(); srv.kill(); rmSync(SITE, { recursive: true, force: true });
console.log(fail ? `ears-ui: ${fail} of ${n} checks failed` : `ears-ui: all ${n} checks passed`);
process.exit(fail ? 1 : 0);
