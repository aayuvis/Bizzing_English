# Inkwell Detective: Season One case data

**What's here:** 12 case files (`case-00.json` … `case-11.json`, format 1.1 with the 1.2 `exercises`), converted from the scripts in
`inkwell-detectives-season-one.md` **word for word**, plus `SCHEMA.md` and `validate-cases.mjs`.

**Status:** `node validate-cases.mjs . --scripts <dir-with-case-NN.md>` gives **12 cases · 0 errors · 2 warnings**.
- Both warnings are harmless words copied exactly from the scripts: "a watering can like a weapon" and "Dev stops dead".
- **The validator was proved by breaking it:** a copy with an unsafe word, a one-span deduction, a missing wrong-suspect
  line, an invented over-long line and the wrong vanished word failed with all of them reported.

**Drop-in:** copy `case-*.json` to the English app's `data/cases/`, and add `validate-cases.mjs` to the test gate
(`npm test`). Plain Node, no dependencies.

## Done since the first cut (owner, 5 Oct 2026)
- **Exercises (format 1.2):** 200 level-matched English exercises, 14–19 per case, validated (tiers, types, sources, sentence
  length, answer-position spread). Clue-revealing items are held to chapter 5. Case 4–5 `objective` tags were inferred from
  the stop ids and should be checked against the English app's curriculum.
- **Case 11:** a "Where is the Charter?" `place` step (three options, Quill's wrong-answer lines); optional D7 removed (Case
  10 keeps its D7); drill round 2 written; round 1 answers checked.
- **Drill rounds written:** Case 8 round 2 ("Same name?"), Case 9 round 3 (two verses). New script lines are marked
  "Added 5 Oct 2026, owner-approved".
- **Names made consistent:** Councillor Hector Bright, Rupert Swale, Septimus Pettigrew, Reuben Osei, Petra Nwosu; the
  Case 4 woodturner is Ms Juno Marsh (so an innocent witness does not share the Case 7 culprit's surname).

## Still for the owner
1. **`source.signedOffBy`** is null in every case. Sign off each case after reading it, per the spec.
2. **Case 5 doc 5.3** is exactly 70 words without its underline tags, so it's at the level 2 limit.
3. **Case 8 doc 8.2:** its heading moved into the doc's `title` (unchanged words) to stay within 140.
