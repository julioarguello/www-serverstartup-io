---
name: doc-copywriter
description: Write website copy for Server Startup with a boutique, direct, non-commercial tone. Use when writing or rewriting page text, service descriptions, CTAs, or any CMS content for serverstartup.io. Triggers on "copywriting", "web copy", "rewrite text", "tone of voice", "website text", "redactar textos".
---

# Server Startup — Copywriter Skill

Writes website copy for serverstartup.io. The tone is **natural, técnico, cercano** — como si le explicaras tu trabajo a un colega que respetas.

> **Source material**: `reference/legacy/` contains the original content.  
> **Target**: `seed/content/` or CMS entries via EmDash.  
> **Company profile**: `reference/legacy/docs/business-profile.txt`, `boutique-consulting.txt`, `ai-manifesto.txt`.

## 1. The Voice: "Café con un Colega"

The litmus test is simple: **¿se lo dirías así a un compañero técnico tomando un café?**

If the sentence sounds like a brochure → rewrite it.  
If it sounds like a sales pitch → delete it.  
If it sounds like something you'd actually say → keep it.

The goal is not to impress. It's to be **clear, useful, and real**.

### 1.1 Tone Calibration

Our voice lives in a specific zone. Too far in either direction breaks it.

```
❄️ Frío / Corporate ←——————|——✕——|——————→ 🔥 Marketing / Hype
                            |  aquí  |
                     Cercano + Técnico
```

- **More warm than 37signals** (they're opinionated loners; we're approachable partners)
- **More technical than MarsBased** (they lean editorial; we show our stack)
- **Less minimal than iA** (they write for designers; we write for engineers)
- **Never as loud as a SaaS landing page** (no urgency, no FOMO, no conversion tricks)

### 1.2 Reference Websites (Tone DNA)

| Reference | What to absorb | Real copy to study |
|:----------|:--------------|:-------------------|
| **MarsBased** (`marsbased.com`) | Ownership language. They say "we" and make it personal. | *"We treat your codebase as if it were ours"* — propiedad real, sin grandilocuencia. |
| **37signals** (`37signals.com/00`) | Declarative titles. Short, opinionated, no hedging. | *"Planning is guessing"*, *"Know no"*, *"Companies aren't families"* — una frase = una postura. |
| **iA** (`ia.net`) | Extreme density. The entire homepage is 6 sentences. | *"The Original Focused Writing App"* — 5 words, zero adjectives. |
| **Pico** (`pico.studio`) | Let the work speak. Almost no descriptive copy at all. | *"Full-suite audio by PICO"* — repeated 10 times. That's the copy. |
| **Basecamp** (`basecamp.com`) | Conversational directness. Talks TO you, not AT you. Radical transparency. | *"You've probably tried some. Yet, here you are."* — assumes intelligence. *"We've been profitable for 25 straight years, we have zero debt"* — facts, not claims. |
| **thoughtbot** (`thoughtbot.com`) | Senior-team positioning without ego. Playbook as trust signal. | *"Our senior team partners with you to deliver reliable software"* — one sentence, zero buzzwords. CTA: *"Let's Talk"*. |
| **Rittman Analytics** (`rittmananalytics.com`) | ⭐ GOLD for data vertical. Boutique ~10 people, dbt+BigQuery+Looker. Opens with client pain, not capabilities. | *"Your talented data team is bogged down in technical debt and firefighting, not innovation"* — opens with the reader's frustration. *"Named, Senior-Led Delivery"* — headline as position. *"Tools ≠ Platform"* — equation-headline. |
| **ThoughtWorks** (`thoughtworks.com`) | ⚠️ PARTIAL ANTI-REFERENCE. Thought leadership DNA (Tech Radar, books) is aspirational. But their corporate copy is a cautionary tale. | EN: *"extraordinary impact through industry-leading practices"* — corporate fog. ES: *"compromiso inquebrantable con la excelencia"*, *"a la vanguardia"* — exactly our blacklist. Study what NOT to do in translation. |
| **Brooklyn Data** (`brooklyndata.co`) | ❌ ANTI-REFERENCE. Boutique that corporatized after acquisition. | *"Transform your organization through the power of data"* — indistinguishable from Accenture. *"Unlock best-in-class data consulting"* — full blacklist. Proves: when a boutique grows, its copy dies first. |

### 1.3 Core Principles

1. **Say less, mean more** — "Lo bueno, si breve, dos veces bueno." Cut until it hurts, then cut one more adjective.
2. **Describe what we do, not why they need it** — Never sell the necessity. Just explain the work, clearly.
3. **Be precise** — "Parametrizamos SAP" not "implementamos soluciones a medida". The right verb is more convincing than any adjective.
4. **Speak as equals** — We talk to CTOs and tech leads as peers, not as prospects. No "usted", no formality theater.
5. **Show, don't claim** — Never say "somos honestos." Just speak plainly. The honesty shows.
6. **Be warm, not cheerful** — We're approachable and human. We're not performing enthusiasm. "Hablemos" not "¡Estamos deseando trabajar contigo!"
7. **Use ownership language** *(from MarsBased)* — "Tu sistema es nuestro sistema mientras trabajamos juntos" beats any "partnership" claim. Ownership is warmth.
8. **Let facts do the bragging** *(from Basecamp)* — "15 años, 3 ingenieros, un cliente principal durante 5 años" says more than "expertos consolidados". Numbers are humble and powerful.
9. **Ask "¿Y qué?" until it hurts** *(from manusco/resonance)* — For every claim, drill down: "Usamos Cloudflare Workers" → ¿Y qué? → "Tu web carga en <100ms desde cualquier país." Write _that_, not the feature.

