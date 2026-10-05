"""The Big Data hero (#556): night falls over the Teide Observatory from left to right, and each telescope
composes a layer that reads from the one before — bronze, silver, gold — drawn in the sky as a neural
network is drawn.

The photograph is "Teide Observatory 2018 077.jpg" (Mike Peel, Wikimedia Commons, CC BY-SA 4.0), 5184 x 3456,
a Canon EOS 60D at 39 mm: three robotic-telescope domes at Izana, the sea and an island on the horizon. The
founder's story (2026-10-05, second round): a sweep from left to right, as if night were falling; over the
first dome it picks stars, the first layer; reaching the second dome a second layer is composed that reads
from the first, and so on with the third. What stays in the sky is the classic drawing of a neural network,
left to right. A first round (a graticule, thousands of detections, a test pass) was "la imagen bien, la
animacion mal".

What the hero needs from the photograph is measured on it, never placed by eye:

- the camera, to place the stars and the sea horizon: the focal length, 8,795 px, is 39 mm over the file's
  own focal-plane resolution (5,728 px per inch); no roll (the doors' edges are vertical); the pitch, 5.3
  degrees down, puts the sea horizon at row 1130, which lies 1.43 degrees under the true horizon from
  Izana's 2,390 m (dip = 1.76' x sqrt(h), refraction included);
- the domes: their outlines (each layer's dome lights up with it) and their centres (each layer's column of
  nodes stands over its dome).

    python3 docs/design/hero-rotativo/teide.py <original.jpg> <seedvr2-2x.png>

writes, under new names so no browser keeps an older cut:

- public/assets/hero/bd-observatorio-entero{-720,,-2016}.webp   the photograph, whole, restored, the
                                                                 operator's logo painted out of two doors
- src/assets/hero/bd-cielo.json      what the component plays: the sea horizon's row, the domes (outline,
                                     centre, top) and the stars the night reveals

The whole frame is shown (1.5 wide), so the left dome clears the seal on desktops; SeedVR2 is fed it at 2304
px (`--resolution 3072`, twice its height).
"""
import os, sys, json
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from photo_restore import neutral_whites  # noqa: E402  the one white balance every hero photograph gets
ROOT = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
PUB = os.path.join(ROOT, "public", "assets", "hero")
DATA = os.path.join(ROOT, "src", "assets", "hero", "bd-cielo.json")
SIZES = [(2016, "-2016"), (1320, ""), (720, "-720")]

W0, H0 = 5184, 3456                      # the photograph; everything below is in its pixels
FW, FH = W0, H0                          # the frame the hero shows: the whole photograph, so the left dome clears the seal
SV_IN = (2304, 1536)                     # what SeedVR2 is fed

# the camera (see the docstring): x right, y up, z ahead and level; it looks PITCH down
F = 39 / (25.4 / 5728.176795580111)
CX, CY = W0 / 2, H0 / 2
SEA = 1130.0
DIP = np.radians(1.43)
PITCH = np.arctan((CY - SEA) / F) + DIP

# the operator's logo on the two doors (the third door carries only a warning sign)
MARKS = [(1036, 1948, 1116, 2030), (2614, 1942, 2684, 2014)]
# the domes, each in its box and cut at the foot of its plinth: their outlines are what the drawing traces
DOMES = [(690, 1590, 1190, 2050), (2360, 1680, 2700, 2016), (4520, 1830, 4990, 2244)]


def proj(alt, az):
    """degrees of altitude and azimuth (0 = the camera's heading) -> pixels of the photograph"""
    a, z = np.radians(alt), np.radians(az)
    d = np.stack([np.cos(a) * np.sin(z), np.sin(a), np.cos(a) * np.cos(z)], -1)
    c, s = np.cos(PITCH), np.sin(PITCH)
    xc, yc, zc = d[..., 0], d[..., 1] * c + d[..., 2] * s, -d[..., 1] * s + d[..., 2] * c
    return np.stack([CX + F * xc / zc, CY - F * yc / zc], -1)


def unproj(x, y):
    """pixels -> degrees of altitude and azimuth"""
    v = np.array([(x - CX) / F, -(y - CY) / F, 1.0])
    c, s = np.cos(PITCH), np.sin(PITCH)
    d = np.array([v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c])
    d /= np.linalg.norm(d)
    return np.degrees(np.arcsin(d[1])), np.degrees(np.arctan2(d[0], d[2]))


