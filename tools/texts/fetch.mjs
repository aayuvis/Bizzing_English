#!/usr/bin/env node
// Fetch the Library's held texts from the GITenberg mirror of Project Gutenberg,
// strip the Gutenberg header and footer, normalise line endings, and write
// app/public/texts/<id>.txt.
//
//   node tools/texts/fetch.mjs            # fetch what is missing from tools/texts/raw/, then clean all
//   node tools/texts/fetch.mjs --refresh  # download every raw copy again
//   node tools/texts/fetch.mjs alice      # only these ids
//
// Raw downloads are kept in tools/texts/raw/ (gitignored). No dependencies: Node's own
// fetch is tried first; where it cannot reach the network (e.g. behind a proxy it does
// not read), curl is used.

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const RAW = join(HERE, 'raw');
const OUT = join(ROOT, 'app', 'public', 'texts');
const GATED_DIR = join(ROOT, 'tools', 'texts', 'gated');
const { WORKS } = await import(new URL('../../app/src/data/library.js', import.meta.url).href);
const { cleared } = await import(new URL('../../app/src/data/rights.js', import.meta.url).href);
const GATED_IDS = new Set(WORKS.filter((w) => w.held && !cleared(w)).map((w) => w.id));
mkdirSync(GATED_DIR, { recursive: true });
const GIT = 'https://raw.githubusercontent.com/GITenberg';

// id → [GITenberg repository, file in it, Project Gutenberg number]
export const TEXTS = [
  ['aesop', 'Aesop-s-Fables_28', '28.txt', 28],
  ['grimm', 'Grimms-Fairy-Tales_2591', '2591.txt', 2591],
  ['andersen', 'Andersen-s-Fairy-Tales_1597', '1597.txt', 1597],
  ['arabian', 'The-Arabian-Nights-Entertainments_128', '128.txt', 128],
  ['bulfinch', 'Bulfinch-s-Mythology_4928', '4928.txt', 4928],
  ['indian-fairy', 'Indian-Fairy-Tales_7128', '7128.txt', 7128],
  ['justso', 'Just-So-Stories_2781', '2781.txt', 2781],
  ['alice', 'Alice-s-Adventures-in-Wonderland_11', '11.txt', 11],
  ['lookingglass', 'Through-the-Looking-Glass_12', '12.txt', 12],
  ['jungle', 'The-Jungle-Book_236', '236.txt', 236],
  ['peterpan', 'Peter-Pan_16', '16.txt', 16],
  ['secretgarden', 'The-Secret-Garden_113', '113.txt', 113],
  ['blackbeauty', 'Black-Beauty_271', '271.txt', 271],
  ['treasure', 'Treasure-Island_120', '120.txt', 120],
  ['wind', 'The-Wind-in-the-Willows_289', '289.txt', 289],
  ['heidi', 'Heidi_1448', '1448.txt', 1448],
  ['littlewomen', 'Little-Women_514', '514.txt', 514],
  ['anne', 'Anne-of-Green-Gables_45', '45.txt', 45],
  ['oz', 'The-Wonderful-Wizard-of-Oz_55', '55.txt', 55],
  ['velveteen', 'The-Velveteen-Rabbit_11757', '11757.txt', 11757],
  ['happyprince', 'The-Happy-Prince-and-Other-Tales_902', '902-0.txt', 902],
  ['lamb-tales', 'Tales-from-Shakespeare_573', '573.txt', 573],
  ['tomsawyer', 'The-Adventures-of-Tom-Sawyer_74', '74.txt', 74],
  ['carol', 'A-Christmas-Carol_46', '46.txt', 46],
  ['oliver', 'Oliver-Twist_730', '730.txt', 730],
  ['pride', 'Pride-and-Prejudice_1342', '1342.txt', 1342],
  ['holmes', 'The-Adventures-of-Sherlock-Holmes_1661', '1661.txt', 1661],
  ['kim', 'Kim_2226', '2226.txt', 2226],
  ['eighty-days', 'Around-the-World-in-80-Days_103', '103.txt', 103],
  ['timemachine', 'The-Time-Machine_35', '35.txt', 35],
  ['gulliver', 'Gulliver-s-Travels_829', '829.txt', 829],
  ['crusoe', 'The-Life-and-Adventures-of-Robinson-Crusoe_521', '521.txt', 521],
  ['frankenstein', 'Frankenstein_84', '84.txt', 84],
  ['magi', 'The-Gift-of-the-Magi_7256', '7256.txt', 7256],
  ['saki', 'Beasts-and-Super-Beasts_269', '269-0.txt', 269],
  ['homeworld', 'The-Home-and-the-World_7166', '7166-8.txt', 7166],
  ['sonnets', 'Shakespeare-s-Sonnets_1041', '1041.txt', 1041],
  ['blake', 'Songs-of-Innocence-and-Songs-of-Experience_1934', '1934.txt', 1934],
  ['wordsworth', 'Poems-in-Two-Volumes-Volume-2_8824', '8824.txt', 8824],
  ['keats', 'Poems-1817_8209', '8209.txt', 8209],
  ['mariner', 'The-Rime-of-the-Ancient-Mariner_151', '151.txt', 151],
  ['tennyson', 'The-Princess_791', '791.txt', 791],
  ['hiawatha', 'The-Song-of-Hiawatha_19', '19.txt', 19],
  ['raven', 'The-Raven_1065', '1065.txt', 1065],
  ['dickinson', 'Poems-by-Emily-Dickinson-Three-Series-Complete_12242', '12242.txt', 12242],
  ['lear', 'The-Book-of-Nonsense_982', '982.txt', 982],
  ['garden-verses', 'A-Child-s-Garden-of-Verses_136', '136.txt', 136],
  ['gitanjali', 'Gitanjali_7164', '7164.txt', 7164],
  ['crescentmoon', 'The-Crescent-Moon_6520', '6520.txt', 6520],
  ['naidu', 'The-Golden-Threshold_680', '680.txt', 680],
  ['kipling-rewards', 'Rewards-and-Fairies_556', '556.txt', 556],
  ['midsummer', 'A-Midsummer-Night-s-Dream_1514', '1514.txt', 1514],
  ['gettysburg', 'Gettysburg-Address_4', '4-0.txt', 4],
  ['douglass', 'Narrative-of-the-Life-of-Frederick-Douglass-an-American-Slave_23', '23.txt', 23],
  ['essays-bacon', 'The-Essays-Or-Counsels-Civil-and-Moral_575', '575.txt', 575],
  ['walden', 'Walden-and-On-The-Duty-Of-Civil-Disobedience_205', '205.txt', 205],
];

