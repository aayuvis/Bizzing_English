/* story-panel.mjs — the story panels show their words (docs/story-panel-layout.md, the family standard).

   Every "picture + words, one page at a time" screen here is the story player: a Library passage
   told scene by scene over its painting, and a whole-book chapter (#/story/<id>, #/whole/<id>/<n>).
   This drives the BUILT app in Chromium under /Bizzing_English/ at the standard's six sizes and holds:

     words     the words start on the first screen with ≥ 2 lines showing — on a landscape screen
               the first line in the top 55% of it
     turn      the page-turn ([data-swipe=next]) is on the first screen, not covered by anything
     picture   stacked, the painting is 15–62% of the screen under the header; in the spread it
               stands BESIDE the words, never above them
     whole     on a phone the words are never clipped inside a box of their own
     sticker   nothing is drawn over a painting (found by its background image, not by a class)
     full      the painting opens full screen (click, Enter), zooms 2.2×, closes four ways (✕, Esc,
               Back, outside), focus going to ✕ and back to the picture; nothing turns under it
     swipe     a real touch swipe (CDP) turns the page both ways; a vertical drag does not; a right
               swipe on the first scene does nothing (there is no back button to press)
     keys      ← → press the same buttons, but not while focus is in a text field
     voice     narration still lights the words, and leaving the page stops every clip

   Run after `npm run build`: node test/story-panel.mjs [--shots=<dir>] [--measure] */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, rmSync } from 'node:fs';

const BUILD = process.env.BZ_BUILD || new URL('../build', import.meta.url).pathname, SITE = '/tmp/bz-english-panel-site' + (process.env.BZ_BUILD ? '-' + process.pid : ''), PORT = 8900 + Math.floor(Math.random() * 90);
if (!existsSync(BUILD)) { console.log('story-panel: run `npm run build` first'); process.exit(1); }
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}`)) || '').split('=')[1] ?? (process.argv.includes(`--${k}`) ? true : null);
const SHOTS = arg('shots'), MEASURE_ONLY = !!arg('measure');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE); symlinkSync(BUILD, SITE + '/Bizzing_English');
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const BASE = `http://127.0.0.1:${PORT}/Bizzing_English/`;
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: EXE, args: ['--autoplay-policy=no-user-gesture-required'] });

const SIZES = [['desktop', 1440, 900], ['laptop', 1280, 720], ['ipad-side', 1180, 820], ['ipad-up', 820, 1180], ['phone', 390, 760], ['phone-sm', 375, 667]];
/* a normal passage, a poem, the longest passage scene, a chapter, the longest chapter scene */
const PAGES = [['story', '#/story/aesop-town-mouse', 0], ['verse', '#/story/wordsworth-daffodils', 0], ['longest', '#/story/midsummer-titania', 3],
  ['chapter', '#/whole/alice/1', 0], ['long-chapter', '#/whole/wind/4', 7]];

let fail = 0, n = 0; const results = {};
const ok = (m, c, x = '') => { n++; if (!c) { fail++; console.log('✗', m, x); } };

