# /deconstruyendo — what there is to show (whole site)

Verified against the worktree `design/535-deconstruyendo` (base `2cd06de` = origin/main, 2026-10-16) and
the preview Worker on the same day. **V** = re-read in the session; **R** = reported by a read-only
sub-agent from the cited line and not re-read. Re-read every **R** fact before it goes into copy.

This file is the inventory, not the design. It lives outside `pkg/` so that Claude Design does not take it
as a guideline before the founder cuts it.

## The need (founder, 2026-10-16)

/deconstruyendo explains how the WHOLE site is built: architecture, the details, the openings and their
animations, the quality gates, all of it "con mucho empaque". The current five prose sections are "muy
aburrida". Much of the text should go. The page becomes a sequence of images, each with a short caption,
that reads fast. The first round, which covered only the hero/photo pipeline, missed the brief: it came from
#535's body and an AI-written prompt.

Order of work: understand, then key points (this file plus the storyboard page), then design, then implement.

## Key points (candidate frames)

| # | Frame | One line | Number | Proof | Image |
| --- | --- | --- | --- | --- | --- |
| 1 | Six openings, one clock | A real photograph plus a live layer per vertical, at rest by 8 s | 6 scenes · 8 s | `docs/architecture.md` §4.4–4.11 **V**; `src/utils/hero-art.ts` | exists: `.design-sync/current/screens/vertical-*.jpg` |
| 2 | One photograph, taken apart | Original → no bridge → elevation from its own edges → scene | towers within 7 px | `docs/design/hero-rotativo/bridge_plan.py:1-10` **V** | exists: `public/assets/hero/{home-puente-salida,int-puente-aviles,int-puente-trazo}*` |
| 3 | Faithful or generative | SeedVR2 3B locally for detail; FLUX.2 [dev] on Workers AI inside masks or from edges; the 9 prompts are committed | 9 calls | `photo_restore.py:1-26` **V**; `flux-prompts.md` (commit `042c310`, not on main yet) | exists: stern crop, prompt file |
| 4 | Measured, not by eye | Profiles registered by SIFT; cameras fitted to the rails and the horizon | 0.49 px median residual | `docs/architecture.md:227-234` **V**; `ocado.py:9-17` **V** | to make: drawing over photo with the fit marks |
| 5 | One Worker at the edge | Astro + EmDash in a single Worker, no origin server; both are Cloudflare's | 5 bindings (DB, MEDIA, SESSION, LOADER, IMAGES) | `wrangler.jsonc:11-46` **V**; `package.json:27-42` **V** | to make: request-path diagram (the page's LayerStack is the seed) |
| 6 | Cache closed by default, purged on publish | No page is cached unless it opts in. A publish purges by tag. Menus and settings wait up to 1 h. | 1 h TTL | `src/middleware.ts:102-129`, `src/plugins/cache-purge.ts:70-79` **R** | to make: HIT → publish → MISS from a `verify-purge.yml` run |
| 7 | Content is a file | All text is in `seed/seed.json`, in two languages. CI rebuilds from scratch. | 7 collections · 43 entries | `seed/seed.json` **V** (computed) | exists: `public/assets/emdash-editor-deconstruyendo.webp` |
| 8 | One design file | Colour, radius, shadow and spacing live in `theme.css`. A literal anywhere else turns CI red. | 1 file | `scripts/ci-check-design-tokens.py`; `docs/design-system.md` **R** | to make: token sheet (`.design-sync/cards/colores.html` is the seed) |
| 9 | 23 gates before a person looks | Each guard plants a defect and goes red if it cannot see it. The number is derived by a test. | 23 | `.github/workflows/ci.yml` (recomputed) **V**; `tests/unit/gate-count.test.ts` **V** | to make: capture of a green run |
| 10 | Lighthouse in CI | Every PR is measured on 9 URLs, median of 3 runs | perf ≥ 95, rest 100 | `lighthouserc.json` **V**; dated: `docs/audits/2026-08-24-lighthouse/` (100 on 5 URLs) **R** | to make: score rings with date |
| 11 | Three engines, reduced motion | Each opening is checked mid-animation in WebKit (iPhone and desktop) and in Chromium on a Pixel 7 | 3 profiles | `scripts/ci-check-engines.mjs:1-30` **R** | to make: one opening in three device frames |
| 12 | Seven security headers | One middleware stamps them. The CSP admits no third-party script. | 7 | `src/middleware.ts:29-49` **V** | to make: `curl -I` panel |
| 13 | The agent proposes, a person merges | The rule is written down, not enforced by the server | — | current page; `tests/unit/agent-boundary.test.ts` **R** | exists: the page's PR card (DecReview) |
| 14 | The workshop is open | The working repository is the public one, with full history | — | `README.md:87` **R** | to make: repo card |

