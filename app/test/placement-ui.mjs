/* placement-ui.mjs — "Find my starting place" in the BUILT app, under /Bizzing_English/ in Chromium, desktop
   1280 and phone 390×844. A child is onboarded through the welcome; the check is taken by KEYBOARD (desktop)
   and by TAP (phone); a wrong answer holds until "Got it"; the result is shown and lands in k.place; nothing is
   passed, paid or mastered. Skip still goes straight to the first stop; taking it again only moves forward.
   No page errors, no 4xx, no third-party request, no sideways scroll. Run after `npm run build`. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync } from 'node:fs';
import { checkPageHead } from '../src/integration/shell-check.mjs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-place-site' + (process.env.BZ_BUILD ? '-' + process.pid : ''), PORT = 8900 + Math.floor(Math.random() * 90);
if (!existsSync(BUILD)) { console.log('placement-ui: run `npm run build` first'); process.exit(1); }
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`;
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: EXE });
let fail = 0, n = 0; const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } };
const ALLOWED = (u) => u.startsWith(`http://127.0.0.1:${PORT}/`) || u.startsWith('data:') || u.startsWith('blob:');

async function ctxFor({ phone = false, dark = false } = {}) {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.reqs = []; page.errs = [];
  page.on('request', (r) => page.reqs.push(r.url()));
  page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
  page.on('response', (res) => { if (res.status() >= 400) page.errs.push(`${res.status()} ${res.url()}`); });
  return { ctx, page };
}
const kidOf = (page) => page.evaluate(() => { const S = window.__bz.S; return JSON.parse(JSON.stringify(S.h.kids.find((k) => k.id === S.h.active))); });
const place = (page) => page.evaluate(() => { const p = window.__bz.S.place; if (!p) return null; const it = p.phase === 'word' ? p.items[p.i] : p.phase === 'read' ? p.read.items[p.i] : null;
  return { phase: p.phase, i: p.i, answer: it?.answer, n: it?.options.length, done: !!p.state?.done, ok: !!p.state?.ok }; });
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth);
const emoji = (page) => page.evaluate(() => [...document.querySelectorAll('button, nav, h1, h2, h3, .btn, .bz-chip')].map((e) => e.textContent).join(' ').match(/\p{Extended_Pictographic}/gu) || []);

async function onboard(page, name, band, phone) {
  await page.goto(BASE); await page.waitForTimeout(600);
  const tap = (sel) => (phone ? page.tap(sel) : page.click(sel));
  await tap('[data-act=ob-start]');
  await page.fill('#obn', name); await tap('[data-act=ob-name]');
  await tap(`button:has-text("ages ${band}")`);
  await tap('[data-act=ob-face] >> nth=0');
}

/* answer the current question: `right` picks the item's own answer, otherwise the next option round */
async function answerOne(page, right, phone) {
  const s = await place(page); const i = right ? s.answer : (s.answer + 1) % s.n;
  if (phone) await page.tap(`.pl-item [data-act=pl-pick][data-arg="${i}"]`); else await page.keyboard.press(String(i + 1));
  await page.waitForTimeout(250);
  return s;
}
async function dismissIfHeld(page, phone) {
  const s = await place(page);
  if (s.done && !s.ok) {
    await page.waitForTimeout(1300);
    ok(`${phone ? 'phone' : 'desktop'}: a wrong answer holds until it is dismissed`, (await place(page)).done && await page.locator('[data-act=pl-next]').isVisible());
    if (phone) await page.tap('[data-act=pl-next]'); else await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  } else await page.waitForTimeout(1100);   // a right answer advances by itself
}

