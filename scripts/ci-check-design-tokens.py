#!/usr/bin/env python3
"""Design-token guard (#304) — colour, radius, shadow and the column.

`src/styles/theme.css` is the only place a colour, a radius or a shadow may be
declared. Everything else — the other stylesheets and the `<style>` blocks
inside components — consumes tokens. Without this check the unification lasts
until the next page: a literal `#fafafa` or `border-radius: 8px` reads as
perfectly good CSS in review, and the portal drifts back to five radii.

What counts as a violation, in a *declaration* outside the token file:

  · a colour literal — `#abc`, `#aabbcc`, `rgb(...)`, `rgba(...)`, `hsl(...)`
  · `border-radius` with anything but a token (or 0 / 50% / a percentage)
  · `box-shadow` with anything but a token (or `none`)
  · `max-width` with anything but the column token (or `100%` / `none`)

That last one is the layout rule made executable. A page has ONE width: every
heading, paragraph, box, panel and row ends at the column's right edge. The
portal had drifted to seven measures (1400 / 1040 / 1000 / 880 / 780 / 700 /
680) and the founder's reaction was the correct one — *"me pierdo con el
criterio… busco consistencia"*. Prose is not exempt: a second, narrower
measure for body copy alternates long and short lines down the page, which is
what reads as no criterion at all. A bespoke `max-width` is how that comes
back, one component at a time, so it is the thing to reject.

Two things are deliberately NOT violations:

  · a token with a literal fallback — `var(--color-primary, #1e1e1e)` — which
    is a token use, not a declaration;
  · a region a file marks itself, between `/* token-guard: off — reason */`
    and `/* token-guard: on */`. The service instruments quote foreign chrome
    (a cart, a search result, a pull request) whose colours belong to the
    product being imitated; a house token there would be wrong, not right.
    The marker keeps the exception visible at the exact line instead of
    exempting a whole file from a list nobody reads.

Positive control (#385)
-----------------------
Before it trusts a clean tree, the gate plants each defect it hunts in a
throwaway stylesheet of its own and asserts the scanner still finds them. A
narrowed regex, a renamed property or a broken comment-stripper would
otherwise leave this printing "✓ colour, radius, shadow and width come from
theme.css only" over a portal drifting back to five radii — a scan that
CANNOT find anything looks exactly like a clean tree. The fixture lives in a
temporary directory, never in the repository: a canary in the tree is how the
citability guard died the second time (#347).

Usage:  python3 scripts/ci-check-design-tokens.py [--verbose]
Exit 0 clean · 1 violations found · 2 nothing was inspected · 3 the gate is blind.
"""

from __future__ import annotations

import re
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKEN_FILE = ROOT / "src" / "styles" / "theme.css"

COLOR_LITERAL = re.compile(
    r"(?<![\w-])(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))"
)
DECL = re.compile(r"^\s*([a-z-]+)\s*:\s*([^;]+);", re.IGNORECASE)

# `var(--token, <fallback>)` — the fallback is part of a token USE
VAR_FALLBACK = re.compile(r"var\(\s*--[\w-]+\s*,[^)]*\)")

GUARD_OFF = re.compile(r"/\*\s*token-guard:\s*off\b")
GUARD_ON = re.compile(r"/\*\s*token-guard:\s*on\b")

# A declaration line may carry a literal legitimately when it is inside a
# comment; strip block comments before scanning — but the guard markers are
# themselves comments, so they are read before stripping.
COMMENT = re.compile(r"/\*.*?\*/", re.DOTALL)

