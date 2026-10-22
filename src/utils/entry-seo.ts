/**
 * What an editor set in the admin's SEO panel for one entry, laid over the
 * page's own defaults (#624).
 *
 * Collections with `seo` in `supports` get a panel per entry: title,
 * description, image, canonical and noindex, stored in `_emdash_seo`. Until
 * #624 the panel was shown and nothing read it. Only a field the editor
 * filled overrides; an empty one keeps what the page already emits (Base's
 * title suffix, the origin canonical, the site's OG image). EmDash's own
 * `getSeoMeta` resolves the image reference and `robots`, so the media URL
 * rules live in one place.
 *
 * Single-entry reads only: `getEmDashCollection` rows carry no `seo`.
 */
import { getContentSeo, getSeoMeta } from "emdash";

type SeoEntry = Parameters<typeof getSeoMeta>[0];

export interface EntryHead {
	/** The <title> before Base's site suffix. */
	title: string;
	description: string;
	image?: string;
	canonical?: string;
	robots?: string;
	noIndex: boolean;
}

export function entryHead(
	entry: SeoEntry,
	defaults: { title: string; description: string; siteUrl: string; path: string },
): EntryHead {
	const seo = getContentSeo(entry);
	if (!seo) return { title: defaults.title, description: defaults.description, noIndex: false };
	const meta = getSeoMeta(entry, { siteUrl: defaults.siteUrl, path: defaults.path });
	return {
		title: seo.title || defaults.title,
		description: seo.description || defaults.description,
		image: seo.image ? (meta.ogImage ?? undefined) : undefined,
		canonical: seo.canonical ? (meta.canonical ?? undefined) : undefined,
		robots: meta.robots ?? undefined,
		noIndex: Boolean(seo.noIndex),
	};
}
