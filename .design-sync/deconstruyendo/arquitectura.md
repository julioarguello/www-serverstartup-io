# The architecture of serverstartup.io, layer by layer (spec for /deconstruyendo)

Source of truth for the page's content. Claude Design designs the page from this file, not from memory.
The page's copy is Spanish and English; these rows are the facts the copy may state.

**Panel, 2026-10-19.** Four adversarial verifiers tried to disprove every row, each against code, the edge
(GET), the Cloudflare API (GET) and the official docs:

1. Network, cache and the negatives.
2. Compute, data and EmDash.
3. Content, delivery and quality.
4. Wording, plus Cloudflare and EmDash product names.

Rows they struck are gone. Rows they reworded carry the panel's wording. Every link returned 200 and is the
most specific official page. The first version is commit `0065640`.

Columns:

- **State.** `RUN` serves visitors · `EDIT` serves editors · `CI` runs in the pipeline · `DESIGN` happened
  once, to make assets · `ZONE` is a zone setting of the `.io` zone that will serve the page.
- **Gate.** `OK` may go on the page · `WHEN …` holds only once the named condition is met.

Rules that apply to the whole page:

- **No old web.** The page describes this site as the only one. Hostnames never appear in the copy.
- **Numbers.** Only the ones worth showing off (founder, 2026-10-16).

## Layer 1 — The network (Cloudflare)

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 1.1 | DNS is authoritative on Cloudflare, and the zone is DNSSEC-signed | ZONE | OK | API `/zones` (`.io` active, `kobe`/`tara`); `dig +short DS serverstartup.io` answers | https://developers.cloudflare.com/dns/zone-setups/full-setup/ · https://developers.cloudflare.com/dns/dnssec/ |
| 1.2 | TLS 1.3 is the minimum version the zone accepts. Encrypted Client Hello is on. Clients that support it also get the post-quantum key agreement Cloudflare offers by default | ZONE | OK | API `min_tls_version: 1.3`, `ech: on`; `curl --tls-max 1.2` fails on 11/11 `.io` Custom Domains; the HTTPS record carries `ech` | https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/ · https://developers.cloudflare.com/ssl/edge-certificates/ech/ · https://developers.cloudflare.com/ssl/post-quantum-cryptography/ |
| 1.3 | Always Use HTTPS redirects plain HTTP at the edge. The app sends HSTS with a one-year max-age, includeSubDomains and the preload directive | ZONE/RUN | **WHEN** the zone's HSTS setting is verified on the serving hostname | API `always_use_https: on`; `301 https://` on 11/11; `src/middleware.ts:28-50` | https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/ · https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/ |
| 1.4 | Each hostname is a Custom Domain: the Worker is the origin and there is no server behind it. The certificate is issued and renewed automatically | RUN | **WHEN** the `.io` hostnames are attached | `wrangler.jsonc` `custom_domain: true`; API `/workers/domains` | https://developers.cloudflare.com/workers/configuration/routing/custom-domains/ |

Struck by the panel: Tiered Cache as a zone row (Workers Cache ignores zone caching and is tiered by itself:
see 2.1); NEL (off on `.io`, and the reports reach Cloudflare, not us); HTTP/3 (off on `.io`); "Enterprise
zone" (a partner-granted plan, `price: 0`; the reader cannot check it).

## Layer 2 — The edge cache

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Workers Cache sits in front of the Worker and is tiered by default: a hit does not run the Worker | RUN | OK | `wrangler.jsonc:10` `cache.enabled`; API `cache_options.enabled`; `cf-cache-status: HIT` on the home page | https://developers.cloudflare.com/workers/cache/ |
| 2.2 | A rendered page is cached at the edge only if it opts in. Every other rendered response is sent `no-store` | RUN | OK | `src/middleware.ts:108-130`; `/search`, `/api/whoami` and the 404 page measured `no-store`, BYPASS | — |
| 2.3 | Publishing an entry purges, by cache tag, its own pages and the pages that list it. Menus and site settings are not purged; they expire within the hour | RUN/EDIT | OK | `src/plugins/cache-purge.ts:49,69-80` (`cache.purge({tags})`); `astro.config.mjs:49-55`; last green `verify-purge.yml`: https://github.com/julioarguello/www-serverstartup-io/actions/runs/32654856970 (2026-08-23) | https://developers.cloudflare.com/workers/cache/purge/ |
| 2.4 | Build output under `/_astro/` is content-hashed and served with a one-year, immutable max-age | RUN | OK | `public/_headers:5-6`; measured | https://developers.cloudflare.com/workers/static-assets/headers/ |
| 2.5 | Resized images are kept in the Cache API | RUN | OK | `@astrojs/cloudflare` `image-transform-endpoint.js:5-22` (`caches.default`) | https://developers.cloudflare.com/workers/runtime-apis/cache/ |

