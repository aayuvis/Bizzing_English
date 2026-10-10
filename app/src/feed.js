/* feed.js — My Feed for Bizzing English (FAMILY-STANDARD §6a). The engine and the card are the
   family's (integration/bizzing-feed.js, never edited here); this file only says what THIS app knows
   about the child, and keeps what the feed remembers behind the Store seam (k.feed: { seen, paid },
   card ids and day numbers — no name, no voice, so a backup may carry it).

   What it passes the engine, all of it read on the device, nothing sent anywhere:
     level     the level of the child's next stop (next.js nextStep), named the app's way:
               "Word 3 · Prefixes" — or, before any stop, the level their band starts on;
     signals   where they are (the next stop and its strand), what they just did (k.last), the
               stories they heard, the words they tapped — each with its why in plain words;
     due       what slipped: a check due on a later day (mastery.js due) and the mistakes deck (k.misses);
     unlocked  a strand's cards wait until the strand is open on this plan;
     skip      a story already heard, a question already answered right;
     extra     the level-fit rule: what slipped first, then the very stop the road is waiting on.

   It ends: the engine's twenty, then feedEnd() pointing at Continue. Scrolling earns nothing; a
   right answer to a card's question pays once, through the wallet's `answer`. Pure: no DOM. */
import { feedFor } from './integration/bizzing-feed.js';
import { STRANDS, stopById, level as levelOf } from './curriculum.js';
import { nextStep } from './next.js';
import { readingStop } from './reading.js';
import { strandOpen, planOpen, headStart, bestLevel } from './model.js';
import { due as dueChecks } from './mastery.js';

export const DAY = 864e5;
export const dayNo = (now = Date.now()) => Math.floor(now / DAY);
export const rec = (k) => { const f = k.feed || (k.feed = {}); f.seen ||= {}; f.paid ||= {}; return f; };
const strand = (id) => STRANDS.find((s) => s.id === id);
const titleOf = (id) => (stopById(id) || readingStop(id))?.title || '';

/* the child's place on the ladder: { strand, level } — the next stop's, else the band's start */
export function feedPlace(h, k) {
  const nx = nextStep(h, k);
  const st = nx.kind === 'stop' ? nx.stop : nx.kind === 'check' ? (stopById(nx.ids[0]) || readingStop(nx.ids[0])) : null;
  if (st && st.strand && st.level) return { strand: st.strand, level: st.level };
  const b = bestLevel(k);
  if (b) return { strand: b.s.id, level: Math.min(10, b.l.n + (nx.kind === 'library' ? 0 : 1)) };
  return { strand: 'word', level: headStart(k, 'word') };
}
export const feedLevel = (h, k) => feedPlace(h, k).level;
export const namer = (sid) => (n) => { const l = levelOf(sid, n); return `${strand(sid)?.title || 'Level'} ${n}${l ? ` · ${l.title}` : ''}`; };
export const levelName = (h, k) => { const p = feedPlace(h, k); return namer(p.strand)(p.level); };

export function signals(h, k, now = Date.now()) {
  const out = [], nx = nextStep(h, k);
  if (nx.kind === 'stop') {
    out.push({ topic: `stop:${nx.stop.id}`, w: 6, why: `Your next stop: ${nx.stop.title}` });
    out.push({ topic: `strand:${nx.stop.strand}`, w: 3, why: `You are on the ${strand(nx.stop.strand)?.title} road` });
  }
  /* every open road, at the child's level: a quieter reason than the next stop */
  for (const s of STRANDS) if (strandOpen(k, s.id) && (s.id === 'reading' || planOpen(h, s.id)) && !out.some((x) => x.topic === `strand:${s.id}`)) out.push({ topic: `strand:${s.id}`, w: 0.5, why: s.id === 'reading' ? 'From the Library, at your level' : `On the ${s.title} road, at your level` });
  const L = k.last;
  if (L && now - (L.at || 0) < 3 * DAY && L.what === 'stop' && L.title) {
    const st = [...Object.keys(k.stops || {})].map((id) => stopById(id) || readingStop(id)).find((s) => s && s.title === L.title);
    if (st) { out.push({ topic: `stop:${st.id}`, w: 5, why: `Because you just did ${st.title}` }); out.push({ topic: `strand:${st.strand}`, w: 2.5, why: `Because you were on the ${strand(st.strand)?.title} road` }); }
  }
  /* the stories heard lately: more from the same book */
  const heard = Object.entries(k.reading || {}).filter(([id, r]) => r && r.heard && !id.startsWith('book:')).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 3);
  for (const [pid] of heard) { const rs = readingStop('rd-' + pid); const p = rs && rs.passage; if (p) out.push({ topic: `stop:rd-${pid}`, w: 2, why: `Because you heard “${rs.title}”` }); }
  for (const [id, r] of Object.entries(k.reading || {})) if (id.startsWith('book:') && (r?.done || []).length) out.push({ topic: `work:${id.slice(5)}`, w: 2.5, why: 'Because you are reading the whole book' });
  /* the words tapped lately */
  for (const [w] of Object.entries(k.bank || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 20)) out.push({ topic: `word:${w}`, w: 3, why: `A word you tapped: ${w}` });
  return out;
}

