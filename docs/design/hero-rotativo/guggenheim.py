"""The greenfield hero (#547): the Guggenheim's plot, its elevation drawn over it, and the museum.

The photograph is "Museo Guggenheim Bilbao, Bilbao." (Sergio S.C, Wikimedia Commons, CC BY-SA 2.0),
6000 x 2932, seen from across the river. The founder's story (2026-10-03): the plot first, without the
museum, in black and white; then the museum drawn as an architect's elevation, its lines landing exactly
on the building; then the photograph, and the drawing goes.

Inputs, all on the photograph's own frame:

- the photograph;
- the plot without the museum: FLUX.2 [dev] (Workers AI) asked for the riverside with the building gone,
  blended back by Poisson cloning inside the building's silhouette only, so the river, the quay and the
  sky stay the photograph's own pixels;
- the building's silhouette (GrabCut, then the smooth sky regions subtracted);
- the inner drawing: FLUX.2 [dev] redrawing an edge sketch of the building as an elevation (seed 11),
  then warped onto the real roofline — the two roof profiles matched by dynamic time warping, the
  correspondences fed to a thin-plate spline — which took the roof from a median 6 px off (90 % within
  13 px) to 0 px (90 % within 2 px). Dense optical flow was tried first and bent the lines.

    python3 docs/design/hero-rotativo/guggenheim.py <photo.jpg> <plot.jpg> <silhouette.png> <drawing.png>

writes, under new names so no browser keeps an older cut:

- public/assets/hero/gf-solar-bn{-720,,-2016}.webp      the plot, in black and white
- public/assets/hero/gf-guggenheim{-720,,-2016}.webp    the museum
- src/assets/hero/gf-alzado.svg                          the elevation, in vectors
- public/assets/hero/gf-alzado-tinta{,-800}.webp         the inner drawing's ink, as the lighthouse's plan

The elevation is drawn as one: construction lines and perspective rays first (the horizon and the two
vanishing points), the axes with their bubbles, the ground line, the building's profile (its own outline,
so it is exact), the inner edges (the drawing's own ink, revealed stroke by stroke along its skeleton), and last the
dimensions — the height to the highest point ("más de 50 metros": WikiArquitectura; Bilbao Metrópoli)
and the chain between the axes. Every line carries `pathLength="1"` and its start time as `--d`, so the
CSS draws it without measuring anything; the words are placeholders the component fills from the CMS.
"""
import os, sys, json
import numpy as np, cv2
from PIL import Image
from scipy.ndimage import median_filter, gaussian_filter1d
from skimage.morphology import skeletonize

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
PUB = os.path.join(ROOT, "public", "assets", "hero")
SVG = os.path.join(ROOT, "src", "assets", "hero", "gf-alzado.svg")
W, H = 1600, 782                       # the drawing's frame, the photograph's 2.046 aspect
SIZES = [(2016, "-2016"), (1320, ""), (720, "-720")]
AXES = [40, 216, 655, 900, 1036, 1166, 1266, 1510]   # the volumes' walls, measured on the 1600 frame
LH = 560                               # the horizon, at the camera's eye on the far quay
PF1, PF2 = (-700.0, LH), (2400.0, LH)  # the two vanishing points, off the frame
# the drawing's timeline in ms after the plot (5 s in all, like the lighthouse and the machine's eye)
T = dict(persp=0, rays=120, cons=250, axes=400, ground=450, profile=650, detail=900, dims=1700, text=1900)


def unmark(img):
    """paint out the photographer's mark in the lower right corner: it lies on the river, so the strip of
    water just left of it is cloned over it, feathered (inpainting smeared it into a blot)"""
    h, w = img.shape[:2]; k = w / 1500
    x0, x1, y0, y1 = int(1275 * k), int(1498 * k), int(686 * k), int(730 * k)
    src = img[y0:y1, x0 - (x1 - x0):x0].astype(np.float32)
    a = np.zeros((y1 - y0, x1 - x0), np.float32); f = max(2, int(6 * k))
    a[f:-f, f:-f] = 1; a = cv2.GaussianBlur(a, (0, 0), f / 2)[..., None]
    out = img.copy().astype(np.float32)
    out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - a) + src * a
    return np.clip(out, 0, 255).astype(np.uint8)


