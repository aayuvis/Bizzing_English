/* an in-memory localStorage for the engine tests */
const mem = {}; globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; }, _mem: mem };
export const T = Date.UTC(2026, 9, 2, 12);
export function tally(name) { let fail = 0, n = 0; const ok = (msg, c) => { n++; if (!c) { fail++; console.log('✗', msg); } }; const done = () => { if (fail) { console.log(`${name}: ${fail} FAILED of ${n}`); process.exit(1); } console.log(`${name}: all ${n} passed`); }; return { ok, done }; }
