/**
 * Data for the blog machinery: the listing, a post, and the category and tag
 * archives, in both locales (#622). The blog is off (#340): with no posts each
 * route answers 404 (#464, #626), and the day there is a first post it comes
 * back by itself.
 *
 * Each route calls one of these, sets the returned cache hint itself, answers
 * 404 where the data says so, and hands the rest to its page component (see
 * utils/pages/about.ts).
 */
import { getEmDashCollection, getEmDashEntry, getTerm } from "emdash";

export async function loadPosts(locale: string) {
	const { entries: posts, cacheHint } = await getEmDashCollection("posts", { locale });
	return { locale, posts, cacheHints: [cacheHint] };
}

export async function loadPost(slug: string, locale: string) {
	const { entry: post, cacheHint } = await getEmDashEntry("posts", slug, { locale });
	if (!post) return null;
	// The "More posts" section: a few extra in case the current post is among them.
	// Its hint goes to the route too, so publishing another post refreshes this one.
	const { entries: recentPosts, cacheHint: recentHint } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		limit: 4,
		locale,
	});
	return { locale, slug, post, recentPosts, cacheHints: [cacheHint, recentHint] };
}

export async function loadArchive(taxonomy: "category" | "tag", slug: string, locale: string) {
	const term = await getTerm(taxonomy, slug);
	if (!term) return null;
	const { entries: posts, cacheHint } = await getEmDashCollection("posts", {
		where: { [taxonomy]: term.slug },
		orderBy: { published_at: "desc" },
		locale,
	});
	return { locale, term, posts, cacheHints: [cacheHint] };
}

export type PostsData = Awaited<ReturnType<typeof loadPosts>>;
export type PostData = NonNullable<Awaited<ReturnType<typeof loadPost>>>;
export type ArchiveData = NonNullable<Awaited<ReturnType<typeof loadArchive>>>;
