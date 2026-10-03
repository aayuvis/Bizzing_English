#!/usr/bin/env python3
"""tts.py — record Bizzing English's narration in the family narrator's voice.

    node tools/voice/clips.mjs            # what to record, asked of the data
    python3 tools/voice/tts.py [--force] [--only st/aesop-] [--prune]

The narrator: en-US-Chirp3-HD-Laomedeia at 1.02 — US English (the owner, 3 Oct 2026: "the voice in the English app
has to be US English, not Indian English"; the same narrator as the family's, in her US voice). The owner approved
recorded narration for English on 2 Oct 2026 ("with narration"), so the device-voice fallback is
only for a clip that is missing.

Every clip is LINTED before it lands (Bee's lesson): rejected if its mean loudness is below -20 dB
or it is shorter than 0.35 s. A clip is written to a temp file and renamed only once it passes, so a
failed batch never leaves a half-written file; --prune removes clips no longer in clips.json (a
failed batch once left stale clips that sounded right and said the wrong thing). A clip is
re-recorded when its text or the voice changes: the manifest stores a hash of both.

The key is read from $GTTS_FILE or /root/.gttskey — never from the repo, never printed.
Output: app/public/voice/<key>.mp3 and app/src/data/voice-manifest.json {key: [ms, texthash]}.
"""
import base64, hashlib, json, os, re, subprocess, sys, time, urllib.request, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'app', 'public', 'voice')
MAN = os.path.join(ROOT, 'app', 'src', 'data', 'voice-manifest.json')
VOICE, LANG, RATE = 'en-US-Chirp3-HD-Laomedeia', 'en-US', 1.02
GAIN = 8.0   # her US voice comes out ~5 dB quieter than the en-IN one; lift it so every clip clears the -20 dB lint
KEY = open(os.environ.get('GTTS_FILE', '/root/.gttskey')).read().strip()


def synth(text):
    body = {"input": {"text": text}, "voice": {"languageCode": LANG, "name": VOICE}, "audioConfig": {"audioEncoding": "MP3", "speakingRate": RATE, "volumeGainDb": GAIN}}
    req = urllib.request.Request("https://texttospeech.googleapis.com/v1/text:synthesize", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=180) as r:
        return base64.b64decode(json.load(r)['audioContent'])


def breathe(text, limit=240):
    """The voice refuses a sentence that runs too long (Carroll's run to 140 words). For the VOICE only — the
    words on screen are never changed — a long sentence takes a full stop at its own semicolons, colons
    and then commas, every ~limit characters, so she draws breath where the author paused."""
    out = []
    for sent in re.split(r'(?<=[.!?])\s+', text):
        while len(sent) > limit:
            cut = max([m.end() for m in re.finditer(r'[;:,—]\s', sent[:limit])] or [0])
            if cut < 40: break
            out.append(sent[:cut].rstrip(' ,;:—') + '.'); sent = sent[cut:].lstrip()
        out.append(sent)
    return ' '.join(out)


def lint(path):
    """(ok, ms, mean_db) from ffmpeg: duration and mean volume."""
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True)
    d = re.search(r'Duration: (\d+):(\d+):([\d.]+)', p.stderr); m = re.search(r'mean_volume: (-?[\d.]+) dB', p.stderr)
    ms = int((int(d[1]) * 3600 + int(d[2]) * 60 + float(d[3])) * 1000) if d else 0
    db = float(m[1]) if m else -99
    return ms >= 350 and db >= -20, ms, db


def h(text): return hashlib.sha1((VOICE + '|' + text).encode()).hexdigest()[:10]   # the voice is part of the clip: change it and every clip is re-recorded


def run(c, man, force):
    key, text = c['key'], c['text']
    dst = os.path.join(OUT, key + '.mp3')
    if not force and key in man and man[key][1] == h(text) and os.path.exists(dst): return key, 'kept', man[key]
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + '.part'
    for attempt in range(5):
        try:
            open(tmp, 'wb').write(synth(text if attempt == 0 else breathe(text)))
            ok, ms, db = lint(tmp)
            if not ok:
                os.remove(tmp); return key, f'REJECTED ({ms} ms, {db} dB)', None
            os.replace(tmp, dst); return key, f'ok {ms} ms {db} dB', [ms, h(text)]
        except Exception as e:
            err = getattr(e, 'read', lambda: b'')().decode(errors='ignore')[:200] or str(e)[:200]
            time.sleep(3 + attempt * 5)
    if os.path.exists(tmp): os.remove(tmp)
    return key, 'FAILED ' + err, None


if __name__ == '__main__':
    clips = json.load(open(os.path.join(ROOT, 'tools', 'voice', 'clips.json')))
    only = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--only=')), None)
    if only: clips = [c for c in clips if c['key'].startswith(only)]
    man = json.load(open(MAN)) if os.path.exists(MAN) else {}
    force = '--force' in sys.argv
    bad = 0
    with cf.ThreadPoolExecutor(6) as ex:
        for key, say, entry in ex.map(lambda c: run(c, man, force), clips):
            if entry: man[key] = entry
            else: bad += 1; man.pop(key, None)
            if say != 'kept': print(key, say, flush=True)
    if '--prune' in sys.argv:
        want = {c['key'] for c in json.load(open(os.path.join(ROOT, 'tools', 'voice', 'clips.json')))}
        for k in list(man):
            if k not in want:
                man.pop(k); f = os.path.join(OUT, k + '.mp3')
                if os.path.exists(f): os.remove(f); print('pruned', k)
        for dp, _, fs in os.walk(OUT):
            for f in fs:
                k = os.path.relpath(os.path.join(dp, f), OUT)[:-4]
                if f.endswith('.part') or (f.endswith('.mp3') and k not in want): os.remove(os.path.join(dp, f)); print('straggler removed', k)
    json.dump(dict(sorted(man.items())), open(MAN, 'w'), indent=0)
    print(f'{len(man)} clips in the manifest, {bad} failed or rejected')
    sys.exit(1 if bad else 0)
