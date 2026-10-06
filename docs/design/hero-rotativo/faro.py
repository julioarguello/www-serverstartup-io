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

The CDN page opens on the same photograph (#567): dusk falls over it, the lantern lights up and the
radar's sweep is its beam. What the component needs from the photograph is measured on the finished
3024 px file, never placed by eye:

    python3 faro.py measure

writes src/assets/hero/cdn-faro.json: the building's outline (GrabCut, seeded by a rough polygon; the
rings and the sweep pass behind it), the lantern's glass (cut out of the night, where the light is
born) and its centre (the radar's origin), the boxes text keeps off, and the row below which nothing
is sky.

    python3 faro.py register <cdn-faro-restaurado-1760.webp>

adds the line drawing's place on the photograph ("plan": x, y, width in the 1320 px units): it was drawn
on the cut-out #529 used, so the similarity between the cut-out and this photograph is measured (SIFT on the
building, RANSAC) and the drawing carried through it.
"""
import os, sys, json
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
    # a new name for every cut, so no browser keeps an older one (the sheds outlived their removal in a
    # cache under the old name, 2026-10-05)
    for w, name in ((3024, "home-faro-limpio-3024.webp"), (2016, "home-faro-limpio-2016.webp"), (1320, "home-faro-limpio.webp"), (720, "home-faro-limpio-720.webp")):
        path = os.path.join(OUT, name)
        img.resize((w, round(img.height * w / img.width)), Image.LANCZOS).save(path, "WEBP", quality=84, method=6)
        print(name, os.path.getsize(path) // 1024, "KB")


# --- the CDN opening (#567): what the dusk and the radar need from the finished photograph, measured on it ---

FRAME = (1320, 707)  # the coordinates the component plays in: the 1320 px file
# GrabCut's seed only, never the outline: a rough polygon round the lantern, the tower and the house, read
# off a 20 px grid over the 3024 px file. The outline is GrabCut's, from the pixels
SEED = [(720, 486), (720, 372), (727, 366), (775, 350), (880, 314), (877, 300), (870, 280), (870, 257), (881, 247),
        (881, 222), (892, 220), (892, 195), (902, 175), (915, 162), (921, 139), (923, 139), (930, 162), (943, 175),
        (955, 193), (954, 220), (964, 222), (964, 247), (968, 257), (975, 257), (975, 280), (968, 300), (962, 324),
        (1049, 362), (1050, 372), (1050, 486)]
FOOT = 484.5        # the house's and the tower's foot on the grass
GLASS = (193, 237)  # the lantern's glass, between the cupola's rim and the gallery's floor
GLASS_MID = 208     # a row through the glass alone, above the gallery's railing: its width is the glass's
ROOF = 312          # the house's ridge: above it, only the tower and the lantern
DATA = os.path.normpath(os.path.join(HERE, "..", "..", "..", "src", "assets", "hero", "cdn-faro.json"))


def horizon(grey, k):
    """the highest row where the sky meets land or sea, left of the house: below it nothing is sky"""
    g = cv2.GaussianBlur(grey, (0, 0), 3)
    dy = np.diff(g, axis=0)
    rows = [(int(np.argmin(dy[int(380 * k):int(520 * k), X])) + int(380 * k)) / k
            for X in range(int(20 * k), int(700 * k), int(10 * k))]
    return min(rows)


def measure():
    rgb = np.array(Image.open(os.path.join(OUT, "home-faro-limpio-3024.webp")).convert("RGB"))
    img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    H, W = img.shape[:2]
    k = W / FRAME[0]
    seed = np.zeros((H, W), np.uint8)
    cv2.fillPoly(seed, [np.round(np.array(SEED) * k).astype(np.int32)], 255)
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    gc[cv2.dilate(seed, np.ones((41, 41), np.uint8)) > 0] = cv2.GC_PR_BGD
    gc[seed > 0] = cv2.GC_PR_FGD
    gc[cv2.erode(seed, np.ones((25, 25), np.uint8)) > 0] = cv2.GC_FGD
    x0, y0, x1, y1 = int(700 * k), int(120 * k), int(1070 * k), int(500 * k)
    sub = gc[y0:y1, x0:x1].copy()
    cv2.grabCut(img[y0:y1, x0:x1], sub, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
    m = np.zeros((H, W), np.uint8)
    m[y0:y1, x0:x1] = (((sub == 1) | (sub == 3)) * 255).astype(np.uint8)
    m[int(FOOT * k):] = 0
    _, lab, st, _ = cv2.connectedComponentsWithStats(m)
    m = ((lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))) * 255).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

    def outline(mask, eps):
        c = max(cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)
        return cv2.approxPolyDP(c.astype(np.float32), eps, True)[:, 0, :] / k

    def flat(p):
        return [round(float(v), 1) for v in np.asarray(p).ravel()]

    def box(mask):
        ys, xs = np.nonzero(mask)
        return [round(xs.min() / k, 1), round(ys.min() / k, 1), round((xs.max() + 1) / k, 1), round((ys.max() + 1) / k, 1)]

    # the glass: the outline's rows between the cupola and the gallery, as wide as the glass is at its middle
    cols = np.nonzero(m[int(GLASS_MID * k)])[0]
    glass = np.zeros_like(m)
    glass[int(GLASS[0] * k):int(GLASS[1] * k), cols.min():cols.max() + 1] = 255
    glass &= m
    gy, gx = np.nonzero(glass)
    above, below = m.copy(), m.copy()
    above[int(ROOF * k):] = 0
    below[:int(ROOF * k)] = 0
    data = {
        "frame": list(FRAME),
        "building": flat(outline(m, 1.6)),
        "lantern": {"c": [round(gx.mean() / k, 1), round(gy.mean() / k, 1)], "p": flat(outline(glass, 1.2))},
        # what text keeps off, as two boxes: the tower with its lantern, and the house
        "tower": box(above),
        "house": box(below),
        "sky": round(horizon(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(float), k), 1),
    }
    if os.path.exists(DATA) and "plan" in json.load(open(DATA)):
        data["plan"] = json.load(open(DATA))["plan"]  # `register`'s, kept
    json.dump(data, open(DATA, "w"), separators=(",", ":"))
    print(os.path.relpath(DATA), "building", len(data["building"]) // 2, "vertices; lantern at", data["lantern"]["c"],
          "; tower", data["tower"], "; house", data["house"], "; sky above row", data["sky"])


# the line drawing #529 drew on the cut-out (cdn-faro-plan, kept as cdn-faro-perfil): 1210 x 1392, shown in the
# cut-out's own 1760 x 2020 box with object-fit: cover, so the two shared one frame
PLAN = (1210, 1392)
CUTOUT = (1760, 2020)


def register(cutout):
    """the drawing on the whole photograph: the similarity from the cut-out it was drawn on (cdn-faro-restaurado-1760,
    retired; `git show 69a5694:public/assets/hero/cdn-faro-restaurado-1760.webp`) to the 3024 px file, measured by
    SIFT on the building and RANSAC, then the drawing's box carried through it"""
    cut = np.array(Image.open(cutout).convert("RGBA"))
    assert cut.shape[1::-1] == CUTOUT, cut.shape
    lim = np.array(Image.open(os.path.join(OUT, "home-faro-limpio-3024.webp")).convert("RGB"))
    k = lim.shape[1] / FRAME[0]
    cg, lg = cv2.cvtColor(cut[..., :3], cv2.COLOR_RGB2GRAY), cv2.cvtColor(lim, cv2.COLOR_RGB2GRAY)
    near = np.zeros_like(lg)
    near[int(120 * k):int(500 * k), int(700 * k):int(1070 * k)] = 255
    sift = cv2.SIFT_create(8000)
    k1, d1 = sift.detectAndCompute(cg, (cut[..., 3] > 200).astype(np.uint8) * 255)
    k2, d2 = sift.detectAndCompute(lg, near)
    good = [m for m, n in cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1, d2, k=2) if m.distance < 0.75 * n.distance]
    p1 = np.float32([k1[m.queryIdx].pt for m in good])
    p2 = np.float32([k2[m.trainIdx].pt for m in good])
    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=20000,
                                         confidence=0.999)
    ok = inl.ravel() == 1
    res = np.linalg.norm(p1[ok] @ M[:, :2].T + M[:, 2] - p2[ok], axis=1)
    scale, rot = float(np.hypot(M[0, 0], M[1, 0])), float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
    # the drawing's pixels in the cut-out's box (cover: scaled by width, centred vertically), then on the photograph
    a = CUTOUT[0] / PLAN[0]
    x0, y0 = M @ [0, -(PLAN[1] * a - CUTOUT[1]) / 2, 1]
    data = json.load(open(DATA))
    data["plan"] = [round(x0 / k, 2), round(y0 / k, 2), round(PLAN[0] * a * scale / k, 2)]
    json.dump(data, open(DATA, "w"), separators=(",", ":"))
    print(f"{len(good)} matches, {int(ok.sum())} inliers, residual median {np.median(res):.2f} px (3024 px file), "
          f"scale {scale:.4f}, rotation {rot:.4f} deg; the drawing at x, y, width {data['plan']} (1320 px units)")


if __name__ == "__main__":
    {"prepare": prepare, "finish": finish, "measure": measure, "register": register}[sys.argv[1]](*sys.argv[2:])