Left out unless the founder wants them: translated slugs and hreflang (`src/utils/alternate.ts`), the 150 KB
CSS budget (`scripts/ci-check-css-budget.py`), the hero-frame gate (#568), the manual production deploy and
its D1 guard (`deploy-production.yml`), and WCAG-EM. The WCAG-EM evaluation is **prepared, not signed**
(`docs/audits/2026-10-16-wcag-em/README.md:3-8` **V**), so it may never be cited as conformance.

Credits: `/creditos` (EN `/en/credits`) for the five CC BY-SA photographers. The Guggenheim is BY-SA 2.0.
The page states the modifications. Decided 2026-10-16.

## The current page states numbers that drifted

These numbers are typed into the seed instead of being derived, which is why they drifted:

- "26 rutas" now counts 28 (`tests/copy-baseline/` holds 28 files **V**).
- "24 componentes y 12 hojas" now counts 35 and 20 (`git ls-files` **V**).
- Lighthouse "cinco direcciones" was the dated measurement; CI now gates 9 URLs **V**.
- "23 pasos" is still right, because it is derived (**V**).
- Not traced, and not to be reused until it is: "43–60 % fewer image bytes" and "183 rutas bajo /_emdash".

Design constraint for the brief: fewer words means fewer claims to keep true, and every number that
survives must be derived by a test, as `gate-count.test.ts` already does.

## References (opened 2026-10-16 by a sub-agent; check the top three in a browser before citing)

- Ciechanowski, *Mechanical Watch*: one colour per subsystem, shared by figure and text.
- iFixit teardowns: numbered steps, a one-line ledger per part, zoom series.
- Teenage Engineering OP-1 guide: line drawings with numbered callouts, sober.
- Linear, *How we redesigned the Linear UI*: before/after pairs with the measurement drawn on.
- Cloudflare, *The Cloudflare blog uses EmDash*: the same stack, with a cache-layer diagram.
- Bostock, *How To Scroll*: keep native scroll; sticky figures, never hijacking.

Three structural patterns: (1) numbered plates with a ledger line each; (2) a sticky request-path figure,
lit section by section as captions scroll; (3) filmstrips of 3–4 frames per section, closing with a spec sheet.
Hold until the key points are cut.

## Round 2 (founder, 2026-10-16): bottom-up, quality last, every Cloudflare product named

- **Order**: layers from the foundations up: network → compute → data → CMS → content → presentation. Then
  quality: deploy flow, gates, performance, accessibility, engines, headers, agents, the open workshop.
  The openings are one frame in presentation ("lo de menos").
- **Numbers**: only the brag-worthy ones. Kept: 0 origin servers, 0 third-party scripts (CSP
  `script-src 'self'`, measured on the preview), 23 gates, 7 headers (HSTS with preload, measured).
  Lighthouse 100×4 is dated 2026-08-24, **before the openings**, so it must be re-measured before it is
  shown. Dropped: 1 h TTL, 43 entries, 0.49 px, 26 routes, 24 components.
- **Cloudflare in use, per the repo** (`wrangler.jsonc`, `astro.config.mjs`): DNS (the zone is on Cloudflare
  nameservers, `docs/production-cutover.md`), Workers, Workers Cache with tag purge, D1, R2, KV, Images
  binding, Worker Loaders (sandboxed plugins), custom domains on `.dev`, workers.dev, and Workers AI at
  design time. EmDash and Astro are Cloudflare's own.
- **Dashboard only, unconfirmed**: WAF, bots, Polish, Stream.
- **Analytics**: Web Analytics, its beacon installed by hand (#309), and Google Analytics 4 through Zaraz, behind Zaraz's own consent window (#667).
- **Not in use**: Access, Turnstile, Durable Objects, Queues.
- **Admin login**: EmDash's passkey (WebAuthn) by default. No OAuth and no Access are configured
  (`docs/migration-guide.md:90`, `astro.config.mjs:86-103`). Asked the founder what "OAuth" means.
- **Live state**: `www.serverstartup.io` still serves the old WordPress (`server: nginx`, curl
  2026-10-16). The architecture is live on `www.serverstartup.dev` and the preview. The page can only go
  public with the DNS cutover.
- Storyboard: https://claude.ai/artifact/Y8XYwNtQ4cPnnkYzBaLB3N (map plus 21 frames; republished 2026-10-18 after the session switched Anthropic accounts, which killed the earlier link).