ALT_TOP = unproj(CX, 0)[0]
ALT_SEA = -np.degrees(DIP)               # from the mountain the sky reaches down to the sea horizon
ALT_MAX = 9.5                            # above the frame, up to the band's top on desktops
AZ_L, AZ_R = unproj(0, CY)[1] - 1, unproj(W0, CY)[1] + 1


def flat(pts):
    return [int(round(v)) for p in pts for v in p]


def photo(original, restored):
    """the whites are measured on the domes only: the haze over the sea is pale enough to pass for white, and
    taking it out (b -10.6) greyed the whole sky"""
    rgb = cv2.cvtColor(cv2.imread(restored), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    k = rgb.shape[1] / FW
    rgb = rgb[:round(FH * k)]
    shells = np.zeros(rgb.shape[:2], np.uint8)
    cv2.fillPoly(shells, [np.round(c * k).astype(np.int32) for c in domes(original)], 1)
    rgb = neutral_whites(rgb, shells.astype(np.float32))
    img = cv2.cvtColor((rgb * 255 + .5).clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    hole = np.zeros(img.shape[:2], np.uint8)
    for x0, y0, x1, y1 in MARKS:
        hole[int(y0 * k):int(y1 * k), int(x0 * k):int(x1 * k)] = 255
    img = cv2.inpaint(img, hole, int(5 * k), cv2.INPAINT_TELEA)
    im = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    for w, suf in SIZES:
        out = im.resize((w, round(w * FH / FW)), Image.LANCZOS)
        p = os.path.join(PUB, f"bd-observatorio-entero{suf}.webp")
        out.save(p, "WEBP", quality=80, method=6)
        print(os.path.relpath(p, ROOT), out.size, f"{os.path.getsize(p) // 1024} KB")


def domes(original):
    """each dome's outline: what is neither the blue of sky and sea, nor scrub, nor shadow — the shaded side
    of a dome is bluish but paler than the sea (saturation 120 against 155), so a plain white threshold
    loses it. The domes are convex, so their hull cleans the edge the scrub frays."""
    hsv = cv2.cvtColor(cv2.imread(original), cv2.COLOR_BGR2HSV).astype(int)
    out = []
    for x0, y0, x1, y1 in DOMES:
        H, S, V = (hsv[y0:y1, x0:x1, i] for i in range(3))
        bg = ((H >= 95) & (H <= 118) & (S > 135)) | ((H < 45) & (S > 45)) | (V < 75)
        m = (~bg).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m)
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        ys, xs = np.nonzero(lab == big)
        hull = cv2.convexHull(np.stack([xs, ys], 1).astype(np.int32))[:, 0, :]
        out.append(cv2.approxPolyDP(hull, 2.0, True)[:, 0, :] + [x0, y0])
    return out


def stars(seed=556):
    """the sky the night reveals: many faint, few bright, a third denser along a band like the Milky Way's,
    from the sea horizon up to the band's top"""
    rng = np.random.default_rng(seed)
    out = []
    while len(out) < 1400:
        alt, az = rng.uniform(ALT_SEA + .12, ALT_MAX), rng.uniform(AZ_L, AZ_R)
        band = np.exp(-((alt - (1.5 + .2 * (az - AZ_L))) ** 2) / 3)
        if rng.random() > .55 + .45 * band:
            continue
        x, y = proj(np.array(alt), np.array(az))
        if not (8 < x < FW - 8):
            continue
        out.append([int(x), int(y), 2 if rng.random() < .05 else 1 if rng.random() < .22 else 0])
    return out


def write(original):
    ds = []
    for c in domes(original):
        x0, y0 = c.min(0)
        x1, y1 = c.max(0)
        ds.append({"c": [int((x0 + x1) / 2), int(y0), int(y1)], "p": flat(np.vstack([c, c[:1]]))})
    st = stars()
    data = {"frame": [FW, FH], "sea": int(SEA), "domes": ds, "stars": [v for p in st for v in p]}
    json.dump(data, open(DATA, "w"), separators=(",", ":"))
    print(os.path.relpath(DATA, ROOT), len(ds), "domes at", [d["c"][0] for d in ds], ",", len(st), "stars,",
          f"{os.path.getsize(DATA) // 1024} KB")


if __name__ == "__main__":
    original = sys.argv[1]
    print(f"camera: F {F:.0f} px, pitch {np.degrees(PITCH):.2f} deg, sky 0..{ALT_TOP:.2f} deg, az {AZ_L:.1f}..{AZ_R:.1f}")
    print("true horizon at row", round(float(proj(np.array(0.), np.array(0.))[1]), 1))
    write(original)
    if len(sys.argv) > 2:
        photo(original, sys.argv[2])
