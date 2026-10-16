# WCAG-EM evaluation — 2026-10-16

> **Status: prepared, not yet signed.** Steps 1–3 are complete, and step 4 is complete for every success
> criterion a machine or a script can decide. The criteria that need a person are listed in the
> [worksheet](#worksheet-for-the-evaluator-of-record) with what to do. **Evaluator of record: pending.**
> Until that person signs the worksheet, this is not a conformance claim and the accessibility statement
> must not cite it as one (#506; #310 argues why).

Prepared for issue #505 by Claude (an AI model) against `main` at `6709d0f`, plus the fixes this
document's PR makes, on the production build served by the local stack. Method:
[WCAG-EM](https://www.w3.org/TR/WCAG-EM/), five steps. Target: **WCAG 2.1 level AA**, the level
UNE-EN 301549:2019 requires under Real Decreto 1112/2018 (arts. 5–6). The site builds to 2.2; the
report is made at 2.1 AA.

## How it was run

```bash
rm -rf .wrangler && npx astro build && scripts/ci-local-stack.sh 8787
node docs/audits/2026-10-16-wcag-em/sweep.mjs http://localhost:8787 <sha>   # steps 3 and 4 (scripted part) → sweep.json
node scripts/ci-check-a11y.mjs http://localhost:8787                       # the CI gate, with the sections this evaluation added
node scripts/ci-check-engines.mjs http://localhost:8787                    # WebKit and Android's Chromium, reduced motion
```

`sweep.json` beside this file is the raw output of the first command for `6709d0f`.

## Step 1 — Scope

| In scope | Out of scope, and why |
| :-- | :-- |
| Every public route the seed declares, both locales (the sitemap's 28) | `/_emdash/admin` — the CMS's authoring interface, not part of the public site |
| Search, with results, without results, empty (`/search`, `/en/search`) | `/preview/…` — editorial preview behind the CMS |
| The 404 page, both locales | `/api/whoami`, `/sitemap.xml` — data, not web pages |
| | `/posts`, `/tag/…`, `/category/…`, RSS — the blog is off: no posts in the seed, every route answers 404 (#340) |

Technologies relied upon: HTML, CSS, JavaScript (the scenes and the rail work without it, at rest), SVG,
`<canvas>` (two scenes and one reference list). No video, audio or third-party embed was found in the
sample.

## Step 2 — Explore

| Templates | Functionality | Technologies by page |
| :-- | :-- | :-- |
| Home (carousel), vertical (six scenes), about, contact, references, deconstruyendo, statement, legal, search, 404 | Menu (`<dialog>`, the die), the home's carousel with its rail and pause, each vertical's opening with pause and replay, search, language switch, skip link, the visitor's echo (CDN) | Canvas scenes: Big Data, CDN · SVG over photographs: greenfield, integration · CSS animation: all bands, the header's cursor and edge |

## Step 3 — Sample

26 structured pages, each with its reason, and a random 10 % of that (`ceil(2.6)` = 3 pages) drawn from
the rest of the scope with a generator seeded by the evaluated commit, so the same commit draws the same
pages for anyone who re-runs `sweep.mjs`.

| Page | Why |
| :-- | :-- |
| `/`, `/en` | home: the carousel, its rail and pause |
| `/big-data-cloud-analytics` | canvas scene (the dusk), the mantra |
| `/cdn-waf-seguridad-edge-cloudflare` | canvas scene (the radar), the visitor's echo, the reference list drawn on a canvas |
| `/comercio-electronico` | the shop mock-up |
| `/desarrollo-greenfield` | SVG elevation over a photograph |
| `/inteligencia-artificial` | the machine's view, the pull-request instrument |
| `/integracion-de-sistemas`, `/en/systems-integration` | the bridge, live connector labels; English variant |
| `/quienes-somos`, `/en/about-us` | team photographs, the boot console |
| `/contacto`, `/en/contact` | the only page listing ways to reach the company |
| `/referencias`, `/en/references` | logo wall |
| `/deconstruyendo`, `/en/deconstructing` | the review panel and its chips |
| `/accesibilidad`, `/en/accessibility` | the statement and its channel (art. 15) |
| `/aviso-legal`, `/en/privacy-policy` | long legal Portable Text |
| `/search?q=cloudflare`, `/en/search?q=zzzqqq`, `/search` | search: results, none, empty |
| `/no-existe`, `/en/no-such-page` | 404 |
| `/en/big-data-cloud-analytics`, `/en/e-commerce`, `/en/greenfield-development` | random 10 % (seed `6709d0f`) |

## Step 4 — Evaluation

Methods: **CI** — a gate already blocking every change (cited, not re-run by hand) · **Script** — decided by
`sweep.mjs` or a probe recorded below · **Person** — needs the evaluator of record. Status: ✅ pass ·
🔧 fixed by this document's PR (and now gated) · ❌ non-conformance · ➖ not applicable · 👤 needs the
evaluator.

| SC | Lvl | Method | Result | Status |
| :-- | :-: | :-- | :-- | :-: |
| 1.1.1 Non-text content | A | CI (axe) · Script · Person | Every `<img>` carries `alt`; scenes are decorative and hidden from assistive technology. **The CDN page's reference list is drawn on a `<canvas>` inside `aria-hidden`: the client names are readable on screen and absent for a screen reader.** The quality of each `alt` needs a person | ❌ / 👤 |
| 1.2.1 Audio-only and video-only | A | Script | No `<video>`, `<audio>` or `<iframe>` in the sample | ➖ |
| 1.2.2 Captions (prerecorded) | A | Script | Same | ➖ |
| 1.2.3 Audio description or alternative | A | Script | Same | ➖ |
| 1.2.4 Captions (live) | AA | Script | Same | ➖ |
| 1.2.5 Audio description | AA | Script | Same | ➖ |
| 1.3.1 Info and relationships | A | CI (axe, html-validate, Nu) · Person | Structure validates; one `h1` per page (headings outline in `sweep.json`). Whether each structure matches its meaning needs a person | 👤 |
| 1.3.2 Meaningful sequence | A | Person | Reading order through the bands' layers (copy, scene, controls) | 👤 |
| 1.3.3 Sensory characteristics | A | Person | No instruction found relying on shape or position; confirm | 👤 |
| 1.3.4 Orientation | AA | Script | Landscape phone: no horizontal overflow on any sampled page | ✅ |
| 1.3.5 Identify input purpose | AA | Script | The only input is search, which collects nothing about the user | ➖ |
| 1.4.1 Use of colour | A | Script · Person | The rail's current stop also changes weight (700 against 500); body links are underlined | ✅ |
| 1.4.2 Audio control | A | Script | No audio | ➖ |
| 1.4.3 Contrast (minimum) | AA | CI (axe; ink on the hero photographs and the open menu, measured on pixels) | Green on every route | ✅ |
| 1.4.4 Resize text | AA | CI (reflow) | Browser zoom (technique G142); reflow at 320 px — 400 % — is gated | ✅ |
| 1.4.5 Images of text | AA | Script | **The CDN page's reference list is text rendered as an image** (logos are exempt as logotypes) | ❌ |
| 1.4.10 Reflow | AA | CI | 320 px on the widest routes, no horizontal scroll | ✅ |
| 1.4.11 Non-text contrast | AA | Script → CI | **At rest, on a device with hover, the bands' pause read 1.68:1 (e-commerce) and 2.63–2.94:1 (three home frames, integration).** Rest opacity 35 % → 70 %: minimum 4.20:1 on every band and frame; a gate section now measures it | 🔧 |
| 1.4.12 Text spacing | AA | Script | The four overrides applied at 1440 and 390: no visible text lost. What overflows is clipped by design and duplicated elsewhere: screen-reader-only text, decorative scene labels, the header's path ellipsis | ✅ |
| 1.4.13 Content on hover or focus | AA | Script · Person | No custom hover content; the mantra's squares use native `title` | ✅ / 👤 |
| 2.1.1 Keyboard | A | CI | Every route traversed by keyboard | ✅ |
| 2.1.2 No keyboard trap | A | CI | The menu traps and returns focus as intended; nothing else holds it | ✅ |
| 2.1.4 Character key shortcuts | A | CI | The single-key search shortcut is scoped | ✅ |
| 2.2.1 Timing adjustable | A | Script | No time limit | ➖ |
| 2.2.2 Pause, stop, hide | A | Script → CI | Every band's motion has a pause. **The header's cursor, the mark's and the about console's blinked without end; the home's pause left the header's edge cycling.** Cursors now blink four times and rest; the pause stops the edge; a gate section asserts nothing runs at 6 s once the pause is pressed | 🔧 |
| 2.3.1 Three flashes | A | Script | Fastest periodic change: the bridge's chomp, 0.26 s per half cycle (under 2 per second); all others slower | ✅ |
| 2.4.1 Bypass blocks | A | CI | Skip link reachable and visible on focus | ✅ |
| 2.4.2 Page titled | A | Script | Every page titled; titles distinct except Big Data, identical in both locales (a brand name) | ✅ |
| 2.4.3 Focus order | A | CI · Person | Reachability is gated; whether the order is logical needs a person | 👤 |
| 2.4.4 Link purpose (in context) | A | Script · Person | One text, two targets: «Cloudflare» links the CDN page and cloudflare.com from different paragraphs | 👤 |
| 2.4.5 Multiple ways | AA | Script | The menu and search | ✅ |
| 2.4.6 Headings and labels | AA | Person | Whether each heading describes its section | 👤 |
| 2.4.7 Focus visible | AA | CI | Every focus visible and never obscured | ✅ |
| 2.5.1 Pointer gestures | A | Script | Every control is a single tap; no path or multipoint gesture | ✅ |
| 2.5.2 Pointer cancellation | A | Script | Every handler listens for `click` (the up-event) | ✅ |
| 2.5.3 Label in name | A | Script → CI | **On English pages the switcher showed «ES» and was named "Switch to the Spanish version".** The name now starts with the label shown, in both locales; a gate section checks it | 🔧 |
| 2.5.4 Motion actuation | A | Script | No device-motion feature | ➖ |
| 3.1.1 Language of page | A | Script | `lang` matches the locale on every page | ✅ |
| 3.1.2 Language of parts | AA | Person | No `lang` on parts; Spanish pages carry English technical terms and product names (excepted), confirm nothing longer | 👤 |
| 3.2.1 On focus | A | CI · Person | Traversal never navigated on focus | ✅ |
| 3.2.2 On input | A | Script | Search submits on Enter; nothing changes context on input | ✅ |
| 3.2.3 Consistent navigation | AA | Script | One header and footer component on every page | ✅ |
| 3.2.4 Consistent identification | AA | Script · Person | Same components, same names | ✅ / 👤 |
| 3.3.1 Error identification | A | Person | Search's empty and no-result states | 👤 |
| 3.3.2 Labels or instructions | A | CI (axe) · Person | Search has a label («Buscar artículos») — it searches pages too; confirm the wording | 👤 |
| 3.3.3 Error suggestion | AA | Script | No input is validated | ➖ |
| 3.3.4 Error prevention (legal, financial, data) | AA | Script | No transaction or submission of data | ➖ |
| 4.1.1 Parsing | A | CI (html-validate, Nu) | 0 errors | ✅ |
| 4.1.2 Name, role, value | A | CI (axe) · Script | Every control named; the rail's stops are buttons. They do not expose which frame is current (good practice, not required for "go to" buttons) | ✅ |
| 4.1.3 Status messages | AA | Script | Search answers with a new page, not an in-place update | ➖ |

## Step 5 — Findings

**Fixed by this document's PR, each with a gate:** 1.4.11 (the pause at rest), 2.2.2 (endless blinks, the
header's edge), 2.5.3 (the switcher's name).

**Non-conformance, for the statement under art. 15.2 a)** — "una explicación sobre aquellas partes del
contenido que no sean accesibles y las razones de dicha inaccesibilidad":

- 1.1.1 and 1.4.5 — the reference list on `/cdn-waf-seguridad-edge-cloudflare` and its English page is
  drawn on a canvas and hidden from assistive technology, so that the names stay out of the page's text
  and of every crawler. Fixing it means giving up that, or dropping the list; it is the owner's decision,
  not the evaluator's.

**Not decided here:** the 👤 rows, in the worksheet below.

## Worksheet for the evaluator of record

On the sample above, with the local stack or the preview. Write the result and the date beside each line.

1. **Screen reader**, VoiceOver on macOS or iOS and TalkBack on Android, on `/`, one vertical, `/contacto`,
   `/accesibilidad` and `/search?q=cloudflare`: everything readable on screen is reachable and makes sense
   in the order it is read (1.3.1, 1.3.2, 2.4.3).
2. **Images**: each `alt` says what the image is for, on `/quienes-somos`, `/referencias` and the home
   (1.1.1). The 404's hidden sentence describes decoration only.
3. **Headings and links**: each heading describes its section, and each link's purpose is clear from its
   paragraph — «Cloudflare» in particular (2.4.4, 2.4.6).
4. **Language**: no English passage longer than a term or a name on the Spanish pages (3.1.2).
5. **Search**: the label's wording, and what the empty and no-result states say (3.3.1, 3.3.2).
6. **Instructions and hover**: nothing relies on shape, position or colour alone; nothing appears on hover
   that cannot be dismissed (1.3.3, 1.4.13).
7. **Consistency**: the same component carries the same name across pages (3.2.4).
8. **Sign**: name, date, the sample used, and the decision on the 1.1.1 / 1.4.5 non-conformance.

## Reference: measurements

- Measured 2026-10-16 against the local stack on `6709d0f`: the bands' pause at rest, glyph against its own
  ground, at 35 % opacity — e-commerce 1.68:1, integration 2.87:1, home frames 2, 3 and 5 at 2.81, 2.94
  and 2.63:1. At 70 %: 4.20:1 to 11.08:1 on every band and home frame.
- Measured 2026-10-16 against the same: running at 6 s with no way to stop them — `brand-blink` and
  `site-mark-blink` on every page, `s-boot-blink` on both about pages, `site-header-edge` on both homes
  after their pause was pressed.
- Measured 2026-10-16 against the same: `/en/*` switcher «ES» named "Switch to the Spanish version"; the
  Spanish one, «EN» named "Cambiar a la versión en inglés", contained its label only through the
  preposition "en".
