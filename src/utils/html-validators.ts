/**
 * HTML leaves without validators (#694).
 *
 * Zaraz writes a per-response nonce into our CSP and into the inline script
 * it injects. A page with `Last-Modified` gets revalidated by the browser, the
 * edge answers 304 with the stored CSP — no nonce — and the browser keeps the
 * old body under the new header: Zaraz's script is blocked on every revisit
 * (measured 2026-11-05 on production: 200, 200, then 304 with Zaraz absent).
 * Without a validator there is nothing to revalidate against, so every
 * navigation gets a whole 200 from the edge, with a fresh nonce.
 *
 * Loading Zaraz by hand (/cdn-cgi/zaraz/i.js, auto-injection off) does not
 * avoid the nonce: i.js itself runs inline scripts at runtime and copies the
 * nonce from the first `script[nonce]` in the page. Measured on the preview
 * with no nonce: three CSP violations per page, the Pageview bookkeeping and
 * GA4's visibility handler blocked. And a nonce of our own would meet the
 * same 304 as soon as the edge re-renders a page whose content has not
 * changed. Revalidation of HTML is what has to go, whoever writes the nonce.
 *
 * Astro's cache provider sets `Last-Modified` from the CMS cache hints after
 * every middleware has returned, so the Worker's fetch is the first place it
 * can be removed. Nothing here uses `cache.invalidate()`, the one feature that
 * needs the validators at the edge.
 */
export function withoutHtmlValidators(response: Response): Response {
	const type = response.headers.get("Content-Type") ?? "";
	if (!type.startsWith("text/html")) return response;
	if (!response.headers.has("Last-Modified") && !response.headers.has("ETag")) return response;
	const headers = new Headers(response.headers);
	headers.delete("Last-Modified");
	headers.delete("ETag");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
