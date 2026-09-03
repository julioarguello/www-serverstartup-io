# Production cutover runbook

The ordered procedure for putting the Astro site on `serverstartup.io`, with a
rollback for every step. Issue #162.

Written to be executed, not read: every command is copy-pasteable, and every
step ends with the observation that decides whether to continue. Where a step
cannot be verified from a terminal, it says so.

**First measured 2026-08-31, re-measured 2026-09-03**, and the measurements are
the reason the order is what it is. Re-measure before you start — this file
records a state, not a promise, and between those two dates three of the rows
below changed value.

---

## 0. Where things stand

| Fact | Measured value | Why it matters |
| :--- | :--- | :--- |
| Zone nameservers | `tara.ns.cloudflare.com`, `kobe.ns.cloudflare.com` | Already Cloudflare. The cutover is a **record change inside the panel**, not a registrar nameserver change — minutes, not 48 hours, and reversible from the same screen. |
| `serverstartup.io` | `301` → `https://www.serverstartup.io/` | Apex already funnels to `www`. Keep that shape after the cutover or every existing inbound link gains a hop. |
| `www.serverstartup.io` | `200`, `server: nginx`, `34.175.111.59` | The old WordPress. Still the live site. |
| Production worker | **`200`** | Deployed. Run `33481322489`, 2026-09-01, green — after two failures whose causes are recorded in step 2. |
| Production commit | `4ac6a69`, **26 commits behind `main`** (`d12cc29`) | What is deployed is not what CI verified this morning. Step 2 is now a promotion, not a bootstrap. |
| Production D1 | `1b3b50f2-0269-4fe2-8f80-1b55b08bdfa1` | **Holds content**, seeded by that run. Not observable by counting rows from here without a token — observed instead through `www.serverstartup.dev`, which is bound to this worker and this database and serves 26 sitemap URLs. |
| Worker routes | `www.serverstartup.dev`, `preview.serverstartup.dev` (#444) | Two `.dev` hostnames, both declared. **Neither `serverstartup.io` hostname is attached to anything.** That is still the actual DNS work. |

The order below was originally forced by an undeployed worker and an empty
database. Both of those rows have flipped, so what forces it now is narrower
and worth stating plainly: **the only things left that change what the public
sees are step 3 and step 5**, and both are Julio's. Steps 1, 2 and 4 have been
executed once already; they are re-run to promote a newer commit, not to reach
a state for the first time.

---

## 1. Get `main` green and deployed to preview

Nothing else in this document is safe until CI on `main` is green, because
`deploy-preview` runs off `main` and production promotes a commit that was
verified on preview.

```bash
gh run list --branch main --limit 1 \
  --json databaseId,status,conclusion,headSha
```

**Continue when** `conclusion` is `success`. A red `main` here is a real
signal again — the Actions budget that made every check a false red (#426)
ended when #428 made the repository public.

**Rollback**: none needed; nothing has been deployed.

---

## 2. Promote the verified commit to production — **without the seed**

`deploy-production` is `workflow_dispatch` only, by design (#194): GitHub
environment required-reviewers returned HTTP 422 on a private repo, so the
manual dispatch **is** the approval gate.

> **Now changeable.** That 422 was a private-repo restriction. The repository
> is public since #428, so environment protection rules are available at no
> cost. Adding a required reviewer on the `production` environment would make
> the gate a real one instead of a convention. Not done here — it is a repo
> setting, and it is Julio's call.

**This step has already run, and that changes the command.** Production content
was a one-time seed, and it happened: run `33481322489`, 2026-09-01. The
database holds content now, the CMS owns it, and a deploy must never overwrite
it. So the dispatch is the plain one:

```bash
gh workflow run deploy-production.yml --ref main
```

Pin the ref, because a Cloudflare-adapter build cannot be promoted as an
artifact — bindings are flattened in at build time, so promotion means
rebuilding the same commit with `CLOUDFLARE_ENV=production`. `--ref main` is
right only while `main` is the commit step 1 saw green on preview; name the SHA
explicitly if anything landed in between.

> **Do not pass `-f seed_d1=true` any more.** An earlier revision of this step
> said to, and it was correct exactly once. Today `scripts/ci-guard-prod-seed.sh`
> would count the content rows, find them non-zero, and refuse — a failed run
> rather than a lost database, which is the guard doing its job. The failure
> mode worth naming is the next one: reading that refusal as an obstacle and
> re-dispatching with `seed_d1_confirm` filled in. That string exists to
> overwrite live CMS content deliberately. On the cutover path there is no
> reason to type it.

> **What the first dispatch actually did** — run 33423944295, 2026-08-31.
> It failed at the guard, which reported the production database unreadable.
> It was not: the query succeeded and returned nothing, because production sat
> **39 migrations behind** (30 applied against a canonical 69) and not one
> `ec_*` collection table existed for the seed to write into. #442 fixed both
> halves — the guard now tells "empty" from "could not measure", and the
> worker deploys *before* the seed so it can migrate the schema the seed
> writes into, with an explicit wait on the remote migration count. That is
> the order `deploy-preview.yml` has used since 2026-08-22.

Watch it. On a re-run without the seed there is much less to go wrong — the
guard, the canonical-schema build, the migration wait and the seed itself are
all `if: inputs.seed_d1` and are skipped — which leaves the build, the deploy
and `verify`:

```bash
gh run watch "$(gh run list --workflow=deploy-production.yml \
  --limit 1 --json databaseId --jq '.[0].databaseId')"
```

**Continue when** the run is green *and* its `verify` job is green —
`verify-deploy.yml` runs the 20-route battery plus headers plus the W3C Nu
validator against the deployed URL. Then confirm by hand:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  https://www-serverstartup-io.serverstartup-s-partner-demo-account3612.workers.dev/
```

`200` — as it already does today, which is why this is a weaker check than it
was when the row above read `404`. **The question is no longer whether it
answers, but whether it answers with the commit you just dispatched.** A failed
deploy leaves the previous worker serving happily. Read the run's conclusion,
not only the status code. **If it is `404`, stop** — DNS pointed at a 404 is a
worse outage than the WordPress site it replaced.

**Rollback**: none required. Nothing public has changed; the old site is still
serving `www.serverstartup.io`. A bad deploy can simply be re-run.

---

## 3. Attach the custom domains

This is the step with no local command, and the one that actually moves
traffic. In the Cloudflare dashboard: **Workers & Pages → `www-serverstartup-io`
→ Settings → Domains & Routes → Add → Custom Domain**.

### Before any of it: the bot settings (#333) — and this one has its own clock

Going orange is the moment the zone's edge features begin applying to real
traffic. Until then they are inert, which is why nobody has had to think about
them.

**Re-read 2026-09-03: twelve days left.** Cloudflare's reclassification lands
on **2026-09-15** whether or not this cutover has happened, so this is the one
item here that is not paced by the cutover. If the cutover slips past the 15th,
the check does not slip with it: the toggle would already be blocking
mixed-purpose crawlers by the time the domain goes orange, and the first
symptom would be an absence of crawling nobody is watching for. **Security → Settings → Bot traffic**, on the `serverstartup.io` zone:
read the state of *Block AI bots*, and of Bot Fight Mode and Super Bot Fight
Mode while you are there.

If *Block AI bots* is on, move to the newer control that blocks training while
**keeping search allowed**. On 2026-09-15 the legacy option starts blocking
mixed-purpose crawlers, Googlebot among them, and a corporate site has no
reason to block search. Two minutes here, and the failure it prevents is
silent: nothing breaks on cutover day, and weeks later the site stops being
crawled.

This cannot be measured from outside. Cloudflare classifies crawlers by IP and
reverse DNS, not by `User-Agent`, so a spoofed Googlebot request from any
ordinary connection is classified as an unverified bot and tells you nothing
about the setting. It has to be read in the dashboard.

### Rehearse on `serverstartup.dev` first

`serverstartup.dev` is registered in the same Cloudflare account and serves no
content of its own. Bound to the production worker it exercises every part of
this section — certificate issuance, the DNS record Cloudflare writes for you,
edge caching on a real zone, and `scripts/verify-deploy.sh` against a custom
domain — without touching the domain that carries the business.

Since #444 both hostnames are declared in `wrangler.jsonc`, so a deploy
recreates them and no reader has to open the dashboard to learn they exist:

| Hostname | Worker | What it is |
| :--- | :--- | :--- |
| `www.serverstartup.dev` | `www-serverstartup-io` | This rehearsal, and the A/B probe below. **Production data** — `/_emdash/admin` here edits live content |
| `preview.serverstartup.dev` | `www-serverstartup-io-preview` | The test environment, on its own D1, R2 and KV |

The apex is deliberately not among them, for the reason given below, and
`workers_dev: true` is explicit in both environments because wrangler switches
that hostname off as soon as a route is declared — see the comments in the
file. Both deploy workflows verify through it.

Set this on that zone before pointing anything at it: **Rules → Transform Rules
→ Modify Response Header**, if hostname equals `serverstartup.dev`, set static
`X-Robots-Tag` to `noindex, nofollow`. `public/robots.txt` says `Allow: /`, so
without it the rehearsal is crawlable. Confirm it from the wire, not the panel:

```bash
curl -sI https://serverstartup.dev/ | grep -i x-robots-tag
```

Expect the zone's own anycast addresses (`104.21.x.x`, `172.67.x.x`), not the
`188.114.9x.x` pair `workers.dev` uses. That difference is what makes the
rehearsal domain a standing A/B probe for the block described below: one
worker, two address ranges, so when one stops answering, the other says whether
the cause is the network or the site.

Measured 2026-09-01, `scripts/verify-deploy.sh https://www.serverstartup.dev`
returned ALL GREEN — 26 sitemap URLs agreeing with the route inventory both
ways, all 10 redirects, the header suite on every sampled route, 0 W3C Nu
errors.

> **The rehearsal zone is currently rehearsing the mistake, too.** Measured
> 2026-09-03: `https://serverstartup.dev/` — the bare apex, which is
> deliberately *not* in `wrangler.jsonc` — answers `200` from Cloudflare with
> the full page, and emits
> `<link rel="canonical" href="https://www.serverstartup.io/">`, byte-identical
> to what `www.serverstartup.dev` emits. So the duplicate-host shape described
> below is not a prediction any more; it is running, on the rehearsal zone,
> right now. It costs nothing there — the `X-Robots-Tag` rule keeps the whole
> zone out of the index — which is precisely why it went unnoticed, and why it
> is worth reading before doing the same thing on the zone that has no such
> rule. Something in the panel binds that apex; find it and remove it while you
> are in the dashboard for the bot settings, and the rehearsal becomes a
> rehearsal of the right thing.

### Then the real one

Add **one** Custom Domain, and only one:

1. `www.serverstartup.io` — the canonical host, where the 200 lives.

**Do not add the apex as a Custom Domain.** An earlier revision of this step
said to add both, on the assumption that the apex would go on returning `301`
to `www`. It will not. A Custom Domain binds the hostname straight to the
worker, and the worker answers on every host it is handed. Measured on the
rehearsal zone with both hostnames bound: apex and `www` each returned `200`
with the full page, and both emitted the same
`<link rel="canonical" href="https://www.serverstartup.io/">`. That is #334
again — one page reachable at two URLs — moved from the trailing slash to the
host.

The apex belongs in a redirect, not a binding: **Rules → Redirect Rules →
Create**, if hostname equals `serverstartup.io`, static redirect to
`https://www.serverstartup.io` with status **301**, *preserving path and query
string*. Create it before binding `www`, so the apex is never even briefly a
second origin for the same content.

**And the apex record has to be orange first, or that rule never runs.** A
Redirect Rule only executes for hostnames Cloudflare proxies, and today the
apex is grey — DNS-only. Measured 2026-09-01:

```
https://serverstartup.io/       301  nginx   (no cf-ray)
https://www.serverstartup.io/   200  nginx   (no cf-ray)
```

The `301` there is real, but it comes from the origin being replaced, not from
Cloudflare. So the order has one more step than it looked:

1. **DNS → `A` record for `serverstartup.io` → Proxied.** Leave the value at
   `34.175.111.59`; this changes who answers, not where it points.
2. Create the Redirect Rule above.
3. Verify it is Cloudflare answering, not nginx — the status code alone cannot
   tell you, because both return `301`:

   ```bash
   curl -sI https://serverstartup.io/ | grep -iE '^(HTTP|location|cf-ray|server)'
   ```

   No `cf-ray` means step 1 did not take, and the redirect you are looking at
   is still the old server's.

Skipping step 1 is not a visible failure, which is what makes it worth writing
down. The apex goes on redirecting exactly as before — from nginx, on the host
this whole procedure exists to decommission. The site would read as migrated
while one of its two public hostnames still depended on the machine we are
walking away from.

Adding a Custom Domain makes Cloudflare replace the existing `A` record with
the proxied worker binding automatically. **Record the current records before
you touch anything**, because that is the rollback:

```bash
dig +short A serverstartup.io      # expect 34.175.111.59
dig +short A www.serverstartup.io  # expect 34.175.111.59
```

Write both values down somewhere outside this repository.

**Check which addresses the domain landed on, and keep checking.** The
worker's own `workers.dev` hostname resolves to `188.114.96.5` and
`188.114.97.5`. On 2026-08-31, from a Spanish domestic connection, both
accepted no TCP on 443 — while `188.114.98.1` and `188.114.99.1`, in the same
`/20`, answered normally, as did every other Cloudflare range tried. Two
specific anycast addresses null-routed rather than a range: the shape of the
court-ordered blocks Spanish ISPs apply during football broadcasts, which take
Cloudflare-hosted bystanders down with the target.

**And it comes and goes.** The same two addresses answered normally on
2026-09-01 at 09:11, from the same connection, with nothing changed in between.
So one reading decides nothing in either direction: a red measurement on
cutover day is not grounds to roll back a deploy that is fine everywhere else,
and a green one is not clearance. Read it more than once, at different hours,
and give weight to an evening during a league fixture — that is when the order
is in force.

The site being replaced is on Google Cloud (`34.175.111.59`) and is immune.
Moving to Cloudflare is what creates the exposure, so measure it:

```bash
for ip in $(dig +short A www.serverstartup.io); do
  curl -s -o /dev/null --connect-timeout 4 "https://$ip/" 2>/dev/null
  [ $? -eq 28 ] && echo "$ip UNREACHABLE" || echo "$ip reachable"
done
```

A Custom Domain takes the zone's anycast addresses, which need not be the two
above — which is why this is a measurement and not a prediction. If it does
land on blocked addresses, the rollback below is the immediate answer.

**Verify** — and note that `%{http_code}` alone is not enough, because the old
site also answers 200. The `server` header is what distinguishes them:

```bash
for u in https://serverstartup.io/ https://www.serverstartup.io/; do
  printf '%-32s ' "$u"
  curl -sI --max-time 10 "$u" | awk '
    /^HTTP/{c=$2} /^[Ss]erver:/{s=$2} END{print c, s}'
done
```

**Continue when** `www` answers `200` and the `server` header is no longer
`nginx`, and the apex answers `301` — now from the Redirect Rule rather than
from the old origin, which is why the rule goes in first. While `www` still
says `nginx`, the change has not propagated or has not been applied. If the
apex answers `200`, it was bound as a Custom Domain after all; remove that
binding before continuing.

**Rollback**: remove the Custom Domain in the same screen, delete the Redirect
Rule, and re-create the two `A` records with the values captured above. Cloudflare proxies these records,
so the TTL a resolver sees is short and reversal is fast — this is the whole
reason the cutover is low-risk, and the reason to capture those values first.

---

## 4. Verify the real domain, not the workers.dev one

```bash
scripts/verify-deploy.sh https://www.serverstartup.io
```

20 routes, the security-header suite, and W3C Nu. Then the eight legacy
WordPress URLs, which are #162's own checkbox:

```bash
for p in / /quienes-somos/ /cdn-waf-seguridad-edge-cloudflare/ \
         /ingenieria-greenfield-y-sistemas-criticos/ /integracion-de-sistemas/ \
         /comercio-electronico/ /contacto/ /big-data-cloud-analytics/; do
  printf '%-46s ' "$p"
  curl -s -o /dev/null -w '%{http_code} → ' --max-time 8 "https://www.serverstartup.io$p"
  curl -sL -o /dev/null -w '%{http_code}\n'  --max-time 8 "https://www.serverstartup.io$p"
done
```

Expect `200` for `/` and `301 → 200` for the other seven. All eight were
verified against the local stack on 2026-08-31, landing on semantically
correct pages, and **re-verified 2026-09-03 against `www.serverstartup.dev`** —
the same worker and the same production database this domain will be pointed
at. That run is the strongest evidence available before the cutover, and it is
still not the cutover: it exercises the redirect mechanism on the production
build, not the hostname. It also exercised the commit that is deployed
(`4ac6a69`), not the one step 2 promotes — so run it again after step 2, and
again after step 3, on the real host.

Measured the same day on that host, and the reason the three remaining
checkboxes on #162 can be read as met by the *mechanism*: `/sitemap.xml` `200`
with 26 `<loc>` entries, `/robots.txt` `200` declaring
`Sitemap: https://www.serverstartup.io/sitemap.xml` and `Disallow: /_emdash/`,
and an unknown path answering `404` with the Spanish custom page rather than a
framework default.

**There is no redirect map, and there does not need to be one.** Anyone looking
for one in `src/` will not find it and may conclude the checkbox is unmet. The
eight legacy paths are covered by **slug parity plus trailing-slash
normalisation**. The single slug that changed is handled properly rather than
duplicated:

| Legacy URL | Behaviour on the new site |
| :--- | :--- |
| `/ingenieria-greenfield-y-sistemas-criticos/` | `301` → `/desarrollo-greenfield`, `<link rel=canonical>` points there, and the legacy slug is **absent from the sitemap** (26 entries) |

That is a two-hop chain — slash-strip, then slug-rewrite. Acceptable, and worth
knowing before someone reports it as a bug.

**Rollback**: step 3's.

---

## 5. Search Console

Only after step 4 is green, and only from Julio's Google account:

- Verify the `serverstartup.io` property (DNS TXT, since the zone is already
  on Cloudflare).
- Submit `https://www.serverstartup.io/sitemap.xml` — 26 URLs.
- Leave the old WordPress property in place. It is the record of what the
  redirects are healing.

**Rollback**: not applicable; nothing here affects what is served.

---

## Traps that have already cost time

Each of these produced a green that was not true.

- **The seed is an upsert.** A warm `.wrangler/state` reports a successful
  reseed while continuing to serve the previous page bodies. Local verification
  of any seed change needs `rm -rf .wrangler/state` before the rebuild, or it
  is measuring the run before it (#428).
- **Local gates are not CI.** `ci-check-a11y.mjs` samples rendered pixels and
  takes a percentile, so its verdict depends on font metrics — it passed on
  macOS and failed on Linux CI for an identical tree (#436). Compute contrast
  from the two token values when checking a fix; do not trust a local green.
- **`MERGED` is not proof of integration.** Squash rewrites the SHA, so
  `git log <base>..<branch>` keeps listing commits that are already in. Check
  by content.
- **A half-applied migration wedges the schema forever, and looks like a hang.**
  Production sat at 30 applied migrations while the deploy polled 36 times
  without the number moving. It was not slow: `032_rate_limits` had run its
  first statement in April, creating `_emdash_rate_limits`, and had never been
  recorded in `_emdash_migrations` — its index and its `_emdash_device_codes`
  column were both absent. `createTable` carries no `ifNotExists`, so every
  retry died on the table it had itself created, wrote nothing, and the
  middleware backed the isolate off. The tell is D1's own counters: **1,378
  reads and 0 writes in 24 h** while preview showed 47 writes. Reads without
  writes means the worker is alive and refusing to migrate, not idle. The fix
  was to drop the orphan table — it held 0 rows — and let EmDash own the
  schema, rather than hand-writing the migration row.
- **Spanish ISP blocks hit Cloudflare bystanders, and CI cannot see them.**
  Measured 2026-08-31 from a domestic connection: the two addresses the
  production worker resolves to accepted no TCP on 443, while their neighbours
  in the same `/20` answered. A site that is up everywhere else is simply gone
  for those users, and no check run from GitHub's runners will ever show it —
  they are not behind the block. Reachability from Spain is a separate
  measurement from a green deploy — and an intermittent one: the same
  addresses answered on 2026-09-01. Measure repeatedly, and use
  `serverstartup.dev` as the control, because it serves the same worker from a
  different address range.
- **The old site answers 200 too.** Any cutover check that reads only the
  status code cannot tell the two sites apart. Read `server`.

---

## What is not in this document

**The decision to run it.** Steps 3 and 5 are Julio's, and step 2 writes to a
production database. Nothing here should be executed by an agent on its own
initiative.
