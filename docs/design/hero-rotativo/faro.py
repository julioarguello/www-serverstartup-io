"""The Cabo Peñas lighthouse as a whole photograph (#560).

The CDN opening was the first one made, and it cut the lighthouse out of its landscape; among five
whole photographs on the home it read as a needle in a haystack (founder, 2026-10-05). This puts it
back in its photograph, framed like the other five: the copy over sky and heath, the lighthouse at
70 % of the width, the boardwalk leading to it.

From the Commons original (Einaz80, "Cape Penas Lighthouse.jpg", CC BY-SA 4.0, 4032 x 3024):

1. masts: the lattice mast, the antennas, their guy wires and the weather tower behind the lantern
   are painted out. A FLUX.2 [dev] edit of the photograph without them (Workers AI, 1344 x 1008, seed
   7) is the donor, used ONLY inside boxes drawn around each mast — where it differs from the original,
   and the whole box above the horizon, so the wires go too — toned to the original around it. The
   lighthouse and its house are never touched. The tower's stub above the right roof is filled with
   the sky beside it.
2. sheds: the low sheds right of the house, their wire fence and the instrument box go too (founder,
   2026-10-05: "la cuadra esa que está a la derecha, más fea que la leche"). A FLUX.2 [dev] edit of
   step 1's result without them (1344 x 1008, seed 12) is the donor inside one box from the house's
   right wall to the frame's edge, between the sky and the near grass, toned to the original and
   feathered into it.
3. extension: the frame is widened to the band's 16 : 8.6 by adding 2003 px on the left. A FLUX.2 edit
   of the photograph padded with grey on the left (1344 x 720, seed 9) continues the heath, the gorse
   and the coast; the original's pixels are kept from its left edge on, blended over 60 px on the
   ground and 290 px on the horizon, where the donor's headland has to die out.
4. the composite, 2304 px wide, goes through SeedVR2 3B like the others (photo_restore.py's settings),
   and `finish` writes the sizes the home serves.

    python3 faro.py prepare <original> <donor, masts> <donor, sheds> <donor, left> <out.png>
    python3 faro.py finish <seedvr2 output>
"""
import os, sys
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "public", "assets", "hero"))

# in the coordinates of a 900 px wide view of the original (x 4.48 for its pixels): each mast's box and
# the row above which the donor's sky replaces the box whole
MASTS = [((140, 25, 249, 485), 432), ((92, 380, 135, 448), 400), ((478, 160, 542, 330), 330),
         ((592, 235, 768, 428), 412), ((688, 420, 716, 478), 0), ((882, 375, 900, 470), 400)]
LIGHTHOUSE = (383, 140, 478, 462)
HOUSE = (250, 295, 555, 462)
SHEDS = (556, 392, 900, 494)  # right of the house's wall, sky to near grass
LEFT = 477  # the original's left edge inside the 1344 x 720 extension


