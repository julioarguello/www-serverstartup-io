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
 * Three assertions to begin with, all over the rendered page:
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
 * Six more arrived with the footer (#454), which had the same class of defect —
 * geometry no gate could see:
 *
 *   G4  the reference strip is ONE line where there is room for one. Measured
 *       before the change: 6 marks and a seventh alone below, at both 1024 and
 *       1440, because the strip inherited the reading column's 840px while the
 *       set needs ~930. A lone mark under a full line reads as an accident, and
 *       the marks are the credibility of the page.
 *
 *   G5  every line of the strip is centred within it (±8px). Flex centres a
 *       partial line for free; a grid does not, and the obvious "tidy this into
 *       a grid" refactor is exactly what would leave a wrapped mark hard left.
 *
 *   G6  nothing in the footer is centre-aligned. It used to be centred below
 *       768px and left above it, so the same footer read as two designs
 *       depending on the phone in your hand. Checked at all four widths, which
 *       is what makes "one alignment everywhere" a measurement and not a hope.
 *
 *   G7  the EU emblem renders at least 37.8 CSS px tall — 1cm at 96dpi, the
 *       minimum in `eu-emblem-rules_es.pdf` p.10, whose duty that same document
 *       extends to "sitios web y sus versiones móviles". Measured on the FLAG,
 *       not the lockup around it: each mark declares the flag's share of its own
 *       artwork in `data-emblem-ratio`, because a 40px lockup whose flag is 88%
 *       of it renders a 35px emblem while looking compliant. The single 2560×242
 *       JPEG we shipped rendered it at 18.2px on a 390px phone: a compliance
 *       failure, penalty 10% of the aid, that no gate here could see and no
 *       amount of reading the CSS would reveal.
 *
 *   G8  every link in the footer's nav lists renders at one size. There were
 *       five — 13, 14, 17, 18 and 20px — and the home's own body copy sat below
 *       two of them.
 *
 *   G10 nothing in the footer crosses the page's ONE measure. `theme.css` says
 *       it in as many words — "There is no second measure. A page has ONE width
 *       and everything inside it shares one edge." Nothing could check it until
 *       now, and the first draft of this very footer broke it: both sides of the
 *       signature row were shrinkable, the columns lost, shrank to 403px, and
 *       their `nowrap` children painted the CTA 73.7px past the container's
 *       right edge. The reference banner is exempt by construction — it carries
 *       its own, wider measure, for marks rather than prose.
 *
 *   G11 the EU emblem outweighs every other mark on the funding line by at least
 *       1.3×. `Orden HFP/1030/2021` art. 9.4 binds only "al menos de forma tan
 *       prominente y visible como los otros logotipos", which equal heights meet.
 *       The `Guía de Justificación` red.es asks a compliance screenshot against
 *       recommends "como mínimo, un 30% más grande que el resto de los
 *       logotipos", and the Enero 2022 identity manual makes that ratio binding
 *       for cartelería. Meeting the strictest of the three costs one declaration.
 *
 *   G12 no rule that selects a funding mark may fade, recolour, rotate, crop or
 *       otherwise modify it. The marks are supplied artwork: the EU emblem's own
 *       usage rules and the `Manual de Identidad` both say they may be SCALED and
 *       nothing else, and art. 34.3 of Orden ETD/1498/2021 makes carrying them
 *       correctly an obligation rather than a courtesy — art. 38.4 prices a
 *       publicity breach at 10% of the awarded aid. G7 and G11 protect the size
 *       half; nothing protected the integrity half.
 *
 *       This one reads the STYLESHEET, not the rendered rest state, and that is
 *       the whole point: a `:hover` or `:focus` rule that fades a mark on
 *       interaction is invisible to any measurement of the page at rest, and
 *       interaction is the plausible way this breaks — somebody gives every
 *       footer image a tasteful hover.
 *
 *       The walk reads declarations BEFORE recursing. The obvious shape is
 *       wrong and fails silently, which is how #470's version of this reported
 *       clean forever while its own control passed: CSS Nesting gives every
 *       CSSStyleRule its own `cssRules` — an empty list when nothing is nested,
 *       and truthy — so `if (r.cssRules) { walk(r.cssRules); continue; }` skips
 *       every ordinary rule in the sheet. Measured on the built `Base` sheet on
 *       2026-09-02: 222 top-level rules, 14 reached. So the gate does not take
 *       its own walk on trust either — it counts the style rules it actually
 *       READ against the number the sheet declares at top level, and refuses to
 *       report clean if it read fewer. Counting rules *visited* would not do:
 *       the wrong shape still enters every top-level rule, recurses into its
 *       empty `cssRules` and reads nothing, so it scores 222 of 222 visited and
 *       0 leaves. The leaf count is the one that tells them apart.
 *
 *   G9  the footer paints no ground of its own — transparent, or at worst the
 *       body's own colour. Giving the footer its own band is what makes a footer
 *       read as bolt-on, and the rule that used to be here painted
 *       `--color-secondary` over a body that is already that colour: a band
 *       waiting to become visible the day either token moves.
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
/** The footer is the same on every route; one per locale is the whole surface. */
const FOOTER_ROUTES = ["/", "/en"];
/**
 * The width from which the whole reference set must fit on one line. Below it
 * the strip wraps and G5 takes over; above it a wrapped mark is the orphan.
 */
const STRIP_ONE_LINE_FROM = 1024;
/**
 * 1cm at 96dpi — the emblem minimum in `eu-emblem-rules_es.pdf` p.10. It is the
 * FLAG's height, not the lockup's, which is why each mark declares the flag's
 * share of its own artwork in `data-emblem-ratio`: a 40px lockup whose flag is
 * 88% of it renders a 35px emblem and fails while looking compliant.
 */
const EMBLEM_MIN_PX = 37.8;

/** How much larger the EU emblem must render than every other funding mark. */
const EMBLEM_PROMINENCE = 1.3;

// G12 — the properties that would modify a supplied mark rather than scale it.
// The salvaged issue named five; the other seven are the same assertion reached
// by other spellings, and a rule that says "no rotation" while `rotate: 45deg`
// sails past is theatre. `clip-path` and `mask-image` are here because the
// usage rules forbid cropping in as many words, and `mix-blend-mode` because
// blending a flag into its ground recolours it without naming a colour.
const INTEGRITY_PROPS = [
	"filter", "-webkit-filter", "opacity", "transform", "rotate", "scale",
	"translate", "clip-path", "-webkit-clip-path", "mask-image",
	"-webkit-mask-image", "mix-blend-mode", "text-decoration-line",
];

// The identity value of each of the above — the value that means "unmodified".
// `transition` is deliberately absent from the props list: a transition alone
// changes nothing, and the state it transitions TO is a rule of its own, which
// this gate reads.
const INTEGRITY_IDENTITY = new Set(["", "none", "1", "normal", "0deg", "0px", "auto"]);

const FUNDING_SELECTOR = "footer-funding";

const WIDTHS = [390, 768, 1440];
/**
 * 1024 is in here and not in WIDTHS because it is where the strip has least to
 * spare: the measure is capped at 1140px, so 1024 leaves 984px of room for a
 * set that needs ~932. Fifty-two pixels. That is the width a new reference, or
 * a wider mark, breaks first — and it is invisible at 1440.
 */
const FOOTER_WIDTHS = [390, 768, 1024, 1440];
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

/**
 * G4–G9: the footer's geometry.
 *
 * `aligned` is a fixed selector list rather than every element: `text-align`
 * inherits, so walking the whole subtree would report one planted centre a
 * dozen times, and the `.btn` CTA centres its own label legitimately. If one of
 * these classes is renamed the list stops matching and the control below turns
 * that into exit 3 — the same contract the row selectors already carry.
 */
const MEASURE_FOOTER = () => {
	const footer = document.querySelector(".site-footer");
	if (!footer) return null;

	const row = footer.querySelector(".ref-banner__row");
	const marks = row ? [...row.querySelectorAll("img")] : [];
	let stripLines = [];
	if (row && marks.length) {
		const strip = row.getBoundingClientRect();
		const byTop = new Map();
		for (const img of marks) {
			const b = img.getBoundingClientRect();
			const top = Math.round(b.top);
			if (!byTop.has(top)) byTop.set(top, []);
			byTop.get(top).push(b);
		}
		stripLines = [...byTop.entries()].map(([top, bs]) => ({
			top,
			n: bs.length,
			// the line's own centre against the strip's. Measured from the marks
			// themselves, not from their tracks: a grid centres tracks, and a
			// half-empty last track is exactly how a wrapped mark drifts left.
			offset:
				(Math.min(...bs.map((b) => b.left)) + Math.max(...bs.map((b) => b.right))) / 2 -
				(strip.left + strip.right) / 2,
		}));
	}

	const ALIGNED = [
		".footer-signature",
		".footer-signature__house",
		".footer-signature__line",
		".footer-cols",
		".footer-col",
		".footer-col h3",
		".footer-list",
		".footer-list li",
		".footer-legal__inner",
	];
	const aligns = [];
	for (const sel of ALIGNED)
		for (const el of footer.querySelectorAll(sel))
			aligns.push({ sel, align: getComputedStyle(el).textAlign });

	return {
		marks: marks.length,
		stripLines,
		aligns,
		alignedSelectors: ALIGNED.filter((sel) => footer.querySelector(sel)).length,
		// only the images that carry the EU emblem: the ratio is the flag's share
		// of the artwork's height, because the 1cm floor is the FLAG's, not the
		// lockup's, and the flag is 88% of the cut we ship
		funding: [...footer.querySelectorAll(".footer-funding__mark[data-emblem-ratio]")].map((img) => ({
			alt: (img.alt || "").slice(0, 32),
			ratio: parseFloat(img.dataset.emblemRatio),
			h: img.getBoundingClientRect().height,
		})),
		// every mark on the funding line, emblem or not: G11 compares them
		fundingAll: [...footer.querySelectorAll(".footer-funding__mark")].map((img) => ({
			alt: (img.alt || "").slice(0, 32),
			h: img.getBoundingClientRect().height,
			emblem: img.hasAttribute("data-emblem-ratio"),
		})),
		// G10: the one measure, read off the funding row's content box — it is a
		// plain `.container`, so its content edges ARE the page's edges. Anything in
		// the footer painting outside them has invented a second measure. Skipped:
		// `.container` elements themselves (their border box is the measure plus its
		// own padding, by definition), the full-bleed bands, and the reference
		// banner, which carries its own wider measure on purpose.
		outside: (() => {
			const box = footer.querySelector(".footer-funding");
			if (!box) return null;
			const r = box.getBoundingClientRect();
			const cs = getComputedStyle(box);
			const left = r.left + parseFloat(cs.paddingLeft);
			const right = r.right - parseFloat(cs.paddingRight);
			const skip = ".container, .site-footer, .footer-main, .footer-legal";
			const worst = new Map();
			for (const el of footer.querySelectorAll("*")) {
				if (el.closest(".ref-banner") || el.matches(skip)) continue;
				const b = el.getBoundingClientRect();
				if (!b.width && !b.height) continue;
				// 1px of slack: sub-pixel layout, not a second edge
				const over = Math.max(left - b.left, b.right - right);
				if (over <= 1) continue;
				const cls = typeof el.className === "string" ? el.className.trim() : "";
				const sel = el.tagName.toLowerCase() + (cls ? "." + cls.split(/\s+/).join(".") : "");
				if (!worst.has(sel) || worst.get(sel) < over) worst.set(sel, over);
			}
			return [...worst]
				.map(([sel, over]) => ({ sel, over: +over.toFixed(1) }))
				.sort((a, b) => b.over - a.over);
		})(),
		links: [...footer.querySelectorAll(".footer-list a, .footer-list button")].map((el) => ({
			text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 28),
			size: getComputedStyle(el).fontSize,
		})),
		footerBg: getComputedStyle(footer).backgroundColor,
		bodyBg: getComputedStyle(document.body).backgroundColor,
	};
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

/**
 * The footer's plant. Same contract: one violation per assertion, one shape
 * that must stay unreported, and every finding judged by difference.
 */
const PLANT_FOOTER = () => {
	const footer = document.querySelector(".site-footer");
	if (!footer) return { missing: ".site-footer" };
	const need = (sel) => {
		const el = footer.querySelector(sel);
		return el || null;
	};

	// A — the strip is made to wrap, and the lines it wraps into are made to stop
	//     being centred. G4 (more than one line) and G5 (off-centre) both.
	//
	//     Three overrides, because the plant must not assume how the strip is
	//     laid out today: `--ref-cols` is what wraps a grid, a narrow measure is
	//     what wraps a flex row, and `justify-content` is what pushes the lines
	//     off centre in either. The first draft planted only the grid variable,
	//     and reverting the strip to its old flex row made this control exit 3
	//     ("the scan is blind") while the real orphan sat there unreported —
	//     which is the failure mode a control exists to prevent, not to cause.
	const row = need(".ref-banner__row");
	if (!row) return { missing: ".ref-banner__row" };
	const marks = row.querySelectorAll("img").length;
	if (marks < 3) return { missing: `.ref-banner__row img — only ${marks}, need 3 to plant` };
	row.style.setProperty("--ref-cols", String(marks - 1));
	row.style.maxWidth = "220px";
	row.style.justifyContent = "flex-start";

	// B — the signature block goes centred. text-align inherits, so its children
	//     go with it; the legal row is a sibling and must NOT.
	const sig = need(".footer-signature");
	if (!sig) return { missing: ".footer-signature" };
	sig.style.textAlign = "center";

	// C — an emblem shrunk to what the old single JPEG actually rendered at 390.
	const emblem = need(".footer-funding__mark[data-emblem-ratio]");
	if (!emblem) return { missing: ".footer-funding__mark[data-emblem-ratio]" };
	emblem.style.height = "18.2px";

	// D — one link out of step with the rest.
	const link = need(".footer-list a, .footer-list button");
	if (!link) return { missing: ".footer-list a" };
	link.style.fontSize = "13px";

	// E — the footer takes a ground of its own.
	footer.style.backgroundColor = "rgb(244, 244, 244)";

	// G — a block wider than the measure. It has to be a LEFT-anchored one: the
	//     column row is pinned to the right edge by `space-between`, so widening
	//     anything inside it grows the row leftwards and the right edge never
	//     moves. The first draft of this plant widened the CTA and changed the
	//     overflow by exactly 0px — the revert proof is what caught that.
	const line = need(".footer-signature__line");
	if (!line) return { missing: ".footer-signature__line" };
	line.style.width = "900px";

	// H — the other funding mark rises to the emblem's height, so the emblem stops
	//     outweighing it. C already trips G11 from the emblem's side; this trips it
	//     from the other mark's side, the half of the comparison C cannot reach.
	const other = footer.querySelector(".footer-funding__mark:not([data-emblem-ratio])");
	if (!other) return { missing: ".footer-funding__mark:not([data-emblem-ratio])" };
	other.style.height = "62px";

	// F — the legal row gets a change that is not geometry. Nothing new may be
	//     reported about it, and in particular it must not go centred with B.
	const legal = need(".footer-legal__inner");
	if (!legal) return { missing: ".footer-legal__inner" };
	legal.style.fontStyle = "italic";

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

const judgeFooter = (m, where, width) => {
	const found = [];

	// G4 — one line where there is room for one
	if (width >= STRIP_ONE_LINE_FROM && m.stripLines.length > 1)
		found.push({
			g: "G4",
			where,
			msg: `the reference strip wraps into ${m.stripLines.length} lines (${m.stripLines
				.map((l) => l.n)
				.join(" + ")}) with ${width}px to work in`,
		});

	// G5 — and every line it does draw is centred in it
	for (const l of m.stripLines)
		if (Math.abs(l.offset) > TOLERANCE)
			found.push({
				g: "G5",
				where,
				msg: `a strip line of ${l.n} mark(s) sits ${l.offset.toFixed(1)}px off the strip's centre`,
			});

	// G6 — one alignment, and it is not centre
	for (const a of m.aligns)
		if (a.align === "center" || a.align === "right" || a.align === "end")
			found.push({ g: "G6", where, msg: `\`${a.sel}\` is text-align: ${a.align}` });

	// G7 — the emblem keeps its mandated size
	for (const f of m.funding) {
		const emblem = f.h * (f.ratio || 1);
		if (emblem < EMBLEM_MIN_PX)
			found.push({
				g: "G7",
				where,
				msg: `the emblem renders ${emblem.toFixed(1)}px tall (a ${f.h.toFixed(1)}px lockup × ${
					f.ratio || 1
				}), under the ${EMBLEM_MIN_PX}px minimum — "${f.alt}"`,
			});
	}

	// G8 — one link size
	const sizes = [...new Set(m.links.map((l) => l.size))];
	if (sizes.length > 1)
		found.push({
			g: "G8",
			where,
			msg: `footer links render at ${sizes.length} sizes (${sizes.join(", ")}) — ${m.links
				.map((l) => `${l.text}=${l.size}`)
				.join(" · ")}`,
		});

	// G10 — one measure. `MEASURE_FOOTER` has already done the comparison in the
	//       page and hands back only what crossed the line. 12, not 6: the list is
	//       deduplicated by selector already, and a cap tight enough to truncate it
	//       can swallow the very finding a positive control looks for. It did.
	for (const x of (m.outside || []).slice(0, 12))
		found.push({ g: "G10", where, msg: `\`${x.sel}\` paints ${x.over}px outside the measure` });

	// G11 — the emblem outweighs every other mark on the funding line.
	for (const e of m.fundingAll.filter((f) => f.emblem))
		for (const other of m.fundingAll.filter((f) => !f.emblem)) {
			const ratio = other.h ? e.h / other.h : Infinity;
			if (ratio < EMBLEM_PROMINENCE)
				found.push({
					g: "G11",
					where,
					msg: `the EU emblem renders ${e.h.toFixed(1)}px against ${other.h.toFixed(1)}px for "${other.alt}" — ${ratio.toFixed(2)}×, under the ${EMBLEM_PROMINENCE}× the justification guide asks for`,
				});
		}

	// G9 — no ground of its own. Transparent is the strongest form of that: the
	// document's ground simply continues. Equal-to-the-body also passes, because
	// a footer that repaints the body colour draws no band either — it is only
	// fragile, and G9 is what catches it the day one of the two tokens moves.
	const noGround = m.footerBg === m.bodyBg || /,\s*0\s*\)$/.test(m.footerBg) || m.footerBg === "transparent";
	if (!noGround)
		found.push({ g: "G9", where, msg: `the footer is ${m.footerBg} over a body that is ${m.bodyBg}` });

	return found;
};

/* ── G12: read the stylesheets, not the rest state ──────────────────────── */
const MEASURE_FUNDING_CSS = ({ props, identity, needle }) => {
	const idOK = new Set(identity);
	const offenders = [];
	const sheets = [];

	for (const sheet of document.styleSheets) {
		let list;
		try { list = sheet.cssRules; } catch { continue; }   // cross-origin, not ours
		if (!list) continue;

		// `top` is what the sheet declares at depth 0; `topStyle` how many of
		// those are ordinary style rules. `leaves` is how many style rules the
		// walk actually READ, at any depth. The last two are what prove the
		// walk: `visited` cannot, because the wrong shape still *enters* every
		// top-level rule — it recurses into each one's empty `cssRules` and
		// reads nothing. Measured: under the wrong walk this sheet reports
		// visited 222 of 222 and leaves 0. That is why the issue asked for the
		// leaf count and not the rule count.
		const acc = { href: sheet.href || "inline", top: list.length, topStyle: 0, visited: 0, leaves: 0, matched: 0 };

		// Declarations BEFORE recursion, and recursion only into a list with
		// something in it. Reversing these two lines is the #470 bug: every
		// CSSStyleRule owns a (usually empty, always truthy) `cssRules`, so
		// `if (r.cssRules) { walk(...); continue; }` walks past the entire sheet.
		const walk = (rules, depth) => {
			for (const r of rules) {
				acc.visited++;
				if (depth === 0 && r.style && r.selectorText) acc.topStyle++;
				if (r.style && r.selectorText) {
					acc.leaves++;
					if (r.selectorText.includes(needle)) {
						acc.matched++;
						for (const prop of props) {
							const value = r.style.getPropertyValue(prop).trim().toLowerCase();
							if (!idOK.has(value))
								offenders.push({ sheet: acc.href, selector: r.selectorText, prop, value });
						}
					}
				}
				if (r.cssRules && r.cssRules.length) walk(r.cssRules, depth + 1);
			}
		};
		walk(list, 0);
		sheets.push(acc);
	}
	return { offenders, sheets };
};

const judgeFunding = (m, where) => {
	const found = [];
	for (const o of m.offenders)
		found.push({
			g: "G12",
			where,
			msg: `\`${o.selector}\` declares \`${o.prop}: ${o.value}\` — a funding mark may be scaled and not modified (${o.sheet.split("/").pop()})`,
		});
	return found;
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

/**
 * Bring the footer into play before measuring it.
 *
 * Every mark down there is `loading="lazy"` and below the fold, and an unloaded
 * `<img>` with `width:auto;height:auto` lays out at 0×0 — so a scan that does
 * not scroll measures seven marks stacked at one coordinate and calls it a
 * single, perfectly centred line. That is not a hypothetical: the first
 * measurement taken for #454 reported exactly that, and the strip's real
 * behaviour (6 + 1 at 1440) only appeared once the images were made to load.
 */
const settleFooter = async (page) => {
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.evaluate(
		() =>
			new Promise((resolve) => {
				const imgs = [...document.querySelectorAll(".site-footer img")];
				let left = imgs.filter((i) => !i.complete).length;
				if (!left) return resolve();
				const done = () => --left <= 0 && resolve();
				for (const i of imgs) if (!i.complete) i.addEventListener("load", done), i.addEventListener("error", done);
				setTimeout(resolve, 5000);
			})
	);
	// one frame for the wrap to settle after the last decode
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
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

// ── and the same for the footer half, at 1440, where G4 has something to say.
{
	const page = await open(FOOTER_ROUTES[0], 1440);
	await settleFooter(page);
	const key = (f) => `${f.g}|${f.msg}`;
	const scan = async () => judgeFooter(await page.evaluate(MEASURE_FOOTER), "control", 1440);

	const first = await page.evaluate(MEASURE_FOOTER);
	if (!first || !first.marks || !first.funding.length || !first.links.length || first.alignedSelectors < 5) {
		console.error(`✗ blind: the footer on ${FOOTER_ROUTES[0]} does not present what this gate measures.`);
		console.error(
			`  marks=${first?.marks ?? "—"} emblems=${first?.funding.length ?? "—"} links=${
				first?.links.length ?? "—"
			} aligned selectors matched=${first?.alignedSelectors ?? "—"}/9`
		);
		console.error("  A renamed class makes this gate report clean forever. Update the selectors here in");
		console.error("  the same commit that renames them.");
		await browser.close();
		process.exit(3);
	}

	const before = new Set((await scan()).map(key));
	const planted = await page.evaluate(PLANT_FOOTER);
	if (planted.missing) {
		console.error(`✗ blind: cannot plant on the footer — \`${planted.missing}\` is not there.`);
		await browser.close();
		process.exit(3);
	}
	const after = await scan();
	const fresh = after.filter((f) => !before.has(key(f)));

	const problems = [];
	for (const g of ["G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11"])
		if (!fresh.some((f) => f.g === g)) problems.push(`${g} did not fire on a planted violation`);
	// the plant centred the signature block; the legal row is its sibling and
	// must have stayed where it was
	for (const f of fresh.filter((f) => f.g === "G6" && /footer-legal/.test(f.msg)))
		problems.push(`false positive — the plant centred the signature only, but: ${f.msg}`);
	const groupsOf = (fs) => new Set([...fs].map((f) => (typeof f === "string" ? f.split("|")[0] : f.g)));
	for (const g of groupsOf(before)) if (!groupsOf(after).has(g)) problems.push(`a plant silenced ${g}`);

	if (problems.length) {
		console.error("✗ the positive control failed: the footer scan is not measuring what it claims.");
		for (const p of problems) console.error(`    ${p}`);
		await browser.close();
		process.exit(3);
	}
	ok("8 more planted defects judged correctly — an orphaned mark, an off-centre line, a centred block, a shrunken emblem, an odd link size, a ground of its own, a block wider than the measure, a mark raised to the emblem's height — and a legal row it left alone");
	await page.close();
}

// ── G12's own control. One assertion shape, one plant — the #470 lesson: that
//    gate carried two unrelated assertions under one id, the first fired, the
//    second was blind, and the control was satisfied by the first.
//
//    The plant is a top-level `:hover` rule, which is also what proves the walk
//    reads declarations before recursing: under the wrong shape that rule owns
//    an empty-but-truthy `cssRules`, gets walked past, and this control exits 3.
{
	const page = await open(FOOTER_ROUTES[0], 1440);
	await settleFooter(page);
	const args = { props: INTEGRITY_PROPS, identity: [...INTEGRITY_IDENTITY], needle: FUNDING_SELECTOR };
	const scan = async () => judgeFunding(await page.evaluate(MEASURE_FUNDING_CSS, args), "control");

	const first = await page.evaluate(MEASURE_FUNDING_CSS, args);
	const problems = [];

	// Blindness check 1 — the class still exists. A rename makes this gate
	// report clean forever, so it must be updated in the commit that renames.
	const matched = first.sheets.reduce((n, s) => n + s.matched, 0);
	if (!matched)
		problems.push(`no rule anywhere selects \`${FUNDING_SELECTOR}\` — renamed? update this gate in the same commit`);

	// Blindness check 2 — the walk reached everything. This is the assertion
	// #470 needed and did not have: a walk that visits fewer rules than the
	// sheet has at top level has skipped whole branches, and every clean report
	// it produces is worthless. Run once, over the real sheets.
	for (const s of first.sheets)
		if (s.leaves < s.topStyle)
			problems.push(`the walk read ${s.leaves} style rules in ${s.href.split("/").pop()} but the sheet declares ${s.topStyle} at top level alone — it is walking past declarations`);

	const before = new Set((await scan()).map((f) => f.msg));
	await page.addStyleTag({ content: `.${FUNDING_SELECTOR}__mark:hover { opacity: 0.5; }` });
	const fresh = (await scan()).filter((f) => !before.has(f.msg));

	if (!fresh.some((f) => /may be scaled and not modified/.test(f.msg)))
		problems.push("a planted `:hover { opacity: .5 }` on a funding mark went unreported");

	if (problems.length) {
		console.error("✗ the positive control failed: the funding-mark scan is not measuring what it claims.");
		for (const p of problems) console.error(`    ${p}`);
		await browser.close();
		process.exit(3);
	}
	const leaves = first.sheets.reduce((n, s) => n + s.leaves, 0);
	const topStyle = first.sheets.reduce((n, s) => n + s.topStyle, 0);
	ok(`a planted hover-fade on a funding mark was reported — ${leaves} style rules read across ${first.sheets.length} sheets (${topStyle} of them at top level, none walked past), ${matched} selecting a mark`);
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

let marksSeen = 0;
for (const route of FOOTER_ROUTES) {
	for (const width of FOOTER_WIDTHS) {
		const page = await open(route, width);
		await settleFooter(page);
		const m = await page.evaluate(MEASURE_FOOTER);
		await page.close();
		if (!m || !m.marks || !m.funding.length || !m.links.length) {
			console.error(`✗ blind: the footer on ${route} @${width} does not present what this gate measures.`);
			await browser.close();
			process.exit(3);
		}
		marksSeen = Math.max(marksSeen, m.marks);
		findings.push(...judgeFooter(m, `${route} @${width}`, width));
	}
}

// G12 reads stylesheets, so width does not enter into it — but the locales load
// their own page sheets, so both routes are scanned.
let fundingRules = 0;
for (const route of FOOTER_ROUTES) {
	const page = await open(route, 1440);
	await settleFooter(page);
	const m = await page.evaluate(MEASURE_FUNDING_CSS, {
		props: INTEGRITY_PROPS, identity: [...INTEGRITY_IDENTITY], needle: FUNDING_SELECTOR,
	});
	await page.close();
	const matched = m.sheets.reduce((n, s) => n + s.matched, 0);
	const skipping = m.sheets.filter((s) => s.leaves < s.topStyle);
	if (!matched || skipping.length) {
		console.error(`✗ blind: the funding-mark scan on ${route} is not reading what it claims.`);
		if (!matched) console.error(`  no rule selects \`${FUNDING_SELECTOR}\` — renamed?`);
		for (const s of skipping)
			console.error(`  ${s.href.split("/").pop()}: read ${s.leaves} style rules against ${s.topStyle} at top level`);
		await browser.close();
		process.exit(3);
	}
	fundingRules = Math.max(fundingRules, matched);
	findings.push(...judgeFunding(m, route));
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
	if (by("G4").length) {
		fail(`the reference strip leaves a mark on a line of its own where the whole set fits.`);
		console.error("  Six marks and a seventh alone below is what the strip did at 1024 and 1440 (#454),");
		console.error("  because it inherited the reading column's width. The marks are the page's credibility;");
		console.error("  an orphan reads as an accident. Widen `.ref-banner__inner`, or drop the column count.");
		for (const f of by("G4")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G5").length) {
		fail(`${by("G5").length} line(s) of the reference strip are not centred within it.`);
		console.error("  Flex centres a partial line for free; a grid does not. If the strip was just tidied");
		console.error("  into columns, the wrapped line is now hard left in track one.");
		for (const f of by("G5")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G6").length) {
		fail(`${by("G6").length} footer element(s) are not left-aligned.`);
		console.error("  The footer was centred below 768px and left above it, so it read as two designs (#454).");
		console.error("  One alignment at every width — the site has one edge and the footer keeps it.");
		for (const f of by("G6")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G7").length) {
		fail(`${by("G7").length} funding emblem(s) render below the mandated minimum.`);
		console.error(`  ${EMBLEM_MIN_PX}px is 1cm at 96dpi — the floor in \`eu-emblem-rules_es.pdf\` p.10, whose duty that`);
		console.error("  same document extends to mobile versions. The composite JPEG we used to ship rendered");
		console.error("  the EU emblem at 18.2px on a 390px phone. Penalty for publicity failures: 10% of the aid");
		console.error("  (Orden ETD/1498/2021 art. 36.4). This is not a taste question.");
		for (const f of by("G7")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G8").length) {
		fail(`footer links render at more than one size.`);
		console.error("  There were five — 13, 14, 17, 18 and 20px — and the home's own body copy sat below two");
		console.error("  of them (#454). One list, one size.");
		for (const f of by("G8")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G10").length) {
		fail(`${by("G10").length} footer element(s) paint outside the page's one measure.`);
		console.error('  `theme.css`: "There is no second measure. A page has ONE width and everything');
		console.error('  inside it shares one edge." The first draft of this footer let both sides of the');
		console.error("  signature row shrink; the columns lost, shrank to 403px, and their `nowrap` children");
		console.error("  hung the CTA 73.7px past the right edge. Give the columns `flex: 0 0 auto` and let");
		console.error("  the line of prose be what gives.");
		for (const f of by("G10")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G11").length) {
		fail(`the EU emblem does not outweigh the other marks on the funding line.`);
		console.error(`  ${EMBLEM_PROMINENCE}× is the "un 30% más grande que el resto de los logotipos" of the`);
		console.error("  `Guía de Justificación` red.es asks a compliance screenshot against — a recommendation");
		console.error("  there, binding for cartelería in the Enero 2022 identity manual, and above the \"al menos");
		console.error("  tan prominente\" floor of Orden HFP/1030/2021 art. 9.4. Meeting the strictest of the");
		console.error("  three costs one CSS declaration, so we meet it.");
		for (const f of by("G11")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G12").length) {
		fail(`${by("G12").length} rule(s) modify a funding mark instead of scaling it.`);
		console.error("  The EU emblem and the Plan de Recuperación logo are supplied artwork: they may be");
		console.error("  scaled, and nothing else — no recolouring, fading, rotation, cropping, filter or");
		console.error("  overlay. The emblem's own usage rules and the `Manual de Identidad` both say so, and");
		console.error("  art. 34.3 of Orden ETD/1498/2021 makes carrying them correctly an obligation. A");
		console.error("  publicity breach is priced at 10% of the awarded aid (art. 38.4).");
		console.error("  If the declaration is on a :hover or :focus rule, note that this gate reads the");
		console.error("  stylesheet precisely because no measurement of the page at rest can see it.");
		for (const f of by("G12")) console.error(`    ${f.where}  ${f.msg}`);
	}
	if (by("G9").length) {
		fail(`the footer paints a ground of its own.`);
		console.error("  One ground for the whole document, footer included: a separate band is what makes a");
		console.error("  footer read as bolt-on.");
		for (const f of by("G9")) console.error(`    ${f.where}  ${f.msg}`);
	}
	process.exit(1);
}

ok(`${ROW_LISTS.length} ROW list(s) × ${WIDTHS.length} widths: ${rowsSeen} items each, heights within ${TOLERANCE}px, no chrome at rest`);
ok(`no run of ${PROSE_MIN}+ characters is printed twice on ${PROSE_ROUTES.join(" or ")}`);
ok(
	`the footer holds one alignment, one link size, no ground of its own, ${marksSeen} reference marks on one line from ${STRIP_ONE_LINE_FROM}px and centred lines below it, emblems at or above ${EMBLEM_MIN_PX}px and ${EMBLEM_PROMINENCE}× every other mark, and nothing outside the one measure`
);
ok(`${fundingRules} rule(s) select a funding mark and none of them modifies it — scaled only`);
process.exit(0);
