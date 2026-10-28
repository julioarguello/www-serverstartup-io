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
import { chains, getAt, listPatches, parseWithSpans, seedApply, seedSpan, setAt, validatePatch, valueAt } from "../../scripts/content-patch.mjs";

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

const blocks = (...texts: string[]) => texts.map((t, i) => ({ _type: "block", style: "normal", _key: `k${i}`, children: [{ _type: "span", text: t }] }));
const widgetChange = (over: Record<string, unknown> = {}) => ({
	widgetArea: "ui_labels_es",
	widget: "consent",
	path: ["content"],
	before: null,
	after: blocks("Aceptar"),
	...over,
});
const widgetSeed = (widgets: unknown[]) => `${JSON.stringify({ widgetAreas: [{ name: "ui_labels_es", widgets }] }, null, "\t")}\n`;

/** A throwaway seed holding one widget area, and a patch directory, for `check`. */
function widgetFixture(widgets: unknown[], patches: Record<string, unknown>) {
	const dir = mkdtempSync(join(tmpdir(), "content-patch-widget-"));
	const seed = join(dir, "seed.json");
	writeFileSync(seed, widgetSeed(widgets));
	const pdir = join(dir, "patches");
	mkdirSync(pdir);
	for (const [name, p] of Object.entries(patches)) writeFileSync(join(pdir, name), JSON.stringify(p));
	return () => run("check", "--seed", seed, "--patches", pdir);
}

