# -*- coding: utf-8 -*-
"""Las seis imágenes sobre TINTA DE MARCA (#1E1E1E), no negro puro. Mismo objeto en las
seis; lo que cambia es lo que cada vertical le hace. viewBox 0 0 1440 900."""
import random, json, math

W, H = 1440, 900
GROUND = "#1E1E1E"
VERTS = [(100, 14), (186, 64), (186, 164), (100, 214), (14, 164), (14, 64)]
HINT = [((57, 39), (143, 89)), ((143, 39), (57, 89)), ((57, 89), (57, 189)),
        ((14, 114), (100, 164)), ((143, 89), (143, 189)), ((100, 164), (186, 114))]
FACES = {"top": [(100, 14), (186, 64), (100, 114), (14, 64)],
         "left": [(14, 64), (100, 114), (100, 214), (14, 164)],
         "right": [(100, 114), (186, 64), (186, 164), (100, 214)]}

def M(cx, cy, k):
    return lambda x, y: (cx + (x - 100) * k, cy + (y - 114) * k)

def d_poly(pts, close=True):
    s = "M%.1f %.1f " % pts[0] + " ".join("L%.1f %.1f" % p for p in pts[1:])
    return s + (" Z" if close else "")

def cube(cx, cy, k, stroke="#fff", op=0.32, w=1.4, hint=True, cross=True, dash=None):
    p = M(cx, cy, k)
    da = ' stroke-dasharray="%s"' % dash if dash else ''
    out = ['<g fill="none" stroke="%s" stroke-opacity="%.2f" stroke-width="%.1f" stroke-linejoin="round" stroke-linecap="round"%s>' % (stroke, op, w, da)]
    out.append('<path d="%s"></path>' % d_poly([p(*v) for v in VERTS]))
    if cross:
        out.append('<path d="%s"></path>' % d_poly([p(14, 64), p(100, 114), p(186, 64)], False))
        out.append('<path d="%s"></path>' % d_poly([p(100, 114), p(100, 214)], False))
    if hint:
        for a, b in HINT:
            out.append('<path d="%s"></path>' % d_poly([p(*a), p(*b)], False))
    out.append('</g>')
    return "".join(out)

def cube_solid(cx, cy, k, color):
    p = M(cx, cy, k)
    o = []
    for f, a in (("top", 1.0), ("left", 0.86), ("right", 0.66)):
        o.append('<polygon points="%s" fill="%s" fill-opacity="%.2f"></polygon>'
                 % (" ".join("%.1f,%.1f" % p(*v) for v in FACES[f]), color, a))
    return "".join(o)

def glow(fid, blur=22):
    return ('<filter id="%s" x="-70%%" y="-70%%" width="240%%" height="240%%">'
            '<feGaussianBlur stdDeviation="%d"></feGaussianBlur></filter>' % (fid, blur))

def ground(key):
    return ('<defs><radialGradient id="vig%s" cx="50%%" cy="46%%" r="72%%">'
            '<stop offset="0%%" stop-color="#2C2C2C"></stop>'
            '<stop offset="100%%" stop-color="#171717"></stop></radialGradient></defs>'
            '<rect x="0" y="0" width="1440" height="900" fill="url(#vig%s)"></rect>' % (key, key))

def stars(rng, n, xr=(0, 1440), yr=(0, 900), rmax=1.5, op=(0.10, 0.85)):
    o = []
    for _ in range(n):
        x, y = rng.uniform(*xr), rng.uniform(*yr)
        r = rng.uniform(0.35, rmax)
        o.append('<circle cx="%.0f" cy="%.0f" r="%.1f" fill="#fff" opacity="%.2f"></circle>'
                 % (x, y, r, rng.uniform(*op) * (r / rmax) ** 0.6))
    return "".join(o)