def masts(o, donor):
    H, W = o.shape[:2]
    k = W / 900
    d = cv2.resize(donor, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    diff = np.abs(cv2.GaussianBlur(o, (0, 0), 3) - cv2.GaussianBlur(d, (0, 0), 3)).max(2)
    m = np.zeros((H, W), np.float32)
    dd = d.copy()
    for (x0, y0, x1, y1), sky in MASTS:
        X0, Y0, X1, Y1 = [int(v * k) for v in (x0, y0, x1, y1)]
        S = int(sky * k)
        sub = cv2.dilate((diff[Y0:Y1, X0:X1] > 18).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(bool)
        if S > Y0:
            sub[:max(0, S - Y0), :] = True
        bg = ~cv2.dilate((diff[Y0:Y1, X0:X1] > 10).astype(np.uint8), np.ones((41, 41), np.uint8)).astype(bool)
        if bg.sum() > 500:
            dd[Y0:Y1, X0:X1] += (o[Y0:Y1, X0:X1][bg] - d[Y0:Y1, X0:X1][bg]).mean(0)
        m[Y0:Y1, X0:X1] = np.maximum(m[Y0:Y1, X0:X1], sub.astype(np.float32))
    for box in (LIGHTHOUSE, HOUSE):
        X0, Y0, X1, Y1 = [int(v * k) for v in box]
        m[Y0:Y1, X0:X1] = 0
    a = cv2.GaussianBlur(m, (0, 0), 8)[..., None]
    c = o * (1 - a) + dd * a
    # the weather tower's stub over the right roof: the sky to its right, above the roof's slope
    rng = np.random.default_rng(5)
    src = cv2.GaussianBlur(c, (0, 0), 4)
    X0, X1 = int(480 * k), int(516 * k)
    for X in range(X0, X1):
        roof = 309 + (X / k - 471) * 0.47
        for Y in range(int(284 * k), int((roof - 1.0) * k)):
            c[Y, X] = src[Y, X1 + 12] + rng.normal(0, 1.6, 3)
    return np.clip(c, 0, 255)


def sheds(o, donor):
    H, W = o.shape[:2]
    k = W / 900
    d = cv2.resize(donor, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    X0, Y0, X1, Y1 = [int(v * k) for v in SHEDS]
    m = np.zeros((H, W), np.float32)
    m[Y0:Y1, X0:X1] = 1
    # the donor's tone, measured on the grass just under the box, where both show the same field
    ring = (slice(Y1 + 10, min(H, Y1 + 120)), slice(X0, X1))
    d += o[ring].reshape(-1, 3).mean(0) - d[ring].reshape(-1, 3).mean(0)
    a = cv2.GaussianBlur(m, (0, 0), 14)[..., None]
    a[:, :X0 + 8] = np.minimum(a[:, :X0 + 8], m[:, :X0 + 8, None])  # hard at the house's wall
    return np.clip(o * (1 - a) + d * a, 0, 255)


def extend(o, donor):
    H, W = o.shape[:2]
    k = H / 720
    OX, TW = int(round(LEFT * k)), int(round(1344 * k))
    d = cv2.resize(donor, (TW, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    d *= o[:, 40:600].reshape(-1, 3).mean(0) / d[:, OX + 40:OX + 600].reshape(-1, 3).mean(0)
    right = min(W, TW - OX)
    x = np.arange(right)[None, :].astype(np.float32)
    y = (np.arange(H) / H)[:, None]
    wide = np.clip((0.715 - y) / 0.03, 0, 1)
    a = np.clip((x - wide * int(40 * k)) / (int(60 * k) + wide * int(230 * k)), 0, 1)
    a = a * a * (3 - 2 * a)
    c = d.copy()
    c[:, OX:OX + right] = d[:, OX:OX + right] * (1 - a[..., None]) + o[:, :right] * a[..., None]
    return np.clip(c, 0, 255).astype(np.uint8)


def prepare(original, donor_masts, donor_sheds, donor_left, out):
    o = cv2.imread(original).astype(np.float32)
    clean = sheds(masts(o, cv2.imread(donor_masts)), cv2.imread(donor_sheds))
    wide = extend(clean, cv2.imread(donor_left))
    h = int(round(2304 * wide.shape[0] / wide.shape[1] / 2)) * 2
    cv2.imwrite(out, cv2.resize(wide, (2304, h), interpolation=cv2.INTER_AREA))
    print(out, (2304, h))


def finish(restored):
    img = Image.open(restored).convert("RGB")
    for w, name in ((2016, "home-faro-2016.webp"), (1320, "home-faro.webp"), (720, "home-faro-720.webp")):
        path = os.path.join(OUT, name)
        img.resize((w, round(img.height * w / img.width)), Image.LANCZOS).save(path, "WEBP", quality=84, method=6)
        print(name, os.path.getsize(path) // 1024, "KB")


if __name__ == "__main__":
    {"prepare": prepare, "finish": finish}[sys.argv[1]](*sys.argv[2:])
