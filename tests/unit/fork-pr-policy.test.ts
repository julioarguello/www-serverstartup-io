/**
 * The citability gate must keep refusing when it cannot see the list (#434).
 *
 * `scripts/ci-check-citability.py` distinguishes three answers on purpose:
 * 0 "clean", 1 "a forbidden name is in the tree", 3 "nobody can currently
 * tell". The third exists because an absent `FORBIDDEN_NAMES` secret and a
 * clean tree produce the same green, and only one of them is safe.
 *
 * A pull request from a fork gets no repository secrets, so it lands on the
 * third answer and shows red. The tempting fix — report the scan as skipped
 * and let the check pass — turns a correct red into a green over a tree
 * nobody scanned, on a public repository whose whole risk is client names.
 * #434 rejected it and took the other route: fork pull requests are not
 * accepted, Actions requires approval for every external contributor, and
 * `CONTRIBUTING.md` says so where an outside reader will read it.
 *
 * Forking cannot be switched off — GitHub answers 422, "Allow forks setting
 * can only be changed on org-owned private repositories" (measured
 * 2026-09-03) — so nothing in the platform enforces this. A policy that lives
 * in prose is a policy that drifts, and the drift here is silent: relaxing
 * the exit code would make every fork PR green and nothing would complain.
 *
 * A unit test and not a new CI step, deliberately, for the reason
 * `agent-boundary.test.ts` gives: the step count is quoted in the public copy
 * on /deconstruyendo, and `npm test` already runs on every pull request.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");

/**
 * The secret is cleared explicitly rather than merely left out: a maintainer's
 * shell has it exported, and inheriting it would run the real scan and pass
 * for the wrong reason — the test would then never fail, which is the failure
 * mode it exists to prevent.
 */
function runWithoutSecret() {
	return spawnSync("python3", [join(ROOT, "scripts", "ci-check-citability.py")], {
		cwd: ROOT,
		encoding: "utf8",
		env: { ...process.env, FORBIDDEN_NAMES: "", GITHUB_REPOSITORY: "julioarguello/www-serverstartup-io" },
	});
}

describe("citability gate, with no list to check against", () => {
	it("refuses rather than passing", () => {
		const { status } = runWithoutSecret();
		expect(status, "exit 0 here would make every fork PR green unscanned").toBe(3);
	});

	it("says why, and where the policy is written", () => {
		const { stderr } = runWithoutSecret();
		expect(stderr).toContain("FORBIDDEN_NAMES");
		expect(stderr).toContain("CONTRIBUTING.md");
	});
});

describe("the policy the gate's message points at", () => {
	it("is actually in CONTRIBUTING.md", () => {
		const doc = readFileSync(join(ROOT, "CONTRIBUTING.md"), "utf8");
		expect(doc).toContain("Pull requests from forks are not accepted");
	});
});