### 1.4 Voice Dimensional Profile

Our tone is a hybrid of **"Luxe Minimalist"** (understated confidence, no hard sell) and **"Technical Educator"** (assumes competence, precise terminology). Adapted from writing-styles dimensional frameworks.

| Dimension | Server Startup | Notes |
|:----------|:--------------|:------|
| Tone | Professional-Casual | "Café con un colega" — never corporate, never sloppy |
| Pace | Fast | Max 25 words/sentence (ES), 20 words (EN) |
| Vocabulary | Technical | Use real stack names, avoid marketing synonyms |
| Emotion | Reserved | Warmth through directness, not through adjectives |
| Humor | Dry / Absent | Mild irony at most. Never puns, never performed cleverness |
| Perspective | First-person plural ("nosotros") | Never "la empresa", never third person |
| Authority | Peer | Talk _with_, not _at_. thoughtbot-level, not ThoughtWorks-level |

### 1.5 Copy Patterns to Steal (and How to Adapt Them)

These patterns come directly from studying the reference sites. Each is adapted to our Spanish/boutique context.

**Pattern 1 — The Basecamp "Yet, here you are"** (conversational honesty)
> Original: *"There are lots of ways to manage projects. You've probably tried some. Yet, here you are."*
> Ours: *"Hay cientos de consultoras. Algunas buenas. Pero estás leyendo esto, así que algo buscas."*
> When to use: Page openers. Acknowledge the reader's intelligence without explaining the obvious.

**Pattern 2 — The 37signals declarative title** (one sentence = one position)
> Original: *"Planning is guessing"*, *"Companies aren't families"*, *"Know no"*
> Ours: *"El código no es el producto"*, *"Tres ingenieros, todo el sistema"*, *"No escalamos, profundizamos"*
> When to use: Section headings for service pages and the "about" page.

**Pattern 3 — The iA micro-sentence** (extreme compression)
> Original: *"Made to Write"* — three words for a whole product.
> Ours: *"Integración de sistemas"* not "Servicio integral de integración de sistemas empresariales".
> When to use: Navigation labels, card titles, hero subtitles.

**Pattern 4 — The MarsBased ownership move** (warmth through commitment)
> Original: *"We treat your codebase as if it were ours"*
> Ours: *"Tu sistema es nuestro sistema mientras trabajamos juntos"*
> When to use: Service descriptions. Replace generic "compromiso" claims with concrete ownership statements.

**Pattern 5 — The Pico "let work speak"** (zero description)
> Original: Just project titles + "Full-suite audio by PICO"
> Ours: For portfolio/case studies — stack + resultado + zero adornments: *"SAP Hybris. Auchan. 5 años."*
> When to use: Portfolio cards, project references.

**Pattern 6 — The Basecamp transparency move** (radical facts)
> Original: *"We've been profitable for 25 straight years, we have zero debt, we're privately held"*
> Ours: *"Sin inversores. Sin deuda. Sin prisa."* or *"Un cliente principal durante 5 años. Eso dice más que cualquier certificación."*
> When to use: "About us" page, trust section.

**Pattern 7 — The Rittman "Named, Senior-Led"** (anti-body-shop)
> Original: *"Your project is delivered by a consistent, senior team who know your business, not handed down to junior staff or rotated through a bench."*
> Ours: ES: *"Tres ingenieros. Los mismos tres. De principio a fin."* / EN: *"Three engineers. The same three. Start to finish."*
> When to use: Hero sections, about page, any trust moment.

**Pattern 8 — The Rittman equation-headline** (concept ≠ assumption)
> Original: *"Tools ≠ Platform"*
> Ours: *"dbt ≠ pipeline"*, *"WAF ≠ seguridad"*, *"SAP ≠ ecommerce"*
> When to use: Service page headings. Each equation says: having the tool doesn't mean having the solution.