# 1 · COMERCIO ELECTRÓNICO — un muro de cubos, uno encendido
def img_ec():
    rng = random.Random(23); C = "#008FD3"
    s = [ground("ec"), '<defs>%s%s</defs>' % (glow("gec", 18), glow("gec2", 60))]
    cols, rows = 15, 9
    cw, ch = 1440.0 / cols, 900.0 / rows
    k = (cw * 0.60) / 172.0
    HC, HR = 10, 3
    body, hero = [], None
    for r in range(rows):
        for c in range(cols):
            cx = c * cw + cw / 2 + (ch * 0.0)
            cy = r * ch + ch / 2
            if c == HC and r == HR:
                hero = (cx, cy); continue
            d = math.hypot((c - cols / 2.0) / cols, (r - rows / 2.0) / rows) * 2.0
            op = max(0.05, (0.34 - 0.19 * d) * rng.uniform(0.7, 1.25))
            body.append(cube(cx, cy, k, op=op, w=1.1, hint=False))
    s.append("".join(body))
    hx, hy = hero
    s.append('<g filter="url(#gec2)" opacity="0.55">%s</g>' % cube_solid(hx, hy, k * 1.06, C))
    s.append('<g filter="url(#gec)">%s</g>' % cube_solid(hx, hy, k, C))
    s.append(cube_solid(hx, hy, k, C))
    s.append(cube(hx, hy, k, stroke="#131313", op=0.55, w=2.0, hint=True))
    s.append(cube(hx, hy, k * 1.30, stroke=C, op=0.45, w=1.0, hint=False, cross=False, dash="5 7"))
    return "".join(s)

# 2 · CDN / EDGE — el cubo envuelve el mundo; el limbo es el borde
def img_cdn():
    rng = random.Random(11); C = "#F38020"
    cx, cy, r = 1006, 466, 296
    s = [ground("cdn"), stars(rng, 620), '<defs>%s%s' % (glow("gcdn", 26), glow("gcdn2", 62))]
    s.append('<clipPath id="pcdn"><circle cx="%d" cy="%d" r="%d"></circle></clipPath></defs>' % (cx, cy, r))
    s.append('<circle cx="%d" cy="%d" r="%d" fill="#131313"></circle>' % (cx, cy, r))
    mesh = []
    for i in range(1, 9):
        mesh.append('<ellipse cx="%d" cy="%d" rx="%d" ry="%.0f" fill="none" stroke="#fff" stroke-opacity="0.09" stroke-width="1"></ellipse>' % (cx, cy, r, r * math.cos(i * math.pi / 18)))
        mesh.append('<ellipse cx="%d" cy="%d" rx="%.0f" ry="%d" fill="none" stroke="#fff" stroke-opacity="0.07" stroke-width="1"></ellipse>' % (cx, cy, r * math.cos(i * math.pi / 18), r))
    s.append('<g clip-path="url(#pcdn)">%s</g>' % "".join(mesh))
    s.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-width="24" opacity="0.30" filter="url(#gcdn2)"></circle>' % (cx, cy, r, C))
    s.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-width="6" opacity="0.85" filter="url(#gcdn)"></circle>' % (cx, cy, r, C))
    s.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-width="2.2"></circle>' % (cx, cy, r, C))
    # el cubo, circunscrito: la coraza que envuelve el mundo
    k = 4.06
    s.append(cube(cx, cy, k, stroke="#fff", op=0.30, w=1.6, hint=True))
    p = M(cx, cy, k)
    nodes = []
    for v in VERTS:
        vx, vy = p(*v)
        nodes.append('<circle cx="%.0f" cy="%.0f" r="15" fill="%s" opacity="0.5" filter="url(#gcdn)"></circle>' % (vx, vy, C))
        nodes.append('<circle cx="%.0f" cy="%.0f" r="6" fill="%s"></circle>' % (vx, vy, C))
        nodes.append('<circle cx="%.0f" cy="%.0f" r="17" fill="none" stroke="%s" stroke-opacity="0.5" stroke-width="1"></circle>' % (vx, vy, C))
    s.append("".join(nodes))
    return "".join(s)

