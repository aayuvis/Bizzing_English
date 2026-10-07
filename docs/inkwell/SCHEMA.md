# Inkwell Detective: case data format (`data/cases/<id>.json`)

**One JSON file per case.** The script (`case-NN.md`) is the source; this file is what the game loads. **Every word a child
reads comes from the script, verbatim.** Converting a case never rewrites its text.

## Top level

```jsonc
{
  "format": 1,
  "id": "case-01",                       // case-00 … case-11
  "number": 1,
  "title": "The Marrow That Walked Away",
  "label": "A Bizzing mystery",          // always exactly this
  "level": 1,                            // 1–5 (bible Part 7)
  "world": "garden",                     // garden | study | playhouse | forum | scriptorium | lakeside | quayside
  "setting": "the Story Garden, the Flower Show",
  "skills": ["pronoun", "inference", "vocab"],   // tags from bible Part 6
  "vanishedWord": "UNDER",               // null for case-00
  "ledgerIndex": 1,                      // position in the Blot Ledger (1–11); null for case-00
  "officeObject": { "id": "rosette", "name": "a rosette", "art": "one-line painter brief" },
  "arc": [ { "thread": "A|B|C", "beat": "short description", "docs": ["1.4"] } ],
  "tutorial": [ { "step": "mark|link|timeline|accuse|…", "trigger": "when it shows", "quill": "Quill's line" } ],   // case-00 only, else []

  "card": { "text": "…", "readAloud": true },
  "cutscene": [ { "panel": 1, "place": "…", "picture": "painter brief", "lines": [ { "who": "QUILL", "text": "…" } ] } ],

  "cast": [ {
      "id": "pell",                       // kebab-case, unique
      "name": "Mrs Hilda Pell",
      "role": "suspect | client | witness | helper | culprit-hidden | agency",
      "look": "…", "manner": "…",
      "expressions": ["calm", "offended", "amused", "relieved"],
      "unlockedBy": null                  // a deduction id when the card appears only after it (e.g. a hidden culprit)
  } ],

  "docs": [ {
      "id": "1.1",                        // as numbered in the script (scene docs "n.k", interview answers "n.Sx.Qy" or the script's own id)
      "chapter": "scene | interview | arc",
      "type": "letter | note | diary | notice | report | log | postcard | list | poster | transcript | programme | card | plaque | map | other",
      "title": "Grandpa Okoro's letter",
      "author": "…", "when": "…", "where": "…",
      "picture": "painter brief",
      "readAloud": true,
      "body": "Line one\nLine two with [[c:says-she|The gardener's note says she moved it]].\n…"
      // body = the blockquote text, verbatim, one script line per \n, clue spans kept as [[c:ID|exact words]]
  } ],

  "interviews": [ {
      "suspect": "pell",
      "questions": [ { "id": "pell-q1", "type": "who | what | when | where | why", "q": "…", "answerDoc": "1.6", "expression": "offended" } ]
  } ],

  "deductions": [ {
      "id": "D1",
      "type": "contradiction | timeline | pronoun | meaning | fact-opinion | figurative | voice | inference",
      "skill": "pronoun",                // a bible Part 6 tag
      "statement": "what the child concludes",
      "spans": ["says-she", "zuri-six"], // ≥ 2 span ids, each existing in some doc body
      "why": "why it matters"
  } ],

  "redHerrings": [ { "suspect": "pell", "clearedBy": ["span ids ≥1"], "note": "…" } ],

  "timeline": { "events": [ { "id": "T1", "order": 1, "text": "…", "spans": ["span ids ≥1"], "placedByChild": true } ] },

  "accusation": {
      "culprit": "zuri",                  // a cast id
      "place": null,                      // or { "prompt": "Where is it?", "answer": "…", "options": ["…"] } when the case asks for a place
      "minimalEvidence": ["D1", "D2", "span-or-deduction id"],   // exactly what proves it (3 items for L1–2, 3+ for L3–5)
      "acceptableEvidence": ["…"],        // other ids that also count as valid evidence
      "wrongSuspect": { "pell": "Quill's line pointing to the clearing clue" },   // every suspect except the culprit
      "weakEvidence": "Quill's line for the right suspect with weak evidence"
  },

  "reveal": [ { "who": "NELL", "text": "…" } ],        // or stage directions with "who": "STAGE"
  "epilogue": [ { "who": "…", "text": "…" } ],
  "drill": { "kind": "timeline | who-wrote | clue-spotter | pronoun | other", "title": "…", "items": [ { "prompt": "…", "answer": "…", "options": ["…"] } ] },
  "art": { "backgrounds": ["…"], "props": ["…"], "portraits": ["…"], "notes": "…" },
  "source": { "script": "case-01.md", "signedOffBy": null, "signedOffOn": null }   // the owner signs off before release
}
```

