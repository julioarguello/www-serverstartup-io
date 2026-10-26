import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { fonts } from "./src/assets/fonts/families.mjs";

/**
 * #664: the origin the admin is used from, per deployed environment. EmDash
 * takes the passkey's rpId from it. Without it, the rpId was whatever host the
 * request came in on, so the production administrator, claimed on
 * www.serverstartup.dev, held a passkey the browser would not offer on
 * www.serverstartup.io. WebAuthn cannot share one passkey across .dev and .io.
 * Both deploy workflows build with CLOUDFLARE_ENV. Local builds and CI leave
 * it unset and keep deriving the origin from the request, as before.
 * The runtime fallback, EMDASH_SITE_URL, needs the
 * nodejs_compat_populate_process_env flag on Workers
 * (node_modules/emdash/src/api/public-url.ts), so the URL is fixed at build
 * time instead.
 */
const ADMIN_ORIGIN = {
	production: "https://www.serverstartup.io",
	preview: "https://preview.serverstartup.dev",
}[process.env.CLOUDFLARE_ENV ?? ""];

export default defineConfig({
	site: "https://www.serverstartup.io",
	output: "server",
	// #334: one URL per page. Under the default "ignore" both /contacto and
	// /contacto/ answered 200 and each self-canonicalised, so the canonical
	// tag consolidated nothing — and the hreflang pair did not reciprocate
	// across the two forms, which is the variant the sitemap declared.
	trailingSlash: "never",
	// #264: greenfield slug aligned with its title (old URLs are live in prod)
	redirects: {
		"/ingenieria-greenfield-y-sistemas-criticos": { status: 301, destination: "/desarrollo-greenfield" },
		"/en/greenfield-engineering-critical-systems": { status: 301, destination: "/en/greenfield-development" },
		// #329: the plugin used to emit these two; anything that cached them
		// keeps working instead of meeting a 404.
		"/sitemap-index.xml": { status: 301, destination: "/sitemap.xml" },
		"/sitemap-0.xml": { status: 301, destination: "/sitemap.xml" },
	},
	i18n: {
		defaultLocale: "es",
		locales: ["es", "en"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	// #323: one image pipeline, Astro's. `build: "compile"` optimises what the
	// build can see (imports under src/assets) with sharp; `runtime:
	// "cloudflare-binding"` transforms what only exists at request time — the
	// CMS media in R2 — through the IMAGES binding declared in wrangler.jsonc.
	//
	// NOT `imageService: "cloudflare"`. That one emits /cdn-cgi/image/ URLs,
	// which are a ZONE feature: measured on the preview host, the original
	// answers 200 and the transformed URL answers 404, because both deploys
	// live on *.workers.dev. When #162 puts the worker on serverstartup.io
	// with Transformations enabled, switching is this one line — the markup
	// does not change, which is the whole point of picking a service over
	// hand-written srcset.
	adapter: cloudflare({
		imageService: { build: "compile", runtime: "cloudflare-binding" },
	}),
	// #332: the Astro.cache.set(cacheHint) calls only emit through a
	// provider. This one sets Cloudflare-CDN-Cache-Control + Cache-Tag and
	// purges via cache.purge({tags}) from cloudflare:workers. Edge caching
	// itself is opted in from wrangler.jsonc ("cache": { enabled: true });
	// the default-deny policy lives in src/middleware.ts and the
	// purge-on-publish hooks in src/plugins/cache-purge.ts (#357).
	cache: { provider: cacheCloudflare() },
	image: {
		layout: "constrained",
		responsiveStyles: true,
		// #323: the CMS points featured_image at files under public/assets/, and
		// EmDash hands Astro an ABSOLUTE url for them — which Astro classifies as
		// remote and, unless the host is allowed here, passes through untouched.
		// Measured before adding this: a srcset of nine identical URLs, one per
		// width descriptor. Markup that promises variants and serves one file is
		// worse than no srcset at all.
		// Listed host by host on purpose: a wildcard would turn /_image into an
		// open proxy that resizes anything on the internet on our bill.
		//
		// #407 corrects what this list was believed to do. Allowing our OWN hosts
		// never made our own images work on Cloudflare and cannot: the endpoint
		// then FETCHES them, and a Worker asking the edge for its own hostname
		// gets a 17-byte error string back, not a file. The fix is upstream of
		// here — src/components/TeamPhoto.astro renders repo-carried photographs
		// through astro:assets, so the href is a PATH and the endpoint reads it
		// off the asset layer with no subrequest at all. The entries stay for
		// genuinely remote images and for the build, and because removing an
		// allow-list entry is not a thing to do casually.
		remotePatterns: [
			{ protocol: "http", hostname: "localhost" },
			{ protocol: "https", hostname: "www-serverstartup-io.serverstartup-s-partner-demo-account3612.workers.dev" },
			{ protocol: "https", hostname: "www-serverstartup-io-preview.serverstartup-s-partner-demo-account3612.workers.dev" },
			{ protocol: "https", hostname: "www.serverstartup.io" },
		],
	},
	integrations: [
		react(),
		emdash({
			...(ADMIN_ORIGIN ? { siteUrl: ADMIN_ORIGIN } : {}),
			// Its Noto Sans was downloaded from Google on every build; the same
			// files are local now, under the variable its admin reads (#629).
			fonts: false,
			// #655: no visual-editing toolbar on public pages. For a signed-in
			// editor EmDash injects it as an inline <script>, which the public
			// CSP (script-src 'self', src/middleware.ts) refuses, so it drew
			// controls that did nothing; and click-to-edit needs `entry.edit`
			// spreads that the home, the verticals, About and Contact do not
			// carry. Content is edited in the admin, outside that CSP.
			toolbar: false,
			// #648: the one middleware that runs OUTSIDE EmDash's. It strips the
			// Server-Timing EmDash writes after src/middleware.ts has returned.
			middleware: { outer: "./src/middleware-outer.ts" },
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [
				// #357: purge-on-publish. In-repo on purpose — plugin settings
				// are not seedable, so an admin-configured alternative would be
				// silently disarmed by every clean rebuild.
				{
					id: "cache-purge",
					version: "1.0.0",
					entrypoint: "/src/plugins/cache-purge.ts",
					format: "standard",
					// Without content:read the runtime SKIPS every content hook —
					// silently, with only a dev-log warn (measured 2026-08-23).
					capabilities: ["content:read"],
				},
			],
			sandboxed: [webhookNotifier],
			sandboxRunner: sandbox(),
			// #627: since 0.39 a sandbox runner switches the plugin registry ON by
			// default, which lets any admin install third-party code — the surface
			// #636 removed with the marketplace. Off, explicitly.
			registry: false,
		}),
	],
	// Read from src/assets/fonts at build time — no network (#629).
	fonts,
	devToolbar: { enabled: false },
	vite: {
		define: {
			// #379: EmDash builds every preview link from one pattern, and its
			// default `/{collection}/{id}` matched our routes only by accident
			// — services 404'd. Point it at the single preview route, which
			// forwards to the page a reader would see.
			"import.meta.env.EMDASH_PREVIEW_PATH_PATTERN":
				JSON.stringify("/preview/{collection}/{id}"),
		},
		build: {
			// Never inline a script into the HTML. The middleware CSP is
			// script-src 'self' (no hashes, no unsafe-inline), so any script
			// Vite inlines under the default 4 KB threshold is silently blocked
			// by the browser — menu dialog and phone decode died this way.
			// Nor any other asset (images, fonts): same as the `0` this was.
			//
			// Stylesheets under 4 KB ARE inlined (#568): the CSP allows inline
			// styles, and on a vertical page four of its seven render-blocking
			// sheets were component sheets under 2 KB, each a round-trip
			// Lighthouse's simulation charged to the LCP. Astro's
			// `inlineStylesheets: 'auto'` reads this same function. Every sheet
			// this lets in is free of the syntax the W3C Nu checker rejects
			// inside HTML (`container-type`, `field-sizing`, `vector-effect`),
			// which is what sank inlining them all (#568, 2026-10-06). One sheet
			// under the limit stays external on purpose: Astro's own
			// `@layer astro.images` ships `object-position` pairs such as
			// `bottom top`, which Nu rejects once they sit in the HTML.
			assetsInlineLimit: (filePath, content) =>
				filePath.endsWith(".css") && content.length < 4096 && !content.includes("@layer astro.images"),
		},
	},
});
