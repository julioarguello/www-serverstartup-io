# Verification scripts for Claude Design deliveries and the home

Puppeteer scripts used to review the home: on 2026-10-09/10 against the Claude Design deliveries, and since #580
against the site itself. Each takes its target as the first argument (or `U=`), and works on both:

- the delivery on a local mirror — `python3 -m http.server 8791` in a folder holding the project's files, then
  `http://localhost:8791/entregas/nosotros/Home%20-%20nosotros.html` (its `ns.js` takes `?t=<ms>&still=1`);
- the site — a local stack (`scripts/ci-local-stack.sh 8787`) or the preview URL. The carousel runs on the CSS
  clock there, so `frame.cjs` pins a frame through the Web Animations API: every animation in the band and the
  header's edge set to one time and paused, the same move the rail's stops make.

- `overlap-h.cjs`: whether the card's box intersects the text boxes of the h1 and the lead, and whether the cube's
  drawing reaches any letter in the band, frame by frame, across short and narrow viewports. Exit 1 on either.
- `contrast.cjs`: the WCAG ratio of every text in the band on its real pixels — head, tail, lead, card (index and
  captions) and rail — at 1440 × 900 and 393 × 852. It hides the text, screenshots each text box, and takes the
  95th-percentile brightest backing luminance. Exit 1 under 4.5:1.
- `lines.cjs`: how many lines a candidate card line renders to, by injecting it into the real card.
- `copy.cjs`: dumps the rendered title, index, card lines, rail, section order, «Cómo trabajamos» items and the
  mantra, for a verbatim comparison with `pkg/brief.md` (back in its markdown-lite: `code`, *italics*).

All of them use the project's own `puppeteer` (run them from a checkout with `node_modules`).

```bash
node .design-sync/verify/overlap-h.cjs https://www-serverstartup-io-preview.serverstartup-s-partner-demo-account3612.workers.dev/
node .design-sync/verify/contrast.cjs https://www-serverstartup-io-preview.serverstartup-s-partner-demo-account3612.workers.dev/en
```
