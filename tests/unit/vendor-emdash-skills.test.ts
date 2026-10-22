/**
 * The vendored EmDash skills describe the EmDash this project installs (#616).
 *
 * They arrived as the 0.6.0 template's copy and stayed there through
 * twenty-eight minor versions, teaching capability names the runtime had
 * deprecated. Nothing compared the two, so nothing noticed. The README names
 * the upstream tag it was copied from; this test holds it to the lockfile.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");

const vendoredTag = (readme: string): string | undefined =>
	readme.match(/\| Version \| tag \*\*`emdash@([0-9][^`]*)`\*\*/)?.[1];

describe("vendor/emdash-skills follows the installed emdash", () => {
	it("reads the tag from the README's Version row", () => {
		// Positive control: a reworded row must fail here, not read as "no tag".
		expect(vendoredTag("| Version | tag **`emdash@1.2.3`**, commit `abc` |")).toBe("1.2.3");
		expect(vendoredTag("| Version | emdash 1.2.3 |")).toBeUndefined();
	});

	it("is the version package-lock.json resolves", () => {
		const readme = readFileSync(join(ROOT, "vendor", "emdash-skills", "README.md"), "utf8");
		const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
		const installed: string | undefined = lock.packages?.["node_modules/emdash"]?.version;
		expect(installed).toBeTruthy();
		expect(vendoredTag(readme)).toBe(installed);
	});
});
