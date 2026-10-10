# Server Startup — how to design with this system

**Start from the live site.** Read `guidelines/brief.md` first (the full design brief: every decision and
rejection so far), then `guidelines/current-state.md`; refine the snapshots in
`guidelines/current/` (the live home and vertical pages); never redesign from scratch.

This is a **style-only** design system: the site (serverstartup.io) is built with Astro, so there are no
importable React components. Build layouts with plain elements and style them ONLY with these tokens and
classes. Read `_ds_bundle.css` (the site's `theme.css` followed by the openings' tokens) and
`guidelines/openings.md` before designing.

## Setup

`styles.css` loads everything (`fonts/fonts.css` and `_ds_bundle.css`). Nothing else is needed; there is no provider.

## Styling idiom: CSS custom properties

- Faces: `var(--font-family)` (Alexandria, body and headings), `var(--font-family-mono)` (JetBrains Mono:
  labels, the wordmark, code), `var(--font-signature)` (Computer Modern, the italic tail and the equation).
- Light ground: `var(--color-text)` #1E1E1E on paper; muted text `var(--color-text-muted)`.
- Spacing: `var(--space-1)` … `var(--space-9)` (4, 8, 16, 24, 32, 40, 64, 80, 120 px). Radius `var(--radius)`
  (4 px, the only radius; `var(--radius-pill)` for toggles only). Card shadow `var(--shadow-card)`.
- Column: `max-width: var(--container-max)` — ONE column; everything ends at its right edge.
- Openings (dark stage): `.ss-stage` (background `var(--ss-band)`), veil `var(--ss-veil)`, light `var(--ss-light)`.
- Vertical colours: `var(--ss-cdn)`, `var(--ss-int)`, `var(--ss-ia)`, `var(--ss-gf)`, `var(--ss-ec)`,
  `var(--ss-bd)`; for TEXT on the band use the `-on-band` tints (`var(--ss-ia-on-band)` …).
- Two-voice title: `.ss-title` with `<span class="ss-title__tail">`; set `--ss-tail` to the frame's on-band tint.

## Hard rules

Dark openings only; closed palette (no gold, no new hues, no decorative gradients); one subject per frame;
no glass, boxes, mottos or stock photos in an opening; nothing touches a letter; one 8 s clock, no loops.
Section headings inside main content start with a tilde (`~ `) in the same colour.

## Example

```html
<section class="ss-stage" style="min-height:100vh;padding:var(--space-9) 0">
  <div style="max-width:var(--container-max);margin:0 auto;padding:0 var(--space-4)">
    <h1 class="ss-title" style="--ss-tail:var(--ss-cdn-on-band)">Ingeniería de software,
      <span class="ss-title__tail">de la arquitectura a producción</span></h1>
    <p style="font-family:var(--font-family);font-size:var(--text-body);color:var(--ss-ink-on-band)">
      Más de veinte años en comercio electrónico, integración de sistemas y datos.</p>
  </div>
</section>
```
