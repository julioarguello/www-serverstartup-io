/**
 * Google Analytics 4 through Zaraz, behind the site's own consent banner (#667).
 *
 * Zaraz is Cloudflare's tag manager. It is served from this site's own origin
 * (/cdn-cgi/zaraz/*) and runs GA4 on Cloudflare's servers, so the browser never
 * talks to Google. It is configured per zone in the dashboard
 * (docs/how-to/set-up-analytics.md), with Auto-inject off: the page loads it
 * only after the visitor accepts (src/utils/consent.ts). A visitor who declines
 * or never answers loads nothing and gets no cookie from it.
 *
 * A host is listed only once Zaraz is on for its zone. The banner asks for
 * nothing anywhere else: localhost, the CI stack and workers.dev hostnames
 * render no banner and no footer control.
 */
export const ZARAZ_HOSTS: ReadonlySet<string> = new Set(["preview.serverstartup.dev", "www.serverstartup.io"]);

export const ZARAZ_LOADER = "/cdn-cgi/zaraz/i.js";

/**
 * The cookies Zaraz sets once GA4 runs, all on the zone's registrable domain.
 * Three are HttpOnly, so the browser cannot remove them on a withdrawal; the
 * withdrawal endpoint (src/pages/api/consent-withdraw.ts) expires them instead.
 * Measured on preview: cf_zaraz_client (empty, 1 year), zaraz-consent (the
 * answer, 1 year, readable by scripts), cfz_google-analytics_v4 (1 year) and
 * cfzs_google-analytics_v4 (session).
 */
export const ZARAZ_COOKIES = ["cf_zaraz_client", "zaraz-consent", "cfz_google-analytics_v4", "cfzs_google-analytics_v4"] as const;

export function zarazEnabled(hostname: string): boolean {
	return ZARAZ_HOSTS.has(hostname);
}

/** The domain Zaraz scopes its cookies to: the zone, as ".serverstartup.dev". */
export function cookieDomain(hostname: string): string {
	return `.${hostname.split(".").slice(-2).join(".")}`;
}
