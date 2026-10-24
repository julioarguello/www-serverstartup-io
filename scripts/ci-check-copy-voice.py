#!/usr/bin/env python3
"""ci-check-copy-voice — the voice rules a machine can check, held on the approved copy (#644).

#649 rewrote the site's copy and the founder approved it page by page. The
voice guide's anti-AI rules (§3.1 and §8.1: what reads as machine-written
Spanish) were applied by hand, and nothing kept them applied. This gate holds
the five that a pattern can decide without judgement:

  em-dash         no spaced em dash in Spanish copy, «y responde — siempre»
  colon-headline  at most one «X: Y» heading per page
  vocabulary      none of the listed AI words («sinergia», «ecosistema»,
                  «solución»…; in English «seamless», «synergy»…)
  exclamation     no «¡» in either locale
  contrast        at most BUDGET «X, no Y» contrasts per page in Spanish

Each one ships because it reports NOTHING on the approved copy. A check that
would have fired on a sentence the founder signed off was narrowed until it
did not, and what that narrowing gives up is listed below — so a green run is
not read as more than it is.

Read: `seed/seed.json` (or the path in argv[1]), which is where every sentence
the site renders lives. The headings are there as Portable Text styles
(h1–h4) and entry titles; `tests/copy-baseline/*.txt` flattens them into
lines, so a baseline line can never say whether it was a heading. Reading the
seed needs no stack, so this runs in the `static` job.

What a page is: one content entry in one locale — its title, excerpt, body
and CTA label. The `layers` collection is the exception: every layer renders
on /deconstruyendo, so all layers of a locale count as ONE page. A widget
counts as its own page; the home's `how_we_work` and `hero_line` are not
added to the home entry's count.

Deliberately NOT checked, and why:

  · The template's own dashes. The «— Joe Reis» quote credit and the
    «✓ label — description» separator are added by components, not written in
    the seed, so reading the seed leaves them out by construction.
  · Dashes in `ui_labels_*`. Those are interface labels (aria labels, the
    file tab of an instrument, «Bitácora — RSS»), not prose; the CMS text
    gate owns them.
  · An unspaced dash. «los contenidos —textos, imágenes— pertenecen» is the
    Spanish inciso (RAE), and «C/ Los Fueros 11 — 48992 Getxo» is an address;
    the flourish the guide bans is the dash spaced on both sides in the middle
    of a sentence, which is the shape this looks for.
  · «clave», «esencial», «dinámico». The guide lists them, but the approved
    copy uses them as terms of art («pares clave y valor», «registro dinámico
    de clientes»). A pattern cannot tell the two apart; review does.
  · In English, «solutions», «end-to-end» and «empowers»: the approved copy
    uses them as a product category, a property of tracing and a quotation.
  · A contrast in English, and a contrast that is a conditional. «Si un SaaS
    ya lo resuelve, no lo construimos» is not «X, no Y»: the contrast is a
    «no» followed by a preposition, an article or «solo» («no para la media»,
    «no el test», «no solo responde»), never by a verb. «la», «los» and
    «las» are left out because they are also pronouns («…, no la vemos»),
    so «X, no la Y» goes uncounted.
  · CTA length. The guide's checklist says four words or fewer; four approved
    labels are longer («Tell us about your project», «Cómo operamos CDN y
    WAF»…), so the rule and the copy disagree and that is a decision for the
    founder, not a gate.

Exit codes: 0 clean · 1 a finding · 2 nothing to inspect (no seed, or a seed
with no copy in it) · 3 blind — the planted control no longer comes out
exactly as planted, so a green would prove nothing.
"""

# `str | None` in an evaluated annotation is 3.10+, and the interpreter that
# runs the local gate set is 3.9 — the same line opens every other ci-check.
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterator

ROOT = Path(__file__).resolve().parent.parent
SEED = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "seed" / "seed.json"

# The highest «X, no Y» count on any page of the approved copy, measured
# 2026-10-24 on main at 064e5be: one each on e-commerce, greenfield, AI, about,
# accessibility, credits, the layers and the home's how-we-work widget. The
# guide allows two tells per page in total; one contrast is what the approved
# copy spends, so a second one on the same page is new rhetoric.
BUDGET = 1

