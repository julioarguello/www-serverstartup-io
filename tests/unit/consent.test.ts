/**
 * The analytics consent (#667) is Zaraz's own, the standard setup: Cloudflare
 * injects Zaraz on the zones where it is on, Zaraz shows its consent window,
 * and GA4 runs only after Accept. The window's text lives in the Zaraz
 * dashboard (docs/how-to/set-up-analytics.md). What is left in this repository
 * is pinned here: the footer control that reopens the window, its one label,
 * and a CSP that needs nothing for Zaraz.
 *
 * What a real browser does — the window, the cookies before and after an
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

	it("is revealed only where Zaraz is on the page, and reopens Zaraz's window", () => {
		const script = footer.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
		expect(script).toMatch(/if \(page\.zaraz\)/);
		expect(script).toMatch(/el\.hidden = false;/);
		expect(script).toMatch(/addEventListener\("click", \(\) => page\.zaraz\?\.showConsentModal\?\.\(\)\)/);
	});

	it("takes its label from the consent widget", () => {
		expect(base).toMatch(/const consentReopen = labels\.get\("consent", "reopen"\) \|\| undefined;/);
		expect(base).toMatch(/consentLabel=\{consentReopen\}/);
	});
});

describe("consent widget", () => {
	const widget = (area: string) =>
		seed.widgetAreas.find((a: { name: string }) => a.name === area)?.widgets.find((w: { title: string }) => w.title === "consent");

	it("holds only the footer label in both locales: the window's words are Zaraz's", () => {
		const labels = { ui_labels_es: "Preferencias de cookies", ui_labels_en: "Cookie preferences" };
		for (const [area, text] of Object.entries(labels)) {
			const content = widget(area)?.content;
			expect(content?.map((b: { _key: string }) => b._key)).toEqual(["reopen"]);
			expect(content[0].children[0].text).toBe(text);
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

describe("consent window language", async () => {
	const { LANGUAGE_KEY, STORAGE_KEY, consentLanguage, setConsentLanguage } = await import("../../src/utils/zaraz-language");

	it("follows the page: es and en, Spanish for anything else", () => {
		expect(consentLanguage("es")).toBe("es");
		expect(consentLanguage("en")).toBe("en");
		expect(consentLanguage("en-GB")).toBe("en");
		expect(consentLanguage("")).toBe("es");
	});

	it("is stored where zaraz.set keeps it, before Zaraz starts, and set through the documented call too", () => {
		const stored = new Map<string, string>();
		const calls: unknown[][] = [];
		setConsentLanguage({ zaraz: { set: (...a: unknown[]) => void calls.push(a) } }, "en", { setItem: (k, v) => void stored.set(k, v) });
		expect(STORAGE_KEY).toBe("_zaraz___zarazConsentLanguage");
		expect(stored.get(STORAGE_KEY)).toBe('"en"');
		expect(calls).toEqual([[LANGUAGE_KEY, "en"]]);
	});

	it("does nothing where Zaraz is not on the page, and survives blocked storage", () => {
		const stored = new Map<string, string>();
		setConsentLanguage({}, "es", { setItem: (k, v) => void stored.set(k, v) });
		expect(stored.size).toBe(0);
		const calls: unknown[][] = [];
		const blocked = { setItem: () => { throw new Error("blocked"); } };
		expect(() => setConsentLanguage({ zaraz: { set: (...a: unknown[]) => void calls.push(a) } }, "es", blocked)).not.toThrow();
		expect(calls).toEqual([[LANGUAGE_KEY, "es"]]);
	});

	it("runs from the footer's module script, which executes before DOMContentLoaded, when Zaraz starts", () => {
		const script = footer.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
		expect(script).toMatch(/import \{ setConsentLanguage \} from "\.\.\/utils\/zaraz-language";/);
		expect(script).toMatch(/setConsentLanguage\(window as never, document\.documentElement\.lang,/);
	});
});
