/* coach-ui.mjs — the Coach and Bee's daily goal in the BUILT app (Chromium, /Bizzing_English/, desktop and phone,
   light and dark). Home's ring card shows App time, Practise time and Right answers and opens the Coach by tap and
   by keyboard; checkShell stays [] on Home in all four; the Coach shows Quill's read, the traps as a chart, switches
   traps by the arrow keys and by touch, and "Practise this" opens the exact stop; the thirty days chart; practice
   seconds count inside a stop and not on a menu, and stop while the tab is hidden; the Practice page and the
   grown-ups' report name the top trap; no sideways scroll on a phone; no page errors, no 4xx, no third-party request.

   BZ_BUILD=<dir> tests a build elsewhere (as test/ui.mjs). */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync } from 'node:fs';
import { checkShell, checkPageHead } from '../src/integration/shell-check.mjs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-coach' + (process.env.BZ_BUILD ? '-' + process.pid : ''), PORT = 8890 + Math.floor(Math.random() * 100);
if (!existsSync(BUILD)) { console.log('coach-ui: run `npm run build` first'); process.exit(1); }
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`, SHOTS = process.env.BZ_SHOTS || '';
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: EXE });
let fail = 0, n = 0; const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } };
const BEE_AUDIO = 'https://raw.githubusercontent.com/aayuvis/Bizzing-Bee/main/spellbound-app/voice/w/';
const ALLOWED = (u) => u.startsWith(`http://127.0.0.1:${PORT}/`) || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith(BEE_AUDIO);

async function ctxFor({ phone = false, dark = false } = {}) {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.reqs = []; page.errs = []; page.setDefaultTimeout(5000);
  page.on('request', (r) => page.reqs.push(r.url()));
  page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
  page.on('response', (res) => { if (res.status() >= 400) page.errs.push(`${res.status()} ${res.url()}`); });
  await page.route((u) => u.href.startsWith(BEE_AUDIO), (r) => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }));
  return { ctx, page };
}
const go = async (p, hash) => { if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); } await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(450); };
async function makeKid(page, name = 'Mira', band = '8–10') {
  await page.goto(BASE); await page.waitForTimeout(600);
  await page.click('[data-act=ob-start]'); await page.fill('#obn', name); await page.click('[data-act=ob-name]');
  await page.click(`button:has-text("ages ${band}")`); await page.click('[data-act=ob-face] >> nth=0'); await page.click('[data-act=ob-go]'); await page.waitForTimeout(700);
}
const K = (page, f) => page.evaluate(f);
/* forgiving reads and taps: a missing element fails its own check, never the whole run (so a break shows every check it trips) */
const txt = async (page, sel) => (await page.$(sel).then((e) => e?.textContent()).catch(() => '')) || '';
const ev = async (page, sel, f) => { const e = await page.$(sel).catch(() => null); return e ? e.evaluate(f).catch(() => null) : null; };
const act = async (page, phone, sel) => { try { if (phone) await page.tap(sel, { timeout: 3000 }); else await page.click(sel, { timeout: 3000 }); return true; } catch { return false; } };
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }); };
/* misses as the runner and the games record them (k.misses from a check; k.slips from a round) */
const plant = (page) => K(page, () => { const k = window.__bz.S.h.kids[0], t = Date.now();
  for (let i = 0; i < 4; i++) k.misses.push({ stop: 's5-comma', item: `commas:p${i}`, at: t - i * 6e4 });
  k.misses.push({ stop: 's2-tense', item: 'au:s2-tense:1', at: t }, { stop: null, item: 'storyword:aesop-town-mouse:0', at: t });
  k.slips = [{ g: 'rush', c: 'list', n: 2, at: t }, { g: 'figure', c: 'simile', n: 1, at: t }]; window.__bz.render(); });

