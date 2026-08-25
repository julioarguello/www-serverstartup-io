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
npm ci
npm run dev            # Astro dev server
```

The dev server talks to Wrangler's local D1 emulator, **not** to `./data.db`
— which is where `npx emdash seed` writes by default. Seeding the wrong
database is the most common way to lose an afternoon here; the symptom is
pages redirecting to `/404` from an apparently healthy server. The seed
recipe, the clean-rebuild procedure and the diagnosis query are in
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## The quality bar

Fifteen CI steps can fail a PR, and every one of them runs locally first.
[`CONTRIBUTING.md`](CONTRIBUTING.md) has the table: gate, local command,
target. Run them before opening a PR — CI is confirmation, not discovery.

One convention worth knowing before you add anything to `scripts/`:

> **A check that finds no problems and a check that _cannot_ find problems
> print the same green line.** Every gate here plants the exact defect it
> hunts, in a fixture it owns, and refuses to report anything if it no longer
> finds it. Exit **3** means *this guard went blind*, distinct from exit 1
> meaning *it found something*. Fixtures live in temporary directories and
> in-memory strings — never in the repository tree, because a canary in the
> tree trips the guard it exists to prove.

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

**Who may be named.** Public copy names only the clients already published on
the site. Everyone else appears anonymously ("a grocery chain") or in aggregate.
`scripts/ci-check-citability.py` checks the whole tree against that policy on
every PR, including the text inside documents that `grep` skips.

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

## A note on the private half

Our internal working rules live in a separate, private repository. Nothing in
this one depends on it: a clone builds, tests, and deploys without it, and no
file here should reference a path inside it. If you find one that does, it is a
mistake — the rules that matter to an outside contributor are the ones written
above, in this file, where they can be read.
