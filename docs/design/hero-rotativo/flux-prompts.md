# The FLUX.2 calls behind the hero photographs

Every image of the openings that FLUX.2 [dev] touched came from one of the calls below. The
scripts beside this file say what was done with each result: where it is used as a donor inside
a mask, where it continues the frame, and where it redraws an edge sketch. This file says what
was asked. Until now the prompts lived only in working sessions, and a script claimed they were
in the issue. They were not, so here they are.

## How they were run

- **Model:** `@cf/black-forest-labs/flux-2-dev` on Workers AI. All ten calls (1–9, with 5 split into 5a and 5b) used it.
- **Caller:** a scratch Worker run with `wrangler dev` and a remote `AI` binding, calling
  `env.AI.run(model, { multipart })`. The reference image went in as `input_image_0`.
- **Settings:** 28 steps everywhere except the lighthouse profile, which used 32.
- **Seeds:** each call ran a small batch of seeds, and the founder chose by eye. The seed kept is
  the one in the table. The others are listed so that a re-run can be compared with them.
- **What is committed:** FLUX's raw outputs are not. Only what the scripts made of them is.
- **What is not deterministic:** re-running a call with the same seed is not guaranteed to
  return the same bytes on a newer model build. The prompts record intent, and the scripts'
  measurements record what shipped.

