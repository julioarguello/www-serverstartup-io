"""The tanker's stern carries our lettering in both hero photographs (#537, founder 2026-10-02).

The tanker that passes under the Vizcaya Bridge (the integration hero) and that the tug escorts
(the AI hero) is renamed on its stern, as a homage of the founder's to his father:

    SERVER STARTUP        (was VARKAN MARMARA)
    AVILÉS                (was ISTANBUL)
    YULO 11062024         (was its IMO number)

For each photograph, from the largest restored WebP photo_restore.py wrote:

1. the original letters are found inside each line's box (pixels clearly lighter than the hull) and
   painted out by inpainting from the hull around them;
2. each new line is rendered 8x larger in a bold sans, then scaled down. Its cap height is the
   original line's, its centre is the original line's centre, and its characters are as wide as the
   original's: the stern's lettering is condensed;
3. the new letters take the original letters' light, column by column (on the AI photo the M of
   MARMARA caught the sun, and the new letters there catch it too), and the original's softness;
4. every size the hero serves is written under a NEW name, so no browser keeps the old lettering.
   The bridge's alpha (its cut-out) is kept.

    python3 docs/design/hero-rotativo/stern_label.py tug
    python3 docs/design/hero-rotativo/stern_label.py bridge

The font is Helvetica Bold (macOS, /System/Library/Fonts/Helvetica.ttc). On another system, pass a
bold sans .ttf as a second argument.
"""
import os, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "public", "assets", "hero"))
LINES = ["SERVER STARTUP", "AVILÉS", "YULO 11062024"]
ORIGINAL = ["VARKAN MARMARA", "ISTANBUL", "IMO 9452145"]
# per photograph: the largest restored file, each line's box (l, t, r, b) in its pixels, the sizes served
PHOTOS = {
    "tug": {
        "src": "ia-remolcador-restaurado-2016.webp",
        # measured on the 3100 x 2000 restoration and scaled to 2016 (x 0.6503)
        "boxes": [(980, 671, 1221, 700), (1060, 709, 1143, 727), (1070, 736, 1137, 748)],
        "sizes": [(2016, 1301, "ia-remolcador-aviles-2016.webp"), (1320, 852, "ia-remolcador-aviles.webp"), (720, 465, "ia-remolcador-aviles-720.webp")],
    },
    "bridge": {
        "src": "int-puente-restaurada-2016.webp",
        "boxes": [(984, 933, 1055, 940), (1007, 944, 1032, 948), (1010, 951, 1031, 955)],
        "sizes": [(2016, 1116, "int-puente-aviles-2016.webp"), (1320, 730, "int-puente-aviles.webp"), (960, 531, "int-puente-aviles-960.webp")],
    },
}
SS = 8  # supersampling of the rendered text


def letters(rgb, box, pad):
    """the original letters inside a line's box: clearly lighter than the hull around them"""
    l, t, r, b = box
    sub = cv2.cvtColor(rgb[t - pad:b + pad, l - pad:r + pad], cv2.COLOR_RGB2LAB)[..., 0].astype(np.float32)
    hull = np.percentile(sub, 40)
    m = np.zeros(rgb.shape[:2], np.uint8)
    m[t - pad:b + pad, l - pad:r + pad] = (sub > hull + 28).astype(np.uint8)
    return m


