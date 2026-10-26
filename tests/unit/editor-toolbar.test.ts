/**
 * EmDash's visual-editing toolbar stays off on public pages (#655).
 *
 * For a signed-in editor EmDash injects it as an inline <script>. The public
 * CSP admits no inline script — no hash, no nonce (src/middleware.ts) — so
 * the browser drew the toolbar and refused its script: controls that did
 * nothing, seen by the founder on 2026-10-24. Its default is "server" — on —
 * so removing the line brings it back and nothing else would notice: the
 * rendered gates run anonymous, and anonymous HTML is identical either way.
 * Verified against `astro dev` with EmDash's dev-bypass session: 7 toolbar
 * markers on the home for the editor without the line, 0 with it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const config = readFileSync(join(ROOT, "astro.config.mjs"), "utf8");
const middleware = readFileSync(join(ROOT, "src", "middleware.ts"), "utf8");

/** The `toolbar` value passed to `emdash({…})`, comments excluded — a commented-out line is no setting. */
const toolbarSetting = (source: string): string | null =>
	source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "").match(/emdash\(\{[\s\S]*?\btoolbar:\s*([^,\n}]+)/)?.[1]?.trim() ?? null;

describe("EmDash's editor toolbar", () => {
	it("reads the setting, and only an uncommented one", () => {
		// Positive control both ways: the regex must see a live value and miss a commented one.
		expect(toolbarSetting("emdash({\n\tfonts: false,\n\ttoolbar: false,\n})")).toBe("false");
		expect(toolbarSetting("emdash({\n\tfonts: false,\n\t// toolbar: false,\n})")).toBeNull();
		expect(toolbarSetting('emdash({\n\ttoolbar: "server",\n})')).toBe('"server"');
	});

	it("is off in astro.config.mjs", () => {
		expect(toolbarSetting(config)).toBe("false");
	});

	it("is off for the reason recorded: the public CSP refuses inline scripts", () => {
		// If the CSP ever gains a nonce or 'unsafe-inline', this premise is gone and the
		// decision in #655 is worth revisiting rather than inheriting.
		// Hosts may be added (the Web Analytics beacon, #309); an inline allowance may not.
		const scriptSrc = middleware.match(/"script-src ([^"]+)"/)?.[1];
		expect(scriptSrc).toMatch(/^'self'/);
		expect(scriptSrc).not.toMatch(/'unsafe-inline'|'nonce-|'sha(256|384|512)-|'strict-dynamic'/);
	});
});
