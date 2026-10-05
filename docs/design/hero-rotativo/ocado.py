"""The e-commerce hero (#551): the stock lights up under an automated warehouse, and your order rises as the logo.

The photograph is "Ocado warehouse bots.jpg" (Techwords, Wikimedia Commons, CC BY-SA 4.0), 2853 x 1963,
a Canon 5D Mark II at 70 mm looking along the rails of a grid, robots on it. The founder's story
(2026-10-04/05): the warehouse as it is; a lid lights up on every cell, the stock under the rails; one bin
rises out of its cell as a perfect cube, turns until it is seen exactly as the logo draws it, and flies to
the band's seal.

The drawing is measured on the photograph, never placed by eye. The camera:

- the rails' vanishing point, (1416.9, 588.4), from the floor's converging rails (Hough segments, least
  squares); the floor's slats are level, so the camera has no roll;
- the focal length, 5,700 px: the sensor's 70 mm on the 5D Mark II's 36 mm width, scaled to this file
  (cropped to 1.45 and resized from the sensor's 3,744 px height); the columns lean too little to measure
  it better, and at a telephoto's focal length an error here barely moves the drawing;
- the height, 1.40 cell widths, fitted to the rail spacing: the model gives 979 and 597 px where the
  photograph measures 958 and 611 px, at rows 1963 and 1427.

    python3 docs/design/hero-rotativo/ocado.py <seedvr2-2x.png>

writes, under new names so no browser keeps an older cut:

- public/assets/hero/ec-almacen-restaurado{-720,,-2016}.webp   the warehouse, restored, brand painted out
- src/assets/hero/ec-almacen.svg     the lids, one per cell, each with its start as `--d`
- src/assets/hero/ec-pedido.json     the order cube's frames, projected, for the component to play: its
                                     visible faces and the logo's 2 x 2 split on them
"""
import os, sys, json
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from photo_restore import neutral_whites  # noqa: E402  the one white balance every hero photograph gets
ROOT = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
PUB = os.path.join(ROOT, "public", "assets", "hero")
SVG = os.path.join(ROOT, "src", "assets", "hero", "ec-almacen.svg")
CUBE = os.path.join(ROOT, "src", "assets", "hero", "ec-pedido.json")
SIZES = [(2016, "-2016"), (1320, ""), (720, "-720")]

W0, H0 = 2853, 1963                      # the photograph's frame; everything below is in its pixels
CROP_Y = 420                             # the ceiling above goes: the band is wider than the photograph
FW, FH = W0, H0 - CROP_Y                 # the frame the hero shows, 1.85 wide

# the camera (see the docstring); the floor is the plane Y = 0, X across in cell widths, Z ahead, Y up
F = 5700.0
CX, CY = W0 / 2, H0 / 2
VP = (1416.9, 588.4)
HCAM = 1.40
PITCH = np.arctan((CY - VP[1]) / F)
YAW = np.arctan((VP[0] - CX) / F)
_K = np.array([[F, 0, CX], [0, F, CY], [0, 0, 1]])
_cp, _sp, _cy, _sy = np.cos(PITCH), np.sin(PITCH), np.cos(YAW), np.sin(YAW)
_R = np.array([[1, 0, 0], [0, _cp, -_sp], [0, _sp, _cp]]) @ np.array([[_cy, 0, _sy], [0, 1, 0], [-_sy, 0, _cy]])
CAMERA = np.array([0.0, HCAM, 0.0])


def proj(P):
    """world points (n, 3) -> pixels of the photograph (n, 2)"""
    P = np.asarray(P, float)
    Q = np.c_[P[:, 0] - CAMERA[0], CAMERA[1] - P[:, 1], P[:, 2] - CAMERA[2]]
    X = (_K @ (_R @ Q.T)).T
    return X[:, :2] / X[:, 2:3]


# the robots, as boxes on the photograph: no lid is drawn where one stands, so they stay in front
ROBOTS = [(397, 703, 999, 1304), (1427, 734, 2007, 1457), (2007, 734, 2490, 1361), (167, 652, 473, 1035),
          (71, 652, 194, 907), (1005, 611, 1274, 880), (2666, 615, 2796, 770), (1427, 601, 1997, 744),
          (2232, 621, 2456, 734)]