export function due(k, now = Date.now()) {
  const d = {};
  for (const id of dueChecks(k, now)) if (titleOf(id)) d[`stop:${id}`] = `Ready to prove on a later day: ${titleOf(id)}`;
  for (const m of (k.misses || []).slice(-40)) if (m && m.stop && !m.ok && now - (m.at || 0) >= DAY && titleOf(m.stop)) d[`stop:${m.stop}`] ||= `A mistake from ${titleOf(m.stop)} is ready again`;
  return d;
}

/* a level-agnostic card says plainly what it is, rather than claiming a level it does not have */
const PLAIN = { book: 'From the Library', line: 'A line of the hour', word: 'A word from the books', figure: 'From Figure Hunt', device: 'From the great speakers', game: 'A game to play', creature: 'From the Collection' };

const heardIt = (k, it) => {
  const key = it.key || '';
  if (it.kind === 'tale' && key.startsWith('stop:rd-')) return !!k.reading?.[key.slice(8)]?.heard;
  if (it.kind === 'chapter') { const m = /^stop:bk-([a-z]+)-(\d+)$/.exec(key); return !!m && (k.reading?.[`book:${m[1]}`]?.done || []).includes(+m[2]); }
  return false;
};

/* everything the engine needs for this child, now */
export function options(h, k, items, now = Date.now()) {
  const f = rec(k), place = feedPlace(h, k), nx = nextStep(h, k), slipped = due(k, now), nextKey = nx.kind === 'stop' ? `stop:${nx.stop.id}` : null;
  return {
    items, now, band: k.band, level: place.level, levelName: namer(place.strand),
    signals: signals(h, k, now), due: slipped, seen: f.seen,
    // a strand's cards wait as its road does (open, and on this plan); the Library's stories are open to every child
    unlocked: (it) => (it.topics || []).filter((t) => t.startsWith('strand:')).every((t) => { const sid = t.slice(7); return strandOpen(k, sid) && (sid === 'reading' || planOpen(h, sid)); }),
    skip: (it) => heardIt(k, it) || (!!it.play && !!f.paid[it.id]),
    extra: (it) => (it.key && slipped[it.key] ? { s: 10, why: slipped[it.key] } : nextKey && it.key === nextKey ? { s: 3, why: `Your next stop: ${nx.stop.title}` } : it.level == null && PLAIN[it.kind] ? { s: 0.01, why: PLAIN[it.kind] } : null),
  };
}

export const session = (h, k, items, now = Date.now()) => feedFor(options(h, k, items, now));

/* this week's cards sink: what a session showed is marked seen today; a fortnight is all it keeps */
export function markSeen(k, ids, now = Date.now()) {
  const f = rec(k), today = dayNo(now);
  for (const id of ids) f.seen[id] = today;
  for (const [id, d] of Object.entries(f.seen)) if (today - d > 14) delete f.seen[id];
}

/* a right answer pays once per card; returns true the first time */
export function payOnce(k, id, now = Date.now()) {
  const f = rec(k); if (f.paid[id]) return false;
  f.paid[id] = dayNo(now); return true;
}
