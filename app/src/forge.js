/* forge.js — THE FORGE ENGINE for Root Forge (handover C §4.3), kept behind this one module.

   The family question (one shared engine and one sourced morpheme table with Bizzing Bee's planned Word
   Forge, as integration/bizzing-forge.js) is the owner's to approve and is NOT approved here, so the forge
   is built LOCALLY. Everything a screen needs goes through the interface below, and nothing outside this
   file knows how a word is spelt from its parts — so a family drop-in can replace this file whole:

     forgeOf(lex, wp)            → the forge for Bee's list `lex` (public/data/bee-words.json) and the parts
                                   table `wp` (data/wordparts.js); memoised per list
       .parts, .part(id)         every part: { id, t, kind: prefix | base | root | suffix, mean, band, src }
       .strike(ids)              the parts in anvil order → { word, def, ps, rule, ids } for a real word, or null
       .spell(ids)               every spelling the parts may take, plain first ([{ s, rule }])
       .targets(ids, slots)      every real word the tray can forge in 2..slots parts, each piece used once
       .round(seed, level, o)    a tray of 6–9 parts with ≥ N findable words (LEVELS); o.final: a family
       .words                    every word the whole table can forge (word → { ids, rule })
       .byPart                   part id → the words it can forge
     forgeNew(round, level)      a round's state;   forgeStep(state, action) → state (pure, test/forge.mjs)
     bookAdd / bookByPart / rankOf   the Forge Book, kept per child (k.games.root.book)

   A WORD is real when it is in Bee's list and passes kidSafe (CLAUDE.md hard rule 11) — its definition
   too. The spelling changes are the usual ones, as tools/import-bee.mjs joins them: the e drops (hope +
   ing), y turns to i (happy + ness), the last letter doubles (sun + y), -le becomes -ly (gentle + ly),
   t + -tion (act + ion), and a Greek root takes a linking o (therm + o + meter). Any order the child
   chooses is struck as it stands; only Bee's list decides. Nothing in scoring is random: the seed only
   chooses which parts lie in the tray, and the tray is checked to hold its N words before it is dealt. */

import { rng, shuffle, hash } from './rand.js';
import { kidSafe } from './safe.js';

const VOW = /^[aeiouy]/;
export const MAX_SLOTS = 4;

/* ---------- the spelling: one junction ---------- */
/* s: the word so far; x: the next part. Every way the two may join, the plain one first. */
function joinAt(s, x) {
  const t = x.t, out = [{ s: s + t, rule: '' }];
  if (x.kind === 'suffix') {
    if (/[^e]e$/.test(s)) out.push({ s: s.slice(0, -1) + t, rule: 'e' });
    if (/[^aeiou]y$/.test(s) && t[0] !== 'i') out.push({ s: s.slice(0, -1) + 'i' + t, rule: 'y' });
    if (VOW.test(t) && /(^|[^aeiou])[aeiou][b-df-hj-np-tvz]$/.test(s)) out.push({ s: s + s.slice(-1) + t, rule: 'double' });
    if (t === 'ly' && /le$/.test(s)) out.push({ s: s.slice(0, -1) + 'y', rule: 'le' });
    if (t === 'tion' && /te$/.test(s)) out.push({ s: s.slice(0, -2) + t, rule: 'tion' });
    else if (t === 'tion' && /t$/.test(s)) out.push({ s: s.slice(0, -1) + t, rule: 'tion' });
  }
  if (x.kind === 'root' && /[^aeiou]$/.test(s) && /^[^aeiou]/.test(t)) out.push({ s: s + 'o' + t, rule: 'o' });
  return out;
}
export const RULES = {
  e: 'the e drops before the ending', y: 'the y turns to i', double: 'the last letter doubles', le: '-le becomes -ly',
  tion: 'the t joins the -tion', o: 'a linking o joins the roots',
};