| # | Call | Script | Seed kept (batch) | Size · steps | Reference image |
| --- | --- | --- | --- | --- | --- |
| 1 | Lighthouse: masts removed (donor) | `faro.py` | 7 (3, 7, 11) | 1344×1008 · 28 | the original, resized |
| 2 | Lighthouse: sheds removed (donor) | `faro.py` | 12 (4, 8, 12) | 1344×1008 · 28 | step 1's result |
| 3 | Lighthouse: frame extended left | `faro.py` | 9 (5, 9, 13) | 1344×720 · 28 | the photo padded with grey on the left |
| 4 | Lighthouse: the profile drawing (#529) | `faro.py register` | 11 | 2016×1392 · 32 | #529's cut-out on paper |
| 5a | Bridge: bridge removed (donor, #531) | `bridge.py`, `photo_restore.py` | 11 (3, 11) | 2016×1344 · 28 | the original at 1024 px |
| 5b | Bridge: sky matte for the cut-out | `photo_restore.py` (input) | 5 (5, 13) | 2016×1344 · 28 | 5a's plate |
| 6 | Bridge: edge sketch redrawn (#531) | `bridge_plan.py` | 11 (5, 11, 23) | 2016×1344 · 28 | Canny sketch, 1024×683 |
| 7 | Guggenheim: the empty plot (#547) | `guggenheim.py` | 17 (5, 17, 29, 41) | 1536×752 · 28 | the original |
| 8 | Guggenheim: edge sketch redrawn (#547) | `guggenheim.py` | 11 (11, 23, 31, 44) | 1536×752 · 28 | edge sketch of the building |
| 9 | Home warehouse: frame extended left (#560) | `home_voyage.py` | 7 (5, 7, 11) | 1344×720 · 28 | the photo padded with grey on the left |

## The prompts, verbatim

**1. Lighthouse, masts.** The same photograph, unchanged, with every radio mast, lattice tower,
antenna, pole and guy wire removed: where they stood there is only the same cloudy grey sky, the
same distant trees and the same grass. The lighthouse, its house, the boardwalk, the sheds and
the fence stay exactly as they are. Photorealistic, same light, same framing, no text.

**2. Lighthouse, sheds.** The same photograph, unchanged, with the low white sheds with red roofs
on the right removed, together with their wire fence, the fence posts and the small white
instrument box on legs: where they stood there is only the same mown green grass, continuing to
the same distant horizon of trees under the same grey sky. The lighthouse, its house, the
boardwalk and everything else stay exactly as they are. Photorealistic, same light, same
framing, no text.

**3. Lighthouse, extension.** Extend this photograph to the left. The flat grey area on the left
is missing: fill it with the natural continuation of the same scene, seamlessly — the same
overcast grey sky with the same clouds, the same low horizon of distant green coastal headland,
rough grass, heather and gorse scrub with small yellow and white wild flowers in the foreground,
as on a clifftop in Asturias. Keep the right part, the lighthouse, its house and the boardwalk
exactly as they are. No buildings, no poles, no masts, no people, no text. Photorealistic, same
camera, same light.

**4. Lighthouse, profile.** Architectural technical drawing of exactly this lighthouse and its
house, keeping the same three-quarter view, position, size and framing as the reference. Drawn
with a Rotring technical pen on plain cream paper: very fine, precise, hairline black ink lines,
0.18 mm pen for everything and 0.35 mm only for the outer contour; delicate, light, airy line
work with lots of white. Every line straight-edged or compass-true, nothing sketchy, no
crosshatching, no stippling, no engraving texture, no shading. Draw only the building: omit the
antenna mast, the sheds, the fence and the ground. No words, no numbers, no title, no signature.

**5a. Bridge, removed.** Edit this exact photograph. Remove the red steel transporter bridge
completely: both lattice towers, the horizontal girder span, all suspension cables, hangers and
back-stay cables, and the white gondola at the right quay. Where the bridge was, continue what is
behind it: the cloudy sky, the sea horizon, the river water, and the building facades of the
town on the right bank. Keep everything else exactly as it is, in the same position, size and
framing: the town of Portugalete on the left, the town of Las Arenas on the right, the cliffs,
the port, the ship and the tug boat, the river, the clouds and the light. Photorealistic, same
camera, same colours.

**5b. Bridge, sky matte.** Edit this exact photograph: replace the entire sky and all clouds with
flat solid pure black. Keep everything that is not sky exactly as it is, in the same position,
size and colours: the sea horizon line, the cliffs, every building, crane and tower of the port,
the town on both banks, the river, the ship and the tug. Only the sky becomes pure black.

**6. Bridge, drawing.** Redraw this rough edge sketch of a transporter bridge as a clean, precise
architectural line drawing on pure white paper, keeping every line exactly where it is: same
position, size, perspective and framing as the sketch. Fine black ink lines of even weight,
ruled straight members, the lattice braces of both towers, the truss girder with its diagonals,
the curved main cables with their vertical hangers, and the back-stay cables, all exactly as
sketched. Draw only what is in the sketch: add nothing that is not there. No car, no gondola, no
buildings, no ground, no water, no sky, no shading, no hatching, no fill, no colour, no text.

**7. Guggenheim, empty plot.** The same photograph of the riverside in Bilbao, same camera
position, same river, same stone quay wall and promenade with its railing, same cloudy grey sky,
but the large metal building is completely gone. In its place, an empty flat urban plot of bare
earth and gravel behind the promenade, with the distant city buildings and green hills visible
low on the horizon. Photorealistic, natural light, no building in the middle, no construction
machines, no text, no watermark.

**8. Guggenheim, drawing.** Redraw this sketch as a clean architect's elevation drawing of the
building, thin black ink lines on plain white paper, front view. Keep every line exactly where it
is: same positions, same curves, same scale, nothing moved. Clean confident strokes for the
outline of every curved volume, the panel courses on the curved metal surfaces as fine parallel
lines, the glass atrium's mullions as fine straight lines, the canopy and its column. Only the
building: no sky, no water, no people, no ground, no shading, no hatching, no colour, no text, no
numbers.

**9. Warehouse, extension.** Extend this photograph to the left. The flat grey area on the left is
missing: fill it with the natural continuation of the same scene, seamlessly — the same
automated warehouse grid, its steel rails converging to the same vanishing point, more of the
same white storage robots with blue lids standing on the grid, the same high ceiling with its
lights and columns. Keep the photograph on the right exactly as it is, at the same size and
place. Same camera, same light, photorealistic, no people, no text, no logos.

## Asked and not shipped

Same model, same Worker:

- **A bridge drawing whose prompt named the gondola.** FLUX drew a gondola the photograph does
  not have. The founder's verdict was "la barcaza te la has inventado", and prompt 6 now says "no
  gondola".
- **The bridge with the ships removed.** Seeds 3, 7 and 13 were tried. The ships stay in the
  photograph.
- **The warehouse extended on every side.** Seeds 3, 6 and 9 were tried. Only the left extension
  shipped.
- **A site plan and tape collages of the Guggenheim.** Both were dropped for the elevation.
