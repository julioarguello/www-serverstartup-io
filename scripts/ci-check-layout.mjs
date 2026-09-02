#!/usr/bin/env node
/**
 * ci-check-layout.mjs — the geometry gate (#453).
 *
 * The areas block shipped as six white boxes, each carrying a full paragraph.
 * Measured on the running stack before this change: 1695px tall on a 390px
 * phone — two whole screens for six names — with row heights of 214, 282, 282,
 * 283, 259 and 305px. Ragged item heights are the actual reason a list starts
 * demanding boxes to tidy it up, so the fix equalises the lines and drops the
 * box. This gate is what keeps it equalised, because nothing else in CI can
 * see composition:
 *
 *   · `copy-baseline` freezes the WORDS. It froze the duplicated excerpt too,
 *     happily, for as long as it was there.
 *   · `ci-check-design-tokens.py` reads CSS as text and never opens a browser.
 *   · `ci-check-a11y.mjs` measures contrast and reflow, and a ragged list is
 *     neither illegible nor overflowing.
 *   · `ci-check-var-resolves.mjs` asks whether a declaration survived, not
 *     what it drew.
 *
 * Three assertions, all over the rendered page:
 *
 *   G1  every ROW list has equal row heights — max − min ≤ 8px — at 390, 768
 *       and 1440. Eight pixels is a hairline plus a rounding error, not a
 *       design allowance: two rows that differ by more than that read as two
 *       different things.
 *
 *   G2  a ROW draws no box AT REST. No radius, no shadow, and the left accent
 *       transparent. The colour is a state — hover, focus, current — and a row
 *       that paints a container at rest is a card. Six of them are a grid
 *       pretending to be a list, which is exactly what #453 removed.
 *
 *   G3  no long run of copy is printed twice on the same page. The e-commerce
 *       excerpt used to appear verbatim in the hero card and again in the areas
 *       row, twenty lines apart, which is what made the block read as filler.
 *       That defect is invisible to every other gate: the copy baseline had it
 *       frozen in, and a duplicate is neither a contrast nor a token fault.
 *
 * Deliberately NOT a screenshot diff. A pixel diff over 26 routes would go red
 * on every PR in this redesign by design, get re-baselined on sight, and become
 * furniture. Machines assert geometry; whether the composition is any good is a
 * human judgement and pretending otherwise is how a redesign gets approved by a
 * green checkmark.
 *
 * Exit 0 clean · 1 found something · 3 the scan itself is blind or broke.
 *
 * Usage: node scripts/ci-check-layout.mjs [base-url]   default :8787
 */
import puppeteer from "puppeteer";
import { cdpDiagnosis, stackDiagnosis } from "./lib/stack-probe.mjs";

const BASE = (process.argv[2] || "http://localhost:8787").replace(/\/$/, "");

/** The lists that are ROWs, and the pages that render them. */
const ROW_LISTS = [
	{ route: "/", list: ".s-areas__rows", item: ".area-row__link", claim: ".area-row__claim" },
	{ route: "/en", list: ".s-areas__rows", item: ".area-row__link", claim: ".area-row__claim" },
];
/** Pages whose whole copy must not repeat itself. */
const PROSE_ROUTES = ["/", "/en"];

const WIDTHS = [390, 768, 1440];
/** A hairline plus a rounding error. Not a design allowance. */
const TOLERANCE = 8;
/** Shorter than this and a repeat is a label ("Ver más"), not duplicated prose. */
const PROSE_MIN = 60;

const fail = (m) => console.error(`✗ ${m}`);
const ok = (m) => console.log(`✓ ${m}`);

const die = async (e) => {
	// the diagnosis first, then the error itself — a healthy stack makes the
	// former say nothing, and exiting 3 in silence helps nobody
	const d = await stackDiagnosis(BASE).catch(() => cdpDiagnosis(e));
	if (d) console.error(d);
	console.error(e?.stack || e);
	process.exit(3);
};
process.on("unhandledRejection", die);
// A gate that crashes must exit 3, not 1: "the scan broke" and "the page is
// wrong" are different answers and a stack trace under a red X reads as the
// second one. The first draft of this file threw here — inside `PLANT`, on a
// page whose markup had moved — and reported exit 1 with a raw TypeError.
process.on("uncaughtException", die);

/* ── measurements, taken in the page ───────────────────────────────────── */

/** G1 + G2: row geometry and the chrome each row paints at rest. */
const MEASURE_ROWS = ({ list, item }) => {
	const ul = document.querySelector(list);
	if (!ul) return null; // the caller turns a missing list into a blind-scan exit
	const items = [...ul.querySelectorAll(item)];
	if (items.length === 0) return { items: 0 };
	const transparent = (c) => c === "transparent" || /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(c);
	return {
		items: items.length,
		heights: items.map((el) => Math.round(el.getBoundingClientRect().height)),
		chrome: items.map((el) => {
			const cs = getComputedStyle(el);
			return {
				radius: ["Top", "Bottom"].flatMap((v) => ["Left", "Right"].map((h) => cs[`border${v}${h}Radius`])),
				shadow: cs.boxShadow,
				accent: cs.borderLeftColor,
			};
		}),
	};
};

