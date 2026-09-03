/**
 * The legal row in the footer must not link at nothing (#507).
 *
 * `SITE_BY_PATH` and `seed/seed.json` are two lists of the same routes kept by
 * hand, and nothing renders red when they drift. `nav.ts` says so in its own
 * comment — "an unmapped path is dropped silently, which is how the site
 * shipped with no way back home (#273)" — and the legal paths sit in that map
 * for a second reason: so those pages get their emblem detail like every other
 * page (#350). Rename a slug in the seed and the map goes stale with no
 * symptom at all: the page still renders, the map entry just stops matching.
 *
 * For the accessibility channel the same silence is a legal failure rather
 * than a cosmetic one. RD 1112/2018 art. 10 requires a mechanism users can
 * actually reach, and art. 15.2 b) requires the declaration to LINK to it. A
 * footer link pointing at a 404, or a page published in one locale only,
 * breaks that duty while every existing gate stays green — the copy baseline
 * compares rendered text against itself, so it would happily freeze the
 * broken state as the new truth.
 *
 * These tests take the map and the seed as ARGUMENTS rather than reading the
 * real ones inside the check, so the positive controls can hand them a
 * fabricated pair. A guard that needs the thing it checks in order to fail
 * proves nothing.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SITE_BY_PATH } from "../../src/utils/nav";

const ROOT = join(import.meta.dirname, "..", "..");

interface SeedPage {
	id: string;
	slug: string;
	status: string;
	locale: string;
	translationOf?: string;
}

const seed = JSON.parse(readFileSync(join(ROOT, "seed", "seed.json"), "utf8"));
const PAGES: SeedPage[] = seed.content.pages;

/** "/en/legal-notice" → { locale: "en", slug: "legal-notice" }; "/aviso-legal" → es. */
function routeTarget(path: string): { locale: string; slug: string } {
	return path.startsWith("/en/")
		? { locale: "en", slug: path.slice("/en/".length) }
		: { locale: "es", slug: path.slice(1) };
}

/**
 * Every path the map calls "legal" that has no published page behind it.
 * Returns the offending paths, so a failure names them instead of a bare false.
 */
function danglingLegalRoutes(
	map: Record<string, string>,
	pages: SeedPage[],
): string[] {
	return Object.entries(map)
		.filter(([, key]) => key === "legal")
		.map(([path]) => path)
		.filter((path) => {
			const { locale, slug } = routeTarget(path);
			return !pages.some(
				(p) => p.slug === slug && p.locale === locale && p.status === "published",
			);
		});
}

/** Locales in which `slug` is published, for a page identified by either variant. */
function publishedLocales(pages: SeedPage[], slugs: string[]): string[] {
	return pages
		.filter((p) => slugs.includes(p.slug) && p.status === "published")
		.map((p) => p.locale)
		.sort();
}

const ACCESSIBILITY_SLUGS = ["accesibilidad", "accessibility"];

describe("the footer's legal routes resolve", () => {
	it("every path mapped as legal has a published page in the seed", () => {
		expect(danglingLegalRoutes(SITE_BY_PATH, PAGES)).toEqual([]);
	});

	it("control — a mapped path with no page behind it is reported", () => {
		// The plant is a map entry, not a seed edit: the check must fail on the
		// half that actually drifts in practice.
		const planted = { ...SITE_BY_PATH, "/pagina-que-nadie-ha-creado": "legal" };
		expect(danglingLegalRoutes(planted, PAGES)).toEqual(["/pagina-que-nadie-ha-creado"]);
	});

	it("control — an unpublished page is as dangling as a missing one", () => {
		const drafted = PAGES.map((p) =>
			p.slug === "accessibility" ? { ...p, status: "draft" } : p,
		);
		expect(danglingLegalRoutes(SITE_BY_PATH, drafted)).toEqual(["/en/accessibility"]);
	});
});

describe("the accessibility channel (RD 1112/2018 arts. 10-13)", () => {
	it("is published in both locales", () => {
		expect(publishedLocales(PAGES, ACCESSIBILITY_SLUGS)).toEqual(["en", "es"]);
	});

	it("is reachable from the footer in both locales", () => {
		expect(SITE_BY_PATH["/accesibilidad"]).toBe("legal");
		expect(SITE_BY_PATH["/en/accessibility"]).toBe("legal");
	});

	it("joins its two locales with translationOf", () => {
		// Without it the language switcher and hreflang fall back to the
		// homepage (see src/utils/alternate.ts), so a reader who lands on one
		// locale has no route to the other — for a page the law requires to be
		// findable, that is the failure this pins.
		const es = PAGES.find((p) => p.slug === "accesibilidad" && p.locale === "es");
		const en = PAGES.find((p) => p.slug === "accessibility" && p.locale === "en");
		expect(es).toBeDefined();
		expect(en?.translationOf).toBe(es?.id);
	});

	it("declares the anchor before the translation, which is what the seeder needs", () => {
		// `emdash seed` resolves translationOf against entries it has already
		// applied; a translation listed first mints a fresh group instead and
		// warns rather than fails.
		const ids = PAGES.map((p) => p.id);
		expect(ids.indexOf("page-accesibilidad")).toBeLessThan(ids.indexOf("page-accesibilidad-en"));
	});
});