# ── the unconsumed-token check (#457) ───────────────────────────────────────
#
# The scan above proves every literal has a token. It cannot see the reverse:
# a token nothing consumes. That direction has no rendering symptom at all —
# the page is correct, the CSS is valid, and nothing anywhere is red — so it
# is found only by someone reading theme.css and grepping, which is how
# `--card-shadow` and five pastel `--color-card-*` survived from the
# WordPress-era design into 2026 while `docs/design-system.md` went on
# describing them as the card palette and claiming the CMS stored them.
#
# It is not cosmetic. theme.css is normative — it is the file the design
# system points at — and a token declared there is a promise that this is how
# the site draws that thing. Eleven promises the tree had stopped keeping made
# the normative file unreadable as a description of the site.
#
# Note the check is deliberately NOT transitive: `--rhythm-block:
# var(--space-6)` counts as a consumer of `--space-6` even while nothing
# consumes `--rhythm-block`. Chasing that in one pass would mean solving a
# dependency graph to report a tidiness defect; instead the next run reports
# the newly-orphaned token, and the cleanup converges in as many runs as the
# chain is deep. Two, here.
DECLARES_TOKEN = re.compile(r"^\s*(--[\w-]+)\s*:")
USES_TOKEN = re.compile(r"var\(\s*(--[\w-]+)\s*[,)]")

# A ladder is declared whole or not at all — see the fence in theme.css. The
# fence is the one way to opt out of the check below, so it needs a definition
# it can be held to, or it becomes the way to opt out of everything: measured,
# widening it over the whole `:root` block silenced all 56 tokens and the run
# still exited 0. A scale is therefore a run of tokens sharing ONE name prefix
# (`--space-1` … `--space-9`). A fence spanning two prefixes is not a scale, it
# is a silencer, and it is reported as blindness rather than obeyed.
SCALE_ON = re.compile(r"/\*\s*token-scale:\s*on\b")
SCALE_OFF = re.compile(r"/\*\s*token-scale:\s*off\b")

# Anything that can carry a `var()` to a browser. `seed/` is in because CMS
# content ships inline `style=` attributes; `docs/` is deliberately OUT —
# a token described in prose is not a token anything consumes, and treating
# documentation as a consumer is precisely how the dead ones stayed alive.
CONSUMER_GLOBS = (("src", "*.css"), ("src", "*.astro"), ("src", "*.ts"),
                  ("src", "*.js"), ("src", "*.mjs"), ("seed", "*.json"))


def declared_tokens(text: str) -> tuple[list[tuple[int, str]], list[str], int | None]:
    """`(unfenced, fenced, unclosed_line)` for the tokens `text` declares.

    The third value is why this returns three things. A `token-scale: on` that
    never closes silences every token below it and the check goes on exiting 0
    — measured: one deleted `off` marker took theme.css from 56 checked tokens
    to 46, silently. Its own positive control cannot catch that, because the
    control fences a *fixture*: it proves the code can see a runaway fence
    somewhere, not that there isn't one here. A plant must not need the thing
    it is checking. So the fence in the real file is measured too, and an
    unclosed one is reported as blindness (3), not as a clean run.

    Fencing more than one family is how the fence stops being a scale
    exemption and becomes an off switch, so `fenced` is returned for the
    caller to hold to that shape.
    """
    unfenced: list[tuple[int, str]] = []
    fenced: list[str] = []
    opened_at: int | None = None
    for n, line in enumerate(text.splitlines(), 1):
        if SCALE_ON.search(line):
            opened_at = n
        elif SCALE_OFF.search(line):
            opened_at = None
        m = DECLARES_TOKEN.match(COMMENT.sub("", line))
        if m:
            (fenced.append(m.group(1)) if opened_at else unfenced.append((n, m.group(1))))
    return unfenced, fenced, opened_at


def scale_families(names: list[str]) -> set[str]:
    """`--space-1` and `--space-9` are one family; `--space-1` and `--radius`
    are two, and two families inside one fence is not a scale."""
    return {n.rsplit("-", 1)[0] for n in names}


def used_tokens(files) -> set[str]:
    used = set()
    for path in files:
        used.update(USES_TOKEN.findall(path.read_text(encoding="utf-8")))
    return used


def unconsumed(theme_text: str, files) -> list[tuple[int, str]]:
    used = used_tokens(files)
    unfenced, _, _ = declared_tokens(theme_text)
    return [(n, name) for n, name in unfenced if name not in used]


