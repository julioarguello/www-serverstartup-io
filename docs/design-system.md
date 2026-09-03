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
| `ci-check-design-tokens.py` | Every colour, radius, shadow and max-width literal outside theme.css is a defect **and** every token theme.css declares is consumed by something. Both directions, because each was violated in turn. |
| `ci-check-var-resolves.mjs` | Every `var()` resolves on the elements its rule matches (26 routes × 2 widths), and every runtime-injected `var()` carries a fallback. An unresolved `var()` with no fallback does not fall back — it invalidates the whole declaration. |
| `ci-check-layout.mjs` | The composition itself: one right edge per block, one heading system, equal row heights, the footer's alignment and the funding marks' size. Geometry, not a screenshot diff. |
| `ci-check-a11y.mjs` | Measured contrast of every text box in the open menu and over every hero plate, axe on 28 routes, keyboard traversal, reflow at 320px, W3C Nu. |
| `copy-baseline.mjs` | The rendered words of 26 routes, frozen. A CSS change that moves text is visible here. |
| `ci-check-css-budget.py` | The source budget in principle 1 — **and** that the figure printed beside it still matches the tree, to within 5 KB. The 2026-08-05 version of this file was four times out of date, which is exactly why nobody noticed the budget was 2.6x over. |

## Principles

1. **No CSS frameworks.** Plain CSS with custom properties, 12 files under
   `src/styles/`. Total source budget **<= 150 KB**; measured **129 KB across 12
   files** (`wc -c src/styles/*.css`). Both numbers are read out of this line by
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
| `--color-console-*` (10) | `#101214` … | The machine voice: console grounds, bars, dimmed ink, the green OK |
| `--color-hero-*` / `--hero-scrim*` | paper at an opacity | Copy and chrome over a photographic plate (#413) |

### The vertical palette lives in the CMS, not here

The six verticals carry their own colour, stored in each service's `color`
field in `seed/seed.json` and read at render:

E-commerce `#008FD3` · Integration `#1D4E89` · Greenfield `#3E7D50` ·
Big Data `#EA4335` · Cloudflare `#F38020` · AI `#6B4FBB`

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

Other layout tokens: `--radius: 4px` · `--radius-pill: 99px` ·
`--shadow-card: 0 2px 10px rgba(0,0,0,.06)` · `--focus-ring` ·
`--widget-spacing: 20px`.

## The two escape hatches

Both are comment fences, both are visible in a diff, and both are deliberately
narrow — an escape hatch nobody can see is how a gate goes quiet.

```css
/* token-guard: off — reason */   …   /* token-guard: on */
```
Exempts a region from the **literal** check. For chrome that belongs to a
product being imitated: the service instruments quote foreign UI, and a house
token there would be a lie about someone else's brand. 295 declarations sit
inside these regions today, almost all of them `service.css`'s instruments, and
every run prints that count.

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
  console, the GitHub pull request. **276 of the 295 muted declarations in the
  whole tree are in it**, because a house token there would be a lie about
  someone else's brand. That is the vertical pages' whole argument (#413), not
  bloat.
- Roughly half of `theme.css` is prose explaining why each rule exists. That is
  the reason this repo is legible, and deleting it to meet a number would be
  paying for a metric with the thing the metric exists to protect.

A budget that a deliberate product decision breaks is the wrong budget. 150 KB
leaves about 21 KB of headroom: enough that ordinary work never touches it, tight
enough that the next 30 KB stylesheet has to be argued for.

**What the budget is not.** It measures source, and source does not travel. The
home actually ships **6 stylesheets, 58 KB raw and 12.9 KB gzipped**, plus 5.4 KB
of inline `<style>` — which is why 129 KB of source has no visible cost and why
Lighthouse stays at 100 with LCP under 1.6s. The source budget is a ratchet
against unnoticed growth in a place humans read, not a proxy for what the browser
downloads. If it is ever raised again, say which of those two things moved.
