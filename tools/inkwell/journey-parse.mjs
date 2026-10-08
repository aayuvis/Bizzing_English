// journey-parse.mjs — reads an Ink Journey script (tools/inkwell/scripts/journey-0N.md, cut from season-one.md Part 9b) into
// the pieces of a case file: documents, interview questions and answers, the reveal and epilogue, the Training Desk, the
// timeline's rows, the margin notes. Words a child reads are taken from the script WORD FOR WORD; build-journeys.mjs adds
// the structure (ids, deductions, the accusation) the scripts state in prose, and the validator holds every document body
// to its script (`validate-cases.mjs --scripts`).
export const SPAN_RE = /\[\[c:([A-Za-z0-9_-]+)\|([\s\S]*?)\]\]/g;
export const cleanMd = (t) => String(t || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/(^|[^*])\*([^*]+)\*/g, '$1$2').replace(/`([^`]+)`/g, '$1').replace(/\s+/g, ' ').trim();
const unq = (t) => t.replace(/^[“"]|[”"]$/g, '');

/* split into sections by heading level ≤ n: [{ head, level, start, end, lines }] */
export function sections(md) {
  const L = md.split('\n'), out = [];
  L.forEach((l, i) => { const m = l.match(/^(#{2,6}) (.*)$/); if (m) out.push({ head: m[2].trim(), level: m[1].length, start: i }); });
  out.forEach((s, j) => { const nx = out.slice(j + 1).find((t) => t.level <= s.level); s.end = nx ? nx.start : L.length; s.lines = L.slice(s.start + 1, s.end); });
  return out;
}
export const chapterAt = (md, lineNo) => { let ch = 0; md.split('\n').slice(0, lineNo + 1).forEach((l) => { const m = l.match(/^### Chapter (\d)/); if (m) ch = +m[1]; if (/^### (The reveal|Epilogue|Detective School|Training Desk|Persona|Word Hoard|Story additions|Art and|\[VERIFY)/.test(l)) ch = 9; }); return ch; };
/* the first run of blockquote lines in `lines` (blank `>` lines skipped), as the body: one script line per \n */
export function quoteBody(lines, from = 0) {
  let i = from; while (i < lines.length && !/^\s*>/.test(lines[i])) { if (/^#{2,6} /.test(lines[i])) return { body: '', next: i }; i++; }
  const out = [];
  while (i < lines.length && /^\s*>/.test(lines[i])) { const t = lines[i].replace(/^\s*>\s?/, '').trim(); if (t) out.push(t); i++; }
  return { body: out.join('\n'), next: i };
}
/* metadata bullets under a DOC heading: Author · Date/time · Found (where) · Picture */
function meta(lines) {
  const text = []; for (const l of lines) { if (/^\s*>/.test(l)) break; text.push(l.trim()); }
  const t = text.join(' ');
  const grab = (k) => { const m = t.match(new RegExp(`\\*\\*${k}[^*]*:\\*\\*\\s*([^·]*?)(?=\\s*·\\s*\\*\\*|\\s*-\\s*\\*\\*|$)`)); return m ? cleanMd(m[1]).replace(/\s*-$/, '').trim() : null; };
  return { author: grab('Author'), when: grab('Date/time'), where: grab('Found'), picture: grab('Picture') };
}
export function docs(md) {
  const out = [], all = sections(md);
  for (const s of all) {
    const m = s.head.match(/^DOC (J\d\.\d+) · (.+)$/); if (!m) continue;
    const { body } = quoteBody(s.lines), mt = meta(s.lines);
    const typeRaw = m[2].replace(/\s*\(.*$/, '').trim();
    out.push({ id: m[1], typeRaw: m[2].trim(), type: typeRaw, chapterIn: chapterAt(md, s.start), title: null, ...mt, body, appears: /◆/.test(s.head) });
  }
  return out;
}

/* interviews: "#### SUSPECT X" / "#### WITNESS X" sections, questions in either script style */
export function interviews(md) {
  const L = md.split('\n'), out = []; let who = null, role = null, ch = 0;
  for (let i = 0; i < L.length; i++) {
    const l = L[i], cm = l.match(/^### Chapter (\d)/); if (cm) { ch = +cm[1]; who = ch === 2 ? null : who; }
    if (/^### (The reveal|Epilogue|Detective School|Training Desk|Persona|Word Hoard)/.test(l)) break;
    const h = l.match(/^#### (SUSPECT|WITNESS|CLIENT) (.+)$/); if (h) { who = cleanMd(h[2]).replace(/\s*\(.*\)\s*$/, '').trim(); role = h[1].toLowerCase(); continue; }
    if (/^#### /.test(l) && !/^#### (SUSPECT|WITNESS)/.test(l)) { if (ch !== 2) who = who; }
    let q = null;
    const a = l.match(/^\*\*Q \((\w+)\)(?::\*\*|\*\*)\s*(.*)$/);           // **Q (what):** "…"   |  **Q (why)** ◆ after DOC J1.5: "…"
    const b = l.match(/^#####\s*Q(\d+)\s*·\s*(\w+)\s*·\s*(.*)$/);            // ##### Q1 · what · "…"
    if (a) { const rest = a[2]; const after = rest.match(/◆\s*after DOC (J\d\.\d+)/); const qt = rest.match(/[“"]([^”"]+)[”"]/); q = { type: a[1], q: qt ? qt[1] : cleanMd(rest), afterDoc: after ? after[1] : null }; }
    else if (b) { const rest = b[3]; const after = rest.match(/(?:◆\s*after|offered after) DOC (J\d\.\d+)/); const qt = rest.match(/[“"]([^”"]+)[”"]/); q = { type: b[2], q: qt ? qt[1] : cleanMd(rest), afterDoc: after ? after[1] : null }; }
    else if (/^\*\*The persona question\*\*/.test(l)) {
      let j = i + 1, txt = []; while (j < L.length && !/^\s*>/.test(L[j])) { txt.push(L[j]); j++; }
      const per = {}; const t = txt.join(' ').replace(/^\s*-\s*/, '');
      for (const m of t.matchAll(/(Thea|Milo|Oskar|Signe|Hari|Vani):\s*[“"]([^”"]+)[”"]/g)) per[m[1].toLowerCase()] = m[2];
      q = { type: 'who', q: 'The persona question', perPersona: per, personaQ: true };
    }
    if (!q) continue;
    let j = i + 1, expr = null;
    while (j < L.length && !/^\s*>/.test(L[j]) && !/^(\*\*Q |#####|####|###)/.test(L[j])) { const e = L[j].match(/^Expression:\s*(.+)$/); if (e) expr = e[1].trim(); j++; }
    const { body, next } = quoteBody(L, j);
    let k = next; while (k < L.length && !L[k].trim()) k++;
    const pm = (L[k] || '').match(/^\*\(portrait:\s*([^)→.:]+)/); if (!expr && pm) expr = pm[1].trim();
    out.push({ who, role, chapter: ch, ...q, expression: expr, body });
  }
  return out;
}

/* "**WHO:** text" lines and stage paragraphs, between a heading and the next "---" */
export function dialogue(lines) {
  const out = [], paras = []; let cur = [];
  for (const l of lines) { if (/^---\s*$/.test(l) || /^#{2,6} /.test(l)) { if (cur.length) paras.push(cur.join(' ')); cur = []; if (/^#{2,6} /.test(l)) paras.push('§' + l.replace(/^#+\s*/, '')); continue; } if (!l.trim()) { if (cur.length) paras.push(cur.join(' ')); cur = []; continue; } if (/^\s*>/.test(l)) { if (cur.length) paras.push(cur.join(' ')); cur = []; paras.push('>' + l.replace(/^\s*>\s?/, '')); continue; } if (/^\*\*[A-Z{][^*]*:\*\*/.test(l) && cur.length) { paras.push(cur.join(' ')); cur = []; } cur.push(l.trim()); }
  if (cur.length) paras.push(cur.join(' '));
  for (const p of paras) {
    if (p.startsWith('§')) { out.push({ who: 'STAGE', text: cleanMd(p.slice(1)), heading: true }); continue; }
    if (p.startsWith('>')) { const t = cleanMd(p.slice(1)); if (t) out.push({ who: 'STAGE', text: t, quote: true }); continue; }
    const m = p.match(/^\*\*([^*]+?)\*\*\s*(\*\([^)]*\)\*)?\s*:?\s*(.*)$/);
    if (m && /^(\{det\}|[A-Z][A-Z .'-]*):?$/.test(m[1].trim())) {
      // a stage direction inside a speech goes to `direction`, as the case files keep it (not part of what is said)
      let said = m[3], dir = m[2] ? cleanMd(m[2]).replace(/^\(|\)$/g, '') : null;
      const lead = said.match(/^\*\(([^)]*)\)\*\s*/); if (lead) { dir = [dir, lead[1]].filter(Boolean).join('; '); said = said.slice(lead[0].length); }
      const inner = [...said.matchAll(/\s*\*\(([^)]*)\)\*\s*/g)]; if (inner.length) { dir = [dir, ...inner.map((x) => x[1])].filter(Boolean).join('; '); said = said.replace(/\s*\*\(([^)]*)\)\*\s*/g, ' '); }
      out.push({ who: m[1].replace(/:$/, '').trim(), text: cleanMd(said.trim()), ...(dir ? { direction: cleanMd(dir) } : {}) });
    }
    else if (/^\*\([\s\S]*\)\*$/.test(p.trim())) out.push({ who: 'STAGE', direction: cleanMd(p).replace(/^\(|\)$/g, ''), text: '' });
    else out.push({ who: 'STAGE', text: cleanMd(p) });
  }
  return out.filter((x) => x.text || x.direction);
}

/* Training Desk exercises, in both script styles (bold or italic labels) */
export function exercises(md) {
  const L = md.split('\n'), out = [];
  for (let i = 0; i < L.length; i++) {
    const h = L[i].match(/^\*\*([ex]\d+) · (easier|at|harder) \(L(\d)\) · ([\w-]+) · skill (\w+)(?: · strand (\w+))? · objective ([\w-]+) · chapter (\d) · source (.+?)(?:, (?:span )?(?:\[c:)?([\w-]+)\]?)?\*\*\s*$/);
    if (!h) continue;
    const block = []; let j = i + 1; while (j < L.length && !/^\*\*[ex]\d+ · /.test(L[j]) && !/^(---|###)/.test(L[j])) { block.push(L[j]); j++; }
    const text = block.join('\n'), field = (k) => { const m = text.match(new RegExp(`- (?:\\*\\*|\\*)${k}(?: \\(to order\\))?:(?:\\*\\*|\\*)\\s*([\\s\\S]*?)(?=\\n- (?:\\*\\*|\\*)[A-Z]|$)`)); return m ? m[1].replace(/\n\s+/g, ' ').trim() : null; };
    const order = /Options \(to order\)/.test(text);
    out.push({ id: h[1], tier: h[2], level: +h[3], type: h[4], skill: h[5], strand: h[6] || null, objective: h[7] === 'null' ? null : h[7], chapter: +h[8], sourceRaw: h[9].trim(), span: h[10] && h[10] !== 'null' ? h[10] : null,
      prompt: field('Prompt'), optionsRaw: field('Options'), answerRaw: field('Answer'), explain: field('Explain'), order });
  }
  return out;
}

/* a markdown table after a heading match: rows as arrays of cells */
export function table(lines) {
  const rows = lines.filter((l) => /^\|/.test(l)).map((l) => l.replace(/^\||\|\s*$/g, '').split(/(?<!\\)\|/).map((c) => c.trim()));
  return rows.filter((r) => !r.every((c) => /^-+$/.test(c)));
}
/* "**Did you know?** *(margin note, chapter n)* text … *Sources:* …" and "#### Did you know? *(margin note, …)*" blocks */
export function marginNotes(md) {
  const L = md.split('\n'), out = [];
  for (let i = 0; i < L.length; i++) {
    const m = L[i].match(/^(?:\*\*Did you know\?\*\*|#{3,4} Did you know\?)\s*(?:\*\(margin note, ([^)]*)\)\*)?\s*(📜)?\s*(.*)$/);
    if (!m) continue;
    const buf = [m[3]]; let j = i + 1; while (j < L.length && !/^(---|#{2,4} |\*\*Chapter|\*\*Did you know)/.test(L[j])) { buf.push(L[j]); j++; }
    const t = buf.join('\n').trim(), si = t.search(/\*Sources?:\*|- \*Sources?:\*/);
    const body = cleanMd(si >= 0 ? t.slice(0, si) : t), src = si >= 0 ? cleanMd(t.slice(si).replace(/^-\s*/, '').replace(/^\*Sources?:\*\s*/, '')) : null;
    const ch = (m[1] || '').match(/chapter (\d)/); out.push({ chapter: ch ? +ch[1] : (/epilogue|after Case Closed|chapter 5/.test(m[1] || '') ? 5 : null), where: m[1] || null, text: body, source: src, verify: /\[VERIFY/.test(t) });
  }
  return out;
}
export const spansIn = (t) => [...String(t).matchAll(/\[c:([\w-]+)\]/g)].map((m) => m[1]);
export const between = (md, a, b) => { const i = md.indexOf(a); if (i < 0) return null; const j = b ? md.indexOf(b, i + a.length) : -1; return md.slice(i + a.length, j < 0 ? undefined : j); };
export { unq };
