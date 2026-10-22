/**
 * Minimal ambient declaration for the Workers runtime module used by the
 * cache-purge plugin (#357) and the setup gate (#610). The full @cloudflare/workers-types globals are
 * deliberately NOT included in src/ (they collide with DOM lib types), so
 * this mirrors just the shape we consume — kept in sync with
 * CachePurgeOptions/CacheContext in @cloudflare/workers-types.
 */
declare module "cloudflare:workers" {
	/** Worker secrets and vars this code reads; set per environment, never committed. */
	export const env: {
		SETUP_GATE_TOKEN?: string;
	};
	export const cache: {
		purge(options: {
			tags?: string[];
			pathPrefixes?: string[];
			purgeEverything?: boolean;
		}): Promise<{ success: boolean; errors: unknown[] }>;
	};
}
