import type { APIRoute } from "astro";
import { getContentSeo, getEmDashCollection, getEmDashEntry } from "emdash";

/**
 * sitemap.xml — every public URL, derived from the CMS (#329).
 *
 * ── Why this file exists instead of `@astrojs/sitemap` ────────────────────
 *
 * The integration cannot see this site's pages. Its own documentation says so
 * without offering a workaround:
 *
 *   "This integration cannot generate sitemap entries for dynamic routes in
 *    SSR mode."
 *   — https://docs.astro.build/en/guides/integrations-guide/sitemap/
 *
 * The cause is upstream of the plugin: integrations receive the route PATTERN,
 * and `RouteData.pathname` is `undefined` for any dynamic route, so there are
 * no concrete URLs to emit. It is not an oversight either — the maintainer's
 * assessment on the standing request (withastro/roadmap#906, opened 2024-04-20,
 * still unimplemented) is that "making the sitemap itself SSR would be a
 * redesign of the lib since it currently all runs in build time".
 *
 * Left as it was, the sitemap declared 16 URLs while the site served 26
 * indexable ones. The fourteen missing were the six verticals in both locales
 * and, once #308 published them, the legal notice and its English twin — a
 * document with a legal duty to be accessible, undeclared.
 *
 * ── Why ONE endpoint and not a hybrid ────────────────────────────────────
 *
 * A first design kept the plugin for "file routes" and added an endpoint for
 * "CMS routes", joined with `customPages`/`customSitemaps`. That rested on a
 * premise nobody had checked: that two kinds of page existed. They do not.
 * `/quienes-somos`, `/contacto`, `/referencias`, `/deconstruyendo` and the
 * privacy policy are CMS entries that happen to own an `.astro` file for their
 * layout; `/` is the `home` entry. The file decides how they look, the CMS
 * knows they exist. Counted: 14 `pages` + 12 `services` = 26, exactly the set
 * the site serves. So one source answers the whole question, and `customPages`
 * would have been a misuse anyway — it is documented as "an array of
 * externally-generated pages", meaning pages another framework serves on the
 * same domain, not your own content.
 *
 * Generating from the database is also what Google asks for, in its own words:
 *
 *   "the best way is to have your website software generate it for you. For
 *    example, you can extract your site's URLs from your website's database
 *    and then export the URLs to either the screen or actual file on your web
 *    server."
 *   — https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 *     (verified 2026-08-21, page last updated 2026-07-08)
 *
 * ── What this file deliberately does NOT emit, and why ───────────────────
 *
 * `<changefreq>` and `<priority>`: "Google ignores <priority> and <changefreq>
 * values." (same page). sitemaps.org keeps them optional; emitting values no
 * consumer reads is noise that later reads as fact.
 *
 * `<lastmod>` unless it is real: "Google uses the <lastmod> value if it's
 * consistently and verifiably ... accurate" (same page), and the older
 * guidance is blunter — "Don't set the last modification time to the current
 * time whenever the sitemap or feed is served"
 * (https://developers.google.com/search/blog/2014/10/best-practices-for-xml-sitemaps-rssatom).
 * Trust in the field is binary, so a wrong date poisons every other date on
 * the site. Emitted only when the entry carries a real timestamp; omitted
 * otherwise.
 *
 * `hreflang` alternates: Google — "The three methods are equivalent from
 * Google's perspective ... While you can use all three methods at the same
 * time, there's no benefit in Search"
 * (https://developers.google.com/search/docs/specialty/international/localized-versions).
 * The `<head>` already carries a correct, reciprocal set built from the CMS's
 * own `translationOf` (#291). A second implementation here would be a second
 * source of truth that can disagree with the first, which §2.2 exists to
 * prevent.
 *
 * Non-indexable routes: "Include the URLs in your sitemap that you want to see
 * in Google's search results" (build-sitemap). `/search` and `/posts` carry
 * `noindex` (#335) and are not CMS entries, so they never enter this list;
 * that is by construction rather than by filter, which is the sturdier kind.
 *
 * ── EmDash's own sitemaps ───────────────────────────────────────────────
 *
 * EmDash 0.34 injects `/sitemap.xml` only when the site has no
 * `src/pages/sitemap.xml.*` (`hasUserDefinedPublicRoute` in its
 * `integration/routes.ts`), so this file replaces it outright: there is no
 * route collision. Its per-collection child, `/sitemap-services.xml`, is
 * still injected. It builds each URL from the collection's `urlPattern`,
 * localized to Astro's i18n config. Until #624 services had no pattern, so the
 * child listed `/services/<slug>`, twelve 404s. With `/{slug}` it lists the
 * same service URLs as this file. Nothing declares it; robots.txt points here.
 * The smoke battery still asserts that `/sitemap.xml` is a `<urlset>` (ours),
 * so a change in that precedence is caught by a guard, not by a crawler.
 *
 * ── Limits ───────────────────────────────────────────────────────────────
 *
 * "All formats limit a single sitemap to 50MB (uncompressed) or 50,000 URLs."
 * (build-sitemap; identical wording in https://www.sitemaps.org/protocol.html).
 * This site serves 26. A sitemap index would be indirection with nothing
 * behind it, so there is one flat file.
 */

