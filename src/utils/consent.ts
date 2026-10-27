/**
 * The analytics consent, in the browser (#667).
 *
 * The answer is kept in localStorage under CONSENT_KEY, the one thing stored
 * before or without consent: remembering a refusal is what lets the banner
 * stay away. Zaraz is loaded only on "granted". On a withdrawal after a grant,
 * Zaraz is told on the page that has it loaded, and the server expires the
 * cookies it had set (they are HttpOnly).
 *
 * The decisions are plain functions over the stored value, so they are tested
 * without a browser; `start()` only wires them to the page.
 */
export const CONSENT_KEY = "ss-analytics-consent";

export type Choice = "granted" | "denied";

/** The stored answer, or null when there is none or storage is unavailable. */
export function readChoice(storage: Pick<Storage, "getItem"> | null): Choice | null {
	try {
		const v = storage?.getItem(CONSENT_KEY);
		return v === "granted" || v === "denied" ? v : null;
	} catch {
		return null;
	}
}

export function writeChoice(storage: Pick<Storage, "setItem"> | null, choice: Choice): void {
	try {
		storage?.setItem(CONSENT_KEY, choice);
	} catch {
		// private mode: the answer holds for this page only, and the banner returns next time
	}
}

/** What a page does on load, given the stored answer. */
export function onLoad(choice: Choice | null): { showBanner: boolean; loadZaraz: boolean } {
	return { showBanner: choice === null, loadZaraz: choice === "granted" };
}

/** What an answer does, given the one stored before it. */
export function onAnswer(previous: Choice | null, answer: Choice): { loadZaraz: boolean; withdraw: boolean } {
	return { loadZaraz: answer === "granted", withdraw: answer === "denied" && previous === "granted" };
}

type ZarazConsent = { setAll(v: boolean): void; sendQueuedEvents?(): void; APIReady?: boolean };
type ZarazWindow = Window & { zaraz?: { consent?: ZarazConsent } };

/** Run `fn` with Zaraz's consent API once it is ready. */
function withConsentApi(win: ZarazWindow, fn: (c: ZarazConsent) => void): void {
	const consent = win.zaraz?.consent;
	if (consent?.APIReady) fn(consent);
	else win.document.addEventListener("zarazConsentAPIReady", () => win.zaraz?.consent && fn(win.zaraz.consent), { once: true });
}

/** Append the Zaraz loader once, and grant its purposes when it is ready. */
export function loadZaraz(win: ZarazWindow, src: string): void {
	const doc = win.document;
	if (!doc.querySelector(`script[src="${src}"]`)) {
		const s = doc.createElement("script");
		s.src = src;
		s.referrerPolicy = "origin";
		doc.head.appendChild(s);
	}
	withConsentApi(win, (c) => {
		c.setAll(true);
		c.sendQueuedEvents?.();
	});
}

/** Wire the banner and the footer control on this page. */
export function start(win: ZarazWindow = window as ZarazWindow): void {
	const doc = win.document;
	const banner = doc.querySelector<HTMLElement>("[data-consent-banner]");
	if (!banner) return;
	const src = banner.dataset.zarazSrc ?? "";
	const withdrawUrl = banner.dataset.withdrawUrl ?? "";
	const storage = (() => {
		try {
			return win.localStorage;
		} catch {
			return null;
		}
	})();

	const initial = onLoad(readChoice(storage));
	banner.hidden = !initial.showBanner;
	if (initial.loadZaraz) loadZaraz(win, src);

	const answer = (choice: Choice) => {
		const step = onAnswer(readChoice(storage), choice);
		writeChoice(storage, choice);
		banner.hidden = true;
		if (step.loadZaraz) loadZaraz(win, src);
		if (step.withdraw) {
			win.zaraz?.consent?.setAll(false);
			void win.fetch(withdrawUrl, { method: "POST", credentials: "same-origin" }).catch(() => undefined);
		}
	};
	banner.querySelector("[data-consent-accept]")?.addEventListener("click", () => answer("granted"));
	banner.querySelector("[data-consent-reject]")?.addEventListener("click", () => answer("denied"));
	for (const el of doc.querySelectorAll("[data-consent-open]"))
		el.addEventListener("click", () => {
			banner.hidden = false;
			banner.querySelector<HTMLElement>("[data-consent-accept]")?.focus();
		});
}
