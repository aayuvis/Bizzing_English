/* inkwell-personas.js — the six detectives (handover "Inkwell Detective: the six detectives and the four Ink Journeys"
   §1, format 1.3 `personas.json` as a module so the engine and the tests import it the same way). Every text field is the
   handover's own words. A gift is a way of reading, never a spell (§13.1); the Hindu persona sheets wait on Bizzing
   India's named reviewer (P8: `reviewRequired`). No character in Inkwell uses they/them (owner, 6 Oct 2026).

   knack.kind — what the Knack offers (always exactly three candidates, at most one from the minimal evidence, §2.4):
     gap        Owl's Eye: up to three places where something expected is missing; only one matters
     paraphrase Winged Words: three paraphrases of a chosen sentence; one right, two near misses
     ravens     Two Ravens: Memory (lines sharing a word) and Thought (three pins that might link; one real)
     slot       The Spindle: the one timeline slot where a missing event goes, or two cards that cannot both be true
     viewpoint  Another's Shoes: a viewpoint card — what they knew, wanted, didn't know yet
     voice      The Tuning Ear: two documents' word-habits side by side, or one hard word split into its family */

export const PERSONAS = [
  {
    id: 'thea', name: 'Thea', age: 12, pronouns: 'she', tradition: 'greek', patron: 'Athena',
    look: 'Wears a grey duffel coat with one owl-feather pin.',
    temperament: 'Calm and exact, and a little too fond of being right.',
    gift: "In the Greek stories, Athena's owl sees in the dark. Thea notices what isn't there.",
    knack: { id: 'owls-eye', name: "Owl's Eye", skills: ['detail', 'contradiction'], kind: 'gap' },
    howItShows: "an owl's shadow crosses the window in the cutscene. Nothing else.",
    flaw: 'she trusts what is written over what people say, and learns in Case 5 that a voice is evidence too.',
    signature: "What's not on this page?", token: 'a pencil with an owl on the end.', reviewRequired: false,
  },
  {
    id: 'milo', name: 'Milo', age: 11, pronouns: 'he', tradition: 'greek', patron: 'Hermes',
    look: 'Red trainers with the laces tied in a figure of eight.',
    temperament: 'Quick, funny, talks too fast, and is kind about it.',
    gift: 'Hermes carries messages between the gods. Milo can carry a hard sentence across into plain words.',
    knack: { id: 'winged-words', name: 'Winged Words', skills: ['vocab', 'inference'], kind: 'paraphrase' },
    howItShows: 'his laces flutter for a beat, as if there were wind at his ankles.',
    flaw: 'he answers before the question is finished, and learns to wait.',
    signature: 'So what it actually says is…', token: 'an old brass whistle.', reviewRequired: false,
    youngestDefault: true,   // "the default suggestion when the age band is the youngest" (§1.3)
  },
  {
    id: 'oskar', name: 'Oskar', age: 12, pronouns: 'he', tradition: 'norse', patron: 'Odin',
    look: 'A long green scarf, and two black biros clipped to his collar.',
    temperament: 'Slow to speak and remembers everything.',
    gift: "Odin's ravens, Thought and Memory, fly out each morning and come home with the news. Oskar's notebook does the same.",
    knack: { id: 'two-ravens', name: 'Two Ravens', skills: ['sequence', 'contradiction'], kind: 'ravens' },
    howItShows: 'two crows on the lamp post outside, in every opening panel. Nobody comments.',
    flaw: "he won't guess, even when a guess is how you start. Nell teaches him to have a hunch.",
    signature: "We've seen that word before.", token: 'a notebook with a raven drawn on each corner.', reviewRequired: false,
  },
  {
    id: 'signe', name: 'Signe', age: 11, pronouns: 'she', tradition: 'norse', patron: 'Frigg',
    look: 'A yellow hat she made herself.',
    temperament: 'Quiet, patient, sees how things will turn out. Knits on stakeouts.',
    gift: 'In the Norse stories, Frigg spins the clouds and knows what is coming, though she rarely says. Signe can feel where a story has a hole in time.',
    knack: { id: 'spindle', name: 'The Spindle', skills: ['sequence'], kind: 'slot' },
    howItShows: 'a loose strand of yellow wool drifts across the timeline line, and settles.',
    flaw: "she knows, and doesn't say, which is Frigg's flaw too. She learns to speak up in Case 7.",
    signature: "Something happened here, and nobody's told us.", token: 'a wooden drop spindle in her pocket.', reviewRequired: false,
  },
  {
    id: 'hari', name: 'Hari', age: 12, pronouns: 'he', tradition: 'hindu', patron: 'Vishnu',
    look: 'A blue cardigan, and a notebook with ten coloured tabs.',
    temperament: "Warm and patient, and a peacemaker who finds everyone's side.",
    gift: "In the stories Hari's grandmother tells, Vishnu comes to the world again and again in different forms to set things right. Hari has a knack for seeing a thing from someone else's side.",
    knack: { id: 'anothers-shoes', name: "Another's Shoes", skills: ['voice', 'pronoun', 'inference'], kind: 'viewpoint' },
    howItShows: 'the tab of the notebook he is on matches the colour of the person he is thinking about.',
    flaw: "he likes everyone so much that he won't suspect anyone. Case 6 teaches him that being fair includes being fair to the evidence.",
    signature: 'If I were them, what would I have seen?', token: 'the ten-tab notebook.', reviewRequired: true,
    never: 'No conch, no discus, no tilak, no image of the deity: ever.',
  },
  {
    id: 'vani', name: 'Vani', age: 11, pronouns: 'she', tradition: 'hindu', patron: 'Saraswati',
    look: 'A white scarf.',
    temperament: 'Musical, precise, hears a mistake in a sentence the way you hear a wrong note. Plays the veena badly and cheerfully.',
    gift: "Saraswati, in the stories Vani's family tells, is the goddess of knowledge, speech and music. Vani itself means 'speech'. Vani can hear whose voice a sentence is in, and where a word came from.",
    knack: { id: 'tuning-ear', name: 'The Tuning Ear', skills: ['voice', 'figurative', 'vocab'], kind: 'voice' },
    howItShows: 'a single soft note sounds when a style matches. Nothing is drawn.',
    flaw: 'she corrects people mid-sentence (Quill approves). She learns when not to.',
    signature: 'Listen to how they say it.', token: 'a tuning fork.', reviewRequired: true,
  },
];
export const PERSONA_IDS = PERSONAS.map((p) => p.id);
export const personaById = (id) => PERSONAS.find((p) => p.id === id) || null;
