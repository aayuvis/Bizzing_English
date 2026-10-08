/* games-ui.mjs — the games in the BUILT app, in Chromium at the real sub-path (patterned on test/ui.mjs, and
   honouring BZ_BUILD the same way so parallel work builds into its own folder). The handover's checks for
   the games (Part C §8), each watched failing once before it was trusted:

     T3   a miss holds on the item until Continue, the answer shown in place;
     T4   a hidden tab stops a timed mode's clock; under a 4× CPU throttle the clock keeps real time ± 3%;
          the world backdrop stands still during play;
     T6   the coins on the finish card equal the change in the wallet's ledger;
     T11  phone 390 × 844: every control of the play inside the viewport, above the tab bar, ≥ 40 px
          (Comma Rush's gaps 44 × 44);
     T13  the level chip: a hand-set level sticks (it survives a reload) until the run's check, then Auto;
     T14  the stage: no flat-colour region over 6%, no pure white or black over 2% (light and dark);
     T15  the stage: HUD mirrored and the play centred within 4 px; no page scroll during play
          (desktop and phone);
     T16  the Play tab shows the lineup's cards, no more;
   and the two hubs played both ways, by touch and by keys. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync } from 'node:fs';
import { PNG } from './_png.mjs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-games-site' + (process.env.BZ_BUILD ? '-' + process.pid : ''), PORT = 8890 + Math.floor(Math.random() * 100);
const SHOTS = process.env.BZ_SHOTS || '';   // a folder to save the screenshots the checks look at
if (!existsSync(BUILD)) { console.log('games-ui: run `npm run build` first'); process.exit(1); }
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
const go = async (p, hash) => {
  if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(450);
};
async function makeKid(page, name = 'Mira', band = '8–10') {
  await page.goto(BASE); await page.waitForTimeout(600);
  await page.click('[data-act=ob-start]'); await page.fill('#obn', name); await page.click('[data-act=ob-name]');
  await page.click(`button:has-text("ages ${band}")`); await page.click('[data-act=ob-face] >> nth=0'); await page.click('[data-act=ob-go]');
  await page.waitForTimeout(700);
}
const R = (page) => page.evaluate(() => { const r = window.__bz.S.run; return r ? JSON.parse(JSON.stringify({ phase: r.phase, id: r.id, hub: r.hub, g: r.g, run: r.run, result: r.result, paused: r.paused })) : null; });
const phase = async (page, want, ms = 8000) => { try { await page.waitForFunction((w) => window.__bz.S.run?.phase === w, want, { timeout: ms }); return true; } catch { return false; } };
const shot = async (page, name, el) => { const buf = el ? await (await page.$(el)).screenshot() : await page.screenshot(); if (SHOTS) (await import('node:fs')).writeFileSync(`${SHOTS}/${name}.png`, buf); return buf; };
const rec = (page, id) => page.evaluate((g) => { const h = window.__bz.S.h; return JSON.parse(JSON.stringify(h.kids.find((k) => k.id === h.active).games[g] || {})); }, id);
const wallet = (page) => page.evaluate(() => { try { const w = JSON.parse(localStorage.getItem('bizzing.wallet') || '{}'); const k = window.__bz.S.h.kids.find((x) => x.id === window.__bz.S.h.active); const me = w[k.name.toLowerCase()] || w.kids?.[k.name.toLowerCase()] || null; return me ? { bal: me.balance ?? me.bal ?? null, n: (me.ledger || me.log || []).length } : null; } catch { return null; } });
const balance = (page) => page.evaluate(() => Number(document.querySelector('.bz-coins')?.textContent.replace(/[^\d]/g, '') || 0));

/* ---------- T14: flat colour and pure white/black, measured on a screenshot of the stage ---------- */
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
/* ---------- T15: the stage's symmetry and the page's scroll ---------- */
const symmetry = (page) => page.evaluate(() => {
  const st = document.querySelector('.stg'); if (!st) return null;
  const s = st.getBoundingClientRect(), box = (q) => { const e = st.querySelector(q); return e ? e.getBoundingClientRect() : null; };
  const l = box('.stg-pod.stg-l'), r = box('.stg-pod.stg-r'), m = box('.stg-mid'), main = st.querySelector('[data-stage-main]'), play = main?.querySelector('[data-play], .htiles') || main;
  const p = play.getBoundingClientRect(), cx = s.left + s.width / 2;
  const kids = [...main.children].map((e) => e.getBoundingClientRect()), largest = kids.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a), kids[0] || p);
  return { hud: Math.abs((l.left - s.left) - (s.right - r.right)), podW: Math.abs(l.width - r.width), mid: Math.abs(m.left + m.width / 2 - cx), play: Math.abs(p.left + p.width / 2 - cx),
    playIsLargest: Math.abs(largest.width * largest.height - p.width * p.height) < 2,
    scrollY: document.documentElement.scrollHeight - innerHeight, scrollX: document.documentElement.scrollWidth - innerWidth };
});
const symOk = (s) => s && s.hud <= 4 && s.podW <= 4 && s.mid <= 4 && s.play <= 4 && s.playIsLargest && s.scrollY <= 1 && s.scrollX <= 0;
/* ---------- T11: every control of the play on screen, above the tab bar, big enough ---------- */
const phoneFit = (page, sel = '.stg button, .stg a') => page.evaluate((sel) => {
  const bar = document.querySelector('.bz-tabbar'), barTop = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight, bad = [];
  for (const e of document.querySelectorAll(sel)) { const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === 'hidden') continue;
    if (r.bottom > barTop + 0.5 || r.top < 0 || r.right > innerWidth + 0.5 || r.left < -0.5) bad.push(`off screen: ${e.className || e.tagName} ${Math.round(r.top)}–${Math.round(r.bottom)} (bar ${Math.round(barTop)})`);
    if (r.height < 40 || r.width < 40) bad.push(`small: ${e.className || e.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`); }
  return bad;
}, sel);

