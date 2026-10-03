#!/usr/bin/env python3
"""process.py — size the raw paintings for the app (look at every one in raw/ first).

    python3 tools/art/process.py --all
    python3 tools/art/process.py --avatars | --mascot | --worlds | --medals | --icon

Avatars and mascot poses are keyed off their flat magenta ground to alpha (Bizzing Maths'
keying, after Bee's champions-pack.py), trimmed and centred. The key fails LOUDLY on a ghost:
if the ground was not close to magenta, too little of the canvas keys away (or too much of the
creature does) and the image is named for a repaint rather than shipped half-transparent.
Worlds: 1920 wide for the backdrop and a 720-wide card crop for Home's journey plates."""
import os, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
PUB = os.path.join(HERE, '..', '..', 'app', 'public')
for d in ('art', 'avatars', 'mascot', 'icons'): os.makedirs(os.path.join(PUB, d), exist_ok=True)
GHOSTS = []


def key(src):
    a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    h, w = a.shape[:2]
    kc = np.median(np.stack([a[0, 0, :3], a[0, w - 1, :3], a[h - 1, 0, :3], a[h - 1, w - 1, :3]]), axis=0)
    if not (kc[0] > 150 and kc[2] > 110 and kc[1] < 110):          # the ground is not magenta-ish
        GHOSTS.append(f'{os.path.basename(src)}: ground {kc.astype(int).tolist()} is not magenta')
    # Flood the ground in from the edges and stop at the sticker's white outline, so a red fox or a
    # purple cat whose colour is near the magenta is never keyed away (a colour key alone did that).
    dist = np.sqrt(((a[:, :, :3] - kc) ** 2).sum(axis=2))
    near = Image.fromarray(np.where(dist < 110, 255, 0).astype(np.uint8), 'L').copy()   # a writable copy: floodfill on a numpy-backed image silently does nothing
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if near.getpixel(xy) == 255: ImageDraw.floodfill(near, xy, 128)
    ground = np.asarray(near) == 128
    from PIL import ImageFilter
    soft = np.asarray(Image.fromarray(np.where(ground, 0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    alpha = np.where(ground, np.minimum(soft, np.clip((dist - 40.0) / 70.0, 0, 1)), 1.0)
    out = a.copy(); out[:, :, 3] = alpha * 255
    edge = (alpha > 0.02) & (alpha < 0.98)
    if edge.any():
        f = alpha[edge][:, None]
        out[:, :, :3][edge] = np.clip((out[:, :, :3][edge] - kc * (1 - f)) / np.maximum(f, 0.15), 0, 255)
    kept = (alpha > 0.5).mean()
    if kept < 0.12 or kept > 0.85: GHOSTS.append(f'{os.path.basename(src)}: {kept:.0%} of the canvas kept')
    im = Image.fromarray(out.astype(np.uint8), 'RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    return im.crop(bb) if bb else im


def square(im, size, pad=1.06):
    side = int(max(im.size) * pad)
    c = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    c.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return c.resize((size, size), Image.LANCZOS)


def save(im, path, q=86):
    im.save(path, 'WEBP', quality=q, method=6)
    return os.path.getsize(path)


def avatars():
    t = 0
    for f in sorted(os.listdir(RAW)):
        if f.startswith('av-') and f.endswith('.png'):
            t += save(square(key(os.path.join(RAW, f)), 256), os.path.join(PUB, 'avatars', f[3:-4] + '.webp'), 84)
    print(f'avatars: {t // 1024} KB')


def mascot():
    for f in sorted(os.listdir(RAW)):
        if f.startswith('mascot-') and f.endswith('.png'):
            im = key(os.path.join(RAW, f)); n = f[7:-4]
            save(square(im, 400, 1.02), os.path.join(PUB, 'mascot', n + '.webp'))
            if n == 'wave':                                   # the logo head: the top of the model pose
                head = im.crop((0, 0, im.width, int(im.height * 0.56)))
                bb = head.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox(); head = head.crop(bb)
                save(square(head, 128, 1.0), os.path.join(PUB, 'mascot', 'head.webp'), 90)
    print('mascot: poses + head')


def worlds():
    t = 0
    for f in sorted(os.listdir(RAW)):
        if f.startswith('w-') and f.endswith('.png'):
            im = Image.open(os.path.join(RAW, f)).convert('RGB'); n = f[:-4]
            big = im.resize((1920, round(im.height * 1920 / im.width)), Image.LANCZOS)
            t += save(big, os.path.join(PUB, 'art', n + '.webp'), 76)
            card = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
            t += save(card, os.path.join(PUB, 'art', n + '-card.webp'), 74)
    print(f'worlds: {t // 1024} KB')


def atlas():
    for n in ('atlas', 'atlas-night'):
        f = os.path.join(RAW, n + '.png')
        if not os.path.exists(f): continue
        im = Image.open(f).convert('RGB')
        save(im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS), os.path.join(PUB, 'art', n + '.webp'), 80)
        save(im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS), os.path.join(PUB, 'art', n + '-small.webp'), 76)
    print('atlas: done')


def stories():
    """raw/story-<id>(-2).png → art/story/<id>(-2).webp; raw/book-alice-<n>.png → art/book/alice-<n>.webp;
    then app/src/data/story-art.json lists exactly what exists, so a story with no painting yet wears its
    shelf's world instead of asking for a file that is not there."""
    import json
    for sub in ('story', 'book'): os.makedirs(os.path.join(PUB, 'art', sub), exist_ok=True)
    for f in sorted(os.listdir(RAW)):
        if f.startswith('story-') and f.endswith('.png'): dst = os.path.join(PUB, 'art', 'story', f[6:-4] + '.webp')
        elif f.startswith('book-') and f.endswith('.png'): dst = os.path.join(PUB, 'art', 'book', f[5:-4] + '.webp')
        else: continue
        im = Image.open(os.path.join(RAW, f)).convert('RGB')
        save(im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS), dst, 78)
        save(im.resize((480, round(im.height * 480 / im.width)), Image.LANCZOS), dst.replace('.webp', '-card.webp'), 74)   # rails and cards
    have = sorted([('story/' + f[:-5]) for f in os.listdir(os.path.join(PUB, 'art', 'story')) if f.endswith('.webp') and not f.endswith('-card.webp')] +
                  [('book/' + f[:-5]) for f in os.listdir(os.path.join(PUB, 'art', 'book')) if f.endswith('.webp') and not f.endswith('-card.webp')])
    json.dump(have, open(os.path.join(HERE, '..', '..', 'app', 'src', 'data', 'story-art.json'), 'w'))
    print(f'stories: {len(have)} paintings')


def medals():
    from PIL import ImageChops
    for f in sorted(os.listdir(RAW)):
        if not (f.startswith('medal-') and f.endswith('.png')): continue
        im = Image.open(os.path.join(RAW, f)).convert('RGB')
        diff = ImageChops.difference(im, Image.new('RGB', im.size, (255, 255, 255))).convert('L').point(lambda v: 255 if v > 38 else 0)
        x0, y0, x1, y1 = diff.getbbox(); side = max(x1 - x0, y1 - y0); cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        im = im.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)).resize((512, 512), Image.LANCZOS)
        mask = Image.new('L', (2048, 2048), 0); ImageDraw.Draw(mask).ellipse((10, 10, 2038, 2038), fill=255)
        im.putalpha(mask.resize((512, 512), Image.LANCZOS))
        save(im.resize((192, 192), Image.LANCZOS), os.path.join(PUB, 'art', f[:-4] + '.webp'), 84)
    print('medals: done')


def icon():
    im = Image.open(os.path.join(RAW, 'icon.png')).convert('RGB')
    for n, s in (('icon-192', 192), ('icon-512', 512), ('maskable-512', 512), ('apple-touch-180', 180)):
        im.resize((s, s), Image.LANCZOS).save(os.path.join(PUB, 'icons', n + '.png'), optimize=True)
    im.resize((64, 64), Image.LANCZOS).save(os.path.join(PUB, 'icons', 'favicon-64.png'), optimize=True)
    print('icons: done')


a = sys.argv
if '--all' in a or '--avatars' in a: avatars()
if '--all' in a or '--mascot' in a: mascot()
if '--all' in a or '--worlds' in a: worlds()
if '--all' in a or '--medals' in a: medals()
if '--all' in a or '--icon' in a: icon()
if '--all' in a or '--atlas' in a: atlas()
if '--all' in a or '--stories' in a: stories()
if GHOSTS:
    print('REPAINT — the key failed on:\n  ' + '\n  '.join(GHOSTS)); sys.exit(1)
