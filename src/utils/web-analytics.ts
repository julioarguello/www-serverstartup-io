/**
 * Cloudflare Web Analytics, installed by hand (#309).
 *
 * The zone's automatic setup never reached these pages: serverstartup.dev sat
 * in Automatic mode for three months with no beacon in any response, and the
 * same on preview after the CSP admitted it (measured 2026-10-26, curl and a
 * real browser). The pages come from a Worker on a Custom Domain, and the
 * injection did not happen there. So the beacon tag is ours.
 *
 * One token per zone. Each token belongs to the Web Analytics site linked to
 * its zone, and a site counts every host of that zone, so a second host on
 * serverstartup.dev would share preview's site and be told apart with the
 * dashboard's Host filter. www.serverstartup.dev is not listed: a Redirect Rule
 * sends it to www.serverstartup.io before the worker runs (#444), and the edge
 * cache shares one rendered page between the hosts of a worker anyway. A host not listed — localhost, a
 * workers.dev URL, the CI stack — gets no tag, so local runs and the gates
 * never load it. The tokens are not secrets: Cloudflare prints them into the
 * page source of every site that uses the beacon.
 *
 * The site is the one created by picking the zone from the dashboard's
 * drop-down (orange cloud), not by typing a hostname, which the dashboard
 * treats as a host outside Cloudflare (grey cloud).
 */
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

export const BEACON_TOKENS: Readonly<Record<string, string>> = {
	"www.serverstartup.io": "74eb437ed7bc4f62858ed4c99e8c1d6d",
	"preview.serverstartup.dev": "713343e9aee242e480a893e0a955ce02",
};

/** The data-cf-beacon value for this host, or null when the host is not measured. */
export function beaconConfig(hostname: string): string | null {
	const token = Object.hasOwn(BEACON_TOKENS, hostname) ? BEACON_TOKENS[hostname] : undefined;
	return token ? JSON.stringify({ token }) : null;
}
