#!/usr/bin/env python3
"""gen.py — paint Bizzing English's places, mascot, avatars and medals with a Gemini image model.

The family doctrine: an image model paints PLACES and creatures; everything structural (the
Atlas road, pins, numbers, words) is drawn by the app. So a prompt never names a place (a
named place gets lettered on a sign), never asks for "a calmer band" (it paints a literal
translucent rectangle), and never asks for lettering of any kind. Look at every raw image in
tools/art/raw/ before process.py ships it.

    python3 tools/art/gen.py --only mascot-wave          # the mascot's model pose first
    python3 tools/art/gen.py --only mascot-cheer --ref raw/mascot-wave.png
    python3 tools/art/gen.py --group worlds|avatars|medals|mascot|tools
    python3 tools/art/gen.py --force --only av-tortoise

The key is read from $GKEY_FILE or /root/.gkey — never from the repo, never printed.
"""
import base64, json, os, sys, time, urllib.request, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
os.makedirs(RAW, exist_ok=True)
KEY = open(os.environ.get('GKEY_FILE', '/root/.gkey')).read().strip()
MODELS = os.environ.get('NB_MODELS', 'gemini-3-pro-image,gemini-3.1-flash-image,gemini-2.5-flash-image').split(',')

NO_TEXT = ("ABSOLUTELY NO TEXT: no letters, no words, no numbers, no digits, no writing on any book spine, "
           "page, scroll, sign or banner (pages show only soft grey squiggle lines), no labels, no captions, "
           "no watermark, no signature.")

PLACE = ("Painted illustration for a children's reading-and-writing app, in a warm hand-painted storybook "
         "style: soft gouache and watercolour textures, gentle directional light, rich but not garish colour, "
         "clean readable shapes, a sense of wonder. A wide panorama, one continuous full-bleed scene with no "
         "frame, no border, no blank panels, no empty rectangles, no translucent bands or white strips. "
         "No people, no human figures, no faces, no animals. " + NO_TEXT)

NIGHT = ("Repaint the reference painting as ONE single night-time picture of the whole scene, full width, in the "
         "same composition and the same hand-painted storybook style: a deep blue-violet night sky with stars and "
         "a moon, lamps, lanterns and windows glowing warm gold, soft pools of lamplight, moonlight on the edges. "
         "Every part of the picture is night — it is NOT a comparison, NOT split, NOT side by side, NOT half day. "
         "No people, no animals, no frame. " + NO_TEXT)
NIGHT_REF = {}

# Six worlds (SPEC §8). Each is described, never named.
WORLDS = {
    'garden':    "A sunlit storybook garden at the edge of a fairy-tale wood: winding gravel paths, a tiny wooden "
                 "bridge over a brook, giant toadstools, a well with a bucket, a hedge maze, a hollow tree with a "
                 "round door, a distant castle tower on a hill, beds of foxgloves and poppies, a stone pitcher "
                 "on a wall. Fresh greens, poppy red, buttercup yellow, sky blue.",
    'study':     "A cosy Victorian study inside a tall old house on a rainy evening: floor-to-ceiling bookshelves "
                 "of leather books with plain unmarked spines, a big leaded window streaked with rain and a city of "
                 "chimney pots beyond, a green-shaded reading lamp, a wing-backed armchair, a writing desk with an "
                 "inkwell and quill, a globe on a stand, candles on the mantelpiece, a fire in the grate. "
                 "Oxblood red, bottle green, brass and amber.",
    'playhouse': "The inside of a round open-air wooden playhouse from Elizabethan times, seen from the yard: "
                 "three galleries of oak timber and white plaster circling the yard, a thatched roof ring open to "
                 "the sky, a raised wooden stage jutting out with two painted pillars holding up a canopy painted "
                 "with stars, heavy red curtains at the back, pennants on the roof. Honey oak, cream plaster, "
                 "deep red, sky blue.",
    'forum':     "An ancient sunlit public square of pale marble: broad steps rising to a colonnade of fluted "
                 "columns, a raised speaker's platform decorated with bronze ship prows, laurel trees in great "
                 "urns, a fountain, cypress trees and terracotta roofs on distant hills, doves on the steps. "
                 "Paint it as a Mediterranean morning, not a ruin. Warm marble white, terracotta, olive green, "
                 "Aegean blue.",
    'scriptorium': "A medieval monastery writing room with tall arched stone windows letting in shafts of golden "
                 "light: slanted wooden writing desks, quills in pots, little bowls of bright pigment (lapis blue, "
                 "vermilion, gold leaf), open manuscripts showing only abstract vine borders and coloured swirls, "
                 "a candle-lit alcove, a cat-sized shelf of bound books with plain spines, a cloister garden "
                 "glimpsed through an arch. Stone grey, parchment cream, lapis blue, vermilion, gold.",
    'lakeside':  "A misty English lake among soft green fells in early morning: a stone boathouse, a rowing boat "
                 "pulled up on a pebble shore, drifts of wild daffodils under the trees, a slate cottage with a "
                 "smoking chimney, dry-stone walls climbing the hills, a waterfall in a ravine, low cloud on the "
                 "peaks, reflections in still water. Sage green, slate blue, daffodil yellow, mist white.",
}

