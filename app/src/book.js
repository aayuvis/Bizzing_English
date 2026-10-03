/* book.js — the whole book (Alice), loaded on demand: the chapters' text and scenes are cut from the held
   text by tools/texts/book.mjs into data/book-alice.json; never in Home's first load. */
let B = null, pending = null;
export const book = () => B;
export function loadBook() {
  if (B) return Promise.resolve(B);
  return (pending ||= import('./data/book-alice.json').then((m) => (B = m.default || m)).catch(() => (pending = null, null)));
}
export function chapterText(n) { const c = B?.chapters.find((x) => x.n === +n); return c ? { text: c.text || c.scenes.join('\n\n'), scenes: c.scenes } : null; }
