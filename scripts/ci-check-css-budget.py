#!/usr/bin/env python3
"""The CSS source budget, and the doc that states it.

#475 found two defects, not one. The budget in `docs/design-system.md` was
2.6x over — and the *current* figure printed beside it was four times out of
date, which is why nobody noticed. A budget nobody re-measures is furniture,
and a budget whose stated "current" is a fossil is worse: it reports health.

So this gate makes two assertions, and each carries its own plant:

  B1  the total of src/styles/*.css is at or under the declared budget.
  B2  the figure the doc prints as *measured* is within DRIFT_KB of the real
      one. Not exact — every CSS edit moves it by a few hundred bytes, and a
      gate that goes red on ordinary work gets re-baselined on sight, which is
      how the first version of this number died. Far enough out to catch a
      fossil, loose enough to survive a day's work.

Both numbers live in the doc, in one line this file parses, so the doc is the
single source and cannot disagree with the check that enforces it.

Exit 0 clean, 1 on a finding, 3 when the gate cannot see (the line is gone,
renamed, or no stylesheet matched).
"""

import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLES = os.path.join(ROOT, "src", "styles", "*.css")
DOC = os.path.join(ROOT, "docs", "design-system.md")

# How far the doc's stated measurement may sit from the real one.
DRIFT_KB = 5

# The one line the doc and this gate share. Both numbers, one place.
# \s+ rather than a literal space: the doc wraps this sentence across two lines,
# and a gate that a reflow can blind is a gate that will be blinded by a reflow.
LINE = re.compile(
    r"Total\s+source\s+budget\s+\*\*<=\s*(\d+)\s+KB\*\*;\s+measured\s+"
    r"\*\*(\d+)\s+KB\s+across\s+(\d+)\s+files\*\*"
)


def measure(paths):
    """Bytes and file count for a list of paths. Pure, so a plant can feed it."""
    return sum(os.path.getsize(p) for p in paths), len(paths)


def judge(budget_kb, stated_kb, real_kb, stated_files, real_files):
    """The two assertions. Pure, so a plant can feed it numbers it made up."""
    out = []
    if real_kb > budget_kb:
        out.append(
            ("B1", f"{real_kb} KB of stylesheet source against a {budget_kb} KB budget "
                   f"— {real_kb - budget_kb} KB over")
        )
    if abs(stated_kb - real_kb) > DRIFT_KB:
        out.append(
            ("B2", f"the doc says it measured {stated_kb} KB, the tree is {real_kb} KB "
                   f"— {abs(stated_kb - real_kb)} KB apart, past the {DRIFT_KB} KB this gate allows")
        )
    if stated_files != real_files:
        out.append(
            ("B2", f"the doc says {stated_files} files, there are {real_files}")
        )
    return out


def plants():
    """Positive control. Neither plant reads the doc or the tree — each builds
    its own numbers, so a plant cannot pass because the thing it checks is
    broken in its favour."""
    problems = []

    # B1: a tree well over its budget. B2 must stay quiet — the stated figure
    # is truthful, which is exactly the case where only the budget is wrong.
    found = judge(budget_kb=50, stated_kb=130, real_kb=130, stated_files=12, real_files=12)
    if not any(g == "B1" for g, _ in found):
        problems.append("B1 did not fire on a tree 80 KB over its budget")
    if any(g == "B2" for g, _ in found):
        problems.append("false positive — B2 fired on a stated figure that was correct")

    # B2: the #475 fossil itself — a doc claiming 31 KB over a 130 KB tree,
    # under a budget the tree meets. B1 must stay quiet.
    found = judge(budget_kb=150, stated_kb=31, real_kb=130, stated_files=10, real_files=12)
    if not any(g == "B2" for g, _ in found):
        problems.append("B2 did not fire on a doc four times out of date")
    if any(g == "B1" for g, _ in found):
        problems.append("false positive — B1 fired on a tree inside its budget")

    # And the state that must produce nothing at all.
    found = judge(budget_kb=150, stated_kb=129, real_kb=130, stated_files=12, real_files=12)
    if found:
        problems.append(f"false positive — a compliant tree reported {[g for g, _ in found]}")

    return problems


def main():
    problems = plants()
    if problems:
        print("✗ the budget control failed: the check is not judging what it claims.", file=sys.stderr)
        for p in problems:
            print(f"    {p}", file=sys.stderr)
        return 3
    print("budget control: a tree over budget, a doc out of date, and a compliant tree judged correctly")

    paths = sorted(glob.glob(STYLES))
    if not paths:
        print(f"✗ blind: {STYLES} matched no stylesheet.", file=sys.stderr)
        print("  If the styles moved, move this gate in the same commit.", file=sys.stderr)
        return 3

    try:
        doc = open(DOC, encoding="utf-8").read()
    except OSError as e:
        print(f"✗ blind: cannot read {DOC} — {e}", file=sys.stderr)
        return 3

    m = LINE.search(doc)
    if not m:
        print("✗ blind: docs/design-system.md no longer states the budget in the form this gate reads.", file=sys.stderr)
        print("  Expected a line matching:", file=sys.stderr)
        print("    Total source budget **<= N KB**; measured **N KB across N files**", file=sys.stderr)
        print("  The doc is the source of both numbers. If the wording changes, change it here", file=sys.stderr)
        print("  in the same commit — a budget the gate cannot find is a budget nobody enforces.", file=sys.stderr)
        return 3

    budget_kb, stated_kb, stated_files = (int(g) for g in m.groups())
    total, files = measure(paths)
    real_kb = round(total / 1024)

    found = judge(budget_kb, stated_kb, real_kb, stated_files, files)
    if found:
        print(f"✗ {len(found)} finding(s) against the CSS source budget:", file=sys.stderr)
        for g, msg in found:
            print(f"    {g}  {msg}", file=sys.stderr)
        print("", file=sys.stderr)
        for p in paths:
            print(f"      {round(os.path.getsize(p) / 1024):>4} KB  {os.path.relpath(p, ROOT)}", file=sys.stderr)
        print("", file=sys.stderr)
        print("  Both numbers live in one line of docs/design-system.md. Raising the budget is a", file=sys.stderr)
        print("  decision with a reason attached (#475); re-measuring is just arithmetic. Do not", file=sys.stderr)
        print("  do the first when the second is what is needed.", file=sys.stderr)
        return 1

    print(f"CSS source budget: {real_kb} KB across {files} files, under {budget_kb} KB, "
          f"and the doc says so to within {DRIFT_KB} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