# 3 · BIG DATA — el cubo emerge de la nube de puntos
def img_bd():
    rng = random.Random(37); C = "#EA4335"
    s = [ground("bd"), '<defs>%s%s</defs>' % (glow("gbd", 16), glow("gbd2", 52))]
    cx, cy, k = 900, 470, 3.15
    p = M(cx, cy, k)
    pts = []
    # difusa alrededor
    for _ in range(1700):
        a = rng.uniform(0, 2 * math.pi); rad = abs(rng.gauss(0, 1)) ** 0.85
        x = cx + math.cos(a) * rad * 400; y = cy + math.sin(a) * rad * 250
        if not (-20 < x < 1460 and -20 < y < 920): continue
        pts.append('<circle cx="%.0f" cy="%.0f" r="%.1f" fill="#fff" opacity="%.2f"></circle>'
                   % (x, y, rng.uniform(0.5, 1.9), max(0.05, rng.uniform(0.10, 0.55) * (1.2 - min(rad, 1.4) / 1.6))))
    # el cubo, dibujado con los datos: puntos densos sobre sus aristas
    EDGES = [(VERTS[i], VERTS[(i + 1) % 6]) for i in range(6)]
    EDGES += [((14, 64), (100, 114)), ((100, 114), (186, 64)), ((100, 114), (100, 214))]
    EDGES += [a for a in HINT]
    for a, b in EDGES:
        ax, ay = p(*a); bx, by = p(*b)
        L = math.hypot(bx - ax, by - ay)
        n = int(L / 3.4)
        for i in range(n):
            t = i / max(1, n - 1)
            jx = rng.gauss(0, 3.4); jy = rng.gauss(0, 3.4)
            x = ax + (bx - ax) * t + jx; y = ay + (by - ay) * t + jy
            pts.append('<circle cx="%.0f" cy="%.0f" r="%.1f" fill="#fff" opacity="%.2f"></circle>'
                       % (x, y, rng.uniform(0.6, 2.1), rng.uniform(0.42, 0.95)))
    s.append("".join(pts))
    hx, hy = 1300, 764
    s.append('<path d="M1128 640 L%d %d" stroke="%s" stroke-opacity="0.26" stroke-width="1" stroke-dasharray="5 8"></path>' % (hx, hy, C))
    s.append('<circle cx="%d" cy="%d" r="13" fill="%s" opacity="0.55" filter="url(#gbd2)"></circle>' % (hx, hy, C))
    s.append('<circle cx="%d" cy="%d" r="5.5" fill="%s" filter="url(#gbd)"></circle>' % (hx, hy, C))
    for rr, op in ((28, 0.9), (56, 0.45), (92, 0.2)):
        s.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-opacity="%.2f" stroke-width="1"></circle>' % (hx, hy, rr, C, op))
    s.append('<path d="M%d %d h-64 M%d %d h64 M%d %d v-64 M%d %d v64" stroke="%s" stroke-opacity="0.5" stroke-width="1"></path>'
             % (hx - 104, hy, hx + 104, hy, hx, hy - 104, hx, hy + 104, C))
    return "".join(s)

