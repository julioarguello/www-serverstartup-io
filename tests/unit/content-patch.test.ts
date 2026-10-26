/**
 * Content patches (#662): production text changes as dated files in
 * seed/patches/, applied through EmDash's API by scripts/content-patch.mjs.
 *
 * The runner's network half was checked against a dev server seeded from
 * main (apply, skip on a second run, refuse after a hand edit). This suite
 * holds the offline half: the format, the "seed.json carries every after"
 * contract, and the seed splice, which must touch the patched values only.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM script, no types
import { getAt, listPatches, parseWithSpans, seedApply, seedSpan, setAt, validatePatch } from "../../scripts/content-patch.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const SEED = readFileSync(join(ROOT, "seed", "seed.json"), "utf8");
const run = (...args: string[]) =>
	spawnSync("node", [join(ROOT, "scripts", "content-patch.mjs"), ...args], { cwd: ROOT, encoding: "utf8" });

const change = (over: Record<string, unknown> = {}) => ({
	collection: "layers",
	slug: "cache",
	locale: "es",
	path: ["facts", { key: "h2-2" }, "text"],
	before: "a",
	after: "b",
	...over,
});

describe("content patches", () => {
	it("the tracked patches are valid and seed.json holds every after", () => {
		const res = run("check");
		expect(res.stderr).toBe("");
		expect(res.status).toBe(0);
		expect(listPatches().length).toBeGreaterThan(0);
	});

	it("check fails when seed.json lacks a patch's after", () => {
		// positive control: a seed reverted to a patch's before must be caught
		const [{ patch }] = listPatches();
		const c = patch.changes[0];
		const node = seedSpan(parseWithSpans(SEED), c);
		const reverted = SEED.slice(0, node.start) + JSON.stringify(c.before) + SEED.slice(node.end);
		expect(() => seedApply(reverted, { changes: [{ ...c, before: c.after, after: "something else" }] })).toThrow(/neither/);
		const back = seedApply(reverted, patch);
		expect(back).toBe(SEED);
	});

	it("rejects malformed patches by name", () => {
		const ok = { date: "2026-10-26", issue: 662, summary: "x", changes: [change()] };
		expect(validatePatch("2026-10-26-x.json", ok)).toEqual([]);
		expect(validatePatch("x.json", ok).join()).toMatch(/name must be/);
		expect(validatePatch("2026-10-27-x.json", ok).join()).toMatch(/date/);
		expect(validatePatch("2026-10-26-x.json", { ...ok, changes: [change({ after: "a" })] }).join()).toMatch(/equal/);
		expect(validatePatch("2026-10-26-x.json", { ...ok, changes: [] }).join()).toMatch(/non-empty/);
	});

	it("addresses a list item by a one-key selector, and only when it is unique", () => {
		const doc = { facts: [{ key: "a", text: "1" }, { key: "b", text: "2" }] };
		expect(getAt(doc, ["facts", { key: "b" }, "text"])).toBe("2");
		expect(setAt(doc, ["facts", { key: "b" }, "text"], "3")).toEqual({ facts: [{ key: "a", text: "1" }, { key: "b", text: "3" }] });
		expect(getAt({ facts: [{ key: "a" }, { key: "a" }] }, ["facts", { key: "a" }])).toBeUndefined();
	});

	it("splices only the patched values and keeps the rest byte for byte", () => {
		const dir = mkdtempSync(join(tmpdir(), "content-patch-"));
		const src = '{\n\t"content": {\n\t\t"layers": [\n\t\t\t{ "slug": "cache", "locale": "es", "data": { "facts": [ { "key": "h2-2", "text": "a" }, { "key": "x", "text": "a" } ] } }\n\t\t]\n\t}\n}\n';
		writeFileSync(join(dir, "seed.json"), src);
		const out = seedApply(src, { changes: [change()] });
		expect(out).toBe(src.replace('"key": "h2-2", "text": "a"', '"key": "h2-2", "text": "b"'));
	});
});
