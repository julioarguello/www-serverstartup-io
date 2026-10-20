/**
 * The README's badges say what the repository can prove (#600).
 *
 * A badge is a claim printed on the front page of a public repository, and a
 * static one is a typed copy of a fact that lives elsewhere: it drifts the day
 * the owner changes, exactly as the gate count on /deconstruyendo once did
 * (#499). So every badge here is either live — GitHub's own workflow badge, or
 * shields.io reading `package.json` — or checked against its owner below.
 * `gate-count.test.ts` holds the gate count, as it does for the page.
 *
 * Also checked: each badge's text (its alt, what a screen reader and the
 * README source show) says the same as the image it loads, and each relative
 * link points at a file that exists. What is NOT checked: that shields.io is
 * up, or what the live badges show — they are live precisely so nothing typed
 * here has to be right about them.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

const README = read("README.md");
type Badge = { alt: string; img: string; href: string };
const badges: Badge[] = [...README.matchAll(/\[!\[([^\]]*)\]\(([^)\s]+)\)\]\(([^)\s]+)\)/g)].map((m) => ({
	alt: m[1],
	img: m[2],
	href: m[3],
}));
const byAlt = (prefix: string) => badges.find((b) => b.alt.startsWith(prefix));

/** shields.io's static path `label-message-color`: `--` is a dash, `_` a space. */
function staticText(img: string): string | null {
	const m = img.match(/^https:\/\/img\.shields\.io\/badge\/([^?]+)/);
	if (!m) return null;
	const parts = m[1].split(/(?<!-)-(?!-)/).map((p) => decodeURIComponent(p).replace(/--/g, "-").replace(/_/g, " "));
	parts.pop(); // the colour
	return parts.join(": ");
}

describe("the badges are there", () => {
	it("found the row", () => {
		expect(badges.length, "no badges parsed from README.md").toBeGreaterThanOrEqual(8);
	});

	it("each static badge's text is what its image says", () => {
		for (const b of badges) {
			const text = staticText(b.img);
			if (text !== null) expect(text, b.img).toBe(b.alt);
		}
	});

	it("each relative link points at a file in the repository", () => {
		for (const b of badges) {
			if (!/^https?:/.test(b.href)) expect(existsSync(join(ROOT, b.href)), b.href).toBe(true);
		}
	});
});

describe("each claim has its owner", () => {
	it("the status badge is the workflow that runs the gates", () => {
		const b = badges.find((x) => /\/actions\/workflows\/[^/]+\/badge\.svg/.test(x.img));
		expect(b, "no GitHub workflow badge").toBeDefined();
		const file = b!.img.match(/\/actions\/workflows\/([^/]+)\/badge\.svg/)![1];
		expect(existsSync(join(ROOT, ".github", "workflows", file))).toBe(true);
		expect(read(".github", "workflows", file)).toMatch(/^name: quality-gates$/m);
	});

	it("Lighthouse shows the thresholds lighthouserc.json enforces, in order", () => {
		const rc = JSON.parse(read("lighthouserc.json"));
		const a = rc.ci.assert.assertions as Record<string, [string, { minScore: number }]>;
		const show = (c: string) => {
			const min = a[`categories:${c}`][1].minScore;
			return min < 1 ? `≥${Math.round(min * 100)}` : "100";
		};
		const expected = `Lighthouse: perf ${show("performance")} · a11y ${show("accessibility")} · best practices ${show("best-practices")} · SEO ${show("seo")}`;
		expect(byAlt("Lighthouse")?.alt).toBe(expected);
	});

	it("accessibility names the rules the a11y gate runs", () => {
		const alt = byAlt("accessibility")?.alt ?? "";
		expect(alt).toContain("WCAG 2.2 AA");
		const gate = read("scripts", "ci-check-a11y.mjs");
		for (const tag of ["wcag2aa", "wcag21aa", "wcag22aa"]) expect(gate, tag).toContain(`"${tag}"`);
	});

	it("the CSP is the one the middleware sends and the headers gate asserts", () => {
		const alt = byAlt("CSP")?.alt ?? "";
		const policy = alt.replace(/^CSP: /, "");
		expect(policy).toBe("default-src 'self'");
		expect(read("src", "middleware.ts")).toContain(`"${policy}"`);
		expect(read("scripts", "ci-check-headers.sh")).toContain(`"${policy}"`);
	});

	it("the version badges read dependencies this site declares", () => {
		const pkg = JSON.parse(read("package.json"));
		const deps = { ...pkg.dependencies, ...pkg.devDependencies };
		const live = badges.filter((b) => b.img.includes("/github/package-json/dependency-version/"));
		expect(live.length).toBeGreaterThanOrEqual(2);
		for (const b of live) {
			const dep = b.img.match(/dependency-version\/[^/]+\/[^/]+\/([^?]+)/)![1];
			expect(deps, dep).toHaveProperty(dep);
		}
	});
});
