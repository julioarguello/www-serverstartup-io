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
# the domes, drawn as an elevation measured on the photograph: each in its box (x0, y0, x1, y1), cut at the
# foot of its plinth (crop row); its edges, picked by hand among the photograph's own (Canny components,
# sigma 1.6, 18/45: one edge of each groove, never both), each fitted with a smooth curve along its main axis
# or a straight line; the door, measured; and where the silhouette needs help: the walkway's rail beside the
# third dome cut off, the shell's shaded side (bluish, it reads as sky) filled by its hull above the equator,
# the first dome taken whole as its hull (the scrub notches its foot)
DOMES = [(680, 1580, 1200, 2060), (2350, 1670, 2710, 2025), (4510, 1820, 5000, 2255)]
FOOT = [468, 330, 414]
EQUATOR = [300, 212, 250]
EDGES = [[8, 1, 15, 12, 19, 28, 27], [8, 2, 17, 23, 21], [6, 11, 4]]
STRAIGHT = {(0, 27), (1, 21)}
DOOR = {2: (247, 242, 344, 414)}
RAIL = {2: 452}
WHOLE_HULL = {0}


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
    img0 = cv2.imread(original)
    hsv0 = cv2.cvtColor(img0, cv2.COLOR_BGR2HSV).astype(int)
    cv2.fillPoly(shells, [np.round(silhouette(img0, hsv0, n) * k).astype(np.int32) for n in range(len(DOMES))], 1)
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


def silhouette(img, hsv, n):
    """what is neither the blue of sky and sea, nor scrub, nor shadow, refined by GrabCut, cut at the plinth's
    foot, smoothed: the dome's outline"""
    x0, y0, x1, y1 = DOMES[n]
    sub = img[y0:y1, x0:x1]
    H, S, V = (hsv[y0:y1, x0:x1, i] for i in range(3))
    bg = ((H >= 95) & (H <= 118) & (S > 135)) | ((H < 45) & (S > 45)) | (V < 75)
    m = (~bg).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    m = largest(m)
    gc = np.full(m.shape, cv2.GC_PR_BGD, np.uint8)
    gc[cv2.dilate(m, np.ones((9, 9), np.uint8)) > 0] = cv2.GC_PR_FGD
    gc[cv2.erode(m, np.ones((21, 21), np.uint8)) > 0] = cv2.GC_FGD
    gc[cv2.dilate(m, np.ones((31, 31), np.uint8)) == 0] = cv2.GC_BGD
    cv2.grabCut(sub, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
    m = (((gc == 1) | (gc == 3)) * 255).astype(np.uint8)
    m[FOOT[n]:] = 0
    m = largest(m)
    if n in RAIL:
        m[:, RAIL[n]:] = 0
    top = m[:EQUATOR[n]].copy()
    ys, xs = np.nonzero(top)
    cv2.fillPoly(top, [cv2.convexHull(np.stack([xs, ys], 1).astype(np.int32))], 255)
    m[:EQUATOR[n]] = top
    if n in WHOLE_HULL:
        ys, xs = np.nonzero(m)
        cv2.fillPoly(m, [cv2.convexHull(np.stack([xs, ys], 1).astype(np.int32))], 255)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    m = (cv2.GaussianBlur(m, (0, 0), 3) > 127).astype(np.uint8) * 255
    c = max(cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)[:, 0, :].astype(float)
    k = 6
    w = np.exp(-np.arange(-3 * k, 3 * k + 1) ** 2 / (2 * k * k))
    w /= w.sum()
    c = np.stack([np.convolve(np.r_[c[-3 * k:, i], c[:, i], c[:3 * k, i]], w, "valid") for i in range(2)], 1)
    c = cv2.approxPolyDP(c.astype(np.float32).reshape(-1, 1, 2), 0.8, True)[:, 0, :]
    return np.vstack([c, c[:1]]) + [x0, y0]


def largest(m):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    return ((lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))) * 255).astype(np.uint8)


def edges(img, n):
    """the dome's inner lines: the picked edges, each a smooth curve fitted to its own pixels along its main
    axis (cubic; a straight line for the boxes), and the door"""
    x0, y0, x1, y1 = DOMES[n]
    g = cv2.GaussianBlur(cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY), (0, 0), 1.6)
    _, lab, _, _ = cv2.connectedComponentsWithStats(cv2.Canny(g, 18, 45), connectivity=8)
    out = []
    for i in EDGES[n]:
        ys, xs = np.nonzero(lab == i)
        P = np.stack([xs, ys], 1).astype(float)
        mu = P.mean(0)
        R = np.linalg.svd(P - mu, full_matrices=False)[2]
        Q = (P - mu) @ R.T
        cf = np.polyfit(Q[:, 0], Q[:, 1], 1 if (n, i) in STRAIGHT else 3)
        t = np.linspace(Q[:, 0].min(), Q[:, 0].max(), 40)
        p = np.stack([t, np.polyval(cf, t)], 1) @ R + mu
        p = p[p[:, 1] < FOOT[n]]
        if len(p) > 1:
            out.append(p + [x0, y0])
    if n in DOOR:
        l, t, r, b = DOOR[n]
        out.append(np.array([[l, b], [l, t], [r, t], [r, b]], float) + [x0, y0])
    return out


def stars(seed=556):
    """the sky the night reveals, in the photograph's own sky: many faint, few bright, a third denser along a
    band like the Milky Way's, from the sea horizon to the frame's top"""
    rng = np.random.default_rng(seed)
    out = []
    while len(out) < 700:
        alt, az = rng.uniform(ALT_SEA + .12, ALT_TOP), rng.uniform(AZ_L, AZ_R)
        band = np.exp(-((alt - (1.5 + .2 * (az - AZ_L))) ** 2) / 3)
        if rng.random() > .55 + .45 * band:
            continue
        x, y = proj(np.array(alt), np.array(az))
        if not (8 < x < FW - 8):
            continue
        out.append([int(x), int(y), 2 if rng.random() < .05 else 1 if rng.random() < .22 else 0])
    return out


def write(original):
    img = cv2.imread(original)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(int)
    ds = []
    for n in range(len(DOMES)):
        sil = silhouette(img, hsv, n)
        (x0, y0), (x1, y1) = sil.min(0), sil.max(0)
        ds.append({"c": [int((x0 + x1) / 2), int(y0), int(y1)], "p": flat(sil), "l": [flat(p) for p in edges(img, n)]})
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
