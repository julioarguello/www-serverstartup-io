# The rotating hero — the six plates

Six drawn images, one per vertical, behind the home's headline and at the top of each
vertical's own page (#413). They are the **same object** in all six: the brand cube. What
changes is what each trade does to it.

| Face | Vertical | Colour | What happens to the cube |
| --- | --- | --- | --- |
| `ec` | Comercio electrónico | `#008FD3` | Repeated into a wall; one is lit — the order among a million |
| `int` | Integración de sistemas | `#1D4E89` | Pierced — the tangle goes in, one clean path comes out |
| `bd` | Big Data & Cloud Analytics | `#EA4335` | Drawn out of a point cloud; the crosshair marks the outlier |
| `cdn` | CDN, WAF y seguridad edge | `#F38020` | Wrapped around the world; its six vertices are the nodes, the limb is the edge |
| `gf` | Desarrollo greenfield | `#3E7D50` | Being built on an empty plane; exactly one voxel is placed |
| `ia` | Inteligencia artificial | `#6B4FBB` | Lit from the inside, vertex to vertex |

Drawn, not photographed: the repo has no photography beyond three team snapshots, and stock
would swap a distinctive identity for a generic one. The ground is `--color-primary` — brand
ink, deliberately **not** the console's near-black, because #304 gave black to the machine
voice and a picture band that borrowed it would take the consoles' meaning away.

## The sky, and where the world goes

A black rectangle with white specks is a photograph of a night sky, not a place. Three things
make the six read as space rather than as texture, and all three are in `generate.py`:

- **A body.** Every plate carries a world — usually a limb running off the edge, because a
  curve that leaves the frame can only be something enormous. It occludes the stars behind
  it, which is what turns a flat field into a volume. `cdn` gets a small moon instead: its
  subject already *is* a planet, and a second world would have argued with the first.
- **Cloud, not dust.** Three soft lobes — two in the vertical's own hue, one cold neutral —
  drawn **before** the stars, so the field sits inside the cloud instead of on top of it.
- **A band.** 34% of every star field falls along a galactic band with gaussian falloff and
  26% in clusters. A uniform scatter is the one distribution the real sky never has.

**The body lives in the right half of the frame.** That is a composition rule, not a
preference: the scrim darkens the left because the copy is there, so a world on the left is a
world nobody sees — and on a phone, where the plate is cropped to `object-position: 72%`, it
is cropped away entirely. `ec`, `int` and `bd` were drawn left first and moved.

**Every subject sits inside `y` 150–760**, and that is a hard constraint rather than a
composition choice. The band is `min-height: 100svh` with `object-fit: cover`, so any viewport
that is not 3:2 crops the plate top and bottom — 112px each at 1920×860, 100px at 1440×700.

## The shared sky

The constellations are **not** in the six plates. They are one file,
`constellations.svg`, drawn once and placed identically on the home carousel and on every
vertical page — the founder's brief, and the correct one: *"digamos que es un fondo común"*.
Six plates that each tilted a pair differently made the pair part of the picture; one layer
that never moves while the pictures turn makes it the fixed point the pictures move against,
which is what a pole star is for.

It is also the **whole circumpolar sky**, not two asterisms, and that was the second half of
the same correction: *"lo que no quiero es que sean silos inconexos. Busca cómo es el
universo, toma como referencia ese mapa, y construye ese fondo común de forma fiel a la
realidad."* Two figures alone on ink are two icons floating in a void, and nobody navigates
by an icon.

**The source is a catalogue, not a drawing.** [`bsc5-north.tsv`](bsc5-north.tsv) is the Yale
Bright Star Catalogue, 5th Revised Edition (Hoffleit & Warren, 1991, public domain), filtered
to every star north of Dec +25° down to magnitude 6.0 — the naked-eye limit on a good night.
**1,449 stars**, at their J2000 positions, with their real magnitudes. `generate.py` puts them
through a stereographic projection tangent to the north celestial pole, which is what every
planisphere uses: conformal, so every figure keeps its true shape, with the pole dead centre.
Size and opacity come off one magnitude ramp, so a third-magnitude star is dimmer than a
second-magnitude one here for the same reason it is dimmer in the sky.

Five traditional figures are joined: **Ursa Major**, **Ursa Minor**, **Draco**, **Cepheus** and
**Cassiopeia**. Draco is not decoration — it is the answer to "inconexos". The dragon winds
physically between the two bears, from its tail beside the Plough's bowl to its head past the
Little Dipper, and drawing it is what turns two figures into one continuous sky. Cepheus and
Cassiopeia come round the far side of the pole because that is where they are. Everything
between them is the real field.

The figures are the brightest members of that field, joined — not a layer of ornament laid
over a random scatter. Which is why the joining lines can be as faint as they are and the
shape still comes through: the stars were going to be there anyway.

