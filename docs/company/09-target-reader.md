# El lector objetivo (persona)

> Definido por Julio (2026-08-03): *"Mi target es un arquitecto del software
> experimentado, que ha instaurado todo lo que tiene Ahorra Más ahora."*
> Investigación de campo: 2026-08-04. Normativo para todo el copy: skill
> `doc-copywriter` §7 (la copia congelada vive en
> [annex/doc-copywriter-SKILL.md](annex/doc-copywriter-SKILL.md)).

## El arquetipo

Arquitecto/a de software con 15–25 años de producción a las espaldas, en un
retailer español de tamaño medio. Montó personalmente el estate que hoy opera
una cadena como Ahorra Más, pueblo a pueblo. No es un CIO de despacho: revisa
PRs, entra a la consola de Cloudflare, recuerda por qué cada regla del WAF está
ahí (o le duele no recordarlo).

## El estate de referencia: Ahorra Más (verificado)

| Dato | Valor | Fuente |
| ---- | ----- | ------ |
| Empresa | Cadena de proximidad, +40 años, ~275 tiendas en Madrid y Castilla-La Mancha, ~12.000 empleados | [ecommerce-news.es](https://ecommerce-news.es/ahorramas-amplia-su-ecommerce-a-cuatro-localidades-madrilenas/), [Alimarket](https://www.alimarket.es/alimentacion/noticia/322654/ahorramas-acelera-la-digitalizacion-de-sus-supermercados) |
| Storefront | **Salesforce Commerce Cloud (Demandware)**: 318 referencias `demandware` en el HTML, cookie `dwanonymous_*`, cabecera `x-dw-request-base-id` | Fingerprint propio con `curl` (2026-08-04) |
| Edge | **Cloudflare** (`server: cloudflare`, `cf-cache-status`) | Ídem |
| Retail media | Citrus Ads (`citrusConversionValue`) | Ídem |
| E-commerce | Despliegue gradual por localidades: Alcalá, Getafe, Las Rozas, Alcobendas, S.S. de los Reyes, Torrejón | ecommerce-news.es |
| Resto del estate (inferido del sector) | ERP, TPVs de tienda, motor de promociones, logística/almacén, plataforma de datos en construcción | Prensa sectorial |

Lectura clave: **el estate del lector es literalmente el terreno de Server
Startup** (plataforma de e-commerce + Cloudflare delante + integraciones tienda/
almacén + dato). No hay que explicarle su trabajo; hay que demostrarle en dos
frases que lo hemos vivido.

## Su semana (los dolores)

La promoción que llegó a la web pero no al TPV. El stock que nunca cuadra del
todo entre tienda, almacén y online. La pregunta de capacidad antes del pico de
campaña. La reunión donde un proveedor dijo "fase de assessment". El junior que
le rotaron a la cuenta sin preguntar.

## Sus alternativas reales (Dunford)

No son nuestros competidores: son **"lo hacemos en casa"** o **"no hacemos
nada"**. Cada página debe responder en voz baja al *por qué no in-house*:
profundidad senior bajo demanda, sin plantilla, de gente que ha operado el mismo
estate y da la cara personalmente.

## Disparadores

**De confianza**: herramientas con nombre y versión, números no redondos,
límites admitidos, prosa que carga la información en las dos primeras palabras
(patrón F de Nielsen), afirmaciones comprobables.

**De cierre de pestaña**: "soluciones integrales", metodologías con ™,
*benefit-speak* que le explica su propio trabajo, cualquier frase que un colega
no diría en voz alta.

## Frases que este lector dice en un café

- "El dato de stock no cuadra y nadie sabe dónde se pierde."
- "Otro partner que me manda un junior a aprender con mi presupuesto."
- "El WAF lo configuró alguien que ya no está en la empresa."
- "Me sobran licencias y me faltan manos."

## Implicaciones de redacción (resumen operativo)

1. Test de la reunión: cada frase, dicha tal cual a esta persona, sin sonrojo.
2. Un dato falsificable por sección; un detalle de retail vivido por página.
3. Responder "por qué no lo hago con mi equipo", nunca "por qué no Accenture".
4. Cero em-dashes ES, máximo un "X: Y" por página, ritmo variado (ver skill §8).
5. La anonimización de clientes ([03-clients-track-record.md](03-clients-track-record.md))
   juega a favor: "una cadena de ~275 tiendas" le suena a su propia casa.
