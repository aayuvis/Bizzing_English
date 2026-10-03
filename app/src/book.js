/* book.js — the whole books, loaded on demand: each book's chapters (text, scenes, questions) are cut
   from its held text by tools/texts/book.mjs <id> into data/book-<id>.json; never in Home's first load.
   The small facts a screen needs before the text arrives (titles, chapter names, questions for the
   stops) come from data/book-<id>.js. A book is added here, in one place. */
import { BOOK as ALICE } from './data/book-alice.js';
import { BOOK as WIND } from './data/book-wind.js';

const LOAD = { alice: () => import('./data/book-alice.json'), wind: () => import('./data/book-wind.json') };
const MORE = {
  alice: { year: 1865, band: 2, short: 'Alice', start: 'Nobody yet. Alice is sitting on a bank by a river, with nothing to do…' },
  wind: { year: 1908, band: 2, short: 'The Wind in the Willows', start: 'Nobody yet. Down in his little home, the Mole is spring-cleaning…' },
};
export const BOOKS = [ALICE, WIND].map((b) => ({ id: b.work, title: b.title, author: b.author, chapters: b.chapters, ...MORE[b.work] }));
export const bookMeta = (id) => BOOKS.find((b) => b.id === id) || null;
/* a chapter's key in k.reading and the talk room: `<book>-<n>` */
export function chapterKey(pid) { const m = /^([a-z]+)-(\d+)$/.exec(String(pid)); return m && bookMeta(m[1]) ? { id: m[1], n: +m[2] } : null; }

const B = {}, pending = {};
export const book = (id = 'alice') => B[id] || null;
export function loadBook(id = 'alice') {
  if (!LOAD[id]) return Promise.resolve(null);
  if (B[id]) return Promise.resolve(B[id]);
  return (pending[id] ||= LOAD[id]().then((m) => (B[id] = m.default || m)).catch(() => (pending[id] = null, null)));
}
export function chapterText(id, n) { const c = B[id]?.chapters.find((x) => x.n === +n); return c ? { text: c.text || c.scenes.join('\n\n'), scenes: c.scenes } : null; }
