# Design brief — /deconstruyendo, "Deconstruyendo esta web" (issue #535)

Read this file, then `guidelines/deconstruyendo-hechos.md`. The second file holds the facts, each one
verified by an adversarial panel against the code, the deployed site, the Cloudflare API and the official
docs. The founder's words settle anything this brief leaves open; they are quoted in Spanish, as he said
them. `guidelines/brief.md` §2, §4 and §7 (palette, type, rejected patterns) apply to this page too.

## 1. What the page is for

The page shows **how the whole site is built**, from its foundations up: the Cloudflare network, the cache,
the Worker, the data, the CMS (EmDash), the content, the presentation, the delivery pipeline and, last,
the quality mechanisms. The reader is the senior architect described in `brief.md` §1. He trusts what he
can check, and every claim on this page can be checked in the public repository.

Founder, 2026-10-16:

- "Que deconstruyendo la web explique su arquitectura … los detalles también de las animaciones … un poco
  todo lo que hemos visto, dándole mucho empaque."
- "Los quality gates."
- "Ahora mismo la estructura me parece muy aburrida … no me gusta nada."
- "A lo mejor sobra mucho texto … como una secuencia de imágenes, y una breve descripción … algo que se lea
  rápido."
- "Si explico una arquitectura, creo que lo mejor es explicarla desde sus cimientos … y al final terminaría
  con los mecanismos de calidad."
- "Nombrar, como parte de estas capas, todo aquello que usamos de Cloudflare." "Sería interesante un
  diagrama … no es una arquitectura simplemente, sino todo lo que involucra esta web."
- "Le daré importancia a EmDash … todo con mucho enlace, sobre todo la parte de EmDash, la parte de
  Cloudflare. No en vano somos partners de Cloudflare."
- On the six openings: "las aperturas es lo de menos … las podemos nombrar." They are one frame in the
  presentation layer, not a chapter.
- Numbers: "solo aquellas cifras que sean positivas … antes de poner una cifra, valora si es algo de lo
  que presumir o no."
- "Este documento tiene que asumir que no hay web vieja." Never compare with an earlier site, never
  mention a migration, never write a hostname.

The live page today is `guidelines/current/screens/deconstruyendo-actual.jpg` (1440 px, full height). It
is the thing being replaced: five prose sections, each with an instrument card. Its intro and its closing
call to action may survive; nothing else needs to.

## 2. Structure (decided)

1. **Title and a one-line lead.** H1 «Deconstruyendo esta web». Lead (draft): «Cómo está hecha, capa a
   capa: de la red de `Cloudflare` a las comprobaciones que pasa cada cambio. Cada afirmación enlaza al
   fichero que la prueba.»
2. **The map.** One figure of everything the site involves:
   - people on the left: visitor, editor, team and AI agents;
   - Cloudflare in the middle, in layers: network → cache → Worker → data, with EmDash inside the Worker;
   - the workshop below: GitHub, the public repo, Actions with 23 gates, `wrangler` deploys to preview and
     to production;
   - what was used once, at design time, on the right: Wikimedia Commons, SeedVR2, Workers AI with FLUX.2,
     Google Fonts at build.

   The figure may be informal, but it must be exact. Every box in it is a row in the facts file. Draw it
   as a technical drawing in ink on paper. Cloudflare pieces are marked in Cloudflare orange.
3. **Nine layers, bottom-up**, in the facts file's order: 1 La red · 2 La caché · 3 Cómputo · 4 Datos ·
   5 El CMS: `EmDash` · 6 Contenido · 7 Presentación · 8 Entrega · 9 Calidad. Each layer is one plate: a
   figure that shows it, then a short ledger of its facts. A ledger line is one sentence, its link to the
   repo file, and its link to the official docs where the facts file gives one. The panel's wording is the
   ceiling: shorten it, never strengthen it.
4. **Closing.** «El taller, abierto» (the public repo, linked), then the site's existing closing band
   («Hablemos de ingeniero a ingeniero.»), unchanged.

**Every row of the facts file goes on the page in this round**, including the ones gated `WHEN`. The
founder cuts after seeing them all. Mark gated rows with a small `pendiente` tag so he can see which they
are.

## 3. What each layer's figure can be

Use real assets where they exist. Draw the rest as figures (SVG/HTML) whose every label and number comes
from the facts file. Never invent a number, a host name, a header value or a log line.

| Layer | Figure | Asset |
| --- | --- | --- |
| 1 La red | A request's path: visitor → DNS (DNSSEC) → TLS 1.3 + ECH → Custom Domain → Worker | draw |
| 2 La caché | The two tiers in front of the Worker; HIT skips the Worker; publish → purge by tag | draw |
| 3 Cómputo | The Worker: Astro SSR, the middleware's 7 headers, Static Assets beside it, a plugin in its own Dynamic Worker behind a bridge | draw |
| 4 Datos | Four stores, four jobs: D1, Workers KV, Images, R2 | draw |
| 5 EmDash | The editor (screenshot); passkeys; EmDash as an OAuth server with an AI agent on its MCP server | `current/deconstruyendo/emdash-editor.webp` |
| 6 Contenido | `seed/seed.json` → an empty database → the site, twelve times in parallel; ES ↔ EN pairs | draw |
| 7 Presentación | The token sheet. One opening taken apart (photo → without the bridge → elevation → scene). 0 third-party requests | `current/deconstruyendo/puente-foto.webp`, `puente-sin-puente.webp`, `puente-alzado.webp`, `current/screens/vertical-int.jpg`; the six `vertical-*.jpg` for a strip |
| 8 Entrega | Pull request → 23 gates on workerd → preview deploys itself → production by hand | draw |
| 9 Calidad | The gates as a board: 23, 14 with a planted defect, Lighthouse ≥95/100/100/100 (dated), 32 routes under axe, 3 engine profiles, 28 routes frozen | draw |

