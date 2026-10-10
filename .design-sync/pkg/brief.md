# Design brief — the openings of serverstartup.io (home + six verticals)

Read this whole file before designing. It compiles every decision the founder (Julio Argüello) has made
on the site's openings since September 2026, with his own words where they settle a question. Quotes are
in Spanish, as he said them. When this brief and your instinct disagree, this brief wins.

## 1. Who, for whom, and the job

**Server Startup** (Getxo, Bizkaia; founded 2019) is a senior software-engineering boutique and an official
Cloudflare partner since 2019. Six verticals: CDN/WAF/edge security, systems integration, AI, greenfield
development, e-commerce (SAP Commerce Cloud, Ocado Smart Platform), Big Data & cloud analytics. Clients that
may be named: Alcampo, Auchan, Forum Sport, Punt Roma, Job&Talent (former); Inetum and Grupo Seidor as
collaborations. Name no other client, ever.

**The reader** is a senior software architect (15–25 years) at a mid-size Spanish retailer, who built the
estate himself: storefront, Cloudflare in front, store and warehouse integrations, data. He distrusts
consultancy fog and trusts precision, named tools, falsifiable facts. Design for him: sober, technical,
confident. Nothing that looks like a template, a stock-photo agency site or a pitch deck.

**The job now: REFINE, never redesign.** Start from `guidelines/current/home.html` (the live home, runnable)
and the screenshots in `guidelines/current/screens/`. Keep everything section 2 says to keep. The goal the
founder set: "una línea de diseño consistente" across the home and the six verticals, minimal "tipo
Cloudflare" ("ellos en naranja y nosotros en negro y gris"), "sobrio pero que llame la atención", "algo
mucho más elegante, que marque tendencia".

## 2. Keep (approved, do not reopen)

- **One dark stage** for every opening: the band `--ss-band` (#232724) with its haze `--ss-band-haze` at the
  far edge and the veil `--ss-veil` (78 %) under the copy. Same band on all seven home frames and all six
  vertical heroes. (A light/paper version was tried on 2026-10-07: "NO queda bien en blanco… queda fatal" —
  sky and mist in the photographs melt into paper and the title washes out.)
- **The six photographs and their order** on the home: lighthouse of Cabo Peñas (CDN) → Vizcaya bridge
  (integration) → tanker and tug under the bridge (AI) → Guggenheim (greenfield) → Ocado hive robots
  (e-commerce) → Teide observatory domes (Big Data). "From the coast to the stars". 6 s per frame, dissolves.
- **The six vertical scenes** (section 5): photograph + an animated layer in the vertical's colour, on one
  8 s clock. They took weeks; refine their surroundings, not their art.
- **The structure**: header with the cube and the `~Server Startup▮` prompt wordmark; the copy anchored top
  left of the 840 px column (never centred, never moving between pages); the rail of labelled chapters at
  the band's foot; the card bottom right; the seal (the logo's cube, large and faint, partly off the
  band's left edge, in the vertical's colour at about 16 %).
- **The copy**: h1 «Ingeniería de software, de la arquitectura a producción»; lead «Más de veinte años en
  comercio electrónico, integración de sistemas y datos. Partners oficiales de Cloudflare desde 2019.»

## 3. Refine — the brief, item by item

### 3.1 The brand frame «nosotros» (the main task)

A new FIRST frame of the carousel, before the lighthouse, that represents the company rather than a
vertical. The founder's trigger: "Yo voy a la home y lo primero que veo es un faro… eso no me representa,
eso es un vertical."

Requirements:
- **The cube is the subject, in the seal's place** (approved 2026-10-08, option 4a): the seal at the left
  edge becomes the protagonist on this frame — lit — and on the next frame recedes to its faint 16 % outline
  in the lighthouse's orange. Nothing moves between frames; only the light changes. ("Cuando salta a la
  siguiente, el cubo aparece a la izquierda… es un sin Dios" — the cube was on the right in one frame and
  the seal on the left in the next.)
- **It needs a light source.** Every photograph has one (lantern, sky, water); a flat dark frame "la veo muy
  triste… muy poca luz". Light is paper white `--ss-light` or a vertical colour — **never gold or warm
  light** ("el dorado no es mi línea gráfica de colores").
- **Sober but striking, a qualitative leap.** "Una cosa toda negra… está fatal." "Necesito algo que sea
  sobrio, pero que llame la atención."
