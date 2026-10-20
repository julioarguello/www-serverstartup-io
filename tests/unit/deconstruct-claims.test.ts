/**
 * The numbers /deconstruyendo shows are derived, not remembered (#535).
 *
 * The quality plate shows three figures besides the gate count (which
 * gate-count.test.ts owns): how many routes have their rendered text frozen,
 * and the four Lighthouse thresholds. Each is typed into the seed, because the
 * page is content, and each has an owner elsewhere in the repository. A typed
 * copy of a fact that has an owner drifts the day the owner changes — the old
 * page said "26 rutas" for weeks after there were 28. So each one is checked
 * against its owner here, both locales, with a vacuum guard so a page that
 * stops saying the number cannot pass by saying nothing.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const seed = JSON.parse(readFileSync(join(ROOT, "seed", "seed.json"), "utf8"));
const layers: { locale: string; data: Record<string, unknown> }[] = seed.content.layers ?? [];

function strings(locale: string): string[] {
	const out: string[] = [];
	const walk = (v: unknown): void => {
		if (typeof v === "string") out.push(v);
		else if (Array.isArray(v)) v.forEach(walk);
		else if (v && typeof v === "object") Object.values(v).forEach(walk);
	};
	for (const e of layers) if (e.locale === locale) walk(e.data);
	return out;
}

function numbersBefore(list: string[], noun: string): number[] {
	const re = new RegExp(`(\\d+)\\s+${noun}\\b`, "g");
	return list.flatMap((s) => [...s.matchAll(re)].map((m) => Number(m[1])));
}

describe("frozen routes: the copy baseline is the owner", () => {
	const frozen = readdirSync(join(ROOT, "tests", "copy-baseline")).filter((f) => f.endsWith(".txt")).length;

	it("found the baseline", () => {
		expect(frozen).toBeGreaterThan(20);
	});

	it.each([
		["es", "rutas"],
		["en", "routes"],
	])("%s says the same number", (locale, noun) => {
		// in prose ("30 rutas") and as a figure on a plate, whose number and label are separate fields
		const figures = layers
			.filter((e) => e.locale === locale)
			.flatMap((e) => ((e.data.stats as { value: string; label: string }[]) ?? []))
			.filter((s) => s.label.startsWith(noun))
			.map((s) => Number(s.value));
		const said = [...numbersBefore(strings(locale), noun), ...figures];
		expect(said.length, `no '<n> ${noun}' in the ${locale} layers`).toBeGreaterThanOrEqual(2);
		expect(new Set(said)).toEqual(new Set([frozen]));
	});
});

describe("Lighthouse: lighthouserc.json is the owner", () => {
	const rc = JSON.parse(readFileSync(join(ROOT, "lighthouserc.json"), "utf8"));
	const assertions = rc.ci.assert.assertions as Record<string, [string, { minScore: number }]>;
	const order = ["performance", "accessibility", "best-practices", "seo"];
	const expected = order.map((c) => {
		const min = assertions[`categories:${c}`][1].minScore;
		return min < 1 ? `≥${Math.round(min * 100)}` : "100";
	});

	it.each(["es", "en"])("%s shows the thresholds the CI enforces, in order", (locale) => {
		const quality = layers.find((e) => e.locale === locale && e.data.figure === "calidad");
		expect(quality, `no quality layer in ${locale}`).toBeDefined();
		const rings = ((quality!.data.stats as { value: string; kind?: string }[]) ?? [])
			.filter((s) => s.kind === "ring")
			.map((s) => s.value);
		expect(rings).toEqual(expected);
	});
});
