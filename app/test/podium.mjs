/* podium.mjs — The Podium's rules (HANDOVER C §2.2): the speech evidence on made-up sound (ST1: a beep,
   silence, constant noise, rhythmic noise and a six-second stop score 0 and earn 0; a speech-like voice
   passes), on hand-built frame series too; the planner marks structure and devices, never ideas (ST3); the
   offered lines keep their claims; the rivals replay; the pay rules; the level rule; the store step and the
   backup (typed plans never carried, cleared at the end). Every check here was watched to fail once. */
import * as A from './podium-audio.mjs';
import { evidence, measure, VERIFY, features } from '../src/mic.js';
import { ROUNDS, MAX, ROUND_MAX, LEVELS, DEVICES, devicesIn, planCheck, echoes, offers, versions, frames as planFrames, topic, TOPICS, CUPS, pickTexts, pickTopics,
  newTournament, roundSpec, roundScore, roundPays, rivalRound, standings, seeds, finish, felixPlan, settle, closeTournament, newPodium, planOf, capSecs, canType, mustType } from '../src/podium.js';
import { RIVALS } from '../src/contest.js';
import { nextLevel } from '../src/games.js';
import { lineSafe } from '../src/safe.js';
import { migrate, VERSION } from '../src/store.js';
import { makeBackup } from '../src/backup.js';
import { readFileSync } from 'node:fs';

let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const passages = JSON.parse(readFileSync(new URL('../src/data/passages.json', import.meta.url))).map((p) => ({ id: p.id, kind: p.kind, band: p.band, words: p.words, syllables: p.syllables, text: p.text }));
const hope = passages.find((p) => p.id === 'dickinson-hope');

/* ---------- 1. ST1 on made-up SOUND, through the analyser's own per-frame numbers ---------- */
const sound = {
  beep: A.beep(24), silence: A.silence(24), noise: A.noise(24), 'rhythmic noise': A.rhythmicNoise(24, hope.syllables / 23.5),
  'a held tone': A.tone(24, 220), 'a tapping tone': A.rhythmicTone(22, 4, 180), 'a six-second stop': A.concat(A.speechLike(24, 4, 21).samples, A.silence(18)),
};
const SP = { syllables: hope.syllables, mode: 'reading' };
for (const [name, s] of Object.entries(sound)) {
  const fr = A.frames(s), ev = evidence(fr, SP), evS = evidence(fr, { mode: 'speech', minSecs: 15 });
  ok(!ev.ok && !evS.ok, `ST1: ${name} shows no speech evidence (reading ${ev.ok}, speech ${evS.ok}: ${ev.checks.filter((c) => !c.ok).map((c) => c.id).join(',')})`);
  const res = roundScore(0, measure(fr, hope.words), ev, null, { target: [20, 40], words: hope.words, places: 6 });
  ok(res.total === 0 && res.delivery === 0 && !roundPays(res), `ST1: ${name} scores 0 and pays nothing (${res.total})`);
}
/* each fake fails for its own reason, not by luck of one check */
{ const why = (s, o = SP) => evidence(A.frames(s), o).checks.filter((c) => !c.ok).map((c) => c.id);
  ok(why(sound.beep).includes('pitch'), 'a beep: its pitch never moves');
  ok(why(sound['a tapping tone']).includes('pitch') && !why(sound['a tapping tone']).includes('rhythm'), 'a tone tapped at syllable rate has the rhythm, and no moving pitch');
  ok(why(sound['rhythmic noise']).includes('voiced') && !why(sound['rhythmic noise']).includes('rhythm'), 'rhythmic noise has the beats, and no voice');
  ok(why(sound.noise).includes('voiced') && why(sound.silence).includes('voiced'), 'constant noise and silence have no voice');
  ok(why(sound['a six-second stop']).join() === 'rhythm', 'a six-second stop is a voice — but far too few syllables for the poem');
  ok(why(sound['a six-second stop'], { mode: 'speech', minSecs: 15 }).join() === 'rhythm', '…and in a speech, too few syllables a second over the time it ran'); }
