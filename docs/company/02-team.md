# Equipo y red

## Socios (capital social)

| Socio                              | Participación | Rol                                        |
| ---------------------------------- | ------------- | ------------------------------------------ |
| Julio Alberto Argüello Fernández   | 50 %          | Presidente / Director Técnico / delivery   |
| Begoña Isla Garitacelaya           | 50 %          | Socia (secretaria de la Junta)             |

Fuente: Acta de Junta General Universal 01/06/2020 (Dropbox
`Documents/Profesional/Documentación/ServerStartup/Misc/20200720 - ACTA JUNTA SERVER.pdf`).

## Equipo técnico (agosto 2026)

El equipo de delivery son **tres ingenieros senior**. Los perfiles de facturación a
cliente son "SWA" (Software Architect) y "SA" (Solution Architect); el balance 2025
en Alcampo fue "440 jornadas SWA (2 personas), 180 jornadas SA" (deck corporativo 2025).

### Julio Argüello — fundador, Director Técnico
- GitHub: [julioarguello](https://github.com/julioarguello) · julio.arguello@serverstartup.io · +34 665 85 95 10 (firma de email).
- Dominio por evidencia de commits: integración (plataforma JAWA/Camel), middleware
  Ocado OSP, dbt, Smart V2, Cloudflare Workers, documentación técnica de arquitectura.
  Detalle en [05-tech-specialties.md](05-tech-specialties.md).
- Trayectoria previa: freelance desde 2017 (Seidor, SM, IECISA); trinchera
  hybris/SAP Commerce desde mucho antes (~15 años de experiencia).

### Ignacio "Nacho" Ibaseta Canga
- GitHub: [iibaseta](https://github.com/iibaseta) · iicanga@gmail.com / iicangat@gmail.com · i.ibaseta@partner.alcampo.es.
- Dominio por commits: **Terraform/GCP IaC y plataforma de datos** —
  `es-ares-ecom-terraform-osp-api` (autor dominante), `es-ares-data-terraform-sales`,
  `es-ares-ecom-gcf-data-pipeline`. También proyecto "Consolidación y Resiliencia
  Datos de Ventas" (hilo Gmail jul 2026).
- Relación: colaborador autónomo que factura mensualmente a Server Startup
  (hilos Gmail "Facturas Junio", "Ibaseta junio-julio").

### Daniel Sío Rajo
- GitHub: [dsiorajo](https://github.com/dsiorajo) · danielsiorajo@gmail.com · d.sio@partner.alcampo.es.
- Dominio por commits: **operativa e-commerce Ocado y evolutivos Smart** —
  `es-ares-ecom-postman-frescos-corte`, contribuciones en `es-ares-data-dbt-retail`.
  Por pedidos/propuestas: Evolutivos CFC (fases 5-6), Interfaces Aida (224 h),
  Evo Smart V2 [DIG].
- Relación: colaborador autónomo con facturación mensual (hilo "Facturas 06/26").

## Colaboradores puntuales y pasados

- **Luis Villa** (luis.vi.fer@gmail.com; GitHub "Luis Villa"/"thirdBlackCrow") —
  desarrolló el **Brand Portal** de Alcampo (frontend React + BFF Java:
  [es-ares-data-react-brand-portal-frontend](https://github.com/auchan-retail-spain/es-ares-data-react-brand-portal-frontend),
  [es-ares-data-java-brand-portal-bff](https://github.com/auchan-retail-spain/es-ares-data-java-brand-portal-bff)).
  Rechazó el contrato de continuidad el 2026-07-29 (hilo "Rechazo contrato");
  la entrega/continuidad se gestionó en el hilo "Continuidad Brand Portal".
- **Rosselyne López** — empleada en nómina hasta su finiquito (2023-02-23,
  Dropbox `Contratos/2023/20230223 - Finiquito Rosselyne`; carpeta `Nóminas/Rosselyne López`).
- El deck 2025 recoge la intención de un posible **4º perfil senior (Software
  Architect)**: "Sólo incorporamos perfiles senior y de confianza".

## Red externa estable

| Entidad                  | Papel                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| Grupo Seidor             | Partner comercial histórico (las propuestas Cloudflare se presentan "como empresa colaboradora del Grupo Seidor"); imputaciones desde 2017; contrato 2024-01-02 |
| INETUM                   | Acuerdo marco (2023-02-18) + homologaciones/renovaciones 2022–2024      |
| V-Valley                 | Distribuidor para operaciones Cloudflare (Job&Talent 2022, WoW 2022)    |
| Asesoría Proyecta        | Fiscal/contable (pveiga@, isaez@asesoriaproyecta.com)                   |
| Anfix                    | Plataforma contable (buzón `B95944807@recibidas.anfix.com`)             |
| Barrilero (y Asociados)  | Certificados/gestiones legales (hilo "Información Fiscal Q2")           |
| Bankinter / Santander    | Banca (cuentas 2024); agente grandes patrimonios en Bankinter           |
| innotec.security         | Co-destinatarios de los reportes WAF de Eroski (SOC del cliente)        |

## ⚠️ Discrepancia con la web actual

La colección `members` del CMS ([seed/seed.json](../../seed/seed.json)) lista:
`julio-arguello` (Fundador & Lead Architect), `ariadna` (Backend Engineer),
`raul` (Data Engineer), `daniel` (Cloud & DevOps Engineer). **No coincide con el
equipo real** (Julio, Nacho Ibaseta, Daniel Sío): "ariadna" y "raul" no aparecen en
ninguna fuente primaria (ni Gmail, ni Dropbox, ni GitHub), y el rol de Daniel en la
web ("Cloud & DevOps") tampoco refleja su trabajo real (integración/e-commerce/datos).
A resolver antes o durante la reescritura de "Quiénes somos" (issue
[#143](https://github.com/julioarguello/www-serverstartup-io/issues/143)): o son
seudónimos deliberados o es contenido placeholder heredado.
