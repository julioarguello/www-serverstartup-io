/**
 * The analytics consent (#667): Zaraz, and GA4 through it, load only after the
 * visitor accepts, and only on hosts where Zaraz is on. These pin the decisions
 * (src/utils/consent.ts), the hosts and cookie scope (src/utils/zaraz.ts), the
 * withdrawal endpoint, and the wiring in Base.astro and the footer.
 *
 * What a real browser does with them — no cookie before an answer, GA4's
 * cookies after Accept, none of Google's hosts contacted — is checked on
 * preview, where Zaraz exists (docs/how-to/set-up-analytics.md §3).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { POST } from "../../src/pages/api/consent-withdraw";
import { CONSENT_KEY, onAnswer, onLoad, readChoice, writeChoice } from "../../src/utils/consent";
import { ZARAZ_COOKIES, ZARAZ_HOSTS, ZARAZ_LOADER, cookieDomain, zarazEnabled } from "../../src/utils/zaraz";
import { outsideSources } from "./csp-sources";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const base = read("../../src/layouts/Base.astro");
const footer = read("../../src/components/SiteFooter.astro");
const banner = read("../../src/components/ConsentBanner.astro");
const middleware = read("../../src/middleware.ts");

const memory = (init: Record<string, string> = {}) => {
	const m = new Map(Object.entries(init));
	return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe("consent decisions", () => {
	it("loads nothing and shows the banner until there is an answer", () => {
		expect(onLoad(null)).toEqual({ showBanner: true, loadZaraz: false });
		expect(onLoad("denied")).toEqual({ showBanner: false, loadZaraz: false });
		expect(onLoad("granted")).toEqual({ showBanner: false, loadZaraz: true });
	});

	it("withdraws only when a refusal follows a grant", () => {
		expect(onAnswer(null, "granted")).toEqual({ loadZaraz: true, withdraw: false });
		expect(onAnswer(null, "denied")).toEqual({ loadZaraz: false, withdraw: false });
		expect(onAnswer("granted", "denied")).toEqual({ loadZaraz: false, withdraw: true });
		expect(onAnswer("denied", "denied")).toEqual({ loadZaraz: false, withdraw: false });
	});

	it("reads only the two answers it writes, and survives storage that throws", () => {
		const s = memory();
		writeChoice(s, "granted");
		expect(s.m.get(CONSENT_KEY)).toBe("granted");
		expect(readChoice(s)).toBe("granted");
		expect(readChoice(memory({ [CONSENT_KEY]: "yes" }))).toBeNull();
		const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
		expect(readChoice(broken)).toBeNull();
		expect(() => writeChoice(broken, "denied")).not.toThrow();
		expect(readChoice(null)).toBeNull();
	});
});

describe("Zaraz hosts and cookies", () => {
	it("is on only where the zone has Zaraz, never locally or on workers.dev", () => {
		expect([...ZARAZ_HOSTS].sort()).toEqual(["preview.serverstartup.dev", "www.serverstartup.io"]);
		for (const host of ["localhost", "127.0.0.1", "serverstartup.io", "www.serverstartup.dev", "x.workers.dev", "toString"])
			expect(zarazEnabled(host)).toBe(false);
	});

	it("loads from the site's own origin, so the CSP needs no new host", () => {
		expect(ZARAZ_LOADER.startsWith("/cdn-cgi/zaraz/")).toBe(true);
		expect(outsideSources(middleware).join(" ")).not.toMatch(/zaraz|google/i);
	});

	it("scopes the cookies to the zone, as Zaraz sets them", () => {
		expect(cookieDomain("preview.serverstartup.dev")).toBe(".serverstartup.dev");
		expect(cookieDomain("www.serverstartup.io")).toBe(".serverstartup.io");
	});
});

describe("withdrawal endpoint", () => {
	const call = (host: string) => POST({ url: new URL(`https://${host}/api/consent-withdraw`) } as never) as Response;

	it("expires every Zaraz cookie on the zone's domain, uncached", () => {
		const res = call("preview.serverstartup.dev");
		expect(res.status).toBe(204);
		expect(res.headers.get("cache-control")).toBe("no-store");
		const cookies = res.headers.getSetCookie();
		expect(cookies).toHaveLength(ZARAZ_COOKIES.length);
		for (const name of ZARAZ_COOKIES)
			expect(cookies).toContain(`${name}=; Max-Age=0; Domain=.serverstartup.dev; Path=/; Secure; SameSite=Lax`);
	});

	it("answers 404 where there is no Zaraz", () => {
		expect(call("localhost").status).toBe(404);
	});
});

describe("wiring", () => {
	it("renders the banner and the footer control only behind one condition", () => {
		expect(base).toMatch(/const showConsent = zarazEnabled\(Astro\.url\.hostname\) &&/);
		expect(base).toMatch(/\{showConsent && <ConsentBanner /);
		expect(base).toMatch(/consentLabel=\{showConsent \? consent\.reopen : undefined\}/);
		expect(footer).toMatch(/\{consentLabel && <button type="button" class="footer-legal__consent" data-consent-open>/);
	});

	it("starts hidden, gives accept and decline the same button, and names the withdrawal endpoint", () => {
		expect(banner).toMatch(/<section class="consent" data-consent-banner[^>]*\shidden>/);
		const buttons = [...banner.matchAll(/<button type="button" class="([^"]+)" data-consent-(accept|reject)>/g)];
		expect(buttons.map((b) => b[2])).toEqual(["accept", "reject"]);
		expect(buttons[0][1]).toBe(buttons[1][1]);
		expect(banner).toMatch(/data-withdraw-url="\/api\/consent-withdraw"/);
	});
});