JOBS = {}
# The Atlas of English: one painted land where each strand is a PLACE. Described, never named (a named
# place gets lettered). The app draws the road, the pins and every word on top (views/atlas.js ATLAS_PINS,
# measured against this painting — repaint it, re-measure).
JOBS['atlas'] = (PLACE.replace('A wide panorama', 'A storybook map-painting seen from high above at a gentle angle') + ' '
  "An imaginary green island land with seven clearly separate places spread across it, joined by one pale winding path: "
  "bottom left, a flower garden at the edge of a fairy-tale wood with a stone well and giant red toadstools; "
  "lower centre, a stone monastery with arched windows and a cloister; "
  "upper left, a tall old townhouse with many lit windows and chimneys among a few rooftops; "
  "right, a misty lake among soft green hills with a little boathouse and daffodils; "
  "centre, a square of pale marble with columns and broad steps; "
  "upper right, a round wooden open-air playhouse with pennants on its thatched roof; "
  "top centre, an old grey stone castle on a hill with a windmill. "
  "Sea around the edges, small boats, trees, fields, soft clouds. Leave open grass between the places. "
  "Warm, bright, inviting, like the endpaper map of a classic children's book.", '16:9')

NIGHT_REF_ATLAS = True
for k, v in WORLDS.items():
    JOBS[f'w-{k}'] = (PLACE + ' ' + v, '21:9')
    JOBS[f'w-{k}-night'] = (NIGHT, '21:9')
    NIGHT_REF[f'w-{k}-night'] = os.path.join(RAW, f'w-{k}.png')
JOBS['atlas-night'] = (NIGHT.replace('No people, no animals, no frame.', 'Keep it a map-painting seen from above. No people, no frame.'), '16:9')
NIGHT_REF['atlas-night'] = os.path.join(RAW, 'atlas.png')

# The mascot: a fox with a quill (owner's pick, 2 Oct 2026). Six poses on flat magenta so
# process.py --mascot keys them to alpha. The first pose is the model; the rest pass it as --ref.
FOX = ("A friendly young red fox mascot for a children's English app: chubby, round-cheeked, big kind amber "
       "eyes, cream chest and tail tip, a little teal waistcoat with two brass buttons, and a long white "
       "quill pen tucked behind one ear. Sticker style: a thick dark plum outline around the whole character, "
       "clean cel shading, bright flat colours, appealing and confident, never scary. Full body, centred, "
       "facing the viewer three-quarters. The background is ONE flat solid pure magenta (#FF00FF) colour edge "
       "to edge, with no shadow, no floor, no gradient and nothing else in the picture. " + NO_TEXT)
POSES = {
    'wave':  "Pose: standing, waving hello with one paw raised, a big open smile.",
    'cheer': "Pose: jumping for joy with both paws raised high, eyes squeezed happy, quill still behind the ear.",
    'think': "Pose: sitting, holding the quill thoughtfully to its chin, looking up and to the side, curious.",
    'point': "Pose: standing, pointing confidently to the right with one paw, as if presenting something, smiling.",
    'sleep': "Pose: curled up asleep on an open book with plain blank pages, tail wrapped round, eyes closed, a tiny smile.",
    'oops':  "Pose: sheepish, one paw scratching the back of its head, an ink splodge on its nose, a small apologetic grin.",
}
for k, v in POSES.items():
    JOBS[f'mascot-{k}'] = (FOX + ' ' + v + (' Draw the SAME fox as the reference image: same face, colours, waistcoat and quill.' if k != 'wave' else ''), '1:1')
# the browser tab's icon: the face alone, no tile — like Bizzing Bee's bee (owner, 4 Oct: "no background square")
JOBS['fav'] = ("The SAME fox as the reference image, its HEAD ONLY — no body, no paws, no neck below the chin — large and "
               "centred, facing the viewer, a big friendly smile, both ears up, the white quill behind one ear. Sticker style: "
               "a thick dark plum outline around the whole head, bright flat colours, simple shapes that still read at 16 pixels. "
               "The background is ONE flat solid pure magenta (#FF00FF) colour edge to edge, nothing else. " + NO_TEXT, '1:1')
JOBS['icon'] = ("App icon art: the SAME fox as the reference image, head and shoulders, large and centred, smiling, "
                "quill behind its ear, on a rich teal tile with a tone-on-tone pattern of open books and curling "
                "quill strokes. Thick plum outline on the fox. Square, full-bleed, no rounded corners. " + NO_TEXT, '1:1')

# Avatars: 12 packs x 8, two packs per world (SPEC §8, FAMILY-STANDARD §8). Creatures only — never a
# person, never a deity — and no face that is in a sibling's 96 (Bee, Maths, Geography, Finance, India).
AV_STYLE = ("A single cute chubby creature character for a children's app avatar, sticker style: a thick dark "
            "plum outline around the whole character, clean cel shading, bright flat colours, big friendly eyes, "
            "round squircle-friendly proportions, head and body, centred with space around it. The background is "
            "ONE flat solid BRIGHT pure magenta (#FF00FF) colour filling the WHOLE canvas edge to edge — not dark, "
            "not maroon, not a circle, not a rounded tile, no scenery behind — no shadow, no floor, no gradient. "
            "No people, no human figures. " + NO_TEXT + " The creature: ")
