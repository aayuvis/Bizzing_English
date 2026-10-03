/* extras.js — the Shop's Extras: a look, never content, never chance (FAMILY-STANDARD: fixed prices, no
   loot). Three kinds, each drawn by the app in CSS, so nothing here is a picture that could carry
   lettering:
   • reading paper — the page a passage sits on (every paper is held to the contrast check, light and dark);
   • bookplates — the "from the library of" plate on My page and the reading log;
   • stage curtains — the curtain over the Stage and the Elocution Contest.
   The first of each kind is free. Bought with coins through family.js → the wallet, at printed prices;
   what is owned and worn lives on the child (k.extras), never on the household. */

export const EXTRAS = [
  { id: 'paper-plain', kind: 'paper', name: 'Plain page', price: 0, what: 'The page as it comes.' },
  { id: 'paper-cream', kind: 'paper', name: 'Cream laid', price: 60, what: 'Warm, like an old library copy.' },
  { id: 'paper-parchment', kind: 'paper', name: 'Parchment', price: 80, what: 'A soft brown page with a darker edge.' },
  { id: 'paper-sea', kind: 'paper', name: 'Sea-glass', price: 80, what: 'A pale green-blue page, easy on the eyes.' },
  { id: 'paper-rose', kind: 'paper', name: 'Rose', price: 80, what: 'A faint pink page.' },
  { id: 'plate-plain', kind: 'plate', name: 'Plain bookplate', price: 0, what: 'A simple ruled border.' },
  { id: 'plate-laurel', kind: 'plate', name: 'Laurel', price: 100, what: 'A double border with leaves at the corners.' },
  { id: 'plate-stars', kind: 'plate', name: 'Night sky', price: 100, what: 'Deep blue, with a scatter of stars.' },
  { id: 'plate-deco', kind: 'plate', name: 'Art deco', price: 120, what: 'Gold stepped corners on black.' },
  { id: 'curtain-red', kind: 'curtain', name: 'Red velvet', price: 0, what: 'The theatre’s own.' },
  { id: 'curtain-blue', kind: 'curtain', name: 'Royal blue', price: 120, what: 'Deep blue with a gold fringe.' },
  { id: 'curtain-green', kind: 'curtain', name: 'Emerald', price: 120, what: 'Green velvet, gold rope.' },
  { id: 'curtain-gold', kind: 'curtain', name: 'Cloth of gold', price: 150, what: 'For a grand night.' },
];
export const KINDS = [['paper', 'Reading paper'], ['plate', 'Bookplates'], ['curtain', 'Stage curtains']];
export const extra = (id) => EXTRAS.find((e) => e.id === id) || null;
const FREE = Object.fromEntries(KINDS.map(([k]) => [k, EXTRAS.find((e) => e.kind === k && !e.price).id]));

export function extrasOf(k) { const x = (k.extras ||= { owned: [], wear: {} }); x.owned ||= []; x.wear ||= {}; return x; }
export const owns = (k, id) => { const e = extra(id); return !!e && (!e.price || extrasOf(k).owned.includes(id)); };
export const wearing = (k, kind) => { const id = extrasOf(k).wear[kind]; return id && owns(k, id) ? id : FREE[kind]; };
export function wear(k, id) { const e = extra(id); if (!e || !owns(k, id)) return false; extrasOf(k).wear[e.kind] = id; return true; }
/* buy: the spend goes through the wallet (fixed price, never below zero); the caller passes spend */
export function buyExtra(k, id, spend) {
  const e = extra(id); if (!e || owns(k, id)) return false;
  if (!spend(e.price, `extra:${id}`)) return false;
  extrasOf(k).owned.push(id); extrasOf(k).wear[e.kind] = id; return true;
}
/* the look, as attributes on <html>: data-paper, data-curtain (bookplates are drawn where they appear) */
export function applyExtras(k) {
  const el = document.documentElement;
  el.dataset.paper = k ? wearing(k, 'paper').slice(6) : 'plain';
  el.dataset.curtain = k ? wearing(k, 'curtain').slice(8) : 'red';
}
export function validate() {
  const errs = [], ids = new Set();
  for (const e of EXTRAS) { if (ids.has(e.id)) errs.push(`duplicate ${e.id}`); ids.add(e.id);
    if (!KINDS.some(([k]) => k === e.kind)) errs.push(`${e.id}: unknown kind`);
    if (!e.id.startsWith(e.kind + '-')) errs.push(`${e.id}: id must start with its kind`);
    if (!Number.isInteger(e.price) || e.price < 0 || e.price % 10) errs.push(`${e.id}: price must be a round number of coins`); }
  for (const [k] of KINDS) if (EXTRAS.filter((e) => e.kind === k && !e.price).length !== 1) errs.push(`${k}: exactly one free`);
  return errs;
}
