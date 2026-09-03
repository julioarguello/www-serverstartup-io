# -*- coding: utf-8 -*-
"""The die's tumble down the hero's right margin — generates the CSS in
`src/styles/homepage.css` between the two `s-hero-die` markers.

    python3 docs/design/hero-rotativo/dado.py

WHY THE DIE MOVES AND THE DRAWINGS DO NOT
-----------------------------------------
The band shows six drawings and each one composes a cube, so the first answer
to "there is no through-line" was to move the PLATES until each drawing's cube
sat on the next drawing's cube, and cut there (#509). It measured perfectly —
all six cuts landed inside a pixel — and it read badly, because the six relays
inherit their shape from wherever six different illustrations happen to put a
cube. Measured off the registration table: the relays are 50 to 271 drawing px
long (x5.4) and change the plate's scale by x1.09 to /10.5 (x10). Two of the
six were imperceptible and three were violent, which is exactly what came back:
"alguna transición tiene sentido, otras no se perciben".

So the drawings hold still and cut, and the MARK moves. One object, the same
one the menu carries, crossing all six slides — which is what the file's own
"six plates, one object (#413)" was always supposed to mean.

WHY IT IS IN THE MARGIN AND NOT ON THE PICTURE
----------------------------------------------
The first cut of this idea put the die on each drawing's cube, at the
registrations below. Rendered, it flies straight through the <h1>: the six
drawn cubes sit at x 760..1008 of 1440, and that is where the copy is. Measured
on the built page, the hero's text column ends at x 1140 of 1440, 1060 of 1280,
970 of 1100 — the words and the card fill everything to the left of it at every
width. A saturated 175 px mark cannot cross that: white 20 px copy over the
red face is 3.9:1, under the 4.5:1 the a11y gate holds the page to.

What is left is the margin to the right of the text column, and it is a real
piece of the frame: 300 px at 1440, 220 at 1280, 500 at 1920. It is also
exactly half a viewport step wide, because the column is a fixed 840 px — hence
`right: calc(25% - 210px)`, which lands on the middle of that margin at every
width, and the hide below 1240 px, where the margin no longer holds the mark.

WHY THE NUMBERS ARE WHAT THEY ARE
---------------------------------
A cube of side 124 projects sqrt(2) * 124 = 175 px in isometric, and 175 is
the size the menu draws the mark at. Every relay moves the die exactly 175 px
and turns it exactly 90 degrees, so it covers one of its own widths per quarter
turn: that ratio is what a die rolling on a surface does, and it is the whole
reason this reads as rolling rather than sliding. It also makes all six relays
the same gesture, which is the complaint the previous version could not fix.

The six stations are a there-and-back on one vertical line — down three, up
three — because that is the only closed path of six equal steps that fits a
corridor 175 px wide. Chord 175 and three steps each way put the ends at
+-262.5 and the middle pair at +-87.5, a run of 700 px including the die. The
line is centred on `calc(50% + 39px)` rather than the stage's middle: the
header covers the top 78 px of the stage, and 78/2 = 39 puts the run in the
middle of what is actually visible. At the shortest hero this repo produces
(780 px) the run leaves one pixel top and bottom.

WHY THE POSES ARE SIX QUARTER TURNS AND WHY THEY CLOSE
------------------------------------------------------
Each slide shows its own vertical's face at the front of the isometric view.
The faces belong to the verticals in `nav.ts` (`DIE_FACE`) and the slides come
in `FACE_ORDER`, so the sequence of faces that must arrive at the front is
left, front, top, right, back, bottom. Every consecutive pair of those is
ADJACENT on a cube, and two adjacent faces are one quarter turn apart — so
every relay is 90 degrees, with no freedom in the axis or the sign. Composed,
the six turns come back to the identity (checked below, residual 0.000 deg),
so the cycle closes without a correction anywhere.

The turns alternate about -y and -x, so the die yaws and pitches by turns
rather than spinning on one axis: a tumble, not a propeller.

Poses are emitted as `rotate3d()` of the whole thing, view times body. CSS
interpolates two rotate3d with different axes by decomposing to matrices and
slerping the quaternions, which for a pure 90-degree rotation is the shortest
arc and is exactly right; there is no 180-degree case to make the axis
ambiguous.

WHY IT IS ONE ANIMATION AND NOT TWO
-----------------------------------
The station and the pose ride ONE transform list, on the cube itself. Split
across two elements they would need two curves, and a roll whose turn and
travel are on different curves is a roll that skids; here they cannot come
apart. It is also one element and one animation fewer.

WHY THE SIDE IS A CLAMP AND NOT A NUMBER
----------------------------------------
The die is 124 px on a side, because that projects sqrt(2) x 124 = 175 px and
175 is the size the menu shows the mark at. But that is the size it wants, not
always the size that fits: MID-RELAY a tumbling cube is wider than at rest. At
rest it shows a hexagon sqrt(2)*L across; turning, it passes through views of
its own space diagonal and reaches sqrt(3)*L, which for L=124 is 215 px where
the resting mark is 175. Measured on the built page, the silhouette sweeps 210
px wide and 728 px tall, and at 1280x800 that put it 5 px inside the card and 3
px past the band, which `overflow: clip` then sliced.

So the side is a clamp. Because the die is anchored at the exact centre of the
free margin, the gap to the copy and the gap to the band's edge are the same
number, and one inequality covers both:

    (sqrt(3)/2) L  <=  25vw - 210px - MARGIN          (half the silhouette)
    (1.5 sqrt(2) + sqrt(3)/2) L  <=  50svh - 39px - MARGIN    (half the run)

which is what the generated `--die-l` says, capped at 124. Everything the die
is made of is a multiple of it — the faces, the translateZ, the drawing's
overhang, and the stations — so one `min()` resizes the whole thing and the
relay stays exactly one die-width. It is the same size in all six slides, which
is what the moving plates could not manage; it is a different size on a smaller
screen, which is the only way it stays whole on one.

HOW TO LOOK AT IT
-----------------
Taking a screenshot of this page freezes its animation clock, in headless AND
headful Chrome, so the frame that lands on disk is not the frame the computed
style describes — every capture of a relay comes out looking like the first
station, whatever the seek says. Poll `getComputedStyle` with no screenshot at
all to check the cycle, and to LOOK at a frame: seek, read the interpolated
matrix out, write it back as a plain inline style with the animation off, and
only then capture.
"""

