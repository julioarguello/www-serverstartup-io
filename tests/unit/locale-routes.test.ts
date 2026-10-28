/**
 * One page, two routes (#622).
 *
 * Slugs are translated (/quienes-somos ↔ /en/about-us), so every page needs a
 * route file per locale. Those files were full copies of each other, and the
 * copies drifted: a missing About entry gave a 404 in Spanish and a redirect
 * to the English home page in English, a hard-coded "en-US" crept into one
 * blog route only, and so on.
 *
 * The shape this test holds: a route under src/pages/en/ is a thin wrapper —
 * it loads its data, sets its cache hints (which only page frontmatter may do,
 * scripts/ci-check-cache-hints.py) and renders ONE component from
 * src/components/pages/. Exactly two routes render each such component: the
 * English one and its Spanish twin.
 *
 * Routes not folded yet are listed below. The list only shrinks: a folded
 * route must leave it, and nothing may join it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const PAGES = join(ROOT, "src", "pages");
const COMPONENTS = join(ROOT, "src", "components", "pages");

/** Route files still written out in full, in both locales. #622 folds them. */
const NOT_FOLDED = new Set([
	"posts/index.astro", "en/posts/index.astro",
	"posts/[slug].astro", "en/posts/[slug].astro",
	"category/[slug].astro", "en/category/[slug].astro",
	"tag/[slug].astro", "en/tag/[slug].astro",
	"rss.xml.ts", "en/rss.xml.ts",
]);
/** The list's ceiling: 14 when the guard landed, lowered by every fold. It never goes up. */
const NOT_FOLDED_MAX = 10;

/** A thin wrapper has room to load, cache and render — and not for a page body. */
const MAX_WRAPPER_LINES = 20;

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}
const routes = walk(PAGES)
	.map((p) => relative(PAGES, p))
	.filter((p) => /\.(astro|ts)$/.test(p));
const enRoutes = routes.filter((p) => p.startsWith("en/"));
const source = (route: string) => readFileSync(join(PAGES, route), "utf8");

/** The page component a route renders, when it renders exactly one and nothing else. */
export function wrapped(src: string): string | null {
	const imports = [...src.matchAll(/^import (\w+) from "(?:\.\.\/)+components\/pages\/(\w+)\.astro";$/gm)];
	if (imports.length !== 1) return null;
	const [, local, file] = imports[0];
	if (local !== file) return null;
	const template = src.slice(src.indexOf("\n---\n", 4) + 5).trim();
	// the template is the component and nothing else: no markup of its own
	if (!new RegExp(`^<${local}\\b[^<>]*/>$`).test(template)) return null;
	if (src.split("\n").length > MAX_WRAPPER_LINES) return null;
	return file;
}

describe("locale routes are thin wrappers around one shared page (#622)", () => {
	it("sees the routes it judges", () => {
		// positive control: the walk found the tree, and both kinds of route exist
		expect(enRoutes.length).toBeGreaterThan(10);
		expect(enRoutes.some((r) => wrapped(source(r)))).toBe(true);
		expect(enRoutes.some((r) => NOT_FOLDED.has(r))).toBe(true);
	});

	it("tells a wrapper from a copy", () => {
		const wrapper = '---\nimport AboutPage from "../components/pages/AboutPage.astro";\n---\n\n<AboutPage {...props} />\n';
		expect(wrapped(wrapper)).toBe("AboutPage");
		expect(wrapped(wrapper.replace("<AboutPage {...props} />", "<Base><AboutPage {...props} /></Base>"))).toBeNull();
		expect(wrapped(wrapper.replace("---\n\n", `${"// filler\n".repeat(MAX_WRAPPER_LINES)}---\n\n`))).toBeNull();
		expect(wrapped(wrapper.replace("AboutPage from", "Page from"))).toBeNull();
	});

	it("every English route outside the list wraps a page component", () => {
		const copies = enRoutes.filter((r) => !NOT_FOLDED.has(r) && !wrapped(source(r)));
		expect(copies, "routes written out in full: render a component from src/components/pages/ instead").toEqual([]);
	});

	it("each page component is rendered by exactly one English route and one Spanish route", () => {
		const users = new Map<string, string[]>();
		for (const r of routes) {
			const c = wrapped(source(r));
			if (c) users.set(c, [...(users.get(c) ?? []), r]);
		}
		const components = readdirSync(COMPONENTS).filter((f) => f.endsWith(".astro")).map((f) => f.replace(/\.astro$/, ""));
		expect(components.length).toBeGreaterThan(0);
		for (const c of components) {
			const rs = users.get(c) ?? [];
			expect({ c, en: rs.filter((r) => r.startsWith("en/")).length, es: rs.filter((r) => !r.startsWith("en/")).length }).toEqual({ c, en: 1, es: 1 });
		}
	});

	it("the list of routes not folded yet only shrinks", () => {
		expect(NOT_FOLDED.size).toBeLessThanOrEqual(NOT_FOLDED_MAX);
		for (const r of NOT_FOLDED) {
			expect(routes, `${r} is listed but does not exist`).toContain(r);
			expect(wrapped(source(r)), `${r} is folded now: remove it from NOT_FOLDED and lower NOT_FOLDED_MAX`).toBeNull();
		}
	});
});
