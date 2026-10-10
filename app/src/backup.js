/* backup.js — what a backup file may carry, decided by ALLOW-LIST (Finance's rule): a field added
   tomorrow is excluded by default rather than included by accident. A child's first name never goes
   in the file (restore asks for it again), and nothing spoken is ever stored, so none can leak. */

export const KID_FIELDS = ['id', 'band', 'avatar', 'created', 'owned', 'worlds', 'world', 'stops', 'mastery', 'misses', 'bank', 'reading', 'book',
  'medals', 'seen', 'games', 'stage', 'contests', 'extras', 'copy', 'days', 'targets', 'prefs', 'milestones', 'feed', 'place', 'modes', 'certsSeen',
  'inkwell',   // Inkwell Detective progress (cases, casebook, Word Hoard); never k.inkwellName, the persona's typed name
  'podium',    // The Podium: level, tournaments, numbers and ids only; never k.writing.podium, the typed speech plans
  'slips'];    // the Coach's game and tool misses: game id, category, count, time — nothing typed
export const PARENT_FIELDS = ['plan'];

export function makeBackup(h) {
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
  return { app: 'bizzing-english', v: h.v, at: new Date().toISOString().slice(0, 10), parent: pick(h.parent, PARENT_FIELDS), kids: h.kids.map((k) => pick(k, KID_FIELDS)) };
}

/* names: one first name per child, typed by the grown-up at restore */
export function restoreBackup(h, file, names) {
  if (!file || file.app !== 'bizzing-english' || !Array.isArray(file.kids)) return false;
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
  h.kids = file.kids.map((k, i) => ({ ...pick(k, KID_FIELDS), name: String(names[i] || `Reader ${i + 1}`).slice(0, 20) }));
  h.parent.plan = file.parent?.plan === 'family' ? 'family' : 'free';
  h.active = h.kids[0]?.id || null;
  return true;
}
