# Bizzing English — specification and handover (v1, 2 Oct 2026)

> **For the new chat that builds this app.** Read this end to end, then read
> [FAMILY-STANDARD.md](FAMILY-STANDARD.md) (binding), then Bizzing Bee's
> `spellbound-app/CLAUDE.md` (the richest record of what went wrong and why). Everything in §15
> was paid for once, in one of the five apps already built. Do not pay for it twice.

---

## 0. In one paragraph

**Bizzing English** makes a child *extremely proficient* in English. That means reading hard prose with ease, writing a clean and varied sentence, standing up and speaking well, and knowing the great works of literature as old friends rather than titles.

It teaches through the **classics** (public-domain texts, read in the original wherever a child can manage it), and climbs in a deliberate order:
1. **word** (spelling and vocabulary, borrowed from Bizzing Bee);
2. **sentence** (structure and grammar);
3. **reading**;
4. **writing**;
5. **speaking** (recitation, then oratory);
6. **literature appreciation**;
7. **language itself** (where English came from, rhetoric, style).

It is the sixth app in the Bizzing family, and it lives inside the family's shell, wallet, avatars and Hive from its first commit.

**Promise (for the landing page and every decision):** *A child who reads the great books, writes a sentence worth reading, and can hold a room.*

**Name and tagline:** **Bizzing English** — *Reading · Writing · Speaking — the language arts, through the classics.*
- "Language Arts" stays in the tagline for US parents.
- In India "English" can read as spoken-English coaching, so the India landing page should add "for confident readers, writers and speakers".

---

## 1. Who it is for

| | |
|---|---|
| Child | Ages **6–14** in three bands: **6–7 · 8–10 · 11–14** (Maths' bands). A **15+ "Scholar" band** is optional later; Bee goes to 15. |
| Parent | The diaspora (US, UK, Gulf, Canada, Australia) first, then India. Parents who want more than school ELA, often already Bizzing Bee families. |
| Benchmark parents compare with | Art of Problem Solving's Language Arts courses, IEW (Institute for Excellence in Writing), Classical Conversations / classical education, Wordly Wise, Khan Academy (grammar), CommonLit and ReadWorks (reading), Toastmasters Youth Leadership, LAMDA and Trinity speech-and-drama exams (UK/India). |

**How it differs from Bee.**
- **Bee** owns spelling, vocabulary breadth and the *competition* (Scripps-style). It answers "can you spell and know this word?"
- **English** owns everything a word is *used for*: sentences, reading, writing, speaking and literature.
- Spelling appears in English only as **the spelling of the words in the texts the child is reading** and as a strand that hands advanced children to Bee. Never duplicate Bee's competition engine; link to it.

---

## 2. The seven strands (the curriculum's spine)

The owner's order is the progression. Each strand has **10 levels**. A child moves through them in parallel, gated by the band and by the strand before (Maths' `worldOpen` pattern). They are *not* one long road.

| # | Strand | What "proficient" means at the top | Levels 1 → 10 (sketch) |
|---|---|---|---|
| 1 | **Word** — spelling and vocabulary | Spells and uses the vocabulary of the texts studied; knows roots, prefixes and suffixes; hands off to Bee for competition | Phonics and sight words → common roots → Latin and Greek roots → words from the classics read → register (formal and informal) |
| 2 | **Sentence** — structure and grammar | Writes simple, compound, complex and compound-complex sentences on demand; punctuates correctly; varies openings and length deliberately | Parts of speech → subject and predicate → phrases and clauses → conjunctions → punctuation → sentence combining → parallelism → periodic and loose sentences |
| 3 | **Reading** — the classics | Reads unabridged 19th-century prose fluently; answers literal, inferential and evaluative questions; reads aloud with expression | Fables → fairy tales → myths → children's classics (abridged, labelled) → children's classics (original) → short stories → novels in extracts → whole novels → essays → poetry close-reading |
| 4 | **Writing** | Writes a clear paragraph, a narrative, a description, a persuasive essay and a letter, each with a deliberate structure | Copywork and dictation (the classical method) → sentence imitation → paragraph → narrative retelling → description → persuasion → essay → creative piece after a model |
| 5 | **Speaking** — recitation, then oratory | Recites a poem from memory with expression; gives a structured 3-minute speech with eye contact, pace and pauses; argues one side of a motion | Read aloud → recite a short poem → recite with expression → tell a story → show-and-tell → a 1-minute speech → a 3-minute speech → declamation of a famous speech → impromptu → debate a motion |
| 6 | **Literature** — appreciation | Knows ~100 great works (author, era, story, why it matters); talks about character, theme, imagery and form; has favourites and can defend them | Story elements → character → setting and mood → theme → figurative language → poetic form → genre → literary periods → comparing works → "my case for this book" |
| 7 | **Language** — English itself | Knows where English came from (Old English → Norman French → Shakespeare → global Englishes); uses rhetoric (ethos, pathos, logos, tricolon, anaphora) knowingly; edits for style | Word origins → borrowed words → the story of English → Shakespeare's coinages → idioms → register and dialect → rhetoric's devices → style and editing → the King James and Shakespeare cadence → "World Englishes" (Indian English included) |

**Every stop teaches in Maths' pattern:** Story → Learn (the *why*, worked on an example) → Your turn → Check. The check runs **on a later day** (India's `ledger()` rule): a check on the same day is practice, not learning.

**Mastery is evidence-based and spaced.** It sits per objective (Finance's `mastery.js` pattern), in "I can…" sentences (Maths' `objectives.js`).

