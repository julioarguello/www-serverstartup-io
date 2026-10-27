/**
 * The Web Analytics beacon is ours to place (#309): the zone's automatic
 * injection never reached these Worker-rendered pages. These pin the three
 * things that keep it honest — a token only on the hosts that own one (its zone's), the tag
 * only when there is a token, and a script host the CSP admits.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BEACON_SRC, BEACON_TOKENS, beaconConfig } from "../../src/utils/web-analytics";
import { outsideSources } from "./csp-sources";

const base = readFileSync(new URL("../../src/layouts/Base.astro", import.meta.url), "utf8");
const middleware = readFileSync(new URL("../../src/middleware.ts", import.meta.url), "utf8");

describe("Web Analytics beacon", () => {
	it("gives each measured host its zone's token: one token per zone, never shared across zones", () => {
		expect(Object.keys(BEACON_TOKENS).sort()).toEqual(
			["preview.serverstartup.dev", "www.serverstartup.dev", "www.serverstartup.io"],
		);
		const zoneOf = (host: string) => host.split(".").slice(-2).join(".");
		const byZone = new Map<string, Set<string>>();
		for (const [host, token] of Object.entries(BEACON_TOKENS)) byZone.set(zoneOf(host), (byZone.get(zoneOf(host)) ?? new Set()).add(token));
		expect([...byZone.keys()].sort()).toEqual(["serverstartup.dev", "serverstartup.io"]);
		for (const tokens of byZone.values()) expect(tokens.size).toBe(1);
		expect(new Set(Object.values(BEACON_TOKENS)).size).toBe(byZone.size);
		expect(JSON.parse(beaconConfig("www.serverstartup.io") ?? "{}")).toEqual({
			token: BEACON_TOKENS["www.serverstartup.io"],
		});
	});

	it("gives no tag to a host that is not measured", () => {
		for (const host of ["localhost", "127.0.0.1", "serverstartup.io", "x.workers.dev", "toString", "__proto__"]) {
			expect(beaconConfig(host)).toBeNull();
		}
	});

	it("renders the tag only when there is a config, unbundled", () => {
		expect(base).toMatch(/\{beacon && <script is:inline type="module" src=\{BEACON_SRC\} data-cf-beacon=\{beacon\}><\/script>\}/);
		expect(base).toContain("beaconConfig(Astro.url.hostname)");
	});

	it("loads from a host the CSP admits", () => {
		expect(outsideSources(middleware)).toContain(`script-src ${new URL(BEACON_SRC).origin}`);
	});
});
