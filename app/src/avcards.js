/* avcards.js — every avatar as a trading card, as Bizzing Bee's are (its avatar-cards.js): a rank from the
   tier, a title from the pack, four stats with an overall, a power, the card's lore and a real fact
   (data/avatar-cards.js), and the child's own history with it — when it joined the shelf (from the
   wallet's ledger), and whether it is worn. Stats are drawn from the id, so a card is the same on every
   device and every day; they are for fun and never touch learning, rank or coins. */
import { ALL_AVATARS as AVATARS, PACK_NAMES } from './data/avatars.js';
import { CARD_TEXT } from './data/avatar-cards.js';

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const RANKS = { common: 'Reader', rare: 'Storyteller', epic: 'Orator', legendary: 'Laureate' };
const BASE = { common: [52, 16], rare: [62, 18], epic: [72, 18], legendary: [84, 14] };
export const STATS = [['wit', 'Wit'], ['words', 'Words'], ['voice', 'Voice'], ['nerve', 'Nerve']];
const POWERS = {
  wit: ['Quick Riddle', 'Sharp Twist', 'Bright Idea'], words: ['Word Hoard', 'Perfect Phrase', 'Deep Dictionary'],
  voice: ['Carrying Voice', 'Story Spell', 'Hush-the-Hall'], nerve: ['Steady Stage', 'Cool Head', 'Brave Reply'],
};

export function card(id) {
  const a = AVATARS.find((x) => x.id === id); if (!a) return null;
  const [b, sp] = BASE[a.tier] || BASE.common, t = CARD_TEXT[id] || {};
  const stats = Object.fromEntries(STATS.map(([k]) => { const r = (hash(`${id}:${k}`) % 1000) / 1000; return [k, Math.max(28, Math.min(99, Math.round(b + (r * 2 - 1) * sp)))]; }));
  const overall = Math.round(STATS.reduce((s, [k]) => s + stats[k], 0) / STATS.length);
  const top = STATS.reduce((m, [k]) => (stats[k] > stats[m] ? k : m), 'wit'), pool = POWERS[top];
  return { id, name: a.name, art: a.art, tier: a.tier, rank: RANKS[a.tier], pack: a.packName || PACK_NAMES[a.pack - 1] || 'Bizzing English', title: a.own ? 'The fox of Bizzing English' : `${RANKS[a.tier]} of ${a.packName || PACK_NAMES[a.pack - 1]}`,
    stats, overall, power: pool[hash(id + ':power') % pool.length], lore: t.lore || '', fact: t.fact || '', from: t.from || '' };
}
/* the child's history with a card: when it joined (the wallet's spend for it), or free from the start */
export function history(id, k, ledger = [], owned = true) {
  const a = AVATARS.find((x) => x.id === id); if (!a) return '';
  if (!owned) return 'Not on your shelf yet.';
  const buy = ledger.find((x) => x.why === `avatar:${id}`);
  const when = buy ? `Joined your shelf on ${new Date(buy.t).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} for ${Math.abs(buy.n)} coins` : a.tier === 'common' ? 'Free for every reader from the first day' : 'On your shelf';
  return `${when}${k.avatar === id ? ' · wearing it now' : ''}.`;
}
/* the deck: every card the child owns, the worn one first in its place */
export const deckIds = (owns) => AVATARS.filter((a) => owns(a)).map((a) => a.id);
