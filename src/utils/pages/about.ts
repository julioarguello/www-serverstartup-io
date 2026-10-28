/**
 * Data for the About page, /quienes-somos and /en/about-us (#622).
 *
 * The route calls this, sets every returned cache hint itself, and hands the
 * rest to components/pages/AboutPage.astro. Cache hints are set in the route
 * because only page frontmatter reaches the response headers
 * (scripts/ci-check-cache-hints.py).
 */
import { getEmDashCollection, getEmDashEntry } from "emdash";
import { entryAlternatePath } from "../alternate";

export async function loadAbout(slug: string, locale: string) {
	const { entry, cacheHint } = await getEmDashEntry("pages", slug, { locale });
	if (!entry) return null;
	const { entries: members, cacheHint: membersHint } = await getEmDashCollection("members", {
		limit: 50,
		orderBy: { title: "asc" },
		locale,
	});
	// Slugs are translated across locales — resolve the counterpart via the CMS (#291)
	const altPath = await entryAlternatePath("pages", entry.data.id, locale);
	// The team cards render members, so a member save must purge this page too (#625).
	return { locale, entry, members, altPath, cacheHints: [cacheHint, membersHint] };
}

export type AboutData = NonNullable<Awaited<ReturnType<typeof loadAbout>>>;
