<!-- AUTO-GENERATED — DO NOT EDIT MANUALLY. Your edits are overwritten on the next setup run. This project's own items live in .github/pull_request_template.project.md and are appended last. -->

## Review Checklist (Cloudflare / Node)
- [ ] The project's own checks pass — every lint, typecheck and test script its `package.json` defines, by the names it defines
- [ ] The Worker builds and serves locally (`wrangler dev`, or the dev command the project documents) and the changed routes answer

---

## Review Checklist (Process)
- [ ] The project's own checks (the steps its CI runs: lint, tests, `dbt parse`…) ran locally on THIS branch — all of them, not a subset; any skipped one is named below
- [ ] Those checks ran on the target branch's current head: `git fetch origin && git rev-list --count HEAD..origin/<target>` printed `0` (a merge or rebase after the run means running them again)
- [ ] Conventions checked against this repository's own CONTRIBUTING and `docs/`; any convention accepted rather than followed is named below
- [ ] Every numbered item and acceptance criterion of the issue is done, or the deviation is named below with its reason
- [ ] Every acceptance criterion has a test that goes red when the behaviour it names is removed — name the mutation you tried
- [ ] Not stacked — nothing here depends on another open pull request; a change that needs another waits for it to merge
- [ ] Tech-debt markers (`FIXME(tech-debt)`, `TODO(tech-debt)`, `HACK(tech-debt)` comments) that this PR adds AND removes are listed — never one side alone
- [ ] The issue or ticket this branch is named after is linked: `Closes #<n>` for a GitHub issue (check the sidebar, not the text), the ticket key for Jira
- [ ] **Not verified**: gates skipped, findings accepted, and anything changed but not exercised — "none" only when every box above was ticked from evidence; a reviewer who has to guess assumes everything was checked

---

## What this changes, and why

<!-- Two or three lines. The reader is deciding whether the change is the right
     one, not reading the diff twice. Link the issue: Closes #N / Refs #N. -->

## How it was verified

<!-- Name the command and its result, not the intention. A gate you broke on
     purpose and watched fail is worth more than one you ran once and passed. -->

## Not verified

<!-- The list the Process checklist's last box asks for — write it here, once.
     Gates that were skipped, and why. Anything changed but not exercised.
     A reviewer with nothing here assumes everything was checked. -->

---

- [ ] `npx astro check` — 0 errors (`.astro`, `.ts` and `tsconfig.json` changes break the
      Cloudflare build on a type error even when the dev server is happy)
- [ ] `npm test` — the unit suites, including the boundary and reserved-path guards
- [ ] The quality gates in `CONTRIBUTING.md` that this change can reach,
      run locally first — CI is confirmation, not discovery
- [ ] Copy changes live in the CMS seed, not in a template
- [ ] Both locales, if a route or a UI string moved
