// EmDash's Cloudflare entry: the Astro handler plus a `scheduled()` handler
// (#623). Without it nothing time-driven runs on the deployed Worker: no
// scheduled publishing, no plugin cron, no cleanup of expired passkey
// challenges, tokens or abandoned uploads. On Cloudflare EmDash installs no
// in-process timer; the Cron Trigger in wrangler.jsonc (*/5) drives it
// instead. PluginBridge is the WorkerEntrypoint that sandboxed plugins reach
// through ctx.exports.
import worker, { PluginBridge } from "@emdash-cms/cloudflare/worker";
import { withoutHtmlValidators } from "./utils/html-validators";

export { PluginBridge };

// HTML loses Last-Modified and ETag on the way out (#694): see the helper.
type Fetch = NonNullable<typeof worker.fetch>;
const astroFetch = worker.fetch as Fetch;

export default {
	...worker,
	async fetch(...args: Parameters<Fetch>): Promise<Response> {
		return withoutHtmlValidators(await astroFetch(...args));
	},
};
