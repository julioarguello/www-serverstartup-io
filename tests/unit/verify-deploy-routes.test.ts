/**
 * The smoke battery must know every page the sitemap declares (#520).
 *
 * `scripts/verify-deploy.sh` asserts, for each route, an HTTP 200 AND a phrase
 * only that page serves. It is the last thing that looks at a deployed site,
 * and its `ROUTES` array is hand-maintained — a third list of the same pages,
 * after `seed/seed.json` and `SITE_BY_PATH`.
 *
 * The battery already cross-checks itself against the live `/sitemap.xml`
 * (#328), for exactly this reason: the sitemap is derived from the CMS and
 * grows by itself, `ROUTES` does not. That check is correct and it fired. Its
 * weakness is *when*: it needs a deployed URL, so it runs in `verify-deploy`,
 * after the merge, against the shared preview. #507 published the accessibility
 * statement in both locales, was green on its own PR, and left `deploy-preview`
 * red on `main` — the two pages under the sharpest legal duty to be reachable
 * (RD 1112/2018 art. 15) were the only two nothing asserted.
 *
 * So the same question is asked here, where it can be answered before the
 * merge: no deploy, no network, just the seed and the script.
 *
 * `entryPath` is IMPORTED from `src/pages/sitemap.xml.ts` rather than
 * reimplemented. That file argues at length against a second source of truth
 * for the site's URLs, and a test that re-derived the rule would be one — it
 * would keep passing while agreeing with nothing that ships.
 *
 * Every check takes the seed and the script text as ARGUMENTS, so the controls
 * below can hand them a fabricated pair. A guard that needs the real files in
 * order to fail proves nothing.
 *
 * What this does NOT check: that the phrase in the second column is actually on
 * the page. Only a rendered page can say that, and the battery says it on every
 * deploy. This holds the set of routes, not the assertions made about them.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { entryPath } from "../../src/pages/sitemap.xml";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

const SCRIPT = read("scripts", "verify-deploy.sh");
const WORKFLOW = read(".github", "workflows", "verify-deploy.yml");
const seed = JSON.parse(read("seed", "seed.json"));

interface SeedEntry {
	slug: string;
	locale?: string;
	status?: string;
}
type SeedContent = Record<string, SeedEntry[]>;

/**
 * Every path `/sitemap.xml` emits, by its own rule: the `pages` and `services`
 * collections, both locales, `home` served at the locale root.
 *
 * Draft entries are excluded — `getEmDashCollection` does not serve them, so a
 * page still being written must not make this fail. Today every entry in the
 * seed is published, which is why the filter is stated rather than assumed.
 */
export function indexablePaths(content: SeedContent): string[] {
	const out: string[] = [];
	for (const collection of ["pages", "services"] as const) {
		for (const entry of content[collection] ?? []) {
			if (entry.status && entry.status !== "published") continue;
			out.push(entryPath(collection, entry.slug, entry.locale ?? "es"));
		}
	}
	return out.sort();
}

/**
 * The `ROUTES` array as `[path, phrase]` pairs.
 *
 * Matched on whole lines — one tab, a quoted `path|phrase`, nothing else — so
 * the bash comments interleaved in the array are ignored by construction
 * rather than by filter.
 */
export function routeEntries(script: string): [string, string][] {
	const block = script.match(/^ROUTES=\(\n([\s\S]*?)^\)$/m);
	if (!block) return [];
	return [...block[1].matchAll(/^\t"([^"|]+)\|([^"]*)"$/gm)].map((m) => [m[1], m[2]]);
}

/** What the two lists disagree about, named in both directions. */
export function routeDrift(paths: string[], routes: [string, string][]): string[] {
	const asserted = new Set(routes.map(([path]) => path));
	const served = new Set(paths);
	return [
		...paths.filter((p) => !asserted.has(p)).map((p) => `${p}: in the sitemap, not in ROUTES`),
		...routes.map(([p]) => p).filter((p) => !served.has(p)).map((p) => `${p}: in ROUTES, no page behind it`),
	];
}

/** The route count each file states in prose, or null where it says none. */
export function statedCount(text: string, pattern: RegExp): number | null {
	const m = text.match(pattern);
	return m ? Number(m[1]) : null;
}

