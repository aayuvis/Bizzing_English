/* podium.js — THE PODIUM, the speaking flagship (HANDOVER C §2.2): the Elocution Contest grown into a
   tournament. Pure rules here (test/podium.mjs); the screens are views/podium.js; the microphone is mic.js.

   A TOURNAMENT (§2.2.1) is four rounds against five of Bizzing Bee's rivals (contest.js RIVALS, field):
     1 The Poem — read aloud          2 The Passage — read aloud
     3 The Prepared Speech — plan in the green room, rehearse once, deliver (1–2 minutes)
     4 The Final: Impromptu — a topic card, 60 s to plan, 60 s to speak
   It is saved between rounds (k.podium.cur, numbers and ids only), so it can span days; there is no timer
   between rounds.

   HONEST BY CONSTRUCTION
   • Delivery points (contest.js score(): timing, pace, pauses, volume) count ONLY when the round shows
     speech evidence (mic.js evidence(): a voice, a moving pitch, a changing spectrum, a speaking rhythm).
     No evidence, no points — "We couldn't hear the words", never "wrong".
   • The PLANNER marks what can be marked: a hook, three different points, a close that echoes the hook,
     enough devices — by STRUCTURE (planCheck, devicesIn). The ideas are the child's own and never scored:
     the same shape with any words gets the same marks (ST3). Plan points count only in a round delivered
     with speech evidence: a plan never spoken is not a speech.
   • Expression is never marked. The child rates how it felt (three faces) and a grown-up may add their
     view; both are shown as THEIR view.
   • The rivals' points are the app's own — drawn from their Bee traits, seeded by the tournament, and the
     screen says so. Never a real child; nothing leaves the device.
   • Typed plans are free writing: they live in k.writing.podium (no backup carries k.writing) and are
     CLEARED when the tournament ends.

   PAY (§2.2.5, §6): `stop` 5 a round with verified speech (rounds 3–4 also need a complete plan), once a
   round; `contest` 10 for a tournament with verified speech in ≥ 3 of 4 rounds and a total ≥ 50%. Never
   for a sound, a rehearsal, a plan alone or time spent.
   LEVELS 1–5: text length, topic difficulty and the planner's demands (Level 1 chooses lines and needs one
   device; Level 5 types everything and needs three). The owner's rule moves the level on the tournament
   total (hubs.js settleLevel: under 50% down one, 80% up one). */

import { rng } from './rand.js';
import { RIVALS, field, score as deliveryScore, windowFor, breaths } from './contest.js';
import { TOPICS, CUPS, FELIX_SPLIT } from './podium-data.js';
import { VERIFY } from './mic.js';

export { RIVALS, field, TOPICS, CUPS };

export const ROUNDS = [
  { id: 'poem', title: 'The Poem', short: 'Poem', kind: 'reading', verse: true, say: 'Read the poem aloud. Let each line end breathe.' },
  { id: 'passage', title: 'The Passage', short: 'Passage', kind: 'reading', say: 'Read a passage from a classic aloud, at a storyteller’s pace.' },
  { id: 'prepared', title: 'The Prepared Speech', short: 'Speech', kind: 'speech', plan: true, say: 'Plan your speech in the green room, rehearse it once, then deliver it.' },
  { id: 'final', title: 'The Final: Impromptu', short: 'Final', kind: 'speech', plan: true, impromptu: true, say: 'A topic card you have not seen. Sixty seconds to plan, sixty seconds to speak.' },
];
export const PLAN_POINTS = 4;
export const ROUND_MAX = ROUNDS.map((r) => 10 + (r.plan ? PLAN_POINTS : 0));
export const MAX = ROUND_MAX.reduce((a, b) => a + b, 0);       // 48
export const PLAN_SECS = 60;
export const CARDS = [['hook', 'Hook'], ['p1', 'Point 1'], ['p2', 'Point 2'], ['p3', 'Point 3'], ['close', 'Close']];

/* What each level asks. words: [min, max] for the readings; speech/final: the delivery window (s);
   need: devices a complete plan needs; type: 'choose' (offered lines only) · 'either' (choose or type) ·
   'ends' (type the hook and the close) · 'all' (type every card). */
