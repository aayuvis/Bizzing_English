/* family.js — the one door to the family's shared keys (FAMILY-STANDARD §1, §19). Coins go only
   through integration/bizzing-wallet.js, minutes and milestones only through bizzing-activity.js —
   both copied byte for byte from Bizzing_Schedule and pinned by hash (test/family.mjs). In ?demo
   every call here is a no-op: the sample never touches a real household's wallet or feed. */

import { earn as wEarn, spend as wSpend, balance as wBalance, ledger as wLedger } from './integration/bizzing-wallet.js';
import { trackActivity, trackMilestone } from './integration/bizzing-activity.js';
import { isDemo } from './store.js';

export const APP = 'english';
let demoCoins = 0;
export const earn = (who, ev) => (isDemo() ? 0 : wEarn(APP, who, ev));
export const spend = (who, price, why) => (isDemo() ? false : wSpend(APP, who, price, why));
export const balance = (who) => (isDemo() ? demoCoins : wBalance(who));
export const ledger = (who) => (isDemo() ? [] : wLedger(who));
export const setDemoCoins = (n) => { demoCoins = n; };
export const milestone = (who, ev, label) => { if (!isDemo()) trackMilestone(APP, who, ev, label); };
export function startActivity(getName) { if (!isDemo()) trackActivity(APP, getName); }
