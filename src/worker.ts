// EmDash's Cloudflare entry: the Astro handler plus a `scheduled()` handler
// (#623). Without it nothing time-driven runs on the deployed Worker: no
// scheduled publishing, no plugin cron, no cleanup of expired passkey
// challenges, tokens or abandoned uploads. On Cloudflare EmDash installs no
// in-process timer; the Cron Trigger in wrangler.jsonc (*/5) drives it
// instead. PluginBridge is the WorkerEntrypoint that sandboxed plugins reach
// through ctx.exports.
import worker, { PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

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
 * Astro's cache provider sets `Last-Modified` from the CMS cache hints after
 * every middleware has returned, so this is the first place it can be removed.
 * Nothing here uses `cache.invalidate()`, the one feature that needs the
 * validators at the edge.
 */
function withoutHtmlValidators(response: Response): Response {
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

type Fetch = NonNullable<typeof worker.fetch>;
const astroFetch = worker.fetch as Fetch;

export default {
	...worker,
	async fetch(...args: Parameters<Fetch>): Promise<Response> {
		return withoutHtmlValidators(await astroFetch(...args));
	},
};
