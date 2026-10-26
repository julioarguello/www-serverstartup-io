/**
 * The CSP admits exactly one host outside this origin: the Cloudflare Web
 * Analytics beacon (#309).
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

const middleware = readFileSync(new URL("../../src/middleware.ts", import.meta.url), "utf8");

/** Every source in the policy that names a host, per directive. */
export function outsideSources(src: string): string[] {
	const block = src.match(/"Content-Security-Policy":\s*\[([\s\S]*?)\]\.join/)?.[1];
	if (!block) throw new Error("Content-Security-Policy array not found in src/middleware.ts");
	const directives = [...block.matchAll(/^\s*"([a-z-]+) ([^"]*)",?\s*$/gm)];
	if (directives.length < 5) throw new Error(`only ${directives.length} directives parsed`);
	return directives.flatMap(([, name, values]) =>
		values
			.split(/\s+/)
			// keywords are quoted; schemes such as data: name no host
			.filter((v) => v && !v.startsWith("'") && !/^[a-z]+:$/.test(v))
			.map((v) => `${name} ${v}`),
	);
}

describe("CSP outside hosts", () => {
	it("finds a host when the policy names one (positive control)", () => {
		const planted = `"Content-Security-Policy": [\n"default-src 'self'",\n"script-src 'self' https://evil.example",\n"img-src 'self' data:",\n"font-src 'self'",\n"object-src 'none'",\n].join`;
		expect(outsideSources(planted)).toEqual(["script-src https://evil.example"]);
	});

	it("admits only the Web Analytics beacon host", () => {
		expect(outsideSources(middleware)).toEqual(["script-src https://static.cloudflareinsights.com"]);
	});
});
