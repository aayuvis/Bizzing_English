/* ui.mjs — the BUILT app in Chromium at its real sub-path (/Bizzing_English/), desktop 1280 and phone
   390, light and dark (SPEC §13, FAMILY-STANDARD §22). Run after `npm run build`.

   Overflow is measured against the viewport WE set: Chromium's mobile emulation widens innerWidth to
   fit overflow, which once made the family's phone check blind. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { checkShell, checkPageHead } from '/home/user/Bizzing_English/app/src/integration/shell-check.mjs';

const BUILD = new URL('file:///home/user/Bizzing_English/app/build').pathname, SITE = '/tmp/bz-english-site', PORT = 8790 + Math.floor(Math.random() * 100);
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


const OUT='/tmp/claude-0/-home-user/186808ab-97be-5690-ab56-28efe30f462a/scratchpad/shots/';
mkdirSync(OUT,{recursive:true});
for (const [phone, dark] of [[false,false],[true,true]]) {
  const { ctx, page } = await ctxFor({ phone, dark }); await makeKid(page, 'Ravi', '8–10');
  const tag = phone ? 'phone' : 'desk';
  const ready = () => page.waitForFunction(() => /new to you/.test(document.querySelector('[data-mem]')?.textContent || ''), null, { timeout: 15000 });
  await page.evaluate(() => { const h = window.__bz.S.h, k = h.kids.find((x) => x.id === h.active); k.games.figure = { level: 3, top: 3, stars: {1: 3, 2: 2} }; k.games.plot = { level: 3, top: 3 }; });
  await go(page, '#/play/figure'); await ready(); await page.screenshot({ path: OUT + tag + '-title.png', fullPage: true });
  await page.click('[data-act=game-start]'); await page.waitForTimeout(3000);
  for (let k=0;k<6;k++){ const q = await page.evaluate(()=>window.__bz.S.run.g.rounds[window.__bz.S.run.g.i]); if (q.hunt) break; await page.keyboard.press(String(q.answer+1)); await page.waitForTimeout(1300); }
  await page.screenshot({ path: OUT + tag + '-hunt.png', fullPage: true });
  await go(page, '#/play/who'); await ready(); await page.click('[data-act=game-start]'); await page.waitForTimeout(500); await page.click('[data-act=who-clue]'); await page.click('[data-act=who-clue]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + tag + '-who.png', fullPage: true });
  await go(page, '#/play/plot'); await ready(); await page.click('[data-act=game-start]'); await page.waitForTimeout(1500); await page.keyboard.press('1'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + tag + '-plot.png', fullPage: true });
  await page.evaluate(() => { window.__bz.S.run.run.round = 3; window.__bz.S.run.phase='between'; window.__bz.S.run.last={score:4,acc:{pct:.8},met:3}; window.__bz.render(); }); await page.click('[data-act=game-round]'); await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + tag + '-missing.png', fullPage: true });
  await go(page, '#/play/duel'); await ready(); await page.click('[data-act=game-start]'); await page.waitForTimeout(500); let q = await page.evaluate(()=>window.__bz.S.run.g.rounds[0]); await page.keyboard.press(String(q.strong+1)); await page.waitForTimeout(150); await page.keyboard.press(String((q.answer+1)%4+1)); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + tag + '-duel.png', fullPage: true });
  await go(page, '#/play/root'); await ready(); await page.click('[data-act=game-start]'); await page.waitForTimeout(1000);
  await page.evaluate(() => { window.__bz.S.run.run.round = 3; window.__bz.S.run.phase='between'; window.__bz.S.run.last={score:4,acc:{pct:.8},met:3}; window.__bz.render(); }); 
  await page.screenshot({ path: OUT + tag + '-between.png', fullPage: true });
  await page.click('[data-act=game-round]'); await page.waitForTimeout(1500);
  for (let k=0;k<20;k++){ const s=await page.evaluate(()=>{const r=window.__bz.S.run;return {ph:r.phase, st:r.g?.state, a:r.g?.rounds[r.g.i]?.answer, i:r.g?.i}}); if(s.ph!=='play')break; if(s.i===1 && !s.st){ await page.screenshot({ path: OUT + tag + '-family.png', fullPage: true }); } if(s.st){await page.waitForTimeout(1200);continue;} await page.keyboard.press(String(s.a+1)); await page.waitForTimeout(300);}
  await page.waitForTimeout(500); await page.screenshot({ path: OUT + tag + '-done.png', fullPage: true });
  console.log(tag, page.errs);
  await ctx.close();
}
await browser.close(); srv.kill();
