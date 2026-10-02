/* ui.mjs — the BUILT app in Chromium at its real sub-path (/Bizzing_English/), desktop 1280 and phone
   390, light and dark (SPEC §13, FAMILY-STANDARD §22). Run after `npm run build`.

   Overflow is measured against the viewport WE set: Chromium's mobile emulation widens innerWidth to
   fit overflow, which once made the family's phone check blind. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { checkShell, checkPageHead } from '../src/integration/shell-check.mjs';

const BUILD = new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-site', PORT = 8790 + Math.floor(Math.random() * 100);
if (!existsSync(BUILD)) { console.log('ui: run `npm run build` first'); process.exit(1); }
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`;
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: EXE, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
let fail = 0, n = 0; const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } };
const ALLOWED = (u) => u.startsWith(`http://127.0.0.1:${PORT}/`) || u.startsWith('data:') || u.startsWith('blob:');
const BEE_AUDIO = 'https://raw.githubusercontent.com/aayuvis/Bizzing-Bee/main/spellbound-app/voice/w/';

async function ctxFor({ phone = false, dark = false } = {}) {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light', permissions: ['microphone'] });
  const page = await ctx.newPage(); page.reqs = []; page.errs = [];
  page.on('request', (r) => page.reqs.push(r.url()));
  page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
  await page.route((u) => u.href.startsWith(BEE_AUDIO), (r) => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }));
  await page.addInitScript(() => {   // record every microphone track, so the check can see it was stopped
    window.__tracks = []; const md = navigator.mediaDevices; if (!md) return; const g = md.getUserMedia.bind(md);
    md.getUserMedia = async (c) => { const s = await g(c); window.__tracks.push(...s.getTracks()); return s; };
  });
  return { ctx, page };
}
const go = async (p, hash) => {
  if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }   // a celebration waits to be dismissed; dismiss it
  await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(450);
};
const text = (p) => p.evaluate(() => document.body.innerText);

/* a household with one child, seeded through the app's own welcome */
async function makeKid(page, name = 'Mira', band = '8–10') {
  await page.goto(BASE); await page.waitForTimeout(600);
  let taps = 0;
  await page.click('[data-act=ob-start]'); taps++;
  await page.fill('#obn', name); await page.click('[data-act=ob-name]'); taps++;
  await page.click(`button:has-text("ages ${band}")`); taps++;
  await page.click('[data-act=ob-face] >> nth=0'); taps++;
  await page.click('[data-act=ob-go]'); taps++;
  await page.waitForTimeout(700);
  return taps;
}

