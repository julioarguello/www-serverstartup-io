/**
 * setup-gate.ts — who may become the first CMS administrator (#610).
 *
 * The failure is silent in the worst way: an open wizard renders perfectly,
 * and the first stranger to finish it owns the CMS. So every route through
 * which EmDash 0.34 can create that first administrator is listed here
 * against the gate — the setup routes and the OAuth callback — with and
 * without the secret, and the open exception (status) is pinned as one.
 */
import { describe, expect, it } from "vitest";

import {
	isGatedPath,
	issueCookieValue,
	SETUP_GATE_COOKIE,
	SETUP_GATE_MAX_AGE_SECONDS,
	setupGate,
} from "../../src/utils/setup-gate";

const HOST = "https://www.serverstartup.dev";
const SECRET = "correct horse battery staple";
const NOW = Date.UTC(2026, 9, 22, 12, 0, 0);
const gate = (
	path: string,
	opts: { cookie?: string | null; secret?: string; nowMs?: number } = {},
) =>
	setupGate({
		url: new URL(path, HOST),
		cookieHeader: opts.cookie ?? null,
		secret: "secret" in opts ? opts.secret : SECRET,
		nowMs: opts.nowMs ?? NOW,
	});
const validCookie = async () => `${SETUP_GATE_COOKIE}=${await issueCookieValue(SECRET, NOW)}`;

// The setup routes EmDash 0.34 injects (node_modules/emdash/dist/astro/index.mjs),
// the admin page the wizard renders on, and the OAuth routes whose callback
// grants ADMIN while setup is incomplete (api/auth/oauth/[provider]/callback.ts).
const GATED = [
	"/_emdash/admin/setup",
	"/_emdash/api/setup",
	"/_emdash/api/setup/admin",
	"/_emdash/api/setup/admin/verify",
	"/_emdash/api/setup/dev-bypass",
	"/_emdash/api/setup/dev-reset",
	"/_emdash/api/auth/oauth/github",
	"/_emdash/api/auth/oauth/github/callback",
	"/_emdash/api/auth/oauth/google/callback",
];

describe("which paths are gated", () => {
	it("every route that can create the first administrator, and the wizard page", () => {
		for (const p of GATED) expect(isGatedPath(p), p).toBe(true);
	});

	it("spellings the router could still match", () => {
		for (const p of [
			"/_emdash/api/setup/",
			"//_emdash/api//setup/admin",
			"/_emdash/api/%73etup/admin",
			"/_EMDASH/API/SETUP",
			"/_emdash/admin/setup/",
			"/_emdash/api/auth/%6Fauth/github/callback",
		]) {
			expect(isGatedPath(p), p).toBe(true);
		}
	});

	it("leaves status open: the admin reads it to choose login or setup", () => {
		expect(isGatedPath("/_emdash/api/setup/status")).toBe(false);
		expect(isGatedPath("/_emdash/api/setup/status/")).toBe(false);
	});

	it("leaves the rest of the site and the admin's own login alone", () => {
		for (const p of [
			"/",
			"/_emdash/admin",
			"/_emdash/admin/login",
			"/_emdash/api/auth/dev-bypass",
			"/_emdash/api/auth/passkey/options",
			"/_emdash/api/setups",
			"/_emdash/api/auth/oauthx",
			"/setup",
		]) {
			expect(isGatedPath(p), p).toBe(false);
		}
	});
});

describe("the verdict", () => {
	it("closes every gated route when the environment has no secret", async () => {
		for (const p of GATED) expect((await gate(p, { secret: undefined })).kind, p).toBe("deny");
		expect((await gate("/_emdash/admin/setup?setup_token=", { secret: "" })).kind).toBe("deny");
	});

	it("closes every gated route to a request without the cookie", async () => {
		for (const p of GATED) expect((await gate(p)).kind, p).toBe("deny");
	});

	it("opens them to a cookie the grant issued, while it is unexpired", async () => {
		const cookie = await validCookie();
		for (const p of GATED) expect((await gate(p, { cookie: `theme=dark; ${cookie}` })).kind, p).toBe("pass");
		const later = NOW + SETUP_GATE_MAX_AGE_SECONDS * 1000;
		expect((await gate(GATED[1], { cookie, nowMs: later })).kind).toBe("deny");
	});

	it("refuses a cookie signed under another secret, a forged expiry, or the secret itself", async () => {
		const other = `${SETUP_GATE_COOKIE}=${await issueCookieValue("guess", NOW)}`;
		expect((await gate(GATED[1], { cookie: other })).kind).toBe("deny");
		const [, value] = (await validCookie()).split("=");
		const [, mac] = value.split(".");
		const forged = `${SETUP_GATE_COOKIE}=${Math.floor(NOW / 1000) + 10 * SETUP_GATE_MAX_AGE_SECONDS}.${mac}`;
		expect((await gate(GATED[1], { cookie: forged })).kind).toBe("deny");
		expect((await gate(GATED[1], { cookie: `${SETUP_GATE_COOKIE}=${SECRET}` })).kind).toBe("deny");
	});

	it("is not shadowed by a stale cookie of the same name ahead of a valid one", async () => {
		const cookie = await validCookie();
		expect((await gate(GATED[1], { cookie: `${SETUP_GATE_COOKIE}=stale; ${cookie}` })).kind).toBe("pass");
	});

	it("grants on the wizard page with the right token, to a canonical clean URL", async () => {
		const v = await gate(`/_emdash/admin/setup?lang=es&setup_token=${encodeURIComponent(SECRET)}`);
		expect(v.kind).toBe("grant");
		if (v.kind !== "grant") return;
		expect(v.location).toBe("/_emdash/admin/setup?lang=es");
		for (const attr of ["Path=/_emdash", "HttpOnly", "Secure", "SameSite=Lax", `Max-Age=${SETUP_GATE_MAX_AGE_SECONDS}`]) {
			expect(v.cookie).toContain(attr);
		}
		const value = v.cookie.split(";")[0];
		expect((await gate(GATED[2], { cookie: value })).kind).toBe("pass");
	});

	it("never redirects to the request's own spelling", async () => {
		// Concatenated, not resolved against HOST: `new URL("//x", base)` reads
		// `//x` as a host, while a request line carries it as a path.
		const v = await setupGate({
			url: new URL(`${HOST}//_emdash/admin/SETUP/?setup_token=${encodeURIComponent(SECRET)}`),
			cookieHeader: null,
			secret: SECRET,
			nowMs: NOW,
		});
		expect(v.kind).toBe("grant");
		if (v.kind === "grant") expect(v.location).toBe("/_emdash/admin/setup");
	});

	it("takes the token out of the URL even for a browser that already holds the cookie", async () => {
		const v = await gate(`/_emdash/admin/setup?setup_token=${encodeURIComponent(SECRET)}`, {
			cookie: await validCookie(),
		});
		expect(v.kind).toBe("grant");
	});

	it("never grants with a wrong token, nor through an API route", async () => {
		expect((await gate("/_emdash/admin/setup?setup_token=guess")).kind).toBe("deny");
		expect((await gate(`/_emdash/api/setup/admin?setup_token=${encodeURIComponent(SECRET)}`)).kind).toBe("deny");
	});

	it("passes everything that is not gated, secret or not", async () => {
		expect((await gate("/_emdash/api/setup/status", { secret: undefined })).kind).toBe("pass");
		expect((await gate("/contacto", { secret: undefined })).kind).toBe("pass");
	});
});