/** G3: every run of visible copy on the page, long ones only. */
const MEASURE_PROSE = (min) => {
	const seen = [];
	const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	for (let n = walk.nextNode(); n; n = walk.nextNode()) {
		const el = n.parentElement;
		if (!el || el.closest("script, style, template, noscript")) continue;
		// what is not painted is not a repeat a reader can see
		if (!el.getClientRects().length) continue;
		const text = n.nodeValue.replace(/\s+/g, " ").trim();
		if (text.length >= min) seen.push(text);
	}
	return seen;
};

/* ── the positive control ──────────────────────────────────────────────── */

/**
 * Plant one violation of each assertion on a real page, plus one shape that
 * must NOT be reported, and require the scan to judge all four correctly.
 * Without this the gate can only prove that it found nothing — which is also
 * what a broken selector proves. #462's own gate was blind to the bug that
 * motivated it, and its control is the only reason anyone found out.
 */
const PLANT = ({ item, claim }) => {
	// declared in here, not module scope: `page.evaluate` ships the function
	// source to the browser and nothing that surrounds it
	const MARK = "a sentence long enough to count as prose, printed here twice on purpose";
	const items = [...document.querySelectorAll(item)];
	if (items.length < 3) return { missing: `${item} — only ${items.length} found, need 3 to plant` };
	const claimOf = (el) => el.querySelector(claim);
	if (!claimOf(items[0])) return { missing: claim };
	// A — row 1 grows: G1 must see the raggedness.
	claimOf(items[0]).textContent =
		"a claim long enough to wrap onto a second line and un-equalise this row, ".repeat(4);
	// B — row 2 draws a box at rest: G2 must see the chrome, and must name row 2.
	items[1].style.borderRadius = "24px";
	items[1].style.boxShadow = "0 2px 10px rgba(0,0,0,.06)";
	// C — a long run of copy printed twice: G3 must see the duplicate. The text
	//     is fixed rather than borrowed from a row, so the plant does not depend
	//     on any real claim happening to be longer than PROSE_MIN.
	for (const _ of [0, 1]) {
		const p = document.createElement("p");
		p.textContent = MARK;
		document.body.appendChild(p);
	}
	// D — row 3 gets an inline style that is not chrome. Nothing new may be
	//     reported about it.
	items[2].style.color = "#1E1E1E";
	return { missing: null };
};

/* ── the scan ──────────────────────────────────────────────────────────── */

const judgeRows = (m, where) => {
	const found = [];
	const spread = Math.max(...m.heights) - Math.min(...m.heights);
	if (spread > TOLERANCE)
		found.push({ g: "G1", where, msg: `rows differ by ${spread}px (heights ${m.heights.join(", ")})` });
	m.chrome.forEach((c, i) => {
		const r = c.radius.find((v) => parseFloat(v) > 0);
		if (r) found.push({ g: "G2", where, msg: `row ${i + 1} has a ${r} corner radius at rest` });
		if (c.shadow && c.shadow !== "none")
			found.push({ g: "G2", where, msg: `row ${i + 1} has a shadow at rest — \`${c.shadow}\`` });
		const opaque = !(c.accent === "transparent" || /,\s*0\s*\)$/.test(c.accent));
		if (opaque) found.push({ g: "G2", where, msg: `row ${i + 1}'s left accent is painted at rest — ${c.accent}` });
	});
	return found;
};

const judgeProse = (runs, where) => {
	const count = new Map();
	for (const t of runs) count.set(t, (count.get(t) || 0) + 1);
	return [...count.entries()]
		.filter(([, n]) => n > 1)
		.map(([t, n]) => ({ g: "G3", where, msg: `printed ${n}× — "${t.slice(0, 72)}…"` }));
};

const browser = await puppeteer.launch({
	headless: "new",
	args: ["--no-sandbox"],
	protocolTimeout: 300_000,
});

const open = async (route, width) => {
	const page = await browser.newPage();
	await page.setViewport({ width, height: 900, isMobile: width < 768, hasTouch: width < 768 });
	await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60_000 });
	await page.evaluate(() => document.fonts.ready);
	return page;
};

