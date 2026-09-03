#!/usr/bin/env python3
"""The match cut, as CSS. Emits the `s-hero-cut-*` keyframes in homepage.css.

`generate.py` draws six plates, and it draws a cube inside every one of them —
in a DIFFERENT place and at a different size each time, because each cube is
part of its own composition. `REG` below is that registration, read out of
generate.py: the cube's centre in the plate's own 1440x900 coordinates, and the
`k` its `M(cx, cy, k)` was called with. The drawn hexagon is 172*k wide.

Six plates, one object (#413) — but until now the object JUMPED between them,
because nothing lined the six cubes up. Here the OUTGOING plate slides and
scales until its cube lands exactly on the cube of the plate coming in, and
only then do the two swap. The cube does not move; the world moves around it.
That is a match cut, and a match cut is a CUT: the swap is 224 ms wide (see
`s-hero-plate`), not a long dissolve that would leave the cube translucent and
doubled in the middle of it — which is exactly what the first draft did
(founder, 2026-09-03: "veo que el cubo se desvanece demasiado").

TWO CONSTRAINTS SHAPE THE OUTPUT, and both are why this is a generator and not
hand-written CSS:

  1. NOTHING EVER SCALES UP. A running transform animation is composited from
     one rasterisation, so an <img> blown up 7x mid-animation is 7x of blur.
     For each relay the plate that travels is therefore the one with the BIGGER
     cube, which always scales DOWN toward 1 — so `ec` (cube 58 px) and `gf`
     never travel at all, and no plate is ever drawn above 1.05.
  2. THE FIRST PLATE NEVER TRANSFORMS. It is the LCP element, and it holds the
     smallest cube of the six, so constraint 1 already excludes it. At load
     every plate is at its base `transform` — none — which is also what
     `prefers-reduced-motion` and `.is-manual` fall back to, for free.

Run with no arguments; paste the block between the two markers into
src/styles/homepage.css.
"""

import math

# cx, cy, k — read from generate.py's six M(cx, cy, k) calls.
REG = {
    "ec":  (1008.0, 350.0, (1440.0 / 15 * 0.60) / 172.0),
    "int": (760.0,  450.0, 2.35),
    "bd":  (900.0,  470.0, 3.15),
    "cdn": (940.0,  500.0, 3.43),
    "gf":  (980.0,  560.0, 2.10),
    "ia":  (760.0,  460.0, 3.50),
}
ORDER = ["ec", "int", "bd", "cdn", "gf", "ia"]

CYCLE, STEP, TURN, SWAP = 36.0, 6.0, 1.4, 0.224
# Where the two cuts a plate takes part in fall in ITS OWN animation time. The
# plates are delayed by `--i * --hero-step - 0.5s`, so the swap that brings a
# plate in is centred at local 0.5 s and the one that takes it out at 6.5 s.
CUT_IN, CUT_OUT = 0.5, STEP + 0.5
PUSH = 0.035         # a push of the camera through the cut, not a jump
STOPS = 5            # linear segments approximating the ease; 5 is under 4%

# object-position: 72% 50% on a 1440x900 image, so image pixel (u, v) lands at
# (72% + a*(u - 1036.8), 50% + a*(v - 450)) where a is one image pixel on
# screen: max(W/1440, H/900) for object-fit: cover.
ANCHOR_U, ANCHOR_V = 0.72 * 1440.0, 0.50 * 900.0

ss = lambda x: (lambda u: u * u * u * (u * (u * 6 - 15) + 10))(min(1.0, max(0.0, x)))
pct = lambda tau: 100.0 * tau / CYCLE


def leg(a, b, r):
    """Where the shared cube is, and how the plate must sit to hold it there.

    `a` is the registration the cube starts from and `b` the one it ends on.
    Returns (scale, dx, dy) for the plate registered at `b`... no: for the
    plate that TRAVELS, which is whichever of the two this is called for.
    """
    e = ss(r)
    cx = a[0] + (b[0] - a[0]) * e
    cy = a[1] + (b[1] - a[1]) * e
    k = math.exp(math.log(a[2]) * (1 - e) + math.log(b[2]) * e)
    k *= 1 + PUSH * math.sin(math.pi * r)
    return cx, cy, k


