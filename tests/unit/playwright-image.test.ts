/**
 * The `engines` job runs inside Playwright's image (#646), and the image's
 * browsers are the ones its own Playwright version downloads. A `playwright`
 * bump in package.json that leaves the image behind would drive browsers the
 * library was not built against — and the job would still start, because the
 * image carries them under its own revision numbers and the library goes
 * looking for its own. So the two are tied here, read from the files, not
 * restated.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const images = (yaml: string) =>
	[...yaml.matchAll(/^\s*image:\s*mcr\.microsoft\.com\/playwright:(\S+)\s*$/gm)].map((m) => m[1]);

describe("Playwright image", () => {
	it("is tagged with the playwright version package.json pins", () => {
		const pkg = JSON.parse(read("package.json"));
		const pinned: string = pkg.devDependencies?.playwright ?? pkg.dependencies?.playwright;
		expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);

		const tags = images(read(".github/workflows/ci.yml"));
		expect(tags.length).toBeGreaterThan(0);
		for (const tag of tags) expect(tag).toBe(`v${pinned}-noble`);
	});

	it("matches the version the lockfile resolved", () => {
		const lock = JSON.parse(read("package-lock.json"));
		const resolved: string = lock.packages["node_modules/playwright"].version;
		for (const tag of images(read(".github/workflows/ci.yml"))) expect(tag).toBe(`v${resolved}-noble`);
	});
});
