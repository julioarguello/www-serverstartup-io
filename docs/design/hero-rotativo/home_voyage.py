"""The home's six photographs, where they differ from the verticals' own (#560).

The home tells one voyage, from the coast to the stars (founder, 2026-10-05). Three of its photographs
are not the verticals' files:

* the bridge, WITH its bridge: the integration page takes the bridge out and draws it back in; the
  home shows it whole, restored like the others (SeedVR2 3B on the Commons original, 2304 px wide);
* the ships as they sail in the photograph, out towards the Abra. Turning them was tried (#560, round
  4): flipped, they sailed into the quay; what the founder wanted — the tanker coming in, towards the
  viewer — needs its bow, and the photograph only has its stern. The stern is relettered as on the
  vertical pages (stern_label.py's letters at its own boxes);
* the warehouse, further away (founder, 2026-10-05: "haces demasiado zoom, aléjalo un poco"): the
  e-commerce page's file crops the ceiling and the home's band crops its sides again. The home takes
  the WHOLE photograph, ceiling included, its operator's marks painted out as ocado.py does, and
  extends it to the left to the band's 16 : 8.6 — FLUX.2 [dev] continuing the grid and its robots
  (1344 x 720, seed 7), aligned to the photograph by an affine fit (FLUX moves what it keeps by a few
  pixels) and blended in over 40 px; the photograph's own pixels everywhere it reaches.

The lighthouse is faro.py's.

    python3 docs/design/hero-rotativo/home_voyage.py bridge <seedvr2 output of the whole bridge photo>
    python3 docs/design/hero-rotativo/home_voyage.py warehouse-prepare <original> <donor, left> <out.png>
    python3 docs/design/hero-rotativo/home_voyage.py warehouse <seedvr2 output of out.png>
"""
import os, sys
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from stern_label import OUT, LINES, ORIGINAL, letters, light, render, PHOTOS  # noqa: E402

FONT = "/System/Library/Fonts/Helvetica.ttc"


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


def bridge(restored):
    src = Image.open(restored).convert("RGB")
    W = src.width
    # the stern, relettered at its own boxes (measured on the 2016 px restoration of the whole original)
    kb = W / 2016
    boxes = [tuple(round(v * kb) for v in box) for box in PHOTOS["bridge"]["boxes"]]
    out = Image.fromarray(reletter(np.ascontiguousarray(np.asarray(src)), boxes))
    write(out, "home-puente-salida", [2016, 1320, 720])


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