# Keys whose string values are addresses, identifiers or presentation, never
# copy. Everything else under an entry's `data` is read.
NOT_COPY = {
    "_key", "_type", "style", "listItem", "level", "marks", "markDefs",
    "src", "href", "url", "color", "figure", "group", "key", "fact", "kind",
}
HEADING_STYLES = {"h1", "h2", "h3", "h4"}

# The spaced flourish: whitespace, an em dash, whitespace, and NOT a digit
# after it (an address puts the postcode there).
EM_DASH = re.compile(r"\s—\s(?!\d)")
# A headline colon is followed by a space or ends the heading; «12:30», a URL
# or `a:b` inside code is not one. Code spans are removed before matching.
HEADLINE_COLON = re.compile(r":(?=\s|$)")
CODE_SPAN = re.compile(r"`[^`]*`")
CONTRAST = re.compile(
    r",\s+no\s+(?:en|por|para|a|al|de|del|con|sin|el|un|una|unos|unas|solo|sólo)\b",
    re.I,
)
VOCABULARY = {
    "es": re.compile(
        r"\b(?:crucial(?:es)?|sin\s+fisuras|sinérgic[oa]s?|sinergias?|ecosistemas?"
        r"|soluci(?:ón|ones)|enfoque\s+integral|sin\s+fricción|de\s+punta\s+a\s+punta"
        r"|vibrantes?|potenci(?:ar|amos|an|ando)|maximiz(?:ar|amos|an|ando)"
        r"|en\s+constante\s+evolución|paisaje\s+digital)\b",
        re.I,
    ),
    "en": re.compile(
        r"\b(?:crucial|seamless(?:ly)?|synerg(?:y|ies|istic)|ecosystems?|holistic"
        r"|frictionless|maximi[sz](?:e|es|ed|ing)|ever-evolving|digital\s+landscape)\b",
        re.I,
    ),
}

# What each check tells the person who tripped it.
REMEDY = {
    "em-dash": "Spanish copy carries no em dash as a flourish (voice guide §8.1). "
    "Split the sentence, or use a comma or a colon. An inciso —así, sin "
    "espacios dentro— and an address pass.",
    "colon-headline": "at most one «X: Y» heading per page (§8.1). Make the "
    "others a statement, or two sentences.",
    "vocabulary": "AI vocabulary (§8.1). Name the concrete thing — the system, "
    "the flow, the rule — or delete the word.",
    "exclamation": "no «¡» (§3.1). Rewrite it as a calm statement.",
    "contrast": f"more than {BUDGET} «X, no Y» contrast on one page (§8.1, "
    "budget set by the approved copy). State the claim once, in the affirmative.",
}


# ── the inventory ───────────────────────────────────────────────────────────


class Text:
    """One string the site renders, with where it came from."""

    __slots__ = ("page", "locale", "heading", "label", "where", "text")

    def __init__(self, page: str, locale: str, heading: bool, label: bool, where: str, text: str):
        self.page, self.locale, self.heading, self.label = page, locale, heading, label
        self.where, self.text = where, text


def block_text(block: dict[str, Any]) -> str:
    """A Portable Text block as the reader sees it: every span, joined."""
    return "".join(c.get("text", "") for c in block.get("children", []) if isinstance(c, dict))


def walk(value: Any, where: str) -> Iterator[tuple[str, bool, str]]:
    """(where, is_heading, text) for every string of copy under `value`."""
    if isinstance(value, dict):
        if value.get("_type") == "block":
            text = block_text(value)
            # A blockquote opening `b64:` is the canvas closer: names stored
            # encoded on purpose (AGENTS.md, tier 2). It is not prose to read.
            if not text.startswith("b64:"):
                yield where, value.get("style") in HEADING_STYLES, text
            return
        for k, v in value.items():
            if k not in NOT_COPY:
                yield from walk(v, f"{where}.{k}")
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from walk(v, f"{where}[{i}]")
    elif isinstance(value, str) and value.strip():
        yield where, False, value


