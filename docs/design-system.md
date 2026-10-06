# Design system — serverstartup.io

> Rewritten 2026-09-02 (#457) against the tree, after the version consolidated
> on 2026-08-05 (#155) had drifted far enough to contradict itself and the CMS.
> **`src/styles/theme.css` is normative** — this file describes it, and CI
> enforces the relationship in both directions. Where the two disagree,
> theme.css is right and this file is a bug.

## What enforces this

The rules below are not conventions; each one has a gate that fails CI. That is
the reason to read this file rather than grep for hex codes.

| Gate | Asserts |
| ---- | ------- |
| `ci-check-design-tokens.py` | Every colour, radius, shadow and max-width literal outside theme.css is a defect, and so are ink made translucent with `color-mix(… N%, transparent)` (muted is one step, `--color-text-muted`), a token's definition written out again, and a margin, padding or gap in px that is a rung of the spacing scale. **And** every token theme.css declares is consumed by something. Both directions, because each was violated in turn. It reads every declaration, not one per line: until #570 a one-line rule went unread. |
| `ci-check-var-resolves.mjs` | Every `var()` resolves on the elements its rule matches (26 routes × 2 widths), and every runtime-injected `var()` carries a fallback. An unresolved `var()` with no fallback does not fall back — it invalidates the whole declaration. |
| `ci-check-layout.mjs` | The composition itself: one right edge per block, one heading system, equal row heights, the footer's alignment and the funding marks' size, every page type's opening (the 404 and search included) reserving the same inset and closing on `--rhythm-section`, and no page scrolling sideways at a phone width. Geometry, not a screenshot diff. |
| `ci-check-a11y.mjs` | Measured contrast of every text box in the open menu and over every hero plate, axe on 28 routes, keyboard traversal, reflow at 320px, W3C Nu. |
| `copy-baseline.mjs` | The rendered words of 26 routes, frozen. A CSS change that moves text is visible here. |
| `ci-check-css-budget.py` | The source budget in principle 1 — **and** that the figure printed beside it still matches the tree, to within 5 KB. The 2026-08-05 version of this file was four times out of date, which is exactly why nobody noticed the budget was 2.6x over. |

## Principles

1. **No CSS frameworks.** Plain CSS with custom properties, 16 files under
   `src/styles/`. Total source budget **<= 150 KB**; measured **109 KB across 20
   files**, comments left out (`ci-check-css-budget.py` strips them; strings stay). Both numbers are read out of this line by
   `ci-check-css-budget.py`, so the doc is the source and cannot disagree with
   the gate — see [#475](https://github.com/julioarguello/www-serverstartup-io/issues/475)
   for where the previous figure went and why the budget is where it is.
2. **Mobile-first.** Base styles are mobile; enhancements at `min-width: 768px`
   (21 uses) and `min-width: 1025px` (2 uses).
3. **Tokens over literals**, enforced in both directions — a literal outside
   theme.css fails, and so does a token nothing consumes.
4. **Light theme by design.** Dark mode is not adopted; black is reserved for
   the machine voice (consoles) and the closing CTA, never for a content band.
5. **Minimal but personal.** Personality comes from the content, the
   per-vertical colour used as *state*, and targeted monospace accents — not
   from decoration.

## Colour

Ink and paper first; everything else is a named role, never a second opinion
about the same thing.

| Token | Value | Role |
| ----- | ----- | ---- |
| `--color-primary` / `--color-text` / `--color-accent` | `#1E1E1E` | Ink |
| `--color-secondary` | `#FFFFFF` | Paper |
| `--color-text-muted` / `--color-text-muted-dark` | `#6B6B6B` / `#8C8C8C` | Secondary copy |
| `--color-ink-soft` | `#3a3a3a` | Softened ink |
| `--color-border` / `--color-border-soft` | `#E3E7EB` / `#EDEEF0` | Hairlines |
| `--color-tint` | `color-mix(… primary 4% …)` | A BLOCK's ground |
| `--color-edge` / `--color-tint-edge` | `#F38020` / 8% of it | Cloudflare's own orange, and its tint |
| `--color-surface` / `-soft` / `-hover` / `-sheet` | `#f5f5f5` / `#fafafa` / `#e8e8e8` / `#FDFDFB` | Neutral grounds |
| `--color-marked` | `rgba(206,212,218,.5)` | Text highlight |
| `--color-console-*` (10) | `#101214` … | The machine voice: console grounds, bars, dimmed ink, the green OK, the three window dots |
| `--color-hero-*` / `--hero-scrim*` | paper at an opacity | Copy and chrome over a photographic plate (#413) |

### The vertical palette lives in the CMS, not here

The six verticals carry their own colour, stored in each service's `color`
field in `seed/seed.json` and read at render:

E-commerce `#008FD3` · Integration `#EA4335` · Greenfield `#3E7D50` ·
Big Data `#1D4E89` · Cloudflare `#F38020` · AI `#6B4FBB`

Two corrections to what this file used to say, both measured against
`seed/seed.json` rather than remembered:

- The five `--color-card-*` pastels were **never** in the CMS. This file
  claimed they were "fed to CMS `color` field" and were "what renders on cards
  today"; the seed contains zero occurrences of any of them and has held the
  six brand colours above throughout. They were dead tokens describing a
  WordPress-era design, and they are deleted (#457).
- The palette question this file listed as "a taste decision pending Julio" was
  **answered in 2026-08-06** — in this same file, five sections further down.
  The brand palette won. The contradiction is gone with the pastels.

The colour is a **state, not decoration**: at rest a row in the verticals list
is ink on paper, and the vertical's colour appears on hover, focus and
`aria-current` (#453). Six colours at rest is a grid pretending to be a list.

## Typography

Both faces load through Astro's fonts API (`astro.config.mjs`, Google provider,
self-optimised at build). The `<Font>` components render in `Base.astro` — they
were configured but rendered nowhere until #450, so the site shipped neither
face and fell back to the OS default on every route.

- **Alexandria** 300–700 → `--font-sans`, wrapped as
  `--font-family: "Alexandria Symbols", var(--font-sans, "Alexandria", sans-serif)`
- **JetBrains Mono** 400–500 → `--font-mono`, wrapped as `--font-family-mono`

The wrapping is not redundancy. `--font-sans` is defined by the `<Font>`
component, so a stylesheet that names it directly breaks if that component ever
stops rendering — which is exactly what happened. The inner fallback keeps the
family name requested even then, and `ci-check-var-resolves.mjs` fails the
build if any `var()` reaches a page unresolved.

Heading scale, declared once on the elements in theme.css and inherited
everywhere: **h1 48/56 · h2 40/48 · h3 24/30 · h4 22/30 · h5 20/26 · h6 18/24**,
weight 700 except h4. Body is fluid: `--text-body` runs 20px → 24px between
1440px and 2400px, in step with the column, so the line keeps measuring ~80
characters at every width.

**A page's opening h1 is one line on any desktop (#529, founder 2026-10-01).**
Every opening shares one register for it — the service and page heroes and the
document openings (deconstruyendo, contacto, the legal pages) — declared in
`theme.css` next to the desktop register: `min(72px, 100cqi / 14.48 × 0.985)`
against the column's inline size, where 14.48 em is the width of the longest
title the CMS holds («Deconstructing this website» in Alexandria Bold, measured
in Chrome with the loaded font). That is 57 px in the 840 px column, 68 px at the
1000 px one a 2400 px screen gets, 50 px on a 768 px tablet; under 768 px the
48/42/40 register above applies and the title wraps. The a11y gate asserts every
opening h1 is one line at 768, 1024 and 1440, so a longer title fails by name and
the constant moves with it. The home keeps its own smaller register (#420): a
sentence that wraps by design. Blog posts are articles, not openings.

Mono is **accents-only**: inline `code`, the console voice, the reference
marks. Headings stay in Alexandria.

## Spacing and rhythm

An 8-point scale, `--space-1` … `--space-9` = **4 · 8 · 16 · 24 · 32 · 40 · 64
· 80 · 120px**, fenced as a scale (see below) so unused rungs are allowed to
exist. Sections draw from named rhythms rather than the scale directly:

- `--rhythm-section: var(--space-4)` — the padding **each side** of a section
  declares, so two adjacent sections leave 48px between them. A section never
  adds a one-off bottom; the neighbour's top is the other half.
- `--rhythm-band: var(--space-6)` — inside a band (CTA, footer).

## The container system — BLOCK / PANEL / ROW (#452)

Three chromes and a rule for choosing between them. Before this, the home alone
drew boxes five different ways with nothing saying which meant what, and that
absence of a criterion is what read as disharmony.

| | What it means | Chrome |
| - | - | - |
| **BLOCK** | The house making a claim | `--block-rule: 3px` left rule + a tint of the same hue. No border, no radius, no shadow. |
| **PANEL** | A machine surface: instrument, console, quoted foreign UI | `--panel-border: 1px` hairline, `--radius`, `--shadow-card`, a `--panel-edge: 4px` accent along the top. **The only thing on the site that gets a shadow.** |
| **ROW** | One item in a list of links | `--row-rule: 1px` hairline above, `--row-accent: 4px` left rule that appears on hover / focus / current. Nothing else. |

A row that draws a box is a card, and six of them are a grid pretending to be a
list. `ci-check-layout.mjs` asserts rows carry no chrome at rest and that their
heights agree within 8px.

**A photograph is not one of these, and not a container at all (#482).** This
table used to list *photograph* among PANEL's surfaces, which would have given
the three faces on the home the site's only shadow and a 4px accent stripe over
each head. The tree never drew them that way, and the doc was the half that was
wrong: a container holds content, and an image *is* content. Its border is a
frame on the picture, not chrome around a box — which is why the benchmark's
instrument counts it as a tuple (`r4 · 1px all round`, three occurrences) while
the system does not name it. A frame is four equal edges of one colour and
nothing else, and `ci-check-layout.mjs` asserts it, so the drift cannot run back
the other way.

Where the rule comes from: [`design/2026-09-visual-benchmark.md`](design/2026-09-visual-benchmark.md),
which measures eight comparable sites and this one on one run. The short version
is that the sites reading as senior use no container for a list of capabilities —
thoughtbot four underlined links, MarsBased five title-plus-two-lines items,
37signals 38 numbered links and **zero containers on the whole page** — while the
one site that does use cards for that job carries 25 container idioms. That file
also records where we sit on the same instrument, including the one thing it found
that the design review did not: our line measure is the widest of the nine.

## Layout

`--container-max: clamp(880px, calc(880px + (100vw - 1440px) * 0.1667), 1040px)`

There is **one** measure. The column and the body type grow together above
1440px; below it both are frozen, because a laptop is already right. Growing
the column alone would just lengthen the line. `--measure-statement` is an
alias of it, not a second width — headings, paragraphs, boxes, panels and rows
all end at the same right edge, which `ci-check-layout.mjs` asserts per block.

**The consequence, and the only lever it leaves (#481).** At one edge, smaller
type buys more characters per line by arithmetic. So when the benchmark found
this site running the widest measure of the nine it compared — 75 characters
dominant, and `.area-row__claim` at 82 — the fix could not be a cap on the line:
a `max-width` on prose is exactly the second edge the paragraph above forbids.
The lever is **type size**. The claim went 16px → 18px and landed at 73.

`ci-check-layout.mjs` G20 holds it there: no block of body copy over 16px runs
past 75 characters, measured as box width ÷ the mean advance of `a`–`z` in the
element's own resolved font. Not `ch` — `1ch` is the advance of `0`, which in
Alexandria is 1.23× that mean, so a `ch` cap sized by eye would have widened the
column rather than narrowing it. Fine print is out of scope on purpose: at one
measure a 13px disclaimer runs past 100 characters by arithmetic, and every site
in the benchmark set does the same.

Other layout tokens: `--radius: 4px` · `--radius-pill: 99px` ·
`--shadow-card: 0 2px 10px rgba(0,0,0,.06)` · `--focus-ring` ·
`--widget-spacing: 20px`.

## The opening of a vertical (#529, #531, #537, #543)

Every vertical that opens with a scene uses one structure, `HeroScene.astro` +
`hero-scene.css`. A vertical brings only its art, its live layer and its script.
Text, colours, images and animations change per page; the layout and the band do not.

| Width | The opening |
| --- | --- |
| > 1100 px | One dark band of `100svh`. The copy sits in the column at one reference height (the h1 at the same y on every vertical). The art lies behind the copy, under the veil, past the column. The epigraph follows the CTA. The controls sit in the band's corner. |
| ≤ 1100 px (phones and tablets, the menu's boundary) | **The first screen is the screen.** It is one box of `100svh`: title, excerpt, CTA, then the art in its own row, which takes what is left (at least 24svh), with the controls in its corner. The epigraph follows, just below the first screen. The art fits its row: container units for CSS geometry, `contain` fits in the scripts. |
| ≤ 767 px | As above, with the type sized by the screen's height: h1 `clamp(28px, 4.8svh, 42px)`, excerpt `clamp(15px, 2.3svh, 19px)`, epigraph 15 px. |

- **What gives way on a phone is the epigraph's place, never the art** (founder, 2026-10-02, option B of
  #543). Measured at the heights Safari leaves (360 × 700, 390 × 664, 428 × 746), the copy alone took
  669–937 px before this rule. Option A shrank the art to a strip and still overflowed on the AI page.
  Option C, art behind the copy, put the copy over the live layers.
- **The band is one ground for every vertical, haze included** (founder, 2026-10-03, non-negotiable:
  "todos los verticales mismo fondo y layout"). No scene sets `--color-ground-haze`; a vertical's colour
  lives in its art (the AI scene's violet-to-red tint, the bridge drawing), never in the ground.
- **The seal hangs from the first screen's foot** on phones and tablets, so it sits alike on every page.
  Anchored to a band of varying height, it looked bigger on one page than another.
- **The first screen is a grid, not a flex column.** The art's row needs a definite height for its
  container queries: in a flex column Chrome resolved `100cqh` to 0.
- **Every live layer reads the copy where it is**: the epigraph is outside `.s-hero__copy` (it lives in
  `.s-hero__after`), so a script that keeps its art off the text measures both.
- **The pause freezes everything that moves**, timers included, and play goes on from the same frame —
  never a jump to the end. An event that disappears while paused is motion.
- **Every opening lasts about 8 s** (founder, 2026-10-04), **on one clock** (#553): the photograph alone
  until 2 s, the drawing or the machine's layer complete by 4.5 s, the payoff after it, at rest by 8 s —
  `--beat-draw` and `--beat-drawn` in `hero-scene.css`, `SCENE_BEATS` in `hero-art.ts`.
- **Every photograph fills the band the same way** (#553): what shows of its frame is 86 % of the band's
  height (81 % for the machine's eye, whose brackets need the room), on the band's floor, running off its right edge, under the copy's veil where it reaches it. The
  lighthouse is a cut-out; its radar fills its band.
- **The header does not hide** (#543). It stays fixed, transparent over the opening and solid on scroll.
  The pattern of a header hidden on load and shown on scroll would save 69 px against 231–448 px of
  overflow. None of six production sites observed uses it. It risks WCAG 2.4.7: focus would land on
  controls that cannot be seen.

## The two escape hatches

Both are comment fences, both are visible in a diff, and both are deliberately
narrow — an escape hatch nobody can see is how a gate goes quiet.

```css
/* token-guard: off — reason */   …   /* token-guard: on */
```
Exempts a region from the **literal** check. For chrome that belongs to a
product being imitated: the service instruments quote foreign UI, and a house
token there would be a lie about someone else's brand. 387 declarations sat
inside these regions on 2026-10-06, 342 of them in `service.css`'s instruments,
and every run prints the current count. The figure rose from 295 when the gate
began reading every declaration on a line, not just the first (#570). Nothing
was added to the fences; they had been counted short.

```css
/* token-scale: on */   …   /* token-scale: off */
```
Exempts a region from the **unconsumed-token** check, for a scale that is
declared whole or not at all. A ladder is allowed rungs nobody currently stands
on; deleting them is what makes the next author who needs 64px write `64px`,
which the literal check then rejects, and the way out of *that* is
`token-guard: off` — worse than an unused token.

The fence is held to a shape, because otherwise it is simply an off switch: it
must close, and it must cover **one family** of names. Widening it over the
whole `:root` block silences all 56 tokens, so the gate reports that as
blindness (exit 3) rather than obeying it.

## Resolved decisions

1. **The verticals carry the brand palette** (2026-08-06), stored in the CMS,
   used as state rather than as a resting fill (#453).
2. **JetBrains Mono is accents-only**; headings stay in Alexandria.
3. **The blog is empty and stays empty** — routes serve their written empty
   states, and nothing links to `/posts`.
4. **Phone and WhatsApp are click-to-decode** — base64 in settings, decoded on
   click. No plain number in HTML, JSON-LD or the committed seed. Obfuscation,
   not secrecy: it defeats scrapers, not a determined human.
5. **No dark mode.** The site is deliberately light.
6. **No dark content bands** (#304). Black is the machine voice and the closing
   CTA; the home's `.s-tech` was the last content band in black and it is gone
   (#457).
7. **The opening fits the first screen on every device** (#543). On phones and tablets the epigraph
   follows the first screen. See "The opening of a vertical".
8. **The header stays fixed** (#543). It is transparent over the opening and solid on scroll, never
   hidden on load, and it has no hide-on-scroll.
9. **One call to action per page, and the closing one is filled** (#562). Where the closing band
   (`CtaGlobal`) asks, the footer does not ask again. The band's button is the one exception to the
   ghost rule (#264): `.btn-solid`, paper at rest, outline on hover — the section colour cannot be its
   hover, because on a page with no section it is ink, the band's own ground.

## Where the budget came from (#475)

The 2026-08-05 version of this file claimed "< 50 KB; current ~31 KB across 10
files". Measured with the command it named: **129 KB across 12 files** — four
times the figure it printed as current, and 2.6x the budget it declared. The
stale figure is the more interesting half: a budget whose "current" is a fossil
does not just fail to warn, it actively reports health.

    30 KB theme.css · 29 KB homepage.css · 26 KB service.css · 13 KB
    deconstruct.css · 11 KB post-detail.css · 21 KB the other seven

**The budget was raised to 150 KB rather than dropped, and here is the reason.**
There is no single culprit — the growth is spread across the three biggest files,
and two of the three are not instruments at all. Two things account for most of
it, and both are deliberate:

- `service.css` carries the imitations of foreign UI — the cart, the BigQuery
  console, the GitHub pull request. **Most of the fenced declarations in the
  whole tree are in it** (342 of 387 on 2026-10-06), because a house token there would be a lie about
  someone else's brand. That is the vertical pages' whole argument (#413), not
  bloat.
- Roughly half of `theme.css` is prose explaining why each rule exists. That is
  the reason this repo is legible, and deleting it to meet a number would be
  paying for a metric with the thing the metric exists to protect.

A budget that a deliberate product decision breaks is the wrong budget. 150 KB
leaves about 21 KB of headroom: enough that ordinary work never touches it, tight
enough that the next 30 KB stylesheet has to be argued for.

**The budget counts CSS, not comments (#543, founder 2026-10-02).** The AI vertical's scene took the
tree to 156 KB, past 150. Measured that day, there was nothing to cut: about 250 bytes repeated across
the scene stylesheets, about 70 bytes of dead rules, and about 60 KB of comments — two thirds of
`theme.css` — explaining why each rule exists. Three ways were offered: raise the budget to 175, move the
long comments into these docs, or stop counting comments. The founder chose the last: the reasons stay
next to the rules they explain, and the budget watches what the browser actually parses. Measured that
way the tree is 94 KB, so 150 now leaves 56 KB of headroom where it used to leave 21; the ratchet is
looser, by choice, and a tighter figure is one number in the line above.

**What the budget is not.** It measures source, and source does not travel. The
home actually ships **6 stylesheets, 58 KB raw and 12.9 KB gzipped**, plus 5.4 KB
of inline `<style>` — which is why 129 KB of source has no visible cost and why
Lighthouse stays at 100 with LCP under 1.6s. The source budget is a ratchet
against unnoticed growth in a place humans read, not a proxy for what the browser
downloads. If it is ever raised again, say which of those two things moved.
