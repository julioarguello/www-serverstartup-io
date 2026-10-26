/**
 * The CSP admits Cloudflare Web Analytics and nothing else outside this origin
 * (#309): the beacon's script host, and the host it reports to.
 *
 * Three published texts depend on it, in both locales: the privacy page ("the
 * only thing your browser downloads from outside this domain"), and two layers
 * of /deconstruyendo ("1 third-party request", "the CSP admits one outside
 * script"). The browser enforces whatever the CSP says, so the CSP is the
 * claim's real boundary — a host added here makes those texts false the day
 * it ships. Changing this list means changing them, as a content patch, in the
 * same change.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { outsideSources } from "./csp-sources";

const middleware = readFileSync(new URL("../../src/middleware.ts", import.meta.url), "utf8");

describe("CSP outside hosts", () => {
	it("finds a host when the policy names one (positive control)", () => {
		const planted = `"Content-Security-Policy": [\n"default-src 'self'",\n"script-src 'self' https://evil.example",\n"img-src 'self' data:",\n"font-src 'self'",\n"object-src 'none'",\n].join`;
		expect(outsideSources(planted)).toEqual(["script-src https://evil.example"]);
	});

	it("admits only Web Analytics: the beacon's host and the host it reports to", () => {
		expect(outsideSources(middleware)).toEqual([
			"script-src https://static.cloudflareinsights.com",
			"connect-src https://cloudflareinsights.com",
		]);
	});
});
