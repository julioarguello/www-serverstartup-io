"""The hero photographs, restored: SeedVR2 for the detail, the scene's own whites for the colour.

The founder chose this after four rounds (2026-10-02, #531): grades and AI relighting were
rejected ("tonos de postal antigua", "le pones sol y da pena"). The photograph stays the one
that was taken; what changes is what had degraded it.

1. Detail: SeedVR2 3B (ByteDance, ICLR 2026), a faithful one-step restorer, run locally on
   Apple Silicon through the community CLI (github.com/numz/ComfyUI-SeedVR2_VideoUpscaler,
   `inference_cli.py`, Metal), at 2x, with its colour lock on so it adds no colour:

       inference_cli.py <photo.png> --dit_model seedvr2_ema_3b_fp16.safetensors \\
           --resolution <2 x short side> --batch_size 1 --color_correction lab \\
           --vae_encode_tiled --vae_decode_tiled

   The input is the photograph the hero already uses, full frame and RGB: for the bridge, the
   2016 px plate with the bridge removed; for the lighthouse, the 1760 px crop; for the tug (#537),
   the tanker and the tug cut from the bridge's own Commons original, `TUG_SOURCE`, at
   `--resolution 2000`. The 7B "sharp"
   model was tried and not kept: the founder found the 3B sharper.
2. Colour, step D1: the white balance measured on the scene's own whites (pixels with
   L > 72 and chroma < 18 inside the cut-out) and fully removed. The bridge's whites read
   b = +8.6 (the yellowing of an old print); the lighthouse's a slight green. Nothing else:
   no dehaze, no contrast, no saturation.
3. Where the restorer invents, the original's pixels stay: on the bridge, the tanker's name,
   which SeedVR2 rebuilt as invented letters; on the tug, the same tanker's IMO line (it came back
   as "OFO SASE0B5") and the tug's own name.

    python3 photo_restore.py bridge <seedvr2-2x.png> <original-plate.png> <cut-out.png>
    python3 photo_restore.py lighthouse <seedvr2-2x.png> <cut-out.png>
    python3 photo_restore.py tug <seedvr2-2x.png> <Bizkaia_zubia_-_Puente_Bizkaia.jpg>

Writes the WebPs into public/assets/hero/ under new names, so no browser keeps the old ones.
"""
import os, sys
import numpy as np, cv2
from PIL import Image

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "public", "assets", "hero"))
# what each hero serves: (width, height, file name), the largest first
SIZES = {
    "bridge": [(2016, 1116, "int-puente-restaurada-2016.webp"), (1320, 730, "int-puente-restaurada.webp"), (960, 531, "int-puente-restaurada-960.webp")],
    "lighthouse": [(1760, 2020, "cdn-faro-restaurado-1760.webp"), (1320, 1515, "cdn-faro-restaurado.webp"), (720, 826, "cdn-faro-restaurado-720.webp")],
    "tug": [(2016, 1301, "ia-remolcador-restaurado-2016.webp"), (1320, 852, "ia-remolcador-restaurado.webp"), (720, 465, "ia-remolcador-restaurado-720.webp")],
}
# the bridge plate's crop (the banks stop under the tug) and the tanker's name, in the 2x frame
BRIDGE_CROP = (0, 0, 2016, 1116)
SHIP_NAME = (1948, 1852, 2132, 1922)
# the tug (#537): what SeedVR2 is fed, in the 5333 x 3555 original; the frame the hero shows, in the
# 2x output (the tanker's stern, the tug, the quay); and the lettering that keeps the original's pixels
TUG_SOURCE = (1850, 1950, 3550, 2950)
TUG_CROP = (0, 0, 3100, 2000)
TUG_TEXT = [(1480, 1020, 1920, 1180), (2640, 1370, 2770, 1425)]


def neutral_whites(rgb, alpha):
    lab = cv2.cvtColor(rgb.astype(np.float32), cv2.COLOR_RGB2LAB)
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    whites = (alpha > .9) & (lab[..., 0] > 72) & (chroma < 18)
    da, db = lab[..., 1][whites].mean(), lab[..., 2][whites].mean()
    lab[..., 1] -= da
    lab[..., 2] -= db
    print(f"whites: a {da:+.1f}, b {db:+.1f} removed, over {int(whites.sum())} px")
    return np.clip(cv2.cvtColor(lab, cv2.COLOR_LAB2RGB), 0, 1)


def write(rgb, alpha, kind):
    # a frame with nothing cut out ships without an alpha channel
    img = Image.fromarray((rgb * 255 + .5).astype(np.uint8) if alpha.min() >= 1 else (np.dstack([rgb, alpha[..., None]]) * 255 + .5).astype(np.uint8))
    for w, h, name in SIZES[kind]:
        path = os.path.join(OUT, name)
        img.resize((w, h), Image.LANCZOS).save(path, "WEBP", quality=86, alpha_quality=90, method=6)
        print(name, os.path.getsize(path) // 1024, "KB")


def keep_original(big, orig, boxes):
    m = np.zeros(big.shape[:2], np.float32)
    for l, t, r, b in boxes:
        m[t:b, l:r] = 1
    m = cv2.GaussianBlur(m, (0, 0), 5)[..., None]
    return big * (1 - m) + orig * m


def main(kind, restored, *rest):
    big = np.asarray(Image.open(restored).convert("RGB")).astype(np.float32)
    if kind == "tug":
        (original,) = rest
        orig = np.asarray(Image.open(original).convert("RGB").crop(TUG_SOURCE).resize(big.shape[1::-1], Image.LANCZOS)).astype(np.float32)
        l, t, r, b = TUG_CROP
        big = keep_original(big, orig, TUG_TEXT)[t:b, l:r]
        rgb = big.clip(0, 255) / 255
        alpha = np.ones(rgb.shape[:2], np.float32)
        write(neutral_whites(rgb, alpha), alpha, kind)
        return
    if kind == "bridge":
        original, cutout = rest
        orig = np.asarray(Image.open(original).convert("RGB").crop(BRIDGE_CROP).resize(big.shape[1::-1], Image.LANCZOS)).astype(np.float32)
        m = np.zeros(big.shape[:2], np.float32)
        l, t, r, b = SHIP_NAME
        m[t:b, l:r] = 1
        m = cv2.GaussianBlur(m, (0, 0), 5)[..., None]
        big = big * (1 - m) + orig * m
        cut = Image.open(cutout).convert("RGBA").crop(BRIDGE_CROP)
    else:
        (cutout,) = rest
        cut = Image.open(cutout).convert("RGBA")
    w, h = cut.size
    rgb = np.asarray(Image.fromarray(big.clip(0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    alpha = np.asarray(cut)[..., 3].astype(np.float32) / 255
    write(neutral_whites(rgb, alpha), alpha, kind)


if __name__ == "__main__":
    main(sys.argv[1], *sys.argv[2:])