const SCRIPT_COUNT = /Routes battery: (\d+) routes/;
const SUMMARY_COUNT = /\| routes \| (\d+) routes ×/;

const PATHS = indexablePaths(seed.content);
const ROUTES = routeEntries(SCRIPT);

describe("the battery covers what the site serves", () => {
	it("actually parsed both lists", () => {
		// A rename, or a reformat of the array, would make every assertion below
		// vacuously true. This is the positive control.
		expect(ROUTES.length, "the ROUTES parse found nothing — check the array's formatting").toBeGreaterThan(20);
		expect(PATHS.length).toBeGreaterThan(20);
		expect(ROUTES.every(([, phrase]) => phrase.length > 0)).toBe(true);
	});

	it("asserts every route the sitemap declares, and no route it does not", () => {
		expect(routeDrift(PATHS, ROUTES)).toEqual([]);
	});
});

describe("the counts stated in prose are the count", () => {
	it("in the script's own section heading", () => {
		expect(statedCount(SCRIPT, SCRIPT_COUNT)).toBe(ROUTES.length);
	});

	it("in the Summary table the workflow writes", () => {
		// This one had drifted by six before anyone noticed, which is why it is
		// derived now instead of remembered — the failure #499 already named.
		expect(statedCount(WORKFLOW, SUMMARY_COUNT)).toBe(ROUTES.length);
	});
});

describe("controls — the check can fail", () => {
	const FAKE_SCRIPT = [
		"# ── 1. Routes battery: 2 routes, both locales, status + title ──",
		"ROUTES=(",
		'\t"/|Ingeniería de software"',
		"\t# a comment inside the array, which must not parse as a route",
		'\t"/en|Software engineering"',
		")",
		"",
	].join("\n");

	const FAKE_SEED: SeedContent = {
		pages: [
			{ slug: "home", locale: "es", status: "published" },
			{ slug: "home", locale: "en", status: "published" },
		],
		services: [],
	};

	it("ignores comments interleaved in the array", () => {
		expect(routeEntries(FAKE_SCRIPT)).toEqual([
			["/", "Ingeniería de software"],
			["/en", "Software engineering"],
		]);
	});

	it("agrees with itself when nothing has drifted", () => {
		expect(routeDrift(indexablePaths(FAKE_SEED), routeEntries(FAKE_SCRIPT))).toEqual([]);
	});

	it("reports a published page nobody added to ROUTES", () => {
		// The real regression, replayed: #507 added these two entries to the seed
		// and nothing else.
		const withStatement: SeedContent = {
			...FAKE_SEED,
			pages: [
				...FAKE_SEED.pages,
				{ slug: "accesibilidad", locale: "es", status: "published" },
				{ slug: "accessibility", locale: "en", status: "published" },
			],
		};
		expect(routeDrift(indexablePaths(withStatement), routeEntries(FAKE_SCRIPT))).toEqual([
			"/accesibilidad: in the sitemap, not in ROUTES",
			"/en/accessibility: in the sitemap, not in ROUTES",
		]);
	});

	it("reports a ROUTES entry whose page was renamed away", () => {
		const renamed: SeedContent = { pages: [{ slug: "inicio", locale: "es", status: "published" }], services: [] };
		expect(routeDrift(indexablePaths(renamed), routeEntries(FAKE_SCRIPT))).toEqual([
			"/inicio: in the sitemap, not in ROUTES",
			"/: in ROUTES, no page behind it",
			"/en: in ROUTES, no page behind it",
		]);
	});

	it("leaves a draft out, so unfinished copy does not fail the battery", () => {
		const draft: SeedContent = {
			...FAKE_SEED,
			pages: [...FAKE_SEED.pages, { slug: "borrador", locale: "es", status: "draft" }],
		};
		expect(routeDrift(indexablePaths(draft), routeEntries(FAKE_SCRIPT))).toEqual([]);
	});

	it("reports a stated count that no longer matches the array", () => {
		const stale = FAKE_SCRIPT.replace("Routes battery: 2 routes", "Routes battery: 20 routes");
		expect(statedCount(stale, SCRIPT_COUNT)).toBe(20);
		expect(statedCount(stale, SCRIPT_COUNT)).not.toBe(routeEntries(stale).length);
	});
});
