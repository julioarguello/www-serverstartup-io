# Implementing /deconstruyendo from delivery B v5 — the content model

Decided by the founder (2026-10-20): all the content lives in EmDash, in two languages, is loaded from a
file, and is well structured. The template only draws; it never writes copy.

## Content model (EmDash 0.34)

The field types available in EmDash 0.34 are `string`, `text`, `number`, `integer`, `boolean`,
`datetime`, `select`, `multiSelect`, `portableText`, `image`, `file`, `reference`, `json`, `slug` and
`repeater` (`node_modules/emdash` `FIELD_TYPES`).

| Where | What | Locales |
| --- | --- | --- |
| `pages` / `deconstruyendo` (ES) and `deconstructing` (EN, `translationOf`) | H1 and its tail, lead, meta description, «El taller, abierto» | ES + EN |
| **New collection `layers`** | one entry per layer: `order` (integer), `group` (select: `cloudflare` · `worker` · `transversal`), `kicker`, `title`, `lead`, `figure` (select: which figure component draws it), `facts` (repeater) | ES + EN, paired with `translationOf` |
| `layers.facts[]` (repeater) | `text` (Portable Text: code, italics, links), `file` (repo path, string), `docs` (label + URL pairs), `status` (select: `ok` · `pending`) | inside each entry |
| `ui_labels_es` / `ui_labels_en` widgets | interface chrome: «Detalle y pruebas», «N filas», the index, the map's labels | ES + EN |
| `pages` / `creditos` and `credits` | the credits page: author, source, licence and changes for every photograph | ES + EN |

What is not copy stays in code: the figure components, which draw structure and take their labels from
the CMS, and the layout.

## Loaded from a file

- Everything goes into `seed/seed.json`, which is the site's source of truth. CI rebuilds from it on an
  empty database. A from-scratch deploy to production loads it as it is.
- Optional: author the layers as `seed/content/layers/{es,en}/NN-<slug>.md` and convert them with the
  loader, as the services are. The loader would first have to learn the repeater; decide this at step 1.

## Gates

| Gate | Change |
| --- | --- |
| `cms-text` | no copy in the new components |
| `locale-parity` | add `layers`: a fact in one language must exist in the other |
| `copy-baseline` | recapture `/deconstruyendo` and `/en/deconstructing` deliberately |
| **New: `cited-files`** | every `layers.facts[].file` exists in `git ls-files`. This is the acceptance of #535: rename a cited file and watch the gate fail. Proved with a planted case |
| a11y, engines, layout, tokens | they already cover the route; the figures use the theme's tokens |

## Decisions already taken

- **Rows with `status: pending`** (HSTS on the serving host, the admin, the credits page) are not
  rendered. Each one switches to `ok` when it is verified on the deployed site.
- **Dark panels for every figure**: accepted as a deliberate exception (founder, 2026-10-20).
- **Real captures.** GitHub: `capturas/github-seed.png`, `github-deploy-preview.png`,
  `github-quality-gates.png`, re-taken once a green commit touches `seed/`. Cloudflare: two dashboard
  captures supplied by the founder; partial exposure of the account is accepted. The cache-statistics slot
  goes, because its figure is not in the facts file.
- **Fixes from the review** (`revision-v5.md` 1–3): the H1 fits at 360 px; the openings are cropped to the
  art side; no ids and no line numbers in the ledger.

## Steps

1. In the local stack, create the `layers` collection with the repeater and check that EmDash 0.34
   seeds, edits and renders it: drafts, `translationOf`, and Portable Text inside the repeater. If the
   repeater cannot hold Portable Text, fall back to a `facts` collection with a `reference` to its layer.
2. Write the ES and EN content into the seed. EN is a re-expression, not a translation.
3. Build the components from v5's `dc3.css`, `dc5.css` and `dc11.css`, with `theme.css` tokens and
   `token-guard` fences where they imitate other products.
4. Build the credits page.
5. Add the `cited-files` gate with its planted case, then run the full local gate set.
6. Open a PR from a worktree off origin/main and verify on the preview.

## What shipped, where it departs from the plan (2026-10-20)

- **No Portable Text in repeaters.** EmDash 0.34 repeater sub-fields are scalar, image or select
  only. Plate text and fact text are markdown-lite rendered by `excerptHtml`, as service
  excerpts are. No `facts` collection was needed: the repeater holds the facts.
- **The map is `role="group"`**, not `role="img"`: it holds links to the plates, and axe reports an
  image's children as nested interactive controls. Its links take an edge-orange focus ring;
  the shape highlight is only an extra.
- **The phone has its own list**, labelled `map_list_aria` and distinct from the sticky spine's
  `spine_aria`: two navigation landmarks may not share a name.
- **EN anchor `site-content`**, not `content`: `#content` is the skip link's target on every page.
  html-validate (`no-dup-id`) is what catches the next collision.
- **The opening h1 joins theme.css's one-line register** at 768 px and above (`.dc-hero__inner`);
  below that it keeps its own clamp so «Deconstruyendo» fits 360 px.
- **The model credit hides with the large drawing** (≤860 px): it names two windows the small
  drawing does not have.
- **Credits page**: the bridge does not appear on /deconstruyendo; its «Aparece en» says so.
- Facts that could only be verified on the deployed site are seeded with `status: pending` and
  stay hidden until checked there.
- **Panoramic map (founder, 2026-10-20).** The EmDash window and «yo edito» moved left of the
  stack, under Contenido; the Presentación window and «tú ves» moved right, under Red. The drawing
  went from 1310 × 1044 to 1700 × 680 units, so the opening (title, lead, map) is about one screen
  and the copy never sits on the drawing. The small drawing and the list take over at 1100 px, the
  menu's boundary, where the panoramic labels would fall under 8 px. Rejected: the map, or the cube
  alone, as art beside the copy at the verticals' h1 height. «Deconstruyendo esta web» fills the
  column, so any art beside it lands under the title.
