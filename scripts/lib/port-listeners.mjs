/**
 * port-listeners.mjs — which processes listen on a TCP port, read from /proc.
 *
 * `scripts/ci-local-stack.sh` asks `lsof` this question. The Playwright image
 * the `engines` job runs in has no `lsof` (#646), and installing it would bring
 * back the apt mirror the image exists to avoid. This answers the same question
 * the way `lsof` does on Linux: LISTEN rows in /proc/net/tcp{,6} give the socket
 * inodes, and /proc/<pid>/fd links (`socket:[inode]`) give their holders.
 *
 * A listener whose holder cannot be read is an error, never an empty answer:
 * the caller treats empty as "port free", and a port that is not free but looks
 * free is the failure this exists to prevent.
 *
 * Usage: node scripts/lib/port-listeners.mjs <port>   (prints one PID per line)
 */
import { readdirSync, readFileSync, readlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** TCP state `0A` is LISTEN (include/net/tcp_states.h). */
const LISTEN = "0A";

/**
 * Socket inodes listening on `port` in the text of /proc/net/tcp or tcp6.
 * Columns: sl, local_address (hex addr:hex port), rem_address, st, …, inode (10th).
 */
export function listeningInodes(text, port) {
	const inodes = new Set();
	for (const line of text.split("\n").slice(1)) {
		const cols = line.trim().split(/\s+/);
		if (cols.length < 10 || cols[3] !== LISTEN) continue;
		const localPort = Number.parseInt(cols[1].split(":").pop() ?? "", 16);
		if (localPort === port && cols[9] !== "0") inodes.add(cols[9]);
	}
	return inodes;
}

/** PIDs whose open descriptors include one of `inodes`, from `procRoot`. */
export function holders(inodes, procRoot = "/proc") {
	const pids = new Set();
	for (const pid of readdirSync(procRoot)) {
		if (!/^\d+$/.test(pid)) continue;
		let fds;
		try {
			fds = readdirSync(`${procRoot}/${pid}/fd`);
		} catch {
			continue; // exited, or not ours to read
		}
		for (const fd of fds) {
			let target;
			try {
				target = readlinkSync(`${procRoot}/${pid}/fd/${fd}`);
			} catch {
				continue;
			}
			const m = /^socket:\[(\d+)\]$/.exec(target);
			if (m && inodes.has(m[1])) pids.add(Number(pid));
		}
	}
	return [...pids].sort((a, b) => a - b);
}

/**
 * The answer for `port` under `procRoot`: `code` 0 with the holders' PIDs, 2 when
 * /proc cannot be read, 3 when a socket listens but no readable process holds it.
 */
export function inspect(port, procRoot = "/proc") {
	const inodes = new Set();
	for (const table of ["tcp", "tcp6"]) {
		let text;
		try {
			text = readFileSync(`${procRoot}/net/${table}`, "utf8");
		} catch (e) {
			// tcp6 is absent on a kernel without IPv6; tcp absent means no /proc at all.
			if (table === "tcp6") continue;
			return { code: 2, pids: [], message: `cannot read ${procRoot}/net/tcp: ${e.message}` };
		}
		for (const inode of listeningInodes(text, port)) inodes.add(inode);
	}
	const pids = holders(inodes, procRoot);
	if (inodes.size > 0 && pids.length === 0) {
		return {
			code: 3,
			pids,
			message: `${inodes.size} socket(s) listen on ${port} but no readable process holds them`,
		};
	}
	return { code: 0, pids };
}

function main(argv) {
	const port = Number(argv[2]);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		console.error("usage: port-listeners.mjs <port>");
		return 2;
	}
	const { code, pids, message } = inspect(port);
	if (message) console.error(`ERROR: ${message}`);
	for (const pid of pids) console.log(pid);
	return code;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	process.exitCode = main(process.argv);
}