export const urlOf = ([, repo, file]) => `${GIT}/${repo}/master/${file}`;

async function download(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 404) throw new Error(`404 ${url}`);
  } catch (e) {
    if (String(e.message).startsWith('404')) throw e;
  }
  // Node's fetch ignores HTTPS_PROXY; curl reads it.
  return execFileSync('curl', ['-sSfL', '--max-time', '120', url], { maxBuffer: 64 << 20 });
}

// Decode: GITenberg files are UTF-8, or Latin-1 for some older -8 / plain releases.
function decode(buf) {
  const utf = buf.toString('utf8');
  return utf.includes('�') ? buf.toString('latin1') : utf;
}

const START = [
  /^\*\*\* ?START OF (THIS|THE) PROJECT GUTENBERG[^\n]*(\n[^\n*]+)?\*\*\* *$/m, // the title may wrap
  /^\*END\*? ?THE SMALL PRINT!.*$/m, // pre-2000 "small print" releases (Heidi, the Dream)
];
const END = [
  /^\*\*\* ?END OF (THIS|THE) PROJECT GUTENBERG.*$/m,
  /^End of (the )?Project Gutenberg.*$/im,
  /^End of this Project Gutenberg.*$/im,
];

export function clean(text) {
  let t = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  for (const re of START) {
    const m = re.exec(t);
    if (m) { t = t.slice(m.index + m[0].length); break; }
  }
  let cut = t.length;
  for (const re of END) {
    const m = re.exec(t);
    if (m && m.index < cut) cut = m.index;
  }
  t = t.slice(0, cut);
  // Producer credits that sit just inside the START marker.
  t = t.replace(/^\s*(Produced by|E-?text prepared by|Transcribed from|This etext was|Prepared by)[^\n]*(\n[^\n]+)*\n/i, '\n');
  return t.replace(/[ \t]+$/gm, '').replace(/^\n+/, '').replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const only = args.filter((a) => !a.startsWith('--'));
  mkdirSync(RAW, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  let ok = 0;
  const failed = [];
  for (const t of TEXTS) {
    const [id, , file, pg] = t;
    if (only.length && !only.includes(id)) continue;
    const raw = join(RAW, `${id}-${file.replace(/\//g, '_')}`);
    try {
      if (refresh || !existsSync(raw)) writeFileSync(raw, await download(urlOf(t)));
      const out = clean(decode(readFileSync(raw)));
      if (out.length < 1000) throw new Error(`suspiciously short after cleaning (${out.length} chars)`);
      writeFileSync(join(GATED_IDS.has(id) ? GATED_DIR : OUT, `${id}.txt`), out);   // not cleared in all three markets: kept off the site
      ok++;
      console.log(`  ${id.padEnd(16)} PG #${String(pg).padEnd(6)} ${String(out.length).padStart(8)} chars`);
    } catch (e) {
      failed.push(id);
      console.error(`  ${id}: ${e.message}`);
    }
  }
  console.log(`texts: ${ok} written to app/public/texts${failed.length ? `, failed: ${failed.join(', ')}` : ''}`);
  if (failed.length) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
