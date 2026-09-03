#!/usr/bin/env python3
"""ci-check-locale-parity.py — field parity across a content entry's locales (#489).

`ci-check-cms-text.py` enforces **key parity for `ui_labels_*`**: a label the
templates ask for must exist in both locale widget areas. That is parity of the
UI chrome. It says nothing about the content entries themselves.

So this happened (#468 → #489): a `url` field was added to the `partners`
collection, filled on the Spanish entry, and left absent on the English one.
Every gate in the repository stayed green. The ES page linked the partner and
the EN page rendered an em dash, for as long as nobody looked.

What this checks
----------------
For every pair of entries that are the same content in two locales, the set of
fields **carrying a value** must be the same. Not the values — those are
supposed to differ, that is what a translation is — the set of fields that have
one. A field filled in one locale and empty or absent in the other is either a
gap or a decision, and a decision should be written down rather than left
looking like a gap.

What it deliberately does NOT check
-----------------------------------
An entry that exists only in Spanish is not a finding. `references/` is ES-only
by design, and half of `services` and `pages` are too. Demanding a translation
for everything would be a different policy, and not one anybody has chosen.

How entries are paired, and why that needs a map
------------------------------------------------
Most English entries are `<spanish-id>-en`. Five are not, because their ids
were written from the English slug rather than derived from the Spanish one
(`page-about-en` translates `page-quienes-somos`). Those five are listed in
PAIRS_BY_HAND below.

The map is exhaustive on purpose: an English entry that matches neither rule is
a **finding**, not a skip. That is the difference between a gate and a filter —
if an unpairable entry were silently ignored, the way to defeat this check
would be to name a file badly, and nobody would ever see it happen.

Positive control
----------------
Runs first, over data of the gate's own making carrying one planted defect of
each shape. It never reads seed.json, so it cannot pass by accident on a clean
tree the way a scan with a broken matcher would: a checker that stopped
matching would print "clean" over a seed it is no longer reading.

Exit 0 = clean. Exit 1 = findings. Exit 3 = the gate is blind.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "seed" / "seed.json"

DEFAULT_LOCALE = "es"

# English entries whose id is not `<spanish-id>-en`. Adding a translation whose
# id does not follow the suffix rule means adding it here, and the gate fails
# until someone does — which is the point.
PAIRS_BY_HAND = {
    "page-about-en": "page-quienes-somos",
    "page-contact-en": "page-contacto",
    "page-privacy-en": "page-privacidad",
    "page-deconstructing": "page-deconstruyendo",
    "page-references": "page-referencias",
}


def filled(data: dict) -> set[str]:
    """Fields carrying a value. `None`, "", [] and {} all read as absent —
    a NULL and a missing key are the same gap to a reader of the page."""
    return {k for k, v in data.items() if v not in (None, "", [], {})}


def pair_up(entries: list[dict]) -> tuple[list[tuple], list[str]]:
    """Returns (pairs, unpairable-ids). A pair is (base_id, es_entry, other)."""
    by_id = {e["id"]: e for e in entries}
    pairs, orphans = [], []
    for e in entries:
        loc = e.get("locale")
        if loc == DEFAULT_LOCALE:
            continue
        base = PAIRS_BY_HAND.get(e["id"])
        if base is None and e["id"].endswith(f"-{loc}"):
            base = e["id"][: -len(loc) - 1]
        if base is not None and base in by_id:
            pairs.append((base, by_id[base], e))
        else:
            orphans.append(e["id"])
    return pairs, orphans


def check(content: dict) -> list[str]:
    findings: list[str] = []
    for collection, entries in sorted(content.items()):
        if not entries:
            continue
        pairs, orphans = pair_up(entries)
        for orphan in orphans:
            findings.append(
                f"{collection}/{orphan}: no entry in '{DEFAULT_LOCALE}' to compare "
                f"against — id is neither '<base>-<locale>' nor listed in "
                f"PAIRS_BY_HAND, so nothing checks this entry's fields"
            )
        for base, es, other in pairs:
            loc = other.get("locale")
            only_base = sorted(filled(es["data"]) - filled(other["data"]))
            only_other = sorted(filled(other["data"]) - filled(es["data"]))
            for field in only_base:
                findings.append(
                    f"{collection}/{base}: field '{field}' has a value in "
                    f"'{DEFAULT_LOCALE}' and none in '{loc}' ({other['id']})"
                )
            for field in only_other:
                findings.append(
                    f"{collection}/{base}: field '{field}' has a value in "
                    f"'{loc}' ({other['id']}) and none in '{DEFAULT_LOCALE}'"
                )
    return findings


def positive_control() -> None:
    """Two planted defects, on data this function builds itself."""
    planted = {
        "widgets": [
            {"id": "w-one", "locale": "es", "data": {"title": "Uno", "url": "https://x"}},
            {"id": "w-one-en", "locale": "en", "data": {"title": "One", "url": None}},
            {"id": "w-loose-en", "locale": "en", "data": {"title": "Loose"}},
        ]
    }
    found = check(planted)
    gap = any("field 'url'" in f for f in found)
    orphan = any("w-loose-en" in f for f in found)
    if not (gap and orphan):
        print(
            "locale-parity: POSITIVE CONTROL FAILED — the checker did not find "
            f"a planted defect (field gap: {gap}, unpairable entry: {orphan}).",
            file=sys.stderr,
        )
        print(
            "  Refusing to report on the real seed: a checker that cannot find "
            "a defect it was handed would print 'clean' over anything.",
            file=sys.stderr,
        )
        sys.exit(3)
    # A clean pair must NOT produce a finding, or every run is a false alarm.
    if check({"widgets": [
        {"id": "w-two", "locale": "es", "data": {"title": "Dos"}},
        {"id": "w-two-en", "locale": "en", "data": {"title": "Two"}},
    ]}):
        print("locale-parity: POSITIVE CONTROL FAILED — a clean pair reported a "
              "finding; the check is not usable.", file=sys.stderr)
        sys.exit(3)
    print("locale-parity: positive control ok (a planted field gap and an "
          "unpairable entry are both found, and a clean pair is not)")


def main() -> int:
    positive_control()

    if not SEED.exists():
        print(f"locale-parity: {SEED} not found", file=sys.stderr)
        return 3
    content = json.loads(SEED.read_text(encoding="utf-8")).get("content")
    if not content:
        print("locale-parity: seed.json has no 'content' — nothing to compare, "
              "which is not the same as clean.", file=sys.stderr)
        return 3

    pairs_seen = sum(len(pair_up(e)[0]) for e in content.values() if e)
    if pairs_seen == 0:
        print("locale-parity: no translated pair found in any collection — the "
              "pairing rule no longer matches the seed's ids.", file=sys.stderr)
        return 3

    findings = check(content)
    if findings:
        print(f"locale-parity: {len(findings)} finding(s)", file=sys.stderr)
        for f in findings:
            print(f"  {f}", file=sys.stderr)
        print("\n  Fill the missing field, or — if the absence is deliberate — "
              "give both locales the same value and say so in the PR. A NULL "
              "that means 'on purpose' is indistinguishable from one that means "
              "'forgotten', which is how #489 survived a month.", file=sys.stderr)
        return 1

    print(f"locale-parity: {pairs_seen} translated pair(s), every field filled "
          "in one locale is filled in the other")
    return 0


if __name__ == "__main__":
    sys.exit(main())