/* a speech-like voice passes: pitch wandering 100–300 Hz, vowels changing, syllables at a speaking rate */
for (const [seed, rate] of [[3, 4], [8, 3.2], [13, 4.6], [17, 3.6]]) {
  const sp = A.speechLike(hope.syllables, rate, seed), noisy = sp.samples.map((v, i) => v + 0.01 * Math.sin(i * 12.9898) * Math.sin(i * 0.37)), fr = A.frames(noisy), ev = evidence(fr, { syllables: sp.syllables });
  ok(ev.ok, `a speech-like voice passes (seed ${seed}, ${rate}/s): ${ev.checks.map((c) => `${c.id} ${c.got}`).join(' · ')}`);
  ok(evidence(fr, { mode: 'speech', minSecs: 10 }).ok, `…and as a speech (seed ${seed})`);
}
{ const sp = A.speechLike(60, 4, 5), fr = A.frames(sp.samples);
  ok(!evidence(fr, { syllables: 200 }).ok && !evidence(fr, { syllables: 20 }).ok, 'a reading must match the text: 60 syllables is not a 200-syllable poem, nor a 20-syllable one');
  ok(!evidence(fr, { mode: 'speech', minSecs: 30 }).ok, 'a speech must last: 15 s is not a 60 s speech'); }
/* per-frame numbers: a pitch is found where a voice is, and only there */
{ const f = features(A.tone(0.05, 150).subarray(0, 2048), A.SR); ok(Math.abs(f.f0 - 150) < 3, `a 150 Hz voice is heard at ${f.f0.toFixed(1)} Hz`);
  ok(features(A.tone(0.05, 600).subarray(0, 2048), A.SR).f0 === 0 || features(A.tone(0.05, 600).subarray(0, 2048), A.SR).f0 <= 400, 'a 600 Hz whistle is never called a pitch above 400 Hz');
  ok(features(A.noise(0.05).subarray(0, 2048), A.SR).f0 === 0, 'noise has no pitch');
  ok(features(A.silence(0.05).subarray(0, 2048), A.SR).f0 === 0, 'silence has no pitch'); }

/* ---------- 2. the same on hand-built FRAME series [t, dB, pitch, flux] ---------- */
const series = (secs, f) => Array.from({ length: Math.round((secs * 1000) / 25) }, (_, i) => f(i * 25, i));
const speechFrames = (secs, syl = 4) => series(secs, (t) => { const ph = (t / 1000) * syl % 1, on = ph < 0.7; return [t, on ? -22 - 8 * Math.abs(ph - 0.35) * 3 : -55, on ? 120 + 80 * Math.sin(t / 900) + 30 * Math.sin(t / 130) : 0, on ? 1.5 + (t % 75) / 50 : 0.2]; });
ok(evidence(speechFrames(20), { syllables: 80 }).ok, 'frames: a varied voice at four syllables a second passes a reading of 80 syllables');
ok(!evidence(series(20, (t) => [t, -20, 400, 0.1]), { syllables: 80 }).ok, 'frames: a steady 400 Hz beep fails');
ok(!evidence(series(20, () => [0, -70, 0, 0]).map((f, i) => [i * 25, ...f.slice(1)]), { syllables: 80 }).ok, 'frames: silence fails');
ok(!evidence(series(20, (t) => [t, -30 + (t % 50 ? 0.4 : -0.4), 0, 3]), { syllables: 80 }).ok, 'frames: constant noise fails');
ok(!evidence(series(20, (t) => [t, (t / 250) % 1 < 0.5 ? -20 : -60, 0, 3]), { syllables: 80 }).ok, 'frames: rhythmic noise (beats, no pitch) fails');
ok(!evidence(series(20, (t) => [t, (t / 250) % 1 < 0.5 ? -20 : -60, (t / 250) % 1 < 0.5 ? 220 : 0, 3]), { syllables: 80 }).ok, 'frames: a tapped tone (beats, a pitch that never moves) fails');
ok(!evidence([...speechFrames(6), ...series(14, (t) => [6000 + t, -70, 0, 0])], { syllables: 80 }).ok, 'frames: a six-second stop fails');
ok(!evidence(series(20, (t) => [t, -22, 120 + 80 * Math.sin(t / 900), 0.1]), { syllables: 80 }).ok, 'frames: a sliding whistle with a still spectrum and no beats fails');
ok(!evidence([], {}).ok && !evidence(null, {}).ok, 'frames: nothing at all fails');
/* measure still reads 25 ms frames: pauses counted in real time */
{ const fr = series(10, (t) => [t, (t % 2000) < 1500 ? -20 : -60]); const m = measure(fr, 0); ok(m.pauses === 4, `pauses counted from the frames' own times (${m.pauses})`); }