sys.path.insert(0, HERE)
from avatars_prompts import AVATARS   # id -> prompt (shared with the app catalogue by id)
for k, v in AVATARS.items():
    JOBS[f'av-{k}'] = (AV_STYLE + v, '1:1')

MEDAL_STYLE = ("A round medallion emblem for a children's app, in a warm painted storybook style, a single "
               "simple object in the middle of a circular enamel-and-gold medal, centred on a plain pure white "
               "background. " + NO_TEXT + " The object: ")
MEDALS = {
    'medal-first-stop':  "a small open book with a single bright star rising out of its pages. Teal and gold.",
    'medal-wordsmith':   "an old brass key whose bow is shaped like a curling vine leaf. Green and brass.",
    'medal-roots':       "a little sapling with deep spreading roots under the soil. Earth brown and leaf green.",
    'medal-sentence':    "three wooden building blocks stacked neatly into a small tower. Red, blue and yellow.",
    'medal-comma':       "a single curling feather quill dipping into a round inkwell. Indigo and silver.",
    'medal-reader':      "a lit candle beside a stack of three closed books with plain covers. Amber and oxblood.",
    'medal-bookworm':    "a smiling little green caterpillar peeking out of an apple-red book. Green and red.",
    'medal-week':        "seven small round pebbles arranged in a gentle arc on sand. Sand and slate.",
    'medal-mastery':     "a laurel wreath around a small glowing lantern. Gold and olive.",
    'medal-game':        "a wooden puzzle piece clicking into place. Coral and cream.",
    'medal-stage':       "a small wooden lectern with red velvet drapes behind it. Red and honey wood.",
    'medal-world':       "a little round window opening onto rolling green hills and a rising sun. Sky blue and gold.",
}
for k, v in MEDALS.items(): JOBS[k] = (MEDAL_STYLE + v, '1:1')

# Story paintings: every passage's `paint` (and `paint2`) and every Alice chapter's, read from the data
# so a story and its picture cannot drift (tools/art/story-prompts.mjs writes the JSON).
STORY_STYLE = ("A storybook illustration for a classic children's book, in warm hand-painted watercolour and gouache with "
               "fine ink line, gentle light, rich period detail, kind faces, one continuous full-bleed scene, 16:9. "
               "No frame, no border. " + NO_TEXT + " The scene: ")
_sp = os.path.join(HERE, 'story-prompts.json')
if os.path.exists(_sp):
    for k, v in json.load(open(_sp)).items(): JOBS[k] = (STORY_STYLE + v, '16:9')
# Tool headers (the Tools tab, views/tools.js): a painted strip behind each tool card. Places and objects only;
# the tool's name is drawn by the app over the painting, so nothing here may carry a letter or a digit.
TOOL_STYLE = ("Painted header illustration for a children's reading-and-writing app, in a warm hand-painted storybook "
              "style: soft gouache and watercolour textures, gentle directional light, rich but not garish colour, clean "
              "readable shapes. One continuous full-bleed scene, very wide, with the main object in the middle and calm "
              "space at the top and bottom edges. No frame, no border, no blank panels. No people, no human figures, no "
              "faces, no hands. " + NO_TEXT + " The scene: ")
TOOLS = {
    'stage':  "a small wooden lectern on a little raised wooden stage, heavy red velvet curtains drawn back on both sides "
              "with gold tassels, a warm spotlight pool on the boards, footlights glowing along the front edge. Deep red, "
              "honey wood, gold.",
    'desk':   "an old wooden writing desk by a window, a long white feather quill standing in a round glass inkwell, a "
              "sheet of cream paper with only faint grey squiggle lines, a brass candlestick, a sprig of lavender in a jar. "
              "Walnut brown, cream, indigo ink.",
    'vocab':  "a tall arched library window with afternoon light falling on a big open book on a reading stand, a brass "
              "magnifying glass resting over its pages (the pages show only soft grey squiggle lines), shelves of books "
              "with plain unmarked spines on either side. Deep green, amber, brass.",
    'idioms': "a whimsical walled garden of sayings: a large china teapot planter spilling flowers, a hedge clipped into "
              "the shape of a bull, a bronze bell hanging from an arch of roses, little round clouds drifting low over a "
              "lawn, a ladder leaning against an apple tree. Plum, rose pink, leaf green, sky blue.",
    'typing': "a cosy desk with an old-fashioned computer keyboard whose keys are all completely blank and unmarked, "
              "smooth round cream keys with nothing printed on them, ivy trailing over the desk edge, a small potted fern, "
              "a cup of cocoa, soft morning light. Cobalt blue, cream, ivy green.",
    'quotes': "a cosy reading nook in a window seat piled with cushions, several open books floating gently in the air "
              "above it with their pages fanning (pages show only soft grey squiggle lines), a few loose pages drifting "
              "like leaves, a warm lamp, twilight outside. Ochre gold, plum, midnight blue.",
}
for k, v in TOOLS.items(): JOBS[f'tool-{k}'] = (TOOL_STYLE + v, '21:9')
GROUPS = {'stories': [k for k in JOBS if k.startswith('story-')], 'book': [k for k in JOBS if k.startswith('book-')], 'atlas': ['atlas', 'atlas-night'], 'worlds': [k for k in JOBS if k.startswith('w-')], 'avatars': [k for k in JOBS if k.startswith('av-')],
          'medals': [k for k in JOBS if k.startswith('medal-')], 'tools': [k for k in JOBS if k.startswith('tool-')], 'mascot': [k for k in JOBS if k.startswith('mascot-') and k != 'mascot-wave'] + ['icon']}


