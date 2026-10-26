/**
 * Content patches (#662): live text changes as dated files in seed/patches/,
 * applied through EmDash's API by scripts/content-patch.mjs.
 *
 * The network half was checked against a dev server seeded from main
 * (apply, skip on a second run, refuse after a hand edit). This suite holds
 * the offline half: the format, the chains a value goes through, the
 * "the seed holds every target" gate run as CI runs it, and the seed splice.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM script, no types
import { chains, getAt, listPatches, parseWithSpans, seedApply, seedSpan, setAt, validatePatch } from "../../scripts/content-patch.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const SCRIPT = join(ROOT, "scripts", "content-patch.mjs");
const SEED = readFileSync(join(ROOT, "seed", "seed.json"), "utf8");
const run = (...args: string[]) => spawnSync("node", [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8" });

const change = (over: Record<string, unknown> = {}) => ({
	collection: "layers",
	slug: "cache",
	locale: "es",
	path: ["intro"],
	before: "A",
	after: "B",
	...over,
});
const patchFile = (date: string, changes: unknown[]) => ({ date, issue: 662, summary: "test", changes });

/** A throwaway seed and patch directory, for running `check` as CI does. */
function fixture(intro: string, patches: Record<string, unknown>) {
	const dir = mkdtempSync(join(tmpdir(), "content-patch-"));
	const seed = join(dir, "seed.json");
	writeFileSync(seed, JSON.stringify({ content: { layers: [{ slug: "cache", locale: "es", data: { intro } }] } }, null, "\t"));
	const pdir = join(dir, "patches");
	mkdirSync(pdir);
	for (const [name, p] of Object.entries(patches)) writeFileSync(join(pdir, name), JSON.stringify(p));
	return (...more: string[]) => run("check", "--seed", seed, "--patches", pdir, ...more);
}

describe("content patches", () => {
	it("the tracked patches are valid and the seed holds every target", () => {
		const res = run("check");
		expect(res.stderr).toBe("");
		expect(res.status).toBe(0);
		expect(listPatches().length).toBeGreaterThan(0);
	});

	it("check exits 1 when the seed lacks a target, and 0 once it holds it", () => {
		const p = { "2026-10-26-a.json": patchFile("2026-10-26", [change()]) };
		expect(fixture("A", p)().status).toBe(1);
		expect(fixture("A", p)().stderr).toMatch(/does not hold the target/);
		expect(fixture("B", p)().status).toBe(0);
	});

	it("chains two patches on one value: A→B then B→C targets C", () => {
		const p = {
			"2026-10-26-a.json": patchFile("2026-10-26", [change()]),
			"2026-11-20-b.json": patchFile("2026-11-20", [change({ before: "B", after: "C" })]),
		};
		expect(fixture("C", p)().status).toBe(0);
		expect(fixture("B", p)().status).toBe(1);
		const { chains: all, problems } = chains(listPatchesFrom(p));
		expect(problems).toEqual([]);
		expect(all[0].states).toEqual(["A", "B", "C"]);
	});

	it("rejects a chain whose next link does not start where the last ended", () => {
		const p = {
			"2026-10-26-a.json": patchFile("2026-10-26", [change()]),
			"2026-11-20-b.json": patchFile("2026-11-20", [change({ before: "X", after: "C" })]),
		};
		const res = fixture("C", p)();
		expect(res.status).toBe(1);
		expect(res.stderr).toMatch(/expects "X", but 2026-10-26-a.json left "B"/);
	});

	it("rejects malformed patches by name, without crashing on a bad path", () => {
		const ok = patchFile("2026-10-26", [change()]);
		expect(validatePatch("2026-10-26-x.json", ok)).toEqual([]);
		expect(validatePatch("x.json", ok).join()).toMatch(/name must be/);
		expect(validatePatch("2026-10-27-x.json", ok).join()).toMatch(/date/);
		expect(validatePatch("2026-10-26-x.json", patchFile("2026-10-26", [change({ after: "A" })])).join()).toMatch(/equal/);
		expect(validatePatch("2026-10-26-x.json", patchFile("2026-10-26", [])).join()).toMatch(/non-empty/);
		expect(validatePatch("2026-10-26-x.json", patchFile("2026-10-26", [change({ path: ["facts", {}] })])).join()).toMatch(/not a key/);
		const res = fixture("A", { "2026-10-26-a.json": patchFile("2026-10-26", [change({ path: "intro" })]) })();
		expect(res.status).toBe(1);
		expect(res.stderr).not.toMatch(/TypeError|at .*\.mjs/);
	});

	it("rejects two changes on one value, or on a value and its parent", () => {
		const same = patchFile("2026-10-26", [change(), change({ before: "B", after: "C" })]);
		expect(validatePatch("2026-10-26-x.json", same).join()).toMatch(/overlaps/);
		const parent = patchFile("2026-10-26", [change({ path: ["facts"] }), change({ path: ["facts", 0, "text"] })]);
		expect(validatePatch("2026-10-26-x.json", parent).join()).toMatch(/overlaps/);
	});

	it("addresses a list item by a one-key selector, and only when it is unique", () => {
		const doc = { facts: [{ key: "a", text: "1" }, { key: "b", text: "2" }] };
		expect(getAt(doc, ["facts", { key: "b" }, "text"])).toBe("2");
		expect(setAt(doc, ["facts", { key: "b" }, "text"], "3")).toEqual({ facts: [{ key: "a", text: "1" }, { key: "b", text: "3" }] });
		expect(getAt({ facts: [{ key: "a" }, { key: "a" }] }, ["facts", { key: "a" }])).toBeUndefined();
	});

	it("splices only the patched values and keeps the rest byte for byte", () => {
		const src = '{\n\t"content": {\n\t\t"layers": [\n\t\t\t{ "slug": "cache", "locale": "es", "data": { "facts": [ { "key": "h2-2", "text": "A" }, { "key": "x", "text": "A" } ] } }\n\t\t]\n\t}\n}\n';
		const out = seedApply(src, { changes: [change({ path: ["facts", { key: "h2-2" }, "text"] })] });
		expect(out).toBe(src.replace('"key": "h2-2", "text": "A"', '"key": "h2-2", "text": "B"'));
	});

	it("reverting one tracked change in the real seed is caught, and the patch restores it exactly", () => {
		const [{ patch }] = listPatches();
		const c = patch.changes[0];
		const node = seedSpan(parseWithSpans(SEED), c);
		const reverted = SEED.slice(0, node.start) + JSON.stringify(c.before) + SEED.slice(node.end);
		expect(reverted).not.toBe(SEED);
		expect(seedApply(reverted, patch)).toBe(SEED);
	});

	it("runs when reached through a symlink, instead of exiting 0 having done nothing", () => {
		const dir = mkdtempSync(join(tmpdir(), "content-patch-link-"));
		const link = join(dir, "content-patch.mjs");
		symlinkSync(SCRIPT, link);
		const res = spawnSync("node", [link, "no-such-command"], { cwd: ROOT, encoding: "utf8" });
		expect(res.status).toBe(1);
	});
});

/** The same shape listPatches returns, from an in-memory map. */
function listPatchesFrom(p: Record<string, unknown>) {
	return Object.entries(p)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([file, patch]) => ({ file, patch }));
}
