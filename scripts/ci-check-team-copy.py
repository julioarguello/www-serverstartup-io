#!/usr/bin/env python3
"""ci-check-team-copy — the site describes the team, it never counts it (#575).

Founder decision, 2026-10-07. The copy used to state a headcount in seven
places — the About excerpt, its history, its team section, the signature under
every page, the Deconstruyendo cost table — and every one of them read like a
fact and aged like a price. A number caps the capacity a reader imagines, and
it turns false the day anyone joins or leaves. What the site sells is WHO does
the work and HOW (the same senior engineers, start to finish; no handoffs), and
that reads the same without a figure.

The count crept back in through ordinary edits once already: a signature widget
copied onto every page carried it to thirty routes at once. So this reads the
rendered pages, where a number arrives from any source — seed, template,
fallback string, meta description — and fails on a COUNT OF PEOPLE:

  · a numeral before a noun for people     «tres ingenieros», «three senior engineers»
  · a team sized by a numeral              «un equipo de cuatro», «a team of five»
  · «somos N» / «we are N»
  · a numeral standing for the people     «los mismos tres,», «the three of us»
  · a multiplier against the engineers     «los ingenieros ×3» (a table cell)

It does NOT forbid numbers near the word "team": the mantra is literally
«1 equipo = ▪▪▪▪▪▪ verticales = 0 traspasos», and that is the one team the
client gets, not a headcount. The negative half of the control pins that down.

Read: visible text, plus the attributes a reader or a crawler is shown
(`content`, `alt`, `title`, `aria-label`) — an excerpt reaches the meta
description and the JSON-LD as well as the hero — and the JSON-LD itself.

Usage:  scripts/ci-check-team-copy.py [BASE_URL]   (default http://localhost:8787)
Exit:   0 clean · 1 findings · 2 stack unreachable · 3 THIS GATE IS BLIND
"""

# `str | None` in an evaluated annotation is 3.10+, and the interpreter that
# runs the local gate set is 3.9 — the same line opens every other ci-check.
from __future__ import annotations

import html
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8787").rstrip("/")
LOC_RE = re.compile(r"<loc>([^<]+)</loc>")

# Two and up. "Un/una/one" are left out on purpose: «te responde una persona»
# or «one engineer answers» is how a person is introduced, not a headcount.
NUMERAL = (
    r"(?:\d+|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez"
    r"|two|three|four|five|six|seven|eight|nine|ten)"
)
PEOPLE = (
    r"(?:ingenier[oa]s|engineers|personas|people|profesionales|professionals"
    r"|socios|desarrollador(?:es|as)|developers|expert[oa]s|experts)"
)
COUNT_PATTERNS = [
    # «tres ingenieros», «three senior engineers», «2 personas»
    re.compile(rf"\b{NUMERAL}\s+(?:senior\s+)?{PEOPLE}\b", re.I),
    # «un equipo de cuatro», «a team of five», «a five-person team»
    re.compile(rf"\b(?:equipo|team)\s+(?:de|of)\s+{NUMERAL}\b", re.I),
    re.compile(rf"\b{NUMERAL}[- ](?:person|people|engineer)\s+team\b", re.I),
    # «somos tres», «we are three», «we're three»
    re.compile(rf"\b(?:somos|we\s+are|we['’]re)\s+{NUMERAL}\b", re.I),
    # the numeral standing for the people itself: «los mismos tres, de principio
    # a fin», «the three of us», «tres de nosotros». Only where it ENDS the
    # phrase or takes «of us»: «las mismas cinco direcciones» is a count of
    # something else and passes.
    re.compile(rf"\b(?:los\s+mismos|las\s+mismas|the\s+same)\s+{NUMERAL}(?=\s*[,.;:!?)]|\s*$)", re.I),
    re.compile(rf"\b(?:the\s+{NUMERAL}\s+of\s+us|{NUMERAL}\s+de\s+nosotros)\b", re.I),
    # a table cell multiplying the engineers: «los ingenieros ×3»
    re.compile(rf"\b{PEOPLE}\W{{0,20}}[×x]\s*\d+", re.I),
]