# the Ocado mark on the three robots where it reads, painted out of the panel it sits on
MARKS = [(1635, 1272, 1818, 1322), (2148, 1186, 2310, 1234), (272, 936, 372, 972)]
INSET = 0.12                             # a lid inside its cell, so the rails between them stay visible
ORDER = (1, 9)                           # the order's cell: in front of the second robot, beside the nearest, clear of the copy
LIFT = 0.45                              # how far above the floor the cube stops, in cell widths
ISO = np.degrees(np.arctan(1 / np.sqrt(2)))   # 35.26 deg: the elevation an isometric drawing is seen from
FPS, RISE, TURN = 50, 0.8, 1.0           # the cube's frames: rising out of its cell, then turning to the logo


def lid(X, Z, y=0.0):
    a, b = INSET, 1 - INSET
    return proj([[X + a, y, Z + a], [X + b, y, Z + a], [X + b, y, Z + b], [X + a, y, Z + b]])


def under_robot(P, pad=6):
    x0, y0 = P.min(0)
    x1, y1 = P.max(0)
    return any(not (x1 < r[0] - pad or x0 > r[2] + pad or y1 < r[1] - pad or y0 > r[3] + pad) for r in ROBOTS)


def photo(restored):
    rgb = cv2.cvtColor(cv2.imread(restored), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    rgb = neutral_whites(rgb, np.ones(rgb.shape[:2], np.float32))
    img = cv2.cvtColor((rgb * 255 + .5).clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    k = img.shape[1] / W0
    hole = np.zeros(img.shape[:2], np.uint8)
    for x0, y0, x1, y1 in MARKS:
        hole[int(y0 * k):int(y1 * k), int(x0 * k):int(x1 * k)] = 255
    img = cv2.inpaint(img, hole, int(6 * k), cv2.INPAINT_TELEA)
    img = img[int(CROP_Y * k):, :]
    im = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    for w, suf in SIZES:
        out = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
        path = os.path.join(PUB, f"ec-almacen-restaurado{suf}.webp")
        out.save(path, "WEBP", quality=80, method=6)
        print(os.path.relpath(path, ROOT), out.size, f"{os.path.getsize(path) // 1024} KB")


def d_of(P):
    return "M" + " ".join(f"{x:.1f},{y - CROP_Y:.1f}" for x, y in P) + "Z"


def lids():
    """one lid per visible cell, near ones heavier; each starts by its distance from the order's cell"""
    ox, oz = ORDER[0] + .5, ORDER[1] + .5
    out = []
    for X in range(-10, 10):
        for Z in range(5, 160):
            if (X, Z) == ORDER:
                continue
            P = lid(X, Z)
            if P[:, 1].min() < 600 or P[:, 0].max() < 0 or P[:, 0].min() > W0 or under_robot(P):
                continue
            w, h = P[:, 0].max() - P[:, 0].min(), P[:, 1].max() - P[:, 1].min()
            if w < 10 or h < 4:            # towards the horizon a lid flattens into a line, and lines merge
                continue
            dist = np.hypot(X + .5 - ox, Z + .5 - oz)
            cls = "store__lid" + (" store__lid--near" if w > 300 else " store__lid--far" if w < 60 else "")
            out.append((dist, f'<path class="{cls}" pathLength="1" style="--d:{int(min(1600, dist * 90))}ms" d="{d_of(P)}"/>'))
    out.sort()
    cell = f'<path class="store__cell" pathLength="1" d="{d_of(lid(*ORDER))}"/>'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {FW} {FH}" preserveAspectRatio="xMidYMid slice">'
           f'<g class="store__lids">{"".join(p for _, p in out)}</g>{cell}</svg>\n')
    open(SVG, "w").write(svg)
    print(os.path.relpath(SVG, ROOT), f"{len(svg) // 1024} KB, {len(out)} lids")


# the cube: 8 corners (dx, dy, dz in -1/+1, local), its six faces, which one is the top
CORNERS = [(dx, dy, dz) for dx in (-1, 1) for dy in (-1, 1) for dz in (-1, 1)]
FACES = [(0, 1, 3, 2), (4, 5, 7, 6), (0, 1, 5, 4), (2, 3, 7, 6), (0, 2, 6, 4), (1, 3, 7, 5)]
TOP = (2, 3, 7, 6)


def ease(t):
    return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2


def pose(lift, turn):
    """the cube's corners in the world: risen by `lift` (0 = all below the floor), turned by `turn` (0..1)"""
    s = 1 - 2 * INSET
    c = np.array([ORDER[0] + .5, -s / 2 + lift * (s + LIFT), ORDER[1] + .5])
    elev = np.degrees(np.arctan2(CAMERA[1] - c[1], c[2] - CAMERA[2]))
    yaw, tilt = np.radians(45 * turn), -np.radians((ISO - elev) * turn)
    cy, sy, ct, st = np.cos(yaw), np.sin(yaw), np.cos(tilt), np.sin(tilt)
    R = np.array([[1, 0, 0], [0, ct, -st], [0, st, ct]]) @ np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    return np.array([c + R @ (np.array(v) * s / 2) for v in CORNERS]), c


def clip_floor(poly):
    """Sutherland-Hodgman against the floor: the part of a face still in its cell does not show"""
    out = []
    for i in range(len(poly)):
        a, b = poly[i - 1], poly[i]
        ina, inb = a[1] >= 0, b[1] >= 0
        if inb:
            if not ina:
                out.append(a + (b - a) * (a[1] / (a[1] - b[1])))
            out.append(b)
        elif ina:
            out.append(a + (b - a) * (a[1] / (a[1] - b[1])))
    return out


def clip_segment(a, b):
    """a segment against the floor: the part still in the cell does not show"""
    if a[1] < 0 and b[1] < 0:
        return None
    if a[1] < 0:
        a = a + (b - a) * (-a[1] / (b[1] - a[1]))
    elif b[1] < 0:
        b = b + (a - b) * (-b[1] / (a[1] - b[1]))
    return a, b


def frame(lift, turn):
    """the visible faces, and the logo's 2 x 2 split on each: the lines through the midpoints of its sides"""
    V, c = pose(lift, turn)
    faces, grid = [], []
    for f in FACES:
        fc = V[list(f)].mean(0)
        if np.dot(CAMERA - fc, fc - c) <= 0:
            continue
        poly = clip_floor([V[i] for i in f])
        if len(poly) < 3:
            continue
        P = proj(poly)
        faces.append({"k": "top" if f == TOP else "side", "p": [round(float(v), 1) for v in (P - [0, CROP_Y]).ravel()]})
        q = [V[i] for i in f]
        for a, b in (((q[0] + q[1]) / 2, (q[2] + q[3]) / 2), ((q[1] + q[2]) / 2, (q[3] + q[0]) / 2)):
            seg = clip_segment(a, b)
            if seg:
                grid += [round(float(v), 1) for v in (proj(list(seg)) - [0, CROP_Y]).ravel()]
    return {"f": faces, "g": grid}


def hexagon():
    """the turned cube as the seal draws it: T, UR, LR, B, LL, UL, and the centre where the Y meets"""
    V, _ = pose(1, 1)
    P = proj(V) - [0, CROP_Y]
    d = np.linalg.norm(V - CAMERA, axis=1)
    top = [i for i, v in enumerate(CORNERS) if v[1] == 1]
    bot = [i for i, v in enumerate(CORNERS) if v[1] == -1]
    C = min(top, key=lambda i: d[i])
    T = max(top, key=lambda i: d[i])
    UL, UR = sorted([i for i in top if i not in (C, T)], key=lambda i: P[i][0])
    B = min(bot, key=lambda i: d[i])
    LL, LR = sorted([i for i in bot if i != B and i != max(bot, key=lambda j: d[j])], key=lambda i: P[i][0])
    return [round(float(v), 1) for i in (T, UR, LR, B, LL, UL, C) for v in P[i]]


def cube():
    frames = [frame(ease(i / (FPS * RISE)), 0) for i in range(int(FPS * RISE) + 1)]
    frames += [frame(1, ease(i / (FPS * TURN))) for i in range(1, int(FPS * TURN) + 1)]
    json.dump({"frame": [FW, FH], "fps": FPS, "frames": frames, "hexagon": hexagon()}, open(CUBE, "w"), separators=(",", ":"))
    print(os.path.relpath(CUBE, ROOT), f"{os.path.getsize(CUBE) // 1024} KB, {len(frames)} frames")


if __name__ == "__main__":
    assert not under_robot(lid(*ORDER)), "the order's cell sits under a robot"
    photo(sys.argv[1])
    lids()
    cube()
