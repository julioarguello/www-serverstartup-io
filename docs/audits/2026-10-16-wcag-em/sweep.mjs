#!/usr/bin/env node
/**
 * The scripted part of the WCAG-EM evaluation of 2026-10-16 (#505): the sample (step 3) and the
 * checks a browser can decide that no CI gate already makes (step 4). Writes `sweep.json` beside it.
 *
 *   node docs/audits/2026-10-16-wcag-em/sweep.mjs [base-url] [sha]   default :8787, `git rev-parse HEAD`
 *
 * The random part of the sample is seeded with the evaluated commit, so the same commit draws the same
 * pages for anyone who re-runs it.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || "http://localhost:8787").replace(/\/$/, "");
const SHA = process.argv[3] || execSync("git rev-parse HEAD").toString().trim();

/* Step 3 — the structured sample: one page per template and locale, plus every page that carries
   functionality no other page has. The reason is recorded with each. */
const STRUCTURED = [
	["/", "home: the carousel, its rail and pause, the two kicker lines"],
	["/en", "home, English"],
	["/big-data-cloud-analytics", "vertical: canvas scene (the dusk), the mantra"],
	["/cdn-waf-seguridad-edge-cloudflare", "vertical: canvas scene (the radar), the visitor's echo, the reference list drawn on a canvas"],
	["/comercio-electronico", "vertical: the shop mock-up (cart instrument)"],
	["/desarrollo-greenfield", "vertical: SVG elevation drawn over a photograph"],
	["/inteligencia-artificial", "vertical: the machine's view, the pull-request instrument"],
	["/integracion-de-sistemas", "vertical: the bridge with live connector labels"],
	["/en/systems-integration", "vertical, English"],
	["/quienes-somos", "about: team photographs, the boot console"],
	["/en/about-us", "about, English"],
	["/contacto", "contact: the only page listing ways to reach the company"],
	["/en/contact", "contact, English"],
	["/referencias", "references: logo wall"],
	["/en/references", "references, English"],
	["/deconstruyendo", "deconstruyendo: the review panel and its chips, the gate count"],
	["/en/deconstructing", "deconstructing, English"],
	["/accesibilidad", "the accessibility statement and its channel (RD 1112/2018 art. 15)"],
	["/en/accessibility", "accessibility statement, English"],
	["/aviso-legal", "legal text: long Portable Text, tables of identity data"],
	["/en/privacy-policy", "privacy policy, English"],
	["/search?q=cloudflare", "search with results"],
	["/en/search?q=zzzqqq", "search with no result, English"],
	["/search", "search, empty"],
	["/no-existe", "404"],
	["/en/no-such-page", "404, English"],
];
const POPULATION = [
	"/", "/accesibilidad", "/aviso-legal", "/big-data-cloud-analytics", "/cdn-waf-seguridad-edge-cloudflare", "/comercio-electronico",
	"/contacto", "/deconstruyendo", "/desarrollo-greenfield", "/en", "/en/about-us", "/en/accessibility", "/en/artificial-intelligence",
	"/en/big-data-cloud-analytics", "/en/cdn-waf-edge-security-cloudflare", "/en/contact", "/en/deconstructing", "/en/e-commerce",
	"/en/greenfield-development", "/en/legal-notice", "/en/privacy-policy", "/en/references", "/en/systems-integration",
	"/integracion-de-sistemas", "/inteligencia-artificial", "/politica-de-privacidad", "/quienes-somos", "/referencias",
];
function seeded(hex) {
	let s = parseInt(hex.slice(0, 8), 16) | 0;
	return () => { s = (s + 0x6d2b79f5) | 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
const rest = POPULATION.filter((p) => !STRUCTURED.some(([s]) => s === p));
const rnd = seeded(SHA);
const pool = [...rest];
const RANDOM = [];
for (let i = 0; i < Math.ceil(STRUCTURED.length / 10); i++) RANDOM.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
const SAMPLE = [...STRUCTURED.map(([p, why]) => ({ path: p, why, kind: "structured" })), ...RANDOM.map((p) => ({ path: p, why: `random 10 % (seed ${SHA.slice(0, 8)})`, kind: "random" }))];

/* Step 4 — what runs in the page. Each returns plain data: the report judges it. */
function inPage() {
	const seen = (e) => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === "none" || c.visibility === "hidden" || +c.opacity < 0.05) return false; } return true; };
	const text = (e) => (e.innerText || e.textContent || "").replace(/\s+/g, " ").trim();
	const name = (e) => (e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") && document.getElementById(e.getAttribute("aria-labelledby"))?.textContent) || text(e) || e.getAttribute("title") || "").replace(/\s+/g, " ").trim();
	const out = {};
	out.title = document.title;
	out.lang = document.documentElement.lang;
	out.langParts = [...document.querySelectorAll("body [lang]")].map((e) => e.getAttribute("lang") + ":" + text(e).slice(0, 40)).slice(0, 20);
	out.headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(seen).map((h) => h.tagName + " " + text(h).slice(0, 70));
	out.media = { video: document.querySelectorAll("video").length, audio: document.querySelectorAll("audio").length, iframe: [...document.querySelectorAll("iframe")].map((f) => f.src.slice(0, 80)) };
	out.images = [...document.querySelectorAll("img")].map((i) => ({ alt: i.getAttribute("alt"), src: (i.currentSrc || i.src).split("/").pop().slice(0, 50), shown: seen(i), hiddenFromAT: !!i.closest("[aria-hidden='true']") }));
	out.canvases = [...document.querySelectorAll("canvas")].map((c) => ({ cls: String(c.className).slice(0, 40), hiddenFromAT: !!c.closest("[aria-hidden='true']"), role: c.getAttribute("role"), label: c.getAttribute("aria-label") }));
	/* visible text a screen reader never reaches: aria-hidden subtrees that paint words */
	out.visibleButHidden = [...document.querySelectorAll("[aria-hidden='true']")].filter((e) => seen(e) && (text(e).length > 2 || e.querySelector("canvas"))).map((e) => String(e.className || e.tagName).slice(0, 40) + " «" + text(e).slice(0, 40) + "»" + (e.querySelector("canvas") ? " [canvas]" : "")).slice(0, 30);
	/* 2.5.3: the accessible name contains the visible label */
	out.labelInName = [...document.querySelectorAll("a[aria-label], button[aria-label], [role=button][aria-label]")].filter(seen).map((e) => ({ visible: text(e), name: e.getAttribute("aria-label") })).filter((x) => x.visible && !x.name.toLowerCase().includes(x.visible.toLowerCase()));
	/* 2.4.4 evidence: the same link text pointing to different places */
	const byText = new Map();
	for (const a of document.querySelectorAll("a[href]")) { if (!seen(a)) continue; const t = name(a).toLowerCase(); if (!t) continue; const h = new URL(a.href, location.href).pathname; byText.set(t, new Set([...(byText.get(t) || []), h])); }
	out.ambiguousLinks = [...byText].filter(([, hs]) => hs.size > 1).map(([t, hs]) => t + " → " + [...hs].join(" | "));
	out.emptyLinks = [...document.querySelectorAll("a[href], button")].filter((e) => seen(e) && !name(e) && !e.querySelector("img[alt]:not([alt=''])")).map((e) => e.outerHTML.slice(0, 90));
	/* 3.2.3 evidence: the navigation's order */
	out.nav = [...document.querySelectorAll("header a, nav a")].map((a) => new URL(a.href, location.href).pathname).join(" ");
	out.footer = [...document.querySelectorAll("footer a")].map((a) => new URL(a.href, location.href).pathname).join(" ");
	/* rail stops: their state, and what besides colour marks the current one */
	const stops = [...document.querySelectorAll(".s-hero__dots .s-hero__stop")];
	out.rail = stops.length ? stops.map((s) => { const c = getComputedStyle(s), n = s.querySelector(".s-hero__stop-name"), d = s.querySelector(".s-hero__dot"); return { role: s.getAttribute("role"), current: s.getAttribute("aria-current") || s.getAttribute("aria-pressed") || s.getAttribute("aria-selected"), name: name(s).slice(0, 30), weight: n && getComputedStyle(n).fontWeight, deco: n && getComputedStyle(n).textDecorationLine, dot: d && Math.round(d.getBoundingClientRect().width) + "x" + Math.round(d.getBoundingClientRect().height), color: n && getComputedStyle(n).color, opacity: c.opacity }; }) : null;
	return out;
}