# ═══════════════════════════════════ INKWELL ═══════════════════════════════════
# Inkwell Detective (docs/inkwell/season-one.md Part 2, Part 10; each case's art field). Painted storybook noir:
# warm textured gouache with ink line work, golden lamplight against deep teal and indigo shadows. Every plate is an
# EMPTY stage: no people, no characters, no animals (the app composites them); every sign, plaque, notice, page and
# clock face is blank (all words, numerals and clock hands are live). Places are described, never named.
#     python3 tools/art/gen.py --group inkwell            # plates first (day), then
#     python3 tools/art/gen.py --group inkwell-night      # night plates, each FROM its day plate
#     python3 tools/art/gen.py --group inkwell-stickers   # objects, emblems, UI props, Quill (keyed by process.py --inkwell)
#     python3 tools/art/process.py --inkwell              # → app/public/art/inkwell/*.webp
INK_NO_TEXT = (NO_TEXT + " Every sign board, shop fascia, plaque, notice, poster, label, book spine and page is blank or shows "
               "only soft abstract shapes. Any clock face has NO numerals, NO digits, NO marks that look like letters, and NO hands.")
INK_PLACE = ("Painted background plate for a children's detective story game, in a warm 'storybook noir' style: textured "
             "hand-painted gouache with fine ink line work, golden lamplight against deep teal and indigo shadows, rich but "
             "cosy colour, clean readable shapes, never scary. One continuous full-bleed scene with a calm, balanced, nearly "
             "symmetrical composition and open space in the middle. No frame, no border, no vignette panel, no blank "
             "rectangles, no white strips. An EMPTY scene: no people, no human figures, no faces, no hands, no silhouettes, "
             "no animals, no birds. " + INK_NO_TEXT + " The scene: ")
INK_NIGHT = ("Repaint the reference painting as ONE single night-time picture of the whole scene, full width, in the same "
             "composition and the same hand-painted storybook-noir style: a deep indigo night, lamps, lanterns and windows "
             "glowing warm gold, soft pools of lamplight, moonlight on edges, cosy and safe, never scary. Every part of the "
             "picture is night — it is NOT a comparison, NOT split, NOT side by side, NOT half day. Still an empty scene: "
             "no people, no silhouettes, no animals, no frame. " + INK_NO_TEXT)
INK_NIGHT_IN = ("Repaint the reference painting as ONE single late-evening picture of the same room, full width, in the same "
                "composition and the same hand-painted storybook-noir style: the windows now deep indigo night (rain or stars "
                "outside), the room lit only by warm lamps and candles, golden pools of light and soft teal shadows, cosy and "
                "safe, never scary. It is NOT a comparison, NOT split, NOT side by side. Still an empty room: no people, no "
                "silhouettes, no animals, no frame. " + INK_NO_TEXT)
INK_REF = {}

INK_AGENCY = ("the inside of a small, cosy detectives' office in the attic above a bakery, seen straight on, almost symmetrical. "
    "In the CENTRE of the back wall a big ROUND window with a brass frame looks out over a harbour: masts, moored fishing boats, "
    "a stone quay and a pink-gold morning sky. Under the window a large old wooden desk with a green leather top, a tall tower of "
    "fat dictionaries with plain unmarked spines, an empty brass desk lamp, an inkwell and a quill. On the LEFT wall a large EMPTY "
    "cork board in a wooden frame, with a few brass pins and loose red string coiled on a hook beside it (nothing pinned on it). "
    "Far left, a wooden hat stand with a row of hats from very small to tall. On the RIGHT wall a long wooden display shelf with "
    "twelve EMPTY little niches, each with its own small brass lamp, and beside it, painted ON the plaster wall, a tall painted "
    "storybook door: a door that is only a painting on the wall, arched, deep blue with gold painted vines and a large painted "
    "keyhole, standing a crack ajar with a thread of warm light along its edge. A brass speaking-tube coming out of the wall, a "
    "small wooden dumbwaiter hatch, sloping attic beams, a worn rug, warm honey wood and teal plaster.")
JOBS['ink-agency'] = (INK_PLACE + INK_AGENCY, '16:9')
JOBS['ink-agency-night'] = (INK_NIGHT_IN.replace('(rain or stars outside)', '(the round window full of stars over the dark harbour, '
    'boat lanterns twinkling)').replace('warm lamps and candles', 'the green-shaded brass desk lamp and the twelve tiny shelf lamps'), '16:9')
