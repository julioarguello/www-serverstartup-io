/**
 * The blog feed, /rss.xml and /en/rss.xml (#622).
 *
 * The endpoint calls loadFeed, sets the cache hint itself — only a route
 * reaches the response headers (scripts/ci-check-cache-hints.py) — answers 404
 * while there are no posts (#464), and returns feed(). With the hint set, the
 * feed gets the same edge TTL as pages via the middleware policy AND purges
 * when a post publishes (#332).
 */
import { getEmDashCollection, getSiteSettings } from "emdash";
import { resolveBlogSiteIdentity } from "../site-identity";
import { postSlug } from "./post-path";

export async function loadFeed(locale: string) {
	const { entries: posts, cacheHint } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		limit: 20,
		locale,
	});
	const settings = await getSiteSettings();
	return { locale, posts, settings, cacheHint };
}

/** The RSS document for a feed with posts. `site` is the site's origin, with or without a trailing slash. */
export function feed({ locale, posts, settings }: Awaited<ReturnType<typeof loadFeed>>, site: string): Response {
	const { siteTitle, siteTagline } = resolveBlogSiteIdentity(settings);
	const base = site.replace(/\/$/, "");
	const prefix = locale === "en" ? "/en" : "";
	const items = posts
		.map((post) => {
			if (!post.data.publishedAt) return null;
			const pubDate = post.data.publishedAt.toUTCString();
			const postUrl = `${base}${prefix}/posts/${postSlug(post)}`;
			const title = escapeXml(post.data.title || "Untitled");
			const description = escapeXml(post.data.excerpt || "");
			return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
		})
		.filter(Boolean)
		.join("\n");

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(siteTagline)}</description>
    <link>${base}${prefix || "/"}</link>
    <atom:link href="${base}${prefix}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}

const XML_ESCAPE_PATTERNS = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/"/g, "&quot;"],
	[/'/g, "&apos;"],
] as const;

export function escapeXml(str: string): string {
	let result = str;
	for (const [pattern, replacement] of XML_ESCAPE_PATTERNS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}