# 4 · INTEGRACIÓN — todo pasa por el cubo
def img_int():
    rng = random.Random(53); C, CL = "#1D4E89", "#5B94DA"
    cx, cy, k = 760, 450, 2.35
    s = [ground("int"), '<defs>%s%s</defs>' % (glow("gint", 18), glow("gint2", 54))]
    wires = []
    for _ in range(96):
        y0 = rng.uniform(-60, 960); y1 = rng.uniform(-60, 960)
        wires.append('<path d="M-120 %.0f C%.0f %.0f %.0f %.0f %.0f %.0f" fill="none" stroke="#fff" stroke-opacity="%.2f" stroke-width="%.1f"></path>'
                     % (y0, rng.uniform(180, 620), rng.uniform(-140, 1040), rng.uniform(360, 700), cy + rng.gauss(0, 90),
                        cx, cy + rng.gauss(0, 40), rng.uniform(0.05, 0.22), rng.uniform(0.6, 1.2)))
        wires.append('<path d="M%.0f %.0f C%.0f %.0f %.0f %.0f 1560 %.0f" fill="none" stroke="#fff" stroke-opacity="%.2f" stroke-width="%.1f"></path>'
                     % (cx, cy + rng.gauss(0, 40), rng.uniform(820, 1160), cy + rng.gauss(0, 90),
                        rng.uniform(1100, 1400), rng.uniform(-140, 1040), y1, rng.uniform(0.05, 0.22), rng.uniform(0.6, 1.2)))
    s.append("".join(wires))
    s.append(stars(rng, 140, rmax=1.1, op=(0.06, 0.32)))
    # el cubo: el punto por el que pasa todo
    s.append('<polygon points="%s" fill="#171717" opacity="0.92"></polygon>'
             % " ".join("%.1f,%.1f" % M(cx, cy, k)(*v) for v in VERTS))
    s.append(cube(cx, cy, k, stroke="#fff", op=0.40, w=1.8, hint=True))
    path = "M-40 690 C 300 690, 420 480, %d %d S 1140 300, 1240 330 S 1420 250, 1500 236" % (cx, cy)
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="24" opacity="0.55" filter="url(#gint2)"></path>' % (path, C))
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="7" opacity="0.5" filter="url(#gint)"></path>' % (path, CL))
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="2.6"></path>' % (path, CL))
    for px, py in [(cx, cy), (1240, 330)]:
        s.append('<circle cx="%d" cy="%d" r="6.5" fill="%s"></circle>' % (px, py, CL))
        s.append('<circle cx="%d" cy="%d" r="16" fill="none" stroke="%s" stroke-opacity="0.55" stroke-width="1"></circle>' % (px, py, CL))
    return "".join(s)

# 5 · GREENFIELD — el campo vacío y la primera pieza del cubo
def img_gf():
    rng = random.Random(71); C, CL = "#3E7D50", "#5FBE7C"
    hz = 392
    s = [ground("gf"), stars(rng, 420, yr=(0, hz - 8), rmax=1.3, op=(0.08, 0.7)),
         '<defs>%s%s</defs>' % (glow("ggf", 18), glow("ggf2", 56))]
    lines = []
    vx = 700
    for i in range(-30, 31):
        lines.append('<path d="M%d %d L%.0f 960" fill="none" stroke="#fff" stroke-opacity="0.10" stroke-width="1"></path>' % (vx, hz, vx + i * 228))
    for kk in range(1, 22):
        t = kk / 22
        y = hz + (960 - hz) * (t ** 2.5)
        lines.append('<path d="M-40 %.0f H1480" fill="none" stroke="#fff" stroke-opacity="%.2f" stroke-width="1"></path>' % (y, 0.05 + 0.13 * t))
    s.append("".join(lines))
    s.append('<path d="M-40 %d H1480" fill="none" stroke="#fff" stroke-opacity="0.30" stroke-width="1"></path>' % hz)
    s.append('<rect x="0" y="%d" width="1440" height="120" fill="#171717" opacity="0.5"></rect>' % (hz - 120))
    # el cubo por levantar: silueta en discontinuo, y la primera pieza puesta
    cx, cy, k = 980, 560, 2.1
    s.append(cube(cx, cy, k, stroke="#fff", op=0.34, w=1.5, hint=True, dash="10 9"))
    p = M(cx, cy, k)
    # el voxel frontal inferior: centro del cubo completo desplazado al vértice bajo
    vx, vy = p(100, 164)
    s.append('<g filter="url(#ggf2)" opacity="0.55">%s</g>' % cube_solid(vx, vy, k * 0.5, C))
    s.append(cube_solid(vx, vy, k * 0.5, CL))
    s.append(cube(vx, vy, k * 0.5, stroke="#171717", op=0.5, w=1.6, hint=False))
    # su sombra en el suelo
    fx, fy = p(100, 214)
    s.append('<ellipse cx="%.0f" cy="%.0f" rx="118" ry="30" fill="none" stroke="%s" stroke-opacity="0.30" stroke-width="1"></ellipse>' % (fx, fy + 14, CL))
    return "".join(s)

