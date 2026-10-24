import { defineMiddleware } from "astro:middleware";

/**
 * The outermost middleware (#648), wired through EmDash's `middleware.outer`
 * option in astro.config.mjs.
 *
 * EmDash's own middleware is injected with `order: "pre"`, so it wraps
 * src/middleware.ts: anything EmDash writes after `next()` lands on the
 * response after our middleware has already returned it. That is where it
 * writes Server-Timing — setup probe, runtime init, DB init and migration
 * policy, encryption-key validation, plugin states, query counts — on every
 * response, the admin and 404s included, with no option to turn it off
 * (EmDash 1.3.1, `finalizeResponse` in emdash/dist/astro/middleware.mjs).
 * Only a middleware outside EmDash's can take it back off.
 *
 * Kept under `astro dev`, where the timings are a debugging aid and nobody
 * else can see them. Stripped from every build: the local stack, the preview
 * and production. scripts/ci-check-headers.sh asserts the absence.
 */
export const onRequest = defineMiddleware(async (_context, next) => {
	const response = await next();
	if (import.meta.env.DEV || !response.headers.has("Server-Timing")) return response;
	try {
		response.headers.delete("Server-Timing");
		return response;
	} catch {
		// Immutable headers (a response out of caches.default, #405) throw on
		// delete as on set. Rebuild only then: a rebuilt Response loses the
		// Astro cookies EmDash attaches by symbol, and a cache hit carries none.
		const headers = new Headers(response.headers);
		headers.delete("Server-Timing");
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}
});