## Layer 3 — Compute

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 3.1 | One Worker renders the pages on demand with Astro (SSR). The built files are served as Workers Static Assets without running it. There is no server behind the Worker | RUN | OK | `astro.config.mjs:12` `output:"server"`; 6 bindings (ASSETS, DB, MEDIA, SESSION, LOADER, IMAGES) per the API and `dist/server/wrangler.json`; no proxy fetch to an origin | https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/ · https://developers.cloudflare.com/workers/static-assets/ |
| 3.2 | The team that makes Astro has worked at Cloudflare since January 2026. Astro remains MIT-licensed and openly governed | — | OK | the post | https://blog.cloudflare.com/astro-joins-cloudflare/ |
| 3.3 | One middleware stamps 7 security headers on every page the Worker renders. The CSP admits no third-party script | RUN | OK | `src/middleware.ts:28-50`; `script-src 'self'` measured on both hosts | — |
| 3.4 | The Worker knows the visitor's city and the Cloudflare data centre that answered (`request.cf`). The edge-security opening echoes them | RUN | OK | `src/pages/api/whoami.ts:17-22`; `HeroRadar.astro:628`; live `{"city":"Getxo","colo":"MAD"}` | https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties |
| 3.5 | CMS plugins can run in their own Dynamic Worker, with no network of their own and fixed CPU, subrequest and time limits. Everything they do passes through a bridge that checks the capabilities each plugin declares | RUN/EDIT | OK, as a capability | `@emdash-cms/cloudflare` runner: `globalOutbound: null`, `limits {cpuMs:50, subRequests:10}`, PluginBridge per-capability checks; `wrangler.jsonc` `worker_loaders` | https://developers.cloudflare.com/dynamic-workers/ · https://docs.emdashcms.com/deployment/plugin-sandbox/ |

## Layer 4 — Data

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 4.1 | D1 (SQLite) holds the content, its revisions and the settings. Each request opens a D1 session | RUN/EDIT | OK; add "read replicas" only **WHEN** `read_replication.mode` is measured `auto` | `wrangler.jsonc:11-18`; `astro.config.mjs:87` `d1({session:"auto"})`; emdash `d1.mjs:705-711` | https://developers.cloudflare.com/d1/ · https://developers.cloudflare.com/d1/worker-api/d1-database/#withsession |
| 4.2 | Workers KV is the session store for editor logins | EDIT | OK | `wrangler.jsonc:26-31`; emdash `passkey/verify.ts:58` | https://developers.cloudflare.com/kv/ |
| 4.3 | The Worker hands each image to the Images binding, which resizes it to its slot and converts it to WebP | RUN | OK | `wrangler.jsonc:45-47`; `astro.config.mjs:47`; `/_image?…f=webp` → 200 `image/webp` | https://developers.cloudflare.com/images/optimization/binding/ |
| 4.4 | R2 is wired as the CMS media store. Today every image on the site ships with the code | EDIT | OK, worded exactly so | `wrangler.jsonc:19-24`; API: 0 objects | https://developers.cloudflare.com/r2/ |
| 4.5 | Preview and production each have their own D1, KV and R2 | CI | OK | `wrangler.jsonc:64-82` | — |

