# Visual benchmark — minimal boutique consultancy websites

> Measured on **2026-09-02** at 1440×900 in headless Chrome by
> `scripts/bench-visual.mjs`, one run, one script, nine sites — the eight
> references and serverstartup.io together, so every comparison below is one
> instrument rather than two readings. Ours was served from a local production
> build (`scripts/ci-local-stack.sh 8787`) off `main` at `b4dc729`.
>
> This is the visual half of the benchmark whose copy half is
> [`../company/07-web-benchmark.md`](../company/07-web-benchmark.md) (2026-08-02).

## Why this file exists

Four rules came out of looking at these eight sites, and those four rules decided
six merged pull requests and four live CI gates:

| Rule | What it became |
| - | - |
| Delete the card | The areas block went from six boxed paragraphs to six rows (#453) |
| Every item in a list gets the same number of lines | Gate G3: `max(height) − min(height) ≤ 8px` inside a ROW list |
| One accent, marking only what is clickable | The per-vertical colour became a state, not decoration six times over (#453, #460) |
| One ground for the whole document, footer included | Gate G8: the footer may not have a ground of its own (#454) |

The rules shipped. The evidence for them existed only in a conversation. This
file is that evidence, re-measured, so the next person to argue for a card has
something to read — and so does the next person to argue against one.

## Method

One pass per site: load, wait for the network to settle, scroll the full page
once so sections that mount on intersection are counted, scroll back, measure,
screenshot. Three families of number come out of it.

**Container idioms.** A painted box at least 120×60 is reduced to the tuple
`(border-radius, has-shadow, border widths, background)`. Two boxes with the same
tuple are the same idiom however differently they are used; two with different
tuples are two idioms however alike they look. The count is not a quality score —
it is how many box treatments a reader's eye has to learn on one page.

**Type, weighted by characters.** Every text node is attributed to its element's
resolved family, size and weight, and weighted by how many characters it carries.
An element-weighted count says a page has fourteen sizes; a character-weighted one
says which size the page is actually set in.

**Measure.** Box width ÷ the mean advance width of `a`–`z` **rendered in that
element's own font**, for every element owning 60+ characters of running text.
Never an em approximation: the nine faces here differ by more than 10% in average
advance, so an approximation would compare the CSS instead of the type. The
*dominant* measure is the value carrying the most characters — it answers "how
long is the line most of this page's text is set on", which the median does not.

### Known artifacts of the instrument

Stated so nobody re-derives them as findings:

- **Our own family reads as "Alexandria Symbols".** The instrument records the
  first name in the stack; ours is a three-glyph subset (`→ ↗ ≠`) fenced by
  `unicode-range` at `theme.css:47`. What renders is Alexandria, confirmed
  separately with `CSS.getPlatformFontsForNode`. Same for "JetBrains Mono
  Symbols". Read them as Alexandria and JetBrains Mono throughout.
- **37signals measures zero running text and zero containers.** Both are true
  readings, not failures: the page has no paragraph and no box.
- **37signals also measures zero grounds**, which *is* an artifact — its blue is
  painted on `html`/`body`, which the sweep excludes.
- **iA's sample is four elements.** Its measure of 24 characters is real for what
  little running text the home carries, but it is a thin sample; do not rank it.
- **Rittman's hero sits behind a cookie banner** in the capture.
- **Lazy images below the fold** do not paint in a beyond-viewport screenshot.
  Geometry is measured after a full scroll; the screenshots are not.
- **Sites change.** Test Double's page grew 555px between two runs an hour apart.
  Everything here is a snapshot of 2026-09-02.

## The table

Sorted by container idioms — the number this benchmark exists to argue about.

| Site | Faces | Body | h1 | h1÷body | Measure | Idioms | Shadows | Height | Footer ground |
| - | -: | -: | -: | -: | -: | -: | -: | -: | - |
| 37signals | 1 | 34px | 34px | 1.0× | *no prose* | **0** | 0 | 2298px | same as page |
| MarsBased | 2 | 16px | 86px | 5.4× | 57 ch | 6 | 1 | 5394px | same as page |
| thoughtbot | 3 | 20px | 50px | 2.5× | 62 ch | 6 | 1 | 7895px | same as page |
| Basecamp | 1 | 19px | 42px | 2.2× | 67 ch | 8 | 5 | 4604px | same as page |
| **serverstartup.io** | **2** | **20px** | **56px** | **2.8×** | **75 ch** | **8** | **1** | **3893px** | **same as page** |
| iA | 2 | 21px | — | — | 24 ch\* | 10 | 1 | 4765px | same as page |
| Test Double | 2 | 18px | 72px | 4.0× | 51 ch | 10 | 1 | 9359px | same as page |
| Simple Thread | 2 | 16px | 65px | 4.1× | 43 ch | 14 | 0 | 8921px | same as page |
| Rittman | 1 | 14px | 60px | 4.3× | 54 ch | 25 | 2 | 8423px | same as page |

Faces = families carrying ≥3% of the page's characters. Body = the size carrying
the most characters. \* = thin sample, see artifacts.

**Not one of the nine gives its footer a background different from the page's.**
That is the whole of rule 4, and it is unanimous.

## Per site

### 37signals — https://37signals.com/
The most radical page in the set and the cheapest to describe: one ground (Klein
blue), one face (Lab Grotesque), one size (34px, 90% of characters), 38 numbered
links, **zero containers, zero images, zero shadows, zero paragraphs**. Its `h1`
is the same size as its body text because the index *is* the page. 2298px tall —
less than a third of Test Double's.
*What we took:* nothing directly — a bare numbered index would have been the third
copy of the same six names on our home. What it settles is that a list of links
needs no box, at any scale of ambition.

### MarsBased — https://marsbased.com/
Six idioms, one shadow, black ground carrying 54% of painted area. The "Why
MarsBased?" section is five items of **a bold one-line title and exactly two lines
of body** — no box, no icon, no rule between them, in a half-width column. The
stats row (200+ / 12 / 5+ yrs / 5.2 yrs) is bare numerals separated by hairlines.
The only containers on the page are two `r32` slabs, both holding a *quoted* thing
(a case study). The red (#FF0031) never paints more than a fraction of a percent.
*What we took:* rules 1 and 2, almost literally. This is the model for the areas
block.

### thoughtbot — https://thoughtbot.com/
The one site here that carries three faces in quantity (PPMori 60% / Cosmica 25% /
JetBrains Mono 15%), and it works because the roles are absolute: Cosmica for the
`h1` only, mono for eyebrows and links, PPMori for everything read. Its `h2` is
**mono at 18px** — body size — over sections whose real title is set in the sans
below it. The services list is four underlined links in a `ul`; the case-study
links are mono with a trailing `→`.
*What we took:* the demotion of mono to eyebrows (#451), and the `→` on a row.

### Basecamp — https://basecamp.com/
One face for the entire page, 100% Graphik, `h1` only 2.2× the body — the flattest
type hierarchy in the set that still has a hero. Also the most shadows (5), all on
media and one video trigger. Measure 67 characters, the second-widest here.
*What we took:* the confidence that one face is enough.

### iA — https://ia.net/
Ten idioms, but they are one idiom repeated: `r11` tiles, shadowed when they are
products and flat when they are images. Two faces that are the same superfamily in
day and night cuts. Its home is a product grid, so its measure sample is thin.
*What we took:* that a repeated tile is one idiom, not ten.

### Test Double — https://testdouble.com/
Ten idioms across 9359px, the tallest page here. Body is 18px Source Sans at 78%
of characters; `h2` is **Source Code Pro 18px bold, uppercase** — the second site
to set section headings in mono at body size. The display face (Born Ready
Slanted, 72px) carries 1% of characters: it exists for the `h1` and nothing else.
*What we took:* corroboration for thoughtbot's mono eyebrow, from an unrelated
studio.

### Simple Thread — https://www.simplethread.com/
**The 2026-08-02 copy benchmark described three bare columns. That page is gone.**
Today the home is a vertical-specific landing (Transmission & Distribution) with
full-bleed photography, a white slab floating over a screenshot collage, 14 idioms
and eight grounds. It is the second-least disciplined page in the set.
Recorded because a benchmark that quietly drops a source it can no longer support
is worth less than one that says so: **rule 1 no longer rests on Simple Thread.**
It rests on thoughtbot, MarsBased and 37signals, which is enough.

### Rittman Analytics — https://rittmananalytics.com/
**25 idioms — three times the median of this set, and the counter-example the
whole benchmark turns on.** Its "What's your Data & AI Challenge?" section is four
cards, each with a screenshot, a title, three lines of grey 14px body and a
`Read More >` — which is, almost element for element, the shape our areas block
had before #453. Body text is 14px, the smallest here, and most of the page is
centred.
And it is the site the *copy* benchmark calls gold. That is the finding worth
carrying: **the best copy in the set sits in the weakest composition.** They are
separable, and one does not buy the other.

## serverstartup.io on the same instrument

Eight tuples, and they decompose into **three chromes a reader has to learn**:

| Tuple | × | Element | Reading |
| - | -: | - | - |
| `r0 · 1px top / 4px left · no ground` | 6 | `.area-row__link` | **ROW** |
| `r0 · 3px left · orange tint 8%` | 1 | `.s-cf__card` | **BLOCK** |
| `r0 · 3px left · ink tint 4%` | 1 | `.mantra` | **BLOCK** |
| `r4 · 1px all round` | 3 | team photographs | frame, not chrome — #482 |
| `r0 · ground #1e1e1e` | 2 | `.s-hero`, `.s-cta` | dark plate, not chrome |
| `rgba(0,0,0,.3)` / `.22` | 2 | menu backdrop, hero card | scrim, not chrome |
| `r0 · ground #fff` | 1 | `.ref-banner` | white on white — no chrome at all |

Where that puts us against the set:

- **Idioms: 8** — level with Basecamp, below iA, Test Double, Simple Thread and
  Rittman, above MarsBased and thoughtbot at 6. Mid-set, and the three that
  matter are the three the system declares.
- **Shadows: 1** — `--shadow-card`, and the sweep finds it on the sticky header,
  not on any box on the home. Only 37signals and Simple Thread use fewer.
- **Height: 3893px** — the second-shortest page in the set, behind 37signals'
  2298px and ahead of Basecamp's 4604px. The areas block going from six
  paragraphs to six rows is most of that difference.
- **Faces: 2** at 95% / 4% — Alexandria carries the page, JetBrains Mono the
  eyebrows. Same shape as Test Double and Simple Thread.
- **h1 ÷ body: 2.8×** — between thoughtbot's 2.5 and Test Double's 4.0.

### What the measurement found that the review missed

**Our measure is the widest of the nine.** 75 characters dominant, against a
reference range of 43 to 67:

    Simple Thread 43 · Test Double 51 · Rittman 54 · MarsBased 57
    thoughtbot 62 · Basecamp 67 · serverstartup.io 75

The widest single element is `.area-row__claim` at **82 characters** — inside the
block this plan rebuilt. The cause is structural rather than local: the one
column is ~840px, running text fills it, and nothing in the token set caps a line
of prose independently of the container that holds it. The classic range is
45–75 characters; we are at the top of it and past it in places.

This is not something the visual review saw, because a too-wide line looks like
nothing — it reads slightly worse and shows no symptom. Filed as **#481**, with
the three candidate answers and no recommendation: narrowing the column changes
every page's proportions, and that is a founder's call.

### The fourth tuple, resolved

`docs/design-system.md` used to list **photograph** among PANEL's surfaces, while
the three team photographs on the home are drawn as `1px border + --radius` only:
no `--panel-edge`, no `--shadow-card`. PANEL as declared appears on the service
pages' instrument (`service.css:330-344`) and nowhere else.

**The doc was the half that was wrong (#482).** A photograph is not a PANEL and
not a container: a container holds content, and an image *is* content. Its border
is a frame on the picture, not chrome around a box. So the instrument is right to
count `r4 · 1px all round` as a tuple and the system is right not to name it as a
chrome — they are counting different things, and the table above now says so.

The alternative was to give the three faces PANEL's other two traits, which meant
a 4px accent stripe above each head. That is a judgement about how the page looks,
and it was made by looking rather than by counting — which is the distinction this
whole file rests on.

The tree already had it right, so nothing moved in CSS. What ships instead is the
assertion that keeps it that way: `ci-check-layout.mjs` G19 measures every framed
photograph at three widths and requires four equal edges of one colour and no
shadow. Its plant gives one photograph a shadow and an accent edge and requires
both to be named.

## The four rules, and what each now rests on

1. **Delete the card.** thoughtbot lists its services as four underlined links in
   a `ul`; MarsBased as five title-plus-two-lines items with no container;
   37signals as 38 numbered links with no container at all. The one site that
   uses cards for exactly this job is Rittman, at 25 idioms. *No longer supported
   by Simple Thread, whose home changed.*
2. **Every item in a list gets the same number of lines.** MarsBased's five items
   are all title + two lines; thoughtbot's four service links are all one line;
   37signals' 38 entries are all one line. Nobody in the set ships a list of
   ragged paragraphs. Ragged item heights are the reason a list starts demanding
   boxes to tidy it up.
3. **One accent, marking only what is clickable.** MarsBased's red and Test
   Double's violet and acid green each paint a fraction of a percent of their
   page. The rule as applied here is *reserved*, not *only clickable* —
   MarsBased also sets one `h2` in red, and stating the rule precisely is better
   than overclaiming its source.
4. **One ground for the whole document, footer included.** Unanimous across all
   nine sites measured: no footer carries a background different from its page.

## Reproducing this

```bash
npx astro build && scripts/ci-local-stack.sh 8787
node scripts/bench-visual.mjs /tmp/bench-visual
```

Writes `bench.json` plus a viewport and a full-page screenshot per site. It is
research, not a gate: it reaches the public internet, the sites move under it, and
nothing in CI runs it. Re-run it before quoting any number here as current.

## What is judgement and not measurement

The instrument counts tuples, characters and pixels. It cannot tell whether a mark
looks like the brand, whether a photograph belongs, or whether six rows read as
confident or as thin. Every claim in "Per site" about what a section *reads like*
is a reading of a screenshot, and is offered as one.
