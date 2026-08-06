# Servicios y modelo de negocio

## Las dos líneas de negocio reales

### 1. Ingeniería senior de sistemas para retail enterprise (≈ Alcampo)

Delivery E2E con autonomía y criterio, facturado por **jornadas por perfil**
(SWA — Software Architect; SA — Solution Architect) contra pedidos de inversión
(SAP Ariba). Comprende los cuatro "verticales" de la web:

| Vertical (web) | Trabajo real que lo sustenta |
| -------------- | ---------------------------- |
| Ingeniería Greenfield / sistemas críticos | Middleware Ocado OSP, backends Java/Spring, GCF serverless, criptografía de feeds |
| Integración de sistemas | Plataforma JAWA (Apache Camel), hub de transmisiones Smart V2, interfaces ESB, componente Camel propio (Pebble) |
| Big Data & Cloud Analytics | Plataforma dbt/BigQuery (111 modelos / 1646 tests), Ticket Digital, Ventas Tiempo Real, resiliencia de ventas, LookML |
| E-commerce / SAP | 15+ años hybris/SAP Commerce; Ocado OSP; consultoría a terceros (Bihr, Logista, Shufersal, Adi, Actiu) |

Modalidades observadas: pedido cerrado por proyecto con hoja de estimación
(propuestas "[ServerStartup] Propuesta …" en Gmail), ampliaciones incrementales,
y **bolsa de horas** para administración GCP continua.

### 2. Partner Cloudflare + asesoría experta de edge

- Venta/renovación de suscripciones (Enterprise, Business) dimensionadas por
  dominios y tráfico, a menudo con Seidor como implantador y V-Valley como
  distribuidor: "Server Startup S.L. … como empresa colaboradora del Grupo Seidor
  … y en su condición de partner de Cloudflare altamente especializado y de perfil
  ciertamente técnico" (plantilla de propuesta).
- Servicio en tres etapas (plantilla Toys"R"Us): **configuración inicial y puesta en
  marcha (PoC + GoLive) → soporte y monitorización → asesoramiento y consultoría
  experta**, con "un sistema de alertas encaminado a la detección precoz … y una
  experiencia verdaderamente proactiva y abierta para la transmisión del
  conocimiento".
- Propuesta de valor literal (misma plantilla): "aminorar el nivel de implicación
  necesario por parte del personal técnico … **sin menoscabo de su autonomía**. Así
  como la tranquilidad propia de saberse protegido y con capacidad de reacción."
- Palancas de negociación observadas (versiones v1→v5 Toys"R"Us): módulos añadidos
  (R2, Workers), contrato bianual → anual, pago mensual fijo o variable.
- Operativa diaria visible en Gmail: alertas de seguridad/tráfico/health-check de
  toysrus.es/pt, forumsport.com, dooerssneakers.com; reporte WAF diario de Eroski.

## Rasgos del modelo (constantes 2022 → 2026)

- **Senior-only**: "No nos planteamos tener perfiles junior" (deck 2025).
- **Deliberadamente pequeños**: "Plantilla limitada. La ambición es mantener
  productividad y calidad. 'No podemos ir a todas'".
- **E2E con poco management del cliente**: el testimonio del deck lo dice mejor que
  cualquier eslogan (ver [03-clients-track-record.md](03-clients-track-record.md)).
- **Transmisión de conocimiento** como parte del servicio, no como amenaza.
- **Honestidad técnica en las propuestas**: la propuesta Punt Roma discute
  limitaciones reales (precisión de geolocalización por IP, VPNs/proxies) en vez de
  ocultarlas.
- **Objetivos 2026** (deck): "Erigirnos como adalid del rendimiento y optimización
  de procesos" y "Convertirnos en expertos de facto en tecnología dbt".

## Postura ante la IA

Del [manifiesto](../../reference/legacy/docs/ai-manifesto.txt) (17 KB, base del
posicionamiento "Arquitectos Aumentados"):

1. Pivotar de la producción a la **gobernanza** ("Garante de la Integridad Digital").
2. Base moderna *secure-by-design*.
3. **"Vender Certeza y Responsabilidad, no Horas"** — retainer, precio fijo por valor.
4. Roles como "Arquitectos Aumentados" con protocolo de auditoría de código IA:
   **"Nosotros firmamos el código."**

> "La IA no te sustituirá a ti. Sustituirá a los consultores que sigan vendiendo
> código al peso."

Evidencia de práctica real (no solo discurso): commits del agente "antigravity" en
[es-ares-ecom-gcf-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-gcf-middleware)
supervisados por Julio; repo de configuración de agentes
[awesome-serverstartup-skills](https://github.com/julioarguello/awesome-serverstartup-skills);
ecosistema FuSeMe (pipeline documental con VLM en Cloudflare Workers AI).

## Precedente de pricing por valor `[PENDIENTE de profundizar]`

Existen ejercicios de estimación/pricing para terceros (Logista 2023, Osborne 2021,
Shufersal) y un `~$Pricing.pptx` (lockfile) en la raíz de Dropbox cuyo original no
se ha localizado aún — probablemente `Projects/Osborne/Análisis/20210519 - Pricing.pptx`.