def frame(reg, cx, cy, k):
    """One keyframe for the plate registered at `reg`, holding the cube at
    (cx, cy) at size 172*k. `none` when that is exactly where it already is."""
    s = k / reg[2]
    dx, dy = cx - reg[0], cy - reg[1]
    if abs(s - 1) < 1e-4 and abs(dx) < 0.05 and abs(dy) < 0.05:
        return "none"
    return ("translate(calc(var(--hero-a) * %.3f), calc(var(--hero-a) * %.3f)) "
            "scale(%.5f)" % (dx, dy, s))


def travels(i):
    """Which of plate i's two relays it is the one that moves in, if any.

    The bigger cube travels (constraint 1), so a plate moves on its incoming
    relay when it is bigger than the plate before it, and on its outgoing one
    when it is bigger than the plate after."""
    me = REG[ORDER[i]][2]
    return (me > REG[ORDER[(i - 1) % 6]][2], me > REG[ORDER[(i + 1) % 6]][2])


def keyframes():
    out = []
    for i, key in enumerate(ORDER):
        inc, outg = travels(i)
        if not (inc or outg):
            continue
        me = REG[key]
        prev, nxt = REG[ORDER[(i - 1) % 6]], REG[ORDER[(i + 1) % 6]]
        rows = []

        # The value the plate rests at while nobody can see it, which has to be
        # both the 0% and the 100% value or the loop jumps in view.
        idle = frame(me, *leg(prev, me, 0.0)) if inc else "none"

        if inc:
            # The cut lands at local 0.5 s — the middle of this plate's 224 ms
            # fade-in — and the travel starts there: at r = 0 this plate's cube
            # is exactly on the outgoing plate's, which is the whole point.
            rows.append(("0%%, %.4f%%" % pct(CUT_IN), idle))
            for n in range(1, STOPS):
                r = n / (STOPS - 1.0)
                rows.append(("%.4f%%" % pct(CUT_IN + TURN * r),
                             frame(me, *leg(prev, me, r))))
            # STANDING STILL NEEDS TWO STOPS, and this is the second one.
            # The travel above leaves the plate at rest and says nothing more;
            # the browser then interpolates from there straight to whatever
            # value comes next, so the plate creeps for the seconds in
            # between and arrives at its next relay visibly shrunk and
            # nowhere near the cube it is supposed to be handing over. That is
            # what the first draft of this file did — `int` and `bd` crept the
            # whole five seconds toward the crouched pose the loop needs at 0%,
            # and `cdn` and `ia` crept toward the start of their own exit. It
            # read as four of the six cuts not landing. The stop goes at the
            # start of the exit travel, or, when there is no exit travel, at
            # the moment the plate has finished fading out.
            rows.append(("%.4f%%" % pct(CUT_OUT - TURN if outg
                                        else CUT_OUT + SWAP / 2), "none"))
        else:
            rows.append(("0%%, %.4f%%" % pct(CUT_OUT - TURN), "none"))

        if outg:
            # Mirror image: the travel ENDS on the cut, at local 6.5 s, and
            # holds the matched position through the rest of the swap.
            for n in range(1, STOPS):
                r = n / (STOPS - 1.0)
                v = frame(me, *leg(me, nxt, r))
                rows.append(("%.4f%%" % pct(CUT_OUT - TURN * (1 - r)), v))
            rows.append(("%.4f%%" % pct(CUT_OUT + SWAP / 2), rows[-1][1]))
        rows.append(("%.4f%%, 100%%" % pct(CUT_OUT + SWAP / 2 + 0.4), idle))

        body = "\n".join("\t%s { transform: %s; }" % (at, v) for at, v in rows)
        out.append("@keyframes s-hero-cut-%d {\n%s\n}" % (i + 1, body))
    return out


def origins():
    out = []
    for i, key in enumerate(ORDER):
        if not any(travels(i)):
            continue
        x, y, _ = REG[key]
        out.append(
            ".s-hero__plate:nth-of-type(%d) {\n"
            "\ttransform-origin: calc(72%% + var(--hero-a) * %.1f) "
            "calc(50%% + var(--hero-a) * %.1f);\n"
            "\tanimation-name: s-hero-plate, s-hero-cut-%d;\n}"
            % (i + 1, x - ANCHOR_U, y - ANCHOR_V, i + 1))
    return out


if __name__ == "__main__":
    print("\n\n".join(origins() + keyframes()))
