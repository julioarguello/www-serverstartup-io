# Vendored: EmDash skill pack

Reference material for working with [EmDash](https://emdash.dev) — building a
site, writing plugins, driving the CLI. Useful, and **not ours**.

## Where it came from

| | |
| :--- | :--- |
| Source | [emdash-cms/emdash](https://github.com/emdash-cms/emdash) `skills/` — `building-emdash-site`, `creating-plugins`, `emdash-cli` |
| Version | tag **`emdash@1.3.1`**, commit `12a1793` (#627; previously `emdash@0.34.0`, #616) — must equal the `emdash` version in `package-lock.json`; `tests/unit/vendor-emdash-skills.test.ts` fails otherwise |
| First import | 2026-04-21, commit `c8f0df1` by `cloudflare[bot]`: the `blog-cloudflare` template's `.agents/skills` at 0.6.0, moved here in `7980f6a` (#391) |
| Modified here | **No.** Every file is byte-identical to the tag; only this README is ours |

Verify — prints nothing when every blob matches the tag's tree:

```bash
diff \
  <(gh api "repos/emdash-cms/emdash/git/trees/emdash@1.3.1:skills?recursive=1" \
      --jq '.tree[] | select(.type=="blob") | "\(.sha) \(.path)"' \
    | grep -E ' (building-emdash-site|creating-plugins|emdash-cli)/' | sort -k2) \
  <(git ls-tree -r HEAD vendor/emdash-skills | grep -v README.md \
    | awk '{sub("vendor/emdash-skills/", "", $4); print $3, $4}' | sort -k2)
```

## Keep it at the installed version

Refresh this directory **in the same PR that changes the `emdash` version**,
from `skills/` in emdash-cms/emdash at the tag `emdash@<that version>` — 1.x
tags carry it too. Upstream also mirrors the pack to
[emdash-cms/skills](https://github.com/emdash-cms/skills) for
`npx skills add emdash-cms/skills`, but that repository has no tags, so a copy
from it cannot be pinned or verified as above; and the tool writes to
`.claude/skills` or `.agents/skills`, neither of which this repository uses.
At 1.3.1 upstream `skills/` holds ten skills. Only these three are vendored, by
decision (#627): `upgrading-emdash` is used from the updater itself, the two
`wordpress-*` skills do not apply (no WordPress source), and
`adversarial-reviewer`, `agent-browser`, `ux-acceptance-coordinator` and
`writing-emdash-docs` are about working on EmDash, not with it.

## One thing the upstream text gets wrong for this project

`building-emdash-site/SKILL.md` sends you to the plugin skill "in
`.agents/skills/creating-plugins/`". Here it is
`vendor/emdash-skills/creating-plugins/`. The file is upstream's and is not
edited to say so — that is what this paragraph is for. (The 0.34.0 text also
stopped documenting `emdash seed`; 1.x documents it again, in
`emdash-cli/SKILL.md`.)

## Why it is not called `.agents`

It was, until #325. One character separated it from the private `.agent`
directory this project excludes: one public, tracked, vendored, and not ours;
the other private, never committed, and ours. Every rule written about either
one read as if it were about the other, and nothing in the repository told a
reader which was which. `vendor/` is the conventional name for code a project
carries but does not own, and this is the first thing in it — the directory
exists because of this pack. Anything else vendored later belongs beside it.

## Editing

Don't. It is a snapshot of somebody else's documentation. If something here is
wrong, the fix belongs upstream; if we need our own version of it, it belongs
in `docs/`.
