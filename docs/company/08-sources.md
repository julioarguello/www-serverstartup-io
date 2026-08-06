# Registro de fuentes

> Cómo se construyó esta base (2026-08-02) y cómo ampliar cada dato.

## 1. Registro Mercantil y documentos societarios (Dropbox)

Raíz: `~/Library/CloudStorage/Dropbox/Documents/Profesional/` (symlink `~/Dropbox`).

| Documento | Ruta |
| --------- | ---- |
| Nota de inscripción RM Bizkaia (leída/verificada) | `Documentación/ServerStartup/Misc/20190124 - Registro Mercantil.jpg` |
| Acta Junta General 2020 (socios 50/50; extraída con `textutil`) | `…/Misc/20200720 - ACTA JUNTA SERVER.docx` (+ .pdf) |
| Denominación social / capital / CIF / escritura | `…/Misc/20181219…`, `20181221…`, `20190211…`, `20190215…` |
| Contratos por año (2017–2026) | `Documents/Profesional/Contratos/<año>/` |
| Proyectos y prospección por cliente | `~/Library/CloudStorage/Dropbox/Projects/<cliente>/` |
| Imputaciones (Seidor 2017-25, IECISA 2020-24, SM 2017-19, ServerStartup 2024-26) | `Documents/Profesional/Imputaciones/` |
| Marketing (camisetas 2024), logo | `Documents/Profesional/Marketing/`, `…/Documentación/ServerStartup/Logo/` |

Nota: los PDF locales no se pudieron renderizar (falta `poppler`); los .docx se
extraen con `textutil -convert txt -stdout <file>` (macOS). `brew install poppler`
habilitaría la lectura de PDF.

## 2. Google Drive (MCP conectado)

Abrir como `https://docs.google.com/presentation/d/<fileId>` (decks) o `/document/`.

| Documento | fileId |
| --------- | ------ |
| Deck corporativo 2025-11-24 (36 slides — la fuente de posicionamiento más rica) | `1g79lVqS1VTwrdzCuHBY71YPEqTeZ1yPWaZFKcmLG7L4` |
| Deck partner "Server Startup - Cloudflare" (track record 2018-2022) | `1D86wjgUsRWKDlMuIZw4p9Smik7GvfXfkIW6EdBiLiCc` |
| Variantes JT / Fagor Arrasate | `1vFMOGVmKS65jbj-nMuEAN-Fv7jcmvnbE9wBVHgkMLEY` / `1FQBOwn2qgedfsurWKDuuqddy51mMCNML_FiAOhyw1Dg` |
| Propuesta Toys"R"Us v5 (plantilla comercial Enterprise) | `1iubDSspL44zXaw7-deu-yXIpHbs3dlRDaXQ_YdVeM-w` |
| Propuesta Punt Roma (Business, 2024) | `1nlRtaK64zX-T0_axcT4kiwuEy4f7J3msY2Ada1tL9Bo` |
| Propuestas Forum Sport / JT / WoW | `1D7UIvTEOh4jITCTRsExVLhEbptO3zjf_lU3PEipgEUg` / `1uZYKhF7KqK4RdZn5C-sq1WVWMuHVa5rRt8nbsNIeAOE` / `1O0B7qxG0yU6Qja3ebwL2vUoQnEO4PoDdk1jrZETNGQM` |
| Informe actividad API mgmt (Gravitee/Alcampo, 2024) | `1M51xSAdJxoK-3aLYOKitiu5hhwuSuJGR_hS1i6ipleg` — ver nota⁽¹⁾ |

⁽¹⁾ Si el enlace falla, buscar "Server Startup" en Drive: el listado completo (20
ficheros) se obtuvo con la query `fullText contains 'Server Startup'`.

## 3. Gmail (MCP conectado) — hilos clave

Buscar por asunto en https://mail.google.com/ :

- Propuestas Alcampo: "[ServerStartup] Propuesta Consolidación y Resiliencia Datos
  de Ventas", "…Propuesta Interfaces Aida", "…Propuesta Tickets Gas Tiempo Real",
  "Pedido Server Startup - Evolutivos CFC Fase 6", "Facturación Server Startup S.L [Julio 2026]".
- Equipo: "Facturas 06/26" (Daniel Sío), "Facturas Junio" (Nacho), "Ibaseta
  junio-julio", "Rechazo contrato" + "Continuidad Brand Portal" (Luis Villa).
- Operativa Cloudflare: alertas diarias toysrus.es/pt, forumsport.com,
  dooerssneakers.com; "[EROSKI] Reporte WAF Cloudflare"; hilo GlobalSign/Punt Roma.
- Societario: "IMPUESTO SOCIEDADES Y FIRMA DE ACTAS", "Información Fiscal Q2
  Server Startup" (Asesoría Proyecta); pedidos Ariba "AUCHAN HOLDING…".
- Patrocinio: "Cto cad provincial-Server", "Contrato patrocinio".

## 4. GitHub

- Orgs cliente: https://github.com/auchan-retail-spain ·
  https://github.com/auchan-retail-international (barrido de autores 2026-08-02,
  metodología en [05-tech-specialties.md](05-tech-specialties.md)).
- Personal: https://github.com/julioarguello (50 repos listados).
- Logins del equipo: `julioarguello`, `iibaseta`, `dsiorajo`.
- Inventario GitHub↔Alcampo mantenido a mano: Dropbox
  `Projects/20260310 - github - alcampo.xlsx`.

## 5. Repo web y legado (este repositorio)

- Skill de voz recuperado: [annex/doc-copywriter-SKILL.md](annex/doc-copywriter-SKILL.md).
  Original borrado del submódulo `.agent` en `430a923`; recuperación:
  `git -C .agent show 430a923^:skills/doc-copywriter/SKILL.md`.
- Voz/estrategia legada: `reference/legacy/agent/` y `reference/legacy/docs/`
  (ai-manifesto.txt, business-profile.txt, boutique-consulting.txt, history.md, logo.md).
- Copys canónicos pre-CMS: `reference/legacy/pages/serverstartup/*.md`.
- Contenido vivo: `seed/seed.json` (pages/widgets) + `seed/content/services/{es,en}/*.md`.
- Issues de reescritura: [#141](https://github.com/julioarguello/www-serverstartup-io/issues/141)
  (paraguas) y #142–#153.

## 6. Huecos conocidos `[PENDIENTE]`

- Leer la escritura de constitución completa (capital exacto, objeto social) —
  requiere poppler o abrir los PNG de `Misc/`.
- Localizar el `Pricing.pptx` cuyo lockfile está en la raíz de Dropbox.
- Confirmar el papel exacto de "SM" en Imputaciones 2017-2019.
- Decidir si el testimonio del deck 2025 puede usarse con atribución.
- Sitio antiguo/copies previos: repo privado `julioarguello/serverstartup.io`
  ("Web copies") y clon local `/Users/julioarguello/opt/serverstartup.io`.
