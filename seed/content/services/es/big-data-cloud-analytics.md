---
cta_label: "Hablemos de tus datos"
excerpt: "En proyectos con más de cien modelos `dbt` en `BigQuery`, los tests pasan del millar. Si un dato no los pasa, no llega a la capa *gold*. Arquitectura [*medallion*](https://dataengineering.wiki/Concepts/Medallion+Architecture), de la ingesta al cuadro de mando."
---

> «Los modelos de datos evolucionan más despacio que el código, y el daño de un mal modelo es sigiloso. No sabrás que estás en peligro hasta que sea demasiado tarde. Así que tómate el tiempo de hacer las cosas bien. Ve despacio para ir más rápido y más seguro a largo plazo.» [Joe Reis](https://practicaldatamodeling.substack.com/p/we-dont-have-time-for-data-modeling)

Una plataforma de datos tiene que aguantar años de negocio, cambios de esquema y picos de campaña.

Nosotros la construimos como se construye el [software serio](/desarrollo-greenfield). Cada transformación versionada en `git`, cada dato con su test, cada flujo con su alerta.

Nuestro fuerte es lo analítico, y usamos [`dbt`](https://www.getdbt.com/) a los dos lados: en el *warehouse* y en la base operacional.

## dbt ≠ pipeline

`dbt` es la T del [`ELT`](https://www.getdbt.com/blog/extract-load-transform) y lo tratamos como se trata el buen software, el patrón que el sector llama [*analytics engineering*](https://www.getdbt.com/what-is-analytics-engineering). Pero la herramienta es solo una pieza: la ingesta, la orquestación y la vigilancia van aparte, y nuestro valor está en montar y operar el conjunto completo.

- **Donde más hemos profundizado**. En la nube de Google, [`BigQuery`](https://cloud.google.com/bigquery) como *warehouse* y `dbt` en las transformaciones.
- **De la pizarra a la publicación**. Lo que damos por terminado (nuestra [*definition of done*](https://scrumguides.org/scrum-guide.html#commitment-definition-of-done)) se decide mucho antes del código, al diseñar la base de datos con el [modelado clásico del sector](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/), nomenclatura estándar, homogeneización y normalización del dato. Es más análisis que desarrollo, y es donde se gana la fiabilidad.
- **El testeo es la parte que casi todo el mundo se salta**. En los proyectos grandes, los tests se cuentan por miles. *Unit tests* que corren antes de publicar y *data tests* que se ejecutan cada día, con cada carga.
- **Arquitectura por capas**. El patrón [*medallion*](https://dataengineering.wiki/Concepts/Medallion+Architecture) separa el dato crudo del verificado, cada capa con su propósito y su control de acceso.
- **La infraestructura también es código**. [`Terraform`](https://www.terraform.io/) levanta los mismos *datasets*, permisos y entornos en desarrollo y en producción.
- **Tiempo real cuando el negocio lo pide**. Ingesta con [`Pub/Sub`](https://cloud.google.com/pubsub) y [`Dataflow`](https://cloud.google.com/dataflow) para los flujos que no pueden esperar a la carga nocturna.

## dbt en BigQuery y en Oracle

En lo analítico trabajamos con [`dbt Cloud`](https://docs.getdbt.com/docs/platform/about-platform/dbt-platform-features) sobre `BigQuery`. Y cuando la transformación nace en la capa operacional, sobre una base relacional como `Oracle`, la gestionamos con [`dbt Core`](https://github.com/dbt-labs/dbt-core) y el [adaptador que mantiene Oracle](https://github.com/oracle/dbt-oracle), con mejoras nuestras.

Los mismos tests y el mismo versionado a los dos lados, sin peajes entre equipos. Al cuadro de mando, el dato llega ya probado.

Conectamos `BigQuery` con [tu tienda online](/comercio-electronico), con tu [ERP](/integracion-de-sistemas) y con el [*edge*](/cdn-waf-seguridad-edge-cloudflare).
