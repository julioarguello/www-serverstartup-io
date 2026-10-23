/**
 * port-listeners.mjs — the /proc reading `ci-local-stack.sh` falls back to where
 * there is no `lsof` (the Playwright image, #646).
 *
 * The tcp6 row is the real one from that image, 2026-10-23, with a Node server
 * on :8787 (`::`, port 0x2253). The tcp rows follow the same layout.
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { inspect, listeningInodes } from "../../scripts/lib/port-listeners.mjs";

const TCP6 = [
	"  sl  local_address                         remote_address                        st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode",
	"   0: 00000000000000000000000000000000:2253 00000000000000000000000000000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 165334005 1 00000000b8d9067c 100 0 0 10 0",
].join("\n");

const TCP = [
	"  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode",
	// LISTEN on 0.0.0.0:8787
	"   0: 00000000:2253 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1001        0 4242 1 0000000000000000 100 0 0 10 0",
	// an ESTABLISHED connection on the same local port is not a listener
	"   1: 0100007F:2253 0100007F:C350 01 00000000:00000000 00:00000000 00000000  1001        0 4343 1 0000000000000000 20 4 30 10 -1",
	// a listener on another port
	"   2: 0100007F:1F90 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1001        0 4444 1 0000000000000000 100 0 0 10 0",
	// a row with inode 0 has no socket behind it: no holder to look for
	"   3: 00000000:2254 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1001        0 0 1 0000000000000000 100 0 0 10 0",
].join("\n");

describe("listeningInodes", () => {
	it("reads the real tcp6 row of a Node server on :8787", () => {
		expect([...listeningInodes(TCP6, 8787)]).toEqual(["165334005"]);
	});

	it("takes LISTEN rows on the port and nothing else", () => {
		expect([...listeningInodes(TCP, 8787)]).toEqual(["4242"]);
		expect([...listeningInodes(TCP, 8080)]).toEqual(["4444"]);
	});

	it("finds nothing on a free port, and ignores inode 0", () => {
		expect(listeningInodes(TCP, 9999).size).toBe(0);
		expect(listeningInodes(TCP, 8788).size).toBe(0);
	});
});

/**
 * A /proc of its own: the tables above, and one process whose descriptor links
 * point at `socket:[inode]` — readlink returns the target text, which is all
 * holders() reads, so a plain symlink stands in for the kernel's.
 */
function fakeProc(holderInode: string | null) {
	const root = mkdtempSync(join(tmpdir(), "proc-"));
	mkdirSync(join(root, "net"));
	writeFileSync(join(root, "net", "tcp"), TCP);
	writeFileSync(join(root, "net", "tcp6"), TCP6);
	mkdirSync(join(root, "4321", "fd"), { recursive: true });
	symlinkSync("pipe:[1]", join(root, "4321", "fd", "0"));
	if (holderInode) symlinkSync(`socket:[${holderInode}]`, join(root, "4321", "fd", "3"));
	mkdirSync(join(root, "self")); // not a PID: skipped
	return root;
}

describe("inspect", () => {
	const roots: string[] = [];
	const proc = (inode: string | null) => {
		const r = fakeProc(inode);
		roots.push(r);
		return r;
	};
	afterAll(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));

	it("names the process holding the listening socket", () => {
		expect(inspect(8787, proc("4242"))).toEqual({ code: 0, pids: [4321] });
	});

	it("answers free only when nothing listens", () => {
		expect(inspect(9999, proc(null))).toEqual({ code: 0, pids: [] });
	});

	it("refuses to answer free when a socket listens and its holder is unreadable", () => {
		const r = inspect(8787, proc(null));
		expect(r.code).toBe(3);
		expect(r.pids).toEqual([]);
	});

	it("refuses when there is no /proc to read", () => {
		const r = inspect(8787, join(tmpdir(), "no-such-proc"));
		expect(r.code).toBe(2);
	});
});
