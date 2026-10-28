/**
 * Data for the references page, /referencias and /en/references (#622).
 *
 * The route calls this, sets every returned cache hint itself, and hands the
 * rest to components/pages/ReferencesPage.astro (see utils/pages/about.ts).
 */
import { getEmDashCollection, getEmDashEntry } from "emdash";
import { entryAlternatePath } from "../alternate";
import { getUiLabels } from "../ui-labels";

export async function loadReferences(slug: string, locale: string) {
	const { entry, cacheHint } = await getEmDashEntry("pages", slug, { locale });
	if (!entry) return null;
	// Slugs are translated across locales — resolve the counterpart via the CMS (#291)
	const altPath = await entryAlternatePath("pages", entry.data.id, locale);
	const labels = await getUiLabels(locale);
	const refsResult = await getEmDashCollection("references", {
		orderBy: { created_at: "asc" },
	});
	return { locale, entry, altPath, labels, refs: refsResult.entries ?? [], cacheHints: [cacheHint, refsResult.cacheHint] };
}

export type ReferencesData = NonNullable<Awaited<ReturnType<typeof loadReferences>>>;
