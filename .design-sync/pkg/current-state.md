# Start from the live site — refine, do not redesign

The founder wants the existing home and vertical openings REFINED, not replaced. Every design starts from
the files in `guidelines/current/` and changes only what the list below asks for.

## What is there

- `guidelines/current/home.html` — the live home (snapshot 2026-10-08), runnable: dark band, six
  photographs dissolving on a 36 s clock, rail of chapters, card bottom right, seal cube at the left edge,
  then the sections below. Edit this file's markup and CSS rather than writing a new page.
- `guidelines/current/cdn.html`, `guidelines/current/integracion.html` — two vertical pages (snapshot; their
  animated layers do not run outside the site — see the screenshots for the end state).
- `guidelines/current/screens/` — the live state as images: `home-frame-1-cdn.jpg` … `home-frame-6-bd.jpg`
  (the six home frames), `vertical-<cdn|int|ia|gf|ec|bd>.jpg` (the six vertical openings at rest, with their
  live layers), `phone-home.jpg`, `phone-cdn.jpg`.

## Keep

The dark band, the six photographs and their order, the vertical openings' scenes and live layers, the
header, the rail, the card position, the seal position, the 840 px column, the copy.

## Refine (the founder's notes, 2026-10-07/08)

1. **Add a brand frame before the lighthouse** ("nosotros"): sober but striking, a qualitative leap. The cube
   in the SEAL position (left edge), lit in paper white (`--ss-light`), on the same band. Not all black,
   not gold, not a box, no motto or equation. It must not feel sad: it needs a light source.
2. **Two-voice title** on every frame and vertical: tail in Computer Modern italic (`.ss-title__tail`),
   coloured by the frame (`--ss-tail`), switching in step with the photograph — never lagging.
3. **The card**: the vertical's name on ONE line (there is room); under it, the vertical's own epigraph
   (the quotation that opens each vertical page, e.g. Cloudflare's castle-and-moat line on CDN) instead of
   the current one-line pitch.
4. **Below the band**: "Con quién hemos trabajado" loses its heading — the logos sit just before the footer.
   The Cloudflare partner block stays (it has presence). "Calidad y rendimiento" goes as it is (it reads as
   a stray strip). The motto stays on the site but not in the opening. "Áreas de especialización" needs a
   better treatment.
