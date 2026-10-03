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
  for (const [h, kind] of [['#/atlas', 'root'], ['#/library', 'root'], ['#/library/books', 'deep'], ['#/whole/alice', 'deep'], ['#/story/aesop-town-mouse/do', 'deep'], ['#/atlas/word', 'deep'], ['#/stage', 'root'], ['#/play', 'root'], ['#/shop', 'deep']]) {
    await go(page, h); const f = await checkPageHead(page, { phone });
    ok(`${tag}: ${h} page head matches Bee`, f.length === 0, f.join('; '));
    ok(`${tag}: ${h} is a ${kind} head`, (await page.$eval('[data-bz=pagehead]', (e) => e.dataset.bzKind)) === kind);
  }
  /* no sideways scroll, measured against the width we set */
  for (const h of ['#/home', '#/atlas', '#/atlas/sentence', '#/library', '#/library/books', '#/library/words', '#/book/jungle', '#/story/aesop-town-mouse', '#/story/aesop-town-mouse/do', '#/whole/alice', '#/whole/alice/1', '#/whole/wind', '#/whole/wind/7', '#/stage', '#/stage/aloud', '#/play', '#/play/rush', '#/me', '#/medals', '#/collection', '#/shop/worlds', '#/practice', '#/grownups', '#/privacy', '#/help', '#/stop/s5-comma', '#/desk/wr7-persuade', '#/stage/sp2-recite', '#/stage/sp6-minute', '#/stage/sp4-story', '#/stage/contest', '#/shop/extras', '#/play/figure', '#/stop/la7-devices', '#/stop/li5-simile', '#/desk/li10-case']) {
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

  /* games, both ways */
  await go(page, '#/play/builder'); await page.click('[data-act=game-start]');
  const play = async (how) => { const t = await page.evaluate(() => window.__bz.S.run.g.cur.tiles.map((x) => x.k)); for (const k of ['sub', 'dep', 'main']) { const i = t.indexOf(k); if (how === 'keys') await page.keyboard.press(String(i + 1)); else await page.click(`[data-act=b-pick][data-arg="${i}"]`); } await page.waitForTimeout(120); };
  await play('touch'); await play('keys');
  ok('Sentence Builder plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.built === 2));
  await go(page, '#/play/figure'); await page.click('[data-act=game-start]');
  const figAns = () => page.evaluate(() => window.__bz.S.run.g.rounds[window.__bz.S.run.g.i].answer);
  await page.click(`[data-act=fig-pick][data-arg="${await figAns()}"]`); await page.waitForTimeout(1300);
  await page.keyboard.press(String((await figAns()) + 1)); await page.waitForTimeout(200);
  ok('Figure Hunt plays by touch and by keys', await page.evaluate(() => window.__bz.S.run.g.score === 2));
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
