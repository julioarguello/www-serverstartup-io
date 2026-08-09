/**
 * Dynamic Open Graph image — /og/image?title=…  (issue #224)
 *
 * Renders a branded 1200×630 card server-side with Cloudflare Browser
 * Rendering (screenshots an HTML template) so every page gets a per-title
 * social image without hand-made captures. Served as image/png — social
 * scrapers key off the Content-Type, not the URL extension, so the path
 * deliberately carries no image extension (an `.png` path is treated as a
 * static asset by the adapter and never reaches this Worker route).
 *
 * Graceful degradation: Browser Rendering only runs on Cloudflare (the
 * BROWSER binding is declared for the preview/production environments, not
 * the local default). When the binding is absent — local `wrangler dev`,
 * `npm run dev` — or on any failure, the endpoint returns an inline branded
 * SVG card with 200, so builds, the seeded local stack and every quality gate
 * stay green off-edge. The browser-rendered PNG path itself only exercises
 * once the binding is provisioned on the account (see the PR/issue notes).
 */
import type { APIRoute } from "astro";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_TITLE = 160;

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function template(title: string): string {
	return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${WIDTH}px;height:${HEIGHT}px}
    body{background:#1E1E1E;color:#fff;font-family:-apple-system,Segoe UI,Roboto,sans-serif;
      display:flex;flex-direction:column;justify-content:space-between;padding:80px}
    .kicker{font-size:28px;letter-spacing:.14em;text-transform:uppercase;color:#B26641}
    h1{font-size:76px;line-height:1.08;font-weight:700;max-width:1000px}
    .brand{font-size:34px;font-weight:600;color:#cfcfcf}
  </style></head><body>
    <div class="kicker">Server Startup</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="brand">serverstartup.io</div>
  </body></html>`;
}

export const GET: APIRoute = async ({ url, locals }) => {
	const title = (url.searchParams.get("title") || "Server Startup").slice(0, MAX_TITLE);
	// Off-edge fallback: return a branded SVG card inline with 200. It must be
	// a self-contained 200 body — endpoint redirects (and errored responses)
	// get rewritten to /404 in this Astro+EmDash chain, and a same-origin
	// fetch of the static logo is blocked in the local runtime. A plain-but-
	// valid og:image beats a broken one until the BROWSER binding is live.
	const fallback = () => {
		const safe = escapeHtml(title).slice(0, 90);
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
			`<rect width="${WIDTH}" height="${HEIGHT}" fill="#1E1E1E"/>` +
			`<text x="80" y="180" fill="#B26641" font-family="sans-serif" font-size="28" letter-spacing="4">SERVER STARTUP</text>` +
			`<text x="80" y="320" fill="#ffffff" font-family="sans-serif" font-size="68" font-weight="700">${safe}</text>` +
			`<text x="80" y="560" fill="#cfcfcf" font-family="sans-serif" font-size="34">serverstartup.io</text></svg>`;
		return new Response(svg, {
			status: 200,
			headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
		});
	};

	// Typed access to the runtime binding without `as any` (audit #115).
	// Wrapped: locals is a strict proxy that can throw for absent bindings.
	let binding: unknown;
	try {
		binding = (locals as { runtime?: { env?: { BROWSER?: unknown } } }).runtime?.env?.BROWSER;
	} catch {
		binding = undefined;
	}
	if (!binding) return fallback();

	try {
		const { default: puppeteer } = await import("@cloudflare/puppeteer");
		const browser = await puppeteer.launch(binding as Parameters<typeof puppeteer.launch>[0]);
		try {
			const page = await browser.newPage();
			await page.setViewport({ width: WIDTH, height: HEIGHT });
			await page.setContent(template(title), { waitUntil: "load" });
			const shot = await page.screenshot({ type: "png" });
			const body = typeof shot === "string" ? shot : new Uint8Array(shot);
			return new Response(body, {
				headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
			});
		} finally {
			await browser.close();
		}
	} catch {
		return fallback();
	}
};

// D1/Browser bindings are unavailable at build time — render on demand.
export const prerender = false;
