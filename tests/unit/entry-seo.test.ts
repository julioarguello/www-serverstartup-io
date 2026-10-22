/**
 * entry-seo.ts — the admin's SEO panel laid over a page's defaults (#624).
 *
 * The failure is silent: a panel that nothing reads renders perfectly, and an
 * override that leaks an empty field blanks a description. So: no panel and
 * an empty panel both keep every default; each filled field overrides alone.
 */
import { describe, expect, it } from "vitest";

import { entryHead } from "../../src/utils/entry-seo";

const defaults = {
	title: "Inteligencia artificial",
	description: "The excerpt, as plain text.",
	siteUrl: "https://www.serverstartup.dev",
	path: "/inteligencia-artificial",
};
const empty = { title: null, description: null, image: null, canonical: null, noIndex: false };
const entry = (seo?: Record<string, unknown>) =>
	({ id: "01X", data: { title: defaults.title, excerpt: "E", ...(seo ? { seo } : {}) } }) as never;

describe("entryHead", () => {
	it("keeps every default when the collection has no SEO panel", () => {
		expect(entryHead(entry(), defaults)).toEqual({
			title: defaults.title,
			description: defaults.description,
			noIndex: false,
		});
	});

	it("keeps every default when the panel is empty", () => {
		const head = entryHead(entry(empty), defaults);
		expect(head.title).toBe(defaults.title);
		expect(head.description).toBe(defaults.description);
		expect(head.image).toBeUndefined();
		expect(head.canonical).toBeUndefined();
		expect(head.robots).toBeUndefined();
		expect(head.noIndex).toBe(false);
	});

	it("lets each filled field override on its own", () => {
		const head = entryHead(
			entry({ ...empty, title: "IA aplicada", description: "Short.", image: "01MEDIA", canonical: "https://example.test/x", noIndex: true }),
			defaults,
		);
		expect(head.title).toBe("IA aplicada");
		expect(head.description).toBe("Short.");
		expect(head.image).toBe("https://www.serverstartup.dev/_emdash/api/media/file/01MEDIA");
		expect(head.canonical).toBe("https://example.test/x");
		expect(head.robots).toBe("noindex, nofollow");
		expect(head.noIndex).toBe(true);
	});
});
