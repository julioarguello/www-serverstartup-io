/**
 * setup-gate.ts — who may run the EmDash setup wizard (#610).
 *
 * The failure is silent in the worst way: an open wizard renders perfectly,
 * and the first stranger to finish it owns the CMS. So every route EmDash
 * mounts for setup is listed here against the gate, with and without the
 * secret, and the open exception (status) is pinned as an exception.
 */
import { describe, expect, it } from "vitest";

import {
	isSetupPath,
	SETUP_GATE_COOKIE,
	setupGate,
	sha256Hex,
} from "../../src/utils/setup-gate";

const HOST = "https://www.serverstartup.dev";
const SECRET = "correct horse battery staple";
const gate = (path: string, opts: { cookie?: string | null; secret?: string } = {}) =>
	setupGate({
		url: new URL(path, HOST),
		cookieHeader: opts.cookie ?? null,
		secret: "secret" in opts ? opts.secret : SECRET,
	});

// The setup routes EmDash 0.34 injects (node_modules/emdash/dist/astro/index.mjs)
// plus the admin page the wizard renders on.
const GATED = [
	"/_emdash/admin/setup",
	"/_emdash/api/setup",
	"/_emdash/api/setup/admin",
	"/_emdash/api/setup/admin/verify",
	"/_emdash/api/setup/dev-bypass",
	"/_emdash/api/setup/dev-reset",
];

describe("which paths are gated", () => {
	it("every setup route and the wizard page", () => {
		for (const p of GATED) expect(isSetupPath(p), p).toBe(true);
	});

	it("spellings the router could still match", () => {
		for (const p of [
			"/_emdash/api/setup/",
			"//_emdash/api//setup/admin",
			"/_emdash/api/%73etup/admin",
			"/_EMDASH/API/SETUP",
			"/_emdash/admin/setup/",
		]) {
			expect(isSetupPath(p), p).toBe(true);
		}
	});

	it("leaves status open: the admin reads it to choose login or setup", () => {
		expect(isSetupPath("/_emdash/api/setup/status")).toBe(false);
		expect(isSetupPath("/_emdash/api/setup/status/")).toBe(false);
	});

	it("leaves the rest of the site and the admin alone", () => {
		for (const p of [
			"/",
			"/_emdash/admin",
			"/_emdash/admin/login",
			"/_emdash/api/auth/dev-bypass",
			"/_emdash/api/setups",
			"/setup",
		]) {
			expect(isSetupPath(p), p).toBe(false);
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

	it("opens them to the cookie the grant issues, and only that one", async () => {
		const cookie = `${SETUP_GATE_COOKIE}=${await sha256Hex(SECRET)}`;
		for (const p of GATED) expect((await gate(p, { cookie: `theme=dark; ${cookie}` })).kind, p).toBe("pass");
		expect((await gate(GATED[1], { cookie: `${SETUP_GATE_COOKIE}=${await sha256Hex("guess")}` })).kind).toBe("deny");
		expect((await gate(GATED[1], { cookie: `${SETUP_GATE_COOKIE}=${SECRET}` })).kind).toBe("deny");
	});

	it("grants on the wizard page with the right token, and strips it from the URL", async () => {
		const v = await gate(`/_emdash/admin/setup?lang=es&setup_token=${encodeURIComponent(SECRET)}`);
		expect(v.kind).toBe("grant");
		if (v.kind !== "grant") return;
		expect(v.location).toBe("/_emdash/admin/setup?lang=es");
		expect(v.cookie).toContain(`${SETUP_GATE_COOKIE}=${await sha256Hex(SECRET)}`);
		for (const attr of ["Path=/_emdash", "HttpOnly", "Secure", "SameSite=Strict", "Max-Age=3600"]) {
			expect(v.cookie).toContain(attr);
		}
		expect(v.cookie).not.toContain(SECRET);
	});

	it("never grants with a wrong token, nor through an API route", async () => {
		expect((await gate("/_emdash/admin/setup?setup_token=guess")).kind).toBe("deny");
		expect((await gate(`/_emdash/api/setup/admin?setup_token=${encodeURIComponent(SECRET)}`)).kind).toBe("deny");
	});

	it("passes everything that is not a setup path, secret or not", async () => {
		expect((await gate("/_emdash/api/setup/status", { secret: undefined })).kind).toBe("pass");
		expect((await gate("/contacto", { secret: undefined })).kind).toBe("pass");
	});
});
