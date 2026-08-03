# Clientes y track record (2017 → 2026)

> Convención: cada bloque cita su evidencia. Rutas Dropbox relativas a
> `~/Library/CloudStorage/Dropbox/`. Los `fileId` de Drive se abren como
> `https://docs.google.com/document/d/<fileId>` (o `/presentation/`, `/spreadsheets/`).

## 🚦 Política de citabilidad pública (REGLA DE ORO para la web y cualquier material público)

Instrucción directa de Julio (2026-08-02). Este documento interno mapea TODO el
track record, pero **de cara al público solo pueden nombrarse**:

- **Clientes directos citables**: **Alcampo**, **Auchan**, **Forum Sport**,
  **Punt Roma** y **Job&Talent** (este último como *ex-cliente*: "fue cliente").
- **Colaboraciones citables**: **Inetum** y **Grupo Seidor** — pueden mencionarse
  como partners/colaboraciones a través de las cuales se trabajó "con el resto de
  clientes", sin nombrar a esos clientes finales.
- **Prohibido nombrar** a cualquier otro cliente del historial (Toys"R"Us, Eroski,
  Dooers, Carolina Herrera, Marathon, Bihr, Batz, WoW, Eurofred, Tous, Fagor
  Arrasate, Unode50, Logista, Shufersal, Osborne, Samsung, Actiu, Adi, Conforama,
  CTIC, Cadarso, Frigicoll, IHOBE…): en esos proyectos Server Startup actuó como
  contractor a través de terceros y no tiene relación directa citable.
