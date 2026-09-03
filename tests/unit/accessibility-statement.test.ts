/**
 * The two accessibility statements must say the same thing (#506).
 *
 * RD 1112/2018 art. 15 makes the declaration a dated legal assertion: a
 * conformance status and the day it was prepared. This site publishes it
 * twice — `/accesibilidad` and `/en/accessibility` — and the two are separate
 * entries in `seed/seed.json` edited by hand.
 *
 * The failure is the ordinary bilingual one: someone reviews the declaration,
 * updates the Spanish date, and the English copy keeps asserting a review that
 * did not happen on a day it did not happen. Nothing catches it. The copy
 * baseline compares each page against its own frozen text, so it freezes the
 * inconsistency as the new truth; axe cannot read a sentence; and the two
 * strings never appear in the same file, so no reviewer sees them side by side.
 *
 * So this pins the property that has to hold — the two locales agree on the
 * date and on the status — rather than the wording, which is Julio's to change.
 * The date is written the way each language writes dates, so it is parsed, not
 * string-compared.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");

interface Block {
	style?: string;
	children?: { text?: string }[];
}

const seed = JSON.parse(readFileSync(join(ROOT, "seed", "seed.json"), "utf8"));

/** The page's blocks flattened to one string per block. */
function blockTexts(pageId: string): string[] {
	const page = seed.content.pages.find((p: { id: string }) => p.id === pageId);
	if (!page) throw new Error(`no page ${pageId} in seed.json`);
	return (page.data.content as Block[]).map((b) =>
		(b.children ?? []).map((c) => c.text ?? "").join(""),
	);
}

const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MONTHS_EN = ["january","february","march","april","may","june","july","august","september","october","november","december"];

/**
 * The declaration date as `YYYY-MM-DD`, from either language's way of writing
 * it ("3 de septiembre de 2026" / "3 September 2026"). Returns null when no
 * date is stated at all — which is itself a finding, so the caller asserts on
 * it rather than this throwing.
 */
export function statementDate(texts: string[]): string | null {
	const joined = texts.join("\n");
	const es = /(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})/i.exec(joined);
	const en = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(joined);
	for (const [m, months] of [[es, MONTHS_ES], [en, MONTHS_EN]] as const) {
		if (!m) continue;
		const month = months.indexOf(m[2].toLowerCase());
		if (month < 0) continue;
		return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
	}
	return null;
}

/** Which of the three statuses RD 1112/2018 allows the text claims. */
export function conformanceStatus(texts: string[]): string | null {
	const joined = texts.join("\n").toLowerCase();
	if (/parcialmente conforme|partially conformant/.test(joined)) return "partial";
	if (/plenamente conforme|fully conformant/.test(joined)) return "full";
	if (/no conforme|non-conformant/.test(joined)) return "none";
	return null;
}

const ES = blockTexts("page-accesibilidad");
const EN = blockTexts("page-accesibilidad-en");

describe("the accessibility statement", () => {
	it("states a date in both locales", () => {
		expect(statementDate(ES)).not.toBeNull();
		expect(statementDate(EN)).not.toBeNull();
	});

	it("states the SAME date in both locales", () => {
		expect(statementDate(EN)).toBe(statementDate(ES));
	});

	it("states a conformance status RD 1112/2018 recognises, in both locales", () => {
		expect(ES.some((t) => /declaración de accesibilidad/i.test(t))).toBe(true);
		expect(EN.some((t) => /accessibility statement/i.test(t))).toBe(true);
		expect(conformanceStatus(ES)).not.toBeNull();
	});

	it("states the SAME status in both locales", () => {
		expect(conformanceStatus(EN)).toBe(conformanceStatus(ES));
	});
});

describe("controls — the check can fail", () => {
	it("reports a date that drifted between locales", () => {
		// The real regression: the Spanish copy is reviewed, the English is not.
		const stale = EN.map((t) => t.replace("3 September 2026", "14 April 2025"));
		expect(statementDate(stale)).toBe("2025-04-14");
		expect(statementDate(stale)).not.toBe(statementDate(ES));
	});

	it("reports a status that drifted between locales", () => {
		const upgraded = EN.map((t) => t.replace("partially conformant", "fully conformant"));
		expect(conformanceStatus(upgraded)).toBe("full");
		expect(conformanceStatus(upgraded)).not.toBe(conformanceStatus(ES));
	});

	it("reports a declaration with no date at all", () => {
		expect(statementDate(["Sin fecha ninguna."])).toBeNull();
	});
});