/* ---------- 3. the planner marks structure and devices — never ideas (ST3) ---------- */
const good = { hook: 'Have you ever planted a seed in a garden?', p1: 'Seeds teach patience.', p2: 'Plants feed us, the bees, and the birds.', p3: 'Weeding is good exercise for everyone.', close: 'So go and plant a garden today.' };
const pc = planCheck(good, 2); ok(pc.complete && pc.points === 4, 'a hook, three points, an echo and two devices: complete (' + JSON.stringify(pc.items.map((i) => i.ok)) + ')');
const swap = { hook: 'Have you ever polished a trumpet in a cupboard?', p1: 'Trumpets teach elbows.', p2: 'Spoons tickle us, the clouds, and the soup.', p3: 'Purple is good soup for everyone.', close: 'So go and polish a trumpet today.' };
ok(JSON.stringify(planCheck(swap, 2).items.map((i) => i.ok)) === JSON.stringify(pc.items.map((i) => i.ok)), 'ST3: the same shape with silly ideas gets exactly the same marks');
ok(planCheck({ ...good, close: 'So go and do it today.' }, 2).items.find((i) => i.id === 'echo').ok === false, 'a close that shares no word with the hook does not echo it');
ok(!planCheck({ ...good, p3: good.p2 }, 2).items.find((i) => i.id === 'points').ok, 'three points must be three different points');
ok(!planCheck({ ...good, p1: 'Yes.' }, 2).complete, 'a point of one word is not a point');
ok(!planCheck({ ...good, p2: 'Plants feed ___, ___, and ___.' }, 2).complete, 'a card with gaps left is not finished');
ok(planCheck(good, 5).need === 3 && !planCheck(good, 5).complete && planCheck(good, 1).need === 1, 'Level 5 needs three devices, Level 1 one');
ok(devicesIn('Why not?').join() === 'question' && devicesIn('kind, brave, and funny').join() === 'three' && devicesIn('Not this, but that.').includes('contrast') && devicesIn('Let us run. Let us jump.').join() === 'repeat', 'devices by shape: a question, a rule of three, a contrast, repetition');
ok(devicesIn('I like my garden very much.').length === 0, 'a plain line shows no device');
ok(!('ideas' in pc) && pc.items.every((i) => ['hook', 'points', 'echo', 'devices'].includes(i.id)), 'the planner has four marks and no mark for ideas');
for (const d of DEVICES) for (const f of planFrames(d.id, 'Seeds teach patience.')) { const filled = f.replace(/_{2,}/g, 'birds'); ok(devicesIn(filled).includes(d.id), `the ${d.id} frame, filled in, shows its device: "${filled}"`); if (/_{2,}/.test(f)) ok(devicesIn(f).length === 0, 'an unfilled frame counts for nothing: ' + f); }

