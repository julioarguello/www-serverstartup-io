#!/usr/bin/env python3
"""Turn live CMS entries into a content patch (seed/patches/).

Why: copy with links, emphasis or headings is authored as markdown in
seed/content/<collection>/<locale>/*.md and loaded into a local CMS, which
converts it to Portable Text server-side, link markDefs included. Hand-forging
those markDefs in JSON is how two locale mix-ups reached the tree in one week
(#305). This script closes the loop: it reads the converted entries from the
local D1 database and writes every field that differs from the seed as one
change of a dated patch.

The seed is frozen since #697: seed/base.json never changes, and a text change
reaches every environment as a patch — production through
`content-patch.mjs apply`, a new environment through `compose`. So this script
writes a patch, never the seed. Each change's `before` is the value in
seed/seed.json, the composed seed the local CMS was seeded from.

Any collection, not just services (#305). The fields compared are the ones the
seed entry ALREADY declares, intersected with the table's real columns — no
hardcoded field list to drift.

Usage: run AFTER load-content.sh has pushed the latest markdown (see
seed/content/README.md for the whole loop and the server it needs):
    python3 scripts/seed-sync-services.py --name <slug> [--issue N] [collection ...]
The patch is seed/patches/<today>-<slug>.json; the issue defaults to the one in
the branch name (<type>/<issue>-<summary>). Default collection: services.

Requires: a local D1 seeded from seed/seed.json (dev server may be running;
reads are safe).
"""
import argparse
import datetime
import json
import pathlib
import re
import subprocess
import sys

SEED = "seed/seed.json"
PATCHES = pathlib.Path("seed/patches")


def find_d1() -> str:
    out = subprocess.run(
        ["find", ".wrangler", "-name", "*.sqlite", "-path", "*/d1/*",
         "-not", "-name", "metadata.sqlite"],
        capture_output=True, text=True,
    ).stdout.strip().split("\n")
    if not out or not out[0]:
        sys.exit("No local D1 database found — run `npm run dev` first.")
    return out[0]


def fetch(db: str, collection: str) -> tuple[dict, set]:
    import sqlite3  # stdlib — the system sqlite3 CLI (3.28) predates -json
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    table = f"ec_{collection}"
    try:
        cols = {r["name"] for r in con.execute(f"PRAGMA table_info({table});")}
    except sqlite3.Error as exc:
        sys.exit(f"{table}: {exc}")
    if not cols:
        sys.exit(f"{table} does not exist — is the database seeded?")
    rows = con.execute(
        f"SELECT * FROM {table} WHERE deleted_at IS NULL;"
    ).fetchall()
    con.close()
    return {(r["slug"], r["locale"] or "es"): dict(r) for r in rows}, cols


def changes(collection: str, db: str) -> tuple[list, list]:
    """Every CMS-backed field of the collection that differs from the seed, as patch changes."""
    live, cols = fetch(db, collection)
    if not live:
        sys.exit(f"ec_{collection} returned no rows — is the database seeded?")

    seed = json.load(open(SEED))
    if collection not in seed["content"]:
        sys.exit(f"the seed has no content.{collection}")
    out, missing = [], []

    for entry in seed["content"][collection]:
        locale = entry.get("locale") or "es"
        row = live.get((entry["slug"], locale))
        if not row:
            missing.append(entry["id"])
            continue
        # The seed entry declares which fields this collection carries; the
        # table says which of them the CMS actually stores.
        for field, before in entry["data"].items():
            if field not in cols:
                continue  # not CMS-backed
            value = row[field]
            if field == "content":
                after = json.loads(value) if value else []
            elif value is None:
                continue  # an absent optional field is neither "None" nor invented
            else:
                after = value
            if after != before:
                out.append({"collection": collection, "slug": entry["slug"], "locale": locale,
                            "path": [field], "before": before, "after": after})
    return out, missing


def branch_issue() -> int | None:
    branch = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True).stdout.strip()
    m = re.match(r"^[a-z]+/(\d+)-", branch)
    return int(m.group(1)) if m else None


def main() -> None:
    ap = argparse.ArgumentParser(description="Write the CMS's converted copy as a content patch.")
    ap.add_argument("--name", required=True, help="patch slug: seed/patches/<today>-<name>.json")
    ap.add_argument("--issue", type=int, default=None, help="issue number (default: from the branch name)")
    ap.add_argument("collections", nargs="*", default=["services"])
    args = ap.parse_args()
    if not re.fullmatch(r"[a-z0-9-]+", args.name):
        sys.exit("--name must be lowercase letters, digits and hyphens")
    issue = args.issue or branch_issue()
    if issue is None:
        sys.exit("no issue: pass --issue N, or work on a <type>/<issue>-<summary> branch")
    if not pathlib.Path(SEED).exists():
        sys.exit(f"{SEED} is missing — run: node scripts/content-patch.mjs compose")

    db = find_d1()
    all_changes = []
    for collection in args.collections:
        found, missing = changes(collection, db)
        print(f"{collection}: {len(found)} field(s) differ from the seed")
        if missing:
            print(f"{collection}: NOT in CMS (left out): {', '.join(missing)}")
        all_changes += found
    if not all_changes:
        print("nothing differs from the seed — no patch written")
        return

    today = datetime.date.today().isoformat()
    target = PATCHES / f"{today}-{args.name}.json"
    if target.exists():
        sys.exit(f"{target} already exists — choose another --name")
    patch = {"date": today, "issue": issue,
             "summary": f"Copy synced from seed/content/ through the CMS: {', '.join(args.collections)}.",
             "changes": all_changes}
    target.write_text(json.dumps(patch, ensure_ascii=False, indent="\t") + "\n")
    print(f"wrote {target} — check it with: node scripts/content-patch.mjs check")


if __name__ == "__main__":
    main()
