#!/usr/bin/env python3
"""ci-check-cited-files.py — every file the site cites must exist (#535).

/deconstruyendo states how the site is built, and every fact names the file in
this repository that proves it: the `file` of each fact in the `layers`
collection, plus every link into the repository written anywhere in the seed
(a fact's text, a layer's links, the credits page). A reader who follows one
of those links and lands on GitHub's 404 has been shown a claim with nothing
behind it, and nothing else in CI would notice: the copy baseline freezes the
words, not the targets of the links.

So a cited path is checked against what git tracks. Rename `src/middleware.ts`
and this fails, naming the fact that cites it — which is the acceptance of
#535: "a claim whose file is renamed breaks a gate rather than a reader".

What counts as a citation
-------------------------
- `content.layers[*].data.facts[*].file`, a path relative to the repository root
  (a trailing slash means a directory: some tracked file must live under it);
- any URL `<repoUrl>/blob/<ref>/<path>` or `<repoUrl>/tree/<ref>/<path>` in any
  string of seed/seed.json, where `<repoUrl>` is the seed's own `repoUrl`
  setting. The ref is not checked, only the path: the site cites `main`.

Links to `/actions/runs/<id>` and other non-file pages are not files and are
left alone.

Positive control
----------------
Before judging the real seed, the check runs over a seed of its own making that
carries one missing `file` and one dead repository URL. If it does not find
both, the pattern or the tree listing has stopped working and the gate exits 3
instead of printing a green it has not earned.

Exit 0 = every citation resolves. Exit 1 = findings. Exit 3 = the gate is blind.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "seed" / "seed.json"


def tracked() -> tuple[set[str], set[str]]:
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    files = {line for line in out.splitlines() if line}
    dirs: set[str] = set()
    # every ancestor directory, not only the immediate parent
    for f in files:
        p = Path(f).parent
        while str(p) not in (".", ""):
            dirs.add(str(p) + "/")
            p = p.parent
    return files, dirs


def strings(node, path=""):
    """Every string in the seed, with a readable location."""
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(node, dict):
        for k, v in node.items():
            where = f"{path}.{k}" if path else k
            if isinstance(node.get("id"), str) and path.count(".") < 3:
                where = f"{path}<{node['id']}>.{k}"
            yield from strings(v, where)


def check(seed: dict, files: set[str], dirs: set[str]) -> list[str]:
    findings: list[str] = []

    def exists(path: str) -> bool:
        path = path.split("#")[0].split("?")[0]
        return path in files or (path.rstrip("/") + "/") in dirs

    for entry in seed.get("content", {}).get("layers", []):
        for fact in (entry.get("data") or {}).get("facts") or []:
            f = fact.get("file")
            if f and not exists(f):
                findings.append(f"layers/{entry.get('id')} fact {fact.get('key')}: cites '{f}', which git does not track")

    repo = (seed.get("settings") or {}).get("repoUrl", "").rstrip("/")
    if repo:
        url = re.compile(re.escape(repo) + r"/(?:blob|tree)/[^/\s)\"]+/([^\s)\"#?]+)")
        for where, text in strings(seed):
            for m in url.finditer(text):
                if not exists(m.group(1)):
                    findings.append(f"{where}: links to '{m.group(1)}', which git does not track")
    return findings


def control(files: set[str], dirs: set[str]) -> bool:
    repo = "https://github.com/example/control"
    planted = {
        "settings": {"repoUrl": repo},
        "content": {"layers": [{"id": "layer-control", "data": {"facts": [
            {"key": "c1", "text": "x", "file": "src/__the_control_file_that_is_not_there__.ts"},
            {"key": "c2", "text": f"see [it]({repo}/blob/main/docs/__nor_this_one__.md)"},
            {"key": "c3", "text": "fine", "file": "seed/seed.json"},
        ]}}]},
    }
    found = check(planted, files, dirs)
    return len(found) == 2 and all("__" in f for f in found)


def main() -> int:
    files, dirs = tracked()
    if not files:
        print("cited-files: git lists no files — run from a checkout", file=sys.stderr)
        return 3
    if not control(files, dirs):
        print("cited-files: BLIND — the planted missing file and dead link were not both found", file=sys.stderr)
        return 3
    seed = json.loads(SEED.read_text())
    findings = check(seed, files, dirs)
    if findings:
        for f in findings:
            print(f"seed/seed.json: {f}")
        print(f"cited-files: {len(findings)} citation(s) point at nothing")
        return 1
    n_facts = sum(1 for e in seed.get("content", {}).get("layers", []) for f in (e.get("data") or {}).get("facts") or [] if f.get("file"))
    print(f"cited-files: every cited file exists ({n_facts} facts cite a file, plus every repository link in the seed) — the 2 planted dead citations were found first")
    return 0


if __name__ == "__main__":
    sys.exit(main())
