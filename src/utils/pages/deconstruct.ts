/**
 * Data for /deconstruyendo and /en/deconstructing (#535, #622).
 *
 * The route calls this, sets every returned cache hint itself, and hands the
 * rest to components/DeconstructPage.astro (see utils/pages/about.ts). Tags
 * accumulate, so publishing the page or any layer purges the route.
 */
import { getEmDashEntry, getSiteSettings } from "emdash";
import { entryAlternatePath } from "../alternate";
import { getLayers } from "../layers";
import { getUiLabels } from "../ui-labels";
import type { SiteSettings } from "../../types";

export async function loadDeconstruct(slug: string, locale: string) {
	const { entry, cacheHint } = await getEmDashEntry("pages", slug, { locale });
	if (!entry) return null;
	const { layers, cacheHint: layersHint } = await getLayers(locale);
	const settings = (await getSiteSettings()) as SiteSettings;
	const labels = await getUiLabels(locale);
	// Slugs are translated across locales — resolve the counterpart via the CMS (#291)
	const altPath = await entryAlternatePath("pages", entry.data.id, locale);
	return { entry, layers, labels, altPath, repoUrl: settings.repoUrl || "", cacheHints: [cacheHint, layersHint as typeof cacheHint] };
}
