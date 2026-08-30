#!/usr/bin/env python3
"""Apply the FORBIDDEN_NAMES policy to the ISSUES and PULL REQUESTS (#428).

`ci-check-citability.py` scans the tracked tree, which is the right surface
while the tree is the only public thing. Making the working repository public
changes that: 248 issues and 179 pull requests — titles, bodies, every comment,
every review comment — change state at the same time, and none of them has ever
been read by the policy that decides what may be named.

Not a gate, and deliberately not one:

  * it needs the network and a token with issue read scope, so it cannot be a
    step that fails a build offline;
  * it is a ONE-OFF, run before a visibility change. A gate implies something
    to keep green afterwards; what keeps this green afterwards is not writing
    the name in the first place.

It prints WHERE, never WHAT. The founder runs it with the secret in his own
environment, and the output can be pasted anywhere — a hit reads
`issue #212 · body · 1 match [9 chars]`. `--show` exists for reading it alone
on his own screen, and says so.

    FORBIDDEN_NAMES='<the secret>' python3 scripts/audit-citability-issues.py

Exit codes follow the house convention: 0 clean, 1 hits found, 3 the scan
could not prove it can match anything — which is not the same as clean.
"""
import json
import os
import re
import subprocess
import sys
import time

REPO = os.environ.get("GITHUB_REPOSITORY", "julioarguello/www-serverstartup-io")

# The run is long and sequential, and its output is meant to be WATCHED.
# Redirected to a file, Python block-buffers stdout: measured on the first
# full pass, 105 pull requests went by with the log frozen at the previous
# line, which reads exactly like a hung process.
sys.stdout.reconfigure(line_buffering=True)


def gh(*args: str) -> str:
    """`gh` with its pager off: on a TTY it pipes through `less` and waits.

    Retried, because this walks ~800 calls in sequence and one blip ends the
    lot: measured on the first full pass, a `read: operation timed out` at
    pull request #322 killed twenty-five minutes of scanning. Retried and
    then FAILED, never skipped — a call that quietly returns nothing turns
    into an item nobody scanned, reported as clean.
    """
    env = {**os.environ, "GH_PAGER": "cat"}
    last = ""
    for attempt in range(3):
        proc = subprocess.run(["gh", *args], capture_output=True, text=True, env=env)
        if proc.returncode == 0:
            return proc.stdout
        last = proc.stderr.strip()[:200]
        if attempt < 2:
            print(f"  … retrying ({attempt + 1}/2): {last[:80]}")
            time.sleep(2 * (attempt + 1))
    print(f"audit: gh {' '.join(args[:2])} failed after 3 attempts: {last}",
          file=sys.stderr)
    print("  Nothing was skipped — the scan stops here rather than reporting "
          "an unscanned item as clean. Re-run it.", file=sys.stderr)
    sys.exit(3)


def fetch(kind: str) -> list[dict]:
    """Every issue or PR with its comments, in one paginated GraphQL-free pass."""
    out = gh("api", "--paginate",
             f"repos/{REPO}/{kind}?state=all&per_page=100")
    # --paginate concatenates JSON arrays; parse each and flatten.
    items: list[dict] = []
    decoder = json.JSONDecoder()
    idx = 0
    while idx < len(out):
        while idx < len(out) and out[idx].isspace():
            idx += 1
        if idx >= len(out):
            break
        chunk, end = decoder.raw_decode(out, idx)
        items.extend(chunk)
        idx = end
    return items


def texts(item: dict, comments: list[dict]) -> list[tuple[str, str]]:
    """(field, text) for everything a reader of this item would see."""
    fields = [("title", item.get("title") or ""), ("body", item.get("body") or "")]
    for i, c in enumerate(comments, 1):
        fields.append((f"comment {i}", c.get("body") or ""))
    return [(f, t) for f, t in fields if t.strip()]


def main() -> int:
    pattern = os.environ.get("FORBIDDEN_NAMES", "")
    show = "--show" in sys.argv
    if not pattern:
        print("audit: FORBIDDEN_NAMES is empty. This scan proves NOTHING without "
              "it — it is not a clean result, it is no result.", file=sys.stderr)
        return 3

    try:
        rx = re.compile(pattern)
        rx_i = re.compile(pattern, re.I)
    except re.error as e:
        print(f"audit: FORBIDDEN_NAMES is not a valid regex: {e}", file=sys.stderr)
        return 3

    # ── positive control, same doctrine as the tree scan ──
    # A secret that matches nothing is indistinguishable from a clean corpus.
    # Plant one plain-text alternative in a synthetic string and require a hit.
    UNSAFE = re.compile(r"[\\?*+{}]")
    plain = [a for a in pattern.split("|") if a.strip() and not UNSAFE.search(a)]
    if not plain:
        print("audit: every alternative uses a quantifier or a backslash — none "
              "is safe to plant as a literal control.", file=sys.stderr)
        return 3
    if not rx.search(f"context {plain[0]} context"):
        print("audit: THIS SCAN IS BLIND — the pattern did not match a string "
              "containing one of its own plain-text alternatives.", file=sys.stderr)
        return 3
    print(f"audit: control ok — {len(plain)} plain alternative(s) of "
          f"{len(pattern.split('|'))} can be matched")

    hits = 0
    soft = 0
    for kind, label in (("issues", "issue"), ("pulls", "PR")):
        items = fetch(kind)
        # `repos/…/issues` returns pull requests too; drop them from the issue
        # pass so a PR is never reported twice under two numbers it does not have.
        if kind == "issues":
            items = [i for i in items if "pull_request" not in i]
        print(f"audit: {len(items)} {label}(s)")
        for item in items:
            n = item["number"]
            # `comments` is a COUNT here, and 0 for most items — skipping
            # those is most of this script's runtime. The `pulls` endpoint
            # carries no such field, so `.get` returns None and the call is
            # made: an UNKNOWN count is not a zero one. Reading the missing
            # field as falsy is what made the first draft report all 179
            # pull requests as commentless, silently — the exact shape of
            # blindness this file exists to avoid. A PR's conversation
            # comments live under `issues/{n}`; its line-by-line review
            # comments do not, and are fetched separately below.
            comments = []
            if item.get("comments") is None or item.get("comments"):
                comments = json.loads(gh("api", "--paginate",
                                         f"repos/{REPO}/issues/{n}/comments") or "[]")
            if kind == "pulls":
                comments += json.loads(gh("api", "--paginate",
                                          f"repos/{REPO}/pulls/{n}/comments") or "[]")
            for field, text in texts(item, comments):
                found = rx.findall(text)
                if found:
                    hits += 1
                    where = f"  HIT  {label} #{n} · {field} · {len(found)} match(es)"
                    if show:
                        print(f"{where} → {sorted(set(found))}")
                    else:
                        print(f"{where} [{len(found[0])} chars] {item['html_url']}")
                elif rx_i.search(text) :
                    soft += 1
                    print(f"  warn {label} #{n} · {field} · matches only when "
                          f"case is ignored — the tree scan is case-sensitive, "
                          f"a reader is not. {item['html_url']}")

    print()
    if hits:
        print(f"audit: {hits} location(s) name something the policy forbids. "
              f"Fix them BEFORE the repository changes visibility — editing an "
              f"issue after it is public does not unpublish it.")
        return 1
    print(f"audit: no forbidden name in any issue or pull request"
          + (f" ({soft} case-insensitive near-miss(es) above, judge them by hand)"
             if soft else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