/* ---------- the parts ---------- */
const BAND_OF_DIFF = (d) => (d <= 1 ? 1 : d <= 2 ? 2 : 3);   // Bee's difficulty step → the band a whole word joins at
function buildParts(lex, wp) {
  const parts = [], seen = new Set(), add = (p) => { if (!seen.has(p.t)) { seen.add(p.t); parts.push(p); } };
  for (const a of wp.PREFIXES) add({ id: 'p:' + a.p, t: a.p, kind: 'prefix', mean: a.meaning, band: a.band || 1, src: a.source });
  for (const a of wp.SUFFIXES) add({ id: 's:' + a.s, t: a.s, kind: 'suffix', mean: a.meaning, makes: a.makes, band: a.band || 1, src: a.source });
  for (const r of wp.ROOTS) for (const t of r.root.split(/\s*\/\s*/)) add({ id: 'r:' + t, t, kind: 'root', mean: r.meaning, from: r.from, band: 3, src: r.source });
  /* the whole words the tables pair with a prefix or an ending — in Bee's list, kid-safe — are the bases */
  const bases = new Set();
  for (const a of [...wp.PREFIXES, ...wp.SUFFIXES]) for (const [, b] of a.words) bases.add(b);
  /* and any other everyday word in Bee's list (short, first two difficulty steps) that takes one of the
     prefixes or endings to make another word in the list — the forge keeps it only if it forges something */
  const aff = [...wp.PREFIXES.map((a) => ({ t: a.p, kind: 'prefix' })), ...wp.SUFFIXES.map((a) => ({ t: a.s, kind: 'suffix' }))];
  for (const [w, d] of Object.entries(lex.words)) {
    if (bases.has(w) || !/^[a-z]{3,8}$/.test(w) || (d[3] || 9) > 2 || !/^(noun|verb|adjective|adverb)$/.test(d[2]) || /([^s]s|ed|ing)$/.test(w)) continue;
    if (aff.some((x) => (x.kind === 'prefix' ? w.startsWith(x.t) && lex.words[w.slice(x.t.length)] : w.endsWith(x.t) && [w.slice(0, -x.t.length), w.slice(0, -x.t.length) + 'e', w.slice(0, -x.t.length).replace(/i$/, 'y')].some((b) => b.length > 2 && lex.words[b])))) continue;   // made of parts itself: not a base
    if (aff.some((x) => (x.kind === 'prefix' ? [x.t + w] : joinAt(w, x).map((c) => c.s)).some((c) => c !== w && lex.words[c]))) bases.add(w);
  }
  for (const b of [...bases].sort()) {
    const d = lex.words[b]; if (!d || !kidSafe(b, d[0]) || b.length < 2) continue;
    add({ id: 'b:' + b, t: b, kind: 'base', mean: 'a whole word', band: BAND_OF_DIFF(d[3] || 1), src: 'Bee’s word list' });
  }
  return parts;
}

/* ---------- the forge ---------- */
/* A forged word must also be MADE of its parts, so the glow never teaches a false etymology:
     · the shape: prefixes (at most two), then one or two cores (a whole word or a root), then endings (at most two);
     · two parts with a root: the word is one the parts table lists for that root (sourced, data/wordparts.js);
     · three or four parts: taking off the outer prefix or the outer ending leaves a forged word — every step
       of the build is itself a word (un + kind = unkind; unkind + ness = unkindness);
     · not a FALSE FRIEND: a word that happens to be spelt from the pieces without carrying their meaning
       (mis + sing is not "missing"). Such a strike neither scores nor counts as a crack: the screen says so. */
