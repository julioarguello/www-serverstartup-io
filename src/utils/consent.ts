/**
 * The cookie notice, wired to Zaraz's Consent API (#679).
 *
 * Zaraz stays as Cloudflare injects it; only its automatic consent window is
 * off, because that window is a true modal (`showModal()`) and blocks the page.
 * This module copies the pattern that sites driving Zaraz with their own notice
 * share, and that the issue lists source by source:
 *
 * - wait for `zaraz.consent.APIReady` or the `zarazConsentAPIReady` event, as in
 *   the only full example of Cloudflare's Consent API docs;
 * - show the notice only while Zaraz's consent cookie is absent, checked by
 *   presence and never with `getAll()`, which answers `false` for a visitor who
 *   has not answered yet;
 * - call the API only inside a click handler, and `sendQueuedEvents()` only
 *   when consent goes from not granted to granted, as c15t's Zaraz bridge does.
 *
 * Calling `setAll(true)` and `sendQueuedEvents()` on every page load re-sends
 * the Pageview Zaraz has already sent. The banner of #674 did that, and every
 * page after the first counted twice.
 *
 * The decisions are plain functions, tested without a browser; `start()` only
 * wires them to the page.
 */

/** Names Zaraz may store the answer under: `cf_consent` by default, renamable per zone. */
export const CONSENT_COOKIES = ["zaraz-consent", "cf_consent"] as const;

export type Answer = "granted" | "denied" | null;

/**
 * The visitor's stored answer, read from the cookie string. Zaraz stores one
 * JSON object of purpose → boolean; granted means every purpose is true.
 */
export function storedAnswer(cookie: string): Answer {
	for (const part of cookie.split(/;\s*/)) {
		const eq = part.indexOf("=");
		const name = part.slice(0, eq);
		if (!(CONSENT_COOKIES as readonly string[]).includes(name)) continue;
		try {
			const values = Object.values(JSON.parse(decodeURIComponent(part.slice(eq + 1))) as Record<string, unknown>);
			return values.length > 0 && values.every((v) => v === true) ? "granted" : "denied";
		} catch {
			return "denied";
		}
	}
	return null;
}

/** The API calls an answer makes, given the one stored before it: none when nothing changes. */
export function callsFor(previous: Answer, answer: "granted" | "denied"): Array<"grant" | "deny" | "sendQueued"> {
	if (previous === answer) return [];
	return answer === "granted" ? ["grant", "sendQueued"] : ["deny"];
}

type ZarazConsent = { APIReady?: boolean; setAll(v: boolean): void; sendQueuedEvents?(): void };
export type ZarazWindow = Window & { zaraz?: { consent?: ZarazConsent } };

/** Run `fn` once Zaraz's Consent API is ready (Cloudflare's documented check). */
function whenReady(win: ZarazWindow, fn: (c: ZarazConsent) => void): void {
	const consent = win.zaraz?.consent;
	if (consent?.APIReady) fn(consent);
	else win.document.addEventListener("zarazConsentAPIReady", () => win.zaraz?.consent && fn(win.zaraz.consent), { once: true });
}

/** Wire the notice and the footer control on this page. Nothing happens where Zaraz is absent. */
export function start(win: ZarazWindow = window as ZarazWindow): void {
	const doc = win.document;
	const notice = doc.querySelector<HTMLElement>("[data-consent-notice]");
	if (!notice || !win.zaraz) return;
	const root = doc.documentElement;

	const show = (focus: boolean) => {
		notice.hidden = false;
		// WCAG 2.4.11: a fixed notice must not hide what receives focus
		root.style.setProperty("scroll-padding-bottom", `${notice.offsetHeight}px`);
		if (focus) notice.querySelector<HTMLElement>("[data-consent-accept]")?.focus();
	};
	const hide = () => {
		notice.hidden = true;
		root.style.removeProperty("scroll-padding-bottom");
	};

	// Zaraz's own window must be off in the dashboard before this ships: when the
	// API reports ready, that window has not opened yet (`consent.modal` is still
	// false, measured on production 2026-10-28), so no check here can avoid both.
	whenReady(win, () => {
		if (storedAnswer(doc.cookie) === null) show(false);
	});

	const answer = (choice: "granted" | "denied") => {
		const previous = storedAnswer(doc.cookie);
		hide();
		whenReady(win, (consent) => {
			for (const call of callsFor(previous, choice)) {
				if (call === "grant") consent.setAll(true);
				else if (call === "deny") consent.setAll(false);
				else consent.sendQueuedEvents?.();
			}
		});
	};
	notice.querySelector("[data-consent-accept]")?.addEventListener("click", () => answer("granted"));
	notice.querySelector("[data-consent-reject]")?.addEventListener("click", () => answer("denied"));

	for (const el of doc.querySelectorAll<HTMLElement>("[data-consent-open]")) {
		el.hidden = false;
		el.addEventListener("click", () => show(true));
	}
}
