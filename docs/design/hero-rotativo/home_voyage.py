"""The home's six photographs, where they differ from the verticals' own (#560).

The home tells one voyage, from the coast to the stars (founder, 2026-10-05). Two of its photographs
are not the verticals' files:

* the bridge, WITH its bridge: the integration page takes the bridge out and draws it back in; the
  home shows it whole, restored like the others (SeedVR2 3B on the Commons original, 2304 px wide);
* on the home only, the tanker and the tug sail the other way — inland, towards the next stop
  (founder: "el barco tendría que ir en sentido opuesto… el giro del barco, no de la imagen"). The
  photograph is NOT mirrored: the ships are. A FLUX.2 [dev] edit of the photograph without them
  (1344 x 896, seed 7), aligned to it by an affine fit, is the water they leave behind. The ships are
  cut out by GrabCut inside their two boxes (TANKER, TUG), seeded by that difference — where the
  photograph and the empty water agree it is background, where they differ most it is a ship — then
  flipped together about their middle and laid back on the water, and the stern is relettered after
  the flip (stern_label.py's letters, at the flipped boxes), so SERVER STARTUP reads the right way;
* the AI slide is cut from that same photograph, the ships in its right 60 % (TUG), which is also
  what makes the step from the bridge to the tug a real zoom (home-into.json carries the rectangle);
* the warehouse, further away (founder, 2026-10-05: "haces demasiado zoom, aléjalo un poco"): the
  e-commerce page's file crops the ceiling and the home's band crops its sides again. The home takes
  the WHOLE photograph, ceiling included, its operator's marks painted out as ocado.py does, and
  extends it to the left to the band's 16 : 8.6 — FLUX.2 [dev] continuing the grid and its robots
  (1344 x 720, seed 7), aligned to the photograph by an affine fit (FLUX moves what it keeps by a few
  pixels) and blended in over 40 px; the photograph's own pixels everywhere it reaches.

The lighthouse is faro.py's.

    python3 docs/design/hero-rotativo/home_voyage.py bridge <seedvr2 output of the whole bridge photo> <donor, no ships>
    python3 docs/design/hero-rotativo/home_voyage.py warehouse-prepare <original> <donor, left> <out.png>
    python3 docs/design/hero-rotativo/home_voyage.py warehouse <seedvr2 output of out.png>
"""
import os, sys, json
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from stern_label import OUT, LINES, ORIGINAL, letters, light, render, PHOTOS  # noqa: E402

FONT = "/System/Library/Fonts/Helvetica.ttc"
INTO_JSON = os.path.normpath(os.path.join(HERE, "..", "..", "..", "src", "assets", "hero", "home-into.json"))
ORIGINAL_W = 5333  # the Commons original's width (Ebaki, 5333 x 3555)
# in the original's pixels: each ship's box (they are flipped together, about the middle of both); and
# the AI slide, the ships in its right 60 %, at the band's 16 : 8.6
TANKER = (2032, 1956, 2842, 2588)
TUG_BOAT = (2838, 2315, 3305, 2711)
# below the quays' water line, the water is the flipped photograph's own — real ripples, and the wake
# that follows the ships — instead of FLUX's, which is flatter and lighter. Its top keeps clear of the
# quays on BOTH sides of the flip (the far quay's edge lands on the near side, mirrored); a polygon in
# the original's pixels, its foot kept above the near promenade on both sides of the flip
BAND = [(1875, 2511), (2395, 2419), (2669, 2425), (2940, 2419), (3460, 2511), (3460, 2990), (1875, 2990)]
TUG = (719, 1686, 3650, 3261)


def reletter(rgb, boxes, font_path=FONT):
    """stern_label.main's steps 1-3 on an image already in memory"""
    small = boxes[0][3] - boxes[0][1] < 12
    pad = 2 if small else 4
    masks, lights = [], []
    for box in boxes:
        m = letters(rgb, box, pad)
        masks.append(m)
        lights.append(light(rgb, m, box))
    hole = cv2.dilate(np.maximum.reduce(masks), np.ones((3, 3) if small else (5, 5), np.uint8))
    clean = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), hole, 3, cv2.INPAINT_TELEA)
    base = cv2.cvtColor(clean, cv2.COLOR_BGR2RGB).astype(np.float32)
    for text, orig, box, color_at in zip(LINES, ORIGINAL, boxes, lights):
        layer = render(text, orig, box, font_path, color_at, base.shape[:2], 0.35 if small else 0.5)
        a = layer[..., 3:4]
        base = base * (1 - a) + layer[..., :3] * a
    return np.clip(base + .5, 0, 255).astype(np.uint8)