import math

CYCLE, STEP = 36.0, 6.0
THROW = 0.9              # the tumble, ending exactly on the plate cut
L_MAX = 124.0            # the side it wants: it projects sqrt(2)*L = 175 px
MARGIN = 24.0            # what stays clear of the copy, the band and the header
COL, HALF_HDR = 840.0, 39.0     # the text column, and half the header it hides under
WIDE = math.sqrt(3.0) / 2.0     # half the widest a cube of side 1 ever projects
EASE = "cubic-bezier(0.45, 0, 0.25, 1)"

ORDER = ["ec", "int", "bd", "cdn", "gf", "ia"]
# from src/utils/nav.ts — the same face belongs to the same vertical everywhere
DIE_FACE = {"int": "front", "ec": "left", "cdn": "right",
            "gf": "back", "bd": "top", "ia": "bottom"}
# the drawings' own cube registrations, kept because they are what proved the
# picture has no room for the mark: docs/design/hero-rotativo/generate.py
REG = {"ec": (1008.0, 350.0), "int": (760.0, 450.0), "bd": (900.0, 470.0),
       "cdn": (940.0, 500.0), "gf": (980.0, 560.0), "ia": (760.0, 460.0)}

# ── the six stations: down three, up three, on one line ──
# in chords, and a chord is sqrt(2) sides, so these are multiples of the side
_Y = [-1.5, -0.5, 0.5, 1.5, 0.5, -0.5]
STATION = [math.sqrt(2.0) * y for y in _Y]

N = {"front": (0, 0, 1), "back": (0, 0, -1), "right": (1, 0, 0),
     "left": (-1, 0, 0), "top": (0, -1, 0), "bottom": (0, 1, 0)}
FRONT = (0.0, 0.0, 1.0)
TILT_X, TILT_Y = -35.264, 45.0


def mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)]
            for i in range(3)]


def apply(m, v):
    return tuple(sum(m[i][k] * v[k] for k in range(3)) for i in range(3))