# a radius may be a corner list (`0 var(--radius) var(--radius) 0`) — every
# atom must be a token, a zero or a percentage
RADIUS_ATOM = r"(0|0px|\d+%|var\(--[\w-]+\)|inherit|initial|unset)"
RADIUS_OK = re.compile(rf"^{RADIUS_ATOM}(\s*/?\s*{RADIUS_ATOM})*$")
SHADOW_OK = re.compile(r"^(none|var\(--[\w-]+\)|inherit|initial|unset)$")
# the column, or "as wide as whatever contains me" — nothing else
WIDTH_OK = re.compile(r"^(100%|none|var\(--container-max\)|var\(--measure-statement\)"
                      r"|100vw|fit-content|max-content|min-content|inherit|initial|unset)$")


def scan(path: Path) -> tuple[list[tuple[int, str, str]], int]:
    """Return (violations, muted_lines) for `path`.

    `muted_lines` counts what the file's own `token-guard: off` regions cover,
    so a run can report how much it chose not to look at — a guard that goes
    quiet because everything was silenced must say so.
    """
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    # blank out comments but keep line numbering intact
    stripped = COMMENT.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), raw)

    findings: list[tuple[int, str, str]] = []
    muted = 0
    off = False
    for n, (line, source) in enumerate(zip(stripped.splitlines(), raw_lines), 1):
        if GUARD_OFF.search(source):
            off = True
        elif GUARD_ON.search(source):
            off = False

        m = DECL.match(line)
        if not m:
            # a colour literal outside a declaration (e.g. an SVG attribute in
            # an .astro file) is not CSS — ignore it
            continue
        if off:
            muted += 1
            continue
        prop, value = m.group(1).lower(), m.group(2).strip()

        if prop == "border-radius":
            if not RADIUS_OK.match(value):
                findings.append((n, prop, f"{value!r} is not var(--radius…) or 0"))
        elif prop == "box-shadow":
            if not SHADOW_OK.match(value):
                findings.append((n, prop, f"{value!r} is not var(--shadow…) or none"))
        elif prop == "max-width":
            if not WIDTH_OK.match(value):
                findings.append((n, prop, f"{value!r} is a width of its own — a page has one "
                                          f"(var(--container-max)); use 100% inside a box"))

        # a literal inside `var(--token, …)` is a fallback, not a declaration
        for lit in COLOR_LITERAL.findall(VAR_FALLBACK.sub("", value)):
            findings.append((n, prop, f"colour literal {lit} — declare it in theme.css"))

    return findings, muted


# ── positive control ────────────────────────────────────────────────────────

# One planted defect per rule the scanner claims to enforce, plus the three
# shapes it must NOT flag. Written the way this project writes CSS — one
# declaration per line — because that is what the scanner reads; a fixture
# contorted to match the regex would agree with it by construction.
CONTROL_CSS = """/* fixture — lives in a temp dir, never in the repository tree */
.canary-colour {
	color: #ff00ff;
}
.canary-rgba {
	background: rgba(12, 34, 56, 0.5);
}
.canary-radius {
	border-radius: 8px;
}
.canary-shadow {
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.canary-width {
	max-width: 700px;
}
.canary-token {
	color: var(--color-text, #1e1e1e);
}
.canary-ok {
	border-radius: var(--radius);
	max-width: 100%;
}
/* token-guard: off — foreign chrome */
.canary-fenced {
	color: #ff0000;
}
/* token-guard: on */
"""

CONTROL_EXPECTED = {
    "canary-colour": "colour literal",
    "canary-rgba": "colour literal",
    "canary-radius": "not var(--radius",
    "canary-shadow": "not var(--shadow",
    "canary-width": "a width of its own",
}


