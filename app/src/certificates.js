/* certificates.js — a certificate for every level finished in a strand and every whole book finished, made on this
   device as a picture the family can save or print. The first name is drawn into the picture locally; nothing is
   sent anywhere (a download is the family's own act). Evidence only: a level is finished when every stop in it is
   passed (model.levelComplete), a book when every chapter's questions are. */
import { STRANDS } from './curriculum.js';
import { levelComplete, levelStops } from './model.js';
import { BOOKS } from './book.js';

export function certificates(k) {
  const out = [];
  for (const s of STRANDS) for (const l of s.levels) if (levelComplete(k, s.id, l.n)) {
    const ss = levelStops(s.id, l.n), at = Math.max(...ss.map((st) => k.stops[st.id]?.at || 0));
    out.push({ id: `${s.id}-${l.n}`, kind: 'level', title: `${s.title} level ${l.n} · ${l.title}`, can: l.iCan, colour: s.colour, at, stops: ss.map((st) => st.title) });
  }
  for (const b of BOOKS) { const done = (k.reading[`book:${b.id}`]?.done || []).length;
    if (done && done >= b.chapters.length) out.push({ id: `book-${b.id}`, kind: 'book', title: b.title, can: `read every chapter of ${b.title} by ${b.author} and answered its questions`, colour: '#0F766E', at: Date.now(), stops: [] }); }
  return out.sort((a, b) => b.at - a.at);
}

/* the certificate as SVG (also drawn to a canvas for "save as a picture"), in the app's own faces: Fraunces for
   the title and the name, Literata for the words, Hanken Grotesk for the small lines (brief v4: it was a system
   serif). On the page the faces come from fonts.css; a picture drawn from an SVG can load nothing, so "save"
   passes `fontCss` — the same faces as data: URLs (certFontCss). */
const F = { d: "Fraunces, Georgia, serif", r: "Literata, Georgia, serif", b: "'Hanken Grotesk', system-ui, sans-serif" };
export async function certFontCss(base = 'fonts/') {
  const one = async (fam, file, style = 'normal', weight = '400') => {
    const buf = await (await fetch(base + file)).arrayBuffer(); let bin = ''; const u = new Uint8Array(buf);
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000));
    return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2')}`;
  };
  return (await Promise.all([one('Fraunces', 'fraunces-800.woff2', 'normal', '400 900'), one('Literata', 'literata-latin-400-normal.woff2', 'normal', '400 500'),
    one('Literata', 'literata-latin-400-italic.woff2', 'italic', '400 600'), one('Hanken Grotesk', 'hanken-var.woff2', 'normal', '100 900')])).join('');
}
export function certSVG(c, name, dateStr, fontCss = '') {
  const e = (s) => String(s).replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]));
  const wrap = (s, n) => { const w = String(s).split(' '), lines = ['']; for (const x of w) { if ((lines.at(-1) + ' ' + x).trim().length > n) lines.push(x); else lines[lines.length - 1] = (lines.at(-1) + ' ' + x).trim(); } return lines; };
  const can = wrap(c.kind === 'book' ? `has ${c.can}.` : `can say: “${c.can}”`, 58);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850" font-family="${F.r}">${fontCss ? `<style>${fontCss}</style>` : ''}
  <rect width="1200" height="850" fill="#FBF6EA"/><rect x="28" y="28" width="1144" height="794" fill="none" stroke="${c.colour}" stroke-width="10"/>
  <rect x="48" y="48" width="1104" height="754" fill="none" stroke="${c.colour}" stroke-width="2"/>
  <text x="600" y="150" text-anchor="middle" font-size="26" letter-spacing="8" font-weight="700" font-family="${F.b}" fill="#5b5146">BIZZING ENGLISH</text>
  <text x="600" y="235" text-anchor="middle" font-size="76" font-weight="800" font-family="${F.d}" fill="#22303a">Certificate</text>
  <text x="600" y="300" text-anchor="middle" font-size="26" fill="#5b5146">This is to say that</text>
  <text x="600" y="385" text-anchor="middle" font-size="66" font-weight="800" font-family="${F.d}" fill="${c.colour}">${e(name)}</text>
  <text x="600" y="455" text-anchor="middle" font-size="30" fill="#22303a">${c.kind === 'book' ? 'finished the whole book' : 'finished'}</text>
  <text x="600" y="515" text-anchor="middle" font-size="36" font-weight="800" font-family="${F.d}" fill="#22303a">${e(c.title)}</text>
  ${can.map((l, i) => `<text x="600" y="${585 + i * 36}" text-anchor="middle" font-size="26" font-style="italic" fill="#3d4a52">${e(l)}</text>`).join('')}
  <text x="600" y="745" text-anchor="middle" font-size="21" font-family="${F.b}" fill="#5b5146">${e(dateStr)} · every stop passed on its check</text>
</svg>`;
}
