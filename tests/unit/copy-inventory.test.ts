/**
 * The copy inventory (#577) reads every string the site renders out of the
 * seed. It is generated on demand and not tracked; the Tier 1 scores in
 * docs/copy/ are keyed by each string's hash, so they are only valid while
 * that hash is still in the inventory.
 *
 * An inventory is how a review decides it is complete, so a quiet miss is the
 * failure that matters. If a selector stops matching (the home's kicker read by
 * position, a renamed widget), the run would not fail; it would report fewer
 * rows. So the controls name expected values, not just non-emptiness.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const SCRIPT = join(ROOT, "scripts", "copy-inventory.py");

const run = (...args: string[]) => spawnSync("python3", [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8" });
const parse = (tsv: string) =>
	tsv
		.trim()
		.split("\n")
		.slice(1)
		.map((l) => l.split("\t"))
		.map(([tier, source, entry, slot, key, locale]) => ({ tier, source, entry, slot, key, locale }));

describe("copy inventory", () => {
	const res = run();
	const rows = parse(res.stdout);

	it("runs clean over the seed", () => {
		expect(res.status).toBe(0);
	});

	it("finds the home's two kicker blocks and six card lines in each locale", () => {
		for (const locale of ["es", "en"]) {
			expect(rows.filter((r) => r.entry === "home" && r.slot === "content" && r.tier === "1" && r.locale === locale).length).toBeGreaterThanOrEqual(2);
			expect(rows.filter((r) => r.slot === "hero_line" && r.locale === locale).length).toBe(6);
			expect(rows.filter((r) => r.source === "services" && r.slot === "excerpt" && r.locale === locale).length).toBe(6);
		}
	});

	it("puts every tier to use", () => {
		for (const tier of ["1", "2", "3"]) expect(rows.some((r) => r.tier === tier)).toBe(true);
	});

	it("exits 3 on a seed it cannot read, instead of printing an empty inventory", () => {
		const dir = mkdtempSync(join(tmpdir(), "copy-inventory-"));
		const empty = join(dir, "seed.json");
		writeFileSync(empty, JSON.stringify({ content: {}, widgetAreas: [], menus: [], settings: {} }));
		expect(run(empty).status).toBe(3);
	});

	it("lists a Tier 1 string with no score as unscored, and a scored one as not", () => {
		const first = res.stdout.split("\n").find((l) => l.startsWith("1\t"));
		expect(first).toBeTruthy();
		const hash = first!.split("\t")[8];
		const dir = mkdtempSync(join(tmpdir(), "copy-scores-"));
		const scores = join(dir, "scores.tsv");
		writeFileSync(scores, `hash\tlocale\n${hash}\tes\n`);
		const out = run("--unscored", scores).stdout;
		expect(out).not.toContain(hash);
		expect(out.trim().split("\n").length).toBeGreaterThan(1);
	});
});
