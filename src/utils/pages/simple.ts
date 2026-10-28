/**
 * Data for the pages that render one CMS entry and nothing else: the privacy
 * policy, and the legal pages like it (#622).
 *
 * The route calls this, sets every returned cache hint itself, and hands the
 * rest to its page component (see utils/pages/about.ts).
 */
import { getEmDashEntry } from "emdash";
import { entryAlternatePath } from "../alternate";

export async function loadPage(slug: string, locale: string) {
	const { entry, cacheHint } = await getEmDashEntry("pages", slug, { locale });
	if (!entry) return null;
	// Slugs are translated across locales — resolve the counterpart via the CMS (#291)
	const altPath = await entryAlternatePath("pages", entry.data.id, locale);
	return { locale, entry, altPath, cacheHints: [cacheHint] };
}

export type PageData = NonNullable<Awaited<ReturnType<typeof loadPage>>>;
