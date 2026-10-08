// script-edits.mjs — the few changes the case and Journey data make to the book's words, each one listed here with its
// reason, so nothing changes silently. split-scripts.mjs applies them to its script copies, so the validator's word-for-word
// check holds the data to the book PLUS these edits and nothing else. Each is for the owner to carry into
// docs/inkwell/season-one.md (then delete it here).
export const EDITS = [
  {
    script: 'journey-03.md', from: 'By then she had already drunk the sleep, a night early.', to: 'By then she had already taken the sleep, a night early.',
    why: 'Kid-safe lists (validate-cases.mjs BLOCK, src/safe.js LINE_BLOCK) block "drunk" in any line a child reads; Friar Laurence\'s answer (J3, chapter 2, Q4) is child-facing.',
  },
];
export function applyEdits(name, text) {
  let t = text;
  for (const e of EDITS) if (e.script === name) { if (!t.includes(e.from)) throw new Error(`script-edits: "${e.from}" not found in ${name}`); t = t.split(e.from).join(e.to); }
  return t;
}
