#!/usr/bin/env node
/**
 * badges.mjs — the README's badges, computed from their owners (#600).
 *
 * The README shows four values that change when the repository changes: the
 * number of gates, the Lighthouse thresholds, the WCAG level the a11y gate
 * runs, and the CSP the site sends. Typed into the README, each would need a
 * person to edit it every time its owner moved (a new gate, a new threshold).
 * So none is typed: this script reads each one from the file that owns it and
 * writes a shields.io endpoint file (https://shields.io/badges/endpoint-badge)
 * per badge. `.github/workflows/badges.yml` runs it after every green
 * quality-gates run on main and publishes the files on the `badges` branch,
 * which the README's badges read. Nobody edits the README when a value changes.
 *
 * A value it cannot find is an error, never a guess: a badge that cannot be
 * derived is not published, and the workflow goes red instead.
 *
 * Usage: node scripts/badges.mjs <out-dir>
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { distinctGates } from "./lib/gates.mjs";

const OK = "brightgreen";

function need(value, what) {
	if (value === undefined || value === null || value === "") throw new Error(`badges: cannot derive ${what}`);
	return value;
}

/** Every badge, as shields.io endpoint JSON, read from `root`. */
export function computeBadges(root) {
	const read = (...p) => readFileSync(join(root, ...p), "utf8");

	const gates = distinctGates(read(".github", "workflows", "ci.yml")).length;
	need(gates > 0 ? gates : null, "the gate count from ci.yml");

	const rc = JSON.parse(read("lighthouserc.json"));
	const assertions = rc?.ci?.assert?.assertions ?? {};
	const score = (category) => {
		const min = need(assertions[`categories:${category}`]?.[1]?.minScore, `the ${category} threshold from lighthouserc.json`);
		return min < 1 ? `≥${Math.round(min * 100)}` : "100";
	};

	// the highest WCAG level among the tags the a11y gate passes to axe on every route
	const a11y = read("scripts", "ci-check-a11y.mjs");
	const tags = [...a11y.matchAll(/"wcag(2|21|22)aa"/g)].map((m) => m[1]);
	const top = need(tags.sort().pop(), "a WCAG AA tag from ci-check-a11y.mjs");
	const level = { 2: "2.0", 21: "2.1", 22: "2.2" }[top];

	const csp = need(read("src", "middleware.ts").match(/"(default-src [^"]+)"/)?.[1], "default-src from src/middleware.ts");

	return {
		gates: { schemaVersion: 1, label: "quality gates", message: String(gates), color: OK },
		lighthouse: {
			schemaVersion: 1,
			label: "Lighthouse",
			message: `perf ${score("performance")} · a11y ${score("accessibility")} · best practices ${score("best-practices")} · SEO ${score("seo")}`,
			color: "F44B21",
			namedLogo: "lighthouse",
			logoColor: "white",
		},
		accessibility: { schemaVersion: 1, label: "accessibility", message: `axe · WCAG ${level} AA · every route`, color: OK },
		csp: { schemaVersion: 1, label: "CSP", message: csp, color: OK },
	};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const out = process.argv[2];
	if (!out) {
		console.error("usage: node scripts/badges.mjs <out-dir>");
		process.exit(2);
	}
	const root = join(dirname(fileURLToPath(import.meta.url)), "..");
	mkdirSync(out, { recursive: true });
	for (const [name, badge] of Object.entries(computeBadges(root))) {
		writeFileSync(join(out, `${name}.json`), `${JSON.stringify(badge, null, 2)}\n`);
		console.log(`${name}.json  ${badge.label}: ${badge.message}`);
	}
}