## Rules the validator enforces (`validate-cases.mjs`)
1. **Shape:** every required field is present with the right type; ids are unique; every reference resolves (cast,
   docs, spans, deductions, answer docs).
2. **Spans:**
   - every `[[c:ID|words]]` is well-formed, and ids are unique across the case;
   - every span id cited anywhere exists;
   - **every span is cited by at least one deduction, red herring, timeline event or the accusation**, so no orphan clue
     pins.
3. **Fair play:**
   - each deduction has ≥ 2 spans;
   - the minimal evidence has ≥ 3 items (L1–2) or ≥ 3 with ≥ 2 deductions (L3–5);
   - every suspect except the culprit has a `wrongSuspect` line;
   - every red-herring suspect is cleared by ≥ 1 span.
4. **Level limits** (bible Part 7) on every `scene` and `interview` doc body, with markup removed:

   | Level | Words per doc | Words per sentence (newline also ends a sentence) |
   |---|---|---|
   | 1 | 40 | 10 |
   | 2 | 70 | 14 |
   | 3 | 100 | 18 |
   | 4 | 140 | 22 |
   | 5 | 180 | 26 |

   - Times like "5.30" and "9:00" count as one word.
   - Case card ≤ 60 words; reveal ≤ 400 words.
5. **Level structure:**

   | Level | Suspects | Deductions |
   |---|---|---|
   | 1 | 3 | ≥ 2 |
   | 2 | 3–4 | ≥ 3 |
   | 3 | 4 | ≥ 4 |
   | 4 | 4 | ≥ 5 |
   | 5 | 5 | ≥ 6 |

   Suspects are counted from `cast[].role` of `suspect` or `culprit-hidden`.
6. **Kid-safe:** no blocklisted word in any text field.
7. **Arc:** `vanishedWord` matches the season's ledger order (UNDER, THE, CLOCK, THAT, NEVER, STRIKES, LIES, EVERY, WORD,
   FOR, EVERYONE), and `label` is "A Bizzing mystery".
8. **Verbatim:** run with `--scripts <dir>`, every doc body's text (markup kept) must appear in the source script's
   blockquotes.

## Format 1.1 additions (official; use these names, nothing else)

| Field | Shape | Meaning | Validator |
|---|---|---|---|
| `deductions[].optional` | `true` | An arc or extra link that doesn't count toward solving or the level's minimum | Not counted toward the minimum deductions |
| `deductions[].required` | `["span ids"]` | The subset of `spans` the child must link. The rest of `spans` are "also accepted". | Each must be in `spans` |
| `wrongLinks` | `[{ "spans": ["a","b"], "quill": "…" }]` | Quill's reply when the child links a tempting wrong pair | Spans counted as cited |
| `arcMarks` | `[{ "span": "id", "note": "…" }]` | A markable arc clue (a calling card, a vanished-word gap) that isn't part of the solve | Span counted as cited |
| `redHerrings[].suspicion` | `["span ids"]` | The spans that make this suspect look guilty | Counted as cited |
| `accusation.wrongTheory` | `{ "key": "Quill's line" }` | Replies to accusations that aren't a cast member (for example "the curse") | – |
| `revealSetting` | `"…"` | An opening stage-setting line before the reveal | Not counted in the 400-word reveal limit |
| `aside` | `[{ "where": "…", "text": "…" }]` | Script asides that aren't docs, reveal or epilogue | – |

- **Any other new field is a warning.** Put the content in `aside` or `art.notes` instead.
- **`accusation.wrongSuspect` keys must be cast ids.** Non-cast theories go in `wrongTheory`.

### More 1.1 fields
| Field | Shape | Meaning |
|---|---|---|
| `cast[].role: "answer"` | – | A revealed answer card (for example Case 4's Mr Osei, Case 1's Zuri). Not a suspect, and may be the culprit. Use with `unlockedBy`, or `unlockedBySpan` when a marked span reveals them. |
| `cast[].unlockedBySpan` | `"span id"` | Shows the card once this span is marked |
| `accusation.weakExamples` | `["span ids"]` | The script's examples of weak evidence (counted as cited) |
| `tutorial[].span` | `"span id"` | The span a tutorial step teaches on (counted as cited) |
| `talk` | `[{ "who": "…", "text": "…" }]` on a doc, interview, deduction or timeline | Agency banter that plays around that item |
| `deductions[].hints` | `["…"]` | Quill's graded hints for this link |
| `deductions[].label` | `"…"` | Short label shown on the gold string |
| `accusation.question` | `"…"` | The accusation prompt |
| `drill.instructions`, `drill.feedback` | `"…"` | Drill copy |

