# www.serverstartup.io — Architecture Guide

> Corporate site for Server Startup S.L. — Astro + EmDash CMS on Cloudflare Workers.

## 1. Technology Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Framework** | Astro 5.x (`output: "server"`) | SSR, routing, build |
| **CMS** | EmDash CMS | Content management, admin UI at `/_emdash/admin` |
| **Database** | Cloudflare D1 (SQLite) | CMS persistence |
| **Storage** | Cloudflare R2 (`MEDIA` binding) | CMS images and uploads |
| **Video** | Cloudflare Stream | Video hosting with adaptive bitrate |
| **Hosting** | Cloudflare Workers | SSR runtime |
| **Fonts** | Google Fonts (Alexandria, JetBrains Mono) | Astro font provider |
| **Sitemap** | `@astrojs/sitemap` | Automatic sitemap generation |
| **Plugins** | `@emdash-cms/plugin-forms`, `plugin-webhook-notifier` | Form handling, notifications |

## 2. Content Architecture

### 2.1 Principle: CMS-Driven Content

All editorial text lives in EmDash CMS. Templates contain only layout, CSS, and structural elements.

| Layer | Content |
|:------|:--------|
| CMS `pages` | Static pages (home, about, privacy, contact) |
| CMS `services` | Service descriptions with `cta_label`, `color`, `featured_image` |
| CMS `posts` | Blog articles with bylines, tags, categories |
| CMS `members` | Team profiles (name, role, bio, photo) |
| CMS `partners` | Partner logos and descriptions (e.g., Cloudflare) |
| CMS Widgets | UI labels (`ui_labels_es/en`), aria labels, CTA blocks |
| CMS Site Settings | Phone, email, WhatsApp, company name, default CTA |
| Template (Astro) | Layout, CSS, animations, design tokens |

### 2.2 Collections

| Collection | Key Fields | Supports |
|:-----------|:-----------|:---------|
| `pages` | `title`, `content` (Portable Text) | drafts, revisions, search |
| `services` | `title`, `excerpt`, `content` (PT), `featured_image`, `cta_label`, `color` | drafts, revisions, search |
| `posts` | `title`, `excerpt`, `content` (PT), `featured_image` | drafts, revisions, search, bylines |
| `members` | `title`, `excerpt`, `featured_image`, `content` (PT) | — |
| `partners` | `title`, `featured_image`, `content` (PT) | — |

### 2.3 Taxonomies

| Taxonomy | Collection | Purpose |
|:---------|:-----------|:--------|
| `category` | `posts` | Blog post categories |
| `tag` | `posts` | Blog post tags |

### 2.4 Seed File

`seed/seed.json` is the **source of truth** for initial content: schema, content, settings, menus, widgets, and taxonomies. After schema changes, always do a clean rebuild.

## 3. Internationalization (i18n)

### 3.1 Strategy: Everything in the CMS

A single editing surface for translators. No JSON files, no code-level dictionaries.

| Layer | Mechanism |
|:------|:----------|
| **Editorial content** | `locale` + `translationOf` on CMS entries |
| **UI labels** | Locale-scoped widget areas (`ui_labels_es`, `ui_labels_en`, `aria_labels`) |
| **Language-neutral** | Global site settings (phone, email) |
| **Aria labels** | CMS-driven via middleware `Astro.locals.t` |

### 3.2 Routing

- **Default locale**: `es` (no URL prefix — `/quienes-somos`)
- **English**: `/en/` prefix — `/en/about-us`
- **Language switcher**: `LanguageSwitcher.astro` — prefix swap between locales
- **`prefixDefaultLocale: false`** — Spanish pages at root

### 3.3 Middleware

`src/middleware.ts` loads locale-specific aria labels from CMS on every request and stores the `t()` function on `Astro.locals.t`. This eliminates prop drilling and global state race conditions.

### 3.4 Route Parity

All routes exist in both ES and EN:

| ES Route | EN Route |
|:---------|:---------|
| `/` | `/en/` |
| `/[slug]` (services/pages) | `/en/[slug]` |
| `/posts/` | `/en/posts/` |
| `/posts/[slug]` | `/en/posts/[slug]` |
| `/category/[slug]` | `/en/category/[slug]` |
| `/tag/[slug]` | `/en/tag/[slug]` |
| `/contacto` | `/en/contact` |
| `/quienes-somos` | `/en/about-us` |
| `/search` | `/en/search` |
| `/politica-de-privacidad` | `/en/privacy-policy` |
| `/rss.xml` | `/en/rss.xml` |

## 4. Component Architecture

### 4.1 Layout

