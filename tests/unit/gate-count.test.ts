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
 * DISTINCT names, since #515. The workflow now runs on four runners, and
 * `Build` and `Boot seeded local stack` happen on three of them. Counting
 * occurrences would have made the site claim twenty-four gates the moment the
 * split landed. Distinct is also what the sentence on the page means: a gate
 * run on three runners is one gate, and it refuses the branch once.
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
import { distinctGates, gateNames, stepNames } from "../../scripts/lib/gates.mjs";
import { computeBadges } from "../../scripts/badges.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

const WORKFLOW = read(".github", "workflows", "ci.yml");

/** A job header: two spaces, a name, a colon, nothing else on the line. */
const JOB = /^ {2}([a-z][a-z0-9_-]*):$/gm;

/**
 * Gate names grouped by the job they appear in, so a name repeated ACROSS jobs
 * (deliberate: the same build on three runners) can be told apart from one
 * repeated WITHIN a job (a copy-paste that runs a gate twice for no reason).
 */
export function jobBlocks(workflow: string): [string, string][] {
	const bounds = [...workflow.matchAll(JOB)];
	return bounds.map((m, i) => [
		m[1],
		workflow.slice(m.index!, bounds[i + 1]?.index ?? workflow.length),
	]);
}

export function gatesByJob(workflow: string): Map<string, string[]> {
	return new Map(jobBlocks(workflow).map(([job, body]) => [job, gateNames(body)]));
}

/**
 * Gates that run against a booted stack without `scripts/ci-gate.mjs`, as
 * `job: step`. Such a gate goes red on the upstream wrangler crash and costs a
 * manual re-run — the two deaths measured after #524 were both in the one
 * gate left outside it (#540).
 */
