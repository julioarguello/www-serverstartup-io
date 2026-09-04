/**
 * The positive control for the stack restart (#524): a REAL server, really
 * killed, mid-gate.
 *
 * `scripts/ci-gate.mjs` exists to turn one specific upstream crash — wrangler
 * treating a request-scoped ProxyWorker error as fatal
 * (cloudflare/workers-sdk#15317) — into a single bounded reboot instead of a
 * red run. Every line of it is therefore a decision about when NOT to retry,
 * and a test that mocked the probe would prove only that the mock returns what
 * it was told to.
 *
 * So the fixtures here run a real HTTP server in its own process, and the gate
 * under test really kills it and really exits non-zero, exactly as a gate does
 * when the stack dies under it. What is stubbed is one thing: the reboot
 * command, because booting `wrangler dev` and re-seeding D1 is a minute of CI
 * and belongs to the job, not to a unit suite.
 *
 * The four cases are the four decisions, and three of them are refusals:
 *
 *   1. dead stack + a ProxyController cause      → reboot once, re-run, green
 *   2. the same, but already rebooted this job   → red; twice is not bad luck
 *   3. red gate while the stack ANSWERS          → red, untouched; a finding
 *   4. dead stack with NO ProxyController cause  → red; 62 of the 65 sessions
 *      measured for #390 were `Address already in use`, a different fault
 *
 * Case 3 is the one that matters most. If it ever goes green, this file has
 * stopped being a recovery and become a way to make regressions intermittent.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const GATE = join(REPO, "scripts", "ci-gate.mjs");

/** Verbatim shape of the block `proxyErrorCause` keys on — see tests/unit/stack-probe-cause.test.ts. */
const PROXY_CRASH_LOG = `--- 2026-08-25T12:23:33.117Z debug
Error in ProxyController: Error inside ProxyWorker
 Error
    at castErrorCause (/repo/node_modules/wrangler/wrangler-dist/cli.js:180295:20)
    at ProxyController.emitErrorEvent (/repo/node_modules/wrangler/wrangler-dist/cli.js:180412:11)
  cause: {
    message: 'Network connection lost.'
  }
`;

/** A stack that died some other way still writes a debug log — it just has no cause block. */
const PORT_COLLISION_LOG = `--- 2026-08-25T12:23:33.117Z debug
✘ [ERROR] Address already in use (127.0.0.1:8787)
`;

let dir: string;
let port: number;

/** A free port, taken by asking the OS for one and letting it go. */
async function freePort(): Promise<number> {
	const { createServer } = await import("node:net");
	return new Promise((resolve) => {
		const s = createServer();
		s.listen(0, "127.0.0.1", () => {
			const { port: p } = s.address() as { port: number };
			s.close(() => resolve(p));
		});
	});
}

/** Boot the stand-in stack and wait until it actually answers. */
function bootStack() {
	spawnSync("bash", ["-c", `${boot()} `], { cwd: dir, stdio: "ignore" });
}

/** The shell one-liner that starts the stand-in stack and returns once it answers. */
function boot(): string {
	return (
		// `>/dev/null 2>&1` is load-bearing, not tidiness: ci-gate.mjs runs this
		// command with `stdio: "inherit"`, so a background process that keeps the
		// inherited stdout open holds the TEST's pipe open after ci-gate has
		// exited, and `spawnSync` waits on it forever. The real boot script
		// redirects wrangler to $LOG for the same reason.
		`node ${JSON.stringify(join(dir, "stack.mjs"))} ${port} >/dev/null 2>&1 & ` +
		`for _ in $(seq 1 100); do ` +
		`curl -s -o /dev/null "http://localhost:${port}/" && exit 0; sleep 0.1; done; exit 1`
	);
}

function runGate(env: Record<string, string> = {}) {
	return spawnSync("node", [GATE, "bash", "-e", join(dir, "gate.sh")], {
		cwd: dir,
		encoding: "utf8",
		env: {
			...process.env,
			STACK_PORT: String(port),
			RUNNER_TEMP: dir,
			STACK_REVIVE_CMD: boot(),
			GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
			...env,
		},
	});
}

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), "ci-gate-"));
	port = await freePort();

	// The stand-in stack: a real server in a real process, holding a real port.
	writeFileSync(
		join(dir, "stack.mjs"),
		`import { createServer } from "node:http";\n` +
			`import { writeFileSync } from "node:fs";\n` +
			`const s = createServer((_, res) => res.end("ok"));\n` +
			`s.listen(Number(process.argv[2]), "127.0.0.1", () => {\n` +
			`  writeFileSync(${JSON.stringify(join(dir, "stack.pid"))}, String(process.pid));\n` +
			`});\n`,
	);
});