export const LEVELS = {
  1: { poem: [0, 125], prose: [0, 200], speech: [30, 75], final: [25, 60], need: 1, type: 'choose' },
  2: { poem: [0, 125], prose: [0, 240], speech: [45, 90], final: [30, 60], need: 2, type: 'choose' },
  3: { poem: [0, 160], prose: [0, 280], speech: [60, 105], final: [40, 70], need: 2, type: 'either' },
  4: { poem: [80, 200], prose: [150, 340], speech: [60, 120], final: [45, 75], need: 2, type: 'ends' },
  5: { poem: [90, 300], prose: [180, 420], speech: [75, 120], final: [50, 80], need: 3, type: 'all' },
};
export const levelCfg = (L) => LEVELS[Math.max(1, Math.min(5, Math.round(+L || 1)))];
/* can this card be typed / must it be? */
export const canType = (L) => levelCfg(L).type !== 'choose';
export const mustType = (L, card) => { const t = levelCfg(L).type; return t === 'all' || (t === 'ends' && (card === 'hook' || card === 'close')); };

/* ---------- the devices (Writer's Craft) and how the planner sees them: by SHAPE only ---------- */
export const DEVICES = [
  { id: 'question', name: 'A question', craft: 'rhetorical question', how: 'Ask the audience something, and let them think.' },
  { id: 'three', name: 'A rule of three', craft: 'tricolon', how: 'Three things in a row: kind, brave, and funny.' },
  { id: 'repeat', name: 'Repetition', craft: 'anaphora', how: 'Begin (or end) two lines the same way.' },
  { id: 'contrast', name: 'A contrast', craft: 'antithesis', how: 'Set two opposites side by side: not this, but that.' },
];
const COMMON = new Set(['the', 'a', 'an', 'i', 'we', 'you', 'it', 'he', 'she', 'they', 'there', 'this', 'that', 'and', 'but', 'so', 'is', 'my', 'our', 'your', 'his', 'her', 'their', 'in', 'on', 'at', 'to', 'of', 'for', 'if', 'when']);
const STOP = new Set([...COMMON, 'are', 'was', 'were', 'be', 'been', 'am', 'do', 'does', 'did', 'have', 'has', 'had', 'with', 'from', 'by', 'as', 'or', 'not', 'no', 'yes', 'me', 'us', 'them', 'him', 'what', 'who', 'why', 'how', 'all', 'can', 'will', 'would', 'should', 'could', 'just', 'very', 'about', 'more', 'most', 'every', 'one', 'some', 'any', 'into', 'than', 'then', 'thank', 'thanks', 'listening', 'today', 'let', 'lets', 'its', 'also', 'like', 'make', 'think', 'want', 'go']);
const wordsOf = (s) => (String(s || '').toLowerCase().match(/[a-z][a-z’']*/g) || []).map((w) => w.replace(/[’']s?$/, ''));
const clausesOf = (s) => String(s || '').split(/[.!?;,:—–]+/).map((c) => c.trim()).filter(Boolean);
const sentencesOf = (s) => String(s || '').split(/(?<=[.!?;])\s+/).map((c) => c.trim()).filter(Boolean);
const prefix = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };
const kin = (a, b) => a === b || (prefix(a, b) >= 4 && prefix(a, b) >= Math.min(a.length, b.length) - 3);   // swim · swimming, rules · rule, failed · failure
export const blanks = (s) => /_{2,}/.test(String(s || ''));

const TEST = {
  question: (t) => /\?/.test(t),
  three: (t) => sentencesOf(t).some((s) => { const segs = s.split(','); if (segs.length >= 3) return segs.slice(0, 3).every((x) => wordsOf(x).length); return segs.length === 2 && wordsOf(segs[0]).length >= 1 && wordsOf(segs[0]).length <= 2 && /\b(and|or)\b/i.test(segs[1]); }),
  repeat: (t) => {
    const cl = clausesOf(t).map(wordsOf).filter((w) => w.length); if (cl.length < 2) return false;
    const count = (key) => { const m = new Map(); for (const w of cl) { const k = key(w); if (k) m.set(k, (m.get(k) || 0) + 1); } return Math.max(0, ...m.values()); };
    if (count((w) => w.length >= 2 ? w[0] + ' ' + w[1] : '') >= 2) return true;                  // "Let us dig. Let us plant."
    if (count((w) => w[0]) >= 3) return true;                                                       // "They fell. They rose. They went on."
    if (count((w) => (COMMON.has(w[0]) ? '' : w[0])) >= 2) return true;                            // "Open a book. Open your mind."
    const last = cl.map((w) => w.at(-1)).filter((w) => w.length >= 4);
    return last.some((a, i) => last.some((b, j) => i !== j && kin(a, b)));                          // "…a friend. …a friend." (the ends repeat)
  },
  contrast: (t) => /\bnot\b[^.!?]{0,80}\bbut\b|\bbut\b|\bwhile\b|\byet\b|\binstead\b|\brather than\b|\bwhereas\b|\bon the other hand\b/i.test(t),
};
/* the devices a line shows, by shape — never by what it means */
export const devicesIn = (t) => (blanks(t) ? [] : DEVICES.map((d) => d.id).filter((id) => TEST[id](String(t || ''))));

