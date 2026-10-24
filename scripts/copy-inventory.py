#!/usr/bin/env python3
"""Generate the site's copy inventory from seed/seed.json (#577, step 1).

One row per string the site renders, with the tier that decides how much review
it gets (#577 §3):

- Tier 1: everything on the home, every h1 (entry titles), excerpts (they are
  the hero's lead, the face cards and, stripped of marks, the meta description
  and JSON-LD), and every call to action.
- Tier 2: page and service bodies, the team's captions and the
  /deconstruyendo layers.
- Tier 3: the rest. That means UI labels, menus, settings labels and the
  references.

Generated on demand, never tracked: the seed is the source and this is a view
of it. Each row carries a short hash of its text. The Tier 1 scores in
docs/copy/tier1-scores.tsv are keyed by that hash, so a score whose hash is no
longer in the inventory is a score of copy that has since changed.

Usage: scripts/copy-inventory.py [--tier N] [seed.json]
       scripts/copy-inventory.py --unscored docs/copy/tier1-scores.tsv
         lists the Tier 1 strings without a current score (exit 1 if any)
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The home renders these ui_labels widgets (HomepageContent.astro); every other
# ui_labels widget is a label somewhere else.
HOME_WIDGETS = {"hero_line", "how_we_work", "mantra", "menu_short"}

COMPONENT = {
    ("pages", "title"): "page h1 + <title>",
    ("services", "title"): "service h1 + <title> + menu + home card name",
    ("partners", "title"): "partner block heading",
    ("pages", "excerpt"): "page lead + meta description",
    ("services", "excerpt"): "service hero lead + face card + meta description + JSON-LD",
    ("partners", "excerpt"): "partner block lead",
    ("services", "cta_label"): "service hero CTA",
    ("partners", "cta_label"): "partner block CTA",
    ("members", "title"): "team card name",
    ("members", "excerpt"): "team card caption",
}


def pt_text(block: dict) -> str:
    """The text a Portable Text block renders, every span joined (never children[0])."""
    return "".join(c.get("text", "") for c in block.get("children", []) if isinstance(c, dict)).strip()


def short_hash(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]


def rows(seed: dict):
    content = seed.get("content", {})

    # entries: titles, excerpts, CTA labels, bodies
    for coll in ("pages", "services", "partners", "members", "references"):
        for e in content.get(coll, []):
            slug, loc, data = e.get("slug", ""), e.get("locale", ""), e.get("data") or {}
            is_home = coll == "pages" and slug == "home"
            for field in ("title", "excerpt", "cta_label"):
                text = data.get(field)
                if not isinstance(text, str) or not text.strip():
                    continue
                if coll == "references":
                    tier = 3
                elif coll == "members":
                    tier = 2
                else:
                    tier = 1
                yield tier, coll, slug, field, "", loc, COMPONENT.get((coll, field), coll), text.strip()
            body = data.get("content")
            if isinstance(body, list):
                for i, b in enumerate(body):
                    if not isinstance(b, dict) or b.get("_type") != "block":
                        continue
                    text = pt_text(b)
                    if not text:
                        continue
                    key = b.get("_key") or f"#{i}"
                    if is_home:
                        # read by position: the first two blocks are the kicker (#580)
                        tier, comp = (1, "home kicker") if i < 2 else (1, "home body")
                    else:
                        tier, comp = 2, f"{coll} body ({b.get('style', 'normal')})"
                    yield tier, coll, slug, "content", key, loc, comp, text

    # /deconstruyendo layers: every string field is page copy
    for e in content.get("layers", []):
        slug, loc, data = e.get("slug", ""), e.get("locale", ""), e.get("data") or {}
        for field, value in data.items():
            if isinstance(value, str) and value.strip() and field not in ("group", "position"):
                yield 2, "layers", slug, field, "", loc, "deconstruyendo layer", value.strip()

    # widgets: the CTA band, the UI labels
    for area in seed.get("widgetAreas", []):
        name = area.get("name", "")
        loc = "en" if name.endswith("_en") else "es" if name.endswith("_es") else ""
        for w in area.get("widgets", []):
            title = w.get("title", "")
            blocks = w.get("content") or []
            if name.startswith("cta_global"):
                yield 1, "widget", name, "heading", "", loc, "closing CTA band heading", title.strip()
                for i, b in enumerate(blocks):
                    text = pt_text(b) if isinstance(b, dict) else ""
                    if text:
                        key = b.get("_key") or f"#{i}"
                        comp = "closing CTA button" if key == "cta-button" else "closing CTA subtitle"
                        yield 1, "widget", name, title, key, loc, comp, text
            elif name.startswith("ui_labels"):
                tier = 1 if title in HOME_WIDGETS else 3
                comp = f"home: {title}" if tier == 1 else f"label: {title}"
                for i, b in enumerate(blocks):
                    text = pt_text(b) if isinstance(b, dict) else ""
                    if text:
                        yield tier, "widget", name, title, b.get("_key") or f"#{i}", loc, comp, text

    # menus and settings labels
    for m in seed.get("menus", []):
        for it in m.get("items", []):
            if it.get("label"):
                yield 3, "menu", m.get("name", ""), "label", it.get("url", ""), m.get("locale", ""), "menu row", it["label"].strip()
    settings = seed.get("settings", {})
    for k, v in settings.items():
        if not isinstance(v, str) or not v.strip():
            continue
        if k in ("phone", "phoneEncoded", "whatsapp", "whatsappEncoded", "email", "emailEn", "repoUrl"):
            continue  # contact data and URLs are not copy
        tier = 1 if k == "defaultCtaLabel" else 3
        yield tier, "settings", "", k, "", "", "site setting", v.strip()


def main(argv: list[str]) -> int:
    tier_filter = None
    unscored = None
    args = list(argv)
    if "--unscored" in args:
        i = args.index("--unscored")
        unscored = Path(args[i + 1])
        del args[i : i + 2]
        tier_filter = 1
    if "--tier" in args:
        i = args.index("--tier")
        tier_filter = int(args[i + 1])
        del args[i : i + 2]
    seed_path = Path(args[0]) if args else ROOT / "seed" / "seed.json"
    seed = json.loads(seed_path.read_text(encoding="utf-8"))

    out = sorted(rows(seed), key=lambda r: (r[0], r[1], r[2], r[5], r[3], r[4]))
    if not out:
        # a blind run: an inventory of nothing is a broken selector, not a clean site
        print("copy-inventory: no strings found — the seed's shape changed under this script", file=sys.stderr)
        return 3
    scored: set[str] = set()
    if unscored is not None:
        lines = unscored.read_text(encoding="utf-8").splitlines()
        scored = {l.split("\t")[0] for l in lines[1:] if l.strip() and not l.startswith("#")}
    missing = 0
    print("tier\tsource\tentry\tslot\tkey\tlocale\tchars\tcomponent\thash\ttext")
    for tier, src, entry, slot, key, loc, comp, text in out:
        if tier_filter is not None and tier != tier_filter:
            continue
        flat = " ".join(text.split())
        h = short_hash(flat)
        if unscored is not None and h in scored:
            continue
        missing += 1
        print(f"{tier}\t{src}\t{entry}\t{slot}\t{key}\t{loc}\t{len(flat)}\t{comp}\t{h}\t{flat}")
    return 1 if unscored is not None and missing else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