## Format 1.1: final field set (what the validator accepts)

**Cast roles:**

| Role | Meaning |
|---|---|
| `agency` | The detectives |
| `suspect` | Counted toward the level's suspect number |
| `culprit-hidden` | A suspect whose card appears only after a deduction |
| `answer` | A revealed answer card (Case 1 Zuri, Case 4 Mr Osei); not counted; may be the culprit |
| `adversary` | The Blot when accusable but not counted (Case 8) |
| `witness`, `helper`, `client` | Supporting cast |

**Interview question types:** who, what, when, where, why, how.

**Accusation fields:**

| Field | Meaning |
|---|---|
| `culprit`, `place`, `question`, `questionAfterReveal`, `note` | The accusation itself and its prompts |
| `minimalEvidence`, `acceptableEvidence` | The evidence that proves it, and other evidence that also counts |
| `evidenceRule` | A string or object, for example "any 3; D2 or D5 must be one" |
| `evidenceSpans` | Spans accepted as evidence |
| `partialEvidence` | The reply for the right suspect with half the proof |
| `wrongSuspect` | Cast id → Quill's line |
| `wrongSuspectPoints` | The spans each wrong-suspect line points to |
| `wrongSuspectFollowUp` | A follow-up line after a wrong accusation |
| `wrongTheory` | Non-cast theory → Quill's line |
| `weakEvidence`, `weakExamples` | The weak-evidence reply and the script's examples |

**More top-level fields:**

| Field | Shape | Meaning |
|---|---|---|
| `extraMarks` | `[{ "span": "id", "note": "…" }]` | Markable texture, motive or no-lead pins, not needed to solve (counted as cited) |
| `speeches` | `[{ "who", "title", "placement", "lines": [{ "slot": "hook\|point\|close", "text" }] }]` | Model speeches (Case 7's Felix), reusable by The Podium |
| `boardIntro` | `[{ "who", "text" }]` | Banter as the board opens |

**Nested fields some converters added** (for example `talk`, `hints`, `label`, `timeline.shake`) are allowed. The game may read them; the validator doesn't check them.

## Format 1.2: level-matched English exercises (owner, 5 Oct 2026)

**Every case carries a set of English exercises built from its own documents, served at the child's own English level.**
They are offered at **Quill's Training Desk** between chapters: optional, never blocking the case.

```jsonc
"exercises": [ {
  "id": "x1",
  "tier": "easier | at | harder",       // relative to the case level
  "level": 2,                           // 1–5; easier = case level − 1, at = case level, harder = case level + 1 (clamped)
  "type": "vocab-in-context | pronoun | punctuation | tense-sequence | fact-opinion | figurative | spelling |
           sentence-combine | word-parts | voice | inference | summarise",
  "skill": "vocab",                     // a bible Part 6 tag
  "strand": "word | sentence | reading | writing | speaking | literature | language",
  "objective": "s5-apostrophe",         // an English curriculum stop id when one fits (see objectives.txt), else null
  "chapter": 2,                         // offered after this chapter (1–5)
  "source": { "doc": "2.3", "span": "c-id or null" },   // the case document it is built from
  "prompt": "…",                        // quotes from the source are verbatim
  "options": ["…"],                     // multiple choice (≥ 3 options) — omit for typed answers
  "answer": "…",                        // string, or array for ordering
  "explain": "…"                        // shown after any answer; teaches
} ]
```

### Rules (validator)

**Count:** at least **12 exercises per case**, at least **4 per tier the case has**:

| Case level | Tiers |
|---|---|
| 1 | at, harder |
| 2–4 | easier, at, harder |
| 5 | easier, at |

**Variety:**
- at least **4 different types** per case;
- every type matches a skill the case teaches, or a strand skill.

**Sources:** `source.doc` exists, and `source.span` (if given) exists.

**Answers and options:**
- multiple choice has ≥ 3 options and includes the answer;
- options are not all the same length class. Avoid "the longest option is right".

**Level fit:** `prompt` sentences within the exercise level's sentence limit (bible Part 7).

**Safety:** kid-safe.

### How the game uses them
- **Serving:** the game serves the tier nearest the child's own English level (the app's level for that strand), so a level-2
  child replaying a level-3 case gets the easier tier.
- **Pay:**
  - `answer` 1 per right first try, at most 10 per case;
  - each right answer also earns 1 **ink** (the case's hint currency: score, never coins).
- **Learning credit:** a right answer is practice. The `objective` is credited by `mastery.js` only on a later day.
- **A miss** holds with `explain` until Continue.