export const FALSE_FRIENDS = new Set(['fully', 'playboy', 'bloody']);
const MAX_PRE = 2, MAX_CORE = 2, MAX_SUF = 2;
const isCore = (p) => p.kind === 'base' || p.kind === 'root';
export function shapeOk(ps, partial = false) {
  let phase = 0, pre = 0, core = 0, suf = 0;
  for (const p of ps) {
    if (p.kind === 'prefix') { if (phase > 0 || ++pre > MAX_PRE) return false; }
    else if (isCore(p)) { if (phase > 1 || ++core > MAX_CORE) return false; phase = 1; }
    else { if (phase < 1 || ++suf > MAX_SUF) return false; phase = 2; }
  }
  return partial || core >= 1;
}
const MEMO = new WeakMap();
export function forgeOf(lex, wp) {
  const m = MEMO.get(lex); if (m && m.wp === wp) return m.forge;
  const parts = buildParts(lex, wp), byId = new Map(parts.map((p) => [p.id, p]));
  const rootWords = new Map();   // root part id → the words the table lists for it
  for (const r of wp.ROOTS) for (const t of r.root.split(/\s*\/\s*/)) { const id = 'r:' + t; rootWords.set(id, new Set([...(rootWords.get(id) || []), ...r.words])); }
  const SAFE = new Map(), isWord = (w) => { if (SAFE.has(w)) return SAFE.get(w); const d = lex.words[w], v = !!d && kidSafe(w, d[0]); SAFE.set(w, v); return v; };
  /* the words the parts table pairs with an affix or lists for a root: made of their parts by authority */
  const curated = new Set();
  for (const a of wp.PREFIXES) for (const [w] of a.words) curated.add(a.p + '|' + w);
  for (const a of wp.SUFFIXES) for (const [w] of a.words) curated.add(a.s + '|' + w);
  /* any other word counts only when Bee's own definition names its whole-word part ("careful": "showing
     care"), so a word merely spelt from the pieces — "image" from im + age — does not */
  const stem = (t) => (t.length > 3 ? t.replace(/(e|y)$/, '') : t), RX = new Map();
  const rx = (b) => RX.get(b) || RX.set(b, new RegExp(`\\b(${b}|${stem(b)})(s|es|d|ed|ing|er|est|ly|ily|ies|ied|ness|ful)?\\b`, 'i')).get(b);
  const names = (w, b) => rx(b).test(lex.words[w]?.[0] || '');
  const transparent = (w, ps) => {
    const outer = ps[0].kind === 'prefix' ? ps[0] : ps[ps.length - 1].kind === 'suffix' ? ps[ps.length - 1] : null;
    if (outer && curated.has(outer.t + '|' + w)) return true;
    const bs = ps.filter((p) => p.kind === 'base');
    return bs.length > 0 && bs.every((b) => names(w, b.t));
  };
  const spell = (ids) => {
    let cur = [{ s: '', rule: '' }];
    ids.forEach((id, i) => { const x = byId.get(id); if (!x) { cur = []; return; }
      cur = i === 0 ? [{ s: x.t, rule: '' }] : cur.flatMap((c) => joinAt(c.s, x).map((n) => ({ s: n.s, rule: n.rule || c.rule }))); });
    const have = new Set(); return cur.filter((c) => !have.has(c.s) && have.add(c.s));
  };
  /* the real word the parts spell, made of them or not: { word, rule } or null */
  const spelt = (ids) => { for (const c of spell(ids)) if (isWord(c.s)) return { word: c.s, rule: c.rule }; return null; };
  const memo = new Map();
  const made = (ids) => {
    const k = ids.join('|'); if (memo.has(k)) return memo.get(k);
    let out = null; const ps = ids.map((id) => byId.get(id));
    if (ids.length >= 2 && ids.length <= MAX_SLOTS && new Set(ids).size === ids.length && ps.every(Boolean) && shapeOk(ps)) {
      const sp = spelt(ids);
      if (sp && !FALSE_FRIENDS.has(sp.word)) {
        const roots = ids.filter((id) => byId.get(id).kind === 'root');
        if (ids.length === 2) { if (roots.length ? roots.some((id) => rootWords.get(id)?.has(sp.word)) && ps.every((p) => p.kind !== 'base' || names(sp.word, p.t)) : transparent(sp.word, ps)) out = sp; }
        else if ((roots.length || transparent(sp.word, ps)) && (ps[0].kind === 'prefix' && made(ids.slice(1))) || (ps[ps.length - 1].kind === 'suffix' && made(ids.slice(0, -1)))) out = sp;
      }
    }
    memo.set(k, out); return out;
  };
  const strike = (ids) => { if (!Array.isArray(ids)) return null; const m = made(ids); if (!m) return null; const d = lex.words[m.word]; return { word: m.word, def: d[0], ps: d[2], rule: m.rule, ids: ids.slice() }; };
  /* every word the whole table can forge, built bottom up: every two-part word, then a prefix in front or an
     ending behind a word already made (the step rule makes that the whole set) */
  const words = new Map(), byPart = new Map(parts.map((p) => [p.id, []]));
  const P = parts.filter((p) => p.kind === 'prefix'), C = parts.filter(isCore), S = parts.filter((p) => p.kind === 'suffix');
  const put = (ids) => { const m = made(ids); if (m && !words.has(m.word)) { words.set(m.word, { ids, rule: m.rule }); return true; } return false; };
  let layer = [];
  for (const c of C) {
    for (const p of P) if (put([p.id, c.id])) layer.push([p.id, c.id]);
    for (const s of S) if (put([c.id, s.id])) layer.push([c.id, s.id]);
    if (c.kind === 'root') for (const d of C) if (d !== c && d.kind === 'root' && put([c.id, d.id])) layer.push([c.id, d.id]);
  }
  /* two whole words, or a whole word and a root: found from the list's own words, split in two */
  const coreByT = new Map(C.map((c) => [c.t, c]));
  for (const w of Object.keys(lex.words)) for (let i = 2; i <= w.length - 2; i++) {
    const a = coreByT.get(w.slice(0, i)), b = coreByT.get(w.slice(i)); if (a && b && (a.kind === 'base' || b.kind === 'base') && put([a.id, b.id])) layer.push([a.id, b.id]);
  }
  for (let n = 3; n <= MAX_SLOTS; n++) {
    const next = [];
    for (const ids of layer) {
      for (const p of P) if (!ids.includes(p.id) && put([p.id, ...ids])) next.push([p.id, ...ids]);
      for (const s of S) if (!ids.includes(s.id) && put([...ids, s.id])) next.push([...ids, s.id]);
    }
    layer = next;
  }
  for (const [w, e] of words) for (const id of e.ids) byPart.get(id).push(w);
  /* a whole word that forges nothing is no part */
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].kind === 'base' && !byPart.get(parts[i].id).length) { byPart.delete(parts[i].id); byId.delete(parts[i].id); parts.splice(i, 1); }
  const targets = (ids, slots = MAX_SLOTS) => {
    const out = new Map(), n = Math.min(slots, MAX_SLOTS, ids.length);
    const go = (seq) => {
      if (seq.length >= 2) { const s = strike(seq); if (s && !out.has(s.word)) out.set(s.word, s); }
      if (seq.length >= n) return;
      for (const id of ids) if (!seq.includes(id) && shapeOk([...seq, id].map((x) => byId.get(x)), true)) go([...seq, id]);
    };
    go([]);
    return [...out.values()].sort((a, b) => a.ids.length - b.ids.length || (a.word < b.word ? -1 : 1));
  };
  const forge = { parts, part: (id) => byId.get(id), spell, spelt, strike, targets, words, byPart, isWord, lex, rootWords };
  forge.round = (seed, level, o = {}) => dealRound(forge, seed, level, o);
  MEMO.set(lex, { wp, forge });
  return forge;
}

