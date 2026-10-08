// inkwell-art.js — the painted art of Inkwell Detective (tools/art/gen.py INKWELL section → process.py --inkwell).
// Paths are relative to public/. Plates: `src` 1600 wide (desktop), `small` 720 wide (phone), both WebP (season-one.md 10.6).
// Every painting is an empty stage: no lettering, no digits, no clock hands (the app draws all words, numerals and hands live).
// Cast cut-outs (portraits) are transparent, 600x800, every figure scaled to the same height with its waist on the bottom edge,
// so characters stand side by side and over any plate at one size. Animals are smaller on the same canvas.
// Coordinates are percentages of the plate, measured on the painting: repaint a plate, re-measure.
// Scenes are each case's main stage; `night` repaints `day` from it (same composition), except case-11, whose day is the
// Great Door in sun (the unveiling) and whose night is the Seal Room at midnight (the painted clock with no hands).
// emblems: the six detectives' gifts (vani = tuning fork, her token; vani-veena an alternative) and hoard (the Word Hoard).
// Written from what process.py --inkwell produced; pins, hotspots and niches are hand-measured.
// The child's own detective is their avatar (not here); the Blot is only ever its calling card (ui.card).
export const INKWELL_ART = {
 "agency": {
  "day": {
   "src": "art/inkwell/agency.webp",
   "small": "art/inkwell/agency-720.webp"
  },
  "night": {
   "src": "art/inkwell/agency-night.webp",
   "small": "art/inkwell/agency-night-720.webp"
  },
  "hotspots": {
   "casebookWall": [
    10,
    21,
    24,
    64
   ],
   "hatStand": [
    1,
    30,
    12,
    98
   ],
   "window": [
    39,
    16,
    61,
    56
   ],
   "desk": [
    31,
    61,
    68,
    94
   ],
   "shelf": [
    71,
    20,
    87,
    65
   ],
   "readingDoor": [
    88,
    18,
    98,
    98
   ],
   "speakingTube": [
    64,
    15,
    69,
    35
   ],
   "dumbwaiter": [
    62,
    39,
    69,
    55
   ]
  },
  "quillAt": [
   50,
   58
  ],
  "shelfNiches": [
   [
    73,
    32
   ],
   [
    76,
    32
   ],
   [
    79,
    32
   ],
   [
    82,
    32
   ],
   [
    73,
    44
   ],
   [
    76,
    44
   ],
   [
    79,
    44
   ],
   [
    82,
    44
   ],
   [
    73,
    57
   ],
   [
    76,
    57
   ],
   [
    79,
    57
   ],
   [
    82,
    57
   ]
  ]
 },
 "map": {
  "day": {
   "src": "art/inkwell/map.webp",
   "small": "art/inkwell/map-720.webp"
  },
  "night": {
   "src": "art/inkwell/map-night.webp",
   "small": "art/inkwell/map-night-720.webp"
  },
  "pins": {
   "case-00": [
    39,
    79
   ],
   "case-01": [
    24,
    67
   ],
   "case-02": [
    29,
    33
   ],
   "case-03": [
    13,
    67
   ],
   "case-04": [
    92,
    40
   ],
   "case-05": [
    45,
    18
   ],
   "case-06": [
    82,
    52
   ],
   "case-07": [
    56,
    18
   ],
   "case-08": [
    79,
    20
   ],
   "case-09": [
    77,
    78
   ],
   "case-10": [
    74,
    45
   ],
   "case-11": [
    50,
    38
   ]
  },
  "places": {
   "library": [
    50,
    38
   ],
   "agency": [
    39,
    79
   ],
   "garden": [
    15,
    60
   ],
   "lamplitRow": [
    18,
    18
   ],
   "clockTower": [
    36,
    18
   ],
   "playhouse": [
    50,
    16
   ],
   "scriptorium": [
    78,
    18
   ],
   "forum": [
    86,
    45
   ],
   "lakeside": [
    85,
    80
   ],
   "lighthouse": [
    92,
    86
   ],
   "harbour": [
    55,
    90
   ]
  }
 },
 "scenes": {
  "case-00": {
   "day": {
    "src": "art/inkwell/case-00.webp",
    "small": "art/inkwell/case-00-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-00-night.webp",
    "small": "art/inkwell/case-00-night-720.webp"
   }
  },
  "case-01": {
   "day": {
    "src": "art/inkwell/case-01.webp",
    "small": "art/inkwell/case-01-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-01-night.webp",
    "small": "art/inkwell/case-01-night-720.webp"
   }
  },
  "case-02": {
   "day": {
    "src": "art/inkwell/case-02.webp",
    "small": "art/inkwell/case-02-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-02-night.webp",
    "small": "art/inkwell/case-02-night-720.webp"
   }
  },
  "case-03": {
   "day": {
    "src": "art/inkwell/case-03.webp",
    "small": "art/inkwell/case-03-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-03-night.webp",
    "small": "art/inkwell/case-03-night-720.webp"
   }
  },
  "case-04": {
   "day": {
    "src": "art/inkwell/case-04.webp",
    "small": "art/inkwell/case-04-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-04-night.webp",
    "small": "art/inkwell/case-04-night-720.webp"
   }
  },
  "case-05": {
   "day": {
    "src": "art/inkwell/case-05.webp",
    "small": "art/inkwell/case-05-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-05-night.webp",
    "small": "art/inkwell/case-05-night-720.webp"
   }
  },
  "case-06": {
   "day": {
    "src": "art/inkwell/case-06.webp",
    "small": "art/inkwell/case-06-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-06-night.webp",
    "small": "art/inkwell/case-06-night-720.webp"
   }
  },
  "case-07": {
   "day": {
    "src": "art/inkwell/case-07.webp",
    "small": "art/inkwell/case-07-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-07-night.webp",
    "small": "art/inkwell/case-07-night-720.webp"
   }
  },
  "case-08": {
   "day": {
    "src": "art/inkwell/case-08.webp",
    "small": "art/inkwell/case-08-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-08-night.webp",
    "small": "art/inkwell/case-08-night-720.webp"
   }
  },
  "case-09": {
   "day": {
    "src": "art/inkwell/case-09.webp",
    "small": "art/inkwell/case-09-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-09-night.webp",
    "small": "art/inkwell/case-09-night-720.webp"
   }
  },
  "case-10": {
   "day": {
    "src": "art/inkwell/case-10.webp",
    "small": "art/inkwell/case-10-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-10-night.webp",
    "small": "art/inkwell/case-10-night-720.webp"
   }
  },
  "case-11": {
   "day": {
    "src": "art/inkwell/case-11.webp",
    "small": "art/inkwell/case-11-720.webp"
   },
   "night": {
    "src": "art/inkwell/case-11-night.webp",
    "small": "art/inkwell/case-11-night-720.webp"
   }
  }
 },
 "journeys": {
  "olympus": {
   "src": "art/inkwell/journey-olympus.webp",
   "small": "art/inkwell/journey-olympus-720.webp"
  },
  "asgard": {
   "src": "art/inkwell/journey-asgard.webp",
   "small": "art/inkwell/journey-asgard-720.webp"
  },
  "verona": {
   "src": "art/inkwell/journey-verona.webp",
   "small": "art/inkwell/journey-verona-720.webp"
  },
  "mississippi": {
   "src": "art/inkwell/journey-mississippi.webp",
   "small": "art/inkwell/journey-mississippi-720.webp"
  }
 },
 "materials": {
  "cork": "art/inkwell/mat-cork.webp",
  "desk": "art/inkwell/mat-desk.webp",
  "diary": "art/inkwell/mat-diary.webp",
  "letter": "art/inkwell/mat-letter.webp",
  "newspaper": "art/inkwell/mat-newspaper.webp",
  "notice": "art/inkwell/mat-notice.webp"
 },
 "objects": {
  "bottle": "art/inkwell/obj-bottle.webp",
  "brass-lantern": "art/inkwell/obj-brass-lantern.webp",
  "charter-ribbon": "art/inkwell/obj-charter-ribbon.webp",
  "dividers": "art/inkwell/obj-dividers.webp",
  "fountain-pen": "art/inkwell/obj-fountain-pen.webp",
  "gavel-handle": "art/inkwell/obj-gavel-handle.webp",
  "goose-feather": "art/inkwell/obj-goose-feather.webp",
  "green-pen": "art/inkwell/obj-green-pen.webp",
  "pole-tip": "art/inkwell/obj-pole-tip.webp",
  "red-pencil": "art/inkwell/obj-red-pencil.webp",
  "rosette": "art/inkwell/obj-rosette.webp",
  "stone-frog": "art/inkwell/obj-stone-frog.webp"
 },
 "emblems": {
  "hari": "art/inkwell/emb-hari.webp",
  "hoard": "art/inkwell/emb-hoard.webp",
  "milo": "art/inkwell/emb-milo.webp",
  "oskar": "art/inkwell/emb-oskar.webp",
  "signe": "art/inkwell/emb-signe.webp",
  "thea": "art/inkwell/emb-thea.webp",
  "vani-veena": "art/inkwell/emb-vani-veena.webp",
  "vani": "art/inkwell/emb-vani.webp"
 },
 "ui": {
  "card": "art/inkwell/ui-card.webp",
  "ledger": "art/inkwell/ui-ledger.webp",
  "magnifier": "art/inkwell/ui-magnifier.webp",
  "seal": "art/inkwell/ui-seal.webp"
 },
 "quill": {
  "detective": "art/inkwell/quill-detective.webp",
  "think": "art/inkwell/quill-think.webp"
 },
 "portraits": {
  "achterberg": {
   "amused": "art/inkwell/cast/achterberg-amused.webp",
   "calm": "art/inkwell/cast/achterberg-calm.webp",
   "guilty": "art/inkwell/cast/achterberg-guilty.webp",
   "nervous": "art/inkwell/cast/achterberg-nervous.webp",
   "offended": "art/inkwell/cast/achterberg-offended.webp",
   "relieved": "art/inkwell/cast/achterberg-relieved.webp"
  },
  "ada": {
   "amused": "art/inkwell/cast/ada-amused.webp",
   "calm": "art/inkwell/cast/ada-calm.webp",
   "guilty": "art/inkwell/cast/ada-guilty.webp",
   "nervous": "art/inkwell/cast/ada-nervous.webp",
   "offended": "art/inkwell/cast/ada-offended.webp",
   "relieved": "art/inkwell/cast/ada-relieved.webp",
   "remembering": "art/inkwell/cast/ada-remembering.webp",
   "thoughtful": "art/inkwell/cast/ada-thoughtful.webp"
  },
  "admiral": {
   "asleep": "art/inkwell/cast/admiral-asleep.webp",
   "calm": "art/inkwell/cast/admiral-calm.webp",
   "honking": "art/inkwell/cast/admiral-honking.webp"
  },
  "asante": {
   "amused": "art/inkwell/cast/asante-amused.webp",
   "calm": "art/inkwell/cast/asante-calm.webp",
   "nervous": "art/inkwell/cast/asante-nervous.webp",
   "offended": "art/inkwell/cast/asante-offended.webp",
   "relieved": "art/inkwell/cast/asante-relieved.webp"
  },
  "asha": {
   "amused": "art/inkwell/cast/asha-amused.webp",
   "calm": "art/inkwell/cast/asha-calm.webp",
   "nervous": "art/inkwell/cast/asha-nervous.webp",
   "relieved": "art/inkwell/cast/asha-relieved.webp",
   "thoughtful": "art/inkwell/cast/asha-thoughtful.webp"
  },
  "bellamy": {
   "amused": "art/inkwell/cast/bellamy-amused.webp",
   "calm": "art/inkwell/cast/bellamy-calm.webp",
   "nervous": "art/inkwell/cast/bellamy-nervous.webp",
   "offended": "art/inkwell/cast/bellamy-offended.webp",
   "relieved": "art/inkwell/cast/bellamy-relieved.webp"
  },
  "biscuit": {
   "asleep": "art/inkwell/cast/biscuit-asleep.webp",
   "calm": "art/inkwell/cast/biscuit-calm.webp"
  },
  "bright": {
   "amused": "art/inkwell/cast/bright-amused.webp",
   "calm": "art/inkwell/cast/bright-calm.webp",
   "guilty": "art/inkwell/cast/bright-guilty.webp",
   "nervous": "art/inkwell/cast/bright-nervous.webp",
   "offended": "art/inkwell/cast/bright-offended.webp",
   "relieved": "art/inkwell/cast/bright-relieved.webp"
  },
  "cat": {
   "calm": "art/inkwell/cast/cat-calm.webp"
  },
  "celeste": {
   "amused": "art/inkwell/cast/celeste-amused.webp",
   "calm": "art/inkwell/cast/celeste-calm.webp",
   "guilty": "art/inkwell/cast/celeste-guilty.webp",
   "nervous": "art/inkwell/cast/celeste-nervous.webp",
   "offended": "art/inkwell/cast/celeste-offended.webp",
   "relieved": "art/inkwell/cast/celeste-relieved.webp"
  },
  "crane": {
   "amused": "art/inkwell/cast/crane-amused.webp",
   "calm": "art/inkwell/cast/crane-calm.webp",
   "guilty": "art/inkwell/cast/crane-guilty.webp",
   "nervous": "art/inkwell/cast/crane-nervous.webp",
   "offended": "art/inkwell/cast/crane-offended.webp",
   "relieved": "art/inkwell/cast/crane-relieved.webp"
  },
  "dev": {
   "amused": "art/inkwell/cast/dev-amused.webp",
   "calm": "art/inkwell/cast/dev-calm.webp",
   "nervous": "art/inkwell/cast/dev-nervous.webp",
   "relieved": "art/inkwell/cast/dev-relieved.webp",
   "thoughtful": "art/inkwell/cast/dev-thoughtful.webp"
  },
  "dot": {
   "amused": "art/inkwell/cast/dot-amused.webp",
   "calm": "art/inkwell/cast/dot-calm.webp",
   "offended": "art/inkwell/cast/dot-offended.webp",
   "relieved": "art/inkwell/cast/dot-relieved.webp"
  },
  "dunmore": {
   "calm": "art/inkwell/cast/dunmore-calm.webp",
   "guilty": "art/inkwell/cast/dunmore-guilty.webp",
   "offended": "art/inkwell/cast/dunmore-offended.webp",
   "relieved": "art/inkwell/cast/dunmore-relieved.webp",
   "worried": "art/inkwell/cast/dunmore-worried.webp"
  },
  "encore": {
   "amused": "art/inkwell/cast/encore-amused.webp",
   "asleep": "art/inkwell/cast/encore-asleep.webp",
   "offended": "art/inkwell/cast/encore-offended.webp",
   "one-eye-open": "art/inkwell/cast/encore-one-eye-open.webp",
   "smug": "art/inkwell/cast/encore-smug.webp",
   "yawning": "art/inkwell/cast/encore-yawning.webp"
  },
  "felix": {
   "amused": "art/inkwell/cast/felix-amused.webp",
   "calm": "art/inkwell/cast/felix-calm.webp",
   "nervous": "art/inkwell/cast/felix-nervous.webp",
   "relieved": "art/inkwell/cast/felix-relieved.webp",
   "thoughtful": "art/inkwell/cast/felix-thoughtful.webp"
  },
  "fosse": {
   "calm": "art/inkwell/cast/fosse-calm.webp",
   "guilty": "art/inkwell/cast/fosse-guilty.webp",
   "nervous": "art/inkwell/cast/fosse-nervous.webp",
   "offended": "art/inkwell/cast/fosse-offended.webp",
   "relieved": "art/inkwell/cast/fosse-relieved.webp"
  },
  "gnomes": {
   "amused": "art/inkwell/cast/gnomes-amused.webp",
   "calm": "art/inkwell/cast/gnomes-calm.webp",
   "offended": "art/inkwell/cast/gnomes-offended.webp",
   "relieved": "art/inkwell/cast/gnomes-relieved.webp"
  },
  "grail": {
   "amused": "art/inkwell/cast/grail-amused.webp",
   "calm": "art/inkwell/cast/grail-calm.webp",
   "guilty": "art/inkwell/cast/grail-guilty.webp",
   "nervous": "art/inkwell/cast/grail-nervous.webp",
   "offended": "art/inkwell/cast/grail-offended.webp",
   "relieved": "art/inkwell/cast/grail-relieved.webp"
  },
  "grandpa": {
   "amused": "art/inkwell/cast/grandpa-amused.webp",
   "calm": "art/inkwell/cast/grandpa-calm.webp",
   "nervous": "art/inkwell/cast/grandpa-nervous.webp",
   "relieved": "art/inkwell/cast/grandpa-relieved.webp"
  },
  "gundersen": {
   "amused": "art/inkwell/cast/gundersen-amused.webp",
   "calm": "art/inkwell/cast/gundersen-calm.webp",
   "relieved": "art/inkwell/cast/gundersen-relieved.webp"
  },
  "hale": {
   "calm": "art/inkwell/cast/hale-calm.webp",
   "guilty": "art/inkwell/cast/hale-guilty.webp",
   "nervous": "art/inkwell/cast/hale-nervous.webp",
   "offended": "art/inkwell/cast/hale-offended.webp",
   "relieved": "art/inkwell/cast/hale-relieved.webp"
  },
  "hari": {
   "amused": "art/inkwell/cast/hari-amused.webp",
   "calm": "art/inkwell/cast/hari-calm.webp",
   "nervous": "art/inkwell/cast/hari-nervous.webp",
   "relieved": "art/inkwell/cast/hari-relieved.webp",
   "thoughtful": "art/inkwell/cast/hari-thoughtful.webp"
  },
  "hugo": {
   "amused": "art/inkwell/cast/hugo-amused.webp",
   "calm": "art/inkwell/cast/hugo-calm.webp",
   "guilty": "art/inkwell/cast/hugo-guilty.webp",
   "nervous": "art/inkwell/cast/hugo-nervous.webp",
   "offended": "art/inkwell/cast/hugo-offended.webp",
   "relieved": "art/inkwell/cast/hugo-relieved.webp"
  },
  "ito": {
   "amused": "art/inkwell/cast/ito-amused.webp",
   "calm": "art/inkwell/cast/ito-calm.webp",
   "offended": "art/inkwell/cast/ito-offended.webp",
   "relieved": "art/inkwell/cast/ito-relieved.webp"
  },
  "ivy": {
   "amused": "art/inkwell/cast/ivy-amused.webp",
   "calm": "art/inkwell/cast/ivy-calm.webp",
   "guilty": "art/inkwell/cast/ivy-guilty.webp",
   "nervous": "art/inkwell/cast/ivy-nervous.webp",
   "offended": "art/inkwell/cast/ivy-offended.webp",
   "relieved": "art/inkwell/cast/ivy-relieved.webp"
  },
  "juniper": {
   "amused": "art/inkwell/cast/juniper-amused.webp",
   "calm": "art/inkwell/cast/juniper-calm.webp",
   "guilty": "art/inkwell/cast/juniper-guilty.webp",
   "nervous": "art/inkwell/cast/juniper-nervous.webp",
   "offended": "art/inkwell/cast/juniper-offended.webp",
   "relieved": "art/inkwell/cast/juniper-relieved.webp"
  },
  "kip": {
   "amused": "art/inkwell/cast/kip-amused.webp",
   "calm": "art/inkwell/cast/kip-calm.webp",
   "nervous": "art/inkwell/cast/kip-nervous.webp",
   "relieved": "art/inkwell/cast/kip-relieved.webp"
  },
  "leela": {
   "amused": "art/inkwell/cast/leela-amused.webp",
   "calm": "art/inkwell/cast/leela-calm.webp"
  },
  "marlowe": {
   "amused": "art/inkwell/cast/marlowe-amused.webp",
   "calm": "art/inkwell/cast/marlowe-calm.webp",
   "guilty": "art/inkwell/cast/marlowe-guilty.webp",
   "nervous": "art/inkwell/cast/marlowe-nervous.webp",
   "offended": "art/inkwell/cast/marlowe-offended.webp",
   "relieved": "art/inkwell/cast/marlowe-relieved.webp"
  },
  "marsh": {
   "amused": "art/inkwell/cast/marsh-amused.webp",
   "calm": "art/inkwell/cast/marsh-calm.webp",
   "relieved": "art/inkwell/cast/marsh-relieved.webp"
  },
  "mbeki": {
   "amused": "art/inkwell/cast/mbeki-amused.webp",
   "calm": "art/inkwell/cast/mbeki-calm.webp",
   "guilty": "art/inkwell/cast/mbeki-guilty.webp",
   "nervous": "art/inkwell/cast/mbeki-nervous.webp",
   "offended": "art/inkwell/cast/mbeki-offended.webp",
   "relieved": "art/inkwell/cast/mbeki-relieved.webp"
  },
  "milo": {
   "amused": "art/inkwell/cast/milo-amused.webp",
   "calm": "art/inkwell/cast/milo-calm.webp",
   "nervous": "art/inkwell/cast/milo-nervous.webp",
   "relieved": "art/inkwell/cast/milo-relieved.webp",
   "thoughtful": "art/inkwell/cast/milo-thoughtful.webp"
  },
  "moss": {
   "amused": "art/inkwell/cast/moss-amused.webp",
   "calm": "art/inkwell/cast/moss-calm.webp",
   "nervous": "art/inkwell/cast/moss-nervous.webp",
   "offended": "art/inkwell/cast/moss-offended.webp",
   "relieved": "art/inkwell/cast/moss-relieved.webp"
  },
  "nell": {
   "amused": "art/inkwell/cast/nell-amused.webp",
   "calm": "art/inkwell/cast/nell-calm.webp",
   "nervous": "art/inkwell/cast/nell-nervous.webp",
   "relieved": "art/inkwell/cast/nell-relieved.webp",
   "thoughtful": "art/inkwell/cast/nell-thoughtful.webp"
  },
  "odile": {
   "amused": "art/inkwell/cast/odile-amused.webp",
   "calm": "art/inkwell/cast/odile-calm.webp",
   "guilty": "art/inkwell/cast/odile-guilty.webp",
   "nervous": "art/inkwell/cast/odile-nervous.webp",
   "offended": "art/inkwell/cast/odile-offended.webp",
   "relieved": "art/inkwell/cast/odile-relieved.webp"
  },
  "osei": {
   "amused": "art/inkwell/cast/osei-amused.webp",
   "calm": "art/inkwell/cast/osei-calm.webp",
   "relieved": "art/inkwell/cast/osei-relieved.webp"
  },
  "oskar": {
   "amused": "art/inkwell/cast/oskar-amused.webp",
   "calm": "art/inkwell/cast/oskar-calm.webp",
   "nervous": "art/inkwell/cast/oskar-nervous.webp",
   "relieved": "art/inkwell/cast/oskar-relieved.webp",
   "thoughtful": "art/inkwell/cast/oskar-thoughtful.webp"
  },
  "pell": {
   "amused": "art/inkwell/cast/pell-amused.webp",
   "calm": "art/inkwell/cast/pell-calm.webp",
   "offended": "art/inkwell/cast/pell-offended.webp",
   "relieved": "art/inkwell/cast/pell-relieved.webp"
  },
  "penhallow": {
   "amused": "art/inkwell/cast/penhallow-amused.webp",
   "calm": "art/inkwell/cast/penhallow-calm.webp",
   "guilty": "art/inkwell/cast/penhallow-guilty.webp",
   "nervous": "art/inkwell/cast/penhallow-nervous.webp",
   "offended": "art/inkwell/cast/penhallow-offended.webp",
   "relieved": "art/inkwell/cast/penhallow-relieved.webp",
   "worried": "art/inkwell/cast/penhallow-worried.webp"
  },
  "petra": {
   "amused": "art/inkwell/cast/petra-amused.webp",
   "calm": "art/inkwell/cast/petra-calm.webp",
   "guilty": "art/inkwell/cast/petra-guilty.webp",
   "nervous": "art/inkwell/cast/petra-nervous.webp",
   "offended": "art/inkwell/cast/petra-offended.webp",
   "relieved": "art/inkwell/cast/petra-relieved.webp",
   "worried": "art/inkwell/cast/petra-worried.webp"
  },
  "pettigrew": {
   "amused": "art/inkwell/cast/pettigrew-amused.webp",
   "calm": "art/inkwell/cast/pettigrew-calm.webp",
   "guilty": "art/inkwell/cast/pettigrew-guilty.webp",
   "nervous": "art/inkwell/cast/pettigrew-nervous.webp",
   "offended": "art/inkwell/cast/pettigrew-offended.webp",
   "relieved": "art/inkwell/cast/pettigrew-relieved.webp"
  },
  "prout": {
   "calm": "art/inkwell/cast/prout-calm.webp",
   "nervous": "art/inkwell/cast/prout-nervous.webp",
   "offended": "art/inkwell/cast/prout-offended.webp",
   "relieved": "art/inkwell/cast/prout-relieved.webp"
  },
  "qadir": {
   "amused": "art/inkwell/cast/qadir-amused.webp",
   "calm": "art/inkwell/cast/qadir-calm.webp"
  },
  "quarrender": {
   "amused": "art/inkwell/cast/quarrender-amused.webp",
   "calm": "art/inkwell/cast/quarrender-calm.webp",
   "guilty": "art/inkwell/cast/quarrender-guilty.webp",
   "nervous": "art/inkwell/cast/quarrender-nervous.webp",
   "offended": "art/inkwell/cast/quarrender-offended.webp",
   "relieved": "art/inkwell/cast/quarrender-relieved.webp"
  },
  "quayle": {
   "amused": "art/inkwell/cast/quayle-amused.webp",
   "calm": "art/inkwell/cast/quayle-calm.webp",
   "offended": "art/inkwell/cast/quayle-offended.webp",
   "relieved": "art/inkwell/cast/quayle-relieved.webp",
   "thoughtful": "art/inkwell/cast/quayle-thoughtful.webp"
  },
  "rafi": {
   "amused": "art/inkwell/cast/rafi-amused.webp",
   "calm": "art/inkwell/cast/rafi-calm.webp",
   "nervous": "art/inkwell/cast/rafi-nervous.webp",
   "offended": "art/inkwell/cast/rafi-offended.webp",
   "relieved": "art/inkwell/cast/rafi-relieved.webp"
  },
  "rosa": {
   "amused": "art/inkwell/cast/rosa-amused.webp",
   "calm": "art/inkwell/cast/rosa-calm.webp"
  },
  "sami": {
   "amused": "art/inkwell/cast/sami-amused.webp",
   "calm": "art/inkwell/cast/sami-calm.webp"
  },
  "semicolon": {
   "calm": "art/inkwell/cast/semicolon-calm.webp"
  },
  "signe": {
   "amused": "art/inkwell/cast/signe-amused.webp",
   "calm": "art/inkwell/cast/signe-calm.webp",
   "nervous": "art/inkwell/cast/signe-nervous.webp",
   "relieved": "art/inkwell/cast/signe-relieved.webp",
   "thoughtful": "art/inkwell/cast/signe-thoughtful.webp"
  },
  "sully": {
   "amused": "art/inkwell/cast/sully-amused.webp",
   "calm": "art/inkwell/cast/sully-calm.webp",
   "nervous": "art/inkwell/cast/sully-nervous.webp"
  },
  "sunny": {
   "amused": "art/inkwell/cast/sunny-amused.webp",
   "calm": "art/inkwell/cast/sunny-calm.webp",
   "nervous": "art/inkwell/cast/sunny-nervous.webp",
   "offended": "art/inkwell/cast/sunny-offended.webp",
   "relieved": "art/inkwell/cast/sunny-relieved.webp"
  },
  "swale": {
   "amused": "art/inkwell/cast/swale-amused.webp",
   "calm": "art/inkwell/cast/swale-calm.webp",
   "guilty": "art/inkwell/cast/swale-guilty.webp",
   "nervous": "art/inkwell/cast/swale-nervous.webp",
   "offended": "art/inkwell/cast/swale-offended.webp",
   "relieved": "art/inkwell/cast/swale-relieved.webp"
  },
  "tam": {
   "amused": "art/inkwell/cast/tam-amused.webp",
   "calm": "art/inkwell/cast/tam-calm.webp",
   "guilty": "art/inkwell/cast/tam-guilty.webp",
   "nervous": "art/inkwell/cast/tam-nervous.webp",
   "relieved": "art/inkwell/cast/tam-relieved.webp"
  },
  "thea": {
   "amused": "art/inkwell/cast/thea-amused.webp",
   "calm": "art/inkwell/cast/thea-calm.webp",
   "nervous": "art/inkwell/cast/thea-nervous.webp",
   "relieved": "art/inkwell/cast/thea-relieved.webp",
   "thoughtful": "art/inkwell/cast/thea-thoughtful.webp"
  },
  "tully": {
   "amused": "art/inkwell/cast/tully-amused.webp",
   "calm": "art/inkwell/cast/tully-calm.webp",
   "nervous": "art/inkwell/cast/tully-nervous.webp",
   "offended": "art/inkwell/cast/tully-offended.webp",
   "relieved": "art/inkwell/cast/tully-relieved.webp",
   "worried": "art/inkwell/cast/tully-worried.webp"
  },
  "vani": {
   "amused": "art/inkwell/cast/vani-amused.webp",
   "calm": "art/inkwell/cast/vani-calm.webp",
   "nervous": "art/inkwell/cast/vani-nervous.webp",
   "relieved": "art/inkwell/cast/vani-relieved.webp",
   "thoughtful": "art/inkwell/cast/vani-thoughtful.webp"
  },
  "zuri": {
   "amused": "art/inkwell/cast/zuri-amused.webp",
   "calm": "art/inkwell/cast/zuri-calm.webp",
   "relieved": "art/inkwell/cast/zuri-relieved.webp"
  }
 }
};
export default INKWELL_ART;