## Layer 5 — The CMS: EmDash (prominent; link generously)

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 5.1 | EmDash, the open-source (MIT) CMS that Cloudflare announced in April 2026, runs inside the same Worker | RUN/EDIT | OK | `package.json` (emdash 1.3.1, #627); `node_modules/emdash/LICENSE` "Copyright 2026 Cloudflare Inc." | https://blog.cloudflare.com/emdash-wordpress/ · https://github.com/emdash-cms/emdash · https://docs.emdashcms.com |
| 5.2 | Cloudflare runs its own blog on EmDash | — | OK | the post | https://blog.cloudflare.com/cloudflare-blog-uses-emdash/ |
| 5.3 | Five content types: pages, services, members, references and partners, with posts ready and empty. Pages and services have drafts; those two and members keep revisions. Bodies are Portable Text | EDIT | OK | `seed/seed.json` (leave out `elementor_library`, an import leftover) | https://docs.emdashcms.com |
| 5.4 | Two languages: pages, services and members are published in pairs linked by `translationOf` | RUN/EDIT | OK | seed; `src/utils/alternate.ts` | — |
| 5.5 | Menus, widget areas, site settings and taxonomies come from the CMS. Every interface label lives in a widget, not in a template | RUN/EDIT | OK | `Base.astro:12`; `src/utils/ui-labels.ts:13`; `scripts/ci-check-cms-text.py` | — |
| 5.6 | Search is EmDash's, on SQLite FTS5 with bm25 ranking | RUN | OK | emdash migration 064 `fts5`, `query.ts:291`; `/_emdash/api/search` → 200 | — |
| 5.7 | The admin admits editors by passkey (WebAuthn) only: there is no password to store or leak | EDIT | **WHEN** confirmed on the deployed admin | `/_emdash/api/auth/mode` → `passkey`, `providers: []` | https://docs.emdashcms.com/guides/authentication/ |
| 5.8 | EmDash is also an OAuth authorization server (the OAuth 2.1 profile: code + PKCE, dynamic client registration). An AI agent can therefore work on the content through its MCP server, with a token an editor grants | EDIT | **WHEN** confirmed on the deployed admin | `WWW-Authenticate: Bearer resource_metadata=…` (RFC 9728); `/.well-known/oauth-authorization-server/_emdash` (RFC 8414, S256 only); `registration_endpoint` (RFC 7591); `/_emdash/api/mcp` → 401 without a token | https://docs.emdashcms.com/reference/mcp-server/ · https://docs.emdashcms.com/guides/ai-tools/ |
| 5.9 | The `emdash` command line signs in with the OAuth device flow (RFC 8628) | EDIT | **WHEN** confirmed on the deployed admin | `/_emdash/.well-known/auth` → `device_flow` | same |
| 5.10 | A plugin kept in the repository purges the cache on publish. It declares `content:read`, because without it EmDash skips its hooks | RUN/EDIT | OK | `astro.config.mjs:92-101`; emdash `plugins/hooks.ts:281-314` | — |
| 5.11 | Editors get preview links to drafts | EDIT | **WHEN** confirmed on the deployed admin | `astro.config.mjs:132`; `src/pages/preview/[collection]/[id].astro` | — |

Struck: "the marketplace is wired" (nothing installed; bundles load from an empty R2).

## Layer 6 — Content

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Every sentence the site renders lives in one versioned file, `seed/seed.json`. The service pages are written in Markdown and the CMS converts them into that file. A test keeps the two word for word, and a CI gate rejects copy typed into a template | CI | OK | `seed/content/README.md`; `scripts/load-content.sh`; `scripts/seed-sync-services.py`; `content-mirror.test.ts`; `ci-check-cms-text.py` | https://docs.emdashcms.com/themes/seed-files/ |
| 6.2 | On every change that can reach a page, CI builds the site and fills an empty database from that file, twelve times in parallel | CI | OK | `ci.yml:113-117` (no `.wrangler` cache); `ci-local-stack.sh:62,133,136`; `ci-scope.sh:35-36` | — |
| 6.3 | Service slugs are translated, so the other language's URL is never guessed. hreflang and the language switcher read the same resolved value | RUN | OK | `src/utils/alternate.ts:22,38`; `Base.astro:249`; 0 mismatches on 28 routes | — |
| 6.4 | The sitemap is generated from the CMS collections | RUN | OK | `src/pages/sitemap.xml.ts` | — |

## Layer 7 — Presentation

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 7.1 | One stylesheet declares every colour, radius and shadow, the column width and the spacing scale. CI rejects those values written anywhere else, except in marked blocks that imitate another product's interface | RUN/CI | OK | `src/styles/theme.css`; `scripts/ci-check-design-tokens.py:8-18`; 23 `token-guard: off` fences | — |
| 7.2 | Loading a page makes no third-party request. Fonts, scripts and images are all the site's own | RUN | OK | every CSP fetch directive is `'self'`; 0 external URLs across 54 route fetches and 21 `/_astro` files | — |
| 7.3 | Each vertical opens with a Wikimedia Commons photograph, restored and partly redrawn, and a layer drawn live in the browser. The layer is placed against the measured text, and its clock stops at eight seconds: nothing loops | RUN | OK | `src/utils/hero-art.ts:119` `SCENE_BEATS.end`; the six scenes call `clock.at("end")` | — |
| 7.4 | The photographs were restored locally with SeedVR2. FLUX.2 [dev] (Black Forest Labs) on Workers AI removed objects, extended frames and redrew drawings from the photographs. Every prompt is committed | DESIGN | OK | `docs/design/hero-rotativo/photo_restore.py:7-8`; `flux-prompts.md` (10 calls) | https://developers.cloudflare.com/workers-ai/models/flux-2-dev/ |
| 7.5 | The photographs are CC BY-SA, credited on the site with the changes stated | RUN | **WHEN** `/creditos` exists. This is a licence gap today, not just copy | 0 attribution hits across 54 route fetches | — |

## Layer 8 — Delivery

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 8.1 | The working repository is public, with every commit since the import | CI | OK | `README.md:87`; first commit `c8f0df1` (2026-04-21) | https://github.com/julioarguello/www-serverstartup-io |
| 8.2 | Every change that can reach a page passes 23 steps that can fail. A test derives that number from the workflow | CI | OK | `.github/workflows/ci.yml`; `tests/unit/gate-count.test.ts` | — |
| 8.3 | The gates run the site locally on workerd, the open-source runtime behind Cloudflare Workers, through `wrangler dev`. If wrangler crashes upstream, the stack restarts once and the summary says so | CI | OK | `scripts/ci-local-stack.sh:62,136`; `scripts/ci-gate.mjs` | https://github.com/cloudflare/workerd |
| 8.4 | When the gates pass on main, the preview deploys itself with `wrangler-action`. It waits for the D1 migrations, reseeds after rehearsing the SQL on a throwaway database, and runs a smoke battery | CI | OK | `deploy-preview.yml:81,117`; `scripts/seed-remote-preview.sh:176,408`; `verify-deploy.yml` | https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/ · https://github.com/cloudflare/wrangler-action |
| 8.5 | Production deploys only when the founder starts it by hand, and a guard refuses to overwrite a database that holds content | CI | OK | `deploy-production.yml:12-13,75-88`; `scripts/ci-guard-prod-seed.sh` | — |

## Layer 9 — Quality

| # | Claim | State | Gate | Proof | Link |
| --- | --- | --- | --- | --- | --- |
| 9.1 | Fourteen of the checks plant the defect they hunt, and must catch it before they report green | CI | OK | a11y, engines, design-tokens, layout, cms-text, citability, var-resolves, image-hrefs, headers, copy-baseline, team-copy, css-budget, locale-parity, hero-frames | — |
| 9.2 | Lighthouse in CI runs a median of 3 on 9 pages: performance ≥95, accessibility, best practices and SEO 100. All nine met it on 2026-10-16 | CI | OK; say "in CI, against a local copy" | `lighthouserc.json`; https://github.com/julioarguello/www-serverstartup-io/actions/runs/38889005508 | — |
| 9.3 | Accessibility: axe (WCAG 2.2 A+AA) and a keyboard pass on 32 routes, plus reflow at 320 px. Where text sits on a photograph, contrast is measured on the rendered pixels | CI | OK | `scripts/ci-check-a11y.mjs:827-1048` | — |
| 9.4 | Each opening is checked mid-animation and at rest in Safari's engine (iPhone and desktop profiles) and Chrome's (Pixel 7), with reduced motion too | CI | OK | `scripts/ci-check-engines.mjs` | — |
| 9.5 | The rendered text of 28 routes is frozen. Changing a word fails until the new text is deliberately re-captured, so the change shows in the pull request's diff | CI | OK | `scripts/copy-baseline.mjs`; `tests/copy-baseline/` (28) | — |
| 9.6 | AI agents write most of the code under written rules, and the founder merges every pull request | CI | OK | merge history (100/100 merged by one login) | — |
| 9.7 | Every push is scanned for secrets, and a guard rejects naming clients we may not name | CI | OK | `ci.yml:123-143`; `scripts/ci-check-citability.py` | — |

## Numbers (brag-worthy, panel-checked)

| Number | Wording | Proof |
| --- | --- | --- |
| 0 | servers behind the Worker | 3.1 |
| 0 | third-party requests when a page loads | 7.2 |
| 23 | steps that can fail before a person looks | 8.2 |
| 14 | checks that prove themselves by catching a planted defect | 9.1 |
| 7 | security headers on every rendered page | 3.3 |
| TLS 1.3 | the minimum the zone accepts | 1.2 |
| ≥95 · 100 · 100 · 100 | Lighthouse, met on 9 pages on 2026-10-16 (CI, local copy) | 9.2 |
| 28 · 32 | routes frozen in text · routes under axe | 9.5, 9.3 |
| 6 | bindings on one Worker (not "9 products": R2 is empty, and KV and Dynamic Workers have nothing to do yet) | 3.1 |

## Never claim

- **Products not in use:** Access, Turnstile, Polish, Image transformations at the zone,
  Stream, Durable Objects, Queues, Workflows, Vectorize, AI Gateway, AI Search, Browser Rendering, Analytics
  Engine, Email, Workers Builds (CI is on GitHub Actions), Workers Logs and Observability, Gradual
  deployments.
- **AI for agents:** MCP through the Agents SDK, and WebMCP (#225 on hold); llms.txt; Markdown for Agents;
  Content Signals; AI Crawl Control.
- **Settings off or unproven:** HTTP/3, NEL, D1 read replicas (not measured).
- **EmDash features not in use:** RSS (0 items), the forms plugin (registered but unused), scheduling,
  marketplace installs.
- **Workers AI** is used only at design time.
- **Phrasings the panel ruled out:** "every pull request" (docs-only PRs skip most gates); "a change does not
  go in" (main has no branch protection); "every response" for the headers (static assets skip the
  middleware).

Operational findings live outside the repository, because it is public: in the local private KB, `docs/company/private/hallazgos-operativos-535.md`, which git ignores.
