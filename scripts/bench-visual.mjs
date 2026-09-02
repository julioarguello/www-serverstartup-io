#!/usr/bin/env node
/**
 * The instrument behind docs/design/2026-09-visual-benchmark.md.
 *
 * Not a gate. It measures eight reference sites and this one on the same run,
 * with the same code, so the comparison is one instrument rather than two
 * readings. Re-run it to refresh the doc; the numbers there are its output.
 *
 *   scripts/ci-local-stack.sh 8787          # ours must be served, like the rest
 *   node scripts/bench-visual.mjs /tmp/out  # writes bench.json + screenshots
 *
 * What it measures, and what each number means, is documented in the doc's
 * "Method" section. Two definitions matter and live here:
 *
 *  - a container IDIOM is the tuple (radius, has-shadow, border, ground) of any
 *    painted box at least 120x60. Two boxes with the same tuple are the same
 *    idiom however differently they are used; two with different tuples are two
 *    idioms however alike they look. It counts what a reader's eye has to learn.
 *
 *  - MEASURE is box width divided by the mean advance width of a-z rendered in
 *    that element's own resolved font — never an em approximation, because the
 *    faces differ by more than 10% in average advance and an approximation would
 *    compare the CSS rather than the type. "dominant" is the value carrying the
 *    most characters, not the median: it answers "how long is the line most of
 *    this page's text is set on".
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";

const require = createRequire(new URL("../package.json", import.meta.url));
const puppeteer = require("puppeteer");

const OUT = process.argv[2] || "bench-visual";
const OURS = process.env.BASE_URL || "http://localhost:8787/";
const UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
	"(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const SITES = [
	["marsbased", "https://marsbased.com/"],
	["thoughtbot", "https://thoughtbot.com/"],
	["basecamp", "https://basecamp.com/"],
	["ia", "https://ia.net/"],
	["testdouble", "https://testdouble.com/"],
	["37signals", "https://37signals.com/"],
	["simplethread", "https://www.simplethread.com/"],
	["rittman", "https://rittmananalytics.com/"],
	["serverstartup", OURS],
];

/** Runs in the page. Everything below this line is browser code. */
const measure = () => {
	const cs = getComputedStyle;
	const px = (v) => Math.round(parseFloat(v) * 10) / 10;
	const face = (v) => (v || "").split(",")[0].replace(/["']/g, "").trim();
	const painted = (el) => {
		const r = el.getBoundingClientRect();
		const s = cs(el);
		return r.width > 4 && r.height > 4 && s.visibility !== "hidden" && s.display !== "none";
	};
	const all = [...document.querySelectorAll("body *")].filter(painted);

	// ── container idioms, and the grounds they sit on
	const idioms = new Map();
	const ground = {};
	for (const el of all) {
		const s = cs(el);
		const r = el.getBoundingClientRect();
		if (s.backgroundColor !== "rgba(0, 0, 0, 0)")
			ground[s.backgroundColor] = (ground[s.backgroundColor] || 0) + r.width * r.height;
		if (r.width < 120 || r.height < 60) continue;
		const radius = px(s.borderTopLeftRadius);
		const shadow = s.boxShadow === "none" ? "" : "shadow";
		const border =
			s.borderTopWidth === "0px" && s.borderLeftWidth === "0px"
				? ""
				: `${px(s.borderTopWidth)}/${px(s.borderLeftWidth)}`;
		const bg = s.backgroundColor === "rgba(0, 0, 0, 0)" ? "" : s.backgroundColor;
		if (!radius && !shadow && !border && !bg) continue;
		const key = `r${radius} ${shadow || "—"} b${border || "—"} ${bg || "—"}`;
		if (!idioms.has(key)) idioms.set(key, []);
		idioms.get(key).push((el.className || el.tagName).toString().split(" ")[0].slice(0, 30));
	}

	// ── type, weighted by characters rather than by element
	const fams = {};
	const sizes = {};
	const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	let node;
	while ((node = walk.nextNode())) {
		const t = node.textContent.trim();
		const el = node.parentElement;
		if (!t || !el || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue;
		const r = el.getBoundingClientRect();
		if (r.width < 2 || r.height < 2) continue;
		const s = cs(el);
		fams[face(s.fontFamily)] = (fams[face(s.fontFamily)] || 0) + t.length;
		sizes[Math.round(parseFloat(s.fontSize))] = (sizes[Math.round(parseFloat(s.fontSize))] || 0) + t.length;
	}
	const specimen = (sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		const s = cs(el);
		return {
			text: (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 64),
			face: face(s.fontFamily), size: px(s.fontSize), weight: s.fontWeight,
			lh: px(s.lineHeight) || null, transform: s.textTransform,
		};
	};

	// ── measure, in characters of the element's own type
	const ctx = document.createElement("canvas").getContext("2d");
	const lines = [];
	for (const el of all) {
		const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ");
		if (own.length < 60) continue;
		const r = el.getBoundingClientRect();
		if (r.width < 60) continue;
		const s = cs(el);
		ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
		const advance = ctx.measureText("abcdefghijklmnopqrstuvwxyz").width / 26;
		if (!advance || !isFinite(advance)) continue;
		lines.push({
			what: (el.className || el.tagName).toString().split(" ")[0].slice(0, 28),
			size: px(s.fontSize), width: Math.round(r.width),
			ch: Math.round(r.width / advance), chars: own.length,
		});
	}
	lines.sort((a, b) => a.ch - b.ch);
	const byChars = {};
	for (const l of lines) byChars[l.ch] = (byChars[l.ch] || 0) + l.chars;
	const dominant = Object.entries(byChars).sort((a, b) => b[1] - a[1])[0];
	const top = (o, k) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k);

	const footer = document.querySelector("footer, [class*=footer], [id*=footer]");
	return {
		title: document.title.slice(0, 90),
		height: document.documentElement.scrollHeight,
		idioms: [...idioms].map(([k, v]) => [k, v.length, [...new Set(v)].slice(0, 3)])
			.sort((a, b) => b[1] - a[1]),
		grounds: top(ground, 4).map(([c, a]) => [c, Math.round(a / 1000)]),
		groundCount: Object.keys(ground).length,
		footerGround: footer ? cs(footer).backgroundColor : null,
		shadows: [...new Set(all.map((el) => cs(el).boxShadow).filter((s) => s && s !== "none"))].length,
		families: top(fams, 5),
		sizes: top(sizes, 6),
		h1: specimen("h1"), h2: specimen("h2"),
		measure: {
			n: lines.length,
			dominant: dominant ? Number(dominant[0]) : null,
			median: lines.length ? lines[Math.floor(lines.length / 2)].ch : null,
			widest: lines.slice(-2),
		},
	};
};

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const out = {};
for (const [name, url] of SITES) {
	const page = await browser.newPage();
	await page.setUserAgent(UA);
	await page.setViewport({ width: 1440, height: 900 });
	try {
		await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
		await new Promise((r) => setTimeout(r, 2500));
		// Scroll the whole page once: sections that mount on intersection are part
		// of the composition, and a page measured at scroll 0 is half a page.
		await page.evaluate(async () => {
			for (let y = 0; y < document.body.scrollHeight; y += 800) {
				window.scrollTo(0, y);
				await new Promise((r) => setTimeout(r, 120));
			}
			window.scrollTo(0, 0);
		});
		await new Promise((r) => setTimeout(r, 800));
		out[name] = { url, ...(await page.evaluate(measure)) };
		await page.screenshot({ path: `${OUT}/${name}-1440.png` });
		await page.screenshot({
			path: `${OUT}/${name}-full.png`, captureBeyondViewport: true,
			clip: { x: 0, y: 0, width: 1440, height: Math.min(4200, out[name].height) },
		});
		const m = out[name].measure;
		console.error(`ok    ${name}  ${out[name].idioms.length} idioms · ${m.dominant ?? "—"}ch · ${out[name].height}px`);
	} catch (e) {
		out[name] = { url, error: String(e).slice(0, 160) };
		console.error(`FAIL  ${name}  ${String(e).slice(0, 120)}`);
	}
	await page.close();
}
await browser.close();
writeFileSync(`${OUT}/bench.json`, JSON.stringify(out, null, "\t"));
console.error(`written ${OUT}/bench.json`);