def rot(axis, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    x, y, z = axis
    n = math.sqrt(x * x + y * y + z * z)
    x, y, z = x / n, y / n, z / n
    k = 1.0 - c
    return [[c + x * x * k, x * y * k - z * s, x * z * k + y * s],
            [y * x * k + z * s, c + y * y * k, y * z * k - x * s],
            [z * x * k - y * s, z * y * k + x * s, c + z * z * k]]


def turn(m, t):
    """the minimal rotation taking unit m onto unit t"""
    d = max(-1.0, min(1.0, sum(a * b for a, b in zip(m, t))))
    if d > 1 - 1e-12:
        return [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 0.0
    ax = (m[1] * t[2] - m[2] * t[1],
          m[2] * t[0] - m[0] * t[2],
          m[0] * t[1] - m[1] * t[0])
    return rot(ax, math.degrees(math.acos(d))), math.degrees(math.acos(d))


def axis_angle(m):
    tr = m[0][0] + m[1][1] + m[2][2]
    ang = math.degrees(math.acos(max(-1.0, min(1.0, (tr - 1.0) / 2.0))))
    if ang < 1e-9:
        return (0.0, 0.0, 1.0, 0.0)
    k = 1.0 / (2.0 * math.sin(math.radians(ang)))
    return ((m[2][1] - m[1][2]) * k, (m[0][2] - m[2][0]) * k,
            (m[1][0] - m[0][1]) * k, ang)


VIEW = mul(rot((1, 0, 0), TILT_X), rot((0, 1, 0), TILT_Y))

# body rotations: one quarter turn per relay, each bringing the next
# vertical's face to the front of the view
_q = turn(N[DIE_FACE[ORDER[0]]], FRONT)[0]
BODY, STEPS = [_q], []
for i in range(1, 7):
    face = N[DIE_FACE[ORDER[i % 6]]]
    r, ang = turn(apply(BODY[-1], face), FRONT)
    STEPS.append(ang)
    BODY.append(mul(r, BODY[-1]))

POSE = [axis_angle(mul(VIEW, q)) for q in BODY]      # 7 entries: [0] == [6]


def frame(i):
    """station and pose in one list, on the cube itself — see the docstring"""
    x, y, z, a = POSE[i]
    return ("translateY(calc(var(--die-l) * %.4f)) "
            "rotate3d(%.4f, %.4f, %.4f, %.3fdeg)") % (
        STATION[i % 6], x, y, z, a)


def pct(t):
    return 100.0 * (t % CYCLE) / CYCLE


def track(name, value):
    """One keyframe interval per relay: rest, then the tumble, and nothing in
    between. Standing still needs two stops — a keyframe that reaches a value
    and says nothing more is interpolated straight on to the next one."""
    rows = []
    for i in range(6):
        rest, land = i * STEP, (i + 1) * STEP
        rows.append(("%.4f%%, %.4f%%" % (pct(rest), pct(land - THROW)),
                     value(i), True))
    rows.append(("100%", value(6), False))
    out = ["@keyframes %s {" % name]
    for sel, v, eased in rows:
        out.append("\t%s { transform: %s;%s }"
                   % (sel, v, (" animation-timing-function: %s;" % EASE)
                      if eased else ""))
    out.append("}")
    return "\n".join(out)


def side():
    """The anchor and the side, from the same three numbers.

    The die hangs at the exact centre of the free margin. The text column is a
    fixed COL wide and centred, so that margin is (100% - COL)/2 and its middle
    is 25% - COL/4 in from the right edge — which is also why the room to the
    copy and the room to the band's edge are ONE number and one inequality
    covers both. Vertically the header hides the band's top 2*HALF_HDR, so the
    run is centred HALF_HDR below the middle and has 50svh - HALF_HDR each way.

    See WHY THE SIDE IS A CLAMP for where sqrt(3)/2 comes from."""
    tall = 1.5 * math.sqrt(2.0) + WIDE
    return (
        ".s-hero__die {\n"
        "\tposition: absolute;\n"
        "\t/* the middle of the margin the text column leaves, at every width */\n"
        "\tright: calc(25%% - %.0fpx);\n"
        "\t/* and the middle of what is VISIBLE, not of the band: the header\n"
        "\t   covers its top %.0f px, and half of that is the %.0f. */\n"
        "\ttop: calc(50%% + %.0fpx);\n"
        "\t/* Everything the die is made of is a multiple of this, so one min()\n"
        "\t   resizes the whole thing and a relay stays exactly one die-width.\n"
        "\t   %.0f is the size the menu shows the mark at; the other two are the\n"
        "\t   widest and the tallest that still leave %.0f px clear of the copy,\n"
        "\t   of the band and of the header, allowing for the sqrt(3)/2 half-\n"
        "\t   width a cube reaches mid-tumble and not the sqrt(2)/2 it rests at. */\n"
        "\t--die-l: min(%.0fpx, calc(%.4fvw - %.2fpx), calc(%.4fsvh - %.2fpx));\n"
        "\twidth: 0;\n"
        "\theight: 0;\n"
        "\tz-index: 1;\n"
        "}" % (COL / 4.0, 2 * HALF_HDR, HALF_HDR, HALF_HDR,
               L_MAX, MARGIN,
               L_MAX, 25.0 / WIDE, (COL / 4.0 + MARGIN) / WIDE,
               50.0 / tall, (HALF_HDR + MARGIN) / tall))


def manual():
    """With the arrows driving the band nothing animates, so each slide parks
    the die on its own station and pose."""
    return "\n".join(
        '.s-hero.is-manual[data-slide="%d"] .s-hero__die-cube {\n'
        "\ttransform: %s;\n}" % (i, frame(i)) for i in range(6))


if __name__ == "__main__":
    print(side())
    print()
    print(track("s-hero-die", frame))
    print()
    print(manual())
    res = axis_angle(mul(BODY[6], [[BODY[0][j][i] for j in range(3)]
                                   for i in range(3)]))
    print("\n/* relays: %s deg · chord %.4f x the side · residual %.3f deg */"
          % ("/".join("%.0f" % s for s in STEPS), math.sqrt(2.0), res[3]))
