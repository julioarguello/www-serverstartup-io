/**
 * The README's badges say what the repository can prove, and nobody edits them (#600).
 *
 * Every badge is live. The CI status is GitHub's own badge; the versions are
 * shields.io reading `package.json`; the gate count, the Lighthouse thresholds,
 * the WCAG level and the CSP are endpoint badges whose JSON `scripts/badges.mjs`
 * derives from the files that own them, and `.github/workflows/badges.yml`
 * publishes on the `badges` branch after every green run on main. A typed
 * value would drift the day its owner changed (the page's gate count did,
 * #499); a derived one cannot, so the README carries no values at all.
 *
 * Held here: the README points at exactly the badges the script publishes;
 * each value matches its owner; the script refuses rather than guesses when an
 * owner loses the value (a control on a copy of the tree); each badge's text
 * matches a static image; each relative link exists. `gate-count.test.ts`
 * holds the gate count. NOT held: that shields.io or raw.githubusercontent.com
 * are up, or that the workflow has run — the job's own status says that.
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { computeBadges } from "../../scripts/badges.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

const README = read("README.md");
type Badge = { alt: string; img: string; href: string };
const badges: Badge[] = [...README.matchAll(/\[!\[([^\]]*)\]\(([^)\s]+)\)\]\(([^)\s]+)\)/g)].map((m) => ({
	alt: m[1],
	img: m[2],
	href: m[3],
}));
const computed = computeBadges(ROOT);

/** shields.io's static path `label-message-color`: `--` is a dash, `_` a space. */
function staticText(img: string): string | null {
	const m = img.match(/^https:\/\/img\.shields\.io\/badge\/([^?]+)/);
	if (!m) return null;
	const parts = m[1].split(/(?<!-)-(?!-)/).map((p) => decodeURIComponent(p).replace(/--/g, "-").replace(/_/g, " "));
	parts.pop(); // the colour
	return parts.join(": ");
}

/** The endpoint file an endpoint badge reads, by name: `gates`, `lighthouse`… */
function endpointName(img: string): string | null {
	const m = img.match(/^https:\/\/img\.shields\.io\/endpoint\?url=([^&]+)/);
	if (!m) return null;
	const url = decodeURIComponent(m[1]);
	return url.match(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/badges\/([a-z-]+)\.json$/)?.[1] ?? "";
}

describe("the row", () => {
	it("is there", () => {
		expect(badges.length, "no badges parsed from README.md").toBeGreaterThanOrEqual(8);
	});

	it("points at exactly the badges the script publishes, on the badges branch", () => {
		const used = badges.map((b) => endpointName(b.img)).filter((n): n is string => n !== null);
		expect(used.every((n) => n !== ""), "an endpoint badge reads something other than the badges branch").toBe(true);
		expect(new Set(used)).toEqual(new Set(Object.keys(computed)));
	});

	it("types no value: a static badge's text is what its image says, and no text carries a number", () => {
		for (const b of badges) {
			const text = staticText(b.img);
			if (text !== null) expect(text, b.img).toBe(b.alt);
			expect(b.alt, `a value typed into the README: ${b.alt}`).not.toMatch(/\d/);
		}
	});

	it("links each relative target to a file in the repository", () => {
		for (const b of badges) {
			if (!/^https?:/.test(b.href)) expect(existsSync(join(ROOT, b.href)), b.href).toBe(true);
		}
	});

	it("shows the status of the workflow that runs the gates", () => {
		const b = badges.find((x) => /\/actions\/workflows\/[^/]+\/badge\.svg/.test(x.img));
		expect(b, "no GitHub workflow badge").toBeDefined();
		const file = b!.img.match(/\/actions\/workflows\/([^/]+)\/badge\.svg/)![1];
		expect(read(".github", "workflows", file)).toMatch(/^name: quality-gates$/m);
	});

	it("reads versions of dependencies the site declares", () => {
		const pkg = JSON.parse(read("package.json"));
		const deps = { ...pkg.dependencies, ...pkg.devDependencies };
		const live = badges.filter((b) => b.img.includes("/github/package-json/dependency-version/"));
		expect(live.length).toBeGreaterThanOrEqual(2);
		for (const b of live) expect(deps).toHaveProperty(b.img.match(/dependency-version\/[^/]+\/[^/]+\/([^?]+)/)![1]);
	});
});

describe("each published value matches its owner", () => {
	it("Lighthouse: the thresholds lighthouserc.json enforces, in order", () => {
		const rc = JSON.parse(read("lighthouserc.json"));
		const a = rc.ci.assert.assertions as Record<string, [string, { minScore: number }]>;
		const show = (c: string) => {
			const min = a[`categories:${c}`][1].minScore;
			return min < 1 ? `≥${Math.round(min * 100)}` : "100";
		};
		expect(computed.lighthouse.message).toBe(
			`perf ${show("performance")} · a11y ${show("accessibility")} · best practices ${show("best-practices")} · SEO ${show("seo")}`,
		);
	});

	it("accessibility: the WCAG level is a tag the a11y gate passes to axe", () => {
		const level = computed.accessibility.message.match(/WCAG (\d)\.(\d) AA/);
		expect(level).not.toBeNull();
		const tag = level![2] === "0" ? "wcag2aa" : `wcag${level![1]}${level![2]}aa`;
		expect(read("scripts", "ci-check-a11y.mjs")).toContain(`"${tag}"`);
	});

	it("CSP: the policy the middleware sends and the headers gate asserts", () => {
		expect(read("src", "middleware.ts")).toContain(`"${computed.csp.message}"`);
		expect(read("scripts", "ci-check-headers.sh")).toContain(`"${computed.csp.message}"`);
	});

	it("every badge is a shields.io endpoint document", () => {
		for (const b of Object.values(computed)) {
			expect(b.schemaVersion).toBe(1);
			expect(b.label && b.message, JSON.stringify(b)).toBeTruthy();
		}
	});
});

describe("control — the script refuses rather than guesses", () => {
	const copy = mkdtempSync(join(tmpdir(), "badges-"));
	afterAll(() => rmSync(copy, { recursive: true, force: true }));
	for (const f of [".github/workflows/ci.yml", "lighthouserc.json", "scripts/ci-check-a11y.mjs", "src/middleware.ts"]) {
		cpSync(join(ROOT, f), join(copy, f), { recursive: true });
	}

	it("derives the same badges from an unchanged copy", () => {
		expect(computeBadges(copy)).toEqual(computed);
	});

	it("throws when the middleware no longer states a default-src", () => {
		const mw = join(copy, "src", "middleware.ts");
		writeFileSync(mw, readFileSync(mw, "utf8").replace(/"default-src [^"]+"/g, '"base-uri \'none\'"'));
		expect(() => computeBadges(copy)).toThrow(/default-src/);
	});
});
