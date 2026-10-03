#!/usr/bin/env node
/* clips.mjs — the list of every narration clip, asked of the DATA (never a hand-kept list that drifts):
   each passage's scenes, each Alice chapter's scenes, each stop's story and lesson. Writes
   tools/voice/clips.json = [{ key, text }] for tts.py. The text is the text on screen, cleaned only of
   typographic marks a voice should not read (_italics_, [Illustration], footnote stars). */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = new URL('../../', import.meta.url).pathname;
const clean = (s) => String(s).replace(/\[Illustration[^\]]*\]/gi, '').replace(/_/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
const clips = [];
const P = JSON.parse(readFileSync(ROOT + 'app/src/data/passages.json', 'utf8'));
for (const p of P) (p.scenes || [p.text]).forEach((t, i) => clips.push({ key: `st/${p.id}-${i}`, text: clean(t) }));
for (const f of readdirSync(ROOT + 'app/src/data').filter((f) => /^book-[a-z]+\.json$/.test(f)).sort()) {
  const B = JSON.parse(readFileSync(ROOT + 'app/src/data/' + f, 'utf8')), id = f.slice(5, -5);
  for (const c of B.chapters) (c.scenes || [c.text]).forEach((t, i) => clips.push({ key: `bk/${id}-${c.n}-${i}`, text: clean(t) }));
}
if (existsSync(ROOT + 'app/src/data/writing.js')) { const W = (await import(pathToFileURL(ROOT + 'app/src/data/writing.js').href)).default; for (const d of W.dictation) clips.push({ key: `dict/${d.id}`, text: clean(d.text) }); }
const { allStops } = await import(pathToFileURL(ROOT + 'app/src/curriculum.js').href);
for (const s of allStops()) { clips.push({ key: `stop/${s.id}-story`, text: clean(s.story) }); clips.push({ key: `stop/${s.id}-learn`, text: clean(s.learn.why) }); }
writeFileSync(ROOT + 'tools/voice/clips.json', JSON.stringify(clips, null, 1) + '\n');
console.log(`${clips.length} clips, ${clips.reduce((a, c) => a + c.text.length, 0)} characters`);
