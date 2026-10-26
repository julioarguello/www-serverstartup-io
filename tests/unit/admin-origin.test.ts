/**
 * The admin's origin per deployed environment (#664).
 *
 * EmDash takes the passkey's rpId from `siteUrl`. Production's must be the
 * canonical host, the site's own `site`, or the administrator's passkey works
 * on a host nobody opens. Before #664 it was whatever host the request came
 * in on, and the production passkey was bound to www.serverstartup.dev.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const config = readFileSync(join(import.meta.dirname, "..", "..", "astro.config.mjs"), "utf8");
const site = config.match(/^\tsite:\s*"([^"]+)"/m)?.[1];
const origin = (env: string) => config.match(new RegExp(`\\n\\t${env}:\\s*"([^"]+)"`))?.[1];

describe("the admin origin", () => {
	it("reads the site and both environments from the config", () => {
		// positive control: a silent regex miss would compare undefined to undefined
		expect(site).toMatch(/^https:\/\//);
		expect(origin("production")).toMatch(/^https:\/\//);
		expect(origin("preview")).toMatch(/^https:\/\//);
	});

	it("is the canonical site in production", () => {
		expect(origin("production")).toBe(site);
	});

	it("is passed to emdash() as siteUrl", () => {
		expect(config).toMatch(/emdash\(\{\s*\.\.\.\(ADMIN_ORIGIN \? \{ siteUrl: ADMIN_ORIGIN \} : \{\}\)/);
	});
});