/* 2.2.2 / 2.3.1 — what still moves well after load, outside a band that offers a pause */
function stillMoving() {
	return document.getAnimations().filter((a) => a.playState === "running").map((a) => {
		const t = a.effect?.target, timing = a.effect?.getComputedTiming?.() ?? {};
		const el = t?.nodeType === 1 ? t : t?.element;
		return {
			name: a.animationName || a.constructor.name,
			target: el ? String(el.className || el.tagName).slice(0, 40) : "?",
			iterations: timing.iterations, duration: timing.duration,
			inBandWithPause: !!el?.closest(".s-hero")?.querySelector(".scene__ctl"),
		};
	}).filter((x) => !x.inBandWithPause);
}

/* 1.4.12 — the four spacing overrides of the success criterion, then what got clipped */
const SPACING = "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}";
function clipped() {
	const out = [];
	for (const e of document.querySelectorAll("body *")) {
		const c = getComputedStyle(e);
		if (!/(hidden|clip)/.test(c.overflowX + c.overflowY) || c.display === "none") continue;
		if (!(e.innerText || "").trim()) continue;
		const dx = e.scrollWidth - e.clientWidth, dy = e.scrollHeight - e.clientHeight;
		if (dx > 2 || dy > 2) out.push(String(e.className || e.tagName).slice(0, 50) + ` (+${dx}x +${dy}) «` + e.innerText.replace(/\s+/g, " ").trim().slice(0, 40) + "»");
	}
	return { overflowX: document.documentElement.scrollWidth - innerWidth, clipped: out.slice(0, 15) };
}

