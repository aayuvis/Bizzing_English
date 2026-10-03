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

{
  const { ctx, page } = await ctxFor();
  await makeKid(page, 'Ravi', '6–7');
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
  ok('the level, the stars and the memory are kept per game', await KID().then((g) => g.duel.level >= 1 && g.duel.stars?.[1] >= 1 && g.duel.rounds === 2 && Object.keys(g.duel.seen).length >= 5 && g.duel.plays === 1));
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

  ok('no page errors', !page.errs.length, page.errs.join('; '));
}
await browser.close(); srv.kill();
console.log(`ui-games: ${n - fail}/${n}`); if (fail) process.exit(1);
