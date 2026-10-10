// Whether the card's box intersects the text boxes of the h1 and the lead, and whether the cube's
// drawing reaches any letter of the band, frame by frame, across short and narrow viewports
// (brief §9.6 and §9.7). Usage: node overlap-h.cjs [url]   (or U=<url>)
const p = require('puppeteer');
const { target, open, pinFrame } = require('./frame.cjs');
const U = target();
(async () => {
	const b = await p.launch({ headless: 'new' });
	const g = await b.newPage();
	let bad = 0;
	for (const [w, h] of [[1440, 620], [1366, 650], [1280, 560], [1280, 600], [1100, 600], [1024, 600], [1440, 900], [393, 852]]) {
		const mobile = w < 768;
		await g.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
		if (!/entregas/.test(U)) await open(g, U);
		let worst = 0, where = '', art = 0, artWhere = '';
		for (const f of [0, 1, 2, 3, 4, 5, 6]) {
			await pinFrame(g, U, f, 3000);
			const o = await g.evaluate(() => {
				const rs = (el) => {
					const out = [];
					const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
					for (let n = w.nextNode(); n; n = w.nextNode()) {
						if (!n.textContent.trim()) continue;
						const r = document.createRange();
						r.selectNodeContents(n);
						for (const x of r.getClientRects()) if (x.width > 2) out.push(x);
					}
					return out;
				};
				const shown = (el) => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && +cs.opacity > 0.05 && el.getClientRects().length; };
				const h = document.querySelector('.s-hero');
				const copy = [...rs(h.querySelector('h1')), ...[...h.querySelectorAll('.s-hero__copy p, .s-hero__kicker p, .s-hero__lead')].flatMap(rs)];
				const card = h.querySelector('.s-hero__card').getBoundingClientRect();
				const hit = (a, c) => { const x = Math.min(a.right, c.right) - Math.max(a.left, c.left), y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); return x > 0 && y > 0 ? y : 0; };
				let ov = 0;
				for (const t of copy) ov = Math.max(ov, hit(t, card));
				// the cube: its outline's box against every letter in the band that is on screen
				const mark = h.querySelector('.s-hero__seal, .ns-art .ns-dim');
				let artOv = 0;
				if (mark) {
					const m = mark.getBoundingClientRect();
					const letters = [h.querySelector('h1'), ...h.querySelectorAll('.s-hero__kicker p, .s-hero__item, .s-hero__verticals, .ns-index, .s-hero__stop-name')]
						.filter((el) => el && shown(el)).flatMap(rs);
					for (const t of letters) artOv = Math.max(artOv, hit(t, m));
				}
				return { ov, artOv };
			});
			if (o.ov > worst) { worst = o.ov; where = 'frame ' + f; }
			if (o.artOv > art) { art = o.artOv; artWhere = 'frame ' + f; }
		}
		if (worst || art) bad++;
		console.log(w + 'x' + h,
			worst ? 'OVERLAP ' + Math.round(worst) + 'px (' + where + ')' : 'card ok',
			'|', art ? 'CUBE ON A LETTER ' + Math.round(art) + 'px (' + artWhere + ')' : 'cube ok');
	}
	await b.close();
	process.exit(bad ? 1 : 0);
})();
