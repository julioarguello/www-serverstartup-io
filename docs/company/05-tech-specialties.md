# Technical specialties proven by commits

> Methodology (2026-08-02): author sweep over the last 30 commits of ~21 active
> repos in [auchan-retail-spain](https://github.com/auchan-retail-spain) and
> [auchan-retail-international](https://github.com/auchan-retail-international),
> plus the full inventory of [julioarguello](https://github.com/julioarguello)'s
> personal repos. "Ours" = commits by Julio Argüello, Ignacio Ibaseta (`iibaseta`)
> or Daniel Sío (`dsiorajo`). The org repos belong to the client; authorship
> delimits which part of the estate is genuinely Server Startup's work.

## The 8 evidenced specialties

### 1. Systems integration — Apache Camel / JAWA platform
- [es-ares-jawa2](https://github.com/auchan-retail-spain/es-ares-jawa2) — 30/30 commits Julio (active, Jul 2026).
- [es-ares-jawa-routes](https://github.com/auchan-retail-spain/es-ares-jawa-routes) — 28/30 Julio; plus `es-ares-jawa-platform`, `es-ares-jawa-toolkit`, `es-ares-jawa-terraform`.
- [es-ares-data-java-esb-data-pipeline](https://github.com/auchan-retail-international/es-ares-data-java-esb-data-pipeline) — 30/30 Julio.
- Own Camel component: [es-ares-ecom-camel-pebble-component](https://github.com/auchan-retail-spain/es-ares-ecom-camel-pebble-component).
- Honest nuance: the bulk of the legacy ESB estate is maintained by client staff;
  ours are the JAWA platform, the ESB data pipeline and the architecture pieces.

### 2. Ocado OSP e-commerce / Java backend
- [es-ares-ecom-osp-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-osp-middleware) — 30/30 Julio (Jul 2026).
- [es-ares-ecom-gcf-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-gcf-middleware) — serverless GCF; Julio + supervised AI agent.
- [es-ares-ecom-gcf-data-pipeline](https://github.com/auchan-retail-international/es-ares-ecom-gcf-data-pipeline) — 29/30 Julio.
- OSP feed cryptography: `es-ares-ecom-gcf-osp-crypto`, `es-ares-ecom-labs-osp-pki-js`.

### 3. SAP Commerce / hybris (15+ years)
- Legacy `es-npecom-*` estate (hybris, 20.11 upgrades, Liferay, WSO2, CIAM),
  including migration assessment and QA engagements (2020, via an IT services firm).
- Consultancy for several third-party retailers and distributors through partner
  channels (see [03-clients-track-record.md](03-clients-track-record.md) policy).
- Brand origin: the hybris trenches (see [01-identity.md](01-identity.md)).

### 4. Data — dbt / BigQuery / LookML
- [es-ares-ecom-dbt](https://github.com/auchan-retail-spain/es-ares-ecom-dbt) — 24/30 Julio (Jul 2026).
- [es-ares-data-dbt-retail](https://github.com/auchan-retail-spain/es-ares-data-dbt-retail) — Daniel Sío contributions alongside a mixed client team.
- Platform documentation: [es-ares-data-doc-consolidacion-resiliencia-ventas](https://github.com/julioarguello/es-ares-data-doc-consolidacion-resiliencia-ventas).
- Own dbt-Oracle skills in [awesome-serverstartup-skills](https://github.com/julioarguello/awesome-serverstartup-skills).
- Declared 2026 goal: "de-facto experts in dbt" (corporate deck).

### 5. Terraform / GCP IaC — Nacho's territory
- [es-ares-ecom-terraform-osp-api](https://github.com/auchan-retail-international/es-ares-ecom-terraform-osp-api) — 18/30 Ignacio Ibaseta (Jul 2026).
- [es-ares-data-terraform-sales](https://github.com/auchan-retail-international/es-ares-data-terraform-sales) plus `terraform-admin`, `terraform-data-feed` and personal `es-ares-data-terraform-*` mirrors.
- Opinionated BigQuery module: [terraform-google-bigquery](https://github.com/julioarguello/terraform-google-bigquery).

### 6. Cloudflare Workers / edge engineering
- [fs-workers](https://github.com/julioarguello/fs-workers) (Forum Sport), [ssr-cache-worker](https://github.com/julioarguello/ssr-cache-worker) (SSR cache with R2), `es-npecom-cloudflare-workers`, [jobandtalent.com](https://github.com/julioarguello/jobandtalent.com) (Terraform for 40+ services).
- HTML cacheability analysis over SAP Commerce Cloud + Cloudflare CDN for a large
  retailer (2026, private repo).
- **FuSeMe** ecosystem (2026): `fuseme-document-pipeline`, `fuseme-document-converter`
  (document→Markdown Worker with toMarkdown + Browser Rendering + Llama 4 Scout VLM),
  `fuseme-api-gateway`, `fuseme-terraform`, `fuseme-commons`,
  `fuseme-oagi-semantic-mapper` — a complete serverless platform on Workers/R2.

### 7. Operations and quality — Postman/CI, monitoring
- [es-ares-ecom-postman-frescos-corte](https://github.com/auchan-retail-spain/es-ares-ecom-postman-frescos-corte) — Daniel Sío main author on our side; PRD Sku/Availability Sync workflows.
- `es-ares-ecom-postman-webhook-retry`, `es-ares-ecom-postman-substitutes`, `es-ares-ecom-postman-customer-promise`, `es-ares-ecom-github-shots` (UAT/PRD replays).
- Cloudflare health checks and alerting as a living service (daily).

### 8. Technical documentation and architecture as a deliverable
- [es-ares-yoda-doc-synapse-migration](https://github.com/auchan-retail-spain/es-ares-yoda-doc-synapse-migration) — 30/30 Julio; migration documentation as a project in itself.
- `es-ares-ecom-plantuml-alcampo`, `forumsport-plantuml`, `plant-uml-esp-osp`, `es-ares-data-doc-brand-portal`.
- The 2025 deck brags about it: "High-quality documentation and optimized performance".

## Signals of own R&D (beyond client work)

- [bluebell-platform](https://github.com/julioarguello/bluebell-platform) — financial-forum crawling, Schema.org API, sentiment analysis at the edge.
- FuSeMe (see §6) — AI document pipeline at the edge.
- `second-brain-cloudflare` (fork), `grain-fsm`, [www-serverstartup-io](https://github.com/julioarguello/www-serverstartup-io) (this website: Astro + EmDash + D1).

## Person → specialty map (summary)

| Person | Core | Flagship repos |
| ------ | ---- | -------------- |
| Julio Argüello | Camel integration, Ocado OSP, dbt, Workers, architecture and documentation | es-ares-jawa2, es-ares-ecom-osp-middleware, es-ares-ecom-dbt, fuseme-* |
| Ignacio Ibaseta | Terraform/GCP, data platform, data engineering | es-ares-ecom-terraform-osp-api, es-ares-data-terraform-sales |
| Daniel Sío | Ocado e-commerce operations, Smart/CFC evolutions, dbt | es-ares-ecom-postman-frescos-corte, es-ares-data-dbt-retail |
