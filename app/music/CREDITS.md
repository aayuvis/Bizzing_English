# Music and sound — credits

Every sound in Bizzing English is **composed in code** for Bizzing English (`src/sound.js` plays it,
`src/music.js` holds the scores), with WebAudio oscillators: **no samples, no third-party audio**, nothing
downloaded and nothing licensed from anyone. The tunes are written by a seeded generator over each loop's chords,
so a loop is the same notes every time (`test/music.mjs`).

## Effects

right · wrong · finish · medal · coin · unlock · tap — short two- to four-note chimes, composed in code for
Bizzing English (`src/sound.js`), no samples, no third-party audio.

## Loops

Each loop is 60–90 s and seamless; default 40%; it dips under narration, stops under a live microphone,
pauses when the page is hidden, and is off in Calm mode or with Music switched off.

| Loop | Plays | Title | Key | Tempo | Length | Character | Source |
|---|---|---|---|---|---|---|---|
| `home` | Home | Quill's Hearth | F major | 84 bpm, 4/4 | 28 bars, 80.0 s | a fireside music box, unhurried (bell, pad, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `garden` | world 1, The Story Garden | Petals and Bells | C major | 96 bpm, 4/4 | 32 bars, 80.0 s | bright pentatonic bells in a morning garden (bell, pad, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `study` | world 2, The Lamplit Study | Lamplight | E♭ major | 64 bpm, 4/4 | 20 bars, 75.0 s | warm piano chords in a candlelit study (piano, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `playhouse` | world 3, The Playhouse | The Open-Air Waltz | G major | 108 bpm, 3/4 | 40 bars, 66.7 s | a gentle waltz under a summer awning (flute, pluck, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `forum` | world 4, The Forum | The Steps of the Forum | B♭ major | 72 bpm, 4/4 | 24 bars, 80.0 s | stately brass triads, slow and noble (brass, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `scriptorium` | world 5, The Scriptorium | Vellum and Plainsong | D dorian | 60 bpm, 4/4 | 18 bars, 72.0 s | modal, chant-like pads in a stone room (choir, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `lakeside` | world 6, The Poet’s Lakeside | Still Water | A lydian | 76 bpm, 4/4 | 24 bars, 75.8 s | soft harp plucks rippling by a lake (flute, pluck, pad, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `games` | games (any) | Quick Wits | E major | 108 bpm, 4/4 | 36 bars, 80.0 s | light and bouncing, for play (marimba, pluck, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `games-word` | word games | Word Hop | D major | 112 bpm, 4/4 | 40 bars, 85.7 s | a marimba skipping from word to word (marimba, pluck, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `games-sentence` | sentence games | Building Blocks | F major | 104 bpm, 4/4 | 36 bars, 83.1 s | plucked strings stacking up a sentence (bell, pluck, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
| `games-reading` | reading games | Turning Pages | G mixolydian | 100 bpm, 4/4 | 32 bars, 76.8 s | celeste and soft bass, a quick story (bell, pad, bass) | composed in code for Bizzing English (src/sound.js), no samples, no third-party audio |