describe("widget patches (#667)", () => {
	const existing = { type: "content", title: "footer_headings", content: blocks("La casa") };

	it("validates the widget shape: whole content, a list of blocks, null only for a widget not yet created", () => {
		const ok = (c: unknown) => validatePatch("2026-10-27-w.json", patchFile("2026-10-27", [c]));
		expect(ok(widgetChange())).toEqual([]);
		expect(ok(widgetChange({ before: blocks("A"), after: blocks("B") }))).toEqual([]);
		expect(ok(widgetChange({ path: ["content", 0] })).join()).toMatch(/must be \["content"\]/);
		expect(ok(widgetChange({ after: "Aceptar" })).join()).toMatch(/list of blocks/);
		expect(ok(widgetChange({ before: "x" })).join()).toMatch(/or null/);
		expect(ok(widgetChange({ collection: "pages" })).join()).toMatch(/not both/);
	});

	it("check fails while the seed lacks a created widget, and passes once `seed` has appended it", () => {
		const p = { "2026-10-27-w.json": patchFile("2026-10-27", [widgetChange()]) };
		const before = widgetFixture([existing], p)();
		expect(before.status).toBe(1);
		expect(before.stderr).toMatch(/does not hold the target of widget ui_labels_es\/consent/);
		const appended = JSON.parse(seedApply(widgetSeed([existing]), p["2026-10-27-w.json"]));
		expect(widgetFixture(appended.widgetAreas[0].widgets, p)().status).toBe(0);
	});

	it("appends a new widget after the last one, keeping every byte before it", () => {
		const src = widgetSeed([existing]);
		const out = seedApply(src, { changes: [widgetChange()] });
		const widgets = parseWithSpans(src).entries[0][1].items[0].entries.find(([k]: [string]) => k === "widgets")[1];
		const lastEnd = widgets.items.at(-1).end;
		expect(out.slice(0, lastEnd)).toBe(src.slice(0, lastEnd));
		expect(out.slice(-12)).toBe(src.slice(-12));
		expect(JSON.parse(out).widgetAreas[0].widgets).toEqual([existing, { type: "content", title: "consent", content: blocks("Aceptar") }]);
		// indented like its sibling
		expect(out).toMatch(/\n\t\t\t\t\{\n\t\t\t\t\t"type": "content",\n\t\t\t\t\t"title": "consent"/);
	});

	it("replaces an existing widget's content and nothing else", () => {
		const src = widgetSeed([existing]);
		const c = widgetChange({ widget: "footer_headings", before: blocks("La casa"), after: blocks("La casa", "Cookies") });
		const out = seedApply(src, { changes: [c] });
		expect(JSON.parse(out).widgetAreas[0].widgets).toEqual([{ ...existing, content: blocks("La casa", "Cookies") }]);
		expect(() => seedApply(src, { changes: [{ ...c, before: blocks("otra cosa") }] })).toThrow(/neither/);
	});

	it("chains a creation and a later edit: null → A → B targets B", () => {
		const p = {
			"2026-10-27-a.json": patchFile("2026-10-27", [widgetChange()]),
			"2026-11-02-b.json": patchFile("2026-11-02", [widgetChange({ before: blocks("Aceptar"), after: blocks("Aceptar todo") })]),
		};
		const { chains: all, problems } = chains(listPatchesFrom(p));
		expect(problems).toEqual([]);
		expect(all[0].states).toEqual([null, blocks("Aceptar"), blocks("Aceptar todo")]);
		expect(widgetFixture([existing, { type: "content", title: "consent", content: blocks("Aceptar todo") }], p)().status).toBe(0);
	});

	it("creates a widget in the real seed as valid JSON, changing nothing else", () => {
		const out = seedApply(SEED, { changes: [widgetChange({ widget: "zz_probe" })] });
		const doc = JSON.parse(SEED);
		doc.widgetAreas.find((a: { name: string }) => a.name === "ui_labels_es").widgets.push({ type: "content", title: "zz_probe", content: blocks("Aceptar") });
		expect(JSON.parse(out)).toEqual(doc);
	});
});

const item = { key: "h7-7", text: "Nuevo", status: "ok" };
const itemChange = (over: Record<string, unknown> = {}) => change({ path: ["facts", { key: "h7-7" }], before: null, after: item, ...over });
const itemSeed = (facts: unknown[]) => `${JSON.stringify({ content: { layers: [{ slug: "cache", locale: "es", data: { intro: "A", facts } }] } }, null, "\t")}\n`;
const existingFact = { key: "h7-1", text: "Uno", status: "ok" };

describe("list items created by a patch (#685)", () => {
	it("validates a created item: an object whose selector field matches, one per list in a patch", () => {
		const ok = (...cs: unknown[]) => validatePatch("2026-10-28-i.json", patchFile("2026-10-28", cs));
		expect(ok(itemChange())).toEqual([]);
		expect(ok(itemChange({ after: { ...item, key: "h7-8" } })).join()).toMatch(/whose "key" is "h7-7"/);
		expect(ok(itemChange({ after: "Nuevo" })).join()).toMatch(/must be an object/);
		const second = itemChange({ path: ["facts", { key: "h7-8" }], after: { ...item, key: "h7-8" } });
		expect(ok(itemChange(), second).join()).toMatch(/at most one item per list/);
	});

	it("reads an absent item as null, and an ambiguous or missing list as nothing", () => {
		const doc = { facts: [existingFact] };
		expect(valueAt(doc, ["facts", { key: "h7-7" }])).toBeNull();
		expect(valueAt(doc, ["facts", { key: "h7-1" }])).toEqual(existingFact);
		expect(valueAt({ facts: [item, item] }, ["facts", { key: "h7-7" }])).toBeUndefined();
		expect(valueAt({}, ["facts", { key: "h7-7" }])).toBeUndefined();
		expect(valueAt(doc, ["facts", { key: "h7-7" }, "text"])).toBeUndefined();
	});

	it("setAt appends an absent item, and still refuses a missing path elsewhere", () => {
		expect(setAt({ facts: [existingFact] }, ["facts", { key: "h7-7" }], item)).toEqual({ facts: [existingFact, item] });
		expect(() => setAt({ facts: [existingFact] }, ["facts", { key: "h7-7" }, "text"], "x")).toThrow(/not found/);
		expect(() => setAt({}, ["facts", { key: "h7-7" }], item)).toThrow(/not found/);
	});

	it("check fails while the seed lacks the item, and passes once `seed` has appended it", () => {
		const p = { "2026-10-28-i.json": patchFile("2026-10-28", [itemChange()]) };
		const checkWith = (src: string) => {
			const dir = mkdtempSync(join(tmpdir(), "content-patch-item-"));
			writeFileSync(join(dir, "seed.json"), src);
			mkdirSync(join(dir, "patches"));
			writeFileSync(join(dir, "patches", "2026-10-28-i.json"), JSON.stringify(p["2026-10-28-i.json"]));
			return run("check", "--seed", join(dir, "seed.json"), "--patches", join(dir, "patches"));
		};
		const src = itemSeed([existingFact]);
		const before = checkWith(src);
		expect(before.status).toBe(1);
		expect(before.stderr).toMatch(/does not hold the target of layers\/cache/);
		const out = seedApply(src, p["2026-10-28-i.json"]);
		expect(checkWith(out).status).toBe(0);
		// appended after the last item, indented like it, every byte before it kept
		const list = seedSpan(parseWithSpans(src), itemChange()).list;
		const lastEnd = list.items.at(-1).end;
		expect(out.slice(0, lastEnd)).toBe(src.slice(0, lastEnd));
		expect(JSON.parse(out).content.layers[0].data.facts).toEqual([existingFact, item]);
		expect(out).toMatch(/\t\},\n\t{6}\{\n\t{7}"key": "h7-7"/);
		// applying it again changes nothing
		expect(seedApply(out, p["2026-10-28-i.json"])).toBe(out);
	});

	it("refuses to create an item a seed already holds with different content", () => {
		const src = itemSeed([existingFact, { ...item, text: "Otro" }]);
		expect(() => seedApply(src, { changes: [itemChange()] })).toThrow(/neither/);
	});

	it("chains a creation and a later edit of the whole item: null → A → B targets B", () => {
		const edited = { ...item, text: "Editado" };
		const p = {
			"2026-10-28-a.json": patchFile("2026-10-28", [itemChange()]),
			"2026-11-02-b.json": patchFile("2026-11-02", [itemChange({ before: item, after: edited })]),
		};
		const { chains: all, problems } = chains(listPatchesFrom(p));
		expect(problems).toEqual([]);
		expect(all[0].states).toEqual([null, item, edited]);
		// an edit of one field of the created item would be a value and its parent
		const child = { "2026-11-02-b.json": patchFile("2026-11-02", [change({ path: ["facts", { key: "h7-7" }, "text"], before: "Nuevo", after: "Editado" })]) };
		expect(chains(listPatchesFrom({ ...p, ...child })).problems.join()).toMatch(/never a value and its parent/);
	});
});

/** The same shape listPatches returns, from an in-memory map. */
function listPatchesFrom(p: Record<string, unknown>) {
	return Object.entries(p)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([file, patch]) => ({ file, patch }));
}
