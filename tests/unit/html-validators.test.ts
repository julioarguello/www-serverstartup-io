/**
 * HTML leaves the Worker without validators (#694), so a revisit is never a
 * 304 carrying a stored CSP that no longer matches Zaraz's nonce. Everything
 * else keeps them: images and assets still revalidate cheaply.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { withoutHtmlValidators } from "../../src/utils/html-validators";

const VALIDATORS = { "Last-Modified": "Thu, 05 Nov 2026 10:12:28 GMT", ETag: '"abc"' };

function response(type: string, extra: Record<string, string> = {}): Response {
	return new Response("<p>body</p>", {
		status: 200,
		statusText: "OK",
		headers: { "Content-Type": type, ...VALIDATORS, ...extra },
	});
}

describe("withoutHtmlValidators", () => {
	it("strips Last-Modified and ETag from HTML", () => {
		const out = withoutHtmlValidators(response("text/html; charset=utf-8"));
		expect(out.headers.get("Last-Modified")).toBeNull();
		expect(out.headers.get("ETag")).toBeNull();
	});

	it("keeps every other header, the status and the body", async () => {
		const out = withoutHtmlValidators(
			response("text/html", {
				"Cloudflare-CDN-Cache-Control": "public, max-age=3600, stale-while-revalidate=604800",
				"Cache-Tag": "pages,abc",
				"Content-Security-Policy": "script-src 'self'",
			}),
		);
		expect(out.status).toBe(200);
		expect(out.statusText).toBe("OK");
		expect(out.headers.get("Cloudflare-CDN-Cache-Control")).toContain("stale-while-revalidate");
		expect(out.headers.get("Cache-Tag")).toBe("pages,abc");
		expect(out.headers.get("Content-Security-Policy")).toBe("script-src 'self'");
		expect(await out.text()).toBe("<p>body</p>");
	});

	it("leaves non-HTML untouched, validators included", () => {
		for (const type of ["image/webp", "application/json", "text/css", "application/xml"]) {
			const input = response(type);
			const out = withoutHtmlValidators(input);
			expect(out).toBe(input);
			expect(out.headers.get("Last-Modified")).toBe(VALIDATORS["Last-Modified"]);
			expect(out.headers.get("ETag")).toBe(VALIDATORS.ETag);
		}
	});

	it("returns HTML without validators as it came", () => {
		const input = new Response("x", { headers: { "Content-Type": "text/html" } });
		expect(withoutHtmlValidators(input)).toBe(input);
	});

	it("is what the Worker's fetch returns through", () => {
		const worker = readFileSync(new URL("../../src/worker.ts", import.meta.url), "utf8");
		expect(worker).toMatch(/return withoutHtmlValidators\(await astroFetch\(\.\.\.args\)\);/);
	});
});
