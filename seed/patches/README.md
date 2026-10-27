# Content patches

How a text change reaches the live site. Issue #662.

> [!TIP]
> **TL;DR** — edit the text through a patch file, never in the production admin. Write the file, then
> put the same change into `seed.json` and let CI and the production deploy do the rest:
>
> ```bash
> node scripts/content-patch.mjs seed seed/patches/2026-10-26-<slug>.json   # same change into seed.json
> node scripts/content-patch.mjs check                                      # what CI runs on every PR
> ```
>
> The production deploy applies pending patches on its own and refuses to overwrite a value that
> someone has changed in the admin.

## Why patches, not the seed

`seed/seed.json` creates a site the first time. EmDash does not let it change a live one:

> "Later edits to the seed file are not re-applied to that database … Existing data is never
> overwritten."
> — `vendor/emdash-skills/building-emdash-site/references/schema-and-seed.md`

The site went live on 2026-10-25, so its content lives in the production database. The admin could edit
that content directly, but an edit made there gets no PR, no copy gate and no record in the repository.
A patch keeps the PR, the gates and the history, and still writes through EmDash itself: every change
is an ordinary revision that the admin can revert.

We pay for this with a small script of our own, `scripts/content-patch.mjs`. EmDash supplies the parts
it is built from but does not ship this workflow.

## The convention

One file per change, named `YYYY-MM-DD-<slug>.json`. The date in the name sets the order in which patches
are applied. A file looks like this:

```json
{
	"date": "2026-10-26",
	"issue": 662,
	"summary": "What changes and why, in one sentence.",
	"changes": [
		{
			"collection": "layers",
			"slug": "cache",
			"locale": "es",
			"path": ["facts", { "key": "h2-2" }, "text"],
			"before": "The text the site holds today.",
			"after": "The text it will hold."
		}
	]
}
```

- **`path`** leads from the entry's data to one value. A segment is one of:
  - a field name;
  - an index into a list;
  - a one-key selector such as `{ "key": "h2-2" }`, which picks the single list item whose field
    matches. If the selector matches no item, or more than one, the patch fails.
- **`before`** is the value the patch expects to find. **`after`** is the value it writes. Both can be a
  string, a number or any JSON value.
- One change per value in a patch. A patch, or two patches, cannot change a value and also its
  parent, such as `facts` and `facts[0].text`; `check` rejects it.
- A patch is only for content that already exists. Collections and fields come from the seed's schema;
  entries come from the seed itself. The one exception is a UI-label widget, below.

### UI labels: a change to a widget

UI labels live in the `ui_labels_es` and `ui_labels_en` widget areas, which are not a collection. A
change names the widget instead of an entry:

```json
{
	"widgetArea": "ui_labels_es",
	"widget": "consent",
	"path": ["content"],
	"before": null,
	"after": [{ "_type": "block", "style": "normal", "_key": "accept", "children": [{ "_type": "span", "text": "Aceptar" }] }]
}
```

- **`widget`** is the widget's title, the first argument of `labels.get()`.
- **`path`** is always `["content"]`. A widget change writes the widget's whole list of blocks, so a
  later change to one label repeats the list with that label changed.
- **`before: null`** means the widget does not exist yet. Applying the change creates it at the end of
  the area. In `seed.json`, `content-patch.mjs seed` appends it to the area's `widgets`.
- A widget has no revisions and no `_rev`, so its write has no optimistic concurrency. The pre-flight
  read is the only guard: an admin edit made between that read and the write is overwritten. After
  writing, the run reads the widget back and checks its content and type.
- Create at most one new widget per area in a patch. `seed` would insert two at the same place in
  reverse order, and it refuses rather than write that.
- The edge cache is not proven to follow. EmDash's widget handlers invalidate the area's cache tag
  through Astro's route cache, but no widget write has been watched reaching Cloudflare's cache. Until
  one has, a page showing the label may serve the old text for up to the one-hour edge TTL set in
  `src/middleware.ts`.

The same change also goes into `seed.json`. `content-patch.mjs seed <file>` writes each `after` into the
seed by replacing only that value's text, so the hand formatting elsewhere in the file survives. It
refuses to write if anything else would change.

## How a patch reaches production