/* ---------- levels (the owner's rule moves them; the child may choose) ---------- */
/* prefixes and endings at 1–2, roots from 3, three-part words at 4–5. tray: parts in the tray; slots: the
   anvil; min: the fewest findable words a tray may hold; goal: words to find; bands: the parts allowed. */
export const LEVELS = {
  1: { tray: 6, slots: 2, min: 4, goal: 3, band: 1, roots: 0, three: 0, what: 'first prefixes and endings on whole words' },
  2: { tray: 7, slots: 2, min: 5, goal: 4, band: 2, roots: 0, three: 0, what: 'more prefixes and endings' },
  3: { tray: 8, slots: 2, min: 5, goal: 4, band: 3, roots: 1, three: 0, what: 'Latin and Greek roots join in' },
  4: { tray: 8, slots: 3, min: 5, goal: 4, band: 3, roots: 1, three: 1, what: 'three-part words' },
  5: { tray: 9, slots: 3, min: 6, goal: 5, band: 3, roots: 2, three: 1, what: 'roots and three-part words, the most parts' },
};
export const levelCfg = (L) => LEVELS[Math.max(1, Math.min(5, Math.round(+L || 1)))];
const allowed = (p, cfg) => (p.kind === 'root' ? cfg.roots > 0 : p.band <= cfg.band);
const wordKey = (w) => 'f:' + w;

/* A tray: start from an anchor word (the memory's order — never met first, missed ones back after their gap),
   then add the part that opens the most new words, ties broken by the seed, until the tray is full; kept
   only when it holds its N words (and, where the level asks, a root word and three-part words). */
