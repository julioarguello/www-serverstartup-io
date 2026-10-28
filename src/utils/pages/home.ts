/**
 * Data for the home page, / and /en (#622).
 *
 * The route calls this, sets every returned cache hint itself, and hands the
 * rest to components/pages/HomePage.astro (see utils/pages/about.ts). The hint
 * MUST be set in the route: HomepageContent's own call runs mid-stream, after
 * the headers left — the home served BYPASS until the verify-purge E2E caught
 * it (2026-08-23). Middleware adds the footer tags.
 */
import { getEmDashEntry, getSiteSettings } from "emdash";
import type { SiteSettings } from "../../types";

export async function loadHome(locale: string) {
	const { entry, cacheHint } = await getEmDashEntry("pages", "home", { locale });
	const settings = (await getSiteSettings()) as SiteSettings;
	return { locale, entry, settings, cacheHints: [cacheHint] };
}

export type HomeData = Awaited<ReturnType<typeof loadHome>>;