SCRIPT_STYLE_RE = re.compile(
    r"<(script|style)\b(?P<attrs>[^>]*)>(?P<body>.*?)</\1>", re.I | re.S
)
ATTR_RE = re.compile(r"\b(?:content|alt|title|aria-label)\s*=\s*\"([^\"]*)\"", re.I)
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def readable_text(markup: str) -> str:
    """What a reader or a crawler is shown, as one line of plain text.

    Scripts and styles are dropped except JSON-LD, which a crawler reads as
    copy. Attributes are pulled BEFORE the tags are stripped, or the meta
    description — where an excerpt lands verbatim — would vanish with them.
    Tags become spaces, not nothing, so a table row reads «los ingenieros ×3»
    rather than «los ingenieros×3» glued across two cells. Attribute values
    are joined by a mark that is not whitespace: joined by a space, the
    viewport's «initial-scale=1» and the next meta's «Ingenieros senior…»
    read as «1 Ingenieros» — measured on the first run.
    """
    ld: list[str] = []

    def keep_ld(m: re.Match[str]) -> str:
        if "ld+json" in m.group("attrs").lower():
            ld.append(m.group("body"))
        return " "

    body = SCRIPT_STYLE_RE.sub(keep_ld, markup)
    attrs = ATTR_RE.findall(body)
    text = TAG_RE.sub(" ", body)
    return SPACE_RE.sub(" ", html.unescape(" ¦ ".join([text, *attrs, *ld]))).strip()


def counts(text: str) -> list[str]:
    """Every count of people in `text`, with a little context each side."""
    found: list[str] = []
    for pattern in COUNT_PATTERNS:
        for m in pattern.finditer(text):
            start, end = max(0, m.start() - 40), min(len(text), m.end() + 40)
            found.append(f"«{m.group(0)}» in …{text[start:end]}…")
    return found


def fetch(path: str) -> tuple[int, str]:
    try:
        with urllib.request.urlopen(BASE + path, timeout=15) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # connection refused etc. — the sweep itself is broken
        print(f"FATAL: cannot fetch {BASE}{path}: {e}", file=sys.stderr)
        sys.exit(2)


# ── control ─────────────────────────────────────────────────────────────────

# Every shape the copy actually used, planted in the markup that carried it:
# the excerpt in a meta description, the signature in a paragraph, the cost
# table across two cells, the EN heading line. And, in the same page, every
# number that MUST pass — the mantra, the verticals, the years, the build time,
# the other row of the same table — so a pattern widened too far goes red here
# before it goes red on the mantra in CI.
CONTROL_HTML = """<!doctype html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:description" content="Ingenieros senior, los mismos de principio a fin.">
<meta name="description" content="Tres ingenieros senior sostienen la casa, los mismos de principio a fin.">
<script type="application/ld+json">{"description": "We are three, from Getxo."}</script>
<script>const decoy = "four engineers in a script is not copy";</script>
</head>
<p>Backend, integration, data and edge. The same three senior engineers from start to finish.</p>
<p>Un equipo de cuatro, sin traspasos.</p><p>A team of five.</p><p>Somos dos.</p><p>We’re six.</p>
<p>Los mismos tres, de principio a fin. The three of us answer. Las mismas cinco direcciones.</p>
<table><tr><td>los ingenieros</td><td>×3</td><td>no incluidos: ya estaban</td></tr>
<tr><td>los datos</td><td>×3</td><td>D1, R2 y KV</td></tr></table>
<p>1 equipo = ▪▪▪▪▪▪ verticales = 0 traspasos. One team. Six verticals. Zero handoffs.</p>
<p>Seis verticales. Más de veinte años de oficio. Tiempo de montaje: tres semanas a ratos.</p>
<p>Trabajamos junto a tu equipo. Te responde una persona. One engineer answers.</p>
<img src="/a.jpg" alt="dos personas en la foto">
"""

