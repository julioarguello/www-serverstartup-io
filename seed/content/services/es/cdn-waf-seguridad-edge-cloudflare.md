---
cta_label: "Revisemos tu Cloudflare"
excerpt: "Server Startup es socio oficial de [`Cloudflare`](https://www.cloudflare.com/es-es/) desde 2019. Auditoría, migración y operación de `CDN`, `WAF` y control de bots, sobre todo para cadenas de distribución y [comercio electrónico](/comercio-electronico)."
---

> «Imaginemos que la red de una organización es un castillo, y el perímetro de red un foso. Una vez que se baja el puente levadizo y alguien lo cruza, puede moverse con libertad por el interior del castillo.» [Cloudflare](https://www.cloudflare.com/es-es/learning/access-management/castle-and-moat-network-security/)

Trabajamos con la plataforma de [`Cloudflare`](https://www.cloudflare.com/es-es/) desde 2017, dos años antes de que Server Startup se hiciera socio oficial. Auditamos, migramos y optimizamos cuentas [Enterprise](https://www.cloudflare.com/es-es/plans/enterprise/) y [Business](https://www.cloudflare.com/es-es/plans/business/).

`Cloudflare` está configurado. ¿Seguro de que está bien configurado? En muchas organizaciones nadie se atreve a tocar las reglas del `WAF`. Bloquean algo, seguro. Nadie recuerda qué.

Nosotros sabemos por qué está cada una, porque las escribimos, las versionamos con [`Terraform`](https://developer.hashicorp.com/terraform) y las mantenemos en producción.

## WAF ≠ seguridad

Un *firewall* es una parte de la seguridad. La otra es saber quién cambió cada regla y qué ha parado hoy. Configuramos `Cloudflare` como arquitectura, con cada interruptor de este panel en `Terraform`.

- **Reglas `WAF` escritas para tu negocio.** Las reglas gestionadas de `Cloudflare` como base, afinadas para tu superficie de ataque real, y encima las de tu negocio. OWASP Top 10, DDoS, bots.
- **Caché y `CDN`.** La caché absorbe el tráfico antes de que llegue a tu origen, y los tiempos de respuesta se vuelven predecibles. También en la campaña de noviembre.
- **Migraciones sin corte.** Desde Akamai o la `CDN` que toque, sin parar la tienda.
- **Todo en `Terraform`.** La configuración entera como código, versionada y revisada. Nada depende de la memoria de nadie.
- **Lógica junto al usuario.** `Workers`: los primeros los pusimos en producción en 2018, y esta web corre entera sobre ellos.
- **Informe diario del WAF.** Cada día te llega un informe: qué ha parado el `WAF` y qué regla ha saltado. Y las alertas de tráfico, seguridad y salud del origen las atendemos nosotros.

## Quien lo configura, lo mantiene

Después de montar `Cloudflare`, lo seguimos llevando: vigilamos el tráfico, ajustamos las reglas cuando cambian los patrones de ataque y respondemos cuando algo se degrada. Si una regla frena tráfico legítimo, la revertimos desde su historial en `Terraform`.

Hemos montado `Cloudflare` para:

> b64:QWxjYW1wbywgRG9vZXJzIFNuZWFrZXJzLCBGb3J1bSBTcG9ydCwgSm9iJlRhbGVudCwgUHVudCBSb21hLCBUb3lz4oCcUuKAnVVzLA==

La plataforma no se acaba en la `CDN` y el `WAF`. `Zero Trust`, `Access` o `Stream` pueden venir después; te ayudamos a decidir qué piezas encajan y cuáles no.

Esta misma web corre sobre `Workers`, `D1` y `R2`. La desmontamos pieza a pieza en [Deconstruyendo esta web](/deconstruyendo).