/* ---------- the planner's marks: structure and devices only (ST3) ---------- */
const enough = (s) => !blanks(s) && wordsOf(s).length >= 3;
const content = (s) => wordsOf(s).filter((w) => w.length >= 3 && !STOP.has(w));
export function echoes(hook, close) { const a = content(hook), b = content(close); return a.some((x) => b.some((y) => kin(x, y))); }
export function planCheck(plan = {}, level = 1) {
  const need = levelCfg(level).need, p = [plan.p1, plan.p2, plan.p3], norm = (s) => wordsOf(s).join(' ');
  const devs = [...new Set(CARDS.flatMap(([c]) => devicesIn(plan[c])))];
  const items = [
    { id: 'hook', label: 'A hook to open', ok: enough(plan.hook) },
    { id: 'points', label: 'Three different points', ok: p.every(enough) && new Set(p.map(norm)).size === 3 },
    { id: 'echo', label: 'A close that echoes the hook', ok: enough(plan.close) && enough(plan.hook) && echoes(plan.hook, plan.close) },
    { id: 'devices', label: `${need} device${need > 1 ? 's' : ''} from Writer’s Craft`, ok: devs.length >= need, got: devs.length },
  ];
  return { items, devices: devs, need, points: items.filter((i) => i.ok).length, complete: items.every((i) => i.ok) };
}

