# Review of the latest delivery: «Deconstruyendo - B mapa v5» (2026-10-20)

Rendered locally from the project's files (`dc3.css`, `dc5.css`, `dc11.css`, `dc3.js`, `img/`) with
Puppeteer, at 1440 × 900 and with device emulation at 390 × 844 and 360 × 780.

## It meets the brief

- **Structure.** The isometric model in the dark opening, then a sticky index of the layers. The four
  Cloudflare layers come first (network, cache, compute, data), then the two inside the Worker (EmDash,
  presentation), then the three cross-cutting ones (content, delivery, quality). Last come «El taller,
  abierto» and the existing closing band.
- **Reads fast.** About 700 words with the details closed. Each layer shows a figure and one line; the
  facts sit inside «Detalle y pruebas», together with a count of the rows that are «por confirmar».
- **Facts.**
  - The text follows `deconstruyendo-hechos.md` with the panel's wording.
  - None of the «Never claim» items appear. The only "migración" is D1's migrations.
  - Numbers: 0, 7, 6, 23, 14, 28, 32 and ≥95 · 100 · 100 · 100 (dated, "en CI contra una copia local").
- **Links.** 67 links go to the repository and every one resolves on origin/main. The rest point to
  developers.cloudflare.com, docs.emdashcms.com and the Cloudflare blog.
- **Credits.** Each photograph carries author, Commons, its licence (BY-SA 4.0 / 2.0) and the changes.
- **Overflow.** No horizontal scroll at 1440, 390 or 360.
- **Contrast.** No text on a solid background under 4.5:1. The script flagged the dark opening, but that
  is a false positive: its background is not a solid colour the script can read, and visually the text
  reads well there.

## To fix

1. **The H1 does not fit on a phone.** «Deconstruyendo» ends at x = 388 px: it is cut off at 360 px, and
   at 390 px it has no 16 px gutter. Fix: a `clamp()` so the word fits inside the gutter at 360.
2. **The two photographs in «Presentación» drag in pieces of the openings' copy**: «le red un / rse con»
   and «ne de otro» are cut-off words. Fix: crop to the art side only, or use the bare photographs.
3. **The ledger shows internal ids and line numbers**: «3.3», «9.2», «l. 28–50». The ids belong to our
   spec. Line numbers go stale with the first edit to the file, and no gate would notice. Fix: keep the
   file link and drop both.
4. **Five empty image slots** need real captures:
   - Cloudflare's SSL/TLS panel;
   - Cloudflare's cache statistics: its own caption says the figure is not in the facts file;
   - GitHub, the `seed/` folder;
   - GitHub Actions, the preview deploying itself;
   - the Lighthouse report.

   Proposal:
   - Replace the two Cloudflare-dashboard slots with console figures (`curl -I`, real headers measured
     on the site), to be added to the facts file. That avoids exposing the account's panel and needs no
     login.
   - Capture the other three from the public repository and from CI run 38889005508 at implementation.
5. **For the founder: dark panels.** Every layer figure is a dark panel. The site's rule keeps dark for
   consoles and the closing band. It reads well and it is consistent, but it is a deliberate exception;
   confirm it or ask for paper.

Fixes 1–3 are implementation details and need no new round. Fix 4 needs the founder's yes.

## Files

- The delivery in the project: `entregas/deconstruyendo/Deconstruyendo - B mapa v5.html` with `dc3.css`,
  `dc5.css`, `dc11.css`, `dc3.js`, `image-slot.js`, `img/`.
- Earlier versions, which are not the base: `A láminas`, `B mapa`, `B mapa v2`–`v4`.
