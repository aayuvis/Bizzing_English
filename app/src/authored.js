/* authored.js — the stops whose questions are WRITTEN, not generated: the Language strand's levels 2–10
   (data/language.js) and the Literature strand's (data/literature.js). Each question carries its own
   sources; a quoted line is an exact substring of a held text (test/language.mjs, test/literature.mjs).
   They run through the same engine as every generator (items.js kind `authored`), so test/items.mjs
   holds them to the same rules: one right answer, not in its text, no favourite slot. */
import { LANG_STOPS } from './data/language.js';
import { LIT_STOPS } from './data/literature.js';
import { WORD_STOPS } from './data/word-stops.js';
import { SENTENCE_STOPS } from './data/sentence-stops.js';
import { MYTH_WORD_STOPS } from './data/myth-words.js';
import { GAP_STOPS } from './data/gap-stops.js';

export const AUTHORED_STOPS = [...GAP_STOPS, ...WORD_STOPS, ...MYTH_WORD_STOPS, ...SENTENCE_STOPS, ...LIT_STOPS, ...LANG_STOPS];
export const AUTHORED = new Map(AUTHORED_STOPS.map((s) => [s.id, s]));
export const addAuthored = (stops) => { for (const s of stops) { AUTHORED_STOPS.push(s); AUTHORED.set(s.id, s); } };