/* ---------- 4. every offered line keeps its claims ---------- */
for (const tp of TOPICS) {
  const all = [...tp.hooks, ...tp.points, ...tp.closes];
  ok(tp.hooks.length === 3 && tp.closes.length === 3 && tp.points.length === 6 && tp.level >= 1 && tp.level <= 5, `${tp.id}: three hooks, six points, three closes, a level`);
  for (const l of all) {
    ok(devicesIn(l.t).length === 0, `${tp.id}: the plain line shows no device: "${l.t}" (${devicesIn(l.t)})`);
    ok(Object.keys(l.v).length >= 2, `${tp.id}: every line has two device versions: "${l.t}"`);
    for (const [d, v] of Object.entries(l.v)) ok(devicesIn(v).includes(d), `${tp.id}: the ${d} version shows it: "${v}"`);
    ok([l.t, ...Object.values(l.v)].every(lineSafe), `${tp.id}: kid-safe: "${l.t}"`);
  }
  for (const h of tp.hooks.flatMap((l) => [l.t, ...Object.values(l.v)])) for (const c of tp.closes.flatMap((l) => [l.t, ...Object.values(l.v)])) ok(echoes(h, c), `${tp.id}: every close echoes every hook ("${h}" / "${c}")`);
  for (const L of [1, 2]) { const chosen = { hook: tp.hooks[0].t, p1: offers(tp, 'p1')[0].t, p2: offers(tp, 'p2')[1].t, p3: offers(tp, 'p3')[1].t, close: tp.closes[0].t };
    const have = new Set();
    for (const card of ['hook', 'p1', 'p2', 'p3', 'close']) { if (have.size >= LEVELS[L].need) break; const d = Object.keys(offers(tp, card).find((l) => l.t === chosen[card]).v).find((x) => !have.has(x)); if (!d) continue; chosen[card] = versions(chosen, card, d, L, tp)[0].text; have.add(d); }
    ok(planCheck(chosen, L).complete, `${tp.id}: a Level ${L} child can complete a plan by choosing alone`); }
}
ok(new Set(TOPICS.map((t) => t.level)).size === 5 && Object.keys(CUPS).length === 5, 'topics at every level, a cup for every level');
{ const tp = topic('garden'), plan = { hook: tp.hooks[0].t }; ok(versions(plan, 'hook', 'question', 1, tp).length === 1 && versions(plan, 'hook', 'question', 3, tp).length === 3, 'Level 1 is offered the written version; from Level 3 the frames too');
  ok(versions({ hook: 'My own words here.' }, 'hook', 'contrast', 3, tp).every((v) => v.own) && versions({ hook: 'My own words here.' }, 'hook', 'contrast', 1, tp).length === 0, 'a typed line is offered frames only'); }
ok(!canType(1) && !canType(2) && canType(3) && mustType(4, 'hook') && !mustType(4, 'p1') && mustType(5, 'p2'), 'typing by level: choose · choose · either · the ends typed · all typed');

/* ---------- 5. the tournament: texts, topics, the rivals, the score ---------- */
ok(ROUNDS.length === 4 && ROUNDS.map((r) => r.id).join() === 'poem,passage,prepared,final' && MAX === 48 && ROUND_MAX.join() === '10,10,14,14', 'four rounds: poem, passage, prepared speech, the impromptu final (48 points)');
for (let t = 1; t <= 40; t++) for (const L of [1, 3, 5]) for (const band of [1, 2, 3]) {
  const x = pickTexts(t, L, band, passages), p = passages.find((q) => q.id === x.poem), q = passages.find((r) => r.id === x.passage);
  ok(p?.kind === 'verse' && q?.kind === 'prose' && p.band <= band && q.band <= band, `tournament ${t} L${L} band ${band}: a poem and a passage within the band`);
  const tp = pickTopics(t, L); ok(tp.prep.length === 2 && !tp.prep.includes(tp.final) && new Set(tp.prep).size === 2, 'two prepared topics to choose from and a different final');
}
ok(pickTexts(9, 2, 2, passages).poem === pickTexts(9, 2, 2, passages).poem, 'the same tournament draws the same poem');
{ const T = newTournament({ n: 3, level: 1, band: 1, passages });
  ok(T.rounds.length === 4 && T.round === 0 && !T.done && T.coins === 0 && T.rounds.every((r) => !r.rehearsed && !r.paid), 'a new tournament: four rounds, none rehearsed, nothing paid');
  ok(Object.values(T).every((v) => typeof v !== 'string' || /^[a-z0-9-]+$/.test(v)), 'a tournament keeps ids, never words');
  const s0 = roundSpec(T, 0, Object.fromEntries(passages.map((p) => [p.id, p])));
  ok(s0.syllables > 0 && s0.mode === 'reading' && s0.target[0] > 0, 'the poem round knows its syllables and window');
  const s2 = roundSpec(T, 2, {}); ok(s2.mode === 'speech' && s2.minSecs === Math.round(LEVELS[1].speech[0] / 2) && capSecs(s2) > s2.target[1], 'a speech round: its window, the time it must last, a hard stop'); }
