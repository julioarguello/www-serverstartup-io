#!/usr/bin/env node
/**
 * ci-check-engines.mjs — the openings in Safari's engine and on an Android profile (#583).
 *
 * Every other rendered gate runs Chromium alone. Two things on 2026-10-10 showed what that misses:
 *
 *   - The October home (#581) animates the title's tail colour and the card's height with `var()`
 *     inside `@keyframes`, a pattern the home rule had flagged as risky in some engine. It was
 *     checked by hand in Playwright WebKit, against the preview. Nothing re-checks it.
 *   - An Android phone showed the verticals' end state with no animation. Chromium on the Pixel 7
 *     profile with reduced motion reproduces it exactly: Android's "Remove animations", which some
 *     battery savers turn on, is `prefers-reduced-motion: reduce`, and #315 makes every opening start
 *     at its end. Intended — so it is asserted here as intended, and the next report of it can be
 *     told apart from a real failure in seconds.
 *
 * Three profiles — WebKit · iPhone 13, WebKit · Desktop Safari, Chromium · Pixel 7 — each in its own
 * browser, run side by side. On each:
 *
 *   H  the home (/, /en), on the real clock: the title's tail has three different colours on frames
 *      0, 1 and 2 (sampled mid-frame on the document's timeline), the card changes height between
 *      frames 0 and 1, and every stop of the rail is a button.
 *   V  every vertical (the seed's Spanish services): it reaches `is-playing`, then `is-done` within
 *      SCENE_BEATS.end of starting, plus a margin.
 *   R  reduced motion: every vertical starts `is-done`, nothing runs in the home's band, and no
 *      pause or replay is shown — there is nothing for it to stop.
 *
 * Before any of it, each profile must catch two planted defects: a stylesheet that freezes the
 * tail's colour, and a vertical whose scene script never arrives. A profile that misses either is
 * blind and the run exits 3 — as it does when an engine fails to launch.
 *
 * Exit: 0 green · 1 a defect · 3 blind (an engine missing, a plant not seen, the stack gone).
 *
 * Usage: node scripts/ci-check-engines.mjs [base-url]   default :8787
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices, webkit } from "playwright";
import { entryPath, readSeed } from "./lib/seed-routes.mjs";
import { stackDiagnosis } from "./lib/stack-probe.mjs";

const BASE = (process.argv[2] || "http://localhost:8787").replace(/\/$/, "");
const REPO = dirname(dirname(fileURLToPath(import.meta.url)));

const PROFILES = [
	{ name: "WebKit · iPhone 13", engine: webkit, device: "iPhone 13" },
	{ name: "WebKit · Desktop Safari", engine: webkit, device: "Desktop Safari" },
	{ name: "Chromium · Pixel 7", engine: chromium, device: "Pixel 7" },
];
const HOME = ["/", "/en"];
const VERTICALS = readSeed()
	.content.services.filter((e) => e.locale !== "en")
	.map((e) => entryPath("services", e))
	.sort();
/* the openings' one clock, read where it is declared rather than restated */
const BEATS = readFileSync(join(REPO, "src", "utils", "hero-art.ts"), "utf8").match(/SCENE_BEATS\s*=\s*\{([^}]*)\}/)[1];
const beat = (name) => Number(BEATS.match(new RegExp(`\\b${name}:\\s*(\\d+)`))[1]);
const END = beat("end");
/* the instant the copy-overlap check reads: just into the payoff, when the drawings and their labels are all out
   (the bridge is wired at drawn + 100, the elevation's photograph comes in at 5.6 s) */
const LABELS_OUT = beat("drawn") + 500;
const MARGIN = 4000;
const LANES = 3;

/* A page that cannot be reached is not a defect of the page: say what the stack was doing and exit blind.
   Top-level awaits reject outside `unhandledRejection`, so the run is wrapped below as well. */
async function blindOn(e) {
	console.error(String(e?.stack ?? e).split("\n").slice(0, 3).join("\n"));
	console.error(await stackDiagnosis(BASE).catch(() => "(stack probe failed)"));
	process.exit(3);
}
process.on("unhandledRejection", blindOn);