/* resumable: the local stack can die mid-run (cloudflare/workers-sdk#15317), so each page is saved as it
   is measured and a re-run on the same commit skips what is already there */
const OUT = join(HERE, "sweep.json");
const prior = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
const results = prior?.sha === SHA ? prior.results : [];
const save = () => writeFileSync(OUT, JSON.stringify({ sha: SHA, base: BASE, sample: SAMPLE, results }, null, "\t") + "\n");
const browser = await chromium.launch();
for (const s of SAMPLE) {
	if (results.some((r) => r.path === s.path)) continue;
	const row = { ...s };
	for (const [view, opts] of [["1440", { viewport: { width: 1440, height: 900 } }], ["390", devices["iPhone 13"]]]) {
		const ctx = await browser.newContext(opts);
		const page = await ctx.newPage();
		const res = await page.goto(BASE + s.path, { waitUntil: "load", timeout: 60_000 });
		row.status = res.status();
		await page.evaluate(() => document.fonts.ready.then(() => true));
		if (view === "1440") Object.assign(row, await page.evaluate(inPage));
		await page.waitForTimeout(6500);
		row[`moving@6.5s_${view}`] = await page.evaluate(stillMoving);
		await page.addStyleTag({ content: SPACING });
		await page.waitForTimeout(300);
		row[`spacing_${view}`] = await page.evaluate(clipped);
		await ctx.close();
	}
	/* 1.3.4 — a landscape phone */
	const land = await browser.newContext({ ...devices["iPhone 13 landscape"] });
	const lp = await land.newPage();
	await lp.goto(BASE + s.path, { waitUntil: "load", timeout: 60_000 });
	row.landscapeOverflowX = await lp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
	await land.close();
	results.push(row);
	save();
	console.log(`${String(row.status).padEnd(4)} ${s.path}`);
}
await browser.close();
save();
console.log(`sweep.json: ${results.length} pages, random part ${RANDOM.join(" ")}`);
