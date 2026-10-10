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
const STEP = 6000;
const LEAD = 500; // every frame's animations are delayed by i * step - 0.5 s

const target = () => process.env.U || process.argv[2] || 'http://localhost:8791/entregas/nosotros/Home%20-%20nosotros.html';

async function open(page, url) {
	await page.goto(url + (url.includes('?') ? '&' : '?') + 'r=' + Math.random(), { waitUntil: 'networkidle2', timeout: 90000 });
	await page.evaluate(() => document.fonts.ready);
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
	await page.evaluate((t) => {
		const anims = [
			...document.querySelector('.s-hero').getAnimations({ subtree: true }),
			...(document.querySelector('.site-header')?.getAnimations() ?? []),
		];
		for (const a of anims) {
			a.pause();
			a.currentTime = t;
		}
	}, 42000 + f * STEP - LEAD + at);
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
	await new Promise((r) => setTimeout(r, 300));
}

module.exports = { target, open, pinFrame, STEP };
