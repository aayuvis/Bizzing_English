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
narrator's voice (`en-IN-Chirp3-HD-Laomedeia` 1.02 — recorded narration approved by the owner), words lit
as she reads; then seven exercises built FROM that story: understand it (passes the Reading stop), its
words (Bee's meanings), the author's commas, rebuild the author's sentence, copy a line, say it aloud on
the Stage, talk about it (never marked). The whole book (Alice) is told the same way, a chapter at a
time, with a bookmark, the story so far, and the people met so far.

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
   card says why (`src/data/rights.js`). Grimm, Andersen, Peter Pan, Heidi and Eighty Days wait on a
   translator's or a UK right's confirmation.
2. **Never invent a quotation.** Every line of the hour is an exact substring of its held text;
   `test/texts.mjs` is the check-quotes lint. Bee's quotes are never imported (unsourced).
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

**Prove an assertion by breaking it.** Each check here was watched to fail: the drop-in hash, the
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

Commit first, then `cd app && ./deploy.sh`. It runs the tests and the browser check, builds,
replaces `gh-pages` wholesale and refuses to publish if the staged file count differs from the build.

## Where to pick up

1. **Story paintings** — 77 story and 12 Alice paintings are in (one re-rolled for lettering). A new passage
   gets its picture with `node tools/art/story-prompts.mjs && python3 tools/art/gen.py --group stories`,
   then LOOK, then `python3 tools/art/process.py --stories` (1280 for the stage, 480 for cards); until
   then it wears its shelf's world.
2. **Owner decisions still open** (SPEC §16):
   free vs family plan (as proposed: Word, Sentence and worlds 1–2 free); a 15+ Scholar band;
   domain and trademark checks.
2. **A named reviewer** for the 10 `needsReview` passages and 14 works; **rights confirmation** for the
   five gated works (translators of Grimm, Andersen, Heidi; Peter Pan's UK right; Verne).
3. **Phase 2–5 content** (SPEC §14): Reading levels with whole books chapter by chapter; Writing
   (dictation, imitation, paragraph); Speaking 2–10 and the Elocution Contest with Bee's rivals;
   Literature cards and appreciation games; the story of English. Every unbuilt level says so.
4. **Art:** the image key's credit ran out on 2 Oct; one avatar (the Laurel Eagle) still reads as an
   owl and should be repainted. Extras for the Shop.
5. **Bee data:** Bee's list at 28948f81c still holds proper nouns (hitler, stalin, helen…) — the
   import filters them out here; worth fixing at the source in Bee.

## Branch

Development happens on `claude/sweet-feynman-k4gg6s` unless told otherwise.

## Commit trailer

```
Co-Authored-By: Claude <noreply@anthropic.com>
```