for (const phone of [false, true]) for (const dark of [false, true]) {
  const tag = `${phone ? 'phone' : 'desktop'} ${dark ? 'dark' : 'light'}`, W = phone ? 390 : 1280;
  const { ctx, page } = await ctxFor({ phone, dark });

  /* 1. onboard, then the check: word part, by keyboard on desktop and by tap on the phone */
  await onboard(page, 'Tara', '8–10', phone);
  ok(`${tag}: the face step offers the check first and Skip second`, (await page.locator('.ob-choose .btn').first().textContent()).includes('Find my starting place') && (await page.locator('[data-act=ob-go]').textContent()).includes('Skip'));
  ok(`${tag}: the face step does not scroll sideways`, (await wide(page)) <= W);
  if (phone) await page.tap('[data-act=ob-place]'); else await page.click('[data-act=ob-place]');
  await page.waitForTimeout(1200);
  ok(`${tag}: the check opens at #/place/first`, /#\/place\/first$/.test(page.url()), page.url());
  ok(`${tag}: the first question is on screen`, (await place(page))?.phase === 'word' && await page.locator('.pl-item .opt').first().isVisible());
  const ph = await checkPageHead(page, { phone }); ok(`${tag}: the check's page head matches the family's`, ph.length === 0, ph.join('; '));
  ok(`${tag}: the check does not scroll sideways (${await wide(page)}px)`, (await wide(page)) <= W);
  ok(`${tag}: no emoji in a control or heading`, (await emoji(page)).length === 0);

  /* tier 1 right, tier 2: one wrong (it holds), then right — the climb stops at Word 2 — then the rest */
  const plan = [true, true, false, true, true, true, true, true];
  for (let q = 0; q < plan.length; q++) {
    const s = await place(page); if (s.phase !== 'word') break;
    await answerOne(page, plan[q], phone); await dismissIfHeld(page, phone);
  }
  let s = await place(page);
  ok(`${tag}: after eight questions, the passage`, s.phase === 'passage' && await page.locator('.pl-passage p').first().isVisible(), JSON.stringify(s));
  ok(`${tag}: the passage does not scroll sideways`, (await wide(page)) <= W);
  if (phone) await page.tap('[data-act=pl-read]'); else { await page.focus('body'); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(400);
  ok(`${tag}: three questions on the story`, (await place(page)).phase === 'read');
  for (const r of [true, true, false]) { await answerOne(page, r, phone); await dismissIfHeld(page, phone); }
  await page.waitForTimeout(300);
  const k = await kidOf(page), t = await page.evaluate(() => document.body.innerText);
  ok(`${tag}: the result is set per strand (Word 2, and Reading 1 from a fable answered 2 of 3)`, k.place?.word === 2 && k.place?.reading === 1 && k.place.at > 0, JSON.stringify(k.place));
  ok(`${tag}: the result is shown kindly with Quill`, t.includes('You’ll start at Word 2 and Reading 1') && await page.locator('.pl-done .pl-guide img[src*="cheer"]').isVisible());
  ok(`${tag}: placement passed no stop, paid nothing, touched no mastery and counted nothing`, Object.keys(k.stops).length === 0 && Object.keys(k.mastery).length === 0 && k.misses.length === 0 && Object.keys(k.days).length === 0
    && await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet') || 'null'); return !w || !w.kids?.tara || !(w.kids.tara.coins > 0); }));
  ok(`${tag}: the result does not scroll sideways`, (await wide(page)) <= W);
  if (phone) await page.tap('.pl-result a'); else await page.click('.pl-result a');
  await page.waitForTimeout(900);
  const nx = await page.evaluate(() => location.hash);
  ok(`${tag}: Start my journey goes to a Word 2 stop`, /^#\/stop\/w2-/.test(nx), nx);

  /* 2. taken again later: only forward. All wrong → stops after two, the start stays */
  await page.evaluate(() => { location.hash = '#/place'; }); await page.waitForTimeout(1000);
  ok(`${tag}: the check can be taken again at #/place`, (await place(page))?.phase === 'word');
  for (let q = 0; q < 4; q++) { const st = await place(page); if (st.phase !== 'word') break; await answerOne(page, false, phone); await dismissIfHeld(page, phone); }
  ok(`${tag}: two misses in a row end the word part early`, (await place(page)).phase === 'passage');
  await page.locator('[data-act=pl-read]').click(); await page.waitForTimeout(300);
  for (let q = 0; q < 3; q++) { await answerOne(page, false, phone); await dismissIfHeld(page, phone); }
  const k2 = await kidOf(page);
  ok(`${tag}: a retake never lowers a start`, k2.place.word === 2 && k2.place.reading >= 1, JSON.stringify(k2.place));

  ok(`${tag}: no page errors or 4xx`, page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  ok(`${tag}: no third-party requests`, page.reqs.every(ALLOWED), page.reqs.filter((u) => !ALLOWED(u)).slice(0, 3).join(' '));
  await ctx.close();
}

/* 3. Skip still goes straight to the first stop, at the band's start, with no place */
for (const phone of [false, true]) {
  const { ctx, page } = await ctxFor({ phone });
  await onboard(page, 'Omar', '11–14', phone);
  if (phone) await page.tap('[data-act=ob-go]'); else await page.click('[data-act=ob-go]');
  await page.waitForTimeout(900);
  const k = await kidOf(page);
  ok(`${phone ? 'phone' : 'desktop'}: Skip goes to the first stop, with no place set`, /#\/stop\//.test(page.url()) && k.place === null, page.url());
  ok(`${phone ? 'phone' : 'desktop'}: Skip: no page errors or third-party requests`, page.errs.length === 0 && page.reqs.every(ALLOWED), page.errs.join(' | '));
  await ctx.close();
}

await browser.close(); srv.kill();
if (fail) { console.log(`placement-ui: ${fail} FAILED of ${n}`); process.exit(1); }
console.log(`placement-ui: all ${n} passed`);
