"""The Vizcaya Bridge's outline, built from geometry: what the hero measures, not what it shows.

Every landmark below was measured on the photograph's own frame (2016 x 1344,
`Bizkaia zubia - Puente Bizkaia.jpg`, Ebaki, CC BY-SA 4.0) through the aligned
AI plate, so the drawing lands on the photograph; the lines themselves are
straight segments and true parabolas, drawn here. The visible bridge is the
architect's drawing (`public/assets/hero/int-puente-plan.webp`, FLUX.2 [dev]
from the same photograph, on the same frame); this outline is what the hero
reads at run time: the structure (towers, girder, the car with its trolley,
the plinths) keeps under the title and the excerpt and off every connector's
name. The lines (main cables, hangers, back-stays) are kept for reference and
not measured. Straight segments only (M/L).

    python3 docs/design/hero-rotativo/bridge.py

writes `src/assets/hero/int-puente.svg`, which HeroBridge.astro reads at build time.
"""
import os, sys

W, H = 2016, 1344

# towers: (top apex), legs at the girder's height and at the base, measured per row
LT = dict(apex=(320, 392), top=(305, 336, 405), base=(278, 365, 880))
RT = dict(apex=(1713, 392), top=(1692, 1736, 405), base=(1645, 1780, 905))
# girder chords, with the photograph's slight perspective (left end lower)
def chord_top(x): return 545 - (x - 420) * 0.017
def chord_bot(x): return 590 - (x - 420) * 0.016
GX0, GX1 = 336, 1692              # the girder runs between the towers' inner legs
# main cables: from each tower top down to the girder, fitted on the measured points
LC = [(320, 398), (380, 427), (460, 457), (540, 487), (620, 509), (700, 526), (742, chord_top(742))]
RC = [(1713, 398), (1580, 453), (1500, 481), (1420, 503), (1340, 522), (1296, chord_top(1296))]
# back-stays: doubled, from the tower tops out to the frame's edges
LB = [((316, 404), (0, 607)), ((300, 588), (0, 716))]
RB = [((1720, 404), (W, 590)), ((1738, 430), (W, 606)), ((1740, 584), (W, 676))]
# what only the drawing has, measured on its alpha: the car and its trolley, the two plinths
CAR = [(1528, 596, 1630, 690), (1380, 586, 1690, 598)]
PLINTHS = [(260, 880, 372, 990), (1657, 905, 1771, 990)]


def lerp(a, b, t): return a + (b - a) * t


def fit_parabola(pts):
    """least-squares y = a x^2 + b x + c through the measured cable points"""
    n = len(pts)
    sx = [sum(p[0] ** k for p in pts) for k in range(5)]
    sy = [sum(p[1] * p[0] ** k for p in pts) for k in range(3)]
    A = [[sx[4], sx[3], sx[2]], [sx[3], sx[2], sx[1]], [sx[2], sx[1], sx[0]]]
    B = [sy[2], sy[1], sy[0]]
    # Cramer's rule, 3x3
    def det(m): return (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]))
    D = det(A)
    out = []
    for i in range(3):
        M = [row[:] for row in A]
        for r in range(3): M[r][i] = B[r]
        out.append(det(M) / D)
    return out


def tower(t, panels=9):
    """two tapered legs, horizontal ties and one X per panel"""
    (xl0, xr0, y0), (xl1, xr1, y1) = t["top"], t["base"]
    ax, ay = t["apex"]
    s = []
    s.append(f'M{xl0},{y0} L{xl1},{y1} M{xr0},{y0} L{xr1},{y1} M{xl0},{y0} L{ax},{ay} L{xr0},{y0}')
    for i in range(panels + 1):
        f = i / panels
        y = lerp(y0, y1, f)
        s.append(f'M{lerp(xl0, xl1, f):.1f},{y:.1f} L{lerp(xr0, xr1, f):.1f},{y:.1f}')
    for i in range(panels):
        f0, f1 = i / panels, (i + 1) / panels
        ya, yb = lerp(y0, y1, f0), lerp(y0, y1, f1)
        s.append(f'M{lerp(xl0, xl1, f0):.1f},{ya:.1f} L{lerp(xr0, xr1, f1):.1f},{yb:.1f} '
                 f'M{lerp(xr0, xr1, f0):.1f},{ya:.1f} L{lerp(xl0, xl1, f1):.1f},{yb:.1f}')
    return " ".join(s)


def girder(bay=42):
    """top and bottom chords, verticals at every bay and a Warren diagonal in each"""
    s = [f'M{GX0},{chord_top(GX0):.1f} L{GX1},{chord_top(GX1):.1f}',
         f'M{GX0},{chord_bot(GX0):.1f} L{GX1},{chord_bot(GX1):.1f}']
    n = int((GX1 - GX0) / bay)
    step = (GX1 - GX0) / n
    for i in range(n + 1):
        x = GX0 + i * step
        s.append(f'M{x:.1f},{chord_top(x):.1f} L{x:.1f},{chord_bot(x):.1f}')
        if i < n:
            x2 = x + step
            a, b = (chord_top(x), chord_bot(x2)) if i % 2 == 0 else (chord_bot(x), chord_top(x2))
            s.append(f'M{x:.1f},{a:.1f} L{x2:.1f},{b:.1f}')
    return " ".join(s)


def cable(pts, every=36):
    a, b, c = fit_parabola(pts)
    x0, x1 = pts[0][0], pts[-1][0]
    lo, hi = min(x0, x1), max(x0, x1)
    xs = [lo + (hi - lo) * i / 60 for i in range(61)]
    d = "M" + " L".join(f'{x:.1f},{a * x * x + b * x + c:.1f}' for x in xs)
    hang = []
    n = int((hi - lo) / every)
    for i in range(1, n):
        x = lo + i * (hi - lo) / n
        hang.append(f'M{x:.1f},{a * x * x + b * x + c:.1f} L{x:.1f},{chord_top(x):.1f}')
    return d, " ".join(hang)


def main(out):
    lc, lh = cable(LC)
    rc, rh = cable(RC)
    back = " ".join(f'M{p[0]},{p[1]} L{q[0]},{q[1]}' for p, q in LB + RB)
    heavy = 'stroke-width="3.2"'
    light = 'stroke-width="1.7"'
    car = " ".join(f'M{l},{t} L{r},{t} L{r},{b} L{l},{b} L{l},{t} L{r},{b} M{r},{t} L{l},{b}' for l, t, r, b in CAR + PLINTHS)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke="currentColor" '
           f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
           f'<g class="b-towers"><path {heavy} d="{tower(LT)}"/><path {heavy} d="{tower(RT)}"/></g>'
           f'<g class="b-girder"><path {heavy} d="{girder()}"/></g>'
           f'<g class="b-car"><path {heavy} d="{car}"/></g>'
           f'<g class="b-cables"><path {heavy} d="{lc}"/><path {heavy} d="{rc}"/></g>'
           f'<g class="b-hangers"><path {light} d="{lh} {rh}"/></g>'
           f'<g class="b-stays"><path {light} d="{back}"/></g>'
           f'</svg>')
    open(out, "w").write(svg)
    print(out, len(svg), "bytes")


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.normpath(os.path.join(here, "..", "..", "..", "src", "assets", "hero", "int-puente.svg")))