for (const phone of [false, true]) for (const dark of [false, true]) {
  const tag = `${phone ? 'phone' : 'desktop'} ${dark ? 'dark' : 'light'}`;
  const { ctx, page } = await ctxFor({ phone, dark });
  await makeKid(page);
  await go(page, '#/home');
  const sh = await checkShell(page, { phone });
  ok(`${tag}: checkShell [] on Home with the new ring card`, sh.length === 0, '\n   ' + sh.join('\n   '));
  const ring = await ev(page, '[data-bz=ring]', (e) => ({ text: e.innerText.replace(/\s+/g, ' '), rings: e.querySelectorAll('svg.bz-rings circle').length, open: !!e.querySelector('a[data-coach-open][href="#/coach"]'),
    foot: e.querySelector('.bz-ringfoot')?.getAttribute('href') || '', nested: !!e.querySelector('a a, button button, a button') }));
  ok(`${tag}: the ring card shows App time, Practise time and Right answers, and Coach speaks (${ring.text})`, /App time[\s\S]*Practise time[\s\S]*Right answers/.test(ring.text) && /Coach speaks/.test(ring.text) && ring.rings >= 3 && ring.open, JSON.stringify(ring));
  ok(`${tag}: the level strip along the foot stays its own link to the road`, /^#\/atlas/.test(ring.foot) && !ring.nested);
  ok(`${tag}: the card never says time is learning`, !/learn/i.test(ring.text));
  await shot(page, `home-${phone ? 'phone' : 'desk'}-${dark ? 'dark' : 'light'}`);
  /* a tap opens the Coach */
  await act(page, phone, '[data-coach-open]');
  await page.waitForTimeout(500);
  ok(`${tag}: a tap on the rings opens the Coach`, /#\/coach$/.test(page.url()), page.url());
  if (!/#\/coach$/.test(page.url())) await go(page, '#/coach');
  ok(`${tag}: with no misses, Quill says nothing is catching them yet`, /Nothing is catching you yet/.test(await txt(page, 'main')) && !!(await page.$('[data-coach=none] a[href="#/continue"]')) && !(await page.$('[data-coach=traps]')));
  const ph = await checkPageHead(page, { phone });
  ok(`${tag}: the Coach's page head matches Bee`, ph.length === 0, ph.join('; '));
  await plant(page);
  await page.waitForTimeout(200);
  const read = await txt(page, '[data-coach=read]');
  ok(`${tag}: Quill's read names the top trap (${read.trim()})`, /commas/i.test(read) && /6 of your/.test(read));
  const traps = await page.$$eval('[data-act=coach-trap]', (b) => b.map((x) => [x.dataset.arg, x.getAttribute('aria-pressed')]));
  while (traps.length < 4) traps.push(['', '']);
  ok(`${tag}: the traps are a chart, worst first, the worst chosen (${JSON.stringify(traps)})`, traps.length === 4 && traps[0][0] === 'commas' && traps[0][1] === 'true' && traps.filter((x) => x[1] === 'true').length === 1);
  ok(`${tag}: the chosen trap is a path — meet it, see it, watch it work, beat it`, await ev(page, '[data-coach=detail]', (e) => e.dataset.trap === 'commas' && e.querySelectorAll('.co-step').length === 4 && /In your head/.test(e.textContent) && e.querySelectorAll('.co-eg').length >= 2));
  ok(`${tag}: a quoted example names its book`, /Little Women/.test(await txt(page, '[data-coach=detail]')));
  const emo = await page.evaluate(() => [...document.querySelectorAll('main button, main h1, main h2, main h3, main .btn, main .bz-chip')].map((e) => e.textContent).join(' ').match(/\p{Extended_Pictographic}/gu) || []);
  ok(`${tag}: no emoji in the Coach's controls or headings`, emo.length === 0, emo.join(''));
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(`${tag}: the Coach does not scroll sideways (${w}px)`, w <= (phone ? 390 : 1280));
  await shot(page, `coach-${phone ? 'phone' : 'desk'}-${dark ? 'dark' : 'light'}`);
  /* the arrow keys walk the traps; a tap picks one */
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250);
  const sel1 = await ev(page, '[data-coach=detail]', (e) => e.dataset.trap);
  ok(`${tag}: ArrowDown moves to the next trap (${sel1}) and focuses it`, sel1 === traps[1][0] && await page.evaluate((id) => document.activeElement?.dataset.arg === id, sel1));
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(250);
  ok(`${tag}: ArrowUp moves back`, (await ev(page, '[data-coach=detail]', (e) => e.dataset.trap)) === 'commas');
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(250);
  ok(`${tag}: ArrowUp from the first wraps to the last`, (await ev(page, '[data-coach=detail]', (e) => e.dataset.trap)) === traps.at(-1)[0]);
  const tapId = traps[2][0];
  await act(page, phone, `[data-act=coach-trap][data-arg="${tapId}"]`);
  await page.waitForTimeout(250);
  ok(`${tag}: a tap picks a trap (${tapId})`, (await ev(page, '[data-coach=detail]', (e) => e.dataset.trap)) === tapId);
  /* Practise this → the exact stop */
  await act(page, false, '[data-act=coach-trap][data-arg="commas"]'); await page.waitForTimeout(200);
  const href = await ev(page, '[data-coach=practise]', (e) => e.getAttribute('href'));
  await act(page, phone, '[data-coach=practise]');
  await page.waitForTimeout(700);
  ok(`${tag}: Practise this opens the exact stop (${href})`, href === '#/stop/s5-comma' && /#\/stop\/s5-comma$/.test(page.url()) && /Commas/.test(await txt(page, '[data-bz=ph-title]')));
  if (!phone && !dark) {
    /* by keyboard: Tab to the rings on Home, Enter opens the Coach */
    await go(page, '#/home'); await page.evaluate(() => document.activeElement?.blur());
    let found = false; for (let i = 0; i < 80 && !found; i++) { await page.keyboard.press('Tab'); found = await page.evaluate(() => document.activeElement?.matches('[data-coach-open]')); }
    ok('desktop: Tab reaches the rings on Home', found);
    await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    ok('desktop: Enter on the rings opens the Coach', /#\/coach$/.test(page.url()), page.url());
    if (!/#\/coach$/.test(page.url())) await go(page, '#/coach');
    /* the Coach's rings open the last thirty days */
    await act(page, false, '.co-today'); await page.waitForTimeout(400);
    ok('the Coach’s rings open the last thirty days', /#\/coach\/days$/.test(page.url()) && (await page.$$('.cd-bar')).length === 30 && !!(await page.$('.cd-line')));
    await act(page, false, '[data-act=coach-metric][data-arg=words]'); await page.waitForTimeout(200);
    ok('the thirty days switch to Right answers', await ev(page, '[data-act=coach-metric][data-arg=words]', (e) => e.getAttribute('aria-pressed') === 'true') && /Right answers/.test(await txt(page, '[data-coach=days]')));
    const dh = await checkPageHead(page, { phone }); ok('the thirty days page head matches Bee', dh.length === 0, dh.join('; '));
    await shot(page, 'coach-days-desk');
    /* practice seconds: inside a stop yes, on a menu no, hidden no */
    const prac = () => K(page, () => { const d = new Date(), k = window.__bz.S.h.kids[0], key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; return k.days[key]?.prac || 0; });
    const busy = async (ms) => { for (let t = 0; t < ms; t += 500) { await page.mouse.move(300 + (t % 40), 400); await page.waitForTimeout(500); } };
    await go(page, '#/stop/s5-caps'); const p0 = await prac(); await busy(4200); const p1 = await prac();
    ok(`practice seconds count inside a stop (${p0} → ${p1})`, p1 - p0 >= 3 && p1 - p0 <= 6);
    await go(page, '#/atlas'); const p2 = await prac(); await busy(3200); const p3 = await prac();
    ok(`practice seconds do not count on a menu (${p2} → ${p3})`, p3 === p2);
    await go(page, '#/stop/s5-caps'); await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    const p4 = await prac(); await busy(3200); const p5 = await prac();
    ok(`practice seconds stop while the tab is hidden (${p4} → ${p5})`, p5 === p4);
    await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
    ok('the seconds reach the household on this device', await page.evaluate(() => { try { const h = JSON.parse(localStorage.getItem('bizzing-english.household')); return Object.values(h.kids[0].days).some((d) => d.prac > 0) && h.v === 7; } catch { return false; } }));
    await go(page, '#/home');
    ok('Home’s Practise ring has begun to fill (a few seconds, still 0m in whole minutes)', !!(await page.$('[data-bz=ring] svg.bz-rings [data-ring="1"]')));
    /* the Practice page and the grown-ups' report name the top trap */
    await go(page, '#/practice');
    ok('the Practice page names the top trap and opens the Coach', /What catches you most: Commas/.test(await txt(page, '[data-coach-card]')) && !!(await page.$('[data-coach-card] a[href="#/coach"]')));
    await go(page, '#/grownups'); for (const d of '2468') await page.keyboard.press(d); await page.waitForTimeout(400);
    ok('the grown-ups’ report names the top trap', /Coach — the trap that catches Mira most is Commas/.test(await txt(page, '[data-coach-line]')));
    const tg = await page.$$eval('[data-targets] input', (e) => e.map((x) => [x.dataset.arg.split(':')[1], +x.value]));
    ok(`the grown-up sets three daily targets (${JSON.stringify(tg)})`, tg.map((x) => x[0]).join() === 'app,prac,words' && tg[0][1] === 20 && tg[1][1] === 10 && tg[2][1] === 15);
    await page.fill('[data-targets] input >> nth=0', '45', { timeout: 3000 }).catch(() => {}); await page.dispatchEvent('[data-targets] input >> nth=0', 'change', {}, { timeout: 3000 }).catch(() => {}); await page.waitForTimeout(200);
    ok('a target set here is this child’s own', await K(page, () => window.__bz.S.h.kids[0].targets.app === 45));
    await go(page, '#/home');
    ok('…and Home’s App line reads against it', /\/ 45m|goal of 45m/.test(await ev(page, '[data-bz=ring]', (e) => e.innerText)));
  }
  if (phone && !dark) {
    for (const h of ['#/coach', '#/coach/days', '#/practice', '#/grownups']) { await go(page, h); const w2 = await page.evaluate(() => document.documentElement.scrollWidth); ok(`phone: ${h} does not scroll sideways (${w2}px)`, w2 <= 390); }
    await go(page, '#/coach/days'); await shot(page, 'coach-days-phone');
  }
  ok(`${tag}: no page errors and no 4xx`, page.errs.length === 0, page.errs.slice(0, 4).join(' | '));
  ok(`${tag}: no third-party request`, page.reqs.every(ALLOWED), page.reqs.filter((u) => !ALLOWED(u)).slice(0, 3).join(' '));
  await ctx.close();
}

/* the sample: three weeks in, its own App time and a Coach with something to say; it saves nothing */
{
  const { ctx, page } = await ctxFor({});
  await page.goto(BASE + '?demo#/home'); await page.waitForTimeout(900);
  const t = await ev(page, '[data-bz=ring]', (e) => e.innerText.replace(/\s+/g, ' '));
  ok(`the sample's rings read its own day (${t})`, /App time 13m \/ 20m/.test(t) && /Practise time 9m \/ 10m/.test(t));
  await go(page, '#/coach');
  ok('the sample’s Coach names its worst trap', /word classes/i.test(await txt(page, '[data-coach=read]')));
  ok('the sample saves nothing', await page.evaluate(() => !localStorage.getItem('bizzing-english.household')));
  await shot(page, 'coach-demo');
  ok('the sample: no page errors', page.errs.length === 0, page.errs.join(' | '));
  await ctx.close();
}

await browser.close(); srv.kill();
if (fail) { console.log(`coach-ui: ${fail} FAILED of ${n}`); process.exit(1); }
console.log(`coach-ui: all ${n} passed`);
