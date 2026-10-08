/* views/contest.js — the Elocution Contest grew into THE PODIUM (views/podium.js, HANDOVER C §2.2). #/stage/contest
   still works: main.js sends it to #/stage/podium. Kept here, small and loaded with the Stage, is the one thing
   the Stage needs before the Podium's own code arrives: whether it is open yet (a passage read aloud first, so
   the microphone has been met once before a tournament). */
export const contestOpen = (k) => !!k?.stops?.['sp1-aloud']?.passed;