/* ---------- the offered lines (choose mode) and the offered versions when a device is dropped ---------- */
export const topic = (id) => TOPICS.find((t) => t.id === id) || null;
/* each Point card offers three of the topic's six points, overlapping, so three different points can always be chosen */
export function offers(tp, card) {
  if (!tp) return [];
  if (card === 'hook') return tp.hooks; if (card === 'close') return tp.closes;
  const i = { p1: 0, p2: 1, p3: 2 }[card] * 2; return [0, 1, 2].map((k) => tp.points[(i + k) % tp.points.length]);
}
const core = (s) => String(s || '').trim().replace(/[.!?]+["”’]?$/, '');
const lc = (s) => (/^I\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const firstTwo = (s) => (String(s || '').match(/^\s*(\S+\s+\S+)/) || [])[1] || 'We can';
/* frames for a line of the child's own: the device's shape, with gaps (___) for them to fill */
export function frames(dev, text) {
  const c = core(text) || '___';
  if (dev === 'question') return [`Have you ever thought about this: ${lc(c)}?`, `Why does it matter that ${lc(c)}?`];
  if (dev === 'three') return [`${c}, ___, and ___.`, `___, ___, and ${lc(c)}.`];
  if (dev === 'repeat') return [`${c}. ${firstTwo(c)} ___.`, `${c}. ${c}. ___.`];
  if (dev === 'contrast') return [`Not ___, but ${lc(c)}.`, `${c}, but ___.`];
  return [];
}
/* the versions offered when `dev` is dropped on a card: the line's own written version (if it has one),
   then — where the child may type — the frames */
export function versions(plan, card, dev, level, tp) {
  const text = plan[card] || '', line = offers(tp, card).find((l) => l.t === text || Object.values(l.v).includes(text));
  const out = [];
  if (line?.v[dev]) out.push({ text: line.v[dev], own: false });
  if (canType(level) && text) for (const f of frames(dev, line ? line.t : text)) out.push({ text: f, own: true });
  return out;
}

/* ---------- a tournament ---------- */
const syllablesOf = (p) => p?.syllables || 0;
/* choose the round's poem and passage: by level (length), within the child's band, seeded by the tournament */
export function pickTexts(n, level, band, passages) {
  const cfg = levelCfg(level), R = rng(`podium:texts:${n}`), fit = (p, [lo, hi]) => p.words >= lo && p.words <= hi;
  const by = (kind, win) => { const all = passages.filter((p) => p.kind === kind && p.band <= band); const ok = all.filter((p) => fit(p, win));
    const pool = ok.length ? ok : all.slice().sort((a, b) => Math.abs(a.words - win[1]) - Math.abs(b.words - win[1])).slice(0, 3); return pool.length ? pool[Math.floor(R() * pool.length)].id : null; };
  return { poem: by('verse', cfg.poem), passage: by('prose', cfg.prose) };
}
/* two prepared-speech topics to choose from, and one Final topic — never the same, nearest the level */
export function pickTopics(n, level) {
  const R = rng(`podium:topics:${n}`), near = (L) => TOPICS.filter((t) => t.level === L);
  let pool = near(level); for (let d = 1; pool.length < 3 && d < 5; d++) pool = [...pool, ...near(level - d), ...near(level + d)];
  const order = pool.map((t) => [R(), t.id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return { prep: order.slice(0, 2), final: order[2] || order[0] };
}
export function newTournament({ n, level, band, passages, now = Date.now() }) {
  const t = pickTexts(n, level, band, passages), tp = pickTopics(n, level);
  return { n, level: Math.max(1, Math.min(5, level)), band, at: now, round: 0, poem: t.poem, passage: t.passage, prepChoices: tp.prep, prep: null, final: tp.final,
    rounds: ROUNDS.map(() => ({ rehearsed: false, done: false, total: 0, delivery: 0, plan: 0, verified: false, planOk: false, secs: 0, self: null, grown: null, paid: false })), coins: 0, done: false };
}
/* the delivery window and what the evidence check needs, for round ri */
export function roundSpec(T, ri, texts = {}) {
  const rd = ROUNDS[ri], cfg = levelCfg(T.level);
  if (rd.kind === 'reading') {
    const p = texts[ri === 0 ? T.poem : T.passage] || null, words = p?.words || 0;
    return { rd, pid: p?.id || null, words, syllables: syllablesOf(p), target: windowFor(words, texts.narr?.[p?.id] || 0), places: breaths(String(p?.text || '').replace(/_/g, ''), !!rd.verse), mode: 'reading', minSecs: 0 };
  }
  const target = rd.impromptu ? cfg.final : cfg.speech;
  return { rd, words: 0, syllables: 0, target, places: 1, mode: 'speech', minSecs: Math.round(target[0] * 0.5) };
}
/* the hard stop: a recording is ended for the child at this many seconds (a microphone is never left on) */
export const capSecs = (spec) => Math.max(spec.target[1] + 30, Math.round(spec.target[1] * 1.6));

/* One round's score from the measured numbers. ev: mic.js evidence(); plan: planCheck() (rounds 3–4).
   Without evidence: 0 — delivery and plan alike. */
export function roundScore(ri, m, ev, plan = null, spec = {}) {
  const rd = ROUNDS[ri];
  if (!ev?.ok || !m) return { verified: false, delivery: 0, plan: 0, total: 0, parts: [], planOk: !!plan?.complete };
  const d = deliveryScore(rd.kind === 'speech' ? 'talk' : rd.id === 'poem' ? 'poem' : 'prose', m, { target: spec.target, words: spec.words, places: spec.places });
  const pp = rd.plan ? (plan?.points || 0) : 0;
  return { verified: true, delivery: d.total, plan: pp, total: d.total + pp, parts: d.parts, planOk: rd.plan ? !!plan?.complete : true };
}
/* does a finished round pay its `stop` 5? verified speech — and, in a planned round, a complete plan */
export const roundPays = (res) => !!res?.verified && !!res?.planOk;

/* A rival's round: their Bee traits, seeded by the tournament, round and rival. Skill sets the centre; nerve
   shakes later rounds; a rival far from a natural pace loses timing. Planned rounds add their plan (2–4). */
export function rivalRound(rv, n, ri) {
  const r = rng(`podium:${n}:${ri}:${rv.id}`);
  let v = 4.5 + rv.skill * 5.5 + (r() - 0.5) * 2.4 - (1 - rv.nerve) * ri * 1.1 - Math.abs(rv.pace - 1) * 2.5;
  v = Math.max(3, Math.min(10, Math.round(v)));
  const plan = ROUNDS[ri].plan ? Math.max(2, Math.min(4, Math.round(2 + rv.skill * 2 + (r() - 0.5) * 1.6))) : 0;
  const line = v >= 9 ? `${rv.name} ${rv.tell} — and it lands.` : v >= 7 ? `${rv.name} ${rv.tell}.` : rv.pace > 1.15 ? `${rv.name} rushed it and finished early.` : rv.pace < 0.9 ? `${rv.name} ran over the time.` : `${rv.name} lost the thread for a moment, and found it again.`;
  return { total: v + plan, delivery: v, plan, line };
}
/* the bracket's seeds: the rivals by skill, the child by their best place before */
export function seeds(band, best = null) {
  const rows = field(band).map((rv) => ({ id: rv.id, name: rv.name, skill: rv.skill })).sort((a, b) => b.skill - a.skill);
  const you = Math.max(1, Math.min(rows.length + 1, best || rows.length + 1));
  rows.splice(you - 1, 0, { id: 'you', name: 'You', you: true });
  return rows.map((r, i) => ({ ...r, seed: i + 1 }));
}
/* standings after the rounds played (mine: the child's round totals so far) — ties share a place */
export function standings(n, band, mine) {
  const rows = [{ id: 'you', name: 'You', total: mine.reduce((a, x) => a + x, 0), you: true },
    ...field(band).map((rv) => ({ id: rv.id, name: rv.name, total: mine.reduce((a, _, ri) => a + rivalRound(rv, n, ri).total, 0) }))];
  rows.sort((a, b) => b.total - a.total || (a.you ? -1 : b.you ? 1 : 0));
  rows.forEach((row, i) => { row.place = i && rows[i - 1].total === row.total ? rows[i - 1].place : i + 1; });
  return rows;
}
/* the end: the total, how many rounds were verified, and whether the tournament pays its `contest` 10 */
export function finish(T) {
  const totals = T.rounds.map((r) => r.total || 0), total = totals.reduce((a, b) => a + b, 0), verified = T.rounds.filter((r) => r.verified).length;
  const pct = total / MAX;
  return { totals, total, max: MAX, pct, verified, pays: verified >= 3 && pct >= 0.5 };
}

/* ---------- the child's record (k.podium, store v6) and the typed plans (k.writing.podium) ---------- */
export const newPodium = () => ({ level: 1, pick: null, top: 1, n: 0, best: null, cur: null });
export const podiumOf = (k) => (k.podium ||= newPodium());
export const playLevel = (rec) => (Number.isInteger(rec?.pick) && rec.pick >= 1 && rec.pick <= 5 ? rec.pick : Math.max(1, Math.min(5, rec?.level || 1)));
/* the typed (or chosen) plan for a planned round: free writing, on this device only */
export const plansOf = (k) => ((k.writing ||= {}).podium ||= {});
export const planOf = (k, rid) => (plansOf(k)[rid] ||= { hook: '', p1: '', p2: '', p3: '', close: '' });
/* The owner's rule on the tournament total (the same rule as games.js nextLevel / hubs.js settleLevel —
   test/podium.mjs holds them equal): under 50% down one, 50–79% holds, 80% up one; a hand-set level sticks
   until this check, then the chip goes back to Auto. */
export function settle(rec, played, pct) {
  const before = Math.max(1, Math.min(5, played)), after = pct >= 0.8 ? Math.min(5, before + 1) : pct < 0.5 ? Math.max(1, before - 1) : before;
  rec.level = after; rec.pick = null; rec.top = Math.max(rec.top || 1, after);
  return { before, after, up: after > before, drop: after < before, line: after < before ? `Let’s warm up on Level ${after}. You can move back up any time.` : '' };
}
/* The end of a tournament: the summary kept (numbers only, in k.contests), the level settled, the typed plans
   CLEARED, the tournament closed. Returns what the finish card shows. */
export function closeTournament(k, T, now = Date.now()) {
  const f = finish(T), rows = standings(T.n, T.band, f.totals), me = rows.find((x) => x.you), rec = podiumOf(k);
  const lv = settle(rec, T.level, f.pct);
  (k.contests ||= []).push({ at: now, n: T.n, band: T.band, level: T.level, rounds: f.totals, total: f.total, max: f.max, place: me.place, of: rows.length, verified: f.verified });
  rec.best = rec.best ? Math.min(rec.best, me.place) : me.place;
  if (k.writing) delete k.writing.podium;
  rec.cur = null;
  return { ...f, rows, place: me.place, level: lv };
}

/* Felix's reveal speech as a plan: Hook · three points · Close, stage directions set aside */
export function felixPlan(speech) {
  const clean = (t) => String(t || '').replace(/\*\([^)]*\)\*/g, '').replace(/\*/g, '').replace(/\s+—\s*$/, '').replace(/^Footnote\s*—\s*/, '').replace(/\s{2,}/g, ' ').trim();
  const lines = (speech?.lines || []).map((l) => ({ slot: l.slot, text: clean(l.text) })).filter((l) => l.text && !/^No\. No footnotes/.test(l.text));
  const by = (s) => lines.filter((l) => l.slot === s).map((l) => l.text), pts = by('point');
  let cut = FELIX_SPLIT.slice(1).map((m) => pts.findIndex((t) => t.startsWith(m)));
  if (cut.some((i) => i <= 0) || cut[0] >= cut[1]) { const k = Math.ceil(pts.length / 3); cut = [k, 2 * k]; }
  return { who: speech?.who, title: speech?.title, hook: by('hook'), points: [pts.slice(0, cut[0]), pts.slice(cut[0], cut[1]), pts.slice(cut[1])], close: by('close') };
}

/* the syllables a reading should show, and the verifier's own thresholds, for the result card */
export { VERIFY };
