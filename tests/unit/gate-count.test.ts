/**
 * The number on the public page is derived, not remembered (#499).
 *
 * `/deconstruyendo` tells a reader how many steps a branch passes through
 * before a person is asked anything, and the review panel repeats the figure
 * as a chip. #305 made the `Summary` table in `ci.yml` the artifact that claim
 * is checked against, and left a comment asking whoever adds a gate to keep
 * the two in step.
 *
 * That comment failed four times. Measured on `main` for #499: twenty steps
 * could fail, the table listed sixteen, and the site said sixteen — the CSS
 * source budget (#475), `var()` resolution (#462), the layout invariants
 * (#453/#472) and locale field parity (#496) had all arrived without moving
 * the number. The last of those was added the same morning the drift was
 * found, by the same agent that had just read the comment.
 *
 * So the count is derived here instead. The source of truth is the workflow:
 * every `- name:` step that does not carry a `# not-a-gate:` marker is a step
 * that can refuse a branch. That polarity is deliberate — a new step counts as
 * a gate unless someone says otherwise, so forgetting the marker breaks this
 * test loudly, while forgetting to update the number (the actual historical
 * failure) breaks it too. There is no way to add a gate quietly any more.
 *
 * A unit test and not a twenty-first CI step, for the reason
 * `agent-boundary.test.ts` gives and which is sharper here than anywhere: a
 * step that checks the step count would change the step count it checks.
 *
 * What this does NOT check, stated so nobody reads more into a green: it
 * compares HOW MANY rows the table has, not what they say. A row whose prose
 * describes the wrong gate still passes. The row text is prose for a reader
 * and no gate can hold prose to its subject — that is what review is for.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

const WORKFLOW = read(".github", "workflows", "ci.yml");

/**
 * Steps are matched by their indentation, which is the file's own convention:
 * six spaces, `- name:`. A regex over YAML is a fair trade here only because
 * the alternative — a parser — would still have to be told which steps are
 * gates, and because a parse that silently finds nothing is guarded below.
 */
const STEP = /^ {6}- name: (.+)$/gm;

const steps = [...WORKFLOW.matchAll(STEP)].map((m) => m[1].trim());
const gates = steps.filter((name) => !name.includes("# not-a-gate:"));

/** Table rows, minus the header row — the gates as the report presents them. */
const summaryRows = [...WORKFLOW.matchAll(/^ *echo "\| (.+?) \| (.+?) \|"$/gm)]
	.filter(([, gate]) => gate !== "Gate");

const NUMBER_WORD: Record<number, { es: string; en: string }> = {
	16: { es: "dieciséis", en: "sixteen" },
	17: { es: "diecisiete", en: "seventeen" },
	18: { es: "dieciocho", en: "eighteen" },
	19: { es: "diecinueve", en: "nineteen" },
	20: { es: "veinte", en: "twenty" },
	// "veintiún", not "veintiuno": it stands before a masculine noun here.
	21: { es: "veintiún", en: "twenty-one" },
	22: { es: "veintidós", en: "twenty-two" },
	23: { es: "veintitrés", en: "twenty-three" },
	24: { es: "veinticuatro", en: "twenty-four" },
	25: { es: "veinticinco", en: "twenty-five" },
};

describe("the workflow is the source of the count", () => {
	/**
	 * A scan that matches nothing would make every assertion below vacuously
	 * true, and the file's indentation is a convention rather than a guarantee.
	 * This is the positive control: it fails if the scan has gone blind.
	 */
	it("actually found the steps", () => {
		expect(steps.length, "the `- name:` scan found nothing — check the indentation convention").toBeGreaterThan(15);
		expect(gates.length).toBeGreaterThan(10);
		expect(gates.length).toBeLessThan(steps.length);
	});

	it("has a row in the Summary table for each gate", () => {
		expect(summaryRows.length).toBe(gates.length);
	});

	it("says the number in the Summary heading", () => {
		expect(WORKFLOW).toContain(`## Quality gates — ${gates.length} steps that can fail`);
	});
});

describe("the public page says the same number", () => {
	const word = NUMBER_WORD[gates.length];

	it("has a word for this many gates", () => {
		expect(word, `no Spanish/English word listed for ${gates.length} — extend NUMBER_WORD`).toBeDefined();
	});

	it("in the prose the site renders, both locales", () => {
		const seed = read("seed", "seed.json");
		expect(seed).toContain(`la rama pasa por ${word.es} pasos que pueden fallar`);
		expect(seed).toContain(`the branch goes through ${word.en} steps that can fail`);
	});

	it("in the review panel's chips, both locales", () => {
		const seed = read("seed", "seed.json");
		expect(seed).toContain(`pasos que pueden fallar|${gates.length}`);
		expect(seed).toContain(`steps that can fail|${gates.length}`);
	});

	/**
	 * The markdown under `seed/content/pages/` is an authoring mirror and not
	 * what renders (#500). It is checked anyway: a mirror that disagrees with
	 * the seed is worse than no mirror, because the next person edits the file
	 * the issue points them at and their change does nothing.
	 */
	it("in the authoring mirror, which is not what renders", () => {
		expect(read("seed", "content", "pages", "es", "deconstruyendo.md"))
			.toContain(`la rama pasa por ${word.es} pasos que pueden fallar`);
		expect(read("seed", "content", "pages", "en", "deconstructing.md"))
			.toContain(`the branch goes through ${word.en} steps that can fail`);
	});
});