def positive_control() -> int:
    """Prove the scanner can still see each defect. 0 = sighted, 3 = blind."""
    with tempfile.TemporaryDirectory() as tmp:
        fixture = Path(tmp) / "canary.css"
        fixture.write_text(CONTROL_CSS, encoding="utf-8")
        findings, muted = scan(fixture)

    lines = CONTROL_CSS.splitlines()

    def selector_of(line_no: int) -> str:
        """The rule a finding sits in — walk back to the nearest selector."""
        for n in range(line_no - 1, -1, -1):
            if lines[n].startswith("."):
                return lines[n].split()[0].lstrip(".")
        return "<none>"

    seen: dict[str, list[str]] = {}
    for line_no, prop, reason in findings:
        seen.setdefault(selector_of(line_no - 1), []).append(reason)

    blind: list[str] = []
    for selector, expected in CONTROL_EXPECTED.items():
        reasons = seen.get(selector, [])
        if not any(expected in r for r in reasons):
            blind.append(f"planted {selector} ({expected!r}) was NOT reported")
    for selector in ("canary-token", "canary-ok", "canary-fenced"):
        if selector in seen:
            blind.append(f"{selector} is legal CSS but was reported: {seen[selector]}")
    if muted != 1:
        blind.append(f"the token-guard fence covered {muted} declaration(s), expected 1")

    if blind:
        print("✗ design-tokens: THIS GATE IS BLIND — it can no longer find the "
              "defects it exists to find, so a green run proves nothing:", file=sys.stderr)
        for b in blind:
            print(f"    {b}", file=sys.stderr)
        print("  → the scanner changed (a narrowed regex, a renamed property, the "
              "comment stripper); fix it before trusting any result.", file=sys.stderr)
        return 3
    return 0


# One planted defect and three shapes that must NOT be flagged — the fence,
# an ordinary consumed token, and a token consumed only from a .astro file.
# The last one is here because the earliest draft of this check globbed *.css
# alone and would have reported every token the components consume.
CONTROL_THEME = """:root {
	--consumed-by-css: #1E1E1E;
	--consumed-by-astro: 4px;
	--nobody-consumes-me: #ABCDEF;
	/* token-scale: on */
	--rung-1: 4px;
	--rung-2: 8px;
	/* token-scale: off */
	--after-the-fence-and-dead: 12px;
}
"""
CONTROL_CONSUMERS = {
    "a.css": ".x { color: var(--consumed-by-css); }",
    "b.astro": "<style>.y { padding: var(--consumed-by-astro, 2px); }</style>",
}
CONTROL_DEAD = {"--nobody-consumes-me", "--after-the-fence-and-dead"}


def unconsumed_control() -> list[str]:
    """Plant a dead token, a fenced scale and two live tokens; find exactly one
    of each. A fence that swallows everything is the failure mode that would
    make this check green forever, so the run asserts the fence covered the two
    rungs and nothing else."""
    blind: list[str] = []
    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        for name, body in CONTROL_CONSUMERS.items():
            (d / name).write_text(body, encoding="utf-8")
        found = {name for _, name in unconsumed(CONTROL_THEME, sorted(d.iterdir()))}

        for missed in CONTROL_DEAD - found:
            blind.append(f"planted dead token {missed} went unreported")
        for extra in found - CONTROL_DEAD:
            blind.append(f"reported {extra}, which the fixture consumes or fences")

        wide = CONTROL_THEME.replace(":root {", ":root {\n\t/* token-scale: on */", 1)
        if len(scale_families(declared_tokens(wide)[1])) < 2:
            blind.append("a fence spanning every family was read as a single scale")
        if scale_families(["--space-1", "--space-9"]) != {"--space"}:
            blind.append("one scale's rungs were read as more than one family")

        unfenced, fenced, unclosed = declared_tokens(CONTROL_THEME)
        if sorted(fenced) != ["--rung-1", "--rung-2"]:
            blind.append(f"the fence covered {sorted(fenced)}, not the two rungs it wraps")
        if unclosed is not None:
            blind.append("a fence that closes was read as still open")
        if "--after-the-fence-and-dead" not in {n for _, n in unfenced}:
            blind.append("the fence never closed — it silenced the rest of the fixture")
    return blind