CONTROL_HITS = {
    "Tres ingenieros",
    "We are three",
    "three senior engineers",
    "equipo de cuatro",
    "team of five",
    "Somos dos",
    "We’re six",
    "Los mismos tres",
    "The three of us",
    "ingenieros ×3",
    "dos personas",
}


def control() -> int:
    """Prove the reader sees what it exists to see, and only that. 0 or 3."""
    found = [f.split("»", 1)[0].lstrip("«") for f in counts(readable_text(CONTROL_HTML))]
    blind: list[str] = []
    for hit in sorted(CONTROL_HITS - set(found)):
        blind.append(f"planted count «{hit}» was NOT reported")
    for hit in sorted(set(found) - CONTROL_HITS):
        blind.append(f"«{hit}» is allowed copy and WAS reported")
    if any("four engineers" in f for f in found):
        blind.append("a non-JSON-LD <script> was read as copy")
    if blind:
        print("✗ team-copy: THIS GATE IS BLIND — the control no longer comes out as "
              "planted, so a green run proves nothing:", file=sys.stderr)
        for b in blind:
            print(f"    {b}", file=sys.stderr)
        print("  → the text extraction or a pattern changed; fix it before trusting "
              "any result.", file=sys.stderr)
        return 3
    return 0


# ── routes ──────────────────────────────────────────────────────────────────


def routes_from_sitemap() -> list[str]:
    """Every path the site declares. EmDash injects a competing /sitemap.xml —
    ours is the <urlset>, theirs the <sitemapindex> — so assert the outcome
    rather than trust the route precedence, as scripts/ci-check-image-hrefs.py does."""
    status, xml = fetch("/sitemap.xml")
    if status != 200:
        print(f"FATAL: /sitemap.xml returned {status}", file=sys.stderr)
        sys.exit(2)
    if "<sitemapindex" in xml:
        print("✗ team-copy: THIS GATE IS BLIND — /sitemap.xml is serving EmDash's "
              "generic index, not the site's own, so there is no route list to walk.",
              file=sys.stderr)
        sys.exit(3)
    paths = {urlsplit(loc).path or "/" for loc in LOC_RE.findall(xml)}
    if not paths:
        print("✗ team-copy: THIS GATE IS BLIND — /sitemap.xml declares no <loc> at all.",
              file=sys.stderr)
        sys.exit(3)
    return sorted(paths)


def main() -> int:
    blind = control()
    if blind:
        return blind
    print(f"  ok   control — {len(CONTROL_HITS)} planted counts caught, the mantra, "
          "the verticals, the years and the other table row left alone")

    routes = routes_from_sitemap()
    print(f"team-copy: {BASE} — {len(routes)} routes from the sitemap")

    failures: list[str] = []
    read = 0
    for path in routes:
        status, markup = fetch(path)
        if status != 200:
            failures.append(f"{path}: returned {status}")
            continue
        text = readable_text(markup)
        read += len(text)
        failures.extend(f"{path}: {f}" for f in counts(text))

    if read == 0:
        print(f"✗ team-copy: THIS GATE IS BLIND — {len(routes)} routes and not one "
              "character of text read from any of them.", file=sys.stderr)
        return 3

    if failures:
        print(f"\n{len(failures)} COUNT(S) OF PEOPLE:", file=sys.stderr)
        for f in failures:
            print(f"  ✗ {f}", file=sys.stderr)
        print("  → the site describes the team, it never counts it (#575). Say who "
              "does the work and how — «los mismos ingenieros senior, de principio "
              "a fin» — not how many.", file=sys.stderr)
        return 1

    print(f"✓ team-copy: clean — no count of people across {len(routes)} routes "
          f"({read:,} characters read)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