- **Balanced composition.** The subject fills the band's height like the photographs (~86 %). "Lo veo
  descentrado… todo acumulado ahí arriba y luego abajo nada."
- **No card text that explains the company.** The motto («Un equipo. Seis verticales. Cero traspasos.»)
  and the equation `1 equipo = ▪▪▪▪▪▪ verticales = 0 traspasos` do not go in the opening ("no me parece mal
  tener un leitmotiv, pero lo veo fuera de sitio"; the equation without a box: "no me gusta nada"; "no
  entiendo qué significa cero traspasos").
- **Do not say "we are three"**: "no quiero darle tanto protagonismo a que somos 3".
- **Variant chosen (2026-10-09): «Filamento»** (your variant a: the cube's edges light up in paper white
  from the centre of the «Y» outwards). Drop «Volumen» and «Contraluz».
- **The right half is empty — fill it with the card, not with a new object.** On «nosotros» the card is
  the **index of the six verticals**: six rows, each the vertical's name (one line, 15–17 px Alexandria) with
  its colour as a short left rule, each row a link to its page. On the next frame the same card narrows to
  the one vertical on screen. Same position, same chrome as on the six photo frames — the card never
  disappears, it changes scale. This is the home's summary of what we do; it also replaces the
  «Áreas de especialización» section below the band (3.4).

Already tried and rejected for this frame (do not re-offer):
the lighthouse as first image · a real photograph with the logo on top (server aisle, Metro Bilbao's
"fosterito", code on a screen — "muy típicas… eso es algo en la línea de los verticales") · the three
founders, in photos or drawn · a six-colour cube · the cube with a terminal console and the Tomcat log line
· a giant cropped cube that no longer reads as the logo · a lit-edges cube on the RIGHT with warm gold light
· frosted glass, gradient text, rounded cards · boxes or empty cards · paper backgrounds.

### 3.2 The two-voice title (every frame and every vertical)

Head in Alexandria bold white; tail in Computer Modern italic (`.ss-title__tail`), coloured by the frame
(`--ss-tail`): grey `--ss-muted-on-band` on «nosotros», then each vertical's on-band tint. On the home the
words never change; only the tail's colour does, **in step with the photograph** (a prototype let the
orange linger after the frame had changed: "eso está mal"). On vertical pages: first word white, the rest
in colour («Integración *de sistemas*»). Tune the italic's size so its x-height matches the head (~+13 %).
In Spanish copy italics also mark anglicisms; keep code tokens (`WAF`, `CDN`) upright inside a tail.

**Tail colour — per frame, as saturated as the pixels allow (2026-10-09).** Your last delivery lightened
every tail to the same pastel (L ≥ 0.71) to clear the brightest backing; the contrast passes, but the six
verticals now look alike and the tail no longer says which one is on screen. Do it per frame instead:
for each photograph, take the vertical's colour and lighten it only as far as THAT frame's measured
backing requires for 4.5:1 — the darker the photograph under the title, the more saturated the tail. The
on-band tints (section 4) are the ceiling. Do not darken anything to get there: no local scrim, no extra
layer under the title — "a darker veil" is rejected (section 7) and the veil stays exactly as it is
(hard check 1).

### 3.3 The card (home)

- The vertical's name on **one line** — there is room ("tenemos espacio suficiente como para que no haya
  saltos de línea").
