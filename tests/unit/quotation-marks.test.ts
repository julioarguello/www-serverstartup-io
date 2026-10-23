/**
 * Each locale quotes in its own language (#641, founder 2026-10-23).
 *
 *   · ES: comillas angulares, «así». The RAE's first choice. “ ” only inside « ».
 *   · EN: curly double quotes, “like this”. ‘ ’ only inside “ ”.
 *   · Neither locale uses straight quotes "…" in prose.
 *
 * Exempt: a brand's own spelling (Toys“R”Us) and text that imitates a machine:
 * a stack trace or a terminal quotes the way the machine does. Neither of those
 * reaches the rendered baselines this test reads, so the brand is the only
 * exception it needs.
 *
 * It reads `tests/copy-baseline/*.txt`, the rendered words of every seed route.
 * `copy-baseline verify` already proves those files equal the live pages, so
 * this needs no stack.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIR = join(import.meta.dirname, "..", "copy-baseline");
const BRANDS = /Toys“R”Us/g;

export function offenders(text: string, locale: "es" | "en"): string[] {
	const t = text.replace(BRANDS, "");
	const foreign = locale === "es" ? /“[^”\n]{1,200}”/g : /«[^»\n]{1,200}»/g;
	const straight = /"[^"\n]{1,200}"/g;
	return [...(t.match(foreign) ?? []), ...(t.match(straight) ?? [])];
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".txt"));

describe("quotation marks follow the page's language", () => {
	it("reads every baseline (a sweep over nothing proves nothing)", () => {
		expect(files.length).toBeGreaterThanOrEqual(30);
		expect(files.filter((f) => f.startsWith("en")).length).toBeGreaterThanOrEqual(15);
	});

	it.each(files)("%s", (f) => {
		const locale = f === "en.txt" || f.startsWith("en__") ? "en" : "es";
		expect(offenders(readFileSync(join(DIR, f), "utf8"), locale)).toEqual([]);
	});
});

describe("controls — the check can fail", () => {
	it("reports Spanish quotes on an English page", () => {
		expect(offenders("He said «we fix it».", "en")).toEqual(["«we fix it»"]);
	});
	it("reports English quotes on a Spanish page", () => {
		expect(offenders("El lema era “+ Calidad − Cantidad”.", "es")).toEqual(["“+ Calidad − Cantidad”"]);
	});
	it("reports straight quotes in either language", () => {
		expect(offenders('Nobody will say "let me check".', "en")).toEqual(['"let me check"']);
		expect(offenders('Nadie dirá "lo miro".', "es")).toEqual(['"lo miro"']);
	});
	it("passes each language's own quotes and the brand", () => {
		expect(offenders("Dijo «lo arreglamos» en Toys“R”Us.", "es")).toEqual([]);
		expect(offenders("He said “we fix it”, at Toys“R”Us.", "en")).toEqual([]);
	});
});
