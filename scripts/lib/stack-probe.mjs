/**
 * Answer "is the stack up?" instead of asking it (#390).
 *
 * A `wrangler dev` session died in the middle of a gate run on 2026-08-25.
 * Every guard reported honestly what it saw — a navigation timeout on one
 * route, then ERR_CONNECTION_REFUSED — and every one of those messages points
 * at the route, or at the guard, or at the diff being tested. None of them
 * points at the stack, because none of them looked.
 *
 * It cost a full investigation to rule out. The next person's first instinct
 * will be to hunt through their own change, so the guard has to say what it
 * costs one HTTP request to find out.
 *
 * This adds information and nothing else. It does not retry, does not widen a
 * timeout and does not change an exit code — masking the crash would destroy
 * the only signal that currently reveals it, which is what #390 asks for.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LOG = join(process.env.RUNNER_TEMP || "/tmp", "wrangler-ci.log");

/**
 * Wrangler's own debug log, put here by `scripts/ci-local-stack.sh` via
 * WRANGLER_LOG_PATH. It is a different file from $LOG on purpose: $LOG is
 * stdout, and stdout is where this crash prints `✘ [ERROR]` with nothing
 * after it. Only the debug log carries the `cause`.
 */
const DEBUG_LOG = join(process.env.RUNNER_TEMP || "/tmp", "wrangler-debug.log");

/**
 * Pull the cause out of the last ProxyController error in wrangler's debug log.
 *
 * `castErrorCause` wraps a plain object crossing the ProxyWorker boundary in an
 * `Error` with an empty message, so the console banner is blank and the only
 * copy of the real message is the `cause` block written here at debug level
 * (cloudflare/workers-sdk#15317). The last block, not the first: the stack
 * boots twice — unseeded, then seeded — and both write to this file.
 *
 * Returns "" when the log is absent or holds no such block, so a stack that
 * died some other way is not given a cause it never had.
 */
export function proxyErrorCause(text) {
	const blocks = [...text.matchAll(/Error in ProxyController[\s\S]*?cause: \{[\s\S]*?\n\s*\}/g)];
	const last = blocks.at(-1)?.[0];
	if (!last) return "";
	return (/message: '([^']*)'/.exec(last)?.[1] ?? "").trim();
}

/**
 * The OTHER way a browser-driven gate dies while the stack is fine (#425).
 *
 * Chrome stops answering the debugger — not the server, the browser. Measured
 * twice on 2026-08-30 on a machine at load 28: `Network.enable timed out` in
 * the keyboard section, `Runtime.callFunctionOn timed out` in the contrast
 * section twenty minutes later, and a third identical run green. Puppeteer
 * 23.11.1 waits `protocolTimeout` = 180 000 ms before giving up, so those are
 * three full minutes of silence, not a hiccup.
 *
 * Without this the run's headline is `FAIL Accessibility`, and the reader goes
 * looking for what they broke in a11y — when nothing after the last `ok` line
 * was measured at all. Same lesson as #399: a gate that reports a failure it
 * did not measure is worse than no gate.
 *
 * Returns "" for every other error, so the caller's own message still stands.
 */
export function cdpDiagnosis(error) {
	const timedOut = error?.name === "ProtocolError" && /timed out/i.test(error?.message ?? "");
	if (!timedOut) return "";
	return [
		"  → the stack IS answering: this is a CDP timeout, not a finding. Chrome",
		"    stopped replying to the debugger, which is what a browser does when it",
		"    is starved of CPU — check the machine's load before the diff. Nothing",
		"    after the last `ok` line above was measured. Re-run it (#425).",
	].join("\n");
}

/** Did the stack answer at all? Any HTTP status counts — a 404 is a live server. */
async function answers(baseUrl) {
	try {
		await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
		return true;
	} catch {
		return false;
	}
}

/**
 * The same question `stackDiagnosis` answers in prose, answered as a value, so
 * a caller can DECIDE on it rather than print it (#524).
 *
 * Deliberately two conditions, not one. "The stack is gone" alone is true of a
 * stack that never booted, one killed by the job timeout, and one that exited
 * on `Address already in use` — 62 of the 65 `emitErrorEvent` sessions measured
 * for #390 were that last one. Only a dead stack whose debug log carries a
 * ProxyController `cause` is the upstream crash this project is allowed to
 * recover from (cloudflare/workers-sdk#15317).
 *
 * Returns the cause text, so the caller can print what it acted on; "" means
 * "not this fault", and the caller must then fail exactly as it did before.
 */
export async function proxyCrashDeath(baseUrl) {
	if (await answers(baseUrl)) return "";
	if (!existsSync(DEBUG_LOG)) return "";
	return proxyErrorCause(readFileSync(DEBUG_LOG, "utf8"));
}

/**
 * One line naming the fact, plus the stack's own last words when it is gone.
 * Returns "" when the stack is fine — the caller's message already stands, and
 * a second line saying "by the way, the server is up" is noise.
 */
export async function stackDiagnosis(baseUrl) {
	if (await answers(baseUrl)) return "";
	const lines = [
		`  → ${baseUrl} is not answering at all: the stack is gone, and this failure`,
		"    is not about the route above. A stack that dies mid-run puts the suite",
		"    red for a reason unrelated to the change under test (#390).",
	];
	if (existsSync(LOG)) {
		const tail = readFileSync(LOG, "utf8").trimEnd().split("\n").slice(-12);
		lines.push(`    Last ${tail.length} line(s) of ${LOG}:`);
		for (const l of tail) lines.push(`      ${l}`);
	} else {
		lines.push(`    No wrangler log at ${LOG} — boot it with scripts/ci-local-stack.sh`);
	}

	// The tail above can only ever show an empty `✘ [ERROR]` for this crash.
	// This is the line that says what actually happened.
	const cause = existsSync(DEBUG_LOG) ? proxyErrorCause(readFileSync(DEBUG_LOG, "utf8")) : "";
	if (cause) {
		lines.push(
			`    Cause, from ${DEBUG_LOG}: ${cause}`,
			"    That is wrangler's ProxyWorker losing its connection to the runtime,",
			"    not a fault in the change under test — cloudflare/workers-sdk#15317,",
			"    open upstream with fixes in review. Re-run it (#390).",
		);
	} else if (!existsSync(DEBUG_LOG)) {
		lines.push(`    No wrangler debug log at ${DEBUG_LOG} — WRANGLER_LOG_PATH was not set (#390)`);
	}
	return lines.join("\n");
}
