# Openings: the home band and the six vertical heroes

Approved by the founder on 2026-10-08. These eight principles bind every opening design (home frames,
vertical heroes, phone). Copy on the site is Spanish first; English is a re-expression, not a translation.

1. **One dark stage for every opening.** Same band (`--ss-band` #232724 with the haze `--ss-band-haze` at
   its far edge), same veil under the copy (`--ss-veil`), same grid, on the home's frames and on the six
   vertical heroes. Never a light or paper opening: photographs wash out on paper.
2. **Closed palette.** Ink, greys, paper (`tokens/theme.css`) plus the six vertical colours
   (`--ss-cdn`, `--ss-int`, `--ss-ia`, `--ss-gf`, `--ss-ec`, `--ss-bd`). Light is paper white
   (`--ss-light`) or a vertical colour. Never gold, warm light, new hues, or decorative gradients.
3. **Every frame has a light source.** A photograph brings its own (a lantern, sky, water). The brand frame
   ("nosotros") must bring one too: a flat dark frame reads as sad.
4. **The mark never jumps.** The cube lives in one place on every frame: the seal at the band's left edge
   (the logo's cube drawn large and faint, partly off the left edge). On the brand frame it is the
   protagonist, lit; on a vertical's frame it recedes to a faint outline in that vertical's colour.
5. **One gesture per frame.** One subject (a photograph or the cube) and its colour layer. Minimalism in the
   spirit of cloudflare.com: one colour, one mark, air. No glass, no gradient text, no boxes or empty cards,
   no mottos or equations in the opening, no stock photos, no team photos.
6. **A two-voice title.** Head in Alexandria bold, white; tail in Computer Modern italic in the frame's colour
   (`.ss-title` / `.ss-title__tail`, colour via `--ss-tail`; grey `--ss-muted-on-band` on the brand
   frame). On a band, text colours use the `--ss-*-on-band` tints (each >= 4.5:1).
7. **A balanced composition.** The copy keeps a fixed anchor (top left of an 840 px column); the subject
   fills about 86 % of the band's height, sits on its floor and runs off its right edge. Nothing of the art
   touches a letter. No layout with everything stacked at the top and an empty lower half.
8. **One clock, sober motion.** 0-2 s the subject alone; 2-4.5 s the light or the colour layer comes up;
   at rest by 8 s. Soft dissolves between frames. No loops, no bounce, nothing moving after 8 s.

## The home carousel

Frame order: nosotros (brand) -> CDN, WAF y seguridad edge -> Integración de sistemas -> Inteligencia
artificial -> Desarrollo greenfield -> Comercio electrónico -> Big Data & Cloud Analytics. A rail of
labelled stops at the band's foot; a card bottom right names the vertical (one line, never wrapped) and
carries that vertical's epigraph. The title's words never change between frames; only the tail's colour.
