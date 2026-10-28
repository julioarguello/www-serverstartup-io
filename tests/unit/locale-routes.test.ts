/**
 * One page, two routes (#622).
 *
 * Slugs are translated (/quienes-somos ↔ /en/about-us), so every page needs a
 * route file per locale. Those files were full copies of each other, and the
 * copies drifted: a missing About entry gave a 404 in Spanish and a redirect
 * to the English home page in English, a hard-coded "en-US" crept into one
 * blog route only, and so on.
 *
 * The shape this test holds. Every route under src/pages/en/ is a thin
 * wrapper. It loads its data, sets its cache hints (which only a route may do,
 * scripts/ci-check-cache-hints.py), answers 404 where the data says so, and:
 * - for a page, renders ONE component from src/components/pages/;
 * - for an endpoint, hands off to ONE module from src/utils/pages/.
 * Exactly two routes use each such component or module: the English one and
 * its Spanish twin.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const PAGES = join(ROOT, "src", "pages");
const COMPONENTS = join(ROOT, "src", "components", "pages");

/** A thin wrapper has room to load, cache, answer 404 and render — and not for a page body. */
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

/** What a route wraps, when it is a thin wrapper: `component:<Name>` or `module:<name>`; otherwise null. */
export function wrapped(src: string, route: string): string | null {
	if (src.split("\n").length > MAX_WRAPPER_LINES) return null;
	if (route.endsWith(".ts")) {
		const modules = [...src.matchAll(/^import \{[^}]+\} from "(?:\.\.\/)+utils\/pages\/(\w+)";$/gm)];
		// an endpoint builds nothing itself: no markup in it
		return modules.length === 1 && !/[<][a-z?!]/i.test(src.replace(/import type[^\n]*\n/g, "")) ? `module:${modules[0][1]}` : null;
	}
	const imports = [...src.matchAll(/^import (\w+) from "(?:\.\.\/)+components\/pages\/(\w+)\.astro";$/gm)];
	if (imports.length !== 1) return null;
	const [, local, file] = imports[0];
	if (local !== file) return null;
	const template = src.slice(src.indexOf("\n---\n", 4) + 5).trim();
	// the template is the component and nothing else: no markup of its own
	return new RegExp(`^<${local}\\b[^<>]*/>$`).test(template) ? `component:${file}` : null;
}

describe("locale routes are thin wrappers around one shared page (#622)", () => {
	it("sees the routes it judges", () => {
		// positive control: the walk found the tree, with pages and endpoints in it
		expect(enRoutes.length).toBeGreaterThan(10);
		expect(enRoutes.some((r) => r.endsWith(".ts"))).toBe(true);
		expect(enRoutes.some((r) => r.endsWith(".astro"))).toBe(true);
	});

	it("tells a wrapper from a copy", () => {
		const page = '---\nimport AboutPage from "../components/pages/AboutPage.astro";\n---\n\n<AboutPage {...props} />\n';
		expect(wrapped(page, "en/about-us.astro")).toBe("component:AboutPage");
		expect(wrapped(page.replace("<AboutPage {...props} />", "<Base><AboutPage {...props} /></Base>"), "x.astro")).toBeNull();
		expect(wrapped(page.replace("---\n\n", `${"// filler\n".repeat(MAX_WRAPPER_LINES)}---\n\n`), "x.astro")).toBeNull();
		expect(wrapped(page.replace("AboutPage from", "Page from"), "x.astro")).toBeNull();
		const endpoint = 'import type { APIRoute } from "astro";\nimport { feed, loadFeed } from "../../utils/pages/rss";\nexport const GET: APIRoute = async () => feed(await loadFeed("en"), "");\n';
		expect(wrapped(endpoint, "en/rss.xml.ts")).toBe("module:rss");
		expect(wrapped(endpoint.replace('feed(await loadFeed("en"), "")', 'new Response(`<rss>${1}</rss>`)'), "en/rss.xml.ts")).toBeNull();
	});

	it("every English route wraps one shared page or module", () => {
		const copies = enRoutes.filter((r) => !wrapped(source(r), r));
		expect(copies, "routes written out in full: move the body to src/components/pages/ or src/utils/pages/").toEqual([]);
	});

	it("each shared page or module is used by exactly one English route and one Spanish route", () => {
		const users = new Map<string, string[]>();
		for (const r of routes) {
			const w = wrapped(source(r), r);
			if (w) users.set(w, [...(users.get(w) ?? []), r]);
		}
		// every component in the folder counts, used or not: an orphan is a page nobody serves
		const components = readdirSync(COMPONENTS).filter((f) => f.endsWith(".astro")).map((f) => `component:${f.replace(/\.astro$/, "")}`);
		expect(components.length).toBeGreaterThan(5);
		for (const w of new Set([...components, ...users.keys()])) {
			const rs = users.get(w) ?? [];
			expect({ w, en: rs.filter((r) => r.startsWith("en/")).length, es: rs.filter((r) => !r.startsWith("en/")).length }).toEqual({ w, en: 1, es: 1 });
		}
	});
});