def inventory(seed: dict[str, Any]) -> list[Text]:
    texts: list[Text] = []
    for collection, entries in (seed.get("content") or {}).items():
        for e in entries or []:
            locale = e.get("locale", "es")
            page = f"layers {locale}" if collection == "layers" else f"{collection}/{e.get('slug')} {locale}"
            data = e.get("data") or {}
            for where, heading, text in walk(data, f"{collection}/{e.get('slug')}"):
                # The entry title is the page's (or the plate's) heading.
                heading = heading or where.endswith(f"/{e.get('slug')}.title")
                texts.append(Text(page, locale, heading, False, where, text))
    for area in seed.get("widgetAreas") or []:
        name = area.get("name", "")
        locale = "en" if name.endswith("_en") else "es"
        labels = name.startswith("ui_labels")
        for w in area.get("widgets") or []:
            title = w.get("title") or ""
            page = f"widget {name}/{title} {locale}"
            # In a ui_labels area the title is a lookup key («menu_short»); in
            # the CTA areas it is the heading the reader sees.
            if title and not labels:
                texts.append(Text(page, locale, True, False, f"{name}/{title}.title", title))
            for where, heading, text in walk(w.get("content"), f"{name}/{title}"):
                texts.append(Text(page, locale, heading, labels, where, text))
    return texts


# ── the checks ──────────────────────────────────────────────────────────────


Finding = tuple[str, str, str, str]  # (check, page, token, context)


def context(text: str, m: re.Match[str]) -> str:
    start, end = max(0, m.start() - 45), min(len(text), m.end() + 45)
    return "…" + text[start:end].replace("\n", " ") + "…"


def check(texts: list[Text]) -> list[Finding]:
    found: list[Finding] = []
    colons: dict[str, list[str]] = defaultdict(list)
    contrasts: dict[str, list[str]] = defaultdict(list)
    for t in texts:
        for m in re.finditer("¡", t.text):
            found.append(("exclamation", t.page, "¡", f"{t.where}: {context(t.text, m)}"))
        vocab = VOCABULARY.get(t.locale)
        if vocab:
            for m in vocab.finditer(t.text):
                found.append(("vocabulary", t.page, m.group(0).lower(), f"{t.where}: {context(t.text, m)}"))
        if t.heading and HEADLINE_COLON.search(CODE_SPAN.sub("", t.text)):
            colons[t.page].append(f"{t.where}: «{t.text}»")
        if t.locale != "es":
            continue
        if not t.label:
            for m in EM_DASH.finditer(t.text):
                found.append(("em-dash", t.page, "—", f"{t.where}: {context(t.text, m)}"))
        for m in CONTRAST.finditer(t.text):
            contrasts[t.page].append(f"{t.where}: {context(t.text, m)}")
    for page, hits in colons.items():
        if len(hits) > 1:
            found.append(("colon-headline", page, str(len(hits)), " · ".join(hits)))
    for page, hits in contrasts.items():
        if len(hits) > BUDGET:
            found.append(("contrast", page, str(len(hits)), " · ".join(hits)))
    return found


# ── control ─────────────────────────────────────────────────────────────────


def _block(text: str, style: str = "normal") -> dict[str, Any]:
    return {"_type": "block", "style": style, "children": [{"_type": "span", "text": text}]}


# Seed-shaped, so the walker is under test too, not just the patterns. One
# planted defect per check, each in the shape the approved copy used to have;
# and, beside them, every shape that MUST pass — so a pattern widened until it
# fires on approved copy goes red here first.
CONTROL_SEED: dict[str, Any] = {
    "content": {
        "services": [
            {"slug": "plant", "locale": "es", "data": {
                "title": "Arquitectura: la base",
                "excerpt": "Diseñamos el flujo y responde — siempre.",
                "cta_label": "Hablemos",
                "content": [
                    _block("Datos: el linaje", "h2"),
                    _block("Vendemos una solución, y la operamos."),
                    _block("Se dimensiona para el pico, no para la media; la seguridad entra en el diseño, no en el parche."),
                    _block("¡Hablemos!"),
                ],
            }},
            {"slug": "plant", "locale": "en", "data": {
                "title": "Architecture: the base",
                "excerpt": "We fix the code — not the test.",
                "content": [
                    _block("Data: the lineage", "h2"),
                    _block("A seamless flow."),
                    _block("Partially, not fully: a floor, not conformance."),
                ],
            }},
            {"slug": "passes", "locale": "es", "data": {
                "title": "El CMS: `EmDash`",
                "excerpt": "Cuando un test falla, arreglamos el código, no el test.",
                "content": [
                    _block("A las 12:30, en https://example.com/a:b y `host:puerto`", "h3"),
                    _block("Si un SaaS ya lo resuelve, no lo construimos. Si un dato no pasa, no llega. Si falla, no la vemos."),
                    _block("Domicilio: C/ Los Fueros 11 — 48992 Getxo (Bizkaia)."),
                    _block("Los contenidos —textos, imágenes y código— pertenecen a su titular."),
                    _block("Un almacén de pares clave y valor, con registro dinámico de clientes."),
                    _block("Es esencial que la promoción llegue al TPV."),
                ],
            }},
        ],
        "layers": [
            {"slug": "uno", "locale": "es", "data": {"title": "La red: `Cloudflare`", "intro": "Plano uno."}},
            {"slug": "dos", "locale": "es", "data": {"title": "El CMS: `EmDash`", "intro": "Plano dos."}},
        ],
    },
    "widgetAreas": [
        {"name": "ui_labels_es", "widgets": [
            {"title": "aria_labels", "content": [_block("Server Startup — Ir al inicio"), _block("Bitácora — RSS")]},
        ]},
        {"name": "cta_global_es", "widgets": [
            {"title": "Hablemos de ingeniero a ingeniero.", "content": [_block("Cuéntanos tu proyecto")]},
        ]},
    ],
}