/* One browser per page. Chromium animates only the page it treats as shown, and a context of its own
   is not enough: two homes measured beside three verticals in one Chromium held the tail at its
   unanimated ink and the card at its static 660 px, while the same page alone animated (a93d377 found
   the same with Puppeteer). WebKit did not need it; one rule for every engine is simpler to trust. */
/* At most PAGES pages at once across the three profiles. Up to fifteen at a time (three profiles × two homes and
   three lanes) took `wrangler dev` down twice in one CI job — its ProxyWorker drops the runtime under concurrent
   load (cloudflare/workers-sdk#15317, #524) — and `ci-gate.mjs` reboots it only once. The a11y gate holds four
   lanes against the same stack and survives; this holds the same number. */
const PAGES = Math.max(1, Number(process.env.ENGINES_CONCURRENCY) || 4);
let open = 0;
const waiting = [];
async function slot(fn) {
	if (open >= PAGES) await new Promise((r) => waiting.push(r));
	open++;
	try {
		return await fn();
	} finally {
		open--;
		waiting.shift()?.();
	}
}
async function withPage(profile, opts, fn) {
	return slot(async () => {
		const browser = await profile.engine.launch();
		try {
			const ctx = await browser.newContext({ ...devices[profile.device], ...opts });
			return await fn(await ctx.newPage());
		} finally {
			await browser.close();
		}
	});
}

async function pool(items, n, fn) {
	const out = [];
	const queue = [...items];
	await Promise.all(Array.from({ length: n }, async () => {
		while (queue.length) out.push(await fn(queue.shift()));
	}));
	return out;
}

const plantStyle = (css) => `document.addEventListener("DOMContentLoaded", () => {
	const s = document.createElement("style");
	s.textContent = ${JSON.stringify(css)};
	document.head.append(s);
});`;

/** H — the problems found on one home route, and the tail's colour on frame 0 (what reduced motion must hold). */
async function home(page, route) {
	await page.goto(`${BASE}${route}?engines=${Date.now()}`, { waitUntil: "load", timeout: 60_000 });
	const step = await page.evaluate(() => {
		const cycle = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hero-cycle")) * 1000;
		return cycle / document.querySelectorAll(".s-hero__dots .s-hero__stop").length;
	});
	if (!(step > 0)) return { problems: [`${route}: no rail, or no --hero-cycle — the band is not there to measure`] };
	/* Sampled mid-frame on the tail animation's OWN clock — its iteration and progress, in frames — never on
	   the document's: on a loaded runner the band's animations start seconds after the timeline does, and
	   "9 s" on the document read frame 0 twice in WebKit (CI, #589). The band always opens on frame 0. */
	const frames = [];
	for (const f of [0, 1, 2]) {
		const reached = await page.waitForFunction((at) => {
			const t = document.querySelector(".ss-title__tail")?.getAnimations()[0]?.effect?.getComputedTiming();
			const n = document.querySelectorAll(".s-hero__dots .s-hero__stop").length;
			return !!t && t.progress !== null && ((t.currentIteration ?? 0) + t.progress) * n >= at;
		}, f + 0.5, { polling: 100, timeout: step + 30_000 }).catch(() => null);
		if (!reached) return { problems: [`${route}: the tail's colour never reached frame ${f} — it does not animate`] };
		frames.push(await page.evaluate(() => ({
			tail: getComputedStyle(document.querySelector(".ss-title__tail")).color,
			deck: Math.round(document.querySelector(".s-hero__deck").getBoundingClientRect().height),
		})));
	}
	const stops = await page.evaluate(() => [...document.querySelectorAll(".s-hero__dots .s-hero__stop")].map((s) => s.getAttribute("role") === "button" && s.tabIndex === 0));
	const problems = [];
	const tails = frames.map((x) => x.tail);
	if (new Set(tails).size !== 3) problems.push(`${route}: the tail's colour on frames 0/1/2 is ${tails.join(" / ")} — it should change on each`);
	if (frames[0].deck === frames[1].deck) problems.push(`${route}: the card stays ${frames[0].deck}px between frames 0 and 1 — it should change height`);
	if (!stops.length || stops.includes(false)) problems.push(`${route}: ${stops.filter((x) => !x).length} of ${stops.length} rail stops are not buttons`);
	return { problems, tail0: tails[0] };
}