INK_REF['ink-agency-night'] = 'ink-agency'

INK_MAP = ("a bird's-eye painting of a whole small harbour town, seen from high above at a gentle angle like the endpaper of a "
    "classic storybook, NOT a map: no labels, no compass rose, no legend, no cartouche, no grid, no border. Seven clearly "
    "separate districts arranged around a centre, joined by winding cobbled lanes and canals, with open grass and trees between them: "
    "in the exact CENTRE, a great old stone library with a big green copper dome and six wings spreading out like a star; "
    "at the BOTTOM, across the whole width, a blue harbour with a curved stone quay, moored fishing boats with tall masts, and on "
    "the quay at bottom centre-left a little bakery with a red-tiled roof and a round attic window; "
    "at the LEFT, a formal garden with clipped hedges, a hedge maze, a white bandstand, a round stone fountain and a striped tent; "
    "at the UPPER LEFT, steep Victorian streets of tall brick houses with gas lamps, a narrow canal with a hump-backed bridge and a "
    "slim clock tower; "
    "at the TOP CENTRE, a round open-air wooden theatre with a thatched ring roof and little pennants; "
    "at the UPPER RIGHT, an ancient monastery-like wing of the library in grey stone with arched windows and a cloister; "
    "at the RIGHT, a pale stone square with broad steps and a columned town hall with a round clock; "
    "at the LOWER RIGHT, a misty lake among green hills with a long low wooden boathouse and a small island with a white lighthouse. "
    "Warm, bright, inviting; each district in its own palette (garden greens, lamplit amber, theatre red, scriptorium grey-gold, "
    "forum marble, lake blue-grey).")
JOBS['ink-map'] = (INK_PLACE.replace('a calm, balanced, nearly symmetrical composition and open space in the middle', 'districts spread evenly across the canvas') + INK_MAP, '16:9')
JOBS['ink-map-night'] = (INK_NIGHT.replace('Still an empty scene', 'Keep it the same bird\'s-eye town painting seen from above, every window and street lamp glowing. Still an empty scene'), '16:9')
INK_REF['ink-map-night'] = 'ink-map'

# One plate per case: its main stage (case-NN.json art.backgrounds), with a night (or day) partner.
INK_SCENES = {
    'case-00': ("a harbour quayside in the early morning: masts and moored fishing boats, a stone quay with iron bollards and coiled "
                "ropes, a pink-gold sky, wisps of sea fog. In the middle a little bakery with a big bow window glowing with buns and "
                "loaves, a BLANK painted fascia board above it, and a narrow green door beside it; a cherry-red bicycle chained to an "
                "iron lamp post; flour sacks by the step. Honey, teal and rose.", 'out'),
    'case-01': ("a sunny storybook public garden on flower-show day: clipped hedges, a big red-and-cream striped show tent with "
                "triangle bunting in the middle, a white bandstand with a round clock face, a stone fountain with a sitting stone fox "
                "in the distance, beds of bright flowers, gravel paths with heat shimmer, a young oak with a little mossy shed under "
                "it. Fresh greens, poppy red, buttercup yellow.", 'out'),
    'case-02': ("a gaslit Victorian street at dusk: wet cobbles reflecting light, a hump-backed stone bridge over a narrow canal in the "
                "middle, iron gas lamps in three heights (low, middle and one very tall one by the bridge), teal fog, a bakery window "
                "glowing warm gold, a bookshop window with stacked books and a blank arrow-shaped sign, chimney pots against the sky.", 'out'),
    'case-03': ("a storybook garden at dawn in soft white mist: in the middle a round stone fountain basin with a carved stone fox "
                "sitting on a rock above it, mouth open, a small BLANK bronze plaque on the rim; clipped yew hedges, a white bandstand "
                "half lost in mist behind, dew on the grass, an old brick wall with a small arched green wooden door half hidden by "
                "ivy, a squat iron valve box in ferns. Warm greens and soft gold light breaking through.", 'out'),
    'case-04': ("a grand old town-council chamber in morning light: a long polished oak table down the middle with high-backed "
                "chairs, an EMPTY velvet-lined wooden box in the centre of the table, a public gallery with a brass rail, tall "
                "windows with dust turning in sunbeams, a big round clock over the door, and over the door a carved stone band that "
                "is plain decorative moulding with an empty smooth strip. Warm stone, civic green, brass.", 'in'),
    'case-05': ("an open-air wooden theatre seen from the back of the seats: a curved bank of wooden benches under the sky, strings "
                "of lanterns along the rows, and on the stage a set built as a tall red-and-white striped lighthouse with a lamp room "
                "at the top and painted waves at its foot, heavy curtains at the sides. Deep teal sky, golden lanterns, warm red seats, "
                "one accent of green.", 'out'),
    'case-06': ("a pale stone civic square: broad stone steps rising to a columned town hall, a slim old clock tower beside it with a "
                "round clock face, market stalls with striped awnings behind, a little wooden speakers' box, two iron gas lamps, loose "
                "blank flyers blowing on the steps, a brisk windy sky. Warm marble, civic green, brass.", 'out'),
    'case-07': ("an open-air wooden stage seen from the wings: honey-coloured boards with a square seam of a trapdoor at the front "
                "centre, barely visible, a painted lighthouse flat at the back, a rope rail, strings of bulbs overhead, heavy curtains "
                "in deep shadow on both sides, a hooded prompt-corner lamp, empty wooden seats beyond the stage edge.", 'out'),
    'case-08': ("a vaulted stone room deep inside an ancient library: a long oak table down the middle with a big old map under a "
                "linen dust cloth, candle sconces, tall narrow windows letting in slanted bars of light, shelves of small wooden seal "
                "boxes each with a red wax tag, and high on the shadowy ceiling vault, half in darkness and not emphasised, a painted "
                "round clock face with no hands and no numerals. Stone grey, parchment, gold.", 'in'),
    'case-09': ("a misty lake at dawn: a long, low wooden boathouse whose broad grey roof slopes almost down to the water like the back "
                "of a sleeping animal, a stone slipway with a long rowing boat, swallows' nests under the eaves, a blank noticeboard by "
                "the door, and across the still water a small island with a white lighthouse. Soft pink and pearl-grey, sage green.", 'out'),
    'case-10': ("an old town registry office: a long brass-railed counter, walls of wooden pigeonholes with rolled papers, a tall "
                "grandfather clock, a wooden waiting-room bench with a folded blank newspaper on it and a pale square of sunlight on the "
                "floor, a green-shaded lamp, tall windows. Warm wood, brass, civic green.", 'in'),
    'case-11': ("the great front doors of an old public library at the top of broad stone steps, in full afternoon sun: two tall carved "
                "oak doors under a stone arch, above them a long carved stone band that is ONLY decorative carved texture (vines and "
                "waves, no letters), a glass display case on a stand in front of the doors, columns, potted bay trees, a green copper "
                "dome above. Honey stone, deep green, gold.", 'out'),
}
for k, (v, kind) in INK_SCENES.items():
    JOBS[f'ink-{k}'] = (INK_PLACE + v, '16:9')
    JOBS[f'ink-{k}-night'] = (INK_NIGHT_IN if kind == 'in' else INK_NIGHT, '16:9')
    INK_REF[f'ink-{k}-night'] = f'ink-{k}'