**Polaris gets one extra breath of halo**, and nothing else. It is the star the whole picture
is for — Polaris is what you steer by, the Plough is how anyone finds it, and a firm that says
it guides its clients can put the oldest instrument for being guided in the sky behind the
claim. At magnitude 1.98 alone it is merely the fifth brightest thing in the frame. Nothing on
the page names it; an allegory that has to be captioned has already failed.

The pointer is not fudged. The projection puts Polaris **5.30** Merak→Dubhe steps beyond
Dubhe — the founder's own "cinco veces la distancia", to two decimals — and Merak→Dubhe
extended misses it by 2.4°, which is not an error but what the sky does. Drawing it dead-on
would be the lie. The hand-typed table this replaces got 4.4 steps, was 4.5% out on the Plough
and 16% out on the Little Dipper, and was right to be doubted.

**It sits above the scrim, and only that makes the left half usable.** Inside a plate the left
is exactly where `--hero-scrim` runs 0.86–0.94 opaque, because that is what keeps the headline
legible: measured at 1440, the brightest star of a left-placed group *in the plate* reached
**53/255** where the same star on the right reached 220. Lifting the sky out of the plates and
painting it over the scrim is what makes the left margin available at all, and it is the same
change that gave the six a common sky.

**The east fade is in the SVG, not the CSS**, because it has to follow the drawing rather than
the viewport: two multiplied masks carry the field from full strength at the left edge to
nothing before the right half, where each vertical's own subject lives by rule. The shared sky
and the vertical's picture hand over instead of arguing. The vertical mask keeps the field
from ending on a straight line at the top and bottom of the band — a star map with a visible
border is a poster of the sky, and the sky has no border.

**Below 1200px it is hidden, and that is the honest limit of the idea.** The margin is 300px
wide at 1440 and 220 at 1280; at 1024 the copy starts 92px from the edge, at 768 it starts at
20 and at 390 at 16. There is no room for a sky to be read in, and putting it behind the copy
would be exactly the prominence the brief asked it not to have.

## Regenerating them

```sh
python3 docs/design/hero-rotativo/generate.py
```

It writes `public/assets/hero/{ec,int,bd,cdn,gf,ia}.svg` — the files the site serves —
`public/assets/hero/constellations.svg` (the shared sky), `public/assets/menu/ground.svg` (the
menu panel's ground: the same cube lattice, no stars and no subject, #417) and `images.json`
next to itself for the design canvas. The RNG is seeded, so a re-run reproduces
the same bytes; change composition **here**, never by hand-editing an SVG.

The plates carry no `role`, no `aria-label` and no `<title>`: they are decorative. The `<img>`
that shows them has `alt=""` and the vertical's name sits beside it as a real link — a label in
the file would be locale-bound copy living outside the CMS, and it would announce the picture
twice.

All six together are ~62 KB gzipped (`bd` is the outlier at 26 KB — it is ~4,000 circles), and
the shared sky adds **12 KB** for 1,449 real stars, once, cached across every slide and every
page. Its glow is a single reusable radial gradient rather than a Gaussian blur per star: same
picture, and a thousand filter passes on every page of the site is not the same cost as a
paint. That
measurement is what makes six plates and a pure-CSS cross-fade cheaper than the one stock
photograph they replace, with no JavaScript involved.

## Where the code is

| Piece | File |
| --- | --- |
| Face → file map | [`src/utils/hero-art.ts`](../../../src/utils/hero-art.ts) |
| The home's rotation | [`src/components/HomepageContent.astro`](../../../src/components/HomepageContent.astro), [`src/styles/homepage.css`](../../../src/styles/homepage.css) |
| The vertical page's still plate | [`src/pages/[slug].astro`](../../../src/pages/%5Bslug%5D.astro), [`src/styles/service.css`](../../../src/styles/service.css) |
| The shared sky layer | `chart()` / `constellations()` in [`generate.py`](generate.py); `.s-hero__stars` in [`homepage.css`](../../../src/styles/homepage.css) and [`service.css`](../../../src/styles/service.css) |
| The star catalogue | [`bsc5-north.tsv`](bsc5-north.tsv) — Yale BSC5, J2000, Dec > +25, V <= 6.0 |
| The bar over the picture | [`src/components/SiteHeader.astro`](../../../src/components/SiteHeader.astro) |
| Scrim, ink and clock tokens | [`src/styles/theme.css`](../../../src/styles/theme.css) |
| The gate that measures ink over the plates | [`scripts/ci-check-a11y.mjs`](../../../scripts/ci-check-a11y.mjs) §5 |

## Previews

Captures of the built site, not mockups.

![The home](previews/home.jpg)

![A vertical page](previews/pagina-vertical.jpg)

![The home at 390 px](previews/movil.jpg)
