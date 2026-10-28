/**
 * Data for the contact page, /contacto and /en/contact (#622).
 *
 * The route calls this, sets every returned cache hint itself, and hands the
 * rest to components/pages/ContactPage.astro (see utils/pages/about.ts).
 */
import { getEmDashCollection, getEmDashEntry, getSiteSettings } from "emdash";
import { entryAlternatePath } from "../alternate";
import { getUiLabels } from "../ui-labels";
import type { SiteSettings } from "../../types";

export async function loadContact(slug: string, locale: string) {
	const { entry, cacheHint } = await getEmDashEntry("pages", slug, { locale });
	if (!entry) return null;
	const settings = (await getSiteSettings()) as SiteSettings;
	// Team faces come from the members collection (owned by the About page work,
	// #263) — photo when uploaded, initial-letter placeholder meanwhile.
	const { entries: members, cacheHint: membersHint } = await getEmDashCollection("members", {
		limit: 50,
		orderBy: { title: "asc" },
		locale,
	});
	const labels = await getUiLabels(locale);
	// Slugs are translated across locales — resolve the counterpart via the CMS (#291)
	const altPath = await entryAlternatePath("pages", entry.data.id, locale);
	// The team cards render members, so a member save must purge this page too (#625).
	return { locale, entry, settings, members, labels, altPath, cacheHints: [cacheHint, membersHint] };
}

export type ContactData = NonNullable<Awaited<ReturnType<typeof loadContact>>>;