# specific nights the scripts ask for
JOBS['ink-case-02-night'] = (INK_NIGHT + " One of the gas lamps, the tallest one by the bridge, is DARK; every other lamp glows.", '16:9')
JOBS['ink-case-09-night'] = (INK_NIGHT + " It is regatta night: strings of lanterns along the shore and the boathouse, the island "
                             "lighthouse shining one narrow silver beam across the lake that lands on the boathouse roof and makes it "
                             "glitter silver, a few soft fading firework sparkles overhead.", '16:9')
JOBS['ink-case-08-night'] = (INK_NIGHT_IN + " Rain runs down the tall windows; lamplight pools on the map on the table.", '16:9')
# Case 11 happens at midnight in the Seal Room — its night plate is its own painting, not a repaint of the door.
JOBS['ink-case-11-night'] = (INK_PLACE + "the same vaulted stone library room at midnight, lit warm gold by one small brass lantern on "
    "the floor: a long oak table with a map under a linen cloth, shelves of seal boxes, tall narrow leaded windows full of night, "
    "and the whole ceiling vault painted with a HUGE pale-gold clock face whose twelve hour positions are simple round dots (no "
    "numerals, no letters) and which has NO hands at all. The floor is square stone tiles laid in rings around one single tile at "
    "the centre, with a soft unbroken skin of dust. High in one wall a round brass grille. Deep teal shadows; cosy, not eerie.", '16:9')
del INK_REF['ink-case-11-night']

# The four Ink Journeys (docs/inkwell/journey-0N-*.md, Art and scene notes).
INK_JOURNEYS = {
    'olympus':     "a broad empty upland meadow on a Greek hillside at dawn: mist in the hollows, purple cushions of wild thyme, "
                   "silver olive trees, a rough wooden gate with flattened grass beside it, rolling hills, and the blue sea far below. "
                   "Gold-pink light. No temple, no altar, no statue.",
    'asgard':      "the inside of a long Norse timber hall before dawn: carved wooden posts with knotwork and animal-shape carving only, "
                   "a hearth banked high with glowing embers, benches with furs, round wooden shields on the walls painted plain or with "
                   "simple spirals, a wooden peg directly under a square smoke-hole in the roof showing dark sky and stars, a little drift "
                   "of snow on the floor beneath it, a heavy door barred shut. No runes, no symbols on anything.",
    'verona':      "a warm stone Italian street of the 1590s at night: lanterns on iron brackets, tall old houses with shutters and "
                   "balconies, a cat-free garden wall with trailing vines, a brick bell tower against a deep blue starry sky, a narrow "
                   "arched town gate at the end of the street. Warm amber and inky blue. No banners with symbols.",
    'mississippi': "the long white upper deck of an 1880s paddle steamer at first light: a row of white stateroom doors, a narrow "
                   "railed walkway, two tall black chimneys breathing sparks, a glass pilot-house on top, river mist, a wide brown river "
                   "a mile across and a far wooded bank, black cinders drifting like snow. Pale gold and river brown. The paddle box is plain.",
}
for k, v in INK_JOURNEYS.items(): JOBS[f'ink-journey-{k}'] = (INK_PLACE + v, '16:9')

