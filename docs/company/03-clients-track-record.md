# Clients and track record

> Curated public version. The complete historical client map (including engagements
> reached through partner channels) lives in `private/03-clients-track-record.md`
> (gitignored). This file keeps everything that is publicly citable.

## 🚦 Public citability policy (GOLDEN RULE for the website and any public material)

Direct instruction from Julio (2026-08-02):

- **Citable direct clients**: **Alcampo**, **Auchan**, **Forum Sport**,
  **Punt Roma** and **Job&Talent** (the latter as a *former* client).
- **Citable collaborations**: **Inetum** and **Grupo Seidor** — may be mentioned as
  partners/channels through which other engagements were delivered, without naming
  those end clients.
- **Any client not listed above must NEVER be named publicly.** Those engagements
  were delivered as a contractor through third parties; there is no directly
  citable relationship. The full list is maintained privately.
- **Anonymous references are allowed** ("a toy-retail chain", "a fashion
  marketplace") and so are aggregates ("40+ domains managed on Cloudflare"), as
  long as the client cannot be identified.
- **Cloudflare** is not a client but an official partnership (agreement renewed
  2026-04-30): citable as partner.

## Main client: Auchan Retail Spain (Alcampo)

Continuous, growing relationship; direct supplier homologation since 2024.
2025 balance (corporate deck): **13 projects, 22 purchase orders, 440 SWA days +
180 SA days**.

### Work areas with public evidence

| Area | Work | Public evidence |
| ---- | ---- | --------------- |
| **Ocado e-commerce (OSP/Yoda)** | OSP middleware, presentation rules ("high complexity!"), Google Shopping/Woosmap/Contentful mashups, feed cryptography | [es-ares-ecom-osp-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-osp-middleware), [es-ares-ecom-gcf-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-gcf-middleware) |
| **Integration (JAWA platform / Camel)** | Smart V2 transmissions hub, Camel routes, own Camel component (Pebble) | [es-ares-jawa2](https://github.com/auchan-retail-spain/es-ares-jawa2), [es-ares-jawa-routes](https://github.com/auchan-retail-spain/es-ares-jawa-routes), [es-ares-ecom-camel-pebble-component](https://github.com/auchan-retail-spain/es-ares-ecom-camel-pebble-component) |
| **Data platform (dbt/BigQuery)** | Analytics layer ("111 models, 48 sources, 1646 tests"), Digital Ticket, Real-Time Sales, sales resilience | [es-ares-ecom-dbt](https://github.com/auchan-retail-spain/es-ares-ecom-dbt), [es-ares-data-dbt-retail](https://github.com/auchan-retail-spain/es-ares-data-dbt-retail) |
| **Smart V2** | Architecture (API Manager/ETL/ESB selection), data-governance guide | [es-esp-smart](https://github.com/auchan-retail-international/es-esp-smart) |
| **GCP platform administration** | IAM, Terraform, BigQuery inventories, cost reporting, security/compliance | `es-ares-*-terraform-*` estates |
| **Architecture documentation as a deliverable** | e.g. the Synapse migration PoC, fully documented | [es-ares-yoda-doc-synapse-migration](https://github.com/auchan-retail-spain/es-ares-yoda-doc-synapse-migration) |

Client testimonial (2025 deck, anonymized there):
> "It brings me enormous value to be able to delegate something end-to-end knowing
> it will be done well, with barely any management on my side. Trust in solutions
> that are solid, scalable, and won't end up costing more than doing it with
> another provider."

## Cloudflare partnership (since 2019)

Publicly citable portfolio:

| Client | Period | Scope |
| ------ | ------ | ----- |
| **Forum Sport** | 2018 → active | Implementation, optimization, dynamic content with Workers (2018), WAF (2022), yearly renewals — [fs-workers](https://github.com/julioarguello/fs-workers) |
| **Alcampo.es** | 2020 → | Migration from Akamai, optimization, WAF, Bot Manager |
| **Punt Roma** | 2020 → active | CDN adoption, Business plan (2024), DNS/certificate advisory (2026) |
| **Job&Talent** (former client) | 2022 | 40+ services on AWS/S3, security, Terraform, Stream — [jobandtalent.com](https://github.com/julioarguello/jobandtalent.com) (Terraform) |

Beyond these, the practice manages **40+ domains** for retail and e-commerce
companies reached through partner channels (Grupo Seidor, Inetum, distribution) —
referenced publicly only in anonymous or aggregate form.

## SAP Commerce / e-commerce consultancy beyond Alcampo

Fifteen-plus years of hybris/SAP Commerce work, including multi-country promotion
models, pricing engines, Solr sizing and catalog performance for several retailers
and distributors — all delivered through partner channels and therefore not
publicly named (see policy above; full map in `private/`).

## Own market research

The consultancy keeps its platform advisory grounded in analyst reports (Gartner,
Forrester Wave B2B/B2C Commerce, IDC MarketScape) — archived privately.