/** Cached at the edge so a crawler fetch rarely costs a D1 query. */
const CACHE_SECONDS = 3600;

const XML_ESCAPE = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/"/g, "&quot;"],
	[/'/g, "&apos;"],
] as const;

function escapeXml(value: string): string {
	let out = value;
	for (const [pattern, replacement] of XML_ESCAPE) out = out.replace(pattern, replacement);
	return out;
}

type Entry = {
	id: string;
	slug?: string;
	data?: Record<string, unknown>;
	[key: string]: unknown;
};

/** The path a CMS entry is served at. `home` is served by / and /en. */
export function entryPath(collection: "pages" | "services", slug: string, locale: string): string {
	const prefix = locale === "en" ? "/en" : "";
	if (collection === "pages" && slug === "home") return prefix || "/";
	return `${prefix}/${slug}`;
}

/** A real timestamp, or nothing. Never the build date — see the note above. */
export function lastModOf(entry: Entry): string | null {
	const raw =
		(entry.updated_at as string | undefined) ??
		(entry.updatedAt as string | undefined) ??
		(entry.data?.updatedAt as string | undefined) ??
		(entry.data?.updated_at as string | undefined);
	if (!raw) return null;
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export const GET: APIRoute = async ({ site, url }) => {
	const origin = (site?.toString() || url.origin).replace(/\/$/, "");
	const urls: { loc: string; lastmod: string | null }[] = [];

	for (const locale of ["es", "en"] as const) {
		for (const collection of ["pages", "services"] as const) {
			const { entries } = await getEmDashCollection(collection, { locale });
			for (const entry of (entries ?? []) as unknown as Entry[]) {
				const slug = entry.slug ?? entry.id;
				// #624: an entry the editor marked noindex in the SEO panel stays out,
				// or verify-deploy's "every <loc> is indexable" check fails on it.
				// List rows carry no `seo`, so services, the one collection with a
				// panel, are read one by one: about a dozen reads, cached at the edge.
				if (collection === "services") {
					const { entry: full } = await getEmDashEntry(collection, slug, { locale });
					if (full && getContentSeo(full)?.noIndex) continue;
				}
				urls.push({
					loc: origin + entryPath(collection, slug, locale),
					lastmod: lastModOf(entry),
				});
			}
		}
	}

	// Deterministic order: a sitemap that reshuffles on every fetch makes its
	// own diffs unreadable and defeats conditional requests.
	urls.sort((a, b) => a.loc.localeCompare(b.loc, "en"));

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) =>
			`  <url>\n    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`,
	)
	.join("\n")}
</urlset>
`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": `public, max-age=${CACHE_SECONDS}`,
		},
	});
};
