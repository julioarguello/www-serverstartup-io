# Posicionamiento y voz de marca

## La tesis: partner boutique, no "una consultora más"

Definición interna ([boutique-consulting.txt](../../reference/legacy/docs/boutique-consulting.txt)):
hiper-especialización, talento senior (cero juniors), agilidad y pragmatismo,
"relación de socios (partners) más que de simples proveedores". Cierre literal:

> "Una boutique de integración es un 'cirujano especializado' que resuelve problemas
> de conectividad complejos donde las grandes firmas suelen ser demasiado lentas o
> genéricas."

Los hechos que la sostienen (todos con evidencia en esta base):
3 ingenieros, los mismos, sin banquillo · fundada 2019, equipo con ~15 años de
oficio · cliente principal desde hace >5 años · senior-only por decisión ·
"No podemos ir a todas" · el que diseña es el que entrega y el que responde.

## El artefacto normativo: skill `doc-copywriter`

Copia íntegra recuperada en [annex/doc-copywriter-SKILL.md](annex/doc-copywriter-SKILL.md)
(fue borrado del submódulo `.agent` en el commit `430a923`; recuperable también con
`git -C .agent show 430a923^:skills/doc-copywriter/SKILL.md`). Esqueleto:

- **Test central**: "¿Se lo dirías así a un compañero técnico tomando un café?"
- **9 principios**: decir menos, describir lo que hacemos (no vender la necesidad),
  precisión, hablar de igual a igual (tú, nunca usted), mostrar sin proclamar,
  cálido sin ñoño, lenguaje de propiedad ("tu sistema es nuestro sistema"), que los
  hechos presuman, "¿y qué?" recursivo.
- **Patrones**: pain-opener, equation-headline (`WAF ≠ seguridad`), Named
  Senior-Led ("Tres ingenieros. Los mismos tres."), transparencia Basecamp
  ("Sin inversores. Sin deuda. Sin prisa."), títulos declarativos 37signals.
- **Línea transversal obligatoria** (hero, about, cierre de cada servicio):
  **ES: "Un equipo. Cuatro verticales. Cero handoffs." / EN: "One team. Four
  verticals. Zero handoffs."**
- **Lista negra**: impulsar/transformar/revolucionar, excelencia, pasión,
  world-class, exclamaciones, Spanglish, "moderno/ágil/robusto/innovador"…
- **Bilingüe**: EN = re-expresión, no traducción. "Hablemos" → "Let's talk".
- **CTAs ≤ 4 palabras**: "Hablemos", "Cuéntanos tu proyecto", "Audita tu edge".

Predecesores (contexto genealógico, todos en `reference/legacy/agent/`):
[boutique-copywriter.md](../../reference/legacy/agent/boutique-copywriter.md)
(persona: "Ingeniero Principal explicando su stack en KubeCon"; regla final: "¿Lo
dirías en una conferencia ante 200 colegas sin sentir vergüenza ajena?"),
[boutique-rewrite-workflow.md](../../reference/legacy/agent/boutique-rewrite-workflow.md),
[style-feedback.md](../../reference/legacy/agent/style-feedback.md) (p. ej.: "'No
vendemos humo' es defensivo → usar 'Rigor técnico y honestidad profesional'"),
[richin13-writing-style.md](../../reference/legacy/agent/richin13-writing-style.md).

## Referencias de tono (ADN)

Positivas: MarsBased (ownership), 37signals (títulos declarativos), iA (densidad),
thoughtbot (partner senior), Basecamp (franqueza), Pico, **Rittman Analytics (oro
para el vertical de datos)**. Anti-referencias: **ThoughtWorks ES** ("niebla
corporativa") y Brooklyn Data ("cuando una boutique crece, su copy muere primero").
Análisis actualizado a 2026-08-02 en [07-web-benchmark.md](07-web-benchmark.md).

## Frases canónicas verificadas contra hechos

| Frase (ES) | Hecho que la respalda |
| ---------- | --------------------- |
| "Tres ingenieros. Los mismos tres. De principio a fin." | Equipo real: Julio, Nacho, Daniel ([02-team.md](02-team.md)) |
| "Un equipo. Cuatro verticales. Cero handoffs." | Las 4 verticales las entregan las mismas 3 personas |
| "No escalamos. Profundizamos." | "No podemos ir a todas" + senior-only (deck 2025) |
| "Sin inversores. Sin deuda. Sin prisa." | Sociedad 50/50 de los fundadores, sin capital externo ([01-identity.md](01-identity.md)) `[INFERIDO: no hay rastro de inversión externa en ninguna fuente]` |
| "Si se rompe, no abrimos un ticket: lo arreglamos." | Operativa real de alertas/soporte (Gmail diario) |
| "Nosotros firmamos el código." | Manifiesto IA + práctica con agentes supervisados |
| "Parametrizamos SAP" / "No vendemos licencias SAP." | 15 años hybris; consultoría Bihr/Logista/Shufersal |

## Cautelas aprendidas (no repetir)

- **Citabilidad de clientes**: en la web SOLO pueden nombrarse Alcampo, Auchan,
  Forum Sport, Punt Roma y Job&Talent (ex-cliente), más las colaboraciones con
  Inetum y Seidor. El resto del track record, solo anonimizado. Regla completa en
  [03-clients-track-record.md](03-clients-track-record.md) §Política de citabilidad.
- El copy actual de la homepage aún es pre-perfil (contiene "robusto", "impulsa") —
  issue [#142](https://github.com/julioarguello/www-serverstartup-io/issues/142).
- No usar "2017" como año de fundación (ver [01-identity.md](01-identity.md)).
- El testimonio del deck es potente pero habría que pedir permiso antes de usarlo
  con atribución en la web `[PENDIENTE]`.
- Los `members` del CMS no coinciden con el equipo real (ver [02-team.md](02-team.md)).
