// Shared by the verification scripts: open the home and pin one frame of its carousel.
//
// Two targets, one call:
// - the Claude Design delivery on the local mirror (`ns.js` drives its own clock and takes
//   `?t=<ms>&still=1`), and
// - the site itself (a local stack or the preview): its carousel runs on the CSS clock, so the
//   frame is pinned through the Web Animations API — every animation in the band and the
//   header's edge set to the same time and paused, which is what the site's own rail does.
//
// Frame f (0 = «nosotros», 1-6 the photographs) at `at` ms into the frame.
// STEP is the delivery's clock (its `ns.js` runs 6 s frames). The site's is read from its stylesheet
// (`--hero-cycle`, `--hero-step`), never restated here: it moved from 6 s to 8 s in #682.
const STEP = 6000;
const LEAD = 500; // every frame's animations are delayed by i * step - 0.5 s

// `--engine webkit` (or ENGINE=webkit) measures in Safari's engine through Playwright (#583); the default is the
// project's Puppeteer Chrome, unchanged.
const engine = () => { const i = process.argv.indexOf('--engine'); return (i > -1 ? process.argv[i + 1] : process.env.ENGINE) || 'chromium'; };
const target = () => process.env.U
	|| process.argv.slice(2).find((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--engine')
	|| 'http://localhost:8791/entregas/nosotros/Home%20-%20nosotros.html';

// The page the scripts drive. Chromium is Puppeteer's own page; any other engine gets the few calls the scripts make,
// with Puppeteer's signatures. Playwright fixes `isMobile` per context, so a viewport that changes it opens a new one.
async function launch(chromeArgs = []) {
	const name = engine();
	if (name === 'chromium') {
		const b = await require('puppeteer').launch({ headless: 'new', args: chromeArgs });
		return { page: await b.newPage(), close: () => b.close() };
	}
	const b = await require('playwright')[name].launch();
	let ctx, page, mobile = null;
	const wrap = {
		async setViewport(vp) {
			const size = { width: vp.width, height: vp.height };
			if (page && !!vp.isMobile === mobile) return page.setViewportSize(size);
			if (ctx) await ctx.close();
			mobile = !!vp.isMobile;
			ctx = await b.newContext({ viewport: size, isMobile: mobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor ?? 1 });
			page = await ctx.newPage();
		},
		goto: (url, o = {}) => page.goto(url, { ...o, waitUntil: o.waitUntil === 'networkidle2' ? 'networkidle' : o.waitUntil }),
		evaluate: (fn, arg) => page.evaluate(fn, arg),
		waitForFunction: (fn, o) => page.waitForFunction(fn, undefined, o),
		addStyleTag: (o) => page.addStyleTag(o),
		screenshot: ({ clip, type }) => page.screenshot({ clip, type }),
	};
	return { page: wrap, close: () => b.close() };
}

async function open(page, url) {
	await page.goto(url + (url.includes('?') ? '&' : '?') + 'r=' + Math.random(), { waitUntil: 'networkidle2', timeout: 90000 });
	await page.evaluate(() => document.fonts.ready.then(() => true));
}

async function pinFrame(page, url, f, at) {
	const mirror = /entregas/.test(url);
	if (mirror) {
		await open(page, url + '?v=a&t=' + (f * STEP + at) + '&still=1');
		await new Promise((r) => setTimeout(r, 700));
		return;
	}
	if (!(await page.evaluate(() => !!document.querySelector('.s-hero--home')).catch(() => false))) await open(page, url);
	// the photographs load after `load`; wait until every one of them is in
	await page.waitForFunction(() => {
		const imgs = [...document.querySelectorAll('.s-hero__photo')];
		return imgs.length && imgs.every((i) => !i.dataset.srcset && i.complete && i.naturalWidth > 0);
	}, { timeout: 60000 });
	await page.evaluate(([f, lead, at]) => {
		const ms = (name) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) * 1000;
		const t = ms('--hero-cycle') + f * ms('--hero-step') - lead + at;
		if (!Number.isFinite(t)) throw new Error('no --hero-cycle / --hero-step on the page to pin a frame on');
		const anims = [
			...document.querySelector('.s-hero').getAnimations({ subtree: true }),
			...(document.querySelector('.site-header')?.getAnimations() ?? []),
		];
		for (const a of anims) {
			a.pause();
			a.currentTime = t;
		}
	}, [f, LEAD, at]);
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
	await new Promise((r) => setTimeout(r, 300));
}

module.exports = { engine, target, launch, open, pinFrame, STEP };
