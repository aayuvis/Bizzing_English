# CLAUDE.md — Bizzing English

Read this first, then [docs/00-spec.md](docs/00-spec.md) (the spec and handover — binding), then
[app/README.md](app/README.md).

## What this is

**Bizzing English** — *Reading · Writing · Speaking — the language arts, through the classics.* A web
app for kids **6–14** that makes a child extremely proficient in English: word → sentence → reading →
writing → speaking → literature → language, taught through public-domain classics read in the
original. Sixth app in the Bizzing family (Bee, India, Finance, Maths, Geography; the Hive is
Bizzing_Schedule), living inside the family shell, wallet, avatars and Hive feed from its first commit.

The promise: *a child who reads the great books, writes a sentence worth reading, and can hold a room.*

**Live:** <https://aayuvis.github.io/Bizzing_English/> — served from the root of `gh-pages`.

**Mascot:** Quill, a fox with a quill (the owner's pick, 2 Oct 2026). Six poses in `app/public/mascot/`.

**The Library is a story room** (owner, 3 Oct: "like the Stories section of Bizzing India, with narration
and then exercises linked to it"). Every passage is told scene by scene over its painting in the family
narrator's voice (`en-US-Chirp3-HD-Laomedeia` 1.02, +8 dB — **US English**, the owner, 3 Oct: "the voice in the English app has to be US English, not Indian English"; the device fallback prefers en-US too), words lit
as she reads; then seven exercises built FROM that story: understand it (passes the Reading stop), its
words (Bee's meanings), the author's commas, rebuild the author's sentence, copy a line, say it aloud on
the Stage, talk about it (never marked). Two whole books — Alice and The Wind in the Willows — are told
the same way, a chapter at a time, with a bookmark, the story so far, the people met so far, and the
chapters' grown-up notes (`src/book.js` is the one place a book is added; `#/whole/<id>`).

**Writing and Speaking (Phase 3)** are built through level 10. Writing: copywork, dictation in the
narrator's voice, sentence imitation (a real sentence from a classic as the model, `src/writing.js`
checks the SHAPE — never the meaning), then the writing desk (paragraph, retelling, description,
persuasion, letter, essay, after a model): parts to write, a checklist the child ticks, COUNTS (never
marks). Speaking: read aloud, a poem learned by fading, recitation with expression marks, telling a
story, show and tell, one- and three-minute speeches with a planner, the Gettysburg Address, impromptu
with 30 s to think, and a debate on both sides — all measured on the device only. A piece of writing or a
speech is never machine-checked later: only a grown-up's rubric (1–4) on a later day makes it learned
(`mastery.judge`). Free writing and speech notes live in `k.writing`, which no backup carries (store v2
moved the talk-about-it thoughts there).

**Literature and Language (Phase 4–5)** are built through level 10. Their questions are WRITTEN
(`data/literature.js`, `data/language.js`), every quote an exact substring of a held text, every date or
origin sourced, run through the item engine as kind `authored` (`src/authored.js`) so `test/items.mjs`
holds them to the same rules (a which-word-in-this-line question must have every option in the line).
Literature 10 is a writing desk: the child's case for a book. Figure Hunt (Play) is built on the
figures bank. Every Language stop with a date waits on a named reviewer (`needsReview`).

**Reading's levels are its passages** (`model.levelStops`): the curriculum table lists none, and reading it left
every Reading level "not done", so Speaking and Literature never opened below band 3 — fixed 4 Oct. **Every level is filled** (70 of 70; `node tools/coverage/build.mjs` → `docs/coverage.html`, published as the
owner's coverage map): Word 6–10 (`data/word-stops.js`; level 7 is words from the Greek myths, `data/myth-words.js`,
each tied to the Reading 2 myth that tells it — Hawthorne, Kingsley, Bulfinch in `data/library-myths.js`),
Sentence 6–10 (`data/sentence-stops.js`), concept gaps (`data/gap-stops.js`: word classes, tense, apostrophes,
speech marks, opposites, a poem desk counted in lines), and Reading's drama, close reading, fairy tales, short
stories and non-fiction (`data/library-more.js`). The Library grows in beside-files merged by `library.js`.
A concept's status on the map is computed from the stops that exist.

**My Feed** is the sixth tab (FAMILY-STANDARD §6a; the family engine `integration/bizzing-feed.js`, pinned):
about twenty cards cut from the corpus at build time (`node tools/build-feed.mjs` → `src/data/feed/`, ≥100 per
level and ≥300 level-agnostic, nothing held for review), ranked on the device by the child's level and what
slipped, each saying why, a question answered on the card, a button to the exact topic — then it ends. A
grown-up can switch it off. **Games** (handover: `docs/inkwell/HANDOVER.md`, Part C): the Play tab is five cards, one in for
one out (`src/hubs.js` CARDS/LEDGER/LIVES_ON, T16) — **Inkwell Detective** (the flagship: `src/detective*.js` engine,
`views/inkwell*.js` screens, twelve cases in `data/cases/` released at the owner's word 8 Oct, four Ink Journeys held until
their quoted texts are held; Detective School carries Plot Line and Who Said It?), **Sentence Studio** and **Writer's
Craft** (hubs of modes), **Root Forge** (`src/forge.js`, local until a family forge is approved) and **Story Ears**
(`src/ears.js`). **The Podium** (`src/podium.js`) is the Stage's tournament, scored only on verified speech. Every game:
the owner's level rule (child picks 1–5 or Auto; under 50% drops one, 80% up), coins only for learning (a guessing bot
earns nothing, T1), one miss card (`src/miss.js`), the symmetric stage (`src/stage.js`).
**Music** (`src/music.js`): a loop per world, one for Home, four for games, composed in code. **Certificates**
(`src/certificates.js`) for every level and whole book finished; the report (`src/report.js`) always names
specifics; each coin line names what earned it (`k.coinNotes`).

**The Elocution Contest** (`src/contest.js`, `#/stage/contest`): a poem, a passage, a one-minute talk
against five of Bee's ten rivals. The child's points come ONLY from what the device measures (timing,
pace, pauses, volume), each labelled; the rivals' are the app's own, seeded, and the screen says so.
Bee owns spelling contests; this is speaking. **Extras** (`src/extras.js`): reading paper, bookplates,
stage curtains — drawn in CSS, fixed prices, the first of each free.

**The Atlas is a painted land** (`art/atlas.webp`, by day and night): each strand a place, with pins,
progress rings and the child's avatar where they are next; each strand opens onto a road of ten stations
with every stop a starred stepping stone. `ATLAS_PINS` in `views/atlas.js` are measured against the
painting — repaint it, re-measure.

## Working style (the user's pace)

Inherited from the family, and it holds here:

- **Work autonomously.** Stop only for a real fork, a destructive or outward-facing action, or
  missing information you genuinely can't infer.
- **Multitask.** Background long jobs; make independent edits and searches in parallel.
- **Bias to action, then verify.** `npm test` and `npm run check` rather than asking.
- **Batch and ship.** Group related edits into one commit with a clear message.

## Hard rules

### English (the ones specific to this app)

1. **Only public-domain texts are held, and only when ALL THREE markets clear them** (US: published
   ≤ 1930; UK/EU: author and translator dead 70+ years; India: 60+). The app never asks where a child
   is, so a work marked `check` anywhere is held back from every child: its text lives in
   `tools/texts/gated/` (never the published site), its passages and lines are not served, and its
   card says why (`src/data/rights.js`). Grimm (Taylor & Edwardes), Heidi (Edwardes) and Eighty Days
   (Towle) were cleared on 3 Oct 2026 from search-quoted sources — a human should click through them.
   Andersen (translator unknown), Peter Pan (GOSH's UK royalty, CDPA s.301), Pinocchio (no
   translation chosen) and The Hungry Stones (a translator's death date) still wait.
2. **Never invent a quotation.** Every line of the hour is an exact substring of its held text;
   `test/texts.mjs` is the check-quotes lint. **Bee's quotes** (owner, 3 Oct: "add bee quotes nonlabelled")
   are shown in Tools → Quotes & Poems exactly as Bee has them, in their own file — they never enter the
   lines of the hour, the feed or any question, which stay held-text only.
3. **Modern works are cards, never quotes:** our own summary and why it matters.
4. **Retellings are labelled** "Retold for younger readers — the original is in the Library".
   Today every passage is an original.
5. **Period attitudes are never silently cut.** A passage or work that carries one is
   `needsReview: true` with a grown-up note, until a named human reviewer clears it.
6. **Every question has one right answer that is not in its text, and no favourite slot.**
   `test/items.mjs` draws every key of every generator for every band (~50,000 items). It caught
   proper nouns hiding in Bee's list ("German Nazi dictator" → German) and definition-word leaks.
   **Never loosen it** — fix the generator or the import.
7. **Learned means remembered.** A stop is *passed* on its check; its objective is *learned* only on
   a check ≥ 8/10 on a LATER day, *mastered* a week after that; a slip drops ONE step
   (`src/mastery.js` is the only door). Mastery coins fire there, never on a level-up.
8. **The microphone** opens only from a real tap, every track stops the instant reading ends (also on
   leaving the page), and nothing is recorded — only numbers measured from loudness (time, pace,
   pauses, range). **No speech recognition** (the browser's sends audio away). The app never claims
   to mark what it cannot measure: expression is judged by the child and a grown-up, and the screen
   says which. `test/ui.mjs` proves the tracks end.
9. **Free writing is never scored by a program and never leaves the device.** No AI feedback on
   writing in v1 (needs the family server, consent and a privacy-page change first).
10. **Bee owns spelling competition.** English borrows Bee's words (definitions, sounds, origins) and
    links to Bee for contests; it never runs one.
11. **Anything drawn from Bee's list passes `src/safe.js`** (brief v4: the Typing Trainer asked a band-1 child to
    type "porn"; Bee defines "come" sexually; "crap" and "wank" were offered as made-up words). Typing, vocabulary
    decks, the definition and origin pools, Root Forge, the onset rivals (`nonWordSafe`), the sentences cut for the
    games and the idioms (`lineSafe`) all filter; a word the child TAPS in a classic still gets its meaning.
    `test/safe.mjs` scans every pool. Add to the lists; never loosen them.

### Product & code (inherited from the family, non-negotiable)

- **The chrome is the family shell** (`src/integration/bizzing-shell.js` + `.css`): `shell()` around
  every screen, `home()` for Home, `pageHead()` for every other screen. `checkShell` and
  `checkPageHead` must return `[]` (desktop and phone, light and dark). Never restyle the geometry —
  colours through `--bz-*` tokens only.
- **The drop-ins are byte-identical to Bizzing_Schedule's `integration/`**, pinned by hash
  (`test/family-pins.json`). Update by re-copying, never edit here.
- **Every interaction works by keyboard AND touch.** Items: 1–4, arrows, Space, Enter, Backspace.
- **A wrong answer holds until dismissed and explains on the exact item; a right one advances.**
- **Child data is minimal by construction**: first name, age band, avatar. Nothing is transmitted
  but one thing, named on the privacy page: a tapped word's recorded pronunciation, streamed from
  Bizzing Bee's own published clips (as Bee does). `test/ui.mjs` fails on any other request.
- **No ads, no streaks, no loot.** Good days are counted in a window; medals come from evidence and
  are celebrated once; coins only through `family.js` → the wallet, on standard events only.
- **All storage behind the `Store` seam** (`src/store.js`), versioned — add a `vN_to_vN+1` step.
- **State is a household.** A second child never inherits the first's anything.
- **The PIN is a salted hash, unlocked in memory, and a deterrent, not security** — the screen says so.
- **Backups are an allow-list** (`src/backup.js`): never a name, never a voice.
- **Icons are SVG from the family set** (English's lectern, quill, scroll, mic… were added to the
  shell). Zero emoji in controls and headings (the check counts them).
- **Never** put a real model identifier in commits, PRs, code, or any pushed artefact.

### Art

- `tools/art/gen.py` paints places, creatures, medallions — **no lettering, no digits, no people**.
  **One exception, Inkwell's cast** (owner, 8 Oct: human portraits, then "as avatars… consistent across frames with
  backgrounds changing"): each character painted ONCE as a transparent sticker cut-out (same scale and head height),
  every expression painted from that reference, composited by the screens over the scene plates
  (`app/public/art/inkwell/cast/`, manifest `src/data/inkwell-art.js`). Places and objects keep "no people".
  **And Mount Olympus** (owner, 9 Oct: "we need greek gods avatar pack"): eight figures from the Greek myths
  (`tools/art/olympus_prompts.py`, `OLYMPUS` in `data/avatars.js`), outside the family's 96 like Quill, sold in The
  Forum; never a face a sibling has (Bee's Zeus, Poseidon, Athena, Hades, Apollo). Every other avatar stays a creature.
  Never name a place in a prompt (it gets lettered). Night plates are painted FROM the day plate as a
  reference ("one single night picture, not a comparison") — asking for "the same place at night"
  painted split day/night diptychs.
- **Look at every image** (`tools/art/raw/`, gitignored), then `tools/art/process.py --all`. Stickers
  are keyed by flood-filling the magenta ground from the edges up to the white outline (a colour key
  ate the fox's red fur); `process.py` fails loudly on a ghost.
- The Gemini key lives at `/root/.gkey` (mode 600, `GKEY_FILE` overrides). Never in the repo.

## The family layer

- `src/family.js` — the only door to `bizzing.wallet` and `bizzing.activity` (app id **`english`**,
  registered in Bizzing_Schedule's wallet, activity and Hive `cats.js`). In `?demo` it is a no-op.
- `src/next.js` — **THE** next step. Home's Continue, `#/continue` and the end of the welcome ask it;
  an unfinished stop always comes back first.
- `src/medals.js`, the Shop (Avatars · Worlds · Extras + wallet history), the Collection (96 = 12 ×
  8, `validate()` = `[]`), six worlds by day and night, Settings in the family's five sections.
- `?demo` — Kavya, three weeks in, made by driving the engine; saves nothing.

## Verify

```bash
cd app && npm install
npm test                         # items (50k), banks, texts (quotes, rights), model, family, avatars, Bee manifest, games
npm run build && npm run check   # the BUILT app in Chromium under /Bizzing_English/, desktop + phone, light + dark
```

**Prove an assertion by breaking it.** Each check here was watched to fail — the latest: marking every
written question "which word in this line" tripped 985 items whose options were not all in the line.
Earlier: a planted POST of a child's desk writing tripped all three privacy checks; the drop-in hash, the
avatar shape, the later-day rule, the backup allow-list, the coin events, the Bee manifest, the
variety bonus (blind until a same-order case was added), phone overflow (the shell's sub-nav widened
the page through a grid `auto` column), contrast on the paintings, the microphone left on, and a
third-party font.

## Narration

```bash
node tools/voice/clips.mjs           # every clip, asked of the data (story scenes, Alice scenes, stop stories)
python3 tools/voice/tts.py [--only=st/] [--prune]   # key: /root/.gttskey (GTTS_FILE overrides), never in the repo
```
Each clip is linted (< −20 dB or < 0.35 s is rejected), written via a temp file, and re-recorded when its
text changes (the manifest keeps a hash). A sentence too long for the voice is given full stops at its own
semicolons and commas — for the voice only. No clip: the device's own voice reads it.

## Rebuild the data

```bash
node tools/texts/fetch.mjs        # GITenberg mirror (gutenberg.org is blocked here); gated works → tools/texts/gated/
node tools/texts/levels.mjs       # passages.json: the passages, Flesch–Kincaid, shipped works only
BEE_REPO=../Bizzing-Bee node tools/import-bee.mjs   # the lexicon and manifest from a pinned Bee commit (≥ 28948f81c)
```

## Ship

Commit first, then `cd app && ./deploy.sh`. The owner (3 Oct): every push comes from one chat — no slow gate.
`npm run verify` (tests + build + browser check) stamps the tree it passed; a deploy of the same tree publishes
at once, any other tree runs verify first; `--fast` skips it. It always replaces `gh-pages` wholesale and refuses
to publish if the staged file count differs from the build.

## Where to pick up

1. **Owner decisions still open** (SPEC §16): free vs family plan (as proposed: Word, Sentence and worlds
   1–2 free); a 15+ Scholar band; domain and trademark checks.
2. **A named reviewer** for the `needsReview` passages, works (now incl. The Wind in the Willows,
   chapters 5, 8, 10–12) and every dated Language stop (no OED page could be opened from here).
3. **Rights:** click through the three new clearances; Andersen's translator; terms with GOSH for Peter
   Pan; Pinocchio's translation; Panna Lal Basu's dates for The Hungry Stones.
4. **Bee:** `docs/bee-person-definitions.md` — 904 Bee words whose definition is a person (hitler at
   level 1, "begin" defined as Menachem Begin). Bee's cuts are the owner's call; the import filters them.
5. **More:** the 5 partly-taught concepts on the coverage map (spelling patterns live in Bee; semicolons;
   planning and drafting; an original story; homophones); Eighty Days has no passage yet; a third whole book.
6. **Home's daily goal is Bee's three rings** (owner, 10 Oct: "Bee's metrics are relevant… and an inbuilt coach" —
   supersedes the earlier "counts, never minutes"): **App time** (active minutes today from the family feed,
   `family.js activityLog`), **Practise time** (real seconds inside practice only — a stop or check, a story's
   exercises, a game round, Story Ears, an Inkwell case, the Podium or a Stage room, the desk, a Tools quiz or
   typing — tab visible, child active in the last two minutes; `src/practice-time.js` → `k.days[date].prac`) and
   **Right answers**, against per-child targets the grown-up sets (band defaults 15/10/10 · 20/10/15 · 30/15/20).
   No numbers inside the rings, a second lap past the target; the card never calls time learning. The rings open
   the Coach; the level strip along the foot stays the shell's link to the road. Every Home card opens its own
   topic (`test/ui.mjs` fails on a bare collection link).
7. **The Coach** (`#/coach`; Quill is the coach; `src/coach.js`, rulebook `src/data/coach-rules.js`,
   `src/views/coach.js`): Bee's coach desk — Quill's one-line read from the misses only (`k.misses`, and
   `k.slips` from games and tools), today's rings (→ `#/coach/days`, thirty days of bars against the target), the
   traps as a chart (tap, or the arrow keys), the chosen trap as meet it → see it (the rule, a check in your head)
   → watch it work → beat it (the stops that teach it). Hardcoded, offline, no model, no free text read. Every
   item kind, stop and game category sorts into exactly one of 19 traps; the desk and the Stage are never a miss
   (`UNMARKED`). An example that quotes is an exact substring of a held line and text. `test/coach.mjs` holds the
   maps, the rules and the clock; `test/coach-ui.mjs` the screens. The Practice page and the grown-ups' report
   name the top trap.

## Branch

Development happens on `claude/sweet-feynman-k4gg6s` unless told otherwise.

## Commit trailer

```
Co-Authored-By: Claude <noreply@anthropic.com>
```