/* ---------- 1. welcome → first stop, and the shell, desktop + phone, light + dark ---------- */
for (const phone of [false, true]) for (const dark of [false, true]) {
  const tag = `${phone ? 'phone' : 'desktop'} ${dark ? 'dark' : 'light'}`;
  const { ctx, page } = await ctxFor({ phone, dark });
  await page.goto(BASE); await page.waitForTimeout(500);
  ok(`${tag}: a new visitor lands on the welcome`, (await text(page)).includes('A child who reads the great books'));
  const taps = await makeKid(page);
  ok(`${tag}: the first stop is reached within 5 taps`, taps <= 5 && /#\/stop\//.test(page.url()), page.url());
  await go(page, '#/home');
  const shell = await checkShell(page, { phone });
  ok(`${tag}: checkShell matches Bee`, shell.length === 0, '\n   ' + shell.join('\n   '));
  if (phone) { const b = await page.$eval('[data-bz=continue]', (e) => e.getBoundingClientRect().bottom); ok(`${tag}: Continue is wholly above the fold`, b <= 844 - 68, b); }
  for (const [h, kind] of [['#/atlas', 'root'], ['#/library', 'deep'], ['#/atlas/word', 'deep'], ['#/stage', 'root'], ['#/play', 'root'], ['#/shop', 'deep']]) {
    await go(page, h); const f = await checkPageHead(page, { phone });
    ok(`${tag}: ${h} page head matches Bee`, f.length === 0, f.join('; '));
    ok(`${tag}: ${h} is a ${kind} head`, (await page.$eval('[data-bz=pagehead]', (e) => e.dataset.bzKind)) === kind);
  }
  /* no sideways scroll, measured against the width we set */
  for (const h of ['#/home', '#/atlas', '#/atlas/sentence', '#/library', '#/library/words', '#/book/jungle', '#/read/aesop-town-mouse', '#/stage', '#/stage/aloud', '#/play', '#/play/rush', '#/me', '#/medals', '#/collection', '#/shop/worlds', '#/practice', '#/grownups', '#/privacy', '#/help', '#/stop/s5-comma']) {
    await go(page, h);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(`${tag}: ${h} does not scroll sideways (${w}px)`, w <= (phone ? 390 : 1280));
    const t = await text(page);
    ok(`${tag}: ${h} shows no [object Object], {placeholder}, undefined or NaN`, !/\[object Object\]|\{[a-z_]+\}|\bundefined\b|\bNaN\b/.test(t));
    const emo = await page.evaluate(() => [...document.querySelectorAll('button, [role=tab], nav, h1, h2, h3, .chip, .bz-chip, .btn, .bz-tab')].map((e) => e.textContent).join(' ').match(/\p{Extended_Pictographic}/gu) || []);
    ok(`${tag}: ${h} has no emoji in a control or heading`, emo.length === 0, emo.join(''));
  }
  ok(`${tag}: no page errors`, page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  ok(`${tag}: no third-party requests`, page.reqs.every(ALLOWED), page.reqs.filter((u) => !ALLOWED(u)).slice(0, 3).join(' '));
  await ctx.close();
}

/* ---------- 2. behaviour, desktop ---------- */
{
  const { ctx, page } = await ctxFor();
  await makeKid(page, 'Ravi', '6–7');
  /* back stays in the app */
  for (const h of ['#/home', '#/atlas', '#/atlas/word', '#/library', '#/book/aesop']) await go(page, h);
  for (let i = 0; i < 6; i++) { await page.goBack(); await page.waitForTimeout(250); }
  ok('back never leaves the app', page.url().startsWith(BASE));

  /* a whole stop, by KEYBOARD: story → learn → your turn → check, answered from the item's own answer */
  await go(page, '#/stop/w1-rhyme');
  await page.click('[data-act=run-phase][data-arg=learn]'); await page.click('[data-act=run-phase][data-arg=turn]');
  for (let i = 0; i < 11; i++) {
    const a = await page.evaluate(() => { const r = window.__bz.S.run; return r.items[r.i]?.answer; });
    if (a == null) break; await page.keyboard.press(String(a + 1)); await page.waitForTimeout(1150);
  }
  ok('a stop can be passed by keyboard alone', await page.evaluate(() => window.__bz.S.h.kids[0].stops['w1-rhyme']?.passed === true));
  ok('passing pays coins into the family wallet', await page.evaluate(() => (JSON.parse(localStorage.getItem('bizzing.wallet')).kids.ravi.coins) >= 13));
  /* …and by TOUCH, a wrong answer holds until "Got it" */
  await go(page, '#/stop/s1-noun');
  await page.click('[data-act=run-phase][data-arg=learn]'); await page.click('[data-act=run-phase][data-arg=turn]');
  await page.click('[data-act=tok] >> nth=0'); await page.click('[data-act=submit]'); await page.waitForTimeout(300);
  const held = await page.evaluate(() => { const st = window.__bz.S.run.state; return st?.done && !st.ok; });
  if (held) { await page.waitForTimeout(1500); ok('a wrong answer holds until it is dismissed', await page.locator('[data-act=next-item]').isVisible()); }
  await go(page, '#/home');
  ok('an abandoned stop is what Continue offers', (await page.textContent('[data-bz=continue]')).includes('where you left off'));

  /* tap a word: the card opens, the word is banked; the only outside request is Bee's clip */
  page.reqs.length = 0;
  await go(page, '#/read/aesop-town-mouse'); await page.waitForTimeout(600);
  await page.click('.passage span.w >> text=heartily');
  ok('tapping a word shows its meaning', await page.locator('.wordcard').isVisible());
  ok('the word goes in the bank', await page.evaluate(() => !!window.__bz.S.h.kids[0].bank.heartily));
  ok('the only request off the site is Bee’s recorded word', page.reqs.filter((u) => !ALLOWED(u)).every((u) => u.startsWith(BEE_AUDIO)));
  await page.fill('#lk', 'feast'); await page.click('[data-act=lookup]');
  ok('a word can be looked up by keyboard too', await page.evaluate(() => window.__bz.S.wordcard?.raw === 'feast'));

  /* the grown-ups' page needs the PIN; the PIN is stored hashed */
  await go(page, '#/grownups');
  ok('grown-ups asks for a PIN first', await page.locator('.pinpad').isVisible() && !(await text(page)).includes('What to help with next'));
  for (const d of '2468') await page.keyboard.press(d); await page.waitForTimeout(400);
  ok('after the PIN, the report card shows', (await text(page)).includes('What to help with next'));
  ok('the PIN is never stored as digits', await page.evaluate(() => !localStorage.getItem('bizzing-english.household').includes('2468')));
  await page.reload(); await page.waitForTimeout(600); await go(page, '#/grownups');
  ok('a reload asks for the PIN again', await page.locator('.pinpad').isVisible());

  /* settings: the family's five sections, in order */
  await go(page, '#/settings'); await page.waitForTimeout(300);
  ok('Settings sections are Me · Sound · Look · Comfort · Grown-ups', (await page.$$eval('.sheet [data-section]', (e) => e.map((x) => x.dataset.section).join())) === 'me,sound,look,comfort,grownups');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  /* the Stage: the microphone opens on a tap and every track stops the moment reading ends */
  await go(page, '#/stage/aloud');
  ok('the microphone is not opened by visiting the Stage', await page.evaluate(() => window.__tracks.length === 0));
  await page.click('[data-act=aloud-start]'); await page.waitForTimeout(1500);
  ok('Start opens the microphone', await page.evaluate(() => window.__tracks.length > 0 && window.__tracks.every((t) => t.readyState === 'live')));
  await page.click('[data-act=aloud-stop]'); await page.waitForTimeout(200);
  ok('Stop ends every microphone track at once', await page.evaluate(() => window.__tracks.every((t) => t.readyState === 'ended')));
  ok('only numbers are shown and kept', (await text(page)).includes('words a minute') && await page.evaluate(() => !/blob:|data:audio/.test(localStorage.getItem('bizzing-english.household'))));
  await go(page, '#/stage'); await go(page, '#/stage/aloud'); await page.click('[data-act=aloud-start]'); await page.waitForTimeout(800); await go(page, '#/home');
  ok('leaving the Stage mid-reading switches the microphone off', await page.evaluate(() => window.__tracks.every((t) => t.readyState === 'ended')));

  /* games, both ways */
  await go(page, '#/play/builder'); await page.click('[data-act=game-start]');
  const play = async (how) => { const t = await page.evaluate(() => window.__bz.S.run.g.cur.tiles.map((x) => x.k)); for (const k of ['sub', 'dep', 'main']) { const i = t.indexOf(k); if (how === 'keys') await page.keyboard.press(String(i + 1)); else await page.click(`[data-act=b-pick][data-arg="${i}"]`); } await page.waitForTimeout(120); };
  await play('touch'); await play('keys');
  ok('Sentence Builder plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.built === 2));
  await go(page, '#/play/rush'); await page.click('[data-act=game-start]');
  const commas = await page.evaluate(() => window.__bz.S.run.g.cur.commas);
  for (const i of commas) await page.click(`[data-act=r-gap][data-arg="${i}"]`); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const c2 = await page.evaluate(() => window.__bz.S.run.g.cur.commas);
  await page.keyboard.press('ArrowRight'); for (let k = 0; k < 40; k++) { const cur = await page.evaluate(() => window.__bz.S.run.g.cursor); if (cur === c2[0]) break; await page.keyboard.press(cur < c2[0] ? 'ArrowRight' : 'ArrowLeft'); }
  for (const [j, i] of c2.entries()) { if (j) for (let k = 0; k < 40; k++) { const cur = await page.evaluate(() => window.__bz.S.run.g.cursor); if (cur === i) break; await page.keyboard.press('ArrowRight'); } await page.keyboard.press(' '); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  ok('Punctuation Rush plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.clean === 2));
  await go(page, '#/play/who'); await page.click('[data-act=game-start]');
  let a = await page.evaluate(() => window.__bz.S.run.g.rounds[0].answer); await page.click(`[data-act=who-pick][data-arg="${a}"]`); await page.waitForTimeout(1300);
  a = await page.evaluate(() => window.__bz.S.run.g.rounds[1].answer); await page.keyboard.press(String(a + 1)); await page.waitForTimeout(300);
  ok('Who Said It? plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.score === 2));

  /* ☰ by keyboard (checkShell drives it too): Tab stays inside, Esc closes */
  await go(page, '#/home'); await page.click('[data-bz=menu]'); for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  ok('focus stays inside the open drawer', await page.evaluate(() => !!document.activeElement.closest('[data-bz=drawer]')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('Esc closes the drawer', await page.evaluate(() => document.querySelector('[data-bz=drawer]').hidden));
  ok('no page errors in the behaviour run', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- 3. the Hive feed is written (fast-forwarded clock) ---------- */
{
  const { ctx, page } = await ctxFor();
  await page.clock.install(); await makeKid(page, 'Tara');
  for (let i = 0; i < 10; i++) { await page.mouse.move(100 + i, 300); await page.mouse.down(); await page.mouse.up(); await page.clock.runFor(15000); }
  const feed = await page.evaluate(() => JSON.parse(localStorage.getItem('bizzing.activity') || '{"s":[]}').s);
  ok('active minutes reach the family feed under the id english', feed.some((x) => x.a === 'english' && x.m >= 1 && x.who === 'Tara'), JSON.stringify(feed.slice(-2)));
  await ctx.close();
}

/* ---------- 4. ?demo saves nothing and writes no shared key ---------- */
{
  const { ctx, page } = await ctxFor();
  await page.goto(BASE + '?demo#/home'); await page.waitForTimeout(800);
  ok('the demo is labelled', (await text(page)).includes('A sample'));
  await go(page, '#/stop/s4-conj'); await page.click('[data-act=run-phase][data-arg=learn]'); await page.click('[data-act=run-phase][data-arg=turn]');
  const a = await page.evaluate(() => window.__bz.S.run.items[0].answer); await page.keyboard.press(String(a + 1)); await page.waitForTimeout(1200);
  ok('the demo writes nothing to storage', await page.evaluate(() => Object.keys(localStorage).length === 0), await page.evaluate(() => Object.keys(localStorage).join()));
  await ctx.close();
}

/* ---------- 5. every world, by day and night: the plate loads and the text on the page stays AA ---------- */
{
  const { ctx, page } = await ctxFor();
  await makeKid(page, 'Ola');
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const dark of [false, true]) for (let w = 1; w <= 6; w++) {
    await page.evaluate(([w, dark]) => { const S = window.__bz.S; S.h.kids[0].world = w; S.dev.dark = dark; window.__bz.render(); }, [w, dark]);
    await go(page, '#/atlas'); await page.waitForTimeout(500);
    const plate = await page.evaluate(() => getComputedStyle(document.querySelector('.scn-far')).backgroundImage);
    ok(`world ${w} ${dark ? 'night' : 'day'}: its own ${dark ? 'night' : 'day'} plate`, dark ? /-night\.webp/.test(plate) : !/-night/.test(plate) && /w-/.test(plate), plate);
    /* the words that sit on the painting itself (not on a card): the page head */
    for (const sel of ['[data-bz=ph-title]', '.bz-ph-sub']) {
      const box = await page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, c: getComputedStyle(e).color }; });
      const png = await page.screenshot({ clip: { x: box.x, y: box.y, width: Math.max(1, box.w), height: Math.max(1, box.h) } });
      const { PNG } = await import('./_png.mjs'); const img = PNG(png);
      const ink = box.c.match(/\d+/g).slice(0, 3).map(Number);
      const far = img.pixels.filter((p) => ratio(p, ink) > 1.6);   // the ground: pixels well away from the ink
      far.sort((a, b) => lum(dark ? b : a) - lum(dark ? a : b));    // the WORST ground: closest to the ink
      const worst = far[Math.floor(far.length * 0.2)] || far[0];   // the 20th-worst-percentile ground pixel: glyph edges are not ground
      const need = sel.includes('sub') ? 4.5 : 3;
      ok(`world ${w} ${dark ? 'night' : 'day'}: ${sel} keeps ${need}:1 on the painting`, worst && ratio(worst, ink) >= need, worst && ratio(worst, ink).toFixed(2));
    }
  }
  await ctx.close();
}

/* ---------- 6. weight: initial JS ≤ 400 KB gzipped; a phone's first screen ≤ 1.5 MB ---------- */
{
  const html = readFileSync(BUILD + '/index.html', 'utf8');
  const js = [...html.matchAll(/src="\.?\/?(assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  const gz = js.reduce((a, f) => a + gzipSync(readFileSync(BUILD + '/' + f)).length, 0);
  ok(`initial JS is ${Math.round(gz / 1024)} KB gzipped (≤ 400)`, gz <= 400 * 1024);
  const { ctx, page } = await ctxFor({ phone: true });
  await makeKid(page, 'Wen'); const sizes = [];
  page.on('response', async (r) => { try { sizes.push((await r.body()).length); } catch {} });
  await go(page, '#/home'); sizes.length = 0; await page.reload(); await page.waitForTimeout(1500);
  const tot = sizes.reduce((a, b) => a + b, 0);
  ok(`the phone's first screen is ${(tot / 1048576).toFixed(2)} MB (≤ 1.5)`, tot <= 1.5 * 1048576);
  await ctx.close();
}

await browser.close(); srv.kill();
if (fail) { console.log(`ui: ${fail} FAILED of ${n}`); process.exit(1); }
console.log(`ui: all ${n} passed`);
