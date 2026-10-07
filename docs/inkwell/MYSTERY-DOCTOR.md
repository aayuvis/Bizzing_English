# Mystery Doctor: the brief for strengthening every Inkwell case

Owner, 6 Oct 2026: "make stories stronger and more mystery filled".

**What this is:** a revision pass on an existing case. It is not a rewrite from scratch. The following stay exactly as
they are, because the season, the exercises and the art depend on them:
- the culprit;
- the deciding clue;
- the vanished word;
- the office object;
- the level;
- the skills;
- the arc beats.

## The ten upgrades (apply every one that the case lacks)

1. **Stakes and a clock.**
   - The opening must say what is lost if nobody solves it, and by when. Examples: "judging is at eleven",
     "curtain up at seven", "the vote is at noon".
   - Put the clock on screen in the card and the cutscene, and have a character mention it again in chapter 3 or 4.
2. **One impossible thing.** Besides *who*, give the case a *how could it?* question. Examples:
   - no footprints in fresh snow or flour;
   - a door locked from the inside;
   - a thing gone in the ten seconds the lights were out;
   - an alibi that seems perfect.

   It must be explained at the reveal using evidence the child already has.
3. **Every suspect has motive, means, opportunity, and a secret.**
   - The secret is something the suspect hides that is *not* the crime. It is kind or embarrassing: a surprise present, a
     fear, a white lie to protect a friend.
   - It makes them look worse mid-case, then clears them when it comes out.
   - Write one line per suspect in the cast table: `Motive · Secret`.
4. **The false solution.** By the end of chapter 3, the board should point convincingly at the wrong person.
   - Nell's hunch-o-meter hits ten, or Tully is ready with the handcuffs.
   - Then a new document or interview line in chapter 4 breaks it.
   - The child is never *forced* to accuse wrongly. The false solution is the story's, not the player's.
5. **The clue hidden in plain sight.**
   - One fair clue in chapter 1 looks like scenery: a smell, a sound, a word in a sign, a detail in a picture caption.
   - It pays off at the reveal ("It was there from the very first page").
   - Make it a span the child *can* mark.
6. **Chapter-end hooks.** Every chapter ends on a question or a surprise, in one or two short lines. Examples:
   - a second note under the door;
   - a light in a window that should be dark;
   - a sound in the empty theatre;
   - Biscuit growling at nothing;
   - a line that contradicts a line two pages back.
7. **Atmosphere.**
   - Weather, dark, sound, smell. Fog on the quay, a clock ticking in an empty room, a draught that moves the pages.
   - Spooky but safe: a nine-year-old should want to keep the lamp on, not be frightened.
   - Add it to cutscene panels, `place` captions and stage directions. Keep documents within the level limits.
8. **The Blot is closer than you think.** One eerie beat per case that fits Odile Vane: tall, grey plait, violin case, a
   long-dash sign-off, the word "forthwith", a faint smell of violets or rosin. Examples:
   - a tune on the wind;
   - a card where none was a moment ago;
   - a grey plait glimpsed through a window.

   It must not identify her before Case 11, and it must not contradict her known aliases or whereabouts in the case
   files. Check the season timeline in case-11.md.
9. **A staged reveal.**
   - Gather the suspects. The detective (the child) walks through the evidence step by step.
   - Each red herring gets its explanation, and each suspect's secret is told kindly.
   - The deciding clue *re-reads an earlier line*: show both moments.
   - End on a warm beat and one last chill: the season thread.
10. **Escalation.**
    - Something gets worse halfway: a second thing goes missing, the deadline moves closer, or a suspect is about to leave
      town.
    - Never violence, never danger to a child.

## Hard rules (break none)

**Level discipline.** Read 00-bible.md Part 7 for the limits on document words, sentence words, suspects and
deductions.
- L1: doc ≤ 40 words, sentence ≤ 10. L2: 70/14. L3: 100/18. L4: 140/22. L5: 180/26.
- Times count as one word.
- New atmosphere goes mostly into stage directions, cutscene panels, `place` text and short talk lines.

**Fair play.**
- Every new clue that the solution relies on is a `[[c:id|exact words]]` span.
- The deductions' `minimalEvidence`, `acceptableEvidence` and `evidenceSpans` must still work.
- New red-herring clues go into `redHerrings` with `clearedBy` spans.
- Do not raise the number of required deductions above the level allows.

**Script and JSON stay verbatim twins.** Every change to `case-NN.md` is mirrored in `cases/case-NN.json` in the right
field:
- docs bodies;
- talk;
- interviews (questions and answers);
- cutscene panels;
- deductions;
- redHerrings;
- timeline events;
- accusation lines (wrongSuspect, wrongTheory, weakEvidence);
- reveal;
- epilogue.

**Exercises.** If you change any words an exercise quotes, or remove a span it cites, fix the exercise. Keep at least 12
exercises, at least 4 per tier, at least 4 types. No exercise may point at the culprit before chapter 5.

**Kid-safe.**
- No violence, injury, weapons or real fear.
- Harm stays elliptical.
- Nothing sacred to anyone is a suspect or a joke.
- No they/them pronouns for any named character (owner rule). Marlowe is he.
- Names are fixed: Councillor Hector Bright, Rupert Swale, Septimus Pettigrew, Reuben Osei, Petra Nwosu, Ms Juno Marsh.
  Tam is she, 10.

**Validator.**
- `node cases/validate-cases.mjs cases --scripts .` must end at `12 case(s) · 0 error(s)`.
- Only the two known warnings ("weapon" in Case 1, "dead" in Case 11) are allowed.
- Fix anything you break. Other agents are editing other cases at the same time, so only judge your own cases' lines in
  the output.

**Then update the retellings.**
- `rundown/comic/case-NN.json`: same shape; add the new beats, keep 14–20 panels (Case 11 up to 24).
- `rundown/timelines/case-NN.json`: same shape; 8–11 beats, ≤ 22 words each; add the false-solution `wrong` beat and
  the impossible thing.
- `rundown/notes.json` entry: truth, clue, teaches, and a `flags` line listing what changed:
  "Mystery pass: <stakes/clock>; <impossible thing>; <false solution>; <hidden clue>".

**Back up first.** Copy the case's .md and .json to `../pre-mystery/` before editing.

## Report back

For each case:
- one line per upgrade: what you added;
- the new impossible thing and false solution;
- the validator line for the case;
- anything you could not do without changing the culprit or the deciding clue. Propose it; do not do it.