function dealRound(F, seed, level, o = {}) {
  const L = Math.max(1, Math.min(5, Math.round(+level || 1))), cfg = levelCfg(L), R = rng('forge:' + seed + ':' + L + (o.final ? ':f' : ''));
  const ok = (id) => allowed(F.part(id), cfg);
  const pool = [...F.words].filter(([, e]) => e.ids.length <= cfg.slots && e.ids.every(ok)).map(([w, e]) => ({ w, ids: e.ids }));
  const seen = o.mem?.seen || {}, fresh = pool.filter((x) => !seen[wordKey(x.w)]), order = shuffle(R, fresh.length >= 8 ? fresh : pool);
  if (o.final) return familyRound(F, R, cfg, L, pool, order) || dealRound(F, seed, level, { ...o, final: false });
  const hasRoot = (x) => x.ids.some((id) => F.part(id).kind === 'root');
  /* strict first; then without the three-part ask; then any tray that holds enough words */
  for (const need of [cfg, { ...cfg, three: 0 }, { ...cfg, three: 0, roots: Math.min(1, cfg.roots), min: cfg.min - 1 }, { ...cfg, three: 0, roots: 0, min: 3 }]) {
    const lead = order.filter((x) => (need.three ? x.ids.length >= 3 : true) && (need.roots ? hasRoot(x) : true));
    for (const anchor of [...lead, ...order].slice(0, 40)) {
      const tray = grow(F, R, cfg, pool, anchor.ids.slice());
      const t = F.targets(tray, cfg.slots);
      if (t.length < need.min) continue;
      if (need.roots && t.filter(hasRoot).length < need.roots) continue;
      if (t.filter((x) => x.ids.length >= 3).length < need.three) continue;
      return roundOf(F, R, tray, t, cfg, L, null);
    }
  }
  return null;
}
/* Grow a tray from its anchor: add the part that opens the most new words, keeping a mix — at least two
   affixes and three cores, never more than half the tray of one kind — ties broken by the seed. */
function grow(F, R, cfg, pool, tray) {
  const kindOf = (id) => { const k = F.part(id).kind; return k === 'prefix' || k === 'suffix' ? 'aff' : 'core'; };
  const cap = { aff: Math.ceil(cfg.tray / 2), core: cfg.tray - 2 };
  while (tray.length < cfg.tray) {
    const have = new Set(tray), n = { aff: 0, core: 0 }; tray.forEach((id) => n[kindOf(id)]++);
    const left = cfg.tray - tray.length, must = n.aff < 2 && left <= 2 - n.aff ? 'aff' : n.core < 3 && left <= 3 - n.core ? 'core' : null;
    const gain = new Map();
    for (const x of pool) { const miss = x.ids.filter((id) => !have.has(id)); if (miss.length === 1) gain.set(miss[0], (gain.get(miss[0]) || 0) + 1); else if (miss.length === 2) for (const id of miss) gain.set(id, (gain.get(id) || 0) + 0.25); }
    const fits = (id) => n[kindOf(id)] < cap[kindOf(id)] && (!must || kindOf(id) === must);
    let best = [...gain.entries()].filter(([id]) => fits(id)).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    if (!best.length) { const rest = [...new Set(pool.flatMap((x) => x.ids))].filter((id) => !have.has(id) && fits(id)).sort(); if (!rest.length) break; tray.push(rest[Math.floor(R() * rest.length)]); continue; }
    const top = best.filter((b) => b[1] >= best[0][1] - 1).slice(0, 4);
    tray.push(top[Math.floor(R() * top.length)][0]);
  }
  return tray;
}
/* The final: forge a family — a key part (a base or a root) and three words that share it. */
function familyRound(F, R, cfg, L, pool, order) {
  const keys = new Map();
  for (const x of pool) for (const id of x.ids) { const k = F.part(id).kind; if (k === 'base' || k === 'root') (keys.get(id) || keys.set(id, []).get(id)).push(x); }
  const fams = shuffle(R, [...keys.entries()].filter(([, xs]) => xs.length >= 3).map(([id]) => id).sort());
  for (const key of fams) {
    const xs = shuffle(R, keys.get(key)).slice(0, 3), tray = [...new Set(xs.flatMap((x) => x.ids))];
    if (tray.length > cfg.tray + 1) continue;
    const full = grow(F, R, { ...cfg, tray: Math.max(cfg.tray, tray.length) }, pool, tray);
    const t = F.targets(full, cfg.slots), fam = t.filter((x) => x.ids.includes(key));
    if (fam.length < 3) continue;
    return roundOf(F, R, full, t, { ...cfg, goal: 3 }, L, key);
  }
  return null;
}
function roundOf(F, R, tray, targets, cfg, L, key) {
  /* the tray's order: shuffled by the seed, never in the anchor word's own order */
  const ids = shuffle(R, tray);
  return { level: L, slots: cfg.slots, goal: Math.min(cfg.goal, key ? 3 : targets.length), key, tray: ids.map((id) => F.part(id)),
    targets: targets.map((x) => ({ word: x.word, ids: x.ids, rule: x.rule, def: x.def, ps: x.ps })) };
}