`Base.astro` — Minimal shell that orchestrates:
- `SiteHeader.astro` — Sticky header (logo, LanguageSwitcher, hamburger)
- `MenuDialog.astro` — Fullscreen mobile navigation overlay
- `<slot />` — Page content
- `SiteFooter.astro` — the signature (#454): the mark, one line of what the house is,
  two short link columns, the funding line, the legal row. It is deliberately **not** a
  site map — the six verticals live in the menu, one tap from every page. `SiteMark.astro`
  draws the mark the way `SiteHeader.astro` draws it, as live SVG plus live mono type.
- **Funding acknowledgement.** Two official artworks, used unmodified: the EU emblem
  lockup (which already carries «Financiado por la Unión Europea - NextGenerationEU»)
  and the PRTR logo. Each `alt` reproduces what its artwork says, not a sentence of
  our own. `Orden HFP/1030/2021` art. 9.4 forbids modifying the emblem — **rearranging
  is allowed, redrawing is not**: `eu-emblem-rules_es.pdf` says the emblem's placement
  "dependerá del diseño de la publicación" and the *Libro de imagen PRTR V4* p.6 permits
  several compositions explicitly.

  This paragraph used to assert the opposite — that the composite red.es strip was one
  indivisible artefact — and recorded the resulting illegibility on a phone as
  unavoidable. It was not. The mandate on a **beneficiary** (`Orden ETD/1498/2021`
  art. 34.3) is a *set* of three things with no prescribed composition: emblem, funding
  statement, PRTR logo. The red.es, Gobierno de España and Kit Digital marks bind an
  *Agente Digitalizador adherido* in the header of its Kit-Digital pages, and this site
  has none. Server Startup is a beneficiary (founder, 2026-09-02) — and art. 34.3 binds
  **"los beneficiarios y Agentes Digitalizadores Adheridos"** in the same breath, so the
  duty attaches under either reading. The local KB's earlier note that a beneficiary
  carries no publicity duty is corrected there: it was inferred from art. 10.3.b), which
  is the *adhesion* duty, not the publicity article.

  The size floor is the **flag's**, not the lockup's: 1cm ≈ 37.8px at 96dpi
  (`eu-emblem-rules_es.pdf` p.10), whose duty that document extends to "sitios web y sus
  versiones móviles". The flag is 88% of the cut artwork, so the marks render at 46px at
  every breakpoint and the ratio travels on the element as `data-emblem-ratio`, which
  `ci-check-layout.mjs` G7 multiplies by. The composite JPEG rendered the emblem 18.2px
  tall at 390px.

  There is a second size rule, about *relative* size, and three sources set it at three
  strengths. `Orden HFP/1030/2021` art. 9.4 binds the emblem to appear "al menos de forma
  tan prominente y visible como los otros logotipos" — equal heights already met it. The
  `Guía de Justificación — Sitio Web y Presencia en Internet` V5, which is the document
  red.es asks a compliance **screenshot** against, goes further and *recommends* the
  emblem be "como mínimo, un 30% más grande que el resto de los logotipos"; the Enero 2022
  identity manual makes that same ratio binding, but only for cartelería. Meeting the
  strictest of the three costs one declaration, so the emblem renders at **62px** against
  the PRTR logo's 46px — 1.35× on the artwork, 1.33× on the ink inside it, flag at 54.6px
  ≈ 1.44cm. `ci-check-layout.mjs` G11 holds the ratio; G7 still holds the absolute floor.
  Full audit (local KB): `docs/company/10-kit-digital.md`.

  **Integrity, not just size (#472).** G7 and G11 both measure how big a mark renders.
  Neither can see the other half of the same obligation: the artworks may be **scaled and
  nothing else** — no recolouring, fading, rotation, cropping, filter or overlay. That is
  the emblem's own usage rules and the *Manual de Identidad*, and art. 34.3 makes carrying
  them correctly an obligation rather than a courtesy; art. 38.4 prices a publicity breach
  at 10% of the awarded aid. **G12** holds it: no rule whose selector names
  `footer-funding` may declare `filter`, `opacity`, `transform`, `rotate`, `scale`,
  `translate`, `clip-path`, `mask-image`, `mix-blend-mode` or `text-decoration-line` at
  anything but its identity value.

  G12 reads the **stylesheet**, not the rendered page, and that is the whole design. The
  plausible way this breaks is somebody giving every footer image a tasteful hover — and a
  `:hover` rule that fades a mark is invisible to any measurement of the page at rest. It
  was verified against exactly that: a `.footer-funding__mark:hover { opacity: .6;
  transform: scale(1.03) }` added to `SiteFooter.astro` and shipped through a real build
  is reported on both locales; every geometry assertion in the file stays green.

  The walk carries its own proof, because the first attempt at this gate (#470, closed
  unmerged) was blind and its control still passed. CSS Nesting gives **every**
  `CSSStyleRule` its own `cssRules` — an empty list when nothing is nested, and truthy —
  so the obvious `if (r.cssRules) { walk(r.cssRules); continue; }` walks past every
  ordinary rule in the sheet: 222 top-level rules, 14 reached. G12 therefore reads
  declarations *before* recursing, and counts the style rules it actually read against the
  number each sheet declares at top level. Counting rules *visited* would not do — the
  wrong shape still enters all 222 and reads none, scoring a perfect 222 of 222. Today:
  **534 style rules read across 8 sheets, 406 of them at top level, none walked past, 3
  selecting a mark.**

### 4.2 Shared Components

| Component | Purpose |
|:----------|:--------|
| `HomepageContent.astro` | Shared homepage layout (ES/EN wrappers are thin) |
| `CloudflarePartner.astro` | Featured partner card |
| `CtaGlobal.astro` | Locale-aware CTA block from CMS widget |
| `PostCard.astro` | Blog post card with image, tags, bylines |
| `TagList.astro` | Tag pill list |
| `LanguageSwitcher.astro` | ES ↔ EN toggle |
| `PtLink.astro` | Whitespace-safe Portable Text link mark (single-line `<a>`; EmDash's default emits spaces inside anchors, breaking lines before punctuation). Supports `blank: true` markDefs (`target="_blank" rel="noopener noreferrer"`). Pass via `components={{ mark: { link: PtLink } }}` — adopted on the About pages, candidate for site-wide use. |

### 4.3 Shared CSS

| File | Used by |
|:-----|:--------|
| `styles/theme.css` | **The only** declaration of colour, radius, shadow and spacing (design tokens), plus typography. Every other sheet consumes tokens — enforced by the `ci-check-design-tokens.py` gate. |
| `styles/homepage.css` | Homepage layout |
| `styles/service.css` | Service detail pages |
| `styles/archive.css` | Category and tag archives |
| `styles/posts.css` | Blog listing pages |
| `styles/post-detail.css` | Blog post detail (617 lines) |
| `styles/about.css` | About page |
| `styles/contact.css` | Contact page |
| `styles/search.css` | Search page |

### 4.4 The radar hero of the edge-security vertical (#529)

The CDN page opens with a scene instead of a held plate: a photograph of the Cabo Peñas
lighthouse, cut out to the building, on a dark band that is not black, crossfades into a line
drawing of the same building, and a radar screen settles behind it — range rings read from the
origin outwards (ORIGIN · CDN · WAF · ACCESS · ZERO TRUST), a sweep at 12 rpm, a stream of
edge events, and the visitor as one echo. The lighthouse stands at the edge and lights what
approaches; it is the counter-image of the castle-and-moat perimeter, which is why the epigraph
under the CTA carries Cloudflare's own sentence about the castle, signed «— Cloudflare» with the
source behind the name.

The band (founder, 2026-10-01, after four rounds of static prototypes measured for contrast):
`--color-ground-dark` (#232724, "un negro menos negro") drifting from the column's right edge
toward `--color-ground-haze`, the tone the cutout's own edge pixels average to, so the photograph
lands on a kindred colour instead of a halo; the logo cube as one large seal in the section's
colour, leaving by the left margin; the copy in paper, at the column's full width and the
register every hero shares. A light version (the band tinted with the vertical's colour) and a
version with the cutout soft-edged were built and rejected: the soft edge kept real sky inside
the mask, which on any dark ground lit up as a glow around the tower — no gradient could hide
it, only the tight silhouette did.

Decisions that are not obvious from the code, and the measurement behind each:

- **Every piece of text is HTML, positioned in percentages of the drawing's frame, never text
  inside the SVG.** SVG text scales with the box: the ring labels rendered at 3.8 px on a
  393 px phone and 8.8 px on a 1440 px laptop. The overlay (`.radar__hud`) shares the plate's
  geometry, so a label at `left: 41.97%; top: 27.31%` lands on its ring at every size — on
  phones the box must be exactly the contained image (`left: 11vw; width: 78vw`) or the
  percentages drift off the rings.
- **The sweep is a rotated `conic-gradient` div, not a transform on an SVG group.** A CSS
  transform on an inline-SVG `<g>` re-runs style, layout and paint every frame (1 440 layouts
  per 10 s measured in Chrome); the div composites on the GPU.
- **Pause reaches everything.** `animation-play-state` is not inherited and never reaches a
  `setInterval`, so the home's checkbox pattern alone would leave the sweep turning and the
  events arriving: the component's script owns start/stop and also stops on `visibilitychange`
  and under `prefers-reduced-motion` (which renders the end state with one still event per
  zone). **Beside the pause, a replay** (founder, 2026-10-01): back to the photograph and through
  the sequence again, the pause released and the feed cleared — the class is removed, a reflow
  forced, the class re-added, or the CSS animations never restart. Where a pointer can hover the
  two controls wait at 35 % until the band is hovered or one has focus; on touch devices, which
  cannot hover, they stay at full strength under the art. Under reduced motion the replay is
  hidden: nothing moves to replay. **Pause freezes the frame
  where it is, and play goes on from there** (founder, 2026-10-04: pausing used to jump to the end of
  the opening): the CSS stops on `animation-play-state`, and the timeouts that end the opening or start
  its text run on `SceneClock` (`src/utils/scene-clock.ts`), which keeps what each has left. A pause rule
  must out-rank every rule that sets the `animation` shorthand, which resets the play state.
- **The copy is in front, the drawing stays behind it** (founder, 2026-10-01: "no que la imagen
  desapareciera"). The veil under the column is the ground at 78 %, not solid: the rings and the
  house's left half show through dimmed, and from 40 px before the column's right edge it is
  gone. Measured at 78 % at 1024, 1440, 1865 and 2560, percentile 1: body 9.5–10.7:1 over the
  drawing, 9.6–10.7 over the photograph; the epigraph 6.0–9.7. Lighter is not available: the
  sweep's leading edge is the section colour at full strength, and under paper text at 65 % it
  measures 3.6:1; the drawing *in front* of the veil, lines at full orange under the paragraph,
  would be 1.7:1. Events spawn only within the rings' reach (the leftmost zones end at the
  1260-unit ring), so none appears where there is no radar.
- **The frame is sized by the band's height, never taller than it** (88 %, what 48 % of a
  1440 × 900 viewport gave), and placed by the column — its left edge 10 px past the column's
  right edge, pulled back by 58 % of its own width so the tower starts just past the copy. A
  width-sized frame overflowed the band on a wide, short screen (3318 × 783, the founder's) and
  showed one fragment of the house, hugely enlarged, with the echo on the title.
- **Nothing is written over the building, the copy or the band's edge.** Events pick a
  candidate in one of five frame zones and then check it against the page — the copy's box, the
  building's rectangle in frame coordinates, the ring labels, the visitor's echo and the band's
  edges — because the frame sits differently at every viewport now that the copy spans the
  column; a candidate that fails is redrawn, up to forty times. Two zones on phones; labels at
  most 24 characters; no two live events within 6 % vertically.
- **The title is one line on any desktop**, and so is every other hero's: one register in
  `service.css`, sized by the longest title the CMS holds, guarded by the a11y gate at 768 and
  1440 (`docs/design-system.md`, Typography).
- **The visitor's echo is fetched by the browser** from `/api/whoami` (`no-store`,
  `cf-connecting-ip` + `cf.city`) and hidden unless the edge answers. Service pages are cached
  at the edge for an hour (§9): an address rendered into the HTML would be served to the next
  visitor. The privacy policy names this processing in both locales.
- **Chrome strings are CMS labels** (`panel_labels` → `radar_*`), English in both locales as a
  machine voice, like the PR card. The quotation is CMS content: the service body opens with a
  `blockquote`, which the page hands to the hero and withholds from the instrument
  (`partnerInHero`), so the instrument's intro renders as plain paragraphs.
- **Only the CDN face.** `heroRadarForSlug()` keys on the face like the plates do, so both
  locale slugs render it and the other five verticals keep their plates untouched.
- **Timing is the founder's ear, not a rule**: the reveal takes `--radar-t`, 8 s like every opening
  (founder, 2026-10-04: "muy rápido"; it was 5 s); then one event every 0.52 s, each alive 2.4 s. The reveal only runs once per page
  load; this hero is not a carousel slide.
- **Assets** live in `public/assets/hero/` like the plates (R2 is not seedable): the photograph
  as WebP with alpha at 1320 px (142 KB, the tight cutout) and the plan as lossless WebP
  (156 KB), each with a phone variant (720 px, 48 KB; 660 px, 82 KB) picked by `srcset` with
  `sizes="(max-width: 700px) 78vw, 43.4vw"`. Credit and licence (CC BY-SA 4.0, derivative
  drawing included) in `docs/design/hero-rotativo/README.md`.
- **What the gates demanded, measured on the first CI run** — the next vertical with a photo
  hero meets the same three:
  - *perf*: Lighthouse's mobile run (412 px, slow 4G) scored 0.85 with the full-size pair as the
    LCP. The phone `srcset` is what fixed it (0.95, three runs, e-commerce control 0.96).
    Fetching the plan from a `load` handler was tried and dropped: Lighthouse simulates the
    throttled network from the observed request graph and cannot see a time dependency a
    script introduces, so the deferral measured the same (0.93–0.96) while adding a code path.
  - *rendered copy*: the visitor echo and the event feed declare `data-volatile`, which
    `copy-baseline.mjs` drops before reading the page. Wrangler fills `request.cf` from the
    machine's own address, so the echo said "Bilbao" on the laptop and "San Jose" on the runner.
  - *a11y*: the hero-band pixel pass counts `.s-hero__plate` and finds none here; it treats a
    `.s-hero--radar` as one plate frozen in its end state (tightest 15.2:1 on the h1).

### 4.5 The shared scene and the bridge hero of the integration vertical (#531)

Since #531 every vertical opening is one structure. `HeroScene.astro` and `hero-scene.css` carry
the band, the haze, the veil, the seal cube, the epigraph, the controls and the copy, anchored to
a 320 px reference block so the cube and the h1 sit in the same place on every page. **The band is
the same on every vertical, haze included** (founder, 2026-10-03: "todos los verticales mismo fondo y
layout", non-negotiable): no scene sets `--color-ground-haze` of its own. The bridge carried a warm
grey from its banks plate (#817975) and the AI scene drifted toward its colour until that day; both
went back to the one haze. **And the art always reaches the band's right edge** (founder, 2026-10-03:
"no hay margen a la derecha en el faro y en el puente colgante sí"): the radar's rings and the AI frame
already ran off it; the bridge, anchored by its Las Arenas tower just past the column, left 71–451 px of
empty band (1280–2560). It now runs off the edge by `BLEED` (4 % of the frame, half the banks' fade).
**One framing for every photograph** (#553, founder 2026-10-05: "la de integración queda totalmente
descolgada"): what shows of the frame is 86 % of the band's height (the machine's eye keeps its 81 %: at 86 %
its brackets around the tug are withheld, and the founder approved that scene as it is), resting on the
band's floor, running off its right edge and lying under the copy's veil where it is wide enough to. The bridge used to shrink and drop
until no tower and no label touched the copy, which left it a low strip; now it fills the band like the
museum and the warehouse, its connectors still keep off the text (they are placed against the copy's
measured lines), and the Pac-Man and the reduced-motion ghosts run between the outer connectors rather
than tower to tower, since the girder's left end now passes under the copy. The lighthouse is the one
cut-out: its radar's rings and plan are what fill its band.
**One clock and one grammar for every opening** (#553, #558): 0–2 s the photograph alone (`--beat-draw`);
2–4.5 s the transformation (the drawing, the machine's view, the night), complete by `--beat-drawn`; 4.5–7 s
the payoff (the radar and its events, the connectors and their messages, the reading, the order's cube);
**at rest by 8 s — nothing loops past the end** (founder, 2026-10-05: "que se paren todas"); replay is the
way to see it again. Declared once in `hero-scene.css` and mirrored by `SCENE_BEATS` in `hero-art.ts`. Until
#558 three openings never stopped — the lighthouse's sweep turned forever and its events began only after
the end, the bridge's messages and Pac-Man ran forever, the machine's listing walked and MATCH blinked
forever — and two kept beats of their own (the eye at 3.8 s and 5.2 s, the cube at 4.2 s). Now: the
lighthouse crosses to the drawing by 4.5 s (25 %/56 % of `--radar-t`), the radar is in by 5.3 s, its sweep
turns once to 300° and its events run from 5.3 s to 7.4 s, then one still event per zone holds (the reduced-
motion picture); the bridge's connectors come at 4.6 s, its messages and Pac-Man at 5 s, no new message
after 7 s, and at 8 s three ghosts stand on the girder with the Pac-Man still; the eye builds at 2 s, the
reading types at 4.5 s, the listing walks to 7.4 s and MATCH blinks three times; the cube rises at 4.5 s and
lands on the seal at 7 s. The epigraph stops short of the column (`--measure-epigraph`, 620 px): at the
column's width it ran under the art, into the lighthouse's labels. **On phones and tablets nothing written spills off the
photograph or under the controls** (#558, founder: "parte de las letras salen fuera de la imagen"), measured
on all six at 360, 390, 430 and 768 px with device emulation: the machine's readout and listing sit inside its
photograph (the frame is 120 % of the row, the ship's bow cropped, as the other scenes crop — at 98 % the sky
over the tug was 67 px for an 84 px readout); the lighthouse withholds a ring label the stage's edge would cut
(only where the stage clips: on desktops it does not); the bridge's names keep off the controls on phones too
("Cloud Storage" stood behind the replay button), and those under the girder, which stand on the photograph,
carry the band's dark as a halo. The AI frame does the same from 2560 up (`BLEED`, 2 %), and its left edge, which then lies under
the copy, fades over 14 % of the frame instead of 60 px. A vertical brings its art through two slots (`under` the veil, `over`
it), its own script, and an entry in `HERO_SCENE` (`src/utils/hero-art.ts`). The radar (§4.4) was moved onto this base. The veil is a
per-scene token (`--scene-veil`, 78 % by default). **On phones and tablets (≤ 1100 px) the first screen is the screen** (#543): one `100svh` box — title,
excerpt, CTA, then the art in its own row taking what is left, the controls in its corner — and the
epigraph follows it. The rule, the measurements behind it and the options the founder weighed are in
`docs/design-system.md`, "The opening of a vertical". The epigraph is every blockquote the service body
opens with; consecutive quotations by one author stand one after the other under a single attribution,
linked to the first one's source (#537). They never take turns: the founder rejected a rotation
("el que baile no me gusta").

The integration page opens on the Vizcaya Bridge between Portugalete and Las Arenas. First the two
banks, from a photograph with the bridge and the sky taken out. Then the bridge, whole, as a
drawing. Then what plugs into it, because the bridge is the bus:

- Protocols stand above the girder (`panel_labels` → `bridge_plugs_up`). Platforms and Google Cloud
  services stand below (`bridge_plugs_down`). Each one has evidence in the company's own code.
- Messages travel along the girder in the six verticals' colours, read from the CMS in cube order.
- The epigraph is Hohpe & Woolf: «Interesting applications rarely live in isolation.»

How it is built (`HeroBridge.astro`, `hero-bridge.css`):

- **The drawing** (`int-puente-trazo*.webp`, `docs/design/hero-rotativo/bridge_plan.py`) is FLUX.2
  redrawing an edge sketch of the original photograph's bridge, so it lands on the real one. It
  sits in front of the veil in a red beside the section's, ramped from 35 % at Portugalete to
  full at Las Arenas, and is cut to the band its ink occupies, so it is never the LCP.
- **The outline** (`bridge.py` → `src/assets/hero/int-puente.svg`) is never drawn. Its structure
  ships as path data, and the script keeps it under the title and the excerpt and off every
  connector's name.
- **Placement** runs in the stage's own pixels, measured in the same task as what it is compared
  with; a reload restores the scroll between tasks. The frame is sized by the band, starts after
  the seal, and rises from the band's floor as far as one protocol still fits under the excerpt.
- **Resizing** refits the frame on every animation frame. The connectors hide and are placed again
  when the window stops.
- **Connectors** stand only between the towers' inner legs, on five staggered stem heights. Their
  names are a light grey, never louder than the copy. Messages move at 110 px/s.

### 4.6 The hero photographs (#531)

The hero photographs are restored, not graded (`docs/design/hero-rotativo/photo_restore.py`):

- **Detail:** SeedVR2 3B, a faithful restorer, run locally at 2× with its colour lock on.
- **Colour:** the cast measured on the scene's own whites is removed, and nothing else. The
  bridge's whites were yellowed (b = +8.6 in Lab).
- **Invented text:** where the restorer invents text (the tanker's name), the original's pixels
  stay.
- **Serving:** each `srcset` gains a large candidate for double-density screens, and every
  replaced file gets a new name so no browser keeps the old one.

The founder rejected a grey grade, classic grades, AI relighting and the 7B model along the way;
the reasons are in #531 and in the hero rule.

### 4.7 The machine's eye of the artificial-intelligence vertical (#537)

The AI page opens on the tanker and the escort tug that pass under the Vizcaya Bridge in the
integration hero, cut from the same photograph, one level closer: the same river. The tanker sails on
its own engine with its own crew; the tug follows astern and lends its force where the river is hard,
when the ship's bridge asks — a complement, not a substitute, which is the page's thesis. The scene
reads it three times: the photograph; the same frame as a machine sees it; the machine's reading.

- **The machine's eye is a homage to the Terminator's HUD that starts in the section's violet and ends in
  the film's red** (founder, 2026-10-03: "no quiero perder el violeta … se va haciendo rojo cuanto más a
  la derecha"). The CMS palette is untouched: the cube, menu and accents keep the violet, and the red
  (`--color-machine-red`, #E0141E) lives only in the frame's tint. The gradient holds violet as a tint
  at the frame's left edge (to 8 %) and is the red, whole, by a third of the frame (32 %) — it held violet
  to 18 % and reached red at 48 % until the founder asked for "menos protagonismo al violeta… más fuerza al
  rojo, sin pasarse" (2026-10-05, #553): the reticle, the
  tug and the whole reading are red, as the founder marked on a capture. In
  OKLCH so the passage goes through magenta rather than mud. A full palette change (AI red, integration
  in the bridge's RAL 3005 wine) was mocked on the real pages and set aside. It is CSS on the one
  photograph — the film's hard tones (`#vision-tones`) + the gradient laid over in `mix-blend-mode: color` — so
  there is no second raster to download or to become the LCP. At full strength the violet saturated
  the highlights; the approved prototype was lighter and greyer.
- **The tanker's stern carries our lettering** in both hero photographs — SERVER STARTUP, AVILÉS,
  YULO 11062024, a homage of the founder's to his father (`stern_label.py`: the original letters
  inpainted out, the new ones rendered at their cap height, centre, condensed width and light). Every
  file carrying it has a new name (`ia-remolcador-aviles*`, `int-puente-aviles*`).
- **No seam between the frame and the band** (founder, 2026-10-03, the lighthouse's lesson): wherever
  the frame ends before the band does, its edge fades into it — the right edge on wide screens (2560,
  3440: `--vfade`, 14 % of the frame's width), the foot where the scene is its own row (`--vfade-b`, 14 %
  of its height); the left edge already fades from the seal and the top from its own 18 %.
- **The sequence is three beats** (founder, 2026-10-02: "imagen original · foco + color · letras"): the
  photograph held 3.8 s (8 s in all, like every opening); then the machine's view, built the way the film's "Termovision" was printed.
  Ernie Farino, Cinefex 21 (April 1985): "a solarization type effect … extrapolate that into
  high-contrast black-and-white images. By making negatives and positives at different exposures, the
  image would swell or shrink slightly … a combination of black, red and white tonal areas for the
  background, over which we burned in — on a separate exposure — the animated computer readout
  graphics." So the view is a layer (`.vision__eye`, the same file: no second download) under two SVG
  filters: `#vision-hicon` (two tones) for one pass, slightly swollen, then `#vision-tones`, a steep curve
  (deep black, near-white highlights) with the violet-to-red gradient laid over as colour; three steps in
  0.36 s. No monitor lines: a still of the film (Hackaday, 2024) shows none. The reading follows the film
  too: white, burned in with a slight glow, no plate, typing itself character by character from 5.2 s
  (the characters keep their room, so nothing moves); in the film's faces as far as a free licence allows
  (fontsinuse.com): Bessellen for the captions, whose one free recreation is non-commercial, so Saira at
  112.5 % width; Letter Gothic for the listings (Apple II code printed on a daisy wheel), so Inconsolata,
  drawn after it — both OFL, self-hosted, subset to 6 and 19 KB. Four flat tones were tried and lost the
  picture. A focus pull, a plain cut and blinds were tried
  and rejected on the way;
  then its whole reading in one cut at 5.2 s (an earlier round joined colour and text in one cut;
  piece-by-piece entry was rejected before that). From then on the
  text moves, as the film's code listings
  scroll "all the while" (Hackaday, 2024: 6502 listings from *Nibble*, 1984). The listing rolls a line
  every 1.2 s, its numbers climbing, and the readout's `write` turns from "on review" to "signed"
  (`panel_labels` → `vision_signed`) each time `sign()` comes through. The pause freezes it, typing included.
- **The reading** (`HeroVision.astro`, `hero-vision.css`): a reticle on the tanker, the tug bracketed,
  MATCH, a readout whose mission is set by people (`mission: assist`, `replace: denied`,
  `override: bridge`), and the page's own flow as code (`await review(bridge)`). Strings are
  `panel_labels` → `vision_*`, English in both locales as a machine voice; the layer is
  `data-volatile`, since what fits depends on the viewport.
- **Placement in the stage's pixels, withheld rather than moved onto the copy.** The frame is sized by
  the band and rests on its floor, the tug's bow 50 px past the column. Where the band is too narrow
  for the tug beside the column the frame shrinks to fit, down to half its size; below that (tablets)
  it keeps its size and the HUD pieces that would touch a letter are withheld. The reticle locks on the
  tanker — the name on its stern first, then up the right of its superstructure — shrinking to 65 %
  to fit the gap between the excerpt and the epigraph; MATCH sits on the ship's side of it, never by
  the tug (founder: it read as a match on the tug). The ship's bridge always sat beside the title.
- **The epigraph** is two of Martin Fowler's, one after the other, verified verbatim on
  martinfowler.com and translated by us: organisations are responsible for everything their agents do
  (Fragments, 2026-09-08); the acceptance criteria cannot be outsourced (2026-07-13).
- **Measured** (2026-10-02, local build): LCP is the photograph — `ia-remolcador-aviles-2016.webp`
  at 1575 × 791 DPR 2, the 720 px file (87 KB) on a 412 px phone at 1.75; the a11y gate's tightest hero
  contrast is 7.4:1 on the excerpt; reticle and MATCH show from 1024 px up and on phones, the whole
  HUD from 1920; on tablets in portrait the HUD is withheld.

### 4.8 The Guggenheim's elevation, the greenfield vertical (#547)

- **Three beats in 8 s, like every opening** (founder, 2026-10-03/04): the plot without the museum in
  black and white, held 2 s; the museum drawn as an architect's elevation over it, complete by about
  4.5 s on the openings' clock (#553; each line's delay was stretched × 1.8, to about 6 s, out of step with
  the others), held whole; the photograph from 5.6 s, and the drawing goes by 7 s. The same time as the others ("misma o similar
  duración en todos"); a 5 s round read "muy rápido", and every opening moved to 8 s with it.
- **Karpathy's epigraph** (founder's choice, 2026-10-04, after rejecting Gehry, Brooks, Brand and Gall
  for something recent on why custom pays off against a SaaS): "[AI] empowers trained professionals to
  write a lot more … software that would otherwise never be written" — Andrej Karpathy, *2025 LLM Year
  in Review* (2025-12-19), verified against the post. The subject in the original is vibe coding and
  the elided words are "(vibe coded)": the page argues for discipline, so neither is quoted. The ES is a
  translation.
- **The plot is a reconstruction, said so in the credits.** No free-licence photograph of Abandoibarra
  before 1997 from this side was found (Commons categories, geoEuskadi orthophotos are aerial); the
  founder chose this frame with the museum removed (FLUX inside the silhouette only).
- **The drawing is a technical elevation, never a sketch** (founder: "¿por qué a mano alzada? profesional"):
  horizon and two vanishing points with rays to the building's corners, construction lines at the roof
  levels, axes A–H dash-dot with bubbles, the ground line heaviest, the profile heavy (the photograph's own
  outline, so it is exact), inner edges fine, then the dimensions — the height to the highest point and
  the chain between the axes, extension lines with a gap, 45° ticks. Line weights follow the convention
  (archimash, portico). The height says 50,00: the sources say "más de 50 metros" (WikiArquitectura;
  Bilbao Metrópoli). Words come from `panel_labels` → `elev_*`.
- **Vectors, timed by CSS**: `gf-alzado.svg` (generated by `docs/design/hero-rotativo/guggenheim.py`)
  gives every line `pathLength="1"` and its start as `--d`; `hero-elevation.css` draws them. Rejected on
  the way: the aerial orthophoto story (1989 → 2023), a tape collage (the founder's reference, then "no me
  gusta nada"), a hand-drawn pencil look, and a 12–19 s sequence.
- **Read like the lighthouse, not like a trace** (founder, 2026-10-04, comparing them: "casi no se ven"):
  the plot is knocked back under the drawing (a quarter, blurred 2 px), as presentation boards knock the
  photograph back; the line work takes four weights (3 / 2 / 1 / 1 at half: Go Media's architectural
  illustration); the inner drawing is the redrawing's own ink, as the lighthouse's plan is
  (`gf-alzado-tinta.webp`, white on alpha, tinted by `--color-elev-line` through a mask and revealed stroke
  by stroke along its skeleton) — the vectorised skeleton drawn as lines read as a noisy trace. The ink is
  fetched when the opening starts (800 px below 1100), never alongside the plot, the LCP.
- **The photograph is restored** like the others (§4.6): SeedVR2 3B at 2×, the whites' cast removed
  (a −0.3, b +2.1); the plot is built on the restored frame. The photographer's mark is painted out with
  the surrounding water's light (inpainted at an eighth of the size) and the ripples of the strip beside
  it: copied as they were, they left a darker patch.
- **Open**: the left half of the drawing under the copy's veil.

### 4.9 The warehouse's stock and your order, the e-commerce vertical (#551)

- **Four beats in 8 s, like every opening** (founder, 2026-10-04/05): an automated warehouse, robots on the
  rails of its grid ("Ocado warehouse bots.jpg", Techwords, CC BY-SA 4.0); a lid lights up on every cell, in
  a wave from the order's cell, the whole wave in 0.7 s (the stock: under the rails every cell holds a stack of
  bins; a 1.6 s wave "se me hace un poco bola"); one bin rises
  out of its cell as a **perfect cube**, the logo's 2 × 2 split showing on its faces as it leaves (in the
  section's blue lightened: the founder, 2026-10-05, "no las pongas en negro, destacan mucho"), turns until it
  is seen exactly as the logo draws it, and flies to the band's seal, which lights up. A round that composed
  the whole logo in place (plates and all) was rejected the same day. Rejected on the way: the Encants plan view, the port of Avilés (no free
  photo of containers there), container ships (neutral ones and our own tanker loaded by FLUX), the arcades
  of calle Galiana, a six-colour puzzle cube, and a high-angle AutoStore grid (sharper but not the look).
- **Ken Murphy's epigraph** (founder's choice, 2026-10-05, after rejecting a dozen on speed, clean core and
  Amazon): the customer is served "wherever, whenever, and however they want to be served" — Tesco's chief
  executive on the 2025/26 results call (April 2026), verified against the transcript; the ES is a
  translation, both trimmed with an ellipsis. Chosen as the twin of a client's own line (Alcampo's director
  general, June 2026), which the founder wanted said by someone who is not a client.
- **Measured on the photograph, never placed by eye** (`docs/design/hero-rotativo/ocado.py`): the rails'
  vanishing point (1416.9, 588.4) by least squares over Hough segments; no roll (the slats are level); the
  focal length, 5,700 px, from the 70 mm on the sensor scaled to the file (the columns lean too little to
  measure it); the camera's height, 1.40 cell widths, fitted to the rail spacing, which the model then
  predicts within 3 % at two depths (979 vs 958 px, 597 vs 611 px). Lids too flat to read (under 4 px deep)
  are left out: towards the horizon they merged into solid wedges.
- **The cube is computed, the browser plays it**: `ec-pedido.json` holds 91 frames projected through the
  same camera (rising out of its cell, clipped at the floor; then turning 45° and tilting to 35.26°, the
  isometric elevation), and the turned cube's seven points in the seal's order (T, UR, LR, B, LL, UL, the
  centre of the Y); each frame also carries the 2 × 2 split's segments, clipped at the floor while the cube
  rises, and during the flight the split is rebuilt from the seven points as SiteMark draws it (the lines
  through the midpoints of each face's sides). The script interpolates those seven to the seal's own on desktops, its stroke moving
  from white to the seal's colour and width so it lands as the seal; where the scene is its own row the
  stage clips, so the cube stays and draws itself as the seal does. The loop runs on rAF only while the
  opening plays and stops at its end: pause holds it with the CSS (SceneClock for the timer).
- **Where the cube rises**: cell (1, 9), in front of the second robot, so it falls at 69–93 % of the frame,
  past the copy's column (the frame's `ORDER` fraction plays the elevation's `TOWER`), and the nearest
  robot stays visible.
- **The photograph is restored** like the others (§4.6): SeedVR2 3B at 2×, the whites' cast removed
  (a +1.2, b −0.5); the Ocado mark painted out of the three robots where it reads (inpainting on their flat
  panels). The ceiling is cropped: the frame is 1.85 wide.
- **The pause control's label is no longer `aria-hidden`** (all four scenes): W3C Nu rejects `aria-hidden`
  on a label bound to a control, and it only came to light here because `/en/e-commerce` is one of the two
  pages the a11y gate sends to Nu. The input's `aria-label` names the control.

### 4.10 Night over the Teide Observatory, the Big Data vertical (#556)

- **Dusk falls, and the medallion is born in the sky** (founder, 2026-10-05, sixth round): three
  robotic-telescope domes at Izaña, the sea and an island on the horizon ("Teide Observatory 2018 077.jpg",
  Mike Peel, CC BY-SA 4.0). On the openings' one clock: the photograph alone until `--beat-draw`; then dusk,
  from left to right at an even pace, a front whose soft edge is a third of the photograph wide (so the dusk
  is seen to fall, not wiped in), complete just past `--beat-drawn`; the domes keep their light (the night is a
  canvas under the veil with their silhouettes cut out); as the dusk reaches each dome a layer of stars is born
  in the sky over it — bronze, silver, gold, one after the other, each dome sending a soft beam up to its own;
  then the payoff, thick dots running along the links; at rest by 8 s, the finished sky staying. Each layer is
  named (`sky_bronze`, `sky_silver`, `sky_gold` in `panel_labels`).
- **Joe Reis's epigraph** (founder's choice, 2026-10-05): «Data models tend to evolve more slowly than code,
  and the impacts of poor data models are sneaky. You won't know you're in danger until it's too late. So, take
  the time to do things right. Move slowly to move faster and safer over the long haul.» — *Practical Data
  Modeling*, May 2025, verified against the post; the ES is a translation. Chosen over his own line on AI
  generating "a working pipeline" over garbage semantics, which on its own says how it goes wrong and never
  how to do it right ("nosotros lo hacemos bien").
- **Consolidation, not a neural network** (the founder asked whether the comparison held; it does not: a
  network mixes everything and learns weights — that is the AI vertical — while the medallion refines): ten
  raw stars, bronze; four clean ones, silver, each gathering its own group of bronze; two that matter, gold,
  each gathering its own group of silver. Every star reads from its own group (each star feeds its nearest in
  the next layer), never all to all. The stars are round, with a soft halo. All of them are in the photograph's
  sky, never on the copy; where the copy covers all of a band's sky (a lower frame, as at 1440 × 900), that
  layer climbs into the night above the photograph, under the header. Frozen from outside (the a11y gate sets
  `is-done`), the scene jumps to its end state (the excerpt then measures 8.9:1).
- **Six rounds**, each rejected for its execution, never for the message: a graticule with thousands of
  detections and a test sweep; regular columns over the domes, all three layers in 2.5 s ("va mega rápido…
  una horizontal muy estrecha… la perfección no existe"); scattered stars above the title and down the right of
  the copy, partly off the photograph and read top-down; the three layers in the band under the copy, over the
  ground; a network born behind a narrow front, with the domes drawn as elevations and a failing red star
  ("se quedan un rato enorme esperando y luego va a toda hostia"; the profiles dropped; "la estrella roja, no sé
  qué coño es"; "¿estrellas cuadradas?").
- **Rejected for Big Data**: El Molinón with match statistics (data laid on the photo is a TV graphic, not a
  drawing of the place, and a derby), the El Musel bulk terminal, El Molinón's stand as a table. No free
  photograph shows the observatory, the Teide and the sea together (about 170 checked on Commons and
  Openverse; the IAC's gallery is non-commercial only).
- **Measured on the photograph** (`docs/design/hero-rotativo/teide.py`): the domes' silhouettes — GrabCut cut at
  the plinth, the walkway's rail removed, the shaded shell filled by its hull, smoothed — which keep their light
  in the dusk and set each layer's band. The stars go through the camera fitted to the photograph: the focal length, 8,795 px, from the EXIF's 39 mm over
  the file's focal-plane resolution; no roll (the doors' edges are vertical); the pitch, 5.3° down, from the
  sea horizon at row 1130, 1.43° under the true horizon from 2,390 m.
- **The band is the sky at night**: the night is a layer under the veil the script moves (`--night-x`,
  `--night-a`); the drawing is one canvas over the veil, the whole stage, with a hole for every line of the
  copy, the CTA and the controls, measured on the page and erased whole after drawing — nothing behind a
  letter, not even dimmed (erased, not clipped: the padded lines overlap, and an even-odd clip paints the
  overlaps back) — and a fade in past the seal.
- **The whole photograph** (1.5 wide) is shown, so the left dome clears the seal; where the band is narrow the
  frame shrinks before the dome goes under it, and on phones it is no wider than keeps the dome in.
- **Played, not animated in CSS**: one rAF loop draws everything from the clock and stops at the end, the
  finished network drawn once more as it rests; pause holds it (SceneClock for the timer). The colours are tokens (`--color-sky-line`, the section's navy lightened
  to read at night; `--color-sky-bronze`, `-silver`, `-gold`), read by the canvas through hidden inks.
- **The photograph is restored** like the others (§4.6): SeedVR2 3B at 2× on the photograph scaled to 2304 px;
  the whites measured on the domes only — the haze over the sea passed for white and taking it out (b −10.6)
  greyed the sky; on the domes it is a +0.9, b +3.4. The operator's logo is painted out of two doors.
- **No service page opens with a plate any more**: the layout gate's plate example (Big Data since #551) is
  gone; its photographic routes are the two homes.

### 4.11 The home's voyage (#560)

The home's band rotates through the six verticals' **photographs**, never their openings: the
animations belong to each vertical's page and would spoil it (founder, 2026-10-05). The order
tells one story, *from the coast to the stars* — the Cabo Peñas lighthouse, the Vizcaya Bridge,
the tug under it, up the river to the Guggenheim, the warehouse, night over the
Teide — and is `HOME_VOYAGE` in `src/utils/hero-art.ts`, not `FACE_ORDER`: the menu, the footer
and the area rows keep theirs. `sortByVoyage()` builds both the hero's slides and the header's
rotating edge (Base.astro), so the two cannot drift.

- **One clock**, the one the plates had: `--hero-cycle` 36 s, `--hero-step` 6 s, CSS-only. Each photograph holds still and the next dissolves in over 1.5 s on top of it; the
  caption leaves before the next arrives, one text at a time (the push and the quick fades read as
  "PowerPoint trasnochado", founder 2026-10-06). The pause
  is the verticals' own control (`scene-ctl.css`, shared since #560), in the band's corner. The
  arrows **seek** the clock — every animation on it, the header's edge included, is set to the
  chosen slide's time — and the rotation goes on (founder: "si le doy a avanzar que no se desactive
  el play"); the courtesy freeze holds only while the vertical's link has keyboard focus.
- **Type and card**: the heading and the kicker as they were; the vertical's caption in the original
  card (pane and a rule in the vertical's colour), set on desktops in the band's lower right corner,
  apart from the heading, standing on the **chapter rail** (founder's choice C, 2026-10-06, after
  calling the old bars "enanas, feas, fuera de sitio"): six equal tracks as wide as the column,
  names at 16 px under them, arrows closing the rail at the right; on phones and tablets the rail
  sits right under the card, in the first screen. The title wraps to two lines at its register; the
  kicker is two sentences, one line each from 768 px. The veil is lighter (the photographs barely
  showed): a soft shade behind the copy (`--hero-spot`, widened when the kicker became two unbroken
  lines — 3.7:1 at 1280 x 720 before, 6.0 after; the a11y gate's hero pass measures 1280 x 720 since)
  and a shade under the rail alone (`--hero-foot`) hold the type at AA on all six photographs.
- **What changes in front**: the vertical's name and one line (`hero_line`, a CMS key by face —
  deliberately not `areas_claim`, which the rows further down already say). No caption naming the
  place: the founder struck it. The rail's tracks carry `menu_short` and fill in the vertical's
  colour, and the vertical pages' **seal** — the logo cube, large and faint, leaving by the left
  margin, smaller since 2026-10-06 on every page (760 → 460 px) — in the colour of the vertical
  showing: six seals, one per colour, dissolving on the photographs' clock. One seal recoloured by its
  keyframes stayed one colour (its keyframes had been lost in an edit, and `var()` inside `@keyframes`
  is not honoured everywhere anyway).
- **The bridge and the tug are two slides**, each its own subject, with the cut between them: the
  bridge with its bridge, then the AI page's own photograph of the tug. A zoom from one into the
  other (the tug cut from the bridge's frame) was built and dropped by the founder ("abandono la idea
  de que integración e IA vayan anidadas… que se note el salto").
- **The home's own photographs**: the lighthouse as a whole photograph (masts and sheds painted
  out, extended to the left: `faro.py`), the bridge with its bridge, its ships as photographed (turning
  them was tried: flipped, they sailed into the quay, and a tanker coming IN needs a bow the
  photograph does not have), and the warehouse further away — the whole photograph extended to the left.
- **Phones and tablets (≤ 1024 px)**: the photograph is its own strip under the header and the
  caption stands on its foot, above the heading — over the whole band the copy hid the picture,
  and under the heading the caption fell below a phone's fold (the layout gate's G18).
- **Weight**: only the first photograph loads with the page; the other five carry their sources
  as `data-` until `load`. All six at once held the `<h1>` (the LCP) to 3.7 s on Lighthouse's
  slow 4G; deferred, the home measured 0.97 against main's 0.91 (fewer requests: no plates or
  grounds). On phones the first photograph is the LCP (its strip is the largest element), so Base
  preloads it in the `<head>` (`homePhotoSources`, the same srcset the slide uses).
- **Width and sharpness**: on a very wide screen the frame stops at twice the band's height, anchored
  to the band's right edge where the subjects stand, its left side dissolving under the veil (cropped
  to a strip, the subjects fell outside it; centred, it left a dark strip on the right); every photograph is
  also cut at 3024 px, which a 1512 px laptop at 2x needs — 2016 was stretched 1.5× there.

### 4.12 The home's order (#562)

After the design review of 2026-10-06 (founder: "dales caña a todos"): hero → areas →
**references** → Cloudflare → quality → team → mantra → closing CTA. What we do comes first, then
who has trusted us with it, then the platform we do much of it on.

- **References**: the home renders `ReferenceBanner` after the areas, and its footer leaves it out
  (`SiteFooter references={false}`, from `Base`'s `onHome`); every other page keeps it in the
  footer (#296). The layout gate's footer pass reads `/quienes-somos` for that reason.
- **Cloudflare**: no longer the page's opening section; its copy says what we do with it and that
  this site runs on it (`Workers`, `D1`, `R2`), not "the most advanced solutions".
- **Quality**: the four Lighthouse thresholds as a console (`.s-gate`), read from
  `lighthouserc.json` at build time, so the claim and the gate cannot drift. Its chrome is
  Lighthouse's words (`panel_labels` → `lh_*`), English in both locales like every quoted product.
- **Team**: each card says what the person does, from the member's `excerpt` (also on Quiénes
  somos and in its JSON-LD); the shared «Ingeniero» label is only the fallback.

## 5. SEO

### 5.1 Meta Tags

- **Canonical URLs** on all pages via `Base.astro`
- **Open Graph + Twitter Card** meta tags (title, description, image, URL, type)
- **hreflang** tags with absolute URLs and `x-default` — alternate URLs resolved from the CMS `translationOf` group via `src/utils/alternate.ts` (#291: slugs are translated, so the `/en` prefix swap is only valid for locale-invariant routes). The same resolved value feeds the `LanguageSwitcher`; contract verified by `scripts/hreflang-sweep.py`
- **RSS autodiscovery** `<link>` in `<head>`
- **`@astrojs/sitemap`** with i18n-aware sitemap
- **`robots.txt`** with sitemap reference
- **Article meta** — `publishedTime`, `modifiedTime` for blog posts via `getSeoMeta()`

### 5.2 JSON-LD Structured Data

Centralized in `src/utils/jsonld.ts` — typed helper functions that consume CMS data:

| Page type | Schema | Helper function |
|:----------|:-------|:----------------|
| Homepage (ES/EN) | `Organization` + `WebSite` | `homepageJsonLd()` |
| Service detail (ES/EN) | `Service` | `serviceJsonLd()` |
| About (ES/EN) | `AboutPage` + team members | `aboutJsonLd()` |
| Contact (ES/EN) | `LocalBusiness` | `contactJsonLd()` |
| Blog post (ES/EN) | `BlogPosting` | `blogPostJsonLd()` |

All schemas use CMS data — no hardcoded strings. Validate with [Google Rich Results Test](https://search.google.com/test/rich-results).

## 6. Analytics

- **Cloudflare Web Analytics** via **Zaraz** (edge-injected, zero client-side JS)
- Configured in Cloudflare Dashboard → Zaraz → Third-party tools
- No code in `Base.astro` — Zaraz auto-injects on all proxied pages
- Extensible: GA4, Meta Pixel, etc. can be added via dashboard without code changes

## 7. Media & Video Strategy

### 7.1 Images — R2 via EmDash

CMS images (featured images, inline media) are managed through the EmDash admin UI, which stores them in the R2 bucket bound as `MEDIA` in `wrangler.jsonc`. No manual R2 interaction is needed for CMS content.

**One resizing pipeline, and it is Astro's (#323).** Every image that can be
resized goes through `<Image>` — EmDash's for CMS media, `astro:assets` for
anything imported from `src/assets/`. The adapter is configured
`imageService: { build: "compile", runtime: "cloudflare-binding" }`: sharp for
what the build can see, the `IMAGES` binding for what only exists at request
time. Hand-written `srcset` was considered and rejected; a site with two image
pipelines ends up maintaining neither.

Three things that decided the shape, all measured rather than assumed:

- **Not `imageService: "cloudflare"`.** That emits `/cdn-cgi/image/…` URLs,
  which are a **zone** feature. Both deploys live on `*.workers.dev`, where the
  original answers 200 and the transformed URL answers **404**. When the worker
  moves onto `serverstartup.io` (#162) with Transformations enabled, switching
  is one line in `astro.config.mjs` and no markup moves.
- **`image.remotePatterns` is not optional here.** The CMS points
  `featured_image` at static files under `public/assets/`, and EmDash hands
  Astro an absolute URL for them, which Astro treats as *remote* and passes
  through unless the host is allowed. Before the allow-list, the build emitted a
  `srcset` of nine identical URLs — one per width descriptor. The list is written
  host by host: a wildcard makes `/_image` an open proxy that resizes anything on
  the internet at our expense.
- **`<Image>` carries the SLOT's dimensions, not the file's.** Astro derives its
  width ladder from `width`, so a 1200px source in a 53px avatar produced a
  ladder starting at 640. Measure the slot per breakpoint (device emulation, not
  a bare window size) and let `sizes` say what the layout does.

A fourth thing, learned after the fact (#405). The adapter's `/_image`
endpoint caches its own output through `caches.default`, and `cache.put` runs
**before** the middleware. Two consequences that are easy to meet the hard way:
the cached copy never carries the §11 security headers, so the middleware has to
add them on the way out of a hit; and a response handed back by
`caches.default.match()` has **immutable** headers, so writing to it throws and
Astro answers 500 with an empty body. That is why `src/middleware.ts` collects
its headers and rebuilds the response instead of mutating in place. The failure
only appeared on the *second* request for a given image, and `curl -I` reported
200 on it, which is why `scripts/ci-check-headers.sh` now ends with a real GET,
issued twice.

A fifth, and the one that only Cloudflare could teach (#407). Because EmDash
hands Astro an **absolute** url for CMS media, the endpoint treats our own
static files as remote and fetches them over HTTP — and on the edge that fetch
is a Worker asking for its own hostname, which is refused. Measured on the
deployed preview worker: the subrequest returns `404 text/plain, 17 bytes`, the
`IMAGES` binding is handed an error string, and every image on the site answers
500. `wrangler dev` cannot show it, because there the same loopback is an
ordinary HTTP request that returns the real file.

Rewriting the href inside `src/middleware.ts` looks like the fix and is not:
`next(payload)` re-routes the request but never replaces the `Request` the
endpoint reads, so the rewrite is dead code — measured with simultaneous probes
in the middleware and the endpoint on the deployed worker, and shipped once
before that was known. The fix has to change what the **markup** asks for. So
`src/components/TeamPhoto.astro` picks the source per photograph: one the repo
carries goes through `astro:assets` (via a `import.meta.glob` of
`public/assets/team/`, so the files do not move and the CMS field keeps
resolving), which emits a `/_astro/…` **path** and puts the endpoint on its
`env.ASSETS.fetch()` branch with no subrequest at all; anything else falls to
EmDash's `<Image>`, which reads media-library bytes off the storage binding.
That second branch is the destination — #410 moves these photographs into the
media library, and then none of the first branch is needed.

That line is now held by a gate rather than by memory (#412).
`scripts/ci-check-image-hrefs.py` crawls the sitemap on the local stack and
fails on any `/_image` href that is an absolute URL — and, since #409, on any
transform that names no quality, because the IMAGES binding has no default of
its own and answers a `q`-less URL near-losslessly: 489 KB where 117 KB would
do. The number every call site passes is `IMAGE_QUALITY` in `src/lib/images.ts`. It reads the bytes rather
than the behaviour on purpose: locally the site *serves* those images perfectly,
which is exactly why the behavioural checks were green while #407 was live. Any
absolute href fails, foreign hosts included — the repository carries no
third-party image, so the rule closes by default and one is written down, with
a reason, in `scripts/image-remote-allowlist.txt`.

The lesson generalises past images: a Worker cannot reach itself, so anything
the site needs to read about its own content has to come from a binding, not
from its own URL.

Deliberately excluded: the Kit Digital strip in the footer. It is red.es's
artefact and the composition is not ours to re-cut (§4.1, #308).

### 7.2 Video — Cloudflare Stream

Videos are hosted on **Cloudflare Stream** — a managed platform with automatic transcoding (HLS/DASH), adaptive bitrate, and zero-config playback.

| Aspect | Detail |
|:-------|:-------|
| **Dashboard** | Cloudflare → Stream → Videos |
| **Account** | Server Startup (`d70cd71aecc76f94c73d7a6f3cc1265d`) |
| **Pricing** | ~$5/1000 min stored + $1/1000 min delivered |
| **Upload** | Dashboard UI or API (`CF_STREAM_TOKEN` in `.env`) |
| **Registry** | `reference/legacy/media/STREAM-VIDEOS.md` |

#### Upload via API

```bash
source .env
curl -X POST "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream" \
  -H "Authorization: Bearer ${CF_STREAM_TOKEN}" \
  -F "file=@path/to/video.mp4" \
  -F 'meta={"name":"descriptive-name"}'
```

#### Embed in Astro

```html
<iframe
  src="https://customer-XXXX.cloudflarestream.com/{VIDEO_ID}/iframe"
  style="border: none; width: 100%; aspect-ratio: 16/9;"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
  allowfullscreen>
</iframe>
```

#### Why Stream over R2 for video?

- **Automatic transcoding** — no need to maintain multiple resolutions manually
- **Adaptive bitrate** — optimal quality on any device/bandwidth
- **Built-in player** — professional embed, no custom player code
- **EmDash doesn't support video natively** — no video fields or player in the CMS
- **R2 video serving** requires building your own encoding pipeline — disproportionate effort

## 8. PWA (Progressive Web App)

Basic PWA support via Web App Manifest — enables mobile home screen installation without a full service worker.

| File | Purpose |
|:-----|:--------|
| `public/site.webmanifest` | App name, icons, theme color, display mode |
| `public/assets/icon-192.png` | Home screen icon (192×192) |
| `public/assets/icon-512.png` | Splash screen icon (512×512) |

`Base.astro` includes:
- `<link rel="manifest">` → manifest file
- `<meta name="theme-color">` → `#1E1E1E` (matches `--color-primary`)
- `<link rel="apple-touch-icon">` → iOS home screen icon

## 9. Caching

Rewritten after #332/#357. The previous version of this section claimed
"Cloudflare CDN provides edge caching" — measured false: nothing was cached at
either layer, and the 27 `Astro.cache.set(cacheHint)` calls emitted no headers
because no provider was configured.

- **Edge**: Workers Cache is opted in from `wrangler.jsonc` (`"cache": { "enabled": true }`,
  all three environments). It sits **in front of** the worker: on a hit the
  code does not run.
- **Provider**: `cacheCloudflare()` from `@astrojs/cloudflare/cache`, declared in
  `astro.config.mjs`. It turns a `cacheHint` into `Cloudflare-CDN-Cache-Control`
  plus `Cache-Tag` (the hint's tags, plus an automatic per-path tag).
- **Policy — default-deny**, in `src/middleware.ts`. With Workers Cache on, a 200
  without `Cache-Control` is heuristically cacheable for ~2h under RFC 9111,
  admin pages included. So only a page that opted in — proven by the tags it
  accumulated from its own `Astro.cache.set(cacheHint)` — gets `maxAge: 3600,
  swr: 60`. Everything else gets an explicit `no-store`.
- **Where a hint may be set**: page frontmatter (`src/pages/**`) or the
  middleware, and nowhere else. A `cache.set` inside a layout or component runs
  mid-stream, after the response headers have left, and is silently dropped.
  `scripts/ci-check-cache-hints.py` enforces this.
- **Footer data** (services, partners, references render on every page) is
  tagged centrally in the middleware for that same reason.
- **Purge on publish**: `src/plugins/cache-purge.ts`, an in-repo EmDash plugin
  (`capabilities: ["content:read"]`, without which the runtime skips every hook
  silently). It purges tags `[collection, id]` on afterSave-when-published,
  afterPublish, afterUnpublish, afterDelete and afterRestore — so purging an
  entry also evicts the pages that merely embed it.
- **Known gap**: menus and site settings emit no publish hook in EmDash 0.34,
  so their staleness is bounded by the 1h TTL rather than purged.
- **Verification**: `cf-cache-status` on a real preview deploy — `wrangler dev`
  strips the CDN headers and the local emulator implements no purge at all.
  `scripts/verify-purge.sh` runs the end-to-end proof, negative control included.

## 10. Deployment

- **Platform**: Cloudflare Workers
- **Build**: `npm run build` → `dist/`
- **Dev**: `npx emdash dev` (runs migrations, seeds, generates types)
- **Admin**: `http://localhost:4321/_emdash/admin`

### 10.1 D1 Seeding (CRITICAL)

`npx emdash seed` writes to `./data.db` by default. With `d1()` adapter, the dev server uses Wrangler's D1 emulator at `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`.

```bash
# Find and seed the correct DB
D1_DB=$(find .wrangler -name "*.sqlite" -path "*/d1/*" -not -name "metadata.sqlite")
npx emdash seed seed/seed.json -d "$D1_DB"
```

### 10.2 Release ritual (CI/CD, issues #191–#196)

```
PR → quality-gates green → merge to main
                              │
                              ▼ (automatic, workflow_run)
                    deploy-preview: build CLOUDFLARE_ENV=preview
                    → wrangler-action deploy (worker FIRST)
                    → wait until the worker migrates the remote D1
                    → refresh preview D1 from seed/seed.json
                    → verify-deploy battery
                              │
                              ▼ (Julio verifies on the preview URL)
                    deploy-production: workflow_dispatch ONLY
                    → rebuild same commit CLOUDFLARE_ENV=production
                    → wrangler-action deploy → verify-deploy battery
```

- **The manual dispatch IS the production approval gate.** GitHub environment
  required-reviewers is a paid feature on private repos; there is no automatic
  path to production.
- **No same-artifact promotion**: the Cloudflare adapter flattens wrangler
  environment bindings into the build at *build* time (`wrangler deploy --env`
  is a no-op against the generated config). Promotion = rebuilding the same
  commit with `CLOUDFLARE_ENV=production`.
- **Remote D1 seeding** (`scripts/seed-remote-preview.sh`): per-table dumps
  (a whole-db dump writes `sqlite_schema` for the FTS5 virtual tables, which
  D1 rejects), explicit `CREATE VIRTUAL TABLE` + FTS rebuild statements,
  rehearsed on three throwaway sqlites before touching remote. Automatic for
  preview on every deploy; **opt-in and destructive** for production
  (`seed_d1` input — overwrites CMS edits made live), and gated:
  `scripts/ci-guard-prod-seed.sh` counts the rows already in the target and
  **refuses** unless the database is empty or the operator typed the
  confirmation string (#358). Per-table counts are printed before anything is
  written, allowed or refused.
- **Three rehearsals, and what each one stands for** (#326, #484). Collection
  tables (`ec_*`) are not migration-managed — EmDash creates them from the
  collections declared in `seed.json` — so they drift from the remote in two
  ways, and each rehearsal exists because the previous one could not see one of
  them. (1) *Dropped*: the `ec_*` tables are dropped on a copy, so the file has
  to rebuild them; catches a collection the remote never learned about. (2)
  *Populated*: every row kept, so an FK-hostile DELETE order actually violates.
  (3) *Remote-shaped*: local system tables, but the collection tables recreated
  from the remote's own `sqlite_master`, read read-only before anything is
  applied. The first two both descend from the local database and therefore
  carry the canonical column set **by construction**, so neither can fail on a
  remote that is a column behind — which is what froze preview for three deploys
  when `url` was added to the `partners` collection. Missing columns are
  repaired additively (`ALTER TABLE … ADD COLUMN`); a column the seed does not
  declare, a type change, or a `NOT NULL` column with no default exits **3**,
  because none of those can be repaired in place. The comparator carries two
  positive controls, run offline against schemas it builds itself, one per
  drift shape.
- **INSERTs name their columns.** `.mode insert` emits positional `VALUES`,
  which makes the whole file depend on the remote's column *order*. `ALTER
  TABLE` can only append, so a remote repaired for a column the canonical schema
  holds in the middle would take every later value one place to the left —
  measured on a faithful copy of the broken preview: green apply, `featured`
  landing in `url`, the URL in `featured_image`, the image JSON in `excerpt`.
  Naming the columns removes the dependency (#484).
- **Deploy order matters** (#369/#370): the worker is deployed **before** the D1
  refresh. EmDash applies its migrations lazily in the request path, so on a
  schema-bumping release only the new worker can move the remote schema
  forward; refreshing first fails with a column-count mismatch. The wait step
  polls the remote `_emdash_migrations` count against a target **derived** from
  a locally seeded database, never a hardcoded number.

- **Post-deploy verification** (`verify-deploy.yml`, reusable): 20 routes ×
  (200 + served title), 404 behavior, security-header suite, robots/sitemap/
  canonical/hreflang, W3C Nu spot-check (downtime warns, errors fail).
- Quality gates on every PR (`ci.yml`): gitleaks, citability guard,
  `astro check` 0/0 (TypeScript pinned to 5.x — `astro check` has no
  programmatic API on TS 7 and TS 6 misreports inference errors), seed
  validation, CMS text integrity, design tokens, build, seeded boot,
  html-validate ×15 routes, header suite, accessibility, Lighthouse 3-run
  median (perf ≥ 95, a11y/bp/seo = 100).
- **Accessibility gate** (`scripts/ci-check-a11y.mjs`): axe-core over **every**
  audited route, plus the checks a rule engine cannot decide — keyboard
  traversal over **every** route the seed declares, both locales, plus the two
  search pages no collection declares — derived like the sitemap, from
  `scripts/lib/seed-routes.mjs`, so the list cannot fall behind a new page and
  the count is not a number anyone has to keep true — each walked
  to the end of the document asserting every stop is visible, carries a focus
  ring and is not under the fixed header; the menu opening with `Enter`,
  holding focus while open, closing with `Escape` and **handing focus back to
  the cube**; WCAG 2.1.4 shortcut scoping; reflow at 320px; and W3C Nu.
  Traversals start by focusing `<body>` — `blur()` clears `activeElement` but
  not the *sequential focus navigation starting point*, so on the autofocusing
  search pages the first Tab otherwise begins mid-document.
- **The axe list was a sample of ten until #387, and the reason is worth
  keeping.** Widening it surfaced four real `color-contrast` failures (WCAG
  1.4.3, eight nodes across both locales), and three of the greys belonged to
  the foreign chrome those instruments imitate — Google's BigQuery console and
  a javadoc page — inside the `token-guard: off` regions §10.10 describes.
  Raising them trades fidelity for contrast, which is not a gate's decision, so
  the failures were filed rather than fixed or suppressed, and the sample
  carried the four measurements in its comment. The founder's call (2026-08-25)
  was to raise all four to the smallest value that clears AA, on the reasoning
  that fidelity there meant reproducing an interface that fails AA itself:
  `#9aa0a6 → #6d7379` (2.50 → 4.55:1), `#b0b4b8 → #73777b` (2.09 → 4.51:1),
  `#4a524a → #7f877f` (2.08 → 4.54:1). The fourth was not foreign at all —
  `--color-text-muted` (#6B6B6B, 5.4:1 on paper) dressing the javadoc's own
  dark bar at 2.84:1. Ink at reduced weight has to **flip** on a dark ground,
  not merely dim, so `theme.css` gained `--color-text-muted-dark` (#8C8C8C) and
  `.inst--dark .inst__muted` consumes it. The audit is the full route list
  again; narrowing it to make a failure go away would drop routes nobody would
  then check, and the drop leaves no trace in a green run.
- **Every gate carries a positive control** (#385). A check that finds no
  problems and one that *cannot* find problems print the same green line, so
  each gate first plants the exact defect it hunts in a fixture it owns and
  refuses to report anything if it no longer finds it. Failure exits **3** and
  names which guard went blind, distinct from exit 1 (real findings). The
  fixtures live in temporary directories, in-memory strings and a
  `page.setContent` page — never in the repository tree, because a canary in
  the tree trips the very guard it is meant to prove (#347). Controls in
  place: citability (a planted name, and a name planted INSIDE a generated
  `.docx`), cache hints (must see the real call
  sites), design tokens (5 planted CSS defects + 3 shapes it must not flag),
  CMS text (hardcoded attribute, hardcoded text node, unseeded label key),
  security headers (a matcher run over present / absent / wrong-value
  responses), copy baseline (routes enumerate, `innerText` returns copy, the
  comparator catches a deleted line, a changed word and a truncation) and
  a11y (a link under a fixed header with its ring suppressed, a 720px block at
  320px, an `<img>` with no alt).
- **Public agent guide, private rules** (#325). `AGENTS.md` is the file a
  foreign agent opens by convention, and it is tracked — so it is published.
  It used to be generated output: an index of eleven paths into a private
  repository no clone receives, a glob table routing `worker/**`, `Dockerfile`
  and `application.properties` in a project with none of them, and a tracked
  `.claude/skills` symlink pointing outside the tree and therefore dangling on
  every clone. All three fail *silently* — an agent reading them loads nothing
  and gets no warning, the same failure mode worktrees have. `AGENTS.md` is now
  hand-owned public content: how to run the site, where the gate table is, and
  the rules that are not obvious from the code (content in the CMS, both
  languages, tokens from `theme.css`, one column, who may be named). The
  private index reaches the agent through `CLAUDE.md`, a real file that is not
  tracked. `tests/unit/agent-boundary.test.ts` keeps the boundary: no private
  path in `AGENTS.md`, every relative link resolved **against `git ls-files`
  rather than the disk** (the private directory exists on a maintainer's
  machine and nowhere else, so the working tree would answer "fine" for exactly
  the reader the test protects), and no tracked symlink escaping the
  repository. The generator that wrote the old file lives in the private repo
  and can overwrite this one from outside anything CI sees; the test is what
  turns that into a red build instead of a silent republication. `AGENTS.md`
  was not the only thing it wrote: the PR template asked every contributor to
  tick `npm run lint`, a script this project has never had, beside a row about
  a Cloudflare Worker build in a repository with no `worker/`. A checklist row
  nobody can satisfy gets ticked anyway. Both are now asserted generically —
  no tracked file may point *into* the private repository (naming the bare
  directory is allowed; explaining the `.agents/` rename requires it), and the
  template may name no npm script that `package.json` does not define.
- **Vendored, and named so** (#325). The EmDash starter's skill pack sat at
  `.agents/` — one character from the private `.agent/`, public where the other
  is private, tracked where the other is excluded, and referenced by nothing.
  It is now `vendor/emdash-skills/`, beside the other external code, with a
  README recording that it came from `cloudflare[bot]`'s import commit on
  2026-04-21 when EmDash was **0.6.0**, and has not been touched since. The
  project runs **0.34.0**, so that README says plainly which parts to distrust.
- **A stack that dies mid-run says so** (`scripts/lib/stack-probe.mjs`, #390).
  A `wrangler dev` session died in the middle of a gate run on 2026-08-25. Every
  guard reported honestly what it saw — a navigation timeout on one route, then
  `ERR_CONNECTION_REFUSED` — and every one of those messages points at the
  route, the guard, or the diff under test. None pointed at the stack, because
  none had looked, and ruling it out cost a full investigation. The guards now
  spend one HTTP request answering the question `copy-baseline` used to merely
  ask ("Is the stack up?"), and print wrangler's own last twelve log lines when
  the answer is no. It adds information and nothing else — no retry, no wider
  timeout, no changed exit code, because masking the crash would destroy the
  only signal that reveals it. Two things the break test taught that reading
  would not: a rejected **top-level `await`** in an entry module does not reach
  `unhandledRejection` (the a11y guard needs `uncaughtException` as well, or it
  still dies with a bare puppeteer trace), and a handler that prints only
  `error.message` trades one blind spot for another on every failure that is
  *not* a dead stack — so the trace stays. The crash itself remains open: #390
  can only close on a reproduction, and seven clean sessions the same day say
  it does not reproduce on demand.
- **Astro 7's agent endpoints, evaluated and split** (#367). Astro 7.2.4 ships
  `/_astro/status` and `astro dev --background`, and the parent issue asked
  whether either lets us delete hand-rolled work. Measured, not reasoned:
  `/_astro/status` answered 200 **6.2s** after start while `/` did not answer
  until **15.0s**, and its body is the constant `{"ok":true}` from a Vite
  middleware with no state behind it. It is a **liveness** probe, not a
  readiness one, and `scripts/ci-local-stack.sh` runs `wrangler dev` over the
  built output where Vite does not exist at all — so it is rejected twice over,
  and adopting it would have replaced a probe that knows when the site works
  with one that does not. `astro dev --background` is the opposite verdict:
  `astro dev status` and `astro dev stop` are a real lockfile-backed lifecycle
  (measured — `stop` freed the port), and they are what `stop_stack()`
  approximates in forty lines of `pkill`/`lsof` archaeology. They manage **astro
  dev** servers, though, and the CI stack is wrangler, so the win is for
  interactive agent sessions rather than for the gate run.
- **Blind exits 3, found exits 1 — in all seven guards** (#392). The
  convention was documented before it was uniform: five gates implemented it
  and `ci-check-cache-hints.py` and `ci-check-citability.py`, which came first,
  still returned 1 when they went blind. Nothing was unguarded — CI fails on
  any non-zero — but the two codes answer opposite questions, and a reader
  debugging a red step would go looking for a violation that was never found.
  Ten sites in the citability guard moved to 3; the three that report a real
  finding (an unaccounted opaque file, a forbidden name in the tree, a
  non-citable reference in the seed) stayed at 1. Every one of the twelve was
  exercised by breaking it — which turned out to be possible locally after all,
  the reason the issue was filed rather than fixed on the spot: the guard runs
  end to end under a **synthetic** `FORBIDDEN_NAMES` (three plain alternatives
  that appear nowhere in the tree), so its shape, its two positive controls and
  its scan are all reachable without the real secret. What a synthetic secret
  cannot check is that the real one still holds the real names, which the
  script's own comment already explains is uncheckable from inside CI.
- **The naming gate reads what grep skips** (`ci-check-citability.py`, #324).
  This repository is public (#428) and one guard decides who may be named in
  it (§13). `grep -I` stops at the first NUL byte and says nothing, which
  left 125 of 414 tracked files — around 30 MB, the whole `reference/` archive
  — outside it: a skipped file and a clean file produced the same green. The
  issue proved it the honest way, grepping a WordPress export for three words
  known to be inside it and getting zero. Two answers, in order. **Read what
  can be read**: OOXML documents are ZIP-of-XML, so the twelve exports are
  extracted with the standard library and scanned like text — including the
  legacy site's own clients-and-references page, which is exactly where a
  non-citable name would sit. **Account for the rest**: anything still opaque
  must match a glob in `scripts/citability-opaque.txt` *with a written reason*,
  and an unaccounted opaque file fails the build, so the blind spot cannot grow
  back quietly. The Figma renders are on that list with a measurement rather
  than an assumption — their type is converted to outlines, so a whole frame
  decodes to 29 ToUnicode CMap entries and no recoverable word. What survives
  in `reference/` at all is a separate decision (#324).
- **Menu check** (`copy-baseline.mjs`, #384): the frozen-copy baselines read
  `document.body.innerText`, which is the *rendered* text, and the menu lives
  in a `<dialog>` closed at rest — so the baseline of all 26 routes is
  identical whether the menu has eleven links or none. That blind spot let a
  whole menu row ship to production (#382). The menu therefore has its own
  **structural** assertion instead of joining the copy contract: the links
  `seed/seed.json` declares must be the links the menu renders, checked on the
  home and a service page per locale. Opening the dialog for the capture
  instead was rejected — `showModal()` makes the document inert and moves
  focus, and the menu's text would couple all 26 baselines to one component.
- **`src/fetch.*` is reserved** (#359, `tests/unit/reserved-paths.test.ts`):
  Astro 7 turns a file at that path into the Advanced Routing entrypoint,
  taking over the whole request pipeline. Nothing lives there and nothing
  should arrive there by accident; the guard steps aside when
  `astro.config.mjs` declares `fetchFile` (renamed, or `null`), which makes
  the file a deliberate act.
- **Design-token gate** (`scripts/ci-check-design-tokens.py`): a colour
  literal, a non-token `border-radius`, a non-token `box-shadow` or a bespoke
  `max-width` outside `theme.css` fails the build. The width rule is the
  layout criterion made executable: a page has ONE column
  (`--container-max`) and everything ends at its right edge, so `max-width`
  may only be the column token, `100%` or `none`. A `var(--token, fallback)` is a token use, not
  a declaration; a region may exempt itself with
  `/* token-guard: off — reason */ … /* token-guard: on */`, which the service
  instruments use because they quote another product's chrome (a cart, a
  BigQuery console, a GitHub pull request). Each run prints how many
  declarations the fences covered, so silencing cannot masquerade as passing.

  Since #457 it also checks the **reverse** direction: a token `theme.css`
  declares that nothing consumes fails the build too. That direction has no
  rendering symptom at all — the page is correct, the CSS is valid, nothing is
  red — so it is found only by someone reading the file and grepping, which is
  how `--card-shadow` and five `--color-card-*` pastels survived from the
  WordPress-era design into 2026 while `docs/design-system.md` went on
  describing them as the card palette and claiming the CMS stored them. It is
  not tidiness: `theme.css` is normative, so a token declared there is a claim
  about how the site draws that thing, and eleven stale claims made the
  normative file unreadable as a description of the site. A scale meant to be
  complete opts out with `/* token-scale: on */ … /* token-scale: off */` —
  held to a shape, because an unbounded fence is just an off switch: it must
  close, and it must cover one family of names, or the run exits 3 (blind)
  rather than obeying it. Both were measured, not assumed: one deleted `off`
  marker silently took the check from 56 tokens to 46, and widening the fence
  over the whole `:root` block silenced all of them while still exiting 0.
- **CSP constraint**: `script-src 'self'` with no hashes — Vite must never
  inline scripts into HTML (`assetsInlineLimit: 0` in astro.config.mjs) or
  the browser silently blocks them (menu + phone decode died this way).

## 11. Security

- MCP tokens **must not** be passed via CLI arguments (visible in `ps aux`)
- Use environment variables or config files for secrets
- See `docs/security/mcp-token-exposure.md`

