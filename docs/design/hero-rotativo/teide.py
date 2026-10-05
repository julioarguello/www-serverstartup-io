"""The Big Data hero (#556): the sky over the Teide Observatory fills with data, and only what passes its tests
reaches the catalogue.

The photograph is "Teide Observatory 2018 077.jpg" (Mike Peel, Wikimedia Commons, CC BY-SA 4.0), 5184 x 3456,
a Canon EOS 60D at 39 mm: three robotic-telescope domes at Izana, the sea and an island on the horizon. The
founder's story (2026-10-05, option R): the photograph by day; night falls, the domes are drawn in line, an
alt-azimuth graticule is drawn over the sky and thousands of raw detections fill it; a test pass sweeps the
sky, the noise goes and what passes is the catalogue.

The drawing is measured on the photograph, never placed by eye. The camera:

- the focal length, 8,796 px: 39 mm over the file's own focal-plane resolution (5,728 px per inch);
- no roll: the doors' edges are vertical, and the sea horizon is level across the right half, where nothing
  stands on it (the island hides it on the left);
- the pitch, 5.3 degrees down: the sea horizon, at row 1130, lies 1.43 degrees under the true horizon from
  Izana's 2,390 m (dip = 1.76' x sqrt(h), refraction included), so altitude 0 is 220 px above it.

The sky in the frame then spans 0 to 5.8 degrees of altitude, and from the mountain down to -1.43 at the sea
horizon, across 33 degrees of azimuth: the graticule is a telescope's, one degree apart.

    python3 docs/design/hero-rotativo/teide.py <original.jpg> <seedvr2-2x.png>

writes, under new names so no browser keeps an older cut:

- public/assets/hero/bd-observatorio-restaurado{-720,,-2016}.webp   the photograph, restored, the operator's
                                                                     logo painted out of the two doors
- src/assets/hero/bd-cielo.json      what the component plays on its canvas: the graticule and the domes'
                                     outlines (each line with its start), the raw detections and the
                                     satellite trails

The sky goes on above the frame: at night the band IS the sky, so the graticule and the detections climb to
8.5 degrees, about the band's top on desktops, and the component draws them over the veil, around the copy.

SeedVR2 is fed rows 0-2804 scaled to 2304 px (`--resolution 2492`, twice its height), and the frame is cut
from the top of its output: at 2x the original's 5184 px would not fit the restorer, and the hero never shows
more than 2016.
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
FW, FH = W0, 2520                        # the frame the hero shows: the foreground goes, 2.06 wide like the elevation's
SV_IN = (0, 0, W0, 2804), (2304, 1246)   # what SeedVR2 is fed: a taller cut, scaled; the frame is its top

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
ALT_MAX = 8.5                            # above the frame, up to about the band's top on desktops
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
        p = os.path.join(PUB, f"bd-observatorio-restaurado{suf}.webp")
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


def drawing(original):
    """the graticule (1 degree apart, the true horizon heaviest) and the domes; each line carries its start in
    ms after the drawing begins: the altitude circles from the horizon up, the azimuth lines from the frame's
    middle outward, the domes first"""
    lines = []
    for c in domes(original):
        lines.append({"k": "dome", "d": 0, "p": flat(np.vstack([c, c[:1]]))})
    for i, alt in enumerate(np.arange(-1, ALT_MAX + .01, 1.0)):
        p = proj(np.full(32, alt), np.linspace(AZ_L, AZ_R, 32))
        lines.append({"k": "zero" if alt == 0 else "alt", "d": 100 * i, "p": flat(p)})
    for az in np.arange(np.ceil(AZ_L), AZ_R, 1.0):
        # a vertical circle is a straight line through a pinhole: its two ends are enough
        p = proj(np.array([ALT_SEA, ALT_MAX]), np.full(2, az))
        if p[:, 0].max() < 0 or p[:, 0].min() > FW:
            continue
        lines.append({"k": "az", "d": int(250 + 40 * abs(az)), "p": flat(p)})
    return lines


def detections(seed=556):
    """raw detections over the sky: many faint, few bright, denser along a band; a fifth of them noise,
    and three satellite trails. Points are in a random order, the order they light up in"""
    rng = np.random.default_rng(seed)
    pts = []
    while len(pts) < 2600:
        alt, az = rng.uniform(ALT_SEA + .12, ALT_MAX), rng.uniform(AZ_L, AZ_R)
        # a band across the sky, like the Milky Way's, a third denser
        band = np.exp(-((alt - (1.5 + .2 * (az - AZ_L))) ** 2) / 3)
        if rng.random() > .55 + .45 * band:
            continue
        x, y = proj(np.array(alt), np.array(az))
        if not (8 < x < FW - 8):
            continue
        mag = 2 if rng.random() < .06 else 1 if rng.random() < .25 else 0
        noise = int(rng.random() < .2)
        pts += [[int(x), int(y), mag, noise]]
    trails = []
    for _ in range(3):
        a0, z0 = rng.uniform(1, ALT_MAX - 1), rng.uniform(AZ_L + 3, AZ_R - 8)
        p = proj(np.array([a0, a0 + rng.uniform(-1.2, 1.2)]), np.array([z0, z0 + rng.uniform(4, 7)]))
        trails += [int(v) for v in p.ravel()]
    return pts, trails


def write(original):
    lines = drawing(original)
    pts, trails = detections()
    data = {"frame": [FW, FH], "sea": int(SEA), "lines": lines, "pts": [v for p in pts for v in p], "trails": trails}
    json.dump(data, open(DATA, "w"), separators=(",", ":"))
    print(os.path.relpath(DATA, ROOT), len(lines), "lines,", len(pts), "detections,", sum(p[3] for p in pts),
          "noise,", f"{os.path.getsize(DATA) // 1024} KB")


if __name__ == "__main__":
    original = sys.argv[1]
    print(f"camera: F {F:.0f} px, pitch {np.degrees(PITCH):.2f} deg, sky 0..{ALT_TOP:.2f} deg, az {AZ_L:.1f}..{AZ_R:.1f}")
    print("true horizon at row", round(float(proj(np.array(0.), np.array(0.))[1]), 1))
    write(original)
    if len(sys.argv) > 2:
        photo(original, sys.argv[2])
