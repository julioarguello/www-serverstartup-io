# `seed/content/` — the markdown half of the copy loop

**The seed is what renders**: the frozen `seed/base.json` plus every patch in
`seed/patches/` (#697). Nothing in `src/`, `scripts/`, `package.json` or
`.github/` reads the files in this directory. Editing a `.md` here and stopping
changes nothing on the site.

These files exist because the copy that ends up in the seed is Portable Text,
and hand-forging its `markDefs` is how two locale mix-ups reached the tree in one
week (#305). So links, emphasis and headings are written as markdown, and the
CMS converts them server-side. This directory is the input to that conversion,
and a content patch is its output.

## Changing copy

Edit the `.md`, then run both halves. Three commands, in this order:

```bash
npm run dev                                              # 1. Astro dev server (composes the seed first)
scripts/load-content.sh services --url http://localhost:4321   # 2. markdown → CMS
python3 scripts/seed-sync-services.py --name <slug> services   # 3. CMS → seed/patches/<today>-<slug>.json
```

The third writes one patch holding every field the CMS now stores differently
from the seed; the issue comes from the branch name, or `--issue N`. Then
commit the `.md` **and** the patch together, and run
`node scripts/content-patch.mjs check`. Half a round trip is the failure this
directory keeps having.

Copy that has no `.md` here — most pages — is changed by writing the patch by
hand (`seed/patches/README.md`). That is fine; it just means the Portable Text
is written by hand.

### The server it needs is not the one you have running

`npm run dev` is **not** the stack `scripts/ci-local-stack.sh` boots on :8787.
That one is `wrangler dev` over the built output, where `import.meta.env.DEV` is
false and EmDash therefore refuses the dev bypass — every admin route answers
401 and the CLI reports `Not authenticated`, which looks like a missing password
and is a build mode. There is no login to find: use the Astro dev server (#500).

Two things about it that cost time the first time:

- Astro 7 **daemonises** it. `npm run dev` returns immediately;
  `npx astro dev status` and `npx astro dev stop` are how you see and end it.
- It binds **IPv6 only**. `http://localhost:4321` answers, `http://127.0.0.1:4321`
  answers nothing at all — a health check written the second way reports a
  server that is running perfectly as dead.

Bring the :8787 stack down first. Both servers open the same local D1 sqlite,
and concurrent writes corrupt the FTS tables.

Not `npx emdash dev` either, though older notes say so. It defaults to
`--database ./data.db`, while `seed-sync-services.py` reads the D1 under
`.wrangler/state/`. Load into one and sync from the other and the second step
finds nothing you just wrote — `data.db` in this checkout was last touched in
August. `npm run dev` uses the `.wrangler` D1, which is why the loop closes.

## What keeps the two halves honest

`tests/unit/content-mirror.test.ts` compares every file here against the entry
it mirrors, as plain text. It does not check markup — the converter is
inconsistent about inline code inside links and bold — but it does check every
word, in order.

It was written because both halves had already drifted, silently and in the
direction that matters: the client list in the two `cdn-waf` files was two names
short of the published one, and the two `greenfield` files still promised
"three senior engineers" after the number came off the site. Running the loader
on that markdown would have published both regressions.
