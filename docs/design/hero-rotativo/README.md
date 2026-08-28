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

## Regenerating them

```sh
python3 docs/design/hero-rotativo/generate.py
```

It writes `public/assets/hero/{ec,int,bd,cdn,gf,ia}.svg` — the files the site serves — and
`images.json` next to itself for the design canvas. The RNG is seeded, so a re-run reproduces
the same bytes; change composition **here**, never by hand-editing an SVG.

The plates carry no `role`, no `aria-label` and no `<title>`: they are decorative. The `<img>`
that shows them has `alt=""` and the vertical's name sits beside it as a real link — a label in
the file would be locale-bound copy living outside the CMS, and it would announce the picture
twice.

All six together are ~63 KB gzipped (`bd` is the outlier at 26 KB — it is ~4,000 circles). That
measurement is what makes six plates and a pure-CSS cross-fade cheaper than the one stock
photograph they replace, with no JavaScript involved.

## Where the code is

| Piece | File |
| --- | --- |
| Face → file map | [`src/utils/hero-art.ts`](../../../src/utils/hero-art.ts) |
| The home's rotation | [`src/components/HomepageContent.astro`](../../../src/components/HomepageContent.astro), [`src/styles/homepage.css`](../../../src/styles/homepage.css) |
| The vertical page's still plate | [`src/pages/[slug].astro`](../../../src/pages/%5Bslug%5D.astro), [`src/styles/service.css`](../../../src/styles/service.css) |
| The bar over the picture | [`src/components/SiteHeader.astro`](../../../src/components/SiteHeader.astro) |
| Scrim, ink and clock tokens | [`src/styles/theme.css`](../../../src/styles/theme.css) |
| The gate that measures ink over the plates | [`scripts/ci-check-a11y.mjs`](../../../scripts/ci-check-a11y.mjs) §5 |

## Previews

Captures of the built site, not mockups.

![The home](previews/home.jpg)

![A vertical page](previews/pagina-vertical.jpg)

![The home at 390 px](previews/movil.jpg)