/* ---------- a round in play: a pure reducer ---------- */
/* g.anvil: tray indexes in anvil order. g.found: words struck, in order ({ word, ids, first }). g.cracks: the
   strikes that made no word. A word is FIRST TRY unless the same pieces cracked earlier in the round (the
   child rearranged them after the crack). Coins: one per first-try word, at most ROUND_PAY_CAP, in a round
   of 50% or better (games.js roundPay). The round's accuracy: words / (max(goal, words) + cracks) — a
   random striker falls far under half, and stopping early with one easy word is not a perfect round. */
const setKey = (ids) => ids.slice().sort().join('|');
export function forgeNew(round, level = round?.level || 1) {
  return { kind: 'root', level, final: !!round?.key, round, tray: round?.tray || [], slots: round?.slots || 2, goal: round?.goal || 0, key: round?.key || null,
    targets: round?.targets || [], anvil: [], cursor: 0, found: [], cracks: [], tried: [], state: null, score: 0, combo: 0, bestCombo: 0, misses: {}, seq: 0, over: !round };
}
export const forgeIds = (g, anvil = g.anvil) => anvil.map((i) => g.tray[i].id);
export const forgeFound = (g) => g.found.length;
export const forgeFirst = (g) => g.found.filter((x) => x.first).length;
export const forgeFamily = (g) => (g.key ? g.found.filter((x) => x.ids.includes(g.key)).length : 0);
/* the round is won when the goal is met — for a family, three words with its key part */
export const forgeGoalMet = (g) => (g.key ? forgeFamily(g) >= g.goal : g.found.length >= g.goal);
export function forgeAccuracy(g) { const right = g.found.length, total = Math.max(g.goal, right) + g.cracks.length; return { right, total, pct: total ? right / total : null }; }
const free = (g) => g.tray.map((_, i) => i).filter((i) => !g.anvil.includes(i));
const catOf = (g, ids) => (ids.some((id) => g.tray.find((p) => p.id === id)?.kind === 'root') ? 'root' : ids.some((id) => g.tray.find((p) => p.id === id)?.kind === 'suffix') ? 'suffix' : 'prefix');

