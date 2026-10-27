/**
 * The language of Zaraz's consent window follows the page, not the browser (#667).
 *
 * Zaraz picks the window's language from the browser's Accept-Language unless
 * `__zarazConsentLanguage` is set (Zaraz docs: Consent management → "force the
 * consent modal language"). It builds the window once, while it starts, from
 * what it finds then; `zaraz.set()` before that point is only queued, so it
 * would take effect from the next page. Measured on production, 2026-10-27:
 * set on page 1, right on page 2; reopened on page 1, still wrong.
 *
 * So the value is also written where `zaraz.set()` keeps it (scope `persist`,
 * the default: localStorage, key `_zaraz_` + name, JSON value — measured), before
 * Zaraz starts on DOMContentLoaded. Module scripts run before that event. If
 * Zaraz ever stores it elsewhere, the documented `zaraz.set()` below still makes
 * every page after the first right.
 */
export const LANGUAGE_KEY = "__zarazConsentLanguage";
export const STORAGE_KEY = `_zaraz_${LANGUAGE_KEY}`;

/** The window's language for a page: the codes its text is entered under in Zaraz. */
export function consentLanguage(htmlLang: string): "es" | "en" {
	return htmlLang.toLowerCase().startsWith("en") ? "en" : "es";
}

type ZarazPage = { zaraz?: { set?: (key: string, value: unknown) => void } };

export function setConsentLanguage(page: ZarazPage, htmlLang: string, storage: Pick<Storage, "setItem"> | null): void {
	if (!page.zaraz) return;
	const lang = consentLanguage(htmlLang);
	try {
		storage?.setItem(STORAGE_KEY, JSON.stringify(lang));
	} catch {
		// storage blocked: the window follows the browser on this page
	}
	page.zaraz.set?.(LANGUAGE_KEY, lang);
}
