"""The Vizcaya Bridge's drawing for the integration hero, from FLUX's redrawing to the two WebPs.

The lighthouse's technique (#529): the drawing is traced from the ORIGINAL photograph's own edges, so
it lands on the real bridge by construction. The input to FLUX.2 [dev] is an edge sketch of the
bridge alone (Canny on the original, kept inside the mask the bridge was removed with: every edge in
the sky, only the tower legs below it), redrawn "keeping every line exactly where it is", seed 11,
2016 x 1344, the photograph's own frame. Its towers land within 7 px of the photograph's. Nothing is
invented: an earlier prompt asked for the gondola, and FLUX drew one where the photograph has none
(founder, 2026-10-02: "la barcaza te la has inventado"). FLUX's output is not committed; the sketch
and the prompt are in the issue. Steps:

1. ink to alpha: dark ink on white paper, a = clip((0.90 - grey) / 0.45, 0, 1);
2. tinted close to the section's red (#EC4A3A against #EA4335): the bridge and its connectors read
   as one thing, and it stands out on the band as the lighthouse does (founder, 2026-10-02: "el
   rojo del puente tiene que tener más fuerza… similar al de las flechas");
3. cut to the band the ink occupies (rows 390-926), so the drawing never outsizes the banks and
   never becomes the page's largest paint.

    python3 docs/design/hero-rotativo/bridge_plan.py <flux-redrawing.jpg>
"""
import os, sys
import numpy as np
from PIL import Image

RED = (0xEC, 0x4A, 0x3A)
TOP, BOTTOM = 390, 926


def main(src):
    grey = np.asarray(Image.open(src).convert("L"), dtype=np.float64) / 255
    a = (np.clip((0.90 - grey) / 0.45, 0, 1) * 255).astype(np.uint8)
    rgba = np.dstack([np.full(a.shape + (3,), RED, np.uint8), a])
    band = Image.fromarray(rgba).crop((0, TOP, a.shape[1], BOTTOM))
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.normpath(os.path.join(here, "..", "..", "..", "public", "assets", "hero"))
    for width, name in ((1320, "int-puente-trazo.webp"), (960, "int-puente-trazo-960.webp")):
        img = band.resize((width, round(width * (BOTTOM - TOP) / a.shape[1])), Image.LANCZOS)
        img.save(os.path.join(out, name), "WEBP", quality=70, alpha_quality=70, method=6)
        print(name, img.size, os.path.getsize(os.path.join(out, name)), "bytes")


if __name__ == "__main__":
    main(sys.argv[1])
