/* certificates.js — a certificate for every level finished in a strand and every whole book finished, made on this
   device as a picture the family can save or print. The first name is drawn into the picture locally; nothing is
   sent anywhere (a download is the family's own act). Evidence only: a level is finished when every stop in it is
   passed (model.levelDone), a book when every chapter's questions are. */
import { STRANDS } from './curriculum.js';
import { levelDone } from './model.js';
import { BOOKS } from './book.js';

export function certificates(k) {
  const out = [];
  for (const s of STRANDS) for (const l of s.levels) if (l.stops.length && levelDone(k, s.id, l.n)) {
    const at = Math.max(...l.stops.map((st) => k.stops[st.id]?.at || 0));
    out.push({ id: `${s.id}-${l.n}`, kind: 'level', title: `${s.title} level ${l.n} · ${l.title}`, can: l.iCan, colour: s.colour, at, stops: l.stops.map((st) => st.title) });
  }
  for (const b of BOOKS) { const done = (k.reading[`book:${b.id}`]?.done || []).length;
    if (done && done >= b.chapters.length) out.push({ id: `book-${b.id}`, kind: 'book', title: b.title, can: `read every chapter of ${b.title} by ${b.author} and answered its questions`, colour: '#0F766E', at: Date.now(), stops: [] }); }
  return out.sort((a, b) => b.at - a.at);
}

/* the certificate as SVG (also drawn to a canvas for "save as a picture") */
export function certSVG(c, name, dateStr) {
  const e = (s) => String(s).replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]));
  const wrap = (s, n) => { const w = String(s).split(' '), lines = ['']; for (const x of w) { if ((lines.at(-1) + ' ' + x).trim().length > n) lines.push(x); else lines[lines.length - 1] = (lines.at(-1) + ' ' + x).trim(); } return lines; };
  const can = wrap(c.kind === 'book' ? `has ${c.can}.` : `can say: “${c.can}”`, 58);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850" font-family="Georgia, serif">
  <rect width="1200" height="850" fill="#FBF6EA"/><rect x="28" y="28" width="1144" height="794" fill="none" stroke="${c.colour}" stroke-width="10"/>
  <rect x="48" y="48" width="1104" height="754" fill="none" stroke="${c.colour}" stroke-width="2"/>
  <text x="600" y="150" text-anchor="middle" font-size="30" letter-spacing="8" fill="#5b5146">BIZZING ENGLISH</text>
  <text x="600" y="235" text-anchor="middle" font-size="72" font-weight="700" fill="#22303a">Certificate</text>
  <text x="600" y="300" text-anchor="middle" font-size="26" fill="#5b5146">This is to say that</text>
  <text x="600" y="385" text-anchor="middle" font-size="64" font-weight="700" fill="${c.colour}">${e(name)}</text>
  <text x="600" y="455" text-anchor="middle" font-size="30" fill="#22303a">${c.kind === 'book' ? 'finished the whole book' : 'finished'}</text>
  <text x="600" y="515" text-anchor="middle" font-size="38" font-weight="700" fill="#22303a">${e(c.title)}</text>
  ${can.map((l, i) => `<text x="600" y="${585 + i * 36}" text-anchor="middle" font-size="26" font-style="italic" fill="#3d4a52">${e(l)}</text>`).join('')}
  <text x="600" y="745" text-anchor="middle" font-size="22" fill="#5b5146">${e(dateStr)} · every stop passed on its check</text>
</svg>`;
}
