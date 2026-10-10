# design-sync notes

- The site is Astro, not React: this is a **style-only** sync (tokens-only DS). `.design-sync/pkg/` is a
  synthetic package: `index.js` exports nothing, `style.css` = `tokens/theme.css` (src/styles/theme.css from
  origin/main with its @font-face rules moved out) + `tokens/brand.css` (the openings' direction, approved
  2026-10-08). Regenerate `style.css` with `cat tokens/theme.css tokens/brand.css > style.css` after editing.
- `tokensGlob` only copies from a tokens package in node_modules, so tokens ship through `cssEntry` instead.
- Fonts: Alexandria and JetBrains Mono are variable woff2 from Google Fonts (latin); CMU Serif full cuts from
  bitmaks/cm-web-fonts; symbol/scene subsets copied from public/fonts.
- Validate with `--no-render-check`: there are no component previews to render.
- Project: https://claude.ai/design/p/7d9baea8-f1f8-46ab-a12e-29ddddb3fab8 (first sync 2026-10-08).
- Guidelines live at the package root (`.design-sync/pkg/*.md`, glob `*.md`): under a `guidelines/` subdir they
  land in `guidelines/guidelines/`. `current-state.md` tells the design agent to REFINE the live site.
- `.design-sync/current/` holds the live-site snapshots (`home.html`, `cdn.html`, `integracion.html`: CSS and
  module scripts inlined, photos un-lazied, fonts pointed at the project's own faces) and `screens/*.jpg`.
  The converter only copies .md guidelines, so after every build run
  `cp -R .design-sync/current ds-bundle/guidelines/current` before validating and uploading.
  Snapshots: `.design-sync/snap.cjs`, run from `current/` against the preview.
- With no React components the Design System pane is EMPTY (the founder opened it and saw nothing). Five
  hand-authored cards in `.design-sync/cards/` (Marca: colores, tipografía, cubo y sello; Estado actual: home,
  verticales) are copied to `ds-bundle/_preview/` after each build and registered with `register_assets`.
- Cards under `_preview/` were NOT indexed (manifest `cards: []`); they now live in `guidelines/cards/`
  (paths `../../styles.css`, `../current/screens/`).
- `pkg/brief.md` (→ guidelines/brief.md) is the full design brief compiled from every founder decision and
  rejection (memory + rules + this session), with the six epigraphs verbatim from the live pages. Keep it
  current: it is what makes Claude Design's agent design "with depth" instead of from scratch.
- After a recompile the manifest listed the 5 cards from guidelines/cards/ (verified 2026-10-08).
- Token kinds: Claude Design's check flagged mis-kinded tokens. `pkg/tokens/theme.css` (the COPY, not the
  site's) carries trailing `/* @kind <spacing|other|color|font> */` on 19 declarations (gradients and
  durations = other; column, rhythm and measures = spacing; text colours = color). Regenerate style.css after.
- `delivery/` keeps the approved Claude Design delivery of 2026-10-10 (`Home - nosotros.html` + `ns.js`) as the
  record behind #580. Its `ns.js` is a review harness (its own clock, `?t=&still=1`), not the site's motion: the
  site runs the carousel on the CSS clock. Measured while building #580: in the delivery the title's tail rendered in
  **Times Italic**, not Computer Modern — the CMU 500 italic face it asked for failed to load from the preview host
  and `font-synthesis: none` sent it to the system serif. Contrast numbers taken on the delivery are therefore
  Times numbers; the site's are measured on the real face.
