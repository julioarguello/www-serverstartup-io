import type { APIRoute } from "astro";
import { getEmDashCollection, getSiteSettings } from "emdash";

import { resolveBlogSiteIdentity } from "../../utils/site-identity";

export const GET: APIRoute = async ({ site, url, currentLocale, cache }) => {
	const locale = currentLocale || "en";
	const siteUrl = site?.toString() || url.origin;
	const { siteTitle, siteTagline } = resolveBlogSiteIdentity(await getSiteSettings());

	// APIContext exposes `cache`. The Spanish feed was corrected in #332 and
	// this one was not, so until #464 the English feed took the header TTL
	// below and never the purge — a post published in English stayed absent
	// from its own feed for an hour. Same code as ../rss.xml.ts now.
	const { entries: posts, cacheHint } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		limit: 20,
	});
	cache.set(cacheHint);

	// #464. No posts, no feed. An empty but valid RSS channel is a live public
	// surface advertising a blog that does not exist — and it was reachable
	// from every page's head until this issue. Same condition as the listing,
	// so both come back together the day there is a first post (#340).
	if (posts.length === 0) return new Response(null, { status: 404 });

	const items = posts
		.map((post) => {
			if (!post.data.publishedAt) return null;
			const pubDate = post.data.publishedAt.toUTCString();

			const postUrl = `${siteUrl}/en/posts/${post.id}`;
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
    <link>${siteUrl}/en</link>
    <atom:link href="${siteUrl.replace(/\/$/, "")}/en/rss.xml" rel="self" type="application/rss+xml"/>
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
};

const XML_ESCAPE_PATTERNS = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/"/g, "&quot;"],
	[/'/g, "&apos;"],
] as const;

function escapeXml(str: string): string {
	let result = str;
	for (const [pattern, replacement] of XML_ESCAPE_PATTERNS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}