CONTROL_EXPECTED = Counter({
    ("em-dash", "services/plant es", "—"): 1,
    ("colon-headline", "services/plant es", "2"): 1,
    ("colon-headline", "layers es", "2"): 1,
    ("colon-headline", "services/plant en", "2"): 1,
    ("vocabulary", "services/plant es", "solución"): 1,
    ("vocabulary", "services/plant en", "seamless"): 1,
    ("exclamation", "services/plant es", "¡"): 1,
    ("contrast", "services/plant es", "2"): 1,
})


def control() -> int:
    """Prove each check sees its planted defect, and only that. 0 or 3."""
    got = Counter((c, p, tok) for c, p, tok, _ in check(inventory(CONTROL_SEED)))
    blind = [f"planted {c} on «{p}» ({tok}) was NOT reported"
             for (c, p, tok) in sorted(CONTROL_EXPECTED - got)]
    blind += [f"{c} on «{p}» ({tok}) is allowed copy and WAS reported"
              for (c, p, tok) in sorted(got - CONTROL_EXPECTED)]
    dead = set(REMEDY) - {c for c, _, _ in CONTROL_EXPECTED}
    blind += [f"check «{c}» has no planted defect" for c in sorted(dead)]
    if blind:
        print("✗ copy-voice: THIS GATE IS BLIND — the control no longer comes out as "
              "planted, so a green run proves nothing:", file=sys.stderr)
        for b in blind:
            print(f"    {b}", file=sys.stderr)
        print("  → the seed walker or a pattern changed; fix it before trusting any "
              "result.", file=sys.stderr)
        return 3
    return 0


# ── main ────────────────────────────────────────────────────────────────────


def main() -> int:
    blind = control()
    if blind:
        return blind
    print(f"  ok   control — {sum(CONTROL_EXPECTED.values())} planted defects caught "
          f"across {len(REMEDY)} checks; the address, the inciso, the labels, the "
          "conditionals and the terms of art left alone", flush=True)

    try:
        seed = json.loads(SEED.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"✗ copy-voice: nothing to inspect — cannot read {SEED}: {e}", file=sys.stderr)
        return 2

    texts = inventory(seed)
    es = [t for t in texts if t.locale == "es"]
    en = [t for t in texts if t.locale == "en"]
    es_headings = [t for t in es if t.heading]
    en_headings = [t for t in en if t.heading]
    pages = {t.page for t in texts}
    if not es or not en or not es_headings or not en_headings:
        print(f"✗ copy-voice: nothing to inspect — {SEED} yields {len(es)} Spanish "
              f"strings, {len(en)} English, {len(es_headings)} + {len(en_headings)} "
              "headings. The seed moved its copy somewhere this walker does not look.",
              file=sys.stderr)
        return 2

    findings = check(texts)
    if findings:
        print(f"\n{len(findings)} VOICE FINDING(S) in {SEED}:", file=sys.stderr)
        for c in REMEDY:
            mine = [f for f in findings if f[0] == c]
            if not mine:
                continue
            print(f"\n  {c} — {REMEDY[c]}", file=sys.stderr)
            for _, page, _, ctx in mine:
                print(f"    ✗ {page}: {ctx}", file=sys.stderr)
        return 1

    print(f"✓ copy-voice: clean — {len(es)} Spanish and {len(en)} English strings, "
          f"{len(es_headings) + len(en_headings)} headings, {len(pages)} pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
