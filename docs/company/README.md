# Base de conocimiento corporativo — Server Startup S.L.

> Base de datos documental sobre la empresa: identidad, equipo, clientes, servicios,
> especialidades técnicas y voz de marca. Construida el **2026-08-02** a partir de
> fuentes primarias (Registro Mercantil, Dropbox, Gmail, Google Drive, GitHub) para
> alimentar la reescritura de copies de serverstartup.io (issues
> [#141](https://github.com/julioarguello/www-serverstartup-io/issues/141)–#153)
> y cualquier trabajo futuro que necesite contexto de empresa.

## Índice

| Documento                                                          | Contenido                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [01-identity.md](01-identity.md)                                   | Identidad legal, cronología fundacional, marca, nombre, logo, paleta          |
| [02-team.md](02-team.md)                                           | Socios, equipo técnico, colaboradores, red externa                            |
| [03-clients-track-record.md](03-clients-track-record.md)           | Mapa de clientes y proyectos con evidencia, 2017 → 2026                       |
| [04-services-business-model.md](04-services-business-model.md)     | Líneas de negocio, modelos de precio, partnerships                            |
| [05-tech-specialties.md](05-tech-specialties.md)                   | Especialidades técnicas demostradas por commits en GitHub                     |
| [06-voice-positioning.md](06-voice-positioning.md)                 | Posicionamiento boutique, perfil de voz, frases canónicas                     |
| [07-web-benchmark.md](07-web-benchmark.md)                         | Benchmark de webs boutique minimalistas (investigación 2026-08-02)            |
| [08-sources.md](08-sources.md)                                     | Registro completo de fuentes y cómo ampliar cada dato                         |
| [09-target-reader.md](09-target-reader.md)                         | El lector objetivo: arquitecto retail tipo Ahorra Más (estate verificado)     |
| [annex/doc-copywriter-SKILL.md](annex/doc-copywriter-SKILL.md)     | Copia recuperada del skill `doc-copywriter` (borrado del submódulo `.agent`)  |

## Convenciones

- **Cada hecho lleva fuente.** Los datos sin fuente explícita heredan la del bloque.
  El detalle de recuperación está en [08-sources.md](08-sources.md).
- **Grados de certeza:** sin marca = verificado en documento primario;
  `[INFERIDO]` = deducido de evidencia indirecta (se explica de cuál);
  `[PENDIENTE]` = hueco conocido que merece verificación.
- **Fechas absolutas** siempre (`2026-08-02`, no "hoy").
- **Datos excluidos deliberadamente** aunque el repo sea privado: DNI, IBAN,
  importes fiscales, salarios y cualquier dato personal sin relevancia de negocio.

## Cómo mantenerla

1. Al aprender un hecho nuevo de empresa, añadirlo al documento temático que toque
   **con su fuente** y fecha.
2. Si un hecho cambia (cliente nuevo, alta/baja de equipo), no borrar el anterior:
   marcarlo como histórico. La cronología es parte del valor.
3. Los enlaces a Drive usan el `fileId` (estables); los de Dropbox son rutas locales
   de la máquina de Julio; los de GitHub son URL canónicas.