/* =====================================================================================================
   desktop, light: the lineup, the hubs, the chip, both hubs' modes played both ways
   ===================================================================================================== */
{
  const { ctx, page } = await ctxFor();
  await makeKid(page);
  await go(page, '#/play'); await page.waitForSelector('.pcards');
  const cards = await page.$$eval('.pcard', (c) => c.map((e) => e.dataset.card));
  ok(`T16: the Play tab shows the lineup's cards and no more (${cards.join(', ')})`, cards.length <= 5 && cards[0] === 'studio' && cards[1] === 'craft' && !cards.some((c) => ['builder', 'rush', 'figure', 'duel'].includes(c)));
  ok('the hub cards are named by the one constant', await page.evaluate(() => /Sentence Studio/.test(document.querySelector('[data-card=studio]').textContent) && /Writer’s Craft/.test(document.querySelector('[data-card=craft]').textContent)));
  ok('every single-game card carries a level chip: Auto and 1–5', await page.evaluate(() => [...document.querySelectorAll('.pcard:not(.hubcard)')].every((c) => c.querySelectorAll('.lvchip .lvc-b').length === 6)));
  await shot(page, 'play-desktop');

  /* the hub */
  await page.click('[data-card=studio] .pc-art'); await phase(page, 'hub');
  ok('Sentence Studio opens a hub of two mode tiles, each with art, a promise, a level chip and Play', await page.evaluate(() => { const t = [...document.querySelectorAll('.htile')]; return t.length === 2 && t.every((x) => x.querySelector('.ht-art') && x.querySelector('.ht-promise') && x.querySelectorAll('.lvc-b').length === 6 && x.querySelector('.ht-play')); }));
  ok('the hub stands on the stage, mirrored and still (T15, hub)', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const f = flatness(await shot(page, 'hub-studio-desktop', '.stg')); ok(`T14 hub: no flat colour over 6%, no pure white or black over 2% (${(f.flat * 100).toFixed(1)}%, ${(f.white * 100).toFixed(1)}%, ${(f.black * 100).toFixed(1)}%)`, f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02); }

  /* T13: the chip — a hand-set level sticks through a reload, until the run's check */
  await page.click('[data-mode=builder] [data-arg="builder:3"]'); await page.waitForTimeout(150);
  ok('T13: a tap on the chip sets the level by hand', (await rec(page, 'builder')).pick === 3 && await page.evaluate(() => document.querySelector('[data-mode=builder] .lvc-b.on')?.dataset.arg === 'builder:3'));
  await page.reload(); await page.waitForTimeout(900); await page.waitForSelector('.htile');
  ok('T13: a hand-set level survives a reload (stored per child, per game)', (await rec(page, 'builder')).pick === 3 && /Level 3/.test(await page.$eval('[data-mode=builder] .ht-lv', (e) => e.textContent)));
  await page.click('[data-mode=builder] [data-arg="builder:auto"]'); await page.waitForTimeout(150);
  ok('T13: Auto goes back to the game’s own level', (await rec(page, 'builder')).pick === null && /Level 1/.test(await page.$eval('[data-mode=builder] .ht-lv', (e) => e.textContent)));
  await page.click('[data-mode=builder] [data-arg="builder:2"]'); await page.waitForTimeout(100);

  try {
  /* Clause Builder: by touch and by keys */
  await page.click('[data-mode=builder] .ht-play'); await phase(page, 'title'); await page.waitForTimeout(400);
  ok('a hub mode has its own route and its own title on the stage', /#\/play\/studio\/builder$/.test(page.url()) && !!(await page.$('.stg [data-act=game-start]')));
  await page.click('[data-act=game-start]'); await phase(page, 'play');
  ok('T13: the run is played at the hand-set level', (await R(page)).run.level === 2);
  ok('T4: the world backdrop stands still during play', await page.evaluate(() => document.documentElement.classList.contains('bz-playing') && getComputedStyle(document.querySelector('.scene .scn-parts') || document.body).display === 'none'));
  ok('T15 Clause Builder: HUD mirrored, the play centred and largest, no scroll', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const f = flatness(await shot(page, 'builder-desktop', '.stg')); ok(`T14 Clause Builder (${(f.flat * 100).toFixed(1)}%, ${(f.white * 100).toFixed(1)}%, ${(f.black * 100).toFixed(1)}%)`, f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02); }
  const tiles = await page.evaluate(() => window.__bz.S.run.g.cur.tiles.map((t) => t.k));
  ok('Clause Builder: phrase tiles, all lower-case where the book allows, one decoy, the joining word', tiles.filter((k) => k === 'decoy').length === 1 && tiles.filter((k) => k === 'sub').length === 1 && tiles.length >= 5 && tiles.length <= 9);
  /* build the end order right, by touch: main pieces, sub, dep pieces, then the capital */
  const solve = (c, sentence) => { const bare = (x) => x.toLowerCase().replace(/[,.!?]/g, '').replace(/\s+/g, ' ').trim(), want = bare(sentence);
    const go = (rest, used) => { if (!rest) return []; for (let i = 0; i < c.tiles.length; i++) { const t = bare(c.tiles[i].text); if (used.includes(i) || c.tiles[i].k === 'decoy' || !(rest === t || rest.startsWith(t + ' '))) continue; const r = go(rest.slice(t.length).trim(), [...used, i]); if (r) return [i, ...r]; } return null; };
    return go(want, []) || []; };
  const buildRight = async (how) => {   /* the end order: its pieces, then the capital if the first piece lacks it */
    const c = (await R(page)).g.cur, end = c.right[1], order = solve(c, end);
    for (const i of order) { if (how === 'keys') await page.keyboard.press(String(i + 1)); else await page.click(`[data-act=b-pick][data-arg="${i}"]`, { timeout: 3000 }); }
    if (end.charAt(0) !== c.tiles[order[0]].text.charAt(0)) { if (how === 'keys') await page.keyboard.press('c'); else await page.click('[data-act=b-cap]', { timeout: 3000 }); }
    if (how === 'keys') await page.keyboard.press('Enter'); else await page.click('[data-act=b-check]', { timeout: 3000 });
    await page.waitForTimeout(150);
  };
  await buildRight('touch');
  ok('Clause Builder by touch: pieces, the capital, Check — built', (await R(page)).g.built === 1);
  await buildRight('keys');
  ok('Clause Builder by keys: 1–9, C, Enter — built', (await R(page)).g.built === 2);
  /* T3: a wrong build holds on the item, the answer in place, until Continue — and the clock stops */
  { const g = (await R(page)).g, dec = g.cur.tiles.findIndex((t) => t.k === 'decoy'), other = g.cur.tiles.findIndex((t) => t.k !== 'decoy');
    await page.click(`[data-act=b-pick][data-arg="${dec}"]`); await page.click(`[data-act=b-pick][data-arg="${other}"]`); await page.click('[data-act=b-check]'); await page.waitForTimeout(200);
    const t0 = (await R(page)).g.t; await page.waitForTimeout(2600);
    const held = await page.evaluate(() => ({ miss: !!document.querySelector('.stg [data-play] .miss'), fix: document.querySelectorAll('.stg [data-play] .miss .miss-fix').length, given: !!document.querySelector('.miss-given del'), go: !!document.querySelector('[data-act=miss-go]') }));
    const t1 = (await R(page)).g.t;
    ok('T3 Clause Builder: a miss holds on the item — the right sentence in place, the attempt struck out, Continue', held.miss && held.fix >= 1 && held.given && held.go, JSON.stringify(held));
    ok('T3: …it is still there after 2.6 s, and the clock stood still while it held', (await R(page)).g.hold && t1 === t0);
    { const f = flatness(await shot(page, 'builder-miss-desktop', '.stg')); ok(`T14 Clause Builder miss card (${(f.flat * 100).toFixed(1)}%)`, f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02); }
    if (await page.$('[data-act=miss-go]')) await page.click('[data-act=miss-go]'); await page.waitForTimeout(150);
    ok('T3: Continue clears the board for the next sentence', await page.evaluate(() => !document.querySelector('.miss') && !window.__bz.S.run.g.hold && window.__bz.S.run.g.picks.length === 0)); }

  /* T4: a hidden tab stops the clock; real time under a 4× CPU throttle */
  { await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    const a = (await R(page)).g.t; await page.waitForTimeout(2000); const b = (await R(page)).g.t;
    ok('T4: a hidden tab pauses the clock', b - a < 300 && (await R(page)).paused === true, `${a} → ${b}`);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(300); const c = (await R(page)).g.t; await page.waitForTimeout(1200);
    ok('T4: …and shown again, it runs on from where it stopped', (await R(page)).g.t > c && c - b < 600, `${b} → ${c}`);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t0 = (await R(page)).g.t, w0 = Date.now(); await page.waitForTimeout(6000); const t1 = (await R(page)).g.t, w1 = Date.now();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const drift = Math.abs((t1 - t0) - (w1 - w0)) / (w1 - w0);
    ok(`T4: under a 4× CPU throttle the clock keeps real time ± 3% (${(drift * 100).toFixed(1)}%)`, drift <= 0.03 && t1 < 60000); }
  await page.evaluate(() => { const g = window.__bz.S.run.g; g.t = 59900; });
  await phase(page, 'between', 6000);
  ok('the round ends and the between screen stands on the stage, coins waiting named', await page.evaluate(() => !!document.querySelector('.stg-between [data-banked]')));

  } catch (e) { ok(`a section crashed: ${e.message.split('\n')[0]}`, false); }
  try {
  /* Comma Rush: by touch and by keys, and T3 */
  await go(page, '#/play/studio/rush'); await page.waitForSelector('.stg [data-act=game-start]'); await page.click('[data-act=game-start]'); await phase(page, 'play');
  { const g = (await R(page)).g; for (const i of g.cur.commas) await page.click(`[data-act=r-gap][data-arg="${i}"]`); await page.click('[data-act=r-submit]'); await page.waitForTimeout(150); }
  ok('Comma Rush by touch: a clean sentence', (await R(page)).g.clean === 1);
  { const g = (await R(page)).g; for (let i = 0, cur = 0; i < g.cur.commas.length; i++) { const t = g.cur.commas[i]; while (cur < t) { await page.keyboard.press('ArrowRight'); cur++; } await page.keyboard.press(' '); } await page.keyboard.press('Enter'); await page.waitForTimeout(150); }
  ok('Comma Rush by keys: arrows, Space, Enter — clean', (await R(page)).g.clean === 2);
  ok('T15 Comma Rush (desktop)', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  { const g = (await R(page)).g, wrong = [...Array(g.cur.words.length - 1).keys()].find((i) => !g.cur.commas.includes(i)); await page.click(`[data-act=r-gap][data-arg="${wrong}"]`); await page.click('[data-act=r-submit]'); await page.waitForTimeout(2200);
    const held = await page.evaluate(() => ({ fix: document.querySelectorAll('.miss ins.miss-fix').length, del: document.querySelectorAll('.miss del.miss-del').length, why: document.querySelector('.miss-why')?.textContent || '' }));
    ok('T3 Comma Rush: a wrong sentence holds with the missed commas in green and the extra one struck out, and the rule', (await R(page)).g.hold && held.fix >= 1 && held.del === 1 && held.why.length > 10, JSON.stringify(held));
    await shot(page, 'rush-miss-desktop', '.stg');
    if ((await R(page)).g.hold) { await page.keyboard.press('Enter'); await page.waitForTimeout(150); } ok('T3: Enter continues', !(await R(page)).g.hold); }

  } catch (e) { ok(`a section crashed: ${e.message.split('\n')[0]}`, false); }
  try {
  /* Writer's Craft: Figure Hunt — spot, words, name; glosses hidden until after */
  await go(page, '#/play/craft'); await phase(page, 'hub');
  ok('Writer’s Craft opens its two modes', await page.evaluate(() => [...document.querySelectorAll('.htile')].map((t) => t.dataset.mode).join() === 'figure,duel'));
  { const f = flatness(await shot(page, 'hub-craft-desktop', '.stg')); ok(`T14 Writer’s Craft hub (${(f.flat * 100).toFixed(1)}%)`, f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02); }
  await page.click('[data-mode=figure] .ht-play'); await page.waitForSelector('.stg [data-act=game-start]'); await page.waitForTimeout(300); await page.click('[data-act=game-start]'); await phase(page, 'play', 15000);
  let sawHunt = false, sawWords = false, keysUsed = false;
  for (let k = 0; k < 40 && (await R(page)).phase === 'play'; k++) {
    const s = await R(page), g = s.g, q = g.rounds[g.i];
    const ph = q.hunt && !g.found ? 'spot' : q.want && !g.wpass ? 'words' : 'name';
    if (g.state) { await page.waitForTimeout(g.state.ok ? 1300 : 0); if (!g.state.ok) await page.click('[data-act=miss-go]'); continue; }
    if (ph === 'spot') { if (!sawHunt) { ok('Figure Hunt: hunts from level 1 — the passage first, no gloss shown', g.level === 1 && !(await page.evaluate(() => /compares two things|says one thing IS/.test(document.querySelector('.stg-main').textContent)))); await shot(page, 'figure-hunt-desktop', '.stg'); } sawHunt = true; await page.click(`[data-act=fig-spot][data-arg="${q.at}"]`); await page.waitForTimeout(150); continue; }
    if (ph === 'words') { if (!sawWords) { await shot(page, 'figure-words-desktop', '.stg'); ok('T15 Figure Hunt words', symOk(await symmetry(page)), JSON.stringify(await symmetry(page))); }
      sawWords = true; for (const i of (q.marks ? q.marks[0] : q.want.slice(0, 2))) await page.click(`[data-act=fig-tap][data-arg="${i}"]`); await page.click('[data-act=fig-words]'); await page.waitForTimeout(150); continue; }
    if (!keysUsed) { keysUsed = true; await page.keyboard.press(String(q.answer + 1)); } else await page.click(`[data-act=q-pick][data-arg="${q.answer}"]`);
    await page.waitForTimeout(200);
  }
  ok('Figure Hunt: a hunt and a words step met, played by touch and keys', sawHunt && sawWords && keysUsed);
  ok('Figure Hunt: every item right when every step is', await phase(page, 'between') && (await R(page)).run.right === (await R(page)).run.total);

  } catch (e) { ok(`a section crashed: ${e.message.split('\n')[0]}`, false); }
  try {
  /* Rhetoric Duel — make it strong: build the line; a wrong build holds with the line in place */
  await go(page, '#/play/craft/duel'); await page.waitForSelector('.stg [data-act=game-start]'); await page.click('[data-act=game-start]'); await phase(page, 'play');
  { let built = 0, missed = false;
    for (let k = 0; k < 30 && (await R(page)).phase === 'play'; k++) {
      const g = (await R(page)).g, q = g.rounds[g.i];
      if (g.state) { if (!g.state.ok) { await shot(page, 'duel-miss-desktop', '.stg'); ok('T3 Rhetoric Duel: a wrong build holds, the line as written in place', !!(await page.$('.miss ins.miss-fix')) && !!(await page.$('.miss-given del'))); await page.click('[data-act=miss-go]'); } else await page.waitForTimeout(1300); continue; }
      if (g.stage === 'which') { await page.keyboard.press(String(q.strong + 1)); await page.waitForTimeout(120); continue; }
      const order = q.tiles.map((t, i) => [t, i]).filter(([t]) => t.k === 'd').sort((a, b) => a[0].at - b[0].at).map(([, i]) => i);
      if (!missed && built >= 1) { missed = true; await page.click(`[data-act=du-tile][data-arg="${q.tiles.findIndex((t) => t.k === 'x')}"]`); await page.click('[data-act=du-check]'); await page.waitForTimeout(150); continue; }
      if (built === 0) { await shot(page, 'duel-build-desktop', '.stg'); ok('T15 Rhetoric Duel build', symOk(await symmetry(page)), JSON.stringify(await symmetry(page))); for (const i of order) await page.click(`[data-act=du-tile][data-arg="${i}"]`); await page.click('[data-act=du-check]'); }
      else { for (const i of order) await page.keyboard.press(String(i + 1)); await page.keyboard.press('Enter'); }
      built++; await page.waitForTimeout(200);
    }
    ok('Rhetoric Duel: lines built by touch and by keys, the device named after', built >= 3 && missed);
    ok('the duel’s rival is one of Bee’s, labelled made-up, its points the app’s own', await page.evaluate(() => /made-up rivals/.test(document.querySelector('.gb-rival-note')?.textContent || '') && /the app’s own/.test(document.querySelector('.gb-rival-note')?.textContent || '') && /rivals\/\w+\.webp/.test(document.querySelector('.stg-pod.stg-r img')?.getAttribute('src') || '')) || (await R(page)).phase !== 'play'); }
  } catch (e) { ok(`a section crashed: ${e.message.split('\n')[0]}`, false); }
  ok('no page errors (desktop)', !page.errs.length, page.errs.join('; '));
  await ctx.close();
}

/* =====================================================================================================
   T6: the finish card's coins are the wallet's change — a whole run of Comma Rush, played clean
   ===================================================================================================== */
{
  const { ctx, page } = await ctxFor();
  await makeKid(page, 'Tara');
  await go(page, '#/play/studio/rush'); await page.waitForSelector('.stg [data-act=game-start]');
  const before = await balance(page);
  await page.click('[data-act=game-start]'); await phase(page, 'play');
  for (let round = 0; round < 4; round++) {
    for (let k = 0; k < 4 && (await R(page)).phase === 'play'; k++) { const g = (await R(page)).g; for (const i of g.cur.commas) await page.click(`[data-act=r-gap][data-arg="${i}"]`); await page.click('[data-act=r-submit]'); await page.waitForTimeout(80); }
    await page.evaluate(() => { window.__bz.S.run.g.t = 59950; }); await page.waitForFunction(() => ['between', 'done'].includes(window.__bz.S.run.phase), null, { timeout: 5000 });
    if ((await R(page)).phase === 'between') { await page.click('[data-act=game-round]'); await phase(page, 'play'); }
  }
  await phase(page, 'done'); await page.waitForTimeout(400);
  if (await page.$('.sheet')) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
  const card = await page.evaluate(() => Number(document.querySelector('[data-coins]')?.dataset.coins ?? -1)), after = await balance(page);
  ok(`T6: the finish card's coins equal the wallet's change (${card} on the card, ${before} → ${after})`, card > 0 && after - before === card);
  ok('T6: the finish card names the coins and what they were for', /to your wallet/.test(await page.$eval('.gb-coinline', (e) => e.textContent)));
  await shot(page, 'rush-done-desktop', '.stg');
  ok('T15 the finish (desktop)', symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
  /* T13 the check: the run moved the level from the level played, and the chip went back to Auto */
  ok('T13: after the check the level moved by the rule and the chip is Auto again', await rec(page, 'rush').then((r) => r.pick === null && r.level === 2));
  ok('no page errors (T6)', !page.errs.length, page.errs.join('; '));
  await ctx.close();
}

/* =====================================================================================================
   phone 390 × 844, light and dark: T11, T14, T15 on the hubs and in play
   ===================================================================================================== */
for (const dark of [false, true]) {
  const tag = `phone ${dark ? 'dark' : 'light'}`;
  const { ctx, page } = await ctxFor({ phone: true, dark });
  await makeKid(page, 'Ivo');
  await go(page, '#/play'); await page.waitForSelector('.pcards');
  ok(`${tag}: the Play cards do not scroll sideways`, await page.evaluate(() => document.documentElement.scrollWidth <= 390));
  await shot(page, `play-${dark ? 'dark' : 'light'}-phone`);
  for (const hub of ['studio', 'craft']) {
    await go(page, `#/play/${hub}`); await page.waitForSelector('.htile'); await page.waitForTimeout(250);
    ok(`${tag} T15 ${hub} hub: mirrored, no scroll`, symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
    const bad = await phoneFit(page); ok(`${tag} T11 ${hub} hub: every control on screen, above the tab bar, ≥ 40 px`, !bad.length, bad.slice(0, 4).join('; '));
    { const f = flatness(await shot(page, `hub-${hub}-${dark ? 'dark' : 'light'}-phone`, '.stg')); ok(`${tag} T14 ${hub} hub (${(f.flat * 100).toFixed(1)}%, ${(f.white * 100).toFixed(1)}%, ${(f.black * 100).toFixed(1)}%)`, f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02); }
  }
  for (const [hub, mode] of [['studio', 'builder'], ['studio', 'rush'], ['craft', 'figure'], ['craft', 'duel']]) {
    await go(page, `#/play/${hub}/${mode}`); await page.waitForSelector('.stg [data-act=game-start]'); await page.waitForTimeout(300);
    ok(`${tag} T15 ${mode} title`, symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
    await page.tap('[data-act=game-start]'); await phase(page, 'play', 15000); await page.waitForTimeout(300);
    const s = await symmetry(page); ok(`${tag} T15 ${mode} in play: mirrored, centred, no scroll`, symOk(s), JSON.stringify(s));
    const bad = await phoneFit(page); ok(`${tag} T11 ${mode}: every control on screen, above the tab bar, ≥ 40 px`, !bad.length, bad.slice(0, 4).join('; '));
    { const f = flatness(await shot(page, `${mode}-${dark ? 'dark' : 'light'}-phone`, '.stg')); ok(`${tag} T14 ${mode} (${(f.flat * 100).toFixed(1)}%, ${(f.white * 100).toFixed(1)}%, ${(f.black * 100).toFixed(1)}%)`, f.flat <= 0.06 && f.white <= 0.02 && f.black <= 0.02); }
    if (mode === 'rush') ok(`${tag} T11 Comma Rush: every gap a 44 × 44 target`, await page.evaluate(() => [...document.querySelectorAll('.rush-sent .gap')].every((e) => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })));
    if (mode === 'builder') {   // a miss on the phone: the card fits too
      const g = (await R(page)).g; await page.tap(`[data-act=b-pick][data-arg="${g.cur.tiles.findIndex((t) => t.k === 'decoy')}"]`); await page.tap(`[data-act=b-pick][data-arg="${g.cur.tiles.findIndex((t) => t.k === 'main')}"]`); await page.tap('[data-act=b-check]'); await page.waitForTimeout(200);
      const bad2 = await phoneFit(page); ok(`${tag} T11 the miss card fits the phone`, !bad2.length && !!(await page.$('.miss')), bad2.join('; '));
      ok(`${tag} T15 the miss card: no scroll`, symOk(await symmetry(page)), JSON.stringify(await symmetry(page)));
      await shot(page, `builder-miss-${dark ? 'dark' : 'light'}-phone`, '.stg');
    }
  }
  ok(`${tag}: no page errors`, !page.errs.length, page.errs.join('; '));
  await ctx.close();
}

await browser.close(); srv.kill(); rmSync(SITE, { recursive: true, force: true });
console.log(`games-ui: ${n - fail}/${n} checks passed`); process.exit(fail ? 1 : 0);