def light(rgb, mask, box):
    """the letters' colour along x, smoothed, as a function of the absolute column"""
    l, t, r, b = box
    xs, cols = [], []
    for x in range(l - 2, r + 3):
        ys = np.nonzero(mask[:, x])[0]
        if len(ys):
            xs.append(x)
            # the letter's body, not its anti-aliased edge: the brightest pixels of the column
            px = rgb[ys, x].astype(np.float32)
            cols.append(px[px.sum(1) >= np.percentile(px.sum(1), 85)].mean(0))
    xs, cols = np.array(xs), np.array(cols)
    k = max(3, (r - l) // 12) | 1
    sm = np.stack([np.convolve(np.pad(cols[:, c], k // 2, mode="edge"), np.ones(k) / k, mode="valid") for c in range(3)], 1)
    return lambda x: np.stack([np.interp(x, xs, sm[:, c]) for c in range(3)], -1)


def render(text, orig, box, font_path, color_at, shape, soft):
    """one line, at the original's cap height, centre and character width, as RGBA in the frame's pixels"""
    l, t, r, b = box
    cap = (b - t) * SS
    font = ImageFont.truetype(font_path, 100, index=1 if font_path.endswith(".ttc") else 0)
    cap100 = font.getbbox("H")[3] - font.getbbox("H")[1]
    font = ImageFont.truetype(font_path, round(100 * cap / cap100), index=1 if font_path.endswith(".ttc") else 0)
    x0, y0, x1, y1 = font.getbbox(text)
    img = Image.new("L", (x1 - x0 + 4 * SS, y1 - y0 + 4 * SS), 0)
    ImageDraw.Draw(img).text((2 * SS - x0, 2 * SS - y0), text, font=font, fill=255)
    hy = font.getbbox("H")
    top_of_caps = 2 * SS - y0 + hy[1]           # where a capital's top sits in the rendered strip
    # condensed like the original: as wide per character as the original line was
    want_w = (r - l) / len(orig) * len(text)
    sx = want_w * SS / (x1 - x0)
    img = img.resize((max(1, round(img.width * sx)), img.height), Image.LANCZOS)
    small = img.resize((max(1, round(img.width / SS)), max(1, round(img.height / SS))), Image.LANCZOS)
    a = np.asarray(small).astype(np.float32) / 255
    if soft:
        a = cv2.GaussianBlur(a, (0, 0), soft)
    H, W = shape
    out = np.zeros((H, W, 4), np.float32)
    cx = (l + r) / 2
    ox = round(cx - a.shape[1] / 2)
    oy = round(t - top_of_caps / SS)
    ys, xs = slice(max(0, oy), min(H, oy + a.shape[0])), slice(max(0, ox), min(W, ox + a.shape[1]))
    aa = a[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
    cols = color_at(np.arange(xs.start, xs.stop))[None, :, :].repeat(aa.shape[0], 0)
    out[ys, xs, :3] = cols
    out[ys, xs, 3] = aa
    return out


def main(kind, font_path="/System/Library/Fonts/Helvetica.ttc"):
    spec = PHOTOS[kind]
    src = Image.open(os.path.join(OUT, spec["src"]))
    has_alpha = src.mode == "RGBA"
    rgba = np.asarray(src.convert("RGBA")).copy()
    rgb = rgba[..., :3].copy()
    small = spec["boxes"][0][3] - spec["boxes"][0][1] < 12
    pad = 2 if small else 4
    masks, lights = [], []
    for box in spec["boxes"]:
        m = letters(rgb, box, pad)
        masks.append(m)
        lights.append(light(rgb, m, box))
    # 1. paint the old letters out
    hole = cv2.dilate(np.maximum.reduce(masks), np.ones((3, 3) if small else (5, 5), np.uint8))
    clean = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), hole, 3, cv2.INPAINT_TELEA)
    base = cv2.cvtColor(clean, cv2.COLOR_BGR2RGB).astype(np.float32)
    # 2-3. the new lines, in the old letters' light and softness
    for text, orig, box, color_at in zip(LINES, ORIGINAL, spec["boxes"], lights):
        layer = render(text, orig, box, font_path, color_at, base.shape[:2], 0.35 if small else 0.5)
        a = layer[..., 3:4]
        base = base * (1 - a) + layer[..., :3] * a
    rgba[..., :3] = np.clip(base + .5, 0, 255).astype(np.uint8)
    img = Image.fromarray(rgba if has_alpha else rgba[..., :3])
    # 4. every size, under new names
    for w, h, name in spec["sizes"]:
        path = os.path.join(OUT, name)
        img.resize((w, h), Image.LANCZOS).save(path, "WEBP", quality=86, alpha_quality=90, method=6)
        print(name, (w, h), os.path.getsize(path) // 1024, "KB")


if __name__ == "__main__":
    main(*sys.argv[1:])
