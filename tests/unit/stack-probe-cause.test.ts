/**
 * The crash in #390 prints an empty error. This is what recovers the message.
 *
 * `wrangler dev` dies mid-suite and the console says, in full:
 *
 * ```
 * ✘ [ERROR]
 * ```
 *
 * Nothing after it. The cause is not missing — wrangler has it in hand and
 * throws it away at the console boundary: `castErrorCause` wraps a plain object
 * arriving from the ProxyWorker in an `Error` whose `message` is empty, and the
 * real text survives only in the `cause` field, which reaches the debug log
 * file and nowhere else (cloudflare/workers-sdk#15317, open, fixes in review).
 *
 * That debug log goes to `~/.wrangler/logs` by default, so on CI it dies with
 * the runner. `scripts/ci-local-stack.sh` now points `WRANGLER_LOG_PATH` at
 * `$RUNNER_TEMP`, and `stackDiagnosis()` reads the cause back out. Without both
 * halves the suite reports a red route and the reader hunts through their diff
 * — the exact cost #390 was opened to stop paying.
 *
 * Measured for this change, over the 2154 wrangler sessions in `~/.wrangler/logs`
 * on this machine: 65 carry an `emitErrorEvent` frame, but only **3** are this
 * bug. The other 62 are `Address already in use` — a port collision from our own
 * zombie stack, a different fault that shares one stack frame. Anyone measuring
 * the rate by grepping `emitErrorEvent` overstates it about twentyfold, which is
 * why the extractor below keys on the `cause` block and not on the frame.
 */
import { describe, expect, it } from "vitest";
import { proxyErrorCause } from "../../scripts/lib/stack-probe.mjs";

/**
 * Verbatim from `~/.wrangler/logs/wrangler-2026-08-25_12-23-13_964.log`, one of
 * the three sessions that carried the fault. A fixture invented from the issue
 * text would only prove the extractor matches the issue text.
 */
const REAL_BLOCK = `--- 2026-08-25T12:23:33.117Z debug
Error in ProxyController: Error inside ProxyWorker
 Error
    at castErrorCause (/repo/node_modules/wrangler/wrangler-dist/cli.js:180295:20)
    at ProxyController2.emitErrorEvent (/repo/node_modules/wrangler/wrangler-dist/cli.js:326367:20)
    at ProxyController2.onProxyWorkerMessage (/repo/node_modules/wrangler/wrangler-dist/cli.js:326244:18)
    at PROXY_CONTROLLER (/repo/node_modules/wrangler/wrangler-dist/cli.js:325971:24)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async #handleLoopbackCustomFetchService (/repo/node_modules/miniflare/dist/src/index.js:111715:22)
    at async #handleLoopback (/repo/node_modules/miniflare/dist/src/index.js:112048:20) {
  cause: {
    name: 'Error',
    message: 'Network connection lost.',
    stack: 'Error: Network connection lost.'
  }
}
---
`;

/** The other 62: honest, self-inflicted, and not this bug. */
const PORT_COLLISION = `--- 2026-09-03T11:47:15.357Z debug
Error: Address already in use (127.0.0.1:8787). Please check that you are not already running a server on this address or specify a different port with --port.
    at exports.unstable_DevEnv.handleErrorEvent (/repo/node_modules/wrangler/wrangler-dist/cli.js:481559:13)
    at ProxyController2.emitErrorEvent (/repo/node_modules/wrangler/wrangler-dist/cli.js:180648:18)
---
`;

describe("recovering the cause wrangler drops", () => {
	it("finds it in a real crash log", () => {
		expect(proxyErrorCause(REAL_BLOCK)).toBe("Network connection lost.");
	});

	/**
	 * The positive control for the file as a whole. If the extractor answered
	 * something for every input, the assertion above would pass on a fixture
	 * that is not this bug, and the diagnosis would put a cause on every dead
	 * stack — telling the reader "not your diff" when it might well be.
	 */
	it("says nothing about a port collision, which shares the emitErrorEvent frame", () => {
		expect(proxyErrorCause(PORT_COLLISION)).toBe("");
	});

	it("says nothing about a log with no error at all", () => {
		expect(proxyErrorCause("--- 2026-09-03T11:47:15.205Z debug\nsetting config\n---\n")).toBe("");
	});

	/**
	 * The stack boots twice — unseeded to create the D1 schema, then seeded —
	 * and both sessions append here. The live one is the second.
	 */
	it("takes the last block when the log holds more than one", () => {
		const second = REAL_BLOCK.replace("Network connection lost.", "Something else entirely.");
		expect(proxyErrorCause(REAL_BLOCK + PORT_COLLISION + second)).toBe("Something else entirely.");
	});
});