Each node is a stage a change passes through, and each arrow is the order. Colour marks the role:
purple for our files and scripts, blue for what runs in CI, green for where readers see the change, and
amber for EmDash's database.

```mermaid
%%{init: {"theme":"base","themeVariables":{"lineColor":"#5a5248","edgeLabelBackground":"#f4f2ee"}}}%%
flowchart LR
	PR["PR: patch + seed.json"]:::ours --> CI["CI: content-patch.mjs check"]:::runtime
	CI --> Main["merge to main"]:::ours
	Main --> Preview["deploy-preview: reseed from seed.json"]:::outcome
	Main --> Prod["deploy-production: content-patch.mjs apply"]:::runtime
	Prod --> API["EmDash API: update + publish a revision"]:::store
	classDef ours     fill:#f3eef8,stroke:#7a5ba6,stroke-width:2.4px,color:#33204d
	classDef runtime  fill:#e8f1fb,stroke:#3d6fa8,stroke-width:2.4px,color:#12314f
	classDef outcome  fill:#eef5ec,stroke:#4f8a52,stroke-width:2.4px,color:#1d3a1f
	classDef store    fill:#fbf4e0,stroke:#b8912e,stroke-width:2.4px,color:#4a3a10
```

- **On every PR**, `content-patch.mjs check` validates every patch and confirms that `seed.json` already
  holds each `after`. A patch without its seed change fails CI.
- **The preview** reseeds from `seed.json` on every deploy, so it already shows the change.
- **The production deploy** runs `content-patch.mjs apply` after the worker is deployed. It reads each
  value first and only then decides what to do:

  Patches that change the same value form a **chain** in date order. If one patch changes A to B and a
  later one changes B to C, the value's **target** is C, and `seed.json` must hold C.

  | The site holds | What happens |
  | :--- | :--- |
  | the target | already applied, so it is skipped. No ledger is kept: the content says what was applied |
  | an earlier state of the chain (A or B above) | it is written to the target with the entry's `_rev` (optimistic concurrency), published, then read back |
  | anything else | someone edited **that value** outside the repository. The run **writes nothing** and fails, naming it |

  Before writing anything, the run reads every entry it will touch. Any conflict, or an entry with an
  unpublished draft, means it writes nothing at all. After writing an entry, it checks three things:
  the entry was published, the patched fields read back as written, and every other field is unchanged.

  The guarantee is per value, not per entry. An admin edit to a field that no patch touches goes
  unnoticed, and it is lost the next time someone rebuilds from the seed. Hence the rule in
  `CONTRIBUTING.md`: do not edit text in the production admin.

  Writes across several entries are not atomic. If a write fails part-way (the network, or a `409` when
  someone saved the entry between the read and the write), the run stops with exit 3. It lists what it
  already wrote and published, and what it did not. A second run skips what was written and retries
  the rest.

## The token

The deploy authenticates with an EmDash API token held in the `production` environment's
`EMDASH_TOKEN` secret.

1. Create the token in the production admin, at `/_emdash/admin/settings/api-tokens`, with the scopes
   `content:read` and `content:write`.
2. Store it as the `EMDASH_TOKEN` secret of the `production` environment in GitHub.

Without the secret the deploy fails on this step with a message that says so. It never skips the step
silently.

## Running it by hand

```bash
node scripts/content-patch.mjs apply --url https://www.serverstartup.io --dry-run   # what would change
node scripts/content-patch.mjs apply --url http://localhost:8787 --dev-bypass       # a local dev server
```

`--dev-bypass` works only against a dev server (`astro dev`), through EmDash's development login. A
remote site needs `EMDASH_TOKEN` in the environment.

## Explanation: what was checked before this was trusted

Measured 2026-10-26 against a local dev server seeded from main's `seed.json`:

- The first patch wrote 14 values across 8 entries. Each entry gained a new published revision, with
  no draft left behind. A field-by-field diff of the entries before and after showed only those 14
  values changed.
- A second run wrote nothing and reported every change as already applied.
- After a value was edited through the API, the run refused and wrote nothing.
- With an unpublished draft on an entry, the run refused and wrote nothing.
- The page rendered the new text and showed 50 facts, up from 46.

Not measured locally, because a dev server cannot purge the edge: whether publishing through the API
purges the production cache. The first production run checks it.
