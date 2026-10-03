#!/usr/bin/env python3
"""gen.py — paint Bizzing English's places, mascot, avatars and medals with a Gemini image model.

The family doctrine: an image model paints PLACES and creatures; everything structural (the
Atlas road, pins, numbers, words) is drawn by the app. So a prompt never names a place (a
named place gets lettered on a sign), never asks for "a calmer band" (it paints a literal
translucent rectangle), and never asks for lettering of any kind. Look at every raw image in
tools/art/raw/ before process.py ships it.

    python3 tools/art/gen.py --only mascot-wave          # the mascot's model pose first
    python3 tools/art/gen.py --only mascot-cheer --ref raw/mascot-wave.png
    python3 tools/art/gen.py --group worlds|avatars|medals|mascot
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
GROUPS = {'stories': [k for k in JOBS if k.startswith('story-')], 'book': [k for k in JOBS if k.startswith('book-')], 'atlas': ['atlas', 'atlas-night'], 'worlds': [k for k in JOBS if k.startswith('w-')], 'avatars': [k for k in JOBS if k.startswith('av-')],
          'medals': [k for k in JOBS if k.startswith('medal-')], 'mascot': [k for k in JOBS if k.startswith('mascot-') and k != 'mascot-wave'] + ['icon']}


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
