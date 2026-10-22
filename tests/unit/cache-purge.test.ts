/**
 * cache-purge.ts — which tags an EmDash content event purges (#357, #625).
 *
 * The failure is silent: a purge of the wrong tags succeeds, and the page
 * stays stale for the full edge TTL. The delete event carries `{ id }` and no
 * `content`, which a hand-written payload type hid until #625 — so every event
 * shape the plugin handles is pinned here, delete first.
 */
import { describe, expect, it } from "vitest";

import { purgeTags } from "../../src/plugins/cache-purge";

describe("purgeTags", () => {
	it("purges the collection and the entry's own id on delete", () => {
		expect(purgeTags({ id: "01ABC", collection: "members", permanent: false })).toEqual(["members", "01ABC"]);
	});

	it("purges the collection and the id from content on save, publish and restore", () => {
		expect(purgeTags({ content: { id: "01XYZ" }, collection: "services", isNew: false })).toEqual(["services", "01XYZ"]);
		expect(purgeTags({ content: { id: 42 }, collection: "partners" })).toEqual(["partners", "42"]);
	});

	it("falls back to the collection alone when no id is present", () => {
		expect(purgeTags({ content: {}, collection: "pages" })).toEqual(["pages"]);
	});
});
