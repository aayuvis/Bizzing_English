/* forge-ui.mjs — ROOT FORGE in the BUILT app, in Chromium at the real sub-path (patterned on test/games-ui.mjs,
   honouring BZ_BUILD so parallel work builds into its own folder). Each check was watched failing once:

     · the fire is lit in idle time from the Play tab (Bee's list fetched, its progress on the title);
     · a word forged by DRAG (a part dragged onto the anvil), by TAP, and by KEYS (a number, ← → and Enter,
       Space to strike) — each glows, shows its meaning and goes into the Forge Book (stored per child);
     · a made-up word CRACKS, holds until Continue, and says what each piece means;
     · the Forge Book shows the words by their parts, and survives a reload;
     · the stage: mirrored and centred, no page scroll, no flat colour over 6% (T14, T15);
     · phone 390 × 844 (dark): every control on screen, above the tab bar, ≥ 40 px — the crack card too (T11);
     · no page errors and no 4xx/5xx response anywhere (T9). */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync, writeFileSync } from 'node:fs';
import { PNG } from './_png.mjs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-forge-site' + (process.env.BZ_BUILD ? '-' + process.pid : ''), PORT = 8990 + Math.floor(Math.random() * 100);
const SHOTS = process.env.BZ_SHOTS || '';
if (!existsSync(BUILD)) { console.log('forge-ui: run `npm run build` first'); process.exit(1); }
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`;
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: EXE });
let fail = 0, n = 0; const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } else if (process.env.BZ_VERBOSE) console.log('✓', m); return !!c; };
const BEE_AUDIO = 'https://raw.githubusercontent.com/aayuvis/Bizzing-Bee/main/spellbound-app/voice/w/';

async function ctxFor({ phone = false, dark = false } = {}) {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
  page.on('response', (res) => { if (res.status() >= 400) page.errs.push(`${res.status()} ${res.url()}`); });
  await page.route((u) => u.href.startsWith(BEE_AUDIO), (r) => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }));
  return { ctx, page };
}
const go = async (p, hash) => { if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); } await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(450); };
async function makeKid(page, name = 'Mira', band = '8–10') {
  await page.goto(BASE); await page.waitForTimeout(600);
  await page.click('[data-act=ob-start]'); await page.fill('#obn', name); await page.click('[data-act=ob-name]');
  await page.click(`button:has-text("ages ${band}")`); await page.click('[data-act=ob-face] >> nth=0'); await page.click('[data-act=ob-go]');
  await page.waitForTimeout(700);
}
const G = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__bz.S.run?.g || null)));
const phase = async (page, want, ms = 10000) => { try { await page.waitForFunction((w) => window.__bz.S.run?.phase === w, want, { timeout: ms }); return true; } catch { return false; } };
const book = (page) => page.evaluate(() => { const h = window.__bz.S.h; return JSON.parse(JSON.stringify(h.kids.find((k) => k.id === h.active).games.root?.book || {})); });
const shot = async (page, name, el) => { const buf = el ? await (await page.$(el)).screenshot() : await page.screenshot(); if (SHOTS) writeFileSync(`${SHOTS}/${name}.png`, buf); return buf; };
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
const flatOk = (f) => f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02, flatTxt = (f) => `${(f.flat * 100).toFixed(1)}%, ${(f.white * 100).toFixed(1)}%, ${(f.black * 100).toFixed(1)}%`;
const symmetry = (page) => page.evaluate(() => {
  const st = document.querySelector('.stg'); if (!st) return null;
  const s = st.getBoundingClientRect(), box = (q) => { const e = st.querySelector(q); return e ? e.getBoundingClientRect() : null; };
  const l = box('.stg-pod.stg-l'), r = box('.stg-pod.stg-r'), m = box('.stg-mid'), main = st.querySelector('[data-stage-main]'), play = main?.querySelector('[data-play]') || main;
  const p = play.getBoundingClientRect(), cx = s.left + s.width / 2;
  const kids = [...main.children].map((e) => e.getBoundingClientRect()), largest = kids.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a), kids[0] || p);
  const ctl = [...st.querySelectorAll('.stg-ctl > *')].map((e) => e.getBoundingClientRect()), cl = ctl.length ? Math.min(...ctl.map((x) => x.left)) : 0, cr = ctl.length ? Math.max(...ctl.map((x) => x.right)) : 0;
  return { hud: Math.abs((l.left - s.left) - (s.right - r.right)), podW: Math.abs(l.width - r.width), mid: Math.abs(m.left + m.width / 2 - cx), play: Math.abs(p.left + p.width / 2 - cx), ctl: ctl.length ? Math.abs((cl + cr) / 2 - cx) : 0,
    playIsLargest: Math.abs(largest.width * largest.height - p.width * p.height) < 2, scrollY: document.documentElement.scrollHeight - innerHeight, scrollX: document.documentElement.scrollWidth - innerWidth };
});
const symOk = (s) => s && s.hud <= 4 && s.podW <= 4 && s.mid <= 4 && s.play <= 4 && s.ctl <= 4 && s.playIsLargest && s.scrollY <= 1 && s.scrollX <= 0;
const phoneFit = (page, sel = '.stg button, .stg a') => page.evaluate((sel) => {
  const bar = document.querySelector('.bz-tabbar'), barTop = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight, bad = [];
  for (const e of document.querySelectorAll(sel)) { const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === 'hidden') continue;
    if (r.bottom > barTop + 0.5 || r.top < 0 || r.right > innerWidth + 0.5 || r.left < -0.5) bad.push(`off screen: ${e.className || e.tagName} ${Math.round(r.top)}–${Math.round(r.bottom)} (bar ${Math.round(barTop)})`);
    if (r.height < 40 || r.width < 40) bad.push(`small: ${e.className || e.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`); }
  return bad;
}, sel);
/* a word the round has not found yet, and the tray indexes of its parts */
const nextTarget = (g) => { const t = g.targets.find((x) => !g.found.some((f) => f.word === x.word)); return t ? { word: t.word, idx: t.ids.map((id) => g.tray.findIndex((p) => p.id === id)) } : null; };
const settle = async (page) => { await page.waitForFunction(() => !window.__bz.S.run?.g?.state || window.__bz.S.run.phase !== 'play', null, { timeout: 4000 }).catch(() => {}); await page.waitForTimeout(80); };
async function dragPart(page, i, slot) {
  const a = await (await page.$(`.fg-part[data-arg="${i}"]`)).boundingBox(), b = await (await page.$(`.fg-slot[data-slot="${slot}"]`)).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  for (let k = 1; k <= 8; k++) await page.mouse.move(a.x + a.width / 2 + ((b.x + b.width / 2) - (a.x + a.width / 2)) * k / 8, a.y + a.height / 2 + ((b.y + b.height / 2) - (a.y + a.height / 2)) * k / 8);
  await page.mouse.up(); await page.waitForTimeout(120);
}
/* the meaning is in view: the plaque's definition lies inside the stage's play area, not scrolled or clipped away */
const defInView = (page) => page.evaluate(() => { const d = document.querySelector('.fg-plaque .fg-def'), m = document.querySelector('[data-stage-main]'); if (!d || !m) return false; const a = d.getBoundingClientRect(), b = m.getBoundingClientRect(); return a.height > 0 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1 && m.scrollTop === 0; });
const lit = async (page) => { try { await page.waitForSelector('.fg-load.done', { timeout: 25000, state: 'attached' }); return true; } catch { return false; } };

/* =====================================================================================================
   desktop, light
   ===================================================================================================== */
{
  const { ctx, page } = await ctxFor();
  await makeKid(page);
  await go(page, '#/play'); await page.waitForSelector('.pcards');
  const cards = await page.$$eval('.pcard', (c) => c.map((e) => e.dataset.card));
  ok(`the Play tab keeps its cards, Root Forge among them (${cards.join(', ')})`, cards.length === 5 && cards.includes('root'));
  await page.waitForTimeout(3000);
  ok('the Play tab lights the forge in idle time: Bee’s list fetched and the forge built before Root Forge is opened', await page.evaluate(() => performance.getEntriesByType('resource').some((e) => /data\/bee-words\.json/.test(e.name)) && document.documentElement.dataset.forge === 'hot'));
  await go(page, '#/play/root'); await phase(page, 'title');
  ok('…so the title opens with the forge already hot', await page.evaluate(() => !!document.querySelector('.fg-load.done')));
  ok('the title shows the fire lit', await lit(page));
  ok('the title: a forged example, the level chip, the rank and the Forge Book', await page.evaluate(() => !!document.querySelector('.fg-demo') && document.querySelectorAll('.stg .lvchip .lvc-b').length === 6 && !!document.querySelector('.fg-rank') && !!document.querySelector('[data-act=forge-book]')));
  ok('T15 the title: mirrored and centred, no scroll', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const f = flatness(await shot(page, 'forge-title-desktop', '.stg')); ok(`T14 the title (${flatTxt(f)})`, flatOk(f)); }
  await page.click('[data-act=forge-book]'); await phase(page, 'book');
  ok('an empty Forge Book says what it will hold', !!(await page.$('.fg-empty')));
  await page.click('[data-act=forge-book-close]'); await phase(page, 'title');

  await page.click('[data-act=game-start]'); await phase(page, 'play'); await page.waitForSelector('.fg-tray');
  let g = await G(page);
  ok(`a round: ${g.tray.length} parts with their meanings, an anvil of ${g.slots}, "k of N found"`, g.tray.length >= 6 && g.tray.length <= 9 && (await page.$$('.fg-part small')).length === g.tray.length && (await page.$$('.fg-slot')).length === g.slots && (await page.$eval('.stg-pod.stg-l', (e) => e.textContent)).includes(`/${g.targets.length}`));
  ok('T15 in play: mirrored, the forge centred and largest, the controls mirrored, no scroll', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const f = flatness(await shot(page, 'forge-play-desktop', '.stg')); ok(`T14 in play (${flatTxt(f)})`, flatOk(f)); }
  ok('the world backdrop stands still in play', await page.evaluate(() => document.documentElement.classList.contains('bz-playing')));

  /* by DRAG: each part dragged onto its slot, then the Strike button */
  let t = nextTarget(g);
  for (let j = 0; j < t.idx.length; j++) await dragPart(page, t.idx[j], j);
  if (!ok('a part dragged onto the anvil lands in the slot', JSON.stringify((await G(page)).anvil) === JSON.stringify(t.idx), JSON.stringify((await G(page)).anvil))) {
    while ((await G(page)).anvil.length) await page.click('[data-act=fg-lift]'); for (const i of t.idx) await page.click(`.fg-part[data-arg="${i}"]`); }
  await page.click('[data-act=fg-strike]'); await page.waitForSelector('.fg-forge.glow', { timeout: 3000 }).catch(() => {});
  ok(`forged by drag: "${t.word}" glows and shows its meaning`, await page.evaluate((w) => document.querySelector('.fg-bar-hot')?.textContent.trim() === w && document.querySelector('.fg-plaque')?.dataset.glow === w && !!document.querySelector('.fg-plaque .fg-def'), t.word));
  await shot(page, 'forge-glow-desktop', '.stg');
  await page.waitForTimeout(450); ok('the meaning stands in view on the stage (desktop)', await defInView(page));
  ok('the word goes into the Forge Book, with its parts', await book(page).then((b) => !!b[t.word] && b[t.word].ids.length === t.idx.length));
  await settle(page);
  ok('the plaque stays to be read after the anvil clears', await page.evaluate((w) => document.querySelector('.fg-plaque')?.dataset.glow === w && !document.querySelector('.fg-ingot'), t.word));

  /* by TAP */
  g = await G(page); t = nextTarget(g);
  for (const i of t.idx) await page.click(`.fg-part[data-arg="${i}"]`);
  await page.click('[data-act=fg-strike]'); await page.waitForTimeout(200);
  ok(`forged by tap: "${t.word}"`, (await G(page)).found.some((f) => f.word === t.word) && await book(page).then((b) => !!b[t.word]));
  await settle(page);

  /* by KEYS: a number for the first part, ← → and Enter for the rest, Space to strike; Backspace lifts */
  g = await G(page); t = nextTarget(g);
  await page.keyboard.press(String(t.idx[0] + 1));
  ok('a number key places its part', (await G(page)).anvil[0] === t.idx[0]);
  if ((await G(page)).anvil[0] !== t.idx[0]) await page.click(`.fg-part[data-arg="${t.idx[0]}"]`);
  await page.keyboard.press('Backspace'); ok('Backspace lifts the last part off the anvil', (await G(page)).anvil.length === 0);
  await page.keyboard.press(String(t.idx[0] + 1)); if (!(await G(page)).anvil.length) await page.click(`.fg-part[data-arg="${t.idx[0]}"]`);
  for (const i of t.idx.slice(1)) { for (let k = 0; k < 12 && (await G(page)).cursor !== i; k++) await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); }
  if (!ok('keys place the parts in order', JSON.stringify((await G(page)).anvil) === JSON.stringify(t.idx), JSON.stringify((await G(page)).anvil))) {
    while ((await G(page)).anvil.length) await page.click('[data-act=fg-lift]'); for (const i of t.idx) await page.click(`.fg-part[data-arg="${i}"]`); }
  await page.keyboard.press(' '); await page.waitForTimeout(200);
  ok(`forged by keys: "${t.word}"`, (await G(page)).found.some((f) => f.word === t.word));
  await settle(page);

  /* a CRACK: two pieces that make no word */
  g = await G(page);
  const non = await page.evaluate(() => { const g = window.__bz.S.run.g, F = g.tray; for (let a = 0; a < F.length; a++) for (let b = 0; b < F.length; b++) if (a !== b && F[a].kind === 'suffix' && F[b].kind !== 'suffix') return [a, b]; return [0, 1]; });
  for (const i of non) await page.click(`.fg-part[data-arg="${i}"]`);
  await page.click('[data-act=fg-strike]'); await page.waitForTimeout(250);
  ok('a made-up word cracks: the anvil holds the cracked pieces and the miss card', await page.evaluate(() => !!document.querySelector('.fg-forge.crack') && !!document.querySelector('.fg-crackline') && !!document.querySelector('.miss[role=alert]')));
  ok('the crack says what each piece means', (await page.$$('.fg-why li')).length === non.length && await page.evaluate(() => /goes at the end|not a word/i.test(document.querySelector('.fg-held').textContent)));
  await shot(page, 'forge-crack-desktop', '.stg');
  ok('T15 the crack: mirrored, no scroll', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  const before = await G(page); await page.keyboard.press('1'); await page.waitForTimeout(100);
  ok('a crack holds until Continue', JSON.stringify((await G(page)).anvil) === JSON.stringify(before.anvil) && (await G(page)).state);
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  ok('Continue clears the anvil; the crack is counted, the score is not', !(await G(page)).state && !(await G(page)).anvil.length && (await G(page)).cracks.length === 1);

  /* the round ends into the shared run */
  await page.click('[data-act=fg-done]');
  ok('the round ends into the run', await phase(page, 'between'));
  /* the final: forge a family — the key part marked, the goal counted in its words */
  await page.evaluate(() => { window.__bz.S.run.run.round = 3; }); await page.click('[data-act=game-round]'); await phase(page, 'play'); await page.waitForSelector('.fg-tray');
  { const g = await G(page), key = g.tray.find((p) => p.id === g.key);
    ok(`the final forges a family: the key part (${key?.t}) is marked and named, three of its words the goal`, !!key && g.goal === 3 && !!(await page.$('.fg-part.key')) && /Forge a family/.test(await page.$eval('.stg-main > .prompt', (e) => e.textContent)) && g.targets.filter((t) => t.ids.includes(g.key)).length >= 3);
    const fam = g.targets.find((t) => t.ids.includes(g.key)); for (const id of fam.ids) await page.click(`.fg-part[data-arg="${g.tray.findIndex((p) => p.id === id)}"]`); await page.click('[data-act=fg-strike]'); await page.waitForTimeout(200);
    ok('a family word counts toward the family goal', (await page.$eval('.fg-goal', (e) => e.textContent)).includes('1 of 3'));
    await shot(page, 'forge-final-desktop', '.stg'); }
  /* the book, after a reload */
  await page.reload(); await page.waitForTimeout(900); await go(page, '#/play/root'); await phase(page, 'title'); await lit(page);
  await page.click('[data-act=forge-book]'); await phase(page, 'book'); await page.waitForSelector('.fg-card', { timeout: 8000 }).catch(() => {});
  const words = Object.keys(await book(page));
  ok(`the Forge Book survives a reload and shows its ${words.length} words by their parts`, words.length >= 3 && await page.evaluate((ws) => ws.every((w) => [...document.querySelectorAll('.fg-card .fg-chip')].some((c) => c.textContent === w)), words));
  ok('T15 the Forge Book: mirrored, no page scroll', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const f = flatness(await shot(page, 'forge-book-desktop', '.stg')); ok(`T14 the Forge Book (${flatTxt(f)})`, flatOk(f)); }
  ok('no page errors, no 4xx (desktop)', !page.errs.length, page.errs.join('; '));
  await ctx.close();
}

/* =====================================================================================================
   phone 390 × 844, dark (and light): T11, T14, T15, a word by tap, a crack
   ===================================================================================================== */
for (const dark of [true, false]) {
  const tag = `phone ${dark ? 'dark' : 'light'}`;
  const { ctx, page } = await ctxFor({ phone: true, dark });
  await makeKid(page, 'Ivo');
  await go(page, '#/play/root'); await phase(page, 'title'); await lit(page);
  ok(`${tag} T15 the title`, symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const bad = await phoneFit(page); ok(`${tag} T11 the title: every control on screen, ≥ 40 px`, !bad.length, bad.slice(0, 4).join('; ')); }
  await page.tap('[data-act=game-start]'); await phase(page, 'play'); await page.waitForSelector('.fg-tray'); await page.waitForTimeout(250);
  ok(`${tag} T15 in play: mirrored, centred, no scroll`, symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const bad = await phoneFit(page); ok(`${tag} T11 in play: every part and control on screen, above the tab bar, ≥ 40 px`, !bad.length, bad.slice(0, 4).join('; ')); }
  await shot(page, `forge-play-${dark ? 'dark' : 'light'}-phone`);
  { const f = flatness(await shot(page, `forge-stage-${dark ? 'dark' : 'light'}-phone`, '.stg')); ok(`${tag} T14 in play (${flatTxt(f)})`, flatOk(f)); }
  const g = await G(page), t = nextTarget(g);
  for (const i of t.idx) await page.tap(`.fg-part[data-arg="${i}"]`);
  await page.tap('[data-act=fg-strike]'); await page.waitForTimeout(250);
  ok(`${tag}: forged by tap — "${t.word}" glows`, await page.evaluate((w) => document.querySelector('.fg-bar-hot')?.textContent.trim() === w, t.word));
  await shot(page, `forge-glow-${dark ? 'dark' : 'light'}-phone`);
  await page.waitForTimeout(450); ok(`${tag}: the meaning stands in view on the stage`, await defInView(page));
  { const bad = await phoneFit(page); ok(`${tag} T11 the glow fits`, !bad.length, bad.slice(0, 4).join('; ')); }
  await settle(page);
  const non = await page.evaluate(() => { const F = window.__bz.S.run.g.tray; for (let a = 0; a < F.length; a++) for (let b = 0; b < F.length; b++) if (a !== b && F[a].kind === 'suffix' && F[b].kind !== 'suffix') return [a, b]; return [0, 1]; });
  for (const i of non) await page.tap(`.fg-part[data-arg="${i}"]`);
  await page.tap('[data-act=fg-strike]'); await page.waitForTimeout(250);
  { const bad = await phoneFit(page); ok(`${tag} T11 the crack card fits the phone`, !bad.length && !!(await page.$('.miss')), bad.slice(0, 4).join('; ')); }
  ok(`${tag} T15 the crack: no scroll`, symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  await shot(page, `forge-crack-${dark ? 'dark' : 'light'}-phone`);
  ok(`${tag}: no page errors, no 4xx`, !page.errs.length, page.errs.join('; '));
  await ctx.close();
}

await browser.close(); srv.kill(); rmSync(SITE, { recursive: true, force: true });
console.log(`forge-ui: ${n - fail}/${n} checks passed`); process.exit(fail ? 1 : 0);
