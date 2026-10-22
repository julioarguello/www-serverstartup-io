<!-- AUTO-GENERATED — DO NOT EDIT MANUALLY. Your edits are overwritten on the next setup run. This project's own items live in .github/pull_request_template.project.md and are appended last. -->

## Review Checklist (Cloudflare / Node)
- [ ] The project's own checks pass — every lint, typecheck and test script its `package.json` defines, by the names it defines
- [ ] The Worker builds and serves locally (`wrangler dev`, or the dev command the project documents) and the changed routes answer

---

## Review Checklist (Process)
- [ ] The project's own gates ran on THIS branch — the full set, not a subset; every SKIP is named below
- [ ] The gates ran on the target's current head: `git fetch origin && git rev-list --count HEAD..origin/<target>` printed `0` (a merge or rebase after the run means running them again)
- [ ] Conventions checked against this repository's own CONTRIBUTING and `docs/`; any convention accepted rather than followed is named below
- [ ] Every numbered item and acceptance criterion of the issue is done, or the deviation is named below with its reason
- [ ] Every acceptance criterion has a test that goes red when the behaviour it names is removed — name the mutation you tried
- [ ] Not stacked: nothing here depends on another open pull request; a change that needs another waits for it to merge
- [ ] Tech-debt delta reported — markers added AND removed, never one side alone
- [ ] `Closes #<ISSUE>` resolves to the issue this branch is named after (check the sidebar, not the text)
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
