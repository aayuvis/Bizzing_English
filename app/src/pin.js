/* pin.js — the grown-ups' PIN. A DETERRENT, not security, and the screen says so: a determined
   child with the browser's developer tools can get past anything a page does. Stored as a salted
   SHA-256 hash (never the digits); "unlocked" lives in memory, so a reload asks again. No pass
   codes exist anywhere in this code (India shipped two once). */

let unlocked = false;
export const isUnlocked = () => unlocked;
export const lock = () => { unlocked = false; };

const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
async function digest(salt, pin) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin))); }

export async function setPin(parent, pin) {
  if (!/^\d{4}$/.test(pin)) return false;
  const salt = hex(crypto.getRandomValues(new Uint8Array(12)));
  parent.pin = { salt, hash: await digest(salt, pin) };
  unlocked = true;
  return true;
}
export async function tryPin(parent, pin) {
  if (!parent.pin) return false;
  const ok = (await digest(parent.pin.salt, pin)) === parent.pin.hash;
  if (ok) unlocked = true;
  return ok;
}