export function unwrappedStackGates(workflow: string): string[] {
	return jobBlocks(workflow).flatMap(([job, body]) => {
		const boot = body.indexOf("- name: Boot seeded local stack");
		if (boot < 0) return [];
		return body
			.slice(boot)
			.split(/^(?= {6}- name: )/m)
			.slice(1)
			.filter((step) => !/^ {6}- name: .*# not-a-gate:/.test(step))
			.filter((step) => !step.includes("shell: node scripts/ci-gate.mjs"))
			.map((step) => `${job}: ${step.match(/^ {6}- name: (.+)$/m)![1].trim()}`);
	});
}

const steps = stepNames(WORKFLOW);
const gates = distinctGates(WORKFLOW);

/** Table rows, minus the header row — the gates as the report presents them. */
const summaryRows = [...WORKFLOW.matchAll(/^ *echo "\| (.+?) \| (.+?) \|"$/gm)]
	.filter(([, gate]) => gate !== "Gate");

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

describe("the same gate on several runners is still one gate (#515)", () => {
	const byJob = gatesByJob(WORKFLOW);

	it("found the jobs", () => {
		// Same vacuum guard as above: an indentation change that finds no job
		// would make the two assertions below pass with nothing behind them.
		expect([...byJob.keys()]).toEqual(
			expect.arrayContaining(["scope", "static", "rendered", "a11y", "perf", "report"]),
		);
	});

	it("counts a repeated gate once", () => {
		// Not a tautology: `gateNames` is longer than `distinctGates` today,
		// because build and boot happen on three runners. If that stops being
		// true the dedup is dead code and this says so.
		expect(gateNames(WORKFLOW).length).toBeGreaterThan(gates.length);
	});

	it("gates every stack-booting job on the scope decision (#497 must survive)", () => {
		// The saving in #515 is concurrency; the saving in #497 was not running
		// the rendered-output gates at all on a PR that cannot reach a page.
		// Splitting one job into four is exactly how the second one gets lost:
		// the per-step `if:` becomes a job-level `if:` and a job that forgets it
		// boots a stack on a README edit. `static` is deliberately not in here —
		// it runs always, and gates its own steps.
		const ungated = jobBlocks(WORKFLOW)
			.filter(([, body]) => body.includes("- name: Boot seeded local stack"))
			.filter(([, body]) => !body.includes("if: needs.scope.outputs.site == 'true'"))
			.map(([job]) => job);
		expect(ungated).toEqual([]);
	});

	it("runs every gate after a stack boot through ci-gate.mjs (#524, #540)", () => {
		expect(unwrappedStackGates(WORKFLOW)).toEqual([]);
	});

	it("never runs the same gate twice inside one job", () => {
		// Repetition across jobs is the design. Repetition within a job is a
		// paste, and costs wall clock on the runner that can least afford it.
		const doubled = [...byJob.entries()]
			.filter(([, names]) => new Set(names).size !== names.length)
			.map(([job]) => job);
		expect(doubled).toEqual([]);
	});
});

describe("controls — the count can be wrong", () => {
	const FAKE = [
		"jobs:",
		"  one:",
		"    steps:",
		"      - name: Build",
		"      - name: Install  # not-a-gate: dependency install, not a check",
		"      - name: Accessibility",
		"  two:",
		"    steps:",
		"      - name: Build",
		"      - name: Lighthouse assertions",
		"",
	].join("\n");

	it("ignores the steps marked not-a-gate", () => {
		expect(stepNames(FAKE)).toHaveLength(5);
		expect(gateNames(FAKE)).toEqual(["Build", "Accessibility", "Build", "Lighthouse assertions"]);
	});

	it("counts the build shared by two jobs once", () => {
		expect(distinctGates(FAKE)).toEqual(["Build", "Accessibility", "Lighthouse assertions"]);
	});

	it("reports a stack-booting job that forgot the scope gate", () => {
		const careless = [
			"jobs:",
			"  scope:",
			"    steps:",
			"      - name: Scope  # not-a-gate: fails open",
			"  a11y:",
			"    steps:",
			"      - name: Boot seeded local stack",
			"      - name: Accessibility",
			"",
		].join("\n");
		const ungated = jobBlocks(careless)
			.filter(([, body]) => body.includes("- name: Boot seeded local stack"))
			.filter(([, body]) => !body.includes("if: needs.scope.outputs.site == 'true'"))
			.map(([job]) => job);
		expect(ungated).toEqual(["a11y"]);
	});

	it("reports a gate after the stack boot that runs outside ci-gate.mjs", () => {
		const bare = [
			"jobs:",
			"  perf:",
			"    steps:",
			"      - name: Build",
			"      - name: Boot seeded local stack",
			"        run: scripts/ci-local-stack.sh 8787",
			"      - name: Shard  # not-a-gate: writes a config",
			"      - name: Copy baseline",
			"        shell: node scripts/ci-gate.mjs bash -e {0}",
			"      - name: Lighthouse assertions",
			"        uses: treosh/lighthouse-ci-action@v12",
			"",
		].join("\n");
		expect(unwrappedStackGates(bare)).toEqual(["perf: Lighthouse assertions"]);
	});

	it("reports a gate pasted twice into the same job", () => {
		const pasted = FAKE.replace(
			"      - name: Accessibility",
			"      - name: Accessibility\n      - name: Accessibility",
		);
		const doubled = [...gatesByJob(pasted).entries()]
			.filter(([, names]) => new Set(names).size !== names.length)
			.map(([job]) => job);
		expect(doubled).toEqual(["one"]);
	});
});

/**
 * Every string of the `layers` collection in one locale (#535): the page now
 * says the number as a figure on the quality plate, in the map's note, in the
 * index's summary and in the delivery fact, so the test reads all of them
 * rather than one sentence that could move.
 *
 * A figure card (`{ value, label }`) is read the way the page shows it, value
 * then label: «26» and «pasos que pueden fallar» are two strings in the seed
 * and one claim on the page. Read apart, the bare value escaped this test, and
 * the quality plate's card was the one place a gate added in #644 would have
 * left the old number.
 */
export function layerStrings(locale: string, seed = JSON.parse(read("seed", "seed.json"))): string[] {
	const out: string[] = [];
	const walk = (v: unknown): void => {
		if (typeof v === "string") out.push(v);
		else if (Array.isArray(v)) v.forEach(walk);
		else if (v && typeof v === "object") {
			const { value, label } = v as { value?: unknown; label?: unknown };
			if (typeof value === "string" && typeof label === "string") out.push(`${value} ${label}`);
			Object.values(v).forEach(walk);
		}
	};
	for (const e of seed.content.layers ?? []) if (e.locale === locale) walk(e.data);
	return out;
}

/** The number that precedes a noun, in every string that uses it: "24 pasos", "24 steps". */
function numbersBefore(strings: string[], noun: string): number[] {
	const re = new RegExp(`(\\d+)\\s+${noun}\\b`, "g");
	return strings.flatMap((s) => [...s.matchAll(re)].map((m) => Number(m[1])));
}

describe("the README badge publishes the same number (#600)", () => {
	it("scripts/badges.mjs counts the gates this test counts", () => {
		expect(computeBadges(ROOT).gates.message).toBe(String(gates.length));
	});
});

describe("the public page says the same number", () => {
	it("everywhere it says it, both locales", () => {
		const es = numbersBefore(layerStrings("es"), "pasos");
		const en = numbersBefore(layerStrings("en"), "steps");
		// vacuum guard: a page that stopped saying the number at all would pass
		expect(es.length, "no '<n> pasos' left in the ES layers").toBeGreaterThanOrEqual(3);
		expect(en.length, "no '<n> steps' left in the EN layers").toBeGreaterThanOrEqual(3);
		expect(new Set(es)).toEqual(new Set([gates.length]));
		expect(new Set(en)).toEqual(new Set([gates.length]));
	});

	it("a planted wrong number is caught", () => {
		expect(numbersBefore(["pasa 23 pasos que pueden fallar", "24 pasos · Lighthouse"], "pasos")).toEqual([23, 24]);
	});

	it("a wrong number on a figure card is caught", () => {
		const seed = {
			content: {
				layers: [
					{ locale: "es", data: { stats: [{ value: "23", label: "pasos que pueden fallar", kind: "number" }] } },
				],
			},
		};
		expect(numbersBefore(layerStrings("es", seed), "pasos")).toEqual([23]);
	});
});
