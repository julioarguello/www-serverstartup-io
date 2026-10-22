/**
 * Who may become the first administrator of the CMS (#610).
 *
 * While `emdash:setup_complete` is not set, EmDash hands the CMS to the first
 * caller who finishes either of two paths: the setup wizard (a passkey), or an
 * OAuth login, whose callback grants ADMIN to any email during setup
 * (emdash 0.34, `api/auth/oauth/[provider]/callback.ts`). EmDash has no setup
 * token of its own — its `emdash_setup_nonce` only binds the two admin steps
 * to one browser; it does not decide who may start. Every remote reseed used
 * to reopen the window (#612), and a fresh environment always opens it.
 *
 * This gate closes both paths unless the request proves knowledge of a
 * per-environment Worker secret, `SETUP_GATE_TOKEN`. The owner opens
 * `/_emdash/admin/setup?setup_token=<secret>` once; the gate answers with an
 * HttpOnly cookie that carries an expiry and an HMAC of it under the secret,
 * and redirects to the same page without the parameter. With no secret
 * configured the routes stay closed. OAuth login is gated at all times: the
 * site runs in passkey mode and configures no provider, so nothing legitimate
 * is closed, and a provider added later for another reason cannot silently
 * reopen "first login owns the CMS".
 *
 * `/_emdash/api/setup/status` stays open: the admin reads it on every load to
 * choose between login and setup, and it discloses nothing the redirect does
 * not.
 *
 * Pure on purpose: path, query, cookie, secret and clock in, verdict out, so
 * the unit suite exercises every branch without the Workers runtime.
 */

export const SETUP_GATE_COOKIE = "ss_setup_gate";
export const SETUP_TOKEN_PARAM = "setup_token";
/** Matches EmDash's own setup nonce lifetime: one hour to finish the wizard. */
export const SETUP_GATE_MAX_AGE_SECONDS = 3600;

const ADMIN_SETUP = "/_emdash/admin/setup";
const API_SETUP = "/_emdash/api/setup";
const API_SETUP_STATUS = "/_emdash/api/setup/status";
const API_OAUTH = "/_emdash/api/auth/oauth";

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

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export function isGatedPath(pathname: string): boolean {
	const path = normalizePath(pathname);
	if (path === API_SETUP_STATUS) return false;
	return under(path, ADMIN_SETUP) || under(path, API_SETUP) || under(path, API_OAUTH);
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function sign(secret: string, expires: number): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`setup-gate:${expires}`)));
}

/** Constant-time over equal lengths; a length mismatch is not secret. */
function sameString(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export async function issueCookieValue(secret: string, nowMs: number): Promise<string> {
	const expires = Math.floor(nowMs / 1000) + SETUP_GATE_MAX_AGE_SECONDS;
	return `${expires}.${await sign(secret, expires)}`;
}

async function validCookieValue(value: string, secret: string, nowMs: number): Promise<boolean> {
	const [exp, mac, ...rest] = value.split(".");
	if (rest.length > 0 || !/^\d+$/.test(exp ?? "") || !mac) return false;
	const expires = Number(exp);
	if (expires * 1000 <= nowMs) return false;
	return sameString(mac, await sign(secret, expires));
}

/** Every value under `name`: a stale or planted duplicate must not shadow a valid one. */
function cookieValues(header: string | null, name: string): string[] {
	if (!header) return [];
	return header
		.split(";")
		.map((part) => part.trim().split("="))
		.filter(([key]) => key === name)
		.map(([, ...rest]) => rest.join("="));
}

export async function setupGate(input: {
	url: URL;
	cookieHeader: string | null;
	secret: string | undefined;
	nowMs?: number;
}): Promise<SetupGateVerdict> {
	const { url, cookieHeader, secret } = input;
	const nowMs = input.nowMs ?? Date.now();
	if (!isGatedPath(url.pathname)) return { kind: "pass" };
	if (!secret) return { kind: "deny" };

	// The token is handled before the cookie, so a URL carrying it is always
	// redirected away from — even for a browser that already holds the cookie,
	// which would otherwise keep the secret in the address bar and in Referer.
	const offered = url.searchParams.get(SETUP_TOKEN_PARAM);
	if (offered !== null) {
		if (normalizePath(url.pathname) !== ADMIN_SETUP) return { kind: "deny" };
		if (!sameString(await sign(offered, 0), await sign(secret, 0))) return { kind: "deny" };
		const query = new URLSearchParams(url.searchParams);
		query.delete(SETUP_TOKEN_PARAM);
		const search = query.toString();
		return {
			kind: "grant",
			// Canonical, never the request's own spelling: `//_emdash/...` would
			// otherwise come back as a protocol-relative redirect to another host.
			location: search ? `${ADMIN_SETUP}?${search}` : ADMIN_SETUP,
			cookie: [
				`${SETUP_GATE_COOKIE}=${await issueCookieValue(secret, nowMs)}`,
				"Path=/_emdash",
				`Max-Age=${SETUP_GATE_MAX_AGE_SECONDS}`,
				"HttpOnly",
				"Secure",
				// Lax, not Strict: a grant link clicked from mail or chat is a
				// cross-site navigation, and Strict withholds the cookie on the
				// redirect it just set. Lax still withholds it from cross-site POSTs.
				"SameSite=Lax",
			].join("; "),
		};
	}

	for (const value of cookieValues(cookieHeader, SETUP_GATE_COOKIE)) {
		if (await validCookieValue(value, secret, nowMs)) return { kind: "pass" };
	}
	return { kind: "deny" };
}