/* O — the scene's own text against the copy's lines, mid-animation: what is painted (opacity read up the whole
   chain, so a label under a fade still counts) and not part of the copy, the epigraph or the controls. The copy's
   selectors are restated here on purpose — a check that imported the scenes' own list would agree with them by
   construction. At 1280 × 720 (Desktop Safari) the elevation's bubbles D and E stood behind the body (#547). */
function overlapsCopy() {
	const seen = (e) => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === "none" || c.visibility === "hidden" || +c.opacity < 0.05) return false; } return true; };
	const lines = (els) => els.flatMap((el) => [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).flatMap((n) => { const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()].filter((q) => q.width > 2); }));
	const band = document.querySelector(".s-hero--scene");
	const COPY = "h1, .s-hero__copy, .s-hero__body, .scene__epi, .s-hero__epigraph, figure, blockquote, .scene__ctl, .btn";
	const all = [...band.querySelectorAll("*")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
	const copy = lines(all.filter((e) => e.closest(".s-hero__copy, h1") && seen(e)));
	const btn = band.querySelector(".s-hero__copy .btn")?.getBoundingClientRect();
	if (btn) copy.push(btn);
	const out = [];
	for (const e of all.filter((x) => !x.closest(COPY) && seen(x))) for (const a of lines([e])) for (const c of copy) {
		const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
		if (w > 1 && h > 1) { out.push(`«${e.textContent.trim().slice(0, 20)}» on the copy at ${Math.round(a.left)},${Math.round(a.top)}`); break; }
	}
	return [...new Set(out)];
}

/** V — returns the problems found on one vertical, and how long its opening took. */
async function vertical(page, route, plant) {
	await page.goto(`${BASE}${route}?engines=${Date.now()}`, { waitUntil: "load", timeout: 60_000 });
	const started = await page.waitForFunction(() => {
		const h = document.querySelector(".s-hero--scene");
		return !h || h.classList.contains("is-playing") || h.classList.contains("is-done");
	}, null, { polling: 100, timeout: 5000 }).then(() => true, () => false);
	const scene = await page.evaluate(() => !!document.querySelector(".s-hero--scene"));
	if (!scene) return { problems: [`${route}: no opening scene on a vertical`] };
	if (!started) return { problems: [`${route}: the opening never started (no is-playing 5 s after load)`] };
	const t0 = await page.evaluate(() => performance.now());
	if (plant) await page.evaluate(() => {
		const h = document.querySelector(".s-hero--scene h1").getBoundingClientRect();
		const s = document.createElement("span");
		s.textContent = "PLANT";
		s.style.cssText = `position:fixed;left:${h.left + 4}px;top:${h.top + 4}px;color:#fff;z-index:9`;
		document.querySelector(".s-hero__stage").append(s);
	});
	/* just into the payoff, the labels all out (LABELS_OUT, from the openings' clock) */
	await page.waitForTimeout(LABELS_OUT);
	const onCopy = (await page.evaluate(overlapsCopy)).map((m) => `${route}: scene text ${m} (keep it off the copy: withhold it)`);
	const done = await page.waitForFunction(() => document.querySelector(".s-hero--scene").classList.contains("is-done"), null, { polling: 100, timeout: END + MARGIN })
		.then(() => true, () => false);
	const took = Math.round((await page.evaluate(() => performance.now())) - t0);
	return { problems: [...onCopy, ...(done ? [] : [`${route}: started but not is-done ${END + MARGIN} ms later`])], took };
}

/** R — reduced motion, on one route: the end state at once, nothing running, no controls; on the home, the tail in
    its frame-0 colour as the same profile drew it with motion. */
async function reduced(page, route, tail0) {
	await page.goto(`${BASE}${route}?engines=${Date.now()}`, { waitUntil: "load", timeout: 60_000 });
	await page.waitForTimeout(500);
	return page.evaluate(([route, tail0]) => {
		const problems = [];
		const band = document.querySelector(".s-hero--home") ?? document.querySelector(".s-hero--scene");
		if (!band) return [`${route}: no band`];
		if (band.classList.contains("s-hero--scene") && !band.classList.contains("is-done")) problems.push(`${route}: the opening does not start at its end`);
		const running = band.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length;
		if (running) problems.push(`${route}: ${running} animation(s) still running in the band`);
		const shown = [...document.querySelectorAll(".scene__ctl")].filter((c) => getComputedStyle(c).display !== "none").length;
		if (shown) problems.push(`${route}: a pause/replay control is shown with nothing to stop`);
		const tail = document.querySelector(".ss-title__tail");
		if (tail0 && tail && getComputedStyle(tail).color !== tail0) problems.push(`${route}: the tail is ${getComputedStyle(tail).color}, not frame 0's ${tail0} — the band does not hold its first frame`);
		return problems;
	}, [route, tail0]);
}

