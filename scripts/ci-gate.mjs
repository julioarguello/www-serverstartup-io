#!/usr/bin/env node
/**
 * Run one gate. If the stack died UNDER it from the known upstream crash,
 * reboot once, loudly, and run it again (#524).
 *
 * `wrangler dev` treats an error scoped to a single in-flight request as fatal:
 * it kills the dev server and exits, so every check after that point fails on a
 * route that has nothing wrong with it. Upstream, open, not ours —
 * cloudflare/workers-sdk#15317, with the fix still in review as
 * cloudflare/workers-sdk#15448 and cloudflare/workers-sdk#15207. Neither
 * 4.128.0 nor 4.129.0 carries it, and dropping the pin to the 4.113.0 some
 * reporters run is fourteen minors backwards under Astro 7.
 *
 * #390 landed the half that makes the crash LEGIBLE and deliberately stopped
 * there: "This adds information and nothing else. It does not retry." This is
 * the other half, and it is bounded so that the first half keeps its meaning.
 *
 * Why now: before #515 a run booted ONE `wrangler dev`. It now boots seven —
 * one in `rendered`, one in `a11y`, five across the `perf` matrix. The
 * per-stack crash rate is unchanged; the number of dice per run is not.
 *
 * ── What keeps this from becoming a blanket retry ────────────────────────────
 *
 * A retry that fires on any red is how a real regression becomes a flake, so
 * every one of these is load-bearing:
 *
 *   - ONLY this fault. `proxyCrashDeath` demands both that the stack has
 *     stopped answering AND that wrangler's debug log names a ProxyController
 *     cause. A gate that fails while the stack is up — an actual finding — is
 *     re-run never, and exits with its own code untouched.
 *   - ONCE PER JOB, not per step. The marker lives in $RUNNER_TEMP, which
 *     persists across the steps of one job and dies with it. A job whose stack
 *     dies twice goes red, because twice is not bad luck.
 *   - LOUDLY. A `::warning::` annotation on the run, the cause printed, and a
 *     row in the job summary. The rate this thing actually fires at has to be
 *     readable off the runs, or the next person weighing an upgrade is guessing
 *     the way #390 had to.
 *   - The gate is re-run WHOLE. Nothing is skipped, no result is inherited from
 *     the crashed attempt, and the reboot re-seeds from seed/seed.json.
 *
 * Usage — as a step's `shell`, so no `run:` body changes:
 *
 *     - name: Rendered copy matches the baseline
 *       shell: node scripts/ci-gate.mjs bash -e {0}
 *       run: node scripts/copy-baseline.mjs verify --base-url http://localhost:8787
 *
 * `bash -e {0}` is what GitHub runs for a default `run:` step, reproduced here
 * on purpose: a custom `shell:` replaces that line entirely, and a `bash {0}`
 * without `-e` would silently stop failing steps on their first bad command.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { proxyCrashDeath } from "./lib/stack-probe.mjs";

const PORT = process.env.STACK_PORT || "8787";
const BASE = `http://localhost:${PORT}`;

/**
 * Re-running the boot script whole, rather than a leaner "just start it again".
 * That script is 140 lines of measured process handling — the supervisor is a
 * GRANDCHILD of `npx`, `pkill -P` cannot reach it, and a comm-based filter
 * reports zero and reads like success. Re-deriving a lighter version of that
 * here would duplicate the one piece of this repo that has been wrong the most
 * times. The cost is a seed pass over an already-seeded D1: seconds, once.
 */
const REVIVE = process.env.STACK_REVIVE_CMD || `scripts/ci-local-stack.sh ${PORT}`;

/** $RUNNER_TEMP is per-job: created for the job, shared by its steps, deleted with it. */
const MARKER = join(process.env.RUNNER_TEMP || "/tmp", "ci-gate-revived");

const argv = process.argv.slice(2);
if (argv.length === 0) {
	console.error("usage: ci-gate.mjs <command> [args...]");
	process.exit(2);
}

/** `status` is null when a child dies on a signal, and null is not an exit code. */
const codeOf = (r) => r.status ?? 1;
const runGate = () => spawnSync(argv[0], argv.slice(1), { stdio: "inherit" });

const summary = (md) => {
	const path = process.env.GITHUB_STEP_SUMMARY;
	if (path) appendFileSync(path, `${md}\n`);
};

const first = runGate();
if (first.status === 0) process.exit(0);

const cause = await proxyCrashDeath(BASE);
if (!cause) process.exit(codeOf(first));

// From here the failure is known not to be about the change under test. Say so
// where it cannot be missed: an annotation shows on the run page without
// opening a log, which is where anyone actually looks first.
const WHERE = "cloudflare/workers-sdk#15317 · tracked here as #524";
if (existsSync(MARKER)) {
	console.error(`::error::the stack died a second time in this job (${cause}) — failing. ${WHERE}`);
	summary(`### ❌ Stack died twice\n\n\`${cause}\` — a second death in one job is not bad luck. ${WHERE}`);
	process.exit(codeOf(first));
}
writeFileSync(MARKER, `${new Date().toISOString()} ${cause}\n`);

console.error(`::warning::stack died mid-gate (${cause}) — rebooting once and re-running. ${WHERE}`);
console.error(`\n${"═".repeat(72)}`);
console.error(`  The stack is gone, and wrangler's debug log names the cause:`);
console.error(`      ${cause}`);
console.error(`  That is the upstream ProxyWorker crash, not the change under test.`);
console.error(`  Rebooting the stack ONCE and running this gate again, whole.`);
console.error(`  ${WHERE}`);
console.error(`${"═".repeat(72)}\n`);

const revived = spawnSync("bash", ["-c", REVIVE], { stdio: "inherit" });
if (revived.status !== 0) {
	console.error("::error::could not reboot the stack — failing with the gate's own code");
	summary(`### ❌ Stack died and would not come back\n\n\`${cause}\` — reboot failed. ${WHERE}`);
	process.exit(codeOf(first));
}

const second = runGate();
const verdict = second.status === 0 ? "✅ recovered" : "❌ still red after the reboot";
summary(
	`### ${verdict} — stack rebooted once\n\n` +
		`\`${cause}\`, the upstream ProxyWorker crash. The gate was re-run whole after ` +
		`a full reboot and re-seed.\n\n` +
		`- Upstream: [cloudflare/workers-sdk#15317](https://github.com/cloudflare/workers-sdk/issues/15317) — open, fix in review as [#15448](https://github.com/cloudflare/workers-sdk/pull/15448)\n` +
		`- Here: [#524](https://github.com/julioarguello/www-serverstartup-io/issues/524)\n` +
		`- ${second.status === 0 ? "Re-running was legitimate: this red was the crash, not the diff." : "The gate is red for its own reasons — read it as a real failure."}`,
);
process.exit(codeOf(second));
