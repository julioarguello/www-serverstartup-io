/**
 * The guard that stands between `seed_d1` and the production database (#358).
 *
 * It had no test. The script itself advertises a `--decide` entry point
 * "so the decision table can be proven without a database", and nothing ever
 * proved it — which is how the following survived to the first real dispatch
 * (#162): the table-list query printed an empty string when it failed *and*
 * when it succeeded with no rows, and the caller read that one empty string as
 * "unreadable". A production database whose collection tables do not exist yet
 * was therefore refused as if the API token were missing.
 *
 * That is the exact case the switch exists for. The guard's own decision table
 * says "0 content rows → pre-launch, allow: there is nothing to lose", and that
 * branch was unreachable on a virgin schema.
 *
 * So both halves are asserted here: the decision table, and the three-way read
 * (unreadable / empty / populated). The refusals matter as much as the
 * allowances — a guard that cannot refuse is worse than no guard, so every
 * refusing case is a positive control for the allowing ones.
 *
 * `npx` is stubbed rather than mocked at a module boundary: the script is
 * bash, and what it actually depends on is the shape of `wrangler --json`
 * output. A stub that answers in that shape tests the parsing that broke.
 */
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const GUARD = join(import.meta.dirname, "..", "..", "scripts", "ci-guard-prod-seed.sh");
const CONFIRMATION = "OVERWRITE PRODUCTION CONTENT";

interface Result {
	status: number;
	stdout: string;
	stderr: string;
}

/**
 * Runs the guard. Never throws on a non-zero exit: refusal is exit 1 by design
 * and is the outcome under test, so it has to be readable rather than fatal.
 */
function run(args: string[], stubPath?: string): Result {
	try {
		const stdout = execFileSync("bash", [GUARD, ...args], {
			encoding: "utf8",
			env: stubPath ? { ...process.env, PATH: `${stubPath}:${process.env.PATH}` } : process.env,
			stdio: ["ignore", "pipe", "pipe"],
		});
		return { status: 0, stdout, stderr: "" };
	} catch (err) {
		const e = err as { status?: number; stdout?: string; stderr?: string };
		return { status: e.status ?? -1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
	}
}

/**
 * Writes an `npx` that answers the two queries the guard makes, in wrangler's
 * `--json` shape. `tables` null means the query itself fails.
 */
function stubNpx(opts: { tables?: string[] | null; rows?: number; success?: boolean; raw?: string }): string {
	const dir = mkdtempSync(join(tmpdir(), "guard-stub-"));
	const tablesJson =
		opts.raw !== undefined
			? opts.raw
			: JSON.stringify([
					{
						success: opts.success ?? true,
						results: (opts.tables ?? []).map((name) => ({ name })),
					},
				]);
	const countJson = JSON.stringify([{ success: true, results: [{ c: opts.rows ?? 0 }] }]);
	writeFileSync(
		join(dir, "npx"),
		`#!/usr/bin/env bash\n` +
			`for a in "$@"; do case "$a" in\n` +
			`  *sqlite_master*) cat <<'JSON'\n${tablesJson}\nJSON\n    exit 0 ;;\n` +
			`  *count*) cat <<'JSON'\n${countJson}\nJSON\n    exit 0 ;;\n` +
			`esac; done\nexit 0\n`,
		{ mode: 0o755 },
	);
	chmodSync(join(dir, "npx"), 0o755);
	return dir;
}

describe("the decision table, proven without a database", () => {
	it("allows when the database holds nothing", () => {
		const r = run(["--decide", "0"]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("ALLOW");
	});

	it("refuses when rows are present and nothing was typed", () => {
		const r = run(["--decide", "7"]);
		expect(r.status).toBe(1);
		expect(r.stderr).toContain("7 content row(s)");
	});

	it("allows when rows are present and the confirmation was typed exactly", () => {
		const r = run(["--decide", "7", CONFIRMATION]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("ALLOW");
	});

	it("refuses a confirmation that differs only in case", () => {
		const r = run(["--decide", "7", CONFIRMATION.toLowerCase()]);
		expect(r.status).toBe(1);
	});
});

describe("reading the schema: empty is not the same answer as unreadable", () => {
	it("allows a schema with no collection tables — the pre-launch case (#162)", () => {
		const r = run(["db"], stubNpx({ tables: [] }));
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("no ec_ collection table exists");
		expect(r.stdout).toContain("ALLOW");
	});

	it("allows collection tables that exist but are empty", () => {
		const r = run(["db"], stubNpx({ tables: ["ec_pages", "ec_posts"], rows: 0 }));
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("ec_pages");
		expect(r.stdout).toContain("ALLOW");
	});

	it("refuses when the collection tables hold content", () => {
		const r = run(["db"], stubNpx({ tables: ["ec_pages", "ec_posts"], rows: 12 }));
		expect(r.status).toBe(1);
		expect(r.stderr).toContain("24 content row(s)");
	});

	it("refuses a query that reports failure, however well-formed its JSON", () => {
		const r = run(["db"], stubNpx({ tables: [], success: false }));
		expect(r.status).toBe(1);
		expect(r.stderr).toContain("could not read the table list");
	});

	it("refuses when nothing comes back at all", () => {
		const r = run(["db"], stubNpx({ raw: "" }));
		expect(r.status).toBe(1);
		expect(r.stderr).toContain("could not read the table list");
	});

	it("refuses output that is not the shape wrangler produces", () => {
		const r = run(["db"], stubNpx({ raw: "Authentication error [code: 10000]" }));
		expect(r.status).toBe(1);
		expect(r.stderr).toContain("could not read the table list");
	});
});