# 6 · IA — la ruta que se enciende dentro del cubo
def img_ia():
    rng = random.Random(97); C, CL = "#6B4FBB", "#9A7BEE"
    cx, cy, k = 760, 460, 3.5
    p = M(cx, cy, k)
    s = [ground("ia"), '<defs>%s%s</defs>' % (glow("gia", 18), glow("gia2", 54))]
    # retícula de nodos en los cruces de la trama 2×2 del cubo, en tres planos
    grid = []
    for u in (14, 57, 100, 143, 186):
        for v in (64, 114, 164):
            grid.append((u, v))
    for u in (57, 100, 143):
        for v in (39, 89, 139, 189):
            grid.append((u, v))
    nodes = sorted(set(grid))
    XY = [p(*g) for g in nodes]
    edges = []
    for i in range(len(XY)):
        for j in range(i + 1, len(XY)):
            d = math.dist(XY[i], XY[j])
            if d < 190 and rng.random() < 0.55:
                edges.append('<path d="M%.0f %.0f L%.0f %.0f" stroke="#fff" stroke-opacity="%.2f" stroke-width="0.8"></path>'
                             % (XY[i][0], XY[i][1], XY[j][0], XY[j][1], rng.uniform(0.05, 0.16)))
    s.append("".join(edges))
    s.append(cube(cx, cy, k, stroke="#fff", op=0.26, w=1.4, hint=True))
    s.append("".join('<circle cx="%.0f" cy="%.0f" r="4" fill="#1E1E1E" stroke="#fff" stroke-opacity="0.40" stroke-width="1"></circle>' % xy for xy in XY))
    lit = [p(14, 64), p(57, 89), p(100, 164), p(143, 139), p(186, 164)]
    d = d_poly(lit, False)
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="22" opacity="0.5" filter="url(#gia2)"></path>' % (d, C))
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="6" opacity="0.5" filter="url(#gia)"></path>' % (d, CL))
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="2.6"></path>' % (d, CL))
    for xy in lit:
        s.append('<circle cx="%.0f" cy="%.0f" r="6.5" fill="%s"></circle>' % (xy[0], xy[1], CL))
        s.append('<circle cx="%.0f" cy="%.0f" r="17" fill="none" stroke="%s" stroke-opacity="0.5" stroke-width="1"></circle>' % (xy[0], xy[1], CL))
    return "".join(s)

IMAGES = {
    "ec":  ("Comercio electrónico", "comercio-electronico", "#008FD3", "Un muro de cubos; uno es tu pedido", img_ec()),
    "cdn": ("CDN, WAF y seguridad edge", "cdn-waf-seguridad-edge-cloudflare", "#F38020", "El cubo envuelve el mundo; el limbo es el borde", img_cdn()),
    "bd":  ("Big Data & Cloud Analytics", "big-data-cloud-analytics", "#EA4335", "El cubo emerge del dato; la mira, lo que se sale", img_bd()),
    "int": ("Integración de sistemas", "integracion-de-sistemas", "#1D4E89", "Todo pasa por el cubo", img_int()),
    "gf":  ("Desarrollo greenfield", "desarrollo-greenfield", "#3E7D50", "El campo vacío y la primera pieza puesta", img_gf()),
    "ia":  ("Inteligencia artificial", "inteligencia-artificial", "#6B4FBB", "La ruta que se enciende dentro del cubo", img_ia()),
}
SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">%%s</svg>' % (W, H, W, H)

if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    # the canvas build reads this; the site reads the SVGs
    json.dump({k: list(v) for k, v in IMAGES.items()},
              open(os.path.join(here, "images.json"), "w"), ensure_ascii=False)
    # No role, no aria-label, no <title>: the plates are DECORATIVE. The <img>
    # that carries them has alt="" and the vertical's name is a real link next
    # to it — a label here would be locale-bound copy living outside the CMS,
    # and it would read the picture out twice.
    out = os.path.normpath(os.path.join(here, "..", "..", "..", "public", "assets", "hero"))
    os.makedirs(out, exist_ok=True)
    for k, v in IMAGES.items():
        path = os.path.join(out, k + ".svg")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(SVG % v[4])
        print("%-4s %4d KB  %s" % (k, os.path.getsize(path) // 1024, path))
