import type { APIRoute } from "astro";
import { ZARAZ_COOKIES, cookieDomain, zarazEnabled } from "../../utils/zaraz";

/**
 * A withdrawal of analytics consent (#667): expire every cookie Zaraz set.
 *
 * Three of them are HttpOnly, so the page that withdraws cannot remove them
 * itself. Zaraz scopes them to the zone (".serverstartup.dev"), and a cookie
 * is only removed by a Set-Cookie naming the same domain and path. Answers
 * 204 with nothing to read; a host without Zaraz gets a 404.
 */
export const prerender = false;

export const POST: APIRoute = ({ url }) => {
	if (!zarazEnabled(url.hostname)) return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
	const headers = new Headers({ "cache-control": "no-store" });
	const domain = cookieDomain(url.hostname);
	for (const name of ZARAZ_COOKIES) headers.append("set-cookie", `${name}=; Max-Age=0; Domain=${domain}; Path=/; Secure; SameSite=Lax`);
	return new Response(null, { status: 204, headers });
};