def write(img, stem, widths):
    for w in widths:
        h = round(img.height * w / img.width)
        name = f"{stem}-{w}.webp" if w != widths[1] else f"{stem}.webp"
        path = os.path.join(OUT, name)
        img.resize((w, h), Image.LANCZOS).save(path, "WEBP", quality=84, method=6)
        print(name, (w, h), os.path.getsize(path) // 1024, "KB")


def bridge(restored, donor_path):
    src = Image.open(restored).convert("RGB")
    rgb = np.asarray(src).astype(np.float32)
    H, W = rgb.shape[:2]
    s = W / ORIGINAL_W
    # the water behind the ships: the donor, aligned to the photograph (FLUX moves what it keeps a little)
    donor = cv2.cvtColor(cv2.imread(donor_path), cv2.COLOR_BGR2RGB)
    small = cv2.resize(rgb.astype(np.uint8), donor.shape[1::-1], interpolation=cv2.INTER_AREA)
    M = np.eye(2, 3, dtype=np.float32)
    _, M = cv2.findTransformECC(cv2.cvtColor(small, cv2.COLOR_RGB2GRAY).astype(np.float32),
                                cv2.cvtColor(donor, cv2.COLOR_RGB2GRAY).astype(np.float32),
                                M, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    k = W / donor.shape[1]
    A = M.astype(np.float64).copy()
    A[:, 2] *= k
    big = cv2.resize(donor, (W, H), interpolation=cv2.INTER_CUBIC)
    water = cv2.warpAffine(big, A, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT).astype(np.float32)
    boxes_px = [[round(v * s) for v in box] for box in (TANKER, TUG_BOAT)]
    X0, Y0 = min(b[0] for b in boxes_px) - 60, min(b[1] for b in boxes_px) - 60
    X1, Y1 = max(b[2] for b in boxes_px) + 60, max(b[3] for b in boxes_px) + 60
    sub = np.ascontiguousarray(rgb[Y0:Y1, X0:X1].astype(np.uint8)[..., ::-1])
    diff = np.abs(cv2.GaussianBlur(rgb[Y0:Y1, X0:X1], (0, 0), 2) - cv2.GaussianBlur(water[Y0:Y1, X0:X1], (0, 0), 2)).max(2)
    cut = np.zeros(sub.shape[:2], np.uint8)
    for x0, y0, x1, y1 in boxes_px:
        g = np.full(sub.shape[:2], cv2.GC_BGD, np.uint8)
        r = g[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0]
        d = diff[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0]
        r[:] = cv2.GC_PR_BGD
        r[d > 22] = cv2.GC_PR_FGD
        r[d > 60] = cv2.GC_FGD
        r[d < 7] = cv2.GC_BGD
        cv2.grabCut(sub, g, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
        cut |= np.where((g == 1) | (g == 3), 1, 0).astype(np.uint8)
    # water the cut swept in: where photograph and empty water agree, it is not a ship
    cut &= cv2.dilate((diff > 10).astype(np.uint8), np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(cut)
    cut = np.isin(lab, [i for i in range(1, n) if st[i, 4] > 4000]).astype(np.uint8)
    cut = cv2.morphologyEx(cut, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = np.zeros((H, W), np.float32)
    m[Y0:Y1, X0:X1] = cut
    soft = cv2.GaussianBlur(cv2.dilate(m, np.ones((7, 7), np.uint8)), (0, 0), 2.5)[..., None]
    # the water toned to the photograph's own, locally: the slow part of their difference, read where
    # there is no ship (normalised convolution), so the fill takes the light of the water around it
    keep = (cv2.dilate(m, np.ones((31, 31), np.uint8)) == 0).astype(np.float32)
    region = np.zeros((H, W), np.float32)
    region[max(0, Y0 - 400):Y1 + 400, max(0, X0 - 400):X1 + 400] = 1
    keep *= region
    num = cv2.GaussianBlur((rgb - water) * keep[..., None], (0, 0), 50)
    den = cv2.GaussianBlur(keep, (0, 0), 50)[..., None]
    water += num / np.maximum(den, 1e-3)
    out = rgb * (1 - soft) + water * soft
    # the ships, flipped together about the middle of both, laid back on the water
    cx = (min(b[0] for b in boxes_px) + max(b[2] for b in boxes_px)) / 2
    F = np.float32([[-1, 0, 2 * cx], [0, 1, 0]])
    ships = cv2.warpAffine(rgb, F, (W, H), flags=cv2.INTER_LINEAR)
    fm = cv2.warpAffine(cv2.GaussianBlur(m, (0, 0), 1.2), F, (W, H), flags=cv2.INTER_LINEAR)[..., None]
    band = np.zeros((H, W), np.uint8)
    cv2.fillPoly(band, [np.int32([[x * s, y * s] for x, y in BAND])], 1)
    bm = cv2.GaussianBlur(band.astype(np.float32), (0, 0), 25)[..., None]
    out = out * (1 - bm) + ships * bm
    out = out * (1 - fm) + ships * fm
    # the stern, relettered at the flipped boxes (measured on the 2016 px restoration of the whole original)
    kb = W / 2016
    boxes = [(round(2 * cx - r * kb), round(t * kb), round(2 * cx - l * kb), round(b * kb)) for l, t, r, b in PHOTOS["bridge"]["boxes"]]
    out = Image.fromarray(reletter(np.clip(out + .5, 0, 255).astype(np.uint8), boxes))
    write(out, "home-puente-giro", [2016, 1320, 720])
    write(out.crop(tuple(round(v * s) for v in TUG)), "home-remolcador-giro", [2016, 1320, 720])
    # where the tug's photograph lies inside the bridge's, as fractions: the home's zoom reads it
    oh = H / s
    into = [round(TUG[0] / ORIGINAL_W, 5), round(TUG[1] / oh, 5), round(TUG[2] / ORIGINAL_W, 5), round(TUG[3] / oh, 5)]
    with open(INTO_JSON, "w") as f:
        json.dump({"into": into}, f)
        f.write("\n")
    print(os.path.relpath(INTO_JSON), into)


WAREHOUSE_LEFT = 298  # the photograph's left edge in the 1344 x 720 extension


def warehouse_prepare(original, donor_path, out):
    from ocado import MARKS
    o = cv2.imread(original)
    hole = np.zeros(o.shape[:2], np.uint8)
    for x0, y0, x1, y1 in MARKS:
        hole[y0:y1, x0:x1] = 255
    o = cv2.inpaint(o, hole, 6, cv2.INPAINT_TELEA).astype(np.float32)
    H, W = o.shape[:2]
    k = H / 720
    pad = np.full((720, 1344, 3), 128, np.uint8)
    pad[:, WAREHOUSE_LEFT:] = cv2.resize(o.astype(np.uint8), (1344 - WAREHOUSE_LEFT, 720), interpolation=cv2.INTER_AREA)
    donor = cv2.imread(donor_path)
    # where FLUX put what it kept: the affine that maps the photograph's place onto the donor's
    a = cv2.cvtColor(pad[:, WAREHOUSE_LEFT:], cv2.COLOR_BGR2GRAY).astype(np.float32)
    b = cv2.cvtColor(donor[:, WAREHOUSE_LEFT:], cv2.COLOR_BGR2GRAY).astype(np.float32)
    M = np.eye(2, 3, dtype=np.float32)
    _, M = cv2.findTransformECC(a, b, M, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    # in the full canvas's pixels: x_crop = x / k - LEFT, and the donor is k times larger
    TW = int(round(1344 * k))
    OX = int(round(WAREHOUSE_LEFT * k))
    A = M.astype(np.float64).copy()
    A[0, 2] = (A[0, 2] + WAREHOUSE_LEFT - A[0, 0] * WAREHOUSE_LEFT) * k
    A[1, 2] = (A[1, 2] - A[1, 0] * WAREHOUSE_LEFT) * k
    big = cv2.resize(donor, (TW, H), interpolation=cv2.INTER_CUBIC)
    d = cv2.warpAffine(big, A, (TW, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT).astype(np.float32)
    d *= o[:, :400].reshape(-1, 3).mean(0) / d[:, OX:OX + 400].reshape(-1, 3).mean(0)
    # the cut: inside a band at the photograph's left edge, the vertical path along which donor and
    # photograph differ least (a blend across it ghosted a ceiling column FLUX drew a few pixels off)
    band = int(60 * k)
    diff = np.abs(cv2.GaussianBlur(d[:, OX:OX + band], (0, 0), 2) - cv2.GaussianBlur(o[:, :band], (0, 0), 2)).sum(2)
    cost = diff.copy()
    for y in range(1, H):
        prev = cost[y - 1]
        left = np.r_[np.inf, prev[:-1]]
        right = np.r_[prev[1:], np.inf]
        cost[y] += np.minimum(np.minimum(left, prev), right)
    path = np.zeros(H, int)
    path[-1] = int(np.argmin(cost[-1]))
    for y in range(H - 2, -1, -1):
        j = path[y + 1]
        lo, hi = max(0, j - 1), min(band, j + 2)
        path[y] = lo + int(np.argmin(cost[y, lo:hi]))
    m = np.zeros((H, TW), np.float32)
    for y in range(H):
        m[y, OX + path[y]:] = 1
    a = cv2.GaussianBlur(m, (0, 0), 2.5)[..., None]
    orig = np.zeros_like(d)
    orig[:, OX:] = o[:, :TW - OX]
    c = d * (1 - a) + orig * a
    h = int(round(2304 * H / TW / 2)) * 2
    cv2.imwrite(out, cv2.resize(np.clip(c, 0, 255).astype(np.uint8), (2304, h), interpolation=cv2.INTER_AREA))
    print(out, (2304, h), "affine", M.round(3).tolist())


def warehouse(restored):
    from photo_restore import neutral_whites
    rgb = np.asarray(Image.open(restored).convert("RGB")).astype(np.float32) / 255
    rgb = neutral_whites(rgb, np.ones(rgb.shape[:2], np.float32))
    write(Image.fromarray((rgb * 255 + .5).clip(0, 255).astype(np.uint8)), "home-almacen", [2016, 1320, 720])


if __name__ == "__main__":
    {"bridge": bridge, "warehouse-prepare": warehouse_prepare, "warehouse": warehouse}[sys.argv[1]](*sys.argv[2:])
