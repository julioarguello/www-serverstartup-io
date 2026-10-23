# Guía de Migración — ServerStartup WordPress → Astro/EmDash

> **Registro histórico.** Describe el Kit de Elementor tal como estaba al
> migrar. La tabla de tokens de más abajo incluye las cinco pastel
> `--color-card-*`, que se borraron en #457: nada las consumía y nunca
> estuvieron en el CMS — los seis colores de vertical viven en el campo `color`
> de `seed/seed.json`. El estado actual está en
> [design-system.md](design-system.md).

## Arquitectura

| Componente | WordPress (actual) | Astro/EmDash (nuevo) |
|------------|-------------------|---------------------|
| Frontend | Elementor + PHP | Astro components (SSR) |
| CMS | WordPress | EmDash (admin en `/_emdash/admin`) |
| Base de datos | MySQL (hosting) | **D1** (Cloudflare edge SQL) |
| Almacenamiento | wp-content/uploads | **R2** (Cloudflare object storage) |
| Hosting | WordPress hosting | **Cloudflare Workers** |

## Design System (extraído del Elementor Kit)

**IMPORTANTE**: El sitio original es de tema **CLARO** (blanco), no oscuro.

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#1E1E1E` | Texto, fondos oscuros (CTA, header móvil) |
| `--color-secondary` | `#FFFFFF` | Blanco |
| `--color-card-blue` | `#B5E6F7` | Tarjeta Comercio electrónico |
| `--color-card-yellow` | `#FDEBB6` | Tarjeta CDN/WAF |
| `--color-card-teal` | `#BFEDEE` | Tarjeta Big Data |
| `--color-card-pink` | `#ECDCE3` | Tarjeta Integración |
| `--color-card-green` | `#C5EFCD` | Tarjeta Backend |
| `--color-marked` | `rgba(206,212,218,0.5)` | Texto destacado |

**Tipografía**: Alexandria (Google Fonts), body 20px/26px wt300, subtitles 24px/32px wt400, headings wt600.

## Flujo de contenido

```
seed.json (schema + contenido)
    ↓  npm run dev (astro dev; EmDash crea el esquema en la primera petición)
    ↓  o setup wizard (primera vez)
D1 (Wrangler emulator en local, Cloudflare D1 en producción)
    ↓  getEmDashCollection / getEmDashEntry
Astro pages (SSR en cada request)
```

## Cómo funciona la persistencia

### Local (desarrollo)
- El dev server usa el **emulador D1 de Wrangler** (en `.wrangler/state/`)
- Los datos son **efímeros** — si borras `.wrangler/state/`, se pierden
- Al arrancar por primera vez, aparece el **setup wizard** en `/_emdash/admin`
- Las rutas del wizard responden **404** salvo que la petición presente el secreto del entorno, `SETUP_GATE_TOKEN` (#610). En local: ponlo en `.dev.vars` (ignorado por git), reinicia el servidor y abre `/_emdash/admin/setup?setup_token=<valor>`. `auth/dev-bypass` crea un administrador de desarrollo para sesiones de API por script, pero no completa el alta: el panel de una base nueva sigue necesitando el token
- En el wizard: selecciona **"Apply seed with content"** para cargar el contenido del `seed.json`
- Todo el contenido real está definido en `seed/seed.json` (versionado en Git)

### Producción (Cloudflare)
- D1 real + R2 real → datos **persistentes**
- El contenido se importa una sola vez via:
  1. Setup wizard al desplegar por primera vez, con el secreto `SETUP_GATE_TOKEN` (ver [Then: claim the CMS administrator](production-cutover.md#then-claim-the-cms-administrator-610))
  2. O vía CLI: `npx emdash content create ...`
- Los cambios de contenido se hacen desde `/_emdash/admin`

## Estructura del seed.json

El `seed.json` define **todo**: schema + contenido inicial.

| Sección | Qué contiene |
|---------|-------------|
| `settings` | Título, tagline del sitio |
| `collections` | `services` (5), `members` (4), `pages`, `posts`, `elementor_library` |
| `menus` | Navegación principal (7 items) |
| `content.services` | 5 páginas de servicio |
| `content.members` | 4 miembros del equipo |
| `content.pages` | Página About |
| `content.posts` | 7 posts de demo (blog starter) |

## Puesta en marcha local

```bash
# 1. Limpiar estado anterior (si existe)
rm -rf .wrangler/state

# 2. Arrancar dev server (creará DB nueva)
npm run dev

# 3. Abrir el setup wizard en el navegador (#610: antes, en .dev.vars,
#    SETUP_GATE_TOKEN=<valor>; sin él, el wizard responde 404)
# → http://localhost:4321/_emdash/admin/setup?setup_token=<valor>
# → Seleccionar "Apply seed with content" 
# → Crear cuenta admin con passkey

# 4. Verificar que las páginas funcionan
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/desarrollo-greenfield
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/quienes-somos
```

## Páginas del sitio

| Ruta | Template | Contenido |
|------|----------|-----------|
| `/` | `src/pages/index.astro` | Homepage (hardcoded) |
| `/desarrollo-greenfield` | `src/pages/[slug].astro` | CMS (services) |
| `/integracion-de-sistemas` | `src/pages/[slug].astro` | CMS (services) |
| `/comercio-electronico` | `src/pages/[slug].astro` | CMS (services) |
| `/big-data-cloud-analytics` | `src/pages/[slug].astro` | CMS (services) |
| `/cdn-waf-seguridad-edge-cloudflare` | `src/pages/[slug].astro` | CMS (services) |
| `/quienes-somos` | `src/pages/quienes-somos.astro` | CMS (members) |
| `/contacto` | `src/pages/contacto.astro` | Hardcoded |
| `/politica-de-privacidad` | `src/pages/politica-de-privacidad.astro` | Hardcoded |

## Despliegue a Cloudflare

```bash
# 1. Crear recursos en Cloudflare (si no existen)
wrangler d1 create www-serverstartup-io
wrangler r2 bucket create www-serverstartup-io

# 2. Actualizar wrangler.jsonc con el database_id real

# 3. Clave que cifra los secretos de los plugins (EmDash 1.x; `emdash auth
#    secret` y EMDASH_AUTH_SECRET eran de la 0.34 y ya no existen)
npx emdash secrets generate
wrangler secret put EMDASH_ENCRYPTION_KEY

# 4. Secreto que abre el setup wizard (#610), uno por entorno. La sesión de
#    wrangler alcanza varias cuentas: sin CLOUDFLARE_ACCOUNT_ID pregunta cuál.
set -a && . ./.env && set +a && export CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID"
TOKEN=$(openssl rand -hex 32) && echo "$TOKEN"   # guárdalo
printf '%s' "$TOKEN" | npx wrangler secret put SETUP_GATE_TOKEN --env production

# 5. Desplegar
npm run deploy

# 6. Completar setup wizard en producción
# → https://www.serverstartup.io/_emdash/admin/setup?setup_token=<valor>
#   (procedimiento completo: production-cutover.md, "Then: claim the CMS administrator")
```

## Comandos útiles

```bash
npm run dev                              # Arrancar dev server (astro dev)
npx emdash seed seed/seed.json --validate # Validar seed
npx emdash types                         # Regenerar tipos TypeScript
npx emdash content list services         # Listar servicios (requiere server corriendo)
npx emdash export-seed --with-content    # Exportar todo como seed
```
