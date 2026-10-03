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
  for (const [h, kind] of [['#/atlas', 'root'], ['#/library', 'root'], ['#/library/books', 'deep'], ['#/whole/alice', 'deep'], ['#/story/aesop-town-mouse/do', 'deep'], ['#/atlas/word', 'deep'], ['#/tools', 'root'], ['#/stage', 'deep'], ['#/tools/vocab', 'deep'], ['#/tools/idioms', 'deep'], ['#/play', 'root'], ['#/shop', 'deep']]) {
    await go(page, h); const f = await checkPageHead(page, { phone });
    ok(`${tag}: ${h} page head matches Bee`, f.length === 0, f.join('; '));
    ok(`${tag}: ${h} is a ${kind} head`, (await page.$eval('[data-bz=pagehead]', (e) => e.dataset.bzKind)) === kind);
  }
  /* no sideways scroll, measured against the width we set */
  for (const h of ['#/home', '#/atlas', '#/atlas/sentence', '#/library', '#/library/books', '#/library/words', '#/book/jungle', '#/story/aesop-town-mouse', '#/story/aesop-town-mouse/do', '#/whole/alice', '#/whole/alice/1', '#/whole/wind', '#/whole/wind/7', '#/stage', '#/stage/aloud', '#/play', '#/play/rush', '#/me', '#/medals', '#/collection', '#/shop/worlds', '#/practice', '#/grownups', '#/privacy', '#/help', '#/stop/s5-comma', '#/desk/wr7-persuade', '#/stage/sp2-recite', '#/stage/sp6-minute', '#/stage/sp4-story', '#/stage/contest', '#/tools', '#/tools/desk', '#/tools/vocab', '#/tools/vocab/vocab26', '#/tools/idioms', '#/tools/idioms/deck', '#/tools/idioms/quiz', '#/tools/typing', '#/tools/typing/home1', '#/tools/quotes', '#/tools/quotes/voices', '#/shop/extras', '#/play/figure', '#/stop/la7-devices', '#/stop/li5-simile', '#/desk/li10-case']) {
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
  await go(page, '#/story/aesop-town-mouse'); await page.waitForTimeout(600);
  await page.click('.passage span.w >> text=heartily');
  ok('tapping a word shows its meaning', await page.locator('.wordcard').isVisible());
  ok('the word goes in the bank', await page.evaluate(() => !!window.__bz.S.h.kids[0].bank.heartily));
  ok('the only request off the site is Bee’s recorded word', page.reqs.filter((u) => !ALLOWED(u)).every((u) => u.startsWith(BEE_AUDIO)));
  await page.keyboard.press('Escape');
  /* a story told scene by scene, by keyboard: → moves on; the end opens the exercises */
  const scenes = await page.evaluate(() => window.__bz.S.run.scenes.length);
  ok('a story is told in 2–6 scenes', scenes >= 2 && scenes <= 6, scenes);
  for (let i = 0; i < scenes; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200); }
  ok('the end of a story offers its exercises', await page.locator('a:has-text("Now the exercises")').isVisible());
  ok('hearing a story is recorded', await page.evaluate(() => !!window.__bz.S.h.kids[0].reading['aesop-town-mouse']?.heard));
  await go(page, '#/story/aesop-town-mouse/do');
  ok('a story has seven linked exercises', (await page.$$('.extile')).length >= 6);
  await page.click('.extile >> nth=0'); await page.waitForTimeout(400);
  for (let i = 0; i < 6; i++) { const a = await page.evaluate(() => { const r = window.__bz.S.run; return r?.mode === 'ex' ? r.items[r.i]?.answer : null; }); if (a == null) break; await page.keyboard.press(String(a + 1)); await page.waitForTimeout(1150); }
  ok('passing a story’s questions passes its Reading stop', await page.evaluate(() => window.__bz.S.h.kids[0].stops['rd-aesop-town-mouse']?.passed === true));
  ok('…and the exercise shows as done', await page.evaluate(() => !!window.__bz.S.h.kids[0].reading['aesop-town-mouse']?.ex?.understand));

  /* the grown-ups' page needs the PIN; the PIN is stored hashed */
  await go(page, '#/grownups');
  ok('grown-ups asks for a PIN first', await page.locator('.pinpad').isVisible() && !(await text(page)).includes('What to help with next'));
  for (const d of '2468') await page.keyboard.press(d); await page.waitForTimeout(400);
  ok('after the PIN, the report card shows', (await text(page)).includes('What to help with next'));
  ok('the PIN is never stored as digits', await page.evaluate(() => !localStorage.getItem('bizzing-english.household').includes('2468')));
  await page.reload(); await page.waitForTimeout(600); await go(page, '#/grownups');
  ok('a reload asks for the PIN again', await page.locator('.pinpad').isVisible());

  /* the avatar menu: a dropdown under the avatar — the children (the reader ticked), My page, Settings, Add a child */
  await go(page, '#/home');
  ok('every Home card opens its own topic, never a bare collection or the help page', await page.evaluate(() => [...document.querySelectorAll('.bz-home a[href^="#/"]')].map((x) => x.getAttribute('href')).every((h) => !/^#\/(help|me|library|stage|play|shop)$/.test(h))));
  ok('Home has Today’s three (a story, the challenge, a myth), and Your progress', (await page.$$('.fd-three > *')).length === 3 && (await page.$$('.fd-stat')).length === 5);
  await page.click('[data-act=fig-day] >> nth=0'); await page.waitForTimeout(200);
  ok('Today’s challenge is answered on the card, once a day, and explains', (await page.$$('[data-act=fig-day][disabled]')).length === 5 && /: it /.test(await page.textContent('.fd-fig .fd-say')));
  ok('Home shows three rings: right answers, passages read, said aloud or written', (await page.$$('.rings svg circle')).length === 6 && /right answers[\s\S]*passages read[\s\S]*said aloud or written/.test(await page.textContent('.rings')));
  await page.click('.bz-kid'); await page.waitForTimeout(250);
  ok('the avatar opens its menu, not a page', await page.locator('.kidmenu').isVisible());
  ok('the menu lists the children, My page, Settings and Add a child (grown-ups)', await page.evaluate(() => { const t = document.querySelector('.kidmenu').textContent; return document.querySelectorAll('.kidmenu .km-kid').length >= 1 && !!document.querySelector('.kidmenu .km-kid[aria-current] svg') && /My page — avatar, badges, collection/.test(t) && /Settings/.test(t) && /\+ Add a child\s*grown-ups/.test(t); }));
  ok('the menu sits under the avatar, on the screen', await page.evaluate(() => { const b = document.querySelector('.bz-kid').getBoundingClientRect(), m = document.querySelector('.kidmenu').getBoundingClientRect(); return m.top >= b.bottom && m.right <= innerWidth && m.left >= 0; }));
  await page.keyboard.press('ArrowDown'); ok('arrows move through the menu', await page.evaluate(() => document.activeElement?.classList.contains('km-item')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(150); ok('Esc closes the menu', !(await page.locator('.kidmenu').count()));
  await page.click('.bz-kid'); await page.click('.kidmenu .km-add'); await page.waitForTimeout(300);
  if (await page.$('#nk')) { await page.fill('#nk', 'Zia'); await page.click('[data-act=nk-band][data-arg="3"]'); ok('choosing an age band keeps the typed first name', (await page.inputValue('#nk')) === 'Zia' && (await page.getAttribute('[data-act=nk-band][data-arg="3"]', 'aria-pressed')) === 'true'); await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  await go(page, '#/home');
  await page.click('.bz-kid'); await page.click('.kidmenu [data-arg="#/me"]'); await page.waitForTimeout(300); ok('My page opens from the menu', /#\/me$/.test(page.url()));
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

  /* games, both ways — all seven, by touch AND by keys, each on its board (plate, framed area, track, avatar, Quill), each
     through a whole round into the run's next; the title card's level map and memory line; the Detective's clue, the
     passage hunt's tap, a Plot Line drag by pointer and by keys, the duel's rival; the final and the finish */
  const G = () => page.evaluate(() => { const r = window.__bz.S.run, g = r.g; return JSON.parse(JSON.stringify({ phase: r.phase, round: r.run?.round, i: g?.i, score: g?.score, right: g?.right, stage: g?.stage, state: g?.state, spot: g?.spot, found: g?.found, clue: g?.clue, line: g?.line, slot: g?.slot, cursor: g?.cursor, results: g?.results, n: g?.rounds?.length, q: g?.rounds?.[g.i], rival: g?.rival })); });
  const KID = () => page.evaluate(() => { const h = window.__bz.S.h; return JSON.parse(JSON.stringify(h.kids.find((k) => k.id === h.active).games)); });
  const phase = async (want, ms = 4000) => { for (let t = 0; t < ms; t += 100) { if ((await G()).phase === want) return true; await page.waitForTimeout(100); } return false; };
  const titleReady = () => page.waitForFunction(() => /new to you/.test(document.querySelector('[data-mem]')?.textContent || ''), null, { timeout: 15000 });
  await go(page, '#/play/builder'); await titleReady();
  ok('the title card shows the level map: five levels with stars, the ones not reached locked', await page.evaluate(() => { const l = [...document.querySelectorAll('.gb-map .gb-lv')]; return l.length === 5 && l[0].classList.contains('on') && l.slice(1).every((b) => b.disabled) && l.every((b) => b.querySelectorAll('.gb-stars i').length === 3); }));
  ok('the title card says what is new: "N new to you · M to win back · pool P"', /\d+ new to you · \d+ to win back · pool \d+/.test(await page.$eval('[data-mem]', (e) => e.textContent)));
  await page.click('[data-act=game-start]');
  ok('a game is played on a board: plate, frame, track, avatar, Quill and the round', await page.evaluate(() => { const b = document.querySelector('.gboard'); return !!b && /url\(/.test(b.style.getPropertyValue('--plate')) && !!b.querySelector('.gb-frame') && !!b.querySelector('.gb-time') && !!b.querySelector('.gb-ava') && !!b.querySelector('.gb-quill') && /Level \d/.test(b.textContent) && /Round 1 of 3/.test(b.querySelector('.gb-round').textContent); }));
  const play = async (how) => { const t = await page.evaluate(() => window.__bz.S.run.g.cur.tiles.map((x) => x.k)); for (const k of ['sub', 'dep', 'main']) { const i = t.indexOf(k); if (how === 'keys') await page.keyboard.press(String(i + 1)); else await page.click(`[data-act=b-pick][data-arg="${i}"]`); } await page.waitForTimeout(120); };
  await play('touch');
  ok('a right answer moves: the frame pops and "+N" flies up', await page.evaluate(() => !!document.querySelector('.gb-frame.gb-ok') && !!document.querySelector('.gb-fly')));
  await play('keys');
  ok('Sentence Builder plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.built === 2));
  await page.evaluate(() => { const r = window.__bz.S.run; r.g = { ...r.g, t: 59900 }; });
  ok('Sentence Builder: when the clock ends the round, the run goes on to round 2', await phase('between') && /Round 1 done/.test(await page.$eval('.gb-between', (e) => e.textContent)) && /new to you/.test(await page.$eval('.gb-between', (e) => e.textContent)));
  ok('…and the items met are remembered for next time', await KID().then((g) => g.builder.rounds === 1 && Object.keys(g.builder.seen).length >= 3));
  await page.keyboard.press('Enter');
  ok('Enter starts round 2', await phase('play') && /Round 2 of 3/.test(await page.$eval('.gb-round', (e) => e.textContent)));
  await go(page, '#/play/rush'); await titleReady(); await page.click('[data-act=game-start]'); await phase('play');
  const commas = await page.evaluate(() => window.__bz.S.run.g.cur.commas);
  for (const i of commas) await page.click(`[data-act=r-gap][data-arg="${i}"]`); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const c2 = await page.evaluate(() => window.__bz.S.run.g.cur.commas);
  await page.keyboard.press('ArrowRight'); for (let k = 0; k < 40; k++) { const cur = await page.evaluate(() => window.__bz.S.run.g.cursor); if (cur === c2[0]) break; await page.keyboard.press(cur < c2[0] ? 'ArrowRight' : 'ArrowLeft'); }
  for (const [j, i] of c2.entries()) { if (j) for (let k = 0; k < 40; k++) { const cur = await page.evaluate(() => window.__bz.S.run.g.cursor); if (cur === i) break; await page.keyboard.press('ArrowRight'); } await page.keyboard.press(' '); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  ok('Punctuation Rush plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.clean === 2));
  await page.evaluate(() => { const r = window.__bz.S.run; r.g = { ...r.g, t: 59900 }; });
  ok('Punctuation Rush: a round ends into the run', await phase('between'));

  /* Figure Hunt at level 3: a line, then a passage hunt — tap the sentence, then name the figure; a wrong spot holds */
  await go(page, '#/play/figure'); await titleReady(); await page.click('[data-act=game-start]'); await phase('play');
  ok('an untimed game shows one pip per item', await page.evaluate(() => document.querySelectorAll('.gb-pips .pip').length === window.__bz.S.run.g.rounds.length));
  let fq = (await G()).q; await page.click(`[data-act=q-pick][data-arg="${fq.answer}"]`); await page.waitForTimeout(1300);
  fq = (await G()).q; await page.keyboard.press(String(fq.answer + 1)); await page.waitForTimeout(200);
  ok('Figure Hunt plays by touch and by keys', (await G()).score === 2);
  await page.waitForTimeout(1200); fq = (await G()).q; await page.keyboard.press(String(((fq.answer + 1) % fq.options.length) + 1)); await page.waitForTimeout(200);
  ok('a wrong answer shakes, holds and explains on the item', await page.evaluate(() => !!document.querySelector('.gb-frame.gb-no') && !!document.querySelector('.feedback.no [data-act=q-next]')));
  await page.waitForTimeout(1500); ok('…and is still held a moment later', await page.evaluate(() => !!window.__bz.S.run.g.state && !window.__bz.S.run.g.state.ok));
  await page.keyboard.press('Enter'); await page.waitForTimeout(150); ok('Enter dismisses it', await page.evaluate(() => !window.__bz.S.run.g.state));
  await page.evaluate(() => { const h = window.__bz.S.h, k = h.kids.find((x) => x.id === h.active); k.games.figure = { ...k.games.figure, level: 3, top: 3 }; });
  await go(page, '#/play/plot'); await go(page, '#/play/figure'); await titleReady();
  ok('a level reached opens on the map', await page.evaluate(() => [...document.querySelectorAll('.gb-map .gb-lv')].filter((b) => !b.disabled).length === 3));
  await page.click('[data-act=game-start]'); await phase('play', 15000);
  let hunts = 0, wrongSpot = false;
  for (let k = 0; k < 12 && (await G()).phase === 'play'; k++) {
    const s = await G(), q = s.q;
    if (q.hunt && !s.found && !s.spot) {
      hunts++;
      if (hunts === 1) { await page.click(`[data-act=fig-spot][data-arg="${q.at}"]`); await page.waitForTimeout(150); ok('the passage hunt: a tap on the sentence that holds the figure lights it and asks for its name', await page.evaluate(() => !!document.querySelector('.gb-sent.right') && window.__bz.S.run.g.found === true && document.querySelectorAll('[data-act=q-pick]').length === 4)); }
      else { await page.keyboard.press(String(((q.at + 1) % q.sentences.length) + 1)); await page.waitForTimeout(150); wrongSpot = await page.evaluate(() => !!document.querySelector('.gb-sent.wrong') && !!document.querySelector('.gb-sent.right') && !window.__bz.S.run.g.found); await page.keyboard.press('Enter'); await page.waitForTimeout(150); }
      continue;
    }
    if (s.state && !s.state.ok) { await page.keyboard.press('Enter'); await page.waitForTimeout(150); continue; }
    if (s.state) { await page.waitForTimeout(400); continue; }
    await page.keyboard.press(String(q.answer + 1)); await page.waitForTimeout(1250);
  }
  ok(`Figure Hunt level 3 hunts in passages (${hunts} this round)`, hunts >= 2);
  ok('the passage hunt by keys: a wrong sentence holds and shows the right one; Enter goes on to naming', wrongSpot);
  ok('Figure Hunt: the round ends into the run', await phase('between'));

  /* Who Said It? — the Detective: a clue costs a point (3 → 2 → 1), by touch and by the C key */
  await go(page, '#/play/who'); await titleReady(); await page.click('[data-act=game-start]'); await phase('play');
  ok('the Detective: the line is worth 3 with no clue', /Worth 3 points/.test(await page.$eval('.gb-worth', (e) => e.textContent)));
  await page.click('[data-act=who-clue]'); await page.waitForTimeout(120);
  ok('the clue button opens one clue and the line is worth 2', await page.evaluate(() => document.querySelectorAll('.gb-clues li').length === 1 && /Worth 2 points/.test(document.querySelector('.gb-worth').textContent)));
  let wq = (await G()).q; await page.click(`[data-act=q-pick][data-arg="${wq.answer}"]`); await page.waitForTimeout(1300);
  await page.keyboard.press('c'); await page.keyboard.press('c'); await page.waitForTimeout(100);
  ok('C opens clues by keys', (await G()).clue === 2);
  wq = (await G()).q; await page.keyboard.press(String(wq.answer + 1)); await page.waitForTimeout(250);
  ok('Who Said It? plays by touch and by keys, scored by the clues opened (2 + 1)', (await G()).score === 3);
  for (let k = 0; k < 8 && (await G()).phase === 'play'; k++) { await page.waitForTimeout(1200); const s = await G(); if (s.phase !== 'play') break; await page.keyboard.press(String(s.q.answer + 1)); await page.waitForTimeout(150); }
  ok('Who Said It?: the round ends into the run', await phase('between'));

  /* Plot Line: the first story by DRAG (pointer), the second by KEYS (a slot, a card, Enter), the third by tap */
  await go(page, '#/play/plot'); await titleReady(); await page.click('[data-act=game-start]'); await page.waitForSelector('[data-act=pl-place]', { timeout: 15000 });
  let pq = (await G()).q;
  for (const at of [...pq.cards.keys()].reverse()) {
    const i = pq.cards.findIndex((c) => c.at === at), card = await page.$(`[data-act=pl-place][data-arg="${i}"]`), slot = await page.$(`.gb-slot[data-slot="${at}"]`);
    const a = await card.boundingBox(), b = await slot.boundingBox();
    await page.mouse.move(a.x + 20, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(a.x + 40, a.y + a.height / 2 + 10, { steps: 3 }); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(150);
  }
  ok('Plot Line by drag: each scene dropped on its own slot, last first, every pair in order', await page.evaluate(() => window.__bz.S.run.g.state?.ok === true));
  await page.waitForTimeout(1800); pq = (await G()).q;
  for (const at of [pq.cards.length - 1, ...[...pq.cards.keys()].slice(0, -1)]) {
    const want = pq.cards.findIndex((c) => c.at === at);
    for (let k = 0; k < 10 && (await G()).slot !== at; k++) await page.keyboard.press('ArrowDown');
    for (let k = 0; k < 10 && (await G()).cursor !== want; k++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(200);
  ok('Plot Line by keys: ↓ picks the slot, → the card, Enter drops it — last slot first', (await G()).state?.ok === true);
  await page.waitForTimeout(1800); pq = (await G()).q; for (let at = 0; at < pq.cards.length; at++) await page.click(`[data-act=pl-place][data-arg="${pq.cards.findIndex((c) => c.at === at)}"]`);
  ok('Plot Line by tap, and the round ends into the run', await phase('between'));
  ok('Plot Line: three stories perfect', await page.evaluate(() => window.__bz.S.run.run.scores[0] >= 9));

  /* Root Forge: the lexicon loads, then tap the real word's piece, then press its number, through the round */
  await go(page, '#/play/root'); await titleReady(); await page.click('[data-act=game-start]'); await page.waitForSelector('.gb-forge', { timeout: 15000 });
  let a = (await G()).q.answer; await page.click(`[data-act=q-pick][data-arg="${a}"]`); await page.waitForTimeout(300);
  ok('Root Forge shows the forged word and its meaning', await page.evaluate(() => { const q = window.__bz.S.run.g.rounds[0]; return document.querySelector('.gb-fused') && document.querySelector('.feedback.ok')?.textContent.includes(q.word); }));
  await page.waitForTimeout(1100); a = (await G()).q.answer; await page.keyboard.press(String(a + 1)); await page.waitForTimeout(250);
  ok('Root Forge plays by touch and by keys', (await G()).right === 2);
  for (let k = 0; k < 8 && (await G()).phase === 'play'; k++) { await page.waitForTimeout(1150); const s = await G(); if (s.phase !== 'play') break; await page.keyboard.press(String(s.q.answer + 1)); await page.waitForTimeout(150); }
  ok('Root Forge: the round ends into the run', await phase('between'));
  await page.evaluate(() => { window.__bz.S.run.run.round = 3; }); await page.click('[data-act=game-round]'); await page.waitForSelector('.gb-family', { timeout: 15000 });
  ok('Root Forge’s final forges a family: three words from one base', await page.evaluate(() => { const g = window.__bz.S.run.g; return /Forge a family/.test(document.querySelector('.gb-family').textContent) && g.rounds.length === 6 && g.rounds.slice(0, 3).every((q) => q.base === g.rounds[0].base); }));

  /* Rhetoric Duel: against one of Bee's rivals, best of five — stronger version, then the reason, by touch and by keys */
  await go(page, '#/play/duel'); await titleReady(); await page.click('[data-act=game-start]'); await phase('play');
  ok('the duel’s rival is one of Bee’s, with the score of the duel, labelled as the app’s own', await page.evaluate(() => { const r = document.querySelector('.gb-rival'); return !!r && /rivals\/\w+\.webp/.test(r.querySelector('img').getAttribute('src')) && /You 0 · \w+ 0/.test(r.textContent) && /made-up rivals/.test(r.textContent) && /the app’s own/.test(r.textContent); }));
  let dq = (await G()).q; await page.click(`[data-act=du-pick][data-arg="${dq.strong}"]`); await page.waitForTimeout(150);
  ok('Rhetoric Duel names the original and labels the plain version as written for the game', await page.evaluate(() => /The original/.test(document.querySelector('.gb-duel').textContent) && /written for this game/.test(document.querySelector('.gb-duel').textContent)));
  await page.click(`[data-act=q-pick][data-arg="${dq.answer}"]`); await page.waitForTimeout(200);
  ok('after the reason, the rival’s line is shown too', await page.evaluate(() => /got this reason|missed this one/.test(document.querySelector('.gb-rvline')?.textContent || '')));
  await page.waitForTimeout(1200);
  dq = (await G()).q; await page.keyboard.press(String(dq.strong + 1)); await page.waitForTimeout(150); await page.keyboard.press(String(dq.answer + 1)); await page.waitForTimeout(250);
  ok('Rhetoric Duel plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.score >= 2 && window.__bz.S.run.g.strongRight === 2 && /You 2 ·/.test(document.querySelector('.gb-rival').textContent)));
  for (let k = 0; k < 8 && (await G()).phase === 'play'; k++) { await page.waitForTimeout(1200); const s = await G(); if (s.phase !== 'play') break; await page.keyboard.press(String(s.q.strong + 1)); await page.waitForTimeout(100); await page.keyboard.press(String(s.q.answer + 1)); await page.waitForTimeout(150); }
  ok('a duel ends with its result against the rival', await phase('between') && /won the duel|won this one|A draw/.test(await page.$eval('.gb-between', (e) => e.textContent)));
  /* the final: the strongest rival of the field; then the finish */
  await page.evaluate(() => { window.__bz.S.run.run.round = 3; }); await page.click('[data-act=game-round]'); await phase('play');
  ok('the final is marked, against the strongest rival in the field', await page.evaluate(() => !!document.querySelector('.gboard.gb-final') && /Final/.test(document.querySelector('.gb-round').textContent) && window.__bz.S.run.g.rival?.id));
  for (let k = 0; k < 30 && (await G()).phase === 'play'; k++) { const s = await G(); if (s.state && !s.state.ok) { await page.keyboard.press('Enter'); await page.waitForTimeout(150); continue; } if (s.state) { await page.waitForTimeout(400); continue; } await page.keyboard.press(String(s.q.strong + 1)); await page.waitForTimeout(100); await page.keyboard.press(String(((s.q.answer + (k === 0 ? 1 : 0)) % 4) + 1)); await page.waitForTimeout(300); }
  await phase('done');
  ok('the finish shows the run’s stars, score, best, accuracy, new items met and the level', await page.evaluate(() => { const t = document.querySelector('.gb-done')?.textContent || ''; return /You practised/.test(t) && /accuracy/.test(t) && /best/.test(t) && /Level \d/.test(t) && /new items met/.test(t) && document.querySelectorAll('.gb-done .gb-stars i').length === 3; }));
  const nx = await page.evaluate(() => document.querySelector('.gb-done [data-next]')?.getAttribute('href'));
  ok('the finish names one next step: the stop that teaches what was missed', nx === '#/stop/la7-devices' || nx === '#/stop/la7-antithesis', nx);
  ok('the level, the stars and the memory are kept per game', await KID().then((g) => g.duel.level >= 1 && g.duel.stars?.[1] >= 1 && g.duel.rounds === 2 && Object.keys(g.duel.seen).length >= 5 && g.duel.plays === 2 && g.duel.runs === 1));
  /* by touch on a phone: a Plot Line story tapped in order; nothing scrolls sideways */
  { const P = await ctxFor({ phone: true }); await makeKid(P.page, 'Ivo', '8–10'); await go(P.page, '#/play/plot');
    await P.page.waitForFunction(() => /new to you/.test(document.querySelector('[data-mem]')?.textContent || ''), null, { timeout: 15000 });
    ok('games (phone): the title card fits', (await P.page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
    await P.page.tap('[data-act=game-start]'); await P.page.waitForSelector('[data-act=pl-place]', { timeout: 15000 });
    const q = await P.page.evaluate(() => window.__bz.S.run.g.rounds[0]); for (let at = 0; at < q.cards.length; at++) await P.page.tap(`[data-act=pl-place][data-arg="${q.cards.findIndex((c) => c.at === at)}"]`);
    ok('Plot Line by touch on a phone', await P.page.evaluate(() => window.__bz.S.run.g.state?.ok === true));
    ok('games (phone): the board does not scroll sideways', (await P.page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
    ok('games (phone): no errors', !P.page.errs.length, P.page.errs.join('; '));
    await P.ctx.close(); }

  /* ☰ by keyboard (checkShell drives it too): Tab stays inside, Esc closes */
  await go(page, '#/home'); await page.click('[data-bz=menu]'); for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  ok('focus stays inside the open drawer', await page.evaluate(() => !!document.activeElement.closest('[data-bz=drawer]')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('Esc closes the drawer', await page.evaluate(() => document.querySelector('[data-bz=drawer]').hidden));
  ok('no page errors in the behaviour run', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- 2b. Phase 3 — writing and speaking, and the privacy promise: nothing typed or said leaves ---------- */
{
  const { ctx, page } = await ctxFor();
  const posts = [], bodies = [];
  page.on('request', (r) => { if (r.method() !== 'GET') posts.push(r.method() + ' ' + r.url()); const b = r.postData(); if (b) bodies.push(b); });
  await makeKid(page, 'Ila', '11–14');
  await page.evaluate(() => { const S = window.__bz.S; S.h.parent.tester = true; window.__bz.render(); });
  /* dictation: the sentence is heard, not shown; a miss names the kind of mistake */
  await go(page, '#/stop/wr2-dict'); await page.click('[data-act=run-phase][data-arg=learn]'); await page.click('[data-act=run-phase][data-arg=turn]');
  ok('a dictation never shows its sentence before it is answered', await page.evaluate(() => { const it = window.__bz.S.run.items[0]; return !document.querySelector('.item').innerText.includes(it.text); }));
  page.reqs.length = 0; await page.click('[data-act=dict-play]'); await page.waitForTimeout(500);
  ok('the dictation is the narrator’s recording, from this site', page.reqs.some((u) => /voice\/dict\//.test(u)) && page.reqs.every(ALLOWED));
  const want = await page.evaluate(() => window.__bz.S.run.items[0].text);
  await page.fill('.item textarea', want.toLowerCase()); await page.click('[data-act=submit]'); await page.waitForTimeout(300);
  ok('a dictation with no capitals is caught, by kind', /capital letter/.test(await page.textContent('.diff')));
  /* imitation: the shape is checked, the meaning is the child's */
  await go(page, '#/stop/wr3-imitate'); await page.click('[data-act=run-phase][data-arg=learn]'); await page.click('[data-act=run-phase][data-arg=turn]');
  const shape = await page.evaluate(() => window.__bz.S.run.items[0].shape);
  const mine = { opener: 'When the bell rang, my little brother cheered loudly.', list3: 'We packed apples, bananas and a big flask of tea.', simile: 'The lake was as smooth as a mirror this morning.',
    but: 'I wanted to play cricket outside, but the monsoon had other plans.', fronted: 'Slowly, the old tortoise crossed the dusty road.', question: 'Why does the moon follow our car at night?' }[shape];
  await page.fill('.item textarea', mine); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  ok('a sentence of the child’s own in the shape is accepted, and says it checked the shape', /checked the shape/.test(await page.textContent('.feedback')));
  /* the writing desk: counts, never marks; a finished piece; the words never travel */
  const secret = 'Zebrafish whisper secrets under the violet bridge.';
  await go(page, '#/stop/wr4-para'); await page.waitForTimeout(300);
  ok('a desk stop opens the writing desk', /#\/desk\/wr4-para/.test(page.url()));
  const tas = await page.$$('.desk textarea');
  await tas[0].fill(secret); await tas[1].fill('The fish are small. The bridge is old. The water is cold.'); await tas[2].fill('That is my favourite place.');
  await page.waitForTimeout(600);
  ok('the desk counts sentences, labelled as counts', (await page.textContent('.desk')).includes('Counts — not marks') && (await page.$eval('.desk .stat b', (e) => e.textContent)) === '5');
  await page.click('[data-act=desk-tick] >> nth=0'); await page.click('[data-act=desk-finish]'); await page.waitForTimeout(500);
  ok('finishing a piece passes the stop', await page.evaluate(() => window.__bz.S.h.kids[0].stops['wr4-para']?.passed === true));
  ok('a written piece is never machine-checked later (judged by a grown-up)', await page.evaluate(() => window.__bz.S.h.kids[0].mastery['wr4-para']?.judged === true));
  /* a one-minute speech: plan, speak (microphone on a tap), stop — the tracks end */
  await go(page, '#/stage/sp6-minute');
  await page.fill('[data-act=sp-plan][data-arg=hook]', secret);
  ok('a speaking stop does not open the microphone by itself', await page.evaluate(() => window.__tracks.length === 0));
  await page.click('[data-act=sp-start]'); await page.waitForTimeout(1200); await page.click('[data-act=sp-stop]'); await page.waitForTimeout(200);
  ok('Stop ends every microphone track (speech)', await page.evaluate(() => window.__tracks.length > 0 && window.__tracks.every((t) => t.readyState === 'ended')));
  ok('the speech result shows only measured numbers and says what it cannot judge', /cannot hear expression/.test(await page.textContent('main')));
  /* a debate: both sides, two recordings */
  await go(page, '#/stage/sp10-debate'); await page.click('[data-act=sp-start]'); await page.waitForTimeout(800); await page.click('[data-act=sp-stop]'); await page.waitForTimeout(200);
  ok('a debate asks for the other side next', /AGAINST/.test(await page.textContent('main')));
  await page.click('[data-act=sp-start]'); await page.waitForTimeout(800); await page.click('[data-act=sp-stop]'); await page.waitForTimeout(200);
  ok('both sides are measured', (await page.$$('.stats')).length === 2);
  /* the grown-up's rubric is the only judge of quality */
  await go(page, '#/grownups'); for (const d of '1357') await page.keyboard.press(d); await page.waitForTimeout(300);
  ok('the grown-up can read the piece and judge it', (await page.textContent('main')).includes('Zebrafish') && (await page.$$('[data-act=wrubric]')).length >= 4);
  /* the Elocution Contest: three rounds, the microphone on a tap, points only from what is measured */
  await page.evaluate(() => { const k = window.__bz.S.h.kids[0]; k.stops['sp1-aloud'] = { passed: true, tries: 1 }; });
  await go(page, '#/stage'); ok('the Stage offers the contest with Bee’s rivals', (await page.textContent('main')).includes('Elocution Contest') && (await page.$$('.rivalrow img')).length === 5);
  const n0 = (await page.evaluate(() => window.__tracks.length));
  await go(page, '#/stage/contest'); ok('entering the contest does not open the microphone', await page.evaluate((n) => window.__tracks.length === n, n0));
  await page.click('[data-act=ct-begin]');
  for (let round = 0; round < 3; round++) {
    await page.click('[data-act=ct-start]'); await page.waitForTimeout(900);
    if (!round) ok('the contest opens the microphone on Start', await page.evaluate(() => window.__tracks.at(-1).readyState === 'live'));
    await page.click('[data-act=ct-stop]'); await page.waitForTimeout(250);
    ok(`contest round ${round + 1}: Stop ends every track`, await page.evaluate(() => window.__tracks.every((t) => t.readyState === 'ended')));
    if (round < 2) { ok(`contest round ${round + 1}: every point names what measured it`, /Timing — inside the window|Too quiet to measure/.test(await page.textContent('main')) && (await page.$$('.standings li')).length === 6); await page.click('[data-act=ct-next]'); }
  }
  ok('the contest ends with places and says what it never scores', (await page.$$('.standings li')).length === 6 && /never scored/.test(await page.textContent('main')));
  ok('a finished contest keeps numbers only', await page.evaluate(() => { const c = window.__bz.S.h.kids[0].contests; return c.length === 1 && Object.values(c[0]).every((v) => typeof v === 'number' || Array.isArray(v)); }));
  await go(page, '#/stage'); await go(page, '#/stage/contest'); await page.click('[data-act=ct-begin]'); await page.click('[data-act=ct-start]'); await page.waitForTimeout(600); await go(page, '#/home');
  ok('leaving the contest mid-round switches the microphone off', await page.evaluate(() => window.__tracks.every((t) => t.readyState === 'ended')));
  /* the Shop's Extras: a look at a printed price; the paper is worn at once */
  await go(page, '#/shop/extras');
  ok('Extras: three kinds, the first of each free and worn', (await page.$$('.extragrid')).length === 3 && (await page.$$('.extragrid .tag.ok')).length === 3);
  const can = await page.$('[data-act=buy-extra][data-arg=paper-cream]:not([disabled])');
  if (can) { await can.click(); await page.waitForTimeout(300); ok('buying a paper wears it at once', await page.evaluate(() => document.documentElement.dataset.paper === 'cream')); }
  else ok('an Extra you cannot afford cannot be bought', !!(await page.$('[data-act=buy-extra][data-arg=paper-cream][disabled]')));
  await page.click('[data-act=wear-extra][data-arg=paper-plain]').catch(() => {}); 
  /* My Feed */
  {
    const reqs0 = page.reqs.length;
    await go(page, '#/feed'); await page.waitForTimeout(600);
    ok('My Feed: the tab is in the top bar, last', (await page.$$eval('[data-bz=tab]', (t) => t.at(-1)?.getAttribute('href') === '#/feed' && /My Feed/.test(t.at(-1).textContent))));
    ok('My Feed: the page head matches Bee (a tab root)', (await checkPageHead(page)).length === 0 && (await page.$eval('[data-bz=pagehead]', (e) => e.dataset.bzKind)) === 'root');
    ok('My Feed: the head names the child’s level', /Picked for you from across the app, for [A-Z][a-z]+ \d+ · .+ — about twenty, and then it ends\./.test(await page.textContent('[data-bz=pagehead]')));
    const cards = await page.$$eval('.bzf-card', (c) => c.map((e) => (e.matches('.bzf-end') ? 'END' : e.dataset.id)));
    ok(`My Feed: twenty cards, then the finished card (${cards.length})`, cards.length === 21 && cards.at(-1) === 'END' && cards.slice(0, 20).every((x) => x !== 'END'));
    ok('My Feed: the end points at Continue', !!(await page.$('[data-bz=feed-end] a[href="#/continue"]')));
    ok('My Feed: every card says why it is there and where it is taught or what it is', await page.$$eval('.bzf-card:not(.bzf-end)', (c) => c.every((e) => e.querySelector('.bzf-why')?.textContent.trim() && e.querySelector('.bzf-where'))));
    const plays = await page.$$eval('.bzf-card:not(.bzf-end)', (c) => c.filter((e) => e.querySelector('.bzf-opt')).map((e) => e.dataset.id));
    ok(`My Feed: questions are answered on the card (${plays.length})`, plays.length >= 2 && plays.length <= 5);
    const coins0 = await page.evaluate(() => window.__bz.S.h.kids[0].feed?.paid ? Object.keys(window.__bz.S.h.kids[0].feed.paid).length : 0);
    const sel = (id) => `.bzf-card[data-id="${id}"]`;
    /* by touch (a tap on the right option) */
    await page.click(`${sel(plays[0])} .bzf-opt[data-o="0"]`); await page.waitForTimeout(250);
    ok('My Feed: a right answer by tap says so and pays once', !!(await page.$(`${sel(plays[0])} .bzf-after.ok`)) && (await page.evaluate(() => Object.keys(window.__bz.S.h.kids[0].feed.paid).length)) === coins0 + 1);
    /* by key: focus the card, press the number of the right option */
    const n = await page.$$eval(`${sel(plays[1])} .bzf-opt`, (b) => b.findIndex((x) => x.dataset.o === '0') + 1);
    await page.focus(sel(plays[1])); await page.keyboard.press(String(n)); await page.waitForTimeout(250);
    ok('My Feed: a right answer by key 1–4 on the focused card', !!(await page.$(`${sel(plays[1])} .bzf-after.ok`)));
    if (plays[2]) {
      await page.focus(sel(plays[2])); const w = await page.$$eval(`${sel(plays[2])} .bzf-opt`, (b) => b.findIndex((x) => x.dataset.o !== '0') + 1);
      await page.keyboard.press(String(w)); await page.waitForTimeout(250);
      ok('My Feed: a wrong answer holds, names the right one, and waits for Continue', !!(await page.$(`${sel(plays[2])} [data-bzf=cont]`)) && /Not this time/.test(await page.textContent(sel(plays[2]))));
      await page.keyboard.press('Enter'); await page.waitForTimeout(250);
      ok('My Feed: Enter goes on after a wrong answer', !(await page.$(`${sel(plays[2])} [data-bzf=cont]`)));
    }
    /* a card's button opens the specific place */
    const want = await page.$eval('.bzf-card:not(.bzf-end) .bzf-row a.bz-btn', (a) => a.getAttribute('href'));
    await page.click('.bzf-card:not(.bzf-end) .bzf-row a.bz-btn'); await page.waitForTimeout(500);
    const at = new URL(page.url()).hash;
    ok(`My Feed: a card’s button opens its own topic (${at})`, at === want && !/^#\/(library|stage|play|atlas|home)?\/?$/.test(at));
    ok('My Feed: no request left the site', page.reqs.slice(reqs0).every(ALLOWED), page.reqs.slice(reqs0).filter((u) => !ALLOWED(u)).slice(0, 3).join(' '));
    /* on a phone: six tabs fit, the shell still matches Bee, nothing scrolls sideways, and a tap answers */
    const P = await ctxFor({ phone: true }); await makeKid(P.page, 'Noor', '6–7'); await go(P.page, '#/home');
    const sh = await checkShell(P.page, { phone: true });   // the shell is measured on Home, where it carries the home grid
    await go(P.page, '#/feed'); await P.page.waitForTimeout(600);
    ok('My Feed (phone): checkShell matches Bee with six tabs', sh.length === 0 && (await P.page.$$('[data-bz=tabbar] a')).length === 6, sh.join('; '));
    ok('My Feed (phone): no sideways scroll', (await P.page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
    const pp = await P.page.$('.bzf-card:not(.bzf-end) .bzf-opt[data-o="0"]');
    if (pp) { await pp.tap(); await P.page.waitForTimeout(250); ok('My Feed (phone): a tap answers on the card', !!(await P.page.$('.bzf-after.ok'))); }
    ok('My Feed (phone): only Bizzing English was asked for anything', P.page.reqs.every(ALLOWED) && P.page.errs.length === 0, P.page.errs.slice(0, 2).join(' | '));
    await P.ctx.close();
  }
  /* ---------- the Library's deep dives: the Greek myths door and journey, an author's page and its quiz ---------- */
  {
    await go(page, '#/library'); await page.waitForTimeout(300);
    const door = await page.$('a.mythdoor');
    ok('Deep: the story room shows the Greek myths door', !!door && /Greek myths/.test(await door.textContent()) && (await door.getAttribute('href')) === '#/library/myths');
    ok('Deep: the Library sub-nav has a Greek myths chip (six chips at most)', (await page.$$eval('[data-bz=subnav] a', (a) => a.map((x) => x.textContent))).some((t) => /Greek myths/.test(t)) && (await page.$$('[data-bz=subnav] a')).length <= 6);
    await go(page, '#/myths'); await page.waitForTimeout(300);
    ok('Deep: #/myths opens the myths page', new URL(page.url()).hash === '#/library/myths' && (await page.$$('.mj-stop')).length === 15, `${page.url()} ${(await page.$$('.mj-stop')).length}`);
    ok('Deep: each myth links to hear it and to its exercises', await page.$$eval('.mj-stop', (s) => s.every((x) => x.querySelector(`a[href="#/story/${x.dataset.myth}"]`) && x.querySelector(`a[href="#/story/${x.dataset.myth}/do"]`))));
    ok('Deep: the myths show the words they gave English', (await page.$$('.mj-words li')).length >= 30 && !!(await page.$('.mj-words a[href="#/word/panic"]')));
    ok('Deep: a Who’s who of gods and heroes, quoted', (await page.$$('.dp-who')).length >= 20 && /Juno \(Hera\)/.test(await page.textContent('#whos-who ~ .grid3')));
    ok('Deep: a link to the Word 7 stops', !!(await page.$('a[href="#/stop/w7-myth-names"]')));
    const fh = await checkPageHead(page, {}); ok('Deep: the myths page head matches Bee', fh.length === 0, fh.join('; '));
    await go(page, '#/author/shakespeare'); await page.waitForTimeout(300);
    ok('Deep: #/author/shakespeare opens his page', new URL(page.url()).hash === '#/library/author/shakespeare' && /William Shakespeare/.test(await page.textContent('[data-bz=pagehead]')));
    const ah = await checkPageHead(page, {}); ok('Deep: the author page head matches Bee', ah.length === 0, ah.join('; '));
    ok('Deep: Shakespeare’s page shows his scenes and sonnets', (await page.$$('.dp a.scard[href^="#/story/"]')).length >= 9 && !!(await page.$('a[href="#/story/caesar-antony"]')) && !!(await page.$('a[href="#/story/sonnet-116"]')));
    ok('Deep: his lines, the words first recorded in him, how to read him, the Stage', !!(await page.$('[data-deep-lines] blockquote')) && /first recorded/i.test(await text(page)) && !!(await page.$('a[href="#/stop/la4-shakespeare"]')) && !!(await page.$('a[href="#/stop/la9-pentameter"]')) && !!(await page.$('a[href="#/stage/contest"]')));
    const cur = () => page.evaluate(() => { const d = window.__bz.S.deep; return { i: d.i, answer: d.items[d.i]?.answer, pick: d.pick }; });
    const paid0 = await page.evaluate(() => Object.keys(window.__bz.S.h.kids[0].deep?.paid || {}).length);
    /* by TOUCH: a wrong option first — it holds, names the right one, and waits; Enter goes on */
    let c = await cur();
    await page.click(`#dq [data-deep=ans][data-arg="${(c.answer + 1) % 4}"]`); await page.waitForTimeout(250);
    ok('Deep: a wrong answer holds and names the right one', !!(await page.$('#dq [data-deep=next]')) && /The answer is/.test(await page.textContent('#dq')) && (await cur()).i === 0);
    await page.waitForTimeout(1100); ok('Deep: …and still holds a second later', (await cur()).i === 0);
    await page.keyboard.press('Enter'); await page.waitForTimeout(250);
    ok('Deep: Enter goes on after a wrong answer', (await cur()).i === 1);
    /* the right option by touch advances and pays */
    c = await cur(); await page.click(`#dq [data-deep=ans][data-arg="${c.answer}"]`); await page.waitForTimeout(200);
    ok('Deep: a right answer by tap says so', !!(await page.$('#dq .feedback.ok')));
    await page.waitForTimeout(1100); ok('Deep: …and advances by itself', (await cur()).i === 2);
    /* by KEY: the number of the right option */
    c = await cur(); await page.keyboard.press(String(c.answer + 1)); await page.waitForTimeout(200);
    ok('Deep: a right answer by key 1–4', !!(await page.$('#dq .feedback.ok')));
    await page.waitForTimeout(1100);
    ok('Deep: each right answer paid once', (await page.evaluate(() => Object.keys(window.__bz.S.h.kids[0].deep?.paid || {}).length)) === paid0 + 2);
    ok('Deep: no sideways scroll on the myths or an author', (await page.evaluate(() => document.documentElement.scrollWidth)) <= 1280);
    const P = await ctxFor({ phone: true }); await makeKid(P.page, 'Zara', '11–14');
    for (const h of ['#/library/myths', '#/library/author/shakespeare', '#/library/authors', '#/library/author/andersen']) {
      await go(P.page, h); const w = await P.page.evaluate(() => document.documentElement.scrollWidth);
      ok(`Deep (phone): ${h} does not scroll sideways (${w}px)`, w <= 390);
      const f = await checkPageHead(P.page, { phone: true }); ok(`Deep (phone): ${h} page head matches Bee`, f.length === 0, f.join('; '));
    }
    ok('Deep (phone): a gated author shows a card, no stories', !(await P.page.$('.dp a.scard[href^="#/story/"]')) && /rights/i.test(await P.page.textContent('.dp')));
    await go(P.page, '#/library/author/lincoln'); const tb = await P.page.$('#dq [data-deep=ans]');
    if (tb) { await tb.tap(); await P.page.waitForTimeout(200); ok('Deep (phone): a tap answers the quiz', !!(await P.page.$('#dq .feedback'))); }
    ok('Deep (phone): no page errors, nothing asked of anyone else', P.page.errs.length === 0 && P.page.reqs.every(ALLOWED), P.page.errs.slice(0, 2).join(' | '));
    await P.ctx.close();
  }
  /* Tools */
  {
    const tabs = await page.$$eval('[data-bz=tab]', (t) => t.map((x) => x.getAttribute('href')));
    ok('Tools: the Tools tab sits where the Stage was, and the Stage is not a tab', tabs.join(' ') === '#/home #/atlas #/library #/tools #/play #/feed', tabs.join(' '));
    await go(page, '#/tools'); await page.waitForTimeout(300);
    ok('Tools: the tab is current on #/tools', (await page.getAttribute('[data-bz=tab][href="#/tools"]', 'aria-current')) === 'page');
    const cards = await page.$$eval('a.tl-tile', (a) => a.map((x) => ({ href: x.getAttribute('href'), kick: x.querySelector('.tl-kick')?.textContent, title: x.querySelector('.tl-h')?.textContent, go: x.querySelector('.tl-go')?.textContent, img: x.querySelector('img')?.getAttribute('src') })));
    ok(`Tools: six painted tool cards, each with a kicker, a name over the painting and a button (${cards.length})`, cards.length === 6 && cards.every((c) => c.kick && c.title && c.go && /^art\/tool-/.test(c.img)));
    ok('Tools: Bee’s four kickers are there', ['MEANING', 'SAYINGS', 'SPEED', 'VOICES'].every((k) => cards.some((c) => c.kick.toUpperCase() === k)));
    const widths = await page.$$eval('a.tl-tile img', (im) => Promise.all(im.map((i) => (i.complete ? i.naturalWidth : new Promise((r) => { i.onload = () => r(i.naturalWidth); i.onerror = () => r(0); })))));
    ok('Tools: the paintings load', widths.length === 6 && widths.every((x) => x > 0), widths.join(' '));
    ok('Tools: the Word bank and Dictionary are small cards', !!(await page.$('a.tl-small[href="#/library/words"]')) && !!(await page.$('a.tl-small[href="#/search"]')));
    for (const c of [...cards, { href: '#/library/words' }, { href: '#/search' }]) {
      await go(page, '#/tools'); await page.click(`a[href="${c.href}"]`); await page.waitForTimeout(600);
      const head = await checkPageHead(page, {});
      ok(`Tools: ${c.href} opens from its card, with a page head that matches Bee`, new URL(page.url()).hash.startsWith(c.href) && head.length === 0, head.join('; '));
    }
    await go(page, '#/stage'); ok('Tools: #/stage still works, under the Tools tab, with a way back to Tools', (await page.textContent('main')).includes('Elocution Contest') && (await page.getAttribute('[data-bz=tab][href="#/tools"]', 'aria-current')) === 'page' && (await page.getAttribute('[data-bz=back]', 'href')) === '#/tools');
    await go(page, '#/tools/desk'); ok('Tools: the Writing Desk lists the desks and opens one', (await page.$$('a.stoprow[href^="#/desk/"]')).length >= 8);
    /* Vocabulary: study, then the check — by touch and by key; a right answer pays and banks the word */
    await go(page, '#/tools/vocab'); ok('Tools: Vocabulary offers Bee’s decks', (await page.$$('a.tl-deck')).length >= 10 && /Meaning Masters/.test(await text(page)));
    await go(page, '#/tools/vocab/easy'); await page.waitForTimeout(300);
    await page.keyboard.press('Space'); await page.waitForTimeout(150);
    ok('Tools: Space turns the vocabulary card to its meaning', await page.evaluate(() => window.__bz.S.run.flip === true) && !!(await page.$('.tl-back')));
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150); ok('Tools: → moves to the next word', await page.evaluate(() => window.__bz.S.run.i === 1));
    await page.click('[data-act=voc-check]'); await page.waitForTimeout(200);
    const VQ = () => page.evaluate(() => { const r = window.__bz.S.run; return { qi: r.qi, answer: r.items[r.qi]?.answer, word: r.items[r.qi]?.word, n: r.items.length }; });
    let q = await VQ();
    ok(`Tools: the check asks one question per word in the set (${q.n})`, q.n === 10 || q.n === 20 || q.n === 50);
    await page.click(`.tl-q [data-act=tl-ans][data-arg="${q.answer}"]`); await page.waitForTimeout(250);
    ok('Tools: a vocabulary answer by touch is right, and says so', !!(await page.$('.tl-q .feedback.ok')));
    ok('Tools: …and the word goes into the word bank', await page.evaluate((w) => !!window.__bz.S.h.kids[0].bank[w], q.word));
    await page.waitForTimeout(1000); q = await VQ(); ok('Tools: a right answer advances by itself', q.qi === 1);
    await page.keyboard.press(String(q.answer + 1)); await page.waitForTimeout(250);
    ok('Tools: a vocabulary answer by key 1–4', !!(await page.$('.tl-q .feedback.ok')));
    await page.waitForTimeout(1000); q = await VQ();
    await page.keyboard.press(String(((q.answer + 1) % 4) + 1)); await page.waitForTimeout(250);
    ok('Tools: a wrong answer holds and names the meaning', !!(await page.$('.tl-q [data-act=tl-next]')) && /means:/.test(await page.textContent('.tl-q .feedback')));
    await page.waitForTimeout(1200); ok('Tools: …and still holds a second later', (await VQ()).qi === q.qi);
    await page.keyboard.press('Enter'); await page.waitForTimeout(250); ok('Tools: Enter goes on after a wrong answer', (await VQ()).qi === q.qi + 1);
    /* Idioms: browse with search, an origin story labelled with Bee's confidence, and the quiz */
    await go(page, '#/tools/idioms'); await page.waitForTimeout(300);
    ok('Tools: Idioms shows cards with meaning, example and a labelled origin awaiting a reviewer', (await page.$$('.tl-idiom')).length === 24 && /awaiting a named reviewer/.test(await page.textContent('.tl-idiom')) && !!(await page.$('.tl-idiom .tl-oc')));
    await page.fill('#idq', 'midas'); await page.waitForTimeout(250);
    ok('Tools: searching finds a saying and links it to its Library story', /midas touch/i.test(await page.textContent('.tl-results')) && !!(await page.$('.tl-results a[href="#/story/wonderbook-midas"]')));
    await go(page, '#/tools/idioms/quiz'); await page.waitForTimeout(300);
    const IQ = () => page.evaluate(() => { const r = window.__bz.S.run; return { qi: r.qi, answer: r.items[r.qi]?.answer }; });
    let iq = await IQ(); await page.click(`.tl-q [data-act=tl-ans][data-arg="${iq.answer}"]`); await page.waitForTimeout(250);
    ok('Tools: an idiom quiz question answered by touch', !!(await page.$('.tl-q .feedback.ok')));
    await page.waitForTimeout(1000); iq = await IQ(); await page.keyboard.press(String(iq.answer + 1)); await page.waitForTimeout(250);
    ok('Tools: …and by key', !!(await page.$('.tl-q .feedback.ok')) && iq.qi === 1);
    await go(page, '#/tools/idioms/deck'); await page.click('a.tl-deck'); await page.waitForTimeout(300); await page.keyboard.press('Space'); await page.waitForTimeout(150);
    ok('Tools: an idiom deck card turns to its meaning and story', /awaiting a named reviewer/.test(await page.textContent('.tl-flip')));
    /* Typing: a lesson typed by keyboard, scored, kept, paid once */
    await go(page, '#/tools/typing/home1'); await page.waitForTimeout(300);
    const seq = await page.evaluate(() => window.__bz.S.run.ty.seq);
    await page.keyboard.type(seq, { delay: 15 }); await page.waitForTimeout(400);
    const ty = await page.evaluate(() => { const r = window.__bz.S.run.ty, t = window.__bz.S.h.kids[0].games.typing; return { done: r.done, wpm: r.wpm, acc: r.acc, best: t.lessons.home1, paid: !!t.paid.home1 }; });
    ok(`Tools: a typing lesson typed by keyboard finishes at 100% (${JSON.stringify(ty)})`, ty.done && ty.acc === 100 && ty.wpm > 0 && ty.best === 100 && ty.paid);
    ok('Tools: the result shows words a minute and accuracy', /words a minute/.test(await page.textContent('main')) && /accuracy/.test(await page.textContent('main')));
    await go(page, '#/tools/typing/test'); await page.waitForTimeout(300); await page.click('[data-act=ty-tap] >> nth=0'); await page.waitForTimeout(400);
    ok('Tools: the sixty-second test starts its clock on the first key (tapped on screen)', await page.evaluate(() => window.__bz.S.run.ty.startT > 0 && window.__bz.S.run.ty.typed === 1));
    /* Quotes & Poems: held lines, by author, linked; learn a poem by heart on the Stage; Bee's quotations */
    await go(page, '#/tools/quotes'); await page.waitForTimeout(300);
    ok('Tools: Quotes & Poems shows held lines with their book', (await page.$$('.tl-quote')).length >= 300 && !!(await page.$('.tl-quote a[href^="#/book/"]')));
    const learn = await page.$('.tl-quote a[href^="#/stage/sp2-recite/"]');
    ok('Tools: a line from a poem offers “Learn it by heart”', !!learn);
    if (learn) { const h = await learn.getAttribute('href'); await learn.click(); await page.waitForTimeout(500);
      ok('Tools: …which opens the Stage’s fading recitation on that poem', await page.evaluate((pid) => window.__bz.S.run?.mode === 'speak' && window.__bz.S.run.pid === pid, h.split('/').pop()) && await page.evaluate(() => window.__tracks.every((t) => t.readyState === 'ended'))); }
    await go(page, '#/tools/quotes/voices'); await page.waitForTimeout(500);
    ok('Tools: the quotations shelf shows Bee’s lines with their attribution', (await page.$$('.tl-quote figcaption')).length === 24);
    const P = await ctxFor({ phone: true }); await makeKid(P.page, 'Tara', '8–10');
    for (const h of ['#/tools', '#/tools/vocab/medium', '#/tools/idioms', '#/tools/typing/caps', '#/tools/quotes']) {
      await go(P.page, h); await P.page.waitForTimeout(300);
      const w = await P.page.evaluate(() => document.documentElement.scrollWidth), f = await checkPageHead(P.page, { phone: true });
      ok(`Tools (phone): ${h} fits (${w}px) and its head matches Bee`, w <= 390 && f.length === 0, f.join('; '));
    }
    { const wallet = () => P.page.evaluate(() => (JSON.parse(localStorage.getItem('bizzing.wallet') || '{}').kids?.tara?.coins) || 0);
      await go(P.page, '#/tools/vocab/easy'); await P.page.tap('[data-act=voc-check]'); await P.page.waitForTimeout(200); const c0 = await wallet();
      const a = await P.page.evaluate(() => window.__bz.S.run.items[0].answer); await P.page.tap(`.tl-q [data-act=tl-ans][data-arg="${a}"]`); await P.page.waitForTimeout(300);
      ok('Tools (phone): a right vocabulary answer by tap pays one coin into the family wallet', (await wallet()) === c0 + 1); }
    await go(P.page, '#/tools/typing/caps'); await P.page.tap('[data-act=ty-shift]'); await P.page.tap('[data-act=ty-tap][data-arg="f"]'); await P.page.waitForTimeout(150);
    ok('Tools (phone): the on-screen keyboard types a capital with Shift', await P.page.evaluate(() => { const t = window.__bz.S.run.ty; return t.typed === 1 && t.errors === 0; }));
    ok('Tools (phone): no page errors, nothing asked of anyone else', P.page.errs.length === 0 && P.page.reqs.every((u) => ALLOWED(u) || u.startsWith(BEE_AUDIO)), P.page.errs.slice(0, 2).join(' | '));
    await P.ctx.close();
  }
  ok('PRIVACY: nothing was posted anywhere', posts.length === 0, posts.join(' '));
  ok('PRIVACY: nothing typed left the device in any request', page.reqs.every((u) => !/Zebrafish|violet/i.test(decodeURIComponent(u))) && bodies.every((b) => !/Zebrafish/.test(b)));
  ok('PRIVACY: no request left the site but Bee’s word clips', page.reqs.every((u) => ALLOWED(u) || u.startsWith(BEE_AUDIO)));
  ok('no page errors in the writing and speaking run', page.errs.length === 0, page.errs.slice(0, 3).join(' | '));
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
  /* the reviewer's list, each held by a check */
  await go(page, '#/shop/avatars');
  ok('the demo shop’s coin history matches its balance and names what each coin was for', await page.evaluate(() => document.querySelectorAll('.ledger li').length > 0 && /—/.test(document.querySelector('.ledger li').textContent)));
  await go(page, '#/home');
  ok('the greeting never doubles a question mark', !/\?”?\?/.test(await page.textContent('.bz-greet')));
  ok('a passed daily goal never reads “76 / 10”', await page.evaluate(() => [...document.querySelectorAll('.rings li')].every((li) => { const m = li.textContent.match(/(\d+) \/ (\d+)/); return !m || +m[1] <= +m[2]; })));
  ok('the idle butterfly is drawn, not two dots', await page.evaluate(() => { const b = document.querySelector('.i-butterfly b'); return !b || getComputedStyle(b).backgroundImage.includes('svg'); }));
  await go(page, '#/atlas/word');
  ok('Atlas stars are drawn shapes, never ★ glyphs', !/[★☆]/.test(await page.textContent('main')) && (await page.$$('.starmark, .starrow svg')).length > 0);
  await go(page, '#/search/rab');
  ok('search word chips are separate words', await page.evaluate(() => !document.querySelector('main').innerText.includes('rabbitrabbits')));
  await go(page, '#/me'); ok('My page lists the certificates earned', (await page.$$('.cert')).length > 0);
  await go(page, '#/certificate/word-1'); ok('a certificate is drawn with the child’s name and the level', /Kavya/.test(await page.textContent('.certview')) && /Word level 1/.test(await page.textContent('.certview')));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('[data-act=cert-save]')]);
  ok('Save as a picture gives the family a PNG, made on the device', !!dl && /\.png$/.test(dl.suggestedFilename()));
  for (const h of ['#/desk/wr7-persuade', '#/stage/contest']) { await go(page, h);
    ok(`no icon in running text is larger than its text (${h})`, await page.evaluate(() => [...document.querySelectorAll('main .note svg, main p svg')].every((x) => x.getBoundingClientRect().width <= 32))); }
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