**Assessment is separate from teaching.** A **transfer** check is never on the surface it was taught on (Finance's rule).

---

## 3. The classics: what may be taught, and how

**The rights rule (hard).** Only **public-domain** texts are reproduced in full or at length.
- **US:** published **1930 or earlier** (as of 1 January 2026; one more year opens each January).
- **UK and EU:** author died **70+ years** ago.
- **India:** author died **60+ years** ago.
- A text ships only when **all three markets** clear it, *or* the app gates it by locale and says why.
- Each text carries `rights: { us, uk, in, basis, checked }` and a `sources[]` naming the edition (Project Gutenberg number, or a scholarly edition).
- **Modern works** (after the line) appear only as **title, author, a one-paragraph summary in our own words, and why it matters**: never quoted at length, never "abridged". Copyrighted speeches (e.g. Martin Luther King Jr.'s, Churchill's) are in this category: summary and context only.

**Retellings and abridgements are labelled**, exactly like Bizzing India's 🪔 badge.
- An abridged *Oliver Twist* says **"Retold for younger readers — the original is in the Library"** and links to it.
- A child is never told a retelling is the original.

**Never invent a quotation.** Every line attributed to an author is quoted from the cited edition. A lint (`check-quotes`) fails any `"quote"` whose text is not found in its source file.

**Bee's warning:** Bee's `quotes-lib.js` carries popular attributions that are not sourced; one is a famous Edison quote. **Do not import Bee's quotes.** Quote only from texts you hold.

**Breadth and fairness.** The canon is not only English and British. A starting list, all public domain in the original or in a PD translation:

| Shelf | Examples |
|---|---|
| Fable and myth | Aesop · Panchatantra (PD translation) · Jataka tales · Norse and Greek myths (Bulfinch) · Grimm · Andersen · Arabian Nights (Lang) |
| Children's classics | Alice · The Jungle Book · Just So Stories · Peter Pan · The Secret Garden · Black Beauty · Treasure Island · The Wind in the Willows · Heidi · Little Women · Anne of Green Gables |
| Novels and stories | Dickens · Austen · Twain · Stevenson · Doyle (Holmes) · Wells · Verne (PD translations) · Tagore (PD English, e.g. *The Home and the World* where clear) · O. Henry · Saki |
| Poetry | Shakespeare's sonnets and songs · Blake · Wordsworth · Keats · Tennyson · Longfellow · Dickinson · Frost (pre-1931 poems only) · Kipling · Tagore's *Gitanjali* (1912) · Sarojini Naidu (pre-1931, check India term) · Stevenson's *A Child's Garden of Verses* |
| Drama | Shakespeare (abridged scenes first, then the original) · Wilde |
| Speeches (§5) | Lincoln (Gettysburg) · Pericles' Funeral Oration (PD translation) · Sojourner Truth · Frederick Douglass · Vivekananda (Chicago, 1893) · Tagore's addresses · Gandhi (check per market) · Nehru's 1947 address (rights: verify per market before shipping) |
| Essays | Bacon · Lamb · Emerson · Thoreau · Montaigne (PD translation) |

**Diaspora fit.** Include Indian writers in English (Tagore, Naidu, Toru Dutt, Vivekananda) as *part of the canon*, not a separate shelf. **Coordinate with Bizzing India:** India owns Indian *stories and culture* (Panchatantra, epics, Itihaas). English owns *literature in English and the craft of reading it*. Where a text sits in both (Panchatantra), English links to India's telling rather than writing a second one: the same "a copy is a fork" rule Bizzing-Videos keeps.

**Sensitive content.** Many classics carry the prejudices of their time (empire, race, gender). Handle them **in Bizzing India's way**:
- Never silently bowdlerise an original.
- Choose extracts with care, and flag a passage with a short, age-banded note for the grown-up.
- Mark such stops `needsReview: true` until a named human reviewer clears them.
- Never present a period attitude as the app's own.

---

## 4. Reading: how it works

- **Levelled texts.** Every passage has a **readability score**: Flesch–Kincaid computed at build time, plus a hand override for verse and archaic prose. It also has a **vocabulary load**: the share of words outside the child's known list.
- A child reads at "comfortable" (≤ 3% unknown words) or "stretch" (≤ 8%), never "frustration".
- **Tap any word** to see its meaning, pronunciation, origin and a memory hint. That uses Bee's corpus (§9), and the tap adds the word to the child's **word bank**.
- **Read-along.** Each passage has a recorded narration (§10), with words highlighted in sync.
- **Questions in three depths:** literal ("what did…"), inferential ("why did…"), evaluative ("was she right to…").
  - Literal and inferential questions are machine-checked: options permuted, answer not leaked, answer slots even (Finance's `shuffledDrill`).
  - **Evaluative questions are never machine-marked** (§6.3).
- **A whole book.** Whole novels are read chapter by chapter, with bookmarks, "the story so far", and a character list that grows as the child meets each character, never spoiling ahead.
- **Reading log, not reading time.** The report counts books, chapters and passages *understood* (questions right on a later day), never minutes read.

---

## 5. Speaking and oratory

This is the strand most likely to break the family's privacy rules. Read it twice.

**The microphone (Finance's rules, verbatim):**
- The mic opens **only from a real tap**.
- Its track **stops the instant recording ends**. A stream left open is a microphone left on.
- **A recorded voice never leaves the device.** It is not uploaded, not in the backup allow-list by default, and not sent to any speech service.

**No cloud speech recognition.** The browser's Web Speech API (`SpeechRecognition`) in Chrome sends audio to Google's servers. **It is forbidden.**
- What the app may measure is what it can measure **on the device, honestly**, with a WebAudio analyser:
  - **duration**;
  - **pace** (words per minute, from the known text ÷ duration);
  - **pauses** (silence detection);
  - **volume range** (projection);
  - **"um"-free stretches**, only if detectable without recognition.
- If on-device recognition becomes available (a WASM model shipped with the app), it needs the owner's sign-off and a privacy-page update **first**.

**The app never claims to mark what it cannot mark** (Bizzing India's rule).
- "You spoke for 2 min 48 s at 132 words a minute, with 11 pauses" is measured and true.
- "Great expression!" from a program that cannot hear expression is a lie.
- Expression, eye contact and persuasiveness are judged by the **child (self-review)** and a **grown-up (listen-back rubric behind the PIN)**, and the screen says which.

**The ladder:**
1. Read aloud.
2. Recite (memorise with a fading-text method).
3. Recite with expression.
4. Tell a story.
5. A 1-minute speech from a template (hook · three points · close).
6. A 3-minute speech.
7. **Declamation**: deliver a famous public-domain speech.
8. Impromptu speaking from a prompt.
9. **Debate**: argue one side of a motion, then the other.

**The Stage.** This is the oratory world, modelled on Bee's Big Stage and its mock contest.
- An **Elocution Contest** mode mirrors Bee's Mock Bee: a recitation piece, a timer and a rubric.
- Its rivals are Bee's same ten rivals (family cast consistency).
- It is never a leaderboard against real children.

**Rhetoric taught by use.** The child tags devices (anaphora, tricolon, antithesis) in Lincoln or Pericles, then writes a speech using them. The Language strand (7) supplies the names.

---

## 6. Writing

### 6.1 The classical method first
- Copywork, then dictation, then imitation, then original writing.
- Copywork and dictation are **checkable**: diff against the source text, with errors highlighted by kind (spelling, punctuation, capitals).
- Imitation is "write a sentence with this structure about your own subject", checked for *structure*: the clause pattern, by a parser over simple patterns, not a grammar engine. The screen says it checked the structure, not the meaning.

### 6.2 Sentence work is machine-checkable; use that
- Combining, punctuating, reordering, identifying clauses and correcting errors all have one right answer, or a small known set. Build these as **item types beyond multiple choice**: drag to reorder, tap to punctuate, type to combine.
- The audit's weakest learning element across the family was **E4 item-type variety**. English must lead on it.

### 6.3 Free writing is kept, never scored by a program
- Paragraphs, stories and essays are saved **on the device only**. The child's free text is the most personal data in the family. Never transmitted, never analysed off-device.
- The app offers **checklists the child ticks** ("my paragraph has a topic sentence") and **countable facts** (sentence count, average length, varied openings, the words from this week's list that were used), and labels them as counts.
- A **grown-up rubric** behind the PIN marks quality.
- **AI feedback on writing is not in v1.** It would require sending a child's text to a server, which the family's privacy promise forbids. If the owner wants it later, it needs the family server, explicit grown-up consent per child, a privacy-page change *first*, and no storage of the text by the provider. Record it as an open decision; do not build towards it quietly.

---

## 7. Literature appreciation and Language

- **Literature** is knowing the works.
  - **A Library card per work:** title, author, year, an era badge, a one-line "why it matters", a summary in our own words, famous lines (sourced), "if you liked this…", and whether the full text is in the app.
  - Goal: the ~100 works of §3 by age 14, as **"I have met"** (read an extract and answered on a later day) and **"I have read"** (the whole work, chapter checks passed).
  - **Appreciation activities:** "Find the simile", "What is the mood here?", "Defend your favourite" (spoken or written; kept, not scored), "Who said it?" matching (from held texts only).
- **Language** is English itself.
  - Timelines: Old English, then 1066, then Chaucer, then Shakespeare, then the King James Bible, then Johnson's dictionary, then global Englishes.
  - **Borrowed words**: Hindi and Urdu loans such as *bungalow, shampoo, jungle, pyjamas*, a lovely diaspora hook.
  - Shakespeare's coinages; idioms and where they come from.
  - **Every dated fact carries `sources[]`.** Never write history from memory (India's rule); a `check-facts` lint holds it.

---

## 8. Structure inside the app

**Tabs** (every number in §8a; §4 of the standard: style and placement are Bee's, names may differ, 4–5 tabs, Home first, map second): **Home · Atlas · Library · Stage · Play**.
- **Atlas** is the strand map and the journey.
- **Library** holds the classics, word cards and Literature cards.
- **Stage** is speaking.
- **Play** holds the games.
- Practice, Medals, Shop, Collection, Settings, Grown-ups and the reading log live in **☰**.

**Home is exactly Bee's three rows**, rendered by `home()` from the family shell:
- **Row 1:** greeting (mascot plus a line from the last session) · daily ring (+ "Your level") · **Word of the hour** (from the passage being read, not random).
- **Row 2:** **Next on your journey** (the ONE filled Continue) · the **book you are reading** (outline button: "Read on").
- **Row 3:** a **tip** ("Read it aloud once — your ear catches what your eye skips") · a **line of the hour**: a *sourced* quotation from a held text, with the book linked.

**Worlds** (at least six, §7 of the standard: painted day and night plates, three ambient layers, a music loop, two avatar packs each). A starting set, every one a place that can be painted without lettering:
1. **The Story Garden** — fables and fairy tales (6–7 opens here)
2. **The Lamplit Study** — Victorian novels, candles, rain on the window
3. **The Globe** — an open-air wooden playhouse, Shakespeare
4. **The Forum** — oratory, columns and steps. Bee's Roman Forum region exists, so paint it distinctly.
5. **The Scriptorium** — the story of English, manuscripts, quills
6. **The Poet's Lakeside** — Romantic poetry, mist and hills
7. *(later)* **The Monsoon Verandah** — Tagore, Naidu and Indian English

**Prompt trap:** name a place in a prompt ("THE GLOBE THEATRE") and the model letters it on a sign. Describe it without its name.

**Mascot.** One mascot, six poses (wave, cheer, think, point, sleep, oops), on the app icon, logo, greeting, finishes, and empty and error states. Generate three concepts and **let the owner pick** (as was done for Octo, Shelly and Pip). Candidates that suit speaking and reading:
- a **raven** (Poe, eloquence; distinct from every sibling);
- a **parrot** (speech, but India already uses Mithu);
- a **bookworm caterpillar** that becomes a butterfly as the child climbs;
- a **fox with a quill**.

Avoid owls (Geography's former guide; overused).

**Games** (the learning is the mechanic; Maths' and Bee's rule):
- **Sentence Builder** — drag clauses to build the target structure; scored on correctness, then variety.
- **Punctuation Rush** — a passage scrolls and you tap where the commas go; Bee's Type Blaster juice.
- **Who Said It?** — match lines (held texts only) to characters or authors.
- **Plot Line** — order a story's events.
- **Root Forge** — combine roots into real words (Bee's corpus checks they are real).
- **Figure Hunt** — find the simile, metaphor or alliteration in a passage against the clock.
- **Rhetoric Duel** — pick the stronger version of a sentence and say why; scored on the reason chosen.
- **Elocution Contest** (Stage).

Every game meets §14 of the standard: title card, how-to, motion and sound on every answer, finish screen showing what was practised, keyboard **and** touch, no luck.

---

## 8a. Layout specification — measured from Bizzing Bee

Every number below was **measured from Bee's live DOM** on 2 Oct 2026, at **1280×800** (desktop) and **390×844** (phone). `integration/bizzing-shell.css` implements these numbers. **Use the shell; do not rebuild any of this.** These tables are for reading and for review, not for re-typing into CSS.
- `checkShell` holds the top bar, tabs, drawer and Home to these numbers within ±3–5px.
- `pageHead()` (added to the shell for this spec) does the same for sub-pages.

Units are CSS px as rendered. A "—" means the value follows from the content.

### 8a.1 The frame

```
desktop 1280                                     phone 390
┌──────────────────────────────────────────┐    ┌───────────────────────┐
│ sticky header 111  (bar 56 + tabs 54 + 1)│    │ header 104 (2 rows)   │
├──────────────────────────────────────────┤    ├───────────────────────┤
│   content column 1177 max, centred,      │    │ content 360 wide,     │
│   side padding 35  → cards span 86–1193  │    │ side padding 15       │
│   top padding 20, bottom 65              │    │ top 19, bottom 110    │
│                                          │    │                       │
│                                          │    ├───────────────────────┤
│                                          │    │ tab bar 68 (fixed)    │
└──────────────────────────────────────────┘    └───────────────────────┘
```

| Token | Desktop | Phone |
|---|---|---|
| Breakpoint | > 720 | ≤ 720 |
| Content max width | 1177 (centred; at 1280 it starts at x = 51) | full width |
| Side padding | 35 | 15 (bar: 14) |
| Header (sticky, z 20) | 111 = bar 56 + tab row 54 + 1 border | 104 = icon row (y 9, 37 tall) + search row (y 53, 41 tall) |
| Header background | `--bz-hdr`, 82% opaque, `backdrop-filter: blur(10px)`, 1px `--bz-line` bottom border | same |
| Content top padding | 20 | 19 |
| Content bottom padding | 65 | 110 (clears the tab bar) |
| Grid gap (all home rows) | 13 | 13 |

### 8a.2 Top bar (56 tall desktop; first row of the phone header)

The order is fixed. **x positions are at 1280.**

| # | Element | Desktop rect (x, y, w, h) | Phone rect | Style |
|---|---|---|---|---|
| 1 | ⬡ Back to the Hive | 86, 7, 41, 41 | 14, 9, 37, 37 | Icon button: radius 12 (11 phone), `--bz-chip` fill (ink at 7%), icon 21 |
| 2 | ☰ Menu | 136, 7, 41, 41 | 55, 9, 37, 37 | as above |
| 3 | Logo (mascot + wordmark) | 187, 7, —, 41 | 96, 9, 28, 37 (mascot only) | Mascot 37×41. Wordmark: Fraunces 800 21.8px, letter-spacing −0.2; "Bizzing" in italic ink, app name in the accent. Gap 10. **Tap = Home.** |
| — | *(flexible space)* | | | The logo carries `margin-right: auto` |
| 4 | Search | 541, 7, 414, 41 | 14, 53, 363, 41 (own row) | Pill (radius 999), `--bz-chip` fill, 1px line, padding 9/36/9/41, Hanken 700 14.7px, search icon 19 at left 14. **Sits 9px left of the coin chip.** |
| 5 | Coin chip | ends at x 1030; min-width 66; 40 tall | 37 tall | Pill, gradient #ffd24d → #f0a93c (135°), inset shadow 0 −2 0 rgba(0,0,0,.12), text #5a3d00, Hanken 900 14.2px, coin icon 17, gap 6. **Opens the wallet history.** |
| 6 | Theme | 1039, 7, 41, 41 | 37×37 | Icon button; moon in light mode, sun in dark |
| 7 | 🔒 Grown-ups | 1089, 7, 41, 41 | 37×37 | Icon button; opens the PIN |
| 8 | Child switcher | ends at x 1194; 41 tall (≈ 55 wide) | 37 tall | Pill, `--bz-chip` fill, 1px accent-tint border, avatar 34 (29 phone) in a white circle, ▾ caret 10px |

Gap between bar items: **9** desktop, **4** phone. The ⬡ hides (`visibility: hidden`, so nothing moves) only inside a timed drill or game.

### 8a.3 Tab row (desktop) and tab bar (phone)

| | Desktop tab row | Phone tab bar |
|---|---|---|
| Position | Directly under the bar, y 56; row height 54 with 10 padding below | Fixed to the bottom, full width, 68 tall (+ safe area) |
| Items | 4–5 **equal-width** tabs (`flex: 1 1 0`), gap 7, spanning x 86 → 1193 | 4–5 equal items, min 53 tall, padding 7 7 8 |
| Item | Height 45, padding 11/13, radius 999, icon 23 + label, gap 9 | Icon 25 above label, gap 3, radius 14 |
| Label | Fraunces 800 16.4px, letter-spacing 0.16 | Hanken 700 12px |
| Idle | Text `--bz-muted`; icon in its tab colour (Bee: #6C4FE0 · #6C4FE0 · #E0457B · #16956B · #3D7DF0) | Text and icon `--bz-muted` |
| Hover | `--bz-chip` fill | — |
| Active (`aria-current="page"`) | **Filled pill in `--bz-accent`, white text and icon** | Accent text and icon on a 12% accent tint |
| Background | Transparent (on the header blur) | `--bz-tabbar`, 94% white, blur 10, 1px top line |

**English's tabs:** Home (home) · Atlas (map) · Library (book) · Stage (an SVG lectern, to be added to the icon set) · Play (play).

### 8a.4 ☰ Drawer

| | Value |
|---|---|
| Panel | Left edge, full height, **327 wide** (max 88vw), white `--bz-card`, shadow 0 24 64 rgba(26,21,35,.2), padding 10/10/24, slides in over 180 ms (none under reduced motion) |
| Scrim | Fixed, 50% black; tap closes |
| Header | Avatar 46 (circle) · name (Fraunces 800 19) over "level · coins" (12.5 muted) · sound button · close button; 1px line below |
| Item | Grid of 34px icon column + text: icon 20 in the accent; title Hanken 700 16; subtitle 12.5 muted; padding 9/6; radius 12; hover `--bz-chip` |
| Order (fixed) | My page · Shop · Collection · Medals · ── **BIZZING ENGLISH** (section label: 11.5px, 800, uppercase, letter-spacing .08em) up to 4 app items ── · Settings · Grown-ups · Help · Privacy · Back to the Hive |
| Behaviour | Opens on ☰ (focus moves to its first item) · **Esc closes** · Tab is trapped inside · focus returns to ☰ · a route change closes it |

English's four app items: **Reading log · Word bank · My recordings · Practice**.

### 8a.5 Home (Bee's three rows; `home()`)

```
desktop                         x: 86 ─────────────── 1193
row 1  y 131  ┌ greeting 360 ┐13┌ daily ring 360 ┐13┌ … of the hour 360 ┐   h ≈ 207 (all three equal)
row 2  y 350  ┌ NEXT ON YOUR JOURNEY 547 ──────┐13┌ the book you're reading 547 ┐   h ≈ 280–300
row 3  y 664  ┌ tip 547 ───────────────────────┐13┌ line of the hour 547 ───────┐   h ≈ 144
footer        privacy · trademark, centred, 13px muted, 26 above
```

| Card | Size and style | Contents (English) |
|---|---|---|
| **Top tile** (rows 1, 3) | Radius **28 / 11** (asymmetric, Bee's), 1px warm hairline `--bz-card-line`, shadow 0 1 2 rgba(26,21,35,.05), padding 15, min height 194 (row 3: 144). A **hexagon pin** 14×16 in `--bz-pin` sits at top −7, right 22. | — |
| Greeting | Mascot 150×164 left; gap 15; "Good afternoon," (14.5 muted), the name (Fraunces 800 24), bubble (chip fill, radius 14, padding 9/12, italic 14.2, line-height 1.45) | A line from the last session: "You met Mowgli yesterday — the wolves are waiting." |
| Daily ring | No padding on the card: the ring area (padding 15) over a foot bar (chip fill, 1px line above, padding 12/18) showing "YOUR LEVEL" (11, 800, uppercase, .1em) and the level (Fraunces 800 16) | Ring: words met · pages read · minutes spoken (targets set by the grown-up) |
| … of the hour | Radius 15, wash from `--bz-hour` to white at 62%, padding 15/17; badge 48 (radius 14) + kicker (11.5, 800, uppercase, .1em, gold #8a5a00) + title (Fraunces 800 24) + text 14.2 muted | **Word of the hour**, taken from the passage the child is reading |
| **Journey card** (row 2) | Radius 15, 1px `--bz-line`. Plate 100 tall. Badge 48 overlapping the plate edge by 22 at left 16, with a 3px card-coloured ring (orange #E8842C on the first card, accent on the second). Chip row: dark chip (#1f1a2e, white 12.5/700) right-aligned. Body padding 4/16/15: kicker (14.2 muted), title (Fraunces 800 24), line (14.2 muted), then a button and a progress bar. | Left: **Next on your journey** (the ONLY filled button: Continue). Right: **the book you're reading** (an outline button: Read on, plus a chapter progress bar). |
| Button | Height 44, radius 12, padding 0 20, Hanken 700 16.4, icon 17; primary = accent fill with inset 0 −3 0 rgba(0,0,0,.18); outline = card fill and 1px line | — |
| Progress bar | 6 tall, radius 99, track at 18% accent, fill in the accent; label 12.5 muted below | — |
| Tip / quote (row 3) | Top-tile style, padding 18/20, min height 144. Tip: kicker + text 15.3/1.5 + a round 48 arrow badge at right. Quote: a quote badge + kicker + italic Fraunces 600 16.4/1.45 quotation + "— author" | Tip: a reading or speaking tip. Quote: **a line of the hour, from a held text only**, linking to the book. |

**Phone order** (single 360 column, gap 13): greeting → next on your journey → daily ring → … of the hour → the book → tip → quote → footer. The greeting mascot shrinks to 120×140. **Continue must be wholly above the fold at 390×844.**

### 8a.6 Sub-pages: the page head, sub-nav and progress strip (`pageHead()`)

Every screen except Home opens with one of Bee's two heads, **20 below the header**.

**A. Tab-root head** (Atlas, Library, Stage, Play: the first screen of a tab). Measured from Bee's `#/atlas`.

| Part | Desktop | Phone |
|---|---|---|
| Row | Height 37, inset 20 from the content edge (title starts at x 106) | No inset |
| Title | Fraunces 800 24, line-height 1.15, left | Wraps |
| Subtitle (optional) | Fraunces 400 13 muted, baseline-aligned, gap 10 | Wraps under the title |
| Action chips (right) | Height 37, padding 0 15, radius 999, chip fill + 1px line, Hanken 800 13.6, icon 15, gap 6; chips 8 apart; e.g. **Revise · My traps** at x 965 (92 wide) | Wrap under the title |

**B. Deeper head** (any page below a tab root). Measured from Bee's `#/library`.

| Part | Desktop | Phone |
|---|---|---|
| Back pill (left) | **90×34** at x 86: radius 999, chip fill + 1px line, padding 0 15 0 12, chevron 14 + the parent's name (Hanken 800 14.2). **Always names the parent ("‹ Library"), never just "Back".** | 15, 123, 90, 34 |
| Title | **Centred** across the row: Fraunces 800 21.8 + subtitle Fraunces 400 13 muted, gap 10 | Second row, 12 below the pill, left with a 15 inset (title at x 30, y 169) |
| Actions (optional) | Right-aligned chips, as in A | Wrap |

**C. Sub-nav** (sections within a page, e.g. Library: **Books · Words · Poems · Speeches · Authors**):
- 13 below the head, inset 20, gap 8.
- **2–6 chips**, same chip style as A.
- **The active chip is filled with the accent and has white text** (the same language as the active main tab).
- It scrolls sideways on a phone with no scrollbar, and never wraps.
- Each chip is a route (`#/library/poems`), so back works.
- **Never nest a second sub-nav.** A third level is a deeper page with a back pill.

**D. Progress strip** (optional, under the head or sub-nav). Measured from Bee's Atlas tier strip:
- White card, radius 17, padding 13/17, min height 55, inset 20, 13 below.
- A tier chip on the left (Fraunces 800 14.2, accent text on a 12% accent tint, radius 999, padding 5/13), a flexible 6px bar, and a label on the right (Hanken 700 13 muted).

**Spacing rhythm on sub-pages:**
- header → head **20**;
- head → sub-nav **13**;
- sub-nav → strip **13**;
- strip → first card **13**;
- between cards **13**;
- content → page bottom **65** (desktop) or **110** (phone).

### 8a.7 Icons

| Rule | Value |
|---|---|
| Set | The shell's `icon(name)` set: 24×24 grid, **2px stroke, round caps and joins, `currentColor`, no fill**, `aria-hidden`. Extend it in the same drawing style (lectern, quill, scroll, theatre mask, microphone, open book, speech bubble); never mix in another icon family. |
| Sizes | Top bar **21** (in a 41 button) · tab row **23** · phone tab bar **25** · drawer **20** · chips **15** · back chevron **14** · buttons **17** · search **19** · coin **17** · badges **24** (in a 48 tile) |
| Colour | Inherits text colour. The tab row gives each tab its own icon colour (§8a.3). Drawer icons use the accent. Badges are white on orange #E8842C or #E8962C, or on the accent. |
| Emoji | **Never in a control, tab, heading or chip** (counted by the check, which must find 0). Emoji may appear only as *content* (a sticker a child chose). |
| Touch targets | ≥ 44 everywhere except the top bar's Bee geometry (41 desktop, 37 phone), which the shell keeps for parity. Do not add new controls below 44. |

### 8a.8 Type and colour tokens

| Role | Face | Size / weight |
|---|---|---|
| Wordmark | Fraunces | 800 21.8 |
| Tab label | Fraunces | 800 16.4 |
| Card titles, page titles | Fraunces | 800 24 (deeper page 21.8) |
| Kickers | Hanken Grotesk | 800 11.5, uppercase, letter-spacing .1em |
| Body, UI | Hanken Grotesk | 400–700, 14.2–16.4 |
| Numbers, words-as-objects | Sono | — |
| **Reading passages (English only)** | A book serif (Literata, Newsreader or Source Serif, self-hosted) | **≥ 18**, line-height ≥ 1.6, measure 60–75 characters, never justified, never letter-spaced |

| Token | Light | Dark (`html[data-bz-dark]`) |
|---|---|---|
| `--bz-accent` | the app's brand colour (English: choose one, AA on white with white text) | same, or a lighter tint if AA needs it |
| `--bz-ink` / `--bz-muted` | rgb(36,30,51) / rgb(106,100,120) | #ece8f6 / #b4adc6 |
| `--bz-card` / `--bz-line` | #fff / rgb(233,229,240) | #221d33 / #3a3350 |
| `--bz-chip` | ink at 7% | white at 9% |
| `--bz-hdr` / `--bz-tabbar` | lilac at 82% / white at 94% | #181425 at 82% / #1c182a at 94% |
| Kicker gold / pin | #8a5a00 (6.1:1) / #f0b429 | #f0c46a / #f0b429 |

### 8a.9 Motion
- Drawer: 180 ms ease-out slide from −24px.
- Hover fills: instant.
- Legendary avatar shimmer: 3.2 s.
- World ambient layers pause when the tab is hidden.
- **Everything freezes under `prefers-reduced-motion`.**
- No load screens (owner, 2 Oct).

---

## 9. Borrowing from Bizzing Bee

Bee is the richest asset in the family. Borrow a lot; **never fork it**.

| Bee asset (in `aayuvis/Bizzing-Bee`, `spellbound-app/`) | What English uses it for |
|---|---|
| `words-full.js` / `words-data*.js` (~128k words: definitions, parts of speech, examples) | Tap-a-word, the word bank, vocabulary checks, readability "unknown word" counts |
| `words-lore.js` (etymology + memory hint) | The Word strand's roots, and the Language strand's word origins |
| `concepts-data.js`, `adv-concepts-data.js` (122 concept chapters: roots, suffixes, rules) | Word-strand lessons; cite them, don't rewrite |
| Recorded word audio (`voice/`, `voice-cdn.js` streams 128k clips from Bee's `main`) | Pronunciation on every tapped word |
| `trivia-words.js` and the word-bank themes | Seeds for Language-strand quizzes |
| The ten rivals and the Mock Bee rules | The Elocution Contest cast and rules |
| `bizzing-bee-books` repo (24 volumes, 488 plates) | Cross-promotion: "Read the Bizzing Bee library" |

**How to borrow.**
- A build-time **import script** (`tools/import-bee.mjs`) reads a pinned commit of Bee and writes only the fields English needs into `app/data/bee-*.js`.
- It also writes a **manifest** recording the Bee commit, file hashes and record counts, plus a test that fails if the manifest and the data disagree.
- Never hand-edit imported data. Fix it in Bee and re-import.
- Word audio streams from Bee's existing CDN path (`voice-cdn.js`), so nothing is duplicated.
- **Do not import:** Bee's quotes (unsourced), Bee's avatars (English draws its own 96, and no face appears in two apps), Bee's deity, World Changers or Champions packs (Bee's own).
- **Proper nouns:** Bee's agent removed about 1,800 proper-noun records from the spelling corpus on 2 Oct. Import from a Bee commit **after** `28948f81c`.

---

## 10. Audio

- **Music:** composed in code (WebAudio), with one loop per world, one for Home and one for the games. Default 40%, ducks under voice, pauses when hidden, off in Calm mode. Add `music/CREDITS.md`.
- **Narration matters more here than in any sibling.** Read-along and recitation models need it.
  - The family's current rule is "no new narration" (owner, 2 Oct, for the existing apps). **Ask the owner before recording any.** Recommend recorded narration for passages and speeches in v1.
  - If approved, use the family narrator (`en-IN-Chirp3-HD-Laomedeia` at 1.02). Consider a second voice for poetry and drama with the owner.
  - **Clip lint** (Bee's lesson): reject anything under −20 dB or shorter than 0.35 s.
  - **A failed batch leaves old clips on disk.** Find stragglers by modification time.
- **Effects:** right · wrong · finish · medal · coin · unlock, synthesised, under one mute.

---

## 11. The family layer: what to wire on day one

Copy these **byte for byte** from `aayuvis/Bizzing_Schedule` `integration/` (branch `claude/amazing-knuth-4aemgz`), and add a test that pins their hashes. They are updated by re-copying, never edited here.

| File | Use |
|---|---|
| `bizzing-shell.js` + `.css` | `shell()` around **every** screen, `home()` for Home, `bindShell()` once. Colours only via `--bz-*`; never restyle the geometry. |
| `shell-check.mjs` | `checkShell(page, {phone})` in the browser check, on Home with a child, desktop and phone, light and dark: **must return `[]`**. |
| `bizzing-wallet.js` | Bizzing coins: answer 1 · stop 5 · contest 10 · mastery 20, at most 100 a day. Spend at fixed prices; `refund()`. |
| `bizzing-avatars.js` + `.css` | 96 avatars = 12 packs × 8 at 2/3/2/1, with `validate()` in the tests. Worlds 1–2 free, 3+ with the family plan or 240 coins, legendaries need a named milestone, and the tier glow at night. |
| `bizzing-activity.js` | `trackActivity('english', …)` and `trackMilestone(…)`. **Register the app id `english`** in the wallet's and activity's `APPS` list in Bizzing_Schedule first; today they accept only bee, maths, geography, india and finance. |

App id: **`english`**.

---

## 12. Product and code rules (inherited, non-negotiable)

- **Stack:** vanilla ES modules, Vite and a PWA, with the `state → render()` + `data-act` idiom. Hash routes, and back never leaves the app.
  - `#/continue` and `?from=hive` work.
  - `nextStep()` is the **only** function that decides Continue (Finance and India both had two "next" functions disagreeing).
- **Storage:** everything goes through the `Store` seam, versioned, with `vN_to_vN+1` steps only. The state is a **household** `{parent, kids[], active}`, and a second child inherits nothing.
- **Child data:** first name, age band and avatar only. Free writing and recordings stay on the device (§5, §6.3). A backup includes data by **allow-list** (Finance's `backup.js`), so a new field is excluded by default.
- **The PIN** is a **salted hash**, and "unlocked" lives in memory, so a reload asks again. The screen calls it a deterrent, not security.
  - No pass codes in client code (India shipped `PARIVAAR` / `NANI2026` once).
  - Tester mode opens gates and never rewrites the child.
- **Reports:** Time · Progress · Mastery per child. They name the child or say "they", never "she" or "he" (Finance shipped "she" for everyone once). No projection on zero ("₹0", "over 0 years").
- **Answers:**
  - A right answer advances; a wrong one holds until tapped and explains on the exact item.
  - **Never leak the answer** in a prompt, a hint or a label.
  - Option order is permuted from the item id; hand-authored answers put 11 of 12 in slot B once.
  - Hints come in steps and never show the answer.
- **Motivation:** no streaks; count good days in a window. Medals come from evidence and are celebrated once. Nothing random. Coins never move rank.
- **Every game** works with keyboard **and** touch, and the browser check plays every game both ways.
- **Icons:** SVG everywhere (the shell's set, extended). **Zero emoji in controls**, counted by the check.
- **Type:**
  - Chrome in Hanken Grotesk, Fraunces and Sono; one display face per world; ≤ 250 KB of fonts before first paint.
  - A real face for reading passages (a book serif such as Literata, Newsreader or Source Serif) at ≥ 18 px, line-height ≥ 1.6, line length 60–75 characters.
  - Any Indic script follows Bizzing India's rule.
- **Performance:** first screen ≤ 1.5 MB on a phone, initial JS ≤ 400 KB gzipped. Texts and art are lazy, per route, and art is never inlined into JS.
- **Privacy:** no analytics, no third-party requests (the check fails on any), no ads. The privacy page is updated **first** when anything changes.
- **Paywall:** never on a child's screen. Pricing and entitlements wait for the family server; until then "family plan" is a grown-ups-only switch.
- Never put a real model identifier in commits, PRs, code or any pushed artefact.

---

## 13. Tests from the first commit

1. **Engine:**
   - every question has one right answer, no leak and even slots;
   - every quote is found in its source text;
   - every text has rights and sources;
   - readability is computed for every passage;
   - imported Bee data matches its manifest;
   - `validate(avatars)` returns `[]`;
   - the coin events are standard;
   - the shared drop-ins are byte-identical to the family copies.
2. **Browser check (Chromium; desktop 1280 and phone 390; light and dark):**
   - `checkShell` returns `[]`;
   - back stays in the app; exactly one primary button on Home; the PIN guards grown-ups;
   - no third-party requests; no overflow at 390 px **measured against the device width** (Chromium widens `innerWidth` under mobile emulation);
   - AA contrast on every world plate, by day and night;
   - zero emoji in controls; no `[object Object]` or `{placeholder}` on any screen;
   - **the mic stops after recording**; every game playable both ways.
3. **Prove every assertion by breaking it once.** An assertion that has never failed has not been shown to work. Several family checks were blind until broken on purpose: the phone overflow check, the contrast audit, and the world-gate test.

---

## 14. Phases

| Phase | Scope | Done when |
|---|---|---|
| **0. Skeleton (week 1)** | Repo, Vite, the shell, the store, the household, onboarding, ?demo, the drop-ins, the Bee import, CI tests, deploy.sh (Maths' pattern: tests, build, replace gh-pages wholesale, refuse on a file-count mismatch) | `checkShell` returns `[]`, a child can be made, and the empty Home shows |
| **1. Word + Sentence (MVP)** | Strands 1–2 levels 1–5; tap-a-word; Sentence Builder and Punctuation Rush; medals; Shop; 2 worlds | A 6–10-year-old can do a week of 10-minute sessions with no dead end |
| **2. Reading** | Levelled passages (40 to start), read-along (if narration is approved), three question depths, one whole book (*The Jungle Book* or *Alice*) | Literal and inferential mastery recorded on a later day |
| **3. Writing + Speaking** | Copywork, dictation, imitation; the mic pipeline (on-device measures); recitation and 1-minute speeches; the grown-up rubric | The privacy check proves no audio or text leaves the device |
| **4. Literature + Language + Stage** | 100 Library cards, appreciation games, the story of English, rhetoric, the Elocution Contest, worlds 3–6 | All seven strands to level 5; six worlds by day and night |
| **5. To level 10** | Whole novels, essays, debate, poetry close-reading | The family audit's 152 elements at ≥ 4 on the key list |

---

## 15. Traps already paid for in this family (read before building)

1. **Prose standards drift; measure instead.** Five apps read "make Home like Bee" five ways. Use the shell and `checkShell`; never re-implement chrome.
2. **Two deploys must never share a site.** Bizzing India's deploy wiped the Hive living in its `gh-pages`. One repo, one Pages site.
3. **A deploy that no-ops and reports success.** Count the files you meant to publish against what is staged, and refuse on a mismatch. India's site sat four hours behind once.
4. **Cache-busting.** Bump the asset stamp in the **source** `index.html` on every deploy; an unbumped stamp leaves phones on the old build.
5. **Minification breaks tests that read source text.** Bee's deploy gate refused because two checks read a function's text; the minifier renames it. Test **behaviour**, not source.
6. **Chromium's mobile emulation widens `innerWidth`.** Measure overflow against the viewport you set.
7. **Contrast audits misread painted backgrounds and transitions.** Skip background-image layers when sampling, and wait for transitions.
8. **The coin chip's width moved the search box** with the number of digits. The shell now fixes the chip's minimum width; don't reintroduce a variable-width control in the bar.
9. **A game froze for good** when a rAF loop spliced an array it had cleared (Finance's Change Rush). Every game gets a 60-second soak test with overlapping objects.
10. **An abandoned lesson was skipped forever.** Continue must come back to an unfinished stop.
11. **The daily coin limit counted a one-time migration.** Only earning events count; the wallet now enforces it.
12. **A free child had nothing to buy** (Bee), and coins lost their meaning in days (Maths, Geography). Commons are free, rares are buyable from day one, and a legendary or a world gives something worth saving for in week four.
13. **Mastery coins fired on an XP level-up** (Bee). Pay "mastery" only on spaced evidence.
14. **Image prompts:**
    - Naming the place gets it lettered.
    - "A calmer band" becomes a literal translucent rectangle.
    - "Exactly the same view" fails silently.
    - "Seen from the side" must be stated as an axis.
    - Gold is a tone ramp, not a hue.
    - Look at every image and re-roll the bad ones. Agents re-rolled about 1 in 20.
15. **The Gemini key** lives at `/root/.gkey` (mode 600). It never goes in a repo, and you never print it.
16. **Shared files drift when edited in place.** Copy them, pin their hashes, update by re-copying.
17. **Two "next" functions disagreed.** One `nextStep()`.
18. **Hard-coded pass codes, a plain-text PIN, "she" for every child, and "[object Object]" on screen** all shipped once each. Each has a test now. Start with all of them.
19. **The "Vedic" label.** Maths tells the honest provenance of its methods. Do the same for anything "classical" or "ancient": say where it really comes from.

---

## 16. Decisions for the owner (ask in the new chat before building past phase 0)

1. **Narration:** record passages and speeches in v1? Recommended **yes**; English is the app where hearing matters most.
2. **Mascot:** choose from three generated concepts.
3. **Free vs family plan:** proposed — Word and Sentence strands, plus worlds 1–2, free; everything else with the family plan.
4. **AI feedback on writing:** not in v1. Revisit only with the family server and consent.
5. **Age range:** 6–14, or add a 15+ Scholar band now?
6. **Bee's scope line:** confirm that English never runs a spelling competition and hands off to Bee for that.
7. **Domain and trademark:** check `bizzingenglish.com`, the app stores and a trademark search before launch, as Bee did.

---

## 17. Starting the repo

- **Name:** `aayuvis/Bizzing_English`, served by GitHub Pages from `gh-pages` → `https://aayuvis.github.io/Bizzing_English/`.
- **Copy the skeleton habits from Bizzing Maths:** `app/` (Vite), `deploy.sh`, `test/` (engine) and `test/ui.mjs` (browser), plus a `CLAUDE.md` with the sections the siblings use:
  - What this is
  - Working style
  - Hard rules
  - The family layer
  - Verify
  - Ship
  - Where to pick up
  - Branch
  - Commit trailer
- **First commit:** this spec as `docs/00-spec.md`, the CLAUDE.md, the empty shell passing `checkShell`, and the drop-ins with their hash test.
- **Register `english`** in Bizzing_Schedule's `integration/` APPS lists and the Hive's `cats.js` APPS, so the Hive shows the app's minutes and milestones.
