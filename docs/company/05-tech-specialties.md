# Especialidades técnicas demostradas por commits

> Metodología (2026-08-02): barrido de autores en los últimos 30 commits de una
> muestra de ~21 repos activos de
> [auchan-retail-spain](https://github.com/auchan-retail-spain) y
> [auchan-retail-international](https://github.com/auchan-retail-international),
> más el inventario completo de repos personales de
> [julioarguello](https://github.com/julioarguello). "Nuestro" = commits de Julio
> Argüello, Ignacio Ibaseta (iibaseta) o Daniel Sío (dsiorajo). Los repos de las
> orgs son del cliente; la autoría delimita qué parte del estate es realmente
> trabajo de Server Startup.

## Las 8 especialidades con evidencia

### 1. Integración de sistemas — Apache Camel / plataforma JAWA
- [es-ares-jawa2](https://github.com/auchan-retail-spain/es-ares-jawa2) — 30/30 commits Julio (activo, jul 2026).
- [es-ares-jawa-routes](https://github.com/auchan-retail-spain/es-ares-jawa-routes) — 28/30 Julio; + `es-ares-jawa-platform`, `es-ares-jawa-toolkit`, `es-ares-jawa-terraform`.
- [es-ares-data-java-esb-data-pipeline](https://github.com/auchan-retail-international/es-ares-data-java-esb-data-pipeline) — 30/30 Julio.
- Componente Camel propio: [es-ares-ecom-camel-pebble-component](https://github.com/auchan-retail-spain/es-ares-ecom-camel-pebble-component).
- Matiz honesto: el grueso del estate `es-ares-data-karaf-poster_*` y `esb_*` lo
  mantiene personal de Alcampo (Emilio Rocafort et al.); lo nuestro son la
  plataforma JAWA, el pipeline de datos ESB y las piezas de arquitectura.

### 2. E-commerce Ocado OSP / backend Java
- [es-ares-ecom-osp-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-osp-middleware) — 30/30 Julio (jul 2026).
- [es-ares-ecom-gcf-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-gcf-middleware) — serverless GCF; Julio + agente IA supervisado.
- [es-ares-ecom-gcf-data-pipeline](https://github.com/auchan-retail-international/es-ares-ecom-gcf-data-pipeline) — 29/30 Julio.
- Criptografía de feeds OSP: `es-ares-ecom-gcf-osp-crypto`, `es-ares-ecom-labs-osp-pki-js`.

### 3. SAP Commerce / hybris (15+ años)
- Estate legacy `es-npecom-*` (hybris, upgrades 20.11, Liferay, WSO2, CIAM) + contratos
  IECISA 2020 "(A32198) Assessment Migración Hybris 20.11", "(A32201) Aseguramiento Calidad".
- Consultoría a terceros: Bihr, Logista Estanqueros, Shufersal, Adi, Actiu
  (ver [03-clients-track-record.md](03-clients-track-record.md)).
- Origen de la marca: la trinchera hybris (ver [01-identity.md](01-identity.md)).

### 4. Datos — dbt / BigQuery / LookML
- [es-ares-ecom-dbt](https://github.com/auchan-retail-spain/es-ares-ecom-dbt) — 24/30 Julio (jul 2026).
- [es-ares-data-dbt-retail](https://github.com/auchan-retail-spain/es-ares-data-dbt-retail) — contribuciones Daniel Sío junto a equipo mixto del cliente.
- Documentación de plataforma: [es-ares-data-doc-consolidacion-resiliencia-ventas](https://github.com/julioarguello/es-ares-data-doc-consolidacion-resiliencia-ventas).
- Skills dbt-Oracle propios en [awesome-serverstartup-skills](https://github.com/julioarguello/awesome-serverstartup-skills).
- Objetivo declarado 2026: "expertos de facto en dbt" (deck corporativo).

### 5. Terraform / GCP IaC — territorio de Nacho
- [es-ares-ecom-terraform-osp-api](https://github.com/auchan-retail-international/es-ares-ecom-terraform-osp-api) — 18/30 Ignacio Ibaseta (jul 2026).
- [es-ares-data-terraform-sales](https://github.com/auchan-retail-international/es-ares-data-terraform-sales) + `terraform-admin`, `terraform-data-feed`, y mirrors personales `es-ares-data-terraform-*` (zipcode, promotions, integration, fat, datapool-dm).
- Módulo BigQuery opinionado: [terraform-google-bigquery](https://github.com/julioarguello/terraform-google-bigquery).

### 6. Cloudflare Workers / edge engineering
- [fs-workers](https://github.com/julioarguello/fs-workers) (Forum Sport), [ssr-cache-worker](https://github.com/julioarguello/ssr-cache-worker) (SSR cache con R2), `es-npecom-cloudflare-workers`, [jobandtalent.com](https://github.com/julioarguello/jobandtalent.com) (Terraform de >40 servicios).
- [toysrus-caching-analysis](https://github.com/julioarguello/toysrus-caching-analysis) — "Estrategia de Caching para toysrus.es — análisis de cacheabilidad HTML sobre SAP Commerce Cloud + Cloudflare CDN" (2026).
- Ecosistema **FuSeMe** (2026): `fuseme-document-pipeline`, `fuseme-document-converter`
  (Worker de conversión documento→Markdown con toMarkdown + Browser Rendering +
  Llama 4 Scout VLM), `fuseme-api-gateway`, `fuseme-terraform`, `fuseme-commons`,
  `fuseme-oagi-semantic-mapper` — plataforma serverless completa sobre Workers/R2.

### 7. Operativa y calidad — Postman/CI, monitorización
- [es-ares-ecom-postman-frescos-corte](https://github.com/auchan-retail-spain/es-ares-ecom-postman-frescos-corte) — Daniel Sío (dsiorajo) autor principal nuestro; workflows PRD Sku/Availability Sync.
- `es-ares-ecom-postman-webhook-retry`, `es-ares-ecom-postman-substitutes`, `es-ares-ecom-postman-customer-promise`, `es-ares-ecom-github-shots` (replays UAT/PRD).
- Health checks y alertas Cloudflare como servicio vivo (Gmail diario).

### 8. Documentación técnica y arquitectura como entregable
- [es-ares-yoda-doc-synapse-migration](https://github.com/auchan-retail-spain/es-ares-yoda-doc-synapse-migration) — 30/30 Julio; documentación de migración como proyecto en sí.
- `es-ares-ecom-plantuml-alcampo`, `forumsport-plantuml`, `plant-uml-esp-osp`, `es-ares-data-doc-brand-portal`.
- El deck 2025 lo presume: "Documentación de alta calidad y rendimiento optimizado" (Valiuz).

## Señales de I+D propia (más allá de cliente)

- [bluebell-platform](https://github.com/julioarguello/bluebell-platform) — crawling de foros financieros, API Schema.org, análisis de sentimiento en el edge.
- FuSeMe (ver §6) — pipeline documental con IA en el edge.
- `second-brain-cloudflare` (fork), `grain-fsm`, [www-serverstartup-io](https://github.com/julioarguello/www-serverstartup-io) (esta web: Astro + EmDash + D1).

## Mapa persona → especialidad (resumen)

| Persona | Núcleo duro | Repos insignia |
| ------- | ----------- | -------------- |
| Julio Argüello | Integración Camel, Ocado OSP, dbt, Workers, arquitectura y documentación | es-ares-jawa2, es-ares-ecom-osp-middleware, es-ares-ecom-dbt, fuseme-* |
| Ignacio Ibaseta | Terraform/GCP, plataforma de datos, data engineering | es-ares-ecom-terraform-osp-api, es-ares-data-terraform-sales |
| Daniel Sío | Operativa e-commerce Ocado, evolutivos Smart/CFC, dbt | es-ares-ecom-postman-frescos-corte, es-ares-data-dbt-retail |