A terminal or CI-log figure may use the dark console chrome (`.inst--dark`), because that is the machine's
voice. Everything else stays on paper.

## 4. Cloudflare and EmDash: names and links

- **Official names only, exactly as the facts file spells them:** Workers, Workers Cache, Workers Static
  Assets, Custom Domains, Dynamic Workers, D1, Workers KV, R2, Images, Workers AI, workerd, wrangler,
  Encrypted Client Hello, DNSSEC.
- **Cloudflare products in code font**, the site's convention (`Cloudflare`, `Workers`, `D1`, `R2`…).
  First mentions link to developers.cloudflare.com, to the URLs the facts file gives. Mark Cloudflare in
  its orange (`--ss-cdn`), never as a logo wall. The founder's line for the brand: "ellos en naranja y
  nosotros en negro y gris".
- **EmDash gets prominence:** its own plate, links to the Cloudflare announcement, Cloudflare's own blog on
  EmDash, the GitHub repo and docs.emdashcms.com. The OAuth + MCP row is the most striking fact on the
  page. Give it room.
- **Two kinds of link on every ledger line:**
  - `repo`: the file, in mono, with the site's dashed underline;
  - `docs`: the official page.

  External links open in a new tab.

## 5. Constraints (hard)

- **Tokens.** The site's tokens only (`styles.css`): one radius, closed palette, no gradients, no glass,
  no decorative rules.
- **One column.** Everything ends at the column's right edge (`--container-max`, 840 px, scaling to
  1040 px). Figures take the column's full width.
- **Headings.** Section headings in main open with «~ ». H1 in sentence case, with no final period.
- **Copy.** Spanish, in the voice of `brief.md`: no marketing, no metaphors, no exclamation marks.
  Anglicisms in *italics* (*middleware*, *passkeys*, *plugin*, *pull request*, *hash*). Stack and product
  names in `code`. Short: the founder wants it to read fast.
- **Numbers.** Only those in the facts file's numbers table.
- **Never claim** anything in its "Never claim" list. In particular: no HTTP/3, no Turnstile, no
  Access, no WebMCP, no llms.txt, no read replicas.
- **Photographs.** Every one shown carries its credit as a small caption, from the credits table at the end
  of the facts file. Say the changes: «restaurada; puente retirado con IA».
- **Contrast and overflow.** Every text ≥ 4.5:1 on what is behind it. No horizontal scroll and nothing cut
  at 360, 390 and 1440 px wide.
- **Motion.** Optional and quiet. A plate may assemble once as it enters the viewport (≤ 1.2 s), with no
  loops; under `prefers-reduced-motion`, the end state only.

## 6. What to deliver (this round)

Two whole-page variants of the same content, so that the founder chooses by seeing them. Each file holds
the complete page at 1440 px and works at 390 px.

- **A · «Láminas».** The map at the top. Then nine numbered plates, one per layer: a full-column figure,
  then its ledger. Read top to bottom like a teardown.
- **B · «El mapa que se enciende».** The map is the spine. On desktop it stays in view, small, while the
  plates scroll past, and the current layer lights up on it. On phones it collapses into the plates.
  Native scroll only: never hijack the scroll.

Files: `entregas/deconstruyendo/Deconstruyendo - A láminas.html` and `entregas/deconstruyendo/Deconstruyendo
- B mapa.html`. List anything you could not meet.

## 7. Credits for the photographs you may show

| Asset | Author, source | Licence | Changes to state |
| --- | --- | --- | --- |
| `puente-foto.webp`, `puente-sin-puente.webp`, `puente-alzado.webp`, `popa.webp`, `vertical-int.jpg`, `vertical-ia.jpg` | Ebaki, Wikimedia Commons, "Bizkaia zubia - Puente Bizkaia.jpg" | CC BY-SA 4.0 | restored; bridge removed and redrawn with AI; tanker's stern relettered |
| `vertical-cdn.jpg` | Einaz80, Wikimedia Commons, "Cape Penas Lighthouse.jpg" | CC BY-SA 4.0 | restored; masts removed and frame extended with AI |
| `vertical-gf.jpg` | Sergio S.C, Wikimedia Commons, "Museo Guggenheim Bilbao…" | CC BY-SA 2.0 | restored; plot reconstructed with AI |
| `vertical-ec.jpg` | Techwords, Wikimedia Commons, "Ocado warehouse bots.jpg" | CC BY-SA 4.0 | restored; operator's mark removed |
| `vertical-bd.jpg` | Mike Peel, Wikimedia Commons, "Teide Observatory 2018 077.jpg" | CC BY-SA 4.0 | restored; operator's logo removed |
