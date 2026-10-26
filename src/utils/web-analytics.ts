/**
 * Cloudflare Web Analytics, installed by hand (#309).
 *
 * The zone's automatic setup never reached these pages: serverstartup.dev sat
 * in Automatic mode for three months with no beacon in any response, and the
 * same on preview after the CSP admitted it (measured 2026-10-26, curl and a
 * real browser). The pages come from a Worker on a Custom Domain, and the
 * injection did not happen there. So the beacon tag is ours.
 *
 * One token per hostname, because one production build answers on two hosts
 * (www.serverstartup.io and the www.serverstartup.dev rehearsal) and each
 * counts in its own Web Analytics site. A host not listed — localhost, a
 * workers.dev URL, the CI stack — gets no tag, so local runs and the gates
 * never load it. The tokens are not secrets: Cloudflare prints them into the
 * page source of every site that uses the beacon.
 */
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

export const BEACON_TOKENS: Readonly<Record<string, string>> = {
	"www.serverstartup.io": "1d8769731cbc4e958ef216e9502477c3",
	"preview.serverstartup.dev": "19d9fd098b72400aa1929b5eace6c5ce",
	"www.serverstartup.dev": "713343e9aee242e480a893e0a955ce02",
};

/** The data-cf-beacon value for this host, or null when the host is not measured. */
export function beaconConfig(hostname: string): string | null {
	const token = Object.hasOwn(BEACON_TOKENS, hostname) ? BEACON_TOKENS[hostname] : undefined;
	return token ? JSON.stringify({ token }) : null;
}