afterEach(() => {
	// Kill whatever a case left listening, then take the directory with it.
	const pid = existsSync(join(dir, "stack.pid")) ? Number(readFileSync(join(dir, "stack.pid"), "utf8")) : 0;
	if (pid) try { process.kill(pid, "SIGKILL"); } catch { /* already gone */ }
	rmSync(dir, { recursive: true, force: true });
});

describe("ci-gate.mjs", () => {
	it("reboots once and re-runs the gate when the stack dies from the upstream crash", () => {
		bootStack();
		writeFileSync(join(dir, "wrangler-debug.log"), PROXY_CRASH_LOG);
		// First pass: kill the stack the way it dies for real — the process is
		// gone and the port stops answering — then fail, as a gate does.
		// Second pass: the marker file proves this is the re-run, and it passes.
		writeFileSync(
			join(dir, "gate.sh"),
			`if [ -f ran-once ]; then echo "gate: re-run, stack is back"; exit 0; fi\n` +
				`touch ran-once\n` +
				`kill -9 "$(cat stack.pid)"\n` +
				`while curl -s -o /dev/null "http://localhost:${port}/"; do sleep 0.05; done\n` +
				`echo "gate: ERR_CONNECTION_REFUSED"; exit 1\n`,
		);

		const r = runGate();

		expect(r.status).toBe(0);
		expect(r.stdout).toContain("gate: re-run, stack is back");
		expect(r.stderr).toContain("::warning::");
		expect(r.stderr).toContain("Network connection lost.");
		expect(existsSync(join(dir, "ci-gate-revived"))).toBe(true);
		expect(readFileSync(join(dir, "summary.md"), "utf8")).toContain("recovered");
	}, 30_000);

	it("fails when the stack dies a second time in the same job", () => {
		bootStack();
		writeFileSync(join(dir, "wrangler-debug.log"), PROXY_CRASH_LOG);
		writeFileSync(join(dir, "ci-gate-revived"), "an earlier step in this job already used it\n");
		writeFileSync(
			join(dir, "gate.sh"),
			`kill -9 "$(cat stack.pid)"\n` +
				`while curl -s -o /dev/null "http://localhost:${port}/"; do sleep 0.05; done\n` +
				`echo "gate: dead again"; exit 1\n`,
		);

		const r = runGate();

		expect(r.status).toBe(1);
		expect(r.stderr).toContain("::error::");
		expect(r.stderr).toContain("second time");
		// One run, not two: the gate must not be re-entered at all.
		expect(r.stdout.match(/gate: dead again/g)).toHaveLength(1);
	}, 30_000);

	it("never re-runs a gate that failed while the stack was answering", () => {
		bootStack();
		writeFileSync(join(dir, "wrangler-debug.log"), PROXY_CRASH_LOG);
		writeFileSync(join(dir, "gate.sh"), `echo "gate: a real finding"; exit 3\n`);

		const r = runGate();

		// The gate's own exit code, not a normalised 1 — callers read it.
		expect(r.status).toBe(3);
		expect(r.stdout.match(/gate: a real finding/g)).toHaveLength(1);
		expect(r.stderr).not.toContain("::warning::");
		expect(existsSync(join(dir, "ci-gate-revived"))).toBe(false);
	}, 30_000);

	it("never re-runs when the stack is gone but nothing names the ProxyWorker", () => {
		bootStack();
		writeFileSync(join(dir, "wrangler-debug.log"), PORT_COLLISION_LOG);
		writeFileSync(
			join(dir, "gate.sh"),
			`kill -9 "$(cat stack.pid)"\n` +
				`while curl -s -o /dev/null "http://localhost:${port}/"; do sleep 0.05; done\n` +
				`echo "gate: stack gone, different fault"; exit 1\n`,
		);

		const r = runGate();

		expect(r.status).toBe(1);
		expect(r.stdout.match(/gate: stack gone, different fault/g)).toHaveLength(1);
		expect(r.stderr).not.toContain("::warning::");
		expect(existsSync(join(dir, "ci-gate-revived"))).toBe(false);
	}, 30_000);
});