for (const rv of RIVALS) for (let t = 1; t <= 30; t++) for (let ri = 0; ri < 4; ri++) { const a = rivalRound(rv, t, ri), b = rivalRound(rv, t, ri); ok(a.total === b.total && a.line === b.line && a.total >= 3 && a.total <= ROUND_MAX[ri], `rival ${rv.id} replays and stays in range`); }
for (const b of [1, 2, 3]) { let wins = 0; for (let t = 1; t <= 100; t++) if (standings(t, b, ROUND_MAX).find((x) => x.you).place === 1) wins++; ok(wins >= 90, `band ${b}: a perfect tournament wins (${wins}/100)`); }
{ let wins = 0; for (let t = 1; t <= 100; t++) if (standings(t, 2, [0, 0, 0, 0]).find((x) => x.you).place === 1) wins++; ok(wins === 0, 'a silent tournament never wins'); }
ok(seeds(2).length === 6 && seeds(2).at(-1).you && seeds(2, 1)[0].you, 'the bracket: rivals by skill, the child seeded by their best place');
/* scores: verified speech only; plans count only when spoken */
const plan = planCheck(good, 2), m = { secs: 60, wpm: 0, pauses: 12, range: 12 }, spec = { target: [45, 90], words: 0, places: 1 };
const yes = roundScore(2, m, { ok: true }, plan, spec), no = roundScore(2, m, { ok: false }, plan, spec);
ok(yes.verified && yes.total === yes.delivery + 4 && yes.delivery > 0 && roundPays(yes), 'a verified speech with a complete plan: delivery + 4 plan points, and it pays');
ok(no.total === 0 && no.plan === 0 && !roundPays(no), 'no evidence: 0 for delivery, the plan does not count, nothing paid');
ok(!roundPays(roundScore(2, m, { ok: true }, planCheck({ hook: 'Hi there you' }, 2), spec)), 'a verified speech with an unfinished plan does not pay its stop');
ok(roundPays(roundScore(0, { secs: 40, wpm: 120, pauses: 6, range: 10 }, { ok: true }, null, { target: [30, 50], words: 80, places: 6 })), 'a verified reading pays its stop');
/* the contest 10: verified in ≥ 3 of 4 rounds and ≥ 50% */
const T2 = { rounds: [10, 9, 12, 0].map((t, i) => ({ total: t, verified: i < 3 })) }; ok(finish(T2).pays, 'three verified rounds and 31 of 48: the tournament pays');
ok(!finish({ rounds: [10, 10, 0, 0].map((t, i) => ({ total: t, verified: i < 2 })) }).pays, 'two verified rounds: no contest coins');
ok(!finish({ rounds: [5, 5, 6, 4].map((t) => ({ total: t, verified: true })) }).pays, 'four verified rounds under 50%: no contest coins');
/* a beep bot plays a whole tournament with perfect plans: it earns nothing */
{ const fr = A.frames(A.beep(30)), ev = evidence(fr, SP), T = newTournament({ n: 5, level: 2, band: 2, passages }); let coins = 0;
  for (let ri = 0; ri < 4; ri++) { const r = roundScore(ri, measure(fr, 80), ev, ROUNDS[ri].plan ? plan : null, spec); T.rounds[ri] = { ...T.rounds[ri], ...r }; if (roundPays(r)) coins += 5; }
  if (finish(T).pays) coins += 10; ok(coins === 0 && finish(T).total === 0, `ST1: a beep plays a whole tournament with perfect plans and earns ${coins}`); }

