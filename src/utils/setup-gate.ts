/**
 * Who may run the EmDash setup wizard (#610).
 *
 * While a database has no administrator, EmDash's setup routes register the
 * first passkey that completes them as the owner of the CMS — and EmDash has
 * no setup token of its own (its `emdash_setup_nonce` only binds the two
 * admin-creation steps to one browser; it does not decide who may start).
 * Every remote reseed used to reopen that window (#612), and a fresh
 * environment always opens it.
 *
 * This gate closes the window unless the request proves knowledge of a
 * per-environment Worker secret, `SETUP_GATE_TOKEN`. The owner opens
 * `/_emdash/admin/setup?setup_token=<secret>` once; the gate answers with a
 * short-lived HttpOnly cookie carrying the secret's SHA-256 and redirects to
 * the same page without the parameter. With no secret configured the routes
 * stay closed. `/_emdash/api/setup/status` is left open: the admin reads it on
 * every load to choose between login and setup, and it discloses nothing the
 * redirect does not.
 *
 * Pure on purpose: path, method, query and cookie in, verdict out, so the
 * unit suite exercises every branch without the Workers runtime.
 */

export const SETUP_GATE_COOKIE = "ss_setup_gate";
export const SETUP_TOKEN_PARAM = "setup_token";
/** Matches EmDash's own setup nonce lifetime: one hour to finish the wizard. */
export const SETUP_GATE_MAX_AGE_SECONDS = 3600;

const ADMIN_SETUP = "/_emdash/admin/setup";
const API_SETUP = "/_emdash/api/setup";
const API_SETUP_STATUS = "/_emdash/api/setup/status";

export type SetupGateVerdict =
	| { kind: "pass" }
	| { kind: "deny" }
	| { kind: "grant"; location: string; cookie: string };

/**
 * The form the router could match, never a weaker one: decoded, slashes
 * collapsed, trailing slash dropped, lowercased. Lowercasing can only widen
 * what is gated, so a spelling the router would still serve cannot slip past.
 */
export function normalizePath(pathname: string): string {
	let path = pathname;
	try {
		path = decodeURIComponent(pathname);
	} catch {
		// A malformed escape is not a route either; match it as written.
	}
	path = path.replace(/\/{2,}/g, "/").toLowerCase();
	return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function isSetupPath(pathname: string): boolean {
	const path = normalizePath(pathname);
	if (path === API_SETUP_STATUS) return false;
	return (
		path === ADMIN_SETUP ||
		path.startsWith(`${ADMIN_SETUP}/`) ||
		path === API_SETUP ||
		path.startsWith(`${API_SETUP}/`)
	);
}

export async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(header: string | null, name: string): string | undefined {
	if (!header) return undefined;
	for (const part of header.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return rest.join("=");
	}
	return undefined;
}

export async function setupGate(input: {
	url: URL;
	cookieHeader: string | null;
	secret: string | undefined;
}): Promise<SetupGateVerdict> {
	const { url, cookieHeader, secret } = input;
	if (!isSetupPath(url.pathname)) return { kind: "pass" };
	if (!secret) return { kind: "deny" };

	const expected = await sha256Hex(secret);
	if (readCookie(cookieHeader, SETUP_GATE_COOKIE) === expected) return { kind: "pass" };

	const offered = url.searchParams.get(SETUP_TOKEN_PARAM);
	if (offered !== null && normalizePath(url.pathname) === ADMIN_SETUP) {
		if ((await sha256Hex(offered)) !== expected) return { kind: "deny" };
		const clean = new URL(url);
		clean.searchParams.delete(SETUP_TOKEN_PARAM);
		return {
			kind: "grant",
			location: `${clean.pathname}${clean.search}`,
			cookie: [
				`${SETUP_GATE_COOKIE}=${expected}`,
				"Path=/_emdash",
				`Max-Age=${SETUP_GATE_MAX_AGE_SECONDS}`,
				"HttpOnly",
				"Secure",
				"SameSite=Strict",
			].join("; "),
		};
	}
	return { kind: "deny" };
}