# UI materials: textures the app sets live text on. Plain, NOTHING written, filling the frame.
INK_MAT = ("A seamless-looking flat texture photographed straight down from directly above, filling the ENTIRE frame edge to "
           "edge, evenly lit with soft warm light, in a hand-painted storybook-noir gouache style. No objects on it, no shadows "
           "of objects, no frame, no border, no background visible around it. " + INK_NO_TEXT + " The surface: ")
INK_MATERIALS = {
    'cork':      ("a large cork board surface, warm honey-brown cork with natural speckles and grain, a few tiny old pin holes, "
                  "slightly darker towards the corners like lamplight.", '16:9'),
    'desk':      ("the top of an old dark walnut writing desk: rich wood grain running left to right, a few gentle scratches and a "
                  "faint old ink ring, warm polish catching lamplight.", '16:9'),
    'letter':    ("a single sheet of aged cream letter paper, laid paper with faint chain lines, soft deckled edges reaching the "
                  "frame, gentle foxing spots, completely blank.", '3:4'),
    'notice':    ("a sheet of heavy off-white card for a public notice, slightly yellowed, faint pin holes at the top corners, a thin "
                  "plain printed double border line near the edges, completely blank inside.", '3:4'),
    'diary':     ("a single page of an old diary, cream paper with faint pale-blue ruled lines and one thin red margin line on the "
                  "left, a soft crease, completely blank — no writing.", '3:4'),
    'newspaper': ("a sheet of aged yellowed newsprint, soft grey fibre texture, faint thin column rules dividing it into columns, "
                  "a slightly darker fold line, completely blank — no printing, no headlines, no letters.", '3:4'),
}
for k, (v, r) in INK_MATERIALS.items(): JOBS[f'ink-mat-{k}'] = (INK_MAT + v, r)

# Stickers on flat magenta, keyed by process.py --inkwell (flood from the edges up to the white sticker border).
INK_STICKER = ("A single object illustrated as a sticker for a children's detective game: warm painted storybook style with clean "
               "cel shading, a dark plum ink outline, and a THICK WHITE sticker border all the way around the object. One object only, "
               "centred, filling about two-thirds of the canvas, with space around it. The background is ONE flat solid BRIGHT pure "
               "magenta (#FF00FF) colour filling the WHOLE canvas edge to edge — no shadow, no floor, no gradient, no scenery. No "
               "people, no hands, no faces. " + NO_TEXT + " The object: ")
INK_OBJECTS = {   # case.officeObject.id → its prompt (the shelf of the Agency)
    'goose-feather':  "a single long clean white goose feather, slightly curled, soft grey shading.",
    'rosette':        "a second-place prize rosette with two tiers of pleated ribbon in royal blue and white, two ribbon tails, a "
                      "plain blank round centre button.",
    'pole-tip':       "a curved brass hook from the end of a lamplighter's pole, slightly worn, mounted upright on a small round wooden stand.",
    'stone-frog':     "a small mossy grey stone frog carving with a carved smile, patches of green moss.",
    'gavel-handle':   "an old cracked wooden gavel handle of dark old wood with a pale crack along it, tied round the middle with a "
                      "red silk ribbon bow.",
    'green-pen':      "an elegant emerald-green pen with a gold clip and a gold nib, lying diagonally.",
    'fountain-pen':   "a green fountain pen with a little gold clip shaped like a tiny tram car, lying diagonally, a gold nib.",
    'brass-lantern':  "a tiny brass lantern, no bigger than an egg cup, with glass panes, a ring handle on top and a warm glowing bulb inside.",
    'dividers':       "a pair of brass map-maker's dividers standing with its two pointed legs open, a hinge at the top with a small knurled wheel.",
    'bottle':         "a brown glass message bottle with a cork sealed by black wax pressed into a round blot, a rolled cream paper "
                      "inside tied with plain string, lying at a slight angle.",
    'red-pencil':     "a short, much-sharpened red pencil with a tiny golden crane bird stamped on its end, lying diagonally.",
    'charter-ribbon': "a length of faded pale-blue silk ribbon, frayed at both ends, loosely curled in an S shape.",
}
for k, v in INK_OBJECTS.items(): JOBS[f'ink-obj-{k}'] = (INK_STICKER + v, '1:1')
INK_EMBLEMS = {   # the six detectives' gifts, as OBJECTS only (HANDOVER Part C §1): never a deity, a person or a sacred object
    'thea':  "a round, wise little grey-brown owl with big amber eyes, sitting upright, wings folded (a small owl emblem).",
    'milo':  "a red trainer shoe with white laces tied in a figure of eight and a pair of small white feathered wings at the ankle.",
    'oskar': "two small black ravens perched side by side on a short twig, one looking left and one looking right, a glint in their eyes.",
    'signe': "a wooden drop spindle with a round wooden whorl, wound with soft yellow wool, a loose yellow strand curling away.",
    'hari':  "a small blue cloth-bound notebook with ten bright coloured paper tabs sticking out of its edge like a rainbow; its cover is plain.",
    'vani':  "a silver tuning fork standing upright with three soft curved sound-ripple lines on each side of its prongs.",
    'vani-veena': "a small Indian veena: a long brown wooden neck with frets, a round gourd resonator at each end, strings, plain wood without symbols.",
    'hoard': "a small fat leather-bound book with a brass clasp, a ribbon bookmark and a few loose golden sparkles; its cover is plain.",
}
for k, v in INK_EMBLEMS.items(): JOBS[f'ink-emb-{k}'] = (INK_STICKER + v, '1:1')
INK_UI = {
    'seal':      "a round red wax seal, like a map pin, with a plain impressed circle in the middle and soft drips at the edge.",
    'ledger':    "a small ribbon-tied notebook with a dark ink-blue cover, a red ribbon tied in a bow around it; its cover is plain.",
    'magnifier': "a brass magnifying glass with a turned wooden handle, the lens catching a soft highlight.",
    'card':      "a small cream calling card lying flat at a slight angle with one perfect round black ink blot in its middle.",
}
for k, v in INK_UI.items(): JOBS[f'ink-ui-{k}'] = (INK_STICKER + v, '1:1')
# Quill, the app's fox, as the agency's chief: the SAME fox as raw/mascot-wave.png, in a tiny deerstalker.
INK_QUILL = {
    'detective': "Pose: standing, peering through a big brass magnifying glass held up in one paw, one eyebrow raised, a curious smile.",
    'think':     "Pose: sitting, one paw on its chin, looking up and to the side, thinking hard, a tiny smile.",
}
for k, v in INK_QUILL.items():
    JOBS[f'ink-quill-{k}'] = (FOX + ' ' + v + " It wears a TINY brown-and-cream checked deerstalker hat perched between its ears "
                              "(the white quill still behind one ear). Draw the SAME fox as the reference image: same face, colours, "
                              "teal waistcoat with brass buttons, the quill, and the same white sticker border.", '1:1')
    INK_REF[f'ink-quill-{k}'] = 'mascot-wave'