def main() -> int:
    verbose = "--verbose" in sys.argv

    blind = positive_control()
    if blind:
        return blind
    if verbose:
        print(f"  ok   positive control — {len(CONTROL_EXPECTED)} planted defects all found")

    blind = unconsumed_control()
    if blind:
        print("✗ the unconsumed-token check is BLIND — it did not re-find the defect "
              "it exists to catch, so a green run proves nothing:", file=sys.stderr)
        for b in blind:
            print(f"    {b}", file=sys.stderr)
        return 3
    if verbose:
        print(f"  ok   positive control — {len(CONTROL_DEAD)} planted dead tokens found, "
              f"2 consumed and 2 fenced left alone")

    targets = sorted(
        [p for p in (ROOT / "src" / "styles").rglob("*.css") if p != TOKEN_FILE]
        + [p for p in (ROOT / "src").rglob("*.astro") if "<style" in p.read_text(encoding="utf-8")]
    )
    if not targets:
        print("✗ nothing to inspect — the scan found no stylesheets", file=sys.stderr)
        return 2

    total = 0
    muted_total = 0
    for path in targets:
        rel = str(path.relative_to(ROOT))
        findings, muted = scan(path)
        muted_total += muted
        for line_no, prop, reason in findings:
            print(f"✗ {rel}:{line_no}  {prop}: {reason}")
            total += 1
        if verbose:
            note = f" ({muted} declarations under token-guard: off)" if muted else ""
            print(f"  {'✗' if findings else 'ok'}   {rel}{note}")

    theme_text = TOKEN_FILE.read_text(encoding="utf-8")
    unfenced, fenced, unclosed = declared_tokens(theme_text)
    if unclosed is not None:
        print(f"✗ {TOKEN_FILE.relative_to(ROOT)}:{unclosed}  `token-scale: on` is never "
              f"closed — every token below it is unchecked.", file=sys.stderr)
        print("  → close it with `/* token-scale: off */`.", file=sys.stderr)
        return 3

    families = scale_families(fenced)
    if len(families) > 1:
        print(f"✗ {TOKEN_FILE.relative_to(ROOT)}  `token-scale` fences {len(fenced)} tokens "
              f"from {len(families)} families ({', '.join(sorted(families))}) — that is not a "
              f"scale, it is an off switch, and it silences the unconsumed-token check.",
              file=sys.stderr)
        print("  → fence one scale per region, or delete the token instead.", file=sys.stderr)
        return 3

    consumers = sorted({p for sub, pat in CONSUMER_GLOBS for p in (ROOT / sub).rglob(pat)})
    orphans = unconsumed(theme_text, consumers)
    for line_no, name in orphans:
        print(f"✗ {TOKEN_FILE.relative_to(ROOT)}:{line_no}  {name}: declared here, "
              f"consumed nowhere")
        total += 1
    if verbose:
        print(f"  {'✗' if orphans else 'ok'}   {len(consumers)} consumer files read for var() "
              f"uses; {len(fenced)} token(s) fenced as a scale and not required to be consumed")

    print(f"\nInspected {len(targets)} files against {TOKEN_FILE.relative_to(ROOT)}.")
    if muted_total:
        print(f"  {muted_total} declarations sat inside `token-guard: off` regions "
              f"(foreign chrome) and were not inspected.")
    if total:
        print(f"✗ {total} defect(s): {total - len(orphans)} literal(s) outside the token "
              f"file, {len(orphans)} token(s) nothing consumes.")
        print("  For a literal: add the value to theme.css as a token and consume it,")
        print("  or — if the value belongs to a product being imitated — wrap that")
        print("  region in `/* token-guard: off — reason */ … /* token-guard: on */`.")
        print("  For an unconsumed token: delete it. theme.css is normative, so a")
        print("  token declared there claims this is how the site draws that thing.")
        print("  If it is a rung of a scale that is meant to be complete, fence the")
        print("  scale with `/* token-scale: on */ … /* token-scale: off */`.")
        return 1
    print(f"✓ colour, radius, shadow and width come from theme.css only, and all "
          f"{len(unfenced)} tokens it declares are consumed "
          f"({len(fenced)} fenced as a scale)\n"
          f"  ({len(CONTROL_EXPECTED)} + {len(CONTROL_DEAD)} planted defects found "
          f"first — neither scan is blind).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
