/**
 * Fonts are read from the repository, never downloaded at build time (#629).
 *
 * `fontProviders.google()` made every build fetch its fonts from
 * fonts.gstatic.com, and a connect timeout there failed a CI job before it
 * tested anything. EmDash adds its own Noto Sans download unless told
 * `fonts: false`. Either one coming back reintroduces the network into the
 * build, and nothing else would notice until the next timeout.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fonts } from "../../src/assets/fonts/families.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const config = readFileSync(join(ROOT, "astro.config.mjs"), "utf8");
const families = readFileSync(join(ROOT, "src", "assets", "fonts", "families.mjs"), "utf8");

/** Every `fontProviders.<name>(` call in a source text, comments excluded — they may name the old one. */
const providers = (source: string): string[] =>
	[...source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "").matchAll(/fontProviders\.([A-Za-z]+)\s*\(/g)].map(
		(m) => m[1],
	);

describe("the build reads its fonts from src/assets/fonts", () => {
	it("recognises a remote provider", () => {
		// Positive control: the line #629 removed must read as remote.
		expect(providers('provider: fontProviders.google(), name: "Alexandria"')).toEqual(["google"]);
		expect(providers("// fontProviders.google() was here\nprovider: fontProviders.local(),")).toEqual(["local"]);
	});

	it("uses no font provider but the local one", () => {
		const used = [...providers(config), ...providers(families)];
		expect(used.length).toBeGreaterThan(0);
		expect(used.filter((p) => p !== "local")).toEqual([]);
	});

	it("tells EmDash not to download its own fonts", () => {
		expect(config).toMatch(/emdash\(\{[\s\S]*?\bfonts:\s*false\b/);
	});

	it("answers every variable the site and the admin read", () => {
		expect(fonts.map((f) => f.cssVariable).sort()).toEqual(["--font-emdash", "--font-mono", "--font-sans"]);
	});

	it("preloads by weight and style only — local files carry no subset", () => {
		// The local provider tags no face with a subset, so a `subset` in a
		// preload filter matches nothing and Astro drops the link without a word.
		// Base.astro's `subset: "latin"` did exactly that; the preload is worth
		// up to 0.1 of Lighthouse perf on the first screen (see Base.astro).
		const astroFiles = execFileSync("git", ["ls-files", "src/**/*.astro"], { cwd: ROOT, encoding: "utf8" })
			.split("\n")
			.filter(Boolean);
		const withPreload = astroFiles.filter((f) => /<Font[^>]*\bpreload=/.test(readFileSync(join(ROOT, f), "utf8")));
		expect(withPreload.length).toBeGreaterThan(0);
		const subsetFiltered = withPreload.filter((f) =>
			/<Font[^>]*\bpreload=\{[^}]*\bsubset:/.test(readFileSync(join(ROOT, f), "utf8").replace(/\n/g, " ")),
		);
		expect(subsetFiltered).toEqual([]);
	});

	it("names only files that exist", () => {
		const files = fonts.flatMap((f) =>
			(f.options?.variants ?? []).flatMap((v: { src: string[] }) => v.src),
		);
		expect(files.length).toBeGreaterThan(0);
		expect(files.filter((src) => !existsSync(join(ROOT, src)))).toEqual([]);
	});
});