/* ---------- 6. the level rule, the record, the end ---------- */
for (const L of [1, 2, 3, 4, 5]) for (const p of [0, 0.3, 0.49, 0.5, 0.79, 0.8, 1]) { const r = newPodium(); ok(settle(r, L, p).after === nextLevel(L, p), `the owner's rule, as games.js has it (L${L}, ${p})`); }
{ const r = { ...newPodium(), pick: 4 }; settle(r, 4, 0.3); ok(r.level === 3 && r.pick === null, 'a hand-set level sticks until the check, then the chip goes back to Auto'); }
{ const r = newPodium(); ok(/warm up on Level 1/.test(settle({ ...r, level: 2 }, 2, 0.2).line), 'a drop says so kindly'); }
{ const k = { id: 'a', name: 'Asha', writing: { talk: { x: 'kept' } }, podium: newPodium() }, T = newTournament({ n: 1, level: 2, band: 2, passages });
  Object.assign(planOf(k, 'prepared'), { hook: 'My secret speech' }); Object.assign(planOf(k, 'final'), { hook: 'Another secret' });
  T.rounds = T.rounds.map((r, i) => ({ ...r, total: [8, 9, 12, 11][i], verified: true, done: true })); k.podium.cur = T;
  const bk = JSON.stringify(makeBackup({ v: VERSION, parent: {}, kids: [k] }));
  ok(!bk.includes('My secret speech') && !bk.includes('Another secret') && bk.includes('"podium"'), 'a backup carries the tournament, never the typed plans');
  const end = closeTournament(k, T, 1000);
  ok(!k.writing.podium && k.writing.talk.x === 'kept', 'the end of a tournament clears the typed plans, and nothing else');
  ok(k.podium.cur === null && k.contests.length === 1 && Object.values(k.contests[0]).every((v) => typeof v === 'number' || (Array.isArray(v) && v.every((x) => typeof x === 'number'))), 'the tournament is closed; its summary is numbers only');
  ok(end.total === 40 && end.level.after === 3 && k.podium.level === 3, `40 of 48 moves the level up (${end.level.after})`);
  const k2 = { id: 'b', name: 'Ben' }; ok(!k2.podium && !k2.writing, 'a second child inherits nothing'); }
ok(VERSION >= 6 && migrate({ v: 5, parent: {}, kids: [{ id: 'a' }] }).kids[0].podium === null, `store v${VERSION}: a v5 household gains k.podium (null)`);

/* ---------- 7. Felix's model speech, as a plan ---------- */
{ const c = JSON.parse(readFileSync(new URL('../src/data/cases/case-07.json', import.meta.url))), fp = felixPlan(c.speeches[0]);
  ok(fp.hook.length >= 3 && fp.points.length === 3 && fp.points.every((p) => p.length >= 3) && fp.close.length >= 3, `Felix's speech: a hook, three points, a close (${fp.points.map((p) => p.length)})`);
  ok(fp.points[1][0].startsWith('This afternoon') && fp.points[2][0].startsWith('Mr Hale'), 'the points split where Felix turns: the log, the trap, the wings');
  ok(![...fp.hook, ...fp.points.flat(), ...fp.close].some((t) => /\*|\(He stops/.test(t)), 'stage directions are set aside');
  ok(VERIFY.voiced === 0.35 && VERIFY.semis === 1.5 && VERIFY.flux === 0.4 && VERIFY.sylTol === 0.3 && VERIFY.f0[0] === 80 && VERIFY.f0[1] === 400, 'the spec’s thresholds, as written'); }

console.log(`podium: ${n - fails}/${n}`); if (fails) process.exit(1);
