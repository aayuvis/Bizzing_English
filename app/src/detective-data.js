/* detective-data.js — where the Inkwell case files come from. In the app, each case and Journey is its own lazily loaded
   chunk (Vite's import.meta.glob), so the Agency costs nothing until it is opened; in Node (the tests, the tools) the
   same files are read from disk by the caller and handed to detective.js directly.

     loadCase(id)  → Promise<case | null>      loadSeason() → Promise<case[]> (every case and Journey, in season order)
     setCases(list) — tests and tools hand their parsed files in; loadCase/loadSeason then answer from them */

import { SEASON } from './detective-season.js';

const GLOB = (() => { try { return { ...import.meta.glob('./data/cases/case-*.json'), ...import.meta.glob('./data/journeys/journey-*.json') }; } catch { return null; } })();
let given = null;
const cache = new Map();
export function setCases(list) { given = new Map((list || []).map((c) => [c.id, c])); cache.clear(); }
export async function loadCase(id) {
  if (given) return given.get(id) || null;
  if (cache.has(id)) return cache.get(id);
  const key = Object.keys(GLOB || {}).find((k) => k.endsWith(`/${id}.json`)); if (!key) return null;
  const p = GLOB[key]().then((m) => m.default || m).catch(() => { cache.delete(id); return null; });
  cache.set(id, p); return p;
}
export async function loadSeason() { return (await Promise.all(SEASON.map((s) => loadCase(s.id)))).filter(Boolean); }
