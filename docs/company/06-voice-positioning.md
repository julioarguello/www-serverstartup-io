# Positioning and brand voice

## The thesis: boutique partner, not "just another consultancy"

Internal definition ([boutique-consulting.txt](../../reference/legacy/docs/boutique-consulting.txt)):
hyper-specialization, senior talent (zero juniors), agility and pragmatism, "a
relationship of partners rather than mere providers". Literal closing line:

> "An integration boutique is a 'specialized surgeon' solving complex connectivity
> problems where the big firms tend to be too slow or too generic."

The facts that sustain it (all evidenced in this knowledge base):
3 engineers, the same ones, no bench · founded 2019, team with ~15 years of craft ·
main client for 5+ years · senior-only by design · "We can't take every project" ·
whoever designs it delivers it and answers for it.

## The normative artifact: the `doc-copywriter` skill

Full copy in [annex/doc-copywriter-SKILL.md](annex/doc-copywriter-SKILL.md)
(deleted from the `.agent` submodule in commit `430a923`; also recoverable with
`git -C .agent show 430a923^:skills/doc-copywriter/SKILL.md`). Skeleton:

- **Core test**: "Would you say it like this to a technical colleague over coffee?"
- **9 principles**: say less; describe what we do (never sell the necessity);
  precision; speak as equals (tú, never usted); show, don't claim; warm, not
  cheerful; ownership language ("your system is our system"); let facts brag;
  recursive "so what?".
- **Patterns**: pain-opener, equation-headline (`WAF ≠ security`), Named
  Senior-Led ("Three engineers. The same three."), Basecamp transparency
  ("No investors. No debt. No hurry."), 37signals declarative titles.
- **Mandatory cross-vertical line** (hero, about, every service footer):
  **ES: "Un equipo. Cuatro verticales. Cero handoffs." / EN: "One team. Four
  verticals. Zero handoffs."**
- **Blacklist**: impulsar/transformar/revolucionar, excellence, passion,
  world-class, exclamation marks, Spanglish, "modern/agile/robust/innovative"…
- **Bilingual**: EN = re-expression, not translation. "Hablemos" → "Let's talk".
- **CTAs ≤ 4 words**: "Hablemos", "Cuéntanos tu proyecto", "Audita tu edge".
- **§7 The One Reader** (Ahorra Más-type retail architect) and **§8 Anti-AI
  fingerprints** (10-point smell audit) added 2026-08-04.

Predecessors (genealogy, all in `reference/legacy/agent/`):
[boutique-copywriter.md](../../reference/legacy/agent/boutique-copywriter.md)
(persona: "Principal Engineer explaining their stack at KubeCon"; final rule:
"Would you say it in front of 200 colleagues without cringing?"),
[boutique-rewrite-workflow.md](../../reference/legacy/agent/boutique-rewrite-workflow.md),
[style-feedback.md](../../reference/legacy/agent/style-feedback.md) (e.g. "'We
don't sell smoke' is defensive → use 'technical rigor and professional honesty'"),
[richin13-writing-style.md](../../reference/legacy/agent/richin13-writing-style.md).

## Tone references (DNA)

Positive: MarsBased (ownership), 37signals (declarative titles), iA (density),
thoughtbot (senior partner), Basecamp (candor), Pico, **Rittman Analytics (gold
for the data vertical)**. Anti-references: **ThoughtWorks ES** ("corporate fog")
and Brooklyn Data ("when a boutique grows, its copy dies first").
Analysis as of 2026-08-02 in [07-web-benchmark.md](07-web-benchmark.md).

## Canonical lines verified against facts

| Line (ES) | Backing fact |
| --------- | ------------ |
| "Tres ingenieros. Los mismos tres. De principio a fin." | Real team: Julio, Nacho, Daniel ([02-team.md](02-team.md)) |
| "Un equipo. Cuatro verticales. Cero handoffs." | All four verticals delivered by the same 3 people |
| "No escalamos. Profundizamos." | "We can't take every project" + senior-only (2025 deck) |
| "Sin inversores. Sin deuda. Sin prisa." | Founder-owned company, no external capital `[INFERRED: no trace of outside investment in any source]` |
| "Si se rompe, no abrimos un ticket: lo arreglamos." | Real alerting/support operations (daily) |
| "Nosotros firmamos el código." | AI manifesto + supervised-agent practice |
| "Parametrizamos SAP" / "No vendemos licencias SAP." | 15 years of hybris; SAP consultancy for multiple retailers via partners |

## Learned cautions (do not repeat)

- **Client citability**: the website may only name Alcampo, Auchan, Forum Sport,
  Punt Roma and Job&Talent (former client), plus the Inetum and Seidor
  collaborations. Everything else, anonymized only. Full rule in
  [03-clients-track-record.md](03-clients-track-record.md) §Citability policy.
- Homepage pre-profile copy ("robusto", "impulsa") fixed in
  [#142](https://github.com/julioarguello/www-serverstartup-io/issues/142) /
  PR [#167](https://github.com/julioarguello/www-serverstartup-io/pull/167).
- Never use "2017" as the founding year (see [01-identity.md](01-identity.md)).
- The deck testimonial is strong but attribution would require permission before
  using it on the website `[PENDING]`.
- The CMS `members` don't match the real team (see [02-team.md](02-team.md)).