export function forgeStep(F, g, a) {
  if (g.over) return g;
  /* a crack holds until Continue; a glow clears on Continue, on the next piece, or by itself */
  if (g.state) {
    if (a.type === 'next' || (g.state.ok && a.type === 'place')) {
      const s = { ...g, state: null, anvil: [] };
      if (a.type === 'next' && g.state.ok && (g.found.length >= g.targets.length)) return { ...s, over: true };
      return a.type === 'place' ? forgeStep(F, s, a) : s;
    }
    return g;
  }
  if (a.type === 'move') { const f = free(g); if (!f.length) return g; const k = f.indexOf(g.cursor); return { ...g, cursor: f[((k < 0 ? 0 : k + (a.d || 0)) % f.length + f.length) % f.length] }; }
  if (a.type === 'place') {
    const i = a.i ?? g.cursor;
    if (!(i >= 0 && i < g.tray.length) || g.anvil.includes(i)) return g;
    let anvil = g.anvil.slice();
    if (a.at != null && a.at >= 0 && a.at < anvil.length) anvil[a.at] = i;          // dropped on a full slot: the piece there goes back
    else if (anvil.length < g.slots) anvil.push(i);
    else return g;
    const f = g.tray.map((_, j) => j).filter((j) => !anvil.includes(j));
    return { ...g, anvil, cursor: f.includes(g.cursor) ? g.cursor : f[0] ?? 0 };
  }
  if (a.type === 'lift') {
    if (!g.anvil.length) return g;
    const at = a.at != null ? a.at : g.anvil.length - 1; if (!(at >= 0 && at < g.anvil.length)) return g;
    const i = g.anvil[at]; return { ...g, anvil: g.anvil.filter((_, j) => j !== at), cursor: i };
  }
  if (a.type === 'clear') return g.anvil.length ? { ...g, anvil: [] } : g;
  if (a.type === 'done') return { ...g, over: true };
  if (a.type === 'strike') {
    if (g.anvil.length < 2) return g;
    const ids = forgeIds(g), pieces = g.anvil.map((i) => g.tray[i]), plain = pieces.map((p) => p.t).join('');
    const hit = F.strike(ids);
    if (hit) {
      if (g.found.some((x) => x.word === hit.word)) return { ...g, state: { ok: true, again: true, word: hit.word, ids, gain: 0 }, seq: g.seq + 1 };
      const first = !g.tried.includes(setKey(ids)), c = { combo: g.combo + 1 }, bonus = c.combo % 3 === 0 ? 1 : 0, gain = ids.length + bonus;
      const found = [...g.found, { word: hit.word, ids, first, rule: hit.rule }];
      const s = { ...g, found, combo: c.combo, bestCombo: Math.max(g.bestCombo, c.combo), score: g.score + gain, seq: g.seq + 1,
        state: { ok: true, word: hit.word, ids, def: hit.def, ps: hit.ps, rule: hit.rule, plain, first, gain, combo: bonus, family: !!g.key && ids.includes(g.key) } };
      return s;
    }
    /* spelt, but not made of these pieces ("missing" from mis + sing): said so — neither a word nor a crack */
    const sp = F.spelt(ids);
    if (sp) return { ...g, seq: g.seq + 1, state: { ok: false, friend: sp.word, ids, text: plain, why: '' } };
    const k = setKey(ids), again = g.cracks.some((x) => x.ids.join('|') === ids.join('|'));
    return { ...g, combo: 0, seq: g.seq + 1, tried: g.tried.includes(k) ? g.tried : [...g.tried, k],
      cracks: again ? g.cracks : [...g.cracks, { ids, text: plain }], misses: again ? g.misses : { ...g.misses, [catOf(g, ids)]: (g.misses[catOf(g, ids)] || 0) + 1 },
      state: { ok: false, ids, text: plain, again, why: crackWhy(pieces) } };
  }
  return g;
}
/* why the pieces do not fit, when the order itself is the reason (an ending first, a prefix last) */
export function crackWhy(pieces) {
  const k = pieces.map((p) => p.kind);
  if (k.slice(0, -1).includes('suffix')) return 'An ending goes at the end of a word.';
  if (k.slice(1).includes('prefix')) return 'A prefix goes at the front of a word.';
  if (k.filter((x) => x === 'base').length > 1) return 'Two whole words side by side make no word in Bee’s list here.';
  return '';
}

/* ---------- the Forge Book: the words a child has forged, kept by part ---------- */
/* book: { word: { ids: [part ids], at: ms } } on k.games.root.book — inside the game record a backup
   already carries (src/backup.js `games`), through the Store seam like every game record. */
export function bookAdd(book = {}, word, ids, at = Date.now()) {
  if (!word || book[word]) return book;
  return { ...book, [word]: { ids: ids.slice(), at } };
}
export const bookSize = (book) => Object.keys(book || {}).length;
/* part id → the words of the book with it, and how many the whole forge can make with it */
export function bookByPart(F, book = {}) {
  const by = new Map();
  for (const [w, e] of Object.entries(book)) for (const id of e.ids || []) { if (!F.part(id)) continue; (by.get(id) || by.set(id, []).get(id)).push(w); }
  return [...by.entries()].map(([id, ws]) => ({ part: F.part(id), words: ws.sort(), of: (F.byPart.get(id) || []).length, stamp: ws.length >= STAMP }))
    .sort((a, b) => KIND_ORDER[a.part.kind] - KIND_ORDER[b.part.kind] || b.words.length - a.words.length || (a.part.t < b.part.t ? -1 : 1));
}
const KIND_ORDER = { prefix: 0, root: 1, base: 2, suffix: 3 };
/* a part is STAMPED in the book once three of its words are forged */
export const STAMP = 3;
export const stamped = (book, id) => Object.values(book || {}).filter((e) => (e.ids || []).includes(id)).length >= STAMP;
/* the smith's rank grows with the book alone — words forged, never time */
export const RANKS = [[0, 'Apprentice'], [10, 'Journeyman'], [25, 'Smith'], [50, 'Master smith'], [100, 'Wordwright']];
export function rankOf(book) {
  const n = bookSize(book); let i = 0; while (i + 1 < RANKS.length && n >= RANKS[i + 1][0]) i++;
  return { name: RANKS[i][1], n, next: RANKS[i + 1] ? { at: RANKS[i + 1][0], name: RANKS[i + 1][1] } : null, i };
}
export const forgeHash = (s) => hash(String(s));
