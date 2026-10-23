// EmDash's Cloudflare entry: the Astro handler plus a `scheduled()` handler
// (#623). Without it nothing time-driven runs on the deployed Worker: no
// scheduled publishing, no plugin cron, no cleanup of expired passkey
// challenges, tokens or abandoned uploads. On Cloudflare EmDash installs no
// in-process timer; the Cron Trigger in wrangler.jsonc (*/5) drives it
// instead. PluginBridge is the WorkerEntrypoint that sandboxed plugins reach
// through ctx.exports.
export { default, PluginBridge } from "@emdash-cms/cloudflare/worker";