- Under it, **one factual line: what we do in that vertical.** No epigraph on the home card any more —
  the founder reversed that on 2026-10-09: "no me queda claro que meter la quote en la home sea lo mejor.
  Me gustaría más un resumen de lo que hacemos". The epigraphs stay where they are, opening each vertical
  page. The old one-line pitches («Lo primero que ve quien llega: el borde, defendido», «Dos orillas, un
  solo bus», «Del dato en bruto al oro, capa a capa»…) are also out: "muy coloquial, metafórico… no me
  gustaba". **The bar is expertise, not description** (founder, 2026-10-09). A list of technologies fails
  ("excluye a otras como si no supiéramos… es la home, te autodescarta con un error así"); a generic
  practice fails too ("todo el mundo usa agentes IA… es como si estás vendiendo un F1 y dices 'coches muy
  rápidos con motor 6 tiempos'. Eso lo dice cualquiera sin un mínimo conocimiento"). Each line says
  something only a practitioner would say, taken from the thesis of its own vertical page. Products are
  named on the vertical pages, not here. **Approved by the founder (2026-10-09, after a design panel:
  six vertical experts, a retail CTO, an SEO and a copy chief): prose line only, no row of platforms
  under it.** Use these six lines verbatim (`code` = JetBrains Mono upright at 0.9em; *italics* =
  anglicism). Measured in your card: two lines at 1440 and 1280 px, three at 393 and 360 px.
  - CDN: Caché hasta el `HTML`, reglas `WAF` y de bots ajustadas a tu tráfico, lógica en `Workers` y la
    cuenta entera en `Terraform`.
  - Integration: Diseñamos con `EIP` la plantilla que hereda cada flujo. Más flujos o más volumen no
    reabren la arquitectura.
  - AI: Programamos con agentes bajo reglas versionadas y los ponemos en tu sistema con permisos mínimos y
    techo de gasto.
  - Greenfield: Nunca partimos de cero. El *framework* de cada pila ya existe, en `Quarkus`, `Spring Boot`
    o `Cloud Run`. Lo opera quien lo diseñó.
  - E-commerce: `SAP Commerce Cloud` desde `hybris`, el *middleware* de `Ocado Smart Platform` y el
    negocio, del catálogo al `TPV`.
  - Big Data: Datos de fiar, en la nube o en un CPD propio. Modelo primero, `dbt` en lo analítico y lo
    operacional, y pruebas en cada carga.
  English (`/en`), re-expressed: We cache down to the `HTML`, tune `WAF` and bot rules on your traffic,
  run logic in `Workers` and keep the whole account in `Terraform`. · We design, with `EIP`, the template
  every flow inherits. More flows or more volume never reopen the architecture. · We build with agents
  under versioned rules, and put them into your systems with least privilege and a spending cap. · We
  never start from zero. Each stack already has its *framework*, in `Quarkus`, `Spring Boot` or `Cloud
  Run`. Whoever designs it runs it. · `SAP Commerce Cloud` since `hybris`, the *middleware* behind `Ocado
  Smart Platform`, and the business, from catalogue to `POS`. · Data you can trust, in the cloud or in
  your own data centre. Model first, `dbt` on the analytical and the operational side, tests on every load.
  Type: 15 px Alexandria, roman (not italic — it is a statement, not a quotation). Each line fits in two
  lines at 1440 px and three at 360 px; never more.
- Keep the card square-cornered (radius 4 px), no glass, the vertical's colour as the left rule.

### 3.4 Below the band (home)

- **«Con quién hemos trabajado»**: drop the heading; the logo row moves directly under the band (see the
  decided structure below — this replaced "just before the footer" on 2026-10-09).
- **«Partner oficial de Cloudflare»** stays — "tiene cierto empaque".
- **«Calidad y rendimiento»** goes — "queda ahí como tira de nadie… es horrible".
- **The motto** stays on the site, not in the opening — its place is right after «Cómo trabajamos» (below).
- **«Áreas de especialización»** (six rows with a small coloured cube, name, one line) does not convince
  ("no me convence"). It goes: the «nosotros» card (3.1) is now the index of the six verticals, and the
  carousel shows each one.
- **Decided structure (founder, 2026-10-09, after comparing seven reference homes):**
  1. **Client logos, no heading, directly under the band** — 5 of 7 reference homes show logos and none
     leaves them for the foot of the page (Rittman Analytics puts them in the opening itself). They are the
     only place where client names appear.
  2. **Cómo trabajamos** — seven items, each a bold declarative phrase plus one sentence. No icons, no
     numbering, no cards. Copy, verbatim (reviewed by a retail-CTO reader and a Spanish copy chief):
     - **Los mismos ingenieros, de principio a fin.** Quien diseña tu sistema lo lleva a producción. Y cada
       mañana mira sus alertas.
     - **Primero el contrato.** Cada interfaz se acuerda y se versiona antes que el código que la cumple
       (*contract first*).
     - **La configuración es código.** Permisos y entornos están en `Terraform`, con historial y revisión.
       Nada vive solo en la cabeza de alguien.
     - **Desarrollo guiado por especificación (`SDD`).** Fijamos qué debe hacer y cómo se comprueba antes de
       generar una línea, con las reglas de tu negocio escritas y versionadas. Así el tiempo va donde rinde
       la experiencia, al diseño y a la revisión. Cuando un
       test falla, arreglamos el código, no el test.
     - **Nada se despliega en rojo.** Cada cambio pasa tests, análisis estático y escaneo de seguridad en
       `CI/CD` antes de llegar a producción. Allí, trazas y métricas con `OpenTelemetry`.
     - **Si un `SaaS` ya lo resuelve, no lo construimos.** Preferimos perder un proyecto a mantener software
       que sobra.
     - **Dicho y hecho.** Lo que empezamos, lo terminamos. Cada día nos ocupamos de que el proyecto vaya
       bien, porque en él va nuestra palabra.
     Never "we are three".
  3. **The mantra — NEW MOTTO (founder, 2026-10-09): «Un equipo. Seis verticales. Dicho y hecho.»**
     (EN «One team. Six verticals. Promise kept.»). It replaces «Cero traspasos» on the whole site ("lo de 0
     traspasos no se entiende"). Redesign the mantra component as a sequence that ends in the end-of-proof
     square, in Computer Modern as today:
     `⬢ 1 equipo  →  ▪▪▪▪▪▪ 6 verticales  →  ∎ dicho y hecho`
     - the cube glyph, then the six vertical colours as a one-row glyph (as today), then **∎** (U+220E,
       the Halmos tombstone that closes a proof: "quod erat demonstrandum") in ink. The six coloured
       squares and the ink square rhyme on purpose: six verticals, one finished job.
     - arrows `→` replace the `=` signs; the visually-hidden «6» for screen readers stays.
     - optional, once, on entering the viewport: the six colours fuse into the ∎ (≤ 1.2 s, no loop);
       under `prefers-reduced-motion` show the end state only.
     - it sits directly after the last «Cómo trabajamos» item, whose label is the same «Dicho y hecho».
     - if the self-hosted CMU subset lacks ∎, draw it as a square in the type's x-height for now; we
       re-subset the font at implementation.
  4. **Partner oficial de Cloudflare** — exactly as it is today, orange ground included.
  5. The **closing band** («Hablemos de ingeniero a ingeniero.» / «Cuéntanos tu proyecto») as it is today.
  6. Footer.
  Removed: «Áreas de especialización» (the «nosotros» card indexes the verticals), «Calidad y
  rendimiento» ("tira de nadie"), and any «Casos» section (no client names and no hints on cards: "sin
  pistas"; no aggregate figures without a primary source). No testimonial until a client signs one.

## 4. Palette, type, contrast

- Closed palette: ink #1E1E1E, paper #F7F5F0, greys, the band, and the six vertical colours (CMS):
  CDN #F38020 · integration #EA4335 · AI #6B4FBB · greenfield #3E7D50 · e-commerce #008FD3 · Big Data #1D4E89.
- Text on the band uses the tints, each ≥ 4.5:1 on #232724: CDN #F38020 · integration #EC5D51 · AI #9582CE ·
  greenfield #669874 · e-commerce #0F95D5 · Big Data #708FB4 · brand grey #A8A49C. Thin italic strokes over
  a photograph must still read: measure on the photograph, not on the flat band (the red tail over the
  bridge's red girders is the known risk).
- Faces: Alexandria (text), JetBrains Mono (wordmark, labels, code), Computer Modern / CMU Serif (the
  signature: the title's tail and the equation). No new typeface.
- One radius (4 px), one column (840 px, scaling to 1040 px between 1440 and 2400 px wide), section
  headings in main content open with «~ ». No decorative rules; dark only in openings, consoles and the
  closing call-to-action band. No exclamation marks; no Spanglish.

## 5. The six vertical scenes (keep the art; know what it is)

All share one clock: 0–2 s the photograph alone; 2–4.5 s the transformation; 4.5–7 s the payoff; at rest
by 8 s; nothing loops after. Art never touches a letter.
- **CDN — the lighthouse radar.** Whole photo by day; night falls evenly 2→5 s while the orange profile draws
  over the lighthouse and the lantern lights (warm white `--color-lantern`); the beam becomes a radar sweep
  with labels and events in the sky right of the copy. Rejected: tight cut-out, dusk without the profile.
- **Integration — the bridge is the bus.** Banks first, then the transporter bridge drawn in red, then
  connectors (protocols above the girder, platforms below) and messages in the six colours; a small Pac-Man
  on the bus. Names light grey, never louder than the text.
- **AI — the machine's eye.** Tanker and escort tug: "complemento, no sustituto". Photo → the frame as a
  machine sees it (violet to the film's red) → the machine's reading (Terminator HUD homage: assist,
  replace: denied, override: bridge). The tanker's stern reads SERVER STARTUP / AVILÉS (the founder's
  homage to his father) — keep it.
- **Greenfield — the Guggenheim's elevation.** The empty plot, then a technical elevation drawn line by line
  (vanishing points, axes A–H, dimensions), then the museum's photograph. Professional, never a sketch.
- **E-commerce — the warehouse's stock and your order.** Ocado hive (the logo was born of these grids):
  lids light in a wave, one bin rises as a perfect cube with the logo's split and flies to the seal.
- **Big Data — dusk over the Teide observatory.** Even dusk; stars consolidate bronze → silver → gold
  (medallion layers); small slow faint data dots. The structure's own job, never data laid on top.

## 6. Motion and accessibility

- One 8 s grammar (above); soft dissolves between home frames (~800 ms); the title's tail recolours ~600 ms,
  starting just after the photograph; no bounce, no loops, nothing moving after 8 s; pause and replay
  controls stay. Under `prefers-reduced-motion`: the end state, no movement.
- Every text ≥ 4.5:1 measured on what is actually behind it; nothing written spills off the photograph on
  phones (360 / 390 / 430 px) or under the controls; the h1 is the largest paint on some viewports, so no
  heavy assets ahead of it.

## 7. What the founder has rejected across all rounds (patterns)

Dark scenes with no light ("tristeza, miedo"); paper heroes for the openings; photographs as the brand;
stock imagery; monuments that need explaining (literal similes: toll booth, control tower, lift…); added
objects over the art (cube stamps, title blocks, characters); drafting-sheet frames; duotone or grey-graded
photographs; whole scenes illustrated by hand; a castle for security (Cloudflare itself calls
castle-and-moat obsolete); numbering like «03 / 6»; a darker veil; a new typeface; rotating epigraphs; an epigraph on the home card (2026-10-09 — it stays on the vertical pages); metaphorical
pitches anywhere ("muy coloquial, metafórico").

## 8. What to deliver

- Work on your last delivery (`entregas/nosotros/Home - nosotros.html`), not a blank page.
- Round of 2026-10-09: «Filamento» with the six-vertical index card (3.1); the six photo frames with the
  factual lines (3.3) and the per-frame tails (3.2); then the page below the band in the decided order
  (3.4). Each at 1440 × 900 and 393 × 852, plus the short window 1280 × 600.
- One proposal per item, no variants: the decisions are taken. List anything you could not meet.

## 9. Hard checks before showing anything (a failed check = do not deliver)

1. **The veil stays exactly as in `guidelines/current/home.html`.** Under the copy the photographs are
   darkened by the live site's layers (`.s-hero__scrim` with `--hero-scrim-photo`, `--hero-spot`,
   `--hero-foot`). Never remove, lighten or replace them. A full-brightness photograph behind the title is
   the first thing the founder rejects ("las letras no se ven").
2. **Every piece of text ≥ 4.5:1 on the pixels actually behind it**, in every frame, at 1440 × 900 and
   393 × 852 — the white head, the italic tail, the lead, the card, the rail.
3. **The rail is the live rail**: same position (the band's foot, under the card), same face (Alexandria),
   same track-and-label style. Never move it into the picture or restyle it as a terminal prompt. Its active
   stop always names the same vertical as the card and the photograph on screen.
4. **The card shows the factual line of section 3.3**, verbatim — never an epigraph, never the old pitch.
   On «nosotros» it shows the index of the six verticals.
5. **Motion is the live site's, not new.** The home's carousel clock lives in `home.html`'s CSS
   (`--hero-cycle` 36 s, `--hero-step` 6 s, dissolves); adding «nosotros» makes it 42 s with seven steps.
   The vertical scenes' animations do NOT run in the snapshots (their scripts need the live site): their end
   states are `screens/vertical-*.jpg` and their beats are in section 5. Do not invent motion for them.
6. **Nothing of the art touches a letter**, and nothing written sits on top of the subject of a photograph.
7. **The card never overlaps the copy.** Measure the text boxes of the h1 and the lead against the card's
   box in every frame at 1440 × 620, 1366 × 650, 1280 × 560, 1100 × 600, 1024 × 600 and 393 × 852 (the
   founder looks at the home in a short window; your last delivery overlapped by 4–16 px below about 700 px
   of height). If copy + card + 32 px do not fit, the band grows (`min-height`); the card never rises into
   the lead and the text never shrinks.
8. **No arrows.** The rail is the navigation (its stops are tabs, with the keyboard); do not bring back
   the prev/next arrows.
