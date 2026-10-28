/**
 * The path segment of a post's URL (#622). An entry's `id` is its slug only
 * in the default locale: an English post's id reads `en/testing-the-blog`, so
 * a link built from it pointed at /en/posts/en/testing-the-blog. The slug is
 * the segment; the id is only a fallback.
 */
export const postSlug = (post: { id: string; slug?: string | null }): string => post.slug ?? post.id;