- **Sí se permite** la referencia anónima en el copy ("una cadena de retail de
  juguetería", "un marketplace de moda") y los datos agregados ("+40 dominios
  gestionados en Cloudflare"), siempre que no permitan identificar al cliente.
- **Cloudflare** no es cliente sino partnership oficial (acuerdo renovado
  2026-04-30): citable como partner.

## Cliente principal: Auchan Retail Spain (Alcampo)

Relación continua y creciente. Canal inicial vía IECISA/Inetum `[INFERIDO de
Imputaciones/IECISA 2020-2024 y contratos "(A32198) Assessment Migración Hybris"]`;
homologación directa como proveedor Alcampo el 2024-02-02 (`Contratos/2024/`).
Pedidos vía SAP Ariba ("AUCHAN HOLDING ha enviado un nuevo pedido EP…"), facturación
recepcionada por Tradial. Balance 2025 (deck corporativo): **13 proyectos, 22
pedidos, 440 jornadas SWA + 180 SA**.

### Áreas de trabajo con evidencia

| Área | Proyectos | Evidencia |
| ---- | --------- | --------- |
| **E-commerce Ocado (OSP/Yoda)** | Middleware OSP, Reglas de Presentación ("¡Alta complejidad!"), mashups Google Shopping/Woosmap/Contentful, criptografía de feeds, sustitutos, customer promise, SEO extractions | Repos [es-ares-ecom-osp-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-osp-middleware), [es-ares-ecom-gcf-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-gcf-middleware), `es-ares-ecom-gcf-osp-crypto`, `es-ares-ecom-postman-*`; contratos `2024/20240408 - Alcampo - Sustitutos`, `20240423 - Alcampo - Yoda`; deck corporativo 2025 |
| **Integración (plataforma JAWA / Camel)** | Hub de transmisiones Smart V2, rutas Camel, componente Pebble propio | [es-ares-jawa2](https://github.com/auchan-retail-spain/es-ares-jawa2), [es-ares-jawa-routes](https://github.com/auchan-retail-spain/es-ares-jawa-routes), `es-ares-jawa-platform/toolkit/terraform`, [es-ares-ecom-camel-pebble-component](https://github.com/auchan-retail-spain/es-ares-ecom-camel-pebble-component) |
| **Plataforma de datos (dbt/BigQuery)** | Capa analítica ("111 modelos, 48 fuentes, 1646 tests"), Ticket Digital, Ventas Tiempo Real, Valiuz, UPC batch (dbt sobre Oracle), Consolidación y Resiliencia de Ventas | [es-ares-ecom-dbt](https://github.com/auchan-retail-spain/es-ares-ecom-dbt), [es-ares-data-dbt-retail](https://github.com/auchan-retail-spain/es-ares-data-dbt-retail), [es-ares-data-doc-consolidacion-resiliencia-ventas](https://github.com/julioarguello/es-ares-data-doc-consolidacion-resiliencia-ventas); propuesta Gmail 2026-07-13 "Consolidación y Resiliencia Datos de Ventas - Ampliación" |
| **Smart V2** | Arquitectura (selección API Manager/ETL/ESB), guía de gobierno del dato, evolutivos [DIG] | [es-esp-smart](https://github.com/auchan-retail-international/es-esp-smart) (Julio autor dominante), deck corporativo 2025 |
| **Evolutivos CFC** | Fases 5 y 6 (2026) | Hilos Gmail "Evolutivos CFC Fase 6" (jul 2026), "2601-040 Evoluciones CFC (v.5)" (may 2026); contrato `2024/20240423 - Alcampo - CFC` |
| **Interfaces Aida** | Continuidad S50+ (224 h Daniel + 32 h Julio) | Hilo Gmail "[ServerStartup] Propuesta Interfaces Aida" (2026-07-07) |
| **Tickets Gas Tiempo Real** | + Devoluciones + Suscripciones + integración Smart | Hilo Gmail 2026-07-02 (contacto: Iván Fernández, Emilio Rocafort) |
| **Brand Portal** | Frontend React + BFF Java (delivery con Luis Villa) | Repos brand-portal en auchan-retail-spain; hilo "Continuidad Brand Portal" |
| **GCP platform admin** | IAM, Terraform, inventarios BigQuery, informes de coste, seguridad/compliance, bolsa de horas | Deck corporativo; `es-ares-data-terraform-*`, `es-ares-ecom-terraform-*`; [business-profile.txt](../../reference/legacy/docs/business-profile.txt) |
| **API Management (Gravitee)** | Informe de actividad de administración de APIs | Drive fileId `1M51XsAdJxoK-3aLYOKitiu5hhwuSuJGR_hS1i6ipleg` (2024) |
| **PoC Synapse Migration** | Migración documentada (2026) | [es-ares-yoda-doc-synapse-migration](https://github.com/auchan-retail-spain/es-ares-yoda-doc-synapse-migration) (30/30 commits Julio); facturación jul 2026 (EP7490962) |
| **Legacy NPECOM** | Plataforma e-commerce anterior (hybris, Liferay, WSO2, CIAM); assessment migración hybris 20.11 y aseguramiento de calidad (2020, era IECISA) | Repos `es-npecom-*` en auchan-retail-spain; Dropbox `Contratos/2020/(A32198)…`, `(A32201)…`; carpeta `Projects/NPECOM Soporte` |

Contactos habituales (Gmail): Iván Fernández, Isabel Gallardo, Javier Aransay,
Emilio Rocafort, M.ª Pilar Racionero, Blanca López (secretaría Sistemas).

Testimonio de cliente (deck 2025, slide DAFO — anonimizado allí):
> "A mí me aporta muchísimo valor poder delegar algo (E2E) sabiendo que se va a
> hacer bien, sin tener que hacer apenas management. Confianza en soluciones
> robustas, escalables y que no van a salir más caras que haciéndolas con otro
> proveedor."

## Cartera Cloudflare (partner desde 2019, acuerdo renovado 2026-04-30)

| Cliente | Periodo | Alcance | Evidencia |
| ------- | ------- | ------- | --------- |
| **Forum Sport** | 2018 → activo | Implantación, optimización, DPC con Workers (2018), WAF (2022), renovaciones 2023/2024/2025 | Deck Cloudflare; Dropbox `Contratos/2022-2025/…Forum Sport…`; repo [fs-workers](https://github.com/julioarguello/fs-workers); propuesta Drive `1D7UIvTEOh4jITCTRsExVLhEbptO3zjf_lU3PEipgEUg`; alertas activas Gmail |
| **Dooers Sneakers** | 2019 → activo | Implantación y mantenimiento, optimización | Deck Cloudflare; alertas de tráfico Gmail 2026; cert en `Projects/Forum/` |
| **Alcampo.es** | 2020 → | Migración desde Akamai, optimización, WAF, Bot Manager | Deck Cloudflare |
| **Toys"R"Us Iberia** | 2023 → activo | Suscripción Enterprise + asesoría (es/pt); migración Akamai→Cloudflare; análisis de caching HTML sobre SAP Commerce Cloud (2026) | Propuesta v1→v5 en Drive (v5: `1iubDSspL44zXaw7-deu-yXIpHbs3dlRDaXQ_YdVeM-w`); contratos anuales 2023/2024/2025/2026 en Dropbox; repo [toysrus-caching-analysis](https://github.com/julioarguello/toysrus-caching-analysis); alertas activas es/pt |
| **Eroski** (grupo de Forum Sport) | activo | Reporte diario WAF (Splunk) junto al SOC innotec.security | Gmail "[EROSKI] Reporte WAF Cloudflare" (diario) |
| **Punt Roma** | 2020 → activo | Deck CDN (2020), plan Business (2024), asesoría DNS/certificados (2026) | `Projects/PuntRoma/20201006 - PuntRoma - CDN.pptx`; propuesta Drive `1nlRtaK64zX-T0_axcT4kiwuEy4f7J3msY2Ada1tL9Bo`; contrato `2024/20241024`; hilo GlobalSign/ilurogest 2026 |
| **Carolina Herrera** | ~2021 | SPA middleware con Workers, video streaming | Deck Cloudflare |
| **Job&Talent** | 2022 | >40 servicios sobre AWS/S3, seguridad, Terraform, Stream | Deck; Dropbox `Contratos/2022/20220302`, `20221128 - JT - Stream`; repo [jobandtalent.com](https://github.com/julioarguello/jobandtalent.com) (Terraform); vía V-Valley |
| **Marathon** | 2021 | Load balancing, DPC con Workers; estrategia de desarrollo y entornos | Deck; `Projects/Marathon/` |
| **Bihr (MyBihr)** | 2019–2021 | Optimización, WAF (+ gran proyecto SAP Commerce, ver abajo) | Deck; `Projects/Bihr/` |
| **Batz** | 2022 | Contrato Cloudflare | `Contratos/2022/20221121 - Cloudflare - Batz` |
| **WoW** | 2022–2023 | Propuesta + análisis de caché (vía V-Valley) | `Projects/WoW/` + propuesta Drive `1O0B7qxG0yU6Qja3ebwL2vUoQnEO4PoDdk1jrZETNGQM` |
| **Eurofred** | 2022 | Presentación Cloudflare | `Projects/Eurofred/20221005 - Eurofred Cloudflare.pptx` |
| **Tous** | 2024 | Propuesta eCDN (deck + feature list) | `Projects/Tous/20240718-Tous-CDN.*` |
| **Fagor Arrasate** | 2022 | Deck intro Cloudflare | Drive `1FQBOwn2qgedfsurWKDuuqddy51mMCNML_FiAOhyw1Dg` |
| **Unode50** | s/f | Análisis de dominios | `Projects/Unode50/` |

## Consultoría SAP Commerce / e-commerce (más allá de Alcampo)

| Cliente | Proyecto | Evidencia |
| ------- | -------- | --------- |
| **Bihr** (distribuidor motociclismo, con Seidor) | SAP Commerce multi-país/multi-canal: modelo de promociones, workshops MDM, kits, requisitos VSE (FR/ES), sizing de caché | `Projects/Bihr/` (Seidor BIHR_Commerce v1.1, SAP Commerce - BIHR Promotions, Workshop_MDM…) |
| **Logista Estanqueros** | Interfaces SAP Commerce Cloud ↔ S/4HANA, estimaciones de pricing y Solr, mapping TPVs España | `Projects/Logista Estanqueros/` (2023–2024) |
| **Shufersal** (retail, Israel) | Pricing en SAP Commerce; visita/taller Valencia 2023 | `Projects/Shufersal/` (20230418 - Valencia.md, Pricing/) |
| **Actiu** | Análisis yLogger (2021) | `Projects/Actiu/` |
| **Adi** | Performance de catálogos (2024) | `Projects/Adi/20240426 - Catalogos performance` |
| **Osborne** | Análisis de pricing (2021) | `Projects/Osborne/Análisis/20210519 - Pricing.pptx` |
| **Samsung** | "Samsung Hyperscale" (2020) | `Projects/Samsung/20200415_SamsungHyperscale.pptx` |
| **Conforama / CommerceTools / CTIC / Cadarso / Frigicoll / IHOBE** | Carpetas de proyecto/prospección (Frigicoll: diagrama de integración; IHOBE: alcance) | `Projects/<cliente>/` |
| **Koopman / Yacht** | Trabajos de la etapa freelance (2017–2018) | `Documentación/Freelance/` |

## Investigación de mercado propia

`Projects/eCommerce/` guarda los informes con los que se fundamenta la consultoría
de plataforma: Gartner (2020 Q2), Forrester Wave B2B/B2C Commerce Suites (2020 Q2),
IDC MarketScape B2B Digital Commerce (2020 Q3), observatorio KM de plataformas.
