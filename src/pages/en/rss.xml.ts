/** /en/rss.xml — the blog feed. Built by utils/pages/rss.ts (#622). */
import type { APIRoute } from "astro";
import { feed, loadFeed } from "../../utils/pages/rss";

export const GET: APIRoute = async ({ site, url, cache }) => {
	const data = await loadFeed("en");
	cache.set(data.cacheHint);
	// #464: no posts, no feed (#340). An empty channel would advertise a blog that does not exist.
	if (data.posts.length === 0) return new Response(null, { status: 404 });
	return feed(data, site?.toString() || url.origin);
};