/* what is on the first screen of a story page, measured from the live DOM */
const MEASURE = () => {
  const vh = innerHeight, bar = document.querySelector('[data-bz=tabbar]');
  const br = bar && getComputedStyle(bar).position === 'fixed' && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
  const fold = br && br.top < vh ? br.top : vh;
  const top = (document.querySelector('[data-bz=header]')?.getBoundingClientRect().bottom) || 0;
  const main = document.getElementById('main');
  /* the page-turn: the standard's attribute (the old player had only its action, measured for "before") */
  const turnEl = main.querySelector('[data-swipe="next"]') || main.querySelector('[data-act="sp-next"]');
  const tr = turnEl?.getBoundingClientRect();
  const hit = (el, x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
  const turn = !!tr && tr.top >= top - 1 && tr.bottom <= fold + 1 && hit(turnEl, tr.left + tr.width / 2, tr.top + tr.height / 2);
  /* the words: a word counts as showing only if it is the thing at its own centre (not covered by the
     pinned page-turn, not scrolled away inside a box, not under the tab bar) */
  const ws = [...main.querySelectorAll('.passage span.w')];
  const seen = ws.filter((w) => { const r = w.getBoundingClientRect(); return r.height && r.top >= top && r.bottom <= fold && hit(w, r.left + r.width / 2, r.top + r.height / 2); });
  const lineTops = new Set(seen.map((w) => Math.round(w.getBoundingClientRect().top / 4)));
  const first = ws[0]?.getBoundingClientRect();
  const words = main.querySelector('.passage'), wr = words?.getBoundingClientRect();
  /* the painting: whatever in #main has a painted background and some size, whatever its class says */
  const pics = [...main.querySelectorAll('*')].filter((e) => /url\(/.test(getComputedStyle(e).backgroundImage) && e.getBoundingClientRect().height > 2);
  const pic = pics[0], pr = pic?.getBoundingClientRect();
  const share = pr ? Math.max(0, Math.min(pr.bottom, fold) - Math.max(pr.top, top)) / Math.max(1, fold - top) : null;
  const sticker = pic ? [...pic.children].filter((c) => c.getBoundingClientRect().height > 2).length + (pic.textContent.trim() ? 1 : 0) : 0;
  /* clipped: the words, or any box around them inside the page, scrolling inside itself */
  let clipped = 0; for (let e = words; e && e !== main; e = e.parentElement) clipped = Math.max(clipped, e.scrollHeight - e.clientHeight);
  return { vh, fold: Math.round(fold), top: Math.round(top), first: first ? Math.round(first.top) : null, firstSeen: !!ws[0] && seen.includes(ws[0]),
    lines: lineTops.size, turn, turnBox: tr ? [Math.round(tr.top), Math.round(tr.bottom)] : null,
    pic: share, picBox: pr ? [Math.round(pr.left), Math.round(pr.top), Math.round(pr.width), Math.round(pr.height)] : null, full: !!pic?.hasAttribute('data-full'),
    beside: !!(pr && wr) && pr.right <= wr.left + 1, sticker, clipped,
    wide: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth };
};

async function makeKid(page) {
  await page.goto(BASE); await page.waitForTimeout(600);
  await page.click('[data-act=ob-start]'); await page.fill('#obn', 'Mira'); await page.click('[data-act=ob-name]');
  await page.click('button:has-text("ages 8–10")'); await page.click('[data-act=ob-face] >> nth=0'); await page.click('[data-act=ob-go]');
  await page.waitForTimeout(700);
}
const open = async (p, hash, scene = 0) => {
  if (await p.$('.sheet')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(600);
  if (scene) { await p.evaluate((i) => { window.__bz.S.run.i = i; window.__bz.render(); }, scene); await p.waitForTimeout(200); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150);
};
const scene = (p) => p.evaluate(() => window.__bz.S.run?.i);

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true, deviceScaleFactor: 1, colorScheme: process.env.PANEL_DARK ? 'dark' : 'light' });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.addInitScript(() => {   // every narration clip, so the check can see each one stop
  window.__clips = []; const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { window.__clips.push(this); return play.call(this); };
});
await makeKid(page);

/* ---------- the six sizes ---------- */
for (const [name, w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  const land = w >= 640 && w / h >= 1.2;
  for (const [pg, hash, sc] of PAGES) {
    await open(page, hash, sc);
    const m = await page.evaluate(MEASURE), at = `${name} ${w}×${h} ${pg}`;
    results[at] = m;
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}-${pg}.png` });
    if (MEASURE_ONLY) continue;
    ok(`${at}: nothing scrolls sideways`, m.wide <= 0, `${m.wide}px`);
    ok(`${at}: ≥ 2 lines of words on the first screen`, m.lines >= 2 && m.firstSeen, `${m.lines} lines, first word ${m.firstSeen ? 'showing' : 'hidden'} at ${m.first}`);
    if (land) ok(`${at}: the words start in the top 55%`, m.first != null && m.first <= m.vh * 0.55, `${m.first} of ${m.vh}`);
    ok(`${at}: the page-turn is on the first screen, uncovered`, m.turn, JSON.stringify(m.turnBox));
    ok(`${at}: the painting opens full screen (data-full)`, m.full);
    if (land) ok(`${at}: the painting stands beside the words`, m.beside, JSON.stringify(m.picBox));
    else ok(`${at}: the painting is 15–62% of the screen`, m.pic != null && m.pic >= 0.15 && m.pic <= 0.62, m.pic == null ? 'none' : `${Math.round(m.pic * 100)}%`);
    ok(`${at}: nothing is drawn over the painting`, m.sticker === 0, `${m.sticker}`);
    if (w <= 720 && !land) ok(`${at}: the words are not clipped inside a box`, m.clipped <= 2, `${m.clipped}px`);
  }
}

if (!MEASURE_ONLY) {
  /* ---------- the painting, full screen ---------- */
  for (const [w, h] of [[1280, 720], [390, 760]]) {
    await page.setViewportSize({ width: w, height: h });
    await open(page, '#/story/aesop-town-mouse');
    const at = `${w}px full screen`;
    const src = await page.getAttribute('#main [data-full]', 'data-full');
    await page.click('#main [data-full]'); await page.waitForTimeout(200);
    let s = await page.evaluate(() => { const b = document.querySelector('.bzfull'); return b && { img: b.querySelector('img')?.getAttribute('src'), x: document.activeElement?.classList.contains('bzfull-x'), r: b.getBoundingClientRect().toJSON(), parent: b.parentElement === document.body }; });
    ok(`${at}: a click opens the painting`, !!s && s.img === src, JSON.stringify(s));
    if (s) {
      ok(`${at}: it covers the screen, on <body>`, s.r.width >= w - 1 && s.r.height >= h - 1 && s.parent, JSON.stringify(s.r));
      ok(`${at}: focus moves to ✕`, s.x);
      const i0 = await scene(page);
      await page.evaluate(() => { window.__leak = 0; window.__leakFn = () => window.__leak++; document.addEventListener('keydown', window.__leakFn); });
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
      ok(`${at}: → does not turn the page under it`, (await scene(page)) === i0);
      ok(`${at}: it owns the keyboard — no key reaches the page under it`, await page.evaluate(() => { document.removeEventListener('keydown', window.__leakFn); return window.__leak === 0; }), await page.evaluate(() => window.__leak));
      if (!(await page.evaluate(() => !!document.querySelector('.bzfull')))) { await page.click('#main [data-full]'); await page.waitForTimeout(200); }
      await page.keyboard.press('Tab'); ok(`${at}: Tab stays inside it`, await page.evaluate(() => !!document.activeElement?.closest('.bzfull')));
      await page.click('.bzfull-img'); await page.waitForTimeout(300);
      ok(`${at}: a tap on the picture zooms 2.2×`, await page.evaluate(() => document.querySelector('.bzfull.zoomed') && /matrix\(2\.2/.test(getComputedStyle(document.querySelector('.bzfull-img')).transform)));
      const hash0 = await page.evaluate(() => location.hash);
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      s = await page.evaluate(() => ({ open: !!document.querySelector('.bzfull'), focus: !!document.activeElement?.hasAttribute('data-full'), hash: location.hash }));
      ok(`${at}: Esc closes it`, !s.open);
      ok(`${at}: focus comes back to the picture`, s.focus);
      ok(`${at}: Esc does not also leave the page`, s.hash === hash0, s.hash);
      await page.keyboard.press('Enter'); await page.waitForTimeout(200);
      ok(`${at}: Enter on the picture opens it`, await page.evaluate(() => !!document.querySelector('.bzfull')));
      await page.click('.bzfull-x'); await page.waitForTimeout(300);
      ok(`${at}: ✕ closes it`, await page.evaluate(() => !document.querySelector('.bzfull')));
      await page.click('#main [data-full]'); await page.waitForTimeout(200);
      await page.mouse.click(6, h - 6); await page.waitForTimeout(300);
      ok(`${at}: a tap outside the picture closes it`, await page.evaluate(() => !document.querySelector('.bzfull')));
      await page.click('#main [data-full]'); await page.waitForTimeout(200);
      await page.goBack(); await page.waitForTimeout(400);
      s = await page.evaluate(() => ({ open: !!document.querySelector('.bzfull'), hash: location.hash, story: window.__bz.S.run?.mode === 'story' }));
      ok(`${at}: Back closes it and stays on the story`, !s.open && s.hash === hash0 && s.story, JSON.stringify(s));
    }
  }
  /* the chapter's painting opens too */
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page, '#/whole/wind/1'); await page.click('#main [data-full]'); await page.waitForTimeout(200);
  ok('a chapter\'s painting opens full screen', await page.evaluate(() => !!document.querySelector('.bzfull img')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  /* ---------- swipe, with real touch events ---------- */
  await page.setViewportSize({ width: 390, height: 760 });
  const cdp = await ctx.newCDPSession(page);
  const touch = async (x0, y0, x1, y1, steps = 6, ms = 0) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let k = 1; k <= steps; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * k) / steps, y: y0 + ((y1 - y0) * k) / steps }] }); if (ms) await page.waitForTimeout(ms / steps); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(450);
  };
  const swipe = (dx) => touch(dx < 0 ? 330 : 60, 420, (dx < 0 ? 330 : 60) + dx, 426);
  for (const hash of ['#/story/aesop-town-mouse', '#/whole/alice/1']) {
    await open(page, hash);
    await swipe(200); ok(`${hash}: a right swipe on the first scene does nothing (no back button to press)`, (await scene(page)) === 0 && (await page.evaluate(() => location.hash)) === hash);
    await swipe(-200); ok(`${hash}: a left swipe turns the page`, (await scene(page)) === 1, await scene(page));
    await swipe(200); ok(`${hash}: a right swipe turns it back`, (await scene(page)) === 0, await scene(page));
    await touch(200, 620, 130, 300); ok(`${hash}: a mostly-vertical drag does not turn the page`, (await scene(page)) === 0);
    await touch(330, 420, 280, 424); ok(`${hash}: a short sideways drag (50px) does not turn the page`, (await scene(page)) === 0);
    await touch(330, 420, 100, 424, 6, 1000); ok(`${hash}: a slow sideways drag (> 0.7 s) does not turn the page`, (await scene(page)) === 0);
  }
  await open(page, '#/story/aesop-town-mouse');
  await page.click('#main [data-full]'); await page.waitForTimeout(200);
  await swipe(-200); ok('a swipe under the full-screen painting does not turn the page', (await scene(page)) === 0);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  /* ---------- keys ---------- */
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page, '#/whole/alice/1');
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250); ok('→ turns the page', (await scene(page)) === 1);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(250); ok('← turns it back', (await scene(page)) === 0);
  await page.focus('[data-bz=header] input'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250);
  ok('→ in a text field moves the caret, not the page', (await scene(page)) === 0);

  /* ---------- narration still lights the words; leaving stops every clip ---------- */
  await open(page, '#/story/aesop-town-mouse');
  await page.click('[data-act=sp-play]'); await page.waitForTimeout(1800);
  ok('narration lights the words as she reads', await page.evaluate(() => !!document.querySelector('.sp-text span.now')));
  await page.click('#main [data-swipe=next]'); await page.waitForTimeout(1500);
  ok('turning the page reads the next scene', await page.evaluate(() => window.__bz.S.run.i === 1 && window.__clips.length >= 2 && window.__clips.slice(0, -1).every((a) => a.paused)));
  await open(page, '#/library');
  ok('leaving the page stops every clip', await page.evaluate(() => window.__clips.length > 0 && window.__clips.every((a) => a.paused)));
  ok('no page errors', errs.length === 0, errs[0]);
}

if (MEASURE_ONLY || process.env.PANEL_PRINT) for (const [k, m] of Object.entries(results)) console.log(k.padEnd(34), JSON.stringify({ first: m.first, lines: m.lines, turn: m.turn, pic: m.pic == null ? null : Math.round(m.pic * 100) + '%', beside: m.beside, sticker: m.sticker, clipped: m.clipped, wide: m.wide }));
await browser.close(); srv.kill();
if (!MEASURE_ONLY) console.log(fail ? `story-panel: ${fail} of ${n} checks failed` : `story-panel: all ${n} checks passed`);
process.exit(fail && !MEASURE_ONLY ? 1 : 0);
