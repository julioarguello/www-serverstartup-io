/**
 * The cookie notice (#679): the site's own card, wired to Zaraz's Consent API
 * the way sites that drive Zaraz with their own notice do (sources in the
 * issue). Zaraz's automatic window is off in the dashboard; Cloudflare still
 * injects Zaraz on the zones where it is on.
 *
 * The regression this file exists for is #674's: calling setAll(true) and
 * sendQueuedEvents() on every page load re-sent the Pageview Zaraz had already
 * sent, and every page after the first counted twice. A page load with an
 * answer stored must make no call at all.
 *
 * What a real browser does — the notice, the cookies before and after an
 * answer, one Pageview per page — is checked on preview, where Zaraz exists.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { outsideSources } from "./csp-sources";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const base = read("../../src/layouts/Base.astro");
const footer = read("../../src/components/SiteFooter.astro");
const middleware = read("../../src/middleware.ts");
const seed = JSON.parse(read("../../seed/seed.json"));

describe("footer control", () => {
	it("is rendered hidden, so a page without Zaraz never shows a control that does nothing", () => {
		expect(footer).toMatch(/\{consentLabel && <button type="button" class="footer-legal__consent" data-consent-open hidden>\{consentLabel\}<\/button>\}/);
		expect(footer).toMatch(/\.footer-legal__consent\[hidden\] \{ display: none; \}/);
	});

	it("takes its label from the consent widget, and renders only with the whole notice", () => {
		expect(base).toMatch(/reopen: labels\.get\("consent", "reopen"\)/);
		expect(base).toMatch(/consentLabel=\{showConsent \? consent\.reopen : undefined\}/);
	});

	it("no longer opens Zaraz's own window, which is a modal that blocks the page", () => {
		expect(footer).not.toMatch(/showConsentModal/);
		expect(read("../../src/utils/consent.ts")).not.toMatch(/showConsentModal|consent\.modal\s*=/);
	});
});

describe("notice placement", () => {
	it("comes right after the skip link, ahead of the header, so the keyboard reaches it early", () => {
		const body = base.slice(base.indexOf("<body>"));
		const notice = body.indexOf("<ConsentNotice");
		expect(notice).toBeGreaterThan(body.indexOf('class="skip-link"'));
		expect(notice).toBeLessThan(body.indexOf("<SiteHeader"));
	});

	it("is not a modal: no dialog, no aria-modal, no close button", () => {
		const notice = read("../../src/components/ConsentNotice.astro");
		expect(notice).toMatch(/<section class="consent" data-consent-notice aria-label=\{label\} hidden>/);
		expect(notice).not.toMatch(/<dialog|aria-modal|showModal|data-consent-close/);
	});
});

describe("consent widget", () => {
	const widget = (area: string) =>
		seed.widgetAreas.find((a: { name: string }) => a.name === area)?.widgets.find((w: { title: string }) => w.title === "consent");

	it("holds every word of the notice in both locales, Accept and Reject alike", () => {
		const expected = {
			ui_labels_es: ["Aviso de cookies", "Aceptar", "Rechazar", "Preferencias de cookies", "/politica-de-privacidad"],
			ui_labels_en: ["Cookie notice", "Accept", "Reject", "Cookie preferences", "/en/privacy-policy"],
		};
		for (const [area, [region, accept, reject, reopen, privacy]] of Object.entries(expected)) {
			const content = widget(area)?.content as { _key: string; children: { text: string }[]; markDefs?: { href: string }[] }[];
			expect(content.map((b) => b._key)).toEqual(["region", "body", "accept", "reject", "reopen"]);
			const text = (k: string) => content.find((b) => b._key === k)?.children.map((c) => c.text).join("");
			expect([text("region"), text("accept"), text("reject"), text("reopen")]).toEqual([region, accept, reject, reopen]);
			expect(content.find((b) => b._key === "body")?.markDefs?.[0]?.href).toBe(privacy);
		}
	});
});

describe("CSP", () => {
	it("names no Zaraz or Google host: Zaraz is served from this origin", () => {
		expect(outsideSources(middleware).join(" ")).not.toMatch(/zaraz|google/i);
	});

	it("sends no nonce and no 'unsafe-inline' for scripts: the edge adds Zaraz's nonce itself", () => {
		const scriptSrc = middleware.match(/"script-src ([^"]*)"/)?.[1];
		expect(scriptSrc).toBeDefined();
		expect(scriptSrc).not.toMatch(/'unsafe-inline'|'nonce-/);
	});
});

describe("stored answer", async () => {
	const { storedAnswer, callsFor } = await import("../../src/utils/consent");

	it("is read from Zaraz's consent cookie by presence: none, granted or denied", () => {
		expect(storedAnswer("")).toBeNull();
		expect(storedAnswer("cf_zaraz_client=; other=1")).toBeNull();
		expect(storedAnswer('zaraz-consent={"aVmw":true}')).toBe("granted");
		expect(storedAnswer('a=1; zaraz-consent={"aVmw":false}')).toBe("denied");
		expect(storedAnswer(`cf_consent=${encodeURIComponent('{"TlZw":true}')}`)).toBe("granted");
		expect(storedAnswer("zaraz-consent=garbage")).toBe("denied");
	});

	it("decides the calls: sendQueuedEvents only when consent becomes granted, nothing when it does not change", () => {
		expect(callsFor(null, "granted")).toEqual(["grant", "sendQueued"]);
		expect(callsFor("denied", "granted")).toEqual(["grant", "sendQueued"]);
		expect(callsFor("granted", "granted")).toEqual([]);
		expect(callsFor(null, "denied")).toEqual(["deny"]);
		expect(callsFor("granted", "denied")).toEqual(["deny"]);
		expect(callsFor("denied", "denied")).toEqual([]);
	});
});

describe("the notice on a page", async () => {
	const { start } = await import("../../src/utils/consent");

	/** Just enough of a page for start(): the notice, its two buttons, the footer control. */
	function page(opts: { cookie?: string; zaraz?: boolean; ready?: boolean }) {
		const calls: string[] = [];
		const listeners = new Map<string, () => void>();
		const button = () => {
			const clicks: (() => void)[] = [];
			return { clicks, focused: false, addEventListener: (_: string, fn: () => void) => void clicks.push(fn), focus() { this.focused = true; } };
		};
		const accept = button();
		const reject = button();
		const open = { hidden: true, ...button() };
		const notice = { hidden: true, offsetHeight: 180, querySelector: (s: string) => (s.includes("accept") ? accept : s.includes("reject") ? reject : null) };
		const style = new Map<string, string>();
		const consent = {
			APIReady: opts.ready ?? true,
			setAll: (v: boolean) => void calls.push(`setAll(${v})`),
			sendQueuedEvents: () => void calls.push("sendQueuedEvents"),
		};
		const doc = {
			cookie: opts.cookie ?? "",
			documentElement: { style: { setProperty: (k: string, v: string) => void style.set(k, v), removeProperty: (k: string) => void style.delete(k) } },
			querySelector: (s: string) => (s === "[data-consent-notice]" ? notice : null),
			querySelectorAll: (s: string) => (s === "[data-consent-open]" ? [open] : []),
			addEventListener: (type: string, fn: () => void) => void listeners.set(type, fn),
		};
		const win = { document: doc, zaraz: opts.zaraz === false ? undefined : { consent } } as never;
		start(win);
		return { calls, notice, accept, reject, open, style, listeners, consent };
	}

	it("#674's regression: with an answer stored, a page load makes no call at all and shows nothing", () => {
		for (const cookie of ['zaraz-consent={"aVmw":true}', 'zaraz-consent={"aVmw":false}']) {
			const p = page({ cookie });
			expect(p.calls).toEqual([]);
			expect(p.notice.hidden).toBe(true);
		}
	});

	it("shows the notice to a visitor who has not answered, and still calls nothing until a click", () => {
		const p = page({});
		expect(p.notice.hidden).toBe(false);
		expect(p.calls).toEqual([]);
		expect(p.style.get("scroll-padding-bottom")).toBe("180px");
	});

	it("Accept grants and sends the queued Pageview once; Reject only denies", () => {
		const a = page({});
		a.accept.clicks[0]();
		expect(a.calls).toEqual(["setAll(true)", "sendQueuedEvents"]);
		expect(a.notice.hidden).toBe(true);
		expect(a.style.has("scroll-padding-bottom")).toBe(false);
		const r = page({});
		r.reject.clicks[0]();
		expect(r.calls).toEqual(["setAll(false)"]);
	});

	it("reopened from the footer by a visitor who had accepted, Accept again sends nothing", () => {
		const p = page({ cookie: 'zaraz-consent={"aVmw":true}' });
		expect(p.open.hidden).toBe(false);
		p.open.clicks[0]();
		expect(p.notice.hidden).toBe(false);
		expect(p.accept.focused).toBe(true);
		p.accept.clicks[0]();
		expect(p.calls).toEqual([]);
	});

	it("waits for zarazConsentAPIReady when the API is not ready yet", () => {
		const p = page({ ready: false });
		expect(p.notice.hidden).toBe(true);
		p.listeners.get("zarazConsentAPIReady")?.();
		expect(p.notice.hidden).toBe(false);
	});

	it("does nothing where Zaraz is absent", () => {
		const none = page({ zaraz: false });
		expect(none.notice.hidden).toBe(true);
		expect(none.open.hidden).toBe(true);
	});
});