async function profileRun(p) {
	try {
		await (await p.engine.launch()).close();
	} catch (e) {
		return { p, blind: `${p.name}: the engine did not launch — ${String(e.message).split("\n")[0]} (npx playwright install --with-deps webkit chromium-headless-shell)` };
	}
	const t0 = Date.now();
	{
		/* the plants: both must be called, or this profile is not measuring anything */
		const [frozen, stalled, covered] = await Promise.all([
			withPage(p, {}, async (page) => {
				await page.addInitScript(plantStyle(".ss-title__tail { animation: none !important; }"));
				return (await home(page, "/")).problems;
			}),
			withPage(p, {}, async (page) => {
				await page.route(/\/_astro\/Hero[A-Za-z]+\.astro_astro_type_script/, (r) => r.abort());
				return (await vertical(page, VERTICALS[0])).problems;
			}),
			withPage(p, {}, async (page) => (await vertical(page, VERTICALS[0], true)).problems),
		]);
		const onCopy = covered.some((m) => m.includes("PLANT"));
		const seen = frozen.some((m) => m.includes("tail")) && stalled.some((m) => m.includes("never started")) && onCopy;
		if (!seen) return { p, blind: `${p.name}: a planted defect went unseen (frozen tail: ${frozen.length ? "seen" : "MISSED"}, scene script withheld: ${stalled.length ? "seen" : "MISSED"}, a label on the h1: ${onCopy ? "seen" : "MISSED"})` };

		const [homes, verticals] = await Promise.all([
			Promise.all(HOME.map((r) => withPage(p, {}, (page) => home(page, r)))),
			pool(VERTICALS, LANES, (r) => withPage(p, {}, (page) => vertical(page, r)).then((v) => ({ r, ...v }))),
		]);
		const tail0 = Object.fromEntries(HOME.map((r, i) => [r, homes[i].tail0]));
		const still = await pool([...HOME, ...VERTICALS], LANES, (r) => withPage(p, { reducedMotion: "reduce" }, (page) => reduced(page, r, tail0[r])));
		return {
			p,
			problems: [...homes.flatMap((h) => h.problems), ...verticals.flatMap((v) => v.problems), ...still.flat()],
			took: verticals.map((v) => v.took).filter(Boolean),
			seconds: Math.round((Date.now() - t0) / 1000),
		};
	}
}

const started = Date.now();
const runs = await Promise.all(PROFILES.map(profileRun)).catch(blindOn);
let blind = 0, bad = 0;
for (const r of runs) {
	if (r.blind) {
		blind++;
		console.error(`✗ BLIND ${r.blind}`);
		continue;
	}
	console.log(`${r.p.name} (${r.seconds} s): plants seen (frozen tail, withheld scene script, a label on the h1)`);
	const span = r.took.length ? `${Math.min(...r.took)}–${Math.max(...r.took)} ms` : "—";
	if (!r.problems.length) {
		console.log(`  ✓ home ${HOME.join(" ")}: the tail changes colour on frames 0/1/2, the card changes height, the rail's stops are buttons`);
		console.log(`  ✓ ${VERTICALS.length} verticals start and come to rest (${span} from is-playing to is-done; budget ${END + MARGIN} ms), no scene text on the copy mid-animation`);
		console.log(`  ✓ reduced motion — intended (#315): every opening starts at its end, the home holds its first frame, no pause shown`);
	}
	for (const m of r.problems) {
		bad++;
		console.error(`  ✗ ${m}`);
	}
}
console.log(`engines: ${PROFILES.length} profiles in ${Math.round((Date.now() - started) / 1000)} s`);
if (blind) process.exit(3);
if (bad) process.exit(1);
console.log(`✓ the home and ${VERTICALS.length} verticals behave the same in WebKit and on Android's Chromium, reduced motion included`);