for k, v in INK_REF.items(): NIGHT_REF[k] = os.path.join(RAW, v + '.png')
GROUPS['inkwell'] = [k for k in JOBS if k.startswith('ink-') and not k.endswith('-night') and not k.startswith(('ink-obj-', 'ink-emb-', 'ink-ui-', 'ink-quill-'))] + ['ink-case-11-night']
GROUPS['inkwell-night'] = [k for k in JOBS if k.startswith('ink-') and k.endswith('-night') and k != 'ink-case-11-night']
GROUPS['inkwell-stickers'] = [k for k in JOBS if k.startswith(('ink-obj-', 'ink-emb-', 'ink-ui-', 'ink-quill-'))]
# ═════════════════════════════════ end INKWELL ═════════════════════════════════


def call(model, prompt, ratio, ref=None):
    parts = [{"text": prompt}]
    if ref: parts.append({"inlineData": {"mimeType": "image/png", "data": base64.b64encode(open(ref, 'rb').read()).decode()}})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": ratio}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=240) as r:
        d = json.load(r)
    for c in d.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            if 'inlineData' in p: return base64.b64decode(p['inlineData']['data'])
    raise RuntimeError('no image in response: ' + json.dumps(d)[:300])


def run(name, ref=None):
    prompt, ratio = JOBS[name]
    out = os.path.join(RAW, name + '.png')
    msg = ''
    for attempt in range(6):
        model = MODELS[attempt % len(MODELS)]
        try:
            img = call(model, prompt, ratio, ref)
            open(out, 'wb').write(img)
            return f'{name}: ok ({model}, {len(img)//1024} KB)'
        except Exception as e:
            msg = getattr(e, 'read', lambda: b'')().decode(errors='ignore')[:200] or str(e)[:200]
            time.sleep(4 + attempt * 6)
    return f'{name}: FAILED — {msg}'


def arg(flag):
    for i, a in enumerate(sys.argv):
        if a == flag and i + 1 < len(sys.argv): return sys.argv[i + 1]
        if a.startswith(flag + '='): return a.split('=', 1)[1]
    return None


if __name__ == '__main__':
    only, group, ref = arg('--only'), arg('--group'), arg('--ref')
    names = only.split(',') if only else GROUPS[group] if group else list(JOBS)
    if ref and not os.path.isabs(ref): ref = os.path.join(HERE, ref)
    if group == 'mascot' and not ref: ref = os.path.join(RAW, 'mascot-wave.png')
    if '--force' not in sys.argv: names = [n for n in names if not os.path.exists(os.path.join(RAW, n + '.png'))]
    print(f'{len(names)} jobs', flush=True)
    with cf.ThreadPoolExecutor(int(os.environ.get('NB_WORKERS', '6'))) as ex:
        for line in ex.map(lambda n: run(n, NIGHT_REF.get(n, ref)), names): print(line, flush=True)
