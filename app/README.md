# Bizzing English — the app

Vanilla ES modules + Vite + a PWA, in the family's `state → render()` + `data-act` idiom.
`npm install && npm run dev`, then open `http://localhost:8080/`. `?demo` opens the sample.

| file | owns |
|---|---|
| `src/main.js` | Boot, hash routes, render inside the family shell, one delegated listener, keys |
| `src/app.js` | The running state `S`, save, coins (`pay`), medals, toasts |
| `src/store.js` | **The only module that touches storage.** Versioned household + device prefs; demo in memory |
| `src/model.js` | Household, child, gates (strand / level), good days (never streaks) |
| `src/curriculum.js` | The seven strands × ten levels, stops with Story · Learn · objective |
| `src/items.js` | Every question generator (26 kinds, 8 item types) and `check()`, `copyDiff()` |
| `src/mastery.js` | **The only module that may say "learned".** Later-day rule, one-step slips |
| `src/next.js` | **THE** next step |
| `src/reading.js` · `data/rights.js` | Passages as Reading stops; the three-market rights gate |
| `src/lexicon.js` · `voice.js` | Bee's words (lazy), tap-a-word, Bee's clips or the device voice |
| `src/mic.js` | The microphone: tap to open, tracks stopped at once, numbers only |
| `src/games.js` | Sentence Builder, Punctuation Rush, Who Said It? — pure reducers |
| `src/medals.js` · `backup.js` · `pin.js` · `demo.js` · `worlds.js` · `sound.js` | as named |
| `src/views/*` | Screens as `state → string` |
| `src/integration/*` | The family drop-ins, byte-identical to Bizzing_Schedule's (never edit) |
| `src/data/library.js` | 71 works, 38 passages (questions, word-bank words), 57 lines of the hour |
| `src/data/sentences.js` · `wordparts.js` | The sentence banks and the word parts (sourced to Bee) |
| `public/data/bee-words.json` | The lexicon, imported from a pinned Bee commit (`tools/import-bee.mjs`) |
| `public/texts/` | The held public-domain texts (cleared in all three markets) |

Known gaps: Phases 2–5 of the spec (most levels above 5 say "being written"); Extras in the Shop;
narration is the device voice; the Elocution Contest.