def photos(photo, plot):
    real = unmark(cv2.imread(photo))
    empty = unmark(cv2.resize(cv2.imread(plot), (real.shape[1], real.shape[0]), interpolation=cv2.INTER_CUBIC))
    g = cv2.cvtColor(empty, cv2.COLOR_BGR2GRAY).astype(np.float32)
    g = np.clip((g - g.mean()) * 1.12 + g.mean(), 0, 255).astype(np.uint8)
    for img, name, mode in ((real, "gf-guggenheim", "RGB"), (g, "gf-solar-bn", "L")):
        im = Image.fromarray(img if mode == "L" else cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        for w, suf in SIZES:
            out = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
            path = os.path.join(PUB, f"{name}{suf}.webp")
            out.save(path, "WEBP", quality=80, method=6)
            print(os.path.basename(path), out.size, os.path.getsize(path) // 1024, "KB")


def profile(mask, base):
    """the building's outline above the ground: its roof per column, walls kept vertical"""
    cols = np.where(mask[:base - 8].any(0))[0]
    x0, x1 = int(cols.min()), int(cols.max())
    y = median_filter(np.array([np.argmax(mask[:base - 8, x]) for x in range(x0, x1 + 1)], float), 9)
    segs = np.split(np.arange(len(y)), np.where(np.abs(np.diff(y)) > 14)[0] + 1)
    pts = [(x0, base)]
    for s in segs:
        ys = gaussian_filter1d(y[s], 3) if len(s) > 8 else y[s]
        pts += list(zip(x0 + s, ys))
    pts.append((x1, base))
    return cv2.approxPolyDP(np.array(pts, np.float32).reshape(-1, 1, 2), 0.8, False)[:, 0, :], x0, x1


def chaikin(p, n=2):
    for _ in range(n):
        q = [p[0]]
        for a, b in zip(p[:-1], p[1:]):
            q += [0.75 * a + 0.25 * b, 0.25 * a + 0.75 * b]
        q.append(p[-1]); p = np.array(q)
    return p


def strokes(drawing, mask):
    """the inner drawing as polylines: the ink's skeleton, walked end to end, smoothed, short bits dropped"""
    ink = cv2.imread(drawing, 0) < 150
    ink &= cv2.dilate(mask.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
    sk = skeletonize(ink).astype(np.uint8)
    pts = set(zip(*np.nonzero(sk))); seen = set(); out = []
    nb = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    deg = lambda p: sum((p[0] + a, p[1] + b) in pts for a, b in nb)
    def walk(s):
        path = [s]; seen.add(s); cur = s
        while True:
            nxt = next(((cur[0] + a, cur[1] + b) for a, b in nb if (cur[0] + a, cur[1] + b) in pts and (cur[0] + a, cur[1] + b) not in seen), None)
            if nxt is None: return path
            seen.add(nxt); path.append(nxt); cur = nxt
    for p in [p for p in pts if deg(p) == 1] + list(pts):
        if p not in seen:
            path = walk(p)
            if len(path) >= 24:
                a = np.array([(x, y) for y, x in path], np.float32)
                a = cv2.approxPolyDP(a.reshape(-1, 1, 2), 1.2, False)[:, 0, :]
                out.append(chaikin(a.astype(float)) if len(a) > 2 else a)
    return out


def ink(drawing, mask):
    """the inner drawing as the lighthouse's plan is: the drawing's own ink, to alpha, in one colour (the CSS
    tints it), kept to the building; its line weights are the drawing's, not a trace's"""
    g = cv2.imread(drawing, 0).astype(np.float32) / 255
    a = np.clip((0.86 - g) / 0.40, 0, 1)
    a *= cv2.dilate(mask.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
    rgba = np.dstack([np.full(a.shape, 255, np.uint8)] * 3 + [(a * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, "RGBA")
    for w, suf in ((1600, ""), (800, "-800")):
        out = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
        path = os.path.join(PUB, f"gf-alzado-tinta{suf}.webp")
        out.save(path, "WEBP", quality=80, alpha_quality=80, method=6)
        print(os.path.basename(path), out.size, os.path.getsize(path) // 1024, "KB")


def d(p):
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in p)


def line(cls, path, t):
    return f'<path class="{cls}" pathLength="1" style="--d:{t:.0f}ms" d="{path}"/>'


def elevation(mask_png, drawing):
    mask = cv2.resize(cv2.imread(mask_png, 0), (W, H)) > 127
    cnt = max(cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)[:, 0, :]
    base = int(np.percentile(cnt[:, 1], 99))
    prof, x0, x1 = profile(mask, base)
    ti = int(np.argmin(prof[:, 1])); topx, topy = float(prof[ti, 0]), float(prof[ti, 1])
    corners = []
    for i in range(1, len(prof) - 1):
        a, b = prof[i] - prof[i - 1], prof[i + 1] - prof[i]
        la, lb = np.linalg.norm(a), np.linalg.norm(b)
        if la > 18 and lb > 18 and abs(a[0] * b[1] - a[1] * b[0]) / (la * lb) > 0.55:
            corners.append(prof[i])
    corners = sorted(corners, key=lambda c: c[1])[:10]
    levels = [int(topy), 214, 298, 358]
    parts = []
    parts.append(line("elev__aux", f"M0,{LH} H{W}", T["persp"]))
    k = 0
    for c in corners:
        for pf in (PF1, PF2):
            v = np.array(c) - np.array(pf)
            t = ((0 - pf[0]) if pf[0] < 0 else (W - pf[0])) / v[0]
            s0 = np.array(pf) + v * max(t, 0)
            parts.append(line("elev__ray", d([s0, c]), T["rays"] + k * 14)); k += 1
    for i, l in enumerate(levels):
        parts.append(line("elev__aux", f"M0,{l} H{W}", T["cons"] + i * 40))
    for i, x in enumerate(AXES):
        parts.append(line("elev__axis", f"M{x},70 V{base + 48}", T["axes"] + i * 25))
    bubbles = "".join(f'<g class="elev__bub" style="--d:{T["axes"] + 100 + i * 25}ms"><circle cx="{x}" cy="50" r="17"/><text x="{x}" y="56">{"ABCDEFGH"[i]}</text></g>' for i, x in enumerate(AXES))
    parts.append(line("elev__ground", f"M0,{base} H{W}", T["ground"]))
    parts.append(line("elev__profile", d(prof), T["profile"]))
    det = strokes(drawing, mask)
    mx = np.array([s[:, 0].mean() for s in det]); order = np.argsort(mx)       # left to right, as a hand lays it
    reveal = "".join(line("elev__reveal", d(det[i]), T["detail"] + j * 1000 / len(det)) for j, i in enumerate(order))
    ink(drawing, mask)
    # the ink is white on alpha: a mask over a rect filled with the theme's colour, revealed stroke by stroke
    box = f'maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"'
    parts.append(f'<mask id="elev-reveal" {box}>{reveal}</mask>'
                 f'<mask id="elev-ink" {box}><image class="elev__ink" data-src="/assets/hero/gf-alzado-tinta" width="{W}" height="{H}" mask="url(#elev-reveal)"/></mask>'
                 f'<rect class="elev__inkfill" width="{W}" height="{H}" mask="url(#elev-ink)"/>')
    dx, cy = x1 + 30, base + 44
    dims = [f"M{topx + 6:.1f},{topy:.1f} H{dx + 8}", f"M{x1 + 6},{base} H{dx + 8}", f"M{dx},{topy:.1f} V{base}",
            f"M{AXES[0]},{cy} H{AXES[-1]}"] + [f"M{x},{base + 6} V{cy + 8}" for x in AXES]
    for i, p in enumerate(dims):
        parts.append(line("elev__dim", p, T["dims"] + i * 20))
    ticks = [f"M{dx - 6},{topy + 6:.1f} l12,-12", f"M{dx - 6},{base + 6} l12,-12"] + [f"M{x - 6},{cy + 6} l12,-12" for x in AXES]
    parts.append(f'<path class="elev__tick" style="--d:{T["dims"] + 200}ms" d="{" ".join(ticks)}"/>')
    my = (topy + base) / 2
    marks = (f'<path class="elev__mark" d="M{x1 - 150},{base - 1} h70 M{x1 - 136},{base - 14} l9,13 l9,-13 z'
             f' M{topx + 40:.1f},{topy:.1f} h70 M{topx + 54:.1f},{topy - 13:.1f} l9,13 l9,-13 z"/>')
    text = (f'<g class="elev__text" style="--d:{T["text"]}ms">{marks}'
            f'<text x="{x1 - 150}" y="{base - 20}">{{{{level0}}}}</text>'
            f'<text x="{topx + 40:.1f}" y="{topy - 20:.1f}">{{{{levelTop}}}}</text>'
            f'<text class="elev__v" x="{dx - 10}" y="{my:.1f}" transform="rotate(-90 {dx - 10} {my:.1f})">{{{{height}}}}</text>'
            f'<text x="14" y="{LH - 10}">{{{{horizon}}}}</text>'
            f'<text x="18" y="{LH + 28}">{{{{vp1}}}}</text>'
            f'<text class="elev__end" x="{W - 18}" y="{LH + 28}">{{{{vp2}}}}</text></g>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'
           + "".join(parts) + bubbles + text + "</svg>\n")
    open(SVG, "w").write(svg)
    print(os.path.relpath(SVG, ROOT), len(svg) // 1024, "KB,", len(det), "edges,", len(corners), "corners")


if __name__ == "__main__":
    photo, plot, mask_png, drawing = sys.argv[1:5]
    photos(photo, plot)
    elevation(mask_png, drawing)