**Pattern 9 — The Rittman pain-opener** (start with the reader's problem)
> Original: *"You've built a successful business, but your data infrastructure is showing the strain."*
> Ours: ES: *"Tu pipeline se rompe cada lunes. Lo sabemos porque lo hemos visto."* / EN: *"Your pipeline breaks every Monday. We know because we've seen it."*
> When to use: Opening paragraph of service pages. Acknowledge the pain before presenting the solution.

## 2. The Company (Facts Only)

Use this as the single source of truth. Never invent capabilities.

| Fact | Value |
|:-----|:------|
| **Name** | Server Startup |
| **Size** | 3 senior engineers (boutique) |
| **Founded** | ~15 years experience in the team |
| **Model** | Boutique: few clients, maximum involvement |
| **Core areas** | Backend architecture, System integration, Cloud (GCP), Edge security (Cloudflare), E-commerce (SAP), Data engineering (dbt/BigQuery) |
| **Clients** | Large retail (Auchan/Alcampo), enterprise |
| **Identity** | NOT a factory. NOT a body shop. We are technical partners who stay. |
| **AI stance** | We use AI as a force multiplier. We sign the code. "Arquitectos Aumentados." |

### 2.1 The Architectural Narrative

When structuring services, follow the visual blueprint from bottom to top:

1. **Foundation** — Greenfield engineering. Clean code from scratch.
2. **Core** — System integration. Apache Camel, Talend, GCP connectors.
3. **Branches** — E-commerce (SAP/Ocado) + Big Data (BigQuery/dbt).
4. **Shield** — Cloudflare edge security, WAF, Zero Trust.

### 2.2 Vertical Service Profiles

When writing copy for a specific service area, use the vertical-specific guidance below. Each vertical has its own competitive landscape, positioning angle, and ready-to-use draft lines.

#### Vertical A — Data Engineering (dbt, BigQuery, pipelines)

**Competitive landscape:** Boutiques exist (Rittman Analytics, Brooklyn Data, DataDive). They use "modern data stack" language. Rittman is the gold standard for copy.
**Our angle:** We don't just build pipelines — we build them inside an integrated system (with SAP, Cloudflare, and Camel). That cross-vertical context is unique.
**Positioning:** "Datos gobernados, no datos acumulados."

**Draft lines (ES → EN):**
- *"Tu pipeline se rompe cada lunes. Lo sabemos porque lo hemos visto."* → *"Your pipeline breaks every Monday. We know because we've seen it."*
- *"dbt ≠ pipeline. Tener dbt no significa tener datos gobernados."* → *"dbt ≠ pipeline. Having dbt doesn't mean having governed data."*
- *"BigQuery, dbt, calidad de datos. Todo conectado con SAP y con sentido."* → *"BigQuery, dbt, data quality. All connected to SAP — and it makes sense."*

**Equation-headlines:** `dbt ≠ pipeline` · `BigQuery ≠ estrategia de datos` · `Dashboard ≠ dato fiable`
**Pain-openers:** "Tu equipo de datos apaga fuegos, no innova." / "Your data team fights fires, not builds insights."

#### Vertical B — Edge Security (Cloudflare, WAF, Zero Trust, Workers)

**Competitive landscape:** ORPHAN VERTICAL — no pure boutiques exist. Dominated by Cloudflare's own professional services and large SI partners. One niche reference: Byer Company (`jbyer.com`) positions Cloudflare as "Edge-Native" platform.
**Our angle:** This void is our advantage. We can be the first boutique to talk about Cloudflare as engineers, not as vendors. Zero competition for the "3 engineers who deploy your edge security" positioning.
**Positioning:** "Seguridad en el edge no es un firewall. Es arquitectura."

**Draft lines (ES → EN):**
- *"Cloudflare está configurado, pero nadie sabe por qué esas WAF rules están ahí. Nosotros sí."* → *"Your Cloudflare is configured, but nobody knows why those WAF rules are there. We do."*
- *"WAF ≠ seguridad. Un firewall no es una estrategia de seguridad."* → *"WAF ≠ security. A firewall is not a security strategy."*
- *"Workers, Zero Trust, WAF tuning. Tres ingenieros que lo despliegan en producción."* → *"Workers, Zero Trust, WAF tuning. Three engineers who deploy it in production."*

**Equation-headlines:** `WAF ≠ seguridad` · `CDN ≠ edge` · `Regla ≠ estrategia`
**Pain-openers:** "Cloudflare está configurado. ¿Seguro de que está bien configurado?" / "Your Cloudflare is set up. Are you sure it's set up right?"

#### Vertical C — System Integration (Apache Camel, Karaf, GCP connectors)

**Competitive landscape:** ORPHAN VERTICAL — dominated by large SIs (Accenture, Capgemini) and MuleSoft/Boomi certified partners. No visible boutiques. Firms that do this work operate by referral, not by website.
**Our angle:** Ultra-differentiation against "Silver Partners with 200 consultants." We read the Apache Camel source code. We deploy Karaf bundles. We don't make PowerPoints about integration patterns.
**Positioning:** "Integración de sistemas sin PowerPoints."

**Draft lines (ES → EN):**
- *"¿Tu middleware lo montó un 'Silver Partner' con 200 consultores? Nosotros lo montamos tres ingenieros que leen el código de Apache Camel."* → *"Was your middleware built by a Silver Partner with 200 consultants? Ours was built by three engineers who read Apache Camel's source code."*
- *"Conectamos SAP con tu ERP y monitorizamos que funcione. Sin 'assessment phase'. Sin Visio."* → *"We connect SAP to your ERP and monitor it works. No assessment phase. No Visio."*
- *"Apache Camel, Karaf, conectores GCP. Enterprise Integration Patterns de verdad."* → *"Apache Camel, Karaf, GCP connectors. Real Enterprise Integration Patterns."*

**Equation-headlines:** `Diagrama ≠ integración` · `iPaaS ≠ middleware` · `Conector ≠ sistema integrado`
**Pain-openers:** "Tu integración funciona... excepto cuando importa." / "Your integration works — except when it matters."

#### Vertical D — E-commerce / SAP (SAP Commerce Cloud, Hybris, Ocado)

**Competitive landscape:** SATURATED — 4,000+ SAP partners globally, all saying "experiencia omnicanal sin fisuras." Every partner page looks identical.
**Our angle:** We're NOT a SAP partner selling licenses. We're 3 engineers who parametrize SAP Commerce Cloud for Auchan for 5 years. The differentiator is cross-vertical: SAP + data pipeline + edge security, one team, no handoffs.
**Positioning:** "No vendemos licencias SAP. Parametrizamos tu catálogo."

**Draft lines (ES → EN):**
- *"En SAP hay 4.000 partners. Lo que no hay son 3 personas que conozcan tu catálogo, tu pipeline de precios y tu WAF al mismo tiempo."* → *"SAP has 4,000 partners. What it doesn't have is 3 people who know your catalog, your pricing pipeline, and your WAF at the same time."*
- *"SAP Hybris + pipeline de datos + seguridad perimetral. Un equipo. Sin handoffs."* → *"SAP Hybris + data pipeline + edge security. One team. No handoffs."*
- *"No somos Gold Partner. Somos tres ingenieros que parametrizan SAP Commerce Cloud para Auchan desde hace 5 años."* → *"We're not a Gold Partner. We're three engineers who have parameterized SAP Commerce Cloud for Auchan for 5 years."*

**Equation-headlines:** `SAP ≠ ecommerce` · `Partner ≠ ingeniero` · `Licencia ≠ solución`
**Pain-openers:** "Tu catálogo tiene 50.000 SKUs y tu partner no sabe cómo se indexan." / "Your catalog has 50,000 SKUs and your partner doesn't know how they're indexed."

#### Cross-Vertical Superpower

The unique selling point is NOT any single vertical — it's the **combination**. One team that handles SAP + data pipeline + edge security + middleware. No handoffs, no "let me check with the other team."

> ES: *"Un equipo. Cuatro verticales. Cero handoffs."*
> EN: *"One team. Four verticals. Zero handoffs."*

This is the line that should appear on the homepage hero, the about page, and every service page footer.

## 3. Blacklist (Hard Rules)

### 3.1 Forbidden Patterns

| Pattern | Why | Fix |
|:--------|:----|:----|
| "En un mercado saturado…" / "Hoy en día…" | Generic filler nobody needs | Start with what we do |
| "Tu negocio lo necesita" | Selling necessity | Describe the solution |
| "Nos encanta picar código" | Code-as-craft is dead (AI writes code) | "Construimos sistemas", "diseñamos arquitecturas" |
| "Elevamos el estándar" / "Excelencia" | Self-praise — let the work speak | Delete |
| "Somos honestos" / "Somos transparentes" | Meta-honesty — just speak plainly | Delete |
| "Impulsar" / "Transformar" / "Revolucionar" | Empty promises | "Optimizamos", "auditamos", "integramos" |
| "Datos con criterio" / "Insights" / "Actionable" | Data clichés | "Modelado", "linaje", "calidad" |
| "Unidades" / "Departamentos" | Fake structure (we're 3 people) | "Áreas", "prácticas", "roles" |
| "Moderno" / "Ágil" / "Robusto" / "Innovador" | Empty adjectives | Delete them. If the noun needs help, the noun is weak. |
| "Fácil y sencillo" / "Sin complicaciones" | Marketing filler | Delete |
| "¡" (exclamation marks) | Performed enthusiasm | Rewrite as a calm statement |
| "World-class" / "De clase mundial" | Even MarsBased uses this and shouldn't | Delete or be specific: "Auchan, FC Barcelona" |
| "Entusiasmo" / "Pasión" / "Nos apasiona" | Performed emotion (MarsBased's weakness) | Show the work, not the feeling |
| "Mentalidad sin límites" / "Creatividad sofisticada" | Fluff adjectives (found in MarsBased /company) | Delete |
| "Impacto extraordinario" / "Liderado por la tecnología" | ThoughtWorks corporate fog — sounds translated from English | Be specific: what changed, for whom |
| "Compromiso inquebrantable" / "A la vanguardia" | ThoughtWorks ES about-us — exactly how corporate Spanish goes wrong | Delete or replace with facts |
| "Logremos lo extraordinario" | ThoughtWorks CTA — empty aspiration | "Hablemos", "Cuéntanos tu proyecto" |
| Anglicisms without permission | Spanglish | See §3.2 |

### 3.2 Weak → Strong Replacements

Beyond the blacklist, watch for weak language patterns:

| ❌ Weak | ✅ Strong | Why |
|:--------|:---------|:----|
| "Utilizamos" | "Usamos" | Simpler is better |
| "Implementamos soluciones" | "Integramos [nombre del sistema]" | Be specific |
| "Ofrecemos servicios de" | "Hacemos [verbo concreto]" | Fewer nouns, more verbs |
| "Muy" / "Realmente" / "Bastante" | Delete | Weak intensifiers |
| "En definitiva" / "Básicamente" | Delete | Filler |
| "Para poder" | "Para" | Redundant |
| "Se trata de" | Rewrite directly | Lazy construction |
| "A nivel de [X]" | "En [X]" | Bureaucratic Spanish |

### 3.3 Language Rules

- **Spanish first**. "Heredado" not "Legacy". "Pila tecnológica" not "Stack".
- **Allowed in code font**: `backbones`, `edge`, `iPaaS`, `OAuth 2.0`, `mTLS`, `WAF`, `CI/CD`, `Java`, `Spring`, `pipelines`, `Workers`
- **Allowed in italics**: *endpoint*, *On-Premise*, *Greenfield*, *Black Friday*
- **Zero Spanglish**: No *commodity*, *partnership*, *skin in the game*. Translate them.
- **Anti-redundancy**: Never repeat a strong word in the same paragraph. Rotate: "sólida", "resiliente", "fiable", "estable", "gobernada".

### 3.4 Bilingual Rules (ES ↔ EN)

The site is published in **Spanish (primary)** and **English**. These are the rules for both.

#### 3.4.1 Translation Philosophy

The English version is NOT a translation of the Spanish version. It is a **re-expression of the same idea** in natural English.

| ❌ Don't | ✅ Do |
|:---------|:------|
| Translate literally from ES → EN | Rewrite the same idea in natural English |
| Keep Spanish sentence structure in EN | Use short, active English sentences |
| Translate EN → ES by Google Translate | Write Spanish from scratch using the English as reference |

**ThoughtWorks cautionary example**: Their `es-es/about-us` reads like machine translation — *"compromiso inquebrantable con la excelencia en ingeniería"* is bloated corporate Spanish nobody would say in a café. In English it's already bad (*"extraordinary impact"*); in Spanish it gets worse.

#### 3.4.2 Bilingual Terminology Glossary

Maintain consistent terms across both languages:

| Spanish | English | Notes |
|:--------|:--------|:------|
| Integración de sistemas | System integration | — |
| Arquitectura | Architecture | — |
| Seguridad perimetral | Edge security | — |
| Ingeniería de datos | Data engineering | — |
| Consultoría boutique | Boutique consultancy | — |
| Pila tecnológica | Tech stack | "Stack" allowed in EN |
| Heredado | Legacy | "Legacy" allowed in EN |
| Hablemos | Let's talk | NOT "Contact us" |
| Cuéntanos tu proyecto | Tell us about your project | NOT "Request a consultation" |
| Somos tres ingenieros | We're three engineers | NOT "We're a small team" |

#### 3.4.3 Formality Rules by Language

| Dimension | Spanish | English |
|:----------|:--------|:--------|
| Form of address | **Tú** (always). Never "usted". | **You** (naturally informal). |
| Register | Conversational-technical. Like talking to a colleague. | Same register. thoughtbot-level directness. |
| Gendered language | Use natural Spanish ("ingenieros"). Avoid forced inclusive rewrites. | Standard English (naturally gender-neutral). |
| Sentence length | Can be longer (Spanish allows it). Max 25 words. | Shorter. Max 20 words. English punishes length more. |
| Humor | Mild, dry — never performed. | Same. No puns, no cleverness for its own sake. |

## 4. Writing Workflow

### 4.1 Input → Output

```
reference/legacy/pages/serverstartup/*.md  →  seed/content/  (CMS format)
reference/legacy/pages/frikitek/*.md       →  (secondary reference, older tone)
```

### 4.2 Process per Page

1. **Read** the source file from `reference/legacy/pages/serverstartup/`
2. **Read** the equivalent `frikitek/` version for additional context
3. **Identify verticals**: Determine which vertical(s) from §2.2 the page covers (A–D or cross-vertical). Load the specific competitive landscape, positioning angle, equation-headlines, and pain-openers for those verticals.
4. **Draft ES first** applying:
   - Voice rules (§1) — especially patterns 7–9 (Named Senior-Led, equation-headline, pain-opener)
   - Company facts (§2) — never invent capabilities
   - Vertical-specific draft lines from §2.2 — adapt, don't copy-paste
   - Open with the reader's pain (Pattern 9), not with our capabilities
   - Use at least one equation-headline per service section (Pattern 8)
5. **Draft EN** as a re-expression of the same idea in natural English (§3.4.1). NOT a translation.
6. **Run editorial sweeps** (§4.3) — one pass per dimension, on both ES and EN
7. **Structure** the output for CMS ingestion:
   - `title`: Clean, no pipes or SEO suffixes
   - `excerpt`: 1-2 sentences, meta-description quality
   - `content`: Portable Text blocks (paragraphs, headings, lists)
   - `cta_label`: Short, direct (e.g., "Hablemos", "Ver servicios")
8. **Verify** against the blacklist (§3)
9. **Cross-vertical check**: If the page covers multiple verticals, ensure the "One team. Four verticals. Zero handoffs." message appears.
10. **Final check**: Read it aloud. Does it sound like a real person talking about their work? Or does it sound like a website?

### 4.3 Editorial Sweeps

After drafting, run these four passes in order. Each focuses on one dimension only.

**Sweep 1 — Clarity**: Can someone outside the project understand each sentence on first read? Watch for: sentences doing too much, unclear referents, assumed context.

**Sweep 2 — Voice consistency**: Does the tone stay the same from title to CTA? Watch for: shifts between formal/casual, accidental "usted", corporate phrasing creeping in mid-paragraph.

**Sweep 3 — "¿Y qué?" (recursive drill-down)**: For every claim, ask "¿Y qué?" at least twice until you reach a concrete impact. If a sentence describes a capability without connecting it to something the reader cares about, it's filler.

```
"Integramos sistemas"        → ¿Y qué?
→ "SAP habla con tu ERP"     → ¿Y qué?
→ "El stock se actualiza solo" ← WRITE THIS
```

**Sweep 4 — Specificity**: Replace anything vague with something concrete. "Experiencia en retail" → "Auchan, SAP Hybris, 3 años." Numbers, names, and stack references beat adjectives every time.

> **Note**: Standard copywriting frameworks add two more sweeps — "Heightened Emotion" and "Zero Risk" (urgency, FOMO, risk reversal). We deliberately skip both. That's not our game.

### 4.4 CTA Style Guide

| ❌ Don't | ✅ Do |
|:---------|:------|
| "Descubra cómo podemos ayudarle" | "Hablemos" |
| "Solicite una consulta gratuita" | "Cuéntanos tu proyecto" |
| "Contáctenos hoy mismo" | "Escríbenos" |
| "Empieza tu transformación digital" | "¿Trabajamos juntos?" |

### 4.5 Headline Style Guide

Inspired by 37signals' declarative style. Each headline should be a position, not a description.

| ❌ Don't | ✅ Do | Pattern |
|:---------|:------|:--------|
| "Soluciones integrales para su negocio" | "Arquitectura, integración y seguridad" | iA micro |
| "Llevamos tu infraestructura al siguiente nivel" | "Infraestructura que funciona" | Basecamp directness |
| "Tu partner tecnológico de confianza" | "Tres ingenieros. Todo el sistema." | 37signals declarative |
| "Expertos en transformación digital" | "Backend, datos y seguridad perimetral" | iA listing |
| "Comprometidos con la excelencia" | "No escalamos. Profundizamos." | 37signals position |
| "Tecnología al servicio del negocio" | "El código no es el producto" | 37signals philosophical |
| "Una empresa diferente" | "Sin inversores. Sin deuda. Sin prisa." | Basecamp transparency |

### 4.6 Legacy Text Audit Prompt

When evaluating text from `reference/legacy/`, run this diagnostic to check alignment:

```
Analyze this text against our voice profile:

[PASTE TEXT]

1. Tone (Professional-Casual vs Corporate):
2. Pace (word count per sentence):
3. Vocabulary (technical precision vs marketing synonyms):
4. Emotion (reserved-warm vs performed enthusiasm):
5. Authority (peer vs expert-from-above):
6. Blacklist violations (§3.1):
7. Weak patterns (§3.2):
8. Would it pass the "café con un colega" test? (yes/no + why):
```

## 5. Color & Visual Identity

When referencing areas in content or generating visual assets:

| Area | Color | Hex |
|:-----|:------|:----|
| E-commerce (SAP) | Blue | `#008FD3` |
| Greenfield Engineering | Green | `#3E7D50` |
| Cloudflare Security | Orange | `#F38020` |
| Big Data (GCP) | Red | `#EA4335` |
| System Integration | Blueprint Blue | `#1D4E89` |

## 6. Quality Checklist

Before submitting any text, verify:

- [ ] Zero blacklisted words (§3.1)
- [ ] No weak patterns remain (§3.2)
- [ ] No anglicisms outside the allow-list (§3.3)
- [ ] No adjective could be deleted without losing meaning
- [ ] Every paragraph adds information, not just emphasis
- [ ] CTAs are ≤ 4 words
- [ ] Would pass the "café con un colega" test — natural, warm, precise
- [ ] Matches the density/clarity of MarsBased or iA
- [ ] Company facts are accurate (§2)
- [ ] No fake structure words ("departamento", "unidad")
- [ ] No exclamation marks
- [ ] Specific where possible: names, numbers, stack references
- [ ] EN version is a natural re-expression, NOT a literal translation (§3.4)
- [ ] Bilingual terminology is consistent with glossary (§3.4.2)
- [ ] Does NOT sound like ThoughtWorks ES (corporate fog test)
- [ ] ≤2 AI-tells per page — §8.3 audit run and scored
- [ ] Burstiness: sentence and paragraph lengths visibly vary (§8.2)
- [ ] At least one falsifiable fact per section; one domain-true retail detail per page
- [ ] Zero em-dashes in ES; max ONE colon construction ("X: Y") per page
- [ ] First two words of every heading and paragraph carry information (F-pattern)
- [ ] Passes the meeting test with the §7 reader

## 7. The One Reader (Target Persona)

Write every page for ONE person (Harry Dry's rule: copy for everyone is copy for no one).

**The architect who built what Ahorra Más runs today.** An experienced software architect (15–25 years of production scars) at a mid-size Spanish retailer. The reference estate, verified 2026-08: ~275 stores across Madrid and Castilla-La Mancha, 12,000 employees, a Salesforce Commerce Cloud storefront behind Cloudflare (`demandware` assets, `dwanonymous` cookie, `server: cloudflare`), Citrus retail media, an ERP, store POS, a promotions engine, and a data platform nobody fully trusts. Our reader stood that up personally, town by town.

**Their week**: a promotion that reached the web but not the POS; stock that never quite matches between store, warehouse and online; a capacity question about the next campaign peak; a vendor meeting where someone said "assessment phase"; a junior rotated onto their account without asking.

**Their real alternatives** (April Dunford): not our competitors — *"lo hacemos en casa"* or *"no hacemos nada"*. Every page must quietly answer **why not in-house**: senior depth on demand, without headcount, from people who have run the same estate and answer personally.

**Trust triggers**: named tools with versions, un-round numbers, admitted limits, front-loaded prose (they read the first two words of each line — Nielsen's F-pattern), anything they could verify.
**Close-tab triggers**: "soluciones integrales", trademarked methodology names, benefit-speak explaining their own job to them, anything a colleague would never say out loud.

**Things this reader actually says** (write TO these, sparingly):
- "El dato de stock no cuadra y nadie sabe dónde se pierde."
- "Otro partner que me manda un junior a aprender con mi presupuesto."
- "El WAF lo configuró alguien que ya no está en la empresa."
- "Me sobran licencias y me faltan manos."

**Litmus upgrade**: §1's café test becomes the **meeting test** — would you say the sentence, verbatim, to this architect in a working meeting without blushing? If it sounds like a press note, say what you would say in the meeting and write that.

## 8. Anti-AI Fingerprints (Hard Rules)

AI-written copy is detected by pattern **density**, not by any single tell (Wikipedia, "Signs of AI writing"). One tell is a style choice; five are a signature. Budget: **≤2 tells per page**.

### 8.1 Banned constructions (extends §3)

| Pattern | Example to kill | Fix |
|:--------|:----------------|:----|
| Empty contrast "no es X, es Y" / "not just X, but Y" | "No es un firewall, es tranquilidad" | State the claim once, in the affirmative. Only sanctioned exceptions: equation-headlines and "No escalamos. Profundizamos." |
| Decorative triads | "rápido, fiable y escalable" | Use the real number of items (1, 2, 4…). Sole sanctioned triad: "Un equipo. Cuatro verticales. Cero handoffs." |
| Em-dash flourish (—) | "y responde — siempre" | Zero em-dashes in ES. In EN prefer a period; the em-dash is the single most memed AI tell |
| Colon-headline "X: Y" | "Una regla: quien diseña, escribe" | Max ONE per page. Otherwise split into two sentences |
| Universal openers | "En un mundo cada vez más digital…" | Open with a system, a number or a failure |
| Summary closers | "En definitiva…", "En resumen…" | End on the last real point or the CTA |
| Meta-hedges | "Cabe destacar que…", "Es importante tener en cuenta…" | Delete the frame, keep the content |
| Copula dodging | "se erige como", "actúa como", "cuenta con" | "es", "tiene" |
| AI vocabulary (extends §3.1 blacklist) | crucial, clave, esencial, sin fisuras, sinérgico, vibrante, dinámico, potenciar, maximizar, "en constante evolución", "paisaje digital" | Concrete verb, or delete |
| Weasel sourcing | "Los estudios demuestran…" | Name the study/client/year, or cut |
| Rounded flex numbers | "más de 100 proyectos" | Un-round numbers read as records: "13 proyectos y 22 pedidos en 2025" |
| Uniform rhythm (metronome) | Every sentence 12–18 words, every paragraph two lines | See §8.2.1 burstiness |

### 8.2 Human texture (required, not optional)

1. **Burstiness**: per section, at least one sentence under 6 words AND one over 20; paragraph lengths must visibly differ. Sentence-length variance is the most measurable human/AI separator.
2. **One falsifiable fact per section**: a tool, a date, a version, an un-round number — something a reader could check and prove wrong. A paragraph with nothing checkable is decoration.
3. **One domain-true detail per page**: something only someone who has operated retail systems would write ("la promoción que llega tarde al TPV", "el stock que no cuadra entre tienda y web").
4. **Idiom in small doses**: Spanish from Spain ("da la cara", "las justas") — one per page, two max. LLM Spanish defaults to neutral pan-Hispanic register; local idiom is expensive to fake.
5. **Asymmetry**: spend the words on the one thing we believe; drop the rest without apology. AI covers everything evenly; experts don't.
6. **Negative honesty**: somewhere on the site, one thing we don't do or a reason NOT to hire us. Skeptical readers trust disqualification more than any claim.
7. **Fragments allowed.** And sentences starting with Y or Pero. Professional spelling always — boutique, not sloppy.

### 8.3 The 10-point "¿huele a IA?" audit

Run on every page before shipping; count the hits.

1. Empty contrast without new information?
2. Decorative triad (three items chosen for cadence)?
3. Universal opener (would it fit a dentist's website)?
4. Summary closer, or a final paragraph that repeats the page?
5. Banned vocabulary (>1 per paragraph)?
6. Em-dash flourish, or "Título: explicación" in every bullet?
7. Metronome (read aloud: equal-length sentences and paragraphs)?
8. Zero falsifiable claims?
9. Could a competitor paste the paragraph unchanged onto their site?
10. Would you say it to the §7 architect's face in a meeting?

**Scoring**: 0–2 hits → publishable. 3–5 → rewrite the flagged sentences. 6+ → discard the draft and restart from a concrete fact.

> **Sources** (verified 2026-05-02):
> - `reference/legacy/agent/boutique-copywriter.md` — Original copywriter skill with full blacklist
> - `reference/legacy/agent/richin13-writing-style.md` — Clarity/conciseness principles
> - `reference/legacy/agent/style-feedback.md` — Consolidated tone corrections
> - `reference/legacy/docs/ai-manifesto.txt` — Strategic AI positioning
> - `reference/legacy/docs/boutique-consulting.txt` — Boutique consultancy profile
> - MarsBased, 37signals, iA, Pico, Basecamp, thoughtbot — Positive tonal references (reviewed 2026-05-02)
> - Rittman Analytics (`rittmananalytics.com`) — Gold reference for data boutique positioning (reviewed 2026-05-02)
> - Brooklyn Data (`brooklyndata.co`) — Anti-reference for corporatized boutique (reviewed 2026-05-02)
> - DataDive (`datadive.com.au`) — Numbers-as-proof-social reference (reviewed 2026-05-02)
> - Byer Company (`jbyer.com`) — Edge-Native Cloudflare reframing reference (reviewed 2026-05-02)
> - ThoughtWorks (`es-es/about-us`) — Anti-reference for corporate Spanish translation pitfalls (reviewed 2026-05-02)
> - `coreyhaines31/marketingskills/copy-editing` — Editorial sweeps framework (adapted: sweeps 1-4 only, emotion/urgency sweeps removed)
> - `coreyhaines31/marketingskills/copywriting` — Weak→Strong word replacement pattern (adapted to Spanish context)
> - `manusco/resonance` — "Seven Sweeps" and "¿Y qué?" recursive drill-down pattern (sweeps 1-4 adopted)
> - `DatTran26/KienTruThiHanh` — Voice Dimensional Profile framework (7 dimensions adapted to boutique technical tone)
> - GitHub Docs style guide — Bilingual technical writing best practices reference

> **Sources for §7–§8** (verified 2026-08-04):
> - Wikipedia "Signs of AI writing" (WikiProject AI Cleanup) — definitive AI-tell catalog; density-not-single-tell principle
> - Genbeta + DeGPT + Bilateria — Spanish ChatGPT-ese word/phrase/typography lists
> - Burstiness research (QuillBot/UNIC summaries) — sentence-length variance as human/AI separator
> - Harry Dry, marketingexamples.com landing-page guide — visualize/falsify/one-reader/in-person tests
> - April Dunford — positioning against real alternatives ("in-house or nothing", not competitors)
> - Nielsen Norman Group — F-pattern reading, front-loading
> - William Zinsser, On Writing Well — clutter test; richin13 gist — vary structure, avoid AI-giveaway phrases
> - ahorramas.com stack fingerprint (curl, 2026-08-04): Salesforce Commerce Cloud (`demandware`, `dwanonymous`, `x-dw-request-base-id`) behind Cloudflare, Citrus retail media; company facts via ecommerce-news.es and Alimarket
> - Reader-persona details cross-checked against `docs/company/09-target-reader.md` in www-serverstartup-io

---

## Fact Sources (Knowledge Base) — added 2026-08-02

Every company fact used in copy MUST come from the canonical knowledge base
**`docs/company/` in the `www-serverstartup-io` repo** (identity, team, clients,
services, tech specialties, voice, web benchmark, sources registry). Do not
re-derive facts from memory or old decks. Hard constraints that override anything
else in this skill:

- **Client naming whitelist**: public copy may only name Alcampo, Auchan,
  Forum Sport, Punt Roma, Job&Talent (*former* client), plus Inetum and Grupo
  Seidor as collaborations. Every other client: anonymous references only.
  Full policy: `docs/company/03-clients-track-record.md`.
- **Founded 2019** (Registro Mercantil Bizkaia 24/01/2019) — never "2017".
  CIF **B95944807**.
- Distilled rule: `.agent/rules/www-serverstartup-io.md` §13.
- A frozen copy of this skill lives at `docs/company/annex/doc-copywriter-SKILL.md`.
