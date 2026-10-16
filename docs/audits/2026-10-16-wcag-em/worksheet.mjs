#!/usr/bin/env node
/**
 * Evidence for the worksheet of the WCAG-EM evaluation of 2026-10-16 (#505): what a person needs on the table
 * to judge the criteria no machine decides. Writes `worksheet.json` beside it. It decides nothing — the
 * judgements are in README.md, marked as the preparer's, for the evaluator of record to confirm.
 *
 *   node docs/audits/2026-10-16-wcag-em/worksheet.mjs [base-url]   default :8787
 *
 * The accessibility tree (Playwright's ARIA snapshot) is a proxy for a screen reader's reading, not a
 * screen reader: it shows what is exposed and in which order, not how VoiceOver or TalkBack speak it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || "http://localhost:8787").replace(/\/$/, "");
const sample = JSON.parse(readFileSync(join(HERE, "sweep.json"), "utf8")).sample.map((s) => s.path);
const READ = ["/", "/cdn-waf-seguridad-edge-cloudflare", "/contacto", "/accesibilidad", "/search?q=cloudflare"];

/* Words of each language that are not also words of the other: a block of Spanish page text with several of
   the English ones and few of the Spanish is a passage in English (3.1.2) */
const EN = new Set("the of and to is that with for are this from by have which we our your you it be not".split(" "));
const ES = new Set("el la los las de del y que con para por una un es son se su sus nuestro nuestra".split(" "));
/* Instructions that lean on a sense, a shape or a position (1.3.3) */
const SENSORY = /\b(arriba|abajo|a la (izquierda|derecha)|el (botón|bot[oó]n) (verde|rojo|azul|naranja)|redond|cuadrad|above|below|on the (left|right)|(green|red|blue|orange) button|round|square)\b/i;

const browser = await chromium.launch();
const out = { base: BASE, pages: {} };
for (const path of sample) {
	const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
	await page.goto(BASE + path, { waitUntil: "load", timeout: 60_000 });
	await page.evaluate(() => document.fonts.ready.then(() => true));
	const row = await page.evaluate(({ EN, ES, sensory }) => {
		const en = new Set(EN), es = new Set(ES), re = new RegExp(sensory, "i");
		const shown = (e) => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === "none" || c.visibility === "hidden") return false; } return true; };
		const text = (e) => (e.innerText || "").replace(/\s+/g, " ").trim();
		const name = (e) => (e.getAttribute("aria-label") || text(e) || e.querySelector("img")?.alt || "").trim();
		const imgs = [...document.querySelectorAll("img")].filter((i) => !i.closest("[aria-hidden='true']")).map((i) => ({ alt: i.alt, src: (i.currentSrc || i.src).split("/").pop().split("?")[0].slice(0, 60) }));
		const headings = [...document.querySelectorAll("main h1, main h2, main h3, main h4, h1")].filter(shown).map((h) => `${h.tagName} ${text(h).slice(0, 90)}`);
		const links = [...document.querySelectorAll("main a[href], .s-hero a[href]")].filter(shown).map((a) => ({ name: name(a).slice(0, 70), href: a.getAttribute("href"), context: text(a.closest("p, li, figcaption, td") || a).slice(0, 140) }));
		const lang = document.documentElement.lang;
		const englishInSpanish = lang !== "es" ? [] : [...document.querySelectorAll("main p, main li, main blockquote, main figcaption, .s-hero p")].filter(shown).map(text).filter((t) => {
			const w = t.toLowerCase().match(/\p{L}+/gu) || [];
			const e = w.filter((x) => en.has(x)).length, s = w.filter((x) => es.has(x)).length;
			return e >= 3 && e > s;
		}).map((t) => t.slice(0, 160));
		const senses = [...document.querySelectorAll("main p, main li, .s-hero p")].filter(shown).map(text).filter((t) => re.test(t)).map((t) => t.slice(0, 160));
		const search = document.querySelector("form[role=search], .search-form");
		const searchInfo = search ? { label: (search.querySelector("label")?.innerText || search.querySelector("input")?.getAttribute("aria-label") || "").trim(), placeholder: search.querySelector("input")?.placeholder, status: text(document.querySelector("main") || document.body).slice(0, 400) } : null;
		return { lang, title: document.title, imgs, headings, links, englishInSpanish, sensory: senses, search: searchInfo };
	}, { EN: [...EN], ES: [...ES], sensory: SENSORY.source });
	if (READ.includes(path)) row.ariaTree = (await page.locator("body").ariaSnapshot()).split("\n").slice(0, 160).join("\n");
	out.pages[path] = row;
	await page.close();
	console.log(path);
}
await browser.close();
writeFileSync(join(HERE, "worksheet.json"), JSON.stringify(out, null, "\t") + "\n");
console.log(`worksheet.json: ${sample.length} pages`);