// ── positive control first: a gate that has not proved it can see is not a gate.
//
// It judges by DIFFERENCE — baseline, then plant, then baseline again — rather
// than by absolute findings. An absolute control silently assumes the page is
// already compliant, so the moment someone reverts the very defect this gate
// exists to catch, the control fails first and the run exits 3 ("the scan is
// broken") instead of 1 ("the page is wrong"). That happened on the first draft
// of this file, on the first revert it was tested against.
{
	const spec = ROW_LISTS[0];
	const page = await open(spec.route, 390);
	const key = (f) => `${f.g}|${f.msg}`;
	const scan = async () => [
		...judgeRows(await page.evaluate(MEASURE_ROWS, spec), "control"),
		...judgeProse(await page.evaluate(MEASURE_PROSE, PROSE_MIN), "control"),
	];

	const first = await page.evaluate(MEASURE_ROWS, spec);
	if (!first || !first.items) {
		console.error(`✗ blind: \`${spec.list} ${spec.item}\` matches nothing on ${spec.route}.`);
		console.error("  A renamed class makes this gate report clean forever. Update the selectors here in");
		console.error("  the same commit that renames them.");
		await browser.close();
		process.exit(3);
	}

	const before = new Set((await scan()).map(key));
	const planted = await page.evaluate(PLANT, spec);
	if (planted.missing) {
		console.error(`✗ blind: cannot plant on ${spec.route} — \`${planted.missing}\` is not there.`);
		console.error("  The gate is only as honest as its control. Update the selectors here in the same");
		console.error("  commit that renames them.");
		await browser.close();
		process.exit(3);
	}
	const after = await scan();
	const fresh = after.filter((f) => !before.has(key(f)));

	const problems = [];
	for (const g of ["G1", "G2", "G3"])
		if (!fresh.some((f) => f.g === g)) problems.push(`${g} did not fire on a planted violation`);
	// the plant touched row 2's chrome and nothing else's
	for (const f of fresh.filter((f) => f.g === "G2" && !/row 2\b/.test(f.msg)))
		problems.push(`false positive — the plant touched row 2 only, but: ${f.msg}`);
	// no assertion the page was already failing may go quiet under a plant.
	// Compared by GROUP, not by message: a plant legitimately changes the text
	// of a finding — it grows row 1, so G1's height list is a different string
	// afterwards — and that is a mutation, not a masking.
	const groupsOf = (fs) => new Set([...fs].map((f) => (typeof f === "string" ? f.split("|")[0] : f.g)));
	for (const g of groupsOf(before)) if (!groupsOf(after).has(g)) problems.push(`a plant silenced ${g}`);

	if (problems.length) {
		console.error("✗ the positive control failed: the scan is not measuring what it claims.");
		for (const p of problems) console.error(`    ${p}`);
		await browser.close();
		process.exit(3);
	}
	ok("4 planted defects judged correctly — a ragged row, a boxed row, a duplicated paragraph, and a third row it left alone");
	await page.close();
}

// ── the real scan
const findings = [];
let rowsSeen = 0;

for (const spec of ROW_LISTS) {
	for (const width of WIDTHS) {
		const page = await open(spec.route, width);
		const m = await page.evaluate(MEASURE_ROWS, spec);
		await page.close();
		if (!m || !m.items) {
			console.error(`✗ blind: \`${spec.list} ${spec.item}\` matches nothing on ${spec.route} @${width}.`);
			await browser.close();
			process.exit(3);
		}
		rowsSeen = Math.max(rowsSeen, m.items);
		findings.push(...judgeRows(m, `${spec.route} @${width}`));
	}
}

for (const route of PROSE_ROUTES) {
	const page = await open(route, 1440);
	const runs = await page.evaluate(MEASURE_PROSE, PROSE_MIN);
	await page.close();
	findings.push(...judgeProse(runs, route));
}

await browser.close();

if (findings.length) {
	const by = (g) => findings.filter((f) => f.g === g);
	if (by("G1").length) {
		fail(`${by("G1").length} ROW list(s) have ragged item heights.`);
		console.error("  Equal line counts are what let the box go away (#453). A list whose items differ in");
		console.error("  height is the reason a list starts asking for containers to tidy it up.");
		for (const f of by("G1")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G2").length) {
		fail(`${by("G2").length} ROW(s) draw a container at rest.`);
		console.error("  A ROW is a hairline above and an accent on hover/focus/current — nothing at rest");
		console.error("  (theme.css, the three chromes). Radius, shadow and a painted accent belong to PANEL.");
		for (const f of by("G2")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G3").length) {
		fail(`${by("G3").length} run(s) of copy are printed more than once on the same page.`);
		console.error("  The hero card and the areas row printed the same excerpt verbatim, twenty lines apart,");
		console.error("  which is what made the block read as filler (#453). The copy baseline cannot see this:");
		console.error("  it freezes the duplicate along with everything else.");
		for (const f of by("G3")) console.error(`    ${f.where}  ${f.msg}`);
	}
	process.exit(1);
}

ok(`${ROW_LISTS.length} ROW list(s) × ${WIDTHS.length} widths: ${rowsSeen} items each, heights within ${TOLERANCE}px, no chrome at rest`);
ok(`no run of ${PROSE_MIN}+ characters is printed twice on ${PROSE_ROUTES.join(" or ")}`);
process.exit(0);
