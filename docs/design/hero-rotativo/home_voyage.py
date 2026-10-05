"""The home's six photographs, where they differ from the verticals' own (#560).

The home tells one voyage, from the coast to the stars (founder, 2026-10-05). Two of its photographs
are not the verticals' files:

* the bridge, WITH its bridge: the integration page takes the bridge out and draws it back in; the
  home shows it whole, restored like the others (SeedVR2 3B on the Commons original, 2304 px wide);
* on the home only, the tanker and the tug sail the other way — inland, towards the next stop — so
  the bridge is MIRRORED (founder: "el barco tendría que ir en sentido opuesto"), and the stern is
  relettered after the mirror, so SERVER STARTUP reads the right way round. The letters are
  stern_label.py's, at the mirrored boxes;
* the AI slide is cut from that same mirrored photograph, not from the AI page's file: mirrored, the
  AI page's crop puts the tug on the left, under the home's title, and a crop of the same frame is
  also what makes the step from the bridge to the tug a real zoom (TUG, in the original's pixels).

The lighthouse is faro.py's.

    python3 docs/design/hero-rotativo/home_voyage.py <seedvr2 output of the whole bridge photo>
"""
import os, sys
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from stern_label import OUT, LINES, ORIGINAL, letters, light, render, PHOTOS  # noqa: E402

FONT = "/System/Library/Fonts/Helvetica.ttc"
ORIGINAL_W = 5333  # the Commons original's width (Ebaki, 5333 x 3555)
# the AI slide in the MIRRORED original's pixels: the tanker and the tug in its right 60 %, at the band's 16 : 8.6
TUG = (787, 1665, 3717, 3240)


def mirrored(boxes, width, k=1.0):
    """a line's box after scaling by k and mirroring left to right"""
    return [(round(width - r * k), round(t * k), round(width - l * k), round(b * k)) for l, t, r, b in boxes]


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
    # the stern's boxes were measured on the 2016 px restoration of the whole original (BRIDGE_CROP starts at 0, 0)
    k = src.width / 2016
    rgb = np.ascontiguousarray(np.asarray(src)[:, ::-1])
    out = Image.fromarray(reletter(rgb, mirrored(PHOTOS["bridge"]["boxes"], src.width, k)))
    write(out, "home-puente", [2016, 1320, 720])
    s = src.width / ORIGINAL_W
    write(out.crop(tuple(round(v * s) for v in TUG)), "home-remolcador", [2016, 1320, 720])


if __name__ == "__main__":
    bridge(sys.argv[1])
