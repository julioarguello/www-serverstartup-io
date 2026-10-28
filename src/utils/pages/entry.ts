/**
 * Data for /[slug] and /en/[slug]: a service, or else a CMS page (#622).
 *
 * The route calls this, sets every returned cache hint itself, and hands the
 * rest to components/pages/EntryPage.astro (see utils/pages/about.ts).
 */
import { getEmDashEntry, getSiteSettings } from "emdash";
import { entryAlternatePath } from "../alternate";
import { getUiLabels } from "../ui-labels";
import type { SiteSettings } from "../../types";

export async function loadEntry(slug: string, locale: string) {
	// Services first, then pages
	let entryCollection: "services" | "pages" = "services";
	let { entry, cacheHint } = await getEmDashEntry("services", slug, { locale });
	if (!entry) {
		({ entry, cacheHint } = await getEmDashEntry("pages", slug, { locale }));
		entryCollection = "pages";
	}
	if (!entry) return null;
	// Slugs are translated across locales — resolve the counterpart via the CMS (#291)
	const altPath = await entryAlternatePath(entryCollection, entry.data.id, locale);
	const settings = (await getSiteSettings()) as SiteSettings;
	const labels = await getUiLabels(locale);
	return { slug, locale, entry, entryCollection, altPath, settings, labels, cacheHints: [cacheHint] };
}

export type EntryData = NonNullable<Awaited<ReturnType<typeof loadEntry>>>;
