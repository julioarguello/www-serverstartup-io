# Working on this repository

This file is for whoever picks the repository up next — a person or an agent.
Everything in it is true for a plain clone, with nothing else installed and no
access to anything private. If you find a claim here you cannot check from the
files in front of you, that is a bug in this file; say so.

## What this is

The Server Startup website: [Astro](https://astro.build) rendering content from
[EmDash](https://emdash.dev), on Cloudflare — Workers for the runtime, D1 for
the content, R2 for editor-uploaded media. Both Astro and EmDash are Cloudflare's
own, so the serving path is Cloudflare end to end.

Content lives in the CMS. Templates lay it out. That separation is the single
most important thing to preserve here, and most of the rules below are it,
restated for a specific case.

## Running it

```bash
npm install
npx emdash dev         # dev server on :4321, admin at /_emdash/admin
```

The first boot creates the local D1 database and runs the CMS migrations. It
is empty until you seed it, and this is where the afternoons go: `npx emdash
seed` writes to `./data.db` by default, while the dev server reads **Wrangler's
D1 emulator**. Seed the wrong one and the server looks perfectly healthy while
every page redirects to `/404`.

The seed recipe and the query that tells you which database has the content are
in [`CONTRIBUTING.md`](CONTRIBUTING.md); the clean rebuild after a schema change
is in [`docs/architecture.md`](docs/architecture.md) §10.1.

## The quality bar

Fifteen CI steps can fail a PR. All but one run locally too — the exception is
the secret scan, a GitHub Action over the full history, which a working tree
cannot reproduce. [`CONTRIBUTING.md`](CONTRIBUTING.md) has the table: gate,
local command, target, in the order CI runs them. Run them before opening a PR
— CI is confirmation, not discovery.

One convention worth knowing before you add anything to `scripts/`:

> **A check that finds no problems and a check that _cannot_ find problems
> print the same green line.** Every gate here plants the exact defect it
> hunts, in a fixture it owns, and refuses to report anything if it no longer
> finds it. Fixtures live in temporary directories and in-memory strings —
> never in the repository tree, because a canary in the tree trips the guard it
> exists to prove.
>
> A blind guard exits **3**, distinct from exit 1 meaning *it found something*.
> All seven do. They are opposite problems — one says you broke a rule, the
> other says the rule can no longer be checked — and a run that confuses them
> sends the next person hunting for a violation that is not there.

If you add a gate, break it on purpose first and watch it fail. A gate never
observed failing is not known to work.

## Rules that are not obvious from the code

**Content belongs in the CMS.** No paragraph text, phone number, email address,
CTA label or UI string is written in a template. Text comes from the CMS, UI
labels come from locale-scoped widgets, contact details come from site settings.
A gate enforces this (`scripts/ci-check-cms-text.py`) and it will fail you.

**Both languages, always.** Every Spanish route has an English counterpart.
Slugs are *translated*, not prefixed, so an alternate URL is never derived by
sticking `/en` in front of a path — that guess 404s. `src/utils/alternate.ts`
is the single place that resolves them.

**Colour, radius, shadow and width come from `src/styles/theme.css`.** A
literal anywhere else fails the build. When a component deliberately imitates
foreign chrome — a cart, a BigQuery console, a GitHub PR — fence it with
`/* token-guard: off — reason */ … /* token-guard: on */` and say why.

**One column.** `--container-max` is the measure, and everything ends at its
right edge: headings, prose, boxes, panels. A second, narrower measure for body
text was tried and rejected — two measures alternate long and short right edges
down the page, and that alternation is what reads as having no criterion.

**Who may be named.** Three tiers, and confusing them is easy — this paragraph
was rewritten in #478 because its previous version described the second one
wrongly and made a legitimate edit look like a policy breach.

1. **Machine-readable public copy** — the `/referencias` logos, the `references`
   collection, JSON-LD, anything a crawler reads. Only clients already published
   on the site, which is the whitelist at `scripts/ci-check-citability.py:62`.
   `check_whitelist()` enforces it on every PR.
2. **The `<canvas>` closers** — the `Hemos montado X para:` lists on the vertical
   pages. These carry names that are **not** publicly citable. They are drawn
   onto a canvas at runtime, so they exist neither in the HTML source nor in the
   DOM text, and they sit base64-encoded in `seed/seed.json` so they are not
   plaintext in the tree either. A person reading the page sees them; a crawler,
   a scraper and `grep` do not. `src/components/service/RefsNoIndex.astro` is
   the whole mechanism.
3. **Everyone else** — anonymously ("a grocery chain") or in aggregate.

Say plainly what follows from tier 2: **no gate will question a name added to a
canvas closer.** The forbidden-name scan reads text and the payload is base64;
the whitelist check reads the `references` collection and a closer is not in it.
So a green CI run there is not approval, it is silence — the decision to name a
client that way is the founder's and is taken outside CI. Do not read the absence
of a red check as one having been made.

`scripts/ci-check-citability.py` still checks the whole tree on every PR for tier
1, including the text inside documents that `grep` skips, and its failure message
tells you which rule you hit.

## Where things are

| Path | What |
| :--- | :--- |
| [`src/`](src/) | Astro pages, components, layouts, utilities |
| [`src/styles/theme.css`](src/styles/theme.css) | Every design token. The only place they are declared |
| [`seed/seed.json`](seed/seed.json) | The CMS bootstrap corpus — content, menus, widgets, settings |
| [`scripts/`](scripts/) | Every quality gate, runnable on its own |
| [`tests/`](tests/) | Unit tests, and the frozen copy baselines |
| [`docs/architecture.md`](docs/architecture.md) | How it fits together, and why each decision was taken |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup, the gate table, branching, the release path |
| [`vendor/emdash-skills/`](vendor/emdash-skills/) | Reference material on EmDash — building a site, writing plugins, driving the CLI |

`vendor/` is imported material, kept verbatim. It is useful and it is **not
ours**: read it, do not edit it. Each directory's README names the upstream, the
commit and the date it was taken, so a refresh replaces the directory wholesale
instead of trying to reconcile local edits nobody recorded.

## A note on the private half

Our internal working rules live in a separate, private repository. Nothing in
this one depends on it: a clone builds, tests, and deploys without it, and no
file here should reference a path inside it. If you find one that does, it is a
mistake — the rules that matter to an outside contributor are the ones written
above, in this file, where they can be read.
