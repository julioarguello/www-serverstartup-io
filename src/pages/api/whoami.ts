import type { APIRoute } from "astro";

/**
 * The visitor's own echo on the radar hero (#529): the address Cloudflare saw
 * the request come from, and the city it infers. Fetched by the browser,
 * never rendered into the page — the service pages are cached at the edge
 * for an hour (src/middleware.ts), and an address baked into that HTML would
 * be served to the next visitor. `no-store` here is explicit even though the
 * middleware already denies caching to anything that did not opt in.
 *
 * Shown only to the visitor it belongs to. It is still personal data, so the
 * privacy policy names it (the "radar" paragraph).
 */
export const prerender = false;

export const GET: APIRoute = ({ request }) => {
	// Astro 6 moved the Cloudflare request properties onto the request itself
	const cf = ((request as any).cf ?? {}) as Record<string, unknown>;
	const body = JSON.stringify({
		ip: request.headers.get("cf-connecting-ip") ?? "",
		city: typeof cf.city === "string" ? cf.city : "",
		colo: typeof cf.colo === "string" ? cf.colo : "",
	});
	return new Response(body, {
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});
};
