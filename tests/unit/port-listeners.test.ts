/**
 * port-listeners.mjs — the /proc reading `ci-local-stack.sh` falls back to where
 * there is no `lsof` (the Playwright image, #646).
 *
 * The tcp6 row is the real one from that image, 2026-10-23, with a Node server
 * on :8787 (`::`, port 0x2253). The tcp rows follow the same layout.
 */
import { describe, expect, it } from "vitest";

import { listeningInodes } from "../../scripts/lib/port-listeners.mjs";

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
