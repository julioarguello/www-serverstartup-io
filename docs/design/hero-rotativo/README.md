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

The Plough and the Little Dipper are **not** in the six plates. They are one file,
`constellations.svg`, drawn once and placed identically on the home carousel and on every
vertical page — the founder's brief, and the correct one: *"digamos que es un fondo común"*.
Six plates that each tilted the pair differently made the pair part of the picture; one layer
that never moves while the pictures turn makes it the fixed point the pictures move against,
which is what a pole star is for.

It is the plates' one piece of argument. Polaris is the star you steer by, the Plough is how
anyone finds it, and a firm that says it guides its clients can put the oldest instrument for
being guided in the sky behind the claim. Nothing on the page names it. An allegory that has
to be captioned has already failed — which is also why the layer is drawn at 0.6 opacity in a
138–184px column: found, not announced.

**The shape is projected, not eyeballed.** `generate.py` carries the fourteen stars' J2000
RA/Dec and puts them through a stereographic projection tangent to the group's own mean
direction — what a circumpolar chart uses, and conformal, so both figures keep their true
shapes. The first version was a table of xy pairs typed in by hand and it did not survive
being asked: fitted against the true projection it was 4.5% out on the Plough, **16% out on
the Little Dipper** — the bowl was the wrong shape — and it placed Polaris 4.4 Merak→Dubhe
steps beyond Dubhe where the sky puts it **5.3**. The pointer is the single most famous fact
about this asterism and the whole allegory rests on it. Nothing is placed by hand now; Polaris
comes out of the same projection as everything else, and the pointer extended misses it by
2.4°, which is not an error — it is what the sky does, and drawing it dead-on would be the lie.

**It sits in the left margin, and only because it is above the scrim.** Inside a plate the
left half is unusable: it is exactly where `--hero-scrim` is 0.86–0.94 opaque, because that is
what keeps the headline legible. Rendered at 1440, the brightest star of a left-placed group
*in the plate* reaches **53/255** where the same star on the right reaches 220 — four times
dimmer. Lifting the pair out of the plates and painting it over the scrim is what makes the
left margin available at all, and it is the same change that gave the six a common sky.

**Below 1200px it is hidden, and that is the honest limit of the idea.** The margin it lives
in is 300px wide at 1440 and 220 at 1280; at 1024 the copy starts 92px from the edge, at 768 it
starts at 20 and at 390 at 16. There is no margin left to occupy, and putting it behind the
headline instead would be exactly the prominence the brief asked it not to have.

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
the shared sky adds **694 bytes**, once, cached across every slide and every page. That
measurement is what makes six plates and a pure-CSS cross-fade cheaper than the one stock
photograph they replace, with no JavaScript involved.

## Where the code is

| Piece | File |
| --- | --- |
| Face → file map | [`src/utils/hero-art.ts`](../../../src/utils/hero-art.ts) |
| The home's rotation | [`src/components/HomepageContent.astro`](../../../src/components/HomepageContent.astro), [`src/styles/homepage.css`](../../../src/styles/homepage.css) |
| The vertical page's still plate | [`src/pages/[slug].astro`](../../../src/pages/%5Bslug%5D.astro), [`src/styles/service.css`](../../../src/styles/service.css) |
| The shared sky layer | `constellations()` in [`generate.py`](generate.py); `.s-hero__stars` in [`homepage.css`](../../../src/styles/homepage.css) and [`service.css`](../../../src/styles/service.css) |
| The bar over the picture | [`src/components/SiteHeader.astro`](../../../src/components/SiteHeader.astro) |
| Scrim, ink and clock tokens | [`src/styles/theme.css`](../../../src/styles/theme.css) |
| The gate that measures ink over the plates | [`scripts/ci-check-a11y.mjs`](../../../scripts/ci-check-a11y.mjs) §5 |

## Previews

Captures of the built site, not mockups.

![The home](previews/home.jpg)

![A vertical page](previews/pagina-vertical.jpg)

![The home at 390 px](previews/movil.jpg)
